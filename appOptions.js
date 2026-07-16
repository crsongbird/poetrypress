/**
 * appOptions.js — shared data tables and the one universal DOM helper.
 *
 * TABLE OF CONTENTS
 *   FONTS    — every selectable font: display label, CSS family, weight,
 *              and (for Cinzel/Unica One) a noItalic flag. Index position
 *              matters: the Segmentation Operator's f:N directive and each
 *              preset's `font` field both resolve against this array.
 *   PRESETS  — the 20 built-in themes. Each entry is grouped into
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
  { label:"Bodoni Moda (serif)", family:"Bodoni Moda", weight:"700" }, // Requiem 
  { label:"Cormorant Garamond (serif)", family:"Cormorant Garamond", weight:"600" }, // Boardwalk
  { label:"Crimson Pro (serif)", family:"Crimson Pro", weight:"600" }, // Quiet Rain
  { label:"EB Garamond (serif)", family:"EB Garamond", weight:"500" }, // Letterhead
  { label:"Literata (serif)", family:"Literata", weight:"400" }, // Tidewater
  { label:"Playfair Display (serif)", family:"Playfair Display", weight:"400" }, // Grimoire
  { label:"Merriweather (serif)", family:"Merriweather", weight:"400" }, // Firt Frost
  { label:"Courier Prime (mono)", family:"Courier Prime", weight:"700" }, // Sunset Diner
  { label:"Space Mono (mono)", family:"Space Mono", weight:"400" }, // Boiling Point
  { label:"JetBrains Mono (mono)", family:"JetBrains Mono", weight:"400" }, // Sherbert Sun
  { label:"Cinzel (gothic)", family:"Cinzel", weight:"500", noItalic:true }, // Midnight Page
  { label:"Oswald (gothic)", family:"Oswald", weight:"400" }, // Ember Fal
  { label:"Architects Daughter (handwritten)", family:"Architects Daughter", weight:"400" }, // Cotton Sky
  { label:"Caveat (handwritten)", family:"Caveat", weight:"700" }, // Candy Floss
  { label:"Shadows Into Light (handwritten)", family:"Shadows Into Light", weight:"500" }, // Petrichor
  { label:"Inter (sans)", family:"Inter", weight:"400" }, // Unused
  { label:"Poppins (sans)", family:"Poppins", weight:"400" }, // Understory
  { label:"Nunito (sans)", family:"Nunito", weight:"400" }, // Sherbert Sun
  { label:"Roboto (sans)", family:"Roboto", weight:"400" }, // Worn Thin
  { label:"Work Sans (sans)", family:"Work Sans", weight:"400" }, // Indigo Weave
  { label:"Josefin Sans (futuristic)", family:"Josefin Sans", weight:"400" }, // Night Pulse
  { label:"Unica One (futuristic)", family:"Unica One", weight:"400", noItalic:true }, // Deep Field
];

export const PRESETS = [
  { name: "Midnight Page",
    bg1: "#111113",
    text1: "#F2F2EF",
    outlineMode: "off",
    font: "Cinzel",
    texture: true, textureType: "tessellate", textureOpacity: 21,
    accent1: "#C9A876", accent2: "#7A8CA3",
    border: true, borderColor: "#C9A876", borderThickness: 2, borderOffset: 14
  },
  { name: "Letterhead",
    bg1: "#E7DECD",
    text1: "#1F1B16",
    outlineMode: "off",
    font: "EB Garamond",
    texture: true, textureType: "inkbleed", textureOpacity: 60,
    accent1: "#2E4A6B", accent2: "#7A2E2E",
    border: true, borderColor: "#2E4A6B", borderThickness: 2, borderOffset: 10
  },
  { name: "Deep Field",
    bg1: "#05040A", bgGradient: true, bg2: "#181233", bgAngle: 120,
    text1: "#F5F3FF", textGradient: true, text2: "#C9B8FF", textAngle: 45,
    outlineMode: "shadow", outlineColor: "#6C5CE7", shadowBlur: 22, shadowX: 0, shadowY: 0,
    font: "Unica One",
    texture: true, textureType: "astral", textureOpacity: 40,
    accent1: "#C9B8FF", accent2: "#8E5CD9",
    border: true, borderColor: "#8E5CD9", borderThickness: 2, borderOffset: 12
  },
  { name: "Understory",
    bg1: "#2F3E2E", bgGradient: true, bg2: "#4C6444", bgAngle: 135,
    text1: "#F1EAD6",
    outlineMode: "off",
    font: "Poppins",
    texture: true, textureType: "leaves", textureOpacity: 32,
    accent1: "#C9B36A", accent2: "#d2ffa3",
    border: true, borderColor: "#1c2620", borderThickness: 12, borderOffset: 0
  },
  { name: "Grimoire",
    bg1: "#1B0F2E", bgGradient: true, bg2: "#3B1F5C", bgAngle: 60,
    text1: "#F4D9A0", textGradient: true, text2: "#C9A876", textAngle: 30,
    outlineMode: "shadow", outlineColor: "#8E5CD9", shadowBlur: 20, shadowX: 0, shadowY: 0,
    font: "Playfair Display",
    texture: true, textureType: "noise", textureOpacity: 10,
    accent1: "#f3d5c9", accent2: "#8E5CD9",
    border: true, borderColor: "#F4D9A0", borderThickness: 2, borderOffset: 10
  },
  { name: "Candy Floss",
    bg1: "#FFD9E8", bgGradient: true, bg2: "#FFB6D5", bgAngle: 135,
    text1: "#7A2E4A",
    outlineMode: "off",
    font: "Caveat",
    texture: true, textureType: "bokeh", textureOpacity: 14,
    accent1: "#FF6FA5", accent2: "#FF0073",
    border: true, borderColor: "#FFD86B", borderThickness: 2, borderOffset: 6
  },
  { name: "Requiem",
    bg1: "#0A0A0C", bgGradient: true, bg2: "#1C1C22", bgAngle: 90,
    text1: "#9797a0", textGradient: true, text2: "#540000", textAngle: 261,
    outlineMode: "outline", outlineColor: "#420000", outlineThickness: 2,
    font: "Bodoni Moda",
    texture: true, textureType: "brushstrokes", textureOpacity: 35,
    accent1: "#B23A3A", accent2: "#C9C4BE",
    border: true, borderColor: "#C9C4BE", borderThickness: 1, borderOffset: 16
  },
  { name: "Sunset Diner",
    bg1: "#E8A33D", bgGradient: true, bg2: "#C9642F", bgAngle: 135,
    text1: "#FFF3D6",
    outlineMode: "outline", outlineColor: "#3D2411", outlineThickness: 4,
    font: "Courier Prime",
    texture: true, textureType: "paper", textureOpacity: 12,
    accent1: "#ffab77", accent2: "#9bb6eb",
    border: true, borderColor: "#3D2411", borderThickness: 3, borderOffset: 5
  },
  { name: "Night Pulse",
    bg1: "#08060F",
    text1: "#00F0FF", textGradient: true, text2: "#FF2FD1", textAngle: 45,
    outlineMode: "shadow", outlineColor: "#00F0FF", shadowBlur: 100, shadowX: 0, shadowY: 0,
    font: "Josefin Sans",
    texture: true, textureType: "halftone", textureOpacity: 55,
    accent1: "#bcfcff", accent2: "#FF2FD1",
    border: true, borderColor: "#CFFF04", borderThickness: 1, borderOffset: 14
  },
  { name: "Cotton Sky",
    bg1: "#8ED8FF", bgGradient: true, bg2: "#FFB3D1", bgAngle: 120,
    text1: "#3D2B6B",
    outlineMode: "shadow", outlineColor: "#B98AC9", shadowBlur: 14, shadowX: 0, shadowY: 0,
    font: "Architects Daughter",
    texture: true, textureType: "magicparticles", textureOpacity: 22,
    accent1: "#3e78ff", accent2: "#ff65de",
    border: true, borderColor: "#9b8ee7", borderThickness: 2, borderOffset: 8
  },
  { name: "Blue Jeans",
    bg1: "#2A3F5F", bgGradient: true, bg2: "#3C567D", bgAngle: 170,
    text1: "#F2F0E8",
    outlineMode: "shadow", outlineColor: "#0E1A2B", shadowBlur: 12, shadowX: 0, shadowY: 2,
    font: "Work Sans",
    texture: true, textureType: "canvas", textureOpacity: 14,
    accent1: "#C97A4A", accent2: "#ffd9d9",
    border: true, borderColor: "#C97A4A", borderThickness: 3, borderOffset: 6
  },
  { name: "Escape Sequence",
    bg1: "#0d3716", bgGradient: true, bg2: "#09150d", bgAngle: 0,
    text1: "#81ba76",
    outlineMode: "shadow", outlineColor: "#6bcb58", shadowBlur: 16, shadowX: 0, shadowY: 0,
    font: "JetBrains Mono",
    texture: true, textureType: "noise", textureOpacity: 33,
    accent1: "#ddffe0", accent2: "#6dff81",
    border: true, borderColor: "#061d10", borderThickness: 32, borderOffset: 0
  },
  { name: "Boiling Over",
    bg1: "#1A0000", bgGradient: true, bg2: "#5A0000", bgAngle: 90,
    text1: "#FFFFFF",
    outlineMode: "outline", outlineColor: "#000000", outlineThickness: 7,
    font: "Space Mono",
    texture: true, textureType: "embers", textureOpacity: 60,
    accent1: "#FF3B30", accent2: "#FF9F1C",
    border: true, borderColor: "#FF9F1C", borderThickness: 4, borderOffset: 5
  },
  { name: "Tidewater",
    bg1: "#012A36", bgGradient: true, bg2: "#0C5C6E", bgAngle: 135,
    text1: "#B8FFF0", textGradient: true, text2: "#5FD3C4", textAngle: 30,
    outlineMode: "shadow", outlineColor: "#00232C", shadowBlur: 16, shadowX: 0, shadowY: 0,
    font: "Literata",
    texture: true, textureType: "waterspots", textureOpacity: 21,
    accent1: "#FF8A65", accent2: "#E8D9B5",
    border: true, borderColor: "#E8D9B5", borderThickness: 2, borderOffset: 10
  },
  { name: "Quiet Rain",
    bg1: "#232B36", bgGradient: true, bg2: "#3E4A58", bgAngle: 160,
    text1: "#dcdcdc", text2: "#3a83ab", textAngle: 0,
    outlineMode: "shadow", outlineColor: "#0F141A", shadowBlur: 14, shadowX: 0, shadowY: 3,
    font: "Crimson Pro",
    texture: true, textureType: "rainstreaks", textureOpacity: 34,
    accent1: "#DCE3EA", accent2: "#7086a8",
    border: true, borderColor: "#bcc7d9", borderThickness: 2, borderOffset: 12
  },
  { name: "Worn Thin",
    bg1: "#151311", bgGradient: true, bg2: "#28221c", bgAngle: 219,
    text1: "#B9AFA0",
    outlineMode: "off",
    font: "Roboto",
    texture: true, textureType: "leather", textureOpacity: 30,
    accent1: "#9C6B4A", accent2: "#8A9482",
    border: true, borderColor: "#9C6B4A", borderThickness: 3, borderOffset: 7
  },
  { name: "Petrichor",
    bg1: "#3E5C4A", bgGradient: true, bg2: "#7C93A3", bgAngle: 100,
    text1: "#EAF2EC",
    outlineMode: "off",
    font: "Shadows Into Light",
    texture: true, textureType: "rainstreaks", textureOpacity: 30,
    accent1: "#C9D98A", accent2: "#9FB8C9",
    border: true, borderColor: "#9FB8C9", borderThickness: 2, borderOffset: 11
  },
  { name: "Boardwalk",
    bg1: "#8ED8F0", bgGradient: true, bg2: "#F0DFC0", bgAngle: 90,
    text1: "#2E4A55",
    outlineMode: "off",
    font: "Cormorant Garamond",
    texture: true, textureType: "grain", textureOpacity: 8,
    accent1: "#C9421F", accent2: "#137A5E",
    border: true, borderColor: "#7FCDBB", borderThickness: 2, borderOffset: 13
  },
  { name: "Ember Fall",
    bg1: "#4A2318", bgGradient: true, bg2: "#A8562E", bgAngle: 110,
    text1: "#F2D9A8",
    outlineMode: "off",
    font: "Oswald",
    texture: true, textureType: "leaves", textureOpacity: 28,
    accent1: "#E8A84A", accent2: "#F2C98A",
    border: true, borderColor: "#E8A84A", borderThickness: 3, borderOffset: 6
  },
  { name: "First Frost",
    bg1: "#D9E1E6", bgGradient: true, bg2: "#A9CFE8", bgAngle: 110,
    text1: "#1E3444",
    outlineMode: "shadow", outlineColor: "#9FC3DA", shadowBlur: 10, shadowX: 0, shadowY: 0,
    font: "Merriweather",
    texture: true, textureType: "snow", textureOpacity: 35,
    accent1: "#1C6690", accent2: "#B2416A",
    border: true, borderColor: "#77b3e8", borderThickness: 2, borderOffset: 15
  },
];

export const ASPECTS = { "1:1":[3072,3072], "2:3":[2400,3600], "3:4":[2700,3600], "9:16":[2304,4096], "9:20":[1843,4096], "16:9":[4096,2304] };

export function $(id){ return document.getElementById(id); }

export function getActiveRadioValue(containerId){
  const group = document.getElementById(containerId);
  const active = group.querySelector('.radio-btn.active');
  return active ? active.dataset.val : null;
}
