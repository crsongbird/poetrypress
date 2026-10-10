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
const NINE = ['overlay','soft-light','hard-light','multiply','color-burn','darken','screen','color-dodge','lighten'];
// all nine standard blends, at least — a coloured texture may add Normal
check('every grey-ground texture offers all nine blends', greys.every(([, c]) => NINE.every(b => c.blends.includes(b))));
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
check('light marks take the light hue and dark marks the dark hue — two tints, not one',
  /export function tintMarks\(src, lightHex, darkHex\)/.test(core) &&
  /d\[i\] = gr \+ k \* \(L\.r - gr\) \+ cr;/.test(core) && /d\[i\] = gr \+ k \* \(D\.r - gr\) \+ cr;/.test(core));
check('the lotus is painted in its own colours: petals and heart',
  T.TEXTURE_CAPS.flowers.tintLabels.join('|') === 'Petal Hue|Heart Hue' && !T.TEXTURE_CAPS.flowers.genericTint &&
  T.TEXTURE_CAPS.flowers.blends[0] === 'source-over');
check('only exactly-mid pixels — the ground — are left alone', /if\(v > 128\)\{[\s\S]*?\} else if\(v < 128\)\{/.test(core));
const tinted = Object.entries(T.TEXTURE_CAPS).filter(([, c]) => c.genericTint);
check('white over black is the identity: nothing changes until a hue is chosen',
  /const tint = \(!!\(lightHex \|\| darkHex\) && !\(lightIsWhite && darkIsBlack\)\) \|\| !groundIsGrey;/.test(core) && /if\(!tint && !remap\) return src;/.test(core));
check('generic tints default to white and black',
  tinted.every(([, c]) => c.tints === 2 && c.tintDefaults[0] === '#FFFFFF' && c.tintDefaults[1] === '#000000'));
check('monochrome textures can be tinted', tinted.length >= 15);

check('every tint is named as a Hue', tinted.every(([, c]) => / Hue$/.test(c.tintLabels[0])));

// ---- the size knob works below 100% ----
check('size is no longer clamped at 100%', !/zoom = Math\.max\(1, val\/100\)/.test(tg) && /Math\.max\(0\.25, val\/100\)/.test(tg));
const whimsy = readFileSync(new URL('../texWhimsy.js', import.meta.url), 'utf8');
check('Sleep Haze is smoke: lift, drag, dust, and lit from the light',
  T.paramsFor('clouds').map(d => d.label).join('|') === 'Lift|Drag|Dust' && T.TEXTURE_CAPS.clouds.light === true);
check('…its wisps are particles carried by curl noise, softened as they age; rings drift up; motes catch the shaft',
  /return \[gy\*gk, -gx\*gk\]; \};/.test(whimsy) && /W=WL\[t<unit\*0\.1\?0:t<unit\*0\.3\?1:2\];/.test(whimsy)
  && /const rings = Math\.random\(\)<0\.2 \? 0/.test(whimsy) && /b=Math\.pow\(beamAt\(x\/div, y\/div\), 1\.5\)/.test(whimsy));

// ---- accents are followed until a tint is chosen or locked ----
const ev = readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8');
check('changing an accent re-derives tints that come from it',
  /bindColorField\('accent1ColorHex', \(\)=>\{ followAccents\(\)/.test(ev));
check('a locked tint is left alone', /state\.locks\.has\(ids\[i\]\)\) continue;/.test(ev));
check('a hand-picked tint stops following', /if\(!state\.ui\.tintBySystem\) state\.ui\.tintFollows\[0\] = false/.test(ev));
check('the app writing a tint is not mistaken for a person', /state\.ui\.tintBySystem = true;\s*setColorField/.test(ev));

// ---- string table ----
const strs = readFileSync(new URL('../strings.js', import.meta.url), 'utf8');
check('the string table stores no HTML entities (text nodes do not decode them)',
  !/"[^"]*&(amp|lt|gt|quot|#\d+);[^"]*"/.test(strs));

// ---- the moon ----
check('the Fractal Moon exists: Moon Size, Fractal Depth, Clouds, Night Sky', T.paramsFor('moon').map(d => d.label).join('|') === 'Moon Size|Fractal Depth|Clouds|Night Sky');
check('its phase avoids new and full, so the organic side always shows',
  /const phase = \(Math\.random\(\)\*2 - 1\)\*0\.72;/.test(whimsy));
// the seed button must read the SAME draws the moon is drawn from
check('the generator and the seed button share one set of draws',
  /function moonDraws\(\)/.test(whimsy) && /withSeed\(seed, moonDraws\)/.test(whimsy) &&
  /moonDraws\(\);/.test(whimsy.slice(whimsy.indexOf('export function genMoon'))));
let threw = null;
try { for(const s of [1, 2, 3]) T.getTextureCanvas('moon', 300, 300, { seed: s, p1: 100, p2: 100, light: 315, tint1: '#d9a6b3', blend: 'hard-light' }); }
catch(e){ threw = e; }
check('it renders across seeds', threw === null);

// ---- the Scrying Pool ----
const touch = readFileSync(new URL('../texTouch.js', import.meta.url), 'utf8');
// (rebuilt as a physical surface: see pmlVars' Scrying Pool checks)
check('the pool is a physical surface: travelling waves, refracted rays, glints',
  /, waves=\[\]/.test(touch) && /const C=new Float32Array\(PN\);/.test(touch) && /const glint=Math\.pow\(nh, 400\)/.test(touch));
check('wave scale sets the waves\' length, on the export grid at any size',
  /const lam=Math\.max\(unit\*0\.025, unit\*0\.22\*zoom/.test(touch) && /const div=canonDiv\(2\), ww=Math\.ceil\(w\/div\), wh=Math\.ceil\(h\/div\), unit=Math\.min\(ww,wh\), N=ww\*wh;\n  const la=/.test(touch));
check('it is neutral by default: the page supplies the colour',
  T.TEXTURE_CAPS.water.tintDefaults[0] === '#FFFFFF' && T.TEXTURE_CAPS.water.blends[0] === 'soft-light');
let wthrew = null;
try { for(const d of [0, 35, 50, 100]) T.getTextureCanvas('water', 240, 240, { seed: 5, p1: 100, p2: d, light: 45, blend: 'soft-light' }); }
catch(e){ wthrew = e; }
check('it renders across the whole depth range', wthrew === null);

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
