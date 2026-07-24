# Ruby's Poetry Press

Your text. Your theme. Your style. Pressed on a page for social media.

Single-page web app for turning verse into images. Fuck Photoshop and Canva.

Works from a phone, in bed, at 2am, with no apps to install and no ads or bullshit.

Live: [poetrypress.unfixable.place](https://poetrypress.unfixable.place)

## What is this?

It's a tool like google canva, but typesetting-first, for poets and authors who want to present text content beautifully with no effort.

- 20 default theme options. Fully editable after you pick one.
- 20+ procedurally generated backdrops: noise, ink, snow, embers, brushwork, relief maps.
  - Each one seedable, invertible, never the same image twice... unless you lock it in!
- Selectable Multi-stop radial gradients, customizable accent colors, 22 fonts, background and text polish all over.
- Sliders for everything.
- Border and vignette options, if you wanna be pretentious.
- Randomizer buttons for font and background, when you don't know what you want yet.
- Save custom themes as JSON. Load them later.
- Export a full-quality JPG.

> We ended up inventing a light Domain Specific Language to do typesetting here that's similar to markdown and PCL, see the glossary below.

## Was this vibe coded?

Of course it was? I'm just a good vibe-coder.

## What's in each file?

```
index.html             — markup
poetrypress.css        — styling
appOptions.js          — fonts, presets, aspects
textParsers.js         — PML and text parsers, below
textureGenerators.js   — texture procedures, portable code
canvasRenderer.js      — canvas.js renderer implementation
appEvents.js           — addiitional wiring and DOM events
```

Tests live in [`test/`](./test). Run them with plain `node`.

## PoetryPress Markdown Language (PML) Guide

PoetryPress Markdown Language (PML) is a limited subset of and expansion of markdown. 

PML is plain text, mostly: the advanced and optional markup language features are simply always there for you when you want them.

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
Nest them however you want: `**bold [with accent] still bold**`.

**Gradients**
```
{[left to right]}   [{right to left]}
[text/lg]   [text/rg]   {text/lg}   {text/rg}
```
The first pair blends your two accents into each other using bracket order implicitly. 
The second group fades a single accent into your normal ink. `lg` is left gradient and `rg` is right gradient.

**Escape**
```
\[literal brackets\]
```

**Justify yourself**
End a line with `/l` `/c` `/r`. Or split it using *The Segmentation Operator*.
```
<left side/l><right side/r>
```

Advanced usage of **The Segmentation Operator**: Inspired by HP Printer Control Language... but for your markdown editor!
```
<text/#:ff00ff/f:4/scale:100/r/fx1,#abc,3/fx2,#ff0,10,5,5/fx0/grad:1#f00,2#00f>
```
- `#:hex` — a color of your own
- `f:N` — a different font, by index number
- `scale:N` — size, in pixels
- `fx1,color,width` — outline
- `fx2,color,blur,x,y` — shadow
- `fx0` — strip outline and shadow effects off
- `grad:1#..,2#..` — up to four stops, your own gradient
- `l` `c` `r` — left, center, right justification

Chain as many as you like. One slash between each dividing effects `"this is an <exmple/c/fx0/f:4>"` to set left justification, effects off, and font to index 4 for the word `example`.

One note about **Emoji**:
- inside a colored span, they take the color. Not sure why I added this feature but it's pretty neat.

## Ko-fi

If it's useful: [ko-fi.com/c0222f](https://ko-fi.com/c0222f)
