/**
 * stepsSharpness.js — steps for √ SHARPNESS surfaces, each a part that works on
 * anything (the componentizing rule: every texture's techniques loadable,
 * viewable and mixable in the Athanor).
 *
 *   screen   HALFTONE SCREEN: any tone printed as a screen of dots — a dot at
 *            each cell, its size the tone there — at an angle, as print does.
 *            (Halftone: Value Noise → Halftone Screen → Surface.)
 *   grain    FILM GRAIN: silver halide (crisp, clumped), film, paper (its
 *            formation and fibres) or a digital sensor (per-channel noise,
 *            rows and columns), blended between neighbours by Kind.
 */
import { CPU, scaleNow, wordsRoom, kitCanvas, kitField, kitImage, withSeed, canonDiv, lightHeights, kitWhole, wholeDial, wholeHex, wholeZoom, wholeAmt, wholeShare } from './texCore.js';
import { genCityscape, genFlowers } from './texSharpness.js';

const SH_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];

/** Dots on a w×h canvas: a cell every max(w,h)/48·scale, each dot's radius the tone there (0..1 field on w×h). */
function paintScreen(w, h, tone, weight, scale, angleDeg, room){
  const [c, x] = kitCanvas(w, h);
  x.fillStyle = 'rgb(205,205,205)'; x.fillRect(0, 0, w, h);
  const cell = Math.max(w, h)/48*scale, a = angleDeg*Math.PI/180, ca = Math.cos(a), sa = Math.sin(a);
  // the screen's grid, turned by its angle, covering the whole page
  const reach = Math.hypot(w, h)/2, n = Math.ceil(reach/cell) + 1, cx0 = w/2, cy0 = h/2;
  x.fillStyle = 'rgb(60,60,60)';
  for(let j = -n; j <= n; j++) for(let i = -n; i <= n; i++){
    const u = (i + 0.5)*cell, v = (j + 0.5)*cell, px = cx0 + u*ca - v*sa, py = cy0 + u*sa + v*ca;
    if(px < -cell || py < -cell || px > w + cell || py > h + cell) continue;
    const q = Math.min(h - 1, Math.max(0, py|0))*w + Math.min(w - 1, Math.max(0, px|0)), t = tone[q]*(room ? room[q] : 1);
    const r = t*cell*0.48*weight; if(r < 0.6) continue;
    x.beginPath(); x.arc(px, py, r, 0, Math.PI*2); x.fill();
  }
  return c;
}

// ---- FILM GRAIN (as it was: texSharpness genGrain) ----
function paintGrain(w,h,amt,zoom,form){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const f=Math.max(0, Math.min(1, form==null ? 0.33 : form));
  const STOPS=[0, 0.33, 0.66, 1], KINDS=['silver', 'film', 'paper', 'digital'];
  let k=0; while(k<2 && f>STOPS[k+1]) k++;
  const t=(f-STOPS[k])/(STOPS[k+1]-STOPS[k]);
  const gz=5*zoom*scaleNow(), gw0=Math.max(1,Math.round(w/gz)), gh0=Math.max(1,Math.round(h/gz));
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU);
  const gauss=()=>Math.sqrt(-2*Math.log(Math.random()||1e-9))*Math.cos(6.2832*Math.random());
  // a smooth random field, `cell` grain-cells across, read bilinearly
  const coarse=(cell, gw=gw0, gh=gh0)=>{ const cw=Math.ceil(gw/cell)+2, ch=Math.ceil(gh/cell)+2, g=new Float32Array(cw*ch);
    for(let i=0;i<g.length;i++) g[i]=Math.random();
    return (x,y)=>{ const fx=x/cell, fy=y/cell, i=fx|0, j=fy|0, tx=fx-i, ty=fy-j, q=j*cw+i, sx=tx*tx*(3-2*tx), sy=ty*ty*(3-2*ty);
      return (g[q]*(1-sx)+g[q+1]*sx)*(1-sy)+(g[q+cw]*(1-sx)+g[q+cw+1]*sx)*sy; }; };
  const draw=(kind, alpha)=>{
    // paper's fibres are finer than a grain: it works on a grid twice as fine
    const fine=kind==='paper'?2:1, gw=gw0*fine, gh=gh0*fine, n=gw*gh;
    const small=document.createElement('canvas'); small.width=gw; small.height=gh;
    const sctx=small.getContext('2d', CPU), img=sctx.createImageData(gw,gh), d=img.data;
    if(kind==='film'){
      for(let i=0;i<d.length;i+=4){ const v=128+(Math.random()*2-1)*100*amt; d[i]=v; d[i+1]=v; d[i+2]=v; d[i+3]=255; }
    } else if(kind==='silver'){
      // each grain is crisp — nearly black or clear — and they gather in clumps
      const clump=coarse(2.7);
      for(let y=0;y<gh;y++) for(let x=0;x<gw;x++){ const s=0.55*Math.random()+0.45*clump(x,y), v=Math.max(-1,Math.min(1,(s-0.5)*3.4));
        const q=(y*gw+x)*4; d[q]=d[q+1]=d[q+2]=128+v*100*amt; d[q+3]=255; }
    } else if(kind==='paper'){
      // formation: the cloudiness of a sheet held to the light; then fibres
      const m1=coarse(18, gw, gh), m2=coarse(6, gw, gh), F=new Float32Array(n);
      const fibres=Math.round(n/30);
      for(let k2=0;k2<fibres;k2++){
        const x0=Math.random()*gw, y0=Math.random()*gh, len=4+Math.random()*14, a=(Math.random()<0.6 ? (Math.random()-0.5)*0.7 : Math.random()*Math.PI), s=(Math.random()<0.5?-1:1)*(0.12+Math.random()*0.16);
        for(let u=0;u<len;u+=0.5){ const x=(x0+Math.cos(a)*u)|0, y=(y0+Math.sin(a)*u)|0; if(x>=0&&y>=0&&x<gw&&y<gh) F[y*gw+x]+=s*Math.sin(Math.PI*u/len); }
      }
      for(let y=0;y<gh;y++) for(let x=0;x<gw;x++){ const i=y*gw+x, v=(m1(x,y)-0.5)*1.3+(m2(x,y)-0.5)*0.6+F[i]+(Math.random()-0.5)*0.3;
        const q=i*4; d[q]=d[q+1]=d[q+2]=128+Math.max(-1.2,Math.min(1.2,v))*85*amt; d[q+3]=255; }
    } else {
      // a sensor: noise per photosite, a little of it in each colour alone,
      // rows that read out a touch differently, a faint fixed column pattern
      const row=new Float32Array(gh), col=new Float32Array(gw);
      for(let y=0;y<gh;y++) row[y]=gauss()*0.08; for(let x=0;x<gw;x++) col[x]=gauss()*0.05;
      for(let y=0;y<gh;y++) for(let x=0;x<gw;x++){ const base=gauss()*0.42+row[y]+col[x], q=(y*gw+x)*4;
        for(let ch=0;ch<3;ch++) d[q+ch]=128+Math.max(-1.3,Math.min(1.3,base+gauss()*0.16))*100*amt; d[q+3]=255; }
    }
    sctx.putImageData(img,0,0);
    ctx.globalAlpha=alpha; ctx.imageSmoothingEnabled = kind!=='digital';   // a sensor's pixels stay square
    ctx.drawImage(small,0,0,w,h); ctx.globalAlpha=1; ctx.imageSmoothingEnabled=true;
  };
  if(t<=1e-6) draw(KINDS[k], 1);
  else if(t>=1-1e-6) draw(KINDS[k+1], 1);
  else { draw(KINDS[k], 1); draw(KINDS[k+1], t); }
  return c;
}


// A lathe once turned
// for a whole afternoon so
// no one could copy it.
/**
 * Guilloché — the engraved rosettes of banknotes and watch dials, after the
 * rose engine and the geometric lathe: a field of fine interlaced waves, and
 * rosettes laid over it, each many copies of one wavy loop, turned a little
 * each time, so the lines weave into lace. Cut into the plate: drawn as fine
 * grooves and lit by the dial (light on one wall, shade on the other).
 * ROSETTE SIZE · LINE DENSITY · LOBES
 * Returns [the engraved plate, lit (full size), the lines themselves (on a grid of its own)].
 */
function shGuilloche(w,h,amt,zoom,light,form){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const lobeK=Math.max(0,Math.min(1, form==null?0.5:form));
  const div=canonDiv(2), ww=Math.ceil(w/div), wh=Math.ceil(h/div), unit=Math.min(ww,wh), N=ww*wh;
  const cv=document.createElement('canvas'); cv.width=ww; cv.height=wh;
  const x=cv.getContext('2d', CPU); x.fillStyle='#000'; x.fillRect(0,0,ww,wh);
  x.strokeStyle='#fff'; x.lineCap='round'; x.lineJoin='round';
  const lw=Math.max(0.55, unit*0.0011);
  // THE FIELD: interlaced waves across the plate, two families half a period apart
  const lam=unit*(0.07+0.05*Math.random())*zoom, amp=lam*(0.18+0.12*Math.random()), gap=unit*0.0065/Math.max(0.3, amt)*zoom;
  const tilt=(Math.random()-0.5)*0.4, ct=Math.cos(tilt), st=Math.sin(tilt);
  x.globalAlpha=0.55; x.lineWidth=lw*0.85;
  for(let fam=0; fam<2; fam++){
    for(let y0=-unit*0.5; y0<wh+unit*0.5; y0+=gap){
      x.beginPath();
      for(let px=-unit*0.3; px<=ww+unit*0.3; px+=Math.max(1, lam/24)){
        const yy=y0 + amp*Math.sin(px/lam*Math.PI*2 + fam*Math.PI + y0/(gap*9));
        const X=px*ct - (yy-wh/2)*st + 0, Y=wh/2 + px*st + (yy-wh/2)*ct;
        if(px===-unit*0.3) x.moveTo(X,Y); else x.lineTo(X,Y);
      }
      x.stroke();
    }
  }
  // THE ROSETTES: copies of one lobed loop, each turned a little
  const nR=1 + Math.floor(Math.random()*3);
  for(let k=0;k<nR;k++){
    const R=unit*(0.16+0.16*Math.random())*zoom, cx=ww*(0.15+0.7*Math.random()), cy=wh*(0.15+0.7*Math.random());
    const lobes=Math.round(5 + lobeK*19 + Math.random()*4), lobes2=Math.round(lobes*(1.5+Math.random())), a1=0.17+0.14*Math.random(), a2=0.04+0.05*Math.random()*lobeK;
    const copies=Math.round((24 + 40*Math.min(2, amt))*(0.7+Math.random()*0.5)), inner=0.42+0.12*Math.random();
    // a clear ring under each rosette, so it reads over the field
    x.globalAlpha=1; x.fillStyle='#000'; x.beginPath(); x.arc(cx, cy, R*(1+a1+a2)*1.03, 0, Math.PI*2); x.fill();
    // the outer band: one lobed loop, its phase stepped round a whole cycle copy
    // by copy, so the loops cross and weave into a mesh
    x.globalAlpha=0.9; x.lineWidth=lw;
    const steps=Math.max(360, lobes*36);
    for(let j=0;j<copies;j++){
      const ph=j/copies*Math.PI*2;
      x.beginPath();
      for(let s2=0;s2<=steps;s2++){ const t=s2/steps*Math.PI*2;
        const r=R*(1 + a1*Math.sin(lobes*t + ph) + a2*Math.sin(lobes2*t - ph*2));
        const X=cx + Math.cos(t)*r, Y=cy + Math.sin(t)*r; if(s2) x.lineTo(X,Y); else x.moveTo(X,Y); }
      x.stroke();
    }
    // the heart: a spirograph (hypotrochoid) that closes on itself, turned a few times
    const Rr=R*inner*(1 - a1*0.5), m=[2,3,5,7][Math.floor(Math.random()*4)], nT=Math.max(m+1, Math.round(lobes*0.6)), rr=Rr*m/nT, dd=rr*(0.65+0.3*Math.random());
    const turns=Math.max(3, Math.round(6 + 10*Math.min(2, amt)*0.5));
    x.globalAlpha=0.8; x.lineWidth=lw*0.9;
    for(let j=0;j<turns;j++){
      const rot=j/turns*Math.PI*2/nT; x.beginPath();
      const st2=Math.max(600, nT*m*20);
      for(let s2=0;s2<=st2;s2++){ const t=s2/st2*Math.PI*2*m;
        const X0=(Rr-rr)*Math.cos(t) + dd*Math.cos((Rr-rr)/rr*t), Y0=(Rr-rr)*Math.sin(t) - dd*Math.sin((Rr-rr)/rr*t);
        const X=cx + X0*Math.cos(rot) - Y0*Math.sin(rot), Y=cy + X0*Math.sin(rot) + Y0*Math.cos(rot); if(s2) x.lineTo(X,Y); else x.moveTo(X,Y); }
      x.stroke();
    }
  }
  x.globalAlpha=1;
  // engraved: the lines are GROOVES (heights below the plate), lit by the dial
  const px=x.getImageData(0,0,ww,wh).data, H=new Float32Array(N), C=new Float32Array(N);
  for(let i=0;i<N;i++){ const v=px[i*4]/255; C[i]=v; H[i]=-v*unit*0.0025; }
  const L=lightHeights(H, ww, wh, { light, relief:1, gloss:0.6, shadow:0.3, ao:0.4, ambient:0.5 });
  const small=document.createElement('canvas'); small.width=ww; small.height=wh;
  const sx=small.getContext('2d', CPU), im=sx.createImageData(ww,wh), d=im.data;
  for(let i=0;i<N;i++){
    // the plate mid-grey; a groove darker, its lit wall catching the light
    const k=L.light[i]/L.flat, v=128*k - C[i]*34 + L.spec[i]*90;
    const q=i*4; d[q]=d[q+1]=d[q+2]=v<0?0:v>255?255:v; d[q+3]=255;
  }
  sx.putImageData(im,0,0);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const cx2=c.getContext('2d', CPU); cx2.imageSmoothingEnabled=true; cx2.drawImage(small,0,0,w,h);
  return [c, cv];
}

export const SHARP_STEPS = {
  // Night City and Lotus Pond, each one part (kitWhole: drawn as it always was, under the texture's own seed + Variant)
  cityscape: kitWhole({ cat: 'Textures', label: 'Night City', ins: ['window hue', 'water hue'], outs: ['city'], io: { ins: ['colour', 'colour'], outs: ['image'] },
    params: [SH_R('zoom', 'Skyline Height', 100, 60, 180), SH_R('amount', 'Lit Windows', 100, 0, 300), SH_R('variant', 'Variant', 0, 0, 99)], cost: () => 5 },
    (E, n, w, h) => { const t1 = wholeHex(E, n, 1), t2 = wholeHex(E, n, 2), a = wholeAmt(E, n, 'amount', 100), z = wholeZoom(E, n, 'zoom', 100);
      return () => genCityscape(w, h, a, z, t1, t2, E.ctx.glow || null); }),
  lotus: kitWhole({ cat: 'Marks', label: 'Lotus Pond', ins: ['light from', 'petal hue', 'heart hue'], outs: ['blooms'], io: { ins: ['value', 'colour', 'colour'], outs: ['image'] },
    params: [SH_R('zoom', 'Bloom Size', 150, 50, 450), SH_R('amount', 'Bloom Count', 60, 10, 300), SH_R('form', 'Flower', 50), SH_R('variant', 'Variant', 0, 0, 99)], cost: () => 6 },
    (E, n, w, h) => { const light = wholeDial(E, n, 1), t1 = wholeHex(E, n, 2), t2 = wholeHex(E, n, 3), a = wholeAmt(E, n, 'amount', 60), z = wholeZoom(E, n, 'zoom', 150), f = wholeShare(E, n, 'form', 50);
      return () => genFlowers(w, h, a, z, t1, t2, f, light, E.ctx.glow || null); }),
  rosettes: { cat: 'Marks', label: 'Guilloché', ins: ['light from'], outs: ['engraving', 'lines'], io: { ins: ['value'], outs: ['image', 'field'] },
    params: [SH_R('zoom', 'Rosette Size', 100, 50, 250), SH_R('amount', 'Line Density', 100, 30, 200), SH_R('form', 'Lobes', 45), SH_R('variant', 'Variant', 0, 0, 99)], cost: () => 8,
    // a canvas pass at full size, under the texture's own seed (+ Variant): Guilloché as it was
    paint(E, n){ const { ww: w, wh: h } = E, dv = E.input(n, 1), light = typeof dv === 'number' ? dv*360 : (E.ctx.light ?? 315);
      const seed = ((E.ctx.seed >>> 0) + Math.round(E.num(n, 'variant', 0))*7919) >>> 0;
      return withSeed(seed, () => shGuilloche(w, h, Math.max(0.02, E.num(n, 'amount', 100)/100), Math.max(0.25, E.num(n, 'zoom', 100)/100), light, E.num(n, 'form', 45)/100)); },
    run(E, n){ const [c, l] = this.paint(E, n); return [E.readCanvas(c), E.asField(E.readCanvas(l))]; } },
  screen: { cat: 'Marks', label: 'Halftone Screen', ins: ['tone'], outs: ['dots'], io: { ins: ['field'], outs: ['field'] },
    params: [SH_R('scale', 'Dot Scale', 100, 50, 400), SH_R('weight', 'Dot Weight', 100, 30, 240), SH_R('angle', 'Screen Angle', 0, 0, 90)], cost: () => 3,
    // (Shape Aware: round the words the dots shrink away, a clean margin of paper about each line; in the letters the
    //  screen is finer, to show in a stroke)
    paint(E, n){ const tone = kitField(E.input(n, 1) ?? 0.5, E.ww, E.wh) || new Float32Array(E.ww*E.wh).fill(0.5);
      return [paintScreen(E.ww, E.wh, tone, E.num(n, 'weight', 100)/100, E.num(n, 'scale', 100)/100*(E.ctx.fill ? 0.45 : 1), E.num(n, 'angle', 0), wordsRoom(E.ctx, E.ww, E.wh, 0.3, 1.4))]; },
    run(E, n){ return [kitField(this.paint(E, n)[0], E.ww, E.wh)]; } },
  grain: { cat: 'Noise', label: 'Film Grain', ins: [], outs: ['grain'], io: { outs: ['image'] },
    params: [SH_R('size', 'Grain Size', 100, 100, 600), SH_R('contrast', 'Contrast', 100, 30, 240), SH_R('kind', 'Kind', 33)], cost: () => 3,
    paint(E, n){ return [paintGrain(E.ww, E.wh, E.num(n, 'contrast', 100)/100, E.num(n, 'size', 100)/100, E.num(n, 'kind', 33)/100)]; },
    run(E, n){ return [kitImage(this.paint(E, n)[0], E.ww, E.wh)]; } },
};
