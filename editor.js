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

const ESC = { '&':'&amp;', '<':'&lt;', '>':'&gt;' };
const escapeHtml = t => String(t).replace(/[&<>]/g, c => ESC[c]);
const span = (cls, text) => `<span class="pml-${cls}">${escapeHtml(text)}</span>`;

// Bracket spans know their absolute position in the document, so the pair
// under the caret can be marked. The mark is a class only — see .pml-match in
// the stylesheet, which is restricted to properties that cannot move text.
let BRACKET_MARKS = null;          // Set of absolute indices to mark, or null
const bspan = (cls, ch, at) =>
  `<span class="pml-${cls}${BRACKET_MARKS && BRACKET_MARKS.has(at) ? ' pml-match' : ''}">${escapeHtml(ch)}</span>`;

/** Colours the directive run inside a segment: <content/f:4/scale:150>. */
function highlightDirectives(run){
  // split on the slashes that separate directives, keeping them
  return run.replace(/\/([^/]*)/g, (_, body) => {
    const m = body.match(/^([a-zA-Z#]+)(:?)([\s\S]*)$/);
    if(!m) return span('op', '/') + escapeHtml(body);
    const [, name, colon, value] = m;
    return span('op', '/') + span('directive', name)
         + (colon ? span('op', colon) : '')
         + (value ? span('value', value) : '');
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
          out += highlightDirectives(inner.slice(cut));
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
export function highlightDocument(text, marks){
  BRACKET_MARKS = marks && marks.size ? marks : null;
  const lines = String(text).split('\n');
  let base = 0;
  const html = lines.map((line, i) => {
    const out = `<span class="ln-mark" data-n="${i + 1}"></span>` + highlightLine(line, base);
    base += line.length + 1;          // + the newline
    return out;
  }).join('\n') + '\u200b';
  BRACKET_MARKS = null;
  return html;
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
export function installEditor({ textarea, mirror, gutter, onInput }){
  if(!textarea || !mirror) return null;

  function currentMarks(){
    if(typeof textarea.selectionStart !== 'number') return null;
    if(textarea.selectionStart !== textarea.selectionEnd) return null;  // not while selecting
    const pair = findBracketPair(textarea.value, textarea.selectionStart);
    return pair ? new Set(pair) : null;
  }

  function paint(){
    mirror.innerHTML = highlightDocument(textarea.value, currentMarks());
    fitHeight();
    if(gutter) paintGutter();
  }

  // The gutter cannot simply count lines: a wrapped line occupies several
  // rows. Each logical line's start carries a zero-width inline anchor, so
  // its top can be measured directly out of the same continuous flow the
  // text is in — no block boxes, nothing that could round differently.
  function paintGutter(){
    const marks = mirror.querySelectorAll ? mirror.querySelectorAll('.ln-mark') : [];
    const total = mirror.scrollHeight || 0;
    let html = '';
    for(let i = 0; i < marks.length; i++){
      const top = marks[i].offsetTop;
      const next = (i + 1 < marks.length) ? marks[i + 1].offsetTop : total;
      const h = Math.max(0, next - top);
      const rowH = parseFloat(getComputedStyle(mirror).lineHeight) || 0;
      const wrapped = rowH && h > rowH * 1.5;
      html += `<div class="gutter-line"${h ? ` style="height:${h}px"` : ''}>`
            + `<span class="gutter-n">${i + 1}</span>`
            + (wrapped ? '<span class="gutter-wrap">⤶</span>' : '')
            + '</div>';
    }
    gutter.innerHTML = html;
  }

  function fitHeight(){
    // measured against the mirror, not the textarea's own scrollHeight: the
    // mirror is an ordinary block whose height IS its content, with no
    // min-height, rows attribute or scroll state to confuse the reading
    textarea.style.height = 'auto';
    const h = Math.max(mirror.scrollHeight || 0, textarea.scrollHeight || 0);
    if(h) textarea.style.height = h + 'px';
  }

  if(textarea.addEventListener){
    textarea.addEventListener('input', ()=>{ paint(); if(onInput) onInput(); });
    // the caret can move without any input: taps, arrow keys, selection
    for(const evt of ['click', 'keyup', 'select']) textarea.addEventListener(evt, paint);
  }
  if(typeof window !== 'undefined' && window.addEventListener){
    window.addEventListener('resize', paint);
  }
  // NO ResizeObserver here. paint() sets the textarea's height, which resizes
  // the very element an observer would be watching, which calls paint()
  // again — "ResizeObserver loop completed with undelivered notifications",
  // and a height left in whatever state the loop bailed out in. Callers
  // repaint explicitly instead (see repaintEditor in appEvents.js).
  paint();
  return { paint, fitHeight };
}
