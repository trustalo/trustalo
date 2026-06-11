//go:build windows

package collect

import (
	"encoding/json"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

// Collect reads Windows posture via PowerShell / CIM. Some signals (BitLocker)
// need elevation; they report Unknown rather than failing when unreadable.
// Inventory + the extended posture signals below are all standard-user reads —
// no admin required.
func Collect() (Posture, error) {
	host, _ := os.Hostname()

	raw := map[string]any{"collector": "windows"}
	windowsInventory(raw)
	putState(raw, "autoUpdate", autoUpdateWin())
	putState(raw, "mdmEnrolled", mdmEnrolledWin())

	return Posture{
		Hostname:  host,
		OSVersion: osVersion(),
		Raw:       raw,
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

type winInventory struct {
	Model          string `json:"model"`
	Manufacturer   string `json:"manufacturer"`
	SerialNumber   string `json:"serialNumber"`
	CPU            string `json:"cpu"`
	CPUCores       int    `json:"cpuCores"`
	MemoryBytes    int64  `json:"memoryBytes"`
	OSBuild        string `json:"osBuild"`
	Kernel         string `json:"kernel"`
	UptimeSeconds  int64  `json:"uptimeSeconds"`
	DiskTotalBytes int64  `json:"diskTotalBytes"`
	DiskFreeBytes  int64  `json:"diskFreeBytes"`
}

// One CIM round-trip returns the whole inventory as JSON, minimising process
// spawns. Every class queried here is readable by a standard user.
const winInventoryScript = `$ErrorActionPreference='SilentlyContinue'
$cs=Get-CimInstance Win32_ComputerSystem
$os=Get-CimInstance Win32_OperatingSystem
$bios=Get-CimInstance Win32_BIOS
$cpu=Get-CimInstance Win32_Processor | Select-Object -First 1
$disk=Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$env:SystemDrive'"
[pscustomobject]@{
 model=$cs.Model
 manufacturer=$cs.Manufacturer
 serialNumber=$bios.SerialNumber
 cpu=$cpu.Name
 cpuCores=[int]$cpu.NumberOfLogicalProcessors
 memoryBytes=[int64]$cs.TotalPhysicalMemory
 osBuild=[string]$os.BuildNumber
 kernel=[string]$os.Version
 uptimeSeconds=[int64]((Get-Date)-$os.LastBootUpTime).TotalSeconds
 diskTotalBytes=[int64]$disk.Size
 diskFreeBytes=[int64]$disk.FreeSpace
} | ConvertTo-Json -Compress`

func windowsInventory(raw map[string]any) {
	putStr(raw, "arch", runtime.GOARCH)
	out, err := ps(winInventoryScript)
	if err != nil || out == "" {
		return
	}
	var inv winInventory
	if json.Unmarshal([]byte(out), &inv) != nil {
		return
	}
	putStr(raw, "model", inv.Model)
	putStr(raw, "manufacturer", inv.Manufacturer)
	putStr(raw, "serialNumber", inv.SerialNumber)
	putStr(raw, "cpu", inv.CPU)
	putInt(raw, "cpuCores", inv.CPUCores)
	if inv.MemoryBytes > 0 {
		raw["memoryBytes"] = inv.MemoryBytes
	}
	putStr(raw, "osBuild", inv.OSBuild)
	putStr(raw, "kernel", inv.Kernel)
	if inv.UptimeSeconds > 0 {
		raw["uptimeSeconds"] = inv.UptimeSeconds
	}
	if inv.DiskTotalBytes > 0 {
		raw["diskTotalBytes"] = inv.DiskTotalBytes
		raw["diskFreeBytes"] = inv.DiskFreeBytes
	}
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

// autoUpdateWin reads the Windows Update notification level via the AutoUpdate
// COM object (readable by a standard user). 3 = auto-download, 4 = auto-install
// → Pass; 1 = disabled, 2 = notify-only → Fail.
func autoUpdateWin() SignalState {
	out, err := ps(`try { (New-Object -ComObject Microsoft.Update.AutoUpdate).Settings.NotificationLevel } catch { '' }`)
	if err != nil {
		return Unknown
	}
	switch strings.TrimSpace(out) {
	case "3", "4":
		return Pass
	case "1", "2":
		return Fail
	}
	return Unknown
}

// mdmEnrolledWin reports whether the device is Azure-AD/domain joined or MDM
// enrolled, from `dsregcmd /status` (a standard-user diagnostic).
func mdmEnrolledWin() SignalState {
	out, err := exec.Command("dsregcmd", "/status").Output()
	if err != nil {
		return Unknown
	}
	low := strings.ToLower(string(out))
	if strings.Contains(low, "azureadjoined : yes") ||
		strings.Contains(low, "domainjoined : yes") ||
		strings.Contains(low, "enterprisejoined : yes") {
		return Pass
	}
	for _, line := range strings.Split(low, "\n") {
		l := strings.TrimSpace(line)
		if strings.HasPrefix(l, "mdmurl") {
			if i := strings.Index(l, ":"); i >= 0 && strings.TrimSpace(l[i+1:]) != "" {
				return Pass
			}
		}
	}
	return Fail
}
