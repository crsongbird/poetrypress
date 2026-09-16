/**
 * textureGenerators.js — every procedural background texture, plus the
 * seeded RNG and invert-aware compositing that back them.
 *
 * Public surface is just ONE function: getTextureCanvas(type, w, h, accent1,
 * accent2, invert, seed) -> an offscreen <canvas> ready to be drawn onto the
 * poem canvas by canvasRenderer.js. Everything else here is a private
 * implementation detail of one texture or a helper shared by a few.
 *
 * TABLE OF CONTENTS (roughly grouped by kind, in file order)
 *   Seeded RNG           mulberry32, withSeed -- withSeed temporarily swaps
 *                        out the global Math.random for the duration of one
 *                        generation call, so every generator below can just
 *                        call Math.random() as normal and get deterministic,
 *                        seed-reproducible output for free. See
 *                        getTextureCanvas's cache-key, which includes the
 *                        seed, and invertTextureCanvas, which post-processes
 *                        the result for the invert toggle.
 *   Noise/fBm helpers    makeNoiseGrid, sampleNoiseGrid -- the smooth-
 *                        interpolated value-noise grid that every fBm-based
 *                        texture below (Cloud Haze, Ink Spatter, Cratered
 *                        Surface, Terrain Relief) builds its octaves from.
 *   Color helpers        mixHex, darkenRgb -- used by textures whose color
 *                        comes from the live accent1/accent2 picks rather
 *                        than a fixed palette (Glowing Embers, Magic
 *                        Sparkle, Starfield).
 *   Particle/scatter     genWaterspots, drawBlurredNoiseLayers, genFlowers
 *   textures             (+drawFlower), genAstralFog, genAstralStars,
 *                        genSnow, genLeaves (+drawLeafShape),
 *                        genMagicParticles (+drawSparkleGlint),
 *                        genRainStreaks, genEmbers, genBokeh
 *   Noise-field /        genClouds, genInkBleed (the "spatter" clustering
 *   organic textures     technique), genCrackedGlaze, genLeather
 *   Geometric textures   genTessellate, genHalftone
 *   Painterly            genBrushstrokes (+drawBrushStroke) -- builds a
 *                        real tapered-polygon stroke outline rather than
 *                        stroking a path, which is what avoids the
 *                        "looks like a chain of circles" look a naive
 *                        round-linecap stroke gets at these widths.
 *   Relief-map textures  drawKnockoutCircle (shared: erase-then-redraw so a
 *                        crater/feature genuinely knocks out what's under
 *                        it instead of alpha-blending over it),
 *                        genAlienSurface (Cratered Surface),
 *                        genHabitableSurface (Terrain Relief -- height-
 *                        field coastline threshold + quantized elevation
 *                        bands + ridged-fBm mountains + dark-to-dark
 *                        branching rivers)
 *   invertTextureCanvas  Post-processes a finished texture for the Invert
 *                        toggle by flipping RGB per pixel (alpha untouched,
 *                        which matters for the transparent-background
 *                        particle textures).
 *   getTextureCanvas     The dispatch table + cache. THE public export.
 *
 * This module has NO imports. It never touches the DOM, a poem, or a font --
 * drop it into an unrelated canvas project and it would work unmodified.
 *
 * A NOTE ON COLOR-BURN / COLOR-DODGE TEXTURES (Ink Spatter, Cratered
 * Surface, Terrain Relief): these composite through color-burn (normal) /
 * color-dodge (inverted) rather than plain overlay. color-burn's darkening
 * math only clamps to true black when the SOURCE pixel is genuinely near 0
 * -- "dark" (e.g. 60/255) is not enough and will read as a barely-visible
 * midtone no matter how high the opacity slider goes. Any new texture added
 * to that blend-mode category needs its darkest values pushed close to 0,
 * not just "darker than the rest" -- this bit us twice this project (the
 * ink-spatter droplets, then the crack/river redesign) before it stuck.
 */

function makeNoiseGrid(gw, gh){
  const g = new Float32Array(gw*gh);
  for(let i=0;i<g.length;i++) g[i] = Math.random();
  return g;
}

function sampleNoiseGrid(grid, gw, gh, x, y){
  const x0 = ((Math.floor(x) % gw) + gw) % gw;
  const y0 = ((Math.floor(y) % gh) + gh) % gh;
  const x1 = (x0+1) % gw, y1 = (y0+1) % gh;
  const fx = x - Math.floor(x), fy = y - Math.floor(y);
  const sx = fx*fx*(3-2*fx), sy = fy*fy*(3-2*fy); // smoothstep
  const v00 = grid[y0*gw+x0], v10 = grid[y0*gw+x1];
  const v01 = grid[y1*gw+x0], v11 = grid[y1*gw+x1];
  const a = v00 + (v10-v00)*sx;
  const b = v01 + (v11-v01)*sx;
  return a + (b-a)*sy;
}

function genClouds(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const workDiv = Math.max(1, 4 * zoom);
  const workW = Math.max(24, Math.round(w/workDiv));
  const workH = Math.max(24, Math.round(h/workDiv));

  const octaves = 6;
  const gain = 0.5;
  const lacunarity = 2.0;
  const baseCells = 4;
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
      // Billow: how hard the field swings away from neutral grey
      const val = 128 + (108 - 128 + density*140) * amt;
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

function drawFlower(ctx, cx, cy, R, petals, rot, shade){
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.beginPath();
  const steps = 90;
  for(let i=0;i<=steps;i++){
    const theta = (i/steps)*Math.PI*2;
    const r = R * Math.abs(Math.cos(petals*theta/2));
    const x = r*Math.cos(theta), y = r*Math.sin(theta);
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath();
  ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0,0,R*0.14,0,Math.PI*2);
  const cShade = Math.min(255, shade+28);
  ctx.fillStyle = `rgb(${cShade},${cShade},${cShade})`;
  ctx.fill();
  ctx.restore();
}

function genFlowers(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const c = document.createElement('canvas');
  c.width=w; c.height=h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0,0,w,h);

  const unit = Math.min(w,h);
  const count = Math.max(2, Math.round((w*h)/95000 * amt));

  // A lotus petal is BROAD and ROUND -- widest near the middle, blunt at the
  // tip. Two earlier attempts used quadratic curves pulling straight from the
  // base to the tip, which always produces a point; that is why it kept
  // coming out as a starburst. Cubics let the flanks bulge outward and then
  // turn over the tip, which is the whole difference.
  const petal = (cx, cy, a, len, wide) => {
    const dx = Math.cos(a), dy = Math.sin(a);
    const px = Math.cos(a + Math.PI/2), py = Math.sin(a + Math.PI/2);
    const at = (along, across) => [ cx + dx*len*along + px*wide*across,
                                    cy + dy*len*along + py*wide*across ];
    const [x1,y1] = at(0.18,  1.00);   // flank swells early
    const [x2,y2] = at(0.72,  0.92);   // still wide near the top
    const [tx,ty] = at(1.00,  0.00);   // blunt tip
    const [x3,y3] = at(0.72, -0.92);
    const [x4,y4] = at(0.18, -1.00);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.bezierCurveTo(x1, y1, x2, y2, tx, ty);
    ctx.bezierCurveTo(x3, y3, x4, y4, cx, cy);
    ctx.closePath();
  };

  for(let i=0;i<count;i++){
    const cx = Math.random()*w, cy = Math.random()*h;
    const R = unit*(0.040 + Math.random()*0.028) * zoom;
    const rot = Math.random()*Math.PI*2;
    const dark = Math.random() < 0.5;
    const tone = dark ? 54 : 220;
    const ink = `rgb(${tone},${tone},${tone})`;
    const alpha = 0.5 + Math.random()*0.3;

    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineWidth = Math.max(0.5, R*0.018);

    // three rings, each shorter and each offset, so petals interlock
    const rings = [
      { n: 10, len: 1.00, wide: 0.34, a: alpha*0.42, off: 0.0 },
      { n: 9,  len: 0.70, wide: 0.30, a: alpha*0.60, off: 0.5 },
      { n: 7,  len: 0.46, wide: 0.27, a: alpha*0.78, off: 0.25 },
    ];
    for(const ring of rings){
      ctx.globalAlpha = ring.a;
      for(let k=0;k<ring.n;k++){
        const a = rot + ((k + ring.off)/ring.n)*Math.PI*2;
        petal(cx, cy, a, R*ring.len, R*ring.wide);
        ctx.fill();
        ctx.globalAlpha = Math.min(1, ring.a*1.5);
        ctx.stroke();
        ctx.globalAlpha = ring.a;
      }
    }

    // stamens: a dense fringe, short and straight
    ctx.globalAlpha = alpha*0.85;
    ctx.lineWidth = Math.max(0.35, R*0.010);
    const stamens = 30 + Math.floor(Math.random()*14);
    for(let k=0;k<stamens;k++){
      const a = rot + (k/stamens)*Math.PI*2 + (Math.random()-0.5)*0.05;
      const r0 = R*0.155, r1 = R*(0.24 + Math.random()*0.05);
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(a)*r0, cy+Math.sin(a)*r0);
      ctx.lineTo(cx+Math.cos(a)*r1, cy+Math.sin(a)*r1);
      ctx.stroke();
    }

    // seed pod: flat disc, pricked
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(cx, cy, R*0.145, 0, Math.PI*2);
    ctx.fill();
    const holeTone = dark ? 205 : 46;
    ctx.fillStyle = `rgb(${holeTone},${holeTone},${holeTone})`;
    const holes = 8 + Math.floor(Math.random()*5);
    for(let k=0;k<holes;k++){
      const a = (k/holes)*Math.PI*2 + rot;
      const rr = R*(0.04 + Math.random()*0.065);
      ctx.beginPath();
      ctx.arc(cx+Math.cos(a)*rr, cy+Math.sin(a)*rr, Math.max(0.4, R*0.017), 0, Math.PI*2);
      ctx.fill();
    }
    ctx.fillStyle = ink;
  }
  ctx.globalAlpha = 1;
  return c;
}

function genAstralFog(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const workDiv = Math.max(1, 4 * zoom);
  const workW = Math.max(24, Math.round(w/workDiv));
  const workH = Math.max(24, Math.round(h/workDiv));

  const octaves = 8;
  const gain = 0.55;
  const lacunarity = 2.0;
  const baseCells = 3;
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

function genAstralStars(w,h,accent1,accent2,amt,zoom){
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

// Craters "knock out" whatever's beneath them (erase via destination-out
// using a soft-edged radial alpha mask, then draw fresh shading into that now-
// clean area) rather than just blending over it — this is what keeps a crater
// reading as a crisp bowl+rim rather than a muddy blend with the noise under it.
function genInkBleed(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const c = document.createElement('canvas');
  c.width=w; c.height=h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0,0,w,h);

  // The previous attempt drew opaque black lobes across most of the half and,
  // composited through color-burn, turned the whole card black. A real card is
  // mostly EMPTY paper: one compact figure near the fold, then nothing.
  const half = document.createElement('canvas');
  half.width = Math.max(1, Math.ceil(w/2)); half.height = h;
  const hx = half.getContext('2d');
  const HW = half.width;
  const unit = Math.min(w,h);

  const blots = 2 + Math.floor(Math.random()*2);
  for(let b=0;b<blots;b++){
    const cy = h*(0.26 + (b/Math.max(1,blots-1||1))*0.46 + (Math.random()-0.5)*0.05);
    // the figure stays close to the crease and covers a modest span
    const reach = HW * (0.16 + Math.random()*0.16) * zoom;
    const lobes = 5 + Math.floor(Math.random()*4);

    for(let l=0;l<lobes;l++){
      const t = l/lobes;
      const dist = Math.pow(Math.random(), 1.8) * reach;
      const px = HW - dist;
      const py = cy + (Math.random()-0.5) * unit * 0.10;
      const rr = unit * (0.014 + Math.random()*0.030) * zoom * (1 - t*0.4) * amt;
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

function genCrackedGlaze(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const workDiv = Math.max(1, 5 * zoom);
  const workW = Math.max(24, Math.round(w/workDiv));
  const workH = Math.max(24, Math.round(h/workDiv));

  const seedCount = Math.max(6, Math.round(26 * amt));
  const seeds = [];
  for(let i=0;i<seedCount;i++) seeds.push([Math.random()*workW, Math.random()*workH]);

  const crackWidth = 0.045;
  const small = document.createElement('canvas');
  small.width=workW; small.height=workH;
  const sctx = small.getContext('2d');
  const img = sctx.createImageData(workW, workH);
  const d = img.data;

  for(let py=0; py<workH; py++){
    for(let px=0; px<workW; px++){
      let d1=Infinity, d2=Infinity;
      for(const [sx,sy] of seeds){
        const dx=px-sx, dy=py-sy;
        const dist = dx*dx+dy*dy;
        if(dist<d1){ d2=d1; d1=dist; } else if(dist<d2){ d2=dist; }
      }
      const r1=Math.sqrt(d1), r2=Math.sqrt(d2);
      const diff = (r2-r1)/(r2+1e-6);
      const idx=(py*workW+px)*4;
      const val = diff < crackWidth ? 55 : 185;
      d[idx]=val; d[idx+1]=val; d[idx+2]=val; d[idx+3]=255;
    }
  }
  sctx.putImageData(img,0,0);

  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');
  fctx.imageSmoothingEnabled = true;
  fctx.drawImage(small,0,0,w,h);
  return full;
}

function genBokeh(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');
  fctx.fillStyle = 'rgb(126,126,126)';
  fctx.fillRect(0,0,w,h);

  const count = Math.max(3, Math.round((w*h)/140000 * amt));
  for(let i=0;i<count;i++){
    const x=Math.random()*w, y=Math.random()*h;
    const r = (Math.random()*0.06+0.03)*Math.max(w,h) * zoom;
    const bright = 150+Math.random()*55;
    const grad = fctx.createRadialGradient(x,y,0,x,y,r);
    grad.addColorStop(0, `rgba(${bright},${bright},${bright},0.55)`);
    grad.addColorStop(0.6, `rgba(${bright},${bright},${bright},0.22)`);
    grad.addColorStop(1, `rgba(${bright},${bright},${bright},0)`);
    fctx.fillStyle = grad;
    fctx.beginPath(); fctx.arc(x,y,r,0,Math.PI*2); fctx.fill();
  }
  return full;
}

function genEmbers(w,h,accent1,accent2,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');

  const count = Math.round((w*h)/3200 * amt);
  for(let i=0;i<count;i++){
    const x = Math.random()*w, y = Math.random()*h;
    const roll = Math.random();
    let size, trailLen;
    if(roll<0.6){ size=1; trailLen=(Math.random()*0.02+0.01)*Math.max(w,h); }
    else if(roll<0.88){ size=1.6+Math.random()*1.2; trailLen=(Math.random()*0.035+0.015)*Math.max(w,h); }
    else { size=2.6+Math.random()*2; trailLen=(Math.random()*0.05+0.025)*Math.max(w,h); }
    size *= zoom; trailLen *= zoom;

    const t = Math.random();
    const {r,g,b} = mixHex(accent1, accent2, t);

    const trailGrad = fctx.createLinearGradient(x, y, x, y-trailLen);
    trailGrad.addColorStop(0, `rgba(${r},${g},${b},0.85)`);
    trailGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    fctx.strokeStyle = trailGrad;
    fctx.lineWidth = Math.max(1, size*0.7);
    fctx.beginPath();
    fctx.moveTo(x,y);
    fctx.lineTo(x + (Math.random()*2-1)*trailLen*0.15, y-trailLen);
    fctx.stroke();

    const dotGrad = fctx.createRadialGradient(x,y,0,x,y,size);
    dotGrad.addColorStop(0, `rgba(${r},${g},${b},0.95)`);
    dotGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    fctx.fillStyle = dotGrad;
    fctx.beginPath(); fctx.arc(x,y,size,0,Math.PI*2); fctx.fill();
  }
  return full;
}

function genTessellate(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');
  fctx.fillStyle='rgb(128,128,128)';
  fctx.fillRect(0,0,w,h);

  const cell = (Math.max(w,h)/14) * zoom;
  const jitterAmt = amt;
  const cols = Math.ceil(w/cell)+1;
  const rows = Math.ceil(h/cell)+1;

  for(let ry=0; ry<rows; ry++){
    for(let rx=0; rx<cols; rx++){
      const x0=rx*cell, y0=ry*cell;
      const flip = (rx+ry)%2===0;
      const shadeA = 106+Math.random()*44;
      const shadeB = 106+Math.random()*44;

      // Irregularity nudges each vertex off the lattice; at 0 this is a
      // clean tiling, at full it is a shattered one.
      const J = cell * 0.30 * jitterAmt;
      const jit = () => (Math.random()-0.5) * J;
      fctx.beginPath();
      if(flip){ fctx.moveTo(x0+jit(),y0+jit()); fctx.lineTo(x0+cell+jit(),y0+jit()); fctx.lineTo(x0+jit(),y0+cell+jit()); }
      else { fctx.moveTo(x0+cell+jit(),y0+jit()); fctx.lineTo(x0+cell+jit(),y0+cell+jit()); fctx.lineTo(x0+jit(),y0+jit()); }
      fctx.closePath();
      fctx.fillStyle = `rgb(${shadeA},${shadeA},${shadeA})`;
      fctx.fill();

      fctx.beginPath();
      if(flip){ fctx.moveTo(x0+cell,y0); fctx.lineTo(x0+cell,y0+cell); fctx.lineTo(x0,y0+cell); }
      else { fctx.moveTo(x0,y0); fctx.lineTo(x0,y0+cell); fctx.lineTo(x0+cell,y0+cell); }
      fctx.closePath();
      fctx.fillStyle = `rgb(${shadeB},${shadeB},${shadeB})`;
      fctx.fill();
    }
  }
  return full;
}

// Shared color helpers for textures that take on the current accent colors
// instead of a fixed palette (embers, magic particles, and astral's stars).
export function mixHex(hexA, hexB, t){
  const a = hexA.replace('#',''), b = hexB.replace('#','');
  const ar=parseInt(a.substr(0,2),16), ag=parseInt(a.substr(2,2),16), ab=parseInt(a.substr(4,2),16);
  const br=parseInt(b.substr(0,2),16), bg=parseInt(b.substr(2,2),16), bb=parseInt(b.substr(4,2),16);
  return {
    r: Math.round(ar+(br-ar)*t),
    g: Math.round(ag+(bg-ag)*t),
    b: Math.round(ab+(bb-ab)*t),
  };
}
function darkenRgb(hex, amount){
  const h = hex.replace('#','');
  const r=parseInt(h.substr(0,2),16), g=parseInt(h.substr(2,2),16), b=parseInt(h.substr(4,2),16);
  return { r: Math.round(r*(1-amount)), g: Math.round(g*(1-amount)), b: Math.round(b*(1-amount)) };
}

// Flurries: soft round flakes on a transparent canvas (composited with 'lighten' so
// they always read bright regardless of background) — mostly small/sharp, a few
// larger and softer, like flakes drifting slightly out of focus.
function genSnow(w,h,amt,zoom){
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
function drawSparkleGlint(ctx, x, y, size, r, g, b){
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
function genMagicParticles(w,h,accent1,accent2,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');

  const count = Math.round((w*h)/2800 * amt);
  for(let i=0;i<count;i++){
    const t = Math.random();
    const {r,g,b} = mixHex(accent1, accent2, t);
    const x = Math.random()*w, y = Math.random()*h;
    const roll = Math.random();

    if(roll < 0.5){
      const size = (1+Math.random()*3) * zoom;
      const grad = fctx.createRadialGradient(x,y,0,x,y,size);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.95)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      fctx.fillStyle = grad;
      fctx.beginPath(); fctx.arc(x,y,size,0,Math.PI*2); fctx.fill();
    } else if(roll < 0.85){
      const size = (1.4+Math.random()*1.8) * zoom;
      const trailLen = (Math.random()*0.035+0.015)*Math.max(w,h);
      const dir = Math.random()*Math.PI*2;
      const ex = x+Math.cos(dir)*trailLen, ey = y+Math.sin(dir)*trailLen;
      const perpX = -Math.sin(dir)*trailLen*0.3, perpY = Math.cos(dir)*trailLen*0.3;
      const midX = (x+ex)/2+perpX, midY = (y+ey)/2+perpY;
      fctx.save();
      fctx.strokeStyle = `rgba(${r},${g},${b},0.6)`;
      fctx.lineWidth = Math.max(0.8, size*0.6);
      fctx.beginPath();
      fctx.moveTo(x,y);
      fctx.quadraticCurveTo(midX, midY, ex, ey);
      fctx.stroke();
      fctx.restore();

      const grad = fctx.createRadialGradient(x,y,0,x,y,size);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.95)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      fctx.fillStyle = grad;
      fctx.beginPath(); fctx.arc(x,y,size,0,Math.PI*2); fctx.fill();
    } else {
      const size = (3+Math.random()*4) * zoom;
      drawSparkleGlint(fctx, x, y, size, r, g, b);
    }
  }
  return full;
}

// Downpour: diagonal falling streaks — a distinct linear-gradient-stroke pattern,
// not the static blob stains that Water Spots uses.
function genRainStreaks(w,h,amt,angle,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const slant = ((angle==null?0:angle) * Math.PI) / 180;
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');
  fctx.fillStyle='rgb(128,128,128)';
  fctx.fillRect(0,0,w,h);

  // -14deg is the resting slant; the Slant knob tilts from there
  const angleRad = (-14*Math.PI/180) + slant;
  const count = Math.round((w*h)/3800 * amt);
  for(let i=0;i<count;i++){
    const x = Math.random()*w*1.3 - w*0.15;
    const y = Math.random()*h;
    const len = (Math.random()*0.11+0.05)*Math.max(w,h) * zoom;
    const dx = Math.sin(angleRad)*len, dy = Math.cos(angleRad)*len;
    const bright = Math.random()<0.5 ? (35+Math.random()*35) : (210+Math.random()*40);
    const grad = fctx.createLinearGradient(x,y,x+dx,y+dy);
    grad.addColorStop(0, `rgba(${bright},${bright},${bright},0)`);
    grad.addColorStop(0.18, `rgba(${bright},${bright},${bright},0.9)`);
    grad.addColorStop(0.82, `rgba(${bright},${bright},${bright},0.9)`);
    grad.addColorStop(1, `rgba(${bright},${bright},${bright},0)`);
    fctx.strokeStyle = grad;
    fctx.lineWidth = 1.4+Math.random()*2.2;
    fctx.beginPath(); fctx.moveTo(x,y); fctx.lineTo(x+dx,y+dy); fctx.stroke();
  }
  return full;
}

// Hidebound: a high-intensity paper-like grain base, plus a much-more-tiled,
// much-lower-intensity crackle layer generated at a vertically squished working
// resolution then stretched back to full height — elongating every cell so the
// grain reads as vertically stretched, like natural leather.
// Dotwork: a regular dot grid (classic print halftone) where each dot's radius is
// modulated by a coarse noise field — genuinely geometric (fixed grid spacing)
// but with organic size variation, distinct from Squares' flat-shaded triangles.
function genHalftone(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');
  fctx.fillStyle = 'rgb(205,205,205)';
  fctx.fillRect(0,0,w,h);

  const fieldGW = 10, fieldGH = Math.max(2, Math.round(10*(h/w)));
  const field = makeNoiseGrid(fieldGW, fieldGH);

  const cell = (Math.max(w,h)/48) * zoom;
  const cols = Math.ceil(w/cell), rows = Math.ceil(h/cell);
  fctx.fillStyle = 'rgb(60,60,60)';
  for(let ry=0; ry<rows; ry++){
    for(let rx=0; rx<cols; rx++){
      const cx = rx*cell+cell/2, cy = ry*cell+cell/2;
      const nx = (rx/cols)*(fieldGW-1), ny = (ry/rows)*(fieldGH-1);
      const v = sampleNoiseGrid(field, fieldGW, fieldGH, nx, ny);
      const r = v*cell*0.48*amt;
      if(r < 0.6) continue;
      fctx.beginPath();
      fctx.arc(cx, cy, r, 0, Math.PI*2);
      fctx.fill();
    }
  }
  return full;
}

// Impasto: scattered curved, tapered strokes (thin at both ends, thick in the
// middle, drawn as a run of short segments rather than a single stroke() call so
// each one can taper) — a painterly, "highly stylistic" texture rather than a
// noise field or point scatter.
function drawBrushStroke(ctx, x, y, length, angle, tone, alpha){
  const ex = x+Math.cos(angle)*length, ey = y+Math.sin(angle)*length;
  const perpAng = angle+Math.PI/2;
  const wob1 = (Math.random()*2-1)*length*0.3;
  const wob2 = (Math.random()*2-1)*length*0.2;
  const c1x = x + Math.cos(angle)*length*0.33 + Math.cos(perpAng)*wob1;
  const c1y = y + Math.sin(angle)*length*0.33 + Math.sin(perpAng)*wob1;
  const c2x = x + Math.cos(angle)*length*0.66 + Math.cos(perpAng)*wob2;
  const c2y = y + Math.sin(angle)*length*0.66 + Math.sin(perpAng)*wob2;

  const samples = 24;
  const pts = [];
  for(let i=0;i<=samples;i++){
    const t = i/samples, mt = 1-t;
    pts.push([
      mt*mt*mt*x + 3*mt*mt*t*c1x + 3*mt*t*t*c2x + t*t*t*ex,
      mt*mt*mt*y + 3*mt*mt*t*c1y + 3*mt*t*t*c2y + t*t*t*ey,
    ]);
  }

  // Build one continuous tapered outline (wide at the middle, narrow at both ends,
  // with a little per-sample width jitter for a bristled edge) instead of stroking
  // separate short segments — that's what was reading as a chain of circles before.
  const baseWidth = length*(0.05+Math.random()*0.06);
  const leftPts = [], rightPts = [];
  for(let i=0;i<=samples;i++){
    const t = i/samples;
    const taper = Math.pow(Math.sin(Math.PI*t), 0.6);
    const jitter = 0.75+Math.random()*0.5;
    const halfW = (baseWidth*taper*jitter)/2;
    const [cx,cy] = pts[i];
    const [nx,ny] = pts[Math.min(samples,i+1)];
    const dx = nx-cx, dy = ny-cy;
    const segLen = Math.hypot(dx,dy) || 1;
    const px = -dy/segLen, py = dx/segLen;
    leftPts.push([cx+px*halfW, cy+py*halfW]);
    rightPts.push([cx-px*halfW, cy-py*halfW]);
  }

  ctx.beginPath();
  ctx.moveTo(leftPts[0][0], leftPts[0][1]);
  for(const [px,py] of leftPts) ctx.lineTo(px,py);
  for(let i=rightPts.length-1;i>=0;i--) ctx.lineTo(rightPts[i][0], rightPts[i][1]);
  ctx.closePath();
  ctx.fillStyle = `rgba(${tone},${tone},${tone},${alpha})`;
  ctx.fill();

  // a couple of thin dry-brush streaks running alongside for a bristled feel
  for(let s=0;s<2;s++){
    const off = (Math.random()*2-1)*baseWidth*0.6;
    ctx.beginPath();
    for(let i=0;i<=samples;i++){
      const [cx,cy] = pts[i];
      const [nx,ny] = pts[Math.min(samples,i+1)];
      const dx=nx-cx, dy=ny-cy; const segLen=Math.hypot(dx,dy)||1;
      const px=-dy/segLen, py=dx/segLen;
      const sx = cx+px*off, sy = cy+py*off;
      if(i===0) ctx.moveTo(sx,sy); else ctx.lineTo(sx,sy);
    }
    ctx.strokeStyle = `rgba(${tone},${tone},${tone},${alpha*0.4})`;
    ctx.lineWidth = 0.6+Math.random()*0.8;
    ctx.stroke();
  }
}
function genBrushstrokes(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');
  fctx.fillStyle='rgb(128,128,128)';
  fctx.fillRect(0,0,w,h);

  const count = Math.max(5, Math.round((w*h)/85000 * amt));
  const unit = Math.max(w,h);

  for(let i=0;i<count;i++){
    const x0 = Math.random()*w, y0 = Math.random()*h;
    const ang = Math.random()*Math.PI*2;
    const length = (Math.random()*0.16+0.08)*unit * zoom;
    const width  = unit*(0.006 + Math.random()*0.016) * zoom;
    const dark = Math.random() < 0.5;
    const tone = dark ? 62 : 206;

    // A brush is many bristles, not one line. Each filament runs the length
    // of the stroke at its own offset, drifting apart as it goes -- which is
    // the fanning that a single tapered polygon could never produce, and why
    // this used to read as a scratch rather than a stroke.
    const bristles = 7 + Math.floor(Math.random()*9);
    const curve = (Math.random()-0.5) * 0.8;      // the whole stroke bends
    const fan = 0.6 + Math.random()*1.4;          // how far the bristles splay

    for(let b=0;b<bristles;b++){
      const off = ((b/(bristles-1)) - 0.5) * width * 2;
      fctx.globalAlpha = (0.10 + Math.random()*0.30) * (1 - Math.abs(off)/(width*2.2));
      fctx.strokeStyle = `rgb(${tone},${tone},${tone})`;
      fctx.lineWidth = Math.max(0.4, width*0.16*(0.6+Math.random()*0.8));
      fctx.lineCap = 'round';

      fctx.beginPath();
      const steps = 12;
      for(let sIdx=0; sIdx<=steps; sIdx++){
        const t = sIdx/steps;
        // bristles start together and drift apart toward the tail
        const splay = off * (1 + t*fan);
        const a = ang + curve*t;
        const px = x0 + Math.cos(a)*length*t + Math.cos(a+Math.PI/2)*splay;
        const py = y0 + Math.sin(a)*length*t + Math.sin(a+Math.PI/2)*splay;
        if(sIdx===0) fctx.moveTo(px,py); else fctx.lineTo(px,py);
      }
      fctx.stroke();
    }
  }
  fctx.globalAlpha = 1;
  return full;
}

function invertTextureCanvas(srcCanvas){
  const w = srcCanvas.width, h = srcCanvas.height;
  const tmp = document.createElement('canvas');
  tmp.width = w; tmp.height = h;
  const tctx = tmp.getContext('2d');
  tctx.drawImage(srcCanvas, 0, 0);
  const imgData = tctx.getImageData(0,0,w,h);
  const d = imgData.data;
  for(let i=0;i<d.length;i+=4){
    d[i] = 255-d[i];
    d[i+1] = 255-d[i+1];
    d[i+2] = 255-d[i+2];
    // alpha (d[i+3]) is left untouched — matters for the transparent-canvas
    // particle textures (snow, embers, wisps, astral stars), where only the
    // particle pixels carry any alpha and everywhere else should stay invisible.
  }
  tctx.putImageData(imgData,0,0);
  return tmp;
}

// Seeded PRNG (mulberry32) so a given seed always produces the same texture
// pattern. Rather than threading an rng param through all 18+ generator
// functions, withSeed() temporarily substitutes the global Math.random for the
// duration of one texture generation call, then restores it — every generator
// still just calls Math.random() as before, it's transparently deterministic
// whenever it's actually needed.
function mulberry32(seed){
  return function(){
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function withSeed(seed, fn){
  const original = Math.random;
  Math.random = mulberry32(seed >>> 0);
  try { return fn(); }
  finally { Math.random = original; }
}

// A sigil is drawn, then gone —
// the mark remembers nothing.
// Ink on nothing. Ink.
function genSigils(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const c = document.createElement('canvas');
  c.width=w; c.height=h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0,0,w,h);

  const unit = Math.max(w,h);
  const count = Math.max(6, Math.round((38 + Math.random()*26) * amt));

  for(let i=0;i<count;i++){
    const cx = Math.random()*w, cy = Math.random()*h;
    const r = unit*(0.012 + Math.random()*0.038) * zoom;
    // some sigils advance out of the ground, some recede back into it
    const emerging = Math.random() < 0.62;
    const tone = emerging ? 18 : 226;
    const alpha = 0.30 + Math.random()*0.55;
    ctx.strokeStyle = `rgba(${tone},${tone},${tone},${alpha})`;
    ctx.lineWidth = Math.max(0.6, unit*0.0012*(0.5+Math.random()*1.8));
    ctx.lineCap = 'round';

    const strokes = 3 + Math.floor(Math.random()*4);
    const rot = Math.random()*Math.PI*2;
    for(let s=0;s<strokes;s++){
      const a1 = rot + (s/strokes)*Math.PI*2 + (Math.random()-0.5)*0.9;
      const a2 = a1 + (Math.random()-0.5)*2.4;
      const r1 = r*(0.15+Math.random()*0.5);
      const r2 = r*(0.55+Math.random()*0.6);
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(a1)*r1, cy+Math.sin(a1)*r1);
      if(Math.random()<0.4){
        ctx.quadraticCurveTo(cx, cy, cx+Math.cos(a2)*r2, cy+Math.sin(a2)*r2);
      } else {
        ctx.lineTo(cx+Math.cos(a2)*r2, cy+Math.sin(a2)*r2);
      }
      ctx.stroke();
    }
    if(Math.random()<0.45){
      ctx.beginPath();
      ctx.arc(cx, cy, r*(0.2+Math.random()*0.45), 0, Math.PI*2);
      ctx.stroke();
    }
  }
  return c;
}

// Counting backwards from
// a number nobody wrote down.
// The grid keeps the score.
function genMathNoise(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const c = document.createElement('canvas');
  c.width=w; c.height=h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0,0,w,h);

  const cell = Math.max(6, Math.round((Math.max(w,h)/72) * zoom));
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
      ctx.lineWidth = Math.max(0.5, cell*0.09);

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

// Gold beaten so thin
// it forgets it was ever
// heavier than light.
function genMetalLeaf(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const c = document.createElement('canvas');
  c.width=w; c.height=h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0,0,w,h);

  const unit = Math.max(w,h);
  const flakes = Math.max(10, Math.round((120 + Math.random()*90) * amt));

  for(let i=0;i<flakes;i++){
    const cx = Math.random()*w, cy = Math.random()*h;
    const r = unit*(0.015 + Math.random()*0.055) * zoom;
    const sides = 5 + Math.floor(Math.random()*4);
    const rot = Math.random()*Math.PI*2;

    const pts = [];
    for(let s=0;s<sides;s++){
      const a = rot + (s/sides)*Math.PI*2;
      const rr = r*(0.55 + Math.random()*0.7);
      pts.push([cx+Math.cos(a)*rr, cy+Math.sin(a)*rr]);
    }

    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for(let s=1;s<pts.length;s++) ctx.lineTo(pts[s][0], pts[s][1]);
    ctx.closePath();

    const lift = 178 + Math.floor(Math.random()*66);
    ctx.globalAlpha = 0.16 + Math.random()*0.4;
    ctx.fillStyle = `rgb(${lift},${lift},${lift})`;
    ctx.fill();

    // the seam where one leaf overlaps the next
    ctx.globalAlpha = 0.10 + Math.random()*0.25;
    ctx.strokeStyle = 'rgb(48,48,48)';
    ctx.lineWidth = Math.max(0.5, unit*0.0009);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return c;
}


/**
 * TEXTURE_PARAMS — the two knobs each texture exposes, in order.
 *
 * A param whose key is 'zoom' is handled generically by getTextureCanvas:
 * the texture is generated at reduced dimensions and scaled back up, which
 * magnifies the pattern without any generator needing to know about it.
 * Every other param arrives at the generator as `amt`, a plain multiplier
 * around 1.0 that each one applies to whatever its dominant quantity is.
 */
export const TEXTURE_PARAMS = {
  clouds:        [{key:'zoom',  label:'Cloud scale',     min:50, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Billow',          min:30, max:220, def:100, unit:'%'}],
  bokeh:         [{key:'zoom',  label:'Orb size',        min:50, max:300, def:100, unit:'%'},
                  {key:'amt',   label:'Orb count',       min:20, max:260, def:100, unit:'%'}],
  astral:        [{key:'stars', label:'Star density',    min:10, max:300, def:100, unit:'%'},
                  {key:'fog',   label:'Nebula density',  min:0,  max:260, def:100, unit:'%'}],
  magicparticles:[{key:'zoom',  label:'Sparkle size',    min:60, max:600, def:100, unit:'%'},
                  {key:'amt',   label:'Sparkle count',   min:20, max:400, def:100, unit:'%'}],
  embers:        [{key:'zoom',  label:'Ember size',      min:60, max:600, def:100, unit:'%'},
                  {key:'amt',   label:'Ember count',     min:20, max:500, def:100, unit:'%'}],
  snow:          [{key:'zoom',  label:'Flake size',      min:60, max:340, def:100, unit:'%'},
                  {key:'amt',   label:'Snowfall',        min:20, max:260, def:100, unit:'%'}],
  grain:         [{key:'zoom',  label:'Grain size',      min:100,max:600, def:100, unit:'%'},
                  {key:'amt',   label:'Contrast',        min:30, max:240, def:100, unit:'%'}],
  metalleaf:     [{key:'zoom',  label:'Leaf size',       min:60, max:360, def:100, unit:'%'},
                  {key:'amt',   label:'Coverage',        min:20, max:260, def:100, unit:'%'}],
  flowers:       [{key:'zoom',  label:'Bloom size',      min:50, max:450, def:150, unit:'%'},
                  {key:'amt',   label:'Bloom count',     min:10, max:300, def:60,  unit:'%'}],
  brushstrokes:  [{key:'zoom',  label:'Stroke width',    min:60, max:380, def:100, unit:'%'},
                  {key:'amt',   label:'Stroke count',    min:20, max:260, def:100, unit:'%'}],
  halftone:      [{key:'zoom',  label:'Dot scale',       min:50, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Dot weight',      min:30, max:240, def:100, unit:'%'}],
  rainstreaks:   [{key:'zoom',  label:'Rain zoom',       min:100,max:500, def:100, unit:'%'},
                  {key:'angle', label:'Slant',           min:-45,max:45,  def:0,   unit:'°'}],
  sigils:        [{key:'zoom',  label:'Sigil zoom',      min:100,max:500, def:100, unit:'%'},
                  {key:'amt',   label:'Sigil count',     min:15, max:260, def:100, unit:'%'}],
  mathnoise:     [{key:'zoom',  label:'Glyph zoom',      min:100,max:500, def:140, unit:'%'},
                  {key:'amt',   label:'Emergence',       min:30, max:240, def:130, unit:'%'}],
  summoning:     [{key:'zoom',  label:'Circle size',     min:40, max:500, def:100, unit:'%'},
                  {key:'amt',   label:'Circle count',    min:20, max:700, def:100, unit:'%'}],
  inkbleed:      [{key:'zoom',  label:'Blot scale',      min:60, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Spread',          min:30, max:240, def:100, unit:'%'}],
  crackedglaze:  [{key:'zoom',  label:'Fracture scale',  min:60, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Crack density',   min:10, max:900, def:100, unit:'%'}],
  linen:         [{key:'zoom',  label:'Weave scale',     min:50, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Slub frequency',  min:0,  max:400, def:100, unit:'%'}],
  coldpress:     [{key:'zoom',  label:'Tooth scale',     min:50, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Tooth depth',     min:20, max:300, def:100, unit:'%'}],
  foxing:        [{key:'zoom',  label:'Bloom size',      min:40, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Spot count',      min:20, max:400, def:100, unit:'%'}],
  foldghost:     [{key:'zoom',  label:'Crease softness', min:30, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Fold count',      min:25, max:300, def:100, unit:'%'}],
  cupring:       [{key:'zoom',  label:'Ring size',       min:40, max:320, def:100, unit:'%'},
                  {key:'amt',   label:'Ring count',      min:30, max:300, def:100, unit:'%'}],
  wax:           [{key:'zoom',  label:'Pool size',       min:40, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Pool count',      min:25, max:300, def:100, unit:'%'}],
  whorl:         [{key:'zoom',  label:'Print size',      min:50, max:360, def:100, unit:'%'},
                  {key:'amt',   label:'Print count',     min:20, max:320, def:100, unit:'%'}],
  aurora:        [{key:'zoom',  label:'Curtain height',  min:40, max:220, def:100, unit:'%'},
                  {key:'amt',   label:'Ribbon count',    min:20, max:320, def:100, unit:'%'}],
  hatch:         [{key:'angle', label:'Hatch angle',     min:-90,max:90,  def:35,  unit:'°'},
                  {key:'amt',   label:'Line density',    min:25, max:400, def:100, unit:'%'}],
  cards:         [{key:'amt',   label:'Fragment count',  min:20, max:400, def:100, unit:'%'},
                  {key:'angle', label:'Angular scatter', min:0,  max:90,  def:35,  unit:'°'}],
  tessellate:    [{key:'zoom',  label:'Facet size',      min:50, max:400, def:100, unit:'%'},
                  {key:'amt',   label:'Irregularity',    min:0,  max:240, def:100, unit:'%'}],
};


/**
 * TEXTURE_CAPS — what tools each texture can actually use.
 *
 * This is what lets the UI grey out controls instead of offering knobs that
 * do nothing. `blends` is the list of composite modes that make sense for a
 * texture (the first is its default); `light` says whether it reads as
 * relief and therefore responds to a light direction; `tints` is how many
 * colours it accepts, with `tintLabels` naming them in the texture's own
 * terms rather than "colour 1".
 *
 * Only textures that genuinely consume a colour declare tints. The rest are
 * monochrome by construction and take their colour from the blend against
 * the page, which is why their tint controls are disabled rather than
 * silently ignored.
 */
export const TEXTURE_CAPS = {
  // — whimsy —
  clouds:        { blends:['overlay','soft-light','screen','multiply'], light:false, tints:0 },
  bokeh:         { blends:['overlay','screen','lighten','soft-light'],  light:false, tints:0 },
  astral:        { blends:['lighten','screen','overlay','color-dodge'], light:false, tints:2,
                   tintLabels:['Star colour','Nebula colour'], tintDefaults:['accent1','accent2'] },
  magicparticles:{ blends:['lighten','screen','overlay','color-dodge'], light:false, tints:2,
                   tintLabels:['Sparkle colour','Glow colour'], tintDefaults:['accent1','accent2'] },
  embers:        { blends:['lighten','screen','overlay','color-dodge'], light:false, tints:2,
                   tintLabels:['Ember colour','Spark colour'], tintDefaults:['accent1','accent2'] },
  snow:          { blends:['lighten','screen','overlay','soft-light'],  light:false, tints:0 },
  aurora:        { blends:['screen','lighten','overlay','soft-light'],  light:false, tints:0 },
  // — sharpness —
  grain:         { blends:['overlay','soft-light','multiply','screen'], light:false, tints:0 },
  metalleaf:     { blends:['overlay','soft-light','hard-light','screen'], light:false, tints:0 },
  flowers:       { blends:['overlay','soft-light','multiply','screen'], light:false, tints:0 },
  brushstrokes:  { blends:['overlay','soft-light','multiply','screen'], light:false, tints:0 },
  halftone:      { blends:['overlay','multiply','soft-light','screen'], light:false, tints:0 },
  rainstreaks:   { blends:['overlay','soft-light','screen','lighten'],  light:false, tints:0 },
  hatch:         { blends:['overlay','multiply','soft-light','hard-light'], light:false, tints:0 },
  // — chaos —
  sigils:        { blends:['overlay','multiply','soft-light','color-burn'], light:false, tints:0 },
  mathnoise:     { blends:['overlay','multiply','soft-light','screen'], light:false, tints:0 },
  summoning:     { blends:['overlay','multiply','soft-light','screen'], light:false, tints:0 },
  inkbleed:      { blends:['color-burn','multiply','overlay','darken'], light:false, tints:0 },
  crackedglaze:  { blends:['overlay','multiply','soft-light','hard-light'], light:false, tints:0 },
  tessellate:    { blends:['overlay','soft-light','multiply','hard-light'], light:false, tints:0 },
  cards:         { blends:['overlay','multiply','soft-light','screen'], light:false, tints:0 },
  // — 🜚 touch — relief, so soft-light leads and light direction applies
  linen:         { blends:['soft-light','overlay','hard-light','multiply'], light:true, tints:0 },
  coldpress:     { blends:['soft-light','overlay','hard-light','multiply'], light:true, tints:0 },
  foxing:        { blends:['multiply','soft-light','overlay','color-burn'], light:false, tints:1,
                   tintLabels:['Spot colour'], tintDefaults:['#8A6A3C'] },
  foldghost:     { blends:['soft-light','overlay','hard-light','multiply'], light:true, tints:0 },
  cupring:       { blends:['multiply','soft-light','overlay','color-burn'], light:true, tints:1,
                   tintLabels:['Stain colour'], tintDefaults:['#6B4A2F'] },
  wax:           { blends:['hard-light','soft-light','overlay','multiply'], light:true, tints:1,
                   tintLabels:['Wax colour'], tintDefaults:['#7A2B2B'] },
  whorl:         { blends:['soft-light','overlay','hard-light','multiply'], light:true, tints:0 },
};

export function capsFor(type){
  return TEXTURE_CAPS[type] || { blends:['overlay','soft-light','multiply','screen'], light:false, tints:0 };
}
export function defaultBlendFor(type){ return capsFor(type).blends[0]; }

export function paramsFor(type){ return TEXTURE_PARAMS[type] || []; }


// Circles drawn to hold
// something that will not be held.
// Chalk. Then wind. Then chalk.
function genSummoningCircles(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const c = document.createElement('canvas');
  c.width=w; c.height=h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0,0,w,h);

  const unit = Math.min(w,h);
  const circles = Math.max(1, Math.round((2 + Math.random()*2) * amt));

  for(let i=0;i<circles;i++){
    const cx = w*(0.15 + Math.random()*0.7);
    const cy = h*(0.15 + Math.random()*0.7);
    const R  = unit*(0.10 + Math.random()*0.20) * zoom;
    const dark = Math.random() < 0.65;
    const tone = dark ? 24 : 228;
    ctx.strokeStyle = `rgb(${tone},${tone},${tone})`;
    ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
    ctx.globalAlpha = 0.30 + Math.random()*0.42;
    ctx.lineWidth = Math.max(0.7, unit*0.0016);

    const rings = 2 + Math.floor(Math.random()*3);
    for(let r=0;r<rings;r++){
      ctx.beginPath();
      ctx.arc(cx, cy, R*(0.42 + r*(0.58/rings)), 0, Math.PI*2);
      ctx.stroke();
    }

    // the inscribed figure: vertices on the outer ring, joined with a stride
    const pts = 3 + Math.floor(Math.random()*5);
    const rot = Math.random()*Math.PI*2;
    const vert = [];
    for(let k=0;k<pts;k++){
      const a = rot + (k/pts)*Math.PI*2;
      vert.push([cx + Math.cos(a)*R*0.86, cy + Math.sin(a)*R*0.86]);
    }
    const step = pts >= 5 ? 2 : 1;   // 5+ points make a star, fewer a polygon
    ctx.beginPath();
    let idx = 0;
    for(let k=0;k<pts;k++){
      const v = vert[idx];
      if(k===0) ctx.moveTo(v[0], v[1]); else ctx.lineTo(v[0], v[1]);
      idx = (idx + step) % pts;
    }
    ctx.closePath();
    ctx.stroke();

    // tick marks around the rim, where the words would go
    const ticks = 10 + Math.floor(Math.random()*14);
    for(let k=0;k<ticks;k++){
      const a = (k/ticks)*Math.PI*2 + rot*0.3;
      const r1 = R*0.90, r2 = R*(0.97 + Math.random()*0.06);
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(a)*r1, cy+Math.sin(a)*r1);
      ctx.lineTo(cx+Math.cos(a)*r2, cy+Math.sin(a)*r2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(0.8, unit*0.004), 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return c;
}


// Light hung in sheets —
// no particle, no edge, just
// the sky leaning down.
function genAuroraVeil(w,h,amt,zoom){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
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
    const light = Math.random() < 0.75;
    const tone  = light ? 244 : 28;

    // vertical falloff: brightest at the top edge, gone by the hem
    const fall = ctx.createLinearGradient(0, 0, 0, drop);
    fall.addColorStop(0,    `rgba(${tone},${tone},${tone},${light?0.62:0.45})`);
    fall.addColorStop(0.45, `rgba(${tone},${tone},${tone},${light?0.30:0.22})`);
    fall.addColorStop(1,    `rgba(${tone},${tone},${tone},0)`);

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
    ctx.strokeStyle = `rgba(${tone},${tone},${tone},0.5)`;
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

// The plate is scratched
// in one direction, always.
// Patience, then a line.
function genSilverpointHatch(w,h,amt,zoom,angle){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const rad = ((angle==null?35:angle) * Math.PI) / 180;
  const c = document.createElement('canvas');
  c.width=w; c.height=h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0,0,w,h);

  const diag = Math.hypot(w,h);
  // HATCHING means crossed sets. One set of parallel lines is just rain,
  // which is exactly what the first version looked like. Three passes at
  // different angles, tighter spacing, and short strokes rather than
  // full-width rules.
  const passes = [
    { rot: rad,                 weight: 1.00, spacingMul: 1.00 },
    { rot: rad + Math.PI/2.35,  weight: 0.78, spacingMul: 1.25 },
    { rot: rad + Math.PI/4.1,   weight: 0.52, spacingMul: 1.9  },
  ];

  for(const pass of passes){
    const spacing = Math.max(1.6, (diag/230) * pass.spacingMul / amt);
    const lines = Math.ceil(diag/spacing);
    ctx.save();
    ctx.translate(w/2, h/2);
    ctx.rotate(pass.rot);
    for(let i=-lines; i<=lines; i++){
      const y = i*spacing;
      const dark = Math.random() < 0.58;
      const tone = dark ? 48 : 216;
      // an engraver's stroke is short and repeated, not one long rule
      const segments = 2 + Math.floor(Math.random()*3);
      for(let sIdx=0; sIdx<segments; sIdx++){
        const span = diag / segments;
        const x0 = -diag/2 + sIdx*span + Math.random()*span*0.22;
        const x1 = x0 + span*(0.45 + Math.random()*0.45);
        ctx.globalAlpha = (0.10 + Math.random()*0.26) * pass.weight;
        ctx.strokeStyle = `rgb(${tone},${tone},${tone})`;
        ctx.lineWidth = Math.max(0.3, diag*0.00055*(0.6+Math.random()*0.9));
        ctx.beginPath();
        ctx.moveTo(x0, y + (Math.random()-0.5)*spacing*0.3);
        ctx.lineTo(x1, y + (Math.random()-0.5)*spacing*0.3);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  return c;
}

// The deck was dealt once,
// then swept up in a hurry.
// Corners still showing.
function genCartomanticDrift(w,h,amt,zoom,angle){
  amt = (amt==null?1:amt); zoom = (zoom==null?1:zoom);
  const scatter = ((angle==null?35:angle) * Math.PI) / 180;
  const c = document.createElement('canvas');
  c.width=w; c.height=h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0,0,w,h);

  const unit = Math.min(w,h);
  const frags = Math.max(3, Math.round((16 + Math.random()*14) * amt));

  for(let i=0;i<frags;i++){
    const cx = Math.random()*w, cy = Math.random()*h;
    const cw = unit*(0.10 + Math.random()*0.16) * zoom;
    const ch = cw*(1.35 + Math.random()*0.3);
    const rot = (Math.random()-0.5) * 2 * scatter;
    const dark = Math.random() < 0.6;
    const tone = dark ? 30 : 226;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.globalAlpha = 0.22 + Math.random()*0.45;
    ctx.strokeStyle = `rgb(${tone},${tone},${tone})`;
    ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
    ctx.lineWidth = Math.max(0.5, unit*0.0014);

    const kind = Math.floor(Math.random()*3);
    const r = cw*0.14;
    if(kind === 0){
      // a corner: two edges meeting in a rounded turn, the rest torn away
      ctx.beginPath();
      ctx.moveTo(-cw/2, -ch/2 + cw*0.55);
      ctx.lineTo(-cw/2, -ch/2 + r);
      ctx.quadraticCurveTo(-cw/2, -ch/2, -cw/2 + r, -ch/2);
      ctx.lineTo(-cw/2 + cw*0.55, -ch/2);
      ctx.stroke();
      // the index pip, just inside the corner
      ctx.beginPath();
      ctx.arc(-cw/2 + cw*0.20, -ch/2 + cw*0.24, cw*0.05, 0, Math.PI*2);
      ctx.fill();
    } else if(kind === 1){
      // a pip cluster, the way a number card is laid out
      const cols = 2, rows = 2 + Math.floor(Math.random()*2);
      for(let a=0;a<cols;a++){
        for(let b=0;b<rows;b++){
          const px = (a - (cols-1)/2) * cw*0.34;
          const py = (b - (rows-1)/2) * ch*0.26;
          ctx.beginPath();
          ctx.arc(px, py, cw*0.055, 0, Math.PI*2);
          ctx.fill();
        }
      }
    } else {
      // a partial border, broken where the card was torn
      const gapAt = Math.random();
      ctx.beginPath();
      ctx.moveTo(-cw/2, -ch/2 + r);
      ctx.quadraticCurveTo(-cw/2, -ch/2, -cw/2 + r, -ch/2);
      ctx.lineTo(cw/2 - r, -ch/2);
      ctx.quadraticCurveTo(cw/2, -ch/2, cw/2, -ch/2 + r);
      if(gapAt > 0.5) ctx.lineTo(cw/2, ch/2 - r);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  return c;
}


// ---------- 🜚 TOUCH ----------
// These differ from the other three elements in what they claim: not hue
// (Whimsy), not value (Sharpness), not pattern (Chaos), but SURFACE -- what
// the page is made of and what has happened to it. They are the only
// textures that read as relief rather than as image, which is why they take
// a light direction and composite through soft-light rather than overlay.
// Light is given in degrees, 0 = from the top, running clockwise.

function lightVec(light){
  const a = ((light == null ? 315 : light) - 90) * Math.PI / 180;
  return { lx: Math.cos(a), ly: Math.sin(a) };
}
function parseHex(hex){
  const m = mixHex(hex || '#808080', hex || '#808080', 0);
  return m;
}

// Thread over thread over
// thread. Somebody's hands did this
// ten thousand times.
function genLinenTooth(w,h,amt,zoom,light){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const {lx,ly} = lightVec(light);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);

  const pitch = Math.max(2.5, (Math.max(w,h)/240) * zoom);
  const off = Math.max(0.5, pitch*0.16);
  // two interleaved thread directions; the weave is regular, the flaws are not
  for(const vertical of [false, true]){
    const n = Math.ceil((vertical ? w : h)/pitch);
    for(let i=0;i<n;i++){
      const at = i*pitch + pitch*0.5;
      const slub = Math.random() < 0.10*amt;          // a doubled thread
      const wgt = (slub ? 2.1 : 1) * (0.7 + Math.random()*0.6);
      // a slub is a visible NUB where the thread doubled, not merely a
      // heavier line -- so it gets drawn as its own short thick segment
      if(slub){
        const nubs = 1 + Math.floor(Math.random()*2);
        for(let nIdx=0;nIdx<nubs;nIdx++){
        const at2 = Math.random()*(vertical ? h : w);
        const nub = pitch*(4 + Math.random()*9);
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = 'rgb(38,38,38)';
        ctx.lineWidth = Math.max(0.6, pitch*0.62);
        ctx.beginPath();
        if(vertical){ ctx.moveTo(at, at2 - nub/2); ctx.lineTo(at, at2 + nub/2); }
        else { ctx.moveTo(at2 - nub/2, at); ctx.lineTo(at2 + nub/2, at); }
        ctx.stroke();
        }
      }
      ctx.lineWidth = Math.max(0.4, pitch*0.30*wgt);
      // lit face then shadowed face, offset along the light vector
      for(const [shift, tone, a] of [[-1, 226, 0.20], [1, 44, 0.20]]){
        ctx.globalAlpha = a * (slub ? 1.5 : 1);
        ctx.strokeStyle = `rgb(${tone},${tone},${tone})`;
        ctx.beginPath();
        if(vertical){ ctx.moveTo(at + lx*off*shift, 0); ctx.lineTo(at + lx*off*shift, h); }
        else { ctx.moveTo(0, at + ly*off*shift); ctx.lineTo(w, at + ly*off*shift); }
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha=1;
  return c;
}

// The paper says no
// to the pencil, very softly,
// ten thousand times.
function genColdPress(w,h,amt,zoom,light){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const {lx,ly} = lightVec(light);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);

  // dimples, not grain: each pit gets a lit rim and a shadowed floor, which
  // is what separates this from Waking Grain's flat contrast noise
  const r = Math.max(0.8, (Math.max(w,h)/700) * zoom);
  const count = Math.round((w*h)/(r*r*13) * amt);
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
function genFoxing(w,h,amt,zoom,light,tint){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const t = parseHex(tint || '#8A6A3C');
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d');
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
function genFoldGhost(w,h,amt,zoom,light){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const {lx,ly} = lightVec(light);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);

  const folds = Math.max(1, Math.round((2+Math.random()*2)*amt));
  const soft = Math.max(1.5, (Math.max(w,h)/220)*zoom);   // crease sharpness
  for(let i=0;i<folds;i++){
    const vertical = Math.random()<0.5;
    const at = (vertical? w : h) * (0.22+Math.random()*0.56);
    const wobble = (Math.max(w,h))*0.004;
    // a crease is a ridge: one lit face, one shadowed, offset along the light
    for(const [shift,tone,alpha] of [[-1,240,0.34],[1,32,0.30]]){
      const g = vertical
        ? ctx.createLinearGradient(at+lx*soft*shift-soft, 0, at+lx*soft*shift+soft, 0)
        : ctx.createLinearGradient(0, at+ly*soft*shift-soft, 0, at+ly*soft*shift+soft);
      g.addColorStop(0,   `rgba(${tone},${tone},${tone},0)`);
      g.addColorStop(0.5, `rgba(${tone},${tone},${tone},${alpha})`);
      g.addColorStop(1,   `rgba(${tone},${tone},${tone},0)`);
      ctx.fillStyle=g;
      if(vertical) ctx.fillRect(at+lx*soft*shift-soft, 0, soft*2, h);
      else ctx.fillRect(0, at+ly*soft*shift-soft, w, soft*2);
    }
    // the crease itself wanders slightly, the way paper actually creases
    ctx.globalAlpha=0.18; ctx.strokeStyle='rgb(28,28,28)';
    ctx.lineWidth=Math.max(0.4, soft*0.16);
    ctx.beginPath();
    const steps=20;
    for(let sIdx=0;sIdx<=steps;sIdx++){
      const t=sIdx/steps, jitter=(Math.random()-0.5)*wobble;
      if(vertical){ const y=t*h; sIdx?ctx.lineTo(at+jitter,y):ctx.moveTo(at+jitter,y); }
      else { const x=t*w; sIdx?ctx.lineTo(x,at+jitter):ctx.moveTo(x,at+jitter); }
    }
    ctx.stroke(); ctx.globalAlpha=1;
  }
  return c;
}

// Someone set it down
// mid-sentence and forgot it.
// The ring is the proof.
function genCupRing(w,h,amt,zoom,light,tint){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const t = parseHex(tint || '#6B4A2F');
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);

  const unit=Math.min(w,h);
  const rings = Math.max(1, Math.round((1+Math.random()*2)*amt));
  for(let i=0;i<rings;i++){
    const cx=w*(0.15+Math.random()*0.7), cy=h*(0.15+Math.random()*0.7);
    const R=unit*(0.10+Math.random()*0.10)*zoom;
    const gapAt=Math.random()*Math.PI*2;
    const gapW=0.5+Math.random()*0.9;      // where the cup was lifted and dragged
    // the rim holds far more stain than the interior
    ctx.lineWidth=Math.max(1.2, R*0.075);
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
function genPouredWax(w,h,amt,zoom,light,tint){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const {lx,ly}=lightVec(light);
  const t = parseHex(tint || '#7A2B2B');
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);

  const unit=Math.min(w,h);
  const pools=Math.max(1, Math.round((2+Math.random()*2)*amt));
  for(let i=0;i<pools;i++){
    const cx=w*(0.12+Math.random()*0.76), cy=h*(0.12+Math.random()*0.76);
    const R=unit*(0.05+Math.random()*0.055)*zoom;
    const runA=Math.random()*Math.PI*2;          // the direction it ran
    const lobes=9+Math.floor(Math.random()*5);

    // the pool: a rounded blob, thicker on the running side
    ctx.beginPath();
    for(let k=0;k<=lobes;k++){
      const a=(k/lobes)*Math.PI*2;
      const run=1+Math.cos(a-runA)*0.28;
      const rr=R*run*(0.86+Math.random()*0.22);
      const x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr;
      k?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    ctx.closePath();
    ctx.globalAlpha=0.62;
    ctx.fillStyle=`rgb(${t.r},${t.g},${t.b})`;
    ctx.fill();

    // domed interior: lit on the light side, shadowed opposite
    const g=ctx.createRadialGradient(cx-lx*R*0.35, cy-ly*R*0.35, R*0.05, cx, cy, R*1.05);
    g.addColorStop(0,'rgba(255,255,255,0.30)');
    g.addColorStop(0.55,'rgba(255,255,255,0.04)');
    g.addColorStop(1,'rgba(0,0,0,0.28)');
    ctx.globalAlpha=0.9; ctx.fillStyle=g; ctx.fill();

    // raised rim
    ctx.globalAlpha=0.35;
    ctx.lineWidth=Math.max(0.8, R*0.07);
    ctx.strokeStyle='rgba(20,10,10,0.8)';
    ctx.stroke();
  }
  ctx.globalAlpha=1;
  return c;
}

// Never the whole print —
// just enough ridge to prove that
// a hand was here once.
function genWhorl(w,h,amt,zoom,light){
  amt=(amt==null?1:amt); zoom=(zoom==null?1:zoom);
  const {lx,ly}=lightVec(light);
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#808080'; ctx.fillRect(0,0,w,h);

  const unit=Math.min(w,h);
  const prints=Math.max(1, Math.round((3+Math.random()*3)*amt));
  for(let i=0;i<prints;i++){
    const cx=Math.random()*w, cy=Math.random()*h;
    const R=unit*(0.05+Math.random()*0.05)*zoom;
    const rot=Math.random()*Math.PI*2;
    const squash=0.62+Math.random()*0.3;
    const spacing=Math.max(1.1, R*0.055);
    const rings=Math.floor(R/spacing);
    // an arc of the print, never the whole oval
    const arcFrom=Math.random()*Math.PI*2;
    const arcSpan=Math.PI*(0.6+Math.random()*0.9);

    ctx.save();
    ctx.translate(cx,cy); ctx.rotate(rot);
    for(let k=1;k<rings;k++){
      const rr=k*spacing*(1+Math.sin(k*0.8)*0.04);
      for(const [shift,tone,alpha] of [[-1,238,0.16],[1,36,0.13]]){
        ctx.globalAlpha=alpha;
        ctx.strokeStyle=`rgb(${tone},${tone},${tone})`;
        ctx.lineWidth=Math.max(0.35, spacing*0.34);
        ctx.beginPath();
        const steps=30;
        for(let sIdx=0;sIdx<=steps;sIdx++){
          const a=arcFrom+(sIdx/steps)*arcSpan;
          const x=Math.cos(a)*rr + lx*shift*spacing*0.22;
          const y=Math.sin(a)*rr*squash + ly*shift*spacing*0.22;
          sIdx?ctx.lineTo(x,y):ctx.moveTo(x,y);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  ctx.globalAlpha=1;
  return c;
}

// Cache of already-generated textures, keyed by type+dims+colors+invert+seed.
// A plain object here never shrinks -- a long session of seed-rerolling and
// texture-browsing accumulates many multi-megapixel offscreen canvases with
// nothing ever freed, which matters more on mobile (memory pressure gets you
// tab-killed, not just slow). A Map's insertion-order iteration gives
// oldest-first (FIFO) eviction in one line; real LRU would need to track
// access order too, which this app's actual usage doesn't call for.
const TEXTURE_CACHE_MAX_ENTRIES = 40;
const textureCache = new Map();

function buildTexture(type, w, h, accent1, accent2, amt, angle, zoom, light, tint1, tint2){
  let result;  if(type === 'clouds'){
    result = genClouds(w,h,amt,zoom);
  } else if(type === 'flowers'){
    result = genFlowers(w,h,amt,zoom);
  } else if(type === 'inkbleed'){
    result = genInkBleed(w,h,amt,zoom);
  } else if(type === 'crackedglaze'){
    result = genCrackedGlaze(w,h,amt,zoom);
  } else if(type === 'bokeh'){
    result = genBokeh(w,h,amt,zoom);
  } else if(type === 'embers'){
    result = genEmbers(w,h,accent1,accent2,amt,zoom);
  } else if(type === 'tessellate'){
    result = genTessellate(w,h,amt,zoom);
  } else if(type === 'astral_fog'){
    result = genAstralFog(w,h,amt,zoom);
  } else if(type === 'astral_stars'){
    result = genAstralStars(w,h,accent1,accent2,amt,zoom);
  } else if(type === 'snow'){
    result = genSnow(w,h,amt,zoom);
  } else if(type === 'magicparticles'){
    result = genMagicParticles(w,h,accent1,accent2,amt,zoom);
  } else if(type === 'rainstreaks'){
    result = genRainStreaks(w,h,amt,angle,zoom);
  } else if(type === 'halftone'){
    result = genHalftone(w,h,amt,zoom);
  } else if(type === 'brushstrokes'){
    result = genBrushstrokes(w,h,amt,zoom);
  } else if(type === 'sigils'){
    result = genSigils(w,h,amt,zoom);
  } else if(type === 'mathnoise'){
    result = genMathNoise(w,h,amt,zoom);
  } else if(type === 'linen'){
    result = genLinenTooth(w,h,amt,zoom,light);
  } else if(type === 'coldpress'){
    result = genColdPress(w,h,amt,zoom,light);
  } else if(type === 'foxing'){
    result = genFoxing(w,h,amt,zoom,light,tint1);
  } else if(type === 'foldghost'){
    result = genFoldGhost(w,h,amt,zoom,light);
  } else if(type === 'cupring'){
    result = genCupRing(w,h,amt,zoom,light,tint1);
  } else if(type === 'wax'){
    result = genPouredWax(w,h,amt,zoom,light,tint1);
  } else if(type === 'whorl'){
    result = genWhorl(w,h,amt,zoom,light);
  } else if(type === 'aurora'){
    result = genAuroraVeil(w,h,amt,zoom);
  } else if(type === 'hatch'){
    result = genSilverpointHatch(w,h,amt,zoom,angle);
  } else if(type === 'cards'){
    result = genCartomanticDrift(w,h,amt,zoom,angle);
  } else if(type === 'summoning'){
    result = genSummoningCircles(w,h,amt,zoom);
  } else if(type === 'metalleaf'){
    result = genMetalLeaf(w,h,amt,zoom);
  } else {
    let genW = w, genH = h;
    if(type==='grain'){ const gz = 5*zoom; genW=Math.max(1,Math.round(w/gz)); genH=Math.max(1,Math.round(h/gz)); }

    const small = document.createElement('canvas');
    small.width = genW; small.height = genH;
    const sctx = small.getContext('2d');
    const img = sctx.createImageData(genW,genH);
    const d = img.data;
    for(let i=0;i<d.length;i+=4){
      let v;
      if(type==='grain') v = 128+(Math.random()*2-1)*100*amt;
      else v = 205+(Math.random()*2-1)*32;
      d[i]=v; d[i+1]=v; d[i+2]=v; d[i+3]=255;
    }
    sctx.putImageData(img,0,0);

    const full = document.createElement('canvas');
    full.width = w; full.height = h;
    const fctx = full.getContext('2d');
    fctx.imageSmoothingEnabled = true;
    fctx.drawImage(small,0,0,w,h);
    result = full;
  }
  return result;
}

/**
 * The public export. p1/p2 are the two user-facing knobs declared in
 * TEXTURE_PARAMS, both percentages. A param keyed 'zoom' is applied HERE
 * rather than inside any generator: the texture is built at reduced
 * dimensions and scaled back up, which magnifies the pattern uniformly --
 * and costs less to generate, since the work scales with area.
 */
export function getTextureCanvas(type, w, h, accent1, accent2, invert, seed, p1, p2, light, tint1, tint2){
  const defs = paramsFor(type);
  const v1 = (p1 == null) ? (defs[0] ? defs[0].def : 100) : p1;
  const v2 = (p2 == null) ? (defs[1] ? defs[1].def : 100) : p2;

  const colorKeyed = (type === 'embers' || type === 'magicparticles' || type === 'astral_stars');
  const key = (colorKeyed ? `${type}_${w}_${h}_${accent1}_${accent2}` : `${type}_${w}_${h}`)
            + (invert ? '_inv' : '') + `_s${seed}` + `_${v1}_${v2}`
            + (light != null ? `_l${light}` : '')
            + (tint1 ? `_t${tint1}` : '') + (tint2 ? `_u${tint2}` : '');
  if(textureCache.has(key)) return textureCache.get(key);

  let zoom = 1, amt = 1, angle = 0;
  const readParam = (def, val) => {
    if(!def) return;
    if(def.key === 'zoom') zoom = Math.max(1, val/100);
    else if(def.key === 'angle') angle = val;
    else amt = Math.max(0.02, val/100);
  };
  readParam(defs[0], v1);
  readParam(defs[1], v2);
  // sub-textures of a composite (astral_fog / astral_stars) declare no params
  // of their own; the caller passes their amount through p1
  if(defs.length === 0 && p1 != null) amt = Math.max(0.02, p1/100);

  // Zoom is handed to the generator as a size multiplier, NOT applied by
  // generating small and scaling up. That earlier trick changed three things
  // at once: element size (intended), element COUNT (counts derive from w*h,
  // so rain thinned out as it zoomed) and sharpness (upscaling just looked
  // low-resolution). Size and count are now genuinely independent knobs.
  // an explicit tint overrides the accent a colour-keyed texture would
  // otherwise inherit
  const c1 = tint1 || accent1, c2 = tint2 || accent2;
  let result = withSeed(seed, () => buildTexture(type, w, h, c1, c2, amt, angle, zoom, light, tint1, tint2));

  if(invert) result = invertTextureCanvas(result);
  if(textureCache.size >= TEXTURE_CACHE_MAX_ENTRIES){
    textureCache.delete(textureCache.keys().next().value);
  }
  textureCache.set(key, result);
  return result;
}

// ---------- main render ----------