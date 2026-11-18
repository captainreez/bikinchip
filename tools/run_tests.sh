#!/usr/bin/env bash
# Menjalankan semua tes. Pakai: tools/run_tests.sh [pola]  (mis. test_m0 untuk modul saja)
# Situs produksi (docs/) diuji untuk tes UI/modul; situs dengan konfigurasi tiruan (/tmp/site-test) untuk sync dan auth.
cd "$(dirname "$0")/.."; pkill -f mock_supabase.js 2>/dev/null
export PLAYWRIGHT=${PLAYWRIGHT:-/opt/npm-tools/node_modules/playwright} CHROME=${CHROME:-/usr/bin/google-chrome}
PAT=${1:-.}
python3 tools/build.py docs >/dev/null
WITH_TEST_PAGES=1 python3 tools/build.py /tmp/site-main >/dev/null
CONFIG=tools/test.config.json python3 tools/build.py /tmp/site-sync >/dev/null
CONFIG=tools/test.auth.config.json python3 tools/build.py /tmp/site-auth >/dev/null
FAIL=0
for t in tools/test*.js; do
  n=$(basename $t .js); echo "$n" | grep -q -- "$PAT" || continue
  case $n in test_sync|test_migrasi) S=/tmp/site-sync;; test_auth) S=/tmp/site-auth;; *) S=/tmp/site-main;; esac
  MP=; if [ $S != /tmp/site-main ]; then node tools/mock_supabase.js $S >/tmp/mock.log 2>&1 & MP=$!; sleep 1; fi
  out=$(SITE=$S timeout 600 node $t 2>&1); [ -n "$MP" ] && kill $MP 2>/dev/null; ok=$(echo "$out" | grep -c '^ok'); bad=$(echo "$out" | grep -c 'FAIL\|CRASH')
  printf "%-16s ok=%-4s gagal=%s\n" $n $ok $bad; [ "$bad" != 0 ] && { FAIL=1; echo "$out" | grep 'FAIL\|CRASH' | head -4; }
done
exit $FAIL
