# Open issues

Open items only — when one is done, delete it. Production:
poetrypress.unfixable.place · development: vellum.unfixable.place. Release:
release.js (`node build.mjs --next`). Timings: PERFORMANCE-AUDIT.md. How the
systems work: AGENTS.md. Prior art: Ruby's doc "Unfixable Vellum — Prior Art &
Recommendations".

## 1 · Ruby to judge (new in Jupiter–Pasithee)
- ALT TEXT in three parts under headings: "--- Image text ---" (the poem, its
  lines and stanza breaks kept), "--- Image credit ---" (By <the credit>.),
  "--- Description ---". The poem gives way first when it is long.
- …and since Bluesky doesn't read alt text from inside the file, Save image
  now copies it too ("Saved. Its alt text is copied…"), or offers a Copy alt
  text button where the browser won't allow it.
- THE README is short now: what it is, what is there, a hint that holding
  things and pressing ? find more. The personal line is now "Made on a phone,
  without a computer, by one person" — put back as much of the old line as
  Ruby wants. The markup's reference moved to PML.md; the builder's notes to
  AGENTS.md (with the componentizing rule).

### Still to judge from Jupiter–Autonoe
- CARTOMANCY is a game in progress now, a different one every seed: a
  reading (a spread for one), tricks (hands round the table, a trick in the
  middle, the stock and its trump), patience (the tableau, foundations by
  suit, stock and waste), a wager (hands, five shared cards, a pot, each
  player's stack) or pairs (a grid face down, a matched pair turned up). The
  seed also picks the players, the suits in the deck, the table (baize, felt,
  velvet, oak, walnut, marble, slate, linen), the cards' stock (ivory, cream,
  parchment, black lacquer, vellum) and edge (gold, silver, rose, copper,
  none), and the coinage: lunes ☽, obols ♄, quints 🜚, cinders 🜂, sigils ⛤,
  crowns ♔, tides 🜄, mercies ☿. STAKES sets how often there's money and how
  much. The four suits are the two accents and the texture's two hues. Every
  card and coin casts its shadow from the dial; coins are struck, domed and
  rimmed, stacks banded.
- …and its PARTS are in the Athanor: Table, Deal (four suit ports) and Coins,
  and a Card Table starter wired from them (a Knob on the Scatter).
- SCATTERED POLYGONS: Shape now makes convex polygons of every kind —
  triangles to decagons, even or uneven, drawn out long toward the top. At 0
  the original flakes, unchanged (some of those are slightly concave: say if 0
  should be convex too).
- STAINED GLASS: Shape (was Order) runs random shards (0–30) → a patterned
  lattice (diamond quarries, hexagons or bricks, its colours in rhythm) → a
  rose window (55–80) → an ordered grid of squares. The glass catches the
  light from the front: each pane gently domed, a flash where it faces the
  light, a rolling sheen, a bright rim against the lead on the lit side.
  (Looks saved with Order above 30 now show the new kinds.)
- PAINTED LANDSCAPE: COLOR (new, 0 as before) paints it — dawn, day, golden
  hour, dusk or moonlight; far ridges lean to the sky's colour; strokes in
  broken colour, warm toward the sun, cool turned away; the grey painting's
  values kept. Painted clouds (heaped cumulus with lit tops and flat shadowed
  bases, stratus, cirrus), a sun or a moon, its path on water, snow on far
  peaks, two new countries (fields, a volcano with its plume). High Plains
  (🜁) shows it in colour.
- SLEEP HAZE about twice as fast (~640 → ~300 ms): the slow "basic noise" one,
  I think? If Ruby meant another, say which. (Cold Press is the next slowest:
  its lighting, ~0.8 s; it is quicker where the GPU lights it.)

### Still to judge from Jupiter–Arche
- LOCKS: every slider and menu in the making tabs can lock. Each section's
  heading has a MASTER LOCK (locks everything beneath; tap again to unlock
  all; half-closed when only some are), and so does each sub-section's row.
- EYES in place of the switch checkboxes; a card's own eye sits in its
  heading beside its lock, spaced away from the fold (a tap on either never
  folds the section).
- More folds: Form & Bearing, Known Rituals, and Interface (was Appearance:
  the theme, then Sound — a switch and a volume, nothing to read).
- THE DIAL: its angle and reach shown beneath it, and typed exactly.
- SUMMON NEW SURFACE (under the texture menu): a texture, one of its four
  readings, a new seed. Locks hold.
- SUMMON NEW BACKDROP now changes only the backdrop: its colours (a small
  scheme around one hue, dark under light text and pale under dark) and the
  gradient's angle.
- GRADIENTS: Sweep and Mirrored for the backdrop and the inset box; the text
  gradient has a shape now (Linear, Mirrored, Radial, Sweep).
- THE TEXTURE MENU in groups (as proposed): Grounds · Light & Particles · The
  Heavens · Places · Ink & Paint · Materials · Pattern & Geometry · Signs &
  Symbols · Yours (From the Athanor, then each kept surface by name).
- WHAT'S WORKING: while something slow is made, a quiet line over the image
  says what ("Convolving the bokeh", "Letting the reaction diffuse",
  "Shuffling the deck", "Stoking the athanor", "Pressing the page at full
  size") — after a moment, never flickering. The shimmer keeps moving even
  while the page itself is busy.
- SPEED: the history filmstrip and the preset tiles made their textures on
  the page — a Turing Skin froze everything for ~1 s each time a frame was
  added (that was the 50 ms rule breaking). Tiles now take them from the
  worker. Measured: switching textures, dragging a knob and opening Rituals
  no longer block the page over 50 ms (Dream Bloom ~60 ms, page load ~200 ms
  remain).
- One refresh puts every control's view right after a load, undo, a preset
  or a randomiser (sections open or shut with their eyes, readouts, moons, the
  dial, locks).

### Still to judge from Jupiter–Eurydome
- THE ATHANOR'S HANDLING:
  - a node moves only by its title bar; its lock pins it in place. A drag
    anywhere else, on a node's body too, pans the grid.
  - HOLD anything (or right-click it, or a node's ⋯) for what it can do. When
    several things are under the finger it asks "Which did you mean?", each
    named and in its own colour.
  - wires: tap one and ✂ appears where it was tapped; or its menu; or Delete.
  - a setting's menu: bind it to a page slider or the light dial, set its
    range, unbind; wire a Knob (or the Light Dial) into it in one go; for a
    wired setting, the part of its range the wire sweeps.
  - ⌖ puts everything in view; the grid's menu tidies into columns (pinned
    nodes stay put) and adds a part where it was held.
  - KEPT: keep a surface by name on this browser's shelf, open it again, save
    the shelf as a file, bring surfaces in from one.
  - the app's own theme colours; only the wires and ports keep theirs.
  - on a phone: the parts are a drawer (＋ Parts) that scrolls with one finger
    (the old two-finger trouble was the parts being draggable); the preview is
    a small dock bottom right (tap it for large); legend and help behind ?.
- SHARING: a look is named before it travels (Share with no spell chosen asks
  for a name and keeps it among the spells), and the name arrives with it. (It
  never did before: Share looked its spell up by a field records don't have,
  so every share went out as "A Shared Look".) The look's name is part of the
  look now — spells, links and JSON carry it.
- The share box no longer grows with a long link (it wraps and scrolls).
- Show Spell Code? hides while a phone's keyboard is up.


## 2 · Waiting on Ruby
- The name: "PoetryPress" for people, Unfixable Vellum inside — say when.
- SOUNDS — the instrument itself, when Ruby wants it back:
  - a STRING instrument, something unusual (plucked string by physical model;
    ideas: an Aeolian harp, strings sounded by wind; sympathetic strings that
    ring when another is struck; a koto-like pluck that bends up)
  - a way to PLAY it by hand (a big, forgiving pad to strum, pluck or bow,
    recorded straight into a composition) instead of typing degrees
  - Ruby's design from the Murmur Studio goes into murmur.js MURMUR_DESIGN.
- The PRESETS pass — "not yet" (the lore words are ready for it).
- Scattered Polygons at Shape 0: the original flakes are sometimes a little
  concave. Keep them as they were, or make 0 convex too?
- "The basic noise texture is slow": Sleep Haze was taken to be it (now ~2×
  faster). If it was another, which?
- Harsh Rain and Silverpoint Hatch cost ~0.1–0.3 s as chains (were ~0.05 s).
  Fine, or keep a fast path?

## 3 · Long horizon
- IMPORTS: a tab of images placed on the page, each a LAYER (position, size,
  turn, opacity, a blend mode, a lock, an eye) — and the text, the surface,
  the box and the border as layers too, each with its own blend. A layer list
  is the general tool; what keeps it this app's is what the layers ARE.
- WIDER WITHOUT LOSING ITSELF (a brainstorm):
  - every layer can be a SPELL: a look kept by name, so "a poem on a photo"
    is still a spell, carried and shared as one
  - the Athanor takes an imported image as an input (a Picture node): a photo
    run through Levels, Warp, Kaleidoscope, lit by the dial — Filter Forge's
    reason to exist, in this app's terms
  - a MASK from the poem: the words cut through a surface or an image (type
    as a window), and the reverse — a surface only where the words are
  - CROP AND FRAME presets for where the image goes (a post, a story, a
    print, a book page), each its own safe area shown while working
  - a PRINT size: inches and DPI beside pixels, with bleed for print
  - BATCH: one look, many poems (a chapbook's pages, a series of posts)
  - imported images keep the app's grammar: four readings of a photo (🜂 warm
    and burned, 🜄 cool and soft, 🜁 pale and airy, 🜃 grained and dark)
  - what stays its own: the elements, the seeds as phrases, the spells, the
    readings, the Athanor's parts, the witchiness of the words. A general
    tool, with a voice.

## 4 · Next (no input needed)
- More textures as chains, as each is touched (AGENTS.md: "Rebuild a texture
  as a chain").
- The Athanor on a phone, still: haptics on a long press, an accessibility
  pass.
- In the Athanor, a grey chain (Harsh Rain, Silverpoint Hatch) shows grey: the
  Athanor's surface has no Light/Dark remap of its own yet.
- The Athanor's GPU passes (blur, warp inside a graph).
- Dream Bloom's convolution on the GPU (PERFORMANCE-AUDIT "Next on the GPU").
- Split appEvents.js (~2,900 lines) into modules — the tests read its source
  by regex, so they move with it.

## 5 · Check on a phone (new)
- The Athanor: hold a setting, a wire, a port, the empty grid; tap a wire and
  ✂; one finger pans; the parts drawer scrolls; the dock is out of the way.
- Share on Firefox: the box stays put.
- Save image: the alt text is copied (or the Copy button works) and pastes
  into Bluesky's alt text box with its headings and line breaks.
- Sounds: on, the volume, and that iOS's silent switch silences them.
