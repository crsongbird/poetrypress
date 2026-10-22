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
import { render, setRenderScale, setSceneTime, surfaceRequests } from './canvasRenderer.js';
import { texturesSettled, texturesBusy, setDrafting, setFilmPool, prefetchTexture, adoptPrefetched } from './textureService.js';
import { capsFor } from './textureGenerators.js';
import { readStore, SPELL_KEY, stripToLook } from './vault.js';
import { state } from './uiState.js';
import { setWorking } from './uiWorking.js';
import { draftTimer } from './uiSurface.js';
import { generateFilenameBase } from './uiLayout.js';
import { restoreSettings, serializeCurrentSettings } from './uiLook.js';
import { blendLooks, crc32, filmHours, moveAlong, mp4Parts, SUN_DAY, sunPath, webmBytes, wholeChanges, zipParts } from './moving.js';

const MOVING_SIZES = { wide: [1920, 1080], tall: [1080, 1920], square: [1080, 1080] };
// (where a look's kind changes, the film fades across this middle stretch of the move)
const MOVING_FADE = [0.38, 0.62];
const movingRun = { busy: false, stop: false, sure: 0, wake: null, caps: {}, able: {}, eased: false };
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
function movingDims(size, fmt){ const cv = $('poemCanvas') || {};
  let [w, h] = MOVING_SIZES[size] || [state.page.exportW || cv.width || 1080, state.page.exportH || cv.height || 1350];
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
  const fmt = movingPick('movingFormat', 'mp4'), fps = +movingPick('movingFps', '30') || 30, len = Math.min(60, +($('movingLength') || {}).value || 12), n = len*fps;
  const [w, h] = movingDims(movingPick('movingSize', 'page'), fmt), bytes = fmt === 'png' ? n*w*h*1.5 : movingBitrate(w, h, fps)*len/8;
  let text = MOVING.sum.replace('{len}', String(len)).replace('{fps}', String(fps)).replace('{frames}', String(n)).replace('{size}', `${w} × ${h}`)
    .replace('{fmt}', { mp4: 'MP4', webm: 'WebM', png: 'PNG' }[fmt] || fmt).replace('{mb}', bytes >= 1e9 ? (bytes/1e9).toFixed(1) + ' GB' : Math.max(1, Math.round(bytes/1e6)) + ' MB');
  const span = movingSpan(movingPick('movingMove', 'camera'));
  if(span) text += ' · ' + MOVING.sumTime.replace('{span}', movingWords(span)).replace('{rate}', movingWords(span/len)) + (movingPick('movingPlay', 'once') === 'back' ? ' · ' + MOVING.sumBack : '');
  el.textContent = text; }
// (how much time passes in the film, in seconds: none in real time; Time Passing always some)
function movingSpan(move){ const caps = movingRun.caps || {}, timeable = !!(caps.time || caps.dial === 'Daylight');
  if(!timeable || (move !== 'camera' && move !== 'time')) return 0; const v = +movingPick('movingSpan', '0') || 0; return move === 'time' ? v || 86400 : v; }
/** The other looks a film can move to: the spells kept in this browser, and the look before the last change. */
function movingLooks(){
  const out = [];
  if(state.history && state.history.index > 0) out.push({ value: 'history', label: MOVING.before, look: () => JSON.parse(state.history.stack[state.history.index - 1]) });
  for(const rec of readStore(SPELL_KEY)) if(rec && rec.settings) out.push({ value: 'spell:' + rec.name, label: rec.name, look: () => stripToLook({ ...rec.settings, spell: rec.spell }) });
  return out;
}
/** The sheet opened: its moves offered as this surface allows (no camera, no Camera round), the other looks listed. */
export function openMoving(){
  const sheet = $('movingSheet'); if(!sheet) return;
  const type = ($('textureType') || {}).value, on = !!($('textureToggle') || {}).checked, caps = (on && capsFor(type)) || {};
  const looks = movingLooks(), pick = $('movingLook');
  if(pick){ pick.innerHTML = ''; for(const l of looks){ const o = document.createElement('option'); o.value = l.value; o.textContent = l.label; pick.appendChild(o); } }
  // (the moves this surface allows: no camera, no Camera round; Time Passing where it keeps a clock, the Ringworld)
  movingRun.caps = caps; movingRun.able = { camera: !!caps.camera, light: !!caps.light, time: !!caps.time, look: looks.length > 0 };
  const ln = $('movingLightName'); if(ln) ln.textContent = caps.dial === 'Daylight' ? MOVING.day : MOVING.light;
  if(!movingRun.able[movingPick('movingMove', 'camera')]){ const first = movingRadios('movingMove').find(r => movingRun.able[r.value]); if(first) movingSet('movingMove', first.value); }
  const coded = typeof VideoEncoder !== 'undefined'; if(!coded) movingSet('movingFormat', 'png');
  const pp = $('movingPagePx'), cv = $('poemCanvas') || {}; if(pp) pp.textContent = `${state.page.exportW || cv.width} × ${state.page.exportH || cv.height}`;
  paintMoving(); movingNote(coded ? '' : MOVING.noEncoder);
  sheet.hidden = false;
}
// (while a film is being made, closing the sheet, Escape, a tap outside it: a soft no, the film goes on; only Stop, tapped
//  twice, ends it. The page under the sheet stays as it is, since every frame is drawn from it)
export function closeMoving(){ if(movingRun.busy){ movingNote(MOVING.stillMaking); return; } const s = $('movingSheet'); if(s) s.hidden = true; }
/** Is a film being made (the page asks before it is closed or left). */
export const movingBusy = () => movingRun.busy;
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
  let m = movingPick('movingMove', 'camera');
  // (Time Passing never runs in real time; and, until easing is chosen by hand, a full round or a light round goes
  //  evenly, so it loops, and a part turn or a move to a look eases in and out)
  if(m === 'time' && movingPick('movingSpan', '0') === '0') movingSet('movingSpan', '86400');
  if(!movingRun.eased) movingSet('movingEase', m === 'look' || (m === 'camera' && movingPick('movingTurn', '360') !== '360') ? 'ease' : 'even');
  const timeable = !!(caps.time || caps.dial === 'Daylight'), timed = movingSpan(m) > 0;
  const on = { movingLookRow: m === 'look', movingTurnRow: m === 'camera', movingSpanRow: timeable && (m === 'camera' || m === 'time'), movingBeginRow: timed, movingEaseRow: m !== 'time', movingPlayRow: true };
  for(const [id, ok] of Object.entries(on)){ const row = $(id); if(!row) continue; if(row.classList) row.classList.toggle('off', !ok);
    for(const el of row.querySelectorAll ? row.querySelectorAll('input, select') : []) el.disabled = busy || !ok || (el.name === 'movingSpan' && el.value === '0' && m === 'time'); }
  for(const r of movingRadios('movingMove')) r.disabled = busy || !able[r.value];
  for(const r of movingRadios('movingFormat')) r.disabled = busy || (r.value !== 'png' && typeof VideoEncoder === 'undefined');
  for(const n of ['movingSize', 'movingFps']) for(const r of movingRadios(n)) r.disabled = busy;
  if($('movingLength')) $('movingLength').disabled = busy;
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
  const canvas = $('poemCanvas'), move = movingPick('movingMove', 'camera'), fmt = movingPick('movingFormat', 'mp4'), fps = +movingPick('movingFps', '30') || 30, n = Math.min(60, +$('movingLength').value || 12)*fps;   // (a minute at most)
  const [w, h] = movingDims(movingPick('movingSize', 'page'), fmt), back = movingPick('movingPlay', 'once') === 'back', eased = movingPick('movingEase', 'even') === 'ease';
  const turn = +movingPick('movingTurn', '360') || 360, spanS = movingSpan(move), timed = spanS > 0, begin = movingPick('movingBegin', 'lit');
  const start = serializeCurrentSettings(), looked = move === 'look';
  const other = looked ? movingLooks().find(l => l.value === ($('movingLook') || {}).value) : null;
  if(looked && !other){ movingNote(MOVING.noLook); return; }
  const cfg = fmt === 'png' ? null : await movingCodec(fmt, w, h, fps);
  if(fmt !== 'png' && !cfg){ movingNote(fill(MOVING.noCodec, fmt.toUpperCase())); return; }
  const end = other ? other.look() : null, snap = k => { const el = $(k) || $(k + 'Hex'); return !!(el && el.tagName === 'SELECT'); };
  const fades = end ? wholeChanges(start, end, snap).filter(k => k !== 'lookName' && k !== 'spell') : [];
  const pw = canvas.width, ph = canvas.height, num = id => parseFloat(($(id) || {}).value) || 0, cam0 = num('cameraTurn'), light0 = num('textureLight'), tilt0 = num('textureLightTilt');
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
  const tri = u => u < 0.5 ? u*2 : 2 - u*2, along = i => moveAlong(i, n, { back, ends: looked || (move === 'camera' && turn < 360), eased });
  const sink = movingSink(fmt, cfg, w, h, fps);
  let spare = null, made = null;
  // FRAME i's dials and clock (the moves that turn a dial or run the clock; a move between looks is placed below)
  // (a surface that keeps a clock runs it in every film: in real time, so the grass sways and the drones hover as
  //  the camera turns; Time Passing runs it fast)
  const sunAt = hrs => { const [a, tl] = sun(hrs); $('textureLight').value = String(a); $('textureLightTilt').value = String(tl); };
  const place = i => { const u = along(i);
    if(timed){ const at = j => clock(back ? tri(j/n) : j/n), hrs = at(i); sunAt(hrs); if(clocked) setSceneTime(hrs*3600, Math.max(1, Math.abs(at(i + 1) - hrs)*3600)); }
    else if(clocked) setSceneTime(i/fps, 1/fps);
    if(move === 'camera') $('cameraTurn').value = String(((cam0 + turn*u) % 360 + 360) % 360);
    else if(move === 'light'){ if(sunDay) sunAt(clock(u)); else $('textureLight').value = String((light0 + 360*u) % 360); } };
  // FRAMES AHEAD (Ruby: the film kept a twentieth of the machine busy): the frames to come set up one by one, their
  // textures asked for on a worker per spare core, while this one is drawn and encoded. As many ahead as the workers,
  // and as memory allows at this size; none for a move between looks (each frame's look is a whole restore)
  const workers = looked ? 0 : setFilmPool(true), aheadN = looked ? 0 : Math.max(0, Math.min(workers*2, Math.floor(6e8/(w*h*4)))), pending = new Map();
  const queue = j => { if(j >= n || pending.has(j)) return; place(j); pending.set(j, surfaceRequests(w, h).map(r => prefetchTexture(r.type, r.w, r.h, r.opts))); };
  movingRun.busy = true; movingRun.stop = false; paintMoving(); setWorking('saving'); movingWake();
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
          await sink.add(canvas, i); movingNote(fill(MOVING.frame, `${i + 1} / ${n}`) + eta(i)); continue;
        }
        restoreSettings(blendLooks(start, end, t, t < 0.5 ? 0 : 1, snap));
      }
      await movingFrame(); await sink.add(canvas, i);
      movingNote((aheadN ? fill(MOVING.frameAhead, `${i + 1} / ${n}`).replace('{count}', String(Math.min(pending.size, n - i - 1))) : fill(MOVING.frame, `${i + 1} / ${n}`)) + eta(i));
    }
    if(!movingRun.stop){ movingNote(MOVING.finishing); made = await sink.done(); }
  } catch(err){
    sink.drop(); made = null; movingNote(err && err.message === 'too big' ? MOVING.tooBig : MOVING.failed);
    if(typeof console !== 'undefined') console.warn('Moving Image:', err && err.message);
  } finally {
    setFilmPool(false); if(movingRun.wake){ try { movingRun.wake.release(); } catch(e){ /* let go already */ } movingRun.wake = null; }
    clearTimeout(movingRun.sure); movingRun.sure = 0;
    setSceneTime(0); if(looked) restoreSettings(start);
    else for(const [id, v] of [['cameraTurn', cam0], ['textureLight', light0], ['textureLightTilt', tilt0]]) if($(id)) $(id).value = String(v);
    canvas.width = pw; canvas.height = ph; setRenderScale(pw/(state.page.exportW || pw), [state.page.exportW || pw, state.page.exportH || ph]);
    if(document.body && document.body.classList) document.body.classList.remove('saving');
    const stopped = movingRun.stop; movingRun.busy = false; movingRun.stop = false; setWorking(null); paintMoving(); render();
    if(stopped && !made){ sink.drop(); movingNote(MOVING.stopped); }
  }
  if(!made) return;
  const link = document.createElement('a'), url = URL.createObjectURL(made);
  link.download = `poetrypress-${generateFilenameBase()}-${Math.floor(Date.now()/1000)}.${fmt === 'png' ? 'zip' : fmt}`; link.href = url; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  movingNote(fill(MOVING.made, (made.size/1e6).toFixed(1) + ' MB'));
}
