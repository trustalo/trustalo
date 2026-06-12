//go:build darwin || linux

package collect

import (
	"os/exec"
	"strings"
	"syscall"
)

// run executes a command and returns its trimmed stdout. Shared by the macOS
// and Linux collectors. (Windows uses PowerShell via ps().)
func run(name string, args ...string) (string, error) {
	out, err := exec.Command(name, args...).Output()
	return strings.TrimSpace(string(out)), err
}

// diskUsage returns total + available bytes for the boot/root filesystem via
// statfs(2). Darwin's Statfs_t.Bsize is uint32 and Linux's is int64; the uint64
// cast covers both.
func diskUsage() (uint64, uint64) {
	var st syscall.Statfs_t
	if err := syscall.Statfs("/", &st); err != nil {
		return 0, 0
	}
	return uint64(st.Bsize) * st.Blocks, uint64(st.Bsize) * st.Bavail
}
