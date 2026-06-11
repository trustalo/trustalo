// Package browser opens a URL in the user's default web browser, cross-platform.
package browser

import (
	"os/exec"
	"runtime"
)

// Open launches the default browser at url. Non-blocking (Start, not Run) so the
// agent keeps waiting for the deep-link callback while the browser is open.
func Open(url string) error {
	switch runtime.GOOS {
	case "darwin":
		return exec.Command("open", url).Start()
	case "windows":
		return exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	default:
		return exec.Command("xdg-open", url).Start()
	}
}
