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

const ORDER = [
  // Every module comes after everything it imports. The bundle is one flat
  // scope, so a module placed before its dependency can read a const that is
  // still in its temporal dead zone. test/bundle.test.mjs checks this order
  // against the real import statements.
  'tunables.js',          // pure data: the numbers
  'strings.js',           // pure data: the text
  'appOptions.js',        // fonts, presets, aspects, $
  'textParsers.js',       // PML
  'spell.js',             // glyph spells
  'moon.js',              // moon phase and its glyph
  'texCore.js',           // noise, colour mixing, seeded random
  'texWhimsy.js',         // ♡ generators
  'texSharpness.js',      // √ generators
  'texChaos.js',          // ∆ generators
  'texTouch.js',          // 🜚 generators
  'textureGenerators.js', // texture tables, cache and dispatch
  'fonts.js',             // typefaces fetched on first use
  'glyphs.js',            // drawn symbols inside canvas text
  'pmlVars.js',           // §Variables, resolved before PML
  'canvasRenderer.js',    // parsed lines into pixels
  'palette.js',           // colour picker suggestions
  'swatches.js',          // painted preset/spell tiles
  'pwa.js',               // service worker registration, theme colour
  'theme.js',             // UI theme selection
  'editor.js',            // PML highlighting
  'vault.js',             // Spellcrafting and the Grimoire
  'appEvents.js',         // entry point, needs everything
];

// Strip the module seams. Imports resolve to nothing once the files share
// a scope; exports become plain declarations.
function flatten(src, filename) {
  const withoutImports = src.replace(/^import\s*\{[^}]*\}\s*from\s*'\.\/[\w.-]+';\s*$/gm, '');
  const withoutExports = withoutImports.replace(/^export\s+(function|const|let|var|class)\b/gm, '$1');
  const leftover = withoutExports.match(/^\s*(import|export)\b.*$/gm);
  if (leftover) {
    throw new Error(
      `${filename}: ${leftover.length} module statement(s) survived flattening — ` +
      `the bundle would be broken. First: ${leftover[0].trim()}`
    );
  }
  return `\n/* ==== ${filename} ==== */\n${withoutExports.trim()}\n`;
}

const css = readFileSync('poetrypress.css', 'utf8');
let js = ORDER.map(f => flatten(readFileSync(f, 'utf8'), f)).join('\n');
// §Build: which build this is — its date and a short hash of the code
js = js.replace("'__BUILD_STAMP__'", JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ') + ' · ' +
  createHash('sha256').update(js).digest('hex').slice(0, 7)));

let html = readFileSync('index.html', 'utf8');

const linkTag = '<link rel="stylesheet" href="poetrypress.css">';
const scriptTag = '<script type="module" src="appEvents.js"></script>';
if (!html.includes(linkTag)) throw new Error('stylesheet link not found in index.html — build would silently drop the CSS');
if (!html.includes(scriptTag)) throw new Error('module script tag not found in index.html — build would silently drop the JS');

html = html.replace(linkTag, `<style>\n${css}\n</style>`);
html = html.replace(scriptTag, `<script>\n${js}\n</script>`);

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
console.log(`built dist/index.html — ${kb(html.length)} (css ${kb(css.length)}, js ${kb(js.length)})`);
console.log(`installable app: dist/ also holds sw.js (cache ${version}), manifest.webmanifest, icons/`);
console.log(`flattened ${ORDER.length} modules into one page — upload the whole dist/ folder`);

// ---- optional: the whole project as one archive, for moving it to GitHub ----
// node build.mjs --zip
// Writes release/unfixable-vellum-YYYY-MM-DD.zip: every source, test, tool,
// doc and the built dist/, with its folders intact. No dependencies — the zip
// is written by hand with Node's own deflate. Only on request: it isn't
// needed to build or test, and archiving every build would be wasted work.
if(process.argv.includes('--zip')){
  const { readdirSync: ls, statSync, readFileSync: rf, writeFileSync: wf, mkdirSync: md } = await import('fs');
  const zlib = await import('zlib');
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

  // CRC-32, for Node versions without zlib.crc32
  const table = new Uint32Array(256).map((_, n) => { let c = n; for(let k=0;k<8;k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc32 = buf => { if(zlib.crc32) return zlib.crc32(buf) >>> 0;
    let c = 0xFFFFFFFF; for(const b of buf) c = table[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };

  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const parts = [], central = [];
  let offset = 0;
  for(const path of files){
    const data = rf(path), packed = zlib.deflateRawSync(data, { level: 9 });
    const useDeflate = packed.length < data.length;
    const body = useDeflate ? packed : data, name = Buffer.from(path, 'utf8'), crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(useDeflate ? 8 : 0, 8); local.writeUInt16LE(dosTime, 10); local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(body.length, 18); local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26); local.writeUInt16LE(0, 28);
    parts.push(local, name, body);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(0x0800, 8);
    cen.writeUInt16LE(useDeflate ? 8 : 0, 10); cen.writeUInt16LE(dosTime, 12); cen.writeUInt16LE(dosDate, 14);
    cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(body.length, 20); cen.writeUInt32LE(data.length, 24);
    cen.writeUInt16LE(name.length, 28); cen.writeUInt32LE(offset, 42);
    central.push(cen, name);
    offset += 30 + name.length + body.length;
  }
  const cenBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cenBuf.length, 12); end.writeUInt32LE(offset, 16);
  md('release', { recursive: true });
  const stamp = now.toISOString().slice(0, 10);
  const out = `release/unfixable-vellum-${stamp}.zip`;
  const zip = Buffer.concat([...parts, cenBuf, end]);
  wf(out, zip);
  console.log(`archived ${files.length} files -> ${out} (${(zip.length/1024).toFixed(0)}kb)`);
}
