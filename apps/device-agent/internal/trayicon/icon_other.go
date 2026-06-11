//go:build !windows

// Package trayicon embeds the Trustalo menu-bar/tray icon as a status light:
// the green logo when the device is signed-in + compliant, red otherwise. All
// transparent PNGs (macOS/Linux); Windows uses ICOs (icon_windows.go).
package trayicon

import _ "embed"

//go:embed icon_green.png
var Green []byte

//go:embed icon_red.png
var Red []byte
