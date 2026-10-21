/**
 * scrollLands.test.mjs — Sunrise Scroll's lands (stepsScroll.js, the Scroll Lands part): the seed picks among them at
 * their odds, the Land setting overrides the seed, each land paints its own maps (Peaks nothing), and whatever stands
 * on a band is hidden by the bands in front of it. Drawn on a real canvas when one is here.
 *
 * Run: node test/scrollLands.test.mjs
 */
import { check, done } from './harness.mjs';

const { scrollLandOf, SCROLL_LANDS, SCROLL_STEPS } = await import('../stepsScroll.js');

// the seed's land, at its odds; the setting's, whatever the seed
{ const c = new Array(SCROLL_LANDS.length).fill(0); for(let s = 1; s <= 1600; s++) c[scrollLandOf(s, 0)]++;
  check(`the seed picks every land, Peaks (the scroll as it was) most often and the curse the rarest (${c.join(' ')})`,
    c.every(v => v > 40) && c[0] === Math.max(...c) && c[7] === Math.min(...c));
  check('Land picks one land for every seed: each eighth of its range the next', [1, 99, 12345].every(s => SCROLL_LANDS.every((_, i) => scrollLandOf(s, 12.5*(i + 1)) === i))); }

let NC = null;
try { NC = await import('@napi-rs/canvas'); globalThis.document = { createElement: () => NC.createCanvas(1, 1) }; }
catch(e){ console.log('(no @napi-rs/canvas here: the drawing checks are skipped)'); }

if(NC){ const W = 120, H = 160, N = W*H;
  // the evaluator's kit, as much of it as the part reads (its marks drawn on a real canvas and read back)
  const E = (bands = []) => ({ ww: W, wh: H, ctx: { seed: 7 }, num: (n, k, d) => n.data[k] ?? d, input: (n, j) => bands[j - 1], asField: v => v || null,
    marks: (base, fill, draw) => { const c = NC.createCanvas(W, H), x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, W, H); draw(x);
      const d = x.getImageData(0, 0, W, H).data, o = new Float32Array(N); for(let i = 0; i < N; i++) o[i] = d[i*4]/255; return o; } });
  const lands = (land, bands) => SCROLL_STEPS.scrolllands.run(E(bands), { data: { land, amount: 70 } });
  const sum = f => f.reduce((a, b) => a + b, 0)/N, rows = (f, y0, y1) => { let s = 0; for(let y = y0; y < y1; y++) for(let x = 0; x < W; x++) s += f[y*W + x]; return s/((y1 - y0)*W); };
  const [ink0, wash0, water0, paper0, acc0, bloom0] = lands(12.5);
  check('Peaks adds nothing: the scroll as it was', [ink0, wash0, water0, paper0, acc0, bloom0].every(f => sum(f) === 0));
  const at = name => lands(12.5*(SCROLL_LANDS.indexOf(name) + 1));
  { const [ink, wash, , paper] = at('Misty Peaks'); check('Misty Peaks: towers washed and inked, mist left bare', sum(wash) > 0.005 && sum(ink) > 0.001 && sum(paper) > 0.005); }
  { const [ink, , water, paper] = at('Coast'); check('Coast: the sea fills the foot of the page, a wave with its foam and its lines', rows(water, H - 10, H) > 0.4 && rows(water, 0, 20) === 0 && sum(paper) > 0.001 && sum(ink) > 0.005); }
  { const [ink, , , paper] = at('Snowy North'); check('Snowy North: snow and flakes left bare, the sky darkened over the hills', sum(paper) > 0.01 && rows(ink, 0, 10) > 0.2); }
  { const [ink] = at('Bamboo'); check('Bamboo: a grove of jointed stalks in ink', sum(ink) > 0.02); }
  { const [ink, wash, , paper, accent] = at('Village'); check('Village: roofs, walls and a gate', sum(wash) > 0 && sum(paper) > 0 && sum(accent) > 0 && sum(ink) > 0); }
  { const [ink, wash, , paper, accent, bloom] = at('Great Tree'); check('Great Tree: a trunk, its rope, a crown of blossom or evergreen, a gate, the terraces', sum(ink) > 0.01 && sum(paper) > 0 && sum(accent) > 0 && sum(bloom) + sum(wash) > 0.01); }
  { const [, , , , accent] = at('Cursed'); check('Cursed: the miasma rises from the ground, strongest at the foot of the page', rows(accent, H - 10, H) > rows(accent, 0, 10) + 0.2); }
  // hidden by the nearer bands: five bands each covering the whole page, so nothing on a far band can show
  { const full = [1, 2, 3, 4, 5].map(() => new Float32Array(N).fill(1)), [, wash] = lands(12.5*(SCROLL_LANDS.indexOf('Village') + 1), full);
    check('what stands on a band is hidden by the bands in front of it (a village\'s roofs, on a far band, behind ridges that cover the page: none show)', sum(wash) === 0); }
}

done();
