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
check('boot palette has exactly 15 colors', bootCall.swatches.length === 15);
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
check('new palette is still exactly 15 colors', afterPresetClick.swatches.length === 15);

// simulate a color picker opening on a specific field -- should append that
// field's current value as a 16th swatch
const textColorField = registry['textColorHex'];
textColorField.value = '#ff00ff';
const fakeOpenEvent = { type: 'open', target: { value: '#ff00ff', matches: (sel) => sel === '[data-coloris]' } };
global.document.dispatchEvent(fakeOpenEvent);
const afterOpen = global.Coloris.lastCall;
check('picker open appends a 16th swatch', afterOpen.swatches.length === 16);
check('16th swatch is the field\'s live value', afterOpen.swatches[15] === '#ff00ff');
check('first 15 are still the current theme palette', JSON.stringify(afterOpen.swatches.slice(0,15)) === JSON.stringify(afterPresetClick.swatches));

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
