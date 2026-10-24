/**
 * moving.test.mjs — the Moving Image's pure parts (moving.js): a look eased toward another (what eases, what stays
 * whole, the dials the short way round), and the three containers it writes (zip, MP4, WebM), read back; and, on the
 * booted page, that the frames a film has made ahead are the ones its drawing asks for; and that a film never flashes.
 */
import { readFileSync } from 'fs';
import { check, done } from './harness.mjs';
import { blendLooks, cameraAlso, crc32, filmHours, moveAlong, mp4Parts, SUN_DAY, sunPath, webmBytes, wholeChanges, zipParts } from '../moving.js';

const cat = parts => { const n = parts.reduce((s, p) => s + p.length, 0), o = new Uint8Array(n); let at = 0; for(const p of parts){ o.set(p, at); at += p.length; } return o; };
const dv = b => new DataView(b.buffer, b.byteOffset, b.byteLength), str = (b, at, n) => String.fromCharCode(...b.subarray(at, at + n));

// ---- a look toward another ----
const a = { bg1: '#000000', maxSize: '40', textureLight: '350', textureSeedValue: '5', textureType: 'grain', baseLayer: { texP1: 10 }, texture: true, only: 1 };
const b = { bg1: '#ffffff', maxSize: '60', textureLight: '10', textureSeedValue: '9', textureType: 'moss', baseLayer: { texP1: 30 }, texture: false };
const m = blendLooks(a, b, 0.5, 0);
check('numbers ease between, and stay strings where they were', m.maxSize === '50');
check('colours mix', m.bg1 === '#808080');
check('a dial turns the short way round (350° to 10° through 0°)', m.textureLight === '0' && blendLooks(a, b, 0.25, 0).textureLight === '355');
check('a seed, a kind and a switch are one look’s or the other’s whole', m.textureSeedValue === '5' && m.textureType === 'grain' && m.texture === true && blendLooks(a, b, 0.5, 1).textureType === 'moss');
check('the lower layer eases too', m.baseLayer.texP1 === 20);
check('a key only one look has keeps it', m.only === 1);
check('a key named as not between is whole', blendLooks(a, b, 0.5, 0, k => k === 'maxSize').maxSize === '40');
check('the whole changes are found (where the film fades)', JSON.stringify(wholeChanges(a, b).sort()) === JSON.stringify(['texture', 'textureSeedValue', 'textureType']));
check('there and back loops (0 → 1 → 0), one way ends at the other look', moveAlong(0, 180, { back: true, ends: true, eased: true }) === 0 && Math.abs(moveAlong(90, 180, { back: true, ends: true, eased: true }) - 1) < 1e-9 && moveAlong(179, 180, { back: false, ends: true, eased: true }) === 1 && moveAlong(1, 180, { back: true, ends: true, eased: true }) > 0);

// ---- the sun through a day ----
{ const f = sunPath(315, 40), day = Array.from({ length: 24*12 }, (_, i) => f(i/12)), up = day.filter(([, t]) => t < 100).length/day.length;
  check('the sun begins where the dial stands', Math.abs(f(0)[0] - 315) < 1e-6 && Math.abs(f(0)[1] - 40) < 0.01);
  check('a day comes round in twenty-four hours', Math.abs(f(24)[0] - 315) < 1e-6 && Math.abs(f(24)[1] - 40) < 0.01);
  check('the day is longer than the night (about fourteen hours of the twenty-four)', up > 0.55 && up < 0.65);
  // (a film that begins at a time of day counts its hours from sunrise: the sun at the horizon then and SUN_DAY later)
  { const r = sunPath(90, 100); check('SUN_DAY is the day from sunrise to sunset', SUN_DAY > 13.5 && SUN_DAY < 15 && Math.abs(r(SUN_DAY)[1] - 100) < 0.05 && r(SUN_DAY/2)[1] < 40 && r(SUN_DAY + 1)[1] > 100); }
  check('its path is an arc, never a jump: the dial moves a little from one five minutes to the next', day.every(([a, t], i) => !i || (Math.abs(((a - day[i - 1][0] + 540) % 360) - 180) < 12 && Math.abs(t - day[i - 1][1]) < 4)));
  { const c = filmHours(f, 24), hs = Array.from({ length: 101 }, (_, i) => c(i/100)), near = h => Math.abs(f(h)[1] - 100) < 8;
    const share = hs.slice(1).filter((h, i) => near((h + hs[i])/2)).length/100, real = day.filter(([, t]) => Math.abs(t - 100) < 8).length/day.length;
    check('the film\'s clock runs from the start to the end of its hours, never backward', hs[0] === 0 && Math.abs(hs[100] - 24) < 1e-6 && hs.every((h, i) => !i || h >= hs[i - 1]));
    check('and gives dawn and dusk more of the film than the day gives them', share > real*1.8); }
  check('dusk lasts: the twilight (past the dial\'s rim, short of full night) holds for more than an hour', day.filter(([, t]) => t > 100 && t < 129.9).length/12 > 1); }

// ---- the zip ----
check('CRC-32 is the standard one', crc32(new TextEncoder().encode('123456789')) === 0xCBF43926);
{ const d1 = new TextEncoder().encode('one'), d2 = new TextEncoder().encode('frame two');
  const z = cat(zipParts([{ name: 'a.png', size: 3, crc: crc32(d1), data: d1 }, { name: 'b.png', size: 9, crc: crc32(d2), data: d2 }]));
  const end = z.length - 22, v = dv(z), dir = v.getUint32(end + 16, true);
  check('the zip: local headers, a central directory of two, the end record pointing at it',
    v.getUint32(0, true) === 0x04034b50 && v.getUint32(end, true) === 0x06054b50 && v.getUint16(end + 10, true) === 2 && v.getUint32(dir, true) === 0x02014b50 && str(z, 30, 5) === 'a.png' && str(z, 35, 3) === 'one'); }

// ---- the MP4 ----
{ const frames = [{ data: new Uint8Array([0, 0, 0, 2, 0x65, 1]), key: true }, { data: new Uint8Array([0, 0, 0, 1, 0x41]), key: false }, { data: new Uint8Array([0, 0, 0, 1, 0x41]), key: false }];
  const f = cat(mp4Parts({ width: 64, height: 36, fps: 30, avcC: new Uint8Array([1, 0x64, 0, 0x1f, 0xff, 0xe1, 0, 0, 1, 0, 0]), frames }));
  const boxes = []; for(let at = 0; at < f.length;){ const n = dv(f).getUint32(at); boxes.push([str(f, at + 4, 4), at, n]); if(n < 8) break; at += n; }
  check('the MP4: ftyp, the index (moov) before the frames (mdat), and nothing after', boxes.map(x => x[0]).join() === 'ftyp,moov,mdat' && boxes[2][1] + boxes[2][2] === f.length);
  const stco = f.indexOf ? [...f].findIndex((_, i) => str(f, i, 4) === 'stco') : -1, at = dv(f).getUint32(stco + 12);
  check('its one chunk starts where the frames do', at === boxes[2][1] + 8 && f[at + 4] === 0x65);
  const stss = [...f].findIndex((_, i) => str(f, i, 4) === 'stss');
  check('the key frame is marked', dv(f).getUint32(stss + 8) === 1 && dv(f).getUint32(stss + 12) === 1); }

// ---- the WebM ----
{ const frames = Array.from({ length: 70 }, (_, i) => ({ data: new Uint8Array([i]), key: i % 60 === 0 }));
  const w = webmBytes({ width: 64, height: 36, fps: 30, codec: 'V_VP9', frames });
  const count = (id) => { let n = 0; for(let i = 0; i + id.length <= w.length; i++) if(id.every((x, k) => w[i + k] === x)) n++; return n; };
  check('the WebM: the EBML header, its doctype, a cluster from each key frame', dv(w).getUint32(0) === 0x1A45DFA3 && str(w, 0, w.length).includes('webm') && str(w, 0, w.length).includes('V_VP9') && count([0x1F, 0x43, 0xB6, 0x75]) === 2); }

// ---- the frames ahead: what a film asks for ahead of a frame is what the frame's drawing then asks for ----
{ const { installCanvasMock, makeMockContext, makeMockCanvas } = await import('./canvasMock.mjs'), { installDomMock } = await import('./domMock.mjs');
  installCanvasMock(); const reg = installDomMock(makeMockContext, makeMockCanvas); await import('../appEvents.js');
  const { render, surfaceRequests, setSceneTime } = await import('../canvasRenderer.js'), { texturesSettled } = await import('../textureService.js'), { textureKeyFor, peekTexture } = await import('../textureGenerators.js');
  reg['advancedRefreshBtn'].dispatchEvent({ type: 'click' }); const look = JSON.parse(reg['advancedJson'].value);
  reg['advancedJson'].value = JSON.stringify({ ...look, texture: true, textureType: 'grain', textureLight: '120' }); reg['advancedLoadBtn'].dispatchEvent({ type: 'click' });
  await new Promise(r => setTimeout(r, 60));
  const cv = reg['poemCanvas'], asked = (setSceneTime(42, 1/30), surfaceRequests(cv.width, cv.height));
  render(); await texturesSettled(); setSceneTime(0);
  const keys = asked.map(r => textureKeyFor(r.type, r.w, r.h, r.opts));
  check('a film\'s look ahead asks for the textures its frame then draws (the same keys, found waiting in the cache)', keys.length > 0 && keys.every(k => peekTexture(k))); }

// ---- a film never flashes (Ruby: photosensitivity), and its lightning lights the scene ----
// a storm on the Ringworld, frame after frame of a time-lapse at 30 frames a second while lightning strikes (its strikes
// in the film's own seconds, docs/prior-art/ringworld-motion-and-variety.md §5.4): the scene's light changes with it,
// but no tenth of the frame brightens or darkens by a tenth of relative luminance (WCAG's flash), nor by much from one
// frame to the next; and none strikes in the film's first second and a half (Ruby: "never the first frame")
{ let NC = null; try { NC = await import('@napi-rs/canvas'); } catch(e){ console.log('(no @napi-rs/canvas here: the flash check is skipped)'); }
  if(NC){ const doc = globalThis.document; globalThis.document = { createElement: () => NC.createCanvas(1, 1) };
    const T = await import('../textureGenerators.js'), caps = T.TEXTURE_CAPS.ringpaint, defs = T.paramsFor('ringpaint'), W = 160, H = 90, t6 = caps.tintDefaults || [];
    const lin = c => { c /= 255; return c <= 0.04045 ? c/12.92 : Math.pow((c + 0.055)/1.055, 2.4); };
    const frame = f => { const o = { seed: 24757, light: 150, lightTilt: 40, tint1: t6[0], tint2: t6[1], hues: t6.slice(2), scale: W/3072, camera: { turn: 150, view: 100, zoom: 100, time: f*48, dt: 48, frame: f, step: 48, fps: 30 } };
      defs.forEach((d, j) => o['p' + (j + 1)] = String(d.def)); T.clearTextureCache(); const d = T.getTextureCanvas('ringpaint', W, H, o).getContext('2d').getImageData(0, 0, W, H).data, tenths = new Float64Array(10);
      for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){ const i = (y*W + x)*4; tenths[Math.min(4, Math.floor(y/H*5))*2 + (x < W/2 ? 0 : 1)] += 0.2126*lin(d[i]) + 0.7152*lin(d[i + 1]) + 0.0722*lin(d[i + 2]); }
      return Array.from(tenths, v => v/(W*H/10)); };
    // (this storm's strikes: one at 0.29 s, which is let go, and one at 8.51 s, lit over the second after it)
    const { rgStrike } = await import('../stepsRing.js'), starts = [];
    for(let sd = 1; sd <= 300; sd++){ let last = null; for(let ft = 0; ft < 30; ft += 1/30){ const st = rgStrike(sd, ft); if(st && st.t0 !== last){ starts.push([sd, st.t0, last]); last = st.t0; } } }
    check('no strike begins in a film\'s first second and a half, and two never begin within 2.5 s of each other, at any seed', starts.length > 100 && starts.every(([, t0, prev]) => t0 >= 1.5 && (prev === null || t0 - prev >= 2.5)));
    check('this storm\'s strike at 0.29 s is let go, its next at 8.51 s', !rgStrike(24757, 0.4) && !!rgStrike(24757, 8.7));
    const F = []; for(let f = 252; f <= 292; f += 2) F.push(frame(f));
    let step = 0, swing = 0, moved = 0;
    for(let k = 0; k < F.length; k++) for(let r = 0; r < 10; r++){ if(k) step = Math.max(step, Math.abs(F[k][r] - F[k - 1][r]));
      const win = F.slice(Math.max(0, k - 7), k + 1).map(t => t[r]); swing = Math.max(swing, Math.max(...win) - Math.min(...win)); moved = Math.max(moved, Math.abs(F[k][r] - F[0][r])); }
    check(`while lightning strikes the scene's light changes (${moved.toFixed(3)} of relative luminance at most in a tenth of the frame), but never as a flash: no tenth swings by a tenth within half a second (${swing.toFixed(3)}), nor by more than 0.03 between frames two apart (${step.toFixed(3)})`, moved > 0.005 && swing < 0.1 && step < 0.03);
    globalThis.document = doc; } }

// ---- the film's moves (the sheet's Turn, Easing and Playback) ----
{ const n = 120, at = o => Array.from({ length: n }, (_, i) => moveAlong(i, n, o));
  const full = at({}), part = at({ ends: true }), back = at({ back: true }), eased = at({ ends: true, eased: true });
  check('a full round goes evenly and stops a frame short, so the film loops with no frame twice', full[0] === 0 && Math.abs(full[n - 1] - (n - 1)/n) < 1e-9 && full.every((v, i) => !i || Math.abs(v - full[i - 1] - 1/n) < 1e-9));
  check('a part turn ends where it goes, on its last frame', part[0] === 0 && part[n - 1] === 1);
  check('there and back goes there by the middle and comes back, so it loops', back[0] === 0 && back[n/2] === 1 && back[n - 1] < 0.02 && back.every((v, i) => !i || Math.abs(v - back[i - 1]) < 2.01/n));
  check('eased, it leaves and arrives slowly (its first and last steps the smallest)', eased[1] - eased[0] < (eased[n/2 + 1] - eased[n/2])/10 && eased[n - 1] - eased[n - 2] < (eased[n/2 + 1] - eased[n/2])/10);
  const ein = at({ ends: true, eased: 'in' }), eout = at({ ends: true, eased: 'out' }), rising = a => a.every((v, i) => !i || v >= a[i - 1]);
  check('eased in, it sets off slowly and arrives at speed; eased out, the other way; both end where they go', ein[1] - ein[0] < (ein[n - 1] - ein[n - 2])/10 && eout[n - 1] - eout[n - 2] < (eout[1] - eout[0])/10 && Math.abs(ein[n - 1] - 1) < 1e-12 && Math.abs(eout[n - 1] - 1) < 1e-12 && rising(ein) && rising(eout));
  check('"In and out" is the old eased (true reads the same)', at({ ends: true, eased: 'ease' }).every((v, i) => v === eased[i]));
}
// ---- the camera's second move (the sheet's Also) ----
{ const a = (k, u, v = 40, z = 100) => cameraAlso(k, u, v, z);
  check('nothing else: the view and zoom stay', a('hold', 0.7).view === 40 && a('hold', 0.7).zoom === 100);
  check('pushing in comes 1.5 times as close by the end; pulling back goes as far the other way', Math.abs(a('in', 1).zoom - 150) < 1e-9 && Math.abs(a('out', 1).zoom - 100/1.5) < 1e-9 && a('in', 0).zoom === 100);
  check('a tilt leans toward the other side of the view and comes back, so a full round still loops', a('tilt', 0.5).view === 70 && Math.abs(a('tilt', 1).view - 40) < 1e-9 && a('tilt', 0.5, 90).view === 60);
  check('a spiral pulls back and leans as it goes (a helix)', a('spiral', 1).zoom < 70 && a('spiral', 1).view === 65 && a('spiral', 0).zoom === 100);
  check('the view and zoom keep to their ranges', a('in', 1, 40, 380).zoom === 400 && a('out', 1, 40, 30).zoom === 25 && a('tilt', 0.5, 95).view >= 0 && a('spiral', 1, 90).view <= 100 && a('in', 1, 40, 300).zoom === 400);
}
// ---- the sheet's markup: each choice a radio group with one chosen by default, each group under a legend ----
{ const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8'), sheet = html.slice(html.indexOf('id="movingSheet"'), html.indexOf('id="movingMake"'));
  const names = ['movingMove', 'movingTurn', 'movingAlso', 'movingSpan', 'movingBegin', 'movingEase', 'movingPlay', 'movingFps', 'movingSize', 'movingFormat'];
  const checkedOf = nm => [...sheet.matchAll(new RegExp(`name="${nm}" value="[^"]+"( checked)?`, 'g'))];
  check('every choice on the film sheet is a radio group with exactly one chosen by default', names.every(nm => { const r = checkedOf(nm); return r.length >= 2 && r.filter(m => m[1]).length === 1; }));
  check('the frame rates read "24 fps" and so on, in order', /24 fps[\s\S]*30 fps[\s\S]*48 fps[\s\S]*60 fps/.test(sheet) && !/a second<\/option>/.test(sheet));
  check('the sheet is four groups, each under its legend', (sheet.match(/<fieldset class="film-group"><legend /g) || []).length === 4);
  check('the sheet reads every group it offers', names.every(nm => new RegExp(`'${nm}'`).test(readFileSync(new URL('../uiMoving.js', import.meta.url), 'utf8')))); }
// ---- the scene's own clocks in a film run evenly and only forward (Ruby: "clouds should fade instead of jumping") ----
{ const { rgClock } = await import('../stepsRing.js'), f = sunPath(154, 100), c = filmHours(f, 24), n = 360;
  const V = i => ({ time: c(i/n)*3600, dt: Math.max(1, (c((i + 1)/n) - c(i/n))*3600), frame: i, step: 86400/n }), cl = Array.from({ length: n }, (_, i) => rgClock(V(i), 0.7));
  const old = Array.from({ length: n }, (_, i) => { const v = V(i); return rgClock({ time: v.time, dt: v.dt }, 0.7); });
  check('a day in a film: the clouds\' clock steps evenly forward from frame to frame, though the hours are spread unevenly (dawn and dusk slower)', cl.every((t, i) => !i || Math.abs(t - cl[i - 1] - 0.7) < 1e-9));
  check('(as it did not, made from the hours and the time between frames: it ran back now and then)', old.some((t, i) => i && t < old[i - 1]));
  check('in real time the clocks are the scene\'s own time', rgClock({ time: 2, dt: 1/30, frame: 60, step: 1/30 }, 0.7) === 2 && rgClock({ time: 0, dt: 0, frame: null, step: 0 }, 0.7) === 0); }
done();
