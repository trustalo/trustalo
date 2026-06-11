//go:build windows

package trayicon

import _ "embed"

//go:embed icon.ico
var Data []byte

// Template is unused on Windows (no menu-bar template tinting) but defined so
// callers can pass it unconditionally to SetTemplateIcon.
//
//go:embed icon_template.png
var Template []byte
