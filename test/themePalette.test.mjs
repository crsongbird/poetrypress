/**
 * themePalette.test.mjs — the Coloris theme palette: 18 swatches in three
 * even rows of six (the field's color, the 15 derived from the look, white
 * and black), a palette that changes when the preset changes, and a picker
 * "open" event that puts the field's live value in the first place.
 *
 * Run with: node test/themePalette.test.mjs
 */
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';
import { check, done } from './harness.mjs';

installCanvasMock();
const registry = installDomMock(makeMockContext, makeMockCanvas);
await import('../appEvents.js');


const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// boot default (Midnight Page) should have applied its palette
const bootCall = global.Coloris.lastCall;
check('Coloris got a swatches config at boot', bootCall && Array.isArray(bootCall.swatches));
// 18 swatches, three even rows of six: [the field's colour, the theme's 15, white, black]
check('boot swatches are exactly 18 (three even rows of six)', bootCall.swatches.length === 18);
check('every boot palette color is a valid hex string', bootCall.swatches.every(c => HEX_RE.test(c)));

// clicking a different preset should change the palette
const presetGrid = registry['presetGrid'];
// pick a preset from a different Element than the boot default, so the
// palette genuinely has to change rather than coincidentally matching
const otherBtn = presetGrid.children[8]; // Desire — a different Element than the boot default
otherBtn.dispatchEvent({ type: 'click' });
const afterPresetClick = global.Coloris.lastCall;
check('applying a different preset produces a different palette',
  JSON.stringify(afterPresetClick.swatches) !== JSON.stringify(bootCall.swatches));
check('after a preset, still exactly 18 swatches', afterPresetClick.swatches.length === 18);

// simulate a color picker opening on a specific field -- that field's current
// value should take the first swatch
const textColorField = registry['textColorHex'];
textColorField.value = '#ff00ff';
const fakeOpenEvent = { type: 'open', target: { value: '#ff00ff', matches: (sel) => sel === '[data-coloris]' } };
global.document.dispatchEvent(fakeOpenEvent);
const afterOpen = global.Coloris.lastCall;
check('picker open keeps 18 swatches', afterOpen.swatches.length === 18);
check('the FIRST swatch is the field\'s live value (tap it to get back)', afterOpen.swatches[0] === '#ff00ff');
// (the hues whose alpha is how much of them to use, or a light's strength, are given the picker's alpha slider at boot)
{ const withAlpha = (global.Coloris.instances || []).filter(c => c.alpha === true).map(c => String(c.instance || '')).join(',');
  check('the Specular, Shadow, Glow and the three lights\' pickers (Main Light, Rim Light, Ambient) keep their alpha slider',
    [3, 4, 5, 6, 7, 8].every(k => withAlpha.includes('#textureTint' + k + 'Hex'))); }
check('then the theme\'s 15, then white and black', JSON.stringify(afterOpen.swatches.slice(1,16)) === JSON.stringify(afterPresetClick.swatches.slice(1,16)) && afterOpen.swatches[16] === '#FFFFFF' && afterOpen.swatches[17] === '#000000');

done();
