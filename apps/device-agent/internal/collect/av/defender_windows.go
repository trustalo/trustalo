//go:build windows

package av

import (
	"encoding/json"
	"os/exec"
	"strings"
)

// Defender wraps Microsoft Defender via Get-MpComputerStatus (a standard-user
// query). One PowerShell round-trip fetched at Detect time serves Collect too.
type Defender struct {
	status *mpStatus
}

type mpStatus struct {
	AntivirusEnabled           *bool `json:"AntivirusEnabled"`
	RealTimeProtectionEnabled  *bool `json:"RealTimeProtectionEnabled"`
	AntivirusSignatureAgeHours *int  `json:"AntivirusSignatureAgeHours"`
}

func NewDefender() *Defender { return &Defender{} }

func (*Defender) Name() string { return "defender" }

// Detect queries Defender status; an error (service absent / cmdlet missing)
// means no usable Defender on this host — the same condition the original
// collector mapped to Unknown.
func (d *Defender) Detect() bool {
	out, err := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command",
		`try { Get-MpComputerStatus | Select-Object AntivirusEnabled,RealTimeProtectionEnabled,`+
			`@{n='AntivirusSignatureAgeHours';e={[int]$_.AntivirusSignatureAge.TotalHours}} | ConvertTo-Json -Compress } catch { '' }`,
	).Output()
	if err != nil {
		return false
	}
	text := strings.TrimSpace(string(out))
	if text == "" {
		return false
	}
	var st mpStatus
	if json.Unmarshal([]byte(text), &st) != nil || st.AntivirusEnabled == nil {
		return false
	}
	d.status = &st
	return true
}

func (d *Defender) Collect() Status {
	st := Status{
		Product:            "defender",
		Installed:          true,
		DaemonActive:       Unknown,
		DaemonResponsive:   Unknown,
		RealTimeProtection: Unknown,
		LastScanResult:     ScanUnknown,
		RecentDetections:   []Detection{},
	}
	if d.status == nil {
		return st
	}
	st.DaemonActive = boolState(d.status.AntivirusEnabled)
	st.RealTimeProtection = boolState(d.status.RealTimeProtectionEnabled)
	if d.status.AntivirusSignatureAgeHours != nil && *d.status.AntivirusSignatureAgeHours >= 0 {
		age := float64(*d.status.AntivirusSignatureAgeHours)
		st.DefinitionsAgeHours = &age
	}
	return st
}

func boolState(b *bool) State {
	switch {
	case b == nil:
		return Unknown
	case *b:
		return Pass
	default:
		return Fail
	}
}
