/**
 * appOptions.js — shared data tables and the one universal DOM helper.
 *
 * TABLE OF CONTENTS
 *   FONTS    — every selectable font: display label, CSS family, weight,
 *              and (for Cinzel/Unica One) a noItalic flag. Index position
 *              matters: the Segmentation Operator's f:N directive and each
 *              preset's `font` field both resolve against this array.
 *   PRESETS  — the 12 built-in Elements: four Whimsy, four Sharpness,
 *              four Chaos, in that order (the grid reads left to right,
 *              so the order is the grouping). Each entry is grouped into
 *              background / text / effects / font / texture / accents /
 *              border fields (only the fields that preset actually uses —
 *              most presets omit most of these). Order matters: it fills
 *              the on-screen preset grid row by row, 4 per row.
 *   ASPECTS  — the 6 selectable aspect ratios, each mapped to its actual
 *              canvas pixel dimensions.
 *   $()      — document.getElementById shorthand, used everywhere. Lives
 *              here (rather than in appEvents.js) specifically because
 *              this file has zero imports of its own — every other module
 *              can safely import $ from here with no risk of a circular
 *              dependency.
 *   getActiveRadioValue(containerId) — reads whichever .radio-btn in a
 *              radio-group currently has the .active class. Exists so
 *              canvasRenderer.js can read the current justification /
 *              gradient-stop-count directly from the DOM at render time,
 *              the same way it reads every other control — rather than
 *              needing a live mutable binding shared with appEvents.js
 *              (which set off a real bug: canvasRenderer.js used to read
 *              a bare currentAlign/bgStopCount identifier that only ever
 *              existed as a local variable in appEvents.js).
 *
 * This module has NO imports. Every other file in the app may import from
 * it; it must never import from any of them.
 */

export const FONTS = [
  { label:"Bodoni Moda (serif)", family:"Bodoni Moda", weight:"700" }, // Silver Wake, Reverse Time
  { label:"Cormorant Garamond (serif)", family:"Cormorant Garamond", weight:"600" }, // Somnus, Lotus
  { label:"Crimson Pro (serif)", family:"Crimson Pro", weight:"600" },
  { label:"EB Garamond (serif)", family:"EB Garamond", weight:"500" }, // Calm Repose
  { label:"Literata (serif)", family:"Literata", weight:"400" },
  { label:"Playfair Display (serif)", family:"Playfair Display", weight:"400" }, // Gold Leaf
  { label:"Merriweather (serif)", family:"Merriweather", weight:"400" },
  { label:"Courier Prime (mono)", family:"Courier Prime", weight:"700" },
  { label:"Space Mono (mono)", family:"Space Mono", weight:"400" }, // Non-Euclid
  { label:"JetBrains Mono (mono)", family:"JetBrains Mono", weight:"400" },
  { label:"Cinzel (gothic)", family:"Cinzel", weight:"500", noItalic:true }, // Quintessence, Desire
  { label:"Oswald (gothic)", family:"Oswald", weight:"400" },
  { label:"Architects Daughter (handwritten)", family:"Architects Daughter", weight:"400" },
  { label:"Caveat (handwritten)", family:"Caveat", weight:"700" },
  { label:"Shadows Into Light (handwritten)", family:"Shadows Into Light", weight:"500" },
  { label:"Inter (sans)", family:"Inter", weight:"400" },
  { label:"Poppins (sans)", family:"Poppins", weight:"400" }, // Euphoria
  { label:"Nunito (sans)", family:"Nunito", weight:"400" },
  { label:"Roboto (sans)", family:"Roboto", weight:"400" },
  { label:"Work Sans (sans)", family:"Work Sans", weight:"400" },
  { label:"Josefin Sans (futuristic)", family:"Josefin Sans", weight:"400" },
  { label:"Unica One (futuristic)", family:"Unica One", weight:"400", noItalic:true }, // Starlight Receding, Enochian
];

export const PRESETS = [
  // ---- WHIMSY ----  red/purple/blue gradients, starlight in motion, sleep
  { name: "Quintessence",
    bg1: "#1A0B2E", bgGradient: true, bg2: "#2D1B69", bgAngle: 135,
    text1: "#F5F0FF",
    outlineMode: "off",
    font: "Cinzel",
    texture: true, textureType: "astral", textureOpacity: 34,
    accent1: "#D4AF37", accent2: "#9B7FE8",
    border: true, borderColor: "#D4AF37", borderThickness: 2, borderOffset: 14
  },
  { name: "Starlight Receding",
    bg1: "#050318", bgGradient: true, bg2: "#1B1040", bgAngle: 120,
    text1: "#E8E0FF", textGradient: true, text2: "#A98CFF", textAngle: 45,
    outlineMode: "shadow", outlineColor: "#6C5CE7", shadowBlur: 24, shadowX: 0, shadowY: 0,
    font: "Unica One",
    texture: true, textureType: "bokeh", textureOpacity: 26,
    accent1: "#C9B8FF", accent2: "#6C5CE7"
  },
  { name: "Euphoria",
    bg1: "#3D0A4E", bgGradient: true, bg2: "#8C1B6B", bgAngle: 45,
    text1: "#FFF0FA",
    outlineMode: "off",
    font: "Poppins",
    texture: true, textureType: "magicparticles", textureOpacity: 30,
    accent1: "#FF6FD8", accent2: "#7B5CFF"
  },
  { name: "Somnus",
    bg1: "#0A0E2A", bgGradient: true, bg2: "#16204D", bgAngle: 160,
    text1: "#C8D4FF",
    outlineMode: "off",
    font: "Cormorant Garamond",
    texture: true, textureType: "clouds", textureOpacity: 30,
    accent1: "#8FA8FF", accent2: "#5C6CE7"
  },

  // ---- SHARPNESS ----  off-white against blue-black, silver and gold at the edges
  { name: "Calm Repose",
    bg1: "#F2F0E9",
    text1: "#0D1017",
    outlineMode: "off",
    font: "EB Garamond",
    texture: true, textureType: "grain", textureOpacity: 24,
    accent1: "#9AA3B0", accent2: "#C9A227",
    border: true, borderColor: "#9AA3B0", borderThickness: 2, borderOffset: 12
  },
  { name: "Silver Wake",
    bg1: "#0D1017",
    text1: "#F2F0E9",
    outlineMode: "off",
    font: "Bodoni Moda",
    texture: true, textureType: "snow", textureOpacity: 22,
    accent1: "#C0C8D4", accent2: "#7E8794",
    border: true, borderColor: "#C0C8D4", borderThickness: 1, borderOffset: 16
  },
  { name: "Gold Leaf",
    bg1: "#0B0E14",
    text1: "#F5F1E6",
    outlineMode: "off",
    font: "Playfair Display",
    texture: true, textureType: "metalleaf", textureOpacity: 32,
    accent1: "#D4AF37", accent2: "#8C6D1F",
    border: true, borderColor: "#D4AF37", borderThickness: 2, borderOffset: 10
  },
  { name: "Lotus",
    bg1: "#EDEFF2",
    text1: "#141A24",
    outlineMode: "off",
    font: "Cormorant Garamond",
    texture: true, textureType: "flowers", textureOpacity: 20,
    accent1: "#A8B4C4", accent2: "#C9A227"
  },

  // ---- CHAOS ----  sigils, math-noise, geometry twisting where reality thins
  { name: "Desire",
    bg1: "#0A0000", bgGradient: true, bg2: "#2A0505", bgAngle: 90,
    text1: "#E8DCDC",
    outlineMode: "off",
    font: "Cinzel",
    texture: true, textureType: "sigils", textureOpacity: 36,
    accent1: "#C41E3A", accent2: "#6B0F1A"
  },
  { name: "Enochian",
    bg1: "#05070A",
    text1: "#C9B87A",
    outlineMode: "off",
    font: "Unica One",
    texture: true, textureType: "mathnoise", textureOpacity: 40,
    accent1: "#D4AF37", accent2: "#4A5568"
  },
  { name: "Non-Euclid",
    bg1: "#041418", bgGradient: true, bg2: "#1A0A2E", bgAngle: 200,
    text1: "#B8F0E8",
    outlineMode: "off",
    font: "Space Mono",
    texture: true, textureType: "tessellate", textureOpacity: 28,
    accent1: "#00E5C0", accent2: "#A855F7"
  },
  { name: "Reverse Time",
    bg1: "#14141A", bgGradient: true, bg2: "#0A0A0F", bgAngle: 270,
    text1: "#9AA0B0", textGradient: true, text2: "#3A3A4A", textAngle: 270,
    outlineMode: "outline", outlineColor: "#000000", outlineThickness: 1,
    font: "Bodoni Moda",
    texture: true, textureType: "crackedglaze", textureOpacity: 34,
    accent1: "#B03030", accent2: "#7A7A8C"
  },
];

export const ASPECTS = { "1:1":[3072,3072], "2:3":[2400,3600], "3:4":[2700,3600], "9:16":[2304,4096], "9:20":[1843,4096], "16:9":[4096,2304] };

export function $(id){ return document.getElementById(id); }

export function getActiveRadioValue(containerId){
  const group = document.getElementById(containerId);
  const active = group.querySelector('.radio-btn.active');
  return active ? active.dataset.val : null;
}
