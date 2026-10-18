/**
 * stepsRing.js — THE PAINTED RINGWORLD: a ring seen from its own floor, painted in flat shapes (Ruby: "a generative art
 * piece that still looks like being on a ringworld … the same logic as the 3D generator but 2D"; and of the flat style,
 * "that simplified, but cosmic … keep that in mind").
 *   ringarch  THE ARCH: everything above the land — space, the air, the star and its shadow squares, the ring's far floor
 *             rising into the arch overhead, its rim walls — as flat patches in true perspective
 *   ringland  LAND ON THE RING: the floor you stand on, ridge behind ridge from the walls' feet to your own, with what
 *             grows, lives, stands and lies on it, by its World
 * Both see through the Ringworld's own camera (ringCamera): the Camera Dial is the camera, the Light Dial the day, and
 * one world (the land's heights, its seas, forests and cities, who built it) is shared by both, so the arch overhead
 * and the land at your feet are the same ring.
 */
import { mulberry32, kitCanvas, kitPicture, seedChoice } from './texCore.js';
import { ringParams, ringCamera, ringDay, mnHash, mnValue, RING_COV, RING_SQR } from './stepsGenerative.js';
import { rsMix, rsCss, rsPoly, rsFace, rsSmooth, paintSaturn, paintEnceladus } from './stepsWhimsy.js';

const RG_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
// THE WORLDS (Ruby: "sometimes natural, sometimes city, sometimes cyberpunk, sometimes builders, sometimes magical,
// sometimes mixed, sometimes apocalyptic, sometimes destroyed, sometimes populated by [small life], sometimes with
// crashed spaceships"). By the Seed picks one; Mixed lays three side by side, region by region. (The small life was
// once cute little creatures; Ruby: "too cute and childish … insects, fairies, flowers, slime creatures. All subtle.")
export const RG_WORLDS = ['seed', 'wilds', 'cities', 'neon', 'builders', 'magic', 'ruins', 'mixed'];
// what each world raises, as weights (Life and Works scale them):
//   tr trees · de dead trees · gt glowing trees · to towers · sp spires · sa spans (wall to wall) · mo monoliths and
//   standing stones · cr crystals · ci circles · pi pillars of light · do domes · br bridges of light · ca craters, smoke
//   and fire · wr wrecks · sh ships · be small life · ro rocks · gr grass and flowers · cv how much of the land is city
const RG_PROF = {
  wilds:    { tr: 1,    de: 0.05, gt: 0,   to: 0,    sp: 0.05, sa: 0.12, mo: 0.35, cr: 0.12, ci: 0,   pi: 0,    do: 0,    br: 0,   ca: 0,   wr: 0.25, sh: 0.15, be: 1,    ro: 0.8,  gr: 1,    cv: 0 },
  cities:   { tr: 0.45, de: 0,    gt: 0,   to: 1,    sp: 0.2,  sa: 0.25, mo: 0,    cr: 0,    ci: 0,   pi: 0,    do: 0.5,  br: 0.2, ca: 0,   wr: 0.1,  sh: 0.8,  be: 0.3,  ro: 0.15, gr: 0.5,  cv: 1 },
  neon:     { tr: 0.12, de: 0,    gt: 0.15, to: 1,   sp: 0.3,  sa: 0.15, mo: 0,    cr: 0,    ci: 0,   pi: 0.1,  do: 0.2,  br: 0.6, ca: 0,   wr: 0.2,  sh: 1,    be: 0.2,  ro: 0.1,  gr: 0.15, cv: 0.9 },
  builders: { tr: 0.45, de: 0,    gt: 0,   to: 0.2,  sp: 1,    sa: 0.9,  mo: 0.6,  cr: 0.2,  ci: 0,   pi: 0.15, do: 0.3,  br: 0.8, ca: 0,   wr: 0.12, sh: 0.6,  be: 0.3,  ro: 0.25, gr: 0.6,  cv: 0.2 },
  magic:    { tr: 0.5,  de: 0,    gt: 0.7, to: 0.12, sp: 0.5,  sa: 0.6,  mo: 0.35, cr: 1,    ci: 0.8, pi: 0.25, do: 0.1,  br: 0.3, ca: 0,   wr: 0.08, sh: 0.2,  be: 0.9,  ro: 0.3,  gr: 1,    cv: 0.1 },
  ruins:    { tr: 0.15, de: 0.7,  gt: 0,   to: 0.6,  sp: 0.4,  sa: 0.6,  mo: 0.3,  cr: 0.1,  ci: 0,   pi: 0,    do: 0.2,  br: 0,   ca: 1,   wr: 0.9,  sh: 0.2,  be: 0.25, ro: 0.7,  gr: 0.3,  cv: 0.4 },
};
// the ground each world lays (mixed into the Land Hue), and its lights (null: the page's own accents)
const RG_GROUND = { wilds: [[0, 0, 0], 0], cities: [[132, 132, 128], 0.22], neon: [[34, 30, 48], 0.55], builders: [[208, 204, 190], 0.3], magic: [[120, 90, 170], 0.22], ruins: [[118, 96, 78], 0.5] };
const RG_LIGHTS = { wilds: [[226, 255, 170], [255, 214, 150]], cities: [[255, 212, 150], [255, 240, 210]], neon: null, builders: [[150, 224, 255], [210, 244, 255]], magic: null, ruins: [[255, 140, 64], [255, 196, 120]] };

// which world is where: one (By the Seed, or chosen), or three, region by region (Mixed)
// (exported: a test hook, test/chains.test.mjs)
export function rgWorldOf(seed, v){
  const names = RG_WORLDS.slice(1, 7), wt = [1.3, 1, 0.8, 1, 1, 1];
  const pick = (k, not) => { let tot = 0; for(let j = 0; j < 6; j++) if(!not.includes(names[j])) tot += wt[j];
    let r = mnHash(seed | 0, k, 4242)*tot; for(let j = 0; j < 6; j++){ if(not.includes(names[j])) continue; r -= wt[j]; if(r < 0) return names[j]; } return 'wilds'; };
  let i = Math.max(0, Math.min(7, Math.round(v/100*7)));
  if(i === 0) i = mnHash(seed | 0, 9, 4243) < 0.16 ? 7 : 1 + names.indexOf(pick(1, []));
  if(i < 7) return { name: RG_WORLDS[i], list: [RG_WORLDS[i]] };
  const a = pick(2, []), b = pick(3, [a]), c = pick(4, [a, b]);
  return { name: 'mixed', list: [a, b, c] };
}

// THE LAND'S HEIGHT at a point of the floor (along a, across z, in ring units; up is toward the axis): fractal, its
// big octaves ridged (mountains), mountains piled at the walls' feet, flatter where cities stand, terraced by the
// builders. One function for the arch, the ridges and the works, so they agree.
function rgTerrain(W, Hw, seed, forms, world){
  const s = seed | 0, flat = world.list.includes('cities') || world.list.includes('neon') ? 0.55 : 1, terrace = world.list.includes('builders') ? W*0.004 : 0;
  const sea = -W*0.004*(0.4 + 1.6*mnHash(s, 3, 77))*(0.3 + forms), snow = W*0.03*(0.7 + 0.6*mnHash(s, 4, 77));
  const raw = (a, z, fine) => { let v = 0;
    for(let k = 0; k < 11; k++){ const wl = W*Math.pow(0.5, k); if(wl < fine) break;
      const n = mnValue(a/wl + k*17.31, z/wl - k*9.17 + 40, s + k*101), r = 1 - Math.abs(2*n - 1);
      v += k < 3 ? (r*r - 0.33)*wl*0.13*forms*flat : (n - 0.5)*wl*(k < 6 ? 0.16 : 0.12)*(0.4 + forms); }
    v += Hw*0.4*forms*rsSmooth(0.55, 1, Math.abs(z)*2/W)*(0.3 + 0.7*mnValue(a/(W*0.18), 2.7, s + 5));
    if(terrace && v > 0){ const q = v/terrace, f = q - Math.floor(q); v = (Math.floor(q) + rsSmooth(0.7, 1, f))*terrace; }
    return v; };
  return { sea, snow, raw };
}
const rgClamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
// canonical pixels for the painters' thinnest lines (set from the evaluator's E.px at each paint)
let rgPx = v => v;

// THE VIEW both parts paint through: the Ringworld's camera (ringParams, ringCamera) standing on this world's land
function rgView(E, n, ww, wh){
  const { num, input } = E, toward = input(n, 2), up = input(n, 3), zoom = input(n, 4), sun = input(n, 5), from = input(n, 6);
  const daylight = typeof sun === 'number' ? 100*(sun <= 1 ? 1 - 0.5*sun : Math.max(0, 0.5 - (sun - 1)/0.3*0.5)) : num(n, 'daylight', 80);
  const seed = ((E.ctx.seed >>> 0) + Math.round(num(n, 'variant', 0))*7919) >>> 0;
  const p = ringParams({ band: num(n, 'band', 45), walls: num(n, 'walls', 25), altitude: num(n, 'altitude', 15), look: typeof toward === 'number' ? toward*360 : num(n, 'look', 0),
    up: typeof up === 'number' ? up : null, lift: num(n, 'lift', 22), lens: 75, zoom: typeof zoom === 'number' ? 25 + 375*zoom : 100, placeBy: 'where the seed says', seed: E.ctx.seed >>> 0,
    daylight, air: 50, side: typeof from === 'number' && Math.cos((from*360 - 90)*Math.PI/180) < 0 ? -1 : 1 });
  const L = ringCamera(p), W = L.W, world = rgWorldOf(seed, num(n, 'world', 0)), forms = num(n, 'landforms', 50)/100;
  const TR = rgTerrain(W, L.Hw, seed, forms, world);
  // (the land about you is kept gentler, so you stand on it rather than in a hillside)
  // (the land about you is kept gentle, so you stand on it rather than in a hillside; and as a painter does, the far
  //  land's forms are drawn taller than they are, so the ranges along the arch's foot read at all)
  const v0 = TR.raw(0, L.z0, W*0.001); TR.sea = Math.min(TR.sea, v0 - W*0.0015); TR.snow = Math.max(TR.snow, v0 + W*0.02);
  const T = (a, z, fine) => { const v = TR.raw(a, z, fine), d = Math.hypot(a, z - L.z0); return v0 + (v - v0)*(0.25 + 0.75*rsSmooth(0, W*0.03, d) + 2.2*rsSmooth(W*0.05, W*2, d)); };
  // (the heights as they are, for the ground's colour: snow by its true height, not the painter's)
  T.true = (a, z, fine) => { const v = TR.raw(a, z, fine), d = Math.hypot(a, z - L.z0); return v0 + (v - v0)*(0.25 + 0.75*rsSmooth(0, W*0.03, d)); };
  L.Px = 1 - L.hc - v0;
  const unit = Math.min(ww, wh), F = L.f*unit, cx = ww/2, cy = wh/2;
  // THE PAINTER'S PERSPECTIVE: stereographic, not a pinhole's. A pinhole draws the arch (a great circle through the
  // zenith, in a plane through your eye) as a straight line; a painter's curved perspective bows it across the sky as the
  // old paintings of ringworlds do, and keeps every small thing its own shape. At the middle it is the pinhole's scale.
  // (Returns x, y and the depth that sizes things there: F over it is pixels per ring unit at that point.)
  const proj = (X, Y, Z) => { const dx = X - L.Px, dy = Y, dz = Z - L.z0, vf = dx*L.fx + dy*L.fy + dz*L.fz, l = Math.sqrt(dx*dx + dy*dy + dz*dz), q = l + vf; if(q <= l*0.12 || l < 1e-9) return null;
    return [cx + 2*F*(dx*L.rx + dy*L.ry + dz*L.rz)/q, cy - 2*F*(dx*L.ux + dy*L.uy + dz*L.uz)/q, q/2]; };
  const at = (a, z, e) => proj((1 - e)*Math.cos(a), (1 - e)*Math.sin(a), z);
  const psi = p.look*Math.PI/180, th = p.lift*Math.PI/180;
  const rgb = (v, d) => Array.isArray(v) ? v.slice(0, 3).map(q => q*255) : d;
  const land = rgb(input(n, 7), [111, 143, 85]), sky = rgb(input(n, 8), [134, 174, 220]), g1 = rgb(input(n, 9), [176, 48, 58]), g2 = rgb(input(n, 10), [201, 163, 58]);
  // the biomes, by world coordinates: dry land, forest, city; which world (Mixed), its lights
  const s = seed | 0, worldAt = (a, z) => world.list.length < 2 ? world.list[0] : world.list[Math.min(2, Math.floor(mnValue(a/(W*0.9) + 3.1, z/(W*0.9) + 8.3, s + 23)*3.3))];
  const dryAt = (a, z) => mnValue(a/(W*0.6) + 11.7, z/(W*0.6) - 3.3, s + 13), forestAt = (a, z) => rsSmooth(0.38, 0.62, mnValue(a/(W*0.09) + 2.1, z/(W*0.09) + 5.9, s + 17));
  const cityAt = (a, z, cv) => { if(cv <= 0) return 0; const t = 0.62 - 0.6*cv; return rsSmooth(t - 0.06, t + 0.06, mnValue(a/(W*0.22) + 7.7, z/(W*0.22) - 1.1, s + 19)); };
  const lightsOf = w => RG_LIGHTS[w] || [g1.map(c => Math.min(255, c*1.15 + 30)), g2.map(c => Math.min(255, c*1.15 + 30))];
  return { E, L, p, W, seed, world, forms, T, TR, unit, F, cx, cy, ww, wh, proj, at, psi, th, hx: Math.cos(psi), hz: Math.sin(psi), land, sky, g1, g2, worldAt, dryAt, forestAt, cityAt, lightsOf,
    life: num(n, 'life', 50)/100, works: num(n, 'works', 50)/100, air: num(n, 'air', 60)/100, dayHere: ringDay(L, 0), px: E.px, saturn: E.P(n, 'saturn', 'by the seed') };
}
// the ground's own colour at a point (before light, night and haze): the Land Hue as each world lays it, dry land,
// forest, city, rock high up, snow on the tallest; the sea below its level
function rgGround(V, a, z, e, coarse = 1){
  const w = V.worldAt(a, z), P = RG_PROF[w], [gc, gk] = RG_GROUND[w];
  if(e <= V.TR.sea + 1e-9) return rsMix([24, 58, 104], V.sky, 0.35);
  let c = rsMix(V.land, gc, gk);
  const dry = rsSmooth(0.55, 0.8, V.dryAt(a, z)); if(dry > 0) c = rsMix(c, w === 'ruins' ? [150, 116, 84] : [206, 178, 124], dry*0.8);
  const fo = V.forestAt(a/coarse, z/coarse)*Math.min(1, V.life*1.6)*(P.tr + P.gt*0.5 + P.de*0.3); if(fo > 0) c = rsMix(c, w === 'magic' ? rsMix([30, 70, 64], V.g1, 0.25) : w === 'ruins' ? [70, 64, 50] : [34, 74, 46], Math.min(0.75, fo*0.7));
  const ci = V.cityAt(a/Math.sqrt(coarse), z/Math.sqrt(coarse), P.cv*(0.3 + 0.9*V.works)); if(ci > 0) c = rsMix(c, w === 'neon' ? [40, 36, 58] : [150, 148, 146], ci*0.7);
  const hi = rsSmooth(V.TR.snow*0.5, V.TR.snow, e); if(hi > 0) c = rsMix(c, [128, 122, 116], hi*0.5);
  if(e > V.TR.snow) c = rsMix(c, [240, 243, 250], rsSmooth(V.TR.snow, V.TR.snow*1.25, e));
  return c;
}
// light, night and air on a colour: lit by the star (by day), dark blue by night, hazed by the air between
function rgLit(V, c, day, haze, air){ const n = rsMix(rsMix(c, [8, 12, 30], 0.82), c, 0.08); return rsMix(rsMix(n, c, day), air, haze); }
// the air's colour (the sky at the horizon): blue by day, warm at dusk, dark by night
function rgAirOf(V, day){ const dusk = rgClamp(1 - Math.abs(day - 0.5)*3.2), w = V.world.list[0];
  const a = rsMix(rsMix(rsMix(V.sky, [6, 8, 20], 0.86), rsMix(V.sky, [255, 255, 255], 0.38), rsSmooth(0.3, 0.75, day)), rsMix([255, 150, 118], V.g1, 0.2), dusk*0.55);
  // (a world's own air: the smoke over ruins, the neon's glow in the haze, the magic's)
  return w === 'ruins' ? rsMix(a, [150, 112, 88], 0.32) : w === 'neon' ? rsMix(a, V.g1, 0.22 + 0.2*(1 - day)) : w === 'magic' ? rsMix(a, V.g2, 0.15) : a; }

// ---------------- THE ARCH ----------------
function rgPaintArch(x, mk, V, R){
  rgPx = V.px;
  const { L, W, ww, wh, unit, F, cx, cy, proj, at, sky: S, g1, g2, px } = V, dl = V.dayHere, kday = rsSmooth(0.3, 0.75, dl), dusk = rgClamp(1 - Math.abs(dl - 0.5)*3.2);
  const SPACE = [8, 10, 24], AIR = rgAirOf(V, dl), rnd = (a, b) => a + (b - a)*R();
  // elevation → the screen's height, through the camera's middle (the camera never rolls, so near enough a line)
  const hx = V.hx, hz = V.hz, yAt = e => { const p = proj(L.Px - Math.sin(e)*0.01, Math.cos(e)*hx*0.01, L.z0 + Math.cos(e)*hz*0.01); return p ? p[1] : null; };
  // THE SKY: the air thick at the horizon, thin overhead, where space shows with its stars
  { const st = [[0, 1], [3, 0.92], [10, 0.75], [25, 0.5], [50, 0.32], [89, 0.22]].map(([deg, al]) => [yAt(deg*Math.PI/180), deg, al]).filter(q => q[0] != null);
    if(st.length >= 2){ const y0 = Math.min(...st.map(q => q[0])), y1 = Math.max(...st.map(q => q[0]));
      if(y1 - y0 > 1){ const g = x.createLinearGradient(0, y0, 0, y1);
        for(const [y, deg, al] of st){ const hi = deg/90, c = rsMix(AIR, rsMix(S, SPACE, 0.55 + 0.4*hi), rsSmooth(0, 0.35, hi)), a = al*(0.18 + 0.82*kday) + dusk*0.25*(1 - hi);
          g.addColorStop((y - y0)/(y1 - y0), rsCss(c, Math.min(1, a))); }
        x.fillStyle = g; x.fillRect(0, 0, ww, wh); x.fillStyle = rsCss(AIR, 0.95*(0.3 + 0.7*kday)); x.fillRect(0, y1, ww, wh - y1); } } }
  // THE FAR SKY'S OWN THINGS, by the seed: the nebula's washes in the page's accents, now and then a planet or a comet
  x.save(); x.globalCompositeOperation = 'screen';
  const nebA = 0.2*(1 - 0.65*kday);
  for(let i = 0, nW = 4 + Math.floor(R()*7), ga = rnd(-0.7, 0.7), gx = ww*rnd(0.2, 0.8), gy = wh*rnd(0.05, 0.35); i < nW; i++){ const d = (R() - 0.5)*unit*1.8, col = [S, g1, g2, rsMix(g1, g2, 0.5)][Math.floor(R()*4)];
    const X = gx + Math.cos(ga)*d, Y = gy + Math.sin(ga)*d, rx = unit*rnd(0.15, 0.4), ry = rx*rnd(0.2, 0.45); x.save(); x.translate(X, Y); x.rotate(ga + (R() - 0.5)*0.5); x.scale(1, ry/rx);
    const gr = x.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, rsCss(col, nebA)); gr.addColorStop(0.5, rsCss(col, nebA*0.35)); gr.addColorStop(1, rsCss(col, 0)); x.fillStyle = gr; x.fillRect(-rx, -rx, rx*2, rx*2); x.restore(); }
  x.restore();
  // (Ruby: "Ringworld should sometimes be orbiting Saturn": a ring in four orbits it, as the old games' rings orbit
  //  their gas giants, and SATURN hangs huge in its sky, beyond the far arch; by the seed, or The Arch's Saturn. Now and
  //  then, when it doesn't, the far planet is Saturn: an Easter egg)
  const SC_ = seedChoice(V.seed, 'saturn'), byS = SC_() < 0.25, satSky = V.saturn === 'always' || (V.saturn !== 'never' && byS), satFar = !satSky && SC_() < 0.2;
  if(R() < 0.35){ const r = unit*rnd(0.04, 0.12), X = ww*rnd(0.1, 0.9), Y = wh*rnd(0.06, 0.3), c1 = rsMix(rsMix(g2, S, 0.5), [255, 255, 255], 0.2), c2 = rsMix(c1, SPACE, 0.45), a = 0.55 + 0.4*(1 - kday), lit = rnd(-1, 1);
    const bands = Array.from({ length: 5 }, (_, b) => [(b*0.4 + R()*0.2)*r, r*rnd(0.12, 0.3)]);
    if(satFar) paintSaturn(x, X, Y, r*0.6, { axis: (SC_() - 0.5)*0.9, open: (SC_() < 0.5 ? -1 : 1)*(0.2 + 0.25*SC_()), sun: [lit < 0 ? 1 : -1, -0.3], alpha: a, tint: S });
    else if(satSky){ /* (Saturn fills the sky instead: no second planet) */ }
    else { x.save(); x.globalAlpha = a; x.fillStyle = rsCss(c2); x.beginPath(); x.arc(X, Y, r, 0, Math.PI*2); x.fill(); x.clip();
      for(let b = 0; b < 5; b++){ x.fillStyle = rsCss(b % 2 ? c1 : rsMix(c1, c2, 0.5)); x.fillRect(X - r, Y - r + bands[b][0], r*2, bands[b][1]); }
      x.fillStyle = rsCss(SPACE, 0.55); x.beginPath(); x.arc(X + lit*r*0.55, Y - r*0.2, r*1.05, 0, Math.PI*2); x.fill(); x.restore(); } }
  if(R() < 0.25){ const X = ww*rnd(0.1, 0.9), Y = wh*rnd(0.05, 0.3), ang = rnd(0.2, 0.9)*(R() < 0.5 ? 1 : -1) + Math.PI/2, len = unit*rnd(0.12, 0.3), wd = unit*0.012;
    const tx = X - Math.cos(ang)*len, ty = Y - Math.sin(ang)*len, g = x.createLinearGradient(X, Y, tx, ty); g.addColorStop(0, rsCss([240, 250, 255], 0.8*(1 - 0.6*kday))); g.addColorStop(1, rsCss(S, 0));
    rsPoly(x, [[X - Math.sin(ang)*wd, Y + Math.cos(ang)*wd], [tx, ty], [X + Math.sin(ang)*wd, Y - Math.cos(ang)*wd]], g); x.fillStyle = rsCss([255, 255, 255], 0.9*(1 - 0.5*kday)); x.beginPath(); x.arc(X, Y, wd*0.8, 0, Math.PI*2); x.fill(); }
  // THE STAR, at the ring's middle (so on the arch's own line), and the SHADOW SQUARES circling close about it: they
  // stand between it and the land, and make its nights (where you stand under one, it hides the star)
  const sp = proj(0, 0, 0);
  if(satSky){ // SATURN in the sky, lit from the ring's star (or the light dial's side when the star is out of sight);
    // now and then ENCELADUS beside it, its plume rising (Ruby's favorite moon)
    const yH = yAt(6*Math.PI/180), yT = yAt(38*Math.PI/180), y0 = yT == null ? wh*0.1 : Math.max(-wh*0.1, yT), y1 = yH == null ? wh*0.55 : Math.min(wh*0.9, yH);
    const rS = unit*(0.1 + 0.11*SC_()), X = ww*(0.12 + 0.76*SC_()), Y = y0 + (y1 - y0)*(0.25 + 0.6*SC_()), axis = (SC_() - 0.5)*1.1, open = (SC_() < 0.5 ? -1 : 1)*(0.14 + 0.26*SC_());
    const sun = sp ? [sp[0] - X, sp[1] - Y] : [L.side, -0.5], sa = 0.62 + 0.38*(1 - kday);
    paintSaturn(x, X, Y, rS, { axis, open, sun, alpha: sa, tint: S, behind: rsMix(rsMix(SPACE, S, 0.12), AIR, kday) });
    if(SC_() < 0.45){ const th2 = (SC_() < 0.5 ? 0.25 : 0.75)*Math.PI*2 + (SC_() - 0.5)*0.9, d = 3.95*rS, ex = Math.cos(th2)*d, ey = Math.sin(th2)*d*open;
      paintEnceladus(x, X + ex*Math.cos(axis) - ey*Math.sin(axis), Y + ex*Math.sin(axis) + ey*Math.cos(axis), Math.max(px(3), rS*0.05), { axis, sun, alpha: sa, px }); } }
  if(sp){ const rs = unit*0.018, SC = [255, 246, 226];
    x.save(); x.globalCompositeOperation = 'screen';
    for(const [r, a] of [[rs*18, 0.3], [rs*6, 0.6]]){ const gl = x.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], r); gl.addColorStop(0, rsCss(SC, a)); gl.addColorStop(0.2, rsCss(SC, a*0.35)); gl.addColorStop(1, rsCss(SC, 0)); x.fillStyle = gl; x.fillRect(sp[0] - r, sp[1] - r, r*2, r*2); }
    for(let k = 0; k < 12; k++){ const a = k/12*Math.PI*2 + R()*0.2, Lr = rs*(k % 2 ? 4 : 9)*(0.8 + 0.4*R()), wd = rs*0.2;
      rsPoly(x, [[sp[0] + Math.cos(a + Math.PI/2)*wd, sp[1] + Math.sin(a + Math.PI/2)*wd], [sp[0] + Math.cos(a)*Lr, sp[1] + Math.sin(a)*Lr], [sp[0] - Math.cos(a + Math.PI/2)*wd, sp[1] - Math.sin(a + Math.PI/2)*wd]], rsCss(SC, 0.4)); }
    x.restore(); x.fillStyle = rsCss(SC); x.beginPath(); x.arc(sp[0], sp[1], rs, 0, Math.PI*2); x.fill(); }
  const nsq = Math.round(Math.PI*2/L.per);
  for(let k = 0; k < nsq; k++){ const ph0 = (L.q0 + k*L.per)*L.side, ph1 = (L.q0 + (k + RING_COV)*L.per)*L.side, edge = [], back = [];
    for(let q = 0; q <= 8; q++){ const ph = ph0 + (ph1 - ph0)*q/8, X = RING_SQR*Math.cos(ph), Y = RING_SQR*Math.sin(ph), a = proj(X, Y, -W*0.3), b = proj(X, Y, W*0.3); if(!a || !b){ edge.length = 0; break; } edge.push(a); back.push(b); }
    if(edge.length) rsPoly(x, [...edge, ...back.reverse()], rsCss(rsMix(SPACE, S, 0.12), 0.96)); }
  // THE RING'S FAR FLOOR (the arch) and ITS RIM WALLS, in patches far to near: land, sea, forest, city as this world
  // lays them, its nights where the squares' shadows fall, hazed by the air low down and clear overhead
  const quads = [], hzOf = (zc, eS) => V.air*(1 - Math.exp(-zc/(W*1.6)))*(0.25 + 0.75*Math.exp(-Math.max(0, eS)/0.22));
  const elevOf = (X, Y, Z) => { const dx = X - L.Px, dy = Y, dz = Z - L.z0, l = Math.hypot(dx, dy, dz) || 1; return -dx/l; };
  const steps = (a0, fine, coarse) => { const out = [a0]; let a = a0; while(a < Math.PI){ a = Math.min(Math.PI, a + Math.max(fine, Math.min(coarse, a*0.12))); out.push(a); } return out; };
  const LN = 3, aF = steps(W*0.25, W*0.05, W*0.35);
  for(const sg of [1, -1]) for(let i = 0; i + 1 < aF.length; i++){ const a0 = aF[i]*sg, a1 = aF[i + 1]*sg, am = (a0 + a1)/2, day = ringDay(L, am);
    for(let j = 0; j < LN; j++){ const z0 = -W/2 + W*j/LN, z1 = -W/2 + W*(j + 1)/LN, zm = (z0 + z1)/2, q = [at(a0, z0, 0), at(a1, z0, 0), at(a1, z1, 0), at(a0, z1, 0)];
      if(q.some(v => !v)) continue;
      const e = V.TR.raw(am, zm, W*0.25), wet = rsSmooth(V.TR.sea + W*0.004, V.TR.sea - W*0.004, e), c = rsMix(rgGround(V, am, zm, Math.max(e, V.TR.sea + 1e-6), 4), rsMix([24, 58, 104], S, 0.35), wet), zc = (q[0][2] + q[2][2])/2, eS = elevOf(Math.cos(am), Math.sin(am), zm);
      quads.push([zc, q, rgLit(V, rsMix(c, [255, 255, 255], 0.06), day, hzOf(zc, eS)*0.55, AIR), day < 0.5 && V.cityAt(am, zm, RG_PROF[V.worldAt(am, zm)].cv*(0.3 + 0.9*V.works)) > 0.3 ? V.lightsOf(V.worldAt(am, zm))[0] : null]); } }
  const Hw = L.Hw, WALL = rsMix([96, 104, 124], S, 0.22), aW = steps(0, W*0.012, W*0.4);
  for(const zw of [-W/2, W/2]) for(const sg of [1, -1]) for(let i = 0; i + 1 < aW.length; i++){ const a0 = aW[i]*sg, a1 = aW[i + 1]*sg, am = (a0 + a1)/2, q = [at(a0, zw, 0), at(a1, zw, 0), at(a1, zw, Hw), at(a0, zw, Hw)];
    if(q.some(v => !v)) continue;
    const zc = (q[0][2] + q[2][2])/2, eS = elevOf((1 - Hw*0.5)*Math.cos(am), (1 - Hw*0.5)*Math.sin(am), zw), rib = i % 4 === 0 ? 0.12 : 0, day = ringDay(L, am);
    quads.push([zc, q, rgLit(V, rsMix(WALL, [0, 0, 0], rib*0.5), 0.25 + 0.75*day, Math.min(0.92, 0.45*V.air + hzOf(zc, eS)*0.7), AIR), null, true]); }
  quads.sort((p, q) => q[0] - p[0]);
  for(const [, q, c, lights, wall] of quads){ rsPoly(x, q, rsCss(c)); rsPoly(mk, q, '#fff');
    if(wall){ // the wall's top, catching the light: a thin lighter band along its upper edge
      rsPoly(x, [q[3], q[2], [q[2][0] + (q[1][0] - q[2][0])*0.05, q[2][1] + (q[1][1] - q[2][1])*0.05], [q[3][0] + (q[0][0] - q[3][0])*0.05, q[3][1] + (q[0][1] - q[3][1])*0.05]], rsCss(rsMix(c, [255, 255, 255], 0.25))); }
    else if(lights){ const n = 2 + Math.floor(R()*3); for(let k = 0; k < n; k++){ const u = R(), v = R(), X = q[0][0] + (q[1][0] - q[0][0])*u + (q[3][0] - q[0][0])*v, Y = q[0][1] + (q[1][1] - q[0][1])*u + (q[3][1] - q[0][1])*v;
        x.fillStyle = rsCss(lights, 0.85); x.fillRect(X, Y, px(2.2), px(2.2)); } } }
  // the arch's clouds: long streaks over its land, a little above it
  for(let k = 0, nC = 4 + Math.floor(R()*9); k < nC; k++){ const sg = R() < 0.5 ? 1 : -1, a0 = sg*rnd(W*0.6, Math.PI), len = W*rnd(0.4, 2.2), zc = rnd(-0.35, 0.35)*W, dz = W*rnd(0.05, 0.16), top = [], bot = [];
    for(let q = 0; q <= 6; q++){ const u = q/6, a = a0 + len*u*sg, th = dz/2*Math.pow(Math.sin(Math.PI*u), 0.7), A = at(a, zc - th, W*0.01), B = at(a, zc + th, W*0.01); if(!A || !B){ top.length = 0; break; } top.push(A); bot.push(B); }
    if(top.length > 2){ const am = a0 + len*0.5*sg, day = ringDay(L, am), A = top[3]; rsPoly(x, [...top, ...bot.reverse()], rsCss(rgLit(V, [246, 247, 252], day, hzOf(A[2], 0.3)*0.4, AIR), 0.72)); } }
  // THE AIR the walls hold in, low along the horizon, softening where the land will meet the sky
  const yh = yAt(0), yh2 = yAt(14*Math.PI/180);
  if(yh != null && yh2 != null && yh - yh2 > 1){ const g = x.createLinearGradient(0, yh, 0, yh2); g.addColorStop(0, rsCss(AIR, 0.7*V.air)); g.addColorStop(1, rsCss(AIR, 0)); x.fillStyle = g; x.fillRect(0, yh2, ww, wh - yh2); }
  // and the weather's clouds now and then, low over the land, as flat bands
  if(R() < 0.55) for(let k = 0, n = 2 + Math.floor(R()*5); k < n; k++){ const e = rnd(2, 12)*Math.PI/180, Y = yAt(e); if(Y == null) continue; const X = ww*rnd(-0.1, 1.1), wd = unit*rnd(0.2, 0.6), ht = wd*rnd(0.03, 0.07);
    const c = rsMix(rgLit(V, [244, 244, 250], dl, 0.2, AIR), [255, 170, 140], dusk*0.4), pts = [];
    for(let q = 0; q <= 8; q++){ const u = q/8; pts.push([X - wd/2 + wd*u, Y - ht*Math.pow(Math.sin(Math.PI*u), 0.6)*rnd(0.6, 1.2)]); }
    rsPoly(x, [...pts, [X + wd/2, Y + ht*0.25], [X - wd/2, Y + ht*0.25]], rsCss(c, 0.8)); }
}

// ---------------- THE PAINTED THINGS: each a few flat shapes, lit on the light's side ----------------
// (X, Y): where it stands on the page; h: its height in pixels; c: colours already lit and hazed ({ body, lit, dark, glow })
function rgTree(x, X, Y, h, c, kind, R){
  x.strokeStyle = rsCss(c.trunk); x.lineWidth = Math.max(rgPx(0.8), h*0.06); x.beginPath(); x.moveTo(X, Y); x.lineTo(X, Y - h*0.35); x.stroke();
  if(kind === 'fir'){ for(let t = 0; t < 3; t++){ const ty = Y - h*(0.18 + t*0.27), tw = h*(0.3 - t*0.07), th = h*0.45;
      rsPoly(x, [[X - tw, ty], [X, ty - th], [X + tw, ty]], rsCss(c.dark)); rsPoly(x, [[X, ty], [X, ty - th], [X + c.sd*tw, ty]], rsCss(c.lit)); } }
  else if(kind === 'poplar'){ const pw = h*0.16; rsPoly(x, [[X, Y - h*0.15], [X - pw, Y - h*0.45], [X, Y - h], [X + pw, Y - h*0.45]], rsCss(c.dark)); rsPoly(x, [[X, Y - h*0.15], [X + c.sd*pw, Y - h*0.45], [X, Y - h]], rsCss(c.lit)); }
  else if(kind === 'dead'){ x.strokeStyle = rsCss(c.dark); x.lineWidth = Math.max(rgPx(0.8), h*0.05); x.beginPath(); x.moveTo(X, Y); x.lineTo(X, Y - h*0.9);
    for(let b = 0; b < 4; b++){ const by = Y - h*(0.4 + b*0.13), dir = b % 2 ? 1 : -1; x.moveTo(X, by); x.lineTo(X + dir*h*(0.18 + R()*0.15), by - h*(0.12 + R()*0.1)); } x.stroke(); }
  else { const r = h*0.34, ccy = Y - h*0.62, pts = Array.from({ length: 7 }, (_, k) => { const a = k/7*Math.PI*2 + 0.3, rr = r*(0.85 + 0.25*R()); return [X + Math.cos(a)*rr, ccy + Math.sin(a)*rr*0.9]; });
    rsPoly(x, pts, rsCss(c.dark)); rsPoly(x, pts.map(([X1, Y1]) => [X + (X1 - X)*0.6 + c.L[0]*r*0.25, ccy + (Y1 - ccy)*0.6 + c.L[1]*r*0.25]), rsCss(c.lit));
    if(kind === 'glow'){ x.save(); x.globalCompositeOperation = 'screen'; const g = x.createRadialGradient(X, ccy, 0, X, ccy, r*2.2); g.addColorStop(0, rsCss(c.glow, 0.45)); g.addColorStop(1, rsCss(c.glow, 0)); x.fillStyle = g; x.fillRect(X - r*2.2, ccy - r*2.2, r*4.4, r*4.4); x.restore();
      for(let k = 0; k < 5; k++){ x.fillStyle = rsCss(c.glow, 0.9); x.beginPath(); x.arc(X + (R() - 0.5)*r*1.4, ccy + (R() - 0.5)*r*1.2, Math.max(rgPx(0.6), h*0.012), 0, Math.PI*2); x.fill(); } } }
}
// a building: a block (its lit face and its shaded one), a roof by its kind, windows lit by night; neon edges and a sign
function rgTower(x, X, Y, h, wdt, c, neon, broken, night, R){
  const w2 = wdt/2, side = wdt*0.35*c.sd, top = Y - h;
  if(broken){ const pts = [[X - w2, Y], [X - w2, top + h*0.2*R()]]; for(let k = 1; k < 5; k++) pts.push([X - w2 + wdt*k/5, top + h*(0.1 + 0.4*R())]); pts.push([X + w2, top + h*0.3*R()], [X + w2, Y]); rsPoly(x, pts, rsCss(c.body));
    rsPoly(x, [[X + c.sd*w2, Y], [X + c.sd*w2, pts[pts.length - 2][1]], [X + c.sd*w2 + side, pts[pts.length - 2][1] + Math.abs(side)*0.3], [X + c.sd*w2 + side, Y]], rsCss(c.dark)); return; }
  rsPoly(x, [[X - w2, Y], [X - w2, top], [X + w2, top], [X + w2, Y]], rsCss(c.body)); rsPoly(x, [[X + c.sd*w2, Y], [X + c.sd*w2, top], [X + c.sd*w2 + side, top + Math.abs(side)*0.3], [X + c.sd*w2 + side, Y]], rsCss(c.dark));
  const roof = R(); if(roof < 0.25){ x.strokeStyle = rsCss(c.dark); x.lineWidth = Math.max(rgPx(0.6), wdt*0.05); x.beginPath(); x.moveTo(X, top); x.lineTo(X, top - h*0.18); x.stroke(); }
  else if(roof < 0.45) rsPoly(x, [[X - w2*0.7, top], [X - w2*0.7, top - h*0.12], [X + w2*0.7, top - h*0.12], [X + w2*0.7, top]], rsCss(c.body));
  else if(roof < 0.55) rsPoly(x, [[X - w2, top], [X, top - wdt*0.6], [X + w2, top]], rsCss(c.lit));
  // windows: rows of small lights by night (and a few by day), where the building is big enough to show them
  // windows on a pitch of their own (so a near building has many, not a few huge ones): panes by day, lights by night
  const pitch = Math.max(rgPx(3), wdt*0.11), cols = Math.max(1, Math.floor(wdt/pitch) - 1), rows = Math.min(80, Math.max(1, Math.floor(h/pitch) - 1)), cw = wdt/(cols + 1), rh = h/(rows + 1);
  if(h > 10 && night <= 0.2 && !neon){ x.fillStyle = rsCss(c.dark, 0.5); for(let r = 1; r <= rows; r++) for(let k = 1; k <= cols; k++) x.fillRect(X - w2 + k*cw - cw*0.22, top + r*rh, cw*0.44, rh*0.42); }
  if(h > 10 && (night > 0.2 || neon)){
    x.fillStyle = rsCss(c.glow, 0.85*Math.max(night, neon ? 0.5 : 0));
    for(let r = 1; r <= rows; r++) for(let k = 1; k <= cols; k++) if(R() < 0.45) x.fillRect(X - w2 + k*cw - cw*0.25, top + r*rh, cw*0.5, rh*0.45); }
  if(neon){ x.strokeStyle = rsCss(c.glow2, 0.9); x.lineWidth = Math.max(rgPx(0.8), wdt*0.04); x.strokeRect(X - w2, top, wdt, h);
    if(R() < 0.6 && h > 12){ const sh = h*0.12, sy = top + h*(0.15 + 0.4*R()); x.fillStyle = rsCss(R() < 0.5 ? c.glow : c.glow2, 0.9); x.fillRect(X - w2 - wdt*0.1, sy, wdt*0.55, sh);
      x.save(); x.globalCompositeOperation = 'screen'; const g = x.createRadialGradient(X, sy, 0, X, sy, wdt*1.3); g.addColorStop(0, rsCss(c.glow, 0.35)); g.addColorStop(1, rsCss(c.glow, 0)); x.fillStyle = g; x.fillRect(X - wdt*1.3, sy - wdt*1.3, wdt*2.6, wdt*2.6); x.restore(); } }
}
// SMALL LIFE (Ruby: "insects, fairies, flowers, slime creatures … all subtle"): never more than a few marks, small for
// their distance and quiet in colour, so they are found rather than seen. Each kind at the ground point (X, Y), at
// h, the height a body would stand there.
function rgSmallLife(x, X, Y, h, kind, c, R){
  // (each mark has a floor in the export's pixels: smaller than that, a find is not subtle but missing)
  const rnd = (a, b) => a + (b - a)*R(), dot = (cx, cy, r, lo, col) => { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, Math.max(rgPx(lo), r), 0, Math.PI*2); x.fill(); };
  if(kind === 'insects'){ // a small cloud of specks over the grass, a pair of wings catching the light on the nearer
    const n = 3 + Math.floor(R()*5), cy = Y - h*rnd(0.5, 1.2);
    for(let q = 0; q < n; q++){ const ix = X + (R() - 0.5)*h*1.4, iy = cy + (R() - 0.5)*h*0.6; dot(ix, iy, h*0.04, 1.9, rsCss(c.dark, 0.8));
      if(h > rgPx(40) && R() < 0.5){ x.strokeStyle = rsCss(c.lit, 0.45); x.lineWidth = Math.max(rgPx(0.8), h*0.012); x.beginPath(); x.moveTo(ix - h*0.06, iy - h*0.04); x.lineTo(ix, iy); x.lineTo(ix + h*0.06, iy - h*0.04); x.stroke(); } }
    return; }
  if(kind === 'fairies'){ // a few points of light drifting low, each with a faint trail behind it
    const n = 1 + Math.floor(R()*3);
    for(let q = 0; q < n; q++){ const fx = X + (R() - 0.5)*h*2, fy = Y - h*rnd(0.4, 1.4), dx = (R() < 0.5 ? -1 : 1)*Math.max(rgPx(4), h*0.18);
      rgGlow(x, fx, fy, Math.max(rgPx(12), h*0.32), c.glow, 0.4);
      for(let t = 1; t <= 3; t++) dot(fx - dx*t, fy + dx*0.15*t*t*Math.sign(dx), h*0.025*(1 - t*0.22), 1 - t*0.2, rsCss(c.glow, 0.32/t));
      dot(fx, fy, h*0.04, 2.2, rsCss(rsMix(c.glow, [255, 255, 255], 0.6), 0.85)); }
    return; }
  if(kind === 'flowers'){ // a patch of small blossoms in the page's colours
    const n = 4 + Math.floor(R()*6);
    for(let q = 0; q < n; q++) dot(X + (R() - 0.5)*Math.max(rgPx(24), h*1.6), Y - h*rnd(0.02, 0.18), h*rnd(0.04, 0.07), 2.4, rsCss(c.flowers[Math.floor(R()*c.flowers.length)], 0.8));
    return; }
  // slime: one to three low, glistening mounds, half see-through, a highlight on each
  const n = 1 + Math.floor(R()*3);
  for(let q = 0; q < n; q++){ const sx = X + (R() - 0.5)*h*1.2, sw = Math.max(rgPx(7), h*rnd(0.18, 0.32)), sh = sw*rnd(0.45, 0.7);
    x.fillStyle = rsCss(c.slime, 0.68); x.beginPath(); x.ellipse(sx, Y, sw, sh, 0, Math.PI, Math.PI*2); x.fill();
    x.fillStyle = rsCss([255, 255, 255], 0.45); x.beginPath(); x.ellipse(sx - sw*0.3, Y - sh*0.55, sw*0.22, sh*0.16, -0.3, 0, Math.PI*2); x.fill(); }
}
function rgGlow(x, X, Y, r, col, a){ if(!(r > 0.5)) return; x.save(); x.globalCompositeOperation = 'screen'; const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, rsCss(col, a)); g.addColorStop(1, rsCss(col, 0)); x.fillStyle = g; x.fillRect(X - r, Y - r, r*2, r*2); x.restore(); }

// ---------------- THE LAND ----------------
function rgPaintLand(x, mk, dk, V, R){
  rgPx = V.px;
  const { L, W, ww, wh, unit, F, at, T, TR, px, hx, hz } = V, rnd = (a, b) => a + (b - a)*R(), BLACK = [0, 0, 0];
  const sd = L.side, LT = [0.55*sd, -0.85], cth = Math.cos(V.th), AIR = rgAirOf(V, V.dayHere);
  // the layers: from the walls' feet (or as far as the eye goes) to your own feet, nearer ever closer together
  const K = 16, d0 = Math.max(L.hc*2.2, W*0.0012), d1 = W*4, dOf = k => d0*Math.pow(d1/d0, k/(K - 1));
  const half = (ww/2/unit)/L.f, Sof = d => d*half*cth*1.35 + d*0.12 + W*0.002;
  // where the heading meets a wall (looking across): no layer lies beyond it
  const dWall = Math.abs(hz) > 1e-4 ? ((hz > 0 ? W/2 : -W/2) - L.z0)/hz : Infinity;
  const hazeOf = d => V.air*(1 - Math.exp(-d/(W*1.3)));
  // THE WORKS, standing in the world (each where its cell of the floor puts it, so turning the camera turns past
  // them): spires, monoliths, domes, circles, pillars, craters, wrecks; spans and bridges of light from wall to wall; ships
  const works = [], s = V.seed | 0, cw = W*0.035, imax = Math.ceil(d1/cw) + 1, jmax = Math.ceil(W/2/cw);
  const kinds = ['sp', 'mo', 'do', 'ci', 'pi', 'ca', 'wr', 'to', 'cr'];
  for(let i = -imax; i <= imax; i++) for(let j = -jmax; j <= jmax; j++){
    const h1 = mnHash(i, j, s + 501); if(h1 > 0.35*V.works + 0.01) continue;
    const a = (i + mnHash(i, j, s + 502))*cw, z = (j + mnHash(i, j, s + 503) - 0.5)*cw; if(Math.abs(z) > W*0.48) continue;
    const d = a*hx + (z - L.z0)*hz, sl = -a*hz + (z - L.z0)*hx; if(d < W*0.03 || d > d1 || Math.abs(sl) > Sof(d)) continue;
    const w = V.worldAt(a, z), P = RG_PROF[w]; let tot = 0; for(const k of kinds) tot += P[k] || 0; let r = mnHash(i, j, s + 504)*tot, kind = null;
    for(const k of kinds){ r -= P[k] || 0; if(r < 0){ kind = k; break; } }
    if(kind) works.push({ d, a, z, kind, w, h: mnHash(i, j, s + 505), h2: mnHash(i, j, s + 506) }); }
  // spans and bridges of light, wall to wall across the band; ships in the air
  for(let i = -24; i <= 24; i++){ const a = (i + mnHash(i, 7, s + 511))*W*0.45, w = V.worldAt(a, 0), P = RG_PROF[w], r = mnHash(i, 8, s + 512)*1.6;
    const d = a*hx + (0 - L.z0)*hz; if(d < d0 || d > d1*1.5) continue;
    if(d > W*1.1 && Math.abs(hx) > 0.3 && r < (P.sa + P.br)*V.works*0.5) works.push({ d, a, z: 0, kind: r < P.sa*V.works*0.5 ? 'sa' : 'br', w, h: mnHash(i, 9, s + 513) }); }
  for(let i = 0; i < 40; i++){ const w = V.world.list[i % V.world.list.length], P = RG_PROF[w]; if(mnHash(i, 1, s + 521) > P.sh*V.works*0.4) continue;
    const d = d0*4 + (d1 - d0*4)*Math.pow(mnHash(i, 2, s + 522), 2), sl = (mnHash(i, 3, s + 523)*2 - 1)*Sof(d)*0.9, a = d*hx - sl*hz, z = Math.max(-W*0.45, Math.min(W*0.45, L.z0 + d*hz + sl*hx));
    works.push({ d, a, z, kind: 'sh', w, h: mnHash(i, 4, s + 524), up: W*(0.006 + 0.05*mnHash(i, 5, s + 525)) }); }
  works.sort((p, q) => q.d - p.d);
  let wi = 0;
  const colsOf = (w, day, haze, dist) => { const lights = V.lightsOf(w), g = lights[0], g2 = lights[1];
    const metal = w === 'ruins' ? [120, 108, 96] : w === 'neon' ? [44, 42, 60] : w === 'magic' ? rsMix([200, 196, 230], V.g1, 0.15) : [212, 216, 228];
    const lit = rgLit(V, rsMix(metal, [255, 246, 226], 0.15), day, haze, AIR), dark = rgLit(V, rsMix(metal, BLACK, 0.35), day, haze, AIR);
    return { body: rgLit(V, metal, day, haze, AIR), lit, dark, glow: rsMix(g, AIR, haze*0.4), glow2: rsMix(g2, AIR, haze*0.4), sd: sd > 0 ? 1 : -1, L: LT }; };
  const drawWork = o => {
    const e = Math.max(TR.sea, T(o.a, o.z, W*0.003)), b = at(o.a, o.z, e); if(!b) return;
    const k = F/b[2], day = ringDay(L, o.a), big = { sp: 0.02 + 0.08*o.h, mo: 0.006 + 0.02*o.h, do: 0.006 + 0.016*o.h, to: 0.02 + 0.07*o.h, wr: 0.006 + 0.02*o.h, cr: 0.012 }[o.kind]; if(big && W*big/o.d > 0.4) return;
    const night = 1 - rsSmooth(0.3, 0.7, day), haze = hazeOf(o.d), c = colsOf(o.w, day, haze), [X, Y] = b;
    if(o.kind === 'sp'){ const hh = W*(0.02 + 0.08*o.h)*k, bw = hh*0.06; if(hh < 2) return; const broken = o.w === 'ruins';
      rsPoly(x, [[X - bw*1.6, Y + bw*0.4], [X - bw, Y - bw*1.4], [X + bw, Y - bw*1.4], [X + bw*1.6, Y + bw*0.4]], rsCss(c.dark));
      const tip = broken ? 0.55 + 0.2*o.h2 : 1; rsPoly(x, [[X - bw, Y], [X - bw*(1 - tip), Y - hh*tip], [X + bw*(1 - tip)*0.3, Y - hh*tip*0.97], [X + bw, Y]], rsCss(c.dark));
      rsPoly(x, [[X, Y], [X + c.sd*bw*(1 - tip)*0.5, Y - hh*tip], [X + c.sd*bw, Y]], rsCss(c.lit));
      if(!broken){ rsPoly(x, [[X - bw*0.8, Y - hh*0.42], [X + bw*0.8, Y - hh*0.42], [X + bw*0.65, Y - hh*0.46], [X - bw*0.65, Y - hh*0.46]], rsCss(c.glow, 0.9)); rgGlow(x, X, Y - hh, bw*5, c.glow, 0.7); } }
    else if(o.kind === 'mo'){ const hh = W*(0.006 + 0.02*o.h)*k, mw = hh*0.22; if(hh < 1.5) return; const tl = hh*0.12*(o.h2 < 0.5 ? 1 : -1);
      for(let q = 0; q < (o.w === 'wilds' ? 3 + Math.floor(o.h2*4) : 1); q++){ const ox = (q - 1)*mw*3.2, hq = hh*(q ? 0.6 + 0.3*((o.h2*7 + q) % 1) : 1);
        rsPoly(x, [[X + ox - mw, Y + mw*0.3], [X + ox - mw, Y - hq], [X + ox + mw, Y - hq + tl], [X + ox + mw, Y + mw*0.3]], rsCss(c.sd > 0 ? c.dark : c.body));
        rsPoly(x, [[X + ox + c.sd*mw, Y + mw*0.3], [X + ox + c.sd*mw, Y - hq + (c.sd > 0 ? tl : 0)], [X + ox + c.sd*mw*1.5, Y - hq + mw*0.4], [X + ox + c.sd*mw*1.5, Y + mw*0.5]], rsCss(c.sd > 0 ? c.body : c.dark)); } }
    else if(o.kind === 'do'){ const r = W*(0.006 + 0.016*o.h)*k; if(r < 1.5) return; x.fillStyle = rsCss(c.body); x.beginPath(); x.ellipse(X, Y, r, r*0.8, 0, Math.PI, 0); x.fill();
      x.fillStyle = rsCss(c.lit); x.beginPath(); x.ellipse(X + c.sd*r*0.2, Y, r*0.6, r*0.72, 0, Math.PI, 0); x.fill(); if(night > 0.2) rgGlow(x, X, Y - r*0.4, r*1.6, c.glow, 0.5*night); }
    else if(o.kind === 'ci' || o.kind === 'ca'){ const r = W*(o.kind === 'ci' ? 0.004 + 0.008*o.h : 0.006 + 0.014*o.h), pts = [], inn = [];
      for(let q = 0; q < 28; q++){ const t = q/28*Math.PI*2, p = at(o.a + Math.cos(t)*r, o.z + Math.sin(t)*r, e + W*0.0002), p2 = at(o.a + Math.cos(t)*r*0.7, o.z + Math.sin(t)*r*0.7, e + W*0.0002); if(!p || !p2) return; pts.push(p); inn.push(p2); }
      if(o.kind === 'ca'){ rsPoly(x, pts, rsCss(rgLit(V, [70, 58, 48], day, haze, AIR))); rsPoly(x, inn, rsCss(rgLit(V, [36, 30, 26], day, haze, AIR))); return; }
      x.strokeStyle = rsCss(c.glow, 0.9); x.lineWidth = Math.max(rgPx(1), r*k*0.05); x.beginPath(); pts.forEach(([a, b2], q) => q ? x.lineTo(a, b2) : x.moveTo(a, b2)); x.closePath(); x.stroke();
      x.beginPath(); inn.forEach(([a, b2], q) => q ? x.lineTo(a, b2) : x.moveTo(a, b2)); x.closePath(); x.stroke();
      x.beginPath(); for(let q = 0; q < 5; q++){ const A = inn[Math.floor(q*28/5)], B = inn[Math.floor(((q + 2) % 5)*28/5)]; x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); } x.stroke();
      rgGlow(x, X, Y, r*k*1.3, c.glow, 0.35); }
    else if(o.kind === 'pi'){ const wd = W*(0.003 + 0.006*o.h)*k, top = Math.max(0, Y - W*(0.15 + 0.3*o.h2)*k); if(wd < 1) return; const g = x.createLinearGradient(X, Y, X, top); g.addColorStop(0, rsCss(c.glow, 0.7)); g.addColorStop(0.4, rsCss(c.glow, 0.25)); g.addColorStop(1, rsCss(c.glow, 0));
      x.save(); x.globalCompositeOperation = 'screen'; x.fillStyle = g; rsPoly(x, [[X - wd/2, Y], [X - wd*0.2, top], [X + wd*0.2, top], [X + wd/2, Y]], g); x.restore(); rgGlow(x, X, Y, wd*3, c.glow, 0.6); }
    else if(o.kind === 'cr'){ for(let q = 0; q < 3 + Math.floor(o.h2*4); q++){ const cs = W*(0.0012 + 0.003*((o.h*13 + q*0.37) % 1))*k, ang = (((o.h2*29 + q*0.61) % 1) - 0.5)*0.9, ox = (((o.h*7 + q*0.43) % 1) - 0.5)*cs*3;
        if(cs < 1) continue; const tipX = X + ox + Math.sin(ang)*cs*4, tipY = Y - Math.cos(ang)*cs*4, nx = Math.cos(ang)*cs, ny = Math.sin(ang)*cs, cc = rsMix(q % 2 ? c.glow : c.glow2, AIR, haze*0.4);
        rsPoly(x, [[X + ox - nx, Y - ny], [tipX, tipY], [X + ox + nx, Y + ny], [X + ox, Y + cs*0.5]], rsCss(rsMix(cc, BLACK, 0.35))); rsPoly(x, [[X + ox, Y + cs*0.5], [tipX, tipY], [X + ox + c.sd*nx, Y + c.sd*ny]], rsCss(cc)); rgGlow(x, tipX, tipY, cs*2, cc, 0.5); } }
    else if(o.kind === 'to'){ const hh = W*(0.02 + 0.07*o.h)*k*(o.w === 'neon' ? 1.4 : 1), tw = hh*(0.12 + 0.1*o.h2); if(hh < 2) return;
      rgTower(x, X, Y + tw*0.1, hh, tw, c, o.w === 'neon', o.w === 'ruins', night, R); }
    else if(o.kind === 'wr'){ // a crashed ship: its hull half sunk and tilted, a fin, its trench behind it, smoke
      const len = W*(0.006 + 0.02*o.h)*k; if(len < 3) return; const ang = (o.h2 - 0.5)*0.7 + 0.25*(o.h2 < 0.5 ? -1 : 1), ca = Math.cos(ang), sa = Math.sin(ang), hb = len*0.22;
      const hull = [[-0.5, 0], [-0.35, -0.8], [0.3, -1], [0.5, -0.45], [0.45, 0.3], [-0.45, 0.35]].map(([u, v]) => [X + (u*len)*ca - (v*hb)*sa, Y + (u*len)*sa + (v*hb)*ca]);
      rsPoly(x, [[X - len*0.9, Y + hb*0.3], [X - len*0.4, Y - hb*0.1], [X + len*0.1, Y + hb*0.1], [X - len*0.5, Y + hb*0.6]], rsCss(rgLit(V, [86, 70, 56], day, haze, AIR)));
      rsPoly(x, hull, rsCss(c.body)); rsPoly(x, [hull[1], hull[2], hull[3], [X, Y - hb*0.3]], rsCss(c.lit));
      rsPoly(x, [[X - len*0.15*ca, Y - len*0.15*sa - hb*0.8], [X - len*0.3*ca, Y - len*0.3*sa - hb*1.9], [X - len*0.05*ca, Y - len*0.05*sa - hb*0.9]], rsCss(c.dark));
      for(let q = 0; q < 3; q++){ x.fillStyle = rsCss(c.glow, 0.5 + 0.4*night); x.fillRect(X + (q - 1)*len*0.12*ca - hb*0.1, Y + (q - 1)*len*0.12*sa - hb*0.55, Math.max(rgPx(1), hb*0.18), Math.max(rgPx(1), hb*0.12)); }
      const smoke = rgLit(V, [90, 88, 92], day, haze, AIR); for(let q = 0; q < 6; q++){ const r = hb*(0.5 + q*0.35), sx = X + len*0.2 + q*hb*0.5*sd, sy = Y - hb - q*hb*1.1;
        x.fillStyle = rsCss(smoke, 0.55 - q*0.07); x.beginPath(); for(let v = 0; v < 6; v++){ const t = v/6*Math.PI*2; x[v ? 'lineTo' : 'moveTo'](sx + Math.cos(t)*r, sy + Math.sin(t)*r*0.8); } x.closePath(); x.fill(); }
      rgGlow(x, X + len*0.15, Y - hb*0.2, hb*2, [255, 140, 60], 0.5); }
    else if(o.kind === 'sh'){ if(o.d < W*0.25) return; const sb = at(o.a, o.z, e + o.up); if(!sb) return; const len = W*(0.003 + 0.01*o.h)*F/sb[2]; if(len < 2) return;
      const [SX, SY] = sb, dir = o.h2 < 0.5 ? -1 : 1, hb = len*0.11, hull = rgLit(V, [150, 156, 172], day, haze*0.8, AIR), top = rsMix(hull, [255, 250, 240], 0.3), under = rsMix(hull, BLACK, 0.35);
      const g = x.createLinearGradient(SX - dir*len*0.5, SY, SX - dir*len*5, SY + len*0.2); g.addColorStop(0, rsCss(c.glow, 0.55)); g.addColorStop(1, rsCss(c.glow, 0));
      x.strokeStyle = g; x.lineWidth = Math.max(rgPx(0.8), hb*0.5); x.beginPath(); x.moveTo(SX - dir*len*0.5, SY); x.lineTo(SX - dir*len*5, SY + len*0.2); x.stroke();
      const P2 = (u, v) => [SX + dir*u*len, SY + v*hb];
      rsPoly(x, [P2(0.5, 0), P2(0.2, -1), P2(-0.45, -0.8), P2(-0.5, 0), P2(-0.45, 0.7), P2(0.2, 0.8)], rsCss(under));
      rsPoly(x, [P2(0.5, 0), P2(0.2, -1), P2(-0.45, -0.8), P2(-0.5, -0.1), P2(0.3, -0.1)], rsCss(top));
      rsPoly(x, [P2(-0.2, -0.8), P2(-0.42, -2.2), P2(-0.48, -0.8)], rsCss(hull)); rsPoly(x, [P2(-0.15, 0.6), P2(-0.4, 1.8), P2(-0.45, 0.6)], rsCss(under));
      x.fillStyle = rsCss(c.glow2, 0.9); x.fillRect(Math.min(P2(0.25, 0)[0], P2(0.35, 0)[0]), SY - hb*0.55, len*0.1, Math.max(rgPx(1), hb*0.3));
      rgGlow(x, P2(-0.52, 0)[0], SY, hb*3, c.glow, 0.9); }
    else if(o.kind === 'sa' || o.kind === 'br'){ // from wall top to wall top across the band: a great arch (broken in ruin), or a straight bar of light
      const N = 24, outer = [], inner = [], th = W*0.012, Hw = L.Hw;
      for(let q = 0; q <= N; q++){ const zq = -W/2 + W*q/N, u = (2*zq/W), lift = o.kind === 'sa' ? Hw + W*(0.12 + 0.12*o.h)*Math.sqrt(Math.max(0, 1 - u*u)) : Hw*(0.55 + 0.3*o.h);
        const A = at(o.a, zq, lift), B = at(o.a, zq, lift - th*(o.kind === 'sa' ? 1 + 1.2*u*u : 0.3)); if(!A || !B) return; outer.push(A); inner.push(B); }
      if(o.kind === 'br'){ x.save(); x.globalCompositeOperation = 'screen'; for(const [wd, al] of [[6, 0.15], [2.5, 0.35], [1, 0.9]]){ x.strokeStyle = rsCss(c.glow, al); x.lineWidth = Math.max(rgPx(0.8), Math.abs(outer[12][1] - inner[12][1])*wd);
          x.beginPath(); outer.forEach(([a, b2], q) => q ? x.lineTo(a, b2) : x.moveTo(a, b2)); x.stroke(); } x.restore(); return; }
      const gap = o.w === 'ruins' ? [Math.floor(N*0.35 + o.h*4), Math.floor(N*0.6 + o.h*3)] : null;
      for(let q = 0; q < N; q++){ if(gap && q >= gap[0] && q < gap[1]) continue; rsPoly(x, [outer[q], outer[q + 1], inner[q + 1], inner[q]], rsCss(q % 2 ? c.body : rsMix(c.body, c.dark, 0.35))); }
      if(o.w !== 'ruins'){ x.strokeStyle = rsCss(c.glow, 0.7); x.lineWidth = Math.max(rgPx(0.8), Math.abs(outer[12][1] - inner[12][1])*0.15); x.beginPath(); inner.forEach(([a, b2], q) => q ? x.lineTo(a, b2) : x.moveTo(a, b2)); x.stroke(); } }
  };
  // THE LAYERS, far to near: each the land's line across your view at its distance, filled down, cut in facets and lit;
  // on its crest and slopes what grows and stands there; then the works between it and the next
  // ROADS AND PATHS on the floor, one along the ring and one across it, as the world lays them: a city's road with its
  // dashes, the neon's dark street edged in light, the builders' pale way with a line of light down it, a ley line, a
  // broken road, a trail through the grass. Each is drawn slab by slab between the ridges, so the hills hide it.
  const ROADS = { cities: ['road', 1], neon: ['neon', 1], builders: ['path', 0.8], ruins: ['broken', 0.6], magic: ['ley', 0.6], wilds: ['trail', 0.45] }, roads = [];
  { const zr = (mnHash(s, 31, 7) - 0.5)*W*0.6, w1 = V.worldAt(0.5*W, zr), ar = (0.15 + 0.5*mnHash(s, 32, 7))*W*(mnHash(s, 33, 7) < 0.5 ? -1 : 1), w2 = V.worldAt(ar, 0);
    if(mnHash(s, 34, 7) < ROADS[w1][1]*(0.4 + V.works)) roads.push({ along: true, at: zr, w: w1, kind: ROADS[w1][0] });
    if(mnHash(s, 35, 7) < ROADS[w2][1]*(0.2 + 0.6*V.works)) roads.push({ along: false, at: ar, w: w2, kind: ROADS[w2][0] }); }
  const drawRoads = (dn, df) => { for(const r of roads){ const L2 = [], R2 = [], wd = W*(r.kind === 'trail' || r.kind === 'ley' ? 0.0015 : 0.003);
      for(let q = 0; q <= 6; q++){ const d = Math.max(d0*0.4, dn) + (df - Math.max(d0*0.4, dn))*q/6; let a, z;
        if(r.along){ if(Math.abs(hx) < 0.08) return; a = (d - (r.at - L.z0)*hz)/hx; z = r.at; } else { if(Math.abs(hz) < 0.08) return; a = r.at; z = L.z0 + (d - r.at*hx)/hz; if(Math.abs(z) > W*0.49) continue; }
        const e = Math.max(TR.sea, T(a, z, W*0.002)) + W*0.00003, A = r.along ? at(a, z - wd, e) : at(a - wd, z, e), B = r.along ? at(a, z + wd, e) : at(a + wd, z, e); if(!A || !B) continue; L2.push(A); R2.push(B); }
      if(L2.length < 2) continue;
      const mid = L2[L2.length >> 1], day = ringDay(L, 0), haze = hazeOf(mid[2]), c = colsOf(r.w, day, haze), poly = [...L2, ...R2.slice().reverse()];
      const ground = { road: [96, 96, 100], neon: [30, 28, 40], path: [214, 210, 196], broken: [92, 84, 76], ley: null, trail: [150, 124, 92] }[r.kind];
      if(ground) rsPoly(x, poly, rsCss(rgLit(V, ground, day, haze, AIR), r.kind === 'trail' ? 0.75 : 1));
      const line = (pts, col, wdt, dash) => { x.strokeStyle = col; x.lineWidth = wdt; if(dash && x.setLineDash) x.setLineDash(dash); x.beginPath(); pts.forEach(([X, Y], q) => q ? x.lineTo(X, Y) : x.moveTo(X, Y)); x.stroke(); if(dash && x.setLineDash) x.setLineDash([]); };
      const ctr = L2.map((p, q) => [(p[0] + R2[q][0])/2, (p[1] + R2[q][1])/2]), wpx = Math.max(px(1), Math.hypot(L2[0][0] - R2[0][0], L2[0][1] - R2[0][1])*0.06);
      if(r.kind === 'road') line(ctr, rsCss([236, 230, 200], 0.8), wpx, [wpx*4, wpx*4]);
      else if(r.kind === 'neon'){ line(L2, rsCss(c.glow, 0.9), wpx*1.2); line(R2, rsCss(c.glow2, 0.9), wpx*1.2); }
      else if(r.kind === 'path' || r.kind === 'ley'){ x.save(); x.globalCompositeOperation = 'screen'; line(ctr, rsCss(c.glow, 0.3), wpx*5); line(ctr, rsCss(c.glow, 0.9), wpx*1.3); x.restore(); }
      else if(r.kind === 'broken') for(let q = 0; q + 1 < ctr.length; q += 2) line([L2[q], R2[q + 1]], rsCss(rgLit(V, [40, 36, 32], day, haze, AIR)), wpx); } };
  // small life lives on some rings, not all: insects, fairies, flowers and slime, each world its own mix. A few finds
  // in the whole picture (more with Life), each on its own ridge. Only a ridge whose crest is in the frame and near
  // enough to see a find on is chosen (a ridge runs past both edges, and the near ones are often below the frame),
  // and each offers eight places across the frame: the find takes the first that nothing nearer covers
  const lively = R() < 0.25 + 0.6*V.life*Math.max(...V.world.list.map(w => RG_PROF[w].be)), finds = new Map();
  if(lively){ const ok = [];
    for(let k = 1; k < K; k++){ let d = dOf(k); if(d > dWall*1.02){ if(dOf(k - 1) <= dWall*1.02) d = dWall*0.995; else continue; }
      const a = d*hx, z = Math.max(-W*0.497, Math.min(W*0.497, L.z0 + d*hz)), p = at(a, z, Math.max(T(a, z, 2*Sof(d)/96*1.3), TR.sea));
      if(p && p[1] > wh*0.04 && p[1] < wh*0.9 && W*0.0007*F/p[2] >= px(5)) ok.push(k); }
    // (nearer ridges likelier; far off, a find keeps the floor of its marks, as the far land is drawn taller than it is)
    for(let q = 0, n = Math.min(ok.length, Math.round(V.life*4)); q < n; q++) { const xs = Array.from({ length: 8 }, (_, i) => ww*(0.06 + 0.88*(i + R())/8));
      for(let i = xs.length - 1; i > 0; i--){ const j = Math.floor(R()*(i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; }   // (in a shuffled order, the same in every browser)
      xs.seed = (R()*4294967296) >>> 0;   // (each find its own stream: whether one is seen never changes another)
      finds.set(ok.splice(Math.floor(R()*R()*ok.length), 1)[0], xs); } }
  let prevY = null; const seen = [];
  for(let k = K - 1; k >= 0; k--){
    let d = dOf(k); if(d > dWall*1.02){ if(k === 0 || dOf(k - 1) <= dWall*1.02) d = dWall*0.995; else continue; }
    const Sd = Sof(d), M = 96, pts = [], fine = 2*Sd/M*1.3;
    for(let i = 0; i < M; i++){ const sl = -Sd + 2*Sd*i/(M - 1), a = d*hx - sl*hz, z = Math.max(-W*0.497, Math.min(W*0.497, L.z0 + d*hz + sl*hx)), er = T(a, z, fine), e = Math.max(er, TR.sea), p = at(a, z, e);
      if(p) pts.push({ X: p[0], Y: p[1], zc: p[2], a, z, e, ec: er <= TR.sea ? TR.sea : Math.max(TR.sea + 1e-9, T.true(a, z, fine)), sea: er <= TR.sea }); }
    if(pts.length < 2) continue;
    const haze = hazeOf(d), mid = pts[pts.length >> 1], day = ringDay(L, mid.a), yC = mid.Y;
    const depth = Math.max(px(6), prevY == null ? wh : Math.abs(yC - prevY)*1.4 + px(4)); prevY = yC;
    const gm = rgGround(V, mid.a, mid.z, mid.ec), base = rgLit(V, gm, day, haze, AIR), sil = [...pts.map(p => [p.X, p.Y]), [pts[pts.length - 1].X, wh + 4], [pts[0].X, wh + 4]];
    // the layer in one wash: lit along its crest, deepening below it (as a painter blocks a ridge), then its facets
    // where it is steep (mountains, cliffs), a bright rim on its crest, water flat with a glint
    { const yTop = Math.min(...pts.map(p => p.Y)), g = x.createLinearGradient(0, yTop, 0, yTop + depth*1.6 + px(4)), litC = rgLit(V, rsMix(gm, [255, 244, 222], 0.22), day, haze, AIR), darkC = rgLit(V, rsMix(gm, BLACK, 0.3), day, haze, AIR);
      g.addColorStop(0, rsCss(rsMix(base, litC, 0.6))); g.addColorStop(1, rsCss(rsMix(base, darkC, 0.6))); rsPoly(x, sil, g); }
    rsPoly(mk, sil, '#fff'); { const g = Math.round(255*k/(K - 1)); rsPoly(dk, sil, `rgb(${g},${g},${g})`); }
    const jit = (c2, k2) => { const q = (R() - 0.5)*2*k2; return q > 0 ? rsMix(c2, [255, 255, 255], q) : rsMix(c2, BLACK, -q); };
    for(let i = 0; i + 1 < pts.length; i += 2){ const p0 = pts[i], p1 = pts[Math.min(pts.length - 1, i + 2)], gc = rgGround(V, (p0.a + p1.a)/2, (p0.z + p1.z)/2, Math.max(p0.ec, p1.ec));
      const col = rgLit(V, gc, day, haze, AIR), lit = rgLit(V, rsMix(gc, [255, 244, 222], 0.3), day, haze, AIR), dark = rgLit(V, rsMix(gc, BLACK, 0.34), day, haze, AIR);
      if(p0.sea && p1.sea){ const q0 = [p0.X, p0.Y + depth*0.5], q1 = [p1.X, p1.Y + depth*0.5]; rsPoly(x, [[p0.X, p0.Y], [p1.X, p1.Y], q1, q0], rsCss(col));
        if(R() < 0.5){ x.fillStyle = rsCss(rsMix(col, [255, 255, 255], 0.3*day + 0.05)); x.fillRect(p0.X, p0.Y + depth*R()*0.25, (p1.X - p0.X)*rnd(0.3, 0.9), Math.max(rgPx(1), depth*0.03)); } continue; }
      const face = rsFace(dark, lit, p1.Y - p0.Y, p0.X - p1.X, LT), slope = Math.abs(p1.Y - p0.Y)/Math.max(1, Math.abs(p1.X - p0.X));
      if(slope > 0.32){ const q0 = [p0.X + (p1.X - p0.X)*(R() - 0.5)*0.3, p0.Y + depth*rnd(0.35, 0.8)], q1 = [p1.X, p1.Y + depth*rnd(0.35, 0.8)];
        rsPoly(x, [[p0.X, p0.Y], [p1.X, p1.Y], q0], rsCss(jit(face, 0.03))); rsPoly(x, [[p1.X, p1.Y], q1, q0], rsCss(jit(rsMix(face, dark, 0.2), 0.03))); }
      else { const bd = depth*rnd(0.1, 0.22); rsPoly(x, [[p0.X, p0.Y], [p1.X, p1.Y], [p1.X, p1.Y + bd], [p0.X, p0.Y + bd*rnd(0.6, 1.2)]], rsCss(jit(rsMix(face, lit, 0.35), 0.02))); }
      x.strokeStyle = rsCss(rsMix(lit, [255, 250, 236], 0.3*(1 - haze)), 0.7*day + 0.1); x.lineWidth = Math.max(px(1.2), depth*0.025); x.beginPath(); x.moveTo(p0.X, p0.Y); x.lineTo(p1.X, p1.Y); x.stroke(); }
    // what grows and stands on it: trees in the forests, the city's buildings, rocks, crystals, small life, grass
    const near = k <= 1, fXs = finds.get(k), spots = []; R();   // (a draw kept, so a picture without small life is as it was)
    for(let i = 0; i + 1 < pts.length; i++){ const p0 = pts[i], p1 = pts[i + 1]; if(p0.sea && p1.sea) continue;
      const am = (p0.a + p1.a)/2, zm = (p0.z + p1.z)/2, w = V.worldAt(am, zm), P = RG_PROF[w], kpx = F/((p0.zc + p1.zc)/2), segW = 2*Sd/(M - 1), wday = ringDay(L, am), night = 1 - rsSmooth(0.3, 0.7, wday);
      const c = colsOf(w, wday, haze), place = (n, fn) => { n = Math.floor(n) + (R() < n % 1 ? 1 : 0); for(let q = 0; q < n; q++){ const u = R(), X = p0.X + (p1.X - p0.X)*u, Y = p0.Y + (p1.Y - p0.Y)*u + depth*Math.pow(R(), 1.6)*0.55; fn(X, Y); } };
      const tH = Math.min(wh*0.3, W*0.0035*kpx), fo = V.forestAt(am, zm)*V.life*(k <= 1 ? 0.35 : 1);
      if(tH > 1.6 && fo > 0.05){ const n = Math.min(Math.max(1, (p1.X - p0.X)/(tH*0.3)), fo*segW/(W*0.0018)*(P.tr + P.de + P.gt));
        const tc = { trunk: rgLit(V, [70, 52, 40], wday, haze, AIR), dark: rgLit(V, rsMix(w === 'ruins' ? [80, 70, 54] : [36, 82, 50], V.land, 0.35), wday, haze, AIR), lit: rgLit(V, rsMix(rsMix([36, 82, 50], V.land, 0.35), [255, 244, 222], 0.28), wday, haze, AIR), glow: c.glow, sd: c.sd, L: LT };
        place(n, (X, Y) => { const r = R()*(P.tr + P.de + P.gt), kind = r < P.de ? 'dead' : r < P.de + P.gt ? 'glow' : ['fir', 'fir', 'round', 'poplar'][Math.floor(R()*4)]; rgTree(x, X, Y, tH*rnd(0.6, 1.4), tc, kind, R); }); }
      const ci = V.cityAt(am, zm, P.cv*(0.3 + 0.9*V.works))*(k === 0 ? 0 : k <= 2 ? 0.3 : 1), bH = Math.min(wh*0.16, W*0.006*kpx);
      if(ci > 0.05 && bH > 1.2){ const n = Math.min(Math.max(1, (p1.X - p0.X)/(bH*0.3)), ci*segW/(W*0.004));
        place(n, (X, Y) => { const hh = Math.min(wh*(k <= 3 ? 0.14 : 0.28), bH*rnd(0.5, 2.6)*(w === 'neon' ? 1.6 : 1)); rgTower(x, X, Y + hh*0.05, hh, hh*rnd(0.25, 0.55), c, w === 'neon', w === 'ruins' && R() < 0.6, night, R); }); }
      const rH = Math.min(wh*0.07, W*0.0012*kpx);
      if(rH > 2 && P.ro*V.forms > 0.05){ place(P.ro*V.forms*segW/(W*0.004)*(k <= 1 ? 0.4 : 1), (X, Y) => { const r = rH*rnd(0.4, 1.5), rc = rgLit(V, [128, 122, 114], wday, haze, AIR), pts2 = Array.from({ length: 6 }, (_, q) => { const t = Math.PI + q/5*Math.PI; return [X + Math.cos(t)*r*rnd(0.8, 1.2), Y + Math.sin(t)*r*rnd(0.6, 1)]; });
        rsPoly(x, pts2, rsCss(rsMix(rc, BLACK, 0.2))); rsPoly(x, [[X, Y], pts2[2], pts2[3], pts2[4]].map(([a2, b2]) => [a2, b2]), rsCss(rsMix(rc, [255, 244, 222], 0.15))); }); }
      const cH = W*0.0007*kpx;
      if(fXs && cH >= px(3)) for(const fX of fXs){ const fu = (fX - p0.X)/(p1.X - p0.X || 1e-6), Y = p0.Y + (p1.Y - p0.Y)*fu;
        if(fu >= 0 && fu < 1 && Y > px(4) && Y < wh*0.95) spots.push({ X: fX, Y, h: cH, w, wday, haze, glow: c.glow, seed: fXs.seed }); }
      if(near && P.gr*V.life > 0.05){ const gc2 = rgLit(V, rsMix([40, 88, 54], V.land, 0.45), wday, haze, AIR), gl = rsMix(gc2, [255, 244, 222], 0.2), gH = W*0.00025*kpx, flw = [V.g1, V.g2, [250, 246, 240]];
        place(P.gr*V.life*(p1.X - p0.X)/Math.max(2, gH)*0.5, (X, Y) => { for(let b = -2; b <= 2; b++) rsPoly(x, [[X + b*gH*0.25, Y], [X + b*gH*0.5 + (R() - 0.5)*gH*0.4, Y - gH*rnd(0.7, 1.4)], [X + b*gH*0.25 + gH*0.15, Y]], rsCss(b*LT[0] > 0 ? gl : gc2));
          if(R() < 0.25*P.gr){ const fc = rsMix(flw[Math.floor(R()*3)], [0, 0, 0], 0.1); x.fillStyle = rsCss(fc); x.beginPath(); x.arc(X, Y - gH*1.1, Math.max(rgPx(0.8), gH*0.18), 0, Math.PI*2); x.fill(); if(w === 'magic') rgGlow(x, X, Y - gH*1.1, gH*0.8, fc, 0.6); } }); } }
    // a find's places, once its ridge is done: it is drawn at the end, in the first that nothing nearer has covered since
    if(spots.length) seen.push(spots.map(f => [f, rgSpot(x, f.X, f.Y, px(4))]));
    // the roads, then the works, between this layer and the next nearer one
    const dn = k > 0 ? dOf(k - 1) : 0; drawRoads(dn, d); while(wi < works.length && works[wi].d >= dn){ if(works[wi].d <= d) drawWork(works[wi]); wi++; }
  }
  // the finds nothing nearer stands in front of (a forest whose ridge is below the frame rises over most of them)
  for(const ridge of seen){ const f = (ridge.find(([f2, before]) => rgSame(rgSpot(x, f2.X, f2.Y, px(4)), before)) || [])[0];
    if(!f) continue; const Rf = mulberry32(f.seed), rf = (a, b) => a + (b - a)*Rf();
    if(Rf() >= 0.3 + 0.7*RG_PROF[f.w].be) continue;
    // (which kind, by the world: fairies where there is magic, insects and flowers in the wilds, slime in the ruins)
    const mix = { magic: [1, 3, 1, 1], wilds: [3, 1, 3, 1], ruins: [2, 0.5, 1, 3], neon: [1, 2, 0.5, 1], cities: [2, 0.5, 2, 0.5], builders: [2, 1, 2, 1] }[f.w] || [2, 1, 2, 1];
    const kinds = ['insects', 'fairies', 'flowers', 'slime'], tot = mix.reduce((a2, b2) => a2 + b2, 0); let pick = Rf()*tot, ki = 0; while(ki < 3 && pick > mix[ki]){ pick -= mix[ki]; ki++; }
    const lc = { dark: rgLit(V, [34, 30, 28], f.wday, f.haze, AIR), lit: rgLit(V, [236, 240, 246], f.wday, f.haze, AIR), glow: f.glow || V.g1,
      flowers: [V.g1, V.g2, [244, 238, 228]].map(g => rgLit(V, rsMix(g, [0, 0, 0], 0.1), Math.max(0.4, f.wday), f.haze, AIR)),
      slime: rgLit(V, rsMix(V.g2, [120, 200, 150], 0.45), Math.max(0.4, f.wday), f.haze, AIR) };
    rgSmallLife(x, f.X, f.Y, f.h*rf(0.8, 1.2), kinds[ki], lc, Rf); }
}
// what the canvas holds about a ground point (X, Y): a few pixels just above it; the same while nothing has been
// painted over it (a passing glow or haze aside: a little change is allowed)
function rgSpot(x, X, Y, r){
  const W = x.canvas.width, H = x.canvas.height, at = (a, b) => [...x.getImageData(Math.max(0, Math.min(W - 1, Math.round(a))), Math.max(0, Math.min(H - 1, Math.round(b))), 1, 1).data].slice(0, 3);
  return [at(X - r, Y - 1), at(X, Y - 1), at(X + r, Y - 1), at(X, Y - r*2)].flat();
}
function rgSame(a, b){ for(let i = 0; i < a.length; i += 3) if(Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 24) return false; return true; }

export const RING_STEPS = {
  ringarch: { cat: 'Textures', label: 'The Arch', ins: ['over', 'look toward', 'look up', 'zoom', 'sun height', 'sun from', 'land hue', 'sky hue', 'light hue', 'second light hue'], outs: ['picture', 'ring'],
    io: { ins: ['image', 'value', 'value', 'value', 'value', 'value', 'colour', 'colour', 'colour', 'colour'], outs: ['image', 'field'] },
    params: [RG_R('band', 'Band Width', 45), RG_R('walls', 'Rim Walls', 25), RG_R('altitude', 'Altitude', 15), RG_R('landforms', 'Landforms', 50), RG_R('world', 'World', 0), RG_R('life', 'Life', 50),
      RG_R('works', 'Works', 50), RG_R('air', 'Air', 60), RG_R('look', 'Look Toward', 0, 0, 360), RG_R('lift', 'Look Up', 22, -30, 100), RG_R('daylight', 'Daylight', 80), RG_R('variant', 'Variation', 0, 0, 99),
      ['saturn', 'Saturn', 'select', 'by the seed', { options: ['by the seed', 'never', 'always'] }]], cost: () => 4,
    paint(E, n){ const { ww, wh } = E, [c, x] = kitPicture(E.input(n, 1) ?? 0, ww, wh), [mc, mk] = kitCanvas(ww, wh); mk.fillStyle = '#000'; mk.fillRect(0, 0, ww, wh);
      const V = rgView(E, n, ww, wh); rgPaintArch(x, mk, V, mulberry32((V.seed ^ 0xA5C4) >>> 0)); return [c, mc]; },
    run(E, n){ const [c, m] = this.paint(E, n); return [E.readCanvas(c), E.asField(E.readCanvas(m))]; } },
  ringland: { cat: 'Marks', label: 'Land on the Ring', ins: ['over', 'look toward', 'look up', 'zoom', 'sun height', 'sun from', 'land hue', 'sky hue', 'light hue', 'second light hue'], outs: ['picture', 'land', 'distance'],
    io: { ins: ['image', 'value', 'value', 'value', 'value', 'value', 'colour', 'colour', 'colour', 'colour'], outs: ['image', 'field', 'field'] },
    params: [RG_R('band', 'Band Width', 45), RG_R('walls', 'Rim Walls', 25), RG_R('altitude', 'Altitude', 15), RG_R('landforms', 'Landforms', 50), RG_R('world', 'World', 0), RG_R('life', 'Life', 50),
      RG_R('works', 'Works', 50), RG_R('air', 'Air', 60), RG_R('look', 'Look Toward', 0, 0, 360), RG_R('lift', 'Look Up', 22, -30, 100), RG_R('daylight', 'Daylight', 80), RG_R('variant', 'Variation', 0, 0, 99)], cost: () => 4,
    paint(E, n){ const { ww, wh } = E, [c, x] = kitPicture(E.input(n, 1) ?? 0, ww, wh), [mc, mk] = kitCanvas(ww, wh), [dc, dk] = kitCanvas(ww, wh);
      mk.fillStyle = '#000'; mk.fillRect(0, 0, ww, wh); dk.fillStyle = '#fff'; dk.fillRect(0, 0, ww, wh);
      const V = rgView(E, n, ww, wh); rgPaintLand(x, mk, dk, V, mulberry32((V.seed ^ 0x1A4D5) >>> 0)); return [c, mc, dc]; },
    run(E, n){ const [c, m, d] = this.paint(E, n); return [E.readCanvas(c), E.asField(E.readCanvas(m)), E.asField(E.readCanvas(d))]; } },
};
