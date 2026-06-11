//go:build darwin

package collect

import (
	"runtime"
	"testing"
)

// TestCollectDarwin exercises the real macOS collector on the host running the
// tests. It asserts only invariants that hold on any Mac (no root required), so
// it is safe in CI on a macOS runner.
func TestCollectDarwin(t *testing.T) {
	p, err := Collect()
	if err != nil {
		t.Fatalf("Collect() error: %v", err)
	}
	if p.Raw["collector"] != "darwin" {
		t.Errorf("collector tag = %v, want darwin", p.Raw["collector"])
	}
	if p.Raw["arch"] != runtime.GOARCH {
		t.Errorf("arch = %v, want %v", p.Raw["arch"], runtime.GOARCH)
	}
	mem, ok := p.Raw["memoryBytes"].(uint64)
	if !ok || mem == 0 {
		t.Errorf("memoryBytes should be a positive uint64, got %v", p.Raw["memoryBytes"])
	}
	if total, ok := p.Raw["diskTotalBytes"].(uint64); !ok || total == 0 {
		t.Errorf("diskTotalBytes should be a positive uint64, got %v", p.Raw["diskTotalBytes"])
	}
	if p.OSVersion == "" {
		t.Error("OSVersion should not be empty on macOS")
	}
	// Signals must be one of the valid tri-state values.
	for name, s := range map[string]SignalState{
		"disk":     p.Signals.DiskEncryption,
		"firewall": p.Signals.Firewall,
		"lock":     p.Signals.ScreenLock,
		"av":       p.Signals.Antivirus,
	} {
		switch s {
		case Pass, Fail, Unknown:
		default:
			t.Errorf("signal %s has invalid state %q", name, s)
		}
	}
}
