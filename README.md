# PoetryPress

A press for poems, in a browser. (Inside, in its code, it is Unfixable Vellum.)

Write the words. Choose a typeface, a ground, a surface for them to lie on.
Save the page as an image, with its words inside it.

**[poetrypress.unfixable.place](https://poetrypress.unfixable.place)**

Made on a phone, without a computer, by one person. Free, and it stays free.

---

## How PoetryPress works

PoetryPress turns a poem into an image. It is one web page: everything it
does happens in your browser, and nothing you write is sent anywhere. Under
the poem it has three engines:

- **a typesetter** for poems, with its own small markup language;
- **a procedural texture engine**, with a light engine that treats a texture
  as a surface with height and casts its shadows (on your graphics card when
  it can);
- **a node editor, the Athanor**, where you can open those textures, see the
  steps each is made of, change them, and build your own.

The sections below follow the tabs, left to right.

### 1. Inscription: the words

The app opens on a short welcome page, written in PML. Type your poem over it
in the editor. Plain text works as it is. To style it, use
**PML** (Poetic Magick Language), a markup in the spirit of Markdown:

- `## ` at the start of a line makes it a heading, and `-# ` a small aside;
- `**bold**`, `*italic*`, `_underline_`, `` `code` ``;
- `[words]` and `{words}` color those words with the page's two accent colors;
- `<words/red/scale:120>` gives a run of words its own color, size, font or
  effect;
- words that begin with `§` are variables that fill themselves in
  (`§Today`, `§MoonPhase`, `§SeedPhrase`…).

The full reference is in [PML.md](PML.md), and in the app under Arcane
Guidance. Script Highlighting colors the markup as you type.

### 2. Rituals: the shape and the presets

Choose the **aspect ratio** (9:16 to begin with, or square, landscape, or a
custom size in pixels) and where the text sits. **Built-In Presets** are whole
looks (typeface, colors, texture, frame) applied in one click, grouped by what
you might be after: Quiet Pages, Bright & Playful, Night & Stars, Places and
so on. Every click
draws a new seed, so a preset gives a slightly different image each time. The
preset stays lit until you change something; clicking it again rerolls it.

**Custom Presets** are your own saved looks, in alphabetical order. Save the
current look with ＋ Save this look at the end of the list, or Create in
Esoterica → Spellcrafting. A first visit finds
one plain example there, to try or delete.

### 3. Thoughtforms: the type

Choose the **typeface** (sixty-one, grouped by kind), the text's color or
gradient, its size and spacing, and up to three **text effects** (outline,
shadow, glow, letterpress, bevel and more), each with its own settings.

### 4. Materia: the page

The page is built in layers, from the bottom up:

1. the **backdrop**: a color or a gradient;
2. the **surface texture**: one of almost fifty, from film grain to a card
   game left on a table, blended onto the backdrop;
3. a **vignette**;
4. the **border** and an inset **box**;
5. the **text**, with its effects.

Each surface texture has its own sliders, two hues, and four **readings**
(🜂 Fire, 🜄 Water, 🜁 Wind, 🜃 Earth): ready-made settings that show what it can
do. The **light dial** sets where the light comes from (drag toward the
light) and how low it is (the distance from the center). Every texture that
has height is lit by it. The **seed** decides everything left to chance, and
every seed is also a short phrase.

The textures are generated, not stored as pictures: each is made by a
program from the seed and the sliders, at any size. They are made in a
background thread (a worker) so the page stays responsive, and kept in a
cache so that a change remakes only what changed.

### 5. Esoterica: everything else

- **Spellcrafting**: keep the whole look as a *spell* by name, bring it back,
  or share it as a link.
- **The Grimoire**: keep the poems themselves, dated by the moon. A first
  visit finds the Instrument Panel there: a page of §Variables that shows
  what the current look is made of.
- **Interface**: the app's theme (Rosé, Aether, Fathom, Vellum) and its sound.
- **The Workbench**: export or import the whole look as JSON.

### 6. The Athanor: textures you can open

Press **🜉 The Athanor** at the top of the page. It is a node editor, like
Blender's shader nodes or Filter Forge: a texture is a graph of small
**parts** joined by **wires**. Parts on the left make patterns (noise, cells,
smoke); parts in the middle shape, combine, color and light them; everything
ends in the **Surface** on the right, which becomes a texture on the page.

Many of the app's own textures are made this way. Choose one from **Start
from…** to see its parts and how they connect. Change a setting and the
texture changes; replace a part with another, or take parts from one texture
into another. The Athanor's **Help** button explains the rest: the four kinds
of thing a wire carries, how mismatched kinds are converted, how the page's
sliders and seed reach the graph, and what every part does.

### 7. Saving

**Save image** renders the page at full size and downloads it. The image
carries its own **alt text**: the poem, the credit, and a description of what
the image looks like. PoetryPress copies that alt text for you, ready to
paste into the post where you share the image.

Your work is kept in your browser between visits. The app works offline once
it has been visited, and it can be installed like an app. Undo and redo (and
the filmstrip of past versions) go back through every change. **Locks** keep
any setting fixed while presets and randomizers change the rest.

Some things are found by holding them down (or right-clicking). Pressing `?`
lists the keyboard shortcuts.

---

### The four elements

| | Element | Palette | Feeling |
|---|---|---|---|
| ♡ | **Whimsy** | red, purple, blue | sleep |
| √ | **Sharpness** | off-white, blue-black, metal | waking |
| ∆ | **Chaos** | sigils, noise, broken geometry | pain |
| 🜚 | **Touch** | neutrals only | contact |

---

Working on it? **[AGENTS.md](AGENTS.md)** has the commands, how it is built
and the rules it keeps. Known gaps: [OPEN-ISSUES.md](OPEN-ISSUES.md).
