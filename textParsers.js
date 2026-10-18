import { STITCH_NAMES } from './stitches.js';
import { parseFxList, parseUnder } from './effects.js';
/**
 * textParsers.js — the poem-text markup language: escaping, inline styles
 * (bold/italic/underline/strike/accent colors, nested arbitrarily), the
 * hidden gradient wraps, and the Segmentation Operator (<...>) with all its
 * directives (justification, custom color/font/size/outline/shadow/gradient).
 *
 * TABLE OF CONTENTS
 *   Escaping           applyEscapes, restoreEscapes, and the sentinel-
 *                      character tables they use. \X -> literal X, done as
 *                      a substitution pass BEFORE any markup parsing so an
 *                      escaped character can never trigger a delimiter.
 *   Inline tokenizer   tokenizeInline (+ its private helper
 *                      findLastStackIndex). A stack-based scanner, not a
 *                      regex pass -- every character gets a snapshot of
 *                      whichever styles are currently "open", so nesting
 *                      like **bold [accent] still bold** just falls out of
 *                      the algorithm instead of needing special-casing.
 *   Segmentation       parseSegmentDirective (one directive: /l /c /r, /#:hex,
 *                      /f:N, /scale:N, /track:N, /basis:N, /jitter:N,
 *                      /fx0 /fx1 /fx2, /grad:.., /rainbow and friends,
 *                      /effect:NAME,...)
 *                      and parseSegmentedLine (splits a line's raw content
 *                      on <...> groups, in order, handing each directive
 *                      string to parseSegmentDirective).
 *   Line builder       buildLines -- the module's main entry point. Walks
 *                      a whole poem, strips its prefixes (## -# > #D #S) and
 *                      rhyme markers (~A..~D), detects
 *                      Segmentation groups vs. the plain whole-line /l /c
 *                      /r suffix, and calls tokenizeInline per segment.
 *
 * Exports: buildLines (primary); applyEscapes + tokenizeInline (appEvents.js
 * reuses them to name exported files by what a line actually says);
 * TYPE_EFFECT_NAMES (the one list of typeface effects).
 *
 * §Variables are NOT handled here: pmlVars.js resolves them to plain text
 * and PML before this module ever sees the poem.
 *
 * This module has NO imports -- it's pure string/data-structure logic and
 * never touches the DOM or canvas. That's also what makes it the easiest
 * part of the whole app to test in isolation (see test/textParsers.test.mjs).
 *
 * isEmojiCodePoint / segmentHasEmoji live in canvasRenderer.js, not here:
 * only drawTextRun() uses them, to decide whether to tint an emoji — a
 * rendering concern, not parsing.
 */

const ESCAPABLE_CHARS = ['\\','*','_','~','[',']','{','}','<','>','/'];
const ESCAPE_TO_SENTINEL = {};
const SENTINEL_TO_CHAR = {};
ESCAPABLE_CHARS.forEach((ch,i)=>{
  const sentinel = String.fromCodePoint(0xE000+i);
  ESCAPE_TO_SENTINEL[ch] = sentinel;
  SENTINEL_TO_CHAR[sentinel] = ch;
});

// Sentinels for [text/lg] [text/rg] {text/lg} {text/rg} — a gradient between
// the normal text color and an accent, in either direction. Converted from
// their bracket form to these single-character markers in a pre-pass, so the
// main tokenizer can treat them exactly like a push/pop delimiter (same as
// plain [ ] { }) while still fully supporting nested bold/italic/etc inside.
const SENT_LG1_OPEN = String.fromCodePoint(0xE010), SENT_LG1_CLOSE = String.fromCodePoint(0xE011);
const SENT_RG1_OPEN = String.fromCodePoint(0xE012), SENT_RG1_CLOSE = String.fromCodePoint(0xE013);
const SENT_LG2_OPEN = String.fromCodePoint(0xE014), SENT_LG2_CLOSE = String.fromCodePoint(0xE015);
const SENT_RG2_OPEN = String.fromCodePoint(0xE016), SENT_RG2_CLOSE = String.fromCodePoint(0xE017);
// a joint between brackets a carried block puts back to back ("[" then "{"), so they are never read as a gradient's
// "[{" — read as nothing at all
const SENT_JOINT = String.fromCodePoint(0xE018);

/** Names /effect: accepts. The renderer reads this same list, so the parser
 *  and the drawing code can never disagree about which effects exist. */
export const TYPE_EFFECT_NAMES = ['none', 'letterpress', 'longshadow', 'doublestrike', 'chromatic', 'halo',
  'bevel', 'erosion', 'doubleline', 'wavyline', 'dottedline', 'bloom'];

export function applyEscapes(text){
  let out = '';
  for(let i=0;i<text.length;i++){
    if(text[i]==='\\' && ESCAPE_TO_SENTINEL[text[i+1]]){
      out += ESCAPE_TO_SENTINEL[text[i+1]];
      i++;
    } else {
      out += text[i];
    }
  }
  return out;
}
function restoreEscapes(text){
  let out = '';
  for(const ch of text) out += (SENTINEL_TO_CHAR[ch] !== undefined) ? SENTINEL_TO_CHAR[ch] : ch;
  return out;
}

// ---------- emoji detection (for the accent-color "colorize" feature) ----------
function findLastStackIndex(stack, type){
  for(let i=stack.length-1;i>=0;i--) if(stack[i].type===type) return i;
  return -1;
}
// the bracket kinds that may run on past a segment's end into the next part of the line
const CARRIED_KINDS = new Set(['accent1', 'accent2', 'gradFwd', 'gradRev', 'bold', 'italic']);
/** A line's text as styled runs. `state` (optional, buildLines' own): brackets left open carry in from the parts before
 *  ({ stack, next, closed, keep }) — each bracket gets an id, `closed` gathers the ids that close, and at the end the
 *  still-open ones are handed on (only those in `keep`, when given: the ones known to close in a later part). */
export function tokenizeInline(text, accent1On, accent2On, state){
  // Pre-pass: [content/lg] etc become sentinel-wrapped so the main scanner
  // below can treat them as simple push/pop delimiters (like plain [ ]),
  // while the wrapped content itself is untouched and still gets scanned
  // normally for nested bold/italic/etc.
  if(accent1On){
    text = text.replace(/\[([^\[\]]*?)\/lg\]/g, (m,inner)=>SENT_LG1_OPEN+inner+SENT_LG1_CLOSE);
    text = text.replace(/\[([^\[\]]*?)\/rg\]/g, (m,inner)=>SENT_RG1_OPEN+inner+SENT_RG1_CLOSE);
  }
  if(accent2On){
    text = text.replace(/\{([^\{\}]*?)\/lg\}/g, (m,inner)=>SENT_LG2_OPEN+inner+SENT_LG2_CLOSE);
    text = text.replace(/\{([^\{\}]*?)\/rg\}/g, (m,inner)=>SENT_RG2_OPEN+inner+SENT_RG2_CLOSE);
  }

  const stack = state ? state.stack.slice() : [];
  const chars = [];
  // (with a carried state: each bracket its id, so the parts before and after can tell which closes where)
  const push = type => stack.push(state && CARRIED_KINDS.has(type) ? { type, id: state.next++ } : { type });
  const closeAt = idx => { const it = stack.splice(idx, 1)[0]; if(state && it.id != null) state.closed.add(it.id); };
  function snapshot(){
    let bold=false, italic=false, underline=false, strike=false, color=null;
    for(const item of stack){
      if(item.type==='bold') bold=true;
      else if(item.type==='italic') italic=true;
      else if(item.type==='underline') underline=true;
      else if(item.type==='strike') strike=true;
      else if(item.type==='accent1') color='accent1';
      else if(item.type==='accent2') color='accent2';
      else if(item.type==='gradFwd') color='gradFwd';
      else if(item.type==='gradRev') color='gradRev';
      else if(item.type==='lgAccent1') color='lgAccent1';
      else if(item.type==='rgAccent1') color='rgAccent1';
      else if(item.type==='lgAccent2') color='lgAccent2';
      else if(item.type==='rgAccent2') color='rgAccent2';
    }
    return {bold,italic,underline,strike,color};
  }
  const isSpace = c => c===' ' || c==='\t' || c===undefined;
  const n = text.length;
  let i = 0;
  while(i<n){
    if(text[i]===SENT_JOINT){ i+=1; continue; }
    if(text[i]===SENT_LG1_OPEN){ stack.push({type:'lgAccent1'}); i+=1; continue; }
    if(text[i]===SENT_LG1_CLOSE){
      const idx = findLastStackIndex(stack,'lgAccent1');
      if(idx!==-1){ stack.splice(idx,1); i+=1; continue; }
    }
    if(text[i]===SENT_RG1_OPEN){ stack.push({type:'rgAccent1'}); i+=1; continue; }
    if(text[i]===SENT_RG1_CLOSE){
      const idx = findLastStackIndex(stack,'rgAccent1');
      if(idx!==-1){ stack.splice(idx,1); i+=1; continue; }
    }
    if(text[i]===SENT_LG2_OPEN){ stack.push({type:'lgAccent2'}); i+=1; continue; }
    if(text[i]===SENT_LG2_CLOSE){
      const idx = findLastStackIndex(stack,'lgAccent2');
      if(idx!==-1){ stack.splice(idx,1); i+=1; continue; }
    }
    if(text[i]===SENT_RG2_OPEN){ stack.push({type:'rgAccent2'}); i+=1; continue; }
    if(text[i]===SENT_RG2_CLOSE){
      const idx = findLastStackIndex(stack,'rgAccent2');
      if(idx!==-1){ stack.splice(idx,1); i+=1; continue; }
    }
    if(accent1On && accent2On && text.startsWith('{[', i)){ push('gradFwd'); i+=2; continue; }
    if(accent1On && accent2On && text.startsWith('[{', i)){ push('gradRev'); i+=2; continue; }
    if(text.startsWith(']}', i) || text.startsWith('}]', i)){
      const idxFwd = findLastStackIndex(stack,'gradFwd');
      const idxRev = findLastStackIndex(stack,'gradRev');
      if(idxFwd!==-1 || idxRev!==-1){
        if(idxFwd > idxRev){ closeAt(idxFwd); } else { closeAt(idxRev); }
        i+=2; continue;
      }
      // no gradient open — fall through so the plain ] and } handlers below
      // process this as two ordinary (non-gradient) closes instead
    }
    const prevCh = chars.length ? chars[chars.length-1].ch : state ? state.prev : undefined;
    if(text.startsWith('~~', i)){
      const idx = findLastStackIndex(stack,'strike');
      if(idx!==-1 && !isSpace(prevCh)){ stack.splice(idx,1); i+=2; continue; }
      if(idx===-1 && !isSpace(text[i+2])){ stack.push({type:'strike'}); i+=2; continue; }
    }
    if(text.startsWith('**', i)){
      const idx = findLastStackIndex(stack,'bold');
      if(idx!==-1 && !isSpace(prevCh)){ closeAt(idx); i+=2; continue; }
      if(idx===-1 && !isSpace(text[i+2])){ push('bold'); i+=2; continue; }
    }
    const c = text[i];
    if(c==='*'){
      const idx = findLastStackIndex(stack,'italic');
      if(idx!==-1 && !isSpace(prevCh)){ closeAt(idx); i+=1; continue; }
      if(idx===-1 && !isSpace(text[i+1])){ push('italic'); i+=1; continue; }
    }
    if(c==='_'){
      const idx = findLastStackIndex(stack,'underline');
      if(idx!==-1 && !isSpace(prevCh)){ stack.splice(idx,1); i+=1; continue; }
      if(idx===-1 && !isSpace(text[i+1])){ stack.push({type:'underline'}); i+=1; continue; }
    }
    if(accent1On && c==='['){ push('accent1'); i+=1; continue; }
    if(accent1On && c===']'){
      const idx = findLastStackIndex(stack,'accent1');
      if(idx!==-1){ closeAt(idx); i+=1; continue; }
    }
    if(accent2On && c==='{'){ push('accent2'); i+=1; continue; }
    if(accent2On && c==='}'){
      const idx = findLastStackIndex(stack,'accent2');
      if(idx!==-1){ closeAt(idx); i+=1; continue; }
    }
    chars.push({ch:c, ...snapshot()});
    i += 1;
  }
  const runs = [];
  for(const cd of chars){
    const restored = restoreEscapes(cd.ch);
    const last = runs[runs.length-1];
    if(last && last.bold===cd.bold && last.italic===cd.italic && last.underline===cd.underline && last.strike===cd.strike && last.color===cd.color){
      last.text += restored;
    } else {
      runs.push({text:restored, bold:cd.bold, italic:cd.italic, underline:cd.underline, strike:cd.strike, color:cd.color});
    }
  }
  if(runs.length===0) runs.push({text:'', bold:false, italic:false, underline:false, strike:false, color:null});
  if(state){ state.stack = stack.filter(it => it.id != null && (!state.keep || state.keep.has(it.id))); if(chars.length) state.prev = chars[chars.length - 1].ch; }
  return runs;
}

// ---------- split-alignment: <text/l><text/r> etc, on one line ----------
// Fixed color sequences for the flag/rainbow gradient shortcuts. Verified
// against multiple independently-converging sources rather than typed from
// memory -- getting these wrong would be a real mistake, not a cosmetic one.
// rainbow: the modern 6-stripe Pride flag (red/orange/yellow/green/blue/violet).
// trans: Monica Helms' 1999 design (light blue, pink, white, pink, light blue).
// lesbian: Emily Gwen's 2018 "Sunset" flag, the current community-adopted
// design (not the retired 2010 "lipstick lesbian" flag) -- using the full
// 7-stripe original rather than the simplified 5-stripe version, since a
// gradient renders more stops more smoothly than a flag's stripes need to.
const FLAG_GRADIENTS = {
  rainbow: ['#E40303','#FF8C00','#FFED00','#008026','#004DFF','#750787'],
  trans:   ['#5BCEFA','#F5A9B8','#FFFFFF','#F5A9B8','#5BCEFA'],
  lesbian: ['#D52D00','#EF7627','#FF9A56','#FFFFFF','#D162A4','#B55690','#A30262'],
};

// COLOR NAMES for /color: (Ruby: friendlier names): the CSS named colors, and a few of the app's own
const CSS_COLOR_NAMES = Object.fromEntries('aliceblue:f0f8ff antiquewhite:faebd7 aqua:00ffff aquamarine:7fffd4 azure:f0ffff beige:f5f5dc bisque:ffe4c4 black:000000 blanchedalmond:ffebcd blue:0000ff blueviolet:8a2be2 brown:a52a2a burlywood:deb887 cadetblue:5f9ea0 chartreuse:7fff00 chocolate:d2691e coral:ff7f50 cornflowerblue:6495ed cornsilk:fff8dc crimson:dc143c cyan:00ffff darkblue:00008b darkcyan:008b8b darkgoldenrod:b8860b darkgray:a9a9a9 darkgreen:006400 darkgrey:a9a9a9 darkkhaki:bdb76b darkmagenta:8b008b darkolivegreen:556b2f darkorange:ff8c00 darkorchid:9932cc darkred:8b0000 darksalmon:e9967a darkseagreen:8fbc8f darkslateblue:483d8b darkslategray:2f4f4f darkslategrey:2f4f4f darkturquoise:00ced1 darkviolet:9400d3 deeppink:ff1493 deepskyblue:00bfff dimgray:696969 dimgrey:696969 dodgerblue:1e90ff firebrick:b22222 floralwhite:fffaf0 forestgreen:228b22 fuchsia:ff00ff gainsboro:dcdcdc ghostwhite:f8f8ff gold:ffd700 goldenrod:daa520 gray:808080 green:008000 greenyellow:adff2f grey:808080 honeydew:f0fff0 hotpink:ff69b4 indianred:cd5c5c indigo:4b0082 ivory:fffff0 khaki:f0e68c lavender:e6e6fa lavenderblush:fff0f5 lawngreen:7cfc00 lemonchiffon:fffacd lightblue:add8e6 lightcoral:f08080 lightcyan:e0ffff lightgoldenrodyellow:fafad2 lightgray:d3d3d3 lightgreen:90ee90 lightgrey:d3d3d3 lightpink:ffb6c1 lightsalmon:ffa07a lightseagreen:20b2aa lightskyblue:87cefa lightslategray:778899 lightslategrey:778899 lightsteelblue:b0c4de lightyellow:ffffe0 lime:00ff00 limegreen:32cd32 linen:faf0e6 magenta:ff00ff maroon:800000 mediumaquamarine:66cdaa mediumblue:0000cd mediumorchid:ba55d3 mediumpurple:9370db mediumseagreen:3cb371 mediumslateblue:7b68ee mediumspringgreen:00fa9a mediumturquoise:48d1cc mediumvioletred:c71585 midnightblue:191970 mintcream:f5fffa mistyrose:ffe4e1 moccasin:ffe4b5 navajowhite:ffdead navy:000080 oldlace:fdf5e6 olive:808000 olivedrab:6b8e23 orange:ffa500 orangered:ff4500 orchid:da70d6 palegoldenrod:eee8aa palegreen:98fb98 paleturquoise:afeeee palevioletred:db7093 papayawhip:ffefd5 peachpuff:ffdab9 peru:cd853f pink:ffc0cb plum:dda0dd powderblue:b0e0e6 purple:800080 rebeccapurple:663399 red:ff0000 rosybrown:bc8f8f royalblue:4169e1 saddlebrown:8b4513 salmon:fa8072 sandybrown:f4a460 seagreen:2e8b57 seashell:fff5ee sienna:a0522d silver:c0c0c0 skyblue:87ceeb slateblue:6a5acd slategray:708090 slategrey:708090 snow:fffafa springgreen:00ff7f steelblue:4682b4 tan:d2b48c teal:008080 thistle:d8bfd8 tomato:ff6347 turquoise:40e0d0 violet:ee82ee wheat:f5deb3 white:ffffff whitesmoke:f5f5f5 yellow:ffff00 yellowgreen:9acd32'.split(' ').map(p => p.split(':')));
const APP_COLOR_NAMES = { rose: 'e7a0b8', oxblood: '5c1a1b', moss: '5a6b3a', bone: 'e8e0cc', parchment: 'f1e6c8', graphite: '3a3a3e',
  teastain: 'b08a5a', clay: 'b0734f', sage: '9caf88', ink: '1a1a22', starlight: 'f4f1ff', ember: 'e8653a' };
/** A color written in PML (a name, #hex or hex) as #hex, or null. */
export function pmlColor(v){
  const k = String(v || '').trim().toLowerCase().replace(/[\s_-]/g, ''), h = APP_COLOR_NAMES[k] || CSS_COLOR_NAMES[k] || k.replace(/^#/, '');
  return /^([0-9a-f]{3}|[0-9a-f]{6})$/.test(h) ? '#' + h : null;
}
// the blends /blend: takes (the canvas's own composite modes, and plainer names for two of them)
const PML_BLENDS = { multiply: 'multiply', screen: 'screen', overlay: 'overlay', darken: 'darken', lighten: 'lighten', 'color-dodge': 'color-dodge',
  dodge: 'color-dodge', 'color-burn': 'color-burn', burn: 'color-burn', 'hard-light': 'hard-light', hardlight: 'hard-light', 'soft-light': 'soft-light',
  softlight: 'soft-light', difference: 'difference', exclusion: 'exclusion', hue: 'hue', saturation: 'saturation', color: 'color', luminosity: 'luminosity' };
const pmlNum = (s, def, lo, hi) => { const v = parseFloat(s); return Math.max(lo, Math.min(hi, isNaN(v) ? def : v)); };
function parseSegmentDirective(dirStr, part){
  const d = dirStr.trim();
  const lower = d.toLowerCase();
  // ---- the newer directives (Ruby approved, Saturn–Phoebe): each also works bare, with a sensible amount ----
  // opacity, a blend with what lies under the words, a turn, a line bent on an arc or a wave, space after the line
  if(lower === 'op' || lower.startsWith('op:')){ part.customOpacity = pmlNum(d.slice(3), 60, 0, 100); return; }
  if(lower === 'blend' || lower.startsWith('blend:')){ const m = PML_BLENDS[lower.slice(6).trim() || 'multiply']; if(m) part.customBlend = m; return; }
  if(lower === 'rot' || lower.startsWith('rot:')){ part.customRotate = pmlNum(d.slice(4), -8, -360, 360); return; }
  if(lower === 'arc' || lower.startsWith('arc:')){ part.customArc = pmlNum(d.slice(4), 30, -200, 200); return; }
  if(lower === 'wave' || lower.startsWith('wave:')){ const b = d.slice(5).split(','); part.customWave = { amp: pmlNum(b[0], 25, -200, 200), cycles: pmlNum(b[1], 2, 0.25, 12) }; return; }
  if(lower === 'gap' || lower.startsWith('gap:')){ part.customGap = pmlNum(d.slice(4), 100, -80, 400); return; }
  // a typeface by its name (the list's own: /font:Cinzel), beside /f:N
  if(lower.startsWith('font:')){ const n = d.slice(5).trim(); if(n) part.customFontName = n; return; }
  // a color by its name or hex: /color:rose, /color:midnightblue, /color:#a33
  if(lower.startsWith('color:') || lower.startsWith('colour:')){ const c = pmlColor(d.slice(d.indexOf(':') + 1)); if(c) part.customColor = c; return; }
  // glass letters: frosted (the page behind them blurred and lit), clear (only bent), or tinted by a color
  if(lower === 'glass' || lower.startsWith('glass:')){ const v = lower.slice(6).trim(), tint = v && v !== 'frost' && v !== 'clear' ? pmlColor(v) : null;
    part.glass = { kind: v === 'clear' ? 'clear' : 'frost', tint }; return; }
  // the letters as windows to the page beneath the surface
  if(lower === 'cut'){ part.cut = true; return; }
  if(lower==='l' || lower==='left'){ part.justify='left'; return; }
  if(lower==='c' || lower==='center' || lower==='centre'){ part.justify='center'; return; }
  if(lower==='r' || lower==='right'){ part.justify='right'; return; }
  if(d.startsWith('#:')){ part.customColor = '#'+d.slice(2); return; }

  // bare /f has no sane default -- there's no "correct" font index to fall
  // back to without knowing which font is currently selected, which this
  // parser (a pure function of text alone) has no access to. No-op rather
  // than guessing.
  if(lower==='f'){ return; }
  if(lower.startsWith('f:')){ part.customFontIdx = parseInt(d.slice(2),10); return; }

  // Percentage-based, not absolute pixels: /scale:150 means 150% of the
  // fitted size, matching the same convention line.scale already uses
  // internally for ## headings (133%) and -# small asides (66%). Bare
  // /scale (no colon) is a no-op at 100%, valid syntax even though there's
  // rarely a reason to write it.
  if(lower==='scale' || lower.startsWith('scale:')){
    const v = lower.startsWith('scale:') ? parseFloat(d.slice(6)) : 100;
    part.customSize = isNaN(v) ? 100 : v;
    return;
  }

  // Letter-spacing, percentage of the same base tracking amount the
  // no-italic-font emphasis fallback already uses (see emphasisTracking in
  // canvasRenderer.js) -- so /track:100 matches that fallback's own
  // magnitude, and bare /track defaults to exactly that.
  if(lower==='track' || lower.startsWith('track:')){
    const v = lower.startsWith('track:') ? parseFloat(d.slice(6)) : 100;
    part.customTracking = isNaN(v) ? 100 : v;
    return;
  }

  // Baseline shift: positive raises, negative lowers, as a percentage of
  // this part's own (post-scale) rendered size -- see the renderer's
  // "basis math" comment for why that matters. Bare /basis defaults to a
  // modest +30 (a superscript-like nudge) since a raise is the more common
  // reason to reach for this than a lower.
  if(lower==='basis' || lower.startsWith('basis:')){
    const v = lower.startsWith('basis:') ? parseFloat(d.slice(6)) : 30;
    part.customBasis = isNaN(v) ? 30 : v;
    return;
  }

  // Per-character position jitter, percentage of a default magnitude. Bare
  // /jitter defaults to 100%.
  if(lower==='jitter' || lower.startsWith('jitter:')){
    const v = lower.startsWith('jitter:') ? parseFloat(d.slice(7)) : 100;
    part.customJitter = isNaN(v) ? 100 : v;
    return;
  }

  // Flag/rainbow gradient shortcuts -- same effect as spelling out a /grad:
  // with the right stops, just without needing to know or type them.
  // :rev reverses the stripe order (e.g. /rainbow:rev).
  for(const [name, colors] of Object.entries(FLAG_GRADIENTS)){
    if(lower===name){ part.customGradient = colors; return; }
    if(lower===name+':rev'){ part.customGradient = [...colors].reverse(); return; }
  }

  // /code — a code segment (written in PML as `backticks`): monospace, on a
  // backdrop chosen for contrast with the page behind it. pmlVars.js turns
  // backticks into this directive, escaping the text so none of it is PML.
  if(lower==='code'){ part.code = true; return; }

  // /effect:NAME[,strength][,hue][,angle][,distance][,grain] — the typeface effects. A separate
  // directive from /fx0 /fx1 /fx2 on purpose: those keep exactly their old
  // meaning, and an effect can sit alongside an outline or shadow. An unknown
  // name is ignored rather than guessed at. Bare /effect is a halo.
  // the effect stack, new form: /fx:outline(#fff,4)+glow(#fd0,40,70) (effects.js)
  if(lower.startsWith('fx:')){ part.customFx = parseFxList(d.slice(3)); return; }
  // an underline, drawn by the stitch library: /under:wave or /under:vine,#c33,150
  if(lower === 'under' || lower.startsWith('under:')){ part.under = parseUnder(lower === 'under' ? 'solid' : d.slice(6), STITCH_NAMES); return; }
  if(lower==='effect' || lower.startsWith('effect:')){
    const bits = lower==='effect' ? [] : d.slice(7).split(',');
    const name = (bits[0] || 'halo').trim().toLowerCase();
    if(!TYPE_EFFECT_NAMES.includes(name)) return;
    const strength = bits[1] != null && bits[1].trim() !== '' ? parseFloat(bits[1]) : 60;
    const num = (b, lo, hi) => {
      if(b == null || b.trim() === '') return null;
      const v = parseFloat(b);
      return isNaN(v) ? null : Math.max(lo, Math.min(hi, v));
    };
    part.customTypeEffect = {
      type: name,
      strength: isNaN(strength) ? 60 : Math.max(0, Math.min(100, strength)),
      color: bits[2] ? bits[2].trim() : null,
      // optional trailing fields: angle in degrees, distance and grain in %
      angle: num(bits[3], -360, 720),
      distance: num(bits[4], 10, 400),
      grain: num(bits[5], 0, 100),
    };
    return;
  }

  if(lower==='fx0'){ part.customEffect = {type:'none'}; return; }

  // Bare /fx1 and /fx2 get sane hardcoded defaults (a plain black outline /
  // shadow) rather than erroring -- there's no live UI state available here
  // to fall back to (this parser is a pure function of the text alone), so
  // "a reasonable default" is the best available answer, matching the same
  // reasoning as /track and /basis above.
  if(lower==='fx1'){ part.customEffect = {type:'outline', color:'#000000', width:3}; return; }
  if(lower.startsWith('fx1,')){
    const p = d.slice(4).split(',');
    part.customEffect = {type:'outline', color:p[0], width:parseFloat(p[1])};
    return;
  }
  if(lower==='fx2'){ part.customEffect = {type:'shadow', color:'#000000', blur:8, x:4, y:4}; return; }
  if(lower.startsWith('fx2,')){
    const p = d.slice(4).split(',');
    part.customEffect = {type:'shadow', color:p[0], blur:parseFloat(p[1]), x:parseFloat(p[2]), y:parseFloat(p[3])};
    return;
  }
  if(lower.startsWith('grad:')){
    const stops = d.slice(5).split(',').map(pair=>{
      const hashIdx = pair.indexOf('#');
      if(hashIdx===-1) return null;
      const n = parseInt(pair.slice(0,hashIdx),10);
      const color = '#'+pair.slice(hashIdx+1);
      return isNaN(n) ? null : {n, color};
    }).filter(Boolean).sort((a,b)=>a.n-b.n).map(s=>s.color);
    // Bare /grad (no stops at all) has no sane default -- unlike track/basis/
    // jitter, there's no single "neutral" 2-color gradient to fall back to,
    // so this one genuinely requires at least 2 explicit stops.
    if(stops.length>=2) part.customGradient = stops.slice(0,4);
    return;
  }
  // unrecognized directive — ignored rather than thrown, so a typo doesn't break the whole line
}

// A line's segment groups, nested: each closer (/dirs>) closes the innermost open '<'. An opener left open before a
// closed group (a literal '<', as in "<3") means the line is read the old way instead (the first '<' with the first
// closer after it), so every line PML has always read the same is read the same. Also hands on the openers left open
// and the closers that found none (`free`): a segment carried over lines (expandBlocks).
const SEG_CLOSER = /^((?:\/[^\/<>\n]+)+)>/;
function segGroupsOf(line){
  const st = [], groups = [], freeClose = [];
  for(let i = 0; i < line.length; i++){
    if(line[i] === '<'){ if(line[i + 1] !== '3') st.push(i); continue; }   // ("<3" is always a heart: Ruby)
    if(line[i] !== '/') continue;
    const m = SEG_CLOSER.exec(line.slice(i)); if(!m) continue;
    if(st.length){ const o = st.pop(); groups.push({ open: o, cs: i, end: i + m[0].length, dirs: m[1], depth: st.length }); }
    else freeClose.push({ at: i, end: i + m[0].length, dirs: m[1] });
    i += m[0].length - 1;
  }
  if(st.length && groups.some(g => g.open > st[0])) return { old: true };
  return { old: false, groups, freeOpen: st, freeClose };
}
function parseSegmentedLine(content){
  const G = segGroupsOf(content);
  if(!G.old && G.groups.some(g => g.depth > 0)) return parseNestedSegments(content, G.groups);
  const re = /<(?!3)([\s\S]*?)((?:\/[^\/<>]+)+)>/g;   // ("<3" is always a heart, never a segment's opener)
  let m, lastIndex=0, found=false;
  const parts = [];
  const blankPart = text => ({text, justify:null, customColor:null, customFontIdx:null, customSize:null, customTracking:null, customBasis:null, customJitter:null, customEffect:null, customTypeEffect:null, customGradient:null});
  while((m = re.exec(content))){
    found = true;
    if(m.index > lastIndex){
      const plain = content.slice(lastIndex, m.index);
      if(plain.length) parts.push(blankPart(plain));
    }
    const part = blankPart(m[1]);
    const directives = m[2].split('/').filter(Boolean);
    for(const dir of directives) parseSegmentDirective(dir, part);
    parts.push(part);
    lastIndex = re.lastIndex;
  }
  if(!found) return null;
  if(lastIndex < content.length){
    const plain = content.slice(lastIndex);
    if(plain.length) parts.push(blankPart(plain));
  }
  return parts;
}
const blankSegPart = text => ({text, justify:null, customColor:null, customFontIdx:null, customSize:null, customTracking:null, customBasis:null, customJitter:null, customEffect:null, customTypeEffect:null, customGradient:null});
// segments within segments: each piece of text takes the directives of every group round it, the outer first, so an
// inner one's own directive wins where they set the same thing
function parseNestedSegments(content, groups){
  const parts = [];
  const walk = (from, to, depth, dirs) => {
    let at = from;
    for(const g of groups.filter(g => g.depth === depth && g.open >= from && g.end <= to).sort((a, b) => a.open - b.open)){
      if(g.open > at) addPart(content.slice(at, g.open), dirs);
      const inner = dirs.concat(g.dirs.split('/').filter(Boolean)), n0 = parts.length;
      walk(g.open + 1, g.cs, depth + 1, inner);
      if(parts.length === n0) addPart('', inner);
      at = g.end;
    }
    if(at < to) addPart(content.slice(at, to), dirs);
  };
  const addPart = (text, dirs) => { if(!text.length && !dirs.length) return; const part = blankSegPart(text); for(const d of dirs) parseSegmentDirective(d, part); parts.push(part); };
  walk(0, content.length, 0, []);
  return parts;
}

// ---------- BLOCKS OVER LINES (Ruby: "treat [] {} like a pseudo segment operator and allow it (and the normal segment
// operator) to split lines … it should still allow hierarchy — all the weird things should be able to nest") ----------
// A bracket ([ ] { } {[ ]} [{ }]) or a segment (<…/dirs>) left open at the end of a line and closed on a later line is
// carried: closed at the end of each line it runs over and opened again at the start of the next (after a line's
// prefix, before its suffix), so every line stays one-line PML. Directives right after a bracket's closer
// ("[…]/jitter:200/f:12") make the bracket a segment of its own; alignment alone after a block's closer at the end of
// its last line ("…]/c") aligns every line of the block. A bracket never closed ends with its line, as it always did,
// and a poem that uses none of this is not touched.
const PML_PREFIX = /^(## |-# |> |#D |#S )/, PML_SUFFIX = /(\s*~[A-Da-d])?(\s*\/[lcrLCR])?\s*$/;
const DIR_RUN = /^(?:\/(?:[^\s\/<>\[\]{}()]|\([^)\n]*\))+)+/, ALIGN_DIRS = new Set(['l', 'c', 'r', 'left', 'center', 'centre', 'right']);
const knownDirective = d => { const part = {}; parseSegmentDirective(d, part); return Object.keys(part).length > 0; };
/** Every directive by its name, for the editor's hints (a name, then :value where it takes one). */
export const DIRECTIVE_NAMES = ['l', 'c', 'r', 'left', 'center', 'right', 'f', 'font', 'scale', 'track', 'basis', 'jitter', 'color', 'colour',
  'op', 'blend', 'rot', 'arc', 'wave', 'gap', 'glass', 'cut', 'code', 'fx', 'fx0', 'fx1', 'fx2', 'effect', 'under', 'grad',
  ...Object.keys(FLAG_GRADIENTS)];
/**
 * What the editor says of a directive PML can't read (null when it reads it): `{ kind, name, like }` — kind 'value'
 * when the name is one PML knows but what follows it isn't (/blend:fizz, /f with no number), 'name' when the name is
 * unknown, with `like` the nearest known name when one is close (/glas → glass). Named styles (/@name) are checked
 * against `styles`, the names the poem defines.
 */
export function directiveHint(d, styles){
  const t = String(d || '').trim();
  if(!t) return null;
  if(t[0] === '@') return styles && styles.has(t.slice(1).toLowerCase()) ? null : { kind: 'style', name: t.slice(1) };
  if(knownDirective(t)) return null;
  const name = t.toLowerCase().split(/[:,]/)[0];
  if(name === 'c' && t.length > 1) return { kind: 'value', name, like: 'color' };   // (/c is centring: a colour is /color:)
  if(DIRECTIVE_NAMES.includes(name) || name === '#') return { kind: 'value', name };
  const dist = (a, b) => { const m = a.length, n = b.length, D = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for(let j = 1; j <= n; j++) D[0][j] = j;
    for(let i = 1; i <= m; i++) for(let j = 1; j <= n; j++) D[i][j] = Math.min(D[i-1][j] + 1, D[i][j-1] + 1, D[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
    return D[m][n]; };
  let like = null, best = 3;
  for(const k of DIRECTIVE_NAMES){ if(k.length < 2) continue; const v = dist(name, k); if(v < best || (v === best && like && k.length < like.length)){ best = v; like = k; } }
  return { kind: 'name', name, like: best <= (name.length > 4 ? 2 : 1) ? like : null };
}
// the [x/lg] gradient forms, masked (same length) so their brackets are not taken for a block's
const maskGradients = (t, a1, a2) => { const mask = m => '\u0001'.repeat(m.length);
  if(a1) t = t.replace(/\[([^\[\]]*?)\/(?:lg|rg)\]/g, mask); if(a2) t = t.replace(/\{([^\{\}]*?)\/(?:lg|rg)\}/g, mask); return t; };
export function expandBlocks(rawText, accent1On, accent2On){
  const raw = rawText.replace(/\r\n/g,'\n').split('\n');
  if(!/[\[{<*]/.test(rawText)) return raw;
  const lines = raw.map(applyEscapes), isText = lines.map((l, k) => raw[k] !== '' && !parseRule(raw[k].trim(), accent1On, accent2On));
  // (the delimiters are found as the tokenizer finds them; one opened and never closed ends with its line, as in the
  //  tokenizer, so it is dropped there: found by looking again until nothing more is dropped)
  let items, drop = new Set();
  for(let round = 0; round < 4; round++){
    items = []; const br = [], segOpen = [], dangling = new Set();
    for(let k = 0; k < lines.length; k++){ if(!isText[k]) continue;
      const L = lines[k], M = maskGradients(L, accent1On, accent2On), G = segGroupsOf(L);
      // the segments: openers left open and closers with no opener on their line pair across lines
      if(!G.old){ for(const c of G.freeClose){ const o = segOpen.pop(); if(o) items.push({ kind: 'seg', l0: o.l, p0: o.p, l1: k, p1: c.at, open: '<', close: c.dirs + '>' }); }
        for(const p of G.freeOpen) segOpen.push({ l: k, p }); }
      // the brackets, bold and italic, by the tokenizer's own rules (strike and underline are each line's own)
      let prev, strike = false, under = false;
      const isSp = c => c === ' ' || c === '\t' || c === undefined, last = t => { for(let j = br.length - 1; j >= 0; j--) if(br[j].t === t) return j; return -1; };
      const close = (j, i, len, tok, kind) => { const o = br.splice(j, 1)[0]; items.push({ kind, l0: o.l, p0: o.p, l1: k, p1: i, end: i + len, open: o.open, close: tok }); };
      for(let i = 0; i < M.length; i++){
        const two = M.slice(i, i + 2), ch = M[i];
        if(accent1On && accent2On && (two === '{[' || two === '[{')){ br.push({ t: two === '{[' ? 'gradFwd' : 'gradRev', open: two, l: k, p: i }); i++; continue; }
        if(two === ']}' || two === '}]'){ const f = last('gradFwd'), r = last('gradRev'); if(f !== -1 || r !== -1){ close(Math.max(f, r), i, 2, ']}', 'br'); i++; continue; } }
        if(two === '~~'){ if(strike && !isSp(prev)){ strike = false; i++; continue; } if(!strike && !isSp(M[i + 2])){ strike = true; i++; continue; } }
        if(two === '**'){ const j = last('bold'); if(j !== -1 && !isSp(prev)){ close(j, i, 2, '**', 'em'); i++; continue; } if(j === -1 && !isSp(M[i + 2])){ br.push({ t: 'bold', open: '**', l: k, p: i }); i++; continue; } }
        if(ch === '*'){ const j = last('italic'); if(j !== -1 && !isSp(prev)){ close(j, i, 1, '*', 'em'); continue; } if(j === -1 && !isSp(M[i + 1])){ br.push({ t: 'italic', open: '*', l: k, p: i }); continue; } }
        if(ch === '_'){ if(under && !isSp(prev)){ under = false; continue; } if(!under && !isSp(M[i + 1])){ under = true; continue; } }
        const t = ch === '[' && accent1On ? 'accent1' : ch === '{' && accent2On ? 'accent2' : null;
        if(t){ br.push({ t, open: ch, l: k, p: i }); continue; }
        const ct = ch === ']' && accent1On ? 'accent1' : ch === '}' && accent2On ? 'accent2' : null;
        if(ct){ const j = last(ct); if(j !== -1){ close(j, i, 1, ch, 'br'); continue; } }
        if(ch !== SENT_JOINT) prev = ch; }
      // what was opened and is known never to close ends here
      for(let j = br.length - 1; j >= 0; j--) if(drop.has(br[j].l + ':' + br[j].p)) br.splice(j, 1); }
    for(const o of br) dangling.add(o.l + ':' + o.p);
    const before = drop.size; for(const d of dangling) drop.add(d); if(drop.size === before) break;
  }
  // directives right after a bracket's closer: alignment alone at the end of a block's line aligns the block; anything
  // else makes the bracket a segment of its own (a '<' before its opener, a '>' after its directives)
  const edits = lines.map(() => []), align = new Map();
  for(const it of items.filter(it => it.kind === 'br')){
    const after = lines[it.l1].slice(it.end), m = DIR_RUN.exec(after); if(!m) continue;
    const dirs = m[0].split('/').filter(Boolean); if(!dirs.every(knownDirective)) continue;
    const rest = after.slice(m[0].length); if(rest[0] === '>') continue;   // (those directives are a segment's own closer)
    if(dirs.every(d => ALIGN_DIRS.has(d.trim().toLowerCase())) && /^(\s*~[A-Da-d])?\s*$/.test(rest)){ if(it.l1 > it.l0 && dirs.length === 1 && dirs[0].length === 1) align.set(it, '/' + dirs[0]); continue; }
    edits[it.l0].push([it.p0, '<']); edits[it.l1].push([it.end + m[0].length, '>']);
    if(it.l1 > it.l0) items.push({ kind: 'seg', l0: it.l0, p0: it.p0 - 0.5, l1: it.l1, p1: it.end, open: '<', close: m[0] + '>' });
  }
  const multi = items.filter(it => it.l1 > it.l0);
  if(!multi.length && !edits.some(e => e.length)) return raw;
  // each line a block runs over: its carried openers after the prefix (the outer first), its closers before the suffix
  // (the inner first), the alignment of a block that asked for it
  const out = raw.slice();
  for(let k = 0; k < lines.length; k++){
    if(!isText[k]) continue;
    const runs = multi.filter(it => it.l0 <= k && it.l1 >= k), ins = edits[k].slice();
    if(!runs.length && !ins.length) continue;
    let L = lines[k];
    for(const [p, t] of ins.sort((a, b) => b[0] - a[0])) L = L.slice(0, p) + t + L.slice(p);
    const pre = (PML_PREFIX.exec(L) || [''])[0], sufM = PML_SUFFIX.exec(L.slice(pre.length)), body = L.slice(pre.length, pre.length + sufM.index), suf = L.slice(pre.length + sufM.index);
    const openers = runs.filter(it => it.l0 < k).sort((a, b) => a.l0 - b.l0 || a.p0 - b.p0).map(it => it.open + SENT_JOINT).join('');
    const closers = runs.filter(it => it.l1 > k).sort((a, b) => b.l0 - a.l0 || b.p0 - a.p0).map(it => SENT_JOINT + it.close).join('');
    let al = ''; for(const [it, a] of align) if(it.l0 <= k && it.l1 > k && !sufM[2]) al = a;
    out[k] = pre + openers + body + closers + suf + al;
  }
  return out;
}

/** A horizontal rule line, or null. Directives in <---...> may be separated
 *  by / (as in all PML) or \ (a rule has nothing to escape). */
export function parseRule(t, accent1On, accent2On){
  if(t === '---') return { color: null, width: 1, align: 'c' };
  if(t === '[---]') return { color: accent1On ? 'accent1' : null, width: 1, align: 'c' };
  if(t === '{---}') return { color: accent2On ? 'accent2' : null, width: 1, align: 'c' };
  const m = /^<(\[---\]|\{---\}|---)((?:[\/\\][^\/\\>]+)*)>$/.exec(t);
  if(!m) return null;
  const rule = { color: m[1] === '[---]' && accent1On ? 'accent1' : m[1] === '{---}' && accent2On ? 'accent2' : null, width: 1, align: 'c' };
  for(const d of m[2].split(/[\/\\]/).filter(Boolean)){
    const dl = d.trim().toLowerCase();
    if(/^\d+(\.\d+)?%$/.test(dl)) rule.width = Math.max(0.02, Math.min(1, parseFloat(dl)/100));
    else if(dl === 'l' || dl === 'c' || dl === 'r') rule.align = dl;
    else if(dl === 'left' || dl === 'center' || dl === 'centre' || dl === 'right') rule.align = dl[0];
    else if(/^scale:\d+(\.\d+)?$/.test(dl)) rule.width = Math.max(0.02, Math.min(1, parseFloat(dl.slice(6))/100));
    // a stitch from stitches.js — wave, zigzag, scallop, vine, hearts… — and
    // which side it points to: in/down (the default) or out/up
    else if(STITCH_NAMES.includes(dl)) rule.style = dl;
    else if(/^size:\d+(\.\d+)?$/.test(dl)) rule.size = Math.max(10, Math.min(500, parseFloat(dl.slice(5))));
    else if(/^weight:\d+(\.\d+)?$/.test(dl)) rule.weight = Math.max(10, Math.min(800, parseFloat(dl.slice(7))));
    else if(dl === 'in' || dl === 'down') rule.side = 1;
    else if(dl === 'out' || dl === 'up') rule.side = -1;
    else if(dl.startsWith('#:')) rule.customColor = '#' + d.trim().slice(2);
  }
  return rule;
}

export function buildLines(rawText, accent1On, accent2On){
  const rawLines = expandBlocks(rawText, accent1On, accent2On);
  return rawLines.map(rawLine=>{
    if(rawLine === '') return {isBlank:true};
    // a horizontal rule: ---, [---] or {---} for the accents, or a segment
    // <---/50%/c> with a width, an alignment (l c r) and a colour (#:hex).
    // It is a blank line that carries a rule, so layout gives it a blank
    // line's height and it never affects how the text is sized.
    const rule = parseRule(rawLine.trim(), accent1On, accent2On);
    if(rule) return {isBlank:true, rule};
    const line = applyEscapes(rawLine);

    let type='normal', scale=1, content=line, dropCap=false, smallCaps=false;
    if(line.startsWith('## ')){ type='heading'; scale=1.33; content=line.slice(3); }
    else if(line.startsWith('-# ')){ type='small'; scale=0.66; content=line.slice(3); }
    else if(line.startsWith('> ')){ type='quote'; scale=1; content=line.slice(2); }
    else if(line.startsWith('#D ')){ dropCap=true; content=line.slice(3); }
    else if(line.startsWith('#S ')){ smallCaps=true; content=line.slice(3); }

    // Rhyme-scheme marker: a bare ~A/~B/~C/~D at the very end of the line,
    // stripped from display entirely. A=accent1, B=accent2, C/D are each
    // accent's split-complement (resolved to an actual color at render
    // time, since this parser has no access to live accent hex values).
    // Checked before the /l /c /r suffix below, so both can coexist on one
    // line ("text~A/r").
    let rhymeLetter = null;
    const rhymeMatch = content.match(/~([A-Da-d])(?=\s*(?:\/[lcr])?\s*$)/i);
    if(rhymeMatch){
      rhymeLetter = rhymeMatch[1].toUpperCase();
      content = content.slice(0, rhymeMatch.index) + content.slice(rhymeMatch.index + rhymeMatch[0].length);
    }

    const rawParts = parseSegmentedLine(content);
    if(rawParts){
      // a bracket left open in one part runs on into the next while a later part closes it (first find which do)
      const seen = { stack: [], next: 0, closed: new Set() };
      for(const p of rawParts) tokenizeInline(p.text, accent1On, accent2On, seen);
      const carry = { stack: [], next: 0, closed: new Set(), keep: seen.closed };
      const parts = rawParts.map(p=>{
        let segments = tokenizeInline(p.text, accent1On, accent2On, carry);
        if(type==='quote') segments = segments.map(s=>({...s, italic:true}));
        // every field a directive can set must be copied here, or it is
        // parsed and then silently dropped — which is what /effect did
        return { justify:p.justify, customColor:p.customColor, customFontIdx:p.customFontIdx, customSize:p.customSize, customTracking:p.customTracking, customBasis:p.customBasis, customJitter:p.customJitter, customEffect:p.customEffect, customTypeEffect:p.customTypeEffect, customGradient:p.customGradient,
                 // undefined unless used, so they vanish when a poem is serialized
                 customFx:p.customFx, under:p.under,
                 customOpacity:p.customOpacity, customBlend:p.customBlend, customRotate:p.customRotate, customArc:p.customArc, customWave:p.customWave, customGap:p.customGap, customFontName:p.customFontName,
                 ...(p.glass ? { glass: p.glass } : {}), ...(p.cut ? { cut: true } : {}),
                 // present only on code segments, so every existing poem parses byte-identically
                 ...(p.code ? { code: true } : {}), segments };
      });
      // a part's /gap is its line's: space after it, as a share of the line's height (only when used)
      const gap = parts.reduce((g, p) => p.customGap != null ? p.customGap : g, null);
      return {isBlank:false, type, scale, parts, dropCap, smallCaps, rhymeLetter, ...(gap != null ? { gap } : {})};
    }

    let alignOverride = null;
    const alignMatch = content.match(/\s*\/(l|c|r)\s*$/i);
    if(alignMatch){
      alignOverride = {l:'left',c:'center',r:'right'}[alignMatch[1].toLowerCase()];
      content = content.slice(0, alignMatch.index);
    }

    let segments = tokenizeInline(content, accent1On, accent2On);
    if(type==='quote') segments = segments.map(s=>({...s, italic:true}));
    return {isBlank:false, type, scale, segments, alignOverride, dropCap, smallCaps, rhymeLetter};
  });
}
