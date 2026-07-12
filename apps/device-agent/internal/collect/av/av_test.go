package av

import (
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func hours(v float64) *float64 { return &v }

func healthyStatus() Status {
	return Status{
		Product:             "clamav",
		Installed:           true,
		DaemonActive:        Pass,
		DaemonResponsive:    Pass,
		DefinitionsAgeHours: hours(2),
		LastScanResult:      ScanClean,
	}
}

func TestHealth(t *testing.T) {
	cases := []struct {
		name   string
		mutate func(*Status)
		want   State
	}{
		{"healthy", func(s *Status) {}, Pass},
		{"not installed", func(s *Status) { s.Installed = false }, Unknown},
		{"daemon inactive", func(s *Status) { s.DaemonActive = Fail; s.DaemonResponsive = Unknown }, Fail},
		{"daemon unresponsive wins over active unit", func(s *Status) { s.DaemonResponsive = Fail }, Fail},
		{"responsive wins over unknown unit state", func(s *Status) { s.DaemonActive = Unknown }, Pass},
		{"cannot show daemon runs at all", func(s *Status) { s.DaemonActive = Unknown; s.DaemonResponsive = Unknown }, Fail},
		{"definitions stale at threshold", func(s *Status) { s.DefinitionsAgeHours = hours(DefinitionsFreshHours) }, Fail},
		{"definitions just under threshold", func(s *Status) { s.DefinitionsAgeHours = hours(DefinitionsFreshHours - 0.1) }, Pass},
		{"definitions age unreadable is not a failure", func(s *Status) { s.DefinitionsAgeHours = nil }, Pass},
		{"scan missing", func(s *Status) { s.LastScanResult = ScanMissing }, Fail},
		{"scan errored", func(s *Status) { s.LastScanResult = ScanError }, Fail},
		{"scan state unknown is not a failure", func(s *Status) { s.LastScanResult = ScanUnknown }, Pass},
		{"infected scan still healthy", func(s *Status) { s.LastScanResult = ScanInfected; s.InfectedCount = 3 }, Pass},
	}
	for _, tc := range cases {
		st := healthyStatus()
		tc.mutate(&st)
		if got := Health(st); got != tc.want {
			t.Errorf("%s: Health() = %q, want %q", tc.name, got, tc.want)
		}
	}
}

func TestPrimary(t *testing.T) {
	sick := healthyStatus()
	sick.DaemonResponsive = Fail

	baseline := Status{Product: "xprotect", Installed: true, DaemonActive: Pass}

	if _, ok := Primary(nil); ok {
		t.Error("Primary(nil) should report not-found")
	}
	if got, ok := Primary([]Status{sick, baseline}); !ok || got.Product != "xprotect" {
		t.Errorf("Primary should prefer the healthy product, got %q ok=%v", got.Product, ok)
	}
	if got, ok := Primary([]Status{sick}); !ok || got.Product != "clamav" {
		t.Errorf("Primary should fall back to the first installed product, got %q ok=%v", got.Product, ok)
	}
	healthy := healthyStatus()
	if got, _ := Primary([]Status{healthy, baseline}); got.Product != "clamav" {
		t.Errorf("Primary should keep registry order among healthy products, got %q", got.Product)
	}
}

func TestBaseline(t *testing.T) {
	if got := Baseline(nil); got != Unknown {
		t.Errorf("Baseline(nil) = %q, want unknown", got)
	}
	down := Status{Installed: true, DaemonActive: Fail, DaemonResponsive: Fail}
	if got := Baseline([]Status{down}); got != Unknown {
		t.Errorf("Baseline(down) = %q, want unknown (absence-tolerant legacy semantic)", got)
	}
	up := Status{Installed: true, DaemonActive: Pass}
	if got := Baseline([]Status{down, up}); got != Pass {
		t.Errorf("Baseline(down, up) = %q, want pass", got)
	}
}

func TestSnapshotSetsProductName(t *testing.T) {
	statuses, names := Snapshot([]Provider{stubProvider{name: "stub", detected: true}})
	if len(statuses) != 1 || len(names) != 1 || names[0] != "stub" {
		t.Fatalf("Snapshot = %v %v", statuses, names)
	}
	if statuses[0].Product != "stub" {
		t.Errorf("Snapshot should default Product to the provider name, got %q", statuses[0].Product)
	}
	if statuses, names = Snapshot([]Provider{stubProvider{name: "stub"}}); len(statuses) != 0 || len(names) != 0 {
		t.Error("undetected providers must not be collected")
	}
}

type stubProvider struct {
	name     string
	detected bool
}

func (s stubProvider) Name() string    { return s.name }
func (s stubProvider) Detect() bool    { return s.detected }
func (s stubProvider) Collect() Status { return Status{Installed: true} }

func TestEnforcePolicy(t *testing.T) {
	t.Run("not required leaves posture untouched", func(t *testing.T) {
		raw := map[string]any{}
		EnforcePolicy(raw, false, nil)
		if _, ok := raw["avHealth"]; ok {
			t.Error("avHealth should stay absent when AV is not required")
		}
	})
	t.Run("required but nothing detected", func(t *testing.T) {
		raw := map[string]any{}
		EnforcePolicy(raw, true, nil)
		if raw["avHealth"] != "fail" {
			t.Errorf("avHealth = %v, want fail", raw["avHealth"])
		}
	})
	t.Run("passing allowed product stays passing", func(t *testing.T) {
		raw := map[string]any{"avHealth": "pass", "avDetail": Status{Product: "clamav"}}
		EnforcePolicy(raw, true, []string{"ClamAV"})
		if raw["avHealth"] != "pass" {
			t.Errorf("avHealth = %v, want pass (allow-list is case-insensitive)", raw["avHealth"])
		}
	})
	t.Run("passing but non-allowed product fails", func(t *testing.T) {
		raw := map[string]any{"avHealth": "pass", "avDetail": Status{Product: "xprotect"}}
		EnforcePolicy(raw, true, []string{"clamav"})
		if raw["avHealth"] != "fail" {
			t.Errorf("avHealth = %v, want fail", raw["avHealth"])
		}
	})
	t.Run("empty allow-list accepts any product", func(t *testing.T) {
		raw := map[string]any{"avHealth": "pass", "avDetail": Status{Product: "xprotect"}}
		EnforcePolicy(raw, true, nil)
		if raw["avHealth"] != "pass" {
			t.Errorf("avHealth = %v, want pass", raw["avHealth"])
		}
	})
}

func TestParseScanRecord(t *testing.T) {
	rec, err := parseScanRecord([]byte(`{
		"startedAt": "2026-07-12T01:00:00Z", "finishedAt": "2026-07-12T01:24:11Z",
		"exitCode": 1, "result": "infected", "infectedCount": 2, "scannedCount": 4321,
		"detections": [{"file": "/tmp/x", "signature": "Eicar-Signature"}]
	}`))
	if err != nil {
		t.Fatalf("parseScanRecord: %v", err)
	}
	if rec.Result != ScanInfected || rec.InfectedCount != 2 || *rec.ScannedCount != 4321 {
		t.Errorf("unexpected record: %+v", rec)
	}
	if rec, _ := parseScanRecord([]byte(`{"result": "weird"}`)); rec.Result != ScanUnknown {
		t.Errorf("unrecognised result should normalise to unknown, got %q", rec.Result)
	}
	if _, err := parseScanRecord([]byte(`not json`)); err == nil {
		t.Error("corrupt file should error")
	}
}

func TestApplyScanRecordStaleness(t *testing.T) {
	now := time.Date(2026, 7, 12, 12, 0, 0, 0, time.UTC)

	fresh := scanRecord{FinishedAt: now.Add(-2 * time.Hour).Format(time.RFC3339), Result: ScanClean}
	var st Status
	applyScanRecord(&st, fresh, now)
	if st.LastScanResult != ScanClean {
		t.Errorf("fresh scan result = %q, want clean", st.LastScanResult)
	}

	stale := scanRecord{FinishedAt: now.Add(-40 * time.Hour).Format(time.RFC3339), Result: ScanClean}
	st = Status{}
	applyScanRecord(&st, stale, now)
	if st.LastScanResult != ScanMissing {
		t.Errorf("stale scan result = %q, want missing (dead timer must surface)", st.LastScanResult)
	}
	if st.LastScanAt == "" {
		t.Error("LastScanAt should still report the recorded time for a stale scan")
	}

	unparsable := scanRecord{FinishedAt: "yesterday-ish", Result: ScanClean}
	st = Status{}
	applyScanRecord(&st, unparsable, now)
	if st.LastScanResult != ScanMissing {
		t.Errorf("unparsable finishedAt = %q, want missing", st.LastScanResult)
	}
}

func TestParseEventsJSONL(t *testing.T) {
	now := time.Date(2026, 7, 12, 12, 0, 0, 0, time.UTC)
	lines := `
{"detectedAt": "2026-07-12T09:15:00Z", "signature": "Eicar-Signature", "file": "/home/u/e.txt"}
garbage line
{"detectedAt": "2026-06-01T00:00:00Z", "signature": "TooOld", "file": "/x"}
{"detectedAt": "2026-07-11T09:15:00Z", "signature": "Sched", "file": "/y", "source": "scheduled"}
{"signature": "NoTimestamp", "file": "/z"}
`
	got := parseEventsJSONL([]byte(lines), now)
	if len(got) != 2 {
		t.Fatalf("parseEventsJSONL returned %d detections, want 2: %+v", len(got), got)
	}
	if got[0].Signature != "Sched" || got[0].Source != "scheduled" {
		t.Errorf("oldest-first ordering / source passthrough broken: %+v", got[0])
	}
	if got[1].Signature != "Eicar-Signature" || got[1].Source != "realtime" {
		t.Errorf("missing source should default to realtime: %+v", got[1])
	}
}

func TestParseEventsJSONLNeverNil(t *testing.T) {
	// A nil slice would marshal as JSON null and break payload consumers that
	// expect an array — the contract is "always an array".
	now := time.Date(2026, 7, 12, 12, 0, 0, 0, time.UTC)
	got := parseEventsJSONL([]byte("garbage only\n"), now)
	if got == nil {
		t.Fatal("parseEventsJSONL must return a non-nil slice")
	}
	b, err := json.Marshal(Status{RecentDetections: got})
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if !strings.Contains(string(b), `"recentDetections":[]`) {
		t.Errorf("empty detections must serialise as [], got %s", b)
	}
}

func TestParseEventsJSONLCap(t *testing.T) {
	now := time.Date(2026, 7, 12, 12, 0, 0, 0, time.UTC)
	var data []byte
	for i := 0; i < 25; i++ {
		at := now.Add(-time.Duration(25-i) * time.Minute).Format(time.RFC3339)
		data = append(data, []byte(`{"detectedAt": "`+at+`", "signature": "S", "file": "/f"}`+"\n")...)
	}
	got := parseEventsJSONL(data, now)
	if len(got) != maxRecentDetections {
		t.Fatalf("cap: got %d, want %d", len(got), maxRecentDetections)
	}
	if got[len(got)-1].DetectedAt != now.Add(-time.Minute).Format(time.RFC3339) {
		t.Error("cap should keep the newest detections")
	}
}
