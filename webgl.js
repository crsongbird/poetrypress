/**
 * webgl.js — the one way this app opens WebGL2 (the lighting, the GPU passes, the box's glass).
 *
 *   One small window of glass,
 *   a square of light drawn over —
 *   each pass paints it all.
 *
 * Every program here draws one quad over its whole canvas; a fragment shader does the work.
 */
const GL_OPTS = { antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false };
const GL_VERTEX = '#version 300 es\nin vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }';
/** A WebGL2 context on a small OffscreenCanvas, with the quad's buffer: { gl, cv, buf }, or null. WebGL emulated in
 *  software (no GPU, or a blocklisted driver) is SLOWER than the CPU paths (about twice their time, measured), so it
 *  is refused unless `softOk` (the tests). */
export function glOpen(softOk){
  if(typeof OffscreenCanvas !== 'function') return null;
  const cv = new OffscreenCanvas(1, 1), gl = cv.getContext('webgl2', GL_OPTS);
  if(!gl) return null;
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  if(!softOk && /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)) return null;
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  return { gl, cv, buf };
}
/** A program that draws `frag` over the quad: { prog, vao }. Throws if it doesn't compile or link. */
export function glProgram(G, frag){
  const { gl } = G;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, GL_VERTEX));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, G.buf);
  const loc = gl.getAttribLocation(prog, 'aPos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  return { prog, vao };
}
