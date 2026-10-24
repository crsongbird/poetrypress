/**
 * SCROLL LANDS (Sunrise Scroll's process part; Ruby: "the game had a wide variety of lands, so the seed should paint
 * them with more depth"): the lands of an ink scroll, as maps for a graph to wash and ink. Prior art:
 * docs/prior-art/scroll-lands.md (Guo Xi's distances, the five grades of ink, Hokusai's and Hiroshige's prints, the
 * four gentlemen's bamboo, the village, the sacred tree, the cursed land; original lands in that tradition, never a
 * game's places or creatures).
 *
 *   1. The land, by the seed (or Land): Peaks (the scroll as it was), Misty Peaks (towers standing out of the mist), a
 *      Coast (a great wave curling in from one side, its claws of foam, the far sea in arcs, boats), the Snowy North
 *      (snow left as bare paper on every ridge, the sky dark down to the hills, flakes), a Bamboo grove (three depths,
 *      stalks jointed short-long-short, leaves pressed and lifted in twos and threes), a Village (roofs and walls on
 *      a hillside, a gate, now and then a pagoda, a cloud band across it), a Great Tree over terraced fields (its rope
 *      and paper streamers), or the Cursed land (a miasma rising from the ground, black blots, dead trees).
 *   2. Its things stand ON the scroll's own ridges: the graph's band masks (far to near) come in, each band's crest
 *      is read off its mask, and whatever stands on a band is hidden by the bands nearer than it, exactly.
 *   3. Depth by the five grades of ink: what stands on a far band is washed paler and inked lighter than what stands
 *      near; and one tiny thing gives the scale (a boat, a walker), set where the mist leaves room for it.
 *
 * Outputs maps, never colour: Ink (the brush's lines and dark marks), Wash (the land's colour laid flat), Water (the
 * sea), Paper (what is left bare: snow, foam, mist, walls), Accent (a gate's vermilion, the miasma) and Bloom
 * (blossom). A graph lays each in its hue. Sizes in the page's shorter side, so a preview and its export match.
 */
import { mulberry32, seedChoice } from './texCore.js';

const SC_R = (key, label, def, min = 0, max = 100) => [key, label, 'range', def, { min, max }];
export const SCROLL_LANDS = ['Peaks', 'Misty Peaks', 'Coast', 'Snowy North', 'Bamboo', 'Village', 'Great Tree', 'Cursed'];
// (how often the seed picks each, in the order above: the scroll as it was most often, the curse the rarest)
const SC_ODDS = [0.2, 0.14, 0.13, 0.13, 0.12, 0.12, 0.1, 0.06];
/** Which land: the Land setting's (0 for the seed's; then each in turn along its range), or the seed's own. */
export function scrollLandOf(seed, v){ const k = Math.round((+v || 0)/12.5); if(k >= 1) return Math.min(SCROLL_LANDS.length, k) - 1;
  let u = seedChoice(seed >>> 0, 'scroll land')(), i = 0; while(i < SC_ODDS.length - 1 && u >= SC_ODDS[i]){ u -= SC_ODDS[i]; i++; } return i; }

// ---- the brush: a stroke along points, pressed in its middle and lifted at its ends (or as the profile says)
function scBrush(x, pts, w, prof = t => 0.35 + 0.65*Math.sin(Math.PI*Math.min(1, Math.max(0, t)))){ if(pts.length < 2) return;
  const L = [], R = [], n = pts.length;
  for(let i = 0; i < n; i++){ const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, hw = w*prof(i/(n - 1))/2;
    L.push([pts[i][0] - dy/l*hw, pts[i][1] + dx/l*hw]); R.push([pts[i][0] + dy/l*hw, pts[i][1] - dx/l*hw]); }
  x.beginPath(); L.forEach(([p, q], i) => i ? x.lineTo(p, q) : x.moveTo(p, q)); for(let i = n - 1; i >= 0; i--) x.lineTo(R[i][0], R[i][1]); x.closePath(); x.fill(); }
// a blot: an irregular round shape (a crown of leaves, a rock, a cloud of blossom, a wet ink blot)
function scBlot(x, cx, cy, rx, ry, R, rough = 0.25){ const n = 18, p = R()*6.28, q = R()*6.28; x.beginPath();
  for(let i = 0; i <= n; i++){ const a = i/n*Math.PI*2, k = 1 + rough*(0.6*Math.sin(a*3 + p) + 0.4*Math.sin(a*5 + q)) + rough*0.3*(R() - 0.5);
    const X = cx + Math.cos(a)*rx*k, Y = cy + Math.sin(a)*ry*k; i ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.closePath(); x.fill(); }
const scGrey = (x, a) => { x.fillStyle = x.strokeStyle = `rgba(255,255,255,${Math.max(0, Math.min(1, a))})`; };

export const SCROLL_STEPS = {
  scrolllands: { cat: 'Marks', label: 'Scroll Lands', ins: ['far', 'band 2', 'band 3', 'band 4', 'near'], outs: ['ink', 'wash', 'water', 'paper', 'accent', 'bloom'],
    io: { ins: ['field', 'field', 'field', 'field', 'field'], outs: ['field', 'field', 'field', 'field', 'field', 'field'] },
    params: [SC_R('land', 'Land: by the seed, then ' + SCROLL_LANDS.join(' · '), 0), SC_R('amount', 'Amount', 70), SC_R('scale', 'Scale', 100, 50, 200), SC_R('variant', 'Variation', 0, 0, 99)],
    cost: () => 4,
    run(E, n){ const { ww, wh, num } = E, N = ww*wh, U = Math.min(ww, wh), amt = num(n, 'amount', 70)/100, zs = num(n, 'scale', 100)/100, hair = E.px ? E.px(1.2) : 0.6;
      const land = scrollLandOf(E.ctx.seed, num(n, 'land', 0)), seed = ((((E.ctx.seed >>> 0) + Math.round(num(n, 'variant', 0))*7919) >>> 0) ^ 0x5c40) >>> 0, R = mulberry32(seed);
      const rnd = (a, b) => a + (b - a)*R();
      // ---- the scroll's own bands (far to near), or, with none wired, five of our own: and each band's crest
      const masks = [1, 2, 3, 4, 5].map(j => E.asField(E.input(n, j)));
      if(masks.every(m => !m)) for(let j = 0; j < 5; j++){ const m = new Float32Array(N), base = wh*(0.32 + 0.13*j), a = U*(0.12 - 0.015*j), p = R()*6.28;
        for(let X = 0; X < ww; X++){ const c = base - a*(0.5 + 0.5*Math.sin(X/U*(3 + j) + p)*Math.sin(X/U*1.3 + p*2)); for(let Y = Math.max(0, Math.floor(c)); Y < wh; Y++) m[Y*ww + X] = 1; } masks[j] = m; }
      const B = masks.map(m => m || new Float32Array(N)), crest = B.map(m => { const c = new Float32Array(ww).fill(wh);
        for(let X = 0; X < ww; X++) for(let Y = 0; Y < wh; Y++) if(m[Y*ww + X] > 0.5){ c[X] = Y; break; } return c; });
      // (what is left of band k once the nearer bands stand in front of it)
      const occl = k => { const o = new Float32Array(N).fill(1); for(let j = k + 1; j < 5; j++){ const m = B[j]; for(let i = 0; i < N; i++) o[i] *= 1 - Math.min(1, m[i]); } return o; };
      const crAt = (k, X) => crest[k][Math.max(0, Math.min(ww - 1, Math.round(X)))];
      const grade = k => [0.3, 0.45, 0.6, 0.8, 1][k];   // (the five grades of ink, clear far to charred near)
      // ---- the land's things, each drawn on a band (or in front of all, band 5), into the maps
      const MAPS = ['ink', 'wash', 'water', 'paper', 'accent', 'bloom'], ops = [];   // { k, map, draw(x) }
      const put = (k, map, draw) => ops.push({ k, map, draw }), fields = { snow: null };
      const pathOf = (k, x0, x1) => { const pts = []; for(let X = x0; X <= x1; X += Math.max(1, U*0.004)) pts.push([X, crAt(k, X)]); return pts; };
      // a little evergreen, a pine of a few tiers (on crags and ridges)
      const pine = (k, X, Y, h, a) => put(k, 'ink', x => { scGrey(x, a); x.fillRect(X - h*0.03, Y - h, h*0.06, h);
        for(let t = 0; t < 4; t++){ const y = Y - h*(0.3 + t*0.2), wd = h*(0.42 - t*0.08); scBrush(x, [[X - wd, y + h*0.04], [X, y - h*0.05], [X + wd, y + h*0.03]], h*0.09); } });
      // a walker in three strokes, for the scale
      const walker = (k, X, Y, h, a) => put(k, 'ink', x => { scGrey(x, a); scBrush(x, [[X, Y - h], [X + h*0.05, Y - h*0.45]], h*0.22); scBrush(x, [[X + h*0.05, Y - h*0.45], [X - h*0.1, Y]], h*0.12); scBrush(x, [[X + h*0.05, Y - h*0.45], [X + h*0.18, Y]], h*0.12);
        x.beginPath(); x.arc(X, Y - h*1.08, h*0.11, 0, Math.PI*2); x.fill(); });
      // a bare tree with crab-claw branches
      const bare = (k, X, Y, h, a) => put(k, 'ink', x => { scGrey(x, a);
        const limb = (x0, y0, ang, len, w, d) => { const x1 = x0 + Math.cos(ang)*len, y1 = y0 - Math.sin(ang)*len; scBrush(x, [[x0, y0], [(x0 + x1)/2 + (R() - 0.5)*len*0.2, (y0 + y1)/2], [x1, y1]], w, t => 1 - 0.6*t);
          if(d > 0) for(let b = 0; b < 2 + (R() < 0.5 ? 1 : 0); b++) limb(x1, y1, ang + (R() - 0.5)*1.4 + (b - 0.5)*0.5, len*(0.55 + 0.2*R()), w*0.6, d - 1);
          else { scBrush(x, [[x1, y1], [x1 + Math.cos(ang - 0.9)*len*0.3, y1 - Math.sin(ang - 0.9)*len*0.3]], w*0.5, t => 1 - t); } };
        limb(X, Y, Math.PI/2 + (R() - 0.5)*0.3, h*0.42, h*0.07, 3); });

      if(land === 1){ // MISTY PEAKS: towers standing out of the mist in the middle distance (no outline, mokkotsu: the wash darkest at the
        // top and gone to paper at the foot), a few axe-cut strokes and moss dots on their shadow sides, pines on their tops
        const nT = 4 + Math.floor(R()*5*amt + 1);
        // (each where at least half of it stands clear of the ridges in front of it: tried a few places, the best kept)
        const front = (k, X) => { let c = wh; for(let j = k + 1; j < 5; j++) c = Math.min(c, crAt(j, X)); return c; };
        const towers = []; for(let t = 0; t < nT; t++){ const k = [2, 3, 3, 4][Math.floor(R()*4)], h = U*rnd(0.24, 0.5)*zs*(0.75 + 0.12*k); let X = ww/2, best = -1e9;
          for(let tr = 0; tr < 8; tr++){ const X1 = ww*(0.06 + 0.88*R()), clear = front(k, X1) - (crAt(k, X1) + U*0.05 - h); if(clear > best){ best = clear; X = X1; } }
          if(best > h*0.45) towers.push({ k, X, h }); }
        towers.sort((a, b) => a.k - b.k);
        for(const { k, X, h } of towers){ const base = crAt(k, X) + U*0.05, w0 = h*rnd(0.18, 0.3), top = base - h, lean = (R() - 0.5)*w0*0.5, sug = R() < 0.5, ph = R()*6.28;
          // (its two sides: swelling and pinching as the rock does, rounded over the top or broken into a crag)
          const sideAt = (s, sd) => { const wd = w0*(sug ? Math.sqrt(Math.max(0, Math.sin(Math.min(1, s*1.6)*Math.PI/2))) : 0.55 + 0.45*Math.pow(s, 0.5))*(1 + 0.12*Math.sin(s*11 + ph + sd) + 0.06*Math.sin(s*23 + ph*2));
            return [X + lean*(1 - s) + sd*wd, top + h*s]; };
          const L = [], Rr = []; for(let q = 0; q <= 20; q++){ L.push(sideAt(q/20, -1)); Rr.push(sideAt(q/20, 1)); }
          if(!sug) L[0] = Rr[0] = [X + lean + w0*0.1*(R() - 0.5), top - h*0.03];
          const poly = [...L, ...Rr.reverse()], shade = R() < 0.5 ? L : Rr.slice().reverse();
          put(k, 'wash', x => { const g = x.createLinearGradient(0, top, 0, base); g.addColorStop(0, `rgba(255,255,255,${0.55*grade(k)})`); g.addColorStop(0.5, `rgba(255,255,255,${0.28*grade(k)})`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g;
            x.beginPath(); poly.forEach(([p, q], i) => i ? x.lineTo(p, q) : x.moveTo(p, q)); x.closePath(); x.fill(); });
          put(k, 'ink', x => { const g = x.createLinearGradient(0, top, 0, top + h*0.7); g.addColorStop(0, `rgba(255,255,255,${0.6*grade(k)})`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g;
            scBrush(x, shade.slice(0, 15), w0*0.1, t => 0.9 - 0.6*t);
            for(let s2 = 0; s2 < 3 + 4*amt; s2++){ const q = Math.floor(rnd(0.05, 0.6)*20), p = shade[q], inw = (X - p[0])*rnd(0.1, 0.35);
              x.beginPath(); x.moveTo(p[0] + inw*0.2, p[1]); x.lineTo(p[0] + inw, p[1] + h*0.07); x.lineTo(p[0] + inw*0.5, p[1] + h*0.075); x.closePath(); x.fill(); }
            for(let d = 0; d < 10; d++){ const q = Math.floor(rnd(0, 0.35)*20), p = shade[q], dx = (X - p[0])*rnd(0, 0.8); x.beginPath(); x.arc(p[0] + dx, p[1] + h*0.01, Math.max(hair, w0*0.035), 0, Math.PI*2); x.fill(); } });
          if(R() < 0.65) pine(k, X + lean + w0*rnd(-0.25, 0.25), top + h*(sug ? 0.06 : 0.02), h*rnd(0.09, 0.14), 0.85*grade(k)); }
        // (mist in long bands, rounded at their ends, biting into the towers)
        const nM = 2 + Math.floor(R()*3); for(let m = 0; m < nM; m++){ const k = 1 + Math.floor(R()*3), y = crAt(k, ww/2) + U*rnd(-0.06, 0.04), x0 = ww*rnd(-0.2, 0.5), len = ww*rnd(0.5, 1), th = U*rnd(0.03, 0.06);
          put(k, 'paper', x => { const g = x.createLinearGradient(0, y - th, 0, y + th); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${0.7*amt + 0.2})`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; scBlot(x, x0 + len/2, y, len/2, th, R, 0.12); }); }
        // (a boat on the mist's water, or a walker on the near path: the scale)
        walker(4, ww*rnd(0.2, 0.8), crAt(4, ww*0.5) + U*0.02, U*0.02*zs, 0.9); }

      if(land === 2){ // A COAST: the sea in front, a great wave curling in from one side, its claws of foam; the far sea in arcs; boats
        const side = R() < 0.5 ? -1 : 1, seaY = Math.min(...Array.from({ length: 9 }, (_, q) => crAt(4, ww*q/8))) + U*rnd(0.02, 0.06), Ah = (wh - seaY);
        put(5, 'water', x => { const g = x.createLinearGradient(0, seaY, 0, wh); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0.95)'); x.fillStyle = g; x.fillRect(0, seaY, ww, wh - seaY); });
        put(5, 'paper', x => { scGrey(x, 0.5); x.fillRect(0, seaY - U*0.003, ww, U*0.004); });
        // (the far sea as seigaiha: rows of overlapping arcs, smaller toward the horizon)
        put(5, 'ink', x => { x.lineWidth = Math.max(hair, U*0.0015);
          for(let row = 0, y = seaY + U*0.01; y < wh && row < 40; row++){ const r = U*(0.008 + 0.04*(y - seaY)/Ah)*zs; scGrey(x, 0.18 + 0.2*(y - seaY)/Ah); x.strokeStyle = x.fillStyle;
            for(let X = (row % 2)*r; X < ww + r; X += r*2){ for(let c = 1; c <= 3; c++){ x.beginPath(); x.arc(X, y + r, r*c/3, Math.PI*1.05, Math.PI*1.95); x.stroke(); } } y += r*0.9; } });
        // (the great wave: its back rising from the side it comes in from to its crest, the lip rolling forward and down in a
        //  spiral's turn, the hollow under it; claws of foam along the lip, each broken again into smaller claws)
        const crestX = side > 0 ? ww*rnd(0.38, 0.55) : ww*rnd(0.45, 0.62), crestY = seaY - wh*rnd(0.16, 0.3)*(0.6 + 0.4*amt), Hh = wh - crestY, r0 = Hh*rnd(0.2, 0.27), wx0 = side > 0 ? -ww*0.08 : ww*1.08;
        const back = []; for(let q = 0; q <= 24; q++){ const s2 = q/24; back.push([wx0 + (crestX - wx0)*s2, wh - (wh - crestY)*Math.pow(Math.sin(s2*Math.PI/2), 1.4)]); }
        const O = [crestX + side*r0*0.12, crestY + r0], spiral = [];
        for(let q = 0; q <= 30; q++){ const th = -Math.PI/2 + q/30*Math.PI*1.35, r = r0*Math.exp(-0.32*(th + Math.PI/2)); spiral.push([O[0] + side*Math.cos(th)*r, O[1] + Math.sin(th)*r]); }
        const inner = spiral[spiral.length - 1], face = [inner, [O[0] - side*r0*0.15, O[1] + r0*0.5], [crestX + side*r0*0.35, seaY + (wh - seaY)*0.15], [crestX + side*r0*0.6, wh + 4]];
        const body = [[wx0, wh + 4], ...back, ...spiral, ...face];
        put(5, 'water', x => { scGrey(x, 0.95); x.beginPath(); body.forEach(([p, q], i) => i ? x.lineTo(p, q) : x.moveTo(p, q)); x.closePath(); x.fill(); });
        put(5, 'ink', x => { // (dark stripes down its hollow, following its back, and the outline in a strong, trembling line)
          for(let st = 1; st <= 8; st++){ const t = st/9; scGrey(x, 0.2 + 0.45*t); const pts = back.slice(8).map(([p, q]) => [p + side*Hh*0.05*t - side*Hh*0.02, q + (wh - q)*t*0.85]); scBrush(x, pts, U*0.005*(1.2 - 0.6*t)); }
          scGrey(x, 0.95); scBrush(x, [...back.slice(4), ...spiral], U*0.007, t => 0.6 + 0.4*Math.sin(Math.PI*t)); scBrush(x, face.slice(0, 3), U*0.004); });
        put(5, 'paper', x => { scGrey(x, 0.95); const nC = Math.round(12 + 10*amt);
          // (the foam along the crest's back, then the claws reaching out of the lip, each broken into three smaller)
          for(let f = 0; f < 10; f++){ const p = back[16 + Math.floor(R()*8)]; scBlot(x, p[0], p[1] + U*0.006, U*rnd(0.01, 0.025), U*rnd(0.006, 0.012), R, 0.3); }
          for(let c = 0; c < nC; c++){ const q = Math.floor(c/nC*20), p = spiral[q], th = -Math.PI/2 + q/30*Math.PI*1.35, len = r0*rnd(0.18, 0.34)*(1 - 0.4*q/20), ang = th + (R() - 0.5)*0.4;
            const tip = [p[0] + side*Math.cos(ang)*len, p[1] + Math.sin(ang)*len]; scBrush(x, [p, [(p[0] + tip[0])/2, (p[1] + tip[1])/2 + len*0.08], tip], len*0.4, t => 1 - 0.7*t);
            for(let f = 0; f < 3; f++){ const a2 = ang + (f - 1)*0.7 + 0.3, l2 = len*rnd(0.35, 0.55); scBrush(x, [tip, [tip[0] + side*Math.cos(a2)*l2*0.6, tip[1] + Math.sin(a2)*l2*0.6 - l2*0.1], [tip[0] + side*Math.cos(a2)*l2, tip[1] + Math.sin(a2)*l2]], len*0.2, t => 1 - 0.85*t); } }
          for(let sp = 0; sp < 80*amt; sp++){ const X = crestX + side*r0*rnd(0, 1.8), Y = crestY + r0*rnd(-0.2, 1.6); x.beginPath(); x.arc(X, Y, U*rnd(0.002, 0.006), 0, Math.PI*2); x.fill(); } });
        // (a small wave behind, repeating the peaks' own shape)
        { const X = crestX + side*ww*rnd(0.25, 0.4), Y = seaY + (wh - seaY)*0.2, hs = Hh*0.18;
          put(5, 'water', x => { scGrey(x, 0.85); x.beginPath(); x.moveTo(X - hs, Y + hs*0.2); x.quadraticCurveTo(X - hs*0.2, Y - hs*0.9, X + hs*0.3, Y - hs); x.quadraticCurveTo(X + hs*0.1, Y - hs*0.4, X + hs, Y + hs*0.2); x.closePath(); x.fill(); });
          put(5, 'paper', x => { scGrey(x, 0.9); scBlot(x, X + hs*0.15, Y - hs*0.9, hs*0.25, hs*0.12, R, 0.3); });
          put(5, 'ink', x => { scGrey(x, 0.8); scBrush(x, [[X - hs, Y + hs*0.2], [X - hs*0.2, Y - hs*0.7], [X + hs*0.3, Y - hs]], U*0.003); }); }
        // (boats, small, heading into the trough: the scale)
        for(let b = 0; b < 1 + Math.floor(R()*3); b++){ const X = crestX + side*r0*rnd(0.6, 1.8), Y = seaY + (wh - seaY)*rnd(0.35, 0.75), L = U*rnd(0.04, 0.07)*zs, tilt = side*rnd(0.1, 0.3);
          put(5, 'paper', x => { scGrey(x, 0.9); scBrush(x, [[X - L/2, Y - Math.sin(tilt)*L/2], [X + L/2, Y + Math.sin(tilt)*L/2]], L*0.16, t => 0.5 + 0.5*Math.sin(Math.PI*t)); });
          put(5, 'ink', x => { scGrey(x, 0.8); for(let r = 0; r < 4; r++){ const u = (r + 0.5)/4 - 0.5; x.beginPath(); x.arc(X + u*L*0.8, Y + u*Math.sin(tilt)*L - L*0.1, L*0.035, 0, Math.PI*2); x.fill(); } }); } }

      if(land === 3){ // THE SNOWY NORTH: snow left bare on every ridge (below its inked crest, as deep as the band is near), the sky dark to the hills, flakes cut out
        const snow = new Float32Array(N), ph = R()*6.28;
        for(let k = 0; k < 5; k++){ if(!masks[k]) continue; const o = occl(k), d0 = U*(0.03 + 0.03*k)*(0.6 + 0.8*amt);
          for(let X = 0; X < ww; X++){ const c = crest[k][X]; if(c >= wh) continue; const d = d0*(0.6 + 0.4*Math.sin(X/U*23 + ph + k) + 0.25*Math.sin(X/U*61 + k*2)), top = c + U*0.006;
            for(let Y = Math.floor(top); Y < Math.min(wh, top + d*1.6); Y++){ const i = Y*ww + X, s = (Y - top)/d, v = s < 1 ? 1 : Math.max(0, 1 - (s - 1)/0.6); snow[i] = Math.max(snow[i], v*B[k][i]*o[i]*0.92); } } }
        fields.snow = snow;
        // (the sky dark down to the hills: a graded grey above the far ridge)
        put(0, 'ink', x => { const top = Math.min(...crest[0]); const g = x.createLinearGradient(0, 0, 0, Math.max(1, top + U*0.05)); g.addColorStop(0, `rgba(255,255,255,${0.35 + 0.25*amt})`); g.addColorStop(1, 'rgba(255,255,255,0.05)'); x.fillStyle = g; x.fillRect(0, 0, ww, top + U*0.05); });
        put(5, 'paper', x => { scGrey(x, 0.9); for(let f = 0; f < 500*amt; f++){ const r = U*(0.0015 + 0.004*R()*R()); x.beginPath(); x.arc(R()*ww, R()*wh, r, 0, Math.PI*2); x.fill(); } });
        // (evergreens on the near ridges, their tiers laden)
        for(let t = 0; t < 4 + 8*amt; t++){ const k = 3 + (R() < 0.5 ? 1 : 0), X = ww*R(); pine(k, X, crAt(k, X) + U*0.01, U*rnd(0.05, 0.12)*zs*(k === 4 ? 1.4 : 1), 0.9*grade(k)); } }

      if(land === 4){ // BAMBOO: a grove in three depths (palest far, darkest near), stalks jointed short-long-short, each segment dark at its
        // edges and paler down its middle, a gap at each joint; leaves one press-and-lift stroke each, in twos, threes and fives
        const wind = (R() - 0.5)*0.35;
        const grove = (k, count, hgt, wid, a, sides) => { for(let s2 = 0; s2 < count; s2++){ let X = ww*R(); if(sides && Math.abs(X - ww/2) < ww*0.2) X = X < ww/2 ? X - ww*0.2 : X + ww*0.2;
          const Y = k === 5 ? wh + U*0.02 : crAt(k, X) + U*0.03, H = hgt*rnd(0.75, 1.2), w = wid*rnd(0.75, 1.2), lean = (wind*0.25 + (R() - 0.5)*0.06)*H, segs = 7 + Math.floor(R()*4);
          put(k, 'ink', x => { let y0 = Y, x0 = X;
            for(let g = 0; g < segs; g++){ const u = g/segs, len = H/segs*(0.7 + 0.6*Math.sin(Math.PI*u)), y1 = y0 - len, x1 = X + lean*(Y - y1)/H, ww2 = w*(1 - 0.35*u), gap = Math.max(hair, w*0.18);
              scGrey(x, a*0.45); x.beginPath(); x.moveTo(x0 - ww2/2, y0 - gap); x.lineTo(x1 - ww2/2, y1 + gap); x.lineTo(x1 + ww2/2, y1 + gap); x.lineTo(x0 + ww2/2, y0 - gap); x.closePath(); x.fill();
              scGrey(x, a); scBrush(x, [[x0 - ww2*0.42, y0 - gap], [x1 - ww2*0.42, y1 + gap]], ww2*0.22, () => 1); scBrush(x, [[x0 + ww2*0.42, y0 - gap], [x1 + ww2*0.42, y1 + gap]], ww2*0.18, () => 1);
              scBrush(x, [[x1 - ww2*0.55, y1 + gap*0.4], [x1 - ww2*0.1, y1 - gap*0.2], [x1 + ww2*0.55, y1 + gap*0.4]], gap*0.9, () => 1);   // (the joint)
              if(g > segs*0.4 && R() < 0.7){ const sd = R() < 0.5 ? -1 : 1, bl = H*rnd(0.06, 0.12), bx = x1 + sd*bl, by = y1 - bl*0.35; scBrush(x, [[x1, y1], [bx, by]], ww2*0.18, t => 1 - 0.6*t);
                const nl = [2, 3, 3, 5][Math.floor(R()*4)];
                for(let l = 0; l < nl; l++){ const ang = Math.PI/2 + sd*rnd(0.25, 0.9) + (l - (nl - 1)/2)*0.35 + wind*1.2, ll = H*rnd(0.07, 0.11);
                  scGrey(x, a*rnd(0.7, 1)); scBrush(x, [[bx, by], [bx + Math.cos(ang)*ll*0.45, by + Math.sin(ang)*ll*0.45], [bx + Math.cos(ang)*ll, by + Math.sin(ang)*ll]], ll*0.17, t => t < 0.25 ? 0.3 + 2.8*t : 1.05 - (t - 0.25)/0.75); } }
              x0 = x1; y0 = y1; } }); } };
        grove(2, Math.round(12*amt + 4), U*0.32*zs, U*0.006*zs, 0.3, false);
        grove(3, Math.round(9*amt + 3), U*0.5*zs, U*0.009*zs, 0.55, false);
        grove(5, Math.round(4*amt + 2), U*1.15*zs, U*0.02*zs, 0.95, true);
        for(const k of [2, 3]) put(k, 'paper', x => { const y = crAt(k, ww/2) + U*0.05, g = x.createLinearGradient(0, y - U*0.08, 0, y + U*0.08); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, y - U*0.08, ww, U*0.16); });
        walker(4, ww*rnd(0.38, 0.62), crAt(4, ww/2) + U*0.04, U*0.03*zs, 0.85); }

      if(land === 5){ // A VILLAGE: roofs and walls on a hillside, a gate, now and then a pagoda, a cloud band across it
        // (it stands where most of a hillside shows, between its crest and the nearer ridges in front of it)
        const room = (k, X) => { let c = wh; for(let j = k + 1; j < 5; j++) c = Math.min(c, crAt(j, X)); return c - crAt(k, X); };
        let k = 2, xc = ww/2, best = -1; for(const kk of [2, 3]) for(let X = ww*0.18; X < ww*0.82; X += U*0.01){ const r = room(kk, X); if(r > best){ best = r; k = kk; xc = X; } }
        const nH = 5 + Math.floor(8*amt), sz = U*0.04*zs*(k === 3 ? 1.2 : 1), spread = ww*0.25;
        const houses = []; for(let hh = 0; hh < nH*3 && houses.length < nH; hh++){ const X = xc + (R() + R() - 1)*spread, s = sz*rnd(0.75, 1.25), r = room(k, X); if(r < s*1.6) continue;
          houses.push({ X, Y: crAt(k, X) + s*0.9 + (r - s*1.6)*Math.pow(R(), 1.5)*0.8, s, thatch: R() < 0.35 }); }
        houses.sort((a, b) => a.Y - b.Y);
        for(const { X, Y, s, thatch } of houses){ const wd = s*rnd(1.1, 1.6), wl = s*0.55, rh = s*(thatch ? 0.75 : 0.5), ov = s*0.22;
          const roof = [[X - wd/2 - ov, Y - wl], [X - wd/2 + s*0.2, Y - wl - rh], [X + wd/2 - s*0.2, Y - wl - rh], [X + wd/2 + ov, Y - wl], [X, Y - wl + s*0.04]];
          put(k, 'paper', x => { scGrey(x, 0.85); x.fillRect(X - wd/2, Y - wl, wd, wl); });
          put(k, 'wash', x => { scGrey(x, thatch ? 0.55 : 0.75); x.beginPath(); roof.slice(0, 4).forEach(([p, q], i) => i ? x.lineTo(p, q) : x.moveTo(p, q)); x.quadraticCurveTo(X, Y - wl + s*0.06, roof[0][0], roof[0][1]); x.fill(); });
          put(k, 'ink', x => { scGrey(x, 0.8); scBrush(x, [roof[0], [X - wd/2, Y - wl - s*0.02], [X + wd/2, Y - wl - s*0.02], roof[3]], s*0.05); scBrush(x, [roof[1], roof[2]], s*(thatch ? 0.12 : 0.06));
            if(!thatch) for(let r = 1; r < 5; r++){ const u = r/5; scGrey(x, 0.35); scBrush(x, [[roof[0][0] + (roof[1][0] - roof[0][0])*u + (roof[3][0] - roof[0][0])*0.0, roof[0][1] + (roof[1][1] - roof[0][1])*u], [roof[3][0] + (roof[2][0] - roof[3][0])*u, roof[3][1] + (roof[2][1] - roof[3][1])*u]], s*0.02, () => 1); }
            scGrey(x, 0.7); x.fillRect(X - wd*0.12, Y - wl*0.7, wd*0.24, wl*0.7); x.fillRect(X - wd/2, Y - s*0.03, wd, s*0.04); }); }
        // (a gate: two posts, a tie beam, a lintel curving up at its ends; its body vermilion, its lintel black)
        { const X = xc + (R() < 0.5 ? -1 : 1)*spread*rnd(0.6, 1), Y = crAt(4, X) + U*0.05, h = U*0.09*zs, w = h*0.95;
          put(4, 'accent', x => { scGrey(x, 0.95); x.fillRect(X - w*0.38, Y - h, w*0.09, h); x.fillRect(X + w*0.29, Y - h, w*0.09, h); x.fillRect(X - w*0.45, Y - h*0.78, w*0.9, h*0.07); x.fillRect(X - w*0.52, Y - h*0.96, w*1.04, h*0.08); });
          put(4, 'ink', x => { scGrey(x, 0.95); scBrush(x, [[X - w*0.62, Y - h*0.98], [X - w*0.3, Y - h*1.02], [X + w*0.3, Y - h*1.02], [X + w*0.62, Y - h*0.98 - h*0.1]], h*0.06, () => 1);
            x.beginPath(); x.moveTo(X - w*0.62, Y - h*0.98); x.lineTo(X - w*0.7, Y - h*1.1); x.lineTo(X - w*0.5, Y - h*1.02); x.fill(); }); }
        // (a pagoda of three or five roofs, its eave tips on one straight line, now and then)
        if(R() < 0.55){ const X = xc + (R() - 0.5)*spread*1.6, Y = crAt(k, X) + sz*0.6, st = R() < 0.5 ? 3 : 5, H = sz*(st === 3 ? 3.2 : 4.6), w0 = sz*1.7;
          for(let t = 0; t < st; t++){ const y = Y - H*t/st - H*0.12, w = w0*(1 - 0.55*t/st), body = w*0.55, hh = H/st;
            put(k, 'paper', x => { scGrey(x, 0.8); x.fillRect(X - body/2, y - hh*0.75, body, hh*0.75); });
            put(k, 'wash', x => { scGrey(x, 0.8); x.beginPath(); x.moveTo(X - w/2, y - hh*0.72); x.quadraticCurveTo(X, y - hh*0.95, X + w/2, y - hh*0.72); x.lineTo(X + w*0.32, y - hh*0.95); x.lineTo(X - w*0.32, y - hh*0.95); x.closePath(); x.fill(); });
            put(k, 'ink', x => { scGrey(x, 0.85); scBrush(x, [[X - w/2, y - hh*0.68], [X, y - hh*0.78], [X + w/2, y - hh*0.68]], sz*0.07, () => 1); }); }
          put(k, 'ink', x => { scGrey(x, 0.9); x.fillRect(X - sz*0.03, Y - H*1.12 - sz*0.6, sz*0.06, sz*0.8); }); }
        // (a cloud band across the village, cutting it into a scene)
        put(4, 'paper', x => { const y = crAt(k, xc) - sz*rnd(0.5, 1.5), g = x.createLinearGradient(0, y - sz*0.6, 0, y + sz*0.6); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; scBlot(x, xc + spread*rnd(-0.5, 0.5), y, spread*rnd(0.4, 0.8), sz*0.5, R, 0.1); });
        for(let t = 0; t < 6 + 10*amt; t++){ const X = xc + (R() - 0.5)*spread*2.4; put(k, 'ink', x => { scGrey(x, 0.6); scBlot(x, X, crAt(k, X) + sz*rnd(0, 1), sz*rnd(0.3, 0.6), sz*rnd(0.25, 0.45), R, 0.3); }); }
        walker(4, xc + spread*rnd(-0.4, 0.4), crAt(4, xc) + U*0.03, U*0.025*zs, 0.85); }

      if(land === 6){ // A GREAT TREE over terraced fields: a vast trunk on the near ridge, its crown in blossom or evergreen, its rope and streamers
        const k = 4, sideX = R() < 0.5 ? ww*rnd(0.16, 0.3) : ww*rnd(0.7, 0.84), Y = crAt(k, sideX) + U*0.03, H = U*rnd(0.5, 0.7)*zs, tw = H*0.16, cherry = R() < 0.55;
        // (the terraces on the near band's face: steps following its crest, each a mirror of the sky edged in dry ink)
        const nS = Math.round(6 + 8*amt); for(let s = 1; s <= nS; s++){ const off = (wh - Math.min(...crest[k]))*Math.pow(s/(nS + 1), 1.25);
          put(k, 'ink', x => { scGrey(x, 0.25 + 0.4*s/nS); const pts = []; for(let X = -4; X <= ww + 4; X += U*0.01) pts.push([X, crAt(k, X) + off + U*0.006*Math.sin(X/U*14 + s)]); scBrush(x, pts, U*(0.002 + 0.004*s/nS), () => 1); });
          put(k, 'wash', x => { scGrey(x, 0.12 + 0.15*(s % 2)); const pts = []; for(let X = -4; X <= ww + 4; X += U*0.01) pts.push([X, crAt(k, X) + off]); x.beginPath(); pts.forEach(([p, q], i) => i ? x.lineTo(p, q) : x.moveTo(p, q)); for(let i = pts.length - 1; i >= 0; i--) x.lineTo(pts[i][0], pts[i][1] + U*0.012*(1 + s/nS)); x.closePath(); x.fill(); });
          put(k, 'paper', x => { scGrey(x, 0.55); for(let g = 0; g < 4; g++){ const X = ww*R(), y = crAt(k, X) + off + U*0.008*(1 + s/nS); x.fillRect(X, y, U*rnd(0.03, 0.09), Math.max(hair, U*0.0018)); } }); }
        // (the trunk: wide at its roots, gnarled, its bark in long dry strokes)
        const trunk = []; for(let q = 0; q <= 12; q++){ const s = q/12; trunk.push([sideX + Math.sin(s*3.1 + 1)*tw*0.3, Y - H*0.62*s]); }
        put(5, 'ink', x => { scGrey(x, 0.5); scBrush(x, trunk, tw, t => 1.4 - 0.7*t); scBrush(x, [[sideX - tw*1.1, Y + tw*0.1], [sideX, Y - tw*0.4], [sideX + tw*1.1, Y + tw*0.1]], tw*0.5); });
        put(5, 'ink', x => { scGrey(x, 0.95); for(const sd of [-1, 1]) scBrush(x, trunk.map(([p, q], i) => [p + sd*tw*(0.7 - 0.35*i/12)*0.98, q]), tw*0.12, t => 1 - 0.5*t);
          scGrey(x, 0.45); for(let b = 0; b < 14; b++){ const u = R(), p = trunk[Math.floor(u*11)], dx = (R() - 0.5)*tw*1.1; scBrush(x, [[p[0] + dx, p[1]], [p[0] + dx*1.05, p[1] - H*0.08]], tw*0.04, t => Math.sin(Math.PI*t)); }
          // (its limbs, crab-clawed, reaching out to hold the crown)
          for(let b = 0; b < 5; b++){ const p = trunk[8 + Math.floor(R()*4)], ang = Math.PI/2 + (b - 2)*0.42 + (R() - 0.5)*0.2, len = H*rnd(0.25, 0.4); scGrey(x, 0.9);
            scBrush(x, [p, [p[0] + Math.cos(ang)*len*0.5, p[1] - Math.sin(ang)*len*0.45], [p[0] + Math.cos(ang)*len, p[1] - Math.sin(ang)*len]], tw*0.35, t => 1 - 0.7*t); } });
        // (the rope round it, thick, twisted in diagonals, and its zigzag paper streamers)
        { const p = trunk[3], rw = tw*1.5;
          put(5, 'paper', x => { scGrey(x, 0.95); x.fillRect(p[0] - rw/2, p[1] - tw*0.13, rw, tw*0.26);
            for(let s = 0; s < 4; s++){ const sx = p[0] - rw*0.35 + s*rw*0.23, sy = p[1] + tw*0.13; x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + tw*0.08, sy + tw*0.12); x.lineTo(sx - tw*0.04, sy + tw*0.22); x.lineTo(sx + tw*0.06, sy + tw*0.34); x.lineTo(sx + tw*0.1, sy + tw*0.3); x.lineTo(sx + tw*0.02, sy + tw*0.22); x.lineTo(sx + tw*0.13, sy + tw*0.11); x.lineTo(sx + tw*0.05, sy); x.closePath(); x.fill(); } });
          put(5, 'ink', x => { scGrey(x, 0.6); for(let s = 0; s < 7; s++){ const sx = p[0] - rw/2 + s*rw/7; scBrush(x, [[sx, p[1] - tw*0.12], [sx + rw/9, p[1] + tw*0.12]], tw*0.03, () => 1); } }); }
        // (the crown: clouds of blossom, or masses of dark evergreen, around its limbs' ends)
        for(let c = 0; c < 9 + 8*amt; c++){ const a = Math.PI*(0.15 + 0.7*R()), r = H*rnd(0.15, 0.42), cx = sideX + Math.cos(a)*r*1.3, cy = Y - H*0.62 - Math.sin(a)*r*0.7 + H*0.08, rr = H*rnd(0.1, 0.18);
          if(cherry){ put(5, 'bloom', x => { scGrey(x, 0.9); scBlot(x, cx, cy, rr, rr*0.75, R, 0.3); }); put(5, 'paper', x => { scGrey(x, 0.35); scBlot(x, cx - rr*0.2, cy - rr*0.25, rr*0.5, rr*0.35, R, 0.3); }); put(5, 'ink', x => { scGrey(x, 0.35); for(let d = 0; d < 6; d++){ x.beginPath(); x.arc(cx + (R() - 0.5)*rr*1.6, cy + (R() - 0.5)*rr, H*0.004, 0, Math.PI*2); x.fill(); } }); }
          else { put(5, 'wash', x => { scGrey(x, 0.7); scBlot(x, cx, cy, rr, rr*0.6, R, 0.3); }); put(5, 'ink', x => { scGrey(x, 0.7); for(let d = 0; d < 7; d++){ const dx = cx + (R() - 0.5)*rr*1.6, dy = cy + (R() - 0.5)*rr*0.9; scBrush(x, [[dx - rr*0.15, dy], [dx + rr*0.15, dy - rr*0.03]], rr*0.08); } }); } }
        walker(5, sideX + (sideX < ww/2 ? 1 : -1)*tw*2.4, Y + U*0.004, U*0.028*zs, 0.9);
        // (a small shrine gate at its foot)
        { const X = sideX + (sideX < ww/2 ? 1 : -1)*tw*4, h = U*0.05*zs, w = h; put(5, 'accent', x => { scGrey(x, 0.9); x.fillRect(X - w*0.38, Y - h, w*0.09, h); x.fillRect(X + w*0.29, Y - h, w*0.09, h); x.fillRect(X - w*0.45, Y - h*0.78, w*0.9, h*0.07); });
          put(5, 'ink', x => { scGrey(x, 0.95); x.fillRect(X - w*0.55, Y - h*1.02, w*1.1, h*0.08); }); } }

      if(land === 7){ // THE CURSED LAND: a miasma rising from the ground (red at the land's foot, fading upward), black blots bled into it, dead trees
        const top = Math.min(...crest[2]);
        put(5, 'accent', x => { const g = x.createLinearGradient(0, top - U*0.12, 0, wh); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.4, `rgba(255,255,255,${0.12 + 0.15*amt})`); g.addColorStop(1, `rgba(255,255,255,${0.35 + 0.3*amt})`); x.fillStyle = g; x.fillRect(0, top - U*0.12, ww, wh);
          for(let w = 0; w < 6; w++){ const y = top + (wh - top)*R(); scGrey(x, 0.25); scBlot(x, ww*R(), y, ww*rnd(0.2, 0.45), U*rnd(0.02, 0.05), R, 0.2); } });
        put(5, 'ink', x => { for(let b = 0; b < 10 + 14*amt; b++){ const X = ww*R(), y = top + (wh - top)*Math.pow(R(), 0.7); scGrey(x, rnd(0.2, 0.55)); scBlot(x, X, y, U*rnd(0.02, 0.07), U*rnd(0.01, 0.03), R, 0.5); }
          const g = x.createLinearGradient(0, 0, 0, top); g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, ww, top); });
        for(let t = 0; t < 3 + 5*amt; t++){ const k = 3 + (R() < 0.6 ? 1 : 0), X = ww*R(); bare(k, X, crAt(k, X) + U*0.01, U*rnd(0.08, 0.2)*zs*(k === 4 ? 1.3 : 1), 0.95); }
        // (ash drifting)
        put(5, 'ink', x => { scGrey(x, 0.5); for(let f = 0; f < 120*amt; f++){ const X = ww*R(), Y = wh*R(), r = U*rnd(0.002, 0.005); x.beginPath(); x.ellipse(X, Y, r*1.6, r, R()*3, 0, Math.PI*2); x.fill(); } });
        // (and the petals, which the curse does not stop (Ruby: "add the petals to the cursed lands"): drifting down through
        //  the ash, and fallen on the dead ground, lying flat, blighted at their edges; in the Blossom Hue)
        { const pts = []; for(let f = 0; f < 40 + 70*amt; f++){ const fallen = R() < 0.45; pts.push([ww*R(), fallen ? top + (wh - top)*Math.pow(R(), 0.6) : wh*0.92*R(), U*rnd(0.004, 0.009), R()*Math.PI, fallen, R() < 0.4]); }
          const petal = (x, [X, Y, r, a, fallen], k = 1) => { x.beginPath(); x.ellipse(X, Y, r*1.4*k, r*(fallen ? 0.42 : 0.8)*k, fallen ? a*0.2 : a, 0, Math.PI*2); x.fill(); };
          put(5, 'bloom', x => { scGrey(x, 0.88); for(const p of pts) petal(x, p); });
          put(5, 'ink', x => { scGrey(x, 0.42); for(const p of pts) if(p[5]){ x.save(); x.beginPath(); x.ellipse(p[0], p[1], p[2]*1.4, p[2]*(p[4] ? 0.42 : 0.8), p[4] ? p[3]*0.2 : p[3], 0, Math.PI*2); x.clip(); petal(x, [p[0] + p[2]*0.5, p[1] - p[2]*0.2, p[2], p[3], p[4]], 0.8); x.restore(); } }); } }

      // ---- the maps: each band's things drawn, then hidden by the bands nearer than it, and laid together
      const out = MAPS.map(() => new Float32Array(N));
      for(let k = 0; k <= 5; k++){ const mine = ops.filter(o => o.k === k); if(!mine.length) continue; const o = k < 5 ? occl(k) : null;
        MAPS.forEach((m, j) => { const these = mine.filter(q => q.map === m); if(!these.length) return; const f = E.marks(null, 0, x => these.forEach(q => q.draw(x))), dst = out[j];
          for(let i = 0; i < N; i++){ const v = o ? f[i]*o[i] : f[i]; if(v > dst[i]) dst[i] = v; } }); }
      if(fields.snow){ const p = out[3]; for(let i = 0; i < N; i++) p[i] = Math.max(p[i], fields.snow[i]); }
      return out; } },
};
