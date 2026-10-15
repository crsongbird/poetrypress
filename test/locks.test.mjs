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

// ---- one control at random (ROADMAP E3): Ctrl-click a control's name rolls it alone; a locked one stays ----
{ load({ ...base, locks: [], texP1: '50', texP2: '50' }); await settle();
  reg['texP1'].type = 'range';                     // (the mock's sliders don't know they are sliders)
  const field = { contains: el => el === reg['texP1'] }, label = { closest: sel => sel === '.field' ? field : sel === 'label' ? label : null };
  const ctrlClick = () => document.dispatchEvent({ type: 'click', ctrlKey: true, target: { closest: sel => sel === 'label' ? label : null }, preventDefault(){}, stopPropagation(){} });
  let moved = false; for(let i = 0; i < 6 && !moved; i++){ ctrlClick(); await settle(); moved = save().texP1 !== '50'; }
  const s = save();
  check('Ctrl-click a control\'s name: only that control rolls', moved && s.texP2 === '50');
  load({ ...s, locks: ['texP1'], texP1: '33' }); await settle(); ctrlClick(); await settle();
  check('…and a locked one stays as it is', save().texP1 === '33'); }

// ---- the preset level's actions (ROADMAP H1): Freeze This Seed is the seed's lock; Summon Variation; Mutate Gently ----
{ const click = id => reg[id].dispatchEvent({ type: 'click' });
  load({ ...base, locks: [], textureSeed: 1234 }); await settle();
  click('freezeSeedBtn'); await settle();
  check('Freeze This Seed locks the seed, and shows it pressed', save().locks.includes('textureSeedValue') && reg['freezeSeedBtn'].getAttribute('aria-pressed') === 'true');
  click('summonVariationBtn'); await settle();
  check('…and a variation keeps a frozen seed', String(save().textureSeed) === '1234');
  click('freezeSeedBtn'); await settle();
  check('pressed again, it thaws', !save().locks.includes('textureSeedValue') && reg['freezeSeedBtn'].getAttribute('aria-pressed') === 'false');
  load({ ...base, locks: ['textureSeedValue'] }); await settle();
  check('a look that comes with its seed locked shows the button pressed', reg['freezeSeedBtn'].getAttribute('aria-pressed') === 'true');
  load({ ...base, locks: [], textureSeed: 1234 }); await settle();
  const b0 = save(); click('summonVariationBtn'); await settle(); const b1 = save();
  const off = changed(b0, b1).filter(k => !/^texture|^texP/.test(k));
  check('Summon Variation grows the same look again: a new seed, and nothing but the surface changes', String(b0.textureSeed) === '1234' && String(b1.textureSeed) !== '1234' && off.length === 0); }
{ // every section's die, gently, at once (the mock parses no markup: one stand-in section holding a few controls)
  for(const id of ['texP1', 'texP2']) reg[id].type = 'range';
  const ids = ['texP1', 'texP2', 'textureType', 'bgColor1Hex'], section = { contains: el => !!el && ids.includes(el.id) };
  const q = document.querySelectorAll; document.querySelectorAll = sel => /details\.card\[data-tab\]/.test(sel) ? [section] : (q ? q(sel) : []);
  load({ ...base, locks: ['texP2'], textureType: 'hatch', texP1: '50', texP2: '50', bg1: '#405060' }); await settle();
  let s1 = save(), moved = false;
  for(let i = 0; i < 6 && !moved; i++){ reg['mutateGentlyBtn'].dispatchEvent({ type: 'click' }); await settle(); s1 = save(); moved = s1.texP1 !== '50'; }
  document.querySelectorAll = q;
  check('Mutate Gently nudges every section a little: a slider moves no more than a gentle roll\'s reach, a color drifts',
    moved && Math.abs(+s1.texP1 - 50) <= 10 && s1.bg1 !== '#405060');
  check('…the surface stays (menus never roll gently), and a locked control stays', s1.textureType === 'hatch' && s1.texP2 === '50'); }

// ---- how a lock looks (AGENTS.md §11: a drawn padlock, never an emoji) ----
check('the lock is a drawn padlock, not an emoji', /const LOCK_GLYPH\s*=\s*\n?\s*'<svg/.test(ev) && !/'🔒'|'🔓'/.test(ev));
check('a locked control is inert and dimmed, its lock still live',
  /\.field-locked [^{]*\{[^}]*pointer-events:none/.test(css) && /\.field-locked \.lock-btn\{[^}]*pointer-events:auto/.test(css) && /\.field-locked[^{]*\{[^}]*opacity:\.3/.test(css));

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
