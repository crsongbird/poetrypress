# Unfixable Vellum — design language

For anyone working on this app after us. These are rules Ruby set, not
suggestions. Where a reason is given, it is the reason that matters.

---

## The four elements

Every preset, texture and colour decision belongs to one of these. They are
separable because each claims a **different channel** — no two compete for
the same visual property.

| | Element | Owns | Palette | Feeling |
|---|---|---|---|---|
| ♡ | **Whimsy** | hue | red, purple, **and** blue | sleep, starlight advancing or receding |
| √ | **Sharpness** | value | off-white against blacks with blue in them; metal at the edges | waking |
| ∆ | **Chaos** | pattern | sigils, math-noise, geometry going wrong | pain, dysphoria |
| 🜚 | **Touch** | surface | neutrals — parchment, bone, tea-stain, graphite | contact |

**Whimsy** is three hues. Purple is the over-used one; reds and blues are
under-represented and should be reached for deliberately.

**Touch** claims no hue of its own — that is what keeps it from colliding with
Whimsy. It is about what the page is made of and what has happened to it. It
is the only element that requires another person to have been there. One
colour is permitted in the whole element: oxblood, in the wax. Touch textures
read as relief, take a light direction, and blend through soft-light rather
than overlay.

**Equal weight.** Every element gets seven textures and four presets. Touch is
not smaller because people get less of it.

---

## Symbols

**🜚 is Touch.** This exact variant, not a substitute — it is personally
significant. It is also the **Return** glyph in focus mode, and the app's
general mark for "touch this."

**Navigation glyphs** are hand-drawn and scratchy: every stroke gone over two
or three times with small offsets, never clean vector. They **relax** when
deselected (thinner, dimmer, slightly smaller) and **stiffen** when selected.

| Tab | Glyph |
|---|---|
| Inscription | ⌘ the Bowen knot |
| Rituals | inverted pentagram |
| Thoughtforms | inverted triangle, a bar inside, a line through the point, a ring beneath — drawn by Ruby |
| Materia | ◈ |
| Esoterica | ⌬ |


**The lock** is a drawn padlock in the same scratchy hand — grey and open when
unlocked, accent-coloured and closed when locked. Never an emoji.

---

## Spells

A spell is a short string of alchemical glyphs carried by every preset and
every saved look. It is an **identifier**: it tells the developer and other
users which preset a page came from. It means nothing yet, and may someday.

- A **prime** number of glyphs, from 5 to 17
- Split into **three** segments: one in `[[ ]]`, one in `{{ }}`, one bare,
  in any order
- **No glyph repeats** within a spell
- Only glyphs from the safe set in `spell.js`
- **Stored, never derived.** Hardcoded for built-in presets, generated once at
  save time for user spells, validated on import
- Written in PML and rendered by the app's own parser, which is the joke — the
  inner brackets survive because PML prints what is escaped
- Drawn opposite the credit, same size, in the page's ink colour

---

## Language

The register is **ritual and arcane, but readable.** Someone who does not code
should understand every control. When flavour and clarity conflict, clarity
wins — "Script Highlighting," not "Illuminate the script."

**Names must be honest.** A texture called "Non-Euclidean Cracks" whose cracks
are Euclidean was renamed. "Twisting Geometry" that does not twist was
renamed. Describe what a thing actually does.

**Do not repeat yourself.** Three textures named "…Drift" was a failure of
vocabulary. Reach for a different word.

**Dialogs** pair a plain verb with a flavoured one: *Yes (Inscribe)* /
*No (Ignore)*. **Confirm on the left, cancel on the right.** Keep the tone
light — earlier drafts were too heavy and were loosened.

**Light mode is gently shamed.** It exists, it works, and its note says the
moths will find you.

Code comments may be haiku, particularly on texture generators.

---

## Colour

- Dark mode is the default. The default theme is **Cinder** — rosy, grey,
  dark. The original violet-and-gold is kept as **Aether**.
- **Do not default to violet and gold.** It is an easy, unexamined reflex.
  Violet belongs in accents, not grounds.
- Colours carry a subtle breath of nature — moss, clay, tea, sage — never loud.

---

## Motion

Minimal. Animation mostly advertises how well the browser is coping, which is
not something to draw attention to. The selected/deselected state of a glyph
should be legible standing still.

---

## PML

Poetic Magick Language. Its purpose is to **override the page's globals on a
per-segment basis** — that is what makes shaped poetry and custom effects
possible. Page-level settings (border, vignette, background) therefore do not
belong in PML.

**Compatibility is sacred**: an existing poem must render identically after
any change. Add new directives; never change what
`/fx0`, `/fx1`, `/fx2`, the bracket accents, or any line prefix mean.

---

## Working with Ruby

- Do the work rather than talking about it. Tokens are finite.
- When something is broken, **find the cause** instead of guessing twice.
  Screenshots are evidence — read them closely.
- If a request is ambiguous or the two voices in it disagree, **ask** before
  building.
- `OPEN-ISSUES.md` is kept small. When something is finished, **delete** it
  rather than editing it into a history.
- Invariants are guarded by tests. A test that fails after a deliberate design
  change is updated to the new intent — never weakened until it passes.
- Hand-editable text lives in `strings.js`; hand-editable numbers in
  `tunables.js`.
