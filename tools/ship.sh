#!/bin/sh
# tools/ship.sh — ship the tree as a release (AGENTS.md §3): build, every suite, then commit with the newest
# CHANGELOG section as the message and push main. Nothing is committed unless every suite passes.
#   SHIP_TRAILER="$(printf 'Co-Authored-By: …\nClaude-Session: …')" sh tools/ship.sh
# (the session's attribution lines, from its system reminder, go in SHIP_TRAILER; they end the commit message)
set -e
cd "$(dirname "$0")/.."
OUT=$(mktemp)
node build.mjs >/dev/null 2>&1
sh test.sh > "$OUT" 2>&1 || true
n=$(ls test/*.test.mjs | wc -l | tr -d ' ')
if grep -q "FAIL" "$OUT" || ! grep -q "all $n suites passed" "$OUT"; then grep -E "FAIL" "$OUT"; echo "NOT SHIPPED"; exit 1; fi
git add -A
git rm -q --cached --ignore-unmatch -r node_modules >/dev/null 2>&1 || true
if git diff --cached --diff-filter=AM --name-only | grep -q '^node_modules'; then echo 'NOT SHIPPED: node_modules staged'; exit 1; fi
if git diff --cached | grep -q '^+<<<<<<<'; then echo 'NOT SHIPPED: conflict markers'; exit 1; fi
MSG=$(mktemp)
node build.mjs --notes > "$MSG"
[ -n "$SHIP_TRAILER" ] && printf '\n%s\n' "$SHIP_TRAILER" >> "$MSG"
git commit -qF "$MSG"
git push -q origin HEAD:main
git log --oneline -1
