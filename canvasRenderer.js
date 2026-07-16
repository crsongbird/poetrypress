/**
 * canvasRenderer.js — turns parsed poem lines into actual pixels.
 *
 * TABLE OF CONTENTS
 *   Emoji helpers        isEmojiCodePoint, segmentHasEmoji -- despite
 *                        sounding parser-adjacent, these are ONLY ever
 *                        called from drawTextRun to decide whether to tint
 *                        an emoji glyph. That's a rendering concern (the
 *                        glyph itself doesn't change, just how it's
 *                        painted), so they live here, not in textParsers.js.
 *   Color math           makeGradient (N-stop linear gradient, used for
 *                        both background and text gradients), hexToHsl /
 *                        hslToHex / watermarkColor (derives the watermark's
 *                        color from the background so it stays legible
 *                        without needing its own color picker),
 *                        collectGradientColors (reads the live color-picker
 *                        DOM values for a 2-4 stop gradient -- only ever
 *                        called from render() itself, despite living near
 *                        the color-picker bindings in the pre-refactor
 *                        file; it's a rendering-time read, not UI wiring).
 *   Font/segment sizing  fontString, emphasisTracking (the noItalic-font
 *                        letter-spacing fallback), measureSegWidth.
 *   Per-run drawing       tintedEmojiCanvas (silhouette-tints one emoji
 *                        glyph via an offscreen canvas + source-atop),
 *                        resolvePartStyle (merges a Segmentation part's
 *                        custom color/effect into the base render style --
 *                        this is what lets drawTextRun stay unchanged
 *                        while still supporting per-segment overrides),
 *                        drawTextRun (the shared per-segment draw loop:
 *                        outline/shadow, the letter-spacing fallback,
 *                        underline/strikethrough, gradient fill, emoji
 *                        tint -- used identically for normal lines and
 *                        Segmentation-Operator chunks).
 *   Layout/measurement   measureLineWidth, fitTextSize (the auto-size
 *                        search), blockHeight.
 *   render()             THE public export and the whole point of this
 *                        file: reads every control's current DOM state,
 *                        calls buildLines() once, fits and draws every
 *                        line (including the split-alignment /
 *                        Segmentation-Operator branch), then the texture
 *                        layer, border, vignette, and watermark.
 *
 * Imports: $ and FONTS from appOptions.js; buildLines from textParsers.js;
 * getTextureCanvas from textureGenerators.js. Exports: render.
 */

import { $, FONTS } from './appOptions.js';
import { buildLines } from './textParsers.js';
import { getTextureCanvas } from './textureGenerators.js';


function isEmojiCodePoint(cp){
  return (cp>=0x1F300 && cp<=0x1FAFF) ||
         (cp>=0x2600 && cp<=0x27BF) ||
         (cp>=0x1F1E6 && cp<=0x1F1FF) ||
         (cp>=0x2B00 && cp<=0x2BFF) ||
         cp===0xFE0F || cp===0x200D || cp===0x20E3;
}
function segmentHasEmoji(text){
  for(const ch of text){ if(isEmojiCodePoint(ch.codePointAt(0))) return true; }
  return false;
}

// ---------- inline tokenizer (nesting-aware) ----------
// A stack-based scanner rather than a single regex pass — this is what actually
// makes **bold [accent] still bold** work: every character gets a snapshot of
// whichever styles are currently "open" on the stack, and consecutive characters
// with identical snapshots get coalesced into one run at the end. Handles bold,
// italic, underline, strikethrough, both accent colors, and the hidden gradient
// wraps {[...]} / [{...]} — all freely combinable and nestable.

function collectGradientColors(color1, color2Id, color3Id, color4Id, stopCount){
  const colors = [color1, $(color2Id).value];
  if(stopCount >= 3) colors.push($(color3Id).value);
  if(stopCount >= 4) colors.push($(color4Id).value);
  return colors;
}

function makeGradient(ctx, w, h, angleDeg, colors){
  const rad = angleDeg * Math.PI/180;
  const cx = w/2, cy = h/2;
  const len = Math.sqrt(w*w+h*h)/2;
  const x0 = cx - Math.cos(rad)*len, y0 = cy - Math.sin(rad)*len;
  const x1 = cx + Math.cos(rad)*len, y1 = cy + Math.sin(rad)*len;
  const g = ctx.createLinearGradient(x0,y0,x1,y1);
  colors.forEach((c,i)=>{ g.addColorStop(colors.length>1 ? i/(colors.length-1) : 0, c); });
  return g;
}


function fontString(fontDef, seg, size){
  const weight = seg.bold ? '700' : fontDef.weight;
  const useItalic = seg.italic && !fontDef.noItalic;
  const italic = useItalic ? 'italic ' : '';
  return `${italic}${weight} ${size}px "${fontDef.family}"`;
}

// For fonts with no italic face at all (e.g. Cinzel — Roman capitals never had a
// cursive form), *italic* markup and > quote lines fall back to letter-spaced
// "spaced caps" emphasis instead — a period-appropriate stand-in, and also just
// how classical inscriptional type actually signals emphasis without slanting.
function emphasisTracking(fontDef, seg, size){
  return (fontDef.noItalic && seg.italic) ? size*0.14 : 0;
}

function measureSegWidth(ctx, fontDef, seg, size){
  ctx.font = fontString(fontDef, seg, size);
  const tracking = emphasisTracking(fontDef, seg, size);
  if(tracking === 0) return ctx.measureText(seg.text).width;
  let w = 0;
  for(const ch of seg.text) w += ctx.measureText(ch).width + tracking;
  return w;
}

// Canvas glyphs for emoji ignore fillStyle entirely (they're full-color bitmap
// glyphs, not shape-based). To "colorize" one: draw it once to a transparent
// offscreen canvas, then flat-fill with 'source-atop' so the new color only
// lands where the glyph itself has any alpha — a silhouette tint.
function tintedEmojiCanvas(ch, font, fillStyle, size){
  const dim = Math.ceil(size*2);
  const off = document.createElement('canvas');
  off.width = dim; off.height = dim;
  const octx = off.getContext('2d');
  octx.font = font;
  octx.textBaseline = 'top';
  octx.textAlign = 'left';
  octx.fillStyle = '#000';
  octx.fillText(ch, 0, 0);
  octx.globalCompositeOperation = 'source-atop';
  octx.fillStyle = fillStyle;
  octx.fillRect(0,0,dim,dim);
  return off;
}

// Draws one run of segments (a whole line, or one chunk of a split-alignment
// line) starting at startX/cursorY. Handles outline/shadow, the no-italic-font
// letter-spacing fallback, underline/strikethrough, per-segment gradient fill
// (for the {[...]}/[{...]} hidden feature), and emoji colorization — all as one
// shared path so normal lines and split-alignment chunks render identically.
function resolvePartStyle(part, baseStyle){
  if(!part.customColor && !part.customEffect && !part.customGradient) return baseStyle;
  const s = { ...baseStyle };
  if(part.customColor){
    s.baseFillStyle = part.customColor;
    s.accent1Color = part.customColor;
    s.accent2Color = part.customColor;
  }
  if(part.customGradient){
    s.customGradientColors = part.customGradient;
  }
  if(part.customEffect){
    if(part.customEffect.type==='none'){
      s.outlineMode = 'off';
    } else if(part.customEffect.type==='outline'){
      s.outlineMode = 'outline';
      s.outlineColor = part.customEffect.color;
      s.outlineWidth = part.customEffect.width;
    } else if(part.customEffect.type==='shadow'){
      s.outlineMode = 'shadow';
      s.outlineColor = part.customEffect.color;
      s.shadowBlur = part.customEffect.blur;
      s.shadowX = part.customEffect.x;
      s.shadowY = part.customEffect.y;
    }
  }
  return s;
}

function drawTextRun(ctx, segments, startX, cursorY, size, lineHeight, fontDef, style){
  const { outlineMode, outlineColor, outlineWidth, shadowBlur, shadowX, shadowY,
          baseFillStyle, accent1Color, accent2Color, quoteAlpha } = style;

  const widths = segments.map(seg=>measureSegWidth(ctx, fontDef, seg, size));
  let x = startX;

  for(let i=0;i<segments.length;i++){
    const seg = segments[i];
    const w = widths[i];
    ctx.save();
    ctx.font = fontString(fontDef, seg, size);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.globalAlpha = quoteAlpha;

    let segFill = baseFillStyle;
    if(style.customGradientColors && style.customGradientColors.length>=2){
      const colors = style.customGradientColors;
      const g = ctx.createLinearGradient(x, cursorY, x+Math.max(w,1), cursorY);
      colors.forEach((c,idx)=>{ g.addColorStop(idx/(colors.length-1), c); });
      segFill = g;
    } else if(seg.color==='accent1') segFill = accent1Color;
    else if(seg.color==='accent2') segFill = accent2Color;
    else if(seg.color==='gradFwd' || seg.color==='gradRev'){
      const c1 = seg.color==='gradFwd' ? accent1Color : accent2Color;
      const c2 = seg.color==='gradFwd' ? accent2Color : accent1Color;
      const g = ctx.createLinearGradient(x, cursorY, x+Math.max(w,1), cursorY);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      segFill = g;
    } else if(seg.color==='lgAccent1' || seg.color==='rgAccent1' || seg.color==='lgAccent2' || seg.color==='rgAccent2'){
      const accentColor = (seg.color==='lgAccent1' || seg.color==='rgAccent1') ? accent1Color : accent2Color;
      const isLeftGrad = seg.color==='lgAccent1' || seg.color==='lgAccent2';
      const c1 = isLeftGrad ? style.plainTextColor : accentColor;
      const c2 = isLeftGrad ? accentColor : style.plainTextColor;
      const g = ctx.createLinearGradient(x, cursorY, x+Math.max(w,1), cursorY);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      segFill = g;
    }

    const emojiTint = style.customGradientColors && style.customGradientColors.length>=2
      ? (m=>`rgb(${m.r},${m.g},${m.b})`)(mixHex(style.customGradientColors[0], style.customGradientColors[style.customGradientColors.length-1], 0.5))
      : (seg.color==='accent1') ? accent1Color
      : (seg.color==='accent2') ? accent2Color
      : (seg.color==='gradFwd' || seg.color==='gradRev' || seg.color==='lgAccent1' || seg.color==='rgAccent1' || seg.color==='lgAccent2' || seg.color==='rgAccent2')
        ? (seg.color==='lgAccent1' || seg.color==='rgAccent1' ? accent1Color : seg.color==='lgAccent2' || seg.color==='rgAccent2' ? accent2Color
          : (m=>`rgb(${m.r},${m.g},${m.b})`)(mixHex(accent1Color, accent2Color, 0.5)))
        : null;
    const hasEmoji = emojiTint && segmentHasEmoji(seg.text);

    const tracking = emphasisTracking(fontDef, seg, size);

    const applyOutlineShadow = (str, px)=>{
      if(outlineMode==='outline' && outlineWidth>0){
        ctx.lineJoin='round'; ctx.miterLimit=2;
        ctx.lineWidth = outlineWidth*2;
        ctx.strokeStyle = outlineColor;
        ctx.shadowColor='transparent'; ctx.shadowBlur=0;
        ctx.strokeText(str, px, cursorY);
      }
      if(outlineMode==='shadow'){
        ctx.shadowColor = outlineColor; ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = shadowX; ctx.shadowOffsetY = shadowY;
      } else {
        ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetX=0; ctx.shadowOffsetY=0;
      }
    };

    if(tracking === 0 && !hasEmoji){
      applyOutlineShadow(seg.text, x);
      ctx.fillStyle = segFill;
      ctx.fillText(seg.text, x, cursorY);
    } else {
      let cx = x;
      for(const ch of seg.text){
        const chW = ctx.measureText(ch).width;
        if(hasEmoji && isEmojiCodePoint(ch.codePointAt(0))){
          const tinted = tintedEmojiCanvas(ch, ctx.font, emojiTint, size);
          ctx.shadowColor='transparent'; ctx.shadowBlur=0;
          ctx.drawImage(tinted, cx, cursorY);
        } else {
          applyOutlineShadow(ch, cx);
          ctx.fillStyle = segFill;
          ctx.fillText(ch, cx, cursorY);
        }
        cx += chW + tracking;
      }
    }

    if(seg.underline || seg.strike){
      const lineY = seg.underline ? cursorY + size*0.92 : cursorY + size*0.55;
      ctx.beginPath();
      ctx.moveTo(x, lineY);
      ctx.lineTo(x+w, lineY);
      ctx.strokeStyle = segFill;
      ctx.lineWidth = Math.max(1, size*0.045);
      ctx.stroke();
    }

    ctx.restore();
    x += w;
  }
  return x;
}

function measureLineWidth(ctx, line, baseSize, fontDef){
  const size = baseSize*line.scale;
  if(line.parts){
    let total = 0;
    for(const part of line.parts){
      const partFontDef = (part.customFontIdx!=null && FONTS[part.customFontIdx]) ? FONTS[part.customFontIdx] : fontDef;
      const partSize = part.customSize!=null ? part.customSize : size;
      for(const seg of part.segments){
        ctx.font = fontString(partFontDef, seg, partSize);
        total += ctx.measureText(seg.text).width;
      }
    }
    return total;
  }
  let total = 0;
  for(const seg of line.segments){
    ctx.font = fontString(fontDef, seg, size);
    total += ctx.measureText(seg.text).width;
  }
  return total;
}

function fitTextSize(ctx, lines, fontDef, maxWidth, maxHeight, maxSizePx, spacing){
  let size = maxSizePx;
  const minSize = 8;
  while(size > minSize){
    let maxLineWidth = 0, totalHeight = 0;
    for(const line of lines){
      if(line.isBlank){ totalHeight += size*0.55*spacing; continue; }
      totalHeight += size*line.scale*1.32*spacing;
      const w = measureLineWidth(ctx, line, size, fontDef);
      if(w > maxLineWidth) maxLineWidth = w;
    }
    if(maxLineWidth <= maxWidth && totalHeight <= maxHeight) return size;
    size -= 2;
  }
  return minSize;
}

function blockHeight(lines, size, spacing){
  let total = 0;
  for(const line of lines) total += line.isBlank ? size*0.55*spacing : size*line.scale*1.32*spacing;
  return total;
}

// ---------- color math for watermark ----------
function hexToHsl(hex){
  hex = hex.replace('#','');
  const r=parseInt(hex.substr(0,2),16)/255, g=parseInt(hex.substr(2,2),16)/255, b=parseInt(hex.substr(4,2),16)/255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h=0,s=0, l=(max+min)/2;
  if(max!==min){
    const d = max-min;
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h=(g-b)/d+(g<b?6:0); break;
      case g: h=(b-r)/d+2; break;
      case b: h=(r-g)/d+4; break;
    }
    h/=6;
  }
  return {h:h*360, s:s*100, l:l*100};
}
function hslToHex(h,s,l){
  h=((h%360)+360)%360; s=Math.max(0,Math.min(100,s))/100; l=Math.max(0,Math.min(100,l))/100;
  const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2;
  let r,g,b;
  if(h<60){r=c;g=x;b=0;} else if(h<120){r=x;g=c;b=0;} else if(h<180){r=0;g=c;b=x;}
  else if(h<240){r=0;g=x;b=c;} else if(h<300){r=x;g=0;b=c;} else {r=c;g=0;b=x;}
  const toHex = v=>Math.round((v+m)*255).toString(16).padStart(2,'0');
  return '#'+toHex(r)+toHex(g)+toHex(b);
}
function watermarkColor(bgHex){
  const {h,s,l} = hexToHsl(bgHex);
  const newH = h+10;
  const newS = Math.max(0, s-10);
  const newL = l>50 ? Math.max(0,l-15) : Math.min(100,l+15);
  return hslToHex(newH,newS,newL);
}

// ---------- texture generation ----------
export function render(){
  const W = canvas.width, H = canvas.height;

  const bg1 = $('bgColor1Hex').value;
  if($('bgGradientToggle').checked){
    const colors = collectGradientColors(bg1, 'bgColor2Hex', 'bgColor3Hex', 'bgColor4Hex', bgStopCount);
    ctx.fillStyle = makeGradient(ctx, W, H, parseFloat($('bgGradientAngle').value), colors);
  } else {
    ctx.fillStyle = bg1;
  }
  ctx.fillRect(0,0,W,H);

  if($('textureToggle').checked){
    const type = $('textureType').value;
    const opacity = Math.max(0, parseFloat($('textureOpacity').value) || 0) / 100;
    const accent1Color = $('accent1ColorHex').value;
    const accent2Color = $('accent2ColorHex').value;
    const invert = $('textureInvert').checked;
    const seed = parseInt($('textureSeedValue').value, 10) || 0;

    if(type === 'astral'){
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = 'overlay';
      ctx.drawImage(getTextureCanvas('astral_fog', W, H, null, null, invert, seed), 0, 0);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = invert ? 'darken' : 'lighten';
      ctx.drawImage(getTextureCanvas('astral_stars', W, H, accent1Color, accent2Color, invert, seed), 0, 0);
      ctx.restore();
    } else if(type === 'inkbleed' || type === 'alienSurface' || type === 'habitableSurface'){
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = invert ? 'color-dodge' : 'color-burn';
      ctx.drawImage(getTextureCanvas(type, W, H, null, null, invert, seed), 0, 0);
      ctx.restore();
    } else if(type === 'embers' || type === 'magicparticles' || type === 'snow'){
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = invert ? 'darken' : 'lighten';
      ctx.drawImage(getTextureCanvas(type, W, H, accent1Color, accent2Color, invert, seed), 0, 0);
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = 'overlay';
      ctx.drawImage(getTextureCanvas(type, W, H, null, null, invert, seed), 0, 0);
      ctx.restore();
    }
  }

  // --- vignette (drawn here, before border/text, so it only affects the
  // background+texture layers underneath rather than the whole composed image) ---
  if($('vignetteToggle').checked){
    const intensity = Math.max(0, parseFloat($('vignetteIntensity').value) || 0) / 100;
    const blend = $('vignetteBlend').value;
    const vcx = W/2, vcy = H/2;
    const outerR = Math.sqrt(W*W+H*H)/2;
    const vgrad = ctx.createRadialGradient(vcx,vcy,outerR*0.35, vcx,vcy,outerR*1.05);
    // lighten/color-dodge are brightening blend modes — a black source is
    // mathematically a no-op for both (lighten never picks black over anything
    // brighter, and color-dodge's dst/(1-src) reduces to plain dst when src=0).
    // They need a white source to have any visible effect at all.
    const vignetteRGB = (blend === 'lighten' || blend === 'color-dodge') ? '255,255,255' : '0,0,0';
    vgrad.addColorStop(0, `rgba(${vignetteRGB},0)`);
    vgrad.addColorStop(1, `rgba(${vignetteRGB},${intensity})`);
    ctx.save();
    ctx.globalCompositeOperation = blend;
    ctx.fillStyle = vgrad;
    ctx.fillRect(0,0,W,H);
    ctx.restore();
  }

  if($('borderToggle').checked){
    const bColor = $('borderColorHex').value;
    const bThick = Math.max(1, parseFloat($('borderThickness').value) || 1);
    const bOffset = Math.max(0, parseFloat($('borderOffset').value) || 0);
    ctx.lineWidth = bThick;
    ctx.strokeStyle = bColor;
    const inset = bOffset + bThick/2;
    ctx.strokeRect(inset, inset, W - inset*2, H - inset*2);
  }

  // --- text prep ---
  const accent1On = $('accent1Toggle').checked;
  const accent2On = $('accent2Toggle').checked;
  const accent1Color = $('accent1ColorHex').value;
  const accent2Color = $('accent2ColorHex').value;

  const rawText = $('poemText').value;
  const lines = buildLines(rawText, accent1On, accent2On);

  const fontDef = FONTS[fontSelect.value];
  const maxSizePx = Math.max(10, parseFloat($('maxSize').value) || 120);
  const lineSpacing = Math.pow(2, parseFloat($('lineSpacing').value) || 0);

  const paddingX = W*0.09;
  const paddingY = H*0.07;
  const maxWidth = W - paddingX*2;
  const maxHeight = H - paddingY*2;

  const baseSize = fitTextSize(ctx, lines, fontDef, maxWidth, maxHeight, maxSizePx, lineSpacing);
  const totalHeight = blockHeight(lines, baseSize, lineSpacing);

  let startY;
  if(currentValign==='top') startY = paddingY;
  else if(currentValign==='bottom') startY = paddingY + (maxHeight - totalHeight);
  else startY = paddingY + (maxHeight - totalHeight)/2;
  startY = Math.max(paddingY, startY);

  let baseFillStyle;
  if($('textGradientToggle').checked){
    const textColors = collectGradientColors($('textColorHex').value, 'textColor2Hex', 'textColor3Hex', 'textColor4Hex', textStopCount);
    baseFillStyle = makeGradient(ctx, W, H, parseFloat($('textGradientAngle').value), textColors);
  } else {
    baseFillStyle = $('textColorHex').value;
  }

  const outlineMode = $('outlineMode').value;
  const outlineColor = $('outlineColorHex').value;
  const outlineWidth = Math.max(0, parseFloat($('outlineThickness').value) || 0);
  const shadowBlur = Math.max(0, parseFloat($('shadowBlur').value) || 0);
  const shadowX = parseFloat($('shadowX').value) || 0;
  const shadowY = parseFloat($('shadowY').value) || 0;

  let cursorY = startY;
  ctx.textBaseline = 'top';

  const runStyle = { outlineMode, outlineColor, outlineWidth, shadowBlur, shadowX, shadowY, baseFillStyle, plainTextColor: $('textColorHex').value, accent1Color, accent2Color, quoteAlpha: 1 };

  for(const line of lines){
    if(line.isBlank){ cursorY += baseSize*0.55*lineSpacing; continue; }
    const size = baseSize*line.scale;
    const lineHeight = size*1.32*lineSpacing;
    const style = { ...runStyle, quoteAlpha: line.type==='quote' ? 0.68 : 1 };

    if(line.parts){
      const flowingParts = line.parts.filter(p=>p.justify===null);
      const anchoredParts = line.parts.filter(p=>p.justify!==null);

      const partFont = p => (p.customFontIdx!=null && FONTS[p.customFontIdx]) ? FONTS[p.customFontIdx] : fontDef;
      const partSizeOf = p => p.customSize!=null ? p.customSize : size;
      const partWidth = p => p.segments.reduce((sum,seg)=>sum+measureSegWidth(ctx, partFont(p), seg, partSizeOf(p)), 0);

      // Flowing parts render as one continuous sequence, positioned as a whole
      // block using the line's own alignment — this is what makes "plain text
      // <right side/r>" read as normal flowing text plus one anchored chunk,
      // rather than every plain segment being independently pinned to the
      // left margin.
      const flowingTotalWidth = flowingParts.reduce((sum,p)=>sum+partWidth(p), 0);
      const lineAlign = line.alignOverride || currentAlign;
      let flowX = lineAlign==='center' ? (W/2 - flowingTotalWidth/2)
        : lineAlign==='right' ? (W - paddingX - flowingTotalWidth)
        : paddingX;

      if(line.type==='quote'){
        const barWidth = Math.max(2, size*0.06);
        const barGap = size*0.35;
        ctx.fillStyle = accent1On ? accent1Color : (outlineMode!=='off' ? outlineColor : baseFillStyle);
        ctx.fillRect(flowX - barGap - barWidth, cursorY + size*0.05, barWidth, lineHeight*0.85);
      }

      for(const part of flowingParts){
        const pStyle = resolvePartStyle(part, style);
        flowX = drawTextRun(ctx, part.segments, flowX, cursorY, partSizeOf(part), lineHeight, partFont(part), pStyle);
      }

      for(const part of anchoredParts){
        const pWidth = partWidth(part);
        const pX = part.justify==='center' ? (W/2 - pWidth/2)
          : part.justify==='right' ? (W - paddingX - pWidth)
          : paddingX;
        const pStyle = resolvePartStyle(part, style);
        drawTextRun(ctx, part.segments, pX, cursorY, partSizeOf(part), lineHeight, partFont(part), pStyle);
      }

      cursorY += lineHeight;
      continue;
    }

    const totalWidth = line.segments.reduce((sum,seg)=>sum+measureSegWidth(ctx, fontDef, seg, size), 0);
    const lineAlign = line.alignOverride || currentAlign;
    const startX = lineAlign==='center' ? (W/2 - totalWidth/2) : (lineAlign==='right' ? (W - paddingX - totalWidth) : paddingX);

    if(line.type==='quote'){
      const barWidth = Math.max(2, size*0.06);
      const barGap = size*0.35;
      ctx.fillStyle = accent1On ? accent1Color : (outlineMode!=='off' ? outlineColor : baseFillStyle);
      ctx.fillRect(startX - barGap - barWidth, cursorY + size*0.05, barWidth, lineHeight*0.85);
    }

    drawTextRun(ctx, line.segments, startX, cursorY, size, lineHeight, fontDef, style);
    cursorY += lineHeight;
  }

  // --- watermark ---
  const username = ($('usernameField').value.trim()) || '';
  const corner = $('usernameCorner').value;
  const isTop = corner.startsWith('top');
  const isRight = corner.endsWith('right');
  const wmColor = watermarkColor(bg1);
  ctx.save();
  ctx.font = `${fontDef.weight} ${Math.round(((W + H)/2)*0.01)}px "${fontDef.family}"`;
  ctx.fillStyle = wmColor;
  ctx.globalAlpha = 0.85;
  ctx.textAlign = isRight ? 'right' : 'left';
  ctx.textBaseline = isTop ? 'top' : 'alphabetic';
  ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetX=0; ctx.shadowOffsetY=0;
  const wmX = isRight ? (W - W*0.035) : (W*0.035);
  const wmY = isTop ? (H*0.025) : (H - H*0.025);
  ctx.fillText(username, wmX, wmY);
  ctx.restore();
}
