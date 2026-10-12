# Changelog

Patch notes, newest first: one section per release, named for its moon. The
newest section is also the release's commit message (`node build.mjs --notes`
prints it).

## Jupiter–Kalyke (2026-10-12)

- Dice: a die (⚄) now sits beside the lock in every section's heading, and
  rolls only that section.
  - Backdrop, Surface and Typeface roll the way their Summon buttons do.
  - Every other section rolls each of its sliders, menus and colors within
    reason.
  - Locked controls stay put, and the lock beside the die keeps the whole
    section through any roll.
  - On the Surface, Shift-click or a long press on the die rolls only the
    seed: the same texture with a new pattern.
- Painter's Frustration is now built from Athanor parts: Angry Strokes (the
  paint and its thickness), a little Canvas Weave, then the Light Engine
  before the output. That is the same oil-on-canvas module as Painted
  Landscape. Wetness also flattens the paint and makes it glossier.
- Halftone and Film Grain are built from Athanor parts too. Halftone Screen
  can print any tone as dots at an angle; Film Grain can go over anything.
- The Oil on Canvas starter is gone; its parts now live inside the textures
  that use them.
- Fixed: on the page, a part without its own drawing code (Mix, Levels and
  the like) could not read a picture made by a part that has it. This is what
  had kept Painter's Frustration from being lit.

## Jupiter–Sponde (2026-10-12)

- The Athanor has the app's lighting engine as a part, the Light Engine. Wire
  a picture and its heights into it and the light dial lights them. Its
  settings are Relief, Gloss (or a gloss map, for shine in some places only),
  Shine, Shadow, Occlusion and Ambient. It also has hue ports for the shadow,
  highlight and light colors; left empty, it uses the page's own material
  hues.
- Oil Paint: a new part that repaints any picture in oil brushstrokes. Big
  strokes go down first, then smaller ones where there is detail; each
  follows the picture's shapes and stops at its edges. Its second output is
  the paint's heights (ridges, bristle grooves, paint piled at the ends), for
  the Light Engine.
- Canvas Weave: a new part, the cloth under a painting, as heights.
- A new starter, Oil on Canvas: any texture turned into an oil painting the
  dial lights.
- Painted Landscape is now oil on canvas that the light dial lights. A sixth
  slider, Impasto, sets how thick the paint stands; 0 is the old flat
  painting.
- Athanor:
  - each part wears the color of what it makes, the same color as its
    output dots and wires;
  - a tapped or clicked part comes to the front;
  - the mouse wheel zooms toward the pointer, and the view can zoom out
    further on big graphs;
  - larger type in the parts;
  - on a phone, the top bar is one row: ⋯ holds Kept, Help, Revert and
    Clear, and the zoom buttons are gone (pinch to zoom);
  - the teaching note sits beside the parts list instead of over it, dims
    the grid while it shows, and closes with a click anywhere;
  - its old card in Esoterica is gone; it opens from the top bar.
- Presets: the built-in presets are alphabetical within each heading.
  Custom Presets ends with a "＋ Save this look" tile.
- Cartomancy: Wear has far more range. At the top, nearly every card is
  marked, many two or three times.

## Jupiter–Carme (2026-10-12)

- Inline code works again. Its background box read a color the wrong way, so
  every frame with `code` in it failed and the preview froze on its last
  picture. This happened in every browser.
- Desktop preview: the viewer is now the whole right pane, and the picture
  fits inside it. The aspect ratio buttons change only the picture, not the
  viewer. The fit, undo, redo, filmstrip and Save image buttons sit in a strip
  at the bottom of the pane instead of on the image. Zooming with Ctrl or ⌘
  and the wheel fills the whole pane. The phone layout is unchanged.
- Presets:
  - Known Rituals is now Built-In Presets.
  - Custom Presets is its own card underneath: saved looks, alphabetical,
    wrapping onto as many rows as needed.
  - The saved looks in Esoterica → Spellcrafting are alphabetical too, and
    wrap instead of scrolling sideways.
- Opening page: "WTF is PoetryPress?", written in PML. 9:16 is now the
  default shape.
- First visit: two things are added once, and stay deleted if deleted:
  - Grimoire: the old instrument panel, "PoetryPress Instrument Panel",
    dated the release day.
  - Custom Presets: a plain example look, "Example · Linen Page" (warm paper,
    dark ink, Alegreya, a little linen).
- Rosé: the plum-charcoal colors are back.
- Build: `node build.mjs --zip` deletes the old archive in release/ before
  writing the new one; `node build.mjs --notes` prints these notes.

## Jupiter–Taygete (2026-10-12)

- Painted Landscape in Bob Ross's manner: evergreens laid in with a fan
  brush, knife-painted mountains with snow, mist at the foot of far ranges.
  Coasts stand in the water, each headland with its reflection; cliffs step
  down in ledges with foam at their foot.
- Cartomancy: eleven implied games, none quite a real one; card backs in one
  family (ten patterns, ten medallions); games played for beads or beans when
  not for money; two new sliders, Wear (damaged cards) and Clutter (candles,
  cups, letters, a crystal ball… kept toward the edges); about twenty easter
  eggs. A Table Objects part in the Athanor.
