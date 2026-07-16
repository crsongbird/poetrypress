# Ruby's Poetry Press

A poem. A theme. A texture. Done.

Single-page web app for turning verse into images. No install. No Photoshop. Works from a phone, in bed, at 2am.

Live: [poetrypress.unfixable.place](https://poetrypress.unfixable.place)

## What it does

- 20 themes. Fully editable after you pick one.
- 20+ generated textures — noise, ink, snow, embers, brushwork, cratered worlds, whole relief maps. Each one seedable, invertible, never the same twice unless you lock it.
- Multi-stop gradients, background and text.
- Vignette. Four blend modes.
- A small language for the poem itself — see below.
- Randomize buttons for font and background, when you don't know what you want yet.
- Save your whole setup as JSON. Load it back later.
- Export a full-quality JPG, named for you, from your own first line.

## Architecture

Five files, no bundler, no build step.

```
index.html            — markup
poetrypress.css        — styling
appOptions.js          — fonts, presets, aspects
textParsers.js         — the DSL, below
textureGenerators.js   — every texture, self-contained
canvasRenderer.js      — parsed lines into pixels
appEvents.js           — wires the page together
```

Tests live in [`test/`](./test). Run them with plain `node`.

## The Language

Plain text, mostly. A little markup, when you want it.

**Lines**
```
## heading
-# small aside
> quote — italic, barred, a little transparent
```

**Inline**
```
**bold**   *italic*   _underline_   ~~strike~~
[accent one]   {accent two}
```
Nest them however. `**bold [with accent] still bold**` — it just works.

**Gradients**
```
{[left to right]}   [{right to left]}
[text/lg]   [text/rg]   {text/lg}   {text/rg}
```
The first pair blends your two accents into each other. The second fades a single accent into your normal ink.

**Escape**
```
\[literal brackets\]
```
A backslash, and the mark means nothing. Just words again.

**Justify**
End a line — `/l` `/c` `/r`. Or split it:
```
<left side/l><right side/r>
```

**The long form** — one bracket, many directives:
```
<text/#:ff00ff/f:4/scale:100/r/fx1,#abc,3/fx2,#ff0,10,5,5/fx0/grad:1#f00,2#00f>
```
- `#:hex` — a color of your own
- `f:N` — a different font, by number
- `scale:N` — size, in pixels
- `fx1,color,width` — outline
- `fx2,color,blur,x,y` — shadow
- `fx0` — strip whatever effect is on, just here
- `grad:1#..,2#..` — up to four stops, your own gradient

Chain as many as you like. One slash between each.

**Emoji**, inside a colored span, take the color. 🔥 becomes yours.

## Ko-fi

If it's useful: [ko-fi.com/c0222f](https://ko-fi.com/c0222f)
