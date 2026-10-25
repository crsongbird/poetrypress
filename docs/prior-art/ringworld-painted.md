# Painted, not printed: the Ringworld's textures, sky and planets

Ruby, 2026-10-25: "make the terrain and other textures themselves seem.. painted on (include skyboxes, planets, etc).
(See the texture work in the game Dishonored - do that, but to a significantly lower complexity) … This can be done
very cheaply by simply changing existing textures"; "which tree is that which is just a green stick? There should
always be more color and texture used in this artwork"; and, 14:11: "the terrain crest contour lines can be removed.
They can be replaced with specular highlights that respond to the sun". How to read the tags: [src](URL) is a page that
was opened and read; [est] is an estimate, a computation or a design judgment.

## 1 · How Dishonored's textures were painted

- The team worked "very hard to imbed a painterly look into the art to avoid noise"; the aim was less of the visual
  noise of the photo-textured games of the time [src](https://80.lv/articles/asset-material-production-in-dishonored-2/).
- The textures were painted by hand in Photoshop, Substance Designer used mostly for masks and selections; "We shared
  the same brushes to unify the visual look" [src](https://80.lv/articles/asset-material-production-in-dishonored-2/).
- Detail at the middle scale: the artist had to "concentrate on medium size details"; too many small details in the
  colour and normal maps lost the stylized look
  [src](https://80.lv/articles/asset-material-production-in-dishonored-2/).
- Uneven detail: "Some parts need to be noisy and contrast with other parts very calm"; dirt spread evenly "will look
  fake" [src](https://80.lv/articles/asset-material-production-in-dishonored-2/).
- Colour by mask: props painted grey, a mask and a colour given by the engine, so "the same bird can be red, blue or
  yellow" [src](https://80.lv/articles/asset-material-production-in-dishonored-2/).
- The walls: the goal "to remove noise"; the visuals to look like an "18th century' painting"
  [src](https://80.lv/articles/the-wall-materials-of-dishonored-2).

## 2 · So in the painter [est]

- A few broad strokes, never a fine noise: a near cell of ground carries one to four strokes some 0.2 to 0.4 of its
  width, each a fifth to a third of the way toward one of five tints shared by the whole picture (`RG_BRUSH_TINTS`: a
  warm ochre, a blue-grey, a cream, a near black, a moss green), so the land, the sky, the walls and the arch are laid
  with the same brushes. Strokes only where the cell's own noise is busy, so some ground is calm and some lively.
- The sky: a few long soft strokes over its gradient, faint (a few hundredths), so the gradient reads as laid on.
- A gas giant: long strokes along its bands, a little lighter or darker than the paint under them.
- A town wall near: damp and moss at its foot, a few stones warmer or colder, rain streaks from its coping.
- A turned roof: its courses of tile or slate, and a few long strokes of a warmer or greener colour along them; a row of
  houses each roofed in its own slate or tile.
- A cactus: a pale-gold rim of spines along its lit edge, a corky grey-brown foot, long yellower and bluer patches, a
  woolly tan crown (the desert plants' notes, docs/prior-art/ringworld-desert-plants.md).
- Everything by the place's own hash, never by the frame, so a film never sees a stroke move.

## 3 · The land's gleam in place of the crest lines

- Blinn's half-way vector: "the vector that its half way between the light vector and the eye vector", H = L + Eye,
  normalised; the specular term K_S·cos(N, H)^s, where the shininess s narrows the highlight as it grows
  [src](https://www.lighthouse3d.com/tutorials/directional-lights-per-vertex-ii/).
- So in the painter [est]: at each corner of the land, its normal against the half-way vector between the sun and the
  eye, to the 36th power, faded as the sun sets and on slopes turned from it (`specAt`). It is brightest looking into
  the sun, gone with the sun at your back, and slides over the hills as the sun moves. Grass gleams least (0.35), rock
  more (to 0.85), sand and paving more, snow most. The lit lines along crests and shelf lips are gone; the soft bands
  below a crest stay, as they mark where the land drops away.
