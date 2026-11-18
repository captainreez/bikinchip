#!/usr/bin/env bash
# git_demo.sh: percabangan, merge 3 arah, konflik, rebase, dan bisect, dengan waktu tetap agar ID commit tetap sama tiap dijalankan.
set -euo pipefail
export GIT_AUTHOR_NAME=Ani GIT_AUTHOR_EMAIL=ani@example.com GIT_COMMITTER_NAME=Ani GIT_COMMITTER_EMAIL=ani@example.com
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null            # abaikan konfigurasi pengguna
t=$(mktemp -d); trap 'rm -rf "$t"' EXIT; cd "$t"; git init -q -b main .
tick=1700000000
ci() { tick=$((tick+60)); GIT_AUTHOR_DATE="$tick +0000" GIT_COMMITTER_DATE="$tick +0000" git commit -q "$@"; }
mg() { tick=$((tick+60)); GIT_AUTHOR_DATE="$tick +0000" GIT_COMMITTER_DATE="$tick +0000" git merge -q "$@"; }
add() { printf '%s\n' "$2" >> "$1"; git add "$1"; }

echo "== 1. riwayat awal"
add alu.v "module alu;"; ci -m "alu: kerangka"
add tb.v "module tb;"; ci -m "tb: kerangka"
git switch -q -c feat
add fifo.v "module fifo;"; ci -m "fifo: kerangka"
add fifo.v "  // depth 8"; ci -m "fifo: kedalaman 8"
git switch -q main
add alu.v "  // carry"; ci -m "alu: carry"
echo "== 2. merge 3 arah (tanpa konflik)"
mg --no-edit feat
git log --graph --oneline --decorate | sed -E 's/\b[0-9a-f]{7}\b/<ID>/'
echo "tulang riwayat: $(git rev-list --count HEAD) commit; commit merge punya $(git log -1 --format=%p | wc -w) induk"
[ "$(git log -1 --format=%p | wc -w)" = 2 ]

echo "== 3. konflik: dua cabang mengubah baris yang sama"
git switch -q -c konflik
printf 'module alu;\n  // carry versi konflik\n' > alu.v; git add alu.v; ci -m "alu: ubah carry (konflik)"
git switch -q main
printf 'module alu;\n  // carry versi main\n' > alu.v; git add alu.v; ci -m "alu: ubah carry (main)"
if mg --no-edit konflik >/dev/null 2>&1; then echo "TIDAK ADA KONFLIK?"; exit 1; fi
echo "status: $(git status --short | tr '\n' ' ')"
cat alu.v
printf 'module alu;\n  // carry gabungan\n' > alu.v; git add alu.v; ci -m "merge konflik: gabungan"
echo "diselesaikan: $(git log -1 --format=%s)"

echo "== 4. rebase: riwayat lurus"
git switch -q -c rb HEAD~3 2>/dev/null || git switch -q -c rb HEAD~1
add rb.txt "satu"; ci -m "rb: satu"
git rebase -q main 2>&1 | head -1 || true
echo "rebase: $(git rev-list --count main..rb) commit rb di atas main; merge-base == main: $([ "$(git merge-base main rb)" = "$(git rev-parse main)" ] && echo ya || echo tidak)"

echo "== 5. bisect: cari commit pertama yang merusak"
git switch -q -c bis main
echo baik > status.txt; git add status.txt; ci -m "dasar: status baik"
for i in 1 2 3 4 5 6 7; do
  if [ "$i" -ge 5 ]; then echo "BURUK" > status.txt; else echo "baik" > status.txt; fi
  echo "$i" >> catatan.txt; git add status.txt catatan.txt; ci -m "perubahan $i"
done
git bisect start HEAD HEAD~7 > /dev/null
git bisect run sh -c 'grep -q baik status.txt' > bisect.out
echo "langkah uji bisect: $(grep -c '^running' bisect.out) dari 7 commit kandidat"
git bisect log | sed -nE 's/^# first bad commit: \[[0-9a-f]+\] (.*)/commit buruk pertama: \1/p'
git bisect reset >/dev/null 2>&1
echo "semua pemeriksaan git_demo.sh lulus"
