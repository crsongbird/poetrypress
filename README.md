# Unfixable Vellum

Working on the code (person or AI agent)? Start with **[AGENTS.md](AGENTS.md)** — commands,
architecture, invariants, recipes, and the design language.

A single-page art app for visual poetry: a free replacement for paid tools like
Photoshop, needing no desktop. It works on a phone, in a browser, with nothing
to install.

**[poetrypress.unfixable.place](https://poetrypress.unfixable.place)** · development build at vellum.unfixable.place

It was built entirely on a phone, by a housing-insecure, disabled housewife,
using only the phone and cloud dev tools — no computer. It is free, and it
will stay free.

---

## Features

- 36 presets, fully editable, each with its own glyph spell
- 47 procedural surface textures in four elements, each with its own knobs,
  blend modes, hues and light — most of them lit like a game engine (heights,
  normal maps, materials, cast shadows) by a light dial
- Four readings of every texture — 🜂 Fire, 🜄 Water, 🜁 Wind, 🜃 Earth — one
  its default, three known-good variations; they respect your locks, so they mix
- The Athanor 🜉, a node editor for making surface textures of your own from
  the app's own parts — five starter graphs, and Vellum's own textures that
  are rebuilt as chains of steps (Harsh Rain, Silverpoint Hatch, Linen Tooth,
  Fractured Glaze) open as templates to take apart
- A base texture under the main one; an inset box with frosted glass and GPU blends
- Multi-stop gradients for the background and the text
- Typeface effects: letterpress, long shadow, bevel, erosion, bloom and more
- PML, a small markup language for poems — including §variables that report
  the page's own settings, for texture tests (below)
- Lock any control so Randomize and presets skip it
- Save looks (Spellcrafting) and poems (the Grimoire, dated by moon phase);
  share a single look as a link
- Installable as an app, and works offline once visited (over https)
- Export full-quality JPG, named from your first line, with ALT TEXT inside it
  (IPTC Alt Text, XMP): the poem's words, then a plain description of the look
  — typeface, colours, the surface and its settings, the frame — up to 1500
  characters
- Word seeds: every seed is a phrase and back ("The phase of Creation,
  turbulent and shedding"); the words include Ruby's Runology
- Soft interface sounds, off by default (Esoterica → Appearance → Sounds)
- Dark-mode add-ons (Dark Reader and its kin) leave it alone: it is already dark

## The four elements

Presets and textures are grouped by these.

| | Element | Palette | Feeling |
|---|---|---|---|
| ♡ | **Whimsy** | red, purple, blue gradients | sleep |
| √ | **Sharpness** | off-white, blue-black, metal | waking |
| ∆ | **Chaos** | sigils, noise, broken geometry | pain |
| 🜚 | **Touch** | neutrals only | contact |

---

## PML reference

### Inline

| Syntax | Result |
|---|---|
| `**bold**` | bold |
| `*italic*` | italic |
| `_underline_` | underline |
| `~~strike~~` | strikethrough |
| `[text]` | accent one |
| `{text}` | accent two |
| `{[text]}` | accent one → accent two |
| `[{text]}` | accent two → accent one |
| `[text/lg]` `[text/rg]` | fade accent one into the ink |
| `{text/lg}` `{text/rg}` | same, accent two |
| `\[` | literal `[` — escapes any character |

Nesting works: `**bold [with accent] still bold**`

### Line prefixes

| Syntax | Result |
|---|---|
| `## text` | heading |
| `-# text` | small aside |
| `> text` | quote — left bar, italic, slight transparency |
| `#D text` | drop cap |
| `#S text` | small caps |

### Line suffixes

| Syntax | Result |
|---|---|
| `/l` `/c` `/r` | align left, center, right |
| `/left` `/center` `/right` | same |
| `~A` `~B` `~C` `~D` | rhyme marker — shown as a coloured bar, not text |

Combine: `a rhyming line~A/r`

### Segments

Wrap part of a line in `<…>` and chain directives after it.

```
<text/#:ff00ff/scale:150/fx2,#ffff00,10,4,4>
```

| Directive | Effect | Bare form |
|---|---|---|
| `#:hex` | custom colour | — |
| `f:N` | typeface by index | — |
| `scale:N` | size, % of fitted size | 100 |
| `track:N` | letter-spacing, % | 100 |
| `basis:N` | raise; negative lowers | 30 |
| `jitter:N` | per-letter shake, % | 100 |
| `grad:1#f00,2#00f` | custom gradient, up to 4 stops | — |
| `rainbow` `trans` `lesbian` | preset gradients; `:rev` reverses | — |
| `fx1,color,width` | outline | black, 3 |
| `fx2,color,blur,x,y` | shadow | black, 8, 4, 4 |
| `fx0` | remove effects from this segment | — |
| `effect:NAME,strength,hue` | letterpress, longshadow, doublestrike, chromatic, halo, bevel, erosion, doubleline, wavyline, dottedline | halo, 60 |
| `l` `c` `r` | align this segment only | — |

Split a line between alignments:

```
<left side/l><right side/r>
```

Emoji inside a coloured span are tinted to match.

---

### Effects and underlines

`<word/fx:outline(#fff,4)+glow(#fd0,40,70)>` — up to three effects, in order
(colour, knob 1, knob 2, angle): outline, shadow, longshadow, glow,
letterpress, bevel, chromatic, doublestrike, erosion. `/fx:none` clears.
`<word/under:wave,#c33,150>` — an underline in any of the stitches. The older
`/fx0` `/fx1` `/fx2` `/effect:` forms still work.

### §Variables

Written in the poem, resolved before PML is parsed — so a variable may expand
into PML. Only the poem is resolved; no other field is. Unknown names stay as
written; `\§` writes a literal §.

| Variable | Becomes |
|---|---|
| `§SurfName` · `§SurfBlendMode` · `§LightDir` · `§TextureSeed` | the texture's name, blend, light arrow, seed |
| `§SurfParamsA` | `Knob: [value]  Knob: [value]  Opacity: [value] {moon}`, as PML |
| `§SurfParamsB` | the texture's hues, each in its own colour |
| `§MoonPhase!tonight` · `!seed` · `!opacity` | a moon: tonight's, the Fractal Moon's for this seed, the opacity |
| `§MoonPhase:x` | x from −1 to 1: 0 full, ±1 new; negative waxes, positive wanes |
| `§Glyph!input` `ritual` `thoughtform` `materia` `esoterica` `touch` `return` `sigil` | the app's drawn glyphs, inline |
| `§Glyph!whimsy` `sharpness` `chaos` | ♡ √ ∆ |
| `§Spell` · `§SpellName` · `§Font` · `§Canvas` · `§TypeEffect` · `§Today` | the look's spell and its name, the typeface, the page size, the effect, the date |
| `§SpellRunes` · `§Rune!name` | Runology: the spell's Archetypes by name (Wind · Fire · Aether); any Archetype or Accent's glyph (§Rune!astral → 🝊) |
| `§Reading` | the surface's reading, when one of its four was applied (🜂 Smoulder) |
| `§RenderMs` · `§Profile` · `§CacheMB` · `§Fonts` · `§Build` | render time, and by stage; texture memory; fonts fetched; which build |

A texture test page:

```
## Surface: [§SurfName]
-# {Rendering Test} // Moon: [§MoonPhase!tonight]
§SurfParamsA
Blend Mode: [§SurfBlendMode]  Light: [§LightDir]
§SurfParamsB
-# Seed: [§TextureSeed]  {§MoonPhase!seed}
```

## Development

Releases are named for moons, in order from their planet: `release.js`
holds the current one (shown by `§Build`); `node build.mjs --next` moves on
to the next. Shown as `Jupiter–Io` (an en dash: a slash would split a PML segment).
Jupiter now; Saturn after the final release.


`node tools/scale-audit.mjs` scores how each texture holds up drawn at a
smaller size (needs `npm install @napi-rs/canvas`).


```
sh test.sh                 # parse every module, build, parse the bundle, run every suite
node build.mjs             # build dist/
node build.mjs --zip       # build, then archive the whole project for GitHub
python3 tools/icons.py     # redraw the nav glyphs, the sigil and the app icons
node tools/look.mjs ...    # render textures with a real canvas, to SEE them
                           #   (needs: npm install @napi-rs/canvas)
```

Don't trust `node --check` on these files: with no `package.json` declaring
modules, it passes broken files that contain `export`. `sh check.sh file.js`
does a genuine parse.

**Deploying:** upload the whole `dist/` folder — the page, `sw.js`,
`manifest.webmanifest` and `icons/`. The service worker must be its own file,
so the page alone won't install or work offline. To move the entire project
(sources, tests, tools, docs) into the GitHub repo with its folders intact,
use the archive from `node build.mjs --zip`, in `release/`.

**Where to change things by hand:** `strings.js` holds every user-facing
string (markup carries `data-str="key"`); `tunables.js` the numbers and the
default preset; `appOptions.js` fonts, presets, aspect ratios and size limits.

| File | Contents |
|---|---|
| `index.html` | markup |
| `poetrypress.css` | styles |
| `tunables.js` · `strings.js` | hand-editable numbers · text |
| `appOptions.js` | typefaces, presets, aspect ratios |
| `textParsers.js` | PML parser |
| `spell.js` · `runology.js` | glyph spells · the Runes of Power (Archetypes, Accents, Chroma) |
| `moon.js` | moon phase and moon glyphs |
| `texCore.js` | noise, colour mixing, seeded random, blend neutrals, tints |
| `texWhimsy.js` `texSharpness.js` `texChaos.js` `texTouch.js` | texture generators, by element |
| `textureGenerators.js` · `textureElements.js` | texture tables, cache and dispatch · each texture's four readings |
| `steps.js` · `stepsTouch.js` · `stepsChaos.js` · `chains.js` | the steps surfaces are made of · textures rebuilt as chains of them |
| `athanor.js` · `forge.js` | the Athanor's evaluator · its node editor (Drawflow) |
| `boxFx.js` · `effects.js` · `stitches.js` | the inset box's glass · text effects · stitches |
| `altText.js` · `jpegMeta.js` | the saved image's alt text, in words · written into the JPEG |
| `murmur.js` | interface sounds |
| `canvasRenderer.js` | rendering |
| `palette.js` · `swatches.js` · `theme.js` | picker suggestions · preset tiles · UI theme |
| `editor.js` | syntax highlighting |
| `vault.js` | Spellcrafting, the Grimoire, sharing |
| `pwa.js` · `pwa/` · `icons/` | the installable app |
| `appEvents.js` | UI wiring, entry point |
| `tools/` | icon generator, texture previewer |
| `glyphs.js` · `pmlVars.js` | drawn glyphs inside text · §variables |
| `test/` | 39 suites, no dependencies |

See [OPEN-ISSUES.md](./OPEN-ISSUES.md) for known gaps and constraints.

---

Support: [ko-fi.com/c0222f](https://ko-fi.com/c0222f)
