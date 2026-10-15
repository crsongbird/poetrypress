/**
 * persistence.test.mjs — the save/load audit, as a test.
 *
 * A feature that renders but does not survive save/load is worse than one
 * that was never added: it looks like it works. This walks the real controls
 * and checks each is both captured and restored, so a control added later
 * cannot quietly fall out of the settings JSON.
 *
 * Run: node test/persistence.test.mjs
 */
import { readFileSync } from 'fs';
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';

installCanvasMock();
const registry = installDomMock(makeMockContext, makeMockCanvas);
await import('../appEvents.js');

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };

const ev = readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8');
const serialize = (ev.match(/function serializeCurrentSettings\(\)\{[\s\S]*?\n\}/) || [''])[0];
// Mechanical controls are declared once in the PERSISTED table and spread into
// both the serializer and the restorer, so the table counts as both.
const persistedTable = (ev.match(/const PERSISTED = \[([\s\S]*?)\];/) || ['', ''])[1];
const tableIds = [...persistedTable.matchAll(/\['\w+',\s*'(\w+)'/g)].map(m => m[1]);
const tableKeys = [...persistedTable.matchAll(/\['(\w+)',/g)].map(m => m[1]);
const restore   = (ev.match(/function restoreSettings\(s\)\{[\s\S]*?\n\}/) || [''])[0];
const applyPre  = (ev.match(/function applyPreset\(p\)\{[\s\S]*?\n\}/) || [''])[0];

check('the serializer was found', serialize.length > 100);
check('the restorer was found', restore.length > 100);

// (that every control on the page is saved and restored is test/persistenceCoverage.test.mjs's concern;
// the round trip at the end shows the values really come back)

// the font is deliberately stored by name, not by index: an index silently
// points at a different typeface the moment the FONTS list changes
check('the font is captured by family name, not by index',
  /font: FONTS\[fontSelect\.value\]\.family/.test(serialize) &&
  /FONTS\.findIndex\(f=>f\.family===s\.font\)/.test(restore));

check('the highlighting preference is saved',
  /highlight:/.test(serialize) && /s\.highlight/.test(restore));
check('lock state is saved', /locks:/.test(serialize) && /s\.locks/.test(restore));

// a preset must carry the texture tools it implies, or applying one leaves
// the previous texture's blend and light behind
for(const key of ['textureType','texP1','texP2','spell'])
  check(`applying a preset carries "${key}"`, applyPre.includes(key));

// lock state must be reconstructible, not just readable
check('saved locks can be put back', /function restoreLockState/.test(ev));
check('lock buttons are tracked so their state can be shown', /lockButtons/.test(ev));

// TDZ guard: the serializer runs during boot, so anything it reads must be
// declared above it. This broke twice.
const lockDecl = ev.indexOf('const state = {');
const serPos = ev.indexOf('function serializeCurrentSettings');
check('the app state (locks included) is declared before the serializer that reads it',
  lockDecl !== -1 && lockDecl < serPos);

// page size, in both of its forms
check('the chosen aspect survives save/load',
  /aspect: state\.page\.aspect/.test(serialize) && /s\.aspect/.test(restore));
check('a custom resolution survives save/load',
  /customW:/.test(serialize) && /customH:/.test(serialize) &&
  /s\.customW/.test(restore) && /s\.customH/.test(restore));
check('the custom-resolution toggle is captured',
  /customSize:/.test(serialize) && /s\.customSize/.test(restore));
check('a custom size is clamped on the way back in', /clampSize\(s\.customW\)/.test(ev));

// the theme is deliberately NOT in the settings JSON: it should not travel
// with an exported spell or change when someone else's look is applied
// theme selection moved to theme.js in the refactor
const th = readFileSync(new URL('../theme.js', import.meta.url), 'utf8');
check('the theme is stored separately from page settings',
  /THEME_KEY = 'uv\.theme\.v1'/.test(th) && !/uiTheme/.test(serialize));
check('the theme survives a reload', /localStorage\.setItem\(THEME_KEY/.test(th) &&
  /localStorage\.getItem\(THEME_KEY\)/.test(th));
check('a browser with storage switched off still themes',
  /catch\(e\)\{ return DEFAULT_THEME; \/\* private mode \*\// .test(th));

// ---- the table is wired into both directions ----
check('the table is spread into the serializer', /\.\.\.collectPersisted\(\)/.test(serialize));
check('the table is applied by the restorer', /applyPersisted\(s\.cardLink === undefined \? \{ \.\.\.s, cardLink: true \} : s\)/.test(restore));
check('the table is declared above the serializer (it runs at boot)',
  ev.indexOf('const PERSISTED = [') < ev.indexOf('function serializeCurrentSettings'));
check('no key appears twice in the table', new Set(tableKeys).size === tableKeys.length);
const handWritten = [...serialize.matchAll(/^\s{4}(\w+):/gm)].map(m => m[1]);
check('no control is persisted both by hand and by the table',
  !tableKeys.some(k => handWritten.includes(k)));

// ---- a real round trip: save, load, save again ----
// Everything saved must come back. Colours are compared case-insensitively
// (the colour field uppercases), and values as strings (a browser input's
// value is always a string).
const norm = v => typeof v === 'string' && /^#[0-9a-f]{3,8}$/i.test(v) ? v.toLowerCase()
               : v == null ? v : String(v);
const vals = { borderGradientToggle:true, borderColor2Hex:'#112233', borderBloom:'73',
  vignetteCx:'12', fx1Type:'glow', fx1Angle:'212', fx1Color:'#abcdef',
  fx2K2:'33',
  // the surface's own controls (saved per layer, through surfaceFromDom and restoreSurfaceDetails)
  textureBlend:'screen', textureLight:'212', textureTint1Hex:'#345678', texP1:'41', texP2:'63' };
for(const [id, v] of Object.entries(vals)){
  if(typeof v === 'boolean') registry[id].checked = v; else registry[id].value = v;
}
registry['advancedRefreshBtn'].dispatchEvent({ type: 'click' });
const saved = JSON.parse(registry['advancedJson'].value);
for(const id of Object.keys(vals)){
  if(typeof vals[id] === 'boolean') registry[id].checked = false; else registry[id].value = '';
}
registry['advancedJson'].value = JSON.stringify(saved);
registry['advancedLoadBtn'].dispatchEvent({ type: 'click' });
registry['advancedRefreshBtn'].dispatchEvent({ type: 'click' });
const again = JSON.parse(registry['advancedJson'].value);
const lost = Object.keys(saved).filter(k =>
  !['customW','customH','textureSeed','textureSeedWords'].includes(k) && norm(saved[k]) !== norm(again[k]) &&
  JSON.stringify(saved[k]) !== JSON.stringify(again[k]));
check('everything saved comes back after a load', lost.length === 0);
if(lost.length) console.log('   lost:', lost.map(k => k + ' ' + JSON.stringify(saved[k]) + '->' + JSON.stringify(again[k])).join(', '));
check('the table fields specifically survive',
  saved.fx1Type === 'glow' && again.fx1Type === 'glow' && again.borderGradientToggle === true);
check('the surface\'s blend, light, hue and knobs survive',
  again.textureBlend === 'screen' && String(again.textureLight) === '212' && norm(again.textureTint1) === '#345678' && String(again.texP1) === '41' && String(again.texP2) === '63');

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
