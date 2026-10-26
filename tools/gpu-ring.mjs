// tools/gpu-ring.mjs — the Ringworld drawn in a real Chromium with its land and things on WebGPU (ringGpu.js) and on the canvas, one
// over the other in a PNG, with each one's time a frame (needs Playwright; WebGPU on SwiftShader's Vulkan, so the times
// say little about a real GPU, the pictures everything):
//   node tools/gpu-ring.mjs out.png [seed] [w] [h] ['{"turn":0}' or '{"fly":{"route":"seed","u":0.5,"secs":10}}'] [frames]
import http from 'http'; import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const ROOT = path.resolve(path.join(path.dirname(new URL(import.meta.url).pathname), '..'));
const [out = 'gpu-ring.png', seed = '9', W = '960', H = '540', cam = '{"turn":0}', frames = '2'] = process.argv.slice(2);
const server = http.createServer((q, s) => { const u = decodeURIComponent(q.url.split('?')[0]);
  if(u === '/t.html'){ s.writeHead(200, { 'content-type': 'text/html' }); s.end(`<!doctype html><body><script type="module">
    import * as T from '/textureGenerators.js'; import * as G from '/ringGpu.js';
    G.setRingGpu(true, true); const ok = await G.ringGpuInit();
    const caps = T.TEXTURE_CAPS.ringpaint, defs = T.paramsFor('ringpaint'), t6 = caps.tintDefaults || [], cam = ${cam}, W = ${+W}, H = ${+H}, N = ${+frames};
    const shot = gpu => { G.setRingGpu(gpu, true); const times = []; let c = null;
      for(let f = 0; f < N; f++){ const camf = cam.fly ? { ...cam, fly: { ...cam.fly, u: cam.fly.u + f*0.01 } } : { ...cam, turn: (cam.turn || 0) + f*0.5 };
        const o = { seed: ${+seed}, light: 154, lightTilt: 40, tint1: t6[0], tint2: t6[1], hues: t6.slice(2), scale: W/3072, camera: { view: 100, zoom: 100, ...camf } };
        defs.forEach((d, j) => o['p' + (j + 1)] = String(d.def)); T.clearTextureCache && T.clearTextureCache(); const t0 = performance.now(); c = T.getTextureCanvas('ringpaint', W, H, o); times.push(Math.round(performance.now() - t0)); }
      const k = document.createElement('canvas'); k.width = W; k.height = H; k.getContext('2d').drawImage(c, 0, 0); return { url: k.toDataURL('image/png'), times }; };
    const gpu = shot(true), cpu = shot(false);
    window.__res = { ok, why: G.ringGpuWhy(), ready: G.ringGpuReady(), gpu, cpu };
  </script>`); return; }
  const f = path.join(ROOT, u); if(!fs.existsSync(f) || fs.statSync(f).isDirectory()){ s.writeHead(404); s.end(); return; }
  s.writeHead(200, { 'content-type': f.endsWith('.json') ? 'application/json' : 'text/javascript' }); fs.createReadStream(f).pipe(s); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const req = createRequire(import.meta.url); let pw; try { pw = req('playwright'); } catch(e){ pw = await import('/opt/npm-tools/node_modules/playwright/index.mjs'); }
const browser = await pw.chromium.launch({ args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-vulkan=swiftshader', '--use-angle=swiftshader'] });
const page = await browser.newPage(); const logs = []; page.on('console', m => logs.push(m.text())); page.on('pageerror', e => logs.push(String(e)));
await page.goto(`http://127.0.0.1:${server.address().port}/t.html`);
await page.waitForFunction(() => window.__res, null, { timeout: 600000 }).catch(() => {});
const res = await page.evaluate(() => window.__res);
if(!res){ console.log('no result', logs.slice(-8).join('\n')); }
else { if(res.why) console.log(res.why); console.log('webgpu opened:', res.ok, 'ready:', res.ready, '| gpu ms', res.gpu.times.join(' '), '| canvas ms', res.cpu.times.join(' '));
  const p2 = await browser.newPage(); await p2.setContent(`<canvas id=c></canvas>`); const png = await p2.evaluate(async ([a, b, w, h]) => { const c = document.getElementById('c'); c.width = w; c.height = h*2; const x = c.getContext('2d');
    for(const [u, y] of [[a, 0], [b, h]]){ const im = new Image(); im.src = u; await im.decode(); x.drawImage(im, 0, y); } return c.toDataURL('image/png'); }, [res.gpu.url, res.cpu.url, +W, +H]);
  fs.writeFileSync(out, Buffer.from(png.split(',')[1], 'base64')); if(logs.length) console.log(logs.slice(-5).join('\n')); }
await browser.close(); server.close();
