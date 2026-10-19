/**
 * STREAMERS (Windward Sea's process part): ribbons swept along curves in 3D space and seen through a camera, so
 * they stand in the scene, near ones large and far ones small, turning their two faces to the light. Prior art:
 * docs/prior-art/cel-shaded.md §5.
 *
 *   1. Each gust is placed in the world: a point on the page where `where` allows, at a depth (far ones more
 *      often), never below the sea (a point under the horizon can only be near).
 *   2. Its path (Shape): a Gust runs along the wind and ends in a curl that tightens, the radius falling fast
 *      at first and slower after (as the sailing game's wind was rebuilt: Gordon); a Spiral coils round an
 *      upright axis; a Loop loops once and runs on; a Wave rises and falls.
 *   3. Each path is a ribbon: every point doubled into two, spread across the curve in the plane it bends in,
 *      and turned round the curve by Twist, so it shows its back face now and then. It is widest in its middle,
 *      thins into the curl, and its ends fade (as the game's did, so the strip never ends square).
 *   4. A gust is a few strands (Strands), side by side and each a little different in length, as the game
 *      duplicated one curve, offset.
 *   5. Light: how squarely each point faces the light (half-Lambert of the face turned to the eye), the light
 *      where the dial lays the sun: across by its way, as high as its height.
 *
 * Outputs maps, never colour: the ribbons (with faded ends), Facing, Side (front face light, back face dark) and
 * Depth (near light). A graph lights them in bands (Posterize and a Gradient Map), so they are cel-shaded.
 * Everything is placed in page units (the page's shorter side is 1), so a preview and its export match.
 */
import { mulberry32 } from './texCore.js';

const ST_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
export const STREAMER_SHAPES = ['Gust', 'Spiral', 'Loop', 'Wave', 'Mixed'];

// ---- small vector helpers (world: x right, y up, z away from the eye)
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0]*k, a[1]*k, a[2]*k];
const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
const cross = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
/** Turn v round the unit axis k by angle t (Rodrigues). */
const turn = (v, k, t) => { const c = Math.cos(t), s = Math.sin(t); return add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v)*(1 - c))); };

/**
 * One path, in world units from its start: shape 0 Gust, 1 Spiral, 2 Loop, 3 Wave. d is the wind's way on the
 * ground, up is up; L its length; curl how many turns at the end; R a seeded random. Returns { pts, bend } where
 * bend is the unit normal of the plane each point bends in (the ribbon spreads in that plane).
 */
function streamPath(shape, d, L, curl, R, down){
  const up = [0, down ? -1 : 1, 0], side = norm(cross([0, 1, 0], d)), pts = [], plane = [];
  const K = 140, drift = (R() - 0.5)*0.25;
  if(shape === 1){                                    // SPIRAL: a coil round an upright axis, tightening as it rises
    const r0 = L*0.32, turns = 1.2 + curl*2.4, rise = L*(0.25 + R()*0.35)*(down ? -1 : 1);
    for(let i = 0; i <= K; i++){ const s = i/K, a = s*turns*Math.PI*2, r = r0*(0.22 + 0.78*Math.exp(-2.2*s));
      pts.push(add(add(mul(side, Math.cos(a)*r), mul(d, Math.sin(a)*r)), [0, rise*s, 0])); plane.push([0, 1, 0]); }
    return { pts, plane };
  }
  // a run along the wind, with a gentle rise and fall, then (Gust, Loop) a curl in the upright plane of the wind
  const run = shape === 3 ? 1 : shape === 2 ? 0.62 : Math.max(0.3, 1 - 0.18 - curl*0.32), wav = shape === 3 ? 0.08 + R()*0.06 : 0.025 + R()*0.03;
  const waves = shape === 3 ? 1.5 + R()*2 : 0.6 + R()*0.8, ph = R()*Math.PI*2, Kr = Math.round(K*run);
  const at = s => add(add(mul(d, s*L), mul(up, Math.sin(ph + s*waves*Math.PI*2)*wav*L - Math.sin(ph)*wav*L)), mul(side, drift*s*L));
  for(let i = 0; i <= Kr; i++){ pts.push(at(i/K)); plane.push(side); }
  if(shape === 3) return { pts, plane };
  // the curl starts where the run ends, heading on along the run's own direction
  const E = pts[pts.length - 1], T0 = norm(sub(E, pts[pts.length - 2])), U = norm(sub(up, mul(T0, dot(up, T0))));
  const turns = shape === 2 ? 1 : 0.6 + curl*1.9, r0 = L*(shape === 2 ? 0.1 : 0.07 + curl*0.06), Kc = K - Kr;
  const C = add(E, mul(U, r0));
  for(let i = 1; i <= Kc; i++){ const s = i/Kc, a = s*turns*Math.PI*2;
    // (Gust: the radius falls fast at first, slower after — Gordon's spiral; Loop: a round loop, then on along the wind)
    const r = shape === 2 ? r0 : r0*(0.12 + 0.88*Math.exp(-2.6*s*turns/1.6));
    const p = add(add(C, add(mul(T0, Math.sin(a)*r), mul(U, -Math.cos(a)*r))), mul(side, s*r0*0.9*(drift > 0 ? 1 : -1)));
    pts.push(p); plane.push(side); }
  if(shape === 2){ const last = pts[pts.length - 1]; for(let i = 1; i <= 40; i++) { pts.push(add(last, mul(T0, i/40*L*0.35))); plane.push(side); } }
  return { pts, plane };
}

export const STREAMER_STEPS = {
  streamers: { cat: 'Marks', label: 'Streamers', ins: ['where', 'blow from', 'light from'], outs: ['ribbons', 'facing', 'side', 'depth'],
    io: { ins: ['field', 'value', 'value'], outs: ['field', 'field', 'field', 'field'] },
    params: [ST_R('shape', 'Shape: ' + STREAMER_SHAPES.join(' · '), 0), ST_R('count', 'Gusts', 6, 0, 40), ST_R('strands', 'Strands', 3, 1, 8), ST_R('length', 'Length', 50),
      ST_R('curl', 'Curl', 50), ST_R('width', 'Width', 100, 20, 300), ST_R('twist', 'Twist', 30), ST_R('depth', 'Depth', 60), ST_R('horizon', 'Horizon', 45), ST_R('variant', 'Variation', 0, 0, 99)],
    cost: () => 4,
    doc: 'Ribbons swept along curves in 3D space and seen through a camera: gusts that run with the wind and end in a tightening curl, spirals, loops or waves, near ones large and far ones small, twisting to show both faces. Maps only (the ribbons, how they face the light, which face, how near), for a graph to light in bands.',
    run(E, n){ const { ww, wh, num } = E, N = ww*wh, mn = Math.min(ww, wh), W = ww/mn, H = wh/mn;
      // (a way wired as a map, as Math hands on, counts by its mean)
      const valOf = v => typeof v === 'number' ? v : v && v.length ? v.reduce((a, b) => a + b, 0)/v.length : null;
      const whereF = E.asField(E.input(n, 1)), bv = valOf(E.input(n, 2)), lv = valOf(E.input(n, 3));
      const fieldAt = (x, y) => whereF ? whereF[Math.min(wh - 1, Math.max(0, y*mn | 0))*ww + Math.min(ww - 1, Math.max(0, x*mn | 0))] : 1;
      const seed = ((((E.ctx.seed >>> 0) + Math.round(num(n, 'variant', 0))*7919) >>> 0) ^ 0x57a3) >>> 0, R = mulberry32(seed);
      const shapeK = Math.min(4, Math.floor(num(n, 'shape', 0)/100*5)), count = Math.round(num(n, 'count', 6)), strands = Math.round(num(n, 'strands', 3));
      const lenK = num(n, 'length', 50)/100, curl = num(n, 'curl', 50)/100, widK = num(n, 'width', 100)/100, twist = num(n, 'twist', 30)/100, depthK = num(n, 'depth', 60)/100;
      const hz = num(n, 'horizon', 45)/100*H;
      // ---- the camera: the eye 1 above the sea, looking level at the horizon
      const f = 1.15*Math.max(W, H), eye = 1, proj = p => [W/2 + f*p[0]/p[2], hz - f*p[1]/p[2]];
      // ---- the wind's way on the ground (the dial's way: up the page is away from the eye), the sun's direction
      const bdeg = typeof bv === 'number' ? bv*360 : (E.ctx.light ?? 315), ba = bdeg*Math.PI/180;
      const d = norm([Math.sin(ba), 0, Math.cos(ba)*0.7]);
      const ldeg = typeof lv === 'number' ? lv*360 : (E.ctx.light ?? 315), la = ldeg*Math.PI/180, tilt = Math.min(1, Math.max(0, (E.ctx.lightTilt ?? 100)/100));
      const el = tilt*tilt*1.2, Ls = norm([Math.sin(la)*0.9*Math.cos(el), Math.sin(el), Math.cos(el)*0.6]);
      // ---- the gusts: placed, pathed, made ribbons, cut into quads
      const quads = [], zNear = 1.6, zFar = zNear + 4 + depthK*36;
      for(let g = 0; g < count; g++){
        let sx = 0, sy = 0, ok = false;
        for(let t = 0; t < 40 && !ok; t++){ sx = R()*W; sy = R()*H; ok = R() < fieldAt(sx, sy); }
        if(!ok) continue;
        let z = zNear*Math.pow(zFar/zNear, Math.pow(R(), 0.8));
        const yAt = z => (hz - sy)*z/f;
        // (never below the sea: a point under the horizon can only be near)
        if(sy > hz){ const zMax = (eye - 0.12)*f/(sy - hz); if(zMax < zNear*0.7) continue; z = Math.min(z, zMax); }
        // (and never far above it: a point high on the page lies far away)
        else if(sy < hz){ const zMin = (hz - sy)*f/(eye*2.2); if(zMin > zFar*1.6) continue; z = Math.max(z, zMin); }
        const start = [(sx - W/2)*z/f, yAt(z), z];
        const shape = shapeK === 4 ? [0, 0, 0, 1, 2, 3][Math.floor(R()*6)] : shapeK;
        const L = (0.6 + lenK*3.2)*(0.7 + R()*0.6)*Math.max(1, z*0.12), dg = norm(add(d, [0, 0, (R() - 0.5)*0.4]));
        // (begin back along the wind, so the gust passes through the chosen point; a curl heads down only with room)
        const down = start[1] > 0.6 && R() < 0.3, hw0 = (0.006 + 0.022*widK)*(0.75 + R()*0.5)*Math.max(1, z*0.06);
        const ns = Math.max(1, Math.min(strands, 1 + Math.floor(R()*strands*1.3)));
        for(let k = 0; k < ns; k++){
          const { pts, plane } = streamPath(shape, dg, L*(1 - k*0.13 - R()*0.08), curl*(0.85 + R()*0.3), mulberry32((seed + g*131 + k*17) >>> 0), down);
          const off = add(mul([0, 1, 0], (k - (ns - 1)/2)*hw0*3.2), mul(norm(cross([0, 1, 0], dg)), (R() - 0.5)*hw0*4));
          const o = add(sub(start, mul(dg, L*0.35)), off), P = pts.map(p => add(p, o)), K = P.length - 1;
          if(P.some(p => p[2] < 0.35 || p[1] < -eye + 0.04)) continue;
          const tw0 = R()*Math.PI*2, tws = (R() < 0.5 ? -1 : 1)*twist*Math.PI*(1 + R()*1.5);
          const edges = P.map((p, i) => { const s = i/K, T = norm(sub(P[Math.min(K, i + 1)], P[Math.max(0, i - 1)]));
            // the ribbon spreads across the curve, in the plane it bends in, turned by Twist
            let w = norm(cross(T, plane[i])); w = turn(w, T, tw0*twist + tws*s);
            const hw = hw0*Math.pow(Math.min(1, s/0.08), 0.5)*(1 - 0.75*Math.pow(s, 1.6));
            const nrm = norm(cross(T, w)), toEye = norm(mul(p, -1)), face = dot(nrm, toEye) >= 0 ? nrm : mul(nrm, -1);
            const lit = 0.5 + 0.5*dot(face, Ls), side = dot(nrm, toEye) >= 0 ? 1 : 0;
            const fade = Math.min(1, s/0.14, (1 - s)/0.05);
            return { a: proj(add(p, mul(w, hw))), b: proj(add(p, mul(w, -hw))), z: p[2], lit, side, fade: Math.max(0, fade) }; });
          for(let i = 0; i < K; i++){ const e0 = edges[i], e1 = edges[i + 1];
            quads.push({ q: [e0.a, e1.a, e1.b, e0.b], z: (e0.z + e1.z)/2, lit: (e0.lit + e1.lit)/2, side: e0.side, fade: (e0.fade + e1.fade)/2 }); }
        }
      }
      quads.sort((a, b) => b.z - a.z);
      // ---- drawing, far to near, at the grid's resolution
      const S = mn, lnZ = Math.log(zFar/zNear);
      const paint = (x, grey, mode) => { if(mode) x.globalCompositeOperation = mode; x.lineJoin = 'round'; x.lineWidth = 0.8;
        for(const Q of quads){ const g = Math.round(255*Math.max(0, Math.min(1, grey(Q)))), c = `rgb(${g},${g},${g})`; x.fillStyle = c; x.strokeStyle = c;
          x.beginPath(); Q.q.forEach(([X, Y], i) => i ? x.lineTo(X*S, Y*S) : x.moveTo(X*S, Y*S)); x.closePath(); x.fill(); x.stroke(); } };
      const ribF = E.marks(null, 0, x => paint(x, Q => Q.fade, 'lighten'));
      const faceF = E.marks(null, 0, x => paint(x, Q => Q.lit));
      const sideF = E.marks(null, 0, x => paint(x, Q => Q.side));
      const depthF = E.marks(null, 0, x => paint(x, Q => 1 - Math.log(Math.max(zNear, Q.z)/zNear)/lnZ));
      return [ribF, faceF, sideF, depthF]; } },
};
