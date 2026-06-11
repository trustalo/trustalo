//go:build darwin

package collect

import (
	"os"
	"os/exec"
	"strings"
)

// Collect reads macOS posture by shelling out to first-party tooling.
func Collect() (Posture, error) {
	host, _ := os.Hostname()
	return Posture{
		Hostname:  host,
		OSVersion: macOSVersion(),
		Raw:       map[string]any{"collector": "darwin"},
		Signals: Signals{
			DiskEncryption: fileVault(),
			Firewall:       firewall(),
			ScreenLock:     screenLock(),
			Antivirus:      antivirus(),
			AgentHealthy:   true,
		},
	}, nil
}

// HardwareID returns the stable IOPlatformUUID (machine GUID) for re-enrollment
// detection; falls back to the hostname.
func HardwareID() string {
	out, err := run("/usr/sbin/ioreg", "-rd1", "-c", "IOPlatformExpertDevice")
	if err == nil {
		for _, line := range strings.Split(out, "\n") {
			if strings.Contains(line, "IOPlatformUUID") {
				if parts := strings.Split(line, "\""); len(parts) >= 4 {
					return parts[3]
				}
			}
		}
	}
	host, _ := os.Hostname()
	return host
}

func run(name string, args ...string) (string, error) {
	out, err := exec.Command(name, args...).Output()
	return strings.TrimSpace(string(out)), err
}

// runCombined captures stdout+stderr. Some macOS tools (notably sysadminctl)
// print their result to stderr, which run()'s stdout-only capture would miss.
func runCombined(name string, args ...string) (string, error) {
	out, err := exec.Command(name, args...).CombinedOutput()
	return strings.TrimSpace(string(out)), err
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

func screenLock() SignalState {
	// macOS 12+ removed the user-readable `com.apple.screensaver askForPassword`
	// key (it "does not exist" on modern macOS, which is why this used to report
	// `unknown`). The supported source is `sysadminctl -screenLock status`, which
	// logs to STDERR — hence runCombined. It prints e.g. "screenLock delay is 300
	// seconds" / "...is immediate" when a password is required after lock, or
	// "screenLock is off" when it isn't.
	if out, err := runCombined("/usr/sbin/sysadminctl", "-screenLock", "status"); err == nil && out != "" {
		low := strings.ToLower(out)
		switch {
		case strings.Contains(low, "off"):
			return Fail
		case strings.Contains(low, "delay is"), strings.Contains(low, "immediate"):
			return Pass
		}
	}
	// Legacy fallback: pre-macOS-12, or an MDM that still sets the old key.
	if out, err := run("/usr/bin/defaults", "read", "com.apple.screensaver", "askForPassword"); err == nil {
		if strings.TrimSpace(out) == "1" {
			return Pass
		}
		return Fail
	}
	return Unknown
}

func antivirus() SignalState {
	// XProtect (built-in malware protection) ships on every modern macOS; treat
	// its presence as the baseline AV control. Third-party EDR is a future signal.
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
