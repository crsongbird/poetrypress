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
import { setGpuLight, setGpuPasses, setGpuSoftware, setGridCap } from './texCore.js';
import { ringGpuInit, setRingGpu, ringGpuReady } from './ringGpu.js';

// (the Ringworld's land on WebGPU, opened once as the worker starts; until it is open the canvas draws it)
ringGpuInit();

// the generators make canvases with document.createElement; here, OffscreenCanvas
if(typeof document === 'undefined') globalThis.document = { createElement: () => new OffscreenCanvas(1, 1) };

self.onmessage = (e) => {
  const { id, type, w, h, opts, softgl, cpuland } = e.data;
  // ?softgl in the page's address: software WebGL is allowed, so a machine without a GPU can test the GPU path
  if(softgl) setGpuSoftware(true);
  // ?cpuland: the Ringworld's land drawn on the canvas, not WebGPU (to compare); ?softgl lets WebGPU run in software too
  setRingGpu(!cpuland && !(opts && opts.cpuLight), !!softgl); ringGpuInit();
  try {
    // cpuLight: light (and run the graph's GPU passes) on the CPU even where the GPU is there (to compare, or as a fallback)
    setGpuLight(!(opts && opts.cpuLight)); setGpuPasses(!(opts && opts.cpuLight));
    // gridCap: a phone short of memory (Firefox's) works graphs on a smaller grid (texCore setGridCap)
    setGridCap(opts && opts.gridCap);
    const canvas = getTextureCanvas(type, w, h, opts);
    clearTextureCache();                         // the page caches; a transferred canvas is emptied
    const bitmap = canvas.transferToImageBitmap();
    // (and, for the Ringworld, whether WebGPU drew it: the film sheet says so)
    self.postMessage({ id, bitmap, ...(type === 'ringpaint' ? { gpu: ringGpuReady() } : {}) }, [bitmap]);
  } catch(err){
    self.postMessage({ id, error: String((err && err.message) || err) });
  }
};
