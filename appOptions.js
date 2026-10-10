/**
 * appOptions.js — shared data tables and the one universal DOM helper.
 *
 * TABLE OF CONTENTS
 *   FONTS    — every selectable font: display label, CSS family, weight,
 *              and (for Cinzel/Unica One) a noItalic flag. Index position
 *              matters: the Segmentation Operator's f:N directive and each
 *              preset's `font` field both resolve against this array.
 *   PRESETS  — 36 built-in looks: four Simple ones first (light to read
 *              and quick to draw), then eight each of Whimsy, Sharpness,
 *              Chaos and Touch (PRESET_GROUPS heads each group in the
 *              grid; the order is the grouping). Each entry is grouped into
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
 *              needing a live mutable binding shared with appEvents.js.
 *
 * This module has NO imports. Every other file in the app may import from
 * it; it must never import from any of them.
 */

// Labels read "Style · Family", so the list reads like a type specimen.
// ORDER IS FROZEN: PML's /f:N selects a font by its position here, so new
// fonts are only ever appended — inserting one would change existing poems.
export const FONTS = [
  { label:"Didone · Bodoni Moda", family:"Bodoni Moda", weight:"700" }, // Silver Wake, Reverse Time
  { label:"Old-Style · Cormorant Garamond", family:"Cormorant Garamond", weight:"600" }, // Somnus, Lotus
  { label:"Book · Crimson Pro", family:"Crimson Pro", weight:"600" },
  { label:"Old-Style · EB Garamond", family:"EB Garamond", weight:"500" }, // Calm Repose
  { label:"Book · Literata", family:"Literata", weight:"400" },
  { label:"Didone · Playfair Display", family:"Playfair Display", weight:"400" }, // Gold Leaf
  { label:"Book · Merriweather", family:"Merriweather", weight:"400" },
  { label:"Typewriter · Courier Prime", family:"Courier Prime", weight:"700" },
  { label:"Mono · Space Mono", family:"Space Mono", weight:"400" }, // Non-Euclid
  { label:"Mono · JetBrains Mono", family:"JetBrains Mono", weight:"400" },
  { label:"Inscription · Cinzel", family:"Cinzel", weight:"500", noItalic:true }, // Desire
  { label:"Condensed · Oswald", family:"Oswald", weight:"400" },
  { label:"Handwritten · Architects Daughter", family:"Architects Daughter", weight:"400" },
  { label:"Handwritten · Caveat", family:"Caveat", weight:"700" },
  { label:"Handwritten · Shadows Into Light", family:"Shadows Into Light", weight:"500" },
  { label:"Sans · Inter", family:"Inter", weight:"400" },
  { label:"Geometric · Poppins", family:"Poppins", weight:"400" }, // Euphoria
  { label:"Rounded · Nunito", family:"Nunito", weight:"400" },
  { label:"Sans · Roboto", family:"Roboto", weight:"400" },
  { label:"Sans · Work Sans", family:"Work Sans", weight:"400" },
  { label:"Geometric · Josefin Sans", family:"Josefin Sans", weight:"400" },
  { label:"Futurist · Unica One", family:"Unica One", weight:"400", noItalic:true }, // Starlight Receding, Enochian
  // ---- appended, never inserted: PML's /f:N picks fonts by position ----
  { label:"Blackletter · UnifrakturMaguntia", family:"UnifrakturMaguntia", weight:"400", noItalic:true },
  { label:"Copperplate · Pinyon Script", family:"Pinyon Script", weight:"400", noItalic:true },
  { label:"Antique Print · IM Fell English", family:"IM Fell English", weight:"400" },
  { label:"Typewriter · Special Elite", family:"Special Elite", weight:"400", noItalic:true },
  { label:"Uncial · Uncial Antiqua", family:"Uncial Antiqua", weight:"400", noItalic:true },
  { label:"Art Deco · Poiret One", family:"Poiret One", weight:"400", noItalic:true },
  { label:"Slab · Zilla Slab", family:"Zilla Slab", weight:"500" },
  { label:"Medieval · Almendra", family:"Almendra", weight:"400" },
  { label:"Pixel · VT323", family:"VT323", weight:"400", noItalic:true },
  { label:"Woodtype · Rye", family:"Rye", weight:"400", noItalic:true },
  { label:"Ornate Capitals · Cinzel Decorative", family:"Cinzel Decorative", weight:"400", noItalic:true },
];

export const PRESETS = [
  // ═══ Simple — four quiet ones, light to read and quick to draw — presets 1–4 ═══
{ name: "Plainsong",   // simple: no texture, no frame — ink on bone paper
    bg1: "#F3EEE4", text1: "#1F1D1A", outlineMode: "off", font: "EB Garamond", texture: false,
    accent1: "#7A5F3E", accent2: "#4F5E52",
    spell: "[[🝓🜹]]{{🜻⛤🜚☍🜄⛧⚸🜎}}🜶🜧🜅🜱🜦🜾🜥"
  },
{ name: "Inkwell",   // simple: light words on a dark page, nothing else
    bg1: "#121418", text1: "#ECE6DA", outlineMode: "off", font: "Literata", texture: false,
    accent1: "#C9A86B", accent2: "#8FA3B5",
    spell: "[[🜙✡]]🜻🜦🜅☥🜧☌{{🜥🜼⚝}}"
  },
{ name: "Sea Glass",   // simple: a soft gradient and a whisper of grain
    bg1: "#DDEBE7", bgGradient: true, bg2: "#C5DCDF", bgAngle: 160, text1: "#1D3A3E", outlineMode: "off", font: "Work Sans",
    texture: true, textureType: "grain", textureOpacity: 16, texP1: 100, texP2: 60,
    accent1: "#2C6461", accent2: "#3F516E",
    spell: "🜍🜟✡🜞🜛[[🜥🜾🜈⚹☥🜙]]{{☍🜇🜪🜯🜌🜊}}"
  },
  { name: "Dusk Letter", full: true,   // Ruby's own: a twilight page, hatch in hard light, a soft vignette — the default
    spell: "[[🜊🜘🜉]]{{🜃🜦🜚🜼🜧}}⚻🜪⚼",
    bg1: "#2A1F33", bgGradient: true, bg2: "#402B47", bgAngle: 150, text1: "#F5E6D6", textGradient: false, text2: "#A98CFF", textAngle: 45, font: "Cormorant Garamond", maxSize: 120, lineSpacing: 0, textMargin: 85, accent1: "#E3A87C", accent2: "#B79AD6", texture: true, textureType: "hatch", bgGradientType: "linear", bgRadialX: "50", bgRadialY: "50", bgRadialR: "75", borderGrain: "55", borderRounded: true, borderRadius: "43", cardToggle: false, cardColor1: "#7a418d", cardGradientToggle: true, cardColor2: "#ffd4ea", cardGradientType: "radial", cardGradientAngle: "199", cardOpacity: "28", cardBlend: "overlay", borderBlend: "source-over", borderGradientAngle: "225", borderStitch: "solid", borderStitchOut: true, borderBloomBlend: "source-over", borderGradientToggle: false, borderColor2: "#7A418D", borderColor3: "#DADA95", borderBloom: "0", vignetteAperture: "35", vignetteCx: "50", vignetteCy: "50", vignetteNoise: "0", fx1Type: "none", fx1Color: "#FFFFFF", fx1K1: "40", fx1K2: "70", fx1Angle: "45", fx2Type: "none", fx2Color: "#FFFFFF", fx2K1: "40", fx2K2: "70", fx2Angle: "45", fx3Type: "none", fx3Color: "#FFFFFF", fx3K1: "40", fx3K2: "70", fx3Angle: "45", underAll: "", textureBlend: "hard-light", textureLight: "315", textureLightTilt: "100", textureTint1: "#E7B48F", textureTint2: "#4d4d8ddd", textureTint3: "#FFFFFF", textureTint4: "#FFFFFF", textureTint5: "#00000000", textureTint6: "#FFFFFF", texP1: "64", texP2: "400", texP3: "49", texP4: "30", texP5: "20", texP6: "35", textureOpacity: 53, textureSeed: 792826347, border: false, borderColor: "#DAB995", borderThickness: 3, borderOffset: 55, vignette: true, vignetteBlend: "overlay", vignetteIntensity: 19, align: "left", valign: "center", usernameCorner: "bottom-left" },
  // ═══ Whimsy ♡ — presets 5–12 ═══
{ name: "Andromeda",   // surface: Deep Field (♡)
    spell: "[[🜥]]{{🜭🜊🜕⚺}}🜄🜍☌🜋🜃🜞",
    bg1: "#1A0B2E", bgGradient: true, bg2: "#2D1B69", bgAngle: 135,
    text1: "#F5F0FF",
    outlineMode: "off",
    font: "Cinzel",
    texture: true, textureType: "astral", textureOpacity: 34, texP1: 120, texP2: 110,
    accent1: "#D4AF37", accent2: "#9B7FE8",
    border: true, borderColor: "#D4AF37", borderThickness: 2, borderOffset: 14
  },
{ name: "Starbloom",   // surface: Dream Bloom (♡)
    spell: "[[🜉🜁🜌⛤🜚🜪🜺♡]]⚸🝊🝆🜞🜛{{🜎🜗🜂🜋}}",
    bg1: "#050318", bgGradient: true, bg2: "#1B1040", bgAngle: 120,
    text1: "#E8E0FF", textGradient: true, text2: "#A98CFF", textAngle: 45,
    outlineMode: "shadow", outlineColor: "#6C5CE7", shadowBlur: 24, shadowX: 0, shadowY: 0,
    font: "Unica One",
    texture: true, textureType: "bokeh", textureOpacity: 26, texP1: 150, texP2: 80,
    accent1: "#C9B8FF", accent2: "#6C5CE7"
  },
{ name: "Euphoria",   // surface: Pixie Dust (♡)
    spell: "🝊🜝[[🝆]]{{🜌🜆🜇🜄}}",
    bg1: "#3D0A4E", bgGradient: true, bg2: "#8C1B6B", bgAngle: 45,
    text1: "#FFF0FA",
    outlineMode: "off",
    font: "Poppins",
    texture: true, textureType: "magicparticles", textureOpacity: 80, texP1: 100, texP2: 100,
    accent1: "#FF6FD8", accent2: "#A48FFF",
    textureBlend: 'color-dodge',
    textureTint1: '#FF6FD8',
    textureTint2: '#6D95BA',
    textureSeed: 1970195216,
    border: true,
    borderColor: "#D4AF37",
    borderGradient: true,
    borderColor2: "#FF6FD8",
    borderColor3: "#7FD4C1",
    borderGradientAngle: '197',
    borderBloom: 0,
    borderThickness: 11,
    borderOffset: 144,
    borderGrain: '16',
    borderRounded: false,
    cardToggle: true,
    cardColor1: '#4C4B6B',
    cardOpacity: '100',
    cardBlend: 'darken'
  },
{ name: "Sleepwalk",   // surface: Sleep Haze (♡)
    spell: "🜾[[🜹🜣🜌✡🜦🜺]]{{🜁⚸☊🜮🜘⛧🜖🜅⚻🜶}}",
    bg1: "#0A0E2A", bgGradient: true, bg2: "#16204D", bgAngle: 160,
    text1: "#C8D4FF",
    outlineMode: "off",
    font: "Cormorant Garamond",
    texture: true, textureType: "clouds", textureOpacity: 22, texP1: 180, texP2: 90,
    accent1: "#8FA8FF", accent2: "#5C6CE7"
  },
{ name: "Solstice",   // surface: Aurora Veil (♡)
    bg1: "#061821", bgGradient: true, bg2: "#0C2E3A", bgAngle: 175, text1: "#EAFBF4", outlineMode: "off", font: "Josefin Sans",
    texture: true, textureType: "aurora", textureOpacity: 70, texP1: 120, texP2: 100, texP3: 30,
    accent1: "#6FF0C1", accent2: "#A99BF5",
    spell: "[[🜹🜊🜣☋🜠⚺🜺🜍⚼🜥⛧]]{{🜮🜖🜫}}🜆🜙🜎",
    vignette: true, vignetteBlend: 'overlay', vignetteIntensity: 25,
    fx1Type: 'glow', fx1Color: '#6FF0C1', fx1K1: '25', fx1K2: '30'
  },
{ name: "Nocturne",   // surface: Fractal Moon (♡) — night sky, clouds, earthshine
    bg1: "#0B1026", bgGradient: true, bg2: "#1B2147", bgAngle: 200, text1: "#F1ECDD", outlineMode: "off", font: "IM Fell English",
    texture: true, textureType: "moon", textureOpacity: 62, texP1: 85, texP2: 110, texP3: 35, texP4: 80,
    accent1: "#E8D8A8", accent2: "#8DA2D6",
    spell: "🜱[[🝓🜞]]{{🜢☥🜫🜛}}",
    cardToggle: true, cardColor1: '#141A38', cardOpacity: '50', cardBlend: 'darken',
    vignette: true, vignetteBlend: 'color-burn', vignetteIntensity: 22
  },
{ name: "Kindling",   // surface: Ember Drift (♡)
    bg1: "#160A06", bgGradient: true, bg2: "#3A140A", bgAngle: 160, text1: "#FFEBD6", outlineMode: "off", font: "Uncial Antiqua",
    texture: true, textureType: "embers", textureOpacity: 72,
    accent1: "#FF9A4D", accent2: "#FFD27A",
    spell: "{{🜟🜣🝓🜃}}[[☊🜨🜾🜞🜻🜯]]✡♡🜹☌🜝⚻🜔",
    vignette: true, vignetteBlend: 'color-burn', vignetteIntensity: 20
  },
{ name: "Homesick",   // surface: Painted Landscape (♡)
    bg1: "#ECE6D6", bgGradient: true, bg2: "#CFD9DB", bgAngle: 180, text1: "#2A2E33", outlineMode: "off", font: "Crimson Pro",
    texture: true, textureType: "landscape", textureOpacity: 42, texP3: 35,
    accent1: "#5E6E4C", accent2: "#7A5E44",
    spell: "⚝[[⚸🜺⚻🜮🜇]]{{🜛}}",
    cardToggle: true, cardColor1: '#F4EFE4', cardOpacity: '60', cardBlend: 'lighten'
  },
  // ═══ Sharpness √ — presets 13–20 ═══
{ name: "Daydream",   // surface: Facet Field (∆)
    spell: "🜇🜫🜝🜬☋⚹{{⚻}}[[🜯🜉⛤☊]]",
    bg1: "#E4E0D4",
    text1: "#0D1017",
    outlineMode: "off",
    font: "EB Garamond",
    texture: true, textureType: "tessellate", textureOpacity: 100, texP1: 100, texP2: 0,
    accent1: "#727F91", accent2: "#96791D",
    border: true, borderColor: "#9AA3B0", borderThickness: 2, borderOffset: 12,
    textureBlend: 'overlay'
  },
{ name: "December",   // surface: First Snow (♡)
    spell: "{{☋🜫🜄⚸🜥}}🜢🜟🜹🜞[[🜯🜃🜛🜈🜌🝓🜾🜂]]",
    bg1: "#0D1017",
    text1: "#F2F0E9",
    outlineMode: "off",
    font: "Bodoni Moda",
    texture: true, textureType: "snow", textureOpacity: 62, texP1: 130, texP2: 70,
    accent1: "#C0C8D4", accent2: "#7E8794",
    border: true, borderColor: "#C0C8D4", borderThickness: 1, borderOffset: 16
  },
{ name: "Gold Leaf",   // surface: Scattered Polygons (√)
    spell: "{{🜚}}🜆🜛[[🜭🜞🜜🜻]]",
    bg1: "#0B0E14",
    text1: "#F5F1E6",
    outlineMode: "off",
    font: "Playfair Display",
    texture: true, textureType: "metalleaf", textureOpacity: 70, texP1: 140, texP2: 120, texP3: 0, texP4: 0, texP5: 0,
    accent1: "#D4AF37", accent2: "#8C6D1F",
    border: true, borderColor: "#D4AF37", borderThickness: 2, borderOffset: 10,
    textureBlend: 'screen'
  },
{ name: "Lotus Bloom",   // surface: Lotus Pond (√)
    spell: "⚻☊[[🜃🜜🜯🜭🜬🜁♡☥✡🜅]]{{🝆✝🜇🜱🜿}}",
    bg1: "#F7E3D2", bgGradient: true, bg2: "#E8B9A6", bgAngle: 160,
    text1: "#3A2233",
    outlineMode: "off",
    font: "Cormorant Garamond",
    texture: true, textureType: "flowers", textureOpacity: 85, texP1: 210, texP2: 122,
    accent1: "#AB476C", accent2: "#576F54",
    textureBlend: 'multiply',
    cardToggle: true,
    cardColor1: '#FFE4D1',
    cardOpacity: '100',
    cardBlend: 'hard-light',
    borderRounded: true,
    borderRadius: '110',
    borderGrain: '22',
    border: true, borderColor: "#C98FA6", borderThickness: 5, borderOffset: 150, borderBloom: 30,
    cardGradientToggle: true,
    cardColor2: '#FFD4B2',
    cardGradientType: 'radial'
  },
{ name: "Fervor",   // surface: Brushstrokes (√) — thick paint, lit
    bg1: "#E8DCC8", text1: "#241D17", outlineMode: "off", font: "Merriweather",
    texture: true, textureType: "brushstrokes", textureOpacity: 75, texP3: 30, textureBlend: 'hard-light',
    textureTint1: '#F4E7C8', textureTint2: '#6B3E2A',
    accent1: "#8A3B2B", accent2: "#3E5A6B",
    spell: "[[🜮]]⛤⚝🜾🜱🜃{{☋🜛⛧🜥🜋✡🜕🜼☥🜪🜁}}",
    vignette: true, vignetteBlend: 'color-burn', vignetteIntensity: 18,
    fx1Type: 'doublestrike', fx1K1: '12', fx1K2: '35', fx1Angle: '20'
  },
{ name: "Rumor",   // surface: Halftone Press (√)
    bg1: "#EDEAE3", text1: "#161616", outlineMode: "off", font: "Oswald",
    texture: true, textureType: "halftone", textureOpacity: 28, textureBlend: 'multiply',
    accent1: "#B3271F", accent2: "#1F3E66",
    spell: "[[🜶🜞]]{{🜉🜔🜛}}🜯🜠",
    fx1Type: 'erosion', fx1K1: '35', fx1K2: '40'
  },
{ name: "Insomnia",   // surface: Night City (√)
    bg1: "#070B14", bgGradient: true, bg2: "#142036", bgAngle: 180, text1: "#F2EEE6", outlineMode: "off", font: "Inter",
    texture: true, textureType: "cityscape", textureOpacity: 78, textureTint5: "#D9772E",   // the city glow
    accent1: "#FFD58A", accent2: "#6FA7D8",
    spell: "{{🜕🜣🜚⛤🜪⚸🜧}}⛧☥🜼[[✡🜾☊]]",
    cardToggle: true, cardColor1: '#0A0F1C', cardOpacity: '62', cardBlend: 'darken',
    fx1Type: 'glow', fx1Color: '#FFD58A', fx1K1: '18', fx1K2: '22'
  },
{ name: "Petrichor",   // surface: Harsh Rain (√)
    bg1: "#1A222B", bgGradient: true, bg2: "#2C3A45", bgAngle: 170, text1: "#E6EDF2", outlineMode: "off", font: "JetBrains Mono",
    texture: true, textureType: "rainstreaks", textureOpacity: 38,
    accent1: "#9FC2D9", accent2: "#7F9FB6",
    spell: "☥[[🜍🜾🜝]]{{🜕}}"
  },
  // ═══ Chaos ∆ — presets 21–28 ═══
{ name: "Desire",   // surface: Sigil Scatter (∆)
    spell: "{{☌🜙☋☍🝆}}[[🜭🜨🜢🜣]]🜟🜛",
    bg1: "#1A0A12", bgGradient: true, bg2: "#3D1228", bgAngle: 115,
    text1: "#F6E3E8",
    outlineMode: "off",
    font: "Cinzel",
    texture: true, textureType: "sigils", textureOpacity: 45, texP1: 240, texP2: 70,
    accent1: "#E0526F", accent2: "#9B5C86",
    textureBlend: 'screen'
  },
{ name: "Ashfall",   // surface: Burnt Letter (🜚) — what a burnt letter leaves, a few flakes still alight
    spell: "[[🜁🜩⚻🜺☍⛤🜿🜚⛧🜎🜪🜔🝆🜻]]{{✝🜝}}✡",
    bg1: "#2A2523", bgGradient: true, bg2: "#4B4039", bgAngle: 160,
    text1: "#ECE4D8",
    outlineMode: "off",
    font: "EB Garamond",
    texture: true, textureType: "ash", textureOpacity: 70, texP1: 90, texP2: 85, texP3: 65, texP4: 35,
    textureBlend: 'hard-light', textureLight: 240, textureLightTilt: 115,
    textureTint1: '#D6D0C6', textureTint2: '#FF6A2A',
    accent1: "#E07A3F", accent2: "#ADA299",
    vignette: true, vignetteBlend: "multiply", vignetteIntensity: 30
  },
{ name: "Gateway",   // surface: Transmutation Circles (∆)
    spell: "🜺🜶🜈[[🜣✡⚸]]{{🜍}}",
    bg1: "#041418", bgGradient: true, bg2: "#07242a", bgAngle: 135,
    text1: "#E8FFF6",
    outlineMode: "off",
    font: "Space Mono",
    texture: true, textureType: "summoning", textureOpacity: 30, texP1: 160, texP2: 90, texP3: 75, textureLightTilt: 0,
    accent1: "#3DF5A0", accent2: "#5AC8FF",
    border: true, borderColor: "#3DF5A0", borderThickness: 7, borderOffset: 26,
    borderGradient: true, borderColor2: "#5AC8FF", borderColor3: "#B8FFE4",
    borderBloom: 82,
    textureBlend: 'screen',
    textureTint1: '#3DF5A0'
  },
{ name: "Hourglass",   // surface: Fractured Glaze (∆)
    spell: "🜍🜉🜔🜨🜥✡✝🜟🜄🜆{{🜱🜾🜼⚼⛧}}[[🜈🝊]]",
    bg1: "#1B0A12", bgGradient: true, bg2: "#2E1338", bg3: "#0E1B3A", bgAngle: 200,
    text1: "#FFEFE6",
    outlineMode: "off",
    font: "Bodoni Moda",
    texture: true, textureType: "crackedglaze", textureOpacity: 34, texP1: 170, texP2: 220,
    accent1: "#FF6B6B", accent2: "#6FA8FF",
    borderBloom: 0
  },
{ name: "Projection",   // surface: Rorschach Test (∆) — black and red, wet
    bg1: "#F1EDE4", text1: "#1B1A19", outlineMode: "off", font: "Courier Prime",
    texture: true, textureType: "inkbleed", textureOpacity: 50, texP1: 80, texP3: 55, texP4: 45, textureBlend: 'multiply',
    accent1: "#A3242F", accent2: "#2E2B29",
    spell: "♡{{⛤🜼🜇🜖🜜🜘}}[[🜦🝊🜍🜈]]",
    cardToggle: true, cardColor1: '#F1EDE4', cardOpacity: '60', cardBlend: 'lighten'
  },
  { name: "Event Horizon", full: true,   // Ruby's own: the black hole behind a darkening navy box, outlined words
    spell: "{{☌🜨}}[[🜯🜦⚼🜩🜘]]🜞♡☊🜫",
    bg1: "#050407", bgGradient: true, bg2: "#120A18", bgAngle: 135, text1: "#F6EEE2", textGradient: false, text2: "#A98CFF", textAngle: 45, font: "Poiret One", maxSize: 120, lineSpacing: -0.08, textMargin: 75, accent1: "#FFB35C", accent2: "#A48CFF", texture: true, textureType: "blackhole", bgGradientType: "linear", bgRadialX: "50", bgRadialY: "50", bgRadialR: "75", borderGrain: "0", borderRounded: true, borderRadius: "23", cardToggle: true, cardColor1: "#000077", cardGradientToggle: false, cardColor2: "#F2E2EA", cardGradientType: "linear", cardGradientAngle: "90", cardOpacity: "55", cardBlend: "darken", borderBlend: "source-over", borderGradientAngle: "45", borderStitch: "solid", borderStitchOut: false, borderBloomBlend: "source-over", borderGradientToggle: false, borderColor2: "#7A418D", borderColor3: "#DADA95", borderBloom: "44", vignetteAperture: "35", vignetteCx: "50", vignetteCy: "50", vignetteNoise: "0", fx1Type: "outline", fx1Color: "#d8c3a4", fx1K1: "5", fx1K2: "25", fx1Angle: "45", fx2Type: "none", fx2Color: "#FFFFFF", fx2K1: "40", fx2K2: "70", fx2Angle: "45", fx3Type: "none", fx3Color: "#FFFFFF", fx3K1: "40", fx3K2: "70", fx3Angle: "45", underAll: "", textureBlend: "hard-light", textureLight: "301", textureLightTilt: "100", textureTint1: "#FFD9A8", textureTint2: "#000000", textureTint3: "#FFFFFF", textureTint4: "#FFFFFF", textureTint5: "#808080", textureTint6: "#FFFFFF", texP1: "175", texP2: "174", texP3: "69", texP4: "30", texP5: "20", texP6: "35", textureOpacity: 100, textureSeed: 1546719081, border: true, borderColor: "#DAB995", borderThickness: 3, borderOffset: 150, vignette: false, vignetteBlend: "overlay", vignetteIntensity: 19, align: "left", valign: "center", usernameCorner: "bottom-left" },
{ name: "Omen",   // surface: Cartomancy (∆) — the Vellum deck
    bg1: "#2A1A2E", bgGradient: true, bg2: "#3F2340", bgAngle: 140, text1: "#F7EBDD", outlineMode: "off", font: "Almendra",
    texture: true, textureType: "cards", textureOpacity: 40,
    accent1: "#E8C27A", accent2: "#D592AE",
    spell: "⚸🝓🜔{{☌🜄🜼}}[[🜢⚺🜺🜥⚻🜗🜻]]",
    cardToggle: true, cardColor1: '#6E4466', cardGradientToggle: true, cardColor2: '#2A1A2E', cardGradientType: 'radial', cardOpacity: '55', cardBlend: 'multiply',
    border: true, borderColor: '#E8C27A', borderThickness: 2, borderOffset: 40,
    fx1Type: 'bevel', fx1K1: '25', fx1K2: '40', fx1Angle: '315'
  },
{ name: "Signal",   // surface: Math Static (∆)
    bg1: "#0E0F12", text1: "#E8E8E8", outlineMode: "off", font: "VT323",
    texture: true, textureType: "mathnoise", textureOpacity: 32,
    accent1: "#7CFFB2", accent2: "#FF5FA2",
    spell: "🜝🜣[[🜆⛤🜥✡]]{{🜄}}",
    fx1Type: 'chromatic', fx1K1: '22', fx1K2: '55', fx1Angle: '0'
  },
  // ═══ Touch 🜚 — presets 29–36 ═══
{ name: "Handled",   // surface: Linen Tooth (🜚)
    spell: "{{⚸🜝}}⚻♡🜞🜧[[🜃🜙🜉🜔🜿]]",
    bg1: "#E9E2D4",
    text1: "#2B2A26",
    outlineMode: "off",
    font: "Literata",
    texture: true, textureType: "linen", textureOpacity: 34, texP1: 120, texP2: 42,
    accent1: "#7C7A63", accent2: "#947D5A"
  },
{ name: "Foxed",   // surface: Old Paper — foxed (🜚)
    spell: "[[🜬🜔]]🜉{{🜿🜇🜢🜛☍⚺🜙🜘♡🜜🜭🜕☋🜨}}",
    bg1: "#E4D6B8",
    text1: "#3A2E20",
    outlineMode: "off",
    font: "EB Garamond",
    texture: true, textureType: "oldpaper", textureOpacity: 42, texP1: 120, texP2: 0, texP3: 32, texP4: 12,
    accent1: "#9A5B33", accent2: "#6E7247",
    border: true, borderColor: "#9A8B6E", borderThickness: 1, borderOffset: 18
  },
{ name: "Sealed",   // surface: Poured Wax (🜚)
    spell: "{{🜨🜈🜇🜄🜮⚸✝🝆☋🜔🜠🝓🜱}}⚻♡[[✡🜍]]",
    bg1: "#F0E6D2",
    text1: "#241C18",
    outlineMode: "off",
    font: "Cormorant Garamond",
    texture: true, textureType: "wax", textureOpacity: 46, texP1: 110, texP2: 90,
    accent1: "#7A2B2B", accent2: "#5C6B4A"
  },
{ name: "Mended",   // surface: Kintsugi (🜚) — a curved vessel, mended
    bg1: "#E7E1D6", text1: "#262321", outlineMode: "off", font: "Zilla Slab",
    texture: true, textureType: "kintsugi", textureOpacity: 70,
    accent1: "#8C6A1E", accent2: "#56616B",
    spell: "[[🜖✡🜄🜣☊]]{{🜆☌🜜🜘}}☍🜋🜧🜥🜞☥🜠🜈",
    fx1Type: 'letterpress', fx1K1: '30', fx1K2: '45', fx1Angle: '315'
  },
{ name: "Stillwater",   // surface: Scrying Pool (🜚) — koi, pads, stones, tilted
    bg1: "#0E2A30", bgGradient: true, bg2: "#164046", bgAngle: 170, text1: "#E8FBF8", outlineMode: "off", font: "Poppins",
    texture: true, textureType: "water", textureOpacity: 62, textureBlend: 'overlay',
    textureTint1: '#BFF5EE', textureTint2: '#04161A',
    accent1: "#7FE0D2", accent2: "#E8C46A",
    spell: "{{☊⛧🜍}}🜕[[🜿🜭⚼]]",
    cardToggle: true, cardColor1: '#0B2024', cardGradientToggle: true, cardColor2: '#164046', cardGradientType: 'radial', cardOpacity: '50', cardBlend: 'multiply'
  },
{ name: "Mirage",   // surface: Dune Ripples (🜚) — dunes to the haze
    bg1: "#E9D2AE", text1: "#3A2618", outlineMode: "off", font: "Playfair Display",
    texture: true, textureType: "dunes", textureOpacity: 78, texP4: 55,
    accent1: "#7E3F1E", accent2: "#4A5A66",
    spell: "[[🜌🜧🜜🜁]]{{🜶🝓🜮🜉🜛✡⚹🜬}}🜟",
    cardToggle: true, cardColor1: '#FFF3DD', cardGradientToggle: true, cardColor2: '#F2D7B0', cardGradientType: 'radial', cardOpacity: '55', cardBlend: 'soft-light',
    fx1Type: 'letterpress', fx1K1: '30', fx1K2: '50', fx1Angle: '315'
  },
{ name: "Lucid",   // surface: Crystal Leaf (🜚) — amethyst points, fire inside
    bg1: "#1B1226", bgGradient: true, bg2: "#2C1A3D", bgAngle: 135, text1: "#F4ECFF", outlineMode: "off", font: "Cinzel Decorative",
    texture: true, textureType: "crystal", textureOpacity: 55, texP1: 80, texP3: 65,
    accent1: "#C9A6FF", accent2: "#E8C46A",
    spell: "{{🜌🜗}}[[🜨🜆✡🜺]]☌",
    cardToggle: true, cardColor1: '#1B1226', cardOpacity: '45', cardBlend: 'darken',
    fx1Type: 'glow', fx1Color: '#C9A6FF', fx1K1: '20', fx1K2: '25'
  },
{ name: "Homebound",   // surface: Rain on Glass (🜚) — the outdoors behind it
    bg1: "#6A7C96", bgGradient: true, bg2: "#2A3140", bgAngle: 180, text1: "#F2F4F7", outlineMode: "off", font: "Work Sans",
    texture: true, textureType: "glassrain", textureOpacity: 88,
    accent1: "#FFD9A0", accent2: "#EEF3FA",
    spell: "{{⛧🜌🜫🜂🜾🜕🜁🜮🜻🜍}}🜄[[🜗🜪]]",
    cardToggle: true, cardColor1: '#3A4558', cardGradientToggle: true, cardColor2: '#6B7C96', cardGradientType: 'radial', cardOpacity: '80', cardBlend: 'multiply',
    fx1Type: 'shadow', fx1Color: '#0B1018', fx1K1: '18', fx1K2: '6', fx1Angle: '90'
  },
];
/** The preset grid's groups, in order (headers in the grid; the presets
 *  themselves carry no group field, so the five Ruby called perfect stay
 *  exactly as they are). */
export const PRESET_GROUPS = [
  { name: 'Simple', count: 4 },
  { name: 'Whimsy ♡', count: 8 },
  { name: 'Sharpness √', count: 8 },
  { name: 'Chaos ∆', count: 8 },
  { name: 'Touch 🜚', count: 8 },
];

/**
 * Page sizes. Grouped for the picker: portrait and square first, then
 * landscape. Every one is capped at 4096 on its long edge.
 *
 * The landscape entries are named by their true ratio (4:3, 2:1) rather than
 * reusing the portrait names — two different "3:4" buttons meaning different
 * shapes would be a trap.
 */
export const ASPECTS = {
  "1:1":    [3072, 3072],
  "2:3":    [2400, 3600],
  "3:4":    [2700, 3600],
  "9:16":   [2304, 4096],
  "1:2":    [2048, 4096],
  "9:20.5": [1797, 4096],
  "16:9":   [4096, 2304],
  "4:3":    [3600, 2700],
  "2:1":    [4096, 2048],
};


/** Custom page sizes are clamped to what a browser canvas reliably handles. */
export const SIZE_LIMITS = { min: 256, max: 4096 };

export function $(id){ return document.getElementById(id); }

export function getActiveRadioValue(containerId){
  const group = document.getElementById(containerId);
  const active = group.querySelector('.radio-btn.active');
  return active ? active.dataset.val : null;
}

/**
 * The page every build opens on, for now: a live instrument panel of
 * §Variables — and a calling card for the poet behind the press. At launch,
 * set OPEN_ON_POEM to true and production will open on a poem instead.
 */
export const DEV_TEMPLATE = "## <\u00a7UVIcon Unfixable Vellum/rainbow/c> <Application Version/scale:40/right/basis:40>\n-# <[\\<\u00a7Build\\>]/right/basis:140>\n## Current Template: {\u00a7SpellName}\n-# \\[\u00a7Spell\\] // {\u00a7Today}'s Moon Phase: [\u00a7MoonPhase!tonight]\n\nUses Font: [\u00a7Font]\n-# Text Effects: [\u00a7TypeEffect]\n\n## <Uses Surface: \"[\u00a7SurfName]\"/scale:90>\n<\u00a7SurfParamsA/scale:90>\nBlend Mode: [\u00a7SurfBlendMode]  Light: [\u00a7LightDir]\n\u00a7SurfParamsB\n-# Seed: [\u00a7SeedPhrase] \u00b7 \u00a7TextureSeed  {\u00a7MoonPhase!seed}\n\n---\n\nI:[\u00a7Glyph!input]  |  R:[\u00a7Glyph!ritual] | T:[\u00a7Glyph!thoughtform] | M:[\u00a7Glyph!materia] | E:[\u00a7Glyph!esoterica] | Wind:[\u00a7Glyph!air] | Earth:[\u00a7Glyph!earth] | Water:[\u00a7Glyph!water] | Fire:[\u00a7Glyph!fire] \nTouch / Return:{\u00a7Glyph!return}\n\n---\n\n## {Renderer Stats}\nTexture Cache: [\u00a7CacheMB]MB \u2022 Canvas: [\u00a7Canvas] \u2022 Frametime: [\u00a7RenderMs]Msec\n[Timing (Msec)] \u00a7Profile";
export const OPEN_ON_POEM = false;
/** Production is poetrypress.*; anything else — vellum, a local file — is development. */
export const isProductionHost = () => typeof location !== 'undefined' && /^poetrypress\./i.test(location.hostname || '');
