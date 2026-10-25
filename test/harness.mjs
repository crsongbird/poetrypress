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

// THE UI'S SOURCE: appEvents.js (the entry and its wiring) and the modules split from it (ui*.js), for the few checks
// that read the code itself (invariants and pitfalls). Read it whole, so a function may live in any of them.
import { readdirSync, readFileSync } from 'fs';
export const UI_FILES = ['appEvents.js', ...readdirSync(new URL('..', import.meta.url)).filter(f => /^ui[A-Z]\w*\.js$/.test(f)).sort()];
export function uiSource(){ return UI_FILES.map(f => readFileSync(new URL('../' + f, import.meta.url), 'utf8')).join('\n'); }
// The LAST declaration of a property for a selector — what actually applies.
// Tests should assert on this, not on whichever block happens to come first:
// earlier blocks overridden later are dead code, and get removed.
export function effective(css, selector, prop){
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blocks = [...css.matchAll(new RegExp(esc + '\\{([^}]*)\\}', 'g'))].map(m => m[1]);
  let val = null;
  for(const b of blocks){
    for(const d of b.split(';')){
      const [k, ...v] = d.split(':');
      if(k && k.trim() === prop) val = v.join(':').trim();
    }
  }
  return val;
}
