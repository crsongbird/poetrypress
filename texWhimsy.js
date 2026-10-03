/**
 * texWhimsy.js — ♡ Whimsy. Hue: red, purple and blue.
 *
 * Sleep; starlight advancing or receding. Clouds, bokeh, the deep field,
 * euphoria dust, burning mana, first snow, aurora.
 */
import { makeNoiseGrid, sampleNoiseGrid, mixHex, darkenRgb, parseHex, withSeed, lightVec, CPU, canonArea, cpx, canonDiv } from './texCore.js';

export function genClouds(w,h,amt,zoom,light){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const {lx,ly}=lightVec(light);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU);

  // A smoky room. Smoke RISES — LIFT stretches it upward into columns that
  // thin as they climb — and is DRAGGED sideways the higher it goes, the way
  // a draught pulls at it. The side of each wisp facing the light is lit.
  // Computed at a quarter of full resolution: smoke is soft by nature.
  const div=canonDiv(4), ww=Math.ceil(w/div), wh=Math.ceil(h/div), unit=Math.min(ww,wh);
  const perm=new Uint8Array(512), base=[...Array(256).keys()];
  for(let i=255;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [base[i],base[j]]=[base[j],base[i]]; }
  for(let i=0;i<512;i++) perm[i]=base[i&255];
  const fade=t=>t*t*(3-2*t);
  const vn=(x,y)=>{ const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi, u=fade(xf), v=fade(yf);
    const a=perm[(perm[xi&255]+yi)&511], b=perm[(perm[(xi+1)&255]+yi)&511];
    const c2=perm[(perm[xi&255]+yi+1)&511], d=perm[(perm[(xi+1)&255]+yi+1)&511];
    return ((a*(1-u)+b*u)*(1-v)+(c2*(1-u)+d*u)*v)/255; };
  const fbm=(x,y)=>{ let s=0,a=0.5,f=1; for(let o=0;o<4;o++){ s+=vn(x*f,y*f)*a; a*=0.5; f*=2.07; } return s/0.9375; };
  const lift=Math.max(0.4,zoom), drag=amt;

  const density=(px,py)=>{
    const u=px/unit, v=py/unit, up=1-v/(wh/unit);            // 0 at the floor, 1 at the ceiling
    const q=fbm(u*1.6+3.1, v*1.6+7.7);
    const ux=u + drag*(0.35*q + 0.55*up*up);                   // dragged, more as it rises
    const vy=v/lift + 0.6*q;                                    // stretched upward by lift
    const n=fbm(ux*2.6+q*1.4, vy*2.6);
    const thin=0.45+0.55*(1-up*0.8);                            // thinning as it climbs
    // a soft body, plus FILAMENTS: the noise folded at its midpoint gives
    // sharp crests — the threads that curl off a column of smoke
    const body=Math.max(0, Math.min(1, (n-0.45)/0.3));
    const ridge=1-Math.abs(2*fbm(ux*3.4+q*2.1+5.3, vy*3.4)-1);
    const wisps=Math.pow(ridge, 5);
    return Math.min(1, body*0.55 + wisps*0.9) * thin;
  };
  const small=document.createElement('canvas'); small.width=ww; small.height=wh;
  const sctx=small.getContext('2d', CPU); const img=sctx.createImageData(ww,wh), d=img.data;
  const e=2;                                                    // step for the light's slope
  for(let py=0;py<wh;py++) for(let px=0;px<ww;px++){
    const s0=density(px,py);
    let val=128;
    if(s0>0){
      // lit where the smoke's surface faces the light
      const sl=density(px-lx*e,py-ly*e);
      const lit=Math.max(-1,Math.min(1,(s0-sl)*6));
      val=128 + s0*(95 + lit*45);
    }
    const i4=(py*ww+px)*4; d[i4]=d[i4+1]=d[i4+2]=Math.max(0,Math.min(255,val)); d[i4+3]=255;
  }
  sctx.putImageData(img,0,0);
  ctx.imageSmoothingEnabled=true; ctx.drawImage(small,0,0,w,h);
  return c;
}

/**
 * Deep Field's matter map: where the stuff of a galaxy is. A band at a random
 * angle and offset, a few clusters that prefer the band, and noise. Built from
 * the FIRST random draws, so the nebula and the stars — drawn as separate
 * layers under the same seed — rebuild the identical map: clouds gather where
 * the stars are, and the voids between clouds are starless.
 * Returns density(u, v) in 0..1, u and v across the page.
 */
function buildMatterMap(){
  const bandAngle = Math.random()*Math.PI, bandOff = (Math.random()-0.5)*0.5;
  const bandWidth = 0.13 + Math.random()*0.12, bandStrength = 0.55 + Math.random()*0.35;
  const ca = Math.cos(bandAngle), sa = Math.sin(bandAngle);
  const clusters = [];
  const nc = 4 + Math.floor(Math.random()*4);
  for(let i = 0; i < nc; i++){
    const t = (Math.random()-0.5)*1.3, off = bandOff + (Math.random()-0.5)*bandWidth*1.8;
    clusters.push({ x: 0.5 + ca*t - sa*off, y: 0.5 + sa*t + ca*off, r: 0.035 + Math.random()*0.08, s: 0.5 + Math.random()*0.8 });
  }
  const grids = []; let amp = 1, maxA = 0;
  for(let o = 0; o < 6; o++){
    const f = 2.5*Math.pow(2, o), g = Math.max(2, Math.round(f) + 1);
    grids.push({ grid: makeNoiseGrid(g, g), g, f, amp }); maxA += amp; amp *= 0.55;
  }
  const noise = (u, v) => { let t = 0; for(const o of grids) t += sampleNoiseGrid(o.grid, o.g, o.g, u*o.f, v*o.f)*o.amp; return t/maxA; };
  const clusterAt = (u, v) => { let c = 0; for(const k of clusters){ const q = ((u-k.x)**2 + (v-k.y)**2)/(k.r*k.r); c += k.s*Math.exp(-q); } return c; };
  const density = (u, v) => {
    const across = -sa*(u-0.5) + ca*(v-0.5) - bandOff;
    const band = bandStrength*Math.exp(-(across*across)/(2*bandWidth*bandWidth));
    const n = noise(u, v);
    return Math.max(0, Math.min(1, (0.32*n + 0.45*band + 0.35*clusterAt(u, v))*(0.55 + 0.9*n) - 0.07));
  };
  return { density, clusterAt, noise, clusters };
}

export function genAstralFog(w,h,amt,zoom,light,tint,form){
  amt = (amt==null?1:amt);
  const M = buildMatterMap();                 // FIRST: the same map the stars use
  const neb = tint ? parseHex(tint) : null;
  const workDiv = canonDiv(4);
  const workW = Math.max(24, Math.round(w/workDiv)), workH = Math.max(24, Math.round(h/workDiv));
  const small = document.createElement('canvas'); small.width = workW; small.height = workH;
  const sctx = small.getContext('2d', CPU), img = sctx.createImageData(workW, workH), d = img.data;
  for(let py = 0; py < workH; py++) for(let px = 0; px < workW; px++){
    const u = px/workW, v = py/workH;
    // clouds follow the matter, lit from within where the clusters are — the
    // stars illuminate the gas around them — with fine wisps through it
    const dens = M.density(u, v), glow = M.clusterAt(u, v);
    const wisp = 0.75 + 0.5*M.noise(u*3.3 + 7.1, v*3.3 + 2.9);
    const density = Math.min(1, Math.pow(dens, 1.25)*wisp + 0.35*Math.min(1, glow)*dens);
    const val = 128 + (75 - 128 + density*150) * amt;
    const i = (py*workW + px)*4;
    if(neb){
      const t = Math.max(0, Math.min(1, (val - 128) / 127));
      d[i] = val + (neb.r - 128)*t; d[i+1] = val + (neb.g - 128)*t; d[i+2] = val + (neb.b - 128)*t;
    } else { d[i] = val; d[i+1] = val; d[i+2] = val; }
    d[i+3] = 255;
  }
  sctx.putImageData(img, 0, 0);
  const full = document.createElement('canvas'); full.width = w; full.height = h;
  const fctx = full.getContext('2d', CPU);
  fctx.imageSmoothingEnabled = true; fctx.drawImage(small, 0, 0, w, h);
  return full;
}

export function genAstralStars(w,h,accent1,accent2,amt,zoom,form){
  amt = (amt==null?1:amt);
  const M = buildMatterMap();                 // FIRST: the same map the nebula uses
  const atm = Math.max(0, Math.min(1, form==null ? 0.2 : form));
  const full = document.createElement('canvas'); full.width = w; full.height = h;
  const fctx = full.getContext('2d', CPU);
  const A1 = parseHex(accent1 || '#d9a6b3'), A2 = parseHex(accent2 || '#9B7FE8');
  // Stars as LIGHT, not dots: every star a soft glow sized by its brightness,
  // coloured by temperature (blue-white to orange), the brightest with the
  // six spikes of a space telescope. ATMOSPHERE: 0 is deep space, crisp; up
  // the scale, starlight twinkles, splits into colour at the edges, dims
  // toward the horizon, and the sky picks up airglow.
  const TEMPS = [[175,198,255],[214,226,255],[255,250,242],[255,236,204],[255,206,164]];
  const colourOf = () => { const t = TEMPS[Math.floor(Math.pow(Math.random(), 0.9)*TEMPS.length)], a = Math.random() < 0.5 ? A1 : A2;
    return [t[0]*0.78 + a.r*0.22, t[1]*0.78 + a.g*0.22, t[2]*0.78 + a.b*0.22]; };
  const n = Math.round(canonArea(w,h)/2125 * amt);
  const unit = Math.min(w, h);
  const glowAt = (x, y, r, c, a) => {
    const g = fctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`);
    g.addColorStop(0.22, `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a*0.42})`);
    g.addColorStop(1, `rgba(${c[0]|0},${c[1]|0},${c[2]|0},0)`);
    fctx.fillStyle = g; fctx.beginPath(); fctx.arc(x, y, r, 0, Math.PI*2); fctx.fill();
  };
  for(let i = 0; i < n; i++){
    // where the matter is: a share born inside the clusters, the rest accepted
    // by density, so the voids stay dark
    let x, y;
    if(Math.random() < 0.3){
      const k = M.clusters[Math.floor(Math.random()*M.clusters.length)];
      const r = k.r*Math.sqrt(-2*Math.log(Math.max(1e-6, Math.random())))*0.7, a = Math.random()*Math.PI*2;
      x = (k.x + Math.cos(a)*r)*w; y = (k.y + Math.sin(a)*r)*h;
    } else {
      let tries = 0;
      do { x = Math.random()*w; y = Math.random()*h; tries++; }
      while(tries < 8 && Math.random() > 0.05 + 0.95*Math.pow(M.density(x/w, y/h), 1.1));
    }
    let b = Math.pow(Math.random(), 3.2);                     // most stars are faint
    b *= 1 + atm*(Math.random() - 0.5)*0.9;                   // twinkle
    b *= 1 - atm*0.7*Math.pow(Math.max(0, y/h), 2.4);         // dimmer toward the horizon
    b *= 1 - atm*0.4;                                          // and dimmer everywhere through thick air
    if(b <= 0.01) continue;
    const c = colourOf();
    const core = cpx(0.7 + b*2.6) * (1 + atm*0.35);           // seeing blurs a little
    const halo = core*(2.6 + b*4.5);
    if(atm > 0.15 && b > 0.35){
      // the atmosphere splits bright starlight at the edges
      const dx = cpx(0.8 + b*3)*atm;
      fctx.globalCompositeOperation = 'lighter';
      glowAt(x + dx, y, core*1.6, [255, 80, 80], 0.32*atm);
      glowAt(x - dx, y, core*1.6, [80, 130, 255], 0.32*atm);
      fctx.globalCompositeOperation = 'source-over';
    }
    glowAt(x, y, halo, c, Math.min(1, 0.35 + b*0.75));
    glowAt(x, y, core, [Math.min(255, c[0] + 40), Math.min(255, c[1] + 40), Math.min(255, c[2] + 40)], 1);
    if(b > 0.8){
      // six diffraction spikes, their length following the star's brightness:
      // the brightest few long, the next size down short — and turbulent air
      // (Atmosphere) smears them shorter
      const len = cpx(3 + 600*Math.pow(b - 0.8, 1.5)) * (1 - atm*0.6);
      fctx.lineCap = 'round';
      for(let s = 0; s < 6; s++){
        const a = (s/6)*Math.PI*2 + Math.PI/2;
        const g = fctx.createLinearGradient(x, y, x + Math.cos(a)*len, y + Math.sin(a)*len);
        g.addColorStop(0, `rgba(${c[0]|0},${c[1]|0},${c[2]|0},0.8)`); g.addColorStop(1, `rgba(${c[0]|0},${c[1]|0},${c[2]|0},0)`);
        fctx.strokeStyle = g; fctx.lineWidth = cpx(0.6 + (b - 0.8)*5);
        fctx.beginPath(); fctx.moveTo(x, y); fctx.lineTo(x + Math.cos(a)*len, y + Math.sin(a)*len); fctx.stroke();
      }
    }
  }
  if(atm > 0.02){
    // airglow low in the sky; past halfway, the warm wash of distant towns
    const g = fctx.createLinearGradient(0, h, 0, h*0.5);
    g.addColorStop(0, `rgba(110,255,170,${0.13*atm})`); g.addColorStop(1, 'rgba(110,255,170,0)');
    fctx.fillStyle = g; fctx.fillRect(0, h*0.5, w, h*0.5);
    if(atm > 0.5){
      const p = (atm - 0.5)*2, g2 = fctx.createLinearGradient(0, h, 0, h*0.78);
      g2.addColorStop(0, `rgba(255,170,95,${0.16*p})`); g2.addColorStop(1, 'rgba(255,170,95,0)');
      fctx.fillStyle = g2; fctx.fillRect(0, h*0.78, w, h*0.22);
    }
  }
  return full;
}

// What Dream Bloom's motes ARE (its Object Shape knob): their outline, as a
// path to fill. 'snowflake' returns false: it is drawn as strokes instead.
const BOKEH_OBJECTS = ['dot', 'petal', 'leaf', 'star', 'snowflake', 'droplet', 'crescent', 'flower'];
// each object's narrowest feature, as a share of its radius (it sets how
// finely the blur must be sampled)
const FEATURE = { dot: 1, petal: 0.5, leaf: 0.4, star: 0.25, snowflake: 0.13, droplet: 0.6, crescent: 0.2, flower: 0.45 };
export function objectPath(ctx, kind, x, y, r, rot){
  const c = Math.cos(rot), s = Math.sin(rot), P = (u, v) => [x + u*c - v*s, y + u*s + v*c];
  const poly = pts => { ctx.beginPath(); pts.forEach((p, i) => { const q = P(p[0], p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); };
  const curve = (n, f) => { const pts = []; for(let k = 0; k <= n; k++){ const t = k/n*Math.PI*2; pts.push(f(t)); } poly(pts); };
  switch(kind){
    case 'petal':    curve(40, t => [Math.sin(t)*r*0.55*Math.pow(Math.abs(Math.sin(t/2)), 0.6), -Math.cos(t)*r]); return true;
    case 'leaf':     curve(40, t => [Math.sin(t)*r*0.42, -Math.cos(t)*r*(1 + 0.08*Math.sin(t))]); return true;
    case 'star':     { const pts = []; for(let k = 0; k < 8; k++){ const a = k*Math.PI/4, rr = k % 2 ? r*0.28 : r; pts.push([Math.sin(a)*rr, -Math.cos(a)*rr]); } poly(pts); return true; }
    case 'droplet':  curve(40, t => { const q = Math.sin(t/2); return [Math.sin(t)*r*0.62*q, (-Math.cos(t)*r*0.75) + r*0.2]; }); return true;
    case 'crescent': { const q = P(r*0.38, -r*0.1); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.arc(q[0], q[1], r*0.82, 0, Math.PI*2, true); return true; }
    case 'flower':   curve(60, t => { const rr = r*(0.55 + 0.45*Math.abs(Math.cos(t*2.5))); return [Math.sin(t)*rr, -Math.cos(t)*rr]; }); return true;
    case 'snowflake':{ ctx.beginPath(); for(let k = 0; k < 6; k++){ const a = k*Math.PI/3, e = P(Math.sin(a)*r, -Math.cos(a)*r), o = P(0, 0);
                       ctx.moveTo(o[0], o[1]); ctx.lineTo(e[0], e[1]);
                       for(const d of [-0.55, 0.55]){ const m = P(Math.sin(a)*r*0.58, -Math.cos(a)*r*0.58), b = P(Math.sin(a + d)*r*0.82, -Math.cos(a + d)*r*0.82); ctx.moveTo(m[0], m[1]); ctx.lineTo(b[0], b[1]); } }
                       return false; }
    default:         ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); return true;
  }
}
// a colour's hue turned by `deg` degrees (in RGB, about the grey axis)
function hueTurn(rgb, deg){
  const a = deg*Math.PI/180, c = Math.cos(a), s = Math.sin(a), k = 1/3, q = Math.sqrt(k);
  const m = [c + (1 - c)*k, k*(1 - c) - q*s, k*(1 - c) + q*s];
  const [r, g, b] = rgb, cl = v => Math.max(0, Math.min(255, v));
  return [cl(r*m[0] + g*m[1] + b*m[2]), cl(r*m[2] + g*m[0] + b*m[1]), cl(r*m[1] + g*m[2] + b*m[0])];
}

// An aperture's outline, for bokeh: f runs round (0) → 7 blades (0.25) →
// 6 (0.5) → 5 (0.75) → a heart (1), easing between neighbours.
// The aperture's outline as points: the same geometry both draws the disc and
// decides which sample points lie inside it, so the two never disagree.
function apertureOutline(x, y, r, f, rot){
  const pts = [];
  if(f >= 0.875){                                   // the heart, a novelty filter: two cubic Béziers
    const k = Math.min(1, (f - 0.875)/0.125), s = r*1.05, c = Math.cos(rot*0.15), sn = Math.sin(rot*0.15);
    const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0], u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]]; };
    const curves = [[[0, s*0.9], [-s*(1.2+0.2*k), s*0.05], [-s*0.6, -s*1.05], [0, -s*0.38]],
                    [[0, -s*0.38], [s*0.6, -s*1.05], [s*(1.2+0.2*k), s*0.05], [0, s*0.9]]];
    for(const [p0, p1, p2, p3] of curves) for(let i = 0; i < 36; i++){
      const [u, v] = bez(p0, p1, p2, p3, i/36); pts.push([x + u*c - v*sn, y + u*sn + v*c]); }
    return pts;
  }
  const seg = Math.min(2, Math.floor(f/0.25)), t = (f - seg*0.25)/0.25;     // between which ticks
  const blades = [0, 7, 6, 5][seg + 1] || 5, round = seg === 0 ? 1 - t : 0.18*(1 - t) + 0.08;
  for(let k = 0; k < 72; k++){
    const a = (k/72)*Math.PI*2, sector = (Math.PI*2)/blades;
    const local = ((a - rot) % sector + sector) % sector - sector/2;
    const poly = Math.cos(sector/2)/Math.cos(local);                 // the polygon's radius at this angle
    const rr = r*(round + (1 - round)*poly)*(1 - 0.05*(1 - round));
    pts.push([x + Math.cos(a)*rr, y + Math.sin(a)*rr]);
  }
  return pts;
}
function aperturePath(ctx, x, y, r, f, rot){
  const pts = apertureOutline(x, y, r, f, rot);
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
}
// inside a polygon? (a ray cast to the right crosses its edges an odd number of times)
function insidePolygon(pts, x, y){
  let inside = false;
  for(let i = 0, j = pts.length - 1; i < pts.length; j = i++){
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if((yi > y) !== (yj > y) && x < (xj - xi)*(y - yi)/(yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export function genBokeh(w,h,amt,zoom,form,shapeKnob,hueSpread,tint){
  // the aperture's shape, and one rotation for every disc (a lens has one aperture)
  const shape = Math.max(0, Math.min(1, form || 0)), rot = Math.random()*Math.PI*2;
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  // OBJECT SHAPE: what the motes are (the nearest mark); COLOR VARIATION: each
  // mote's hue turned at random within this spread, around Light Hue
  const obj = BOKEH_OBJECTS[Math.max(0, Math.min(7, Math.round((shapeKnob || 0)/100*7)))];
  const spread = Math.max(0, Math.min(180, hueSpread || 0));
  const baseHex = (tint && !/^#?f{6}$/i.test(tint.replace('#','')) ) ? tint : '#ffc7da';
  const B = parseHex(baseHex), base = [B.r, B.g, B.b];
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const ctx = c.getContext('2d', CPU);
  ctx.fillStyle = 'rgb(128,128,128)'; ctx.fillRect(0,0,w,h);

  // ---- a physically based lens ----
  // A thin lens: 50 mm at f/1.8, a 24 mm sensor height mapped onto the page.
  // Every mote sits at a real distance (30 cm to 6 m, more of them far, as in
  // a real volume of air); FOCAL PLANE sets the focus distance on that scale.
  // The circle of confusion is the thin-lens one,
  //     c = A·f·|S2 − S1| / (S2·(S1 − f)),
  // and a mote's image size is its real size times the magnification.
  const unit = Math.min(w,h), F = 50, A = F/1.8, Dn = 300, Df = 6000, pxPerMm = unit/24;
  const dist = z => Dn*Math.pow(Df/Dn, z);
  const zf = Math.max(0, Math.min(1, Math.log(zoom/0.25) / Math.log(16)));   // 25%..400% → near..far
  const S1 = dist(zf);
  const cocR = S2 => 0.5*A*F*Math.abs(S2 - S1)/(S2*(S1 - F))*pxPerMm;      // blur radius, px
  const imgR = (mm, S2) => mm*F/(S2 - F)*pxPerMm;                          // image radius, px

  // ---- the aperture, sampled: blur is the object convolved with it ----
  // Points inside the aperture's real shape (round, bladed or heart), tested
  // against its own outline; shuffled so any prefix covers it evenly.
  const outline = apertureOutline(0, 0, 1, shape, rot);
  const samples = [];
  for(let gy = -1; gy <= 1.0001; gy += 2/13) for(let gx = -1; gx <= 1.0001; gx += 2/13){
    const jx = gx + (Math.random() - 0.5)*0.12, jy = gy + (Math.random() - 0.5)*0.12;
    if(insidePolygon(outline, jx, jy)) samples.push([jx, jy, jx*jx + jy*jy]);
  }
  for(let i = samples.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [samples[i], samples[j]] = [samples[j], samples[i]]; }

  // ---- the motes: light sources, brighter than white ----
  // Intensity can exceed what a pixel holds: in focus a bright mote clips to
  // white, as on a real sensor; defocused, the same light spreads over its
  // disc and dims with its area. That is why real bokeh highlights stay
  // visible while staying soft.
  const n = Math.max(20, Math.round(canonArea(w,h)/9000 * amt));
  const motes = [];
  for(let i=0;i<n;i++){
    const z = Math.sqrt(Math.random());
    motes.push({ x: Math.random()*w, y: Math.random()*h, z, S2: dist(z),
                 // dots are specular glints: many dim, a few far brighter than white.
                 // Leaves, petals and the like are diffusely lit surfaces — about as
                 // bright as white paper — and snowflakes a little more, for the ice.
                 I: obj === 'dot' ? 1.5 + 180*Math.pow(Math.random(), 6)
                  : obj === 'snowflake' ? 0.6 + 2.6*Math.pow(Math.random(), 3)
                  : 0.45 + 1.4*Math.pow(Math.random(), 2),
                 mm: obj === 'dot' ? 0.5 + Math.random()*1.2 : 2.5 + Math.random()*4.5,
                 lum: 200 + Math.random()*55, spin: Math.random()*Math.PI*2, hue: (Math.random() - 0.5)*spread });
  }
  motes.sort((a,b) => b.z - a.z);
  // ---- blurred shapes, made once and shared ----
  // Each is built at a fixed resolution: the object (radius r) convolved with
  // the aperture (radius ratio·r), by summing white copies at the aperture's
  // sample points, weighted for spherical aberration. The canvas has room for
  // the object's full reach plus a margin, so no shape is cut at an edge.
  const shapes = new Map();
  const tintCv = document.createElement('canvas'), tc = tintCv.getContext('2d', CPU);   // a clean canvas for tinting
  function blurShape(ratioB, spinB, behind){
    const key = ratioB + '|' + spinB + '|' + (behind ? 1 : 0);
    if(shapes.has(key)) return shapes.get(key);
    const ratio = Math.pow(2, ratioB/2), reach = 46;                         // the shape's radius on its canvas
    const r0 = reach/(1.3 + ratio), coc0 = r0*ratio;
    // sample spacing near a pixel, so the copies merge into a smooth blur
    const spacing = coc0*2/13, k = Math.min(1, 1.25/Math.max(1e-3, spacing));
    const rk = r0*k, ck = coc0*k, size = Math.ceil(2*(rk*1.3 + ck) + 8), cc = size/2;
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    const g = cv.getContext('2d', CPU);
    g.globalCompositeOperation = 'lighter'; g.fillStyle = '#fff'; g.strokeStyle = '#fff';
    const sa = behind ? 0.7 : -0.6;
    const feature = rk*(FEATURE[obj] || 1);
    const need = Math.max(8, Math.ceil(samples.length/Math.max(1, Math.pow(feature/Math.max(spacing*k, 1e-3), 2))));
    const pick = samples.slice(0, Math.min(samples.length, need)).map(([u, v, rr]) => [u, v, Math.max(0.05, 1 + sa*(rr - 0.5))]);
    const wsum = pick.reduce((a2, p) => a2 + p[2], 0) || 1;
    const spin = spinB*Math.PI/3;
    for(const [u, v, wt] of pick){
      g.globalAlpha = Math.min(1, wt/wsum);
      const px = cc + u*ck, py = cc + v*ck;
      if(obj === 'dot'){ g.beginPath(); g.arc(px, py, Math.max(0.6, rk), 0, Math.PI*2); g.fill(); }
      else if(objectPath(g, obj, px, py, Math.max(0.6, rk), spin)) g.fill();
      else { g.lineWidth = Math.max(cpx(0.7)*k, rk*0.14); g.lineCap = 'round'; g.stroke(); }   // a canonical floor, at this canvas's scale
    }
    const out = { canvas: cv, size, r: rk };
    shapes.set(key, out);
    return out;
  }
  const cx0 = w/2, cy0 = h/2, half = Math.hypot(w, h)/2;
  ctx.globalCompositeOperation = 'lighter';                         // light adds, as on a sensor
  for(const m of motes){
    const col = spread > 0 ? hueTurn(base.map(v => v*m.lum/255), m.hue) : [m.lum, m.lum, m.lum];
    const rgb = `${col[0]|0},${col[1]|0},${col[2]|0}`;
    const r = Math.max(cpx(0.6), imgR(m.mm, m.S2)), coc = cocR(m.S2);
    const behind = m.S2 > S1;
    // cat's eye: off-axis, the barrel clips the cone of light — the disc is the
    // aperture intersected with a second, shifted disc
    const ox = (m.x - cx0)/half, oy = (m.y - cy0)/half, cat = 0.55;
    // spherical aberration: behind the focus a brighter rim, in front a brighter
    // centre with a soft edge
    const sa = behind ? 0.7 : -0.6;
    if(coc <= r*0.2){
      // in focus: the object itself, clipped at full white if it is bright
      ctx.globalAlpha = Math.min(1, m.I*0.9); ctx.fillStyle = `rgb(${rgb})`; ctx.strokeStyle = `rgb(${rgb})`;
      if(obj === 'dot'){ ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, Math.PI*2); ctx.fill(); }
      else if(objectPath(ctx, obj, m.x, m.y, r, obj === 'droplet' ? 0 : m.spin)) ctx.fill();
      else { ctx.lineWidth = Math.max(cpx(0.8), r*0.14); ctx.lineCap = 'round'; ctx.stroke(); }
      continue;
    }
    if(obj === 'dot' && coc > r*2.5){
      // a point of light, far out of focus: the convolution IS the aperture,
      // carrying the mote's energy spread over its area (exact, so drawn whole)
      const v = Math.min(1, m.I*(r*r)/(coc*coc));
      const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, coc);
      const k = t => Math.max(0, Math.min(1, v*(1 + sa*(t*t - 0.5))));
      g.addColorStop(0, `rgba(${rgb},${k(0)})`); g.addColorStop(0.5, `rgba(${rgb},${k(0.5)})`);
      g.addColorStop(0.9, `rgba(${rgb},${k(0.9)})`); g.addColorStop(behind ? 0.97 : 0.8, `rgba(${rgb},${k(behind ? 0.97 : 0.8)})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.save();
      ctx.beginPath(); ctx.arc(m.x + ox*cat*coc, m.y + oy*cat*coc, coc*1.05, 0, Math.PI*2); ctx.clip();   // the cat's eye, gently
      ctx.globalAlpha = 1; ctx.fillStyle = g; aperturePath(ctx, m.x, m.y, coc, shape, rot); ctx.fill();
      ctx.restore();
      continue;
    }
    // light too faint to move a pixel by one step, spread this wide, is invisible
    // in the photograph too
    if(m.I*Math.pow(r/(r + coc), 2) < 0.6/255) continue;
    // An extended object (or a point not far out): its blur is the object
    // convolved with the aperture. That SHAPE depends only on how blurred it is
    // relative to its size, its angle, and which side of the focus it lies — so
    // each is made once (blurShape) and shared by every mote that matches;
    // each mote then only scales it, tints it and adds its light.
    const ratioB = Math.max(-5, Math.min(12, Math.round(Math.log2(Math.max(1e-3, coc/r))*2)));
    const spinB = obj === 'droplet' ? 0 : ((Math.round(m.spin/(Math.PI/3)) % 6) + 6) % 6;
    const S = blurShape(ratioB, spinB, behind);
    const scale = r / S.r, dw = S.size*scale;
    // the mote's colour: the shared shape is white; tint it on a clean canvas
    if(tintCv.width < S.size || tintCv.height < S.size){ tintCv.width = Math.max(tintCv.width, S.size); tintCv.height = Math.max(tintCv.height, S.size); }
    tc.globalCompositeOperation = 'source-over'; tc.globalAlpha = 1; tc.clearRect(0, 0, tintCv.width, tintCv.height);
    tc.drawImage(S.canvas, 0, 0);
    tc.globalCompositeOperation = 'source-in'; tc.fillStyle = `rgb(${rgb})`; tc.fillRect(0, 0, S.size, S.size);
    ctx.save();
    // cat's eye, gently: off-axis the barrel clips the cone of light
    ctx.beginPath(); ctx.arc(m.x + ox*cat*coc, m.y + oy*cat*coc, (coc + r*1.3)*1.05, 0, Math.PI*2); ctx.clip();
    // light adds; a mote brighter than white is laid on more than once, so
    // it clips the way a sensor does
    const times = Math.max(1, Math.ceil(m.I));
    ctx.globalAlpha = Math.min(1, m.I/times);
    for(let t = 0; t < times; t++) ctx.drawImage(tintCv, 0, 0, S.size, S.size, m.x - dw/2, m.y - dw/2, dw, dw);
    ctx.restore();
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  return c;
}

export function genEmbers(w,h,accent1,accent2,amt,zoom,form){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const ctx = c.getContext('2d', CPU);
  const A = mixHex(accent1 || '#E0526F', accent1 || '#E0526F', 0);
  const B = mixHex(accent2 || '#9B7FE8', accent2 || '#9B7FE8', 0);

  // Burning fragments raining down. Each spark is BALLISTIC: flung out, then
  // bent by gravity into a falling curve — never a straight needle. The head
  // is white-hot; the trail cools through the ember colour to nothing behind
  // it. Some sparks burst partway and fork into smaller ones, and fine hot
  // dust hangs between them.
  const unit = Math.min(w,h);
  // a fifth of the original count: sparks read better sparse, and each one
  // is a trail of calls
  const n = Math.max(4, Math.round(canonArea(w,h)/130000 * amt));
  const g = unit * 0.9;                                   // gravity, px per unit time²
  // HUE DRIFT: each spark's colour may stray this far around its ember hue;
  // bigger embers burn more chaotically — their paths sputter and swerve
  const drift = Math.max(0, Math.min(1, form == null ? 0.1 : form))*140;
  const chaos = Math.max(0, (zoom || 1) - 1)*0.55;
  const stray = c => { if(drift <= 0) return c; const t = hueTurn([c.r, c.g, c.b], (Math.random() - 0.5)*drift); return { r: t[0]|0, g: t[1]|0, b: t[2]|0 }; };
  const trail = (x, y, vx, vy, len, width, col, depth) => {
    const steps = 22, dt = len / steps;
    let px = x, py = y, pvx = vx, pvy = vy;
    const pts = [[px, py]];
    for(let s=0;s<steps;s++){
      if(chaos > 0){ pvx += (Math.random() - 0.5)*chaos*unit*0.9; pvy += (Math.random() - 0.5)*chaos*unit*0.6; }
      pvy += g*dt; px += pvx*dt; py += pvy*dt; pts.push([px, py]);
    }
    // the trail: thin and cool at the tail, thickening toward the hot head
    for(let s=1;s<pts.length;s++){
      const f = s / (pts.length-1);                        // 0 tail -> 1 head
      ctx.globalAlpha = 0.08 + 0.7*f*f;
      ctx.strokeStyle = `rgb(${Math.round(col.r + (255-col.r)*f*f)},${Math.round(col.g + (255-col.g)*f*f*0.8)},${Math.round(col.b + (255-col.b)*f*f*0.6)})`;
      ctx.lineWidth = Math.max(cpx(0.5), width*(0.25 + 0.9*f));
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(pts[s-1][0], pts[s-1][1]); ctx.lineTo(pts[s][0], pts[s][1]); ctx.stroke();
    }
    const [hx, hy] = pts[pts.length-1];
    // the white-hot head, with a glow of its own colour
    const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, width*4);
    glow.addColorStop(0, `rgba(255,255,255,0.95)`);
    glow.addColorStop(0.3, `rgba(${col.r},${col.g},${col.b},0.55)`);
    glow.addColorStop(1, `rgba(${col.r},${col.g},${col.b},0)`);
    ctx.globalAlpha = 1; ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(hx, hy, width*4, 0, Math.PI*2); ctx.fill();
    // a burst: the spark forks into smaller ones from where its head is now
    if(depth < 1 && Math.random() < 0.28){
      const kids = 2 + Math.floor(Math.random()*3);
      for(let k=0;k<kids;k++){
        const a = Math.random()*Math.PI*2, sp = unit*(0.08 + Math.random()*0.14);
        trail(hx, hy, Math.cos(a)*sp, Math.sin(a)*sp - unit*0.05, len*0.45, width*0.55, col, depth+1);
      }
    }
  };

  for(let i=0;i<n;i++){
    const col = stray(Math.random() < 0.6 ? A : B);
    // launched from anywhere above and across the page, mostly sideways
    const x = Math.random()*w*1.2 - w*0.1, y = Math.random()*h*1.1 - h*0.25;
    const a = -Math.PI/2 + (Math.random()-0.5)*Math.PI*1.3;
    const sp = unit*(0.12 + Math.random()*0.35);
    const len = (0.25 + Math.random()*0.55) * (0.6 + zoom*0.4);
    trail(x, y, Math.cos(a)*sp, Math.sin(a)*sp, len, unit*0.0022*zoom*(0.6 + Math.random()), col, 0);
  }
  // fine hot dust between the sparks
  for(let i=0;i<n*3;i++){
    const col = Math.random() < 0.6 ? A : B;
    ctx.globalAlpha = 0.25 + Math.random()*0.5;
    ctx.fillStyle = `rgb(${Math.min(255,col.r+60)},${Math.min(255,col.g+50)},${Math.min(255,col.b+40)})`;
    ctx.beginPath(); ctx.arc(Math.random()*w, Math.random()*h, unit*0.0011*(0.5+Math.random()), 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  return c;
}

// Flurries: soft round flakes on a transparent canvas (composited with 'lighten' so
// they always read bright regardless of background) — mostly small/sharp, a few
// larger and softer, like flakes drifting slightly out of focus.
export function genSnow(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d', CPU);
  const count = Math.round(canonArea(w,h)/3200 * amt);
  for(let i=0;i<count;i++){
    const x = Math.random()*w, y = Math.random()*h;
    const roll = Math.random();
    let size, alpha, crystal = false;
    if(roll < 0.25){ size = 0.6+Math.random()*0.5; alpha = 0.3+Math.random()*0.2; }        // distant dust
    else if(roll < 0.55){ size = 1+Math.random()*1.2; alpha = 0.7+Math.random()*0.3; }      // tiny, sharp
    else if(roll < 0.78){ size = 2.5+Math.random()*2.5; alpha = 0.5+Math.random()*0.3; }    // small, soft
    else if(roll < 0.93){ size = 5+Math.random()*4; alpha = 0.35+Math.random()*0.25; crystal = true; }   // medium: in focus, crystalline
    else { size = 9+Math.random()*9; alpha = 0.18+Math.random()*0.2; }                      // rare, large, out of focus
    size *= zoom;
    // sizes above are canonical pixels: the tiny/large decision is made in
    // them, and the flake is drawn at this canvas's scale
    const tiny = size <= 1.3;
    size = cpx(size);

    if(tiny){
      fctx.fillStyle = `rgba(255,255,255,${alpha})`;
      fctx.fillRect(x,y,cpx(1),cpx(1));
      continue;
    }
    const grad = fctx.createRadialGradient(x,y,0,x,y,size);
    grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
    grad.addColorStop(0.6, `rgba(255,255,255,${alpha*0.5})`);
    grad.addColorStop(1, `rgba(255,255,255,0)`);
    fctx.fillStyle = grad;
    fctx.beginPath(); fctx.arc(x,y,size,0,Math.PI*2); fctx.fill();
    // the in-focus flakes show their crystal: six arms with side-branches,
    // inside the glow (tiny specks and the large blurred ones don't)
    if(crystal){
      objectPath(fctx, 'snowflake', x, y, size*0.72, Math.random()*Math.PI);
      fctx.strokeStyle = `rgba(255,255,255,${Math.min(1, alpha*1.5)})`; fctx.lineWidth = Math.max(cpx(0.6), size*0.075); fctx.lineCap = 'round'; fctx.stroke();
    }
  }
  return full;
}

export function genMagicParticles(w,h,accent1,accent2,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  // Knobs rescaled so 100% on both is the look that works: what used to take
  // Size at 485% and Count at 20% — both slider ends — now sits in the middle,
  // with room either way.
  const Z = zoom * 4.85;
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const ctx = c.getContext('2d', CPU);
  const A = mixHex(accent1 || '#E0526F', accent1 || '#E0526F', 0);
  const B = mixHex(accent2 || '#9B7FE8', accent2 || '#9B7FE8', 0);
  const rgb = (col, lift=0) => `rgb(${Math.min(255,col.r+lift)},${Math.min(255,col.g+lift)},${Math.min(255,col.b+lift)})`;

  // Pixie dust, less geometric than it was. Wisps are TAPERED curls — thick
  // in the middle, thinning to hair at both ends, curling as they go — rather
  // than even-width circle arcs; each drops a trail of motes. Sparkles twinkle
  // unevenly: four to six arms, no two the same length, one arm always long.
  const unit = Math.min(w,h);
  const count = Math.round(canonArea(w,h)/42000 * amt);        // 225 at 100% on a 3072 page

  const wisp = (x, y, col) => {
    const len = unit*(0.04 + Math.random()*0.07)*Z;
    let a = Math.random()*Math.PI*2;
    const curl = (Math.random()-0.5)*0.22, curlGrow = (Math.random()-0.5)*0.02;
    const W = unit*0.0022*Z*(0.6 + Math.random());
    const steps = 26, pts = [];
    let px = x, py = y, k = curl;
    for(let s=0;s<=steps;s++){ pts.push([px, py, a]); a += k; k += curlGrow; px += Math.cos(a)*len/steps; py += Math.sin(a)*len/steps; }
    // a filled ribbon, widest at its middle
    const L = [], R = [];
    pts.forEach(([x0,y0,a0], s) => { const t = s/steps, hw = W*Math.sin(t*Math.PI)*(0.4 + 0.6*(1-t));
      L.push([x0 + Math.cos(a0+Math.PI/2)*hw, y0 + Math.sin(a0+Math.PI/2)*hw]);
      R.push([x0 - Math.cos(a0+Math.PI/2)*hw, y0 - Math.sin(a0+Math.PI/2)*hw]); });
    ctx.globalAlpha = 0.55 + Math.random()*0.35; ctx.fillStyle = rgb(col, 40);
    ctx.beginPath(); L.forEach(([x0,y0],i) => i ? ctx.lineTo(x0,y0) : ctx.moveTo(x0,y0));
    for(let i=R.length-1;i>=0;i--) ctx.lineTo(R[i][0], R[i][1]); ctx.closePath(); ctx.fill();
    // motes shaken loose along it
    for(let m=0;m<4;m++){ const [mx,my] = pts[Math.floor(Math.random()*pts.length)];
      ctx.globalAlpha = 0.4 + Math.random()*0.5;
      ctx.beginPath(); ctx.arc(mx + (Math.random()-0.5)*W*8, my + (Math.random()-0.5)*W*8, W*(0.4+Math.random()*0.7), 0, Math.PI*2); ctx.fill(); }
  };
  const sparkle = (x, y, col) => {
    const arms = 4 + Math.floor(Math.random()*3), base = unit*0.009*Z*(0.5 + Math.random());
    const rot = Math.random()*Math.PI, longArm = Math.floor(Math.random()*arms);
    // a soft glow behind
    const g = ctx.createRadialGradient(x, y, 0, x, y, base*1.6);
    g.addColorStop(0, `rgba(${col.r},${col.g},${col.b},0.35)`); g.addColorStop(1, `rgba(${col.r},${col.g},${col.b},0)`);
    ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, base*1.6, 0, Math.PI*2); ctx.fill();
    // the arms: concave, uneven, one long
    ctx.fillStyle = rgb(col, 70); ctx.globalAlpha = 0.9;
    ctx.beginPath();
    for(let k=0;k<arms;k++){
      const a = rot + k/arms*Math.PI*2 + (Math.random()-0.5)*0.25;
      const r = base*(k === longArm ? 1.6 : 0.45 + Math.random()*0.7), wd = base*0.1;
      const tipX = x+Math.cos(a)*r, tipY = y+Math.sin(a)*r;
      const nx = Math.cos(a+Math.PI/2)*wd, ny = Math.sin(a+Math.PI/2)*wd;
      ctx.moveTo(x+nx, y+ny); ctx.quadraticCurveTo(x+Math.cos(a)*r*0.25+nx*0.3, y+Math.sin(a)*r*0.25+ny*0.3, tipX, tipY);
      ctx.quadraticCurveTo(x+Math.cos(a)*r*0.25-nx*0.3, y+Math.sin(a)*r*0.25-ny*0.3, x-nx, y-ny);
    }
    ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, base*0.12, 0, Math.PI*2); ctx.fill();
  };

  for(let i=0;i<count;i++){
    const x = Math.random()*w, y = Math.random()*h, col = Math.random() < 0.55 ? A : B;
    const roll = Math.random();
    if(roll < 0.34) wisp(x, y, col);
    else if(roll < 0.52) sparkle(x, y, col);
    else {                                                   // loose dust
      ctx.globalAlpha = 0.3 + Math.random()*0.5; ctx.fillStyle = rgb(col, 50);
      ctx.beginPath(); ctx.arc(x, y, unit*0.0016*Z*(0.4 + Math.random()), 0, Math.PI*2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  return c;
}

// Light hung in sheets —
// no particle, no edge, just
// the sky leaning down.
export function genAuroraVeil(w,h,amt,zoom,light,tint,tint2){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const glow = tint ? parseHex(tint) : null;
  // the hem's colour; the same as the curtain's by default, which draws
  // exactly the single-colour veil
  const hem = tint2 ? parseHex(tint2) : glow;
  const c = document.createElement('canvas');
  c.width=w; c.height=h;
  const ctx = c.getContext('2d', CPU);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0,0,w,h);

  // The first version stacked slices at 0.045 alpha each, which summed to
  // nothing visible. Curtains are now drawn as filled ribbons with a real
  // vertical falloff, at an opacity that survives compositing.
  const ribbons = Math.max(2, Math.round((6 + Math.random()*5) * amt));
  const curtain = Math.min(1.1, 0.7 * zoom);

  for(let i=0;i<ribbons;i++){
    const baseX = Math.random()*w*1.15 - w*0.075;
    const width = w*(0.035 + Math.random()*0.075);
    const drop  = h*curtain*(0.5 + Math.random()*0.5);
    const wob   = w*(0.03 + Math.random()*0.07);
    const phase = Math.random()*Math.PI*2;
    const bright = Math.random() < 0.75;
    const tone  = bright ? 244 : 28;
    // a tint colours the curtain; without one it stays a value pattern
    const rgb = glow && bright ? `${glow.r},${glow.g},${glow.b}` : `${tone},${tone},${tone}`;

    // vertical falloff: brightest at the top edge, gone by the hem
    // with two hues the curtain shifts colour as it falls, as real auroras do
    const mid = (glow && hem && bright)
      ? `${Math.round(glow.r+(hem.r-glow.r)*0.45)},${Math.round(glow.g+(hem.g-glow.g)*0.45)},${Math.round(glow.b+(hem.b-glow.b)*0.45)}` : rgb;
    const low = (glow && hem && bright) ? `${hem.r},${hem.g},${hem.b}` : rgb;
    const fall = ctx.createLinearGradient(0, 0, 0, drop);
    fall.addColorStop(0,    `rgba(${rgb},${bright?0.62:0.45})`);
    fall.addColorStop(0.45, `rgba(${mid},${bright?0.30:0.22})`);
    fall.addColorStop(1,    `rgba(${low},0)`);

    // the fold: a wavy quad traced down one side and back up the other
    const steps = 26;
    ctx.beginPath();
    for(let sIdx=0; sIdx<=steps; sIdx++){
      const t = sIdx/steps, y = t*drop;
      const sway = Math.sin(phase + t*3.0)*wob + Math.sin(phase*1.7 + t*7.1)*wob*0.28;
      const halfW = width*(1 - t*0.25);
      const x = baseX + sway - halfW;
      if(sIdx===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    for(let sIdx=steps; sIdx>=0; sIdx--){
      const t = sIdx/steps, y = t*drop;
      const sway = Math.sin(phase + t*3.0)*wob + Math.sin(phase*1.7 + t*7.1)*wob*0.28;
      const halfW = width*(1 - t*0.25);
      ctx.lineTo(baseX + sway + halfW, y);
    }
    ctx.closePath();
    ctx.fillStyle = fall;
    ctx.globalAlpha = 0.9;
    ctx.fill();

    // a brighter seam along the leading edge, the way a curtain catches light
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = `rgba(${rgb},0.5)`;
    ctx.lineWidth = Math.max(cpx(0.8), w*0.0022);
    ctx.beginPath();
    for(let sIdx=0; sIdx<=steps; sIdx++){
      const t = sIdx/steps, y = t*drop;
      const sway = Math.sin(phase + t*3.0)*wob + Math.sin(phase*1.7 + t*7.1)*wob*0.28;
      const x = baseX + sway - width*(1 - t*0.25)*0.55;
      if(sIdx===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return c;
}

/**
 * The moon's first five random draws, in order. Shared by the generator and by
 * moonForSeed, so the seed button's glyph can never drift from the moon the
 * texture actually draws. Change the order here and both change together.
 */
function moonDraws(){
  const rScale = 0.30 + Math.random()*0.12;
  const px0 = 0.22 + Math.random()*0.56, py0 = 0.22 + Math.random()*0.56;
  // phase kept away from new and full, so the organic side always has room:
  // at the extremes it shrank to a sliver and the design was lost
  const phase = (Math.random()*2 - 1)*0.72;          // -1 full, 0 half, 1 new
  const facing = Math.random() < 0.5 ? 1 : -1;       // 1: lit on the right
  return { rScale, px0, py0, phase, facing };
}

/** The phase (0..1, as in moon.js) the Fractal Moon will show for a seed. */
export function moonForSeed(seed){
  const d = withSeed(seed, moonDraws);
  // lit when facing*u > phase*edge, so the lit fraction is (1-phase)/2 and the
  // terminator's cos term is exactly `phase`; facing says waxing or waning
  const p = Math.acos(Math.max(-1, Math.min(1, d.phase))) / (2 * Math.PI);
  return d.facing > 0 ? p : 1 - p;
}

// A moon, and on its dark side
// something grows that has no name —
// the lit side stays calm.
export function genMoon(w,h,amt,zoom){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU);
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);

  // Everything is chosen by the seed: where it sits, how full it is, which
  // way it faces. The disc is large — it dominates the page rather than
  // decorating it — and may run off an edge.
  const unit=Math.min(w,h);
  const { rScale, px0, py0, phase, facing } = moonDraws();
  const R=unit*rScale*zoom;
  const cx=w*px0, cy=h*py0;
  const tilt=(Math.random()-0.5)*0.9;

  // value noise on a shuffled table, so the pattern is part of the seed too
  const perm=new Uint8Array(512), base=[...Array(256).keys()];
  for(let i=255;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [base[i],base[j]]=[base[j],base[i]]; }
  for(let i=0;i<512;i++) perm[i]=base[i&255];
  const fade=t=>t*t*(3-2*t);
  const vnoise=(x,y)=>{
    const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi;
    const h00=perm[(perm[xi&255]+yi)&511], h10=perm[(perm[(xi+1)&255]+yi)&511];
    const h01=perm[(perm[xi&255]+yi+1)&511], h11=perm[(perm[(xi+1)&255]+yi+1)&511];
    const u=fade(xf), v=fade(yf);
    return ((h00*(1-u)+h10*u)*(1-v) + (h01*(1-u)+h11*u)*v)/255;
  };
  // Fractal Depth adds octaves: more of them is finer, stranger detail
  const octaves=Math.max(2, Math.min(9, Math.round(2 + amt*4)));
  const fbm=(x,y)=>{ let s=0,a=0.5,f=1,n=0; for(let o=0;o<octaves;o++){ s+=vnoise(x*f,y*f)*a; n+=a; a*=0.5; f*=2.03; } return s/n; };

  // built at a third of the page's resolution and scaled up, like the clouds
  const div=canonDiv(3), ww=Math.ceil(w/div), wh=Math.ceil(h/div);
  const small=document.createElement('canvas'); small.width=ww; small.height=wh;
  const sctx=small.getContext('2d', CPU);
  const img=sctx.createImageData(ww,wh), d=img.data;
  const cosT=Math.cos(tilt), sinT=Math.sin(tilt);
  const sstepM=(a,b,x)=>{ const t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); };
  for(let py=0;py<wh;py++){
    for(let px=0;px<ww;px++){
      const idx=(py*ww+px)*4;
      const X=(px*div-cx)/R, Y=(py*div-cy)/R;
      const u=X*cosT - Y*sinT, v=X*sinT + Y*cosT;
      const r2=u*u+v*v;
      let val=128, alpha=255;
      if(r2<=1){
        const edge=Math.sqrt(1-v*v);
        // the terminator is an ellipse; a soft edge a pixel or two wide instead
        // of a yes/no test, which stair-stepped
        const litAmt = sstepM(-0.012, 0.012, facing*u - phase*edge) * sstepM(1, 0.985, Math.sqrt(r2));
        const lit = litAmt > 0;
        const limb = 1 - Math.sqrt(1-r2);               // darkening toward the rim
        if(!lit){
          // the DARK side is knocked out — transparent, the page shows
          // through — so the visible shape IS the phase, as with the real
          // moon, and matches the glyph on the seed button. (With the lit
          // side knocked out instead, a waxing crescent showed as everything
          // except the crescent, which read as backwards.)
          alpha = 0; val = 0;
        } else {
          // the lit side: noise that warps its own coordinates, twice
          const qx=fbm(u*2.1+1.7, v*2.1+9.2), qy=fbm(u*2.1+8.3, v*2.1+2.8);
          const n=fbm(u*2.4+3.2*qx, v*2.4+3.2*qy);
          // a gentle tonal ripple through it (hard contour lines here read
          // as a topographic map)
          const band=Math.abs(((n*9)%1)-0.5)*2;
          // the lit face GLOWS: luminous overall, the fractal detail held
          // inside the light rather than drawn in shadow, brightest toward the
          // limb the sun is on
          const t = Math.max(0, Math.min(1, (n - 0.28) / 0.44));
          val = 138 + t*95 + (1 - sstepM(0, 0.45, band))*13 - limb*18;
          alpha = Math.round(255*litAmt);
        }
      } else {
        // bloom: light spilling past the rim, strongest beside the lit limb,
        // and a soft halo all the way round
        const r = Math.sqrt(r2);
        const side = Math.max(0, Math.min(1, facing*u/r*0.5 + 0.5 - phase*0.35));
        // the glow hugs the limb (a separate halo ring read as a target)
        const bloom = Math.exp(-(r-1)*5.5) * (0.35 + 0.65*side);
        val = 128 + bloom * 70;
        if(val < 129){ val = 0; alpha = 0; }              // beyond the glow: untouched
      }
      d[idx]=d[idx+1]=d[idx+2]=Math.max(0,Math.min(255,val)); d[idx+3]=alpha;
    }
  }
  sctx.putImageData(img,0,0);
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(small,0,0,w,h);
  return c;
}

// Ridge behind ridge behind ridge,
// each one paler than the last —
// distance, made of air.
export function genLandscape(w,h,amt,zoom){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU);
  const unit=Math.min(w,h);

  // A painted landscape, a different country every seed. The biome sets the
  // ground's character; each band is laid in, then worked over with short
  // brush dabs that follow the slope, their tone varying dab to dab. Far
  // bands are paler and flatter (air softens distance), near ones darker and
  // rougher. DISTANCE scales the features; RIDGES sets how many bands.
  const BIOMES={
    // decay: how much each finer octave keeps — low is smooth, high is busy.
    // sharp: crests that come to a point (only mountains have those)
    desert:   { bands:[3,5],  decay:0.18, sharp:false, amp:0.05, bump:0,   dab:'long',  horizon:0.55 },
    grass:    { bands:[4,6],  decay:0.3,  sharp:false, amp:0.07, bump:0,   dab:'grass', horizon:0.5  },
    jungle:   { bands:[6,9],  decay:0.42, sharp:false, amp:0.06, bump:0.9, dab:'leaf',  horizon:0.42 },
    plains:   { bands:[2,4],  decay:0.12, sharp:false, amp:0.018,bump:0,   dab:'long',  horizon:0.62 },
    mountain: { bands:[6,9],  decay:0.36, sharp:true,  amp:0.15, bump:0,   dab:'rock',  horizon:0.38, wave:1.1 },
  };
  const kind=Object.keys(BIOMES)[Math.floor(Math.random()*5)];
  const B=BIOMES[kind];
  const bands=Math.max(2, Math.round((B.bands[0]+Math.random()*(B.bands[1]-B.bands[0]))*amt));
  const horizon=h*(B.horizon+(Math.random()-0.5)*0.08);

  // the sky: a soft wash, and a few long smears of cloud
  const sky=ctx.createLinearGradient(0,0,0,horizon);
  sky.addColorStop(0,'rgb(150,150,150)'); sky.addColorStop(1,'rgb(132,132,132)');
  ctx.fillStyle=sky; ctx.fillRect(0,0,w,h);
  for(let s=0;s<5;s++){
    const y=horizon*(0.15+Math.random()*0.7), x=Math.random()*w, len=w*(0.2+Math.random()*0.4);
    for(let d=0;d<40;d++){
      ctx.globalAlpha=0.05; ctx.fillStyle='rgb(200,200,200)';
      ctx.beginPath(); ctx.ellipse(x+(Math.random()-0.5)*len, y+(Math.random()-0.5)*unit*0.02,
        unit*0.05*zoom, unit*0.008, 0, 0, Math.PI*2); ctx.fill();
    }
  }

  const ridge=(x, seed, amp, decay, bump)=>{
    // mountains are broad masses: a long base wavelength, so peaks are wide
    // for their height (a short one made every range a row of spires)
    let y=0, a=amp, f=1/(unit*(B.wave||0.4)*zoom);
    for(let o=0;o<5;o++){
      const n=Math.sin(x*f*6.283+seed*(o+1))*0.6 + Math.sin(x*f*2.1*6.283+seed*1.7*(o+1))*0.4;
      // mountains fold finer octaves into points; everything else stays rounded
      y+=(B.sharp && o>0 ? Math.abs(n)*2-1 : n)*a;
      a*=decay; f*=2.1;
    }
    if(bump) y-=Math.abs(Math.sin(x/(unit*0.018*zoom)+seed))*amp*0.35*bump;   // canopy lumps
    return y;
  };

  for(let i=0;i<bands;i++){
    const t=bands===1?1:i/(bands-1);                    // 0 far .. 1 near
    const base=horizon+(h-horizon)*Math.pow(t,1.35)*0.92;
    const amp=unit*B.amp*(0.35+t*0.9);
    const tone=Math.round(178-t*140);                   // pale far, dark near
    const seed=Math.random()*100;
    const prof=[];
    for(let x=-20;x<=w+20;x+=Math.max(2,w/400)) prof.push([x, base+ridge(x,seed,amp,B.decay,B.bump)]);
    // lay the band in
    ctx.globalAlpha=0.92; ctx.fillStyle=`rgb(${tone},${tone},${tone})`;
    ctx.beginPath(); ctx.moveTo(-20,h); prof.forEach(([x,y])=>ctx.lineTo(x,y)); ctx.lineTo(w+20,h); ctx.closePath(); ctx.fill();
    // a brushed edge, not a cut one: the crest painted over a few times, loosely
    for(let pass=0;pass<3;pass++){
      const jit=unit*0.004*(pass+1);
      ctx.globalAlpha=0.22; ctx.strokeStyle=`rgb(${tone},${tone},${tone})`; ctx.lineWidth=unit*0.006*(1+pass);
      ctx.beginPath();
      // the wobble wanders SLOWLY along the crest; jittering each point on its
      // own made a fringe of hairs
      const ph1=Math.random()*6.28, ph2=Math.random()*6.28;
      prof.forEach(([x,y],j)=>{
        const yy=y+(Math.sin(x/(unit*0.05)+ph1)*0.6+Math.sin(x/(unit*0.017)+ph2)*0.4)*jit;
        j?ctx.lineTo(x,yy):ctx.moveTo(x,yy); });
      ctx.stroke();
    }
    // work it over with BRUSH strokes: few, broad and flat-ended, laid along
    // the ground, each a slightly different tone. (Hundreds of hair-thin
    // strokes read as fur, not paint.) Each stroke is two overlapping
    // passes, the second narrower and offset, so it has a loaded edge.
    const strokes=Math.round(w/(unit*0.016)*(0.5+t)*(B.dab==='leaf'?1.4:1));
    ctx.lineCap='butt';
    for(let d=0;d<strokes;d++){
      const k=Math.floor(Math.random()*(prof.length-1)), [x0,y0]=prof[k], [x1,y1]=prof[k+1];
      const slope=Math.atan2(y1-y0,x1-x0);
      const depthInto=Math.pow(Math.random(),1.5)*unit*(0.03+t*0.16);
      const x=x0+(Math.random()-0.5)*unit*0.01, y=y0+depthInto+unit*0.004;
      const tn=Math.max(0,Math.min(255,tone+(Math.random()-0.5)*(30+t*44)));
      const len=unit*(B.dab==='long'?0.07:B.dab==='rock'?0.035:0.04)*(0.6+t*0.8)*(0.7+Math.random()*0.6)*zoom;
      const wide=unit*(0.007+t*0.013)*(0.7+Math.random()*0.6);
      const ang=B.dab==='grass'?slope-0.35+(Math.random()-0.5)*0.4
              : B.dab==='leaf'?slope+(Math.random()-0.5)*1.1
              : B.dab==='rock'?slope+(Math.random()-0.5)*0.9
              : slope+(Math.random()-0.5)*0.18;
      const ex=x+Math.cos(ang)*len, ey=y+Math.sin(ang)*len;
      ctx.strokeStyle=`rgb(${tn|0},${tn|0},${tn|0})`;
      ctx.globalAlpha=0.2+Math.random()*0.18; ctx.lineWidth=wide;
      ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo((x+ex)/2, (y+ey)/2 - wide*0.4, ex, ey); ctx.stroke();
      const tn2=Math.max(0,Math.min(255,tn+(Math.random()<0.5?-18:18)));
      ctx.strokeStyle=`rgb(${tn2|0},${tn2|0},${tn2|0})`;
      ctx.globalAlpha=0.22; ctx.lineWidth=wide*0.45;
      ctx.beginPath(); ctx.moveTo(x+wide*0.2,y-wide*0.18); ctx.lineTo(ex-wide*0.4,ey-wide*0.18); ctx.stroke();
    }
    ctx.lineCap='round';
    // a soft haze where each band meets the air behind it
    ctx.globalAlpha=0.12*(1-t); ctx.strokeStyle='rgb(200,200,200)'; ctx.lineWidth=unit*0.01;
    ctx.beginPath(); prof.forEach(([x,y],j)=>j?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.stroke();
  }
  ctx.globalAlpha=1;
  return c;
}
