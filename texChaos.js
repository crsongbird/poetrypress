/**
 * texChaos.js — ∆ Chaos. Pattern: geometry going wrong.
 *
 * Pain, dysphoria. Sigils, enochian noise, summoning circles, the
 * Rorschach, fractured glaze, facet field, cartomancy.
 */
import { GLYPHS, GLYPH_FONT } from './spell.js';
import { makeNoiseGrid, sampleNoiseGrid, CPU, canonArea, canonDiv, cpx, lightVec, lightHeights, lightSparse, parseHex, litK, litS } from './texCore.js';

// A sigil is drawn, then gone —
// the mark remembers nothing.
// Ink on nothing. Ink.
export function genSigils(w,h,amt,zoom,light,form){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const chaos = Math.max(0, Math.min(1, form==null ? 0.2 : form));
  // Hand-inscribed with a BROAD NIB: a stroke is thick where it crosses the
  // nib's angle and thin where it runs along it — the thick-and-thin that makes
  // writing look written. Ink pools where a stroke ends and bleeds a little into
  // the page. Each sigil is also cut INTO the ground (the dark ones, a chisel's
  // V-groove) or stands RAISED from it (the light ones), and the lighting
  // engine lights that relief by the dial: a lit wall and a shadowed one in
  // every cut, a shadow beside every raised stroke.
  // CHAOS is the hand: steady at 0; above it the hand trembles, the line
  // wanders, the nib skips into scratches, ink spatters.
  const div=canonDiv(2), ww=Math.ceil(w/div), wh=Math.ceil(h/div);
  const layer=bg=>{ const cv=document.createElement('canvas'); cv.width=ww; cv.height=wh; const x=cv.getContext('2d', CPU); x.fillStyle=bg; x.fillRect(0,0,ww,wh); return [cv,x]; };
  const [inkC, ink]=layer('#808080'), [cutC, cut]=layer('#000'), [upC, up]=layer('#000');
  cut.globalCompositeOperation='lighten'; up.globalCompositeOperation='lighten';
  cut.fillStyle='#fff'; up.fillStyle='#fff';
  const unit = Math.max(ww,wh);
  const count = Math.max(6, Math.round((38 + Math.random()*26) * amt));
  // a tremor: a few sines at medium frequencies, and a finer scratchy jitter
  const tremor = () => { const f=[2.3+Math.random(), 5.1+Math.random()*2, 11+Math.random()*4, 29+Math.random()*9, 53+Math.random()*13], ph=f.map(()=>Math.random()*6.283), a=[1,0.5,0.22,0.07,0.035];
    return t => { let s=0; for(let k=0;k<5;k++) s+=a[k]*Math.sin(f[k]*t*6.283+ph[k]); return s; }; };
  // a stroke's centreline, sampled; a trembling hand pushes it sideways
  const lineAt = (x1,y1,x2,y2,curve,cx,cy,amp) => { const pts=[], n=amp>0?48:16, tr=amp>0?tremor():null;
    for(let k=0;k<=n;k++){ const t=k/n; let x, y;
      if(curve){ const u=1-t; x=u*u*x1+2*u*t*cx+t*t*x2; y=u*u*y1+2*u*t*cy+t*t*y2; }
      else { x=x1+(x2-x1)*t; y=y1+(y2-y1)*t; }
      pts.push([x,y]); }
    if(tr) for(let k=0;k<=n;k++){ const p=pts[k], q=pts[Math.min(n,k+1)], o=pts[Math.max(0,k-1)], dir=Math.atan2(q[1]-o[1], q[0]-o[0]), s=tr(k/n)*amp;
      p[0]-=Math.sin(dir)*s; p[1]+=Math.cos(dir)*s; }
    return pts; };
  // the inked shape of a stroke: width from the nib's angle, tapering at the
  // very ends; an unsteady hand presses unevenly
  const nibShape = (pts, nib, nibA, press) => { const L=[], Rr=[], pr=press>0?tremor():null;
    for(let k=0;k<pts.length;k++){
      const p=pts[k], q=pts[Math.min(pts.length-1,k+1)], o=pts[Math.max(0,k-1)];
      const dir=Math.atan2(q[1]-o[1], q[0]-o[0]);
      const t=k/(pts.length-1), end=Math.min(1, Math.min(t, 1-t)*7 + 0.35);
      const half=nib*(0.18 + 0.82*Math.abs(Math.sin(dir - nibA)))*end/2*(pr ? Math.max(0.2, 1+press*pr(t)*0.45) : 1);
      L.push([p[0]-Math.sin(dir)*half, p[1]+Math.cos(dir)*half]); Rr.push([p[0]+Math.sin(dir)*half, p[1]-Math.cos(dir)*half]); }
    // a plain list of points (no Path2D, so the generator runs anywhere)
    return L.concat(Rr.reverse()); };
  const fillPoly = (ctx, pts) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for(let k=1;k<pts.length;k++) ctx.lineTo(pts[k][0], pts[k][1]); ctx.closePath(); ctx.fill(); };
  let nibSum=0;
  for(let i=0;i<count;i++){
    const cx = Math.random()*ww, cy = Math.random()*wh;
    const r = unit*(0.012 + Math.random()*0.038) * zoom;
    // some sigils are cut dark into the ground, some stand light out of it
    const emerging = Math.random() < 0.62;
    const tone = emerging ? 18 : 226;
    const alpha = 0.40 + Math.random()*0.5;
    const nib = Math.max(cpx(1.4)/div, unit*0.0032*(0.6+Math.random()*0.8)*zoom); nibSum+=nib;
    const nibA = (35 + (Math.random()-0.5)*20)*Math.PI/180;    // the scribe's hand
    const strokes = 3 + Math.floor(Math.random()*4);
    const rot = Math.random()*Math.PI*2;
    const wander = (r*0.04 + nib*0.25)*Math.pow(chaos, 1.5);              // how far the hand strays
    const marks = [], thin = [];                              // full nib strokes; scratches
    for(let s=0;s<strokes;s++){
      const a1 = rot + (s/strokes)*Math.PI*2 + (Math.random()-0.5)*0.9;
      const a2 = a1 + (Math.random()-0.5)*2.4;
      const r1 = r*(0.15+Math.random()*0.5), r2 = r*(0.55+Math.random()*0.6)*(1 + chaos*(Math.random()-0.3)*0.4);   // overshoot, or fall short
      const x1=cx+Math.cos(a1)*r1, y1=cy+Math.sin(a1)*r1, x2=cx+Math.cos(a2)*r2, y2=cy+Math.sin(a2)*r2;
      const curve=Math.random()<0.4;
      if(chaos>0.3 && Math.random()<(chaos-0.2)*0.75){
        // the nib skips: the stroke comes out as a few thin scratches, side by side
        const K=2+Math.floor(Math.random()*2);
        for(let k=0;k<K;k++){
          const o=(k-(K-1)/2)*nib*0.5 + (Math.random()-0.5)*nib*0.4, a=Math.atan2(y2-y1,x2-x1)+Math.PI/2, ox=Math.cos(a)*o, oy=Math.sin(a)*o;
          const s0=(Math.random()-0.3)*0.15*chaos, s1=1+(Math.random()-0.5)*0.2*chaos;
          thin.push(lineAt(x1+(x2-x1)*s0+ox, y1+(y2-y1)*s0+oy, x1+(x2-x1)*s1+ox, y1+(y2-y1)*s1+oy, curve, cx+ox, cy+oy, wander));
        }
      } else marks.push(lineAt(x1,y1,x2,y2, curve, cx, cy, wander));
    }
    if(Math.random()<0.45){
      const rr=r*(0.2+Math.random()*0.45), pts=[], tr=chaos>0?tremor():null;
      for(let k=0;k<=40;k++){ const t=k/40*Math.PI*2, q=rr*(1+(tr?tr(k/40)*0.08*chaos:0)); pts.push([cx+Math.cos(t)*q, cy+Math.sin(t)*q]); }
      marks.push(pts);
    }
    const shapes = marks.map(p => nibShape(p, nib, nibA, chaos)).concat(thin.map(p => nibShape(p, nib*0.3, nibA, chaos)));
    // the relief: cut into the ground, or raised from it
    for(const sh of shapes) fillPoly(emerging ? cut : up, sh);
    // bleed, then the ink itself — it sits in the cut, or on the raised stroke
    ink.save(); ink.shadowColor=`rgba(${tone},${tone},${tone},${alpha*0.5})`; ink.shadowBlur=nib*0.6;
    ink.fillStyle=`rgba(${tone},${tone},${tone},${alpha*0.8})`; for(const sh of shapes) fillPoly(ink, sh); ink.restore();
    // ink pools where each stroke ends; a shaky hand spatters
    ink.fillStyle=`rgba(${tone},${tone},${tone},${Math.min(1,alpha*1.05)})`;
    for(const p of marks){ const e=p[p.length-1]; ink.beginPath(); ink.arc(e[0],e[1],nib*0.42,0,Math.PI*2); ink.fill(); }
    if(chaos>0.4) for(let k=Math.round(Math.random()*chaos*5);k>0;k--){
      const p=(marks[0]||thin[0]), e=p[Math.floor(Math.random()*p.length)], d=nib*(1+Math.random()*5*chaos), a=Math.random()*6.283;
      ink.beginPath(); ink.arc(e[0]+Math.cos(a)*d, e[1]+Math.sin(a)*d, nib*(0.08+Math.random()*0.22), 0, Math.PI*2); ink.fill();
    }
  }
  // heights from the masks: how far each point lies inside its stroke
  // (a chamfer distance) — a V-groove for a cut, a rounded ridge for a raise
  const N=ww*wh, H=new Float32Array(N), D=new Float32Array(N);
  const nibAvg=nibSum/count, ridge=nibAvg*0.35;
  const depthOf=(data, sign)=>{
    for(let i=0;i<N;i++) D[i]=data[i*4]>=128 ? 1e6 : 0;
    for(let y=0;y<wh;y++) for(let x=0;x<ww;x++){ const i=y*ww+x; if(!D[i]) continue; let v=D[i];
      if(x>0) v=Math.min(v,D[i-1]+1); if(y>0){ v=Math.min(v,D[i-ww]+1); if(x>0) v=Math.min(v,D[i-ww-1]+1.414); if(x<ww-1) v=Math.min(v,D[i-ww+1]+1.414); } D[i]=v; }
    for(let y=wh-1;y>=0;y--) for(let x=ww-1;x>=0;x--){ const i=y*ww+x; if(!D[i]) continue; let v=D[i];
      if(x<ww-1) v=Math.min(v,D[i+1]+1); if(y<wh-1){ v=Math.min(v,D[i+ww]+1); if(x<ww-1) v=Math.min(v,D[i+ww+1]+1.414); if(x>0) v=Math.min(v,D[i+ww-1]+1.414); } D[i]=v; }
    for(let i=0;i<N;i++){ const m=data[i*4]/255; if(m<=0) continue;
      const d = D[i]>0 ? D[i]-1+m : m*0.9;                    // the mask's soft edge keeps the walls smooth
      H[i] += sign<0 ? -d*0.9 : ridge*(1-Math.exp(-d/(nibAvg*0.22))); }
  };
  depthOf(cut.getImageData(0,0,ww,wh).data, -1);
  depthOf(up.getImageData(0,0,ww,wh).data, 1);
  const L=lightSparse(H, ww, wh, { light, relief:1, gloss:0.3, shadow:0.6, ao:0.5, ambient:0.4 });
  const sFlat=lightHeights(new Float32Array(1), 1, 1, { light, relief:1, gloss:0.3, shadow:0, ao:0, ambient:0.4 }).spec[0];
  const img=ink.getImageData(0,0,ww,wh), d=img.data, fl=L.flat||1;
  for(let i=0;i<N;i++){
    const k=L.light[i]/fl, s=(L.spec[i]-sFlat)*110;
    if(k===1 && s===0) continue;
    const q=i*4;
    d[q]=Math.max(0,Math.min(255,d[q]*k+s)); d[q+1]=Math.max(0,Math.min(255,d[q+1]*k+s)); d[q+2]=Math.max(0,Math.min(255,d[q+2]*k+s));
  }
  ink.putImageData(img,0,0);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU); ctx.imageSmoothingEnabled=true; ctx.drawImage(inkC,0,0,w,h);
  return c;
}

// Counting backwards from
// a number nobody wrote down.
// The grid keeps the score.
export function genMathNoise(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const c = document.createElement('canvas');
  c.width=w; c.height=h;
  const ctx = c.getContext('2d', CPU);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0,0,w,h);

  const cell = Math.max(cpx(6), Math.round((Math.max(w,h)/72) * zoom));    // floor in canonical pixels
  const cols = Math.ceil(w/cell), rows = Math.ceil(h/cell);
  const gw = Math.max(2, Math.round(cols/6)), gh = Math.max(2, Math.round(rows/6));
  const field = makeNoiseGrid(gw, gh);

  for(let ry=0; ry<rows; ry++){
    for(let rx=0; rx<cols; rx++){
      const n = sampleNoiseGrid(field, gw, gh, rx/cols, ry/rows);
      // low field values stay empty ground; the pattern surfaces out of it
      const gate = Math.max(0.02, Math.min(0.95, 0.46 / amt));
      if(n < gate) continue;
      const strength = (n-gate)/(1-gate);
      const x = rx*cell, y = ry*cell;
      const pad = cell*0.22;
      const dark = Math.random() < 0.7;
      const tone = dark ? 26 : 232;
      ctx.globalAlpha = 0.18 + strength*0.62*Math.random();
      ctx.strokeStyle = `rgb(${tone},${tone},${tone})`;
      ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
      ctx.lineWidth = Math.max(cpx(0.5), cell*0.09);

      const kind = Math.floor(Math.random()*4);
      if(kind===0){
        ctx.fillRect(x+pad, y+pad, cell-pad*2, cell-pad*2);
      } else if(kind===1){
        ctx.strokeRect(x+pad, y+pad, cell-pad*2, cell-pad*2);
      } else if(kind===2){
        ctx.beginPath();
        ctx.moveTo(x+pad, y+cell*0.5);
        ctx.lineTo(x+cell-pad, y+cell*0.5);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(x+cell*0.5, y+pad);
        ctx.lineTo(x+cell*0.5, y+cell-pad);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
  return c;
}

// Circles drawn to hold
// something that will not be held.
// Chalk. Then wind. Then chalk.
export function genSummoningCircles(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const ctx = c.getContext('2d', CPU);
  ctx.fillStyle = '#808080'; ctx.fillRect(0,0,w,h);

  // Transmutation circles, each assembled from a varied set of parts so no
  // two read alike: a seal at the heart; rings doubled, dashed or dotted; one
  // or two bands of real alchemical glyphs; a star polygram or interlocking
  // polygons; vertex nodes or planet circles on the rim, each with a glyph;
  // spokes of uneven length; crescent moons at the quarters.
  // At least one circle on every page is light, so screen-type blends (which
  // drop dark marks by design) never show an empty page.
  const unit = Math.min(w,h);
  const count = Math.max(1, Math.round((1 + Math.random()*1.6) * amt));
  const pick = arr => arr[Math.floor(Math.random()*arr.length)];
  const glyph = (x, y, size, rot) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.font = `${Math.max(6, size)}px ${GLYPH_FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(pick(GLYPHS), 0, 0); ctx.restore();
  };
  // some circles are drawn by hand: their rings wander slowly off true
  let wobble = 0, wph = 0;
  const ring = (cx, cy, r, lw, style) => {
    ctx.lineWidth = lw;
    if(wobble && style !== 'dotted'){
      if(style === 'dashed') ctx.setLineDash([lw*6, lw*4]);
      ctx.beginPath();
      for(let k=0;k<=72;k++){
        const a = k/72*Math.PI*2, rr = r*(1 + wobble*(Math.sin(a*3+wph)*0.6 + Math.sin(a*7+wph*1.7)*0.4));
        k ? ctx.lineTo(cx+Math.cos(a)*rr, cy+Math.sin(a)*rr) : ctx.moveTo(cx+Math.cos(a)*rr, cy+Math.sin(a)*rr);
      }
      ctx.stroke(); ctx.setLineDash([]);
      return;
    }
    if(style === 'dotted'){
      const n = Math.max(24, Math.round(r / (lw*3)));
      for(let k=0;k<n;k++){ const a=k/n*Math.PI*2;
        ctx.beginPath(); ctx.arc(cx+Math.cos(a)*r, cy+Math.sin(a)*r, lw*0.9, 0, Math.PI*2); ctx.fill(); }
      return;
    }
    if(style === 'dashed') ctx.setLineDash([lw*6, lw*4]);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
  };
  const poly = (cx, cy, r, n, rot, step) => {
    ctx.beginPath();
    for(let k=0, j=0; k<=n; k++, j=(j+step)%n){
      const a = rot + j/n*Math.PI*2, x = cx+Math.cos(a)*r, y = cy+Math.sin(a)*r;
      k ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
    }
    ctx.stroke();
  };
  const crescent = (x, y, r, rot) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.arc(0, 0, r, Math.PI*0.5, Math.PI*1.5);
    ctx.bezierCurveTo(-r*0.35, -r*0.6, -r*0.35, r*0.6, 0, r);
    ctx.fill(); ctx.restore();
  };

  for(let i=0;i<count;i++){
    const cx = w*(0.12 + Math.random()*0.76), cy = h*(0.12 + Math.random()*0.76);
    const R = unit*(0.16 + Math.random()*0.18) * zoom;
    const light = i === 0 || Math.random() < 0.6;
    const tone = light ? 236 : 20;
    ctx.strokeStyle = ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
    ctx.globalAlpha = 0.62 + Math.random()*0.3;
    const lw = Math.max(1.2, R*(0.008 + Math.random()*0.005));
    const rot = Math.random()*Math.PI*2;
    wobble = Math.random() < 0.4 ? 0.006 + Math.random()*0.01 : 0;   // hand-drawn, or true
    wph = Math.random()*6.28;

    // the outer rings
    const outer = pick(['double','double','triple','dotted-double']);
    ring(cx, cy, R, lw*1.6, 'solid');
    if(outer !== 'solid') ring(cx, cy, R*0.94, lw*0.8, outer === 'dotted-double' ? 'dotted' : 'solid');
    if(outer === 'triple') ring(cx, cy, R*0.885, lw*0.6, 'dashed');
    // one or two glyph bands
    const bands = Math.random() < 0.35 ? 2 : 1;
    const bandR = [R*0.83, R*0.60];
    for(let b=0;b<bands;b++){
      const r = bandR[b], n = 10 + Math.floor(Math.random()*16);
      ring(cx, cy, r - R*0.065, lw, pick(['solid','solid','dashed']));
      for(let k=0;k<n;k++){ const a = rot + k/n*Math.PI*2;
        glyph(cx+Math.cos(a)*(r-R*0.005), cy+Math.sin(a)*(r-R*0.005), R*0.075, a+Math.PI/2); }
    }
    const inner = bands === 2 ? R*0.47 : R*0.72;
    // the geometry
    const geo = pick(['star','star','hexagram','octagram','triangle']);
    const n = geo === 'star' ? 5 + Math.floor(Math.random()*5) : geo === 'octagram' ? 4 : 3;
    ctx.lineWidth = lw*1.15;
    if(geo === 'star') poly(cx, cy, inner, n, rot, n === 6 ? 1 : (n === 8 ? 3 : 2));
    if(geo === 'hexagram'){ poly(cx, cy, inner, 3, rot, 1); poly(cx, cy, inner, 3, rot+Math.PI/3, 1); }
    if(geo === 'octagram'){ poly(cx, cy, inner, 4, rot, 1); poly(cx, cy, inner, 4, rot+Math.PI/4, 1); }
    if(geo === 'triangle'){ poly(cx, cy, inner, 3, rot, 1); ring(cx, cy, inner*0.5, lw, 'solid'); }
    const verts = geo === 'hexagram' ? 6 : geo === 'octagram' ? 8 : n;
    // nodes at the vertices, or planets on the rim — each carrying a glyph
    const planets = Math.random() < 0.4;
    const nodeR = planets ? R : inner, nodeSize = R*(planets ? 0.085 : 0.055);
    for(let k=0;k<verts;k++){
      const a = rot + k/verts*Math.PI*2, x = cx+Math.cos(a)*nodeR, y = cy+Math.sin(a)*nodeR;
      ctx.globalAlpha *= 1; ctx.lineWidth = lw;
      ctx.save(); ctx.fillStyle = '#808080'; ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(x, y, nodeSize, 0, Math.PI*2); ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(x, y, nodeSize, 0, Math.PI*2); ctx.stroke();
      glyph(x, y, nodeSize*1.2, 0);
    }
    // spokes of uneven length from the heart outward
    if(Math.random() < 0.7){
      const s = verts*2; ctx.lineWidth = lw*0.7;
      for(let k=0;k<s;k++){ const a = rot + (k+0.5)/s*Math.PI*2, r1 = inner*(0.3 + Math.random()*0.6);
        ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*inner*0.22, cy+Math.sin(a)*inner*0.22);
        ctx.lineTo(cx+Math.cos(a)*r1, cy+Math.sin(a)*r1); ctx.stroke(); }
    }
    // vines: curling tendrils growing along the outer ring, with small leaves
    if(Math.random() < 0.35){
      const vines = 2 + Math.floor(Math.random()*3);
      ctx.lineWidth = lw*0.8;
      for(let v=0; v<vines; v++){
        let a = rot + v/vines*Math.PI*2, r = R*1.06;
        const dir = Math.random()<0.5 ? 1 : -1, span = 0.5 + Math.random()*0.5;
        ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r);
        for(let t=0; t<=1; t+=0.04){
          const aa = a + dir*t*span, rr = r + Math.sin(t*Math.PI*3)*R*0.035;
          ctx.lineTo(cx+Math.cos(aa)*rr, cy+Math.sin(aa)*rr);
        }
        ctx.stroke();
        for(let l=1; l<5; l++){                              // leaves along it
          const t = l/5, aa = a + dir*t*span, rr = r + Math.sin(t*Math.PI*3)*R*0.035;
          const lx = cx+Math.cos(aa)*rr, ly = cy+Math.sin(aa)*rr, la = aa + (l%2 ? 1 : -1)*0.9 + Math.PI/2;
          ctx.save(); ctx.translate(lx, ly); ctx.rotate(la);
          ctx.beginPath(); ctx.ellipse(R*0.028, 0, R*0.028, R*0.011, 0, 0, Math.PI*2); ctx.fill();
          ctx.restore();
        }
        // and a curl at its end
        const ea = a + dir*span, er = r;
        ctx.beginPath();
        for(let k=0;k<=24;k++){ const t=k/24, sr=R*0.035*(1-t), sa=ea + dir*t*Math.PI*2.2;
          const x=cx+Math.cos(ea)*er + Math.cos(sa)*sr, y=cy+Math.sin(ea)*er + Math.sin(sa)*sr;
          k ? ctx.lineTo(x,y) : ctx.moveTo(x,y); }
        ctx.stroke();
      }
    }
    // crescent moons at the quarters
    if(Math.random() < 0.45){
      for(let k=0;k<4;k++){ const a = rot + k*Math.PI/2 + Math.PI/4;
        crescent(cx+Math.cos(a)*R*1.09, cy+Math.sin(a)*R*1.09, R*0.05, a); }
    }
    // the seal at the heart
    ring(cx, cy, inner*0.2, lw*1.1, 'solid');
    const seal = pick(['glyph','glyph','star','dot','spiral']);
    if(seal === 'glyph') glyph(cx, cy, inner*0.24, 0);
    if(seal === 'star'){ ctx.lineWidth = lw; poly(cx, cy, inner*0.17, 5, rot, 2); }
    if(seal === 'dot'){ ctx.beginPath(); ctx.arc(cx, cy, inner*0.06, 0, Math.PI*2); ctx.fill(); }
    if(seal === 'spiral'){                                    // an organic seal
      ctx.lineWidth = lw; ctx.beginPath();
      for(let k=0;k<=60;k++){ const t=k/60, sr=inner*0.17*t, sa=rot + t*Math.PI*5;
        k ? ctx.lineTo(cx+Math.cos(sa)*sr, cy+Math.sin(sa)*sr) : ctx.moveTo(cx, cy); }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  return c;
}

// Craters "knock out" whatever's beneath them (erase via destination-out
// using a soft-edged radial alpha mask, then draw fresh shading into that now-
// clean area) rather than just blending over it — this is what keeps a crater
// reading as a crisp bowl+rim rather than a muddy blend with the noise under it.
export function genInkBleed(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const c = document.createElement('canvas');
  c.width=w; c.height=h;
  const ctx = c.getContext('2d', CPU);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0,0,w,h);

  // The previous attempt drew opaque black lobes across most of the half and,
  // composited through color-burn, turned the whole card black. A real card is
  // mostly EMPTY paper: one compact figure near the fold, then nothing.
  const half = document.createElement('canvas');
  half.width = Math.max(1, Math.ceil(w/2)); half.height = h;
  const hx = half.getContext('2d', CPU);
  const HW = half.width;
  const unit = Math.min(w,h);

  const blots = 2 + Math.floor(Math.random()*2);
  for(let b=0;b<blots;b++){
    const cy = h*(0.26 + (b/Math.max(1,blots-1||1))*0.46 + (Math.random()-0.5)*0.05);
    // the figure stays close to the crease and covers a modest span
    const reach = HW * (0.30 + Math.random()*0.26) * zoom;
    const lobes = 5 + Math.floor(Math.random()*4);

    for(let l=0;l<lobes;l++){
      const t = l/lobes;
      const dist = Math.pow(Math.random(), 1.8) * reach;
      const px = HW - dist;
      const py = cy + (Math.random()-0.5) * unit * 0.10;
      const rr = unit * (0.028 + Math.random()*0.052) * zoom * (1 - t*0.4) * amt;
      hx.globalAlpha = 0.85;
      hx.fillStyle = '#0a0a0a';
      hx.beginPath();
      if(hx.ellipse) hx.ellipse(px, py, rr*(0.75+Math.random()*0.6), rr, Math.random()*Math.PI, 0, Math.PI*2);
      else hx.arc(px, py, rr, 0, Math.PI*2);
      hx.fill();
    }

    // a few fine flecks thrown clear of the main mass
    const flecks = Math.round(14 * amt);
    for(let f=0;f<flecks;f++){
      const dist = Math.pow(Math.random(), 0.7) * reach * 1.9;
      const px = HW - dist;
      const py = cy + (Math.random()-0.5) * unit * 0.20;
      hx.globalAlpha = 0.30 + Math.random()*0.45;
      hx.fillStyle = '#101010';
      hx.beginPath();
      hx.arc(px, py, unit*(0.0010 + Math.random()*0.0035)*zoom, 0, Math.PI*2);
      hx.fill();
    }
  }

  ctx.globalAlpha = 1;
  ctx.drawImage(half, 0, 0);
  ctx.save();
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(half, 0, 0);
  ctx.restore();
  return c;
}

export function genCrackedGlaze(w,h,amt,zoom,light,form){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const enamel = Math.max(0, Math.min(1, form==null ? 0 : form));
  // Glaze: a glassy layer over a body. As it ages it CRAZES — a network of
  // fine cracks, big cells split by finer ones, grime settled in them — then
  // blisters, chips, and at last peels away to the rough, matte body below,
  // lifting at its broken edges. All of it as heights, lit by the dial: the
  // glaze stands above the body, cracks are grooves in it, and where it is
  // gone the drop casts a shadow. Glossy glaze, matte body.
  // FRACTURE SCALE · CRACK DENSITY · ENAMELING (unbroken → bubbled → chipped → peeling)
  const div = canonDiv(2), ww = Math.ceil(w/div), wh = Math.ceil(h/div), unit = Math.min(ww, wh);
  // cells: as many as before (26 at 100%), sized by scale
  const nCells = Math.max(4, Math.round(26*amt/(zoom*zoom)));
  const cs = Math.sqrt(ww*wh/nCells), fineCs = cs*0.42;
  const net = (size) => {
    const gx = Math.ceil(ww/size) + 2, gy = Math.ceil(wh/size) + 2, P = new Float32Array(gx*gy*2), id = new Float32Array(gx*gy);
    for(let k = 0; k < gx*gy; k++){ P[k*2] = 0.1 + Math.random()*0.8; P[k*2+1] = 0.1 + Math.random()*0.8; id[k] = Math.random(); }
    // returns [edge distance (in px), the nearest cell's id, its centre x, y]
    return (x, y) => { const fx = x/size + 1, fy = y/size + 1, ci = Math.floor(fx), cj = Math.floor(fy);
      let d1 = 9, d2 = 9, k1 = 0;
      for(let dj = -1; dj <= 1; dj++) for(let di = -1; di <= 1; di++){ const i2 = ci + di, j2 = cj + dj; if(i2 < 0 || j2 < 0 || i2 >= gx || j2 >= gy) continue;
        const k = j2*gx + i2, px = i2 + P[k*2], py = j2 + P[k*2+1], dd = Math.hypot(fx - px, fy - py);
        if(dd < d1){ d2 = d1; d1 = dd; k1 = k; } else if(dd < d2) d2 = dd; }
      return [(d2 - d1)*0.5*size, id[k1], ((k1 % gx) + P[k1*2] - 1)*size, (Math.floor(k1/gx) + P[k1*2+1] - 1)*size]; };
  };
  const primary = net(cs), secondary = net(fineCs);
  const warp = makeNoiseGrid(9, 9), warpY = makeNoiseGrid(9, 9), peelField = makeNoiseGrid(6, 6), grit = makeNoiseGrid(64, 64);
  const t = unit*0.006*Math.sqrt(zoom);                          // the glaze's thickness
  const H = new Float32Array(ww*wh), GL = new Float32Array(ww*wh), DIRT = new Float32Array(ww*wh);
  // peeling: whole cells go, in clusters (a cell's chance follows a slow field
  // at its centre); chips: small bites at the cracks
  const peelAt = enamel < 0.6 ? 1.1 : 1.05 - (enamel - 0.6)*1.05;
  const chipAt = enamel < 0.4 ? 1.1 : 1.0 - (enamel - 0.4)*0.9;
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
    const u = x/ww, v = y/wh;
    const px = x + (sampleNoiseGrid(warp, 9, 9, u*8, v*8) - 0.5)*cs*0.35, py = y + (sampleNoiseGrid(warpY, 9, 9, u*8, v*8) - 0.5)*cs*0.35;
    const [e1, id1, cx, cy] = primary(px, py), [e2, id2] = secondary(px, py);
    const k = y*ww + x, rough = (sampleNoiseGrid(grit, 64, 64, u*63, v*63) - 0.5)*t*0.25;
    // is this cell's glaze gone?
    const field = sampleNoiseGrid(peelField, 6, 6, Math.max(0, Math.min(1, cx/ww))*5, Math.max(0, Math.min(1, cy/wh))*5);
    const peeled = field*0.7 + id1*0.45 > peelAt;
    // a chip: glaze bitten away near a crack
    const chipped = !peeled && e1 < cs*0.14*(0.4 + id2) && ((id1*7.3 + id2*3.1) % 1) > chipAt;
    if(peeled || chipped){
      H[k] = rough; GL[k] = 0;                                    // the body: lower, rough, matte
    } else {
      // crazing: grooves at both scales; the glaze lifts a little at a broken edge
      const g1 = Math.max(0, 1 - e1/(unit*0.0035)), g2 = Math.max(0, 1 - e2/(unit*0.002))*0.6;
      H[k] = t - t*0.8*Math.max(g1, g2) + rough*0.2;
      GL[k] = 1 - Math.max(g1, g2)*0.7;
      DIRT[k] = Math.max(g1, g2*0.8);
    }
  }
  // the lift where glaze meets bare body: a thin lip, raised, along the edge
  if(enamel > 0.4) for(let y = 1; y < wh - 1; y++) for(let x = 1; x < ww - 1; x++){
    const k = y*ww + x; if(GL[k] <= 0) continue;
    if(GL[k-1] <= 0 || GL[k+1] <= 0 || GL[k-ww] <= 0 || GL[k+ww] <= 0) H[k] += t*0.35*(enamel - 0.4)/0.6;
  }
  // bubbles: blisters in the glaze, some burst into pinholes
  const nBub = Math.round(Math.sin(Math.min(1, enamel*1.4)*Math.PI)*ww*wh/(unit*unit)*240);
  for(let q = 0; q < nBub; q++){
    const bx = Math.random()*ww, by = Math.random()*wh, r = unit*(0.003 + Math.pow(Math.random(), 1.6)*0.012), burst = Math.random() < 0.3;
    const x0 = Math.max(0, Math.floor(bx - r)), x1 = Math.min(ww - 1, Math.ceil(bx + r)), y0 = Math.max(0, Math.floor(by - r)), y1 = Math.min(wh - 1, Math.ceil(by + r));
    for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++){ const k = y*ww + x; if(GL[k] <= 0) continue;
      const q2 = 1 - ((x - bx)**2 + (y - by)**2)/(r*r); if(q2 <= 0) continue;
      if(burst){ H[k] -= t*0.7*Math.pow(q2, 2); DIRT[k] = Math.max(DIRT[k], q2*0.7); } else H[k] += t*0.9*Math.sqrt(q2); }
  }
  const L = lightHeights(H, ww, wh, { light, relief: 1, gloss: 0.85, shadow: 0.6, ao: 0.35, ambient: 0.45 });
  const fl = L.flat || 1;
  const small = document.createElement('canvas'); small.width = ww; small.height = wh;
  const sctx = small.getContext('2d', CPU), img = sctx.createImageData(ww, wh), dd = img.data;
  for(let k = 0; k < ww*wh; k++){
    // glaze: lit, with its shine; body: matte and a little darker; grime in the cracks
    const lit = (L.light[k]/fl - 1)*110, shine = L.spec[k]*GL[k]*150;
    const v = 128 + lit + shine - (GL[k] <= 0 ? 22 : 0) - DIRT[k]*55;
    const q = k*4; dd[q] = dd[q+1] = dd[q+2] = Math.max(0, Math.min(255, v)); dd[q+3] = 255;
  }
  sctx.putImageData(img, 0, 0);
  const full = document.createElement('canvas'); full.width = w; full.height = h;
  const fctx = full.getContext('2d', CPU); fctx.imageSmoothingEnabled = true; fctx.drawImage(small, 0, 0, w, h);
  return full;
}

export function genTessellate(w,h,amt,zoom,light,tint1,tint2,M3){
  amt = (amt==null?0:amt); zoom = (zoom==null?1:zoom);
  // A CARVED surface: triangles sharing their corners (no gaps), each a tilted
  // plane at its own depth — some sunk deeper than their neighbours. Lit by
  // lightHeights: overhead (this texture's default) the facets show by their
  // tilts alone; lower the light and the deeper ones fall into the shadows
  // their rims cast. LIGHT HUE is the light's colour, DARK HUE the material's.
  const lightCol = parseHex(tint1 || '#FFFFFF'), mat = parseHex(tint2 && !/^#?0{6}$/.test(tint2.replace('#','')) ? tint2 : '#808080');
  const div = canonDiv(2), ww = Math.ceil(w/div), wh = Math.ceil(h/div);
  const cell = (Math.max(ww,wh)/14) * zoom;
  const cols = Math.ceil(ww/cell) + 2, rows = Math.ceil(wh/cell) + 2;
  // the shared lattice, nudged off true by Irregularity
  const J = cell*0.30*amt, V = [];
  for(let ry = 0; ry <= rows; ry++){ const row = []; for(let rx = 0; rx <= cols; rx++){
    const edge = rx === 0 || ry === 0 || rx === cols || ry === rows;
    row.push([(rx - 1)*cell + (edge ? 0 : (Math.random() - 0.5)*J), (ry - 1)*cell + (edge ? 0 : (Math.random() - 0.5)*J)]); } V.push(row); }
  const H = new Float32Array(ww*wh);
  // one facet: a plane through its centre, with a depth and a tilt
  const facet = (A, Bv, C) => {
    const depth = -Math.pow(Math.random(), 1.6)*cell*0.32;               // most shallow, a few sunk deep
    const tx = (Math.random() - 0.5)*0.55, ty = (Math.random() - 0.5)*0.55;
    const cx = (A[0] + Bv[0] + C[0])/3, cy = (A[1] + Bv[1] + C[1])/3;
    const x0 = Math.max(0, Math.floor(Math.min(A[0], Bv[0], C[0]))), x1 = Math.min(ww - 1, Math.ceil(Math.max(A[0], Bv[0], C[0])));
    const y0 = Math.max(0, Math.floor(Math.min(A[1], Bv[1], C[1]))), y1 = Math.min(wh - 1, Math.ceil(Math.max(A[1], Bv[1], C[1])));
    const area = (Bv[0] - A[0])*(C[1] - A[1]) - (C[0] - A[0])*(Bv[1] - A[1]);
    if(Math.abs(area) < 1e-6) return;
    for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++){
      const px = x + 0.5, py = y + 0.5;
      const w0 = ((Bv[0] - px)*(C[1] - py) - (C[0] - px)*(Bv[1] - py))/area;
      const w1 = ((C[0] - px)*(A[1] - py) - (A[0] - px)*(C[1] - py))/area;
      const w2 = 1 - w0 - w1;
      if(w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue;
      H[y*ww + x] = depth + tx*(px - cx) + ty*(py - cy);
    }
  };
  for(let ry = 0; ry < rows; ry++) for(let rx = 0; rx < cols; rx++){
    const a = V[ry][rx], b = V[ry][rx + 1], c = V[ry + 1][rx], dd = V[ry + 1][rx + 1];
    if((rx + ry) % 2 === 0){ facet(a, b, c); facet(b, dd, c); } else { facet(a, b, dd); facet(a, dd, c); }
  }
  const L = lightHeights(H, ww, wh, { light, relief: 1, gloss: 0.25, shadow: 0.7, ao: 0.2, ambient: 0.4 });
  // neutral where a facet faces the light straight on from overhead: the material as it is
  const flat = lightHeights(new Float32Array(1), 1, 1, { light, relief: 1, gloss: 0.25, shadow: 0, ao: 0, ambient: 0.4 }).light[0] || 1;
  const small = document.createElement('canvas'); small.width = ww; small.height = wh;
  const sctx = small.getContext('2d', CPU), img = sctx.createImageData(ww, wh), dta = img.data;
  for(let i = 0; i < ww*wh; i++){
    const K = c => litK(L, i, 0.4, M3, c)/flat, sp = L.spec[i]*0.6, q = i*4;
    dta[q]   = Math.max(0, Math.min(255, mat.r*K(0)*(lightCol.r/255) + lightCol.r*sp*litS(M3, 0)));
    dta[q+1] = Math.max(0, Math.min(255, mat.g*K(1)*(lightCol.g/255) + lightCol.g*sp*litS(M3, 1)));
    dta[q+2] = Math.max(0, Math.min(255, mat.b*K(2)*(lightCol.b/255) + lightCol.b*sp*litS(M3, 2)));
    dta[q+3] = 255;
  }
  sctx.putImageData(img, 0, 0);
  const full = document.createElement('canvas'); full.width = w; full.height = h;
  const fctx = full.getContext('2d', CPU); fctx.imageSmoothingEnabled = true; fctx.drawImage(small, 0, 0, w, h);
  return full;
}

// The deck was dealt once,
// then swept up in a hurry.
// Corners still showing.
export function genCartomanticDrift(w,h,amt,zoom,angle){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const scatter=((angle==null?35:angle)*Math.PI)/180;
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU);
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);

  // A reading dealt onto the page and half swept away: real cards — rounded
  // corners, corner indices, pips in their places, a few tarot trumps and a few
  // face-down backs — each torn along a ragged line so only part survives,
  // lying at wrong angles and faded where they were rubbed.
  const unit=Math.min(w,h);
  const n=Math.max(3, Math.round(23*amt*(0.8+Math.random()*0.4)));
  const INK=24, PAPER=232;
  const suitPath=(x,y,s,suit)=>{
    ctx.beginPath();
    if(suit==='diamond'){ ctx.moveTo(x,y-s); ctx.lineTo(x+s*0.72,y); ctx.lineTo(x,y+s); ctx.lineTo(x-s*0.72,y); ctx.closePath(); }
    else if(suit==='heart'){
      ctx.moveTo(x,y+s*0.9);
      ctx.bezierCurveTo(x-s*1.4,y-s*0.1,x-s*0.6,y-s*1.1,x,y-s*0.35);
      ctx.bezierCurveTo(x+s*0.6,y-s*1.1,x+s*1.4,y-s*0.1,x,y+s*0.9); ctx.closePath();
    } else if(suit==='spade'){
      ctx.moveTo(x,y-s*0.95);
      ctx.bezierCurveTo(x+s*1.4,y+s*0.05,x+s*0.6,y+s*0.95,x,y+s*0.35);
      ctx.bezierCurveTo(x-s*0.6,y+s*0.95,x-s*1.4,y+s*0.05,x,y-s*0.95); ctx.closePath();
      ctx.moveTo(x,y+s*0.3); ctx.lineTo(x+s*0.32,y+s*1.0); ctx.lineTo(x-s*0.32,y+s*1.0); ctx.closePath();
    } else {                                           // club
      for(const [dx,dy] of [[0,-0.45],[-0.48,0.12],[0.48,0.12]]){ ctx.moveTo(x+dx*s+s*0.42,y+dy*s); ctx.arc(x+dx*s,y+dy*s,s*0.42,0,Math.PI*2); }
      ctx.moveTo(x,y+s*0.1); ctx.lineTo(x+s*0.3,y+s*1.0); ctx.lineTo(x-s*0.3,y+s*1.0); ctx.closePath();
    }
    ctx.fill();
  };
  const roundCard=(W,H,r)=>{
    ctx.beginPath(); ctx.moveTo(-W/2+r,-H/2); ctx.lineTo(W/2-r,-H/2); ctx.arc(W/2-r,-H/2+r,r,-Math.PI/2,0);
    ctx.lineTo(W/2,H/2-r); ctx.arc(W/2-r,H/2-r,r,0,Math.PI/2); ctx.lineTo(-W/2+r,H/2);
    ctx.arc(-W/2+r,H/2-r,r,Math.PI/2,Math.PI); ctx.lineTo(-W/2,-H/2+r); ctx.arc(-W/2+r,-H/2+r,r,Math.PI,Math.PI*1.5); ctx.closePath();
  };
  const SUITS=['heart','diamond','spade','club'], RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const TRUMPS=['XVII','XVIII','XIX','XIII','XV','X','XXI','0'];
  // pip layouts in card units (-1..1), by count
  const PIPS={1:[[0,0]],2:[[0,-0.6],[0,0.6]],3:[[0,-0.6],[0,0],[0,0.6]],4:[[-0.4,-0.6],[0.4,-0.6],[-0.4,0.6],[0.4,0.6]],
    5:[[-0.4,-0.6],[0.4,-0.6],[0,0],[-0.4,0.6],[0.4,0.6]],6:[[-0.4,-0.6],[0.4,-0.6],[-0.4,0],[0.4,0],[-0.4,0.6],[0.4,0.6]],
    7:[[-0.4,-0.6],[0.4,-0.6],[0,-0.3],[-0.4,0],[0.4,0],[-0.4,0.6],[0.4,0.6]],
    8:[[-0.4,-0.6],[0.4,-0.6],[0,-0.3],[-0.4,0],[0.4,0],[0,0.3],[-0.4,0.6],[0.4,0.6]]};

  for(let i=0;i<n;i++){
    const W=unit*(0.10+Math.random()*0.07), H=W*1.4, r=W*0.07;
    const cx=Math.random()*w, cy=Math.random()*h;
    const rot=(Math.random()-0.5)*2*scatter + (Math.random()<0.5?0:Math.PI/2)*(scatter>0.6?1:0);
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(rot);
    // torn: keep only the side of a ragged line through the card
    const ta=Math.random()*Math.PI*2, off=(Math.random()-0.2)*W*0.5;
    const tx=Math.cos(ta), ty=Math.sin(ta);
    ctx.beginPath();
    const far=W*3; const px=-ty, py=tx;
    let first=true;
    for(let k=-12;k<=12;k++){
      const along=(k/12)*far, jag=(Math.random()-0.5)*W*0.09;
      const x=tx*(off+jag)+px*along, y=ty*(off+jag)+py*along;
      first?ctx.moveTo(x,y):ctx.lineTo(x,y); first=false;
    }
    ctx.lineTo(px*far - tx*far, py*far - ty*far); ctx.lineTo(-px*far - tx*far, -py*far - ty*far); ctx.closePath();
    ctx.clip();
    const fade=0.35+Math.random()*0.5;               // rubbed away, some more than others
    roundCard(W,H,r); ctx.globalAlpha=fade*0.55; ctx.fillStyle=`rgb(${PAPER},${PAPER},${PAPER})`; ctx.fill();
    ctx.globalAlpha=fade; ctx.strokeStyle=`rgb(${INK},${INK},${INK})`; ctx.lineWidth=Math.max(cpx(0.8),W*0.012); ctx.stroke();
    ctx.fillStyle=`rgb(${INK},${INK},${INK})`;
    const kind=Math.random();
    if(kind<0.18){                                   // face down: a lattice back
      ctx.save(); roundCard(W*0.84,H*0.88,r*0.7); ctx.clip();
      ctx.lineWidth=Math.max(cpx(0.5),W*0.008); ctx.beginPath();
      for(let k=-10;k<=10;k++){ const o=k*W*0.1; ctx.moveTo(o-H,-H); ctx.lineTo(o+H,H); ctx.moveTo(o+H,-H); ctx.lineTo(o-H,H); }
      ctx.stroke(); ctx.restore(); roundCard(W*0.84,H*0.88,r*0.7); ctx.stroke();
    } else if(kind<0.36){                            // a tarot trump
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font=`${W*0.16}px Georgia, "Times New Roman", serif`;
      ctx.fillText(TRUMPS[Math.floor(Math.random()*TRUMPS.length)],0,-H*0.36);
      const em=Math.floor(Math.random()*3);
      ctx.lineWidth=Math.max(cpx(0.8),W*0.014); ctx.beginPath();
      if(em===0){ ctx.arc(0,0,W*0.16,0,Math.PI*2); for(let k=0;k<12;k++){ const a=k/12*Math.PI*2; ctx.moveTo(Math.cos(a)*W*0.2,Math.sin(a)*W*0.2); ctx.lineTo(Math.cos(a)*W*0.3,Math.sin(a)*W*0.3); } ctx.stroke(); }
      else if(em===1){ ctx.arc(0,0,W*0.2,0,Math.PI*2); ctx.fill(); ctx.globalCompositeOperation='destination-out'; ctx.beginPath(); ctx.arc(W*0.09,-W*0.04,W*0.18,0,Math.PI*2); ctx.fill(); ctx.globalCompositeOperation='source-over'; }
      else { for(let k=0;k<5;k++){ const a=-Math.PI/2+k*4*Math.PI/5; k?ctx.lineTo(Math.cos(a)*W*0.24,Math.sin(a)*W*0.24):ctx.moveTo(Math.cos(a)*W*0.24,Math.sin(a)*W*0.24); } ctx.closePath(); ctx.stroke(); }
      ctx.strokeRect(-W*0.4,H*0.3,W*0.8,H*0.1);
    } else {                                         // a playing card
      const suit=SUITS[Math.floor(Math.random()*4)], ri=Math.floor(Math.random()*RANKS.length), rank=RANKS[ri];
      ctx.textAlign='center'; ctx.textBaseline='middle';
      for(const flip of [1,-1]){                     // the index, top-left and bottom-right
        ctx.save(); ctx.rotate(flip<0?Math.PI:0);
        ctx.font=`bold ${W*0.15}px Georgia, "Times New Roman", serif`;
        ctx.fillText(rank,-W*0.36,-H*0.4);
        suitPath(-W*0.36,-H*0.29,W*0.05,suit); ctx.restore();
      }
      const count=ri===0?1:(ri<9?ri+1:0);
      if(count && PIPS[Math.min(count,8)]){
        for(const [u,v] of PIPS[Math.min(count,8)]) suitPath(u*W*0.3,v*H*0.34,W*(count===1?0.16:0.075),suit);
      } else if(!count){                             // a court card: a framed figure, simply
        ctx.lineWidth=Math.max(cpx(0.8),W*0.012); ctx.strokeRect(-W*0.3,-H*0.32,W*0.6,H*0.64);
        suitPath(0,0,W*0.12,suit);
      }
    }
    ctx.restore();
  }
  ctx.globalAlpha=1;
  return c;
}

// Light that came too close
// goes the long way round the dark —
// you see its back, bent up.
export function genBlackHole(w,h,amt,zoom){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU);
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);

  // A black hole, drawn as a gravity simulation rather than a picture of one.
  //   the disc      debris on Keplerian orbits (faster close in), tilted nearly
  //                 edge-on; the side coming toward us is brighter (relativistic
  //                 beaming, roughly (1 + v·cosφ)³)
  //   lensing       the far side of the disc is bent up and over the shadow into
  //                 an arch; background particles near the hole are pushed out
  //                 into arcs, with faint second images inside
  //   photon ring   a thin bright ring hugging the shadow
  //   depth         every particle has a distance: nearer is larger and brighter
  // CHAOS (the size knob) is how violent it is: the reach of the lensing, the
  // disc's brightness and turbulence, the glow of radiation. The second knob is
  // how many particles fill the field.
  const unit=Math.min(w,h);
  const chaos=zoom;
  const cx=w*(0.2+Math.random()*0.6), cy=h*(0.2+Math.random()*0.6);
  const Rsh=unit*(0.055+Math.random()*0.03);            // the shadow
  const tilt=(8+Math.random()*10)*Math.PI/180;           // near edge-on
  const spin=(Math.random()-0.5)*0.8;                    // disc near level, a little turned
  const dirSign=Math.random()<0.5?1:-1;                  // which side approaches
  const thetaE=Rsh*1.5*Math.sqrt(chaos);                 // Einstein radius
  const cosR=Math.cos(spin), sinR=Math.sin(spin);
  const toScreen=(x,y)=>[cx + x*cosR - y*sinR, cy + x*sinR + y*cosR];
  const dot=(x,y,r,tone,a)=>{ ctx.globalAlpha=a; ctx.fillStyle=`rgb(${tone},${tone},${tone})`;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); };

  // radiation: a broad soft glow, stronger with chaos
  const glow=ctx.createRadialGradient(cx,cy,Rsh,cx,cy,Rsh*(6+chaos*4));
  glow.addColorStop(0,`rgba(245,245,245,${Math.min(0.5,0.16*chaos)})`); glow.addColorStop(1,'rgba(245,245,245,0)');
  ctx.globalAlpha=1; ctx.fillStyle=glow; ctx.fillRect(0,0,w,h);

  // the field: particles in depth, lensed where they pass near the hole
  const nField=Math.round(canonArea(w,h)/5200*amt);
  for(let i=0;i<nField;i++){
    const z=Math.random();                               // 0 near .. 1 far
    let x=Math.random()*w, y=Math.random()*h;
    const dx=x-cx, dy=y-cy, b=Math.hypot(dx,dy)||1;
    const size=unit*0.0009*(0.4+1.6*(1-z)), tone=170+Math.round(80*(1-z)), a=0.35+0.55*(1-z);
    // primary image, pushed outward: b' = (b + sqrt(b² + 4θE²)) / 2
    const b1=(b+Math.sqrt(b*b+4*thetaE*thetaE))/2;
    const stretch=Math.min(4, b1/b);
    // one rotated ellipse, not save/translate/rotate/restore: fewer calls
    ctx.globalAlpha=a; ctx.fillStyle=`rgb(${tone},${tone},${tone})`;
    ctx.beginPath();
    ctx.ellipse(cx+dx/b*b1, cy+dy/b*b1, size*Math.min(3,stretch), size, Math.atan2(dy,dx)+Math.PI/2, 0, Math.PI*2);
    ctx.fill();
    // the faint second image, on the far side, inside the arch
    if(b<thetaE*3.5){
      const b2=(b-Math.sqrt(b*b+4*thetaE*thetaE))/2;      // negative: opposite side
      if(Math.abs(b2)>Rsh*1.02) dot(cx+dx/b*b2, cy+dy/b*b2, size*0.7, tone, a*0.35);
    }
  }

  // the disc, drawn as orbits of glowing gas: many thin ellipses. Each orbit
  // is split into segments so the approaching side can be brighter along it.
  const orbits=Math.round(60*Math.min(2,0.5+amt*0.6));
  const orbitsR=[];
  // more chaos, more energy: the bright disc reaches further out
  for(let k=0;k<orbits;k++) orbitsR.push(Rsh*(2.6+Math.pow(Math.random(),1.5)*7*(0.7+0.3*chaos)));
  orbitsR.sort((a,b)=>b-a);
  const flat=Math.sin(tilt);
  const orbitArc=(r, from, to, lensed, lower)=>{
    const heat=Math.pow(Rsh*2.6/r,0.9);
    const v=Math.min(0.35,Math.sqrt(Rsh*2.6/r)*0.35);
    const turb=0.55+Math.random()*0.9*Math.min(1.6,chaos);  // gaps and bright bands
    const seg=20;
    ctx.lineWidth=Math.max(cpx(0.6),Rsh*(0.03+0.05*heat));
    for(let k=0;k<seg;k++){
      const p0=from+(to-from)*k/seg, p1=from+(to-from)*(k+1)/seg;
      const beam=Math.pow(1+dirSign*v*Math.cos((p0+p1)/2),2);
      const tone=Math.min(255,150+105*heat*Math.min(1.5,beam));
      ctx.globalAlpha=Math.min(0.9,(0.05+0.3*heat)*beam*turb*(0.6+0.25*chaos)*(lensed?(lower?0.35:0.8):1));
      ctx.strokeStyle=`rgb(${tone|0},${tone|0},${tone|0})`;
      ctx.beginPath();
      for(let q=0;q<=4;q++){
        const ph=p0+(p1-p0)*q/4;
        let x,y;
        if(!lensed){ [x,y]=toScreen(Math.cos(ph)*r, Math.sin(ph)*r*flat); }
        else {
          // the far disc, bent around the shadow: over the top, and fainter
          // underneath — its radius grows slowly with the orbit's
          const ra=Rsh*1.1+(r-Rsh*2.6)*0.18;
          [x,y]=toScreen(Math.cos(ph)*ra*1.03, (lower?1:-1)*Math.abs(Math.sin(ph))*ra);
        }
        q?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      ctx.stroke();
    }
  };
  // behind: the lensed arch over the top, and the fainter one beneath
  for(const r of orbitsR) orbitArc(r, 0, Math.PI, true, false);
  for(const r of orbitsR) orbitArc(r, 0, Math.PI, true, true);
  // the shadow, then the photon ring hugging it
  ctx.globalAlpha=1; ctx.fillStyle='rgb(4,4,4)';
  ctx.beginPath(); ctx.arc(cx,cy,Rsh,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgb(252,252,252)'; ctx.lineWidth=Math.max(cpx(1),Rsh*0.04);
  ctx.globalAlpha=0.9; ctx.beginPath(); ctx.arc(cx,cy,Rsh*1.04,0,Math.PI*2); ctx.stroke();
  // in front: the near half of every orbit, crossing over the shadow
  for(const r of orbitsR) orbitArc(r, 0, Math.PI, false, false);
  ctx.globalAlpha=1;
  return c;
}
