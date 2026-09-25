/**
 * texSharpness.js — √ Sharpness. Value: off-white against blue-black.
 *
 * Waking; metal at the edges. Lotus, 90s dots, still rain, the painter's
 * frustration, silverpoint hatch, metal leaf. (Waking grain is a pixel
 * loop and lives in buildTexture.)
 */
import { makeNoiseGrid, sampleNoiseGrid, parseHex, withSeed } from './texCore.js';

export function genFlowers(w,h,amt,zoom,tint1,tint2){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d');                              // transparent ground
  const unit=Math.min(w,h);
  const A=parseHex(tint1||'#E8739E'), B=parseHex(tint2||'#F2B33D');
  const L=o=>(o.r*0.299+o.g*0.587+o.b*0.114)/255;
  const mix=(a,b,t)=>({r:a.r+(b.r-a.r)*t, g:a.g+(b.g-a.g)*t, b:a.b+(b.b-a.b)*t});
  const WHITE={r:255,g:255,b:255};
  // Where a colour fades to, by its lightness: a light colour to white, a
  // midtone to a deeper shade of itself, a dark one to a near-black complement.
  const fadeOf=o=> L(o)>0.6 ? mix(o,WHITE,0.85)
                 : L(o)>0.28 ? mix(o,{r:0,g:0,b:0},0.55)
                 : {r:(255-o.r)*0.14, g:(255-o.g)*0.14, b:(255-o.b)*0.14};
  // the bright version of a colour, by the same rules
  const brightOf=o=> L(o)>0.6 ? mix(o,WHITE,0.6) : L(o)>0.28 ? mix(o,WHITE,0.45) : mix({r:255-o.r,g:255-o.g,b:255-o.b},WHITE,0.3);
  const css=(o,a=1)=>`rgba(${o.r|0},${o.g|0},${o.b|0},${a})`;

  // The pond: a few very soft, very wide bands of light lying flat. Not
  // waves, not ripples — just the sense of a still surface.
  for(let i=0;i<4;i++){
    const y=h*(0.1+Math.random()*0.8), band=h*(0.08+Math.random()*0.14);
    const g=ctx.createLinearGradient(0,y-band,0,y+band);
    g.addColorStop(0,'rgba(236,236,236,0)'); g.addColorStop(0.5,'rgba(236,236,236,0.06)'); g.addColorStop(1,'rgba(236,236,236,0)');
    ctx.fillStyle=g; ctx.fillRect(0,y-band,w,band*2);
  }

  // Size is the LARGEST bloom; each is 10–100% of it. Collision is circular
  // and tight (blooms may brush petal tips), largest placed first so small
  // ones fall into the gaps.
  const maxR=unit*0.085*zoom;
  const target=Math.max(2,Math.round((w*h)/285000*amt));
  const radii=[]; for(let i=0;i<target;i++) radii.push(maxR*(0.1+Math.pow(Math.random(),1.6)*0.9));
  radii.sort((a,b)=>b-a);
  const placed=[];
  for(const r of radii){
    for(let tries=0;tries<60;tries++){
      const x=Math.random()*w, y=Math.random()*h;
      if(placed.some(p=>Math.hypot(p.x-x,p.y-y) < (p.r+r)*0.82)) continue;
      placed.push({x,y,r}); break;
    }
  }

  const petal=(cx,cy,a,len,wide,round,base,tip,alpha)=>{
    const dx=Math.cos(a), dy=Math.sin(a), px=Math.cos(a+Math.PI/2), py=Math.sin(a+Math.PI/2);
    const at=(al,ac)=>[cx+dx*len*al+px*wide*ac, cy+dy*len*al+py*wide*ac];
    const [x1,y1]=at(0.18,1.0), [x2,y2]=at(0.72+round*0.12,0.92+round*0.18), [tx,ty]=at(1,0);
    const [x3,y3]=at(0.72+round*0.12,-(0.92+round*0.18)), [x4,y4]=at(0.18,-1.0);
    // coloured at its base, fading to its tip — the water lily's blush
    const g=ctx.createLinearGradient(cx,cy,tx,ty);
    g.addColorStop(0,css(base,alpha)); g.addColorStop(0.45,css(base,alpha)); g.addColorStop(1,css(tip,alpha));
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.bezierCurveTo(x1,y1,x2,y2,tx,ty); ctx.bezierCurveTo(x3,y3,x4,y4,cx,cy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=css(mix(base,{r:0,g:0,b:0},0.35),alpha*0.35); ctx.lineWidth=Math.max(0.5,len*0.012); ctx.stroke();
  };

  for(const {x:cx,y:cy,r:R} of placed){
    const rot=Math.random()*Math.PI*2;
    const dark=Math.random()<0.22;                           // a few blooms are the deep kind
    const base=dark ? mix(A,{r:0,g:0,b:0},0.45) : A;
    const tip=fadeOf(base);
    // its shadow on the water
    const sh=ctx.createRadialGradient(cx+R*0.12,cy+R*0.16,R*0.2,cx+R*0.12,cy+R*0.16,R*1.25);
    sh.addColorStop(0,'rgba(10,10,14,0.28)'); sh.addColorStop(1,'rgba(10,10,14,0)');
    ctx.fillStyle=sh; ctx.beginPath(); ctx.arc(cx+R*0.12,cy+R*0.16,R*1.25,0,Math.PI*2); ctx.fill();
    // outer petals palest at the tips, inner ones more saturated, as in life
    const rings=[{n:12,len:1.00,wide:0.30,off:0.0, round:0.35, t:0.0 },
                 {n:12,len:0.82,wide:0.30,off:0.5, round:0.6,  t:0.25},
                 {n:10,len:0.62,wide:0.29,off:0.25,round:0.9,  t:0.5 },
                 {n:8, len:0.44,wide:0.27,off:0.0, round:1.2,  t:0.75}];
    for(const g of rings){
      const b2=mix(base, mix(base,{r:base.r*0.8,g:base.g*0.55,b:base.b*0.7},0.6), g.t);   // deeper inward
      const t2=mix(tip, base, g.t*0.7);
      for(let k=0;k<g.n;k++) petal(cx,cy,rot+((k+g.off)/g.n)*Math.PI*2,R*g.len,R*g.wide,g.round,b2,t2,0.96);
    }
    // the heart, then a crown of bright stamens
    const heart=ctx.createRadialGradient(cx,cy,0,cx,cy,R*0.2);
    heart.addColorStop(0,css(mix(B,{r:0,g:0,b:0},0.25))); heart.addColorStop(1,css(B));
    ctx.fillStyle=heart; ctx.beginPath(); ctx.arc(cx,cy,R*0.2,0,Math.PI*2); ctx.fill();
    const bright=brightOf(B);
    ctx.strokeStyle=css(bright,0.95); ctx.lineCap='round';
    const stamens=36+Math.floor(Math.random()*18);
    for(let k=0;k<stamens;k++){
      const a=rot+(k/stamens)*Math.PI*2+(Math.random()-0.5)*0.08;
      const r0=R*(0.08+Math.random()*0.06), r1=R*(0.24+Math.random()*0.08);
      ctx.lineWidth=Math.max(0.6,R*0.018);
      ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*r0,cy+Math.sin(a)*r0);
      ctx.lineTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1); ctx.stroke();
      ctx.fillStyle=css(bright); ctx.beginPath(); ctx.arc(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1,Math.max(0.6,R*0.014),0,Math.PI*2); ctx.fill();
    }
  }
  return c;
}

// Hidebound: a high-intensity paper-like grain base, plus a much-more-tiled,
// much-lower-intensity crackle layer generated at a vertically squished working
// resolution then stretched back to full height — elongating every cell so the
// grain reads as vertically stretched, like natural leather.
// Dotwork: a regular dot grid (classic print halftone) where each dot's radius is
// modulated by a coarse noise field — genuinely geometric (fixed grid spacing)
// but with organic size variation, distinct from Squares' flat-shaded triangles.
export function genHalftone(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');
  fctx.fillStyle = 'rgb(205,205,205)';
  fctx.fillRect(0,0,w,h);

  const fieldGW = 10, fieldGH = Math.max(2, Math.round(10*(h/w)));
  const field = makeNoiseGrid(fieldGW, fieldGH);

  const cell = (Math.max(w,h)/48) * zoom;
  const cols = Math.ceil(w/cell), rows = Math.ceil(h/cell);
  fctx.fillStyle = 'rgb(60,60,60)';
  for(let ry=0; ry<rows; ry++){
    for(let rx=0; rx<cols; rx++){
      const cx = rx*cell+cell/2, cy = ry*cell+cell/2;
      const nx = (rx/cols)*(fieldGW-1), ny = (ry/rows)*(fieldGH-1);
      const v = sampleNoiseGrid(field, fieldGW, fieldGH, nx, ny);
      const r = v*cell*0.48*amt;
      if(r < 0.6) continue;
      fctx.beginPath();
      fctx.arc(cx, cy, r, 0, Math.PI*2);
      fctx.fill();
    }
  }
  return full;
}

// Downpour: diagonal falling streaks — a distinct linear-gradient-stroke pattern,
// not the static blob stains that Water Spots uses.
export function genRainStreaks(w,h,amt,angle,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const slant = ((angle==null?0:angle) * Math.PI) / 180;
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');
  fctx.fillStyle='rgb(128,128,128)';
  fctx.fillRect(0,0,w,h);

  // -14deg is the resting slant; the Slant knob tilts from there
  const angleRad = (-14*Math.PI/180) + slant;
  const count = Math.round((w*h)/3800 * amt);
  for(let i=0;i<count;i++){
    const x = Math.random()*w*1.3 - w*0.15;
    const len = (Math.random()*0.11+0.05)*Math.max(w,h) * zoom;
    // a streak may begin above the page: starting at y >= 0 and fading in
    // left a band at the top where no rain fell
    const y = Math.random()*(h + len) - len;
    const dx = Math.sin(angleRad)*len, dy = Math.cos(angleRad)*len;
    const bright = Math.random()<0.5 ? (35+Math.random()*35) : (210+Math.random()*40);
    const grad = fctx.createLinearGradient(x,y,x+dx,y+dy);
    grad.addColorStop(0, `rgba(${bright},${bright},${bright},0)`);
    grad.addColorStop(0.18, `rgba(${bright},${bright},${bright},0.9)`);
    grad.addColorStop(0.82, `rgba(${bright},${bright},${bright},0.9)`);
    grad.addColorStop(1, `rgba(${bright},${bright},${bright},0)`);
    fctx.strokeStyle = grad;
    fctx.lineWidth = 1.4+Math.random()*2.2;
    fctx.beginPath(); fctx.moveTo(x,y); fctx.lineTo(x+dx,y+dy); fctx.stroke();
  }
  return full;
}

export function genBrushstrokes(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const ctx = c.getContext('2d');
  ctx.fillStyle='rgb(128,128,128)'; ctx.fillRect(0,0,w,h);

  // Angry paint. Each stroke is a BODY of paint first — an opaque ribbon laid
  // along a fast, curving swish, blotted where the loaded brush lands — with
  // bristle striations running inside it. Only at the tail, where the paint
  // runs out, does it fray into separate dry streaks, and a few droplets are
  // flung off the end. Dark paint goes down first as an underlayer, light
  // paint is dragged across it, and a few dark accents come last; the bodies
  // are slightly translucent, so where strokes cross the paints mix.
  const unit = Math.min(w,h);
  const n = Math.max(3, Math.round((6 + Math.random()*4) * amt));
  const plan = [];
  for(let i=0;i<n;i++) plan.push(i < n*0.4 ? 'dark' : 'light');
  for(let i=0;i<Math.max(1, Math.round(n*0.2));i++) plan.push('accent');

  for(const kind of plan){
    const tone = kind === 'light' ? 214 + Math.random()*26 : 18 + Math.random()*26;
    const W = unit*(kind === 'accent' ? 0.028 : 0.05 + Math.random()*0.06) * zoom;
    const L = unit*(0.38 + Math.random()*0.5) * (kind === 'accent' ? 0.7 : 1);
    // the swish: a cubic whose handles pull hard to one side
    const a0 = Math.random()*Math.PI*2, bendDir = Math.random()<0.5 ? 1 : -1;
    const x0 = Math.random()*w, y0 = Math.random()*h;
    const x3 = x0 + Math.cos(a0)*L, y3 = y0 + Math.sin(a0)*L;
    // not every swipe is the same arc: a near-straight slash, an S, or a hook
    const gesture = Math.random();
    const k = L*(0.12 + Math.random()*0.4)*bendDir;
    const k2 = gesture < 0.3 ? k*0.15 : gesture < 0.65 ? -k*0.9 : k*1.3;
    const nx = -Math.sin(a0), ny = Math.cos(a0);
    const x1 = x0 + Math.cos(a0)*L*0.3 + nx*k,  y1 = y0 + Math.sin(a0)*L*0.3 + ny*k;
    const x2 = x0 + Math.cos(a0)*L*0.7 + nx*k2, y2 = y0 + Math.sin(a0)*L*0.7 + ny*k2;
    const at = t => { const u=1-t;
      return [u*u*u*x0 + 3*u*u*t*x1 + 3*u*t*t*x2 + t*t*t*x3,
              u*u*u*y0 + 3*u*u*t*y1 + 3*u*t*t*y2 + t*t*t*y3]; };
    const N = 90, pts = [];
    for(let s=0;s<=N;s++){
      const t = s/N, [px,py] = at(t), [qx,qy] = at(Math.min(1, t+0.01));
      const len = Math.hypot(qx-px, qy-py) || 1;
      pts.push({ t, x:px, y:py, nx:-(qy-py)/len, ny:(qx-px)/len });
    }
    // pressure: a blot on landing, full through the sweep, lifting at the end
    const dry = 0.55 + Math.random()*0.2;
    // pressure swings hard: loaded and wide on landing, pressing to a peak,
    // then lifting — never the even width of a tube
    const peak = 0.12 + Math.random()*0.2;
    const width = t => W * (t < peak ? 0.75 + 0.55*(t/peak) : 1.3 - 0.75*((t-peak)/(1-peak)))
                         * (t > dry ? Math.pow(1 - (t-dry)/(1-dry), 0.7) : 1);
    // ragged edges that wander slowly, so the outline is torn, not smooth
    const ph1 = Math.random()*6, ph2 = Math.random()*6, ph3 = Math.random()*6;
    const edge = (t, side) => 1 + 0.16*Math.sin(t*9 + (side ? ph1 : ph2)) + 0.07*Math.sin(t*31 + ph3) + (Math.random()-0.5)*0.06;

    // 1. the body, up to where it runs dry
    const left = [], right = [];
    for(const p of pts){ if(p.t > dry) break;
      const hw = width(p.t)/2;
      left.push([p.x + p.nx*hw*edge(p.t,1), p.y + p.ny*hw*edge(p.t,1)]);
      right.push([p.x - p.nx*hw*edge(p.t,0), p.y - p.ny*hw*edge(p.t,0)]); }
    ctx.fillStyle = `rgb(${tone|0},${tone|0},${tone|0})`;
    ctx.globalAlpha = kind === 'accent' ? 0.9 : 0.78;
    ctx.beginPath();
    left.forEach(([x,y],i)=> i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    for(let i=right.length-1;i>=0;i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath(); ctx.fill();

    // 2. bristles: striations inside the body, then fraying past the dry point
    const bristles = 14 + Math.floor(Math.random()*14);
    for(let b=0;b<bristles;b++){
      const f = (b/(bristles-1))*2 - 1;
      const shade = tone + (Math.random()-0.5)*110;          // visible striations
      const end = dry + (1-dry)*(0.3 + Math.random()*0.7);   // some give out early
      ctx.strokeStyle = `rgb(${Math.max(0,Math.min(255,shade))|0},${Math.max(0,Math.min(255,shade))|0},${Math.max(0,Math.min(255,shade))|0})`;
      ctx.lineWidth = Math.max(0.6, W*0.035*(0.6+Math.random()));
      ctx.lineCap = 'round';
      ctx.beginPath(); let on = false;
      for(const p of pts){
        if(p.t > end) break;
        const inTail = p.t > dry;
        if(inTail && Math.random() < (p.t-dry)*2.2){ if(on){ ctx.stroke(); ctx.beginPath(); on=false; } continue; }
        const spread = inTail ? 1 + (p.t-dry)*1.8 : 1;      // the tail fans open
        const off = f * width(p.t)/2 * 0.92 * spread;
        const x = p.x + p.nx*off, y = p.y + p.ny*off;
        on ? ctx.lineTo(x,y) : (ctx.moveTo(x,y), on = true);
      }
      ctx.globalAlpha = 0.5; if(on) ctx.stroke();
    }

    // 3. droplets flung off the end of an angry stroke
    const tip = pts[pts.length-1], dx = tip.x - pts[pts.length-6].x, dy = tip.y - pts[pts.length-6].y;
    const dl = Math.hypot(dx,dy) || 1;
    ctx.fillStyle = `rgb(${tone|0},${tone|0},${tone|0})`;
    for(let d=0; d<Math.floor(Math.random()*6); d++){
      const r = W*(0.2 + Math.random()*1.4);
      const dotR = W*(0.03 + Math.random()*0.06);
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(tip.x + dx/dl*r + (Math.random()-0.5)*W*0.5, tip.y + dy/dl*r + (Math.random()-0.5)*W*0.5, dotR, 0, Math.PI*2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  return c;
}

// The plate is scratched
// in one direction, always.
// Patience, then a line.
export function genSilverpointHatch(w,h,amt,zoom,angle){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const rad = ((angle==null?35:angle) * Math.PI) / 180;
  const c = document.createElement('canvas');
  c.width=w; c.height=h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0,0,w,h);

  const diag = Math.hypot(w,h);
  // HATCHING means crossed sets. One set of parallel lines is just rain,
  // which is exactly what the first version looked like. Three passes at
  // different angles, tighter spacing, and short strokes rather than
  // full-width rules.
  // The knob sets the CROSS angle: the two main passes open away from each
  // other as it turns, so the lattice widens and closes instead of merely
  // rotating as one rigid grid.
  const passes = [
    { rot:  rad,       weight: 1.00, spacingMul: 1.00 },
    { rot: -rad,       weight: 0.82, spacingMul: 1.2  },
    { rot:  rad * 0.4, weight: 0.45, spacingMul: 2.0  },
  ];

  for(const pass of passes){
    const spacing = Math.max(1.6, (diag/230) * pass.spacingMul / amt);
    const lines = Math.ceil(diag/spacing);
    ctx.save();
    ctx.translate(w/2, h/2);
    ctx.rotate(pass.rot);
    for(let i=-lines; i<=lines; i++){
      const y = i*spacing;
      const dark = Math.random() < 0.58;
      const tone = dark ? 48 : 216;
      // an engraver's stroke is short and repeated, not one long rule
      const segments = 2 + Math.floor(Math.random()*3);
      for(let sIdx=0; sIdx<segments; sIdx++){
        const span = diag / segments;
        const x0 = -diag/2 + sIdx*span + Math.random()*span*0.22;
        const x1 = x0 + span*(0.45 + Math.random()*0.45);
        ctx.globalAlpha = (0.10 + Math.random()*0.26) * pass.weight;
        ctx.strokeStyle = `rgb(${tone},${tone},${tone})`;
        ctx.lineWidth = Math.max(0.3, diag*0.00055*(0.6+Math.random()*0.9));
        ctx.beginPath();
        ctx.moveTo(x0, y + (Math.random()-0.5)*spacing*0.3);
        ctx.lineTo(x1, y + (Math.random()-0.5)*spacing*0.3);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  return c;
}

// Gold beaten so thin
// it forgets it was ever
// heavier than light.
export function genMetalLeaf(w,h,amt,zoom,light,tint){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const leaf = parseHex(tint || '#D9B45B');
  const c = document.createElement('canvas');
  c.width=w; c.height=h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0,0,w,h);

  const unit = Math.max(w,h);
  const flakes = Math.max(10, Math.round((120 + Math.random()*90) * amt));

  for(let i=0;i<flakes;i++){
    const cx = Math.random()*w, cy = Math.random()*h;
    const r = unit*(0.015 + Math.random()*0.055) * zoom;
    const sides = 5 + Math.floor(Math.random()*4);
    const rot = Math.random()*Math.PI*2;

    const pts = [];
    for(let s=0;s<sides;s++){
      const a = rot + (s/sides)*Math.PI*2;
      const rr = r*(0.55 + Math.random()*0.7);
      pts.push([cx+Math.cos(a)*rr, cy+Math.sin(a)*rr]);
    }

    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for(let s=1;s<pts.length;s++) ctx.lineTo(pts[s][0], pts[s][1]);
    ctx.closePath();

    // each flake keeps its own brightness, carried in the leaf's colour
    const lift = (178 + Math.floor(Math.random()*66)) / 210;
    ctx.globalAlpha = 0.16 + Math.random()*0.4;
    ctx.fillStyle = `rgb(${Math.min(255, Math.round(leaf.r*lift))},${Math.min(255, Math.round(leaf.g*lift))},${Math.min(255, Math.round(leaf.b*lift))})`;
    ctx.fill();

    // the seam where one leaf overlaps the next
    ctx.globalAlpha = 0.10 + Math.random()*0.25;
    ctx.strokeStyle = 'rgb(48,48,48)';
    ctx.lineWidth = Math.max(0.5, unit*0.0009);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return c;
}

// Most windows are dark.
// The few that are lit are why
// the city looks awake.
export function genCityscape(w,h,amt,zoom,tint1,tint2){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  // the seed's FIRST draw decides the Needle, so which seeds show it is
  // predictable: withSeed(seed, () => Math.random() < 0.1)
  const hasNeedle = Math.random() < 0.1;
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);
  const unit=Math.min(w,h);
  const win=parseHex(tint1||'#FFE3A8'), wat=parseHex(tint2||'#2E4F6E');
  const rgb=(o,a=1)=>`rgba(${o.r},${o.g},${o.b},${a})`;
  const grey=(v,a=1)=>`rgba(${v|0},${v|0},${v|0},${a})`;
  // A night city, and what lies at its feet. The waterfront always carries
  // the Needle when it appears; otherwise the city may sit on farmland, or
  // behind an elevated highway and railway.
  const roll=Math.random();
  const scene = hasNeedle ? 'water' : roll<0.45 ? 'water' : roll<0.72 ? 'fields' : 'rail';
  const ground = h*(0.64 + Math.random()*0.08);
  const H = unit*0.34*zoom;                               // tallest towers

  // stars
  for(let i=0;i<Math.round((w*h)/16000);i++){
    ctx.globalAlpha=0.25+Math.random()*0.6; ctx.fillStyle=grey(230);
    ctx.beginPath(); ctx.arc(Math.random()*w, Math.random()*ground*0.85, unit*0.0012*(0.4+Math.random()), 0, Math.PI*2); ctx.fill();
  }

  const windows=(x,top,bw,bh,density)=>{
    const cw=Math.max(3,unit*0.006), ch=Math.max(3,unit*0.008), gap=cw*0.9;
    for(let yy=top+ch; yy<ground-ch*1.5; yy+=ch+gap*1.1)
      for(let xx=x+gap; xx<x+bw-cw-gap*0.3; xx+=cw+gap)
        if(Math.random()<density){ ctx.globalAlpha=0.55+Math.random()*0.45; ctx.fillStyle=rgb(win); ctx.fillRect(xx,yy,cw,ch); }
  };
  // a contiguous row of buildings: no gaps, each type with its own silhouette
  const row=(scale, tone, alpha, density, types)=>{
    let x=-unit*0.02;
    while(x<w){
      const type=types[Math.floor(Math.random()*types.length)];
      let bw=unit*(0.035+Math.random()*0.06)*scale, bh=H*scale*(0.25+Math.random()*0.75);
      if(type==='block'||type==='warehouse') { bw*=1.8; bh*=0.45; }
      if(type==='house'){ bw=unit*0.022*scale; bh=unit*0.02*scale; }
      const top=ground-bh;
      ctx.globalAlpha=alpha; ctx.fillStyle=grey(tone);
      ctx.beginPath();
      if(type==='setback'){                               // stepped, like an old tower
        const s1=bw*0.18, s2=bw*0.34;
        ctx.moveTo(x,ground); ctx.lineTo(x,top+bh*0.35); ctx.lineTo(x+s1,top+bh*0.35); ctx.lineTo(x+s1,top+bh*0.12);
        ctx.lineTo(x+s2,top+bh*0.12); ctx.lineTo(x+s2,top); ctx.lineTo(x+bw-s2,top); ctx.lineTo(x+bw-s2,top+bh*0.12);
        ctx.lineTo(x+bw-s1,top+bh*0.12); ctx.lineTo(x+bw-s1,top+bh*0.35); ctx.lineTo(x+bw,top+bh*0.35); ctx.lineTo(x+bw,ground);
      } else if(type==='dome'){
        ctx.rect(x,top+bw*0.3,bw,bh-bw*0.3); ctx.moveTo(x+bw,top+bw*0.3); ctx.arc(x+bw/2,top+bw*0.3,bw/2,0,Math.PI,true);
      } else if(type==='house'){
        ctx.moveTo(x,ground); ctx.lineTo(x,top+bh*0.4); ctx.lineTo(x+bw/2,top-bh*0.2); ctx.lineTo(x+bw,top+bh*0.4); ctx.lineTo(x+bw,ground);
      } else if(type==='warehouse'){
        ctx.moveTo(x,ground); ctx.lineTo(x,top+bh*0.3); ctx.quadraticCurveTo(x+bw/2,top-bh*0.1,x+bw,top+bh*0.3); ctx.lineTo(x+bw,ground);
      } else {
        ctx.rect(x,top,bw,bh);
      }
      ctx.fill();
      if(type==='spire'){ ctx.fillRect(x+bw/2-unit*0.0015, top-bh*0.18, unit*0.003, bh*0.18);
        ctx.beginPath(); ctx.moveTo(x+bw*0.2,top); ctx.lineTo(x+bw/2,top-bh*0.1); ctx.lineTo(x+bw*0.8,top); ctx.fill(); }
      if(density>0 && type!=='warehouse') windows(x, top+(type==='dome'?bw*0.3:0), bw, bh, density*(type==='house'?0.5:1));
      x+=bw;                                              // flush: no gaps
    }
  };

  const types = scene==='fields' ? ['tower','block','setback'] : ['tower','tower','setback','spire','block','dome'];
  row(scene==='fields'?0.55:0.85, 72, 0.55, 0, types);            // far skyline, unlit
  row(scene==='fields'?0.7:1, 30, 0.96, 0.22*amt, types);        // near skyline, lit

  if(hasNeedle){
    // the Space Needle, to its real proportions: three legs pinched to a waist
    // a third of the way up, flaring out to hold the saucer at ~0.87 of its
    // height, a spire above
    const nx=w*(0.25+Math.random()*0.5), NH=H*1.55, base=ground;
    const y=f=>base-NH*f, spread=NH*0.11, waist=NH*0.035, top=NH*0.075;
    // the legs are structural: drawn with weight, not as hairlines
    ctx.globalAlpha=1; ctx.strokeStyle=grey(24); ctx.fillStyle=grey(24); ctx.lineWidth=Math.max(2,NH*0.012);
    for(const s of [-1,0,1]){
      ctx.beginPath(); ctx.moveTo(nx+s*spread, base);
      ctx.bezierCurveTo(nx+s*waist*1.2, y(0.25), nx+s*waist, y(0.4), nx+s*waist*1.1, y(0.5));
      ctx.bezierCurveTo(nx+s*waist*1.4, y(0.66), nx+s*top*0.8, y(0.8), nx+s*top, y(0.86));
      ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(nx, y(0.87), NH*0.125, NH*0.018, 0, 0, Math.PI*2); ctx.fill();   // the halo
    ctx.beginPath(); ctx.ellipse(nx, y(0.895), NH*0.085, NH*0.022, 0, 0, Math.PI*2); ctx.fill();  // the top house
    ctx.fillRect(nx-NH*0.004, y(1), NH*0.008, NH*0.09);                                           // the spire
    ctx.fillStyle=rgb(win);
    for(let k=0;k<14;k++){ const a=(k/14)*Math.PI*2; if(Math.cos(a)<0) continue;
      ctx.globalAlpha=0.85; ctx.fillRect(nx+Math.sin(a)*NH*0.1-1, y(0.872)-1, 2.5, 2.5); }
  }

  if(scene==='water'){
    const walk=unit*0.008, treesH=unit*0.02;
    ctx.globalAlpha=1; ctx.fillStyle=grey(64); ctx.fillRect(0,ground,w,walk);                // the sidewalk
    ctx.fillStyle=grey(34); ctx.beginPath(); ctx.moveTo(0,ground+walk+treesH);               // the treeline
    for(let x=0;x<=w;x+=unit*0.012) ctx.lineTo(x, ground+walk+treesH*(0.2+Math.random()*0.55));
    ctx.lineTo(w,ground+walk+treesH); ctx.closePath(); ctx.fill();
    const wy=ground+walk+treesH;
    const g=ctx.createLinearGradient(0,wy,0,h);                                              // the water
    g.addColorStop(0,rgb(wat,0.85)); g.addColorStop(1,rgb({r:wat.r*0.5,g:wat.g*0.5,b:wat.b*0.5},0.95));
    ctx.fillStyle=g; ctx.fillRect(0,wy,w,h-wy);
    // reflections: broken streaks of window light, rippling as they go down
    for(let i=0;i<Math.round(w/(unit*0.004)*amt);i++){
      const x=Math.random()*w, depth=Math.random();
      const ry=wy+depth*(h-wy)*0.8, len=unit*(0.004+Math.random()*0.012)*(1+depth);
      ctx.globalAlpha=(1-depth)*0.55; ctx.fillStyle=rgb(win);
      ctx.fillRect(x+Math.sin(ry*0.08)*unit*0.004, ry, len, Math.max(1,unit*0.0016));
    }
    ctx.globalAlpha=0.18; ctx.strokeStyle=grey(200); ctx.lineWidth=1;
    for(let y=wy+unit*0.01;y<h;y+=unit*(0.012+Math.random()*0.02)){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y+Math.random()*2); ctx.stroke(); }
  } else if(scene==='fields'){
    ctx.globalAlpha=1; ctx.fillStyle=grey(92); ctx.fillRect(0,ground,w,h-ground);
    // grain elevators: a cluster of tall silos and a gantry
    const ex=w*(0.1+Math.random()*0.7), sil=unit*0.018;
    ctx.fillStyle=grey(38);
    for(let k=0;k<4;k++) ctx.fillRect(ex+k*sil, ground-H*0.4, sil*0.9, H*0.4);
    ctx.fillRect(ex+sil*4, ground-H*0.52, sil*1.2, H*0.52);
    ctx.fillRect(ex-sil*0.3, ground-H*0.42, sil*4.6, sil*0.35);
    // small houses along the road
    for(let x=0;x<w;x+=unit*(0.05+Math.random()*0.08)){
      const bw=unit*0.02, bh=unit*0.016, top=ground-bh;
      ctx.fillStyle=grey(40); ctx.beginPath(); ctx.moveTo(x,ground); ctx.lineTo(x,top); ctx.lineTo(x+bw/2,top-bh*0.6); ctx.lineTo(x+bw,top); ctx.lineTo(x+bw,ground); ctx.fill();
      if(Math.random()<0.6*amt){ ctx.fillStyle=rgb(win); ctx.globalAlpha=0.8; ctx.fillRect(x+bw*0.35,top+bh*0.35,bw*0.25,bh*0.3); ctx.globalAlpha=1; }
    }
    // wheat: rows running away to the horizon, pale and stroked
    const vx=w*(0.3+Math.random()*0.4);
    for(let i=0;i<60;i++){
      const bx=(i/59)*w*2-w*0.5;
      ctx.globalAlpha=0.28; ctx.strokeStyle=grey(i%2?168:118); ctx.lineWidth=unit*0.006;
      ctx.beginPath(); ctx.moveTo(vx+(bx-vx)*0.02, ground+unit*0.004); ctx.lineTo(bx, h); ctx.stroke();
    }
  } else {
    ctx.globalAlpha=1; ctx.fillStyle=grey(40); ctx.fillRect(0,ground,w,h-ground);
    // an elevated deck on pillars
    const deck=ground+unit*0.035, dh=unit*0.012;
    ctx.fillStyle=grey(24); ctx.fillRect(0,deck,w,dh);
    for(let x=unit*0.02;x<w;x+=unit*0.07) ctx.fillRect(x,deck+dh,unit*0.008,h-deck);
    if(Math.random()<0.5){
      // traffic: streaks of headlights and tail lights
      for(let i=0;i<Math.round(24*amt)+4;i++){
        const x=Math.random()*w, len=unit*(0.02+Math.random()*0.05), red=Math.random()<0.5;
        ctx.globalAlpha=0.75; ctx.fillStyle=red?'rgb(255,70,70)':rgb(win);
        ctx.fillRect(x, deck-unit*(red?0.004:0.007), len, Math.max(1.5,unit*0.0018));
      }
    } else {
      // a train crossing on the deck, windows lit
      const tx=Math.random()*w*0.4, tl=w*(0.35+Math.random()*0.3), th=unit*0.016;
      ctx.fillStyle=grey(30); ctx.fillRect(tx,deck-th,tl,th);
      ctx.fillStyle=rgb(win);
      for(let x=tx+th*0.4;x<tx+tl-th*0.4;x+=th*0.9){ ctx.globalAlpha=0.8; ctx.fillRect(x,deck-th*0.72,th*0.55,th*0.35); }
    }
  }
  ctx.globalAlpha=1;
  return c;
}

