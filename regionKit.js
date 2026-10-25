/**
 * regionKit.js — THE REGIONS of a ring's floor, as pure functions of the seed and the place (Ruby, 2026-10-25:
 * "towns with walls; eras side by side … with clear borders; factions holding regions; names from the seeds and the
 * app's own esoteric language; crystals of a color for each magical element ruling a region"; and "regions of earth,
 * fire, water and air coloring the ground, trees and lights"; docs/prior-art/ringworld-regions.md).
 *
 *   rkRegions(seed, o)  the floor parted into regions some five kilometres along and two across, each the land nearest
 *                       one point of a jittered grid (a Voronoi cell, as map makers part a world), its borders
 *                       wandering a little as real borders do, round the ring so the arch overhead is parted as the
 *                       land at your feet is. o.W is the band's width (ring units), o.worlds the worlds a Mixed ring
 *                       shares out (one per region). Returns { at(a, z), info(id) }: at gives the region there (its
 *                       id; id2, the region over its nearest border; and b, how far inside that border the point
 *                       lies, in ring units: the same object every call, so read it at once); info gives a region's
 *                       name, world, element and faction
 *   RK_ELEMENTS         the magic world's elements, Runology's eight Primal Archetypes (runology.js): the four of old
 *                       most often, the other four rarely; each its two lights, its ground, its leaves
 *   RK_TINCTURES        heraldry's two metals and five colours, for the factions' banners (a metal on a colour, or a
 *                       colour on a metal, as the rule of tincture has it)
 *   RK_DIVISIONS        how a banner's field is parted, the ones that read from afar
 */
import { NAME, ADJ, NOUN } from './seedWords.js';
import { lkNoise } from './landKit.js';

// (a hash to [0, 1), and a little stream, each of its own salt)
const rkU = (x, y, s) => { let h = Math.imul(x | 0, 0x27D4EB2D) ^ Math.imul(y | 0, 0x165667B1) ^ Math.imul(s | 0, 0x9E3779B1); h = Math.imul(h ^ (h >>> 15), 0x85EBCA77); h = Math.imul(h ^ (h >>> 13), 0xC2B2AE3D); return ((h ^ (h >>> 16)) >>> 0)/4294967296; };
const rkRand = (s, a, b) => { let t = (Math.imul(s | 0, 0x9E3779B1) ^ Math.imul(a | 0, 0x85EBCA77) ^ Math.imul(b | 0, 0xC2B2AE3D)) >>> 0;
  return () => { t = (t + 0x6D2B79F5) >>> 0; let r = Math.imul(t ^ (t >>> 15), 1 | t); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0)/4294967296; }; };
const rkPick = (R, L) => L[Math.floor(R()*L.length)];
const rkCap = w => w.charAt(0).toUpperCase() + w.slice(1);
const rkPlural = w => /[^aeiou]y$/.test(w) ? w.slice(0, -1) + 'ies' : /(s|x|z|ch|sh|o)$/.test(w) ? w + 'es' : w + 's', rkOwn = N => N + (N.endsWith('s') ? '’' : '’s');

export const RK_ELEMENTS = [
  { name: 'Fire',   wt: 1,    lights: [[255, 96, 54], [255, 186, 80]],   ground: [150, 84, 62],   leaf: [150, 72, 42] },
  { name: 'Wind',   wt: 1,    lights: [[120, 255, 176], [214, 255, 236]], ground: [156, 190, 146], leaf: [116, 172, 112] },
  { name: 'Water',  wt: 1,    lights: [[70, 166, 255], [150, 236, 255]],  ground: [82, 130, 146],  leaf: [38, 100, 112] },
  { name: 'Earth',  wt: 1,    lights: [[255, 222, 96], [214, 168, 80]],   ground: [172, 142, 84],  leaf: [112, 112, 42] },
  { name: 'Amber',  wt: 0.25, lights: [[255, 168, 40], [255, 224, 150]],  ground: [176, 128, 64],  leaf: [170, 112, 32] },
  { name: 'Vitrum', wt: 0.25, lights: [[182, 112, 255], [232, 196, 255]], ground: [130, 104, 172], leaf: [92, 72, 132] },
  { name: 'Sound',  wt: 0.25, lights: [[255, 122, 204], [255, 206, 232]], ground: [182, 124, 152], leaf: [160, 82, 122] },
  { name: 'Radio',  wt: 0.25, lights: [[214, 140, 82], [255, 210, 160]],  ground: [132, 102, 80],  leaf: [112, 82, 52] },
];
// (or and argent; gules, azure, vert, purpure and sable)
export const RK_TINCTURES = { metals: [[226, 184, 62], [236, 234, 226]], colours: [[176, 32, 40], [28, 72, 160], [26, 116, 58], [112, 44, 124], [30, 28, 32]] };
export const RK_DIVISIONS = ['plain', 'pale', 'fess', 'bend', 'chevron', 'cross', 'saltire', 'quarterly'];

// THE NAMES, from the seed banks (seedWords.js: the planets, moons, stars, old gods and Runology's Archetypes; its
// adjectives and nouns) and the old words for a country's lie: a march is a border land, a weald a wood, a fell a hill
const RK_PLACES = {
  wilds:    ['March', 'Marches', 'Reach', 'Weald', 'Fells', 'Downs', 'Vale', 'Moor', 'Wold', 'Fen', 'Heath', 'Holt', 'Dale', 'Shire'],
  magic:    ['Marches', 'Reach', 'Glades', 'Demesne', 'Realm', 'Vale', 'Weald', 'Hollows', 'Mere', 'Wood'],
  ruins:    ['Wastes', 'Barrens', 'Ashlands', 'Scar', 'Hollows', 'Reach', 'Breaks', 'Flats'],
  cities:   ['District', 'Borough', 'Ward', 'Quarter', 'County', 'Heights', 'Park'],
  neon:     ['Sector', 'Zone', 'Strip', 'Block', 'Grid', 'Sprawl', 'Loop'],
  builders: ['Array', 'Works', 'Precinct', 'Terraces', 'Reach', 'Span'] };
function rkName(R, world){ const P = RK_PLACES[world] || RK_PLACES.wilds, u = R(), N = rkPick(R, NAME), A = rkCap(rkPick(R, ADJ)), O = rkCap(rkPick(R, NOUN)), pl = rkPick(R, P);
  if(world === 'ruins' && u < 0.25) return 'Old ' + N + ' ' + pl;
  if(world === 'neon' && u < 0.3) return pl + ' ' + (1 + Math.floor(R()*99));
  return u < 0.3 ? N + ' ' + pl : u < 0.5 ? 'The ' + A + ' ' + pl : u < 0.68 ? pl + ' of ' + N : u < 0.84 ? 'The ' + O + ' ' + pl : rkOwn(N) + ' ' + pl; }
// (a town's: a name and the old endings, -ford, -bury, -wick …; a city's New, Port or City)
const RK_ENDS = ['ford', 'bury', 'wick', 'by', 'ham', 'stead', 'mouth', 'bridge', 'dale', 'hold', 'ton', 'mere', 'thorpe', 'well'];
export function rkTownName(R, world){ const N = rkPick(R, NAME), u = R();
  if(world === 'cities' || world === 'neon' || world === 'builders') return u < 0.3 ? 'New ' + N : u < 0.5 ? 'Port ' + N : u < 0.7 ? N + ' City' : N;
  const stem = N.length > 6 ? N.slice(0, 4 + Math.floor(R()*2)) : N; return stem + rkPick(R, RK_ENDS); }
// (a faction's: a house, an order, a compact or a band, by the world that raised it)
function rkFactionName(R, world){ const N = rkPick(R, NAME), A = rkCap(rkPick(R, ADJ)), O = rkCap(rkPick(R, NOUN)), u = R();
  if(world === 'magic') return u < 0.4 ? 'The Runists of ' + N : u < 0.7 ? 'The Order of the ' + A + ' ' + O : 'The ' + O + ' Circle';
  if(world === 'ruins') return u < 0.5 ? 'The ' + A + ' ' + rkPlural(O) : 'The ' + N + ' Band';
  if(world === 'cities' || world === 'neon' || world === 'builders') return u < 0.4 ? 'The ' + N + ' Compact' : u < 0.7 ? N + ' ' + O + ' Holdings' : 'The ' + A + ' League';
  return u < 0.5 ? 'House ' + N : u < 0.75 ? 'The ' + N + ' Clans' : 'The ' + A + ' ' + rkPlural(O); }

export function rkRegions(seed, o){
  const s = seed | 0, W = o.W, worlds = o.worlds && o.worlds.length ? o.worlds : ['wilds'];
  const NA = Math.max(3, Math.round(2*Math.PI/(W*1.3))), DA = 2*Math.PI/NA, DZ = W/2.3, NF = Math.max(2, Math.round(NA/3)), FA = 2*Math.PI/NF, FZ = W*1.1;
  const wrap = (i, n) => ((i % n) + n) % n;
  const out = { id: 0, id2: 0, b: 0 };
  const at = (a, z) => {
    // (the borders wander: the place warped a little before its nearest point is found, by noise round the ring)
    const u = a/DA, v = z/DZ, wa = a + DA*(0.22*lkNoise(u*2, v*1.3, s + 821, NA*2) + 0.06*lkNoise(u*9, v*6, s + 822, NA*9)), wz = z + DZ*(0.22*lkNoise(u*2 + 7.3, v*1.3, s + 823, NA*2) + 0.06*lkNoise(u*9 + 3.1, v*6, s + 824, NA*9));
    const i0 = Math.floor(wa/DA), j0 = Math.floor(wz/DZ); let d1 = Infinity, d2 = Infinity, a1 = 0, z1 = 0, a2 = 0, z2 = 0, id1 = 0, id2 = 0;
    for(let di = -1; di <= 1; di++) for(let dj = -1; dj <= 1; dj++){ const i = i0 + di, j = j0 + dj, ii = wrap(i, NA), pa = (i + 0.12 + 0.76*rkU(ii, j, s + 811))*DA, pz = (j + 0.12 + 0.76*rkU(ii, j, s + 812))*DZ, d = (pa - wa)*(pa - wa) + (pz - wz)*(pz - wz);
      if(d < d1){ d2 = d1; a2 = a1; z2 = z1; id2 = id1; d1 = d; a1 = pa; z1 = pz; id1 = ii*64 + j + 32; } else if(d < d2){ d2 = d; a2 = pa; z2 = pz; id2 = ii*64 + j + 32; } }
    out.id = id1; out.id2 = id2; out.b = (d2 - d1)/(2*(Math.hypot(a2 - a1, z2 - z1) || 1)); return out; };
  // (a faction holds the regions whose points lie nearest its own, on a grid three regions long: neighbours together)
  const factions = new Map(), faction = fid => { let f = factions.get(fid); if(f) return f; const R = rkRand(s, 840, fid), wo = worlds[Math.floor(R()*worlds.length)];
    const metal = rkPick(R, RK_TINCTURES.metals), colour = rkPick(R, RK_TINCTURES.colours), onMetal = R() < 0.4;
    f = { id: fid, name: rkFactionName(R, wo), field: onMetal ? metal : colour, charge: onMetal ? colour : metal, div: RK_DIVISIONS[Math.floor(R()*RK_DIVISIONS.length)], rune: R(), tails: R() < 0.35 };
    factions.set(fid, f); return f; };
  const kept = new Map(), info = id => { let r = kept.get(id); if(r) return r; const i = Math.floor(id/64), j = id % 64 - 32, R = rkRand(s, 830, id);
    const pa = (i + 0.12 + 0.76*rkU(i, j, s + 811))*DA, pz = (j + 0.12 + 0.76*rkU(i, j, s + 812))*DZ, fi0 = Math.floor(pa/FA), fj0 = Math.floor(pz/FZ); let fd = Infinity, fid = 0;
    for(let di = -1; di <= 1; di++) for(let dj = -1; dj <= 1; dj++){ const fi = fi0 + di, fj = fj0 + dj, ff = wrap(fi, NF), qa = (fi + 0.2 + 0.6*rkU(ff, fj, s + 841))*FA, qz = (fj + 0.2 + 0.6*rkU(ff, fj, s + 842))*FZ, d = (qa - pa)*(qa - pa) + (qz - pz)*(qz - pz);
      if(d < fd){ fd = d; fid = ff*16 + fj + 8; } }
    const world = worlds.length < 2 ? worlds[0] : worlds[Math.floor(R()*worlds.length)];
    let element = null; if(world === 'magic'){ let tot = 0; for(const e of RK_ELEMENTS) tot += e.wt; let q = R()*tot; for(const e of RK_ELEMENTS){ q -= e.wt; if(q < 0){ element = e; break; } } element = element || RK_ELEMENTS[0]; }
    r = { id, name: rkName(R, world), world, element, faction: faction(fid) }; if(kept.size > 4000) kept.clear(); kept.set(id, r); return r; };
  return { at, info };
}
