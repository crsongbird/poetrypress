/**
 * harness.mjs — the one check harness every suite shares.
 *
 *   check(label, cond, bad)  prints ok: or FAIL: (with up to eight of `bad`, the offenders)
 *   fail(label)              a FAIL with no condition
 *   failed()                 how many have failed so far
 *   done()                   prints ALL PASSED or the count, and exits (test.sh reads the last line)
 */
let failures = 0;
export function check(label, cond, bad){
  if(cond){ console.log('ok:', label); return true; }
  failures++;
  console.log('FAIL:', label + (bad && bad.length ? ':\n ' + bad.slice(0, 8).join('\n ') + (bad.length > 8 ? `\n … and ${bad.length - 8} more` : '') : ''));
  return false;
}
export function fail(label){ return check(label, false); }
export function failed(){ return failures; }
export function done(){
  console.log(failures ? `\n${failures} FAILURES` : '\nALL PASSED');
  process.exit(failures ? 1 : 0);
}
