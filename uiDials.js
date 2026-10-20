/**
 * uiDials.js — the light dial, the camera dial, and the angle sliders' ticks
 *
 * Split from appEvents.js (its wiring, the listeners, stays there, in the order it runs).
 */
import { $ } from './appOptions.js';
import { SURFACE_BLENDS, scheduleRender } from './canvasRenderer.js';
import { cameraGuide, ringSunGuide } from './stepsGenerative.js';
import { capsFor, paramsFor } from './textureGenerators.js';
import { commitSoon } from './uiHistory.js';
import { pageSunAt } from './texCore.js';
import { state } from './uiState.js';
import { texturesSettled } from './textureService.js';
import { setColorField } from './appEvents.js';
import { draftWhileDragging } from './uiSurface.js';

// The centre is light from straight overhead; drag outward toward where the
// light comes FROM. Direction is degrees clockwise from north (as the old pad
// was, so saved looks keep their light); distance is how LOW the light is:
// at the rim, raking (100, the old behaviour), at the centre, overhead (0).
// The arrow points the way the light travels and strengthens as it lowers.
// Eight ticks on the rim snap to 45°; ⟲ resets.
export const LIGHT_DEFAULT = { deg: 315, tilt: 100 };
// THE RIM LIGHT (ROADMAP C2; Ruby: a second handle on the dial, in a second colour, under the first, chosen with a
// button as Two Surfaces' Upper and Lower are): a second light from its own place on the dial, in its own colour. Its
// hue (textureTint7Hex) holds its strength in its alpha: 0 is off. Moving its handle turns it on, at RIM_ON; ⟲ while it
// is chosen turns it off. Where the page's lights reach a surface (caps.rig) the dial shows ☉ Main / ◐ Rim, the Ambient
// slider and the light hues; the finger moves the light chosen.
export const RIM_DEFAULT = { deg: 135, tilt: 100, hex: '#CFE3FF' }, RIM_ON = '99';
/** Whether the page's lights reach this surface (the rim, the Ambient slider, the light hues). */
export function lightsReach(type = ($('textureType') || {}).value){ return !!((capsFor(type) || {}).rig || type === 'athanor'); }
function rimHex(){ const v = String(($('textureTint7Hex') || {}).value || ''); return /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v) ? v : RIM_DEFAULT.hex + '00'; }
/** The rim light now: its way and height (as the dial's), and whether it is on (its hue's alpha above 0). */
function rimNow(){ const d = parseFloat(($('textureRim') || {}).value), t = parseFloat(($('textureRimTilt') || {}).value), h = rimHex();
  return { deg: isNaN(d) ? RIM_DEFAULT.deg : d, tilt: isNaN(t) ? RIM_DEFAULT.tilt : t, on: h.length === 7 || h.slice(7, 9).toUpperCase() !== '00' }; }
/** Which light the finger moves: 'main', or 'rim' (only where the page's lights reach). */
export function lightPick(){ return state.ui.lightPick === 'rim' && lightsReach() ? 'rim' : 'main'; }
/** The rim light's place into its two hidden fields (no render: a look or a preset is being put back). */
export function putRim(deg, tilt){
  const set = (id, v) => { const el = $(id); if(el) el.value = String(v); };
  set('textureRim', Math.round((((+deg || 0) % 360) + 360) % 360)); set('textureRimTilt', Math.round(Math.max(0, Math.min(dialMax(), isNaN(+tilt) ? RIM_DEFAULT.tilt : +tilt))));
}
/** The rim light on (at RIM_ON, its own colour kept) or off (its alpha 0). */
export function setRimOn(on){ const h = rimHex().slice(0, 7); setColorField('textureTint7Hex', h + (on ? RIM_ON : '00')); }
/** THE DIALS' REACH (Ruby: "we used to be able to move this right to the edge"): a handle at 100% sits on ☉'s ring, under
 *  the finger, its centre this far from the middle (in the dial's 100-unit box); past the rim (to 130%, an engine-lit
 *  surface's lower light) it goes on outside the ring, to the dashed circle. The camera's View the same. */
export const DIAL_R = 26;
export function syncLightPad(){
  const deg = parseFloat($('textureLight').value) || 0, tilt = $('textureLightTilt') ? parseFloat($('textureLightTilt').value) : 100;
  const k = Math.max(0, Math.min(130, isNaN(tilt) ? 100 : tilt)) / 100, a = deg * Math.PI / 180;
  const set = (id, attrs) => { const el = $(id); if(el && el.setAttribute) for(const key in attrs) el.setAttribute(key, attrs[key]); };
  // the dot slides from the heart of ☉ toward the rim
  const hx = Math.sin(a) * DIAL_R * k, hy = -Math.cos(a) * DIAL_R * k;
  set('lightHandle', { cx: hx.toFixed(2), cy: hy.toFixed(2) }); set('lightMainClipDot', { cx: hx.toFixed(2), cy: hy.toFixed(2) });
  // 🜚 AS A SHADOW (Ruby): the ☉ at the middle casts it away from the light, out of the rim on the far side, longer and
  // darker as the light lowers (none overhead); the rim light casts its own, as strong as the rim light is
  // (its curls grow with it, small with the light high, flaring as it lowers: Ruby)
  const shadowOf = (body, group, d, kk, strength) => { const kc = Math.min(1.3, kk), tip = 26 + 3 + 16*kc, curl = (0.55 + 0.5*kc).toFixed(3);
    const shape = { points: `-3.4,-24.5 3.4,-24.5 0,${(-tip).toFixed(2)}` }, curls = { transform: `translate(0 -24.5) scale(${curl}) translate(0 24.5)` }, turn = `rotate(${((d + 180) % 360).toFixed(1)})`;
    const op = kk < 0.04 || strength <= 0 ? 0 : (0.35 + 0.65*Math.min(1, kk))*strength;
    set(body, shape); set(body.replace('Body', 'Curls'), curls); set(group, { transform: turn, opacity: op.toFixed(2) });
    return { shape, curls, turn, op }; };
  const mainShadow = shadowOf('lightSpikeBody', 'lightSpike', deg, k, 1);
  // the rim light's handle, under the main's: hollow while it is off, fainter as it is weaker; where the two meet, the
  // lens they share mixes to white
  const reach = lightsReach(), R = rimNow(), rk = Math.max(0, Math.min(130, R.tilt))/100, ra = R.deg*Math.PI/180;
  const rx = Math.sin(ra)*DIAL_R*rk, ry = -Math.cos(ra)*DIAL_R*rk, rs = rimStrengthNow();
  set('lightRimHandle', { cx: rx.toFixed(2), cy: ry.toFixed(2), opacity: R.on ? (0.35 + 0.65*rs/100).toFixed(2) : '1' }); set('lightOverlap', { cx: rx.toFixed(2), cy: ry.toFixed(2) });
  const rimShadow = shadowOf('lightRimSpikeBody', 'lightRimSpike', R.deg, rk, reach && R.on ? rs/100 : 0);
  // where the two shadows cross, the overlap colour (the rim's shadow seen through the main's), as the handles mix
  set('lightSpikeMaskG', { transform: mainShadow.turn }); set('lightSpikeMaskBody', mainShadow.shape); set('lightSpikeMaskCurls', mainShadow.curls);
  set('lightSpikeOverlapG', { transform: rimShadow.turn }); set('lightSpikeOverlapBody', rimShadow.shape); set('lightSpikeOverlapCurls', rimShadow.curls);
  set('lightSpikeOverlap', { opacity: Math.min(mainShadow.op, rimShadow.op).toFixed(2) });
  const pick = lightPick();
  const dial = $('lightDial');
  if(dial && dial.classList){ dial.classList.toggle('has-rim', reach); dial.classList.toggle('rim-on', reach && R.on); dial.classList.toggle('pick-rim', pick === 'rim'); }
  const row = $('lightRow'); if(row && row.classList){ row.classList.toggle('has-rig', reach); row.classList.toggle('pick-rim', reach && pick === 'rim'); }
  // THE TWO DIALS SIDE BY SIDE (Ruby: "always aligned … it looks good when it was symmetrical"): with Main / Rim above
  // the light dial, the camera's Zoom above its dial is made as tall, so the two sit level
  { const seg = $('lightSeg'), tr = row && row.closest ? row.closest('.tool-row') : null;
    if(tr && tr.classList && tr.style){ const on = !!seg && !!seg.getBoundingClientRect;   // (the selector always shows now: faded where the page's lights don't reach)
      tr.classList.toggle('has-seg', on);
      if(on && typeof getComputedStyle === 'function'){ const r = seg.getBoundingClientRect(), cs = getComputedStyle(seg), h = r.height + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
        if(h > 0) tr.style.setProperty('--light-seg-h', h.toFixed(1) + 'px'); } } }
  { const seg = $('lightSeg'); if(seg && seg.querySelectorAll) seg.querySelectorAll('[data-light]').forEach(b => { const me = b.dataset.light === pick; b.classList.toggle('active', me); b.setAttribute('aria-pressed', String(me)); b.classList.toggle('dim', b.dataset.light === 'rim' && !R.on); }); }
  { const r7 = $('tint7Row'); if(r7 && r7.classList) r7.classList.toggle('rim-off', !R.on); }
  // the numbers beneath are the chosen light's
  const pd = pick === 'rim' ? R.deg : deg, pt = pick === 'rim' ? R.tilt : tilt;
  if(dial && dial.querySelectorAll) dial.querySelectorAll('.ld-tick').forEach(t => t.classList.toggle('active', pt >= 99 && Math.abs(((pd - +t.dataset.deg + 540) % 360) - 180) < 0.5));
  if(dial && dial.setAttribute) dial.setAttribute('aria-valuetext', `${pick === 'rim' ? 'rim light ' : ''}${Math.round(pd)}°, ${Math.round(isNaN(pt) ? 100 : pt)}% low`);
  if(dial && dial.classList) dial.classList.toggle('past-rim', tilt > 100);
  // its numbers, beneath (not while one is being typed)
  const di = $('lightDegIn'), ti = $('lightTiltIn'), ai = $('lightAmbIn'), ae = typeof document !== 'undefined' ? document.activeElement : null;
  if(di && ae !== di) di.value = String(Math.round(pd)); if(ti && ae !== ti){ ti.value = String(Math.round(isNaN(pt) ? 100 : pt)); ti.max = String(dialMax()); }
  if(ai && ae !== ai) ai.value = String(Math.round(parseFloat(($('textureAmbient') || {}).value) || 0));
  // the rim light's strength, under the dial while Rim is chosen
  const rki = $('lightRimKIn'), rkr = $('rimStrength');
  if(rki && ae !== rki) rki.value = String(rs); if(rkr && ae !== rkr) rkr.value = String(rs);
}
/** The rim light's strength, 0–100 (its hue's alpha; 0 while it is off). */
function rimStrengthNow(){ const h = rimHex(); return h.length === 7 ? 100 : Math.round(parseInt(h.slice(7, 9), 16)/255*100); }
/** The rim light to a strength (0 turns it off; its colour and place kept). */
export function setRimStrength(v, commit){
  if(!commit) draftWhileDragging();
  const a = Math.round(Math.max(0, Math.min(100, +v || 0))/100*255);
  setColorField('textureTint7Hex', rimHex().slice(0, 7) + a.toString(16).padStart(2, '0').toUpperCase());
  syncLightPad(); scheduleRender(); if(commit && typeof commitSoon === 'function') commitSoon();
}
export function setLight(deg, tilt, commit){
  if(!commit) draftWhileDragging();
  $('textureLight').value = String(Math.round(((deg % 360) + 360) % 360));
  if($('textureLightTilt')) $('textureLightTilt').value = String(Math.round(Math.max(0, Math.min(dialMax(), tilt))));
  syncLightPad(); scheduleRender(); if(commit && typeof commitSoon === 'function') commitSoon();
}
/** The rim light moved (and so on, if it was off: a light moved that gives nothing would be a control that does nothing). */
function setRim(deg, tilt, commit){
  if(!commit) draftWhileDragging();
  putRim(deg, tilt); if(!rimNow().on) setRimOn(true);
  syncLightPad(); scheduleRender(); if(commit && typeof commitSoon === 'function') commitSoon();
}
/** The chosen light to (deg, tilt). */
// (the dial's own moves show the sun's guide: held while dragging, a moment after a click, a key or a typed number)
export function movePicked(deg, tilt, commit){ if(lightPick() === 'rim') setRim(deg, tilt, commit); else setLight(deg, tilt, commit); drawDialGuide(true, !!commit); }
export function pickedNow(){ if(lightPick() === 'rim'){ const R = rimNow(); return { deg: R.deg, tilt: R.tilt }; }
  const t = parseFloat(($('textureLightTilt') || {}).value); return { deg: parseFloat($('textureLight').value) || 0, tilt: isNaN(t) ? 100 : t }; }
// (Ruby: a second dial for the camera, so the light dial is the light's alone.) Its handle is where the camera stands:
// round the dial, its turn; drawn out from the middle, how low it looks (the middle straight down — or, on Ringworld,
// straight up — the rim low across); the slider under it, a wheel or a pinch zoom it. While it moves, a guide of the shot is drawn
// over the page at once (a plank's grid, a ring's edges), and the surface follows when it has been made.
/** Where a surface's camera starts. */
export function cameraStart(type){ const c = (capsFor(type) || {}).camera || {};
  // a surface whose camera the seed places (Ruby: "randomize the initial camera position with the seed"): each seed its
  // own shot within the ranges it names, still the dial's to change
  if(c.seeded){ const seed = parseInt(($('textureSeedValue') || {}).value, 10) || 0, r = k => { let h = Math.imul((seed ^ 0x3C6EF372) >>> 0, 2654435761) ^ Math.imul(k + 1, 0x85EBCA6B); h = Math.imul(h ^ (h >>> 15), 0x2C1B3C6D); return ((h ^ (h >>> 13)) >>> 0)/4294967296; };
    const at = (rg, k) => Math.round(rg[0] + (rg[1] - rg[0])*r(k)); return { turn: at(c.seeded.turn, 1), view: at(c.seeded.view, 2), zoom: at(c.seeded.zoom, 3) }; }
  return { turn: c.turn ?? 0, view: c.view ?? 0, zoom: c.zoom ?? 100 }; }
// a new seed rolled: a surface whose camera the seed places takes its new shot (unless the camera is locked)
export function seedCamera(){ const type = ($('textureType') || {}).value, c = (capsFor(type) || {}).camera;
  if(!c || !c.seeded || state.locks.has('cameraTurn')) return; const d = cameraStart(type); putCamera(d.turn, d.view, d.zoom); }
export function cameraNow(){ const v = id => parseFloat(($(id) || {}).value); const t = v('cameraTurn'), w = v('cameraView'), z = v('cameraZoom');
  return { turn: isNaN(t) ? 0 : t, view: isNaN(w) ? 0 : w, zoom: isNaN(z) ? 100 : z }; }
/** The camera into its three hidden fields (no render: a look or a preset is being put back). */
export function putCamera(turn, view, zoom){
  const set = (id, v) => { const el = $(id); if(el) el.value = String(v); };
  set('cameraTurn', Math.round(((+turn || 0) % 360 + 360) % 360)); set('cameraView', Math.round(Math.max(0, Math.min(100, +view || 0))));
  set('cameraZoom', Math.round(Math.max(25, Math.min(400, +zoom || 100)))); syncCameraPad();
}
export function syncCameraPad(){
  const c = cameraNow(), k = Math.max(0, Math.min(100, c.view))/100, a = c.turn*Math.PI/180;
  const set = (id, attrs) => { const el = $(id); if(el && el.setAttribute) for(const key in attrs) el.setAttribute(key, attrs[key]); };
  const hx = Math.sin(a)*DIAL_R*k, hy = -Math.cos(a)*DIAL_R*k;
  set('cameraHandle', { cx: hx.toFixed(2), cy: hy.toFixed(2) });
  set('cameraSight', { x1: hx.toFixed(2), y1: hy.toFixed(2), x2: '0', y2: '0', opacity: k < 0.04 ? '0' : '0.8' });
  // the frame: what the camera sees, turned with it, smaller as it zooms in
  const f = Math.max(0.2, Math.min(2.4, 100/c.zoom)), w = 16*f, h = 22*f;
  set('cameraFrame', { x: (-w/2).toFixed(2), y: (-h/2).toFixed(2), width: w.toFixed(2), height: h.toFixed(2), transform: `rotate(${c.turn.toFixed(1)})` });
  const dial = $('cameraDial');
  if(dial && dial.querySelectorAll) dial.querySelectorAll('.ld-tick').forEach(t => t.classList.toggle('active', c.view >= 99 && Math.abs(((c.turn - +t.dataset.deg + 540) % 360) - 180) < 0.5));
  if(dial && dial.setAttribute) dial.setAttribute('aria-valuetext', `turned ${Math.round(c.turn)}°, ${Math.round(c.view)}% low, zoom ${Math.round(c.zoom)}%`);
  const ae = typeof document !== 'undefined' ? document.activeElement : null;
  for(const [id, v] of [['cameraTurnIn', c.turn], ['cameraViewIn', c.view]]){ const el = $(id); if(el && ae !== el) el.value = String(Math.round(v)); }
  { const z = $('cameraZoomSlider'); if(z && ae !== z) z.value = String(Math.round(Math.log2(Math.max(25, Math.min(400, c.zoom))/100)*100)); }
}
export function setCamera(turn, view, zoom, commit){
  if(!commit) draftWhileDragging();
  putCamera(turn, view, zoom); scheduleRender(); drawCameraGuide(!commit);
  if(commit && typeof commitSoon === 'function') commitSoon();
}
// THE GUIDE: the shot as lines over the page, at once, while the surface is still being made
/** A guide's canvas over the page (made the first time), sized to it now; null where there is no page to draw over. */
function guideCanvas(cls){
  const pc = $('poemCanvas'), wrap = pc && pc.parentElement;
  if(!pc || !wrap || typeof document.createElement !== 'function' || !pc.getBoundingClientRect) return null;
  let g = wrap.querySelector && wrap.querySelector('.' + cls);
  if(!g){ g = document.createElement('canvas'); g.className = cls; g.setAttribute('aria-hidden', 'true'); wrap.appendChild(g); }
  return { g, size(){ const r = pc.getBoundingClientRect(), wr = wrap.getBoundingClientRect(), dpr = Math.min(1.5, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);
    Object.assign(g.style, { left: (r.left - wr.left) + 'px', top: (r.top - wr.top) + 'px', width: r.width + 'px', height: r.height + 'px' });
    g.width = Math.max(1, Math.round(r.width*dpr)); g.height = Math.max(1, Math.round(r.height*dpr)); return dpr; } };
}
/** The Ringworlds' view as the guides need it (the camera's, and where on the ring you stand). */
function ringGuideOf(kind, type, c){
  const v = id => parseFloat(($(id) || {}).value);
  // (Ringworld's walls follow Landforms, half its range; where you stand across the band is the seed's)
  // (a knob found by its key: Altitude is the seventh on Ringworld, the sixth on the Painted Ringworld)
  const slot = key => 'texP' + (paramsFor(type).findIndex(p => p.key === key) + 1);
  return kind === 'ring' ? { band: v('texP1'), walls: v('texP2')*0.5, altitude: v(slot('alt')), placeBy: 'where the seed says', seed: v('textureSeedValue') >>> 0, lens: 75, zoom: c.zoom, look: c.turn, up: c.view/100, curved: type === 'ringpaint' }
    : kind === 'ellipse' ? { centre: 0.15 + 0.7*(v(slot('height')) || 0)/100 } : null;
}
export function drawCameraGuide(on){
  const caps = capsFor(($('textureType') || {}).value) || {}, kind = caps.camera && caps.camera.guide;
  const G = kind ? guideCanvas('cam-guide') : null; if(!G) return;
  const g = G.g;
  if(!on){ holdGuideUntilMade(g); return; }
  g._seq = (g._seq || 0) + 1;
  const dpr = G.size(), x = g.getContext('2d'); if(!x) return;
  const u = Math.min(g.width, g.height), aspX = g.width/u, aspY = g.height/u, c = cameraNow();
  const type = ($('textureType') || {}).value, deg0 = parseFloat(($('textureLight') || {}).value) || 0, t0 = parseFloat(($('textureLightTilt') || {}).value);
  // (the Black Hole's disc stands where the light dial places it)
  // (the Transmutation Circle stands where the camera dial places it, as large as its Circle Size)
  const ring = kind === 'disc' ? { place: dialGuidePlace({ k: 'place' }, deg0, isNaN(t0) ? 100 : t0, aspX, aspY) }
    : kind === 'circle' ? { place: dialGuidePlace({ k: 'place' }, c.turn, c.view, aspX, aspY, { size: parseFloat(($('texP1') || {}).value) || 100 }) } : ringGuideOf(kind, type, c);
  const lines = cameraGuide(kind, aspX, aspY, c, ring);
  x.clearRect(0, 0, g.width, g.height); x.lineCap = 'round'; x.lineJoin = 'round';
  const accent = (getComputedStyle(document.body).getPropertyValue('--accent') || '#E7A0B8').trim() || '#E7A0B8';
  for(const pass of [0, 1]) for(const L of lines){
    x.strokeStyle = pass ? accent : 'rgba(0,0,0,.55)'; x.globalAlpha = L.bold ? 0.95 : 0.6;
    x.lineWidth = (L.bold ? 2.2 : 1)*dpr*(pass ? 1 : 2.6);
    x.beginPath(); L.pts.forEach((p, i) => i ? x.lineTo(p[0]*u, p[1]*u) : x.moveTo(p[0]*u, p[1]*u)); x.stroke(); }
  g.classList.add('on');
}
// THE SUN'S GUIDE (Ruby: "a sun position guide that shows up on the image also before the render"): while the light dial
// moves, where the light comes from is drawn over the page at once, before the surface is made: the Painted Ringworld's
// sun where it will stand in the picture (an arrow at the edge when it is out of the frame); any other lit surface's
// light as a sun at the dial's place on the page (the middle overhead, the rim the page's edge), turned with the camera
// where the camera turns the ground under it; the rim light's in its own colour
/** Whether the light dial is a light this surface shows from somewhere (not a wind, a flow, or the Ringworlds' day). */
/** WHAT THE LIGHT DIAL PLACES, for its guide (Ruby: "anytime we use a light dial as a position selector or a light
 *  selector we need some kind of indicator of where on screen we are positioning a thing before the render"): a list of
 *  marks, each drawn over the page at once while the dial moves and until the new picture has landed.
 *   sun      the light, where it comes from (the dial laid on the page; the Painted Ringworld's through its camera)
 *   impact   where Crackle's cracks burst from (on the far side from the light, as the Spreading Cracks part strikes)
 *   place    where a thing stands (Transmutation Circle: its centre, by dialSquare, and its circle's size)
 *   arrow    a heading the dial gives (wind, rain, a flow, a breath): `way` +1 toward the handle, −1 away from it
 *   axis     a line the dial lays (hatching, field lines): along the handle's line, or across it (`across`)
 *  (A surface whose dial is the day, Ringworld, has its camera's guide only.) */
const DIAL_GUIDES = {
  crackle:     [{ k: 'sun' }, { k: 'impact' }],
  blackhole:   [{ k: 'disc' }],                              // (the light dial places the hole: its disc's wireframe there)
  snow:        [{ k: 'arrow', fall: true }],                 // (the wind blows from the handle, the flakes fall with it: Wind is how far)
  rainstreaks: [{ k: 'arrow', way: -1 }],                    // (the rain comes from the handle)
  hatch:       [{ k: 'axis' }],                              // (strokes along the handle's line)
  suminagashi: [{ k: 'axis' }],                              // (the breaths push both ways along it)
  flowfield:   [{ k: 'arrow', way: 1 }],                     // (the current runs toward the handle)
  aurora:      [{ k: 'arrow', way: 1 }],                     // (Hem Hue to Curtain Hue, toward the handle)
  aurorasky:   [{ k: 'axis', lean: true }],                  // (the rays' tops lean toward the handle's side)
  watercolour: [{ k: 'arrow', way: 1, tilted: true }],       // (the pigment runs toward the handle, more as it lowers)
  landscape:   [{ k: 'sun' }],      // (its painted sun follows the dial, kept above the horizon)
};
export function dialGuideMarks(type){
  if(type === 'ringpaint') return [{ k: 'sun', ring: true }];
  if(DIAL_GUIDES[type]) return DIAL_GUIDES[type];
  const caps = capsFor(type) || {};
  return caps.light && !caps.dirOnly && (!caps.dial || /Light|Sun/.test(caps.dial)) ? [{ k: 'sun' }] : [];
}
/** Where the guide marks stand on a page aspX × aspY (the shorter side 1), for a dial at deg, tilt (0–100+). */
export function dialGuidePlace(mark, deg, tilt, aspX, aspY, knobs = {}){
  const a = (deg - 90)*Math.PI/180, hx = Math.cos(a), hy = Math.sin(a), k = Math.max(0, tilt)/100;
  if(mark.k === 'impact') return { x: aspX*(0.5 - hx*0.38), y: aspY*(0.5 - hy*0.38) };
  if(mark.k === 'place'){ const kk = Math.min(1, k), m = Math.max(Math.abs(hx), Math.abs(hy)) || 1;
    return { x: aspX*(0.5 + hx/m*kk/2), y: aspY*(0.5 + hy/m*kk/2), r: 0.34*(knobs.size || 100)/100 }; }
  if(mark.k === 'arrow' || mark.k === 'axis'){ const s = mark.k === 'arrow' ? mark.way || 1 : 1;
    let t = [hx*s, hy*s];
    if(mark.fall){ const w = Math.max(0, Math.min(1, (knobs.wind ?? 50)/100)); t = [-hx*1.6*w, 1 - hy*1.6*w]; }   // (genSnow: gravity and the wind)
    if(mark.lean) t = [0.35*hx, -1];                                                                         // (whimAurora: hem to top)
    const m = Math.hypot(t[0], t[1]) || 1;
    return { x: aspX/2, y: aspY/2, dx: t[0]/m, dy: t[1]/m, strength: mark.tilted ? Math.min(1, k) : 1 }; }
  return null;
}
/** Keep a guide up until the picture it shows has been made (Ruby: "renders can take a long time even for simple
 *  textures"), at least `min` ms after the last move, at most a minute; then fade it. A move meanwhile (`g._seq`) keeps it. */
function holdGuideUntilMade(g, min = 700){
  const seq = g._seq = (g._seq || 0) + 1, t0 = Date.now();
  setTimeout(() => { if(seq !== g._seq) return;
    let fired = false; const once = () => { if(fired || seq !== g._seq) return; fired = true;
      setTimeout(() => { if(seq === g._seq) g.classList.remove('on'); }, Math.max(0, min - (Date.now() - t0))); };
    texturesSettled().then(once); setTimeout(once, 60000); }, 140);   // (after the render has asked for its surface)
}
export function drawDialGuide(on, linger){
  const type = ($('textureType') || {}).value, marks = dialGuideMarks(type), G = marks.length ? guideCanvas('sun-guide') : null; if(!G) return;
  const g = G.g;
  if(!on){ holdGuideUntilMade(g); return; }
  g._seq = (g._seq || 0) + 1;
  const dpr = G.size(), x = g.getContext('2d'); if(!x) return;
  const u = Math.min(g.width, g.height), aspX = g.width/u, aspY = g.height/u, c = cameraNow(), caps = capsFor(type) || {};
  const cs = getComputedStyle(document.body), col = n => (cs.getPropertyValue(n) || '').trim();
  const main = col('--accent') || '#E7A0B8', rimC = col('--accent-2') || '#9FD0E8', dark = 'rgba(0,0,0,.55)';
  // a light's place on the page: the Painted Ringworld's sun through its camera; else the dial laid on the page, its middle
  // the page's, in the dial's own direction exactly (Ruby: "light guide seems off": stretched to a tall page it stood
  // nearer upright than the dial), as far out as the dial's handle is, its rim at the page's edge along that way; turned
  // against a camera that turns the ground
  const turn = caps.camera && caps.camera.guide === 'plane' ? c.turn : 0;
  const sunOf = (ring, deg, tilt) => {
    if(ring){ const p = ringSunGuide(aspX, aspY, ringGuideOf('ring', type, c), deg, tilt/100); return p ? { x: p.x, y: p.y, up: p.up } : null; }
    return { ...pageSunAt(deg - turn, tilt, aspX, aspY), up: true }; };
  const deg0 = parseFloat($('textureLight').value) || 0, t0 = parseFloat(($('textureLightTilt') || {}).value), tilt0 = isNaN(t0) ? 100 : t0;
  const lights = [[deg0, tilt0, main]];
  if(lightsReach(type)){ const R = rimNow(); if(R.on || lightPick() === 'rim') lights.push([R.deg, R.tilt, rimC]); }
  x.clearRect(0, 0, g.width, g.height); x.lineCap = 'round'; x.lineJoin = 'round';
  // each mark drawn twice: a dark halo, then its colour, so it reads on any picture
  const twice = (fn, colr) => { for(const pass of [0, 1]){ x.strokeStyle = x.fillStyle = pass ? colr : dark; fn(pass, (pass ? 2 : 5)*dpr); } };
  const head = (X, Y, a, len, w) => { x.lineWidth = w; x.beginPath(); x.moveTo(X, Y); x.lineTo(X - Math.cos(a - 0.45)*len, Y - Math.sin(a - 0.45)*len); x.moveTo(X, Y); x.lineTo(X - Math.cos(a + 0.45)*len, Y - Math.sin(a + 0.45)*len); x.stroke(); };
  // (the knobs a mark needs, found by their labels: the Transmutation Circle's size, the snow's wind)
  const knob = label => { const i = paramsFor(type).findIndex(q => q.label === label); const v = i < 0 ? NaN : parseFloat(($('texP' + (i + 1)) || {}).value); return isNaN(v) ? undefined : v; };
  const knobs = { size: knob('Circle Size') ?? 100, wind: knob('Wind') };
  for(const mark of marks){
    // (the Black Hole's disc where the light dial puts it, as the camera dial sees it)
    if(mark.k === 'disc'){ const L = cameraGuide('disc', aspX, aspY, c, { place: dialGuidePlace({ k: 'place' }, deg0, tilt0, aspX, aspY) });
      twice((pass, w) => { for(const ln of L){ x.lineWidth = w*(ln.bold ? 1 : 0.5); x.beginPath(); ln.pts.forEach((p, i) => i ? x.lineTo(p[0]*u, p[1]*u) : x.moveTo(p[0]*u, p[1]*u)); x.stroke(); } }, main);
      continue; }
    if(mark.k === 'sun'){
      for(const [deg, t, colr] of lights){ const p = sunOf(mark.ring, deg, isNaN(t) ? 100 : t); if(!p) continue;
        // (out of the frame: at its edge, with an arrow pointing out toward it)
        const m = 0.045, ex = Math.max(m, Math.min(aspX - m, p.x)), ey = Math.max(m, Math.min(aspY - m, p.y)), out = ex !== p.x || ey !== p.y;
        const X = ex*u, Y = ey*u, rs = u*0.022;
        x.globalAlpha = p.up ? 0.95 : 0.5;
        twice((pass, w) => { x.lineWidth = w; x.beginPath(); x.arc(X, Y, rs, 0, Math.PI*2); pass ? x.fill() : x.stroke();
          for(let q = 0; q < 8; q++){ const a = q*Math.PI/4; x.beginPath(); x.moveTo(X + Math.cos(a)*rs*1.6, Y + Math.sin(a)*rs*1.6); x.lineTo(X + Math.cos(a)*rs*2.6, Y + Math.sin(a)*rs*2.6); x.stroke(); }
          if(out){ const a = Math.atan2(p.y - ey, p.x - ex); head(X + Math.cos(a)*rs*3.6, Y + Math.sin(a)*rs*3.6, a, rs*1.4, w); } }, colr); }
      continue; }
    const p = dialGuidePlace(mark, deg0, tilt0, aspX, aspY, knobs); if(!p) continue;
    const X = p.x*u, Y = p.y*u; x.globalAlpha = 0.95;
    if(mark.k === 'impact') twice((pass, w) => { const r = u*0.03; x.lineWidth = w; x.beginPath();
      for(let q = 0; q < 6; q++){ const a = q*Math.PI/3 + 0.3; x.moveTo(X + Math.cos(a)*r*0.35, Y + Math.sin(a)*r*0.35); x.lineTo(X + Math.cos(a)*r*(q % 2 ? 1.6 : 1.1), Y + Math.sin(a)*r*(q % 2 ? 1.6 : 1.1)); }
      x.stroke(); }, main);
    else if(mark.k === 'place') twice((pass, w) => { const r = p.r*u, cr = u*0.025; x.lineWidth = w;
      x.beginPath(); x.arc(X, Y, r, 0, Math.PI*2); x.setLineDash([u*0.02, u*0.015]); x.stroke(); x.setLineDash([]);
      x.beginPath(); x.moveTo(X - cr, Y); x.lineTo(X + cr, Y); x.moveTo(X, Y - cr); x.lineTo(X, Y + cr); x.stroke(); }, main);
    else if(mark.k === 'arrow' || mark.k === 'axis'){
      // a heading or a line through the page's middle; three of them, the outer two fainter, as wind or hatching reads
      const L = Math.min(aspX, aspY)*0.36*u, a = Math.atan2(p.dy, p.dx), nx = -p.dy, ny = p.dx;
      for(const [off, al] of [[0, 0.95], [-0.22, 0.45], [0.22, 0.45]]){ x.globalAlpha = al*(0.45 + 0.55*Math.max(0.15, p.strength));
        const cx = X + nx*off*u, cy = Y + ny*off*u, len = off ? L*0.7 : L;
        twice((pass, w) => { x.lineWidth = w; x.beginPath(); x.moveTo(cx - p.dx*len, cy - p.dy*len); x.lineTo(cx + p.dx*len, cy + p.dy*len); x.stroke();
          if(mark.k === 'arrow') head(cx + p.dx*len, cy + p.dy*len, a, u*0.04, w); }, main); } }
  }
  x.globalAlpha = 1; g.classList.add('on');
  if(linger) holdGuideUntilMade(g, 900);
}
/** How far the dial reaches: past its rim (130) only for engine-lit textures. */
export function dialMax(){ const t = $('textureType'); return (t && (capsFor(t.value) || {}).lowLight) ? 130 : 100; }
/** The ground an older look's surface was made on, kept while its blend is the one it was saved with
 *  (canvasRenderer `textureGround`: before every blend was offered, a lower surface on a blend not made for
 *  it was drawn on its own first blend's ground). Choosing a blend lets it go. */
export function keepGround(ground){
  const b = $('textureBlend'); if(!b || !b.dataset) return;
  b.dataset.ground = ground && SURFACE_BLENDS.includes(ground) ? ground : '';
  b.dataset.groundFor = b.dataset.ground ? b.value : '';
}
/** A label's own words, leaving what else lives in it (its padlock) alone —
 *  writing textContent wiped the lock off every hue whose name changes. */
// (a function, not a const: labels are renamed at boot, before this line runs)
function textNode(el){ return (el && el.childNodes && typeof el.childNodes[Symbol.iterator] === 'function') ? [...el.childNodes].find(n => n.nodeType === 3) : null; }
export function labelText(el){ const t = textNode(el); return t ? t.nodeValue.trim() : String(el.textContent || '').trim(); }
/** Each hue group's heading (Light, Surface, Material Colors) shows while one of the hues after it, up to the next
 *  heading, does. */
export function syncHueHeads(){
  for(const id of ['hueHeadLight', 'hueHeadSurface', 'hueHeadMaterial']){ const h = $(id); if(!h || !h.classList) continue;
    let any = false; for(let r = h.nextElementSibling; r && !(r.classList && r.classList.contains('hue-head')) && r.id !== 'seedRow'; r = r.nextElementSibling)
      if(r.classList && !r.classList.contains('tool-hidden')) any = true;
    h.classList.toggle('tool-hidden', !any); }
}
export function setLabelText(el, text){
  if(!el) return;
  if(!el.childNodes || typeof el.childNodes[Symbol.iterator] !== 'function'){ el.textContent = text; return; }   // (a bare stand-in element)
  const t = textNode(el);
  if(t) t.nodeValue = text; else el.insertBefore(document.createTextNode(text), el.firstChild);
}
/** The fifth hue's "none" for a texture: black for a glow, mid-grey for a
 *  grey texture's material, white for a base colour. */
export function hue5Default(type){ const h = (capsFor(type) || {}).hue5; return h ? h.def : '#000000'; }
// Every slider marked data-angle gets the shared tick list and, beside it, a
// small toggle (∡) that snaps it to 15° steps. Texture knobs that are angles
// join in when their texture is chosen (syncTextureParams).
function snapToTick(input){
  const ticks = (input.dataset.ticks || '').split(',').map(Number).filter(n => !isNaN(n));
  if(!ticks.length) return;
  const v = parseFloat(input.value);
  input.value = ticks.reduce((best, t) => Math.abs(t - v) < Math.abs(best - v) ? t : best, ticks[0]);
}
export function addAngleSnap(input){
  if(!input || input.dataset == null || input.dataset.snapReady) return;
  input.dataset.snapReady = '1';
  if(input.setAttribute) input.setAttribute('list', 'angleTicks');
  if(!input.parentNode || !document.createElement) return;
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'snap-btn'; b.textContent = '∡'; b.title = 'Snap to 15°';
  if(b.setAttribute) b.setAttribute('aria-pressed', 'false');
  b.addEventListener && b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    if(b._ticks && input.dataset.ticks){ input.dataset.snapTicks = on ? '1' : ''; snapToTick(input); }
    else { input.step = on ? '15' : '1'; if(on) input.value = Math.round(parseFloat(input.value) / 15) * 15; }
    input.dispatchEvent && input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  // a knob locked to its ticks jumps to the nearest one as it moves
  input.addEventListener && input.addEventListener('input', () => { if(input.dataset.snapTicks === '1') snapToTick(input); });
  if(input.parentNode.insertBefore) input.parentNode.insertBefore(b, input.nextSibling);
  input._snapBtn = b;
}
// texture knobs: angle ticks, their own ticks, or none — set as the texture changes
export function setKnobTicks(slider, i, def){
  const btn = () => slider._snapBtn;
  const hideBtn = () => { if(btn() && btn().style){ btn().style.display = 'none'; btn().setAttribute('aria-pressed', 'false'); } };
  // (the marks of the surface before go too: a slider kept another surface's marks, and its skin drew them — 2026-10-19)
  slider.step = String(def.step || 1); if(slider.dataset){ delete slider.dataset.snapTicks; delete slider.dataset.ticks; }
  if(def.key === 'angle'){
    addAngleSnap(slider); if(slider.setAttribute) slider.setAttribute('list', 'angleTicks');
    if(btn()){ btn().textContent = '∡'; btn().title = 'Snap to 15°'; btn().style.display = ''; btn().setAttribute('aria-pressed', 'false'); }
  } else if(def.ticks && def.ticks.length){
    const id = 'texP' + (i + 1) + 'Ticks';
    let dl = $(id);
    if(!dl && document.createElement && document.body && document.body.appendChild){ dl = document.createElement('datalist'); dl.id = id; document.body.appendChild(dl); }
    if(dl && 'innerHTML' in dl) dl.innerHTML = def.ticks.map(t => `<option value="${t}"></option>`).join('');
    if(slider.setAttribute) slider.setAttribute('list', id);
    if(slider.dataset) slider.dataset.ticks = def.ticks.join(',');
    addAngleSnap(slider);                       // the same toggle, set to lock to ticks
    if(btn()){ btn().textContent = '⊹'; btn().title = 'Lock to the marks'; btn().style.display = ''; btn().setAttribute('aria-pressed', 'false'); btn()._ticks = true; }
    // (a Knob of steps or a switch, and a slider whose marks are named kinds (a species, a world, a fabric), is locked to
    //  its marks from the start: between two kinds there is nothing to choose. Ruby: "notch-lock these kinds of sliders by
    //  default"; the ⊹ frees it)
    if((def.snap || (def.names && def.names.length)) && slider.dataset){ slider.dataset.snapTicks = '1'; if(btn()) btn().setAttribute('aria-pressed', 'true'); }
  } else { if(slider.removeAttribute) slider.removeAttribute('list'); hideBtn(); }
  // 🎲 — a knob that asks for one (Object Shape) gets a die that picks a mark at random
  if(!slider._dice && def.dice && document.createElement && slider.parentNode && slider.parentNode.insertBefore){
    const d = document.createElement('button'); d.type = 'button'; d.className = 'snap-btn dice-btn'; d.textContent = '🎲'; d.title = 'Pick one at random';
    d.addEventListener('click', () => { const t = (slider.dataset.ticks || '').split(',').map(Number).filter(n => !isNaN(n));
      if(t.length){ slider.value = t[Math.floor(Math.random()*t.length)]; slider.dispatchEvent(new Event('input', { bubbles: true })); } });
    slider.parentNode.insertBefore(d, (slider._snapBtn && slider._snapBtn.nextSibling) || slider.nextSibling); slider._dice = d;
  }
  if(slider._dice && slider._dice.style) slider._dice.style.display = def.dice ? '' : 'none';
  // an Angle knob is turned on a dial (D1); any other knob has none
  const dial = def.deg ? knobDial(slider) : slider._knobDial;
  if(dial && dial.style) dial.style.display = def.deg ? '' : 'none';
  if(slider.parentNode && slider.parentNode.classList) slider.parentNode.classList.toggle('has-dial', !!def.deg);
  paintKnobDial(slider);
}
// AN ANGLE IS A DIAL (ROADMAP D1, Filter Forge's Angle control): beside an Angle knob's slider, a small dial whose hand
// is the angle (0° up, turning clockwise, as the light dial reads); drag round it to turn it. The slider stays: the
// keyboard, the lock, the saving and the 45° marks are its.
function knobDial(slider){
  if(slider._knobDial) return slider._knobDial;
  if(typeof document.createElementNS !== 'function' || !slider.parentNode || !slider.parentNode.insertBefore) return null;
  const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '-20 -20 40 40'); svg.setAttribute('class', 'knob-dial'); svg.setAttribute('aria-hidden', 'true');
  const ticks = [0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a*Math.PI/180, x = Math.sin(r), y = -Math.cos(r);
    return `<line class="kd-tick" x1="${(x*15).toFixed(2)}" y1="${(y*15).toFixed(2)}" x2="${(x*18).toFixed(2)}" y2="${(y*18).toFixed(2)}"/>`; }).join('');
  svg.innerHTML = `<circle class="kd-rim" r="17"/>${ticks}<g class="kd-hand"><line x1="0" y1="0" x2="0" y2="-13"/><circle cx="0" cy="-13" r="3"/></g><circle class="kd-hub" r="2"/>`;
  slider.parentNode.insertBefore(svg, slider);
  const turn = e => { const r = svg.getBoundingClientRect(), dx = e.clientX - (r.left + r.width/2), dy = e.clientY - (r.top + r.height/2);
    let deg = (Math.atan2(dx, -dy)*180/Math.PI + 360) % 360;
    // (with ∡ or ⊹ pressed it settles on the marks, as the slider does)
    if(slider.dataset && slider.dataset.snapTicks === '1') deg = Math.round(deg/45)*45 % 360;
    slider.value = String(Math.round(deg/3.6*2)/2); slider.dispatchEvent(new Event('input', { bubbles: true })); };
  svg.addEventListener('pointerdown', e => { if(state.locks.has(slider.id)) return; e.preventDefault(); try { svg.setPointerCapture(e.pointerId); } catch(err){} svg._turning = true; turn(e); });
  svg.addEventListener('pointermove', e => { if(svg._turning) turn(e); });
  for(const ev of ['pointerup', 'pointercancel']) svg.addEventListener(ev, () => { if(!svg._turning) return; svg._turning = false; slider.dispatchEvent(new Event('change', { bubbles: true })); });
  slider.addEventListener('input', () => paintKnobDial(slider));
  slider._knobDial = svg;
  return svg;
}
export function paintKnobDial(slider){ const d = slider && slider._knobDial; if(!d || !d.querySelector) return;
  const h = d.querySelector('.kd-hand'); if(h) h.setAttribute('transform', `rotate(${((+slider.value || 0)*3.6).toFixed(1)})`); }
