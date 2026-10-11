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
check('more folds: Form & Bearing, Known Rituals and Interface fold like the rest',
  /<details class="card" data-tab="style" open>\s*<summary class="card-title"[^>]*>\s*Form &amp; Bearing/.test(html)
  && /<details class="card" data-tab="style" open>\s*<summary class="card-title"[^>]*>\s*Known Rituals/.test(html)
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
  const textureGroups = groups.filter(g => /Grounds|Particles|Heavens|Places|Ink|Materials|Pattern|Signs|Yours/.test(g));
  const sel = (html.match(/<select id="textureType">([\s\S]*?)<\/select>/) || ['', ''])[1];
  const sizes = [...sel.matchAll(/<optgroup[^>]*>([\s\S]*?)<\/optgroup>/g)].map(m => (m[1].match(/<option/g) || []).length);
  check('the texture menu goes by how a surface is made and what it is for: nine groups, at least three in each (but Yours)',
    textureGroups.length === 9 && sizes.slice(0, 8).every(n => n >= 3));
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

console.log();
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
