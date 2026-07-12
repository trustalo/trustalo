package collect

import "testing"

func TestPutHelpers(t *testing.T) {
	m := map[string]any{}
	putStr(m, "a", "  ")
	putStr(m, "b", " value ")
	putU64(m, "z", 0)
	putU64(m, "mem", 16)
	putInt(m, "zero", 0)
	putInt(m, "cores", 8)
	putState(m, "unk", Unknown)
	putState(m, "ok", Pass)
	putState(m, "bad", Fail)

	if _, ok := m["a"]; ok {
		t.Error("blank string should be omitted")
	}
	if m["b"] != "value" {
		t.Errorf("want trimmed value, got %v", m["b"])
	}
	if _, ok := m["z"]; ok {
		t.Error("zero uint should be omitted")
	}
	if m["mem"] != uint64(16) {
		t.Errorf("want 16, got %v", m["mem"])
	}
	if _, ok := m["zero"]; ok {
		t.Error("zero int should be omitted")
	}
	if m["cores"] != 8 {
		t.Errorf("want 8, got %v", m["cores"])
	}
	if _, ok := m["unk"]; ok {
		t.Error("unknown state should be omitted")
	}
	if m["ok"] != "pass" || m["bad"] != "fail" {
		t.Errorf("determinate states should be kept, got ok=%v bad=%v", m["ok"], m["bad"])
	}
}

func TestParseKernBoottimeSec(t *testing.T) {
	sec, ok := parseKernBoottimeSec("{ sec = 1700000000, usec = 123456 } Wed Nov 15 00:00:00 2023")
	if !ok || sec != 1700000000 {
		t.Fatalf("want 1700000000, got %d ok=%v", sec, ok)
	}
	if _, ok := parseKernBoottimeSec("garbage"); ok {
		t.Error("garbage should not parse")
	}
	if got := uptimeFromBoot(1000, 4600); got != 3600 {
		t.Errorf("want 3600, got %d", got)
	}
	if got := uptimeFromBoot(5000, 1000); got != 0 {
		t.Errorf("future boot should yield 0, got %d", got)
	}
}

func TestParseScreenLockDelay(t *testing.T) {
	cases := []struct {
		in   string
		want int
		ok   bool
	}{
		{"screenLock delay is 300 seconds", 300, true},
		{"screenLock is immediate", 0, true},
		{"screenLock is off", 0, false},
		{"nonsense", 0, false},
	}
	for _, c := range cases {
		got, ok := parseScreenLockDelay(c.in)
		if got != c.want || ok != c.ok {
			t.Errorf("parseScreenLockDelay(%q) = (%d,%v), want (%d,%v)", c.in, got, ok, c.want, c.ok)
		}
	}
}

func TestParseMemTotalKB(t *testing.T) {
	meminfo := "MemFree:  100 kB\nMemTotal:       16384000 kB\nBuffers: 10 kB\n"
	kb, ok := parseMemTotalKB(meminfo)
	if !ok || kb != 16384000 {
		t.Fatalf("want 16384000, got %d ok=%v", kb, ok)
	}
	if _, ok := parseMemTotalKB("no mem line"); ok {
		t.Error("missing MemTotal should not parse")
	}
}

func TestParseProcUptimeSeconds(t *testing.T) {
	s, ok := parseProcUptimeSeconds("90061.42 350000.00")
	if !ok || s != 90061 {
		t.Fatalf("want 90061, got %d ok=%v", s, ok)
	}
	if _, ok := parseProcUptimeSeconds(""); ok {
		t.Error("empty should not parse")
	}
}

func TestParseCPUModel(t *testing.T) {
	cpuinfo := "processor\t: 0\nvendor_id\t: GenuineIntel\nmodel name\t: Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz\n"
	if got := parseCPUModel(cpuinfo); got != "Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz" {
		t.Errorf("unexpected cpu model: %q", got)
	}
	if got := parseCPUModel("no model here"); got != "" {
		t.Errorf("want empty, got %q", got)
	}
}

func TestVendorIsVM(t *testing.T) {
	for _, vendor := range []string{"Amazon EC2", "QEMU", "Microsoft Corporation", "VMware, Inc.", "Google", "innotek GmbH"} {
		if !vendorIsVM(vendor) {
			t.Errorf("vendorIsVM(%q) = false, want true", vendor)
		}
	}
	for _, vendor := range []string{"", "Dell Inc.", "LENOVO", "ASUSTeK COMPUTER INC."} {
		if vendorIsVM(vendor) {
			t.Errorf("vendorIsVM(%q) = true, want false", vendor)
		}
	}
}
