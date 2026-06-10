//go:build linux

package collect

import (
	"os"
	"os/exec"
	"strings"
)

// Collect reads Linux posture. Linux endpoints vary widely by distro/DE, so
// several signals are best-effort and report Unknown when not determinable.
func Collect() (Posture, error) {
	host, _ := os.Hostname()
	return Posture{
		Hostname:  host,
		OSVersion: osVersion(),
		Raw:       map[string]any{"collector": "linux"},
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
		if b, err := os.ReadFile(p); err == nil {
			if id := strings.TrimSpace(string(b)); id != "" {
				return id
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

func osVersion() string {
	if b, err := os.ReadFile("/etc/os-release"); err == nil {
		for _, line := range strings.Split(string(b), "\n") {
			if strings.HasPrefix(line, "PRETTY_NAME=") {
				return strings.Trim(strings.TrimPrefix(line, "PRETTY_NAME="), `"`)
			}
		}
	}
	return "Linux"
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
