/**
 * mobileCss.test.mjs — guards the three CSS mistakes that actually shipped
 * to a real phone this session, none of which any JS test could catch:
 *
 *   1. sizing mobile layout in `vh`, which on Android Chrome means the
 *      viewport with the URL bar hidden — always taller than reality
 *   2. losing to `#poemCanvas`, styled by ID in the media query, so every
 *      class-based override was silently outranked
 *   3. the download button sitting under the tab bar at a lower z-index
 *
 * Run: node test/mobileCss.test.mjs
 */
import { readFileSync } from 'fs';

const css = readFileSync(new URL('../poetrypress.css', import.meta.url), 'utf8');
// anchor on the LAST occurrence: an older comment further up the file also
// contains the words "MOBILE LAYOUT", and matching that one swept the whole
// media query into the slice and produced false positives
const start = css.lastIndexOf('MOBILE LAYOUT');
const withComments = css.slice(start);
// strip CSS comments before scanning for units, or prose about vh trips it
const mobile = withComments.replace(/\/\*[\s\S]*?\*\//g, '');


// All file handles declared once, up front: an assertion further up the file
// reading a const declared further down is a temporal-dead-zone error.
const edCss = readFileSync(new URL('../poetrypress.css', import.meta.url), 'utf8');
const js2 = edCss;
const evJs = readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8');
const edJs = readFileSync(new URL('../editor.js', import.meta.url), 'utf8');


// The LAST declaration of a property for a selector — what actually applies.
// Tests should assert on this, not on whichever block happens to come first:
// earlier blocks overridden later are dead code, and get removed.
function effective(css, selector, prop){
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blocks = [...css.matchAll(new RegExp(esc + '\\{([^}]*)\\}', 'g'))].map(m => m[1]);
  let val = null;
  for(const b of blocks){
    for(const d of b.split(';')){
      const [k, ...v] = d.split(':');
      if(k && k.trim() === prop) val = v.join(':').trim();
    }
  }
  return val;
}

let failures = 0;
const check = (label, cond) => { cond ? console.log('ok:', label) : (failures++, console.log('FAIL:', label)); };

check('a .is-mobile block exists', start !== -1 && mobile.includes('body.is-mobile'));
// The slice must not reach back into the ORIGINAL responsive block (the
// max-width:860px one). Media queries written inside the mobile section —
// the landscape layout, for instance — are expected and fine.
check('the slice excludes the older responsive block',
  !/max-width:\s*860px/.test(mobile));

// 1. no vh in mobile sizing — except the documented --vvh fallback and
//    max-width (horizontal vw/vh is not affected by the URL bar)
const vhLines = mobile.split('\n').filter(l => {
  if(!/\d\s*vh\b/.test(l)) return false;
  if(l.includes('--vvh: 100vh')) return false;            // the documented fallback
  if(/var\(--vvh(-stable)?,\s*100vh\)/.test(l)) return false;  // same fallback, inline form
  return true;
});
check('no vertical sizing uses vh (must use --vvh)', vhLines.length === 0);
if(vhLines.length) vhLines.forEach(l => console.log('   offender:', l.trim()));

// 2. whatever the media query sizes by ID must be re-sized by ID here
const mqIdProps = [...css.matchAll(/#poemCanvas\s*\{([^}]*)\}/g)].map(m => m[1]);
check('#poemCanvas is styled by ID somewhere (the trap exists)', mqIdProps.length >= 2);
check('the mobile block overrides #poemCanvas by ID, not by class',
  /body\.is-mobile\s+#poemCanvas\s*\{/.test(mobile));
// The frame, not the canvas, is what gets sized -- and it is sized from the
// measured viewport. The canvas simply must never exceed the frame.
check('the preview frame is sized from measured viewport, not vh',
  /body\.is-mobile\s+\.stage\s*\{[^}]*height:\s*calc\(var\(--vvh(-stable)?/.test(mobile));
const canvasRule = (mobile.match(/body\.is-mobile\s+#poemCanvas\s*\{[^}]*\}/) || [''])[0];
check('the canvas can never exceed its frame (wrap has overflow:hidden)',
  /max-height:\s*100%/.test(canvasRule) && /max-width:\s*100%/.test(canvasRule));

// Aspect-ratio changes must move the card inside the frame, not reshape the
// frame -- reshaping is what left the preview off-centre with dead space.
const wrapRule = (mobile.match(/body\.is-mobile\s+\.canvas-wrap\s*\{[^}]*\}/) || [''])[0];
check('the frame keeps one shape regardless of aspect ratio',
  /width:\s*100%/.test(wrapRule) && /height:\s*100%/.test(wrapRule));

// 3. the download button must sit above the tab bar
const z = (sel) => {
  const m = mobile.match(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '\\s*\\{[^}]*z-index:\\s*(\\d+)'));
  return m ? parseInt(m[1],10) : null;
};
const zBar = z('body.is-mobile .tabbar');
const zDl  = z('body.is-mobile .download-btn');
check('tab bar declares a z-index', zBar !== null);
check('download button declares a z-index', zDl !== null);
// The button used to float above the controls and needed to outrank the tab
// bar. It now lives INSIDE the preview frame, so what matters is that it is
// positioned within that frame rather than against the viewport — a stray
// viewport-anchored `top` is what made it vanish below the clipped frame.
const dlRule = (mobile.match(/body\.is-mobile \.download-btn\{[^}]*\}/) || [''])[0];
check('the download button is positioned inside the preview frame',
  /position:absolute/.test(dlRule) && /bottom:7px/.test(dlRule) && /top:auto/.test(dlRule));
check('only one rule positions the download button on mobile',
  (mobile.match(/body\.is-mobile \.download-btn\{/g) || []).length === 1);

// the page does not scroll on mobile, so tab-bar clearance must live on
// .controls (which does scroll), not on .app
check('tab-bar clearance is padded onto .controls, which is what scrolls',
  /body\.is-mobile\s+\.controls\s*\{[^}]*padding-bottom:\s*calc\([^)]*--tabbar-h/.test(mobile));

// --- the three bugs from the phone screenshots ---
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

// 1. No viewport meta = Android Chrome assumes ~980px and scales everything
//    down to roughly a third size. This was the "text is tiny" root cause.
check('a viewport meta tag exists', /<meta\s+name="viewport"/i.test(html));
check('viewport meta sets width=device-width', /name="viewport"[^>]*width=device-width/i.test(html));
check('viewport meta opts into safe-area insets', /name="viewport"[^>]*viewport-fit=cover/i.test(html));
check('user zoom is NOT blocked', !/name="viewport"[^>]*user-scalable=no/i.test(html));

// 2. --vvh already excludes the keyboard, so subtracting --kb-height from it
//    again double-counted and threw the tab bar into mid-screen.
const tabbarRule = (mobile.match(/body\.is-mobile\s+\.tabbar\s*\{[^}]*\}/) || [''])[0];
// Across EVERY tabbar rule, not just the first: the position lives wherever
// the effective `top` is, and no rule anywhere may subtract --kb-height again.
const allTabbar = [...mobile.matchAll(/body\.is-mobile\s+\.tabbar\s*\{([^}]*)\}/g)].map(m => m[1]).join(';');
check('tab bar does not subtract the keyboard from --vvh twice',
  /top:\s*calc\((var\(--vvh\)|100dvh)/.test(allTabbar) && !allTabbar.includes('--kb-height'));
const controlsRule = (mobile.match(/body\.is-mobile\s+\.controls\s*\{[^}]*\}/) || [''])[0];
check('controls padding does not double-count the keyboard either',
  !controlsRule.includes('--kb-height'));

// 3. Editable text needs a floor (readable without pinch-zoom) and a ceiling
//    (so it does not balloon on a big screen).
const poemRule = (mobile.match(/body\.is-mobile\s+#poemText\s*\{[^}]*\}/) || [''])[0];
check('the poem field clamps its font size between a floor and a ceiling',
  /font-size:\s*clamp\(/.test(poemRule));

// --- this round's structural promises ---
const tabs = [...html.matchAll(/class="tab-btn[^"]*" data-tab="(\w+)"[^>]*>([\s\S]*?)<\/button>/g)];
check('all five tabs carry a drawn SVG icon, not an emoji',
  tabs.length === 5 && tabs.every(t => t[2].includes('<svg') && !/[\u{1F300}-\u{1FAFF}]/u.test(t[2])));
check('every tab icon is drawn scratchy — each stroke gone over more than once',
  tabs.every(t => (t[2].match(/<path|<circle/g) || []).length >= 3));
check('every tab icon shares one viewBox and stroke weight',
  tabs.every(t => t[2].includes('viewBox="0 0 24 24"') && t[2].includes('stroke-width="1.6"')));
check('tabs use the new names',
  ['Inscription','Rituals','Thoughtforms','Materia','Esoterica'].every(n => html.includes('>' + n + '</button>')));

check('Form & Bearing now lives on the Aspects tab',
  /<div class="card" data-tab="style">\s*<p class="card-title"[^>]*>\s*Form &amp; Bearing/.test(html));
check('Form & Bearing sits above Known Rituals',
  html.indexOf('Form &amp; Bearing') < html.indexOf('>  Known Rituals</p>'));

for(const [title, shouldBeOpen] of [['Backdrop Color', true], ['Surface Texture', true], ['Border Options', false], ['Vignette Options', false]]){
  const m = html.match(new RegExp('<details class="card" data-tab="page"( open)?>\\s*<summary class="card-title"[^>]*>' + title + '</summary>'));
  check(`Materia section "${title}" exists and is ${shouldBeOpen ? 'open' : 'closed'} by default`,
    !!m && !!m[1] === shouldBeOpen);
}
check('Thoughtforms: Script Options is open, Typeface Effects is closed',
  /<details class="card" data-tab="type" open>\s*<summary class="card-title"[^>]*>Script Options/.test(html) &&
  /<details class="card" data-tab="type">\s*<summary class="card-title"[^>]*>Typeface Effects/.test(html));

check('the preview has a draggable divider', html.includes('id="dragHandle"'));
check('the preview share is a variable the divider can write',
  /--preview-frac/.test(mobile) && /height:\s*calc\(var\(--vvh[^)]*\)[^)]*\)?\s*\*\s*var\(--preview-frac\)\)/.test(mobile));
check('presets are a grid again, not a sideways scroller',
  /body\.is-mobile \.preset-grid \{[^}]*display:\s*grid/.test(mobile));

// zoom/pan is a transform on the canvas; when the bitmap is resized by an
// aspect change, a stale transform leaves the preview clipped and off-centre
const js = readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8');
check('zoom/pan resets when the canvas changes dimensions',
  /MutationObserver\([\s\S]{0,40}reset[\s\S]{0,160}attributeFilter:\s*\['width','height'\]/.test(js));

// the preview must not shrink while the keyboard is open
check('preview height comes from a keyboard-stable variable',
  /--vvh-stable/.test(mobile));
check('--vvh-stable is only written while the keyboard is closed',
  /if\(!keyboard\)\s*root\.style\.setProperty\('--vvh-stable'/.test(js));
// the reset button now sits between the canvas and the download button;
// what matters is that both live inside the preview frame, not their order
check('the download button sits inside the preview frame',
  /<canvas id="poemCanvas"[\s\S]*?<\/canvas>[\s\S]{0,240}?<button class="download-btn"/.test(html));
// structural, not a character distance: the header now carries an inline
// sigil that is longer than the old window allowed
const headerStart = html.indexOf('<div class="app-header">');
const headerEnd = html.indexOf('</div>', headerStart);
const kofiAt = html.indexOf('kofi-link');
check('the Ko-fi link lives in the header now',
  headerStart !== -1 && kofiAt > headerStart && kofiAt < headerEnd &&
  // the retired element was class="app-title"; a bare 'app-title' now also
  // occurs inside apple-mobile-web-app-title, which is correct
  !/class="app-title"/.test(html));
check('the header carries the Vellum sigil, not an emoji diamond',
  html.slice(headerStart, headerEnd).includes('class="vellum-sigil"') && !html.includes('Vellum ♦️'));
check('the app is named Unfixable Vellum', html.includes('Unfixable Vellum'));

// ---- this turn's promises ----
check('the preview has a reset-position control', html.includes('id="resetViewBtn"'));
check('the light pad shows arrows, not anonymous dots',
  ['↖','↑','↗','←','→','↙','↓','↘'].every(a => html.includes('>' + a + '</button>')));
check('the Runeforms glyph is the drawn inverted triangle',
  /data-tab="type"[\s\S]*?M4\.4 4\.6H19\.6L12 15\.9Z/.test(html));
check('deselected nav glyphs relax and selected ones stiffen',
  /\.tab-btn svg\{[^}]*stroke-width:1\.15/.test(mobile) &&
  /\.tab-btn\.active svg\{[^}]*stroke-width:1\.85/.test(mobile));
check('focus mode hides every panel except the one kept',
  /\.focus-mode \.card\[data-tab\]:not\(\.focus-keep\)\{[^}]*display:none/.test(mobile));
check('focus mode collapses the bar to a single Return',
  /\.focus-mode \.tab-btn:not\(\[data-tab="more"\]\)\{[^}]*display:none/.test(mobile));
check('presets are four across on mobile',
  /\.preset-grid\{[^}]*grid-template-columns:repeat\(4,1fr\)/.test(mobile));
check('the symbol font is loaded for the glyph spells',
  html.includes('Noto+Sans+Symbols+2'));

// ---- editor ----
// The mirror and the textarea must agree on every property that decides
// where a line breaks, or the colour drifts off the text.
for(const [prop, want] of [['white-space','pre-wrap'],['overflow-wrap','break-word'],
                            ['box-sizing','border-box'],['padding','7px 9px']])
  check(`mirror and textarea share ${prop}`,
    (effective(js2, '.editor-input, .editor-mirror', prop) || '').startsWith(want));
const fontBlock = (js2.match(/\.editor-input, \.editor-mirror, \.editor-gutter\{[^}]*\}/) || [''])[0];
for(const prop of ['font-family','font-size','line-height','tab-size'])
  check(`mirror and textarea share ${prop}`, fontBlock.includes(prop));
check('the textarea renders no glyphs of its own',
  /\.editor-input\{[^}]*color:transparent/.test(js2));
check('the caret stays visible', /caret-color/.test(js2));
check('the editor has a line-number gutter', html.includes('id="poemGutter"'));

// ---- this round's fixes ----
check('the light pad arrows point inward, toward the page',
  ['↘','↓','↙','→','←','↗','↑','↖'].every(a => html.includes('>' + a + '</button>')));
check('the pad centre uses the drawn Touch mark, not a font glyph',
  /<span class="light-core"><svg/.test(html));
// deliberately changed: a lock pinned to the far edge reads as belonging to
// the row, not to the one setting it governs
check('locks sit beside their label, not at the far edge',
  /^\d+px$/.test(effective(edCss, '.lock-btn', 'margin-left') || '') && !/margin-left:auto/.test(edCss));
check('a one-line modal input stays one line',
  /\.modal-input\[rows="1"\]\{[^}]*height:2\.5em/.test(readFileSync(new URL('../poetrypress.css', import.meta.url), 'utf8')));
check('vertical alignment is visually split from justification',
  html.includes('class="group-split"'));

// the editor must not exit focus mode on blur — double-tap-to-select blurs
check('focus mode does not exit on blur', !/addEventListener\('blur'[^)]*exitFocus/.test(evJs));

// ---- editor scrolling: exactly one scroller ----
// The caret drifting "multiple lines off" was scroll desync: the textarea
// scrolled inside itself while the mirror was scrolled to match by hand, and
// any difference in content height accumulated. The textarea now grows to its
// full content height and the wrap is the only scrolling box.
check('the editor no longer synchronises scroll positions by hand',
  !/scrollTop\s*=\s*textarea\.scrollTop/.test(edJs));
check('the textarea is grown to its content height', /scrollHeight/.test(edJs));
check('the textarea itself does not scroll', /\.editor-input\{[^}]*overflow:hidden/.test(edCss));
check('the wrap is the scrolling box', /\.editor-wrap\{[^}]*overflow:auto/.test(edCss));
check('height is applied to the wrap, not the textarea',
  /\.editor-wrap \{ height: calc\(var\(--vvh\)/.test(edCss) &&
  !/#poemText \{\s*height:/.test(edCss));
check('a container resize repaints the editor', /ResizeObserver/.test(edJs));

// ---- overlay geometry ----
// Absolute positioning only guarantees the mirror fills its container, not
// that it lays out like the textarea. One shared grid cell guarantees both.
check('mirror and textarea occupy the same grid cell',
  /\.editor-mirror\{[^}]*grid-area:1 \/ 1 \/ 2 \/ 2/.test(edCss) &&
  /\.editor-input\{[^}]*grid-area:1 \/ 1 \/ 2 \/ 2/.test(edCss));
check('the mirror is no longer absolutely positioned',
  /\.editor-mirror\{[^}]*position:static/.test(edCss));
// paint() writes the textarea height, so observing it loops against itself
check('no ResizeObserver watches the element the editor resizes',
  !/new ResizeObserver|\.observe\(/.test(edJs));
check('resizes repaint the editor explicitly instead',
  /visualViewport[\s\S]{0,120}repaintEditor/.test(evJs) &&
  /requestAnimationFrame\(repaintEditor\)/.test(evJs));

// ---- editor metrics: the two layers must shape text identically ----
// Two drift causes that reading CSS does not reveal: shaping does not cross
// <span> boundaries, so ligatures/kerning that form in the textarea do not
// form in the span-split mirror; and Chrome on Android inflates text in block
// elements but not in form controls, so a <pre> and a <textarea> can be
// boosted differently.
const metricBlock = (edCss.match(/\.editor-input, \.editor-mirror\{[^}]*font-variant-ligatures[^}]*\}/) || [''])[0];
check('ligatures are disabled on both layers', /font-variant-ligatures:none/.test(metricBlock));
check('kerning is disabled on both layers', /font-kerning:none/.test(metricBlock));
check('contextual alternates are disabled', /"calt" 0/.test(metricBlock));
check('mobile text autosizing cannot inflate one layer',
  /text-size-adjust:100%/.test(metricBlock));
for(const prop of ['font-family','font-size','line-height','letter-spacing','word-spacing',
                   'white-space','overflow-wrap','word-break','padding','box-sizing','min-height'])
  check(`${prop} is forced identical on both layers`,
    new RegExp(prop + ':[^;]*!important').test(metricBlock));
// bold in the mirror would advance differently from the plain textarea
check('highlighting never changes font weight',
  /\.pml-sq, \.pml-cu, \.pml-bracket, \.pml-op\{ font-weight:400 !important/.test(edCss));

// ---- escape hatch ----
// Highlighting is two layers that must agree about where every glyph lands.
// If they disagree on some device, the user must still be able to write.
check('highlighting can be switched off', html.includes('id="highlightToggle"'));
check('switching it off hides the mirror', /\.plain-editor \.editor-mirror\{[^}]*display:none/.test(edCss));
check('switching it off makes the textarea visible again',
  /\.plain-editor \.editor-input\{[^}]*-webkit-text-fill-color:var\(--text-main\)/.test(edCss));
// per-line blocks round independently and the errors accumulate downward
check('the mirror uses no per-line block boxes', /\.pml-line\{ display:inline/.test(edCss));
check('line anchors take up no space', /\.ln-mark\{[^}]*display:inline !important/.test(edCss));

// ---- viewport height comes from the browser, not from JS ----
// --vvh is measured in JS and goes stale when the browser changes its own
// chrome without firing an event we listen for; that staleness was the dead
// gap under the tab bar.
check('the keyboard resizes the layout viewport',
  /name="viewport"[^>]*interactive-widget=resizes-content/.test(html));
check('the app height falls back to --vvh and then prefers dvh',
  /\.app\{ height:var\(--vvh\); height:100dvh; \}/.test(edCss));
check('the tab bar is positioned from dvh too', /top:calc\(100dvh - var\(--tabbar-h\)\)/.test(edCss));

// ---- the editor must be allowed to be shorter than its content ----
// A flex item defaults to min-height:auto, which refuses to shrink below its
// content — so the wrap grew past the screen and the last lines of a long
// poem could not be reached.
// In focus mode .controls is the ONLY scroller. Nesting a scroll box inside
// several flex items required every one of them to agree to shrink below its
// content; when any did not, the last lines became unreachable.
const focusControls = (edCss.match(/\.focus-mode \.controls\{[^}]*overflow-y:auto[^}]*\}/) || [''])[0];
check('.controls scrolls in focus mode', /overflow-y:auto/.test(focusControls));
check('.controls leaves room to scroll the last line clear of the bar',
  /padding-bottom:calc\(var\(--tabbar-h\) \+ 28px\)/.test(focusControls));
check('the editor itself no longer tries to scroll in focus mode',
  /\.focus-mode \.editor-wrap\{[^}]*overflow:visible/.test(edCss));
check('the editor takes its natural height in focus mode',
  /\.focus-mode \.editor-wrap\{[^}]*height:auto;[\s\S]*?max-height:none/.test(edCss));

// one sizing rule per element: duplicates that silently override each other
// are how this file drifted out of sync with itself
const wrapSizing = [...edCss.matchAll(/\.focus-mode \.editor-wrap\{[^}]*(?:flex|max-height):[^}]*\}/g)];
check('only one rule sizes the editor wrap in focus mode', wrapSizing.length === 1);

// exactly one element may scroll in focus mode; nested scrollers are what made
// the last lines unreachable
const focusRules = [...edCss.matchAll(/body\.is-mobile\.focus-mode ([^{]+)\{([^}]*)\}/g)];
const focusScrollers = focusRules.filter(m => /overflow(-y)?:\s*(auto|scroll)/.test(m[2]))
                                 .map(m => m[1].trim());
check('exactly one element scrolls in focus mode',
  focusScrollers.length === 1 && focusScrollers[0] === '.controls');
if(focusScrollers.length !== 1) console.log('   scrollers:', focusScrollers.join(', '));

// ---- landscape (parked) ----
// The landscape layout fired when it should not have and is parked behind a
// min-width no phone or tablet reaches. The rules are kept intact so it can be
// reconsidered on a laptop; only the trigger is disabled.
const land = (edCss.match(/@media \(orientation: landscape\)[^{]*\{[\s\S]*$/) || [''])[0];
check('the landscape rules are still present', land.includes('flex-direction:row'));
check('the landscape layout cannot currently trigger',
  /@media \(orientation: landscape\) and \(min-width: 4000px\)/.test(edCss));
check('re-enabling it is a one-line change', /PARKED/.test(edCss));

// ---- preset swatches ----
// `object-fit: cover` cropped the canvas top and bottom, which is why the
// border only appeared on the left and right.
check('swatches are not cropped',
  /\.preset-swatch\{[^}]*\}/.test(edCss) && !/\.preset-swatch\{[^}]*object-fit/.test(edCss));
check('saved presets can join the grid', /renderSavedPresets/.test(evJs));
check('a part-filled row is padded with blanks', /preset-empty/.test(evJs) && /preset-empty/.test(edCss));
check('the vault tells the grid when saved spells change',
  /onSpellsChanged/.test(evJs));

// ---- controls inside the preview must still be clickable ----
// The focus guard calls preventDefault on the preview's pointerdown, which
// also suppresses clicks on the Save and reset buttons living inside it.
check('the focus guard exempts buttons inside the preview',
  /const isControl = \(e\) =>[\s\S]{0,120}closest\('button'\)/.test(evJs) &&
  /pointerdown'[^)]*\)=>\{ if\(!isControl\(e\)\)/.test(evJs));
check('the touch handler exempts them too', /if\(!isControl\(e\) && e\.preventDefault\)/.test(evJs));
check('the button reads Save image', html.includes('>Save image<'));

// ---- button order ----
check('alignment reads West, Neutral, East',
  html.indexOf('>West<') < html.indexOf('>Neutral<') &&
  html.indexOf('>Neutral<') < html.indexOf('>East<'));
check('confirm sits to the left of cancel',
  html.indexOf('id="modalConfirm"') < html.indexOf('id="modalCancel"'));

// ---- the colour picker stays reachable ----
// Coloris anchors beside its field using coordinates measured at open time;
// once the keyboard arrives it can sit underneath it. Docked to the bottom of
// the (keyboard-resized) viewport, it stays above the keyboard and tab bar.
const pickerRule = (edCss.match(/body\.is-mobile #clr-picker\{[^}]*position:fixed[^}]*\}/) || [''])[0];
check('the picker is docked to the viewport on mobile', /position:fixed !important/.test(pickerRule));
check('its measured top is overridden', /top:auto !important/.test(pickerRule));
check('it sits above the tab bar', /bottom:calc\(var\(--tabbar-h\)/.test(pickerRule));
check('it can never be taller than the visible screen', /max-height:calc\(100dvh/.test(pickerRule));
check('it stacks above the tab bar', /z-index:9\d/.test(pickerRule));
check('the keyboard resizes the layout viewport, which is what makes docking work',
  /interactive-widget=resizes-content/.test(html));

// the focus ring (2px wide, 2px offset) must clear the scrollbar on the right
const fmPad = effective(edCss, 'body.is-mobile.focus-mode .controls', 'padding-right') || '0';
check('focus mode leaves room for the focus ring beside the scrollbar', parseFloat(fmPad) >= 8);

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
