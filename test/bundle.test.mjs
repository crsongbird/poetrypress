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
import { check, done } from './harness.mjs';

installCanvasMock();
const registry = installDomMock(makeMockContext, makeMockCanvas);


// the page runs two scripts: the generators (shared with the texture worker, shipped once) and then its own
const built = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const sharedM = built.match(/<script id="vellum-texture-worker">\n([\s\S]*?)\n<\/script>/);
const html = built.replace(/<script type="text\/js-worker" id="vellum-worker-main">[\s\S]*?<\/script>/, '')
  .replace(/<script id="vellum-texture-worker">[\s\S]*?<\/script>/, '');

// the bundled script is the last <script> block with no src attribute
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
check('bundle contains exactly one inlined script block, after the generators', blocks.length === 1 && !!sharedM && built.indexOf(sharedM[0]) < built.lastIndexOf('<script>\n'));
check('bundle inlined the stylesheet', html.includes('<style>') && !html.includes('href="poetrypress.css"'));
check('bundle has no leftover module script tag', !html.includes('type="module"'));
check('no import/export statements survived', !/^\s*(import|export)\s/m.test(blocks[0] || ''));

let threw = null;
try {
  new Function((sharedM ? sharedM[1] : '') + '\n' + blocks[0])();
} catch (e) {
  threw = e;
}
check('bundled script executes without throwing', threw === null);
if(threw) console.log('  threw:', threw.message);

const presetGrid = registry['presetGrid'];
check('bundle populates the preset grid', presetGrid && presetGrid.children.length > 0);
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
  // the PAGE's module list only (the texture worker has a list of its own)
  const pageList = buildSrc.slice(buildSrc.indexOf('const ORDER = ['), buildSrc.indexOf('];', buildSrc.indexOf('const ORDER = [')));
  const mods = [...pageList.matchAll(/^\s*'([\w]+\.js)',/gm)].map(m => m[1]);
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
  // the PAGE's module list only (the texture worker has a list of its own)
  const orderBlock = buildSrc.slice(buildSrc.indexOf('const ORDER = ['), buildSrc.indexOf('];', buildSrc.indexOf('const ORDER = [')));
  const order = [...orderBlock.matchAll(/^\s*'([\w]+\.js)',/gm)].map(m => m[1]);
  // as the page runs them: the worker's modules first (their own script), then the rest
  const wl = buildSrc.slice(buildSrc.indexOf('const WORKER_ORDER = ['), buildSrc.indexOf('];', buildSrc.indexOf('const WORKER_ORDER = [')));
  const workerMods = new Set([...wl.matchAll(/'([\w]+\.js)'/g)].map(m => m[1]));
  check('the worker\'s module list was read', workerMods.size > 20);
  const ran = [...order.filter(f => workerMods.has(f)), ...order.filter(f => !workerMods.has(f))];
  const pos = new Map(ran.map((f, i) => [f, i]));
  const late = [];
  for(const f of ran){
    const src = rf(new URL('../' + f, import.meta.url), 'utf8');
    for(const m of src.matchAll(/^import [^;]*from '\.\/([\w]+\.js)';/gm)){
      if(!pos.has(m[1])) late.push(`${f} imports ${m[1]}, which is not bundled`);
      else if(pos.get(m[1]) > pos.get(f)) late.push(`${f} comes before its dependency ${m[1]}`);
    }
  }
  check('every module is bundled after the modules it imports', late.length === 0);
  if(late.length) console.log('   ' + late.join('\n   '));
  const onDisk = rf(new URL('../build.mjs', import.meta.url), 'utf8') && (await import('fs')).readdirSync(new URL('..', import.meta.url)).filter(f => /^[\w]+\.js$/.test(f));
  // textureWorker.js is bundled into the texture worker, not the page
  const unbundled = onDisk.filter(f => !pos.has(f) && f !== 'textureWorker.js');
  check('every module on disk is in the bundle', unbundled.length === 0);
  if(unbundled.length) console.log('   not bundled:', unbundled.join(', '));
}

// ---- the texture worker ----
{
  const main = built.match(/<script type="text\/js-worker" id="vellum-worker-main">\n([\s\S]*?)\n<\/script>/);
  check('the built page carries the worker\'s own lines, inert until the service starts it', !!main);
  const workerSrc = (sharedM ? sharedM[1] : 'x x') + '\n' + (main ? main[1] : 'x x');
  let parses = false; try { new Function(workerSrc); parses = true; } catch(e){}
  check('the worker\'s code (the shared generators and its own lines) parses on its own', parses);
  check('the worker ends with its own message handler', !!main && /self\.onmessage = \(e\) =>/.test(main[1]));
  check('the generators ship once (no second copy of the parts)', (built.match(/\/\* ==== steps\.js ==== \*\//g) || []).length === 1);
  check('the page bundle never uses import.meta (a plain script, where it would not parse)', !/import\.meta/.test(built.replace(main ? main[0] : '', '')));
}

// ---- the page ships without comments: the same code, token for token ----
{
  const { pruneStrip } = await import('../tools/prune.mjs');
  let acorn = null;
  for(const at of ['acorn', '/opt/npm-tools/node_modules/acorn/dist/acorn.mjs']){ try { acorn = await import(at); break; } catch(e){} }
  const { readFileSync: rf, readdirSync: rd } = await import('fs');
  const mods = rd(new URL('..', import.meta.url)).filter(f => /^[\w]+\.js$/.test(f));
  if(!acorn) console.log('   (no acorn here: the build\'s own parse check stands alone)');
  else {
    const toks = src => { const out = []; for(const t of acorn.tokenizer(src, { ecmaVersion: 'latest', sourceType: 'module' })) out.push(t.type.label + '\u0000' + (t.value === undefined ? '' : String(t.value instanceof RegExp ? t.value : t.value))); return out; };
    const lines = src => { const out = []; let line = 0, last = -1; for(const t of acorn.tokenizer(src, { ecmaVersion: 'latest', sourceType: 'module', locations: true })){ out.push(t.loc.start.line > last ? 1 : 0); last = t.loc.end.line; } return out; };
    const differ = [];
    for(const f of mods){
      const src = rf(new URL('../' + f, import.meta.url), 'utf8'), cut = pruneStrip(src, false, true);
      const a = toks(src), b = toks(cut);
      if(a.length !== b.length || a.some((x, i) => x !== b[i])) { differ.push(f); continue; }
      // and every token that began a new line still does (so no automatic semicolon is gained or lost)
      const la = lines(src), lb = lines(cut);
      if(la.some((x, i) => x !== lb[i])) differ.push(f + ' (line breaks)');
    }
    check(`stripping comments leaves every module the same, token for token and line break for line break (${mods.length})`, differ.length === 0);
    if(differ.length) console.log('   differ:', differ.join(', '));
  }
  check('the shipped page carries no comments but the module seams', !/\/\/ Haiku|Haiku:/.test(built.replace(/<script type="text\/js-worker"[\s\S]*?<\/script>/, '')));
}

done();
