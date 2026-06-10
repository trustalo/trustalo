// Command tray is the unprivileged user-session menu-bar/tray helper. It polls
// the daemon's status file and shows posture at a glance. It is built natively
// per-OS (the systray library uses cgo on macOS/Windows); the daemon (agentd)
// is the pure-Go, cross-compiled, privileged half.
package main

import (
	"fmt"
	"os/exec"
	"runtime"
	"time"

	"fyne.io/systray"

	"github.com/trustalo/trustalo/apps/device-agent/internal/config"
	"github.com/trustalo/trustalo/apps/device-agent/internal/ipc"
)

func main() {
	systray.Run(onReady, func() {})
}

func onReady() {
	systray.SetTitle("Trustalo")
	systray.SetTooltip("Trustalo Device Agent")

	mStatus := systray.AddMenuItem("Status: …", "Overall device posture")
	mStatus.Disable()
	mLast := systray.AddMenuItem("Last check-in: never", "Time of the last successful report")
	mLast.Disable()
	systray.AddSeparator()
	mOpen := systray.AddMenuItem("Open Dashboard", "Open the Trustalo web app")
	mQuit := systray.AddMenuItem("Quit", "Quit the tray helper")

	statusPath := ipc.DefaultPath()
	refresh(statusPath, mStatus, mLast)

	go func() {
		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-mOpen.ClickedCh:
				openBrowser(config.DefaultWebURL)
			case <-mQuit.ClickedCh:
				systray.Quit()
				return
			case <-ticker.C:
				refresh(statusPath, mStatus, mLast)
			}
		}
	}()
}

func refresh(statusPath string, mStatus, mLast *systray.MenuItem) {
	s, err := ipc.Read(statusPath)
	if err != nil {
		mStatus.SetTitle("Status: agent not running")
		systray.SetTooltip("Trustalo: agent not running")
		return
	}
	overall := summarize(s)
	mStatus.SetTitle("Status: " + overall)
	systray.SetTooltip("Trustalo: " + overall)
	if !s.LastCheckIn.IsZero() {
		mLast.SetTitle("Last check-in: " + s.LastCheckIn.Local().Format("Jan 2 15:04"))
	}
}

func summarize(s ipc.Status) string {
	switch {
	case !s.Enrolled:
		return "not enrolled"
	case s.LastError != "":
		return "error"
	}
	fails := 0
	for _, v := range s.Signals {
		if v == "fail" {
			fails++
		}
	}
	if fails == 0 {
		return "compliant"
	}
	return fmt.Sprintf("%d issue(s)", fails)
}

func openBrowser(url string) {
	var cmd string
	var args []string
	switch runtime.GOOS {
	case "darwin":
		cmd, args = "open", []string{url}
	case "windows":
		cmd, args = "rundll32", []string{"url.dll,FileProtocolHandler", url}
	default:
		cmd, args = "xdg-open", []string{url}
	}
	_ = exec.Command(cmd, args...).Start()
}
