/**
 * themes.test.mjs — the app's own themes (Rosé, Aether, Fathom, Vellum): what
 * each must hold, and that a theme is this browser's preference, remembered
 * on its own and never carried in a look (AGENTS.md §5.4, §11 Colour).
 *
 * Run: node test/themes.test.mjs
 */
import { readFileSync } from 'fs';
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';
import { check, done } from './harness.mjs';

installCanvasMock();
const reg = installDomMock(makeMockContext, makeMockCanvas);
await import('../appEvents.js');
const Th = await import('../theme.js');

const css = readFileSync(new URL('../poetrypress.css', import.meta.url), 'utf8');
const THEMES = ['rose', 'aether', 'fathom', 'vellum'];

// ---- what each theme holds ----
check('four themes are defined', THEMES.every(t => css.includes(`[data-theme="${t}"]`)));
check('the navigation bar and the header follow the theme',
  /\.tabbar\{[^}]*var\(--bg-panel\)/.test(css) && /\.app-header\{[^}]*var\(--bg-panel\)/.test(css));
const lum = h => { const n = parseInt(h.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0); };
const tok = (t, k) => (css.match(new RegExp('\\[data-theme="' + t + '"\\]\\{[^}]*' + k + ':(#[0-9a-fA-F]{6})')) || [])[1];
// Rosé: the Faded Rosewood palette Ruby supplied, its ground deepened for contrast, its pinks a touch redder
check('Rosé is Faded Rosewood, deepened, its pinks saturated and a little red',
  lum(tok('rose', '--bg-deep')) < lum('#161414') && tok('rose', '--accent') === '#e2899f' && tok('rose', '--ui-selected') === '#ff6b92');
check('in every theme the selected tab has its own, more saturated color',
  THEMES.every(t => tok(t, '--ui-selected')) && /\.tab-btn\.active svg\{ color:var\(--ui-selected/.test(css));
check('the dark themes stay darker than the light one', ['rose', 'aether', 'fathom'].every(t => lum(tok(t, '--bg-deep')) < lum(tok('vellum', '--bg-deep'))));
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
for(const t of THEMES) check(`${t}: a button's text meets 4.5:1 on its accent`, contrast(tok(t, '--accent'), tok(t, '--on-accent')) >= 4.5);
check('a button reads its text color from the theme', /color:var\(--on-accent/.test(css));

// ---- a preference of this browser, never part of a look ----
// (a browser's storage, in memory: the mock has none)
{ const m = new Map(); globalThis.localStorage = { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; }
Th.applyTheme('fathom');
check('a theme chosen is remembered', Th.savedTheme() === 'fathom' && reg['uiTheme'].value === 'fathom');
reg['advancedRefreshBtn'].dispatchEvent({ type: 'click' });
const look = JSON.parse(reg['advancedJson'].value);
check('no look carries the theme (a spell or a shared link never changes it)', !Object.keys(look).some(k => /theme/i.test(k)) && !JSON.stringify(look).includes('fathom'));
Th.applyTheme('cinder');
check('a choice saved under an old name (Cinder) becomes its successor (Rosé)', Th.savedTheme() === 'rose');
Th.applyTheme('no such theme');
check('an unknown theme is the default', Th.savedTheme() === Th.DEFAULT_THEME);
{ const real = globalThis.localStorage;
  globalThis.localStorage = { getItem(){ throw new Error('blocked'); }, setItem(){ throw new Error('blocked'); } };
  let ok = true; try { Th.applyTheme('aether'); ok = Th.savedTheme() === Th.DEFAULT_THEME; } catch(e){ ok = false; }
  globalThis.localStorage = real;
  check('a browser with storage switched off still themes (and falls back to the default)', ok); }

done();
