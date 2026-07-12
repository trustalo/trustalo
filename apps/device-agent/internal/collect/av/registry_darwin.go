//go:build darwin

package av

// Providers returns the endpoint-protection products probed on macOS. ClamAV
// first: when both it and the XProtect baseline are healthy, ClamAV is the
// managed product and should be the one reported. Register new products here.
func Providers() []Provider {
	return []Provider{NewClamAV(), XProtect{}}
}
