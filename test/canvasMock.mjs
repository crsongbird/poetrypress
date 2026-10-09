/**
 * canvasMock.mjs — a minimal but *faithful* mock of the Canvas 2D API
 * surface this app's texture generators and renderer actually touch.
 *
 * This exists because textureGenerators.js has no real automated test
 * coverage otherwise (no headless-canvas package is installable in this
 * project's network-restricted environment — `npm install canvas` needs to
 * download native build headers from nodejs.org, which isn't on the
 * project's allowed domain list). This mock won't tell you what anything
 * LOOKS like, but it faithfully enforces the parts of the real API contract
 * that have actually caused bugs in this project before:
 *
 *   - addColorStop(offset, color) throws if color isn't a string — this
 *     caught a real bug where a CanvasGradient object (from the global
 *     text-gradient toggle) was passed as a gradient stop's color.
 *   - moveTo/lineTo/arc/fillRect/createRadialGradient all throw on
 *     non-finite (NaN/Infinity) coordinates — real canvas doesn't throw on
 *     these, it just silently fails to draw, which is arguably worse
 *     (a "why doesn't this show up" bug with no error at all). Throwing
 *     here surfaces that class of bug immediately instead.
 *   - getContext() returns the SAME cached context object on repeat calls,
 *     matching real browser behavior (a canvas has exactly one 2D context,
 *     not a fresh one per call).
 *
 * Usage:
 *   import { installCanvasMock } from './canvasMock.mjs';
 *   installCanvasMock();
 *   const { getTextureCanvas } = await import('../textureGenerators.js');
 *   const canvas = getTextureCanvas('alienSurface', 512, 512, { seed: 12345 });
 */

export function makeMockContext(w, h){
  const stats = { arcs: 0, strokes: 0, fills: 0, gradientStops: 0, imageDataWrites: 0,
                // geometry, not just call counts -- lets a test prove that a size
                // knob changed what was drawn rather than merely how often
                radiusSum: 0, pathLen: 0, rectArea: 0,
                // pixel and direction signals, so a knob that changes tone or
                // angle rather than size is still detectable
                pixelSum: 0, pixelVar: 0, pathDx: 0, rotSum: 0, rotSigned: 0 };
  const ctx = {
    canvas: { width: w, height: h },
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, lineCap: 'butt', lineJoin: 'miter',
    imageSmoothingEnabled: true,
    _stats: stats,
    save(){}, restore(){}, beginPath(){}, closePath(){},
    translate(x,y){ assertFinite('translate', x, y); },
    rotate(angle){ assertFinite('rotate', angle); stats.rotSum += Math.abs(angle); stats.rotSigned += angle; },
    moveTo(x,y){ assertFinite('moveTo', x, y); ctx._lastX = x; ctx._lastY = y; },
    lineTo(x,y){
      assertFinite('lineTo', x, y);
      if(ctx._lastX != null){
        stats.pathLen += Math.hypot(x-ctx._lastX, y-ctx._lastY);
        stats.pathDx += Math.abs(x-ctx._lastX);
      }
      ctx._lastX = x; ctx._lastY = y;
    },
    quadraticCurveTo(cx,cy,x,y){ assertFinite('quadraticCurveTo', cx,cy,x,y); },
    bezierCurveTo(c1x,c1y,c2x,c2y,x,y){
      assertFinite('bezierCurveTo', c1x,c1y,c2x,c2y,x,y);
      if(ctx._lastX != null){
        stats.pathLen += Math.hypot(x-ctx._lastX, y-ctx._lastY);
        stats.pathDx += Math.abs(x-ctx._lastX);
      }
      ctx._lastX = x; ctx._lastY = y;
    },
    ellipse(cx,cy,rx,ry,rot){ stats.arcs++; stats.radiusSum += (rx+ry)/2; assertFinite('ellipse', cx,cy,rx,ry,rot); },
    scale(sx,sy){ assertFinite('scale', sx, sy); },
    arc(cx,cy,r){
      stats.arcs++;
      stats.radiusSum += r;
      assertFinite('arc', cx, cy, r);
      if(r < 0) throw new Error('arc() got a negative radius: '+r);
    },
    fill(){ stats.fills++; },
    stroke(){ stats.strokes++; },
    arcTo(x1,y1,x2,y2,r){ assertFinite('arcTo', x1, y1, x2, y2, r); stats.pathLen += Math.abs(r); },
    rect(x,y,rw,rh){ assertFinite('rect', x, y, rw, rh); stats.pathLen += 2*(Math.abs(rw)+Math.abs(rh)); },
    fillRect(x,y,rw,rh){ assertFinite('fillRect', x, y, rw, rh); stats.rectArea += Math.abs(rw*rh); },
    strokeRect(x,y,rw,rh){ assertFinite('strokeRect', x, y, rw, rh); },
    // text calls are counted, so a test can tell an effect actually drew
    fillText(){ stats.fillText = (stats.fillText || 0) + 1; }, strokeText(){ stats.strokeText = (stats.strokeText || 0) + 1; }, drawImage(){}, measureText(str){ return { width: (str||'').length*10 }; },
    setTransform(){}, setLineDash(){}, getLineDash(){ return []; }, clip(){}, clearRect(){},
    createLinearGradient(x0,y0,x1,y1){
      assertFinite('createLinearGradient', x0,y0,x1,y1);
      return mockGradient(stats);
    },
    createRadialGradient(x0,y0,r0,x1,y1,r1){
      assertFinite('createRadialGradient', x0,y0,r0,x1,y1,r1);
      return mockGradient(stats);
    },
    createImageData(iw, ih){
      if(iw<=0||ih<=0||!Number.isFinite(iw)||!Number.isFinite(ih)) throw new Error('createImageData bad size: '+iw+'x'+ih);
      return { data: new Uint8ClampedArray(iw*ih*4), width: iw, height: ih };
    },
    getImageData(x, y, iw, ih){
      assertFinite('getImageData', x, y, iw, ih);
      return { data: new Uint8ClampedArray(Math.max(1,iw)*Math.max(1,ih)*4), width: iw, height: ih };
    },
    putImageData(imgData){
      stats.imageDataWrites++;
      // pixelSum sees overall tone; pixelVar sees TEXTURE — how much each
      // sampled pixel differs from the previous one — so a knob that changes
      // pattern but not average brightness (a finer rake, more fractal
      // octaves) still registers
      for(let i=0;i<imgData.data.length;i+=64){ stats.pixelSum += imgData.data[i];
        if(i >= 64) stats.pixelVar += Math.abs(imgData.data[i] - imgData.data[i-64]); }
      for(let i=0;i<imgData.data.length;i++){
        if(!Number.isFinite(imgData.data[i])) throw new Error('putImageData: non-finite pixel value at index '+i);
      }
    },
  };
  return ctx;
}

function mockGradient(stats){
  return {
    addColorStop(offset, color){
      stats.gradientStops++;
      if(!Number.isFinite(offset) || offset<0 || offset>1) throw new Error('addColorStop offset out of range: '+offset);
      if(typeof color !== 'string') throw new TypeError("addColorStop: color is not a string, got "+Object.prototype.toString.call(color));
      if(/NaN|undefined/.test(color)) throw new Error('addColorStop got a broken color string: '+color);
    }
  };
}

function assertFinite(fnName, ...vals){
  for(const v of vals){
    if(!Number.isFinite(v)) throw new Error(`${fnName}() got a non-finite value: ${JSON.stringify(vals)}`);
  }
}

export function makeMockCanvas(){
  let w=0, h=0, cachedCtx=null;
  return {
    get width(){ return w; }, set width(v){ w=v; cachedCtx=null; },
    get height(){ return h; }, set height(v){ h=v; cachedCtx=null; },
    getContext(){
      if(!cachedCtx) cachedCtx = makeMockContext(w,h);
      return cachedCtx;
    }
  };
}

/** Installs `global.document.createElement('canvas')` so any module that
 * creates offscreen canvases (which is how every texture generator works)
 * can run under plain Node with no browser and no native canvas package. */
/** Every canvas created since the last reset, with its dimensions. Several
 * textures do their real work on an internal downscaled canvas, so the
 * returned canvas's own draw stats say nothing about them -- but the size of
 * that internal canvas does. */
export const createdCanvases = [];
export function resetCreatedCanvases(){ createdCanvases.length = 0; }

export function installCanvasMock(){
  global.document = {
    createElement: (tag) => {
      if(tag !== 'canvas') return {};
      const c = makeMockCanvas();
      createdCanvases.push(c);
      return c;
    },
  };
}
