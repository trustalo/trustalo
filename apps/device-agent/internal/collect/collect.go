// Package collect gathers endpoint security posture. Platform-specific
// implementations live in collect_<goos>.go behind build tags; each provides
// Collect() and HardwareID() returning the same shapes.
package collect

// SignalState mirrors the server's PostureSignalState enum.
type SignalState string

const (
	Pass    SignalState = "pass"
	Fail    SignalState = "fail"
	Unknown SignalState = "unknown"
)

// Signals is the posture payload sent on each check-in.
type Signals struct {
	DiskEncryption SignalState `json:"diskEncryption"`
	Firewall       SignalState `json:"firewall"`
	ScreenLock     SignalState `json:"screenLock"`
	Antivirus      SignalState `json:"antivirus"`
	AgentHealthy   bool        `json:"agentHealthy"`
}

// Posture is one full reading of a device's state.
type Posture struct {
	OSVersion string         `json:"osVersion"`
	Hostname  string         `json:"hostname"`
	Signals   Signals        `json:"signals"`
	Raw       map[string]any `json:"raw,omitempty"`
}
