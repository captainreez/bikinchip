#!/usr/bin/env python3
"""netlist_graph.py: netlist kecil sebagai graf berarah: levelization, kerucut fanout (BFS), deteksi loop kombinasional."""
import re
from collections import deque, defaultdict

NETLIST = """
n1 = AND(a, b)
n2 = OR(n1, c)
n3 = NOT(n2)
y  = XOR(n3, n1)
z  = AND(n2, d)
"""
LOOP = NETLIST + "p = AND(q, a)\nq = OR(p, b)\n"

def parse(text):
    g = {}
    for line in text.strip().splitlines():
        m = re.fullmatch(r"\s*(\w+)\s*=\s*(\w+)\(([^)]*)\)\s*", line)
        if not m:
            raise ValueError(line)
        g[m.group(1)] = (m.group(2), [s.strip() for s in m.group(3).split(",")])
    return g

def levelize(g):
    """level(input)=0; level(gerbang)=1+max(level fanin). Mengembalikan (level, node tersisa jika ada siklus)."""
    fan, indeg = defaultdict(list), {}
    for n, (_, fi) in g.items():
        indeg[n] = len(fi)
        for s in fi:
            fan[s].append(n)
    ins = {s for _, fi in g.values() for s in fi if s not in g}
    level = {i: 0 for i in ins}
    for n in g:                                  # fanin yang berupa input primer tidak menambah derajat
        indeg[n] = sum(1 for s in g[n][1] if s in g)
    q = deque(sorted(n for n in g if indeg[n] == 0))
    done = 0
    while q:
        n = q.popleft(); done += 1
        level[n] = 1 + max(level[s] for s in g[n][1])
        for m in sorted(fan[n]):
            if m in g:
                indeg[m] -= 1
                if indeg[m] == 0:
                    q.append(m)
    return level, sorted(n for n in g if n not in level)

def fanout_cone(g, start):
    fan = defaultdict(list)
    for n, (_, fi) in g.items():
        for s in fi:
            fan[s].append(n)
    seen, q = {start}, deque([start])
    while q:
        n = q.popleft()
        for m in sorted(fan[n]):
            if m not in seen:
                seen.add(m); q.append(m)
    return sorted(seen - {start})

if __name__ == "__main__":
    g = parse(NETLIST)
    level, stuck = levelize(g)
    print("level:", " ".join(f"{n}={level[n]}" for n in sorted(level, key=lambda k: (level[k], k))))
    print("kerucut fanout dari n1:", fanout_cone(g, "n1"), "| dari c:", fanout_cone(g, "c"))
    level, stuck = levelize(parse(LOOP))
    print("loop kombinasional pada:", stuck)
