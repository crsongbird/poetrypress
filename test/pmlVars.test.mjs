/**
 * pmlVars.test.mjs — §Variables, inline glyphs, the opacity moon, and the
 * colour picker's pointer.
 *
 * Run: node test/pmlVars.test.mjs
 */
import { readFileSync } from 'fs';
const { resolvePmlVariables, phaseFromSigned } = await import('../pmlVars.js');
const G = await import('../glyphs.js');

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };
const src = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

const ctx = { surfName: 'Lotus Pond', blendName: 'Hard Light', lightArrow: '↘', seed: 4242,
  params: [{ label: 'Bloom Size', value: '210%' }, { label: 'Bloom Count', value: '15' }], opacity: 95,
  hues: [{ label: 'Light Bloom Hue', hex: '#E0B38D' }], moonTonight: 0.43, moonSeed: 0.2,
  spell: '🜁🜂', font: 'Cormorant', canvas: '3072×3072', typeEffect: 'none' };
const R = t => resolvePmlVariables(t, ctx);

// ---- resolution ----
check('names resolve', R('[§SurfName] §SurfBlendMode §LightDir §TextureSeed') === '[Lotus Pond] Hard Light ↘ 4242');
check('§SurfParamsA expands to PML with the knobs and an opacity moon',
  R('§SurfParamsA') === 'Bloom Size: [210%]  Bloom Count: [15]  Opacity: [95%] {' + G.moonChar(95/200) + '}');
check('§SurfParamsB draws each hue in its own colour', R('§SurfParamsB') === 'Light Bloom Hue: <#E0B38D/#:E0B38D>');
check('unknown variables are left visible, not swallowed', R('§Nope!x and §Also') === '§Nope!x and §Also');
check('\\§ writes a literal §', R('\\§SurfName') === '§SurfName');
check('text without § passes through untouched, and fast', R('plain *PML* [here]') === 'plain *PML* [here]');

// ---- the moon scale: -1 new, 0 full, +1 new ----
check('0 is full', phaseFromSigned(0) === 0.5);
check('-1 and +1 are both new', phaseFromSigned(-1) === 0 && phaseFromSigned(1) === 1);
check('negative waxes, positive wanes', phaseFromSigned(-0.5) === 0.25 && phaseFromSigned(0.5) === 0.75);
check('§MoonPhase:0.0 is the full moon', R('§MoonPhase:0.0') === G.moonChar(0.5));
check('§MoonPhase!tonight and !seed read their phases',
  R('§MoonPhase!tonight') === G.moonChar(0.43) && R('§MoonPhase!seed') === G.moonChar(0.2));

// ---- glyphs ----
for(const n of ['input','ritual','thoughtform','materia','esoterica','touch','return','sigil'])
  check(`§Glyph!${n} resolves to a drawn glyph`, R(`§Glyph!${n}`) === G.glyphChar(n) && /[\uE100-\uE107]/.test(R(`§Glyph!${n}`)));
check('element marks resolve as characters', R('§Glyph!whimsy §Glyph!sharpness §Glyph!chaos') === '♡ √ ∆');

// ---- the canvas wrapper: glyphs measure as a glyph's width and draw as shapes ----
globalThis.Path2D = class { constructor(d){ this.d = d; } };
const calls = [];
const proto = {
  font: '20px serif', textAlign: 'left', textBaseline: 'alphabetic', fillStyle: '#fff', strokeStyle: '#fff',
  globalAlpha: 1, shadowBlur: 0, lineWidth: 1,
  measureText(s){ return { width: s.length * 10 }; },
  fillText(s, x, y){ calls.push(['text', s, x]); }, strokeText(s, x, y){ calls.push(['stroke', s, x]); },
  save(){}, restore(){}, translate(){}, scale(){}, beginPath(){}, arc(){}, fill(){ calls.push(['shape']); },
  stroke(){ calls.push(['shape']); },
};
check('the wrapper installs', G.installInlineGlyphs(proto) === true);
const glyph = G.glyphChar('materia');
check('a glyph measures as 1.08em beside the text around it',
  proto.measureText('ab' + glyph + 'cd').width === 20 + 20 * 1.08 + 20);
calls.length = 0;
proto.fillText('ab' + glyph + 'cd', 100, 50);
const texts = calls.filter(c => c[0] === 'text');
check('the text around a glyph is drawn as text, split at the glyph',
  texts.length === 2 && texts[0][1] === 'ab' && texts[1][1] === 'cd');
check('the text after the glyph starts past the glyph', Math.abs(texts[1][2] - (100 + 20 + 20 * 1.08)) < 1e-9);
check('the glyph itself is drawn as shapes', calls.some(c => c[0] === 'shape'));
calls.length = 0;
proto.fillText('no glyphs here', 0, 0);
check('text without glyphs goes straight to the original', calls.length === 1 && calls[0][1] === 'no glyphs here');

// ---- only the poem is resolved ----
const cr = src('canvasRenderer.js');
check('the renderer resolves the poem, before parsing it',
  /const varCtx = pmlVarContext\(W, H\);\s*const rawText = resolvePmlVariables\(\$\('poemText'\)\.value, varCtx\);/.test(cr));
// the poem is resolved twice: once to draw, once with live numbers by their
// shape (the fit's key) — but nothing other than the poem is ever resolved
check('nothing but the poem is resolved', (cr.match(/resolvePmlVariables\(/g) || []).length === 2 &&
  (cr.match(/resolvePmlVariables\(\$\('poemText'\)\.value, /g) || []).length === 2);
check('the glyph modules are bundled before the renderer',
  (b => b.indexOf("'glyphs.js'") < b.indexOf("'canvasRenderer.js'") && b.indexOf("'pmlVars.js'") < b.indexOf("'canvasRenderer.js'"))(src('build.mjs')));

// ---- the opacity moon ----
const ev = src('appEvents.js'), css = src('poetrypress.css');
check('the opacity readout is a waxing moon, not a percentage',
  /out\.innerHTML = moonGlyph\(pct \/ 200/.test(ev) && !/textureOpacityVal'\)\.textContent/.test(ev));
check('the slider itself stays native (styling its thumb broke it into a white box)',
  !/#textureOpacity::-(webkit-slider|moz-range)-thumb/.test(css));

// ---- the picker points at its field ----
check('the field being edited is ringed', /markPicking\(t, true\)/.test(ev) && /\.is-picking\{/.test(css));
check('the picker grows a tail toward the field', /ptr\.dataset\.dir = up \? 'up' : 'down'/.test(ev) && /#clrPointer\[data-dir="up"\]/.test(css));
check('on a phone the field is scrolled into view above the picker first',
  /scroller\.scrollBy\(\{ top: f\.bottom - p\.top \+ 28/.test(ev));
check('closing the picker clears the ring and the tail', /markPicking\(t, false\)/.test(ev) && /ptr\.hidden = true/.test(ev));

// ---- getTextureCanvas takes NAMED options ----
{
  const fs = await import('fs');
  const files = fs.readdirSync(new URL('..', import.meta.url)).filter(f => f.endsWith('.js'));
  const positional = [];
  for(const f of files){
    const code = src(f);
    for(const m of code.matchAll(/getTextureCanvas\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g)){
      if(/^type, w, h, opts/.test(m[1])) continue;                  // the definition
      // handing a whole options object on (the texture service) is the safe form
      if(/,\s*(\w+\.)*opts\s*$/.test(m[1])) continue;
      const parts = m[1].split(',');
      if(parts.length > 3 && !/\{/.test(m[1])) positional.push(f);
    }
  }
  check('no call passes texture options by position (a tint twice landed in the light slot)', positional.length === 0);
  check('the Deep Field stars receive their tint as a tint',
    /requestTexture\('stars', 'astral_stars', W, H, \{[^}]*\btint1\b[^}]*\}\)/.test(cr));
  check('the dead invert path is gone', !/invertTextureCanvas|invert \? '_inv'/.test(src('textureGenerators.js') + src('texCore.js')));
}

// ---- the editor highlights §Variables without moving text ----
{
  const { highlightDocument } = await import('../editor.js');
  const t = '[§SurfName] <§MoonPhase:-0.5/f:12> \\§Plain §Glyph!materia';
  const h = highlightDocument(t);
  const text = h.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\u200b/g, '');
  check('§Variables are highlighted, in and out of segments', (h.match(/pml-var"/g) || []).length === 3);
  check('their !param and :number are highlighted too', (h.match(/pml-varp/g) || []).length === 2);
  check('an escaped \\§ is not a variable', !/pml-var">§Plain/.test(h));
  check('highlighting never changes the text', text === t);
  check('the variable colours cannot move text',
    !/\.pml-varp?\s*\{[^}]*(font-weight|letter-spacing|padding|margin)/.test(css));
}

// ---- `code` segments ----
{
  const P = await import('../textParsers.js');
  const r = resolvePmlVariables('Seed `§TextureSeed **not bold** [x] §Glyph!fire` after', { seed: 4242 });
  const part = P.buildLines(r, true, true)[0].parts.find(p => p.code);
  check('backticks become a code segment', !!part);
  check('inside code, PML prints literally and variables resolve — except glyphs',
    part && part.segments.map(x => x.text).join('') === '4242 **not bold** [x] §Glyph!fire');
  check('an escaped backtick is not code', !/code/.test(resolvePmlVariables('a \\`b\\` c', {})));
  check('poems without code parse with no code key at all (the golden fixture stays exact)',
    !('code' in P.buildLines('<a/#:ff0000> plain', true, true)[0].parts[0]));
  check('code is drawn on a backdrop that reads the page behind it',
    /const px = ctx\.getImageData\(/.test(cr) && /const light = behind < 0\.5;/.test(cr));
  check('code segments are measured in the code face they are drawn in',
    /const partFontDef = part\.code \? CODE_FONT/.test(cr) && /const partFont = p => p\.code \? CODE_FONT/.test(cr));
}

// ---- spell glyphs by name ----
check('every spell glyph can be named: §Glyph!fire §Glyph!salt §Glyph!black-moon-lilith',
  R('§Glyph!fire §Glyph!salt §Glyph!black-moon-lilith') === '🜂 🜔 ⚸');
check('names are case-insensitive', R('§Glyph!FIRE') === '🜂');
check('the poem fonts fall back to the symbol fonts, so spell glyphs draw', /\$\{GLYPH_FONT\}`;/.test(cr));

// ---- performance: a phone must survive every knob at every setting ----
{
  const tg = src('textureGenerators.js'), tu = src('tunables.js');
  check('the texture cache is bounded by memory, not only by count',
    /total > CACHE_BUDGET/.test(tg) && /const CACHE_BUDGET = TEXTURES\.cachePixels \* /.test(tg) && /cachePixels: 3072 \* 3072 \* 3/.test(tu));
  check('Cold Press is watercolour paper: felt tooth as lit heights, fibres and undulation as a NORMAL MAP, and a Press knob (hot · cold · rough)',
    /normals:N \}\);/.test(src('texTouch.js')) && /names:\['Hot Press','Cold Press','Rough'\]/.test(src('textureGenerators.js')));
  check('the Sparkler is a fifth of its old count', /canonArea\(w,h\)\/130000 \* amt/.test(src('texWhimsy.js')));
}

// ---- texture canvases stay off the GPU (Chrome crashed phone GPUs) ----
{
  const mods = ['texCore.js','texWhimsy.js','texSharpness.js','texChaos.js','texTouch.js','textureGenerators.js'];
  const bare = mods.filter(f => /\.getContext\('2d'\)/.test(src(f)));
  check('every texture canvas is created with willReadFrequently (kept in memory, not on the GPU)',
    bare.length === 0 && /export const CPU = \{ willReadFrequently: true \};/.test(src('texCore.js')));
  if(bare.length) console.log('   bare getContext in:', bare.join(', '));
}

// ---- Chrome: texture canvases stay off the GPU ----
{
  const files = ['texCore.js','texWhimsy.js','texSharpness.js','texChaos.js','texTouch.js','textureGenerators.js'];
  const bare = files.filter(f => /\.getContext\('2d'\)/.test(src(f)));
  check('every texture canvas is created with willReadFrequently (pixel reads on a GPU canvas crashed Chrome on phones)',
    bare.length === 0 && /export const CPU = \{ willReadFrequently: true \};/.test(src('texCore.js')));
  if(bare.length) console.log('   bare getContext in:', bare.join(', '));
}

// ---- the lotus ----
{
  const sh = src('texSharpness.js');
  check('light blooms only: no separate dark kind', !/const dark=Math\.random\(\)/.test(sh));
  check('the fade rule is chosen once, from the Petal Hue, so variation cannot flip a bloom dark',
    /const fadeRule = L\(A\)>0\.6/.test(sh));
  check('blooms vary visibly — about 11° of hue — but stay the same flower', /2\*\(11\/360\)/.test(sh));
}

// ---- every preset is readable ----
{
  const { PRESETS } = await import('../appOptions.js');
  const lum = h => { const n = parseInt(h.replace('#','').slice(0,6), 16);
    return [n>>16, (n>>8)&255, n&255].map(v => { v /= 255; return v <= 0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4; })
      .reduce((a, v, i) => a + v*[0.2126, 0.7152, 0.0722][i], 0); };
  const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05)/(y + 0.05); };
  const low = [];
  // With an inset box, the text sits on the BOX blended over the page, not on
  // the page: for a Normal box that is the page mixed toward the box colour by
  // its opacity. (Other box blends fall back to the page, the stricter case.)
  const mixHex = (a, b, t) => { const A = parseInt(a.slice(1,7),16), B = parseInt(b.slice(1,7),16);
    const ch = s => Math.round(((A>>s)&255) + (((B>>s)&255) - ((A>>s)&255))*t);
    return '#' + [16,8,0].map(ch).map(v => v.toString(16).padStart(2,'0')).join(''); };
  for(const p of PRESETS){
    let bgs = [p.bg1, p.bg2, p.bg3, p.bg4].filter(Boolean);
    if(p.cardToggle && (p.cardBlend || 'source-over') === 'source-over'){
      const o = (parseFloat(p.cardOpacity ?? 70) || 0)/100, box = p.cardColor1 || '#FFF6EE';
      bgs = bgs.map(b => mixHex(b, box, o));
    }
    for(const k of ['text1','text2','text3','text4','accent1','accent2']){
      if(!p[k]) continue;
      const worst = Math.min(...bgs.map(b => cr(p[k], b)));
      if(worst < 3) low.push(`${p.name} ${k} ${worst.toFixed(1)}:1`);
    }
  }
  // 3:1 is the WCAG minimum for large text, which poem text is — against
  // the WORST stop of the background gradient, accents included
  check('every preset\'s text and accents reach 3:1 against what is actually behind them (box or page)', low.length === 0);
  if(low.length) console.log('   ' + low.join('\n   '));
}

// ---- the lotus is a flower ----
{
  const sh = src('texSharpness.js'), tg = src('textureGenerators.js');
  check('green sepals: the complement of the petals, pulled into the greens',
    /const greenHue=Math\.max\(85, Math\.min\(160, \(hueOf\(A\)\+180\)%360\)\)/.test(sh) && /ri===0 && Math\.random\(\)<F\.sepals/.test(sh));
  check('petals that are not sepals fade by the lightness rule (tipOf), sepals keep their green', /pt=sepal \? SEPAL_TIP : tipOf\(pb\)/.test(src('texSharpness.js')));
  check('ring counts vary up to 20% under the maximum', /F\.n\*\(1 - ri\*0\.1\)\*\(0\.8\+Math\.random\(\)\*0\.2\)/.test(sh));
  check('blooms are 20–100% of the largest', /maxR\*\(0\.2\+Math\.pow\(Math\.random\(\),1\.6\)\*0\.8\)/.test(sh));
  check('the Bloom Count readout matches what is drawn, at any canvas size (18 per 100%)',
    /Math\.round\(18\*amt\)/.test(sh) && /label:'Bloom Count',[^}]*base:18/.test(tg));
}

// ---- the frame: gradients, the inset box, the border ----
{
  const html = src('index.html');
  check('non-text gradients come in three shapes: linear, radial, rectangular',
    /id="bgGradientType"[\s\S]*?value="radial"[\s\S]*?value="rect"/.test(html) && /spec\.type === 'radial'/.test(cr) && /spec\.type === 'rect'/.test(cr));
  check('the inset box is drawn after the texture and vignette, before the text',
    cr.indexOf("$('cardToggle').checked") > cr.indexOf("$('textureToggle').checked") &&
    cr.indexOf("$('cardToggle').checked") > cr.indexOf('createRadialGradient(vcx') &&
    cr.indexOf("$('cardToggle').checked") < cr.indexOf('drawTextRun(ctx, part.segments'));
  check('the border strokes the box: they share one path, corners included', /const framePath = \(\) => \{ ctx\.beginPath\(\); roundRectPath\(ctx, inset, inset/.test(cr));
  check('the bloom glows in the border colour (normal blending, not additive light)',
    /lx\.strokeStyle = stroke;/.test(cr) && !/globalCompositeOperation = 'lighter';\s*ctx\.lineWidth/.test(cr));
  check('grain works inside the bloom layer only: specks thin it or light it, never the page',
    /lx\.globalCompositeOperation = 'destination-out';/.test(cr) && /lx\.globalCompositeOperation = 'source-atop';/.test(cr));
  check('the border itself is drawn on the page after the bloom layer (solid, or a stitch)',
    cr.indexOf('ctx.drawImage(L, 0, 0, W, H);') < cr.indexOf("if(stitch === 'solid'){ framePath(); ctx.stroke(); }"));
  check('the bloom layer is half resolution and reused, not a fresh page-sized canvas each render',
    /let BLOOM_LAYER = null;/.test(cr) && /bloomLayer\(Math\.ceil\(W\/2\), Math\.ceil\(H\/2\)\)/.test(cr));
  check('grain is stable between renders (seeded tiles, made once)', /let GRAIN_TILES = null;/.test(cr));
  check('thickness, offset and roundedness are sliders',
    ['borderThickness','borderOffset','borderRadius'].every(id => new RegExp('type="range" id="' + id + '"').test(html)));
  check('every opacity slider shows the moon', ['textureOpacity','cardOpacity'].every(id => new RegExp('id="' + id + '"[^>]*data-moon').test(html)));
  check('presets reset the box and frame to defaults first, so nothing leaks between them', /applyPersisted\(\{ \.\.\.FRAME_DEFAULTS/.test(ev));
  check('the inset box opens by the class the stylesheet keys on', /\$\('cardBlock'\)\.classList\.toggle\('open'/.test(ev));
  check('the inset box stands on its own, not inside the border section',
    html.indexOf('id="cardToggle"') > html.indexOf('id="borderBlock"') && html.indexOf('id="cardToggle"') > html.indexOf('id="borderOffset"'));
  check('border gradient hues only show when the border gradient is on', /show\('borderColor2Field', bgrad\)/.test(ev));
}

// ---- this round: rules, the credit, fonts, the Form knob, SpellName ----
{
  const P = await import('../textParsers.js');
  const r = t => P.parseRule(t, true, true);
  check('--- is a rule, and [---] {---} take the accents',
    r('---').color === null && r('[---]').color === 'accent1' && r('{---}').color === 'accent2');
  check('<---/50%/c> sets width and alignment; the \\ form works too',
    r('<---/50%/c>').width === 0.5 && r('<---/50%/c>').align === 'c' && r('<---\\25%\\r>').width === 0.25 && r('<---\\25%\\r>').align === 'r');
  check('a rule can take its own colour', r('<---/#:ff00aa>').customColor === '#ff00aa');
  check('--- with words after it, or four dashes, stays text', r('--- text') === null && r('----') === null);
  check('a rule is a blank line that carries it (layout treats it as a blank line)',
    P.buildLines('a\n---\nb', true, true)[1].isBlank === true && !!P.buildLines('a\n---\nb', true, true)[1].rule);

  check('the credit is written in the page ink, with PML colours, not a computed tone',
    !/watermarkColor/.test(cr) && /const creditLine = username \? \(buildLines\(username, true, true\)\[0\] \|\| \{\}\) : \{\};/.test(cr));
  check('the border gradient is linear, with its own angle', /createLinearGradient\(W\/2 - Math\.cos\(ga\)\*half/.test(cr));

  const { FONTS } = await import('../appOptions.js');
  const FROZEN = ['Bodoni Moda','Cormorant Garamond','Crimson Pro','EB Garamond','Literata','Playfair Display','Merriweather',
    'Courier Prime','Space Mono','JetBrains Mono','Cinzel','Oswald','Architects Daughter','Caveat','Shadows Into Light','Inter',
    'Poppins','Nunito','Roboto','Work Sans','Josefin Sans','Unica One'];
  check('the first 22 fonts keep their positions (PML /f:N selects by position)',
    FROZEN.every((f, i) => FONTS[i].family === f));
  check('33 fonts, each labelled "Style · Family"', FONTS.length === 33 && FONTS.every(f => / · /.test(f.label)));

  const T = await import('../textureGenerators.js');
  check('the lotus declares a Form knob, centred on the lotus', T.paramsFor('flowers')[2].key === 'form' && T.paramsFor('flowers')[2].def === 50);
  check('Form keys the texture cache, so each flower is cached apart', /\(v3 == null \? '' : `_f\$\{v3\}`\)/.test(src('textureGenerators.js')));
  check('Form is saved and restored with the look', /texP3: \$\('texP3'\)\.value,/.test(ev) && /if\(s\.texP3 !== undefined\)/.test(ev));
  check('Form (and knobs four to six) hide for textures without them', /\[0,1,2,3,4,5\]\.forEach\(i=>\{/.test(ev) && /if\(row\) row\.style\.display = 'none';/.test(ev));
  check('Form spans the flowers: bud, cherry, day lily, lotus, daisy, rosette, hydrangea',
    (src('texSharpness.js').match(/\{ at:[01]\.\d\d,/g) || []).length === 7);

  check('§SpellName names the look last applied', R('§SpellName') === 'Unnamed Look' &&
    resolvePmlVariables('§SpellName', { spellName: 'Lotus Bloom' }) === 'Lotus Bloom');
  check('the debug block names every knob — the third and beyond too (no "Hidden Value")',
    (() => { const t = resolvePmlVariables('§SurfParamsA', { params: [{ label: 'Focal Plane', value: '70%' }, { label: 'Orb Count', value: '67' }, { label: 'Aperture', value: 'Round' }, { label: 'Object Shape', value: 'Flower' }, { label: 'Color Variation', value: '120°' }], opacity: 50 });
      return t.includes('Object Shape: [Flower]') && t.includes('Color Variation: [120°]') && !t.includes('Hidden Value'); })() &&
    /params: defs\.map\(\(d, i\) =>/.test(cr));
  check('the texture tools span the whole panel on phones', /\.subblock\.open > \.tool-row\{ grid-column:1\/-1; \}/.test(css));
}

// ---- this round: state, undo, pixel pass, fonts, variables, pacing ----
{
  check('the app state lives in one object, declared before anything reads it',
    /const state = \{\s*page: \{ align:/.test(ev) && ev.indexOf('const state = {') < ev.indexOf('function serializeCurrentSettings'));
  check('no stray module-level state is left behind',
    !/^let (currentAlign|currentValign|currentAspect|bgStopCount|textStopCount|pickingField|currentThemePalette)\b/m.test(ev));
  check('undo and redo step through look snapshots (never the poem, locks or name)',
    /function lookSnapshot\(\)\{ return JSON\.stringify\(stripToLook\(serializeCurrentSettings\(\)\)\); \}/.test(ev));
  check('restoring a step is not itself recorded as a change', /if\(h\.restoring\) return;/.test(ev));
  check('the undo buttons are ☋ and ☊', /id="undoBtn"[^>]*>☋</.test(src('index.html')) && /id="redoBtn"[^>]*>☊</.test(src('index.html')));
  const core = src('texCore.js'), tg = src('textureGenerators.js');
  check('tint and blend remap are one pass, in place (no copies)',
    /export function pixelPass\(/.test(core) && !/document\.createElement\('canvas'\)[\s\S]{0,400}export function tintMarks/.test(core) &&
    /result = pixelPass\(/.test(tg));
  check('fonts are fetched on first use, and the page redraws when one lands',
    /ensureFonts\(used, \(\) => \{ invalidateTextMeasurements\(\); scheduleRender\(\); \}\)/.test(cr) && !/FONTS\.forEach\(f=>\{\s*const combos/.test(ev));
  check('at most 24 renders a second', /const MIN_RENDER_GAP = 1000 \/ 24;/.test(cr));
  check('erosion draws on one shared scratch canvas', (cr.match(/scratchCanvas\(/g) || []).length >= 2);
  check('§RenderMs, §CacheMB, §Fonts and §Build resolve',
    resolvePmlVariables('§RenderMs|§CacheMB|§Fonts', { renderMs: 42, cacheMB: '37.7', fonts: 3 }) === '42|37.7|3' &&
    typeof resolvePmlVariables('§Build', {}) === 'string');
  check('the border gradient has an angle, shown only with the gradient', /show\('borderAngleField', bgrad\)/.test(ev));
}

// ---- the credit, the picker, the profile ----
{
  const P = await import('../textParsers.js');
  const plain = P.buildLines('@ruby', true, true)[0];
  check('a plain name has segments, not parts — and the credit reads both shapes',
    !plain.parts && plain.segments && /creditLine\.parts \|\| \(creditLine\.segments \? \[\{ segments: creditLine\.segments \}\] : \[\]\)/.test(cr));
  check('the picker\'s Done stays reachable, pinned to its bottom edge', /#clr-picker #clr-close\{ position:sticky; bottom:0;/.test(css));
  check('§Profile reports the last render by stage', resolvePmlVariables('§Profile', { profile: 'text 4 ms' }) === 'text 4 ms' &&
    ["lap('backdrop+texture')", "lap('frame')", "lap('text')", "lap('marks')"].every(s => cr.includes(s)));
}

// ---- the box takes the texture's route onto the page ----
check('the inset box is painted on its own layer, then blended on as one image (not filled through a clip while blending)',
  /const L = cardLayer\(Math\.ceil\(W\/2\), Math\.ceil\(H\/2\)\)/.test(cr) && /ctx\.globalCompositeOperation = \$\('cardBlend'\)\.value \|\| 'source-over';\s*ctx\.imageSmoothingEnabled = true;\s*ctx\.drawImage\(L, 0, 0, W, H\);/.test(cr));

// ---- the canonical-pixel scale S (step 1: plumbing, no visible change) ----
{
  const C = await import('../texCore.js');
  check('S is 1 unless set, and withScale restores it afterwards',
    C.scaleNow() === 1 && C.withScale(0.25, () => C.scaleNow()) === 0.25 && C.scaleNow() === 1);
  check('cpx converts canonical pixels at the current scale', C.cpx(12) === 12 && C.withScale(0.5, () => C.cpx(12)) === 6);
  check('an invalid scale falls back to 1', C.withScale(0, () => C.scaleNow()) === 1 && C.withScale(NaN, () => C.scaleNow()) === 1);
  const tg = src('textureGenerators.js');
  check('textures generate inside withScale, and the cache key only changes when S is not 1',
    /withScale\(scale, \(\) => withLightTilt\(lightTilt\/100, \(\) => withSeed\(seed,/.test(tg) && /\(scale === 1 \? '' : `_x\$\{scale\}`\)/.test(tg));
  check('the renderer passes its S to every texture it draws', (cr.match(/scale: S(, p4, p5, p6)? \}/g) || []).length === 5);
  check('the render scale is 1 today (the preview is the export size)', /let RENDER_SCALE = 1;/.test(cr));
  check('§Scale reports it', resolvePmlVariables('§Scale', { scale: 1 }) === '1' && resolvePmlVariables('§Scale', { scale: 1/3 }) === '0.333');
}

// ---- canonical pixels, step 3: generators converted ----
{
  const C = await import('../texCore.js');
  check('canonArea is the pixel area at S = 1, and the export area at any S',
    C.canonArea(300, 200) === 60000 && C.withScale(0.5, () => C.canonArea(150, 100)) === 60000);
  check('canonDiv is exact at S = 1 and keeps the export grid when smaller (never finer than 1)',
    C.canonDiv(4) === 4 && C.withScale(1/3, () => Math.abs(C.canonDiv(4) - 4/3) < 1e-12) && C.withScale(0.1, () => C.canonDiv(4)) === 1);
  const gens = ['texWhimsy.js','texSharpness.js','texChaos.js','texTouch.js'].map(f => src(f)).join('\n');
  check('no generator counts by raw pixel area any more (a small canvas drew fewer sparkles)',
    !/Math\.round\(\(w\*h\)\/\d+/.test(gens));
  check('no line width has a fixed-pixel floor any more',
    !/lineWidth ?= ?Math\.max\(\d*\.?\d+,/.test(gens) && !/lineWidth ?= ?\d*\.?\d+;/.test(gens));
  check('working grids are canonical (canonDiv), so pixel-built textures keep the export grid',
    (gens.match(/canonDiv\(\d\)/g) || []).length === 25);
  check('linen works on the export grid at any size (its threads are finer than a preview pixel)',
    /const div=2\*scaleNow\(\), ww=Math\.ceil\(w\/div\)/.test(src('texTouch.js')));
}

// ---- canonical pixels, step 4: the renderer ----
{
  check('your pixel settings are canonical: border, and effect widths and distances',
    /const bThick = Math\.max\(rpx\(1\), \(parseFloat\(\$\('borderThickness'\)\.value\) \|\| 1\) \* S\);/.test(cr) &&
    /ctx\.lineWidth = rpx\(e\.k1\)\*2;/.test(cr) && /along\(e, rpx\(e\.k2\)\)/.test(cr));
  check('no fixed-pixel floors remain in the renderer', !/Math\.max\((0\.\d+|1|1\.5), (unit|size|baseSize|bThick)/.test(cr));
  check('the border grain tile scales with S, and is untouched at 1', /if\(S !== 1 && pt && pt\.setTransform/.test(cr));
  check('a debug hook can set the render scale from outside', /window\.vellumDebug = \{\s*setRenderScale:/.test(cr));
}

// ---- the five redesigns ----
{
  const T = await import('../textureGenerators.js');
  const knob = (t, i) => (T.paramsFor(t)[i] || {}).label;
  check('Deep Field has Atmosphere; Linen has Details and Weave; Sigils have Chaos; Silverpoint has Age',
    knob('astral', 2) === 'Atmosphere' && knob('linen', 1) === 'Details' && knob('linen', 2) === 'Weave' &&
    knob('sigils', 2) === 'Chaos' && knob('hatch', 2) === 'Age');
  check('Linen has its own Fabric and Light hues', T.TEXTURE_CAPS.linen.tintLabels.join('|') === 'Fabric Hue|Light Hue' && !T.TEXTURE_CAPS.linen.genericTint);
  check('Rain on Glass and Sigil Scatter use the light direction (Harsh Rain\'s glass became Rain on Glass)', T.TEXTURE_CAPS.glassrain.light === true && T.TEXTURE_CAPS.sigils.light === true && T.TEXTURE_CAPS.rainstreaks.light === false);
  const wh = src('texWhimsy.js');
  check('the nebula and the stars rebuild one matter map, first, from the seed',
    /const M = buildMatterMap\(\);\s+\/\/ FIRST: the same map the stars use/.test(wh) && /const M = buildMatterMap\(\);\s+\/\/ FIRST: the same map the nebula uses/.test(wh));
  check('the Deep Field layers take their Atmosphere through p3, and it keys their cache',
    /p1: p2, p3, tint1: tint2/.test(cr) && /seed, p1, p3, tint1, scale: S/.test(cr) && /defs\.length === 0 && p3 != null \? p3 : null/.test(src('textureGenerators.js')));
}

// ---- the preview at screen size ----
{
  check('the export size is kept apart from the preview canvas', /state\.page\.exportW = w; state\.page\.exportH = h;/.test(ev));
  check('the preview scale is one of a few fixed steps, at least as large as it is shown',
    /const S_STEPS = \[1\/4, 1\/3, 1\/2, 2\/3, 1\];/.test(ev) && /const need = shownW \* dpr \* Math\.max\(1, state\.ui\.zoom\) \/ state\.page\.exportW;/.test(ev));
  check('Save image renders the full export, then returns to the preview',
    /canvas\.width = state\.page\.exportW \|\| pw;[\s\S]{0,120}setRenderScale\(1\); render\(\);\s*await texturesSettled\(\);\s*render\(\);\s*link\.href = canvas\.toDataURL/.test(ev));
  check('the export size is recorded at launch (the markup sets it)', /if\(!state\.page\.exportW\)\{ state\.page\.exportW = canvas\.width;/.test(ev));
  check('a pinch re-renders sharp enough for its magnification', /state\.ui\.zoom = scale; applyPreviewScaleSoon\(\);/.test(ev));
  check('§Canvas reports the export size, not the preview', /canvas: Math\.round\(W \/ RENDER_SCALE\) \+ '×' \+ Math\.round\(H \/ RENDER_SCALE\)/.test(cr));
  {
    const O = await import('../appOptions.js');
    const asHost = h => { globalThis.location = { hostname: h }; const r = O.isProductionHost(); delete globalThis.location; return r; };
    check('every build opens on the template for now; at launch, OPEN_ON_POEM lets production open on a poem',
      /if\(!\(OPEN_ON_POEM && isProductionHost\(\)\)\)\{ \$\('poemText'\)\.value = DEV_TEMPLATE;/.test(ev) && O.OPEN_ON_POEM === false &&
      asHost('poetrypress.unfixable.place') === true && asHost('vellum.unfixable.place') === false);
  }
  const P = await import('../textParsers.js');
  check('rules take scale:N and the words left / center / right', P.parseRule('<---/scale:50/center>', true, true).width === 0.5 && P.parseRule('<---/scale:50/center>', true, true).align === 'c');
  check('§UVIcon draws the sigil', R('§UVIcon') === R('§Glyph!sigil'));
}

// ---- stitches, effects, the preview's hysteresis ----
{
  const St = await import('../stitches.js'), P = await import('../textParsers.js');
  check('sixty-plus stitches from the chart (and a few of our own), drawn by one function along any path',
    St.STITCH_STYLES.length >= 60 && ['greek','satinscallop','rope','moons','tails','rubies','saturn','enceladus'].every(k => St.STITCH_STYLES.includes(k)) && typeof St.drawStitch === 'function');
  const path = St.pathFromPoints([[0, 0], [100, 0]], false);
  check('a path measures its length, and its normal points down for a left-to-right line',
    path.len === 100 && path.point(50, 10)[1] === 10 && path.point(50, 10)[0] === 50);
  const ring = St.pathFromPoints(St.roundRectPoints(0, 0, 100, 60, 10), true);
  check('a rounded rectangle is a closed path, its normal pointing inward', ring.closed && ring.point(30, 5)[1] > 0);
  check('rules take a stitch and a side', P.parseRule('<---/vine/up/60%>', true, true).style === 'vine' && P.parseRule('<---/vine/up/60%>', true, true).side === -1);
  check('the border can be stitched, pointing in or out', /drawStitch\(ctx, pathFromPoints\(framePoints\(\), true\), stitch, \{ \.\.\.stitchSpec, color: stroke \}\);/.test(cr) && /\$\('borderStitchOut'\)/.test(cr));
  check('the inset box follows a stitched border\'s inner edge', /const edge = stitchInnerEdge\(pathFromPoints\(framePoints\(\), true\), stitchStyle, stitchSpec\);/.test(cr));
  const edge = St.stitchInnerEdge(St.pathFromPoints(St.roundRectPoints(0, 0, 200, 200, 0), true), 'scallop', { period: 20, amp: 8, width: 2, side: 1 });
  check('a scallop\'s inner edge is scalloped: it moves in and out along the border', (() => { const ys = edge.slice(0, 20).map(p => p[1]); return Math.max(...ys) - Math.min(...ys) > 4; })());
  check('rules take a motif size and a thread weight', P.parseRule('<---/wave/size:150/weight:200>', true, true).size === 150 && P.parseRule('<---/wave/size:150/weight:200>', true, true).weight === 200);
  check('the border menu and the help list fill themselves from the library', /bs\.innerHTML = STITCH_STYLES\.map/.test(ev) && /sl\.innerHTML = STITCH_STYLES\.map/.test(ev));
  check('§TypeEffect lists the whole effect stack, compressed', /typeEffect: describeStack\(pageEffectStack\(\)/.test(cr) &&
    (await import('../effects.js')).describeStack([(await import('../effects.js')).makeEffect('glow', '#fd0', 40, 70)]) === 'glow 40% 70% #fd0');
  check('the help covers rules, code and variables', ['<h4>Rules</h4>','<h4>Code</h4>','<h4>Variables</h4>'].every(h => src('index.html').includes(h)));
  check('linen picks its seam stitch from the seed', /const seamStitch=SEAM_STITCHES\[Math\.floor\(Math\.random\(\)\*SEAM_STITCHES\.length\)\];/.test(src('texTouch.js')));
  check('letter-by-letter lines draw every effect first, then every glyph', /\/\/ pass 1: effects and outlines, under the whole run/.test(cr) && /charSeed = seed0;/.test(cr));
  check('the sigil draws a silhouette during effect passes', /g\.name === 'sigil' && !ctx\.__vellumEffectPass/.test(src('glyphs.js')));
  check('layout changes never step the preview scale down', /setTimeout\(\(\) => applyPreviewScale\(false\), 150\)/.test(ev) && /if\(!allowDown && !state\.ui\.fullPreview && S < current - 1e-6\) S = current;/.test(ev));
}

// ---- the light's height, release names, the round's textures ----
{
  const C = await import('../texCore.js');
  const full = C.lightVec(90), half = C.withLightTilt(0.5, () => C.lightVec(90)), over = C.withLightTilt(0, () => C.lightVec(90));
  check('the light is raking by default, softer as it rises, flat overhead', Math.abs(full.lx - 1) < 1e-9 && Math.abs(half.lx - 0.5) < 1e-9 && over.lx === 0);
  check('the light\'s height keys the texture cache only when it is not the horizon', /\(lightTilt === 100 \? '' : `_t\$\{lightTilt\}`\)/.test(src('textureGenerators.js')));
  const P = await import('../pmlVars.js');
  check('§Build names the release, even unbuilt', /^Jupiter–\w+/.test(P.BUILD));
  {
    // the whole stamp survives inside a segment with directives (a slash in it
    // was read as a directive, leaving only "Jupiter")
    const T = await import('../textParsers.js');
    const line = T.buildLines(P.resolvePmlVariables('<[\\<§Build\\>]/right/basis:140>', {}), true, true)[0];
    const text = (line.parts || [{ segments: line.segments }]).flatMap(p => p.segments).map(s => s.text).join('');
    check('the build stamp prints whole inside a segment', text.includes('Jupiter–Io') || /Jupiter–\w+/.test(text));
  }
  check('build.mjs --next walks Jupiter\'s moons in order', /const JUPITER = \['Amalthea', 'Thebe', 'Io', 'Europa', 'Ganymede', 'Callisto'/.test(src('build.mjs')));
  check('the Needle stands in a back layer, beside downtown, shorter than the towers',
    /const needleLayer = hasNeedle \? 1 \+ Math\.floor\(Math\.random\(\)\*2\) : -1;/.test(src('texSharpness.js')) && /Math\.max\(tallest\*0\.8, H\*f\*0\.68\)/.test(src('texSharpness.js')));
  check('the moon is Ruby\'s preferred version, touched up: a soft terminator, no target ring, no hard contour lines',
    /const litAmt = sstepM\(-0\.012, 0\.012, facing\*u - phase\*edge\)/.test(src('texWhimsy.js')) && !/r-1\.22/.test(src('texWhimsy.js')) && !/band<0\.2 \? 35 : 0/.test(src('texWhimsy.js')));
  check('gradient centres can leave the page and the radius reach 300%', /id="bgRadialX" min="-50" max="150"/.test(src('index.html')) && /id="bgRadialR" min="5" max="300"/.test(src('index.html')));
  check('angle sliders have 45° ticks and a 15° snap', /<datalist id="angleTicks">/.test(src('index.html')) && /input\.step = on \? '15' : '1';/.test(ev));
}

// ---- this round: ticks, apertures, spikes, the desktop ----
{
  const T = await import('../textureGenerators.js');
  check('Lotus Form, Linen Weave and Details, and Bokeh Shape carry ticks', ['flowers', 'linen', 'bokeh'].every(t => T.paramsFor(t).some(d => d.ticks && d.ticks.length)));
  check('a ticked knob gets ⊹, which locks it to the nearest tick', /btn\(\)\.textContent = '⊹'/.test(ev) && /function snapToTick\(input\)/.test(ev));
  check('Aurora Veil reaches 162 ribbons', T.paramsFor('aurora')[1].max * T.paramsFor('aurora')[1].base / 100 === 162);
  check('Facet Field starts regular', T.paramsFor('tessellate')[1].def === 0);
  check('Deep Field has six spikes, their length following brightness', /for\(let s = 0; s < 6; s\+\+\)/.test(src('texWhimsy.js')) && /cpx\(3 \+ 600\*Math\.pow\(b - 0\.8, 1\.5\)\)/.test(src('texWhimsy.js')));
  check('the tabs run on every device; on a desktop they sit under the logo', /\/\/ ---------- the tabs: one panel at a time, on every device ----------/.test(ev) && /body:not\(\.is-mobile\) \.app\{[\s\S]*?grid-template-areas:"header header" "nav nav" "controls stage";/.test(src('poetrypress.css')));
  check('a texture gallery tool exists, for looking rather than testing', /BACKS = \[\['dark'/.test(src('tools/texture-gallery.mjs')));
}

// ---- light like a game engine; the Zen Garden's successors; this round ----
{
  const C = await import('../texCore.js');
  const ww = 64, wh = 64, H = new Float32Array(ww*wh);
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const d = Math.hypot(x - 32, y - 32); H[y*ww + x] = d < 12 ? Math.sqrt(144 - d*d) : 0; }
  const L = C.lightHeights(H, ww, wh, { light: 90 }), at = (r, x, y) => r.light[y*ww + x];
  check('lightHeights: the side facing the light is lit, the far side shaded', at(L, 23, 32) > at(L, 41, 32) + 0.3);
  check('lightHeights: a dome casts a shadow away from the light', at(L, 50, 32) < at(L, 5, 5) - 0.05);
  const O = C.withLightTilt(0, () => C.lightHeights(H, ww, wh, { light: 90 }));
  check('lightHeights: light from straight overhead casts no shadow', at(O, 50, 32) > 0.95);
  check('lightHeights: a glossy surface takes a highlight', Math.max(...C.lightHeights(H, ww, wh, { light: 90, gloss: 0.9 }).spec) > 0.3);
  const T = await import('../textureGenerators.js');
  check('Dune Ripples, Kintsugi and Moss on Stone are lit textures (Dune Ripples with a camera Tilt as well)',
    ['dunes', 'kintsugi', 'moss'].every(t => T.TEXTURE_CAPS[t].light === true && T.paramsFor(t).length >= 3) && T.paramsFor('dunes')[3].key === 'tilt');
  check('a look saved with the retired Zen Garden opens as Dune Ripples', /const RETIRED = \{ whorl: 'dunes'/.test(src('textureGenerators.js')) && /if\(s\.textureType === 'whorl'\) return \{ \.\.\.s, textureType: 'dunes' \};/.test(ev) && /s = retireLook\(s\);/.test(ev));
  check('Rain on Glass is built from lit heights', /const L=lightHeights\(H, ww, wh, \{ light, relief:1\.6, gloss:0\.95/.test(src('texTouch.js')));
  check('Lotus petals fade by Ruby\'s rule (light → white, mid → brighter and more saturated, dark → saturated near-black) and fold', /const tipOf=o=>/.test(src('texSharpness.js')) && /the fold: a crease down the petal's centre/.test(src('texSharpness.js')));
  check('Enochian Noise is Binary Pattern now', />Binary Pattern</.test(src('index.html')) && !/Enochian Noise/.test(src('index.html')));
}

// ---- threads, the desktop menu ----
{
  const svc = src('textureService.js');
  check('textures are made in a worker; the slot keeps its last texture meanwhile', /return prev && prev\.type === type \? prev\.tex : null;/.test(svc));
  check('requests coalesce: only the latest wish per slot waits', /wanted\.set\(slot, \{ key, type, w, h, opts \}\); pump\(\);/.test(svc));
  check('H: one worker per spare core, up to two', /const POOL_SIZE = Math\.max\(1, Math\.min\(2, \(\(typeof navigator !== 'undefined' && navigator\.hardwareConcurrency\) \|\| 2\) - 1\)\);/.test(svc) && /pool = Array\.from\(\{ length: POOL_SIZE \}, spawn\);/.test(svc));
  check('I: a new wish starts at once on a free worker; nothing is killed (a cold worker was measured slower); the picture never steps back', /if\(running\) inflight\.delete\(slot\);/.test(svc) && !/terminate\(\);\s*abandoned/.test(svc) && /if\(id > \(shownSeq\.get\(f\.slot\) \|\| 0\)\)/.test(svc));
  check('the service starts no timers of its own (nothing to keep Node alive)', !/setInterval\(/.test(svc));
  check('E: Deep Field\'s nebula and Sleep Haze sample their smooth fields on a lattice', /const NEB = smoothField\(workW, workH, 3,/.test(src('texWhimsy.js')) && /const haze=smoothField\(ww,wh,4,/.test(src('texWhimsy.js')));
  check('textures that draw web-font text stay on the page', /const ON_PAGE = new Set\(\['summoning', 'cards'\]\);/.test(svc));
  check('the page and the worker share one cache key', /export function textureKeyFor\(type, w, h, opts = \{\}\)/.test(src('textureGenerators.js')));
  check('the worker block is in the head, before the page script asks for it', /html\.replace\('<\/head>', `<script type="text\/js-worker"/.test(src('build.mjs')));
  check('the first real measurement may always step the preview down', /if\(!state\.ui\.previewMeasured\)\{ state\.ui\.previewMeasured = true; allowDown = true; \}/.test(ev));
  check('on a desktop, Esoterica opens as a drawer and closes back to the panel before', /if\(name === 'more' && current === 'more'\) name = before;/.test(ev));
  check('the tabs explain themselves', ['Write text in markup', 'Aspect ratio and presets', 'Fonts and text effects', 'Backgrounds, textures and borders', 'Advanced options'].every(t => src('index.html').includes(`title="${t}"`)));
}

// ---- Dream Bloom's objects and colours; the working shimmer; snow; sparks ----
{
  const T = await import('../textureGenerators.js');
  const d = T.paramsFor('bokeh');
  check('Dream Bloom has five knobs: size, count, aperture, object shape, color variation', d.map(k => k.key).join(',') === 'zoom,amt,form,shape,hue');
  check('Object Shape reads as names and has a die', T.paramReadout(d[3], 29) === 'Leaf' && d[3].dice === true);
  check('with Colour Variation, Dream Bloom keeps its own hues (the grey tint pass is skipped)', /const ownColour = type === 'bokeh' && hueSpread > 0;/.test(src('textureGenerators.js')));
  check('knobs four and five reach the cache key', /\(v4 == null \? '' : `_k\$\{v4\}`\)/.test(src('textureGenerators.js')));
  check('a busy worker shows a shimmer (after a moment, so fast textures don\'t flicker it)', /busyTimer = setTimeout\(\(\) => document\.body\.classList\.add\('tex-busy'\), 180\)/.test(src('textureService.js')) && /body\.tex-busy \.canvas-wrap::after/.test(src('poetrypress.css')));
  check('saving shows it too, and the button pulses', /document\.body\.classList\.add\('saving'\)/.test(ev) && /body\.saving \.download-btn\{ animation:savePulse/.test(src('poetrypress.css')));
  check('First Snow\'s in-focus flakes are crystals', /objectPath\(fctx, 'snowflake'/.test(src('texWhimsy.js')));
  check('Sparkler has Hue Drift, and bigger embers burn more chaotically', T.paramsFor('embers')[2].label === 'Hue Drift' && /const chaos = Math\.max\(0, \(zoom \|\| 1\) - 1\)\*0\.55;/.test(src('texWhimsy.js')));
}

// ---- Dream Bloom's lens ----
{
  const w = src('texWhimsy.js');
  check('Dream Bloom\'s blur is a thin lens: the circle of confusion from A·f·|S2−S1|/(S2·(S1−f))', /0\.5\*A\*F\*Math\.abs\(S2 - S1\)\/\(S2\*\(S1 - F\)\)\*pxPerMm/.test(w));
  check('blur is the object convolved with the aperture, sampled from the aperture\'s own outline', /insidePolygon\(outline, jx, jy\)/.test(w) && /const outline = apertureOutline\(0, 0, 1, shape, rot\);/.test(w));
  check('light is conserved and clips like a sensor (glints far brighter than white; surfaces about white)', /I: obj === 'dot' \? 1\.5 \+ 180\*Math\.pow/.test(w) && /ctx\.globalCompositeOperation = 'lighter';/.test(w));
  check('spherical aberration and cat\'s-eye vignetting (gentle: the clip shifts at most about half a disc)', /const sa = behind \? 0\.7 : -0\.6;/.test(w) && /m\.x \+ ox\*cat\*coc, m\.y \+ oy\*cat\*coc/.test(w) && !/ox\*cat\*coc\*2/.test(w));
  check('each blurred shape is made once and shared by matching motes', /function blurShape\(ratioB, spinB, behind\)/.test(w) && /if\(shapes\.has\(key\)\) return shapes\.get\(key\);/.test(w));
  check('a blurred shape has room for the object\'s full reach, so nothing is cut at an edge', /size = Math\.ceil\(2\*\(rk\*1\.3 \+ ck\) \+ 8\)/.test(w));
}

// ---- more textures on the lighting module ----
{
  const T = await import('../textureGenerators.js');
  check('Facet Field is a carved, lit surface that starts lit from overhead (Light Hue = light, Material Hue = material)',
    T.TEXTURE_CAPS.tessellate.light === true && T.TEXTURE_CAPS.tessellate.lightTilt === 0 && T.TEXTURE_CAPS.tessellate.tintLabels[1] === 'Material Hue' &&
    /const L = lightHeights\(H, ww, wh, \{ light, relief: 1, gloss: 0\.25, shadow: 0\.7/.test(src('texChaos.js')));
  check('choosing a texture with a light of its own sets the dial to it', /const lt = \(capsFor\(\$\('textureType'\)\.value\) \|\| \{\}\)\.lightTilt;/.test(ev));
  check('Cup Ring is a flat, absorbed stain (no relief): a band darkening to a crisp line, pooled to one side, feathered outward, with a Spill knob',
    /coffee-ring effect/.test(src('texTouch.js')) && /shadow:0, ao:0, ambient:0\.6/.test(src('texTouch.js')) && /wicking runs outward into dry paper/.test(src('texTouch.js')) && T.paramsFor('cupring')[2].label === 'Spill');
}

// ---- no two pages at once ----
{
  check('every frame starts from a clean slate (ctx.reset, or a full manual reset)', /if\(typeof ctx\.reset === 'function'\) ctx\.reset\(\);/.test(cr) && /ctx\.globalCompositeOperation = 'source-over';\s*if\('filter' in ctx\)/.test(cr));
  check('a texture that cannot be drawn is skipped, never allowed to abort the frame', /try \{ ctx\.drawImage\(t, 0, 0, W, H\); \} catch\(err\)/.test(cr));
  check('the cache never closes a bitmap (the service may still be showing it)', !/gone\.close\(\)/.test(src('textureGenerators.js')));
  check('the page canvas is a CPU canvas, like its layers (first request sets it)', /const ctx = canvas\.getContext\('2d', \{ willReadFrequently: true \}\);/.test(ev));
  check('after a full-size save, the full-size textures leave the cache', /dropLargeTextures\(\(state\.page\.exportW \|\| pw\)\*\(state\.page\.exportH \|\| ph\)\);/.test(ev));
}

// ---- performance A–D (each must leave every image identical) ----
{
  check('A: text fits from a predicted size, checked on the same grid as before (not dozens of passes)', /predict, snapped down onto the grid/.test(cr) && /peeking two further steps up/.test(cr));
  const gl = src('glyphs.js');
  check('B: text measurements are remembered, keyed by font, alignment, baseline, direction and text', /const MEASURED = new Map\(\);/.test(gl) && /this\.font \+ '\\u0001' \+ this\.textAlign/.test(gl));
  check('B: and forgotten whenever a font arrives', /clearMeasureCache\(\);\s+\/\/ remembered widths were measured against the old font/.test(cr));
  check('C: no blind start-up refits; refit when a font actually arrives', !/setTimeout\(remeasureAndRender, (300|900)\)/.test(ev) && /addEventListener\('loadingdone'/.test(ev));
  check('C: the symbol font clears only the textures that draw symbols', /clearTexturesOfTypes\(\['summoning', 'cards'\]\)/.test(ev));
  check('D: preset tiles paint when seen, one per frame', /paintWhenSeen\(swatch, \(\) => paintPresetSwatch/.test(ev) && /tileFrame = requestAnimationFrame\(drainTiles\)/.test(ev));
}

// ---- the Dream Bloom drag ----
{
  check('tinted glyphs are remembered (by glyph, font, colour, size), as CPU canvases', /const TINTED = new Map\(\);/.test(cr) && /octx = off\.getContext\('2d', \{ willReadFrequently: true \}\);/.test(cr));
  check('live numbers don\'t refit the page: the fit keys on the text\'s shape', /const shapeOf = v => String\(v\)\.replace\(\/\\d\/g, '0'\);/.test(cr) && /keep the size, measure these lines once/.test(cr));
}

// ---- F and G ----
{
  const core = src('texCore.js'), svc = src('textureService.js');
  check('F: slow textures are drafted at half resolution while a knob or the light is dragged, never while saving', /if\(drafting && \(genMs\.get\(type\) \|\| 0\) > DRAFT_OVER_MS/.test(svc) && /function draftWhileDragging\(\)/.test(ev) && /setDrafting\(false\); clearTimeout\(draftTimer\);\s*setRenderScale\(1\); render\(\);/.test(ev));
  check('G: lighting has a WebGL2 fragment-shader path, tried before any CPU-only work', /const LIGHT_FRAG = `#version 300 es/.test(core) && core.indexOf('if(GPU_LIGHT && ww*wh >= 4096)') < core.indexOf('const R = 4, avg = new Float32Array(ww*wh);'));
  check('G: software-emulated WebGL steps aside for the CPU (it measured slower)', /if\(!GPU_SOFT_OK && \/swiftshader\|llvmpipe\|softpipe\|software\|basic render\/i\.test\(renderer\)\) return null;/.test(core));
  check('G: the worker can be told to light on the CPU (to compare, or as a fallback)', /setGpuLight\(!\(opts && opts\.cpuLight\)\);/.test(src('textureWorker.js')));
  const C = await import('../texCore.js');
  check('G: in Node there is no WebGL2, so lighting runs on the CPU, exactly as before', C.lightBackend() === 'cpu');
}

// ---- Text Margins ----
{
  check('Text Margins scales the page margins and breathing room, never the frame (100% = as before)',
    /const marginK = Math\.max\(0\.2, Math\.min\(1\.5,/.test(cr) && /bOffset \+ bThick \+ Math\.min\(W, H\)\*0\.04\*marginK/.test(cr) && /W\*0\.09\*marginK/.test(cr)
    && /id="textMargin" min="20" max="150" step="5" value="100"/.test(src('index.html')));
  check('Text Margins is saved and restored with a look', /textMargin: parseFloat\(\$\('textMargin'\)\.value\),/.test(ev) && /if\(s\.textMargin!==undefined\)/.test(ev));
}

// ---- no more blank pages ----
{
  const svc = src('textureService.js');
  check('frames are drawn into a back buffer and reach the page only when whole', /function renderInto\(canvas\)/.test(cr) && /renderInto\(BACK\);[\s\S]{0,200}v\.drawImage\(BACK, 0, 0\);/.test(cr));
  check('a failed frame keeps the last good picture, lets memory go, and retries (a few times)', /dropLargeTextures\(Math\.max\(1, page\.width\*page\.height\)\);/.test(cr) && /failures <= 3/.test(cr));
  check('a restored canvas, or a tab coming back, redraws', /addEventListener\('contextrestored'/.test(ev) && /visibilityState === 'visible'\)\{ resetBackBuffer\(\); scheduleRender\(\); \}/.test(ev));
  check('the texture cache follows the device\'s memory', /navigator\.deviceMemory/.test(src('textureGenerators.js')));
  check('a crashed worker is replaced and its job retried; only repeated crashes fall back to the page', /if\(crashes > MAX_CRASHES\)/.test(svc) && /if\(i >= 0\) pool\[i\] = spawn\(\);/.test(svc));
  check('Node (no OffscreenCanvas) still draws on the page directly', /if\(typeof OffscreenCanvas !== 'function'\)\{ renderInto\(page\); return; \}/.test(cr));
}

// ---- Fold Ghost and Poured Wax, lit ----
{
  const T = await import('../textureGenerators.js'), tt = src('texTouch.js');
  check('Old Paper is folded paper: long folds and crinkle as heights, lit; Folds, Age and Crinkle knobs',
    T.paramsFor('oldpaper').map(d => d.label).join('|') === 'Scale|Folds|Age|Crinkle' && /const L=lightHeights\(H, ww, wh, \{ light, relief:1, gloss:0\.1, shadow:0\.4/.test(tt));
  check('Poured Wax pools merge (a metaball field), lit with a satin sheen; a Viscosity knob', T.paramsFor('wax')[2].label === 'Viscosity' && /pools that meet MERGE into one/.test(tt) && /gloss:0\.62/.test(tt));
}

// ---- inline glyphs on every canvas; materials; normal maps; folds ----
{
  // the hook must reach EVERY 2D context prototype — the back buffer is an
  // OffscreenCanvas, and without it every inline glyph drew as a missing box
  const G = await import('../glyphs.js');
  if(typeof globalThis.Path2D === 'undefined') globalThis.Path2D = class { moveTo(){} lineTo(){} bezierCurveTo(){} quadraticCurveTo(){} arc(){} closePath(){} rect(){} ellipse(){} addPath(){} };
  const fake = () => ({ fillText(){}, strokeText(){}, measureText(){ return { width: 1 }; } });
  const pageProto = fake(), offscreenProto = fake();
  check('inline glyphs hook every kind of 2D context (page and OffscreenCanvas), each once',
    G.installInlineGlyphs(pageProto) === true && G.installInlineGlyphs(offscreenProto) === true && G.installInlineGlyphs(pageProto) === false);
  check('…and glyphs.js and the renderer install it on OffscreenCanvas too',
    /installInlineGlyphs\(OffscreenCanvasRenderingContext2D\.prototype\)/.test(src('glyphs.js')) && /installInlineGlyphs\(OffscreenCanvasRenderingContext2D\.prototype\)/.test(cr));

  const C = await import('../texCore.js');
  const ww = 48, wh = 48, flatH = new Float32Array(ww*wh), N = new Float32Array(ww*wh*3);
  // a normal map tilting every pixel east; on the dial, 270° light comes FROM the east (90° from the west)
  for(let i = 0; i < ww*wh; i++){ const t = 0.6, l = Math.hypot(t, 0, 1); N[i*3] = t/l; N[i*3+1] = 0; N[i*3+2] = 1/l; }
  const plain = C.lightHeights(flatH, ww, wh, { light: 270 }), toward = C.lightHeights(flatH, ww, wh, { light: 270, normals: N }), away = C.lightHeights(flatH, ww, wh, { light: 90, normals: N });
  check('normal maps: tilted toward the light is brighter than flat, tilted away is darker', toward.light[24*ww + 24] > plain.light[24*ww + 24] + 0.05 && away.light[24*ww + 24] < plain.light[24*ww + 24] - 0.05);
  const H = new Float32Array(ww*wh); for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const d = Math.hypot(x - 24, y - 24); H[y*ww + x] = d < 10 ? Math.sqrt(100 - d*d) : 0; }
  const L = C.lightHeights(H, ww, wh, { light: 90, ambient: 0.4, components: true });
  let worst = 0; for(let i = 0; i < ww*wh; i++) worst = Math.max(worst, Math.abs(L.light[i] - (0.4 + 0.6*L.diffuse[i])*(1 - L.occl[i])));
  check('components recombine to the same light (ambient + (1−ambient)·diffuse, occluded)', worst < 1e-5);
  check('white Highlight and Shade are no material at all (looks stay exactly as they were)', C.materialOf('#FFFFFF', '#ffffff') === null && C.materialOf(null, undefined) === null);
  const M = C.materialOf('#FFFFFF', '#3060FF');
  const lit = L.light.indexOf(Math.max(...L.light)), shaded = L.light.indexOf(Math.min(...L.light));
  check('the Shade hue colours shadows, not lit faces', Math.abs(C.litK(L, lit, 0.4, M, 2) - L.light[lit]) < 1e-9 && C.litK(L, shaded, 0.4, M, 2) > L.light[shaded]*1.2);
  check('material hues keep their brightness (a deep blue shade does not darken)', Math.abs(0.2126*M.sh[0] + 0.7152*M.sh[1] + 0.0722*M.sh[2] - 1) < 0.02);
  const T = await import('../textureGenerators.js');
  check('every texture lit by the engine takes materials (Highlight, Shade) — the grey ones too, now that the tint pass keeps colour',
    ['tessellate', 'cupring', 'wax', 'dunes', 'kintsugi', 'moss', 'crackedglaze', 'coldpress', 'clouds', 'crystal', 'spangle', 'glassrain', 'oldpaper', 'sigils'].every(t => T.TEXTURE_CAPS[t].material === true));
  check('material hues key the cache only when set', T.textureKeyFor('dunes', 64, 64, { tint3: '#FFFFFF' }) === T.textureKeyFor('dunes', 64, 64, {}) && T.textureKeyFor('dunes', 64, 64, { tint4: '#3060FF' }) !== T.textureKeyFor('dunes', 64, 64, {}));
  check('Highlight and Shade are saved, restored (white when absent) and reset by presets',
    /textureTint3: \$\('textureTint3Hex'\)\.value,/.test(ev) && /setColorField\('textureTint4Hex', s\.textureTint4 \|\| '#FFFFFF'\);/.test(ev) && /setColorField\('textureTint3Hex', p\.textureTint3 \|\| '#FFFFFF'\);/.test(ev));
  check('Old Paper: folds sit off-centre (offset across the page, along the fold\'s normal), by real folding schemes',
    /px=ww\*\(0\.5 \+ off\*nx\), py=wh\*\(0\.5 \+ off\*ny\)/.test(src('texTouch.js')) && /scheme=Math\.floor\(Math\.random\(\)\*4\)/.test(src('texTouch.js')));
}

// ---- the lighting loop, faster and exact ----
{
  const core = src('texCore.js');
  check('the shadow trace stops once the ray is above the tallest point (exact: nothing further can block it)', /if\(rayH >= hTop\) break;/.test(core));
  check('the lighting loop reads neighbours directly and uses sqrt, not hypot', /const nl = Math\.sqrt\(gx\*gx \+ gy\*gy \+ 1\)/.test(core) && !/Math\.hypot\(gx, gy, 1\)/.test(core));
}

// ---- Fractured Glaze: glaze over a body ----
{
  const T = await import('../textureGenerators.js'), ch = src('texChaos.js');
  check('Fractured Glaze is lit glaze over a body: crazing at two scales, blisters, chips, peeling; an Enameling knob (Unbroken · Bubbled · Chipped · Peeling)',
    T.TEXTURE_CAPS.crackedglaze.light === true && T.paramsFor('crackedglaze')[2].names.join() === 'Unbroken,Bubbled,Chipped,Peeling'
    && /const primary = net\(cs\), secondary = net\(fineCs\);/.test(ch) && /const L = lightHeights\(H, ww, wh, \{ light, relief: 1, gloss: 0\.85/.test(ch));
}

// ---- the archive: folders listed, permissions set ----
{
  const b = src('build.mjs');
  check('the release zip lists every folder as an entry of its own (simple unzippers show only what is listed)',
    /const entries = \[\.\.\.dirs, \.\.\.files\]/.test(b) && /end\.writeUInt16LE\(entries\.length, 8\)/.test(b));
  check('…and records Unix permissions (755 folders, 644 files)', /isDir \? 0o040755 : 0o100644/.test(b));
}

// ---- Linen's details are lit heights; sparse lighting is exact ----
{
  const C = await import('../texCore.js');
  const ww = 300, wh = 220, H = new Float32Array(ww*wh);
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const d = Math.hypot(x - 90, y - 70)/22; if(d < 1) H[y*ww + x] = 12*Math.sqrt(1 - d*d); }
  for(let x = 0; x < ww; x++) for(let y = 150; y < 156; y++) H[y*ww + x] = -1.2;
  let worst = 0, fewer = true;
  for(const light of [0, 90, 135, 225, 315]){
    const o = { light, gloss: 0.7, shadow: 0.7, ao: 0.45, ambient: 0.4 }, A = C.lightHeights(H, ww, wh, o), B = C.lightSparse(H, ww, wh, o, 32);
    for(let i = 0; i < ww*wh; i++) worst = Math.max(worst, Math.abs(A.light[i] - B.light[i]), Math.abs(A.spec[i] - B.spec[i]));
    if(B.lit >= B.of) fewer = false;
  }
  check('lightSparse lights only the tiles near a detail, and matches lightHeights exactly', worst === 0 && fewer);
  const t = src('texTouch.js'), lin = t.slice(t.indexOf('export function genLinenTooth('), t.indexOf('\n}\n', t.indexOf('export function genLinenTooth(')));
  check('Linen: seams, stitching, rivets and buttons are heights lit by the engine (shadows fall across the weave)',
    /const Ls=lightSparse\(H, ww, wh, \{ light, relief:1, gloss:0\.72, shadow:0\.7/.test(lin) && !/ctx\.(arc|stroke|fill)\(/.test(lin));
}

// ---- Sigil Scatter: relief from the light; Chaos is the hand ----
{
  const t = src('texChaos.js'), sg = t.slice(t.indexOf('export function genSigils('), t.indexOf('\n}\n', t.indexOf('export function genSigils(')));
  check('Sigil Scatter: dark sigils are CUT (a V-groove), light ones RAISED, lit by the engine',
    /depthOf\(cut\.getImageData\(0,0,ww,wh\)\.data, -1\);/.test(sg) && /depthOf\(up\.getImageData\(0,0,ww,wh\)\.data, 1\);/.test(sg)
    && /const L=lightSparse\(H, ww, wh, \{ light, relief:1, gloss:0\.3, shadow:0\.6/.test(sg) && !/translate\(-lx/.test(sg));
  check('Sigil Scatter: Chaos at 0 is a steady hand (no tremor, no scratches)',
    /const wander = \(r\*0\.04 \+ nib\*0\.25\)\*Math\.pow\(chaos, 1\.5\);/.test(sg) && /if\(chaos>0\.3 && Math\.random\(\)</.test(sg) && /n=amp>0\?48:16, tr=amp>0\?tremor\(\):null/.test(sg));
}

// ---- Group A: Pixie Dust's Chaos, Waking Grain's kinds, Crystal Leaf ----
{
  const T = await import('../textureGenerators.js');
  const knobs = t => T.paramsFor(t).map(d => d.label).join('|');
  check('Pixie Dust has Chaos (trails → scattered → bursts); 50 draws exactly as before (fingerprints)',
    knobs('magicparticles') === 'Sparkle Size|Sparkle Count|Chaos' && T.paramsFor('magicparticles')[2].def === 50);
  check('Waking Grain has Grain: Silver, Film (the original, the default), Paper, Digital',
    knobs('grain') === 'Grain Size|Contrast|Grain' && T.paramsFor('grain')[2].names.join() === 'Silver,Film,Paper,Digital' && T.paramsFor('grain')[2].def === 33);
  const t = src('texTouch.js'), cl = t.slice(t.indexOf('export function genSpangle('), t.indexOf('export function genCrystalLeaf('));
  check('Metal Spangle (the old Crystal Leaf): each grain a tilted facet (a normal map), dendrites and terraces as lit heights; Variation and Brushing',
    knobs('spangle') === 'Crystal Size|Dendrites|Terraces|Variation|Brushing' && T.TEXTURE_CAPS.spangle.light === true && T.TEXTURE_CAPS.spangle.material === true
    && /const L=lightHeights\(H, ww, wh, \{ light, relief:1, gloss:0\.9, shadow:0\.6, ao:0\.35, ambient:0\.3, normals:Nm \}\);/.test(cl));
  check('…its barbs lean back toward the nucleus; terraces carry bismuth\'s thin-film colour; flecks glint and can glow',
    /const ph=\(al\+aa\*COT60\)\/sp \+ A\.ph/.test(cl) && /film=\[0\.5\+0\.5\*Math\.cos/.test(cl) && /const glint=Math\.pow\(face, 10\)/.test(cl)
    && /dX=SX\+2\.2\*g1\.tx, dY=SY\+2\.2\*g1\.ty/.test(cl));   // brushed across the light, per face
  const xl = t.slice(t.indexOf('export function genCrystalLeaf('));
  check('Crystal Leaf: a druse of six-faced points (each face lit, striated, edge-worn), a refracted layer behind, fire with dispersion; Clarity, Fire, Phantoms, Inclusions',
    knobs('crystal') === 'Facet Size|Clarity|Fire|Phantoms|Inclusions' && T.TEXTURE_CAPS.crystal.diffuse === true
    && /const B=near\(BACK, x\+mx\*f\.slope\*REFR, y\+my\*f\.slope\*REFR\);/.test(xl) && /EACH CRYSTAL A POINT: a six-sided pyramid/.test(xl) && /dsp=0\.3\+0\.7\*fire/.test(xl) && /rutile needles/.test(xl));
}

// ---- the background randomiser changes the texture the way a person does ----
{
  const ev = src('appEvents.js');
  check('randomising picks from the menu itself and fires a real change (the knobs relabel)',
    /const types = \[\.\.\.\$\('textureType'\)\.options\]\.map\(o => o\.value\);/.test(ev)
    && /\$\('textureType'\)\.dispatchEvent\(new Event\('change', \{ bubbles: true \}\)\);/.test(ev)
    && /if\(!state\.locks\.has\('textureType'\)\)\{/.test(ev));
  check('restoring a lock that did not change announces nothing (a locked texture keeps its knobs)',
    /if\(\(n\.type === 'checkbox' \? n\.checked : n\.value\) === snap\[id\]\) continue;/.test(ev));
}

// ---- the dial as a joystick: First Snow's wind ----
{
  const T = await import('../textureGenerators.js'), ev = src('appEvents.js');
  check('First Snow has Wind (0, still air, is the default and draws as before); the dial is its Wind Direction',
    T.paramsFor('snow').map(d => d.label).join('|') === 'Flake Size|Snowfall|Wind' && T.paramsFor('snow')[2].def === 0
    && T.TEXTURE_CAPS.snow.light === true && T.TEXTURE_CAPS.snow.dial === 'Wind Direction');
  check('the dial takes the name a texture gives it, and its own name back otherwise',
    /setLabelText\(lbl, caps\.dial \|\| lbl\.dataset\.lightName\);/.test(ev));
  check('wind blows FROM where the dial points (away from its handle), as light comes from it',
    /vx = -Math\.cos\(a\)\*wind\*1\.6; vy = -Math\.sin\(a\)\*wind\*1\.6 \+ 1;/.test(src('texWhimsy.js')));
}

// ---- Aurora Veil: the dial blends its hues; Bloom is noisy ----
{
  const T = await import('../textureGenerators.js'), wh = src('texWhimsy.js');
  check('Aurora Veil has Bloom (0, none, by default); the dial is its Blend Direction',
    T.paramsFor('aurora').map(d => d.label).join('|') === 'Curtain Height|Ribbon Count|Bloom' && T.TEXTURE_CAPS.aurora.dial === 'Blend Direction');
  check('…two hues blend across the veil from the dial\'s side; one hue draws exactly as before',
    /const twoHues = !!\(glow && hem && \(glow\.r !== hem\.r/.test(wh) && /vctx\.globalCompositeOperation = 'source-in';/.test(wh));
  check('…its bloom is I + α·Blur(Bright(I))·N: the bright part, blurred, made grainy, added',
    /k = Math\.max\(0, \(l - 140\)\/115\)/.test(wh) && /N = 0\.35 \+ Math\.random\(\)\*1\.3;/.test(wh) && /ctx\.globalCompositeOperation = 'lighter'; ctx\.globalAlpha = bloom;/.test(wh));
}

// ---- Wetness: Painter's Frustration and Painted Landscape; new countries ----
{
  const T = await import('../textureGenerators.js'), wh = src('texWhimsy.js'), sh = src('texSharpness.js');
  check('Painter\'s Frustration has Wetness (0, dry, draws exactly as before): thinner paint, drips, bleeding edges',
    T.paramsFor('brushstrokes').map(d => d.label).join('|') === 'Stroke Width|Stroke Count|Wetness' && T.paramsFor('brushstrokes')[2].def === 0
    && /if\(wet > 0\.25\)\{/.test(sh) && /ctx\.globalAlpha = 0\.65\*wet;/.test(sh));
  check('Painted Landscape has Wetness (watercolour blooms) and five more countries: mesa, forest, tundra, lake, coast',
    T.paramsFor('landscape').map(d => d.label).join('|') === 'Distance|Ridges|Wetness'
    && ['mesa:', 'forest:', 'tundra:', 'lake:', 'coast:'].every(k => wh.includes('    ' + k))
    && /const kind=Object\.keys\(BIOMES\)\[Math\.floor\(Math\.random\(\)\*Object\.keys\(BIOMES\)\.length\)\];/.test(wh));
}

// ---- Lotus Pond: lit by the dial, petals the right way, a seed pod ----
{
  const T = await import('../textureGenerators.js'), sh = src('texSharpness.js');
  check('Lotus Pond takes the light: folds, the bloom\'s lit side, shadows on the water and ring on ring follow the dial',
    T.TEXTURE_CAPS.flowers.light === true && /const away = \(-\(px\*SX \+ py\*SY\)\) > 0 \? 1 : -1;/.test(sh)
    && /const shx=cx-SX\*R\*shadowLen\*1\.4/.test(sh) && /this ring shades the ring beneath it/.test(sh));
  check('a half-open bloom fans its petals evenly round the circle (they all pointed up before)',
    /\(\(k\+0\.5\)\/n - 0\.5\)\*Math\.PI\*2\*F\.spread/.test(sh));
  check('the lotus has a seed pod: stamens beneath, a lit flat top, pitted seed cells (and they can glow)',
    /pod:1 \}, \/\/ lotus/.test(sh) && /if\(F\.pod>0\.02\) stamens\(\);/.test(sh) && /const cr=hr\*0\.12, cells=\[\[0,0\]\];/.test(sh) && T.TEXTURE_CAPS.flowers.hue5.role === 'glow');
}

// ---- the dial's place; padlocks survive a rename ----
{
  const css = src('poetrypress.css'), ev = src('appEvents.js'), html = src('index.html');
  check('the dial sits centred in its space: reset in one corner, centre and a random angle in others',
    /\.light-dial-row\{ display:flex; align-items:center; justify-content:center; position:relative;/.test(css) && /\.ld-reset\{ right:0; bottom:0; \}/.test(css)
    && /\.ld-centre-btn\{ left:0; bottom:0; \}/.test(css) && /\.ld-random\{ right:0; top:0; \}/.test(css) && html.includes('id="lightCentre"') && html.includes('id="lightRandom"'));
  check('a faint centre dot and halfway ring; the halfway ring catches lightly; past the rim only for engine-lit textures (lower light, to 4°)',
    html.includes('class="ld-centre"') && html.includes('class="ld-half"') && /if\(Math\.abs\(tilt - 50\) < 4\) tilt = 50;/.test(ev)
    && /return \(t && \(capsFor\(t\.value\) \|\| \{\}\)\.lowLight\) \? 130 : 100;/.test(ev) && /lightLow\(\)\*8/.test(src('texCore.js'))
    && (await import('../textureGenerators.js')).TEXTURE_CAPS.dunes.lowLight === true);
  check('the spike\'s curls flare outward from the rim', html.includes('d="M -3.2 -28.5 c -5.4 1.2 -8.2 -4.2 -4.4 -6.6'));
  check('renaming a hue or the dial keeps its padlock (labels change their words, not their children)',
    !/tint\dLabel'\)\.textContent = /.test(ev) && /function setLabelText\(el, text\)/.test(ev) && !/lbl\.textContent = caps\.dial/.test(ev));
}

// ---- the Transmutation Circle: one circle, placed by the dial ----
{
  const T = await import('../textureGenerators.js'), ch = src('texChaos.js');
  check('one circle; Complexity; Organic ↔ Tech; the dial is its Position (centred by default)',
    T.paramsFor('summoning').map(d => d.label).join('|') === 'Circle Size|Complexity|Organic ↔ Tech' && T.TEXTURE_CAPS.summoning.dial === 'Position' && T.TEXTURE_CAPS.summoning.lightTilt === 0
    && /const sq = dialSquare\(light\), cx = w\/2 \+ sq\.u\*w\/2, cy = h\/2 \+ sq\.v\*h\/2;/.test(ch));
  check('…its noisy bloom rises toward the digital end', /const bloom = Math\.max\(0, \(tech - 0\.45\)\/0\.55\);/.test(ch));
}

// ---- Black Hole's view and jets; Foxing's cockle; the Scrying Pool rebuilt ----
{
  const T = await import('../textureGenerators.js'), ch = src('texChaos.js'), tt = src('texTouch.js');
  const knobs = t => T.paramsFor(t).map(d => d.label).join('|');
  check('Black Hole: the dial is the View (edge-on at its rim, face-on at its centre); Jets (0: none)',
    knobs('blackhole') === 'Chaos|Particles|Jets' && T.TEXTURE_CAPS.blackhole.dial === 'View' && /elev=tilt0 \+ \(Math\.PI\/2 - tilt0\)\*\(1-view\);/.test(ch));
  check('Black Hole is ray-traced: Schwarzschild bending (leapfrog), the disc met where rays cross it (Doppler, redshift, dust), lensed jets, the sky through the lens',
    /const hx=py\*vz-pz\*vy, hy=pz\*vx-px\*vz, hz=px\*vy-py\*vx, h2=hx\*hx\+hy\*hy\+hz\*hz, K=-1\.5\*h2;/.test(ch)
    && /dop=1\/\(gam\*\(1-vk\*cosT\)\), red=Math\.sqrt\(1-1\/rr\)/.test(ch) && /if\(\(y0>0\)!==\(py>0\)\)\{/.test(ch)
    && /const toward=\(py>0\)===\(Cy>0\) \? 1 : 0\.4;/.test(ch) && /BX\[k\]=cx\+\(bxs\*cosR - bys\*sinR\)\*S;/.test(ch)
    && /ADAPTIVE: trace every other pixel/.test(ch));
  {
    const wm = src('texWhimsy.js'), mo = wm.slice(wm.indexOf('export function genMoon('));
    check('Fractal Moon at night: earthshine hides the stars behind the dark side, clouds pass in front (silver-lined, a halo in their veils), its own draws after the moon\'s',
      /const ashen = 128 - nightK\*38/.test(mo) && /val=\(tone\*a2 \+ val\*ua\*\(1-a2\)\)\/Math\.max\(0\.001, A\)/.test(mo)
      && /const halo=Math\.exp\(-\(\(\(r-haloR\)/.test(mo) && mo.indexOf('moonDraws()') < mo.indexOf('const wind=') && /a falling star, on some nights/.test(mo));
  }
  {
    const ch2 = src('texChaos.js'), ib = ch2.slice(ch2.indexOf('export function genInkBleed('), ch2.indexOf('export function genCrackedGlaze('));
    check('Rorschach is a different card every seed (bat, pair, column, islands, pelvis), pressed imperfectly; Wetness pools the rim and runs; Colour from black ink to pastel plates',
      T.paramsFor('inkbleed').map(d => d.label).join('|') === 'Blot Scale|Spread|Wetness|Color' && T.TEXTURE_CAPS.inkbleed.tintLabels.join() === 'Ink Hue,Accent Hue' && !T.TEXTURE_CAPS.inkbleed.genericTint
      && /const KINDS = \['bat', 'pair', 'column', 'islands', 'pelvis'\];/.test(ib) && /rim = Math\.exp\(-depth\*9\)/.test(ib) && /drips\.push/.test(ib)
      && /TR\[k\*3\]   \*= 1 - op\*\(1 - C\.r\/255\)/.test(ib));
    check('…an old Rorschach look (white and black hues) opens with ink and accent',
      /if\(s\.textureType === 'inkbleed' && \/\^#\?FFFFFF\$\/i\.test\(s\.textureTint1/.test(src('appEvents.js')));
  }
  {
    const ev2 = src('appEvents.js'), css2 = src('poetrypress.css');
    check('desktop: Esoterica opens in its own drawer; the panel on the left stays open, faded toward the page',
      /drawer = document\.createElement\('aside'\); drawer\.className = 'eso-drawer';/.test(ev2)
      && /p\.dataset\.tab === name \|\| \(desk && name === 'more' && p\.dataset\.tab === before\)/.test(ev2)
      && /body\.more-open:not\(\.is-mobile\) \.controls\{ opacity:\.42;/.test(css2) && /"controls stage drawer"/.test(css2));
    check('desktop: the left sidebar resizes by its edge (remembered in this browser, double-click resets); the image fits between',
      /grip\.className = 'side-resize'/.test(ev2) && /localStorage\.setItem\(KEY/.test(ev2) && /grid-template-columns:var\(--side-w, 460px\) minmax\(0,1fr\);/.test(css2)
      && /max-width:calc\(100vw - var\(--side-w, 460px\) - 80px\)/.test(css2) && /^\.side-resize\{ display:none; \}/m.test(css2));
  }
  {
    const sh = src('texSharpness.js'), ch3 = src('texChaos.js'), T2 = await import('../textureGenerators.js');
    check('Brushstrokes are impasto: each stroke lays down thickness (body, piled edges, bristle ridges), lit by the dial and laid over the paint',
      T2.TEXTURE_CAPS.brushstrokes.light === true && /const L = lightHeights\(H, hw, hh, \{ light, relief:1, gloss:0\.25 \+ 0\.6\*wet/.test(sh) && /hx\.globalAlpha = 0\.16\*\(1 - 0\.5\*wet\); hx\.lineWidth = W\*0\.1;/.test(sh));
    check('Metal Leaf is gilding: square sheets in overlapping rows, crinkled and torn, the highlight in the metal\'s colour, each sheet mirroring by its own tilt',
      T2.TEXTURE_CAPS.metalleaf.light === true && /const env = Math\.max\(0, Math\.min\(1\.25, 0\.6 \+ 1\.0\*/.test(sh) && /the sheets, row by row/.test(sh));
    check('Cartomancy is a divination deck: elemental suits drawn as paths, a Vellum arcana, rare easter eggs (Saturn, Enceladus, the Kitsune); shadows, curl and gilt edges by the dial',
      T2.TEXTURE_CAPS.cards.light === true && T2.paramsFor('cards').map(d => d.label).join('|') === 'Card Count|Scatter'
      && /const RARE=\[\['✦','Saturn','saturn'\],\['✦','Enceladus','enceladus'\],\['✦','The Kitsune','kitsune'\]\];/.test(ch3) && /const tearClip=\(\)=>/.test(ch3));
    check('unused hues are HIDDEN, not greyed; the report lays hues out in rows (≤3 one line; 4 → 2×2; 5 → 3+2; 6 → 3+3)',
      /classList\.toggle\('tool-hidden', !caps\.material\)/.test(src('appEvents.js')) && /\.field\.tool-hidden/.test(src('poetrypress.css'))
      && resolvePmlVariables('§SurfParamsB', { hues: [1,2,3,4,5].map(i => ({ label: 'H'+i, hex: '#00000'+i })) }).split('\n').length === 2
      && resolvePmlVariables('-# §SurfParamsB', { hues: [1,2,3,4].map(i => ({ label: 'H'+i, hex: '#00000'+i })) }).split('\n')[1].startsWith('-# '));
  }
  check('Foxing and Fold Ghost are one texture, Old Paper: Age runs foxed → mildewed → scorched; Folds tear at the top; its glow is UV fluorescence',
    T.paramsFor('oldpaper')[2].names.join() === 'Clean,Foxed,Mildewed,Scorched' && T.TEXTURE_CAPS.oldpaper.light === true && T.TEXTURE_CAPS.oldpaper.hue5.role === 'glow'
    && /const nTear=folds>0\.75/.test(tt) && /if\(age>0\.8\)\{/.test(tt) && /if\(age>0\.45\)\{/.test(tt));
  check('…and old looks made with either open as Old Paper, their knobs translated',
    /if\(s\.textureType === 'foxing'\)/.test(src('appEvents.js')) && /if\(s\.textureType === 'foldghost'\)/.test(src('appEvents.js')) && /RETIRED = \{ whorl: 'dunes', foxing: 'oldpaper', foldghost: 'oldpaper', crystalleaf: 'spangle' \}/.test(src('textureGenerators.js')));
  check('a look saved with the old Crystal Leaf opens as Metal Spangle (its knobs carry over unchanged)',
    /if\(s\.textureType === 'crystalleaf'\) return \{ \.\.\.s, textureType: 'spangle' \};/.test(src('appEvents.js')));
  check('Scrying Pool: waves → refracted rays gathered on the floor (caustics) → glints; Turbulence, Depth, Haze, Murk',
    knobs('water') === 'Wave Scale|Turbulence|Depth|Haze|Murk|Tilt' && /const fx=x\+ox-GX\[i\]\*bend, fy=y\+oy-GY\[i\]\*bend;/.test(tt) && /, bend=floor\*\(1-1\/1\.33\)/.test(tt));
  check('…a PLACE by the seed (koi pond, pebbled stream, wishing well): things at their depths, refracted by it, fading; shadows offset with the light; tipped, the far water mirrors the sky',
    /const KINDS=\['koi','stream','well'\]/.test(tt) && /const z=samp\(OZ,X,Y\), zx=X-GX\[P\]\*bend\*1\.6\*z/.test(tt) && /const shadowAt=\(cx, cy, z\)=>/.test(tt)
    && /OUT=obliqueRender\(F, HS, RGB/.test(tt) && /const fr=Math\.min\(0\.75, 0\.04 \+ 1\.2\*Math\.pow\(1 - cosT, 2\.2\)\);/.test(tt));
  check('a camera can tilt (after Quilez): the ground built larger, lit from above, each pixel\'s ray marched to the terrain, haze by distance; tilt 0 is the flat texture exactly',
    /export function obliqueFrame\(ww, wh, tilt, hRange\)\{/.test(src('texCore.js')) && /if\(t < 0\.001\) return \{ flat: true, GW: ww, GH: wh, ww, wh \};/.test(src('texCore.js'))
    && /if\(t >= tEnd\) break;/.test(src('texCore.js')));
  check('Dune Ripples: transverse, barchanoid or linear dunes; ripples only where the wind works (none on slip faces, faint in the lee); heavy grains in the troughs',
    /const KINDS=\['transverse','barchanoid','linear'\]/.test(tt) && /const rip = windward\*\(1 - 0\.85\*shadow\)/.test(tt) && /tone=1\.05 - 0\.09\*TR\[i\]/.test(tt));
}

// ---- Fractured Glaze as a game engine colours it; Kintsugi's vessel ----
{
  const T = await import('../textureGenerators.js'), ch = src('texChaos.js'), tt = src('texTouch.js');
  check('Fractured Glaze: Glaze and Base albedos, with Diffuse, Specular and Shadow (and a uranium Glow)',
    T.TEXTURE_CAPS.crackedglaze.tintLabels.join('|') === 'Glaze Hue|Base Hue' && !T.TEXTURE_CAPS.crackedglaze.genericTint
    && T.TEXTURE_CAPS.crackedglaze.material && T.TEXTURE_CAPS.crackedglaze.diffuse && T.TEXTURE_CAPS.crackedglaze.hue5.role === 'glow');
  check('…painted by the seed (streaks, runs, pools; thin glaze breaks to the body) and curling where it peels',
    /const THK = new Float32Array\(ww\*wh\);/.test(ch) && /thin = Math\.max\(0, 0\.45 - th\)\*1\.2/.test(ch) && /the CURL: where the glaze has peeled/.test(ch));
  check('Kintsugi is the outside of a curved vessel (normals), not a flat plane',
    /THE VESSEL: we look at the outside of a curved pot/.test(tt) && /ambient:0\.66, normals:CN \}\);/.test(tt));
}

// ---- Rain on Glass: the outdoors, from the page's own colours ----
{
  const T = await import('../textureGenerators.js'), tt = src('texTouch.js'), cr = src('canvasRenderer.js');
  check('Rain on Glass is glass in front of the page (transparent, Normal by default) and asks for the page\'s colours',
    T.TEXTURE_CAPS.glassrain.pageEnv === true && T.TEXTURE_CAPS.glassrain.blends[0] === 'source-over' && /const env = caps\.pageEnv \?/.test(cr)
    && T.textureKeyFor('glassrain', 64, 64, { env: '#112233' }) !== T.textureKeyFor('glassrain', 64, 64, { env: '#445566' }));
  check('…each drop is a lens: the outdoors turned over, red and blue bent apart, a dark rim, the sky in its Fresnel edge',
    /THE OUTDOORS behind the glass, made from the page's own colours/.test(tt) && /envAt\(u\+gx\*K\*0\.96, v\+gy\*K\*0\.96, 0\)/.test(tt) && /fres=Math\.min\(1, Math\.pow\(tilt\*2, 3\)\)\*0\.45/.test(tt));
}

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
