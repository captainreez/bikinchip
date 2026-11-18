#!/usr/bin/env bash
# logparse.sh: ringkasan log dengan grep, sed, awk, sort, uniq (saluran/pipeline).
set -euo pipefail
log=${1:-sample.log}
echo "-- jumlah per tingkat"
grep -oE '\] [A-Z]+ ' "$log" | tr -d '] ' | sort | uniq -c | sort -k1,1nr -k2,2
echo "-- kode peringatan dan galat (paling sering dulu)"
grep -E '\] (WARNING|ERROR) ' "$log" | sed -E 's/^.*\((.*)\):.*$/\1/' | sort | uniq -c | sort -k1,1nr -k2,2
echo "-- slack terburuk (ns)"
awk '/slack = /{ for (i=1;i<=NF;i++) if ($i=="=") { v=$(i+1)+0; if (!seen || v<min) { min=v; seen=1 } } } END { printf "%.2f\n", min }' "$log"
echo "-- total pelanggaran slack (negatif)"
awk '/slack = -/{ n++ } END { print n+0 }' "$log"
echo "-- area terakhir (um2)"
sed -nE 's/.*area = ([0-9.]+) um2/\1/p' "$log" | tail -1
