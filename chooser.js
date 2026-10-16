/**
 * chooser.js — a menu you can see: a <select> shown as tiles.
 *
 *   Sixty names in a column
 *   say less than one small picture
 *   of each, side by side.
 *
 * The <select> stays the truth (saves, presets, undo and the tests all read
 * and write it); the chooser only shows it. A button with the current tile
 * and name stands where the menu was; tapping it opens a panel: a search
 * field, then the menu's groups as folding sections of tiles. Choosing a
 * tile sets the <select> and sends it the same input and change a person's
 * own choice would. The panel is built afresh each time it opens, so
 * options added later (kept surfaces) are there.
 *
 * Thumbnails: the caller paints them (opts.thumb); each finished one is
 * kept as a small JPEG in this browser (CHOOSER_CACHE_KEY) with its STAMP
 * (opts.stamp: what it was painted from), so the tiles appear at once, every
 * visit and every release, and only a surface that changed is painted again.
 *
 * Folded groups are remembered per menu (localStorage), an app preference,
 * never part of a look.
 *
 * Names here are ch/CH: the bundle is one scope.
 */
import { CHOOSER } from './strings.js';

export const CHOOSER_CACHE_KEY = 'uv.thumbs.v2';
const CH_OLD_KEYS = ['uv.thumbs.v1'];         // kept per release: dropped, to give their space back
const CH_FOLD_KEY = id => 'uv.chooser.' + id + '.folded';

// ---- pure helpers (the tests use these) ----

/** The menu as groups of choices: [{ label, glyph, name, items: [{ value, text }] }], hidden options left out. */
export function chGroupsOf(select){
  const out = [];
  for(const g of Array.from(select.children || [])){
    if(String(g.tagName).toUpperCase() !== 'OPTGROUP') continue;
    const items = Array.from(g.children || []).filter(o => !o.hidden && String(o.tagName).toUpperCase() === 'OPTION')
      .map(o => ({ value: o.value, text: String(o.textContent || '').trim() }));
    if(!items.length) continue;
    const label = String(g.label || '').replace(/&amp;/g, '&'), m = label.match(/^(\S+)\s+(.*)$/);
    const glyphy = m && !/[A-Za-z]/.test(m[1]);
    out.push({ label, glyph: glyphy ? m[1] : '', name: glyphy ? m[2] : label, items });
  }
  return out;
}

/** Does a choice answer the search? Every word of the query must appear in its name, its group, or its extra words. */
export function chMatches(query, item, groupName, extra = ''){
  const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  if(!words.length) return true;
  const hay = (item.text + ' ' + groupName + ' ' + extra + ' ' + item.value).toLowerCase();
  return words.every(w => hay.includes(w));
}

/** The thumbnail cache: { map: { value: { s: stamp, url } } }. Anything unreadable starts empty. */
export function chCacheFor(raw){
  let c = null; try { c = JSON.parse(raw || 'null'); } catch(e){ c = null; }
  return (c && c.map && typeof c.map === 'object' && !Array.isArray(c.map)) ? { map: c.map } : { map: {} };
}
/** A kept thumbnail, only if it was painted from what the tile shows now (its stamp). */
export function chCached(cache, value, stamp){
  const e = cache.map[value];
  return e && typeof e === 'object' && e.s === stamp && /^data:image\//.test(e.url || '') ? e.url : null;
}

// ---- storage, quietly (a private window or a full store just means no memory) ----
const chStore = {
  get(k){ try { return typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null; } catch(e){ return null; } },
  set(k, v){ try { if(typeof localStorage !== 'undefined') localStorage.setItem(k, v); } catch(e){} },
};
let chCache = null;
function chThumbs(){
  if(!chCache){ chCache = chCacheFor(chStore.get(CHOOSER_CACHE_KEY)); try { for(const k of CH_OLD_KEYS) if(typeof localStorage !== 'undefined') localStorage.removeItem(k); } catch(e){} }
  return chCache;
}
let chSaveT = null;
function chKeep(value, url, stamp){
  const c = chThumbs(); c.map[value] = { s: stamp, url };
  clearTimeout(chSaveT); chSaveT = setTimeout(() => chStore.set(CHOOSER_CACHE_KEY, JSON.stringify(c)), 400);
}

/**
 * Shows a <select> as a chooser.
 *  opts.id       — a short name for this menu (folded groups are remembered under it)
 *  opts.title    — the panel's heading
 *  opts.thumb    — (value, canvas, done) paints a tile's thumbnail; call done() when it is final
 *                  (it may paint a placeholder first and call done later). Return false to leave a glyph.
 *  opts.extra    — (value) → more words a search may find it by (its readings, say)
 *  opts.stamp    — (value) → what its thumbnail is painted from, as a short string: a kept thumbnail
 *                  is shown only while its stamp is the same (a surface that changed is painted again)
 *  opts.size     — a thumbnail's pixels (default 160)
 *  opts.hold     — (value, tile) → true when it opened a menu of its own for that tile (a long press or right-click)
 *  opts.side     — on a phone, a sidebar from the left (the Athanor's Open) instead of a sheet from the bottom
 *  opts.wide     — on a desk, as wide as the window allows (up to 960) instead of 560
 * Returns { refresh(), open(), close() }.
 */
export function attachChooser(select, opts = {}){
  if(!select || typeof document === 'undefined' || typeof document.createElement !== 'function' || !select.parentNode) return { refresh(){}, open(){}, close(){} };
  const stampOf = v => { try { return String(opts.stamp ? opts.stamp(v) : ''); } catch(e){ return ''; } };
  const id = opts.id || select.id, SIZE = opts.size || 160;
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'ch-trigger'; btn.setAttribute('aria-haspopup', 'dialog');
  btn.innerHTML = '<span class="ch-trig-thumb"></span><span class="ch-trig-name"></span><span class="ch-trig-caret" aria-hidden="true">▾</span>';
  select.parentNode.insertBefore(btn, select.nextSibling);
  select.classList.add('ch-native');
  let panel = null, lastFocus = null;

  const textOf = v => { const o = Array.from(select.options || []).find(o => o.value === v); return o ? String(o.textContent || '').trim() : v; };
  const thumbInto = (holder, value) => {
    holder.textContent = '';
    const stamp = stampOf(value), url = chCached(chThumbs(), value, stamp);
    if(url){ const im = document.createElement('img'); im.alt = ''; im.src = url; im.decoding = 'async'; holder.appendChild(im); return; }
    const cv = document.createElement('canvas'); cv.width = cv.height = SIZE; holder.appendChild(cv);
    let ok = false;
    try { ok = opts.thumb ? opts.thumb(value, cv, () => { try { chKeep(value, cv.toDataURL('image/jpeg', 0.82), stamp); } catch(e){} }) !== false : false; } catch(e){ ok = false; }
    if(!ok){ holder.textContent = ''; holder.classList.add('ch-glyph'); holder.textContent = opts.glyphFor ? opts.glyphFor(value) : '◈'; }
  };

  function refresh(){
    const v = select.value;
    btn.querySelector('.ch-trig-name').textContent = textOf(v);
    btn.setAttribute('aria-label', (opts.title || '') + ': ' + textOf(v) + '. ' + CHOOSER.open);
    const t = btn.querySelector('.ch-trig-thumb'); t.classList.remove('ch-glyph'); thumbInto(t, v);
    if(panel) panel.querySelectorAll('.ch-tile').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.value === v)));
  }

  const folded = () => { try { return new Set(JSON.parse(chStore.get(CH_FOLD_KEY(id)) || '[]')); } catch(e){ return new Set(); } };
  const saveFolded = s => chStore.set(CH_FOLD_KEY(id), JSON.stringify([...s]));

  function choose(value){
    if(select.value !== value){
      select.value = value;
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    close(); refresh();
  }

  function build(){
    const groups = chGroupsOf(select), shut = folded();
    panel = document.createElement('div');
    panel.className = 'ch-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', opts.title || '');
    panel.innerHTML = `<div class="ch-head"><input type="search" class="ch-search" placeholder="${CHOOSER.search}" aria-label="${CHOOSER.search}" autocomplete="off" spellcheck="false"><button type="button" class="ch-close" aria-label="${CHOOSER.close}">✕</button></div><div class="ch-body"></div><p class="ch-none" hidden>${CHOOSER.none}</p>`;
    const body = panel.querySelector('.ch-body'), search = panel.querySelector('.ch-search');
    const sections = [];
    for(const g of groups){
      const sec = document.createElement('details'); sec.className = 'ch-group'; sec.open = !shut.has(g.name);
      const sum = document.createElement('summary');
      sum.innerHTML = `<span class="ch-g-glyph"></span><span class="ch-g-name"></span><span class="ch-g-count"></span>`;
      sum.querySelector('.ch-g-glyph').textContent = g.glyph; sum.querySelector('.ch-g-name').textContent = g.name;
      sum.querySelector('.ch-g-count').textContent = g.items.length;
      sec.appendChild(sum);
      const grid = document.createElement('div'); grid.className = 'ch-grid'; sec.appendChild(grid);
      const tiles = [];
      for(const it of g.items){
        const b = document.createElement('button'); b.type = 'button'; b.className = 'ch-tile'; b.dataset.value = it.value;
        b.setAttribute('aria-pressed', String(it.value === select.value));
        b.innerHTML = '<span class="ch-thumb"></span><span class="ch-name"></span>';
        b.querySelector('.ch-name').textContent = it.text;
        // a long press (or right-click) asks opts.hold for the tile's own menu (a kept surface: share its wiring…)
        let held = false, timer = 0;
        if(opts.hold){
          b.addEventListener('pointerdown', () => { held = false; clearTimeout(timer); timer = setTimeout(() => { if(opts.hold(it.value, b)) held = true; }, 500); });
          for(const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => clearTimeout(timer));
          b.addEventListener('contextmenu', e => { if(held){ e.preventDefault(); return; } if(opts.hold(it.value, b)){ e.preventDefault(); held = true; } });
        }
        b.addEventListener('click', () => { if(held){ held = false; return; } choose(it.value); });
        grid.appendChild(b); tiles.push([b, it]);
      }
      // a folded group's tiles are painted when it is first opened
      let painted = false;
      const paint = () => { if(painted) return; painted = true; for(const [b, it] of tiles) thumbInto(b.querySelector('.ch-thumb'), it.value); };
      if(sec.open) paint();
      sec.addEventListener('toggle', () => {
        if(sec.open) paint();
        if(search.value) return;                       // a search opens groups for itself: not the person's folding
        const s = folded(); if(sec.open) s.delete(g.name); else s.add(g.name); saveFolded(s);
      });
      body.appendChild(sec); sections.push({ sec, tiles, g, paint, wasOpen: sec.open });
    }
    search.addEventListener('input', () => {
      const q = search.value; let any = false;
      for(const S of sections){
        let n = 0;
        for(const [b, it] of S.tiles){ const hit = chMatches(q, it, S.g.name, opts.extra ? opts.extra(it.value) : ''); b.hidden = !hit; if(hit) n++; }
        S.sec.hidden = n === 0; any = any || n > 0;
        if(q){ if(n && !S.sec.open){ S.sec.open = true; } }
        else S.sec.open = !folded().has(S.g.name);
        S.sec.querySelector('.ch-g-count').textContent = q ? n + ' / ' + S.tiles.length : S.tiles.length;
        if(S.sec.open) S.paint();
      }
      panel.querySelector('.ch-none').hidden = any;
    });
    search.addEventListener('keydown', e => {
      if(e.key === 'Enter'){ const first = panel.querySelector('.ch-tile:not([hidden])'); if(first){ e.preventDefault(); first.click(); } }
      if(e.key === 'ArrowDown'){ const first = panel.querySelector('.ch-group[open] .ch-tile:not([hidden])'); if(first){ e.preventDefault(); first.focus(); } }
    });
    panel.addEventListener('keydown', e => {
      if(e.key === 'Escape'){ e.preventDefault(); close(); return; }
      if(!e.target.classList || !e.target.classList.contains('ch-tile') || !/^Arrow/.test(e.key)) return;
      // arrows move between the tiles in reading order; up and down by a row
      const all = Array.from(panel.querySelectorAll('.ch-group[open] .ch-tile:not([hidden])')), i = all.indexOf(e.target);
      if(i < 0) return;
      const top = e.target.offsetTop, cols = Math.max(1, all.filter(t => t.parentNode === e.target.parentNode && t.offsetTop === top).length);
      const j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'ArrowDown' ? i + cols : i - cols;
      if(j < 0 && e.key === 'ArrowUp'){ e.preventDefault(); search.focus(); return; }
      if(all[Math.max(0, Math.min(all.length - 1, j))]){ e.preventDefault(); all[Math.max(0, Math.min(all.length - 1, j))].focus(); }
    });
    panel.querySelector('.ch-close').addEventListener('click', close);
    return panel;
  }

  const outside = e => { if(panel && !panel.contains(e.target) && !btn.contains(e.target)) close(); };
  function place(){
    if(!panel) return;
    if(document.body.classList.contains('is-mobile')){ panel.classList.add(opts.side ? 'ch-side' : 'ch-sheet'); panel.style.left = panel.style.top = panel.style.width = ''; return; }
    panel.classList.remove('ch-sheet', 'ch-side');
    const r = btn.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
    const w = Math.min(opts.wide ? 960 : 560, vw - 24), left = Math.max(12, Math.min(r.left, vw - w - 12));
    const below = vh - r.bottom - 12, above = r.top - 12, up = below < 480 && above > below;
    panel.style.width = w + 'px'; panel.style.left = left + 'px';
    panel.style.maxHeight = Math.max(240, Math.min(vh * 0.72, up ? above : below)) + 'px';
    panel.style.top = up ? '' : (r.bottom + 6) + 'px'; panel.style.bottom = up ? (vh - r.top + 6) + 'px' : '';
  }
  function open(){
    if(panel) return close();
    lastFocus = document.activeElement;
    document.body.appendChild(build()); place();
    btn.setAttribute('aria-expanded', 'true');
    const cur = panel.querySelector('.ch-tile[aria-pressed="true"]');
    if(cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'center' });
    // the search field first on a desktop; on a phone the keyboard would cover the tiles, so the current tile
    if(document.body.classList.contains('is-mobile')){ if(cur) cur.focus({ preventScroll: true }); }
    else panel.querySelector('.ch-search').focus({ preventScroll: true });
    setTimeout(() => { document.addEventListener('pointerdown', outside, true); window.addEventListener('resize', place); }, 0);
  }
  function close(){
    if(!panel) return;
    panel.remove(); panel = null;
    btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', outside, true); window.removeEventListener('resize', place);
    if(lastFocus === btn || !lastFocus || !document.contains(lastFocus)) btn.focus({ preventScroll: true });
  }
  btn.addEventListener('click', open);
  select.addEventListener('change', refresh);
  refresh();
  return { refresh, open, close, button: btn };
}
