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
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/kardianos/service"

	"github.com/trustalo/trustalo/apps/device-agent/internal/apiclient"
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
	flag.Parse()

	cfg, err := config.Load(*configPath)
	if err != nil {
		log.Fatalf("[agent] config: %v", err)
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

	// Optional control verb: install | uninstall | start | stop | restart.
	if args := flag.Args(); len(args) > 0 {
		if err := service.Control(svc, args[0]); err != nil {
			log.Fatalf("[agent] service %q failed: %v (valid: %v)", args[0], err, service.ControlAction)
		}
		log.Printf("[agent] service %s: ok", args[0])
		return
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

	posture, _ := collect.Collect()
	in := apiclient.EnrollInput{
		Platform:     goosToPlatform(),
		Hostname:     posture.Hostname,
		HardwareID:   collect.HardwareID(),
		OSVersion:    posture.OSVersion,
		AgentVersion: config.Version,
	}

	var enrolled apiclient.EnrollResult
	var err error
	switch cfg.AuthMethod {
	case "token":
		if cfg.Dev.EnrollmentToken == "" {
			return report.DeviceCredential{}, fmt.Errorf("authMethod=token requires an enrollment token")
		}
		enrolled, err = client.EnrollWithToken(ctx, cfg.Dev.EnrollmentToken, in)
	case "basic":
		if cfg.Dev.Email == "" || cfg.Dev.Password == "" {
			return report.DeviceCredential{}, fmt.Errorf("authMethod=basic requires dev.email/password (interactive prompt is a follow-up)")
		}
		var login apiclient.LoginResult
		if login, err = client.Login(ctx, cfg.Dev.Email, cfg.Dev.Password); err != nil {
			return report.DeviceCredential{}, fmt.Errorf("login: %w", err)
		}
		enrolled, err = client.EnrollWithJWT(ctx, login.Token, in)
	default:
		return report.DeviceCredential{}, fmt.Errorf("unsupported authMethod %q (basic|token; sso is a follow-up)", cfg.AuthMethod)
	}
	if err != nil {
		return report.DeviceCredential{}, err
	}

	cred := report.DeviceCredential{
		DeviceID:    enrolled.DeviceID,
		Secret:      enrolled.DeviceSecret,
		SecretKeyID: enrolled.SecretKeyID,
	}
	if err := store.Save(cred); err != nil {
		return report.DeviceCredential{}, fmt.Errorf("save credential: %w", err)
	}
	return cred, nil
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
