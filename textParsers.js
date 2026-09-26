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
export function tokenizeInline(text, accent1On, accent2On){
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

  const stack = [];
  const chars = [];
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
    if(accent1On && accent2On && text.startsWith('{[', i)){ stack.push({type:'gradFwd'}); i+=2; continue; }
    if(accent1On && accent2On && text.startsWith('[{', i)){ stack.push({type:'gradRev'}); i+=2; continue; }
    if(text.startsWith(']}', i) || text.startsWith('}]', i)){
      const idxFwd = findLastStackIndex(stack,'gradFwd');
      const idxRev = findLastStackIndex(stack,'gradRev');
      if(idxFwd!==-1 || idxRev!==-1){
        if(idxFwd > idxRev){ stack.splice(idxFwd,1); } else { stack.splice(idxRev,1); }
        i+=2; continue;
      }
      // no gradient open — fall through so the plain ] and } handlers below
      // process this as two ordinary (non-gradient) closes instead
    }
    const prevCh = chars.length ? chars[chars.length-1].ch : undefined;
    if(text.startsWith('~~', i)){
      const idx = findLastStackIndex(stack,'strike');
      if(idx!==-1 && !isSpace(prevCh)){ stack.splice(idx,1); i+=2; continue; }
      if(idx===-1 && !isSpace(text[i+2])){ stack.push({type:'strike'}); i+=2; continue; }
    }
    if(text.startsWith('**', i)){
      const idx = findLastStackIndex(stack,'bold');
      if(idx!==-1 && !isSpace(prevCh)){ stack.splice(idx,1); i+=2; continue; }
      if(idx===-1 && !isSpace(text[i+2])){ stack.push({type:'bold'}); i+=2; continue; }
    }
    const c = text[i];
    if(c==='*'){
      const idx = findLastStackIndex(stack,'italic');
      if(idx!==-1 && !isSpace(prevCh)){ stack.splice(idx,1); i+=1; continue; }
      if(idx===-1 && !isSpace(text[i+1])){ stack.push({type:'italic'}); i+=1; continue; }
    }
    if(c==='_'){
      const idx = findLastStackIndex(stack,'underline');
      if(idx!==-1 && !isSpace(prevCh)){ stack.splice(idx,1); i+=1; continue; }
      if(idx===-1 && !isSpace(text[i+1])){ stack.push({type:'underline'}); i+=1; continue; }
    }
    if(accent1On && c==='['){ stack.push({type:'accent1'}); i+=1; continue; }
    if(accent1On && c===']'){
      const idx = findLastStackIndex(stack,'accent1');
      if(idx!==-1){ stack.splice(idx,1); i+=1; continue; }
    }
    if(accent2On && c==='{'){ stack.push({type:'accent2'}); i+=1; continue; }
    if(accent2On && c==='}'){
      const idx = findLastStackIndex(stack,'accent2');
      if(idx!==-1){ stack.splice(idx,1); i+=1; continue; }
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

function parseSegmentDirective(dirStr, part){
  const d = dirStr.trim();
  const lower = d.toLowerCase();
  if(lower==='l' || lower==='left'){ part.justify='left'; return; }
  if(lower==='c' || lower==='center'){ part.justify='center'; return; }
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

function parseSegmentedLine(content){
  const re = /<([\s\S]*?)((?:\/[^\/<>]+)+)>/g;
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
    else if(dl.startsWith('#:')) rule.customColor = '#' + d.trim().slice(2);
  }
  return rule;
}

export function buildLines(rawText, accent1On, accent2On){
  const rawLines = rawText.replace(/\r\n/g,'\n').split('\n');
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
      const parts = rawParts.map(p=>{
        let segments = tokenizeInline(p.text, accent1On, accent2On);
        if(type==='quote') segments = segments.map(s=>({...s, italic:true}));
        // every field a directive can set must be copied here, or it is
        // parsed and then silently dropped — which is what /effect did
        return { justify:p.justify, customColor:p.customColor, customFontIdx:p.customFontIdx, customSize:p.customSize, customTracking:p.customTracking, customBasis:p.customBasis, customJitter:p.customJitter, customEffect:p.customEffect, customTypeEffect:p.customTypeEffect, customGradient:p.customGradient,
                 // present only on code segments, so every existing poem parses byte-identically
                 ...(p.code ? { code: true } : {}), segments };
      });
      return {isBlank:false, type, scale, parts, dropCap, smallCaps, rhymeLetter};
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
