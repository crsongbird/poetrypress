/**
 * appBoot.test.mjs — the app boots. The regression test for the "presets
 * panel never loads" bug: import appEvents.js (the real entry point) under a
 * fake DOM/canvas, confirm its top-level execution doesn't throw, AND that
 * the preset grid and the font menu genuinely got populated.
 *
 * And the same when Coloris, the color picker loaded from a CDN, fails in
 * either of the two ways it really did in production:
 *   - it never arrives (a network hiccup, a CDN issue: `Coloris` is
 *     undefined; Coloris's own README warns against the unpinned @latest CDN
 *     pattern this app used to use, for exactly this reason);
 *   - it arrives, is callable, and throws inside its own init (a pinned
 *     version threw "Cannot set properties of undefined (setting
 *     'className')"). A typeof check alone doesn't catch a dependency that
 *     exists but misbehaves.
 * Either way the app must still boot and the grid still fill.
 *
 * Each boot runs in its own process (appEvents.js runs once per import).
 *
 * Run with: node test/appBoot.test.mjs
 */
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

// ---------------- one boot (child process) ----------------
if(process.env.BOOT_COLORIS){
  const { installCanvasMock, makeMockContext, makeMockCanvas } = await import('./canvasMock.mjs');
  const { installDomMock } = await import('./domMock.mjs');
  installCanvasMock();
  const registry = installDomMock(makeMockContext, makeMockCanvas);
  // installDomMock stubs a working Coloris: take it away, or make it misbehave, before the app loads
  if(process.env.BOOT_COLORIS === 'missing') delete global.Coloris;
  if(process.env.BOOT_COLORIS === 'throws') global.Coloris = function(){ throw new TypeError("Cannot set properties of undefined (setting 'className')"); };
  let threw = null;
  try { await import('../appEvents.js'); } catch(e){ threw = String(e && e.stack || e); }
  const presetGrid = registry['presetGrid'], fonts = registry['fontFamily'];
  console.log('BOOT ' + JSON.stringify({ threw, grid: presetGrid ? presetGrid.children.length : -1, fonts: fonts ? fonts.children.length : -1 }));
  process.exit(0);
}

// ---------------- the checks ----------------
let failures = 0;
function check(label, cond){
  if(!cond){ failures++; console.log('FAIL:', label); }
  else console.log('ok:', label);
}
const self = fileURLToPath(import.meta.url);
function boot(coloris){
  const r = spawnSync(process.execPath, [self], { encoding: 'utf8', timeout: 60000, env: { ...process.env, BOOT_COLORIS: coloris } });
  const line = (r.stdout || '').split('\n').find(l => l.startsWith('BOOT '));
  if(!line){ console.log('  (boot produced no result)\n' + (r.stderr || '').slice(-1500)); return { threw: 'no result', grid: -1, fonts: -1 }; }
  const out = JSON.parse(line.slice(5));
  if(out.threw) console.log('  threw:', out.threw.slice(0, 600));
  console.log(`  (Coloris ${coloris}: the preset grid has ${out.grid} buttons)`);
  return out;
}

const plain = boot('stub');
check('appEvents.js loads without throwing', plain.threw === null);
check('preset grid actually got populated', plain.grid > 0);
check('font dropdown got populated', plain.fonts > 0);

const missing = boot('missing');
check('appEvents.js loads without throwing even when Coloris is undefined', missing.threw === null);
check('preset grid still populates when Coloris is undefined', missing.grid > 0);

const throws = boot('throws');
check('appEvents.js loads without throwing even when Coloris throws internally', throws.threw === null);
check('preset grid still populates when Coloris throws internally', throws.grid > 0);

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
