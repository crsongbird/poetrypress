/**
 * textureWorker.js — makes textures on a thread of its own, so the page stays
 * responsive while a heavy texture (Moss on Stone, Rain on Glass…) is built.
 *
 * It runs the very same generators as the page (textureGenerators.js), on
 * OffscreenCanvas, and hands each finished texture back as an ImageBitmap —
 * transferred, not copied. The page keeps the cache (textureService.js);
 * this side forgets everything after each texture.
 *
 * Built into the page by build.mjs (inline, as a Blob worker); served from
 * the source files it runs as a module worker.
 */
import { getTextureCanvas, clearTextureCache } from './textureGenerators.js';
import { setGpuLight } from './texCore.js';

// the generators make canvases with document.createElement; here, OffscreenCanvas
if(typeof document === 'undefined') globalThis.document = { createElement: () => new OffscreenCanvas(1, 1) };

self.onmessage = (e) => {
  const { id, type, w, h, opts } = e.data;
  try {
    // cpuLight: light on the CPU even where the GPU is there (to compare, or as a fallback)
    setGpuLight(!(opts && opts.cpuLight));
    const canvas = getTextureCanvas(type, w, h, opts);
    clearTextureCache();                         // the page caches; a transferred canvas is emptied
    const bitmap = canvas.transferToImageBitmap();
    self.postMessage({ id, bitmap }, [bitmap]);
  } catch(err){
    self.postMessage({ id, error: String((err && err.message) || err) });
  }
};
