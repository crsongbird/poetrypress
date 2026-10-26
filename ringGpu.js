/**
 * ringGpu.js — THE RINGWORLD'S LAND ON THE GPU (WebGPU). Ruby, 2026-10-26: "the GPU path is the real fix. Can we go
 * ahead and implement that sooner rather than later so testing the flights doesn't take forever? … WEBGPU, why not use
 * WEBGPU?" (docs/prior-art/ringworld-gpu.md).
 *
 * The painter (stepsRing.js) still works out the land: each corner's height, its colour, its light, its shadow, its
 * haze; then its things, far to near (ringGpuThings, below). Here the land's triangles are laid in one pass instead of
 * thousands of canvas fills, and the ground's painted marks
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
let DEV = null, PIPE = null, UBUF = null, BIND = null, FMT = null, OPENING = null, SOFT_OK = false, ON = true, DEPTH = null;
let TPIPE = null, SPIPE = null, TUBUF = null, TBIND = null, SAMP = null, TA = null, FA = null, FA_S = 0, FA_L = 0;
const CANVASES = new Map();
let RG_GPU_WHY = '';
/** Why the GPU land is not open (a shader's errors), for the tools. */
export const ringGpuWhy = () => RG_GPU_WHY;

/** Whether the land is laid on the GPU now. */
export function ringGpuReady(){ return ON && !!DEV; }
/** Switch the GPU land off or on (to compare with the canvas, or as a fallback); soft: allow a software adapter (tests). */
export function setRingGpu(on, soft){ ON = !!on; if(soft !== undefined && !!soft !== SOFT_OK){ SOFT_OK = !!soft; if(!DEV) OPENING = null; } }

const PREMUL = { color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' }, alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' } };
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
      const mod = dev.createShaderModule({ code: RG_WGSL }), tmod = dev.createShaderModule({ code: RG_THINGS_WGSL });
      for(const m of [mod, tmod]){ const ci = await m.getCompilationInfo(); if(ci.messages.some(q => q.type === 'error')){ RG_GPU_WHY = ci.messages.map(q => `${q.lineNum}:${q.linePos} ${q.message}`).join('\n'); return false; } }
      PIPE = dev.createRenderPipeline({ layout: 'auto',
        vertex: { module: mod, entryPoint: 'vs', buffers: [{ arrayStride: RG_STRIDE*4, attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x2' }, { shaderLocation: 1, offset: 8, format: 'float32x4' },
          { shaderLocation: 2, offset: 24, format: 'float32x2' }, { shaderLocation: 3, offset: 32, format: 'float32x2' }, { shaderLocation: 4, offset: 40, format: 'float32' }] }] },
        fragment: { module: mod, entryPoint: 'fs', targets: [{ format: FMT, blend: PREMUL }, { format: FMT }, { format: FMT }] },
        primitive: { topology: 'triangle-list' }, depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'always' } });
      UBUF = dev.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
      BIND = dev.createBindGroup({ layout: PIPE.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: UBUF } }] });
      // (the things: quads, one an instance, each a tree's kept sheet relit, a thing painted this frame, or a shadow)
      const TBGL = dev.createBindGroupLayout({ entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} }, { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { viewDimension: '2d-array' } }, { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { viewDimension: '2d-array' } }] }), TLAY = dev.createPipelineLayout({ bindGroupLayouts: [TBGL] });
      TPIPE = dev.createRenderPipeline({ layout: TLAY,
        vertex: { module: tmod, entryPoint: 'tvs', buffers: [{ arrayStride: RG_TSTRIDE*4, stepMode: 'instance', attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x2' }, { shaderLocation: 1, offset: 8, format: 'float32x2' }, { shaderLocation: 2, offset: 16, format: 'float32x2' },
          { shaderLocation: 3, offset: 24, format: 'float32x2' }, { shaderLocation: 4, offset: 32, format: 'float32x2' }, { shaderLocation: 5, offset: 40, format: 'float32x4' }, { shaderLocation: 6, offset: 56, format: 'float32x4' }] }] },
        fragment: { module: tmod, entryPoint: 'tfs', targets: [{ format: FMT, blend: PREMUL }] },
        primitive: { topology: 'triangle-list' }, depthStencil: { format: 'depth24plus', depthWriteEnabled: false, depthCompare: 'less-equal' } });
      // (and the glows, screened: the colour behind lifted toward white by the glow's, 1 - (1 - glow)(1 - behind))
      SPIPE = dev.createRenderPipeline({ layout: TLAY,
        vertex: { module: tmod, entryPoint: 'tvs', buffers: [{ arrayStride: RG_TSTRIDE*4, stepMode: 'instance', attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x2' }, { shaderLocation: 1, offset: 8, format: 'float32x2' }, { shaderLocation: 2, offset: 16, format: 'float32x2' },
          { shaderLocation: 3, offset: 24, format: 'float32x2' }, { shaderLocation: 4, offset: 32, format: 'float32x2' }, { shaderLocation: 5, offset: 40, format: 'float32x4' }, { shaderLocation: 6, offset: 56, format: 'float32x4' }] }] },
        fragment: { module: tmod, entryPoint: 'tfs', targets: [{ format: FMT, blend: { color: { srcFactor: 'one-minus-dst', dstFactor: 'one' }, alpha: { srcFactor: 'zero', dstFactor: 'one' } } }] },
        primitive: { topology: 'triangle-list' }, depthStencil: { format: 'depth24plus', depthWriteEnabled: false, depthCompare: 'less-equal' } });
      TUBUF = dev.createBuffer({ size: 48, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
      SAMP = dev.createSampler({ magFilter: 'linear', minFilter: 'linear' });
      dev.lost.then(() => { DEV = null; OPENING = null; CANVASES.clear(); DEPTH = null; TA = null; FA = null; });
      DEV = dev; TA = null; FA = null; return true;
    } catch(e){ DEV = null; return false; }
  })();
  return OPENING;
}

// A vertex: x, y (pixels on the page), r, g, b, a (0..1, straight), the world under it (metres along and across the
// ring from an anchor that moves only in whole steps of 4096 m, so the grids stay put; o.anc says how many steps), its
// ground: kind (0 none, 1 grass, 6 long grass, 2 sand, 3 rock, 4 snow, 7 tundra, 8 marsh, 9 paving, 5 other ground,
// unmarked) and how strongly its marks show; and its depth (0 at the eye, 1 at the farthest, ringGpuDepth)
export const RG_STRIDE = 11;
/** How deep a distance d lies, between the nearest d0 and the farthest d1: by its logarithm, so the near has the room. */
export const ringGpuDepth = (d, d0, d1) => Math.max(0, Math.min(1, Math.log(Math.max(d, d0)/d0)/Math.log(d1/d0)));
/** A growable list of the land's triangles. */
export function ringGpuBatch(){ let a = new Float32Array(RG_STRIDE*3*4096), n = 0;
  return { get n(){ return n; }, get data(){ return a; },
    tri(p0, p1, p2){ if(n + RG_STRIDE*3 > a.length){ const b = new Float32Array(a.length*2); b.set(a); a = b; } for(const p of [p0, p1, p2]) for(let k = 0; k < RG_STRIDE; k++) a[n++] = p[k]; } }; }

const rgCanvasOf = (key, ww, wh) => { let cv = CANVASES.get(key + ww + 'x' + wh);
  if(!cv){ const c = new OffscreenCanvas(ww, wh), ctx = c.getContext('webgpu'); ctx.configure({ device: DEV, format: FMT, alphaMode: 'premultiplied' }); cv = { c, ctx }; if(CANVASES.size > 6) CANVASES.clear(); CANVASES.set(key + ww + 'x' + wh, cv); }
  return cv; };
let LAND_MAPS = null;
/** The last land's mask (white where land is laid) and its distance (white far, black near, transparent off the land),
 * as two canvases, for the parts after. */
export const ringGpuLandMaps = () => LAND_MAPS;
/** Lay the batch's triangles on a ww × wh canvas of their own, cleared transparent, and keep their depth for the things;
 * returns the canvas (to drawImage), or null. o.dk: the distance map's farthest over the depth's (its scale). */
export function ringGpuDraw(batch, ww, wh, o = {}){
  if(!ringGpuReady() || !batch.n) return null;
  try {
    const cv = rgCanvasOf('L', ww, wh);
    if(!DEPTH || DEPTH.width !== ww || DEPTH.height !== wh){ if(DEPTH) DEPTH.destroy(); DEPTH = DEV.createTexture({ size: [ww, wh], format: 'depth24plus', usage: GPUTextureUsage.RENDER_ATTACHMENT }); }
    const vb = DEV.createBuffer({ size: Math.max(16, batch.n*4), usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST }); DEV.queue.writeBuffer(vb, 0, batch.data, 0, batch.n);
    DEV.queue.writeBuffer(UBUF, 0, new Float32Array([ww, wh, o.px || 1, (o.seed || 0) % 9973, o.marks ?? 1, o.anc || 0, o.dk || 1, 0]));
    const cm = rgCanvasOf('M', ww, wh), cd = rgCanvasOf('D', ww, wh), att = c => ({ view: c.ctx.getCurrentTexture().createView(), loadOp: 'clear', clearValue: { r: 0, g: 0, b: 0, a: 0 }, storeOp: 'store' });
    const enc = DEV.createCommandEncoder(), pass = enc.beginRenderPass({ colorAttachments: [att(cv), att(cm), att(cd)],
      depthStencilAttachment: { view: DEPTH.createView(), depthClearValue: 1, depthLoadOp: 'clear', depthStoreOp: 'store' } });
    LAND_MAPS = [cm.c, cd.c];
    pass.setPipeline(PIPE); pass.setBindGroup(0, BIND); pass.setVertexBuffer(0, vb); pass.draw(batch.n/RG_STRIDE); pass.end(); DEV.queue.submit([enc.finish()]); vb.destroy();
    return cv.c;
  } catch(e){ return null; }
}

// THE THINGS ON THE GPU (Ruby, 2026-10-26: "Go ahead and try to get the rest of the things on a GPU so we can even render
// the video at a reasonable framerate"): every thing a quad, far to near, hidden by the land nearer than it pixel by
// pixel (the land's depth); a tree's quad shows its kept sheet, drawn once in a plain noon light and lit here by the
// moment's light and haze, so its colour runs smoothly with the day and a sheet serves every frame; any other thing is
// painted this frame onto a page of its own (the frame's atlas) as the canvas painted it; a tree's shadow is an ellipse
// worked out here. An instance: its middle, its two half-axes, the corners of its picture, then [atlas page, kind (0 a
// tree, 1 a painted thing, 2 a shadow, 3 a glow), depth, alpha], then [the light's gain, the night's share, the haze, ·]
// for a tree, the shadow's colour, or the glow's (its strength in it)
export const RG_TSTRIDE = 18;
/** A growable list of the things' quads. */
export function ringGpuThingBatch(){ let a = new Float32Array(RG_TSTRIDE*1024), n = 0;
  return { get n(){ return n; }, get data(){ return a; },
    put(cx, cy, ux, uy, vx, vy, u0, v0, u1, v1, layer, kind, dz, al, p0, p1, p2, p3){ if(n + RG_TSTRIDE > a.length){ const b = new Float32Array(a.length*2); b.set(a); a = b; }
      a[n++] = cx; a[n++] = cy; a[n++] = ux; a[n++] = uy; a[n++] = vx; a[n++] = vy; a[n++] = u0; a[n++] = v0; a[n++] = u1; a[n++] = v1; a[n++] = layer; a[n++] = kind; a[n++] = dz; a[n++] = al; a[n++] = p0; a[n++] = p1; a[n++] = p2; a[n++] = p3; } }; }

// THE TREES' SHEETS ON THE GPU: each cropped to what is drawn on it and kept on pages 4096 pixels square, in rows of
// sheets of one height (to the next eight pixels); when there is no room, a row none of whose sheets was seen this frame
// gives up its place, the longest unseen first (and the row of a height a sheet fits)
const TA_S = 4096, TA_L = 3;
const rgTreeAtlas = () => { if(TA) return TA;
  const tex = DEV.createTexture({ size: [TA_S, TA_S, TA_L], format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT });
  TA = { tex, y: new Array(TA_L).fill(0), rows: [], map: new Map(), frame: 1 }; TBIND = null; return TA; };
/** Whether a tree's sheet is on the GPU: its place there ([page, u0, v0, u1, v1, and the crop on the sheet x, y, w, h]), or null. */
export function ringGpuSheet(key){ if(!ringGpuReady() || !TA) return null; const e = TA.map.get(key); if(!e) return null; e.seen = TA.frame; e.row.seen = TA.frame; return e.uv; }
const rgRowFree = (A, row) => { for(const k of row.keys) A.map.delete(k); row.keys.clear(); row.x = 0; };
/** Put a tree's sheet (a canvas) on the GPU, cropped to its drawing; its place there (as ringGpuSheet), or null when there
 * is no room this frame or nothing on it. */
export function ringGpuPutSheet(key, cv){
  if(!ringGpuReady()) return null;
  try { const A = rgTreeAtlas(), W0 = cv.width, H0 = cv.height, d = cv.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W0, H0).data;
    let x0 = W0, x1 = -1, y0 = H0, y1 = -1; for(let y = 0; y < H0; y++){ const r = y*W0*4; for(let x = 0; x < W0; x++) if(d[r + x*4 + 3]){ if(x < x0) x0 = x; if(x > x1) x1 = x; if(y < y0) y0 = y; if(y > y1) y1 = y; } }
    if(x1 < 0){ const uv = [0, 0, 0, 0, 0, 0, 0, 0, 0]; A.map.set(key, { row: { seen: 0 }, uv, seen: A.frame }); return uv; } const w = x1 - x0 + 1, h = y1 - y0 + 1, wP = w + 2, hP = Math.ceil((h + 2)/8)*8; if(wP > TA_S || hP > TA_S) return null;
    // (a place: on a row of its height with room, on a new row, or on a row unseen this frame and tall enough, emptied)
    let row = A.rows.find(r => r.h === hP && r.x + wP <= TA_S);
    if(!row){ for(let L = 0; L < TA_L && !row; L++) if(A.y[L] + hP <= TA_S){ row = { L, y: A.y[L], h: hP, x: 0, keys: new Set(), seen: A.frame }; A.y[L] += hP; A.rows.push(row); } }
    if(!row){ let best = null; for(const r of A.rows) if(r.seen < A.frame && r.h >= hP && r.h <= hP*1.5 && (!best || r.seen < best.seen)) best = r; if(best){ rgRowFree(A, best); row = best; } }
    if(!row) return null;
    const px = new Uint8Array(w*h*4); for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){ const i = ((y0 + y)*W0 + x0 + x)*4, o = (y*w + x)*4, al = d[i + 3]/255; px[o] = d[i]*al; px[o + 1] = d[i + 1]*al; px[o + 2] = d[i + 2]*al; px[o + 3] = d[i + 3]; }
    const ox = row.x + 1, oy = row.y + 1; DEV.queue.writeTexture({ texture: A.tex, origin: [ox, oy, row.L] }, px, { bytesPerRow: w*4, rowsPerImage: h }, [w, h]);
    row.x += wP; row.seen = A.frame; row.keys.add(key);
    const uv = [row.L, ox/TA_S, oy/TA_S, (ox + w)/TA_S, (oy + h)/TA_S, x0, y0, w, h]; A.map.set(key, { row, uv, seen: A.frame }); return uv;
  } catch(e){ RG_GPU_WHY = String(e); return null; } }

/** Lay the things' quads over the land's depth, on a canvas of their own; atlas: the frame's pages (canvases, side S,
 * how much of each is used); light: { air, night } (0..255). Returns the canvas, or null. */
export function ringGpuThings(batch, ww, wh, atlas, light){
  if(!ringGpuReady() || !DEPTH || DEPTH.width !== ww || DEPTH.height !== wh) return null;
  try {
    const A = rgTreeAtlas(); A.frame++;
    const nL = Math.max(1, atlas.pages.length), S = atlas.S;
    if(!FA || FA_S !== S || FA_L < nL){ if(FA) FA.destroy(); FA_S = S; FA_L = Math.max(nL, 2); FA = DEV.createTexture({ size: [S, S, FA_L], format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT }); TBIND = null; }
    // (each page's used rows read back from its canvas, a plain one in memory, premultiplied and sent up)
    atlas.pages.forEach((pg, L) => { const hU = Math.min(S, Math.ceil(pg.used)), wU = Math.min(S, Math.ceil(pg.wide || S)); if(hU < 1 || wU < 1) return; const d = pg.x.getImageData(0, 0, wU, hU).data;
      for(let i = 0; i < d.length; i += 4){ const a = d[i + 3]; if(a === 255) continue; if(a === 0){ d[i] = d[i + 1] = d[i + 2] = 0; continue; } const k = a/255; d[i] = d[i]*k; d[i + 1] = d[i + 1]*k; d[i + 2] = d[i + 2]*k; }
      DEV.queue.writeTexture({ texture: FA, origin: [0, 0, L] }, d, { bytesPerRow: wU*4, rowsPerImage: hU }, [wU, hU]); });
    if(!TBIND) TBIND = DEV.createBindGroup({ layout: TPIPE.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: TUBUF } }, { binding: 1, resource: SAMP },
      { binding: 2, resource: A.tex.createView({ dimension: '2d-array' }) }, { binding: 3, resource: FA.createView({ dimension: '2d-array' }) }] });
    const L0 = light.air || [200, 210, 220], N0 = light.night || [8, 12, 30];
    DEV.queue.writeBuffer(TUBUF, 0, new Float32Array([ww, wh, 0, 0, L0[0]/255, L0[1]/255, L0[2]/255, 1, N0[0]/255, N0[1]/255, N0[2]/255, 1]));
    const cv = rgCanvasOf('T', ww, wh), nI = batch.n/RG_TSTRIDE;
    const enc = DEV.createCommandEncoder(), pass = enc.beginRenderPass({ colorAttachments: [{ view: cv.ctx.getCurrentTexture().createView(), loadOp: 'clear', clearValue: { r: 0, g: 0, b: 0, a: 0 }, storeOp: 'store' }],
      depthStencilAttachment: { view: DEPTH.createView(), depthLoadOp: 'load', depthStoreOp: 'store' } });
    let ib = null; if(nI > 0){ ib = DEV.createBuffer({ size: batch.n*4, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST }); DEV.queue.writeBuffer(ib, 0, batch.data, 0, batch.n);
      pass.setBindGroup(0, TBIND); pass.setVertexBuffer(0, ib);
      // (in runs: the glows with their own blending, the rest with theirs, in the order they came)
      const D = batch.data; let i0 = 0, cur = D[11] > 2.5; for(let i = 1; i <= nI; i++){ const g = i < nI && D[i*RG_TSTRIDE + 11] > 2.5; if(i === nI || g !== cur){ pass.setPipeline(cur ? SPIPE : TPIPE); pass.draw(6, i - i0, 0, i0); i0 = i; cur = g; } } }
    pass.end(); DEV.queue.submit([enc.finish()]); if(ib) ib.destroy();
    return cv.c;
  } catch(e){ RG_GPU_WHY = String(e); return null; }
}

// THE THINGS' SHADER: a quad's corner by its instance and the vertex's number; a tree's sheet unpremultiplied, lit as
// stepsRing.js's rgLit lights a colour (toward the night's blue by the dark, toward the air by the haze), and laid back;
// a painted thing as it was painted; a shadow an ellipse with a soft pixel's edge
const RG_THINGS_WGSL = /* wgsl */`
struct TU { size: vec2f, pad: vec2f, air: vec4f, night: vec4f };
@group(0) @binding(0) var<uniform> tu: TU;
@group(0) @binding(1) var samp: sampler;
@group(0) @binding(2) var ta: texture_2d_array<f32>;
@group(0) @binding(3) var fa: texture_2d_array<f32>;
struct TO { @builtin(position) pos: vec4f, @location(0) uv: vec2f, @location(1) q: vec2f, @location(2) @interpolate(flat) lm: vec4f, @location(3) @interpolate(flat) p: vec4f };
@vertex fn tvs(@builtin(vertex_index) vi: u32, @location(0) c: vec2f, @location(1) U: vec2f, @location(2) V: vec2f, @location(3) uv0: vec2f, @location(4) uv1: vec2f, @location(5) lm: vec4f, @location(6) p: vec4f) -> TO {
  var Q = array<vec2f, 6>(vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, 1.0));
  let q = Q[vi]; let P = c + U*q.x + V*q.y;
  var o: TO; o.pos = vec4f(P.x/tu.size.x*2.0 - 1.0, 1.0 - P.y/tu.size.y*2.0, lm.z, 1.0); o.uv = mix(uv0, uv1, q*0.5 + 0.5); o.q = q; o.lm = lm; o.p = p; return o; }
@fragment fn tfs(i: TO) -> @location(0) vec4f {
  let L = i32(i.lm.x + 0.5); let st = textureSample(ta, samp, i.uv, L); let sf = textureSample(fa, samp, i.uv, L);
  let r = length(i.q); let aa = max(fwidth(r), 1e-4); let al = i.lm.w;
  if(i.lm.y < 0.5){ if(st.a < 0.004){ discard; } let c = st.rgb/st.a; let lit = mix(i.p.x*c + i.p.y*tu.night.rgb, tu.air.rgb, i.p.z); return vec4f(lit, 1.0)*(st.a*al); }
  if(i.lm.y < 1.5){ if(sf.a < 0.004){ discard; } return sf*al; }
  if(i.lm.y > 2.5){ let g = clamp(1.0 - r, 0.0, 1.0); if(g <= 0.0){ discard; } return vec4f(i.p.rgb*g, 0.0); }
  let a = clamp((1.0 - r)/aa, 0.0, 1.0)*al; if(a < 0.004){ discard; } return vec4f(i.p.rgb*a, a); }
`;

// THE SHADER: the vertex's place on the page; the fragment's colour, the ground's paint laid over it as the canvas lays
// it (stepsRing.js rgBrush and rgGroundMarks): broad strokes toward the picture's five shared tints where a slow noise
// of the world says the ground is busy, and the marks of its ground (grass tufts, sand ripples, rock chips, snow drift
// lines, tundra hummocks, marsh reeds and pools, paving joints). Each mark stands on a point of the world's own grids
// (octaves of 2 m and up, a target 26 or 46 pixels apart, faded one into the next) and is drawn upright on the page, as a
// painter would, not lying flat in the ground: the triangle's own map from the page to the world (its derivatives),
// turned about, finds where the mark's point lies on the page. Ruby, 2026-10-26: "The ground texture made SENSE and was
// very pretty"
const RG_WGSL = /* wgsl */`
struct U { size: vec2f, px: f32, seed: f32, marks: f32, anc: f32, dk: f32, p2: f32 };
@group(0) @binding(0) var<uniform> u: U;
struct VO { @builtin(position) pos: vec4f, @location(0) col: vec4f, @location(1) w: vec2f, @location(2) k: vec2f };
@vertex fn vs(@location(0) p: vec2f, @location(1) c: vec4f, @location(2) w: vec2f, @location(3) k: vec2f, @location(4) dz: f32) -> VO {
  var o: VO; o.pos = vec4f(p.x/u.size.x*2.0 - 1.0, 1.0 - p.y/u.size.y*2.0, dz, 1.0); o.col = c; o.w = w; o.k = k; return o; }
fn pcg(v: u32) -> u32 { let s = v*747796405u + 2891336453u; let w = ((s >> ((s >> 28u) + 4u)) ^ s)*277803737u; return (w >> 22u) ^ w; }
fn rnd4(i: i32, j: i32, salt: u32) -> vec4f { let h = pcg(bitcast<u32>(i) ^ pcg(bitcast<u32>(j) ^ pcg(salt))); let h2 = pcg(h); let h3 = pcg(h2); let h4 = pcg(h3);
  return vec4f(f32(h >> 8u), f32(h2 >> 8u), f32(h3 >> 8u), f32(h4 >> 8u))/16777216.0; }
fn vhash(p: vec2f, s: f32) -> f32 { let q = vec2i(floor(p)); return rnd4(q.x, q.y, u32(s)).x; }
fn vnoise(p: vec2f, s: f32) -> f32 { let i = floor(p); let f = fract(p); let w = f*f*(3.0 - 2.0*f);
  return mix(mix(vhash(i, s), vhash(i + vec2f(1.0, 0.0), s), w.x), mix(vhash(i + vec2f(0.0, 1.0), s), vhash(i + vec2f(1.0, 1.0), s), w.x), w.y); }
fn seg(p: vec2f, a: vec2f, b: vec2f) -> f32 { let ab = b - a; let t = clamp(dot(p - a, ab)/max(dot(ab, ab), 1e-6), 0.0, 1.0); return length(p - a - ab*t); }
fn ink(d: f32, hw: f32) -> f32 { return clamp(hw + 0.5 - d, 0.0, 1.0); }
const TINTS = array<vec3f, 5>(vec3f(0.839, 0.729, 0.471), vec3f(0.376, 0.502, 0.588), vec3f(1.0, 0.973, 0.894), vec3f(0.157, 0.18, 0.204), vec3f(0.588, 0.667, 0.376));
// The page's map to the world, J (metres a pixel along the page's x and its y), and back
struct Jac { x: vec2f, y: vec2f, det: f32, ppm: f32 };
fn toPage(J: Jac, d: vec2f) -> vec2f { return vec2f(J.y.y*d.x - J.y.x*d.y, -J.x.y*d.x + J.x.x*d.y)/J.det; }
// One grid's marks over colour c (base: the ground's own colour), its octaves faded one into the next
fn paint(c0: vec3f, base: vec3f, w: vec2f, J: Jac, tgt: f32, salt: u32, brush: bool, kind: f32) -> vec3f {
  var c = c0; let lv = log2(max(tgt/(J.ppm*2.0), 1e-6)); let k0 = max(0.0, floor(lv)); let f = select(lv - k0, 0.0, lv < 0.0);
  let lite = mix(base, vec3f(1.0, 0.98, 0.91), 0.16); let dark = base*0.8;
  for(var o = 0; o < 2; o++){ let k = k0 + f32(o); let al = select(1.0 - f, f, o == 1); if(al < 0.04){ continue; }
    let S = 2.0*exp2(k); let sp = S*J.ppm; if(sp < 2.5){ continue; }
    let R = select(0.8, 0.6, brush)*sp + 2.0; let ex = R*(abs(J.x.x) + abs(J.y.x)); let ez = R*(abs(J.x.y) + abs(J.y.y));
    var i0 = i32(floor((w.x - ex)/S)); var i1 = i32(floor((w.x + ex)/S)); var j0 = i32(floor((w.y - ez)/S)); var j1 = i32(floor((w.y + ez)/S));
    let ci = i32(floor(w.x/S)); let cj = i32(floor(w.y/S)); i0 = max(i0, ci - 4); i1 = min(i1, ci + 4); j0 = max(j0, cj - 4); j1 = min(j1, cj + 4);
    let an = select(0, i32(u.anc)*i32(4096.0/S), S <= 4096.0); let sl = salt*16u + u32(k);
    let lw = max(0.5*u.px, sp*0.05)*0.5;
    for(var gi = i0; gi <= i1; gi++){ for(var gj = j0; gj <= j1; gj++){
      let h = rnd4(gi + an, gj, sl); let h2 = rnd4(gi + an, gj, sl + 997u); let ctr = (vec2f(f32(gi), f32(gj)) + h.xy)*S; let p = toPage(J, w - ctr);
      if(brush){ let busy = vnoise((ctr + vec2f(u.anc*4096.0, 0.0))/90.0, u.seed + 941.0); if(busy < 0.42 || h.w > (busy - 0.3)*1.6){ continue; }
        let len = sp*(0.5 + 0.5*h.z); let ang = (h2.x - 0.5)*0.5; let ca = cos(ang); let sa = sin(ang)*0.45;
        let d = min(seg(p, vec2f(-ca, -sa)*len*0.5, vec2f(0.0, -sp*0.03)), seg(p, vec2f(0.0, -sp*0.03), vec2f(ca, sa)*len*0.5));
        let cov = ink(d, max(1.2*u.px, sp*(0.18 + 0.16*h2.w))*0.5); if(cov <= 0.0){ continue; }
        c = mix(c, mix(base, TINTS[min(4u, u32(h2.y*5.0))], 0.2 + 0.14*h2.z), cov*0.62*al); continue; }
      let r = sp*(0.22 + 0.2*h.w); if(dot(p, p) > (2.0*r + 3.0)*(2.0*r + 3.0)){ continue; }
      var dL = 1e9; var dD = 1e9; var fD = 1e9;
      if(kind < 1.5 || (kind > 5.5 && kind < 6.5)){ let lb = r*select(0.7, 0.9, kind > 5.5); let lean = (h2.x - 0.5)*lb*0.6;
        let d = min(min(seg(p, vec2f(-0.25*lb, 0.0), vec2f(-0.3*lb + lean, -lb)), seg(p, vec2f(0.0), vec2f(lean*0.5, -1.2*lb))), seg(p, vec2f(0.25*lb, 0.0), vec2f(0.35*lb + lean, -0.9*lb)));
        if(h.z < 0.5){ dL = d; } else { dD = d; } }
      else if(kind < 2.5){ let l2 = r*1.6; dD = min(seg(p, vec2f(-l2, 0.0), vec2f(0.0, -0.175*r)), seg(p, vec2f(0.0, -0.175*r), vec2f(l2, 0.0)));
        dL = min(seg(p, vec2f(-l2, -0.2*r), vec2f(0.0, -0.375*r)), seg(p, vec2f(0.0, -0.375*r), vec2f(l2, -0.2*r))); }
      else if(kind < 3.5){ dD = min(min(seg(p, vec2f(-r, -0.3*r), vec2f(-0.2*r, 0.1*r)), seg(p, vec2f(-0.2*r, 0.1*r), vec2f(0.3*r, -0.2*r))), seg(p, vec2f(0.3*r, -0.2*r), vec2f(r, 0.25*r)));
        dL = abs(length(p - vec2f(0.3*r, 0.5*r)) - max(0.5*u.px, 0.12*r)); }
      else if(kind < 4.5){ let l2 = r*1.4; dL = seg(p, vec2f(-l2, 0.0), vec2f(l2, -0.12*r)); dD = seg(p, vec2f(-0.6*l2, 0.18*r), vec2f(0.7*l2, 0.1*r)); }
      else if(kind > 6.5 && kind < 7.5){ dL = abs(length(p) - max(0.5*u.px, 0.3*r)); let rr = max(0.4*u.px, 0.2*r); fD = length(p - vec2f(0.9*r, 0.3*r)) - rr; dD = abs(fD); }
      else if(kind > 7.5 && kind < 8.5){ if(h.z < 0.4){ let q = p/vec2f(r, 0.3*r); fD = (length(q) - 1.0)*0.3*r; dD = abs(fD); }
        else { dL = min(min(seg(p, vec2f(-0.3*r, 0.0), vec2f(-0.4*r, -0.9*r)), seg(p, vec2f(0.0), vec2f(0.0, -1.1*r))), seg(p, vec2f(0.3*r, 0.0), vec2f(0.45*r, -0.8*r))); } }
      else if(kind > 8.5 && kind < 9.5){ dD = min(seg(p, vec2f(-1.5*r, 0.0), vec2f(1.5*r, 0.0)), seg(p, vec2f(0.0, -0.4*r), vec2f(0.0, 0.4*r))); }
      else { continue; }
      c = mix(c, dark, max(ink(dD, lw), clamp(0.5 - fD, 0.0, 1.0))*0.7*al); c = mix(c, lite, ink(dL, lw)*0.75*al); } } }
  return c; }
struct FO { @location(0) c: vec4f, @location(1) m: vec4f, @location(2) d: vec4f };
@fragment fn fs(i: VO) -> FO {
  let dx = dpdx(i.w); let dy = dpdy(i.w); var J: Jac; J.x = dx; J.y = dy; J.det = dx.x*dy.y - dy.x*dx.y; J.ppm = 1.0/sqrt(max(abs(J.det), 1e-12));
  var c = i.col.rgb;
  if(i.k.x > 0.5 && u.marks > 0.5 && i.k.y > 0.01 && abs(J.det) > 1e-12){ let base = c;
    let cb = paint(c, base, i.w, J, 46.0*u.px, 1u, true, i.k.x); let cm = paint(cb, base, i.w, J, 26.0*u.px, 2u, false, i.k.x);
    c = mix(c, cm, i.k.y); }
  let g = clamp(i.pos.z*u.dk, 0.0, 1.0); var o: FO; o.c = vec4f(c*i.col.a, i.col.a); o.m = vec4f(1.0); o.d = vec4f(g, g, g, 1.0); return o; }
`;
