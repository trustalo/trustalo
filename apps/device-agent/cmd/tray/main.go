// Command tray is the Trustalo menu-bar / system-tray app. Unlike a bare status
// viewer, it RUNS the agent in-process: it heartbeats posture continuously and
// stays resident until the user picks "Quit" from the menu. It shows the
// Trustalo logo in the menu bar and a live status + actions (check in, sign in,
// open the web app).
//
// Built natively per-OS (the systray library uses cgo on macOS/Windows); the
// daemon (agentd) remains the pure-Go, headless half for servers / MDM.
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"

	"fyne.io/systray"

	"github.com/trustalo/trustalo/apps/device-agent/internal/agent"
	"github.com/trustalo/trustalo/apps/device-agent/internal/browser"
	"github.com/trustalo/trustalo/apps/device-agent/internal/config"
	"github.com/trustalo/trustalo/apps/device-agent/internal/ipc"
	"github.com/trustalo/trustalo/apps/device-agent/internal/trayicon"
)

type trayApp struct {
	ag         *agent.Agent
	cfg        config.Config
	statusPath string

	mStatus, mLast, mCheck, mSignIn, mOpen, mQuit *systray.MenuItem

	mu      sync.Mutex
	cancel  context.CancelFunc
	running bool
}

func main() {
	configPath := flag.String("config", defaultPath("agent.config.json"), "path to agent.config.json")
	credPath := flag.String("creds", defaultPath("credential.json"), "path to the device credential store")
	statusPath := flag.String("status", ipc.DefaultPath(), "path to the status file")
	flag.Parse()

	cfg, err := config.Load(*configPath)
	if err != nil {
		log.Fatalf("[tray] config: %v", err)
	}
	app := &trayApp{
		ag:         agent.New(cfg, *statusPath, *credPath),
		cfg:        cfg,
		statusPath: *statusPath,
	}
	systray.Run(app.onReady, func() {})
}

func (t *trayApp) onReady() {
	systray.SetIcon(trayicon.Data)
	systray.SetTooltip("Trustalo Device Agent")

	t.mStatus = systray.AddMenuItem("Status: …", "Overall device posture")
	t.mStatus.Disable()
	t.mLast = systray.AddMenuItem("Last check-in: never", "Time of the last successful report")
	t.mLast.Disable()
	systray.AddSeparator()
	t.mCheck = systray.AddMenuItem("Check in now", "Collect + report posture now")
	t.mSignIn = systray.AddMenuItem("Sign in…", "Sign in via the browser")
	t.mOpen = systray.AddMenuItem("Open Trustalo", "Open the Trustalo web app")
	systray.AddSeparator()
	t.mQuit = systray.AddMenuItem("Quit Trustalo Agent", "Stop reporting and quit")

	if t.ag.IsEnrolled() {
		t.startRun()
	} else {
		t.setSignedOut()
	}

	go t.handleClicks()
}

func (t *trayApp) handleClicks() {
	for {
		select {
		case <-t.mCheck.ClickedCh:
			go t.checkNow()
		case <-t.mSignIn.ClickedCh:
			go t.signIn()
		case <-t.mOpen.ClickedCh:
			_ = browser.Open(t.cfg.WebURL)
		case <-t.mQuit.ClickedCh:
			t.stopRun()
			systray.Quit()
			return
		}
	}
}

// startRun launches the heartbeat loop (idempotent). On exit (e.g. not signed
// in) it flips the menu back to the signed-out state.
func (t *trayApp) startRun() {
	t.mu.Lock()
	if t.running {
		t.mu.Unlock()
		return
	}
	ctx, cancel := context.WithCancel(context.Background())
	t.cancel = cancel
	t.running = true
	t.mu.Unlock()

	go func() {
		err := t.ag.Run(ctx, t.apply)
		t.mu.Lock()
		t.running = false
		t.mu.Unlock()
		if err != nil {
			t.setSignedOut()
		}
	}()
}

func (t *trayApp) stopRun() {
	t.mu.Lock()
	if t.cancel != nil {
		t.cancel()
	}
	t.mu.Unlock()
}

func (t *trayApp) signIn() {
	t.mStatus.SetTitle("Status: signing in…")
	if _, err := t.ag.Login(context.Background(), true); err != nil {
		t.mStatus.SetTitle("Status: sign-in failed")
		log.Printf("[tray] sign-in failed: %v", err)
		return
	}
	t.startRun()
}

func (t *trayApp) checkNow() {
	if !t.ag.IsEnrolled() {
		return
	}
	if err := t.ag.CheckInOnce(context.Background()); err != nil {
		log.Printf("[tray] check-in failed: %v", err)
	}
	if st, err := ipc.Read(t.statusPath); err == nil {
		t.apply(st)
	}
}

// apply updates the menu from a status snapshot. Called from the loop's
// callback and after a manual check-in.
func (t *trayApp) apply(st ipc.Status) {
	if !st.Enrolled {
		t.setSignedOut()
		return
	}
	overall := summarize(st)
	t.mStatus.SetTitle("Status: " + overall)
	systray.SetTooltip("Trustalo: " + overall)
	if !st.LastCheckIn.IsZero() {
		t.mLast.SetTitle("Last check-in: " + st.LastCheckIn.Local().Format("Jan 2 15:04"))
	}
	t.mSignIn.Hide()
	t.mCheck.Enable()
}

func (t *trayApp) setSignedOut() {
	t.mStatus.SetTitle("Status: not signed in")
	systray.SetTooltip("Trustalo: not signed in")
	t.mSignIn.Show()
	t.mCheck.Disable()
}

func summarize(s ipc.Status) string {
	switch {
	case !s.Enrolled:
		return "not signed in"
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

func defaultPath(name string) string {
	if dir, err := os.UserConfigDir(); err == nil {
		return filepath.Join(dir, "trustalo-agent", name)
	}
	return name
}
