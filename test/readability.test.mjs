/**
 * readability.test.mjs — the words stand off what they sit on: the contrast
 * measure (each line's ink against the ground beneath it) and Protect the
 * Text, which raises Text Clearing just far enough that every line reaches
 * READABLE.ratio. Checked by behavior on the booted app: the mock's probe
 * reads a ground the test controls, as a function of the clearing.
 * (That every preset is readable is presets.test.mjs.)
 *
 * Run: node test/readability.test.mjs
 */
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';
import { READABLE } from '../tunables.js';
import { PROTECT } from '../strings.js';
import { check, done } from './harness.mjs';

// the ground the probe sees: a grey of the test's choosing, for the clearing the page has now
let ground = () => 255;
const probeCanvas = () => { const cv = makeMockCanvas(), g = cv.getContext.bind(cv);
  cv.getContext = (...a) => { const c = g(...a), gid = c.getImageData.bind(c);
    c.getImageData = (x, y, w, h) => { const im = gid(x, y, w, h); if(w !== READABLE.probeWidth) return im;
      const v = ground(parseFloat(reg['textureClearing'].value) || 0); for(let i = 0; i < im.data.length; i += 4){ im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } return im; };
    return c; };
  return cv; };
installCanvasMock();
const reg = installDomMock(makeMockContext, probeCanvas);
// the mock parses no markup: give the lock-finder the page's Text Clearing slider (a range in the Inscription tab)
{ const q = document.querySelectorAll; document.querySelectorAll = sel => /input\[type=range\]\[id\]/.test(sel) ? [document.getElementById('textureClearing')] : (q ? q(sel) : []); }
await import('../appEvents.js');
const R = await import('../canvasRenderer.js');

const settle = () => new Promise(r => setTimeout(r, 80));
const protect = async from => { reg['textureClearing'].value = String(from); document.getElementById('toast').textContent = ''; reg['protectTextBtn'].dispatchEvent({ type: 'click' }); await settle();
  return { amount: parseFloat(reg['textureClearing'].value), said: document.getElementById('toast').textContent || '' }; };
const opening = k => PROTECT[k].split('{')[0];

// ---- the measure ----
{ const field = (w, h, f) => { const d = new Uint8ClampedArray(w*h*4); for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){ const v = f(x, y), i = (y*w + x)*4; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } return d; };
  const white = field(20, 20, () => 255), run = inks => [{ box: [0, 0, 1, 0.5], line: 0, inks }];
  check('black ink on white reads 21:1, the most there is', Math.abs(R.groundContrast(white, 20, 20, run(['#000000'])).worst - 21) < 0.01);
  check('ink on a ground of its own color reads 1:1 (and a three-digit hex is read)', Math.abs(R.groundContrast(white, 20, 20, run(['#FFF'])).worst - 1) < 0.01);
  check('a line in several inks (a gradient, an accent) is held to its worst', R.groundContrast(white, 20, 20, run(['#000000', '#EEEEEE'])).worst < 1.2);
  check('a faint ink (a quote) is laid over the ground before it is measured', R.groundContrast(white, 20, 20, run([[0, 0, 0, 0.5]])).worst < R.groundContrast(white, 20, 20, run(['#000000'])).worst/3);
  const specks = field(20, 20, (x, y) => (x === 3 && y < 5) ? 0 : 255), half = field(20, 20, x => x < 10 ? 0 : 255);
  check('a speck of a busy ground under a line is forgiven (READABLE.allowance); half the ground is not',
    R.groundContrast(specks, 20, 20, run(['#000000'])).worst > 20 && R.groundContrast(half, 20, 20, run(['#000000'])).worst < 1.01);
  const two = R.groundContrast(field(20, 20, (x, y) => y < 10 ? 255 : 40), 20, 20, [{ box: [0, 0, 1, 0.5], line: 0, inks: ['#000000'] }, { box: [0, 0.5, 1, 1], line: 1, inks: ['#000000'] }]);
  check('each line is measured on its own ground, and the faintest one is named', two.lines.length === 2 && two.line === 1 && two.worst < two.lines[0].ratio);
  const own = R.groundContrast(white, 20, 20, [{ box: [0, 0, 1, 0.5], line: 0, inks: ['#000000'] }, { box: [0, 0.5, 1, 1], line: 1, inks: ['#F0F0F0'] }]);
  check('each line is held to its own inks: a pale accent line is the faint one on white', own.line === 1);
  // a line in several segments: each read in its own ink, where it is written; a ramp of colors along its width
  const lr = field(20, 20, x => x < 10 ? 255 : 0), spans = (a, b) => [{ box: [0, 0, 1, 0.5], line: 0, spans: [{ x0: 0, x1: 0.5, inks: [a] }, { x0: 0.5, x1: 1, inks: [b] }] }];
  check('each segment of a line is read where it is written: black over white beside white over black reads 21:1, swapped 1:1',
    Math.abs(R.groundContrast(lr, 20, 20, spans('#000000', '#FFFFFF')).worst - 21) < 0.01 && R.groundContrast(lr, 20, 20, spans('#FFFFFF', '#000000')).worst < 1.01);
  const ramp = cols => R.groundContrast(white, 20, 20, [{ box: [0, 0, 1, 0.5], line: 0, spans: [{ x0: 0, x1: 1, ramp: cols }] }]).worst;
  check('a gradient across a segment (a rainbow, an accent fade) is read color by color along it', ramp(['#000000', '#000000']) > 20.9 && ramp(['#000000', '#FFFFFF']) < 2 && ramp(['#000000', '#FFFFFF']) > 1.01);
  const inkField = field(20, 20, x => x < 10 ? 0 : 255);
  check('a text gradient laid across the page is read from the ink it paints there', R.groundContrast(white, 20, 20, [{ box: [0, 0, 0.5, 1], line: 0, spans: [{ x0: 0, x1: 1, page: true, alpha: 1 }] }], 0.1, inkField).worst > 20.9
    && R.groundContrast(white, 20, 20, [{ box: [0.5, 0, 1, 1], line: 0, spans: [{ x0: 0, x1: 1, page: true, alpha: 1 }] }], 0.1, inkField).worst < 1.01);
  // the page, on a ground the test chooses: a poem of plain lines, a quote and both accents, every ink black
  reg['poemText'].value = 'a plain line\n> a quoted line\n[an accented line]\n{the other accent}\nand a last plain line';
  for(const id of ['textColorHex', 'accent1ColorHex', 'accent2ColorHex']) reg[id].value = '#000000';
  reg['textGradientToggle'].checked = false;
  const page = g => { ground = () => g; return R.measureTextGround(); }, light = page(255), dark = page(0);
  check('the page measures its own frame: each line of the poem, on the ground drawn before the words',
    light && light.lines.length === 5 && light.worst > 7 && dark && dark.worst < 1.01);
  check('…its quote measured as faint as it is drawn (black ink at two thirds on white is not 21:1)', light.line === 1 && light.worst < 10 && light.lines.filter(l => l.ratio > 20.9).length === 4); }

// ---- Protect the Text ----
reg['textureToggle'].checked = true; reg['textColorHex'].value = '#000000';
{ // the ground lightens as the surfaces clear: the least clearing that reaches the aim is found, and kept
  ground = c => Math.round(c*2.55);
  const aim = [...Array(101).keys()].find(c => { reg['textureClearing'].value = String(c); return R.measureTextGround().worst >= READABLE.ratio; });
  const got = await protect(10);
  check('it raises Text Clearing to the least that brings every line to ' + READABLE.ratio + ':1 (' + aim + '%)', got.amount === aim && got.said.startsWith(opening('raised')));
  const again = await protect(80);
  check('it never lowers the clearing: a page already readable is left as it is, and told so', again.amount === 80 && again.said.startsWith(opening('already'))); }
{ ground = () => 30;    // the surfaces clear down to a backdrop as dark as the ink
  const got = await protect(20);
  check('when clearing can\'t help, nothing changes and it says why', got.amount === 20 && got.said.startsWith(opening('cannot')));
  reg['textureToggle'].checked = false;
  const off = await protect(20);
  check('…and with no surface shown, it says there is nothing to clear', off.amount === 20 && off.said.startsWith(opening('noSurface')));
  reg['textureToggle'].checked = true; }
{ ground = c => Math.round(c*0.6);   // clearing helps, but never enough
  const got = await protect(0);
  check('when even full clearing falls short, it clears all the way and says how far it got', got.amount === 100 && got.said.startsWith(opening('short')) && /” now stands at [\d.]+:1/.test(got.said)); }
{ // one line's ink is white: on the ground clearing reaches (white) it can't be read, so it is named and left out of the aim
  ground = c => Math.round(c*2.55); reg['accent1ColorHex'].value = '#FFFFFF';
  const aim = [...Array(101).keys()].find(c => { reg['textureClearing'].value = String(c); return R.measureTextGround().lines.every(l => l.line === 2 || l.ratio >= READABLE.ratio); });
  const got = await protect(10);
  check('a line clearing can\'t help is named and left out of the aim: the rest reach it at the least clearing (' + aim + '%)',
    got.amount === aim && got.said.startsWith(opening('raisedBut')) && got.said.includes('“an accented line” can'));
  reg['accent1ColorHex'].value = '#000000'; }
{ ground = c => Math.round(c*2.55);
  const save = () => { reg['advancedRefreshBtn'].dispatchEvent({ type: 'click' }); return JSON.parse(reg['advancedJson'].value); };
  const load = o => { reg['advancedJson'].value = JSON.stringify(o); reg['advancedLoadBtn'].dispatchEvent({ type: 'click' }); };
  load({ ...save(), locks: ['textureClearing'], textureClearing: '5' }); await settle();
  const got = await protect(5);
  check('a lock on Text Clearing holds it', got.amount === 5 && got.said === PROTECT.locked);
  load({ ...save(), locks: [] }); }

done();
