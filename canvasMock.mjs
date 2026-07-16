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
 *   const canvas = getTextureCanvas('alienSurface', 512, 512, null, null, false, 12345);
 */

export function makeMockContext(w, h){
  const stats = { arcs: 0, strokes: 0, fills: 0, gradientStops: 0, imageDataWrites: 0 };
  const ctx = {
    canvas: { width: w, height: h },
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, lineCap: 'butt', lineJoin: 'miter',
    imageSmoothingEnabled: true,
    _stats: stats,
    save(){}, restore(){}, beginPath(){}, closePath(){},
    translate(x,y){ assertFinite('translate', x, y); },
    rotate(angle){ assertFinite('rotate', angle); },
    moveTo(x,y){ assertFinite('moveTo', x, y); },
    lineTo(x,y){ assertFinite('lineTo', x, y); },
    quadraticCurveTo(cx,cy,x,y){ assertFinite('quadraticCurveTo', cx,cy,x,y); },
    arc(cx,cy,r){
      stats.arcs++;
      assertFinite('arc', cx, cy, r);
      if(r < 0) throw new Error('arc() got a negative radius: '+r);
    },
    fill(){ stats.fills++; },
    stroke(){ stats.strokes++; },
    fillRect(x,y,rw,rh){ assertFinite('fillRect', x, y, rw, rh); },
    strokeRect(x,y,rw,rh){ assertFinite('strokeRect', x, y, rw, rh); },
    fillText(){}, strokeText(){}, drawImage(){}, measureText(str){ return { width: (str||'').length*10 }; },
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
export function installCanvasMock(){
  global.document = {
    createElement: (tag) => tag === 'canvas' ? makeMockCanvas() : {},
  };
}
