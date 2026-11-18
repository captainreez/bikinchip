#!/usr/bin/env bash
# redir.sh: pengalihan (redirection) diproses KIRI KE KANAN; "2>&1" menyalin tujuan stdout SAAT ITU.
# Setiap bentuk dijalankan dengan fungsi `both` (menulis OUT ke stdout dan ERR ke stderr); kita periksa ke mana keduanya pergi.
both() { echo OUT; echo ERR >&2; }
t=$(mktemp -d); cd "$t"
printf '%-24s %-9s %-9s %-9s\n' "bentuk" "isi f" "stdout" "stderr"
chk() { [ "$RES" = "$1" ] || { echo "GAGAL: $CMD menghasilkan $RES, seharusnya $1"; exit 1; }; }
run() {                                   # $1 = perintah (teks), dievaluasi oleh bash
  local cmd=$1 so se f
  CMD=$1
  rm -f f
  so=$( { eval "$cmd"; } 2>"$t/se" )      # stdout asli ditangkap oleh $( ), stderr asli ke berkas se
  se=$(cat "$t/se")
  f=$( [ -f f ] && tr '\n' ',' < f || true )
  printf '%-24s %-9s %-9s %-9s\n' "$cmd" "${f:--}" "${so:--}" "${se:--}"
  RES="${f:--}|${so:--}|${se:--}"
}
run 'both'                 ; chk "-|OUT|ERR"
run 'both > f'             ; chk "OUT,|-|ERR"
run 'both 2> f'            ; chk "ERR,|OUT|-"
run 'both > f 2>&1'        ; chk "OUT,ERR,|-|-"
run 'both 2>&1 > f'        ; chk "OUT,|ERR|-"
run 'both &> f'            ; chk "OUT,ERR,|-|-"
run 'both 2>&1 | cat > f'  ; chk "OUT,ERR,|-|-"
run 'both > /dev/null 2>&1'; chk "-|-|-"
echo "semua pemeriksaan redir.sh lulus"
