/**
 * borders.test.mjs — ostentatious borders, the richer vignette, and themes.
 *
 * Run: node test/borders.test.mjs
 */
import { readFileSync } from 'fs';
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';

installCanvasMock();
installDomMock(makeMockContext, makeMockCanvas);
await import('../appEvents.js');
const { PRESETS } = await import('../appOptions.js');

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };

const cr = readFileSync(new URL('../canvasRenderer.js', import.meta.url), 'utf8');
const ev = readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../poetrypress.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const border = (cr.match(/if\(\$\('borderToggle'\)\.checked\)\{[\s\S]*?\n  \}/) || [''])[0];
const vig = (cr.match(/if\(\$\('vignetteToggle'\)\.checked\)\{[\s\S]*?\n  \}/) || [''])[0];

// ---- borders ----
check('a border can be a radial gradient', /createRadialGradient/.test(border));
check('the gradient takes multiple stops', /stops\.forEach/.test(border));
// match real usage, not the comment explaining why it is not used
check('bloom is drawn as widening passes, not shadowBlur',
  /globalCompositeOperation = 'lighter'/.test(border) && !/ctx\.shadowBlur\s*=/.test(border));
// the constant moved into tunables.js; what matters is that it still divides
check('bloom fades with each pass', /\(bloom \* EFFECTS\.bloomAlpha\) \/ i/.test(border));
const { EFFECTS } = await import('../tunables.js');
check('the bloom tunables are sane',
  EFFECTS.bloomPasses >= 1 && EFFECTS.bloomAlpha > 0 && EFFECTS.bloomAlpha < 1);
check('the state is put back afterwards',
  /ctx\.save\(\)/.test(border) && /ctx\.restore\(\)/.test(border));

// ---- vignette ----
check('aperture moves where the falloff begins', /outerR\*aperture\*0\.9/.test(vig));
check('the centre can be moved off-axis', /vignetteCx/.test(vig) && /vignetteCy/.test(vig));
check('an off-centre vignette still reaches the furthest corner',
  /Math\.max\(\s*Math\.hypot\(vcx, vcy\)/.test(vig));
check('grit gathers where the vignette is strongest', /falloff \* intensity \* grit/.test(vig));
check('grit skips the clear middle', /if\(d < aperture\) continue;/.test(vig));

// ---- every new control persists ----
// persisted through the PERSISTED table; persistence.test.mjs proves the
// table actually round-trips by saving, loading and saving again
const table = (ev.match(/const PERSISTED = \[([\s\S]*?)\];/) || ['', ''])[1];
for(const key of ['borderGradientToggle','borderColor2','borderColor3','borderBloom',
                  'vignetteAperture','vignetteCx','vignetteCy','vignetteNoise'])
  check(`"${key}" survives save/load`, new RegExp("\\['" + key + "',").test(table));

// ---- the duplicate seed control is gone ----
check('Seal Seed is gone from the markup', !html.includes('textureSeedLock'));
check('nothing still reads it', !ev.includes('textureSeedLock'));
check('the seed field\'s lock does that job now',
  /locked\.has\('textureSeedValue'\)/.test(ev));

// ---- presets ----
const gate = PRESETS.find(p => p.name === 'Gateway');
check('Gateway exists and blooms', gate && gate.borderBloom > 50 && gate.borderGradient);
check('Gateway\'s border has three stops',
  gate && gate.borderColor && gate.borderColor2 && gate.borderColor3);
const hour = PRESETS.find(p => p.name === 'Hourglass');
check('Rewind was replaced by Hourglass', !!hour && !PRESETS.some(p => p.name === 'Rewind'));
// whimsy is red, purple AND blue; the set leaned entirely on purple
check('Hourglass uses whimsy\'s neglected red and blue',
  hour && /^#FF/i.test(hour.accent1) && /^#6F/i.test(hour.accent2));

// ---- themes ----
check('four themes are defined',
  ['rose','aether','fathom','vellum'].every(t => css.includes(`[data-theme="${t}"]`)));
check('the navigation bar follows the theme',
  /\.tabbar\{[^}]*var\(--bg-panel\)/.test(css));
check('the header follows the theme too',
  /\.app-header\{[^}]*var\(--bg-panel\)/.test(css));
check('no hardcoded violet is left in the bar', !/rgba\(24,20,38/.test(css));
// Cinder may warm and brighten, but it must stay the darkest theme — measured
// as relative luminance, not pinned to one hex value
const lum = h => { const n = parseInt(h.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0); };
const deep = t => (css.match(new RegExp('\\[data-theme="' + t + '"\\]\\{[^}]*--bg-deep:(#[0-9a-fA-F]{6})')) || [])[1];
// Rosé uses the Faded Rosewood palette Ruby supplied, which replaced the
// earlier "stay the darkest theme" rule — its 161414 is lighter than Fathom's
// ground. What must hold now is that the palette is the one specified.
// Rosé: Faded Rosewood, deepened for contrast at Ruby's request — the ground
// darker than the palette's 161414, the steps above it darkened less
check('Rosé is Faded Rosewood, deepened', lum(deep('rose')) < lum('#161414'));
check('Rosé\'s pinks are more saturated than before',
  /\[data-theme="rose"\]\{[^}]*--accent:#e79cb1/.test(css));
check('in every theme the selected tab has its own, more saturated colour',
  ['rose','aether','fathom','vellum'].every(t => new RegExp('\\[data-theme="' + t + '"\\]\\{[^}]*--ui-selected:#').test(css)) &&
  /\.tab-btn\.active svg\{ color:var\(--ui-selected/.test(css));
check('dark themes stay darker than light ones',
  ['rose','aether','fathom'].every(t => lum(deep(t)) < lum(deep('vellum'))));
// every theme's primary button text must be legible on its accent
const tok = (t, k) => (css.match(new RegExp('\\[data-theme="' + t + '"\\]\\{[^}]*' + k + ':(#[0-9a-fA-F]{6})')) || [])[1];
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
for(const t of ['rose','aether','fathom','vellum'])
  check(`${t}: button text meets 4.5:1 on its accent`, contrast(tok(t, '--accent'), tok(t, '--on-accent')) >= 4.5);
check('the button reads its text colour from the theme', /color:var\(--on-accent/.test(css));

// Cinder left the gold-and-violet reflex: dusty pink accents, a light faded
// pink for the nav highlight

// a browser that saved the theme under its old name keeps it
const thSrc = readFileSync(new URL('../theme.js', import.meta.url), 'utf8');
check('a saved "cinder" choice becomes Rosé rather than being lost',
  /RENAMED = \{ cinder: 'rose' \}/.test(thSrc) && /name = RENAMED\[name\] \|\| name/.test(thSrc));

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
