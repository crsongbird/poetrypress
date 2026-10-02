/**
 * texTouch.js — 🜚 Touch. Surface: what the page is made of.
 *
 * Contact. Relief rather than image, so these take a light direction and
 * blend through soft-light. Linen, cold press, foxing, fold ghost, cup
 * ring, poured wax, raked substrate.
 */
import { drawStitch, pathFromPoints } from './stitches.js';
import { lightVec, parseHex, CPU, canonDiv, scaleNow, cpx } from './texCore.js';

// Weave keyframes: silk → twill → linen → canvas → burlap
//   pitch   thread spacing (of the page)   tw     thread width (of the pitch)
//   slub    how lumpy threads are           sheen  silk's highlight
//   pattern 0 satin floats · 1 twill · 2 plain     fuzz   burlap's hairs
const WEAVES = [
  // pitch varies only a little: SCALE zooms; WEAVE changes the cloth itself
  { at:0.00, pitch:0.0060, tw:0.97, slub:0.03, sheen:1.0, pattern:0, fuzz:0.00, round:0.55 },  // silk: satin floats, flat & glossy
  { at:0.25, pitch:0.0062, tw:0.92, slub:0.10, sheen:0.4, pattern:1, fuzz:0.05, round:0.8 },   // twill: diagonal ribs
  { at:0.50, pitch:0.0066, tw:0.84, slub:0.45, sheen:0.15,pattern:2, fuzz:0.12, round:1.0 },   // linen: plain, slubby
  { at:0.75, pitch:0.0074, tw:0.93, slub:0.18, sheen:0.08,pattern:2, fuzz:0.18, round:1.15 },  // canvas: plain, tight, round
  { at:1.00, pitch:0.0090, tw:0.62, slub:0.60, sheen:0.0, pattern:2, fuzz:0.6,  round:1.3 },   // burlap: open, hairy
];
function weaveAt(f){
  f=Math.max(0,Math.min(1,f)); let i=0; while(i<WEAVES.length-2 && f>WEAVES[i+1].at) i++;
  const a=WEAVES[i], b=WEAVES[i+1], t=(f-a.at)/(b.at-a.at), o={};
  for(const k of Object.keys(a)) o[k]=a[k]+(b[k]-a[k])*t;
  // the over-under pattern is BLENDED, not switched: both are shaded and mixed
  o.patA=a.pattern; o.patB=b.pattern; o.mix=t;
  return o;
}
export function genLinenTooth(w,h,amt,zoom,light,tint1,tint2,form){
  amt=(amt==null?0.35:amt); zoom=(zoom==null?1:zoom);
  const W=weaveAt(form==null?0.5:form);
  const {lx,ly}=lightVec(light);
  const F=parseHex(tint1||'#808080'), Lc=parseHex(tint2||'#FFFFFF');
  // A woven cloth, lit. Each thread is a rounded bump catching the light as it
  // rises over its neighbour and dips under the next. WEAVE runs silk → twill
  // → linen → canvas → burlap. DETAILS runs stitching → slubs → buttons →
  // rivets. Fabric Hue colours the cloth, Light Hue the light on it; mid-grey
  // and white (the defaults) leave it a neutral texture.
  // Threads are finer than a preview's pixels, so the weave is always computed
  // on the EXPORT's grid and scaled down — the one texture that may work finer
  // than the canvas it is drawn on (otherwise a small preview aliases into
  // moiré). It costs a preview what it costs the export; textures are cached
  // and only regenerate when a knob moves.
  const div=2*scaleNow(), ww=Math.ceil(w/div), wh=Math.ceil(h/div), unitW=Math.min(ww,wh);
  const p=Math.max(2, unitW*W.pitch*zoom);
  // per-thread lumps (slubs): smooth 1D noise along each thread
  const seedA=Math.random()*1000, seedB=Math.random()*1000;
  const hash=n=>{ const s=Math.sin(n*127.1+seedA)*43758.5453; return s-Math.floor(s); };
  const lump=(i,t)=>{ const a=Math.floor(t), f=t-a, u=f*f*(3-2*f); return hash(i*31.7+a)*(1-u)+hash(i*31.7+a+1)*u; };
  // DETAILS weights along stitching → slubs → buttons → rivets
  const tri=(x,c,r)=>Math.max(0,1-Math.abs(x-c)/r);
  const dS=tri(amt,0.15,0.2), dL=tri(amt,0.42,0.22), dB=tri(amt,0.68,0.22), dR=tri(amt,0.95,0.22);
  const slubAmp=W.slub*(0.35+1.6*dL);
  const small=document.createElement('canvas'); small.width=ww; small.height=wh;
  const sctx=small.getContext('2d', CPU), img=sctx.createImageData(ww,wh), d=img.data;
  const top=(pat,i,j)=> pat===2 ? ((i+j)&1)===0 : pat===1 ? ((((i-j)%3)+3)%3)<2 : ((i*2+j)%5)===0;
  // the shade and highlight of one point under one over-under pattern
  const shadeUnder=(pat,i,j,fu,fv,aw,af,inW,inF)=>{
    const warpTop=top(pat,i,j);
    let nx=0, ny=0, ht=0;
    if((warpTop && inW) || (inW && !inF)){ ht=Math.pow(Math.max(0,1-aw*aw),0.5*W.round)*(0.78+0.22*Math.sin(Math.PI*fv)); nx=aw*0.9*W.round; ny=Math.cos(Math.PI*fv)*0.3*(warpTop?1:-1); }
    else if(inF){ ht=Math.pow(Math.max(0,1-af*af),0.5*W.round)*(0.78+0.22*Math.sin(Math.PI*fu)); ny=af*0.9*W.round; nx=Math.cos(Math.PI*fu)*0.3*(warpTop?-1:1); }
    if(ht>0){
      const lit=-(nx*lx+ny*ly);
      const along = (warpTop && inW) || (inW && !inF) ? (fu*7.0 + i*3.1) : (fv*7.0 + j*2.7);
      const fibre = 0.93 + 0.14*hash(Math.floor(along)*17.3 + (inW ? i : j));
      return [(0.82+0.16*ht+0.32*lit)*fibre, W.sheen*Math.pow(Math.max(0,lit),6)*0.55];
    }
    const edge=Math.min(Math.abs(Math.abs(aw)-1)*W.tw, Math.abs(Math.abs(af)-1)*W.tw);
    return [0.68-Math.min(0.3, edge*1.4), 0];
  };
  for(let y=0;y<wh;y++) for(let x=0;x<ww;x++){
    // threads are never straight: each wanders a little as it goes
    const u0=x/p, v0=y/p, wob=0.08+W.slub*0.18;
    const u=u0+wob*Math.sin(v0*0.45+Math.floor(u0)*1.7), v=v0+wob*Math.sin(u0*0.45+Math.floor(v0)*2.3);
    const i=Math.floor(u), j=Math.floor(v), fu=u-i, fv=v-j;
    const thW=W.tw*(1+slubAmp*(lump(i, v*0.11+seedB)-0.5)*1.6), thF=W.tw*(1+slubAmp*(lump(j+500, u*0.11)-0.5)*1.6);
    const aw=(fu-0.5)/(thW/2), af=(fv-0.5)/(thF/2);
    const inW=Math.abs(aw)<1, inF=Math.abs(af)<1;
    let [shade, spec]=shadeUnder(W.patA,i,j,fu,fv,aw,af,inW,inF);
    if(W.patB!==W.patA && W.mix>0){
      const [s2, p2]=shadeUnder(W.patB,i,j,fu,fv,aw,af,inW,inF);
      shade=shade+(s2-shade)*W.mix; spec=spec+(p2-spec)*W.mix;
    }
    if(W.fuzz>0) shade+= (Math.random()-0.5)*W.fuzz*0.25;
    const k=(y*ww+x)*4;
    d[k]  =Math.max(0,Math.min(255, F.r*shade*(1+(Lc.r/255-1)*0.3) + Lc.r*spec));
    d[k+1]=Math.max(0,Math.min(255, F.g*shade*(1+(Lc.g/255-1)*0.3) + Lc.g*spec));
    d[k+2]=Math.max(0,Math.min(255, F.b*shade*(1+(Lc.b/255-1)*0.3) + Lc.b*spec));
    d[k+3]=255;
  }
  sctx.putImageData(img,0,0);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU); ctx.imageSmoothingEnabled=true; ctx.drawImage(small,0,0,w,h);
  const unit=Math.min(w,h), tone=(o,a)=>`rgba(${o.r|0},${o.g|0},${o.b|0},${a})`;
  const dark={r:F.r*0.3,g:F.g*0.3,b:F.b*0.3};
  // thread for stitching: pale, leaning toward the light's colour
  const thread={r:Math.min(255,F.r*0.45+Lc.r*0.6), g:Math.min(255,F.g*0.45+Lc.g*0.6), b:Math.min(255,F.b*0.45+Lc.b*0.5)};
  // DETAILS live on SEAMS, as on real clothes: stitching runs along them,
  // rivets are set into them; buttons sit between.
  // the seam stitch for this cloth, chosen by its seed
  const SEAM_STITCHES=['running','zigzag','cross','feather','chain','blanket','wave','diamond'];
  const seamStitch=SEAM_STITCHES[Math.floor(Math.random()*SEAM_STITCHES.length)];
  const seams=[]; const ns=2+Math.floor(Math.random()*2);
  for(let k=0;k<ns;k++) seams.push({ vert:Math.random()<0.5, at:(0.14+Math.random()*0.72) });
  const seamOn = Math.max(dS, dR, dL*0.4);
  for(const sm of seams){
    const at=sm.at*(sm.vert?w:h), len=sm.vert?h:w, gw=unit*0.012*zoom;
    const P=(t,o)=> sm.vert ? [at+o, t] : [t, at+o];
    // the seam pressed into the cloth: a soft groove, a lit ridge beside it
    if(seamOn>0.02){
      ctx.lineCap='butt';
      ctx.strokeStyle=tone(dark,0.22*seamOn); ctx.lineWidth=gw;
      ctx.beginPath(); ctx.moveTo(...P(0,0)); ctx.lineTo(...P(len,0)); ctx.stroke();
      const ox=(sm.vert?lx:ly)*gw*0.7;
      ctx.strokeStyle=`rgba(255,255,255,${0.10*seamOn})`; ctx.lineWidth=gw*0.5;
      ctx.beginPath(); ctx.moveTo(...P(0,-ox)); ctx.lineTo(...P(len,-ox)); ctx.stroke();
    }
    // stitching: raised thread, lit on one side and shadowed on the other;
    // a second row joins it as the details grow
    if(dS>0.02 || dR>0.02){
      const sw=Math.max(dS, dR*0.8), rows=(amt>0.25?2:1), tw=cpx(5)*zoom;
      for(let r=0;r<rows;r++){
        const off=(rows===2 ? (r?1:-1)*gw*1.1 : gw*0.9);
        const [ax,ay]=P(0,off), [bx,by]=P(len,off);
        // the seam's stitch, chosen by the texture seed (stitches.js), drawn as
        // raised thread: a shadow, the thread, a highlight
        const sp={ period:unit*0.02*zoom, amp:unit*0.006*zoom, width:tw, side:(r?-1:1) };
        drawStitch(ctx, pathFromPoints([[ax-lx*tw*0.45,ay-ly*tw*0.45],[bx-lx*tw*0.45,by-ly*tw*0.45]], false), seamStitch, { ...sp, color:`rgba(0,0,0,${0.35*sw})` });
        drawStitch(ctx, pathFromPoints([[ax,ay],[bx,by]], false), seamStitch, { ...sp, color:tone(thread,0.95*sw) });
        drawStitch(ctx, pathFromPoints([[ax+lx*tw*0.18,ay+ly*tw*0.18],[bx+lx*tw*0.18,by+ly*tw*0.18]], false), seamStitch, { ...sp, width:tw*0.35, color:`rgba(255,255,255,${0.3*sw})` });
      }
    }
    // rivets: copper, set into the seam, a ring, a glint, a shadow
    if(dR>0.02){
      const step=unit*0.07*zoom, r=unit*0.0085*zoom;
      for(let t=step*0.6;t<len;t+=step){
        const [x,y]=P(t,0);
        ctx.globalAlpha=dR;
        ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.arc(x-lx*r*0.35,y-ly*r*0.35,r*1.15,0,Math.PI*2); ctx.fill();
        const g=ctx.createRadialGradient(x+lx*r*0.5,y+ly*r*0.5,r*0.05,x,y,r);
        g.addColorStop(0,'rgb(255,226,190)'); g.addColorStop(0.3,'rgb(205,128,72)'); g.addColorStop(1,'rgb(96,48,22)');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='rgba(60,28,10,0.6)'; ctx.lineWidth=r*0.14; ctx.beginPath(); ctx.arc(x,y,r*0.62,0,Math.PI*2); ctx.stroke();
        ctx.globalAlpha=1;
      }
    }
  }
  // buttons: a bevelled rim, a dished centre, thread through the holes
  if(dB>0.02){
    const n=Math.round(3+Math.random()*4);
    for(let k=0;k<n;k++){
      const x=Math.random()*w, y=Math.random()*h, r=unit*(0.024+Math.random()*0.014)*zoom;
      ctx.globalAlpha=dB;
      const sh=ctx.createRadialGradient(x-lx*r*0.25,y-ly*r*0.25,r*0.6,x-lx*r*0.25,y-ly*r*0.25,r*1.35);
      sh.addColorStop(0,'rgba(0,0,0,0.5)'); sh.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=sh; ctx.beginPath(); ctx.arc(x-lx*r*0.25,y-ly*r*0.25,r*1.35,0,Math.PI*2); ctx.fill();
      const body={r:F.r*0.8+30,g:F.g*0.8+28,b:F.b*0.8+24};
      const rim=ctx.createLinearGradient(x+lx*r,y+ly*r,x-lx*r,y-ly*r);
      rim.addColorStop(0,tone({r:Math.min(255,body.r*1.45),g:Math.min(255,body.g*1.45),b:Math.min(255,body.b*1.45)},1)); rim.addColorStop(1,tone({r:body.r*0.55,g:body.g*0.55,b:body.b*0.55},1));
      ctx.fillStyle=rim; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
      const dish=ctx.createLinearGradient(x-lx*r,y-ly*r,x+lx*r,y+ly*r);       // the centre dips: lit on the far side
      dish.addColorStop(0,tone({r:Math.min(255,body.r*1.25),g:Math.min(255,body.g*1.25),b:Math.min(255,body.b*1.25)},1)); dish.addColorStop(1,tone({r:body.r*0.75,g:body.g*0.75,b:body.b*0.75},1));
      ctx.fillStyle=dish; ctx.beginPath(); ctx.arc(x,y,r*0.74,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=tone(dark,0.9);
      for(const [hx,hy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ ctx.beginPath(); ctx.arc(x+hx*r*0.24,y+hy*r*0.24,r*0.09,0,Math.PI*2); ctx.fill(); }
      ctx.strokeStyle=tone(thread,0.95); ctx.lineWidth=r*0.1; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(x-r*0.24,y-r*0.24); ctx.lineTo(x+r*0.24,y+r*0.24); ctx.moveTo(x+r*0.24,y-r*0.24); ctx.lineTo(x-r*0.24,y+r*0.24); ctx.stroke();
      ctx.globalAlpha=1;
    }
  }
  return c;
}

// The paper says no
// to the pencil, very softly,
// ten thousand times.
export function genColdPress(w,h,amt,zoom,light){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const {lx,ly} = lightVec(light);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU);
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);

  // dimples, not grain: each pit gets a lit rim and a shadowed floor, which
  // is what separates this from Waking Grain's flat contrast noise
  // At most 16,000 pits: each is several canvas calls, and uncapped the
  // smallest tooth asked for millions — enough to stall a phone. Past the
  // cap the tooth grows instead of multiplying.
  const MAX_PITS = 16000;
  let r = Math.max(0.8, (Math.max(w,h)/700) * zoom);
  r = Math.max(r, Math.sqrt((w*h*amt) / (13*MAX_PITS)));
  const count = Math.min(MAX_PITS, Math.round((w*h)/(r*r*13) * amt));
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
  const ctx=c.getContext('2d', CPU);
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
  const ctx=c.getContext('2d', CPU);
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
      ctx.lineWidth = Math.max(cpx(0.5), soft * (0.35 + depth*0.8));
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
  const ctx=c.getContext('2d', CPU);
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);

  const unit=Math.min(w,h);
  const rings = Math.max(1, Math.round((1+Math.random()*2)*amt));
  for(let i=0;i<rings;i++){
    const cx=w*(0.15+Math.random()*0.7), cy=h*(0.15+Math.random()*0.7);
    const R=unit*(0.10+Math.random()*0.10)*zoom;
    const gapAt=Math.random()*Math.PI*2;
    const gapW=0.5+Math.random()*0.9;      // where the cup was lifted and dragged
    // the rim holds far more stain than the interior
    ctx.lineWidth=Math.max(cpx(1.2), R*0.075);
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
  const ctx=c.getContext('2d', CPU);
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
        ctx.globalAlpha=al; ctx.strokeStyle=col; ctx.lineWidth=Math.max(cpx(0.6),R*0.018); ctx.stroke();
      }
    }
    // the domed sheen and the raised rim
    const g=ctx.createRadialGradient(cx-lx*R*0.35,cy-ly*R*0.35,R*0.05,cx,cy,R*1.1);
    g.addColorStop(0,'rgba(255,255,255,0.22)'); g.addColorStop(0.55,'rgba(255,255,255,0.03)'); g.addColorStop(1,'rgba(0,0,0,0.22)');
    outline(1); ctx.globalAlpha=0.9; ctx.fillStyle=g; ctx.fill();
    ctx.globalAlpha=0.4; ctx.lineWidth=Math.max(cpx(0.8),R*0.05); ctx.strokeStyle='rgba(20,10,10,0.8)'; ctx.stroke();
  }
  ctx.globalAlpha=1;
  return c;
}

// Never the whole print —
// just enough ridge to prove that
// a hand was here once.
export function genWhorl(w,h,amt,zoom,light,tint1,tint2){
  zoom=(zoom==null?1:zoom);
  const stones=Math.max(1,Math.min(8,Math.round((amt==null?0.03:amt)*100)));  // the knob is 1–8
  const {lx,ly}=lightVec(light);
  const sand=parseHex(tint1||'#D6C7A8'), glow=parseHex(tint2||'#FFF3DC');
  const lum=(sand.r*0.299+sand.g*0.587+sand.b*0.114)/255;
  // stones: a very dark version of the sand, or a light one if the sand is dark
  const stone = lum>0.35 ? {r:sand.r*0.2, g:sand.g*0.2, b:sand.b*0.21}
                         : {r:sand.r+(255-sand.r)*0.78, g:sand.g+(255-sand.g)*0.78, b:sand.b+(255-sand.b)*0.78};
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU);

  // A raked garden. Sand, a few stones, and ONE rake path: rings round each
  // stone that merge where stones sit close, relaxing into gentle parallel
  // curves away from them. All of it comes from a single distance field, so
  // the grooves never cross or break. GRAIN sets both how fine the sand is
  // and how close the rake lines run. Computed at a quarter resolution; the
  // sand grain is laid over at full resolution afterwards.
  const div=canonDiv(4), ww=Math.ceil(w/div), wh=Math.ceil(h/div), unit=Math.min(ww,wh);
  // rake spacing: wide enough that the grooves resolve cleanly at the
  // working resolution (tighter ones shimmered into moiré)
  const sp=Math.max(1.5, unit*0.021*zoom);
  const rings=4;
  const S=[];
  for(let tries=0; tries<stones*40 && S.length<stones; tries++){
    const rx=unit*(0.035+Math.random()*0.045), ry=rx*(0.6+Math.random()*0.35);
    const x=ww*(0.1+Math.random()*0.8), y=wh*(0.1+Math.random()*0.8);
    if(S.some(t=>Math.hypot(t.x-x,t.y-y) < (t.rx+rx)*1.25)) continue;
    const a=Math.random()*Math.PI;
    S.push({x,y,rx,ry,ca:Math.cos(a),sa:Math.sin(a),h1:Math.random()*6.28,h2:Math.random()*6.28});
  }
  // normalised radius to a stone: 1 on its (slightly irregular) edge
  const q=(t,px,py)=>{ const dx=px-t.x, dy=py-t.y, u=(dx*t.ca+dy*t.sa)/t.rx, v=(-dx*t.sa+dy*t.ca)/t.ry;
    const ang=Math.atan2(v,u); return Math.sqrt(u*u+v*v)/(1+0.07*Math.sin(ang*3+t.h1)+0.04*Math.sin(ang*5+t.h2)); };
  const shadowLen=unit*0.02;
  const small=document.createElement('canvas'); small.width=ww; small.height=wh;
  const sctx=small.getContext('2d', CPU); const img=sctx.createImageData(ww,wh), d=img.data;
  const wave=Math.random()*6.28;
  for(let py=0;py<wh;py++) for(let px=0;px<ww;px++){
    let dmin=1e9, inStone=null, qs=9, shade=0;
    for(const t of S){
      const qq=q(t,px,py), dist=(qq-1)*Math.min(t.rx,t.ry);
      // smooth minimum, so the rings of neighbouring stones flow together
      dmin = dmin===1e9 ? dist : -sp*1.5*Math.log(Math.exp(-dmin/(sp*1.5))+Math.exp(-dist/(sp*1.5)));
      if(qq<1 && qq<qs){ qs=qq; inStone=t; }
      // its shadow, cast away from the light
      const sq=q(t,px+lx*shadowLen,py+ly*shadowLen);
      if(sq<1.12) shade=Math.max(shade, 1-Math.max(0,(sq-0.92)/0.2));
    }
    let r,g,b;
    if(inStone){
      // the stone: lit on the side facing the light
      const nx=(px-inStone.x)/inStone.rx, ny=(py-inStone.y)/inStone.ry, nl=Math.hypot(nx,ny)||1;
      const lit=Math.max(0,-(nx*lx+ny*ly)/nl)*0.9*(1-qs*0.3)+0.25;
      r=stone.r*(0.6+lit); g=stone.g*(0.6+lit); b=stone.b*(0.6+lit);
    } else {
      // the rake: rings near the stones, blending into gentle parallel curves
      // a long, gentle handover from rings to lines, so grooves never bunch
      const reach=sp*rings, far=sstepZ(reach, reach*2.1, dmin);
      const straight=py + Math.sin(px/(unit*0.23)+wave)*sp*1.4;
      const F=dmin*(1-far) + straight*far;
      const groove=Math.sin(F/sp*6.2832);
      const k=groove>0 ? groove*0.45 : groove*0.22;         // ridges catch light
      r=sand.r+(k>0?(glow.r-sand.r)*k:sand.r*k); g=sand.g+(k>0?(glow.g-sand.g)*k:sand.g*k); b=sand.b+(k>0?(glow.b-sand.b)*k:sand.b*k);
      const sh=1-shade*0.42; r*=sh; g*=sh; b*=sh;
    }
    const i4=(py*ww+px)*4; d[i4]=r; d[i4+1]=g; d[i4+2]=b; d[i4+3]=255;
  }
  sctx.putImageData(img,0,0);
  ctx.imageSmoothingEnabled=true; ctx.drawImage(small,0,0,w,h);

  // the sand itself: rounded grains, lit from the light, laid over the whole
  // garden at full resolution from one small tile
  const T=128, tile=document.createElement('canvas'); tile.width=T; tile.height=T;
  const tc=tile.getContext('2d', CPU), ti=tc.createImageData(T,T), td=ti.data, hgt=new Float32Array(T*T);
  for(let i=0;i<T*T;i++) hgt[i]=Math.random();
  for(let y=0;y<T;y++) for(let x=0;x<T;x++){
    const at=(xx,yy)=>hgt[((yy+T)%T)*T+((xx+T)%T)];
    const s=(at(x,y)*2+at(x+1,y)+at(x-1,y)+at(x,y+1)+at(x,y-1))/6;     // rounded
    const gx=at(x+1,y)-at(x-1,y), gy=at(x,y+1)-at(x,y-1);
    const v=128+(gx*lx+gy*ly)*-70+(s-0.5)*40;
    const i4=(y*T+x)*4; td[i4]=td[i4+1]=td[i4+2]=v; td[i4+3]=255;
  }
  tc.putImageData(ti,0,0);
  const gs=Math.max(1,Math.round(2*zoom))*T/T;           // grain size, in page pixels per tile pixel
  ctx.globalCompositeOperation='overlay'; ctx.globalAlpha=0.5;
  const tsz=T*gs*scaleNow();                              // the tile, in canonical pixels
  for(let y=0;y<h;y+=tsz) for(let x=0;x<w;x+=tsz) ctx.drawImage(tile,x,y,tsz,tsz);
  ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;
  return c;
}
function sstepZ(a,b,x){ const t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); }

// Light through water:
// shallow, it nets the floor in fire;
// deep, it only fades.
export function genWater(w,h,amt,zoom,light){
  amt=(amt==null?0.35:amt); zoom=(zoom==null?1:zoom);
  const {lx,ly}=lightVec(light);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU);

  // Computed at a quarter of full resolution and scaled up: caustics are soft
  // enough that nothing is lost, and it keeps the loop cheap on a phone.
  const div=canonDiv(4), ww=Math.ceil(w/div), wh=Math.ceil(h/div);
  const unit=Math.min(ww,wh);

  // Caustics by iterated warping: each point is pushed around by a few
  // interfering sine fields, and light gathers wherever the pushes agree —
  // which draws the bright, branching net seen on the floor of a pool. Far
  // cheaper than a cell search, and truer to how the light actually bends.
  // WAVINESS sets the scale of the net; the seed picks the moment in time.
  // Coordinates are offset far from zero (−250): the division inside the loop
  // is tuned to that range, and near zero the whole net flattens to nothing.
  const TAU=6.283185307, tile=unit*0.3*zoom;
  const t0=Math.random()*100;
  const ITER=5, inten=0.005;
  const ph1=Math.random()*6.28, ph2=Math.random()*6.28, ph3=Math.random()*6.28, ph4=Math.random()*6.28;

  // DEPTH crosses over with no dead zone: caustics fade out across 0.30–0.66
  // while murk rises across 0.34–0.70, so the middle always holds some of each.
  const depth=Math.max(0,Math.min(1,amt));
  const sstep=(a,b,x)=>{ const t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); };
  const caustic=1-sstep(0.30,0.66,depth);
  const murk=sstep(0.34,0.70,depth);
  const sharp=8-depth*5;                          // deeper water blurs the net
  // light slanting in shifts where the net falls
  const sx0=lx*unit*0.04, sy0=ly*unit*0.04;

  const small=document.createElement('canvas'); small.width=ww; small.height=wh;
  const sctx=small.getContext('2d', CPU);
  const img=sctx.createImageData(ww,wh), dd=img.data;
  for(let py=0;py<wh;py++){
    for(let px=0;px<ww;px++){
      // Every term below is periodic in 2π, so left alone the net repeats in a
      // visible grid. Slow waves at frequencies that share no period (0.73,
      // 0.41, 0.59, 0.37 of the tile) bend each point first, so no two regions
      // line up.
      const ux=(px+sx0)/tile, uy=(py+sy0)/tile;
      const wx=ux + 0.55*Math.sin(uy*0.73+ph1) + 0.35*Math.sin(ux*0.41+ph2);
      const wy=uy + 0.55*Math.sin(ux*0.59+ph3) + 0.35*Math.sin(uy*0.37+ph4);
      const x0=wx*TAU-250, y0=wy*TAU-250;
      let ix=x0, iy=y0, acc=1;
      for(let n=0;n<ITER;n++){
        const t=t0*(1-3.5/(n+1));
        const nx=x0+Math.cos(t-ix)+Math.sin(t+iy);
        const ny=y0+Math.sin(t-iy)+Math.cos(t+ix);
        ix=nx; iy=ny;
        const a=x0/(Math.sin(ix+t)/inten), b=y0/(Math.cos(iy+t)/inten);
        acc+=1/Math.sqrt(a*a+b*b);
      }
      acc/=ITER;
      let web=1.17-Math.pow(acc,1.4);
      web=Math.min(1,Math.pow(Math.abs(web),sharp));
      // a slow swell under it all: the surface's larger waves, lit from the light
      const swell=Math.sin(px/tile*1.3+t0)*Math.cos(py/tile*1.07-t0*0.5);
      let val=128 + web*110*caustic + swell*10;
      // murk: light is absorbed, the floor disappears into a dark swell
      val = val*(1-murk*0.55) + (128 - 46*murk + swell*12*murk)*murk*0.55;
      const i4=(py*ww+px)*4;
      dd[i4]=dd[i4+1]=dd[i4+2]=Math.max(0,Math.min(255,val)); dd[i4+3]=255;
    }
  }
  sctx.putImageData(img,0,0);
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(small,0,0,w,h);
  return c;
}
