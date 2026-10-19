# Floral Surfaces Prior Art: Generator Catalogue

**Key to confidence:** **[src]** = stated in a consulted source (see section 8). **[gen]** = general botanical or art-historical knowledge, not checked against a source this session. **[est]** = my aesthetic estimate (hex values, counts, ranges); tune it by eye. **[?]** = uncertain, verify before relying on it.

Five surfaces: **Imprints**, **Bouquets**, **Wilting and Petals**, **Meadow**, **Macro**. Each surface has one seed, one **Species** knob (a stepped slider over the species in section 2, with a final "mixed (seeded)" stop) and up to six hue pickers. The seed picks a variation from the surface's list, then jitters it.

---

## 1. The one new part: Bloom

Everything below uses existing parts (Scatter, Noise, Perlin, Cells, Gradient Map, Blur, Warp, Motion Blur, Light Engine, Glow, Posterize, Threshold, Edges, Displace, Mirror, Kaleidoscope, Polar, Flow Lines, Tendrils, Particles, Motes, Objects, Old Paper, Grain, Canvas Weave, Water, Glass, Hoarfrost, Poem, Tint, Mix) plus **Bloom**, which draws a single flower.

**Bloom settings**
- **species**: from the section 2 table.
- **view**: face, three-quarter, side, back, or bud.
- **stage** (0–100): bud, then opening, open, past its best, wilted, and finally a "bare" stage where the petals have dropped and only the seed head or capsule is left.
- **petal jitter**: varies petal count within the species' range, and each petal's length, width and turn.
- **flatten** (0–100): 100 is a pressed flower, with every petal in one plane and no overlap shading.
- **part**: whole flower, single petal, leaf, or stem-with-leaves.
- **seed**.

**Bloom outputs**
- **picture**: colour, drawn from the hue inputs listed below.
- **height**: cupped petals rise toward their rims, the disc domes or cones (chamomile), and veins are slightly raised.
- **mask**.
- **petals**: one grey per petal, so per-petal tint or drop works downstream.
- **centre mask**.
- **veins**: grey lines.
- **thickness**: drives translucency. Petals are thin, the disc and calyx are thick.

**Bloom hue inputs:** petal, petal tip / secondary, centre, foliage. When an input is empty, Bloom uses the species default colour.

**How Bloom builds a flower**
- **Petal profile** from a small library: ovate, obovate, notched-tip, crumpled-round (poppy), strap ray (daisy), toothed ray (cosmos), funnel with 5 lobes (cornflower), bell (bluebell, foxglove), fall, standard and style arm (iris), and spurred lower petal (violet).
- **Arrangement**, one of four:
  - **Radial whorls**: n petals at 360°/n, with a second whorl offset by half a step (tulip, lily).
  - **Vogel phyllotaxis** for composite discs and many-petalled forms: angle = n × 137.5°, r = c·√n [src: ABOP ch. 4, thatsmaths]. Disc florets give the 21/34 or 34/55 spirals [src]. ABOP's zinnia rule: petal size grows linearly with n, and later petals lie flatter [src]. Use the same rule for rose and peony doubles.
  - **Raceme**: bells along a curved stem, one-sided for foxglove and bluebell.
  - **Umbel**: umbellets on rays, each a tiny phyllotaxis (Queen Anne's lace).
- **Wilting** (stage above 60): petals droop toward the stem axis and their tips curl back. Petal edges brown, driven by a Gradient Map on distance from the petal edge. Petals also drop out at random from the outermost whorl inward.

**Sheet output (proposed).** Bloom also provides an 8-cell sheet of seeded variants. Scatter in picture mode picks one cell per mark, so a field of marks is not a field of clones.

---

## 2. Species: what makes each recognisable

Give each species its *tell*: the one feature that must survive at 40 px, plus a default colour.

| Species | Structure / count | Shape | Default colours [est hex] | Tell |
|---|---|---|---|---|
| Oxeye daisy | 15–35 white rays round a flat yellow disc, head 3–5 cm [src] | oblong strap rays | `#F7F5EE` / `#E8B21C` | many narrow rays, flat yolk |
| Chamomile | 10–20 rays that droop with age; disc conical and hollow; thread-like leaves [src] | small, reflexed rays | `#FBFAF4` / `#F0C02A` | domed cone, rays turned down |
| Corn poppy | 4 petals crumpled in bud, red; 13+ stamens; bristly stems [src]; often a black basal blotch [gen, source unclear] | crumpled round, silky | `#D7261E`, blotch `#1A1414` | 4 papery petals; nodding hairy bud [gen] |
| Rose | wild/single 1–7 petals; semi-double 8–15; double 16–25; full 26–40; very full 40+ [src]. Shapes: flat, cupped, globular, high-centred, quartered, rosette [src] | spiral of cupped petals | `#B3123A`, `#F2B8C2`, `#F6EBD9` | spiral centre; 5–7 serrated leaflets [gen] |
| Sunflower | 17–30 rays (13 to 100+); 150–1000+ disc florets; disc lobes reddish, anthers dark [src] | long yellow rays, huge disc | `#F2B31B` / `#4A2A14` | Vogel spiral in the disc |
| Cosmos | 8 broad rays with toothed tips; yellow disc; feathery leaves [gen] | wide wedge rays | `#E25A9A`, `#F4F0F2` | 8 notched rays, airy foliage |
| Cornflower | 25–35 florets per head; outer ones funnel-shaped with 5 lobes; blue to purple, pink or white; scaly bracts [src] | ragged ring of funnels | `#3A5FD0` | frilly ring, not a petal disc |
| Lavender | whorls on a spike, packed at the top and spaced lower down; purple-tinged woolly calyx; grey-green leaves [src] | spike of tiny lipped flowers | `#8C7BC4`, leaf `#8FA08A` | spaced whorls, grey foliage |
| Tulip | 6 tepals in two whorls of 3; cup-shaped; often a basal blotch; 2–6 waxy blue-green strap leaves; never pure blue [src] | egg cup | `#D9332B`, `#F2C230`, `#7A2A6E` | closed cup on a bare scape |
| Peony | single, Japanese, anemone, semi-double, bomb and double forms [gen] | crumpled bowl, ruffled | `#F3C6CF`, `#C2264B`, `#FBF3EA` | blowsy ruffle; gold stamen boss when single [gen] |
| Lily | 6 tepals; prominent stamens with dark anthers; Turk's cap form is strongly recurved, spotted and nodding [src] | trumpet or recurved | `#E8742A`, `#FFFFFF` | 6 points plus 6 long stamens |
| Iris | 3 falls, 3 standards, 3 petal-like style arms; yellow beard; nectar-guide lines on the falls [src] | rule of threes | `#5B3C9C`, beard `#F2C230` | drooping falls under upright standards |
| Forget-me-not | 5 sky-blue petals; yellow eye ring; buds open pink [src]; coiled cyme [gen] | tiny round 5-petal | `#7FB2E5`, eye `#F3D24A` | yellow eye; clusters of pink buds |
| Buttercup | 5 yellow petals; gloss "comparable to glass" from a flat epidermis over an air gap [src] | cupped, glossy | `#F7D21E` | specular hotspot (Light Engine gloss) |
| Cherry blossom | singles have 5 petals, often notched [gen]; cultivars run from semi-double (~9–20) to double (25–50+); clusters of 2–6; pink in bud opening white; bronze young leaves [src] | notched obovate | `#F6D3DC`, `#FFF7F8` | notch at the petal tip; clusters |
| Anemone (coronaria) | 5–8 tepals; red, blue or white; black centre of pistils ringed by stamens; ruff of leaves just below the flower [src] | broad, satin | `#C8102E`, `#3B3FA0`, centre `#16121C` | black velvet eye |
| Zinnia | phyllotactic petal order, outer petals flatter [src ABOP]; dahlia-like doubles [gen] | stiff layered rays | `#F05A28`, `#E83F7A` | stacked tiers, button centre |
| Foxglove | tubular bells 5–7 cm, borne on one side of a 30–60 cm raceme; spotted throat; purple, pink or white [src] | inflated bell | `#B04F9B`, spots `#5A1E4A` | one-sided spike of spotted bells |
| Bluebell (English) | stem droops; bells on one side; tips curl back; cream pollen; deep violet-blue [src] | narrow tube | `#4B4FB8` | bowed stem, one-sided |
| Red clover | globe of small pea flowers; trifoliate leaf with a pale chevron [gen] | ball of tubes | `#C25A8E` | pink pom on three leaflets |
| Queen Anne's lace | flat compound umbel 5–10 cm, up to ~1000 white florets, dark purple centre floret; curls into a "bird's nest" when seeding [src] | lace plate | `#F5F3EC`, dot `#4A1F3D` | flat lace with one dark dot |
| Violet | bilateral: 4 upswept or lateral petals and 1 broad spurred lower petal [src]; heart-shaped leaves [gen] | "face" | `#5C2E91` | a single lower lip |
| Hydrangea | mophead globe of sterile florets or lacecap ring; showy parts are sepals, usually 4 [gen]; blue in acid soil, pink in alkaline, white stays white [src] | 4-sepal florets in a ball | `#7E9BD6`, `#E79BB8` | ball made of 4-part florets |

**Colour honesty:** no blue tulips [src], and no blue roses or green poppies outside an explicit "fantasy" hue choice.

**Species slider order** [est], grouped so neighbouring stops look related: daisy, chamomile, cosmos, sunflower, zinnia, cornflower, poppy, anemone, buttercup, rose, peony, tulip, lily, iris, cherry, forget-me-not, violet, bluebell, foxglove, lavender, clover, Queen Anne's lace, hydrangea, mixed.

---

## 3. Imprints (simple floral prints)

**Prior art**
- **Cyanotype:** Anna Atkins, *Photographs of British Algae*, 1843. Specimens were laid on paper coated with ferric ammonium citrate and potassium ferricyanide, sun-exposed and washed; uncovered areas turn dark blue [src]. Atkins and Anne Dixon later made a flowering-plants volume (1854) [src].
- **Katagami:** persimmon-tannin mulberry-paper stencils, deep copper brown, reinforced with silk thread. They balance positive and negative space with minute perforations and repeat seamlessly [src].
- **Kamon:** "essentially monochrome", meant to work reversed. The imperial chrysanthemum has 16 petals; paulownia in a 5-7-5 count [src].
- **William Morris, *Strawberry Thief* (1883):** indigo discharge print, blue and white plus red and yellow, with thrushes [src].
- **Millefleur tapestry, c. 1480–1520:** small whole plants spread evenly over a dark green ground [src].
- **Ditsy:** a tiny motif, scattered and facing every direction, which reads almost as a solid colour from a distance [src].
- **Herbarium:** specimens mounted on 11.5″ × 16.5″ sheets [src]; label usually lower right [gen].
- **Karl Blossfeldt, *Urformen der Kunst* (1928):** plants magnified up to 30× on plain grey or white [src].

**Hues:** H1 paper/ground, H2 ink/print, H3 petal, H4 centre, H5 foliage, H6 second ink (overprint, discharge colour).

**Variations**
1. **Cyanotype photogram.**
   - Recipe: Bloom (flatten 100, side or face view, with stem and leaves) mask → Blur 1–2 px → Invert → Gradient Map from Prussian `#123E7A` through `#3C6EA8` to paper `#F2F0E6`.
   - Petal translucency: feed `thickness` into the mask so thin petals print mid-blue rather than white [est].
   - Paper: brushed-edge coating from a Brushwork mask, plus Grain.
2. **Pressed flower on paper.**
   - Recipe: Bloom (flatten 100) → desaturate 30% → hue drift toward brown (more on reds and whites [?]) → Light Engine at relief 3 (a hairline shadow) on Old Paper.
   - Add two tape strips (Shape rectangles, low alpha), and set translucency so the paper texture shows through the petals.
3. **Herbarium sheet.**
   - Portrait 0.70 aspect, one whole plant (Bloom stem-with-leaves; long stems bent into a V [src: "may be bent"]).
   - Linen strips, plus a small envelope for loose petals [gen].
   - The poem sits where the label would be, lower right, in typewriter scale.
4. **Ink stamp.**
   - Recipe: Bloom mask → Threshold → Displace by fine Noise (ink starvation) → Grain.
   - Scatter 3–12 impressions, each with its own pressure (fade) and 1–3° turn.
   - Optional second colour misregistered by 2–4 px.
5. **Linocut.**
   - Recipe: Bloom height → Posterize 3 → Threshold.
   - Gouge marks: Flow Lines clipped to the negative space, with lines following the flower's contour.
   - Edges at 1 px for the cut wall, then a slightly uneven ink layer (Noise multiply).
6. **Botanical silhouette.** Bloom side view, single flat tone on a soft Gradient, 1–3 stems of different heights. Reads like a cut-paper shadow.
7. **Katagami repeat.**
   - Recipe: Bloom mask → Threshold → Mirror and offset tile, then punch fine dots (Cells, Threshold).
   - Ground persimmon `#7A4A2A` [est]; thin "silk thread" bridge lines (a sparse grid at 2% opacity).
8. **Kamon roundel.**
   - Recipe: one petal profile → Polar/Kaleidoscope at n = species count (16 chrysanthemum, 5 cherry, 3 iris) → Shape ring.
   - Two tones only; seed picks the jinuki (reversed) version 50% of the time.
9. **Morris meander.**
   - Mirrored, half-drop repeat; Tendrils grown along Flow Lines as stems; Bloom heads placed at branch tips; leaves filling the gaps.
   - Indigo ground with red and yellow discharge accents.
10. **Ditsy calico.**
    - Scatter of Bloom sheet cells at 1–2% of page width, turn 100%, clump 0, count 400–1200; Canvas Weave under everything.
    - Two or three ink colours on a cream or navy ground.
11. **Millefleur.** Scatter of whole plants (Bloom stem-with-leaves) at even density on `#1F3A2A` [est], with no perspective.
12. **Blossfeldt plate.** One magnified bud or stem, monochrome photogravure (Gradient Map in warm grey), grey ground, Light Engine with a soft top light.

**Unique to this app**
- The poem is placed as the herbarium label, or in the kamon's centre.
- In cyanotype, the poem's own words mask out (white) as if laid on the paper with the plant, via Poem words → mask.
- The light dial sets the hairline shadow of pressed specimens.

**Avoid**
- Black outline plus flat fill (clip-art).
- Perfectly symmetric 5-petal icons.
- Any of these on Morris or katagami: drop shadows, glossy gradients, rainbow palettes.

---

## 4. Bundles and bouquets

**Prior art**
- **Dutch Golden Age still life** (Rachel Ruysch, c. 1680):
  - Dark, shadowy ground with the centre "dramatically highlighted".
  - "Pyramid-shaped", asymmetrical composition with "wildly curving stems".
  - Insects, and leaves starting to brown [src].
  - Van Huysum shows buds next to blooms that are falling apart [src].
- **Ikebana:**
  - Odd numbers; symmetry avoided.
  - A scalene triangle of heaven, human and earth.
  - Stems and leaves weighted as much as blossoms.
  - Styles: shoka (tight bundle, asymmetric triangle), nageire ("thrown-in"), moribana (piled in a shallow dish on a kenzan) [src].
- **Hand-tied spiral posy, kraft-wrapped bouquet, flower crown, overhead flat lay:** contemporary floristry and Instagram conventions [gen].

**Hues:** H1 ground (table, wall), H2 main bloom, H3 secondary bloom, H4 filler, H5 foliage, H6 wrap, ribbon or vessel.

**Variations**
1. **Overhead posy.**
   - Dome of Bloom face-views by Vogel placement: the largest bloom near the centre, smaller ones toward the rim.
   - Filler (Queen Anne's lace, clover) in the gaps; a ring of leaves.
   - Light Engine on summed heights, with occlusion 60 for the deep crevices.
2. **Wrapped bouquet, side view.**
   - Cone of paper: Gradient + Noise creases into the Light Engine height.
   - Stems below the tie, Bloom heads fanned above.
   - Twine drawn as a Shape line.
3. **Flat lay on a table.**
   - The bouquet lies diagonally on wood or linen (Canvas Weave or Noise grain), with loose petals and leaves scattered nearby.
   - Objects: scissors, twine, a letter. A low dial gives long shadows.
4. **Flower crown.**
   - Blooms and leaves placed on a circle (Polar), turn following the tangent, with size breathing ±30%.
   - The ring encircles the first stanza (Poem stanza mask centre).
5. **Wreath or garland swag.** Like the crown but denser with foliage. The swag is a catenary across the top margin.
6. **Ikebana, moribana or nageire.**
   - Three lines at about 1 : 0.75 : 0.5 length [est; ratios not in source], leaning about 10°, 45° and 75° [est].
   - Odd count: 3, 5 or 7 blooms. Shallow dish.
   - Over 60% empty ground, with the poem in that space.
7. **Shoka stem bundle.** One species only, a tight vertical bundle, asymmetrical triangle.
8. **Dutch still life.**
   - Ground `#14110D` [est]; stone ledge; urn.
   - Pyramid of mixed species on curving stems; one drooping bloom.
   - 1–3 insects, at Objects or Scatter scale.
   - Light Engine with a high dial from upper left, shadow 80, ambient 10.
9. **Single stem in a bud vase.** Glass part for the vase, with refraction of the stem below the water line.
10. **Armful of field flowers.** A loose, uneven bunch of meadow species with grasses (Flow Lines), slightly blown (Warp).
11. **Bridal cascade.** Teardrop outline; trailing Tendrils; whites and creams with one blush hue.
12. **Tussie-mussie.** A tiny round posy in a paper doily (Shape plus a Cells lace border).
    - Optional mode: the seed chooses flowers by Victorian "language of flowers" meanings [? no source consulted].

**Unique to this app**
- The crown or wreath literally frames a stanza.
- The empty space of an ikebana arrangement is reserved for the poem, using Poem distance to keep stems out.
- The dial moves the window light across the still life, and the shadows of drooping blooms fall across the text.

**Avoid**
- Symmetric "ball" bouquets.
- Satin bows; glitter; hearts.
- Teleflora-catalogue polish (every bloom perfect, facing camera).
- Literal skulls in still lifes.

---

## 5. Wilting flowers and scattered petals

**Prior art**
- **Vanitas still life:** insects, wilting flowers and buds side by side make transience visible [src].
- **Hanafubuki / sakura-fubuki** ("cherry blossom snowstorm"): wind lifting petals so they drift [src].
- **Zanō:** the last petal of the season [src].
- **Hanaikada:** a "petal raft" of fallen cherry petals on water [? source did not cover the term].
- **Millais, *Ophelia*:** the riverbank flowers were painted from life with great specificity, and the violets carry meaning (faithfulness, death) [src].

**Hues:** H1 surface (wood, linen, water, paper), H2 fresh petal, H3 aged petal (brown, cream), H4 centre or seed head, H5 stem and leaf, H6 light.

**Variations**
1. **Vanitas ledge.**
   - Bloom stage 75–90 drooping over a ledge, with 5–20 fallen petals below.
   - Light: Light Engine with a dark ground and one strong key.
   - Objects: a guttered candle or an hourglass, at most one, and optional.
2. **Single drooping rose.** Head bowed past 90° on a long curved stem; petals browning at the edges; 3–5 petals on the ground.
3. **Dried bouquet hung upside down.**
   - Desaturate 50% and shift hue toward ochre, with some species barely changed [?].
   - Crisp, papery height: Posterize the height map to 6 levels, then lightly blur it.
4. **Petals strewn on a table.**
   - Scatter of single-petal Bloom cells, clumped 60% around one fallen head; turn 100%; each petal's own curl in the height map.
   - Light Engine shows the curl shadows.
5. **Petal trail.** Petals follow the poem's lines: Scatter's Where = Poem lines, offset below each line.
6. **Rose petals on water.**
   - Water part, with a few petals floating and casting soft shadows on a shallow bottom.
   - A Displace ripple ring around each petal.
7. **Hanafubuki drift.**
   - Particles in petal shape; Motion Blur along the wind angle, more on near petals; size drawn from three depth bands.
   - Back band: Blur 4 px. Front band: Blur 12 px at low alpha.
8. **Petal storm round the words.** Petals swirl in a Warp vortex that keeps clear of the words (Poem distance), and they thicken toward the punctuation (Poem punctuation → Where).
9. **Loves-me-not daisy.**
   - A daisy with most rays plucked. The plucked rays lie scattered, one per poem line [est], with one ray left on the head.
10. **The last petal (zanō).** A bare branch or capsule with one petal mid-fall. Mostly empty page.
11. **Fallen into the book.** Pressed petals in a page gutter: a Gradient crease shadow, and a faint petal-shaped stain beside each petal (Blur of the mask, multiply, 8%).
12. **Spent poppy.** Petals dropped, leaving the pepper-pot capsule [gen] and one petal on the ground. Red fades to `#8E3A2E` [est].
13. **Hanaikada.** Fallen cherry petals packed in a drifting raft on dark water, with Flow Lines as the current [?].

**Unique to this app**
- Petal positions are driven by the poem's lines and punctuation.
- The light dial is the window or sun, so the curled-petal shadows move.
- Seeded wilting stage means no two vanitas images show the same moment.

**Avoid**
- Heart-shaped petal arrangements.
- Rose petals on a bed (romance cliché).
- Skull clip-art; gothic filigree.
- Perfect fresh red petals on every seed: some must age.

---

## 6. Idyllic meadow

**Prior art**
- **Monet, *Poppy Field near Argenteuil* (1873):** two mother-and-child pairs on a diagonal; poppies dominate the left (red), blue-green on the right; tree line and a house at the far end [src].
- **Van Gogh, *Poppy Field* (Auvers, 1890):** horizontal bands of poppies, then dark trees, then restless blue sky. The horizon sits much higher than Monet's, "a composition that verges on the abstract", a "motif in red and green" [src].
- **Kazuo Oga (Ghibli, *Totoro*):**
  - "Not piercing, raw primary colors, but softer… colors that make you feel relieved".
  - "Subdued but beautiful" mixed colours.
  - Real, specific plants instead of vague "weeds" [src].
- **Cottagecore:** "aspirational nostalgia", slow pastoral life, floral prints, muted palettes. It is criticised as romanticised and Eurocentric [src].
- **Millefleur:** an even scatter of plants [src].

**Idyllic rules** [est, derived from the above]
- **Light:** high-key and warm, with soft shadows (shadow at most 40, ambient 35–50).
- **Distance:** aerial perspective, so contrast and saturation drop with distance.
- **Sky:** at least 25% sky with cumulus, or the Van Gogh high horizon.
- **Wind:** one coherent wind direction for grass, petals and clouds.
- **Flowers:** brushwork blobs in the distance, recognisable species only in the near ground.
- **No black:** the darkest value is a deep green `#2E4A2C`.

**Hues:** H1 sky, H2 far land/trees, H3 grass, H4 main flower, H5 second flower, H6 sunlight.

**Construction (all variations)**
- Sky: Gradient, plus Perlin cumulus through a Threshold and soft Blur, lit by the Light Engine from the dial.
- Far band: Noise tree line, Blur 3, tinted toward the sky hue.
- Mid band: Perlin grass Warped by the wind, plus a Scatter of flower dabs (round 2–6 px blobs in the species colour, clumped 50–70%).
- Near band: grass blades as Flow Lines or strokes along the wind field, plus Bloom side or three-quarter views at full detail, Blurred 6–14 px for shallow depth of field.
- Air: Particles (petals, seed fluff) with Motion Blur along the wind, plus Motes in the sun direction.
- Sun: Glow at the dial's position when the dial is low. The Light Engine gives the grass rim light (second light from 180°, height 120).

**Variations**
1. **Monet diagonal.** A red poppy drift running diagonally from the lower left. Optional tiny parasol figures, as two soft dabs at 5% of page height [est].
2. **Van Gogh bands.** High horizon (sky 15%), with thick, directional strokes.
3. **Ghibli hillside.**
   - Rolling Perlin hill line under towering cumulus, in Oga-soft greens.
   - A single tree or a path (Flow Lines).
4. **Cottage garden edge.** A fence or stone wall (Bricks, low) with foxglove, lavender and roses spilling in front.
5. **Wind through grass.** Grass dominant; a strong Warp gust wave crossing the field as a lighter band; flowers sparse.
6. **Golden hour backlit meadow.** Dial low behind the field; every blade rim-lit; motes and glowing seed fluff.
7. **Daisy lawn.** A close, low viewpoint: daisies and clover from above at an angle, buttercups glinting (high gloss).
8. **Lavender rows.** Rows converging in perspective (the Perspective part on stripes), with purple bands grading to grey-blue in the distance.
9. **Sunflower field.** Sunflower heads all turned toward the dial's direction [gen: mature heads typically face east]. Optional rule: heads face the dial.
10. **Cornflower and poppy cornfield.** Wheat-gold base `#D9B867` with red and blue specks.
11. **Bluebell wood floor.** A violet-blue haze under trunks; dappled light from Cells-thresholded leaf shadows moving with the dial.
12. **Wildflower bank by water.** A meadow sloping to a still stream (Water part) reflecting sky. *Ophelia*-like specificity in the foreground.
13. **Petals in the air.** Any meadow plus a hanafubuki layer, petals released from the poem's punctuation.
14. **Dandelion-clock afternoon** (gen species, not in the table). Seed fluff drifting, with a Glow on each seed.

**Unique to this app**
- The dial is the sun: its position sets cloud lighting, rim light and Glow placement, and in the sunflower variation the direction the heads face.
- Wind runs along the poem's line direction.
- Grass parts gently round the words (Poem distance → Warp strength).

**Avoid**
- Saturated rainbow fields.
- Lens-flare stars; god-rays everywhere.
- Kinkade-style cottage glow [opinion].
- Uniform flower scatter (it must clump).
- Every flower facing the camera.
- Cartoon outlines.
- Black shadows.

---

## 7. Macro flower photography (Light Engine showpiece)

**Prior art**
- **Photography technique:**
  - Backlight with the sun to the side or behind the flower, showing translucent petals and their veins.
  - Wide aperture f/1.4–2.8 with the background 1–1.5 m away; diffuse or golden-hour light [src: DPS].
  - "The background is almost more important than the flower itself"; other flowers serve as foreground bokeh; dew preferred to sprayed water [src: PetaPixel].
- **Rendering:**
  - Depth-of-field (DoF) circle of confusion from depth.
  - Bright points spread into discs because the aperture is round.
  - Foreground and background are blurred separately so a sharp background doesn't bleed over a blurred foreground [src: Catlike Coding].
- **Buttercup gloss:** the mirror-like epidermis is ideal for a specular hotspot [src].
- **Blossfeldt:** magnified structure as architecture [src].

**Hues:** H1 background bokeh A, H2 bokeh B, H3 petal, H4 centre/stamens, H5 foliage, H6 light (key; the rim takes the page's second light).

**Construction**
- **Focal layer:** Bloom at large scale with its height into the Light Engine.
  - Relief 30–60, occlusion 50, translucency 40–80 from Bloom `thickness`, shine and gloss per species (buttercup and tulip high, poppy low and silky).
  - Second light at turn 180°, height 120 for the rim.
- **Background:** Scatter of soft discs (Shape circle) in H1/H2, sizes from 4% to 18% of page width, brightness varied, blended with screen.
  - Optional: a 6-sided aperture shape [est], and cat's-eye discs toward the corners.
  - Under the discs, a Blur 40+ wash of foliage colour.
- **Foreground veil:** a second Bloom in H3, Blur 25–40 px at 40–60% alpha, crossing one corner.
- **DoF rule:** blur = |depth − focus| × k. Depth is per layer: 0 for the focal Bloom, about 0.3 for its own far petals (a height-based Blur mask on the Bloom), 1 for the background, −1 for the veil.
- **Dew:**
  - Scatter of small circles, sizes 0.3–1.5% of width, clumped along petal edges and veins, with heights as domes.
  - Each drop goes through Glass refraction so it shows a tiny inverted flower, with gloss 95 and a Glow on its specular point.

**Variations**
1. **Backlit petal veins.**
   - Dial behind the flower, translucency 80, veins (Tendrils on the Bloom `veins` map) raised and darker.
   - The petal glows in H6 tinted by H3.
2. **Dew at dawn.** Cool ambient `#BFD3E6`; drops along the petal rims; one big drop with a refracted flower.
3. **Stamen crown.** Anemone or poppy centre close-up: anther heights plus Motes pollen grains; the petals are a soft blur.
4. **Phyllotaxis disc.**
   - A sunflower centre filling the frame: Vogel florets as domes, with a grazing dial (height 90+) raking the spirals.
   - Its outputs: shadows, occlusion.
5. **Buttercup glint.** A mirror hotspot that slides across the cup as the dial turns, with a yellow reflected glow on surroundings (a Glow of H3).
6. **Rose spiral from above.**
   - High-centred rose, with deep occlusion between petals.
   - Dial height 40 for dramatic cast shadows into the whorl.
7. **Shot through the foreground.**
   - Focal bloom small (25% of frame) in the rule-of-thirds, with a 70% veil of blurred petals of another hue.
   - The poem sits in the clear window.
8. **Bokeh field.** A tiny focal Bloom (forget-me-not or clover) against 30–80 bokeh discs, golden-hour warm discs H6.
9. **Rim-lit silhouette against sun.** Dial straight behind, strong Glow halo; the flower is nearly dark, with only rim and translucency.
10. **Frost-edged petals.** The Hoarfrost part on Bloom edges, with cold light and sharp sparkle.
11. **Lace against the light.** Queen Anne's lace backlit: hundreds of florets with translucency, and the dark centre floret in focus.
12. **Petal velvet.** An extreme close-up of a petal surface: fine Cells domes as conical epidermal cells [? general knowledge, unverified] under a raking light, with a soft sheen line.
13. **Spike in shallow focus.** Lavender or foxglove side view. Only the middle whorl or bell is sharp; the top and bottom are progressively blurred.

**Unique to this app**
- The light dial physically relights the flower in real time: the translucency glow moves, dew highlights and the buttercup glint slide, and cast shadows rotate in the rose's whorl.
- The bokeh discs cluster away from the text (Poem distance), so the poem sits in the soft field.
- Optionally, the dew drops form along the poem's lines.

**Avoid**
- Over-saturated HDR.
- Fake sprayed-water regularity (equal drops on a grid).
- Bokeh as perfect identical circles.
- Butterflies or ladybirds pasted on.
- Lens-flare stars.
- Pure white blown petals with no translucency gradient.

---

## 8. Shared seed and composition rules

**Seed**
- Seed → variation (weighted, with the "safe" ones more common) → jitter:
  - hue ±8°; saturation ±12%;
  - Bloom count ±30%; petal jitter 10–25%;
  - stage 30–70 (wilting surface 60–100); clump 30–80%;
  - wind angle ±25° around the poem's line direction.
- Mixed-species stops pick 2–4 species that share a season or habitat, from a small compatibility table [est]:
  - meadow: daisy, poppy, cornflower, buttercup, clover, Queen Anne's lace, chamomile;
  - woodland: bluebell, foxglove, violet, anemone;
  - garden: rose, peony, lavender, foxglove;
  - spring: tulip, cherry, forget-me-not.
  - The Dutch still life may break season, as the originals did [gen].

**Composition**
- Odd numbers, a size hierarchy (one hero bloom, 2–4 secondary, the rest filler), and asymmetry [src: ikebana; Ruysch].
- Leave a calm field for the poem via Poem distance.
- Overlap the frame edge; never a full ring of blooms floating in the middle (unless it is the crown).
- Foliage at 30–50% of the floral mass. Leaves and stems sell realism more than petals do [src: ikebana weighting].
- Every surface needs at least one imperfection per seed: a turned petal, a browning leaf, a bud.

**Anti-clip-art checklist**
- No outlines with flat fills unless the print medium justifies them (stamp, linocut, kamon).
- No identical copies; Bloom sheet variety is required.
- No emoji-style centred 5-petal icons.
- No gradients that pillow every petal.
- No sparkles or glitter, hearts, or script banners.

---

## 9. Sources consulted

- https://algorithmicbotany.org/papers/abop/abop-ch4.pdf
- https://thatsmaths.com/2014/06/05/sunflowers-and-fibonacci-models-of-efficiency/
- https://publicdomainreview.org/collections/cyanotypes-of-british-algae-by-anna-atkins-1843/
- https://www.cooperhewitt.org/2016/09/14/pattern-papers/
- https://en.wikipedia.org/wiki/Mon_(emblem)
- https://en.wikipedia.org/wiki/Strawberry_Thief
- https://en.wikipedia.org/wiki/Millefleur
- https://www.ragandmagpie.co.uk/blog/what-is-a-ditsy-print
- https://ncbg.unc.edu/2022/04/05/pressing-matters-how-to-make-an-herbarium-specimen/
- https://en.wikipedia.org/wiki/Karl_Blossfeldt
- https://en.wikipedia.org/wiki/Ikebana
- https://nmwa.org/art/collection/roses-convolvulus-poppies-and-other-flowers-urn-stone-ledge/
- https://openlab.citytech.cuny.edu/apss15/2015/02/25/vanitas-van-huysum-ruysch-and-membreno-canales/
- https://thecreativeadventurer.com/the-beautiful-meaning-behind-japans-many-words-for-cherry-blossoms/
- https://smarthistory.org/millais-ophelia
- https://budsandtendrils.substack.com/p/how-to-keep-the-colour-in-pressed
- https://en.wikipedia.org/wiki/The_Poppy_Field_near_Argenteuil
- https://www.metmuseum.org/art/collection/search/438004
- https://en.wikipedia.org/wiki/Poppy_Field
- https://animationobsessive.substack.com/p/defining-the-world-of-my-neighbor
- https://en.wikipedia.org/wiki/Cottagecore
- https://digital-photography-school.com/how-to-do-more-unique-flower-photography/
- https://petapixel.com/2022/03/06/13-tips-for-photographing-tiny-spring-flowers/
- https://catlikecoding.com/unity/tutorials/advanced-rendering/depth-of-field/
- https://www.tylerxhobbs.com/words/a-guide-to-simulating-watercolor-paint-with-generative-art (layered deformed polygons at about 4% opacity over 30–100 layers [src]. Use it for soft watercolour petals in the Imprints and Meadow surfaces. No Hobbs florals were found.)
- https://inconvergent.net/generative/hyphae (branching growth without collisions, a model for Morris and bridal Tendrils stems)
- Botany:
  - https://illinoiswildflowers.info/weeds/plants/oxeye_daisy.htm
  - https://m.illinoiswildflowers.info/weeds/plants/ger_chamomile.htm
  - https://gobotany.nativeplanttrust.org/species/papaver/rhoeas/
  - https://garden.org/ideas/view/Calif_Sue/1187/An-Explanation-of-Rose-Shapes-and-Types/
  - https://floranorthamerica.org/Helianthus%20annuus
  - https://minnesotawildflowers.info/flower/cornflower
  - https://www.treesandshrubsonline.org/articles/lavandula/lavandula-angustifolia/
  - https://en.wikipedia.org/wiki/Tulip
  - https://illinoiswildflowers.info/savanna/plants/turkcap_lily.htm
  - https://backyardnature.net/fl_iris.htm
  - https://naturblick.museumfuernaturkunde.berlin/species/portrait/373?lang=en
  - https://www.cam.ac.uk/research/news/why-buttercups-reflect-yellow-on-chins
  - https://www.treesandshrubsonline.org/articles/prunus/prunus-serrulata/
  - https://en.wikipedia.org/wiki/Anemone_coronaria
  - https://plants.ces.ncsu.edu/plants/digitalis-purpurea/
  - https://www.discoverwildlife.com/plant-facts/flowers/bluebells-identify-species-where-to-see
  - https://hort.extension.wisc.edu/articles/queen-annes-lace-daucus-carota/
  - https://en.wikipedia.org/wiki/Viola_(plant)
  - https://www.gardensbythebay.com.sg/en/learn-with-us/explore-resources/whats-blooming/hydrangea.html

Pages that could not be fetched, so their facts are marked [gen]:
- Wikipedia: Cosmos bipinnatus, Vanitas, Herbarium.
- inconvergent.net/generative index.
- artprice vanitas article.

The peony-forms page fetched but held no form descriptions.

No Shadertoy or OpenProcessing flower sketch was inspected in detail. The search found sketch pages only, so no technique is attributed to them.
