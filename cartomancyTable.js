/**
 * cartomancyTable.js — WHAT ELSE IS ON THE TABLE, and what has happened to the
 * cards (Ruby: "sometimes the cards are damaged, sometimes there's other
 * objects on the table, the objects should mostly avoid the center… more
 * easter eggs than even I can explain").
 *
 * THE PARTS (each usable alone):
 *   TABLE_OBJECTS                 every object: its layer, how often it turns up, its size, its painter
 *   crtTableObjects(items, …)     where the clutter goes: toward the edges, off the cards
 *   crtPaintObject(ctx, it, L)    one object, lit by the dial (L: crtLight)
 *   crtToken(ctx, x, y, r, t, L)  a counter for a game not played for money (bead, stone, bean, button)
 *   crtDamageFor(R, back)         what has happened to one card (or nothing)
 *   crtCardPath / crtDamage       a damaged card's outline (torn, dog-eared) and its marks
 *
 * Seen from above, like everything on the table. Tall things (a candle, a cup,
 * a crystal ball) are drawn after the cards, so their shadows fall across them;
 * flat things (a letter, a feather) before. A lit candle warms what is near it.
 */
import { cpx, pickWeighted } from './texCore.js';
import { GLYPH_FONT } from './spell.js';
// the card parts' own drawing kit (shadow, emblem, element, colour), handed over by cartomancy.js when it
// loads — so this module needs nothing from it, and is bundled before it (cartomancy.js lays these objects)
export const CRT_KIT = {};
const tobKit = CRT_KIT;

const TAU = Math.PI*2;
const tobDisc = (x, y, r) => (c, ox, oy) => { c.moveTo(x + ox + r, y + oy); c.arc(x + ox, y + oy, r, 0, TAU); };
// the light in an object's own turned frame: its shadow's offset for a height, and the way toward the light
const tobLocal = (L, rot, hgt) => { const c = Math.cos(rot), s = Math.sin(rot), dx = L.sx*hgt, dy = L.sy*hgt; return [dx*c + dy*s, -dx*s + dy*c]; };
const tobToward = (L, rot) => { const c = Math.cos(rot), s = Math.sin(rot); return [L.tx*c + L.ty*s, -L.tx*s + L.ty*c]; };
/** A lit disc of metal (a dish, a watch case): bright toward the light, a raised rim. */
function tobMetal(ctx, x, y, r, M, L, rim = 0.1){
  const g = ctx.createRadialGradient(x + L.tx*r*0.45, y + L.ty*r*0.45, r*0.05, x, y, r*1.05);
  g.addColorStop(0, tobKit.css(tobKit.mix(M, [255,255,255], 0.35))); g.addColorStop(0.55, tobKit.css(M)); g.addColorStop(1, tobKit.css(tobKit.mix(M, [0,0,0], 0.5)));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  const rg = ctx.createLinearGradient(x + L.tx*r, y + L.ty*r, x - L.tx*r, y - L.ty*r);
  rg.addColorStop(0, tobKit.css(tobKit.mix(M, [255,255,255], 0.5))); rg.addColorStop(0.5, tobKit.css(M)); rg.addColorStop(1, tobKit.css(tobKit.mix(M, [0,0,0], 0.55)));
  ctx.strokeStyle = rg; ctx.lineWidth = Math.max(cpx(0.6), r*rim); ctx.beginPath(); ctx.arc(x, y, r*(1 - rim/2), 0, TAU); ctx.stroke();
}
/** A soft highlight (a reflection of the lamp) — screened on. */
function tobGlint(ctx, x, y, r, a = 0.6, col = '255,250,238'){
  ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.3, `rgba(${col},${a*0.35})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r*2, r*2); ctx.restore();
}
const METALS = { brass: [196, 160, 88], silver: [200, 204, 210], pewter: [150, 154, 158], gold: [222, 180, 90], iron: [96, 98, 102], copper: [186, 112, 72] };

// ---- THE OBJECTS ----

/** A candle in its dish, lit or blown out (a moth, sometimes, at the flame). */
function tobCandle(ctx, { x, y, s, v }, L){
  const dish = s*0.5, cr = s*0.2, hgt = s*(1.1 + v.tall*1.3), wax = v.wax, R = Math.random;
  tobKit.shadow(ctx, tobDisc(x, y, dish), L.sx*s*0.04, L.sy*s*0.04, s*0.03, 0.45, 2);
  tobKit.shadow(ctx, tobDisc(x, y, cr*0.95), L.sx*hgt, L.sy*hgt, s*0.1, 0.3, 24);
  tobMetal(ctx, x, y, dish, METALS[v.dish], L, 0.14);
  // wax run down onto the dish
  ctx.fillStyle = tobKit.css(tobKit.mix(wax, [0,0,0], 0.08));
  for(let k = 0; k < v.drips; k++){ const a = R()*TAU, d = cr*(1.05 + R()*0.9); ctx.beginPath(); ctx.ellipse(x + Math.cos(a)*d, y + Math.sin(a)*d, cr*(0.18 + R()*0.22), cr*(0.12 + R()*0.15), a, 0, TAU); ctx.fill(); }
  // the candle's top: its rim lobed with drips, a pool of melt
  ctx.fillStyle = tobKit.css(tobKit.mix(wax, [0,0,0], 0.2)); ctx.beginPath(); ctx.arc(x, y, cr, 0, TAU); ctx.fill();
  for(let k = 0; k < 3 + v.drips; k++){ const a = R()*TAU; ctx.beginPath(); ctx.arc(x + Math.cos(a)*cr*0.98, y + Math.sin(a)*cr*0.98, cr*(0.12 + R()*0.16), 0, TAU); ctx.fill(); }
  const g = ctx.createRadialGradient(x + L.tx*cr*0.35, y + L.ty*cr*0.35, 0, x, y, cr);
  g.addColorStop(0, tobKit.css(tobKit.mix(wax, [255,255,255], 0.25))); g.addColorStop(1, tobKit.css(wax));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, cr*0.9, 0, TAU); ctx.fill();
  ctx.strokeStyle = tobKit.css(tobKit.mix(wax, [0,0,0], 0.25), 0.5); ctx.lineWidth = Math.max(cpx(0.4), cr*0.05); ctx.beginPath(); ctx.arc(x, y, cr*0.62, 0, TAU); ctx.stroke();
  tobGlint(ctx, x + L.tx*cr*0.4, y + L.ty*cr*0.4, cr*0.35, 0.35);
  ctx.fillStyle = '#1a1612'; ctx.beginPath(); ctx.arc(x, y, Math.max(cpx(0.6), cr*0.08), 0, TAU); ctx.fill();
  if(v.lit){
    // the flame, from above: a white core, a gold halo; and the warmth it throws on everything near
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const gl = ctx.createRadialGradient(x, y, 0, x, y, s*3.2); gl.addColorStop(0, 'rgba(255,190,110,0.32)'); gl.addColorStop(0.25, 'rgba(255,160,80,0.12)'); gl.addColorStop(1, 'rgba(255,140,60,0)');
    ctx.fillStyle = gl; ctx.fillRect(x - s*3.2, y - s*3.2, s*6.4, s*6.4); ctx.restore();
    tobGlint(ctx, x, y, cr*0.75, 0.95, '255,236,190'); tobGlint(ctx, x, y, cr*0.25, 1, '255,255,250');
    if(v.moth) tobMoth(ctx, x + Math.cos(v.mothA)*s*0.95, y + Math.sin(v.mothA)*s*0.95, s*0.32, v.mothA + 1.2, L);
  } else {
    // blown out: a thread of smoke wandering off
    ctx.strokeStyle = 'rgba(210,210,210,0.22)'; ctx.lineWidth = Math.max(cpx(0.6), s*0.025); ctx.beginPath(); ctx.moveTo(x, y);
    let px = x, py = y, a = R()*TAU; for(let k = 0; k < 16; k++){ a += (R() - 0.5)*0.9; px += Math.cos(a)*s*0.09; py += Math.sin(a)*s*0.09; ctx.lineTo(px, py); } ctx.stroke();
  }
}
/** A moth (drawn to the flame). */
function tobMoth(ctx, x, y, s, rot, L){
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const [dx, dy] = tobLocal(L, rot, s*0.9);
  const wings = (c, ox, oy) => { for(const sg of [-1, 1]){ c.moveTo(ox, oy); c.ellipse(ox + sg*s*0.32, oy - s*0.05, s*0.34, s*0.22, sg*0.5, 0, TAU); c.moveTo(ox, oy); c.ellipse(ox + sg*s*0.24, oy + s*0.2, s*0.22, s*0.15, -sg*0.4, 0, TAU); } };
  tobKit.shadow(ctx, wings, dx, dy, s*0.15, 0.25, 0);
  ctx.fillStyle = 'rgba(150,132,108,0.95)'; ctx.beginPath(); wings(ctx, 0, 0); ctx.fill();
  ctx.fillStyle = 'rgba(90,76,60,0.6)'; for(const sg of [-1, 1]){ ctx.beginPath(); ctx.arc(sg*s*0.3, -s*0.06, s*0.06, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = 'rgba(70,58,46,0.9)'; ctx.lineWidth = Math.max(cpx(0.6), s*0.07); ctx.beginPath(); ctx.moveTo(0, -s*0.2); ctx.lineTo(0, s*0.28); ctx.stroke();
  ctx.lineWidth = Math.max(cpx(0.3), s*0.015); ctx.beginPath(); ctx.moveTo(0, -s*0.2); ctx.quadraticCurveTo(-s*0.1, -s*0.4, -s*0.22, -s*0.42); ctx.moveTo(0, -s*0.2); ctx.quadraticCurveTo(s*0.1, -s*0.4, s*0.22, -s*0.42); ctx.stroke();
  ctx.restore();
}
/** A cup on its saucer: tea, coffee, or drunk, with the leaves left in it (sometimes they make a shape). */
function tobCup(ctx, { x, y, s, v }, L){
  const sr = s*0.5, cr = s*0.33, hgt = s*0.42, P = v.ware, R = Math.random;
  const hx = x + Math.cos(v.h)*cr*1.2, hy = y + Math.sin(v.h)*cr*1.2;
  tobKit.shadow(ctx, tobDisc(x, y, sr), L.sx*s*0.03, L.sy*s*0.03, s*0.03, 0.4, 2);
  tobKit.shadow(ctx, (c, ox, oy) => { tobDisc(x, y, cr)(c, ox, oy); tobDisc(hx, hy, cr*0.24)(c, ox, oy); }, L.sx*hgt, L.sy*hgt, s*0.06, 0.32, 8);
  // the saucer, its well, its band
  const sg = ctx.createRadialGradient(x + L.tx*sr*0.4, y + L.ty*sr*0.4, sr*0.1, x, y, sr);
  sg.addColorStop(0, tobKit.css(tobKit.mix(P, [255,255,255], 0.2))); sg.addColorStop(1, tobKit.css(tobKit.mix(P, [0,0,0], 0.18)));
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(x, y, sr, 0, TAU); ctx.fill();
  ctx.strokeStyle = tobKit.css(tobKit.mix(P, [0,0,0], 0.15), 0.6); ctx.lineWidth = Math.max(cpx(0.5), sr*0.02); ctx.beginPath(); ctx.arc(x, y, sr*0.7, 0, TAU); ctx.stroke();
  if(v.band){ ctx.strokeStyle = tobKit.css(v.band); ctx.lineWidth = Math.max(cpx(0.5), sr*0.03); ctx.beginPath(); ctx.arc(x, y, sr*0.92, 0, TAU); ctx.stroke(); }
  if(v.spoon){ const a = v.h + Math.PI*0.7, M = METALS.silver; ctx.strokeStyle = tobKit.css(M); ctx.lineWidth = Math.max(cpx(0.6), s*0.035); ctx.beginPath();
    ctx.moveTo(x + Math.cos(a)*sr*0.5, y + Math.sin(a)*sr*0.5); ctx.lineTo(x + Math.cos(a + 0.5)*sr*1.25, y + Math.sin(a + 0.5)*sr*1.25); ctx.stroke();
    ctx.fillStyle = tobKit.css(tobKit.mix(M, [255,255,255], 0.2)); ctx.beginPath(); ctx.ellipse(x + Math.cos(a)*sr*0.5, y + Math.sin(a)*sr*0.5, s*0.09, s*0.06, a + 0.5, 0, TAU); ctx.fill(); }
  // the handle, a loop
  ctx.strokeStyle = tobKit.css(tobKit.mix(P, [0,0,0], 0.08)); ctx.lineWidth = Math.max(cpx(0.8), cr*0.12); ctx.beginPath(); ctx.arc(hx, hy, cr*0.22, 0, TAU); ctx.stroke();
  // the cup: its outside lit, its lip, what is in it
  const cg = ctx.createRadialGradient(x + L.tx*cr*0.5, y + L.ty*cr*0.5, cr*0.1, x, y, cr);
  cg.addColorStop(0, tobKit.css(tobKit.mix(P, [255,255,255], 0.3))); cg.addColorStop(1, tobKit.css(tobKit.mix(P, [0,0,0], 0.15)));
  ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(x, y, cr, 0, TAU); ctx.fill();
  const ir = cr*0.86;
  if(v.fill === 'leaves' || v.fill === 'empty'){
    // inside the empty cup: the wall nearest the light shades the floor beside it
    const ig = ctx.createLinearGradient(x + L.tx*ir, y + L.ty*ir, x - L.tx*ir, y - L.ty*ir);
    ig.addColorStop(0, tobKit.css(tobKit.mix(P, [0,0,0], 0.3))); ig.addColorStop(0.6, tobKit.css(tobKit.mix(P, [0,0,0], 0.05))); ig.addColorStop(1, tobKit.css(tobKit.mix(P, [255,255,255], 0.1)));
    ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(x, y, ir, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(120,70,30,0.18)'; ctx.beginPath(); ctx.arc(x, y, ir*0.55, 0, TAU); ctx.fill();
    if(v.fill === 'leaves'){
      // the leaves: clumps — or, now and then, an omen (a crescent, a ring, a fox's two ears)
      ctx.fillStyle = 'rgba(46,32,18,0.85)';
      const leaf = (px, py) => { ctx.beginPath(); ctx.ellipse(px, py, ir*(0.025 + R()*0.03), ir*(0.012 + R()*0.015), R()*TAU, 0, TAU); ctx.fill(); };
      if(v.omen === 'moon') for(let k = 0; k < 40; k++){ const a = Math.PI*0.6 + R()*Math.PI*0.8, d = ir*(0.42 + (R() - 0.5)*0.12*Math.sin(a - Math.PI*0.6)*2); leaf(x + Math.cos(a)*d*0.9 + ir*0.05, y + Math.sin(a)*d*0.9); }
      else if(v.omen === 'ring') for(let k = 0; k < 40; k++){ const a = R()*TAU, d = ir*(0.4 + (R() - 0.5)*0.08); leaf(x + Math.cos(a)*d, y + Math.sin(a)*d); }
      else if(v.omen === 'ears') for(const sg of [-1, 1]) for(let k = 0; k < 18; k++){ const t = R(); leaf(x + sg*ir*(0.15 + t*0.18) + (R() - 0.5)*ir*0.05, y - ir*(0.05 + (1 - Math.abs(t - 0.5)*2)*0.4)); }
      else for(let c = 0; c < 4; c++){ const cx = x + (R() - 0.5)*ir*1.1, cy = y + (R() - 0.5)*ir*1.1; for(let k = 0; k < 8; k++) leaf(cx + (R() - 0.5)*ir*0.25, cy + (R() - 0.5)*ir*0.25); }
    }
  } else {
    // tea or coffee: darker at the walls, the lamp mirrored in it
    const T = v.fill === 'coffee' ? [42, 26, 18] : [128, 70, 28], tg = ctx.createRadialGradient(x, y, 0, x, y, ir);
    tg.addColorStop(0, tobKit.css(T)); tg.addColorStop(1, tobKit.css(tobKit.mix(T, [0,0,0], 0.4)));
    ctx.fillStyle = tg; ctx.beginPath(); ctx.arc(x, y, ir*0.96, 0, TAU); ctx.fill();
    ctx.strokeStyle = tobKit.css(tobKit.mix(T, [255,230,200], 0.35), 0.5); ctx.lineWidth = Math.max(cpx(0.4), ir*0.04); ctx.beginPath(); ctx.arc(x, y, ir*0.93, 0, TAU); ctx.stroke();
    tobGlint(ctx, x + L.tx*ir*0.45, y + L.ty*ir*0.45, ir*0.3, 0.5);
  }
  ctx.strokeStyle = tobKit.css(tobKit.mix(P, [255,255,255], 0.35)); ctx.lineWidth = Math.max(cpx(0.5), cr*0.07); ctx.beginPath(); ctx.arc(x, y, cr*0.93, 0, TAU); ctx.stroke();
  if(v.band){ ctx.strokeStyle = tobKit.css(v.band); ctx.lineWidth = Math.max(cpx(0.4), cr*0.035); ctx.beginPath(); ctx.arc(x, y, cr*0.99, 0, TAU); ctx.stroke(); }
  tobGlint(ctx, x + L.tx*cr*0.8, y + L.ty*cr*0.8, cr*0.25, 0.55);
}
/** A wine glass from above: the stem's foot, the bowl, the wine, and its red light thrown into the shadow. */
function tobGlass(ctx, { x, y, s, v }, L){
  const fr = s*0.42, br = s*0.36, hgt = s*1.1, W = v.wine;
  tobKit.shadow(ctx, tobDisc(x, y, br), L.sx*hgt, L.sy*hgt, s*0.1, 0.16, 10);
  if(v.level > 0){ const cx = x + L.sx*hgt*0.8, cy = y + L.sy*hgt*0.8; ctx.save(); ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, br*0.7); g.addColorStop(0, tobKit.css(tobKit.mix(W, [255,255,255], 0.2), 0.4)); g.addColorStop(1, tobKit.css(W, 0));
    ctx.fillStyle = g; ctx.fillRect(cx - br, cy - br, br*2, br*2); ctx.restore(); }
  ctx.strokeStyle = 'rgba(235,240,245,0.35)'; ctx.lineWidth = Math.max(cpx(0.5), s*0.015); ctx.beginPath(); ctx.arc(x, y, fr, 0, TAU); ctx.stroke();
  ctx.fillStyle = 'rgba(235,240,245,0.06)'; ctx.beginPath(); ctx.arc(x, y, br, 0, TAU); ctx.fill();
  if(v.level > 0){ const wr = br*(0.45 + v.level*0.45), g = ctx.createRadialGradient(x + L.tx*wr*0.3, y + L.ty*wr*0.3, 0, x, y, wr);
    g.addColorStop(0, tobKit.css(tobKit.mix(W, [255,220,220], 0.15), 0.9)); g.addColorStop(1, tobKit.css(tobKit.mix(W, [0,0,0], 0.45), 0.95));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, wr, 0, TAU); ctx.fill();
    ctx.strokeStyle = tobKit.css(tobKit.mix(W, [255,255,255], 0.4), 0.45); ctx.lineWidth = Math.max(cpx(0.4), wr*0.04); ctx.beginPath(); ctx.arc(x, y, wr*0.97, 0, TAU); ctx.stroke(); }
  else { ctx.strokeStyle = tobKit.css(W, 0.35); ctx.lineWidth = Math.max(cpx(0.4), br*0.04); ctx.beginPath(); ctx.arc(x, y, br*0.3, 0.3, TAU - 0.6); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(245,248,252,0.6)'; ctx.lineWidth = Math.max(cpx(0.5), s*0.02); ctx.beginPath(); ctx.arc(x, y, br, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(cpx(0.6), s*0.03); const la = Math.atan2(L.ty, L.tx); ctx.beginPath(); ctx.arc(x, y, br*0.97, la - 0.5, la + 0.5); ctx.stroke();
  tobGlint(ctx, x + L.tx*br*0.6, y + L.ty*br*0.6, br*0.22, 0.7);
}
/** A crystal ball on its stand: the lamp in it, the light it gathers thrown bright into its shadow. */
function tobBall(ctx, { x, y, s, v }, L){
  const r = s*0.45, hgt = s*0.95, T = v.tint;
  tobKit.shadow(ctx, tobDisc(x, y, r*0.98), L.sx*hgt, L.sy*hgt, s*0.1, 0.32, 10);
  // the caustic: a bright point inside the shadow, where the sphere focuses the lamp
  tobGlint(ctx, x + L.sx*hgt*0.85, y + L.sy*hgt*0.85, r*0.35, 0.55, '255,246,220');
  tobMetal(ctx, x, y, r*0.82, v.stand, L, 0.2);
  const g = ctx.createRadialGradient(x - L.tx*r*0.25, y - L.ty*r*0.25, r*0.1, x, y, r);
  g.addColorStop(0, tobKit.css(T, 0.18)); g.addColorStop(0.75, tobKit.css(tobKit.mix(T, [0,0,0], 0.15), 0.4)); g.addColorStop(1, tobKit.css(tobKit.mix(T, [0,0,0], 0.5), 0.75));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  // what the ball holds: the room upside down (a crescent of light on the side away from the lamp)
  ctx.strokeStyle = tobKit.css(tobKit.mix(T, [255,255,255], 0.6), 0.35); ctx.lineWidth = r*0.08; const la = Math.atan2(L.ty, L.tx);
  ctx.beginPath(); ctx.arc(x, y, r*0.72, la + Math.PI - 0.7, la + Math.PI + 0.7); ctx.stroke();
  if(v.mist){ ctx.save(); ctx.beginPath(); ctx.arc(x, y, r*0.9, 0, TAU); ctx.clip(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#fff';
    for(let k = 0; k < 7; k++){ const a = Math.random()*TAU, d = Math.random()*r*0.5; ctx.beginPath(); ctx.ellipse(x + Math.cos(a)*d, y + Math.sin(a)*d, r*0.35, r*0.12, a, 0, TAU); ctx.fill(); } ctx.restore(); }
  // the lamp mirrored on it: a window of four panes
  const wx = x + L.tx*r*0.45, wy = y + L.ty*r*0.45, q = r*0.13;
  ctx.fillStyle = 'rgba(255,252,240,0.8)'; for(const [a, b] of [[-1,-1],[1,-1],[-1,1],[1,1]]) ctx.fillRect(wx + a*q*0.55 - q*0.45, wy + b*q*0.55 - q*0.45, q*0.9, q*0.9);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = Math.max(cpx(0.4), r*0.02); ctx.beginPath(); ctx.arc(x, y, r*0.99, 0, TAU); ctx.stroke();
}
/** A quartz point lying on its side: six faces (three seen), a pointed end, veils inside. */
function tobQuartz(ctx, { x, y, s, v, rot }, L){
  const len = s*1.0, wd = s*0.3, T = v.tint, hgt = s*0.24;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const body = (c, ox, oy) => { c.moveTo(-len/2 + ox, -wd/2 + oy); c.lineTo(len*0.25 + ox, -wd/2 + oy); c.lineTo(len/2 + ox, oy); c.lineTo(len*0.25 + ox, wd/2 + oy); c.lineTo(-len/2 + ox, wd/2 + oy); c.closePath(); };
  const [dx, dy] = tobLocal(L, rot, hgt), [, ly] = tobToward(L, rot);
  tobKit.shadow(ctx, body, dx, dy, s*0.05, 0.3, 6);
  // three long faces: upper, top, lower — each as bright as it faces the light (and up)
  const faces = [[-wd/2, -wd*0.17, -0.8], [-wd*0.17, wd*0.17, 0], [wd*0.17, wd/2, 0.8]];
  for(const [y0, y1, ny] of faces){ const lit = 0.55 + 0.45*(ny ? -ny*ly : 0.3);
    ctx.fillStyle = tobKit.css(tobKit.mix(T, lit > 0.6 ? [255,255,255] : [0,0,0], Math.abs(lit - 0.6)*0.9), 0.62);
    ctx.beginPath(); ctx.moveTo(-len/2, y0); ctx.lineTo(len*0.25, y0); ctx.lineTo(len/2, 0); ctx.lineTo(len*0.25, y1); ctx.lineTo(-len/2, y1); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle = tobKit.css(tobKit.mix(T, [255,255,255], 0.6), 0.6); ctx.lineWidth = Math.max(cpx(0.4), s*0.01); ctx.beginPath();
  for(const yy of [-wd*0.17, wd*0.17]){ ctx.moveTo(-len/2, yy); ctx.lineTo(len*0.25, yy); ctx.lineTo(len/2, 0); } ctx.moveTo(len*0.25, -wd/2); ctx.lineTo(len*0.25, wd/2); ctx.stroke();
  body(ctx, 0, 0); ctx.beginPath(); body(ctx, 0, 0); ctx.stroke();
  // the base, where it broke from the cluster: milky; veils inside
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-len/2, -wd/2, len*0.08, wd);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; for(let k = 0; k < 3; k++){ const px = -len*0.3 + Math.random()*len*0.4; ctx.beginPath(); ctx.moveTo(px, -wd*0.3); ctx.lineTo(px + len*0.08, wd*0.25); ctx.stroke(); }
  ctx.restore();
  tobGlint(ctx, x + L.tx*s*0.12, y + L.ty*s*0.12, s*0.12, 0.6);
}
/** Dice: pips, or the four elements (an invented game's dice); now and then all showing the same. */
function tobDice(ctx, { x, y, s, v }, L){
  const d = s*0.34, R = Math.random, PIPS = { 1: [[0,0]], 2: [[-1,-1],[1,1]], 3: [[-1,-1],[0,0],[1,1]], 4: [[-1,-1],[1,-1],[-1,1],[1,1]], 5: [[-1,-1],[1,-1],[0,0],[-1,1],[1,1]], 6: [[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]] };
  const same = 1 + Math.floor(R()*6);
  for(let k = 0; k < v.n; k++){
    const px = x + (k - (v.n - 1)/2)*d*1.5 + (R() - 0.5)*d*0.6, py = y + (R() - 0.5)*d*1.4, rot = R()*TAU, val = v.doubles ? same : 1 + Math.floor(R()*6);
    ctx.save(); ctx.translate(px, py); ctx.rotate(rot);
    const sq = (c, ox, oy) => { c.moveTo(-d/2 + ox, -d/2 + oy); c.lineTo(d/2 + ox, -d/2 + oy); c.lineTo(d/2 + ox, d/2 + oy); c.lineTo(-d/2 + ox, d/2 + oy); c.closePath(); };
    const [dx, dy] = tobLocal(L, rot, d), [lx, ly] = tobToward(L, rot);
    tobKit.shadow(ctx, sq, dx, dy, d*0.12, 0.4, 6);
    const g = ctx.createLinearGradient(lx*d*0.6, ly*d*0.6, -lx*d*0.6, -ly*d*0.6);
    g.addColorStop(0, tobKit.css(tobKit.mix(v.col, [255,255,255], 0.25))); g.addColorStop(1, tobKit.css(tobKit.mix(v.col, [0,0,0], 0.25)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-d/2, -d/2, d, d, d*0.18) : sq(ctx, 0, 0); ctx.fill();
    ctx.fillStyle = tobKit.css(v.pip); ctx.strokeStyle = tobKit.css(v.pip); ctx.lineWidth = Math.max(cpx(0.5), d*0.06);
    if(v.elem){ tobKit.element(ctx, 0, 0, d*0.28, (val - 1) % 4, false); }
    else for(const [a, b] of PIPS[val]){ ctx.beginPath(); ctx.arc(a*d*0.26, b*d*0.26, d*0.075, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
/** A pocket watch on its chain, stopped (at 3:33, or 11:11…); now and then its lid open, engraved. */
function tobWatch(ctx, { x, y, s, v }, L){
  const r = s*0.42, M = METALS[v.metal];
  // the chain, trailing away to its bar
  const a = v.a, bx = x + Math.cos(a)*r*1.12, by = y + Math.sin(a)*r*1.12, ex = bx + Math.cos(a + v.bend)*s*1.6, ey = by + Math.sin(a + v.bend)*s*1.6, cx = bx + Math.cos(a)*s*0.9, cy = by + Math.sin(a)*s*0.9;
  ctx.strokeStyle = tobKit.css(M); ctx.lineWidth = Math.max(cpx(0.5), s*0.02);
  for(let k = 0; k <= 26; k++){ const t = k/26, px = (1-t)*(1-t)*bx + 2*(1-t)*t*cx + t*t*ex, py = (1-t)*(1-t)*by + 2*(1-t)*t*cy + t*t*ey;
    ctx.strokeStyle = tobKit.css(tobKit.mix(M, k % 2 ? [0,0,0] : [255,255,255], 0.2)); ctx.beginPath(); ctx.ellipse(px, py, s*0.04, s*0.025, k % 2 ? a : a + Math.PI/2, 0, TAU); ctx.stroke(); }
  ctx.lineWidth = Math.max(cpx(0.6), s*0.04); ctx.beginPath(); ctx.moveTo(ex - Math.sin(a)*s*0.12, ey + Math.cos(a)*s*0.12); ctx.lineTo(ex + Math.sin(a)*s*0.12, ey - Math.cos(a)*s*0.12); ctx.stroke();
  if(v.lid){ const lx = x - Math.cos(a)*r*2.05, ly = y - Math.sin(a)*r*2.05;
    tobKit.shadow(ctx, tobDisc(lx, ly, r), L.sx*s*0.05, L.sy*s*0.05, s*0.04, 0.4, 2); tobMetal(ctx, lx, ly, r, M, L, 0.12);
    ctx.save(); ctx.translate(lx, ly); ctx.strokeStyle = tobKit.css(tobKit.mix(M, [0,0,0], 0.45), 0.7); ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = Math.max(cpx(0.4), r*0.03); tobKit.emblem(ctx, v.engraved, r*0.55); ctx.restore(); }
  tobKit.shadow(ctx, tobDisc(x, y, r), L.sx*s*0.1, L.sy*s*0.1, s*0.05, 0.42, 3);
  tobMetal(ctx, x, y, r, M, L, 0.14);
  ctx.strokeStyle = tobKit.css(M); ctx.lineWidth = Math.max(cpx(0.6), s*0.035); ctx.beginPath(); ctx.arc(x + Math.cos(a)*r*1.06, y + Math.sin(a)*r*1.06, s*0.06, 0, TAU); ctx.stroke();
  // the dial: enamel, its hours, its hands
  const fr = r*0.8; ctx.fillStyle = tobKit.css(v.dial); ctx.beginPath(); ctx.arc(x, y, fr, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI/2); ctx.strokeStyle = 'rgba(30,26,24,0.85)'; ctx.fillStyle = 'rgba(30,26,24,0.85)';
  for(let k = 0; k < 12; k++){ const q = k/12*TAU - Math.PI/2; ctx.lineWidth = Math.max(cpx(0.4), fr*(k % 3 ? 0.02 : 0.05)); ctx.beginPath(); ctx.moveTo(Math.cos(q)*fr*0.82, Math.sin(q)*fr*0.82); ctx.lineTo(Math.cos(q)*fr*0.94, Math.sin(q)*fr*0.94); ctx.stroke(); }
  ctx.font = `${fr*0.2}px Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for(const [k, t] of [[0, 'XII'], [3, 'III'], [6, 'VI'], [9, 'IX']]){ const q = k/12*TAU - Math.PI/2; ctx.fillText(t, Math.cos(q)*fr*0.62, Math.sin(q)*fr*0.62); }
  const [hh, mm] = v.time, ha = (hh % 12 + mm/60)/12*TAU - Math.PI/2, ma = mm/60*TAU - Math.PI/2;
  ctx.lineCap = 'round'; ctx.lineWidth = Math.max(cpx(0.6), fr*0.06); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ha)*fr*0.48, Math.sin(ha)*fr*0.48); ctx.stroke();
  ctx.lineWidth = Math.max(cpx(0.5), fr*0.035); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ma)*fr*0.75, Math.sin(ma)*fr*0.75); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, fr*0.05, 0, TAU); ctx.fill(); ctx.restore();
  // the crystal over it
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = fr*0.06; const la = Math.atan2(L.ty, L.tx); ctx.beginPath(); ctx.arc(x, y, fr*0.88, la - 0.6, la + 0.4); ctx.stroke();
  tobGlint(ctx, x + L.tx*fr*0.4, y + L.ty*fr*0.4, fr*0.35, 0.35);
}
/** A ring, sometimes set with a stone. */
function tobRing(ctx, { x, y, s, v }, L){
  const r = s*0.32, t = s*0.11, M = METALS[v.metal];
  tobKit.shadow(ctx, (c, ox, oy) => { c.moveTo(x + ox + r + t/2, y + oy); c.arc(x + ox, y + oy, r + t/2, 0, TAU); c.moveTo(x + ox + r - t/2, y + oy); c.arc(x + ox, y + oy, r - t/2, 0, TAU, true); }, L.sx*s*0.12, L.sy*s*0.12, s*0.05, 0.42, 4);
  const g = ctx.createLinearGradient(x + L.tx*r, y + L.ty*r, x - L.tx*r, y - L.ty*r);
  g.addColorStop(0, tobKit.css(tobKit.mix(M, [255,255,255], 0.45))); g.addColorStop(0.5, tobKit.css(M)); g.addColorStop(1, tobKit.css(tobKit.mix(M, [0,0,0], 0.5)));
  ctx.strokeStyle = g; ctx.lineWidth = t; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = t*0.25; const la = Math.atan2(L.ty, L.tx); ctx.beginPath(); ctx.arc(x, y, r + t*0.15, la - 0.7, la + 0.7); ctx.stroke();
  if(v.stone){ const sx = x + Math.cos(v.a)*r, sy = y + Math.sin(v.a)*r, q = t*0.9;
    ctx.fillStyle = tobKit.css(M); ctx.beginPath(); ctx.arc(sx, sy, q*1.25, 0, TAU); ctx.fill();
    const sg = ctx.createRadialGradient(sx - L.tx*q*0.3, sy - L.ty*q*0.3, 0, sx, sy, q); sg.addColorStop(0, tobKit.css(tobKit.mix(v.stone, [255,255,255], 0.3))); sg.addColorStop(1, tobKit.css(tobKit.mix(v.stone, [0,0,0], 0.4)));
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, q, 0, TAU); ctx.fill(); tobGlint(ctx, sx + L.tx*q*0.4, sy + L.ty*q*0.4, q*0.5, 0.8); }
}
/** A hag stone: a pebble the water wore a hole through (for seeing what is hidden). */
function tobHagstone(ctx, { x, y, s, v, rot }, L){
  const R = Math.random, n = 22, pts = [];
  for(let k = 0; k < n; k++){ const a = k/n*TAU, rr = s*0.42*(1 + 0.08*Math.sin(a*2 + v.ph) + 0.05*Math.sin(a*3 + v.ph*2)); pts.push([Math.cos(a)*rr, Math.sin(a)*rr*0.78]); }
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const hx = v.hx*s, hy = v.hy*s, hr = s*0.1;
  const shape = (c, ox, oy) => { pts.forEach(([px, py], i) => i ? c.lineTo(px + ox, py + oy) : c.moveTo(px + ox, py + oy)); c.closePath(); c.moveTo(hx + hr + ox, hy + oy); c.ellipse(hx + ox, hy + oy, hr, hr*0.8, 0, 0, TAU, true); };
  const [dx, dy] = tobLocal(L, rot, s*0.18), [lx, ly] = tobToward(L, rot);
  tobKit.shadow(ctx, shape, dx, dy, s*0.05, 0.42, 5);
  const g = ctx.createRadialGradient(lx*s*0.2, ly*s*0.2, s*0.05, 0, 0, s*0.5); g.addColorStop(0, tobKit.css(tobKit.mix(v.col, [255,255,255], 0.25))); g.addColorStop(1, tobKit.css(tobKit.mix(v.col, [0,0,0], 0.35)));
  ctx.fillStyle = g; ctx.beginPath(); shape(ctx, 0, 0); ctx.fill('nonzero');
  ctx.save(); ctx.beginPath(); shape(ctx, 0, 0); ctx.clip('nonzero');
  for(let k = 0; k < 60; k++){ ctx.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.14)'; ctx.fillRect((R() - 0.5)*s*0.9, (R() - 0.5)*s*0.7, s*0.012, s*0.012); }
  if(v.band){ ctx.strokeStyle = 'rgba(240,236,226,0.5)'; ctx.lineWidth = s*0.035; ctx.beginPath(); ctx.moveTo(-s*0.5, s*0.1); ctx.quadraticCurveTo(0, -s*0.05, s*0.5, s*0.15); ctx.stroke(); }
  ctx.restore();
  // the hole's far wall, in shade
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = s*0.025; ctx.beginPath(); ctx.ellipse(hx, hy, hr, hr*0.8, 0, Math.atan2(ly, lx) - 1.2, Math.atan2(ly, lx) + 1.2); ctx.stroke();
  ctx.restore();
}
/** An old key (iron or brass): its bow, its shaft, its bit. */
function tobKey(ctx, { x, y, s, v, rot }, L){
  const len = s*1.1, M = METALS[v.metal], t = s*0.055;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const [dx, dy] = tobLocal(L, rot, s*0.06), [lx, ly] = tobToward(L, rot);
  const bowX = -len/2 + s*0.14;
  const shape = (c, ox, oy) => { c.moveTo(bowX + s*0.16 + ox, oy); c.arc(bowX + ox, oy, s*0.16, 0, TAU); c.rect(bowX + s*0.12 + ox, -t/2 + oy, len*0.8, t); c.rect(len*0.38 + ox, oy, s*0.14, s*0.17); };
  tobKit.shadow(ctx, shape, dx, dy, s*0.03, 0.45, 3);
  const g = ctx.createLinearGradient(lx*s*0.3, ly*s*0.3, -lx*s*0.3, -ly*s*0.3); g.addColorStop(0, tobKit.css(tobKit.mix(M, [255,255,255], 0.35))); g.addColorStop(1, tobKit.css(tobKit.mix(M, [0,0,0], 0.35)));
  ctx.strokeStyle = g; ctx.fillStyle = g; ctx.lineWidth = s*0.06;
  if(v.trefoil) for(const a of [0, 2.1, -2.1]){ ctx.beginPath(); ctx.arc(bowX + Math.cos(a + Math.PI)*s*0.08, Math.sin(a + Math.PI)*s*0.08, s*0.08, 0, TAU); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(bowX, 0, s*0.12, 0, TAU); ctx.stroke(); }
  ctx.fillRect(bowX + s*0.12, -t/2, len*0.8, t); ctx.fillRect(bowX + s*0.25, -t*0.9, s*0.04, t*1.8);
  ctx.beginPath(); ctx.rect(len*0.38, 0, s*0.14, s*0.17); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(len*0.38 + s*0.04, s*0.08, s*0.03, s*0.09); ctx.fillRect(len*0.38 + s*0.09, s*0.04, s*0.025, s*0.13);
  if(v.metal === 'iron'){ ctx.fillStyle = 'rgba(140,70,30,0.35)'; for(let k = 0; k < 10; k++) ctx.fillRect(bowX + Math.random()*len*0.8, (Math.random() - 0.5)*t, s*0.03, s*0.02); }
  ctx.restore();
}
/** A feather: grey, brown and barred, black, white — or, rarely, a robin's. */
function tobFeather(ctx, { x, y, s, v, rot }, L){
  const len = s*1.3, R = Math.random;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const [dx, dy] = tobLocal(L, rot, s*0.04);
  const ax = t => -len/2 + t*len, ay = t => -Math.sin(t*Math.PI)*len*0.08*v.curve, half = t => len*0.13*Math.pow(Math.sin(Math.min(1, t*1.15)*Math.PI*0.95), 0.6)*(t < 0.2 ? t/0.2 : 1);
  tobKit.shadow(ctx, (c, ox, oy) => { c.moveTo(ax(0.15) + ox, ay(0.15) + oy); for(let k = 0; k <= 20; k++){ const t = 0.15 + k/20*0.85; c.lineTo(ax(t) + ox, ay(t) - half(t) + oy); } for(let k = 20; k >= 0; k--){ const t = 0.15 + k/20*0.85; c.lineTo(ax(t) + ox, ay(t) + half(t)*0.8 + oy); } c.closePath(); }, dx, dy, s*0.03, 0.28, 2);
  ctx.lineWidth = Math.max(cpx(0.4), s*0.008);
  for(let k = 0; k < 140; k++){ const t = 0.12 + k/140*0.88, side = k % 2 ? 1 : -1;
    if(v.split && Math.abs(t - v.split) < 0.02 && side > 0) continue;
    const band = v.bars ? (Math.sin(t*v.bars*Math.PI) > 0.3 ? 0.35 : 0) : 0, base = v.robin && t < 0.55 ? [200, 96, 50] : v.col;
    ctx.strokeStyle = tobKit.css(tobKit.mix(base, [0,0,0], band + (R() - 0.5)*0.1), 0.85);
    const hw = half(t)*(side > 0 ? 1 : 0.8), px = ax(t), py = ay(t), ang = side*(Math.PI/2 - 0.55);
    ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + Math.cos(ang - side*0.2)*hw*0.5, py + side*hw*0.55, px + Math.cos(ang)*hw*0.45 + hw*0.35, py + side*hw); ctx.stroke(); }
  // the downy base
  ctx.strokeStyle = tobKit.css(tobKit.mix(v.col, [255,255,255], 0.4), 0.35); for(let k = 0; k < 20; k++){ const t = 0.05 + R()*0.12; ctx.beginPath(); ctx.moveTo(ax(t), ay(t)); ctx.lineTo(ax(t) + (R() - 0.3)*s*0.1, ay(t) + (R() - 0.5)*s*0.18); ctx.stroke(); }
  ctx.strokeStyle = tobKit.css(tobKit.mix(v.col, [255,255,255], 0.55)); ctx.lineWidth = Math.max(cpx(0.5), s*0.018); ctx.beginPath(); ctx.moveTo(ax(0), ay(0));
  for(let k = 1; k <= 20; k++) ctx.lineTo(ax(k/20), ay(k/20)); ctx.stroke();
  ctx.restore();
}
/** A letter: folded open with its lines of writing, or sealed in wax (the seal sometimes the Witch's fox). */
function tobLetter(ctx, { x, y, s, v, rot }, L){
  const W = s*1.2, H = s*0.82, P = v.paper, R = Math.random;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const [dx, dy] = tobLocal(L, rot, s*0.04), [lx, ly] = tobToward(L, rot);
  tobKit.shadow(ctx, (c, ox, oy) => c.rect(-W/2 + ox, -H/2 + oy, W, H), dx, dy, s*0.04, 0.35, 2);
  const g = ctx.createLinearGradient(lx*W*0.5, ly*H*0.5, -lx*W*0.5, -ly*H*0.5); g.addColorStop(0, tobKit.css(tobKit.mix(P, [255,255,255], 0.1))); g.addColorStop(1, tobKit.css(tobKit.mix(P, [0,0,0], 0.1)));
  ctx.fillStyle = g; ctx.fillRect(-W/2, -H/2, W, H);
  if(v.open){
    // its folds (in thirds), a darker crease and a lit one; the writing, in rows
    for(const f of [-1/6, 1/6]){ ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(-W/2, f*H*2 - H*0.01, W, H*0.012); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-W/2, f*H*2 + H*0.004, W, H*0.008); }
    ctx.strokeStyle = tobKit.css(v.ink, 0.6); ctx.lineWidth = Math.max(cpx(0.4), s*0.008);
    for(let row = 0; row < 9; row++){ const yy = -H*0.38 + row*H*0.09; let px = -W*0.4 + (row ? 0 : W*0.1); const end = W*(0.25 + R()*0.15);
      ctx.beginPath(); ctx.moveTo(px, yy); while(px < end){ const wl = s*(0.03 + R()*0.08); for(let k = 0; k < 4; k++){ px += wl/4; ctx.lineTo(px, yy + Math.sin(k*2.3 + px)*s*0.012); } px += s*0.025; ctx.moveTo(px, yy); } ctx.stroke(); }
  } else {
    // an envelope: its flaps, and the seal where they meet
    ctx.strokeStyle = tobKit.css(tobKit.mix(P, [0,0,0], 0.2), 0.6); ctx.lineWidth = Math.max(cpx(0.4), s*0.008); ctx.beginPath();
    ctx.moveTo(-W/2, -H/2); ctx.lineTo(0, H*0.08); ctx.lineTo(W/2, -H/2); ctx.moveTo(-W/2, H/2); ctx.lineTo(-W*0.1, -H*0.02); ctx.moveTo(W/2, H/2); ctx.lineTo(W*0.1, -H*0.02); ctx.stroke();
    const wr = s*0.11, sx = 0, sy = H*0.06;
    tobKit.shadow(ctx, tobDisc(sx, sy, wr), dx*2, dy*2, wr*0.3, 0.4, 2);
    ctx.fillStyle = tobKit.css(v.wax); ctx.beginPath(); for(let k = 0; k <= 16; k++){ const a = k/16*TAU, rr = wr*(1 + (R() - 0.5)*0.25); k ? ctx.lineTo(sx + Math.cos(a)*rr, sy + Math.sin(a)*rr) : ctx.moveTo(sx + Math.cos(a)*rr, sy + Math.sin(a)*rr); } ctx.closePath(); ctx.fill();
    ctx.save(); ctx.translate(sx, sy); ctx.strokeStyle = tobKit.css(tobKit.mix(v.wax, [0,0,0], 0.35)); ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = Math.max(cpx(0.4), wr*0.1); tobKit.emblem(ctx, v.seal, wr*0.65); ctx.restore();
    tobGlint(ctx, sx + lx*wr*0.4, sy + ly*wr*0.4, wr*0.5, 0.5);
  }
  ctx.restore();
}
/** Petals let fall (a rose, a peony), or one dried leaf. */
function tobPetals(ctx, { x, y, s, v }, L){
  const R = Math.random;
  for(let k = 0; k < v.n; k++){ const px = x + (R() - 0.5)*s*0.9, py = y + (R() - 0.5)*s*0.9, rot = R()*TAU, q = s*(0.13 + R()*0.08)*(v.leaf ? 2.4 : 1);
    ctx.save(); ctx.translate(px, py); ctx.rotate(rot);
    const petal = (c, ox, oy) => { c.moveTo(ox, -q + oy); c.bezierCurveTo(q*0.9 + ox, -q*0.7 + oy, q*0.7 + ox, q*0.8 + oy, ox, q*(v.leaf ? 1 : 0.6) + oy); c.bezierCurveTo(-q*0.7 + ox, q*0.8 + oy, -q*0.9 + ox, -q*0.7 + oy, ox, -q + oy); };
    const [dx, dy] = tobLocal(L, rot, s*0.03); tobKit.shadow(ctx, petal, dx, dy, q*0.2, 0.25, 2);
    const g = ctx.createLinearGradient(0, -q, 0, q); g.addColorStop(0, tobKit.css(tobKit.mix(v.col, [255,255,255], 0.15))); g.addColorStop(1, tobKit.css(tobKit.mix(v.col, [0,0,0], 0.3)));
    ctx.fillStyle = g; ctx.beginPath(); petal(ctx, 0, 0); ctx.fill();
    ctx.strokeStyle = tobKit.css(tobKit.mix(v.col, v.leaf ? [0,0,0] : [255,255,255], 0.25), 0.5); ctx.lineWidth = Math.max(cpx(0.3), q*0.04); ctx.beginPath(); ctx.moveTo(0, -q*0.9); ctx.lineTo(0, q*0.7);
    if(v.leaf) for(let j = -3; j <= 3; j++){ ctx.moveTo(0, j*q*0.22); ctx.lineTo(q*0.45, j*q*0.22 - q*0.2); ctx.moveTo(0, j*q*0.22); ctx.lineTo(-q*0.45, j*q*0.22 - q*0.2); }
    ctx.stroke(); ctx.restore();
    if(v.leaf) break; }
}
/** Matches, a few struck. */
function tobMatches(ctx, { x, y, s, v }, L){
  const R = Math.random;
  for(let k = 0; k < v.n; k++){ const px = x + (R() - 0.5)*s*0.6, py = y + (R() - 0.5)*s*0.6, rot = R()*TAU, len = s*0.55, t = s*0.035, burnt = k < v.burnt;
    ctx.save(); ctx.translate(px, py); ctx.rotate(rot);
    const [dx, dy] = tobLocal(L, rot, t*1.2); tobKit.shadow(ctx, (c, ox, oy) => c.rect(-len/2 + ox, -t/2 + oy, len, t), dx, dy, t*0.6, 0.35, 2);
    ctx.fillStyle = 'rgb(214,184,130)'; ctx.fillRect(-len/2, -t/2, len*(burnt ? 0.6 : 1), t);
    if(burnt){ ctx.strokeStyle = 'rgb(40,32,28)'; ctx.lineWidth = t*0.8; ctx.beginPath(); ctx.moveTo(len*0.1, 0); ctx.quadraticCurveTo(len*0.3, -t*1.5, len*0.42, t*0.5); ctx.stroke(); }
    else { ctx.fillStyle = tobKit.css(v.head); ctx.beginPath(); ctx.ellipse(len/2, 0, t*1.1, t*0.8, 0, 0, TAU); ctx.fill(); }
    ctx.restore(); }
}
/** A ring left on the table by a cup or a glass. */
function tobStain(ctx, { x, y, s, v }){
  ctx.strokeStyle = tobKit.css(v.col, 0.22); ctx.lineWidth = s*0.035;
  for(let k = 0; k < v.n; k++){ const ox = (k ? (Math.random() - 0.5)*s*0.5 : 0), oy = (k ? (Math.random() - 0.5)*s*0.5 : 0), a0 = Math.random()*TAU;
    ctx.beginPath(); ctx.arc(x + ox, y + oy, s*0.32, a0, a0 + TAU*(0.6 + Math.random()*0.4)); ctx.stroke(); }
  ctx.fillStyle = tobKit.css(v.col, 0.05); ctx.beginPath(); ctx.arc(x, y, s*0.32, 0, TAU); ctx.fill();
}
/** A score sheet, the columns headed by signs (or, once in a while, by a fox and a bird), the tallies in pencil. */
function tobScore(ctx, { x, y, s, v, rot }, L){
  const W = s*0.85, H = s*1.25, R = Math.random;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const [dx, dy] = tobLocal(L, rot, s*0.03);
  tobKit.shadow(ctx, (c, ox, oy) => c.rect(-W/2 + ox, -H/2 + oy, W, H), dx, dy, s*0.04, 0.32, 2);
  ctx.fillStyle = 'rgb(238,232,214)'; ctx.fillRect(-W/2, -H/2, W, H);
  ctx.strokeStyle = 'rgba(80,110,150,0.35)'; ctx.lineWidth = Math.max(cpx(0.4), s*0.006);
  for(let k = 1; k < 12; k++){ ctx.beginPath(); ctx.moveTo(-W/2, -H/2 + k*H/12); ctx.lineTo(W/2, -H/2 + k*H/12); ctx.stroke(); }
  const cols = v.heads.length, cw = W/cols;
  ctx.strokeStyle = 'rgba(160,60,60,0.35)'; for(let c = 1; c < cols; c++){ ctx.beginPath(); ctx.moveTo(-W/2 + c*cw, -H/2); ctx.lineTo(-W/2 + c*cw, H/2); ctx.stroke(); }
  ctx.fillStyle = 'rgba(50,46,44,0.85)'; ctx.strokeStyle = 'rgba(50,46,44,0.75)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  v.heads.forEach((hd, c) => { const hx = -W/2 + (c + 0.5)*cw, hy = -H/2 + H/24;
    if(hd.startsWith('emblem:')){ ctx.save(); ctx.translate(hx, hy); ctx.lineWidth = Math.max(cpx(0.4), s*0.008); tobKit.emblem(ctx, hd.slice(7), H*0.04); ctx.restore(); }
    else { ctx.font = `${H*0.06}px ${GLYPH_FONT}`; ctx.fillText(hd, hx, hy); } });
  // the tallies: gates of five, a line struck through
  ctx.strokeStyle = 'rgba(60,58,60,0.6)'; ctx.lineWidth = Math.max(cpx(0.4), s*0.009);
  v.heads.forEach((_, c) => { const n = 2 + Math.floor(R()*14); let row = 1, i = 0;
    for(let k = 0; k < n; k++){ const g = k % 5, gx = -W/2 + c*cw + cw*0.15 + (Math.floor(k/5) % 2)*cw*0.4, gy = -H/2 + (row + 0.5)*H/12;
      if(g < 4){ ctx.beginPath(); ctx.moveTo(gx + g*cw*0.07, gy - H*0.03); ctx.lineTo(gx + g*cw*0.07 + R()*s*0.005, gy + H*0.03); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(gx - cw*0.03, gy + H*0.025); ctx.lineTo(gx + cw*0.25, gy - H*0.025); ctx.stroke(); }
      if(g === 4 && ++i % 2 === 0) row++; } });
  // the pencil beside it
  ctx.translate(W/2 + s*0.12, 0); ctx.rotate(0.1 + (R() - 0.5)*0.3);
  const pl = s*1.0, pt = s*0.06; tobKit.shadow(ctx, (c, ox, oy) => c.rect(-pt/2 + ox, -pl/2 + oy, pt, pl), dx, dy, pt*0.5, 0.35, 3);
  ctx.fillStyle = tobKit.css(v.pencil); ctx.fillRect(-pt/2, -pl/2 + pl*0.1, pt, pl*0.9); ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(-pt/2, -pl/2 + pl*0.1, pt*0.33, pl*0.9);
  ctx.fillStyle = 'rgb(222,196,150)'; ctx.beginPath(); ctx.moveTo(-pt/2, -pl/2 + pl*0.1); ctx.lineTo(pt/2, -pl/2 + pl*0.1); ctx.lineTo(0, -pl/2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgb(50,48,50)'; ctx.beginPath(); ctx.moveTo(-pt*0.15, -pl/2 + pl*0.03); ctx.lineTo(pt*0.15, -pl/2 + pl*0.03); ctx.lineTo(0, -pl/2); ctx.closePath(); ctx.fill();
  ctx.restore();
}
/** A slip in the pot: “I.O.U.” — someone ran out. */
function tobIOU(ctx, { x, y, s, v, rot }, L){
  const W = s*0.9, H = s*0.42;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const [dx, dy] = tobLocal(L, rot, s*0.03); tobKit.shadow(ctx, (c, ox, oy) => c.rect(-W/2 + ox, -H/2 + oy, W, H), dx, dy, s*0.03, 0.35, 2);
  ctx.fillStyle = 'rgb(236,228,206)'; ctx.fillRect(-W/2, -H/2, W, H); ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(-W*0.01, -H/2, W*0.02, H);
  ctx.fillStyle = 'rgba(40,36,60,0.8)'; ctx.font = `italic ${H*0.32}px Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('I.O.U.', 0, -H*0.15); ctx.font = `italic ${H*0.24}px Georgia, serif`; ctx.fillText(v.text, 0, H*0.22);
  ctx.restore();
}

/**
 * EVERY OBJECT: layer ('under' the cards and flat, 'flat', or 'tall': drawn
 * after the cards), weight (how often the seed lays it), size (in card widths),
 * one (only one to a table), vary (what this one is like), paint.
 */
const tobPick = a => a[Math.floor(Math.random()*a.length)];
export const TABLE_OBJECTS = {
  candle:  { layer: 'tall',  weight: 5, size: 1.2, paint: tobCandle,
    vary: R => ({ wax: tobPick([[236, 228, 204], [236, 228, 204], [212, 176, 96], [140, 30, 36], [30, 28, 30], [60, 40, 90]]), dish: tobPick(['brass', 'silver', 'pewter', 'copper']), drips: 1 + Math.floor(R()*5), tall: R(), lit: R() < 0.7, moth: R() < 0.12, mothA: R()*TAU }) },
  cup:     { layer: 'tall',  weight: 4, size: 1.35, paint: tobCup,
    vary: R => ({ ware: tobPick([[240, 238, 232], [240, 238, 232], [196, 214, 196], [40, 40, 44], [226, 214, 236]]), band: R() < 0.5 ? tobPick([[200, 160, 70], [60, 90, 150], [150, 40, 50]]) : null,
      h: R()*TAU, spoon: R() < 0.4, fill: pickWeighted([['tea', 4], ['coffee', 2], ['leaves', 3], ['empty', 1]], R()), omen: R() < 0.3 ? tobPick(['moon', 'ring', 'ears']) : null }) },
  glass:   { layer: 'tall',  weight: 2, size: 1.05, paint: tobGlass,
    vary: R => ({ wine: tobPick([[110, 14, 30], [140, 30, 50], [200, 150, 60], [70, 10, 40]]), level: R() < 0.2 ? 0 : 0.3 + R()*0.7 }) },
  ball:    { layer: 'tall',  weight: 1.5, size: 1.25, one: true, paint: tobBall,
    vary: R => ({ tint: tobPick([[214, 228, 240], [214, 228, 240], [190, 170, 220], [150, 130, 110], [228, 196, 206]]), stand: tobPick([[60, 40, 30], [196, 160, 88], [30, 28, 32]]), mist: R() < 0.3 }) },
  quartz:  { layer: 'tall',  weight: 2, size: 1.2, paint: tobQuartz,
    vary: () => ({ tint: tobPick([[230, 236, 242], [170, 130, 210], [236, 180, 196], [130, 110, 96], [232, 196, 110]]) }) },
  dice:    { layer: 'tall',  weight: 2.5, size: 1.1, paint: tobDice,
    vary: R => { const bone = R() < 0.5; return { n: 1 + Math.floor(R()*3), col: bone ? [236, 226, 204] : tobPick([[150, 30, 36], [30, 30, 34], [40, 70, 120], [60, 110, 80]]), pip: bone ? [30, 26, 24] : [240, 234, 220], elem: R() < 0.25, doubles: R() < 0.15 }; } },
  watch:   { layer: 'tall',  weight: 1.5, size: 1.2, one: true, paint: tobWatch,
    vary: R => ({ metal: tobPick(['gold', 'silver', 'brass']), dial: tobPick([[244, 240, 228], [236, 230, 210], [232, 222, 196]]), a: R()*TAU, bend: (R() - 0.5)*1.6,
      time: R() < 0.5 ? tobPick([[3, 33], [11, 11], [4, 44], [12, 0], [7, 7]]) : [Math.floor(R()*12), Math.floor(R()*60)], lid: R() < 0.35, engraved: tobPick(['fox', 'bird', 'moon', 'star', 'sigil']) }) },
  ring:    { layer: 'tall',  weight: 1.5, size: 0.6, paint: tobRing,
    vary: R => ({ metal: tobPick(['gold', 'gold', 'silver', 'copper']), stone: R() < 0.55 ? tobPick([[150, 20, 40], [30, 60, 150], [30, 120, 80], [120, 60, 160], [240, 240, 250]]) : null, a: R()*TAU }) },
  hagstone:{ layer: 'tall',  weight: 1, size: 0.8, one: true, paint: tobHagstone,
    vary: R => ({ col: tobPick([[120, 118, 112], [150, 140, 126], [86, 90, 96]]), ph: R()*TAU, hx: (R() - 0.5)*0.25, hy: (R() - 0.5)*0.15, band: R() < 0.4 }) },
  key:     { layer: 'flat',  weight: 1.5, size: 1.3, paint: tobKey,
    vary: R => ({ metal: tobPick(['iron', 'brass', 'iron']), trefoil: R() < 0.4 }) },
  feather: { layer: 'flat',  weight: 2, size: 1.7, paint: tobFeather,
    vary: R => ({ col: tobPick([[150, 150, 152], [120, 90, 60], [30, 30, 36], [232, 228, 220]]), bars: R() < 0.4 ? 6 + Math.floor(R()*8) : 0, curve: 0.4 + R()*0.8, split: R() < 0.5 ? 0.4 + R()*0.4 : 0, robin: R() < 0.12 }) },
  letter:  { layer: 'flat',  weight: 2, size: 1.6, paint: tobLetter,
    vary: R => ({ paper: tobPick([[236, 228, 206], [224, 210, 180], [240, 236, 228]]), ink: tobPick([[40, 36, 70], [60, 30, 30], [30, 30, 30]]), open: R() < 0.5,
      wax: tobPick([[150, 24, 30], [150, 24, 30], [30, 30, 30], [40, 80, 60], [180, 140, 60]]), seal: R() < 0.15 ? 'fox' : tobPick(['sigil', 'moon', 'star', 'eye', 'lotus']) }) },
  petals:  { layer: 'flat',  weight: 2, size: 1.2, paint: tobPetals,
    vary: R => { const leaf = R() < 0.3; return { leaf, n: leaf ? 1 : 3 + Math.floor(R()*7), col: leaf ? tobPick([[150, 100, 50], [120, 80, 40], [170, 120, 40]]) : tobPick([[160, 20, 40], [220, 140, 160], [240, 230, 220], [110, 60, 140]]) }; } },
  matches: { layer: 'flat',  weight: 1.5, size: 1.2, paint: tobMatches,
    vary: R => ({ n: 2 + Math.floor(R()*5), burnt: Math.floor(R()*3), head: tobPick([[170, 30, 30], [30, 30, 30], [40, 90, 60]]) }) },
  stain:   { layer: 'under', weight: 2, size: 1.1, paint: tobStain,
    vary: R => ({ col: tobPick([[110, 60, 20], [110, 20, 40]]), n: 1 + Math.floor(R()*3) }) },
  // laid by the games themselves (weight 0: never as clutter)
  score:   { layer: 'flat',  weight: 0, size: 1.3, paint: tobScore,
    vary: R => ({ heads: R() < 0.12 ? ['emblem:fox', 'emblem:bird'] : tobPick([['🜂', '🜄', '🜁', '🜃'], ['☉', '☽'], ['☿', '♀', '♂'], ['♃', '♄', '☽'], ['🜍', '🜔', '☿']]), pencil: tobPick([[200, 160, 40], [40, 90, 60], [140, 30, 40], [30, 30, 30]]) }) },
  iou:     { layer: 'flat',  weight: 0, size: 1.0, paint: tobIOU, vary: () => ({ text: '' }) },
};
/** One object, painted where it lies. */
export function crtPaintObject(ctx, it, L){ const def = TABLE_OBJECTS[it.type]; if(!def) return; ctx.save(); def.paint(ctx, it, L); ctx.restore(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
/** A new object of a kind (its variety drawn now), at x, y; s: card width. */
export function crtObject(type, x, y, cw, extra = {}){
  const def = TABLE_OBJECTS[type], R = Math.random;
  return { kind: 'object', type, layer: def.layer, x, y, s: cw*def.size*(extra.k || (0.85 + R()*0.3)), rot: extra.rot ?? R()*TAU, v: { ...(def.vary ? def.vary(R) : {}), ...(extra.v || {}) } };
}
/**
 * THE CLUTTER: how much (0–1) of what else is on the table, and where — each
 * the best of several places tried, toward the edges (the center is for the
 * game) and off the cards and coins already laid (a little overlap is life).
 */
export function crtTableObjects(items, w, h, cw, clutter){
  const out = [], R = Math.random; if(!(clutter > 0)) return out;
  const n = Math.floor(clutter*4.5*(0.35 + R()*0.9) + R()*clutter*1.5);
  const used = new Set(items.filter(i => i.kind === 'object').map(i => i.type));
  const solid = items.map(it => ({ x: it.x, y: it.y, r: it.kind === 'card' ? (it.cw || cw)*0.8 : it.kind === 'object' ? it.s*0.5 : (it.r || cw*0.2)*1.2, obj: it.kind === 'object' }));
  const pool = Object.entries(TABLE_OBJECTS).filter(([, d]) => d.weight > 0).map(([k, d]) => [k, d.weight]);
  for(let i = 0; i < n; i++){
    let type = pickWeighted(pool, R()); if(TABLE_OBJECTS[type].one && used.has(type)) type = pickWeighted(pool, R());
    if(TABLE_OBJECTS[type].one && used.has(type)) continue;
    const it = crtObject(type, 0, 0, cw); let best = null, bs = -1e9;
    for(let k = 0; k < 18; k++){ const x = w*(0.03 + R()*0.94), y = h*(0.03 + R()*0.94);
      // toward the edges, but on the table: no reward past the band near them (a little over the edge, sometimes, is life)
      let sc = Math.min(0.82, Math.hypot((x - w/2)/(w/2), (y - h/2)/(h/2)))*2.2 + R()*0.25;
      for(const o of solid){ const d = Math.hypot(x - o.x, y - o.y), need = o.r + it.s*0.5; if(d < need) sc -= (1 - d/need)*(o.obj ? 3 : it.layer === 'under' ? 0.3 : 1.4); }
      if(sc > bs){ bs = sc; best = [x, y]; } }
    it.x = best[0]; it.y = best[1]; out.push(it); solid.push({ x: it.x, y: it.y, r: it.s*0.5, obj: true }); used.add(type);
  }
  return out;
}

/** A COUNTER for a game played for something other than coin. */
export function crtToken(ctx, x, y, r, tok, L){
  const R = Math.random;
  if(tok.type === 'bead'){
    tobKit.shadow(ctx, tobDisc(x, y, r), L.sx*r*0.5, L.sy*r*0.5, r*0.2, 0.3, 4);
    tobGlint(ctx, x + L.sx*r*0.7, y + L.sy*r*0.7, r*0.6, 0.25, tok.col.join(','));
    const g = ctx.createRadialGradient(x - L.tx*r*0.2, y - L.ty*r*0.2, 0, x, y, r); g.addColorStop(0, tobKit.css(tobKit.mix(tok.col, [255,255,255], 0.3), 0.75)); g.addColorStop(1, tobKit.css(tobKit.mix(tok.col, [0,0,0], 0.4), 0.95));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); tobGlint(ctx, x + L.tx*r*0.45, y + L.ty*r*0.45, r*0.35, 0.9);
  } else if(tok.type === 'button'){
    tobKit.shadow(ctx, tobDisc(x, y, r), L.sx*r*0.12, L.sy*r*0.12, r*0.15, 0.4, 2);
    ctx.fillStyle = tobKit.css(tok.col); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = tobKit.css(tobKit.mix(tok.col, [0,0,0], 0.3)); ctx.lineWidth = r*0.1; ctx.beginPath(); ctx.arc(x, y, r*0.75, 0, TAU); ctx.stroke();
    ctx.fillStyle = tobKit.css(tobKit.mix(tok.col, [0,0,0], 0.55)); for(const [a, b] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ ctx.beginPath(); ctx.arc(x + a*r*0.22, y + b*r*0.22, r*0.1, 0, TAU); ctx.fill(); }
  } else {
    // a pebble or a bean: a lumpy oval, lit
    const rot = R()*TAU, ax = r*(tok.type === 'bean' ? 1.25 : 1.1), ay = r*(tok.type === 'bean' ? 0.75 : 0.85);
    tobKit.shadow(ctx, (c, ox, oy) => { c.moveTo(x + ox + ax, y + oy); c.ellipse(x + ox, y + oy, ax, ay, rot, 0, TAU); }, L.sx*r*0.3, L.sy*r*0.3, r*0.2, 0.4, 3);
    const g = ctx.createRadialGradient(x + L.tx*r*0.4, y + L.ty*r*0.4, 0, x, y, ax); g.addColorStop(0, tobKit.css(tobKit.mix(tok.col, [255,255,255], 0.25))); g.addColorStop(1, tobKit.css(tobKit.mix(tok.col, [0,0,0], 0.35)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, ax, ay, rot, 0, TAU); ctx.fill();
    if(tok.type === 'bean'){ ctx.strokeStyle = 'rgba(240,236,220,0.6)'; ctx.lineWidth = r*0.1; ctx.beginPath(); ctx.ellipse(x, y, ax*0.25, ay*0.12, rot, 0, TAU); ctx.stroke(); }
  }
}
/** What a game is played for, when it is not coin. */
export function crtTokenKind(){
  const type = tobPick(['bead', 'bead', 'stone', 'bean', 'button']);
  const col = type === 'bead' ? tobPick([[150, 20, 40], [30, 90, 150], [40, 120, 80], [200, 160, 50], [110, 60, 150]]) : type === 'stone' ? tobPick([[130, 126, 120], [90, 96, 104], [170, 160, 140]])
    : type === 'bean' ? tobPick([[120, 40, 30], [60, 40, 30], [200, 180, 140]]) : tobPick([[230, 226, 214], [40, 40, 44], [150, 110, 70], [170, 40, 50]]);
  return { type, col };
}

// ---- WHAT HAS HAPPENED TO A CARD ----
/** One card's damage, or null: a dog-ear, a torn corner, a crease, a ring, a burn, wax, a pinhole, a pencil mark (a marked deck), a tide line. */
export function crtDamageFor(R, back){
  const kind = pickWeighted([['fold', 4], ['tear', 3], ['crease', 4], ['ring', 3], ['burn', 1.5], ['wax', 2], ['pin', 1.5], ['mark', 2], ['tide', 1.5]], R());
  const corner = Math.floor(R()*4), d = { kind, corner, backCol: back ? back.backCol || 0 : 0, a: R(), b: R(), c: R() };
  if(kind === 'tear') d.jag = Array.from({ length: 6 }, (_, i) => [(i + 1)/7, (R() - 0.4)*0.04]);
  d.size = kind === 'fold' ? 0.14 + R()*0.14 : 0.1 + R()*0.18;
  return d;
}
/** The corner a damage cuts away (a tear, a fold), as crtCardPath wants it. */
export function crtCut(dmg){ return dmg && (dmg.kind === 'tear' || dmg.kind === 'fold') ? { corner: dmg.corner, a: dmg.size, b: dmg.size*(0.8 + dmg.b*0.5), jag: dmg.jag || null } : null; }
/** A card's outline about the origin: rounded, or with a corner torn or folded away. begin: start a new path. */
export function crtCardPath(c, W, H, r, cut, begin = true){
  if(begin) c.beginPath();
  const C = [[-1,-1],[1,-1],[1,1],[-1,1]];
  C.forEach(([sx, sy], i) => {
    const cx = sx*W/2, cy = sy*H/2, isCut = cut && i === cut.corner, ax = isCut ? cut.a*W : r, ay = isCut ? cut.b*W : r;
    const vert = [cx, cy - sy*ay], hori = [cx - sx*ax, cy], [p, q] = i % 2 === 0 ? [vert, hori] : [hori, vert];
    if(i === 0) c.moveTo(p[0], p[1]); else c.lineTo(p[0], p[1]);
    if(!isCut) c.arcTo(cx, cy, q[0], q[1], r);
    else { if(cut.jag) for(const [t, j] of cut.jag) c.lineTo(p[0] + (q[0] - p[0])*t - sx*j*W, p[1] + (q[1] - p[1])*t - sy*j*W); c.lineTo(q[0], q[1]); }
  });
  c.closePath();
}
/** The marks of a card's damage, over its face (clip: its outline); a fold's flap over that. */
export function crtDamage(ctx, W, H, r, dmg, paper, cols, [tx, ty], outline, isBack){
  const R = Math.random, k = dmg.kind;
  ctx.save(); outline(ctx); ctx.clip();
  if(k === 'crease'){
    // a crease, corner to edge: lit on one side, shaded on the other
    const x0 = (dmg.a - 0.5)*W, y0 = -H/2, x1 = (dmg.b - 0.5)*W*1.4, y1 = H/2, nx = -(y1 - y0), ny = x1 - x0, m = Math.hypot(nx, ny), side = (nx*tx + ny*ty)/m > 0 ? 1 : -1;
    ctx.lineWidth = Math.max(cpx(0.5), W*0.012);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(x0 + side*nx/m*W*0.008, y0 + side*ny/m*W*0.008); ctx.lineTo(x1 + side*nx/m*W*0.008, y1 + side*ny/m*W*0.008); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.moveTo(x0 - side*nx/m*W*0.006, y0 - side*ny/m*W*0.006); ctx.lineTo(x1 - side*nx/m*W*0.006, y1 - side*ny/m*W*0.006); ctx.stroke();
  } else if(k === 'ring'){
    // a cup set down on it once
    const cx = (dmg.a - 0.5)*W*0.8, cy = (dmg.b - 0.5)*H*0.8, rr = W*(0.25 + dmg.c*0.2);
    ctx.strokeStyle = 'rgba(120,70,30,0.32)'; ctx.lineWidth = W*0.02; ctx.beginPath(); ctx.arc(cx, cy, rr, dmg.c*6, dmg.c*6 + TAU*0.82); ctx.stroke();
    ctx.fillStyle = 'rgba(140,90,40,0.07)'; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU); ctx.fill();
  } else if(k === 'burn'){
    // scorched from one edge: black at the edge, browning inward
    const [sx, sy] = [[0,-1],[1,0],[0,1],[-1,0]][dmg.corner];
    for(let i = 0; i < 6; i++){ const ex = sx ? sx*W/2 : (R() - 0.5)*W, ey = sy ? sy*H/2 : (R() - 0.5)*H, q = W*(0.12 + R()*0.18), g = ctx.createRadialGradient(ex, ey, 0, ex, ey, q);
      g.addColorStop(0, 'rgba(20,10,4,0.95)'); g.addColorStop(0.35, 'rgba(70,36,12,0.7)'); g.addColorStop(0.7, 'rgba(150,90,40,0.25)'); g.addColorStop(1, 'rgba(150,90,40,0)');
      ctx.fillStyle = g; ctx.fillRect(ex - q, ey - q, q*2, q*2); }
  } else if(k === 'tide'){
    // it was wet once: a wavering brown line, the paper paler below it
    const y0 = (dmg.a - 0.2)*H*0.6; ctx.strokeStyle = 'rgba(120,80,40,0.35)'; ctx.lineWidth = W*0.012; ctx.beginPath();
    for(let i = 0; i <= 20; i++){ const x = -W/2 + i/20*W, y = y0 + Math.sin(i*1.3 + dmg.b*9)*H*0.03 + (R() - 0.5)*H*0.01; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    ctx.fillStyle = 'rgba(255,250,235,0.08)'; ctx.fillRect(-W/2, y0, W, H);
  } else if(k === 'mark'){
    // a pencil mark in a corner: someone marks the deck
    const x = (dmg.corner % 2 ? 1 : -1)*W*0.36, y = (dmg.corner < 2 ? -1 : 1)*H*0.42; ctx.strokeStyle = 'rgba(70,70,76,0.55)'; ctx.lineWidth = Math.max(cpx(0.4), W*0.01); ctx.beginPath();
    if(dmg.a < 0.4){ ctx.moveTo(x - W*0.03, y - W*0.03); ctx.lineTo(x + W*0.03, y + W*0.03); ctx.moveTo(x + W*0.03, y - W*0.03); ctx.lineTo(x - W*0.03, y + W*0.03); }
    else if(dmg.a < 0.7){ ctx.moveTo(x - W*0.03, y); ctx.lineTo(x - W*0.005, y + W*0.03); ctx.lineTo(x + W*0.04, y - W*0.04); }
    else { ctx.arc(x, y, W*0.012, 0, TAU); }
    ctx.stroke();
  } else if(k === 'pin'){
    // a pinhole, where it was pinned to a wall
    const x = (dmg.a - 0.5)*W*0.3, y = -H*0.4; ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(x, y, W*0.02, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(10,8,6,0.9)'; ctx.beginPath(); ctx.arc(x, y, W*0.009, 0, TAU); ctx.fill();
  }
  ctx.restore();
  if(k === 'wax'){
    // a drip of candle wax, raised a little off the card
    const x = (dmg.a - 0.5)*W*0.7, y = (dmg.b - 0.5)*H*0.7, col = [[236, 228, 204], [140, 30, 36], [30, 28, 30], [212, 176, 96]][Math.floor(dmg.c*4)], q = W*(0.06 + dmg.c*0.06);
    ctx.fillStyle = tobKit.css(col); ctx.beginPath(); ctx.arc(x, y, q, 0, TAU); ctx.arc(x + q*0.8, y + q*0.5, q*0.6, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(x + tx*q*0.35, y + ty*q*0.35, q*0.3, 0, TAU); ctx.fill();
  }
  if(k === 'fold'){
    // the dog-ear: the corner folded over, its other side showing, a soft shadow beneath it
    const cut = crtCut(dmg), [sx, sy] = [[-1,-1],[1,-1],[1,1],[-1,1]][dmg.corner], cx = sx*W/2, cy = sy*H/2;
    const p = [cx, cy - sy*cut.b*W], q = [cx - sx*cut.a*W, cy], dx = q[0] - p[0], dy = q[1] - p[1], t = ((cx - p[0])*dx + (cy - p[1])*dy)/(dx*dx + dy*dy);
    const fx = p[0] + dx*t, fy = p[1] + dy*t, Q = [2*fx - cx, 2*fy - cy];
    tobKit.shadow(ctx, (c, ox, oy) => { c.moveTo(p[0] + ox, p[1] + oy); c.lineTo(q[0] + ox, q[1] + oy); c.lineTo(Q[0] + ox, Q[1] + oy); c.closePath(); }, -tx*W*0.02, -ty*W*0.02, W*0.03, 0.35, 0);
    const other = isBack ? tobKit.mix(paper, [0,0,0], 0.06) : tobKit.mix(cols[dmg.backCol] || [120, 90, 70], paper, 0.25);
    const g = ctx.createLinearGradient(fx, fy, Q[0], Q[1]); g.addColorStop(0, tobKit.css(tobKit.mix(other, [0,0,0], 0.18))); g.addColorStop(1, tobKit.css(tobKit.mix(other, [255,255,255], 0.12)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.lineTo(Q[0], Q[1]); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(cpx(0.4), W*0.006); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
  }
  if(k === 'tear' && dmg.jag){
    // the torn edge: the paper's pale fibres
    const cut = crtCut(dmg), [sx, sy] = [[-1,-1],[1,-1],[1,1],[-1,1]][dmg.corner], cx = sx*W/2, cy = sy*H/2;
    const vert = [cx, cy - sy*cut.b*W], hori = [cx - sx*cut.a*W, cy], [p, q] = dmg.corner % 2 === 0 ? [vert, hori] : [hori, vert];   // (as crtCardPath walks it)
    ctx.strokeStyle = 'rgba(250,246,236,0.7)'; ctx.lineWidth = Math.max(cpx(0.5), W*0.012); ctx.beginPath(); ctx.moveTo(p[0], p[1]);
    for(const [t, j] of cut.jag) ctx.lineTo(p[0] + (q[0] - p[0])*t - sx*j*W, p[1] + (q[1] - p[1])*t - sy*j*W); ctx.lineTo(q[0], q[1]); ctx.stroke();
  }
}
