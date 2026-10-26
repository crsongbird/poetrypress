/**
 * ringGpu.js — THE RINGWORLD'S LAND ON THE GPU (WebGPU). Ruby, 2026-10-26: "the GPU path is the real fix. Can we go
 * ahead and implement that sooner rather than later so testing the flights doesn't take forever? … WEBGPU, why not use
 * WEBGPU?" (docs/prior-art/ringworld-gpu.md).
 *
 * The painter (stepsRing.js) still works out the land: each corner's height, its colour, its light, its shadow, its
 * haze. Here those triangles are laid in one pass instead of thousands of canvas fills, and the ground's painted marks
 * are worked out for every pixel from where it lies in the world (strokes and dabs on the world's own grids, octaves
 * of 2 m and up, faded one into the next by how many pixels a metre spans): fixed to the land, never jumping as the eye
 * moves, larger rather than finer near you. The picture comes back as a canvas the painter draws its things on.
 *
 *   One pass of the land —
 *   each pixel asks where it lies
 *   and finds its own stroke.
 *
 * Opened once, asynchronously (`ringGpuInit`); until it is ready, or where there is no WebGPU (Node, the tests, an old
 * browser) or only a software emulator (slower than the canvas), the painter draws on the canvas as it always has.
 */
let DEV = null, PIPE = null, UBUF = null, BIND = null, FMT = null, OPENING = null, SOFT_OK = false, ON = true;
const CANVASES = new Map();
let RG_GPU_WHY = '';
/** Why the GPU land is not open (a shader's errors), for the tools. */
export const ringGpuWhy = () => RG_GPU_WHY;

/** Whether the land is laid on the GPU now. */
export function ringGpuReady(){ return ON && !!DEV; }
/** Switch the GPU land off or on (to compare with the canvas, or as a fallback); soft: allow a software adapter (tests). */
export function setRingGpu(on, soft){ ON = !!on; if(soft !== undefined && !!soft !== SOFT_OK){ SOFT_OK = !!soft; if(!DEV) OPENING = null; } }

/** Open WebGPU, once: resolves true when the land can be laid on it. */
export function ringGpuInit(){
  if(OPENING) return OPENING;
  OPENING = (async () => {
    try {
      const gpu = typeof navigator !== 'undefined' && navigator.gpu; if(!gpu || typeof OffscreenCanvas !== 'function') return false;
      const ad = await gpu.requestAdapter({ powerPreference: 'high-performance' }); if(!ad) return false;
      const info = ad.info || {}, soft = ad.isFallbackAdapter || info.isFallbackAdapter || /swiftshader|llvmpipe|software|warp/i.test(`${info.vendor} ${info.architecture} ${info.description} ${info.device}`);
      if(soft && !SOFT_OK) return false;
      const dev = await ad.requestDevice(); FMT = gpu.getPreferredCanvasFormat();
      const mod = dev.createShaderModule({ code: RG_WGSL });
      const ci = await mod.getCompilationInfo(); if(ci.messages.some(m => m.type === 'error')){ RG_GPU_WHY = ci.messages.map(m => `${m.lineNum}:${m.linePos} ${m.message}`).join('\n'); return false; }
      PIPE = dev.createRenderPipeline({ layout: 'auto',
        vertex: { module: mod, entryPoint: 'vs', buffers: [{ arrayStride: RG_STRIDE*4, attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x2' }, { shaderLocation: 1, offset: 8, format: 'float32x4' },
          { shaderLocation: 2, offset: 24, format: 'float32x2' }, { shaderLocation: 3, offset: 32, format: 'float32x2' }] }] },
        fragment: { module: mod, entryPoint: 'fs', targets: [{ format: FMT, blend: { color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' }, alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' } } }] },
        primitive: { topology: 'triangle-list' } });
      UBUF = dev.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
      BIND = dev.createBindGroup({ layout: PIPE.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: UBUF } }] });
      dev.lost.then(() => { DEV = null; OPENING = null; CANVASES.clear(); });
      DEV = dev; return true;
    } catch(e){ DEV = null; return false; }
  })();
  return OPENING;
}

// A vertex: x, y (pixels on the page), r, g, b, a (0..1, straight), the world under it (metres along and across the
// ring from an anchor that moves only in whole steps of 4096 m, so the grids stay put), and its ground: kind (0 none, 1
// grass, 2 sand, 3 rock, 4 snow, 5 other ground) and how strongly its marks show
export const RG_STRIDE = 10;
/** A growable list of the land's triangles. */
export function ringGpuBatch(){ let a = new Float32Array(RG_STRIDE*3*4096), n = 0;
  return { get n(){ return n; }, get data(){ return a; },
    tri(p0, p1, p2){ if(n + RG_STRIDE*3 > a.length){ const b = new Float32Array(a.length*2); b.set(a); a = b; } for(const p of [p0, p1, p2]) for(let k = 0; k < RG_STRIDE; k++) a[n++] = p[k]; } }; }

/** Lay the batch's triangles on a ww × wh canvas of their own, cleared transparent; returns it (to drawImage), or null. */
export function ringGpuDraw(batch, ww, wh, o = {}){
  if(!ringGpuReady() || !batch.n) return null;
  try {
    const key = ww + 'x' + wh; let cv = CANVASES.get(key);
    if(!cv){ const c = new OffscreenCanvas(ww, wh), ctx = c.getContext('webgpu'); ctx.configure({ device: DEV, format: FMT, alphaMode: 'premultiplied' }); cv = { c, ctx }; if(CANVASES.size > 4) CANVASES.clear(); CANVASES.set(key, cv); }
    const vb = DEV.createBuffer({ size: Math.max(16, batch.n*4), usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST }); DEV.queue.writeBuffer(vb, 0, batch.data, 0, batch.n);
    DEV.queue.writeBuffer(UBUF, 0, new Float32Array([ww, wh, o.px || 1, (o.seed || 0) % 9973, o.marks ?? 1, 0, 0, 0]));
    const enc = DEV.createCommandEncoder(), pass = enc.beginRenderPass({ colorAttachments: [{ view: cv.ctx.getCurrentTexture().createView(), loadOp: 'clear', clearValue: { r: 0, g: 0, b: 0, a: 0 }, storeOp: 'store' }] });
    pass.setPipeline(PIPE); pass.setBindGroup(0, BIND); pass.setVertexBuffer(0, vb); pass.draw(batch.n/RG_STRIDE); pass.end(); DEV.queue.submit([enc.finish()]); vb.destroy();
    return cv.c;
  } catch(e){ return null; }
}

// THE SHADER: the vertex's place on the page; the fragment's colour, its ground's marks laid over it. The marks: dabs,
// light or dark, on grids of 2 m, 4 m, 8 m … a target 26 pixels apart, and the broad strokes toward the picture's five
// shared tints a target 46 pixels apart where a slow noise of the world says the ground is busy (as the canvas lays them,
// docs/prior-art/ringworld-painted.md §2 and §5); each from the hash of its grid point, so it stays where it is
const RG_WGSL = /* wgsl */`
struct U { size: vec2f, px: f32, seed: f32, marks: f32, p0: f32, p1: f32, p2: f32 };
@group(0) @binding(0) var<uniform> u: U;
struct VO { @builtin(position) pos: vec4f, @location(0) col: vec4f, @location(1) w: vec2f, @location(2) k: vec2f };
@vertex fn vs(@location(0) p: vec2f, @location(1) c: vec4f, @location(2) w: vec2f, @location(3) k: vec2f) -> VO {
  var o: VO; o.pos = vec4f(p.x/u.size.x*2.0 - 1.0, 1.0 - p.y/u.size.y*2.0, 0.0, 1.0); o.col = c; o.w = w; o.k = k; return o; }
fn hash3(p: vec3f) -> vec4f { var q = fract(p*vec3f(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33);
  let r = fract((q.xxy + q.yzz)*q.zyx); return vec4f(r, fract(r.x*17.13 + r.y*3.71 + r.z*29.3)); }
fn vnoise(p: vec2f, s: f32) -> f32 { let i = floor(p); let f = fract(p); let w = f*f*(3.0 - 2.0*f);
  let a = hash3(vec3f(i, s)).x; let b = hash3(vec3f(i + vec2f(1.0, 0.0), s)).x; let c = hash3(vec3f(i + vec2f(0.0, 1.0), s)).x; let d = hash3(vec3f(i + vec2f(1.0, 1.0), s)).x;
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y); }
const TINTS = array<vec3f, 5>(vec3f(0.839, 0.729, 0.471), vec3f(0.376, 0.502, 0.588), vec3f(1.0, 0.973, 0.894), vec3f(0.157, 0.18, 0.204), vec3f(0.588, 0.667, 0.376));
// one octave of dabs (brush = 0) or strokes (brush = 1) over colour c, al its strength
fn octave(c0: vec3f, w: vec2f, S: f32, al: f32, mpp: f32, salt: f32, brush: bool, kind: f32) -> vec3f {
  var c = c0; let base = floor(w/S);
  for(var i = -1; i <= 1; i++){ for(var j = -1; j <= 1; j++){
    let cell = base + vec2f(f32(i), f32(j)); let h = hash3(vec3f(cell, salt + log2(S)*7.0)); let h2 = hash3(vec3f(cell + 0.5, salt + 91.0));
    let ctr = (cell + h.xy)*S; let d = w - ctr;
    var keep = 1.0; var tone = select(vec3f(0.0), vec3f(1.0, 0.98, 0.91), h.z < 0.5); var mixk = select(0.2, 0.16, h.z < 0.5); var opa = select(0.7, 0.75, h.z < 0.5);
    var ang = (h2.x - 0.5)*0.5; var len = 0.0; var wid = 0.0;
    if(brush){ let busy = vnoise(ctr/90.0, u.seed + 941.0); keep = select(0.0, 1.0, busy >= 0.42 && h.w <= (busy - 0.3)*1.6);
      tone = TINTS[min(4u, u32(h2.y*5.0))]; mixk = 0.2 + 0.14*h2.z; opa = 0.62; len = S*(0.25 + 0.25*h2.w); wid = S*(0.09 + 0.08*h.z); }
    else { let r = S*(0.2 + 0.16*h.w); opa = opa*0.75;
      // (by its ground, thin as the canvas's strokes are: tufts on the grass, ripples on the sand, chips on the rock, drift
      //  lines on the snow, small dabs elsewhere)
      if(kind < 1.5){ len = r*0.9; wid = r*0.12; } else if(kind < 2.5){ len = r*1.6; wid = r*0.14; } else if(kind < 3.5){ len = r*0.8; wid = r*0.3; ang = ang*3.0; } else if(kind < 4.5){ len = r*1.4; wid = r*0.1; } else { len = r*0.5; wid = r*0.3; } }
    if(keep < 0.5){ continue; }
    let cs = cos(ang); let sn = sin(ang); let q = vec2f(d.x*cs + d.y*sn, -d.x*sn + d.y*cs)/vec2f(max(len, 1e-4), max(wid, 1e-4));
    let rr = length(q); let aa = mpp/max(wid, 1e-4)*1.2; let cov = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, rr);
    c = mix(c, mix(c, tone, mixk), cov*opa*al); } }
  return c; }
fn layer(c0: vec3f, w: vec2f, mpp: f32, tgt: f32, salt: f32, brush: bool, kind: f32) -> vec3f {
  let lv = log2(max(tgt*mpp/2.0, 1e-6)); let k0 = max(0.0, floor(lv)); let f = select(lv - k0, 0.0, lv < 0.0);
  var c = octave(c0, w, 2.0*exp2(k0), 1.0 - f, mpp, salt, brush, kind);
  if(f > 0.04){ c = octave(c, w, 2.0*exp2(k0 + 1.0), f, mpp, salt, brush, kind); }
  return c; }
@fragment fn fs(i: VO) -> @location(0) vec4f {
  let mpp = max(length(fwidth(i.w))*0.7071, 1e-5);
  var c = i.col.rgb;
  if(i.k.x > 0.5 && u.marks > 0.5){ let s = i.k.y;
    let cb = layer(c, i.w, mpp, 46.0*u.px, 1.0, true, i.k.x); let cm = layer(cb, i.w, mpp, 26.0*u.px, 2.0, false, i.k.x);
    c = mix(c, cm, s); }
  return vec4f(c*i.col.a, i.col.a); }
`;
