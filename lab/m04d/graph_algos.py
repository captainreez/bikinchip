#!/usr/bin/env python3
"""graph_algos.py: Dijkstra (heap) dan union-find (Kruskal, pohon rentang minimum)."""
import heapq

def dijkstra(adj, src):
    dist, pq = {src: 0}, [(0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist.get(u, float("inf")):
            continue                              # entri usang
        for v, w in adj.get(u, ()):
            nd = d + w
            if nd < dist.get(v, float("inf")):
                dist[v] = nd; heapq.heappush(pq, (nd, v))
    return dist

class UnionFind:
    def __init__(self, items):
        self.p = {x: x for x in items}; self.sz = {x: 1 for x in items}
    def find(self, x):
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]          # path halving
            x = self.p[x]
        return x
    def union(self, a, b):
        a, b = self.find(a), self.find(b)
        if a == b:
            return False
        if self.sz[a] < self.sz[b]:
            a, b = b, a
        self.p[b] = a; self.sz[a] += self.sz[b]
        return True

def kruskal(nodes, edges):
    uf, mst, total = UnionFind(nodes), [], 0
    for w, a, b in sorted(edges):
        if uf.union(a, b):
            mst.append((a, b, w)); total += w
    return mst, total

if __name__ == "__main__":
    adj = {"S": [("A", 4), ("B", 1)], "B": [("A", 2), ("C", 6)], "A": [("C", 3)], "C": []}
    print("dijkstra dari S:", dict(sorted(dijkstra(adj, "S").items())))
    edges = [(4, "a", "b"), (1, "a", "c"), (3, "b", "c"), (2, "b", "d"), (5, "c", "d")]
    print("kruskal:", kruskal("abcd", edges))
