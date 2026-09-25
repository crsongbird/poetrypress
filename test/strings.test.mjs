/**
 * strings.test.mjs — the string table.
 *
 * The point of strings.js is that editing a value there changes the app. The
 * tests that matter check the wiring, not the wording: every tagged element
 * must have a key, every key must be reachable, and a missing key must leave
 * the markup's own text alone rather than blanking the control.
 *
 * Run: node test/strings.test.mjs
 */
import { readFileSync } from 'fs';
import { UI_STRINGS, DIALOGS, THEME_NOTES, fill, applyStrings } from '../strings.js';
import * as TUNABLES from '../tunables.js';

let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ev = readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8');
const vault = readFileSync(new URL('../vault.js', import.meta.url), 'utf8');

const tagged = [...html.matchAll(/data-str="([^"]+)"/g)].map(m => m[1]);
check('the markup is tagged with string keys', tagged.length >= 35);
check('no key is used twice in the markup', new Set(tagged).size === tagged.length);

const missing = tagged.filter(k => UI_STRINGS[k] === undefined);
check('every tagged element has an entry in the table', missing.length === 0);
if(missing.length) console.log('   missing:', missing.join(', '));

const orphans = Object.keys(UI_STRINGS).filter(k => !tagged.includes(k));
check('every entry in the table is used', orphans.length === 0);
if(orphans.length) console.log('   orphans:', orphans.join(', '));

check('no entry is blank', Object.values(UI_STRINGS).every(v => typeof v === 'string' && v.trim()));
check('the table is applied at boot', /applyStrings\(document\)/.test(ev));

// dialogs
for(const key of ['spellCreate','spellDelete','poemSave','poemDelete']){
  const d = DIALOGS[key];
  check(`${key} has title, body and both buttons`,
    d && d.title && d.body && d.confirm && d.cancel);
}
check('the vault reads its text from the table',
  /DIALOGS\.spellCreate\.title/.test(vault) && !/title: '[A-Z]/.test(vault));
check('names are filled in, not concatenated',
  /fill\(DIALOGS\.poemDelete\.body/.test(vault));
check('fill replaces the placeholder', fill('Remove “{name}”.', 'X') === 'Remove “X”.');
check('fill survives a missing name', fill('a {name} b', null) === 'a  b');

check('every theme has a note', ['rose','aether','fathom','vellum'].every(t => THEME_NOTES[t]));

// a typo in the table must not blank the UI
const fake = {
  querySelectorAll: () => [
    { getAttribute: () => 'no.such.key',
      querySelector: () => null,
      set textContent(v){ throw new Error('should not have been written'); } },
  ],
};
let blew = null;
try { applyStrings(fake); } catch(e){ blew = e; }
check('an unknown key leaves the markup text alone', blew === null);

// ---- tunables ----
check('tunables are grouped, not a flat dump',
  ['PREVIEW','SWATCH','TEXTURES','EFFECTS','MARKS','SPELLS']
    .every(g => TUNABLES[g] && typeof TUNABLES[g] === 'object'));
check('the preview range is coherent',
  TUNABLES.PREVIEW.minFraction < TUNABLES.PREVIEW.defaultFraction &&
  TUNABLES.PREVIEW.defaultFraction < TUNABLES.PREVIEW.maxFraction);
check('the spell lengths are all prime', TUNABLES.SPELLS.primes.every(n => {
  for(let i = 2; i*i <= n; i++) if(n % i === 0) return false;
  return n > 1;
}));
check('the texture cache holds a useful number', TUNABLES.TEXTURES.cacheEntries >= 10);

// the whole point: these are read, not duplicated
for(const [file, sym] of [['appEvents.js','SWATCH.width'], ['canvasRenderer.js','EFFECTS.bloomPasses'],
                          ['textureGenerators.js','TEXTURES.cacheEntries'], ['spell.js','SPELLS.primes']]){
  const src = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
  check(`${file} reads ${sym} rather than a literal`, src.includes(sym));
}

// the default preset is named in tunables.js; it must resolve to a real one,
// since a stale name (it once pointed at a renamed preset) fails silently
const { PRESETS } = await import('../appOptions.js');
check('the default preset names a preset that exists',
  PRESETS.some(p => p.name === TUNABLES.DEFAULTS.preset));

// ---- child elements survive ----
// Labels hold the lock button and tab buttons hold an icon. Strings are
// applied AFTER the locks are installed, so replacing textContent would
// silently delete every lock in the app. The DOM mock does not model children,
// which is how this nearly shipped — so it is modelled here directly.
function el(children){
  const node = {
    childNodes: children, firstChild: children[0] || null,
    getAttribute: () => 'label.typeface',
    get textContent(){ return children.map(c => c.nodeValue || '').join(''); },
    set textContent(v){ children.length = 0; children.push({ nodeType: 3, nodeValue: v }); },
    insertBefore(n){ children.unshift(n); },
    ownerDocument: { createTextNode: v => ({ nodeType: 3, nodeValue: v }) },
  };
  return node;
}
const lock = { nodeType: 1, tag: 'button' };
const label = el([{ nodeType: 3, nodeValue: 'Old text' }, lock]);
applyStrings({ querySelectorAll: () => [label] });
check('the text is replaced', label.childNodes[0].nodeValue === UI_STRINGS['label.typeface']);
check('the lock button inside the label survives', label.childNodes.includes(lock));

const iconOnly = el([lock]);
applyStrings({ querySelectorAll: () => [iconOnly] });
check('an element with only a child element gains text without losing it',
  iconOnly.childNodes.includes(lock) && iconOnly.childNodes.some(c => c.nodeType === 3));

// ---- house style ----
// Every colour field in this app is a Hue; labels are Title Case; spelling
// is American; units stay lowercase. None of these is caught by a
// spellchecker, since both spellings of each are valid English.
const tg = readFileSync(new URL('../textureGenerators.js', import.meta.url), 'utf8');
const tints = [...tg.matchAll(/tintLabels:\[([^\]]*)\]/g)].flatMap(m => [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]));
check('every tint is named as a Hue', tints.length > 0 && tints.every(t => / Hue$/.test(t)));

const visible = [...Object.values(UI_STRINGS), ...tints,
  ...[...tg.matchAll(/label:'([^']+)'/g)].map(m => m[1])];
const british = visible.filter(v => /\b(colour|centre|grey|favour)/i.test(v));
check('user-facing text uses American spelling', british.length === 0);
if(british.length) console.log('   british:', british.join(' | '));

const lowerWord = /(^|\s)(?!of\b|and\b|a\b|the\b|to\b|in\b|or\b|by\b|for\b|vs\b)[a-z][a-z]+/;
const labelLike = Object.entries(UI_STRINGS).filter(([k]) => k.startsWith('label.'))
  .map(([, v]) => v).filter(v => !/[.?!]$/.test(v) && v.split(' ').length <= 5);
const sentenceCase = labelLike.filter(v => lowerWord.test(v.replace(/\([^)]*\)/g, '')));
check('short labels are Title Case', sentenceCase.length === 0);
if(sentenceCase.length) console.log('   not title case:', sentenceCase.slice(0, 6).join(' | '));

check('units stay lowercase', !visible.some(v => /\((Px|Deg|Ms)\)/.test(v)));
check('no HTML entity was capitalised', !visible.some(v => /&[A-Z][a-z]+;/.test(v)));
check('the first tab is spelled Inscription', UI_STRINGS['tab.inscription'] === 'Inscription');

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
