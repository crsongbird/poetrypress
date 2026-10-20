#!/bin/sh
# Everything, in one command:  sh test.sh            (to release: every suite)
#                              sh test.sh --quick    (while working: all but the slow suites, test/slow.txt)
#   1. parse every module as a real ES module (plain `node --check` is not
#      enough here — it passes broken files that contain `export`)
#   2. build the single-file bundle (it parses each script, test/bundle.test.mjs runs them)
#   3. run the suites, two at a time (TEST_JOBS=n to change it), each timed: the slowest are named
cd "$(dirname "$0")"
sh check.sh *.js || exit 1
node build.mjs >/dev/null || { echo "BUILD FAILED"; exit 1; }
echo "bundle parses"
R=$(mktemp)
SUITES=$(ls test/*.test.mjs)
if [ "$1" = "--quick" ]; then SUITES=$(echo "$SUITES" | grep -v -x -F -f test/slow.txt); fi
echo "$SUITES" | xargs -P "${TEST_JOBS:-2}" -I{} sh -c 's=$(date +%s); out=$(node "{}" 2>&1 | tail -1); echo "$(( $(date +%s) - s )) {} $out"' > "$R"
n=$(wc -l < "$R" | tr -d ' ')
fails=$(grep -v "ALL PASSED" "$R")
echo "slowest: $(sort -rn "$R" | head -5 | awk '{printf "%s %ss · ", $2, $1}')"
rm -f "$R"
if [ -n "$fails" ]; then echo "$fails" | sed 's/^[0-9]* /FAIL  /'; exit 1; fi
echo "all $n suites passed"
