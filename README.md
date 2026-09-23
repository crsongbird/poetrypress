# Unfixable Vellum ♦️

Turn poems into images, in the browser. No install.

**[poetrypress.unfixable.place](https://poetrypress.unfixable.place)**

---

## Features

- 16 presets, fully editable
- 28 procedural background textures, two adjustable parameters each
- Per-texture blend mode and light direction
- Multi-stop gradients for background and text
- PML, a small markup language for poems (below)
- Lock any control so Randomize and presets skip it
- Save looks (Spellcrafting) and poems (Grimoire) to local storage
- Import/export as JSON
- Export full-quality JPG, filename from your first line

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

## Development

```
sh test.sh              # parse everything, build, run every suite
node build.mjs          # bundle to dist/index.html
node test/<name>.test.mjs
```

| File | Contents |
|---|---|
| `index.html` | markup |
| `poetrypress.css` | styles |
| `tunables.js` | hand-editable numbers |
| `strings.js` | hand-editable text |
| `appOptions.js` | typefaces, presets, aspect ratios |
| `textParsers.js` | PML parser |
| `spell.js` | glyph spells |
| `texCore.js` | noise, colour mixing, seeded random |
| `texWhimsy.js` `texSharpness.js` `texChaos.js` `texTouch.js` | texture generators, by element |
| `textureGenerators.js` | texture tables, cache and dispatch |
| `canvasRenderer.js` | rendering |
| `palette.js` | colour picker suggestions |
| `swatches.js` | painted preset tiles |
| `theme.js` | UI theme |
| `editor.js` | syntax highlighting |
| `vault.js` | Spellcrafting and Grimoire storage |
| `appEvents.js` | UI wiring, entry point |

Edit the modules; deploy `dist/index.html`. Twenty-seven test suites in [`test/`](./test), no dependencies.

See [OPEN-ISSUES.md](./OPEN-ISSUES.md) for known gaps and constraints.

---

Support: [ko-fi.com/c0222f](https://ko-fi.com/c0222f)
