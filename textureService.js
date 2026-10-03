/**
 * textureService.js — the page's side of texture making.
 *
 * The renderer asks for a texture by SLOT (the main texture, Deep Field's
 * nebula and stars). A cached texture comes straight back. Otherwise the
 * texture worker makes it while the page stays responsive, and until it
 * arrives the slot's previous texture is shown — scaled to fit — so dragging
 * a knob never blanks the page. Requests coalesce: while a slot's texture is
 * being made, only the LATEST wish for that slot waits behind it, so the
 * worker never works through stale knob positions.
 *
 * Falls back to making textures right here, synchronously, where there is no
 * worker (old browsers, Node tests) and for the textures that draw text with
 * the page's web fonts, which a worker can't see.
 */
import { getTextureCanvas, textureKeyFor, peekTexture, storeTexture } from './textureGenerators.js';

const ON_PAGE = new Set(['summoning', 'cards']);      // they draw glyphs and card faces in web fonts
let worker = null, broken = false, nextId = 1;
const inflight = new Map();      // slot → { id, key, type }
const wanted = new Map();        // slot → the latest request waiting its turn
const lastGood = new Map();      // slot → { type, tex } shown while a new one is made
const waiters = [];
let onReady = () => {};

// A subtle sign the worker is busy: body.tex-busy, shown only when the work
// takes longer than a moment, so fast textures don't flicker it.
let busyTimer = null;
function busy(on){
  if(typeof document === 'undefined' || !document.body || !document.body.classList) return;
  clearTimeout(busyTimer);
  if(on) busyTimer = setTimeout(() => document.body.classList.add('tex-busy'), 180);
  else document.body.classList.remove('tex-busy');
}

/** Called whenever a texture arrives from the worker (the renderer redraws). */
export function onTextureReady(fn){ onReady = fn; }

function boot(){
  if(worker || broken) return worker;
  try {
    if(typeof Worker !== 'function' || typeof OffscreenCanvas !== 'function' || typeof document === 'undefined' || !document.getElementById) throw 0;
    const inline = document.getElementById('vellum-texture-worker');
    // the built page carries the worker in its <head>; if it isn't there yet,
    // the page is still loading — try again later rather than give up for good
    if(!inline && document.readyState === 'loading') return null;
    worker = inline
      ? new Worker(URL.createObjectURL(new Blob([inline.textContent], { type: 'text/javascript' })))
      // served from the source files: the module worker beside the page, by a
      // page-relative URL (a module-relative one would not parse in the built page)
      : new Worker('./textureWorker.js', { type: 'module' });
    worker.onmessage = arrived;
    worker.onerror = () => { broken = true; worker = null; flushOnPage(); };
  } catch(e){ broken = true; worker = null; }
  return worker;
}

/** The texture for `slot`: cached, or being made (the slot's last one meanwhile). */
export function requestTexture(slot, type, w, h, opts){
  const key = textureKeyFor(type, w, h, opts);
  const hit = peekTexture(key);
  if(hit){ wanted.delete(slot); lastGood.set(slot, { type, tex: hit }); return hit; }
  if(ON_PAGE.has(type) || !boot()){
    const tex = getTextureCanvas(type, w, h, opts);
    lastGood.set(slot, { type, tex }); return tex;
  }
  const busy = inflight.get(slot);
  if(!(busy && busy.key === key)){ wanted.set(slot, { key, type, w, h, opts }); pump(slot); }
  const prev = lastGood.get(slot);
  return prev && prev.type === type ? prev.tex : null;      // the old look meanwhile; nothing if the texture changed
}

function pump(slot){
  if(inflight.has(slot) || !worker) return;
  const job = wanted.get(slot); if(!job) return;
  wanted.delete(slot);
  const id = nextId++;
  inflight.set(slot, { id, key: job.key, type: job.type, job });
  busy(true);
  worker.postMessage({ id, type: job.type, w: job.w, h: job.h, opts: job.opts });
}

function arrived(e){
  const { id, bitmap, error } = e.data;
  let slot = null; for(const [s, f] of inflight) if(f.id === id){ slot = s; break; }
  if(slot == null) return;
  const f = inflight.get(slot); inflight.delete(slot);
  let tex = bitmap;
  if(!tex){ tex = getTextureCanvas(f.job.type, f.job.w, f.job.h, f.job.opts); if(typeof console !== 'undefined') console.warn('texture worker:', error); }
  else storeTexture(f.key, tex);
  lastGood.set(slot, { type: f.type, tex });
  pump(slot);
  onReady();
  settle();
}

function flushOnPage(){
  for(const [slot, f] of inflight){ const t = getTextureCanvas(f.job.type, f.job.w, f.job.h, f.job.opts); lastGood.set(slot, { type: f.type, tex: t }); }
  inflight.clear();
  for(const [slot, j] of wanted){ const t = getTextureCanvas(j.type, j.w, j.h, j.opts); lastGood.set(slot, { type: j.type, tex: t }); }
  wanted.clear(); onReady(); settle();
}

/** For the debug hook: is the worker running, and what is it doing. */
export function textureServiceInfo(){ return { worker: !!worker, broken, inflight: inflight.size, waiting: wanted.size }; }

/** Resolves once every requested texture has arrived (Save image waits on this). */
export function texturesSettled(){
  return (inflight.size === 0 && wanted.size === 0) ? Promise.resolve() : new Promise(r => waiters.push(r));
}
function settle(){ if(inflight.size === 0 && wanted.size === 0){ busy(false); while(waiters.length) waiters.shift()(); } }
