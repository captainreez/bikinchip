"""gitobj.py: menghitung ID objek Git (blob, tree, commit) dengan SHA-1 dan membandingkannya dengan git sungguhan.
Format: ID = SHA-1("<jenis> <panjang>\\0" + isi). Tree: entri "<mode> <nama>\\0" + 20 byte ID, diurutkan menurut nama.
Commit: baris tree, parent, author, committer, baris kosong, pesan."""
import hashlib, os, subprocess, tempfile, shutil

def obj(kind, body): return hashlib.sha1(b'%s %d\0' % (kind.encode(), len(body)) + body).hexdigest()
def blob(data): return obj('blob', data)
def tree(entries):                                   # entries: {nama: id_hex}, semua berkas biasa (mode 100644)
    body = b''.join(b'100644 %s\0' % n.encode() + bytes.fromhex(h) for n, h in sorted(entries.items()))
    return obj('tree', body)
def commit(tree_id, parent, name, email, ts, msg):
    lines = [f'tree {tree_id}'] + ([f'parent {parent}'] if parent else [])
    lines += [f'author {name} <{email}> {ts} +0000', f'committer {name} <{email}> {ts} +0000', '', msg, '']
    return obj('commit', '\n'.join(lines).encode())

def git(*a, cwd, env=None, inp=None):
    e = dict(os.environ, GIT_CONFIG_GLOBAL='/dev/null', GIT_CONFIG_SYSTEM='/dev/null', **(env or {}))
    return subprocess.run(['git', *a], cwd=cwd, env=e, input=inp, capture_output=True, text=True, check=True).stdout.strip()

if __name__ == '__main__':
    A1, A2, B = b'hello\n', b'hello, git\n', b'world\n'
    ha1, ha2, hb = blob(A1), blob(A2), blob(B)
    t1 = tree({'a.txt': ha1, 'b.txt': hb}); t2 = tree({'a.txt': ha2, 'b.txt': hb})
    c1 = commit(t1, None, 'Ani', 'ani@example.com', 1700000000, 'first')
    c2 = commit(t2, c1, 'Ani', 'ani@example.com', 1700000060, 'edit a.txt')
    d = tempfile.mkdtemp()
    try:
        git('init', '-q', '-b', 'main', '.', cwd=d)
        env = lambda ts: {'GIT_AUTHOR_NAME': 'Ani', 'GIT_AUTHOR_EMAIL': 'ani@example.com', 'GIT_COMMITTER_NAME': 'Ani', 'GIT_COMMITTER_EMAIL': 'ani@example.com',
                          'GIT_AUTHOR_DATE': f'{ts} +0000', 'GIT_COMMITTER_DATE': f'{ts} +0000'}
        open(os.path.join(d, 'a.txt'), 'wb').write(A1); open(os.path.join(d, 'b.txt'), 'wb').write(B)
        assert git('hash-object', 'a.txt', cwd=d) == ha1 and git('hash-object', 'b.txt', cwd=d) == hb
        git('add', 'a.txt', 'b.txt', cwd=d); assert git('write-tree', cwd=d) == t1
        git('commit', '-q', '-m', 'first', cwd=d, env=env(1700000000)); assert git('rev-parse', 'HEAD', cwd=d) == c1
        open(os.path.join(d, 'a.txt'), 'wb').write(A2)
        git('add', 'a.txt', cwd=d); assert git('write-tree', cwd=d) == t2
        git('commit', '-q', '-m', 'edit a.txt', cwd=d, env=env(1700000060)); assert git('rev-parse', 'HEAD', cwd=d) == c2
        assert git('cat-file', '-t', c2, cwd=d) == 'commit' and git('cat-file', '-p', c2, cwd=d).splitlines()[1] == f'parent {c1}'
    finally: shutil.rmtree(d)
    print('blob a.txt v1 ("hello\\n")        ', ha1); print('blob b.txt   ("world\\n")        ', hb); print('tree commit 1                    ', t1)
    print('commit 1 (first)                 ', c1); print('blob a.txt v2 ("hello, git\\n")   ', ha2); print('tree commit 2                    ', t2); print('commit 2 (edit a.txt)            ', c2)
    diff = sum(x != y for x, y in zip(ha1, ha2)); print(f'digit heksadesimal berbeda antara dua blob a.txt: {diff} dari 40')
    assert ha1 == 'ce013625030ba8dba906f756967f9e9ca394464a' and blob(b'') == 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391'
    print('semua pemeriksaan gitobj.py lulus: ID model == ID git sungguhan')
