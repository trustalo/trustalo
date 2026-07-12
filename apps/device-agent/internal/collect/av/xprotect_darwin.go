//go:build darwin

package av

import "os"

// xprotectBundles are the known locations of Apple's built-in malware
// protection across macOS versions.
var xprotectBundles = []string{
	"/Library/Apple/System/Library/CoreServices/XProtect.bundle",
	"/System/Library/CoreServices/XProtect.bundle",
}

// XProtect wraps macOS's built-in malware protection as a baseline provider.
// It is always-on when present (SIP prevents disabling it), so presence of
// the bundle is the whole probe — matching the original collector semantics.
type XProtect struct{}

func (XProtect) Name() string { return "xprotect" }

func (XProtect) Detect() bool {
	for _, p := range xprotectBundles {
		if _, err := os.Stat(p); err == nil {
			return true
		}
	}
	return false
}

func (XProtect) Collect() Status {
	return Status{
		Product:            "xprotect",
		Installed:          true,
		DaemonActive:       Pass, // ships enabled; SIP guards it
		DaemonResponsive:   Unknown,
		RealTimeProtection: Pass,
		LastScanResult:     ScanUnknown,
		RecentDetections:   []Detection{},
	}
}
