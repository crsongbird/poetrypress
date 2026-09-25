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

  // Real wax is not a pill. It pools unevenly, runs one way before it sets,
  // throws drips off its edge, and its surface holds the ripples it cooled in.
  // One outline shape, built from a few overlapping waves around the circle,
  // is reused shrunk for each ripple, so the ripples follow the pool's shape.
  const unit=Math.min(w,h);
  const pools=Math.max(1, Math.round((2+Math.random()*2)*amt));
  for(let i=0;i<pools;i++){
    const cx=w*(0.12+Math.random()*0.76), cy=h*(0.12+Math.random()*0.76);
    const R=unit*(0.06+Math.random()*0.06)*zoom;
    const runA=Math.random()*Math.PI*2;
    const waves=[[2,Math.random()*6,0.10],[3,Math.random()*6,0.08],[5,Math.random()*6,0.05],[9,Math.random()*6,0.025]];
    const shape=a => {
      let r=1 + Math.cos(a-runA)*0.30;                        // it ran this way
      for(const [f,ph,amp] of waves) r += Math.sin(a*f+ph)*amp;
      return r;
    };
    const outline=(scale, dx=0, dy=0) => {
      ctx.beginPath();
      for(let k=0;k<=96;k++){
        const a=(k/96)*Math.PI*2, r=R*scale*shape(a);
        const x=cx+dx+Math.cos(a)*r, y=cy+dy+Math.sin(a)*r;
        k?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      ctx.closePath();
    };
    // drips thrown off the running edge
    ctx.fillStyle=`rgb(${t.r},${t.g},${t.b})`;
    for(let d=0; d<3+Math.floor(Math.random()*4); d++){
      const a=runA+(Math.random()-0.5)*1.4, dist=R*(1.25+Math.random()*0.6)*shape(a);
      ctx.globalAlpha=0.55;
      ctx.beginPath(); ctx.arc(cx+Math.cos(a)*dist, cy+Math.sin(a)*dist, R*(0.05+Math.random()*0.09), 0, Math.PI*2); ctx.fill();
    }
    // the pool
    outline(1); ctx.globalAlpha=0.66; ctx.fill();
    // cooling ripples: the same outline, shrinking, each a faint lit/shaded line
    const ripples=4+Math.floor(Math.random()*4);
    for(let r=1;r<=ripples;r++){
      const sc=1 - r/(ripples+1.2);
      for(const [shift,col,al] of [[-1,'rgba(255,255,255,0.5)',0.35],[1,'rgba(0,0,0,0.5)',0.28]]){
        outline(sc, lx*shift*R*0.02, ly*shift*R*0.02);
        ctx.globalAlpha=al; ctx.strokeStyle=col; ctx.lineWidth=Math.max(0.6,R*0.018); ctx.stroke();
      }
    }
    // the domed sheen and the raised rim
    const g=ctx.createRadialGradient(cx-lx*R*0.35,cy-ly*R*0.35,R*0.05,cx,cy,R*1.1);
    g.addColorStop(0,'rgba(255,255,255,0.22)'); g.addColorStop(0.55,'rgba(255,255,255,0.03)'); g.addColorStop(1,'rgba(0,0,0,0.22)');
    outline(1); ctx.globalAlpha=0.9; ctx.fillStyle=g; ctx.fill();
    ctx.globalAlpha=0.4; ctx.lineWidth=Math.max(0.8,R*0.05); ctx.strokeStyle='rgba(20,10,10,0.8)'; ctx.stroke();
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

  // A raked garden. Every furrow is straight and every turn is a right angle:
  // parallel lines across the whole ground, and around each stone a set of
  // concentric rectangles, which is how the rake is walked around a rock.
  const unit=Math.min(w,h);
  const s=Math.max(3, unit*0.016*zoom);                 // furrow spacing
  const rings=5 + Math.floor(Math.random()*3);
  const stones=[];
  const n=Math.max(1, Math.round((1.5 + Math.random()*1.5) * amt));
  for(let i=0;i<n*6 && stones.length<n;i++){
    const sw=unit*(0.05+Math.random()*0.07), sh=sw*(0.55+Math.random()*0.4);
    const x=Math.random()*(w-sw), y=Math.random()*(h-sh);
    const pad=rings*s;
    const clash=stones.some(t => x-pad < t.x+t.w+t.pad && x+sw+pad > t.x-t.pad &&
                                 y-pad < t.y+t.h+t.pad && y+sh+pad > t.y-t.pad);
    if(!clash) stones.push({x, y, w:sw, h:sh, pad});
  }
  // a furrow is a groove: lit on the side facing the light, shadowed opposite
  const groove=(draw)=>{
    for(const [shift,tone,alpha] of [[-1,236,0.30],[1,30,0.26]]){
      ctx.globalAlpha=alpha; ctx.strokeStyle=`rgb(${tone},${tone},${tone})`;
      ctx.lineWidth=Math.max(0.8, s*0.28);
      ctx.save(); ctx.translate(lx*shift*s*0.14, ly*shift*s*0.14);
      ctx.beginPath(); draw(); ctx.stroke(); ctx.restore();
    }
  };
  // straight furrows, broken wherever a stone's rings take over
  for(let y=s*0.5; y<h; y+=s){
    let segs=[[0,w]];
    for(const t of stones){
      if(y < t.y-t.pad || y > t.y+t.h+t.pad) continue;
      const a=t.x-t.pad, b=t.x+t.w+t.pad;
      segs=segs.flatMap(([x0,x1]) => x1<=a || x0>=b ? [[x0,x1]]
        : [[x0,Math.max(x0,a)],[Math.min(x1,b),x1]].filter(([p,q])=>q-p>1));
    }
    groove(()=>{ for(const [x0,x1] of segs){ ctx.moveTo(x0,y); ctx.lineTo(x1,y); } });
  }
  // rings around each stone. Each ring is the stone's outline OFFSET outward,
  // so its corner radius grows with its distance — the path a rake actually
  // takes walking around a rock. Sharp right angles read as drafting.
  const ringPath=(x,y,rw,rh,rad)=>{
    rad=Math.min(rad, rw/2, rh/2);
    ctx.moveTo(x+rad,y); ctx.lineTo(x+rw-rad,y); ctx.arcTo(x+rw,y,x+rw,y+rad,rad);
    ctx.lineTo(x+rw,y+rh-rad); ctx.arcTo(x+rw,y+rh,x+rw-rad,y+rh,rad);
    ctx.lineTo(x+rad,y+rh); ctx.arcTo(x,y+rh,x,y+rh-rad,rad);
    ctx.lineTo(x,y+rad); ctx.arcTo(x,y,x+rad,y,rad); ctx.closePath();
  };
  for(const t of stones){
    const core=Math.min(t.w,t.h)*0.45;                 // the stone's own roundness
    for(let r=1;r<=rings;r++){
      const o=r*s;
      groove(()=>ringPath(t.x-o, t.y-o, t.w+o*2, t.h+o*2, core+o));
    }
    // the stone itself, dark and a little uneven
    ctx.globalAlpha=0.55; ctx.fillStyle='rgb(40,40,40)';
    ctx.beginPath();
    const cx=t.x+t.w/2, cy=t.y+t.h/2, k=9;
    for(let i=0;i<=k;i++){
      const a=(i/k)*Math.PI*2, jit=0.86+Math.random()*0.2;
      const px=cx+Math.cos(a)*t.w/2*jit, py=cy+Math.sin(a)*t.h/2*jit;
      i?ctx.lineTo(px,py):ctx.moveTo(px,py);
    }
    ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha=1;
  return c;
}

// Light through water:
// shallow, it nets the floor in fire;
// deep, it only fades.
export function genWater(w,h,amt,zoom,light){
  amt=(amt==null?0.35:amt); zoom=(zoom==null?1:zoom);
  const {lx,ly}=lightVec(light);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d');

  // Computed at a third of full resolution and scaled up, like the clouds.
  const div=3, ww=Math.ceil(w/div), wh=Math.ceil(h/div);
  const unit=Math.min(ww,wh);

  // WAVINESS sets the size of the waves AND of the caustic cells, so the two
  // knobs stay coherent: bigger swells throw bigger nets of light.
  const cell=Math.max(6, unit*0.06*zoom);
  const waves=[];
  for(let i=0;i<5;i++){
    const a=Math.random()*Math.PI*2, len=cell*(2.2+Math.random()*3.5);
    waves.push({kx:Math.cos(a)*2*Math.PI/len, ky:Math.sin(a)*2*Math.PI/len,
                ph:Math.random()*6.28, amp:1/(i+1.5)});
  }
  // feature points for the cellular noise that makes the caustic web
  // Two nets at different scales. Real caustics are several overlapping webs
  // of bent light, not one tiling; the second, finer net gives the knots and
  // interference where the lines cross.
  const makeNet=(size)=>{
    const gx=Math.ceil(ww/size)+4, gy=Math.ceil(wh/size)+4;
    const fx=new Float32Array(gx*gy), fy=new Float32Array(gx*gy);
    for(let i=0;i<gx*gy;i++){ fx[i]=Math.random(); fy[i]=Math.random(); }
    return {size, gx, gy, fx, fy, ph:[Math.random()*6.28, Math.random()*6.28, Math.random()*6.28, Math.random()*6.28]};
  };
  const nets=[makeNet(cell), makeNet(cell*0.62)];
  // one net's brightness at a point: near its cell borders, after the point
  // has been bent by the waves — bent HARD, so borders become curving
  // filaments rather than the straight polygon edges of a crackle
  const webAt=(net, x, y, dx, dy)=>{
    const z=net.size, ph=net.ph;
    let qx=x/z, qy=y/z;
    qx += 0.42*Math.sin(qy*2.3+ph[0]) + 0.26*Math.sin((qx+qy)*1.7+ph[1]) + dx*0.9;
    qy += 0.42*Math.sin(qx*2.1+ph[2]) + 0.26*Math.sin((qx-qy)*1.9+ph[3]) + dy*0.9;
    qx += 2; qy += 2;
    const cx0=Math.floor(qx), cy0=Math.floor(qy);
    let f1=9, f2=9;
    for(let oy=-1;oy<=1;oy++) for(let ox=-1;ox<=1;ox++){
      const cxi=cx0+ox, cyi=cy0+oy;
      if(cxi<0||cyi<0||cxi>=net.gx||cyi>=net.gy) continue;
      const k=cyi*net.gx+cxi, ddx=cxi+net.fx[k]-qx, ddy=cyi+net.fy[k]-qy, dist=ddx*ddx+ddy*ddy;
      if(dist<f1){ f2=f1; f1=dist; } else if(dist<f2) f2=dist;
    }
    return Math.sqrt(f2)-Math.sqrt(f1);
  };

  // DEPTH crosses over with no dead zone: caustics fade out across 0.30–0.66
  // while murk rises across 0.34–0.70, so the middle always holds some of each.
  const depth=Math.max(0,Math.min(1,amt));
  const sstep=(a,b,x)=>{ const t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); };
  const caustic=1-sstep(0.30,0.66,depth);
  const murk=sstep(0.34,0.70,depth);
  const ridgeW=0.05+depth*0.22;                    // deeper water blurs the web

  const small=document.createElement('canvas'); small.width=ww; small.height=wh;
  const sctx=small.getContext('2d');
  const img=sctx.createImageData(ww,wh), d=img.data;
  for(let py=0;py<wh;py++){
    for(let px=0;px<ww;px++){
      // the surface: its slope lights the wave faces and bends the light below
      let dx=0, dy=0, hgt=0;
      for(const v of waves){
        const t=v.kx*px+v.ky*py+v.ph, s=Math.cos(t)*v.amp;
        dx+=s*v.kx; dy+=s*v.ky; hgt+=Math.sin(t)*v.amp;
      }
      // light slanting in shifts where the caustics fall on the floor
      const sx=px + lx*cell*0.35, sy=py + ly*cell*0.35;
      const slopeX=dx*cell*0.6, slopeY=dy*cell*0.6;
      const w1=1-sstep(0,ridgeW,webAt(nets[0], sx, sy, slopeX, slopeY));
      const w2=1-sstep(0,ridgeW*0.8,webAt(nets[1], sx, sy, -slopeY, slopeX));
      // where the two nets cross the light piles up into bright knots
      const web=Math.min(1, Math.pow(w1,1.3)*0.85 + Math.pow(w2,1.3)*0.55 + w1*w2*0.9);
      const face=(dx*lx+dy*ly)*cell*0.5;                  // wave faces toward the light
      let val=128 + web*105*caustic + Math.max(-1,Math.min(1,face))*16;
      // murk: light is absorbed, the floor disappears into a slow dark swell
      val = val*(1-murk*0.55) + (128 - 46*murk + hgt*10*murk)*murk*0.55;
      const i4=(py*ww+px)*4;
      d[i4]=d[i4+1]=d[i4+2]=Math.max(0,Math.min(255,val)); d[i4+3]=255;
    }
  }
  sctx.putImageData(img,0,0);
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(small,0,0,w,h);
  return c;
}
