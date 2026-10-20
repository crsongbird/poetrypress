// tools/gpu-ab.mjs — the lighting, a GPU pass (the Lens Blur) and the box's glass, run in a real Chromium on software
// WebGL, interleaved in one context; prints a hash of every result. Run it on two trees and compare the output:
//   node tools/gpu-ab.mjs <repo> > a.txt; node tools/gpu-ab.mjs <other repo> > b.txt; cmp a.txt b.txt   (needs Playwright)
import http from 'http'; import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const ROOT = path.resolve(process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), '..'));
const server = http.createServer((q, s) => { const u = decodeURIComponent(q.url.split('?')[0]);
  if(u === '/t.html'){ s.writeHead(200, { 'content-type': 'text/html' }); s.end(`<script type="module">
    import * as C from '/texCore.js'; import * as L from '/stepsLens.js'; import * as B from '/boxFx.js';
    C.setGpuSoftware(true); B.setBoxFxSoftware(true);
    const LENS_FRAG = (await (await fetch('/stepsLens.js')).text()).match(new RegExp('const LENS_FRAG = \\x60([^\\x60]*)\\x60'))[1].replace('$' + '{GOLDEN}', '2.39996323');
    const h32 = a => { const u = new Uint8Array(a.buffer || a); let x = 2166136261; for(let i = 0; i < u.length; i++){ x ^= u[i]; x = Math.imul(x, 16777619); } return (x >>> 0).toString(16); };
    const hashAny = r => { if(!r) return 'null'; if(ArrayBuffer.isView(r)) return h32(r); if(typeof r === 'object') return Object.keys(r).sort().map(k => k + ':' + (ArrayBuffer.isView(r[k]) ? h32(r[k]) : typeof r[k] === 'number' ? r[k].toFixed(4) : typeof r[k])).join(','); return String(r); };
    const out = [];
    const w = 96, h = 80, N = w*h, H = new Float32Array(N); for(let i = 0; i < N; i++){ const x = i % w, y = (i/w)|0; H[i] = 0.5 + 0.3*Math.sin(x*0.21)*Math.cos(y*0.17) + 0.1*Math.sin(x*y*0.003); }
    const light = o => { out.push('light ' + C.lightBackend() + ' ' + hashAny(C.lightHeights(H, w, h, o))); };
    const kernel = () => { const rgba = new Float32Array(N*4), D = new Float32Array(N); for(let i = 0; i < N; i++){ rgba[i*4] = H[i]; rgba[i*4+1] = 1 - H[i]; rgba[i*4+2] = 0.5; rgba[i*4+3] = 3*H[i]; D[i] = H[i]; }
      out.push('kernel ' + hashAny(C.gpuKernel('lensblur', LENS_FRAG, w, h, [{ name: 'uImg', data: rgba, ch: 4 }, { name: 'uDepth', data: D, ch: 1 }], { uSize: [w, h], uMaxR: 4, uStep: 0.5, uBlades: 0, uRot: 0 }))); };
    light({ light: 315, relief: 1 }); kernel(); light({ light: 90, relief: 2, gloss: 0.8, shadow: 0.9 }); kernel(); light({ light: 200, relief: 0.5, ao: 0.8 });
    const src = new OffscreenCanvas(120, 90), g = src.getContext('2d'); const grd = g.createLinearGradient(0, 0, 120, 90); grd.addColorStop(0, '#c33'); grd.addColorStop(1, '#33c'); g.fillStyle = grd; g.fillRect(0, 0, 120, 90);
    for(const mode of ['frosted', 'rippled', 'reeded', 'crackled']){ const c = B.boxGlass(src, { x: 10, y: 10, w: 80, h: 60 }, mode, 60, 100, 1, 7);
      out.push('glass ' + mode + ' ' + B.boxFxBackend() + ' ' + (c ? h32(c.getContext('2d').getImageData(0, 0, c.width, c.height).data) : 'null')); }
    window.__res = out;
  </script>`); return; }
  const f = path.join(ROOT, u); if(!fs.existsSync(f) || fs.statSync(f).isDirectory()){ s.writeHead(404); s.end(); return; }
  s.writeHead(200, { 'content-type': 'text/javascript' }); fs.createReadStream(f).pipe(s); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const req = createRequire(import.meta.url); let pw; try { pw = req('playwright'); } catch(e){ pw = await import('/opt/npm-tools/node_modules/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage(); const logs = []; page.on('console', m => logs.push(m.text())); page.on('pageerror', e => logs.push(String(e)));
await page.goto(`http://127.0.0.1:${server.address().port}/t.html`);
await page.waitForFunction(() => window.__res, null, { timeout: 90000 }).catch(() => {});
console.log((await page.evaluate(() => window.__res) || ['no result']).join('\n'));
await browser.close(); server.close();
