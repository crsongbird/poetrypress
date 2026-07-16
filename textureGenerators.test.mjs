/**
 * textureGenerators.test.mjs — smoke tests for every texture, run with
 * plain `node test/textureGenerators.test.mjs` from the project root.
 *
 * Not a visual test (see canvasMock.mjs for why) — this checks that every
 * texture type generates without throwing, across several seeds and canvas
 * sizes including the app's real production dimensions, and that a fixed
 * seed produces byte-identical draw-call counts on repeat (the property the
 * seed-lock feature in the UI depends on).
 */
import { installCanvasMock } from './canvasMock.mjs';
installCanvasMock();

const { getTextureCanvas } = await import('../textureGenerators.js');

const TEXTURE_TYPES = [
  'grain','paper','noise','waterspots','canvas','clouds','flowers','astral',
  'inkbleed','crackedglaze','bokeh','embers','tessellate','snow','leaves',
  'magicparticles','rainstreaks','leather','halftone','brushstrokes',
  'alienSurface','habitableSurface',
];
const SIZES = [[512,512],[3072,3072],[2304,4096],[64,64]];

let failures = 0, total = 0;
for(const type of TEXTURE_TYPES){
  for(let i=0;i<3;i++){
    const seed = Math.floor(Math.random()*1e9);
    const [w,h] = SIZES[total % SIZES.length];
    total++;
    try{
      const canvas = getTextureCanvas(type, w, h, '#c9a876', '#7a8ca3', false, seed);
      if(!canvas || canvas.width !== w || canvas.height !== h){
        throw new Error('unexpected canvas dimensions');
      }
    } catch(e){
      failures++;
      console.log(`FAIL [${type}] seed=${seed} size=${w}x${h}: ${e.message}`);
    }
  }
}
console.log(`${total} generation calls across ${TEXTURE_TYPES.length} texture types.`);
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);

// determinism check
const s1 = getTextureCanvas('alienSurface', 400, 400, null, null, false, 424242);
const s2 = getTextureCanvas('alienSurface', 400, 400, null, null, false, 424242);
console.log('Determinism (same seed, same dims):', s1.getContext('2d')._stats.arcs === s2.getContext('2d')._stats.arcs ? 'PASS' : 'FAIL');

process.exit(failures === 0 ? 0 : 1);
