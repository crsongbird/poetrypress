# Changelog

Patch notes, newest first: one section per release, named for its moon. The
newest section is also the release's commit message (`node build.mjs --notes`
prints it).

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
