/**
 * textureElements.test.mjs — every texture's four readings (🜂 Fire, 🜄 Water,
 * 🜁 Wind, 🜃 Earth; textureElements.js): one is the texture's default, the
 * other three stay inside the texture's own ranges, blend list and hues, and
 * every one of them generates. The four buttons sit under Surface Variant and
 * apply a reading the way Randomize does (locked controls keep their values).
 */
import { readFileSync } from 'fs';
import { installCanvasMock } from './canvasMock.mjs';
installCanvasMock();
const { TEXTURE_PARAMS, TEXTURE_CAPS, getTextureCanvas, clearTextureCache } = await import('../textureGenerators.js');
const { TEXTURE_ELEMENTS, PRIMAL_ELEMENTS, elementsFor } = await import('../textureElements.js');

let failures = 0;
const check = (label, cond) => { cond ? console.log('ok:', label) : (failures++, console.log('FAIL:', label)); };
const bad = (label, list) => { check(label, list.length === 0); if(list.length) console.log('   ', list.slice(0, 12).join(' | ')); };

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ev = readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8');
const sel = html.slice(html.indexOf('<select id="textureType">'), html.indexOf('</select>', html.indexOf('<select id="textureType">')));
const picker = [...sel.matchAll(/<option value="([a-z]+)"/g)].map(m => m[1]);
const HEX = /^#[0-9A-F]{6}$/i;

check('the four Primal Archetypes, in the order of the buttons: 🜂 Fire, 🜄 Water, 🜁 Wind, 🜃 Earth',
  PRIMAL_ELEMENTS.map(e => e.glyph + e.id).join(' ') === '🜂fire 🜄water 🜁wind 🜃earth');
bad('every texture in the picker has all four readings, one of them its default',
  picker.filter(t => { const E = TEXTURE_ELEMENTS[t]; return !E || !PRIMAL_ELEMENTS.every(e => E[e.id] && E[e.id].name) || !PRIMAL_ELEMENTS.some(e => e.id === E.def); }));
bad('a default reading names itself and nothing else (applying it puts the texture\'s own defaults back)',
  Object.entries(TEXTURE_ELEMENTS).filter(([, E]) => Object.keys(E[E.def] || {}).join() !== 'name').map(([t]) => t));
bad('no texture is offered readings it doesn\'t have in the picker', Object.keys(TEXTURE_ELEMENTS).filter(t => !picker.includes(t)));
bad('the four names of a texture are its own (no two alike)',
  Object.entries(TEXTURE_ELEMENTS).filter(([, E]) => new Set(PRIMAL_ELEMENTS.map(e => E[e.id].name)).size !== 4).map(([t]) => t));

// every variation, against the texture's own controls
const problems = [];
for(const t of picker){
  const P = TEXTURE_PARAMS[t], C = TEXTURE_CAPS[t];
  for(const v of elementsFor(t)){
    if(v.isDefault) continue;
    const where = `${t}/${v.el}`;
    if(!v.k || v.k.length !== P.length) problems.push(`${where}: ${v.k ? v.k.length : 0} knobs for ${P.length}`);
    (v.k || []).forEach((x, i) => { if(P[i] && (x < P[i].min || x > P[i].max)) problems.push(`${where}: ${P[i].label} ${x} outside ${P[i].min}–${P[i].max}`); });
    if(v.t && (v.t.length > (C.tints || 0) || !v.t.every(h => HEX.test(h)))) problems.push(`${where}: hues ${v.t}`);
    if(v.t5 && (!C.hue5 || !HEX.test(v.t5))) problems.push(`${where}: fifth hue ${v.t5}`);
    if(v.blend && !C.blends.includes(v.blend)) problems.push(`${where}: blend ${v.blend}`);
    if(v.light && (!C.light || v.light[1] < 0 || v.light[1] > (C.lowLight ? 130 : 100))) problems.push(`${where}: light ${v.light}`);
    if(!v.k && !v.t && !v.t5 && !v.blend && !v.light) problems.push(`${where}: changes nothing`);
  }
}
bad('every reading stays inside its texture: its knobs\' ranges, its hues, its blends, its light', problems);

// and every one of them is made (a variation is a starting place: it must work)
const thrown = [];
for(const t of picker){
  if(t === 'astral' || t === 'athanor') continue;
  for(const v of elementsFor(t)){
    const o = { seed: 7, scale: 0.1, accent1: '#C9A876', accent2: '#7A8CA3' };
    (v.k || []).forEach((x, i) => { o['p' + (i + 1)] = x; });
    if(v.t){ o.tint1 = v.t[0]; o.tint2 = v.t[1]; }
    if(v.t5) o.tint5 = v.t5; if(v.blend) o.blend = v.blend; if(v.light){ o.light = v.light[0]; o.lightTilt = v.light[1]; }
    try { clearTextureCache(); const c = getTextureCanvas(t, 160, 160, o); if(!c || !c.width) thrown.push(`${t}/${v.el}: nothing`); }
    catch(e){ thrown.push(`${t}/${v.el}: ${e.message}`); }
  }
}
bad('every reading of every texture generates', thrown);

// the buttons
const fieldAt = html.indexOf('id="elementRow"'), pickAt = html.indexOf('<select id="textureType">'), knobAt = html.indexOf('id="texP1Label"');
check('four buttons — 🜂 🜄 🜁 🜃 — right under Surface Variant, before its knobs',
  fieldAt > pickAt && fieldAt < knobAt && /data-el="fire"[^>]*>🜂<[\s\S]*data-el="water"[^>]*>🜄<[\s\S]*data-el="wind"[^>]*>🜁<[\s\S]*data-el="earth"[^>]*>🜃</.test(html));
check('a reading is applied as Randomize applies its changes: locked controls are put back', /function applyElement\(id\)\{[\s\S]*?withLocksPreserved\(\(\) => \{/.test(ev));
check('…its default puts the texture\'s own knobs, hues, blend and light back', /if\(v\.isDefault\)\{\s*\/\/[^\n]*\n\s*syncTextureParams\(true\); syncTextureTools\(true\);/.test(ev));
check('…a hue set by a reading is the person\'s (it stops following the accent), and it is one undo step',
  /setColorField\('textureTint' \+ \(i \+ 1\) \+ 'Hex', hex\); state\.ui\.tintFollows\[i\] = false;/.test(ev) && /applyElement[\s\S]{0,2000}commitSoon\(\)/.test(ev));
check('the default is marked, the one applied is lit and named; a new texture clears it',
  /b\.classList\.toggle\('is-default', !!v\.isDefault\)/.test(ev) && /state\.ui\.element = null; paintElements\(\);/.test(ev));
check('the Athanor\'s glyph is 🜉 (Creation, the Cosmological Archetype)', html.includes('<optgroup label="🜉 The Athanor"') && html.includes('forge-glyph" aria-hidden="true">🜉<'));

console.log();
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
