#!/usr/bin/env python3
"""test_algos.py: uji berbasis properti dengan unittest: hasil harus sama dengan acuan yang jelas benar."""
import unittest, itertools, random
from sort_counts import insertion, merge_sort, quick, lcg
from graph_algos import dijkstra, kruskal, UnionFind
from sta_dag import GATES, INPUTS, analyze

class Sorting(unittest.TestCase):
    def test_sama_dengan_sorted(self):
        rnd = random.Random(1)
        for _ in range(200):
            a = [rnd.randrange(50) for _ in range(rnd.randrange(0, 40))]
            for f in (insertion, merge_sort, quick):
                self.assertEqual(f(a)[0], sorted(a), f.__name__)
    def test_stabil_tak_diubah(self):
        a = lcg(30); b = a[:]
        merge_sort(a); self.assertEqual(a, b)          # fungsi tidak boleh mengubah masukan

class Graph(unittest.TestCase):
    def test_dijkstra_vs_floyd_warshall(self):
        rnd = random.Random(7)
        for _ in range(50):
            n = 6; INF = float("inf")
            d = [[0 if i == j else INF for j in range(n)] for i in range(n)]
            adj = {i: [] for i in range(n)}
            for _ in range(10):
                a, b, w = rnd.randrange(n), rnd.randrange(n), rnd.randrange(1, 9)
                if a != b:
                    d[a][b] = min(d[a][b], w); adj[a].append((b, w))
            for k, i, j in itertools.product(range(n), repeat=3):
                d[i][j] = min(d[i][j], d[i][k] + d[k][j])
            got = dijkstra(adj, 0)
            for j in range(n):
                self.assertEqual(got.get(j, INF), d[0][j])
    def test_kruskal_total(self):
        edges = [(4, "a", "b"), (1, "a", "c"), (3, "b", "c"), (2, "b", "d"), (5, "c", "d")]
        mst, total = kruskal("abcd", edges)
        self.assertEqual((len(mst), total), (3, 6))
    def test_union_find(self):
        uf = UnionFind(range(5)); uf.union(0, 1); uf.union(3, 4)
        self.assertEqual(uf.find(0), uf.find(1)); self.assertNotEqual(uf.find(1), uf.find(3))

class Timing(unittest.TestCase):
    def test_urutan_topologis_sah(self):
        order, arr, slack, path = analyze(GATES, 9)
        pos = {n: i for i, n in enumerate(order)}
        for g, (_, fi) in GATES.items():
            for s in fi:
                self.assertLess(pos[s], pos[g])
    def test_arrival_adalah_jalur_terpanjang(self):
        _, arr, _, path = analyze(GATES, 9)
        self.assertEqual(arr["G5"], 9)
        self.assertEqual(path, ["C", "G2", "G3", "G5"])

if __name__ == "__main__":
    unittest.main(verbosity=1)
