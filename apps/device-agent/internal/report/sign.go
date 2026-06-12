// Package report builds and signs device check-in requests for the Trustalo
// API. The signing scheme is byte-for-byte identical to the server's
// per-device auth (apps/api/src/lib/device-auth.ts) so a single canonical
// string definition governs both ends.
package report

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"strconv"
	"strings"
	"time"
)

// DeviceCredential is the durable per-device identity minted at enrollment.
// Secret is the raw per-device HMAC secret (returned once by the server and
// stored by the agent in its keystore).
type DeviceCredential struct {
	DeviceID    string `json:"deviceId"`
	Secret      string `json:"deviceSecret"`
	SecretKeyID int    `json:"secretKeyId"`
}

// Nonce returns a random 16-hex-character nonce (8 bytes), matching the
// server's per-request replay-ledger expectation.
func Nonce() (string, error) {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// canonicalString reproduces the server's device-auth canonical input exactly:
//
//	METHOD\npath\ntimestamp\nnonce\nsha256hex(body)
func canonicalString(method, path, timestamp, nonce string, body []byte) string {
	sum := sha256.Sum256(body)
	return strings.Join([]string{
		strings.ToUpper(method),
		path,
		timestamp,
		nonce,
		hex.EncodeToString(sum[:]),
	}, "\n")
}

// SignedHeaders returns the X-Device-* headers authenticating a request with
// the per-device HMAC scheme: signature = base64(HMAC-SHA256(secret, canonical)).
func SignedHeaders(cred DeviceCredential, method, path string, body []byte, ts time.Time, nonce string) map[string]string {
	timestamp := strconv.FormatInt(ts.UnixMilli(), 10)
	mac := hmac.New(sha256.New, []byte(cred.Secret))
	mac.Write([]byte(canonicalString(method, path, timestamp, nonce, body)))
	sig := base64.StdEncoding.EncodeToString(mac.Sum(nil))
	return map[string]string{
		"X-Device-Id":        cred.DeviceID,
		"X-Device-Key-Id":    strconv.Itoa(cred.SecretKeyID),
		"X-Device-Timestamp": timestamp,
		"X-Device-Nonce":     nonce,
		"X-Device-Signature": sig,
	}
}
