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

export function genCrackedGlaze(w,h,amt,zoom,light,form,M3){
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
    const off = (GL[k] <= 0 ? 22 : 0) + DIRT[k]*55, q = k*4;
    if(!M3){ const v = 128 + lit + shine - off; dd[q] = dd[q+1] = dd[q+2] = Math.max(0, Math.min(255, v)); }
    else for(let c = 0; c < 3; c++) dd[q+c] = Math.max(0, Math.min(255, greyLit(lit, shine, M3, c) - off));
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
  // THE DIAL is where we view it from: its direction turns the disc in the
  // sky; its distance from the centre is how edge-on we see it — at the rim
  // nearly edge-on (as it always was), at the centre face-on, a ring.
  // JETS: twin beams of plasma along the spin axis, knotted, the one coming
  // toward us brighter; foreshortened as the view turns face-on.
  const jets=Math.max(0, Math.min(1, form==null ? 0 : form));
  const deg=light==null ? 315 : light, lv=lightVec(deg), view=Math.min(1, Math.hypot(lv.lx, lv.ly));
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
  const tilt0=(8+Math.random()*10)*Math.PI/180;          // near edge-on, from the rim of the dial…
  const tilt=tilt0 + (Math.PI/2 - tilt0)*(1-view);        // …turning face-on toward its centre
  const spin=(Math.random()-0.5)*0.15 + ((((deg-315+540)%360)+360)%360 - 180)*Math.PI/180;   // the dial's direction turns it (level at its default)
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
  const orbitArc=(r, from, to, lensed, lower, fade=1)=>{
    const heat=Math.pow(Rsh*2.6/r,0.9);
    const v=Math.min(0.35,Math.sqrt(Rsh*2.6/r)*0.35);
    const turb=0.55+Math.random()*0.9*Math.min(1.6,chaos);  // gaps and bright bands
    const seg=20;
    ctx.lineWidth=Math.max(cpx(0.6),Rsh*(0.03+0.05*heat));
    for(let k=0;k<seg;k++){
      const p0=from+(to-from)*k/seg, p1=from+(to-from)*(k+1)/seg;
      const beam=Math.pow(1+dirSign*v*Math.cos((p0+p1)/2),2);
      const tone=Math.min(255,150+105*heat*Math.min(1.5,beam));
      ctx.globalAlpha=Math.min(0.9,(0.05+0.3*heat)*beam*turb*(0.6+0.25*chaos)*(lensed?(lower?0.35:0.8):1))*fade;
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
  // the jets: streams along the spin axis (screen: perpendicular to the disc's long axis)
  const jet=(sign, front)=>{
    if(jets<=0.01) return;
    const ax=-sinR*sign, ay=cosR*sign, Lj=unit*(0.18+0.3*jets)*Math.cos(tilt)+Rsh, n=Math.round(260*jets);
    const bright=(sign===dirSign ? 1 : 0.45);                        // beamed toward us, dimmed away
    for(let k=0;k<n;k++){
      const s1=Rsh*1.1 + Math.pow(Math.random(),1.4)*(Lj-Rsh), f=(s1-Rsh)/(Lj-Rsh);
      const spread=s1*0.05*(1+Math.random()), knot=0.6+0.4*Math.pow(Math.abs(Math.sin(f*Math.PI*5)),3);
      const off=(Math.random()-0.5)*spread*2, wob=Math.sin(f*9+sign)*spread*0.6;
      const x=cx+ax*s1-ay*(off+wob), y=cy+ay*s1+ax*(off+wob);
      ctx.globalAlpha=Math.min(0.9, (0.25+0.5*Math.random())*Math.pow(1-f,1.2)*knot*bright*(front?1:0.6));
      ctx.fillStyle='rgb(245,245,245)';
      ctx.beginPath(); ctx.ellipse(x, y, Rsh*(0.03+0.05*(1-f)), Rsh*(0.1+0.25*(1-f)), Math.atan2(ay,ax)+Math.PI/2, 0, Math.PI*2); ctx.fill();
    }
  };
  jet(-dirSign, false);
  // behind: the lensed arch over the top, and the fainter one beneath
  // (seen face-on there is no arch: the far half of the disc simply shows)
  for(const r of orbitsR) orbitArc(r, 0, Math.PI, true, false, view);
  for(const r of orbitsR) orbitArc(r, 0, Math.PI, true, true, view);
  if(view<0.999) for(const r of orbitsR) orbitArc(r, Math.PI, Math.PI*2, false, false, 1-view);
  // the shadow, then the photon ring hugging it
  ctx.globalAlpha=1; ctx.fillStyle='rgb(4,4,4)';
  ctx.beginPath(); ctx.arc(cx,cy,Rsh,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgb(252,252,252)'; ctx.lineWidth=Math.max(cpx(1),Rsh*0.04);
  ctx.globalAlpha=0.9; ctx.beginPath(); ctx.arc(cx,cy,Rsh*1.04,0,Math.PI*2); ctx.stroke();
  // in front: the near half of every orbit, crossing over the shadow
  for(const r of orbitsR) orbitArc(r, 0, Math.PI, false, false);
  jet(dirSign, true);
  ctx.globalAlpha=1;
  return c;
}
