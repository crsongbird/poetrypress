import fs from 'fs';
// THE INTERFACE AT REST AND IN HAND (PERFORMANCE-AUDIT.md §0): the built page in Chromium as a phone (390×844, CPU
// slowed RATE times), idle, typing a line, dragging sliders, changing selects; for each, the main thread's busy
// time, long tasks, slow events (key to paint), the functions that took the time, and every timer, frame and
// listener callback by where it was registered.
//   node tools/ui-profile.mjs [rate=6] [out=ui-profile]   (needs Playwright's Chromium; serves dist/ itself)
//   TEX=liminal  choose a surface first · SLIDERS=texP1,lineSpacing  which sliders to drag
import http from 'http';
import { createRequire } from 'module';
import path from 'path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'dist');
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if(!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ s.writeHead(404); s.end(); return; }
  s.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const req = createRequire(import.meta.url);
let pw; try { pw = req('playwright'); } catch(e){ pw = await import('/opt/npm-tools/node_modules/playwright/index.mjs'); }
const { chromium } = pw;
const PAGE = `http://127.0.0.1:${server.address().port}/index.html`, RATE = +(process.argv[2] || 6), OUT = process.argv[3] || 'ui-profile';
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
await ctx.addInitScript(() => {
  // count and time every timer, frame and observer callback by where it was registered
  const S = window.__perf = { by: {}, t0: performance.now(), on: false };
  const site = () => { const s = (new Error().stack || '').split('\n').slice(3, 6).map(l => l.trim().replace(/^at /, '').replace(/https?:\/\/[^/]+\//, '')).join(' < '); return s; };
  const wrap = (kind, fn, where) => function(...a){ if(!S.on) return fn.apply(this, a); const t = performance.now(); try { return fn.apply(this, a); } finally { const k = kind + ' @ ' + where, r = S.by[k] || (S.by[k] = { n: 0, ms: 0 }); r.n++; r.ms += performance.now() - t; } };
  const st = window.setTimeout, si = window.setInterval, raf = window.requestAnimationFrame, ric = window.requestIdleCallback;
  window.setTimeout = (fn, d, ...a) => typeof fn === 'function' ? st(wrap('timeout' + (d >= 1000 ? '≥1s' : ''), fn, site()), d, ...a) : st(fn, d, ...a);
  window.setInterval = (fn, d, ...a) => typeof fn === 'function' ? si(wrap('interval ' + d + 'ms', fn, site()), d, ...a) : si(fn, d, ...a);
  window.requestAnimationFrame = fn => raf(wrap('raf', fn, site()));
  if(ric) window.requestIdleCallback = (fn, o) => ric(wrap('idle', fn, site()), o);
  const ael = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, fn, o){ if(typeof fn !== 'function') return ael.call(this, type, fn, o);
    const w = wrap('event ' + type, fn, site()); fn.__w = w; return ael.call(this, type, w, o); };
  const rel = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.removeEventListener = function(type, fn, o){ return rel.call(this, type, fn && fn.__w || fn, o); };
  for(const O of ['MutationObserver', 'ResizeObserver', 'IntersectionObserver']){ const C = window[O]; if(!C) continue;
    window[O] = class extends C { constructor(cb, o){ super(wrap(O, cb, site()), o); } }; }
  S.events = []; try { new PerformanceObserver(l => { for(const e of l.getEntries()) if(S.on) S.events.push({ name: e.name, dur: e.duration, proc: e.processingEnd - e.processingStart, delay: e.processingStart - e.startTime }); }).observe({ type: 'event', buffered: false, durationThreshold: 16 }); } catch(e){}
  S.long = []; try { new PerformanceObserver(l => { for(const e of l.getEntries()) if(S.on) S.long.push(e.duration); }).observe({ type: 'longtask' }); } catch(e){}
});
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if(m.type() === 'error') errs.push(m.text()); });
const cdp = await ctx.newCDPSession(page);
await page.goto(PAGE, { waitUntil: 'load' });
await page.waitForTimeout(8000);   // the first paint and the texture settle, unthrottled
if(process.env.TEX){ await page.evaluate(t => { const el = document.getElementById('textureType'); el.value = t; el.dispatchEvent(new Event('change', { bubbles: true })); }, process.env.TEX); await page.waitForTimeout(15000); }
await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
const phase = async (name, act, ms) => {
  await page.evaluate(() => { __perf.by = {}; __perf.events = []; __perf.long = []; __perf.on = true; __perf.t0 = performance.now(); });
  await cdp.send('Profiler.start'); const w0 = Date.now();
  await act(); const wall = Date.now() - w0; if(ms > wall) await page.waitForTimeout(ms - wall);
  const { profile } = await cdp.send('Profiler.stop');
  const res = await page.evaluate(() => { __perf.on = false; return { by: __perf.by, events: __perf.events, long: __perf.long, span: performance.now() - __perf.t0 }; });
  if(process.env.KEEP) fs.writeFileSync(`${OUT}-${name}.cpuprofile`, JSON.stringify(profile));
  // self time per function from the profile
  const self = new Map(), idOf = new Map(profile.nodes.map(n => [n.id, n])); const dt = profile.timeDeltas; let total = 0;
  profile.samples.forEach((id, i) => { const n = idOf.get(id), f = n.callFrame, k = (f.functionName || '(anon)') + ' ' + (f.url.split('/').pop() || '') + ':' + (f.lineNumber + 1); const d = (dt[i + 1] || 0)/1000; total += d; self.set(k, (self.get(k) || 0) + d); });
  const top = [...self].sort((a, b) => b[1] - a[1]).slice(0, 25);
  const busy = [...self].filter(([k]) => !/^\(idle\)|^\(program\)|^\(garbage/.test(k)).reduce((s, [, v]) => s + v, 0);
  const cb = Object.entries(res.by).sort((a, b) => b[1].ms - a[1].ms).slice(0, 25);
  return { name, spanMs: res.span, profiledMs: total, busyMs: busy, gc: self.get('(garbage collector) :0') || 0, top, callbacks: cb, slowEvents: res.events, longTasks: res.long };
};
const report = [];
report.push(await phase('idle', async () => {}, 15000));
// typing: the poem box, a line at a phone's pace
await page.click('#poemText'); await page.keyboard.press('End');
report.push(await phase('typing', async () => { await page.keyboard.type('\nthe moon is a lantern hung on a wire of salt', { delay: 120 }); }, 0));
report.push(await phase('after-typing', async () => {}, 8000));
// sliders dragged (a value every 40ms, as a finger moves) and selects changed, each then left to settle
const drag = id => async () => { for(let i = 0; i <= 25; i++) await page.evaluate(([id, i]) => { const el = document.getElementById(id); if(!el) return; const lo = +el.min || 0, hi = +el.max || 100;
    el.value = String(lo + (hi - lo)*(i <= 12 ? i/12 : (25 - i)/13)); el.dispatchEvent(new Event('input', { bubbles: true })); if(i === 25) el.dispatchEvent(new Event('change', { bubbles: true })); }, [id, i]).then(() => page.waitForTimeout(40)); };
const pick = (id, k) => async () => { await page.evaluate(([id, k]) => { const el = document.getElementById(id); if(!el) return; const o = [...el.options].filter(o => !o.disabled && !o.hidden); el.value = o[k % o.length].value; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, [id, k]); };
for(const id of (process.env.SLIDERS || 'lineSpacing,texP1,textureOpacity,cardOpacity,bgGradientAngle').split(',')) report.push(await phase('drag ' + id, drag(id), 6000));
for(const [id, k] of [['fontFamily', 3], ['textureBlend', 2]]) report.push(await phase('select ' + id, pick(id, k), 6000));
fs.writeFileSync(`${OUT}.json`, JSON.stringify({ rate: RATE, report, errs }, null, 1));
for(const r of report){
  console.log(`\n=== ${r.name}: ${(r.spanMs/1000).toFixed(1)}s, busy ${r.busyMs.toFixed(0)}ms (${(100*r.busyMs/r.spanMs).toFixed(1)}%), gc ${r.gc.toFixed(0)}ms, long tasks ${r.longTasks.length} (${r.longTasks.reduce((a,b)=>a+b,0).toFixed(0)}ms), slow events ${r.slowEvents.length}`);
  if(r.slowEvents.length){ const d = r.slowEvents.map(e => e.dur).sort((a,b)=>a-b); console.log('  event durations: median', d[d.length>>1], 'max', d[d.length-1], 'n', d.length); }
  console.log('  top self time:'); for(const [k, v] of r.top.slice(0, 15)) console.log('   ', v.toFixed(1).padStart(8), k);
  console.log('  callbacks:'); for(const [k, v] of r.callbacks.slice(0, 15)) console.log('   ', v.ms.toFixed(1).padStart(8), 'ms', String(v.n).padStart(5), '×', k.slice(0, 170));
}
if(errs.length) console.log('errors:', errs.slice(0, 5));
await browser.close(); server.close();
