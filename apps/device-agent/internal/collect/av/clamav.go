//go:build linux || darwin

package av

import (
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

// ClamAV probes a ClamAV installation: daemon service state, a live clamd
// PING over its local socket, signature-database freshness, and the
// scheduled-scan / detection contract files written by the Trustalo host
// tooling (scripts/clamav/). Every probe is an unprivileged read; anything
// unreadable degrades to Unknown rather than failing the device falsely.
type ClamAV struct {
	units      []string // systemd units (Linux only)
	sockets    []string // clamd local-socket candidates
	tcpAddr    string   // clamd TCP fallback
	dbDirs     []string // signature database directories
	binaries   []string // binary names/paths that indicate an install
	stateDir   string   // Trustalo contract-file directory
	scanFile   string
	eventsFile string
	now        func() time.Time
}

// NewClamAV returns a probe wired for this platform's standard install
// locations: distro packages on Linux (Debian/Ubuntu `clamav-daemon`,
// RHEL/Amazon Linux `clamd@scan`), Homebrew on macOS (both the arm64
// /opt/homebrew and Intel /usr/local prefixes).
func NewClamAV() *ClamAV {
	c := &ClamAV{
		tcpAddr:  "127.0.0.1:3310",
		binaries: []string{"clamdscan", "clamscan", "clamd", "freshclam"},
		now:      time.Now,
	}
	if runtime.GOOS == "darwin" {
		c.sockets = []string{
			"/opt/homebrew/var/run/clamd.sock",
			"/usr/local/var/run/clamd.sock",
			"/tmp/clamd.socket",
			"/tmp/clamd.sock",
		}
		c.dbDirs = []string{"/opt/homebrew/var/lib/clamav", "/usr/local/var/lib/clamav"}
		c.stateDir = "/Library/Application Support/Trustalo/av/clamav"
	} else {
		c.units = []string{"clamav-daemon", "clamd@scan"}
		c.sockets = []string{
			"/var/run/clamav/clamd.ctl",
			"/run/clamav/clamd.ctl",
			"/run/clamd.scan/clamd.sock",
			"/var/run/clamd.scan/clamd.sock",
			"/tmp/clamd.socket",
		}
		c.dbDirs = []string{"/var/lib/clamav"}
		c.stateDir = "/var/lib/trustalo/av/clamav"
	}
	c.scanFile = filepath.Join(c.stateDir, "last-scan.json")
	c.eventsFile = filepath.Join(c.stateDir, "events.jsonl")
	return c
}

func (c *ClamAV) Name() string { return "clamav" }

// Detect looks for any trace of a ClamAV install: a signature database
// directory, a clamd socket, or one of its binaries.
func (c *ClamAV) Detect() bool {
	for _, dir := range c.dbDirs {
		if info, err := os.Stat(dir); err == nil && info.IsDir() {
			return true
		}
	}
	for _, sock := range c.sockets {
		if _, err := os.Stat(sock); err == nil {
			return true
		}
	}
	for _, bin := range c.binaries {
		if _, err := exec.LookPath(bin); err == nil {
			return true
		}
		// Homebrew's bin dirs are often absent from a daemon's PATH.
		for _, dir := range []string{"/opt/homebrew/bin", "/usr/local/bin", "/usr/bin"} {
			if _, err := os.Stat(filepath.Join(dir, bin)); err == nil {
				return true
			}
		}
	}
	return false
}

func (c *ClamAV) Collect() Status {
	st := Status{
		Product:            "clamav",
		Installed:          true,
		DaemonActive:       c.daemonActive(),
		DaemonResponsive:   c.ping(),
		RealTimeProtection: Unknown, // clamonacc is not part of the managed setup
		LastScanResult:     ScanUnknown,
		RecentDetections:   []Detection{},
	}

	if newest, ok := c.newestDefinitionTime(); ok {
		st.DefinitionsUpdatedAt = newest.UTC().Format(time.RFC3339)
		age := c.now().Sub(newest).Hours()
		st.DefinitionsAgeHours = &age
	}

	if data, err := os.ReadFile(c.scanFile); err == nil {
		if rec, err := parseScanRecord(data); err == nil {
			applyScanRecord(&st, rec, c.now())
		} else {
			st.LastScanResult = ScanError // contract file exists but is corrupt
		}
	} else {
		st.LastScanResult = ScanMissing
	}

	if data, err := os.ReadFile(c.eventsFile); err == nil {
		st.RecentDetections = parseEventsJSONL(data, c.now())
	}
	return st
}

// daemonActive reports the service state: any known systemd unit active on
// Linux, a running clamd process on macOS. `systemctl is-active` and pgrep
// are unprivileged queries.
func (c *ClamAV) daemonActive() State {
	if runtime.GOOS == "darwin" {
		if err := exec.Command("/usr/bin/pgrep", "-x", "clamd").Run(); err == nil {
			return Pass
		}
		return Fail
	}
	sawAnswer := false
	for _, unit := range c.units {
		out, err := exec.Command("systemctl", "is-active", unit).Output()
		state := strings.TrimSpace(string(out))
		if state == "active" {
			return Pass
		}
		// is-active exits non-zero for inactive units but still prints a
		// determinate state; only a missing/failed systemctl is Unknown.
		if err == nil || state != "" {
			sawAnswer = true
		}
	}
	if sawAnswer {
		return Fail
	}
	return Unknown
}

// ping speaks the clamd protocol directly: send zPING and expect PONG. A
// socket that exists but refuses/garbles is a determinate Fail; no reachable
// endpoint at all is Unknown (the service-state probe still applies).
func (c *ClamAV) ping() State {
	sawSocket := false
	for _, sock := range c.sockets {
		if _, err := os.Stat(sock); err != nil {
			continue
		}
		sawSocket = true
		if pingClamd("unix", sock) {
			return Pass
		}
	}
	if pingClamd("tcp", c.tcpAddr) {
		return Pass
	}
	if sawSocket {
		return Fail
	}
	return Unknown
}

func pingClamd(network, addr string) bool {
	conn, err := net.DialTimeout(network, addr, 2*time.Second)
	if err != nil {
		return false
	}
	defer conn.Close()
	_ = conn.SetDeadline(time.Now().Add(2 * time.Second))
	if _, err := conn.Write([]byte("zPING\x00")); err != nil {
		return false
	}
	buf := make([]byte, 16)
	n, _ := conn.Read(buf)
	return strings.Contains(string(buf[:n]), "PONG")
}

// newestDefinitionTime returns the most recent modification time across the
// signature databases (daily/main/bytecode, .cvd or .cld). freshclam touches
// these on every successful update, so their age is the ground truth for
// definition freshness regardless of how updates are scheduled.
func (c *ClamAV) newestDefinitionTime() (time.Time, bool) {
	var newest time.Time
	for _, dir := range c.dbDirs {
		entries, err := os.ReadDir(dir)
		if err != nil {
			continue
		}
		for _, e := range entries {
			name := e.Name()
			if !strings.HasSuffix(name, ".cvd") && !strings.HasSuffix(name, ".cld") {
				continue
			}
			if info, err := e.Info(); err == nil && info.ModTime().After(newest) {
				newest = info.ModTime()
			}
		}
	}
	return newest, !newest.IsZero()
}
