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
 *   Segmentation       parseSegmentDirective (one directive: /l, /#:hex,
 *                      /f:N, /scale:N, /fx0, /fx1,.., /fx2,.., /grad:..)
 *                      and parseSegmentedLine (splits a line's raw content
 *                      on <...> groups, in order, handing each directive
 *                      string to parseSegmentDirective).
 *   Line builder       buildLines -- the module's main entry point. Walks
 *                      a whole poem, strips ##/-#/> prefixes, detects
 *                      Segmentation groups vs. the plain whole-line /l /c
 *                      /r suffix, and calls tokenizeInline per segment.
 *
 * Exports: buildLines (primary), applyEscapes + tokenizeInline (reused
 * directly by appEvents.js for filename generation, which needs the same
 * "what does this line actually say, formatting stripped" logic).
 *
 * This module has NO imports -- it's pure string/data-structure logic and
 * never touches the DOM or canvas. That's also what makes it the easiest
 * part of the whole app to test in isolation (see test/textParsers.test.js).
 *
 * NOTE ON isEmojiCodePoint / segmentHasEmoji: these live in canvasRenderer.js,
 * not here, even though they sound parser-adjacent. Checked their call sites
 * before this refactor -- they're only ever used by drawTextRun() to decide
 * whether to tint an emoji glyph, which is a rendering concern, not parsing.
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
function parseSegmentDirective(dirStr, part){
  const d = dirStr.trim();
  const lower = d.toLowerCase();
  if(lower==='l'){ part.justify='left'; return; }
  if(lower==='c'){ part.justify='center'; return; }
  if(lower==='r'){ part.justify='right'; return; }
  if(d.startsWith('#:')){ part.customColor = '#'+d.slice(2); return; }
  if(lower.startsWith('f:')){ part.customFontIdx = parseInt(d.slice(2),10); return; }
  if(lower.startsWith('scale:')){ part.customSize = parseFloat(d.slice(6)); return; }
  if(lower==='fx0'){ part.customEffect = {type:'none'}; return; }
  if(lower.startsWith('fx1,')){
    const p = d.slice(4).split(',');
    part.customEffect = {type:'outline', color:p[0], width:parseFloat(p[1])};
    return;
  }
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
    if(stops.length>=2) part.customGradient = stops.slice(0,4);
    return;
  }
  // unrecognized directive — ignored rather than thrown, so a typo doesn't break the whole line
}

function parseSegmentedLine(content){
  const re = /<([\s\S]*?)((?:\/[^\/<>]+)+)>/g;
  let m, lastIndex=0, found=false;
  const parts = [];
  const blankPart = text => ({text, justify:null, customColor:null, customFontIdx:null, customSize:null, customEffect:null, customGradient:null});
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
export function buildLines(rawText, accent1On, accent2On){
  const rawLines = rawText.replace(/\r\n/g,'\n').split('\n');
  return rawLines.map(rawLine=>{
    if(rawLine === '') return {isBlank:true};
    const line = applyEscapes(rawLine);

    let type='normal', scale=1, content=line;
    if(line.startsWith('## ')){ type='heading'; scale=1.33; content=line.slice(3); }
    else if(line.startsWith('-# ')){ type='small'; scale=0.66; content=line.slice(3); }
    else if(line.startsWith('> ')){ type='quote'; scale=1; content=line.slice(2); }

    const rawParts = parseSegmentedLine(content);
    if(rawParts){
      const parts = rawParts.map(p=>{
        let segments = tokenizeInline(p.text, accent1On, accent2On);
        if(type==='quote') segments = segments.map(s=>({...s, italic:true}));
        return { justify:p.justify, customColor:p.customColor, customFontIdx:p.customFontIdx, customSize:p.customSize, customEffect:p.customEffect, customGradient:p.customGradient, segments };
      });
      return {isBlank:false, type, scale, parts};
    }

    let alignOverride = null;
    const alignMatch = content.match(/\s*\/(l|c|r)\s*$/i);
    if(alignMatch){
      alignOverride = {l:'left',c:'center',r:'right'}[alignMatch[1].toLowerCase()];
      content = content.slice(0, alignMatch.index);
    }

    let segments = tokenizeInline(content, accent1On, accent2On);
    if(type==='quote') segments = segments.map(s=>({...s, italic:true}));
    return {isBlank:false, type, scale, segments, alignOverride};
  });
}
