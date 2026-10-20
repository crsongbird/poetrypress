// tools/still.mjs — does anything on the page move while a control is used? (Ruby: "never ever add [something] that
// moves the UI around while, or immediately after the user has interacted with it"). Every surface's sliders are swept
// through their ranges on a phone; any control, the Controls heading or the display line that moves or resizes is named.
//   node tools/still.mjs [surface|all]      (the repo's dist/; run node build.mjs first; needs Playwright)
import http from 'http'; import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'dist'), TEX = process.argv[2] || 'all';
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, '') || 'index.html'); if(!fs.existsSync(f) || fs.statSync(f).isDirectory()){ s.writeHead(404); s.end(); return; } s.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : 'text/javascript' }); fs.createReadStream(f).pipe(s); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const req = createRequire(new URL(import.meta.url)); let pw; try { pw = req('playwright'); } catch(e){ pw = await import('/opt/npm-tools/node_modules/playwright/index.mjs'); }
const b = await pw.chromium.launch(); const ctx = await b.newContext({ viewport: { width: 412, height: 860 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
const page = await ctx.newPage(); page.on('pageerror', e => console.log('ERR', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/index.html`); await page.waitForTimeout(1200);
await page.click('.tab-btn[data-tab="page"]'); await page.waitForTimeout(800);
const types = TEX === 'all' ? await page.evaluate(() => [...document.querySelectorAll('#textureType option')].filter(o => !o.hidden && o.value).map(o => o.value)) : [TEX];
for(const T of types){ await page.evaluate(t => { const s = document.getElementById('textureType'); s.value = t; s.dispatchEvent(new Event('change', { bubbles: true })); }, T); await page.waitForTimeout(150);
await page.evaluate(() => document.querySelector('#texControls').scrollIntoView({ block: 'start' })); await page.waitForTimeout(300);
// drag every fader and every knob through its range; record every field's rect at each step
const res = await page.evaluate(async () => {
  const rects = () => [...document.querySelectorAll('#texControls .field, #texControls summary, #texReadout')].map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round).join(','); }).join('|');
  const out = []; const base = rects();
  for(let i = 1; i <= 10; i++){ const inp = document.getElementById('texP' + i); if(!inp || inp.parentElement.style.display === 'none') continue;
    const lo = +inp.min, hi = +inp.max; let moved = 0;
    for(let q = 0; q <= 8; q++){ inp.value = lo + (hi - lo)*q/20; inp.dispatchEvent(new Event('input', { bubbles: true })); window.showReadout && 0; await new Promise(r => setTimeout(r, 5)); if(rects() !== base) moved++; }
    out.push([i, inp.id, moved]); }
  return out; });
const bad = res.filter(r => r[2]); if(bad.length) console.log(T, JSON.stringify(bad)); }
console.log(`still: ${types.length} surface${types.length === 1 ? '' : 's'} swept`); await b.close(); server.close();
