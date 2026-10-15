# Changelog

Patch notes, newest first: one section per release, named for its moon. The
newest section is also the release's commit message (`node build.mjs --notes`
prints it).

## Saturn–Tethys (2026-10-15)

- **More new parts in the Athanor**, from Filter Forge's list:
  - **Split HSB** and **Merge HSB**: a picture as hue, saturation and
    brightness, and back. Wire a Gradient into Merge HSB's Hue for a
    rainbow.
  - **Split Lab** and **Merge Lab**: lightness as the eye sees it, and two
    color axes, to work on the light without shifting the colors.
  - **Median**: each point takes the middle of its neighbors, so specks
    vanish and edges stay sharp. Its Percentile darkens or lightens instead.
  - **Map Switch**: a gray map chooses which of up to four pictures shows,
    band by band (sand, grass, rock and snow by height, say).
  - **Flip**: a picture turned over, left to right or top to bottom.
  - **Perspective**: a picture laid flat on the ground and seen at a slant,
    repeating toward the horizon, like a tiled floor.
- Each has its own wiki page.
- Fixed: a border gradient set to 0° drew at 45°, as if unset. It now runs
  straight across, as the slider says.
- Fixed: the vignette's grit was coarser in the preview than in the saved
  image. It is now measured in the saved image's pixels, so the preview is
  the saved image scaled down.
- **Under the hood:**
  - pruned the stylesheet: it was checked in every state, and nothing in it
    goes unused;
  - reviewed the tests: the frame's suite now checks what the real render
    draws (the gradient's line, the bloom's passes, the vignette's circles
    and grit) instead of reading the code, which is how the two fixes above
    were found; a check for a long-gone panel was dropped.

## Saturn–Enceladus (2026-10-15)

- **New parts in the Athanor**, from Filter Forge's list:
  - **Ellipse**: an ellipse, or rings of them like orbits, drawn as lines
    or filled in bands; it also gives how far out from its center each
    point is, and how far around.
  - **Polygon**: 3 to 12 sides, or a star, or rings of them, with a Bevel
    that rises to its center for faceted heights.
  - **Triangle Mesh**: scattered points joined into triangles (Delaunay's).
    Thin Out keeps only the shorter lines, for constellations; Facets gives
    each triangle its own gray, for a low-polygon look.
  - **Blocks**: rectangles of random gray at several sizes. Their outlines
    alone are a circuitry of lines.
  - **Pyramids**: a grid of pyramids, cones or domes, for studs and rivets.
  - **Noise Gradient**: a gradient between two colors whose many stops
    drift, for nebulae and old dyes.
  - **Cells** also gives **Stones**: rounded stones with a gap between them
    (its new Gap setting).
  - **Math** can now Round, Floor and Ceiling (terraces), compare (Greater,
    Less) and take a Log.
- **Three Surface Studies use them:**
  - Constellation Without Stars draws its lines with Triangle Mesh;
  - Orbit Script draws its orbits with Ellipse;
  - Deep-Space Dust drifts its color with Noise Gradient.
- Each new part has its own wiki page.

## Saturn–Pallene (2026-10-15)

- **More settings follow a map.** In the Athanor, a gray map wired into one
  of these settings' ⚙ now sets it point by point instead of as one average:
  Blur's Radius (sharp in places, soft in others), the Scale of Value Noise
  and Perlin Noise, Motion Blur's Length and Angle, Grow & Shrink's Amount,
  Twirl's Twist, Edge Detect's Strength, Scatter's Size (each mark sized
  where it lands), the Relief of both lights, and the Light Engine's Gloss.
- **Each part's wiki page marks the settings that take a map** ("by point",
  linked to the page that explains maps), and a setting's menu says whether
  a map on its ⚙ works point by point or as an average.
- Surfaces you kept before draw exactly as they did: they read these
  settings as one average, as before. Graphs begun from now on (from
  **Open**, or ⋯ › Clear the grid) take them point by point.
- Fixed: the wiki said a higher Scale gives Value Noise and Perlin Noise
  bigger blobs. It gives more, smaller ones.

## Saturn–Anthe (2026-10-15)

- **Every texture in the menu but Deep Field now opens in the Athanor.**
  Eighteen more are graphs: Cold Press, Old Paper, Dream Bloom, Silk
  Ribbons, Hoarfrost, Rain on Glass, Dune Ripples, Lotus Pond, Night City,
  Scrying Pool, Suminagashi, Burnt Letter, Crystal Leaf, Cup Ring, Kintsugi,
  Metal Spangle, Moss on Stone and Transmutation Circle. Open one from
  **Open** › The app's own textures to see its sliders, hues and dial wired
  in, and use its part in your own surfaces. Each looks exactly as it did.
- **Eighteen new parts**, one for each, with a wiki page saying what it
  does, how it does it and what each setting changes. **Variant** on these
  parts gives another of the same kind; at 0 the part draws exactly what the
  texture draws.
- A Rain on Glass part in your own graph shows the page's colors through
  its drops, as the texture does on the page.

## Saturn–Methone (2026-10-15)

- **Eight more textures open in the Athanor.** Binary Pattern, Chladni
  Sand, Guilloché, Sigil Scatter, Rorschach Test, Facet Field, Black Hole
  and Fractal Moon are now graphs: open one from **Open** › The app's own
  textures to see its sliders wired in, and take its part into your own
  surfaces. Each looks exactly as it did.
- **New parts:** Bit Grid, Chladni Sand, Guilloché, Sigils, Ink Blot, Facet
  Field, Black Hole and Fractal Moon. Bit Grid and Chladni Sand can follow
  any gray map wired into their **Where**; Guilloché also gives its lines
  alone, to light or color another way.

## Saturn–Mimas (2026-10-15)

- **The Arcane Guidance teaches.** The PML guide in the Inscription tab now
  says what each kind of mark is and why you'd use it, then gives an
  example. **⤓ Try** puts the example in your poem where the cursor is, and
  undo takes it back.
- The guide now also teaches the effect stack (`/fx:outline(…)+glow(…)`)
  and stitched underlines (`/under:wave,…`), which until now only PML.md
  explained.
- **Under the hood:**
  - pruned the stylesheet: three declarations that never won anywhere are
    gone, checked against every screen;
  - reviewed the tests: the save-and-load suite that repeated the audit is
    gone (its own checks moved to the audit and the coverage suite), the
    themes have a suite of their own, tested by behavior, and checks for
    names and controls long since gone were folded into one list of retired
    names.

## Saturn–Aegaeon (2026-10-15)

- **The wiki shows what it teaches.** Each concept page in the Athanor's
  wiki now has a figure: a small working graph, with what each of its parts
  makes, and a line saying what to see. There are eleven: gray maps,
  pictures, colors, numbers, curves, driving a setting with a map, wire
  ranges, masks, blend modes, heights, and seeds. They are drawn live by the
  app, so they always show what the parts really do.

## Saturn–Janus (2026-10-15)

- **The Athanor's bar, simpler.** It now reads: Open, Keep, undo and redo,
  the view, ⋯, whether the page shows your graph, and Done.
  - **Open** is the one place to begin from. It lists your kept surfaces,
    the starters, the Basics, the Surface Studies and the app's own textures
    by group, each with a line saying what it teaches.
  - **⋯** holds everything else: copy or share the wiring, your shelf of
    kept surfaces, Tidy, Revert, Clear the grid, and the wiki.
  - **Use** is gone. The bar says **✓ On the Page** when the page shows
    this graph, and **⇱ Show on Page** puts it there when it doesn't. If you
    press Done after changing a graph the page isn't showing, the app offers
    to show it.
  - **Kept** is gone too: opening a kept surface is under Open, and the rest
    is under ⋯ › Your shelf….
- **Every menu in the Athanor** shows each item's hint in full, under its
  name, instead of cutting it short.

## Saturn–Epimetheus (2026-10-15)

- **Circuit Board**, a new surface in Pattern & Order, in place of Veins of
  Light. Chips and buses of copper traces, routed the way boards are: the
  traces run side by side and turn together, ending in vias and pads, with
  small parts and their printed names between.
  - **Charge** decides how many traces carry current: none (bare copper on
    the board), then colored, then glowing, then sparking.
  - **Data Flow** sends bright pulses and packets of bits along the powered
    traces, in the Data Hue.
  - **Bends** turns the corners square (like Factorio's belts) or at 45°
    (like a board's), and **Traces**, **Components** and **Scale** set how
    full and how fine it is.
  - The board is made of your backdrop's own colors, the traces wear your
    accents until you choose their hues, the Glow Hue adds an aura, and the
    light dial lights it all.
- Veins of Light leaves the menu. Looks made with it, and the Circuitry
  preset, still open as they were.
- **New in the Athanor:** Circuit Traces, the part that routes the board,
  and **Page Backdrop**, which brings the page's backdrop into a graph as a
  picture.
- The Glow Hue now glows in Poured Wax (it had been too faint to see).
- Preset and history tiles show surfaces made of the page in that look's
  own colors.
- The Athanor's Blend part is several times faster.

## Saturn–Prometheus (2026-10-15)

- **Two Surfaces, each with every control.** Turn on Two Surfaces in the
  Surface Texture card and a second surface lies beneath the first. Upper
  and Lower choose which one the controls below change: its variant, every
  slider, its hues, its light, its seed, its readings and its locks. (The
  old base layer had only two sliders; looks made with it open as before.)
- **Swap** trades the two surfaces whole, blend and locks included.
- **Every blend for every surface.** The Blend Mode menu lists the blends
  made for the surface first, then every other: the canvas's own and six
  more mixed pixel by pixel (Vivid Light, Linear Light, Pin Light, Linear
  Burn, Subtract, Divide, marked ⚡). A grey surface is made on the ground
  that suits the blend it is given, so the blend changes only its marks.
- **Text Clearing** moved to the Text Effects card, beside the effects it
  works with. It quiets both surfaces behind the words.
- Preset and history tiles show both surfaces of a look.
- The saved image's alt text names the surface beneath, and the report's
  §Surf variables always describe the surface on top, whichever the
  controls show.

## Saturn–Atlas (2026-10-15)

- **The wiki turns its own pages.** Every page of the Athanor's wiki ends in a
  bar with the page before and the page after, in the order of the contents,
  and the bar stays at the foot of the screen while you read.
- **Surface tiles are remembered.** The thumbnails in the surface menus stay
  in your browser from one visit and one release to the next; a tile is
  painted again only when its surface really changed.
- On a phone held sideways, the divider under the preview now always drags
  up and down (it used to read the wrong direction).
- The tree trunks in Painted Landscape keep their fine lines in the small
  preview, as in the saved image.
- **Under the hood:**
  - pruned the stylesheet: the declarations that never won anywhere are
    gone, checked against every screen (desk and phone, each tab, the
    Athanor, its wiki, each theme), and the parked sideways layout went
    with them;
  - reviewed the tests: suites by concern instead of by session, behavior
    instead of copies of the code, a dozen duplicates and snapshots gone,
    and a test boot 70 times faster;
  - the project now checks itself: unused code, strings, styles and files
    fail the tests, and so do docs that name what no longer exists or
    count differently from the code.

## Saturn–Daphnis (2026-10-15)

- **The help keeps up with the app.** The rules for working on Vellum now
  say that a change isn't finished until the wiki, the tooltips and the
  guides that explain it are current. A test checks the parts that can be
  checked: every input, output and setting has its explanation, and the
  wiki names only menu items and parts the editor still has.
- The old Reaction–Diffusion part's page now explains its input, output and
  settings.
- The wiki's tidy instructions use the menu's real name: Tidy into columns.

## Saturn–Pan (2026-10-15)

The first release named for Saturn's moons: Jupiter's ran out.

- **The Athanor has a wiki.** Help is now an encyclopedia of the editor,
  with contents, search, Back and links between pages:
  - **Start here:** what a node editor is, a step-by-step first surface, and
    how to read a graph.
  - **Data and wires:** what a gray map, a picture, a color, a number and a
    curve each are, what happens when kinds don't match, ⚙ settings,
    required inputs, driving a setting with a map, and wire ranges, with
    worked examples.
  - **Techniques:** masks and blending, blend modes, height maps and light,
    seeds and Variation, size and resolution.
  - **A page for every part:** what it does and why you'd use it, its
    inputs, outputs and settings each explained, things to try, and related
    pages.
  - A glossary.
- **About this part** in every part's menu opens its page. A port's menu can
  explain what it carries.
- **Menus explain themselves:** each action has a plain name and a line
  saying what it does ("Connect its output…: click the part it should
  feed", "Set wire range…: which part of its range the wire sweeps").
- **Clearer names:** Levels has Black Point and White Point, Threshold a
  Cutoff, Perlin Noise Octaves; ports read "map" and "picture" rather than
  "field" and "image". Some parts are renamed for what they do: Simple
  Lighting, Paint Swipes, Growth Medium, Differential Growth, Watercolor
  Bleed, Stained Glass, Card Deal.
- The notes shown when a graph opens explain how it is built again, and what
  to try.
- Tooltips elsewhere in the app are full sentences again.

## Jupiter–Kore (2026-10-14)

- **Clearer, shorter text in the Athanor.** Part descriptions, the notes
  shown when a graph opens, the Help and the menus are rewritten for someone
  who knows the basics of graphics: short, in standard terms, without the
  hand-holding. Menus say "Wire in…", "Set wire range…", "Reset all
  settings" instead of full sentences.
- Instructions say **click** with a mouse and **tap** on a touch screen.
- Fixed: tapping the Athanor's preview on a phone didn't enlarge it.
- A few long tooltips elsewhere in the app are shorter.

## Jupiter–Cyllene (2026-10-14)

- **Fixed: wires drawn to the wrong row.** In a graph whose wires were made
  in a different order from its ports, the Athanor drew them into the wrong
  settings, although they were really connected to the right ones (Ruby's
  Halftone showed this). Every wire now lands on the port it is connected to.
- **One name for a surface.** The Surface part's name is now also the name
  it is kept under. Keep it under a new name and the Surface part takes that
  name too. Choosing a kept surface in the surface menu shows it by the same
  name, so it no longer looks like the menu picked something else.
- **Keep is one tap**, in the Athanor's bar (and first in its ⋯ menu).
- **Replace:** a kept surface can be replaced with the graph on the grid,
  and keeping a surface under a name already taken asks before replacing it.
- **Your Surfaces have pictures.** Each kept surface's tile shows the
  surface, drawn at its default settings, and the picture is redrawn when its
  wiring changes.
- **Share the wiring.** Hold a surface you made in the surface menu (or
  right-click it) to use it, open it in the Athanor, share or copy its
  wiring as text, or take it off the shelf. The Athanor's Kept menu can copy
  and share wiring too, and **Paste a surface's wiring…** puts copied wiring
  back on a shelf, yours or someone else's.

## Jupiter–Callirrhoe (2026-10-14)

- **The dice remember how you like to roll.** Choose Gently, As usual or
  Wildly from any die (hold it on a phone, or tap ▾ beside it on a computer)
  and every die rolls that way from then on, along with the Summon New
  Typeface, Backdrop and Surface buttons and the light dial's ⚄. Each die
  shows the way it will roll: ⚁ gently, ⚄ as usual, ⚅ wildly.
- **Gently** now also turns the light dial a little, lets colors drift
  together with a touch of their own, never changes the surface, and when it
  changes the typeface picks a similar one (a serif for a serif).
- **Wildly** no longer flips switches.
- **Locks win.** Nothing a lock holds is changed by any die, Summon button,
  the light's ⚄ or a preset:
  - Fixed: renaming a surface's knobs wiped their padlocks, so the knobs of
    most surfaces couldn't stay locked. The same was true of the base
    layer's knobs and the text effects' settings.
  - Fixed: a locked surface put back after a roll could reset its own locked
    knobs.
  - The light's ⚄ says so when the light is locked, instead of turning it.

## Jupiter–Kallichore (2026-10-14)

- **Three ways to roll a section.** A tap on a section's die rolls it as
  before. Hold the die on a phone, or tap the ▾ beside it on a computer, to
  choose:
  - **Gently:** sliders move a little, menus and switches stay, and colors
    turn together, so the look stays itself.
  - **As usual:** what a tap does.
  - **Wildly:** anything goes, every slider across its whole range, menus,
    switches too.
  - **Back:** returns that section to how it was before its last roll,
    without undoing changes you made elsewhere since.
  - On the Surface, **Only a new seed** is there too (Shift-click still works
    on a computer).

## Jupiter–Aoede (2026-10-14)

- **Surface Studies.** All 36 surfaces from the future-directions document can
  now be opened in the Athanor (Start from… → Surface Studies), each built from
  general parts you can see, rewire and change, with a short lesson and a few
  knobs: Moonlit Fibers, Ink Thirst, Carbon Copy, Dead Channel, Holographic
  Foil, Memory Leak, Frozen Breath, Sigil Weather, Cracked Lacquer and the
  rest. These are first drafts. Orbit Script, Transmutation Engine and
  Constellation Without Stars are approximations until their own parts exist.
  They become textures in the Surface menu later.
- **New parts in the Athanor:**
  - **Scatter (Marks):** dots, rings, stars, crosses, dashes, diamonds,
    sparks, sigils or any picture, thrown across the page. A map can say where
    they fall and another which way they turn.
  - **Grid & Dots:** checker, grid lines, dots, hex dots, diamonds, stripes.
  - **Border Mask:** a soft frame from the page's edges, square, rounded or
    oval, roughened by any map.
  - **Lookup:** reads a picture at places given by two gray maps.
  - **Displace:** pushes a picture along the slope of a map.
  - **Gradient Map:** colors a gray map with up to five colors, smooth or in
    bands.
  - **Spectrum:** a rainbow, straight, round, around a point or laid along a
    map.
- **Variation** on Value Noise, Perlin Noise, Cells and Curve: change the
  number for a different pattern from the same settings.
- **The Poem** part has a **Rhymes** output: the words of lines that rhyme,
  every rhyme or one letter at a time.
- Fixed: in graphs made in the Athanor, marks, sizes and counts now come out
  at their true size at every resolution.

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
