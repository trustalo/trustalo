//go:build linux

package av

// Providers returns the endpoint-protection products probed on Linux.
// Register new products (ESET, …) here.
func Providers() []Provider {
	return []Provider{NewClamAV()}
}
