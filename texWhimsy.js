/**
 * texWhimsy.js — ♡ Whimsy. Hue: red, purple and blue.
 *
 * Sleep; starlight advancing or receding. Clouds, bokeh, the deep field,
 * euphoria dust, burning mana, first snow, aurora.
 */
import { makeNoiseGrid, sampleNoiseGrid, mixHex, darkenRgb, parseHex, withSeed, lightVec, CPU, canonArea, cpx, canonDiv, smoothField } from './texCore.js';

export function genClouds(w,h,amt,zoom,light,form,M3){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const dust=Math.max(0,Math.min(1, form==null ? 0.35 : form));
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU);

  // Smoke in a dusty room. Haze pools in soft strata under the ceiling; WISPS
  // rise from a few smouldering sources — a narrow laminar plume that breaks
  // into curls as it climbs (particles carried by curl noise), thinning as it
  // goes. LIFT is how far and straight they rise; DRAG is the draught pulling
  // them sideways, more the higher they get. Now and then a SMOKE RING drifts
  // up, trailing a wake. DUST is a shaft of light from the dial's direction:
  // the smoke inside it glows, and motes of dust catch the light.
  // Computed on a quarter-resolution canonical grid (the same grid at any
  // size, so the preview is the export scaled down) — smoke is soft by nature.
  const div=canonDiv(4), ww=Math.ceil(w/div), wh=Math.ceil(h/div), unit=Math.min(ww,wh), N=ww*wh;
  const perm=new Uint8Array(512), base=[...Array(256).keys()];
  for(let i=255;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [base[i],base[j]]=[base[j],base[i]]; }
  for(let i=0;i<512;i++) perm[i]=base[i&255];
  const fade=t=>t*t*(3-2*t);
  const vn=(x,y)=>{ const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi, u=fade(xf), v=fade(yf);
    const a=perm[(perm[xi&255]+yi)&511], b=perm[(perm[(xi+1)&255]+yi)&511];
    const c2=perm[(perm[xi&255]+yi+1)&511], d=perm[(perm[(xi+1)&255]+yi+1)&511];
    return ((a*(1-u)+b*u)*(1-v)+(c2*(1-u)+d*u)*v)/255; };
  const fbm=(x,y)=>{ let s=0,a=0.5,f=1; for(let o=0;o<4;o++){ s+=vn(x*f,y*f)*a; a*=0.5; f*=2.07; } return s/0.9375; };
  const lift=Math.max(0.4,zoom), drag=amt;
  const clamp01=v=>v<0?0:v>1?1:v;
  const gauss=()=>{ const u=Math.random()||1e-9, v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(6.2832*v); };

  // 1 · HAZE: soft strata, denser toward the ceiling (more so with more lift)
  const haze=smoothField(ww,wh,4,(fu,fv)=>{ const u=fu*ww/unit, v=fv*wh/unit, up=1-fv;
    const q=fbm(u*1.1+3.1, v*1.1+7.7);
    const s=fbm((u + drag*0.5*up + 0.7*q)*1.3, (v*2.8 + 0.5*q)*1.3);
    return clamp01((s-0.34)/0.44)*(0.15+0.85*Math.pow(up, 1.4/lift)); });

  // 2 · WISPS: particles carried by curl noise (the curl of a smooth potential
  // swirls without ever converging, as smoke does). Two potentials, blended per
  // particle, so neighbouring strands drift apart as they climb.
  const PA=smoothField(ww,wh,3,(fu,fv)=>fbm(fu*ww/unit*2.2+11.3, fv*wh/unit*2.2+2.9));
  const PB=smoothField(ww,wh,3,(fu,fv)=>fbm(fu*ww/unit*2.2+41.7, fv*wh/unit*2.2+19.1));
  const samp=(F,x,y)=>{ x=x<0?0:x>ww-1.001?ww-1.001:x; y=y<0?0:y>wh-1.001?wh-1.001:y;
    const x0=x|0, y0=y|0, tx=x-x0, ty=y-y0, k=y0*ww+x0;
    return (F[k]*(1-tx)+F[k+1]*tx)*(1-ty)+(F[k+ww]*(1-tx)+F[k+ww+1]*tx)*ty; };
  // three layers by age: fresh smoke is crisp, older smoke has diffused —
  // each layer is softened by its own amount before they are added
  const WL=[new Float32Array(N), new Float32Array(N), new Float32Array(N)];
  let W=WL[0];
  const splat=(x,y,a)=>{ if(!(x>=0 && y>=0 && x<ww-1 && y<wh-1)) return; const x0=x|0, y0=y|0, tx=x-x0, ty=y-y0, k=y0*ww+x0;
    W[k]+=a*(1-tx)*(1-ty); W[k+1]+=a*tx*(1-ty); W[k+ww]+=a*(1-tx)*ty; W[k+ww+1]+=a*tx*ty; };
  const e=1.5, gk=unit/(2*e)*0.55, ds=0.8;
  const curl=(x,y,ph)=>{
    const gx=(samp(PA,x+e,y)-samp(PA,x-e,y))*(1-ph)+(samp(PB,x+e,y)-samp(PB,x-e,y))*ph;
    const gy=(samp(PA,x,y+e)-samp(PA,x,y-e))*(1-ph)+(samp(PB,x,y+e)-samp(PB,x,y-e))*ph;
    return [gy*gk, -gx*gk]; };
  const sources=3+Math.floor(Math.random()*4);
  for(let s=0;s<sources;s++){
    const sx=ww*(0.08+Math.random()*0.84), sy=wh*(0.6+Math.random()*0.45), strength=0.6+Math.random()*0.6;
    const P=Math.round(150*strength);
    for(let p=0;p<P;p++){
      let x=sx+gauss()*unit*0.0025, y=sy+gauss()*unit*0.002;
      const ph=Math.random(), life=unit*(0.45+Math.random()*0.9)*lift, keep=unit*0.5*lift;
      for(let t=0;t<life;t+=ds){
        const up=1-y/wh, age=t/(unit*0.08), turb=Math.min(2.2,age*age);   // laminar at first, then breaking up
        const [cx,cy]=curl(x,y,ph);
        const vx=cx*turb + drag*0.5*(0.25+up), vy=cy*turb - lift;
        // and it diffuses: each strand spreads as it goes (a random walk)
        const m=Math.hypot(vx,vy)||1, dif=ds*0.4*Math.min(1,age); x+=vx/m*ds+gauss()*dif; y+=vy/m*ds+gauss()*dif;
        W=WL[t<unit*0.1?0:t<unit*0.3?1:2];
        splat(x, y, 0.045*strength*Math.exp(-t/keep)*Math.min(1, t/(unit*0.02)));
        if(y<-2 || x<-ww*0.2 || x>ww*1.2) break;
      }
    }
  }
  // 3 · SMOKE RINGS: a torus seen from a little below — denser on its near
  // side, wobbling, frayed by the same curls — with a wake trailing beneath
  const rings = Math.random()<0.2 ? 0 : 1+Math.floor(Math.random()*2.2);
  for(let r=0;r<rings;r++){
    const cx=ww*(0.15+Math.random()*0.7), cy=wh*(0.12+Math.random()*0.55), R=unit*(0.05+Math.random()*0.06);
    const sq=0.3+Math.random()*0.25, rot=(Math.random()-0.5)*0.5, tube=R*(0.2+Math.random()*0.1), ph=Math.random()*6.283;
    const cr=Math.cos(rot), sr=Math.sin(rot), n=Math.round(2*Math.PI*R*tube*5); W=WL[1];
    for(let k=0;k<n;k++){
      const t=Math.random()*6.2832, wob=1+0.07*Math.sin(3*t+ph)+0.04*Math.sin(5*t+2*ph);
      const rr=R*wob+gauss()*tube*0.5, X=Math.cos(t)*rr, Y=Math.sin(t)*rr*sq+gauss()*tube*0.35;
      let x=cx+X*cr-Y*sr, y=cy+X*sr+Y*cr;
      const [fx,fy]=curl(x,y,0.5); x+=fx*tube*0.12; y+=fy*tube*0.12;
      splat(x, y, 0.03*(0.7+0.3*Math.sin(t)));
    }
    for(let j=0;j<18;j++){                                   // the wake
      const t=Math.PI*(0.15+Math.random()*0.7), ph2=Math.random();
      let x=cx+Math.cos(t)*R*cr-Math.sin(t)*R*sq*sr, y=cy+Math.cos(t)*R*sr+Math.sin(t)*R*sq*cr;
      for(let s=0;s<R*1.8;s+=ds){
        const [vx0,vy0]=curl(x,y,ph2), vx=vx0*0.8+(cx-x)*0.004, vy=vy0*0.8+lift*0.6, m=Math.hypot(vx,vy)||1;
        x+=vx/m*ds; y+=vy/m*ds; splat(x, y, 0.035*(1-s/(R*1.8)));
      }
    }
  }
  // soften each layer: smoke never has a hard edge, and spreads as it ages
  const boxBlur=(F,R)=>{ const tmp=new Float32Array(N), n=2*R+1;
    for(let y=0;y<wh;y++){ const r=y*ww; let s=0; for(let x=-R;x<=R;x++) s+=F[r+Math.min(ww-1,Math.max(0,x))];
      for(let x=0;x<ww;x++){ tmp[r+x]=s/n; s+=F[r+Math.min(ww-1,x+R+1)]-F[r+Math.max(0,x-R)]; } }
    for(let x=0;x<ww;x++){ let s=0; for(let y=-R;y<=R;y++) s+=tmp[Math.min(wh-1,Math.max(0,y))*ww+x];
      for(let y=0;y<wh;y++){ F[y*ww+x]=s/n; s+=tmp[Math.min(wh-1,y+R+1)*ww+x]-tmp[Math.max(0,y-R)*ww+x]; } } };
  const soft=[1, Math.max(1,Math.round(unit*0.003)), Math.max(2,Math.round(unit*0.007))];
  for(let l=0;l<3;l++){ boxBlur(WL[l], soft[l]); if(l) boxBlur(WL[l], soft[l]); }
  const Wb=new Float32Array(N); for(let i=0;i<N;i++) Wb[i]=WL[0][i]+WL[1][i]+WL[2][i];
  const D=new Float32Array(N);
  for(let i=0;i<N;i++) D[i]=1-Math.exp(-1.7*(haze[i]*0.5 + Wb[i]));

  // 4 · LIGHT: a shaft from the dial's direction, through the room
  // (dx, dy) points toward the light, as the dial's handle does
  const ang=((light==null?315:light)-90)*Math.PI/180, dx=Math.cos(ang), dy=Math.sin(ang), nx=-dy, ny=dx;
  const off=(Math.random()-0.5)*0.5, ox=ww/2+nx*off*unit, oy=wh/2+ny*off*unit, bw0=unit*(0.13+Math.random()*0.08);
  const streak=Math.random()*100;
  const beamAt=(x,y)=>{ const px=x-ox, py=y-oy, along=px*dx+py*dy, across=Math.abs(px*nx+py*ny);
    const bw=bw0*(1-0.25*along/unit), q=across/bw;                // wider as it travels from the light
    // the shaft has streaks along it, where the dust is thicker
    return 1/(1+q*q*q*q*q*q) * (0.8+0.2*vn(across/unit*14+streak, along/unit*0.7)); };
  const B=new Float32Array(N);
  if(dust>0) for(let y=0;y<wh;y++) for(let x=0;x<ww;x++) B[y*ww+x]=beamAt(x,y);
  const st=unit*0.012;
  const small=document.createElement('canvas'); small.width=ww; small.height=wh;
  const sctx=small.getContext('2d', CPU); const img=sctx.createImageData(ww,wh), d=img.data;
  for(let y=0;y<wh;y++) for(let x=0;x<ww;x++){
    const i=y*ww+x, s0=D[i];
    let val=128, vr=128, vg=128, vb=128;
    if(s0>0.002 || B[i]>0.01){
      // light reaching this point through the smoke between it and the light
      let tau=0; for(let k=1;k<=8;k++) tau+=samp(D, x+dx*st*k, y+dy*st*k);
      const T=Math.exp(-0.35*tau);
      const toward=samp(D, x+dx*1.5, y+dy*1.5), rim=clamp01((s0-toward)*5)*0.25;   // the edge that faces the light
      const lit=s0*(0.5+0.5*T)*(1+2.4*dust*B[i]) + rim*s0;
      // brightness rolls off softly instead of clipping where the shaft is full of smoke
      val=128 + 127*(1-Math.exp(-(118*lit + 48*dust*B[i])/127)) - 22*s0*(1-T);
      if(M3){
        // MATERIAL: the light in the shaft takes the Highlight hue, smoke in its
        // own shadow the Shade hue; the rest of the smoke stays as it is
        const own=118*s0*(0.5+0.5*T) + rim*s0*118, all=118*lit + 48*dust*B[i], fb=all>0 ? Math.max(0, (all-own)/all) : 0;
        const rolled=127*(1-Math.exp(-all/127)), dark=22*s0*(1-T);
        const ch=c=>128 + rolled*((1-fb) + fb*M3.hi[c]) - dark*Math.max(0, 1 + (1 - M3.sh[c])*0.7);
        vr=ch(0); vg=ch(1); vb=ch(2);
      }
    }
    const q=i*4;
    if(M3){ d[q]=vr<0?0:vr>255?255:vr; d[q+1]=vg<0?0:vg>255?255:vg; d[q+2]=vb<0?0:vb>255?255:vb; }
    else d[q]=d[q+1]=d[q+2]=val<0?0:val>255?255:val;
    d[q+3]=255;
  }
  sctx.putImageData(img,0,0);
  ctx.imageSmoothingEnabled=true; ctx.drawImage(small,0,0,w,h);

  // 5 · MOTES, at full resolution: dust drifting everywhere, seen only where
  // the shaft catches it; a few float near the lens, large and out of focus
  if(dust>0.01){
    // motes catch the shaft's light: its Highlight hue, when there is one
    const MC = M3 ? (()=>{ const m=Math.max(...M3.hi); return M3.hi.map(v=>Math.round(255*v/m)).join(','); })() : '255,255,255';
    const n=Math.round(canonArea(w,h)/(3072*3072)*3200*dust);
    for(let k=0;k<n;k++){
      const x=Math.random()*w, y=Math.random()*h, b=Math.pow(beamAt(x/div, y/div), 1.5), near=Math.random()<0.1, gl=Math.random();
      if(b<0.03 && Math.random()>0.15) continue;
      const a=(0.06+0.94*b)*(0.4+0.6*gl);
      if(near){
        const r=cpx(6+Math.random()*14), g=ctx.createRadialGradient(x,y,0,x,y,r);
        g.addColorStop(0,`rgba(${MC},${0.2*a})`); g.addColorStop(0.7,`rgba(${MC},${0.14*a})`); g.addColorStop(1,`rgba(${MC},0)`);
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
      } else {
        ctx.fillStyle=`rgba(${MC},${0.85*a})`; ctx.beginPath(); ctx.arc(x,y,cpx(0.7+Math.random()*1.6),0,Math.PI*2); ctx.fill();
      }
    }
  }
  return c;
}

/**
 * Deep Field's matter map: where the stuff of a galaxy is. A band at a random
 * angle and offset, a few clusters that prefer the band, and noise. Built from
 * the FIRST random draws, so the nebula and the stars — drawn as separate
 * layers under the same seed — rebuild the identical map: clouds gather where
 * the stars are, and the voids between clouds are starless.
 * Returns density(u, v) in 0..1, u and v across the page.
 */
function buildMatterMap(){
  const bandAngle = Math.random()*Math.PI, bandOff = (Math.random()-0.5)*0.5;
  const bandWidth = 0.13 + Math.random()*0.12, bandStrength = 0.55 + Math.random()*0.35;
  const ca = Math.cos(bandAngle), sa = Math.sin(bandAngle);
  const clusters = [];
  const nc = 4 + Math.floor(Math.random()*4);
  for(let i = 0; i < nc; i++){
    const t = (Math.random()-0.5)*1.3, off = bandOff + (Math.random()-0.5)*bandWidth*1.8;
    clusters.push({ x: 0.5 + ca*t - sa*off, y: 0.5 + sa*t + ca*off, r: 0.035 + Math.random()*0.08, s: 0.5 + Math.random()*0.8 });
  }
  const grids = []; let amp = 1, maxA = 0;
  for(let o = 0; o < 6; o++){
    const f = 2.5*Math.pow(2, o), g = Math.max(2, Math.round(f) + 1);
    grids.push({ grid: makeNoiseGrid(g, g), g, f, amp }); maxA += amp; amp *= 0.55;
  }
  const noise = (u, v) => { let t = 0; for(const o of grids) t += sampleNoiseGrid(o.grid, o.g, o.g, u*o.f, v*o.f)*o.amp; return t/maxA; };
  const clusterAt = (u, v) => { let c = 0; for(const k of clusters){ const q = ((u-k.x)**2 + (v-k.y)**2)/(k.r*k.r); c += k.s*Math.exp(-q); } return c; };
  const density = (u, v) => {
    const across = -sa*(u-0.5) + ca*(v-0.5) - bandOff;
    const band = bandStrength*Math.exp(-(across*across)/(2*bandWidth*bandWidth));
    const n = noise(u, v);
    return Math.max(0, Math.min(1, (0.32*n + 0.45*band + 0.35*clusterAt(u, v))*(0.55 + 0.9*n) - 0.07));
  };
  return { density, clusterAt, noise, clusters };
}

export function genAstralFog(w,h,amt,zoom,light,tint,form){
  amt = (amt==null?1:amt);
  const M = buildMatterMap();                 // FIRST: the same map the stars use
  const neb = tint ? parseHex(tint) : null;
  const workDiv = canonDiv(4);
  const workW = Math.max(24, Math.round(w/workDiv)), workH = Math.max(24, Math.round(h/workDiv));
  const small = document.createElement('canvas'); small.width = workW; small.height = workH;
  const sctx = small.getContext('2d', CPU), img = sctx.createImageData(workW, workH), d = img.data;
  // clouds follow the matter, lit from within where the clusters are — the
  // stars illuminate the gas around them — with fine wisps through it. All of
  // it is smooth, so it is sampled on a lattice and blended (smoothField).
  const NEB = smoothField(workW, workH, 3, (u, v) => {
    const dens = M.density(u, v), glow = M.clusterAt(u, v);
    const wisp = 0.75 + 0.5*M.noise(u*3.3 + 7.1, v*3.3 + 2.9);
    return Math.min(1, Math.pow(dens, 1.25)*wisp + 0.35*Math.min(1, glow)*dens);
  });
  for(let py = 0; py < workH; py++) for(let px = 0; px < workW; px++){
    const density = NEB[py*workW + px];
    const val = 128 + (75 - 128 + density*150) * amt;
    const i = (py*workW + px)*4;
    if(neb){
      const t = Math.max(0, Math.min(1, (val - 128) / 127));
      d[i] = val + (neb.r - 128)*t; d[i+1] = val + (neb.g - 128)*t; d[i+2] = val + (neb.b - 128)*t;
    } else { d[i] = val; d[i+1] = val; d[i+2] = val; }
    d[i+3] = 255;
  }
  sctx.putImageData(img, 0, 0);
  const full = document.createElement('canvas'); full.width = w; full.height = h;
  const fctx = full.getContext('2d', CPU);
  fctx.imageSmoothingEnabled = true; fctx.drawImage(small, 0, 0, w, h);
  return full;
}

export function genAstralStars(w,h,accent1,accent2,amt,zoom,form){
  amt = (amt==null?1:amt);
  const M = buildMatterMap();                 // FIRST: the same map the nebula uses
  const atm = Math.max(0, Math.min(1, form==null ? 0.2 : form));
  const full = document.createElement('canvas'); full.width = w; full.height = h;
  const fctx = full.getContext('2d', CPU);
  const A1 = parseHex(accent1 || '#d9a6b3'), A2 = parseHex(accent2 || '#9B7FE8');
  // Stars as LIGHT, not dots: every star a soft glow sized by its brightness,
  // coloured by temperature (blue-white to orange), the brightest with the
  // six spikes of a space telescope. ATMOSPHERE: 0 is deep space, crisp; up
  // the scale, starlight twinkles, splits into colour at the edges, dims
  // toward the horizon, and the sky picks up airglow.
  const TEMPS = [[175,198,255],[214,226,255],[255,250,242],[255,236,204],[255,206,164]];
  const colourOf = () => { const t = TEMPS[Math.floor(Math.pow(Math.random(), 0.9)*TEMPS.length)], a = Math.random() < 0.5 ? A1 : A2;
    return [t[0]*0.78 + a.r*0.22, t[1]*0.78 + a.g*0.22, t[2]*0.78 + a.b*0.22]; };
  const n = Math.round(canonArea(w,h)/2125 * amt);
  const unit = Math.min(w, h);
  const glowAt = (x, y, r, c, a) => {
    const g = fctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`);
    g.addColorStop(0.22, `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a*0.42})`);
    g.addColorStop(1, `rgba(${c[0]|0},${c[1]|0},${c[2]|0},0)`);
    fctx.fillStyle = g; fctx.beginPath(); fctx.arc(x, y, r, 0, Math.PI*2); fctx.fill();
  };
  for(let i = 0; i < n; i++){
    // where the matter is: a share born inside the clusters, the rest accepted
    // by density, so the voids stay dark
    let x, y;
    if(Math.random() < 0.3){
      const k = M.clusters[Math.floor(Math.random()*M.clusters.length)];
      const r = k.r*Math.sqrt(-2*Math.log(Math.max(1e-6, Math.random())))*0.7, a = Math.random()*Math.PI*2;
      x = (k.x + Math.cos(a)*r)*w; y = (k.y + Math.sin(a)*r)*h;
    } else {
      let tries = 0;
      do { x = Math.random()*w; y = Math.random()*h; tries++; }
      while(tries < 8 && Math.random() > 0.05 + 0.95*Math.pow(M.density(x/w, y/h), 1.1));
    }
    let b = Math.pow(Math.random(), 3.2);                     // most stars are faint
    b *= 1 + atm*(Math.random() - 0.5)*0.9;                   // twinkle
    b *= 1 - atm*0.7*Math.pow(Math.max(0, y/h), 2.4);         // dimmer toward the horizon
    b *= 1 - atm*0.4;                                          // and dimmer everywhere through thick air
    if(b <= 0.01) continue;
    const c = colourOf();
    const core = cpx(0.7 + b*2.6) * (1 + atm*0.35);           // seeing blurs a little
    const halo = core*(2.6 + b*4.5);
    if(atm > 0.15 && b > 0.35){
      // the atmosphere splits bright starlight at the edges
      const dx = cpx(0.8 + b*3)*atm;
      fctx.globalCompositeOperation = 'lighter';
      glowAt(x + dx, y, core*1.6, [255, 80, 80], 0.32*atm);
      glowAt(x - dx, y, core*1.6, [80, 130, 255], 0.32*atm);
      fctx.globalCompositeOperation = 'source-over';
    }
    glowAt(x, y, halo, c, Math.min(1, 0.35 + b*0.75));
    glowAt(x, y, core, [Math.min(255, c[0] + 40), Math.min(255, c[1] + 40), Math.min(255, c[2] + 40)], 1);
    if(b > 0.8){
      // six diffraction spikes, their length following the star's brightness:
      // the brightest few long, the next size down short — and turbulent air
      // (Atmosphere) smears them shorter
      const len = cpx(3 + 600*Math.pow(b - 0.8, 1.5)) * (1 - atm*0.6);
      fctx.lineCap = 'round';
      for(let s = 0; s < 6; s++){
        const a = (s/6)*Math.PI*2 + Math.PI/2;
        const g = fctx.createLinearGradient(x, y, x + Math.cos(a)*len, y + Math.sin(a)*len);
        g.addColorStop(0, `rgba(${c[0]|0},${c[1]|0},${c[2]|0},0.8)`); g.addColorStop(1, `rgba(${c[0]|0},${c[1]|0},${c[2]|0},0)`);
        fctx.strokeStyle = g; fctx.lineWidth = cpx(0.6 + (b - 0.8)*5);
        fctx.beginPath(); fctx.moveTo(x, y); fctx.lineTo(x + Math.cos(a)*len, y + Math.sin(a)*len); fctx.stroke();
      }
    }
  }
  if(atm > 0.02){
    // airglow low in the sky; past halfway, the warm wash of distant towns
    const g = fctx.createLinearGradient(0, h, 0, h*0.5);
    g.addColorStop(0, `rgba(110,255,170,${0.13*atm})`); g.addColorStop(1, 'rgba(110,255,170,0)');
    fctx.fillStyle = g; fctx.fillRect(0, h*0.5, w, h*0.5);
    if(atm > 0.5){
      const p = (atm - 0.5)*2, g2 = fctx.createLinearGradient(0, h, 0, h*0.78);
      g2.addColorStop(0, `rgba(255,170,95,${0.16*p})`); g2.addColorStop(1, 'rgba(255,170,95,0)');
      fctx.fillStyle = g2; fctx.fillRect(0, h*0.78, w, h*0.22);
    }
  }
  return full;
}

// What Dream Bloom's motes ARE (its Object Shape knob): their outline, as a
// path to fill. 'snowflake' returns false: it is drawn as strokes instead.
const BOKEH_OBJECTS = ['dot', 'petal', 'leaf', 'star', 'snowflake', 'droplet', 'crescent', 'flower'];
// each object's narrowest feature, as a share of its radius (it sets how
// finely the blur must be sampled)
const FEATURE = { dot: 1, petal: 0.5, leaf: 0.4, star: 0.25, snowflake: 0.13, droplet: 0.6, crescent: 0.2, flower: 0.45 };
export function objectPath(ctx, kind, x, y, r, rot){
  const c = Math.cos(rot), s = Math.sin(rot), P = (u, v) => [x + u*c - v*s, y + u*s + v*c];
  const poly = pts => { ctx.beginPath(); pts.forEach((p, i) => { const q = P(p[0], p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); };
  const curve = (n, f) => { const pts = []; for(let k = 0; k <= n; k++){ const t = k/n*Math.PI*2; pts.push(f(t)); } poly(pts); };
  switch(kind){
    case 'petal':    curve(40, t => [Math.sin(t)*r*0.55*Math.pow(Math.abs(Math.sin(t/2)), 0.6), -Math.cos(t)*r]); return true;
    case 'leaf':     curve(40, t => [Math.sin(t)*r*0.42, -Math.cos(t)*r*(1 + 0.08*Math.sin(t))]); return true;
    case 'star':     { const pts = []; for(let k = 0; k < 8; k++){ const a = k*Math.PI/4, rr = k % 2 ? r*0.28 : r; pts.push([Math.sin(a)*rr, -Math.cos(a)*rr]); } poly(pts); return true; }
    case 'droplet':  curve(40, t => { const q = Math.sin(t/2); return [Math.sin(t)*r*0.62*q, (-Math.cos(t)*r*0.75) + r*0.2]; }); return true;
    case 'crescent': { const q = P(r*0.38, -r*0.1); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.arc(q[0], q[1], r*0.82, 0, Math.PI*2, true); return true; }
    case 'flower':   curve(60, t => { const rr = r*(0.55 + 0.45*Math.abs(Math.cos(t*2.5))); return [Math.sin(t)*rr, -Math.cos(t)*rr]; }); return true;
    case 'snowflake':{ ctx.beginPath(); for(let k = 0; k < 6; k++){ const a = k*Math.PI/3, e = P(Math.sin(a)*r, -Math.cos(a)*r), o = P(0, 0);
                       ctx.moveTo(o[0], o[1]); ctx.lineTo(e[0], e[1]);
                       for(const d of [-0.55, 0.55]){ const m = P(Math.sin(a)*r*0.58, -Math.cos(a)*r*0.58), b = P(Math.sin(a + d)*r*0.82, -Math.cos(a + d)*r*0.82); ctx.moveTo(m[0], m[1]); ctx.lineTo(b[0], b[1]); } }
                       return false; }
    default:         ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); return true;
  }
}
// a colour's hue turned by `deg` degrees (in RGB, about the grey axis)
function hueTurn(rgb, deg){
  const a = deg*Math.PI/180, c = Math.cos(a), s = Math.sin(a), k = 1/3, q = Math.sqrt(k);
  const m = [c + (1 - c)*k, k*(1 - c) - q*s, k*(1 - c) + q*s];
  const [r, g, b] = rgb, cl = v => Math.max(0, Math.min(255, v));
  return [cl(r*m[0] + g*m[1] + b*m[2]), cl(r*m[2] + g*m[0] + b*m[1]), cl(r*m[1] + g*m[2] + b*m[0])];
}

// An aperture's outline, for bokeh: f runs round (0) → 7 blades (0.25) →
// 6 (0.5) → 5 (0.75) → a heart (1), easing between neighbours.
// The aperture's outline as points: the same geometry both draws the disc and
// decides which sample points lie inside it, so the two never disagree.
function apertureOutline(x, y, r, f, rot){
  const pts = [];
  if(f >= 0.875){                                   // the heart, a novelty filter: two cubic Béziers
    const k = Math.min(1, (f - 0.875)/0.125), s = r*1.05, c = Math.cos(rot*0.15), sn = Math.sin(rot*0.15);
    const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0], u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]]; };
    const curves = [[[0, s*0.9], [-s*(1.2+0.2*k), s*0.05], [-s*0.6, -s*1.05], [0, -s*0.38]],
                    [[0, -s*0.38], [s*0.6, -s*1.05], [s*(1.2+0.2*k), s*0.05], [0, s*0.9]]];
    for(const [p0, p1, p2, p3] of curves) for(let i = 0; i < 36; i++){
      const [u, v] = bez(p0, p1, p2, p3, i/36); pts.push([x + u*c - v*sn, y + u*sn + v*c]); }
    return pts;
  }
  const seg = Math.min(2, Math.floor(f/0.25)), t = (f - seg*0.25)/0.25;     // between which ticks
  const blades = [0, 7, 6, 5][seg + 1] || 5, round = seg === 0 ? 1 - t : 0.18*(1 - t) + 0.08;
  for(let k = 0; k < 72; k++){
    const a = (k/72)*Math.PI*2, sector = (Math.PI*2)/blades;
    const local = ((a - rot) % sector + sector) % sector - sector/2;
    const poly = Math.cos(sector/2)/Math.cos(local);                 // the polygon's radius at this angle
    const rr = r*(round + (1 - round)*poly)*(1 - 0.05*(1 - round));
    pts.push([x + Math.cos(a)*rr, y + Math.sin(a)*rr]);
  }
  return pts;
}
function aperturePath(ctx, x, y, r, f, rot){
  const pts = apertureOutline(x, y, r, f, rot);
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
}
// inside a polygon? (a ray cast to the right crosses its edges an odd number of times)
function insidePolygon(pts, x, y){
  let inside = false;
  for(let i = 0, j = pts.length - 1; i < pts.length; j = i++){
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if((yi > y) !== (yj > y) && x < (xj - xi)*(y - yi)/(yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export function genBokeh(w,h,amt,zoom,form,shapeKnob,hueSpread,tint){
  // the aperture's shape, and one rotation for every disc (a lens has one aperture)
  const shape = Math.max(0, Math.min(1, form || 0)), rot = Math.random()*Math.PI*2;
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  // OBJECT SHAPE: what the motes are (the nearest mark); COLOR VARIATION: each
  // mote's hue turned at random within this spread, around Light Hue
  const obj = BOKEH_OBJECTS[Math.max(0, Math.min(7, Math.round((shapeKnob || 0)/100*7)))];
  const spread = Math.max(0, Math.min(180, hueSpread || 0));
  const baseHex = (tint && !/^#?f{6}$/i.test(tint.replace('#','')) ) ? tint : '#ffc7da';
  const B = parseHex(baseHex), base = [B.r, B.g, B.b];
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const ctx = c.getContext('2d', CPU);
  ctx.fillStyle = 'rgb(128,128,128)'; ctx.fillRect(0,0,w,h);

  // ---- a physically based lens ----
  // A thin lens: 50 mm at f/1.8, a 24 mm sensor height mapped onto the page.
  // Every mote sits at a real distance (30 cm to 6 m, more of them far, as in
  // a real volume of air); FOCAL PLANE sets the focus distance on that scale.
  // The circle of confusion is the thin-lens one,
  //     c = A·f·|S2 − S1| / (S2·(S1 − f)),
  // and a mote's image size is its real size times the magnification.
  const unit = Math.min(w,h), F = 50, A = F/1.8, Dn = 300, Df = 6000, pxPerMm = unit/24;
  const dist = z => Dn*Math.pow(Df/Dn, z);
  const zf = Math.max(0, Math.min(1, Math.log(zoom/0.25) / Math.log(16)));   // 25%..400% → near..far
  const S1 = dist(zf);
  const cocR = S2 => 0.5*A*F*Math.abs(S2 - S1)/(S2*(S1 - F))*pxPerMm;      // blur radius, px
  const imgR = (mm, S2) => mm*F/(S2 - F)*pxPerMm;                          // image radius, px

  // ---- the aperture, sampled: blur is the object convolved with it ----
  // Points inside the aperture's real shape (round, bladed or heart), tested
  // against its own outline; shuffled so any prefix covers it evenly.
  const outline = apertureOutline(0, 0, 1, shape, rot);
  const samples = [];
  for(let gy = -1; gy <= 1.0001; gy += 2/13) for(let gx = -1; gx <= 1.0001; gx += 2/13){
    const jx = gx + (Math.random() - 0.5)*0.12, jy = gy + (Math.random() - 0.5)*0.12;
    if(insidePolygon(outline, jx, jy)) samples.push([jx, jy, jx*jx + jy*jy]);
  }
  for(let i = samples.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [samples[i], samples[j]] = [samples[j], samples[i]]; }

  // ---- the motes: light sources, brighter than white ----
  // Intensity can exceed what a pixel holds: in focus a bright mote clips to
  // white, as on a real sensor; defocused, the same light spreads over its
  // disc and dims with its area. That is why real bokeh highlights stay
  // visible while staying soft.
  const n = Math.max(20, Math.round(canonArea(w,h)/9000 * amt));
  const motes = [];
  for(let i=0;i<n;i++){
    const z = Math.sqrt(Math.random());
    motes.push({ x: Math.random()*w, y: Math.random()*h, z, S2: dist(z),
                 // dots are specular glints: many dim, a few far brighter than white.
                 // Leaves, petals and the like are diffusely lit surfaces — about as
                 // bright as white paper — and snowflakes a little more, for the ice.
                 I: obj === 'dot' ? 1.5 + 180*Math.pow(Math.random(), 6)
                  : obj === 'snowflake' ? 0.6 + 2.6*Math.pow(Math.random(), 3)
                  : 0.45 + 1.4*Math.pow(Math.random(), 2),
                 mm: obj === 'dot' ? 0.5 + Math.random()*1.2 : 2.5 + Math.random()*4.5,
                 lum: 200 + Math.random()*55, spin: Math.random()*Math.PI*2, hue: (Math.random() - 0.5)*spread });
  }
  motes.sort((a,b) => b.z - a.z);
  // ---- blurred shapes, made once and shared ----
  // Each is built at a fixed resolution: the object (radius r) convolved with
  // the aperture (radius ratio·r), by summing white copies at the aperture's
  // sample points, weighted for spherical aberration. The canvas has room for
  // the object's full reach plus a margin, so no shape is cut at an edge.
  const shapes = new Map();
  const tintCv = document.createElement('canvas'), tc = tintCv.getContext('2d', CPU);   // a clean canvas for tinting
  function blurShape(ratioB, spinB, behind){
    const key = ratioB + '|' + spinB + '|' + (behind ? 1 : 0);
    if(shapes.has(key)) return shapes.get(key);
    const ratio = Math.pow(2, ratioB/2), reach = 46;                         // the shape's radius on its canvas
    const r0 = reach/(1.3 + ratio), coc0 = r0*ratio;
    // sample spacing near a pixel, so the copies merge into a smooth blur
    const spacing = coc0*2/13, k = Math.min(1, 1.25/Math.max(1e-3, spacing));
    const rk = r0*k, ck = coc0*k, size = Math.ceil(2*(rk*1.3 + ck) + 8), cc = size/2;
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    const g = cv.getContext('2d', CPU);
    g.globalCompositeOperation = 'lighter'; g.fillStyle = '#fff'; g.strokeStyle = '#fff';
    const sa = behind ? 0.7 : -0.6;
    const feature = rk*(FEATURE[obj] || 1);
    const need = Math.max(8, Math.ceil(samples.length/Math.max(1, Math.pow(feature/Math.max(spacing*k, 1e-3), 2))));
    const pick = samples.slice(0, Math.min(samples.length, need)).map(([u, v, rr]) => [u, v, Math.max(0.05, 1 + sa*(rr - 0.5))]);
    const wsum = pick.reduce((a2, p) => a2 + p[2], 0) || 1;
    const spin = spinB*Math.PI/3;
    for(const [u, v, wt] of pick){
      g.globalAlpha = Math.min(1, wt/wsum);
      const px = cc + u*ck, py = cc + v*ck;
      if(obj === 'dot'){ g.beginPath(); g.arc(px, py, Math.max(0.6, rk), 0, Math.PI*2); g.fill(); }
      else if(objectPath(g, obj, px, py, Math.max(0.6, rk), spin)) g.fill();
      else { g.lineWidth = Math.max(cpx(0.7)*k, rk*0.14); g.lineCap = 'round'; g.stroke(); }   // a canonical floor, at this canvas's scale
    }
    const out = { canvas: cv, size, r: rk };
    shapes.set(key, out);
    return out;
  }
  const cx0 = w/2, cy0 = h/2, half = Math.hypot(w, h)/2;
  ctx.globalCompositeOperation = 'lighter';                         // light adds, as on a sensor
  for(const m of motes){
    const col = spread > 0 ? hueTurn(base.map(v => v*m.lum/255), m.hue) : [m.lum, m.lum, m.lum];
    const rgb = `${col[0]|0},${col[1]|0},${col[2]|0}`;
    const r = Math.max(cpx(0.6), imgR(m.mm, m.S2)), coc = cocR(m.S2);
    const behind = m.S2 > S1;
    // cat's eye: off-axis, the barrel clips the cone of light — the disc is the
    // aperture intersected with a second, shifted disc
    const ox = (m.x - cx0)/half, oy = (m.y - cy0)/half, cat = 0.55;
    // spherical aberration: behind the focus a brighter rim, in front a brighter
    // centre with a soft edge
    const sa = behind ? 0.7 : -0.6;
    if(coc <= r*0.2){
      // in focus: the object itself, clipped at full white if it is bright
      ctx.globalAlpha = Math.min(1, m.I*0.9); ctx.fillStyle = `rgb(${rgb})`; ctx.strokeStyle = `rgb(${rgb})`;
      if(obj === 'dot'){ ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, Math.PI*2); ctx.fill(); }
      else if(objectPath(ctx, obj, m.x, m.y, r, obj === 'droplet' ? 0 : m.spin)) ctx.fill();
      else { ctx.lineWidth = Math.max(cpx(0.8), r*0.14); ctx.lineCap = 'round'; ctx.stroke(); }
      continue;
    }
    if(obj === 'dot' && coc > r*2.5){
      // a point of light, far out of focus: the convolution IS the aperture,
      // carrying the mote's energy spread over its area (exact, so drawn whole)
      const v = Math.min(1, m.I*(r*r)/(coc*coc));
      const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, coc);
      const k = t => Math.max(0, Math.min(1, v*(1 + sa*(t*t - 0.5))));
      g.addColorStop(0, `rgba(${rgb},${k(0)})`); g.addColorStop(0.5, `rgba(${rgb},${k(0.5)})`);
      g.addColorStop(0.9, `rgba(${rgb},${k(0.9)})`); g.addColorStop(behind ? 0.97 : 0.8, `rgba(${rgb},${k(behind ? 0.97 : 0.8)})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.save();
      ctx.beginPath(); ctx.arc(m.x + ox*cat*coc, m.y + oy*cat*coc, coc*1.05, 0, Math.PI*2); ctx.clip();   // the cat's eye, gently
      ctx.globalAlpha = 1; ctx.fillStyle = g; aperturePath(ctx, m.x, m.y, coc, shape, rot); ctx.fill();
      ctx.restore();
      continue;
    }
    // light too faint to move a pixel by one step, spread this wide, is invisible
    // in the photograph too
    if(m.I*Math.pow(r/(r + coc), 2) < 0.6/255) continue;
    // An extended object (or a point not far out): its blur is the object
    // convolved with the aperture. That SHAPE depends only on how blurred it is
    // relative to its size, its angle, and which side of the focus it lies — so
    // each is made once (blurShape) and shared by every mote that matches;
    // each mote then only scales it, tints it and adds its light.
    const ratioB = Math.max(-5, Math.min(12, Math.round(Math.log2(Math.max(1e-3, coc/r))*2)));
    const spinB = obj === 'droplet' ? 0 : ((Math.round(m.spin/(Math.PI/3)) % 6) + 6) % 6;
    const S = blurShape(ratioB, spinB, behind);
    const scale = r / S.r, dw = S.size*scale;
    // the mote's colour: the shared shape is white; tint it on a clean canvas
    if(tintCv.width < S.size || tintCv.height < S.size){ tintCv.width = Math.max(tintCv.width, S.size); tintCv.height = Math.max(tintCv.height, S.size); }
    tc.globalCompositeOperation = 'source-over'; tc.globalAlpha = 1; tc.clearRect(0, 0, tintCv.width, tintCv.height);
    tc.drawImage(S.canvas, 0, 0);
    tc.globalCompositeOperation = 'source-in'; tc.fillStyle = `rgb(${rgb})`; tc.fillRect(0, 0, S.size, S.size);
    ctx.save();
    // cat's eye, gently: off-axis the barrel clips the cone of light
    ctx.beginPath(); ctx.arc(m.x + ox*cat*coc, m.y + oy*cat*coc, (coc + r*1.3)*1.05, 0, Math.PI*2); ctx.clip();
    // light adds; a mote brighter than white is laid on more than once, so
    // it clips the way a sensor does
    const times = Math.max(1, Math.ceil(m.I));
    ctx.globalAlpha = Math.min(1, m.I/times);
    for(let t = 0; t < times; t++) ctx.drawImage(tintCv, 0, 0, S.size, S.size, m.x - dw/2, m.y - dw/2, dw, dw);
    ctx.restore();
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  return c;
}

export function genEmbers(w,h,accent1,accent2,amt,zoom,form){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const ctx = c.getContext('2d', CPU);
  const A = mixHex(accent1 || '#E0526F', accent1 || '#E0526F', 0);
  const B = mixHex(accent2 || '#9B7FE8', accent2 || '#9B7FE8', 0);

  // Burning fragments raining down. Each spark is BALLISTIC: flung out, then
  // bent by gravity into a falling curve — never a straight needle. The head
  // is white-hot; the trail cools through the ember colour to nothing behind
  // it. Some sparks burst partway and fork into smaller ones, and fine hot
  // dust hangs between them.
  const unit = Math.min(w,h);
  // a fifth of the original count: sparks read better sparse, and each one
  // is a trail of calls
  const n = Math.max(4, Math.round(canonArea(w,h)/130000 * amt));
  const g = unit * 0.9;                                   // gravity, px per unit time²
  // HUE DRIFT: each spark's colour may stray this far around its ember hue;
  // bigger embers burn more chaotically — their paths sputter and swerve
  const drift = Math.max(0, Math.min(1, form == null ? 0.1 : form))*140;
  const chaos = Math.max(0, (zoom || 1) - 1)*0.55;
  const stray = c => { if(drift <= 0) return c; const t = hueTurn([c.r, c.g, c.b], (Math.random() - 0.5)*drift); return { r: t[0]|0, g: t[1]|0, b: t[2]|0 }; };
  const trail = (x, y, vx, vy, len, width, col, depth) => {
    const steps = 22, dt = len / steps;
    let px = x, py = y, pvx = vx, pvy = vy;
    const pts = [[px, py]];
    for(let s=0;s<steps;s++){
      if(chaos > 0){ pvx += (Math.random() - 0.5)*chaos*unit*0.9; pvy += (Math.random() - 0.5)*chaos*unit*0.6; }
      pvy += g*dt; px += pvx*dt; py += pvy*dt; pts.push([px, py]);
    }
    // the trail: thin and cool at the tail, thickening toward the hot head
    for(let s=1;s<pts.length;s++){
      const f = s / (pts.length-1);                        // 0 tail -> 1 head
      ctx.globalAlpha = 0.08 + 0.7*f*f;
      ctx.strokeStyle = `rgb(${Math.round(col.r + (255-col.r)*f*f)},${Math.round(col.g + (255-col.g)*f*f*0.8)},${Math.round(col.b + (255-col.b)*f*f*0.6)})`;
      ctx.lineWidth = Math.max(cpx(0.5), width*(0.25 + 0.9*f));
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(pts[s-1][0], pts[s-1][1]); ctx.lineTo(pts[s][0], pts[s][1]); ctx.stroke();
    }
    const [hx, hy] = pts[pts.length-1];
    // the white-hot head, with a glow of its own colour
    const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, width*4);
    glow.addColorStop(0, `rgba(255,255,255,0.95)`);
    glow.addColorStop(0.3, `rgba(${col.r},${col.g},${col.b},0.55)`);
    glow.addColorStop(1, `rgba(${col.r},${col.g},${col.b},0)`);
    ctx.globalAlpha = 1; ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(hx, hy, width*4, 0, Math.PI*2); ctx.fill();
    // a burst: the spark forks into smaller ones from where its head is now
    if(depth < 1 && Math.random() < 0.28){
      const kids = 2 + Math.floor(Math.random()*3);
      for(let k=0;k<kids;k++){
        const a = Math.random()*Math.PI*2, sp = unit*(0.08 + Math.random()*0.14);
        trail(hx, hy, Math.cos(a)*sp, Math.sin(a)*sp - unit*0.05, len*0.45, width*0.55, col, depth+1);
      }
    }
  };

  for(let i=0;i<n;i++){
    const col = stray(Math.random() < 0.6 ? A : B);
    // launched from anywhere above and across the page, mostly sideways
    const x = Math.random()*w*1.2 - w*0.1, y = Math.random()*h*1.1 - h*0.25;
    const a = -Math.PI/2 + (Math.random()-0.5)*Math.PI*1.3;
    const sp = unit*(0.12 + Math.random()*0.35);
    const len = (0.25 + Math.random()*0.55) * (0.6 + zoom*0.4);
    trail(x, y, Math.cos(a)*sp, Math.sin(a)*sp, len, unit*0.0022*zoom*(0.6 + Math.random()), col, 0);
  }
  // fine hot dust between the sparks
  for(let i=0;i<n*3;i++){
    const col = Math.random() < 0.6 ? A : B;
    ctx.globalAlpha = 0.25 + Math.random()*0.5;
    ctx.fillStyle = `rgb(${Math.min(255,col.r+60)},${Math.min(255,col.g+50)},${Math.min(255,col.b+40)})`;
    ctx.beginPath(); ctx.arc(Math.random()*w, Math.random()*h, unit*0.0011*(0.5+Math.random()), 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  return c;
}

// Flurries: soft round flakes on a transparent canvas (composited with 'lighten' so
// they always read bright regardless of background) — mostly small/sharp, a few
// larger and softer, like flakes drifting slightly out of focus.
export function genSnow(w,h,amt,zoom,light,form,base){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  // SNOW HUE: the flakes' colour (white: as they always were)
  const SC = base ? `${base.r},${base.g},${base.b}` : '255,255,255';
  // WIND blows from where the dial points (here the dial is the wind, not a
  // light) and the flakes fall with it: each streaks along its path while the
  // shutter is open — the nearer and larger, the longer the streak, and the
  // less of its crystal survives. At 0 the air is still, drawn exactly as before.
  const wind = Math.max(0, Math.min(1, form==null ? 0 : form));
  let vx = 0, vy = 1;
  if(wind > 0){
    const a = ((light==null ? 315 : light) - 90) * Math.PI/180;   // (cos a, sin a) points toward the dial's handle: where it blows FROM
    vx = -Math.cos(a)*wind*1.6; vy = -Math.sin(a)*wind*1.6 + 1;      // carried by the wind, and still falling
    const m = Math.hypot(vx, vy) || 1; vx /= m; vy /= m;
  }
  const streakAt = (size) => wind > 0 ? size*wind*(0.9 + size/cpx(7)) : 0;   // snow is slow: short streaks
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d', CPU);
  const count = Math.round(canonArea(w,h)/3200 * amt);
  for(let i=0;i<count;i++){
    const x = Math.random()*w, y = Math.random()*h;
    const roll = Math.random();
    let size, alpha, crystal = false;
    if(roll < 0.25){ size = 0.6+Math.random()*0.5; alpha = 0.3+Math.random()*0.2; }        // distant dust
    else if(roll < 0.55){ size = 1+Math.random()*1.2; alpha = 0.7+Math.random()*0.3; }      // tiny, sharp
    else if(roll < 0.78){ size = 2.5+Math.random()*2.5; alpha = 0.5+Math.random()*0.3; }    // small, soft
    else if(roll < 0.93){ size = 5+Math.random()*4; alpha = 0.35+Math.random()*0.25; crystal = true; }   // medium: in focus, crystalline
    else { size = 9+Math.random()*9; alpha = 0.18+Math.random()*0.2; }                      // rare, large, out of focus
    size *= zoom;
    // sizes above are canonical pixels: the tiny/large decision is made in
    // them, and the flake is drawn at this canvas's scale
    const tiny = size <= 1.3;
    size = cpx(size);

    if(tiny){
      fctx.fillStyle = `rgba(${SC},${alpha})`;
      if(wind > 0){                                             // a speck becomes a short dash
        const L = cpx(1) + cpx(3)*wind;
        fctx.strokeStyle = fctx.fillStyle; fctx.lineWidth = cpx(1); fctx.lineCap = 'round';
        fctx.beginPath(); fctx.moveTo(x, y); fctx.lineTo(x + vx*L, y + vy*L); fctx.stroke();
      } else fctx.fillRect(x,y,cpx(1),cpx(1));
      continue;
    }
    const streak = streakAt(size);
    if(streak > 0){
      // the flake smeared along its path: a soft glow stretched into a streak
      fctx.save(); fctx.translate(x, y); fctx.rotate(Math.atan2(vy, vx)); fctx.scale(1 + streak/size, 1);
      const sg = fctx.createRadialGradient(0,0,0,0,0,size);
      const a2 = alpha/(1 + 0.3*streak/size);                     // the same light spread over a longer path
      sg.addColorStop(0, `rgba(${SC},${a2})`); sg.addColorStop(0.6, `rgba(${SC},${a2*0.5})`); sg.addColorStop(1, 'rgba(${SC},0)');
      fctx.fillStyle = sg; fctx.beginPath(); fctx.arc(0,0,size,0,Math.PI*2); fctx.fill(); fctx.restore();
      if(crystal && wind < 0.35){
        objectPath(fctx, 'snowflake', x, y, size*0.72, Math.random()*Math.PI);
        fctx.strokeStyle = `rgba(${SC},${Math.min(1, alpha*1.5)*(1 - wind/0.35)})`; fctx.lineWidth = Math.max(cpx(0.6), size*0.075); fctx.lineCap = 'round'; fctx.stroke();
      }
      continue;
    }
    const grad = fctx.createRadialGradient(x,y,0,x,y,size);
    grad.addColorStop(0, `rgba(${SC},${alpha})`);
    grad.addColorStop(0.6, `rgba(${SC},${alpha*0.5})`);
    grad.addColorStop(1, `rgba(${SC},0)`);
    fctx.fillStyle = grad;
    fctx.beginPath(); fctx.arc(x,y,size,0,Math.PI*2); fctx.fill();
    // the in-focus flakes show their crystal: six arms with side-branches,
    // inside the glow (tiny specks and the large blurred ones don't)
    if(crystal){
      objectPath(fctx, 'snowflake', x, y, size*0.72, Math.random()*Math.PI);
      fctx.strokeStyle = `rgba(${SC},${Math.min(1, alpha*1.5)})`; fctx.lineWidth = Math.max(cpx(0.6), size*0.075); fctx.lineCap = 'round'; fctx.stroke();
    }
  }
  return full;
}

export function genMagicParticles(w,h,accent1,accent2,amt,zoom,form){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  // CHAOS: 0 gathers the dust into the trails a flight leaves behind; 50 (the
  // default) scatters it, as it always was — drawn exactly as before; up to
  // 100 it bursts, in sprays of streaking shards, sizes and hues gone wild.
  const chaos = Math.max(0, Math.min(1, form==null ? 0.5 : form));
  const order = Math.max(0, 0.5-chaos)*2, wild = Math.max(0, chaos-0.5)*2;
  let sizeK = 1;                                             // a wild hand makes some motes huge, some tiny
  // Knobs rescaled so 100% on both is the look that works: what used to take
  // Size at 485% and Count at 20% — both slider ends — now sits in the middle,
  // with room either way.
  const Z = zoom * 4.85;
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const ctx = c.getContext('2d', CPU);
  const A = mixHex(accent1 || '#E0526F', accent1 || '#E0526F', 0);
  const B = mixHex(accent2 || '#9B7FE8', accent2 || '#9B7FE8', 0);
  const rgb = (col, lift=0) => `rgb(${Math.min(255,col.r+lift)},${Math.min(255,col.g+lift)},${Math.min(255,col.b+lift)})`;

  // Pixie dust, less geometric than it was. Wisps are TAPERED curls — thick
  // in the middle, thinning to hair at both ends, curling as they go — rather
  // than even-width circle arcs; each drops a trail of motes. Sparkles twinkle
  // unevenly: four to six arms, no two the same length, one arm always long.
  const unit = Math.min(w,h);
  const count = Math.round(canonArea(w,h)/42000 * amt);        // 225 at 100% on a 3072 page

  const wisp = (x, y, col, along) => {
    const len = unit*(0.04 + Math.random()*0.07)*Z*sizeK;
    let a = Math.random()*Math.PI*2;
    if(along != null) a = along + (Math.random()-0.5)*0.5;      // on a trail, it follows the flight
    const curl = (Math.random()-0.5)*0.22, curlGrow = (Math.random()-0.5)*0.02;
    const W = unit*0.0022*Z*(0.6 + Math.random())*Math.sqrt(sizeK);
    const steps = 26, pts = [];
    let px = x, py = y, k = curl;
    if(along != null){ k *= 0.35; }                          // calmer on a trail
    for(let s=0;s<=steps;s++){ pts.push([px, py, a]); a += k; k += curlGrow; px += Math.cos(a)*len/steps; py += Math.sin(a)*len/steps; }
    // a filled ribbon, widest at its middle
    const L = [], R = [];
    pts.forEach(([x0,y0,a0], s) => { const t = s/steps, hw = W*Math.sin(t*Math.PI)*(0.4 + 0.6*(1-t));
      L.push([x0 + Math.cos(a0+Math.PI/2)*hw, y0 + Math.sin(a0+Math.PI/2)*hw]);
      R.push([x0 - Math.cos(a0+Math.PI/2)*hw, y0 - Math.sin(a0+Math.PI/2)*hw]); });
    ctx.globalAlpha = 0.55 + Math.random()*0.35; ctx.fillStyle = rgb(col, 40);
    ctx.beginPath(); L.forEach(([x0,y0],i) => i ? ctx.lineTo(x0,y0) : ctx.moveTo(x0,y0));
    for(let i=R.length-1;i>=0;i--) ctx.lineTo(R[i][0], R[i][1]); ctx.closePath(); ctx.fill();
    // motes shaken loose along it
    for(let m=0;m<4;m++){ const [mx,my] = pts[Math.floor(Math.random()*pts.length)];
      ctx.globalAlpha = 0.4 + Math.random()*0.5;
      ctx.beginPath(); ctx.arc(mx + (Math.random()-0.5)*W*8, my + (Math.random()-0.5)*W*8, W*(0.4+Math.random()*0.7), 0, Math.PI*2); ctx.fill(); }
  };
  const sparkle = (x, y, col) => {
    const arms = 4 + Math.floor(Math.random()*3), base = unit*0.009*Z*(0.5 + Math.random())*sizeK;
    const rot = Math.random()*Math.PI, longArm = Math.floor(Math.random()*arms);
    // a soft glow behind
    const g = ctx.createRadialGradient(x, y, 0, x, y, base*1.6);
    g.addColorStop(0, `rgba(${col.r},${col.g},${col.b},0.35)`); g.addColorStop(1, `rgba(${col.r},${col.g},${col.b},0)`);
    ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, base*1.6, 0, Math.PI*2); ctx.fill();
    // the arms: concave, uneven, one long
    ctx.fillStyle = rgb(col, 70); ctx.globalAlpha = 0.9;
    ctx.beginPath();
    for(let k=0;k<arms;k++){
      const a = rot + k/arms*Math.PI*2 + (Math.random()-0.5)*0.25;
      const r = base*(k === longArm ? 1.6 : 0.45 + Math.random()*0.7), wd = base*0.1;
      const tipX = x+Math.cos(a)*r, tipY = y+Math.sin(a)*r;
      const nx = Math.cos(a+Math.PI/2)*wd, ny = Math.sin(a+Math.PI/2)*wd;
      ctx.moveTo(x+nx, y+ny); ctx.quadraticCurveTo(x+Math.cos(a)*r*0.25+nx*0.3, y+Math.sin(a)*r*0.25+ny*0.3, tipX, tipY);
      ctx.quadraticCurveTo(x+Math.cos(a)*r*0.25-nx*0.3, y+Math.sin(a)*r*0.25-ny*0.3, x-nx, y-ny);
    }
    ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, base*0.12, 0, Math.PI*2); ctx.fill();
  };

  // ORDER: the trails — sweeping curves that fade toward their ends
  const trails = [];
  if(order > 0){
    const nt = 2 + Math.floor(Math.random()*3);
    for(let k=0;k<nt;k++){
      const p0=[Math.random()*w, Math.random()*h], p1=[Math.random()*w, Math.random()*h], p2=[Math.random()*w, Math.random()*h];
      const curl=(Math.random()<0.5?-1:1)*(0.5+Math.random()), spread=unit*(0.012+Math.random()*0.02);
      trails.push({ at:t => { const u=1-t, bx=u*u*p0[0]+2*u*t*p1[0]+t*t*p2[0], by=u*u*p0[1]+2*u*t*p1[1]+t*t*p2[1];
        // the end of a trail curls round, as a flight turns
        const e=Math.max(0,(t-0.7)/0.3), r=unit*0.05*e, an=curl*e*Math.PI*2.2;
        return [bx+Math.cos(an)*r-r, by+Math.sin(an)*r]; }, spread });
    }
  }
  for(let i=0;i<count;i++){
    let x = Math.random()*w, y = Math.random()*h, along = null;
    const col = Math.random() < 0.55 ? A : B;
    const roll = Math.random();
    if(order > 0 && Math.random() < order*0.85){
      const T = trails[Math.floor(Math.random()*trails.length)], t = Math.pow(Math.random(), 0.7);
      const [tx, ty] = T.at(t), [ux, uy] = T.at(Math.min(1, t+0.01)), sp = T.spread*(1 - 0.5*t);
      along = Math.atan2(uy-ty, ux-tx);
      // gathered close along the line, thinning to stragglers
      const g = Math.sqrt(-2*Math.log(Math.random()||1e-9))*Math.cos(6.2832*Math.random());
      x = tx - Math.sin(along)*g*sp; y = ty + Math.cos(along)*g*sp;
    }
    if(wild > 0) sizeK = Math.exp((Math.random()-0.5)*2.4*wild);
    if(roll < 0.34) wisp(x, y, col, along);
    else if(roll < 0.52) sparkle(x, y, col);
    else {                                                   // loose dust
      ctx.globalAlpha = 0.3 + Math.random()*0.5; ctx.fillStyle = rgb(col, 50);
      ctx.beginPath(); ctx.arc(x, y, unit*0.0016*Z*(0.4 + Math.random())*sizeK, 0, Math.PI*2); ctx.fill();
    }
  }
  // WILD: bursts — dust thrown outward from a point, streaking as it flies,
  // with a flash at the heart; hues stray toward white and past the accents
  if(wild > 0){
    sizeK = 1;
    const nb = Math.max(1, Math.round(wild*5*Math.sqrt(amt)));
    for(let b=0;b<nb;b++){
      const cx = Math.random()*w, cy = Math.random()*h, R = unit*(0.05+Math.random()*0.1)*Math.sqrt(Z/4.85);
      const n = Math.round((40 + Math.random()*50)*wild);
      for(let k=0;k<n;k++){
        const an = Math.random()*Math.PI*2, d = R*Math.pow(Math.random(), 0.6), len = unit*0.008*Z*(0.4+Math.random())*(0.4+d/R);
        const col = Math.random()<0.5 ? A : B, lift = Math.round(40 + Math.random()*120*wild);
        const x0 = cx+Math.cos(an)*d, y0 = cy+Math.sin(an)*d, x1 = x0+Math.cos(an)*len, y1 = y0+Math.sin(an)*len;
        // a streak: thin, brightest at its head
        const g = ctx.createLinearGradient(x0,y0,x1,y1);
        g.addColorStop(0, `rgba(${col.r},${col.g},${col.b},0)`); g.addColorStop(1, rgb(col, lift));
        ctx.globalAlpha = 0.5 + Math.random()*0.5; ctx.strokeStyle = g; ctx.lineCap = 'round';
        ctx.lineWidth = unit*0.0016*Z*(0.4+Math.random()*0.6);
        ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke();
      }
      if(Math.random() < 0.7) sparkle(cx, cy, Math.random()<0.5 ? A : B);
    }
  }
  ctx.globalAlpha = 1;
  return c;
}

// Light hung in sheets —
// no particle, no edge, just
// the sky leaning down.
export function genAuroraVeil(w,h,amt,zoom,light,tint,tint2,form){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const bloom = Math.max(0, Math.min(1, form==null ? 0 : form));
  const glow = tint ? parseHex(tint) : null;
  // the hem's colour; the same as the curtain's by default, which draws
  // exactly the single-colour veil
  const hem = tint2 ? parseHex(tint2) : glow;
  // two hues BLEND across the whole veil, from the side the dial points to
  // toward the other (here the dial is the blend's direction, not a light);
  // each bright curtain is drawn as light alone, then coloured by that blend
  const twoHues = !!(glow && hem && (glow.r !== hem.r || glow.g !== hem.g || glow.b !== hem.b));
  const c = document.createElement('canvas');
  c.width=w; c.height=h;
  const ctx = c.getContext('2d', CPU);
  let veil = null, vctx = null;
  if(twoHues){ veil = document.createElement('canvas'); veil.width = w; veil.height = h; vctx = veil.getContext('2d', CPU); }
  ctx.fillStyle = '#808080';
  ctx.fillRect(0,0,w,h);

  // The first version stacked slices at 0.045 alpha each, which summed to
  // nothing visible. Curtains are now drawn as filled ribbons with a real
  // vertical falloff, at an opacity that survives compositing.
  const ribbons = Math.max(2, Math.round((6 + Math.random()*5) * amt));
  const curtain = Math.min(1.1, 0.7 * zoom);

  for(let i=0;i<ribbons;i++){
    const baseX = Math.random()*w*1.15 - w*0.075;
    const width = w*(0.035 + Math.random()*0.075);
    const drop  = h*curtain*(0.5 + Math.random()*0.5);
    const wob   = w*(0.03 + Math.random()*0.07);
    const phase = Math.random()*Math.PI*2;
    const bright = Math.random() < 0.75;
    const tone  = bright ? 244 : 28;
    // a tint colours the curtain; without one it stays a value pattern
    const rgb = glow && bright ? `${glow.r},${glow.g},${glow.b}` : `${tone},${tone},${tone}`;

    // vertical falloff: brightest at the top edge, gone by the hem
    // with two hues the curtain shifts colour as it falls, as real auroras do
    const mid = (glow && hem && bright)
      ? `${Math.round(glow.r+(hem.r-glow.r)*0.45)},${Math.round(glow.g+(hem.g-glow.g)*0.45)},${Math.round(glow.b+(hem.b-glow.b)*0.45)}` : rgb;
    const low = (glow && hem && bright) ? `${hem.r},${hem.g},${hem.b}` : rgb;
    // with two hues, a bright curtain goes to the veil layer as white light
    const lay = (twoHues && bright) ? vctx : ctx;
    const fall = lay.createLinearGradient(0, 0, 0, drop);
    const W3 = '255,255,255', inVeil = lay === vctx;
    fall.addColorStop(0,    `rgba(${inVeil ? W3 : rgb},${bright?0.62:0.45})`);
    fall.addColorStop(0.45, `rgba(${inVeil ? W3 : mid},${bright?0.30:0.22})`);
    fall.addColorStop(1,    `rgba(${inVeil ? W3 : low},0)`);

    // the fold: a wavy quad traced down one side and back up the other
    const steps = 26;
    lay.beginPath();
    for(let sIdx=0; sIdx<=steps; sIdx++){
      const t = sIdx/steps, y = t*drop;
      const sway = Math.sin(phase + t*3.0)*wob + Math.sin(phase*1.7 + t*7.1)*wob*0.28;
      const halfW = width*(1 - t*0.25);
      const x = baseX + sway - halfW;
      if(sIdx===0) lay.moveTo(x, y); else lay.lineTo(x, y);
    }
    for(let sIdx=steps; sIdx>=0; sIdx--){
      const t = sIdx/steps, y = t*drop;
      const sway = Math.sin(phase + t*3.0)*wob + Math.sin(phase*1.7 + t*7.1)*wob*0.28;
      const halfW = width*(1 - t*0.25);
      lay.lineTo(baseX + sway + halfW, y);
    }
    lay.closePath();
    lay.fillStyle = fall;
    lay.globalAlpha = 0.9;
    lay.fill();

    // a brighter seam along the leading edge, the way a curtain catches light
    lay.globalAlpha = 0.5;
    lay.strokeStyle = `rgba(${inVeil ? W3 : rgb},0.5)`;
    lay.lineWidth = Math.max(cpx(0.8), w*0.0022);
    lay.beginPath();
    for(let sIdx=0; sIdx<=steps; sIdx++){
      const t = sIdx/steps, y = t*drop;
      const sway = Math.sin(phase + t*3.0)*wob + Math.sin(phase*1.7 + t*7.1)*wob*0.28;
      const x = baseX + sway - width*(1 - t*0.25)*0.55;
      if(sIdx===0) lay.moveTo(x, y); else lay.lineTo(x, y);
    }
    lay.stroke();
  }
  ctx.globalAlpha = 1;
  if(twoHues){
    vctx.globalAlpha = 1;
    // the blend, across the page from the dial's side to the far one
    const a = ((light==null ? 315 : light) - 90) * Math.PI/180, R = Math.hypot(w, h)/2, ux = Math.cos(a)*R, uy = Math.sin(a)*R;
    const g = vctx.createLinearGradient(w/2 + ux, h/2 + uy, w/2 - ux, h/2 - uy);
    g.addColorStop(0, `rgb(${glow.r},${glow.g},${glow.b})`);
    g.addColorStop(0.45, `rgb(${Math.round(glow.r+(hem.r-glow.r)*0.45)},${Math.round(glow.g+(hem.g-glow.g)*0.45)},${Math.round(glow.b+(hem.b-glow.b)*0.45)})`);
    g.addColorStop(1, `rgb(${hem.r},${hem.g},${hem.b})`);
    vctx.globalCompositeOperation = 'source-in'; vctx.fillStyle = g; vctx.fillRect(0, 0, w, h);
    ctx.drawImage(veil, 0, 0);
  }
  // BLOOM, and a noisy one: the bright light spills into a soft glow that
  // is itself grainy, as on film — I + α·Blur(Bright(I))·N
  if(bloom > 0.01){
    const div = canonDiv(4), bw = Math.ceil(w/div), bh = Math.ceil(h/div), n = bw*bh;
    const sm = document.createElement('canvas'); sm.width = bw; sm.height = bh;
    const sx = sm.getContext('2d', CPU); sx.imageSmoothingEnabled = true; sx.drawImage(c, 0, 0, bw, bh);
    const img = sx.getImageData(0, 0, bw, bh), d = img.data, B = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
    for(let i = 0; i < n; i++){ const q = i*4, l = d[q]*0.2126 + d[q+1]*0.7152 + d[q+2]*0.0722, k = Math.max(0, (l - 140)/115);
      B[0][i] = d[q]*k; B[1][i] = d[q+1]*k; B[2][i] = d[q+2]*k; }
    const R = Math.max(2, Math.round(Math.min(bw, bh)*0.02*(0.6 + bloom))), tmp = new Float32Array(n);
    for(const F of B) for(let pass = 0; pass < 3; pass++){
      for(let y = 0; y < bh; y++){ const r = y*bw; let s = 0; for(let x = -R; x <= R; x++) s += F[r + Math.min(bw-1, Math.max(0, x))];
        for(let x = 0; x < bw; x++){ tmp[r + x] = s/(2*R + 1); s += F[r + Math.min(bw-1, x+R+1)] - F[r + Math.max(0, x-R)]; } }
      for(let x = 0; x < bw; x++){ let s = 0; for(let y = -R; y <= R; y++) s += tmp[Math.min(bh-1, Math.max(0, y))*bw + x];
        for(let y = 0; y < bh; y++){ F[y*bw + x] = s/(2*R + 1); s += tmp[Math.min(bh-1, y+R+1)*bw + x] - tmp[Math.max(0, y-R)*bw + x]; } }
    }
    for(let i = 0; i < n; i++){ const q = i*4, N = 0.35 + Math.random()*1.3;   // the grain in the glow
      d[q] = Math.min(255, B[0][i]*N*2.2); d[q+1] = Math.min(255, B[1][i]*N*2.2); d[q+2] = Math.min(255, B[2][i]*N*2.2); d[q+3] = 255; }
    sx.putImageData(img, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = bloom; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(sm, 0, 0, w, h); ctx.restore();
  }
  return c;
}

/**
 * The moon's first five random draws, in order. Shared by the generator and by
 * moonForSeed, so the seed button's glyph can never drift from the moon the
 * texture actually draws. Change the order here and both change together.
 */
function moonDraws(){
  const rScale = 0.30 + Math.random()*0.12;
  const px0 = 0.22 + Math.random()*0.56, py0 = 0.22 + Math.random()*0.56;
  // phase kept away from new and full, so the organic side always has room:
  // at the extremes it shrank to a sliver and the design was lost
  const phase = (Math.random()*2 - 1)*0.72;          // -1 full, 0 half, 1 new
  const facing = Math.random() < 0.5 ? 1 : -1;       // 1: lit on the right
  return { rScale, px0, py0, phase, facing };
}

/** The phase (0..1, as in moon.js) the Fractal Moon will show for a seed. */
export function moonForSeed(seed){
  const d = withSeed(seed, moonDraws);
  // lit when facing*u > phase*edge, so the lit fraction is (1-phase)/2 and the
  // terminator's cos term is exactly `phase`; facing says waxing or waning
  const p = Math.acos(Math.max(-1, Math.min(1, d.phase))) / (2 * Math.PI);
  return d.facing > 0 ? p : 1 - p;
}

// A moon, and on its dark side
// something grows that has no name —
// the lit side stays calm.
export function genMoon(w,h,amt,zoom,form,night){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  // CLOUDS: drifting banks lit by the moon — they pass IN FRONT of it and of
  // the stars (occlusion), silver-lined where they edge its light, and in
  // their thin veils a halo rings the moon (ice in the cloud). 0: none.
  // NIGHT SKY: the night around it — darkening toward the zenith, a dusty
  // band of the Milky Way, stars, sometimes a falling one; and the dark side
  // of the moon is no longer a hole: earthshine, the light of the Earth on
  // it, faint, with the fractal just visible in it, hiding the stars behind.
  // 0: the page shows through, as before.
  const clouds=Math.max(0, Math.min(1, form==null ? 0 : form)), nightK=Math.max(0, Math.min(1, night==null ? 0 : night));
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU);
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);

  // Everything is chosen by the seed: where it sits, how full it is, which
  // way it faces. The disc is large — it dominates the page rather than
  // decorating it — and may run off an edge.
  const unit=Math.min(w,h);
  const { rScale, px0, py0, phase, facing } = moonDraws();
  const R=unit*rScale*zoom;
  const cx=w*px0, cy=h*py0;
  const tilt=(Math.random()-0.5)*0.9;

  // value noise on a shuffled table, so the pattern is part of the seed too
  const perm=new Uint8Array(512), base=[...Array(256).keys()];
  for(let i=255;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [base[i],base[j]]=[base[j],base[i]]; }
  for(let i=0;i<512;i++) perm[i]=base[i&255];
  const fade=t=>t*t*(3-2*t);
  const vnoise=(x,y)=>{
    const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi;
    const h00=perm[(perm[xi&255]+yi)&511], h10=perm[(perm[(xi+1)&255]+yi)&511];
    const h01=perm[(perm[xi&255]+yi+1)&511], h11=perm[(perm[(xi+1)&255]+yi+1)&511];
    const u=fade(xf), v=fade(yf);
    return ((h00*(1-u)+h10*u)*(1-v) + (h01*(1-u)+h11*u)*v)/255;
  };
  // Fractal Depth adds octaves: more of them is finer, stranger detail
  const octaves=Math.max(2, Math.min(9, Math.round(2 + amt*4)));
  const fbm=(x,y)=>{ let s=0,a=0.5,f=1,n=0; for(let o=0;o<octaves;o++){ s+=vnoise(x*f,y*f)*a; n+=a; a*=0.5; f*=2.03; } return s/n; };
  const fbm4=(x,y)=>{ let s=0,a=0.5,f=1,n=0; for(let o=0;o<5;o++){ s+=vnoise(x*f,y*f)*a; n+=a; a*=0.55; f*=2.07; } return s/n; };
  // (drawn after the moon's own draws, so a seed's moon is the moon it was)
  const wind=(Math.random()-0.5)*0.5, cloudOff=Math.random()*200, mwA=Math.random()*Math.PI, mwOff=(Math.random()-0.5)*0.6;
  const shootP=Math.random(), haloR=2.1+Math.random()*0.5;

  // built at a third of the page's resolution and scaled up, like the clouds
  const div=canonDiv(3), ww=Math.ceil(w/div), wh=Math.ceil(h/div);
  const small=document.createElement('canvas'); small.width=ww; small.height=wh;
  const sctx=small.getContext('2d', CPU);
  const img=sctx.createImageData(ww,wh), d=img.data;
  // the sky behind, on its own layer, so the stars can go between
  const skyC=document.createElement('canvas'); skyC.width=ww; skyC.height=wh;
  const kctx=skyC.getContext('2d', CPU), kimg=kctx.createImageData(ww,wh), kd=kimg.data;
  const cosT=Math.cos(tilt), sinT=Math.sin(tilt);
  const sstepM=(a,b,x)=>{ const t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); };
  const mwx=Math.cos(mwA), mwy=Math.sin(mwA);
  const CL=new Float32Array(ww*wh);                      // cloud cover, kept for the stars
  for(let py=0;py<wh;py++){
    for(let px=0;px<ww;px++){
      const idx=(py*ww+px)*4;
      const X=(px*div-cx)/R, Y=(py*div-cy)/R;
      const u=X*cosT - Y*sinT, v=X*sinT + Y*cosT;
      const r2=u*u+v*v, r=Math.sqrt(r2);
      let val=128, alpha=255;
      // THE NIGHT: darker toward the top, the Milky Way a pale dusty band
      if(nightK>0){
        const sx=px*div/unit, sy=py*div/unit;
        const across=(sx-0.5*w/unit)*mwy-(sy-0.5*h/unit)*mwx-mwOff, band=Math.exp(-((across/0.16)**2));
        const dust=fbm4(sx*6+40, sy*6+11), lane=Math.max(0, fbm4(sx*14+3, sy*14+70)-0.5);
        let sky=128 - nightK*(48 + 30*(1 - py/wh));
        sky+=nightK*band*(dust*80 - 12 - lane*90*band);
        const sv=Math.max(0,Math.min(255,sky)); kd[idx]=kd[idx+1]=kd[idx+2]=sv; kd[idx+3]=255;
      }
      if(r2<=1){
        const edge=Math.sqrt(1-v*v);
        // the terminator is an ellipse; a soft edge a pixel or two wide instead
        // of a yes/no test, which stair-stepped
        const litAmt = sstepM(-0.012, 0.012, facing*u - phase*edge) * sstepM(1, 0.985, r);
        const limb = 1 - Math.sqrt(1-r2);               // darkening toward the rim
        // the lit side: noise that warps its own coordinates, twice
        const qx=fbm(u*2.1+1.7, v*2.1+9.2), qy=fbm(u*2.1+8.3, v*2.1+2.8);
        const n=fbm(u*2.4+3.2*qx, v*2.4+3.2*qy);
        if(litAmt<=0 && nightK<=0){
          // with no night, the DARK side is knocked out — the page shows
          // through — so the visible shape IS the phase, matching the glyph
          // on the seed button
          alpha = 0; val = 0;
        } else {
          // a gentle tonal ripple through it (hard contour lines here read
          // as a topographic map); the lit face GLOWS, its fractal held in the light
          const band=Math.abs(((n*9)%1)-0.5)*2;
          const t = Math.max(0, Math.min(1, (n - 0.28) / 0.44));
          const litV = 138 + t*95 + (1 - sstepM(0, 0.45, band))*13 - limb*18;
          // EARTHSHINE: the dark side, faintly lit, the fractal just showing
          const ashen = 128 - nightK*38 + t*26*nightK - limb*8;
          val = litV*litAmt + ashen*(1-litAmt);
          alpha = nightK>0 ? Math.round(255*sstepM(1, 0.985, r)) : Math.round(255*litAmt);
        }
      } else {
        // bloom: light spilling past the rim, strongest beside the lit limb,
        // and a soft halo all the way round
        const side = Math.max(0, Math.min(1, facing*u/r*0.5 + 0.5 - phase*0.35));
        // the glow hugs the limb (a separate halo ring read as a target)
        const bloom = Math.exp(-(r-1)*5.5) * (0.35 + 0.65*side);
        if(nightK>0){ val = 128 + bloom*70; alpha = Math.round(255*Math.min(1, bloom*1.6)); }
        else { val = 128 + bloom * 70; if(val < 129){ val = 0; alpha = 0; } }  // beyond the glow: untouched
      }
      // CLOUDS, in front of everything: banks stretched by the wind, their
      // thin edges lit by the moon, a halo in the thin veils round it
      if(clouds>0){
        const sx=px*div/unit, sy=py*div/unit, wx=sx+wind*sy;
        const cv=fbm4(wx*2.2+cloudOff, sy*5.5) * 0.75 + fbm4(wx*7+cloudOff*2, sy*14)*0.25;
        const cover=sstepM(0.6-clouds*0.32, 0.86-clouds*0.2, cv), ci=py*ww+px;
        CL[ci]=cover;
        if(cover>0.002){
          // billows: lit on the side toward the moon, shadowed away from it
          const bil=fbm4(wx*11+cloudOff, sy*22+5)-0.5, lx=-(X)/(r||1), ly=-(Y)/(r||1);
          // the bank's broad shape (two smooth octaves), and which way its slope faces
          const big=(x2,y2)=>vnoise(x2*2.2+cloudOff, y2*5.5)*0.65+vnoise(x2*4.5+cloudOff, y2*11)*0.35;
          const b0=big(wx,sy), gx=big(wx+0.02,sy)-b0, gy=big(wx,sy+0.02)-b0;
          const facing2=Math.max(-1, Math.min(1, -(gx*lx+gy*ly)*14));
          const near=Math.exp(-Math.max(0, r-1)*1.3), thin=cover*(1-cover)*4;    // the thin edges catch the light
          const halo=Math.exp(-(((r-haloR)/0.07)**2))*(0.3+thin)*0.8 + Math.exp(-(((r-haloR*1.03)/0.05)**2))*(0.3+thin)*0.3;
          const tone=128 - nightK*44 + bil*26 + near*(18 + 70*thin + 22*facing2) + halo*45 + (1-near)*6*facing2;
          const a2=Math.min(1, cover*(0.45+0.55*cover)*1.15);
          // over the moon (dimmed through it); the sky is its own layer beneath
          const ua=alpha/255, A=1-(1-ua)*(1-a2);
          val=(tone*a2 + val*ua*(1-a2))/Math.max(0.001, A); alpha=Math.round(255*A);
        }
      }
      d[idx]=d[idx+1]=d[idx+2]=Math.max(0,Math.min(255,val)); d[idx+3]=alpha;
    }
  }
  ctx.imageSmoothingEnabled=true;
  if(nightK>0){
    kctx.putImageData(kimg,0,0); ctx.drawImage(skyC,0,0,w,h);
    // STARS: sharp, at full size; dimmed by cloud (the moon's layer covers those behind it)
    const n=Math.round(canonArea(w,h)/4200*(0.4+nightK));
    for(let k=0;k<n;k++){
      const x=Math.random()*w, y=Math.random()*h, m=Math.random(), br=Math.pow(m, 3);
      const cov=CL[Math.min(wh-1,(y/div)|0)*ww+Math.min(ww-1,(x/div)|0)]||0, ok=1-cov*0.95;
      if(ok<0.05) continue;
      const rad=cpx(1+br*3), a=Math.min(1,(0.5+0.5*br)*ok*(0.4+0.6*nightK));
      ctx.globalAlpha=a; ctx.fillStyle='rgb(245,245,245)'; ctx.beginPath(); ctx.arc(x,y,rad,0,Math.PI*2); ctx.fill();
      if(br>0.55){ ctx.globalAlpha=a*0.5; ctx.strokeStyle='rgb(245,245,245)'; ctx.lineWidth=cpx(0.8);      // the brightest twinkle
        ctx.beginPath(); ctx.moveTo(x-rad*5,y); ctx.lineTo(x+rad*5,y); ctx.moveTo(x,y-rad*5); ctx.lineTo(x,y+rad*5); ctx.stroke(); }
    }
    // a falling star, on some nights
    if(shootP<0.45){
      const x0=w*(0.1+Math.random()*0.8), y0=h*(0.05+Math.random()*0.4), ang=Math.PI*(0.15+Math.random()*0.25)*(Math.random()<0.5?1:-1)+Math.PI/2, len=unit*(0.12+Math.random()*0.15);
      const x1=x0+Math.cos(ang)*len, y1=y0+Math.sin(ang)*len*0.6, g=ctx.createLinearGradient(x0,y0,x1,y1);
      g.addColorStop(0,'rgba(245,245,245,0)'); g.addColorStop(1,`rgba(250,250,250,${0.85*nightK})`);
      ctx.globalAlpha=1; ctx.strokeStyle=g; ctx.lineWidth=cpx(2.2); ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke();
      ctx.fillStyle=`rgba(255,255,255,${0.9*nightK})`; ctx.beginPath(); ctx.arc(x1,y1,cpx(2.6),0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  sctx.putImageData(img,0,0);
  ctx.drawImage(small,0,0,w,h);
  return c;
}

// Ridge behind ridge behind ridge,
// each one paler than the last —
// distance, made of air.
export function genLandscape(w,h,amt,zoom,form){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  // WETNESS: 0 is the dry, worked painting; wetter, it becomes watercolour —
  // edges bleed into each other and, very wet, the paint blooms (backruns:
  // pale patches with a dark, frilled rim where wet met drying paint)
  const wet=Math.max(0, Math.min(1, form==null ? 0 : form));
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d', CPU);
  const unit=Math.min(w,h);

  // A painted landscape, a different country every seed. The biome sets the
  // ground's character; each band is laid in, then worked over with short
  // brush dabs that follow the slope, their tone varying dab to dab. Far
  // bands are paler and flatter (air softens distance), near ones darker and
  // rougher. DISTANCE scales the features; RIDGES sets how many bands.
  const BIOMES={
    // decay: how much each finer octave keeps — low is smooth, high is busy.
    // sharp: crests that come to a point (only mountains have those)
    desert:   { bands:[3,5],  decay:0.18, sharp:false, amp:0.05, bump:0,   dab:'long',  horizon:0.55 },
    grass:    { bands:[4,6],  decay:0.3,  sharp:false, amp:0.07, bump:0,   dab:'grass', horizon:0.5  },
    jungle:   { bands:[6,9],  decay:0.42, sharp:false, amp:0.06, bump:0.9, dab:'leaf',  horizon:0.42 },
    plains:   { bands:[2,4],  decay:0.12, sharp:false, amp:0.018,bump:0,   dab:'long',  horizon:0.62 },
    mountain: { bands:[6,9],  decay:0.36, sharp:true,  amp:0.15, bump:0,   dab:'rock',  horizon:0.38, wave:1.1 },
    // mesas: broad flat tops and steep walls, banded with long strokes
    mesa:     { bands:[3,5],  decay:0.2,  sharp:false, amp:0.09, bump:0,   dab:'long',  horizon:0.5,  wave:0.9, mesa:true },
    // forest: rolling ground stippled with dabs, trees standing on every crest
    forest:   { bands:[4,6],  decay:0.28, sharp:false, amp:0.06, bump:0,   dab:'dot',   horizon:0.48, trees:true },
    // tundra: low, pale, nearly flat, swept with short horizontal strokes
    tundra:   { bands:[2,4],  decay:0.15, sharp:false, amp:0.025,bump:0,   dab:'snow',  horizon:0.58, pale:true },
    // a mountain lake: the far range, and still water holding its reflection
    lake:     { bands:[3,5],  decay:0.34, sharp:true,  amp:0.12, bump:0,   dab:'rock',  horizon:0.36, wave:1.1, lake:true },
    // a coast: headlands on one side, the sea opening out on the other
    coast:    { bands:[2,4],  decay:0.3,  sharp:false, amp:0.08, bump:0,   dab:'grass', horizon:0.46, sea:true },
  };
  const kind=Object.keys(BIOMES)[Math.floor(Math.random()*Object.keys(BIOMES).length)];
  const B=BIOMES[kind];
  const bands=Math.max(2, Math.round((B.bands[0]+Math.random()*(B.bands[1]-B.bands[0]))*amt));
  const horizon=h*(B.horizon+(Math.random()-0.5)*0.08);

  // the sky: a soft wash, and a few long smears of cloud
  const sky=ctx.createLinearGradient(0,0,0,horizon);
  sky.addColorStop(0,'rgb(150,150,150)'); sky.addColorStop(1,'rgb(132,132,132)');
  ctx.fillStyle=sky; ctx.fillRect(0,0,w,h);
  for(let s=0;s<5;s++){
    const y=horizon*(0.15+Math.random()*0.7), x=Math.random()*w, len=w*(0.2+Math.random()*0.4);
    for(let d=0;d<40;d++){
      ctx.globalAlpha=0.05; ctx.fillStyle='rgb(200,200,200)';
      ctx.beginPath(); ctx.ellipse(x+(Math.random()-0.5)*len, y+(Math.random()-0.5)*unit*0.02,
        unit*0.05*zoom, unit*0.008, 0, 0, Math.PI*2); ctx.fill();
    }
  }

  const ridge=(x, seed, amp, decay, bump)=>{
    // mountains are broad masses: a long base wavelength, so peaks are wide
    // for their height (a short one made every range a row of spires)
    let y=0, a=amp, f=1/(unit*(B.wave||0.4)*zoom);
    for(let o=0;o<5;o++){
      const n=Math.sin(x*f*6.283+seed*(o+1))*0.6 + Math.sin(x*f*2.1*6.283+seed*1.7*(o+1))*0.4;
      // mountains fold finer octaves into points; everything else stays rounded
      // a mesa's base octave is squashed flat at top and bottom: plateaus with walls
      const m=(B.mesa && o===0) ? Math.max(-1, Math.min(1, n*3)) : n;
      y+=(B.sharp && o>0 ? Math.abs(m)*2-1 : m)*a;
      a*=decay; f*=2.1;
    }
    if(bump) y-=Math.abs(Math.sin(x/(unit*0.018*zoom)+seed))*amp*0.35*bump;   // canopy lumps
    return y;
  };

  const coastAt = B.sea ? { x: w*(0.3+Math.random()*0.35), side: Math.random()<0.5 ? 1 : -1 } : null;
  // water: flat, lighter than the land, laid with short level strokes; it
  // holds the reflection of `prof` (the band behind it), broken by ripples
  const water=(top, prof, tone)=>{
    ctx.globalAlpha=0.95; ctx.fillStyle='rgb(150,150,150)'; ctx.fillRect(0, top, w, h-top);
    if(prof){
      ctx.globalAlpha=0.32; ctx.fillStyle=`rgb(${tone},${tone},${tone})`;
      ctx.beginPath(); ctx.moveTo(-20, top); prof.forEach(([x,y])=>ctx.lineTo(x, top+(top-Math.min(top,y))*0.9)); ctx.lineTo(w+20, top); ctx.closePath(); ctx.fill();
    }
    const n=Math.round(w/(unit*0.012));
    for(let k=0;k<n;k++){
      const y=top+Math.pow(Math.random(),1.6)*(h-top), x=Math.random()*w, len=unit*(0.02+Math.random()*0.05)*(0.5+(y-top)/(h-top));
      const tn=150+(Math.random()-0.5)*60;
      ctx.globalAlpha=0.35; ctx.strokeStyle=`rgb(${tn|0},${tn|0},${tn|0})`; ctx.lineWidth=unit*0.002*(1+(y-top)/(h-top)*2);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+len, y); ctx.stroke();
    }
  };
  if(B.sea) water(horizon, null, 0);
  let lakeTop=null;
  for(let i=0;i<bands;i++){
    const t=bands===1?1:i/(bands-1);                    // 0 far .. 1 near
    let base=horizon+(h-horizon)*Math.pow(t,1.35)*0.92;
    let amp=unit*B.amp*(0.35+t*0.9);
    // in front of a lake, the near shore sits low, so the water shows
    if(lakeTop!=null){ const lk=Math.floor((bands-1)/2), u=(i-lk)/Math.max(1, bands-1-lk); base=lakeTop+(h-lakeTop)*(0.5+0.45*u); amp*=0.45; }
    const tone=B.pale ? Math.round(205-t*95) : Math.round(178-t*140);   // pale far, dark near
    const seed=Math.random()*100;
    const prof=[];
    // on a coast, every band is land on one side only: past the cliff it
    // drops into the sea
    // each nearer headland reaches a little further out, its cliff its own
    const cliff = B.sea ? { x: coastAt.x + coastAt.side*(unit*0.1*t + (Math.random()-0.5)*unit*0.07), side: coastAt.side, fall: unit*(0.02+Math.random()*0.06) } : null;
    for(let x=-20;x<=w+20;x+=Math.max(2,w/400)){
      let y=base+ridge(x,seed,amp,B.decay,B.bump);
      if(cliff){ const d=(x-cliff.x)*cliff.side, k=Math.max(0, Math.min(1, d/cliff.fall)); y+= k*k*(h+40-y); }
      prof.push([x, y]); }
    // lay the band in
    ctx.globalAlpha=0.92; ctx.fillStyle=`rgb(${tone},${tone},${tone})`;
    ctx.beginPath(); ctx.moveTo(-20,h); prof.forEach(([x,y])=>ctx.lineTo(x,y)); ctx.lineTo(w+20,h); ctx.closePath(); ctx.fill();
    // a brushed edge, not a cut one: the crest painted over a few times, loosely
    for(let pass=0;pass<3;pass++){
      const jit=unit*0.004*(pass+1);
      ctx.globalAlpha=0.22; ctx.strokeStyle=`rgb(${tone},${tone},${tone})`; ctx.lineWidth=unit*0.006*(1+pass);
      ctx.beginPath();
      // the wobble wanders SLOWLY along the crest; jittering each point on its
      // own made a fringe of hairs
      const ph1=Math.random()*6.28, ph2=Math.random()*6.28;
      prof.forEach(([x,y],j)=>{
        const yy=y+(Math.sin(x/(unit*0.05)+ph1)*0.6+Math.sin(x/(unit*0.017)+ph2)*0.4)*jit;
        j?ctx.lineTo(x,yy):ctx.moveTo(x,yy); });
      ctx.stroke();
    }
    // work it over with BRUSH strokes: few, broad and flat-ended, laid along
    // the ground, each a slightly different tone. (Hundreds of hair-thin
    // strokes read as fur, not paint.) Each stroke is two overlapping
    // passes, the second narrower and offset, so it has a loaded edge.
    const strokes=Math.round(w/(unit*0.016)*(0.5+t)*(B.dab==='leaf'?1.4:1));
    ctx.lineCap='butt';
    for(let d=0;d<strokes;d++){
      const k=Math.floor(Math.random()*(prof.length-1)), [x0,y0]=prof[k], [x1,y1]=prof[k+1];
      const slope=Math.atan2(y1-y0,x1-x0);
      const depthInto=Math.pow(Math.random(),1.5)*unit*(0.03+t*0.16);
      const x=x0+(Math.random()-0.5)*unit*0.01, y=y0+depthInto+unit*0.004;
      const tn=Math.max(0,Math.min(255,tone+(Math.random()-0.5)*(30+t*44)));
      const len=unit*(B.dab==='long'?0.07:B.dab==='rock'?0.035:B.dab==='dot'?0.008:B.dab==='snow'?0.05:0.04)*(0.6+t*0.8)*(0.7+Math.random()*0.6)*zoom;
      const wide=unit*(0.007+t*0.013)*(0.7+Math.random()*0.6);
      const ang=B.dab==='grass'?slope-0.35+(Math.random()-0.5)*0.4
              : B.dab==='leaf'?slope+(Math.random()-0.5)*1.1
              : B.dab==='rock'?slope+(Math.random()-0.5)*0.9
              : B.dab==='dot'?Math.random()*6.283
              : B.dab==='snow'?(Math.random()-0.5)*0.08
              : slope+(Math.random()-0.5)*0.18;
      const ex=x+Math.cos(ang)*len, ey=y+Math.sin(ang)*len;
      ctx.strokeStyle=`rgb(${tn|0},${tn|0},${tn|0})`;
      ctx.globalAlpha=0.2+Math.random()*0.18; ctx.lineWidth=wide;
      ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo((x+ex)/2, (y+ey)/2 - wide*0.4, ex, ey); ctx.stroke();
      const tn2=Math.max(0,Math.min(255,tn+(Math.random()<0.5?-18:18)));
      ctx.strokeStyle=`rgb(${tn2|0},${tn2|0},${tn2|0})`;
      ctx.globalAlpha=0.22; ctx.lineWidth=wide*0.45;
      ctx.beginPath(); ctx.moveTo(x+wide*0.2,y-wide*0.18); ctx.lineTo(ex-wide*0.4,ey-wide*0.18); ctx.stroke();
    }
    ctx.lineCap='round';
    // a soft haze where each band meets the air behind it
    ctx.globalAlpha=0.12*(1-t); ctx.strokeStyle='rgb(200,200,200)'; ctx.lineWidth=unit*0.01;
    ctx.beginPath(); prof.forEach(([x,y],j)=>j?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.stroke();
    // trees on the crest: firs (stacked tiers) and broadleaf (a round crown on a trunk)
    if(B.trees && t>0.15){
      const n=Math.round(w/(unit*0.03)*(0.4+t)), tt=Math.max(0, tone-25);
      ctx.fillStyle=`rgb(${tt},${tt},${tt})`; ctx.strokeStyle=ctx.fillStyle;
      for(let k=0;k<n;k++){
        const [x,y]=prof[Math.floor(Math.random()*prof.length)], th=unit*(0.02+0.05*t)*(0.6+Math.random()*0.8)*zoom;
        ctx.globalAlpha=0.8;
        if(Math.random()<0.7){
          ctx.beginPath();
          for(let tier=0;tier<3;tier++){ const ty=y-th*(0.25+tier*0.28), tw=th*(0.32-tier*0.08);
            ctx.moveTo(x-tw, ty+th*0.22); ctx.lineTo(x, ty-th*0.22); ctx.lineTo(x+tw, ty+th*0.22); }
          ctx.fill();
        } else {
          ctx.lineWidth=th*0.08; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y-th*0.5); ctx.stroke();
          ctx.beginPath(); ctx.arc(x, y-th*0.68, th*0.3, 0, Math.PI*2); ctx.fill();
        }
      }
    }
    // the lake lies in front of the far range
    if(B.lake && i===Math.floor((bands-1)/2)){
      let top=0; for(const [,y] of prof) top=Math.max(top, y);
      lakeTop=Math.min(h*0.8, top);
      water(lakeTop, prof, tone);
    }
  }
  // WET: watercolour blooms, then the whole painting bleeds softly
  if(wet>0.5){
    const n=Math.round((wet-0.5)*8*(0.5+Math.random()));
    for(let k=0;k<n;k++){
      const x=Math.random()*w, y=horizon+Math.random()*(h-horizon), r=unit*(0.03+Math.random()*0.07);
      // a cauliflower outline: lobes of every size, never a circle
      const ph=[Math.random()*6, Math.random()*6, Math.random()*6, Math.random()*6], pts=[];
      for(let a=0;a<=96;a++){ const an=a/96*Math.PI*2;
        const rr=r*(1+0.22*Math.sin(an*3+ph[0])+0.12*Math.abs(Math.sin(an*7+ph[1]))+0.07*Math.abs(Math.sin(an*13+ph[2]))+0.04*Math.sin(an*29+ph[3]));
        pts.push([x+Math.cos(an)*rr, y+Math.sin(an)*rr*0.8]); }
      const path=()=>{ ctx.beginPath(); pts.forEach(([px,py],j)=>j?ctx.lineTo(px,py):ctx.moveTo(px,py)); ctx.closePath(); };
      ctx.globalAlpha=0.1; ctx.fillStyle='rgb(205,205,205)'; path(); ctx.fill();
      // the frilled rim, darker, where the wet edge stopped in drying paint
      ctx.globalAlpha=0.22; ctx.strokeStyle='rgb(80,80,80)'; ctx.lineWidth=unit*0.0018; path(); ctx.stroke();
    }
  }
  if(wet>0.01){
    const k=Math.max(4, Math.round(12 - wet*6)), sw=Math.max(1, Math.round(w/k)), sh=Math.max(1, Math.round(h/k));
    const soft=document.createElement('canvas'); soft.width=sw; soft.height=sh;
    const sx=soft.getContext('2d', CPU); sx.imageSmoothingEnabled=true; sx.drawImage(c, 0, 0, sw, sh);
    ctx.save(); ctx.imageSmoothingEnabled=true; ctx.globalAlpha=0.7*wet; ctx.drawImage(soft, 0, 0, w, h); ctx.restore();
  }
  ctx.globalAlpha=1;
  return c;
}
