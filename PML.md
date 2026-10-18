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
| `[text]` | accent one (the Opposition Hue) |
| `{text}` | accent two (the Conjunction Hue) |
| `{[text]}` | accent one → accent two |
| `[{text]}` | accent two → accent one |
| `[text/lg]` `[text/rg]` | fade accent one into the ink |
| `{text/lg}` `{text/rg}` | same, accent two |
| `\[` | literal `[` — escapes any character |

Nesting works: `**bold [with accent] still bold**`

`<3` is always a heart: it never opens a segment.

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
| `color:name` | a color by its name: any CSS name (`midnightblue`), the app's own (`rose` `oxblood` `moss` `bone` `parchment` `graphite` `teastain` `clay` `sage` `ink` `starlight` `ember`), or `#hex` | — |
| `f:N` | typeface by index | — |
| `font:Name` | typeface by its name: `font:Cinzel`, `font:cormorant` | — |
| `op:N` | opacity, % | 60 |
| `blend:mode` | how the letters lie on the page: `multiply` (ink pressed into the paper), `screen`, `overlay`, `soft-light`, `hard-light`, `darken`, `lighten`, `dodge`, `burn`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity` | multiply |
| `rot:N` | turn the segment by N degrees, about its middle | −8 |
| `arc:N` | the letters on an arc spanning N degrees of a circle; positive bows up, negative sags | 30 |
| `wave:amp,cycles` | the letters on a wave: height as % of the size, and how many waves | 25, 2 |
| `gap:N` | room after the line, % of its height; negative draws the next line in | 100 |
| `glass` | frosted glass letters: the page behind them blurred and lit, faintly tinted by the ink | frost, 50 |
| `glass:clear` · `glass:color` · `glass:80` | clear glass (the page only bent) · glass tinted any color · its strength, 0–100; combine them: `glass:rose,30` | — |
| `cut` | letters as windows through the surface, to the page under it (with no surface on, plain letters) | — |
| `@name` | a named style's directives (below) | — |
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

Try: `<frosted/glass/scale:140> <and bowed/arc:40> <and turned/rot:-6/op:70>`

### Named styles

Define a style once, on a line of its own, and use it anywhere a directive
goes with `/@name`. The definition line isn't drawn. A style may use another.

```
§style ember = /color:ember/glass/scale:120
§style bright = /@ember/blend:screen
the <coals/@ember> and the <sparks/@bright/rot:4>
```

The editor underlines a directive PML can't read (a misspelt name, a value it
doesn't take, a style or typeface no one has named) and says why on the line
under the poem.

### Over many lines, and nesting

A bracket (`[ ]` `{ }` `{[ ]}` `[{ ]}`) or a segment (`<…/dirs>`) may run over
several lines: open it on one line, close it on a later one, and every line
between takes it. A bracket that never closes still ends with its line.

| Syntax | Result |
|---|---|
| `[line one`↵`line two]` | both lines in accent one |
| `[stanza`↵`…`↵`end]/c` | alignment alone after the closer: every line of the block centered |
| `[words]/jitter:150` | directives after a bracket's closer: the bracket is a segment of its own |
| `{[one`↵`two}]/jitter:200/f:12` | the same over lines: each line its own segment |
| `<line one`↵`line two/c>` | a segment over lines |
| `<a <b/f:3> c/scale:150>` | a segment inside a segment: `b` takes both, its own last |
| `[a <b/f:3> c]` | a bracket runs through a segment inside it |

Try:

```
[This is a stanza
that should be colored
and centered]/c
```

Bold and italic run over lines the same way: `**open on one line` and
`closed on another**` makes both bold.

*Changed (Saturn–Ijiraq on):* a poem that left a bracket open on one line and
wrote a closer on a later one used to show that closer as text; the block now
runs between them.

*Changed (Saturn–Phoebe on):* bold and italic left open at a line's end used
to show their marks as text and end there; they now run on to their closer.
And `<3` is always a heart: a line such as `<3 you <word/c>` once read the
heart's `<` as the segment's opener.

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
