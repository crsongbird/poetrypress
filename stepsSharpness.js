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
import { CPU, scaleNow, kitCanvas, kitField, kitImage } from './texCore.js';

const SH_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];

/** Dots on a w×h canvas: a cell every max(w,h)/48·scale, each dot's radius the tone there (0..1 field on w×h). */
function paintScreen(w, h, tone, weight, scale, angleDeg){
  const [c, x] = kitCanvas(w, h);
  x.fillStyle = 'rgb(205,205,205)'; x.fillRect(0, 0, w, h);
  const cell = Math.max(w, h)/48*scale, a = angleDeg*Math.PI/180, ca = Math.cos(a), sa = Math.sin(a);
  // the screen's grid, turned by its angle, covering the whole page
  const reach = Math.hypot(w, h)/2, n = Math.ceil(reach/cell) + 1, cx0 = w/2, cy0 = h/2;
  x.fillStyle = 'rgb(60,60,60)';
  for(let j = -n; j <= n; j++) for(let i = -n; i <= n; i++){
    const u = (i + 0.5)*cell, v = (j + 0.5)*cell, px = cx0 + u*ca - v*sa, py = cy0 + u*sa + v*ca;
    if(px < -cell || py < -cell || px > w + cell || py > h + cell) continue;
    const t = tone[Math.min(h - 1, Math.max(0, py|0))*w + Math.min(w - 1, Math.max(0, px|0))];
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


export const SHARP_STEPS = {
  screen: { cat: 'Marks', label: 'Halftone Screen', ins: ['tone'], outs: ['dots'], io: { ins: ['field'], outs: ['field'] },
    params: [SH_R('scale', 'Dot Scale', 100, 50, 400), SH_R('weight', 'Dot Weight', 100, 30, 240), SH_R('angle', 'Screen Angle', 0, 0, 90)], cost: () => 3,
    paint(E, n){ const tone = kitField(E.input(n, 1) ?? 0.5, E.ww, E.wh) || new Float32Array(E.ww*E.wh).fill(0.5);
      return [paintScreen(E.ww, E.wh, tone, E.num(n, 'weight', 100)/100, E.num(n, 'scale', 100)/100, E.num(n, 'angle', 0))]; },
    run(E, n){ return [kitField(this.paint(E, n)[0], E.ww, E.wh)]; } },
  grain: { cat: 'Noise', label: 'Film Grain', ins: [], outs: ['grain'], io: { outs: ['image'] },
    params: [SH_R('size', 'Grain Size', 100, 100, 600), SH_R('contrast', 'Contrast', 100, 30, 240), SH_R('kind', 'Kind', 33)], cost: () => 3,
    paint(E, n){ return [paintGrain(E.ww, E.wh, E.num(n, 'contrast', 100)/100, E.num(n, 'size', 100)/100, E.num(n, 'kind', 33)/100)]; },
    run(E, n){ return [kitImage(this.paint(E, n)[0], E.ww, E.wh)]; } },
};
