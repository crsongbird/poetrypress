/**
 * texWhimsy.js — ♡ Whimsy. Hue: red, purple and blue.
 *
 * Sleep; starlight advancing or receding. Clouds, bokeh, the deep field,
 * euphoria dust, burning mana, first snow, aurora.
 */
import { makeNoiseGrid, sampleNoiseGrid, mixHex, darkenRgb, parseHex, withSeed } from './texCore.js';

export function genClouds(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const workDiv = 4;
  const workW = Math.max(24, Math.round(w/workDiv));
  const workH = Math.max(24, Math.round(h/workDiv));

  const octaves = 6;
  const gain = 0.5;
  const lacunarity = 2.0;
  // scale changes the noise FREQUENCY — bigger clouds, fewer of them.
  // (Changing the working resolution instead only made them blurrier.)
  const baseCells = 4 / zoom;
  const bias = 0.15;
  const power = 2.2;

  const octaveGrids = [];
  let amp = 1, maxAmp = 0;
  for(let i=0;i<octaves;i++){
    const freq = baseCells * Math.pow(lacunarity, i);
    const gw = Math.max(2, Math.round(freq)+1);
    const gh = Math.max(2, Math.round(freq * (workH/workW))+1);
    octaveGrids.push({ grid: makeNoiseGrid(gw,gh), gw, gh, freq, amp });
    maxAmp += amp;
    amp *= gain;
  }

  const small = document.createElement('canvas');
  small.width = workW; small.height = workH;
  const sctx = small.getContext('2d');
  const img = sctx.createImageData(workW, workH);
  const d = img.data;

  for(let py=0; py<workH; py++){
    for(let px=0; px<workW; px++){
      let total = 0;
      for(const o of octaveGrids){
        const nx = (px/workW) * o.freq;
        const ny = (py/workH) * o.freq;
        total += sampleNoiseGrid(o.grid, o.gw, o.gh, nx, ny) * o.amp;
      }
      const v = total / maxAmp;
      let density = Math.max(0, (v - bias) / (1 - bias));
      density = Math.pow(density, power);

      const idx = (py*workW+px)*4;
      // Billow is PUFFINESS, not strength (opacity already does strength).
      // Low billow: a soft, even haze. High billow: the same field pushed
      // through a steep curve, so it gathers into rounded, defined heaps with
      // clear sky between. The swing from grey stays the same size throughout.
      const steep = 1 + amt * 3.2;                        // 1 = linear haze
      const t = Math.max(0, Math.min(1, density));
      const puff = t < 0.5 ? 0.5 * Math.pow(2 * t, steep)
                           : 1 - 0.5 * Math.pow(2 * (1 - t), steep);
      const val = 128 + (puff * 140 - 20);
      d[idx]=val; d[idx+1]=val; d[idx+2]=val; d[idx+3]=255;
    }
  }
  sctx.putImageData(img,0,0);

  const full = document.createElement('canvas');
  full.width = w; full.height = h;
  const fctx = full.getContext('2d');
  fctx.imageSmoothingEnabled = true;
  fctx.drawImage(small, 0, 0, w, h);
  return full;
}

export function genAstralFog(w,h,amt,zoom,light,tint){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const neb = tint ? parseHex(tint) : null;
  const workDiv = 4;
  const workW = Math.max(24, Math.round(w/workDiv));
  const workH = Math.max(24, Math.round(h/workDiv));

  const octaves = 8;
  const gain = 0.55;
  const lacunarity = 2.0;
  const baseCells = 3 / zoom;
  const bias = -0.05;
  const power = 1.7;

  const octaveGrids = [];
  let amp = 1, maxAmp = 0;
  for(let i=0;i<octaves;i++){
    const freq = baseCells * Math.pow(lacunarity, i);
    const gw = Math.max(2, Math.round(freq)+1);
    const gh = Math.max(2, Math.round(freq * (workH/workW))+1);
    octaveGrids.push({ grid: makeNoiseGrid(gw,gh), gw, gh, freq, amp });
    maxAmp += amp;
    amp *= gain;
  }

  const small = document.createElement('canvas');
  small.width = workW; small.height = workH;
  const sctx = small.getContext('2d');
  const img = sctx.createImageData(workW, workH);
  const d = img.data;

  for(let py=0; py<workH; py++){
    for(let px=0; px<workW; px++){
      let total = 0;
      for(const o of octaveGrids){
        const nx = (px/workW) * o.freq;
        const ny = (py/workH) * o.freq;
        total += sampleNoiseGrid(o.grid, o.gw, o.gh, nx, ny) * o.amp;
      }
      const v = total / maxAmp;
      let density = Math.max(0, (v - bias) / (1 - bias));
      density = Math.pow(density, power);

      const idx = (py*workW+px)*4;
      // Nebula density: how far the fog swings from neutral grey
      const val = 128 + (75 - 128 + density*135) * amt;
      // a tint pushes the fog toward a hue instead of leaving it neutral
      if(neb){
        const t = Math.max(0, Math.min(1, (val - 128) / 127));
        d[idx]   = val + (neb.r - 128) * t;
        d[idx+1] = val + (neb.g - 128) * t;
        d[idx+2] = val + (neb.b - 128) * t;
      } else { d[idx]=val; d[idx+1]=val; d[idx+2]=val; }
      d[idx+3]=255;
    }
  }
  sctx.putImageData(img,0,0);

  const full = document.createElement('canvas');
  full.width = w; full.height = h;
  const fctx = full.getContext('2d');
  fctx.imageSmoothingEnabled = true;
  fctx.drawImage(small, 0, 0, w, h);
  return full;
}

export function genAstralStars(w,h,accent1,accent2,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const full = document.createElement('canvas');
  full.width = w; full.height = h;
  const fctx = full.getContext('2d');

  const d1 = darkenRgb(accent1, 0.35);
  const d2 = darkenRgb(accent2, 0.35);

  const starCount = Math.round((w*h)/2125 * amt);
  for(let i=0;i<starCount;i++){
    const x = Math.random()*w, y = Math.random()*h;
    const roll = Math.random();
    const base = Math.random() < 0.5 ? d1 : d2;
    let size, mixT, spike;
    if(roll < 0.55){ size = 1; mixT = 0.15+Math.random()*0.15; spike = false; }
    else if(roll < 0.83){ size = 1.2+Math.random()*1.1; mixT = 0.3+Math.random()*0.15; spike = false; }
    else if(roll < 0.96){ size = 2.1+Math.random()*1.6; mixT = 0.5+Math.random()*0.2; spike = false; }
    else { size = 3.4+Math.random()*2.6; mixT = 0.75+Math.random()*0.2; spike = true; }

    const r = Math.round(base.r + (255-base.r)*mixT);
    const g = Math.round(base.g + (255-base.g)*mixT);
    const b = Math.round(base.b + (255-base.b)*mixT);

    if(size <= 1){
      fctx.fillStyle = `rgb(${r},${g},${b})`;
      fctx.fillRect(x, y, 1, 1);
      continue;
    }

    const grad = fctx.createRadialGradient(x,y,0,x,y,size);
    grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
    grad.addColorStop(0.65, `rgba(${r},${g},${b},0.7)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    fctx.fillStyle = grad;
    fctx.beginPath(); fctx.arc(x,y,size,0,Math.PI*2); fctx.fill();

    if(spike){
      fctx.save();
      fctx.globalAlpha = 0.55;
      fctx.strokeStyle = `rgb(${r},${g},${b})`;
      fctx.lineWidth = 0.7;
      fctx.beginPath();
      fctx.moveTo(x-size*2.4, y); fctx.lineTo(x+size*2.4, y);
      fctx.moveTo(x, y-size*2.4); fctx.lineTo(x, y+size*2.4);
      fctx.stroke();
      fctx.restore();
    }
  }
  return full;
}

export function genBokeh(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgb(128,128,128)'; ctx.fillRect(0,0,w,h);

  // Dust motes in real depth. Every mote has a distance z (0 near, 1 far).
  // The knob sets the FOCAL PLANE: motes at that distance are small, sharp
  // specks; the further a mote sits from it — nearer or farther — the wider
  // and fainter its disc, the way a lens spreads a point of light (the
  // circle of confusion). Near motes are also larger, simply for being near.
  // Drawn far to near, so near blur lies over what is behind it.
  const unit = Math.min(w,h);
  // 25%..400% maps onto near..far, on a log scale so 100% sits mid-depth
  const zf = Math.max(0, Math.min(1, Math.log(zoom/0.25) / Math.log(16)));
  const n = Math.max(20, Math.round((w*h)/9000 * amt));
  const motes = [];
  for(let i=0;i<n;i++){
    // more motes far away than near, as in a real volume of air
    motes.push({ x: Math.random()*w, y: Math.random()*h, z: Math.sqrt(Math.random()),
                 lum: 200 + Math.random()*55 });
  }
  motes.sort((a,b) => b.z - a.z);
  for(const m of motes){
    const near = 1 / (0.18 + m.z);                        // perspective scale
    const speck = unit*0.0022*near;                       // size when in focus
    const coc = Math.abs(m.z - zf) * unit*0.05 * near;    // blur disc radius
    const r = Math.max(speck, coc);
    // the same light spread over a bigger disc is dimmer
    const a = Math.min(0.95, Math.max(0.04, Math.pow(speck / r, 0.9) * 0.95 + 0.05));
    const tone = m.lum|0;
    if(r <= speck*1.3){
      // in focus: a sharp speck with a tiny glint
      ctx.globalAlpha = a; ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
      ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, Math.PI*2); ctx.fill();
    } else {
      // out of focus: a flat disc with a slightly brighter rim — how bokeh
      // actually looks — rather than a soft gaussian blob
      const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, r);
      g.addColorStop(0,    `rgba(${tone},${tone},${tone},${a*0.75})`);
      g.addColorStop(0.82, `rgba(${tone},${tone},${tone},${a*0.9})`);
      g.addColorStop(0.95, `rgba(${tone},${tone},${tone},${a})`);
      g.addColorStop(1,    `rgba(${tone},${tone},${tone},0)`);
      ctx.globalAlpha = 1; ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(m.x, m.y, r, 0, Math.PI*2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  return c;
}

export function genEmbers(w,h,accent1,accent2,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const ctx = c.getContext('2d');
  const A = mixHex(accent1 || '#E0526F', accent1 || '#E0526F', 0);
  const B = mixHex(accent2 || '#9B7FE8', accent2 || '#9B7FE8', 0);

  // Burning fragments raining down. Each spark is BALLISTIC: flung out, then
  // bent by gravity into a falling curve — never a straight needle. The head
  // is white-hot; the trail cools through the ember colour to nothing behind
  // it. Some sparks burst partway and fork into smaller ones, and fine hot
  // dust hangs between them.
  const unit = Math.min(w,h);
  const n = Math.max(12, Math.round((w*h)/26000 * amt));
  const g = unit * 0.9;                                   // gravity, px per unit time²
  const trail = (x, y, vx, vy, len, width, col, depth) => {
    const steps = 22, dt = len / steps;
    let px = x, py = y, pvx = vx, pvy = vy;
    const pts = [[px, py]];
    for(let s=0;s<steps;s++){ pvy += g*dt; px += pvx*dt; py += pvy*dt; pts.push([px, py]); }
    // the trail: thin and cool at the tail, thickening toward the hot head
    for(let s=1;s<pts.length;s++){
      const f = s / (pts.length-1);                        // 0 tail -> 1 head
      ctx.globalAlpha = 0.08 + 0.7*f*f;
      ctx.strokeStyle = `rgb(${Math.round(col.r + (255-col.r)*f*f)},${Math.round(col.g + (255-col.g)*f*f*0.8)},${Math.round(col.b + (255-col.b)*f*f*0.6)})`;
      ctx.lineWidth = Math.max(0.5, width*(0.25 + 0.9*f));
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
    const col = Math.random() < 0.6 ? A : B;
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
export function genSnow(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');
  const count = Math.round((w*h)/3200 * amt);
  for(let i=0;i<count;i++){
    const x = Math.random()*w, y = Math.random()*h;
    const roll = Math.random();
    let size, alpha;
    if(roll < 0.25){ size = 0.6+Math.random()*0.5; alpha = 0.3+Math.random()*0.2; }        // distant dust
    else if(roll < 0.55){ size = 1+Math.random()*1.2; alpha = 0.7+Math.random()*0.3; }      // tiny, sharp
    else if(roll < 0.78){ size = 2.5+Math.random()*2.5; alpha = 0.5+Math.random()*0.3; }    // small, soft
    else if(roll < 0.93){ size = 5+Math.random()*4; alpha = 0.35+Math.random()*0.25; }      // medium, softer
    else { size = 9+Math.random()*9; alpha = 0.18+Math.random()*0.2; }                      // rare, large, out of focus
    size *= zoom;

    if(size <= 1.3){
      fctx.fillStyle = `rgba(255,255,255,${alpha})`;
      fctx.fillRect(x,y,1,1);
      continue;
    }
    const grad = fctx.createRadialGradient(x,y,0,x,y,size);
    grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
    grad.addColorStop(0.6, `rgba(255,255,255,${alpha*0.5})`);
    grad.addColorStop(1, `rgba(255,255,255,0)`);
    fctx.fillStyle = grad;
    fctx.beginPath(); fctx.arc(x,y,size,0,Math.PI*2); fctx.fill();
  }
  return full;
}

// Windfall: simple parametric leaf shapes (two mirrored quadratic curves meeting at
// a tip, plus a center vein), scattered and rotated. Kept neutral gray like Flowers
// so it reads correctly via 'overlay' on both green (Understory) and warm (Ember
// Fall) backgrounds.
// Wisps: glowing motes that take on the current accent colors (interpolated between
// accent one and accent two per particle) rather than a fixed palette. Three kinds:
// simple glow dots, curved-trail motes (an actual arc via quadraticCurveTo, not a
// straight streak like Embers), and four-point sparkle glints. Transparent base,
// composited with 'lighten'.
export function drawSparkleGlint(ctx, x, y, size, r, g, b){
  ctx.save();
  ctx.translate(x,y);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.beginPath();
  ctx.moveTo(0,-size); ctx.lineTo(size*0.16,0); ctx.lineTo(0,size); ctx.lineTo(-size*0.16,0);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-size,0); ctx.lineTo(0,size*0.16); ctx.lineTo(size,0); ctx.lineTo(0,-size*0.16);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

export function genMagicParticles(w,h,accent1,accent2,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const c = document.createElement('canvas'); c.width=w; c.height=h;
  const ctx = c.getContext('2d');
  const A = mixHex(accent1 || '#E0526F', accent1 || '#E0526F', 0);
  const B = mixHex(accent2 || '#9B7FE8', accent2 || '#9B7FE8', 0);
  const rgb = (col, lift=0) => `rgb(${Math.min(255,col.r+lift)},${Math.min(255,col.g+lift)},${Math.min(255,col.b+lift)})`;

  // Pixie dust, less geometric than it was. Wisps are TAPERED curls — thick
  // in the middle, thinning to hair at both ends, curling as they go — rather
  // than even-width circle arcs; each drops a trail of motes. Sparkles twinkle
  // unevenly: four to six arms, no two the same length, one arm always long.
  const unit = Math.min(w,h);
  const count = Math.round((w*h)/8400 * amt);

  const wisp = (x, y, col) => {
    const len = unit*(0.04 + Math.random()*0.07)*zoom;
    let a = Math.random()*Math.PI*2;
    const curl = (Math.random()-0.5)*0.22, curlGrow = (Math.random()-0.5)*0.02;
    const W = unit*0.0022*zoom*(0.6 + Math.random());
    const steps = 26, pts = [];
    let px = x, py = y, k = curl;
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
    const arms = 4 + Math.floor(Math.random()*3), base = unit*0.009*zoom*(0.5 + Math.random());
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

  for(let i=0;i<count;i++){
    const x = Math.random()*w, y = Math.random()*h, col = Math.random() < 0.55 ? A : B;
    const roll = Math.random();
    if(roll < 0.34) wisp(x, y, col);
    else if(roll < 0.52) sparkle(x, y, col);
    else {                                                   // loose dust
      ctx.globalAlpha = 0.3 + Math.random()*0.5; ctx.fillStyle = rgb(col, 50);
      ctx.beginPath(); ctx.arc(x, y, unit*0.0016*zoom*(0.4 + Math.random()), 0, Math.PI*2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  return c;
}

// Light hung in sheets —
// no particle, no edge, just
// the sky leaning down.
export function genAuroraVeil(w,h,amt,zoom,light,tint,tint2){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const glow = tint ? parseHex(tint) : null;
  // the hem's colour; the same as the curtain's by default, which draws
  // exactly the single-colour veil
  const hem = tint2 ? parseHex(tint2) : glow;
  const c = document.createElement('canvas');
  c.width=w; c.height=h;
  const ctx = c.getContext('2d');
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
    const fall = ctx.createLinearGradient(0, 0, 0, drop);
    fall.addColorStop(0,    `rgba(${rgb},${bright?0.62:0.45})`);
    fall.addColorStop(0.45, `rgba(${mid},${bright?0.30:0.22})`);
    fall.addColorStop(1,    `rgba(${low},0)`);

    // the fold: a wavy quad traced down one side and back up the other
    const steps = 26;
    ctx.beginPath();
    for(let sIdx=0; sIdx<=steps; sIdx++){
      const t = sIdx/steps, y = t*drop;
      const sway = Math.sin(phase + t*3.0)*wob + Math.sin(phase*1.7 + t*7.1)*wob*0.28;
      const halfW = width*(1 - t*0.25);
      const x = baseX + sway - halfW;
      if(sIdx===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    for(let sIdx=steps; sIdx>=0; sIdx--){
      const t = sIdx/steps, y = t*drop;
      const sway = Math.sin(phase + t*3.0)*wob + Math.sin(phase*1.7 + t*7.1)*wob*0.28;
      const halfW = width*(1 - t*0.25);
      ctx.lineTo(baseX + sway + halfW, y);
    }
    ctx.closePath();
    ctx.fillStyle = fall;
    ctx.globalAlpha = 0.9;
    ctx.fill();

    // a brighter seam along the leading edge, the way a curtain catches light
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = `rgba(${rgb},0.5)`;
    ctx.lineWidth = Math.max(0.8, w*0.0022);
    ctx.beginPath();
    for(let sIdx=0; sIdx<=steps; sIdx++){
      const t = sIdx/steps, y = t*drop;
      const sway = Math.sin(phase + t*3.0)*wob + Math.sin(phase*1.7 + t*7.1)*wob*0.28;
      const x = baseX + sway - width*(1 - t*0.25)*0.55;
      if(sIdx===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
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
export function genMoon(w,h,amt,zoom){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d');
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

  // built at a third of the page's resolution and scaled up, like the clouds
  const div=3, ww=Math.ceil(w/div), wh=Math.ceil(h/div);
  const small=document.createElement('canvas'); small.width=ww; small.height=wh;
  const sctx=small.getContext('2d');
  const img=sctx.createImageData(ww,wh), d=img.data;
  const cosT=Math.cos(tilt), sinT=Math.sin(tilt);
  for(let py=0;py<wh;py++){
    for(let px=0;px<ww;px++){
      const idx=(py*ww+px)*4;
      const X=(px*div-cx)/R, Y=(py*div-cy)/R;
      const u=X*cosT - Y*sinT, v=X*sinT + Y*cosT;
      const r2=u*u+v*v;
      let val=128, alpha=255;
      if(r2<=1){
        const edge=Math.sqrt(1-v*v);
        const lit = facing*u > phase*edge;              // the terminator is an ellipse
        const limb = 1 - Math.sqrt(1-r2);               // darkening toward the rim
        if(lit){
          // the lit face is KNOCKED OUT: transparent, so the page shows
          // through. Painting it solid drew a glowing orb under the design.
          alpha = 0; val = 0;             // fully transparent, nothing underneath
        } else {
          // the other side: noise that warps its own coordinates, twice
          const qx=fbm(u*2.1+1.7, v*2.1+9.2), qy=fbm(u*2.1+8.3, v*2.1+2.8);
          const n=fbm(u*2.4+3.2*qx, v*2.4+3.2*qy);
          const band=Math.abs(((n*9)%1)-0.5)*2;         // contour lines through it
          // full range, so it shows through overlay on dark and light pages
          const t = Math.max(0, Math.min(1, (n - 0.28) / 0.44));
          val = 18 + t*150 + (band<0.2 ? 85 : 0) - limb*25;
        }
      } else if(r2<1.18){
        val = 128 + (1.18-r2)/0.18*18;                  // a faint halo
      }
      d[idx]=d[idx+1]=d[idx+2]=Math.max(0,Math.min(255,val)); d[idx+3]=alpha;
    }
  }
  sctx.putImageData(img,0,0);
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(small,0,0,w,h);
  return c;
}

// Ridge behind ridge behind ridge,
// each one paler than the last —
// distance, made of air.
export function genLandscape(w,h,amt,zoom){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d');
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
  };
  const kind=Object.keys(BIOMES)[Math.floor(Math.random()*5)];
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
      y+=(B.sharp && o>0 ? Math.abs(n)*2-1 : n)*a;
      a*=decay; f*=2.1;
    }
    if(bump) y-=Math.abs(Math.sin(x/(unit*0.018*zoom)+seed))*amp*0.35*bump;   // canopy lumps
    return y;
  };

  for(let i=0;i<bands;i++){
    const t=bands===1?1:i/(bands-1);                    // 0 far .. 1 near
    const base=horizon+(h-horizon)*Math.pow(t,1.35)*0.92;
    const amp=unit*B.amp*(0.35+t*0.9);
    const tone=Math.round(178-t*140);                   // pale far, dark near
    const seed=Math.random()*100;
    const prof=[];
    for(let x=-20;x<=w+20;x+=Math.max(2,w/400)) prof.push([x, base+ridge(x,seed,amp,B.decay,B.bump)]);
    // lay the band in
    ctx.globalAlpha=0.92; ctx.fillStyle=`rgb(${tone},${tone},${tone})`;
    ctx.beginPath(); ctx.moveTo(-20,h); prof.forEach(([x,y])=>ctx.lineTo(x,y)); ctx.lineTo(w+20,h); ctx.closePath(); ctx.fill();
    // a brushed edge, not a cut one: the crest painted over a few times, loosely
    for(let pass=0;pass<3;pass++){
      const jit=unit*0.004*(pass+1);
      ctx.globalAlpha=0.22; ctx.strokeStyle=`rgb(${tone},${tone},${tone})`; ctx.lineWidth=unit*0.006*(1+pass);
      ctx.beginPath();
      prof.forEach(([x,y],j)=>{ const yy=y+(Math.random()-0.35)*jit; j?ctx.lineTo(x,yy):ctx.moveTo(x,yy); });
      ctx.stroke();
    }
    // work it over with dabs that follow the ground
    const dabs=Math.round(w/(unit*0.004)*(0.4+t)*(B.dab==='leaf'?1.6:1));
    for(let d=0;d<dabs;d++){
      const k=Math.floor(Math.random()*(prof.length-1)), [x0,y0]=prof[k], [x1,y1]=prof[k+1];
      const slope=Math.atan2(y1-y0,x1-x0);
      const depthInto=Math.pow(Math.random(),1.8)*unit*(0.02+t*0.12);
      const x=x0+(Math.random()-0.5)*6, y=y0+depthInto;
      const tn=Math.max(0,Math.min(255,tone+(Math.random()-0.5)*(44+t*56)));      // visible brushwork
      const len=unit*(B.dab==='long'?0.03:B.dab==='rock'?0.012:0.008)*(0.5+t)*zoom;
      const ang=B.dab==='grass'?-Math.PI/2+(Math.random()-0.5)*0.5 : B.dab==='leaf'?Math.random()*Math.PI : slope+(Math.random()-0.5)*0.3;
      ctx.globalAlpha=0.35+Math.random()*0.35; ctx.strokeStyle=`rgb(${tn|0},${tn|0},${tn|0})`;
      ctx.lineWidth=Math.max(0.8,unit*0.0025*(0.4+t*1.4)); ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+Math.cos(ang)*len, y+Math.sin(ang)*len); ctx.stroke();
    }
    // a soft haze where each band meets the air behind it
    ctx.globalAlpha=0.12*(1-t); ctx.strokeStyle='rgb(200,200,200)'; ctx.lineWidth=unit*0.01;
    ctx.beginPath(); prof.forEach(([x,y],j)=>j?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.stroke();
  }
  ctx.globalAlpha=1;
  return c;
}
