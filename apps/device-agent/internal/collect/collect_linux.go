//go:build linux

package collect

import (
	"os"
	"runtime"
	"strings"
)

// Collect reads Linux posture. Linux endpoints vary widely by distro/DE, so
// several signals are best-effort and report Unknown when not determinable.
// Everything here is an unprivileged read — no root required. (Note: the DMI
// serial number at /sys/class/dmi/id/product_serial is root-only, so it is
// intentionally not collected.)
func Collect() (Posture, error) {
	host, _ := os.Hostname()

	raw := map[string]any{"collector": "linux"}
	linuxInventory(raw)
	putState(raw, "autoUpdate", autoUpdateLinux())

	return Posture{
		Hostname:  host,
		OSVersion: osVersion(),
		Raw:       raw,
		Signals: Signals{
			DiskEncryption: luks(),
			Firewall:       firewall(),
			ScreenLock:     screenLock(),
			Antivirus:      antivirus(),
			AgentHealthy:   true,
		},
	}, nil
}

// HardwareID prefers the stable machine-id, falling back to the DMI UUID.
func HardwareID() string {
	for _, p := range []string{"/etc/machine-id", "/var/lib/dbus/machine-id", "/sys/class/dmi/id/product_uuid"} {
		if id := readFileTrim(p); id != "" {
			return id
		}
	}
	host, _ := os.Hostname()
	return host
}

func readFileTrim(p string) string {
	b, err := os.ReadFile(p)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(b))
}

// linuxInventory fills the raw map from unprivileged /sys, /proc and statfs.
func linuxInventory(raw map[string]any) {
	putStr(raw, "manufacturer", readFileTrim("/sys/class/dmi/id/sys_vendor"))
	putStr(raw, "model", readFileTrim("/sys/class/dmi/id/product_name"))
	if b, err := os.ReadFile("/proc/cpuinfo"); err == nil {
		putStr(raw, "cpu", parseCPUModel(string(b)))
	}
	putInt(raw, "cpuCores", runtime.NumCPU())
	if b, err := os.ReadFile("/proc/meminfo"); err == nil {
		if kb, ok := parseMemTotalKB(string(b)); ok {
			putU64(raw, "memoryBytes", kb*1024)
		}
	}
	putStr(raw, "arch", runtime.GOARCH)
	putStr(raw, "kernel", readFileTrim("/proc/sys/kernel/osrelease"))
	putStr(raw, "osBuild", osReleaseField("VERSION_ID"))
	if total, free := diskUsage(); total > 0 {
		putU64(raw, "diskTotalBytes", total)
		putU64(raw, "diskFreeBytes", free)
	}
	if b, err := os.ReadFile("/proc/uptime"); err == nil {
		if up, ok := parseProcUptimeSeconds(string(b)); ok && up > 0 {
			raw["uptimeSeconds"] = up
		}
	}
}

func osVersion() string {
	if v := osReleaseField("PRETTY_NAME"); v != "" {
		return v
	}
	return "Linux"
}

func osReleaseField(key string) string {
	b, err := os.ReadFile("/etc/os-release")
	if err != nil {
		return ""
	}
	prefix := key + "="
	for _, line := range strings.Split(string(b), "\n") {
		if strings.HasPrefix(line, prefix) {
			return strings.Trim(strings.TrimPrefix(line, prefix), `"`)
		}
	}
	return ""
}

func luks() SignalState {
	// A block device of type "crypt" indicates LUKS encryption.
	out, err := run("lsblk", "-rno", "TYPE")
	if err != nil {
		return Unknown
	}
	for _, t := range strings.Fields(out) {
		if t == "crypt" {
			return Pass
		}
	}
	return Fail
}

func firewall() SignalState {
	if out, err := run("ufw", "status"); err == nil {
		if strings.Contains(strings.ToLower(out), "status: active") {
			return Pass
		}
		return Fail
	}
	if out, err := run("firewall-cmd", "--state"); err == nil {
		if strings.TrimSpace(out) == "running" {
			return Pass
		}
		return Fail
	}
	return Unknown
}

func screenLock() SignalState {
	// GNOME exposes lock-enabled; other DEs vary.
	if out, err := run("gsettings", "get", "org.gnome.desktop.screensaver", "lock-enabled"); err == nil {
		if strings.TrimSpace(out) == "true" {
			return Pass
		}
		return Fail
	}
	return Unknown
}

func antivirus() SignalState {
	// Best-effort: ClamAV daemon active. Many Linux hosts run no AV, so absence
	// is Unknown, not a hard fail.
	if out, err := run("systemctl", "is-active", "clamav-daemon"); err == nil && strings.TrimSpace(out) == "active" {
		return Pass
	}
	return Unknown
}

// autoUpdateLinux reports Pass when a recognised automatic-update unit is
// enabled. `systemctl is-enabled` is an unprivileged query. A disabled/absent
// unit is left Unknown (omitted) rather than Fail, since "no unit" and
// "explicitly disabled" can't be told apart reliably across distros.
func autoUpdateLinux() SignalState {
	for _, unit := range []string{"unattended-upgrades", "dnf-automatic.timer", "apt-daily-upgrade.timer"} {
		if out, err := run("systemctl", "is-enabled", unit); err == nil && strings.TrimSpace(out) == "enabled" {
			return Pass
		}
	}
	return Unknown
}
