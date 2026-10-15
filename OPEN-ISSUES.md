# Open issues

Open items only — when one is done, delete it. Production:
poetrypress.unfixable.place · development: vellum.unfixable.place. Release:
release.js (`node build.mjs --next`). Timings: PERFORMANCE-AUDIT.md. How the
systems work: AGENTS.md. Prior art: Ruby's doc "Unfixable Vellum — Prior Art &
Recommendations".

## 1 · Ruby to judge (new in Saturn–Methone, Saturn–Mimas and Saturn–Aegaeon)
- Eight textures became chains (each pixel-identical): Binary Pattern, Chladni Sand, Guilloché, Sigil Scatter,
  Rorschach Test, Facet Field, Black Hole, Fractal Moon. Each is one whole part for now (ROADMAP §2 J takes
  them apart later); Bit Grid and Chladni Sand take any map on Where.
- THE ARCANE GUIDANCE (Inscription) now teaches: what each mark is and why, then an example with ⤓ Try (it
  goes in the poem where the cursor is; undo takes it back). It now also teaches /fx: and /under:.
- THE WIKI'S FIGURES: eleven concept pages (gray maps, pictures, colors, numbers, curves, mapping, wire
  ranges, masks, blend modes, heights, seeds) open with a small graph and every part's picture. Clear? Which
  other pages want one?

## From Saturn–Janus
- THE ATHANOR'S BAR (Ruby: "Start… Kept, Keep, Use: Use feels redundant; the other menus feel… not
  particularly good"): Open ▾ (your surfaces, starters, Basics, studies, the app's textures, each with what it
  teaches) · Keep · ↶ ↷ · the view · ⋯ (copy, your shelf, Tidy, Revert, Clear, the wiki) · ✓ On the Page /
  ⇱ Show on Page · Done (offers to show a changed graph). Every menu's hints now show whole, under each name.
  Which menus still feel wrong, and where?

## From Saturn–Epimetheus
- CIRCUIT BOARD (Pattern & Order), in place of Veins of Light: Traces, Bends, Charge (Substrate → Color →
  Glow → Sparks), Data Flow, Components, Scale; Trace Hue and Data Hue (the accents until chosen), the Glow
  Hue's aura; the board in the backdrop's colors. Its readings: Overclocked, Cold Storage, Factory Floor.
  What is it missing? Should Charge light whole buses (as now) or single traces?
- The CIRCUITRY preset still wears Veins of Light (presets wait for Stage 4): at the presets pass it could
  wear Circuit Board.

## From Saturn–Prometheus
- TWO SURFACES: Upper / Lower / Swap above the Surface Texture controls; every control edits the one
  shown (a thin line of the second accent down the card's edge says the lower is shown). Every blend for
  each, ⚡ ones mixed per pixel. Does choosing a layer read clearly? Should the dice and Summon reach both?
- TEXT CLEARING now sits at the foot of Text Effects ("idk" — say if it should go back).

## From Saturn–Atlas
- THE WIKI'S PAGES TURN: previous and next along the foot of every page, always in view on a phone.
- SURFACE TILES are kept from release to release; only a surface that changed is painted again (the
  first visit after this release paints them once more, to start the new store).
- THE PROJECT KEEPS ITSELF CURRENT (AGENTS.md §1 rule 12): dead code, strings, styles and files and
  stale docs fail the tests; the stylesheet was pruned (verified screen by screen); the tests were
  reviewed. Aether is now a PML fixture (test/fixtures), so it keeps rendering as PML grows; the parked
  sideways layout is gone (see §3).

## From Saturn–Pan
- THE ATHANOR'S WIKI: Help → contents, search, Back; a first-surface tutorial; concept articles (gray maps,
  pictures, colors, numbers, curves, ports, mapping, ranges, masks, blend modes, heights, seeds); a page for
  every part; a glossary. About this part in every part's menu. Does it teach? What is missing?
- Renamed parts and settings (Simple Lighting, Paint Swipes, Growth Medium, Differential Growth, Watercolor
  Bleed, Stained Glass, Card Deal; Black Point / White Point, Cutoff, Octaves; ports "map"/"picture").
- Releases now follow Saturn's moons (Jupiter's ran out at Kore). Pandora is skipped: say if it should be in.

## From Jupiter–Cyllene

- KEPT SURFACES: wires on their right rows; one name (Surface part = kept name); Keep in the bar; Replace;
  thumbnails on Your Surfaces; hold a surface you made to share or copy its wiring; Paste a surface's
  wiring in Kept. Halftone2 picks up its picture the first time the surface menu shows it.

## From Jupiter–Callirrhoe

- THE DICE remember their way (Gently / As usual / Wildly) and every die, Summon button and the light's ⚄
  follows it. Gently: colors drift a little, the light turns a little, the surface stays, typefaces stay
  in their family. Locks now hold everywhere (knob padlocks had been disappearing).

## From Jupiter–Aoede
- New parts: Scatter, Grid & Dots, Border Mask, Lookup, Displace, Gradient Map, Spectrum; Variation;
  The Poem's Rhymes.
- Lain's questions on the kept draft (a way back to the welcome page; an empty poem; the page shape).

## 1b · The direction — see ROADMAP.md
The plan for the surface engine, in four stages (Ruby): components → features → textures built from
the parts → presets, last. No new or reworked presets before Stage 4. Delete items there as they ship.

## 1c · Ruby's notes to act on (her verdicts on Taygete and earlier; the rest she approved)
- SURFACE STUDIES (Ruby: "The surface studies are... hmmm."): not right yet. Before any becomes a menu
  texture (ROADMAP §2 I), ask which read right and what each is missing; Orbit Script, Transmutation
  Engine and Constellation are approximations waiting on parts.
- CARTOMANCY: the clutter and its lighting read as cartoony — light the
  table, cards and objects with the Light Engine (now a part). Scramble
  everything more: layouts, objects, light. More variety of wear. More writing: score sheets, notes,
  marks — all fictional, as if through a window onto a world like ours but
  with its own lore and rules.
- PAINTED LANDSCAPE: more variety in the water and land textures.
- REROLLING: the dice are in (Kalyke); tell me what still sticks.
- OIL PAINT loses small things (distant trees) at Impasto 50; a finer pass
  where the picture has small detail.

## 1d · Found this pass
- CONTOUR MAP at a quarter-size preview differs from its export more than
  most (scale-audit 26%, was 31%: the hillshade's shadows at that grid). Not
  new; worth a look when the Terrain is next touched.

## 2 · Waiting on Ruby
- SOUNDS — the instrument itself, when Ruby wants it back:
  - a STRING instrument, something unusual (plucked string by physical model;
    ideas: an Aeolian harp, strings sounded by wind; sympathetic strings that
    ring when another is struck; a koto-like pluck that bends up)
  - a way to PLAY it by hand (a big, forgiving pad to strum, pluck or bow,
    recorded straight into a composition) instead of typing degrees
  - Ruby's design from the Murmur Studio goes into murmur.js MURMUR_DESIGN.
- The PRESETS pass — "not yet" (the lore words are ready for it).
- Harsh Rain and Silverpoint Hatch cost ~0.1–0.3 s as chains (were ~0.05 s).
  Fine, or keep a fast path?

## 3 · Long horizon
- THE SATURN RELEASE (Ruby): once every texture is taken apart into parts, a
  creative enough user should be able to make in the Athanor anything Filter
  Forge or Blender's shader nodes can — shaders and blending included. Blend
  modes and shader components get rethought then, as parts. Custom Presets
  are where that library grows (until the built-in ones aren't needed).
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

- A PHONE HELD SIDEWAYS: the parked side-by-side layout (preview left, panels right) was removed with
  the dead code; `git log -S "orientation: landscape" -- poetrypress.css` finds it, if it is wanted on a
  laptop or a tablet.

## 4 · Next (no input needed)
- EVERY TEXTURE INTO THE ATHANOR (Ruby's long horizon): ROADMAP.md Stage 3
  keeps the list of textures that aren't chains yet. Likely shared parts
  first: Particles (Deep Field's stars, Dream Bloom's motes), Terrain (Dunes,
  Moss), Pigment (Suminagashi's inks), the Light Engine (most 🜚 Touch
  textures), a Marbling part (Suminagashi, Ink Blot).
- The Athanor on a phone, still: haptics on a long press, an accessibility
  pass.
- In the Athanor, a grey chain (Harsh Rain, Silverpoint Hatch) shows grey: the
  Athanor's surface has no Light/Dark remap of its own yet.
- The Athanor's GPU passes (blur, warp inside a graph).
- Dream Bloom's convolution on the GPU (PERFORMANCE-AUDIT "Next on the GPU").
- Split appEvents.js into modules — the tests read its source
  by regex, so they move with it.

## 5 · Check on a phone (new)
- The Athanor: hold a setting, a wire, a port, the empty grid; tap a wire and
  ✂; one finger pans; the parts drawer scrolls; the dock is out of the way.
- Share on Firefox: the box stays put.
- Save image: the alt text is copied (or the Copy button works) and pastes
  into Bluesky's alt text box with its headings and line breaks.
- Sounds: on, the volume, and that iOS's silent switch silences them.
