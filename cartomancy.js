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
 *   crtChooseTable / crtChooseDeal       what the seed picks (or what was asked for)
 *   crtPaintDeal(ctx, w, h, opts)        the deal drawn, lit, on whatever is there
 *   CARD_STEPS                           Table, Deal and Coins for the Athanor
 *
 * Its suits are the four elements as the alchemists drew them (fire △, water
 * ▽, air and earth barred), coloured by the page's two accents and the
 * texture's two hues. The major arcana are Vellum's own (The Familiar, The
 * Seed, The Scrying Pool…), and rarely an easter egg: Saturn, Enceladus, the
 * Kitsune of seven tails.
 *
 * THE TEXTURE IS A CHAIN (chains.js 'cards'): Knobs, the page's Accents and
 * the texture's Hues wired into a Table and a Deal laid on it — opened in the
 * Athanor like any other. On the page it is drawn at full size by the same
 * steps' PAINT (a canvas pass: athanor.js, ctx.canvas), since its faces are
 * lettered in web fonts; on the Athanor's grid by their RUN.
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
  const len = 0.3 + 1.5*T*(tilt == null ? 1 : Math.min(1.2, tilt));          // (≤ ~2.1: a shadow stays attached to what casts it)
  return { sx: dx*len, sy: dy*len, tx: -dx, ty: -dy };
}

/** A card's rounded rectangle about the origin. */
function crtRound(ctx, W, H, r){ ctx.beginPath(); ctx.moveTo(-W/2+r,-H/2); ctx.lineTo(W/2-r,-H/2); ctx.arc(W/2-r,-H/2+r,r,-Math.PI/2,0);
  ctx.lineTo(W/2,H/2-r); ctx.arc(W/2-r,H/2-r,r,0,Math.PI/2); ctx.lineTo(-W/2+r,H/2); ctx.arc(-W/2+r,H/2-r,r,Math.PI/2,Math.PI);
  ctx.lineTo(-W/2,-H/2+r); ctx.arc(-W/2+r,-H/2+r,r,Math.PI,Math.PI*1.5); ctx.closePath(); }

/**
 * A CAST SHADOW that stays attached: the caster's footprint swept from where it
 * stands to where the light throws it, filled once (no doubling), softened by a
 * canvas shadow drawn from far off-canvas (so only the soft shadow lands).
 * shape(ctx, ox, oy) adds the footprint, offset by (ox, oy), to the path.
 */
export function crtShadow(ctx, shape, dx, dy, blur, alpha, steps = 6){
  // (a shadow's offset is never transformed, so the path is moved off-canvas in the canvas's own frame)
  const FAR = 40000; ctx.save();
  if(ctx.getTransform){ const m = ctx.getTransform(); ctx.setTransform(m.a, m.b, m.c, m.d, m.e - FAR, m.f); } else ctx.translate(-FAR, 0);
  ctx.beginPath();
  for(let k = 0; k <= steps; k++) shape(ctx, steps ? dx*k/steps : dx, steps ? dy*k/steps : dy);
  ctx.shadowColor = `rgba(0,0,0,${alpha})`; ctx.shadowBlur = Math.max(0.5, blur); ctx.shadowOffsetX = FAR; ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#000'; ctx.fill('nonzero'); ctx.restore();
}
/** A small, seeded variety for each card or coin: no two quite alike. */
function crtVary(){ const R = Math.random; return { tone: (R() - 0.5)*0.09, warm: (R() - 0.5)*0.08, age: R(), spec: 0.6 + R()*0.8, phase: R()*6.28, bow: (R() - 0.5)*0.6, wear: R() }; }

/**
 * ONE CARD at the origin (translate and rotate first). face: { back } or
 * { major: [numeral, name, emblem], rare } or { suit: 0–3, rank: 1–10 | 'Page'… }.
 * look: { stock, gilt, suitCols: [4 colours], L: crtLight, rot, lift (height above the table, for its shadow) }.
 */
export function crtCard(ctx, W, H, face, look){
  const S = CARD_STOCKS[look.stock] || CARD_STOCKS.ivory, gilt = GILT[look.gilt], r = W*0.06, L = look.L || crtLight(315, 1);
  const V = crtVary(), dark = S.paper[0] < 100;
  // this card's own paper: a little lighter or darker, warmer or cooler than its neighbours
  const paper = crtMix(crtMix(S.paper, V.tone > 0 ? [255,255,255] : [0,0,0], Math.abs(V.tone)), V.warm > 0 ? [236, 206, 150] : [196, 206, 222], Math.abs(V.warm)*(dark ? 0.4 : 1));
  const ink = S.ink, cols = (look.suitCols || []).map(crtRGB);
  // its shadow on whatever lies beneath: a card is thin, so a tight contact shadow and a soft one thrown
  // a little away from the light (further the higher it lies). A canvas shadow's offset is never turned
  // with the drawing, so it is worked in the page's own frame.
  const lift = W*(0.008 + (look.lift || 0)), rot = look.rot || 0, co = Math.cos(rot), si = Math.sin(rot);
  const toLocal = (px, py) => [px*co + py*si, -px*si + py*co];
  { const [dx, dy] = toLocal(L.sx*lift, L.sy*lift);
    crtShadow(ctx, (c, ox, oy) => { c.save(); c.translate(ox, oy); crtRound(c, W, H, r); c.restore(); }, 0, 0, W*0.012, 0.42, 0);
    crtShadow(ctx, (c, ox, oy) => { c.save(); c.translate(ox, oy); crtRound(c, W, H, r); c.restore(); }, dx, dy, W*0.04, 0.26, 4); }
  crtRound(ctx, W, H, r); ctx.fillStyle = crtCss(paper); ctx.fill();
  // the stock: lighter toward the light (a card is never quite flat), a sheen if it is lacquered
  const tx = L.tx*Math.cos(rot) + L.ty*Math.sin(rot), ty = -L.tx*Math.sin(rot) + L.ty*Math.cos(rot);
  const cg = ctx.createLinearGradient(tx*W*0.6, ty*H*0.6, -tx*W*0.6, -ty*H*0.6);
  cg.addColorStop(0, crtCss(crtMix(paper, [255,255,255], 0.12))); cg.addColorStop(1, crtCss(crtMix(paper, [0,0,0], 0.12)));
  crtRound(ctx, W, H, r); ctx.fillStyle = cg; ctx.fill();
  // the edge: gilt bright where it faces the light, dark where it turns away (or the paper's own edge)
  const edge = gilt || crtMix(paper, [0,0,0], 0.3), eg = ctx.createLinearGradient(tx*W*0.5, ty*H*0.5, -tx*W*0.5, -ty*H*0.5);
  eg.addColorStop(0, crtCss(crtMix(edge, [255,255,255], 0.45))); eg.addColorStop(0.5, crtCss(edge)); eg.addColorStop(1, crtCss(crtMix(edge, [0,0,0], 0.45)));
  ctx.strokeStyle = eg; ctx.lineWidth = Math.max(cpx(0.6), W*(gilt ? 0.011 : 0.005)); crtRound(ctx, W, H, r); ctx.stroke();
  ctx.save(); crtCardFace(ctx, W, H, face, { gilt, paper, ink, cols, r }); ctx.restore();
  crtCardFinish(ctx, W, H, r, S, V, paper, [tx, ty], dark);
}

/** What is printed on a card (its back, or its face) — ink only, on the paper already laid. */
function crtCardFace(ctx, W, H, face, { gilt, paper, ink, cols, r }){
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

/**
 * The card's SURFACE over its print: the paper's grain and age, rubbed corners,
 * and its SPECULAR layer — a broad sheen where the bowed card faces the light
 * (each card bowed and turned its own way, so each catches it differently) and
 * a glint on its light-facing edge. Matte stocks sheen faintly, lacquer brightly.
 */
function crtCardFinish(ctx, W, H, r, S, V, paper, [tx, ty], dark){
  const R = Math.random;
  ctx.save(); crtRound(ctx, W, H, r); ctx.clip();
  // grain: fine fibres and flecks of the stock
  const n = Math.round(26 + V.age*30);
  for(let k = 0; k < n; k++){ const d = R() < 0.5; ctx.fillStyle = d ? 'rgba(60,40,20,0.07)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect((R() - 0.5)*W, (R() - 0.5)*H, W*(0.004 + R()*0.012), W*(0.002 + R()*0.004)); }
  // age: foxing on an old card, a toned margin
  if(!dark && V.age > 0.6){ for(let k = 0; k < 3 + Math.floor(V.age*5); k++){ const x = (R() - 0.5)*W*0.9, y = (R() - 0.5)*H*0.9, q = W*(0.01 + R()*0.03), g = ctx.createRadialGradient(x, y, 0, x, y, q);
      g.addColorStop(0, 'rgba(150,100,50,0.16)'); g.addColorStop(1, 'rgba(150,100,50,0)'); ctx.fillStyle = g; ctx.fillRect(x - q, y - q, q*2, q*2); }
    ctx.strokeStyle = 'rgba(150,110,60,0.12)'; ctx.lineWidth = W*0.05; crtRound(ctx, W, H, r); ctx.stroke(); }
  // wear: a corner or two rubbed pale (dark stocks show it most)
  if(V.wear > 0.45) for(const [cx, cy] of [[-1,-1],[1,-1],[-1,1],[1,1]]) if(R() < 0.45){ const x = cx*W/2, y = cy*H/2, q = W*(0.08 + R()*0.08), g = ctx.createRadialGradient(x, y, 0, x, y, q);
    g.addColorStop(0, `rgba(255,255,255,${dark ? 0.22 : 0.18})`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - q, y - q, q*2, q*2); }
  // the SHEEN: a soft band across the card, where its bow turns it to the light
  const gl = Math.max(0.13, S.gloss)*V.spec, along = 0.5 + 0.32*Math.sin(V.phase);
  const ax = -ty, ay = tx, bx = tx + ax*V.bow, by = ty + ay*V.bow, m = Math.hypot(bx, by) || 1;
  const ux = bx/m*Math.hypot(W, H)*0.5, uy = by/m*Math.hypot(W, H)*0.5;
  const sh = ctx.createLinearGradient(ux, uy, -ux, -uy), wdt = 0.1 + 0.12*(1 - S.gloss);
  sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(Math.max(0.01, along - wdt), 'rgba(255,255,255,0)');
  sh.addColorStop(along, `rgba(255,252,244,${Math.min(0.5, gl*0.7)})`); sh.addColorStop(Math.min(0.99, along + wdt), 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = sh; ctx.fillRect(-W, -H, W*2, H*2);
  // a hot spot on glossy stock, toward the light
  if(S.gloss > 0.12){ const x = tx*W*0.3, y = ty*H*0.3, q = W*(0.25 + 0.2*V.spec), g = ctx.createRadialGradient(x, y, 0, x, y, q);
    g.addColorStop(0, `rgba(255,255,255,${S.gloss*0.35*V.spec})`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - q, y - q, q*2, q*2); }
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
  // the glint: the edge facing the light catches it
  ctx.save(); const eg = ctx.createLinearGradient(tx*W*0.5, ty*H*0.5, 0, 0);
  eg.addColorStop(0, `rgba(255,255,255,${0.25 + gl*0.5})`); eg.addColorStop(0.35, 'rgba(255,255,255,0)');
  ctx.strokeStyle = eg; ctx.lineWidth = Math.max(cpx(0.5), W*0.006); crtRound(ctx, W*0.995, H*0.997, r); ctx.stroke(); ctx.restore();
}

/** ONE COIN: a struck disc of metal, its face lit from the dial, its rim catching the light; heads or tails. */
export function crtCoin(ctx, x, y, r, coin, look){
  const V = crtVary(), L = look.L || crtLight(315, 1), lift = r*(0.06 + (look.lift || 0)), R = Math.random;
  // the metal, toned by its handling: silver goes gold or blue, gold reddens, copper browns
  const TONES = { silver: [[186, 160, 110], [110, 124, 150]], gold: [[196, 128, 70], [150, 140, 90]], copper: [[110, 70, 50], [96, 120, 100]], bronze: [[110, 90, 60], [90, 116, 96]], iron: [[120, 90, 70], [70, 74, 80]] };
  const base = crtRGB(COIN_METALS[coin.metal] || COIN_METALS.gold), tone = (TONES[coin.metal] || TONES.gold)[V.phase < 3.14 ? 0 : 1];
  const M = crtMix(crtMix(base, tone, V.age*0.4), [0,0,0], 0.1 + V.wear*0.1);
  // its shadow, close against it (a coin is thin), and its edge, seen on the side away from the light
  if(!look.noShadow){ const dx = L.sx*lift, dy = L.sy*lift;
    crtShadow(ctx, (c, ox, oy) => { c.moveTo(x + ox + r, y + oy); c.arc(x + ox, y + oy, r, 0, Math.PI*2); }, dx, dy, r*0.16, 0.5, 3);
    crtShadow(ctx, (c, ox, oy) => { c.moveTo(x + ox + r, y + oy); c.arc(x + ox, y + oy, r, 0, Math.PI*2); }, dx*2.2, dy*2.2, r*0.5, 0.18, 3); }
  ctx.beginPath(); ctx.arc(x + L.sx*r*0.035, y + L.sy*r*0.035, r, 0, Math.PI*2); ctx.fillStyle = crtCss(crtMix(M, [0,0,0], 0.55)); ctx.fill();
  // the field: a shallow dome, bright toward the light, never white
  const hx = x + L.tx*r*0.45, hy = y + L.ty*r*0.45, g = ctx.createRadialGradient(hx, hy, r*0.05, x, y, r*1.05);
  g.addColorStop(0, crtCss(crtMix(M, [255,255,255], 0.3))); g.addColorStop(0.5, crtCss(M)); g.addColorStop(1, crtCss(crtMix(M, [0,0,0], 0.5)));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.clip();
  // the lathe's rings in the field, and the scratches and specks of its handling
  ctx.lineWidth = Math.max(cpx(0.3), r*0.012);
  for(let k = 3; k < 15; k++){ ctx.strokeStyle = k % 2 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'; ctx.beginPath(); ctx.arc(x, y, r*k/16, 0, Math.PI*2); ctx.stroke(); }
  for(let k = 0; k < 4 + Math.floor(V.wear*10); k++){ const a = R()*6.28, q = r*(0.15 + R()*0.6), sx0 = x + (R() - 0.5)*r*1.4, sy0 = y + (R() - 0.5)*r*1.4;
    ctx.strokeStyle = R() < 0.5 ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.lineTo(sx0 + Math.cos(a)*q, sy0 + Math.sin(a)*q); ctx.stroke(); }
  for(let k = 0; k < 10; k++){ ctx.fillStyle = `rgba(${R() < 0.5 ? '40,30,20' : '255,255,255'},0.14)`; ctx.fillRect(x + (R() - 0.5)*r*1.6, y + (R() - 0.5)*r*1.6, r*0.04, r*0.04); }
  ctx.restore();
  // the rim: a raised ring, lit on the side toward the light, and its beads inside it
  const rg = ctx.createLinearGradient(x + L.tx*r, y + L.ty*r, x - L.tx*r, y - L.ty*r);
  rg.addColorStop(0, crtCss(crtMix(M, [255,255,255], 0.45))); rg.addColorStop(0.5, crtCss(M)); rg.addColorStop(1, crtCss(crtMix(M, [0,0,0], 0.55)));
  ctx.strokeStyle = rg; ctx.lineWidth = Math.max(cpx(0.8), r*0.13); ctx.beginPath(); ctx.arc(x, y, r*0.91, 0, Math.PI*2); ctx.stroke();
  const beads = Math.max(12, Math.round(r*0.9)), br = r*0.035;
  for(let k = 0; k < beads; k++){ const a = k/beads*Math.PI*2, bx = x + Math.cos(a)*r*0.76, by = y + Math.sin(a)*r*0.76, lit = Math.cos(a)*L.tx + Math.sin(a)*L.ty;
    ctx.fillStyle = crtCss(crtMix(M, lit > 0 ? [255,255,255] : [0,0,0], Math.abs(lit)*0.4 + 0.05)); ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI*2); ctx.fill(); }
  // the mark, struck into it: the coinage's sign (heads) or its value (tails) — its walls dark away from the light, lit toward it
  ctx.save(); ctx.translate(x, y); ctx.rotate(coin.turn || 0); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const struck = coin.tails ? String(coin.value || 1) : coin.mark, [lx, ly] = [L.tx*Math.cos(-(coin.turn || 0)) - L.ty*Math.sin(-(coin.turn || 0)), L.tx*Math.sin(-(coin.turn || 0)) + L.ty*Math.cos(-(coin.turn || 0))];
  ctx.font = coin.tails ? `bold ${r*0.85}px ${CRT_SERIF}` : `${r*1.0}px ${GLYPH_FONT}`;
  ctx.fillStyle = crtCss(crtMix(M, [0,0,0], 0.62), 0.85); ctx.fillText(struck, -lx*r*0.06, -ly*r*0.06);
  ctx.fillStyle = crtCss(crtMix(M, [255,255,255], 0.42), 0.8); ctx.fillText(struck, lx*r*0.05, ly*r*0.05);
  ctx.fillStyle = crtCss(M); ctx.fillText(struck, 0, 0);
  ctx.restore();
  // the SPECULAR: a hard glint where the dome faces the light, and a soft sheen around it
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const sx1 = x + L.tx*r*0.42, sy1 = y + L.ty*r*0.42, sg = ctx.createRadialGradient(sx1, sy1, 0, sx1, sy1, r*0.55);
  sg.addColorStop(0, 'rgba(255,250,236,0.55)'); sg.addColorStop(0.18, 'rgba(255,250,236,0.22)'); sg.addColorStop(1, 'rgba(255,250,236,0)');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill(); ctx.restore();
}
/** A STACK of coins: their edges banded, the top one struck, the stack's shadow longer for its height. */
export function crtStack(ctx, x, y, r, n, coin, look){
  const M = crtRGB(COIN_METALS[coin.metal] || COIN_METALS.gold), L = look.L || crtLight(315, 1), t = r*0.16;
  // the column's shadow, swept from its foot along the light (as long as the column is tall), so it never comes loose
  const reach = n*t*0.5, ell = (c, ox, oy) => { c.moveTo(x + ox + r, y + oy); c.ellipse(x + ox, y + oy, r, r*0.42, 0, 0, Math.PI*2); };
  crtShadow(ctx, ell, L.sx*r*0.05, L.sy*r*0.05, r*0.15, 0.5, 2);
  crtShadow(ctx, ell, L.sx*reach, L.sy*reach, r*0.35, 0.3, Math.max(4, n));
  for(let k = 0; k < n; k++){
    const yy = y - k*t, dx = (Math.random() - 0.5)*r*0.08;
    ctx.save();
    const side = ctx.createLinearGradient(x - r, 0, x + r, 0); side.addColorStop(0, crtCss(crtMix(M, [0,0,0], L.tx < 0 ? 0.1 : 0.5))); side.addColorStop(0.5, crtCss(M)); side.addColorStop(1, crtCss(crtMix(M, [0,0,0], L.tx > 0 ? 0.1 : 0.5)));
    ctx.fillStyle = side; ctx.beginPath(); ctx.ellipse(x + dx, yy, r, r*0.42, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();
    ctx.strokeStyle = crtCss(crtMix(M, [0,0,0], 0.5), 0.6); ctx.lineWidth = Math.max(cpx(0.5), r*0.03); ctx.beginPath(); ctx.ellipse(x + dx, yy, r, r*0.42, 0, 0, Math.PI); ctx.stroke();
  }
  // the top coin, seen from above at a slant (its face squashed to the stack's ellipse)
  ctx.save(); ctx.translate(x, y - (n - 1)*t); ctx.scale(1, 0.42); crtCoin(ctx, 0, -t*0.6/0.42, r, coin, { L: { ...L, sx: 0, sy: 0 }, noShadow: true }); ctx.restore();
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

// ---- WHAT THE SEED PICKS ('seed'), or what was asked for ----
const crtOr = (v, list) => (v && v !== 'seed' && list.includes(v)) ? v : crtPick(list);
export function crtChooseTable(mat){ return crtOr(mat, Object.keys(TABLE_MATERIALS)); }
/** The game, the cards' stock and edge, the coinage, the suits in the deck. */
export function crtChooseDeal(o = {}){
  const game = crtOr(o.game, Object.keys(CARD_GAMES)), stock = crtOr(o.stock, Object.keys(CARD_STOCKS)), gilt = crtOr(o.gilt, Object.keys(GILT));
  const coinage = COINAGES.find(c => c.name === o.coinage) || crtPick(COINAGES);
  // which suits are in this deck (a game is played with two, three or all four)
  const all = [0, 1, 2, 3].sort(() => Math.random() - 0.5), suits = all.slice(0, 2 + Math.floor(Math.random()*3)).sort();
  const k = parseInt(o.suits, 10);
  return { game, stock, gilt, coinage, suits: k >= 2 && k <= 4 ? all.slice(0, k).sort() : suits };
}
/**
 * THE DEAL DRAWN on whatever the canvas holds (a table). o: { game, stock,
 * gilt, coinage, suits, count (0.2–3), scatter (0–1), stakes (0–1), size (1:
 * as the texture), suitCols: [4], light, tilt }. CARDS IN PLAY: more cards,
 * a little smaller. Returns what lies where (for a mask).
 */
export function crtPaintDeal(x, w, h, o){
  const unit = Math.min(w, h), count = Math.max(0.2, o.count ?? 1), cw = unit*0.11*(o.size ?? 1)*(0.85 + 0.3/Math.sqrt(Math.max(0.3, count)));
  const items = crtDeal(o.game, w, h, { cw, count, scatter: o.scatter ?? 0.22, stakes: o.stakes ?? 0.5, suits: o.suits, coinage: o.coinage });
  const look = { stock: o.stock, gilt: o.gilt, suitCols: o.suitCols, L: crtLight(o.light, o.tilt) };
  for(const it of items){
    if(it.kind === 'card'){ const k = it.cw || cw; x.save(); x.translate(it.x, it.y); x.rotate(it.rot); crtCard(x, k, k*1.7, it.face, { ...look, rot: it.rot, lift: it.lift }); x.restore(); }
    else if(it.kind === 'coin') crtCoin(x, it.x, it.y, it.r, it.coin, look);
    else crtStack(x, it.x, it.y, it.r, it.n, it.coin, look);
  }
  x.globalAlpha = 1; x.shadowColor = 'transparent';
  return { items, cw };
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
const CRT_SUIT_DEFAULTS = ['#B0303A', '#C9A33A', '#3E7D4F', '#2E5FA8'];      // the texture's own: two accents, two hues
const crtIsCanvas = v => !!(v && typeof v === 'object' && typeof v.getContext === 'function');
/** The picture a step was handed, as a canvas to draw on (a canvas pass hands a canvas; the grid, fields). */
function crtGround(E, v, grey = 128){
  const [c, x] = crtStepCanvas(E);
  if(crtIsCanvas(v)) x.drawImage(v, 0, 0, E.ww, E.wh);
  else if(v && v.r instanceof Float32Array){ const im = x.createImageData(E.ww, E.wh), d = im.data;
    for(let i = 0, q = 0; i < E.ww*E.wh; i++, q += 4){ d[q] = v.r[i]*255; d[q+1] = v.g[i]*255; d[q+2] = v.b[i]*255; d[q+3] = 255; } x.putImageData(im, 0, 0); }
  else { x.fillStyle = `rgb(${grey},${grey},${grey})`; x.fillRect(0, 0, E.ww, E.wh); }
  return [c, x];
}
function crtDealOpts(E, n){
  const { ctx, P, num, input } = E;
  const cols = [2, 3, 4, 5].map((j, i) => { const v = input(n, j); return Array.isArray(v) ? v.map(q => q*255) : crtRGB(CRT_SUIT_DEFAULTS[i]); });
  return { ...crtChooseDeal({ game: String(P(n, 'game', 'seed')), stock: String(P(n, 'stock', 'seed')), gilt: String(P(n, 'gilt', 'seed')), coinage: String(P(n, 'coinage', 'seed')), suits: String(P(n, 'suits', 'seed')) }),
    count: num(n, 'count', 100)/100, size: num(n, 'size', 100)/100, scatter: num(n, 'scatter', 20)/90, stakes: num(n, 'stakes', 50)/100,
    suitCols: cols, light: ctx.light, tilt: (ctx.lightTilt ?? 100)/100 };
}
export const CARD_STEPS = {
  table: { cat: 'Textures', label: 'Table', ins: [], outs: ['image', 'grey'], io: { outs: ['image', 'field'] },
    params: [CRT_SEL('mat', 'Material', ['seed', ...Object.keys(TABLE_MATERIALS)]), CRT_R('lamp', 'Lamp', 50)], cost: () => 6,
    paint(E, n){ const { ww, wh, ctx, P, num } = E; const [c, x] = crtStepCanvas(E);
      crtTable(x, ww, wh, crtChooseTable(String(P(n, 'mat', 'seed'))), ctx.light, { vignette: num(n, 'lamp', 50)/100 }); return [c, null]; },
    run(E, n){ const im = E.readCanvas(this.paint(E, n)[0]); return [im, E.lum(im)]; } },
  deal: { cat: 'Marks', label: 'Deal (Cards)', ins: ['table', 'fire hue', 'water hue', 'air hue', 'earth hue'], outs: ['image', 'mask'], io: { ins: ['image', 'colour', 'colour', 'colour', 'colour'], outs: ['image', 'field'] },
    params: [CRT_SEL('game', 'Game', ['seed', ...Object.keys(CARD_GAMES)]), CRT_SEL('stock', 'Card Stock', ['seed', ...Object.keys(CARD_STOCKS)]), CRT_SEL('gilt', 'Edge', ['seed', ...Object.keys(GILT)]),
      CRT_SEL('suits', 'Suits', ['seed', '2', '3', '4']), CRT_SEL('coinage', 'Coinage', ['seed', ...COINAGES.map(c => c.name)]),
      CRT_R('count', 'Cards in Play', 100, 20, 300), CRT_R('size', 'Card Size', 100, 50, 200), CRT_R('scatter', 'Scatter', 20, 0, 90), CRT_R('stakes', 'Stakes', 50)], cost: () => 8,
    // the cards laid on what comes in (a Table), lit by the dial
    paint(E, n){ const [c, x] = crtGround(E, E.input(n, 1)); const o = crtDealOpts(E, n); const d = crtPaintDeal(x, E.ww, E.wh, o); return [c, null, d]; },
    run(E, n){ const [c, , d] = this.paint(E, n);
      return [E.readCanvas(c), crtMask(E, mx => { mx.fillStyle = '#fff'; for(const it of d.items){ if(it.kind === 'card'){ const k = it.cw || d.cw; mx.save(); mx.translate(it.x, it.y); mx.rotate(it.rot); mx.fillRect(-k/2, -k*0.85, k, k*1.7); mx.restore(); }
        else { mx.beginPath(); mx.arc(it.x, it.y, it.r, 0, Math.PI*2); mx.fill(); } } })]; } },
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
