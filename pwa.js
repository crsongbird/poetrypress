/**
 * pwa.js — registers the service worker, where one can run.
 *
 * Service workers only exist on https (or localhost). Opened as a local file
 * — file://, or content:// from a phone's downloads — there is nothing to
 * register, and the app simply runs without offline support.
 */
export function registerServiceWorker(){
  if(typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
  const secure = typeof location !== 'undefined' &&
    (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  if(!secure) return false;
  const go = () => navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is a bonus */ });
  if(document.readyState === 'complete') go(); else window.addEventListener('load', go);
  return true;
}

/** Keeps the browser/OS chrome colour matched to the chosen theme. */
export function setThemeColor(hex){
  const meta = document.querySelector && document.querySelector('meta[name="theme-color"]');
  if(meta && hex) meta.setAttribute('content', hex);
}
