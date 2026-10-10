/**
 * stitches.js — decorative lines, after a sewing machine's stitch chart.
 *
 * One idea: a PATH (any line or shape, sampled by length) and a MOTIF laid
 * along it. Rules are straight paths, borders are the frame's rounded
 * rectangle, a cloth's seams are straight paths across it — so every motif
 * works everywhere, drawn by the same function.
 *
 * A motif has a SIDE it points toward (+1 or -1 along the path's normal):
 * scallops bulge that way, blanket teeth reach that way, hearts point that
 * way. For a rectangle traced clockwise, +1 is inward; for a rule drawn left
 * to right, +1 is down.
 *
 * Every motif also knows its INNER EDGE (stitchInnerEdge), so an inset box can
 * follow a stitched border's shape instead of a plain rectangle.
 *
 * Pure canvas calls and arithmetic: no DOM, no imports, so it runs anywhere.
 */

/** A path through points, measured by length: point(s, v) is the point s along
 *  it, pushed v along its normal. */
export function pathFromPoints(pts, closed){
  const P = closed ? pts.concat([pts[0]]) : pts.slice();
  const cum = [0];
  for(let i = 1; i < P.length; i++) cum.push(cum[i-1] + Math.hypot(P[i][0]-P[i-1][0], P[i][1]-P[i-1][1]));
  const len = cum[cum.length - 1];
  const point = (s, v = 0) => {
    s = closed ? ((s % len) + len) % len : Math.max(0, Math.min(len, s));
    let lo = 1, hi = cum.length - 1;                    // binary search: paths can be long
    while(lo < hi){ const m = (lo + hi) >> 1; if(cum[m] < s) lo = m + 1; else hi = m; }
    const i = lo, a = P[i-1], b = P[i], seg = (cum[i] - cum[i-1]) || 1, t = (s - cum[i-1]) / seg;
    const tx = (b[0]-a[0]) / seg, ty = (b[1]-a[1]) / seg;
    return [a[0] + (b[0]-a[0])*t - ty*v, a[1] + (b[1]-a[1])*t + tx*v];
  };
  return { len, closed: !!closed, point };
}

/** A rounded rectangle's outline, clockwise from the top edge, as points. */
export function roundRectPoints(x, y, w, h, r, perCorner = 10){
  r = Math.max(0, Math.min(r, w/2, h/2));
  if(r < 0.5) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const pts = [];
  const corner = (cx, cy, a0) => { for(let k = 0; k <= perCorner; k++){ const a = a0 + (k/perCorner)*Math.PI/2; pts.push([cx + Math.cos(a)*r, cy + Math.sin(a)*r]); } };
  corner(x + w - r, y + r, -Math.PI/2);
  corner(x + w - r, y + h - r, 0);
  corner(x + r, y + h - r, Math.PI/2);
  corner(x + r, y + r, Math.PI);
  return pts;
}

// ---- colour, for shading ----
const parseCol = c => { if(typeof c !== 'string') return null;
  let m = /^#([0-9a-f]{3,8})$/i.exec(c.trim());
  if(m){ let h = m[1]; if(h.length === 3) h = h.split('').map(x => x + x).join(''); return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16), h.length === 8 ? parseInt(h.slice(6,8),16)/255 : 1]; }
  m = /^rgba?\(([^)]+)\)$/i.exec(c.trim()); if(m){ const p = m[1].split(',').map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
  return null; };
/** The colour lightened (k > 0, toward white) or darkened (k < 0). A gradient
 *  colour can't be shaded, so it comes back unchanged. */
function shade(c, k){
  const p = parseCol(c); if(!p) return c;
  const f = v => k >= 0 ? v + (255 - v)*k : v*(1 + k);
  return `rgba(${f(p[0])|0},${f(p[1])|0},${f(p[2])|0},${p[3]})`;
}

// ---- the motifs ----
// Each draws one family along the path through `M`, a small kit:
//   M.at(s, v)     a point s along the path, v toward the motif's side
//   M.P, M.A, M.W  repeat length, reach, thread width       M.len  path length
//   M.each(fn)     calls fn(s, k) at the start of every repeat
//   M.trace(f)     strokes the curve v = f(s) along the whole path
//   M.poly(pts, close) / M.ang(s)  a path through points / the direction at s
//   M.ball(x, y, r, col)  a shaded sphere      M.c  the colour
// `edge(s, M)` (optional) gives the motif's inner boundary as v at s, for an
// inset box that follows it; motifs without one keep the box clear of their reach.
const sinw = (s, P) => Math.sin((s / P) * Math.PI * 2);
const tri  = (s, P) => { const t = ((s / P) % 1 + 1) % 1; return t < 0.5 ? 4*t - 1 : 3 - 4*t; };
const MOTIFS = {
  // lines
  solid:     { draw: M => M.trace(() => 0), edge: () => 0 },
  dashed:    { draw: M => M.each(s => { M.poly([M.at(s, 0), M.at(s + M.P*0.6, 0)]); M.ctx.stroke(); }), edge: () => 0 },
  double:    { draw: M => { M.ctx.lineWidth = M.W*0.8; M.trace(() => -M.A*0.3); M.trace(() => M.A*0.3); }, edge: (s, M) => M.A*0.3 },
  dotted:    { draw: M => { for(let s = 0; s <= M.len; s += M.W*3.2) M.dot(M.at(s, 0), M.W*0.7); }, edge: () => 0 },
  // waves and zigzags
  wave:      { draw: M => M.trace(s => M.A*sinw(s, M.P)), edge: (s, M) => M.A*sinw(s, M.P) },
  serpent:   { draw: M => M.trace(s => M.A*1.2*sinw(s, M.P*2)), edge: (s, M) => M.A*1.2*sinw(s, M.P*2) },
  zigzag:    { draw: M => M.trace(s => M.A*tri(s, M.P)), edge: (s, M) => M.A*tri(s, M.P) },
  ricrac:    { draw: M => { M.ctx.lineWidth = M.W*1.8; M.trace(s => M.A*Math.sign(sinw(s, M.P))*Math.pow(Math.abs(sinw(s, M.P)), 0.5)); }, edge: (s, M) => M.A*Math.sign(sinw(s, M.P))*Math.pow(Math.abs(sinw(s, M.P)), 0.5) },
  square:    { draw: M => { const pts = []; M.each(s => { pts.push(M.at(s, -M.A), M.at(s + M.P*0.5, -M.A), M.at(s + M.P*0.5, M.A), M.at(s + M.P, M.A)); }); M.poly(pts, M.closed); M.ctx.stroke(); },
               edge: (s, M) => (((s / M.P) % 1) < 0.5 ? -M.A : M.A) },
  greek:     { draw: M => { // a continuous meander: every repeat turns a square spiral and runs on
                 const u = M.P/5, a = M.A/2, pts = [];
                 M.each(s => { for(const [x, y] of [[0,-2],[0,2],[4,2],[4,-1],[2,-1],[2,1],[3,1],[3,0],[1,0],[1,-2],[5,-2]]) pts.push(M.at(s + x*u, y*a)); });
                 M.poly(pts, false); M.ctx.stroke(); }, edge: (s, M) => M.A },
  // scallops and arches
  scallop:   { draw: M => M.trace(s => M.A*Math.abs(Math.sin((s/M.P)*Math.PI))), edge: (s, M) => M.A*Math.abs(Math.sin((s/M.P)*Math.PI)) },
  // edging
  blanket:   { draw: M => { M.trace(() => 0); M.each(s => { M.poly([M.at(s, 0), M.at(s, M.A*1.6)]); M.ctx.stroke(); }); } },
  fringe:    { draw: M => { M.ctx.lineWidth = M.W*0.7; for(let s = 0; s < M.len; s += M.P/6){ M.poly([M.at(s, 0), M.at(s, M.A*(1.4 + 0.5*Math.sin(s*1.7)))]); M.ctx.stroke(); } } },
  ladder:    { draw: M => { M.trace(() => -M.A*0.6); M.trace(() => M.A*0.6); M.each(s => { M.poly([M.at(s, -M.A*0.6), M.at(s, M.A*0.6)]); M.ctx.stroke(); }); }, edge: (s, M) => M.A*0.6 },
  lattice:   { draw: M => { M.ctx.lineWidth = M.W*0.6; M.trace(() => -M.A); M.trace(() => M.A);
                 for(let s = -M.P; s < M.len; s += M.P/2){ M.poly([M.at(s, -M.A), M.at(s + M.P, M.A)]); M.ctx.stroke(); M.poly([M.at(s, M.A), M.at(s + M.P, -M.A)]); M.ctx.stroke(); } }, edge: (s, M) => M.A },
  cross:     { draw: M => M.each(s => { M.poly([M.at(s + M.P*0.15, -M.A), M.at(s + M.P*0.85, M.A)]); M.ctx.stroke(); M.poly([M.at(s + M.P*0.15, M.A), M.at(s + M.P*0.85, -M.A)]); M.ctx.stroke(); }) },
  // plants and arrows
  herringbone: { draw: M => M.each(s => { M.poly([M.at(s, -M.A), M.at(s + M.P*0.75, M.A)]); M.ctx.stroke(); M.poly([M.at(s + M.P*0.5, M.A), M.at(s + M.P*1.25, -M.A)]); M.ctx.stroke(); }) },
  wheat:     { draw: M => { M.trace(() => 0); M.each(s => { for(const v of [-1, 1]) M.leaf(M.at(s + M.P*0.35, v*M.A*0.15), M.at(s + M.P*0.85, v*M.A*0.9), M.A*0.32); }); } },
  chevron:   { draw: M => M.each(s => { M.poly([M.at(s + M.P*0.2, -M.A), M.at(s + M.P*0.6, 0), M.at(s + M.P*0.2, M.A)]); M.ctx.stroke(); }) },
  // loops, chains, rope
  chain:     { draw: M => M.each(s => { const c = M.at(s + M.P*0.5, 0); M.ctx.beginPath(); M.ctx.ellipse(c[0], c[1], M.P*0.55, M.A*0.65, M.ang(s + M.P*0.5), 0, Math.PI*2); M.ctx.stroke(); }), edge: (s, M) => M.A*0.65 },
  loops:     { draw: M => { const pts = []; for(let s = 0; s <= M.len; s += M.P/16){ const t = (s/M.P)*Math.PI*2; pts.push(M.at(s - Math.sin(t)*M.P*0.32, M.A*Math.cos(t)*0.9)); } M.poly(pts, M.closed); M.ctx.stroke(); }, edge: (s, M) => M.A*0.9 },
  rope:      { draw: M => { // twisted strands: each slants across the rope and overlaps the next
                 M.ctx.lineWidth = M.W*1.6;
                 // open lines start and end cleanly; closed ones wrap
                 for(let s = M.closed ? -M.P : 0; s < M.len - (M.closed ? 0 : M.P*0.7); s += M.P*0.45){ const pts = [];
                   for(let k = 0; k <= 8; k++){ const t = k/8; pts.push(M.at(s + M.P*0.7*t, M.A*0.85*Math.cos(Math.PI*t))); }
                   M.poly(pts, false); M.ctx.strokeStyle = shade(M.c, -0.25); M.ctx.lineWidth = M.W*2.2; M.ctx.stroke();
                   M.ctx.strokeStyle = shade(M.c, 0.25); M.ctx.lineWidth = M.W*1.1; M.ctx.stroke(); }
                 M.ctx.strokeStyle = M.c; M.ctx.lineWidth = M.W; }, edge: (s, M) => M.A*0.85 },
  circles:   { draw: M => M.each(s => { const c = M.at(s + M.P*0.5, 0); M.ctx.beginPath(); M.ctx.arc(c[0], c[1], Math.min(M.P*0.5, M.A), 0, Math.PI*2); M.ctx.stroke(); }) },
  // filled, and shaded like the real thing
  beads:     { draw: M => M.each(s => { const c = M.at(s + M.P*0.5, 0); M.ball(c[0], c[1], Math.min(M.P*0.3, M.A*0.75), M.c); }) },
  satindiamond: { draw: M => M.each(s => { M.poly([M.at(s + M.P*0.06, 0), M.at(s + M.P*0.5, M.A), M.at(s + M.P*0.94, 0), M.at(s + M.P*0.5, -M.A)], true); M.fillShaded(M.at(s + M.P*0.5, 0), M.A); }) },
  hearts:    { draw: M => M.each(s => M.heart(s + M.P*0.5, true)) },
  // stars, moons, snow
  stars:     { draw: M => M.each(s => M.star(M.at(s + M.P*0.5, 0), Math.min(M.P*0.36, M.A), 5, 0.45)) },
  sparkle:   { draw: M => M.each(s => M.star(M.at(s + M.P*0.5, 0), Math.min(M.P*0.4, M.A*1.1), 4, 0.22)) },
  starline:  { draw: M => { M.ctx.lineWidth = M.W*0.6; M.trace(() => 0); M.ctx.lineWidth = M.W; M.each((s, k) => { if(k%2 === 0) M.star(M.at(s + M.P*0.5, 0), Math.min(M.P*0.4, M.A), 4, 0.3); }); } },
  moons:     { draw: M => M.each((s, k) => { // phases wax and wane along the line
                 const c = M.at(s + M.P*0.5, 0), r = Math.min(M.P*0.32, M.A*0.8), ph = ((k*0.125) % 1);
                 M.ctx.beginPath(); M.ctx.arc(c[0], c[1], r, 0, Math.PI*2); M.ctx.stroke(); M.moon(c, r, ph); }) },
  snowflakes:{ draw: M => M.each(s => { const c = M.at(s + M.P*0.5, 0), r = Math.min(M.P*0.4, M.A);
                 for(let k = 0; k < 6; k++){ const a = k*Math.PI/3, e = [c[0] + Math.cos(a)*r, c[1] + Math.sin(a)*r];
                   M.poly([c, e]); M.ctx.stroke(); const m = [c[0] + Math.cos(a)*r*0.6, c[1] + Math.sin(a)*r*0.6];
                   for(const d of [-0.6, 0.6]) { M.poly([m, [m[0] + Math.cos(a + d)*r*0.3, m[1] + Math.sin(a + d)*r*0.3]]); M.ctx.stroke(); } } }) },
  // flowers and leaves
  daisy:     { draw: M => M.each(s => { const c = M.at(s + M.P*0.5, 0), r = Math.min(M.P*0.42, M.A);
                 for(let k = 0; k < 8; k++){ const a = k*Math.PI/4; M.leaf([c[0] + Math.cos(a)*r*0.2, c[1] + Math.sin(a)*r*0.2], [c[0] + Math.cos(a)*r, c[1] + Math.sin(a)*r], r*0.16); }
                 M.ball(c[0], c[1], r*0.22, shade(M.c, 0.55)); }) },
  vine:      { draw: M => { M.trace(s => M.A*0.45*sinw(s, M.P));
                 M.each((s, k) => { const v = (k%2 ? 1 : -1); M.leaf(M.at(s + M.P*0.25, M.A*0.45*v), M.at(s + M.P*0.55, M.A*1.25*v), M.A*0.28); }); } },
  leaves:    { draw: M => M.each(s => M.leaf(M.at(s + M.P*0.1, 0), M.at(s + M.P*0.9, 0), M.A*0.55)), edge: (s, M) => M.A*0.55 },
  pine:      { draw: M => M.each(s => { const pts = [M.at(s + M.P*0.15, 0), M.at(s + M.P*0.5, M.A*1.3), M.at(s + M.P*0.85, 0)]; M.poly(pts, true); M.fillShaded(M.at(s + M.P*0.5, M.A*0.6), M.A); }) },
  pennants:  { draw: M => { M.trace(() => 0); M.each((s, k) => { M.poly([M.at(s + M.P*0.08, 0), M.at(s + M.P*0.5, M.A*1.3), M.at(s + M.P*0.92, 0)], true); M.ctx.fillStyle = k%2 ? M.c : shade(M.c, 0.35); M.ctx.fill(); M.ctx.fillStyle = M.c; }); } },
  checker:   { draw: M => M.each((s, k) => { const v = k%2 ? M.A*0.5 : -M.A*0.5;
                 M.poly([M.at(s, v - M.A*0.5), M.at(s + M.P, v - M.A*0.5), M.at(s + M.P, v + M.A*0.5), M.at(s, v + M.A*0.5)], true); M.ctx.fill(); }), edge: (s, M) => M.A },
  scroll:    { draw: M => M.each((s, k) => { const v = k%2 ? 1 : -1, pts = [];
                 for(let i = 0; i <= 26; i++){ const t = i/26, r = M.A*(1 - t*0.85), a = t*Math.PI*2.4*v;
                   const base = M.at(s + M.P*(0.5 + 0.45*(1 - t)), 0), n = M.at(s + M.P*(0.5 + 0.45*(1 - t)), 1);
                   const nx = n[0] - base[0], ny = n[1] - base[1], tx = ny, ty = -nx;
                   pts.push([base[0] + (Math.cos(a)*tx + Math.sin(a)*nx)*r*1.1, base[1] + (Math.cos(a)*ty + Math.sin(a)*ny)*r*1.1]); }
                 M.poly(pts, false); M.ctx.stroke(); }) },
  // for the kitsune of Enceladus
  tails:     { draw: M => M.each((s, k) => { // seven fox tails, fanned — and one of the seven is red
                 const base = M.at(s + M.P*0.5, -M.A*0.1);
                 for(let t = 0; t < 7; t++){ const a = M.ang(s) + Math.PI/2 + (t - 3)*0.24;
                   const tip = [base[0] + Math.cos(a)*M.A*1.5, base[1] + Math.sin(a)*M.A*1.5];
                   M.ctx.fillStyle = (t === (k*3) % 7) ? '#c2263a' : M.c;
                   M.leaf(base, tip, M.A*0.2); M.ctx.fillStyle = shade(M.c, 0.6); M.dot(tip, M.A*0.07); }
                 M.ctx.fillStyle = M.c; }) },
  rubies:    { draw: M => M.each(s => { // a faceted gem with a light-etched line in its heart
                 const c = M.at(s + M.P*0.5, 0), r = Math.min(M.P*0.36, M.A*0.85), a = M.ang(s);
                 const pt = (ang, rr) => [c[0] + Math.cos(a + ang)*rr, c[1] + Math.sin(a + ang)*rr];
                 const rim = [0, 1, 2, 3, 4, 5].map(i => pt(i*Math.PI/3, r));
                 M.poly(rim, true); M.fillShaded(pt(-2.2, r*0.3), r*1.4, '#b3122e');
                 M.ctx.lineWidth = M.W*0.5; M.ctx.strokeStyle = 'rgba(255,220,225,0.55)';
                 for(const p of rim){ M.poly([pt(0, 0), p]); M.ctx.stroke(); }
                 M.ctx.strokeStyle = 'rgba(255,245,240,0.9)'; M.poly([pt(Math.PI*0.85, r*0.45), pt(Math.PI*0.2, r*0.1), pt(-Math.PI*0.3, r*0.5)]); M.ctx.stroke();
                 M.ctx.strokeStyle = M.c; M.ctx.lineWidth = M.W; }) },
  saturn:    { draw: M => M.each(s => { const c = M.at(s + M.P*0.5, 0), r = Math.min(M.P*0.22, M.A*0.6), a = M.ang(s) - 0.35;
                 M.ctx.beginPath(); M.ctx.ellipse(c[0], c[1], r*2.1, r*0.55, a, Math.PI, Math.PI*2); M.ctx.stroke();   // the ring behind
                 M.ball(c[0], c[1], r, M.c);
                 M.ctx.beginPath(); M.ctx.ellipse(c[0], c[1], r*2.1, r*0.55, a, 0, Math.PI); M.ctx.stroke(); }) },  // and in front
  enceladus: { draw: M => M.each(s => { // an icy moon: tiger-stripe fissures, geysers rising from them
                 const c = M.at(s + M.P*0.5, 0), r = Math.min(M.P*0.3, M.A*0.7);
                 M.ball(c[0], c[1], r, shade(M.c, 0.55));
                 M.ctx.lineWidth = M.W*0.55; M.ctx.strokeStyle = shade(M.c, -0.35);
                 for(const d of [-0.35, 0, 0.35]){ M.poly([[c[0] - r*0.55, c[1] + r*(0.35 + d*0.5)], [c[0] + r*0.5, c[1] + r*(0.5 + d*0.5)]]); M.ctx.stroke(); }
                 M.ctx.strokeStyle = shade(M.c, 0.7);
                 for(const d of [-0.3, 0, 0.3]){ M.poly([[c[0] + d*r, c[1] + r*0.9], [c[0] + d*r*1.6, c[1] + r*1.9]]); M.ctx.stroke(); }
                 M.ctx.strokeStyle = M.c; M.ctx.lineWidth = M.W; }) },
};
// Every motif SHAPES an inset box (Ruby): its edge is the motif's own
// silhouette on its side, so the box is cut by it — bitten by beads, stars and
// hearts pointing in; given their bumps pointing out; and with the border on,
// the motif sits exactly in its bite. (Repeats measured as a fraction of P.)
const frac = (s, P) => ((s / P) % 1 + 1) % 1;
const roundBump = (s, M, c, r) => { const d = (frac(s, M.P) - c)*M.P; return Math.abs(d) < r ? Math.sqrt(r*r - d*d) : 0; };
const ovalBump = (s, M, c, hw, h) => { const d = (frac(s, M.P) - c)*M.P; return Math.abs(d) < hw ? h*Math.sqrt(1 - (d/hw)*(d/hw)) : 0; };
const tentBump = (s, M, a, b, h) => { const t = frac(s, M.P); if(t <= a || t >= b) return 0; return h*(1 - Math.abs(t - (a + b)/2)/((b - a)/2)); };
const EDGES = {
  blanket:     (s, M) => { const d = frac(s, M.P)*M.P; return (d < M.W*1.3 || M.P - d < M.W*1.3) ? M.A*1.6 : 0; },
  fringe:      (s, M) => M.A*1.4,
  cross:       (s, M) => { const t = frac(s, M.P); return t > 0.15 && t < 0.85 ? M.A*Math.abs(t - 0.5)/0.35 : 0; },
  herringbone: (s, M) => M.A*(0.6 + 0.4*sinw(s - M.P*0.375, M.P)),
  wheat:       (s, M) => tentBump(s, M, 0.3, 0.95, M.A*0.95),
  chevron:     (s, M) => { const t = frac(s, M.P); return t > 0.2 && t < 0.6 ? M.A*(0.6 - t)/0.4 : 0; },
  circles:     (s, M) => roundBump(s, M, 0.5, Math.min(M.P*0.5, M.A) + M.W*0.5),
  beads:       (s, M) => roundBump(s, M, 0.5, Math.min(M.P*0.3, M.A*0.75)),
  satindiamond:(s, M) => tentBump(s, M, 0.06, 0.94, M.A),
  hearts:      (s, M) => ovalBump(s, M, 0.5, Math.min(M.P*0.3, M.A*0.75)*1.15, Math.min(M.P*0.3, M.A*0.75)*1.15),
  stars:       (s, M) => roundBump(s, M, 0.5, Math.min(M.P*0.36, M.A)*0.85),
  sparkle:     (s, M) => tentBump(s, M, 0.5 - Math.min(M.P*0.4, M.A*1.1)*0.45/M.P, 0.5 + Math.min(M.P*0.4, M.A*1.1)*0.45/M.P, Math.min(M.P*0.4, M.A*1.1)),
  starline:    (s, M) => Math.floor(((s % (2*M.P)) + 2*M.P) % (2*M.P) / M.P) === 0 ? tentBump(s, M, 0.5 - Math.min(M.P*0.4, M.A)*0.4/M.P, 0.5 + Math.min(M.P*0.4, M.A)*0.4/M.P, Math.min(M.P*0.4, M.A)) : 0,
  moons:       (s, M) => roundBump(s, M, 0.5, Math.min(M.P*0.32, M.A*0.8) + M.W*0.5),
  snowflakes:  (s, M) => roundBump(s, M, 0.5, Math.min(M.P*0.4, M.A)*0.9),
  daisy:       (s, M) => roundBump(s, M, 0.5, Math.min(M.P*0.42, M.A)),
  vine:        (s, M) => M.A*0.45*sinw(s, M.P),
  pine:        (s, M) => tentBump(s, M, 0.15, 0.85, M.A*1.3),
  pennants:    (s, M) => tentBump(s, M, 0.08, 0.92, M.A*1.3),
  scroll:      (s, M) => roundBump(s, M, 0.5, Math.min(M.P*0.45, M.A*1.1)),
  tails:       (s, M) => ovalBump(s, M, 0.5, M.A*1.0, M.A*1.5),
  rubies:      (s, M) => roundBump(s, M, 0.5, Math.min(M.P*0.36, M.A*0.85)),
  saturn:      (s, M) => { const r = Math.min(M.P*0.22, M.A*0.6); return Math.max(roundBump(s, M, 0.5, r), ovalBump(s, M, 0.5, r*2.1, r*0.55)); },
  enceladus:   (s, M) => roundBump(s, M, 0.5, Math.min(M.P*0.3, M.A*0.7)),
  dotted:      (s, M) => 0,
  chain:       (s, M) => ovalBump(s, M, 0.5, M.P*0.55, M.A*0.65),
  loops:       (s, M) => M.A*0.55 + roundBump(s, M, 0.5, Math.min(M.P*0.45, M.A*0.5))*0.7,
  rope:        (s, M) => M.A*0.85*(0.7 + 0.3*Math.abs(Math.cos(Math.PI*frac(s, M.P*0.45)))),
  leaves:      (s, M) => ovalBump(s, M, 0.5, M.P*0.4, M.A*0.55),
  checker:     (s, M) => Math.floor(((s % (2*M.P)) + 2*M.P) % (2*M.P) / M.P) ? M.A : 0,
};
for(const [k, f] of Object.entries(EDGES)) if(MOTIFS[k]) MOTIFS[k].edge = f;
/** The border menu: the stitches worth choosing (Ruby: the redundant and the
 *  weak were retired). */
export const STITCH_STYLES = Object.keys(MOTIFS);
/** Retired stitches, each drawn as its nearest kept relative, so an old poem's
 *  rule or a saved look still draws (and still parses). */
export const STITCH_ALIASES = { running:'dashed', triple:'double', dotdash:'dashed', lightning:'zigzag', stepzig:'zigzag',
  satinscallop:'scallop', arches:'scallop', comb:'blanket', boxx:'lattice', crossbar:'cross', feather:'herringbone', fern:'wheat',
  fishbone:'chevron', arrows:'chevron', eyelets:'circles', pearls:'beads', diamond:'satindiamond', openhearts:'hearts',
  clubs:'beads', plus:'sparkle', asterisk:'snowflakes', flowers:'daisy' };
/** Every name PML and saved looks may use: the kept ones and the retired. */
export const STITCH_NAMES = STITCH_STYLES.concat(Object.keys(STITCH_ALIASES));
/** A stitch name as it is drawn now (a retired one becomes its relative). */
export function stitchOf(style){ return MOTIFS[style] ? style : (STITCH_ALIASES[style] || 'solid'); }
/** Display names for menus: the PML name, made readable. */
const NICE = { double:'Double Line', dotted:'Dotted', ricrac:'Ric-Rac', square:'Crenellation', greek:'Greek Key',
  satindiamond:'Diamonds', starline:'Star Thread', tails:'Seven Tails', enceladus:'Enceladus' };
export const STITCH_LABELS = Object.fromEntries(STITCH_STYLES.map(k => [k, NICE[k] || k[0].toUpperCase() + k.slice(1)]));

function kit(ctx, path, opts){
  const side = opts.side || 1, phase = opts.phase || 0;
  let P = Math.max(1, opts.period);
  if(path.closed){ const n = Math.max(3, Math.round(path.len / P)); P = path.len / n; }
  const M = { ctx, P, A: opts.amp, W: opts.width, c: opts.color, len: path.len, closed: path.closed };
  M.at = (s, v) => path.point(s + phase, v*side);
  M.ang = s => { const a = M.at(s, 0), b = M.at(s + Math.max(1, P*0.05), 0); return Math.atan2(b[1]-a[1], b[0]-a[0]); };
  M.poly = (pts, close) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); if(close) ctx.closePath(); };
  M.trace = f => { const n = Math.max(8, Math.ceil(path.len / (P/14))), pts = []; for(let k = 0; k <= n; k++){ const s = (k/n)*path.len; pts.push(M.at(s, f(s))); } M.poly(pts, path.closed); ctx.stroke(); };
  M.each = fn => { const reps = Math.ceil(path.len / P); for(let k = 0; k < reps; k++){ const s = k*P; if(path.closed || s + P*0.5 <= path.len + 1e-6) fn(s, k); } };
  M.dot = (p, r) => { ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(0.3, r), 0, Math.PI*2); ctx.fill(); };
  // a sphere lit from the upper left: highlight, body, shadowed edge
  M.ball = (x, y, r, col) => { const g = ctx.createRadialGradient(x - r*0.35, y - r*0.4, r*0.05, x, y, r);
    g.addColorStop(0, shade(col, 0.7)); g.addColorStop(0.45, col); g.addColorStop(1, shade(col, -0.45));
    ctx.fillStyle = parseCol(col) ? g : col; ctx.beginPath(); ctx.arc(x, y, Math.max(0.3, r), 0, Math.PI*2); ctx.fill(); ctx.fillStyle = M.c; };
  // fills the current path, lit from the upper left
  M.fillShaded = (p, r, col) => { col = col || M.c; const g = ctx.createRadialGradient(p[0] - r*0.4, p[1] - r*0.4, r*0.05, p[0], p[1], r*1.2);
    g.addColorStop(0, shade(col, 0.55)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.4));
    ctx.fillStyle = parseCol(col) ? g : col; ctx.fill(); ctx.fillStyle = M.c; };
  M.leaf = (a, b, w) => { const mx = (a[0]+b[0])/2, my = (a[1]+b[1])/2, L = Math.hypot(b[0]-a[0], b[1]-a[1]);
    ctx.beginPath(); ctx.ellipse(mx, my, L/2, Math.max(0.3, w), Math.atan2(b[1]-a[1], b[0]-a[0]), 0, Math.PI*2); ctx.fill(); };
  M.star = (c, r, n, inner) => { const pts = []; for(let k = 0; k < n*2; k++){ const a = -Math.PI/2 + k*Math.PI/n, rr = k%2 ? r*inner : r; pts.push([c[0] + Math.cos(a)*rr, c[1] + Math.sin(a)*rr]); } M.poly(pts, true); ctx.fill(); };
  M.heart = (s, fill) => { const c = M.at(s, 0), tip = M.at(s, M.A), a = Math.atan2(tip[1]-c[1], tip[0]-c[0]) - Math.PI/2, r = Math.min(P*0.3, M.A*0.75);
    ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, r*1.1);
    ctx.bezierCurveTo(-r*1.6, -r*0.2, -r*0.6, -r*1.4, 0, -r*0.5); ctx.bezierCurveTo(r*0.6, -r*1.4, r*1.6, -r*0.2, 0, r*1.1);
    if(fill){ const g = ctx.createRadialGradient(-r*0.4, -r*0.5, r*0.05, 0, 0, r*1.3); g.addColorStop(0, shade(M.c, 0.6)); g.addColorStop(0.5, M.c); g.addColorStop(1, shade(M.c, -0.35));
      ctx.fillStyle = parseCol(M.c) ? g : M.c; ctx.fill(); } else ctx.stroke();
    ctx.restore(); ctx.fillStyle = M.c; };
  // the lit part of a moon at phase p (0 new, 0.5 full), inside a circle
  M.moon = (c, r, p) => { const k = Math.cos(p*Math.PI*2), right = p < 0.5;
    ctx.beginPath(); ctx.arc(c[0], c[1], r, -Math.PI/2, Math.PI/2, !right);
    ctx.ellipse(c[0], c[1], Math.abs(k)*r, r, 0, Math.PI/2, -Math.PI/2, (k > 0) === right);
    ctx.fill(); };
  return M;
}

/**
 * Lays a motif along a path.
 *   opts.period  length of one repeat         opts.amp    how far it reaches
 *   opts.width   thread width                 opts.side   +1 or -1 (see above)
 *   opts.color   a stroke/fill style          opts.phase  shifts the repeats
 * On a closed path the period is adjusted to fit a whole number of repeats,
 * so the pattern meets itself without a seam.
 */
export function drawStitch(ctx, path, style, opts){
  const motif = MOTIFS[stitchOf(style)];
  ctx.save();
  ctx.strokeStyle = opts.color; ctx.fillStyle = opts.color;
  ctx.lineWidth = opts.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  motif.draw(kit(ctx, path, opts));
  ctx.restore();
}

/**
 * The motif's inner edge, as points: where an inset box inside a stitched
 * border should stop. Motifs with a defined edge (waves, scallops, chains…)
 * give their own shape; the rest keep the box clear of their full reach.
 */
export function stitchInnerEdge(path, style, opts){
  const motif = MOTIFS[stitchOf(style)];
  const M = kit(null, path, opts), side = opts.side || 1;
  const n = Math.max(60, Math.ceil(path.len / (M.P/24))), pts = [];   // fine enough for a bead's bite
  for(let k = 0; k < n; k++){
    const s = (k/n)*path.len;
    // the motif's own edge, on its side; otherwise clear of its reach inward
    const v = motif.edge ? motif.edge(s, M)*side : (side > 0 ? opts.amp*1.15 : opts.width*0.5);   // (every kept motif has its edge)
    pts.push(path.point(s + (opts.phase || 0), v));
  }
  return pts;
}
