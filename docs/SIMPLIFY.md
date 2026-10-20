# Smaller and simpler: proposals (2026-10-19)

Ruby: "Suggest design improvements and improvements to the technology underlying this application, particularly things
that would reduce the size of the code base or the complexity without losing any features or design characteristics …
this includes improvements to the testing suite and to the design protocol."

Every number below was measured on the tree (wc, grep, node loading the modules); the two largest claims were checked
twice. No proposal changes a picture or removes a feature: each says how that is proved.

## Where the size is

- **App source:** 3.57 MB. The Athanor's parts (`steps*.js`) are a quarter of it; the UI controller (appEvents and
  friends) 14%; the chains' data 14%; the renderer 9%; index.html + CSS 8%; the old generators 7.5%; the Athanor wiki 7%.
- **The shipped page:** `dist/index.html` is **5.78 MB** (1.69 MB gzipped). **2.13 MB of it is the texture worker**:
  the same 30 generator modules flattened a second time, so they ship twice. **23% of the shipped JavaScript is comments.**
- **appEvents.js:** 4,805 lines, 239 functions, 227 listeners, 19 loose module-level variables beside `state`.
- **A surface lives in about 10 hand-kept places** (params, caps, dispatch, the menu's option, its string, the chain's
  label, readings, alt text, working words, light-turned): "Add a texture" is 8 edit sites.
- **Tests:** 51 suites, 1,190 checks, run one after another (about 25 minutes). 45 suites copy the same check harness;
  12 read appEvents.js as text.
- **AGENTS.md:** 2,051 lines (127 KB), given whole to every agent session (about 30k tokens); §9's per-surface notes are
  23% of it.

## The proposals, in the order to do them

### A · Pure refactors, each proved by a snapshot and unchanged fingerprints
1. **The dispatch ladder becomes a table.** 83 of 85 surfaces' branches in `buildTexture` all call `genChain` and differ
   only in which hues they pass; 21 of the 24 hex fallbacks equal the surface's own `tintDefaults`. A small
   `CHAIN_HUES` table (none · first hue · two hues · the accents · three real overrides) replaces ~185 lines.
   *Proof:* fingerprints byte-identical.
2. **One copy of each part's description.** All 190 parts' `doc` equal their wiki `line`, word for word, and a test
   enforces the duplicate. Keep the wiki's; drop `STEP_DOCS` and the 44 inline `doc:`s (~17 KB, also out of the worker).
   *Proof:* the editor's part list deep-equal before and after.
3. **Chains stop restating their sliders.** A chain's knob repeats the slider's name and default (395 of 395 names, 391
   of 395 defaults agree); 737 wires repeat the part's name to find a setting's port. Derive the knob from
   `TEXTURE_PARAMS`, and let a wire name the setting (`[1, 1, 4, 'scale']`). *Saves* ~40 KB of chains.js and a whole
   class of drift. *Proof:* every chain's starter graph JSON identical.
4. **A compact registry.** A param constructor with the common defaults (304 of 406 say `unit:''`, 294 say 0–100) and
   named blend sets (38 distinct lists across 85 surfaces). *Saves* ~20 KB. *Proof:* the tables deep-equal.
5. **One record per surface** (after 1–4): label, group, sliders, caps, hues, readings, alt words, working words in one
   place, the existing tables built from it; the menu's 86 `<option>`s built from the groups. "Add a texture" becomes
   1 edit site, and the menu, the Athanor and the tests can never disagree.
6. **One part convention.** steps.js keeps its parts in 7 parallel tables while the 13 family files keep each part in one
   object; fold steps.js into the family style. The protocol then teaches one way.
7. **One WebGL helper.** The WebGL2 setup is written three times (the lighting, the new GPU passes, the box effects);
   one `glOpen` / `glProgram`, and the worker opens one context instead of two. (This is where ROADMAP C9's GPU passes
   then grow.)

### B · The page phones download: the biggest win
8. **Ship the generators once.** Put the 30 worker modules in one classic script that runs on the page *and* feeds the
   worker, instead of twice. *Saves* ~2.1 MB (−37% of the page). *Proof:* the bundle, PWA and page audits; the source
   doesn't change, so pictures can't.
9. **Strip comments at build time** (the existing prune tool already has the stripper). *Saves* another ~0.7 MB. The
   haiku and notes stay in the source.

### C · The tests: faster, smaller, about behaviour
10. **Measure, then parallelise.** Time each suite in test.sh; run them two at a time (they are separate processes
    already); add `sh test.sh --quick` (the fast suites) for working, the full run to release. Estimated 25 → 8–10
    minutes full, ~2 minutes quick (to be confirmed by measuring).
11. **One texture sweep instead of three.** Fingerprints, the knob probes and the crossed corners render overlapping
    corners of the same knob space (~760 renders). Five settings per surface give the fingerprint and both knob checks
    (~425 renders). textureGenerators' 60 renders at export size (90× the pixels) drop to 2–3 surfaces, with fixed seeds
    and the list from the registry (it still names the retired Whorl).
12. **A shared harness** (`check`, `done`, `boot`): ~250 lines of copies go.
13. **Tests read behaviour, not source.** 12 suites read appEvents.js as text (one slices functions out of it; one
    matches exact statements). Rewrite them on the save-and-load harness and a `uiSource()` scan. This also unblocks:
14. **Split appEvents.js** along its own section banners: state into `appState.js`; then the leaves (the dials, history
    and filmstrip, dice, the phone layout); then the core (save/restore, presets, locks). The entry file goes from 4,805
    lines to ~1,200; names stay unique (the bundle test checks).

### D · The design protocol
15. **AGENTS.md to ~600 lines.** Move §9 (per-surface notes) beside each surface (its doc or its record), §5.5 (light)
    to `docs/light.md`, §5.7 (page machinery) to `docs/ui-machinery.md`, §10 (pitfalls) to `docs/pitfalls.md`. Say each
    rule once (five rules are restated in up to five places). Where a test enforces a rule, the protocol gives one line
    and the test's name. Saves ~20k tokens in every agent session, which is also time and cost.
16. **One review tool for new and changed surfaces.** The sheets Ruby judges (seeds, readings, the light turned round,
    the camera moved, before/after) are made by hand each round; one `tools/review.mjs <surface>` makes the standard set
    every time, the same size and order, so a review is quicker and nothing is forgotten.
17. **Housekeeping.** CHANGELOG releases older than about 20 to an archive file (it is 102 KB); the generated Murmur studio
    page built on demand, not committed.

## Design suggestions (the interface)

- **One dial language.** The light dial and the camera dial now always show, side by side, faded when a surface doesn't
  use them (Saturn series). Next: every surface that positions something (a sun, a hole, a circle, a flower) shows the
  same kind of guide on the page while its dial moves, from one guide function, rather than one per surface.
- **Sliders say what they do in one line.** Each slider's tooltip comes from the registry record (5): the same words in
  the slider, the wiki and the Athanor, so Macro Bloom's "what do these do?" can't happen again.
- **Surfaces as records make the menu, the tiles and the search one thing**: a surface's group, glyph, readings and
  thumbnail come from one place, so the tile chooser and the menu never disagree.
- **Materia's colours** are now two columns under the dials on every surface; the Light, Surface and Material headings
  stay.

## What not to do (yet)

The old generators (tex*.js, 266 KB) are not dead: 19 Athanor parts still draw with them. Shrinking them means taking
those textures apart into general parts, which changes pictures and needs Ruby's comparison sheets first (ROADMAP Stage 3).
