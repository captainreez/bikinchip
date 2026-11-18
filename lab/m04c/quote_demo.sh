#!/usr/bin/env bash
# quote_demo.sh: kutip, pemisahan kata, status keluar, set -euo pipefail, trap.
t=$(mktemp -d); cd "$t"; trap 'rm -rf "$t"' EXIT
printf 'abc' > "a b.txt"; printf 'xy' > c.txt           # satu nama berspasi, satu biasa

echo "-- 1. pemisahan kata"
f="a b.txt"
n_tanpa=$(printf '%s\n' $f | wc -l)                    # $f tanpa kutip dipecah menjadi 2 kata
n_kutip=$(printf '%s\n' "$f" | wc -l)                  # "$f" tetap 1 kata
echo "jumlah argumen tanpa kutip = $n_tanpa, dengan kutip = $n_kutip"
[ "$n_tanpa" = 2 ] && [ "$n_kutip" = 1 ]
wc -c $f 2>&1 | head -2 | sed "s#$t/##"                # gagal: "a" dan "b.txt" tidak ada
wc -c "$f"
for g in *; do echo "glob: [$g]"; done                 # glob dengan nama berspasi aman bila "$g" dikutip

echo "-- 2. status keluar dan pipefail"
false | true; echo "tanpa pipefail: status = $?"
( set -o pipefail; false | true; echo "dengan pipefail: status = $?" )

echo "-- 3. set -e menghentikan skrip pada galat pertama"
( set -e; echo "sebelum"; false; echo "TIDAK TERCETAK" ) ; echo "status subshell = $?"

echo "-- 4. variabel tak terdefinisi dengan set -u"
( set -u; echo "isi: ${tidak_ada}" ) 2>&1 | sed 's/^[^:]*: line [0-9]*: //'
echo "semua pemeriksaan quote_demo.sh selesai"
