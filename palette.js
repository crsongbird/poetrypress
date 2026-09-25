/**
 * palette.js — the colour picker's suggested swatches.
 *
 * Builds fifteen related colours from the current look, so the picker offers
 * choices that belong to the page. On near-neutral colours a hue shift does
 * nothing, so it varies lightness and warmth there instead.
 */
import { hexToHsl, hslToHex } from './canvasRenderer.js';

// Derives a 15-color Coloris swatch palette from a theme's own colors, so
// the color picker's swatches change to match whichever preset is active
// (a 16th, the color currently being edited, gets appended live -- see the
// 'open' event listener near the bottom of this file).
//
//   6 base colors   — text1, text2, accent1, accent2, bg1, bg2 (text2/bg2
//                     fall back to a derived tone for presets with no
//                     gradient second stop, so every theme yields 6)
//   3 relationships — complementary of text1, a triadic point from accent1,
//                     a tonal sibling of bg1
//   6 tonal siblings — one per base color, nudged lighter+more saturated if
//                     it's currently dark, darker+less saturated if light
//                     (the same "move toward a punchier midtone" rule
//                     watermarkColor() already uses, just reused here)
//
// 6 + 3 + 6 = 15.
export function tonalSibling(hex){
  const {h,s,l} = hexToHsl(hex);
  const lNudge = l > 50 ? -18 : 18;
  const sNudge = l > 50 ? -12 : 12;
  return hslToHex(h, Math.max(0,Math.min(100, s+sNudge)), Math.max(0,Math.min(100, l+lNudge)));
}

export function hueShift(hex, degrees){
  const {h,s,l} = hexToHsl(hex);
  // On a near-neutral colour a hue shift does essentially nothing -- rotate
  // grey and you get grey. The 🜚 Touch presets are neutral by design, so
  // without this branch all fifteen of their swatches collapse into the same
  // beige. Vary lightness and warmth instead, which is what actually
  // separates one neutral from another.
  if(s < 12){
    const warm = ((degrees % 360) + 360) % 360 < 180;
    const lShift = (degrees / 180) * 22;
    return hslToHex(warm ? 34 : 210,
                    Math.min(100, s + 7 + Math.abs(degrees)/40),
                    Math.max(4, Math.min(96, l + (l > 50 ? -lShift : lShift))));
  }
  return hslToHex(h+degrees, s, l);
}

export function deriveThemePalette({text1, text2, accent1, accent2, bg1, bg2}){
  const t2 = text2 || hueShift(text1, 30);
  const b2 = bg2 || tonalSibling(bg1);
  const base = [text1, t2, accent1, accent2, bg1, b2];

  const complementaryOfText = hueShift(text1, 180);
  const triadicOfAccent = hueShift(accent1, 120);
  const bgVariant = tonalSibling(bg1);

  return [...base, complementaryOfText, triadicOfAccent, bgVariant, ...base.map(tonalSibling)];
}
