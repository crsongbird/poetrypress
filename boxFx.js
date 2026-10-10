/**
 * boxFx.js — the inset box as GLASS: what lies behind the box, seen through
 * it (as CSS backdrop-filter and the frosted panels of iOS do), made on the
 * GPU when there is one, and by a smaller, plainer CPU path when there isn't.
 *
 *   frost    frosted glass: the backdrop scattered, blurred (two Gaussian
 *            passes), lifted, and grained like etched glass
 *   lens     a lens: magnified toward the middle, colours parting at the rim
 *   reeded   reeded (fluted) glass: vertical flutes, each refracting its strip
 *   pixel    a mosaic: the backdrop in square cells
 *   emboss   pressed into the paper: the backdrop's light as a relief
 *   prism    a prism: red and blue split apart
 *
 * And the BLENDS a canvas can't do on its own (Vivid Light, Linear Light, Pin
 * Light, Linear Burn, Subtract, Divide): the box's own layer mixed with the
 * backdrop per pixel, on the GPU when it can.
 *
 * Everything works on the box's rectangle at a working resolution (≤ 1024 px
 * on the long side), measured in canonical pixels like the rest of the page.
 * No imports: the page hands in canvases and numbers.
 */

const BFX_MAX = 1024;            // the working rectangle's long side, at most
export const BOX_GLASS = ['none', 'frost', 'lens', 'reeded', 'pixel', 'emboss', 'prism'];
export const BOX_GPU_BLENDS = ['vivid-light', 'linear-light', 'pin-light', 'linear-burn', 'subtract', 'divide'];

const BFX_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uSrc; uniform sampler2D uAux;
uniform vec2 uSize; uniform int uMode; uniform float uAmt; uniform float uScale; uniform vec2 uDir;
uniform float uSeed; uniform int uBlend; uniform float uOpacity;
out vec4 o;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed)*43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
vec4 tex(vec2 px){ return texture(uSrc, clamp(px, vec2(0.5), uSize - 0.5)/uSize); }
float vivid(float b, float s){ return s < 0.5 ? (s <= 0.0 ? 0.0 : 1.0 - (1.0 - b)/(2.0*s)) : (s >= 1.0 ? 1.0 : b/(2.0*(1.0 - s))); }
void main(){
  vec2 p = gl_FragCoord.xy;
  if(uMode == 1){                       // Gaussian along uDir, sigma uAmt
    float sg = max(0.5, uAmt); float R = min(96.0, ceil(sg*2.5)); vec4 acc = vec4(0.0); float ws = 0.0;
    for(int i = -96; i <= 96; i++){ float fi = float(i); if(abs(fi) > R) continue; float w = exp(-fi*fi/(2.0*sg*sg)); acc += tex(p + uDir*fi)*w; ws += w; }
    o = acc/ws; return; }
  if(uMode == 2){                       // frost: scattered by grit before the blur
    vec2 j = (vec2(hash(p), hash(p + 17.3)) - 0.5)*uScale; o = tex(p + j); return; }
  if(uMode == 3){                       // frost: lifted and grained
    vec4 c = tex(p); float g = vnoise(p/max(1.0, uScale*0.35))*0.6 + hash(p*1.7)*0.4;
    c.rgb = mix(c.rgb, vec3(1.0), 0.05 + 0.10*uAmt) + (g - 0.5)*0.07*(0.4 + uAmt); o = vec4(clamp(c.rgb, 0.0, 1.0), 1.0); return; }
  if(uMode == 4){                       // lens
    vec2 c = uSize*0.5; float m = 0.5*min(uSize.x, uSize.y); vec2 d = (p - c)/m; float r2 = dot(d, d);
    vec2 q = d*(1.0 - uAmt*0.45*max(0.0, 1.0 - r2)); vec2 base = c + q*m; vec2 dir = d/max(1e-4, length(d));
    float ca = uAmt*0.014*r2*m;
    o = vec4(tex(base + dir*ca).r, tex(base).g, tex(base - dir*ca).b, 1.0); return; }
  if(uMode == 5){                       // reeded glass
    float w = max(3.0, uScale); float t = fract(p.x/w) - 0.5; float off = -t*w*uAmt*1.4;
    float sh = 1.0 - 0.22*uAmt*t*t*4.0; float hl = 0.07*uAmt*smoothstep(0.32, 0.5, abs(t));
    o = vec4(clamp(tex(vec2(p.x + off, p.y)).rgb*sh + hl, 0.0, 1.0), 1.0); return; }
  if(uMode == 6){                       // mosaic
    float w = max(2.0, uScale); o = tex((floor(p/w) + 0.5)*w); return; }
  if(uMode == 7){                       // emboss
    float a = max(1.0, uScale); vec3 L = vec3(0.299, 0.587, 0.114);
    float h = dot(tex(p - vec2(a, a)).rgb, L) - dot(tex(p + vec2(a, a)).rgb, L);
    vec4 c = tex(p); o = vec4(clamp(c.rgb + h*uAmt*1.6, 0.0, 1.0), 1.0); return; }
  if(uMode == 8){                       // prism
    vec2 off = vec2(uScale*uAmt, 0.0); o = vec4(tex(p + off).r, tex(p).g, tex(p - off).b, 1.0); return; }
  if(uMode == 9){                       // a blend the canvas can't do
    vec3 B = tex(p).rgb; vec4 S = texture(uAux, p/uSize); vec3 s = S.rgb; vec3 r;   // (canvases upload straight, not premultiplied)
    if(uBlend == 0) r = vec3(vivid(B.r, s.r), vivid(B.g, s.g), vivid(B.b, s.b));
    else if(uBlend == 1) r = B + 2.0*s - 1.0;
    else if(uBlend == 2) r = mix(min(B, 2.0*s), max(B, 2.0*s - 1.0), step(0.5, s));
    else if(uBlend == 3) r = B + s - 1.0;
    else if(uBlend == 4) r = B - s;
    else r = B/max(s, vec3(1.0/255.0));
    o = vec4(mix(B, clamp(r, 0.0, 1.0), S.a*uOpacity), 1.0); return; }
  o = tex(p);
}`;

let BFX_GL = undefined;             // undefined: not tried; null: none
let BFX_SOFT_OK = false;
/** For tests: allow software WebGL (normally refused — it is slower than the CPU path). */
export function setBoxFxSoftware(on){ if(BFX_SOFT_OK !== !!on){ BFX_SOFT_OK = !!on; BFX_GL = undefined; } }
/** Whether the glass runs on the GPU here. */
export function boxFxBackend(){ return bfxGl() ? 'gpu' : 'cpu'; }
function bfxGl(){
  if(BFX_GL !== undefined) return BFX_GL;
  BFX_GL = null;
  try {
    if(typeof OffscreenCanvas !== 'function') return null;
    const cv = new OffscreenCanvas(1, 1);
    const gl = cv.getContext('webgl2', { antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
    if(!gl) return null;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    if(!BFX_SOFT_OK && /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, `#version 300 es
in vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, BFX_FRAG));
    gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const loc = gl.getAttribLocation(prog, 'aPos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = n => gl.getUniformLocation(prog, n);
    BFX_GL = { gl, cv, prog, vao, u: Object.fromEntries(['uSrc','uAux','uSize','uMode','uAmt','uScale','uDir','uSeed','uBlend','uOpacity'].map(n => [n, U(n)])) };
  } catch(e){ BFX_GL = null; }
  return BFX_GL;
}

// ---- small canvas helpers ----
function bfxCanvas(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function bfxCtx(c){ return c.getContext('2d', { willReadFrequently: true }); }
/** The working size for a rectangle (and its scale from page pixels). */
function bfxWork(rw, rh){ const k = Math.min(1, BFX_MAX/Math.max(1, rw, rh)); return { k, ww: Math.max(2, Math.round(rw*k)), wh: Math.max(2, Math.round(rh*k)) }; }
function bfxCrop(src, r, ww, wh){ const c = bfxCanvas(ww, wh); const x = bfxCtx(c); x.imageSmoothingEnabled = true; x.drawImage(src, r.x, r.y, r.w, r.h, 0, 0, ww, wh); return c; }

// ---- the GPU path: passes ping-ponging between two textures ----
function bfxRunGpu(passes, srcCanvas, auxCanvas, ww, wh){
  const G = bfxGl(); if(!G) return null;
  const { gl, u } = G;
  const made = [];
  try {
    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE); if(ww > maxTex || wh > maxTex) return null;
    G.cv.width = ww; G.cv.height = wh;
    gl.useProgram(G.prog); gl.bindVertexArray(G.vao); gl.viewport(0, 0, ww, wh);
    const texOf = (img) => { const t = gl.createTexture(); made.push(t); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      if(img) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, ww, wh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      for(const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      return t; };
    const src = texOf(srcCanvas), aux = auxCanvas ? texOf(auxCanvas) : null;
    const ping = [texOf(null), texOf(null)], fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    let input = src;
    passes.forEach((P, i) => {
      const out = ping[i % 2];
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, out, 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, input); gl.uniform1i(u.uSrc, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, aux || input); gl.uniform1i(u.uAux, 1);
      gl.uniform2f(u.uSize, ww, wh); gl.uniform1i(u.uMode, P.mode); gl.uniform1f(u.uAmt, P.amt || 0); gl.uniform1f(u.uScale, P.scale || 0);
      gl.uniform2f(u.uDir, (P.dir || [1, 0])[0], (P.dir || [1, 0])[1]); gl.uniform1f(u.uSeed, P.seed || 0);
      gl.uniform1i(u.uBlend, P.blend || 0); gl.uniform1f(u.uOpacity, P.opacity == null ? 1 : P.opacity);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      input = out;
    });
    const px = new Uint8Array(ww*wh*4); gl.readPixels(0, 0, ww, wh, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.deleteFramebuffer(fb);
    const c = bfxCanvas(ww, wh), x = bfxCtx(c), img = x.createImageData(ww, wh);
    img.data.set(px); x.putImageData(img, 0, 0);
    return c;
  } catch(e){ return null; }
  finally { for(const t of made) gl.deleteTexture(t); }
}

// ---- the CPU path: the same looks, plainer and at most half the size ----
function bfxSoftBlur(c, sigma){
  // a blur by shrinking and growing again, twice (a cheap stand-in for the Gaussian)
  const w = c.width, h = c.height, f = Math.max(1, sigma/1.5);
  const sw = Math.max(2, Math.round(w/f)), sh = Math.max(2, Math.round(h/f));
  const s = bfxCanvas(sw, sh), sx = bfxCtx(s); sx.imageSmoothingEnabled = true; sx.imageSmoothingQuality = 'high';
  sx.drawImage(c, 0, 0, sw, sh);
  const o = bfxCanvas(w, h), ox = bfxCtx(o); ox.imageSmoothingEnabled = true; ox.imageSmoothingQuality = 'high';
  ox.drawImage(s, 0, 0, w, h);
  return o;
}
function bfxPixels(c, fn){
  const x = bfxCtx(c), w = c.width, h = c.height, src = x.getImageData(0, 0, w, h), d = src.data, out = x.createImageData(w, h), q = out.data;
  const at = (px, py) => { px = Math.max(0, Math.min(w - 1, Math.round(px))); py = Math.max(0, Math.min(h - 1, Math.round(py))); return (py*w + px)*4; };
  for(let y = 0; y < h; y++) for(let x0 = 0; x0 < w; x0++){ const i = (y*w + x0)*4; fn(x0, y, i, d, q, at); q[i+3] = 255; }
  x.putImageData(out, 0, 0); return c;
}
function bfxRunCpu(mode, crop, P){
  const w = crop.width, h = crop.height;
  if(mode === 'frost'){
    const b = bfxSoftBlur(crop, P.sigma);
    let s = 1234.5 + (P.seed || 0);
    const rnd = () => { s = (s*16807) % 2147483647; return s/2147483647; };
    return bfxPixels(b, (x, y, i, d, q) => { const g = (rnd() - 0.5)*0.07*(0.4 + P.amt)*255, lift = 0.05 + 0.10*P.amt;
      for(let c = 0; c < 3; c++) q[i+c] = d[i+c] + (255 - d[i+c])*lift + g; });
  }
  if(mode === 'pixel'){
    const cw = Math.max(2, P.scale), sw = Math.max(1, Math.round(w/cw)), sh = Math.max(1, Math.round(h/cw));
    const s = bfxCanvas(sw, sh), sx = bfxCtx(s); sx.imageSmoothingEnabled = true; sx.drawImage(crop, 0, 0, sw, sh);
    const o = bfxCanvas(w, h), ox = bfxCtx(o); ox.imageSmoothingEnabled = false; ox.drawImage(s, 0, 0, w, h); return o;
  }
  const cx = w/2, cy = h/2, m = 0.5*Math.min(w, h);
  return bfxPixels(crop, (x, y, i, d, q, at) => {
    if(mode === 'lens'){
      const dx = (x - cx)/m, dy = (y - cy)/m, r2 = dx*dx + dy*dy, k = 1 - P.amt*0.45*Math.max(0, 1 - r2);
      const bx = cx + dx*k*m, by = cy + dy*k*m, len = Math.hypot(dx, dy) || 1, ca = P.amt*0.014*r2*m;
      q[i] = d[at(bx + dx/len*ca, by + dy/len*ca)]; q[i+1] = d[at(bx, by) + 1]; q[i+2] = d[at(bx - dx/len*ca, by - dy/len*ca) + 2];
    } else if(mode === 'reeded'){
      const fw = Math.max(3, P.scale), t = ((x/fw) % 1) - 0.5, off = -t*fw*P.amt*1.4, sh = 1 - 0.22*P.amt*t*t*4;
      const hl = 0.07*P.amt*Math.max(0, Math.min(1, (Math.abs(t) - 0.32)/0.18))*255, j = at(x + off, y);
      for(let c = 0; c < 3; c++) q[i+c] = d[j+c]*sh + hl;
    } else if(mode === 'emboss'){
      const a = Math.max(1, P.scale), L = (k) => 0.299*d[k] + 0.587*d[k+1] + 0.114*d[k+2];
      const hgt = (L(at(x - a, y - a)) - L(at(x + a, y + a)))*P.amt*1.6;
      for(let c = 0; c < 3; c++) q[i+c] = d[i+c] + hgt;
    } else if(mode === 'prism'){
      const off = P.scale*P.amt; q[i] = d[at(x + off, y)]; q[i+1] = d[i+1]; q[i+2] = d[at(x - off, y) + 2];
    } else { q[i] = d[i]; q[i+1] = d[i+1]; q[i+2] = d[i+2]; }
  });
}

/**
 * The backdrop behind a box, through glass. `src` is the page as drawn so far;
 * `r` the box's rectangle in page pixels; `S` the page's render scale (so the
 * glass is the same size on the page at any preview size). amount and scale
 * are 0..1. Returns a canvas to draw over the rectangle (inside the box's
 * clip), or null for no glass.
 */
export function boxGlass(src, r, mode, amount, scale, S = 1, seed = 0){
  if(!mode || mode === 'none' || !src || r.w < 2 || r.h < 2) return null;
  const { k, ww, wh } = bfxWork(r.w, r.h), px = S*k;          // canonical px → working px
  const crop = bfxCrop(src, r, ww, wh);
  const amt = Math.max(0, Math.min(1, amount)), sc = Math.max(0, Math.min(1, scale));
  const P = {
    sigma: (3 + 57*amt)*px,                                      // frost: the blur
    grit: (2 + 26*sc)*px,                                        // frost: how far the grit scatters
    amt, seed,
    scale: mode === 'reeded' ? (10 + 90*sc)*px : mode === 'pixel' ? (6 + 114*sc)*px : mode === 'emboss' ? (1 + 9*sc)*px : mode === 'prism' ? (2 + 38*sc)*px : (8 + 40*sc)*px,
  };
  const MODE = { lens: 4, reeded: 5, pixel: 6, emboss: 7, prism: 8 };
  const passes = mode === 'frost'
    ? [{ mode: 2, scale: P.grit, seed }, { mode: 1, amt: P.sigma, dir: [1, 0] }, { mode: 1, amt: P.sigma, dir: [0, 1] }, { mode: 3, amt, scale: P.scale, seed }]
    : [{ mode: MODE[mode] || 0, amt, scale: P.scale, seed }];
  return bfxRunGpu(passes, crop, null, ww, wh) || bfxRunCpu(mode, crop, P);
}

/**
 * A blend the canvas can't do: the box's own layer `layer` (its rectangle
 * `lr` in that layer's pixels) mixed with the backdrop under it. Returns a
 * canvas for the rectangle `r`, already blended (draw it normally).
 */
export function boxBlend(src, r, layer, lr, blend, opacity){
  const bi = BOX_GPU_BLENDS.indexOf(blend);
  if(bi < 0 || !src || !layer || r.w < 2 || r.h < 2) return null;
  const { ww, wh } = bfxWork(r.w, r.h);
  const crop = bfxCrop(src, r, ww, wh), aux = bfxCrop(layer, lr, ww, wh);
  const gpu = bfxRunGpu([{ mode: 9, blend: bi, opacity }], crop, aux, ww, wh);
  if(gpu) return gpu;
  const sd = bfxCtx(aux).getImageData(0, 0, ww, wh).data;
  const vivid = (b, s) => s < 0.5 ? (s <= 0 ? 0 : 1 - (1 - b)/(2*s)) : (s >= 1 ? 1 : b/(2*(1 - s)));
  const f = [vivid, (b, s) => b + 2*s - 1, (b, s) => s < 0.5 ? Math.min(b, 2*s) : Math.max(b, 2*s - 1), (b, s) => b + s - 1, (b, s) => b - s, (b, s) => b/Math.max(s, 1/255)][bi];
  return bfxPixels(crop, (x, y, i, d, q) => {
    const a = (sd[i+3]/255)*opacity;
    for(let c = 0; c < 3; c++){ const b = d[i+c]/255, s = a > 0 ? sd[i+c]/255 : 0; q[i+c] = 255*(b + (Math.max(0, Math.min(1, f(b, s))) - b)*a); }
  });
}
