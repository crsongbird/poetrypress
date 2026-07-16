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

function genWaterspots(w,h){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const cctx = c.getContext('2d');
  cctx.fillStyle = 'rgb(128,128,128)';
  cctx.fillRect(0,0,w,h);
  const count = 26;
  for(let i=0;i<count;i++){
    const r = (Math.random()*0.16+0.05) * Math.min(w,h);
    const cx = Math.random()*w, cy = Math.random()*h;
    const ringVal = 88 + Math.random()*20;
    const centerVal = 142 + Math.random()*18;
    const grad = cctx.createRadialGradient(cx,cy,r*0.1,cx,cy,r);
    grad.addColorStop(0, `rgba(${centerVal},${centerVal*0.95},${centerVal*0.83},0.35)`);
    grad.addColorStop(0.7, `rgba(${centerVal},${centerVal*0.95},${centerVal*0.83},0.14)`);
    grad.addColorStop(0.86, `rgba(${ringVal},${ringVal*0.88},${ringVal*0.72},0.42)`);
    grad.addColorStop(1, 'rgba(128,128,128,0)');
    cctx.fillStyle = grad;
    cctx.beginPath(); cctx.arc(cx,cy,r,0,Math.PI*2); cctx.fill();
  }
  return c;
}

function drawBlurredNoiseLayers(fctx, w, h, layers){
  for(const layer of layers){
    const gw = layer.cells;
    const gh = Math.max(2, Math.round(layer.cells * (h/w)));
    const small = document.createElement('canvas');
    small.width = gw; small.height = gh;
    const sctx = small.getContext('2d');
    const img = sctx.createImageData(gw, gh);
    const d = img.data;
    for(let i=0;i<d.length;i+=4){
      const v = layer.lo + Math.random()*(layer.hi-layer.lo);
      d[i]=v; d[i+1]=v; d[i+2]=v; d[i+3]=255;
    }
    sctx.putImageData(img,0,0);

    fctx.save();
    fctx.globalAlpha = layer.alpha;
    fctx.globalCompositeOperation = layer.blend || 'overlay';
    fctx.filter = `blur(${layer.blur}px)`;
    fctx.imageSmoothingEnabled = true;
    fctx.drawImage(small, 0, 0, w, h);
    fctx.restore();
  }
}

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

function genClouds(w,h){
  const workDiv = 4;
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
      const val = 108 + density*140;
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

function genFlowers(w,h){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const cctx = c.getContext('2d');
  cctx.fillStyle = 'rgb(128,128,128)';
  cctx.fillRect(0,0,w,h);
  const petalOptions = [5,6,7,8];
  const count = Math.max(6, Math.round((w*h)/95000));
  for(let i=0;i<count;i++){
    const cx = Math.random()*w, cy = Math.random()*h;
    const R = (Math.random()*0.035+0.015) * Math.min(w,h);
    const petals = petalOptions[Math.floor(Math.random()*petalOptions.length)];
    const rot = Math.random()*Math.PI*2;
    const shade = 148 + Math.random()*42;
    drawFlower(cctx, cx, cy, R, petals, rot, shade);
  }
  return c;
}

function genAstralFog(w,h){
  const workDiv = 4;
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
      const val = 75 + density*135;
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

function genAstralStars(w,h,accent1,accent2){
  const full = document.createElement('canvas');
  full.width = w; full.height = h;
  const fctx = full.getContext('2d');

  const d1 = darkenRgb(accent1, 0.35);
  const d2 = darkenRgb(accent2, 0.35);

  const starCount = Math.round((w*h)/2125);
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
function drawKnockoutCircle(fctx, cx, cy, r, drawInner){
  fctx.save();
  fctx.globalCompositeOperation = 'destination-out';
  const eraseGrad = fctx.createRadialGradient(cx,cy,0, cx,cy,r);
  eraseGrad.addColorStop(0, 'rgba(0,0,0,1)');
  eraseGrad.addColorStop(0.90, 'rgba(0,0,0,1)');
  eraseGrad.addColorStop(1, 'rgba(0,0,0,0)');
  fctx.fillStyle = eraseGrad;
  fctx.beginPath();
  fctx.arc(cx,cy,r,0,Math.PI*2);
  fctx.fill();
  fctx.restore();

  fctx.save();
  fctx.globalCompositeOperation = 'source-over';
  drawInner(fctx, cx, cy, r);
  fctx.restore();
}

function genAlienSurface(w,h){
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');

  // fine base noise, like dust/regolith — softened: lower contrast and a
  // coarser downscale so the upscale blur smooths it further, plus a light,
  // large-scale fBm elevation bias layered underneath so the surface has
  // some gentle large-scale height variation rather than being pure grain.
  const genW = Math.max(1,Math.round(w/6)), genH = Math.max(1,Math.round(h/6));

  const elevOctaves = 3;
  const elevBaseCells = 2+Math.random()*1.5;
  const elevGrids = [];
  let eAmp=1, eMaxAmp=0;
  for(let i=0;i<elevOctaves;i++){
    const freq = elevBaseCells*Math.pow(2.0,i);
    const gw = Math.max(2, Math.round(freq)+1);
    const gh = Math.max(2, Math.round(freq*(genH/genW))+1);
    elevGrids.push({ grid: makeNoiseGrid(gw,gh), gw, gh, freq, amp: eAmp });
    eMaxAmp += eAmp; eAmp *= 0.55;
  }
  const elevIntensity = 10+Math.random()*8;

  const small = document.createElement('canvas');
  small.width=genW; small.height=genH;
  const sctx = small.getContext('2d');
  const img = sctx.createImageData(genW,genH);
  const d = img.data;
  const noiseSpread = 32+Math.random()*24;
  for(let py=0;py<genH;py++){
    for(let px=0;px<genW;px++){
      let total=0;
      for(const o of elevGrids){
        const nx=(px/genW)*o.freq, ny=(py/genH)*o.freq;
        total += sampleNoiseGrid(o.grid,o.gw,o.gh,nx,ny)*o.amp;
      }
      const elevBias = (total/eMaxAmp - 0.5)*2*elevIntensity;
      const v = 150 + elevBias + (Math.random()*2-1)*noiseSpread;
      const idx=(py*genW+px)*4;
      d[idx]=v; d[idx+1]=v; d[idx+2]=v; d[idx+3]=255;
    }
  }
  sctx.putImageData(img,0,0);
  fctx.imageSmoothingEnabled = true;
  fctx.drawImage(small,0,0,w,h);

  // craters: dramatically varied sizes, each knocking out the noise beneath it.
  // Density itself swings per seed for real seed-to-seed variety, not just
  // different positions at the same density.
  const craterDensity = 0.5+Math.random()*1.6;
  const craterCount = Math.round((w*h)/85000 * craterDensity);
  for(let i=0;i<craterCount;i++){
    const cx = Math.random()*w, cy = Math.random()*h;
    const sizeRoll = Math.random();
    let r;
    if(sizeRoll < 0.55) r = (Math.random()*0.008+0.0015)*Math.min(w,h);
    else if(sizeRoll < 0.88) r = (Math.random()*0.02+0.009)*Math.min(w,h);
    else r = (Math.random()*0.05+0.025)*Math.min(w,h);

    const terrainBase = 150; // matches the base noise layer's own center tone
    const floorVal = terrainBase - (55+Math.random()*55);
    const rimVal = terrainBase + (12+Math.random()*28);
    drawKnockoutCircle(fctx, cx, cy, r, (ictx,icx,icy,ir)=>{
      // A real crater slopes continuously from a deep center up to a raised
      // rim — not a flat floor with a sudden ring. Build that slope with a
      // handful of smoothstep-eased intermediate stops (steepest partway up
      // the wall, easing off near the bottom and near the rim, like an
      // actual bowl profile) instead of two flat plateaus.
      const grad = ictx.createRadialGradient(icx,icy,0, icx,icy,ir);
      const bowlSteps = 6;
      for(let s=0; s<=bowlSteps; s++){
        const t = s/bowlSteps;
        const eased = t*t*(3-2*t); // smoothstep
        const val = floorVal + (rimVal-floorVal)*eased;
        const pos = t*0.82;
        grad.addColorStop(pos, `rgba(${val},${val},${val},1)`);
      }
      grad.addColorStop(0.84, `rgba(${rimVal},${rimVal},${rimVal},1)`); // hold the rim ridge, thinner
      grad.addColorStop(1.0, `rgba(${rimVal},${rimVal},${rimVal},0)`); // fade out over a much wider blur
      ictx.fillStyle = grad;
      ictx.beginPath();
      ictx.arc(icx,icy,ir,0,Math.PI*2);
      ictx.fill();
    });
  }

  // sparse-to-moderate, thin, jagged, LONG cracks. Drawn fully opaque with
  // values pushed near true black — color-burn (which this whole texture
  // composites through) only reliably darkens when the source is genuinely
  // close to 0, not just "dark"; a diluted semi-transparent mid-gray crack
  // effectively disappears under color-burn regardless of opacity slider.
  const crackCount = 32+Math.floor(Math.random()*88);
  for(let i=0;i<crackCount;i++){
    let x = Math.random()*w, y = Math.random()*h;
    const segCount = 10+Math.floor(Math.random()*16);
    fctx.save();
    const crackVal = 3+Math.random()*14;
    fctx.strokeStyle = `rgb(${crackVal},${crackVal},${crackVal})`;
    fctx.lineWidth = 0.5+Math.random()*3.1;
    fctx.beginPath();
    fctx.moveTo(x,y);
    let angle = Math.random()*Math.PI*2;
    for(let s=0;s<segCount;s++){
      angle += (Math.random()*2-1)*0.9; // jagged wander
      const len = (Math.random()*0.022+0.012)*Math.max(w,h);
      x += Math.cos(angle)*len;
      y += Math.sin(angle)*len;
      fctx.lineTo(x,y);
    }
    fctx.stroke();
    fctx.restore();
  }

  return full;
}

function genHabitableSurface(w,h){
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');

  const workDiv = 4;
  const workW = Math.max(24, Math.round(w/workDiv));
  const workH = Math.max(24, Math.round(h/workDiv));

  // Base height field — one fBm, used both to threshold a genuine land/sea
  // boundary (not a soft gradient blur) and to shade elevation within land.
  const heightOctaves = 6, heightGain = 0.5, heightLacunarity = 2.0;
  const heightBaseCells = 2.5+Math.random()*2;
  const heightGrids = [];
  let amp=1, maxAmp=0;
  for(let i=0;i<heightOctaves;i++){
    const freq = heightBaseCells*Math.pow(heightLacunarity,i);
    const gw = Math.max(2, Math.round(freq)+1);
    const gh = Math.max(2, Math.round(freq*(workH/workW))+1);
    heightGrids.push({ grid: makeNoiseGrid(gw,gh), gw, gh, freq, amp });
    maxAmp += amp; amp *= heightGain;
  }
  const heightMaxAmp = maxAmp;

  function heightAt(fullX, fullY){
    let total=0;
    for(const o of heightGrids){
      const nx=(fullX/w)*o.freq, ny=(fullY/h)*o.freq;
      total += sampleNoiseGrid(o.grid,o.gw,o.gh,nx,ny)*o.amp;
    }
    return total/heightMaxAmp; // 0-1
  }

  // Ridge/mountain noise — a separate, higher-frequency fBm where each octave
  // is transformed via 1-abs(2n-1), turning smooth bumps into sharp creases.
  // This is the classic "ridged multifractal" trick used for mountain-range
  // terrain, and it's the piece that actually gives linear structure instead
  // of everything reading as one soft blob.
  const ridgeOctaves = 5, ridgeGain = 0.55, ridgeLacunarity = 2.1;
  const ridgeBaseCells = 5+Math.random()*4;
  const ridgeGrids = [];
  amp=1; maxAmp=0;
  for(let i=0;i<ridgeOctaves;i++){
    const freq = ridgeBaseCells*Math.pow(ridgeLacunarity,i);
    const gw = Math.max(2, Math.round(freq)+1);
    const gh = Math.max(2, Math.round(freq*(workH/workW))+1);
    ridgeGrids.push({ grid: makeNoiseGrid(gw,gh), gw, gh, freq, amp });
    maxAmp += amp; amp *= ridgeGain;
  }
  const ridgeMaxAmp = maxAmp;

  function ridgeAt(fullX, fullY){
    let total=0;
    for(const o of ridgeGrids){
      const nx=(fullX/w)*o.freq, ny=(fullY/h)*o.freq;
      const n = sampleNoiseGrid(o.grid,o.gw,o.gh,nx,ny);
      total += (1-Math.abs(n*2-1))*o.amp;
    }
    return total/ridgeMaxAmp; // 0-1, peaks near ridge crests
  }

  // Sea level as a PERCENTILE of the actual achieved height distribution,
  // not a fixed absolute threshold — a raw fBm sum's practical range varies
  // seed to seed, so a fixed threshold could occasionally sit above nearly
  // everything the field actually reaches, producing all-ocean. Sampling the
  // real distribution and picking a level that guarantees a genuine land
  // fraction fixes this by construction, regardless of the noise's shape.
  const heightSamples = new Float32Array(2000);
  for(let s=0;s<2000;s++) heightSamples[s] = heightAt(Math.random()*w, Math.random()*h);
  const sortedHeights = Float32Array.from(heightSamples).sort();
  const landFraction = 0.35+Math.random()*0.4; // 35%-75% of the surface is land
  const seaLevel = sortedHeights[Math.max(0, Math.min(sortedHeights.length-1, Math.floor((1-landFraction)*sortedHeights.length)))];

  const bandCount = 4+Math.floor(Math.random()*3); // 4-6 discrete elevation bands

  const small = document.createElement('canvas');
  small.width=workW; small.height=workH;
  const sctx = small.getContext('2d');
  const img = sctx.createImageData(workW, workH);
  const d = img.data;
  for(let py=0; py<workH; py++){
    for(let px=0; px<workW; px++){
      const fx = (px/workW)*w, fy = (py/workH)*h;
      const hgt = heightAt(fx, fy);
      let val;
      if(hgt <= seaLevel){
        const depth = seaLevel>0.001 ? 1-(hgt/seaLevel) : 0;
        val = 85 - depth*55; // shallow/coast ~85 down to deep ~30
      } else {
        const elevAboveSea = (hgt-seaLevel)/Math.max(0.001, 1-seaLevel);
        const bandIdx = Math.min(bandCount-1, Math.floor(elevAboveSea*bandCount));
        const bandFrac = bandIdx/(bandCount-1);
        // Land needs to sit close to true white to actually read as "land"
        // under color-burn — even the old ceiling of 230/255 still caused
        // real, visible darkening (no genuinely bright/protected region to
        // contrast against the near-black ocean), so the whole thing read as
        // varying shades of dark instead of a clear land/water split.
        let landVal = 175 + bandFrac*77; // 175 (lowland) to 252 (highland, near no-op)

        // ridges only affect land, and matter more at higher elevation bands
        // — mountains form at altitude, not down at the coastline.
        const ridgeInfluence = 0.15+bandFrac*0.5;
        landVal += (ridgeAt(fx,fy)-0.5)*50*ridgeInfluence;
        val = landVal;
      }
      val = Math.max(15, Math.min(255, val));
      const idx=(py*workW+px)*4;
      d[idx]=val; d[idx+1]=val; d[idx+2]=val; d[idx+3]=255;
    }
  }
  sctx.putImageData(img,0,0);
  fctx.imageSmoothingEnabled = true;
  fctx.drawImage(small,0,0,w,h);

  // Rivers — same steering/branching mechanic as before, now sampling the
  // height field directly. "Connect two low points" is a more physically apt
  // read in this model too: rivers terminate toward the sea.
  function findLowPoint(){
    let best = null;
    for(let attempt=0; attempt<14; attempt++){
      const px = Math.random()*w, py = Math.random()*h;
      const hgt = heightAt(px,py);
      if(!best || hgt < best.h) best = {x:px, y:py, h:hgt};
    }
    return best;
  }
  function strokePolyline(pts, lineW, val){
    if(pts.length < 2) return;
    fctx.save();
    fctx.strokeStyle = `rgb(${val},${val},${val})`;
    fctx.lineWidth = lineW;
    fctx.lineCap = 'round';
    fctx.lineJoin = 'round';
    fctx.beginPath();
    fctx.moveTo(pts[0][0], pts[0][1]);
    for(let i=1;i<pts.length;i++) fctx.lineTo(pts[i][0], pts[i][1]);
    fctx.stroke();
    fctx.restore();
  }

  const riverSystemCount = 2+Math.floor(Math.random()*6);
  for(let i=0; i<riverSystemCount; i++){
    const a = findLowPoint(), b = findLowPoint();
    let x = a.x, y = a.y;
    let angle = Math.atan2(b.y-y, b.x-x);
    const mainPts = [[x,y]];
    const segCount = 40+Math.floor(Math.random()*40);
    const branchStarts = [];
    for(let s=0; s<segCount; s++){
      const toTarget = Math.atan2(b.y-y, b.x-x);
      let diff = toTarget-angle;
      while(diff>Math.PI) diff-=Math.PI*2;
      while(diff<-Math.PI) diff+=Math.PI*2;
      angle += diff*0.18 + (Math.random()*2-1)*0.32;
      const len = (Math.random()*0.018+0.013)*Math.max(w,h);
      x += Math.cos(angle)*len;
      y += Math.sin(angle)*len;
      mainPts.push([x,y]);
      if(s>3 && s<segCount-3 && Math.random()<0.16) branchStarts.push({x,y,angle});
    }

    const riverVal = 3+Math.random()*13;
    const baseWidth = (0.006+Math.random()*0.014)*Math.max(w,h);
    strokePolyline(mainPts, baseWidth, riverVal);

    for(const br of branchStarts){
      let bx=br.x, by=br.y, bangle = br.angle + (Math.random()<0.5?1:-1)*(0.5+Math.random()*0.9);
      const bPts = [[bx,by]];
      const bSeg = 5+Math.floor(Math.random()*8);
      for(let s=0;s<bSeg;s++){
        bangle += (Math.random()*2-1)*0.35;
        const len = (Math.random()*0.015+0.008)*Math.max(w,h);
        bx += Math.cos(bangle)*len;
        by += Math.sin(bangle)*len;
        bPts.push([bx,by]);
      }
      strokePolyline(bPts, baseWidth*(0.4+Math.random()*0.35), riverVal);
    }
  }

  return full;
}

function genInkBleed(w,h){
  const workDiv = 4;
  const workW = Math.max(24, Math.round(w/workDiv));
  const workH = Math.max(24, Math.round(h/workDiv));
  const halfW = Math.ceil(workW/2);

  // Base blot mass: same mirrored-fBm technique as before, but bias/power pushed
  // much higher so only isolated peaks survive — sparse, high-contrast blots with
  // real clear paper between them, instead of one continuous darkening field.
  const octaves = 5, gain = 0.5, lacunarity = 2.0, baseCells = 3;
  const bias = 0.5, power = 3.2;

  const octaveGrids = [];
  let amp=1, maxAmp=0;
  for(let i=0;i<octaves;i++){
    const freq = baseCells*Math.pow(lacunarity,i);
    const gw = Math.max(2, Math.round(freq)+1);
    const gh = Math.max(2, Math.round(freq*(workH/workW))+1);
    octaveGrids.push({ grid: makeNoiseGrid(gw,gh), gw, gh, freq, amp });
    maxAmp += amp; amp *= gain;
  }

  const densityField = new Float32Array(halfW*workH);
  for(let py=0; py<workH; py++){
    for(let px=0; px<halfW; px++){
      let total=0;
      for(const o of octaveGrids){
        const nx=(px/workW)*o.freq, ny=(py/workH)*o.freq;
        total += sampleNoiseGrid(o.grid,o.gw,o.gh,nx,ny)*o.amp;
      }
      const v = total/maxAmp;
      let density = Math.max(0,(v-bias)/(1-bias));
      densityField[py*halfW+px] = Math.pow(density, power);
    }
  }

  const small = document.createElement('canvas');
  small.width=workW; small.height=workH;
  const sctx = small.getContext('2d');
  const img = sctx.createImageData(workW, workH);
  const d = img.data;
  for(let py=0; py<workH; py++){
    for(let px=0; px<workW; px++){
      const srcX = Math.min(halfW-1, px < halfW ? px : (workW-1-px));
      const density = densityField[py*halfW+srcX];
      const idx = (py*workW+px)*4;
      // clear paper sits near-white so color-burn is nearly inert there; ink masses
      // drop to TRUE near-black (not just "dark") at peak density — color-burn only
      // clamps fully to black when the source value is genuinely near zero, regardless
      // of the destination's hue/lightness. Anything short of that (like ~35/255)
      // lands in a muddy midtone on light backgrounds instead of reading as black ink.
      const val = 250 - density*247;
      d[idx]=val; d[idx+1]=val; d[idx+2]=val; d[idx+3]=255;
    }
  }
  sctx.putImageData(img,0,0);

  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');
  const dim = Math.max(w,h);
  fctx.filter = `blur(${dim*0.004}px)`;
  fctx.imageSmoothingEnabled = true;
  fctx.drawImage(small,0,0,w,h);
  fctx.filter = 'none';

  // Clustered droplets — a handful of "impact points" where ink actually flicked,
  // each spawning several droplets that taper smaller/finer moving outward from the
  // cluster center. Reads as genuine spatter rather than uniform random scatter.
  const clusterCount = Math.max(4, Math.round((w*h)/900000));
  for(let c=0; c<clusterCount; c++){
    const clx = Math.random()*w, cly = Math.random()*h;
    const dropletsInCluster = 4+Math.floor(Math.random()*7);
    const clusterSpread = (Math.random()*0.05+0.03)*Math.max(w,h);
    for(let i=0;i<dropletsInCluster;i++){
      const dist = Math.random()*clusterSpread;
      const ang = Math.random()*Math.PI*2;
      const cx = clx + Math.cos(ang)*dist;
      const cy = cly + Math.sin(ang)*dist;
      const distT = dist/clusterSpread;
      const baseR = (Math.random()*0.022+0.01)*Math.min(w,h)*(1-distT*0.6);

      const points = 8+Math.floor(Math.random()*5);
      fctx.beginPath();
      let prevR = baseR*(0.7+Math.random()*0.5);
      for(let p=0;p<=points;p++){
        const theta = (p/points)*Math.PI*2;
        // average consecutive radii instead of fully independent per-point jitter —
        // that's what was making these read as spiky stars instead of ink blobs
        const r = (prevR + baseR*(0.6+Math.random()*0.7))/2;
        prevR = r;
        const px = cx+Math.cos(theta)*r, py = cy+Math.sin(theta)*r;
        if(p===0) fctx.moveTo(px,py); else fctx.lineTo(px,py);
      }
      fctx.closePath();
      const shade = 2+Math.random()*8;
      fctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      fctx.fill();
    }
  }

  return full;
}

function genCrackedGlaze(w,h){
  const workDiv = 5;
  const workW = Math.max(24, Math.round(w/workDiv));
  const workH = Math.max(24, Math.round(h/workDiv));

  const seedCount = 26;
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

function genBokeh(w,h){
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');
  fctx.fillStyle = 'rgb(126,126,126)';
  fctx.fillRect(0,0,w,h);

  const count = Math.max(6, Math.round((w*h)/140000));
  for(let i=0;i<count;i++){
    const x=Math.random()*w, y=Math.random()*h;
    const r = (Math.random()*0.06+0.03)*Math.max(w,h);
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

function genEmbers(w,h,accent1,accent2){
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');

  const count = Math.round((w*h)/3200);
  for(let i=0;i<count;i++){
    const x = Math.random()*w, y = Math.random()*h;
    const roll = Math.random();
    let size, trailLen;
    if(roll<0.6){ size=1; trailLen=(Math.random()*0.02+0.01)*Math.max(w,h); }
    else if(roll<0.88){ size=1.6+Math.random()*1.2; trailLen=(Math.random()*0.035+0.015)*Math.max(w,h); }
    else { size=2.6+Math.random()*2; trailLen=(Math.random()*0.05+0.025)*Math.max(w,h); }

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

function genTessellate(w,h){
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');
  fctx.fillStyle='rgb(128,128,128)';
  fctx.fillRect(0,0,w,h);

  const cell = Math.max(w,h)/14;
  const cols = Math.ceil(w/cell)+1;
  const rows = Math.ceil(h/cell)+1;

  for(let ry=0; ry<rows; ry++){
    for(let rx=0; rx<cols; rx++){
      const x0=rx*cell, y0=ry*cell;
      const flip = (rx+ry)%2===0;
      const shadeA = 106+Math.random()*44;
      const shadeB = 106+Math.random()*44;

      fctx.beginPath();
      if(flip){ fctx.moveTo(x0,y0); fctx.lineTo(x0+cell,y0); fctx.lineTo(x0,y0+cell); }
      else { fctx.moveTo(x0+cell,y0); fctx.lineTo(x0+cell,y0+cell); fctx.lineTo(x0,y0); }
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
function mixHex(hexA, hexB, t){
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
function genSnow(w,h){
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');
  const count = Math.round((w*h)/3200);
  for(let i=0;i<count;i++){
    const x = Math.random()*w, y = Math.random()*h;
    const roll = Math.random();
    let size, alpha;
    if(roll < 0.25){ size = 0.6+Math.random()*0.5; alpha = 0.3+Math.random()*0.2; }        // distant dust
    else if(roll < 0.55){ size = 1+Math.random()*1.2; alpha = 0.7+Math.random()*0.3; }      // tiny, sharp
    else if(roll < 0.78){ size = 2.5+Math.random()*2.5; alpha = 0.5+Math.random()*0.3; }    // small, soft
    else if(roll < 0.93){ size = 5+Math.random()*4; alpha = 0.35+Math.random()*0.25; }      // medium, softer
    else { size = 9+Math.random()*9; alpha = 0.18+Math.random()*0.2; }                      // rare, large, out of focus

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
function drawLeafShape(ctx, cx, cy, size, rot, shade){
  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0,size*0.5);
  ctx.quadraticCurveTo(size*0.55, 0, 0, -size*0.5);
  ctx.quadraticCurveTo(-size*0.55, 0, 0, size*0.5);
  ctx.closePath();
  ctx.fillStyle = `rgb(${shade},${shade*0.92},${shade*0.72})`;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, size*0.45); ctx.lineTo(0, -size*0.45);
  ctx.strokeStyle = `rgba(0,0,0,0.18)`;
  ctx.lineWidth = Math.max(0.6, size*0.045);
  ctx.stroke();
  ctx.restore();
}
function genLeaves(w,h){
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');
  fctx.fillStyle='rgb(128,128,128)';
  fctx.fillRect(0,0,w,h);
  const count = Math.max(6, Math.round((w*h)/60000));
  for(let i=0;i<count;i++){
    const cx = Math.random()*w, cy = Math.random()*h;
    const size = (Math.random()*0.03+0.018)*Math.min(w,h);
    const rot = Math.random()*Math.PI*2;
    const shade = 140+Math.random()*55;
    drawLeafShape(fctx, cx, cy, size, rot, shade);
  }
  return full;
}

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
function genMagicParticles(w,h,accent1,accent2){
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');

  const count = Math.round((w*h)/2800);
  for(let i=0;i<count;i++){
    const t = Math.random();
    const {r,g,b} = mixHex(accent1, accent2, t);
    const x = Math.random()*w, y = Math.random()*h;
    const roll = Math.random();

    if(roll < 0.5){
      const size = 1+Math.random()*3;
      const grad = fctx.createRadialGradient(x,y,0,x,y,size);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.95)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      fctx.fillStyle = grad;
      fctx.beginPath(); fctx.arc(x,y,size,0,Math.PI*2); fctx.fill();
    } else if(roll < 0.85){
      const size = 1.4+Math.random()*1.8;
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
      const size = 3+Math.random()*4;
      drawSparkleGlint(fctx, x, y, size, r, g, b);
    }
  }
  return full;
}

// Downpour: diagonal falling streaks — a distinct linear-gradient-stroke pattern,
// not the static blob stains that Water Spots uses.
function genRainStreaks(w,h){
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');
  fctx.fillStyle='rgb(128,128,128)';
  fctx.fillRect(0,0,w,h);

  const angleRad = -14*Math.PI/180;
  const count = Math.round((w*h)/3800);
  for(let i=0;i<count;i++){
    const x = Math.random()*w*1.3 - w*0.15;
    const y = Math.random()*h;
    const len = (Math.random()*0.11+0.05)*Math.max(w,h);
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
function genLeather(w,h){
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');

  // base: soft paper-like grain (same technique as Parchment — narrow spread,
  // coarse downscale — not the noisier Dustmote spread this used before)
  const genW = Math.max(1,Math.round(w/3)), genH = Math.max(1,Math.round(h/3));
  const small = document.createElement('canvas');
  small.width=genW; small.height=genH;
  const sctx = small.getContext('2d');
  const img = sctx.createImageData(genW,genH);
  const d = img.data;
  for(let i=0;i<d.length;i+=4){
    const v = 205+(Math.random()*2-1)*32;
    d[i]=v; d[i+1]=v*0.95; d[i+2]=v*0.85; d[i+3]=255;
  }
  sctx.putImageData(img,0,0);
  fctx.imageSmoothingEnabled = true;
  fctx.drawImage(small,0,0,w,h);

  const workW = Math.max(24, Math.round(w/6));
  const workHNormal = Math.max(24, Math.round(h/6));
  const workH = Math.max(12, Math.round(workHNormal*0.5));

  const seedCount = 150;
  const seeds = [];
  for(let i=0;i<seedCount;i++) seeds.push([Math.random()*workW, Math.random()*workH]);

  const crackWidth = 0.06;
  const crackSmall = document.createElement('canvas');
  crackSmall.width = workW; crackSmall.height = workH;
  const cctx = crackSmall.getContext('2d');
  const cimg = cctx.createImageData(workW, workH);
  const cd = cimg.data;
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
      // crack lines much darker, non-crack areas near-white so multiply barely
      // touches them — the darkening should come from the cracks specifically
      const val = diff < crackWidth ? 45 : 235;
      cd[idx]=val; cd[idx+1]=val; cd[idx+2]=val; cd[idx+3]=255;
    }
  }
  cctx.putImageData(cimg,0,0);

  fctx.save();
  fctx.globalAlpha = 0.55;
  fctx.globalCompositeOperation = 'multiply';
  fctx.imageSmoothingEnabled = true;
  fctx.drawImage(crackSmall, 0, 0, w, h);
  fctx.restore();

  return full;
}

// Dotwork: a regular dot grid (classic print halftone) where each dot's radius is
// modulated by a coarse noise field — genuinely geometric (fixed grid spacing)
// but with organic size variation, distinct from Squares' flat-shaded triangles.
function genHalftone(w,h){
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');
  fctx.fillStyle = 'rgb(205,205,205)';
  fctx.fillRect(0,0,w,h);

  const fieldGW = 10, fieldGH = Math.max(2, Math.round(10*(h/w)));
  const field = makeNoiseGrid(fieldGW, fieldGH);

  const cell = Math.max(w,h)/48;
  const cols = Math.ceil(w/cell), rows = Math.ceil(h/cell);
  fctx.fillStyle = 'rgb(60,60,60)';
  for(let ry=0; ry<rows; ry++){
    for(let rx=0; rx<cols; rx++){
      const cx = rx*cell+cell/2, cy = ry*cell+cell/2;
      const nx = (rx/cols)*(fieldGW-1), ny = (ry/rows)*(fieldGH-1);
      const v = sampleNoiseGrid(field, fieldGW, fieldGH, nx, ny);
      const r = v*cell*0.48;
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
function genBrushstrokes(w,h){
  const full = document.createElement('canvas');
  full.width=w; full.height=h;
  const fctx = full.getContext('2d');
  fctx.fillStyle='rgb(128,128,128)';
  fctx.fillRect(0,0,w,h);

  const count = Math.max(10, Math.round((w*h)/85000));
  for(let i=0;i<count;i++){
    const x = Math.random()*w, y = Math.random()*h;
    const length = (Math.random()*0.16+0.08)*Math.max(w,h);
    const angle = Math.random()*Math.PI*2;
    const tone = 90+Math.random()*110;
    const alpha = 0.55+Math.random()*0.35;
    drawBrushStroke(fctx, x, y, length, angle, tone, alpha);
  }
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

// Cache of already-generated textures, keyed by type+dims+colors+invert+seed.
const textureCache = {};

export function getTextureCanvas(type, w, h, accent1, accent2, invert, seed){
  const colorKeyed = (type === 'embers' || type === 'magicparticles' || type === 'astral_stars');
  const key = (colorKeyed ? `${type}_${w}_${h}_${accent1}_${accent2}` : `${type}_${w}_${h}`) + (invert ? '_inv' : '') + `_s${seed}`;
  if(textureCache[key]) return textureCache[key];

  let result = withSeed(seed, () => {
  let result;
  if(type === 'waterspots'){
    result = genWaterspots(w,h);
  } else if(type === 'clouds'){
    result = genClouds(w,h);
  } else if(type === 'flowers'){
    result = genFlowers(w,h);
  } else if(type === 'inkbleed'){
    result = genInkBleed(w,h);
  } else if(type === 'alienSurface'){
    result = genAlienSurface(w,h);
  } else if(type === 'habitableSurface'){
    result = genHabitableSurface(w,h);
  } else if(type === 'crackedglaze'){
    result = genCrackedGlaze(w,h);
  } else if(type === 'bokeh'){
    result = genBokeh(w,h);
  } else if(type === 'embers'){
    result = genEmbers(w,h,accent1,accent2);
  } else if(type === 'tessellate'){
    result = genTessellate(w,h);
  } else if(type === 'astral_fog'){
    result = genAstralFog(w,h);
  } else if(type === 'astral_stars'){
    result = genAstralStars(w,h,accent1,accent2);
  } else if(type === 'snow'){
    result = genSnow(w,h);
  } else if(type === 'leaves'){
    result = genLeaves(w,h);
  } else if(type === 'magicparticles'){
    result = genMagicParticles(w,h,accent1,accent2);
  } else if(type === 'rainstreaks'){
    result = genRainStreaks(w,h);
  } else if(type === 'leather'){
    result = genLeather(w,h);
  } else if(type === 'halftone'){
    result = genHalftone(w,h);
  } else if(type === 'brushstrokes'){
    result = genBrushstrokes(w,h);
  } else {
    let genW = w, genH = h;
    if(type==='grain'){ genW=Math.max(1,Math.round(w/5)); genH=Math.max(1,Math.round(h/5)); }
    else if(type==='paper'){ genW=Math.max(1,Math.round(w/3)); genH=Math.max(1,Math.round(h/3)); }
    else if(type==='canvas'){ genW=Math.max(1,Math.round(w/70)); genH=Math.max(1,Math.round(h/2)); }

    const small = document.createElement('canvas');
    small.width = genW; small.height = genH;
    const sctx = small.getContext('2d');
    const img = sctx.createImageData(genW,genH);
    const d = img.data;
    for(let i=0;i<d.length;i+=4){
      let v;
      if(type==='noise') v = Math.random()*255;
      else if(type==='grain') v = 128+(Math.random()*2-1)*100;
      else if(type==='canvas') v = 128+(Math.random()*2-1)*75;
      else v = 205+(Math.random()*2-1)*32;
      d[i]=v; d[i+1]=v; d[i+2]=v; d[i+3]=255;
    }
    sctx.putImageData(img,0,0);

    const full = document.createElement('canvas');
    full.width = w; full.height = h;
    const fctx = full.getContext('2d');
    fctx.imageSmoothingEnabled = type !== 'noise';
    fctx.drawImage(small,0,0,w,h);
    result = full;
  }
  return result;
  });
  if(invert) result = invertTextureCanvas(result);
  textureCache[key] = result;
  return result;
}

// ---------- main render ----------