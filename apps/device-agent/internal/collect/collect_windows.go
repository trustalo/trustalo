//go:build windows

package collect

import (
	"os"
	"os/exec"
	"strings"
)

// Collect reads Windows posture via PowerShell / CIM. Some signals (BitLocker)
// need elevation; they report Unknown rather than failing when unreadable.
func Collect() (Posture, error) {
	host, _ := os.Hostname()
	return Posture{
		Hostname:  host,
		OSVersion: osVersion(),
		Raw:       map[string]any{"collector": "windows"},
		Signals: Signals{
			DiskEncryption: bitlocker(),
			Firewall:       firewall(),
			ScreenLock:     screenLock(),
			Antivirus:      defender(),
			AgentHealthy:   true,
		},
	}, nil
}

// HardwareID returns the machine UUID for re-enrollment detection.
func HardwareID() string {
	if out, err := ps(`(Get-CimInstance -ClassName Win32_ComputerSystemProduct).UUID`); err == nil && out != "" {
		return out
	}
	host, _ := os.Hostname()
	return host
}

func ps(command string) (string, error) {
	out, err := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command", command).Output()
	return strings.TrimSpace(string(out)), err
}

func osVersion() string {
	out, err := ps(`(Get-CimInstance Win32_OperatingSystem).Caption`)
	if err != nil || out == "" {
		return "Windows"
	}
	return out
}

func bitlocker() SignalState {
	out, err := ps(`try { (Get-BitLockerVolume -MountPoint $env:SystemDrive).ProtectionStatus } catch { 'ERR' }`)
	if err != nil {
		return Unknown
	}
	switch strings.TrimSpace(out) {
	case "On", "1":
		return Pass
	case "Off", "0":
		return Fail
	default:
		return Unknown
	}
}

func firewall() SignalState {
	// All firewall profiles (Domain/Private/Public) must be enabled to pass.
	out, err := ps(`(Get-NetFirewallProfile | Select-Object -ExpandProperty Enabled) -join ','`)
	if err != nil || out == "" {
		return Unknown
	}
	for _, s := range strings.Split(out, ",") {
		if !strings.EqualFold(strings.TrimSpace(s), "True") {
			return Fail
		}
	}
	return Pass
}

func screenLock() SignalState {
	out, err := ps(`(Get-ItemProperty 'HKCU:\Control Panel\Desktop' -Name ScreenSaverIsSecure -ErrorAction SilentlyContinue).ScreenSaverIsSecure`)
	if err != nil {
		return Unknown
	}
	switch strings.TrimSpace(out) {
	case "1":
		return Pass
	case "0":
		return Fail
	default:
		return Unknown
	}
}

func defender() SignalState {
	out, err := ps(`try { (Get-MpComputerStatus).AntivirusEnabled } catch { 'ERR' }`)
	if err != nil {
		return Unknown
	}
	switch strings.TrimSpace(out) {
	case "True":
		return Pass
	case "False":
		return Fail
	default:
		return Unknown
	}
}
