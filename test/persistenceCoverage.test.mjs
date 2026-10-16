/**
 * persistenceCoverage.test.mjs — every control a person can fiddle with is
 * part of a look: saved, restored, and so carried by everything built on
 * those two functions (the Workbench JSON, the Grimoire and shared spells in
 * local storage, undo/redo).
 *
 * Ruby's standing rule: ANY new field, slider, colour or toggle must be
 * captured by the JSON report, save/load/share and local storage. This suite
 * finds every <input>, <select> and <textarea> on the page by itself, so a new
 * control that isn't saved fails here — unless it is in EXEMPT below, with
 * the reason it is not part of a look.
 *
 * (test/audit.test.mjs goes the other way: every saved key round-trips.)
 */
import { readFileSync } from 'fs';

let failures = 0;
const check = (name, ok) => { console.log((ok ? 'ok: ' : 'FAIL: ') + name); if(!ok) failures++; };
const src = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const html = src('index.html'), ev = src('appEvents.js'), vault = src('vault.js'), renderer = src('canvasRenderer.js');

// controls that are deliberately NOT part of a look — each with its reason
const EXEMPT = {
  uiTheme:      'the app\'s own theme: a preference saved on its own, not part of an image',
  forgeSteps:   'the Athanor\'s step previews on or off: a working preference of this browser (localStorage), not part of an image',
  soundToggle:  'interface sounds on or off (murmur.js): this browser\'s preference, kept in localStorage, not part of an image',
  soundVolume:  'interface sound volume: this browser\'s preference, kept in localStorage, not part of an image',
  fullPreview:  'a view preference (the preview at full size), not part of an image',
  advancedJson: 'the Workbench JSON box IS the saved look',
  modalInput:   'the text field of a dialog',
  lightDegIn:   'the dial\'s angle typed or read: a view of textureLight, which is saved and restored',
  lightTiltIn:  'the dial\'s reach typed or read: a view of textureLightTilt, which is saved and restored',
  presetSearch: 'a search over the preset grid: it filters what the grid shows, and is not part of an image',
  forgeOpenSelect: 'the Athanor\'s Open drawer: picking one opens that graph on the bench; the bench is kept by itself, not as a control',
  textureSeedWords: 'the seed shown as its phrase: a view of textureSeedValue, which is saved and restored (seedWords.js turns each into the other exactly)',
};

const ids = [...html.matchAll(/<(input|select|textarea)\b[^>]*\bid="([^"]+)"[^>]*>/g)].map(m => m[2]);
const bodyIn = (text, name) => { const a = text.search(new RegExp('function ' + name + '\\(')); const b = text.indexOf('\nfunction ', a + 10); return a < 0 ? '' : text.slice(a, b < 0 ? undefined : b); };
const body = name => bodyIn(ev, name);
const persisted = ev.slice(ev.indexOf('const PERSISTED = ['), ev.indexOf('];', ev.indexOf('const PERSISTED = [')));
const persistedIds = new Set([...persisted.matchAll(/\[\s*'[^']+',\s*'([^']+)'/g)].map(m => m[1]));
// a control may be reached through an alias: const fontSelect = $('fontFamily');
const aliases = {};
for(const m of ev.matchAll(/^const (\w+) = \$\('([\w-]+)'\);/gm)) (aliases[m[2]] ||= []).push(m[1]);
// the surface's own controls are read and written per layer (the upper's or the lower's): the save reads them
// through surfaceFromDom (canvasRenderer.js), the restore writes them through restoreSurface…() (and the page's
// shape through restoreShape, which a draft uses too)
const helpers = (text, prefix) => [...new Set([...text.matchAll(new RegExp(`\\b(${prefix}\\w*)\\(`, 'g'))].map(m => m[1]))];
const ser = body('serializeCurrentSettings') + helpers(body('serializeCurrentSettings'), 'surfaceFromDom').map(n => bodyIn(renderer, n)).join('\n');
const res = body('restoreSettings') + [...helpers(body('restoreSettings'), 'restoreSurface'), ...helpers(body('restoreSettings'), 'restoreShape')].map(body).join('\n');
const named = (text, id, quoted) => text.includes(quoted ? `'${id}'` : `$('${id}')`) || (aliases[id] || []).some(a => new RegExp(`\\b${a}\\b`).test(text));

check('the page has controls to check (the scan works)', ids.length > 80);
check('the save and restore functions were found', ser.length > 200 && res.length > 200 && persistedIds.size > 20);
const notSaved = [], notRestored = [];
for(const id of ids){
  if(EXEMPT[id]) continue;
  if(!(persistedIds.has(id) || named(ser, id, false) || named(ser, id, true))) notSaved.push(id);
  if(!(persistedIds.has(id) || named(res, id, true) || named(res, id, false))) notRestored.push(id);
}
check('every control on the page is SAVED with a look (or exempt, with a reason)', notSaved.length === 0);
if(notSaved.length) console.log('   not saved:', notSaved.join(', '), '— add it to PERSISTED in appEvents.js (or to EXEMPT here, with the reason)');
check('every control on the page is RESTORED from a look (or exempt, with a reason)', notRestored.length === 0);
if(notRestored.length) console.log('   not restored:', notRestored.join(', '));
check('no exemption names a control that no longer exists', Object.keys(EXEMPT).every(id => ids.includes(id)));
// the PERSISTED table: one row per key, and no control saved both by the table and by hand (it would be restored twice)
const tableKeys = [...persisted.matchAll(/\[\s*'(\w+)',/g)].map(m => m[1]);
const handWritten = [...body('serializeCurrentSettings').matchAll(/^\s{4}(\w+):/gm)].map(m => m[1]);
check('no key appears twice in the PERSISTED table', tableKeys.length > 20 && new Set(tableKeys).size === tableKeys.length);
check('no control is saved both by the table and by hand', !tableKeys.some(k => handWritten.includes(k)));

// everything built on save/restore uses them — so covering them covers all of it
check('the Workbench JSON shows serializeCurrentSettings() and loads with restoreSettings()',
  /\$\('advancedJson'\)\.value = JSON\.stringify\(serializeCurrentSettings\(\), null, 2\);/.test(ev) && /safeRestore\(obj, 'This JSON'\);/.test(ev) && /try \{ restoreSettings\(look\); \}/.test(ev));
check('the Grimoire and shared spells save serializeCurrentSettings() and restore with restoreSettings()',
  /return stripToLook\(serializeCurrentSettings\(\)\);/.test(ev) && /applySettings: \(settings, name\)=>\{ if\(!safeRestore\(stripToLook\(settings\), 'This spell'\)\) return;/.test(ev));
check('undo and redo step through restoreSettings()', /restoreSettings\(JSON\.parse\(h\.stack\[to\]\)\);/.test(ev));
// a spell carries the whole look: only the poem, locks, highlighting and credit stay behind
check('a spell drops only the poem, locks, highlighting and credit — nothing else',
  /export const NOT_PART_OF_A_LOOK = \['poemText', 'locks', 'highlight', 'username'\];/.test(vault));

console.log();
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
