/**
 * uiLocks.js — locks: what is pinned, the master locks and eyes in the headings, the dice beside them, and linked controls
 *
 * Split from appEvents.js (its wiring, the listeners, stays there, in the order it runs).
 */
import { $, FONTS, FONT_GROUPS } from './appOptions.js';
import { DIE, EYE_OFF, PAGE_SAYS, fill } from './strings.js';
import { capsFor } from './textureGenerators.js';
import { commitHistory, commitSoon } from './uiHistory.js';
import { dialMax, setLight } from './uiDials.js';
import { moonForSeed } from './texWhimsy.js';
import { moonGlyph, phaseName } from './moon.js';
import { scheduleRender } from './canvasRenderer.js';
import { state } from './uiState.js';
import { toast } from './uiGuard.js';
import { TRY_GRAPH, diePending, dieRolls, lockButtons, murmur, refreshUi, setColorField } from './appEvents.js';
import { refreshReadouts, syncFrameVisibility } from './uiControls.js';
import { paintFreeze, restoreSettings, serializeCurrentSettings } from './uiLook.js';
import { hexToRgbObj, hslHex, maybeRerollSeed } from './uiLayout.js';

// The lock set itself lives in `state.locks` (top of the file). This is the
// list of controls that CAN be locked.
export const LOCKABLE = [
  'bgColor1Hex','bgColor2Hex','bgColor3Hex','bgColor4Hex',
  'textColorHex','textColor2Hex','textColor3Hex','textColor4Hex',
  'accent1ColorHex','accent2ColorHex','borderColorHex',
  'fontFamily','textureType','textureOpacity','textureBlend','textureLight','cameraTurn',
  'textureTint1Hex','textureTint2Hex','textureTint3Hex','textureTint4Hex','textureTint5Hex','textureTint6Hex','textureTint7Hex','textureTint8Hex','textureTint9Hex','textureTint10Hex','textureTint11Hex','textureTint12Hex','texP1','texP2','texP3','texP4','texP5','texP6','texP7','texP8','textureSeedValue',
];
// A padlock in the same scratchy hand as the tab glyphs — the shackle swings
// open when unlocked, which reads at a glance without colour.
export const LOCK_GLYPH =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
  'stroke-linecap="round" stroke-linejoin="round">' +
  '<rect class="lk-body" x="4.6" y="10.4" width="14.8" height="10.2" rx="1.6"/>' +
  '<rect class="lk-body" x="4.9" y="10.7" width="14.2" height="9.6" rx="1.6" opacity=".45"/>' +
  '<path class="lk-shackle" d="M8.1 10.4V7.3a3.9 3.9 0 0 1 7.8 0v3.1"/>' +
  '<path class="lk-shackle" d="M8.3 10.2V7.2a3.9 3.9 0 0 1 7.6 0v3" opacity=".45"/>' +
  '<circle cx="12" cy="15.4" r="1.5"/>' +
  '</svg>';
export function syncStopFields(count, field3Id, field4Id){
  $(field3Id).style.display = count >= 3 ? 'block' : 'none';
  $(field4Id).style.display = count >= 4 ? 'block' : 'none';
}
/** The nearest enclosing .field / .check-row, however deeply the control is
 *  wrapped. Used so a lock always lands next to its setting's name. */
function nearestField(node){
  let el = node, firstField = null;
  for(let i = 0; i < 7 && el; i++){
    const isField = el.classList &&
      (el.classList.contains('field') || el.classList.contains('check-row'));
    if(isField){
      if(!firstField) firstField = el;
      // Keep walking past a field that holds no label of its own — the
      // texture seed, for one, sits in a bare inner .field inside a labelled
      // outer one, and stopping at the inner one left its lock stranded
      // below the input with nothing to sit beside.
      if(el.querySelector && el.querySelector('label')) return el;
    }
    el = el.parentElement;
  }
  return firstField || node.parentElement;
}
export function installLocks(){
  for(const id of LOCKABLE){
    const node = $(id);
    if(!node || !node.parentElement) continue;
    // Several controls sit inside a wrapper (.angle-wrap, .color-pair, .row),
    // so the input's immediate parent is NOT the field and holds no label —
    // the lock then fell through to the wrapper and rendered underneath the
    // control instead of beside its name. Walk up to the real field first.
    const field = nearestField(node);
    const host = (field && field.querySelector && field.querySelector('label')) || field;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lock-btn';
    btn.title = PAGE_SAYS.lock;
    btn.innerHTML = LOCK_GLYPH;
    const paint = ()=>{
      const on = state.locks.has(id);
      btn.classList.toggle('locked', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.title = on ? PAGE_SAYS.locked : PAGE_SAYS.lock;
      // the control itself dims, so a locked setting is obvious at a glance
      if(field && field.classList) field.classList.toggle('field-locked', on);
    };
    btn.addEventListener('click', ()=>{
      if(state.locks.has(id)) state.locks.delete(id); else state.locks.add(id);
      murmur.play(state.locks.has(id) ? 'lock' : 'unlock');
      paint(); paintMasterLocks();
    });
    btn._paint = paint;
    lockButtons.set(id, btn);
    if(host && host.appendChild) host.appendChild(btn);
    guardLabelTaps(host, btn);
  }
}
/** A LABEL HANDS ITS TAPS TO THE FIRST BUTTON IN IT (Ruby: a scroll that began on a control's name locked it):
 *  a label holding a padlock keeps them, so only the padlock itself locks. */
export function guardLabelTaps(host, btn){   // test hook: locks.test taps a name and a padlock
  if(host && host.tagName === 'LABEL' && !host.htmlFor && host.addEventListener)
    host.addEventListener('click', e => { if(e.target !== btn && !(btn.contains && btn.contains(e.target))) e.preventDefault(); });
}
/** Rebuilds the lock set and the buttons' appearance from a saved list. */
export function restoreLockState(ids){
  state.locks.clear();
  for(const id of ids) if(LOCKABLE.includes(id)) state.locks.add(id);
  for(const [, btn] of lockButtons) if(btn._paint) btn._paint();
  paintMasterLocks();
}
// Every section's heading has a master lock: it locks (or, when all are
// locked, unlocks) every lockable control beneath it — a card, or a sub-section
// within one. Half-closed when only some are locked. The checkboxes that
// switched a section on are EYES now (open: shown); a card's own eye sits in
// its heading, beside its lock, far enough from the fold not to be hit by it.
const masterLocks = [];
export function lockablesIn(root){ return LOCKABLE.filter(id => { const el = $(id); return el && root.contains && root.contains(el); }); }
export function paintMasterLocks(){
  for(const m of masterLocks){
    const ids = lockablesIn(m.root), n = ids.filter(id => state.locks.has(id)).length;
    m.btn.classList.toggle('locked', ids.length > 0 && n === ids.length); m.btn.classList.toggle('partial', n > 0 && n < ids.length);
    m.btn.title = n === ids.length && n ? 'Everything here is locked. Click to unlock it all.' : n ? `${n} of ${ids.length} locked here. Click to lock them all.` : 'Lock everything in this section against dice and presets';
    m.btn.setAttribute('aria-pressed', n === ids.length && n ? 'true' : n ? 'mixed' : 'false');
  }
  paintFreeze();          // (the seed's lock has a button of its own above the presets)
}
function headTools(head){
  let t = head.querySelector(':scope > .head-tools');
  if(!t){ t = document.createElement('span'); t.className = 'head-tools'; head.insertBefore(t, head.firstChild); }
  return t;
}
// THE HINTS, WRITTEN OUT (the usability review: some two hundred hints lived only in title attributes, which a touch
// screen never shows): ⓘ in a card's heading writes each hint under the control it belongs to, as it reads now
// (some change with the surface), and takes them away again
const HINT_SKIP = '.head-tools, .lock-btn, .die-pair, .tip-line, option, .grimoire-row, .chip, .preset-btn, .preset-grid, .filmstrip';
function writeHints(card){
  for(const t of card.querySelectorAll('.tip-line')) t.remove();
  const said = new Map();          // each place's hints so far: a hint said once there is said once
  for(const el of card.querySelectorAll('[title]')){
    const text = String(el.title || '').trim(); if(!text || (el.closest && el.closest(HINT_SKIP))) continue;
    // (a box whose own label has a hint: the label's is the one said)
    if(el.tagName === 'INPUT' && el.id && card.querySelector(`label[for="${el.id}"][title]`)) continue;
    const home = (el.tagName === 'LABEL' || el.tagName === 'INPUT' || el.tagName === 'SELECT') ? nearestField(el) : (el.closest && el.closest('.btn-row, .field, .check-row, .row')) || el.parentElement;
    if(!home) continue;
    const here = said.get(home) || new Set(); if(here.has(text)) continue; here.add(text); said.set(home, here);
    // (a button among others is named in its hint; one alone, or a hint shorter than a phrase, needs no more)
    if(text.length < 8) continue;
    const name = el.tagName === 'BUTTON' && [...(home.children || [])].filter(c => c.tagName === 'BUTTON' && c.title).length > 1 ? String(el.textContent || el.getAttribute('aria-label') || '').trim() : '';
    const tip = document.createElement('small'); tip.className = 'tip-line';
    tip.textContent = name && name.length < 40 ? name + ': ' + text : text;
    home.appendChild(tip);
  }
}
// a card's hints shown or taken away (opened: its section unfolds too, as ⓘ was pressed to read it)
export function showHints(card, on, unfold){
  card.classList.toggle('hints-open', on);
  if(on){ writeHints(card); if(unfold && !card.open) card.open = true; } else for(const t of card.querySelectorAll('.tip-line')) t.remove();
  const btn = card.querySelector(':scope > summary .hint-btn');
  if(btn){ btn.setAttribute('aria-pressed', on ? 'true' : 'false'); btn.title = on ? PAGE_SAYS.hintsHide : PAGE_SAYS.hintsShow; btn.setAttribute('aria-label', btn.title); }
}
function addHintsButton(card, head){
  if(!card || !head || !card.querySelector('[title]')) return;
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'hint-btn'; btn.textContent = 'ⓘ';
  btn.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();                     // never folds the section it sits in
    showHints(card, !card.classList.contains('hints-open'), true);
    if(btn.blur && e.pointerType !== 'keyboard' && e.detail > 0) btn.blur();   // (a tap leaves no focus ring that reads as "on")
  });
  headTools(head).appendChild(btn); showHints(card, false);
}
// THE HINTS SWITCH (Esoterica → Interface; Ruby: smaller, and switchable — "information density is necessary too"):
// on, every section's hints are written out (and kept current as the page changes); off, only where ⓘ asks.
// This browser's preference, never part of a look.
export const HINTS_ON = 'uv.hints.on';
function hintsEverywhere(){ const b = $('hintsToggle'); return !!(b && b.checked); }
export function refreshHints(){ if(typeof document.querySelectorAll !== 'function') return;
  for(const card of document.querySelectorAll('details.card[data-tab]')) if(card.querySelector(':scope > summary .hint-btn')){
    if(hintsEverywhere()) showHints(card, true, false); else if(card.classList.contains('hints-open')) writeHints(card); } }
function addMasterLock(root, head){
  if(!root || !head || !lockablesIn(root).length) return;
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'lock-btn master-lock'; btn.innerHTML = LOCK_GLYPH;
  btn.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();                     // never folds the section it sits in
    const ids = lockablesIn(root), all = ids.every(id => state.locks.has(id));
    for(const id of ids) all ? state.locks.delete(id) : state.locks.add(id);
    murmur.play(all ? 'unlock' : 'lock');
    for(const [, b] of lockButtons) if(b._paint) b._paint();
    paintMasterLocks();
  });
  headTools(head).appendChild(btn); masterLocks.push({ root, btn });
}
// Locked controls are never touched: a roll skips them, and withLocksPreserved puts back anything a
// change set off in them (Ruby: locks supersede randomization). On the Surface, Shift-click rolls
// only the seed: the same texture, a new pattern (the seed keeps its own lock too).
// THREE WAYS (Ruby, ROADMAP E1), chosen from a long press on a phone and ▾ beside the die on a desk.
// The way last chosen is REMEMBERED (an app preference) and every die and Summon button rolls that way:
//   gentle — sliders ±8% of their range; colours drift together; the light dial moves a little;
//            menus and switches stay, so the surface never changes; a typeface may become a similar one
//   usual  — the Summon buttons' known-good schemes; elsewhere every slider, menu and colour in reason
//   wild   — sliders anywhere in their range, every menu, any colour, the light anywhere (never a switch)
// and BACK (E2): the section returns to how it was before its last roll, whatever else has changed since.
const DIE_SUMMONS = { randomBgBtn: 1, randomSurfaceBtn: 1, randomFontBtn: 1 };
const DIE_GENTLE = 0.08, DIE_LEVELS = ['gentle', 'usual', 'wild'], DIE_LEVEL_KEY = 'uv.dice.level';
const DIE_GLYPH = { gentle: '⚁', usual: '⚄', wild: '⚅' };
export function dieLevel(){ try { const v = localStorage.getItem(DIE_LEVEL_KEY); if(DIE_LEVELS.includes(v)) return v; } catch(e){} return 'usual'; }
function setDieLevel(level){ if(!DIE_LEVELS.includes(level)) return; try { localStorage.setItem(DIE_LEVEL_KEY, level); } catch(e){} paintDice(); }
const dieWord = level => DIE[level + 'Word'] || level;
function dieHsl(hex){ const { r, g, b } = hexToRgbObj(hex || '#808080'), R = r/255, G = g/255, B = b/255;
  const mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn)/2, d = mx - mn;
  if(!d) return [0, 0, l];
  const s = d/(1 - Math.abs(2*l - 1)), h = mx === R ? ((G - B)/d + 6) % 6 : mx === G ? (B - R)/d + 2 : (R - G)/d + 4;
  return [h*60, Math.min(1, s), l]; }
const dieClamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dieRollable = id => { const el = $(id); return !!el && !el.disabled && !state.locks.has(id) && !(el.closest && el.closest('.tool-hidden')); };
/** A typeface close to this one: the same family of faces (FONT_GROUPS), never the same one. */
function similarFont(i){
  const fam = (FONTS[i] || {}).family, group = (FONT_GROUPS.find(([, fs]) => fs.includes(fam)) || [null, []])[1];
  const near = FONTS.map((f, k) => k).filter(k => k !== i && group.includes(FONTS[k].family));
  return near.length ? near[Math.floor(Math.random()*near.length)] : i;
}
/** The menus a roll may choose among (the Athanor only when there is a graph to draw; a surface's blend
 *  among those made for it, unless the roll is wild). */
function dieOptions(el, level){
  const graph = (($('forgeGraph') || {}).value || '').length > 40;
  const suits = el.id === 'textureBlend' && level !== 'wild' ? capsFor($('textureType').value).blends : null;
  return [...el.options].filter(o => !o.disabled && !o.hidden && o.value !== '' && !(el.id === 'textureType' && (TRY_GRAPH.test(o.value) || (o.value === 'athanor' && !graph))) && (!suits || suits.includes(o.value)));
}
export function rollSection(root, level = 'usual', opts = {}){
  const shift = (Math.random()*2 - 1)*15;     // gently: every colour drifts by the same few degrees…
  withLocksPreserved(() => {
    const ids = () => lockablesIn(root).filter(id => dieRollable(id) && id !== 'textureSeedValue' && id !== 'textureLight');
    // menus first: a new surface relabels its sliders, which are rolled after it
    for(const id of ids().filter(id => $(id).tagName === 'SELECT')){ const el = $(id);
      if(level === 'gentle'){
        // the surface (and every other menu) stays; a typeface may become a similar one
        if(id === 'fontFamily' && (opts.summon || Math.random() < 0.6)){ const k = similarFont(+el.value); if(String(k) !== el.value){ el.value = String(k); el.dispatchEvent(new Event('change', { bubbles: true })); } }
        continue;
      }
      const o = dieOptions(el, level);
      if(o.length > 1){ el.value = o[Math.floor(Math.random()*o.length)].value; el.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    for(const id of ids().filter(id => $(id).tagName !== 'SELECT')) rollControl(id, level, shift);
    // the light dial: a little way round when gentle, anywhere when wild
    if(root.contains && $('textureLight') && root.contains($('textureLight')) && dieRollable('textureLight') && level !== 'usual'){
      const deg = parseFloat($('textureLight').value) || 0, tilt = parseFloat(($('textureLightTilt') || {}).value); const t = isNaN(tilt) ? 100 : tilt;
      if(level === 'gentle') setLight(deg + (Math.random()*2 - 1)*15, t + (Math.random()*2 - 1)*8, false);
      else setLight(Math.random()*360, Math.random()*dialMax(), false);
    }
    if(level === 'wild' && root.contains && $('textureSeedValue') && root.contains($('textureSeedValue'))) maybeRerollSeed();
    scheduleRender();
  });
}
/** One slider or color, rolled the die's way (a section's roll goes through here, control by control). */
function rollControl(id, level, shift = 0){ const el = $(id); if(!el) return;
  if(el.type === 'range'){ const lo = +el.min || 0, hi = +el.max || 100, st = +el.step || 1;
    const v = level === 'gentle' ? dieClamp((+el.value || 0) + (Math.random()*2 - 1)*DIE_GENTLE*(hi - lo), lo, hi)
      : lo + (level === 'wild' ? Math.random() : 0.1 + Math.random()*0.8)*(hi - lo);
    el.value = String(Math.round(v/st)*st); el.dispatchEvent(new Event('input', { bubbles: true })); }
  else if(/Hex$/.test(id)){
    // (the rim light's hue rolls its colour only: its alpha is whether it is on, and how strongly)
    const keepA = id === 'textureTint7Hex' && /^#[0-9a-f]{8}$/i.test(el.value || '') ? el.value.slice(7, 9) : '', set = (k, v) => setColorField(k, keepA ? v.slice(0, 7) + keepA : v);
    // …and each moves a touch of its own
    if(level === 'gentle'){ const [h, sa, l] = dieHsl(el.value);
      set(id, hslHex((((h + shift + (Math.random()*2 - 1)*4) % 360) + 360) % 360, dieClamp(sa + (Math.random()*2 - 1)*0.05, 0, 1), dieClamp(l + (Math.random()*2 - 1)*0.03, 0.02, 0.98))); }
    else if(level === 'wild') set(id, hslHex(Math.random()*360, Math.random(), 0.05 + Math.random()*0.9));
    else { const c = hexToRgbObj(el.value || '#808080'), l = (Math.max(c.r, c.g, c.b) + Math.min(c.r, c.g, c.b))/510;
      set(id, hslHex(Math.random()*360, 0.3 + Math.random()*0.5, dieClamp(l + (Math.random() - 0.5)*0.2, 0.08, 0.92))); } }
  else if(el.tagName === 'SELECT' && level !== 'gentle'){ const o = dieOptions(el, level); if(o.length > 1){ el.value = o[Math.floor(Math.random()*o.length)].value; el.dispatchEvent(new Event('change', { bubbles: true })); } }
  // (switches are never rolled: they show and hide whole sections, and sit beside the locks)
}
// ONE CONTROL AT RANDOM (ROADMAP E3, Filter Forge's Ctrl-click): Ctrl- or ⌘-click a control's name on a desk, or
// hold it on a phone, and only that control rolls, the dice's way. A locked control stays, and says so.
export function rollByLabel(label){
  const field = label.closest && label.closest('.field'); if(!field) return false;
  const ids = lockablesIn(field).filter(id => $(id).tagName === 'SELECT' || $(id).type === 'range' || /Hex$/.test(id)); if(!ids.length) return false;
  const free = ids.filter(dieRollable); if(!free.length){ toast(DIE.oneLocked); return true; }
  const before = serializeCurrentSettings();
  withLocksPreserved(() => { for(const id of free) rollControl(id, dieLevel()); scheduleRender(); });
  if(JSON.stringify(before) !== JSON.stringify(serializeCurrentSettings())){ murmur.play('reroll'); commitSoon(); }
  return true;
}
const summonIn = root => Object.keys(DIE_SUMMONS).map(id => $(id)).find(b => b && root.contains && root.contains(b));
function rollWithBack(root, level){
  const before = serializeCurrentSettings(), own = summonIn(root);
  if(own){
    // a section with a Summon button rolls through it (it rolls the remembered way). It may ask first
    // (past a few edits): the roll is recorded when its own work has run
    const old = diePending.get(root); if(old) own.removeEventListener('click', old);
    const rec = () => { diePending.delete(root); setTimeout(() => dieRolls.set(root, { before, after: serializeCurrentSettings() }), 0); };
    diePending.set(root, rec); own.addEventListener('click', rec, { once: true });
    own.click(); return;                       // (it plays its own sound)
  }
  try { rollSection(root, level); } finally { dieRolls.set(root, { before, after: serializeCurrentSettings() }); }
  murmur.play('reroll'); commitSoon();
}
function dieBack(root){
  const r = dieRolls.get(root); if(!r) return false;
  const now = serializeCurrentSettings(), same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  for(const k of new Set([...Object.keys(r.before), ...Object.keys(r.after)])) if(!same(r.before[k], r.after[k])) now[k] = r.before[k];
  dieRolls.delete(root);
  withLocksPreserved(() => restoreSettings(now));
  scheduleRender(); commitHistory(); murmur.play('undo');
  return true;
}
// every die shows the way it will roll (⚁ gently, ⚄ as usual, ⚅ wildly), and says so
const dieButtons = [];
export function paintDice(){
  const lv = dieLevel(), phone = !!(document.body && document.body.classList && document.body.classList.contains('is-mobile'));
  for(const d of dieButtons){ d.btn.textContent = DIE_GLYPH[lv];
    d.btn.title = fill(phone ? DIE.titlePhone : d.surface ? DIE.titleSurface : DIE.title, dieWord(lv)); d.btn.setAttribute('aria-label', d.btn.title); d.btn.dataset.level = lv; }
  for(const id of Object.keys(DIE_SUMMONS)){ const b = $(id); if(b && b.setAttribute){ b.title = fill((DIE.summon && DIE.summon[id]) || DIE.summonTitle, dieWord(lv)); b.dataset.level = lv; } }
}
// the dice's menu: beside the die on a desk, a sheet from the bottom on a phone (CSS)
export let dieMenu = null;
export function closeDieMenu(){ if(dieMenu){ dieMenu.remove(); dieMenu = null; } }
/** A small menu of actions: beside its anchor on a desk, a sheet from the bottom on a phone (the dice's,
 *  and a kept surface's long press). items: { glyph, label, hint, act, disabled, danger, checked, now }. */
export function openSheetMenu(anchor, title, items){
  closeDieMenu();
  const m = document.createElement('div'); m.className = 'die-menu'; m.setAttribute('role', 'menu'); m.setAttribute('aria-label', title);
  const head = document.createElement('div'); head.className = 'die-menu-head'; head.textContent = title; m.appendChild(head);
  for(const it of items){
    const b = document.createElement('button'); b.type = 'button'; b.className = 'die-menu-item' + (it.danger ? ' danger' : '') + (it.checked ? ' current' : ''); b.disabled = !!it.disabled;
    b.setAttribute('role', it.checked !== undefined ? 'menuitemradio' : 'menuitem'); if(it.checked !== undefined) b.setAttribute('aria-checked', it.checked ? 'true' : 'false');
    const g = document.createElement('span'); g.className = 'die-menu-glyph'; g.textContent = it.glyph || ''; g.setAttribute('aria-hidden', 'true');
    const t = document.createElement('span'); t.className = 'die-menu-text';
    const n = document.createElement('span'); n.className = 'die-menu-label'; n.textContent = it.label; t.appendChild(n);
    if(it.hint){ const h = document.createElement('span'); h.className = 'die-menu-hint'; h.textContent = it.hint; t.appendChild(h); }
    if(it.now){ const w = document.createElement('span'); w.className = 'die-menu-now'; w.textContent = it.now; t.appendChild(w); }
    b.appendChild(g); b.appendChild(t);
    b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); closeDieMenu(); it.act(); });
    m.appendChild(b);
  }
  document.body.appendChild(m); dieMenu = m;
  if(!document.body.classList.contains('is-mobile') && anchor && anchor.getBoundingClientRect){
    const r = anchor.getBoundingClientRect(), w = m.offsetWidth, h = m.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
    m.style.left = Math.max(8, Math.min(vw - w - 8, r.right - w)) + 'px';
    m.style.top = (r.bottom + 6 + h > vh - 8 ? Math.max(8, r.top - h - 6) : r.bottom + 6) + 'px';
  }
  const first = m.querySelector('.die-menu-item:not([disabled])'); if(first && first.focus) first.focus({ preventScroll: true });
}
function openDieMenu(root, anchor, surface){
  const lv = dieLevel(), has = dieRolls.has(root);
  openSheetMenu(anchor, DIE.menuTitle, [
    ...DIE_LEVELS.map(way => ({ glyph: DIE_GLYPH[way], label: DIE[way], hint: DIE[way + 'Hint'], checked: way === lv, now: way === lv ? DIE.now : '',
      act: () => { setDieLevel(way); rollWithBack(root, way); } })),
    ...(surface ? [{ glyph: '⁂', label: DIE.seed, hint: DIE.seedHint, act: () => { maybeRerollSeed(); scheduleRender(); murmur.play('reroll'); } }] : []),
    { glyph: '↶', label: DIE.back, hint: has ? DIE.backHint : DIE.backNone, disabled: !has, act: () => dieBack(root) }]);
}
function addDie(root, head){
  if(!root || !head || !lockablesIn(root).length) return;
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'die-btn'; btn.textContent = '⚄';
  const surface = !!($('randomSurfaceBtn') && root.contains && root.contains($('randomSurfaceBtn')));
  const phone = () => !!(document.body && document.body.classList && document.body.classList.contains('is-mobile'));
  btn.setAttribute('aria-haspopup', 'menu'); dieButtons.push({ btn, surface });
  // a long press: on a phone, the menu (as soon as it is held); on a desk, the Surface's seed alone
  let held = false, timer = 0;
  btn.addEventListener('pointerdown', () => { held = false; clearTimeout(timer);
    timer = setTimeout(() => { held = true; if(phone()) openDieMenu(root, btn, surface); }, 500); });
  btn.addEventListener('pointerup', () => clearTimeout(timer));
  btn.addEventListener('pointercancel', () => clearTimeout(timer));
  btn.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();                     // never folds the section it sits in
    const wasHeld = held; held = false;
    if(wasHeld && phone()) return;                               // (the menu is already open)
    if(surface && (e.shiftKey || wasHeld)){ maybeRerollSeed(); scheduleRender(); murmur.play('reroll'); return; }
    rollWithBack(root, dieLevel());
  });
  // (a long press must not open the phone's context menu)
  btn.addEventListener('contextmenu', e => e.preventDefault());
  // on a desk: ▾ beside the die opens the same menu
  const more = document.createElement('button'); more.type = 'button'; more.className = 'die-more'; more.textContent = '▾';
  more.title = DIE.more; more.setAttribute('aria-label', DIE.more); more.setAttribute('aria-haspopup', 'menu');
  more.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); if(dieMenu){ closeDieMenu(); return; } openDieMenu(root, more, surface); });
  const pair = document.createElement('span'); pair.className = 'die-pair'; pair.appendChild(btn); pair.appendChild(more);
  headTools(head).appendChild(pair);
}
// the switches that show a whole card, moved into its heading as an eye
const CARD_EYES = { textureToggle: 'Show the surface', borderToggle: 'Show the border', cardToggle: 'Show the inset box', vignetteToggle: 'Show the vignette' };
// inside a card, an eye only where a box shows or hides something (the spell code); an option that turns a feature on
// is a switch (Ruby approved, from the usability review: eyes on Gradient Border? and Allow [Opposition] read as
// show/hide when they are not)
const EYES = ['spellMark', 'highlightToggle', 'forgeSteps'];   // (Ruby: "my favorite one is the eye")
// ONE LANGUAGE FOR TOGGLES (Ruby: "eyes, checkboxes and switches … should mostly be the same one"): an eye where something is
// shown or hidden, a switch where a feature is turned on; no plain checkbox is left
const SWITCHES = ['bgGradientToggle', 'textGradientToggle', 'accent1Toggle', 'accent2Toggle', 'baseToggle', 'borderGradientToggle', 'cardGradientToggle',
  'customSizeToggle', 'textureTextAware', 'textureTextBlend', 'textureShapeAware', 'textureTextCut', 'textureSeeThrough', 'borderStitchOut', 'borderRounded', 'cardLink',
  'cardStitchOut', 'cardRounded', 'fullPreview'];
// A SECTION'S NAME OPENS AND FOLDS IT, in every browser (Ruby, in Firefox on a phone: tapping Border Options, Inset Box
// or Vignette did nothing). Firefox on a phone moves a tap that lands on something it thinks cannot be tapped to the
// nearest thing that can, and a heading whose only tappable parts are its eye, die, lock and ⓘ lost its taps. A heading
// that listens for taps counts as tappable there; it opens or folds its section itself, once (the browser's own toggle
// is cancelled), and leaves a tap on its own controls to them.
export function headingTaps(root){   // test hook: interface.test taps a heading and its eye
  if(!root || typeof root.querySelectorAll !== 'function') return;
  for(const s of root.querySelectorAll('details > summary')){
    if(s._taps || !s.addEventListener) continue; s._taps = true;
    s.addEventListener('click', e => {
      const d = s.parentElement, t = e.target, ctl = t && t.closest ? t.closest('button, input, select, textarea, a, label') : null;
      if(!d || d.tagName !== 'DETAILS' || (ctl && ctl !== s && s.contains(ctl))) return;
      e.preventDefault(); d.open = !d.open;
    });
  }
}
// A SECTION SWITCHED OFF still shows what it holds (Ruby, on a phone: Border Options and Inset Box "flicker" and open
// empty: all their controls live in the block their eye shows): faded under a line that says it is off, and the first
// change made there by hand (a tap, a slide, a choice; never the dice or a loaded look, whose events aren't the
// person's) switches it on, as moving the rim light does
const EYE_BLOCKS = { textureToggle: 'textureBlock', borderToggle: 'borderBlock', cardToggle: 'cardBlock', vignetteToggle: 'vignetteBlock' };
export function eyeBlock(box, card){   // test hook: textureLayers.test wakes a section that is off (the mock has no headings to install)
  const block = $(EYE_BLOCKS[box.id]); if(!block || !block.classList || !card.contains || !card.contains(block)) return;
  block.classList.add('eye-block');
  if(EYE_OFF[box.id] && typeof document.createElement === 'function' && block.insertBefore){
    const note = document.createElement('p'); note.className = 'eye-off-note'; note.textContent = EYE_OFF[box.id]; block.insertBefore(note, block.firstChild); }
  const wake = e => {
    if(box.checked || !e.isTrusted) return;
    const t = e.target; if(!t || !t.closest || !t.closest('input, select, textarea, button, label, .clr-field') || t.closest('.eye-off-note')) return;
    box.checked = true; box.dispatchEvent(new Event('change', { bubbles: true }));
  };
  for(const ev of ['click', 'input', 'change']) block.addEventListener(ev, wake, true);
}
export function installHeadings(){
  if(typeof document.querySelectorAll !== 'function') return;
  headingTaps(document);
  for(const [id, title] of Object.entries(CARD_EYES)){
    const box = $(id), card = box && box.closest && box.closest('details.card'), head = card && card.querySelector(':scope > summary');
    if(!head) continue;
    const row = box.closest('.check-row');
    box.classList.add('eye'); box.title = title; box.setAttribute('aria-label', title);
    // a click on the eye shows or hides; it never opens or folds the section
    box.addEventListener('click', e => { e.stopPropagation(); const was = card.open; setTimeout(() => { if(card.open !== was) card.open = was; }, 0); });
    headTools(head).appendChild(box);
    if(row) row.hidden = true;
    eyeBlock(box, card);
  }
  for(const id of EYES){ const box = $(id); if(box && box.classList){ box.classList.add('eye'); if(!box.title) box.title = 'Show or hide'; } }
  for(const id of SWITCHES){ const box = $(id); if(box && box.classList) box.classList.add('switch'); }
  for(const card of document.querySelectorAll('details.card[data-tab]:not([data-tab="more"])')){ addDie(card, card.querySelector(':scope > summary')); addMasterLock(card, card.querySelector(':scope > summary')); }
  for(const card of document.querySelectorAll('details.card[data-tab]')) addHintsButton(card, card.querySelector(':scope > summary'));
  // a sub-section's lock sits in the row that switches it on (its eye and name)
  for(const sub of document.querySelectorAll('.subblock[id]')){
    const prev = sub.previousElementSibling; if(prev && prev.classList && prev.classList.contains('check-row') && !prev.hidden) addMasterLock(sub, prev);
  }
  paintMasterLocks(); paintDice();
}
export function snapshotLocked(){
  const snap = {};
  for(const id of state.locks){
    const n = $(id);
    if(n) snap[id] = (n.type === 'checkbox') ? n.checked : n.value;
  }
  return snap;
}
export function restoreLocked(snap){
  // menus first: putting back a surface resets its sliders, which are put back after it
  const ids = Object.keys(snap), isMenu = id => { const n = $(id); return !!n && n.tagName === 'SELECT'; };
  for(const id of [...ids.filter(isMenu), ...ids.filter(id => !isMenu(id))]){
    const n = $(id);
    if(!n) continue;
    // unchanged: nothing to restore, and no change to announce (a texture
    // "changed" to itself would reset its knobs to their defaults)
    if((n.type === 'checkbox' ? n.checked : n.value) === snap[id]) continue;
    if(n.type === 'checkbox') n.checked = snap[id];
    else n.value = snap[id];
    // value readouts and swatches listen for these; writing .value alone
    // leaves the slider number and the colour chip showing the old value
    if(n.dispatchEvent && typeof Event === 'function'){
      n.dispatchEvent(new Event('input', { bubbles: true }));
      n.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}
/** Runs a change, then puts every locked control back the way it was. */
export function withLocksPreserved(fn){
  try { return withLocksPreservedInner(fn); } finally { if(typeof refreshUi === 'function') refreshUi(); }
}
function withLocksPreservedInner(fn){
  const snap = snapshotLocked();
  fn();
  restoreLocked(snap);
}
export function linkCopy(from, to){
  if(!from || !to) return;
  if(to.type === 'checkbox') to.checked = from.checked; else to.value = from.value;
}
/** The box's shape and the border's, brought together (the border's wins),
 *  while they are linked: after a load, a preset or Randomize, and the moment
 *  the link is switched back on. */
const BOX_LINKS = [['cardOffset','borderOffset'], ['cardThickness','borderThickness'], ['cardRounded','borderRounded'],
  ['cardRadius','borderRadius'], ['cardStitch','borderStitch'], ['cardStitchOut','borderStitchOut']];
export function syncLinkedBox(){
  if(!$('cardLink') || !$('cardLink').checked) return;
  for(const [box, border] of BOX_LINKS) linkCopy($(border), $(box));
  if(typeof refreshReadouts === 'function'){ refreshReadouts(); syncFrameVisibility(); }
}
/** Settings a preset doesn't mention start from these, so one preset's box
 *  or rounded frame never leaks into the next. */
export const FRAME_DEFAULTS = { bgGradientType:'linear', textGradientType:'linear', bgRadialX:'50', bgRadialY:'50', bgRadialR:'75', borderGrain:'0',
  borderRounded:false, borderRadius:'60', cardToggle:false, cardColor1:'#FFF6EE', cardGradientToggle:false,
  cardColor2:'#F2E2EA', cardGradientType:'linear', cardGradientAngle:'90', cardOpacity:'70', cardBlend:'source-over',
  borderBlend:'source-over', borderBloomBlend:'source-over', borderGradientAngle:'45',
  borderStitch:'solid', borderStitchOut:false, cardLink:true, cardFx:'none', cardFxAmount:'50', cardFxScale:'50', baseToggle:false, textureClearing:'0' };
// Every opacity READOUT (any slider marked data-moon) is a moon that waxes with the value — new at 0%, full
// at 100% — in place of a percentage. (It was once drawn on the slider's
// thumb; styling the thumb makes Chrome and Firefox drop native drawing for
// the whole slider, which is what turned it into a white box.)
export function paintMoons(){
  const els = document.querySelectorAll ? document.querySelectorAll('input[data-moon]') : [];
  for(const el of els){
    const out = $(el.id + 'Val');
    if(!out) continue;
    const pct = Math.max(0, Math.min(100, Math.round(+el.value || 0)));
    out.innerHTML = moonGlyph(pct / 200, { size: 18 });
    out.title = pct + '%';
    if(out.setAttribute) out.setAttribute('aria-label', 'Opacity ' + pct + '%');
  }
}
// The seed button shows the phase the Fractal Moon will take for this seed,
// so rerolling is watching the moon turn.
export function paintSeedMoon(){
  const b = $('textureSeedReroll');
  if(!b) return;
  const p = moonForSeed(parseInt($('textureSeedValue').value, 10) || 0);
  b.innerHTML = moonGlyph(p, { size: 20 });
  b.title = 'Reroll · ' + phaseName(p);
}
