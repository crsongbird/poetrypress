// smoke.mjs — click every kind of control on the built page, on a desk and on a phone, and report any page error
//   node tools/smoke.mjs [repo]      (the repo's dist/; run node build.mjs first; needs Playwright)
// After a change to the UI's wiring (appEvents.js and its ui*.js modules), the errors must be none.
import http from 'http'; import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const ROOT = path.resolve(process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), '..'), 'dist');
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if(!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ s.writeHead(404); s.end(); return; }
  s.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : 'text/javascript' }); fs.createReadStream(f).pipe(s); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const req = createRequire(import.meta.url); let pw; try { pw = req('playwright'); } catch(e){ pw = await import('/opt/npm-tools/node_modules/playwright/index.mjs'); }
const browser = await pw.chromium.launch();
const out = {};
for(const mobile of [false, true]){
  const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' } : { viewport: { width: 1300, height: 900 }, serviceWorkers: 'block' });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  page.on('dialog', d => d.dismiss());
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`); await page.waitForTimeout(1500);
  const done = [];
  const tryClick = async (sel, what) => { const n = await page.evaluate(sel => { const els = [...document.querySelectorAll(sel)].slice(0, 3); els.forEach(e => e.click()); return els.length; }, sel); await page.waitForTimeout(400); done.push((n ? '' : '-') + what); };
  for(const tab of ['page', 'style', 'type', 'more', 'write']) await tryClick(`.tab-btn[data-tab="${tab}"]`, 'tab:' + tab);
  await page.evaluate(() => { const s = document.getElementById('textureType'); for(const t of ['meadow', 'blackhole', 'summoning', 'linen']){ s.value = t; s.dispatchEvent(new Event('change', { bubbles: true })); } });
  await page.waitForTimeout(800); done.push('surfaces');
  await page.evaluate(() => { const p = document.getElementById('poemText'); p.value = 'a small test\nof the split'; p.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForTimeout(600);
  for(const [sel, what] of [['.history-btn', 'undo'], ['.die-btn', 'die'], ['.die-more', 'diemore'], ['.lock-btn', 'lock'], ['.master-lock', 'master'], ['#filmBtn', 'film'], ['.el-btn:not(.is-default)', 'reading'], ['.layer-swap', 'swap'], ['.ld-random', 'lightdie'], ['.snap-btn', 'snap'], ['.seed-moon', 'seedmoon'], ['.preset-group-head', 'group'], ['.radio-btn', 'radio'], ['.film-frame', 'frame'], ['.athanor-top', 'athanor'], ['.forge-parts-btn', 'parts'], ['.forge-seed-btn', 'forgeseed']]) await tryClick(sel, what);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  for(const sel of ['#presetGrid button', '.spell-chip']) await tryClick(sel, 'preset');
  await page.waitForTimeout(1500);
  out[mobile ? 'phone' : 'desktop'] = { done: done.join(' '), errs };
  await ctx.close();
}
console.log(JSON.stringify(out, null, 1)); await browser.close(); server.close();
