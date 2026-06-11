// Command agentd is the Trustalo device-posture agent daemon. It enrolls the
// machine once (signing in with the configured method), then reports security
// posture on a heartbeat. It runs under the OS service manager via
// kardianos/service (launchd / systemd / Windows SCM) and writes a status file
// the tray helper reads. The menu-bar app (cmd/tray) runs the same loop with a UI.
//
// Usage:
//
//	agentd                      run (under the service manager, or interactively)
//	agentd login                sign in via the browser (PKCE) + enroll
//	agentd handle-url <url>      the trustalo:// scheme handler (forwards to `login`)
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
	"strings"

	"github.com/kardianos/service"

	"github.com/trustalo/trustalo/apps/device-agent/internal/agent"
	"github.com/trustalo/trustalo/apps/device-agent/internal/authflow"
	"github.com/trustalo/trustalo/apps/device-agent/internal/config"
	"github.com/trustalo/trustalo/apps/device-agent/internal/ipc"
)

type program struct {
	a      *agent.Agent
	cancel context.CancelFunc
}

// Start is non-blocking (kardianos contract): it kicks off the loop goroutine.
func (p *program) Start(s service.Service) error {
	ctx, cancel := context.WithCancel(context.Background())
	p.cancel = cancel
	go func() {
		if err := p.a.Run(ctx, nil); err != nil {
			log.Printf("[agent] run ended: %v", err)
		}
	}()
	return nil
}

func (p *program) Stop(s service.Service) error {
	if p.cancel != nil {
		p.cancel()
	}
	return nil
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

	ag := agent.New(cfg, *statusPath, *credPath)

	// Dev single-shot: bypass the service runner.
	if *once {
		if err := ag.CheckInOnce(context.Background()); err != nil {
			log.Fatalf("[agent] %v", err)
		}
		return
	}

	svc, err := service.New(&program{a: ag}, &service.Config{
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
			if err := runLogin(context.Background(), cfg, *statusPath, *credPath, *configPath); err != nil {
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

// runLogin performs the interactive browser sign-in: ask for the instance URL,
// open the browser, wait for the deep-link code, exchange it, and enroll.
// Persists the URLs + auth method (never secrets) so the daemon reuses them.
func runLogin(ctx context.Context, cfg config.Config, statusPath, credPath, configPath string) error {
	if isInteractive() {
		entered := promptLine(fmt.Sprintf("Trustalo URL [%s]: ", cfg.WebURL), cfg.WebURL)
		if entered != cfg.WebURL {
			cfg.WebURL = strings.TrimRight(entered, "/")
			cfg.APIURL = cfg.WebURL // same-origin assumption for a custom instance URL
		}
	}
	ag := agent.New(cfg, statusPath, credPath)
	openBrowser := strings.TrimSpace(os.Getenv("TRUSTALO_NO_BROWSER")) == ""
	cred, err := ag.Login(ctx, openBrowser)
	if err != nil {
		return err
	}
	log.Printf("[agent] signed in + enrolled as device %s (keyId %d)", cred.DeviceID, cred.SecretKeyID)

	cfg.AuthMethod = "browser"
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

func defaultPath(name string) string {
	if dir, err := os.UserConfigDir(); err == nil {
		return filepath.Join(dir, "trustalo-agent", name)
	}
	return name
}
