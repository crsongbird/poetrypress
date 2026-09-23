/**
 * vault.js — Spellcrafting (saved looks) and Grimoire (saved poems).
 *
 *   What the jar keeps
 *   outlives the hand that filled it.
 *   Name it. Close the lid.
 *
 * Both live in localStorage, which is allowed to be absent or to throw
 * (private browsing, quota, a browser that simply says no). Every access
 * goes through readStore/writeStore so a failure degrades to "nothing is
 * saved" rather than taking the page down -- the same rule the Coloris
 * guard follows elsewhere in this app.
 *
 * TABLE OF CONTENTS
 *   Storage        readStore / writeStore / storageAvailable — all access
 *                  is wrapped; a rejected write is reported, never thrown.
 *   Validation     isValidSpell / isValidPoem — every record crossing the
 *                  boundary (import, and equally a re-read of our own data,
 *                  since a user can hand-edit localStorage) is checked
 *                  before it is trusted.
 *   Merge          mergeRecords — import is additive and refuses
 *                  duplicates, matching on name for spells and on
 *                  title+text for poems.
 *   Titles         poemTitleFrom — reuses the same first-heading/first-words
 *                  logic the image filename uses, so a saved poem is named
 *                  the way its download would be.
 *   Exports        createVault(deps) — everything above wired to the DOM.
 *                  Dependencies are injected rather than imported so this
 *                  file can be tested without a browser.
 */

import { generateSpell, validateSpell } from './spell.js';
import { DIALOGS, fill } from './strings.js';

export const SPELL_KEY = 'uv.spells.v1';
export const POEM_KEY  = 'uv.poems.v1';

export function storageAvailable(){
  try {
    if(typeof localStorage === 'undefined') return false;
    const probe = '__uv_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch(e){ return false; }
}

export function readStore(key){
  try {
    if(typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(key);
    if(!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch(e){
    // corrupt or hand-edited JSON: treat as empty rather than crashing the
    // panel, so the user can still export/overwrite their way out
    return [];
  }
}

export function writeStore(key, records){
  try {
    if(typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, JSON.stringify(records));
    return true;
  } catch(e){ return false; }
}

const isPlainObject = v => !!v && typeof v === 'object' && !Array.isArray(v);

export function isValidSpell(rec){
  if(!isPlainObject(rec)) return false;
  if(typeof rec.name !== 'string' || !rec.name.trim()) return false;
  if(!isPlainObject(rec.settings)) return false;
  // a record may arrive from an export file, or from a hand-edited
  // localStorage entry; a malformed glyph string is rejected rather than
  // rendered, since the renderer would fall back and show the wrong identity
  if(rec.spell !== undefined && !validateSpell(rec.spell).ok) return false;
  return true;
}

export function isValidPoem(rec){
  return isPlainObject(rec)
    && typeof rec.title === 'string' && rec.title.trim().length > 0
    && typeof rec.text === 'string' && rec.text.length > 0;
}

/**
 * Additive merge that refuses duplicates. Returns the merged list plus counts,
 * so the UI can tell the user what actually happened rather than silently
 * dropping records.
 */
export function mergeRecords(existing, incoming, keyOf, isValid){
  const seen = new Set(existing.map(keyOf));
  const merged = existing.slice();
  let added = 0, duplicates = 0, rejected = 0;
  for(const rec of (Array.isArray(incoming) ? incoming : [])){
    if(!isValid(rec)){ rejected++; continue; }
    const k = keyOf(rec);
    if(seen.has(k)){ duplicates++; continue; }
    seen.add(k);
    merged.push(rec);
    added++;
  }
  return { merged, added, duplicates, rejected };
}

export const spellKeyOf = r => String(r.name).trim().toLowerCase();
export const poemKeyOf  = r => String(r.title).trim().toLowerCase() + '\u0000' + r.text;

/** Same naming rule as the downloaded image: first heading, else first words. */
export function poemTitleFrom(text, fallback){
  const lines = String(text || '').split('\n').map(l => l.trim()).filter(Boolean);
  const heading = lines.find(l => l.startsWith('## '));
  let base = heading ? heading.slice(3) : (lines[0] || '');
  base = base.replace(/<[^>]*>/g, ' ')          // strip segment directives
             .replace(/[*_~\[\]{}#>]/g, ' ')    // strip inline markers
             .replace(/\s+/g, ' ')
             .trim();
  if(!base) return fallback || 'Untitled';
  const words = base.split(' ').slice(0, 7).join(' ');
  return words.length > 60 ? words.slice(0, 60).trim() : words;
}

export function stamp(date){
  const d = date || new Date();
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate())
       + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

/**
 * Wires the two panels. Every DOM touch and every app callback arrives via
 * `deps`, so the whole thing is exercisable without a browser.
 *
 * deps: { $, getSettings, applySettings, getText, setText, onChange, prompt }
 *   prompt({title, body, input, defaultValue, confirmLabel, danger}) -> Promise<string|true|null>
 */
/**
 * A spell is a LOOK. These are not part of one, so a spell never carries them
 * and applying one never touches them:
 *   poemText   the poem belongs in the Grimoire
 *   locks      which of YOUR controls you have pinned
 *   highlight  how you like the editor to behave
 *   username   who YOU are — a shared spell must not sign your page as theirs
 * The Workbench JSON is a full session save and keeps all of them. Same
 * reasoning as the theme, which lives outside settings entirely.
 */
export const NOT_PART_OF_A_LOOK = ['poemText', 'locks', 'highlight', 'username'];
export function stripToLook(settings){
  const out = { ...settings };
  for(const k of NOT_PART_OF_A_LOOK) delete out[k];
  return out;
}

export function createVault(deps){
  const { $, getSettings, applySettings, getText, setText, onChange, prompt } = deps;

  let spells = readStore(SPELL_KEY).filter(isValidSpell);
  let poems  = readStore(POEM_KEY).filter(isValidPoem);
  let selectedSpell = null;   // name
  let selectedPoem  = null;   // id
  let appliedSpellSnapshot = null;   // settings JSON at the moment of apply/create
  let appliedPoemText = null;

  const el = id => (typeof $ === 'function' ? $(id) : null);
  const settingsJson = () => JSON.stringify(getSettings());

  // "Create" only lights up once the current look actually diverges from
  // whatever was last applied -- saving an unchanged copy is never useful.
  function spellIsDirty(){
    if(appliedSpellSnapshot === null) return true;
    return settingsJson() !== appliedSpellSnapshot;
  }
  function poemIsDirty(){
    if(appliedPoemText === null) return String(getText() || '').trim().length > 0;
    return String(getText()) !== appliedPoemText;
  }

  function setDisabled(id, off){
    const node = el(id);
    if(node) node.disabled = !!off;
  }

  function renderSpells(){
    const wheel = el('spellWheel');
    if(wheel){
      wheel.innerHTML = '';
      for(const s of spells){
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'spell-chip' + (s.name === selectedSpell ? ' selected' : '');
        // the same snapshot the preset grid draws, if the host supplied a
        // painter; otherwise a plain gradient, so this file stays testable
        // without a canvas
        let sw;
        if(typeof deps.paintSwatch === 'function'){
          sw = document.createElement('canvas');
          sw.className = 'chip-swatch';
          const shot = Object.assign({}, s.settings, { spell: s.spell });
          try { deps.paintSwatch(sw, shot, 160, 56); } catch(e){ /* never fail the list */ }
        } else {
          sw = document.createElement('span');
          sw.className = 'chip-swatch';
          const bg = (s.settings && s.settings.bg1) || '#222';
          const bg2 = (s.settings && s.settings.bg2) || bg;
          sw.style.background = 'linear-gradient(135deg,' + bg + ',' + bg2 + ')';
        }
        const nm = document.createElement('span');
        nm.className = 'chip-name';
        nm.textContent = s.name;
        chip.appendChild(sw); chip.appendChild(nm);
        chip.addEventListener('click', ()=>{
          selectedSpell = (selectedSpell === s.name) ? null : s.name;
          renderSpells();
        });
        wheel.appendChild(chip);
      }
    }
    const empty = el('spellEmpty');
    if(empty) empty.style.display = spells.length ? 'none' : '';
    setDisabled('spellApplyBtn', !selectedSpell);
    setDisabled('spellDeleteBtn', !selectedSpell);
    setDisabled('spellCreateBtn', !spellIsDirty());
  }

  function renderPoems(){
    const list = el('grimoireList');
    if(list){
      list.innerHTML = '';
      for(const p of poems){
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.title + '  ·  ' + p.savedAt;
        if(p.id === selectedPoem) opt.selected = true;
        list.appendChild(opt);
      }
    }
    const empty = el('grimoireEmpty');
    if(empty) empty.style.display = poems.length ? 'none' : '';
    setDisabled('poemApplyBtn', !selectedPoem);
    setDisabled('poemDeleteBtn', !selectedPoem);
    setDisabled('poemSaveBtn', !poemIsDirty());
  }

  function refresh(){
    renderSpells();
    renderPoems();
    // the Aspects grid mirrors the saved spells, so it is told when they change
    if(typeof deps.onSpellsChanged === 'function') deps.onSpellsChanged(spells);
  }

  function persistSpells(){
    if(!writeStore(SPELL_KEY, spells)){
      prompt({ title:'Could not save', body:'This browser refused to write to local storage. Nothing was saved. Private browsing and full storage are the usual causes.', confirmLabel:'OK' });
      return false;
    }
    return true;
  }
  function persistPoems(){
    if(!writeStore(POEM_KEY, poems)){
      prompt({ title:'Could not save', body:'This browser refused to write to local storage. Nothing was saved.', confirmLabel:'OK' });
      return false;
    }
    return true;
  }

  // ---- spells ----
  async function createSpell(){
    const name = await prompt({
      title: DIALOGS.spellCreate.title,
      body: DIALOGS.spellCreate.body,
      input: true,
      defaultValue: 'Spell ' + (spells.length + 1),
      confirmLabel: DIALOGS.spellCreate.confirm, cancelLabel: DIALOGS.spellCreate.cancel,
    });
    if(!name) return;
    const clean = String(name).trim();
    if(!clean) return;
    const existing = spells.findIndex(s => spellKeyOf(s) === clean.toLowerCase());
    // The glyphs are generated ONCE, here, and stored. They identify this
    // record; deriving them later would let them change under the user.
    // An existing record keeps the glyphs it was created with.
    const prior = existing >= 0 ? spells[existing] : null;
    const glyphs = (prior && validateSpell(prior.spell || '').ok) ? prior.spell : generateSpell();
    const record = { name: clean, spell: glyphs, settings: getSettings(), savedAt: stamp() };
    if(existing >= 0){
      const ok = await prompt({
        title: DIALOGS.overwrite.title,
        body: fill(DIALOGS.overwrite.body, clean),
        confirmLabel: DIALOGS.overwrite.confirm,
      });
      if(!ok) return;
      spells[existing] = record;
    } else {
      spells.push(record);
    }
    if(!persistSpells()) return;
    selectedSpell = clean;
    appliedSpellSnapshot = settingsJson();
    refresh();
  }

  function applySpell(){
    const s = spells.find(x => x.name === selectedSpell);
    if(!s) return;
    // the spell's own glyphs travel with its look
    applySettings(s.spell ? { ...s.settings, spell: s.spell } : s.settings);
    appliedSpellSnapshot = settingsJson();
    refresh();
  }

  async function deleteSpell(){
    const s = spells.find(x => x.name === selectedSpell);
    if(!s) return;
    const ok = await prompt({
      title: DIALOGS.spellDelete.title,
      body: fill(DIALOGS.spellDelete.body, s.name),
      confirmLabel: DIALOGS.spellDelete.confirm, cancelLabel: DIALOGS.spellDelete.cancel, danger: true,
    });
    if(!ok) return;
    spells = spells.filter(x => x.name !== s.name);
    selectedSpell = null;
    persistSpells();
    refresh();
  }

  // ---- poems ----
  async function savePoem(){
    const text = String(getText() || '');
    if(!text.trim()) return;
    const title = poemTitleFrom(text, 'Untitled');
    const ok = await prompt({
      title: DIALOGS.poemSave.title,
      body: fill(DIALOGS.poemSave.body, title),
      confirmLabel: DIALOGS.poemSave.confirm, cancelLabel: DIALOGS.poemSave.cancel,
    });
    if(!ok) return;
    poems.push({ id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
                 title, text, savedAt: stamp() });
    if(!persistPoems()) return;
    appliedPoemText = text;
    refresh();
  }

  function applyPoem(){
    const p = poems.find(x => x.id === selectedPoem);
    if(!p) return;
    setText(p.text);
    appliedPoemText = p.text;
    if(typeof onChange === 'function') onChange();
    refresh();
  }

  async function deletePoem(){
    const p = poems.find(x => x.id === selectedPoem);
    if(!p) return;
    const ok = await prompt({
      title: DIALOGS.poemDelete.title,
      body: fill(DIALOGS.poemDelete.body, p.title),
      confirmLabel: DIALOGS.poemDelete.confirm, cancelLabel: DIALOGS.poemDelete.cancel, danger: true,
    });
    if(!ok) return;
    poems = poems.filter(x => x.id !== p.id);
    selectedPoem = null;
    persistPoems();
    refresh();
  }

  // ---- import / export ----
  async function exportJson(label, records){
    await prompt({
      title: fill(DIALOGS.exportList.title, label),
      body: DIALOGS.exportList.body,
      input: true,
      defaultValue: JSON.stringify(records, null, 2),
      confirmLabel: DIALOGS.exportList.confirm,
      rows: 8,
    });
  }

  async function importJson(label, isValid, keyOf, current, commit){
    const raw = await prompt({
      title: fill(DIALOGS.importList.title, label),
      body: DIALOGS.importList.body,
      input: true, defaultValue: '', confirmLabel: DIALOGS.importList.confirm, rows: 8,
    });
    if(!raw) return;
    let parsed;
    try { parsed = JSON.parse(String(raw)); }
    catch(e){
      await prompt({ title:'Could not read that', body:'That is not valid JSON, so nothing was imported.', confirmLabel:'OK' });
      return;
    }
    const result = mergeRecords(current, parsed, keyOf, isValid);
    commit(result.merged);
    await prompt({
      title: DIALOGS.importDone.title,
      body: fill(DIALOGS.importDone.body,
        result.added + ' added · ' + result.duplicates + ' already present · ' + result.rejected + ' skipped as malformed.'),
      confirmLabel: DIALOGS.importDone.confirm,
    });
    refresh();
  }

  function bind(id, fn){
    const node = el(id);
    if(node && node.addEventListener) node.addEventListener('click', fn);
  }

  bind('spellCreateBtn', createSpell);
  bind('spellApplyBtn', applySpell);
  bind('spellDeleteBtn', deleteSpell);
  bind('spellExportBtn', ()=>exportJson('spells', spells));
  bind('spellImportBtn', ()=>importJson('spells', isValidSpell, spellKeyOf, spells,
        merged => { spells = merged; persistSpells(); }));

  bind('poemSaveBtn', savePoem);
  bind('poemApplyBtn', applyPoem);
  bind('poemDeleteBtn', deletePoem);
  bind('poemExportBtn', ()=>exportJson('poems', poems));
  bind('poemImportBtn', ()=>importJson('poems', isValidPoem, poemKeyOf, poems,
        merged => { poems = merged; persistPoems(); }));

  const list = el('grimoireList');
  if(list && list.addEventListener){
    list.addEventListener('change', ()=>{ selectedPoem = list.value || null; renderPoems(); });
  }

  refresh();

  return {
    refresh,
    _state: () => ({ spells, poems, selectedSpell, selectedPoem }),
    _select: (kind, val) => {
      if(kind === 'spell') selectedSpell = val; else selectedPoem = val;
      refresh();
    },
  };
}
