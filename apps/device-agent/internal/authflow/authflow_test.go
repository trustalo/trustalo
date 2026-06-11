package authflow

import (
	"crypto/sha256"
	"encoding/base64"
	"strings"
	"testing"
)

// The challenge must be base64url(SHA-256(verifier)) with NO padding, byte-for-
// byte what the server recomputes (createHash("sha256").update(v).digest("base64url")).
func TestPKCEPairMatchesServer(t *testing.T) {
	verifier, challenge, err := pkcePair()
	if err != nil {
		t.Fatalf("pkcePair: %v", err)
	}
	if verifier == "" || challenge == "" {
		t.Fatal("empty verifier/challenge")
	}
	sum := sha256.Sum256([]byte(verifier))
	want := base64.RawURLEncoding.EncodeToString(sum[:])
	if challenge != want {
		t.Fatalf("challenge %q != base64url(sha256(verifier)) %q", challenge, want)
	}
	// base64url, unpadded: no +, /, or =.
	if strings.ContainsAny(challenge, "+/=") || strings.ContainsAny(verifier, "+/=") {
		t.Fatalf("expected unpadded base64url, got verifier=%q challenge=%q", verifier, challenge)
	}
}

func TestPKCEPairIsRandom(t *testing.T) {
	_, c1, _ := pkcePair()
	_, c2, _ := pkcePair()
	if c1 == c2 {
		t.Fatal("two pkce challenges collided")
	}
}
