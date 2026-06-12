package report

import (
	"strings"
	"testing"
	"time"
)

// Golden vector computed from the verified TypeScript signer
// (apps/api/src/lib/device-auth.ts + .test.ts). Asserting the exact bytes
// guarantees the agent and server never disagree on a signature.
func TestSignedHeadersGoldenVector(t *testing.T) {
	cred := DeviceCredential{DeviceID: "dev_123", Secret: strings.Repeat("a", 64), SecretKeyID: 1}
	ts := time.UnixMilli(1700000000000)
	headers := SignedHeaders(
		cred, "POST", "/api/v1/devices/agent/check-in",
		[]byte(`{"hello":"world"}`), ts, "abcdef0123456789",
	)

	const wantSig = "xuKzml2EPalgjsAinYPWkMVANeoXqDu6JQ49Cdmb1nI="
	if got := headers["X-Device-Signature"]; got != wantSig {
		t.Fatalf("signature mismatch with TS reference:\n got=%q\nwant=%q", got, wantSig)
	}
	if headers["X-Device-Id"] != "dev_123" {
		t.Errorf("X-Device-Id = %q", headers["X-Device-Id"])
	}
	if headers["X-Device-Key-Id"] != "1" {
		t.Errorf("X-Device-Key-Id = %q", headers["X-Device-Key-Id"])
	}
	if headers["X-Device-Timestamp"] != "1700000000000" {
		t.Errorf("X-Device-Timestamp = %q", headers["X-Device-Timestamp"])
	}
}

func TestNonceUniqueAndLength(t *testing.T) {
	seen := make(map[string]bool, 100)
	for i := 0; i < 100; i++ {
		n, err := Nonce()
		if err != nil {
			t.Fatal(err)
		}
		if len(n) != 16 {
			t.Fatalf("nonce length = %d, want 16", len(n))
		}
		if seen[n] {
			t.Fatalf("duplicate nonce %q", n)
		}
		seen[n] = true
	}
}
