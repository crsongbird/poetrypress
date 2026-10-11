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
const html = src('index.html'), ev = src('appEvents.js'), vault = src('vault.js');

// controls that are deliberately NOT part of a look — each with its reason
const EXEMPT = {
  uiTheme:      'the app\'s own theme: a preference saved on its own, not part of an image',
  soundToggle:  'interface sounds on or off (murmur.js): this browser\'s preference, kept in localStorage, not part of an image',
  soundVolume:  'interface sound volume: this browser\'s preference, kept in localStorage, not part of an image',
  fullPreview:  'a view preference (the preview at full size), not part of an image',
  advancedJson: 'the Workbench JSON box IS the saved look',
  modalInput:   'the text field of a dialog',
  forgeStarter: 'a one-shot menu in the Athanor: it loads a starter INTO the graph (forgeGraph, saved) and returns to "Start from…"',
  textureSeedWords: 'the seed shown as its phrase: a view of textureSeedValue, which is saved and restored (seedWords.js turns each into the other exactly)',
};

const ids = [...html.matchAll(/<(input|select|textarea)\b[^>]*\bid="([^"]+)"[^>]*>/g)].map(m => m[2]);
const body = name => { const a = ev.indexOf('function ' + name + '('); const b = ev.indexOf('\nfunction ', a + 10); return a < 0 ? '' : ev.slice(a, b < 0 ? undefined : b); };
const persisted = ev.slice(ev.indexOf('const PERSISTED = ['), ev.indexOf('];', ev.indexOf('const PERSISTED = [')));
const persistedIds = new Set([...persisted.matchAll(/\[\s*'[^']+',\s*'([^']+)'/g)].map(m => m[1]));
// a control may be reached through an alias: const fontSelect = $('fontFamily');
const aliases = {};
for(const m of ev.matchAll(/^const (\w+) = \$\('([\w-]+)'\);/gm)) (aliases[m[2]] ||= []).push(m[1]);
const ser = body('serializeCurrentSettings'), res = body('restoreSettings');
const named = (text, id, quoted) => text.includes(quoted ? `'${id}'` : `$('${id}')`) || (aliases[id] || []).some(a => new RegExp(`\\b${a}\\b`).test(text));

check('the page has controls to check (the scan works)', ids.length > 80);
check('the save and restore functions were found', ser.length > 200 && res.length > 200 && persistedIds.size > 20);
const notSaved = [], notRestored = [];
for(const id of ids){
  if(EXEMPT[id]) continue;
  if(!(persistedIds.has(id) || named(ser, id, false))) notSaved.push(id);
  if(!(persistedIds.has(id) || named(res, id, true) || named(res, id, false))) notRestored.push(id);
}
check('every control on the page is SAVED with a look (or exempt, with a reason)', notSaved.length === 0);
if(notSaved.length) console.log('   not saved:', notSaved.join(', '), '— add it to PERSISTED in appEvents.js (or to EXEMPT here, with the reason)');
check('every control on the page is RESTORED from a look (or exempt, with a reason)', notRestored.length === 0);
if(notRestored.length) console.log('   not restored:', notRestored.join(', '));
check('no exemption names a control that no longer exists', Object.keys(EXEMPT).every(id => ids.includes(id)));

// everything built on save/restore uses them — so covering them covers all of it
check('the Workbench JSON shows serializeCurrentSettings() and loads with restoreSettings()',
  /\$\('advancedJson'\)\.value = JSON\.stringify\(serializeCurrentSettings\(\), null, 2\);/.test(ev) && /restoreSettings\(obj\);/.test(ev));
check('the Grimoire and shared spells save serializeCurrentSettings() and restore with restoreSettings()',
  /return stripToLook\(serializeCurrentSettings\(\)\);/.test(ev) && /applySettings: \(settings, name\)=>\{ restoreSettings\(stripToLook\(settings\)\);/.test(ev));
check('undo and redo step through restoreSettings()', /restoreSettings\(JSON\.parse\(h\.stack\[to\]\)\);/.test(ev));
// a spell carries the whole look: only the poem, locks, highlighting and credit stay behind
check('a spell drops only the poem, locks, highlighting and credit — nothing else',
  /export const NOT_PART_OF_A_LOOK = \['poemText', 'locks', 'highlight', 'username'\];/.test(vault));

console.log();
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
