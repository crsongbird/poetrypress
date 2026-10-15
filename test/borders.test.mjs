/**
 * borders.test.mjs — the frame: the border (its gradient and bloom), the
 * vignette, and the stitches every border, rule and inset box is sewn with.
 * (The themes are themes.test.mjs; that every control is saved is
 * persistenceCoverage.test.mjs.)
 *
 * Run: node test/borders.test.mjs
 */
import { readFileSync } from 'fs';
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';

installCanvasMock();
installDomMock(makeMockContext, makeMockCanvas);
await import('../appEvents.js');

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };

const cr = readFileSync(new URL('../canvasRenderer.js', import.meta.url), 'utf8');
const border = (cr.match(/if\(\$\('borderToggle'\)\.checked\)\{[\s\S]*?\n  \}/) || [''])[0];
const vig = (cr.match(/if\(\$\('vignetteToggle'\)\.checked\)\{[\s\S]*?\n  \}/) || [''])[0];

// ---- borders ----
check('a border gradient is linear, along its angle (45° is corner to corner)', /const ga = \(parseFloat\(\(\$\('borderGradientAngle'\)/.test(border) && /createLinearGradient\(W\/2 - Math\.cos\(ga\)/.test(border));
// match real usage, not the comment explaining why it is not used
// widening strokes on the bloom's own layer — never shadowBlur, which smears
// one way and clips at the canvas edge, where a border lives
check('bloom is drawn as widening passes, not shadowBlur',
  /lx\.lineWidth = bThick \* \(1 \+ i \* EFFECTS\.bloomSpread \* bloom\)/.test(border) && !/\.shadowBlur\s*=/.test(border));
// the constant moved into tunables.js; what matters is that it still divides
check('bloom fades with each pass', /\(bloom \* EFFECTS\.bloomAlpha \* 1\.6\) \/ i/.test(border));
const { EFFECTS } = await import('../tunables.js');
check('the bloom tunables are sane',
  EFFECTS.bloomPasses >= 1 && EFFECTS.bloomAlpha > 0 && EFFECTS.bloomAlpha < 1);
check('the state is put back afterwards',
  /ctx\.save\(\)/.test(border) && /ctx\.restore\(\)/.test(border));

// ---- vignette ----
check('aperture moves where the falloff begins', /outerR\*aperture\*0\.9/.test(vig));
check('the centre can be moved off-axis', /vignetteCx/.test(vig) && /vignetteCy/.test(vig));
check('an off-centre vignette still reaches the furthest corner',
  /Math\.max\(\s*Math\.hypot\(vcx, vcy\)/.test(vig));
check('grit gathers where the vignette is strongest', /falloff \* intensity \* grit/.test(vig));
check('grit skips the clear middle', /if\(d < aperture\) continue;/.test(vig));

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
  const path = St.pathFromPoints([[0, 0], [100, 0]], false);
  check('a path measures its length, and its normal points down for a left-to-right line', path.len === 100 && path.point(50, 10)[1] === 10 && path.point(50, 10)[0] === 50);
  const ring = St.pathFromPoints(St.roundRectPoints(0, 0, 100, 60, 10), true);
  check('a rounded rectangle is a closed path, its normal pointing inward', ring.closed && ring.point(30, 5)[1] > 0);
}

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
