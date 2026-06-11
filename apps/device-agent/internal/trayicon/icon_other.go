//go:build !windows

// Package trayicon embeds the Trustalo menu-bar/tray icon. macOS and Linux take
// a PNG; Windows takes an ICO (see icon_windows.go).
package trayicon

import _ "embed"

//go:embed icon.png
var Data []byte
