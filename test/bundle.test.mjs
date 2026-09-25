/**
 * bundle.test.mjs — proves the single-file build in dist/ actually boots.
 *
 * The modules are tested individually elsewhere; this tests the thing that
 * actually gets deployed. Flattening five ES modules into one shared scope
 * can break in ways the modular version never would — a name collision
 * between two files, or a const read before its declaration, since const
 * does not hoist the way function declarations do and the concatenation
 * order is what decides that.
 *
 * Run: node build.mjs && node test/bundle.test.mjs
 */
import { readFileSync } from 'fs';
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';

installCanvasMock();
const registry = installDomMock(makeMockContext, makeMockCanvas);

let failures = 0;
function check(label, cond){
  if(!cond){ failures++; console.log('FAIL:', label); }
  else console.log('ok:', label);
}

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');

// the bundled script is the last <script> block with no src attribute
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
check('bundle contains exactly one inlined script block', blocks.length === 1);
check('bundle inlined the stylesheet', html.includes('<style>') && !html.includes('href="poetrypress.css"'));
check('bundle has no leftover module script tag', !html.includes('type="module"'));
check('no import/export statements survived', !/^\s*(import|export)\s/m.test(blocks[0] || ''));

let threw = null;
try {
  new Function(blocks[0])();
} catch (e) {
  threw = e;
}
check('bundled script executes without throwing', threw === null);
if(threw) console.log('  threw:', threw.message);

const presetGrid = registry['presetGrid'];
check('bundle populates the preset grid', presetGrid && presetGrid.children.length === 16);
if(presetGrid) console.log(`  preset grid has ${presetGrid.children.length} buttons`);
check('bundle populates the font dropdown', registry['fontFamily'] && registry['fontFamily'].children.length > 0);

// ---- no two modules may declare the same top-level name ----
// build.mjs flattens every module into ONE scope. Each module passes its own
// tests with separate scopes, so a collision only shows up in the bundle, in
// a browser, as "Identifier has already been declared" — which is how
// editor.js's MARKS met tunables.js's MARKS.
{
  const { readFileSync: rf } = await import('fs');
  const buildSrc = rf(new URL('../build.mjs', import.meta.url), 'utf8');
  const mods = [...buildSrc.matchAll(/^\s*'([\w]+\.js)',/gm)].map(m => m[1]);
  const owner = new Map(), clashes = [];
  for(const f of mods){
    const src = rf(new URL('../' + f, import.meta.url), 'utf8');
    const names = [...src.matchAll(/^(?:export\s+)?(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]);
    for(const n of new Set(names)){
      if(owner.has(n)) clashes.push(`${n} (${owner.get(n)} and ${f})`);
      else owner.set(n, f);
    }
  }
  check('the bundle order lists every module', mods.length >= 10);
  check('no top-level name is declared in two modules', clashes.length === 0);
  if(clashes.length) console.log('   clashes:', clashes.join(', '));
}

// ---- every module is bundled after everything it imports ----
{
  const { readFileSync: rf } = await import('fs');
  const buildSrc = rf(new URL('../build.mjs', import.meta.url), 'utf8');
  const order = [...buildSrc.matchAll(/^\s*'([\w]+\.js)',/gm)].map(m => m[1]);
  const pos = new Map(order.map((f, i) => [f, i]));
  const late = [];
  for(const f of order){
    const src = rf(new URL('../' + f, import.meta.url), 'utf8');
    for(const m of src.matchAll(/^import [^;]*from '\.\/([\w]+\.js)';/gm)){
      if(!pos.has(m[1])) late.push(`${f} imports ${m[1]}, which is not bundled`);
      else if(pos.get(m[1]) > pos.get(f)) late.push(`${f} comes before its dependency ${m[1]}`);
    }
  }
  check('every module is bundled after the modules it imports', late.length === 0);
  if(late.length) console.log('   ' + late.join('\n   '));
  const onDisk = rf(new URL('../build.mjs', import.meta.url), 'utf8') && (await import('fs')).readdirSync(new URL('..', import.meta.url)).filter(f => /^[\w]+\.js$/.test(f));
  const unbundled = onDisk.filter(f => !pos.has(f));
  check('every module on disk is in the bundle', unbundled.length === 0);
  if(unbundled.length) console.log('   not bundled:', unbundled.join(', '));
}

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
