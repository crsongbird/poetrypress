/**
 * theme.js — which of the four UI themes is showing.
 *
 * Kept out of the settings JSON on purpose: a theme is how YOU like the app
 * to look, not part of a saved page, so it lives in its own localStorage key
 * and never travels with an exported spell.
 */
import { $ } from './appOptions.js';
import { THEME_NOTES } from './strings.js';
import { setThemeColor } from './pwa.js';

export const THEME_KEY = 'uv.theme.v1';
export const DEFAULT_THEME = 'rose';
/** Themes that were renamed. A browser that saved the old name keeps its
 *  choice rather than silently falling back to the default. */
const RENAMED = { cinder: 'rose' };

/** The ground colour of each theme, for the OS title bar. */
const THEME_CHROME = { rose:'#161414', aether:'#100e16', fathom:'#070d14', vellum:'#d8cec0' };

/** Shows a theme, updates the picker and its note, and remembers the choice. */
export function applyTheme(name){
  name = RENAMED[name] || name;
  const theme = Object.keys(THEME_NOTES).includes(name) ? name : DEFAULT_THEME;
  if(document.documentElement && document.documentElement.setAttribute){
    document.documentElement.setAttribute('data-theme', theme);
  }
  if($('uiTheme')) $('uiTheme').value = theme;
  if($('themeNote')) $('themeNote').textContent = THEME_NOTES[theme];
  // the installed app's title bar follows the theme's own ground
  setThemeColor(THEME_CHROME[theme]);
  try { localStorage.setItem(THEME_KEY, theme); } catch(e){ /* private mode */ }
}

/** The remembered theme, or the default when storage is unavailable. */
export function savedTheme(){
  try { return localStorage.getItem(THEME_KEY) || DEFAULT_THEME; }
  catch(e){ return DEFAULT_THEME; /* private mode */ }
}
