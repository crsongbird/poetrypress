# Design principles

Portable rules drawn from Unfixable Vellum. Each principle applies to any
project; the line under it is how it is applied in Vellum, and those
specifics are binding there.

---

## Aesthetic structure

**1. Give each aesthetic category its own channel.** Categories should own
different visual properties, so they can combine without competing.
*Vellum:* Whimsy ♡ owns hue, Sharpness √ owns value, Chaos ∆ owns pattern,
Touch 🜚 owns surface.

**2. Define each category by palette and by feeling.** A colour list alone
drifts; a feeling anchors it.
*Vellum:* Whimsy is sleep, Sharpness is waking, Chaos is pain, Touch is
contact — the only one that requires another person to have been there.

**3. Give every category equal weight.** No category is smaller because it is
quieter or less familiar.
*Vellum:* seven textures and four presets per element. Touch stays equal.

**4. Watch for collapse inside a category.** A multi-part definition tends to
shrink to its most obvious part.
*Vellum:* Whimsy is red, purple **and** blue. Purple is over-used; reach for
the reds and blues on purpose.

**5. A restrained category may have one exception.** Name it, so it stays
singular.
*Vellum:* Touch is neutral — parchment, bone, tea-stain, graphite — except
oxblood, in the wax.

---

## Symbols

**6. Symbols carry meaning; some cannot be substituted.** Record which ones
are fixed and why they matter, even if the story itself stays private.
*Vellum:* 🜚 is Touch, the Return glyph, and the app's mark for "touch this."
This exact variant is personally significant.

**7. Match the drawing hand to the voice.** If the project has a hand, the
icons should too.
*Vellum:* nav glyphs are scratchy — each stroke drawn two or three times with
small offsets. Never clean vector. The lock is drawn the same way.

**8. State must read at rest.** Selection should be legible without motion.
*Vellum:* glyphs **relax** when deselected (thinner, dimmer, smaller) and
**stiffen** when selected.

**9. Easter eggs can be identifiers.** Make them stable data, not
decoration, and let the system's own machinery render them.
*Vellum:* every preset carries a glyph spell — prime length 5–17, three
segments (`[[ ]]`, `{{ }}`, bare), no repeats. Stored, never derived. Written
in PML and drawn by its parser, opposite the credit, in the page ink.

---

## Language

**10. Flavour serves clarity.** Evocative where it costs nothing; plain where
a non-technical person needs to understand.
*Vellum:* "Script Highlighting," not "Illuminate the script."

**11. Names must be honest.** A name describes what a thing actually does.
*Vellum:* "Non-Euclidean Cracks" had Euclidean cracks and was renamed.

**12. Vary the vocabulary.** A repeated word is a missed choice.
*Vellum:* three textures named "…Drift" was a failure.

**13. Keep dialogs consistent.** Fixed button order, and paired verbs that
stay understandable.
*Vellum:* confirm left, cancel right; *Yes (Inscribe)* / *No (Ignore)*.

**14. Light touch over heavy hand.** Over-flavoured copy gets loosened.
*Vellum:* light mode is gently shamed — the moths will find you.

---

## Colour and motion

**15. Distrust your default palette.** The colour you reach for without
deciding is the one to question.
*Vellum:* not violet-and-gold. Violet in accents, never grounds. The default
theme is Cinder — rosy, grey, dark — with a subtle breath of nature.

**16. Dark by default if that is the medium's home.**
*Vellum:* dark first; the original palette kept as Aether; Vellum exists for
the brave.

**17. Minimal motion.** Animation mostly advertises how the browser is
coping.

---

## Format and code

**18. A user-facing language is a contract.** Existing content must render
identically after any change. Add; never redefine.
*Vellum:* PML. Never change `/fx0` `/fx1` `/fx2`, the bracket accents, or any
line prefix.

**19. Leave seams for hand-editing.** Text in one file, numbers in another,
both readable without knowing the rest of the code.
*Vellum:* `strings.js` and `tunables.js`.

---

## Working

**20. Do the work, don't narrate it.** Tokens and attention are finite.

**21. Find the cause.** Guessing twice is worse than investigating once.
Screenshots are evidence.

**22. Ask when the brief disagrees with itself.** Build only once the intent
is clear.

**23. Keep the issue list small.** Delete finished items; don't turn the list
into a history.

**24. Tests follow intent.** After a deliberate change, update the test to
the new intent. Never weaken a test until it passes.
