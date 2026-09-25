/**
 * colorisThrows.test.mjs — the actual regression test for the second
 * Coloris failure mode found in production: Coloris loads fine and IS
 * callable, but throws internally anyway (this really happened: a specific
 * pinned version threw "Cannot set properties of undefined (setting
 * 'className')" from inside its own init code). This is a DIFFERENT failure
 * mode than Coloris being undefined (see colorisFailure.test.mjs) -- a
 * typeof check alone doesn't catch a dependency that exists but misbehaves.
 *
 * Run with: node test/colorisThrows.test.mjs
 */
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';

installCanvasMock();
const registry = installDomMock(makeMockContext, makeMockCanvas);

// Coloris IS defined and IS a function -- it just throws, exactly like the
// real bug did. installDomMock already stubs a working Coloris; override it
// here specifically to misbehave.
global.Coloris = function(){
  throw new TypeError("Cannot set properties of undefined (setting 'className')");
};

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

check('appEvents.js loads without throwing even when Coloris throws internally', threw === null);
if(threw) console.log('  threw:', threw.stack || threw.message);

const presetGrid = registry['presetGrid'];
check('preset grid still populates when Coloris throws internally', presetGrid && presetGrid.children.length > 0);
if(presetGrid) console.log(`  preset grid has ${presetGrid.children.length} buttons`);

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
