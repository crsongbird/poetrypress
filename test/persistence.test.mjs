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
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
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

// Only real state: inputs and selects. Labels, value readouts, buttons and
// wrapper divs are not state and are excluded by element type, not by name.
const stateIds = [...html.matchAll(/<(input|select|textarea)\b[^>]*\bid="([\w-]+)"/g)]
  .filter(m => !/^modal/.test(m[2]))
  .map(m => m[2]);
check('found a realistic number of stateful controls', stateIds.length > 25);

const skip = new Set([
  'poemText',          // the poem is saved by the Grimoire, not by settings
  'highlightToggle',   // checked separately below
  'textureSeedLock',   // derived from the seed field
  'fontFamily',        // captured as `font` by family NAME, asserted below —
                       // storing the index would break whenever FONTS changes
  'grimoireList',      // a picker over saved records, not a setting
  'advancedJson',      // the settings pane itself; capturing it would nest
  'uiTheme',           // how YOU like the app to look, not part of a saved
                       // page — its own localStorage key, asserted below
]);
const uncaptured = stateIds.filter(id => !skip.has(id) && !serialize.includes(id) && !tableIds.includes(id));
check('every stateful control is captured by the serializer', uncaptured.length === 0);
if(uncaptured.length) console.log('   uncaptured:', uncaptured.join(', '));

const unrestored = stateIds.filter(id => !skip.has(id) && serialize.includes(id) && !restore.includes(id) && !tableIds.includes(id));
check('every captured control is restored again', unrestored.length === 0);
if(unrestored.length) console.log('   not restored:', unrestored.join(', '));

// features added after the serializer was first written — the usual suspects
for(const key of ['textureBlend','textureLight','textureTint1','textureTint2','texP1','texP2','spell'])
  check(`"${key}" survives save/load`, serialize.includes(key) && restore.includes(key));

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
const lockDecl = ev.indexOf('const locked = new Set()');
const serPos = ev.indexOf('function serializeCurrentSettings');
check('lock state is declared before the serializer that reads it',
  lockDecl !== -1 && lockDecl < serPos);

// page size, in both of its forms
check('the chosen aspect survives save/load',
  /aspect: currentAspect/.test(serialize) && /s\.aspect/.test(restore));
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
check('the table is applied by the restorer', /applyPersisted\(s\)/.test(restore));
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
  vignetteCx:'12', typeEffect:'bloom', typeEffectAngle:'212', typeEffectColorHex:'#abcdef',
  typeEffectGrain:'33' };
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
  !['customW','customH','textureSeed'].includes(k) && norm(saved[k]) !== norm(again[k]) &&
  JSON.stringify(saved[k]) !== JSON.stringify(again[k]));
check('everything saved comes back after a load', lost.length === 0);
if(lost.length) console.log('   lost:', lost.map(k => k + ' ' + JSON.stringify(saved[k]) + '->' + JSON.stringify(again[k])).join(', '));
check('the table fields specifically survive',
  saved.typeEffect === 'bloom' && again.typeEffect === 'bloom' && again.borderGradientToggle === true);

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
