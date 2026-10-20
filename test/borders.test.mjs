/**
 * borders.test.mjs — the frame: the border (its gradient and bloom), the
 * vignette, and the stitches every border, rule and inset box is sewn with.
 * Each is checked by what the real render() draws (the mock records it).
 * (The themes are themes.test.mjs; that every control is saved is
 * persistenceCoverage.test.mjs.)
 *
 * Run: node test/borders.test.mjs
 */
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';
import { check, done } from './harness.mjs';

// every 2D context the page makes, watched: its gradients, its rectangles and strokes (with their alpha and width)
const seen = [];
const watch = c => { if(c._watched) return c; c._watched = true;
  for(const k of ['createLinearGradient', 'createRadialGradient', 'fillRect', 'stroke']){ const f = c[k];
    c[k] = (...a) => { seen.push({ k, a, alpha: c.globalAlpha, width: c.lineWidth, ctx: c }); return f.apply(c, a); }; }
  let blur = 0; Object.defineProperty(c, 'shadowBlur', { get: () => blur, set: v => { blur = v; if(v > 0) seen.push({ k: 'shadowBlur', ctx: c }); } });
  return c; };
const watchedCanvas = () => { const cv = makeMockCanvas(), g = cv.getContext.bind(cv); cv.getContext = (...a) => watch(g(...a)); return cv; };
installCanvasMock();
const reg = installDomMock((w, h) => watch(makeMockContext(w, h)), watchedCanvas);
await import('../appEvents.js');
const R = await import('../canvasRenderer.js');

const set = o => { for(const [k, v] of Object.entries(o)){ const el = reg[k] || document.getElementById(k); typeof v === 'boolean' ? el.checked = v : el.value = String(v); } };
const draw = o => { set(o); seen.length = 0; R.render(); return seen.slice(); };
const page = () => { const c = reg['poemCanvas']; return [c.width, c.height]; };
const OFF = { borderToggle: false, vignetteToggle: false };

// ---- the border ----
{ const [W, H] = page(), half = Math.hypot(W, H)/2;
  // a linear gradient through the page's centre, half its diagonal each way, along the angle
  const along = (got, deg) => { const c = Math.cos(deg*Math.PI/180)*half, sn = Math.sin(deg*Math.PI/180)*half;
    return got.some(e => e.k === 'createLinearGradient' && Math.abs(e.a[0] - (W/2 - c)) < 1 && Math.abs(e.a[1] - (H/2 - sn)) < 1 && Math.abs(e.a[2] - (W/2 + c)) < 1 && Math.abs(e.a[3] - (H/2 + sn)) < 1); };
  const on = draw({ ...OFF, borderToggle: true, borderGradientToggle: true, borderGradientAngle: 45, borderBloom: 0 });
  check('a border gradient is linear, along its angle (45° is corner to corner)', along(on, 45) && !along(draw({ borderGradientToggle: false }), 45));
  check('…and at 0° it runs straight across', along(draw({ borderGradientToggle: true, borderGradientAngle: 0 }), 0)); }
{ const got = draw({ ...OFF, borderToggle: true, borderGradientToggle: false, borderBloom: 60 });
  // the bloom is the strokes on a layer of its own (half size): widest first, fainter the wider
  const layer = got.filter(e => e.k === 'stroke').reduce((m, e) => (m.get(e.ctx) || m.set(e.ctx, []).get(e.ctx)).push(e) && m, new Map());
  const passes = [...layer.values()].find(list => list.length >= 4) || [];
  const widths = passes.map(e => e.width), alphas = passes.map(e => e.alpha);
  check('bloom is drawn as widening passes, each fainter the wider it is (not a shadow blur, which smears one way and clips at the edge)',
    passes.length >= 4 && widths.every((w, i) => !i || w < widths[i - 1]) && alphas.every((a, i) => !i || a >= alphas[i - 1]) && !got.some(e => e.k === 'shadowBlur' && passes.some(p => p.ctx === e.ctx)));
  const { EFFECTS } = await import('../tunables.js');
  check('the bloom tunables are sane', EFFECTS.bloomPasses >= 1 && EFFECTS.bloomAlpha > 0 && EFFECTS.bloomAlpha < 1);
  const none = draw({ borderBloom: 0 });
  check('no bloom, no bloom layer', !none.some(e => e.k === 'stroke' && passes.some(p => p.ctx === e.ctx))); }

// ---- the vignette ----
{ const vig = o => draw({ ...OFF, vignetteToggle: true, vignetteIntensity: 80, vignetteNoise: 0, vignetteCx: 50, vignetteCy: 50, vignetteAperture: 40, ...o }).find(e => e.k === 'createRadialGradient');
  const [W, H] = page(), a = vig({}), b = vig({ vignetteAperture: 80 }), off = vig({ vignetteCx: 10, vignetteCy: 20 });
  check('aperture moves where the falloff begins (its inner circle grows with it)', a && b && b.a[2] > a.a[2] && Math.abs(a.a[5] - b.a[5]) < 1e-6);
  check('the centre can be moved off-axis', off && Math.abs(off.a[0] - W*0.1) < 1 && Math.abs(off.a[1] - H*0.2) < 1);
  check('an off-centre vignette still reaches the furthest corner', off && off.a[5] >= Math.hypot(W - W*0.1, H - H*0.2));
  const edge = vig({ vignetteCx: 0, vignetteCy: 0 }), past = vig({ vignetteCx: 130, vignetteCy: -40 });
  check('the centre reaches the slider\'s whole range: 0 is the edge (not the middle), and past the page is past it',
    edge && edge.a[0] === 0 && edge.a[1] === 0 && past && Math.abs(past.a[0] - W*1.3) < 1 && Math.abs(past.a[1] + H*0.4) < 1); }
{ const grit = o => { const got = draw({ ...OFF, vignetteToggle: true, vignetteIntensity: 80, vignetteNoise: 100, vignetteCx: 50, vignetteCy: 50, vignetteAperture: 50, ...o });
    return got.filter(e => e.k === 'fillRect' && e.alpha < 1 && e.a[2] < 20); };
  const [W, H] = page(), dots = grit({}), R0 = Math.hypot(W/2, H/2);
  const near = dots.filter(e => Math.hypot(e.a[0] - W/2, e.a[1] - H/2)/R0 < 0.5);
  check('grit skips the clear middle, and gathers where the vignette is strongest', dots.length > 50 && !near.length
    && dots.filter(e => Math.hypot(e.a[0] - W/2, e.a[1] - H/2)/R0 > 0.9).reduce((s, e) => s + e.alpha, 0)/Math.max(1, dots.filter(e => Math.hypot(e.a[0] - W/2, e.a[1] - H/2)/R0 > 0.9).length)
      > dots.filter(e => Math.hypot(e.a[0] - W/2, e.a[1] - H/2)/R0 < 0.7).reduce((s, e) => s + e.alpha, 0)/Math.max(1, dots.filter(e => Math.hypot(e.a[0] - W/2, e.a[1] - H/2)/R0 < 0.7).length));
  // canonical pixels (AGENTS §5.2): a half-size preview is the export scaled down, its specks as fine and as many
  const at = s => { const c = reg['poemCanvas'], w0 = c.width, h0 = c.height; c.width = Math.round(w0*s); c.height = Math.round(h0*s); R.setRenderScale(s);
    const list = grit({}), w = c.width, h = c.height; c.width = w0; c.height = h0; R.setRenderScale(1);
    return { size: list.reduce((t, e) => t + e.a[2], 0)/Math.max(1, list.length)/w, cover: list.reduce((t, e) => t + e.a[2]*e.a[3], 0)/(w*h) }; };
  const full = at(1), half = at(0.5);
  check('grit is measured in the export\'s pixels: a half-size preview is speckled as finely, and as densely, as the saved image',
    Math.abs(half.size/full.size - 1) < 0.15 && Math.abs(half.cover/full.cover - 1) < 0.25); }

// ---- stitches (stitches.js): one function along any path ----
{
  const St = await import('../stitches.js'), P = await import('../textParsers.js');
  check('the stitch menu holds the kept stitches, drawn by one function', St.STITCH_STYLES.length >= 40 && typeof St.drawStitch === 'function');
  check('a retired stitch still parses and draws, as its nearest kept relative (old poems and looks)',
    ['running','satinscallop','pearls','openhearts','diamond'].every(k => St.STITCH_NAMES.includes(k) && St.STITCH_STYLES.includes(St.stitchOf(k)))
    && P.parseRule('<---/satinscallop>', true, true).style === 'satinscallop' && St.stitchOf('satinscallop') === 'scallop');
  check('every kept stitch shapes an inset box: each has its own inner edge',
    St.STITCH_STYLES.every(k => St.stitchInnerEdge(St.pathFromPoints(St.roundRectPoints(0, 0, 300, 200, 0), true), k, { period: 20, amp: 8, width: 2, side: 1 }).length > 50));
  const wavy = k => { const e = St.stitchInnerEdge(St.pathFromPoints(St.roundRectPoints(0, 0, 300, 300, 0), true), k, { period: 30, amp: 10, width: 2, side: 1 });
    const ys = e.slice(0, 40).map(p => p[1]); return Math.max(...ys) - Math.min(...ys) > 4; };
  check('beads bite and scallops scallop: their inner edges move in and out along the border', wavy('beads') && wavy('scallop'));
  check('a stitch has a side to point only where it leaves the line: Points Outward? does nothing for a line, dashes or dots (nor a retired name for them)',
    ['solid', 'dashed', 'dotted', 'running'].every(k => !St.stitchSided(k)) && ['wave', 'beads', 'hearts', 'double'].every(k => St.stitchSided(k)));
  set({ borderStitch: 'solid' }); reg['borderStitch'].dispatchEvent({ type: 'change' });
  const offSolid = reg['borderStitchOut'].disabled;
  set({ borderStitch: 'hearts' }); reg['borderStitch'].dispatchEvent({ type: 'change' });
  check('…so the box is grayed for those, and live for the rest (its tick kept either way)', offSolid === true && reg['borderStitchOut'].disabled === false);
  const path = St.pathFromPoints([[0, 0], [100, 0]], false);
  check('a path measures its length, and its normal points down for a left-to-right line', path.len === 100 && path.point(50, 10)[1] === 10 && path.point(50, 10)[0] === 50);
  const ring = St.pathFromPoints(St.roundRectPoints(0, 0, 100, 60, 10), true);
  check('a rounded rectangle is a closed path, its normal pointing inward', ring.closed && ring.point(30, 5)[1] > 0);
}

done();
