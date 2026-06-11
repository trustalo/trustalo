//go:build !windows

// Package trayicon embeds the Trustalo menu-bar/tray icon. macOS and Linux take
// a PNG; Windows takes an ICO (see icon_windows.go). All are transparent.
//
// `Template` is a black silhouette with alpha — a macOS "template image" the
// menu bar tints to match light/dark (like Cursor), so it never shows as a
// colored box. `Data` is the regular (colored) icon used on Windows/Linux,
// where there's no template tinting.
package trayicon

import _ "embed"

//go:embed icon.png
var Data []byte

//go:embed icon_template.png
var Template []byte
