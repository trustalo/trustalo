//go:build windows

package trayicon

import _ "embed"

//go:embed icon_green.ico
var Green []byte

//go:embed icon_red.ico
var Red []byte
