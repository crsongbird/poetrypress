/**
 * editor.js — syntax highlighting for PML.
 *
 *   The glass over the
 *   page shows the bones of it.
 *   Same words. Lit throughout.
 *
 * APPROACH: a highlighted <pre> mirror sits directly behind a transparent
 * <textarea>. The textarea keeps every native behaviour that matters on a
 * phone — caret, selection, autocorrect, the system keyboard, undo — while
 * the mirror underneath carries the colour. Nothing is reimplemented.
 *
 * The one hard requirement: the mirror must wrap EXACTLY as the textarea
 * does, or the colour drifts away from the text. Both therefore share font,
 * size, line-height, padding, width and wrapping rules, enforced in CSS
 * rather than trusted (see .editor-input / .editor-mirror, which set the
 * same values in one shared block).
 *
 * Colour follows the elements:
 *   Sharpness — structure: the segmentation operator's < >, with each
 *               bracket family given its own hue so [ ] { } and ( ) are
 *               told apart at a glance; parentheses are literal text in
 *               PML, so they sit back rather than forward
 *   Touch     — directives inside a segment, where the advanced work happens
 *   Chaos     — the disruptive marks: emphasis, rhyme tags, escapes
 *   Whimsy    — accent and gradient wraps, which are about colour anyway
 */

import { directiveHint } from './textParsers.js';
import { PML_HINTS } from './strings.js';
import { PML_VAR_NAMES } from './pmlVars.js';

const ESC = { '&':'&amp;', '<':'&lt;', '>':'&gt;' };
const escapeHtml = t => String(t).replace(/[&<>]/g, c => ESC[c]);
// a §Variable: its name, then an optional !param or :number (see pmlVars.js)
const VAR_RE = /^[§$]([A-Za-z]+)(![A-Za-z0-9_-]+|:-?\d*\.?\d+)?/;
const varSpan = m => span('var', m[0][0] + m[1]) + (m[2] ? span('varp', m[2]) : '');
// (a $ is a variable only before one's name, as pmlVars reads it: "$5" is money)
const varAt = (src, i) => { const m = src.slice(i).match(VAR_RE); return m && (src[i] === '§' || PML_VAR_NAMES.has(m[1]) || m[1].toLowerCase() === 'style') ? m : null; };

const span = (cls, text) => `<span class="pml-${cls}">${escapeHtml(text)}</span>`;

// Bracket spans know their absolute position in the document, so the pair
// under the caret can be marked. The mark is a class only — see .pml-match in
// the stylesheet, which is restricted to properties that cannot move text.
let BRACKET_MARKS = null;          // Set of absolute indices to mark, or null
const bspan = (cls, ch, at) =>
  `<span class="pml-${cls}${BRACKET_MARKS && BRACKET_MARKS.has(at) ? ' pml-match' : ''}">${escapeHtml(ch)}</span>`;

// UNKNOWN DIRECTIVES (Ruby approved): a directive PML can't read is underlined, and the editor's hint line says why
// (textParsers.directiveHint). Gathered while a document is highlighted: { at, end, line, text } in the document.
let HINTS = null, STYLES = null, FONT_CHECK = null, LINE_NO = 0;
const STYLE_DEF = /^(\s*)(§style)(\s+)([A-Za-z][\w-]*)(\s*=\s*)(.*)$/i;
const fmt = (key, v) => String(PML_HINTS[key] || '').replace(/\{(\w+)\}/g, (m, k) => v[k] == null ? '' : v[k]);
function hintFor(body){
  const h = directiveHint(body, STYLES);
  if(!h){
    // a typeface asked for by a name the page doesn't have
    const f = body.match(/^font:(.+)$/i);
    if(f && FONT_CHECK && !FONT_CHECK(f[1].trim())) return fmt('font', { d: body });
    return null;
  }
  if(h.kind === 'style') return fmt('style', { d: body, name: h.name });
  if(h.kind === 'value') return h.like ? fmt('valueLike', { d: body, name: h.name, like: h.like }) : fmt('value', { d: body, name: h.name });
  return h.like ? fmt('unknownLike', { d: body, like: h.like }) : fmt('unknown', { d: body });
}

/** Colours the directive run inside a segment: <content/f:4/scale:150>. `base`: where the run starts in the document. */
function highlightDirectives(run, base){
  base = base || 0;
  // split on the slashes that separate directives, keeping them
  return run.replace(/\/([^/]*)/g, (_, body, at) => {
    const m = body.match(/^([a-zA-Z#@]+)(:?)([\s\S]*)$/);
    if(!m) return span('op', '/') + escapeHtml(body);
    const [, name, colon, value] = m;
    const inner = span('directive', name) + (colon ? span('op', colon) : '') + (value ? span('value', value) : '');
    const hint = hintFor(body);
    if(!hint) return span('op', '/') + inner;
    if(HINTS) HINTS.push({ at: base + at, end: base + at + 1 + body.length, line: LINE_NO, text: hint });
    return span('op', '/') + `<span class="pml-unknown">${inner}</span>`;
  });
}

/**
 * Turns one line of PML into HTML. Pure — no DOM, no state — which is what
 * makes it testable without a browser.
 */
export function highlightLine(line, base){
  base = base || 0;
  let out = '';
  let i = 0;
  const src = String(line);

  // a named style's definition (pmlVars.js): §style name = /directives — not drawn, its directives checked
  const def = src.match(STYLE_DEF);
  if(def){
    const v = def[6], at = base + src.length - v.length;
    // (written without its first slash, the value is read as if it had one)
    const dirs = !v ? '' : v[0] === '/' ? highlightDirectives(v, at) : highlightDirectives('/' + v, at - 1).replace(/^<span class="pml-op">\/<\/span>/, '');
    return escapeHtml(def[1]) + span('var', def[2]) + escapeHtml(def[3]) + span('varp', def[4]) + span('op', def[5]) + dirs;
  }

  // line prefixes, which only count at the very start
  const prefix = src.match(/^(##|-#|#D|#S|>)\s/);
  if(prefix){
    out += span('prefix', prefix[0]);
    i = prefix[0].length;
  }

  while(i < src.length){
    const ch = src[i];

    // an escape covers the character after it, whatever that character is
    if(ch === '\\' && i + 1 < src.length){
      out += span('escape', src.slice(i, i + 2));
      i += 2;
      continue;
    }
    if(ch === '`'){ out += span('tick', ch); i++; continue; }
    if(ch === '§' || ch === '$'){
      const m = varAt(src, i);
      if(m){ out += varSpan(m); i += m[0].length; continue; }
    }

    // "<3" is always a heart (Ruby), never a segment's opener
    if(ch === '<' && src[i + 1] === '3'){ out += escapeHtml('<3'); i += 2; continue; }
    // segmentation operator: brackets are structure, the inside is directives
    if(ch === '<'){
      const close = src.indexOf('>', i);
      if(close !== -1){
        const inner = src.slice(i + 1, close);
        const cut = inner.search(/(?<!\\)\//);
        out += bspan('bracket', '<', base + i);
        if(cut === -1){
          out += highlightInline(inner, base + i + 1);
        } else {
          out += highlightInline(inner.slice(0, cut), base + i + 1);
          out += highlightDirectives(inner.slice(cut), base + i + 1 + cut);
        }
        out += bspan('bracket', '>', base + close);
        i = close + 1;
        continue;
      }
    }

    // rhyme tag, only meaningful at the end of a line
    const rhyme = src.slice(i).match(/^~([A-Da-d])(?=\s*(?:\/[lcr])?\s*$)/i);
    if(rhyme){
      out += span('rhyme', rhyme[0]);
      i += rhyme[0].length;
      continue;
    }

    // whole-line justification suffix
    const just = src.slice(i).match(/^\/(l|c|r|left|center|right)\s*$/i);
    if(just){
      out += span('op', just[0]);
      i += just[0].length;
      continue;
    }

    if(ch === '[' || ch === ']'){ out += bspan('sq', ch, base + i); i++; continue; }
    if(ch === '{' || ch === '}'){ out += bspan('cu', ch, base + i); i++; continue; }
    if(ch === '(' || ch === ')'){ out += bspan('paren', ch, base + i); i++; continue; }

    const emph = src.slice(i).match(/^(\*\*|~~|\*|_)/);
    if(emph){ out += span('emph', emph[0]); i += emph[0].length; continue; }

    out += escapeHtml(ch);
    i++;
  }
  return out;
}

/** Inline-only pass, used for the text part inside a segment. */
function highlightInline(text, base){
  base = base || 0;
  let out = '', i = 0;
  while(i < text.length){
    const ch = text[i];
    if(ch === '\\' && i + 1 < text.length){ out += span('escape', text.slice(i, i+2)); i += 2; continue; }
    if(ch === '§' || ch === '$'){ const m = varAt(text, i); if(m){ out += varSpan(m); i += m[0].length; continue; } }
    if(ch === '[' || ch === ']'){ out += bspan('sq', ch, base + i); i++; continue; }
    if(ch === '{' || ch === '}'){ out += bspan('cu', ch, base + i); i++; continue; }
    if(ch === '(' || ch === ')'){ out += bspan('paren', ch, base + i); i++; continue; }
    const emph = text.slice(i).match(/^(\*\*|~~|\*|_)/);
    if(emph){ out += span('emph', emph[0]); i += emph[0].length; continue; }
    out += escapeHtml(ch);
    i++;
  }
  return out;
}


/**
 * Full document to mirror HTML.
 *
 * ONE CONTINUOUS FLOW. Not one element per line.
 *
 * A block element's height is laid out and rounded to device pixels on its
 * own, so a mirror built from one <div> per line accumulates a fraction of a
 * pixel of rounding per line. The textarea lays its whole text out as a
 * single flow and rounds once. Over a page that difference grows into whole
 * lines — vertical drift that increases with distance and looks random,
 * which is exactly what it was.
 *
 * So the mirror now emits plain text with real newlines, wrapped only in
 * INLINE spans for colour, and relies on `white-space: pre-wrap` to break
 * lines the same way the textarea does. Line starts are marked with
 * zero-width inline anchors, which the gutter measures without introducing
 * any block box of their own.
 */
export function highlightDocument(text, marks, hints){   // test hook: the whole mirror as one string (the editor itself patches it line by line, highlightLines)
  return highlightLines(text, marks, hints).join('\n') + '\u200b';
}
/** The same, a line at a time: each line's markup (its anchor and its coloured text), for the mirror to patch only
 *  the lines that changed. */
export function highlightLines(text, marks, hints){
  BRACKET_MARKS = marks && marks.size ? marks : null;
  const lines = String(text).split('\n');
  // the styles the poem names (§style name = …), so their uses are known
  STYLES = new Set(); for(const line of lines){ const m = line.match(STYLE_DEF); if(m) STYLES.add(m[4].toLowerCase()); }
  HINTS = hints || [];
  let base = 0;
  const html = lines.map((line, i) => {
    LINE_NO = i + 1;
    const out = `<span class="ln-mark" data-n="${i + 1}"></span>` + highlightLine(line, base);
    base += line.length + 1;          // + the newline
    return out;
  });
  BRACKET_MARKS = null; HINTS = null;
  return html;
}

/** The hint line's words: the directive the caret is in, else the first one PML can't read (with its line). */
export function hintText(hints, caret){
  if(!hints || !hints.length) return '';
  const here = caret != null ? hints.find(h => caret >= h.at && caret <= h.end) : null;
  return here ? here.text : hints[0].text + fmt('where', { n: hints[0].line, more: hints.length > 1 ? fmt('more', { n: hints.length - 1 }) : '' });
}

const OPEN = { '(': ')', '[': ']', '{': '}', '<': '>' };
const CLOSE = { ')': '(', ']': '[', '}': '{', '>': '<' };

/**
 * The bracket touching the caret and its partner, as absolute indices, or
 * null. Looks at the character just before the caret first, then just after,
 * which is how most editors behave. Escaped brackets are not brackets: PML
 * prints them literally, so they are skipped both as a start and while
 * counting depth.
 */
export function findBracketPair(text, caret){
  const t = String(text);
  // escaped only by an ODD run of backslashes: in \\[ the backslash is itself
  // escaped, and the bracket after it is real
  const escaped = at => { let n = 0; for(let j = at - 1; j >= 0 && t[j] === '\\'; j--) n++; return n % 2 === 1; };
  for(const at of [caret - 1, caret]){
    if(at < 0 || at >= t.length) continue;
    const ch = t[at];
    if(!(ch in OPEN) && !(ch in CLOSE)) continue;
    if(escaped(at)) continue;
    const forward = ch in OPEN;
    const self = ch, other = forward ? OPEN[ch] : CLOSE[ch];
    let depth = 0;
    for(let j = at; forward ? j < t.length : j >= 0; j += forward ? 1 : -1){
      if(escaped(j)) continue;
      if(t[j] === self) depth++;
      else if(t[j] === other && --depth === 0) return [at, j];
    }
    return null;                       // unmatched: nothing to show
  }
  return null;
}

/**
 * Wires mirror, gutter and textarea together.
 * deps: { textarea, mirror, gutter, onInput }
 */
export function installEditor({ textarea, mirror, gutter, hint, knownFont, onInput }){
  if(!textarea || !mirror) return null;
  if(knownFont) FONT_CHECK = knownFont;

  function currentMarks(){
    if(typeof textarea.selectionStart !== 'number') return null;
    if(textarea.selectionStart !== textarea.selectionEnd) return null;  // not while selecting
    const pair = findBracketPair(textarea.value, textarea.selectionStart);
    return pair ? new Set(pair) : null;
  }

  // PAINT, at most once a frame and only when something changed (PERFORMANCE-AUDIT.md, typing): an input and the
  // keyup after it used to paint twice per key, each laying the whole page out again. The mirror is redrawn in the
  // frame before the screen shows it, so the coloured text never lags the caret.
  let shown = { v: null, a: -1, b: -1, w: -1 }, queued = false;
  function paint(force){
    const v = textarea.value, a = textarea.selectionStart, b = textarea.selectionEnd, w = textarea.clientWidth || 0;
    if(force !== true && v === shown.v && a === shown.a && b === shown.b && w === shown.w) return;
    shown = { v, a, b, w };
    const hints = [];
    patchMirror(highlightLines(v, currentMarks(), hints));
    if(hint){ const t = hintText(hints, typeof a === 'number' ? a : null);
      if(hint.textContent !== t) hint.textContent = t; hint.hidden = !t; }
    // (every reading first, then every writing: one layout per key, not one per measure)
    const g = gutter ? gutterHtml() : null;
    fitHeight();
    if(g !== null && g !== lastGutter){ lastGutter = g; gutter.innerHTML = g; }
  }
  // each line in its own inline span (no box, so nothing about the flow changes): a key changes one line, and only
  // that line's markup is replaced, so the browser restyles one line, not the poem
  let lineHtml = [], lineEls = [];
  function patchMirror(lines){
    if(lines.length === lineHtml.length && lineEls.length === lines.length && lineEls.every(e => e.parentNode === mirror)){
      for(let i = 0; i < lines.length; i++) if(lines[i] !== lineHtml[i]) lineEls[i].innerHTML = lines[i];
    } else {
      mirror.innerHTML = lines.map(l => `<span class="ln">${l}</span>`).join('\n') + '\u200b';
      lineEls = mirror.children ? Array.from(mirror.children).filter(e => e.className === 'ln') : [];
    }
    lineHtml = lines;
  }
  const paintSoon = () => { if(queued) return; queued = true;
    (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : f => setTimeout(f, 0))(() => { queued = false; paint(); }); };

  // The gutter cannot simply count lines: a wrapped line occupies several
  // rows. Each logical line's start carries a zero-width inline anchor, so
  // its top can be measured directly out of the same continuous flow the
  // text is in — no block boxes, nothing that could round differently.
  let lastGutter = null;
  function gutterHtml(){
    const marks = mirror.querySelectorAll ? mirror.querySelectorAll('.ln-mark') : [];
    const total = mirror.scrollHeight || 0;
    let html = '';
    const rowH = marks.length && typeof getComputedStyle === 'function' ? parseFloat(getComputedStyle(mirror).lineHeight) || 0 : 0;
    for(let i = 0; i < marks.length; i++){
      const top = marks[i].offsetTop;
      const next = (i + 1 < marks.length) ? marks[i + 1].offsetTop : total;
      const h = Math.max(0, next - top);
      const wrapped = rowH && h > rowH * 1.5;
      html += `<div class="gutter-line"${h ? ` style="height:${h}px"` : ''}>`
            + `<span class="gutter-n">${i + 1}</span>`
            + (wrapped ? '<span class="gutter-wrap">⤶</span>' : '')
            + '</div>';
    }
    return html;
  }

  function fitHeight(){
    // measured against the mirror, not the textarea's own scrollHeight: the
    // mirror is an ordinary block whose height IS its content, with no
    // min-height, rows attribute or scroll state to confuse the reading.
    // ONE LINE OF SLACK below the last (Ruby: "sometimes it is impossible to
    // scroll to the bottom", in a long poem): a textarea a pixel short of its
    // text scrolls ITSELF to show the caret (some browsers measure it short),
    // and overflow:hidden then hides its last line where nothing outside can
    // reach it. With room to spare it never has to.
    // (Its height is not first reset to 'auto' to be measured: that collapsed the box and laid the whole page out
    // twice on every key. The mirror's height is the text's; the textarea's own counts only when its text has
    // overflowed it, which the reset used to find.)
    const lh = (typeof getComputedStyle === 'function' && parseFloat(getComputedStyle(textarea).lineHeight)) || 21;
    const over = (textarea.scrollHeight || 0) > (textarea.clientHeight || 0) + 1 ? textarea.scrollHeight - lh : 0;
    const h = Math.max(mirror.scrollHeight || 0, over);
    if(h){ const want = Math.ceil(h + lh) + 'px'; if(textarea.style.height !== want) textarea.style.height = want; }
    if(textarea.scrollTop) textarea.scrollTop = 0;
  }

  if(textarea.addEventListener){
    textarea.addEventListener('input', ()=>{ paintSoon(); if(onInput) onInput(); });
    // the textarea itself never scrolls (its box holds all its text; the box round it scrolls): if a browser scrolls
    // it anyway to show the caret, its text slips under the mirror and its last lines out of reach, so it is put back
    textarea.addEventListener('scroll', ()=>{ if(textarea.scrollTop){ textarea.scrollTop = 0; fitHeight(); } });
    // the caret can move without any input: taps, arrow keys, selection
    for(const evt of ['click', 'keyup', 'select']) textarea.addEventListener(evt, paintSoon);
  }
  if(typeof window !== 'undefined' && window.addEventListener){
    window.addEventListener('resize', () => { shown.w = -1; paintSoon(); });
  }
  // NO ResizeObserver here. paint() sets the textarea's height, which resizes
  // the very element an observer would be watching, which calls paint()
  // again — "ResizeObserver loop completed with undelivered notifications",
  // and a height left in whatever state the loop bailed out in. Callers
  // repaint explicitly instead (see repaintEditor in appEvents.js).
  paint(true);
  // (callers that repaint on purpose, a font or a poem loaded, always repaint)
  return { paint: () => paint(true), fitHeight };
}
