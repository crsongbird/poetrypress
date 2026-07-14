# PoetrySky Press — Formatting Language Reference

A lightweight, markdown-inspired language for styling poem text before it's rendered to canvas. Everything below is parsed from the plain text you type into the poem field — there's no separate "styling mode."

## 1. Line prefixes

Checked at the very start of a line, before anything else is parsed.

- `## text` — Heading — 1.33x the line's normal size
- `-# text` — Small aside — 0.66x the line's normal size
- `> text` — Quote — forces italic, adds a left bar, renders at 68% opacity

## 2. Inline styles

- `**text**` — Bold
- `*text*` — Italic
- `_text_` — Underline
- `~~text~~` — Strikethrough
- `[text]` — Accent color one (only when enabled)
- `{text}` — Accent color two (only when enabled)

**Nesting** — all combine freely in any order: `**bold [with accent] still bold**`. Every character tracks whichever styles are currently open, so overlaps resolve correctly at any depth.

**Spacing rule** — `*`, `_`, `~~`, `**` don't trigger touching whitespace, so `5 * 3 * 2 = 30` stays plain. `[ ]`/`{ }` don't have this restriction.

## 3. Hidden gradient blend

- `{[text]}` — Gradient, accent one to accent two
- `[{text]}` — Gradient, accent two to accent one

Both directions accept either closing order (`]}` or `}]`). Requires both accents enabled.

## 4. Escaping

Backslash before any special character prints it literally, backslash consumed: `\[not accent\]` becomes `[not accent]` (plain, uncolored). Escapable: backslash, asterisk, underscore, tilde, square brackets, curly braces, angle brackets, forward slash.

## 5. Whole-line justification override

End a line with `/l`, `/c`, or `/r`.

## 6. Segmentation Operator (advanced)

`<...>` isolates part of a line for independent formatting, chainable with `/`:

- `/l /c /r` — Justification for this segment
- `/#:hex` — Custom color, overrides accents
- `/f:N` — Custom font by index (see live list in-app)
- `/scale:N` — Custom size in pixels
- `/fx1,color,width` — Custom outline
- `/fx2,color,blur,x,y` — Custom shadow
- `/fx0` — Force outline/shadow off, even if on globally

Chain freely: `<text/#:ff00ff/f:4/scale:100/r/fx2,#ffffff,10,10,10>`

**Layout**: a segment without a justification directive flows normally in sequence (positioned as a block per the line's own justification); a segment with one is pulled out and anchored to that margin. So `plain text <right side/r>` flows the plain part naturally and pins only the tagged part to the edge.

## 7. Emoji colorization

Emoji inside an accent/custom/gradient-colored span get tinted (silhouette-filled) to match, instead of rendering in native full color.

## 8. Parsing order

1. Escaping resolved first (sentinel substitution, restored at the end)
2. Line prefixes checked next (start-of-line only)
3. Segmentation parsed next
4. Whole-line justification suffix only checked if no segmentation groups found
5. Inline styles parsed per-part
6. Quote's forced italic layers on top of existing inline styles, doesn't override them

## 9. Known limitations

- Custom `scale:N` doesn't participate in the line's auto-fit height — a much-larger custom size can visually overflow into the next line.
- Font indices are positional — reordering the font list changes what old `f:N` references point to. The in-app guide's list is generated live to make this checkable.
