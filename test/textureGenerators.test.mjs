/**
 * textureGenerators.test.mjs — smoke tests for every texture, run with
 * plain `node test/textureGenerators.test.mjs` from the project root.
 *
 * Not a visual test (see canvasMock.mjs for why) — this checks that every
 * texture in the menu generates without throwing at a tiny size, that a few
 * draw at the app's real production sizes, and that the cache stays bounded
 * however many textures are made. (That each draws what it drew is the
 * fingerprints' job, at their own size.) The types come from the registry, so
 * a new surface is covered the day it lands and a retired one never lingers;
 * the seeds are fixed, so a failure is the same failure on the next run.
 */
import { installCanvasMock } from './canvasMock.mjs';
installCanvasMock();

const { getTextureCanvas, clearTextureCache, textureCacheMB, TEXTURE_PARAMS } = await import('../textureGenerators.js');
const { TEXTURES } = await import('../tunables.js');

// every surface in the registry (the Athanor's own included), once, tiny; and the production sizes for three cheap ones
const TINY = Object.keys(TEXTURE_PARAMS).map(t => [t, 64, 64]);
const LARGE = ['grain', 'linen', 'snow'].flatMap(t => [[t, 3072, 3072], [t, 2304, 4096]]);

let failures = 0, total = 0;
for(const [type, w, h] of [...TINY, ...LARGE]){
  const seed = 1000 + total++;
  try{
    const canvas = getTextureCanvas(type, w, h, { accent1: '#c9a876', accent2: '#7a8ca3', seed });
    if(!canvas || canvas.width !== w || canvas.height !== h) throw new Error('unexpected canvas dimensions');
  } catch(e){
    failures++;
    console.log(`FAIL [${type}] seed=${seed} size=${w}x${h}: ${e.message}`);
  }
}
console.log(`${failures ? 'FAIL' : 'ok'}: every one of ${TINY.length} textures generates at 64 px, and ${LARGE.length/2} at both production sizes`);

// --- the cache stays bounded ---
// Generate twice the cache's cap with distinct sizes (each one a genuinely new
// cache key): it keeps at most TEXTURES.cacheEntries of them, the newest.
const N = TEXTURES.cacheEntries*2, largest = 100 + N - 1;
let evictionThrew = null;
clearTextureCache();
try {
  for(let i=0;i<N;i++) getTextureCanvas('grain', 100+i, 100+i, { seed: i });
} catch(e){ evictionThrew = e; }
const cap = TEXTURES.cacheEntries*largest*largest*4/1e6;   // (all N kept would be past it)
const held = textureCacheMB();
const bounded = !evictionThrew && held > 0 && held <= cap;
if(!bounded) failures++;
console.log(`${bounded ? 'ok' : 'FAIL'}: ${N} distinct textures past the cache's cap of ${TEXTURES.cacheEntries}: it holds ${held.toFixed(2)} MB, no more than its newest ${TEXTURES.cacheEntries}${evictionThrew ? ' (threw: ' + evictionThrew.message + ')' : ''}`);

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
