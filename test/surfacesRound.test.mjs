/**
 * surfacesRound.test.mjs — the surfaces Ruby asked after (pass 3): Cartomancy
 * as a game in progress made of parts the Athanor shares; Scattered Polygons'
 * convex shapes; Stained Glass's four kinds of window and its glass; Painted
 * Landscape in colour; Sleep Haze faster.
 */
import { readFileSync } from 'fs';
import { installCanvasMock } from './canvasMock.mjs';
installCanvasMock();
let failures = 0;
const check = (name, ok) => { console.log((ok ? 'ok: ' : 'FAIL: ') + name); if(!ok) failures++; };
const src = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const C = await import('../cartomancy.js'), S = await import('../steps.js'), A = await import('../athanor.js'), T = await import('../textureGenerators.js');

check('Cartomancy deals a game by the seed (eleven, none quite one you know) — players, suits and stakes its own',
  Object.keys(C.CARD_GAMES).join(',') === 'reading,trick,patience,wager,pairs,crossroads,duel,ring,stair,market,abandoned' && /const all = \[0, 1, 2, 3\]\.sort\(\(\) => Math\.random\(\) - 0\.5\), suits = all\.slice\(0, 2 \+ Math\.floor\(Math\.random\(\)\*3\)\)/.test(src('cartomancy.js'))
  && /const money = Math\.random\(\) < opts\.stakes;/.test(src('cartomancy.js')));
{ const TT = await import('../cartomancyTable.js');
  check('what else is on the table (cartomancyTable.js): sixteen kinds, the clutter kept toward the edges and off the cards; damage cuts a card\'s corner; games not played for money use counters',
    Object.keys(TT.TABLE_OBJECTS).length >= 16 && ['candle', 'cup', 'ball', 'watch', 'letter', 'feather', 'score', 'iou'].every(k => TT.TABLE_OBJECTS[k])
    && /Math\.min\(0\.82, Math\.hypot\(\(x - w\/2\)\/\(w\/2\)/.test(src('cartomancyTable.js'))
    && TT.crtCut({ kind: 'tear', corner: 2, size: 0.2, b: 0.5 }).corner === 2 && TT.crtCut({ kind: 'ring' }) === null
    && /else tokens\(mx, my, 3 \+ Math\.floor\(R\(\)\*8\), cw\*0\.5\);/.test(src('cartomancy.js'))
    && (() => { const items = [], all = TT.crtTableObjects(items, 1000, 1000, 110, 1); return all.every(o => o.kind === 'object' && o.x >= 0 && o.x <= 1000); })()); }
check('…on a table of its own material (felt, velvet, wood, marble, slate, linen) under a lamp, its cards of a chosen stock and edge, its coin an invented coinage',
  Object.keys(C.TABLE_MATERIALS).length >= 8 && Object.keys(C.CARD_STOCKS).length >= 4 && C.COINAGES.length >= 6 && C.COINAGES.every(c => c.name && c.mark && C.COIN_METALS[c.metal]));
check('…its four suits coloured by the page\'s accents and the texture\'s two hues; cards and coins cast shadows away from the dial',
  T.TEXTURE_CAPS.cards.ground === 'colour' && T.TEXTURE_CAPS.cards.tintLabels.join('|') === 'Third Suit Hue|Fourth Suit Hue' && /type === 'snow' \|\| type === 'cards'\)/.test(src('canvasRenderer.js'))
  && /export function crtShadow\(ctx, shape, dx, dy, blur, alpha/.test(src('cartomancy.js')));
{
  const items = C.crtDeal('wager', 1000, 1000, { cw: 100, count: 1, scatter: 0, stakes: 1, suits: [0, 1], coinage: C.COINAGES[0] });
  check('Ruby\'s Cartomancy notes: shadows swept from the caster (never loose), coins toned and turned on a lathe with beads and a glint, every card its own paper, grain, wear and sheen, thin edges',
    /shape\(ctx, steps \? dx\*k\/steps : dx/.test(src('cartomancy.js')) && /the lathe's rings/.test(src('cartomancy.js')) && /function crtCardFinish/.test(src('cartomancy.js'))
    && /W\*\(gilt \? 0\.011 : 0\.005\)/.test(src('cartomancy.js')) && /const len = 0\.3 \+ 1\.5\*T/.test(src('cartomancy.js')));
  check('a deal is a list of what lies where, by the rules (a wager: hands, five shared cards, a pot and every player\'s stack)',
    items.filter(i => i.kind === 'card').length >= 11 && items.some(i => i.kind === 'stack') && items.some(i => i.kind === 'coin'));
}
check('its parts are steps the Athanor offers — Table, Deal (a table, four suit ports), Coins — each handing on a picture (and a mask to lay it by), Table and Deal able to PAINT at full size',
  S.STEPS.table && S.STEPS.deal && S.STEPS.coins && S.STEPS.deal.inTypes.slice(0, 5).join(',') === 'image,colour,colour,colour,colour' && S.STEPS.deal.outTypes.join(',') === 'image,field' && S.STEPS.coins.outTypes[1] === 'field'
  && typeof S.STEPS.table.paint === 'function' && typeof S.STEPS.deal.paint === 'function' && S.STEPS.accent && S.STEPS.accent.outTypes[0] === 'colour');
{
  const CH = await import('../chains.js'), g = A.athanorStarter('cards'), d = g.drawflow.Home.data, tg = src('textureGenerators.js');
  check('CARTOMANCY IS A CHAIN (no duplicate starter): Knobs, two Accents and two Hues wired into a Table and a Deal laid on it — what the seed picks left at "seed"; the texture made from it by a canvas pass',
    !A.ATHANOR_STARTERS.cardtable && CH.TEXTURE_CHAINS.cards && CH.TEXTURE_CHAINS.cards.canvas && d[9].name === 'deal' && d[9].data.game === 'seed' && d[9].inputs.input_1.connections[0].node === '8'
    && ['2', '3', '4', '5'].every(j => d[9].inputs['input_' + j].connections.length === 1) && d[9].inputs['input_' + S.paramPort('deal', 'scatter')].connections[0].node === '2'
    && /result = genChain\(type, w, h, light, extra, tint1, tint2\);\n  \} else if\(type === 'summoning'\)/.test(tg) && /if\(ctx\.canvas\)\{ if\(step\.paint\) return step\.paint\(E, n\);/.test(src('athanor.js')));
}
{
  const sh = src('stepsTouch.js');
  check('Scattered Polygons: its Shape knob makes convex polygons of every kind — 3 to 10 sides, even or uneven, drawn out long at the top — never concave',
    /const n = Math\.min\(stretch > 1\.8 \? 6 : 10, 3 \+ Math\.floor/.test(sh) && /ang\.sort\(\(p, q\) => p - q\);/.test(sh) && !/a curled shaving/.test(sh));
}
{
  const tt = src('stepsTouch.js');
  check('Stained Glass: SHAPE runs random → patterned → shaped (a rose) → ordered; the glass flashes where a pane faces the light, rolls a sheen, rims bright on the lit side',
    /const kind = order < 0\.3 \? 'random' : order < 0\.55 \? 'pattern' : order < 0\.8 \? 'rose' : 'grid';/.test(tt) && /const flash = Math\.pow\(nh, 60\)/.test(tt) && /rim = face\*/.test(tt)
    && T.paramsFor('stainedglass')[2].label === 'Shape');
}
check('Painted Landscape: Color paints it (grey and tinted at 0, as before) — its own colours skip the grey tint pass',
  T.paramsFor('landscape')[4].label === 'Color' && /const ownColour = \(type === 'bokeh' \|\| type === 'landscape'\) && hueSpread > 0;/.test(src('textureGenerators.js')));
{
  const CH = await import('../chains.js');
  check('THE FOUR AS ATHANOR TEXTURES (Ruby: "reimagine them as textures built in The Athanor"): Sleep Haze (smoke → light shaft → dust motes), Scattered Polygons (flakes), Stained Glass (panes → glass), Painted Landscape (painted sky → painted ridges → watercolour wash) — each a chain the texture is made from, its parts in the library, each with what it teaches',
    ['clouds', 'metalleaf', 'stainedglass', 'landscape'].every(k => CH.TEXTURE_CHAINS[k] && (CH.TEXTURE_CHAINS[k].teach || '').length > 80)
    && ['smoke', 'shaft', 'motes', 'flakes', 'panes', 'glass', 'sky', 'ridges', 'wash'].every(k => S.STEPS[k])
    && ['clouds', 'metalleaf', 'stainedglass', 'landscape'].every(k => new RegExp(`type === '${k}'\\)\\{\\n    result = genChain\\(type`).test(src('textureGenerators.js')))
    && !/export function gen(Clouds|Landscape|MetalLeaf|StainedGlass)\(/.test(src('texWhimsy.js') + src('texSharpness.js') + src('texTouch.js')));
  check('…the parts mix: the Light Shaft lights any density, the Ridges paint over any sky, the Wash bleeds any picture, Glass lights any tiling; the sky and the ridges agree (the SEED chooses the country, the time and the sun: seedChoice)',
    S.STEPS.shaft.inTypes[0] === 'field' && S.STEPS.ridges.inTypes[0] === 'image' && S.STEPS.wash.inTypes[0] === 'image' && S.STEPS.glass.inTypes.slice(0, 4).every(t => t === 'field')
    && /const R = seedChoice\(seed, 'landscape'\)/.test(src('stepsWhimsy.js')));
}
check('Sleep Haze: the curl worked out once on its grid, a coarser grid, longer steps, a cheaper normal draw (about twice as fast)',
  /const \[gw, gh\] = whimGrid\(E, 6\)/.test(src('stepsWhimsy.js')) && /const \[AX, AY\] = curlField\(PA\)/.test(src('stepsWhimsy.js')));

console.log();
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
