#!/usr/bin/env bash
# mk_test.sh: membuktikan perilaku build bertahap (incremental) GNU make pada proyek mk/.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
t=$(mktemp -d); trap 'rm -rf "$t"' EXIT
cp "$here"/mk/* "$t"/; cd "$t"
rebuilt() {                                   # daftar target yang dikompilasi/ditaut oleh satu pemanggilan make
  local out; out=$(make "$@" 2>&1)
  local l; l=$(printf '%s\n' "$out" | sed -nE 's/^gcc (.* )?-o ([^ ]+).*/\2/p' | sort | tr '\n' ' ')
  if [ -z "$l" ]; then printf '%s\n' "$out" | grep -E 'up to date|Nothing to be done' | head -1; else echo "dibangun: ${l% }"; fi
}
want() { [ "$1" = "$2" ] || { echo "SALAH: dapat [$1] ingin [$2]"; exit 1; }; }
tick() { sleep 0.02; touch "$1"; }
echo "-- awal (semua)";                 r=$(rebuilt); echo "$r"; want "$r" "dibangun: lib.o main.o prog util.o"
echo "-- tanpa perubahan";              r=$(rebuilt); echo "$r"; want "$r" "make: 'prog' is up to date."
for f in config.h util.h util.c main.c lib.c; do
  tick "$f"; echo "-- touch $f"; r=$(rebuilt); echo "$r"
  case $f in
    config.h) want "$r" "dibangun: lib.o main.o prog util.o";;
    util.h)   want "$r" "dibangun: main.o prog util.o";;
    util.c)   want "$r" "dibangun: prog util.o";;
    main.c)   want "$r" "dibangun: main.o prog";;
    lib.c)    want "$r" "dibangun: lib.o prog";;
  esac
done
echo "-- hasil program"; make -s test
echo "-- make -n (uji kering) setelah touch util.c"; tick util.c; make -n | sed 's/ -MMD -MP//'
make -s >/dev/null
echo "-- paralel: make -j4 setelah touch config.h"; tick config.h; r=$(rebuilt -j4); echo "$r"; want "$r" "dibangun: lib.o main.o prog util.o"
echo "-- jebakan: Makefile tanpa dependensi header"
make clean >/dev/null; make -f Makefile.nodep >/dev/null; tick util.h
r=$(rebuilt -f Makefile.nodep); echo "setelah touch util.h: $r"; want "$r" "make: 'prog' is up to date."
echo "-- jebakan: spasi, bukan tab, di awal resep"
printf 'prog: main.c\n    gcc -o prog main.c\n' > Makefile.bad
make -f Makefile.bad 2>&1 | sed 's/^make: //' | head -1 || true
echo "semua pemeriksaan mk_test.sh lulus"
