/**
 * textureGenerators.test.mjs — smoke tests for every texture, run with
 * plain `node test/textureGenerators.test.mjs` from the project root.
 *
 * Not a visual test (see canvasMock.mjs for why) — this checks that every
 * texture type generates without throwing, across several seeds and canvas
 * sizes including the app's real production dimensions, and that the cache
 * stays bounded however many textures are made. (That a fixed seed draws the
 * same texture every time is the fingerprints' job: they would change.)
 * Slow (longer than half a minute): it renders every texture, at several sizes and seeds.
 */
import { installCanvasMock } from './canvasMock.mjs';
installCanvasMock();

const { getTextureCanvas, clearTextureCache, textureCacheMB } = await import('../textureGenerators.js');
const { TEXTURES } = await import('../tunables.js');

const TEXTURE_TYPES = [
  'clouds','bokeh','astral','magicparticles','embers','snow',
  'grain','metalleaf','flowers','brushstrokes','halftone','rainstreaks',
  'sigils','mathnoise','summoning','inkbleed','crackedglaze','tessellate',
  'aurora','hatch','cards',
  'linen','coldpress','crystal','spangle','oldpaper','cupring','wax','whorl','ash','turing','frost','guilloche','chladni','contour','flowfield','stainedglass','suminagashi','watercolour','athanor',
];
const SIZES = [[512,512],[3072,3072],[2304,4096],[64,64]];

let failures = 0, total = 0;
for(const type of TEXTURE_TYPES){
  for(let i=0;i<3;i++){
    const seed = Math.floor(Math.random()*1e9);
    const [w,h] = SIZES[total % SIZES.length];
    total++;
    try{
      const canvas = getTextureCanvas(type, w, h, { accent1: '#c9a876', accent2: '#7a8ca3', seed });
      if(!canvas || canvas.width !== w || canvas.height !== h){
        throw new Error('unexpected canvas dimensions');
      }
    } catch(e){
      failures++;
      console.log(`FAIL [${type}] seed=${seed} size=${w}x${h}: ${e.message}`);
    }
  }
}
console.log(`${failures ? 'FAIL' : 'ok'}: ${total} generation calls across ${TEXTURE_TYPES.length} texture types, at every size`);

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
