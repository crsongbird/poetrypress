/**
 * locks.test.mjs — locks supersede everything (Ruby; AGENTS.md §5.7): a
 * locked control keeps its value through a preset, the Summon buttons and the
 * dice, and locks are part of the look. Tested by behavior, on the booted app:
 * load a look with locks, act, and read the look back.
 *
 * The bug this began with: a preset restored locked values and THEN rebuilt
 * the texture tools, overwriting them. Locks held on colors and failed
 * silently on the surface's sliders.
 *
 * Run: node test/locks.test.mjs
 */
import { readFileSync } from 'fs';
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';

installCanvasMock();
const reg = installDomMock(makeMockContext, makeMockCanvas);
await import('../appEvents.js');

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ev = readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../poetrypress.css', import.meta.url), 'utf8');

const save = () => { reg['advancedRefreshBtn'].dispatchEvent({ type: 'click' }); return JSON.parse(reg['advancedJson'].value); };
const load = obj => { reg['advancedJson'].value = JSON.stringify(obj); reg['advancedLoadBtn'].dispatchEvent({ type: 'click' }); };
const settle = () => new Promise(r => setTimeout(r, 60));
const changed = (a, b) => Object.keys(a).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
// the mock's selects have no options of their own: give the texture menu the page's
{ const sel = (html.match(/<select id="textureType">([\s\S]*?)<\/select>/) || ['', ''])[1];
  reg['textureType'].options = [...sel.matchAll(/<option value="([^"]+)"([^>]*)>/g)].map(m => ({ value: m[1], hidden: /\bhidden\b/.test(m[2]) })); }
const walk = (n, cls, out = []) => { for(const c of n.children || []){ if(String(c.className || '').split(' ').includes(cls)) out.push(c); walk(c, cls, out); } return out; };

const base = save();

// ---- a preset ----
{
  load({ ...base, locks: ['texP1', 'fontFamily', 'bgColor1Hex'], texP1: '60', font: 'Cinzel', bg1: '#123456' });
  const before = save();
  walk(reg['presetGrid'], 'preset-btn').find(t => t.dataset.name === 'Andromeda').dispatchEvent({ type: 'click' });
  await settle();
  const after = save();
  check('a preset changes the look (the test can see it)', after.textureType !== before.textureType && after.lookName === 'Andromeda');
  check('…but a locked surface slider, a locked typeface and a locked color keep their values', after.texP1 === before.texP1 && after.font === 'Cinzel' && /^#123456$/i.test(after.bg1));
}

// ---- the Summon buttons ----
{
  load({ ...base, locks: ['textureType', 'texP2'], textureType: 'hatch', texP2: '41' });
  const a = save();
  reg['randomSurfaceBtn'].dispatchEvent({ type: 'click' }); await settle();
  const b = save();
  check('Summon a new surface keeps a locked surface and its locked slider', b.textureType === 'hatch' && b.texP2 === '41');
  load({ ...base, locks: [], textureType: 'hatch' });
  const c = save();
  reg['randomSurfaceBtn'].dispatchEvent({ type: 'click' }); await settle();
  check('…and, unlocked, it does summon a new one', save().textureType !== c.textureType);
  load({ ...base, locks: ['bgColor1Hex'], bgGradient: true, bg1: '#203040' });
  const d = save();
  reg['randomBgBtn'].dispatchEvent({ type: 'click' }); await settle();
  const e = save();
  check('a new backdrop changes the backdrop but not its locked first color', changed(d, e).some(k => /^bg|bgAngle/.test(k)) && /^#203040$/i.test(e.bg1));
  load({ ...base, locks: ['fontFamily'], font: 'Cinzel' });
  reg['randomFontBtn'].dispatchEvent({ type: 'click' }); await settle();
  check('a new typeface leaves a locked typeface alone', save().font === 'Cinzel');
  void a;
}

// ---- locks are part of the look ----
{
  load({ ...base, locks: ['texP1', 'textureBlend'] });
  check('locks are saved with the look and come back with it', JSON.stringify(save().locks.sort()) === JSON.stringify(['texP1', 'textureBlend']));
  load({ ...base, locks: [] });
}

// ---- every lock has a home ----
{
  const lockList = (ev.match(/const LOCKABLE = \[([\s\S]*?)\];/) || ['', ''])[1];
  const ids = [...lockList.matchAll(/'([\w-]+)'/g)].map(m => m[1]);
  const missing = ids.filter(id => !html.includes(`id="${id}"`));
  check('every listed lockable id exists in the markup' + (missing.length ? ': ' + missing.join(', ') : ''), missing.length === 0);
  // a lock sits beside its field's label; a field without a label strands it under the control
  const stranded = ids.filter(id => {
    const at = html.indexOf(`id="${id}"`); if(at < 0) return true;
    let from = at;
    for(let k = 0; k < 4; k++){
      const f = Math.max(html.lastIndexOf('<div class="field', from), html.lastIndexOf('<div class="check-row', from));
      if(f < 0) return true;
      if(/<label/.test(html.slice(f, at))) return false;
      from = f - 1;
    }
    return true;
  });
  check('every lock resolves to a labelled field' + (stranded.length ? ': ' + stranded.join(', ') : ''), stranded.length === 0);
}

// ---- how a lock looks (AGENTS.md §11: a drawn padlock, never an emoji) ----
check('the lock is a drawn padlock, not an emoji', /const LOCK_GLYPH\s*=\s*\n?\s*'<svg/.test(ev) && !/'🔒'|'🔓'/.test(ev));
check('a locked control is inert and dimmed, its lock still live',
  /\.field-locked [^{]*\{[^}]*pointer-events:none/.test(css) && /\.field-locked \.lock-btn\{[^}]*pointer-events:auto/.test(css) && /\.field-locked[^{]*\{[^}]*opacity:\.3/.test(css));

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
