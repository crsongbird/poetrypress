/**
 * uiLook.js — a look: saved and restored (the Workbench JSON, spells), the presets, and the lit look
 *
 * Split from appEvents.js (its wiring, the listeners, stays there, in the order it runs).
 */
import { $, FONTS, PRESETS } from './appOptions.js';
import { FRAME_DEFAULTS, lockablesIn, paintMasterLocks, paintMoons, paintSeedMoon, restoreLockState, restoreLocked, rollSection, snapshotLocked, syncLinkedBox, syncStopFields } from './uiLocks.js';
import { LIGHT_KEPT_PARTS, LIGHT_TURNED, SURFACE_HUE_KEYS, capsFor, paramsFor } from './textureGenerators.js';
import { PRESET_ACTS } from './strings.js';
import { RIM_DEFAULT, cameraStart, hue5Default, keepGround, putCamera, putRim, syncLightPad } from './uiDials.js';
import { SWATCH } from './tunables.js';
import { TEXTURE_ELEMENTS, elementsFor } from './textureElements.js';
import { applyAthanorGraph } from './uiAthanor.js';
import { blendFamily } from './texCore.js';
import { chMatches } from './chooser.js';
import { commitSoon, lookSnapshot } from './uiHistory.js';
import { deriveThemePalette } from './palette.js';
import { editLayer, layersIntoLook, lowerOn, paintLayerWords, pickLayer, syncBaseUi } from './uiLayers.js';
import { guardWork, markFresh, needsGuard, restoreShape, safeRestore, toast } from './uiGuard.js';
import { maybeRerollSeed } from './uiLayout.js';
import { paintPresetSwatch } from './swatches.js';
import { scheduleRender, surfaceFromDom } from './canvasRenderer.js';
import { seedFromText } from './seedWords.js';
import { state } from './uiState.js';
import { stripToLook } from './vault.js';
import { LAYER_LOCK_IDS, customGrid, fontSelect, lockButtons, murmur, presetGrid, refreshUi, safeColoris, setActiveRadioValue, setColorField, tileWatch, vault } from './appEvents.js';
import { EFFECT_SLOT_DEFAULTS, applyLegacyEffects, refreshReadouts, repaintEditor, syncAllFxSlots, syncFrameVisibility, syncSeedWords } from './uiControls.js';
import { applyElement, syncTextureParams, syncTextureTools } from './uiSurface.js';

/**
 * Controls whose save/restore is purely mechanical: read the element, write
 * it back. Adding a control here is the whole job — it is then saved in
 * settings, restored from them, and carried by exported spells.
 *
 * Each row: [key in the saved JSON, element id, kind, readout suffix].
 *   kind  'text'  -> element.value as saved
 *         'check' -> element.checked
 *         'color' -> element.value, restored through setColorField
 * A readout suffix means a sibling `${id}Val` span shows the value.
 *
 * Key names and value types are frozen: spells already saved in people's
 * browsers use exactly these, so renaming one would silently drop that
 * setting on load. Controls with real logic of their own — conditional
 * gradient stops, the font by name, locks, page size — stay hand-written
 * in serializeCurrentSettings and restoreSettings below.
 */
const PERSISTED = [
  ['bgGradientType',       'bgGradientType',       'text'],
  ['textGradientType',     'textGradientType',     'text'],     // the text gradient's shape (linear, mirrored, radial, sweep)
  ['bgRadialX',            'bgRadialX',            'text', '%'],
  ['bgRadialY',            'bgRadialY',            'text', '%'],
  ['bgRadialR',            'bgRadialR',            'text', '%'],
  ['borderGrain',          'borderGrain',          'text', '%'],
  ['textureClearing',      'textureClearing',      'text', '%'],   // the surface quieted behind the words (canvasRenderer clearedSurface)
  ['borderRounded',        'borderRounded',        'check'],
  ['borderRadius',         'borderRadius',         'text', 'px'],
  ['cardToggle',           'cardToggle',           'check'],
  ['poemShown',            'poemShown',            'check'],     // the inscription's eye: the words drawn, or kept back
  ['cardColor1',           'cardColor1Hex',        'color'],
  ['cardGradientToggle',   'cardGradientToggle',   'check'],
  ['cardColor2',           'cardColor2Hex',        'color'],
  ['cardGradientType',     'cardGradientType',     'text'],
  ['cardGradientAngle',    'cardGradientAngle',    'text', '°'],
  ['cardOpacity',          'cardOpacity',          'text'],
  ['cardBlend',            'cardBlend',            'text'],
  ['cardLink',             'cardLink',             'check'],
  ['cardOffset',           'cardOffset',           'text', 'px'],
  ['cardThickness',        'cardThickness',        'text', 'px'],
  ['cardRounded',          'cardRounded',          'check'],
  ['cardRadius',           'cardRadius',           'text', 'px'],
  ['cardStitch',           'cardStitch',           'text'],
  ['cardStitchOut',        'cardStitchOut',        'check'],
  ['cardFx',               'cardFx',               'text'],
  ['cardFxAmount',         'cardFxAmount',         'text', ''],
  ['cardFxScale',          'cardFxScale',          'text', ''],
  ['forgeGraph',           'forgeGraph',           'text'],      // the Athanor's graph (Drawflow's JSON)
  ['textureCurve1',        'textureCurve1',        'text', ''],  // the graph's Curve Controls as drawn on the page ('': the graph's own)
  ['textureCurve2',        'textureCurve2',        'text', ''],
  ['baseToggle',           'baseToggle',           'check'],     // Two Surfaces: the lower one drawn (its settings are the look's baseLayer)
  ['borderBlend',          'borderBlend',          'text'],
  ['borderGradientAngle',  'borderGradientAngle',  'text', '°'],
  ['borderStitch',         'borderStitch',         'text'],
  ['borderStitchOut',      'borderStitchOut',      'check'],
  ['borderBloomBlend',     'borderBloomBlend',     'text'],
  ['borderGradientToggle', 'borderGradientToggle', 'check'],
  ['borderColor2',         'borderColor2Hex',      'color'],
  ['borderColor3',         'borderColor3Hex',      'color'],
  ['borderBloom',          'borderBloom',          'text', ''],
  ['vignetteAperture',     'vignetteAperture',     'text', ''],
  ['vignetteCx',           'vignetteCx',           'text', ''],
  ['vignetteCy',           'vignetteCy',           'text', ''],
  ['vignetteNoise',        'vignetteNoise',        'text', ''],
  ['fx1Type',             'fx1Type',             'text'],
  ['fx1Color',            'fx1Color',            'color'],
  ['fx1K1',               'fx1K1',               'text'],
  ['fx1K2',               'fx1K2',               'text'],
  ['fx1Angle',            'fx1Angle',            'text', '°'],
  ['fx2Type',             'fx2Type',             'text'],
  ['fx2Color',            'fx2Color',            'color'],
  ['fx2K1',               'fx2K1',               'text'],
  ['fx2K2',               'fx2K2',               'text'],
  ['fx2Angle',            'fx2Angle',            'text', '°'],
  ['fx3Type',             'fx3Type',             'text'],
  ['fx3Color',            'fx3Color',            'color'],
  ['fx3K1',               'fx3K1',               'text'],
  ['fx3K2',               'fx3K2',               'text'],
  ['fx3Angle',            'fx3Angle',            'text', '°'],
  ['underAll',             'underAll',             'text'],
];
function collectPersisted(){
  const out = {};
  for(const [key, id, kind] of PERSISTED){
    const el = $(id);
    if(!el) continue;
    out[key] = kind === 'check' ? el.checked : el.value;
  }
  return out;
}
export function applyPersisted(s){
  for(const [key, id, kind, unit] of PERSISTED){
    if(s[key] === undefined) continue;
    const el = $(id);
    if(!el) continue;
    if(kind === 'check') el.checked = !!s[key];
    else if(kind === 'color'){ if(s[key]) setColorField(id, s[key]); }
    else el.value = s[key];
    if(unit !== undefined){
      const out = $(id + 'Val');
      if(out) out.textContent = s[key] + unit;
    }
  }
}
// a look's FORMAT: 2 since the dial took over Harsh Rain's slant and Silverpoint
// Hatch's angle (their sliders took new jobs); 3 every blend for every surface; 4 Ringworld's day on the light dial and
// Circuit Board's five eras; 5 Ringworld's Stand At slider becoming Traffic; 6 the dial's handle the light (looks lit
// from its far side turned half round); 7 the Black Hole seen from the camera dial.
// Older looks are translated on load
const LOOK_VERSION = 10;
export function serializeCurrentSettings(){
  return layersIntoLook({
    lookVersion: LOOK_VERSION,
    bg1: $('bgColor1Hex').value,
    bgGradient: $('bgGradientToggle').checked,
    bg2: $('bgColor2Hex').value,
    bg3: state.page.bgStops>=3 ? $('bgColor3Hex').value : undefined,
    bg4: state.page.bgStops>=4 ? $('bgColor4Hex').value : undefined,
    bgAngle: parseFloat($('bgGradientAngle').value),

    text1: $('textColorHex').value,
    textGradient: $('textGradientToggle').checked,
    text2: $('textColor2Hex').value,
    text3: state.page.textStops>=3 ? $('textColor3Hex').value : undefined,
    text4: state.page.textStops>=4 ? $('textColor4Hex').value : undefined,
    textAngle: parseFloat($('textGradientAngle').value),

    font: FONTS[fontSelect.value].family,
    maxSize: parseFloat($('maxSize').value),
    lineSpacing: parseFloat($('lineSpacing').value),
    textMargin: parseFloat($('textMargin').value),

    accent1: $('accent1Toggle').checked ? $('accent1ColorHex').value : undefined,
    accent2: $('accent2Toggle').checked ? $('accent2ColorHex').value : undefined,


    texture: $('textureToggle').checked,
    // the mechanical controls, from the PERSISTED table above
    ...collectPersisted(),
    // the surface the controls show (layersIntoLook puts the upper here, whichever it is)
    ...surfaceFromDom(),
    spell: $('activeSpell').value,
    highlight: $('highlightToggle') ? $('highlightToggle').checked : true,
    // which controls the user has pinned against Randomize and presets
    locks: Array.from(state.locks),

    border: $('borderToggle').checked,
    borderColor: $('borderColorHex').value,
    borderThickness: parseFloat($('borderThickness').value),
    borderOffset: parseFloat($('borderOffset').value),

    vignette: $('vignetteToggle').checked,
    vignetteBlend: $('vignetteBlend').value,
    vignetteIntensity: parseFloat($('vignetteIntensity').value),

    align: state.page.align,
    valign: state.page.valign,
    aspect: state.page.aspect,
    customSize: $('customSizeToggle').checked,
    customW: $('customW').value,
    customH: $('customH').value,

    username: $('usernameField').value,
    usernameCorner: $('usernameCorner').value,
    lookName: (document.body && document.body.dataset && document.body.dataset.lookName) || '',   // the look's name (a preset's, a spell's): spells, shares and JSON carry it
    spellMark: $('spellMark').checked,   // the spell code in the corner: part of the look, so spells and shared links keep it

    poemText: $('poemText').value,
  });
}
/** A look made with a texture that has since been retired, as its successor.
 *  Zen Garden became Dune Ripples; Foxing and Fold Ghost merged into Old
 *  Paper — their knobs translated so the look stays close to what it was. */
function retireLook(s){ return retireRingworld(retireFormat10(retireFormat9(retireFormat8(retireFormat7(retireFormat6(retireFormat5(retireFormat4(retireCamera(retireBaseLayer(retireBlend(retireLookOnce(s)))))))))))); }
/** LINEN TOOTH REMADE ON THE CLOTH PARTS (format 10; Ruby: "completely remake this in the cloth and lighting engine"):
 *  its Weave (silk → twill → linen → canvas → burlap) is the Fabric now, nine of them (the nearest: twill is denim), and
 *  Details (stitching, slubs, buttons, rivets) gives way to Creases, at their gentle default. */
function retireFormat10Layer(L){
  if(!L || L.textureType !== 'linen') return L;
  const v = +L.texP3, f = isNaN(v) ? 50 : v, k = Math.max(0, Math.min(4, Math.round(f/25)));
  return { ...L, texP3: String([6, 50, 39, 61, 83][k]), texP2: '30' };
}
function retireFormat10(s){ if(!s || +s.lookVersion >= 10) return s; let o = retireFormat10Layer(s); if(o && o.baseLayer) o = { ...o, baseLayer: retireFormat10Layer(o.baseLayer) }; return o; }
/** THE 3D RINGWORLD RETIRED (Ruby, 2026-10-20: "it was a good concept, it's what led to this"): its looks open as the
 *  painted Ringworld, keeping what carries over: Band Width, Landforms and Altitude, who built it as the World, how
 *  built-up it was as Works; the camera and the day as they were. */
function retireRingworldLayer(L){
  if(!L || L.textureType !== 'ringworld') return L;
  const n = (v, d) => (v === undefined || v === null || v === '' || isNaN(+v)) ? d : +v;
  const world = [0, 14, 57, 29, 71, 86][Math.max(0, Math.min(5, Math.round(n(L.texP6, 0)/20)))];
  const o = { ...L, textureType: 'ringpaint', texP1: String(n(L.texP1, 45)), texP2: String(n(L.texP2, 50)), texP3: String(world), texP4: '50',
    texP5: String(Math.round(Math.max(0, Math.min(100, 10 + n(L.texP4, 25)*0.8)))), texP6: String(n(L.texP7, 15)), texP7: '0', texP8: '37' };
  delete o.texP9; delete o.texP10; return o;
}
function retireRingworld(s){ if(!s) return s; let o = retireRingworldLayer(s); if(o && o.baseLayer) o = { ...o, baseLayer: retireRingworldLayer(o.baseLayer) }; return o; }
/** FLORAL IMPRINTS IN FIFTEEN MEDIA (format 9; Ruby: "everything from white chalk to cyanotype …"): Misregistration's
 *  place is the Medium's (an old look: By the Seed, as its seed chose before); the Paper Hue goes (the page is the paper
 *  now), the Ink and Second Ink Hues lead, and an ink left at its old default is left empty, the medium's own. */
function retireFormat9Layer(L){
  if(!L || L.textureType !== 'imprints') return L;
  const o = { ...L, texP6: '0' }, ink = String(L.textureTint2 || ''), ink2 = String(L.textureTint12 || '');
  o.textureTint1 = /^#1F4E8C$/i.test(ink) ? '' : ink; o.textureTint2 = /^#C8402E$/i.test(ink2) ? '' : ink2; delete o.textureTint12;
  return o;
}
function retireFormat9(s){ if(!s || +s.lookVersion >= 9) return s; let o = retireFormat9Layer(s); if(o && o.baseLayer) o = { ...o, baseLayer: retireFormat9Layer(o.baseLayer) }; return o; }
/** POSITIONING ON THE CAMERA DIAL (format 8; Ruby: "use the camera dial … when we are doing camera positioning"): the
 *  Transmutation Circle was placed by the light dial (its turn the way, its height how far): those become the camera's
 *  Turn and View. Rain on Water's View slider (0–85) and the Painted Landscape's Tilt slider are the camera's View now;
 *  the Landscape's Color and Impasto step up a place. A look from before keeps its picture. */
function retireFormat8Layer(L){
  if(!L) return L;
  const n = (v, d) => (v === undefined || v === null || v === '' || isNaN(+v)) ? d : +v;
  if(L.textureType === 'summoning') return { ...L, cameraTurn: String(Math.round(n(L.textureLight, 315))), cameraView: String(Math.round(Math.min(100, n(L.textureLightTilt, 0)))), cameraZoom: '100' };
  if(L.textureType === 'rainwater'){ const o = { ...L, cameraTurn: '0', cameraView: String(Math.round(n(L.texP5, 35)/85*100)), cameraZoom: '100' }; delete o.texP5; return o; }
  if(L.textureType === 'landscape'){ const o = { ...L, cameraTurn: '0', cameraView: String(Math.round(n(L.texP4, 0))), cameraZoom: '100' };
    if(L.texP5 !== undefined) o.texP4 = L.texP5; else delete o.texP4; if(L.texP6 !== undefined) o.texP5 = L.texP6; else delete o.texP5; delete o.texP6; return o; }
  return L;
}
function retireFormat8(s){ if(!s || +s.lookVersion >= 8) return s; let o = retireFormat8Layer(s); if(o && o.baseLayer) o = { ...o, baseLayer: retireFormat8Layer(o.baseLayer) }; return o; }
/** THE BLACK HOLE ON THE CAMERA DIAL (format 7; Ruby: any view belongs on the camera dial): it was seen from the light
 *  dial, its turn 315° the disc level, its height how edge-on. A look from before keeps its picture: the dial's turn
 *  past 315° becomes the camera's Turn, its height the camera's View, the lens as it was. */
const blackHoleCamera = (light, tilt) => ({ cameraTurn: String(Math.round((((+(light ?? 315) || 0) - 315) % 360 + 360) % 360)),
  cameraView: String(Math.round(Math.max(0, Math.min(100, tilt === undefined || tilt === '' || isNaN(+tilt) ? 100 : +tilt)))), cameraZoom: '100' });
function retireFormat7Layer(L){ return L && L.textureType === 'blackhole' ? { ...L, ...blackHoleCamera(L.textureLight, L.textureLightTilt), textureLightTilt: 0 } : L; }
function retireFormat7(s){ if(!s || +s.lookVersion >= 7) return s; let o = retireFormat7Layer(s); if(o && o.baseLayer) o = { ...o, baseLayer: retireFormat7Layer(o.baseLayer) }; return o; }
/** THE DIAL'S HANDLE BECAME THE LIGHT (format 6; Ruby: the light dial "goes the opposite direction that I would expect"):
 *  most surfaces had been lit from the handle's other side (textureGenerators LIGHT_TURNED). A look, preset or reading
 *  made before is turned half round on such a surface, the main light and the rim alike, so it keeps its picture and
 *  its handle now stands where its light really is. */
function lightTurned(L){
  if(!L || !L.textureType) return false;
  if(L.textureType === 'athanor'){ const g = String(L.forgeGraph || ''); return !!g && !LIGHT_KEPT_PARTS.some(p => g.includes('"name":"' + p + '"')); }
  return LIGHT_TURNED.has(L.textureType);
}
export const halfRound = v => String(((Math.round(+v || 0) + 180) % 360 + 360) % 360);
function retireFormat6Layer(L){
  if(!lightTurned(L)) return L;
  const o = { ...L, textureLight: halfRound(L.textureLight ?? 315) };
  if(L.textureRim !== undefined && L.textureRim !== '') o.textureRim = halfRound(L.textureRim);
  return o;
}
function retireFormat6(s){ if(!s || +s.lookVersion >= 6) return s; let o = retireFormat6Layer(s); if(o && o.baseLayer) o = { ...o, baseLayer: retireFormat6Layer(o.baseLayer) }; return o; }
/** A look from before format 5 (Saturn–Hyperion and earlier): Ringworld's eighth slider was Stand At (where across the
 *  band you stood); it is Traffic now, at its middle (the ships as they were), and the seed says where you stand.
 *  Terrain and Structures keep their values as Landforms and Cities (the same relief, the same works). */
function retireFormat5Layer(L){ return L && L.textureType === 'ringworld' ? { ...L, texP8: '50' } : L; }
function retireFormat5(s){ if(!s || +s.lookVersion >= 5) return s; let o = retireFormat5Layer(s); if(o && o.baseLayer) o = { ...o, baseLayer: retireFormat5Layer(o.baseLayer) }; return o; }
/** A look from before format 4 (Saturn–Titan and earlier): Ringworld's Daylight slider (6) onto the light dial (noon at
 *  its middle, dusk at its rim, midnight past it), the sixth slider becoming Builders, by the seed; Circuit Board's Era
 *  from four eras to five (the one that was Magitech is Atomic now, at 75 where it stood at 100); and the Tilt sliders of
 *  Dune Ripples (4), Moss on Stone (4) and Scrying Pool (6) onto the camera dial's View (Ruby: "anytime we use a tilt …
 *  we should set it for the camera"), the camera unturned at its own lens, so the picture is the one it was. */
const FORMAT4_TILTS = { dunes: [4, 40], moss: [4, 30], water: [6, 35] };
function retireFormat4Layer(L){
  if(!L) return L;
  if(L.textureType === 'circuit' && +L.texP7 > 0) return { ...L, texP7: String(Math.round(+L.texP7*0.75)) };
  const tl = FORMAT4_TILTS[L.textureType];
  if(tl){ const v = L['texP' + tl[0]], t = (v === undefined || v === null || v === '' || isNaN(+v)) ? tl[1] : +v, o = { ...L, cameraTurn: '0', cameraView: String(Math.round(Math.max(0, Math.min(100, t)))), cameraZoom: '100' };
    delete o['texP' + tl[0]]; return o; }
  if(L.textureType !== 'ringworld') return L;
  const d = Math.max(0, Math.min(100, +L.texP6 >= 0 ? +L.texP6 : 80)), reach = d >= 50 ? (100 - d)*2 : 100 + (50 - d)*0.6;
  return { ...L, texP6: '0', textureLight: '90', textureLightTilt: String(Math.round(reach)) };
}
function retireFormat4(s){ if(!s || +s.lookVersion >= 4) return s; let o = retireFormat4Layer(s); if(o && o.baseLayer) o = { ...o, baseLayer: retireFormat4Layer(o.baseLayer) }; return o; }
/** A look from before the camera dial (Saturn–Rhea and earlier): Lichtenberg's camera sliders (Zoom, Turn, View) and
 *  Ringworld's light dial (it was the camera) onto the camera dial; Lichtenberg's sliders as they are now (the strike
 *  where the light dial pointed; Embers as charred wood with a Glow Hue; Slide moved to the last slider). */
function retireCameraLayer(L){
  if(!L || L.cameraTurn !== undefined) return L;
  const n = (v, d) => (v === undefined || v === null || v === '' || isNaN(+v)) ? d : +v;
  if(L.textureType === 'lichtenberg'){
    const m = n(L.texP4, 0), out = { ...L, texP4: String(m >= 75 ? 100 : 0), texP5: String(n(L.textureLight, 315)), texP6: '50', texP7: '100', texP8: String(n(L.texP6, 0)),
      cameraTurn: String(n(L.texP7, 0)), cameraView: String(n(L.texP8, 0)), cameraZoom: String(n(L.texP5, 100)) };
    if(m >= 25 && m < 75 && (!L.textureTint5 || /^#?0{6}/i.test(L.textureTint5))) out.textureTint5 = '#FF6A1A';
    return out;
  }
  if(L.textureType === 'ringworld'){
    const lens = n(L.texP8, 75), zoom = Math.round(100*Math.tan(37.5*Math.PI/180)/Math.tan(lens*Math.PI/360));
    return { ...L, texP8: '0', cameraTurn: String(n(L.textureLight, 40)), cameraView: String(Math.min(100, n(L.textureLightTilt, 55))), cameraZoom: String(zoom) };
  }
  return L;
}
function retireCamera(s){ if(!s) return s; let o = retireCameraLayer(s); if(o && o.baseLayer) o = { ...o, baseLayer: retireCameraLayer(o.baseLayer) }; return o; }
/** Before every blend was offered (format 3), a surface's blend menu held only the blends made for it, and
 *  a saved blend it didn't hold fell back to the first of them: so it does here. */
function retireBlend(s){
  if(!s || +s.lookVersion >= 3 || !s.textureType || !s.textureBlend) return s;
  const caps = capsFor(s.textureType);
  return caps && caps.blends && !caps.blends.includes(s.textureBlend) ? { ...s, textureBlend: caps.blends[0] } : s;
}
/** A look saved with the old base layer (its variant, two knobs, opacity and blend; the page's light, the
 *  seed turned, the variant's own hues) as a lower surface that draws the same. */
function retireBaseLayer(s){
  if(!s || s.baseType === undefined || s.baseLayer !== undefined) return s;
  const t = s.baseType, caps = capsFor(t), defs = paramsFor(t);
  const a1 = s.accent1 || ($('accent1ColorHex') || {}).value, a2 = s.accent2 || ($('accent2ColorHex') || {}).value;
  const L = { textureType: t, textureOpacity: s.baseOpacity !== undefined ? +s.baseOpacity : 50, textureBlend: s.baseBlend || 'overlay',
    textureLight: s.textureLight !== undefined ? s.textureLight : '315', textureLightTilt: s.textureLightTilt !== undefined ? s.textureLightTilt : '100',
    textureTint3: '#FFFFFF', textureTint4: '#FFFFFF', textureTint5: hue5Default(t), textureTint6: '#FFFFFF',
    textureSeed: ((parseInt(s.textureSeed, 10) || 0) ^ 0x5bd1e995) >>> 0, textureSeedWords: '', forgeGraph: '' };
  // (a grey surface was made on the ground of its own first blend when the chosen one wasn't made for it)
  if(caps.ground === 'grey' && !caps.blends.includes(L.textureBlend) && blendFamily(L.textureBlend) !== blendFamily(caps.blends[0])) L.textureGround = caps.blends[0];
  defs.forEach((d, i) => { L['texP' + (i + 1)] = String(i === 0 && s.baseP1 !== undefined ? s.baseP1 : i === 1 && s.baseP2 !== undefined ? s.baseP2 : d.def); });
  (caps.tintDefaults || []).forEach((c, i) => { if(SURFACE_HUE_KEYS[i]) L[SURFACE_HUE_KEYS[i]] = c === 'accent1' ? a1 : c === 'accent2' ? a2 : c; });
  const out = { ...s, baseLayer: L };
  for(const k of ['baseType', 'baseP1', 'baseP2', 'baseOpacity', 'baseBlend']) delete out[k];
  return out;
}
function retireLookOnce(s){
  if(!s) return s;
  if(s.textureType === 'whorl') return { ...s, textureType: 'dunes' };
  if(s.textureType === 'crucible') return { ...s, textureType: 'athanor' };   // the node editor's surface, briefly named the Crucible
  if(s.textureType === 'crystalleaf') return { ...s, textureType: 'spangle' };   // same knobs, same metal look
  // Rorschach's hues were Light/Dark (white, black); now they are Ink and Accent
  if(s.textureType === 'inkbleed' && /^#?FFFFFF$/i.test(s.textureTint1 || '') && /^#?000000$/i.test(s.textureTint2 || ''))
    return { ...s, textureTint1: '#141414', textureTint2: '#B0283A' };
  const n = (v, d) => (v === undefined || v === null || v === '' || isNaN(+v)) ? d : +v;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, Math.round(v)));
  // before format 2 the dial did nothing on Harsh Rain and Silverpoint Hatch:
  // their Slant and Hatch Angle sliders become the dial's direction, and the
  // sliders' new jobs start where the old look was (no gusts; the old cross-hatching)
  if(!(+s.lookVersion >= 2)){
    const deg = v => String(Math.round(((v % 360) + 360) % 360));
    if(s.textureType === 'rainstreaks') s = { ...s, textureLight: deg(-n(s.texP2, 0)), textureLightTilt: '100', ...(s.texP2 !== undefined ? { texP2: '0' } : {}) };
    if(s.textureType === 'hatch') s = { ...s, textureLight: deg(n(s.texP1, 35) + 90), textureLightTilt: '100', ...(s.texP1 !== undefined ? { texP1: '38' } : {}) };
    if(s.baseType === 'rainstreaks' && s.baseP2 !== undefined) s = { ...s, baseP2: '0' };
    if(s.baseType === 'hatch' && s.baseP1 !== undefined) s = { ...s, baseP1: '38' };
  }
  if(s.textureType === 'foxing')      // Bloom Size, Spot Count, Cockle → Scale, (no folds), Age, Crinkle
    return { ...s, textureType: 'oldpaper', texP1: n(s.texP1, 100), texP2: 0, texP3: clamp(20 + (n(s.texP2, 100) - 100)*0.08, 10, 60), texP4: clamp(n(s.texP3, 10), 0, 100) };
  if(s.textureType === 'foldghost')   // Crease Depth, Fold Count, Crumple → Scale, Folds, (clean), Crinkle
    return { ...s, textureType: 'oldpaper', texP1: n(s.texP1, 100), texP2: clamp(n(s.texP2, 100)*0.35, 5, 100), texP3: 5, texP4: clamp(n(s.texP3, 30), 0, 100) };
  return s;
}
export function restoreSettings(s){
  s = retireLook(s);
  // the layers: the controls take the upper (the look's own keys); the lower waits. If the controls were
  // showing the lower, they show it again at the end (an undo keeps its place)
  const wasEditing = state.layers.editing;
  state.layers.editing = 'upper';
  state.layers.other = s.baseLayer && typeof s.baseLayer === 'object' ? pickLayer(s.baseLayer) : null;
  state.layers.otherLocks = Array.isArray(s.baseLocks) ? s.baseLocks.filter(id => LAYER_LOCK_IDS.has(id)) : [];
  state.layers.otherUi = null;
  // the look's Athanor graph first: a Athanor surface's sliders are named from it
  if(s.forgeGraph !== undefined && $('forgeGraph')){ $('forgeGraph').value = s.forgeGraph; if(typeof applyAthanorGraph === 'function') applyAthanorGraph(false); }
  if(s.bg1) setColorField('bgColor1Hex', s.bg1);
  $('bgGradientToggle').checked = !!s.bgGradient;
  $('bgGradientBlock').classList.toggle('open', !!s.bgGradient);
  if(s.bg2) setColorField('bgColor2Hex', s.bg2);
  if(s.bg3) setColorField('bgColor3Hex', s.bg3);
  if(s.bg4) setColorField('bgColor4Hex', s.bg4);
  state.page.bgStops = s.bg4 ? 4 : (s.bg3 ? 3 : 2);
  syncStopFields(state.page.bgStops, 'bgColor3Field', 'bgColor4Field');
  setActiveRadioValue('bgStopsGroup', state.page.bgStops);
  if(s.bgAngle!==undefined){ $('bgGradientAngle').value=s.bgAngle; $('bgGradientAngleVal').textContent=s.bgAngle+'°'; }

  if(s.text1) setColorField('textColorHex', s.text1);
  $('textGradientToggle').checked = !!s.textGradient;
  $('gradientBlock').classList.toggle('open', !!s.textGradient);
  if(s.text2) setColorField('textColor2Hex', s.text2);
  if(s.text3) setColorField('textColor3Hex', s.text3);
  if(s.text4) setColorField('textColor4Hex', s.text4);
  state.page.textStops = s.text4 ? 4 : (s.text3 ? 3 : 2);
  syncStopFields(state.page.textStops, 'textColor3Field', 'textColor4Field');
  setActiveRadioValue('textStopsGroup', state.page.textStops);
  if(s.textAngle!==undefined){ $('textGradientAngle').value=s.textAngle; $('textGradientAngleVal').textContent=s.textAngle+'°'; }

  if(s.font){ const idx = FONTS.findIndex(f=>f.family===s.font); if(idx>=0) fontSelect.value = idx; }
  if(s.maxSize!==undefined) $('maxSize').value = s.maxSize;
  if(s.textMargin!==undefined){ $('textMargin').value = s.textMargin; $('textMarginVal').textContent = s.textMargin + '%'; }
  if(s.lineSpacing!==undefined){ $('lineSpacing').value=s.lineSpacing; $('lineSpacingVal').textContent = Math.pow(2, s.lineSpacing).toFixed(2)+'x'; }

  $('accent1Toggle').checked = !!s.accent1;
  $('accent1Block').classList.toggle('open', !!s.accent1);
  if(s.accent1) setColorField('accent1ColorHex', s.accent1);
  $('accent2Toggle').checked = !!s.accent2;
  $('accent2Block').classList.toggle('open', !!s.accent2);
  if(s.accent2) setColorField('accent2ColorHex', s.accent2);

  // a look saved before the effect stack: translate its outline/shadow and
  // typeface effect into the slots (the slots themselves restore via PERSISTED)
  if(s.fx1Type === undefined && (s.outlineMode !== undefined || s.typeEffect !== undefined)) applyLegacyEffects(s);

  $('textureToggle').checked = !!s.texture;
  $('textureBlock').classList.toggle('open', !!s.texture);
  if(s.textureType) $('textureType').value = s.textureType;
  // relabel/re-range for the incoming texture BEFORE restoring the knob
  // values, or they would be clamped against the previous texture's range
  syncTextureParams(true);
  syncTextureTools(true);
  // the mechanical controls, from the PERSISTED table (a look saved before the
  // box had its own shape takes the border's: linked)
  applyPersisted(s.cardLink === undefined ? { ...s, cardLink: true } : s);
  if(typeof refreshReadouts === 'function'){ refreshReadouts(); syncFrameVisibility(); }
  syncBaseUi();
  if(s.spell !== undefined) $('activeSpell').value = s.spell;
  if(s.highlight !== undefined && $('highlightToggle')){
    $('highlightToggle').checked = !!s.highlight;
    if(document.body && document.body.classList) document.body.classList.toggle('plain-editor', !s.highlight);
  }
  if(Array.isArray(s.locks)) restoreLockState(s.locks);
  restoreSurfaceDetails(s);


  $('borderToggle').checked = !!s.border;
  $('borderBlock').classList.toggle('open', !!s.border);
  if(s.borderColor) setColorField('borderColorHex', s.borderColor);
  if(s.borderThickness!==undefined) $('borderThickness').value = s.borderThickness;
  if(s.borderOffset!==undefined) $('borderOffset').value = s.borderOffset;
  if(s.cardLink === undefined) syncLinkedBox();   // (a linked look saved its mirrored values already)

  $('vignetteToggle').checked = !!s.vignette;
  $('vignetteBlock').classList.toggle('open', !!s.vignette);
  if(s.vignetteBlend) $('vignetteBlend').value = s.vignetteBlend;
  if(s.vignetteIntensity!==undefined){ $('vignetteIntensity').value=s.vignetteIntensity; $('vignetteIntensityVal').textContent=s.vignetteIntensity+'%'; }

  if(s.align){ state.page.align=s.align; setActiveRadioValue('alignGroup', s.align); }
  if(s.valign){ state.page.valign=s.valign; setActiveRadioValue('valignGroup', s.valign); }
  restoreShape(s);

  if(s.username!==undefined) $('usernameField').value = s.username;
  if(s.usernameCorner) $('usernameCorner').value = s.usernameCorner;
  if(typeof s.lookName === 'string' && document.body && document.body.dataset) document.body.dataset.lookName = s.lookName.slice(0, 80);
  if(s.spellMark !== undefined) $('spellMark').checked = !!s.spellMark;
  if(s.poemText!==undefined){ $('poemText').value = s.poemText; repaintEditor(); }

  if(wasEditing === 'lower' && lowerOn()) editLayer('lower');
  scheduleRender();
  paintMoons();
  paintSeedMoon();
  refreshUi();
}
/** One surface layer into the controls (the keys a look saves the upper with): its graph and kind first,
 *  so its sliders are named and ranged before their values. */
export function restoreSurfaceLayer(L){
  if($('forgeGraph')){ $('forgeGraph').value = L.forgeGraph || ''; if(typeof applyAthanorGraph === 'function') applyAthanorGraph(false); }
  if(L.textureType) $('textureType').value = L.textureType;
  syncTextureParams(true);
  syncTextureTools(true);
  restoreSurfaceDetails(L);
}
/** A surface's blend, light, hues, knobs, opacity and seed into the controls. */
function restoreSurfaceDetails(s){
  if(s.textureBlend) $('textureBlend').value = s.textureBlend;
  // the surface and the words (a look from before them: aware, as every surface was; neither blended into the letters)
  { const set = (id, v) => { if($(id)) $(id).checked = v; };
    set('textureTextAware', s.textureTextAware !== false); set('textureTextBlend', !!s.textureTextBlend); set('textureShapeAware', !!s.textureShapeAware); set('textureTextCut', !!s.textureTextCut);
    // (how strongly: a look from before the slider, fully)
    if($('textureShapeStrength')){ $('textureShapeStrength').value = s.textureShapeStrength ?? 100; if($('textureShapeStrengthVal')) $('textureShapeStrengthVal').textContent = $('textureShapeStrength').value + '%'; }
    paintLayerWords(); }
  keepGround(s.textureGround);
  if(s.textureLight !== undefined || s.textureLightTilt !== undefined){
    if(s.textureLight !== undefined) $('textureLight').value = s.textureLight;
    // looks saved before the dial had raking light only: 100
    if($('textureLightTilt')) $('textureLightTilt').value = s.textureLightTilt !== undefined ? s.textureLightTilt : '100';
    syncLightPad(); }
  // THE PAGE'S LIGHTS: the rim light (off, unless the look has one), the Ambient slider (the surface's own), their hues
  { putRim(s.textureRim !== undefined ? s.textureRim : RIM_DEFAULT.deg, s.textureRimTilt !== undefined ? s.textureRimTilt : RIM_DEFAULT.tilt);
    if($('textureAmbient')) $('textureAmbient').value = s.textureAmbient !== undefined ? String(s.textureAmbient) : '100';
    setColorField('textureTint7Hex', s.textureTint7 || RIM_DEFAULT.hex + '00'); setColorField('textureTint8Hex', s.textureTint8 || '#FFFFFF');
    syncLightPad(); }
  // the camera: the look's own, or where its surface's camera starts
  { const d = cameraStart(s.textureType || $('textureType').value);
    putCamera(s.cameraTurn !== undefined ? s.cameraTurn : d.turn, s.cameraView !== undefined ? s.cameraView : d.view, s.cameraZoom !== undefined ? s.cameraZoom : d.zoom); }
  if(s.textureTint1) setColorField('textureTint1Hex', s.textureTint1);
  if(s.textureTint2) setColorField('textureTint2Hex', s.textureTint2);
  if(s.textureTint9) setColorField('textureTint9Hex', s.textureTint9);
  if(s.textureTint10) setColorField('textureTint10Hex', s.textureTint10);
  if(s.textureTint11) setColorField('textureTint11Hex', s.textureTint11);
  if(s.textureTint12) setColorField('textureTint12Hex', s.textureTint12);
  // material hues: white (none) unless the look carries them
  setColorField('textureTint3Hex', s.textureTint3 || '#FFFFFF');
  setColorField('textureTint4Hex', s.textureTint4 || '#FFFFFF');
  // the fifth hue: its role's "none" unless the look carries one
  setColorField('textureTint5Hex', s.textureTint5 || hue5Default(s.textureType || $('textureType').value));
  setColorField('textureTint6Hex', s.textureTint6 || '#FFFFFF');
  if(s.texP1 !== undefined) $('texP1').value = s.texP1;
  if(s.texP2 !== undefined) $('texP2').value = s.texP2;
  if(s.texP3 !== undefined) $('texP3').value = s.texP3;
  if(s.texP4 !== undefined) $('texP4').value = s.texP4;
  if(s.texP5 !== undefined) $('texP5').value = s.texP5;
  if(s.texP6 !== undefined) $('texP6').value = s.texP6;
  if(s.texP7 !== undefined) $('texP7').value = s.texP7;
  if(s.texP8 !== undefined) $('texP8').value = s.texP8;
  if(s.texP9 !== undefined) $('texP9').value = s.texP9;
  if(s.texP10 !== undefined) $('texP10').value = s.texP10;
  for(const k of [1, 2]) if($('textureCurve' + k)) $('textureCurve' + k).value = s['textureCurve' + k] || '';
  syncTextureParams(false);
  if(s.textureOpacity!==undefined){ $('textureOpacity').value=s.textureOpacity; paintMoons(); }
  if(s.textureSeed!==undefined) $('textureSeedValue').value = s.textureSeed;
  // the words go back only if they are still this seed's (else its phrase is shown)
  { const box = $('textureSeedWords'), n = parseInt($('textureSeedValue').value, 10) || 0;
    if(box){ if(typeof s.textureSeedWords === 'string' && s.textureSeedWords && seedFromText(s.textureSeedWords) === n){ box.value = s.textureSeedWords; if(box.dataset) box.dataset.seed = String(n); }
      else syncSeedWords(true); } }
}
// Preset tiles paint when they come into view (Rituals may never be opened),
// one per animation frame so even opening it never freezes the page. Where
// visibility can't be observed, they paint at once, as before.
export const tileQueue = [];
function paintWhenSeen(canvasEl, paint){
  if(!tileWatch){ paint(); return; }
  canvasEl._paint = paint; tileWatch.observe(canvasEl);
}
/** One tile: painted snapshot above its name. */
export function presetTile(p, onPick, extraClass){
  const btn = document.createElement('div');
  btn.className = 'preset-btn' + (extraClass ? ' ' + extraClass : '');
  if(btn.dataset) btn.dataset.name = p.name || '';
  // (a tile a keyboard reaches and Enter or Space chooses)
  if(btn.setAttribute){ btn.setAttribute('role', 'button'); btn.tabIndex = 0; }
  if(btn.addEventListener) btn.addEventListener('keydown', e => { if((e.key === 'Enter' || e.key === ' ') && e.target === btn){ e.preventDefault(); btn.click(); } });
  const swatch = document.createElement('canvas');
  swatch.className = 'preset-swatch';
  paintWhenSeen(swatch, () => paintPresetSwatch(swatch, p, SWATCH.width, SWATCH.height));
  const label = document.createElement('span');
  label.className = 'preset-label';
  label.textContent = p.name;
  btn.appendChild(swatch);
  btn.appendChild(label);
  if(onPick) btn.addEventListener('click', onPick);
  return btn;
}
// THE GRID'S GROUPS FOLD, and a search finds a look by its name, its group, its surface or its surface's
// readings. Folded groups are remembered in this browser (an app preference, never part of a look).
const PRESET_FOLD_KEY = 'uv.presets.folded';
const presetFolded = () => { try { return new Set(JSON.parse(localStorage.getItem(PRESET_FOLD_KEY) || '[]')); } catch(e){ return new Set(); } };
export function groupTile(tile, group){ if(tile.dataset) tile.dataset.group = group; return tile; }
export function groupHead(g){
  const hd = document.createElement('button'); hd.type = 'button'; hd.className = 'preset-group-head';
  if(hd.dataset) hd.dataset.group = g.name;
  for(const [cls, text] of [['pg-glyph', g.glyph || ''], ['pg-name', g.name]]){   // (no count: Ruby, "not necessary")
    const sp = document.createElement('span'); sp.className = cls; sp.textContent = text; hd.appendChild(sp); }
  const open = !presetFolded().has(g.name); hd.setAttribute('aria-expanded', String(open));
  if(hd.addEventListener) hd.addEventListener('click', () => {
    if(presetSearchText()) return;                      // while searching, the search decides what shows
    const s = presetFolded(), nowOpen = s.has(g.name); if(nowOpen) s.delete(g.name); else s.add(g.name);
    try { localStorage.setItem(PRESET_FOLD_KEY, JSON.stringify([...s])); } catch(e){}
    filterPresets();
  });
  return hd;
}
const presetSearchText = () => { const f = $('presetSearch'); return f && f.value ? String(f.value).trim() : ''; };
function presetWords(p){
  const t = p.textureType, o = t && $('textureType') && Array.from($('textureType').options || []).find(o => o.value === t);
  const E = t && TEXTURE_ELEMENTS[t]; const readings = E ? Object.values(E).map(r => r && r.name || '').join(' ') : '';
  return [p.name, o ? o.textContent : '', readings, p.font || ''].join(' ');
}
export function filterPresets(){
  if(!presetGrid || !presetGrid.querySelectorAll) return;
  const q = presetSearchText(), shut = presetFolded(), byName = new Map(PRESETS.map(p => [p.name, p]));
  const shown = new Map();
  presetGrid.querySelectorAll('.preset-btn').forEach(b => {
    const g = b.dataset.group || '', p = byName.get(b.dataset.name);
    const hit = !q || chMatches(q, { text: b.dataset.name || '', value: '' }, g, p ? presetWords(p) : '');
    b.hidden = q ? !hit : shut.has(g);
    if(hit) shown.set(g, (shown.get(g) || 0) + 1);
  });
  presetGrid.querySelectorAll('.preset-group-head').forEach(h => {
    const g = h.dataset.group, n = shown.get(g) || 0;
    h.hidden = !!q && !n;
    h.setAttribute('aria-expanded', String(q ? true : !shut.has(g)));
  });
  const none = $('presetNone'); if(none) none.hidden = !q || shown.size > 0;
}
// (hover previews on desktop were retired, Ruby: some surfaces took seconds to try on. A tile is applied by a click.)
// a click applies the preset, as one step of history.
// Every click is a NEW SEED (Ruby); clicking the look that is still lit (nothing
// meaningful changed since) keeps it and only rerolls — and now and then takes
// another of its surface's readings (🜂 🜄 🜁 🜃)
export async function pickPreset(p){
  const again = litPreset.name === p.name && !litPresetChanged();
  if(!again && needsGuard() && !await guardWork('Apply this preset', `“${p.name}”`)) return;
  markFresh();
  if(again){ maybeRerollSeed(); if(Math.random() < 0.45) swapReading(); scheduleRender(); commitSoon(); }
  else applyPreset(p);
  lightPreset(p.name);
  murmur.play('preset');
}
// until a MEANINGFUL change (anything but the seed and the look's name) ----
// (the look settles over a moment — textures, tints that follow accents — so its
// signature is taken at the first history step after it lands: that step IS the look)
const litPreset = { name: null, sig: null };
function meaningfulSig(){ try { const o = JSON.parse(lookSnapshot()); delete o.textureSeedValue; delete o.lookName; return JSON.stringify(o); } catch(e){ return ''; } }
function litPresetChanged(){ return !!litPreset.name && litPreset.sig != null && meaningfulSig() !== litPreset.sig; }
function paintLitPreset(){ for(const g of [presetGrid, $('customPresetGrid')]) if(g && g.querySelectorAll) g.querySelectorAll('.preset-btn').forEach(b => b.classList.toggle('lit', !!litPreset.name && !!b.dataset && b.dataset.name === litPreset.name)); }
function lightPreset(name){ litPreset.name = name || null; litPreset.sig = null; paintLitPreset(); }
export function checkLitPreset(){
  if(!litPreset.name) return;
  if(litPreset.sig == null){ litPreset.sig = meaningfulSig(); return; }
  if(litPresetChanged()){ litPreset.name = null; litPreset.sig = null; paintLitPreset(); }
}
/** Another of the surface's readings, not the one showing (a click on a lit look, now and then). */
function swapReading(){
  const list = elementsFor($('textureType').value).filter(e => e.el !== state.ui.element);
  if(!list.length) return;
  applyElement(list[Math.floor(Math.random()*list.length)].el);
}
// THE PRESET LEVEL'S ACTIONS (ROADMAP H1), above the presets: more of the look on the page without opening a section.
// SUMMON VARIATION grows the same look again (what a click on a lit preset does): a new seed, now and then another
// reading; a frozen seed leaves only the reading to change. MUTATE GENTLY rolls every die at once, gently (menus,
// switches and locks stay). FREEZE THIS SEED is the seed's padlock, as an action.
export function summonVariation(){
  const lit = litPreset.name && !litPresetChanged() ? litPreset.name : null, frozen = state.locks.has('textureSeedValue');
  if(!$('textureToggle').checked){ toast(PRESET_ACTS.noSurface); murmur.play('blocked'); return; }
  const before = state.ui.element;
  if(frozen || Math.random() < 0.45) swapReading();
  if(frozen){ if(state.ui.element === before){ toast(PRESET_ACTS.frozenStill); murmur.play('blocked'); return; } toast(PRESET_ACTS.frozenReading); }
  else maybeRerollSeed();
  scheduleRender(); commitSoon(); murmur.play('reroll');
  if(lit) lightPreset(lit);                    // (still the look it was: it stays lit)
}
export function mutateGently(){
  if(typeof document.querySelectorAll !== 'function') return;
  for(const card of document.querySelectorAll('details.card[data-tab]:not([data-tab="more"])')) if(lockablesIn(card).length) rollSection(card, 'gentle');
  refreshUi(); scheduleRender(); commitSoon(); murmur.play('reroll');
}
export function freezeSeed(){
  const b = lockButtons.get('textureSeedValue');
  if(b) b.click(); else { state.locks.has('textureSeedValue') ? state.locks.delete('textureSeedValue') : state.locks.add('textureSeedValue'); paintMasterLocks(); }
  toast(state.locks.has('textureSeedValue') ? PRESET_ACTS.frozen : PRESET_ACTS.thawed);
}
// (its label says which it is: frozen, it reads as the way to thaw — the usability review)
export function paintFreeze(){ const b = $('freezeSeedBtn'), on = state.locks.has('textureSeedValue'); if(!b || !b.setAttribute) return;
  b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? PRESET_ACTS.thawLabel : PRESET_ACTS.freezeLabel; }
export function renderSavedPresets(saved){
  if(!customGrid) return;
  customGrid.innerHTML = '';
  const empty = $('customPresetsEmpty');
  if(empty) empty.style.display = (saved && saved.length) ? 'none' : '';
  // the last tile saves the look on the page as a new custom preset (Ruby: "omg yes")
  const addSave = () => { if(typeof document.createElement !== 'function') return;
    const t = document.createElement('div'); t.className = 'preset-btn preset-save'; t.setAttribute('role', 'button'); t.tabIndex = 0;
    t.title = 'Save the look on the page as a preset of your own';
    t.innerHTML = '<span class="preset-save-plus" aria-hidden="true">＋</span><span class="preset-label">Save this look</span>';
    const go = () => { if(typeof vault !== 'undefined' && vault.create) vault.create(); };
    t.addEventListener('click', go); t.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
    customGrid.appendChild(t); };
  if(!saved || !saved.length){ addSave(); return; }

  for(const rec of saved){
    const shot = Object.assign({ name: rec.name }, rec.settings, { spell: rec.spell });
    customGrid.appendChild(presetTile(shot, ()=>{
      // a spell is YOUR look: the first click puts it back exactly, seed and all;
      // a click while it is still lit rerolls the seed (and now and then the reading)
      if(litPreset.name === rec.name && !litPresetChanged()){ maybeRerollSeed(); if(Math.random() < 0.45) swapReading(); scheduleRender(); commitSoon(); lightPreset(rec.name); return; }
      // the same filter as applying from Esoterica — a spell is a look
      safeRestore(stripToLook(Object.assign({}, rec.settings, { spell: rec.spell })), 'This spell');
      if(document.body && document.body.dataset) document.body.dataset.lookName = rec.name || '';
      scheduleRender(); lightPreset(rec.name);
    }, 'preset-custom'));
  }
  addSave();
  paintLitPreset();
}
export function applyThemePalette(colors){
  state.ui.palette = colors;
  safeColoris({ swatches: pickerSwatches(colors[0]) });
}
export const rafOr = f => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(f) : setTimeout(f, 0));
export function pickerPointer(){
  let el = document.getElementById && document.getElementById('clrPointer');
  if(!el && document.createElement && document.body && document.body.appendChild){
    el = document.createElement('div');
    el.id = 'clrPointer';
    if(el.setAttribute) el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  return el;
}
export function markPicking(field, on){
  if(!field || !field.classList) return;
  field.classList.toggle('is-picking', on);
  const wrap = field.closest && field.closest('.clr-field');
  if(wrap && wrap.classList) wrap.classList.toggle('is-picking', on);
}
export function aimPointer(){
  const picker = document.getElementById && document.getElementById('clr-picker');
  const ptr = pickerPointer();
  if(!ptr) return;
  if(!picker || !state.ui.pickingField || !picker.getBoundingClientRect || !state.ui.pickingField.getBoundingClientRect){ ptr.hidden = true; return; }
  const f = state.ui.pickingField.getBoundingClientRect(), p = picker.getBoundingClientRect();
  const up = f.bottom <= p.top + 2, down = f.top >= p.bottom - 2;
  if(!p.width || (!up && !down)){ ptr.hidden = true; return; }       // beside it: nothing to point at
  const x = Math.max(p.left + 16, Math.min(p.right - 16, f.left + Math.min(f.width, 140) / 2));
  ptr.dataset.dir = up ? 'up' : 'down';
  ptr.style.left = x + 'px';
  ptr.style.top = (up ? p.top : p.bottom) + 'px';
  ptr.hidden = false;
}
// The swatches: EIGHTEEN, three even rows of six. First the field's own
// colour as the picker opens (ringed: tap it to get back to what you had),
// then the theme's fifteen, then white and black. (On phones the picker's
// position is set by CSS: docked above the keyboard at the bottom right.)
export function pickerSwatches(original){
  return [original || '#808080', ...state.ui.palette.slice(0, 15), '#FFFFFF', '#000000'];
}
export function applyPreset(p){
  // a FULL preset is a whole saved look (as a spell is saved), applied exactly
  if(p.full) return applyFullPreset(p);
  // a preset dresses the upper surface: the controls show it first, and the lower goes (unless something
  // of it is locked: then it waits, switched off, for its switch)
  if(state.layers.editing === 'lower') editLayer('upper');
  if(!state.locks.has('baseToggle') && !(state.layers.otherLocks || []).length){ state.layers.other = null; state.layers.otherLocks = []; state.layers.otherUi = null; }
  // a locked control is put back exactly as it was once the preset lands
  const __locks = snapshotLocked();
  try {
  applyThemePalette(deriveThemePalette(p));
  maybeRerollSeed();                 // every application a new seed (Ruby): a ritual is cast fresh each time
  setColorField('bgColor1Hex', p.bg1);
  $('bgGradientToggle').checked = !!p.bgGradient;
  $('bgGradientBlock').classList.toggle('open', !!p.bgGradient);
  if(p.bg2) setColorField('bgColor2Hex', p.bg2);
  if(p.bg3) setColorField('bgColor3Hex', p.bg3);
  if(p.bg4) setColorField('bgColor4Hex', p.bg4);
  state.page.bgStops = p.bg4 ? 4 : (p.bg3 ? 3 : 2);
  syncStopFields(state.page.bgStops, 'bgColor3Field', 'bgColor4Field');
  setActiveRadioValue('bgStopsGroup', state.page.bgStops);
  if(p.bgAngle!==undefined){ $('bgGradientAngle').value=p.bgAngle; $('bgGradientAngleVal').textContent=p.bgAngle+'°'; }

  setColorField('textColorHex', p.text1);
  $('textGradientToggle').checked = !!p.textGradient;
  $('gradientBlock').classList.toggle('open', !!p.textGradient);
  if(p.text2) setColorField('textColor2Hex', p.text2);
  if(p.text3) setColorField('textColor3Hex', p.text3);
  if(p.text4) setColorField('textColor4Hex', p.text4);
  state.page.textStops = p.text4 ? 4 : (p.text3 ? 3 : 2);
  syncStopFields(state.page.textStops, 'textColor3Field', 'textColor4Field');
  setActiveRadioValue('textStopsGroup', state.page.textStops);
  if(p.textAngle!==undefined){ $('textGradientAngle').value=p.textAngle; $('textGradientAngleVal').textContent=p.textAngle+'°'; }

  // effects: a preset's own slots, or its older outline/typeface fields translated
  if(p.fx1Type !== undefined) applyPersisted(Object.fromEntries(Object.keys(EFFECT_SLOT_DEFAULTS).map(k => [k, p[k] !== undefined ? p[k] : EFFECT_SLOT_DEFAULTS[k]])));
  else applyLegacyEffects(p);
  syncAllFxSlots();
  // the light's height: a preset's own, or raking (the only light presets knew)
  if($('textureLightTilt')){ $('textureLightTilt').value = p.textureLightTilt !== undefined ? p.textureLightTilt : '100'; syncLightPad(); }
  // and its direction: a preset's own, or where its texture's dial starts (Harsh Rain: straight down)
  // (a preset's own light, from before the handle became the light, turned half round where its surface's light turned)
  { const ld = p.textureLight !== undefined ? (lightTurned(p) ? halfRound(p.textureLight) : p.textureLight) : (capsFor(p.textureType || $('textureType').value) || {}).lightDeg;
    if(ld != null){ $('textureLight').value = String(ld); syncLightPad(); } }
  // and its camera: the preset's own, or where its texture's camera starts
  // (a Black Hole preset from before format 7 says its view with the light dial: onto the camera, as its looks are)
  { const d = cameraStart(p.textureType || $('textureType').value), bh = p.textureType === 'blackhole' && p.cameraTurn === undefined && p.textureLight !== undefined ? blackHoleCamera(p.textureLight, p.textureLightTilt) : {};
    putCamera(p.cameraTurn ?? bh.cameraTurn ?? d.turn, p.cameraView ?? bh.cameraView ?? d.view, p.cameraZoom ?? bh.cameraZoom ?? d.zoom);
    // (…and now the light dial places the hole: such a preset's hole stands at the page's middle)
    if(bh.cameraTurn !== undefined && $('textureLightTilt')){ $('textureLightTilt').value = '0'; syncLightPad(); } }

  if(p.font){
    const idx = FONTS.findIndex(f=>f.family===p.font);
    if(idx>=0) fontSelect.value = idx;
  }

  $('textureToggle').checked = !!p.texture;
  $('textureBlock').classList.toggle('open', !!p.texture);
  // the preset's own spell travels with it
  $('activeSpell').value = p.spell || '';
  $('borderGradientToggle').checked = !!p.borderGradient;
  if(p.borderColor2) setColorField('borderColor2Hex', p.borderColor2);
  if(p.borderColor3) setColorField('borderColor3Hex', p.borderColor3);
  $('borderBloom').value = p.borderBloom != null ? p.borderBloom : 0;
  if($('borderBloomVal')) $('borderBloomVal').textContent = $('borderBloom').value;
  if(p.textureType) $('textureType').value = p.textureType;
  // re-range for the new texture first, then apply the preset's own knobs;
  // a preset that names none simply gets that texture's defaults
  syncTextureParams(true);
  if(p.texP1 !== undefined) $('texP1').value = p.texP1;
  if(p.texP2 !== undefined) $('texP2').value = p.texP2;
  if(p.texP3 !== undefined) $('texP3').value = p.texP3;
  if(p.texP4 !== undefined) $('texP4').value = p.texP4;
  if(p.texP5 !== undefined) $('texP5').value = p.texP5;
  if(p.texP6 !== undefined) $('texP6').value = p.texP6;
  if(p.texP7 !== undefined) $('texP7').value = p.texP7;
  if(p.texP8 !== undefined) $('texP8').value = p.texP8;
  if(p.texP9 !== undefined) $('texP9').value = p.texP9;
  if(p.texP10 !== undefined) $('texP10').value = p.texP10;
  syncTextureParams(false);
  if(p.textureOpacity!==undefined){ $('textureOpacity').value=p.textureOpacity; paintMoons(); }

  if(p.accent1){ $('accent1Toggle').checked=true; $('accent1Block').classList.add('open'); setColorField('accent1ColorHex', p.accent1); }
  else { $('accent1Toggle').checked=false; $('accent1Block').classList.remove('open'); }
  if(p.accent2){ $('accent2Toggle').checked=true; $('accent2Block').classList.add('open'); setColorField('accent2ColorHex', p.accent2); }
  else { $('accent2Toggle').checked=false; $('accent2Block').classList.remove('open'); }

  $('borderToggle').checked = !!p.border;
  $('borderBlock').classList.toggle('open', !!p.border);
  if(p.borderColor) setColorField('borderColorHex', p.borderColor);
  if(p.borderThickness!==undefined) $('borderThickness').value = p.borderThickness;
  if(p.borderOffset!==undefined) $('borderOffset').value = p.borderOffset;

  $('vignetteToggle').checked = !!p.vignette;
  $('vignetteBlock').classList.toggle('open', !!p.vignette);
  if(p.vignetteBlend) $('vignetteBlend').value = p.vignetteBlend;
  if(p.vignetteIntensity!==undefined){ $('vignetteIntensity').value=p.vignetteIntensity; $('vignetteIntensityVal').textContent=p.vignetteIntensity+'%'; }

  scheduleRender();
  } finally {
    // Sync FIRST, restore locks LAST: syncTextureTools rebuilds the blend
    // select and re-clamps the texture params, overwriting anything restored
    // before it runs.
    //
    // true = start from the new texture's own defaults, so one preset's blend
    // and tints never leak into the next; then take whatever this preset
    // specifies on top.
    syncTextureTools(true);
    if(document.body && document.body.dataset) document.body.dataset.lookName = p.name || '';
    // the frame and box: defaults, then whatever this preset specifies
    applyPersisted({ ...FRAME_DEFAULTS, ...Object.fromEntries(Object.keys(FRAME_DEFAULTS).filter(k => p[k] !== undefined).map(k => [k, p[k]])) });
    syncLinkedBox();
    refreshReadouts(); syncFrameVisibility(); syncBaseUi();
    const pcaps = capsFor($('textureType').value);
    if(p.textureBlend && pcaps.blends.includes(p.textureBlend)) $('textureBlend').value = p.textureBlend;
    // a preset's own tint is a choice, like a hand-picked one: it stops
    // following the accents, so changing an accent later won't replace it
    if(p.textureTint1){ setColorField('textureTint1Hex', p.textureTint1); state.ui.tintFollows[0] = false; }
    if(p.textureTint2){ setColorField('textureTint2Hex', p.textureTint2); state.ui.tintFollows[1] = false; }
    [9, 10, 11, 12].forEach((n, i) => { if(p['textureTint' + n]){ setColorField('textureTint' + n + 'Hex', p['textureTint' + n]); state.ui.tintFollows[i + 2] = false; } });
    setColorField('textureTint3Hex', p.textureTint3 || '#FFFFFF');
    setColorField('textureTint4Hex', p.textureTint4 || '#FFFFFF');
    setColorField('textureTint5Hex', p.textureTint5 || hue5Default(p.textureType || $('textureType').value));
    setColorField('textureTint6Hex', p.textureTint6 || '#FFFFFF');
    // the page's lights: the preset's own, else none (a locked light keeps its rim and ambient too)
    if(!state.locks.has('textureLight')){ putRim(p.textureRim ?? RIM_DEFAULT.deg, p.textureRimTilt ?? RIM_DEFAULT.tilt); if($('textureAmbient')) $('textureAmbient').value = String(p.textureAmbient ?? 100);
      setColorField('textureTint7Hex', p.textureTint7 || RIM_DEFAULT.hex + '00'); setColorField('textureTint8Hex', p.textureTint8 || '#FFFFFF'); }
    syncLightPad();
    restoreLocked(__locks);
    // a preset changes opacity and seed without anyone touching them
    paintMoons();
    paintSeedMoon();
    // every view of every value made to match (Ruby: the surface's menu showed the surface before)
    refreshUi();
  }
}
/** A preset that is a whole look, made in the app and kept exactly: every
 *  setting it has is restored as a saved spell's would be — except the page
 *  size, which a preset never changes. Its own spell names it. */
function applyFullPreset(p){
  const __locks = snapshotLocked();
  try {
    applyThemePalette(deriveThemePalette(p));
    const s = { ...p }; for(const k of ['name', 'full', 'aspect', 'customSize', 'customW', 'customH']) delete s[k];
    restoreSettings(s);
    $('activeSpell').value = p.spell || '';
    if(document.body && document.body.dataset) document.body.dataset.lookName = p.name || '';
    maybeRerollSeed();                 // a built-in look is cast fresh each time, as the others are
    scheduleRender();
  } finally {
    restoreLocked(__locks);
    paintMoons(); paintSeedMoon(); refreshUi();
  }
}
