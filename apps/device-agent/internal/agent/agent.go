// Package agent is the device-posture runtime: enroll once, then heartbeat
// signed posture check-ins. Shared by the daemon (cmd/agentd) and the menu-bar
// app (cmd/tray) so the loop, enrollment, and sign-in live in exactly one place.
package agent

import (
	"context"
	"errors"
	"fmt"
	"log"
	"runtime"
	"time"

	"github.com/trustalo/trustalo/apps/device-agent/internal/apiclient"
	"github.com/trustalo/trustalo/apps/device-agent/internal/authflow"
	"github.com/trustalo/trustalo/apps/device-agent/internal/collect"
	"github.com/trustalo/trustalo/apps/device-agent/internal/config"
	"github.com/trustalo/trustalo/apps/device-agent/internal/ipc"
	"github.com/trustalo/trustalo/apps/device-agent/internal/keystore"
	"github.com/trustalo/trustalo/apps/device-agent/internal/report"
)

// Agent owns the API client, credential store, and status file.
type Agent struct {
	cfg        config.Config
	client     *apiclient.Client
	store      keystore.Store
	statusPath string
}

func New(cfg config.Config, statusPath, credPath string) *Agent {
	return &Agent{
		cfg:        cfg,
		client:     apiclient.New(cfg.APIURL, cfg.WebURL),
		store:      keystore.NewFileStore(credPath),
		statusPath: statusPath,
	}
}

func (a *Agent) Config() config.Config { return a.cfg }

// IsEnrolled reports whether a device credential is already stored.
func (a *Agent) IsEnrolled() bool {
	_, err := a.store.Load()
	return err == nil
}

// OnStatus is fired whenever the live status changes (used by the tray to update
// its menu). nil = no callback.
type OnStatus func(ipc.Status)

// ErrRevoked is returned by Run when the server rejected the device as no
// longer valid (revoked / identity changed). The loop stops and the credential
// is cleared; the caller (tray/daemon) surfaces "sign in again".
var ErrRevoked = errors.New("device credential revoked; re-enrollment required")

// Run blocks: ensure enrolled, check in immediately, then heartbeat on the
// configured interval until ctx is cancelled. Returns the enrollment error if
// the device isn't signed in yet (the caller can offer "Sign in").
func (a *Agent) Run(ctx context.Context, onStatus OnStatus) error {
	cred, err := a.ensureEnrolled(ctx)
	if err != nil {
		a.publish(ipc.Status{Enrolled: false, LastError: err.Error(), AgentVersion: config.Version}, onStatus)
		return err
	}
	log.Printf("[agent] enrolled as device %s (keyId %d)", cred.DeviceID, cred.SecretKeyID)

	interval := a.cfg.CheckInIntervalSeconds
	next, err := a.checkIn(ctx, cred, onStatus)
	if a.revokedAfter(err, onStatus) {
		return ErrRevoked
	}
	if next > 0 {
		interval = next
	}
	ticker := time.NewTicker(time.Duration(interval) * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
			next, err := a.checkIn(ctx, cred, onStatus)
			if a.revokedAfter(err, onStatus) {
				return ErrRevoked
			}
			// Honor the tenant-configured cadence: a Settings change reaches
			// the agent on its next beat and re-paces the heartbeat live.
			if next > 0 && next != interval {
				log.Printf("[agent] check-in interval updated: %ds → %ds", interval, next)
				interval = next
				ticker.Reset(time.Duration(interval) * time.Second)
			}
		}
	}
}

// revokedAfter inspects a check-in error. On a FATAL device-auth rejection
// (revoked / identity changed / bad signature) it clears the local credential,
// publishes a signed-out status, and returns true so Run stops the loop — the
// agent sends no further requests until the user signs in again. Transient
// errors (network, 5xx, clock skew) return false: keep heartbeating + retrying.
func (a *Agent) revokedAfter(err error, onStatus OnStatus) bool {
	if !apiclient.IsRevoked(err) {
		return false
	}
	log.Printf("[agent] server rejected this device (%v) — clearing credential; sign in again", err)
	_ = a.store.Clear()
	a.publish(ipc.Status{
		Enrolled:     false,
		LastError:    "device access was revoked — sign in again",
		AgentVersion: config.Version,
	}, onStatus)
	return true
}

// CheckInOnce ensures enrollment and performs a single collect + check-in.
func (a *Agent) CheckInOnce(ctx context.Context) error {
	cred, err := a.ensureEnrolled(ctx)
	if err != nil {
		return err
	}
	_, err = a.checkIn(ctx, cred, nil)
	return err
}

// Login runs the browser sign-in (PKCE) and enrolls with the resulting JWT.
func (a *Agent) Login(ctx context.Context, openBrowser bool) (report.DeviceCredential, error) {
	token, err := authflow.Login(ctx, a.client, a.cfg.WebURL, openBrowser)
	if err != nil {
		return report.DeviceCredential{}, err
	}
	return a.enrollAndStore(ctx, token, a.enrollInput())
}

// checkIn performs one collect + signed report and publishes the resulting
// status. Returns the server's next-check-in cadence (seconds; 0 if unknown)
// and the check-in error (nil on success) so Run can both honor the
// tenant-configured interval and decide whether the error is fatal (revoked →
// stop) or transient (keep retrying).
func (a *Agent) checkIn(ctx context.Context, cred report.DeviceCredential, onStatus OnStatus) (int, error) {
	posture, err := collect.Collect()
	if err != nil {
		log.Printf("[agent] collect error: %v", err)
		return 0, nil // a local collection hiccup isn't an auth problem; skip this tick
	}
	st := ipc.Status{
		DeviceID:     cred.DeviceID,
		Enrolled:     true,
		LastCheckIn:  time.Now(),
		Signals:      signalsMap(posture.Signals),
		OSVersion:    posture.OSVersion,
		AgentVersion: config.Version,
	}
	res, err := a.client.CheckIn(ctx, cred, posture, config.Version)
	next := 0
	if err != nil {
		log.Printf("[agent] check-in error: %v", err)
		st.LastError = err.Error()
	} else {
		next = res.NextCheckInSeconds
		log.Printf("[agent] check-in ok: status=%s next=%ds evidence=%d disk=%s fw=%s lock=%s av=%s",
			res.Status, next, res.EvidenceCreated, posture.Signals.DiskEncryption, posture.Signals.Firewall,
			posture.Signals.ScreenLock, posture.Signals.Antivirus)
	}
	a.publish(st, onStatus)
	return next, err
}

func (a *Agent) publish(st ipc.Status, onStatus OnStatus) {
	if err := ipc.Write(a.statusPath, st); err != nil {
		log.Printf("[agent] status write error: %v", err)
	}
	if onStatus != nil {
		onStatus(st)
	}
}

func (a *Agent) ensureEnrolled(ctx context.Context) (report.DeviceCredential, error) {
	if cred, err := a.store.Load(); err == nil {
		return cred, nil
	} else if err != keystore.ErrNotFound {
		return report.DeviceCredential{}, err
	}

	in := a.enrollInput()
	switch a.cfg.AuthMethod {
	case "token":
		if a.cfg.Dev.EnrollmentToken == "" {
			return report.DeviceCredential{}, fmt.Errorf("authMethod=token requires an enrollment token")
		}
		enrolled, err := a.client.EnrollWithToken(ctx, a.cfg.Dev.EnrollmentToken, in)
		if err != nil {
			return report.DeviceCredential{}, err
		}
		return a.saveEnrolled(enrolled)
	case "basic":
		if a.cfg.Dev.Email == "" || a.cfg.Dev.Password == "" {
			return report.DeviceCredential{}, fmt.Errorf("authMethod=basic requires dev.email/password")
		}
		login, err := a.client.Login(ctx, a.cfg.Dev.Email, a.cfg.Dev.Password)
		if err != nil {
			return report.DeviceCredential{}, fmt.Errorf("login: %w", err)
		}
		return a.enrollAndStore(ctx, login.Token, in)
	case "browser", "sso":
		return report.DeviceCredential{}, fmt.Errorf(
			"not signed in — use \"Sign in\" (tray) or `trustalo-agentd login`")
	default:
		return report.DeviceCredential{}, fmt.Errorf("unsupported authMethod %q (basic|token|browser)", a.cfg.AuthMethod)
	}
}

func (a *Agent) enrollInput() apiclient.EnrollInput {
	posture, _ := collect.Collect()
	return apiclient.EnrollInput{
		Platform:     goosToPlatform(),
		Hostname:     posture.Hostname,
		HardwareID:   collect.HardwareID(),
		OSVersion:    posture.OSVersion,
		AgentVersion: config.Version,
	}
}

func (a *Agent) saveEnrolled(e apiclient.EnrollResult) (report.DeviceCredential, error) {
	cred := report.DeviceCredential{DeviceID: e.DeviceID, Secret: e.DeviceSecret, SecretKeyID: e.SecretKeyID}
	if err := a.store.Save(cred); err != nil {
		return report.DeviceCredential{}, fmt.Errorf("save credential: %w", err)
	}
	return cred, nil
}

func (a *Agent) enrollAndStore(
	ctx context.Context,
	token string,
	in apiclient.EnrollInput,
) (report.DeviceCredential, error) {
	e, err := a.client.EnrollWithJWT(ctx, token, in)
	if err != nil {
		return report.DeviceCredential{}, err
	}
	return a.saveEnrolled(e)
}

func signalsMap(s collect.Signals) map[string]string {
	pass := func(b bool) string {
		if b {
			return "pass"
		}
		return "fail"
	}
	return map[string]string{
		"diskEncryption": string(s.DiskEncryption),
		"firewall":       string(s.Firewall),
		"screenLock":     string(s.ScreenLock),
		"antivirus":      string(s.Antivirus),
		"agentHealthy":   pass(s.AgentHealthy),
	}
}

func goosToPlatform() string {
	switch runtime.GOOS {
	case "darwin":
		return "macos"
	case "windows":
		return "windows"
	default:
		return "linux"
	}
}
