package collect

import (
	"strconv"
	"strings"
)

// The helpers below add a value to the free-form `raw` posture map ONLY when it
// is meaningful — a non-empty string, a positive number, or a determinate
// (pass/fail) signal. This keeps the device-detail view free of blank rows and
// of "unknown" noise on machines where a probe couldn't read something.

func putStr(m map[string]any, k, v string) {
	if v = strings.TrimSpace(v); v != "" {
		m[k] = v
	}
}

func putU64(m map[string]any, k string, v uint64) {
	if v > 0 {
		m[k] = v
	}
}

func putInt(m map[string]any, k string, v int) {
	if v > 0 {
		m[k] = v
	}
}

// putState records an extended posture signal but omits Unknown, so the UI only
// surfaces signals we could actually determine.
func putState(m map[string]any, k string, s SignalState) {
	if s == Pass || s == Fail {
		m[k] = string(s)
	}
}

// parseKernBoottimeSec extracts the boot epoch seconds from the output of
// `sysctl -n kern.boottime`, e.g. "{ sec = 1700000000, usec = 0 } Wed Nov ...".
// The first "sec =" is the boot time (a later one belongs to "usec =").
func parseKernBoottimeSec(out string) (int64, bool) {
	i := strings.Index(out, "sec =")
	if i < 0 {
		return 0, false
	}
	rest := out[i+len("sec ="):]
	if end := strings.IndexAny(rest, ",}"); end >= 0 {
		rest = rest[:end]
	}
	n, err := strconv.ParseInt(strings.TrimSpace(rest), 10, 64)
	if err != nil {
		return 0, false
	}
	return n, true
}

// uptimeFromBoot derives uptime seconds from a boot epoch and the current epoch.
func uptimeFromBoot(bootSec, nowSec int64) int64 {
	if bootSec <= 0 || nowSec <= bootSec {
		return 0
	}
	return nowSec - bootSec
}

// parseScreenLockDelay reads `sysadminctl -screenLock status`. Returns the grace
// seconds before a password is required: "immediate" → 0, "delay is N seconds"
// → N. ok=false when the value is absent or screen lock is off.
func parseScreenLockDelay(out string) (int, bool) {
	low := strings.ToLower(out)
	if strings.Contains(low, "immediate") {
		return 0, true
	}
	if i := strings.Index(low, "delay is"); i >= 0 {
		fields := strings.Fields(low[i+len("delay is"):])
		if len(fields) > 0 {
			if n, err := strconv.Atoi(fields[0]); err == nil {
				return n, true
			}
		}
	}
	return 0, false
}

// parseMemTotalKB extracts MemTotal (in kB) from /proc/meminfo contents.
func parseMemTotalKB(meminfo string) (uint64, bool) {
	for _, line := range strings.Split(meminfo, "\n") {
		if strings.HasPrefix(line, "MemTotal:") {
			fields := strings.Fields(line)
			if len(fields) >= 2 {
				if n, err := strconv.ParseUint(fields[1], 10, 64); err == nil {
					return n, true
				}
			}
		}
	}
	return 0, false
}

// parseProcUptimeSeconds reads the first field of /proc/uptime ("12345.67 ...").
func parseProcUptimeSeconds(s string) (int64, bool) {
	fields := strings.Fields(s)
	if len(fields) == 0 {
		return 0, false
	}
	f, err := strconv.ParseFloat(fields[0], 64)
	if err != nil {
		return 0, false
	}
	return int64(f), true
}

// parseCPUModel extracts the first "model name" value from /proc/cpuinfo.
func parseCPUModel(cpuinfo string) string {
	for _, line := range strings.Split(cpuinfo, "\n") {
		if strings.HasPrefix(line, "model name") {
			if i := strings.Index(line, ":"); i >= 0 {
				return strings.TrimSpace(line[i+1:])
			}
		}
	}
	return ""
}
