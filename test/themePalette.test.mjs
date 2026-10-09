/**
 * themePalette.test.mjs — verifies the Coloris theme-palette feature:
 * 15 valid colors derived per-preset, the palette changes when the preset
 * changes, and a picker "open" event correctly appends the field's live
 * value as a 16th swatch.
 *
 * Run with: node test/themePalette.test.mjs
 */
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';

installCanvasMock();
const registry = installDomMock(makeMockContext, makeMockCanvas);
await import('../appEvents.js');

let failures = 0;
function check(label, cond){
  if(!cond){ failures++; console.log('FAIL:', label); }
  else console.log('ok:', label);
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// boot default (Midnight Page) should have applied a 15-color palette
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

// simulate a color picker opening on a specific field -- should append that
// field's current value as a 16th swatch
const textColorField = registry['textColorHex'];
textColorField.value = '#ff00ff';
const fakeOpenEvent = { type: 'open', target: { value: '#ff00ff', matches: (sel) => sel === '[data-coloris]' } };
global.document.dispatchEvent(fakeOpenEvent);
const afterOpen = global.Coloris.lastCall;
check('picker open keeps 18 swatches', afterOpen.swatches.length === 18);
check('the FIRST swatch is the field\'s live value (tap it to get back)', afterOpen.swatches[0] === '#ff00ff');
check('then the theme\'s 15, then white and black', JSON.stringify(afterOpen.swatches.slice(1,16)) === JSON.stringify(afterPresetClick.swatches.slice(1,16)) && afterOpen.swatches[16] === '#FFFFFF' && afterOpen.swatches[17] === '#000000');

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
