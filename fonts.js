/**
 * fonts.js — typefaces are fetched the first time something is drawn in them.
 *
 * The app used to force every family in every weight to download at startup
 * (33 families × 4 = 132 requests) whether or not it was ever used. Now the
 * renderer asks for the faces a render actually needs — the page font, any
 * /f:N segment font in the poem, the code font — and each family is fetched
 * once. When one arrives, `onReady` re-measures and redraws, so the page
 * never keeps a size fitted against the fallback font's metrics.
 */
const requested = new Map();              // family -> Promise
export function ensureFonts(defs, onReady){
  if(typeof document === 'undefined' || !document.fonts || !document.fonts.load) return;
  for(const f of defs){
    if(!f || !f.family || requested.has(f.family)) continue;
    const faces = [`${f.weight || 400} 40px`, '700 40px', `italic ${f.weight || 400} 40px`, 'italic 700 40px'];
    const p = Promise.all(faces.map(face => document.fonts.load(`${face} "${f.family}"`).catch(() => {})));
    requested.set(f.family, p);
    p.then(() => { if(onReady) onReady(); });
  }
}
/** How many families have been requested so far (for §Fonts). */
export function fontsRequested(){ return requested.size; }
