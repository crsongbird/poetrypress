# Changelog

Patch notes, newest first: one section per release, named for its moon. The
newest section is also the release's commit message (`node build.mjs --notes`
prints it).

## Jupiter–Hegemone (2026-10-13)

- The Athanor learns from Filter Forge:
  - **Map inputs.** In a new graph, a gray map wired into a part's ⚙ setting
    sets it point by point (a threshold that changes across the page, a
    blend stronger in some places). Graphs made before still take the map's
    average, and the textures draw exactly as before.
  - **Curves**, a new kind of wire (green, dotted):
    - Curve makes one: bias, gain, gamma, a bell, a peak, stairs, a step, a
      wave, an arc, a wobble.
    - Curve Ops repeats, shifts, flips or combines curves.
    - Tone Curve runs a picture through one.
    - Profile Gradient shapes a gradient with one.
  - **New parts:** Perlin Noise, Bricks (a curve can shape the bevel),
    Brightness & Contrast, High Pass, Sharpen, Motion Blur and Offset.
  - **Math** gains divide, power, average, screen, modulo and sine.
  - A part that needs an input shows its empty port in red, and its preview
    shows a warning in its place until something is wired in.
  - **Note**: words on the graph for whoever opens it next.
  - The Surface has a **Size** that scales everything in the graph.
  - Only controls that reach the Surface appear on the page.
- ROADMAP.md is the plan for the surface engine, for whoever works on it next.

## Jupiter–Sinope (2026-10-13)

- Your poem and its look are kept as you work, so a closed or dropped tab
  opens again where you left off. A first visit still opens on the welcome
  page. (Lain's work.)
- The surface menus (Surface Variant and Base Surface) are now tiles. Each
  shows a small picture of the surface as a preset wears it. Groups fold, and
  a search finds a surface by its name, its group, or the names of its
  readings ("rose" finds Stained Glass). The pictures are made once per
  release and kept in your browser, so they appear at once after that.
- Built-In Presets has a search, and its groups fold. Folded groups are
  remembered.
- Text Clearing (Surface Texture): quiets the surface behind your words,
  fading out around them, so small text stays readable over a busy surface.
  Fixed: Base Surface's menu showed empty groups.
- The Athanor can read your poem. The Poem is a new part that hands on four
  maps:
  - Words: where the words are.
  - Distance: how far each point is from the words.
  - Lines: a band for each line.
  - Stanzas: a region for each stanza.
  A new starter, Ripples from the Words, draws rings spreading out from the
  text.
- New Athanor parts: Grow & Shrink, Pixelate, Twirl, Mirror and Chromatic
  Offset.
- Preset tiles now show every knob and hue their preset sets.

## Jupiter–Megaclite (2026-10-12)

- New textures:
  - Knotwork: interlaced ribbons that go over and under, built on Cromwell's
    grid the way Celtic knots are drawn. Choose the strands, the breaks, the
    outline's shape and the ribbon's width. It is carved and lit by the dial.
  - Fractured Glaze is now cracks spreading across a glaze: each crack runs
    until it meets another and new ones branch off at right angles. From One
    Point starts them at an impact set by the dial. Cracks are carved and lit;
    Chipping flakes the glaze at the edges. The old crazed glaze stays
    available for old looks.
  - Veins of Light: glowing wires, tiny machines or colored fibers growing
    through rock layers, pebbles, sand, fibers or skin. The growth follows the
    material's gaps and lights the surface around it.
- You can place what you see: Lichtenberg Figures and Ruffled Growth gain Zoom
  and Slide, Aurora gains Horizon, and Veins and Knotwork have Slide. The dial
  sets the direction.
- Lichtenberg Figures: always one pole or two. Two poles always meet with one
  joined channel between them. Zoom carries the figure to the page's edges.
- Stained Glass: Window now draws arches out of the glass itself, in a lancet,
  an arcade of three or a round window. The outline is heavier lead, and the
  border glass beyond it has its own colors. The stone is gone. The lead is
  flat, dark and satin, with soldered joints, no longer a silver pipe.
- New default poem.
- The page's aspect ratio stays as you set it. Loading a look, spell or JSON
  never changes it.
- Removed the preset previews on mouse-over (desktop).
- Twelve new presets, so every preset group fills whole rows of four:
  Aftertaste, Margins, Night Swim, Afterglow, Rimed, Monsoon, Tidepool,
  Circuitry, Undergrowth, Windward, Highlands and Interlace. Hourglass now
  wears the new cracked glaze.
- Spell codes are written only in Runology's runes (its Archetypes and
  Accents). Every preset has a new spell, and old spells still load.

## Jupiter–Eirene (2026-10-12)

- Layout: the phone layout now follows the window's shape, not its width. Any
  window 2:3 or taller gets it; anything squarer gets the two desktop panes
  at any width. Fixed the half-empty stacked layout at in-between widths.
- Crystal Leaf (Lucid) draws about a quarter faster, and changing its hues
  redraws in a fraction of the time (its lit structure is kept). The picture
  is identical.
- Presets are regrouped by Ruby's categories: Basic Scenes, Paper &
  Stationery, Skies & Stars, Weather & Water, Particle Systems, Geometric,
  Nature, Materials & Craft, Grown & Generated, and Rituals & Magic.
  - Removed: Riverbed, Gingham, Ruled and First Frost.
  - Reworked: Sea Glass (a deeper sea), Sunroom (the backdrop's own round
    gradient), Sundress (engraved rosettes), Hush (cold-press paper), Signal
    (the glyphs shown bright) and Rose Window (a round window in stone).
  - New: Struck, Coral, Leopard and Borealis.
- The six Basics now live only in the Athanor (Start from… → Basics). Looks
  saved with one still open.
- New textures, in a new group, Grown & Generated:
  - Lichtenberg Figures: the branching path electricity burns, grown the way
    lightning is simulated. Use one strike or two or three poles. Choose
    charred wood, live embers or a strike lit inside clear acrylic. The dial
    sets where it enters.
  - Ruffled Growth: a line that grows, crowds itself and folds like coral or
    lettuce, toward the dial's sun.
- New texture, Aurora: curtains of fine rays over Deep Field's stars, green low
  and red high, with a pink hem. The dial leans the rays.
- Aurora Veil is now called Silk Ribbons. Same look; saved looks keep it.
- Poured Wax is waxier: light sinks into it and comes back out (translucency).
  New sliders:
  - Splatter takes it from poured wax to flung paint or ink.
  - Height sets how thick it stands.
  - Sheen goes from matte to wet.
  New readings: Spilt Ink, Paint Spatter and Lacquer Seals.
- Stained Glass gains three sliders: Scene, Glass Texture and Window.
  - Scene colors each pane from a painted landscape behind it.
  - Glass Texture runs from cathedral through hammered and seedy to
    opalescent.
  - Window sets the glass in a lancet arch or a round window in stone.
  At 0 it draws exactly as before.
- New Athanor parts: Discharge, Wood, Burn, Growing Line, Starfield, Aurora
  Curtains, Pours, Meniscus and Glow Hue. The Light Engine gains Translucency;
  Panes and Glass gain the stained-glass options above.

## Jupiter–Eukelade (2026-10-12)

- Fixed: panning the Athanor's grid often did nothing, or started selecting
  text. Wherever the grid had been panned or zoomed away from, a press landed
  on the panel behind it, which the graph editor didn't treat as the grid.
  Now it pans from anywhere empty. The middle mouse button, or Space held,
  pans from anywhere, over parts too.
- Fixed: some graphs opened in the Athanor with only their first few parts
  (Painter's Frustration, Painted Landscape, Oil on Canvas). A part whose
  wire sweeps only part of a setting's range stopped the graph loading
  partway.
- New texture group, Basics, first in the menu: Cells, Checkerboard,
  Gradient, Plain Noise, Polka Dots and Stripes. They are quiet grounds that
  leave room for a poem, and each is only two or three Athanor parts, so they
  are also the easiest graphs to open and learn from. Cells takes the light.
  Each has four readings.
- Presets are now grouped by what you might be looking for: Quiet Pages,
  Bright & Playful, Night & Stars, Glow & Glitter, Weather & Water, Places,
  Paper & Keepsakes, Bold & Graphic, and Ritual & Omen.
- Twelve new presets: Hush, Ruled, Gingham, Sundress, Sunroom, Postcard,
  Riverbed, Fernlight, Wayfinder, First Frost, Marbled and Rose Window.
- New Athanor parts:
  - Terrain: an imagined land's heights.
  - Contour Lines: the contour lines of any gray map.
  - Turing Pattern: spots, coral, mazes, worms or holes that grow by
    themselves.
  - Flow Lines: evenly spaced ink lines along a current, which any gray map
    can bend.
  - Washes: the shapes of two watercolor pigments.
  - Pigment: lays any gray map on a picture as watercolor.
- Contour Map, Turing Skin, Flow-Field Ink and Watercolor Wash are now built
  from those parts and look as they did; Flow-Field Ink draws exactly as
  before.

## Jupiter–Pasiphae (2026-10-12)

- The Athanor is easier to handle with a mouse:
  - A part drags from anywhere on it, not only its title (its fields and
    ports still work as before).
  - The scroll wheel zooms on Firefox. Firefox reports wheel steps in lines,
    which were being read as pixels, so each step barely moved.
- Fixed: wires sometimes pointed to the wrong places when the Athanor was
  opened again later. They had been drawn while the panel was hidden; they
  are now redrawn on every opening and when the fonts arrive. The graph
  itself was never damaged.
- Undo and redo in the Athanor: ↶ and ↷ in its bar, or Ctrl/⌘+Z and
  Shift+Ctrl+Z (or Ctrl+Y), 100 steps deep. Ctrl+D duplicates a part, F fits
  the view, and Delete removes the selection (asking first, as always).
- The Oil on Canvas starter is back: any texture, painted in oil on a little
  canvas weave and lit by the Light Engine. It shows how parts fit together.
- New part, Particles: snowflakes, sparks or glittering motes, drawn over any
  picture in any two colors, with the wind taken from the dial. First Snow,
  Burning Mana and Euphoria Dust are now built from it, and draw exactly as
  they did.

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
