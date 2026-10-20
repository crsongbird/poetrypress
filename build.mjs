/**
 * build.mjs — flattens the press into one file.
 *
 *   Five rooms in a house.
 *   Knock the walls down, keep the rooms.
 *   One door now. Still home.
 *
 * Run: node build.mjs
 * Out: dist/index.html — everything inlined, nothing external but the fonts
 *      and the color picker CDN. One upload instead of nine.
 *
 * The modules stay modular for editing; this only exists so the deployed
 * artifact is a single file. Order below is the dependency order, and it
 * is not arbitrary: appOptions declares consts that the others read at
 * module level, and const does not hoist the way function declarations do.
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
import { createHash } from 'crypto';
import { Script } from 'vm';
import { pruneStrip } from './tools/prune.mjs';

// ---- release names: Jupiter's named moons, by average distance from the
// barycentre. `node build.mjs --next` moves release.js on to the next one.
// The list ends where Ruby's does; extend it (in order) before it runs out.
// Jupiter's NAMED moons by mean distance (semi-major axis), from NASA's Jovian
// Satellite Fact Sheet (nssdc.gsfc.nasa.gov, updated Dec 2023); unnamed S/…
// moons skipped. (Ersa and Himalia shipped in that order; by the table Himalia
// is a hair closer — 11,461,000 km against 11,483,000 — but shipped names stay.)
// Kale and Isonoe tie at 23,217,000 km and keep NASA's order.
const JUPITER = ['Amalthea', 'Thebe', 'Io', 'Europa', 'Ganymede', 'Callisto', 'Themisto', 'Leda', 'Ersa', 'Himalia',
  'Pandia', 'Lysithea', 'Elara', 'Dia', 'Carpo', 'Valetudo', 'Euporie',
  'Orthosie', 'Euanthe', 'Thyone', 'Mneme', 'Harpalyke', 'Hermippe', 'Praxidike', 'Thelxinoe', 'Eupheme', 'Helike',
  'Iocaste', 'Ananke', 'Philophrosyne', 'Eurydome', 'Arche', 'Autonoe', 'Pasithee', 'Herse', 'Chaldene', 'Kale',
  'Isonoe', 'Aitne', 'Erinome', 'Taygete', 'Carme', 'Sponde', 'Kalyke', 'Pasiphae', 'Eukelade', 'Eirene',
  'Megaclite', 'Sinope', 'Hegemone', 'Aoede', 'Kallichore', 'Callirrhoe', 'Cyllene', 'Kore'];   // then Saturn's
// Saturn's named moons, in order of distance (the shepherds and ring moons, the great moons, then the far
// irregulars). Pandora is left out: Ruby set the word aside (AGENTS §11).
const SATURN = ['Pan', 'Daphnis', 'Atlas', 'Prometheus', 'Epimetheus', 'Janus', 'Aegaeon', 'Mimas', 'Methone', 'Anthe',
  'Pallene', 'Enceladus', 'Tethys', 'Telesto', 'Calypso', 'Dione', 'Helene', 'Polydeuces', 'Rhea', 'Titan', 'Hyperion',
  'Iapetus', 'Kiviuq', 'Ijiraq', 'Phoebe', 'Paaliaq', 'Skathi', 'Albiorix', 'Bebhionn', 'Erriapus', 'Skoll', 'Siarnaq',
  'Tarqeq', 'Greip', 'Hyrrokkin', 'Jarnsaxa', 'Tarvos', 'Mundilfari', 'Bergelmir', 'Narvi', 'Suttungr', 'Hati',
  'Farbauti', 'Thrymr', 'Aegir', 'Bestla', 'Fenrir', 'Surtur', 'Kari', 'Ymir', 'Loge', 'Fornjot',
  // (the Norse group's ten named in 2022)
  'Gridr', 'Eggther', 'Angrboda', 'Beli', 'Gerd', 'Gunnlod', 'Skrymir', 'Alvaldi', 'Geirrod', 'Thiazzi'];
// Then Uranus's named moons by distance (whillyard.com's Uranus moons list), then Neptune's (Universe Today's list,
// with Hippocamp, the S/2004 N 1 it names, between Larissa and Proteus, and Neso the farthest); after them, Ruby:
// "we start naming these things differently".
const URANUS = ['Cordelia', 'Ophelia', 'Bianca', 'Cressida', 'Desdemona', 'Juliet', 'Portia', 'Rosalind', 'Cupid', 'Belinda',
  'Perdita', 'Puck', 'Mab', 'Miranda', 'Ariel', 'Umbriel', 'Titania', 'Oberon', 'Francisco', 'Caliban', 'Stephano', 'Trinculo',
  'Sycorax', 'Margaret', 'Prospero', 'Setebos', 'Ferdinand'];
const NEPTUNE = ['Naiad', 'Thalassa', 'Despina', 'Galatea', 'Larissa', 'Hippocamp', 'Proteus', 'Triton', 'Nereid', 'Halimede',
  'Sao', 'Laomedeia', 'Psamathe', 'Neso'];
// node build.mjs --notes: print the newest section of CHANGELOG.md (the release's commit message)
if(process.argv.includes('--notes')){
  const log = readFileSync('CHANGELOG.md', 'utf8'), at = log.indexOf('\n## '), next = log.indexOf('\n## ', at + 4);
  const sec = log.slice(at + 1, next < 0 ? undefined : next).trim();
  console.log('PoetryPress-' + sec.split('\n')[0].replace(/^## (\S+).*/, '$1') + '\n\n' + sec.split('\n').slice(1).join('\n').trim());   // (the name from the heading's line alone: the whole section once rode on it, so every message held its notes twice)
  process.exit(0);
}
if(process.argv.includes('--next')){
  const [planet, cur] = /RELEASE = '([^']+)'/.exec(readFileSync('release.js', 'utf8'))[1].split('–');
  const order = [...JUPITER.map(m => ['Jupiter', m]), ...SATURN.map(m => ['Saturn', m]), ...URANUS.map(m => ['Uranus', m]), ...NEPTUNE.map(m => ['Neptune', m])];
  const i = order.findIndex(([p, m]) => p === planet && m === cur);
  if(i < 0 || i + 1 >= order.length){ console.error(`No moon after ${planet}–${cur} in the list: Ruby names what comes after Neptune (build.mjs).`); process.exit(1); }
  const [np, nm] = order[i + 1];
  writeFileSync('release.js', readFileSync('release.js', 'utf8').replace(/RELEASE = '[^']+'/, `RELEASE = '${np}–${nm}'`)
    .replace(/RELEASE_DATE = '[^']*'/, `RELEASE_DATE = '${new Date().toISOString().slice(0, 10)}'`));
  console.log(`release: ${planet}–${cur} → ${np}–${nm}`);
  // THE CHANGELOG keeps the newest twenty releases; the older ones go to docs/changelog-archive.md, newest first
  const KEEP = 20, log = readFileSync('CHANGELOG.md', 'utf8'), parts = log.split(/^(?=## )/m);
  if(parts.length - 1 > KEEP){
    const ARCHIVE = 'docs/changelog-archive.md', head = '# Changelog, older releases\n\nThe releases before the newest twenty (CHANGELOG.md), newest first.\n\n';
    let old = ''; try { old = readFileSync(ARCHIVE, 'utf8').replace(/^[\s\S]*?(?=^## )/m, ''); } catch(e){}
    writeFileSync(ARCHIVE, head + parts.slice(1 + KEEP).join('').trimEnd() + '\n\n' + old);
    writeFileSync('CHANGELOG.md', parts.slice(0, 1 + KEEP).join('').trimEnd() + '\n');
    console.log(`changelog: ${parts.length - 1 - KEEP} older releases to ${ARCHIVE}`);
  }
}

// THE SURFACE MENUS' THUMBNAILS are kept in each browser until their surface changes (Ruby: "saved so they
// don't need regenned"). A surface changes on purpose only with its fingerprints (test/fixtures), so each
// surface's stamp is a hash of its fingerprints; SWATCH_STAMP a hash of the code that paints a thumbnail.
{
  const fp = JSON.parse(readFileSync('test/fixtures/texture-fingerprints.json', 'utf8')), by = {};
  for(const [k, v] of Object.entries(fp)){ const t = k.split('@')[0]; (by[t] = by[t] || []).push(k + JSON.stringify(v)); }
  const h = s => createHash('sha1').update(s).digest('base64url').slice(0, 8);
  const stamps = Object.fromEntries(Object.keys(by).sort().map(t => [t, h(by[t].sort().join('|'))]));
  const line = `export const TEXTURE_STAMPS = ${JSON.stringify(stamps)};`;
  const sw = `export const SWATCH_STAMP = '${h(readFileSync('swatches.js', 'utf8'))}';`;
  let rel = readFileSync('release.js', 'utf8');
  rel = /export const TEXTURE_STAMPS = .*;/.test(rel) ? rel.replace(/export const TEXTURE_STAMPS = .*;/, line) : rel.trimEnd() + `\n// each surface's thumbnail stamp (build.mjs, from its fingerprints): a tile is painted again only when it changes\n${line}\n`;
  rel = /export const SWATCH_STAMP = .*;/.test(rel) ? rel.replace(/export const SWATCH_STAMP = .*;/, sw) : rel.trimEnd() + `\n${sw}\n`;
  writeFileSync('release.js', rel);
}

const ORDER = [
  // Every module comes after everything it imports. The bundle is one flat
  // scope, so a module placed before its dependency can read a const that is
  // still in its temporal dead zone. test/bundle.test.mjs checks this order
  // against the real import statements.
  'tunables.js',          // pure data: the numbers
  'webgl.js',             // the one way WebGL2 is opened (the lighting, the GPU passes, the box's glass)
  'strings.js',           // pure data: the text
  'appOptions.js',        // fonts, presets, aspects, $
  'stitches.js',           // decorative stitches along any path (rules, borders, seams)
  'boxFx.js',              // the inset box as glass (GPU), and the blends a canvas can't do
  'effects.js',            // the text effect stack: definitions, PML, old forms
  'textParsers.js',       // PML
  'symbolLore.js',        // the symbols and their names (from Symbology)
  'spell.js',             // glyph spells
  'moon.js',              // moon phase and its glyph
  'seedWords.js',         // word seeds: every number a phrase, and back
  'texCore.js',           // noise, colour mixing, seeded random
  'texWhimsy.js',         // ♡ generators
  'texSharpness.js',      // √ generators
  'texChaos.js',          // ∆ generators
  'texTouch.js',          // 🜚 generators
  'cartomancyTable.js',   // what else is on the table (candle, cup, letter…) and what has happened to the cards
  'cartomancy.js',        // a card game on a table: its parts (table, cards, coins, the deal) and the texture
  'stepsTouch.js',        // steps for 🜚 surfaces: weave, cloth (Linen); panes, glass; flakes; pours; the older Touch textures as whole parts
  'stepsGenerative.js',   // parts that grow: Discharge (Lichtenberg), Wood, Burn, Differential Growth, Knotwork, Growth Medium, Tendrils, Circuit Traces; Ring in the Sky's frame (before stepsWhimsy, which draws with it)
  'stepsWhimsy.js',       // steps for ♡ surfaces: smoke, light shaft, motes; painted sky, ridges, wash; Silk Ribbons, Dream Bloom, Fractal Moon
  'stepsChaos.js',        // steps for ∆ surfaces: crazing, brushwork, glaze (Fractured Glaze); sigils, blots, facets, the black hole, the transmutation circle
  'stepsLight.js',        // the engine's own parts: Light Engine, Oil Paint, Canvas Weave, Paint Swipes
  'stepsRing.js',         // the Painted Ringworld's parts: The Arch, Land on the Ring
  'stepsRoom.js',         // Liminal Spaces' Room Caster
  'stepsFlora.js',        // the floral surfaces' Bloom
  'stepsSpecimen.js',     // Specimen: a whole plant of Bloom's species (Floral Imprints)
  'stepsPatterns.js',     // general parts, second shelf: Scatter, Grid & Dots, Ellipse, Polygon, Triangle Mesh, Blocks, Pyramids, Border Mask, Lookup, Displace, Gradient Map, Noise Gradient, Spectrum, HSB and Lab, Median, Map Switch, Flip, Perspective
  'stepsNetwork.js',      // Veins of Light's Network (after stepsPatterns, whose Delaunay it uses)
  'stepsStreamers.js',    // Windward Sea's Streamers
  'stepsLens.js',         // Lens Blur (Macro Bloom's focal plane)
  'stepsImprint.js',      // Imprint: a specimen's maps developed in a medium (Floral Imprints)
  'stepsSharpness.js',    // steps for √ surfaces: Halftone Screen, Film Grain, Guilloché; Night City, Lotus Pond
  'steps.js',             // the steps surfaces are made of (the Athanor's parts; textures as chains)
  'athanorStudies.js',    // the future-directions surfaces, as graphs of parts (Open → Surface Studies)
  'textureParams.js',     // every surface's sliders (chains.js reads them)
  'chains.js',            // textures rebuilt as chains of steps (and the Athanor's templates)
  'athanor.js',           // the Athanor's evaluator: a node graph made into a texture
  'textureGenerators.js',
  'textureElements.js',  // each texture's four readings: 🜂 🜄 🜁 🜃
  'runology.js',          // the Runes of Power: Archetypes, Accents, Chroma
  'textureService.js',     // textures made in a worker, so the page stays responsive // texture tables, cache and dispatch
  'fonts.js',             // typefaces fetched on first use
  'release.js',           // the release's name (§Build)
  'altText.js',           // the saved image's alt text, in words
  'jpegMeta.js',          // ...carried inside the JPEG (XMP)
  'murmur.js',            // soft interface sounds (off until turned on)
  'glyphs.js',            // drawn symbols inside canvas text
  'pmlVars.js',           // §Variables, resolved before PML
  'canvasRenderer.js',    // parsed lines into pixels
  'palette.js',           // colour picker suggestions
  'swatches.js',          // painted preset/spell tiles
  'chooser.js',           // a <select> shown as tiles (the surface menus)
  'pwa.js',               // service worker registration, theme colour
  'theme.js',             // UI theme selection
  'editor.js',            // PML highlighting
  'vault.js',             // Spellcrafting and the Grimoire
  'athanorWikiParts.js',  // the Athanor wiki's page for every part
  'athanorWiki.js',       // the Athanor's wiki: articles, search, the parts' pages
  'forge.js',             // the Athanor: a node editor for new surfaces (scaffold)
  // the UI's own modules, split from appEvents.js: declarations only (its wiring, the listeners, stays there, in order)
  'uiState.js',           // the working state
  'uiWorking.js',         // the line that says what is being made
  'uiHistory.js',         // undo, redo and the filmstrip
  'uiGuard.js',           // asking first, toasts, the draft
  'uiAthanor.js',         // the Athanor in the page
  'uiDials.js',           // the light and camera dials
  'uiLocks.js',           // locks, master locks and eyes, the dice, linked controls
  'uiLayers.js',          // the surface's two layers
  'uiLayout.js',          // page size, preview scale, pan and zoom, tabs, phone layout, focus mode
  'uiLook.js',            // a look saved and restored, presets, the lit look
  'uiSurface.js',         // the surface's sliders, tools, readings and menus
  'uiSkins.js',             // the surface's controls as knobs and faders, haptics, the display line
  'uiControls.js',        // the PML editor, effects, border, moon, frame, seeds, theme, sounds, Grimoire
  'appEvents.js',         // entry point, needs everything
];

// Strip the module seams. Imports resolve to nothing once the files share
// a scope; exports become plain declarations.
function flatten(src, filename) {
  const withoutImports = src.replace(/^import\s*\{[^}]*\}\s*from\s*'\.\/[\w.-]+';\s*$/gm, '');
  // (a re-export, `export { X } from './m.js'`, is already X in the one flat scope: it goes, as an import does)
  const withoutReexports = withoutImports.replace(/^export\s*\{[^}]*\}\s*from\s*'\.\/[\w.-]+';\s*$/gm, '');
  const withoutExports = withoutReexports.replace(/^export\s+(async\s+function|function|const|let|var|class)\b/gm, '$1');
  const leftover = withoutExports.match(/^\s*(import|export)\b.*$/gm);
  if (leftover) {
    throw new Error(
      `${filename}: ${leftover.length} module statement(s) survived flattening — ` +
      `the bundle would be broken. First: ${leftover[0].trim()}`
    );
  }
  // the comments stay in the source (the haiku and the notes); the page ships without them
  return `\n/* ==== ${filename} ==== */\n${pruneStrip(withoutExports, false, true).trim()}\n`;
}

const css = readFileSync('poetrypress.css', 'utf8');
// The texture worker's modules: the generators, the parts, the chains and the evaluator.
// They ship ONCE: a plain script on the page (it runs there, for the textures the page makes
// itself) whose text is also the worker's, with the worker's own few lines added (a Blob
// worker, which works from file:// too, unlike a URL). The rest of the page follows it.
const WORKER_ORDER = [ // which modules the worker needs (textureWorker.js is its own, the rest are shared)
                      'tunables.js', 'webgl.js', 'symbolLore.js', 'spell.js', 'stitches.js', 'texCore.js', 'texWhimsy.js', 'texSharpness.js',
                      'texChaos.js', 'texTouch.js', 'cartomancyTable.js', 'cartomancy.js', 'textureParams.js', 'stepsTouch.js', 'stepsGenerative.js', 'stepsWhimsy.js', 'stepsChaos.js', 'stepsLight.js', 'stepsSharpness.js', 'stepsRing.js', 'stepsRoom.js', 'stepsFlora.js', 'stepsSpecimen.js', 'stepsPatterns.js', 'stepsNetwork.js', 'stepsStreamers.js', 'stepsLens.js', 'stepsImprint.js', 'steps.js', 'athanorStudies.js', 'chains.js', 'athanor.js', 'textureGenerators.js', 'textureWorker.js'];
// (in the page's order, which test/bundle.test.mjs checks against the imports; they import nothing that isn't shared)
const SHARED = ORDER.filter(f => WORKER_ORDER.includes(f));
{ const missing = SHARED.filter(f => !ORDER.includes(f)); if (missing.length) throw new Error('worker modules not on the page: ' + missing.join(', ')); }
const shared = SHARED.map(f => flatten(readFileSync(f, 'utf8'), f)).join('\n').replace(/<\/script/gi, '<\\/script');
const workerMain = flatten(readFileSync('textureWorker.js', 'utf8'), 'textureWorker.js').replace(/<\/script/gi, '<\\/script');
let js = ORDER.filter(f => !SHARED.includes(f)).map(f => flatten(readFileSync(f, 'utf8'), f)).join('\n');
// §Build: which build this is — its date and a short hash of the code
js = js.replace("'__BUILD_STAMP__'", JSON.stringify(new Date().toISOString().slice(0, 10) + ' · ' +
  createHash('sha256').update(shared + js).digest('hex').slice(0, 7)));

let html = readFileSync('index.html', 'utf8');

const linkTag = '<link rel="stylesheet" href="poetrypress.css">';
const scriptTag = '<script type="module" src="appEvents.js"></script>';
if (!html.includes(linkTag)) throw new Error('stylesheet link not found in index.html — build would silently drop the CSS');
if (!html.includes(scriptTag)) throw new Error('module script tag not found in index.html — build would silently drop the JS');

// (by a function: a replacement string would read $& and the like in the code as patterns)
html = html.replace(linkTag, () => `<style>\n${css}\n</style>`);
html = html.replace(scriptTag, () => `<script id="vellum-texture-worker">\n${shared}\n</script>\n` +
  `<script type="text/js-worker" id="vellum-worker-main">\n${workerMain}\n</script>\n<script>\n${js}\n</script>`);
if (!html.includes(js) || !html.includes(shared) || !html.includes(workerMain)) throw new Error('the bundle was not inlined verbatim');
// (each script must still parse once its comments are gone; bundle.test proves it the same, token for token)
for(const [what, code] of [['the generators', shared], ['the worker', shared + '\n' + workerMain], ['the page', shared + '\n' + js]])
  try { new Script(code); } catch(e){ throw new Error(`${what} no longer parse after stripping comments: ${e.message}`); }


mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', html);

// ---- the installable-app files, beside the page ----
// A service worker must be its own file, so the deploy is a small folder:
// index.html, manifest.webmanifest, sw.js and icons/. The worker's cache is
// versioned by the page's contents, so every real change gets a fresh cache.
const version = createHash('sha256').update(html).digest('hex').slice(0, 12);
writeFileSync('dist/sw.js', readFileSync('pwa/sw.js', 'utf8').replace('__BUILD_VERSION__', version));
copyFileSync('pwa/manifest.webmanifest', 'dist/manifest.webmanifest');
mkdirSync('dist/icons', { recursive: true });
for(const f of readdirSync('icons')) copyFileSync('icons/' + f, 'dist/icons/' + f);

const kb = n => (n / 1024).toFixed(1) + 'kb';
console.log(`built dist/index.html — ${kb(html.length)} (css ${kb(css.length)}, js ${kb(shared.length + workerMain.length + js.length)}: the generators ${kb(shared.length)}, shared with the worker)`);
console.log(`installable app: dist/ also holds sw.js (cache ${version}), manifest.webmanifest, icons/`);
console.log(`flattened ${ORDER.length} modules into one page — upload the whole dist/ folder`);

// ---- optional: the whole project as one archive, for moving it to GitHub ----
// node build.mjs --zip
// Writes release/unfixable-vellum-<moon>-YYYY-MM-DD.zip (the moon in the name, so
// two releases made the same day never share a file name): every source, test, tool,
// doc and the built dist/, with its folders intact. Older archives in release/ are removed. No dependencies — the zip
// is written by hand with Node's own deflate. Only on request: it isn't
// needed to build or test, and archiving every build would be wasted work.
if(process.argv.includes('--zip')){
  const { readdirSync: ls, statSync, readFileSync: rf, writeFileSync: wf, mkdirSync: md } = await import('fs');
  const zlib = await import('zlib');
  // only the newest archive is kept: the old ones are deleted first (Ruby: old releases
  // left lying about only fill space — and the context of whoever works on this next)
  try { for(const f of ls('release')) if(f.endsWith('.zip')){ (await import('fs')).unlinkSync('release/' + f); console.log('removed old archive release/' + f); } } catch(e){ /* no release/ yet */ }
  const SKIP = new Set(['node_modules', '.git', 'release']);
  const files = [];
  const walk = dir => {
    for(const name of ls(dir)){
      if(SKIP.has(name) || name.endsWith('.zip') || name === '.DS_Store') continue;
      const p = dir === '.' ? name : dir + '/' + name;
      statSync(p).isDirectory() ? walk(p) : files.push(p);
    }
  };
  walk('.');
  files.sort();
  // Every folder gets an entry of its own ("dist/", "test/fixtures/"…), before
  // its files. Tools that infer folders from paths don't need them, but simpler
  // unzippers (many phone file managers) show only what is listed — without
  // them, the archive looked like loose top-level files.
  const dirs = [...new Set(files.flatMap(f => { const parts = f.split('/').slice(0, -1); return parts.map((_, i) => parts.slice(0, i + 1).join('/') + '/'); }))].sort();
  const entries = [...dirs, ...files].sort((a, b) => a.localeCompare(b));

  // CRC-32, for Node versions without zlib.crc32
  const table = new Uint32Array(256).map((_, n) => { let c = n; for(let k=0;k<8;k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc32 = buf => { if(zlib.crc32) return zlib.crc32(buf) >>> 0;
    let c = 0xFFFFFFFF; for(const b of buf) c = table[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };

  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const parts = [], central = [];
  let offset = 0;
  for(const path of entries){
    const isDir = path.endsWith('/');
    const data = isDir ? Buffer.alloc(0) : rf(path), packed = isDir ? data : zlib.deflateRawSync(data, { level: 9 });
    const useDeflate = !isDir && packed.length < data.length;
    const body = useDeflate ? packed : data, name = Buffer.from(path, 'utf8'), crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(useDeflate ? 8 : 0, 8); local.writeUInt16LE(dosTime, 10); local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(body.length, 18); local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26); local.writeUInt16LE(0, 28);
    parts.push(local, name, body);
    const cen = Buffer.alloc(46);
    // made by Unix (3), with real permissions: 755 folders, 644 files (and the
    // MS-DOS directory bit on folders, for tools that read only that)
    cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE((3 << 8) | 20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(0x0800, 8);
    cen.writeUInt16LE(useDeflate ? 8 : 0, 10); cen.writeUInt16LE(dosTime, 12); cen.writeUInt16LE(dosDate, 14);
    cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(body.length, 20); cen.writeUInt32LE(data.length, 24);
    cen.writeUInt16LE(name.length, 28);
    cen.writeUInt32LE((((isDir ? 0o040755 : 0o100644) << 16) | (isDir ? 0x10 : 0)) >>> 0, 38);
    cen.writeUInt32LE(offset, 42);
    central.push(cen, name);
    offset += 30 + name.length + body.length;
  }
  const cenBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cenBuf.length, 12); end.writeUInt32LE(offset, 16);
  md('release', { recursive: true });
  const stamp = now.toISOString().slice(0, 10);
  const moon = ((/RELEASE = '[^–']*–([^']+)'/.exec(rf('release.js', 'utf8')) || [])[1] || 'release').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const out = `release/unfixable-vellum-${moon}-${stamp}.zip`;
  const zip = Buffer.concat([...parts, cenBuf, end]);
  wf(out, zip);
  console.log(`archived ${files.length} files in ${dirs.length} folders -> ${out} (${(zip.length/1024).toFixed(0)}kb)`);
}
