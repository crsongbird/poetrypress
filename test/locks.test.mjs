/**
 * locks.test.mjs — a locked control must survive Randomize and presets.
 *
 * The bug this exists to catch: applyPreset restored locked values and THEN
 * ran syncTextureTools, which rebuilds the blend select and re-clamps the
 * texture params — overwriting what had just been restored. Locks appeared to
 * work on colours and silently failed on the texture tools.
 *
 * Run: node test/locks.test.mjs
 */
import { readFileSync } from 'fs';
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';

installCanvasMock();
const registry = installDomMock(makeMockContext, makeMockCanvas);
await import('../appEvents.js');

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };

const ev = readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../poetrypress.css', import.meta.url), 'utf8');

// --- the ordering that broke it ---
const fin = (ev.match(/\} finally \{[\s\S]*?\n  \}/) || [''])[0];
const syncPos = fin.indexOf('syncTextureTools');
const restorePos = fin.indexOf('restoreLocked');
check('applyPreset syncs before it restores locks',
  syncPos !== -1 && restorePos !== -1 && syncPos < restorePos);

// --- restoring must refresh what reads the value ---
check('a restored value notifies its listeners',
  /function restoreLocked[\s\S]*?dispatchEvent\(new Event\('input'/.test(ev));

// --- every lockable control actually exists ---
const lockList = (ev.match(/const LOCKABLE = \[([\s\S]*?)\];/) || ['',''])[1];
const ids = [...lockList.matchAll(/'([\w-]+)'/g)].map(m => m[1]);
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const missing = ids.filter(id => !html.includes(`id="${id}"`));
check('every lockable id exists in the markup', missing.length === 0);
if(missing.length) console.log('   missing:', missing.join(', '));
check('a useful number of controls are lockable', ids.length >= 20);

// --- the things a preset changes should be lockable ---
const applyPre = (ev.match(/function applyPreset\(p\)\{[\s\S]*?\n\}/) || [''])[0];
for(const id of ['textureBlend','textureLight','textureType','texP1','texP2','fontFamily'])
  check(`"${id}" is lockable`, ids.includes(id));

// --- the glyph is drawn, not an emoji ---
check('the lock is a drawn glyph, not an emoji',
  /const LOCK_GLYPH\s*=\s*\n?\s*'<svg/.test(ev) && !/'🔒'|'🔓'/.test(ev));
check('the shackle opens when unlocked',
  /\.lock-btn \.lk-shackle\{[^}]*transform:translate/.test(css));
check('the locked state closes the shackle',
  /\.lock-btn\.locked \.lk-shackle\{[^}]*transform:none/.test(css));
// the last margin-left declared for the lock is the one that applies
const lockMargins = [...css.matchAll(/\.lock-btn\{[^}]*?margin-left:([^;}]+)/g)].map(m => m[1].trim());
check('the lock sits beside its label, not at the far edge',
  lockMargins.length > 0 && /^\d+px$/.test(lockMargins[lockMargins.length - 1]));
check('a locked control is visibly dimmed', /\.field-locked >/.test(css));

// --- lock state round-trips ---
check('locks are saved and restored', /locks:/.test(ev) && /restoreLockState/.test(ev));

// ---- placement and affordance ----
// Controls nested in a wrapper (.angle-wrap, .color-pair, .row) used to get
// their lock appended to the wrapper, which put it underneath the control.
check('locks find the enclosing field, not just the immediate parent',
  /function nearestField/.test(ev) && /nearestField\(node\)/.test(ev));
check('the lock is placed against the field\'s own label',
  /field\.querySelector\('label'\)/.test(ev));
check('a locked control is actually inert, not just dim',
  /\.field-locked [^{]*\{[^}]*pointer-events:none/.test(css));
check('the lock itself stays live inside a locked field',
  /\.field-locked \.lock-btn\{[^}]*pointer-events:auto/.test(css));
check('the lock has a small hit area', /\.lock-btn\{[^}]*width:14px/.test(css));
check('locked fields are dimmed well below half', /\.field-locked[^{]*\{[^}]*opacity:\.3/.test(css));

// every lock must resolve to a field that HAS a label — otherwise it sits
// below the control with nothing to belong to
const lockIds = [...lockList.matchAll(/'([\w-]+)'/g)].map(m => m[1]);
const stranded = lockIds.filter(id => {
  const at = html.indexOf(`id="${id}"`);
  if(at < 0) return true;
  let from = at;
  for(let k = 0; k < 4; k++){
    const f = Math.max(html.lastIndexOf('<div class="field', from),
                       html.lastIndexOf('<div class="check-row', from));
    if(f < 0) return true;
    if(/<label/.test(html.slice(f, at))) return false;
    from = f - 1;
  }
  return true;
});
check('every lock resolves to a labelled field', stranded.length === 0);
if(stranded.length) console.log('   stranded:', stranded.join(', '));
check('a field without its own label is walked past',
  /querySelector\('label'\)\) return el;/.test(ev));

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
