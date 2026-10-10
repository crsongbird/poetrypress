/**
 * texChaos.js — ∆ Chaos. Pattern: geometry going wrong.
 *
 * Pain, dysphoria. Sigils, enochian noise, summoning circles, the
 * Rorschach, fractured glaze, facet field, cartomancy.
 */
import { GLYPHS, GLYPH_FONT } from './spell.js';
import { makeNoiseGrid, sampleNoiseGrid, CPU, canonArea, canonDiv, cpx, lightVec, lightHeights, lightSparse, parseHex, litK, litS, greyLit } from './texCore.js';

// A sigil is drawn, then gone —
// the mark remembers nothing.
// Ink on nothing. Ink.
export function genSigils(w,h,amt,zoom,light,form,M3){
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
    if(!M3){ d[q]=Math.max(0,Math.min(255,d[q]*k+s)); d[q+1]=Math.max(0,Math.min(255,d[q+1]*k+s)); d[q+2]=Math.max(0,Math.min(255,d[q+2]*k+s)); }
    else for(let c=0;c<3;c++){                                    // a shadowed wall takes the Shade hue, a glint the Highlight
      const kc = k<1 ? 1 - (1-k)*Math.max(0, 1 + (1 - M3.sh[c])*0.7) : k;
      d[q+c]=Math.max(0,Math.min(255,d[q+c]*kc + s*M3.hi[c])); }
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
export function genSummoningCircles(w,h,amt,zoom,light,form){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const tech = Math.max(0, Math.min(1, form==null ? 0.3 : form)), org = 1 - tech;
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const ctx = c.getContext('2d', CPU);
  ctx.fillStyle = '#808080'; ctx.fillRect(0,0,w,h);

  // ONE transmutation circle, built from the rim inward as a stack of bands.
  // COMPLEXITY is how many: a bare ring and star at the low end, a crowded
  // seal of glyph bands, polygrams within polygrams and planets at the high.
  // THE DIAL places it: at the dial's centre it sits in the middle of the
  // page; dragged out, it moves that way. ORGANIC ↔ TECHNOLOGICAL is its
  // making: drawn by hand with vines, leaves and moons at one end; machined
  // at the other, with gauge ticks, segmented arcs, circuit traces and hex
  // digits — and a NOISY BLOOM rising toward the digital end, as on a screen.
  const unit = Math.min(w,h);
  const pick = arr => arr[Math.floor(Math.random()*arr.length)];
  const weighted = list => { const t = list.reduce((s, [, wt]) => s + wt, 0); let r = Math.random()*t; for(const [v, wt] of list){ r -= wt; if(r <= 0) return v; } return list[0][0]; };
  const la = ((light==null?315:light)-90)*Math.PI/180, tilt = Math.min(1, Math.hypot(lightVec(light).lx, lightVec(light).ly));
  const cx = w/2 + Math.cos(la)*tilt*unit*0.3, cy = h/2 + Math.sin(la)*tilt*unit*0.3;
  const R = unit*0.34*zoom;
  const rot = Math.random()*Math.PI*2;
  const lw = Math.max(cpx(1.2), R*(0.007 + 0.004*org));
  const wobble = org*0.012, wph = Math.random()*6.28;
  ctx.strokeStyle = ctx.fillStyle = 'rgb(236,236,236)';
  ctx.globalAlpha = 0.78;
  ctx.lineCap = tech > 0.5 ? 'butt' : 'round';
  const HEX = '0123456789ABCDEF';
  const glyph = (x, y, size, r) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(r);
    // the machine writes hex where the alchemist writes signs
    const digital = Math.random() < tech*0.85;
    ctx.font = digital ? `${Math.max(6, size*0.85)}px monospace` : `${Math.max(6, size)}px ${GLYPH_FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(digital ? HEX[Math.floor(Math.random()*16)] + (Math.random()<0.5 ? HEX[Math.floor(Math.random()*16)] : '') : pick(GLYPHS), 0, 0); ctx.restore();
  };
  const ring = (r, lwx, style) => {
    ctx.lineWidth = lwx;
    if(style === 'dotted'){
      const n = Math.max(24, Math.round(r / (lwx*3)));
      for(let k=0;k<n;k++){ const a=k/n*Math.PI*2; ctx.beginPath(); ctx.arc(cx+Math.cos(a)*r, cy+Math.sin(a)*r, lwx*0.9, 0, Math.PI*2); ctx.fill(); }
      return;
    }
    if(style === 'dashed') ctx.setLineDash([lwx*6, lwx*4]);
    ctx.beginPath();
    for(let k=0;k<=96;k++){
      const a = k/96*Math.PI*2, rr = r*(1 + wobble*(Math.sin(a*3+wph)*0.6 + Math.sin(a*7+wph*1.7)*0.4));
      k ? ctx.lineTo(cx+Math.cos(a)*rr, cy+Math.sin(a)*rr) : ctx.moveTo(cx+Math.cos(a)*rr, cy+Math.sin(a)*rr);
    }
    ctx.stroke(); ctx.setLineDash([]);
  };
  const poly = (r, n, ro, step) => {
    ctx.beginPath();
    for(let k=0, j=0; k<=n; k++, j=(j+step)%n){ const a = ro + j/n*Math.PI*2; k ? ctx.lineTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r) : ctx.moveTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r); }
    ctx.stroke();
  };
  const crescent = (x, y, r, ro) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ro);
    ctx.beginPath(); ctx.arc(0, 0, r, Math.PI*0.5, Math.PI*1.5); ctx.bezierCurveTo(-r*0.35, -r*0.6, -r*0.35, r*0.6, 0, r); ctx.fill(); ctx.restore();
  };
  // BANDS, from the rim inward: how many, by complexity; what each is, by
  // the circle's making
  const nb = Math.max(1, Math.min(9, Math.round(1 + amt*2.6)));
  const kinds = [['rings', 3], ['glyphs', 3], ['dots', 1], ['planets', 1.2],
                 ['vines', 2.2*org], ['moons', 1.2*org], ['ticks', 3*tech], ['segments', 2.6*tech], ['circuit', 2*tech]];
  let r = R;
  ring(r, lw*1.7, 'solid');
  for(let b=0; b<nb && r > R*0.3; b++){
    const kind = b === 0 && tech > 0.5 ? 'ticks' : weighted(kinds), bw = R*(0.085 + Math.random()*0.04);
    if(kind === 'rings'){
      ring(r - bw*0.3, lw*0.8, pick(['solid','solid','dashed', tech > 0.5 ? 'solid' : 'dotted']));
      if(Math.random() < 0.5) ring(r - bw*0.7, lw*0.6, 'solid');
    } else if(kind === 'glyphs'){
      const rr = r - bw*0.5, n = Math.round(rr/(R*0.075)*2.2);
      for(let k=0;k<n;k++){ const a = rot + k/n*Math.PI*2; glyph(cx+Math.cos(a)*rr, cy+Math.sin(a)*rr, bw*0.62, a+Math.PI/2); }
      ring(r - bw, lw*0.8, 'solid');
    } else if(kind === 'dots'){
      ring(r - bw*0.45, lw*0.7, 'dotted'); ring(r - bw, lw*0.6, 'solid');
    } else if(kind === 'planets'){
      const n = pick([4, 5, 6, 7, 8]), rr = r - bw*0.5, ns = bw*0.45;
      ring(rr, lw*0.7, 'solid');
      for(let k=0;k<n;k++){ const a = rot + k/n*Math.PI*2, x = cx+Math.cos(a)*rr, y = cy+Math.sin(a)*rr;
        ctx.save(); ctx.fillStyle = '#808080'; ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x, y, ns, 0, Math.PI*2); ctx.fill(); ctx.restore();
        ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(x, y, ns, 0, Math.PI*2); ctx.stroke(); glyph(x, y, ns*1.3, 0); }
      ring(r - bw, lw*0.6, 'solid');
    } else if(kind === 'vines'){
      const rr = r - bw*0.5, vines = 2 + Math.floor(Math.random()*3); ctx.lineWidth = lw*0.8;
      for(let v=0; v<vines; v++){
        const a0 = rot + v/vines*Math.PI*2, dir = Math.random()<0.5 ? 1 : -1, span = (Math.PI*2/vines)*0.85;
        ctx.beginPath();
        for(let t=0; t<=1; t+=0.02){ const aa = a0 + dir*t*span, r2 = rr + Math.sin(t*Math.PI*4)*bw*0.25; t ? ctx.lineTo(cx+Math.cos(aa)*r2, cy+Math.sin(aa)*r2) : ctx.moveTo(cx+Math.cos(aa)*r2, cy+Math.sin(aa)*r2); }
        ctx.stroke();
        for(let l=1; l<8; l++){ const t = l/8, aa = a0 + dir*t*span, r2 = rr + Math.sin(t*Math.PI*4)*bw*0.25;
          ctx.save(); ctx.translate(cx+Math.cos(aa)*r2, cy+Math.sin(aa)*r2); ctx.rotate(aa + (l%2 ? 1 : -1)*0.9 + Math.PI/2);
          ctx.beginPath(); ctx.ellipse(bw*0.22, 0, bw*0.22, bw*0.08, 0, 0, Math.PI*2); ctx.fill(); ctx.restore(); }
        // a curl at its end
        const ea = a0 + dir*span; ctx.beginPath();
        for(let k=0;k<=24;k++){ const t=k/24, sr=bw*0.3*(1-t), sa=ea + dir*t*Math.PI*2.2; const x=cx+Math.cos(ea)*rr + Math.cos(sa)*sr, y=cy+Math.sin(ea)*rr + Math.sin(sa)*sr; k ? ctx.lineTo(x,y) : ctx.moveTo(x,y); }
        ctx.stroke();
      }
    } else if(kind === 'moons'){
      const rr = r - bw*0.5, n = pick([4, 4, 8]);
      for(let k=0;k<n;k++){ const a = rot + k/n*Math.PI*2 + Math.PI/n; crescent(cx+Math.cos(a)*rr, cy+Math.sin(a)*rr, bw*0.35, a); }
      ring(r - bw, lw*0.6, 'solid');
    } else if(kind === 'ticks'){
      // a gauge: minor ticks, every fifth long, every tenth numbered
      const n = pick([60, 72, 120]), rr = r - bw*0.1; ctx.lineWidth = lw*0.6;
      for(let k=0;k<n;k++){ const a = rot + k/n*Math.PI*2, L = k%10===0 ? bw*0.7 : k%5===0 ? bw*0.45 : bw*0.22;
        ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*rr, cy+Math.sin(a)*rr); ctx.lineTo(cx+Math.cos(a)*(rr-L), cy+Math.sin(a)*(rr-L)); ctx.stroke(); }
      ring(r - bw, lw*0.6, 'solid');
    } else if(kind === 'segments'){
      // a segmented arc, as on a display: uneven runs with gaps between
      const rr = r - bw*0.5; ctx.lineWidth = bw*0.35; ctx.lineCap = 'butt';
      let a = rot; const end = rot + Math.PI*2;
      while(a < end){ const run = Math.min(end - a, 0.1 + Math.random()*0.7); if(Math.random() < 0.8){ ctx.beginPath(); ctx.arc(cx, cy, rr, a, a + run - 0.04); ctx.stroke(); } a += run; }
      ctx.lineCap = tech > 0.5 ? 'butt' : 'round';
      ring(r - bw, lw*0.6, 'solid');
    } else if(kind === 'circuit'){
      // traces leaving the band at right angles, ending in pads
      const n = 8 + Math.floor(Math.random()*10), rr = r - bw*0.5; ctx.lineWidth = lw*0.7;
      ring(rr, lw*0.7, 'solid');
      for(let k=0;k<n;k++){ const a = rot + (k + Math.random()*0.5)/n*Math.PI*2, out = Math.random() < 0.5 ? 1 : -1;
        const x0 = cx+Math.cos(a)*rr, y0 = cy+Math.sin(a)*rr, l1 = bw*(0.4+Math.random()*0.8)*out;
        const x1 = x0 + Math.cos(a)*l1, y1 = y0 + Math.sin(a)*l1, side = (Math.random()<0.5?-1:1)*bw*(0.3+Math.random()*0.6);
        const x2 = x1 - Math.sin(a)*side, y2 = y1 + Math.cos(a)*side;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x2, y2, lw*1.6, 0, Math.PI*2); ctx.fill(); }
    }
    r -= bw*(1.05 + Math.random()*0.2);
  }
  // the geometry within: one polygram, or more, nested and turned
  const inner = Math.max(R*0.22, r);
  const npoly = Math.max(1, Math.min(4, Math.round(0.6 + amt*0.9)));
  ctx.lineWidth = lw*1.15;
  for(let p=0; p<npoly; p++){
    const ri = inner*(1 - p*0.22), geo = pick(tech > 0.6 ? ['square','hexagram','octagram','star'] : ['star','star','hexagram','octagram','triangle']);
    const ro = rot + p*0.37, n = geo === 'star' ? 5 + Math.floor(Math.random()*5) : 0;
    if(geo === 'star') poly(ri, n, ro, n === 6 ? 1 : (n === 8 ? 3 : 2));
    if(geo === 'hexagram'){ poly(ri, 3, ro, 1); poly(ri, 3, ro+Math.PI/3, 1); }
    if(geo === 'octagram'){ poly(ri, 4, ro, 1); poly(ri, 4, ro+Math.PI/4, 1); }
    if(geo === 'triangle'){ poly(ri, 3, ro, 1); ring(ri*0.5, lw, 'solid'); }
    if(geo === 'square'){ poly(ri, 4, ro, 1); poly(ri*0.707, 4, ro+Math.PI/4, 1); }
    if(p < npoly-1) ring(ri*0.78, lw*0.7, 'solid');
  }
  // the seal at the heart
  ring(inner*0.2, lw*1.1, 'solid');
  const seal = weighted([['glyph', 2], ['star', 1], ['dot', 1], ['spiral', 1.5*org], ['eye', 1.2*tech]]);
  if(seal === 'glyph') glyph(cx, cy, inner*0.24, 0);
  if(seal === 'star'){ ctx.lineWidth = lw; poly(inner*0.17, 5, rot, 2); }
  if(seal === 'dot'){ ctx.beginPath(); ctx.arc(cx, cy, inner*0.06, 0, Math.PI*2); ctx.fill(); }
  if(seal === 'spiral'){ ctx.lineWidth = lw; ctx.beginPath();
    for(let k=0;k<=60;k++){ const t=k/60, sr=inner*0.17*t, sa=rot + t*Math.PI*5; k ? ctx.lineTo(cx+Math.cos(sa)*sr, cy+Math.sin(sa)*sr) : ctx.moveTo(cx, cy); }
    ctx.stroke(); }
  if(seal === 'eye'){ ctx.lineWidth = lw; const e = inner*0.16;                      // a lens: an iris in an aperture
    ctx.beginPath(); ctx.arc(cx, cy, e, 0, Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, e*0.45, 0, Math.PI*2); ctx.fill(); }
  ctx.globalAlpha = 1;
  // NOISY BLOOM toward the digital end: the light lines glow, grainily
  const bloom = Math.max(0, (tech - 0.45)/0.55);
  if(bloom > 0.01){
    const div = canonDiv(4), bw2 = Math.ceil(w/div), bh = Math.ceil(h/div), n = bw2*bh;
    const sm = document.createElement('canvas'); sm.width = bw2; sm.height = bh;
    const sx = sm.getContext('2d', CPU); sx.imageSmoothingEnabled = true; sx.drawImage(c, 0, 0, bw2, bh);
    const img = sx.getImageData(0, 0, bw2, bh), d = img.data, B = new Float32Array(n), tmp = new Float32Array(n);
    for(let i = 0; i < n; i++) B[i] = Math.max(0, d[i*4] - 140)/115;
    const Rb = Math.max(2, Math.round(Math.min(bw2, bh)*0.012));
    for(let pass = 0; pass < 3; pass++){
      for(let y = 0; y < bh; y++){ const rr = y*bw2; let s = 0; for(let x = -Rb; x <= Rb; x++) s += B[rr + Math.min(bw2-1, Math.max(0, x))];
        for(let x = 0; x < bw2; x++){ tmp[rr + x] = s/(2*Rb + 1); s += B[rr + Math.min(bw2-1, x+Rb+1)] - B[rr + Math.max(0, x-Rb)]; } }
      for(let x = 0; x < bw2; x++){ let s = 0; for(let y = -Rb; y <= Rb; y++) s += tmp[Math.min(bh-1, Math.max(0, y))*bw2 + x];
        for(let y = 0; y < bh; y++){ B[y*bw2 + x] = s/(2*Rb + 1); s += tmp[Math.min(bh-1, y+Rb+1)*bw2 + x] - tmp[Math.max(0, y-Rb)*bw2 + x]; } }
    }
    for(let i = 0; i < n; i++){ const v = Math.min(255, B[i]*(0.35 + Math.random()*1.3)*330), q = i*4; d[q] = d[q+1] = d[q+2] = v; d[q+3] = 255; }
    sx.putImageData(img, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = bloom*0.8; ctx.imageSmoothingEnabled = true; ctx.drawImage(sm, 0, 0, w, h); ctx.restore();
  }
  return c;
}

// Fold the wet card, press,
// open it: something you have met
// before you were born.
export function genInkBleed(w,h,amt,zoom,form,colour,tint1,tint2){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  // A Rorschach card, after Hermann Rorschach's ten plates: ink dropped on
  // paper, the card folded and pressed, opened. Every seed is a different card:
  //   THE FIGURE  a bat spread across the fold; a pair facing each other over
  //               a gap; a column standing on the fold; scattered islands; a
  //               pelvis with a white void at its heart
  //   THE PRESS   mirrored, but never perfectly: each side slips a little
  //   WET INK     (Wetness) dry is crisp and solid; wet, the pigment gathers
  //               at the blot's rim as it dries (the coffee ring) and the
  //               middle goes pale and mottled, the edge wicks into the
  //               paper's fibres, the ink runs down in drips, splatters fly
  //   COLOUR      0 is black ink alone (plates I, IV–VII); higher, red joins it
  //               (II, III), and at the top whole pastel figures (VIII–X):
  //               Ink Hue and Accent Hue, the others turned from the accent
  // Paper is left clear (transparent): only ink is drawn, and ink darkens
  // what it lies on, as it would.
  const wet = Math.max(0, Math.min(1, form==null ? 0.5 : form)), col = Math.max(0, Math.min(1, colour==null ? 0.35 : colour));
  const INK = parseHex(tint1 || '#141414'), ACC = parseHex(tint2 || '#B0283A');
  const div = canonDiv(2), ww = Math.ceil(w/div), wh = Math.ceil(h/div), unit = Math.min(ww, wh), N = ww*wh;
  const fold = ww/2 + (Math.random()-0.5)*ww*0.04;
  // the palette: ink, the accent, and pastels turned from it
  const toHsl=(c)=>{ const r=c.r/255,g=c.g/255,b=c.b/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2; let hh=0,ss=0;
    if(mx!==mn){ const d=mx-mn; ss=l>0.5?d/(2-mx-mn):d/(mx+mn); hh=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4; hh/=6; } return [hh,ss,l]; };
  const fromHsl=(hh,ss,l)=>{ const f=(n)=>{ const k=(n+hh*12)%12, a=ss*Math.min(l,1-l); return 255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))); }; return { r:f(0), g:f(8), b:f(4) }; };
  const [ah, as2, al] = toHsl(ACC);
  const pastel = (k) => fromHsl((ah + k*0.21 + Math.random()*0.05)%1, Math.min(0.75, as2*0.8+0.2), Math.min(0.72, al*0.6+0.3));
  // the figure
  const KINDS = ['bat', 'pair', 'column', 'islands', 'pelvis'];
  const kind = KINDS[Math.floor(Math.random()*KINDS.length)];
  const S = unit*zoom, L = [];                                  // lobes: x from the fold, y, radii, weight, layer
  const lobe = (x, y, rx, ry, wgt, layer) => L.push({ x, y, rx: rx*S, ry: ry*S, w: wgt, layer });
  const midY = wh*(0.46 + (Math.random()-0.5)*0.1), sp = 0.75 + 0.5*amt;
  // which layers are coloured: the seed decides, Colour sets how far it may go
  const roll = Math.random(), polyOK = col > 0.66 && roll < (col-0.66)*2.4 + 0.25, redOK = col > 0.2 && roll < col*1.4;
  const layerCol = [INK]; if(redOK || polyOK) layerCol.push(ACC);
  if(polyOK){ layerCol[0] = pastel(1); for(let k=2;k<5;k++) layerCol.push(pastel(k)); }
  const lay = () => layerCol.length > 1 && Math.random() < (polyOK ? 0.85 : 0.3) ? 1 + Math.floor(Math.random()*(layerCol.length-1)) : 0;
  if(kind === 'bat'){
    lobe(0, midY, 0.07, 0.13, 1.2, 0); lobe(0, midY - S*0.12, 0.035, 0.05, 0.9, 0);
    const wings = 4 + Math.floor(Math.random()*3);
    for(let k=0;k<wings;k++){ const t=(k+1)/wings; lobe(S*(0.06+0.3*t*sp), midY - S*(0.05+0.12*Math.sin(t*Math.PI)*(0.5+Math.random())), 0.06+0.05*(1-t), 0.05+0.04*Math.random(), 0.9, k>wings-2 ? lay() : 0); }
  } else if(kind === 'pair'){
    const gap = S*(0.05+Math.random()*0.04);
    for(const k of [0,1,2,3,4]){ const ty=midY - S*0.22 + k*S*0.11; lobe(gap + S*(0.07+0.05*Math.sin(k*1.3)), ty, 0.05+0.02*Math.random(), 0.06, 1, k===0 ? lay() : 0); }
    lobe(gap*0.4, midY - S*0.02, 0.05, 0.015, 0.8, 0);         // the reaching arms, nearly touching
    lobe(0, midY + S*0.2, 0.045, 0.04, 0.9, lay());             // something between them, below
  } else if(kind === 'column'){
    for(let k=0;k<6;k++){ lobe(S*0.01*Math.random(), midY - S*0.28 + k*S*0.11, 0.04+0.03*Math.random(), 0.07, 1.1, 0); }
    for(let k=0;k<3;k++){ lobe(S*(0.08+0.08*Math.random()*sp), midY - S*0.2 + k*S*0.18, 0.05, 0.03, 0.85, lay()); }
  } else if(kind === 'islands'){
    const n = 5 + Math.floor(Math.random()*3);
    for(let k=0;k<n;k++){ lobe(S*(0.02+Math.random()*0.26*sp), wh*(0.15+0.7*k/(n-1)) + (Math.random()-0.5)*S*0.05, 0.04+0.04*Math.random(), 0.03+0.04*Math.random(), 1, k%layerCol.length); }
  } else {                                                      // pelvis: a mass with a white void at its heart
    for(let k=0;k<8;k++){ const a2=k/8*Math.PI*2; lobe(S*0.04 + Math.abs(Math.cos(a2))*S*0.12*sp, midY + Math.sin(a2)*S*0.15, 0.06, 0.05, 1, k===2 ? lay() : 0); }
    lobe(0, midY, 0.04, 0.06, -2.2, 0);                          // the void
    lobe(S*0.18*sp, midY + S*0.22, 0.05, 0.04, 0.9, lay());
  }
  // intricacy: small satellite lobes round the big ones (tendrils, fingers),
  // and a few white holes punched through the mass
  const big = L.filter(l => l.w > 0).slice();
  for(let k=0;k<10+Math.round(8*amt);k++){ const l = big[Math.floor(Math.random()*big.length)], a2 = Math.random()*Math.PI*2, f = 0.8 + Math.random()*0.6;
    L.push({ x: Math.max(0, l.x + Math.cos(a2)*l.rx*f), y: l.y + Math.sin(a2)*l.ry*f, rx: l.rx*(0.15+Math.random()*0.25), ry: l.ry*(0.15+Math.random()*0.35), w: 0.7, layer: l.layer }); }
  for(let k=0;k<2+Math.floor(Math.random()*3);k++){ const l = big[Math.floor(Math.random()*big.length)];
    L.push({ x: l.x + (Math.random()-0.5)*l.rx*0.6, y: l.y + (Math.random()-0.5)*l.ry*0.6, rx: l.rx*0.18, ry: l.ry*0.22, w: -1.6, layer: l.layer }); }
  // drips: runs down from a few lobes' undersides
  const drips = [];
  if(wet > 0.4){ const nd = Math.round((wet-0.4)*7); for(let k=0;k<nd;k++){ const l = L[Math.floor(Math.random()*L.length)]; if(l.w < 0) continue;
    drips.push({ x: l.x + (Math.random()-0.5)*l.rx, y: l.y + l.ry*0.8, len: S*(0.04+Math.random()*0.18)*wet, wd: S*(0.004+Math.random()*0.005), layer: l.layer }); } }
  const warpA = makeNoiseGrid(14,14), warpB = makeNoiseGrid(14,14), fib = makeNoiseGrid(96,96), mot = makeNoiseGrid(12,12), gran = makeNoiseGrid(80,80), slip = makeNoiseGrid(6,6);
  const nl = layerCol.length, TR = new Float32Array(N*3).fill(1);
  const ew = 0.02 + wet*0.07;
  for(let y=0;y<wh;y++) for(let x=0;x<ww;x++){
    const side = x < fold ? 0 : 1, k = y*ww + x;
    // the press: each side slips a little, differently
    const sl = (sampleNoiseGrid(slip,6,6, y/wh*5 + side*3, side*2.5) - 0.5)*unit*0.02;
    let dx = Math.abs(x - fold) + sl, yy = y;
    // organic edges: the field's coordinates warped by noise
    const u = (dx/unit)*6 + side*0.37, v = (y/unit)*6;
    const wa = (sampleNoiseGrid(warpA,14,14,u*1.7,v*1.7)-0.5)*unit*(0.05+0.03*wet), wb = (sampleNoiseGrid(warpB,14,14,u*1.7,v*1.7)-0.5)*unit*0.05;
    dx += wa; yy += wb;
    // wicking: fine fibres along the paper's grain, the wetter the further
    const fibre = (sampleNoiseGrid(fib,96,96, x/ww*95, y/wh*30) - 0.5)*wet*0.35;
    // blooms (broad, soft) and pigment granulating in the paper's tooth (fine, faint)
    const mott = sampleNoiseGrid(mot,12,12, x/ww*11, y/wh*11)*0.8 + sampleNoiseGrid(gran,80,80, x/ww*79, y/wh*79)*0.2;
    for(let li=0; li<nl; li++){
      let D = 0;
      for(const l of L){ if(l.layer !== li && l.w > 0) continue; const ax = (dx - l.x)/l.rx, ay = (yy - l.y)/l.ry; const q = ax*ax + ay*ay; if(q < 9) D += l.w*Math.exp(-q); }
      for(const d of drips){ if(d.layer !== li) continue; const t = (yy - d.y)/d.len; if(t < -0.1 || t > 1.08) continue;
        const wd = d.wd*(1 - 0.5*Math.max(0,t)) + (t > 0.92 ? d.wd*1.2 : 0), ax = (dx - d.x)/wd; D += 0.9*Math.exp(-ax*ax)*(t > 1 ? Math.exp(-(((t-1)/0.04)**2)) : 1); }
      if(D < 0.2) continue;
      const cover = Math.max(0, Math.min(1, (D + fibre - (0.5 - ew))/(2*ew)));
      if(cover <= 0) continue;
      // inside: dry ink is solid; wet ink pools at the rim and goes pale and mottled within
      const depth = Math.max(0, Math.min(1, (D - 0.5)/0.7)), rim = Math.exp(-depth*9);
      const dens = (0.93 - wet*0.45*(1-rim) + wet*0.07*rim)*(1 - wet*0.6*(mott-0.5));
      const op = Math.min(1, cover*dens), C = layerCol[li];
      // ink is subtractive: each layer filters the light the paper sends back
      TR[k*3]   *= 1 - op*(1 - C.r/255); TR[k*3+1] *= 1 - op*(1 - C.g/255); TR[k*3+2] *= 1 - op*(1 - C.b/255);
    }
  }
  const small = document.createElement('canvas'); small.width = ww; small.height = wh;
  const sctx = small.getContext('2d', CPU), img = sctx.createImageData(ww, wh), d = img.data;
  for(let k=0;k<N;k++){
    const r = TR[k*3], g = TR[k*3+1], b = TR[k*3+2], a = 1 - Math.min(r, g, b), q = k*4;
    if(a < 0.003){ d[q+3] = 0; continue; }
    // the ink that, laid over white paper, leaves exactly this
    d[q] = Math.max(0, 255*(r - (1-a))/a); d[q+1] = Math.max(0, 255*(g - (1-a))/a); d[q+2] = Math.max(0, 255*(b - (1-a))/a); d[q+3] = 255*a;
  }
  sctx.putImageData(img, 0, 0);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d', CPU); ctx.imageSmoothingEnabled = true; ctx.drawImage(small, 0, 0, w, h);
  // splatter thrown clear, mirrored (a wet card spits), and the fold's crease
  const nfl = Math.round((6 + 30*wet)*amt), F = div;
  for(let k=0;k<nfl;k++){ const l = L[Math.floor(Math.random()*L.length)]; if(l.w < 0) continue;
    const ang = Math.random()*Math.PI*2, dist = (1.1 + Math.random()*1.6)*Math.max(l.rx, l.ry), r0 = cpx(1.5 + Math.random()*Math.random()*9)*Math.sqrt(zoom);   // bigger blots throw bigger drops
    const fx = (l.x + Math.cos(ang)*dist)*F, fy = (l.y + Math.sin(ang)*dist)*F, C = layerCol[l.layer] || INK;
    ctx.fillStyle = `rgba(${C.r|0},${C.g|0},${C.b|0},${0.55 + Math.random()*0.4})`;
    for(const sx2 of [fold*F - fx, fold*F + fx + (Math.random()-0.5)*cpx(6)]){ ctx.beginPath(); ctx.arc(sx2, fy, r0, 0, Math.PI*2); ctx.fill(); } }
  ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = cpx(1.5); ctx.beginPath(); ctx.moveTo(fold*F, 0); ctx.lineTo(fold*F, h); ctx.stroke();
  return c;
}

export function genCrackedGlaze(w,h,amt,zoom,light,form,tint1,tint2,M3,GLW){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const enamel = Math.max(0, Math.min(1, form==null ? 0 : form));
  // Glaze: a glassy layer over a body. As it ages it CRAZES — a network of
  // fine cracks, big cells split by finer ones, grime settled in them — then
  // blisters, chips, and at last peels away to the rough, matte body below,
  // lifting at its broken edges. All of it as heights, lit by the dial: the
  // glaze stands above the body, cracks are grooves in it, and where it is
  // gone the drop casts a shadow. Glossy glaze, matte body.
  // FRACTURE SCALE · CRACK DENSITY · ENAMELING (unbroken → bubbled → chipped → peeling)
  // Coloured as a game engine would: GLAZE and BASE (the clay body, bare in
  // chips, peels and crack bottoms) are the albedos; DIFFUSE is the light's
  // colour, SPECULAR the glaze's shine, SHADOW what fills the shade. The glaze
  // is PAINTED: brushed on, so it is thicker in streaks and pools, thinner
  // where it breaks over a high spot (and the body shows through), its hue
  // wandering a little — all by the seed. Where it peels, its edge CURLS up.
  // GLOW: uranium glaze, fluorescing.
  const GZ = parseHex(tint1 || '#A9B4B0'), BS = parseHex(tint2 || '#7A6A5E');
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
  // PAINTED: brush streaks along one direction, runs down the page, slow pools
  const ba = Math.random()*Math.PI, bc = Math.cos(ba), bs = Math.sin(ba);
  const strk = makeNoiseGrid(48, 48), runs = makeNoiseGrid(64, 16), pool = makeNoiseGrid(7, 7), hueN = makeNoiseGrid(5, 5);
  const THK = new Float32Array(ww*wh);
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
    const u = x/ww, v = y/wh, al = u*bc + v*bs, ac = -u*bs + v*bc;
    const streak = sampleNoiseGrid(strk, 48, 48, al*3, ac*40), run = sampleNoiseGrid(runs, 64, 16, u*63, v*4), pl = sampleNoiseGrid(pool, 7, 7, u*6, v*6);
    const k = y*ww + x;
    THK[k] = Math.max(0, Math.min(1, 0.5 + (streak - 0.5)*0.55 + (run - 0.5)*0.3 + (pl - 0.5)*0.6));
    if(GL[k] > 0) H[k] += t*0.35*(THK[k] - 0.5);
  }
  // the CURL: where the glaze has peeled, its edge rolls up off the body — a
  // raised, rounded lip a little way in from the break (its shadow falls on
  // the body), by how far the glaze has gone
  if(enamel > 0.35){
    const R = Math.max(2, unit*0.012), D = new Float32Array(ww*wh);
    for(let k = 0; k < ww*wh; k++) D[k] = GL[k] > 0 ? 1e6 : 0;
    for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){ const k = y*ww + x; if(!D[k]) continue; let m = D[k];
      if(x > 0) m = Math.min(m, D[k-1] + 1); if(y > 0){ m = Math.min(m, D[k-ww] + 1); if(x > 0) m = Math.min(m, D[k-ww-1] + 1.414); if(x < ww-1) m = Math.min(m, D[k-ww+1] + 1.414); } D[k] = m; }
    for(let y = wh-1; y >= 0; y--) for(let x = ww-1; x >= 0; x--){ const k = y*ww + x; if(!D[k]) continue; let m = D[k];
      if(x < ww-1) m = Math.min(m, D[k+1] + 1); if(y < wh-1){ m = Math.min(m, D[k+ww] + 1); if(x < ww-1) m = Math.min(m, D[k+ww+1] + 1.414); if(x > 0) m = Math.min(m, D[k+ww-1] + 1.414); } D[k] = m; }
    const lift = Math.min(1, (enamel - 0.35)/0.45);
    for(let k = 0; k < ww*wh; k++){ if(GL[k] <= 0 || D[k] > R) continue;
      const q = D[k]/R; H[k] += t*1.6*lift*Math.sin(Math.PI*Math.min(1, q*1.15))*(1 - q*0.4); DIRT[k] *= 0.5; }
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
  // the glaze's own wandering colour: a second hue, a little round the wheel
  const lumG = 0.299*GZ.r + 0.587*GZ.g + 0.114*GZ.b, sh2 = (Math.random() - 0.5)*0.5;
  const G2 = { r: GZ.r + (GZ.g - GZ.r)*sh2, g: GZ.g + (GZ.b - GZ.g)*sh2, b: GZ.b + (GZ.r - GZ.b)*sh2 };
  const grain2 = makeNoiseGrid(80, 80);
  const small = document.createElement('canvas'); small.width = ww; small.height = wh;
  const sctx = small.getContext('2d', CPU), img = sctx.createImageData(ww, wh), dd = img.data;
  for(let y = 0; y < wh; y++) for(let x = 0; x < ww; x++){
    const k = y*ww + x, q = k*4, g = GL[k], th = THK[k];
    const hv = sampleNoiseGrid(hueN, 5, 5, x/ww*4, y/wh*4), gr = 0.85 + 0.3*sampleNoiseGrid(grain2, 80, 80, x/ww*79, y/wh*79);
    const sp = L.spec[k]*g*0.75;
    for(let c = 0; c < 3; c++){
      const gz = [GZ.r, GZ.g, GZ.b][c]*(1 - hv) + [G2.r, G2.g, G2.b][c]*hv, bs2 = [BS.r, BS.g, BS.b][c];
      // thick glaze pools deeper; thin glaze breaks, and the body shows through
      const glaze = gz*(1.12 - 0.3*th), thin = Math.max(0, 0.45 - th)*1.2;
      const alb = g > 0 ? glaze*(1 - thin) + bs2*thin : bs2*gr;
      const k_c = litK(L, k, 0.45, M3, c)/fl;
      let v = alb*k_c*(1 - DIRT[k]*0.55) + 255*sp*litS(M3, c);
      if(GLW && g > 0) v += 255*[GLW.r, GLW.g, GLW.b][c]*(0.4 + 0.6*th)*0.55;
      dd[q+c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
    dd[q+3] = 255;
  }
  sctx.putImageData(img, 0, 0);
  const full = document.createElement('canvas'); full.width = w; full.height = h;
  const fctx = full.getContext('2d', CPU); fctx.imageSmoothingEnabled = true; fctx.drawImage(small, 0, 0, w, h);
  return full;
}

export function genTessellate(w,h,amt,zoom,light,tint1,tint2,M3,GL){
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
    // GLOW: molten light in the sunken facets, as if lava showed through
    const e = GL ? 255*Math.pow(Math.min(1, Math.max(0, (-H[i]/(cell*0.3) - 0.4)/0.6)), 1.6) : 0;   // only the deepest
    dta[q]   = Math.max(0, Math.min(255, mat.r*K(0)*(lightCol.r/255) + lightCol.r*sp*litS(M3, 0) + (GL ? GL.r*e : 0)));
    dta[q+1] = Math.max(0, Math.min(255, mat.g*K(1)*(lightCol.g/255) + lightCol.g*sp*litS(M3, 1) + (GL ? GL.g*e : 0)));
    dta[q+2] = Math.max(0, Math.min(255, mat.b*K(2)*(lightCol.b/255) + lightCol.b*sp*litS(M3, 2) + (GL ? GL.b*e : 0)));
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
export function genBlackHole(w,h,amt,zoom,light,form){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  // A black hole RAY-TRACED, after Luminet (1979), Riazuelo's and Interstellar's
  // renderers (James et al. 2015) and Antonelli's "Starless": every working
  // pixel sends a ray back from the eye, bent by the hole's gravity
  // (Schwarzschild: a = −1.5·h²·r̂/r⁴, units of the horizon radius), and
  // whatever it meets is what we see there:
  //   the disc     gas swirling in to the last stable orbit (3 radii): hot and
  //                bright inside, its filaments sheared into spirals by the
  //                faster inner orbit, dark lanes of dust across them; the
  //                side coming toward us beamed brighter (Doppler, δ³), the
  //                light from deep in the well dimmed (gravitational redshift).
  //                Its far side shows bent up over the shadow and down beneath
  //                it — not drawn there: the rays really go round
  //   photon ring  rays that orbit once or more before escaping: a thin bright
  //                ring hugging the shadow
  //   the shadow   rays that fall in
  //   the sky      rays that escape land on stars and nebula behind: lensed
  //                into arcs, an Einstein ring, a second image inside
  //   jets         plasma along the spin axis, helical, knotted, the one coming
  //                toward us brighter; lensed like everything else
  //   bloom        the brightest gas glows, scattering light around it
  // THE DIAL is where we view it from: its direction turns it in the sky; its
  // distance from the centre is how edge-on — at the rim nearly edge-on, at
  // the centre face-on. CHAOS: the lensing's reach (how far behind it the sky
  // lies), the disc's size and turbulence, the bloom. PARTICLES: the stars
  // and the nebula's gas and dust. JETS: their length and brightness.
  const jets=Math.max(0, Math.min(1, form==null ? 0 : form)), chaos=zoom;
  const deg=light==null ? 315 : light, lv=lightVec(deg), view=Math.min(1, Math.hypot(lv.lx, lv.ly));
  const unit=Math.min(w,h), cx=w*(0.2+Math.random()*0.6), cy=h*(0.2+Math.random()*0.6);
  const Rsh=unit*(0.055+Math.random()*0.03), S=Rsh/2.6;            // the shadow; pixels per horizon radius
  const tilt0=(8+Math.random()*10)*Math.PI/180, elev=tilt0 + (Math.PI/2 - tilt0)*(1-view);
  const spin=(Math.random()-0.5)*0.15 + ((((deg-315+540)%360)+360)%360 - 180)*Math.PI/180;
  const dirSign=Math.random()<0.5?1:-1, cosR=Math.cos(spin), sinR=Math.sin(spin);
  // the camera, far off along c, the disc in the plane y = 0
  const ce=Math.cos(elev), se=Math.sin(elev), Cy=se, Cz=ce, Uy=ce, Uz=-se, D=70;
  const Dsky=8+14*chaos;                                          // how far behind the sky lies: the lensing's reach
  const rIn=3, rOut=8+4*Math.min(2.5, chaos), Lj=(6+16*jets)*Math.max(0.2, ce)+ (1-ce)*4;
  // the disc's gas: noise wrapped round the orbit, wound into spirals
  const GW=40, GH=24, gas=makeNoiseGrid(GW,GH), gas2=makeNoiseGrid(GW,GH), dust=makeNoiseGrid(GW/2,GH/2);   // sampled at whole multiples of a turn, so they close round the orbit
  const twist=0.25+Math.random()*0.2, turb=Math.min(1, 0.45+0.3*chaos), ph0=Math.random()*GW;
  const prof=(r)=>Math.pow(rIn/r,1.5)*Math.sqrt(Math.max(0,1-Math.sqrt(rIn/r)));
  let pmax=0; for(let r=rIn;r<rIn*3;r+=0.05) pmax=Math.max(pmax,prof(r));
  const jph=Math.random()*6.28;
  const div=canonDiv(2), ww=Math.ceil(w/div), wh=Math.ceil(h/div), N=ww*wh;
  const EM=new Float32Array(N), TR=new Float32Array(N), BX=new Float32Array(N), BY=new Float32Array(N), CAP=new Float32Array(N);
  const jw0=0.22, jwk=0.06, jetK=60+120*jets, jetOn=jets>0.01;
  // one ray, back from the working pixel (i, j)
  const trace=(i, j)=>{
    const k=j*ww+i, X=(i+0.5)*div-cx, Y=(j+0.5)*div-cy;
    const sx=( X*cosR + Y*sinR)/S, sy=(-X*sinR + Y*cosR)/S;          // un-turned, in horizon radii
    let px=sx, py=Cy*D - Uy*sy, pz=Cz*D - Uz*sy, vx=0, vy=-Cy, vz=-Cz;
    const hx=py*vz-pz*vy, hy=pz*vx-px*vz, hz=px*vy-py*vx, h2=hx*hx+hy*hy+hz*hz, K=-1.5*h2;
    let em=0, T=1, cap=0, steps=0, rmin=1e9, half=0;
    // leapfrog (kick–drift–kick): second order, so the sky's lensing doesn't
    // band into rings from step-size error
    while(steps++<600){
      const r2=px*px+py*py+pz*pz, r=Math.sqrt(r2);
      if(r<1.02){ cap=1; break; }
      if(r<rmin) rmin=r;
      const f=K/(r2*r2*r);
      if(half){ vx+=f*px*half; vy+=f*py*half; vz+=f*pz*half; }      // finish the last step's kick
      if(r>D+5 && (px*vx+py*vy+pz*vz)>0) break;
      // steps in proportion to the distance far out (log steps), finer near the photon sphere
      let dt=r<8 ? 0.03*r*r : 0.24*r;
      const ay=py<0?-py:py;
      let jw=0;
      if(jetOn && ay>1 && ay<Lj+2){ jw=jw0+jwk*ay; const rho2=px*px+pz*pz; if(rho2<16*jw*jw && dt>jw*0.5) dt=jw*0.5; }
      const y0=py; half=dt*0.5;
      vx+=f*px*half; vy+=f*py*half; vz+=f*pz*half;
      const ox=px, oz=pz; px+=vx*dt; py+=vy*dt; pz+=vz*dt;
      // JETS: glowing plasma, a helix round the axis, knotted, fading with height
      if(jw>0){ const hh=py<0?-py:py;
        if(hh>1 && hh<Lj){ const hel=0.18*Math.sqrt(hh), a2=hh*0.9+jph+(py>0?0:3.1), ex=px-hel*Math.cos(a2), ez=pz-hel*Math.sin(a2), rho2=ex*ex+ez*ez;
          if(rho2<9*jw*jw){
            const fall=Math.pow(1-hh/Lj,1.3), sk=Math.sin(hh*0.75+jph), knot=0.45+0.55*sk*sk*sk*sk;
            const toward=(py>0)===(Cy>0) ? 1 : 0.4;                      // beamed toward us
            em+=T*Math.exp(-rho2/(jw*jw))*fall*knot*toward*dt*Math.sqrt(vx*vx+vy*vy+vz*vz)*jetK; } } }
      // THE DISC: where the ray crosses its plane
      if((y0>0)!==(py>0)){
        const t=y0/(y0-py), qx=ox+(px-ox)*t, qz=oz+(pz-oz)*t, rr=Math.sqrt(qx*qx+qz*qz);
        if(rr>rIn*0.92 && rr<rOut*1.15){
          const edge=Math.min(1, (rr-rIn*0.92)/(rIn*0.25))*Math.min(1, (rOut*1.15-rr)/(rOut*0.35));
          const phi=Math.atan2(qz,qx), lr=Math.log(rr);
          const u=((phi/(2*Math.PI))+twist*lr*dirSign)*GW+ph0, vv=lr*GH/1.2;
          // gas: long filaments wound into spirals (stretched along the orbit), finer streaks on them
          const g1=sampleNoiseGrid(gas,GW,GH,u,vv*1.6), g2=sampleNoiseGrid(gas2,GW,GH,u*2,vv*3);
          const filament=0.55+turb*(g1*0.9+g2*0.25-0.58);
          const lane=Math.max(0, sampleNoiseGrid(dust,GW/2,GH/2,u*0.5,vv*1.1)-0.62)/0.38;   // dust: dark, opaque
          // Doppler: the gas's orbit against the ray (toward the eye is −v)
          const vk=Math.sqrt(0.5/Math.max(1.05,rr-1)), bx=-qz/rr*vk*dirSign, bz=qx/rr*vk*dirSign, vl=Math.sqrt(vx*vx+vy*vy+vz*vz);
          const cosT=-(bx*vx+bz*vz)/(vl*vk), gam=1/Math.sqrt(1-vk*vk), dop=1/(gam*(1-vk*cosT)), red=Math.sqrt(1-1/rr);
          const I=prof(rr)/pmax*Math.pow(dop*red, 2.2)*Math.max(0, filament)*1.6;
          const alpha=Math.min(0.97, edge*(0.55+0.4*Math.min(1,filament*1.5)+0.6*lane));
          const tone=128+150*Math.min(1.6, I)*(1-0.85*lane) - 90*lane*(1-Math.min(1,I));
          em+=T*alpha*tone; T*=1-alpha;
          if(T<0.01) break;
        }
      }
    }
    // the photon ring: rays that skimmed the photon sphere, a thin glow
    const pr=(rmin-1.5)/0.06; em+=T*100*Math.exp(-pr*pr);
    EM[k]=em; TR[k]=T; CAP[k]=cap;
    // where an escaped ray lands on the sky behind (the sky plane, Dsky back)
    if(!cap){ const back=-(vy*Cy+vz*Cz), along=(py*Cy+pz*Cz);
      let bxs, bys;
      if(back>0.15){ const tt=(along+Dsky)/back; const qy=py+vy*tt, qz=pz+vz*tt; bxs=px+vx*tt; bys=-(qy*Uy+qz*Uz); }
      else { bxs=vx*400; bys=-(vy*Uy+vz*Uz)*400; }                    // bent right round: anywhere far
      BX[k]=cx+(bxs*cosR - bys*sinR)*S; BY[k]=cy+(bxs*sinR + bys*cosR)*S; }
  };
  // ADAPTIVE: trace every other pixel; between them, trace again only where
  // the picture changes (the disc, the rings, the jets, the shadow's edge) —
  // the smooth, gently lensed sky is filled in between
  const done=new Uint8Array(N);
  for(let j=0;j<wh;j+=2) for(let i=0;i<ww;i+=2){ trace(i,j); done[j*ww+i]=1; }
  const close=(a, b)=>CAP[a]===CAP[b] && Math.abs(EM[a]-EM[b])<6 && Math.abs(TR[a]-TR[b])<0.04 && (CAP[a] || (Math.abs(BX[a]-BX[b])<div*3 && Math.abs(BY[a]-BY[b])<div*3));
  const fill=(k, a, b)=>{ EM[k]=(EM[a]+EM[b])/2; TR[k]=(TR[a]+TR[b])/2; CAP[k]=CAP[a]; BX[k]=(BX[a]+BX[b])/2; BY[k]=(BY[a]+BY[b])/2; done[k]=1; };
  // rows of traced points: fill or trace the pixels between them
  for(let j=0;j<wh;j+=2) for(let i=1;i<ww;i+=2){ const k=j*ww+i, a=k-1, b=k+1;
    if(i+1<ww && close(a,b)) fill(k,a,b); else trace(i,j); done[k]=1; }
  // the rows between
  for(let j=1;j<wh;j+=2) for(let i=0;i<ww;i++){ const k=j*ww+i, a=k-ww, b=k+ww;
    if(j+1<wh && close(a,b)) fill(k,a,b); else trace(i,j); done[k]=1; }
  // BLOOM: the brightest gas glows
  const bl=new Float32Array(N); for(let k=0;k<N;k++) bl[k]=Math.max(0, EM[k]-190);
  const blur=(A,R)=>{ const tmp=new Float32Array(N);
    for(let j=0;j<wh;j++){ let acc=0; for(let i=-R;i<ww+R;i++){ if(i+R<ww) acc+=A[j*ww+i+R]; if(i-R-1>=0) acc-=A[j*ww+i-R-1]; if(i>=0&&i<ww) tmp[j*ww+i]=acc/(2*R+1); } }
    for(let i=0;i<ww;i++){ let acc=0; for(let j=-R;j<wh+R;j++){ if(j+R<wh) acc+=tmp[(j+R)*ww+i]; if(j-R-1>=0) acc-=tmp[(j-R-1)*ww+i]; if(j>=0&&j<wh) A[j*ww+i]=acc/(2*R+1); } } };
  const BR=Math.max(1, Math.round(Rsh*0.25/div)); for(let p=0;p<3;p++) blur(bl, BR);
  const BR2=Math.max(1, Math.round(Rsh*1.2/div)), wide=Float32Array.from(bl); for(let p=0;p<2;p++) blur(wide, BR2);
  // THE SKY, sampled through the lens at full resolution so the stars stay sharp
  const nebA=makeNoiseGrid(32,32), nebB=makeNoiseGrid(64,64), dustA=makeNoiseGrid(48,48);
  const neb=Math.min(1.5, 0.5+0.5*amt), cs=cpx(22), pStar=Math.min(0.85, 0.22*amt);
  const hash=(a,b,s2)=>{ let x=Math.imul(a,374761393)^Math.imul(b,668265263)^Math.imul(s2,2246822519); x=Math.imul(x^(x>>>13),1274126177); return ((x^(x>>>16))>>>0)/4294967296; };
  const seed=(Math.random()*1e9)|0, U2=unit;
  // the nebula is soft: worked out on the working grid, through the lens
  const SKY=new Float32Array(N);
  for(let k=0;k<N;k++){
    if(CAP[k]){ SKY[k]=4; continue; }
    const bx=BX[k], by=BY[k], nx=bx/U2, ny=by/U2, gasv=sampleNoiseGrid(nebA,32,32,nx*5,ny*5)*0.65+sampleNoiseGrid(nebB,64,64,nx*17,ny*17)*0.35;
    const dl=sampleNoiseGrid(dustA,48,48,nx*9+3,ny*9+7), lit=1+0.6*Math.exp(-(((bx-cx)**2+(by-cy)**2)/((Rsh*5)**2)));
    SKY[k]=128 + neb*(Math.max(0,gasv-0.5)*50*lit - Math.max(0,dl-0.55)*90);
  }
  // all that is not sky, in one buffer: the gas and jets in front, and the bloom
  const FR=new Float32Array(N), bk=0.9*Math.min(1.4,chaos), wk=0.5*Math.min(1.4,chaos);
  for(let k=0;k<N;k++) FR[k]=EM[k]+bl[k]*bk+wide[k]*wk;
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU), img=ctx.createImageData(w,h), d=img.data;
  // the stars: sharp, at full resolution, through the lens
  for(let y=0;y<h;y++){
    const fy=Math.min(wh-1.001, Math.max(0, y/div-0.5)), j0=fy|0, ty=fy-j0;
    for(let x=0;x<w;x++){
      const fx=Math.min(ww-1.001, Math.max(0, x/div-0.5)), i0=fx|0, tx=fx-i0, k=j0*ww+i0, k1=k+1, k2=k+ww, k3=k2+1;
      const w00=(1-tx)*(1-ty), w10=tx*(1-ty), w01=(1-tx)*ty, w11=tx*ty;
      const T=TR[k]*w00+TR[k1]*w10+TR[k2]*w01+TR[k3]*w11;
      let sky=SKY[k]*w00+SKY[k1]*w10+SKY[k2]*w01+SKY[k3]*w11;
      if(T>0.02 && !(CAP[k]&&CAP[k1]&&CAP[k2]&&CAP[k3])){
        // the landing point, from the uncaptured corners
        let bx=0, by=0, ws=0;
        if(!CAP[k]){ bx+=BX[k]*w00; by+=BY[k]*w00; ws+=w00; } if(!CAP[k1]){ bx+=BX[k1]*w10; by+=BY[k1]*w10; ws+=w10; }
        if(!CAP[k2]){ bx+=BX[k2]*w01; by+=BY[k2]*w01; ws+=w01; } if(!CAP[k3]){ bx+=BX[k3]*w11; by+=BY[k3]*w11; ws+=w11; }
        bx/=ws; by/=ws;
        const ix=Math.floor(bx/cs), iy=Math.floor(by/cs);
        if(hash(ix,iy,seed)<pStar){ const sxp=(ix+0.25+0.5*hash(ix,iy,seed+1))*cs, syp=(iy+0.25+0.5*hash(ix,iy,seed+2))*cs;
          const near=hash(ix,iy,seed+3), rr=cs*(0.03+0.14*near*near*near), dd2=(bx-sxp)**2+(by-syp)**2;
          if(dd2<rr*rr*9) sky+=ws*(60+120*near)*Math.exp(-dd2/(rr*rr)); }
      }
      const val=FR[k]*w00+FR[k1]*w10+FR[k2]*w01+FR[k3]*w11+T*sky;
      const q=(y*w+x)*4, o=val<0?0:val>255?255:val; d[q]=d[q+1]=d[q+2]=o; d[q+3]=255;
    }
  }
  ctx.putImageData(img,0,0);
  return c;
}
