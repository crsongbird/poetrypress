/**
 * cartomancy.js — a CARD GAME IN PROGRESS on a table, and the parts it is made
 * of (Ruby: "imply there's a game with actual rules being played"). Every
 * seed deals a different game: which one, how many play, which suits are in
 * the deck, whether there is money on the table and whose coin it is.
 *
 * THE PARTS (each usable alone — the Athanor offers them as steps, and other
 * surfaces can borrow them):
 *   crtTable(ctx, w, h, mat, light)      a table top in a material, lit by a lamp
 *   crtCard(ctx, W, H, face, look)       one card, face up or down, at the origin
 *   crtCoin(ctx, x, y, r, coin, look)    one coin of an invented coinage
 *   crtStack(ctx, x, y, r, n, coin, look) a stack of them
 *   crtDeal(game, w, h, opts)            WHERE everything lies, by the game's rules
 *   genCartomancy(...)                   the texture: table, then the deal, lit
 *   CARD_STEPS                           Table, Deal and Coins for the Athanor
 *
 * Its suits are the four elements as the alchemists drew them (fire △, water
 * ▽, air and earth barred), coloured by the page's two accents and the
 * texture's two hues. The major arcana are Vellum's own (The Familiar, The
 * Seed, The Scrying Pool…), and rarely an easter egg: Saturn, Enceladus, the
 * Kitsune of seven tails.
 *
 * Drawn at full size on the page (its faces are lettered in web fonts), so it
 * is never a chain; the Athanor's Table, Deal and Coins are the same parts
 * drawn on its grid.
 */
import { CPU, cpx, lightVec, parseHex, pickWeighted } from './texCore.js';
import { GLYPH_FONT } from './spell.js';

const CRT_SERIF = 'Georgia, "Times New Roman", serif';
const crtRGB = c => Array.isArray(c) ? c : (() => { const p = parseHex(c || '#808080'); return [p.r, p.g, p.b]; })();
const crtCss = (c, a = 1) => `rgba(${Math.max(0, Math.min(255, c[0]|0))},${Math.max(0, Math.min(255, c[1]|0))},${Math.max(0, Math.min(255, c[2]|0))},${a})`;
const crtMix = (a, b, t) => [a[0] + (b[0] - a[0])*t, a[1] + (b[1] - a[1])*t, a[2] + (b[2] - a[2])*t];
const crtPick = a => a[Math.floor(Math.random()*a.length)];

// ---- MATERIALS, chosen by the seed ----
export const TABLE_MATERIALS = {
  baize:   { label: 'Green Baize',    base: [38, 96, 62],   kind: 'felt' },
  bluefelt:{ label: 'Blue Felt',      base: [34, 62, 104],  kind: 'felt' },
  claret:  { label: 'Claret Velvet',  base: [96, 26, 40],   kind: 'velvet' },
  violet:  { label: 'Violet Velvet',  base: [62, 34, 92],   kind: 'velvet' },
  oak:     { label: 'Oak',            base: [150, 108, 66], kind: 'wood' },
  walnut:  { label: 'Walnut',         base: [86, 56, 38],   kind: 'wood' },
  marble:  { label: 'White Marble',   base: [222, 218, 210],kind: 'marble' },
  nero:    { label: 'Black Marble',   base: [34, 34, 38],   kind: 'marble' },
  slate:   { label: 'Slate',          base: [70, 78, 86],   kind: 'stone' },
  linen:   { label: 'Linen Cloth',    base: [214, 204, 184],kind: 'cloth' },
};
export const CARD_STOCKS = {
  ivory:     { paper: [236, 228, 208], ink: [30, 26, 24], gloss: 0.15 },
  cream:     { paper: [242, 232, 204], ink: [40, 30, 22], gloss: 0.1 },
  parchment: { paper: [222, 200, 160], ink: [52, 34, 22], gloss: 0.05 },
  lacquer:   { paper: [26, 24, 30],    ink: [226, 214, 182], gloss: 0.6 },
  vellum:    { paper: [232, 222, 214], ink: [60, 28, 40], gloss: 0.2 },
};
export const GILT = { gold: [226, 182, 92], silver: [206, 210, 216], rose: [222, 156, 136], copper: [196, 120, 74], none: null };
export const COIN_METALS = { gold: [222, 178, 84], silver: [200, 204, 210], copper: [190, 112, 70], bronze: [168, 124, 72], iron: [110, 112, 116] };
// INVENTED COINAGE: what the coins are called and the mark struck on them
export const COINAGES = [
  { name: 'lunes', mark: '☽', metal: 'silver' }, { name: 'obols', mark: '♄', metal: 'bronze' }, { name: 'quints', mark: '🜚', metal: 'gold' },
  { name: 'cinders', mark: '🜂', metal: 'copper' }, { name: 'sigils', mark: '⛤', metal: 'iron' }, { name: 'crowns', mark: '♔', metal: 'gold' },
  { name: 'tides', mark: '🜄', metal: 'silver' }, { name: 'mercies', mark: '☿', metal: 'silver' },
];
export const CARD_GAMES = {
  reading:  'a reading: a spread laid for one, the deck beside it',
  trick:    'a trick-taking game: each player\'s hand, a trick in the middle, the stock and its trump',
  patience: 'patience for one: the tableau in columns, the foundations by suit, the stock and the waste',
  wager:    'a wagering game: hands, the shared cards in a row, a pot and each player\'s coin',
  pairs:    'pairs: the deck face down in a grid, a few turned up and matched',
};

// ---- the elements, as the alchemists drew them: fire △, water ▽, air △ barred, earth ▽ barred ----
export function crtElement(ctx, x, y, s, e, fill){
  const up = (e === 0 || e === 2); ctx.beginPath();
  if(up){ ctx.moveTo(x, y - s); ctx.lineTo(x + s*0.9, y + s*0.6); ctx.lineTo(x - s*0.9, y + s*0.6); }
  else { ctx.moveTo(x, y + s); ctx.lineTo(x + s*0.9, y - s*0.6); ctx.lineTo(x - s*0.9, y - s*0.6); }
  ctx.closePath(); if(fill) ctx.fill();
  if(e >= 2){ const by = up ? y + s*0.05 : y - s*0.05; ctx.moveTo(x - s*0.85, by); ctx.lineTo(x + s*0.85, by); }
  ctx.stroke();
}
export const CRT_SUITS = ['Fire', 'Water', 'Air', 'Earth'];
export const CRT_ARCANA = [['0','The Familiar','bird'],['I','The Witch','fox'],['II','The Vellum','sigil'],['III','The Seed','seed'],['IV','The Spell','eye'],
  ['V','The Grimoire','book'],['VI','The Lotus','lotus'],['VII','The Dial','dial'],['VIII','Kintsugi','bowl'],['IX','The Scrying Pool','pool'],
  ['X','The Wheel of Seeds','wheel'],['XIII','The Black Hole','hole'],['XIV','Transmutation','circle'],['XV','The Crystal','crystal'],
  ['XVII','The Star','star'],['XVIII','The Moon','moon'],['XIX','The Sun','sun'],['XXI','The World','world'],
  ['XI','The Alembic','glyph:🝪'],['XII','Caput Mortuum','glyph:🝎'],['XVI','The Crucible','glyph:🝥'],['XX','The Comet','glyph:☄'],
  ['XXII','Lilith','glyph:⚸'],['XXIII','The Caduceus','glyph:🝐'],['XXIV','Sedna','glyph:⯲'],['XXV','Quintessence','glyph:🜚']];
// the rare cards are not equally rare: Saturn 3 : Enceladus 2 : the Kitsune 1
export const CRT_RARE = [[['✦','Saturn','saturn'],3],[['✦','Enceladus','enceladus'],2],[['✦','The Kitsune','kitsune'],1]];

/** An emblem, simply drawn in ink (or a sign from the lore, in the symbol font). */
export function crtEmblem(ctx, kind, s){
  if(kind.startsWith('glyph:')){ ctx.save(); ctx.font = `${s*1.5}px ${GLYPH_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(kind.slice(6), 0, s*0.05); ctx.restore(); return; }
  ctx.beginPath();
  const ray = (n2, r0, r1) => { for(let k = 0; k < n2; k++){ const a = k/n2*Math.PI*2; ctx.moveTo(Math.cos(a)*r0, Math.sin(a)*r0); ctx.lineTo(Math.cos(a)*r1, Math.sin(a)*r1); } };
  switch(kind){
    case 'sun': ctx.arc(0,0,s*0.38,0,Math.PI*2); ray(16,s*0.48,s*0.78); break;
    case 'moon': ctx.arc(0,0,s*0.55,Math.PI*0.35,Math.PI*1.65); ctx.arc(s*0.2,0,s*0.45,Math.PI*1.5,Math.PI*0.5,true); break;
    case 'star': for(let k=0;k<16;k++){ const a=-Math.PI/2+k*Math.PI/8, r=k%2 ? s*0.22 : (k%4 ? s*0.5 : s*0.8); k?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r); } ctx.closePath(); break;
    case 'eye': ctx.moveTo(-s*0.7,0); ctx.quadraticCurveTo(0,-s*0.55,s*0.7,0); ctx.quadraticCurveTo(0,s*0.55,-s*0.7,0); ctx.moveTo(s*0.2,0); ctx.arc(0,0,s*0.2,0,Math.PI*2); break;
    case 'lotus': for(let k=-2;k<=2;k++){ ctx.moveTo(0,s*0.4); ctx.quadraticCurveTo(k*s*0.32-s*0.12,-s*0.1+Math.abs(k)*s*0.12,k*s*0.3,-s*0.55+Math.abs(k)*s*0.2); ctx.quadraticCurveTo(k*s*0.32+s*0.12,-s*0.1+Math.abs(k)*s*0.12,0,s*0.4); } break;
    case 'seed': ctx.ellipse(0,s*0.15,s*0.18,s*0.28,0,0,Math.PI*2); ctx.moveTo(0,-s*0.13); ctx.quadraticCurveTo(s*0.25,-s*0.5,s*0.05,-s*0.75); ctx.moveTo(0,-s*0.35); ctx.quadraticCurveTo(-s*0.3,-s*0.45,-s*0.35,-s*0.6); break;
    case 'book': ctx.moveTo(0,-s*0.35); ctx.quadraticCurveTo(-s*0.35,-s*0.5,-s*0.7,-s*0.35); ctx.lineTo(-s*0.7,s*0.4); ctx.quadraticCurveTo(-s*0.35,s*0.25,0,s*0.4); ctx.quadraticCurveTo(s*0.35,s*0.25,s*0.7,s*0.4); ctx.lineTo(s*0.7,-s*0.35); ctx.quadraticCurveTo(s*0.35,-s*0.5,0,-s*0.35); ctx.lineTo(0,s*0.4); break;
    case 'dial': ctx.arc(0,0,s*0.45,0,Math.PI*2); ctx.moveTo(s*0.08,0); ctx.arc(0,0,s*0.08,0,Math.PI*2); ctx.moveTo(0,-s*0.5); ctx.lineTo(0,-s*0.82); ray(8,s*0.58,s*0.64); break;
    case 'bowl': ctx.moveTo(-s*0.6,-s*0.15); ctx.quadraticCurveTo(0,s*0.75,s*0.6,-s*0.15); ctx.closePath(); ctx.moveTo(-s*0.25,-s*0.1); ctx.lineTo(-s*0.05,s*0.15); ctx.lineTo(s*0.1,s*0.02); ctx.lineTo(s*0.3,s*0.3); break;
    case 'pool': ctx.ellipse(0,0,s*0.65,s*0.28,0,0,Math.PI*2); ctx.moveTo(s*0.4,0); ctx.ellipse(0,0,s*0.4,s*0.16,0,0,Math.PI*2); ctx.moveTo(-s*0.2,-s*0.02); ctx.quadraticCurveTo(0,-s*0.12,s*0.2,-s*0.02); break;
    case 'wheel': ctx.arc(0,0,s*0.55,0,Math.PI*2); ctx.moveTo(s*0.15,0); ctx.arc(0,0,s*0.15,0,Math.PI*2); ray(8,s*0.15,s*0.55); break;
    case 'hole': ctx.ellipse(0,0,s*0.8,s*0.22,-0.15,0,Math.PI*2); ctx.moveTo(s*0.3,0); ctx.arc(0,0,s*0.3,0,Math.PI*2); break;
    case 'circle': ctx.arc(0,0,s*0.6,0,Math.PI*2); for(let k=0;k<3;k++){ const a=-Math.PI/2+k*Math.PI*2/3, b2=-Math.PI/2+(k+1)*Math.PI*2/3; ctx.moveTo(Math.cos(a)*s*0.6,Math.sin(a)*s*0.6); ctx.lineTo(Math.cos(b2)*s*0.6,Math.sin(b2)*s*0.6); } break;
    case 'crystal': ctx.moveTo(0,-s*0.8); ctx.lineTo(s*0.3,-s*0.45); ctx.lineTo(s*0.3,s*0.55); ctx.lineTo(0,s*0.75); ctx.lineTo(-s*0.3,s*0.55); ctx.lineTo(-s*0.3,-s*0.45); ctx.closePath(); ctx.moveTo(0,-s*0.8); ctx.lineTo(0,s*0.75); break;
    case 'world': ctx.ellipse(0,0,s*0.42,s*0.62,0,0,Math.PI*2); ctx.moveTo(s*0.1,0); ctx.arc(0,0,s*0.1,0,Math.PI*2); break;
    case 'sigil': ctx.moveTo(0,-s*0.7); ctx.lineTo(s*0.6,0); ctx.lineTo(0,s*0.7); ctx.lineTo(-s*0.6,0); ctx.closePath(); ctx.moveTo(0,-s*0.35); ctx.lineTo(s*0.3,0); ctx.lineTo(0,s*0.35); ctx.lineTo(-s*0.3,0); ctx.closePath(); break;
    case 'bird': ctx.moveTo(-s*0.6,-s*0.1); ctx.quadraticCurveTo(-s*0.2,-s*0.6,0,-s*0.05); ctx.quadraticCurveTo(s*0.2,-s*0.6,s*0.6,-s*0.1); ctx.moveTo(0,-s*0.05); ctx.lineTo(0,s*0.35); break;
    case 'fox': ctx.moveTo(-s*0.45,-s*0.55); ctx.lineTo(-s*0.2,-s*0.15); ctx.lineTo(s*0.2,-s*0.15); ctx.lineTo(s*0.45,-s*0.55); ctx.lineTo(s*0.4,s*0.05); ctx.lineTo(0,s*0.5); ctx.lineTo(-s*0.4,s*0.05); ctx.closePath(); break;
    case 'saturn': ctx.arc(0,0,s*0.3,0,Math.PI*2); ctx.moveTo(s*0.8,0); ctx.ellipse(0,0,s*0.8,s*0.2,-0.35,0,Math.PI*2); ctx.moveTo(s*0.65,0); ctx.ellipse(0,0,s*0.62,s*0.15,-0.35,0,Math.PI*2); break;
    case 'enceladus': ctx.arc(0,s*0.2,s*0.4,0,Math.PI*2); for(let k=-2;k<=2;k++){ ctx.moveTo(k*s*0.08,s*0.6); ctx.lineTo(k*s*0.22,s*0.95); } for(let k=0;k<4;k++){ ctx.moveTo(-s*0.25+k*s*0.15,s*0.05); ctx.lineTo(-s*0.15+k*s*0.15,s*0.35); } break;
    case 'kitsune': for(let k=0;k<7;k++){ const a=-Math.PI*0.9+k*Math.PI*0.8/6; ctx.moveTo(0,s*0.3); ctx.quadraticCurveTo(Math.cos(a)*s*0.4,s*0.3+Math.sin(a)*s*0.4,Math.cos(a)*s*0.8,s*0.1+Math.sin(a)*s*0.7); }
      ctx.moveTo(-s*0.18,s*0.05); ctx.lineTo(-s*0.1,-s*0.25); ctx.lineTo(0,-s*0.05); ctx.lineTo(s*0.1,-s*0.25); ctx.lineTo(s*0.18,s*0.05); ctx.lineTo(0,s*0.3); ctx.closePath(); break;
  }
  ctx.stroke();
}

// ---- THE TABLE: a material, under a lamp (a pool of light toward the dial; the corners fall away) ----
export function crtTable(ctx, w, h, mat, light, opts = {}){
  const M = TABLE_MATERIALS[mat] || TABLE_MATERIALS.baize, base = M.base, unit = Math.min(w, h);
  const lv = lightVec(light == null ? 315 : light), lampX = w/2 - lv.lx*w*0.28, lampY = h/2 - lv.ly*h*0.28;
  ctx.fillStyle = crtCss(base); ctx.fillRect(0, 0, w, h);
  // the material's own grain
  const R = Math.random;
  if(M.kind === 'felt' || M.kind === 'velvet' || M.kind === 'cloth'){
    // a nap of tiny strokes; velvet with soft crushed patches, linen with a weave
    const n = Math.round(w*h/(unit*unit)*(M.kind === 'cloth' ? 2600 : 5200));
    for(let k = 0; k < n; k++){ const x = R()*w, y = R()*h, l = unit*(0.002 + R()*0.004), t = (R() - 0.5)*30;
      ctx.globalAlpha = 0.12; ctx.strokeStyle = crtCss(base.map(v => v + t)); ctx.lineWidth = Math.max(cpx(0.6), unit*0.0012);
      const a = M.kind === 'cloth' ? (k % 2 ? 0 : Math.PI/2) : R()*Math.PI; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a)*l, y + Math.sin(a)*l); ctx.stroke(); }
    if(M.kind === 'velvet') for(let k = 0; k < 9; k++){ const x = R()*w, y = R()*h, r = unit*(0.08 + R()*0.18), g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, crtCss(crtMix(base, [255,255,255], 0.18), 0.35)); g.addColorStop(1, crtCss(base, 0)); ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r*2, r*2); }
  } else if(M.kind === 'wood'){
    // boards, their grain wandering along them
    const boards = 3 + Math.floor(R()*3), bh = h/boards;
    for(let b = 0; b < boards; b++){ const tone = (R() - 0.5)*26; ctx.globalAlpha = 1; ctx.fillStyle = crtCss(base.map(v => v + tone)); ctx.fillRect(0, b*bh, w, bh);
      for(let k = 0; k < 60; k++){ const y0 = b*bh + R()*bh, ph = R()*6.28, amp = bh*0.04*(0.3 + R()), dk = (R() - 0.6)*40;
        ctx.globalAlpha = 0.18; ctx.strokeStyle = crtCss(base.map(v => v + dk)); ctx.lineWidth = Math.max(cpx(0.7), unit*(0.0008 + R()*0.0025)); ctx.beginPath();
        for(let x = 0; x <= w; x += w/80){ const y = y0 + Math.sin(x/w*6.28*1.3 + ph)*amp + Math.sin(x/w*6.28*5 + ph*2)*amp*0.25; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
      ctx.globalAlpha = 0.5; ctx.strokeStyle = crtCss(base.map(v => v*0.45)); ctx.lineWidth = Math.max(cpx(1), unit*0.002); ctx.beginPath(); ctx.moveTo(0, b*bh); ctx.lineTo(w, b*bh); ctx.stroke(); }
  } else if(M.kind === 'marble' || M.kind === 'stone'){
    const dark = M.base[0] < 100, veins = M.kind === 'marble' ? 14 : 4;
    for(let k = 0; k < veins; k++){ let x = R()*w, y = R()*h, a = R()*6.28; const c = dark ? [200, 196, 190] : [120, 116, 120];
      ctx.globalAlpha = M.kind === 'marble' ? 0.25 + R()*0.3 : 0.12; ctx.strokeStyle = crtCss(c); ctx.lineWidth = Math.max(cpx(0.6), unit*(0.0008 + R()*0.003)); ctx.beginPath(); ctx.moveTo(x, y);
      for(let s = 0; s < 60; s++){ a += (R() - 0.5)*0.6; x += Math.cos(a)*unit*0.02; y += Math.sin(a)*unit*0.02; ctx.lineTo(x, y); } ctx.stroke(); }
    const n = Math.round(w*h/(unit*unit)*1800);
    for(let k = 0; k < n; k++){ ctx.globalAlpha = 0.08; ctx.fillStyle = crtCss(base.map(v => v + (R() - 0.5)*50)); ctx.fillRect(R()*w, R()*h, unit*0.004, unit*0.004); }
  }
  // the lamp: a warm pool of light where the dial points, the edges falling away to dark
  ctx.globalAlpha = 1;
  const pool = ctx.createRadialGradient(lampX, lampY, unit*0.05, lampX, lampY, Math.hypot(w, h)*0.75);
  pool.addColorStop(0, 'rgba(255,240,214,0.16)'); pool.addColorStop(0.45, 'rgba(255,240,214,0)'); pool.addColorStop(1, `rgba(0,0,0,${opts.vignette == null ? 0.5 : opts.vignette})`);
  ctx.fillStyle = pool; ctx.fillRect(0, 0, w, h);
}

/** The light as the parts see it: which way shadows fall (sx, sy per unit of height) and toward the light (tx, ty). */
export function crtLight(light, tilt){
  const lv = lightVec(light == null ? 315 : light), m = Math.hypot(lv.lx, lv.ly), T = Math.min(1, m), dx = m ? lv.lx/m : 0, dy = m ? lv.ly/m : 1;
  const len = 0.35 + 2.4*T*(tilt == null ? 1 : Math.min(1.3, tilt));
  return { sx: dx*len, sy: dy*len, tx: -dx, ty: -dy };
}

/** A card's rounded rectangle about the origin. */
function crtRound(ctx, W, H, r){ ctx.beginPath(); ctx.moveTo(-W/2+r,-H/2); ctx.lineTo(W/2-r,-H/2); ctx.arc(W/2-r,-H/2+r,r,-Math.PI/2,0);
  ctx.lineTo(W/2,H/2-r); ctx.arc(W/2-r,H/2-r,r,0,Math.PI/2); ctx.lineTo(-W/2+r,H/2); ctx.arc(-W/2+r,H/2-r,r,Math.PI/2,Math.PI);
  ctx.lineTo(-W/2,-H/2+r); ctx.arc(-W/2+r,-H/2+r,r,Math.PI,Math.PI*1.5); ctx.closePath(); }

/**
 * ONE CARD at the origin (translate and rotate first). face: { back } or
 * { major: [numeral, name, emblem], rare } or { suit: 0–3, rank: 1–10 | 'Page'… }.
 * look: { stock, gilt, suitCols: [4 colours], L: crtLight, rot, lift (height above the table, for its shadow) }.
 */
export function crtCard(ctx, W, H, face, look){
  const S = CARD_STOCKS[look.stock] || CARD_STOCKS.ivory, gilt = GILT[look.gilt], r = W*0.06, L = look.L || crtLight(315, 1);
  const paper = S.paper, ink = S.ink, cols = (look.suitCols || []).map(crtRGB);
  // its shadow on whatever lies beneath (thrown away from the light, longer the higher it lies)
  // (a canvas shadow's offset is never turned with the drawing: the page's own direction is the right one)
  const lift = W*(0.035 + (look.lift || 0)), rot = look.rot || 0;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = Math.max(1, W*0.06);
  ctx.shadowOffsetX = L.sx*lift; ctx.shadowOffsetY = L.sy*lift;
  crtRound(ctx, W, H, r); ctx.fillStyle = crtCss(paper); ctx.fill(); ctx.restore();
  // the stock: lighter toward the light (a card is never quite flat), a sheen if it is lacquered
  const tx = L.tx*Math.cos(rot) + L.ty*Math.sin(rot), ty = -L.tx*Math.sin(rot) + L.ty*Math.cos(rot);
  const cg = ctx.createLinearGradient(tx*W*0.6, ty*H*0.6, -tx*W*0.6, -ty*H*0.6);
  cg.addColorStop(0, crtCss(crtMix(paper, [255,255,255], 0.12))); cg.addColorStop(1, crtCss(crtMix(paper, [0,0,0], 0.12)));
  crtRound(ctx, W, H, r); ctx.fillStyle = cg; ctx.fill();
  if(S.gloss > 0.3){ const sh = ctx.createLinearGradient(-W/2, -H/2, W/2, H/2); sh.addColorStop(0.35, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, `rgba(255,255,255,${S.gloss*0.25})`); sh.addColorStop(0.65, 'rgba(255,255,255,0)'); ctx.fillStyle = sh; crtRound(ctx, W, H, r); ctx.fill(); }
  // the edge: gilt bright where it faces the light, dark where it turns away (or the paper's own edge)
  const edge = gilt || crtMix(paper, [0,0,0], 0.3), eg = ctx.createLinearGradient(tx*W*0.5, ty*H*0.5, -tx*W*0.5, -ty*H*0.5);
  eg.addColorStop(0, crtCss(crtMix(edge, [255,255,255], 0.45))); eg.addColorStop(0.5, crtCss(edge)); eg.addColorStop(1, crtCss(crtMix(edge, [0,0,0], 0.45)));
  ctx.strokeStyle = eg; ctx.lineWidth = Math.max(cpx(1), W*(gilt ? 0.024 : 0.012)); crtRound(ctx, W, H, r); ctx.stroke();
  ctx.strokeStyle = crtCss(ink); ctx.fillStyle = crtCss(ink); ctx.lineWidth = Math.max(cpx(0.7), W*0.01); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const fw = W*0.84, fh = H*0.88;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if(face.back){
    // the BACK: the deck's own pattern — lattice, rays or rings — round the Vellum's diamond, in one of the suit colours
    const bc = cols.length ? cols[face.backCol || 0] : ink;
    ctx.save(); crtRound(ctx, fw, fh, r*0.6); ctx.clip(); ctx.fillStyle = crtCss(crtMix(bc, paper, 0.25)); ctx.fillRect(-W, -H, W*2, H*2);
    ctx.strokeStyle = crtCss(crtMix(bc, [255,255,255], 0.45)); ctx.lineWidth = Math.max(cpx(0.6), W*0.008); ctx.globalAlpha = 0.6; ctx.beginPath();
    const pat = face.pattern || 0;
    if(pat === 0) for(let k = -8; k <= 8; k++){ ctx.moveTo(k*W*0.12 - H, -H); ctx.lineTo(k*W*0.12 + H, H); ctx.moveTo(k*W*0.12 + H, -H); ctx.lineTo(k*W*0.12 - H, H); }
    else if(pat === 1) for(let k = 0; k < 36; k++){ const a = k/36*Math.PI*2; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a)*H, Math.sin(a)*H); }
    else for(let k = 1; k < 12; k++){ ctx.moveTo(k*W*0.07, 0); ctx.arc(0, 0, k*W*0.07, 0, Math.PI*2); }
    ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1;
    ctx.fillStyle = crtCss(paper); ctx.beginPath(); ctx.arc(0, 0, W*0.22, 0, Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle = crtCss(ink);
    crtEmblem(ctx, 'sigil', W*0.22);
    return;
  }
  // the frame: a double rule, small diamonds at the corners
  ctx.strokeRect(-fw/2, -fh/2, fw, fh); ctx.strokeRect(-fw/2 + W*0.03, -fh/2 + W*0.03, fw - W*0.06, fh - W*0.06);
  for(const [sx2, sy2] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const x = sx2*(fw/2 - W*0.015), y = sy2*(fh/2 - W*0.015); ctx.beginPath(); ctx.moveTo(x, y - W*0.03); ctx.lineTo(x + W*0.03, y); ctx.lineTo(x, y + W*0.03); ctx.lineTo(x - W*0.03, y); ctx.closePath(); ctx.fill(); }
  if(face.major){
    const card = face.major;
    ctx.font = `${W*0.11}px ${CRT_SERIF}`; ctx.fillText(card[0], 0, -fh/2 + W*0.13);
    ctx.save(); ctx.translate(0, -H*0.04); ctx.lineWidth = Math.max(cpx(0.8), W*0.016);
    if(face.rare){ ctx.globalAlpha = 0.35; ctx.beginPath(); for(let k = 0; k < 24; k++){ const a = k/24*Math.PI*2; ctx.moveTo(Math.cos(a)*W*0.36, Math.sin(a)*W*0.36); ctx.lineTo(Math.cos(a)*W*0.42, Math.sin(a)*W*0.42); } ctx.stroke(); ctx.globalAlpha = 1; }
    if(gilt){ ctx.strokeStyle = crtCss(crtMix(gilt, ink, 0.35)); ctx.fillStyle = ctx.strokeStyle; }
    crtEmblem(ctx, card[2], W*0.32); ctx.restore();
    ctx.strokeStyle = crtCss(ink); ctx.fillStyle = crtCss(ink);
    ctx.strokeRect(-fw/2 + W*0.07, fh/2 - W*0.24, fw - W*0.14, W*0.14);
    ctx.font = `${W*0.075}px ${CRT_SERIF}`; ctx.fillText(card[1].toUpperCase(), 0, fh/2 - W*0.17);
    return;
  }
  // a SUIT card: its element in the suit's colour, as pips, and its rank
  const e = face.suit || 0, col = cols[e] || ink;
  ctx.strokeStyle = crtCss(col); ctx.fillStyle = crtCss(crtMix(col, paper, 0.35)); ctx.lineWidth = Math.max(cpx(0.8), W*0.014);
  const ROM = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
  if(typeof face.rank === 'string'){
    crtElement(ctx, 0, -H*0.06, W*0.22, e, true); ctx.beginPath(); ctx.arc(0, -H*0.06, W*0.32, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = crtCss(ink); ctx.strokeStyle = crtCss(ink); ctx.lineWidth = Math.max(cpx(0.7), W*0.01);
    ctx.font = `${W*0.075}px ${CRT_SERIF}`; ctx.fillText((face.rank + ' of ' + CRT_SUITS[e]).toUpperCase(), 0, fh/2 - W*0.17); ctx.strokeRect(-fw/2 + W*0.07, fh/2 - W*0.24, fw - W*0.14, W*0.14);
  } else {
    const rank = Math.max(1, Math.min(10, face.rank || 1));
    const PIPS = {1:[[0,0]],2:[[0,-0.5],[0,0.5]],3:[[0,-0.55],[0,0],[0,0.55]],4:[[-0.45,-0.5],[0.45,-0.5],[-0.45,0.5],[0.45,0.5]],5:[[-0.45,-0.5],[0.45,-0.5],[0,0],[-0.45,0.5],[0.45,0.5]],
      6:[[-0.45,-0.55],[0.45,-0.55],[-0.45,0],[0.45,0],[-0.45,0.55],[0.45,0.55]],7:[[-0.45,-0.55],[0.45,-0.55],[0,-0.27],[-0.45,0],[0.45,0],[-0.45,0.55],[0.45,0.55]],
      8:[[-0.45,-0.55],[0.45,-0.55],[0,-0.27],[-0.45,0],[0.45,0],[0,0.27],[-0.45,0.55],[0.45,0.55]],9:[[-0.45,-0.6],[0.45,-0.6],[-0.45,-0.2],[0.45,-0.2],[0,0],[-0.45,0.2],[0.45,0.2],[-0.45,0.6],[0.45,0.6]],
      10:[[-0.45,-0.6],[0.45,-0.6],[0,-0.4],[-0.45,-0.2],[0.45,-0.2],[-0.45,0.2],[0.45,0.2],[0,0.4],[-0.45,0.6],[0.45,0.6]]};
    for(const [u, v] of PIPS[rank]) crtElement(ctx, u*fw*0.38, v*fh*0.38, W*(rank === 1 ? 0.2 : 0.07), e, true);
    ctx.fillStyle = crtCss(col); ctx.font = `${W*0.1}px ${CRT_SERIF}`; ctx.fillText(ROM[rank - 1], -fw/2 + W*0.1, -fh/2 + W*0.11);
    ctx.save(); ctx.rotate(Math.PI); ctx.fillText(ROM[rank - 1], -fw/2 + W*0.1, -fh/2 + W*0.11); ctx.restore();
  }
}

/** ONE COIN: a struck disc of metal, its face lit from the dial, its rim catching the light; heads or tails. */
export function crtCoin(ctx, x, y, r, coin, look){
  const M = crtRGB(COIN_METALS[coin.metal] || COIN_METALS.gold), L = look.L || crtLight(315, 1), lift = r*(0.25 + (look.lift || 0));
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = Math.max(1, r*0.35); ctx.shadowOffsetX = L.sx*lift; ctx.shadowOffsetY = L.sy*lift;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fillStyle = crtCss(M); ctx.fill(); ctx.restore();
  // the face: a shallow dome, bright toward the light
  const hx = x + L.tx*r*0.45, hy = y + L.ty*r*0.45, g = ctx.createRadialGradient(hx, hy, r*0.05, x, y, r*1.05);
  g.addColorStop(0, crtCss(crtMix(M, [255,255,255], 0.55))); g.addColorStop(0.55, crtCss(M)); g.addColorStop(1, crtCss(crtMix(M, [0,0,0], 0.45)));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
  // the rim: a raised ring, lit on the side toward the light
  const rg = ctx.createLinearGradient(x + L.tx*r, y + L.ty*r, x - L.tx*r, y - L.ty*r);
  rg.addColorStop(0, crtCss(crtMix(M, [255,255,255], 0.6))); rg.addColorStop(1, crtCss(crtMix(M, [0,0,0], 0.55)));
  ctx.strokeStyle = rg; ctx.lineWidth = Math.max(cpx(0.8), r*0.14); ctx.beginPath(); ctx.arc(x, y, r*0.9, 0, Math.PI*2); ctx.stroke();
  // the mark, struck into it: the coinage's sign (heads) or its value (tails)
  ctx.save(); ctx.translate(x, y); ctx.rotate(coin.turn || 0); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const struck = coin.tails ? String(coin.value || 1) : coin.mark;
  ctx.font = coin.tails ? `bold ${r*0.9}px ${CRT_SERIF}` : `${r*1.05}px ${GLYPH_FONT}`;
  ctx.fillStyle = crtCss(crtMix(M, [0,0,0], 0.5), 0.75); ctx.fillText(struck, -L.tx*r*0.04, -L.ty*r*0.04);
  ctx.fillStyle = crtCss(crtMix(M, [255,255,255], 0.5), 0.6); ctx.fillText(struck, L.tx*r*0.04, L.ty*r*0.04);
  ctx.restore();
}
/** A STACK of coins: their edges banded, the top one struck, the stack's shadow longer for its height. */
export function crtStack(ctx, x, y, r, n, coin, look){
  const M = crtRGB(COIN_METALS[coin.metal] || COIN_METALS.gold), L = look.L || crtLight(315, 1), t = r*0.16;
  for(let k = 0; k < n; k++){
    const yy = y - k*t, dx = (Math.random() - 0.5)*r*0.08;
    ctx.save(); if(k === 0){ ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = r*0.4; ctx.shadowOffsetX = L.sx*(r*0.12 + n*t*0.45); ctx.shadowOffsetY = L.sy*(r*0.12 + n*t*0.45); }
    const side = ctx.createLinearGradient(x - r, 0, x + r, 0); side.addColorStop(0, crtCss(crtMix(M, [0,0,0], L.tx < 0 ? 0.1 : 0.5))); side.addColorStop(0.5, crtCss(M)); side.addColorStop(1, crtCss(crtMix(M, [0,0,0], L.tx > 0 ? 0.1 : 0.5)));
    ctx.fillStyle = side; ctx.beginPath(); ctx.ellipse(x + dx, yy, r, r*0.42, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();
    ctx.strokeStyle = crtCss(crtMix(M, [0,0,0], 0.5), 0.6); ctx.lineWidth = Math.max(cpx(0.5), r*0.03); ctx.beginPath(); ctx.ellipse(x + dx, yy, r, r*0.42, 0, 0, Math.PI); ctx.stroke();
  }
  // the top coin, seen from above at a slant (its face squashed to the stack's ellipse)
  ctx.save(); ctx.translate(x, y - (n - 1)*t); ctx.scale(1, 0.42); crtCoin(ctx, 0, -t*0.6/0.42, r, coin, { L: { ...L, sx: 0, sy: 0 } }); ctx.restore();
}

/**
 * WHERE EVERYTHING LIES, by the game's rules. Returns a list, in drawing order:
 * { kind: 'card', x, y, rot, face, lift } and { kind: 'coin' | 'stack', x, y, r, n, coin }.
 * opts: { count (0.2–4), scatter (0–1), stakes (0–1), suits: [0–3…], cw (card width), coinage }.
 */
export function crtDeal(game, w, h, opts){
  const out = [], cw = opts.cw, ch = cw*1.7, sc = opts.scatter || 0, suits = opts.suits || [0, 1, 2, 3], coinage = opts.coinage || COINAGES[0];
  const jig = (v, a) => v + (Math.random() - 0.5)*a;
  const mess = (x, y, rot, face, lift = 0) => out.push({ kind: 'card', x: jig(x, cw*sc*0.6), y: jig(y, cw*sc*0.6), rot: jig(rot, sc*0.6), face, lift });
  const rank = () => Math.random() < 0.2 ? crtPick(['Page', 'Knight', 'Queen', 'King']) : 1 + Math.floor(Math.random()*10);
  const suitCard = () => ({ suit: crtPick(suits), rank: rank() });
  const anyCard = () => Math.random() < 0.035 ? { major: pickWeighted(CRT_RARE), rare: true } : Math.random() < 0.3 ? { major: crtPick(CRT_ARCANA) } : suitCard();
  const back = { back: true, backCol: Math.floor(Math.random()*4), pattern: Math.floor(Math.random()*3) };
  const pile = (x, y, n, rot = 0) => { for(let k = 0; k < n; k++) mess(x + k*cw*0.006, y - k*cw*0.008, rot + (Math.random() - 0.5)*0.05, back, k*0.01); };
  const coins = (x, y, n, spread) => { for(let k = 0; k < n; k++) out.push({ kind: 'coin', x: jig(x, spread), y: jig(y, spread), r: cw*(0.16 + Math.random()*0.05),
    coin: { mark: coinage.mark, metal: coinage.metal, tails: Math.random() < 0.4, value: crtPick([1, 1, 5, 10, 20]), turn: Math.random()*6.28 } }); };
  const stack = (x, y, n) => out.push({ kind: 'stack', x, y, r: cw*0.19, n, coin: { mark: coinage.mark, metal: coinage.metal, turn: Math.random()*6.28 } });
  const money = Math.random() < opts.stakes;           // not every game is played for coin
  // a hand, fanned, at a seat round the table (seat angle a: where the player sits, looking in)
  const seat = (a, d) => [w/2 + Math.cos(a)*w*d, h/2 + Math.sin(a)*h*d];
  const hand = (a, n, up, spread = 0.12) => { const [x, y] = seat(a, 0.42), rot = a + Math.PI/2;
    for(let k = 0; k < n; k++){ const f = (k - (n - 1)/2)*spread, px = x + Math.cos(rot)*f*cw*2.1, py = y + Math.sin(rot)*f*cw*2.1;
      mess(px, py, rot - Math.PI + f*1.1 + (up ? 0 : 0), up ? suitCard() : back, k*0.004); } };
  const n = Math.max(0.2, opts.count || 1);
  if(game === 'reading'){
    // the spread: a card and the card that crosses it; above, below, behind, before; the staff of four beside
    const cx = w*0.42, cy = h*0.5, g = ch*1.15;
    pile(w*0.86, h*0.12, 8);
    for(const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) mess(cx + dx*cw*1.6, cy + dy*g, 0, anyCard());
    mess(cx, cy, 0, anyCard()); mess(cx, cy, Math.PI/2, anyCard(), 0.02);
    for(let k = 0; k < 4; k++) mess(w*0.8, h*0.88 - k*ch*0.62*Math.min(1, n), 0, anyCard());
    if(money) coins(w*0.15, h*0.85, Math.round(3*n), cw*0.5);          // a querent's offering
  } else if(game === 'trick'){
    // players at their seats, each with a hand (the near one face up); a trick in the middle, one card from each
    const players = 2 + Math.floor(Math.random()*4), handN = Math.max(2, Math.round(5*n));
    for(let p = 0; p < players; p++){ const a = Math.PI/2 + p/players*Math.PI*2; hand(a, handN, p === 0);
      // the tricks each has won, face down at their elbow
      const [tx, ty] = seat(a + 0.55, 0.36); if(Math.random() < 0.7) pile(tx, ty, 1 + Math.floor(Math.random()*4), a);
      if(money){ const [mx, my] = seat(a - 0.5, 0.33); stack(mx, my, 2 + Math.floor(Math.random()*6)); } }
    const played = 1 + Math.floor(Math.random()*players);
    for(let p = 0; p < played; p++){ const a = Math.PI/2 + p/players*Math.PI*2; mess(w/2 + Math.cos(a)*cw*0.7, h/2 + Math.sin(a)*cw*0.7, a + Math.PI/2 + (Math.random() - 0.5)*0.4, suitCard(), 0.01*p); }
    // the stock, and the trump turned up beneath it
    mess(w*0.5 + cw*2.4, h*0.5 - ch*0.2, Math.PI/2, suitCard()); pile(w*0.5 + cw*2.4, h*0.5 - ch*0.2, 6);
  } else if(game === 'patience'){
    // seven columns, each a run of face-down cards and its face-up cascade; the foundations above, by suit; stock and waste
    const cols = 7, gx = w/(cols + 0.5), top = h*0.34, step = ch*0.16, cwN = Math.round(3*n);
    if(cw > gx*0.86) return crtDeal(game, w, h, { ...opts, cw: gx*0.86 });          // seven columns must fit side by side
    for(let c = 0; c < cols; c++){ const x = gx*(c + 0.75), down = c, up = 1 + Math.floor(Math.random()*Math.min(5, cwN + 1));
      for(let k = 0; k < down; k++) mess(x, top + k*step*0.6, 0, back, k*0.003);
      for(let k = 0; k < up; k++) mess(x, top + down*step*0.6 + k*step*1.4, 0, { suit: crtPick(suits), rank: Math.max(1, 13 - c - k*1 - 3) > 10 ? crtPick(['Queen','King']) : Math.max(1, 10 - k) }, (down + k)*0.003); }
    suits.forEach((s, i) => mess(gx*(3.75 + i), h*0.12, 0, { suit: s, rank: 1 + Math.floor(Math.random()*4) }));
    pile(gx*0.75, h*0.12, 10);
    for(let k = 0; k < 3; k++) mess(gx*1.75 + k*cw*0.22, h*0.12, 0, suitCard(), k*0.004);
  } else if(game === 'wager'){
    // hands of two round the table, the shared cards in a row (the last ones still face down), the pot, each player's coin
    const players = 3 + Math.floor(Math.random()*4);
    for(let p = 0; p < players; p++){ const a = Math.PI/2 + p/players*Math.PI*2; hand(a, 2, p === 0, 0.3);
      const [mx, my] = seat(a - 0.45, 0.32); stack(mx, my, 3 + Math.floor(Math.random()*9)); if(Math.random() < 0.5) stack(mx + cw*0.45, my + cw*0.1, 2 + Math.floor(Math.random()*5)); }
    const shown = 3 + Math.floor(Math.random()*3);
    for(let k = 0; k < 5; k++) mess(w/2 + (k - 2)*cw*1.12, h*0.46, 0, k < shown ? anyCard() : back);
    coins(w/2, h*0.6, Math.round(10*n*(0.5 + opts.stakes)), cw*0.9);
    pile(w/2 - cw*3.6, h*0.46, 9);
  } else {
    // pairs: the deck face down in a grid; a few turned up — two that match, kept by their finder
    const cols = Math.max(3, Math.round(5*Math.sqrt(n))), rows = Math.max(2, Math.round(cols*h/w*0.75)), gx = w/(cols + 0.5), gy = h/(rows + 0.5);
    const turned = new Set(); while(turned.size < Math.min(4, cols*rows)) turned.add(Math.floor(Math.random()*cols*rows));
    const twin = anyCard();
    let t = 0;
    for(let r = 0; r < rows; r++) for(let c = 0; c < cols; c++){ const i = r*cols + c; mess(gx*(c + 0.75), gy*(r + 0.75), 0, turned.has(i) ? (t++ < 2 ? twin : anyCard()) : back); }
    if(money) coins(w*0.88, h*0.9, Math.round(4*n), cw*0.4);
  }
  for(const it of out) it.cw = cw;                     // (the width this game was dealt at: patience narrows it to fit)
  return out;
}

/**
 * THE TEXTURE: a game in progress. CARD COUNT how many are in play, SCATTER
 * how tidy the table is (0 dealt square → swept about), STAKES how likely and
 * how much money is on it. The seed chooses the game, the players, the suits
 * in the deck, the table, the cards' stock and edge, and the coinage.
 * suitCols: the four suits' colours (the page's two accents, the texture's two hues).
 */
export function genCartomancy(w, h, amt, angle, stakes, light, suitCols, tilt){
  amt = amt == null ? 1 : amt;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d', CPU);
  const unit = Math.min(w, h), scat = Math.max(0, Math.min(1, (angle == null ? 35 : angle)/90));
  const game = crtPick(Object.keys(CARD_GAMES)), table = crtPick(Object.keys(TABLE_MATERIALS)), stock = crtPick(Object.keys(CARD_STOCKS)), gilt = crtPick(Object.keys(GILT));
  const coinage = crtPick(COINAGES);
  // which suits are in this deck (a game is played with two, three or all four)
  const all = [0, 1, 2, 3].sort(() => Math.random() - 0.5), suits = all.slice(0, 2 + Math.floor(Math.random()*3)).sort();
  crtTable(ctx, w, h, table, light);
  const L = crtLight(light, tilt), cw = unit*0.11*(0.85 + 0.3/Math.sqrt(Math.max(0.3, amt)));
  const items = crtDeal(game, w, h, { cw, count: amt, scatter: scat, stakes: stakes == null ? 0.5 : stakes, suits, coinage });
  const look = { stock, gilt, suitCols, L };
  for(const it of items){
    if(it.kind === 'card'){ const k = it.cw || cw; ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.rot); crtCard(ctx, k, k*1.7, it.face, { ...look, rot: it.rot, lift: it.lift }); ctx.restore(); }
    else if(it.kind === 'coin') crtCoin(ctx, it.x, it.y, it.r, it.coin, look);
    else crtStack(ctx, it.x, it.y, it.r, it.n, it.coin, look);
  }
  ctx.globalAlpha = 1; ctx.shadowColor = 'transparent';
  return c;
}

/**
 * THE PARTS AS STEPS (the Athanor): Table, Deal and Coins — each drawn on the
 * Athanor's grid and handed on as a picture, the Deal and the Coins with a
 * mask of where they lie (so a Mix lays them on any surface).
 */
const CRT_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
const CRT_SEL = (key, label, options, def) => [key, label, 'select', def || options[0], { options }];
function crtStepCanvas(E){ const c = document.createElement('canvas'); c.width = E.ww; c.height = E.wh; return [c, c.getContext('2d', CPU)]; }
function crtMask(E, draw){ const [m, mx] = crtStepCanvas(E); mx.fillStyle = '#000'; mx.fillRect(0, 0, E.ww, E.wh); mx.save(); draw(mx); mx.restore(); return E.lum(E.readCanvas(m)); }
export const CARD_STEPS = {
  table: { cat: 'Textures', label: 'Table', ins: [], outs: ['image', 'grey'], io: { outs: ['image', 'field'] },
    params: [CRT_SEL('mat', 'Material', Object.keys(TABLE_MATERIALS)), CRT_R('lamp', 'Lamp', 50)], cost: () => 6,
    run(E, n){ const { ww, wh, ctx, P, num, readCanvas, lum } = E; const [c, x] = crtStepCanvas(E);
      crtTable(x, ww, wh, String(P(n, 'mat', 'baize')), ctx.light, { vignette: num(n, 'lamp', 50)/100 }); const im = readCanvas(c); return [im, lum(im)]; } },
  deal: { cat: 'Marks', label: 'Deal (Cards)', ins: ['fire hue', 'water hue', 'air hue', 'earth hue'], outs: ['image', 'mask'], io: { ins: ['colour', 'colour', 'colour', 'colour'], outs: ['image', 'field'] },
    params: [CRT_SEL('game', 'Game', Object.keys(CARD_GAMES)), CRT_SEL('stock', 'Card Stock', Object.keys(CARD_STOCKS)), CRT_SEL('gilt', 'Edge', Object.keys(GILT)),
      CRT_R('count', 'Cards', 100, 20, 300), CRT_R('size', 'Card Size', 100, 50, 200), CRT_R('scatter', 'Scatter', 30), CRT_R('stakes', 'Stakes', 0)], cost: () => 8,
    run(E, n){ const { ww, wh, unit, ctx, P, num, input, readCanvas } = E;
      const hex = v => Array.isArray(v) ? v.map(q => q*255) : null;
      const cols = [1, 2, 3, 4].map((j, i) => hex(input(n, j)) || crtRGB(['#C0392B', '#2E5FA8', '#C9A33A', '#3E7D4F'][i]));
      const cw = unit*0.11*num(n, 'size', 100)/100, game = String(P(n, 'game', 'reading'));
      const items = crtDeal(game, ww, wh, { cw, count: num(n, 'count', 100)/100, scatter: num(n, 'scatter', 30)/100, stakes: num(n, 'stakes', 0)/100, suits: [0, 1, 2, 3], coinage: COINAGES[0] });
      const look = { stock: String(P(n, 'stock', 'ivory')), gilt: String(P(n, 'gilt', 'gold')), suitCols: cols, L: crtLight(ctx.light, (ctx.lightTilt ?? 100)/100) };
      const draw = (x, maskOnly) => { for(const it of items){ if(it.kind === 'card'){ const k = it.cw || cw; x.save(); x.translate(it.x, it.y); x.rotate(it.rot);
        if(maskOnly){ x.fillStyle = '#fff'; x.fillRect(-k/2, -k*0.85, k, k*1.7); } else crtCard(x, k, k*1.7, it.face, { ...look, rot: it.rot, lift: it.lift }); x.restore(); }
        else if(maskOnly){ x.fillStyle = '#fff'; x.beginPath(); x.arc(it.x, it.y, it.r, 0, Math.PI*2); x.fill(); }
        else if(it.kind === 'coin') crtCoin(x, it.x, it.y, it.r, it.coin, look); else crtStack(x, it.x, it.y, it.r, it.n, it.coin, look); } };
      const [c, x] = crtStepCanvas(E); x.fillStyle = '#808080'; x.fillRect(0, 0, ww, wh); draw(x, false);
      return [readCanvas(c), crtMask(E, mx => draw(mx, true))]; } },
  coins: { cat: 'Marks', label: 'Coins', ins: [], outs: ['image', 'mask'], io: { outs: ['image', 'field'] },
    params: [CRT_SEL('metal', 'Metal', Object.keys(COIN_METALS)), CRT_R('count', 'Coins', 30, 1, 200), CRT_R('size', 'Size', 100, 30, 300), CRT_R('stacks', 'Stacked', 30)], cost: () => 4,
    run(E, n){ const { ww, wh, unit, ctx, P, num, readCanvas } = E;
      const metal = String(P(n, 'metal', 'gold')), count = Math.round(num(n, 'count', 30)), r = unit*0.02*num(n, 'size', 100)/100, st = num(n, 'stacks', 30)/100;
      const L = crtLight(ctx.light, (ctx.lightTilt ?? 100)/100), items = [];
      for(let k = 0; k < count; k++){ const coin = { mark: crtPick(COINAGES).mark, metal, tails: Math.random() < 0.4, value: crtPick([1, 5, 10]), turn: Math.random()*6.28 };
        items.push(Math.random() < st ? { kind: 'stack', x: Math.random()*ww, y: Math.random()*wh, r, n: 2 + Math.floor(Math.random()*8), coin } : { kind: 'coin', x: Math.random()*ww, y: Math.random()*wh, r, coin }); }
      const [c, x] = crtStepCanvas(E); x.fillStyle = '#808080'; x.fillRect(0, 0, ww, wh);
      for(const it of items) it.kind === 'coin' ? crtCoin(x, it.x, it.y, it.r, it.coin, { L }) : crtStack(x, it.x, it.y, it.r, it.n, it.coin, { L });
      return [readCanvas(c), crtMask(E, mx => { mx.fillStyle = '#fff'; for(const it of items){ mx.beginPath(); mx.arc(it.x, it.y - (it.n ? it.n*it.r*0.08 : 0), it.r*(it.n ? 1.1 : 1), 0, Math.PI*2); mx.fill(); } })]; } },
};
