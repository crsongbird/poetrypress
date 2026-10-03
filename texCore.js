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

// ---------- scale: canonical pixels ----------
/**
 * S is the ratio of the canvas being drawn to the canonical export canvas:
 * 1 when exporting, smaller for a screen-sized preview. Generators measure in
 * CANONICAL pixels — the export's — and convert with cpx(n) = n × S, so a
 * texture drawn at any size looks like the export scaled.
 *
 * Set for the duration of one generation with withScale(S, fn), exactly as
 * withSeed does for randomness, so no generator's arguments change. It is 1
 * everywhere today: converting generators to cpx() is the next step, and at
 * S = 1 each converted line computes what it did before.
 */
let SCALE = 1;
export function withScale(s, fn){
  const prev = SCALE;
  SCALE = (s > 0 && isFinite(s)) ? s : 1;
  try { return fn(); }
  finally { SCALE = prev; }
}
/** The scale the current generation runs at. */
export function scaleNow(){ return SCALE; }
/** n canonical pixels, in pixels of the canvas being drawn. */
export function cpx(n){ return n * SCALE; }
/** The canvas's area in CANONICAL pixels. Counts written as (w*h)/K scale with
 *  the canvas — a small preview drew fewer sparkles, flakes and stars — so
 *  they use canonArea(w, h)/K: the same number at S = 1, the same COUNT at
 *  any size. */
export function canonArea(w, h){ return (w * h) / (SCALE * SCALE); }
/** A working-resolution divisor, kept in canonical cells. Textures built on a
 *  reduced grid (w/4, w/3…) got a COARSER grid when drawn small — the rake
 *  lines shimmered into moiré. canonDiv(4) is exactly 4 at S = 1 and shrinks
 *  with S, so the grid stays the export's grid at any size (never finer, so
 *  a preview never costs more than the export to compute). */
export function canonDiv(d){ return Math.max(1, d * SCALE); }

/**
 * The light's direction across the page, scaled by how LOW it is: 1 at the
 * horizon (raking light, the full shading — the only light there used to be),
 * 0 straight overhead, where nothing casts a slant. Set for one generation by
 * withLightTilt, as withScale and withSeed are.
 */
let LIGHT_TILT = 1;
export function withLightTilt(t, fn){
  const prev = LIGHT_TILT;
  LIGHT_TILT = (t >= 0 && t <= 1) ? t : 1;
  try { return fn(); }
  finally { LIGHT_TILT = prev; }
}
export function lightVec(light){
  const a = ((light == null ? 315 : light) - 90) * Math.PI / 180;
  return { lx: Math.cos(a) * LIGHT_TILT, ly: Math.sin(a) * LIGHT_TILT };
}

// ---------- light, like a game engine ----------
/**
 * Lights a HEIGHT field, the way a game engine lights a surface. A texture
 * describes its surface as heights (in pixels of the grid it is built on);
 * this returns it lit by the light dial:
 *   diffuse   the surface's facing toward the light (from the normals)
 *   specular  a highlight, as sharp as the material is glossy
 *   shadow    cast across the heights toward the light (soft-edged), longer as
 *             the light lowers; none when the light is straight overhead
 *   ao        ambient occlusion: crevices darken
 * Returns { light, spec } — two Float32Arrays, light already combining
 * ambient, diffuse, shadow and occlusion (about 0..1.3), spec 0..1.
 *
 *   opts.light      the dial's direction (degrees, as lightVec)
 *   opts.relief     scales the heights (steeper surfaces, deeper shade)
 *   opts.gloss      0 matte … 1 mirror-like: the highlight's sharpness and strength
 *   opts.shadow     0..1, how dark cast shadows are
 *   opts.ao         0..1, how dark crevices are
 *   opts.ambient    the light everything gets regardless (default 0.35)
 */
export function lightHeights(H, ww, wh, opts = {}){
  const { light = 315, relief = 1, gloss = 0.3, shadow = 0.6, ao = 0.35, ambient = 0.35 } = opts;
  const { lx, ly } = lightVec(light);
  const tilt = Math.min(1, Math.hypot(lx, ly));
  // toward the light: lightVec points the way light travels, so reverse it.
  // Its elevation runs from overhead (tilt 0) down to 12° above the horizon at
  // the dial's rim — raking, but never so low that open ground goes unlit.
  const elev = (90 - tilt*78) * Math.PI/180, horiz = Math.cos(elev), dirLen = tilt > 1e-6 ? tilt : 1;
  const Lx = -lx/dirLen*horiz, Ly = -ly/dirLen*horiz, Lz = Math.sin(elev);
  const hx = Lx, hy = Ly, hz = Lz + 1, hl = Math.hypot(hx, hy, hz) || 1;   // Blinn's half vector, viewer overhead
  const shininess = 4 + gloss*120, specK = 0.15 + gloss*0.85;
  const at = (x, y) => H[Math.min(wh-1, Math.max(0, y))*ww + Math.min(ww-1, Math.max(0, x))];
  const out = new Float32Array(ww*wh), spec = new Float32Array(ww*wh);
  // occlusion compares each height with its neighbourhood's (a box average)
  const R = 4, avg = new Float32Array(ww*wh);
  if(ao > 0){
    const tmp = new Float32Array(ww*wh);
    for(let y = 0; y < wh; y++){ let s = 0; for(let x = -R; x <= R; x++) s += at(x, y);
      for(let x = 0; x < ww; x++){ tmp[y*ww+x] = s/(2*R+1); s += at(x+R+1, y) - at(x-R, y); } }
    for(let x = 0; x < ww; x++){ let s = 0; for(let y = -R; y <= R; y++) s += tmp[Math.min(wh-1, Math.max(0, y))*ww+x];
      for(let y = 0; y < wh; y++){ avg[y*ww+x] = s/(2*R+1); s += tmp[Math.min(wh-1, y+R+1)*ww+x] - tmp[Math.max(0, y-R)*ww+x]; } }
  }
  const lxy = Math.hypot(Lx, Ly), stepX = lxy > 1e-6 ? Lx/lxy : 0, stepY = lxy > 1e-6 ? Ly/lxy : 0;
  const rise = lxy > 1e-6 ? Lz/lxy : 1e9;                 // how fast a ray toward the light climbs, per pixel
  // march as far as the tallest height can throw a shadow at this elevation
  let hMax = 0, hMin = Infinity; for(let i = 0; i < H.length; i++){ if(H[i] > hMax) hMax = H[i]; if(H[i] < hMin) hMin = H[i]; }
  const steps = Math.min(160, Math.ceil(((hMax - hMin)*relief)/Math.max(1e-6, rise)) + 2);
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
    const i = y*ww + x, h0 = H[i]*relief;
    const gx = (at(x+1, y) - at(x-1, y))*0.5*relief, gy = (at(x, y+1) - at(x, y-1))*0.5*relief;
    const nl = Math.hypot(gx, gy, 1), nx = -gx/nl, ny = -gy/nl, nz = 1/nl;
    const diffuse = Math.max(0, nx*Lx + ny*Ly + nz*Lz);
    // the cast shadow: march toward the light; anything rising above the ray blocks it
    let lit = 1;
    if(shadow > 0 && lxy > 0.02 && rise < 1e8){
      // long traces stride: soft shadows don't need every pixel
      const stride = Math.max(1, Math.ceil(steps/40));
      for(let k = stride; k <= steps; k += stride){
        const over = at(Math.round(x + stepX*k), Math.round(y + stepY*k))*relief - (h0 + rise*k);
        if(over > 0){ lit = Math.min(lit, Math.max(0, 1 - over*0.6)); if(lit === 0) break; }
      }
    }
    const occl = ao > 0 ? Math.max(0, Math.min(1, (avg[i] - H[i])*relief*0.25)) * ao : 0;
    out[i] = (ambient + (1 - ambient)*diffuse*(1 - shadow*(1 - lit))) * (1 - occl);
    const nh = Math.max(0, (nx*hx + ny*hy + nz*hz)/hl);
    spec[i] = Math.pow(nh, shininess)*specK*(0.35 + 0.65*lit);
  }
  return { light: out, spec };
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
