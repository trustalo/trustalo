// Package authflow implements the device agent's browser sign-in: a PKCE
// device-authorization flow where the BROWSER owns the login (password or SSO)
// and a trustalo:// deep link hands a one-time code back to the waiting agent.
//
//	agentd login        starts a flow: PKCE + open browser + wait for the deep link
//	agentd handle-url U  the OS scheme handler — forwards U to the waiting login
//
// The browser→agent return is the custom trustalo:// scheme (registered with the
// OS). The handoff from the (newly launched) handle-url process to the (already
// running) login process is a loopback IPC channel whose address + a random
// token are written to a file in the agent config dir, so only a local process
// that can read that file can deliver a code.
package authflow

import (
	"bufio"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net"
	"net/url"
	"os"
	"path/filepath"
	"time"

	cryptorand "crypto/rand"

	"github.com/trustalo/trustalo/apps/device-agent/internal/apiclient"
	"github.com/trustalo/trustalo/apps/device-agent/internal/browser"
)

// RedirectURI is the deep link the browser sends the code back to. The OS routes
// it to `agentd handle-url`.
const RedirectURI = "trustalo://auth/callback"

const loginTimeout = 3 * time.Minute

// endpoint is the loopback IPC rendezvous the waiting login publishes for
// handle-url to find.
type endpoint struct {
	Addr  string `json:"addr"`
	Token string `json:"token"`
}

// wire is the payload handle-url delivers to the waiting login.
type wire struct {
	Code  string `json:"code"`
	State string `json:"state"`
	Token string `json:"token"`
}

// Login runs the full browser sign-in and returns a device JWT. It opens the
// browser to the web /device/authorize consent page and blocks until the OS
// deep-links the code back via `handle-url` (or a timeout / ctx cancel).
func Login(ctx context.Context, client *apiclient.Client, webURL string, openBrowser bool) (string, error) {
	verifier, challenge, err := pkcePair()
	if err != nil {
		return "", err
	}
	state, err := randToken(16)
	if err != nil {
		return "", err
	}

	// A friendlier prompt if we can name the provider (best-effort).
	if d, err := client.AuthConfig(ctx); err == nil && d.DisplayName != "" {
		log.Printf("[agent] signing in via %s (%s)", d.DisplayName, d.Kind)
	}

	// Loopback rendezvous for the handle-url → login handoff.
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return "", fmt.Errorf("ipc listen: %w", err)
	}
	defer ln.Close()
	ipcToken, err := randToken(16)
	if err != nil {
		return "", err
	}
	if err := writeEndpoint(endpoint{Addr: ln.Addr().String(), Token: ipcToken}); err != nil {
		return "", fmt.Errorf("publish ipc endpoint: %w", err)
	}
	defer removeEndpoint()

	authURL := fmt.Sprintf(
		"%s/device/authorize?state=%s&challenge=%s&redirect_uri=%s",
		webURL,
		url.QueryEscape(state),
		url.QueryEscape(challenge),
		url.QueryEscape(RedirectURI),
	)
	log.Printf("[agent] open this URL to sign in:\n\n    %s\n", authURL)
	if openBrowser {
		if err := browser.Open(authURL); err != nil {
			log.Printf("[agent] could not auto-open the browser (%v) — open the URL above manually", err)
		}
	}

	codeCh := make(chan wire, 1)
	errCh := make(chan error, 1)
	go acceptCode(ln, ipcToken, state, codeCh, errCh)

	select {
	case <-ctx.Done():
		return "", ctx.Err()
	case <-time.After(loginTimeout):
		return "", errors.New("timed out waiting for browser sign-in")
	case err := <-errCh:
		return "", err
	case got := <-codeCh:
		res, err := client.ExchangeDeviceCode(ctx, got.Code, verifier)
		if err != nil {
			return "", fmt.Errorf("exchange device code: %w", err)
		}
		return res.Token, nil
	}
}

// HandleURL is invoked by the OS scheme handler with the trustalo:// callback.
// It forwards the code to the waiting login process over the IPC rendezvous.
func HandleURL(raw string) error {
	u, err := url.Parse(raw)
	if err != nil {
		return fmt.Errorf("parse callback url: %w", err)
	}
	code := u.Query().Get("code")
	state := u.Query().Get("state")
	if code == "" {
		if e := u.Query().Get("error"); e != "" {
			return fmt.Errorf("sign-in failed: %s", e)
		}
		return errors.New("callback url has no code")
	}

	ep, err := readEndpoint()
	if err != nil {
		return fmt.Errorf("no sign-in is waiting (run `trustalo-agentd login` first): %w", err)
	}
	conn, err := net.DialTimeout("tcp", ep.Addr, 5*time.Second)
	if err != nil {
		return fmt.Errorf("connect to waiting login: %w", err)
	}
	defer conn.Close()
	if err := json.NewEncoder(conn).Encode(wire{Code: code, State: state, Token: ep.Token}); err != nil {
		return fmt.Errorf("deliver code: %w", err)
	}
	// Give the login side a moment to read before we exit.
	_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, _ = bufio.NewReader(conn).ReadString('\n')
	return nil
}

func acceptCode(ln net.Listener, ipcToken, state string, codeCh chan<- wire, errCh chan<- error) {
	conn, err := ln.Accept()
	if err != nil {
		errCh <- err
		return
	}
	defer conn.Close()
	var msg wire
	if err := json.NewDecoder(conn).Decode(&msg); err != nil {
		errCh <- fmt.Errorf("decode ipc payload: %w", err)
		return
	}
	if msg.Token != ipcToken {
		errCh <- errors.New("ipc token mismatch")
		return
	}
	if state != "" && msg.State != state {
		errCh <- errors.New("state mismatch (possible CSRF)")
		return
	}
	_, _ = conn.Write([]byte("ok\n"))
	codeCh <- msg
}

// ── PKCE + tokens ───────────────────────────────────────────────────────

func pkcePair() (verifier, challenge string, err error) {
	b := make([]byte, 32)
	if _, err = cryptorand.Read(b); err != nil {
		return "", "", err
	}
	verifier = base64.RawURLEncoding.EncodeToString(b)
	sum := sha256.Sum256([]byte(verifier))
	challenge = base64.RawURLEncoding.EncodeToString(sum[:])
	return verifier, challenge, nil
}

func randToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := cryptorand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// ── Endpoint rendezvous file ────────────────────────────────────────────

func endpointPath() string {
	if dir, err := os.UserConfigDir(); err == nil {
		return filepath.Join(dir, "trustalo-agent", "login.endpoint")
	}
	return "login.endpoint"
}

func writeEndpoint(ep endpoint) error {
	p := endpointPath()
	if err := os.MkdirAll(filepath.Dir(p), 0o700); err != nil {
		return err
	}
	data, _ := json.Marshal(ep)
	// 0600: the IPC token inside must stay readable only by this user.
	return os.WriteFile(p, data, 0o600)
}

func readEndpoint() (endpoint, error) {
	data, err := os.ReadFile(endpointPath())
	if err != nil {
		return endpoint{}, err
	}
	var ep endpoint
	if err := json.Unmarshal(data, &ep); err != nil {
		return endpoint{}, err
	}
	if ep.Addr == "" {
		return endpoint{}, errors.New("empty endpoint")
	}
	return ep, nil
}

func removeEndpoint() {
	_ = os.Remove(endpointPath())
}
