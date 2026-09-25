#!/bin/sh
# Everything, in one command:  sh test.sh
#   1. parse every module as a real ES module (plain `node --check` is not
#      enough here — it passes broken files that contain `export`)
#   2. build the single-file bundle and parse that too
#   3. run every test suite
cd "$(dirname "$0")"
sh check.sh *.js || exit 1
node build.mjs >/dev/null || { echo "BUILD FAILED"; exit 1; }
node -e "
const h=require('fs').readFileSync('dist/index.html','utf8');
const s=(h.match(/<script type=\"module\">([\s\S]*?)<\/script>/g)||h.match(/<script>([\s\S]*?)<\/script>/g)||[]).sort((a,b)=>b.length-a.length)[0];
require('fs').writeFileSync('/tmp/uv_bundle.mjs', s.replace(/^<script[^>]*>|<\/script>$/g,''));"
node --input-type=module --check < /tmp/uv_bundle.mjs >/dev/null 2>&1 || { echo "BUNDLE DOES NOT PARSE"; exit 1; }
echo "bundle parses"
fail=0; n=0
for t in test/*.test.mjs; do
  n=$((n+1))
  out=$(node "$t" 2>&1 | tail -1)
  case "$out" in *"ALL PASSED"*|*"PASS (no throw)"*) ;; *) echo "FAIL  $t: $out"; fail=1;; esac
done
[ $fail -eq 0 ] && echo "all $n suites passed"
exit $fail
