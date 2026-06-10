// Package apiclient talks to the Trustalo API: user sign-in (to bootstrap
// enrollment), device enrollment (JWT or enrollment-token), and signed posture
// check-ins.
package apiclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/trustalo/trustalo/apps/device-agent/internal/collect"
	"github.com/trustalo/trustalo/apps/device-agent/internal/report"
)

type Client struct {
	baseURL string
	webURL  string
	http    *http.Client
}

func New(baseURL, webURL string) *Client {
	return &Client{baseURL: baseURL, webURL: webURL, http: &http.Client{Timeout: 30 * time.Second}}
}

type apiEnvelope[T any] struct {
	Success bool `json:"success"`
	Data    T    `json:"data"`
	Error   *struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

func doJSON[T any](c *Client, req *http.Request) (T, error) {
	var zero T
	resp, err := c.http.Do(req)
	if err != nil {
		return zero, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	var env apiEnvelope[T]
	if err := json.Unmarshal(body, &env); err != nil {
		return zero, fmt.Errorf("%s: decode response (status %d): %w", req.URL.Path, resp.StatusCode, err)
	}
	if resp.StatusCode >= 400 || !env.Success {
		code, msg := "", ""
		if env.Error != nil {
			code, msg = env.Error.Code, env.Error.Message
		}
		return zero, fmt.Errorf("%s -> %d %s: %s", req.URL.Path, resp.StatusCode, code, msg)
	}
	return env.Data, nil
}

// LoginResult carries the user JWT used once to bootstrap enrollment.
type LoginResult struct {
	Token string `json:"token"`
	User  struct {
		Email string `json:"email"`
	} `json:"user"`
	Organization struct {
		ID string `json:"id"`
	} `json:"organization"`
}

func (c *Client) Login(ctx context.Context, email, password string) (LoginResult, error) {
	body, _ := json.Marshal(map[string]string{"email": email, "password": password})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/api/v1/auth/login", bytes.NewReader(body))
	if err != nil {
		return LoginResult{}, err
	}
	req.Header.Set("content-type", "application/json")
	// The login route is CSRF-checked (no Bearer yet); present an allowed origin.
	req.Header.Set("origin", c.webURL)
	return doJSON[LoginResult](c, req)
}

type EnrollInput struct {
	Platform     string `json:"platform"`
	Hostname     string `json:"hostname,omitempty"`
	HardwareID   string `json:"hardwareId,omitempty"`
	OSVersion    string `json:"osVersion,omitempty"`
	AgentVersion string `json:"agentVersion,omitempty"`
}

type EnrollResult struct {
	DeviceID               string `json:"deviceId"`
	DeviceSecret           string `json:"deviceSecret"`
	SecretKeyID            int    `json:"secretKeyId"`
	CheckInIntervalSeconds int    `json:"checkInIntervalSeconds"`
}

// EnrollWithJWT self-enrolls using a signed-in user's Bearer token.
func (c *Client) EnrollWithJWT(ctx context.Context, token string, in EnrollInput) (EnrollResult, error) {
	return c.enroll(ctx, "/api/v1/devices/enroll", token, in)
}

// EnrollWithToken enrolls non-interactively with an admin enrollment token.
func (c *Client) EnrollWithToken(ctx context.Context, enrollToken string, in EnrollInput) (EnrollResult, error) {
	return c.enroll(ctx, "/api/v1/devices/agent/enroll", enrollToken, in)
}

func (c *Client) enroll(ctx context.Context, path, bearer string, in EnrollInput) (EnrollResult, error) {
	body, _ := json.Marshal(in)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+path, bytes.NewReader(body))
	if err != nil {
		return EnrollResult{}, err
	}
	req.Header.Set("content-type", "application/json")
	req.Header.Set("authorization", "Bearer "+bearer)
	return doJSON[EnrollResult](c, req)
}

type checkInBody struct {
	CollectedAt  string          `json:"collectedAt"`
	OSVersion    string          `json:"osVersion,omitempty"`
	AgentVersion string          `json:"agentVersion,omitempty"`
	Signals      collect.Signals `json:"signals"`
	Raw          map[string]any  `json:"raw,omitempty"`
}

type CheckInResult struct {
	Status             string `json:"status"`
	NextCheckInSeconds int    `json:"nextCheckInSeconds"`
	EvidenceCreated    int    `json:"evidenceCreated"`
}

// CheckIn signs and submits one posture reading via the per-device HMAC scheme.
func (c *Client) CheckIn(ctx context.Context, cred report.DeviceCredential, p collect.Posture, agentVersion string) (CheckInResult, error) {
	const path = "/api/v1/devices/agent/check-in"
	body, _ := json.Marshal(checkInBody{
		CollectedAt:  time.Now().UTC().Format(time.RFC3339),
		OSVersion:    p.OSVersion,
		AgentVersion: agentVersion,
		Signals:      p.Signals,
		Raw:          p.Raw,
	})
	nonce, err := report.Nonce()
	if err != nil {
		return CheckInResult{}, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+path, bytes.NewReader(body))
	if err != nil {
		return CheckInResult{}, err
	}
	req.Header.Set("content-type", "application/json")
	for k, v := range report.SignedHeaders(cred, http.MethodPost, path, body, time.Now(), nonce) {
		req.Header.Set(k, v)
	}
	return doJSON[CheckInResult](c, req)
}
