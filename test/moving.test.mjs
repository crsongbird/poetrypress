/**
 * moving.test.mjs — the Moving Image's pure parts (moving.js): a look eased toward another (what eases, what stays
 * whole, the dials the short way round), and the three containers it writes (zip, MP4, WebM), read back; and, on the
 * booted page, that the frames a film has made ahead are the ones its drawing asks for.
 */
import { check, done } from './harness.mjs';
import { blendLooks, crc32, filmHours, moveAt, mp4Parts, sunPath, webmBytes, wholeChanges, zipParts } from '../moving.js';

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
check('there and back loops (0 → 1 → 0), one way ends at the other look', moveAt(0, 180, true) === 0 && Math.abs(moveAt(90, 180, true) - 1) < 1e-9 && moveAt(179, 180, false) === 1 && moveAt(1, 180, true) > 0);

// ---- the sun through a day ----
{ const f = sunPath(315, 40), day = Array.from({ length: 24*12 }, (_, i) => f(i/12)), up = day.filter(([, t]) => t < 100).length/day.length;
  check('the sun begins where the dial stands', Math.abs(f(0)[0] - 315) < 1e-6 && Math.abs(f(0)[1] - 40) < 0.01);
  check('a day comes round in twenty-four hours', Math.abs(f(24)[0] - 315) < 1e-6 && Math.abs(f(24)[1] - 40) < 0.01);
  check('the day is longer than the night (about fourteen hours of the twenty-four)', up > 0.55 && up < 0.65);
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

done();
