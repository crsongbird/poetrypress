# PML — the markup poems are written in

PML (Poetic Magick Language) is how a poem is dressed. Plain text is the poem;
a few marks change how part of it looks, and a mark that isn't understood is
simply shown as typed. The Arcane Guidance, in the app's Inscription tab,
teaches it with an example for each part (⤓ Try puts one in your poem). This
page is the whole of it, for reference. Everything here stays: a poem written
once renders the same ever after.

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

Try: `a [red] word, a {blue} word, and {[both at once]}`

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
| `~A` `~B` `~C` `~D` | rhyme marker — shown as a colored bar, not text |

Combine: `a rhyming line~A/r`

Try:

```
## The Lantern
-# for M., in winter
#D Once there was a light that would not go out.
```

### Segments

Wrap part of a line in `<…>` and chain directives after it.

```
<text/#:ff00ff/scale:150/fx2,#ffff00,10,4,4>
```

| Directive | Effect | Bare form |
|---|---|---|
| `#:hex` | custom color | — |
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

Emoji inside a colored span are tinted to match.

---

### Effects and underlines

`<word/fx:outline(#fff,4)+glow(#fd0,40,70)>` — up to three effects, in order
(color, knob 1, knob 2, angle): outline, shadow, longshadow, glow,
letterpress, bevel, chromatic, doublestrike, erosion. `/fx:none` clears.
`<word/under:wave,#c33,150>` — an underline in any of the stitches. The older
`/fx0` `/fx1` `/fx2` `/effect:` forms still work.

### §Variables

Written in the poem, resolved before PML is parsed — so a variable may expand
into PML. Only the poem is resolved; no other field is. Unknown names stay as
written; `\§` writes a literal §.

| Variable | Becomes |
|---|---|
| `§SurfName` · `§SurfBlendMode` · `§LightDir` · `§TextureSeed` | the texture's name, blend, light arrow, seed (with Two Surfaces, the upper one's) |
| `§SurfParamsA` | `Knob: [value]  Knob: [value]  Opacity: [value] {moon}`, as PML |
| `§SurfParamsB` | the texture's hues, each in its own color |
| `§MoonPhase!tonight` · `!seed` · `!opacity` | a moon: tonight's, the Fractal Moon's for this seed, the opacity |
| `§MoonPhase:x` | x from −1 to 1: 0 full, ±1 new; negative waxes, positive wanes |
| `§Glyph!input` `ritual` `thoughtform` `materia` `esoterica` `touch` `return` `sigil` | the app's drawn glyphs, inline |
| `§Glyph!whimsy` `sharpness` `chaos` | ♡ √ ∆ |
| `§Spell` · `§SpellName` · `§Font` · `§Canvas` · `§TypeEffect` · `§Today` | the look's spell and its name, the typeface, the page size, the effect, the date |
| `§SpellRunes` · `§Rune!name` | Runology: the spell's Archetypes by name (Wind · Fire · Aether); any Archetype or Accent's glyph (§Rune!astral → 🝊) |
| `§Reading` | the surface's reading, when one of its four was applied (🜂 Smolder) |
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
