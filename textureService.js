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
import { getTextureCanvas, textureKeyFor, peekTexture, storeTexture, dropLargeTextures } from './textureGenerators.js';

const ON_PAGE = new Set(['summoning', 'cards']);      // they draw glyphs and card faces in web fonts
// A POOL of workers (one per spare core, up to two): two slots — Deep Field's
// nebula and its stars — are made side by side, and a new wish for a slot
// whose old texture is still being made starts at once on a free worker. The
// stale job finishes alongside and shows only if nothing newer has arrived.
// The pool fits the device: one worker per spare core, up to two (a phone has
// six to eight cores; a single-core machine gets one, where a second would
// only take turns with the first).
const POOL_SIZE = Math.max(1, Math.min(2, ((typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 2) - 1));
let crashes = 0; const MAX_CRASHES = 4;
let pool = null, broken = false, nextId = 1, workerSrc = null, shownCount = 0, lastShown = '';
const inflight = new Map();      // slot → { id, key, type, job, worker, started }
const wanted = new Map();        // slot → the latest request waiting its turn
const shownSeq = new Map();      // slot → the newest job whose texture has been shown
// DRAFTING: while a texture knob or the light is being dragged, a slow
// texture (its last generation took over DRAFT_OVER_MS) is made at half
// resolution — about four times faster — and drawn scaled up; when the drag
// stops the full preview is made and the picture sharpens. Saving never drafts.
const DRAFT_OVER_MS = 250;
const genMs = new Map();         // type → how long its last generation took
let drafting = false;
/** On while a knob is being dragged; off sharpens the preview. */
export function setDrafting(on){ if(drafting === on) return; drafting = on; if(!on) onReady(); }
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

function spawn(){
  const w = workerSrc
    ? new Worker(workerSrc)
    // served from the source files: the module worker beside the page, by a
    // page-relative URL (a module-relative one would not parse in the built page)
    : new Worker('./textureWorker.js', { type: 'module' });
  const entry = { w, job: null };
  w.onmessage = e => arrived(entry, e);
  // A worker that crashes (on a phone, usually running out of memory) is
  // replaced and its job tried again; only after several crashes does the
  // service fall back to making textures on the page.
  w.onerror = ev => {
    if(ev && ev.preventDefault) ev.preventDefault();
    crashes++;
    const f = entry.job; entry.job = null;
    try { w.terminate(); } catch(_){}
    if(crashes > MAX_CRASHES){ broken = true; for(const x of pool || []) try { x.w.terminate(); } catch(_){} pool = null; flushOnPage(); return; }
    const i = pool ? pool.indexOf(entry) : -1;
    if(i >= 0) pool[i] = spawn();
    if(f && inflight.get(f.slot) === f){ inflight.delete(f.slot); if(!wanted.has(f.slot)) wanted.set(f.slot, f.job); }
    // the crash may have been memory: let the big cached textures go first
    dropLargeTextures(1024*1024*4);
    setTimeout(pump, 200);
  };
  return entry;
}
function boot(){
  if(pool || broken) return pool;
  try {
    if(typeof Worker !== 'function' || typeof OffscreenCanvas !== 'function' || typeof document === 'undefined' || !document.getElementById) throw 0;
    const inline = document.getElementById('vellum-texture-worker');
    // the built page carries the worker in its <head>; if it isn't there yet,
    // the page is still loading — try again later rather than give up for good
    if(!inline && document.readyState === 'loading') return null;
    if(inline) workerSrc = URL.createObjectURL(new Blob([inline.textContent], { type: 'text/javascript' }));
    pool = Array.from({ length: POOL_SIZE }, spawn);
  } catch(e){ broken = true; pool = null; }
  return pool;
}

/** The texture for `slot`: cached, or being made (the slot's last one meanwhile). */
export function requestTexture(slot, type, w, h, opts){
  if(drafting && (genMs.get(type) || 0) > DRAFT_OVER_MS && !(opts && opts.final)){
    w = Math.ceil(w/2); h = Math.ceil(h/2); opts = { ...opts, scale: (opts && opts.scale || 1)/2 };
  }
  const key = textureKeyFor(type, w, h, opts);
  const hit = peekTexture(key);
  if(hit){ wanted.delete(slot); lastGood.set(slot, { type, tex: hit }); return hit; }
  if(ON_PAGE.has(type) || !boot()){
    const tex = getTextureCanvas(type, w, h, opts);
    lastGood.set(slot, { type, tex }); return tex;
  }
  const busyJob = inflight.get(slot);
  if(!(busyJob && busyJob.key === key)){ wanted.set(slot, { key, type, w, h, opts }); pump(); }
  const prev = lastGood.get(slot);
  return prev && prev.type === type ? prev.tex : null;      // the old look meanwhile; nothing if the texture changed
}

function now(){ return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }

function pump(){
  if(!pool) return;
  for(const [slot, job] of wanted){
    const running = inflight.get(slot);
    if(running && running.key === job.key){ wanted.delete(slot); continue; }   // already being made
    // No worker free: the running job finishes (and is shown), then this one
    // runs. Shutting stale work down was measured to be SLOWER — a fresh
    // worker starts cold (unoptimised code) — so nothing is killed. With a
    // free worker (a phone's spare core) the newest wish starts at once,
    // warm, while the stale job finishes alongside.
    const worker = pool.find(x => !x.job);
    if(!worker) continue;
    if(running) inflight.delete(slot);            // it runs on, shown only if nothing newer arrives first
    wanted.delete(slot);
    const id = nextId++;
    const f = { id, slot, key: job.key, type: job.type, job, worker, started: now() };
    worker.job = f; inflight.set(slot, f);
    busy(true);
    worker.w.postMessage({ id, type: job.type, w: job.w, h: job.h, opts: job.opts });
  }
}

function arrived(entry, e){
  const { id, bitmap, error } = e.data;
  const f = entry.job; entry.job = null;
  if(!f || f.id !== id){ pump(); return; }
  const current = inflight.get(f.slot) === f;
  if(current) inflight.delete(f.slot);
  let tex = bitmap;
  if(!tex && current){ tex = getTextureCanvas(f.job.type, f.job.w, f.job.h, f.job.opts); if(typeof console !== 'undefined') console.warn('texture worker:', error); }
  if(tex){
    genMs.set(f.type, now() - f.started);
    storeTexture(f.key, tex);
    // interim results show while nothing newer has; the picture never steps back
    if(id > (shownSeq.get(f.slot) || 0)){ shownSeq.set(f.slot, id); lastGood.set(f.slot, { type: f.type, tex }); shownCount++; lastShown = (tex.width || 0) + 'px'; onReady(); }
  }
  pump();
  settle();
}

function flushOnPage(){
  for(const [slot, f] of inflight){ const t = getTextureCanvas(f.job.type, f.job.w, f.job.h, f.job.opts); lastGood.set(slot, { type: f.type, tex: t }); }
  inflight.clear();
  for(const [slot, j] of wanted){ const t = getTextureCanvas(j.type, j.w, j.h, j.opts); lastGood.set(slot, { type: j.type, tex: t }); }
  wanted.clear(); onReady(); settle();
}

/** For the debug hook: are the workers running, and what are they doing. */
export function textureServiceInfo(){ return { worker: !!pool, workers: pool ? pool.length : 0, broken, inflight: inflight.size, waiting: wanted.size, crashes, shown: shownCount, lastShown, drafting }; }

/** Resolves once every requested texture has arrived (Save image waits on this). */
export function texturesSettled(){
  return (inflight.size === 0 && wanted.size === 0) ? Promise.resolve() : new Promise(r => waiters.push(r));
}
function settle(){ if(inflight.size === 0 && wanted.size === 0){ busy(false); while(waiters.length) waiters.shift()(); } }
