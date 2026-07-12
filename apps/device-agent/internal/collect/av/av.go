// Package av models endpoint-protection (antivirus) products behind a common
// Provider interface so every product reports the same shape. ClamAV is the
// first deep integration; XProtect (macOS) and Defender (Windows) wrap the
// platform baseline probes. Adding a product later (ESET, …) means one new
// provider file plus a registry entry — the check-in payload, the server-side
// `avHealth` signal, and the web UI stay unchanged.
package av

import "strings"

// State mirrors collect.SignalState ("pass" | "fail" | "unknown"). The av
// package keeps its own copy to stay import-cycle-free with package collect.
type State string

const (
	Pass    State = "pass"
	Fail    State = "fail"
	Unknown State = "unknown"
)

// Last-scan outcomes. Missing covers both "no scan recorded" and "the last
// recorded scan is too old to trust" — either way the scheduled scan isn't
// doing its job.
const (
	ScanClean    = "clean"
	ScanInfected = "infected"
	ScanError    = "error"
	ScanMissing  = "missing"
	ScanUnknown  = "unknown"
)

const (
	// DefinitionsFreshHours is the maximum age of signature databases before
	// the product counts as unhealthy (freshclam default cadence is hourly to
	// daily; 48h means roughly two missed days).
	DefinitionsFreshHours = 48.0
	// MaxScanAgeHours bounds how old the recorded scheduled scan may be. The
	// scan timer fires daily with up to an hour of jitter, so 36h tolerates a
	// long-running scan while still flagging a dead timer within a day.
	MaxScanAgeHours = 36.0
	// maxRecentDetections caps the detections carried in one check-in so the
	// posture blob stays small; the newest events win.
	maxRecentDetections = 10
)

// Detection is one malware hit, from the product's real-time hook or a
// scheduled scan. DetectedAt is RFC3339 UTC, passed through as recorded.
type Detection struct {
	DetectedAt string `json:"detectedAt"`
	Signature  string `json:"signature"`
	File       string `json:"file"`
	Source     string `json:"source"` // "realtime" | "scheduled"
}

// Status is the product-agnostic health reading reported as the `avDetail`
// posture key. Fields a product cannot determine stay at their zero /
// Unknown values and are treated as "no information", never as failures —
// except by Health, which requires a demonstrably running daemon.
type Status struct {
	Product            string `json:"product"`
	Installed          bool   `json:"installed"`
	DaemonActive       State  `json:"daemonActive"`
	DaemonResponsive   State  `json:"daemonResponsive"`
	RealTimeProtection State  `json:"realTimeProtection"`

	DefinitionsUpdatedAt string   `json:"definitionsUpdatedAt,omitempty"` // RFC3339
	DefinitionsAgeHours  *float64 `json:"definitionsAgeHours,omitempty"`

	LastScanAt     string  `json:"lastScanAt,omitempty"` // RFC3339
	LastScanResult string  `json:"lastScanResult"`       // clean|infected|error|missing|unknown
	InfectedCount  int     `json:"infectedCount"`
	ScannedCount   *uint64 `json:"scannedCount,omitempty"`

	RecentDetections []Detection `json:"recentDetections"`
}

// DaemonUp reports whether the product's engine is demonstrably running: a
// live protocol probe wins, otherwise the service state — but a determinate
// "not responding" always loses.
func (s Status) DaemonUp() bool {
	return s.DaemonResponsive == Pass || (s.DaemonResponsive != Fail && s.DaemonActive == Pass)
}

// Provider is one endpoint-protection product integration.
type Provider interface {
	// Name is the stable product id ("clamav", "xprotect", "defender", …).
	Name() string
	// Detect reports whether the product appears installed on this host.
	Detect() bool
	// Collect returns the product's current Status. Only called after Detect
	// returned true.
	Collect() Status
}

// Health reduces a Status to the tri-state `avHealth` signal. Infections do
// NOT fail the signal — a product that catches malware is doing its job; the
// server alerts on detections separately. Probes that could not read
// (Unknown) never fail a device, with one exception: an installed product
// whose daemon cannot be shown to run at all is Fail, because "installed but
// not running" is exactly the state central monitoring exists to catch.
func Health(s Status) State {
	if !s.Installed {
		return Unknown
	}
	if !s.DaemonUp() {
		return Fail
	}
	if s.DefinitionsAgeHours != nil && *s.DefinitionsAgeHours >= DefinitionsFreshHours {
		return Fail
	}
	if s.LastScanResult == ScanMissing || s.LastScanResult == ScanError {
		return Fail
	}
	return Pass
}

// Primary picks the Status to report as `avDetail`: the first healthy
// product, else the first installed one. ok is false when nothing was
// detected.
func Primary(statuses []Status) (Status, bool) {
	for _, s := range statuses {
		if Health(s) == Pass {
			return s, true
		}
	}
	for _, s := range statuses {
		if s.Installed {
			return s, true
		}
	}
	return Status{}, false
}

// Baseline is the legacy core-`antivirus` semantic shared by the Linux and
// macOS collectors: Pass when any detected product's daemon is up, otherwise
// Unknown (many hosts legitimately run no AV, so absence is not a failure).
func Baseline(statuses []Status) State {
	for _, s := range statuses {
		if s.DaemonUp() {
			return Pass
		}
	}
	return Unknown
}

// Snapshot runs every registered provider and returns the detected products'
// statuses plus their names (for the `avProducts` posture key).
func Snapshot(providers []Provider) ([]Status, []string) {
	var statuses []Status
	var names []string
	for _, p := range providers {
		if !p.Detect() {
			continue
		}
		st := p.Collect()
		if st.Product == "" {
			st.Product = p.Name()
		}
		statuses = append(statuses, st)
		names = append(names, p.Name())
	}
	return statuses, names
}

// EnforcePolicy applies the fleet's AV expectation to a collected posture:
// when the config requires endpoint protection, `avHealth` must be a passing
// reading from an allow-listed product (empty allow-list = any product), and
// anything else — including "no product detected at all" — is downgraded to
// an explicit fail so the server can evaluate it.
func EnforcePolicy(raw map[string]any, require bool, expectedProducts []string) {
	if !require || raw == nil {
		return
	}
	health, _ := raw["avHealth"].(string)
	product := ""
	if st, ok := raw["avDetail"].(Status); ok {
		product = st.Product
	}
	if health == string(Pass) && productAllowed(product, expectedProducts) {
		return
	}
	raw["avHealth"] = string(Fail)
}

func productAllowed(product string, expected []string) bool {
	if len(expected) == 0 {
		return true
	}
	for _, e := range expected {
		if strings.EqualFold(strings.TrimSpace(e), product) {
			return true
		}
	}
	return false
}
