/**
 * texTouch.js — 🜚 Touch. Surface: what the page is made of.
 *
 * Contact. Relief rather than image, so these take a light direction and
 * blend through soft-light. Linen, cold press, foxing, fold ghost, cup
 * ring, poured wax, raked substrate.
 */
import { drawStitch, pathFromPoints } from './stitches.js';
import { lightVec, parseHex, CPU, canonArea, canonDiv, scaleNow, cpx, makeNoiseGrid, sampleNoiseGrid, lightHeights, smoothField, litK, litS } from './texCore.js';

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
export function genFoldGhost(w,h,amt,zoom,light,form){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const crumple=Math.max(0,Math.min(1, form==null ? 0.3 : form));
  // Paper that was folded and carried in a pocket, then opened out flat.
  // A few long FOLDS cross the whole sheet — the first near the middle, the
  // next across it, as a sheet is halved and halved again — each a ridge or
  // a valley, with the paper tilting away on either side of it, so one side
  // catches the light and the other falls into shade. CRUMPLE adds the short,
  // random creases of being pressed in a pocket. Built as heights, lit by
  // lightHeights. CREASE DEPTH · FOLD COUNT · CRUMPLE
  const div=canonDiv(2), ww=Math.ceil(w/div), wh=Math.ceil(h/div), unit=Math.min(ww,wh);
  const H=new Float32Array(ww*wh);
  const depth=unit*0.004*zoom;
  // the long folds: a line through (px,py) at angle a; mountain or valley
  // HOW it was folded, chosen by the seed: in half and half again; in thirds,
  // like a letter; a letter then halved; or halved with a corner turned
  // down. Folded by hand, so every fold sits off-centre and a little askew.
  // (Each fold's offset moves it ACROSS the page — along its normal. An
  // offset along the fold's own length, as before, moved nothing, which is
  // why every fold used to cross the centre.)
  const nFolds=Math.max(1, Math.round(3*amt));
  const a0=Math.random()<0.5 ? 0 : Math.PI/2, scheme=Math.floor(Math.random()*4);
  const askew=()=>(Math.random()-0.5)*0.14, hand=s=>(Math.random()-0.5)*s, side=()=>Math.random()<0.5 ? 1 : -1;
  const plan=[];                                                // [angle, offset (share of the page), strength]
  if(scheme===0) plan.push([a0+askew(), hand(0.24), 1], [a0+Math.PI/2+askew(), hand(0.24), 1]);
  else if(scheme===1) plan.push([a0+askew(), -1/6+hand(0.08), 1], [a0+askew()*0.6, 1/6+hand(0.08), 1]);
  else if(scheme===2) plan.push([a0+askew(), -1/6+hand(0.08), 1], [a0+askew()*0.6, 1/6+hand(0.08), 1], [a0+Math.PI/2+askew(), hand(0.2), 0.8]);
  else plan.push([a0+askew(), hand(0.26), 1], [a0+side()*Math.PI/4+askew(), side()*(0.3+Math.random()*0.12), 0.8]);
  while(plan.length < nFolds) plan.push([Math.random()*Math.PI, hand(0.8), 0.5+Math.random()*0.5]);
  plan.splice(nFolds);
  const folds=plan.map(([a, off, str]) => {
    const nx=-Math.sin(a), ny=Math.cos(a), px=ww*(0.5 + off*nx), py=wh*(0.5 + off*ny);
    return { nx, ny, c: nx*px + ny*py, s: side(), d: depth*str, reach: unit*(0.06+Math.random()*0.06) };
  });
  // the crumples: short creases whose ends fade into the sheet
  const nCrum=Math.round(70*crumple*Math.max(0.4, amt));
  const crum=[];
  for(let k=0;k<nCrum;k++){
    const a=Math.random()*Math.PI, L=unit*(0.05+Math.random()*0.22), x=Math.random()*ww, y=Math.random()*wh;
    crum.push({ x, y, dx:Math.cos(a), dy:Math.sin(a), L, s:Math.random()<0.5?1:-1, d:depth*(0.25+Math.random()*0.45), reach:unit*(0.012+Math.random()*0.02) });
  }
  const fibre=fbmSampler(60, 2);
  for(let y=0;y<wh;y++) for(let x=0;x<ww;x++){
    let hv=(fibre(x/ww,y/wh)-0.5)*0.35;                         // the paper's own grain
    for(const f of folds){
      const dd=Math.abs(x*f.nx + y*f.ny - f.c);
      // a sharp crease, and the sheet tilting away from it on both sides
      hv += f.s*f.d*(Math.max(0, 1 - dd/(f.reach*0.08))*1.2 - Math.min(dd, f.reach)/f.reach);
    }
    for(const c of crum){
      const rx=x-c.x, ry=y-c.y, along=rx*c.dx + ry*c.dy;
      if(along < -c.L || along > c.L) continue;
      const across=Math.abs(-rx*c.dy + ry*c.dx);
      if(across > c.reach) continue;
      const fade=1 - Math.pow(along/c.L, 2);                    // the ends ease into the sheet
      hv += c.s*c.d*fade*(1 - across/c.reach);
    }
    H[y*ww+x]=hv;
  }
  const L=lightHeights(H, ww, wh, { light, relief:1, gloss:0.12, shadow:0.45, ao:0.25, ambient:0.45 });
  const flat=lightHeights(new Float32Array(1), 1, 1, { light, relief:1, gloss:0.12, shadow:0, ao:0, ambient:0.45 });
  const fl=flat.light[0]||1, fs=flat.spec[0];
  return paintLit(w,h,div,ww,wh, i => { const v=128 + (L.light[i]/fl - 1)*165 + (L.spec[i]-fs)*140; return [clamp255(v), clamp255(v), clamp255(v)]; });
}

// Someone set it down
// mid-sentence and forgot it.
// The ring is the proof.
export function genCupRing(w,h,amt,zoom,light,tint,M3){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const t = parseHex(tint || '#6B4A2F');
  // A dried coffee ring, lit. As a drop dries, the liquid flows outward and
  // carries the coffee to its edge (the coffee-ring effect): the stain gathers
  // in a slightly wobbly RIDGE at the rim, with only a faint wash inside, a gap
  // where the cup was lifted and dragged, and sometimes a second, fainter ring.
  // The dried film is a height field — thickest at the rim — lit by the dial:
  // the rim catches the light on one side, a soft shadow on the other, and a
  // gentle sheen. Dry paper stays neutral.
  const div=canonDiv(2), ww=Math.ceil(w/div), wh=Math.ceil(h/div), unit=Math.min(ww,wh);
  const rings=[];
  const nRings=Math.max(1, Math.round((1+Math.random()*2)*amt));
  for(let k=0;k<nRings;k++){
    const R=unit*(0.10+Math.random()*0.10)*zoom;
    const base={ cx:ww*(0.15+Math.random()*0.7), cy:wh*(0.15+Math.random()*0.7), R, gapAt:Math.random()*Math.PI*2, gapW:0.5+Math.random()*0.9,
                 w1:Math.random()*6.28, w2:Math.random()*6.28, strength:0.8+Math.random()*0.4 };
    rings.push(base);
    if(Math.random()<0.35) rings.push({ ...base, cx:base.cx + R*(Math.random()-0.5)*0.25, cy:base.cy + R*(Math.random()-0.5)*0.25,
                                        R:R*(0.97+Math.random()*0.06), strength:base.strength*0.35, w1:Math.random()*6.28 });
  }
  const D=new Float32Array(ww*wh);                          // stain density, 0..~1
  for(const g of rings){
    const pad=g.R*1.15, x0=Math.max(0,Math.floor(g.cx-pad)), x1=Math.min(ww-1,Math.ceil(g.cx+pad)), y0=Math.max(0,Math.floor(g.cy-pad)), y1=Math.min(wh-1,Math.ceil(g.cy+pad));
    const width=Math.max(0.8, g.R*0.035);
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
      const dx=x-g.cx, dy=y-g.cy, r=Math.hypot(dx,dy), a=Math.atan2(dy,dx);
      const Rw=g.R*(1 + 0.012*Math.sin(a*3+g.w1) + 0.008*Math.sin(a*7+g.w2));      // rims are never true circles
      const gapD=Math.abs(((a-g.gapAt+Math.PI*3)%(Math.PI*2))-Math.PI);
      const keep=gapD > Math.PI-g.gapW ? 0.12 : 1;
      const out=r-Rw;
      // the ridge: sharp outside (the contact line), tailing inward
      const ridge = out>0 ? Math.exp(-(out*out)/(width*width*0.35)) : Math.exp(-(out*out)/(width*width*2.2));
      const wash = r<Rw ? 0.08 + 0.06*(r/Rw) : 0;
      D[y*ww+x]=Math.min(1.2, D[y*ww+x] + (ridge*0.9*keep + wash)*g.strength);
    }
  }
  // the film's thickness follows the stain: a little ridge at the rim
  const H=new Float32Array(ww*wh); for(let i=0;i<H.length;i++) H[i]=D[i]*Math.max(0.6, unit*0.0045);
  const L=lightHeights(H, ww, wh, { light, relief:1, gloss:0.55, shadow:0.45, ao:0, ambient:0.4 });
  const flat=lightHeights(new Float32Array(1), 1, 1, { light, relief:1, gloss:0.55, shadow:0, ao:0, ambient:0.4 });
  const fl=flat.light[0]||1, fs=flat.spec[0];
  return paintLit(w,h,div,ww,wh, i => {
    const dn=Math.min(1, D[i]);
    if(dn<0.004) return [128,128,128];
    // the stain darkens toward its hue; the light lifts and shades the film
    const lit=c=>(litK(L,i,0.4,M3,c)/fl - 1)*dn*1.6, sh=(L.spec[i]-fs)*dn*180, S=c=>sh*litS(M3,c);
    // from paper grey toward the stain's own hue as the film thickens
    const r=128 + (t.r - 128)*dn*0.9, g2=128 + (t.g - 128)*dn*0.9, b=128 + (t.b - 128)*dn*0.9;
    return [clamp255(r + r*lit(0) + S(0)), clamp255(g2 + g2*lit(1) + S(1)), clamp255(b + b*lit(2) + S(2))];
  });
}

// It ran before it
// set, so the thick edge tells you
// which way the page leaned.
export function genPouredWax(w,h,amt,zoom,light,tint,form,M3){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const visc=Math.max(0,Math.min(1, form==null ? 0.45 : form));
  const wax=parseHex(tint||'#7A2B2B');
  // Sealing wax poured and left to set. Pour points and volumes come from the
  // seed; each pour spreads into a pool, and pools that meet MERGE into one
  // surface (a metaball field: the wax is wherever the summed pours reach a
  // threshold). The top is flat, the edge a rounded meniscus. Thin wax at the edges glows a little — it is
  // translucent. Lit by lightHeights with a satin sheen.
  // POOL SIZE · POOL COUNT · VISCOSITY (thin and spreading → thick and lumpy)
  const div=canonDiv(2), ww=Math.ceil(w/div), wh=Math.ceil(h/div), unit=Math.min(ww,wh);
  const n=Math.max(1, Math.round(3*amt));
  const spread=1.2 - 0.45*visc;                                  // thin wax runs wide
  const thick=unit*(0.004 + 0.009*visc);                         // and thick wax stands taller
  const pours=[];
  for(let k=0;k<n;k++){
    const V=0.4 + Math.random()*0.9;
    const R=unit*0.12*zoom*spread*Math.sqrt(V);
    const cx=ww*(0.1+Math.random()*0.8), cy=wh*(0.1+Math.random()*0.8);
    pours.push({ cx, cy, R, V, ph1:Math.random()*6.28, ph2:Math.random()*6.28, lobes:3+Math.floor(Math.random()*3) });
    // a pour runs on in a lobe or two: smaller blobs nudged downhill from it
    const runs=Math.floor(Math.random()*3*(1-visc*0.6));
    for(let r=0;r<runs;r++){ const a=Math.random()*6.28, d=R*(0.6+Math.random()*0.5);
      pours.push({ cx:cx+Math.cos(a)*d, cy:cy+Math.sin(a)*d, R:R*(0.35+Math.random()*0.3), V:V*0.5, ph1:Math.random()*6.28, ph2:Math.random()*6.28, lobes:3, run:true }); }
  }
  const lump=fbmSampler(5, 3);
  const F=new Float32Array(ww*wh);
  for(const p of pours){
    const reach=p.R*1.6, x0=Math.max(0,Math.floor(p.cx-reach)), x1=Math.min(ww-1,Math.ceil(p.cx+reach)), y0=Math.max(0,Math.floor(p.cy-reach)), y1=Math.min(wh-1,Math.ceil(p.cy+reach));
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
      const dx=x-p.cx, dy=y-p.cy, a=Math.atan2(dy,dx);
      const Rw=p.R*(1 + 0.12*Math.sin(a*p.lobes + p.ph1) + 0.06*Math.sin(a*7 + p.ph2));   // never a true circle
      const q=(dx*dx + dy*dy)/(Rw*Rw*2.2);
      if(q < 1) F[y*ww+x] += p.V*(1-q)*(1-q);
    }
  }
  const T0=0.16, T1=0.16 + 0.10 + 0.25*visc;                     // the meniscus: wider when thick
  const H=new Float32Array(ww*wh), M=new Float32Array(ww*wh);
  for(let y=0;y<wh;y++) for(let x=0;x<ww;x++){
    const i=y*ww+x, f=F[i];
    if(f <= T0) continue;
    const t=Math.min(1,(f-T0)/(T1-T0)), m=t*t*(3-2*t);
    M[i]=Math.min(1,(f-T0)/0.025);                               // coverage, antialiased at the edge
    // flat top, rounded edge; thick wax is lumpy, and rises a little where poured
    H[i]=thick*(m + visc*0.35*(lump(x/ww,y/wh)-0.5) + 0.25*Math.max(0, f - T1*1.6));
  }
  const L=lightHeights(H, ww, wh, { light, relief:1, gloss:0.62, shadow:0.45, ao:0.2, ambient:0.42 });
  const flat=lightHeights(new Float32Array(1), 1, 1, { light, relief:1, gloss:0.62, shadow:0, ao:0, ambient:0.42 });
  const fl=flat.light[0]||1, fs=flat.spec[0];
  return paintLit(w,h,div,ww,wh, i => {
    const k=L.light[i]/fl, m=M[i];
    if(m<=0){ const v=128 + (k - 1)*90; return [clamp255(v), clamp255(v), clamp255(v)]; }   // the paper, with the wax's shadow on it (neutral: it blends)
    const K=c=>litK(L,i,0.42,M3,c)/fl;
    const thin=1 - Math.min(1, H[i]/(thick*0.7));                // translucent where thin
    const glow=1 + 0.45*thin, sp=L.spec[i]*0.9*255;
    const c=[wax.r*glow*K(0) + sp*litS(M3,0), wax.g*glow*K(1) + sp*0.92*litS(M3,1), wax.b*glow*K(2) + sp*0.85*litS(M3,2)];
    const g=128 + (k-1)*90;
    return [clamp255(g*(1-m) + c[0]*m), clamp255(g*(1-m) + c[1]*m), clamp255(g*(1-m) + c[2]*m)];
  });
}

// Never the whole print —
// just enough ridge to prove that
// a hand was here once.
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

// ---------- Rain on Glass ----------
/**
 * Drops on a window, built as HEIGHTS and lit by lightHeights — so each one is
 * a real little dome: shaded away from the light, a highlight where the
 * dial's light catches it, darker at its steep rim. Outlines wobble; sizes
 * run from mist to fat runners (many tiny, few large); runners leave a thin
 * wet ridge and a trail of droplets. Dry glass stays neutral grey, so it
 * blends like the other grey-ground textures.
 * DROP SIZE · RAIN · CONDENSATION
 */
export function genGlassRain(w,h,amt,zoom,light,form){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const mist=Math.max(0,Math.min(1, form==null ? 0.3 : form));
  const div=canonDiv(2), ww=Math.ceil(w/div), wh=Math.ceil(h/div), unit=Math.min(ww,wh);
  const H=new Float32Array(ww*wh);
  // a drop: a wobbly dome, a little heavier at the bottom; heights combine by max
  const drop=(cx, cy, r)=>{
    const ph1=Math.random()*6.28, ph2=Math.random()*6.28, sag=1 + Math.min(0.35, r/(unit*0.05))*0.35;
    const x0=Math.max(0,Math.floor(cx-r*1.3)), x1=Math.min(ww-1,Math.ceil(cx+r*1.3)), y0=Math.max(0,Math.floor(cy-r*1.3)), y1=Math.min(wh-1,Math.ceil(cy+r*1.5*sag));
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
      const dx=x-cx, dy=(y-cy)/((y-cy) > 0 ? sag : 1), a=Math.atan2(dy,dx);
      const edge=r*(1 + 0.09*Math.sin(a*3+ph1) + 0.05*Math.sin(a*5+ph2));
      const q=Math.hypot(dx,dy)/edge; if(q>=1) continue;
      const hgt=r*0.5*Math.pow(1-q*q, 0.55), i=y*ww+x;
      if(hgt>H[i]) H[i]=hgt;
    }
  };
  // condensation: a mist of the smallest droplets
  const fine=Math.round(canonArea(w,h)/1800*mist/(div*div));
  for(let k=0;k<fine;k++) drop(Math.random()*ww, Math.random()*wh, Math.max(0.6, unit*(0.0012+Math.random()*0.0025)));
  // drops, from many tiny to a few large
  const n=Math.round((90+Math.random()*40)*amt);
  for(let k=0;k<n;k++){
    const r=unit*(0.003 + 0.042*Math.pow(Math.random(), 3))*zoom, x=Math.random()*ww, y=Math.random()*wh;
    if(r > unit*0.012 && Math.random()<0.5){
      // a runner: a thin wet ridge above it, droplets left along the way
      const len=r*(5+Math.random()*14), wob=Math.random()*6.28;
      for(let t=0;t<len;t+=Math.max(0.7, r*0.15)){
        const tx=x+Math.sin(t*0.08+wob)*r*0.3, ty=y-t, rr=r*0.16*(1 - t/len*0.5);
        drop(tx, ty, Math.max(0.6, rr));
        if(Math.random()<0.03) drop(tx + (Math.random()-0.5)*r*0.5, ty, r*(0.12+Math.random()*0.18));
      }
    }
    drop(x, y, Math.max(0.6, r));
  }
  const L=lightHeights(H, ww, wh, { light, relief:1.6, gloss:0.95, shadow:0.25, ao:0, ambient:0.55 });
  const flat=lightHeights(new Float32Array(1), 1, 1, { light, relief:1.6, gloss:0.95, shadow:0, ao:0, ambient:0.55 });
  const base=flat.light[0], baseSpec=flat.spec[0];
  return paintLit(w,h,div,ww,wh, i => {
    if(H[i] <= 0) return [128,128,128];                     // dry glass: neutral
    const v=128 + (L.light[i]-base)*210 + (L.spec[i]-baseSpec)*240;
    return [clamp255(v), clamp255(v), clamp255(v*1.01)];
  });
}

// ---------- textures lit by lightHeights (texCore): a surface, then its light ----------
// a smooth multi-octave noise sampler, on grids drawn from the seed
function fbmSampler(cells, octaves){
  const grids = [];
  for(let o = 0; o < octaves; o++){ const g = Math.max(2, Math.round(cells*Math.pow(2, o))) + 1; grids.push({ g, grid: makeNoiseGrid(g, g), amp: Math.pow(0.5, o) }); }
  const norm = grids.reduce((s, o) => s + o.amp, 0);
  return (u, v) => { let s = 0; for(const o of grids) s += sampleNoiseGrid(o.grid, o.g, o.g, u*(o.g - 1), v*(o.g - 1))*o.amp; return s/norm; };
}
// a lit surface, coloured per pixel and laid on the page
function paintLit(w, h, div, ww, wh, colour){
  const small = document.createElement('canvas'); small.width = ww; small.height = wh;
  const sctx = small.getContext('2d', CPU), img = sctx.createImageData(ww, wh), d = img.data;
  for(let i = 0; i < ww*wh; i++){ const c = colour(i); const k = i*4; d[k] = c[0]; d[k+1] = c[1]; d[k+2] = c[2]; d[k+3] = 255; }
  sctx.putImageData(img, 0, 0);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d', CPU); ctx.imageSmoothingEnabled = true; ctx.drawImage(small, 0, 0, w, h);
  return c;
}
const clamp255 = v => v < 0 ? 0 : v > 255 ? 255 : v;

/**
 * Dune Ripples — wind-blown sand. Ripples run across the wind with a gentle
 * windward slope and a steep lee face, bending and forking as the wind does,
 * over broad dune swells. The light dial is the sun: low light fills every
 * trough with shadow, overhead light flattens it all to glare.
 * RIPPLE SIZE · WIND (sharper, straighter, more asymmetric ripples) · DUNE HEIGHT
 */
export function genDunes(w,h,amt,zoom,light,tint1,tint2,form,M3){
  amt=(amt==null?0.5:amt); zoom=(zoom==null?1:zoom);
  const swell=Math.max(0,Math.min(1, form==null ? 0.4 : form));
  const sand=parseHex(tint1||'#D9B98C'), sun=parseHex(tint2||'#FFF1D8');
  const div=canonDiv(2), ww=Math.ceil(w/div), wh=Math.ceil(h/div), unit=Math.min(ww,wh);
  const lambda=Math.max(3, unit*0.032*zoom), wind=Math.random()*Math.PI, cw=Math.cos(wind), sw=Math.sin(wind);
  const warp=fbmSampler(2, 3), breakup=fbmSampler(6, 2), dunes=fbmSampler(1.4, 3), grain=fbmSampler(40, 1);
  const lee=0.34 - 0.22*Math.min(1, amt);                     // the steep face's share of each ripple
  const st=Math.max(2, Math.round(lambda/3));
  // wind straightens the ripples (less meander and forking) and raises sharper crests
  const meander=1.35 - 0.85*Math.min(1, amt), crest=0.65 + 0.8*Math.min(1, amt);
  const Wf=smoothField(ww,wh,st,(u,v)=>(3.2*warp(u,v) + 0.9*breakup(u,v))*meander), Af=smoothField(ww,wh,st,(u,v)=>breakup(u+0.37,v+0.11)), Df=smoothField(ww,wh,st*3,(u,v)=>dunes(u,v));
  const H=new Float32Array(ww*wh);
  for(let y=0;y<wh;y++) for(let x=0;x<ww;x++){
    const i=y*ww+x, ph=(x*cw + y*sw)/lambda + Wf[i];
    const t=ph - Math.floor(ph), prof = t < 1-lee ? t/(1-lee) : (1-t)/lee;
    H[i] = prof*lambda*0.16*crest*(0.55 + 0.6*Af[i]) + swell*unit*0.10*Df[i] + (grain(x/ww,y/wh)-0.5)*0.6;
  }
  const L=lightHeights(H, ww, wh, { light, relief:1, gloss:0.08, shadow:0.75, ao:0.25, ambient:0.38 });
  return paintLit(w,h,div,ww,wh, i => { const K=c=>litK(L,i,0.38,M3,c), s=L.spec[i]*0.4, S=c=>s*litS(M3,c);
    return [clamp255(sand.r*K(0)*1.05 + sun.r*S(0)), clamp255(sand.g*K(1)*1.05 + sun.g*S(1)), clamp255(sand.b*K(2)*1.05 + sun.b*S(2))]; });
}

/**
 * Kintsugi — glazed ceramic broken and mended with gold. Cracks follow the
 * edges of an organic, warped cell network (not every edge breaks), each
 * filled with a raised seam of gold. The glaze takes a glossy highlight; the
 * gold a bright metallic one, coloured by the gold itself.
 * SEAM WIDTH · FRACTURES · GLOSS
 */
export function genKintsugi(w,h,amt,zoom,light,tint1,tint2,form,M3){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const gloss=Math.max(0,Math.min(1, form==null ? 0.7 : form));
  const glaze=parseHex(tint1||'#E8E1D3'), gold=parseHex(tint2||'#D4AF37');
  const div=canonDiv(2), ww=Math.ceil(w/div), wh=Math.ceil(h/div), unit=Math.min(ww,wh);
  const cells=Math.max(3, Math.round(5*Math.sqrt(amt))), cs=unit/cells;
  const gx=Math.ceil(ww/cs)+2, gy=Math.ceil(wh/cs)+2, pts=new Float32Array(gx*gy*2), keep=new Float32Array(gx*gy);
  for(let j=0;j<gy;j++) for(let i=0;i<gx;i++){ const k=j*gx+i; pts[k*2]=(i-1+0.15+Math.random()*0.7)*cs; pts[k*2+1]=(j-1+0.15+Math.random()*0.7)*cs; keep[k]=Math.random(); }
  const warp=fbmSampler(3, 3), jag=fbmSampler(22, 2), glazeN=fbmSampler(8, 2);
  const seam=Math.max(0.8, unit*0.0026*zoom);
  const H=new Float32Array(ww*wh), G=new Float32Array(ww*wh);
  // a broad warp bends the cracks; a fine one makes them jagged, as broken ceramic is
  const st=Math.max(2, Math.round(unit/200));
  const WX=smoothField(ww,wh,st,(u,v)=>(warp(u,v)-0.5)*cs*0.55 + (jag(u,v)-0.5)*cs*0.16), WY=smoothField(ww,wh,st,(u,v)=>(warp(u+0.5,v+0.3)-0.5)*cs*0.55 + (jag(u+0.3,v+0.7)-0.5)*cs*0.16);
  const GZ=smoothField(ww,wh,st*2,(u,v)=>glazeN(u,v));
  for(let y=0;y<wh;y++) for(let x=0;x<ww;x++){
    const u=x/ww, v=y/wh, px=x + WX[y*ww+x], py=y + WY[y*ww+x];
    const ci=Math.floor(px/cs)+1, cj=Math.floor(py/cs)+1;
    let d1=1e9, d2=1e9, k1=0, k2=0;
    for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){
      const i2=ci+di, j2=cj+dj; if(i2<0||j2<0||i2>=gx||j2>=gy) continue;
      const k=j2*gx+i2, d=Math.hypot(px-pts[k*2], py-pts[k*2+1]);
      if(d<d1){ d2=d1; k2=k1; d1=d; k1=k; } else if(d<d2){ d2=d; k2=k; }
    }
    // only some edges crack: a pair of cells breaks apart if its shared hash says so
    const broken = ((keep[k1] + keep[k2]) % 1) < 0.72;
    const e=(d2-d1)*0.5, g = broken ? Math.max(0, 1 - e/seam) : 0;
    G[y*ww+x]=g;
    H[y*ww+x]=(GZ[y*ww+x]-0.5)*1.2 + Math.sqrt(g)*seam*0.9;        // the seam stands proud of the glaze
  }
  // glazed pottery glows: more fill light than raw stone or sand gets
  const L=lightHeights(H, ww, wh, { light, relief:1.2, gloss:0.35 + gloss*0.6, shadow:0.5, ao:0.3, ambient:0.66 });
  return paintLit(w,h,div,ww,wh, i => {
    const k0=litK(L,i,0.66,M3,0), k1=litK(L,i,0.66,M3,1), k2=litK(L,i,0.66,M3,2), s=L.spec[i], g=Math.min(1, G[i]*1.6);
    const s0=s*litS(M3,0), s1=s*litS(M3,1), s2=s*litS(M3,2);
    const gc=[gold.r*(0.35+0.75*k0) + 255*s0*1.2, gold.g*(0.35+0.75*k1) + 235*s1*1.2, gold.b*(0.35+0.75*k2) + 170*s2*1.0];
    const cc=[glaze.r*k0*1.12 + 255*s0*gloss, glaze.g*k1*1.12 + 255*s1*gloss, glaze.b*k2*1.12 + 255*s2*gloss];
    return [clamp255(cc[0]*(1-g) + gc[0]*g), clamp255(cc[1]*(1-g) + gc[1]*g), clamp255(cc[2]*(1-g) + gc[2]*g)];
  });
}

/**
 * Moss on Stone — rough stone, and moss where moss grows: in the crevices and
 * on the flatter tops, as soft raised clumps with a fibrous, matte surface.
 * The stone takes the light and casts shadow; DAMPNESS darkens and glosses
 * the stone and deepens the moss.  STONE SCALE · MOSS · DAMPNESS
 */
export function genMoss(w,h,amt,zoom,light,tint1,tint2,form,M3){
  amt=(amt==null?0.45:amt); zoom=(zoom==null?1:zoom);
  const damp=Math.max(0,Math.min(1, form==null ? 0.3 : form));
  const stone=parseHex(tint1||'#8A8579'), moss=parseHex(tint2||'#5F7E34');
  const div=canonDiv(2), ww=Math.ceil(w/div), wh=Math.ceil(h/div), unit=Math.min(ww,wh);
  const rock=fbmSampler(2.2/zoom, 5), ridge=fbmSampler(5/zoom, 3), growth=fbmSampler(4, 3), fibre=fbmSampler(48, 2);
  const H=new Float32Array(ww*wh), M=new Float32Array(ww*wh), base=new Float32Array(ww*wh);
  const st=Math.max(2, Math.round(unit/220));
  base.set(smoothField(ww,wh,st,(u,v)=>{ const r=1-Math.abs(ridge(u,v)*2-1);   // ridged: fractured, angular stone
    return (rock(u,v)*0.75 + r*0.35)*unit*0.06; }));
  const GR=smoothField(ww,wh,st*2,(u,v)=>growth(u,v));
  // moss gathers where the stone dips below its neighbourhood, and where it is flat
  const at=(x,y)=>base[Math.min(wh-1,Math.max(0,y))*ww+Math.min(ww-1,Math.max(0,x))];
  const R=Math.max(2, Math.round(unit*0.02));
  for(let y=0;y<wh;y++) for(let x=0;x<ww;x++){
    const i=y*ww+x, hollow=(at(x-R,y)+at(x+R,y)+at(x,y-R)+at(x,y+R))/4 - base[i];
    const slope=Math.hypot(at(x+1,y)-at(x-1,y), at(x,y+1)-at(x,y-1));
    const want=GR[i] + hollow*0.12 - slope*0.08 + (amt - 0.5)*0.9;
    const m=Math.max(0, Math.min(1, (want - 0.42)*5));
    M[i]=m;
    H[i]=base[i] + m*(1.5 + 2.2*fibre(x/ww,y/wh));              // soft raised clumps, fibrous on top
  }
  const L=lightHeights(H, ww, wh, { light, relief:1, gloss:0.15 + damp*0.55, shadow:0.7, ao:0.45, ambient:0.36 });
  const sd=1 - damp*0.35, mg=1 + damp*0.25;
  return paintLit(w,h,div,ww,wh, i => {
    const k0=litK(L,i,0.36,M3,0), k1=litK(L,i,0.36,M3,1), k2=litK(L,i,0.36,M3,2), m=M[i], s=L.spec[i]*(1-m);   // moss is matte; only wet stone shines
    const sc=[stone.r*sd*k0 + 255*s*litS(M3,0), stone.g*sd*k1 + 255*s*litS(M3,1), stone.b*sd*k2 + 255*s*litS(M3,2)];
    const mc=[moss.r*k0*0.95, moss.g*k1*mg, moss.b*k2*0.9];
    return [clamp255(sc[0]*(1-m) + mc[0]*m), clamp255(sc[1]*(1-m) + mc[1]*m), clamp255(sc[2]*(1-m) + mc[2]*m)];
  });
}
