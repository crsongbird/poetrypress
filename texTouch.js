/**
 * texTouch.js — 🜚 Touch. Surface: what the page is made of.
 *
 * Contact. Relief rather than image, so these take a light direction and
 * blend through soft-light. Linen, cold press, foxing, fold ghost, cup
 * ring, poured wax, raked substrate.
 */
import { lightVec, parseHex } from './texCore.js';

// Thread over thread over
// thread. Somebody's hands did this
// ten thousand times.
export function genLinenTooth(w,h,amt,zoom,light){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const {lx,ly} = lightVec(light);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);

  const pitch = Math.max(2.5, (Math.max(w,h)/240) * zoom);
  const off = Math.max(0.5, pitch*0.16);
  // two interleaved thread directions; the weave is regular, the flaws are not
  for(const vertical of [false, true]){
    const n = Math.ceil((vertical ? w : h)/pitch);
    for(let i=0;i<n;i++){
      const at = i*pitch + pitch*0.5;
      const slub = Math.random() < 0.10*amt;          // a doubled thread
      const wgt = (slub ? 2.1 : 1) * (0.7 + Math.random()*0.6);
      // a slub is a visible NUB where the thread doubled, not merely a
      // heavier line -- so it gets drawn as its own short thick segment
      if(slub){
        const nubs = 1 + Math.floor(Math.random()*2);
        for(let nIdx=0;nIdx<nubs;nIdx++){
        const at2 = Math.random()*(vertical ? h : w);
        const nub = pitch*(4 + Math.random()*9);
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = 'rgb(38,38,38)';
        ctx.lineWidth = Math.max(0.6, pitch*0.62);
        ctx.beginPath();
        if(vertical){ ctx.moveTo(at, at2 - nub/2); ctx.lineTo(at, at2 + nub/2); }
        else { ctx.moveTo(at2 - nub/2, at); ctx.lineTo(at2 + nub/2, at); }
        ctx.stroke();
        }
      }
      ctx.lineWidth = Math.max(0.4, pitch*0.30*wgt);
      // lit face then shadowed face, offset along the light vector
      for(const [shift, tone, a] of [[-1, 226, 0.20], [1, 44, 0.20]]){
        ctx.globalAlpha = a * (slub ? 1.5 : 1);
        ctx.strokeStyle = `rgb(${tone},${tone},${tone})`;
        ctx.beginPath();
        if(vertical){ ctx.moveTo(at + lx*off*shift, 0); ctx.lineTo(at + lx*off*shift, h); }
        else { ctx.moveTo(0, at + ly*off*shift); ctx.lineTo(w, at + ly*off*shift); }
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha=1;
  return c;
}

// The paper says no
// to the pencil, very softly,
// ten thousand times.
export function genColdPress(w,h,amt,zoom,light){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const {lx,ly} = lightVec(light);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);

  // dimples, not grain: each pit gets a lit rim and a shadowed floor, which
  // is what separates this from Waking Grain's flat contrast noise
  const r = Math.max(0.8, (Math.max(w,h)/700) * zoom);
  const count = Math.round((w*h)/(r*r*13) * amt);
  const off = r*0.55;
  for(let i=0;i<count;i++){
    const x=Math.random()*w, y=Math.random()*h;
    const rr = r*(0.6+Math.random()*0.9);
    ctx.globalAlpha = 0.10+Math.random()*0.14;
    ctx.fillStyle='rgb(232,232,232)';
    ctx.beginPath(); ctx.arc(x - lx*off, y - ly*off, rr, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 0.09+Math.random()*0.13;
    ctx.fillStyle='rgb(40,40,40)';
    ctx.beginPath(); ctx.arc(x + lx*off, y + ly*off, rr*0.9, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;
  return c;
}

// Something damp got in
// and the paper remembered
// for forty-odd years.
export function genFoxing(w,h,amt,zoom,light,tint){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const t = parseHex(tint || '#8A6A3C');
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);

  const unit=Math.min(w,h);
  const clusters = Math.max(2, Math.round((5+Math.random()*4)*amt));
  for(let k=0;k<clusters;k++){
    // damp enters at the edges, so clusters favour the margins
    const edge = Math.random();
    const cx = edge<0.5 ? w*(Math.random()*0.28) : w*(0.72+Math.random()*0.28);
    const cy = h*Math.random();
    const spread = unit*(0.08+Math.random()*0.16)*zoom;
    const spots = 5+Math.floor(Math.random()*9);
    for(let i=0;i<spots;i++){
      const a=Math.random()*Math.PI*2, d=Math.pow(Math.random(),0.7)*spread;
      const x=cx+Math.cos(a)*d, y=cy+Math.sin(a)*d;
      const rr=unit*(0.004+Math.random()*0.016)*zoom;
      const g=ctx.createRadialGradient(x,y,0,x,y,rr);
      g.addColorStop(0,   `rgba(${t.r},${t.g},${t.b},0.55)`);
      g.addColorStop(0.55,`rgba(${t.r},${t.g},${t.b},0.26)`);
      g.addColorStop(1,   `rgba(${t.r},${t.g},${t.b},0)`);
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.arc(x,y,rr,0,Math.PI*2); ctx.fill();
    }
  }
  return c;
}

// It was folded once
// to fit an envelope, then
// opened. It still knows.
export function genFoldGhost(w,h,amt,zoom,light){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const {lx,ly}=lightVec(light);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);

  // Paper that lived in a pocket. A crease seen close is never one line: it
  // is several irregular ones running together at slightly different depths,
  // widths and opacities, which the eye reads as a single fold. So each fold
  // is built from a few near-parallel curves — a straight run whose control
  // points are nudged a little perpendicular, alternating sides, then copied
  // and nudged again.
  const folds = Math.max(1, Math.round((2 + Math.random()*2) * amt));
  const soft = Math.max(1.2, (Math.max(w,h)/260) * zoom);

  for(let f=0; f<folds; f++){
    const vertical = Math.random() < 0.5;
    const at = (vertical ? w : h) * (0.16 + Math.random()*0.68);
    const strands = 3 + Math.floor(Math.random()*3);
    const nodes = 7 + Math.floor(Math.random()*5);

    for(let s=0; s<strands; s++){
      // each strand sits a few pixels off the last and has its own weight
      const lateral = (s - (strands-1)/2) * soft * (0.9 + Math.random()*0.8);
      const depth = 0.3 + Math.random()*0.7;
      const lit = s % 2 === 0;
      const tone = lit ? 238 : 30;

      // node positions along the run, each pushed slightly off the straight
      // line, alternating sides so the crease wanders without drifting
      const pts = [];
      for(let n=0; n<=nodes; n++){
        const u = n/nodes;
        const sway = (n % 2 ? 1 : -1) * soft * (0.25 + Math.random()*0.85);
        const a = at + lateral + sway + (lx*(lit?-1:1) + ly*(lit?-1:1)) * soft * 0.35;
        pts.push(vertical ? [a, u*h] : [u*w, a]);
      }

      ctx.globalAlpha = (lit ? 0.16 : 0.14) * depth;
      ctx.strokeStyle = `rgb(${tone},${tone},${tone})`;
      ctx.lineWidth = Math.max(0.5, soft * (0.35 + depth*0.8));
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      // through the nodes as a smooth curve: midpoints as anchors, the nodes
      // themselves as control points
      for(let n=1; n<pts.length-1; n++){
        const mx = (pts[n][0] + pts[n+1][0]) / 2;
        const my = (pts[n][1] + pts[n+1][1]) / 2;
        ctx.quadraticCurveTo(pts[n][0], pts[n][1], mx, my);
      }
      ctx.lineTo(pts[pts.length-1][0], pts[pts.length-1][1]);
      ctx.stroke();
    }

    // the broad soft shading either side of the fold, where the sheet lifts
    const g = vertical
      ? ctx.createLinearGradient(at - soft*5, 0, at + soft*5, 0)
      : ctx.createLinearGradient(0, at - soft*5, 0, at + soft*5);
    g.addColorStop(0,    'rgba(20,20,20,0)');
    g.addColorStop(0.42, 'rgba(20,20,20,0.10)');
    g.addColorStop(0.55, 'rgba(240,240,240,0.12)');
    g.addColorStop(1,    'rgba(240,240,240,0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    if(vertical) ctx.fillRect(at - soft*5, 0, soft*10, h);
    else ctx.fillRect(0, at - soft*5, w, soft*10);
  }
  ctx.globalAlpha = 1;
  return c;
}

// Someone set it down
// mid-sentence and forgot it.
// The ring is the proof.
export function genCupRing(w,h,amt,zoom,light,tint){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const t = parseHex(tint || '#6B4A2F');
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);

  const unit=Math.min(w,h);
  const rings = Math.max(1, Math.round((1+Math.random()*2)*amt));
  for(let i=0;i<rings;i++){
    const cx=w*(0.15+Math.random()*0.7), cy=h*(0.15+Math.random()*0.7);
    const R=unit*(0.10+Math.random()*0.10)*zoom;
    const gapAt=Math.random()*Math.PI*2;
    const gapW=0.5+Math.random()*0.9;      // where the cup was lifted and dragged
    // the rim holds far more stain than the interior
    ctx.lineWidth=Math.max(1.2, R*0.075);
    const segs=90;
    for(let sIdx=0;sIdx<segs;sIdx++){
      const a0=(sIdx/segs)*Math.PI*2, a1=((sIdx+1)/segs)*Math.PI*2;
      let d=Math.abs(((a0-gapAt+Math.PI*3)%(Math.PI*2))-Math.PI);
      const inGap = d > Math.PI-gapW;
      ctx.globalAlpha=(inGap?0.05:0.34)*(0.65+Math.random()*0.7);
      ctx.strokeStyle=`rgb(${t.r},${t.g},${t.b})`;
      ctx.beginPath(); ctx.arc(cx,cy,R*(0.99+Math.random()*0.02),a0,a1); ctx.stroke();
    }
    // the faint wash the liquid left inside the rim
    const g=ctx.createRadialGradient(cx,cy,R*0.1,cx,cy,R);
    g.addColorStop(0,`rgba(${t.r},${t.g},${t.b},0.035)`);
    g.addColorStop(1,`rgba(${t.r},${t.g},${t.b},0.12)`);
    ctx.globalAlpha=1; ctx.fillStyle=g;
    ctx.beginPath(); ctx.arc(cx,cy,R*0.97,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;
  return c;
}

// It ran before it
// set, so the thick edge tells you
// which way the page leaned.
export function genPouredWax(w,h,amt,zoom,light,tint){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const {lx,ly}=lightVec(light);
  const t = parseHex(tint || '#7A2B2B');
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);

  const unit=Math.min(w,h);
  const pools=Math.max(1, Math.round((2+Math.random()*2)*amt));
  for(let i=0;i<pools;i++){
    const cx=w*(0.12+Math.random()*0.76), cy=h*(0.12+Math.random()*0.76);
    const R=unit*(0.05+Math.random()*0.055)*zoom;
    const runA=Math.random()*Math.PI*2;          // the direction it ran
    const lobes=9+Math.floor(Math.random()*5);

    // the pool: a rounded blob, thicker on the running side
    ctx.beginPath();
    for(let k=0;k<=lobes;k++){
      const a=(k/lobes)*Math.PI*2;
      const run=1+Math.cos(a-runA)*0.28;
      const rr=R*run*(0.86+Math.random()*0.22);
      const x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr;
      k?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    ctx.closePath();
    ctx.globalAlpha=0.62;
    ctx.fillStyle=`rgb(${t.r},${t.g},${t.b})`;
    ctx.fill();

    // domed interior: lit on the light side, shadowed opposite
    const g=ctx.createRadialGradient(cx-lx*R*0.35, cy-ly*R*0.35, R*0.05, cx, cy, R*1.05);
    g.addColorStop(0,'rgba(255,255,255,0.30)');
    g.addColorStop(0.55,'rgba(255,255,255,0.04)');
    g.addColorStop(1,'rgba(0,0,0,0.28)');
    ctx.globalAlpha=0.9; ctx.fillStyle=g; ctx.fill();

    // raised rim
    ctx.globalAlpha=0.35;
    ctx.lineWidth=Math.max(0.8, R*0.07);
    ctx.strokeStyle='rgba(20,10,10,0.8)';
    ctx.stroke();
  }
  ctx.globalAlpha=1;
  return c;
}

// Never the whole print —
// just enough ridge to prove that
// a hand was here once.
export function genWhorl(w,h,amt,zoom,light){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const {lx,ly}=lightVec(light);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);

  // A raked surface, not a fingerprint: one continuous furrow that travels
  // the whole field, doubling back on itself, with the rest of the rake's
  // teeth following it at a fixed spacing. Each furrow gets a lit and a
  // shadowed flank so it reads as cut into the ground rather than drawn on.
  const unit=Math.min(w,h);
  const spacing=Math.max(2.4, unit*0.022*zoom);
  const teeth=Math.max(2, Math.round(3*amt));
  const passes=Math.max(1, Math.round(2.2*amt));

  for(let p=0;p<passes;p++){
    const vertical = Math.random()<0.5;
    const span = vertical ? h : w;
    const across = vertical ? w : h;
    const waves = 1.4 + Math.random()*2.6;
    // a wider-set rake sweeps a broader arc, so spacing widens the wander
    const depth = across*(0.05 + Math.random()*0.10) * zoom;
    const start = Math.random()*across;
    const steps = 150;

    for(let t=0;t<teeth;t++){
      const offset = (t - (teeth-1)/2) * spacing;
      for(const [shift,tone,alpha] of [[-1,236,0.15],[1,34,0.13]]){
        ctx.globalAlpha=alpha;
        ctx.strokeStyle=`rgb(${tone},${tone},${tone})`;
        ctx.lineWidth=Math.max(0.5, spacing*0.30);
        ctx.beginPath();
        for(let k=0;k<=steps;k++){
          const u=k/steps;
          // the furrow snakes across the field and folds back at the edges
          const wander = Math.sin(u*Math.PI*waves)*depth
                       + Math.sin(u*Math.PI*waves*2.7 + p)*depth*0.22;
          const a = start + wander + offset;
          const px = vertical ? a + lx*shift*spacing*0.2 : u*span;
          const py = vertical ? u*span : a + ly*shift*spacing*0.2;
          k ? ctx.lineTo(px,py) : ctx.moveTo(px,py);
        }
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha=1;
  return c;
}
