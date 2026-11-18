"""sched.py: simulator penjadwal CPU (FCFS, SJF tanpa-preempt, Round-Robin) dengan biaya context switch.
Semua proses tiba pada t = 0. Hasil dipakai untuk memeriksa visualisasi 3."""

def schedule(bursts, algo, quantum=3, cs=0):
    n = len(bursts)
    rem = list(bursts)
    t = 0
    seg = []                        # (proses, mulai, selesai); proses -1 = overhead context switch
    done = [None] * n
    last = None
    switches = 0
    def run_slice(i, amount):
        nonlocal t, last, switches
        if last is not None and last != i and cs > 0:
            seg.append((-1, t, t + cs)); t += cs
        if last is not None and last != i: switches += 1
        seg.append((i, t, t + amount)); t += amount; rem[i] -= amount; last = i
        if rem[i] == 0: done[i] = t
    if algo == 'FCFS':
        for i in range(n): run_slice(i, rem[i])
    elif algo == 'SJF':
        for i in sorted(range(n), key=lambda k: (bursts[k], k)): run_slice(i, rem[i])
    elif algo == 'RR':
        q = list(range(n))
        while q:
            i = q.pop(0)
            a = min(quantum, rem[i])
            run_slice(i, a)
            if rem[i] > 0: q.append(i)
    else: raise ValueError(algo)
    tat = done[:]                               # waktu tiba 0: turnaround = waktu selesai
    wait = [tat[i] - bursts[i] for i in range(n)]
    return {'seg': seg, 'done': done, 'wait': wait, 'tat': tat, 'avg_wait': sum(wait) / n, 'avg_tat': sum(tat) / n,
            'switches': switches, 'total': t, 'eff': sum(bursts) / t}

if __name__ == '__main__':
    B = [8, 4, 9, 5]
    print('beban kerja P1..P4 =', B)
    for algo, q, cs in [('FCFS', 0, 0), ('SJF', 0, 0), ('RR', 3, 0), ('RR', 1, 0), ('RR', 3, 1), ('RR', 8, 0)]:
        r = schedule(B, algo, q, cs)
        label = algo + (f' q={q}' if algo == 'RR' else '') + (f' cs={cs}' if cs else '')
        print(f'{label:12s} rata2 tunggu {r["avg_wait"]:6.2f}  rata2 turnaround {r["avg_tat"]:6.2f}  pindah konteks {r["switches"]:2d}  total {r["total"]:2d}  efisiensi {100*r["eff"]:5.1f}%')
    r = schedule(B, 'FCFS'); assert r['done'] == [8, 12, 21, 26] and r['avg_wait'] == 10.25 and r['avg_tat'] == 16.75
    r = schedule(B, 'SJF');  assert r['done'] == [17, 4, 26, 9] and r['avg_wait'] == 7.5 and r['avg_tat'] == 14.0
    r = schedule(B, 'RR', 3); assert r['total'] == 26 and sum(r['wait']) / 4 == r['avg_wait']
    r = schedule(B, 'RR', 9); f = schedule(B, 'FCFS'); assert r['done'] == f['done'] and r['switches'] == 3          # kuantum >= burst terbesar = FCFS
    r = schedule(B, 'RR', 3, 1); assert r['total'] == 26 + r['switches']
    print('semua pemeriksaan sched.py lulus')
