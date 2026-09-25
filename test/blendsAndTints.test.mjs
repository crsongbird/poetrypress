/**
 * blendsAndTints.test.mjs — every blend a texture offers must make sense, and
 * tints must colour marks without staining the page.
 *
 * Run: node test/blendsAndTints.test.mjs
 */
import { readFileSync } from 'fs';
import * as M from './canvasMock.mjs';
M.installCanvasMock();
const { blendFamily } = await import('../texCore.js');
const T = await import('../textureGenerators.js');

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };
const core = readFileSync(new URL('../texCore.js', import.meta.url), 'utf8');
const tg = readFileSync(new URL('../textureGenerators.js', import.meta.url), 'utf8');

// ---- each blend has the right neutral ----
check('overlay-type blends keep mid-grey', ['overlay','soft-light','hard-light'].every(b => blendFamily(b) === 'mid'));
check('multiply-type blends use white', ['multiply','darken','color-burn'].every(b => blendFamily(b) === 'white'));
check('screen-type blends use black', ['screen','lighten','color-dodge'].every(b => blendFamily(b) === 'black'));

// the remap arithmetic: 128 becomes the blend's neutral; marks survive
const remap = (v, fam) => fam === 'white' ? (v < 128 ? v * 2 : 255) : (v > 128 ? (v - 128) * 2 : 0);
check('mid-grey vanishes under multiply', remap(128, 'white') === 255);
check('a dark mark survives multiply', remap(20, 'white') === 40);
check('mid-grey vanishes under screen', remap(128, 'black') === 0);
check('a light mark survives screen', remap(250, 'black') === 244);
check('the remap is the one the code uses',
  /v < 128 \? v \* 2 : 255/.test(core) && /v > 128 \? \(v - 128\) \* 2 : 0/.test(core));

// ---- every grey-ground texture offers all nine, first is its default ----
const greys = Object.entries(T.TEXTURE_CAPS).filter(([, c]) => c.ground === 'grey');
check('most textures are marked as grey-ground', greys.length >= 20);
check('every grey-ground texture offers all nine blends', greys.every(([, c]) => c.blends.length === 9));
check('the Rorschach is ink on paper: multiply by default', T.TEXTURE_CAPS.inkbleed.blends[0] === 'multiply');
// Aurora Veil: every blend is remapped EXCEPT screen, its default, so the
// favourite's look is untouched (verified pixel-identical when this was added)
check('Aurora Veil keeps its default look: screen is exempt from the remap',
  T.TEXTURE_CAPS.aurora.ground === 'grey' && T.TEXTURE_CAPS.aurora.keepGround.includes('screen') &&
  T.TEXTURE_CAPS.aurora.blends[0] === 'screen');
check('the renderer honours the exemption',
  /!\(caps\.keepGround \|\| \[\]\)\.includes\(blend\)/.test(tg));
check('Aurora Veil has two hues, the hem defaulting to the curtain\'s colour',
  T.TEXTURE_CAPS.aurora.tints === 2 && T.TEXTURE_CAPS.aurora.tintDefaults[1] === T.TEXTURE_CAPS.aurora.tintDefaults[0]);

// ---- generic tint: marks only, white is no tint ----
check('the tint colours dark marks too, so textures with light AND dark elements tint both',
  /else if\(v < 128\)/.test(core) && /const deep = \{ r: t\.r \* 0\.32/.test(core));
check('only exactly-mid pixels — the ground — are left alone', /if\(v > 128\)\{[\s\S]*?\} else if\(v < 128\)\{/.test(core));
check('white is the identity tint', /t\.r >= 250 && t\.g >= 250 && t\.b >= 250\) return src/.test(core));
const tinted = Object.entries(T.TEXTURE_CAPS).filter(([, c]) => c.genericTint);
check('monochrome textures can be tinted', tinted.length >= 15);
check('generic tints default to white, so no existing look changes',
  tinted.every(([, c]) => (c.tintDefaults || [])[0] === '#FFFFFF'));
check('every tint is named as a Hue', tinted.every(([, c]) => / Hue$/.test(c.tintLabels[0])));

// ---- the size knob works below 100% ----
check('size is no longer clamped at 100%', !/zoom = Math\.max\(1, val\/100\)/.test(tg) && /Math\.max\(0\.25, val\/100\)/.test(tg));
const whimsy = readFileSync(new URL('../texWhimsy.js', import.meta.url), 'utf8');
check('the clouds scale their noise frequency, not their resolution',
  /const baseCells = 4 \/ zoom;/.test(whimsy) && !/workDiv = Math\.max\(1, 4 \* zoom\)/.test(whimsy));

// ---- accents are followed until a tint is chosen or locked ----
const ev = readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8');
check('changing an accent re-derives tints that come from it',
  /bindColorField\('accent1ColorHex', \(\)=>\{ followAccents\(\)/.test(ev));
check('a locked tint is left alone', /locked\.has\(ids\[i\]\)\) continue;/.test(ev));
check('a hand-picked tint stops following', /if\(!tintBySystem\) tintFollows\[0\] = false/.test(ev));
check('the app writing a tint is not mistaken for a person', /tintBySystem = true;\s*setColorField/.test(ev));

// ---- string table ----
const strs = readFileSync(new URL('../strings.js', import.meta.url), 'utf8');
check('the string table stores no HTML entities (text nodes do not decode them)',
  !/"[^"]*&(amp|lt|gt|quot|#\d+);[^"]*"/.test(strs));

// ---- the moon ----
check('the Fractal Moon exists and has two knobs', T.paramsFor('moon').length === 2);
check('its phase avoids new and full, so the organic side always shows',
  /const phase = \(Math\.random\(\)\*2 - 1\)\*0\.72;/.test(whimsy));
// the seed button must read the SAME draws the moon is drawn from
check('the generator and the seed button share one set of draws',
  /function moonDraws\(\)/.test(whimsy) && /withSeed\(seed, moonDraws\)/.test(whimsy) &&
  /moonDraws\(\);/.test(whimsy.slice(whimsy.indexOf('export function genMoon'))));
let threw = null;
try { for(const s of [1, 2, 3]) T.getTextureCanvas('moon', 300, 300, null, null, false, s, 100, 100, 315, '#d9a6b3', null, 'hard-light'); }
catch(e){ threw = e; }
check('it renders across seeds', threw === null);

// ---- the Scrying Pool ----
const touch = readFileSync(new URL('../texTouch.js', import.meta.url), 'utf8');
const sstep = (a,b,x) => { const t = Math.max(0, Math.min(1, (x-a)/(b-a))); return t*t*(3-2*t); };
const causticAt = d => 1 - sstep(0.30, 0.66, d), murkAt = d => sstep(0.34, 0.70, d);
check('depth has no dead zone: every depth shows caustics, murk, or both',
  [...Array(101).keys()].every(i => causticAt(i/100) + murkAt(i/100) > 0.35));
check('shallow water is all caustics, deep water all murk',
  causticAt(0.1) === 1 && murkAt(0.1) === 0 && causticAt(0.9) === 0 && murkAt(0.9) === 1);
check('the generator uses exactly that crossover',
  /const caustic=1-sstep\(0\.30,0\.66,depth\)/.test(touch) && /const murk=sstep\(0\.34,0\.70,depth\)/.test(touch));
check('waviness sets the caustic cell size too, so the knobs stay coherent',
  /const cell=Math\.max\(6, unit\*0\.06\*zoom\)/.test(touch));
check('it computes at a third of full resolution', /const div=3, ww=Math\.ceil\(w\/div\)/.test(touch));
check('it is neutral by default: the page supplies the colour',
  T.TEXTURE_CAPS.water.tintDefaults[0] === '#FFFFFF' && T.TEXTURE_CAPS.water.blends[0] === 'soft-light');
let wthrew = null;
try { for(const d of [0, 35, 50, 100]) T.getTextureCanvas('water', 240, 240, null, null, false, 5, 100, d, 45, null, null, 'soft-light'); }
catch(e){ wthrew = e; }
check('it renders across the whole depth range', wthrew === null);

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
