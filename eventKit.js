/**
 * eventKit.js — THE RING'S HAPPENINGS: robots fighting robots, mages against robots, a drone or a wolf pack running down
 * a herd, people walking in company from one door to another, and the kneeling giant's guardian beam (Ruby, 2026-10-26:
 * "More robots and robots that attack people and other robots... robot fights. robot wars. robots versus mages. humans in
 * groups. humanoids moving to true destinations in groups or in organized paths. wildlife that interact with each other.
 * robots hunting wildlife. the large tall half-giant robot that can't move... it's head should be able to shoot a laser,
 * guardian laser style"; docs/prior-art/ringworld-happenings.md).
 *
 * As wildKit does for the wild things: where every actor is, and every bolt, orb, spark and beam, is a pure function of
 * the happening's own seed and the clock (evAt), so a film can begin anywhere and nothing is remembered. A happening
 * lives in eras that end where the next begins (a fight's robots walk back to their lines and the fallen one gets up; a
 * hunted herd grazes where it fled to, and is hunted back the other way), so nothing ever jumps. Places are metres in
 * the happening's own frame (x toward the far side, z across, y up). Never a flash: a beam fades on and off over a
 * quarter of a second and more, a spark is a small burst, nothing lights more than its own few metres.
 *
 *   Bolt over the long grass —
 *   the robot kneels, smokes, and stands
 *   and walks back to its line.
 */
import { wkHash, wkWander, wkEra } from './wildKit.js';

const evS = (a, b, v) => v <= a ? 0 : v >= b ? 1 : (v - a)/(b - a)*(v - a)/(b - a)*(3 - 2*(v - a)/(b - a));
const evLerp = (p, q, t) => [p[0] + (q[0] - p[0])*t, p[1] + (q[1] - p[1])*t, p[2] + (q[2] - p[2])*t];

// WHAT EACH HAPPENING IS: its era (s), and who takes part, by the world it happens in
export const EV_KINDS = {
  skirmish:  { P: 48 },   // two lines of robots exchanging fire till one falls, then walking back and mending it
  magefight: { P: 46 },   // mages of the region's element against sentries: orbs and shields, bolts
  robohunt:  { P: 54 },   // a drone running a herd across the open country, its shots kicking up the ground
  wildhunt:  { P: 60 },   // a wolf pack stalking, then running, a herd of deer or elk
  march:     { P: 0 },    // people walking in company between two doors, waiting at each
};

// THE SIDES OF A FIGHT: robots (kinds of paintKit's pkRobot) and mages (people in robes, staffs lit with the element)
const EV_SIDES = {
  neon: [['sentry', 'sentry', 'walker'], ['walker', 'helper', 'walker']], ruins: [['sentry', 'crawler', 'sentry'], ['walker', 'sentry', 'walker']],
  builders: [['helper', 'walker', 'helper'], ['sentry', 'sentry', 'walker']], cities: [['helper', 'helper', 'walker'], ['sentry', 'walker', 'sentry']] };

// A FIGHT (skirmish, magefight): side 0 at -x, side 1 at +x, closing from 46 m to some 24, firing; one of the losing
// side falls (its knock: a shot timed to arrive), smokes, its side backs off; then the fire stops, both walk back to
// their lines and the fallen one is mended and stands before the next era. mage: side 0 are mages
function evFight(s, t, w, mage){
  const P = mage ? EV_KINDS.magefight.P : EV_KINDS.skirmish.P, e = wkEra(s, t, P), u = t - e.t0, d = e.d, k = e.k, sides = EV_SIDES[w] || EV_SIDES.builders;
  const n = [mage ? 1 + (wkHash(s, 1, 3) < 0.45 ? 1 : 0) : 2 + (wkHash(s, 1, 3) < 0.5 ? 1 : 0), 2 + (wkHash(s, 2, 3) < 0.5 ? 1 : 0)];
  const kinds = [mage ? null : sides[0], mage ? ['sentry', 'drone', 'sentry'] : sides[1]];
  const lose = wkHash(k, 3, s) < (mage ? 0.65 : 0.5) ? 1 : 0, loser = Math.floor(wkHash(k, 4, s)*n[lose]);
  const tA = 0.16*d, tF = 0.62*d, tK = tA + (tF - tA)*(0.5 + 0.3*wkHash(k, 5, s)), tR = 0.8*d;
  const gap = v => { const g0 = 46 - 22*evS(0, tA, v); return g0 + (v > tF ? (46 - g0)*evS(tF, d - 1.5, v) : 0); };
  // (where actor i of a side stands at time v: its line, its place along it, a little drift of its own)
  const at = (side, i, v) => { const sg = side ? 1 : -1, wd = wkWander(s + side*131 + i*17, t, 6), lb = side === lose && v > tK ? 12*evS(tK + 0.8, tK + 6, v)*(1 - evS(tF, tF + 6, v)) : 0;
    return [sg*(gap(v)/2 + lb) + wd[0]*1.2, (i - (n[side] - 1)/2)*7 + (wkHash(i, 6 + side, s) - 0.5)*3 + wd[1]*1.2, 0]; };
  const down = (side, i, v) => side === lose && i === loser ? evS(tK, tK + 0.8, v)*(1 - evS(tR, d - 2, v)) : 0;
  const actors = [], fx = [];
  for(const side of [0, 1]) for(let i = 0; i < n[side]; i++){ const p = at(side, i, u), q = at(side, i, u + 0.25), vx = (q[0] - p[0])/0.25, dn = down(side, i, u);
    const returning = u > tF && Math.abs(vx) > 0.15, face = returning ? (side ? 0 : Math.PI) : (side ? Math.PI : 0);
    actors.push({ role: mage && side === 0 ? 'mage' : 'robot', kind: mage && side === 0 ? 'mage' : kinds[side][i % kinds[side].length], side, x: p[0], z: p[1], y: 0, face, pose: dn > 0.02 ? 'down' : Math.abs(vx) > 0.15 ? 'walk' : 'stand', fall: dn, id: side*8 + i }); }
  // (the shots: each standing actor fires on its own beat from the closing to the end of the fire, at one of the other
  //  side, now and then missing into the ground; bolts fly at 35 m/s, a mage's orbs at 14 on an arc; and the knock)
  const live = (side, i, v) => down(side, i, v) < 0.02;
  const shot = (side, i, j, tS, aim, knock) => { const from = at(side, i, tS), tgtSide = 1 - side, tj = knock ? loser : Math.floor(wkHash(j, 30 + i, s + k*7 + side)*n[tgtSide]), to0 = at(tgtSide, tj, tS + 0.5);
    const miss = !knock && wkHash(j, 40 + i, s + k*7 + side) < 0.45, orb = mage && side === 0, sp = orb ? 14 : 35;
    const to = miss ? [to0[0] + (wkHash(j, 41, s) - 0.5)*8, to0[1] + (wkHash(j, 42, s) - 0.5)*8, 0] : [to0[0], to0[1], 1.1];
    from[2] = orb ? 1.6 : 1.2; const T = Math.hypot(to[0] - from[0], to[1] - from[1])/sp, p = (u - tS)/T;
    if(p >= 0 && p <= 1){ const pos = evLerp(from, to, p); if(orb) pos[2] += Math.sin(Math.PI*p)*T*sp*0.18; fx.push({ type: orb ? 'orb' : 'bolt', side, pos, prev: evLerp(from, to, Math.max(0, p - 0.06)), p }); }
    const q = (u - tS - T)/0.6; if(q >= 0 && q <= 1){ const hitMage = !miss && mage && tgtSide === 0; fx.push({ type: miss ? 'puff' : hitMage ? 'shield' : 'spark', side, pos: to, p: q, tgt: tj }); }
    if(orb && u >= tS - 0.4 && u <= tS + 0.1) actors.find(a => a.side === 0 && a.id === i).pose = 'cast'; };
  for(const side of [0, 1]) for(let i = 0; i < n[side]; i++){ const per = (mage && side === 0 ? 2.6 : 1.7) + 1.3*wkHash(i, 20 + side, s), ph = wkHash(i, 22 + side, s)*per;
    for(let j = 0; ; j++){ const tS = tA + ph + j*per; if(tS > tF - 1.5 || tS > u + 0.1) break; if(tS + 4 < u) continue; if(!live(side, i, tS)) continue; shot(side, i, j, tS, null, false); } }
  // (the knock: from the first standing one of the other side, timed to land at tK)
  { const side = 1 - lose, i = 0, from = at(side, i, tK - 1), to = at(lose, loser, tK), T = Math.hypot(to[0] - from[0], to[1] - from[1])/(mage && side === 0 ? 14 : 35), tS = tK - T; if(u > tS - 0.5 && u < tK + 1) shot(side, i, 999, tS, null, true); }
  // (the fallen one smokes, a few puffs rising and drifting, till it is mended)
  for(const a of actors) if(a.fall > 0.5) for(let q = 0; q < 3; q++){ const ph = ((u*0.5 + q/3) % 1); fx.push({ type: 'smoke', side: a.side, pos: [a.x + ph*1.5, a.z, 0.8 + ph*4], p: ph, a: a.fall }); }
  return { actors, fx };
}

// A CHASE (robohunt, wildhunt): a herd grazing at its home, a hunter (a drone, or a wolf pack) coming at it from far off;
// the herd bolts and runs to the far home, the hunter after it (a drone firing into the ground about them), then giving
// up and drawing off to wait beyond the far home for the next era, when it is all run back the other way
function evChase(s, t, robot, prey){
  const P = robot ? EV_KINDS.robohunt.P : EV_KINDS.wildhunt.P, e = wkEra(s, t, P), u = t - e.t0, d = e.d, k = e.k;
  const ang = wkHash(s, 50, 1)*Math.PI*2, Ld = 70, H1 = [Math.cos(ang)*Ld, Math.sin(ang)*Ld], homeOf = kk => kk % 2 === 0 ? [0, 0] : H1;
  const A = homeOf(k), B = homeOf(k + 1), dx = B[0] - A[0], dz = B[1] - A[1], dl = Math.hypot(dx, dz) || 1;
  const tS = 0.3*d, tC = Math.min(14, 0.3*d), tE = tS + tC, nH = robot ? 1 : 3 + (wkHash(s, 51, 1) < 0.5 ? 1 : 0), nP = 4 + Math.floor(wkHash(s, 52, 1)*3);
  // (the hunter's waiting place: off beyond the herd's home, on the side it came from, a different side each era)
  const wait = kk => { const h = homeOf(kk), sg = wkHash(kk, 53, s) < 0.5 ? 1 : -1, b = homeOf(kk + 1), ex = b[0] - h[0], ez = b[1] - h[1], el = Math.hypot(ex, ez) || 1; return [h[0] - ex/el*55 + sg*(-ez/el)*20, h[1] - ez/el*55 + sg*(ex/el)*20]; };
  const W0 = wait(k), W1 = wait(k + 1), run = evS(tS, tE, u), actors = [], fx = [];
  for(let i = 0; i < nP; i++){ const an = wkHash(i, 54, s)*Math.PI*2, rd = 2 + 4*Math.sqrt(wkHash(i, 55, s)), wd = wkWander(s + i*37, t, 20), fan = 1 + 0.8*Math.sin(Math.PI*run);
    const hx = A[0] + dx*run + (Math.cos(an)*rd*fan + wd[0]*2.5), hz = A[1] + dz*run + (Math.sin(an)*rd*fan + wd[1]*2.5), running = u > tS - 0.5 && u < tE + 0.5;
    actors.push({ role: 'prey', kind: prey, x: hx, z: hz, y: 0, face: running ? Math.atan2(dz, dx) : wkHash(i, 56 + (k & 7), s)*Math.PI*2, pose: running ? 'run' : 'graze', ph: running ? u*1.6 + i*0.3 : u*0.12, head: u > tS - 4 && u < tE + 6 ? 1 : 0.2, id: i }); }
  // (the hunter: from its waiting place it closes slowly (a pack stalking low, a drone gliding in), runs with the herd a few
  //  lengths behind, falls back as the herd outruns it, and draws off to wait beyond the far home)
  const lag = 18 - 8*Math.sin(Math.PI*run);
  for(let i = 0; i < nH; i++){ const off = [-(i - (nH - 1)/2)*3*Math.sin(ang), (i - (nH - 1)/2)*3*Math.cos(ang)], back = [A[0] + dx*run - dx/dl*lag, A[1] + dz*run - dz/dl*lag];
    const stalk = evS(0, tS, u), give = evS(tE, tE + 8, u), retire = evS(tE + 8, d - 2, u), app = [W0[0] + (A[0] - dx/dl*18 - W0[0])*stalk, W0[1] + (A[1] - dz/dl*18 - W0[1])*stalk];
    const pos = u < tS ? app : u < tE ? [back[0], back[1]] : [B[0] - dx/dl*(lag + 14*give) + (W1[0] - B[0] + dx/dl*(lag + 14))*retire, B[1] - dz/dl*(lag + 14*give) + (W1[1] - B[1] + dz/dl*(lag + 14))*retire];
    const p2 = u < tS ? app : pos, wd = wkWander(s + 300 + i*41, t, 8), x = pos[0] + off[0] + wd[0], z = pos[1] + off[1] + wd[1];
    const mv = u < tS ? (stalk > 0.01 && stalk < 0.99) : u < tE + 8 || (retire > 0.01 && retire < 0.99), face = u < tE + 8 ? Math.atan2(dz, dx) : Math.atan2(W1[1] - B[1], W1[0] - B[0]);
    actors.push({ role: 'hunter', kind: robot ? 'drone' : 'wolves', x, z, y: robot ? 6 + 3*Math.sin(t*0.7) : 0, face, pose: u > tS && u < tE ? 'run' : mv ? 'walk' : 'graze', ph: u*(u > tS && u < tE ? 1.8 : 0.6) + i*0.4, head: 0.5, id: 10 + i, p2 }); }
  // (a drone's shots: on its beat while it runs with them, into the ground about the herd, each a puff)
  if(robot) for(let j = 0; j < 40; j++){ const tsj = tS + 0.4 + j*0.9; if(tsj > tE) break; if(tsj > u || tsj + 1.2 < u) continue; const hv = actors[nP], rj = wkHash(j, 57, s + k), tgt = actors[Math.floor(rj*nP)];
    const from = [hv.x, hv.z, hv.y], to = [tgt.x + (wkHash(j, 58, s) - 0.5)*6, tgt.z + (wkHash(j, 59, s) - 0.5)*6, 0], T = 0.3, p = (u - tsj)/T;
    if(p <= 1) fx.push({ type: 'bolt', side: 1, pos: evLerp(from, to, p), prev: evLerp(from, to, Math.max(0, p - 0.15)), p }); else if(p - 1 < 3) fx.push({ type: 'puff', side: 1, pos: to, p: (p - 1)/3 }); }
  return { actors, fx };
}

// PEOPLE IN COMPANY (march): a band of three to seven walks from its door to the other (o.dest, metres), in pairs, along
// a gentle curve; gathers there in a loose ring talking for a while; and walks back. By day
function evMarch(s, t, dest){
  const n = 3 + Math.floor(wkHash(s, 60, 1)*5), dist = Math.hypot(dest[0], dest[1]) || 1, sp = 1.25, trav = dist/sp, stay = 16 + 14*wkHash(s, 61, 1), P = 2*(trav + stay);
  const c = ((t + wkHash(s, 62, 1)*P) % P + P) % P, bend = (wkHash(s, 63, 1) - 0.5)*0.35*dist, nx = -dest[1]/dist, nz = dest[0]/dist;
  const curve = q => { const b = 4*q*(1 - q)*bend; return [dest[0]*q + nx*b, dest[1]*q + nz*b]; };
  // (where along it the band is, 0 at the first door, 1 at the other, and whether it is on its way)
  let q, go = false, dir = 1; if(c < stay){ q = 0; } else if(c < stay + trav){ q = evS(0, 1, (c - stay)/trav); go = true; } else if(c < 2*stay + trav){ q = 1; } else { q = 1 - evS(0, 1, (c - 2*stay - trav)/trav); go = true; dir = -1; }
  const [px, pz] = curve(q), [qx, qz] = curve(Math.min(1, Math.max(0, q + 0.01*dir))), hd = Math.atan2(qz - pz, qx - px), ch = Math.cos(hd), sh = Math.sin(hd);
  // (from its ring to its column and back, over a few seconds as it sets off and arrives)
  const mixc = go ? evS(0, 0.06, Math.min(q, 1 - q)) : 0, actors = [];
  for(let i = 0; i < n; i++){ const row = Math.floor(i/2), sd = i % 2 ? 1 : -1, wd = wkWander(s + i*53, t, 5);
    const cx = -row*1.4, cz = sd*0.6, ra = i/n*Math.PI*2, rx = Math.cos(ra)*1.8, rz = Math.sin(ra)*1.8, k2 = go ? mixc : 0;
    // (the ring fixed in the world, the column turned with the way; one eased into the other)
    const ox = rx + (ch*cx - sh*cz - rx)*k2, oz = rz + (sh*cx + ch*cz - rz)*k2;
    actors.push({ role: 'person', kind: 'figure', x: px + ox + wd[0]*0.3, z: pz + oz + wd[1]*0.3, y: 0, face: go && k2 > 0.5 ? hd : ra + Math.PI, pose: go ? 'walk' : 'stand', id: i }); }
  return { actors, fx: [] };
}

/** WHERE EVERYONE IS in a happening of kind (seed s) at time t: { actors: [{ role, kind, side, x, z, y, face, pose, fall,
 *  ph, head, id }], fx: [{ type: bolt | orb | spark | puff | shield | smoke, side, pos [x, z, y], prev, p, a }] }; o: the
 *  record ({ w (its world), dest (a march's other door, metres), prey }) */
export function evAt(kind, s, t, o = {}){
  if(kind === 'skirmish') return evFight(s, t, o.w, false);
  if(kind === 'magefight') return evFight(s, t, o.w, true);
  if(kind === 'robohunt') return evChase(s, t, true, o.prey || 'deer');
  if(kind === 'wildhunt') return evChase(s, t, false, o.prey || 'deer');
  if(kind === 'march') return evMarch(s, t, o.dest || [40, 0]);
  return { actors: [], fx: [] };
}

// THE GIANT'S WATCH: the kneeling giant's eye wakes every half minute or so, finds a mark on the ground before it (a
// thin beam laid on it for a few seconds, steadying), gathers its light, and fires: a thick beam on for about a second,
// eased on and off, a small burst where it strikes and a scorch that fades over the next seconds; then it dims. In metres
// from its foot, toward its front: { eye (0..1, its glow), aim (0..1, the thin beam), fire (0..1, the beam), tgt [x, z],
// hit (0..1 since it struck, or -1), scorch (0..1) }
export function evGiant(s, t){
  const T = 26 + 10*wkHash(s, 70, 1), c = ((t + wkHash(s, 71, 1)*T) % T + T) % T, k = Math.floor((t + wkHash(s, 71, 1)*T)/T);
  const an = (wkHash(k, 72, s) - 0.5)*2.1, r = 30 + 60*wkHash(k, 73, s), drift = Math.min(1, Math.max(0, (c - 3)/5)), tgt = [Math.cos(an)*r + (1 - drift)*6*Math.sin(k), Math.sin(an)*r + (1 - drift)*4];
  const aim = evS(3, 4.2, c)*(1 - evS(8.3, 8.6, c)), fire = evS(8.6, 8.9, c)*(1 - evS(9.6, 10.1, c)), eye = Math.max(0.15, evS(2, 3, c)*(1 - evS(10.5, 13, c))*(0.6 + 0.4*evS(8, 8.6, c)));
  return { eye, aim, fire, tgt, hit: c >= 8.8 ? Math.min(1, (c - 8.8)/1.6) : -1, scorch: c >= 8.8 ? 1 - evS(9, 20, c) : 0 };
}

// THE EFFECTS DRAWN, on the page: each at its point (X, Y) as the caller projected it, r pixels a metre there; col its
// side's colour (lit) and glow; never a flash, each small and eased
export function evPaintFx(x, f, X, Y, r, col, px, P2){
  const css = (c, a) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`, glow = (gx, gy, rr, c, a) => { if(!(rr > 0.5)) return; const g = x.createRadialGradient(gx, gy, 0, gx, gy, rr); g.addColorStop(0, css(c, a)); g.addColorStop(1, css(c, 0)); x.fillStyle = g; x.fillRect(gx - rr, gy - rr, rr*2, rr*2); };
  x.save(); x.globalCompositeOperation = 'screen';
  if(f.type === 'bolt'){ const [X2, Y2] = P2 || [X, Y], w = Math.max(px(0.8), r*0.12); x.lineCap = 'round'; x.strokeStyle = css(col, 0.9); x.lineWidth = w; x.beginPath(); x.moveTo(X2, Y2); x.lineTo(X, Y); x.stroke();
    x.strokeStyle = css([255, 255, 255], 0.8); x.lineWidth = w*0.4; x.stroke(); glow(X, Y, Math.max(px(2), r*0.6), col, 0.5); }
  else if(f.type === 'orb'){ const rr = Math.max(px(1.5), r*0.35); glow(X, Y, rr*3, col, 0.55); x.fillStyle = css([255, 255, 255], 0.85); x.beginPath(); x.arc(X, Y, rr*0.5, 0, Math.PI*2); x.fill(); }
  else if(f.type === 'spark'){ const q = f.p, rr = Math.max(px(2), r*(0.6 + 1.6*q)); glow(X, Y, rr, col, 0.6*(1 - q)); x.strokeStyle = css(col, 0.7*(1 - q)); x.lineWidth = Math.max(px(0.6), r*0.06);
    x.beginPath(); for(let k = 0; k < 6; k++){ const a = k*1.047 + 0.4, l0 = rr*0.3, l1 = rr*(0.6 + 0.4*q); x.moveTo(X + Math.cos(a)*l0, Y + Math.sin(a)*l0*0.7); x.lineTo(X + Math.cos(a)*l1, Y + Math.sin(a)*l1*0.7); } x.stroke(); }
  else if(f.type === 'shield'){ const q = f.p, rr = r*1.6, a = 0.4*Math.sin(Math.PI*Math.min(1, q*1.3)); x.strokeStyle = css(col, a); x.lineWidth = Math.max(px(0.8), r*0.08); x.beginPath(); x.ellipse(X, Y - rr*0.6, rr*0.7, rr, 0, 0, Math.PI*2); x.stroke(); glow(X, Y - rr*0.6, rr, col, a*0.4); }
  x.restore();
  if(f.type === 'puff' || f.type === 'smoke'){ const q = f.p, rr = Math.max(px(1.5), r*(f.type === 'smoke' ? 0.5 + 1.2*q : 0.4 + 1.4*q)), a = (f.type === 'smoke' ? 0.35*(f.a ?? 1) : 0.45)*(1 - q);
    x.fillStyle = css(f.type === 'smoke' ? [70, 70, 74] : [150, 136, 112], a); x.beginPath(); x.arc(X, Y - (f.type === 'puff' ? rr*0.5 : 0), rr, 0, Math.PI*2); x.fill(); }
}
