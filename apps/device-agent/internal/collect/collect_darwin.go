//go:build darwin

package collect

import (
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"time"
)

// Collect reads macOS posture by shelling out to first-party tooling. Every
// command here runs as the LOGGED-IN USER — no sudo / root is required, so the
// agent works from a normal launchd user-agent or a foreground app.
func Collect() (Posture, error) {
	host, _ := os.Hostname()
	lockState, lockDelay := screenLockStatus()

	raw := map[string]any{"collector": "darwin"}
	darwinInventory(raw)
	if lockDelay >= 0 {
		raw["screenLockDelaySeconds"] = lockDelay
	}
	putState(raw, "autoUpdate", autoUpdateMac())
	putState(raw, "mdmEnrolled", mdmEnrolledMac())
	putState(raw, "gatekeeper", gatekeeperMac())
	putState(raw, "sip", sipMac())

	return Posture{
		Hostname:  host,
		OSVersion: macOSVersion(),
		Raw:       raw,
		Signals: Signals{
			DiskEncryption: fileVault(),
			Firewall:       firewall(),
			ScreenLock:     lockState,
			Antivirus:      antivirus(),
			AgentHealthy:   true,
		},
	}, nil
}

// HardwareID returns the stable IOPlatformUUID (machine GUID) for re-enrollment
// detection; falls back to the hostname.
func HardwareID() string {
	if v := iokitValue("IOPlatformUUID"); v != "" {
		return v
	}
	host, _ := os.Hostname()
	return host
}

// runCombined captures stdout+stderr. Some macOS tools (notably sysadminctl)
// print their result to stderr, which run()'s stdout-only capture would miss.
func runCombined(name string, args ...string) (string, error) {
	out, err := exec.Command(name, args...).CombinedOutput()
	return strings.TrimSpace(string(out)), err
}

func sysctl(key string) string {
	out, _ := run("/usr/sbin/sysctl", "-n", key)
	return out
}

// iokitValue pulls a single quoted property out of the IOPlatformExpertDevice
// node, e.g. IOPlatformUUID or IOPlatformSerialNumber. Readable without root.
func iokitValue(key string) string {
	out, err := run("/usr/sbin/ioreg", "-rd1", "-c", "IOPlatformExpertDevice")
	if err != nil {
		return ""
	}
	for _, line := range strings.Split(out, "\n") {
		if strings.Contains(line, key) {
			if parts := strings.Split(line, "\""); len(parts) >= 4 {
				return parts[3]
			}
		}
	}
	return ""
}

// darwinInventory fills the raw map with hardware / OS facts. Each source is an
// unprivileged read (sysctl, ioreg, sw_vers, uname, statfs).
func darwinInventory(raw map[string]any) {
	putStr(raw, "manufacturer", "Apple")
	putStr(raw, "model", sysctl("hw.model"))
	putStr(raw, "cpu", sysctl("machdep.cpu.brand_string"))
	if n, err := strconv.Atoi(sysctl("hw.logicalcpu")); err == nil {
		putInt(raw, "cpuCores", n)
	}
	if n, err := strconv.ParseUint(sysctl("hw.memsize"), 10, 64); err == nil {
		putU64(raw, "memoryBytes", n)
	}
	putStr(raw, "arch", runtime.GOARCH)
	if v, err := run("/usr/bin/sw_vers", "-buildVersion"); err == nil {
		putStr(raw, "osBuild", v)
	}
	if v, err := run("/usr/bin/uname", "-r"); err == nil {
		putStr(raw, "kernel", v)
	}
	putStr(raw, "serialNumber", iokitValue("IOPlatformSerialNumber"))
	if total, free := diskUsage(); total > 0 {
		putU64(raw, "diskTotalBytes", total)
		putU64(raw, "diskFreeBytes", free)
	}
	if boot, ok := parseKernBoottimeSec(sysctl("kern.boottime")); ok {
		if up := uptimeFromBoot(boot, time.Now().Unix()); up > 0 {
			raw["uptimeSeconds"] = up
		}
	}
}

func macOSVersion() string {
	v, err := run("/usr/bin/sw_vers", "-productVersion")
	if err != nil {
		return ""
	}
	return "macOS " + v
}

func fileVault() SignalState {
	out, err := run("/usr/bin/fdesetup", "status")
	if err != nil {
		return Unknown
	}
	switch {
	case strings.Contains(out, "FileVault is On"):
		return Pass
	case strings.Contains(out, "FileVault is Off"):
		return Fail
	default:
		return Unknown
	}
}

func firewall() SignalState {
	out, err := run("/usr/libexec/ApplicationFirewall/socketfilterfw", "--getglobalstate")
	if err != nil {
		return Unknown
	}
	low := strings.ToLower(out)
	switch {
	case strings.Contains(low, "enabled"):
		return Pass
	case strings.Contains(low, "disabled"):
		return Fail
	default:
		return Unknown
	}
}

// screenLockStatus returns the screen-lock signal AND the grace delay (seconds)
// before a password is required (-1 when unknown / not applicable).
//
// macOS 12+ removed the user-readable `com.apple.screensaver askForPassword`
// key, so the supported source is `sysadminctl -screenLock status`, which logs
// to STDERR (hence runCombined). It prints "screenLock delay is 300 seconds" /
// "...is immediate" when a password is required, or "screenLock is off".
func screenLockStatus() (SignalState, int) {
	if out, err := runCombined("/usr/sbin/sysadminctl", "-screenLock", "status"); err == nil && out != "" {
		low := strings.ToLower(out)
		if strings.Contains(low, "off") {
			return Fail, -1
		}
		if d, ok := parseScreenLockDelay(out); ok {
			return Pass, d
		}
	}
	// Legacy fallback: pre-macOS-12, or an MDM that still sets the old key.
	if out, err := run("/usr/bin/defaults", "read", "com.apple.screensaver", "askForPassword"); err == nil {
		if strings.TrimSpace(out) == "1" {
			return Pass, -1
		}
		return Fail, -1
	}
	return Unknown, -1
}

func antivirus() SignalState {
	// XProtect (built-in malware protection) ships on every modern macOS; treat
	// its presence as the baseline AV control. Gatekeeper + SIP are reported
	// separately as extended posture. Third-party EDR is a future signal.
	for _, p := range []string{
		"/Library/Apple/System/Library/CoreServices/XProtect.bundle",
		"/System/Library/CoreServices/XProtect.bundle",
	} {
		if _, err := os.Stat(p); err == nil {
			return Pass
		}
	}
	return Unknown
}

// autoUpdateMac reads whether automatic OS update checks are enabled. The
// SoftwareUpdate preferences live in /Library/Preferences and are world-
// readable, so `defaults read` works without elevation.
func autoUpdateMac() SignalState {
	out, err := run("/usr/bin/defaults", "read",
		"/Library/Preferences/com.apple.SoftwareUpdate", "AutomaticCheckEnabled")
	if err != nil {
		return Unknown
	}
	switch strings.TrimSpace(out) {
	case "1":
		return Pass
	case "0":
		return Fail
	}
	return Unknown
}

// mdmEnrolledMac reports whether the machine is enrolled in an MDM. `profiles
// status -type enrollment` is an unprivileged status query.
func mdmEnrolledMac() SignalState {
	out, err := runCombined("/usr/bin/profiles", "status", "-type", "enrollment")
	if err != nil {
		return Unknown
	}
	low := strings.ToLower(out)
	if i := strings.Index(low, "mdm enrollment:"); i >= 0 {
		rest := low[i:]
		switch {
		case strings.Contains(rest, "yes"):
			return Pass
		case strings.Contains(rest, "no"):
			return Fail
		}
	}
	return Unknown
}

// gatekeeperMac reports whether Gatekeeper assessment is enabled (`spctl
// --status`, unprivileged read).
func gatekeeperMac() SignalState {
	out, err := runCombined("/usr/sbin/spctl", "--status")
	if err != nil {
		return Unknown
	}
	low := strings.ToLower(out)
	switch {
	case strings.Contains(low, "assessments enabled"):
		return Pass
	case strings.Contains(low, "assessments disabled"):
		return Fail
	}
	return Unknown
}

// sipMac reports System Integrity Protection state (`csrutil status`,
// unprivileged read).
func sipMac() SignalState {
	out, err := runCombined("/usr/bin/csrutil", "status")
	if err != nil {
		return Unknown
	}
	low := strings.ToLower(out)
	switch {
	case strings.Contains(low, "enabled"):
		return Pass
	case strings.Contains(low, "disabled"):
		return Fail
	}
	return Unknown
}
