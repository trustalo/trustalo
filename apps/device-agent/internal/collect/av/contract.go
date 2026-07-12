package av

import (
	"encoding/json"
	"sort"
	"strings"
	"time"
)

// The Trustalo ClamAV host tooling (scripts/clamav/) writes two small
// machine-readable files the agent reads back on every check-in:
//
//	last-scan.json — one object describing the most recent scheduled scan
//	events.jsonl   — one JSON object per detection, appended by the clamd
//	                 VirusEvent hook and by the scan wrapper
//
// Parsing lives here, tag-free, so it is unit-testable on any platform.

// scanRecord mirrors last-scan.json.
type scanRecord struct {
	StartedAt     string  `json:"startedAt"`
	FinishedAt    string  `json:"finishedAt"`
	ExitCode      int     `json:"exitCode"`
	Result        string  `json:"result"`
	InfectedCount int     `json:"infectedCount"`
	ScannedCount  *uint64 `json:"scannedCount"`
	Detections    []struct {
		File      string `json:"file"`
		Signature string `json:"signature"`
	} `json:"detections"`
}

// parseScanRecord decodes last-scan.json, normalising the result to the known
// set (an unrecognised value becomes ScanUnknown rather than being trusted).
func parseScanRecord(data []byte) (scanRecord, error) {
	var rec scanRecord
	if err := json.Unmarshal(data, &rec); err != nil {
		return scanRecord{}, err
	}
	switch rec.Result {
	case ScanClean, ScanInfected, ScanError:
	default:
		rec.Result = ScanUnknown
	}
	return rec, nil
}

// applyScanRecord folds a parsed scan record into a Status: the recorded
// outcome stands unless it is older than MaxScanAgeHours, in which case the
// scheduled scan is considered missing (a dead timer must surface even when
// the last completed scan was clean).
func applyScanRecord(st *Status, rec scanRecord, now time.Time) {
	st.LastScanAt = rec.FinishedAt
	st.LastScanResult = rec.Result
	st.InfectedCount = rec.InfectedCount
	st.ScannedCount = rec.ScannedCount
	finished, err := time.Parse(time.RFC3339, rec.FinishedAt)
	if err != nil || now.Sub(finished).Hours() > MaxScanAgeHours {
		st.LastScanResult = ScanMissing
	}
}

// detectionWindow bounds how far back events.jsonl entries are reported;
// older detections have already been sent in earlier check-ins.
const detectionWindow = 7 * 24 * time.Hour

// parseEventsJSONL reads the detections log: one JSON object per line,
// malformed lines skipped, entries outside the window dropped, and at most
// maxRecentDetections newest entries returned (oldest first).
func parseEventsJSONL(data []byte, now time.Time) []Detection {
	// Non-nil so the check-in JSON always carries an array, never null.
	out := []Detection{}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		var d Detection
		if json.Unmarshal([]byte(line), &d) != nil || d.Signature == "" {
			continue
		}
		at, err := time.Parse(time.RFC3339, d.DetectedAt)
		if err != nil || now.Sub(at) > detectionWindow || at.After(now.Add(time.Hour)) {
			continue
		}
		if d.Source == "" {
			d.Source = "realtime"
		}
		out = append(out, d)
	}
	sort.SliceStable(out, func(i, j int) bool { return out[i].DetectedAt < out[j].DetectedAt })
	if len(out) > maxRecentDetections {
		out = out[len(out)-maxRecentDetections:]
	}
	return out
}
