/**
 * tools/phone-shot.mjs — a screenshot of the built page on a phone, at a panel, with a surface chosen (needs Playwright).
 *
 *   node tools/phone-shot.mjs out.png [--tex meadow] [--tab page] [--at texP1] [--width 412]
 *     --tab   the tab to open (write, type, style, page, more)    --at  scroll the element with this id into view
 *     --el    shoot only the element with this id (e.g. texControls); --tex may list several surfaces, one shot each (out-<tex>.png)
 * It also prints any page error, and where the element --at sits (its left and right edge against the screen's width).
 */
import http from 'http'; import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i < 0 ? d : process.argv[i + 1]; };
const OUT = process.argv[2] || 'phone.png', ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'dist');
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if(!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ s.writeHead(404); s.end(); return; }
  s.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : 'text/javascript' }); fs.createReadStream(f).pipe(s); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const req = createRequire(import.meta.url); let pw; try { pw = req('playwright'); } catch(e){ pw = await import('/opt/npm-tools/node_modules/playwright/index.mjs'); }
const browser = await pw.chromium.launch();
const ctx = await browser.newContext({ viewport: { width: +arg('--width', 412), height: 860 }, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
const page = await ctx.newPage(), errs = []; page.on('pageerror', e => errs.push(String(e)));
await page.goto(`http://127.0.0.1:${server.address().port}/index.html`); await page.waitForTimeout(1200);
const texes = (arg('--tex') || '').split(',').filter(Boolean), EL = arg('--el');
if(texes.length > 1 || EL){
  await page.click(`.tab-btn[data-tab="${arg('--tab', 'page')}"]`); await page.waitForTimeout(600);
  for(const t of texes.length ? texes : ['']){
    if(t) await page.evaluate(t => { const s = document.getElementById('textureType'); s.value = t; s.dispatchEvent(new Event('change', { bubbles: true })); }, t);
    await page.waitForTimeout(500);
    const file = texes.length > 1 ? OUT.replace(/\.png$/, '') + '-' + t + '.png' : OUT;
    const el = EL ? await page.$('#' + EL) : null;
    if(el){ await el.scrollIntoViewIfNeeded(); await el.screenshot({ path: file }); } else await page.screenshot({ path: file });
    console.log('wrote', file);
  }
  console.log(errs.length ? 'ERRORS: ' + errs.join(' | ') : '(no page errors)');
  await browser.close(); server.close(); process.exit(0);
}
if(arg('--tex')) await page.evaluate(t => { const s = document.getElementById('textureType'); s.value = t; s.dispatchEvent(new Event('change', { bubbles: true })); }, arg('--tex'));
await page.click(`.tab-btn[data-tab="${arg('--tab', 'page')}"]`); await page.waitForTimeout(800);
const at = arg('--at');
if(at){ const m = await page.evaluate(id => { const e = document.getElementById(id); if(!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { left: Math.round(b.left), right: Math.round(b.right), screen: innerWidth }; }, at);
  console.log(at, JSON.stringify(m)); await page.waitForTimeout(400); }
await page.screenshot({ path: OUT });
console.log('wrote', OUT, errs.length ? 'ERRORS: ' + errs.join(' | ') : '(no page errors)');
await browser.close(); server.close();
