/**
 * pwa.test.mjs — the app can be installed and runs offline.
 *
 * Run: node test/pwa.test.mjs   (after node build.mjs)
 */
import { readFileSync, existsSync } from 'fs';

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };
const at = p => new URL('../' + p, import.meta.url);
const read = p => readFileSync(at(p), 'utf8');

// PNG width/height live at fixed offsets in the IHDR chunk
const pngSize = p => { const b = readFileSync(at(p)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

// ---- manifest ----
const m = JSON.parse(read('pwa/manifest.webmanifest'));
check('the manifest names the app', m.name === 'Unfixable Vellum' && !!m.short_name);
check('it opens as a standalone app', m.display === 'standalone');
check('start_url and scope are relative, so any host works', m.start_url === './' && m.scope === './');
check('it has 192 and 512 icons', ['192x192', '512x512'].every(sz => m.icons.some(i => i.sizes === sz && i.purpose === 'any')));
check('it has a maskable icon for launchers that crop', m.icons.some(i => i.purpose === 'maskable'));
for(const i of m.icons){
  check(`${i.src} exists`, existsSync(at(i.src)));
  const [w, h] = pngSize(i.src);
  check(`${i.src} really is ${i.sizes}`, `${w}x${h}` === i.sizes);
}

// ---- the page links it all ----
const html = read('index.html');
check('the page links the manifest', /<link rel="manifest" href="manifest\.webmanifest">/.test(html));
check('the page sets a theme colour', /<meta name="theme-color"/.test(html));
check('the page has an apple touch icon', /rel="apple-touch-icon"/.test(html) && existsSync(at('icons/apple-touch-icon.png')));
check('the favicon is the Vellum sigil, not the old butterfly',
  /<link rel="icon" type="image\/svg\+xml" href="data:image\/svg\+xml;base64,/.test(html) &&
  Buffer.from(html.match(/<link rel="icon"[^>]*base64,([^"]+)"/)[1], 'base64').toString().includes('#E0526F'));
check('the title is current', /<title>Unfixable Vellum<\/title>/.test(html));

// ---- registration ----
const pwa = read('pwa.js');
check('the worker registers only on https or localhost',
  /location\.protocol === 'https:'/.test(pwa) && /localhost/.test(pwa));
check('a failed registration never breaks the app', /\.catch\(/.test(pwa));
check('the app registers at boot', /registerServiceWorker\(\);/.test(read('appEvents.js')));
check('the title bar follows the chosen theme', /setThemeColor\(THEME_CHROME\[theme\]\)/.test(read('theme.js')));

// ---- the built folder ----
check('the build emits the worker beside the page', existsSync(at('dist/sw.js')));
check('the build emits the manifest', existsSync(at('dist/manifest.webmanifest')));
const sw = read('dist/sw.js');
check('the worker cache is versioned by the build', /const VERSION = '[0-9a-f]{12}'/.test(sw) && !sw.includes('__BUILD_VERSION__'));
check('old caches are cleared on update', /caches\.delete/.test(sw));
check('the page loads from the network first, so updates arrive', /req\.mode === 'navigate'[\s\S]*?fetch\(req\)/.test(sw));
const shell = [...sw.matchAll(/'\.\/([^']+)'/g)].map(x => x[1]).filter(Boolean);
check('every file the worker precaches is in the build', shell.every(f => existsSync(at('dist/' + f))));

// ---- icon hygiene ----
const icons = read('tools/icons.py');
check('icons are generated, not hand-pasted', /def build\(root\)/.test(icons));
check('glyph jitter uses a stable seed', /zlib\.crc32/.test(icons) && !/seed=hash\(/.test(icons));
check('arc flags are never jittered', /if cmd in 'Aa':/.test(icons));

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
