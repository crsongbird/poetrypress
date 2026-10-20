/**
 * uiSkins.js — the surface's controls given skins (Ruby: "it's about time we gave these things proper skins … a magic
 * spell synthesizer, not a music synthesizer"): knobs and vertical faders drawn as the light and camera dials are (a
 * thin ring, the value as an arc of light, a limb of tick dots, a diamond for a hand), one display line that says what is
 * being turned, haptic ticks where a phone gives them, and the rule that chooses rows, knobs or faders for the Controls
 * fold. The research behind each choice: docs/prior-art/synth-controls.md §6.
 *
 *   The native <input type="range"> stays the control: saving, locks, presets, dice, the keyboard and screen readers all
 *   go through it. A skin draws it and moves it: a drag sets its value and sends `input`, letting go sends `change`, and
 *   any value set anywhere (a restore, a reading, the die) repaints the skin.
 *
 * Haiku: / a ring of thin light — / turn it, and the meadow moves; / the glass hums back, once /
 */
import { state } from './uiState.js';

const SK_NS = 'http://www.w3.org/2000/svg';
// THE KNOB'S SWEEP: 270°, from 7:30 round to 4:30 (0° up, clockwise)
const SK_SWEEP = 135;
/** The feel: a finger travels `knobTravel` px for a knob's whole range; sideways it steps down through finer tiers (the
 *  iOS scrub's: ½, ¼, ⅒), changing tier only after `tierHold` ms; a continuous value catches at its default (±`detent`
 *  of the range); a double tap within `doubleTapMs` resets it. */
export const SKIN_FEEL = { knobTravel: 200, tiers: [[0, 1], [24, 1/2], [72, 1/4], [140, 1/10]], tierHold: 300, detent: 0.02, doubleTapMs: 320, faderPad: 10 };

// ---- HAPTICS (Ruby): a tick as a value crosses a mark, nothing between them; Android's vibration (Chrome; Firefox's
// is silent, and Safari on iOS gives none to a drag since iOS 26.5: research §4). Rate-limited, short, firm. ----
let skHapticsOn = true, skLastBuzz = 0, skinSound = null;
export function setHaptics(on){ skHapticsOn = !!on; }
/** A sound to go with each tick (murmur's, which plays only while Sound is on). */
export function setSkinSound(fn){ skinSound = typeof fn === 'function' ? fn : null; }
export function haptic(kind, value){
  const now = Date.now(); if(now - skLastBuzz < 50 && kind !== 'done') return; skLastBuzz = now;
  if(skinSound) try { skinSound(kind, value); } catch(e){}
  if(!skHapticsOn) return;
  // (each kind its own feel: a mark a tick, an end a double, a tab or drawer a light touch, a long save done a good buzz)
  const V = { limit: [10, 40, 10], detent: 15, reset: 15, tab: 8, drawer: 12, done: [70, 50, 110] };
  try { if(typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(V[kind] ?? 10); } catch(e){}
}

// ---- the input a skin draws ----
const skRange = input => { const lo = +input.min || 0, hi = +input.max || 100; return [lo, hi > lo ? hi : lo + 1]; };
const skFrac = input => { const [lo, hi] = skRange(input); return Math.max(0, Math.min(1, (+input.value - lo)/(hi - lo))); };
const skTicks = input => ((input && input.dataset && input.dataset.ticks) || '').split(',').filter(Boolean).map(Number).filter(n => isFinite(n));
const skNearest = (list, v) => list.reduce((b, t) => Math.abs(t - v) < Math.abs(b - v) ? t : b, list[0]);
/** Set the slider's value as a person would: snapped to its marks when it is locked to them, caught at its default on
 *  the way past, `input` sent, a haptic tick when it crosses a mark or reaches an end. */
export function skinSet(input, v, opts = {}){
  const [lo, hi] = skRange(input), step = +input.step || 1, ticks = skTicks(input), def = input.dataset && input.dataset.def != null ? +input.dataset.def : null;
  v = Math.max(lo, Math.min(hi, v));
  if(input.dataset && input.dataset.snapTicks === '1' && ticks.length) v = skNearest(ticks, v);
  else {
    if(!ticks.length && def != null && opts.detent !== false && Math.abs(v - def) <= SKIN_FEEL.detent*(hi - lo)) v = def;
    v = Math.round(v/step)*step;
  }
  const was = +input.value;
  if(v === was) return false;
  input.value = String(v);
  const at = (v - lo)/(hi - lo);   // (where it is, 0–1: the sound's note rises with it)
  if(v === lo || v === hi) haptic('limit', at);
  else if(ticks.some(t => (was < t && v >= t) || (was > t && v <= t))) haptic('tick', at);
  else if(def != null && !ticks.length && v === def) haptic('detent', at);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}
/** Repaint whenever the value changes, however it was set. */
function skWatch(input, paint){
  if(input._skinPaints){ input._skinPaints.add(paint); return; }
  input._skinPaints = new Set([paint]);
  const all = () => { for(const p of input._skinPaints) p(); };
  const nat = typeof HTMLInputElement !== 'undefined' && Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  if(nat && nat.set) Object.defineProperty(input, 'value', { configurable: true, get(){ return nat.get.call(this); }, set(v){ nat.set.call(this, v); all(); } });
  input.addEventListener('input', all);
}
export function repaintSkins(){
  for(let i = 1; i <= 10; i++){ const input = document.getElementById && document.getElementById('texP' + i); if(input && input._skinPaints) for(const p of input._skinPaints) p(); }
}

// the angle of a point about a middle, in degrees, 0° up and clockwise (as the knob's own)
const skAngle = (dx, dy) => Math.atan2(dx, -dy)*180/Math.PI;
// a point on a circle, 0° up and clockwise; an arc between two such angles
const skAt = (r, deg) => { const a = deg*Math.PI/180; return [r*Math.sin(a), -r*Math.cos(a)]; };
const skArc = (r, d0, d1) => { if(d1 - d0 < 0.01) return ''; const [x0, y0] = skAt(r, d0), [x1, y1] = skAt(r, d1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${d1 - d0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`; };
const skSvg = (tag, cls) => { const e = document.createElementNS(SK_NS, tag); if(cls) e.setAttribute('class', cls); return e; };
// the marks a skin draws: the slider's own, or (a continuous one) a faint limb every tenth, the default's dot larger
const skLimb = input => { const t = skTicks(input); if(t.length) return { marks: t, named: true };
  const [lo, hi] = skRange(input); return { marks: Array.from({ length: 11 }, (_, k) => lo + k/10*(hi - lo)), named: false }; };

// ---- THE DISPLAY LINE: what is being turned, in one line above the controls, never under the finger ----
let skShown = null, skHideT = null;
function skDisplay(){ return typeof document !== 'undefined' && document.getElementById ? document.getElementById('texReadout') : null; }
function skLabel(input){ const l = document.getElementById(input.id + 'Label'); if(!l) return '';
  return [...l.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim(); }
/** Say what `input` is and holds: its name and value, its neighbours' names on a named slider while it moves, the
 *  fine tier. `hold`: stay until let go. */
export function showReadout(input, opts = {}){
  const d = skDisplay(); if(!d) return;
  clearTimeout(skHideT); skShown = input;
  const val = (document.getElementById(input.id + 'Val') || {}).textContent || input.value;
  const t = skTicks(input), names = input._skinNames || [];
  let around = '';
  if(opts.moving && names.length > 1){ const k = t.indexOf(skNearest(t, +input.value));
    around = `<span class="sr-near">${skEsc(names[k - 1] || '')}</span><span class="sr-near sr-next">${skEsc(names[k + 1] || '')}</span>`; }
  d.innerHTML = `<button type="button" class="sr-step" data-step="-1" aria-label="Less">−</button>`
    + `<span class="sr-name">${skEsc(skLabel(input))}</span><span class="sr-val">${skEsc(val)}</span>${around}`
    + (opts.tier && opts.tier < 1 ? `<span class="sr-tier">${opts.tier === 0.5 ? '½' : opts.tier === 0.25 ? '¼' : 'fine'}</span>` : '')
    + `<button type="button" class="sr-step" data-step="1" aria-label="More">+</button>`;
  d.classList.add('on');
  if(!opts.hold) skHideT = setTimeout(() => { d.classList.remove('on'); skShown = null; }, opts.stay || 4000);
}
const skEsc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
/** The display line's − and + nudge the control it shows by one step (one mark on a named slider): a way to change a
 *  value without dragging (WCAG 2.5.7), and the finest one. */
export function readoutStep(dir){
  const input = skShown; if(!input || state.locks.has(input.id)) return;
  const t = skTicks(input), [lo, hi] = skRange(input);
  if(t.length && input.dataset.snapTicks === '1'){ const k = t.indexOf(skNearest(t, +input.value)); skinSet(input, t[Math.max(0, Math.min(t.length - 1, k + dir))]); }
  else skinSet(input, +input.value + dir*(+input.step || 1)*((hi - lo) > 200 ? 5 : 1), { detent: false });
  input.dispatchEvent(new Event('change', { bubbles: true }));
  showReadout(input);
}

// ---- dragging: relative, so a touch never jumps the value; a KNOB turns by the angle a finger sweeps round it (up and down near its middle), a FADER by up and down, finer as the finger strays sideways; a double tap resets;
// a tap without moving shows it in the display line; the jitter of lifting a finger is taken back ----
function skDrag(el, input, mode){
  let st = null, lastTap = 0;
  el.addEventListener('pointerdown', e => {
    if(state.locks.has(input.id)){ showReadout(input); return; }
    e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch(err){}
    const now = Date.now();
    if(now - lastTap < SKIN_FEEL.doubleTapMs && input.dataset && input.dataset.def != null){
      lastTap = 0; skinSet(input, +input.dataset.def); haptic('reset'); input.dispatchEvent(new Event('change', { bubbles: true })); showReadout(input); return; }
    st = { id: e.pointerId, at: now, x: e.clientX, y: e.clientY, v: +input.value, moved: false, tier: 1, tierAt: 0, hist: [] };
    // (a KNOB turns as a thumb moves round it, in an arc — Ruby: "my thumb wants to move the knobs in a big arc": the
    //  angle the finger sweeps about the knob's middle turns it by as much; close to the middle, where the angle is
    //  unsteady, up and down turn it instead)
    if(mode !== 'fader'){ const b = el.getBoundingClientRect(); st.cx = b.left + b.width/2; st.cy = b.top + b.height/2; st.r = Math.max(12, Math.min(b.width, b.height)/2);
      st.ang = skAngle(e.clientX - st.cx, e.clientY - st.cy); st.cur = +input.value; st.ly = e.clientY; }
    el.classList.add('turning'); showReadout(input, { hold: true });
  });
  el.addEventListener('pointermove', e => {
    if(!st || e.pointerId !== st.id) return;
    if(mode !== 'fader'){ const [lo, hi] = skRange(input), dx = e.clientX - st.cx, dy = e.clientY - st.cy, ang = skAngle(dx, dy), now = Date.now();
      let da = ang - st.ang; da -= Math.round(da/360)*360; st.ang = ang;
      const step = Math.hypot(dx, dy) > st.r*0.3 ? da/(2*SK_SWEEP)*(hi - lo) : (st.ly - e.clientY)/SKIN_FEEL.knobTravel*(hi - lo);
      st.ly = e.clientY; if(Math.hypot(e.clientX - st.x, e.clientY - st.y) > 3) st.moved = true;
      st.cur = Math.max(lo, Math.min(hi, st.cur + step));
      st.hist.push([now, +input.value]); if(st.hist.length > 12) st.hist.shift(); st.lastMove = Math.hypot(e.clientX - (st.px ?? e.clientX), e.clientY - (st.py ?? e.clientY)); st.px = e.clientX; st.py = e.clientY;
      skinSet(input, st.cur); showReadout(input, { hold: true, moving: true }); return; }
    const side = Math.abs(e.clientX - st.x), want = SKIN_FEEL.tiers.reduce((t, [px, f]) => side >= px ? f : t, 1), now = Date.now();
    if(want !== st.tier){ if(!st.tierAt) st.tierAt = now; if(now - st.tierAt >= SKIN_FEEL.tierHold){ st.tier = want; st.tierAt = 0;
      // (a new tier starts from where the value is, so it doesn't jump)
      st.v = +input.value; st.y = e.clientY; } } else st.tierAt = 0;
    const [lo, hi] = skRange(input), dy = st.y - e.clientY;
    if(Math.abs(dy) > 3) st.moved = true;
    // (a fader's whole range is its own height, as a desk's; a knob's a fixed travel)
    const travel = mode === 'fader' ? Math.max(80, (el.getBoundingClientRect().height || 160)*0.88) : SKIN_FEEL.knobTravel;
    st.hist.push([now, +input.value]); if(st.hist.length > 12) st.hist.shift(); st.lastMove = Math.hypot(e.clientX - (st.px ?? e.clientX), e.clientY - (st.py ?? e.clientY)); st.px = e.clientX; st.py = e.clientY;
    skinSet(input, st.v + dy/travel*(hi - lo)*st.tier);
    el.classList.toggle('fine', st.tier < 1);
    showReadout(input, { hold: true, moving: true, tier: st.tier });
  });
  const end = e => {
    if(!st || (e && e.pointerId !== st.id)) return;
    // lifting a finger nudges it: if it had all but stopped, the value from a moment before stands
    const now = Date.now(), before = st.hist.filter(([t]) => now - t >= 60).pop();
    if(st.moved && before && (st.lastMove ?? 9) < 3 && Math.abs(+input.value - before[1]) <= (+input.step || 1)*2) skinSet(input, before[1], { detent: false });
    const moved = st.moved;
    // (only a tap that didn't move counts toward a double tap: a quick drag and a touch after it are not one)
    lastTap = moved ? 0 : st.at;
    st = null; el.classList.remove('turning', 'fine');
    if(moved) input.dispatchEvent(new Event('change', { bubbles: true }));
    showReadout(input, { stay: moved ? 1200 : 4000 });
  };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
}

// ---- THE KNOB: a ring with a gap below, the value as an arc of light, a limb of dots, a hand ending in a diamond ----
export function knobSkin(input){
  if(input._knobSkin) return input._knobSkin;
  if(typeof document.createElementNS !== 'function') return null;
  const wrap = document.createElement('div'); wrap.className = 'sk-knob'; wrap.setAttribute('aria-hidden', 'true');
  const svg = skSvg('svg'); svg.setAttribute('viewBox', '-50 -50 100 100');
  const ring = skSvg('path', 'sk-track'), fill = skSvg('path', 'sk-arc'), limb = skSvg('g', 'sk-ticks'), hand = skSvg('g', 'sk-hand');
  // (the hand is only the diamond at the ring and a short stem: the value is written in the middle — Ruby)
  hand.innerHTML = '<line x1="0" y1="-19" x2="0" y2="-25"/><path d="M0 -33 L4.2 -28 L0 -23 L-4.2 -28 Z"/>';
  const val = skSvg('text', 'sk-val'); val.setAttribute('y', '5');
  ring.setAttribute('d', skArc(36, -SK_SWEEP, SK_SWEEP));
  svg.append(ring, limb, fill, hand, val); wrap.appendChild(svg);
  const paint = () => {
    const f = skFrac(input), d = -SK_SWEEP + 2*SK_SWEEP*f, [lo, hi] = skRange(input), { marks, named } = skLimb(input);
    fill.setAttribute('d', skArc(36, -SK_SWEEP, d));
    hand.setAttribute('transform', `rotate(${d.toFixed(1)})`);
    const def = input.dataset && input.dataset.def != null ? +input.dataset.def : null, key = marks.join(',') + '|' + def;
    if(limb._key !== key){ limb._key = key;
      limb.classList.toggle('dense', marks.length > 12);
      limb.innerHTML = marks.map(v => { const [x, y] = skAt(45, -SK_SWEEP + 2*SK_SWEEP*(v - lo)/(hi - lo));
        const big = !named && def != null && Math.abs(v - def) < (hi - lo)/20;
        return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${marks.length > 12 ? 1.4 : named ? 2.3 : big ? 2.3 : 1.5}" class="${named ? 'named' : big ? 'def' : ''}"/>`; }).join(''); }
    const near = named ? skNearest(marks, +input.value) : null;
    [...limb.children].forEach((c, i) => c.classList.toggle('on', named && marks[i] === near));
    // the value as the slider's readout says it (55, 45°, 120%), or the bare number where that is too long for the middle
    const said = ((document.getElementById(input.id + 'Val') || {}).textContent || '').trim();
    val.textContent = said && said.length <= 5 ? said : String(Math.round(+input.value));
    val.classList.toggle('long', val.textContent.length > 3);
    wrap.classList.toggle('locked', state.locks.has(input.id));
  };
  skDrag(wrap, input, 'knob');
  skWatch(input, paint); paint();
  input._knobSkin = wrap;
  return wrap;
}

// ---- THE FADER: a hairline, the value a bar risen from the floor, dots at its side (names beside them when few), a cap ----
export function faderSkin(input){
  if(input._faderSkin) return input._faderSkin;
  if(typeof document.createElementNS !== 'function') return null;
  const wrap = document.createElement('div'); wrap.className = 'sk-fader'; wrap.setAttribute('aria-hidden', 'true');
  const strip = document.createElement('div'); strip.className = 'sk-strip';
  const svg = skSvg('svg'); svg.setAttribute('viewBox', '0 0 30 160'); svg.setAttribute('preserveAspectRatio', 'none');
  const P = SKIN_FEEL.faderPad, Y = f => 160 - P - f*(160 - 2*P);
  const track = skSvg('line', 'sk-track'), fill = skSvg('line', 'sk-arc'), limb = skSvg('g', 'sk-ticks'), cap = skSvg('g', 'sk-cap');
  track.setAttribute('x1', 18); track.setAttribute('x2', 18); track.setAttribute('y1', P); track.setAttribute('y2', 160 - P);
  fill.setAttribute('x1', 18); fill.setAttribute('x2', 18); fill.setAttribute('y2', 160 - P);
  cap.innerHTML = '<line x1="8" y1="0" x2="28" y2="0"/><path d="M18 -4.5 L22.5 0 L18 4.5 L13.5 0 Z"/>';
  svg.append(track, limb, fill, cap); strip.appendChild(svg); wrap.appendChild(strip);
  const names = document.createElement('div'); names.className = 'sk-names'; wrap.appendChild(names);
  const paint = () => {
    const f = skFrac(input), [lo, hi] = skRange(input), { marks, named } = skLimb(input), nm = input._skinNames || [];
    fill.setAttribute('y1', Y(f).toFixed(2)); cap.setAttribute('transform', `translate(0 ${Y(f).toFixed(2)})`);
    const def = input.dataset && input.dataset.def != null ? +input.dataset.def : null, key = marks.join(',') + '|' + def + '|' + nm.join(',');
    if(limb._key !== key){ limb._key = key;
      limb.classList.toggle('dense', marks.length > 12);   // (two dozen species: small dots, not a ladder of rings)
      limb.innerHTML = marks.map(v => { const big = !named && def != null && Math.abs(v - def) < (hi - lo)/20;
        return `<circle cx="5" cy="${Y((v - lo)/(hi - lo)).toFixed(2)}" r="${marks.length > 12 ? 1.3 : named || big ? 2.2 : 1.4}" class="${named ? 'named' : big ? 'def' : ''}"/>`; }).join('');
      // the names beside their marks, when there are few enough to read (more, and the display line says which)
      names.innerHTML = named && nm.length && nm.length <= 8 ? marks.map((v, i) => `<button type="button" tabindex="-1" style="top:${(Y((v - lo)/(hi - lo))/160*100).toFixed(2)}%">${skEsc(nm[i] || '')}</button>`).join('') : '';
      wrap.classList.toggle('named', !!names.innerHTML); }
    const near = named ? skNearest(marks, +input.value) : null;
    [...limb.children].forEach((c, i) => c.classList.toggle('on', named && marks[i] === near));
    [...names.children].forEach((c, i) => c.classList.toggle('on', named && marks[i] === near));
    wrap.classList.toggle('locked', state.locks.has(input.id));
  };
  skDrag(strip, input, 'fader');
  names.addEventListener('click', e => { const i = [...names.children].indexOf(e.target), t = skTicks(input);
    if(i >= 0 && t[i] != null && !state.locks.has(input.id)){ skinSet(input, t[i]); input.dispatchEvent(new Event('change', { bubbles: true })); showReadout(input); } });
  skWatch(input, paint); paint();
  input._faderSkin = wrap;
  return wrap;
}

// ---- THE RACK: which way each of the Controls fold's sliders is drawn ----
/** Which way each slider is drawn (Ruby's rules, 2026-10-19: "the most compact but also usable UI possible"):
 *  - three or fewer: sliders, each a row; four: four knobs in a row;
 *  - more: a rack two rows tall and four wide. A slider with marks is a FADER (one column, both rows, at the far right);
 *    any other a KNOB (one cell), the knobs clustering to the left. Four faders fill the rack as eight knobs do; four
 *    knobs and two faders fill it too. Faders only where there are two rows.
 *  - what doesn't fit is a SLIDER, on a row of its own under the rack (the last ones first): eight with two marked are
 *    four knobs, two faders and two sliders (Ruby's optimal eight).
 *  - a slider may declare itself (`as` in textureParams.js: 'knob', 'fader' or 'slider').
 *  `mode`: 'auto', 'rows' or 'rack' (the layout button). Returns each field with `as` and, for a fader, its `col`; the
 *  list carries `knobCols` and `faders` (the rack's columns). */
export const RACK = { cols: 4, rows: 2 };
export function rackPlan(fields, width, mode){
  const shown = fields.filter(f => f.shown);
  if(mode === 'rows' || (mode !== 'rack' && shown.length <= 3)) return shown.map(f => ({ ...f, as: 'row' }));
  const said = f => f.declared === 'slider' ? 'row' : f.declared;
  const cells = RACK.cols*RACK.rows;
  let sliders = shown.filter(f => said(f) === 'row');
  const rest = shown.filter(f => !sliders.includes(f));
  // (four, or fewer once the declared sliders are set apart: one row of knobs, no faders)
  const oneRow = rest.length <= RACK.cols;
  let faders = oneRow ? [] : rest.filter(f => said(f) === 'fader' || (!f.declared && f.ticks >= 2));
  // as many faders as leave room for the rest, and never fewer than two where there are marks to give them: eight with
  // two or more marked are four knobs, two faders, two sliders. A marked one past that is a knob (its marks on its limb).
  const most = Math.min(RACK.cols, Math.max(2, cells - rest.length));
  if(faders.length > most){ const keep = [...faders.filter(f => said(f) === 'fader'), ...faders.filter(f => said(f) !== 'fader').sort((a, b) => a.ticks - b.ticks)].slice(0, most); faders = faders.filter(f => keep.includes(f)); }
  let knobs = rest.filter(f => !faders.includes(f) && !sliders.includes(f));
  // what overflows the rack goes to sliders, the last knobs first (a declared knob or fader stays as long as it fits)
  while(knobs.length + 2*faders.length > cells && knobs.length){ const k = [...knobs].reverse().find(f => !f.declared) || knobs[knobs.length - 1]; knobs = knobs.filter(f => f !== k); sliders = [...sliders, k]; }
  // (a lone row of knobs beside a fader is no rack: faders only where there are two rows)
  if(faders.length && knobs.length + 2*faders.length <= RACK.cols){ knobs = [...knobs, ...faders]; faders = []; }
  // the knobs cluster: one row of up to four alone, else two rows (as many columns as that takes); the faders at their right
  const knobCols = !knobs.length ? 0 : !faders.length && knobs.length <= RACK.cols ? knobs.length : Math.ceil(knobs.length/RACK.rows);
  const fcol = new Map(faders.map((f, k) => [f, knobCols + 1 + k]));
  const plan = shown.map(f => ({ ...f, as: faders.includes(f) ? 'fader' : knobs.includes(f) ? 'knob' : 'row', col: fcol.get(f) || null }));
  plan.knobCols = knobCols; plan.faders = faders.length;
  return plan;
}
let skRackMode = 'auto';
export function setRackMode(m){ skRackMode = ['auto', 'rows', 'rack'].includes(m) ? m : 'auto'; }
export function getRackMode(){ return skRackMode; }
/** Lay out the Controls fold (#texControls): its surface sliders as rows, knobs or faders (rackPlan), each skin mounted
 *  once and kept, the native slider kept beneath it for the keyboard, the lock and the saving. */
export function layoutControls(){
  const fold = typeof document !== 'undefined' && document.getElementById && document.getElementById('texControls');
  if(!fold || !fold.classList || typeof document.createElementNS !== 'function') return;
  const fields = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => { const input = document.getElementById('texP' + i), field = input && input.parentElement;
    return { i, input, field, shown: !!field && field.style.display !== 'none', ticks: skTicks(input).length, declared: input._skinAs || null }; }).filter(f => f.input && f.field);
  const plan = rackPlan(fields, fold.clientWidth || 360, skRackMode);
  fold.classList.toggle('rack', plan.some(p => p.as !== 'row'));
  // the rack's columns: the knobs' (even shares) then one for each fader, as wide as its names need
  const body = document.getElementById('texControlsBody');
  if(body && body.style) body.style.gridTemplateColumns = plan.some(p => p.as !== 'row')
    ? [...Array(plan.knobCols || 0).fill('minmax(64px, 1fr)'), ...Array(plan.faders || 0).fill('auto')].join(' ') || '1fr' : '';
  // (two rows, each at least a knob tall, when the rack has two: a fader stands in both)
  if(body && body.style) body.style.gridTemplateRows = plan.faders || plan.filter(p => p.as === 'knob').length > RACK.cols ? 'minmax(92px, auto) minmax(92px, auto)' : '';
  for(const f of fields){
    const p = plan.find(q => q.i === f.i), as = p ? p.as : 'row';
    f.field.classList.toggle('as-knob', as === 'knob'); f.field.classList.toggle('as-fader', as === 'fader'); f.field.classList.toggle('as-row', as === 'row');
    // a fader stands in its own column at the right, both rows; a knob finds its own cell
    if(f.field.style){ f.field.style.gridColumn = as === 'fader' && p.col ? String(p.col) : ''; f.field.style.gridRow = as === 'fader' ? '1 / span 2' : ''; }
    for(const [kind, make] of [['knob', knobSkin], ['fader', faderSkin]]){
      const sk = f.input['_' + kind + 'Skin'];
      if(as === kind){ const k = make(f.input); if(k && k.parentNode !== f.field) f.field.insertBefore(k, f.field.firstChild); }
      else if(sk && sk.parentNode) sk.parentNode.removeChild(sk);
    }
  }
  repaintSkins();
}
