#!/usr/bin/env python3
"""maze_route.py: routing labirin (algoritma Lee = BFS) vs A* pada grid dengan halangan."""
import heapq
from collections import deque

GRID = [
    "S.........",
    "..........",
    "....####..",
    "....#.....",
    "....#..#..",
    "....#..#..",
    "..###..#..",
    "..........",
    "..........",
    ".........T",
]
def find(ch):
    for r, row in enumerate(GRID):
        if ch in row:
            return r, row.index(ch)

def nbrs(r, c):
    for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        rr, cc = r + dr, c + dc
        if 0 <= rr < len(GRID) and 0 <= cc < len(GRID[0]) and GRID[rr][cc] != "#":
            yield rr, cc

def lee(s, t):
    dist, q, popped = {s: 0}, deque([s]), 0
    while q:
        u = q.popleft(); popped += 1
        if u == t:
            return dist[u], popped
        for v in nbrs(*u):
            if v not in dist:
                dist[v] = dist[u] + 1; q.append(v)
    return None, popped

def astar(s, t):
    h = lambda u: abs(u[0] - t[0]) + abs(u[1] - t[1])
    best, pq, popped = {s: 0}, [(h(s), 0, s)], 0   # (f, -g, sel): seri f dimenangkan g terbesar
    while pq:
        f, ng, u = heapq.heappop(pq); g = -ng
        if g > best[u]:
            continue
        popped += 1
        if u == t:
            return g, popped
        for v in nbrs(*u):
            if g + 1 < best.get(v, 1 << 30):
                best[v] = g + 1; heapq.heappush(pq, (g + 1 + h(v), -(g + 1), v))
    return None, popped

if __name__ == "__main__":
    s, t = find("S"), find("T")
    print("Lee   : panjang %s, sel diperluas %d" % lee(s, t))
    print("A*    : panjang %s, sel diperluas %d" % astar(s, t))
