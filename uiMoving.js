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
import { render, setRenderScale } from './canvasRenderer.js';
import { texturesSettled, setDrafting } from './textureService.js';
import { capsFor } from './textureGenerators.js';
import { readStore, SPELL_KEY, stripToLook } from './vault.js';
import { state } from './uiState.js';
import { setWorking } from './uiWorking.js';
import { draftTimer } from './uiSurface.js';
import { generateFilenameBase } from './uiLayout.js';
import { restoreSettings, serializeCurrentSettings } from './uiLook.js';
import { blendLooks, crc32, moveAt, mp4Parts, webmBytes, wholeChanges, zipParts } from './moving.js';

const MOVING_FPS = 30;
const MOVING_SIZES = { wide: [1920, 1080], tall: [1080, 1920], square: [1080, 1080] };
// (where a look's kind changes, the film fades across this middle stretch of the move)
const MOVING_FADE = [0.38, 0.62];
const movingRun = { busy: false, stop: false };

const movingNote = text => { const n = $('movingNote'); if(n) n.textContent = text || ''; };
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
  const move = $('movingMove'), opt = v => move && [...move.options].find(o => o.value === v);
  if(opt('camera')) opt('camera').disabled = !caps.camera;
  if(opt('light')){ opt('light').disabled = !caps.light; opt('light').textContent = caps.dial === 'Daylight' ? MOVING.day : MOVING.light; }
  const looks = movingLooks(), pick = $('movingLook');
  if(pick){ pick.innerHTML = ''; for(const l of looks){ const o = document.createElement('option'); o.value = l.value; o.textContent = l.label; pick.appendChild(o); } }
  for(const v of ['look', 'lookback']) if(opt(v)) opt(v).disabled = !looks.length;
  if(move && move.selectedOptions && move.selectedOptions[0] && move.selectedOptions[0].disabled){ const first = [...move.options].find(o => !o.disabled); if(first) move.value = first.value; }
  const fmt = $('movingFormat'), coded = typeof VideoEncoder !== 'undefined';
  if(fmt){ for(const o of fmt.options) if(o.value !== 'png') o.disabled = !coded; if(!coded) fmt.value = 'png'; }
  paintMoving(); movingNote(coded ? '' : MOVING.noEncoder);
  sheet.hidden = false;
}
export function closeMoving(){ if(movingRun.busy){ movingRun.stop = true; return; } const s = $('movingSheet'); if(s) s.hidden = true; }
/** The rows the chosen move needs (the other look only for a move to one). */
export function paintMoving(){
  const m = ($('movingMove') || {}).value, row = $('movingLookRow');
  if(row) row.hidden = !(m === 'look' || m === 'lookback');
  const b = $('movingMake'); if(b) b.textContent = movingRun.busy ? MOVING.stop : MOVING.make;
  for(const id of ['movingMove', 'movingLook', 'movingSize', 'movingLength', 'movingFormat']){ const el = $(id); if(el) el.disabled = movingRun.busy; }
}
/** The encoder's settings, the first this browser can make at this size: H.264 for an MP4, VP9 (or VP8) for a WebM. */
async function movingCodec(fmt, w, h){
  if(typeof VideoEncoder === 'undefined') return null;
  const bitrate = Math.round(Math.min(40e6, Math.max(4e6, w*h*MOVING_FPS*0.15)));
  const tries = fmt === 'mp4' ? ['avc1.640028', 'avc1.640033', 'avc1.640034', 'avc1.4d0028', 'avc1.4d0033', 'avc1.420028'] : ['vp09.00.40.08', 'vp09.00.50.08', 'vp09.00.51.08', 'vp8'];
  for(const codec of tries){
    const cfg = { codec, width: w, height: h, bitrate, framerate: MOVING_FPS, ...(fmt === 'mp4' ? { avc: { format: 'avc' } } : {}) };
    try { const r = await VideoEncoder.isConfigSupported(cfg); if(r && r.supported) return cfg; } catch(e){ /* the next */ }
  }
  return null;
}
/** Where the frames go: a PNG each into a zip, or each into the encoder and on into an MP4 or a WebM. */
function movingSink(fmt, cfg, w, h){
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
      const vf = new VideoFrame(canvas, { timestamp: Math.round(i*1e6/MOVING_FPS), duration: Math.round(1e6/MOVING_FPS), alpha: 'discard' });
      encoder.encode(vf, { keyFrame: i % (MOVING_FPS*2) === 0 }); vf.close();
      while(encoder.encodeQueueSize > 3) await new Promise(r => setTimeout(r, 4));
    },
    done: async () => {
      await encoder.flush(); encoder.close(); if(failed) throw failed;
      // (no reordered frames: the containers here keep one time per frame, in order)
      if(stamps.some((s, i) => i && s < stamps[i - 1])) throw new Error('reordered frames');
      if(fmt === 'mp4'){ if(!avcC) throw new Error('no avcC'); return new Blob(mp4Parts({ width: w, height: h, fps: MOVING_FPS, avcC, frames }), { type: 'video/mp4' }); }
      return new Blob([webmBytes({ width: w, height: h, fps: MOVING_FPS, codec: cfg.codec === 'vp8' ? 'V_VP8' : 'V_VP9', frames })], { type: 'video/webm' });
    },
    drop: () => { try { encoder.close(); } catch(e){ /* closed already */ } } };
}
/**
 * A day on the Ringworld, where the light dial is the sun: from where it stands now, on up (the dial's middle is noon),
 * down the far side to dusk at the rim, under it for the night (past the rim, to 130), and up again at dawn where it
 * began. u from 0 to 1 gives [the dial's turn, its tilt]: once round is a whole day, so the film loops.
 */
function movingDay(a0, tilt0){
  const h = t => t <= 100 ? 1 - t/100 : -(t - 100)/30, h0 = Math.max(-1, Math.min(1, h(tilt0))), th0 = Math.asin(h0);
  return u => { const th = th0 + u*Math.PI*2, up = Math.sin(th), rising = Math.cos(th) >= 0;
    return [((rising ? a0 : a0 + 180) % 360 + 360) % 360, up >= 0 ? 100 - 100*up : 100 - 30*up]; };
}
// a frame: the page drawn, the textures it asks for made, and drawn again with them (as Save does)
async function movingFrame(){ render(); await texturesSettled(); render(); }
/** Make the film (or, while one is being made, stop it). */
export async function makeMoving(){
  if(movingRun.busy){ movingRun.stop = true; return; }
  const canvas = $('poemCanvas'), move = $('movingMove').value, fmt = $('movingFormat').value, n = (+$('movingLength').value || 12)*MOVING_FPS;
  let [w, h] = MOVING_SIZES[$('movingSize').value] || [state.page.exportW || canvas.width, state.page.exportH || canvas.height];
  if(fmt !== 'png'){   // (a film's page held to 4K's area, past which the encoders' levels end; and even sides, as H.264 and VP9 take)
    const k = Math.min(1, Math.sqrt(3840*2160/(w*h))); w = Math.round(w*k); h = Math.round(h*k); w -= w % 2; h -= h % 2; }
  const start = serializeCurrentSettings(), looked = move === 'look' || move === 'lookback';
  const other = looked ? movingLooks().find(l => l.value === ($('movingLook') || {}).value) : null;
  if(looked && !other){ movingNote(MOVING.noLook); return; }
  const cfg = fmt === 'png' ? null : await movingCodec(fmt, w, h);
  if(fmt !== 'png' && !cfg){ movingNote(fill(MOVING.noCodec, fmt.toUpperCase())); return; }
  const end = other ? other.look() : null, snap = k => { const el = $(k) || $(k + 'Hex'); return !!(el && el.tagName === 'SELECT'); };
  const fades = end ? wholeChanges(start, end, snap).filter(k => k !== 'lookName' && k !== 'spell') : [];
  const pw = canvas.width, ph = canvas.height, num = id => parseFloat(($(id) || {}).value) || 0, cam0 = num('cameraTurn'), light0 = num('textureLight'), tilt0 = num('textureLightTilt');
  const day = move === 'light' && (capsFor(($('textureType') || {}).value) || {}).dial === 'Daylight' ? movingDay(light0, tilt0) : null;
  const sink = movingSink(fmt, cfg, w, h);
  let spare = null, made = null;
  movingRun.busy = true; movingRun.stop = false; paintMoving(); setWorking('saving');
  if(document.body && document.body.classList) document.body.classList.add('saving');
  try {
    canvas.width = w; canvas.height = h; setDrafting(false); clearTimeout(draftTimer); setRenderScale(1, [w, h]);
    for(let i = 0; i < n && !movingRun.stop; i++){
      if(move === 'camera') $('cameraTurn').value = String((cam0 + 360*i/n) % 360);
      else if(day){ const [a, tl] = day(i/n); $('textureLight').value = String(a); $('textureLightTilt').value = String(tl); }
      else if(move === 'light') $('textureLight').value = String((light0 + 360*i/n) % 360);
      else {
        const t = moveAt(i, n, move === 'lookback'), mid = fades.length && t > MOVING_FADE[0] && t < MOVING_FADE[1];
        if(mid){   // both ways at once: the frame as it was, faded into the frame as it becomes
          restoreSettings(blendLooks(start, end, t, 0, snap)); await movingFrame();
          spare = spare || document.createElement('canvas'); spare.width = w; spare.height = h; spare.getContext('2d').drawImage(canvas, 0, 0);
          restoreSettings(blendLooks(start, end, t, 1, snap)); await movingFrame();
          const u = (t - MOVING_FADE[0])/(MOVING_FADE[1] - MOVING_FADE[0]), x = canvas.getContext('2d');
          x.save(); x.globalAlpha = 1 - u*u*(3 - 2*u); x.drawImage(spare, 0, 0); x.restore();
          await sink.add(canvas, i); movingNote(fill(MOVING.frame, `${i + 1} / ${n}`)); continue;
        }
        restoreSettings(blendLooks(start, end, t, t < 0.5 ? 0 : 1, snap));
      }
      await movingFrame(); await sink.add(canvas, i);
      movingNote(fill(MOVING.frame, `${i + 1} / ${n}`));
    }
    if(!movingRun.stop){ movingNote(MOVING.finishing); made = await sink.done(); }
  } catch(err){
    sink.drop(); made = null; movingNote(err && err.message === 'too big' ? MOVING.tooBig : MOVING.failed);
    if(typeof console !== 'undefined') console.warn('Moving Image:', err && err.message);
  } finally {
    if(looked) restoreSettings(start);
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
