#!/usr/bin/env python3
"""sta_dag.py: waktu tiba terlama (arrival time) pada DAG gerbang, urutan topologis Kahn."""
from collections import defaultdict
import heapq

GATES = {            # nama: (tunda, [fanin])
    "G1": (2, ["A", "B"]), "G2": (3, ["B", "C"]), "G3": (2, ["G1", "G2"]),
    "G4": (1, ["G2"]),     "G5": (4, ["G3", "G4"]), "G6": (2, ["G4", "C"]),
}
INPUTS = ["A", "B", "C"]
OUTPUTS = ["G5", "G6"]

def analyze(gates, period, slow=None, extra=0):
    delay = {g: d + (extra if g == slow else 0) for g, (d, _) in gates.items()}
    fan = defaultdict(list); indeg = {g: len(f) for g, (_, f) in gates.items()}
    for g, (_, fi) in gates.items():
        for s in fi: fan[s].append(g)
    indeg.update({i: 0 for i in INPUTS})
    ready = [n for n in indeg if indeg[n] == 0]; heapq.heapify(ready)   # urutan deterministik
    arr, via, order = {i: 0 for i in INPUTS}, {}, []
    while ready:
        n = heapq.heappop(ready); order.append(n)
        if n in gates:
            fi = gates[n][1]
            best = max(fi, key=lambda s: (arr[s], s))                  # seri: pilih nama terbesar
            arr[n] = arr[best] + delay[n]; via[n] = best
        for m in fan[n]:
            indeg[m] -= 1
            if indeg[m] == 0: heapq.heappush(ready, m)
    slack = {o: period - arr[o] for o in OUTPUTS}
    worst = min(OUTPUTS, key=lambda o: (slack[o], o))
    path, n = [worst], worst
    while n in via: n = via[n]; path.append(n)
    return order, arr, slack, path[::-1]

if __name__ == "__main__":
    for period, slow in ((9, None), (9, "G2"), (12, "G2")):
        order, arr, slack, path = analyze(GATES, period, slow, 3)
        print(f"T={period} lambat={slow}: order={' '.join(order)}")
        print("  arrival:", " ".join(f"{k}={arr[k]}" for k in sorted(arr)))
        print("  slack  :", " ".join(f"{k}={v}" for k, v in slack.items()), "| jalur kritis:", "->".join(path))
