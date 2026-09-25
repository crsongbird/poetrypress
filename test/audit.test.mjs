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
 * spells (create/apply), and spell export/import.
 *
 * Run: node test/audit.test.mjs
 */
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';

installCanvasMock();
const reg = installDomMock(makeMockContext, makeMockCanvas);
await import('../appEvents.js');
const { ASPECTS, PRESETS } = await import('../appOptions.js');
const { paramsFor, capsFor } = await import('../textureGenerators.js');

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };

const save = () => { reg['advancedRefreshBtn'].dispatchEvent({ type: 'click' }); return JSON.parse(reg['advancedJson'].value); };
const load = obj => { reg['advancedJson'].value = JSON.stringify(obj); reg['advancedLoadBtn'].dispatchEvent({ type: 'click' }); };

// comparison that ignores representation, not meaning
const norm = v => {
  if(v === undefined || v === null) return v;
  if(Array.isArray(v)) return JSON.stringify([...v].sort());
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
  usernameCorner: v => v === 'top-right' ? 'top-left' : 'top-right',
  align: v => v === 'right' ? 'center' : 'right',
  valign: v => v === 'bottom' ? 'top' : 'bottom',
  aspect: v => v === '2:3' ? '16:9' : '2:3',
  spell: v => PRESETS.map(p => p.spell).find(s => s && s !== v),
  locks: () => ['bgColor1Hex', 'textureType'],
  textureLight: () => '135',
  texP1: () => String(waxParams[0].def + 13),
  texP2: () => String(waxParams[1].def - 11),
  textureSeed: v => (+v || 0) + 7,
  lineSpacing: v => +((+v || 0) + 0.15).toFixed(2),
  textureOpacity: v => Math.min(99, (+v || 0) + 3),
  poemText: () => '## Audit\nline one~A\n<two/effect:halo,40>',
  username: () => '@audit',
};
const SLIDERS = { borderBloom:'42', vignetteAperture:'41', vignetteCx:'12', vignetteCy:'88',
  vignetteNoise:'9', typeEffectStrength:'67', typeEffectAngle:'212', typeEffectDistance:'140',
  typeEffectGrain:'33' };
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
//   customSize is exercised in its own pass below (it overrides aspect)
const DERIVED = new Set(['customW', 'customH', 'customSize']);

// ---------- pass 1: every key ----------
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

// nothing may appear on the way back that was never saved
const invented = Object.keys(back).filter(k => !(k in base));
check('loading does not invent keys that saving never produced', invented.length === 0);

// ---------- pass 2: the page size, in its custom form ----------
load({ ...back, customSize: true, customW: '1234', customH: '2345' });
const custom = save();
check('a custom resolution survives', custom.customSize === true &&
  norm(custom.customW) === '1234' && norm(custom.customH) === '2345' && custom.aspect === 'custom');
check('an out-of-range custom size is clamped, not trusted',
  (()=>{ load({ ...back, customSize: true, customW: '99999', customH: '5' });
         const c = save(); return +c.customW === 4096 && +c.customH === 256; })());
load({ ...back, customSize: false, aspect: '4:3' });
const wide = save();
check('switching back to a named aspect restores it and its size',
  wide.aspect === '4:3' && +wide.customW === ASPECTS['4:3'][0] && +wide.customH === ASPECTS['4:3'][1]);

// ---------- pass 3: four-stop gradients ----------
load({ ...back, bgGradient: true, bg3: '#303132', bg4: '#404142',
       textGradient: true, text3: '#505152', text4: '#606162' });
const stops = save();
check('background gradient stops 3 and 4 survive',
  norm(stops.bg3) === '#303132' && norm(stops.bg4) === '#404142');
check('text gradient stops 3 and 4 survive',
  norm(stops.text3) === '#505152' && norm(stops.text4) === '#606162');

// ---------- pass 4: a saved spell carries the look, and only the look ----------
const src = (await import('fs')).readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8');
check('spells are saved through the look filter', /getSettings:\s*settingsForSpell/.test(src) &&
  /function settingsForSpell\(\)\{\s*return stripToLook\(serializeCurrentSettings\(\)\)/.test(src));
check('spells are applied through the look filter',
  /applySettings:[^\n]*restoreSettings\(stripToLook\(/.test(src) && /import \{ createVault, stripToLook \} from '\.\/vault\.js'/.test(src));
check('saved-spell tiles in the Rituals grid use the same filter',
  /restoreSettings\(stripToLook\(Object\.assign\(\{\}, rec\.settings/.test(src));
// behaviour: a spell carrying someone else's identity and UI state
const { stripToLook, NOT_PART_OF_A_LOOK } = await import('../vault.js');
const foreign = { ...back, username: '@theirs', highlight: false,
                  locks: ['textureType'], poemText: 'their poem', bg1: '#0d0e0f' };
const look = stripToLook(foreign);
for(const k of ['poemText', 'locks', 'highlight', 'username'])
  check(`a spell never carries "${k}"`, NOT_PART_OF_A_LOOK.includes(k) && !(k in look));
check('everything that IS the look is kept',
  Object.keys(back).filter(k => !NOT_PART_OF_A_LOOK.includes(k)).every(k => k in look) && look.bg1 === '#0d0e0f');
check('filtering does not mutate the original', foreign.username === '@theirs');

// ---------- pass 5: export and import keep every field ----------
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

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
