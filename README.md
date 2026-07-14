# PoetrySky Press

A single-file, browser-based tool for turning poems into shareable images.
Type your poem, pick a theme (or build your own from scratch), and export a
high-resolution JPG — no build step, no install, no server. Open the HTML
file or visit it live and it just works.

Live at: poetrypress.unfixable.place

## Overview

Everything — the UI, the canvas renderer, all 20 themes, all 20+ procedural
textures, and the whole formatting language below — lives in one `.html`
file. It requires an internet connection only to pull Google Fonts and the
Coloris color-picker library from their CDNs; there's nothing to install and
nothing to build.

## Features

- 20 built-in themes (presets), each bundling a full look: background,
  gradient, font, text color, accents, texture, border
- 20+ procedurally-generated background textures (noise, cloud/fBm fields,
  ink spatter, embers, snow, brush strokes, halftone dots, and more), each
  with adjustable opacity and an invert option
- A seeded random generator for textures, with a lock so you can pin a
  pattern you like while you keep tweaking everything else
- Multi-stop gradients (2-4 colors) for both background and text
- A vignette effect with four selectable blend modes
- A small markdown-like formatting language for the poem text itself —
  bold, italic, underline, strikethrough, accent colors, gradients, custom
  per-segment color/font/size/outline/shadow, and split-line justification
  (documented in full below)
- Six aspect ratios, three whole-line justification options, adjustable
  line spacing
- One-click "Randomize" for both fonts and backgrounds
- An Advanced panel that exports/imports the entire current configuration
  as JSON, so a look you've built can be saved, shared, or restored later
- Auto-generated download filenames, pulled from your poem's first heading
- Mobile-responsive layout that switches to a stacked view on phones

## Using the app

### Writing your poem

Type into the main text box. Blank lines create a gap between stanzas; two
blank lines in a row create a wider one. Everything else — headings, quotes,
bold, colors, and so on — is covered in the Formatting Language Reference
section below, and is also summarized live in the app's own "Formatting
Guide" panel.

### Picking a theme

The Style Presets grid applies a complete look in one click: background,
gradient, font, text color, both accent colors, texture, and border. After
picking one, every individual control still works normally, so a preset is a
starting point, not a lock-in.

### Customizing background, text, and effects

- **Stage Options** controls the background: solid color or gradient (2-4
  stops), an optional texture (with its own type, opacity, invert toggle,
  and seed), an optional border, and the vignette.
- **Typesetting** controls the poem text itself: font, color or gradient (2-4
  stops), size, line spacing, and both accent colors.
- **Text Effects** adds an outline or drop shadow to the text.

### Textures and the seed lock

Every texture is generated from a numeric seed, shown next to a Reroll
button and a Lock checkbox. Unlocked, picking a new preset or hitting
"Randomize background" rolls a fresh seed automatically. Locking it keeps
your current pattern in place through both of those, so you can keep a
texture you like while adjusting colors, fonts, or anything else around it.

### Frame and justification

Pick an aspect ratio (1:1, 2:3, 3:4, 9:16, 9:20, or 16:9), then set overall
justification (left/center/right) and vertical position (top/center/bottom)
for the whole block of text. Individual lines can override this — see the
Formatting Language Reference.

### Downloading your image

The Download button exports a JPG at full quality. The filename is
generated automatically: it looks for your poem's first heading line and
uses that (stripped of formatting, truncated to 40 characters, non-
alphanumeric characters removed, spaces turned into dashes); if there's no
heading, it uses the first line that has actual text instead. The final name
is `poetrypress-<that-slug>-<timestamp>.jpg`.

### Advanced: saving and loading settings

The Advanced panel at the bottom of the controls holds the entire current
configuration as JSON — every color, every toggle, the texture seed, the
poem text itself, all of it. "Refresh" re-captures the current state,
"Copy" puts it on your clipboard, and pasting JSON into the box and hitting
"Load" restores it. Useful for saving a look you've built without needing to
turn it into a formal preset.

## Formatting language reference

A lightweight, markdown-inspired language for styling poem text before it's
rendered to canvas. Everything below is parsed from the plain text you type
into the poem field — there's no separate "styling mode."

### 1. Line prefixes

Checked at the very start of a line, before anything else is parsed.

- `## text` — Heading — 1.33x the line's normal size
- `-# text` — Small aside — 0.66x the line's normal size
- `> text` — Quote — forces italic, adds a left bar, renders at 68% opacity

### 2. Inline styles

- `**text**` — Bold
- `*text*` — Italic
- `_text_` — Underline
- `~~text~~` — Strikethrough
- `[text]` — Accent color one (only when enabled)
- `{text}` — Accent color two (only when enabled)

**Nesting** — all combine freely in any order: `**bold [with accent] still
bold**`. Every character tracks whichever styles are currently open, so
overlaps resolve correctly at any depth.

**Spacing rule** — `*`, `_`, `~~`, `**` don't trigger touching whitespace, so
`5 * 3 * 2 = 30` stays plain. `[ ]`/`{ }` don't have this restriction.

### 3. Hidden gradient blend

- `{[text]}` — Gradient, accent one to accent two
- `[{text]}` — Gradient, accent two to accent one

Both directions accept either closing order (`]}` or `}]`). Requires both
accents enabled.

### 4. Escaping

Backslash before any special character prints it literally, backslash
consumed: `\[not accent\]` becomes `[not accent]` (plain, uncolored).
Escapable: backslash, asterisk, underscore, tilde, square brackets, curly
braces, angle brackets, forward slash.

### 5. Whole-line justification override

End a line with `/l`, `/c`, or `/r`.

### 6. Segmentation Operator (advanced)

`<...>` isolates part of a line for independent formatting, chainable with
`/`:

- `/l /c /r` — Justification for this segment
- `/#:hex` — Custom color, overrides accents
- `/f:N` — Custom font by index (see live list in-app)
- `/scale:N` — Custom size in pixels
- `/fx1,color,width` — Custom outline
- `/fx2,color,blur,x,y` — Custom shadow
- `/fx0` — Force outline/shadow off, even if on globally

Chain freely: `<text/#:ff00ff/f:4/scale:100/r/fx2,#ffffff,10,10,10>`

**Layout**: a segment without a justification directive flows normally in
sequence (positioned as a block per the line's own justification); a segment
with one is pulled out and anchored to that margin. So `plain text <right
side/r>` flows the plain part naturally and pins only the tagged part to the
edge.

### 7. Emoji colorization

Emoji inside an accent/custom/gradient-colored span get tinted
(silhouette-filled) to match, instead of rendering in native full color.

### 8. Parsing order

1. Escaping resolved first (sentinel substitution, restored at the end)
2. Line prefixes checked next (start-of-line only)
3. Segmentation parsed next
4. Whole-line justification suffix only checked if no segmentation groups
   found
5. Inline styles parsed per-part
6. Quote's forced italic layers on top of existing inline styles, doesn't
   override them

### 9. Known limitations

- Custom `scale:N` doesn't participate in the line's auto-fit height — a
  much-larger custom size can visually overflow into the next line.
- Font indices are positional — reordering the font list changes what old
  `f:N` references point to. The in-app guide's list is generated live to
  make this checkable.

## Support

If this is useful to you: ko-fi.com/c0222f
