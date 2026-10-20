/**
 * audit.test.mjs — every value the app saves must come back when loaded.
 *
 * Driven by the saved JSON itself rather than a list kept here: take what the
 * serializer produces, change EVERY key to a different valid value, load it,
 * save again, and require each changed value to survive. A key added to the
 * serializer later is covered automatically — and if this file does not know
 * how to change it, the test fails and says so, rather than skipping it.
 *
 * Covers the three ways settings move: the Workbench JSON (save/load), saved
 * spells (create/apply), and spell export/import; and old looks open as they
 * were, each format's translations (retireLook) among them.
 *
 * Run: node test/audit.test.mjs
 */
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';
import { check, done } from './harness.mjs';

installCanvasMock();
const reg = installDomMock(makeMockContext, makeMockCanvas);
await import('../appEvents.js');
const { ASPECTS, PRESETS, FONTS } = await import('../appOptions.js');
const { paramsFor, capsFor } = await import('../textureGenerators.js');


const save = () => { reg['advancedRefreshBtn'].dispatchEvent({ type: 'click' }); return JSON.parse(reg['advancedJson'].value); };
const load = obj => { reg['advancedJson'].value = JSON.stringify(obj); reg['advancedLoadBtn'].dispatchEvent({ type: 'click' }); };

// comparison that ignores representation, not meaning
const norm = v => {
  if(v === undefined || v === null) return v;
  if(Array.isArray(v)) return JSON.stringify([...v].sort());
  if(typeof v === 'object') return JSON.stringify(Object.keys(v).sort().map(k => [k, norm(v[k])]));
  if(typeof v === 'boolean') return v;
  if(typeof v === 'number') return String(+v.toFixed(4));
  if(typeof v === 'string' && /^#[0-9a-f]{3,8}$/i.test(v)) return v.toLowerCase();
  if(typeof v === 'string' && v.trim() !== '' && !isNaN(+v)) return String(+(+v).toFixed(4));
  return v;
};

// ---- how to change each key to a different VALID value ----
const NEW_TEXTURE = 'wax';                          // has tints, light and params
const waxParams = paramsFor(NEW_TEXTURE);
const ENUM = {
  font: v => v === 'Cinzel' ? 'EB Garamond' : 'Cinzel',
  outlineMode: v => v === 'shadow' ? 'outline' : 'shadow',
  textureType: () => NEW_TEXTURE,
  textureBlend: () => capsFor(NEW_TEXTURE).blends[1],     // valid for the new texture, not its default
  typeEffect: v => v === 'bevel' ? 'bloom' : 'bevel',
  vignetteBlend: v => v === 'color-burn' ? 'lighten' : 'color-burn',
  textGradientType: v => v === 'mirror' ? 'radial' : 'mirror',
  usernameCorner: v => v === 'top-right' ? 'top-left' : 'top-right',
  align: v => v === 'right' ? 'center' : 'right',
  valign: v => v === 'bottom' ? 'top' : 'bottom',
  aspect: v => v === '2:3' ? '16:9' : '2:3',
  spell: v => PRESETS.map(p => p.spell).find(s => s && s !== v),
  locks: () => ['bgColor1Hex', 'textureType'],
  textureLight: () => '135',
  texP1: () => String(waxParams[0].def + 13),
  texP2: () => String(waxParams[1].def - 11),
  texP3: v => String((+v || 50) === 63 ? 37 : 63),
  textureSeed: v => (+v || 0) + 7,
  lineSpacing: v => +((+v || 0) + 0.15).toFixed(2),
  textMargin: v => (+v || 100) === 60 ? 75 : 60,
  textureOpacity: v => Math.min(99, (+v || 0) + 3),
  textureClearing: v => (+v || 0) === 40 ? '55' : '40',
  poemText: () => '## Audit\nline one~A\n<two/effect:halo,40>',
  username: () => '@audit',
  lookName: v => v === 'Audit Look' ? 'Other Look' : 'Audit Look',
  bgGradientType: v => v === 'radial' ? 'rect' : 'radial',
  cardGradientType: v => v === 'rect' ? 'radial' : 'rect',
  cardBlend: v => v === 'multiply' ? 'screen' : 'multiply',
  borderBlend: v => v === 'screen' ? 'overlay' : 'screen',
  borderBloomBlend: v => v === 'color-dodge' ? 'soft-light' : 'color-dodge',
  borderStitch: v => v === 'vine' ? 'hearts' : 'vine',
  cardStitch: v => v === 'beads' ? 'stars' : 'beads',
  cardFx: v => v === 'frost' ? 'lens' : 'frost',
  // the lower surface, whole (its keys are the upper's), and its locks
  baseLayer: v => ({ ...v, textureType: 'linen', texP1: '83', texP2: '77', textureOpacity: 61, textureBlend: 'difference', textureTint1: '#123456', textureSeed: 4321 }),
  baseLocks: () => ['texP2', 'textureBlend'],
  forgeGraph: v => v === '{"drawflow":{"Home":{"data":{}}},"audit":1}' ? '{"drawflow":{"Home":{"data":{}}},"audit":2}' : '{"drawflow":{"Home":{"data":{}}},"audit":1}',
  // a Curve Control's curve as drawn on the page (points 0–100)
  textureCurve1: v => v === '0,10;50,80;100,30' ? '0,0;100,100' : '0,10;50,80;100,30',
  textureCurve2: v => v === '0,90;100,20' ? '0,0;100,100' : '0,90;100,20',
  fx1Type: v => v === 'glow' ? 'outline' : 'glow', fx2Type: v => v === 'bevel' ? 'chromatic' : 'bevel', fx3Type: v => v === 'erosion' ? 'shadow' : 'erosion',
  underAll: v => v === 'wave' ? 'double' : 'wave',
};
const SLIDERS = { borderBloom:'42', vignetteAperture:'41', vignetteCx:'12', vignetteCy:'88',
  vignetteNoise:'9', typeEffectStrength:'67', typeEffectAngle:'212', typeEffectDistance:'140',
  typeEffectGrain:'33', bgRadialX:'23', bgRadialY:'71', bgRadialR:'111', borderGrain:'37',
  borderRadius:'144', cardRadius:'153', cardFxAmount:'37', cardFxScale:'71', cardGradientAngle:'217', cardOpacity:'58', borderGradientAngle:'123',
  textureLightTilt:'63', texP4:'43', texP5:'77', texP6:'31', texP7:'19', texP8:'71', texP9:'13', texP10:'66', cameraTurn:'123', cameraView:'37', cameraZoom:'180', textureRim:'77', textureRimTilt:'58', textureAmbient:'143', fx1K1:'23', fx1K2:'61', fx1Angle:'137', fx2K1:'17', fx2K2:'44', fx2Angle:'211', fx3K1:'29', fx3K2:'53', fx3Angle:'301' };
let hexN = 0;
const freshHex = () => '#' + (0x1a2b3c + (++hexN) * 0x050709).toString(16).slice(-6);

function mutate(key, v){
  if(key in ENUM) return ENUM[key](v);
  if(key in SLIDERS) return SLIDERS[key];
  if(typeof v === 'boolean') return !v;
  if(typeof v === 'number') return v + 1;
  if(typeof v === 'string' && (/^#[0-9a-f]{3,8}$/i.test(v) || /color|hex|tint|^bg\d|^text\d|accent/i.test(key))) return freshHex();
  return undefined;                                   // unknown: reported below
}

// Keys derived from others, and so legitimately not independent:
//   customW/customH are mirrored from the chosen aspect while Custom is off
//   customSize is exercised below, with the page's shape (it overrides aspect)
const DERIVED = new Set(['customW', 'customH', 'customSize', 'aspect', 'textureSeedWords', 'lookVersion']);   // (aspect: a loaded look never changes the page's shape — Ruby; see "the page's shape")   // (lookVersion: the format a look was saved in, written fresh each save)   // (the seed's words follow the seed: see "the typed seed")

// ---------- every key: changed, loaded, saved again ----------
// (with Two Surfaces on, so the lower surface is saved too)
reg['baseToggle'].checked = true; reg['baseToggle'].dispatchEvent({ type: 'change' });
const base = save();
const changed = {};
const unknown = [];
for(const [k, v] of Object.entries(base)){
  if(DERIVED.has(k)){ changed[k] = v; continue; }
  const m = mutate(k, v);
  if(m === undefined){ unknown.push(k); changed[k] = v; continue; }
  changed[k] = m;
}
changed.customSize = false;
check('every saved key has a known way to be changed', unknown.length === 0);
if(unknown.length) console.log('   teach the audit how to change:', unknown.join(', '));

load(changed);
const back = save();
const lost = Object.keys(changed).filter(k => !DERIVED.has(k) && norm(changed[k]) !== norm(back[k]));
check(`all ${Object.keys(changed).length - DERIVED.size} independent keys survive a load`, lost.length === 0);
for(const k of lost) console.log(`   ${k}: set ${JSON.stringify(changed[k])} -> came back ${JSON.stringify(back[k])}`);

// the typeface by its family's name, never its place in the list (a place points at another face when FONTS grows)
check('the typeface is saved by its name, not its place in the list', typeof back.font === 'string' && FONTS.some(f => f.family === back.font) && back.font === changed.font);
// nothing may appear on the way back that was never saved
const invented = Object.keys(back).filter(k => !(k in base));
check('loading does not invent keys that saving never produced', invented.length === 0);

// ---------- the page's shape is the person's (Ruby): a loaded look never changes it ----------
{ const before = save();
  load({ ...back, customSize: true, customW: '1234', customH: '2345' });
  const a = save();
  load({ ...back, customSize: false, aspect: before.aspect === '4:3' ? '1:1' : '4:3' });
  const b = save();
  check('loading a look never changes the aspect ratio or a custom size, even when the look saved one',
    a.aspect === before.aspect && b.aspect === before.aspect && norm(a.customW) === norm(before.customW) && norm(b.customH) === norm(before.customH));
  check('the shape is still saved with a look (so an old reader can see it), only not applied on loading', typeof before.aspect === 'string' && 'customW' in before); }

// ---------- the typed seed: what was typed is kept while it is still that seed's ----------
{ const { seedFromText, seedPhrase } = await import('../seedWords.js');
  const typed = (seed, words) => { load({ ...back, textureSeed: seed, textureSeedWords: words }); return [reg['textureSeedWords'].value, save().textureSeedWords]; };
  const [shown, saved] = typed(seedFromText('my cat Lily'), 'my cat Lily'), [num] = typed(12345, '12345'), [stale] = typed(7, 'my cat Lily');
  check('what was typed is kept: saved with the look, and restored when it is still that seed\'s (a typed number stays a number)',
    shown === 'my cat Lily' && saved === 'my cat Lily' && num === '12345' && stale === seedPhrase(7));
  load(back); }

// ---------- four-stop gradients ----------
load({ ...back, bgGradient: true, bg3: '#303132', bg4: '#404142',
       textGradient: true, text3: '#505152', text4: '#606162' });
const stops = save();
check('background gradient stops 3 and 4 survive',
  norm(stops.bg3) === '#303132' && norm(stops.bg4) === '#404142');
check('text gradient stops 3 and 4 survive',
  norm(stops.text3) === '#505152' && norm(stops.text4) === '#606162');

// ---------- a saved spell carries the look, and only the look ----------
// (a saved spell's tile in the Rituals grid applies it through the same filter: swatches.test.mjs, by behavior)
// behaviour: a spell carrying someone else's identity and UI state
const { stripToLook, NOT_PART_OF_A_LOOK } = await import('../vault.js');
const foreign = { ...back, username: '@theirs', highlight: false, spellMark: false,
                  locks: ['textureType'], poemText: 'their poem', bg1: '#0d0e0f' };
const look = stripToLook(foreign);
for(const k of ['poemText', 'locks', 'highlight', 'username'])
  check(`a spell never carries "${k}"`, NOT_PART_OF_A_LOOK.includes(k) && !(k in look));
check('everything that IS the look is kept: only the poem, locks, highlighting and credit stay behind',
  NOT_PART_OF_A_LOOK.length === 4 && Object.keys(back).filter(k => !NOT_PART_OF_A_LOOK.includes(k)).every(k => k in look) && look.bg1 === '#0d0e0f');
check('filtering does not mutate the original', foreign.username === '@theirs');
check('the spell code can be hidden: saved, restored, and kept by a spell (it is part of the look)',
  'spellMark' in back && look.spellMark === false);

// ---------- export and import keep every field ----------
const vaultMod = await import('../vault.js');
const store = new Map();
const fakeStorage = { getItem: k => store.has(k) ? store.get(k) : null,
  setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
const rec = { name: 'Audit look', spell: PRESETS[0].spell, settings: back, savedAt: '2026-01-01 00:00' };
const exported = JSON.stringify([rec]);
const incoming = JSON.parse(exported);
const merged = vaultMod.mergeRecords([], incoming, vaultMod.spellKeyOf, vaultMod.isValidSpell);
const out = merged.merged[0];
const lostOnImport = Object.keys(back).filter(k => norm(back[k]) !== norm(out && out.settings[k]));
check('an exported spell imports with every setting intact', !!out && lostOnImport.length === 0);
if(lostOnImport.length) console.log('   lost on import:', lostOnImport.join(', '));
check('an imported spell keeps its glyphs', out && out.spell === rec.spell);
check('importing the same spell twice does not duplicate it',
  vaultMod.mergeRecords(merged.merged, incoming, vaultMod.spellKeyOf, vaultMod.isValidSpell).merged.length === 1);


// ---- old looks open (AGENTS.md §7: saved keys are frozen; retired ids translate forward in retireLook) ----
{
  const base = save();
  const opened = over => { load({ ...base, ...over }); return save(); };
  check('a retired texture id opens as the texture that kept its look: whorl → dunes, crystalleaf → spangle, crucible → athanor, foxing and foldghost → oldpaper',
    opened({ textureType: 'whorl' }).textureType === 'dunes' && opened({ textureType: 'crystalleaf' }).textureType === 'spangle'
    && opened({ textureType: 'crucible' }).textureType === 'athanor' && opened({ textureType: 'foxing' }).textureType === 'oldpaper'
    && opened({ textureType: 'foldghost' }).textureType === 'oldpaper');
  const ink = opened({ textureType: 'inkbleed', textureTint1: '#FFFFFF', textureTint2: '#000000' });
  check('an old Rorschach look (white and black hues) opens with ink and accent', /^#141414$/i.test(ink.textureTint1) && /^#B0283A$/i.test(ink.textureTint2));
  load(base);
}
// …and each format's translations: an old slider's job handed to a dial, a slider retired or renamed (lookVersion)
{
  // (the camera taken out: an old look of a surface with a camera, saved before it, has none)
  const base = save(), { lookVersion, cameraTurn, cameraView, cameraZoom, ...old } = base;
  check('a look says which format it was saved in', base.lookVersion === 10);
  // (format 9: Floral Imprints' sixth slider became its Medium, its ink hues moved to the first two, the defaults emptied)
  load({ ...old, lookVersion: 8, texture: true, textureType: 'imprints', texP6: '70', textureTint2: '#1F4E8C', textureTint12: '#AA2200' });
  { const b = save(); check('an old Floral Imprints look: its Medium starts By the Seed, its default ink is the medium\'s own, a chosen second ink kept', b.texP6 === '0' && b.textureTint1 === '' && /^#AA2200$/i.test(b.textureTint2)); }
  load({ ...base, lookVersion: 6, texture: true, textureType: 'blackhole', textureLight: '45', textureLightTilt: '60', cameraTurn: '0', cameraView: '0', cameraZoom: '100' });
  { const b = save(); check('an old Black Hole look: its view from the light dial (45°, 60) becomes the camera\'s (Turn 90, View 60), the same picture', b.cameraTurn === '90' && +b.cameraView === 60 && +b.cameraZoom === 100); }
  load({ ...old, texture: true, textureType: 'rainstreaks', texP1: '200', texP2: '-30', textureLight: '315' });
  let s = save();
  check('an old Harsh Rain look: Slant −30° becomes the dial at 30°, no gusts', s.textureLight === '30' && +s.texP2 === 0 && +s.texP1 === 200);
  load({ ...old, texture: true, textureType: 'hatch', texP1: '64', texP2: '400', textureLight: '315' });
  s = save();
  check('an old Silverpoint Hatch look: Hatch Angle 64° becomes the dial at 154°, Cross-Hatching as it was', s.textureLight === '154' && +s.texP1 === 38 && +s.texP2 === 400);
  load({ ...base, texture: true, textureType: 'rainstreaks', texP2: '30', textureLight: '200' });
  s = save();
  check('a new look is left as it is', s.textureLight === '200' && +s.texP2 === 30);
  // the 3D Ringworld retired (Ruby): its looks open as the Painted Ringworld, after the old formats' translations
  load({ ...old, lookVersion: 3, texture: true, textureType: 'ringworld', texP6: '80', textureLight: '315', textureLightTilt: '100', cameraTurn: '40', cameraView: '55', cameraZoom: '100' });
  s = save();
  check('an old Ringworld look opens as the Painted Ringworld: Daylight 80 still the light dial at 40 (morning), the camera as it was', s.textureType === 'ringpaint' && +s.textureLightTilt === 40 && s.cameraTurn === '40');
  load({ ...old, lookVersion: 3, texture: true, textureType: 'circuit', texP7: '100' });
  s = save();
  check('an old Circuit Board look at Magitech (four eras) stays the board it was: Atomic, at 75 of five eras', +s.texP7 === 75);
  load({ ...old, lookVersion: 4, texture: true, textureType: 'ringworld', texP2: '70', texP4: '40', texP7: '30', cameraTurn: '40', cameraView: '55', cameraZoom: '100' });
  s = save();
  check('…its Landforms and Altitude carry on, its Cities as Works', s.textureType === 'ringpaint' && +s.texP2 === 70 && +s.texP6 === 30 && +s.texP5 === 42);
  // format 4: the Tilt sliders onto the camera dial (Dune Ripples' fourth, Moss on Stone's fourth, Scrying Pool's sixth)
  load({ ...old, lookVersion: 3, texture: true, textureType: 'dunes', texP1: '140', texP4: '60', cameraTurn: '90', cameraView: '0', cameraZoom: '100' });
  s = save();
  check('an old Dune Ripples look: Tilt 60 becomes the camera dial\'s View 60, unturned', s.cameraView === '60' && s.cameraTurn === '0' && s.cameraZoom === '100' && +s.texP1 === 140);
  load({ ...old, lookVersion: 3, texture: true, textureType: 'water', texP6: '0', cameraTurn: '0', cameraView: '55', cameraZoom: '100' });
  s = save();
  check('…a Scrying Pool looking straight down stays straight down', s.cameraView === '0');
  load({ ...old, lookVersion: 3, texture: true, textureType: 'moss', texP4: undefined });
  s = save();
  check('…and a Moss on Stone look saved with no Tilt at all takes its old default, 30', s.cameraView === '30');
  // format 8: positioning onto the camera dial (the Transmutation Circle's light-dial place, Rain on Water's View, the
  // Painted Landscape's Tilt, whose Color and Impasto step up a place)
  load({ ...old, lookVersion: 7, texture: true, textureType: 'rainwater', texP1: '120', texP5: '85' });
  s = save();
  check('an old Rain on Water look: View 85 (across the water) becomes the camera dial\'s View 100', s.cameraView === '100' && +s.texP1 === 120);
  load({ ...old, lookVersion: 7, texture: true, textureType: 'landscape', texP4: '40', texP5: '70', texP6: '20' });
  s = save();
  check('…a Painted Landscape look: Tilt 40 the camera\'s View, Color and Impasto a place up', s.cameraView === '40' && +s.texP4 === 70 && +s.texP5 === 20);
  load({ ...old, lookVersion: 7, texture: true, textureType: 'summoning', textureLight: '90', textureLightTilt: '60' });
  s = save();
  check('…a Transmutation Circle placed by the light dial is placed by the camera dial there', s.cameraTurn === '90' && s.cameraView === '60');
  load(base);
}

done();
