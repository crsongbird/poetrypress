/**
 * interface.test.mjs — the interface's structure (Ruby's long list, pass 2):
 * every slider lockable, master locks and eyes in the headings, folds, the
 * Interface section, the dial's typed numbers, Random Surface, a New Backdrop
 * that changes only the backdrop, the gradient shapes, the texture menu's
 * groups, the "what's working" line, tiles that never make textures on the
 * page, and the one refresh that puts every view right.
 */
import { readFileSync } from 'fs';
let failures = 0;
const check = (name, ok) => { console.log((ok ? 'ok: ' : 'FAIL: ') + name); if(!ok) failures++; };
const src = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const ev = src('appEvents.js'), html = src('index.html'), css = src('poetrypress.css'), svc = src('textureService.js'), sw = src('swatches.js'), cr = src('canvasRenderer.js');

check('every slider and menu in the making tabs can lock (found in the markup, so a new one is lockable the day it is added)',
  /for\(const el of document\.querySelectorAll\('\.card\[data-tab="write"\] input\[type=range\]\[id\]/.test(ev) && /if\(!LOCKABLE\.includes\(el\.id\) && !NOT_LOCKABLE\.has\(el\.id\)\) LOCKABLE\.push\(el\.id\)/.test(ev));
check('each section heading has a MASTER LOCK: it locks everything beneath, or unlocks it all; half-closed when only some are',
  /function addMasterLock\(root, head\)\{/.test(ev) && /for\(const id of ids\) all \? state\.locks\.delete\(id\) : state\.locks\.add\(id\);/.test(ev)
  && /\.master-lock\.partial/.test(css) && /e\.preventDefault\(\); e\.stopPropagation\(\);\s+\/\/ never folds the section/.test(ev));
check('the switches that showed a section are EYES; a card\'s own eye sits in its heading (and never folds it)',
  /const CARD_EYES = \{ textureToggle:/.test(ev) && /headTools\(head\)\.appendChild\(box\);/.test(ev) && /input\[type="checkbox"\]\.eye/.test(css)
  && /if\(card\.open !== was\) card\.open = was;/.test(ev));
check('the tools sit at the heading\'s far end, spaced apart from each other and from the fold', /\.head-tools\{ float:right; display:inline-flex; align-items:center; gap:16px; margin-left:18px;/.test(css));
check('more folds: Form & Bearing, Built-In Presets, Custom Presets and Interface fold like the rest',
  /<details class="card" data-tab="style" open>\s*<summary class="card-title"[^>]*>\s*Form &amp; Bearing/.test(html)
  && /<details class="card" data-tab="style" open>\s*<summary class="card-title"[^>]*>\s*Built-In Presets/.test(html)
  && /<details class="card" data-tab="style" id="customPresetsCard" open>\s*<summary class="card-title" data-str="card\.custom_presets">Custom Presets/.test(html)
  && /<details class="card" data-tab="more">\s*<summary class="card-title" data-str="card\.appearance">Interface<\/summary>/.test(html) && /'card\.appearance':\s+"Interface"/.test(src('strings.js')));
check('sound is a switch and a volume on one line, with nothing to read', /<div class="sound-row">\s*<input type="checkbox" id="soundToggle" class="switch">/.test(html) && !/hint\.sounds/.test(html));
check('the dial\'s numbers show beneath it and can be typed (views of the saved values)',
  html.includes('id="lightDegIn"') && html.includes('id="lightTiltIn"') && /if\(di && ae !== di\) di\.value = String\(Math\.round\(deg\)\);/.test(ev));
check('RANDOM SURFACE: a texture from the menu, one of its readings, a new seed — locks kept, asked first after many edits',
  html.includes('id="randomSurfaceBtn"') && /applyElement\(els\[Math\.floor\(Math\.random\(\)\*4\)\]\)/.test(ev) && /randomSurfaceBtn: \['Summon a new surface'/.test(ev));
{
  const bd = (ev.match(/\$\('randomBgBtn'\)\.addEventListener\('click', \(\)=>\{[\s\S]*?\n\}\);/) || [''])[0];
  check('NEW BACKDROP changes only the backdrop: its colours (each stop in use) and its angle — never the texture, the border or the seed',
    bd.includes('backdropColours(n)') && !/textureType|borderToggle|maybeRerollSeed|textureToggle/.test(bd));
}
check('gradients: Sweep (conic) and Mirrored for the backdrop and the box, and four shapes for the text',
  /spec\.type === 'conic'/.test(cr) && /spec\.type === 'mirror'/.test(cr) && html.includes('<option value="conic" data-str="option.sweep">Sweep</option>')
  && html.includes('id="textGradientType"') && /\['textGradientType',\s+'textGradientType',\s+'text'\]/.test(ev) && /textGradientType:'linear'/.test(ev));
{
  const groups = [...html.matchAll(/<optgroup label="([^"]+)"/g)].map(m => m[1]);
  const O = await import('../appOptions.js');
  const textureGroups = groups.filter(g => O.TEXTURE_GROUPS.some(t => g === t.glyph + ' ' + t.name.replace(/&/g, '&amp;')));
  const sel = (html.match(/<select id="textureType">([\s\S]*?)<\/select>/) || ['', ''])[1];
  const sizes = [...sel.matchAll(/<optgroup[^>]*>([\s\S]*?)<\/optgroup>/g)].map(m => (m[1].match(/<option/g) || []).length);
  check('the texture menu goes by what a surface IS (appOptions TEXTURE_GROUPS, the same in the Athanor), at least three in each (but Yours), each glyph a Runology Archetype (no emoji); the Basics are the Athanor\'s alone (hidden in the menu, so old looks open)',
    textureGroups.length === O.TEXTURE_GROUPS.length && sizes.slice(0, -1).every(n => n >= 3) && O.TEXTURE_GROUPS.slice(0, -1).every((g, i) => g.types.length === sizes[i])
    && !O.TEXTURE_GROUPS.some(g => g.name === 'Basics') && O.ATHANOR_BASICS.types.every(t => new RegExp('<option value="' + t + '"[^>]*hidden>').test(html))
    && O.TEXTURE_GROUPS.every(g => ['🜃','🜚','🜁','🝊','🜥','🜄','Ᏹ','🝓','🝆','⎐','🜉'].includes(g.glyph)));
  const alpha = [...sel.matchAll(/<optgroup[^>]*>([\s\S]*?)<\/optgroup>/g)].every(m => { const names = [...m[1].matchAll(/>([^<]+)<\/option>/g)].map(x => x[1].toLowerCase().replace(/'/g, ''));
    return names.every((n, i) => i === 0 || names[i - 1] <= n); });
  check('…each group alphabetical', alpha);
  check('kept surfaces appear in Yours by name, and choosing one opens its graph', /function paintShelfOptions\(\)\{/.test(ev) && /String\(t\.value\)\.startsWith\('kept:'\)/.test(ev));
}
check('WHAT\'S WORKING: the worker says what it makes; a quiet line names it (after a moment, staying a moment), the shimmer moving on the compositor',
  /new CustomEvent\('vellum-working'/.test(svc) && /const WORKING_WORDS = \{/.test(ev) && /bokeh: 'Convolving the bokeh'/.test(ev)
  && /\.work-bar i\{[^}]*animation:texShimmer/.test(css) && /@keyframes texShimmer\{ from\{ transform:translateX/.test(css) && html.includes('id="workingLine"'));
check('a texture made on the page waits for the page to paint its working line first (and Save image still waits for it)',
  /const pagePending = new Map\(\);/.test(svc) && /requestAnimationFrame\(\(\) => requestAnimationFrame\(\(\) => setTimeout/.test(svc) && /pagePending\.size === 0\) \? Promise\.resolve\(\)/.test(svc));
check('tiles (presets, the history filmstrip) never make a texture on the page: cache or worker, then painted again',
  /export function setSwatchTextureSource\(fn\)/.test(sw) && /setSwatchTextureSource\(\(type, w, h, opts\) => \{/.test(ev) && /onTextureReady\(\(\) => swatchTexturesArrived\(\)\);/.test(ev));
check('ONE REFRESH puts every view right (sections, readouts, moons, dial, readings, locks, seed words) — after a load, undo, a preset, any randomiser',
  /function refreshUi\(\)\{/.test(ev) && /for\(const \[box, block\] of SUBBLOCKS\)/.test(ev) && /refreshUi\(\); scheduleRender\(\); paintHistoryButtons\(\);/.test(ev)
  && /try \{ return withLocksPreservedInner\(fn\); \} finally \{ if\(typeof refreshUi === 'function'\) refreshUi\(\); \}/.test(ev));

{
  // ---- Kale → Ruby's round of the specimen: the type, Rosé, the top bar, the dial's rim, American English ----
  const css = src('poetrypress.css');
  check('THE TYPE is Alegreya (reading), Alegreya SC (headings, as true small caps), Alegreya Sans (labels): loaded from Google Fonts, light weights, the title no longer bold',
    /family=Alegreya:ital,wght@0,400\.\.900/.test(html) && /family=Alegreya\+SC/.test(html) && /family=Alegreya\+Sans/.test(html)
    && /--ui-text:'Alegreya'/.test(css) && /--ui-caps:'Alegreya SC'/.test(css) && /--ui-sans:'Alegreya Sans'/.test(css)
    && /\.card-title, summary\.card-title\{ font-family:var\(--ui-caps\); font-weight:500; text-transform:lowercase;/.test(css) && !/\.app-header-title\{[^}]*font-weight:700/.test(css));
  check('ROSÉ keeps its plum-charcoal grounds (Ruby, after trying neutral): pink and pale blue on them',
    /:root\[data-theme="rose"\]\{[\s\S]*?--bg-deep:#0b0a0d;[\s\S]*?--bg-panel:#131116;/.test(css) && /--accent-2:#a3c6e3/.test(css));
  check('THE TOP BAR: 🜉 The Athanor (glyph large, name small) opens the node editor; a quiet Support button whose heart breathes now and then (still under reduced motion)',
    html.includes('id="athanorTopBtn"') && html.includes('<span class="at-glyph" aria-hidden="true">🜉</span><span class="at-label">The Athanor</span>')
    && /\$\('athanorTopBtn'\)\.addEventListener\('click', \(\) => openForge\(forgeDeps\(\)\)\)/.test(ev)
    && html.includes('class="support-btn"') && /@keyframes support-breathe/.test(css) && /prefers-reduced-motion: reduce\)\{ \.support-heart\{ animation:none; \}/.test(css));
  check('THE DIAL\'S RIM HOLDS: the light snaps to 100% near the rim and must be pulled well past it; beyond, it moves at under half speed',
    /let tilt = raw < 93 \? raw : raw < 118 \? 100 : Math\.min\(dialMax\(\), 100 \+ \(raw - 118\) \* 0\.45\);/.test(ev));
  const visible = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/ (id|class|for|data-[a-z-]+|value|href|src)="[^"]*"/g, '');
  check('AMERICAN ENGLISH where people read it (color, gray, center): the page, the strings, the Athanor\'s words',
    !/\b(colour|Colour|colours|coloured|grey|centre)\b/.test(visible.replace(/Alegreya/g, '')) && !/"[^"]*\b(Colour|colour)\b[^"]*"/.test(src('strings.js'))
    && /'Light & Color'/.test(src('steps.js')) && /export const forgeWord = /.test(src('forge.js')));
}
{
  // ---- pass 2: the desk ----
  const css = src('poetrypress.css');
  check('A WINDOW 2:3 OR TALLER gets the phone layout, by its shape and never a fixed width, live as it is resized (a phone always); the desktop\'s panes work at any width, and the phone\'s rules only ever apply to the phone layout',
    /function wantPhoneLayout\(\)\{\n  if\(detectMobile\(\)\) return true;[\s\S]*?return window\.innerWidth\/window\.innerHeight <= PHONE_RATIO/.test(ev) && /const PHONE_RATIO = 2\/3;/.test(ev)
    && !/@media \(min-width: 900px\)\{\s*body:not\(\.is-mobile\) \.app\{/.test(css) && !/@media \(max-width: 860px\)/.test(css) && /body\.is-mobile \.controls \{ width: 100%/.test(css)
    && /function applyLayout\(\)/.test(ev) && /new CustomEvent\('vellum-layout'/.test(ev));
  check('ESOTERICA on a desk: a click outside its drawer closes it; its button reads Return while open (two faces in one cell, so it never changes size); the editor\'s focus mode (and its Return) only on a phone',
    /if\(current !== 'more' \|\| !desktopNow\(\)/.test(ev) && html.includes('<span class="tab-face ret" aria-hidden="true">')
    && /body\.more-open:not\(\.is-mobile\) \.tab-face\.ret, body\.focus-mode \.tab-face\.ret\{ visibility:visible; \}/.test(css)
    && /\|\| !body\.classList\.contains\('is-mobile'\)\) return;/.test(ev));
  check('THE EDITOR on a desk is at least half the tab\'s height', /body:not\(\.is-mobile\) \.card\[data-tab="write"\] \.editor-input\{ min-height:calc\(\(var\(--vvh, 100vh\) - 110px\) \* 0\.5\); \}/.test(css));
  check('A LOOK STAYS LIT until a meaningful change (anything but the seed and the name); every click a NEW SEED; a click on the lit look rerolls and now and then takes another reading',
    /function meaningfulSig\(\)\{ try \{ const o = JSON\.parse\(lookSnapshot\(\)\); delete o\.textureSeedValue; delete o\.lookName;/.test(ev)
    && /if\(again\)\{ maybeRerollSeed\(\); if\(Math\.random\(\) < 0\.45\) swapReading\(\);/.test(ev) && /maybeRerollSeed\(\);                 \/\/ every application a new seed/.test(ev)
    && /\.preset-btn\.lit\{/.test(css) && /checkLitPreset\(\);\n\}/.test(ev));
  check('THE PREVIEW zooms only with Ctrl or ⌘ held (or a pinch), and fits again when the window changes shape',
    /if\(!\(e\.ctrlKey \|\| e\.metaKey\)\) return; pz\.zoomWithWheel\(e\);/.test(ev) && /if\(pz\.getScale\(\) > 1\.01\)\{ pz\.reset\(\{ animate: false \}\); zoomSettled\(\); \}/.test(ev));
}
{
  // ---- pass 3: the Athanor ----
  const S = await import('../steps.js'), F = src('forge.js'), A = await import('../athanor.js'), CH = await import('../chains.js');
  check('EVERY PART SAYS WHAT IT DOES (a plain sentence: the parts list, its menu, the Help\'s glossary); the parts list has a search and each category says what it holds; no Output in it (the Surface is always there)',
    Object.values(S.STEPS).every(st => (st.doc || '').length > 25) && /class="forge-find" id="forgeFind"/.test(F) && /<span class="fpart-doc">/.test(F)
    && /FORGE_CATEGORIES\.filter\(cat => cat !== 'Output'\)/.test(F) && /hint: N\.doc \|\| forgeCatName\(N\.cat\)/.test(F));
  check('THE SURFACE STAYS: it cannot be removed or copied; Clear leaves a fresh one; a graph from anywhere without one gets one',
    /if\(isSurface\(id\)\)\{ if\(deps\.warn\)/.test(F) && /label: 'The Surface stays'/.test(F) && /ed\.clear\(\); add\('surface', 420, 90\);/.test(F)
    && /if\(!Object\.values\(rawNodes\(\)\)\.some\(n => n\.name === 'surface'\)\) add\('surface', 900, 120\);/.test(F));
  check('A HELP DOCUMENT (from the bar\'s Help and the dock\'s ?): twelve sections — what it is, reading a graph, wires, conversions, settings, the page\'s controls, seeds and chance, the Surface, mouse and phone, keeping, limits, every part — over the grid, never the parts list',
    (A.ATHANOR_LIMITS && /export function forgeHelpHtml\(\)/.test(F)) && html.includes('id="forgeDocBtn"') && html.includes('<article class="forge-doc" id="forgeDoc" hidden')
    && (F.match(/\+ sec\('/g) || []).length === 12 && /@media \(min-width: 900px\)\{ \.forge-doc\{ left:calc\(236px \+ 12px\)/.test(src('poetrypress.css')) && !html.includes('forge-help-pop'));
  check('MORE PARTS: Number and Random Number (anything can be random now); Map Range; Shape Mask; Split and Merge Channels; Switch; Hue & Saturation — and a Combine & Mask category (Mix, Blend, Math, Split, Merge, Switch)',
    ['number', 'random', 'maprange', 'shape', 'split', 'merge', 'switch', 'hsv'].every(k => S.STEPS[k] && typeof S.STEPS[k].run === 'function')
    && Object.values(S.STEPS).filter(st => st.cat === 'Combine').length === 6 && S.STEP_CATEGORIES.filter(c => c !== 'Output').every(c => Object.values(S.STEPS).filter(st => st.cat === c).length >= 3));
  check('A NEW SEED from inside the Athanor (⟳ Seed): every part\'s chance comes from the page\'s seed', html.includes('id="forgeSeedBtn"') && /reseed: \(\) => \{ const f = \$\('textureSeedValue'\)/.test(ev));
  check('TEACHING NOTES that teach (a teacher, not a riddle): each says what the graph makes, how, and what to try',
    [...Object.values(A.ATHANOR_STARTERS), ...Object.values(CH.TEXTURE_CHAINS)].every(t => /^This (graph makes|is) /.test(t.teach) && /Try: /.test(t.teach)));
  check('THE README explains the whole app plainly: the three engines, each tab, the Athanor, saving',
    /## How PoetryPress works/.test(src('README.md')) && /\*\*a node editor, the Athanor\*\*/.test(src('README.md')) && /### 7\. Saving/.test(src('README.md')));
}
// ---- Ruby's 23:22 pass ----
{
  const rend = src('canvasRenderer.js'), css = src('poetrypress.css'), H = await import('../canvasRenderer.js');
  // `inline code` froze the preview: its backdrop read hexToHsl's { h, s, l } as an array and every frame threw
  const hsl = H.hexToHsl('#9B7FE8');
  check('INLINE CODE: the backdrop reads hexToHsl as { h, s, l } (an array read threw, and every frame with `code` failed)',
    /const \{ h: hue \} = hexToHsl\(/.test(rend) && !/const \[[^\]]*\] = hexToHsl\(/.test(rend)
    && typeof hsl === 'object' && isFinite(hsl.h) && /^#[0-9a-f]{6}$/i.test(H.hslToHex(hsl.h, 32, 88)));
  check('THE PREVIEW PANE (desktop): the viewer is the whole pane, the picture fits inside it, the buttons in a strip along its foot',
    /body:not\(\.is-mobile\) \.canvas-wrap\{ flex:1 1 0; min-height:0; width:100%;/.test(css) && /body:not\(\.is-mobile\) \.canvas-wrap::after\{/.test(css)
    && /body:not\(\.is-mobile\) #poemCanvas\{ max-height:100%; max-width:100%; \}/.test(css));
  check('the page opens at 9:16', /<div class="radio-btn active" data-val="9:16">/.test(src('index.html')) && /<canvas id="poemCanvas" width="2304" height="4096">/.test(src('index.html'))
    && /aspect: '9:16'/.test(src('appEvents.js')));
  check('release archives: the build removes the old ones before writing the new', /if\(f\.endsWith\('\.zip'\)\)\{ \(await import\('fs'\)\)\.unlinkSync\('release\/' \+ f\)/.test(src('build.mjs')));
}
check('THE DICE: a die beside every section\'s lock rolls only that section (the Summon buttons where a section has one; locked controls stay); Shift-click on the Surface\'s die rolls only the seed',
  /function rollSection\(root, level = 'usual'\)\{/.test(src('appEvents.js')) && /addDie\(card, card\.querySelector\(':scope > summary'\)\); addMasterLock\(card/.test(src('appEvents.js'))
  && /if\(surface && \(e\.shiftKey \|\| wasHeld\)\)/.test(src('appEvents.js')) && /withLocksPreserved\(\(\) => \{\n    const ids = lockablesIn\(root\)/.test(src('appEvents.js')) && /\.die-btn\{/.test(src('poetrypress.css')));
{ const ev = src('appEvents.js'), css = src('poetrypress.css'), st = src('strings.js');
  check('THE DIE\'S LEVELS (Ruby): gently (±8%, menus and switches stay, colors turn together), as usual, wildly (whole range, switches too)',
    /const DIE_GENTLE = 0\.08;/.test(ev) && /if\(level !== 'gentle'\) for\(const id of menus\)/.test(ev) && /hslHex\(\(\(h \+ turn\) % 360/.test(ev) && /level === 'wild' && !\(el\.classList && el\.classList\.contains\('eye'\)\)/.test(ev));
  check('the levels live in a long press on a phone and in ▾ beside the die on a desk (Ruby)',
    /if\(phone\(\)\) openDieMenu\(root, btn, surface\)/.test(ev) && /more\.className = 'die-more'/.test(ev) && /body\.is-mobile \.die-more\{ display:none; \}/.test(css) && /body\.is-mobile \.die-menu\{/.test(css));
  check('BACK puts back only what the section\'s last roll changed, and waits for a Summon that asks first',
    /if\(!same\(r\.before\[k\], r\.after\[k\]\)\) now\[k\] = r\.before\[k\];/.test(ev) && /own\.addEventListener\('click', rec, \{ once: true \}\)/.test(ev));
  check('the die\'s words live in strings.js', /export const DIE = \{/.test(st) && ['gentle', 'usual', 'wild', 'back', 'seed'].every(k => new RegExp('\\n  ' + k + ': ').test(st)) && !/'Gently'/.test(ev)); }
check('a loaded look never changes the page\'s aspect ratio (Ruby: it stays as chosen until another is picked)', /const look = \{ \.\.\.c\.look \}; for\(const k of \['aspect', 'customSize', 'customW', 'customH'\]\) delete look\[k\];/.test(ev));
console.log();
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
