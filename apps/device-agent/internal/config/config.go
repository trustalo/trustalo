// Package config resolves agent configuration with precedence:
//
//	CLI flags (caller) > env vars > agent.config.json > build-time defaults
//
// Per-customer installers bake their API/Web URLs and default auth method via
// -ldflags "-X github.com/trustalo/trustalo/apps/device-agent/internal/config.DefaultAPIURL=...".
package config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// Build-time defaults (overridable via -ldflags -X). The zero-config dev
// values point at the local API/web dev ports.
var (
	DefaultAPIURL     = "http://localhost:15002"
	DefaultWebURL     = "http://localhost:15000"
	DefaultAuthMethod = "basic"
	Version           = "0.0.1-dev"
)

// DevCreds are convenience credentials read from the dev config file only.
// They are ignored in release builds (the daemon should sign in interactively
// or use an enrollment token baked by the installer).
type DevCreds struct {
	Email           string `json:"email"`
	Password        string `json:"password"`
	EnrollmentToken string `json:"enrollmentToken"`
}

type Config struct {
	APIURL                 string `json:"apiUrl"`
	WebURL                 string `json:"webUrl"`
	AuthMethod             string `json:"authMethod"` // basic | sso | token
	CheckInIntervalSeconds int    `json:"checkInIntervalSeconds"`
	// RequireAv marks this fleet as expecting managed endpoint protection:
	// when set, a check-in without a healthy AV product reports avHealth=fail
	// instead of leaving it undetermined.
	RequireAv bool `json:"requireAv"`
	// ExpectedAvProducts optionally narrows which products satisfy RequireAv
	// (e.g. ["clamav"]); empty means any detected product counts.
	ExpectedAvProducts []string `json:"expectedAvProducts"`
	Dev                DevCreds `json:"dev"`
}

// Load reads the optional config file at path, then overlays env vars.
func Load(path string) (Config, error) {
	cfg := Config{
		APIURL:                 DefaultAPIURL,
		WebURL:                 DefaultWebURL,
		AuthMethod:             DefaultAuthMethod,
		CheckInIntervalSeconds: 1800,
	}

	if path != "" {
		data, err := os.ReadFile(path)
		switch {
		case err == nil:
			if err := json.Unmarshal(data, &cfg); err != nil {
				return cfg, err
			}
		case !os.IsNotExist(err):
			return cfg, err
		}
	}

	overlay := func(env string, dst *string) {
		if v := strings.TrimSpace(os.Getenv(env)); v != "" {
			*dst = v
		}
	}
	overlay("TRUSTALO_API_URL", &cfg.APIURL)
	overlay("TRUSTALO_WEB_URL", &cfg.WebURL)
	overlay("TRUSTALO_AUTH_METHOD", &cfg.AuthMethod)
	overlay("TRUSTALO_AGENT_EMAIL", &cfg.Dev.Email)
	overlay("TRUSTALO_AGENT_PASSWORD", &cfg.Dev.Password)
	overlay("TRUSTALO_ENROLLMENT_TOKEN", &cfg.Dev.EnrollmentToken)
	if v := strings.TrimSpace(os.Getenv("TRUSTALO_REQUIRE_AV")); v != "" {
		cfg.RequireAv = v == "1" || strings.EqualFold(v, "true")
	}
	if v := strings.TrimSpace(os.Getenv("TRUSTALO_EXPECTED_AV_PRODUCTS")); v != "" {
		cfg.ExpectedAvProducts = nil
		for _, p := range strings.Split(v, ",") {
			if p = strings.TrimSpace(p); p != "" {
				cfg.ExpectedAvProducts = append(cfg.ExpectedAvProducts, p)
			}
		}
	}
	// Optional: shorten the heartbeat for local loop testing.
	if v := strings.TrimSpace(os.Getenv("TRUSTALO_CHECKIN_INTERVAL_SECONDS")); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			cfg.CheckInIntervalSeconds = n
		}
	}

	cfg.APIURL = strings.TrimRight(cfg.APIURL, "/")
	cfg.WebURL = strings.TrimRight(cfg.WebURL, "/")
	if cfg.CheckInIntervalSeconds <= 0 {
		cfg.CheckInIntervalSeconds = 1800
	}
	return cfg, nil
}

// Save persists the non-secret config (URLs, auth method, interval). It
// deliberately DROPS the `dev` credentials — the daemon should never write an
// email/password/token to disk; after a browser login it has a device
// credential instead.
func Save(path string, cfg Config) error {
	if path == "" {
		return nil
	}
	persisted := struct {
		APIURL                 string   `json:"apiUrl"`
		WebURL                 string   `json:"webUrl"`
		AuthMethod             string   `json:"authMethod"`
		CheckInIntervalSeconds int      `json:"checkInIntervalSeconds"`
		RequireAv              bool     `json:"requireAv"`
		ExpectedAvProducts     []string `json:"expectedAvProducts"`
	}{cfg.APIURL, cfg.WebURL, cfg.AuthMethod, cfg.CheckInIntervalSeconds, cfg.RequireAv, cfg.ExpectedAvProducts}

	data, err := json.MarshalIndent(persisted, "", "  ")
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return err
	}
	return os.WriteFile(path, data, 0o600)
}
