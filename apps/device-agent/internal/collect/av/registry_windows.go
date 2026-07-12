//go:build windows

package av

// Providers returns the endpoint-protection products probed on Windows.
// Register new products here.
func Providers() []Provider {
	return []Provider{NewDefender()}
}
