/**
 * blendsAndTints.test.mjs — every blend a texture offers must make sense, and
 * tints must colour marks without staining the page; a texture's hues follow
 * the page's accents until one is chosen by hand or locked.
 *
 * Run: node test/blendsAndTints.test.mjs
 */
import * as M from './canvasMock.mjs';
M.installCanvasMock();
const { blendFamily, pixelPass } = await import('../texCore.js');
const T = await import('../textureGenerators.js');

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };
// the tint pass (texCore pixelPass) on real pixels: a row of them on a stand-in canvas
const pass = (px, light, dark, family, ground) => { const data = new Uint8ClampedArray(px.flat());
  pixelPass({ width: px.length, height: 1, getContext: () => ({ getImageData: () => ({ data }), putImageData: () => {} }) }, light, dark, family, ground); return [...data]; };
const grey = v => [v, v, v, 255];

// ---- each blend has the right neutral ----
check('overlay-type blends keep mid-grey', ['overlay','soft-light','hard-light'].every(b => blendFamily(b) === 'mid'));
check('multiply-type blends use white', ['multiply','darken','color-burn'].every(b => blendFamily(b) === 'white'));
check('screen-type blends use black', ['screen','lighten','color-dodge'].every(b => blendFamily(b) === 'black'));

// the remap: 128 becomes the blend's neutral; marks survive
const mul = pass([grey(128), grey(20)], null, null, 'white'), scr = pass([grey(128), grey(250)], null, null, 'black');
check('mid-grey vanishes under multiply', mul[0] === 255);
check('a dark mark survives multiply', mul[4] === 40);
check('mid-grey vanishes under screen', scr[0] === 0);
check('a light mark survives screen', scr[4] === 244);

// ---- every grey-ground texture offers all nine, first is its default ----
const greys = Object.entries(T.TEXTURE_CAPS).filter(([, c]) => c.ground === 'grey');
check('most textures are marked as grey-ground', greys.length >= 20);
const NINE = ['overlay','soft-light','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'];
// all nine standard blends, at least — a coloured texture may add Normal
check('every grey-ground texture offers all nine blends', greys.every(([, c]) => NINE.every(b => c.blends.includes(b))));
check('the Rorschach is ink on paper: multiply by default', T.TEXTURE_CAPS.inkbleed.blends[0] === 'multiply');
// Aurora Veil: every blend is remapped EXCEPT screen, its default, so the
// favourite's look is untouched (verified pixel-identical when this was added)
check('Aurora Veil keeps its default look: screen is exempt from the remap',
  T.TEXTURE_CAPS.aurora.ground === 'grey' && T.TEXTURE_CAPS.aurora.keepGround.includes('screen') &&
  T.TEXTURE_CAPS.aurora.blends[0] === 'screen');
// (a remap is one more pass over the texture's pixels: count them)
const remapped = (type, blend) => { T.clearTextureCache(); return T.getTextureCanvas(type, 120, 120, { seed: 3, p1: 100, p2: 100, blend }).getContext('2d')._stats.imageDataWrites; };
check('the renderer honours the exemption (Aurora under screen is drawn as it is; under multiply, and any other grey texture under screen, it is remapped)',
  remapped('aurora', 'screen') === remapped('aurora') && remapped('aurora', 'multiply') === remapped('aurora') + 1 && remapped('hatch', 'screen') === remapped('hatch') + 1);
check('Aurora Veil has two hues, the hem defaulting to the curtain\'s colour',
  T.TEXTURE_CAPS.aurora.tints === 2 && T.TEXTURE_CAPS.aurora.tintDefaults[1] === T.TEXTURE_CAPS.aurora.tintDefaults[0]);

// ---- generic tint: marks only, white is no tint ----
// (white over black is the identity, pixel for pixel: colorRoles.test.mjs)
const lit = pass([grey(200), grey(50), grey(128)], '#FF0000', '#0000FF');
check('light marks take the light hue and dark marks the dark hue — two tints, not one',
  lit[0] > lit[2] + 100 && lit[0] === 200 && lit[6] > lit[4] + 100 && lit[4] === 50);
check('the lotus is painted in its own colours: petals and heart',
  T.TEXTURE_CAPS.flowers.tintLabels.join('|') === 'Petal Hue|Heart Hue' && !T.TEXTURE_CAPS.flowers.genericTint &&
  T.TEXTURE_CAPS.flowers.blends[0] === 'source-over');
check('only exactly-mid pixels — the ground — are left alone', lit.slice(8, 11).join() === '128,128,128');
const tinted = Object.entries(T.TEXTURE_CAPS).filter(([, c]) => c.genericTint);
check('generic tints default to white and black',
  tinted.every(([, c]) => c.tints === 2 && c.tintDefaults[0] === '#FFFFFF' && c.tintDefaults[1] === '#000000'));
check('monochrome textures can be tinted', tinted.length >= 15);

// ---- the moon ----
check('the Fractal Moon exists: Moon Size, Fractal Depth, Clouds, Night Sky', T.paramsFor('moon').map(d => d.label).join('|') === 'Moon Size|Fractal Depth|Clouds|Night Sky');
let threw = null;
try { for(const s of [1, 2, 3]) T.getTextureCanvas('moon', 300, 300, { seed: s, p1: 100, p2: 100, light: 315, tint1: '#d9a6b3', blend: 'hard-light' }); }
catch(e){ threw = e; }
check('it renders across seeds', threw === null);

// ---- the Scrying Pool ----
check('it is neutral by default: the page supplies the colour',
  T.TEXTURE_CAPS.water.tintDefaults[0] === '#FFFFFF' && T.TEXTURE_CAPS.water.blends[0] === 'soft-light');
let wthrew = null;
try { for(const d of [0, 35, 50, 100]) T.getTextureCanvas('water', 240, 240, { seed: 5, p1: 100, p2: d, light: 45, blend: 'soft-light' }); }
catch(e){ wthrew = e; }
check('it renders across the whole depth range', wthrew === null);

// ---- accents are followed until a tint is chosen or locked (on the booted app) ----
{
  const { installDomMock } = await import('./domMock.mjs');
  const reg = installDomMock(M.makeMockContext, M.makeMockCanvas);
  await import('../appEvents.js');
  const save = () => { reg['advancedRefreshBtn'].dispatchEvent({ type: 'click' }); return JSON.parse(reg['advancedJson'].value); };
  const load = o => { reg['advancedJson'].value = JSON.stringify(o); reg['advancedLoadBtn'].dispatchEvent({ type: 'click' }); };
  const settle = () => new Promise(r => setTimeout(r, 60));
  const choose = t => { reg['textureType'].value = t; reg['textureType'].dispatchEvent({ type: 'input' }); reg['textureType'].dispatchEvent({ type: 'change' }); };
  const accent = hex => { reg['accent1ColorHex'].value = hex; reg['accent1ColorHex'].dispatchEvent({ type: 'input' }); };
  const tint = () => reg['textureTint1Hex'].value.toUpperCase();
  // a surface whose first hue starts at the first accent
  const keyed = Object.keys(T.TEXTURE_CAPS).find(t => (T.TEXTURE_CAPS[t].tintDefaults || [])[0] === 'accent1' && T.TEXTURE_CAPS[t].tints >= 1);
  load({ ...save(), texture: true, locks: [] }); choose(keyed); await settle();
  accent('#123456');
  check('changing an accent re-derives tints that come from it', tint() === '#123456');
  accent('#654321');
  check('the app writing a tint is not mistaken for a person (it follows again)', tint() === '#654321');
  reg['textureTint1Hex'].value = '#ABCDEF'; reg['textureTint1Hex'].dispatchEvent({ type: 'input' });
  accent('#111111');
  check('a hand-picked tint stops following', tint() === '#ABCDEF');
  load({ ...save(), locks: ['textureTint1Hex'] }); choose('hatch'); choose(keyed); await settle();   // (a surface chosen afresh follows again)
  const held = tint(); accent('#222222');
  check('a locked tint is left alone', held !== '#222222' && tint() === held);
}

// ---- THE PAGE'S LIGHTS (ROADMAP C1, C2): the rim light, the Ambient slider and the light hues ----
{
  const rigged = Object.entries(T.TEXTURE_CAPS).filter(([, c]) => c.rig).map(([t]) => t);
  check('the page\'s lights reach only surfaces the dial lights (never a dial that is only a direction, or the day)',
    rigged.length >= 20 && rigged.every(t => T.TEXTURE_CAPS[t].light && !T.TEXTURE_CAPS[t].dirOnly && !/Daylight|Direction|Position|View|Field Lines/.test(T.TEXTURE_CAPS[t].dial || '')));
  const L = { ambient: 60, ambientHue: '#3050FFAA', rimDeg: 135, rimTilt: 100, rimHue: '#FF8040C0' };
  const key = (t, o) => T.textureKeyFor(t, 96, 96, { seed: 7, light: 315, lightTilt: 100, ...o });
  check('a surface they do not reach keys (and so draws) exactly as it did, whatever they are',
    ['aurora', 'clouds', 'crystal', 'ringworld', 'linen'].every(t => key(t, L) === key(t, {})));
  check('…and at their "none" (the surface\'s own ambient, white hues, the rim light at alpha 0) neither does a surface they reach',
    rigged.every(t => key(t, { ambient: 100, ambientHue: '#FFFFFF', rimDeg: 200, rimTilt: 60, rimHue: '#CFE3FF00', tint6: '#FFFFFF' }) === key(t, {})));
  // (that each surface listed changes under them is measured on real pixels, which the stand-in canvas does not draw: the
  //  list's comment in textureGenerators says how; texCore.test proves the engine's part)
}

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
