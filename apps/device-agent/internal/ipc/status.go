// Package ipc shares the agent's live status between the (possibly privileged)
// daemon and the unprivileged tray helper.
//
// v1 uses a small JSON status file the daemon writes atomically on each
// check-in and the tray polls. A unix-socket / named-pipe upgrade (for
// tray->daemon commands such as "check now") is a future enhancement; the file
// approach is dead-simple and fully cross-platform.
package ipc

import (
	"encoding/json"
	"os"
	"path/filepath"
	"time"
)

type Status struct {
	DeviceID     string            `json:"deviceId,omitempty"`
	Enrolled     bool              `json:"enrolled"`
	LastCheckIn  time.Time         `json:"lastCheckIn"`
	LastError    string            `json:"lastError,omitempty"`
	Signals      map[string]string `json:"signals,omitempty"`
	OSVersion    string            `json:"osVersion,omitempty"`
	AgentVersion string            `json:"agentVersion,omitempty"`
}

// DefaultPath is the conventional status-file location, shared by both the
// daemon (writer) and the tray (reader).
func DefaultPath() string {
	if dir, err := os.UserConfigDir(); err == nil {
		return filepath.Join(dir, "trustalo-agent", "status.json")
	}
	return "status.json"
}

// Write atomically replaces the status file (temp file + rename).
func Write(path string, s Status) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, 0o644); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}

// Read loads the status file; returns an error if the daemon hasn't written
// one yet (the tray treats that as "agent not running").
func Read(path string) (Status, error) {
	var s Status
	data, err := os.ReadFile(path)
	if err != nil {
		return s, err
	}
	return s, json.Unmarshal(data, &s)
}
