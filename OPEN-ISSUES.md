# Open issues

Open items only — when one is done, delete it. Production:
poetrypress.unfixable.place · development: vellum.unfixable.place. Release:
release.js (`node build.mjs --next`). Timings: PERFORMANCE-AUDIT.md. How the
systems work: AGENTS.md. Prior art: Ruby's doc "Unfixable Vellum — Prior Art &
Recommendations".

## 1 · Ruby to judge
Only what Ruby hasn't seen yet. When Ruby answers one, or speaks to it, it goes in the same pass.
- THE RINGWORLD, SEALED AND FASTER: it no longer opens in the Athanor (the Surface card's button greyed, its parts in no
  menu); stills about a third faster, a film's frames more so (PERFORMANCE-AUDIT.md). Does it feel quicker on the phone?
- THE COUNTRYSIDE BY WORKS: each farmstead now farms its own fields round its yard, as many as Works raises: at a little
  Works the grazing between farms stays open, at much the patchwork fills in. Is the balance right at the default?
- SUNRISE SCROLL'S CURSED LAND: the petals drift down through its ash and lie on the dead ground, blighted at their
  edges. Enough of them?

## 2 · Ruby's notes to act on
- THE RINGWORLD UNDER A MOVING CAMERA (Ruby, 2026-10-24): the ground distorts and transforms as the camera moves (the
  ridges are planes approximating the land, sampled from where the camera stands); the land morphing lifts and drops
  what stands on it; trees change through their stages of detail as the camera moves slowly; some buildings pop over
  each other. Keep the static look ("I like this weird look when it's a static image").
- PEOPLE GO IN AT DOORS (Ruby): walking is good; at night they should walk to a door, not fade where they stand.
- THE FILM, ANY SETTING (Ruby: "more settings so we can do a wider variety of animations, arbitrary settings maybe").
  An hour of time passing during a pan is the right default.
- SURFACES OVER SURFACES (Ruby): textures with displacement (glass, crystal), or distortion through the lighting, or
  that could take the surface beneath them (as Two Surfaces), take the texture below as an input and do something
  creative with it.
- ROUNDED EDGES (Ruby): about 2px of rounding on what makes sense to round (windows, buttons), with a hierarchy (circles
  barely any), and joined buttons and radio rows blunted only on their outside edges.
- THE RING, NEXT (Ruby, 2026-10-20): keep widening the library each pass, in a less cartoony hand throughout; more
  interactions nobody asked for.
- GENTLE MATERIALS: metallic, albedo and displacement used with a light touch in the remakes.
- THE GPU (Ruby: "implement most of these things on the GPU to accelerate rendering as much as inhumanly possible"):
  only the Light Engine's shadow march, occlusion and shine run on the GPU; blur, focal blur, warp, blend, posterize,
  Scatter and the rest of a graph run on the CPU. Move them (PERFORMANCE-AUDIT, ROADMAP).
- CARTOMANCY (beyond the branch above): the table's objects still painted lit, to bring onto the Light Engine.
  Scramble everything more: layouts, objects, light. More variety of wear. More writing: score sheets, notes,
  marks — all fictional, as if through a window onto a world like ours but with its own lore and rules.

## 3 · Found, not yet fixed
- CONTOUR MAP at a quarter-size preview differs from its export more than
  most (scale-audit 17% at 768, "close"; 10% at 1024, "fine"). Not the
  hillshade (the Hillshade knob doesn't move the score) and not the Terrain's
  heights (its lines fall in the same places): the preview's lines carry about
  7% less ink, more as the interval closes, though their width works out the
  same on paper at both grids (768 at a quarter, 1536 at the export).

## 4 · Waiting on Ruby
- Nothing.

## 5 · Long horizon
- A GAME, IN ITS OWN REPO SOMEDAY (Ruby, the extreme long term): a fork that explores the ringworlds, finds the idyllic
  places and has quests, around a story Ruby will write. It means some of these scenes must one day draw in (semi)
  real time at phone sizes: the node graphs go, their parts compiled into small fast blocks drawn at once, and world
  state machines added. Prior art: docs/prior-art/realtime-game.md. Keep it in mind when a scene's speed is chosen.
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
  - BATCH: one look, many poems (a chapbook's pages, a series of posts)
  - imported images keep the app's grammar: four readings of a photo (🜂 warm
    and burned, 🜄 cool and soft, 🜁 pale and airy, 🜃 grained and dark)
  - what stays its own: the elements, the seeds as phrases, the spells, the
    readings, the Athanor's parts, the witchiness of the words. A general
    tool, with a voice.

- A PHONE HELD SIDEWAYS: the parked side-by-side layout (preview left, panels right) was removed with
  the dead code; `git log -S "orientation: landscape" -- poetrypress.css` finds it, if it is wanted on a
  laptop or a tablet.

## 6 · Next (no input needed)
- SMALLER AND SIMPLER, continued (ROADMAP S): one record per surface (the menu built from the groups); the texture
  suites' one sweep (measured: it would save about a minute of the three); persistenceCoverage on behaviour, not
  slices of the source; AGENTS.md from ~920 lines to ~600 (each rule said once).
- EVERY TEXTURE INTO THE ATHANOR (Ruby's long horizon): only Deep Field is left (ROADMAP.md Stage 3).
  It is two layers, each blended with the page in turn, so one graph can't draw it exactly: it waits for a
  graph that can hand the page more than one layer. Then the whole-texture parts are taken apart (§2 J):
  likely shared parts first: Particles (Deep Field's stars, Dream Bloom's motes), Terrain (Dunes, Moss),
  Pigment (Suminagashi's inks), the Light Engine (most 🜚 Touch textures), a Marbling part (Suminagashi,
  Ink Blot).
- The Athanor on a phone, still: haptics on a long press, an accessibility
  pass.
- In the Athanor, a grey chain (Harsh Rain, Silverpoint Hatch) shows grey: the
  Athanor's surface has no Light/Dark remap of its own yet.
- The Athanor's GPU passes (blur, warp inside a graph).
- Dream Bloom's convolution on the GPU (PERFORMANCE-AUDIT "Next on the GPU").
- THE NEXT TEST REVIEW: mobileCss.test reads the stylesheet rule by rule; its phone invariants belong in
  invariants.test (§7 Phones) and the rest as behavior (mobileLayout, or the built page on a phone in Playwright).

