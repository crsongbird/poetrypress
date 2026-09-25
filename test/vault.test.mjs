/**
 * vault.test.mjs — Spellcrafting and Grimoire.
 *
 * Covers the parts that would quietly lose someone's work: validation of
 * anything crossing the import boundary, refusal of duplicates, survival of
 * corrupt localStorage, and the dirty-state rules that decide whether the
 * Create/Save buttons are live.
 *
 * Run: node test/vault.test.mjs
 */
import { validateSpell } from '../spell.js';
import { formatPoemEntry, poemTime, encodeSpell, decodeSpell, readImport, SHARE_PREFIX } from '../vault.js';
import { PRESETS as SHARE_PRESETS } from '../appOptions.js';
import {
  SPELL_KEY, POEM_KEY, readStore, writeStore,
  isValidSpell, isValidPoem, mergeRecords, spellKeyOf, poemKeyOf,
  poemTitleFrom, createVault,
} from '../vault.js';

let failures = 0;
const check = (label, cond) => { cond ? console.log('ok:', label) : (failures++, console.log('FAIL:', label)); };

// ---- in-memory localStorage ----
const store = new Map();
let throwOnWrite = false;
global.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { if(throwOnWrite) throw new Error('quota'); store.set(k, String(v)); },
  removeItem: k => store.delete(k),
};


// ---- validation ----
check('a good spell validates', isValidSpell({ name:'Dusk', settings:{ bg1:'#000' } }));
check('a spell with no name is rejected', !isValidSpell({ name:'   ', settings:{} }));
check('a spell with no settings object is rejected', !isValidSpell({ name:'x', settings:'nope' }));
check('a non-object is rejected outright', !isValidSpell('hello') && !isValidSpell(null) && !isValidSpell([1,2]));
check('a good poem validates', isValidPoem({ title:'A', text:'words' }));
check('an empty poem is rejected', !isValidPoem({ title:'A', text:'' }));

// ---- corrupt storage must not throw ----
store.set(SPELL_KEY, '{ this is not json');
check('corrupt JSON reads as empty instead of throwing', Array.isArray(readStore(SPELL_KEY)) && readStore(SPELL_KEY).length === 0);
store.set(SPELL_KEY, '{"not":"an array"}');
check('a non-array payload reads as empty', readStore(SPELL_KEY).length === 0);
store.delete(SPELL_KEY);

// ---- merge: additive, dedupes, rejects junk ----
const existing = [{ name:'Dusk', settings:{} }];
const incoming = [
  { name:'Dusk', settings:{} },        // duplicate
  { name:'DUSK', settings:{} },        // duplicate, different case
  { name:'Dawn', settings:{} },        // new
  { name:'', settings:{} },            // malformed
  'garbage',                           // malformed
];
const res = mergeRecords(existing, incoming, spellKeyOf, isValidSpell);
check('merge adds only genuinely new records', res.added === 1);
check('merge counts duplicates, case-insensitively', res.duplicates === 2);
check('merge counts malformed records', res.rejected === 2);
check('merge never drops what was already there', res.merged.length === 2 && res.merged[0].name === 'Dusk');
check('merge survives a non-array payload', mergeRecords([], 'nope', spellKeyOf, isValidSpell).merged.length === 0);

// poems dedupe on title AND text, so two drafts sharing a title both survive
const pm = mergeRecords(
  [{ title:'Aether', text:'one', savedAt:'x' }],
  [{ title:'Aether', text:'one', savedAt:'y' }, { title:'Aether', text:'two', savedAt:'z' }],
  poemKeyOf, isValidPoem);
check('identical poems dedupe', pm.duplicates === 1);
check('same title with different text is kept', pm.added === 1);

// ---- titles ----
// parentheses are literal text in PML, not markup, so they stay -- only the
// accent brackets around them are stripped
check('a heading becomes the title', poemTitleFrom('## Wanting [(Aether)]\nbody') === 'Wanting (Aether)');
check('markup is stripped from titles',
  poemTitleFrom('## <big/scale:150> **loud**') === 'loud');
check('with no heading it falls back to the first words',
  poemTitleFrom('the quiet part of the evening arrives late').split(' ').length === 7);
check('an empty poem gets the fallback title', poemTitleFrom('', 'Untitled') === 'Untitled');

// ---- createVault: dirty-state and flows ----
function harness(){
  const nodes = {};
  const mk = () => ({
    disabled:false, hidden:false, innerHTML:'', textContent:'', value:'', rows:1,
    style:{ setProperty(){} }, children:[], className:'', dataset:{}, _attrs:{},
    setAttribute(k, v){ this._attrs[k] = String(v); },
    getAttribute(k){ return k in this._attrs ? this._attrs[k] : null; },
    querySelector(){ return null; },
    appendChild(c){ this.children.push(c); return c; },
    addEventListener(t,f){ (this._l = this._l||{})[t] = f; },
    _fire(t, evt){ this._l && this._l[t] && this._l[t](evt || { target: null }); },
  });
  const $ = id => (nodes[id] = nodes[id] || mk());
  global.document = { createElement: mk };
  let settings = { bg1:'#111' };
  let text = 'first words';
  const answers = [];
  const vault = createVault({
    $,
    getSettings: () => JSON.parse(JSON.stringify(settings)),
    applySettings: s => { settings = JSON.parse(JSON.stringify(s)); },
    getText: () => text,
    setText: t => { text = t; },
    onChange: () => {},
    prompt: () => Promise.resolve(answers.length ? answers.shift() : true),
  });
  return {
    vault, nodes, $, answers,
    setSettings: s => { settings = s; },
    setText: t => { text = t; },
    getText: () => text,
    getSettings: () => settings,
  };
}

store.clear();
let h = harness();
check('Apply and Delete start disabled with nothing selected',
  h.$('spellApplyBtn').disabled && h.$('spellDeleteBtn').disabled);
check('Create starts live when nothing has been applied yet',
  h.$('spellCreateBtn').disabled === false);

h.answers.push('Midnight');
await h.vault._state && h.$('spellCreateBtn')._fire('click');
await new Promise(r => setTimeout(r, 0));
check('creating a spell stores it', h.vault._state().spells.length === 1);
check('the saved spell keeps its name', h.vault._state().spells[0].name === 'Midnight');
check('Create goes hollow right after saving (nothing has changed since)',
  h.$('spellCreateBtn').disabled === true);

h.setSettings({ bg1:'#fff' });
h.vault.refresh();
check('Create wakes up again once the look diverges', h.$('spellCreateBtn').disabled === false);

h.vault._select('spell', 'Midnight');
check('selecting a spell enables Apply and Delete',
  !h.$('spellApplyBtn').disabled && !h.$('spellDeleteBtn').disabled);
h.$('spellApplyBtn')._fire('click');
check('applying restores the saved settings', h.getSettings().bg1 === '#111');
check('Create is hollow again immediately after Apply', h.$('spellCreateBtn').disabled === true);

// poems
check('Save is live when there is unsaved text', h.$('poemSaveBtn').disabled === false);
h.$('poemSaveBtn')._fire('click');
await new Promise(r => setTimeout(r, 0));
check('saving a poem stores it', h.vault._state().poems.length === 1);
check('Save goes hollow after saving', h.$('poemSaveBtn').disabled === true);
h.setText('something else entirely');
h.vault.refresh();
check('Save wakes up when the poem is edited', h.$('poemSaveBtn').disabled === false);

// persistence across a reload
const reloaded = harness();
check('spells survive a reload', reloaded.vault._state().spells.length === 1);
check('poems survive a reload', reloaded.vault._state().poems.length === 1);

// a refused write must not claim success
throwOnWrite = true;
check('a refused write reports failure rather than throwing', writeStore(SPELL_KEY, [{name:'x',settings:{}}]) === false);
throwOnWrite = false;

// ---- a saved spell keeps its glyphs ----
// The glyphs identify the record; regenerating them later would let a saved
// look change its identity under the user.
store.clear();
const h2 = harness();
h2.answers.push('Keeper');
h2.$('spellCreateBtn')._fire('click');
await new Promise(r => setTimeout(r, 0));
const firstGlyphs = h2.vault._state().spells[0].spell;
check('creating a spell stores glyphs with it', typeof firstGlyphs === 'string' && firstGlyphs.length > 0);
check('the stored glyphs are well-formed', validateSpell(firstGlyphs).ok);

// saving over the same name must not re-roll the identity
h2.setSettings({ bg1: '#abcdef' });
h2.vault.refresh();
h2.answers.push('Keeper', true);
h2.$('spellCreateBtn')._fire('click');
await new Promise(r => setTimeout(r, 0));
check('overwriting a spell keeps its original glyphs',
  h2.vault._state().spells[0].spell === firstGlyphs);

// an imported record carrying nonsense glyphs is refused outright
check('a record with malformed glyphs is rejected',
  isValidSpell({ name: 'x', settings: {}, spell: '[[🜁]]garbage' }) === false);
check('a record with no glyphs at all is still accepted',
  isValidSpell({ name: 'x', settings: {} }) === true);

// ---- Grimoire rows: the moon of the day, newest first ----
{
  store.clear();
  const h = harness();
  const vs = h.vault._state();
  // two poems recorded months apart, the older one saved in the old format
  vs.poems.push({ id: 'a', title: 'Older', text: 'x', savedAt: '2026-01-03 09:07' });
  vs.poems.push({ id: 'b', title: 'Newer', text: 'y', savedAt: '2026-09-24 21:05', savedTs: new Date(2026, 8, 24, 21, 5).getTime() });
  h.vault.refresh();
  const rows = h.$('grimoireList').children;
  check('the Grimoire draws one row per poem', rows.length === 2);
  check('newest first, by the real time recorded', rows[0].dataset.id === 'b' && rows[1].dataset.id === 'a');
  check('each row carries a moon glyph', rows.every(r => /class="moon-glyph/.test(r.innerHTML)));
  check('each row is titled with its phase', rows.every(r => /Moon|Crescent|Quarter|Gibbous/.test(r.title)));
  check('the entry reads Mon. D, YYYY, H:MM AM/PM: "Title"',
  formatPoemEntry({ title: 'Wanting', savedAt: '2026-09-24 22:21' }) === 'Sep. 24, 2026, 10:21 PM: \u201CWanting\u201D' &&
  formatPoemEntry({ title: 'Spring', savedAt: '2026-05-03 09:05' }) === 'May 3, 2026, 9:05 AM: \u201CSpring\u201D');
  check('an old-format entry still sorts by its written time', poemTime({ savedAt: '2026-01-03 09:07' }) === new Date(2026, 0, 3, 9, 7).getTime());
}

// ---- sharing one spell ----
{
  const rec = { name: 'Gateway ✦', spell: SHARE_PRESETS.find(p => p.name === 'Gateway').spell,
                settings: { bg1: '#111', textureType: 'summoning' }, savedAt: '2026-09-24 21:05' };
  const code = encodeSpell(rec);
  check('a share code is URL-safe', /^[A-Za-z0-9_-]+$/.test(code));
  check('a spell survives the trip, glyphs and all', JSON.stringify(decodeSpell(code)) === JSON.stringify(rec));
  check('a share link imports', readImport('https://poetrypress.unfixable.place/' + SHARE_PREFIX + code)[0].name === rec.name);
  check('a bare code imports', readImport(code)[0].name === rec.name);
  check('a single record imports, not only lists', readImport(JSON.stringify(rec)).length === 1);
  check('a list still imports', readImport(JSON.stringify([rec, rec])).length === 2);
  check('garbage is refused, not half-imported', readImport('hello there') === null);
  check('a truncated link is refused', decodeSpell(code.slice(0, -9)) === null);
  check('a shared spell must be a valid spell', decodeSpell(encodeSpell({ ...rec, spell: 'not glyphs' })) === null);
  const shared = JSON.parse(new TextDecoder().decode(Uint8Array.from(
    atob(code.replace(/-/g,'+').replace(/_/g,'/') + '==='.slice((code.length + 3) % 4)), c => c.charCodeAt(0))));
  check('only the one spell travels — no list, no ids', !Array.isArray(shared) && !('id' in shared));
}

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
