/**
 * colorisFailure.test.mjs — the actual regression test for this bug: if the
 * Coloris CDN script fails to load for any reason (network hiccup, CDN
 * issue -- Coloris's own README warns against the unpinned @latest CDN
 * pattern this app used to use, for exactly this reason), `Coloris` is
 * undefined. Confirms the app still boots and the preset grid still
 * populates in that case, instead of the whole app silently failing.
 *
 * Run with: node test/colorisFailure.test.mjs
 */
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';

installCanvasMock();
const registry = installDomMock(makeMockContext, makeMockCanvas);

// Deliberately do NOT define global.Coloris -- this is the actual failure
// condition being tested, not an oversight.
delete global.Coloris;

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

check('appEvents.js loads without throwing even when Coloris is undefined', threw === null);
if(threw) console.log('  threw:', threw.stack || threw.message);

const presetGrid = registry['presetGrid'];
check('preset grid still populates when Coloris is undefined', presetGrid && presetGrid.children.length > 0);
if(presetGrid) console.log(`  preset grid has ${presetGrid.children.length} buttons`);

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
