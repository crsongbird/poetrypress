/**
 * turned.test.mjs — things turned from the camera are solids, not pictures squeezed thin (paintKit's pkTurned and the
 * solid props): a building side on is as deep as it is built, its sides the colour of its own face, what stands above
 * its roof still standing edge on, a granary's stilts open beneath it, a car half turned longer than end on and shorter
 * than side on. Drawn on a real canvas when one is here.
 *
 * Run: node test/turned.test.mjs
 */
import { check, done } from './harness.mjs';

let NC = null;
try { NC = await import('@napi-rs/canvas'); globalThis.Path2D = NC.Path2D; globalThis.document = { createElement: () => NC.createCanvas(1, 1) }; }
catch(e){ console.log('(no @napi-rs/canvas here: the drawing checks are skipped)'); }

if(NC){
  const K = await import('../paintKit.js'), { mulberry32 } = await import('../texCore.js');
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v)*t), base = [176, 178, 186];
  const look = view => ({ dark: mix(base, [0, 0, 0], 0.4), body: base, lit: mix(base, [255, 246, 226], 0.3), glow: [255, 196, 120], glow2: [150, 220, 255], sd: 1, L: [0.7, -0.7], haze: 0, air: [150, 178, 206], view });
  const turn = deg => deg === null ? null : { cs: Math.cos(deg*Math.PI/180), sn: Math.sin(deg*Math.PI/180) };
  const W = 240, H = 240, GY = 200, px = v => v*0.6;
  // a picture of one thing on a clear page, and what can be read off it: its ink's extent, a pixel's colour
  const shot = draw => { const cv = NC.createCanvas(W, H), x = cv.getContext('2d'); draw(x); const d = x.getImageData(0, 0, W, H).data;
    const ink = (i, j) => d[(j*W + i)*4 + 3] > 160, col = (i, j) => [...d.subarray((j*W + i)*4, (j*W + i)*4 + 3)];
    const span = j => { let a = W, b = -1; for(let i = 0; i < W; i++) if(ink(i, j)){ a = Math.min(a, i); b = i; } return b < 0 ? 0 : b - a + 1; };
    const top = () => { for(let j = 0; j < H; j++) for(let i = 0; i < W; i++) if(ink(i, j)) return j; return H; };
    return { ink, col, span, top }; };
  const bldg = (kind, deg, style = 'village') => shot(x => K.pkBuilding(x, W/2, GY, 90, 70, look(turn(deg)), style, 0, mulberry32(11), px, kind));

  // (Ruby: "definitely up to 16 points of rotation for buildings": a pagoda and a mosque turn with the eye, a corner on
  //  wider than face on, as a square in plan is; and a building on a slope stands on its plinth, nothing under it open)
  for(const kind of ['pagoda', 'mosque']){ const on = bldg(kind, 0, 'magic'), corner = bldg(kind, 45, 'magic'), j = GY - 12;
    check(`a ${kind} seen on its corner is wider than seen face on (it turns, as a square in plan does)`, corner.span(j) > on.span(j)*1.15); }
  { const plinth = shot(x => K.pkBuilding(x, W/2, GY - 30, 90, 70, { ...look(turn(30)), plinth: 30 }, 'village', 0, mulberry32(11), px, 'cottage'));
    check('a building on a slope stands on a plinth reaching down to the ground beneath it', plinth.ink(W/2, GY - 4) && plinth.ink(W/2 - 15, GY - 10)); }
  { const still = bldg('brick', null), side = bldg('brick', 90), half = bldg('brick', 45), j = GY - 30;
    check('a block turned side on shows its depth, not a sliver (at least half its front\'s width)', side.span(j) > still.span(j)*0.5);
    check('half turned, it shows front and side: wider than side on', half.span(j) > side.span(j)); }
  { const front = bldg('cottage', 0), side = bldg('cottage', 90), dist = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
    const wallFront = front.col(W/2 - 18, GY - 8), wallSide = side.col(W/2, GY - 12);
    check('its side is painted the stuff of its face (the side wall near the front wall\'s colour)', front.ink(W/2 - 18, GY - 8) && side.ink(W/2, GY - 12) && dist(wallFront, wallSide) < 90); }
  { const still = bldg('chapel', null), side = bldg('chapel', 90);
    check('a chapel side on is its long nave (wider than its front), its belfry still standing over the roof edge on',
      side.span(GY - 10) > still.span(GY - 10)*1.2 && side.top() < GY - (GY - still.top())*0.85); }
  { const side = bldg('horreo', 90, 'galicia'), j = GY - 6;
    let gap = false; for(let i = W/2 - 10; i <= W/2 + 10; i++) if(!side.ink(i, j)) gap = true;
    check('a granary turned is still up on its pillars (open beneath its body)', gap && side.span(GY - 40) > 0); }
  { const car = deg => shot(x => K.pkProp(x, W/2, GY, 24, look(turn(deg)), 'parked', mulberry32(5), px, 0)), j = GY - 10;
    const end = car(0).span(j), half = car(45).span(j), side = car(90).span(j);
    check('a car half turned is longer than end on, near as long as side on (its length and its width both seen), not shrunk', end < half && half <= side + 4 && half > side*0.92 && side > end*1.8); }
  { const vm = deg => shot(x => K.pkProp(x, W/2, GY, 60, look(turn(deg)), 'vending', mulberry32(3), px, 0)), j = GY - 30;
    check('a pair of vending machines side on is a box as deep as they are, not a line', vm(90).span(j) > 8 && vm(90).span(j) < vm(0).span(j));
    check('half turned, their tops show (seen from a little above), rising behind the front\'s top edge', vm(45).top() < vm(null).top() - 1); }
}

done();
