//go:build linux || darwin

package av

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

// TestClamAVCollectReadsContractFiles feeds Collect the exact file shapes the
// host tooling (scripts/clamav/trustalo-clamav-scan.sh + the VirusEvent hook)
// produces, and asserts only environment-independent fields — daemon state
// depends on the host running the tests and is covered by its own tri-state
// invariant.
func TestClamAVCollectReadsContractFiles(t *testing.T) {
	stateDir := t.TempDir()
	dbDir := t.TempDir()
	now := time.Date(2026, 7, 12, 12, 0, 0, 0, time.UTC)

	lastScan := `{
  "startedAt": "2026-07-12T10:14:35Z",
  "finishedAt": "2026-07-12T10:14:35Z",
  "exitCode": 1,
  "result": "infected",
  "infectedCount": 1,
  "scannedCount": null,
  "detections": [{"file":"/tmp/eicar.txt","signature":"Eicar-Signature"}]
}`
	events := `{"detectedAt":"2026-07-12T10:14:35Z","signature":"Eicar-Signature","file":"/tmp/eicar.txt","source":"scheduled"}` + "\n"
	if err := os.WriteFile(filepath.Join(stateDir, "last-scan.json"), []byte(lastScan), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(stateDir, "events.jsonl"), []byte(events), 0o644); err != nil {
		t.Fatal(err)
	}
	defs := filepath.Join(dbDir, "daily.cld")
	if err := os.WriteFile(defs, []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	defsAt := now.Add(-3 * time.Hour)
	if err := os.Chtimes(defs, defsAt, defsAt); err != nil {
		t.Fatal(err)
	}

	c := NewClamAV()
	c.stateDir = stateDir
	c.scanFile = filepath.Join(stateDir, "last-scan.json")
	c.eventsFile = filepath.Join(stateDir, "events.jsonl")
	c.dbDirs = []string{dbDir}
	c.now = func() time.Time { return now }

	st := c.Collect()
	if st.Product != "clamav" || !st.Installed {
		t.Fatalf("unexpected identity: %+v", st)
	}
	if st.LastScanResult != ScanInfected || st.InfectedCount != 1 || st.ScannedCount != nil {
		t.Errorf("scan fields: result=%q infected=%d scanned=%v", st.LastScanResult, st.InfectedCount, st.ScannedCount)
	}
	if st.LastScanAt != "2026-07-12T10:14:35Z" {
		t.Errorf("LastScanAt = %q", st.LastScanAt)
	}
	if st.DefinitionsAgeHours == nil || *st.DefinitionsAgeHours < 2.9 || *st.DefinitionsAgeHours > 3.1 {
		t.Errorf("DefinitionsAgeHours = %v, want ~3", st.DefinitionsAgeHours)
	}
	if len(st.RecentDetections) != 1 || st.RecentDetections[0].Signature != "Eicar-Signature" ||
		st.RecentDetections[0].Source != "scheduled" {
		t.Errorf("detections: %+v", st.RecentDetections)
	}
	for name, s := range map[string]State{"active": st.DaemonActive, "responsive": st.DaemonResponsive} {
		switch s {
		case Pass, Fail, Unknown:
		default:
			t.Errorf("daemon %s has invalid state %q", name, s)
		}
	}
}
