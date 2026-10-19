/**
 * LENS BLUR (Macro Bloom's focal plane, and any graph's): a picture seen through a real lens, focused at one distance.
 * Prior art: docs/prior-art/florals.md §8e.
 *
 *   1. Depth to distance: the depth map (black near, white far) is laid between a near and a far distance on a log
 *      scale (a macro scene runs from a few millimetres to the far hedge).
 *   2. The circle of confusion, by the thin lens: a point at distance z, the lens focused at zf, spreads into a disc
 *      of diameter c = A·f/(zf − f)·|z − zf|/z, so (for one focus) c ∝ |1 − zf/z|: no bound in front of the focus,
 *      levelling off behind it at the disc a point at infinity makes. Aperture sets A (wide open: large discs, the
 *      focus a sliver; stopped down: nearly all sharp); Blur Size the largest disc a far point makes, wide open.
 *   3. The gather (scatter as gather, after Jimenez's post-processing notes): each pixel collects the pixels round it
 *      on a golden-angle spiral, out to the largest disc on the page; a neighbour counts where its own disc reaches
 *      this pixel; a neighbour BEHIND this pixel may reach it no further than twice this pixel's own disc, so a sharp
 *      flower's edge is not washed over by the blurred lights behind it, while a near, blurred leaf does spread over it.
 *   4. The aperture's shape: round, or 5 to 9 blades (the spiral's radius bent to the polygon), turned by Blade Turn.
 *      Highlights: points brighter than the rest are brighter than white before the gather, as a sensor sees a light,
 *      so they keep their discs (bokeh) while everything else softens.
 * On the GPU (WebGL2) where the device has one; else the same gather on the CPU, with fewer samples.
 */
import { gpuKernel } from './texCore.js';

const LB_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
export const LENS_BLADES = ['Round', '5 Blades', '6 Blades', '7 Blades', '8 Blades', '9 Blades'];
const GOLDEN = 2.39996323;
const Z_NEAR = 1, Z_FAR = 80;   // (the depth map's black and white, as distances: a macro scene's millimetres to its far hedge)

/** The circle of confusion's radius (grid px) at depth d (0 near … 1 far), the lens at depth df. */
export function lensCoc(d, df, rFar){
  const z = Z_NEAR*Math.exp(d*Math.log(Z_FAR/Z_NEAR)), zf = Z_NEAR*Math.exp(df*Math.log(Z_FAR/Z_NEAR));
  return Math.min(2.5, Math.abs(1 - zf/z))*rFar;
}
const polyR = (a, blades, rot) => { if(blades < 3) return 1; const seg = Math.PI*2/blades, t = ((a - rot)%seg + seg)%seg - seg/2; return Math.cos(Math.PI/blades)/Math.cos(t); };

const LENS_FRAG = `
uniform sampler2D uImg; uniform sampler2D uDepth; uniform vec2 uSize; uniform float uMaxR; uniform float uStep; uniform float uBlades; uniform float uRot;
float polyR(float a){ if(uBlades < 3.0) return 1.0; float seg = 6.2831853/uBlades; float t = mod(a - uRot, seg) - seg*0.5; return cos(3.14159265/uBlades)/cos(t); }
void main(){
  ivec2 p = ivec2(gl_FragCoord.xy), hi = ivec2(uSize) - 1;
  vec4 c0 = texelFetch(uImg, p, 0); float d0 = texelFetch(uDepth, p, 0).r, cs = c0.a;
  vec3 acc = c0.rgb; float tot = 1.0, r = uStep, ang = 0.0, w = max(0.5, uStep*0.5);
  for(int i = 0; i < 6000; i++){
    if(r >= uMaxR) break;
    vec2 off = vec2(cos(ang), sin(ang))*r*polyR(ang);
    ivec2 q = clamp(p + ivec2(floor(off + 0.5)), ivec2(0), hi);
    vec4 s = texelFetch(uImg, q, 0); float ds = texelFetch(uDepth, q, 0).r, ss = s.a;
    if(ds > d0) ss = clamp(ss, 0.0, cs*2.0);
    float m = smoothstep(r - w, r + w, ss);
    acc += mix(acc/tot, s.rgb, m); tot += 1.0;
    ang += ${GOLDEN}; r += uStep/r;
  }
  o = vec4(acc/tot, 1.0);
}`;

/** The gather, on the CPU: the same spiral, fewer samples (about `budget` per pixel). */
function lensGatherCpu(R, G, B, C, D, ww, wh, maxR, blades, rot, budget){
  const N = ww*wh, oR = new Float32Array(N), oG = new Float32Array(N), oB = new Float32Array(N);
  const step = Math.max(0.5, maxR*maxR/(2*budget)), w = Math.max(0.5, step*0.5);
  // the spiral, once: offsets and radii
  const offs = []; for(let r = step, a = 0; r < maxR; a += GOLDEN, r += step/r){ const k = r*polyR(a, blades, rot); offs.push([Math.round(Math.cos(a)*k), Math.round(Math.sin(a)*k), r]); }
  const sm = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0)/(e1 - e0))); return t*t*(3 - 2*t); };
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
    const i = y*ww + x, cs = C[i], d0 = D[i];
    let r0 = R[i], g0 = G[i], b0 = B[i], tot = 1;
    for(const [ox, oy, r] of offs){
      const qx = Math.min(ww - 1, Math.max(0, x + ox)), qy = Math.min(wh - 1, Math.max(0, y + oy)), j = qy*ww + qx;
      let ss = C[j]; if(D[j] > d0) ss = Math.min(ss, cs*2);
      const m = sm(r - w, r + w, ss);
      r0 += r0/tot + (R[j] - r0/tot)*m; g0 += g0/tot + (G[j] - g0/tot)*m; b0 += b0/tot + (B[j] - b0/tot)*m; tot++;
    }
    oR[i] = r0/tot; oG[i] = g0/tot; oB[i] = b0/tot;
  }
  return { r: oR, g: oG, b: oB };
}

export const LENS_STEPS = {
  lensblur: { cat: 'Shape', label: 'Lens Blur', ins: ['picture', 'depth'], outs: ['picture', 'blur'], maps: ['focus:4'],
    io: { ins: ['image', 'field'], outs: ['image', 'field'] }, req: true,
    params: [LB_R('focus', 'Focus', 35), LB_R('aperture', 'Aperture', 60), LB_R('size', 'Blur Size', 40, 5, 120), LB_R('blades', 'Blades: ' + LENS_BLADES.join(' · '), 0),
      LB_R('turn', 'Blade Turn', 0), LB_R('highlights', 'Highlights', 50)],
    cost: () => 6,
    doc: 'A picture seen through a real lens focused at one distance: each point spreads into a disc as wide as the thin lens makes it, from its depth (black near, white far), so things in front of the focus blur fast and things behind it level off; lights keep their discs (bokeh), round or bladed.',
    run(E, n){ const { ww, wh, N, unit, num, input, asImage, asField, map } = E;
      const im = asImage(input(n, 1)); if(!im) return null;
      const depth = asField(input(n, 2)) || new Float32Array(N).fill(1);
      const fv = map(n, 'focus', 35), focusAt = i => (typeof fv === 'number' ? fv : fv[i])/100;
      const ap = Math.pow(num(n, 'aperture', 60)/100, 1.4), rFar = num(n, 'size', 40)/1000*Math.min(ww, wh)*ap;   // (Blur Size: tenths of a percent of the page's shorter side)
      const blades = [0, 5, 6, 7, 8, 9][Math.min(5, Math.floor(num(n, 'blades', 0)/100*6))], rot = num(n, 'turn', 0)/100*Math.PI*2/Math.max(3, blades || 3);
      const hl = num(n, 'highlights', 50)/100;
      // the circles of confusion; and the lights, brighter than white before the gather
      const C = new Float32Array(N); let maxC = 0;
      for(let i = 0; i < N; i++){ const c = lensCoc(depth[i], focusAt(i), rFar); C[i] = c; if(c > maxC) maxC = c; }
      const R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N);
      for(let i = 0; i < N; i++){ const l = 0.299*im.r[i] + 0.587*im.g[i] + 0.114*im.b[i], k = 1 + hl*Math.max(0, l - 0.9)*40;
        R[i] = im.r[i]*k; G[i] = im.g[i]*k; B[i] = im.b[i]*k; }
      const blurF = new Float32Array(N); for(let i = 0; i < N; i++) blurF[i] = maxC > 0 ? C[i]/maxC : 0;
      if(maxC < 0.6) return [{ r: im.r, g: im.g, b: im.b }, blurF];
      const maxR = maxC + 1;
      // the GPU, where there is one
      const rgba = new Float32Array(N*4); for(let i = 0; i < N; i++){ rgba[i*4] = R[i]; rgba[i*4 + 1] = G[i]; rgba[i*4 + 2] = B[i]; rgba[i*4 + 3] = C[i]; }
      const step = Math.max(0.5, maxR*maxR/(2*1400));
      const g = gpuKernel('lensblur', LENS_FRAG, ww, wh, [{ name: 'uImg', data: rgba, ch: 4 }, { name: 'uDepth', data: depth, ch: 1 }],
        { uSize: [ww, wh], uMaxR: maxR, uStep: step, uBlades: blades, uRot: rot });
      let out;
      if(g){ out = { r: new Float32Array(N), g: new Float32Array(N), b: new Float32Array(N) }; for(let i = 0; i < N; i++){ out.r[i] = g[i*4]; out.g[i] = g[i*4 + 1]; out.b[i] = g[i*4 + 2]; } }
      else out = lensGatherCpu(R, G, B, C, depth, ww, wh, maxR, blades, rot, 160);
      // (the lights' overflow folded back: a disc of a light stays bright, never past white)
      for(let i = 0; i < N; i++){ out.r[i] = Math.min(1, out.r[i]); out.g[i] = Math.min(1, out.g[i]); out.b[i] = Math.min(1, out.b[i]); }
      return [out, blurF]; } },
};
