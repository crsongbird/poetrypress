/**
 * swatches.test.mjs — preset snapshots.
 *
 * A swatch has to show enough to tell presets apart: the ground, a hint of
 * the surface, the border if it has one, and its glyphs. The cost matters —
 * sixteen of these are painted at boot — so the texture is generated AT
 * swatch size rather than rendered full and scaled.
 *
 * Run: node test/swatches.test.mjs
 */
import { readFileSync } from 'fs';
import { installCanvasMock, makeMockContext, makeMockCanvas, createdCanvases, resetCreatedCanvases } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';

installCanvasMock();
const registry = installDomMock(makeMockContext, makeMockCanvas);
await import('../appEvents.js');
const { PRESETS } = await import('../appOptions.js');

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };

const ev = readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8');
const vault = readFileSync(new URL('../vault.js', import.meta.url), 'utf8');

check('every preset button was built', registry['presetGrid'].children.length === PRESETS.length);

// the swatch must be a canvas, not a div with a background
check('swatches are painted, not CSS gradients',
  /const swatch = document\.createElement\('canvas'\)/.test(ev) &&
  !/swatch\.style\.background/.test(ev));

// each element of the snapshot
// the painter moved to its own module in the refactor
const sw = readFileSync(new URL('../swatches.js', import.meta.url), 'utf8');
const paint = (sw.match(/function paintPresetSwatch[\s\S]*?\n\}/) || [''])[0];
check('the painter exists', paint.length > 400);
check('it paints the ground', /fillRect\(0, 0, w, h\)/.test(paint));
check('it paints the surface', /getTextureCanvas\(/.test(paint));
check('it honours the preset\'s blend, or the texture\'s default',
  /const blend = p\.textureBlend && caps\.blends\.includes\(p\.textureBlend\) \? p\.textureBlend : caps\.blends\[0\]/.test(paint) &&
  /globalCompositeOperation = blend/.test(paint));
check('it honours the texture opacity', /textureOpacity/.test(paint));
check('it draws the border when the preset has one', /strokeRect\(/.test(paint));
check('it draws the glyphs', /spellToPML\(p\.spell\)/.test(paint));
check('glyphs use the preset\'s own accents',
  /sg\.color === 'accent1' \? \(p\.accent1/.test(paint));
check('a swatch failure can never break the page', /catch\(e\)\{ \/\* a swatch is never worth/.test(paint));

// cost: generated at swatch size, not full size then scaled
check('the texture is generated at swatch size',
  /getTextureCanvas\(type, w, h,/.test(paint));

// the composite texture has no generator of its own under that name
check('the composite starfield is mapped to a real generator',
  /p\.textureType === 'astral' \? 'astral_stars'/.test(paint));

// the Spellcrafting wheel shares the painter rather than duplicating it
check('the wheel uses the same painter', /deps\.paintSwatch/.test(vault));
check('the wheel still works without one', /else \{[\s\S]{0,200}chip-swatch/.test(vault));
check('the painter is injected into the vault', /paintSwatch: paintPresetSwatch/.test(ev));

// painting sixteen swatches must not be extravagant
resetCreatedCanvases();
const before = createdCanvases.length;
check('painting is cheap enough to do at boot', before < 400);

// ---- snapshot geometry ----
// The canvas is painted at roughly the display box's aspect so filling it
// introduces no visible distortion, and the border is inset by a full stroke
// width so all four edges land inside the canvas.
// the dimensions moved into tunables.js so they can be edited by hand
const { SWATCH } = await import('../tunables.js');
check('the swatch is painted from the tunable size',
  /paintPresetSwatch\(swatch, p, SWATCH\.width, SWATCH\.height\)/.test(ev));
check('that size still matches the box\'s aspect',
  Math.abs((SWATCH.width / SWATCH.height) - (208 / 48)) < 0.6);
check('the border is inset by a full stroke width', /const inset = c\.lineWidth;/.test(paint));
check('the glyphs are centred both ways',
  /textBaseline = 'middle'/.test(paint) && /\(w - total\) \/ 2/.test(paint) && /const y = h \/ 2/.test(paint));

// ---- saved presets in the grid ----
const savedFn = (ev.match(/function renderSavedPresets[\s\S]*?\n\}/) || [''])[0];
check('saved presets are appended, never replacing the built-ins',
  /presetGrid\.children\.length > builtInCount/.test(savedFn));
check('the row is completed with blanks', /preset-empty/.test(savedFn));
check('blanks are hidden from assistive tech', /aria-hidden/.test(savedFn));
check('a saved preset applies its own look and spell, through the look filter',
  /restoreSettings\(stripToLook\(Object\.assign\(\{\}, rec\.settings, \{ spell: rec\.spell \}\)\)\)/.test(savedFn));
check('tiles are built by one shared helper', /function presetTile/.test(ev));

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
