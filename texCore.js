/**
 * texCore.js — shared helpers for every texture.
 *
 * Noise grids, colour mixing, the seeded random source, and the small
 * conversions the generators share. No texture lives here.
 */

/**
 * Context options for every texture canvas: willReadFrequently keeps the
 * canvas in ordinary memory instead of on the GPU. Texture work reads pixels
 * back (tints, blend remaps, pixel-built textures), and on a GPU canvas each
 * read copies a whole 3072×3072 image off the graphics card and back. Chrome
 * puts canvases on the GPU by default — Firefox does not — and on a phone
 * those round trips were crashing the GPU. The visible preview stays on the
 * GPU, where drawing is fast; only these offscreen working canvases move.
 */
export const CPU = { willReadFrequently: true };

export function makeNoiseGrid(gw, gh){
  const g = new Float32Array(gw*gh);
  for(let i=0;i<g.length;i++) g[i] = Math.random();
  return g;
}

export function sampleNoiseGrid(grid, gw, gh, x, y){
  const x0 = ((Math.floor(x) % gw) + gw) % gw;
  const y0 = ((Math.floor(y) % gh) + gh) % gh;
  const x1 = (x0+1) % gw, y1 = (y0+1) % gh;
  const fx = x - Math.floor(x), fy = y - Math.floor(y);
  const sx = fx*fx*(3-2*fx), sy = fy*fy*(3-2*fy); // smoothstep
  const v00 = grid[y0*gw+x0], v10 = grid[y0*gw+x1];
  const v01 = grid[y1*gw+x0], v11 = grid[y1*gw+x1];
  const a = v00 + (v10-v00)*sx;
  const b = v01 + (v11-v01)*sx;
  return a + (b-a)*sy;
}

// Shared color helpers for textures that take on the current accent colors
// instead of a fixed palette (embers, magic particles, and astral's stars).
export function mixHex(hexA, hexB, t){
  const a = hexA.replace('#',''), b = hexB.replace('#','');
  const ar=parseInt(a.substr(0,2),16), ag=parseInt(a.substr(2,2),16), ab=parseInt(a.substr(4,2),16);
  const br=parseInt(b.substr(0,2),16), bg=parseInt(b.substr(2,2),16), bb=parseInt(b.substr(4,2),16);
  return {
    r: Math.round(ar+(br-ar)*t),
    g: Math.round(ag+(bg-ag)*t),
    b: Math.round(ab+(bb-ab)*t),
  };
}

export function darkenRgb(hex, amount){
  const h = hex.replace('#','');
  const r=parseInt(h.substr(0,2),16), g=parseInt(h.substr(2,2),16), b=parseInt(h.substr(4,2),16);
  return { r: Math.round(r*(1-amount)), g: Math.round(g*(1-amount)), b: Math.round(b*(1-amount)) };
}

// Seeded PRNG (mulberry32) so a given seed always produces the same texture
// pattern. Rather than threading an rng param through all 18+ generator
// functions, withSeed() temporarily substitutes the global Math.random for the
// duration of one texture generation call, then restores it — every generator
// still just calls Math.random() as before, it's transparently deterministic
// whenever it's actually needed.
export function mulberry32(seed){
  return function(){
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function withSeed(seed, fn){
  const original = Math.random;
  Math.random = mulberry32(seed >>> 0);
  try { return fn(); }
  finally { Math.random = original; }
}

export function lightVec(light){
  const a = ((light == null ? 315 : light) - 90) * Math.PI / 180;
  return { lx: Math.cos(a), ly: Math.sin(a) };
}

export function parseHex(hex){
  const m = mixHex(hex || '#808080', hex || '#808080', 0);
  return m;
}

/**
 * Which colour counts as "no change" for a blend mode.
 *   mid    overlay, soft-light, hard-light  -> mid-grey
 *   white  multiply, darken, color-burn     -> white
 *   black  screen, lighten, color-dodge     -> black
 */
export function blendFamily(blend){
  if(['multiply', 'darken', 'color-burn'].includes(blend)) return 'white';
  if(['screen', 'lighten', 'color-dodge', 'lighter'].includes(blend)) return 'black';
  return 'mid';
}

/**
 * The tint and the blend remap, in ONE pass over ONE canvas — the texture's
 * own, modified in place. They used to be two steps, each copying the whole
 * 3072px texture to a new canvas first; that was up to ~75 MB of short-lived
 * memory per texture change. The texture here was just generated and is not
 * cached yet, so changing it in place is safe.
 *
 * TINT: light marks move toward the light hue, dark marks toward the dark
 * hue; the exactly-mid ground is left alone. White and black are the
 * identity, so nothing changes until a hue is chosen.
 * REMAP: a grey ground is only "no change" for the overlay family. For
 * multiply-type blends 128 becomes white, for screen-type blends black, so
 * only the marks act (the Rorschach once blackened the page through burn).
 */
export function pixelPass(src, lightHex, darkHex, family){
  const L = mixHex(lightHex || '#FFFFFF', lightHex || '#FFFFFF', 0);
  const D = mixHex(darkHex || '#000000', darkHex || '#000000', 0);
  const lightIsWhite = L.r >= 250 && L.g >= 250 && L.b >= 250;
  const darkIsBlack = D.r <= 5 && D.g <= 5 && D.b <= 5;
  const tint = !!(lightHex || darkHex) && !(lightIsWhite && darkIsBlack);
  const remap = family === 'white' || family === 'black';
  if(!tint && !remap) return src;
  const o = src.getContext('2d', CPU);
  const img = o.getImageData(0, 0, src.width, src.height);
  const d = img.data;
  for(let i = 0; i < d.length; i += 4){
    if(tint){
      const v = (d[i] + d[i + 1] + d[i + 2]) / 3;
      if(v > 128){
        const k = (v - 128) / 127;
        d[i] = 128 + k * (L.r - 128); d[i + 1] = 128 + k * (L.g - 128); d[i + 2] = 128 + k * (L.b - 128);
      } else if(v < 128){
        const k = (128 - v) / 128;
        d[i] = 128 + k * (D.r - 128); d[i + 1] = 128 + k * (D.g - 128); d[i + 2] = 128 + k * (D.b - 128);
      }
    }
    if(remap){
      for(let c = 0; c < 3; c++){
        const v = d[i + c];
        d[i + c] = family === 'white'
          ? (v < 128 ? v * 2 : 255)            // darks stay, grey and lights vanish
          : (v > 128 ? (v - 128) * 2 : 0);     // lights stay, grey and darks vanish
      }
    }
  }
  o.putImageData(img, 0, 0);
  return src;
}
/** The tint alone (white over black is the identity: if(lightIsWhite && darkIsBlack) return src). */
export function tintMarks(src, lightHex, darkHex){ return pixelPass(src, lightHex, darkHex, null); }
/** The remap alone. */
export function remapNeutral(src, family){ return family === 'mid' ? src : pixelPass(src, null, null, family); }
