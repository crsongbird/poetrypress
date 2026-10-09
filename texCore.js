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

// ---------- the same lighting on the GPU (WebGL2) ----------
// One fragment shader per pixel: the normal, diffuse, Blinn's highlight, the
// cast-shadow march and the occlusion box — line for line what lightHeights
// does on the CPU. Heights go up as a float texture; light and highlight come
// back packed 16 bits each. Where WebGL2 isn't there (Node, a browser that
// declines it) the CPU path runs as before.
const LIGHT_FRAG = `#version 300 es
precision highp float; precision highp int;
uniform highp sampler2D uH;
uniform ivec2 uSize; uniform vec3 uL, uHalf;
uniform float uRelief, uShine, uSpecK, uShadow, uAO, uAmbient, uRise, uStepX, uStepY;
uniform int uSteps, uStride, uDoShadow, uR, uHasN, uMode;
uniform highp sampler2D uN;
out vec4 o;
float at(ivec2 p){ p = clamp(p, ivec2(0), uSize - 1); return texelFetch(uH, p, 0).r; }
void main(){
  ivec2 p = ivec2(gl_FragCoord.xy);
  float h0 = at(p)*uRelief;
  float gx = (at(p + ivec2(1,0)) - at(p - ivec2(1,0)))*0.5*uRelief;
  float gy = (at(p + ivec2(0,1)) - at(p - ivec2(0,1)))*0.5*uRelief;
  if(uHasN == 1){ vec3 dn = texelFetch(uN, p, 0).xyz; float dz = max(dn.z, 0.05); gx -= dn.x/dz; gy -= dn.y/dz; }
  float nl = sqrt(gx*gx + gy*gy + 1.0);
  vec3 n = vec3(-gx/nl, -gy/nl, 1.0/nl);
  float diffuse = max(0.0, dot(n, uL));
  float lit = 1.0;
  if(uDoShadow == 1){
    for(int k = uStride; k <= uSteps; k += uStride){
      ivec2 q = ivec2(floor(vec2(p) + vec2(uStepX, uStepY)*float(k) + 0.5));
      float over = at(q)*uRelief - (h0 + uRise*float(k));
      if(over > 0.0){ lit = min(lit, max(0.0, 1.0 - over*0.6)); if(lit == 0.0) break; }
    }
  }
  float occl = 0.0;
  if(uAO > 0.0){
    float s = 0.0;
    for(int dy = -uR; dy <= uR; dy++) for(int dx = -uR; dx <= uR; dx++) s += at(p + ivec2(dx, dy));
    float avg = s/float((2*uR + 1)*(2*uR + 1));
    occl = clamp((avg - at(p))*uRelief*0.25, 0.0, 1.0)*uAO;
  }
  float light = (uAmbient + (1.0 - uAmbient)*diffuse*(1.0 - uShadow*(1.0 - lit)))*(1.0 - occl);
  float nh = max(0.0, dot(n, uHalf));
  float spec = pow(nh, uShine)*uSpecK*(0.35 + 0.65*lit);
  float dsh = diffuse*(1.0 - uShadow*(1.0 - lit));
  float a = uMode == 1 ? clamp(dsh, 0.0, 1.0)*65535.0 : clamp(light*0.5, 0.0, 1.0)*65535.0;
  float b = uMode == 1 ? clamp(occl, 0.0, 1.0)*65535.0 : clamp(spec, 0.0, 1.0)*65535.0;
  float ah = floor(a/256.0), bh = floor(b/256.0);
  o = vec4(ah/255.0, (a - ah*256.0)/255.0, bh/255.0, (b - bh*256.0)/255.0);
}`;
let GPU = undefined;             // undefined: not tried yet; null: not available
/** Lighting on the GPU may be switched off (tools, or to compare with the CPU). */
export let GPU_LIGHT = true;
export function setGpuLight(on){ GPU_LIGHT = !!on; }
// for tests only: allow software-emulated WebGL (normally refused: it is slower than the CPU)
let GPU_SOFT_OK = false;
export function setGpuSoftware(on){ if(GPU_SOFT_OK !== !!on){ GPU_SOFT_OK = !!on; GPU = undefined; } }
/** What lit this texture: 'gpu', or 'cpu' (no WebGL2, an emulator, or switched off). */
export function lightBackend(){ return GPU_LIGHT && gpu() ? 'gpu' : 'cpu'; }
function gpu(){
  if(GPU !== undefined) return GPU;
  GPU = null;
  try {
    if(typeof OffscreenCanvas !== 'function') return null;
    const cv = new OffscreenCanvas(1, 1);
    const gl = cv.getContext('webgl2', { antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
    if(!gl) return null;
    // WebGL emulated in software (no GPU, or a blocklisted driver) is SLOWER
    // than the CPU path — measured at about twice its time — so step aside
    // when the renderer says it's an emulator.
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    if(!GPU_SOFT_OK && /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, `#version 300 es
in vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, LIGHT_FRAG));
    gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const loc = gl.getAttribLocation(prog, 'aPos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = n => gl.getUniformLocation(prog, n);
    GPU = { gl, cv, prog, vao, u: Object.fromEntries(['uH','uSize','uL','uHalf','uRelief','uShine','uSpecK','uShadow','uAO','uAmbient','uRise','uStepX','uStepY','uSteps','uStride','uDoShadow','uR','uN','uHasN','uMode'].map(n => [n, U(n)])) };
  } catch(e){ GPU = null; }
  return GPU;
}
function gpuLightHeights(H, ww, wh, P){
  const G = gpu(); if(!G) return null;
  const { gl, u } = G;
  try {
    G.cv.width = ww; G.cv.height = wh;
    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE); if(ww > maxTex || wh > maxTex) return null;
    gl.useProgram(G.prog); gl.bindVertexArray(G.vao);
    const hTex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, hTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, ww, wh, 0, gl.RED, gl.FLOAT, H);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const outTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, outTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, ww, wh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outTex, 0);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('framebuffer');
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, hTex); gl.uniform1i(u.uH, 0);
    gl.uniform2i(u.uSize, ww, wh); gl.uniform3f(u.uL, P.Lx, P.Ly, P.Lz); gl.uniform3f(u.uHalf, P.hx/P.hl, P.hy/P.hl, P.hz/P.hl);
    gl.uniform1f(u.uRelief, P.relief); gl.uniform1f(u.uShine, P.shininess); gl.uniform1f(u.uSpecK, P.specK);
    gl.uniform1f(u.uShadow, P.shadow); gl.uniform1f(u.uAO, P.ao); gl.uniform1f(u.uAmbient, P.ambient);
    gl.uniform1f(u.uRise, P.rise); gl.uniform1f(u.uStepX, P.stepX); gl.uniform1f(u.uStepY, P.stepY);
    gl.uniform1i(u.uSteps, P.steps); gl.uniform1i(u.uStride, P.stride); gl.uniform1i(u.uDoShadow, P.doShadow ? 1 : 0); gl.uniform1i(u.uR, P.R);
    // a detail normal map, if given, on its own texture unit
    let nTex = null;
    if(P.N){
      nTex = gl.createTexture(); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, nTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, ww, wh, 0, gl.RGB, gl.FLOAT, P.N);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(u.uN, 1); gl.uniform1i(u.uHasN, 1);
    } else { gl.uniform1i(u.uN, 0); gl.uniform1i(u.uHasN, 0); }
    gl.viewport(0, 0, ww, wh);
    // pass 0: light and highlight; pass 1 (materials only): diffuse and occlusion
    const read = mode => { gl.uniform1i(u.uMode, mode); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      const px = new Uint8Array(ww*wh*4); gl.readPixels(0, 0, ww, wh, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; };
    const px = read(0), px1 = P.comp ? read(1) : null;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.deleteFramebuffer(fb); gl.deleteTexture(hTex); gl.deleteTexture(outTex); if(nTex) gl.deleteTexture(nTex);
    const light = new Float32Array(ww*wh), spec = new Float32Array(ww*wh);
    for(let i = 0, q = 0; i < ww*wh; i++, q += 4){ light[i] = (px[q]*256 + px[q+1])/65535*2; spec[i] = (px[q+2]*256 + px[q+3])/65535; }
    if(!px1) return { light, spec };
    const diffuse = new Float32Array(ww*wh), occl = new Float32Array(ww*wh);
    for(let i = 0, q = 0; i < ww*wh; i++, q += 4){ diffuse[i] = (px1[q]*256 + px1[q+1])/65535; occl[i] = (px1[q+2]*256 + px1[q+3])/65535; }
    return { light, spec, diffuse, occl };
  } catch(e){ GPU = null; return null; }
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
 *   opts.normals    a DETAIL NORMAL MAP (Float32Array, x y z per pixel): its
 *                   slopes add to the heights' (derivative blending), so fine
 *                   detail can be given as normals while the heights still
 *                   cast the shadows and darken the crevices
 *   opts.components also return { diffuse, occl } separately (for materials
 *                   that need the ambient and direct light apart)
 * Always returned: `flat`, the light open flat ground gets (for materials:
 * what counts as "in shadow" — see materialOf / litK / litS).
 */
export function lightHeights(H, ww, wh, opts = {}){
  const { light = 315, relief = 1, gloss = 0.3, shadow = 0.6, ao = 0.35, ambient = 0.35, normals = null, components = false } = opts;
  const N = normals && normals.length >= ww*wh*3 ? normals : null;
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
  const lxy = Math.hypot(Lx, Ly), stepX = lxy > 1e-6 ? Lx/lxy : 0, stepY = lxy > 1e-6 ? Ly/lxy : 0;
  const rise = lxy > 1e-6 ? Lz/lxy : 1e9;                 // how fast a ray toward the light climbs, per pixel
  // march as far as the tallest height can throw a shadow at this elevation
  let hMax = 0, hMin = Infinity; for(let i = 0; i < H.length; i++){ if(H[i] > hMax) hMax = H[i]; if(H[i] < hMin) hMin = H[i]; }
  const steps = opts.marchSteps || Math.min(160, Math.ceil(((hMax - hMin)*relief)/Math.max(1e-6, rise)) + 2);   // (lightSparse passes the whole field's)
  // on the GPU when it's there (the same maths, per pixel, at once)
  if(GPU_LIGHT && ww*wh >= 4096){
    const g = gpuLightHeights(H, ww, wh, { Lx, Ly, Lz, hx, hy, hz, hl, shininess, specK, relief, shadow, ao, ambient, rise,
      stepX, stepY, steps, stride: Math.max(1, Math.ceil(steps/40)), doShadow: shadow > 0 && lxy > 0.02 && rise < 1e8, R: 4, N, comp: components });
    if(g){ g.flat = ambient + (1 - ambient)*Lz; return g; }
  }
  const out = new Float32Array(ww*wh), spec = new Float32Array(ww*wh);
  const dif = components ? new Float32Array(ww*wh) : null, occA = components ? new Float32Array(ww*wh) : null;
  // occlusion compares each height with its neighbourhood's (a box average)
  const R = 4, avg = new Float32Array(ww*wh);
  if(ao > 0){
    const tmp = new Float32Array(ww*wh);
    for(let y = 0; y < wh; y++){ let s = 0; for(let x = -R; x <= R; x++) s += at(x, y);
      for(let x = 0; x < ww; x++){ tmp[y*ww+x] = s/(2*R+1); s += at(x+R+1, y) - at(x-R, y); } }
    for(let x = 0; x < ww; x++){ let s = 0; for(let y = -R; y <= R; y++) s += tmp[Math.min(wh-1, Math.max(0, y))*ww+x];
      for(let y = 0; y < wh; y++){ avg[y*ww+x] = s/(2*R+1); s += tmp[Math.min(wh-1, y+R+1)*ww+x] - tmp[Math.max(0, y-R)*ww+x]; } }
  }
  // (neighbours read directly, clamped only at the edges; the shadow trace
  // stops once the ray has climbed above the tallest point — nothing further
  // can block it; sqrt for hypot: the same values, far faster)
  const hTop = hMax*relief, doShadow = shadow > 0 && lxy > 0.02 && rise < 1e8, stride = Math.max(1, Math.ceil(steps/40));
  for(let y = 0; y < wh; y++){
    const row = y*ww, rowm = (y > 0 ? y - 1 : 0)*ww, rowp = (y < wh - 1 ? y + 1 : wh - 1)*ww;
    for(let x = 0; x < ww; x++){
      const i = row + x, h0 = H[i]*relief, xm = x > 0 ? x - 1 : 0, xp = x < ww - 1 ? x + 1 : ww - 1;
      let gx = (H[row + xp] - H[row + xm])*0.5*relief, gy = (H[rowp + x] - H[rowm + x])*0.5*relief;
      // a detail normal map adds its slopes to the height's (derivative blending)
      if(N){ const q = i*3, dz = Math.max(0.05, N[q+2]); gx -= N[q]/dz; gy -= N[q+1]/dz; }
      const nl = Math.sqrt(gx*gx + gy*gy + 1), nx = -gx/nl, ny = -gy/nl, nz = 1/nl;
      const diffuse = Math.max(0, nx*Lx + ny*Ly + nz*Lz);
      // the cast shadow: march toward the light; anything rising above the ray blocks it
      let lit = 1;
      if(doShadow){
        for(let k = stride; k <= steps; k += stride){
          const rayH = h0 + rise*k;
          if(rayH >= hTop) break;
          let sx = Math.round(x + stepX*k), sy = Math.round(y + stepY*k);
          sx = sx < 0 ? 0 : sx >= ww ? ww - 1 : sx; sy = sy < 0 ? 0 : sy >= wh ? wh - 1 : sy;
          const over = H[sy*ww + sx]*relief - rayH;
          if(over > 0){ lit = Math.min(lit, Math.max(0, 1 - over*0.6)); if(lit === 0) break; }
        }
      }
      const occl = ao > 0 ? Math.max(0, Math.min(1, (avg[i] - H[i])*relief*0.25)) * ao : 0;
      out[i] = (ambient + (1 - ambient)*diffuse*(1 - shadow*(1 - lit))) * (1 - occl);
      if(components){ dif[i] = diffuse*(1 - shadow*(1 - lit)); occA[i] = occl; }
      const nh = Math.max(0, (nx*hx + ny*hy + nz*hz)/hl);
      spec[i] = Math.pow(nh, shininess)*specK*(0.35 + 0.65*lit);
    }
  }
  // flat: the light on open, flat ground — what "in shadow" is measured against
  const flat = ambient + (1 - ambient)*Lz;
  return components ? { light: out, spec, diffuse: dif, occl: occA, flat } : { light: out, spec, flat };
}

/**
 * lightHeights for heights that are mostly FLAT (zero): a few details on a
 * wide ground — seams, buttons and rivets on cloth. Only the tiles near a
 * detail are lit, each with a margin as wide as the longest shadow plus the
 * occlusion box, so nothing outside can reach in; the rest is open flat
 * ground and gets flat ground's light and highlight without any work.
 * Returns { light, spec, flat, lit } — `lit` counts the tiles that were lit.
 */
export function lightSparse(H, ww, wh, opts = {}, T = 64){
  const { light = 315, relief = 1 } = opts;
  const { lx, ly } = lightVec(light), tilt = Math.min(1, Math.hypot(lx, ly));
  const elev = (90 - tilt*78) * Math.PI/180, lxy = Math.cos(elev), rise = lxy > 1e-6 && tilt > 1e-6 ? Math.sin(elev)/lxy : 1e9;   // as lightHeights has it
  let hMax = 0, hMin = 0; for(let i = 0; i < H.length; i++){ if(H[i] > hMax) hMax = H[i]; if(H[i] < hMin) hMin = H[i]; }
  const ground = lightHeights(new Float32Array(1), 1, 1, { ...opts, shadow: 0, ao: 0, normals: null });
  const out = new Float32Array(ww*wh).fill(ground.flat), spec = new Float32Array(ww*wh).fill(ground.spec[0]);
  // shadows fall AWAY from the light, so only that side needs the shadow's
  // length; every side needs the occlusion box (and a pixel for the slope)
  const Ms = tilt > 1e-6 && lxy > 0.02 && (opts.shadow ?? 0.6) > 0 ? Math.min(170, Math.ceil(((hMax - hMin)*relief)/rise) + 3) : 0, m0 = 6;
  const sX = tilt > 1e-6 ? -lx/tilt : 0, sY = tilt > 1e-6 ? -ly/tilt : 0;        // one step toward the light
  // a detail's shadow reaches this far from it, each way (left, right, up, down)…
  const fl = Math.ceil(Math.max(0, sX)*Ms) + m0, fr = Math.ceil(Math.max(0, -sX)*Ms) + m0;
  const fu = Math.ceil(Math.max(0, sY)*Ms) + m0, fd = Math.ceil(Math.max(0, -sY)*Ms) + m0;
  const M = Math.max(fl, fr, fu, fd);
  // every piece marches as the whole field would (the same steps, the same stride)
  const marchSteps = Math.min(160, Math.ceil(((hMax - hMin)*relief)/Math.max(1e-6, rise)) + 2);
  // where the details are: each tile's box around its non-flat points
  const tx = Math.ceil(ww/T), ty = Math.ceil(wh/T), box = new Int32Array(tx*ty*4).fill(-1);
  for(let y = 0; y < wh; y++){ const r = y*ww, b = ((y/T)|0)*tx;
    for(let x = 0; x < ww; x++) if(H[r + x] !== 0){ const q = (b + ((x/T)|0))*4;
      if(box[q] < 0){ box[q] = x; box[q+1] = y; box[q+2] = x; box[q+3] = y; }
      else { if(x < box[q]) box[q] = x; if(x > box[q+2]) box[q+2] = x; box[q+3] = y; } } }
  // a tile needs lighting if a detail lies within a shadow's reach of it
  const reach = Math.ceil(M/T), need = new Uint8Array(tx*ty);
  for(let j = 0; j < ty; j++) for(let i = 0; i < tx; i++){ const q = (j*tx + i)*4; if(box[q] < 0) continue;
    for(let b = Math.max(0, j - reach); b <= Math.min(ty - 1, j + reach); b++)
      for(let a = Math.max(0, i - reach); a <= Math.min(tx - 1, i + reach); a++){
        if(box[q] - fl < (a + 1)*T && box[q+2] + fr >= a*T && box[q+1] - fu < (b + 1)*T && box[q+3] + fd >= b*T) need[b*tx + a] = 1; } }
  // runs of needed tiles along each row; the same run on the rows below joins
  // it, so a seam becomes ONE long piece rather than a stack of margins
  const rects = [], open = new Map();
  for(let j = 0; j < ty; j++){
    const seen = new Set();
    for(let i = 0; i < tx; i++){
      if(!need[j*tx + i]) continue;
      let e = i; while(e + 1 < tx && need[j*tx + e + 1]) e++;
      const key = i + ',' + e, r = open.get(key);
      if(r && r.j1 === j - 1) r.j1 = j; else { const n = { i, e, j0: j, j1: j }; rects.push(n); open.set(key, n); }
      seen.add(key); i = e;
    }
    for(const k of [...open.keys()]) if(!seen.has(k)) open.delete(k);
  }
  let lit = 0;
  for(const { i, e, j0, j1 } of rects){
    const x0 = i*T, y0 = j0*T, x1 = Math.min(ww, (e + 1)*T), y1 = Math.min(wh, (j1 + 1)*T);
    // …and a point needs the heights between it and the light: the mirror image
    const ex0 = Math.max(0, x0 - fr), ey0 = Math.max(0, y0 - fd), ex1 = Math.min(ww, x1 + fl), ey1 = Math.min(wh, y1 + fu);
    const ew = ex1 - ex0, eh = ey1 - ey0, E = new Float32Array(ew*eh);
    for(let y = 0; y < eh; y++) E.set(H.subarray((ey0 + y)*ww + ex0, (ey0 + y)*ww + ex1), y*ew);
    const L = lightHeights(E, ew, eh, { ...opts, marchSteps }); lit += (e - i + 1)*(j1 - j0 + 1);
    for(let y = y0; y < y1; y++){ const s = (y - ey0)*ew - ex0, r = y*ww;
      out.set(L.light.subarray(s + x0, s + x1), r + x0); spec.set(L.spec.subarray(s + x0, s + x1), r + x0); }
  }
  return { light: out, spec, flat: ground.flat, lit, of: tx*ty };
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

// A smooth field sampled on a coarse lattice every `step` pixels and blended
// between: broad shapes (stone, swells, moss, a nebula, smoke's body) change
// over dozens of pixels, so sampling noise at every pixel was most of the cost.
// fn(u, v) takes the field's 0..1 coordinates.
export function smoothField(ww, wh, step, fn){
  const cw = Math.ceil(ww/step) + 2, ch = Math.ceil(wh/step) + 2, g = new Float32Array(cw*ch);
  for(let j = 0; j < ch; j++) for(let i = 0; i < cw; i++) g[j*cw + i] = fn(Math.min(1, i*step/ww), Math.min(1, j*step/wh));
  const out = new Float32Array(ww*wh);
  for(let y = 0; y < wh; y++){ const fy = y/step, j = Math.floor(fy), ty = fy - j;
    for(let x = 0; x < ww; x++){ const fx = x/step, i = Math.floor(fx), tx = fx - i, k = j*cw + i;
      out[y*ww + x] = (g[k]*(1-tx) + g[k+1]*tx)*(1-ty) + (g[k+cw]*(1-tx) + g[k+cw+1]*tx)*ty; } }
  return out;
}

// ---------- materials ----------
// A lit surface's colour, channel by channel:
//   albedo × (shade·ambient + (1 − ambient)·diffuse) × (1 − occlusion)  +  highlight × specular
// SHADE is the colour the shadows fill with (the sky's light, bouncing);
// HIGHLIGHT the colour of the shine. White for both is the plain lighting, so
// a texture with no material colours set draws exactly as before.
const isWhiteHex = h => !h || /^#?(f{3}|f{6})$/i.test(String(h).trim());
// a hue at the brightness of white: the colour cast without darkening (a deep
// blue Shade Hue turns the shadows blue, not the whole surface grey)
const rgb01 = hex => { const c = parseHex(hex), v = [c.r/255, c.g/255, c.b/255];
  const lum = Math.max(0.05, 0.2126*v[0] + 0.7152*v[1] + 0.0722*v[2]);
  return v.map(x => Math.min(2.5, x/lum)); };
/** The material from the Highlight and Shade hues — null when both are white (nothing to do). */
export function materialOf(highlight, shade){
  if(isWhiteHex(highlight) && isWhiteHex(shade)) return null;
  return { hi: isWhiteHex(highlight) ? [1, 1, 1] : rgb01(highlight), sh: isWhiteHex(shade) ? [1, 1, 1] : rgb01(shade) };
}
/** The light reaching pixel i in channel c (0 r, 1 g, 2 b). With no material,
 *  lightHeights' own `light`. With one, the SHADE hue colours what is in
 *  shadow — darker than open, flat ground (L.flat): cast shadows, crevices,
 *  slopes turned away — the more, the deeper the shadow; lit faces keep their
 *  own colour. (`ambient` is kept for callers; the shadow depth comes from L.) */
export function litK(L, i, ambient, M, c){
  const k = L.light[i];
  if(!M) return k;
  // a shadow half as bright as open ground takes the shade hue fully
  const deep = Math.max(0, Math.min(1, 2*(L.flat - k)/L.flat));
  return k*(1 + (M.sh[c] - 1)*deep);
}
/** The highlight's colour in channel c (1 with no material). */
export function litS(M, c){ return M ? M.hi[c] : 1; }
/** Whether a highlight/shade hue counts as unset (white). */
export function noMaterialHue(h){ return isWhiteHex(h); }
