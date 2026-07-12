package collect

import "github.com/trustalo/trustalo/apps/device-agent/internal/collect/av"

// collectAV runs this platform's endpoint-protection providers and records
// the extended posture keys: `avProducts` (detected product names),
// `avDetail` (the primary product's full Status), and `avHealth` (its
// tri-state health, omitted when undeterminable per putState convention).
// The statuses are returned so each platform can derive its core `antivirus`
// signal with its own semantics.
func collectAV(raw map[string]any) []av.Status {
	statuses, names := av.Snapshot(av.Providers())
	if len(names) > 0 {
		raw["avProducts"] = names
	}
	if primary, ok := av.Primary(statuses); ok {
		raw["avDetail"] = primary
		putState(raw, "avHealth", SignalState(av.Health(primary)))
	}
	return statuses
}

// baselineAV maps provider statuses to the legacy core-antivirus semantic
// used on Linux and macOS: Pass when any product's daemon is up, otherwise
// Unknown (absence of AV is not a hard fail on these platforms).
func baselineAV(statuses []av.Status) SignalState {
	return SignalState(av.Baseline(statuses))
}
