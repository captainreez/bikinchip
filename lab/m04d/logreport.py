#!/usr/bin/env python3
"""logreport.py: baca laporan timing, kelompokkan per group, tulis CSV. Memakai regex, dataclass, defaultdict."""
import csv, re, sys
from collections import defaultdict
from dataclasses import dataclass

PAT = re.compile(r"path=(?P<id>\d+) start=(?P<start>\S+) end=(?P<end>\S+) group=(?P<group>\w+) slack=(?P<slack>-?\d+\.\d+) cells=(?P<cells>\d+)")

@dataclass(frozen=True)
class Path:
    id: int; start: str; end: str; group: str; slack: float; cells: int

def parse(lines):
    for n, line in enumerate(lines, 1):
        if not line.strip() or line.startswith("#"):
            continue
        m = PAT.fullmatch(line.strip())
        if not m:
            raise ValueError(f"baris {n} tidak dikenal: {line!r}")
        d = m.groupdict()
        yield Path(int(d["id"]), d["start"], d["end"], d["group"], float(d["slack"]), int(d["cells"]))

def summary(paths):
    by = defaultdict(list)
    for p in paths:
        by[p.group].append(p)
    return {g: (min(x.slack for x in ps), sum(1 for x in ps if x.slack < 0), len(ps)) for g, ps in sorted(by.items())}

if __name__ == "__main__":
    with open(sys.argv[1] if len(sys.argv) > 1 else "sample_timing.rpt") as f:
        paths = list(parse(f))
    print("group  WNS    jumlah_violasi  jumlah_path")
    for g, (wns, nv, n) in summary(paths).items():
        print(f"{g:5s} {wns:6.2f} {nv:8d} {n:14d}")
    worst = sorted(paths, key=lambda p: p.slack)[:3]
    print("3 terburuk:", ", ".join(f"{p.id}({p.slack:+.2f})" for p in worst))
    w = csv.writer(sys.stdout, lineterminator="\n")
    w.writerow(["id", "start", "end", "slack"])
    for p in worst:
        w.writerow([p.id, p.start, p.end, f"{p.slack:.2f}"])
