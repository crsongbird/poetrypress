/**
 * invariants.test.mjs — the rules in AGENTS.md §7 (Invariants) and §10
 * (Pitfalls) that only the source can show, one check per rule, each naming
 * the section it guards. Behavior is tested by the suite for its concern;
 * this file holds the scans: things that must never appear, or must always.
 * A check here earns its place by guarding a mistake we really made.
 *
 * Run: node test/invariants.test.mjs
 */
import { readFileSync, readdirSync } from 'fs';
const { pruneStrip } = await import('../tools/prune.mjs');

let failures = 0;
const check = (l, c, bad) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l + (bad && bad.length ? ': ' + bad.slice(0, 5).join(', ') : ''))); };
const raw = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const src = f => pruneStrip(raw(f));                 // comments out: a rule quoted in a comment is not a use
const MODULES = readdirSync(new URL('..', import.meta.url)).filter(f => /^\w+\.js$/.test(f));
// the modules that make surfaces (in the worker, and the parts' canvas passes)
const SURFACE = MODULES.filter(f => /^(tex|steps|cartomancy|athanor\.js|textureGenerators|chains)/.test(f) && f !== 'textureService.js' && f !== 'textureWorker.js');
const cr = src('canvasRenderer.js'), ev = src('appEvents.js');

// ---- §7 PML is a contract: what a directive sets must reach the page ----
{
  const tp = raw('textParsers.js'), crRaw = raw('canvasRenderer.js');
  // buildLines copies each part into a fresh object field by field; a field a directive sets but the copy
  // omits is parsed and then silently dropped (§8 Add PML: the line-rebuild copy list)
  const setFields = [...new Set([...tp.matchAll(/part\.(custom\w+)\s*=/g)].map(m => m[1]))];
  const copyLine = (tp.match(/return \{ justify:p\.justify,[^}]*\}/) || [''])[0];
  const dropped = setFields.filter(f => !copyLine.includes(f + ':p.' + f));
  check('§7 every field a directive sets is carried through the line rebuild (one left out is parsed, then dropped)', setFields.length > 10 && !dropped.length, dropped);
  // resolvePartStyle returns early for a segment with "nothing of its own"; a field missing from that guard is
  // silently ignored (that hid /fx: and /under:). Fields that position the part (or its line, or pick its face)
  // are read directly, not through its style.
  const fields = [...new Set([...tp.matchAll(/part\.(custom\w+|under)\s*=/g)].map(m => m[1]))].filter(f => !['customSize', 'customFontIdx', 'customBasis', 'customRotate', 'customGap', 'customFontName'].includes(f));
  const guard = (crRaw.match(/if\(!part\.customColor[^\n]*return baseStyle;/) || [''])[0];
  const missing = fields.filter(f => !guard.includes(f));
  check('§7 every styling field a segment can set is in resolvePartStyle\'s guard (one left out is silently ignored)', guard.length > 0 && !missing.length, missing);
}

// ---- §7 Texture options by name ----
{
  const positional = [];
  for(const f of MODULES) for(const m of src(f).matchAll(/getTextureCanvas\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g)){
    if(/^type, w, h, opts/.test(m[1]) || /,\s*(\w+\.)*opts\s*$/.test(m[1])) continue;   // the definition; handing an options object on
    if(m[1].split(',').length > 3 && !/\{/.test(m[1])) positional.push(f);
  }
  check('§7 no call passes texture options by position (a tint once landed in the light slot)', !positional.length, positional);
}

// ---- §7 Canonical pixels ----
{
  const area = SURFACE.filter(f => /Math\.round\(\(w\*h\)\/\d+/.test(src(f)));
  check('§7 no surface counts by raw pixel area (a small canvas drew fewer marks): canonArea', !area.length, area);
  // a floor in canonical pixels is cpx(n); a floor of one GRID pixel on a part's working grid (E.px…) is fine:
  // the grid is the export's at every size. Motifs drawn in their own units (lineWidth = 0.28) are not pixels.
  const floors = [];
  for(const f of SURFACE) for(const m of src(f).matchAll(/lineWidth ?= ?Math\.max\((\d*\.?\d+), ([^;]*)|lineWidth ?= ?([1-9]\d*(?:\.\d+)?);/g))
    if(!(m[2] && /\bE\.px\(/.test(m[2]))) floors.push(f + ': ' + m[0].slice(0, 60));
  check('§7 no surface line has a fixed-pixel floor: cpx', !floors.length, floors);
  check('§7 the renderer has no fixed-pixel floors either: rpx', !/Math\.max\((0\.\d+|1|1\.5), (unit|size|baseSize|bThick)/.test(cr));
}

// ---- §10 The canvas: CPU canvases ----
{
  const bare = [...SURFACE, 'canvasRenderer.js'].filter(f => /\.getContext\(\s*['"]2d['"]\s*\)/.test(src(f)));
  check('§10 every surface canvas and every layer of the page is a CPU canvas (willReadFrequently): pixel reads on GPU canvases crashed Chrome on phones', !bare.length, bare);
  check('§10 the page canvas itself is a CPU canvas', /canvas\.getContext\('2d', \{ willReadFrequently: true \}\)/.test(ev));
  check('§10 the shared CPU option is what the surfaces use', /export const CPU = \{ willReadFrequently: true \};/.test(raw('texCore.js')));
}

// ---- §10 Never close a cached ImageBitmap ----
check('§10 no cache or service closes a bitmap (the service may still be showing it)',
  !/\.close\(\)/.test(src('textureGenerators.js') + src('textureService.js')));

// ---- §10 Every 2D context prototype gets the inline-glyph hook ----
check('§10 inline glyphs are hooked on OffscreenCanvas too (the back buffer drew every glyph as a box without it)',
  /installInlineGlyphs\(OffscreenCanvasRenderingContext2D\.prototype\)/.test(src('glyphs.js')) && /installInlineGlyphs\(OffscreenCanvasRenderingContext2D\.prototype\)/.test(cr));

// ---- §10 Text effects never blur with ctx.filter ----
check('§10 text effects blur as shadows of off-page letters (softText), never ctx.filter (~100× slower, per letter when tracked)',
  /function softText\(ctx, str, x, y, r, colour\)\{/.test(cr) && !/ctx\.filter\s*=\s*[`'"]blur/.test(cr + src('effects.js')));

// ---- §5.1 Rendering: whole frames only ----
check('§5.1 frames are drawn into a back buffer and reach the page only when whole',
  /function renderInto\(canvas\)/.test(cr) && /renderInto\(BACK\);[\s\S]{0,200}v\.drawImage\(BACK, 0, 0\);/.test(cr));
check('§5.1 every frame starts from a clean context (a frame aborted mid-blend left two pages showing)',
  /if\(typeof ctx\.reset === 'function'\) ctx\.reset\(\);/.test(cr));
{
  const body = cr.slice(cr.indexOf('function renderInto(canvas)'), cr.indexOf('\n}\n', cr.indexOf('function renderInto(canvas)')));
  check('§5.1 nothing inside renderInto draws to #poemCanvas', !/poemCanvas/.test(body));
}

// ---- §10 The bundle ----
{ const built = raw('dist/index.html'), at = built.indexOf('id="vellum-texture-worker"');
  check('§10 the worker\'s script block goes in <head>: it must exist before the page first asks for a texture',
    at > 0 && at < built.indexOf('</head>\n<body')); }
check('§10 the texture service starts no timers of its own (nothing to keep Node, or a phone, awake)', !/setInterval\(/.test(src('textureService.js')));

// ---- §7 Phones: --vvh, never bare vh ----
{
  // phone rules only: a phone's toolbar and keyboard change its viewport, which plain vh never follows
  // (var(--vvh, 100vh) is a fallback, and dvh is the browser's own measure: both fine)
  const css = raw('poetrypress.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const bareVh = [];
  for(const m of css.matchAll(/([^{}]*is-mobile[^{}]*)\{([^{}]*)\}/g))
    for(const d of m[2].split(';')) if(/(?<![-\w])\d+(\.\d+)?vh\b/.test(d.replace(/var\(--vvh[^)]*\)/g, ''))) bareVh.push(m[1].trim() + ' ' + d.trim());
  check('§7 phone rules size by --vvh or dvh, never bare vh (a phone\'s toolbar changes the viewport)', !bareVh.length, bareVh);
}

// ---- §7 Phones: the editor mirror matches the textarea's metrics ----
{
  // the highlight is a mirror drawn under a transparent textarea: a .pml-* class that changes a glyph's advance
  // (its weight, spacing, size, face, or a box's edges) slides the colours off the real text and misplaces the
  // caret. A weight is allowed only where a later rule forces it back (font-weight:400 !important). The help
  // panel's classes, which the page's markup uses, are not the mirror's.
  const css = raw('poetrypress.css').replace(/\/\*[\s\S]*?\*\//g, ''), page = raw('index.html');
  const inPage = c => new RegExp('class="[^"]*\\b' + c + '\\b').test(page);
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => [m[1].trim().split(/\s*,\s*/).map(x => x.slice(1)), m[2]])
    .filter(([cls]) => cls.every(c => /^pml-[\w-]+$/.test(c) && !inPage(c)));
  const moves = [], weighted = new Set(), forced = new Set();
  for(const [cls, body] of rules) for(const d of body.split(';')){
    const [p, v = ''] = d.split(':').map(x => x.trim());
    if(/^(padding|margin|border(?!-radius)|letter-spacing|word-spacing|width|font-size|font-family|font-style|font-stretch|line-height)/.test(p)) moves.push(cls.join(',') + ' ' + p);
    if(p === 'font-weight') for(const c of cls) (/^400\s*!important$/.test(v) ? forced : weighted).add(c);
  }
  const named = new Set(rules.flatMap(([cls]) => cls));
  for(const c of weighted) if(!forced.has(c)) moves.push(c + ' font-weight');
  check('§7 highlighting never moves text: no .pml-* rule of the mirror changes a glyph\'s advance or box (' + named.size + ' classes)',
    ['pml-match', 'pml-var', 'pml-varp', 'pml-sq', 'pml-op', 'pml-line'].every(c => named.has(c)) && !moves.length, moves);
}

// ---- §10 Drawflow's [df-…] lookups are escaped ----
{
  // a wire's range is kept as '~key' in a node's data, and Drawflow looks data up as [df-KEY]: unescaped, that
  // threw mid-load and a graph carrying a range opened half-built
  const { TEXTURE_CHAINS } = await import('../chains.js'), fs = src('forge.js');
  const ranged = Object.values(TEXTURE_CHAINS).filter(c => c.nodes.some(([, d]) => Object.keys(d).some(k => k[0] === '~'))).length;
  check('§10 graphs with a wire\'s range ("~key") load whole: Drawflow\'s [df-…] selectors are escaped (' + ranged + ' chains carry ranges)',
    ranged > 5 && /Element\.prototype\.querySelectorAll = safe/.test(fs) && /CSS\.escape\(m\[1\]\)/.test(fs));
}

// ---- §6.5 Libraries load from a CDN at an exact version ----
{
  const urls = [...MODULES.map(raw), raw('index.html')].join('\n').match(/https:\/\/(cdn\.jsdelivr\.net|unpkg\.com)\/[^"'`\s)]+/g) || [];
  const loose = urls.filter(u => !/@v?\d+\.\d+\.\d+\//.test(u));
  check('§6.5 every library from a CDN names an exact version (Coloris, Panzoom, Drawflow)', urls.length >= 3 && !loose.length, loose);
}

// ---- §7 Text: no HTML entities in strings.js ----
check('§7 strings.js has no HTML entities (text nodes do not decode them)', !/&(amp|lt|gt|nbsp|quot|#\d+);/.test(src('strings.js')));

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
