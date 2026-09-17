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
export function highlightLine(line){
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
        out += span('bracket', '<');
        if(cut === -1){
          out += highlightInline(inner);
        } else {
          out += highlightInline(inner.slice(0, cut));
          out += highlightDirectives(inner.slice(cut));
        }
        out += span('bracket', '>');
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

    if(ch === '[' || ch === ']'){ out += span('sq', ch); i++; continue; }
    if(ch === '{' || ch === '}'){ out += span('cu', ch); i++; continue; }
    if(ch === '(' || ch === ')'){ out += span('paren', ch); i++; continue; }

    const emph = src.slice(i).match(/^(\*\*|~~|\*|_)/);
    if(emph){ out += span('emph', emph[0]); i += emph[0].length; continue; }

    out += escapeHtml(ch);
    i++;
  }
  return out;
}

/** Inline-only pass, used for the text part inside a segment. */
function highlightInline(text){
  let out = '', i = 0;
  while(i < text.length){
    const ch = text[i];
    if(ch === '\\' && i + 1 < text.length){ out += span('escape', text.slice(i, i+2)); i += 2; continue; }
    if(ch === '[' || ch === ']'){ out += span('sq', ch); i++; continue; }
    if(ch === '{' || ch === '}'){ out += span('cu', ch); i++; continue; }
    if(ch === '(' || ch === ')'){ out += span('paren', ch); i++; continue; }
    const emph = text.slice(i).match(/^(\*\*|~~|\*|_)/);
    if(emph){ out += span('emph', emph[0]); i += emph[0].length; continue; }
    out += escapeHtml(ch);
    i++;
  }
  return out;
}

/** Leading whitespace, in characters — drives the hanging indent on wrap. */
export function indentOf(line){
  const m = String(line).match(/^[ \t]*/);
  return m ? m[0].replace(/\t/g, '    ').length : 0;
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
export function highlightDocument(text){
  const lines = String(text).split('\n');
  return lines.map((line, i) =>
    `<span class="ln-mark" data-n="${i + 1}"></span>` + highlightLine(line)
  ).join('\n') + '\u200b';
}

/**
 * Wires mirror, gutter and textarea together.
 * deps: { textarea, mirror, gutter, onInput }
 */
export function installEditor({ textarea, mirror, gutter, onInput }){
  if(!textarea || !mirror) return null;

  function paint(){
    mirror.innerHTML = highlightDocument(textarea.value);
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
