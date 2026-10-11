# Open issues

Open items only — when one is done, delete it. Production:
poetrypress.unfixable.place · development: vellum.unfixable.place. Release:
release.js (`node build.mjs --next`). Timings: PERFORMANCE-AUDIT.md. How the
systems work: AGENTS.md. Prior art: Ruby's doc "Unfixable Vellum — Prior Art &
Recommendations".

## 1 · Ruby to judge (new in Jupiter–Eurydome)
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

## 2 · In progress — Ruby's long list (passes 2–4)
- INTERFACE: every slider lockable; master locks on each section's heading,
  locking everything below; 👁 eyes in place of the enable checkboxes; more
  folding sections; Appearance → Interface (a fold; sound is just on/off and
  a volume); the light dial's raw values shown, exact values typed; Random
  Surface; New Backdrop changes only the gradient's colours and angle, and
  the gradient tools catch up with the rest; the texture menu in groups (the
  proposal: Grounds · Light & Particles · The Heavens · Places · Ink & Paint ·
  Materials · Pattern & Geometry · Signs & Symbols · Yours — kept surfaces
  listed by name); a gentle "what's working" line for long work, in useful
  inside jokes; UI updates under 50 ms; the preview progress bar that stopped
  showing; controls that don't refresh (a hierarchical pass).
- TEXTURES: Cartomancy as games (four suits in the accents and two chosen
  hues, players, coin, all by seed; lit, with materials; taken apart into
  steps others can use); Scattered Polygons (many convex polygons, random);
  Stained Glass (glass lighting, specular, a shape slider: ordered → shaped →
  patterned → random); Painted Landscape (variety, colour, painting, clouds);
  why plain noise is slow.
- WORDS: alt text as "--- Image text --- / --- Image credit --- / ---
  Description ---", breaks and punctuation kept; a way to get it into Bluesky
  (which doesn't read it from the file); the README shorter and more
  mysterious; AGENTS.md's componentizing rule.

## 3 · Waiting on Ruby
- The name: "PoetryPress" for people, Unfixable Vellum inside — say when.
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

## 4 · Long horizon
- IMPORTS: a tab for images placed on the canvas, each a layer with a blend
  mode; blend modes for the text layers too.
- Ways to widen the app without losing what it is (see the brainstorm in the
  release notes when pass 4 lands).

## 5 · Next (no input needed)
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

## 6 · Check on a phone (new)
- The Athanor: hold a setting, a wire, a port, the empty grid; tap a wire and
  ✂; one finger pans; the parts drawer scrolls; the dock is out of the way.
- Share on Firefox: the box stays put.
- Sounds: on, the volume, and that iOS's silent switch silences them.
