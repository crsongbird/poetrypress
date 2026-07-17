/**
 * appBoot.test.mjs — the actual regression test for the "presets panel
 * never loads" bug: import appEvents.js (the real entry point) under a
 * fake DOM/canvas and confirm it doesn't throw during its top-level
 * execution, AND that the preset grid genuinely got populated.
 *
 * Run with: node test/appBoot.test.mjs
 */
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';

installCanvasMock();
const registry = installDomMock(makeMockContext, makeMockCanvas);

let threw = null;
try {
  await import('../appEvents.js');
} catch (e) {
  threw = e;
}

let failures = 0;
function check(label, cond){
  if(!cond){ failures++; console.log('FAIL:', label); }
  else console.log('ok:', label);
}

check('appEvents.js loads without throwing', threw === null);
if(threw){
  console.log('  threw:', threw.stack || threw.message);
}

const presetGrid = registry['presetGrid'];
check('preset grid actually got populated', presetGrid && presetGrid.children.length > 0);
if(presetGrid){
  console.log(`  preset grid has ${presetGrid.children.length} buttons`);
}

const fontSelectEl = registry['fontFamily'];
check('font dropdown got populated', fontSelectEl && fontSelectEl.children.length > 0);

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
