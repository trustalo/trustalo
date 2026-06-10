// Package keystore persists the durable per-device credential.
//
// The dev implementation is a 0600 JSON file. Production builds will provide
// an OS-keychain-backed Store (macOS Keychain / Windows Credential Manager /
// Linux Secret Service) behind this same interface.
package keystore

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"

	"github.com/trustalo/trustalo/apps/device-agent/internal/report"
)

// ErrNotFound means no credential has been stored yet (device not enrolled).
var ErrNotFound = errors.New("device credential not found")

type Store interface {
	Load() (report.DeviceCredential, error)
	Save(report.DeviceCredential) error
	Clear() error
}

type fileStore struct{ path string }

// NewFileStore returns a Store backed by a 0600 JSON file at path.
func NewFileStore(path string) Store { return &fileStore{path: path} }

func (s *fileStore) Load() (report.DeviceCredential, error) {
	var c report.DeviceCredential
	data, err := os.ReadFile(s.path)
	if err != nil {
		if os.IsNotExist(err) {
			return c, ErrNotFound
		}
		return c, err
	}
	if err := json.Unmarshal(data, &c); err != nil {
		return c, err
	}
	if c.DeviceID == "" || c.Secret == "" {
		return c, ErrNotFound
	}
	return c, nil
}

func (s *fileStore) Save(c report.DeviceCredential) error {
	if err := os.MkdirAll(filepath.Dir(s.path), 0o700); err != nil {
		return err
	}
	data, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.path, data, 0o600)
}

func (s *fileStore) Clear() error {
	if err := os.Remove(s.path); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}
