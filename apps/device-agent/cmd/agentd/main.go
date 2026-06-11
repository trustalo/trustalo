// Command agentd is the Trustalo device-posture agent daemon. It enrolls the
// machine once (signing in with the configured method), then reports security
// posture on a heartbeat. It runs under the OS service manager via
// kardianos/service (launchd / systemd / Windows SCM) and writes a status file
// the tray helper reads.
//
// Usage:
//
//	agentd                      run (under the service manager, or interactively)
//	agentd install|uninstall    register / remove the system service
//	agentd start|stop|restart   control the installed service
//	agentd --once               dev: a single collect + check-in, then exit
package main

import (
	"bufio"
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/kardianos/service"

	"github.com/trustalo/trustalo/apps/device-agent/internal/apiclient"
	"github.com/trustalo/trustalo/apps/device-agent/internal/authflow"
	"github.com/trustalo/trustalo/apps/device-agent/internal/collect"
	"github.com/trustalo/trustalo/apps/device-agent/internal/config"
	"github.com/trustalo/trustalo/apps/device-agent/internal/ipc"
	"github.com/trustalo/trustalo/apps/device-agent/internal/keystore"
	"github.com/trustalo/trustalo/apps/device-agent/internal/report"
)

type program struct {
	cfg        config.Config
	statusPath string
	client     *apiclient.Client
	store      keystore.Store
	cancel     context.CancelFunc
}

// Start is non-blocking (kardianos contract): it kicks off the loop goroutine.
func (p *program) Start(s service.Service) error {
	ctx, cancel := context.WithCancel(context.Background())
	p.cancel = cancel
	go p.loop(ctx)
	return nil
}

func (p *program) Stop(s service.Service) error {
	if p.cancel != nil {
		p.cancel()
	}
	return nil
}

func (p *program) loop(ctx context.Context) {
	cred, err := ensureEnrolled(ctx, p.client, p.store, p.cfg)
	if err != nil {
		log.Printf("[agent] enrollment failed: %v", err)
		_ = ipc.Write(p.statusPath, ipc.Status{Enrolled: false, LastError: err.Error(), AgentVersion: config.Version})
		return
	}
	log.Printf("[agent] enrolled as device %s (keyId %d)", cred.DeviceID, cred.SecretKeyID)

	p.checkIn(ctx, cred)
	ticker := time.NewTicker(time.Duration(p.cfg.CheckInIntervalSeconds) * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			log.Printf("[agent] stopping")
			return
		case <-ticker.C:
			p.checkIn(ctx, cred)
		}
	}
}

func (p *program) checkIn(ctx context.Context, cred report.DeviceCredential) {
	posture, err := collect.Collect()
	if err != nil {
		log.Printf("[agent] collect error: %v", err)
		return
	}
	st := ipc.Status{
		DeviceID:     cred.DeviceID,
		Enrolled:     true,
		LastCheckIn:  time.Now(),
		Signals:      signalsMap(posture.Signals),
		OSVersion:    posture.OSVersion,
		AgentVersion: config.Version,
	}
	res, err := p.client.CheckIn(ctx, cred, posture, config.Version)
	if err != nil {
		log.Printf("[agent] check-in error: %v", err)
		st.LastError = err.Error()
	} else {
		log.Printf("[agent] check-in ok: status=%s evidence=%d disk=%s fw=%s lock=%s av=%s",
			res.Status, res.EvidenceCreated, posture.Signals.DiskEncryption, posture.Signals.Firewall,
			posture.Signals.ScreenLock, posture.Signals.Antivirus)
	}
	if err := ipc.Write(p.statusPath, st); err != nil {
		log.Printf("[agent] status write error: %v", err)
	}
}

func main() {
	configPath := flag.String("config", defaultPath("agent.config.json"), "path to agent.config.json")
	credPath := flag.String("creds", defaultPath("credential.json"), "path to the device credential store")
	statusPath := flag.String("status", ipc.DefaultPath(), "path to the tray status file")
	once := flag.Bool("once", false, "run a single collect + check-in then exit (dev)")
	urlFlag := flag.String("url", "", "instance URL for `login` (sets web + api unless --api-url is given)")
	apiURLFlag := flag.String("api-url", "", "override the API base URL")
	flag.Parse()

	cfg, err := config.Load(*configPath)
	if err != nil {
		log.Fatalf("[agent] config: %v", err)
	}
	// --url/--api-url override the resolved config (used by `login`).
	if *urlFlag != "" {
		cfg.WebURL = strings.TrimRight(*urlFlag, "/")
		if *apiURLFlag == "" {
			cfg.APIURL = cfg.WebURL
		}
	}
	if *apiURLFlag != "" {
		cfg.APIURL = strings.TrimRight(*apiURLFlag, "/")
	}
	log.Printf("[agent] v%s api=%s auth=%s", config.Version, cfg.APIURL, cfg.AuthMethod)

	prg := &program{
		cfg:        cfg,
		statusPath: *statusPath,
		client:     apiclient.New(cfg.APIURL, cfg.WebURL),
		store:      keystore.NewFileStore(*credPath),
	}

	// Dev single-shot: bypass the service runner.
	if *once {
		cred, err := ensureEnrolled(context.Background(), prg.client, prg.store, cfg)
		if err != nil {
			log.Fatalf("[agent] enrollment failed: %v", err)
		}
		prg.checkIn(context.Background(), cred)
		return
	}

	svc, err := service.New(prg, &service.Config{
		Name:        "trustalo-agent",
		DisplayName: "Trustalo Device Agent",
		Description: "Reports endpoint security posture (disk encryption, firewall, screen lock, antivirus) to Trustalo.",
	})
	if err != nil {
		log.Fatalf("[agent] service init: %v", err)
	}

	// Subcommands: browser sign-in, the URL-scheme handler, or a service verb.
	if args := flag.Args(); len(args) > 0 {
		switch args[0] {
		case "login":
			if err := runLogin(context.Background(), cfg, prg.store, *configPath); err != nil {
				log.Fatalf("[agent] login failed: %v", err)
			}
			return
		case "handle-url":
			if len(args) < 2 {
				log.Fatalf("[agent] handle-url requires the callback URL argument")
			}
			if err := authflow.HandleURL(args[1]); err != nil {
				log.Fatalf("[agent] handle-url: %v", err)
			}
			return
		default:
			// install | uninstall | start | stop | restart.
			if err := service.Control(svc, args[0]); err != nil {
				log.Fatalf("[agent] service %q failed: %v (valid: %v)", args[0], err, service.ControlAction)
			}
			log.Printf("[agent] service %s: ok", args[0])
			return
		}
	}

	if err := svc.Run(); err != nil {
		log.Fatalf("[agent] run: %v", err)
	}
}

func ensureEnrolled(
	ctx context.Context,
	client *apiclient.Client,
	store keystore.Store,
	cfg config.Config,
) (report.DeviceCredential, error) {
	if cred, err := store.Load(); err == nil {
		return cred, nil
	} else if err != keystore.ErrNotFound {
		return report.DeviceCredential{}, err
	}

	in := enrollInput()
	switch cfg.AuthMethod {
	case "token":
		if cfg.Dev.EnrollmentToken == "" {
			return report.DeviceCredential{}, fmt.Errorf("authMethod=token requires an enrollment token")
		}
		enrolled, err := client.EnrollWithToken(ctx, cfg.Dev.EnrollmentToken, in)
		if err != nil {
			return report.DeviceCredential{}, err
		}
		return saveEnrolled(store, enrolled)
	case "basic":
		if cfg.Dev.Email == "" || cfg.Dev.Password == "" {
			return report.DeviceCredential{}, fmt.Errorf("authMethod=basic requires dev.email/password")
		}
		login, err := client.Login(ctx, cfg.Dev.Email, cfg.Dev.Password)
		if err != nil {
			return report.DeviceCredential{}, fmt.Errorf("login: %w", err)
		}
		return enrollAndStore(ctx, client, store, login.Token, in)
	case "browser", "sso":
		// The daemon can't open a browser; the user runs `login` once.
		return report.DeviceCredential{}, fmt.Errorf(
			"no stored credential — run `trustalo-agentd login` to sign in via the browser")
	default:
		return report.DeviceCredential{}, fmt.Errorf("unsupported authMethod %q (basic|token|browser)", cfg.AuthMethod)
	}
}

// enrollInput snapshots this machine's identity for an enrollment request.
func enrollInput() apiclient.EnrollInput {
	posture, _ := collect.Collect()
	return apiclient.EnrollInput{
		Platform:     goosToPlatform(),
		Hostname:     posture.Hostname,
		HardwareID:   collect.HardwareID(),
		OSVersion:    posture.OSVersion,
		AgentVersion: config.Version,
	}
}

func saveEnrolled(store keystore.Store, e apiclient.EnrollResult) (report.DeviceCredential, error) {
	cred := report.DeviceCredential{DeviceID: e.DeviceID, Secret: e.DeviceSecret, SecretKeyID: e.SecretKeyID}
	if err := store.Save(cred); err != nil {
		return report.DeviceCredential{}, fmt.Errorf("save credential: %w", err)
	}
	return cred, nil
}

func enrollAndStore(
	ctx context.Context,
	client *apiclient.Client,
	store keystore.Store,
	token string,
	in apiclient.EnrollInput,
) (report.DeviceCredential, error) {
	e, err := client.EnrollWithJWT(ctx, token, in)
	if err != nil {
		return report.DeviceCredential{}, err
	}
	return saveEnrolled(store, e)
}

// runLogin performs the interactive browser sign-in: ask for the instance URL,
// open the browser to the consent page, wait for the trustalo:// deep-link code,
// exchange it for a device JWT, and enroll. Persists the URLs so the daemon
// reuses them.
func runLogin(ctx context.Context, cfg config.Config, store keystore.Store, configPath string) error {
	web, api := cfg.WebURL, cfg.APIURL
	if isInteractive() {
		entered := promptLine(fmt.Sprintf("Trustalo URL [%s]: ", web), web)
		if entered != web {
			web = strings.TrimRight(entered, "/")
			api = web // same-origin assumption for a custom instance URL
		}
	}
	client := apiclient.New(api, web)

	// Headless / SSH installs (or tests) can set TRUSTALO_NO_BROWSER=1 to just
	// print the URL to open manually instead of auto-launching a browser.
	openBrowser := strings.TrimSpace(os.Getenv("TRUSTALO_NO_BROWSER")) == ""
	token, err := authflow.Login(ctx, client, web, openBrowser)
	if err != nil {
		return err
	}
	cred, err := enrollAndStore(ctx, client, store, token, enrollInput())
	if err != nil {
		return err
	}
	log.Printf("[agent] signed in + enrolled as device %s (keyId %d)", cred.DeviceID, cred.SecretKeyID)

	// Persist URLs + browser auth so the daemon reuses them (no secrets written).
	cfg.WebURL, cfg.APIURL, cfg.AuthMethod = web, api, "browser"
	if err := config.Save(configPath, cfg); err != nil {
		log.Printf("[agent] warning: could not persist config: %v", err)
	}
	return nil
}

func isInteractive() bool {
	fi, err := os.Stdin.Stat()
	return err == nil && (fi.Mode()&os.ModeCharDevice) != 0
}

func promptLine(prompt, def string) string {
	fmt.Print(prompt)
	line, _ := bufio.NewReader(os.Stdin).ReadString('\n')
	line = strings.TrimSpace(line)
	if line == "" {
		return def
	}
	return line
}

func signalsMap(s collect.Signals) map[string]string {
	pass := func(b bool) string {
		if b {
			return "pass"
		}
		return "fail"
	}
	return map[string]string{
		"diskEncryption": string(s.DiskEncryption),
		"firewall":       string(s.Firewall),
		"screenLock":     string(s.ScreenLock),
		"antivirus":      string(s.Antivirus),
		"agentHealthy":   pass(s.AgentHealthy),
	}
}

func goosToPlatform() string {
	switch runtime.GOOS {
	case "darwin":
		return "macos"
	case "windows":
		return "windows"
	default:
		return "linux"
	}
}

func defaultPath(name string) string {
	if dir, err := os.UserConfigDir(); err == nil {
		return filepath.Join(dir, "trustalo-agent", name)
	}
	return name
}
