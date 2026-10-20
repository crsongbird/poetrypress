/**
 * texCore.test.mjs — the surfaces' shared maths (texCore.js), by what it does:
 * canonical pixels (AGENTS.md §5.2), the light (§5.5: lightHeights, normal
 * maps, gloss maps, materials, lightSparse), weighted choices and the camera
 * tilt. The pictures themselves are guarded by the fingerprints.
 *
 * Run: node test/texCore.test.mjs
 */
import { check, done } from './harness.mjs';
const C = await import('../texCore.js');

// ---- canonical pixels ----
check('S is 1 unless set, and withScale restores it afterwards',
  C.scaleNow() === 1 && C.withScale(0.25, () => C.scaleNow()) === 0.25 && C.scaleNow() === 1);
check('cpx converts canonical pixels at the current scale', C.cpx(12) === 12 && C.withScale(0.5, () => C.cpx(12)) === 6);
check('an invalid scale falls back to 1', C.withScale(0, () => C.scaleNow()) === 1 && C.withScale(NaN, () => C.scaleNow()) === 1);
check('canonArea is the pixel area at S = 1, and the export area at any S',
  C.canonArea(300, 200) === 60000 && C.withScale(0.5, () => C.canonArea(150, 100)) === 60000);
check('canonDiv is exact at S = 1 and keeps the export grid when smaller (never finer than 1)',
  C.canonDiv(4) === 4 && C.withScale(1/3, () => Math.abs(C.canonDiv(4) - 4/3) < 1e-12) && C.withScale(0.1, () => C.canonDiv(4)) === 1);
{
  // Linen's grid: threads at least ~3 px apart; never finer than the export's grid, never coarser than the canvas
  const { weaveGridDiv } = await import('../stepsTouch.js');
  check('linen keeps its threads at least 3 px apart: the export grid when it must, the canvas when it can',
    weaveGridDiv(1536, 2048, 1, 1) === 2 && weaveGridDiv(512, 683, 1/3, 1) > 0.9 && weaveGridDiv(512, 683, 1/3, 1) <= 1 && Math.abs(weaveGridDiv(512, 683, 1/3, 0.5) - 2/3) < 1e-9);
}

// ---- the light's direction and height ----
{
  const full = C.lightVec(90), half = C.withLightTilt(0.5, () => C.lightVec(90)), over = C.withLightTilt(0, () => C.lightVec(90));
  // the dial's handle is the light: at 90° it stands east, so the light travels west (lightVec is its travel; dialVec where it stands)
  check('the light is raking by default, softer as it rises, flat overhead', Math.abs(full.lx + 1) < 1e-9 && Math.abs(half.lx + 0.5) < 1e-9 && over.lx === 0);
  check('dialVec points at the handle, lightVec away from it', Math.abs(C.dialVec(90).lx - 1) < 1e-9 && Math.abs(C.dialVec(0).ly + 1) < 1e-9);
}

// ---- lightHeights: a dome ----
{
  const ww = 64, wh = 64, H = new Float32Array(ww*wh);
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const d = Math.hypot(x - 32, y - 32); H[y*ww + x] = d < 12 ? Math.sqrt(144 - d*d) : 0; }
  const L = C.lightHeights(H, ww, wh, { light: 90 }), at = (r, x, y) => r.light[y*ww + x];
  check('the side facing the light (the handle, east at 90°) is lit, the far side shaded', at(L, 41, 32) > at(L, 23, 32) + 0.3);
  check('a dome casts a shadow away from the light', at(L, 14, 32) < at(L, 5, 5) - 0.05);
  const O = C.withLightTilt(0, () => C.lightHeights(H, ww, wh, { light: 90 }));
  check('light from straight overhead casts no shadow', at(O, 14, 32) > 0.95);
  check('a glossy surface takes a highlight', Math.max(...C.lightHeights(H, ww, wh, { light: 90, gloss: 0.9 }).spec) > 0.3);
  check('in Node there is no WebGL2, so lighting runs on the CPU (the fingerprints test that path)', C.lightBackend() === 'cpu');
}

// ---- normal maps, components, gloss maps, materials ----
{
  const ww = 48, wh = 48, flatH = new Float32Array(ww*wh), N = new Float32Array(ww*wh*3);
  // a normal map tilting every pixel east; on the dial, 90° light comes from the east, where the handle is (270° from the west)
  for(let i = 0; i < ww*wh; i++){ const t = 0.6, l = Math.hypot(t, 0, 1); N[i*3] = t/l; N[i*3+1] = 0; N[i*3+2] = 1/l; }
  const plain = C.lightHeights(flatH, ww, wh, { light: 270 }), toward = C.lightHeights(flatH, ww, wh, { light: 90, normals: N }), away = C.lightHeights(flatH, ww, wh, { light: 270, normals: N });
  check('normal maps: tilted toward the light is brighter than flat, tilted away is darker', toward.light[24*ww + 24] > plain.light[24*ww + 24] + 0.05 && away.light[24*ww + 24] < plain.light[24*ww + 24] - 0.05);
  const H = new Float32Array(ww*wh); for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const d = Math.hypot(x - 24, y - 24); H[y*ww + x] = d < 10 ? Math.sqrt(100 - d*d) : 0; }
  const L = C.lightHeights(H, ww, wh, { light: 90, ambient: 0.4, components: true });
  let worst = 0; for(let i = 0; i < ww*wh; i++) worst = Math.max(worst, Math.abs(L.light[i] - (0.4 + 0.6*L.diffuse[i])*(1 - L.occl[i])));
  check('components recombine to the same light (ambient + (1−ambient)·diffuse, occluded)', worst < 1e-5);
  { const GMm = new Float32Array(ww*wh).fill(1), GMz = new Float32Array(ww*wh);
    const shiny = C.lightHeights(H, ww, wh, { light: 90, glossMap: GMm }), matte = C.lightHeights(H, ww, wh, { light: 90, glossMap: GMz });
    const peak = A => A.reduce((m, v) => Math.max(m, v), 0), area = A => A.filter(v => v > 0.05).length;
    check('a gloss map gives each pixel its own gloss: mirror-glossy is tight and bright, matte broad and dim',
      peak(shiny.spec) > peak(matte.spec) && area(shiny.spec) < area(matte.spec)); }
  { const B = C.lightBasis(315), up = C.shadeNormal(B, 0, 0, 1, 0.5);
    check('lightBasis + shadeNormal: flat ground gets what the engine gives it', Math.abs(up.diffuse - B.flat) < 1e-9); }
  check('white Highlight and Shade are no material at all (looks stay exactly as they were)', C.materialOf('#FFFFFF', '#ffffff') === null && C.materialOf(null, undefined) === null);
  const M = C.materialOf('#FFFFFF', '#3060FF');
  const lit = L.light.indexOf(Math.max(...L.light)), shaded = L.light.indexOf(Math.min(...L.light));
  check('the Shade hue colors shadows, not lit faces', Math.abs(C.litK(L, lit, 0.4, M, 2) - L.light[lit]) < 1e-9 && C.litK(L, shaded, 0.4, M, 2) > L.light[shaded]*1.2);
  check('material hues keep their brightness (a deep blue shade does not darken)', Math.abs(0.2126*M.sh[0] + 0.7152*M.sh[1] + 0.0722*M.sh[2] - 1) < 0.02);
}

// ---- lightSparse is exact ----
{
  const ww = 300, wh = 220, H = new Float32Array(ww*wh);
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const d = Math.hypot(x - 90, y - 70)/22; if(d < 1) H[y*ww + x] = 12*Math.sqrt(1 - d*d); }
  for(let x = 0; x < ww; x++) for(let y = 150; y < 156; y++) H[y*ww + x] = -1.2;
  let worst = 0, fewer = true;
  for(const light of [0, 90, 135, 225, 315]){
    const o = { light, gloss: 0.7, shadow: 0.7, ao: 0.45, ambient: 0.4 }, A = C.lightHeights(H, ww, wh, o), B = C.lightSparse(H, ww, wh, o, 32);
    for(let i = 0; i < ww*wh; i++) worst = Math.max(worst, Math.abs(A.light[i] - B.light[i]), Math.abs(A.spec[i] - B.spec[i]));
    if(B.lit >= B.of) fewer = false;
  }
  check('lightSparse lights only the tiles near a detail, and matches lightHeights exactly', worst === 0 && fewer);
  // …with the page's rim light too, whose shadows fall their own way (its margins are the union of both lights')
  let worst2 = 0, parts = true;
  for(const [light, rimDeg] of [[315, 135], [0, 90], [225, 300]]){
    const rig = C.lightRigOf({ rimDeg, rimTilt: 110, rimHue: '#6080FFB0', ambientHue: '#FF9050' });
    const o = { light, gloss: 0.7, shadow: 0.7, ao: 0.45, ambient: 0.4 };
    const A = C.withLightTilt(1.2, () => C.withLightRig(rig, () => C.lightHeights(H, ww, wh, o))), B = C.withLightTilt(1.2, () => C.withLightRig(rig, () => C.lightSparse(H, ww, wh, o, 32)));
    for(let i = 0; i < ww*wh; i++) worst2 = Math.max(worst2, Math.abs(A.light[i] - B.light[i]), Math.abs(A.spec[i] - B.spec[i]), Math.abs(A.ra[i] - B.ra[i]), Math.abs(A.aa[i] - B.aa[i]));
    if(!B.hue || !B.ra || !B.aa) parts = false;
  }
  check('…and with the page\'s rim light and coloured lights, exactly too (the rim\'s own shadows, its shares)', worst2 === 0 && parts);
}

// ---- THE PAGE'S LIGHTS (ROADMAP C1, C2): the rim light, the ambient, their colours ----
{
  const ww = 120, wh = 90, H = new Float32Array(ww*wh);
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++) H[y*ww + x] = 8*Math.sin(x*0.15)*Math.cos(y*0.12);
  const o = { light: 315, gloss: 0.4, shadow: 0.6, ao: 0.35, ambient: 0.4 };
  const plain = C.lightHeights(H, ww, wh, o), none = C.withLightRig(null, () => C.lightHeights(H, ww, wh, o));
  check('the page\'s lights changing nothing are no rig at all (every surface draws as it did)',
    C.lightRigOf({}) === null && C.lightRigOf({ ambient: 100, ambientHue: '#FFFFFF', mainHue: '#FFFFFF80', rimHue: '#CFE3FF00' }) === null
    && plain.light.every((v, i) => v === none.light[i]) && plain.spec.every((v, i) => v === none.spec[i]) && !('hue' in plain));
  const r = C.lightRigOf({ rimDeg: 135, rimTilt: 100, rimHue: '#FFFFFF80', ambient: 150 });
  check('a rig reads the picker\'s alpha as the rim light\'s strength, white as no colour, and the ambient as a share',
    r && Math.abs(r.rim.k - 128/255) < 1e-9 && r.rim.hue === null && r.rim.deg === 135 && r.rim.tilt === 1 && r.amb === 1.5 && r.ambHue === null);
  const rim = C.withLightRig(C.lightRigOf({ rimDeg: 135, rimTilt: 100, rimHue: '#FFFFFFFF' }), () => C.lightHeights(H, ww, wh, o));
  // a face turned toward the rim light brightens (the faces the dial's own light lights from its place, 135°); one turned
  // from it keeps its light
  const lit135 = C.lightHeights(H, ww, wh, { ...o, light: 135 });
  let toward = 0, away = 0, nT = 0, nA = 0;
  for(let i = 0; i < ww*wh; i++){ const f = lit135.light[i]/lit135.flat; if(f > 1.25){ toward += rim.light[i] - plain.light[i]; nT++; } else if(f < 0.75){ away += rim.light[i] - plain.light[i]; nA++; } }
  check('the rim light lights the faces turned toward it, as the dial\'s light from there would, and hardly those turned away', nT > 20 && nA > 20 && toward/nT > 0.15 && away/nA < toward/nT*0.4);
  const low = C.withLightRig(C.lightRigOf({ ambient: 30 }), () => C.lightHeights(H, ww, wh, o)), high = C.withLightRig(C.lightRigOf({ ambient: 180 }), () => C.lightHeights(H, ww, wh, o));
  let minP = Infinity, minL = Infinity, minH = Infinity; for(let i = 0; i < ww*wh; i++){ minP = Math.min(minP, plain.light[i]/plain.flat); minL = Math.min(minL, low.light[i]/low.flat); minH = Math.min(minH, high.light[i]/high.flat); }
  check('the Ambient slider deepens the shadows below halfway and softens them above (against open ground)', minL < minP - 0.05 && minH > minP + 0.05);
  const col = C.withLightRig(C.lightRigOf({ ambientHue: '#3060FF', rimDeg: 135, rimTilt: 100, rimHue: '#FF6020FF', mainHue: '#FFD080' }), () => C.lightHeights(H, ww, wh, o));
  let shadeBlue = 0, n = 0, warmShine = true;
  for(let i = 0; i < ww*wh; i++){ if(col.light[i] < col.flat*0.7){ shadeBlue += C.litK(col, i, 0.4, null, 2) - C.litK(col, i, 0.4, null, 0); n++; }
    if(col.rs[i] > col.spec[i]*0.5 && col.spec[i] > 0.02 && !(C.litS(null, 0, col, i) > C.litS(null, 2, col, i))) warmShine = false; }
  check('the Ambient Hue colours the shade most, and a rim light\'s own shine takes its colour', n > 20 && shadeBlue/n > 0.02 && warmShine);
  check('with no coloured lights, litK and litS are what they were', C.litK(plain, 5, 0.4, null, 1) === plain.light[5] && C.litS(null, 0, plain, 5) === 1 && C.litS({ hi: [0.5, 1, 2] }, 2) === 2);
}

// ---- weighted choices; the camera tilt ----
{
  const picks = {}; for(let i = 0; i < 6000; i++){ const v = C.pickWeighted([['a', 3], ['b', 2], ['c', 1]], i/6000); picks[v] = (picks[v] || 0) + 1; }
  check('pickWeighted: common, uncommon, rare, in proportion, from one roll',
    picks.a === 3000 && picks.b === 2000 && picks.c === 1000 && C.pickWeighted([['x', 1]], 0.999) === 'x');
  const f = C.obliqueFrame(200, 150, 0, 10);
  check('a camera tilt of 0 is the flat, top-down texture exactly', f.flat === true && f.GW === 200 && f.GH === 150);
  const t = C.obliqueFrame(200, 150, 0.5, 10);
  check('a tilted camera builds a larger patch of ground than the page', !t.flat && t.GW * t.GH > 200 * 150);
}

done();
