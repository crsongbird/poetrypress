/**
 * uiMoving.js — the Moving Image sheet: the page as a short film (Ruby: "a scene of the camera rotating on a specific
 * seed with specific lighting conditions all the way around … a subtle video export panel that doesn't show up on the
 * main user interface"). A long press or a right-click on Save opens it; nothing on the page moves for it.
 *
 * Each frame is the page as Save draws it (the poem when it is shown, the credit line always), drawn offline at the
 * film's size, then encoded by the browser's own encoder (WebCodecs) and put in its container by moving.js. The wiring
 * (the listeners) is in appEvents.js.
 */
import { $ } from './appOptions.js';
import { MOVING, fill } from './strings.js';
import { render, setRenderScale, setSceneFly, setSceneTime, surfaceRequests } from './canvasRenderer.js';
import { texturesSettled, texturesBusy, setDrafting, setFilmPool, prefetchTexture, adoptPrefetched } from './textureService.js';
import { capsFor, paramsFor } from './textureGenerators.js';
import { readStore, SPELL_KEY, stripToLook } from './vault.js';
import { state } from './uiState.js';
import { setWorking } from './uiWorking.js';
import { draftTimer } from './uiSurface.js';
import { generateFilenameBase } from './uiLayout.js';
import { restoreSettings, serializeCurrentSettings } from './uiLook.js';
import { historyHold, historyPutBack } from './uiHistory.js';
import { DIAL_R, cameraNow, putCamera, setLight } from './uiDials.js';
import { blendLooks, cameraAlso, markValue, shotAlong, crc32, filmHours, moveAlong, mp4Parts, SUN_DAY, sunPath, webmBytes, wholeChanges, zipParts } from './moving.js';

const MOVING_ASPECTS = { '9:16': 9/16, '4:5': 4/5, '1:1': 1, '16:9': 16/9 };
// (where a look's kind changes, the film fades across this middle stretch of the move)
const MOVING_FADE = [0.38, 0.62];
const movingRun = { busy: false, stop: false, sure: 0, wake: null, caps: {}, able: {}, eased: false, setFrom: null, setLook: null, pickSet: false, setMode: 'look', shot: null, marks: {} };
// ALSO MOVING (Ruby: "more settings so we can do a wider variety of animations — arbitrary settings maybe"; docs/
// prior-art/film-animation.md §D): any of the surface's knobs (those that are amounts, not a choice of kinds), and the
// light and its height, marked to sway, sweep or drift through the film, on top of its move; kept for this visit, by
// the surface, never in a look
function markables(){ const type = ($('textureType') || {}).value, caps = movingRun.caps || {}, out = [];
  paramsFor(type).forEach((d, i) => { const el = $('texP' + (i + 1)); if(!d || d.hidden || (d.names && d.names.length) || !el) return; out.push({ id: 'texP' + (i + 1), label: d.label, lo: +d.min, hi: +d.max, wrap: d.key === 'angle' }); });
  if(caps.light){ out.push({ id: 'textureLight', label: caps.dial === 'Daylight' ? MOVING.markSun : MOVING.markLight, lo: 0, hi: 360, wrap: true }); out.push({ id: 'textureLightTilt', label: MOVING.markHeight, lo: 0, hi: 100 }); }
  return out.map(k => ({ ...k, key: type + '|' + k.id })); }
function paintMarks(){ const ks = markables(), ctl = $('movingMarkCtl'); if(!ctl) return;
  const was = ctl.value; ctl.innerHTML = ''; for(const k of [{ key: '', label: MOVING.markNone }, ...ks]){ const o = document.createElement('option'); o.value = k.key; o.textContent = k.label; ctl.appendChild(o); }
  ctl.value = ks.some(k => k.key === was) ? was : ''; const m = movingRun.marks[ctl.value] || { how: 'still', amt: 0.25, times: 1 };
  if($('movingMarkHow')) $('movingMarkHow').value = m.how; if($('movingMarkAmt')) $('movingMarkAmt').value = String(m.amt); if($('movingMarkTimes')) $('movingMarkTimes').value = String(m.times);
  const on = ks.filter(k => movingRun.marks[k.key] && movingRun.marks[k.key].how !== 'still'), sum = $('movingMarksSum');
  if(sum) sum.textContent = on.map(k => { const mk = movingRun.marks[k.key]; return MOVING.marksOne.replace('{name}', k.label).replace('{how}', MOVING.markHow[mk.how]).replace('{times}', MOVING.markTimes[mk.times] || ''); }).join(', '); }
function setMark(){ const ctl = $('movingMarkCtl'); if(!ctl || !ctl.value) return;
  movingRun.marks[ctl.value] = { how: $('movingMarkHow').value, amt: +$('movingMarkAmt').value || 0.25, times: +$('movingMarkTimes').value || 1 }; }
// (where a film that begins at a time of day starts, in hours after sunrise: a little before it, at noon, a little
//  before sunset, at midnight)
const MOVING_BEGIN = { dawn: -0.5, noon: SUN_DAY/2, dusk: SUN_DAY - 0.6, night: SUN_DAY + (24 - SUN_DAY)/2 };

const movingNote = text => { const n = $('movingNote'); if(n) n.textContent = text || ''; };
// THE SHEET'S CHOICES are radio groups (docs/prior-art/film-export.md §5: native radios, so Tab reaches the chosen one and
// the arrow keys move it): the checked one of a name, else d
const movingRadios = name => typeof document !== 'undefined' && document.querySelectorAll ? [...document.querySelectorAll(`input[name="${name}"]`)] : [];
const movingPick = (name, d) => { const r = movingRadios(name).find(q => q.checked); return r ? r.value : d; };
const movingSet = (name, v) => { for(const r of movingRadios(name)) r.checked = r.value === v; };
// (a film's size in pixels: a chosen frame, or the page's own; a video's held to 4K's area, past which the encoders'
//  levels end, and its sides even, as H.264 and VP9 take)
// THE FILM'S SIZE (Ruby: "Aspect Ratio as a radio button; Resolution as a radio button 720p, 1080p, 1440p, 2160p (best guess
// for off ratios) or custom w/h (overrides aspect)"): the resolution is the short side, the aspect the shape (the page's
// own, or a screen's); a custom size is taken as it is
function movingDims(aspect, res, fmt){ const cv = $('poemCanvas') || {}, num = id => Math.round(parseFloat(($(id) || {}).value) || 0);
  let w, h; if(res === 'custom'){ w = Math.max(64, Math.min(7680, num('movingCustomW') || 1080)); h = Math.max(64, Math.min(7680, num('movingCustomH') || 1350)); }
  else { const pw = state.page.exportW || cv.width || 1080, ph = state.page.exportH || cv.height || 1350, ar = MOVING_ASPECTS[aspect] || pw/ph, N = +res || 1080;
    if(ar >= 1){ h = N; w = Math.round(N*ar); } else { w = N; h = Math.round(N/ar); } }
  if(fmt !== 'png'){ const k = Math.min(1, Math.sqrt(3840*2160/(w*h))); w = Math.round(w*k); h = Math.round(h*k); w -= w % 2; h -= h % 2; }
  return [w, h]; }
const movingBitrate = (w, h, fps) => Math.round(Math.min(40e6, Math.max(4e6, w*h*fps*0.15)));
// (a span of seconds in words: "a day", "6 hours", "2 hours", "5 minutes", "40 seconds")
function movingWords(sec){ const n = v => String(v < 10 ? Math.round(v*10)/10 : Math.round(v));
  if(sec >= 86400*1.5) return fill(MOVING.uDays, n(sec/86400)); if(sec >= 86400) return MOVING.uDay;
  if(sec >= 3600*1.5) return fill(MOVING.uHours, n(sec/3600)); if(sec >= 3600) return MOVING.uHour;
  if(sec >= 90) return fill(MOVING.uMinutes, String(Math.round(sec/60))); if(sec >= 60) return MOVING.uMinute;
  return fill(MOVING.uSeconds, String(Math.max(1, Math.round(sec)))); }
/** The film as chosen, in one line: its length, rate, frames, size and file, about how big; how fast time runs in it. */
function movingSummary(){
  const el = $('movingSummary'); if(!el) return;
  const fmt = movingPick('movingFormat', 'mp4'), fps = +movingPick('movingFps', '30') || 30, len = Math.min(180, +($('movingLength') || {}).value || 12), n = len*fps;
  const [w, h] = movingDims(movingPick('movingAspect', 'page'), movingPick('movingRes', '1080'), fmt), bytes = fmt === 'png' ? n*w*h*1.5 : movingBitrate(w, h, fps)*len/8;
  let text = MOVING.sum.replace('{len}', String(len)).replace('{fps}', String(fps)).replace('{frames}', String(n)).replace('{size}', `${w} × ${h}`)
    .replace('{fmt}', { mp4: 'MP4', webm: 'WebM', png: 'PNG' }[fmt] || fmt).replace('{mb}', bytes >= 1e9 ? (bytes/1e9).toFixed(1) + ' GB' : Math.max(1, Math.round(bytes/1e6)) + ' MB');
  const span = movingSpan(movingPick('movingMove', 'camera'));
  if(span) text += ' · ' + MOVING.sumTime.replace('{span}', movingWords(span)).replace('{rate}', movingWords(span/len)) + (movingPick('movingPlay', 'once') === 'back' ? ' · ' + MOVING.sumBack : '');
  // (a push, a pull or a spiral does not come round as a full turn does, unless the film goes there and back)
  const cam = movingPick('movingMove', 'camera') === 'camera', also = cam ? movingPick('movingAlso', 'hold') : 'hold', ends = cam && movingPick('movingTurn', '360') === 'shot' ? MOVING.endsShot : { in: MOVING.endsIn, out: MOVING.endsOut, spiral: MOVING.endsSpiral, drone: MOVING.endsDrone }[also];
  if(ends && movingPick('movingPlay', 'once') !== 'back') text += ' · ' + MOVING.sumEnds.replace('{what}', ends);
  const nm = movingPick('movingMove', 'camera') === 'look' ? 0 : markables().filter(k => movingRun.marks[k.key] && movingRun.marks[k.key].how !== 'still').length;
  if(nm) text += ' · ' + (nm === 1 ? MOVING.marksCount1 : MOVING.marksCount.replace('{n}', String(nm)));
  el.textContent = text; }
// (how much time passes in the film, in seconds: none in real time; Time Passing always some)
// (time passing, from its slider: 0 is real time, then five minutes to two days spread by how long it feels, as a log)
const movingSpanSecs = v => v <= 0 ? 0 : Math.round(300*Math.pow(172800/300, (Math.min(100, v) - 1)/99));
function movingSpan(move){ const caps = movingRun.caps || {}, timeable = !!(caps.time || caps.dial === 'Daylight');
  if(!timeable || (move !== 'camera' && move !== 'time')) return 0; const v = movingSpanSecs(+(($('movingSpanSlider') || {}).value) || 0); return move === 'time' ? v || 86400 : v; }
/** The other looks a film can move to: the spells kept in this browser, and the look before the last change. */
function movingLooks(){
  const out = [];
  if(movingRun.setLook) out.push({ value: 'set', label: MOVING.setLook, look: () => JSON.parse(JSON.stringify(movingRun.setLook)) });
  if(state.history && state.history.index > 0) out.push({ value: 'history', label: MOVING.before, look: () => JSON.parse(state.history.stack[state.history.index - 1]) });
  for(const rec of readStore(SPELL_KEY)) if(rec && rec.settings) out.push({ value: 'spell:' + rec.name, label: rec.name, look: () => stripToLook({ ...rec.settings, spell: rec.spell }) });
  return out;
}
/** The sheet opened: its moves offered as this surface allows (no camera, no Camera round), the other looks listed. */
export function openMoving(){
  const sheet = $('movingSheet'); if(!sheet) return;
  if(movingRun.setFrom){ movingSetEnd(true); return; }   // (opened again while a look is being set: that look kept)
  const type = ($('textureType') || {}).value, on = !!($('textureToggle') || {}).checked, caps = (on && capsFor(type)) || {};
  const looks = movingLooks(), pick = $('movingLook');
  if(pick){ pick.innerHTML = ''; for(const l of looks){ const o = document.createElement('option'); o.value = l.value; o.textContent = l.label; pick.appendChild(o); } }
  // (the moves this surface allows: no camera, no Camera round; Time Passing where it keeps a clock, the Ringworld)
  movingRun.caps = caps; paintMarks(); movingRun.able = { camera: !!caps.camera, light: !!caps.light, time: !!caps.time, look: true };   // (Set it now always offers one)
  if(movingRun.pickSet && pick && movingRun.setLook){ pick.value = 'set'; movingSet('movingMove', 'look'); } movingRun.pickSet = false;
  const ln = $('movingLightName'); if(ln) ln.textContent = caps.dial === 'Daylight' ? MOVING.day : MOVING.light;
  if(!movingRun.able[movingPick('movingMove', 'camera')]){ const first = movingRadios('movingMove').find(r => movingRun.able[r.value]); if(first) movingSet('movingMove', first.value); }
  const coded = typeof VideoEncoder !== 'undefined'; if(!coded) movingSet('movingFormat', 'png');
  const pp = $('movingPagePx'), cv = $('poemCanvas') || {}; if(pp) pp.textContent = `${state.page.exportW || cv.width} × ${state.page.exportH || cv.height}`;
  paintMoving(); movingNote(coded ? '' : MOVING.noEncoder);
  // (on a desktop its cards are in the Kinesis tab, not the sheet: appEvents.js, placeKinesis)
  const body = $('movingBody'); if(!body || body.parentNode === sheet) sheet.hidden = false;
  movingPlaybackOff(); movingShow($('poemCanvas')); movingDials(true); movingRun.camIs = movingPick('movingCam', 'from');
}
// (while a film is being made, closing the sheet, Escape, a tap outside it: a soft no, the film goes on; only Stop, tapped
//  twice, ends it. The page under the sheet stays as it is, since every frame is drawn from it)
export function closeMoving(){ if(movingRun.busy){ movingNote(MOVING.stillMaking); return; } const s = $('movingSheet'); if(s) s.hidden = true; movingPlaybackOff(); movingLeave(); }
// SET IT NOW (Ruby: "more settings so we can do a wider variety of animations, arbitrary settings maybe"): the sheet
// tucks away and the page itself is changed, anything at all; Done keeps that as the look the film moves to, Cancel
// drops it, and either way the page goes back to how it was and the changes leave the history
// (and To a shot's Set the shot: the same, but only the camera kept, the film then easing from the camera as it is to
//  the shot set: docs/prior-art/film-animation.md §C)
export function movingSetNow(mode = 'look'){ if(movingRun.busy) return; movingLeave(); movingRun.setFrom = historyHold(); movingRun.setMode = mode === 'shot' ? 'shot' : 'look';
  const s = $('movingSheet'), t = $('movingTuck'), tx = $('movingTuckText'); if(s) s.hidden = true; if(t) t.hidden = false; if(tx) tx.textContent = movingRun.setMode === 'shot' ? MOVING.tuckShot : MOVING.tuckLook;
  if(document.body && document.body.classList) document.body.classList.add('moving-tucked'); }
export function movingSetEnd(keep){ const f = movingRun.setFrom; if(!f) return; movingRun.setFrom = null;
  if(keep && movingRun.setMode === 'shot') movingRun.shot = cameraNow(); else if(keep){ movingRun.setLook = stripToLook(serializeCurrentSettings()); movingRun.pickSet = true; }
  if(keep && movingRun.setMode === 'shot'){ movingSet('movingMove', 'camera'); movingSet('movingTurn', 'shot'); }
  const t = $('movingTuck'); if(t) t.hidden = true; if(document.body && document.body.classList) document.body.classList.remove('moving-tucked');
  historyPutBack(f); openMoving(); }
// THE PREVIEW BOX (the phone's sheet; docs/prior-art/film-studio.md, The phone): the page before a film, each frame as it
// is made (with a thin rule of how far along), then the film itself looping, from the file just made; only while the
// cards are in the sheet (on a desk the stage beside the Kinesis tab shows all this)
const movingInSheet = () => { const b = $('movingBody'), s = $('movingSheet'); return !!(b && s && b.parentNode === s); };
function movingShow(src, along = null){ const cv = $('movingPreviewCanvas'), box = $('movingPreview'); if(!cv || !box || !movingInSheet() || !src || !src.width || !cv.getContext) return;
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1, W = Math.max(2, Math.round((box.clientWidth || 300)*dpr)), H = Math.max(2, Math.round((box.clientHeight || 200)*dpr));
  if(cv.width !== W || cv.height !== H){ cv.width = W; cv.height = H; }
  const x = cv.getContext('2d'), k = Math.min(W/src.width, H/src.height), w = src.width*k, h = src.height*k; x.clearRect(0, 0, W, H); x.drawImage(src, (W - w)/2, (H - h)/2, w, h);
  const pr = $('movingProgress'); if(pr && pr.style) pr.style.transform = `scaleX(${along === null ? 0 : Math.max(0, Math.min(1, along))})`; }
// (the film made, playing in the box until the sheet closes or another is begun; its address let go then)
function movingPlayback(blob){ const v = $('movingPreviewVideo'); if(!v) return; movingPlaybackOff();
  if(!blob || !movingInSheet() || !/video/.test(blob.type || '')) return; movingRun.playUrl = URL.createObjectURL(blob); v.src = movingRun.playUrl; v.hidden = false; const p = v.play && v.play(); if(p && p.catch) p.catch(() => {}); }
function movingPlaybackOff(){ const v = $('movingPreviewVideo'); if(v){ if(v.pause) v.pause(); v.hidden = true; if(v.removeAttribute) v.removeAttribute('src'); }
  if(movingRun.playUrl){ URL.revokeObjectURL(movingRun.playUrl); movingRun.playUrl = null; } }
// THE DIALS IN THE FILM'S WINDOW (Ruby: "camera and sun controls right in the animation window for compatible viewers/
// surfaces/generators"): the page's light and camera dials move into its Camera and Light card while it is open and go
// back to Materia when it closes, moved, never copied. FROM is the page's camera; TO is the shot the film moves to, set on
// the same dial: choosing To shows the shot on the page (or the page's camera, the first time), choosing From keeps it and
// puts the page's camera back; and the film then turns To a shot
function movingDials(open){ const slot = $('movingDials'); if(!slot) return;
  // (laid out as Materia lays them, the two side by side where the surface has a camera)
  { const tools = $('textureToolRow'); if(open && tools && tools.classList && slot.classList) for(const c of ['has-camera', 'has-seg']) slot.classList.toggle(c, tools.classList.contains(c)); }
  for(const id of ['lightRow', 'cameraRow']){ const row = $(id), home = $(id + 'Home'); if(!row || !home || !home.parentNode) continue;
    if(open && row.parentNode !== slot) slot.appendChild(row); else if(!open && row.parentNode === slot) home.parentNode.insertBefore(row, home.nextSibling); }
  movingArc(); }
// (the light the same way: To sets where the light, or the sun, ends; the film carries it there along the sun's own arc)
function movingCamSwitch(to){ if(to === movingRun.camIs) return;
  if(to === 'to'){ movingRun.camFrom = cameraNow(); movingRun.lightFrom = pickedLight(); const s = movingRun.shot || movingRun.camFrom, lt = movingRun.lightTo || movingRun.lightFrom;
    putCamera(s.turn, s.view, s.zoom); setLight(lt.deg, lt.tilt, false); movingSet('movingMove', 'camera'); movingSet('movingTurn', 'shot'); }
  else { movingRun.shot = cameraNow(); movingRun.lightTo = pickedLight(); const f = movingRun.camFrom || movingRun.shot, lf = movingRun.lightFrom || movingRun.lightTo;
    putCamera(f.turn, f.view, f.zoom); setLight(lf.deg, lf.tilt, false); }
  movingRun.camIs = to; movingArc(); render(); }
const pickedLight = () => { const t = parseFloat(($('textureLightTilt') || {}).value); return { deg: parseFloat(($('textureLight') || {}).value) || 0, tilt: isNaN(t) ? 100 : t }; };
// THE SUN'S WAY THROUGH A FILM (Ruby: "camera and daylight from where it starts, where it ends, draw the arc the sun follows
// in the sky and twist the two points based around the time so the sun rises and falls"): on a surface whose light dial
// is the sun, while time passes it follows its day from where the film begins for as long as the film spans, so its end
// turns round the arc as the span grows; on a Daylight Round, the whole day; and with a light set To, from where it
// starts to the place on its arc nearest that, rising and setting on the way. { sun: hours → [deg, tilt], H } or null
const movingDialAt = (deg, tilt) => { const k = Math.max(0, Math.min(130, tilt))/100, a = deg*Math.PI/180; return [Math.sin(a)*DIAL_R*k, -Math.cos(a)*DIAL_R*k]; };
function movingHoursTo(sun, to){ const [tx, ty] = movingDialAt(to.deg, to.tilt); let best = 0.25, bd = Infinity;
  for(let h = 0.25; h <= 24; h += 0.05){ const [d, tl] = sun(h), [x, y] = movingDialAt(d, tl), dd = Math.hypot(x - tx, y - ty); if(dd < bd){ bd = dd; best = h; } } return best; }
function movingSunPlan(){ const caps = movingRun.caps || capsFor(($('textureType') || {}).value) || {}; if(caps.dial !== 'Daylight') return null;
  const move = movingPick('movingMove', 'camera'), spanS = movingSpan(move), from = movingRun.camIs === 'to' ? (movingRun.lightFrom || pickedLight()) : pickedLight();
  if(spanS > 0){ const off = MOVING_BEGIN[movingPick('movingBegin', 'lit')] ?? null, base = off === null ? sunPath(from.deg, from.tilt) : sunPath(from.deg, 100); return { sun: off === null ? base : h => base(h + off), H: spanS/3600 }; }
  if(move === 'light') return { sun: sunPath(from.deg, from.tilt), H: 24 };
  const to = movingRun.camIs === 'to' ? pickedLight() : movingRun.lightTo; if(!to || move !== 'camera') return null;
  const [fx, fy] = movingDialAt(from.deg, from.tilt), [tx, ty] = movingDialAt(to.deg, to.tilt); if(Math.hypot(fx - tx, fy - ty) < 1.5) return null;
  const sun = sunPath(from.deg, from.tilt); return { sun, H: movingHoursTo(sun, to) }; }
/** The sun's arc on the light dial while the film's window holds it (the dial lays it each time it is drawn). */
export function movingArc(){ const arc = $('lightArc'), fm = $('lightFromMark'), tm = $('lightToMark'), slot = $('movingDials'), row = $('lightRow'); if(!arc || !fm || !tm) return;
  const plan = slot && row && row.parentNode === slot ? movingSunPlan() : null; for(const el of [arc, fm, tm]) el.hidden = !plan; if(!plan) return;
  const N = Math.max(24, Math.min(240, Math.round(plan.H*8))), pts = []; for(let q = 0; q <= N; q++){ const [d, tl] = plan.sun(plan.H*q/N); pts.push(movingDialAt(d, tl)); }
  arc.setAttribute('d', pts.map(([x, y], q) => (q ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2)).join(' '));
  fm.setAttribute('cx', pts[0][0].toFixed(2)); fm.setAttribute('cy', pts[0][1].toFixed(2)); tm.setAttribute('cx', pts[N][0].toFixed(2)); tm.setAttribute('cy', pts[N][1].toFixed(2)); }
/** The film's window left (closed, or another tab chosen on a desk): the shot kept, the page's camera back, the dials home. */
export function movingLeave(){ if(movingPick('movingCam', 'from') === 'to'){ movingSet('movingCam', 'from'); movingCamSwitch('from'); } movingDials(false); }
/** Is a film being made (the page asks before it is closed or left). */
export const movingBusy = () => movingRun.busy;
// WHILE A FILM IS MADE the rest of the page takes no touch (docs/prior-art/film-studio.md, While a film is made): the
// tabs, the other cards, the stage's undo, redo and filmstrip, Save and the Esoterica drawer are made inert and faded
// (body.film-making), so on a desktop, where the stage stands open beside the Kinesis tab, nothing changes the page
// between two frames; on a phone the sheet covers them anyway
const MOVING_INERT = '#tabBar, .controls > .card:not(#kinesisPanel), #esoDrawer, #undoBtn, #redoBtn, #filmBtn, #filmstrip, #resetViewBtn, #downloadBtn, #dragHandle';
export function movingInert(on){ if(typeof document === 'undefined' || !document.querySelectorAll) return;
  for(const el of document.querySelectorAll(MOVING_INERT)){ if(on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); }
  if(document.body && document.body.classList) document.body.classList.toggle('film-making', !!on); }
// KEEP THE SCREEN AWAKE while a film is made (the Screen Wake Lock: a sleeping device stops the page): asked for at the
// start, asked for again when the page is shown again (the browser lets it go when the page is hidden), let go at the end
export async function movingWake(){
  if(!movingRun.busy || movingRun.wake || typeof navigator === 'undefined' || !navigator.wakeLock || (typeof document !== 'undefined' && document.visibilityState !== 'visible')) return;
  try { movingRun.wake = await navigator.wakeLock.request('screen'); movingRun.wake.addEventListener('release', () => { movingRun.wake = null; }); } catch(e){ movingRun.wake = null; }
}
/** The rows the chosen move uses, the rest dimmed where they stand (nothing moves when the move changes); the line. */
export function paintMoving(e){
  const t = e && e.target, busy = movingRun.busy, caps = movingRun.caps || {}, able = movingRun.able || {};
  if(t && t.name === 'movingEase') movingRun.eased = true;   // (chosen by hand: kept)
  if(t && t.name === 'movingCam') movingCamSwitch(t.value);
  if(t && (t.id === 'movingMarkHow' || t.id === 'movingMarkAmt' || t.id === 'movingMarkTimes')) setMark();
  if(t && t.id && t.id.startsWith('movingMark')) paintMarks();
  let m = movingPick('movingMove', 'camera');
  // (Time Passing never runs in real time; and, until easing is chosen by hand, a full round or a light round goes
  //  evenly, so it loops, and a part turn or a move to a look eases in and out)
  { const sl = $('movingSpanSlider'); if(m === 'time' && sl && +sl.value <= 0) sl.value = '89'; }   // (a day)
  { const sl = $('movingSpanSlider'), rd = $('movingSpanRead'), s2 = movingSpanSecs(+((sl || {}).value) || 0); if(rd) rd.textContent = s2 ? movingWords(s2) : MOVING.realTime;
    const ln = $('movingLength'), lr = $('movingLengthRead'), ls = +((ln || {}).value) || 12; if(lr && ln) lr.textContent = ls < 60 ? fill(MOVING.lenSecs, String(ls)) : movingWords(ls); }
  movingArc();
  if(!movingRun.eased) movingSet('movingEase', m === 'look' || (m === 'camera' && movingPick('movingTurn', '360') !== '360') ? 'ease' : 'even');
  const timeable = !!(caps.time || caps.dial === 'Daylight'), timed = movingSpan(m) > 0;
  // (the rest at the ends dimmed where the film loops round: a full round, a light round, time passing)
  const tp = movingPick('movingTurn', '360'), loops = (m === 'camera' && tp === '360' && movingPick('movingPlay', 'once') !== 'back') || m === 'light' || m === 'time';
  const sh = movingRun.shot, si = $('movingShotIs'); if(si) si.textContent = sh ? MOVING.shotIs.replace('{turn}', String(Math.round(sh.turn))).replace('{view}', String(Math.round(sh.view))).replace('{zoom}', String(Math.round(sh.zoom))) : MOVING.shotNone;
  const on = { movingMarkRow: m !== 'look', movingLookRow: m === 'look', movingTurnRow: m === 'camera', movingShotRow: m === 'camera' && tp === 'shot', movingRestRow: !loops, movingAlsoRow: m === 'camera' && tp !== 'shot', movingSpanRow: timeable && (m === 'camera' || m === 'time'), movingBeginRow: timed, movingEaseRow: m !== 'time', movingPlayRow: true };
  for(const [id, ok] of Object.entries(on)){ const row = $(id); if(!row) continue; if(row.classList) row.classList.toggle('off', !ok);
    for(const el of row.querySelectorAll ? row.querySelectorAll('input, select') : []) el.disabled = busy || !ok; }
  for(const r of movingRadios('movingMove')) r.disabled = busy || !able[r.value];
  for(const r of movingRadios('movingFormat')) r.disabled = busy || (r.value !== 'png' && typeof VideoEncoder === 'undefined');
  for(const n of ['movingAspect', 'movingRes', 'movingFps']) for(const r of movingRadios(n)) r.disabled = busy;
  if($('movingLength')) $('movingLength').disabled = busy;
  // (the custom size dimmed where it stands unless Custom is chosen; the aspect then says nothing)
  { const cust = movingPick('movingRes', '1080') === 'custom', cr = $('movingCustomRow'), ar = $('movingAspectRow');
    if(cr && cr.classList) cr.classList.toggle('off', !cust); if(ar && ar.classList) ar.classList.toggle('off', cust);
    for(const id of ['movingCustomW', 'movingCustomH']) if($(id)) $(id).disabled = busy || !cust; }
  if($('movingSetNow')) $('movingSetNow').disabled = busy || m !== 'look';
  if($('movingSetShot')) $('movingSetShot').disabled = busy || m !== 'camera' || tp !== 'shot';
  const b = $('movingMake'); if(b) b.textContent = busy ? (movingRun.sure ? MOVING.stopSure : MOVING.stop) : MOVING.make;
  movingSummary();
}
/** The encoder's settings, the first this browser can make at this size: H.264 for an MP4, VP9 (or VP8) for a WebM. */
async function movingCodec(fmt, w, h, fps){
  if(typeof VideoEncoder === 'undefined') return null;
  const bitrate = movingBitrate(w, h, fps);
  const tries = fmt === 'mp4' ? ['avc1.640028', 'avc1.640033', 'avc1.640034', 'avc1.4d0028', 'avc1.4d0033', 'avc1.420028'] : ['vp09.00.40.08', 'vp09.00.50.08', 'vp09.00.51.08', 'vp8'];
  for(const codec of tries){
    const cfg = { codec, width: w, height: h, bitrate, framerate: fps, ...(fmt === 'mp4' ? { avc: { format: 'avc' } } : {}) };
    try { const r = await VideoEncoder.isConfigSupported(cfg); if(r && r.supported) return cfg; } catch(e){ /* the next */ }
  }
  return null;
}
/** Where the frames go: a PNG each into a zip, or each into the encoder and on into an MP4 or a WebM. */
function movingSink(fmt, cfg, w, h, fps){
  if(fmt === 'png'){
    const entries = []; let total = 0;
    return {
      add: async (canvas, i) => { const blob = await new Promise(r => canvas.toBlob(r, 'image/png')); const bytes = new Uint8Array(await blob.arrayBuffer());
        total += bytes.length; if(total > 3.9e9) throw new Error('too big');   // (a plain zip ends at 4 GB)
        entries.push({ name: 'frame-' + String(i).padStart(4, '0') + '.png', size: bytes.length, crc: crc32(bytes), data: blob }); },
      done: async () => new Blob(zipParts(entries), { type: 'application/zip' }), drop: () => {} };
  }
  const frames = [], stamps = []; let avcC = null, failed = null;
  const encoder = new VideoEncoder({ error: e => { failed = e; }, output: (chunk, meta) => {
    const data = new Uint8Array(chunk.byteLength); chunk.copyTo(data); frames.push({ data, key: chunk.type === 'key' }); stamps.push(chunk.timestamp);
    const d = meta && meta.decoderConfig && meta.decoderConfig.description;
    if(d && !avcC) avcC = d instanceof ArrayBuffer ? new Uint8Array(d.slice(0)) : new Uint8Array(d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength)); } });
  encoder.configure(cfg);
  return {
    add: async (canvas, i) => {
      if(failed) throw failed;
      const vf = new VideoFrame(canvas, { timestamp: Math.round(i*1e6/fps), duration: Math.round(1e6/fps), alpha: 'discard' });
      encoder.encode(vf, { keyFrame: i % (fps*2) === 0 }); vf.close();
      // (the encoder says when it has taken a frame: waiting on that, not on a timer a hidden tab slows to a second)
      while(encoder.encodeQueueSize > 3) await new Promise(r => { let done = false; const go = () => { if(!done){ done = true; r(); } };
        if(encoder.addEventListener) encoder.addEventListener('dequeue', go, { once: true }); setTimeout(go, 40); });
    },
    done: async () => {
      await encoder.flush(); encoder.close(); if(failed) throw failed;
      // (no reordered frames: the containers here keep one time per frame, in order)
      if(stamps.some((s, i) => i && s < stamps[i - 1])) throw new Error('reordered frames');
      if(fmt === 'mp4'){ if(!avcC) throw new Error('no avcC'); return new Blob(mp4Parts({ width: w, height: h, fps, avcC, frames }), { type: 'video/mp4' }); }
      return new Blob([webmBytes({ width: w, height: h, fps, codec: cfg.codec === 'vp8' ? 'V_VP8' : 'V_VP9', frames })], { type: 'video/webm' });
    },
    drop: () => { try { encoder.close(); } catch(e){ /* closed already */ } } };
}
// a frame: the page drawn; if a texture it asked for wasn't ready, made and drawn again with it (as Save does)
async function movingFrame(){ render(); if(texturesBusy()){ await texturesSettled(); render(); } }
/** Make the film (or, while one is being made, stop it: a first tap asks, a second within a few seconds stops). */
export async function makeMoving(){
  if(movingRun.busy){
    if(!movingRun.sure){ movingRun.sure = setTimeout(() => { movingRun.sure = 0; paintMoving(); }, 3500); paintMoving(); return; }
    clearTimeout(movingRun.sure); movingRun.sure = 0; movingRun.stop = true; paintMoving(); return; }
  if(movingPick('movingCam', 'from') === 'to'){ movingSet('movingCam', 'from'); movingCamSwitch('from'); }   // (the shot kept, the film starting from the page's camera)
  const lightRun = movingSpan(movingPick('movingMove', 'camera')) > 0 || movingPick('movingMove', 'camera') === 'light' ? null : movingSunPlan();   // (the light carried To where it ends, along the sun's arc)
  const canvas = $('poemCanvas'), move = movingPick('movingMove', 'camera'), fmt = movingPick('movingFormat', 'mp4'), fps = +movingPick('movingFps', '30') || 30, n = Math.min(180, +$('movingLength').value || 12)*fps;   // (three minutes at most)
  const [w, h] = movingDims(movingPick('movingAspect', 'page'), movingPick('movingRes', '1080'), fmt), back = movingPick('movingPlay', 'once') === 'back', ease = movingPick('movingEase', 'even'), eased = ease === 'even' ? false : ease;
  const tpick = movingPick('movingTurn', '360'), toShot = move === 'camera' && tpick === 'shot', turn = toShot ? 0 : +tpick || 360, spanS = movingSpan(move), timed = spanS > 0, begin = movingPick('movingBegin', 'lit');
  if(toShot && !movingRun.shot){ movingNote(MOVING.noShot); return; }
  const restS = +movingPick('movingRest', '0') || 0, lenS = n/fps, rest = restS > 0 ? restS/(back ? lenS/2 : lenS) : 0;
  const start = serializeCurrentSettings(), looked = move === 'look';
  const other = looked ? movingLooks().find(l => l.value === ($('movingLook') || {}).value) : null;
  if(looked && !other){ movingNote(MOVING.noLook); return; }
  const cfg = fmt === 'png' ? null : await movingCodec(fmt, w, h, fps);
  if(fmt !== 'png' && !cfg){ movingNote(fill(MOVING.noCodec, fmt.toUpperCase())); return; }
  const end = other ? other.look() : null, snap = k => { const el = $(k) || $(k + 'Hex'); return !!(el && el.tagName === 'SELECT'); };
  const fades = end ? wholeChanges(start, end, snap).filter(k => k !== 'lookName' && k !== 'spell') : [];
  const pw = canvas.width, ph = canvas.height, num = id => parseFloat(($(id) || {}).value) || 0, cam0 = num('cameraTurn'), light0 = num('textureLight'), tilt0 = num('textureLightTilt');
  // (the controls marked to move, each from where it stands; the light's left to the sun where it runs the film)
  const sunOwns = move === 'light' || timed || !!lightRun, marks = looked ? [] : markables().filter(k => movingRun.marks[k.key] && movingRun.marks[k.key].how !== 'still' && !(sunOwns && (k.id === 'textureLight' || k.id === 'textureLightTilt')))
    .map((k, q) => ({ ...k, ...movingRun.marks[k.key], el: $(k.id), v0: num(k.id), ph: 1.3 + q*2.17, step0: ($(k.id) || {}).step }));
  for(const mk of marks) if(mk.el && mk.el.step !== undefined) mk.el.step = 'any';   // (a range input rounds to its step: a sway would stair-step)
  const also = move === 'camera' && !toShot ? movingPick('movingAlso', 'hold') : 'hold', view0 = num('cameraView'), zoom0 = num('cameraZoom') || 100, shot = toShot ? { ...movingRun.shot } : null;
  // (on the Ringworld the light dial is the sun: a Daylight Round is one day of it; Time Passing, or the camera turning
  //  while time passes (Ruby: "time should pass during the camera pan"), as long as was chosen, the scene's clock running
  //  with it, so its clouds drift, its stars wheel and its lights flicker as the hours go; from the light as it is, or
  //  from a time of day, the sun then rising where the dial points)
  const caps = capsFor(($('textureType') || {}).value) || {}, clocked = !!caps.time, sunDay = move === 'light' && caps.dial === 'Daylight';
  const off = timed && MOVING_BEGIN[begin] !== undefined ? MOVING_BEGIN[begin] : null, base = timed || sunDay ? (off === null ? sunPath(light0, tilt0) : sunPath(light0, 100)) : null;
  const sun = base && off ? hrs => base(hrs + off) : base;
  const clock = sun ? filmHours(sun, (timed ? spanS : 86400)/3600) : null;   // (dawn and dusk given more of the film)
  // (how far along the move frame i is: a full round, or there and back, comes round to where it began so the film
  //  loops; a part turn and a move to a look end where they go; evenly, or eased in and out)
  const tri = u => u < 0.5 ? u*2 : 2 - u*2, along = i => moveAlong(i, n, { back, ends: looked || toShot || (move === 'camera' && turn < 360), eased, rest: looked || toShot || (move === 'camera' && turn < 360) || back ? rest : 0 });
  const sink = movingSink(fmt, cfg, w, h, fps);
  let spare = null, made = null;
  // FRAME i's dials and clock (the moves that turn a dial or run the clock; a move between looks is placed below)
  // (a surface that keeps a clock runs it in every film: in real time, so the grass sways and the drones hover as
  //  the camera turns; Time Passing runs it fast)
  const sunAt = hrs => { const [a, tl] = sun(hrs); $('textureLight').value = String(a); $('textureLightTilt').value = String(tl); };
  // (the Ringworld's dusk comes round the way the first frame's light says, the whole film long)
  const side = Math.sin((sun ? sun(clock(0))[0] : light0)*Math.PI/180) < 0 ? -1 : 1;
  const place = i => { const u = along(i);
    // (the scene told its frame and the film's mean step too, so its own clocks run evenly from frame to frame)
    if(timed){ const at = j => clock(back ? tri(j/n) : j/n), hrs = at(i); sunAt(hrs); if(clocked) setSceneTime(hrs*3600, Math.max(1, Math.abs(at(i + 1) - hrs)*3600), i, spanS/n, side, fps); }
    else if(clocked) setSceneTime(i/fps, 1/fps, i, 1/fps, side, fps);
    if(move === 'camera' && shot){ const c = shotAlong({ turn: cam0, view: view0, zoom: zoom0 }, shot, u); $('cameraTurn').value = String(c.turn); $('cameraView').value = String(c.view); $('cameraZoom').value = String(c.zoom); }
    else if(move === 'camera'){ $('cameraTurn').value = String(((cam0 + turn*u) % 360 + 360) % 360);
      if(also !== 'hold'){ const c = cameraAlso(also, u, view0, zoom0, lenS); $('cameraView').value = String(c.view); $('cameraZoom').value = String(c.zoom); if(c.fly) setSceneFly({ ...c.fly, head: cam0 }); } }
    else if(move === 'light'){ if(sunDay) sunAt(clock(u)); else $('textureLight').value = String((light0 + 360*u) % 360); }
    if(lightRun){ const [a, tl] = lightRun.sun(lightRun.H*u); $('textureLight').value = String(a); $('textureLightTilt').value = String(tl); }
    for(const mk of marks) if(mk.el) mk.el.value = String(markValue(mk, i/n)); };
  // FRAMES AHEAD (Ruby: the film kept a twentieth of the machine busy): the frames to come set up one by one, their
  // textures asked for on a worker per spare core, while this one is drawn and encoded. As many ahead as the workers,
  // and as memory allows at this size; none for a move between looks (each frame's look is a whole restore)
  const workers = looked ? 0 : setFilmPool(true), aheadN = looked ? 0 : Math.max(0, Math.min(workers*2, Math.floor(6e8/(w*h*4)))), pending = new Map();
  const queue = j => { if(j >= n || pending.has(j)) return; place(j); pending.set(j, surfaceRequests(w, h).map(r => prefetchTexture(r.type, r.w, r.h, r.opts))); };
  movingRun.busy = true; movingRun.stop = false; paintMoving(); setWorking('saving'); movingWake(); movingInert(true);
  if(document.body && document.body.classList) document.body.classList.add('saving');
  try {
    canvas.width = w; canvas.height = h; setDrafting(false); clearTimeout(draftTimer); setRenderScale(1, [w, h]);
    // (how long is left, from how long the frames so far took, once there are a few)
    const t0 = Date.now(), eta = i => i < 2 ? '' : ' ' + fill(MOVING.eta, movingWords((Date.now() - t0)/1000/(i + 1)*(n - i - 1)));
    for(let i = 0; i < n && !movingRun.stop; i++){
      if(aheadN){ for(let j = i; j < i + aheadN; j++) queue(j);
        place(i); const got = pending.get(i);
        if(got){ await Promise.all(got.map(g => g.promise)); adoptPrefetched(got.map(g => g.key)); pending.delete(i); }
        if(movingRun.stop) break; }
      if(!looked) place(i);
      else {
        const t = along(i), mid = fades.length && t > MOVING_FADE[0] && t < MOVING_FADE[1];
        if(mid){   // both ways at once: the frame as it was, faded into the frame as it becomes
          restoreSettings(blendLooks(start, end, t, 0, snap)); await movingFrame();
          spare = spare || document.createElement('canvas'); spare.width = w; spare.height = h; spare.getContext('2d').drawImage(canvas, 0, 0);
          restoreSettings(blendLooks(start, end, t, 1, snap)); await movingFrame();
          const u = (t - MOVING_FADE[0])/(MOVING_FADE[1] - MOVING_FADE[0]), x = canvas.getContext('2d');
          x.save(); x.globalAlpha = 1 - u*u*(3 - 2*u); x.drawImage(spare, 0, 0); x.restore();
          await sink.add(canvas, i); movingShow(canvas, (i + 1)/n); movingNote(fill(MOVING.frame, `${i + 1} / ${n}`) + eta(i)); continue;
        }
        restoreSettings(blendLooks(start, end, t, t < 0.5 ? 0 : 1, snap));
      }
      await movingFrame(); await sink.add(canvas, i); movingShow(canvas, (i + 1)/n);
      movingNote((aheadN ? fill(MOVING.frameAhead, `${i + 1} / ${n}`).replace('{count}', String(Math.min(pending.size, n - i - 1))) : fill(MOVING.frame, `${i + 1} / ${n}`)) + eta(i));
    }
    if(!movingRun.stop){ movingNote(MOVING.finishing); made = await sink.done(); }
  } catch(err){
    sink.drop(); made = null; movingNote(err && err.message === 'too big' ? MOVING.tooBig : MOVING.failed);
    if(typeof console !== 'undefined') console.warn('Moving Image:', err && err.message);
  } finally {
    setFilmPool(false); if(movingRun.wake){ try { movingRun.wake.release(); } catch(e){ /* let go already */ } movingRun.wake = null; }
    clearTimeout(movingRun.sure); movingRun.sure = 0;
    setSceneTime(0); setSceneFly(null); if(looked) restoreSettings(start);
    else for(const [id, v] of [['cameraTurn', cam0], ['cameraView', view0], ['cameraZoom', zoom0], ['textureLight', light0], ['textureLightTilt', tilt0]]) if($(id)) $(id).value = String(v);
    for(const mk of marks) if(mk.el){ if(mk.step0 !== undefined) mk.el.step = mk.step0; mk.el.value = String(mk.v0); }
    canvas.width = pw; canvas.height = ph; setRenderScale(pw/(state.page.exportW || pw), [state.page.exportW || pw, state.page.exportH || ph]);
    if(document.body && document.body.classList) document.body.classList.remove('saving');
    const stopped = movingRun.stop; movingRun.busy = false; movingRun.stop = false; movingInert(false); setWorking(null); paintMoving(); render();
    if(stopped && !made){ sink.drop(); movingNote(MOVING.stopped); }
  }
  if(!made) return;
  const link = document.createElement('a'), url = URL.createObjectURL(made);
  link.download = `poetrypress-${generateFilenameBase()}-${Math.floor(Date.now()/1000)}.${fmt === 'png' ? 'zip' : fmt}`; link.href = url; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  movingNote(fill(MOVING.made, (made.size/1e6).toFixed(1) + ' MB')); movingPlayback(made);
}
