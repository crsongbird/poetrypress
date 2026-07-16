# PoetrySky Press

A single-file, browser-based tool for turning poems into shareable images.

Live at: poetrypress.unfixable.place

## Features

- 20 built-in themes, fully editable after picking one
- 20+ procedural textures (noise, ink spatter, embers, snow, brush strokes, halftone, and more), each with opacity, invert, and a lockable random seed
- Multi-stop gradients (2-4 colors) for background and text
- Vignette with 4 blend modes
- A small markdown-like formatting language for poem text (see below)
- 6 aspect ratios, justification, line spacing
- Randomize buttons for font and background
- Advanced panel: export/import full config as JSON
- Auto-named JPG export, filename pulled from your poem's first heading

## Using It

Pick a theme from Style Presets, or build one from scratch — every control still works normally either way. Type your poem into the text box; formatting is plain text (see below). Textures use a seeded RNG — lock the seed to keep a pattern while you tweak everything else. Download exports a full-quality JPG. The Advanced panel lets you save/restore your entire setup as JSON.

## Formatting Language

### 1. Line prefixes
- `## text` — heading, 1.33x size
- `-# text` — small aside, 0.66x size
- `> text` — quote: italic, left bar, 68% opacity

### 2. Inline styles
- `**bold**` `*italic*` `_underline_` `~~strike~~`
- `[accent one]` `{accent two}` — active only when that accent is enabled

Nest freely: `**bold [with accent] still bold**`. `*`/`_`/`~~`/`**` won't trigger touching whitespace (`5 * 3 * 2` stays plain); brackets/braces have no such rule.

### 3. Hidden gradient blend
- `{[text]}` — accent one → accent two
- `[{text]}` — accent two → accent one

Either closing order works (`]}` or `}]`). Needs both accents enabled.

### 4. Escaping
`\X` prints X literally, no formatting. Escapable: `\ * _ ~ [ ] { } < > /`

### 5. Whole-line justification
End a line with `/l`, `/c`, or `/r`.

### 6. Segmentation Operator (advanced)
`<...>` isolates part of a line, directives chained with `/`:
- `/l /c /r` — justify this segment
- `/#:hex` — custom color, overrides accents
- `/f:N` — custom font by index (live list in-app)
- `/scale:N` — custom size in px
- `/fx1,color,width` — custom outline
- `/fx2,color,blur,x,y` — custom shadow
- `/fx0` — force outline/shadow off even if on globally

Chain freely: `<text/#:ff00ff/f:4/scale:100/r/fx2,#ffffff,10,10,10>`

Unjustified segments flow inline as one block; justified ones anchor to that margin. `plain text <right side/r>` — first part flows normally, second pins to the edge.
