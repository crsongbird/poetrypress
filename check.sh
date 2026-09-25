#!/bin/sh
# Genuine syntax check for this project's ES modules.
#
# Plain `node --check file.js` is NOT enough here: with no package.json
# declaring "type": "module", it reports success on a broken file that
# contains `export`. Feeding the source in as a module forces a full parse.
fail=0
for f in "$@"; do
  if ! node --input-type=module --check < "$f" >/dev/null 2>/tmp/check_err; then
    echo "SYNTAX ERROR: $f"; sed -n '1,4p' /tmp/check_err; fail=1
  fi
done
[ $fail -eq 0 ] && echo "parsed cleanly: $#"
exit $fail
