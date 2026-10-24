/**
 * uiHistory.js — undo and redo, and the history filmstrip
 *
 * Split from appEvents.js (its wiring, the listeners, stays there, in the order it runs).
 */
import { $ } from './appOptions.js';
import { PAGE_SAYS } from './strings.js';
import { paintPresetSwatch } from './swatches.js';
import { scheduleRender } from './canvasRenderer.js';
import { state } from './uiState.js';
import { stripToLook } from './vault.js';
import { FILM_MAX, filmCache, murmur, refreshUi } from './appEvents.js';
import { repaintEditor } from './uiControls.js';
import { checkLitPreset, restoreSettings, serializeCurrentSettings } from './uiLook.js';
import { toast } from './uiGuard.js';

// History is a stack of LOOK snapshots — the same filtered snapshot a saved
// spell uses, so it covers every setting but never the poem (the text box has
// its own undo), your locks, or your name. A change is recorded a moment after
// you stop adjusting, so one slider drag is one step, not one per pixel.
const HISTORY_MAX = 60;
export function lookSnapshot(){ return JSON.stringify(stripToLook(serializeCurrentSettings())); }
function paintHistoryButtons(){
  const h = state.history, p = state.poemHist || { index: 0, stack: [] }, poemLast = state.ui.lastEdit === 'poem';
  if($('undoBtn')) $('undoBtn').disabled = h.index <= 0 && !(poemLast && p.index > 0);
  if($('redoBtn')) $('redoBtn').disabled = h.index >= h.stack.length - 1 && !(poemLast && p.index < p.stack.length - 1);
  paintFilmstrip();
}
function filmFrameFor(snap){
  let c = filmCache.get(snap);
  if(!c){
    c = document.createElement('canvas');
    try { paintPresetSwatch(c, JSON.parse(snap), 144, 80); } catch(e){ /* a frame that can't paint stays blank */ }
    filmCache.set(snap, c);
    if(filmCache.size > 40) filmCache.delete(filmCache.keys().next().value);
  }
  return c;
}
function paintFilmstrip(){
  const fs = $('filmstrip'), wrap = fs && fs.parentElement;
  if(!fs || typeof document.createElement !== 'function' || !(wrap && wrap.classList && wrap.classList.contains('film-open'))) return;
  const h = state.history, from = Math.max(0, h.stack.length - FILM_MAX);
  fs.innerHTML = '';
  for(let i = from; i < h.stack.length; i++){
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'film-frame' + (i === h.index ? ' current' : '');
    b.title = i === h.index ? 'Now' : i < h.index ? (h.index - i) + ' back' : (i - h.index) + ' ahead';
    const src = filmFrameFor(h.stack[i]), c = document.createElement('canvas');
    c.width = src.width || 144; c.height = src.height || 80;
    try { c.getContext('2d').drawImage(src, 0, 0); } catch(e){}
    b.appendChild(c);
    b.addEventListener('click', () => stepHistory(i - state.history.index));
    fs.appendChild(b);
  }
  if(fs.scrollLeft !== undefined) fs.scrollLeft = 1e6;     // the newest in view
}
export function setFilmstrip(open){
  const wrap = $('filmstrip') && $('filmstrip').parentElement;
  if(!wrap || !wrap.classList) return;
  wrap.classList.toggle('film-open', !!open);
  try { localStorage.setItem('uv.filmstrip.v1', open ? '1' : '0'); } catch(e){}
  paintFilmstrip();
}
export function commitHistory(){
  const h = state.history;
  if(h.restoring) return;
  const snap = lookSnapshot();
  if(h.stack[h.index] === snap) return;                      // nothing actually changed
  h.stack = h.stack.slice(0, h.index + 1);                   // a new change drops the redo branch
  h.stack.push(snap);
  if(h.stack.length > HISTORY_MAX) h.stack.shift();
  h.index = h.stack.length - 1;
  state.ui.edits = (state.ui.edits || 0) + 1;
  state.ui.lastEdit = 'look';
  paintHistoryButtons();
  checkLitPreset();
}
// (held and put back whole: the Moving Image's Set it now changes the page to set a film's other look, then the page
//  and its history go back to how they were)
export function historyHold(){ const h = state.history; clearTimeout(h.timer); commitHistory(); return { stack: h.stack.slice(), index: h.index }; }
export function historyPutBack(kept){
  const h = state.history; clearTimeout(h.timer); h.stack = kept.stack; h.index = kept.index; h.restoring = true;
  try { if(h.stack[h.index]) restoreSettings(JSON.parse(h.stack[h.index])); } finally { h.restoring = false; }
  refreshUi(); scheduleRender(); paintHistoryButtons(); checkLitPreset(); }
export function commitSoon(){ clearTimeout(state.history.timer); state.history.timer = setTimeout(commitHistory, 450); }
function stepHistory(dir){
  const h = state.history, to = h.index + dir;
  if(to < 0 || to >= h.stack.length){ murmur.play('nothingToUndo'); return; }
  murmur.play(dir < 0 ? 'undo' : 'redo');
  clearTimeout(h.timer);
  h.index = to; h.restoring = true;
  try { restoreSettings(JSON.parse(h.stack[to])); } finally { h.restoring = false; }
  refreshUi(); scheduleRender(); paintHistoryButtons(); checkLitPreset();
}
// THE POEM'S OWN HISTORY (the usability review: on a phone nothing undid a cleared poem — Android's keyboards have no
// undo): the text kept a moment after typing stops (at once when much of it vanishes), and ↶ ↷ step it while the poem
// is what was last changed; once it is back at its start, ↶ goes on through the look's history
const POEM_MAX = 80;
export function poemHistoryNow(){ const h = state.poemHist || (state.poemHist = { stack: [], index: -1, timer: null, restoring: false }); return h; }
function notePoem(){
  const h = poemHistoryNow(), t = $('poemText') ? $('poemText').value : ''; if(h.restoring) return;
  clearTimeout(h.timer); if(h.stack[h.index] === t) return;
  h.stack = h.stack.slice(0, h.index + 1); h.stack.push(t); if(h.stack.length > POEM_MAX) h.stack.shift(); h.index = h.stack.length - 1;
  if(h.stack.length > 1) state.ui.lastEdit = 'poem';
  paintHistoryButtons();
}
export function notePoemSoon(){ const h = poemHistoryNow(), t = $('poemText') ? $('poemText').value : '', was = h.stack[h.index] || '';
  clearTimeout(h.timer);
  // (a big cut is kept at once, so one ↶ brings it all back)
  if(was.length > 40 && t.length < was.length*0.5){ notePoemFirst(was); notePoem(); toast(PAGE_SAYS.poemCut, { label: PAGE_SAYS.undo, act: () => stepPoem(-1) }); return; }
  h.timer = setTimeout(notePoem, 700); }
// (the text as it was before a change, if it was never kept: the first keystroke after a pause)
function notePoemFirst(t){ const h = poemHistoryNow(); if(h.stack[h.index] !== t){ h.stack = h.stack.slice(0, h.index + 1); h.stack.push(t); h.index = h.stack.length - 1; } }
function stepPoem(dir){
  const h = poemHistoryNow(); clearTimeout(h.timer); notePoem();
  const to = h.index + dir; if(to < 0 || to >= h.stack.length) return false;
  h.index = to; h.restoring = true;
  try { $('poemText').value = h.stack[to]; repaintEditor(); scheduleRender(); } finally { h.restoring = false; }
  murmur.play(dir < 0 ? 'undo' : 'redo'); paintHistoryButtons(); return true;
}
export function stepAny(dir){
  const p = poemHistoryNow();
  if(state.ui.lastEdit === 'poem' && ((dir < 0 && p.index > 0) || (dir > 0 && p.index < p.stack.length - 1))){ stepPoem(dir); return; }
  stepHistory(dir);
}
// KEYS (the ? sheet lists them): Ctrl+Z / Ctrl+Shift+Z (and Ctrl+Y), Ctrl+S,
// and single keys — none of them while typing in a field
export function showShortcuts(on){ const s = $('shortcutSheet'); if(s) s.hidden = !on; }
export const clickId = id => { const b = $(id); if(b && typeof b.click === 'function') b.click(); };
