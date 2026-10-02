# Open issues

Production: poetrypress.unfixable.place · development: vellum.unfixable.place
Done work lives in the changelog and git history, not here.

## Next (queued by Ruby)
- **Zen Garden, rebuilt** as real raked gravel. The seed picks a technique:
  Mizumon (concentric ripples round rocks) · Sazanamimon (parallel waves) ·
  Ryūsui (flowing streams) · Aranamimon (stormy crests) · Tachinamimon
  (zig-zag standing waves) · Seigaiha (interlocking semicircles) · Ichimatsu
  (checkerboard, lines turning 90°) · Morizuna (sculpted sand piles) ·
  Kyokusen (deep meandering S-curves) · Uzumaki (spiral vortex).
- **Fractal Moon, reworked** — it doesn't quite look right yet.
- **Saturn and Enceladus as rare easter eggs** (like Night City's Space
  Needle): Emyrs's moon and its planet, turning up now and then.

## Later
- **Split appEvents.js** (~1,900 lines) into modules by area; the app state
  is already one object, so this is mechanical.
- **Texture layers**: a base texture under the main one, by making the
  texture panel a reusable component.
- **Desktop layout** and a web-design pass.
- **Form knob for more textures** (Lotus has it).
- **Alt text on export**: offer the poem's words as alt text when saving.
- **Ruby's texture audit** (screenshots of every texture and preset).

## Check on a phone
- The colour picker: Done reachable, the field ring and pointing tail.
- Undo ☋ / redo ☊; the preview's scale steps (Workbench → Full-size preview).

## Worth knowing
- PML is backward compatible: `test/fixtures/pml-golden.json` is never
  regenerated; font order is frozen (`/f:N` picks by position).
- Every texture measures in canonical pixels (`cpx`, `canonArea`, `canonDiv`
  in texCore.js); keep new ones that way and check `tools/scale-audit.mjs`.
- Blend modes can hide an inset box (Darken shows only a darker box, etc.).
