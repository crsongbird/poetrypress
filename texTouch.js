/**
 * texTouch.js — 🜚 Touch. Surface: what the page is made of.
 *
 * Contact. Relief rather than image, so these take a light direction and
 * blend through soft-light. Linen, cold press, foxing, fold ghost, cup
 * ring, poured wax, raked substrate, crystal leaf.
 */
import { drawStitch, pathFromPoints } from './stitches.js';
import { lightVec, parseHex, CPU, canonArea, canonDiv, scaleNow, cpx, makeNoiseGrid, sampleNoiseGrid, lightHeights, lightSparse, smoothField, litK, litS, greyLit, obliqueFrame, obliqueRender } from './texCore.js';

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
export function genLinenTooth(w,h,amt,zoom,light,tint1,tint2,form,GL){
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
  // ── DETAILS are real things on the cloth: HEIGHTS, lit by the lighting
  // engine, so a button or a rivet throws its shadow across the weave, a seam
  // is a ditch beside the raised fold of cloth sewn under it, and stitches
  // stand proud of the cloth. They are made on the weave's own fine grid and
  // composited over it; far from a detail, the weave is untouched.
  const N=ww*wh, H=new Float32Array(N);
  const cov=new Float32Array(N), alb=new Float32Array(N*3);   // coverage, and the detail's colour (premultiplied)
  const shine=new Float32Array(N), metal=new Uint8Array(N);  // how much highlight it takes; metal tints it
  const TG=GL ? new Float32Array(N) : null;                   // GLOW: luminous thread in the stitching
  const over=(i,a,c,s,m)=>{ if(a<=0) return; const o=1-a, q=i*3;
    alb[q]=alb[q]*o+c.r*a; alb[q+1]=alb[q+1]*o+c.g*a; alb[q+2]=alb[q+2]*o+c.b*a;
    cov[i]=cov[i]*o+a; shine[i]=shine[i]*o+s*a; if(m && a>0.5) metal[i]=1; else if(a>0.5) metal[i]=0; };
  const clamp01=v=>v<0?0:v>1?1:v, smooth=(a,b,v)=>{ const t=clamp01((v-a)/(b-a)); return t*t*(3-2*t); };
  const g=unitW;                                  // the grid's own unit (its shorter side)
  // thread for stitching: pale, leaning toward the light's colour
  const thread={r:Math.min(255,F.r*0.45+Lc.r*0.6), g:Math.min(255,F.g*0.45+Lc.g*0.6), b:Math.min(255,F.b*0.45+Lc.b*0.5)};
  // DETAILS live on SEAMS, as on real clothes: stitching runs along them,
  // rivets are set into them, buttons sit on a placket.
  const SEAM_STITCHES=['running','zigzag','cross','feather','chain','blanket','wave','diamond'];
  const seamStitch=SEAM_STITCHES[Math.floor(Math.random()*SEAM_STITCHES.length)];
  const seams=[]; const ns=2+Math.floor(Math.random()*2);
  for(let k=0;k<ns;k++) seams.push({ vert:Math.random()<0.5, at:(0.14+Math.random()*0.72) });
  const seamOn = Math.max(dS, dR, dL*0.4, dB*0.6);
  const bR=g*0.026*zoom;                           // the placket's buttons: one size, as on a real shirt
  seams.forEach((sm,n)=>{
    sm.side=Math.random()<0.5?-1:1; sm.ph=Math.random()*6.283;
    sm.buttons = n===0 && dB>0.02;
    sm.band = sm.buttons ? bR*2.7 : g*0.022*zoom;   // the cloth folded under: a seam allowance, or a placket
  });
  const ditch=Math.max(1.2, g*0.0035*zoom), lam=g*0.016*zoom, tw=Math.max(1.6, cpx(7)*zoom/div);
  for(const sm of seams){
    if(seamOn<=0.02) break;
    const atG=sm.at*(sm.vert?ww:wh), len=sm.vert?wh:ww, band=sm.band, pkW=g*0.013*zoom, reachD=band*1.2+pkW*3;
    // two layers under the fold stand ~a thread's thickness higher; the
    // seam line itself is pulled down into a ditch; the cloth beside it puckers
    // in chevrons where the stitching gathers it
    const fold=1.7*seamOn, dig=1.3*seamOn, pk=0.55*seamOn*(0.5+1.4*dS);
    const lo=Math.max(0,Math.floor(atG-reachD)), hi=Math.min(sm.vert?ww:wh, Math.ceil(atG+reachD));
    for(let c=lo;c<hi;c++){
      const dd=(c-atG)*sm.side, ad=Math.abs(dd);
      const base = dd>0 ? fold*smooth(0,ditch*2.2,dd)*(1-smooth(band*0.82,band*1.12,dd))
                        : fold*0.3*smooth(0,ditch*2.2,-dd)*Math.exp(dd/(band*0.5))*(1-smooth(reachD*0.7,reachD,ad));
      const dip=-dig*Math.exp(-(dd/ditch)*(dd/ditch)), env=Math.exp(-ad/pkW)*(1-smooth(reachD*0.7,reachD,ad));
      for(let t=0;t<len;t++){
        const i = sm.vert ? t*ww+c : c*ww+t;
        const wave=Math.sin(6.2832*(t+0.55*ad)/lam + 1.6*Math.sin(t/(lam*3.7)+sm.ph));
        H[i]+=base+dip+pk*wave*env*(0.6+0.4*Math.sin(t/(lam*9)+sm.ph*2));
      }
    }
  }
  // stitching: raised thread, drawn by the seam's stitch (stitches.js) as a
  // mask, then rounded into a thread's profile; a second row joins it as the
  // details grow (twin-needle topstitching, as on jeans)
  const sw=Math.max(dS, dR*0.8, dB*0.7);
  if(seamOn>0.02 && sw>0.02){
    const mk=document.createElement('canvas'); mk.width=ww; mk.height=wh;
    const mx=mk.getContext('2d', CPU);
    for(const sm of seams){
      const atG=sm.at*(sm.vert?ww:wh), len=sm.vert?wh:ww;
      const P=(t,o)=> sm.vert ? [atG+o*sm.side, t] : [t, atG+o*sm.side];
      const offs = sm.buttons ? [sm.band*0.12, sm.band*0.9] : (amt>0.25 ? [sm.band*0.24, sm.band*0.66] : [sm.band*0.36]);
      offs.forEach((off,r)=>{
        const sp={ period:g*0.02*zoom, amp:g*0.006*zoom, width:tw, side:(r?-1:1) };
        drawStitch(mx, pathFromPoints([P(0,off),P(len,off)], false), sm.buttons?'running':seamStitch, { ...sp, color:'#fff' });
      });
    }
    const A=mx.getImageData(0,0,ww,wh).data, m=new Float32Array(N);
    for(let i=0;i<N;i++) m[i]=A[i*4+3]/255;
    // round it: two box blurs make the cross-section a thread's soft dome
    const rb=Math.max(1,Math.round(tw*0.3)), tmp=new Float32Array(N), sm2=new Float32Array(N);
    for(let pass=0;pass<2;pass++){
      const src=pass?sm2:m;
      for(let y=0;y<wh;y++){ let s=0; const r=y*ww; for(let x=-rb;x<=rb;x++) s+=src[r+Math.min(ww-1,Math.max(0,x))];
        for(let x=0;x<ww;x++){ tmp[r+x]=s/(2*rb+1); s+=src[r+Math.min(ww-1,x+rb+1)]-src[r+Math.max(0,x-rb)]; } }
      for(let x=0;x<ww;x++){ let s=0; for(let y=-rb;y<=rb;y++) s+=tmp[Math.min(wh-1,Math.max(0,y))*ww+x];
        for(let y=0;y<wh;y++){ sm2[y*ww+x]=s/(2*rb+1); s+=tmp[Math.min(wh-1,y+rb+1)*ww+x]-tmp[Math.max(0,y-rb)*ww+x]; } }
    }
    const thH=tw*0.6*sw, per=tw*0.9;
    for(let y=0;y<wh;y++) for(let x=0;x<ww;x++){
      const i=y*ww+x, a=m[i]; if(a<=0.01) continue;
      H[i]+=sm2[i]*thH;
      // the ply's twist: fine diagonal stripes along every thread
      const tf=0.84+0.16*Math.sin((x+y)*4.443/per);
      over(i, a*sw, {r:thread.r*tf, g:thread.g*tf, b:thread.b*tf}, 0.25, false);
      if(TG) TG[i]=Math.max(TG[i], a*sw);                          // the thread, for the glow
    }
  }
  // rivets: copper caps set into the seams, domed, stamped with a ring, the
  // cloth pulled up around them; tarnished toward the rim
  if(dR>0.02 && seamOn>0.02){
    const r=g*0.0095*zoom, rH=r*0.45*dR, step=g*0.075*zoom, R2=r*2.2;
    for(const sm of seams){
      if(sm.buttons) continue;
      const atG=sm.at*(sm.vert?ww:wh), len=sm.vert?wh:ww, tarnish=0.25+Math.random()*0.5;
      for(let t=step*(0.4+Math.random()*0.3);t<len;t+=step){
        const cx= sm.vert ? atG+sm.band*0.45*sm.side : t, cy= sm.vert ? t : atG+sm.band*0.45*sm.side;
        const tn=tarnish*(0.6+Math.random()*0.8);
        for(let y=Math.max(0,Math.floor(cy-R2));y<Math.min(wh,Math.ceil(cy+R2));y++) for(let x=Math.max(0,Math.floor(cx-R2));x<Math.min(ww,Math.ceil(cx+R2));x++){
          const i=y*ww+x, rho=Math.hypot(x-cx,y-cy), e=rho/r;
          if(e<1.02){
            const dome=rH*(0.55+0.45*Math.sqrt(Math.max(0,1-e*e))) - rH*0.14*Math.exp(-(((e-0.62)/0.07)**2));
            const a=clamp01(r-rho+0.5); H[i]=H[i]*(1-a)+(H[i]+dome)*a;
            const rim=e*e*tn, warm=0.78+0.22*(1-e);
            over(i, a, {r:(190*warm)*(1-rim)+88*rim, g:(112*warm)*(1-rim)+62*rim, b:(60*warm)*(1-rim)+40*rim}, 1, true);
          } else if(e<2.2){
            H[i]+= rH*0.22*Math.max(0,1-(e-1)/0.4) - rH*0.1*Math.sin(Math.PI*clamp01((e-1.4)/0.8));
          }
        }
      }
    }
  }
  // buttons, down a placket: a rounded rim, a dished centre, four holes, and
  // thread through them crossed or in pairs — each the same, as on a shirt.
  // Their material is chosen by the seed: horn, shell, wood, or dyed to match.
  if(dB>0.02 && seamOn>0.02){
    const sm=seams[0], atG=sm.at*(sm.vert?ww:wh), len=sm.vert?wh:ww, step=g*0.15*zoom;
    const MATS=[ {c:{r:72,g:50,b:34}, s:0.75, grain:'mottle'}, {c:{r:232,g:226,b:214}, s:0.85, grain:'nacre'},
                 {c:{r:150,g:104,b:64}, s:0.25, grain:'rings'}, {c:{r:Math.min(255,F.r*0.85+26),g:Math.min(255,F.g*0.85+24),b:Math.min(255,F.b*0.85+22)}, s:0.55, grain:'none'} ];
    const mat=MATS[Math.floor(Math.random()*MATS.length)], crossed=Math.random()<0.5;
    const bH=bR*0.3*dB, hr=bR*0.085, ho=bR*0.22, thw=bR*0.1;
    const holes=[[-ho,-ho],[ho,-ho],[-ho,ho],[ho,ho]];
    const strands = crossed ? [[holes[0],holes[3]],[holes[1],holes[2]]] : [[holes[0],holes[1]],[holes[2],holes[3]]];
    const segD=(px,py,[ax,ay],[bx,by])=>{ const vx=bx-ax, vy=by-ay, t=clamp01(((px-ax)*vx+(py-ay)*vy)/(vx*vx+vy*vy)); return Math.hypot(px-ax-vx*t, py-ay-vy*t); };
    for(let t=step*(0.5+Math.random()*0.3);t<len-bR;t+=step){
      const cx= sm.vert ? atG+sm.band*0.5*sm.side : t, cy= sm.vert ? t : atG+sm.band*0.5*sm.side, rot=Math.random()*0.5;
      const cs=Math.cos(rot), sn=Math.sin(rot);
      for(let y=Math.max(0,Math.floor(cy-bR-1));y<Math.min(wh,Math.ceil(cy+bR+1));y++) for(let x=Math.max(0,Math.floor(cx-bR-1));x<Math.min(ww,Math.ceil(cx+bR+1));x++){
        const i=y*ww+x, dx=x-cx, dy=y-cy, rho=Math.hypot(dx,dy), e=rho/bR;
        if(e>1.02) continue;
        const a=clamp01(bR-rho+0.5);
        let hgt = e>0.8 ? bH*(1-0.5*((e-0.8)/0.2)**2) : e>0.68 ? bH*(0.8+0.2*smooth(0.68,0.8,e)) : bH*(0.8-0.07*(1-(e/0.68)**2));
        // its own grain
        let k=1;
        if(mat.grain==='mottle') k=0.82+0.3*hash(Math.floor(dx*0.18+9)*7.1+Math.floor(dy*0.18+9)*3.3+t)*(0.5+0.5*Math.sin(dx*0.07+dy*0.05+t));
        else if(mat.grain==='rings') k=0.86+0.14*Math.sin(Math.hypot(dx+bR*0.9,dy*0.6)*0.9);
        else if(mat.grain==='nacre') k=0.94+0.06*Math.sin(dx*0.21+Math.sin(dy*0.17)*2);
        let col={r:mat.c.r*k, g:mat.c.g*k, b:mat.c.b*k}, s=mat.s;
        if(mat.grain==='nacre'){ const ph=dx*0.09+dy*0.13; col={r:col.r*(0.97+0.03*Math.sin(ph)), g:col.g*(0.97+0.03*Math.sin(ph+2.1)), b:col.b*(0.97+0.03*Math.sin(ph+4.2))}; }
        // holes go down to the cloth; thread fills them and crosses between
        const ux=dx*cs+dy*sn, uy=-dx*sn+dy*cs;
        let inHole=0; for(const [hx,hy] of holes) inHole=Math.max(inHole, clamp01(hr-Math.hypot(ux-hx,uy-hy)+0.5));
        if(inHole>0){ hgt=hgt*(1-inHole)+bH*0.15*inHole; col={r:col.r*(1-inHole*0.75), g:col.g*(1-inHole*0.75), b:col.b*(1-inHole*0.75)}; }
        let thd=Infinity; for(const s2 of strands) thd=Math.min(thd, segD(ux,uy,s2[0],s2[1]));
        if(thd<thw*0.6){
          const q=clamp01(1-thd/(thw*0.6)), ta=clamp01((thw*0.6-thd)+0.5);
          hgt=Math.max(hgt, bH*0.74+Math.sqrt(q)*thw*0.6);
          const tf=0.84+0.16*Math.sin((ux+uy)*4.443/(thw*0.9));
          col={r:col.r*(1-ta)+thread.r*tf*ta, g:col.g*(1-ta)+thread.g*tf*ta, b:col.b*(1-ta)+thread.b*tf*ta}; s=s*(1-ta)+0.25*ta;
        }
        H[i]=H[i]*(1-a)+(H[i]+hgt)*a;
        over(i, a*dB, col, s, false);
      }
    }
  }
  // light it all: shadows from every proud thing fall across the weave
  const Ls=lightSparse(H, ww, wh, { light, relief:1, gloss:0.72, shadow:0.7, ao:0.45, ambient:0.4 });
  const fl=Ls.flat||1, lr=(1+(Lc.r/255-1)*0.3), lg=(1+(Lc.g/255-1)*0.3), lb=(1+(Lc.b/255-1)*0.3);
  for(let i=0;i<N;i++){
    const kk=Ls.light[i]/fl, c=cov[i];
    if(kk===1 && c===0) continue;
    const k4=i*4, q=i*3, sp=Ls.spec[i]*shine[i];
    let r=d[k4]*(1-c)*kk, gg=d[k4+1]*(1-c)*kk, b=d[k4+2]*(1-c)*kk;
    if(c>0){
      const mk=metal[i]?0.55:1;
      r+=alb[q]*kk*mk*lr; gg+=alb[q+1]*kk*mk*lg; b+=alb[q+2]*kk*mk*lb;
      if(sp>0){
        if(metal[i]){ const ic=1/Math.max(1e-3,c); r+=sp*Math.min(255,alb[q]*ic*1.5); gg+=sp*Math.min(255,alb[q+1]*ic*1.5); b+=sp*Math.min(255,alb[q+2]*ic*1.5); }
        else { r+=sp*Lc.r*0.8; gg+=sp*Lc.g*0.8; b+=sp*Lc.b*0.8; }
      }
    }
    if(TG && TG[i]>0){ const e=255*TG[i]*0.9; r+=GL.r*e; gg+=GL.g*e; b+=GL.b*e; }
    d[k4]=r>255?255:r; d[k4+1]=gg>255?255:gg; d[k4+2]=b>255?255:b;
  }
  sctx.putImageData(img,0,0);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU); ctx.imageSmoothingEnabled=true; ctx.drawImage(small,0,0,w,h);
  return c;
}

// The paper says no
// to the pencil, very softly,
// ten thousand times.
export function genColdPress(w,h,amt,zoom,light,form,M3){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const press=Math.max(0,Math.min(1, form==null ? 0.5 : form));
  // Watercolour paper. Its TOOTH is the felt it was pressed between: rounded
  // hills and valleys, over a gentle larger undulation — heights, lit by the
  // dial, so raking light fills the valleys with shadow. Its FIBRES are far
  // too fine to cast shadows but still catch the light: a detail NORMAL MAP.
  // PRESS: hot press (smooth, fine) → cold press → rough (big, deep tooth).
  // TOOTH SCALE · TOOTH DEPTH · PRESS
  const div=canonDiv(2), ww=Math.ceil(w/div), wh=Math.ceil(h/div), unit=Math.min(ww,wh);
  // the felt: cells, each a rounded hill; a second, finer felt over it
  const cell=Math.max(2.2, unit*(0.006 + 0.012*press)*zoom);
  const felt=(sc, jit)=>{
    const gx=Math.ceil(ww/sc)+2, gy=Math.ceil(wh/sc)+2, P=new Float32Array(gx*gy*3);
    for(let k=0;k<gx*gy;k++){ P[k*3]=Math.random()*jit; P[k*3+1]=Math.random()*jit; P[k*3+2]=0.6+Math.random()*0.8; }
    // each felt point raises a SOFT hill that adds into its neighbours (shaped
    // by the nearest point alone, hills met in sharp creases, like cracked mud)
    return (x,y)=>{ const fx=x/sc, fy=y/sc, ci=Math.floor(fx), cj=Math.floor(fy); let s=0;
      for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){ const i2=ci+di+1, j2=cj+dj+1; if(i2<0||j2<0||i2>=gx||j2>=gy) continue;
        const k=(j2*gx+i2)*3, px=ci+di+P[k], py=cj+dj+P[k+1], dd=(fx-px)*(fx-px)+(fy-py)*(fy-py);
        if(dd<1.1){ const q=1-dd/1.1; s+=P[k+2]*q*q*q; } }   // a soft bump, as smooth as a gaussian and far cheaper
      return s*0.7; };
  };
  const coarse=felt(cell, 0.95), fine=felt(cell*0.45, 0.9);
  const swell=smoothField(ww, wh, Math.max(3, Math.round(cell*3)), (()=>{ const f=fbmSampler(3, 3); return (u,v)=>f(u,v); })());
  const depth=cell*(0.12 + 0.55*press)*amt;
  const H=new Float32Array(ww*wh);
  for(let y=0;y<wh;y++) for(let x=0;x<ww;x++){ const k=y*ww+x;
    H[k]=depth*(coarse(x,y) + 0.4*fine(x,y)); }
  // (the gentle undulation only SHADES — too gentle to cast shadows — so it
  // joins the fibres in the normal map, and the shadow tracer marches only as
  // far as the tooth can throw a shadow)
  // the fibres: short random strokes, as fine heights turned into normals
  const F=new Float32Array(ww*wh), nFib=Math.round(ww*wh/(unit*0.8)*(0.6 + 0.6*(1-press)));
  for(let q=0;q<nFib;q++){
    const cx=Math.random()*ww, cy=Math.random()*wh, a=Math.random()*Math.PI, len=unit*(0.006+Math.random()*0.02), ca=Math.cos(a), sa=Math.sin(a), hgt=0.5+Math.random()*0.8;
    for(let s=-len/2; s<=len/2; s+=0.7){ const x=Math.round(cx+ca*s), y=Math.round(cy+sa*s); if(x<1||y<1||x>=ww-1||y>=wh-1) continue;
      const fade=1-Math.pow(2*s/len,2); F[y*ww+x]+=hgt*fade; F[y*ww+x-1]+=hgt*fade*0.35; F[y*ww+x+1]+=hgt*fade*0.35; F[(y-1)*ww+x]+=hgt*fade*0.35; F[(y+1)*ww+x]+=hgt*fade*0.35; }
  }
  const N=new Float32Array(ww*wh*3), fk=0.45, sw=cell*0.9;
  for(let k=0;k<ww*wh;k++) F[k]=F[k]*fk + swell[k]*sw;            // fibres and undulation, one detail field
  for(let y=0;y<wh;y++) for(let x=0;x<ww;x++){ const k=y*ww+x;
    const gx=(F[y*ww+Math.min(ww-1,x+1)]-F[y*ww+Math.max(0,x-1)])*0.5, gy=(F[Math.min(wh-1,y+1)*ww+x]-F[Math.max(0,y-1)*ww+x])*0.5;
    const l=Math.hypot(gx,gy,1); N[k*3]=-gx/l; N[k*3+1]=-gy/l; N[k*3+2]=1/l; }
  const L=lightHeights(H, ww, wh, { light, relief:1, gloss:0.06, shadow:0.55, ao:0.3, ambient:0.45, normals:N });
  const fl=L.flat||1, fs=lightHeights(new Float32Array(1), 1, 1, { light, gloss:0.06, shadow:0, ao:0, ambient:0.45 }).spec[0];
  return paintLit(w,h,div,ww,wh, i => { const dl=(L.light[i]/fl - 1)*120, sp=(L.spec[i]-fs)*60;
    if(!M3){ const v=128 + dl + sp; return [clamp255(v), clamp255(v), clamp255(v)]; }
    return [clamp255(greyLit(dl, sp, M3, 0)), clamp255(greyLit(dl, sp, M3, 1)), clamp255(greyLit(dl, sp, M3, 2))]; });
}

// Something damp got in
// and the paper remembered
// for forty-odd years.

// It was folded once
// to fit an envelope, then
// opened. It still knows.

// Someone set it down
// mid-sentence and forgot it.
// The ring is the proof.
export function genCupRing(w,h,amt,zoom,light,tint,form,M3,GL){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const spill=Math.max(0,Math.min(1, form==null ? 0.35 : form));
  const t = parseHex(tint || '#6B4A2F');
  // Where a mug of coffee stood on paper. Not a raised rim: dried coffee is
  // FLAT, and the colour does the work.
  //  · the mug's foot leaves a BAND; as each drop dries its coffee is carried
  //    to the edge (the coffee-ring effect), so the band darkens to a crisp
  //    outer line, with a faint tide line where the liquid last paused;
  //  · coffee pools on the downhill side — the band is heavy there and thins
  //    to broken arcs on the other;
  //  · paper drinks it: absorption mottles the stain, and wicking along the
  //    fibres feathers the outer edge;
  //  · a mug is set down twice (an offset, partial ring), and drips leave
  //    their own little dark-edged rings.
  // The light gives only a faint sugary sheen where the film is thick.
  // RING SIZE · RING COUNT · SPILL (drips, and the wash inside the ring)
  const div=canonDiv(2), ww=Math.ceil(w/div), wh=Math.ceil(h/div), unit=Math.min(ww,wh);
  const D=new Float32Array(ww*wh);                          // stain density, 0..~1.2
  const fibre=fbmSampler(70, 2), mottle=fbmSampler(9, 3), feather=fbmSampler(40, 2);
  const angular=(seed)=>{ const p=[Math.random()*6.28, Math.random()*6.28, Math.random()*6.28];
    return a => 0.5 + 0.28*Math.sin(a*2+p[0]+seed) + 0.14*Math.sin(a*5+p[1]) + 0.08*Math.sin(a*11+p[2]); };
  // one dried ring: centre, radius, band width, how heavy, which way it pooled
  const ring=(cx, cy, R, bw, heavy, pool, partial, fill=0)=>{
    const wob=angular(Math.random()*6), pad=R+bw*0.5+unit*0.02;
    const x0=Math.max(0,Math.floor(cx-pad)), x1=Math.min(ww-1,Math.ceil(cx+pad)), y0=Math.max(0,Math.floor(cy-pad)), y1=Math.min(wh-1,Math.ceil(cy+pad));
    const spanA=Math.random()*6.28, spanW=partial ? 1.2+Math.random()*2.2 : 99;
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
      const dx=x-cx, dy=y-cy, a=Math.atan2(dy,dx), r0=Math.hypot(dx,dy);
      // wicking: coffee creeps OUTWARD along the paper's fibres in fine radial
      // streaks, so the outer edge feathers (sampled in polar coordinates:
      // many cells around the ring, few across it)
      const fib=feather((a + Math.PI)/(2*Math.PI)*Math.max(8, R*0.09), r0*0.004 + heavy*7);
      // (only at the OUTER edge: wicking runs outward into dry paper)
      const outer=Math.max(0, Math.min(1, (r0 - (R - bw*0.3))/(bw*0.3)));
      const r=r0 - outer*Math.pow(Math.max(0, fib - 0.35)/0.65, 3)*unit*0.006*(R > unit*0.03 ? 1 : 0.25);
      const Rw=R*(1 + 0.01*Math.sin(a*3 + pool) + 0.006*Math.sin(a*7 + heavy*9));
      // heavy on the pooled side, thinning to broken arcs on the other
      const side=Math.pow(0.5 + 0.5*Math.cos(a - pool), 1.4);
      // (a drip is too small to pool unevenly: varied by angle, it showed as wedges)
      let along=R < unit*0.03 ? 1 : Math.max(0, Math.min(1, 0.15 + 0.85*side*1.1 + (wob(a)-0.5)*0.9));
      if(partial){ const da=Math.abs(((a-spanA+Math.PI*3)%(Math.PI*2))-Math.PI); along*=Math.max(0, Math.min(1, (spanW/2 - da)*3)); }
      const s=(r - (Rw - bw))/bw;
      if(along<=0.01 && s>=0) continue;                            // 0 inner edge of the band … 1 the outer line
      let v=0;
      if(s>=0 && s<=1){
        v = 0.32 + 0.6*s*s;                                  // darkening toward the outer edge
        v += 0.7*Math.exp(-Math.pow((s-0.97)/0.035, 2));      // the crisp contact line
        v += 0.18*Math.exp(-Math.pow((s-0.04)/0.04, 2));      // the tide line where it last paused
      } else if(s>1){
        v = 0.75*Math.exp(-Math.pow((s-1)/0.03, 2));          // the line's own soft outer limit
      } else if(s<0 && r<Rw-bw){
        // the wash inside: faint in a ring, eased in from the band; a drip is filled right up to its rim
        v = (fill || spill*0.10)*(0.6 + 0.8*mottle(x/ww+3.1, y/wh+1.7)) * (fill ? 1 : Math.min(1, -s*4));
      }
      const k=y*ww+x;
      // the band thins around the ring; the wash inside doesn't (varied by angle, it showed as rays)
      D[k]=Math.min(1.25, D[k] + v*(s<0 ? 1 : along)*heavy*1.55);
    }
  };
  const nPlaced=Math.max(1, Math.round((1+Math.random()*1.4)*amt));
  for(let k=0;k<nPlaced;k++){
    const R=unit*(0.11+Math.random()*0.07)*zoom, bw=R*(0.06+Math.random()*0.07);
    const cx=ww*(0.15+Math.random()*0.7), cy=wh*(0.15+Math.random()*0.7), pool=Math.random()*6.28, heavy=0.75+Math.random()*0.4;
    ring(cx, cy, R, bw, heavy, pool, false);
    // set down again, a little off — often only part of it took
    if(Math.random()<0.45){ const a=Math.random()*6.28, d=R*(0.08+Math.random()*0.3);
      ring(cx+Math.cos(a)*d, cy+Math.sin(a)*d, R*(0.97+Math.random()*0.05), bw*(0.7+Math.random()*0.5), heavy*(0.35+Math.random()*0.3), pool+(Math.random()-0.5), true); }
    // drips: small drops near the ring, each drying into its own tiny ring
    const drips=Math.round(spill*(1+Math.random()*4));
    for(let q=0;q<drips;q++){
      const a=Math.random()*6.28, d=R*(1.02+Math.random()*0.45), r=unit*(0.004+Math.random()*0.012)*zoom;
      ring(cx+Math.cos(a)*d, cy+Math.sin(a)*d, r, r*0.35, heavy*(0.5+Math.random()*0.4), Math.random()*6.28, false, 0.45);
    }
  }
  // paper drinks it unevenly: mottle and fibre
  for(let y=0;y<wh;y++) for(let x=0;x<ww;x++){ const k=y*ww+x; if(D[k]>0) D[k]*=0.72 + 0.4*mottle(x/ww,y/wh) + 0.18*(fibre(x/ww,y/wh)-0.5); }
  // the faintest film for the light: a broad sheen where it's thick, never
  // relief — so the film is a SMOOTHED copy of the stain (following the
  // stain's own banding made the band look embossed)
  const Hf=smoothField(ww, wh, Math.max(2, Math.round(unit/120)), (u, v) => Math.min(1, D[Math.min(wh-1, Math.round(v*(wh-1)))*ww + Math.min(ww-1, Math.round(u*(ww-1)))]));
  for(let i=0;i<Hf.length;i++) Hf[i]*=Math.max(0.25, unit*0.0007);
  const L=lightHeights(Hf, ww, wh, { light, relief:1, gloss:0.7, shadow:0, ao:0, ambient:0.6 });
  const fs=L.flat ? lightHeights(new Float32Array(1), 1, 1, { light, relief:1, gloss:0.7, shadow:0, ao:0, ambient:0.6 }).spec[0] : 0;
  // the stain: translucent, from paper grey toward the hue, deepening past it
  // (more saturated, darker) where the coffee is thickest
  const deep=[t.r*0.55, t.g*0.45, t.b*0.38];
  return paintLit(w,h,div,ww,wh, i => {
    const dn=D[i];
    if(dn<0.003) return [128,128,128];
    const a=Math.min(1, dn), b=Math.max(0, Math.min(1, (dn-0.75)/0.45));
    const sh=Math.max(0, L.spec[i]-fs)*Math.min(1, dn)*60;       // the sheen
    const col=c=>{ const base=[t.r,t.g,t.b][c], dp=deep[c];
      // (GLOW: where it dried at its edge, faintly)
      return 128 + ((base + (dp-base)*b) - 128)*a + sh*litS(M3,c) + (GL ? 255*[GL.r,GL.g,GL.b][c]*b*a*0.8 : 0); };
    return [clamp255(col(0)), clamp255(col(1)), clamp255(col(2))];
  });
}

// It ran before it
// set, so the thick edge tells you
// which way the page leaned.
export function genPouredWax(w,h,amt,zoom,light,tint,form,M3,GL){
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
    // GLOW: candlelight in the thick of the wax, as if lit from within
    if(GL){ const e=255*(1-thin)*0.85; c[0]+=GL.r*e; c[1]+=GL.g*e; c[2]+=GL.b*e; }
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
/**
 * Scrying Pool — looking down into still water, after Evan Wallace's WebGL
 * Water: the surface's waves bend the light into a net of caustics on the
 * floor, and bend the view of everything below. The pool is a PLACE, by the
 * seed: a KOI POND (koi, pale and dark, at different depths; lily pads on the
 * surface), a PEBBLED STREAM (a floor of stones, darting minnows, weed), or a
 * WISHING WELL (coins on the floor, a lone fish, a fallen leaf).
 *   depth   everything below is refracted by the waves — more the deeper it
 *           lies — softens, and fades toward the water's own tone
 *   light   the caustics play over the floor and over the fishes' backs;
 *           fish and leaves cast soft shadows on the floor, offset with the
 *           light (the dial); the surface glints
 *   TILT    the camera: straight down at 0; tipped, the far water mirrors
 *           the sky (Fresnel) and the pool recedes into haze
 * WAVE SCALE · TURBULENCE · DEPTH · HAZE · MURK · TILT
 */
export function genWater(w,h,amt,zoom,light,form,haze,murk,tilt,M3){
  amt=(amt==null?0.35:amt); zoom=(zoom==null?1:zoom);
  const turb=Math.max(0,Math.min(1,amt)), depth=Math.max(0,Math.min(1, form==null ? 0.35 : form));
  const hz=Math.max(0,Math.min(1, haze==null ? 0.1 : haze)), mk=Math.max(0,Math.min(1, murk==null ? 0 : murk));
  const tl=Math.max(0,Math.min(1, tilt==null ? 0 : tilt));
  const div=tl > 0.001 ? canonDiv(3) : canonDiv(2), ww=Math.ceil(w/div), wh=Math.ceil(h/div), unit=Math.min(ww,wh);
  const la=((light==null?315:light)-90)*Math.PI/180, SX=Math.cos(la), SY=Math.sin(la);
  const ltilt=Math.min(1, Math.hypot(lightVec(light).lx, lightVec(light).ly));
  // the surface: waves in a spread of directions around the wind's
  const wind=Math.random()*Math.PI*2, waves=[];
  const nw=7+Math.round(turb*7);
  for(let k=0;k<nw;k++){
    const f=k/(nw-1);                                            // 0 long swell … 1 short chop
    const lam=Math.max(unit*0.025, unit*0.22*zoom*Math.pow(0.55, f*(1.5+turb*2)));
    const dir=wind+(Math.random()-0.5)*(0.6+turb*1.8);
    waves.push({ kx:Math.cos(dir)*6.283/lam, ky:Math.sin(dir)*6.283/lam, a:lam*(0.03+0.05*turb)*(1-0.4*f), ph:Math.random()*6.283 });
  }
  const KINDS=['koi','stream','well'], kind=KINDS[Math.floor(Math.random()*KINDS.length)];
  // the patch the camera sees (the page itself, looking straight down)
  const F=obliqueFrame(ww, wh, tl*0.8, unit*0.01), DW=F.GW, DH=F.GH;
  const floor=unit*(0.03+depth*0.3), bend=floor*(1-1/1.33);
  const ox=-SX*ltilt*floor*0.35, oy=-SY*ltilt*floor*0.35;          // slanting light shifts the net
  const M=Math.ceil(Math.abs(ox)+Math.abs(oy)+bend*0.8+6), PW=DW+2*M, PH=DH+2*M, PN=PW*PH;
  const H=smoothField(PW,PH,2,(u,v)=>{ const x=u*PW, y=v*PH; let s=0;
    for(const q of waves){ const p=q.kx*x+q.ky*y+q.ph; s+=q.a*(Math.sin(p) + 0.35*turb*Math.sin(2*p+1)); } return s; });
  const GX=new Float32Array(PN), GY=new Float32Array(PN);
  for(let y=0;y<PH;y++) for(let x=0;x<PW;x++){ const i=y*PW+x;
    GX[i]=(H[y*PW+Math.min(PW-1,x+1)]-H[y*PW+Math.max(0,x-1)])*0.5; GY[i]=(H[Math.min(PH-1,y+1)*PW+x]-H[Math.max(0,y-1)*PW+x])*0.5; }
  // caustics: refract each surface point down to the floor and count the landings
  const C=new Float32Array(PN);
  for(let y=0;y<PH;y++) for(let x=0;x<PW;x++){ const i=y*PW+x;
    const fx=x+ox-GX[i]*bend, fy=y+oy-GY[i]*bend;
    if(!(fx>=0 && fy>=0 && fx<PW-1 && fy<PH-1)) continue;
    const x0=fx|0, y0=fy|0, tx=fx-x0, ty=fy-y0, k=y0*PW+x0;
    C[k]+=(1-tx)*(1-ty); C[k+1]+=tx*(1-ty); C[k+PW]+=(1-tx)*ty; C[k+PW+1]+=tx*ty; }
  const cl=(v,n)=>v<0?0:v>=n?n-1:v;
  const boxBlur=(A, R, passes)=>{ if(R<1) return; const tmp=new Float32Array(PN);
    for(let pass=0;pass<passes;pass++){
      for(let y=0;y<PH;y++){ const r=y*PW; let s=0; for(let x=-R;x<=R;x++) s+=A[r+cl(x,PW)];
        for(let x=0;x<PW;x++){ tmp[r+x]=s/(2*R+1); s+=A[r+cl(x+R+1,PW)]-A[r+cl(x-R,PW)]; } }
      for(let x=0;x<PW;x++){ let s=0; for(let y=-R;y<=R;y++) s+=tmp[cl(y,PH)*PW+x];
        for(let y=0;y<PH;y++){ A[y*PW+x]=s/(2*R+1); s+=tmp[cl(y+R+1,PH)*PW+x]-tmp[cl(y-R,PH)*PW+x]; } } } };
  // deeper water and haze soften the net: a blur that grows with both
  boxBlur(C, Math.round(1 + depth*depth*unit*0.004 + hz*unit*0.008), 2);

  // ---- WHAT LIVES THERE, at its depth (z: 0 the surface … 1 the floor) ----
  const area=(DW*DH)/(ww*wh);                                     // a bigger patch holds more
  const FL=new Float32Array(PN), FA=new Float32Array(PN);         // the floor's own relief shading, and its albedo shift
  const OB=new Float32Array(PN), OT=new Float32Array(PN), OZ=new Float32Array(PN).fill(1);   // a swimmer: cover, tone, depth
  const LF=new Float32Array(PN), LT=new Float32Array(PN);         // the surface: leaves, pads
  const SH=new Float32Array(PN);                                  // shadows on the floor
  const ellipse=(cx, cy, rx, ry, ang, fn)=>{ const R=Math.max(rx,ry)+2, ca=Math.cos(ang), sa=Math.sin(ang);
    for(let y=Math.max(0,Math.floor(cy-R)); y<=Math.min(PH-1,Math.ceil(cy+R)); y++) for(let x=Math.max(0,Math.floor(cx-R)); x<=Math.min(PW-1,Math.ceil(cx+R)); x++){
      const dx=x-cx, dy=y-cy, u=(dx*ca+dy*sa)/rx, v=(-dx*sa+dy*ca)/ry; fn(y*PW+x, u, v, u*u+v*v); } };
  const shadowAt=(cx, cy, z)=>{ const off=(1-z)*floor*(0.3+0.9*ltilt); return [cx+SX*off, cy+SY*off]; };
  // stones on the floor: lit domes, each its own tone
  const stoneN=Math.round((kind==='stream' ? 70 : kind==='well' ? 26 : 14)*area);
  for(let k=0;k<stoneN;k++){
    const r=unit*(kind==='stream' ? 0.025+Math.random()*0.05 : 0.02+Math.random()*0.035), x=Math.random()*PW, y=Math.random()*PH, ang=Math.random()*Math.PI, tone=(Math.random()-0.5)*0.5;
    ellipse(x, y, r*(1+Math.random()*0.5), r, ang, (i,u,v,q)=>{ if(q>=1) { if(q<1.5) FL[i]=Math.min(FL[i], -0.35*(1.5-q)); return; }
      const nz=Math.sqrt(1-q), nx=u, ny=v, ca=Math.cos(ang), sa=Math.sin(ang), wx=nx*ca-ny*sa, wy=nx*sa+ny*ca;
      FL[i]=Math.max(FL[i], (-(wx*SX+wy*SY)*0.8 + nz*0.4) - 0.2); FA[i]=tone; });
  }
  // coins in the well: small bright discs, a few on their edge
  if(kind==='well'){ const n=Math.round((18+Math.random()*16)*area);
    for(let k=0;k<n;k++){ const r=unit*(0.02+Math.random()*0.012), x=Math.random()*PW, y=Math.random()*PH, ang=Math.random()*Math.PI, squash=0.35+Math.random()*0.65;
      ellipse(x, y, r, r*squash, ang, (i,u,v,q)=>{ if(q>=1) return; const rim=q>0.72 ? 0.5 : 0; FL[i]=0.9 - rim + Math.sin(u*9)*0.08; FA[i]=0.55; }); } }
  // weed: strands rising from the floor, swaying
  if(kind!=='well'){ const n=Math.round((kind==='stream' ? 10 : 5)*area);
    for(let k=0;k<n;k++){ let x=Math.random()*PW, y=Math.random()*PH; const len=unit*(0.12+Math.random()*0.25), ph=Math.random()*6.28, ang=Math.random()*Math.PI*2, wdt=unit*0.006;
      for(let t=0;t<1;t+=0.01){ const px=x+Math.cos(ang)*len*t + Math.sin(t*6+ph)*unit*0.02*t, py=y+Math.sin(ang)*len*t + Math.cos(t*5+ph)*unit*0.02*t, z=1-t*0.55;
        ellipse(px, py, wdt*(1.2-t), wdt*(1.2-t), 0, (i,u,v,q)=>{ if(q<1 && z<OZ[i]+0.02){ OB[i]=Math.max(OB[i], 0.75*(1-q)); OT[i]=0.55; OZ[i]=z; } }); } } }
  // fish: tapered bodies with a forked tail, curved as they swim
  const fishN=Math.round((kind==='koi' ? 5+Math.random()*4 : kind==='stream' ? 10+Math.random()*10 : 1)*area);
  for(let k=0;k<fishN;k++){
    const Lf=unit*(kind==='koi' ? 0.11+Math.random()*0.07 : kind==='stream' ? 0.03+Math.random()*0.02 : 0.08), Wf=Lf*0.2;
    const x=Math.random()*PW, y=Math.random()*PH, hd=kind==='stream' ? wind+(Math.random()-0.5)*0.6 : Math.random()*Math.PI*2, bendF=(Math.random()-0.5)*0.6;
    const z=0.15+Math.random()*0.6, tone=kind==='koi' ? (Math.random()<0.55 ? 1.85 : Math.random()<0.5 ? 0.3 : 1.45) : 0.32;
    const pat=Math.random()*6.28, ca=Math.cos(hd), sa=Math.sin(hd), R=Lf*0.8;
    const [sxx, syy]=shadowAt(x, y, z);
    for(let yy=Math.max(0,Math.floor(Math.min(y,syy)-R)); yy<=Math.min(PH-1,Math.ceil(Math.max(y,syy)+R)); yy++) for(let xx=Math.max(0,Math.floor(Math.min(x,sxx)-R)); xx<=Math.min(PW-1,Math.ceil(Math.max(x,sxx)+R)); xx++){
      const body=(px, py)=>{ const dx=px, dy=py, u=(dx*ca+dy*sa)/Lf, v0=(-dx*sa+dy*ca)/Lf;
        const v=v0 - bendF*Math.sin((u+0.5)*Math.PI)*0.12;            // the swimming curve
        if(u>-0.5 && u<0.5){ const half=0.2*Math.pow(Math.sin((u+0.5)*Math.PI), 0.75)*(u<0 ? 0.75+0.25*(u+0.5)*2 : 1); return Math.abs(v)<half ? 1-Math.pow(Math.abs(v)/half, 4) : 0; }
        if(u<=-0.5 && u>-0.78){ const s=(-0.5-u)/0.28, half=0.04+s*0.16; return (Math.abs(v)<half && Math.abs(v)>s*0.07) ? 0.85 : 0; }   // the forked tail
        return 0; };
      const i=yy*PW+xx, b=body(xx-x, yy-y);
      if(b>0 && z<OZ[i]+0.02){ OB[i]=Math.max(OB[i], b); OZ[i]=Math.min(OZ[i], z);
        // koi: patches of colour along the back
        OT[i]=kind==='koi' && tone>1 ? tone - 0.9*Math.max(0, Math.sin((xx*ca+yy*sa)/Lf*7+pat)) * (tone>1.4 ? 1 : 0.4) : tone; }
      const sb=body(xx-sxx, yy-syy); if(sb>0) SH[i]=Math.max(SH[i], sb*0.75*(1-z*0.4));
    }
  }
  // the surface: lily pads (a notched round) or a fallen leaf; sharp shadows on the floor below
  const leafN=kind==='koi' ? Math.round((2+Math.random()*4)*area) : Math.round((Math.random()<0.6 ? 1 : 0)*area + (kind==='stream' ? 1 : 0));
  for(let k=0;k<leafN;k++){
    const pad=kind==='koi', r=unit*(pad ? 0.05+Math.random()*0.05 : 0.025+Math.random()*0.02), x=Math.random()*PW, y=Math.random()*PH, ang=Math.random()*Math.PI*2, tone=pad ? 1.05+Math.random()*0.3 : 0.55+Math.random()*0.7;
    const [sxx, syy]=shadowAt(x, y, 0);
    const shapeF=(u,v,q)=>{ if(pad){ const a=Math.atan2(v,u); return q<1 && !(Math.abs(a)<0.22 && q>0.02); }
      return Math.abs(v) < 0.42*Math.pow(Math.max(0, 1-u*u), 0.9); };
    ellipse(x, y, r, pad ? r : r*0.9, ang, (i,u,v,q)=>{ if(shapeF(u,v,q)){ LF[i]=1; LT[i]=tone*(1 - (pad ? 0.12*Math.abs(Math.sin(Math.atan2(v,u)*9)) : 0.25*Math.exp(-((v/0.04)**2)))); } });
    ellipse(sxx, syy, r, pad ? r : r*0.9, ang, (i,u,v,q)=>{ if(shapeF(u,v,q)) SH[i]=Math.max(SH[i], 0.85); });
  }
  // the floor's things soften with depth; swimmers by their own depth; shadows by their distance
  boxBlur(SH, Math.round(1 + floor*0.06), 2);
  const fb=Math.round(depth*unit*0.004 + hz*unit*0.004); if(fb>0){ boxBlur(FL, fb, 1); boxBlur(FA, fb, 1); }
  boxBlur(OB, Math.max(1, Math.round(hz*unit*0.004 + depth*unit*0.002)), 1);

  // glints: Blinn's highlight of the sun in each slope (viewer overhead)
  const elev=(90-ltilt*78)*Math.PI/180, Lx=SX*Math.cos(elev), Ly=SY*Math.cos(elev), Lz=Math.sin(elev);
  const hx=Lx, hy=Ly, hzv=Lz+1, hl=Math.hypot(hx,hy,hzv);
  const floorVis=1-0.75*depth, absorb=1-0.6*mk, veil=hz*0.55, waterTone=128 - mk*38 + hz*14;
  const DN=DW*DH, RGB=new Float32Array(DN*3), HS=new Float32Array(DN);
  const samp=(A, fx, fy)=>{ fx=Math.max(0,Math.min(PW-1.001,fx)); fy=Math.max(0,Math.min(PH-1.001,fy)); const x0=fx|0, y0=fy|0, tx=fx-x0, ty=fy-y0, k=y0*PW+x0;
    return (A[k]*(1-tx)+A[k+1]*tx)*(1-ty)+(A[k+PW]*(1-tx)+A[k+PW+1]*tx)*ty; };
  for(let i=0;i<DN;i++){
    const X=(i%DW)+M, Y=((i/DW)|0)+M, P=Y*PW+X;
    HS[i]=H[P];
    const nx=-GX[P]*3, ny=-GY[P]*3, nl=Math.hypot(nx,ny,1), nh=Math.max(0,(nx*hx+ny*hy+hzv)/(nl*hl));
    const glint=Math.pow(nh, 400)*(1-0.6*hz)*(1-0.5*mk)*0.85;
    // the floor, seen through the waves: refracted by the full depth
    const fx=X-GX[P]*bend*1.6, fy=Y-GY[P]*bend*1.6;
    const caus=(samp(C,fx,fy)-1)*0.9*floorVis*absorb*(1-veil), sh=samp(SH,fx,fy)*floorVis*absorb;
    const trough=Math.min(0, H[P])/(unit*0.02);
    let v=128 - 16*depth + (caus*52)*(1-0.85*sh) - sh*40 + trough*6*(1-veil) + (samp(FL,fx,fy)*78 + samp(FA,fx,fy)*48)*floorVis*absorb*(1-veil) - mk*38 + hz*14;
    // a swimmer above the floor: refracted by ITS depth, fading toward the water's tone the deeper it is
    const z=samp(OZ,X,Y), zx=X-GX[P]*bend*1.6*z, zy=Y-GY[P]*bend*1.6*z, ob=samp(OB,zx,zy);
    if(ob>0.01){ const ot=samp(OT,zx,zy), fade=Math.min(0.8, z*depth*0.7 + mk*0.5*z + veil*0.4);
      const sv=(128*ot + caus*30*(1-z)) * (1-fade) + waterTone*fade; v=v*(1-ob) + sv*ob; }
    // the surface: leaves and pads, lit, unbent, over everything; no glint through them
    const lf=samp(LF,X,Y); let g=glint;
    if(lf>0.01){ const shade=0.9 + 0.2*(-(GX[P]*SX + GY[P]*SY))*3; v=v*(1-lf) + 128*samp(LT,X,Y)*shade*lf; g*=1-lf*0.7; }
    for(let c=0;c<3;c++){
      const shd = M3 && trough<0 ? trough*6*(M3.sh[c]-1)*0.8 : 0;
      RGB[i*3+c]=clamp255(v + shd + g*170*(M3 ? M3.hi[c] : 1));
    }
  }
  let OUT=RGB;
  if(!F.flat){
    // tipped: the far water mirrors the sky (Fresnel), then recedes into haze
    const sky=Math.min(255, 128 + 52 + hz*20);
    OUT=obliqueRender(F, HS, RGB, { fog:[sky, sky, sky], fogK: 0.2 + 0.25*tl });
    for(let y=0;y<wh;y++){
      const dy=-F.D*F.sp - F.cp*(y - wh/2), dz=-F.D*F.cp + F.sp*(y - wh/2), cosT=-dy/Math.hypot(dy, dz);
      const fr=Math.min(0.75, 0.04 + 1.2*Math.pow(1 - cosT, 2.2));
      for(let x=0;x<ww;x++){ const k=(y*ww+x)*3; for(let c=0;c<3;c++) OUT[k+c]=OUT[k+c]*(1-fr) + sky*fr; }
    }
  }
  const small=document.createElement('canvas'); small.width=ww; small.height=wh;
  const sctx=small.getContext('2d', CPU), img=sctx.createImageData(ww,wh), d=img.data;
  for(let i=0;i<ww*wh;i++){ const q=i*4; d[q]=OUT[i*3]; d[q+1]=OUT[i*3+1]; d[q+2]=OUT[i*3+2]; d[q+3]=255; }
  sctx.putImageData(img,0,0);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU); ctx.imageSmoothingEnabled=true; ctx.drawImage(small,0,0,w,h);
  // silt hanging in murky water: soft specks, some in focus, most not
  if(mk>0.02){
    const n=Math.round(canonArea(w,h)/(3072*3072)*1800*mk);
    for(let k=0;k<n;k++){ const x=Math.random()*w, y=Math.random()*h, near=Math.random()<0.2, r=cpx(near ? 2+Math.random()*5 : 0.6+Math.random()*1.4);
      ctx.fillStyle=`rgba(40,36,30,${near ? 0.12 : 0.35})`; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); }
  }
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
export function genGlassRain(w,h,amt,zoom,light,form,M3,env){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const mist=Math.max(0,Math.min(1, form==null ? 0.3 : form));
  const div=canonDiv(2), ww=Math.ceil(w/div), wh=Math.ceil(h/div), unit=Math.min(ww,wh), N=ww*wh;
  const H=new Float32Array(N);
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
  // drops, from many tiny to a few large; some run, leaving a cleared wet trail
  const TRAILS=[];
  const n=Math.round((90+Math.random()*40)*amt);
  for(let k=0;k<n;k++){
    const r=unit*(0.003 + 0.042*Math.pow(Math.random(), 3))*zoom, x=Math.random()*ww, y=Math.random()*wh;
    if(r > unit*0.012 && Math.random()<0.5){
      const len=r*(5+Math.random()*14), wob=Math.random()*6.28;
      TRAILS.push({ x, y, len, wob, r });
      for(let t=0;t<len;t+=Math.max(0.7, r*0.15)){
        const tx=x+Math.sin(t/(r*4)+wob)*r*0.18, ty=y-t, rr=r*0.16*(1 - t/len*0.5);   // a trail wanders slowly, not in a zigzag
        drop(tx, ty, Math.max(0.6, rr));
        if(Math.random()<0.03) drop(tx + (Math.random()-0.5)*r*0.5, ty, r*(0.12+Math.random()*0.18));
      }
    }
    drop(x, y, Math.max(0.6, r));
  }
  // THE OUTDOORS behind the glass, made from the page's own colours: a sky
  // (its first colours, lightened), a horizon, a dark band of land with a
  // vague skyline — trees or roofs — and a few far lights; all of it far out
  // of focus. Every drop is a tiny lens and shows it UPSIDE-DOWN.
  const cols=(env && env.length ? env : ['#6A7C96','#2A3140']).map(c=>parseHex(c));
  const mixc=(a,b,t)=>({ r:a.r+(b.r-a.r)*t, g:a.g+(b.g-a.g)*t, b:a.b+(b.b-a.b)*t });
  const EW=96, EH=96, E=new Float32Array(EW*EH*3), horizon=0.5+Math.random()*0.15;
  const sky0=mixc(cols[0], {r:255,g:255,b:255}, 0.3), sky1=mixc(cols[Math.min(1,cols.length-1)], {r:255,g:255,b:255}, 0.12);
  const land=mixc(cols[cols.length-1], {r:0,g:0,b:0}, 0.35);
  const ph=[Math.random()*6,Math.random()*6,Math.random()*6], city=Math.random()<0.5;
  for(let y=0;y<EH;y++) for(let x=0;x<EW;x++){
    const u=x/EW, v=y/EH;
    // the skyline: rolling trees, or blocky roofs
    const sk = city ? 0.06*(Math.floor(Math.abs(Math.sin(u*9+ph[0]))*4)/4) + 0.02*Math.sin(u*31+ph[1])
                    : 0.05*(0.5+0.5*Math.sin(u*7+ph[0])) + 0.025*Math.sin(u*23+ph[1]) + 0.012*Math.sin(u*61+ph[2]);
    let c = v < horizon - sk ? mixc(sky0, sky1, v/(horizon)) : mixc(land, mixc(land,{r:0,g:0,b:0},0.4), (v-horizon)/(1-horizon));
    const k=(y*EW+x)*3; E[k]=c.r; E[k+1]=c.g; E[k+2]=c.b;
  }
  // far lights along the horizon
  const nl=city ? 18 : 6;
  for(let q=0;q<nl;q++){ const lx=Math.floor(Math.random()*EW), ly=Math.floor((horizon - Math.random()*0.04)*EH), lc=mixc(cols[q%cols.length], {r:255,g:240,b:200}, 0.6);
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const xx=lx+dx, yy=ly+dy; if(xx<0||yy<0||xx>=EW||yy>=EH) continue; const k=(yy*EW+xx)*3; E[k]=lc.r; E[k+1]=lc.g; E[k+2]=lc.b; } }
  // softened a little: a drop focuses the scene, but only so well
  const tmp=new Float32Array(EW*EH*3), R=1;
  for(let pass=0;pass<2;pass++){
    for(let y=0;y<EH;y++) for(let x=0;x<EW;x++) for(let ch=0;ch<3;ch++){ let s=0,n2=0; for(let d=-R;d<=R;d++){ const xx=Math.min(EW-1,Math.max(0,x+d)); s+=E[(y*EW+xx)*3+ch]; n2++; } tmp[(y*EW+x)*3+ch]=s/n2; }
    for(let y=0;y<EH;y++) for(let x=0;x<EW;x++) for(let ch=0;ch<3;ch++){ let s=0,n2=0; for(let d=-R;d<=R;d++){ const yy=Math.min(EH-1,Math.max(0,y+d)); s+=tmp[(yy*EW+x)*3+ch]; n2++; } E[(y*EW+x)*3+ch]=s/n2; }
  }
  const envAt=(u,v,ch)=>{ u=Math.max(0,Math.min(0.999,u))*(EW-1); v=Math.max(0,Math.min(0.999,v))*(EH-1); const x0=u|0, y0=v|0, tx=u-x0, ty=v-y0, k=(y0*EW+x0)*3+ch;
    return (E[k]*(1-tx)+E[k+3]*tx)*(1-ty) + (E[k+EW*3]*(1-tx)+E[k+EW*3+3]*tx)*ty; };
  const L=lightHeights(H, ww, wh, { light, relief:1.6, gloss:0.95, shadow:0.25, ao:0, ambient:0.55 });
  const small=document.createElement('canvas'); small.width=ww; small.height=wh;
  const sctx=small.getContext('2d', CPU), img=sctx.createImageData(ww,wh), d=img.data;
  const fog={r:236,g:238,b:240};
  for(let y=0;y<wh;y++) for(let x=0;x<ww;x++){
    const i=y*ww+x, q=i*4, hv=H[i];
    if(hv<=0){
      // dry glass: clear, or fogged by condensation
      d[q]=fog.r; d[q+1]=fog.g; d[q+2]=fog.b; d[q+3]=Math.round(255*mist*0.28); continue;
    }
    const gx=(H[y*ww+Math.min(ww-1,x+1)]-H[y*ww+Math.max(0,x-1)])*0.5, gy=(H[Math.min(wh-1,y+1)*ww+x]-H[Math.max(0,y-1)*ww+x])*0.5;
    // a drop sees wide: whatever its height on the glass it looks out at
    // much the same view, mostly sky — then turns it over
    const nz=1/Math.sqrt(1+gx*gx+gy*gy), u=x/ww, v=0.3 + 0.3*(y/wh);
    // refraction: the lens turns the view over; red, green and blue bend a
    // little differently (chromatic aberration at the rims)
    const K=0.45;
    const rr=envAt(u+gx*K*0.96, v+gy*K*0.96, 0), gg=envAt(u+gx*K, v+gy*K, 1), bb=envAt(u+gx*K*1.05, v+gy*K*1.05, 2);
    // the rim: light bends out of the drop there, so it reads dark; and the
    // sky reflects in it (Fresnel)
    // (a tiny droplet is too small to show a dark rim: it scales with the drop)
    const size=Math.min(1, hv/(unit*0.004));
    const tilt=1-nz, rim=Math.min(1, Math.pow(tilt*2.2, 2))*size, fres=Math.min(1, Math.pow(tilt*2, 3))*0.45;
    const sp=L.spec[i]*255*1.2;
    const sky=[envAt(u,0.05,0), envAt(u,0.05,1), envAt(u,0.05,2)], ref=[rr,gg,bb];
    for(let c=0;c<3;c++){
      const sh=M3 ? M3.sh[c] : 1;
      let val=ref[c]*(1-rim*0.6*(2-sh)) + sky[c]*fres + sp*(M3 ? M3.hi[c] : 1);
      d[q+c]=val<0?0:val>255?255:val;
    }
    d[q+3]=Math.round(255*Math.min(1, hv/0.6));
  }
  // runners clear the fog where they went: a wet, clear trail
  sctx.putImageData(img,0,0);
  if(mist>0.02){
    sctx.save(); sctx.globalCompositeOperation='destination-out';
    for(const t of TRAILS){ sctx.strokeStyle='rgba(0,0,0,0.9)'; sctx.lineWidth=t.r*0.9; sctx.lineCap='round'; sctx.beginPath();
      for(let s=0;s<t.len;s+=Math.max(1,t.r*0.3)){ const tx=t.x+Math.sin(s/(t.r*4)+t.wob)*t.r*0.18, ty=t.y-s; s?sctx.lineTo(tx,ty):sctx.moveTo(tx,ty); } sctx.stroke(); }
    sctx.restore();
    // (and the drops sitting on those trails are drawn again over them)
    const img2=sctx.getImageData(0,0,ww,wh), d2=img2.data;
    for(let i=0;i<N;i++) if(H[i]>0){ const q=i*4; d2[q]=d[q]; d2[q+1]=d[q+1]; d2[q+2]=d[q+2]; d2[q+3]=d[q+3]; }
    sctx.putImageData(img2,0,0);
  }
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU); ctx.imageSmoothingEnabled=true; ctx.drawImage(small,0,0,w,h);
  return c;
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
 * Dune Ripples — a field of wind-blown sand, after the way deserts are
 * simulated (Beneš & Roa: sand hops downwind, slides down faces steeper than
 * its angle of repose, and lies still in the wind's shadow behind a crest):
 *   DUNES      by the seed: TRANSVERSE ridges across the wind; BARCHANOID
 *              ridges broken into crescents; or LINEAR (seif) dunes running
 *              WITH the wind, sharp-crested and sinuous. Each has a long,
 *              gentle windward slope and a steep slip face; between them,
 *              smooth hollows
 *   RIPPLES    only where the wind works: thick on windward slopes, gone from
 *              the slip faces (avalanching sand is smooth) and faint in the
 *              lee; heavier, darker grains settle in their troughs
 *   THE SUN    the dial, as always — pulled past the rim it sinks lower still
 *   TILT       the camera: 0 looks straight down (a flat texture); higher, it
 *              tips toward the horizon and the far dunes fade into haze
 * RIPPLE SIZE · WIND (sharper, straighter ripples) · DUNE HEIGHT · TILT
 */
export function genDunes(w,h,amt,zoom,light,tint1,tint2,form,tilt,M3,GL){
  amt=(amt==null?0.5:amt); zoom=(zoom==null?1:zoom);
  const swell=Math.max(0,Math.min(1, form==null ? 0.4 : form)), tl=Math.max(0, Math.min(1, tilt==null ? 0 : tilt));
  const sand=parseHex(tint1||'#D9B98C'), sun=parseHex(tint2||'#FFF1D8');
  // tilted, a coarser working grid: the view is hazier, and the patch bigger
  const div=tl > 0.001 ? canonDiv(3) : canonDiv(2), ww=Math.ceil(w/div), wh=Math.ceil(h/div), unit=Math.min(ww,wh);
  const lambda=Math.max(3, unit*0.032*zoom), wind=Math.random()*Math.PI, cw=Math.cos(wind), sw=Math.sin(wind);
  const KINDS=['transverse','barchanoid','linear'], kind=KINDS[Math.floor(Math.random()*KINDS.length)];
  const L0=unit*(0.42+Math.random()*0.25), duneH=swell*unit*0.16;
  const F=obliqueFrame(ww, wh, tl*0.85, duneH*1.2 + lambda*0.3), GW=F.GW, GH=F.GH, N=GW*GH;
  // fields sampled in PAGE units (u = x/ww), so features keep their size however big the patch
  const ox=F.flat ? 0 : F.gcx - ww/2, oz=F.flat ? 0 : F.gcz - wh/2;
  const fs=(n, oct) => { const f=fbmSampler(n, oct); return (x, y) => f((x - ox)/ww + 3, (y - oz)/wh + 3); };
  const warp=fs(2, 3), breakup=fs(6, 2), big=fs(1.2, 3), along=fs(3.5, 2), grainN=fs(40, 1), duneW=fs(0.9, 2);
  const lee=0.34 - 0.22*Math.min(1, amt), meander=1.35 - 0.85*Math.min(1, amt), crest=0.55 + 0.7*Math.min(1, amt);
  const st=Math.max(2, Math.round(lambda/3));
  const gridF=(step, fn) => { const cw2=Math.ceil(GW/step)+2, ch=Math.ceil(GH/step)+2, g=new Float32Array(cw2*ch);
    for(let j=0;j<ch;j++) for(let i=0;i<cw2;i++) g[j*cw2+i]=fn(i*step, j*step);
    const out=new Float32Array(N);
    for(let y=0;y<GH;y++){ const fy=y/step, j=Math.floor(fy), ty=fy-j; for(let x=0;x<GW;x++){ const fx=x/step, i=Math.floor(fx), tx=fx-i, k=j*cw2+i;
      out[y*GW+x]=(g[k]*(1-tx)+g[k+1]*tx)*(1-ty)+(g[k+cw2]*(1-tx)+g[k+cw2+1]*tx)*ty; } }
    return out; };
  const Wf=gridF(st, (x,y)=>(3.2*warp(x,y) + 0.9*breakup(x,y))*meander), Af=gridF(st, (x,y)=>breakup(x+37,y+11));
  // (the dune-scale fields finely sampled: coarse cells showed as facets in the light)
  const Bw=gridF(2, (x,y)=>(big(x,y)-0.5)*2.2), Al=gridF(2, (x,y)=>along(x,y)), Dv=gridF(3, (x,y)=>duneW(x,y));
  const H=new Float32Array(N), RIP=new Float32Array(N), CR=GL ? new Float32Array(N) : null, TR=new Float32Array(N);
  const soft=(e)=>e*e*(3-2*e);
  for(let y=0;y<GH;y++) for(let x=0;x<GW;x++){
    const i=y*GW+x;
    // THE DUNE: position across (transverse, barchanoid) or along (linear) the wind
    const acr=(x*cw + y*sw), alo=(-x*sw + y*cw);
    let D=0, windward=1, shadow=0;
    if(kind==='linear'){
      const ph=alo/(L0*0.8) + Bw[i]*0.8 + 0.3*Math.sin(acr/(L0*1.6)), t=ph-Math.floor(ph);
      const s2=1-Math.abs(t*2-1); D=Math.pow(s2, 1.6);               // symmetric, sharp-crested
      windward=0.7; shadow=0;
    } else {
      const ph=acr/L0 + Bw[i], t=ph-Math.floor(ph), lf=0.22;
      if(t < 1-lf){ const e=t/(1-lf); D=1-(1-e)*(1-e); windward=1; shadow=0; }                     // the long windward slope, convex
      else { const e=(1-t)/lf; D=soft(e); windward=0.12; shadow=1-e; }                                  // the slip face, at the angle of repose
      // the wind's shadow: the first stretch of the next slope lies calm
      if(t < 0.18) shadow=Math.max(shadow, 1 - t/0.18);
      if(kind==='barchanoid') D*=Math.max(0, Math.min(1, (Al[i]-0.28)*2.6));                       // ridges broken into crescents
    }
    D*=0.55 + 0.9*Dv[i];
    // RIPPLES where the wind works
    const rph=(x*cw + y*sw)/lambda + Wf[i], rt=rph-Math.floor(rph);
    const prof = rt < 1-lee ? rt/(1-lee) : (1-rt)/lee, sprof=soft(prof);
    const rip = windward*(1 - 0.85*shadow)*(0.5 + 0.6*Af[i]);
    RIP[i]=rip; TR[i]=(1-sprof)*rip;                                 // troughs, where the heavy grains settle
    if(CR) CR[i]=Math.pow(sprof, 4)*rip;
    H[i] = D*duneH + sprof*lambda*0.1*crest*rip + (grainN(x,y)-0.5)*0.4;
  }
  const L=lightHeights(H, GW, GH, { light, relief:1, gloss:0.08, shadow:0.7, ao:0.2, ambient:0.42 });
  const RGB=new Float32Array(N*3);
  for(let i=0;i<N;i++){
    const s=L.spec[i]*0.35, tone=1.05 - 0.09*TR[i], e=CR ? CR[i]*180 : 0;
    for(let c=0;c<3;c++){ const sc=c===0?sand.r:c===1?sand.g:sand.b, uc=c===0?sun.r:c===1?sun.g:sun.b, gc=GL ? (c===0?GL.r:c===1?GL.g:GL.b) : 0;
      RGB[i*3+c]=clamp255(sc*litK(L,i,0.42,M3,c)*tone + uc*s*litS(M3,c) + gc*e); }
  }
  let OUT=RGB;
  if(!F.flat){
    // the haze: the sand's colour washed toward the sun's
    const fog=[sand.r*0.45+sun.r*0.55, sand.g*0.45+sun.g*0.55, sand.b*0.45+sun.b*0.55];
    OUT=obliqueRender(F, H, RGB, { fog, fogK: 0.3 + 0.4*tl });
  }
  return paintLit(w,h,div,ww,wh, i => [OUT[i*3], OUT[i*3+1], OUT[i*3+2]]);
}

/**
 * Kintsugi — glazed ceramic broken and mended with gold. Cracks follow the
 * edges of an organic, warped cell network (not every edge breaks), each
 * filled with a raised seam of gold. The glaze takes a glossy highlight; the
 * gold a bright metallic one, coloured by the gold itself.
 * SEAM WIDTH · FRACTURES · GLOSS
 */
export function genKintsugi(w,h,amt,zoom,light,tint1,tint2,form,M3,GL){
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
  // THE VESSEL: we look at the outside of a curved pot, not a flat plane — its
  // wall turns away toward the sides (a cylinder, upright or lying, or the
  // shoulder of a round bowl, by the seed). Given as normals, not heights:
  // the curve shades and catches its long highlight without casting shadows
  // across the whole page.
  const shape=Math.random(), across=Math.random()<0.5, Rv=Math.max(ww,wh)*(0.5+Math.random()*0.3);
  const vcx=ww*(0.3+Math.random()*0.4), vcy=wh*(0.3+Math.random()*0.4), CN=new Float32Array(ww*wh*3);
  for(let y=0;y<wh;y++) for(let x=0;x<ww;x++){
    let sx=0, sy=0;
    if(shape<0.65){ const d=((across ? y-vcy : x-vcx))/Rv; if(across) sy=d; else sx=d; }     // a cylinder
    else { sx=(x-vcx)/Rv; sy=(y-vcy)/Rv; }                                                   // a bowl's shoulder
    const m=Math.hypot(sx,sy), lim=0.92; if(m>lim){ sx*=lim/m; sy*=lim/m; }
    const k=(y*ww+x)*3; CN[k]=sx; CN[k+1]=sy; CN[k+2]=Math.sqrt(Math.max(0.01, 1-sx*sx-sy*sy));
  }
  // glazed pottery glows: more fill light than raw stone or sand gets
  const L=lightHeights(H, ww, wh, { light, relief:1.2, gloss:0.35 + gloss*0.6, shadow:0.5, ao:0.3, ambient:0.66, normals:CN });
  return paintLit(w,h,div,ww,wh, i => {
    const k0=litK(L,i,0.66,M3,0), k1=litK(L,i,0.66,M3,1), k2=litK(L,i,0.66,M3,2), s=L.spec[i], g=Math.min(1, G[i]*1.6);
    const s0=s*litS(M3,0), s1=s*litS(M3,1), s2=s*litS(M3,2);
    const gc=[gold.r*(0.35+0.75*k0) + 255*s0*1.2, gold.g*(0.35+0.75*k1) + 235*s1*1.2, gold.b*(0.35+0.75*k2) + 170*s2*1.0];
    const cc=[glaze.r*k0*1.12 + 255*s0*gloss, glaze.g*k1*1.12 + 255*s1*gloss, glaze.b*k2*1.12 + 255*s2*gloss];
    // GLOW: the gold seams give off light, and a little spills onto the glaze beside them
    if(GL){ const e=255*(g*0.9 + Math.min(1, G[i]*4)*(1-g)*0.25); gc[0]+=GL.r*e; gc[1]+=GL.g*e; gc[2]+=GL.b*e; cc[0]+=GL.r*e; cc[1]+=GL.g*e; cc[2]+=GL.b*e; }
    return [clamp255(cc[0]*(1-g) + gc[0]*g), clamp255(cc[1]*(1-g) + gc[1]*g), clamp255(cc[2]*(1-g) + gc[2]*g)];
  });
}

/**
 * Moss on Stone — rough stone, and moss where moss grows: in the crevices and
 * on the flatter tops, as soft raised clumps with a fibrous, matte surface.
 * The stone takes the light and casts shadow; DAMPNESS darkens and glosses
 * the stone and deepens the moss.  STONE SCALE · MOSS · DAMPNESS
 */
export function genMoss(w,h,amt,zoom,light,tint1,tint2,form,M3,GL){
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
  const TIP=GL ? new Float32Array(ww*wh) : null;
  // moss gathers where the stone dips below its neighbourhood, and where it is flat
  const at=(x,y)=>base[Math.min(wh-1,Math.max(0,y))*ww+Math.min(ww-1,Math.max(0,x))];
  const R=Math.max(2, Math.round(unit*0.02));
  for(let y=0;y<wh;y++) for(let x=0;x<ww;x++){
    const i=y*ww+x, hollow=(at(x-R,y)+at(x+R,y)+at(x,y-R)+at(x,y+R))/4 - base[i];
    const slope=Math.hypot(at(x+1,y)-at(x-1,y), at(x,y+1)-at(x,y-1));
    const want=GR[i] + hollow*0.12 - slope*0.08 + (amt - 0.5)*0.9;
    const m=Math.max(0, Math.min(1, (want - 0.42)*5));
    M[i]=m;
    const fb=fibre(x/ww,y/wh);
    H[i]=base[i] + m*(1.5 + 2.2*fb);                              // soft raised clumps, fibrous on top
    if(TIP) TIP[i]=m*Math.max(0, fb-0.45)*1.8;                    // the tips, for the glow
  }
  const L=lightHeights(H, ww, wh, { light, relief:1, gloss:0.15 + damp*0.55, shadow:0.7, ao:0.45, ambient:0.36 });
  const sd=1 - damp*0.35, mg=1 + damp*0.25;
  return paintLit(w,h,div,ww,wh, i => {
    const k0=litK(L,i,0.36,M3,0), k1=litK(L,i,0.36,M3,1), k2=litK(L,i,0.36,M3,2), m=M[i], s=L.spec[i]*(1-m);   // moss is matte; only wet stone shines
    const sc=[stone.r*sd*k0 + 255*s*litS(M3,0), stone.g*sd*k1 + 255*s*litS(M3,1), stone.b*sd*k2 + 255*s*litS(M3,2)];
    const mc=[moss.r*k0*0.95, moss.g*k1*mg, moss.b*k2*0.9];
    // GLOW: bioluminescent moss, brightest at the tips
    if(TIP){ const e=255*Math.min(1, TIP[i])*0.9; mc[0]+=GL.r*e; mc[1]+=GL.g*e; mc[2]+=GL.b*e; }
    return [clamp255(sc[0]*(1-m) + mc[0]*m), clamp255(sc[1]*(1-m) + mc[1]*m), clamp255(sc[2]*(1-m) + mc[2]*m)];
  });
}

/**
 * Metal Spangle (once Crystal Leaf): metal that crystallised as it cooled — the spangle on
 * galvanised zinc, the stepped hoppers of bismuth. Each GRAIN is one crystal,
 * and its face is tilted its own way (a normal map): turn the light and the
 * grains flash and darken one by one, which is what makes spangle look like
 * spangle.
 *   DENDRITES  feathered arms grown from each grain's nucleus; their barbs
 *              lean back toward it
 *   TERRACES   steps each crystal down into a hollow, square centre, and
 *              colours the steps as bismuth's oxide does — a thin film whose
 *              colour runs gold, magenta, blue, green with its thickness
 *   VARIATION  how unlike one another the crystals are: arms of different
 *              lengths, missing, bent, unevenly barbed; grains of every size;
 *              some with no dendrites at all (0: orderly, like a snowflake)
 *   BRUSHING   fine lines brushed across the light, like brushed steel — face
 *              by face, each grain's lines turned with its own tilt
 * Tiny FLECKS inside the crystal glint when the light finds them. Metal Hue
 * colours the metal; Highlight and Shade colour its shine and its shadow;
 * Glow lights the flecks from within.
 */
export function genSpangle(w,h,amt,zoom,light,tint,form,varK,brush,M3,GL){
  amt=(amt==null?0.5:amt); zoom=(zoom==null?1:zoom);
  const terr=Math.max(0,Math.min(1, form==null ? 0 : form)), dend=Math.max(0,Math.min(1,amt));
  const vr=Math.max(0,Math.min(1, varK==null ? 0.4 : varK)), br=Math.max(0,Math.min(1, brush==null ? 0 : brush));
  const metal=parseHex(tint||'#C9CED6');
  const div=canonDiv(2), ww=Math.ceil(w/div), wh=Math.ceil(h/div), unit=Math.min(ww,wh), N=ww*wh;
  const la=((light==null?315:light)-90)*Math.PI/180, SX=Math.cos(la), SY=Math.sin(la);   // toward the light
  // the grains: a jittered lattice of nuclei — more jittered, and of more
  // varied sizes, as Variation rises — each with its own facet tilt and axis
  const cs=unit*0.09*zoom, gx=Math.ceil(ww/cs)+2, gy=Math.ceil(wh/cs)+2, G=[];
  const jit=0.8 + 0.2*vr;
  for(let j=0;j<gy;j++) for(let i=0;i<gx;i++){
    const a=Math.random()*Math.PI*2, tilt=0.08+Math.random()*0.32, arms=[];
    const plain = Math.random() < vr*0.3;                        // some grains grow no dendrites
    for(let k=0;k<6;k++){
      const gone = plain || Math.random() < vr*0.35;
      arms.push({ a: k*Math.PI/3 + (Math.random()-0.5)*vr*0.45,          // not quite every 60°
                  len: gone ? 0 : 1 - vr*Math.random()*0.75,              // stunted, or full
                  bend: (Math.random()-0.5)*vr*0.7,                       // a curve along the arm
                  sp: 1 + (Math.random()-0.5)*vr*0.9, ph: Math.random(),  // barb spacing and phase
                  sl: 1 - vr*Math.random()*0.6, sr: 1 - vr*Math.random()*0.6 });   // barbs longer on one side
    }
    G.push({ x:(i-1+0.5+(Math.random()-0.5)*jit)*cs, y:(j-1+0.5+(Math.random()-0.5)*jit)*cs, th:Math.random()*Math.PI*2,
      tx:Math.cos(a)*tilt, ty:Math.sin(a)*tilt, size:(0.8+Math.random()*0.5)*(1 + (Math.random()-0.5)*vr*0.8), arms,
      film: Math.random()*0.5 });
  }
  const H=new Float32Array(N), Nm=new Float32Array(N*3), LV=terr>0.02 ? new Float32Array(N) : null, FL=terr>0.02 ? new Float32Array(N) : null;
  const bw=Math.max(0.8, unit*0.0012), aw=Math.max(0.7, unit*0.0011*zoom), bp=unit*0.008*zoom;   // groove, arm width, barb spacing
  const step=Math.max(3, unit*0.016*zoom), shH=Math.max(0.8, step*0.22);
  const S60=Math.sin(Math.PI/3), COT60=1/Math.tan(Math.PI/3);
  // brushing: random values per line across the light's direction, smoothed
  const BL = br>0.01 ? (()=>{ const n=Math.ceil(2*Math.hypot(ww,wh))+6, a=new Float32Array(n); for(let i=0;i<n;i++) a[i]=Math.random(); return a; })() : null;
  const bOff=Math.hypot(ww,wh)+2;                              // (u runs ±the diagonal)
  for(let y=0;y<wh;y++) for(let x=0;x<ww;x++){
    const ci=Math.floor(x/cs)+1, cj=Math.floor(y/cs)+1;
    let d1=1e18, d2=1e18, g1=null, g2=null;
    for(let b=cj-2;b<=cj+2;b++) for(let a=ci-2;a<=ci+2;a++){
      if(a<0||b<0||a>=gx||b>=gy) continue; const g=G[b*gx+a], dd=((x-g.x)*(x-g.x)+(y-g.y)*(y-g.y))/(g.size*g.size);
      if(dd<d1){ d2=d1; g2=g1; d1=dd; g1=g; } else if(dd<d2){ d2=dd; g2=g; }
    }
    const e1=Math.sqrt(d1)*g1.size, e2=g2 ? Math.sqrt(d2)*g2.size : 1e9, edge=(e2-e1)*0.5;   // to the boundary, roughly
    const i=y*ww+x, ux=x-g1.x, uy=y-g1.y, c=Math.cos(g1.th), s=Math.sin(g1.th);
    const lu=ux*c+uy*s, lv=-ux*s+uy*c;
    let hgt=-0.9*Math.exp(-(edge/bw)*(edge/bw));                       // the groove between grains
    if(dend>0.02){
      const reach=cs*0.75*g1.size; let f=0;
      for(const A of g1.arms){
        if(A.len<=0) continue;
        const R=reach*A.len;
        let ca=Math.cos(A.a), sa=Math.sin(A.a), al=lu*ca+lv*sa;
        if(al<=0 || al>R) continue;
        // bend: the arm's direction turns a little as it grows
        const tb=A.a + A.bend*(al/R); ca=Math.cos(tb); sa=Math.sin(tb);
        al=lu*ca+lv*sa; const ac=-lu*sa+lv*ca;
        if(al<=0 || al>R) continue;
        const fall=1-al/R;
        f=Math.max(f, Math.exp(-(ac/aw)*(ac/aw))*fall);
        // barbs every ~bp, leaning BACK toward the nucleus; shorter toward the tip
        const aa=Math.abs(ac), bl=(R-al)*0.28*(ac<0 ? A.sl : A.sr), sp=bp*A.sp;
        if(aa<bl){ const ph=(al+aa*COT60)/sp + A.ph, fr=ph-Math.round(ph); f=Math.max(f, Math.exp(-((fr*sp/(aw*S60))**2))*fall*(1-aa/bl)*0.8); }
      }
      hgt+=f*1.5*dend;
    }
    if(LV){
      // terraces: square ledges stepping down into a hollow centre (bismuth)
      const r=Math.max(Math.abs(lu),Math.abs(lv))*(1+0.04*Math.sin(Math.atan2(lv,lu)*4)), q=r/step, fl=Math.floor(q), sm=q-fl;
      hgt+=terr*shH*(fl + Math.max(0,(sm-0.82)/0.18));              // flat treads, a short riser
      LV[i]=fl; FL[i]=g1.film;
    }
    H[i]=hgt;
    // the crystal's face is tilted: its normal, shared by the whole grain;
    // brushing adds fine slopes across the light's direction
    let tx=g1.tx, ty=g1.ty;
    if(BL){
      // brushed FACE BY FACE: each grain's lines run across the light as that
      // face meets it (the light's direction, turned by the face's own tilt)
      let dX=SX+2.2*g1.tx, dY=SY+2.2*g1.ty; const dl=Math.hypot(dX,dY)||1; dX/=dl; dY/=dl;
      const n=BL.length-2, u=((x*dX+y*dY+bOff+g1.film*977)%n+n)%n, u0=Math.floor(u), t=u-u0, v=-x*dY+y*dX;
      const bv=(BL[u0]*(1-t)+BL[u0+1]*t) - 0.5 + 0.15*Math.sin(v*0.05 + u0);
      tx+=dX*bv*0.5*br; ty+=dY*bv*0.5*br; }
    const nz=1/Math.sqrt(1+tx*tx+ty*ty);
    Nm[i*3]=tx*nz; Nm[i*3+1]=ty*nz; Nm[i*3+2]=nz;
  }
  const L=lightHeights(H, ww, wh, { light, relief:1, gloss:0.9, shadow:0.6, ao:0.35, ambient:0.3, normals:Nm });
  const fl=L.flat||1;
  // metal: little diffuse, a strong highlight in its own colour; luminance kept,
  // so a mid-grey average leaves the page's tone where it was
  const lum=Math.max(1, 0.2126*metal.r+0.7152*metal.g+0.0722*metal.b), hue=[metal.r/lum, metal.g/lum, metal.b/lum];
  const iri=Math.pow(terr, 0.8)*0.85;
  const small=document.createElement('canvas'); small.width=ww; small.height=wh;
  const sctx=small.getContext('2d', CPU), img=sctx.createImageData(ww,wh), d=img.data;
  for(let i=0;i<N;i++){
    const sp=L.spec[i], q=i*4;
    // bismuth's oxide: a thin film, its colour set by its thickness — a little
    // thicker on each step out from the hollow
    let film=null;
    if(LV && iri>0){ const t=0.32 + LV[i]*0.085 + FL[i]; film=[0.5+0.5*Math.cos(6.283*(t*1.55)), 0.5+0.5*Math.cos(6.283*(t*1.9+0.1)), 0.5+0.5*Math.cos(6.283*(t*2.25+0.2))]; }
    for(let c=0;c<3;c++){
      const k=litK(L,i,0.3,M3,c)/fl;
      let hc=hue[c]; if(film){ const fn=film[c]/Math.max(0.2,(0.2126*film[0]+0.7152*film[1]+0.0722*film[2])); hc=hc*(1-iri)+Math.min(2.2,fn)*iri; }
      const v=128*(0.45+0.55*k) + 150*sp*litS(M3,c);
      // (oxide is saturated: the film's colour weighs more than the metal's own)
      const sat=film ? 0.55 - 0.3*iri : 0.55;
      d[q+c]=Math.max(0,Math.min(255, v*(sat+(1-sat)*hc) + 40*sp*(hc-1)));
    }
    d[q+3]=255;
  }
  sctx.putImageData(img,0,0);
  const out=document.createElement('canvas'); out.width=w; out.height=h;
  const octx=out.getContext('2d', CPU); octx.imageSmoothingEnabled=true; octx.drawImage(small,0,0,w,h);
  // FLECKS: tiny facets inside the crystal; each glints when it faces the
  // light, and with a Glow they shine of themselves
  const nf=Math.round(canonArea(w,h)/(3072*3072)*900*(0.4+vr));
  const lx=SX, ly=SY;
  for(let k=0;k<nf;k++){
    const x=Math.random()*w, y=Math.random()*h, fa=Math.random()*Math.PI*2, face=Math.max(0, Math.cos(fa - Math.atan2(ly,lx)));
    const glint=Math.pow(face, 10)*(0.5+0.5*Math.random()), r=cpx(0.7+Math.random()*1.2);
    if(glint>0.05){ octx.fillStyle=`rgba(255,255,255,${Math.min(1, glint)})`; octx.beginPath(); octx.arc(x,y,r,0,Math.PI*2); octx.fill(); }
    if(GL){ const g=octx.createRadialGradient(x,y,0,x,y,r*4), c3=`${GL.r*255|0},${GL.g*255|0},${GL.b*255|0}`;
      g.addColorStop(0,`rgba(${c3},0.9)`); g.addColorStop(1,`rgba(${c3},0)`); octx.fillStyle=g; octx.beginPath(); octx.arc(x,y,r*4,0,Math.PI*2); octx.fill(); }
  }
  return out;
}

/**
 * Old Paper — what time and handling do to a sheet (Foxing and Fold Ghost,
 * merged). Subtle by default; everything grows with its knob.
 *   FOLDS    a few long folds across the sheet, as it was folded to be
 *            carried (halves, a letter's thirds, a turned-down corner…); at
 *            the top of the range the folds give way and TEAR in from the edge
 *   AGE      0 is a clean sheet. Then it yellows from the edges, FOXING
 *            spots gather in clusters at the margins, MILDEW blooms in fuzzy
 *            colonies, and at the very end it has been near a flame: SCORCH
 *            at an edge, charred black, and a burn hole or two
 *   CRINKLE  the gentle unevenness of paper that was once damp, and the
 *            small creases of a pocket
 * Folds and crinkle are heights, lit by the dial. Age Hue colours the
 * yellowing and the foxing, Mould Hue the mildew; Specular and Shadow the
 * paper's sheen and its shade; GLOW makes the spots fluoresce, as foxing
 * does under ultraviolet.
 */
export function genOldPaper(w,h,amt,zoom,light,tint1,tint2,form,crinkle,M3,GL){
  amt=(amt==null?0.35:amt); zoom=(zoom==null?1:zoom);
  const folds=Math.max(0,Math.min(1,amt)), age=Math.max(0,Math.min(1, form==null ? 0.3 : form)), crk=Math.max(0,Math.min(1, crinkle==null ? 0.25 : crinkle));
  const AGEC=parseHex(tint1||'#8A6A3C'), MOLD=parseHex(tint2||'#5F6A4E');
  const div=canonDiv(2), ww=Math.ceil(w/div), wh=Math.ceil(h/div), unit=Math.min(ww,wh), N=ww*wh;
  const H=new Float32Array(N), depth=unit*0.0035*zoom;
  // FOLDS: how it was folded, chosen by the seed (as Fold Ghost did)
  const nFolds=folds<0.04 ? 0 : Math.max(1, Math.round(1 + folds*5));
  const a0=Math.random()<0.5 ? 0 : Math.PI/2, scheme=Math.floor(Math.random()*4);
  const askew=()=>(Math.random()-0.5)*0.14, hand=s=>(Math.random()-0.5)*s, side=()=>Math.random()<0.5 ? 1 : -1;
  const plan=[];
  if(scheme===0) plan.push([a0+askew(), hand(0.24), 1], [a0+Math.PI/2+askew(), hand(0.24), 1]);
  else if(scheme===1) plan.push([a0+askew(), -1/6+hand(0.08), 1], [a0+askew()*0.6, 1/6+hand(0.08), 1]);
  else if(scheme===2) plan.push([a0+askew(), -1/6+hand(0.08), 1], [a0+askew()*0.6, 1/6+hand(0.08), 1], [a0+Math.PI/2+askew(), hand(0.2), 0.8]);
  else plan.push([a0+askew(), hand(0.26), 1], [a0+side()*Math.PI/4+askew(), side()*(0.3+Math.random()*0.12), 0.8]);
  while(plan.length < nFolds) plan.push([Math.random()*Math.PI, hand(0.8), 0.5+Math.random()*0.5]);
  plan.splice(nFolds);
  const fd=depth*(0.4+folds*0.9);
  const FL=plan.map(([a, off, str]) => { const nx=-Math.sin(a), ny=Math.cos(a), px=ww*(0.5 + off*nx), py=wh*(0.5 + off*ny);
    return { a, nx, ny, px, py, c: nx*px + ny*py, s: side(), d: fd*str, reach: unit*(0.06+Math.random()*0.06) }; });
  // CRINKLE: pocket creases, short and fading at their ends, and broad soft buckles
  const nCrum=Math.round(60*Math.pow(crk, 1.6));                // few at the default: a gentle sheet
  const crum=[];
  for(let k=0;k<nCrum;k++){ const a=Math.random()*Math.PI, L=unit*(0.05+Math.random()*0.2);
    crum.push({ x:Math.random()*ww, y:Math.random()*wh, dx:Math.cos(a), dy:Math.sin(a), L, s:Math.random()<0.5?1:-1, d:depth*(0.2+Math.random()*0.35), reach:unit*(0.012+Math.random()*0.02) }); }
  const fibre=fbmSampler(60, 2), buckle=fbmSampler(3, 2);
  for(let y=0;y<wh;y++) for(let x=0;x<ww;x++){
    let hv=(fibre(x/ww,y/wh)-0.5)*0.3 + (buckle(x/ww,y/wh)-0.5)*unit*0.03*crk;
    for(const f of FL){ const dd=Math.abs(x*f.nx + y*f.ny - f.c); hv += f.s*f.d*(Math.max(0, 1 - dd/(f.reach*0.08))*1.2 - Math.min(dd, f.reach)/f.reach); }
    for(const c of crum){ const rx=x-c.x, ry=y-c.y, along=rx*c.dx + ry*c.dy; if(along < -c.L || along > c.L) continue;
      const across=Math.abs(-rx*c.dy + ry*c.dx); if(across > c.reach) continue; hv += c.s*c.d*(1 - Math.pow(along/c.L, 2))*(1 - across/c.reach); }
    H[y*ww+x]=hv;
  }
  // TEARS: at the top of the Folds range, a fold gives way from the page's edge
  const TEARS=[];
  const nTear=folds>0.75 ? Math.max(1, Math.round((folds-0.75)*8)) : 0;
  for(let t=0;t<nTear && FL.length;t++){
    const f=FL[t%FL.length], dir=[Math.cos(f.a), Math.sin(f.a)];
    // walk the fold line out to the page's edge; tear in from there
    let sx=f.px, sy=f.py, sgn=Math.random()<0.5?1:-1; for(let k=0;k<4000;k++){ const nx2=sx+dir[0]*sgn, ny2=sy+dir[1]*sgn; if(nx2<0||ny2<0||nx2>=ww||ny2>=wh) break; sx=nx2; sy=ny2; }
    const len=unit*(0.1+Math.random()*0.2), pts=[[sx,sy]];
    let x=sx, y=sy, ang=Math.atan2(-dir[1]*sgn, -dir[0]*sgn);
    for(let s=0;s<len;s+=unit*0.006){ ang+=(Math.random()-0.5)*0.5; x+=Math.cos(ang)*unit*0.006; y+=Math.sin(ang)*unit*0.006; pts.push([x,y]); }
    TEARS.push(pts);
    // the two sides of a tear no longer meet: one lifts a little
    for(let i=1;i<pts.length;i++){ const [px,py]=pts[i], wdt=unit*0.006*(1 - i/pts.length);
      for(let yy=Math.max(0,Math.floor(py-wdt*3));yy<Math.min(wh,Math.ceil(py+wdt*3));yy++) for(let xx=Math.max(0,Math.floor(px-wdt*3));xx<Math.min(ww,Math.ceil(px+wdt*3));xx++){
        const d=Math.hypot(xx-px,yy-py); if(d<wdt*3) H[yy*ww+xx]+=depth*1.2*(1-d/(wdt*3))*(((xx-px)*Math.sin(ang)-(yy-py)*Math.cos(ang))>0 ? 1 : -0.5); } }
  }
  // lit, gently: paper is matte
  const L=lightHeights(H, ww, wh, { light, relief:1, gloss:0.1, shadow:0.4, ao:0.2, ambient:0.5 });
  const fl=L.flat||1, fs=lightHeights(new Float32Array(1), 1, 1, { light, relief:1, gloss:0.1, shadow:0, ao:0, ambient:0.5 }).spec[0];
  const c=paintLit(w,h,div,ww,wh, i => { const dl=(L.light[i]/fl - 1)*120, sp=(L.spec[i]-fs)*90;
    if(!M3){ const v=128 + dl + sp; return [clamp255(v), clamp255(v), clamp255(v)]; }
    return [clamp255(greyLit(dl, sp, M3, 0)), clamp255(greyLit(dl, sp, M3, 1)), clamp255(greyLit(dl, sp, M3, 2))]; });
  const ctx=c.getContext('2d', CPU), U=Math.min(w,h), rgba=(o,a)=>`rgba(${o.r|0},${o.g|0},${o.b|0},${a})`;
  // marks are laid on a mid-grey ground that blends away, so to show on a
  // pale page they must sit well below it: the hues, deepened
  const deepen=(o,k)=>({ r:o.r*k, g:o.g*k, b:o.b*k });
  const SPOT=deepen(AGEC, 0.55), MOLDD=deepen(MOLD, 0.6), TONE=deepen(AGEC, 0.8);
  // AGE 1 · yellowing, from the edges in, unevenly (tide marks where it was damp)
  if(age>0.02){
    const g=ctx.createRadialGradient(w/2,h/2,U*0.25,w/2,h/2,Math.hypot(w,h)*0.6);
    g.addColorStop(0, rgba(TONE,0)); g.addColorStop(1, rgba(TONE, Math.min(0.55, age*0.5)));
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    for(let k=0;k<Math.round(age*4);k++){ const x=Math.random()*w, y=Math.random()*h, r=U*(0.1+Math.random()*0.2);
      ctx.strokeStyle=rgba(TONE, 0.18*age); ctx.lineWidth=cpx(2); ctx.beginPath();
      for(let a=0;a<=48;a++){ const an=a/48*Math.PI*2, rr=r*(1+0.15*Math.sin(an*3+k)+0.08*Math.sin(an*7+k*2)); a?ctx.lineTo(x+Math.cos(an)*rr,y+Math.sin(an)*rr):ctx.moveTo(x+Math.cos(an)*rr,y+Math.sin(an)*rr); }
      ctx.stroke(); }
  }
  // AGE 2 · foxing: rusty spots, in clusters, favouring the margins
  const SPOTS=[];
  const clusters=age<0.08 ? 0 : Math.round(2 + age*9);
  for(let k=0;k<clusters;k++){
    const edge=Math.random(), cx=edge<0.5 ? w*(Math.random()*0.28) : w*(0.72+Math.random()*0.28), cy=h*Math.random();
    const spread=U*(0.06+Math.random()*0.14)*zoom, n=4+Math.floor(Math.random()*9*Math.min(1, age*1.6));
    for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, d=Math.pow(Math.random(),0.7)*spread, x=cx+Math.cos(a)*d, y=cy+Math.sin(a)*d, rr=U*(0.003+Math.random()*0.012)*zoom;
      const gg=ctx.createRadialGradient(x,y,0,x,y,rr); const al=Math.min(1, 0.25 + age*0.45);
      gg.addColorStop(0, rgba(SPOT, 0.75*al)); gg.addColorStop(0.55, rgba(SPOT, 0.38*al)); gg.addColorStop(1, rgba(SPOT, 0));
      ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(x,y,rr,0,Math.PI*2); ctx.fill(); SPOTS.push({x,y,r:rr}); }
  }
  // AGE 3 · mildew: fuzzy colonies — a soft blotch, a darker frayed rim, spores around it
  if(age>0.45){
    const n=Math.round((age-0.45)/0.55*12*(0.6+Math.random()*0.8));
    for(let k=0;k<n;k++){
      const x=Math.random()*w, y=Math.random()*h, r=U*(0.012+Math.random()*0.045)*zoom, al=0.3+0.4*(age-0.45)/0.55;
      const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0, rgba(MOLDD, al*0.7)); g.addColorStop(0.75, rgba(MOLDD, al*0.45)); g.addColorStop(1, rgba(MOLDD, 0));
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=rgba({r:MOLD.r*0.6,g:MOLD.g*0.6,b:MOLD.b*0.6}, al*0.6); ctx.lineWidth=cpx(1.2); ctx.beginPath();
      for(let a=0;a<=72;a++){ const an=a/72*Math.PI*2, rr=r*0.8*(1+0.12*Math.sin(an*5+k)+0.1*(Math.random()-0.5)); a?ctx.lineTo(x+Math.cos(an)*rr,y+Math.sin(an)*rr):ctx.moveTo(x+Math.cos(an)*rr,y+Math.sin(an)*rr); }
      ctx.stroke();
      ctx.fillStyle=rgba({r:MOLD.r*0.7,g:MOLD.g*0.7,b:MOLD.b*0.7}, al*0.8);
      for(let s=0;s<40;s++){ const a=Math.random()*Math.PI*2, d=r*(0.5+Math.random()*1.3); ctx.beginPath(); ctx.arc(x+Math.cos(a)*d, y+Math.sin(a)*d, cpx(0.6+Math.random()*1.4), 0, Math.PI*2); ctx.fill(); }
    }
  }
  // AGE 4 · near a flame: scorch at an edge (charred, then browned), a burn hole
  if(age>0.8){
    const nb=1+Math.floor((age-0.8)*10);
    for(let b=0;b<nb;b++){
      const hole=b>0 && Math.random()<0.5, e=Math.floor(Math.random()*4);
      const x=hole ? w*(0.2+Math.random()*0.6) : (e===0 ? Math.random()*w : e===1 ? w : e===2 ? Math.random()*w : 0);
      const y=hole ? h*(0.2+Math.random()*0.6) : (e===0 ? 0 : e===1 ? Math.random()*h : e===2 ? h : Math.random()*h);
      const R=U*(hole ? 0.025+Math.random()*0.03 : 0.07+Math.random()*0.12), ph=[Math.random()*6,Math.random()*6,Math.random()*6];
      // a burn's edge wanders in long lobes, not spikes
      const edgeAt=an=>R*(1+0.22*Math.sin(an*2+ph[0])+0.1*Math.sin(an*5+ph[1])+0.035*Math.sin(an*11+ph[2]));
      const ring=(k)=>{ ctx.beginPath(); for(let a=0;a<=96;a++){ const an=a/96*Math.PI*2, rr=edgeAt(an)*k; a?ctx.lineTo(x+Math.cos(an)*rr,y+Math.sin(an)*rr):ctx.moveTo(x+Math.cos(an)*rr,y+Math.sin(an)*rr); } ctx.closePath(); };
      // browned paper around it, then the char
      for(let k=1.6;k>1.0;k-=0.1){ ring(k); ctx.fillStyle=`rgba(110,62,26,${0.08})`; ctx.fill(); }
      ring(1.0); ctx.fillStyle='rgba(40,22,12,0.85)'; ctx.fill();
      ring(0.88); ctx.fillStyle=hole ? 'rgba(8,6,5,0.95)' : 'rgba(14,10,8,0.95)'; ctx.fill();
      // a glowing ember line at the char's edge, faint
      ring(0.98); ctx.strokeStyle='rgba(150,70,20,0.35)'; ctx.lineWidth=cpx(1.5); ctx.stroke();
    }
  }
  // TEARS: the gap (the dark under the paper) and the torn fibres at its lip
  for(const pts of TEARS){
    for(let i=1;i<pts.length;i++){ const t=1-i/pts.length;
      ctx.strokeStyle=`rgba(20,16,12,${0.85})`; ctx.lineWidth=Math.max(cpx(0.8), U*0.006*t); ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(pts[i-1][0]*div, pts[i-1][1]*div); ctx.lineTo(pts[i][0]*div, pts[i][1]*div); ctx.stroke();
      ctx.strokeStyle='rgba(250,246,236,0.5)'; ctx.lineWidth=Math.max(cpx(0.6), U*0.002);
      ctx.beginPath(); ctx.moveTo(pts[i-1][0]*div+cpx(2), pts[i-1][1]*div+cpx(2)); ctx.lineTo(pts[i][0]*div+cpx(2)+(Math.random()-0.5)*cpx(2), pts[i][1]*div+cpx(2)); ctx.stroke(); }
  }
  // GLOW: the spots fluoresce, as foxing does under ultraviolet
  if(GL){
    const g3=`${GL.r*255|0},${GL.g*255|0},${GL.b*255|0}`;
    ctx.save(); ctx.globalCompositeOperation='lighter';
    for(const sp of SPOTS){ const g=ctx.createRadialGradient(sp.x,sp.y,0,sp.x,sp.y,sp.r*1.4);
      g.addColorStop(0,`rgba(${g3},0.55)`); g.addColorStop(1,`rgba(${g3},0)`); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sp.x,sp.y,sp.r*1.4,0,Math.PI*2); ctx.fill(); }
    ctx.restore();
  }
  return c;
}

/**
 * Crystal Leaf — looking INTO a crystal, close up: quartz, amethyst, a
 * geode's heart. Light enters through the facets and bounces inside:
 *   FACETS     a few large cut faces, flat, each tilted its own way; light
 *              comes in at the edge turned toward it and fades as it goes
 *              deeper, so every face is a gradient, bright edge to dark
 *   DEPTH      a second set of faces behind the first, seen THROUGH it —
 *              shifted by each front face's tilt (refraction) — whose edges
 *              show as soft internal reflections
 *   FIRE       light caught inside: bright planes where it meets an
 *              internal face at a grazing angle and flashes, split into its
 *              colours (dispersion) as it goes
 *   CLARITY    clear and deep at 100; milky, veiled, at 0
 *   PHANTOMS   ghost crystals inside: the outlines of the faces it had as it
 *              grew, two or three nested in some of the faces
 *   INCLUSIONS rutile needles and tiny bubbles caught in the stone
 * Crystal Hue colours the stone, Inclusion Hue the needles; Specular,
 * Shadow and Diffuse light it; Glow lights the fire from within.
 * (Brushed metal, terraces and flecks — the old Crystal Leaf — live on as
 * Metal Spangle.)
 */
export function genCrystalLeaf(w,h,amt,zoom,light,tint1,tint2,form,phantoms,inclusions,M3,GL){
  amt=(amt==null?0.7:amt); zoom=(zoom==null?1:zoom);
  const clarity=Math.max(0,Math.min(1,amt)), fire=Math.max(0,Math.min(1, form==null ? 0.5 : form));
  const ph=Math.max(0,Math.min(1, phantoms==null ? 0.3 : phantoms)), inc=Math.max(0,Math.min(1, inclusions==null ? 0.2 : inclusions));
  const CR=parseHex(tint1||'#B9A6D8'), IN=parseHex(tint2||'#D9A441');
  const div=canonDiv(2), ww=Math.ceil(w/div), wh=Math.ceil(h/div), unit=Math.min(ww,wh), N=ww*wh;
  const la=((light==null?315:light)-90)*Math.PI/180, SX=Math.cos(la), SY=Math.sin(la);
  // a set of faces: centres on a jittered lattice, each a tilted plane
  const faces=(cs)=>{ const gx=Math.ceil(ww/cs)+2, gy=Math.ceil(wh/cs)+2, F=[];
    for(let j=0;j<gy;j++) for(let i=0;i<gx;i++){ const a=Math.random()*Math.PI*2, t=0.2+Math.random()*0.5;
      F.push({ x:(i-1+0.1+Math.random()*0.8)*cs, y:(j-1+0.1+Math.random()*0.8)*cs, tx:Math.cos(a)*t, ty:Math.sin(a)*t,
               tone:Math.random(), ghost:Math.random()<0.45,
               rot:Math.random()*Math.PI/3, slope:0.45+Math.random()*0.5, h:Math.random()*cs*0.4, film:Math.random(), stri:0.4+Math.random()*1.2 }); }
    return { cs, gx, gy, F }; };
  const near=(S,x,y)=>{ const ci=Math.floor(x/S.cs)+1, cj=Math.floor(y/S.cs)+1; let d1=1e18, d2=1e18, f1=null, f2=null;
    for(let b=cj-1;b<=cj+1;b++) for(let a=ci-1;a<=ci+1;a++){ if(a<0||b<0||a>=S.gx||b>=S.gy) continue; const f=S.F[b*S.gx+a], dd=(x-f.x)**2+(y-f.y)**2;
      if(dd<d1){ d2=d1; f2=f1; d1=dd; f1=f; } else if(dd<d2){ d2=dd; f2=f; } }
    const edge=f2 ? (d2-d1)/(2*Math.hypot(f2.x-f1.x, f2.y-f1.y)) : 1e9; return { f:f1, g:f2, edge }; };
  const FRONT=faces(unit*0.42*zoom), BACK=faces(unit*0.27*zoom);
  // FIRE: internal planes through the stone; grazing light flashes most
  const np=Math.round(3+fire*12), P=[];
  for(let k=0;k<np;k++){ const a=Math.random()*Math.PI, nx=-Math.sin(a), ny=Math.cos(a), px=Math.random()*ww, py=Math.random()*wh;
    const meet=Math.abs(nx*SX+ny*SY), flash=(0.25+0.75*Math.pow(1-meet, 2))*(0.15+0.85*Math.random()**1.5);
    P.push({ nx, ny, c:nx*px+ny*py, wd:unit*(0.004+Math.random()*0.018), flash, ax:Math.cos(a), ay:Math.sin(a), mid:px*Math.cos(a)+py*Math.sin(a), len:unit*(0.15+Math.random()*0.5) }); }
  const veil=makeNoiseGrid(8,8), feathers=makeNoiseGrid(40,40);
  const NM=new Float32Array(N*3), H=new Float32Array(N), V=new Float32Array(N*3);
  const spec=(t)=>[ Math.max(0, Math.min(1, 1.5-Math.abs(t*4-3))), Math.max(0, Math.min(1, 1.5-Math.abs(t*4-2))), Math.max(0, Math.min(1, 1.5-Math.abs(t*4-1))) ];
  const REFR=unit*0.12, TAU=Math.PI*2;
  for(let y=0;y<wh;y++) for(let x=0;x<ww;x++){
    const i=y*ww+x, A=near(FRONT,x,y), f=A.f;
    // EACH CRYSTAL A POINT: a six-sided pyramid seen from above (a geode's
    // druse, quartz points) — six triangular faces round its apex, each lit
    // on its own; where neighbours meet, a valley
    const dx=x-f.x, dy=y-f.y, rr=Math.hypot(dx,dy), R=FRONT.cs*0.62;
    const ang=((Math.atan2(dy,dx)-f.rot)%TAU+TAU)%TAU, sec=Math.floor(ang/(Math.PI/3)), fr=ang/(Math.PI/3)-sec;
    const mid=(sec+0.5)*Math.PI/3+f.rot, mx=Math.cos(mid), my=Math.sin(mid), along=dx*mx+dy*my;   // along: the hexagonal distance from the apex
    // growth striations across each face (quartz's horizontal lines), as a ripple in its slope
    const stri=Math.sin(along/Math.max(1, unit*0.004)+f.film*6)*0.05*f.stri;
    const sl=f.slope*(1+stri), nz=1/Math.sqrt(1+sl*sl);
    NM[i*3]=mx*sl*nz; NM[i*3+1]=my*sl*nz; NM[i*3+2]=nz;
    H[i]=(f.h - f.slope*along)*0.35;                                // for the shadows one point throws on the next
    // light enters through a face turned toward it, and fades as it goes in
    const admit=0.3+0.7*Math.max(0, -(mx*SX+my*SY));
    let v=0.08+0.08*f.tone + admit*0.42*Math.max(0, 1-along/R*0.8);
    // inner glow pooling toward the heart of each point (masked away from its rim, as a Fresnel term would)
    v+=0.22*clarity*Math.exp(-((rr/(R*0.55))**2));
    // DEPTH: crystals behind, seen through the face it is on — bent by that face's tilt, and fading
    const B=near(BACK, x+mx*f.slope*REFR, y+my*f.slope*REFR);
    v+=0.07*B.f.tone + 0.3*Math.exp(-B.edge/(unit*0.004))*clarity*(0.4+0.6*admit);
    // the ridges between faces, and the apex: crisp, worn bright (edge highlights)
    const ridge=rr*Math.sin(Math.min(fr, 1-fr)*Math.PI/3);
    v+=0.55*Math.exp(-ridge/(unit*0.0016))*Math.min(1, rr/(unit*0.01)) + 0.35*Math.exp(-A.edge/(unit*0.0016));
    // PHANTOMS: smaller points it once was, nested inside it — hexagons
    if(ph>0.02 && f.ghost){ const st=R*0.22, k=along/st;
      if(k>0.6 && k<3.6){ const q=k-Math.floor(k); v+=Math.exp(-(((Math.min(q, 1-q))*st/(unit*0.0016))**2))*ph*0.4; } }
    // a thin-film sheen on the faces: faint bands of colour (iridescence)
    const film=Math.sin(along/R*9 + f.film*9);
    let r0=v, g0=v, b0=v;
    if(fire>0.05){ const sp=spec(0.5+0.5*film), k2=0.06*fire*admit; r0+=sp[0]*k2; g0+=sp[1]*k2; b0+=sp[2]*k2; }
    let r=r0, g=g0, bl=b0;
    for(const p of P){ const d=x*p.nx+y*p.ny-p.c; if(Math.abs(d)>p.wd*7) continue;
      const along=x*p.ax+y*p.ay-p.mid; if(Math.abs(along)>p.len) continue;
      const fade=Math.sin(Math.PI*0.5*(1-Math.abs(along)/p.len)), str=p.flash*fade*(0.3+0.7*fire);
      const core=Math.exp(-((d/p.wd)**2))*str*0.75, halo=Math.exp(-((d/(p.wd*5))**2))*str*0.12;  // the flash, and light scattered round it
      const sp=spec(Math.max(0,Math.min(1, 0.5+d/(p.wd*2.5)*0.5))), dsp=0.3+0.7*fire;
      r+=halo+core*((1-dsp)+dsp*sp[0]*1.5); g+=halo+core*((1-dsp)+dsp*sp[1]*1.5); bl+=halo+core*((1-dsp)+dsp*sp[2]*1.5);
      if(GL){ r+=(core+halo*2)*GL.r; g+=(core+halo*2)*GL.g; bl+=(core+halo*2)*GL.b; } }
    // CLARITY: a milky veil, feathered
    const cloud=(1-clarity)*(0.35+0.65*sampleNoiseGrid(veil,8,8,x/ww*7,y/wh*7))*(0.7+0.3*sampleNoiseGrid(feathers,40,40,x/ww*39,y/wh*39));
    r=r*(1-cloud*0.55)+cloud*0.6; g=g*(1-cloud*0.55)+cloud*0.6; bl=bl*(1-cloud*0.55)+cloud*0.6;
    V[i*3]=r; V[i*3+1]=g; V[i*3+2]=bl;
  }
  const L=lightHeights(H, ww, wh, { light, relief:1, gloss:0.95, shadow:0.45, ao:0.25, ambient:0.5, normals:NM });
  const fl=L.flat||1, lum=Math.max(1, 0.2126*CR.r+0.7152*CR.g+0.0722*CR.b), hue=[CR.r/lum, CR.g/lum, CR.b/lum];
  const small=document.createElement('canvas'); small.width=ww; small.height=wh;
  const sctx=small.getContext('2d', CPU), img=sctx.createImageData(ww,wh), d=img.data;
  for(let i=0;i<N;i++){
    const q=i*4, sp=L.spec[i];
    for(let c=0;c<3;c++){
      // deep (dark) stone carries the hue fully; the bright fire, less
      const k=litK(L,i,0.5,M3,c)/fl, inside=V[i*3+c], tint=hue[c]**(1.2-Math.min(1, inside));
      const val=255*inside*tint*(0.45+0.6*k) + 230*sp*litS(M3,c);
      d[q+c]=val<0?0:val>255?255:val;
    }
    d[q+3]=255;
  }
  sctx.putImageData(img,0,0);
  const out=document.createElement('canvas'); out.width=w; out.height=h;
  const ctx=out.getContext('2d', CPU); ctx.imageSmoothingEnabled=true; ctx.drawImage(small,0,0,w,h);
  // INCLUSIONS: rutile needles — fine, straight, golden, in sprays — and bubbles
  if(inc>0.02){
    const U=Math.min(w,h), sprays=Math.round(1+inc*5);
    ctx.lineCap='round';
    for(let s2=0;s2<sprays;s2++){ const cx=Math.random()*w, cy=Math.random()*h, a0=Math.random()*Math.PI, n=Math.round(4+inc*22);
      for(let k=0;k<n;k++){ const a=a0+(Math.random()-0.5)*0.5, L2=U*(0.05+Math.random()*0.2), ox=cx+(Math.random()-0.5)*U*0.15, oy=cy+(Math.random()-0.5)*U*0.15;
        ctx.strokeStyle=`rgba(${IN.r},${IN.g},${IN.b},${0.55+Math.random()*0.4})`; ctx.lineWidth=cpx(2.5+Math.random()*3);
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox+Math.cos(a)*L2, oy+Math.sin(a)*L2); ctx.stroke();
        const gl=Math.pow(Math.abs(Math.sin(a-la)), 4);              // a needle across the light glints
        if(gl>0.2){ ctx.strokeStyle=`rgba(255,250,230,${0.6*gl})`; ctx.lineWidth=cpx(1.5);
          ctx.beginPath(); ctx.moveTo(ox+Math.cos(a)*L2*0.35, oy+Math.sin(a)*L2*0.35); ctx.lineTo(ox+Math.cos(a)*L2*0.55, oy+Math.sin(a)*L2*0.55); ctx.stroke(); } } }
    const nb=Math.round(inc*160);
    for(let k=0;k<nb;k++){ const x=Math.random()*w, y=Math.random()*h, r=cpx(4+Math.random()*Math.random()*22);
      ctx.strokeStyle='rgba(255,255,255,0.45)'; ctx.lineWidth=cpx(2.2); ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,0.65)'; ctx.beginPath(); ctx.arc(x-SX*r*0.4, y-SY*r*0.4, r*0.28, 0, Math.PI*2); ctx.fill(); }
  }
  return out;
}
