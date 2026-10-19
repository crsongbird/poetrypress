# Floral Surfaces Prior Art: Generator Catalogue

**Confidence key:** **[src]** stated in a consulted source (section 9). **[gen]** general botanical or art-historical knowledge, not checked this session. **[est]** my estimate (hex values, counts, ranges); tune by eye. **[?]** uncertain; verify first.

Five surfaces: **Imprints**, **Bouquets**, **Wilting and Petals**, **Meadow**, **Macro**. Each has a seed, a **Species** knob (a stepped slider over section 2, ending in "mixed (seeded)") and up to six hue pickers. The seed picks a variation, then jitters it (section 8).

---

## 1. The one new part: Bloom

Recipes use existing parts plus **Bloom**, which draws one flower.

- **Settings:**
  - species;
  - view: face, three-quarter, side, back, or bud;
  - stage 0–100: bud → open → past best → wilted → bare seed head/capsule;
  - petal jitter: count within the species range, plus each petal's length, width and turn;
  - flatten 0–100: 100 = pressed, one plane, no overlap shading;
  - part: whole, single petal, leaf, or stem-with-leaves;
  - seed.
- **Outputs:**
  - picture;
  - height: cupped petals rise at the rims, discs dome or cone, veins slightly raised;
  - mask;
  - petals: one grey per petal, for per-petal tint or drop;
  - centre mask;
  - veins;
  - thickness: drives the Light Engine's translucency; petals thin, disc and calyx thick.
- **Hue inputs:** petal, petal tip, centre, foliage. Empty inputs fall back to the species defaults.
- **Arrangement:**
  - radial whorls: n petals at 360°/n, the second whorl offset half a step (tulip, lily);
  - Vogel phyllotaxis for discs and doubles: angle = n·137.5°, r = c·√n [src: ABOP ch. 4]. This gives the 21/34 or 34/55 spirals [src]. ABOP's zinnia rule (petal size grows with n, later petals lie flatter) [src] also serves rose and peony doubles;
  - raceme: bells along a curved stem, one-sided for foxglove and bluebell;
  - umbel: rays of tiny phyllotaxis heads (Queen Anne's lace).
- **Wilting** (stage above 60): petals droop toward the stem, tips curl back, edges brown (Gradient Map on distance from the edge), and outer petals drop first.
- **Sheet output (proposed):** 8 seeded variants. Scatter in picture mode takes one cell per mark, so a field is never clones.

---

## 2. Species: what makes each recognisable

The *tell* is the one feature that must survive at 40 px.

| Species | Structure / count | Default colours [est] | Tell |
|---|---|---|---|
| Oxeye daisy | 15–35 white oblong rays; flat yellow disc; head 3–5 cm [src] | `#F7F5EE` / `#E8B21C` | many narrow rays, flat yolk |
| Chamomile | 10–20 rays that droop with age; hollow conical disc; threadlike leaves [src] | `#FBFAF4` / `#F0C02A` | domed cone |
| Corn poppy | 4 petals crumpled in bud; red; 13+ stamens; bristly stems [src]; black basal blotch [gen] | `#D7261E`, `#1A1414` | 4 papery petals; nodding hairy bud [gen] |
| Rose | petal counts: single 1–7, semi-double 8–15, double 16–25, full 26–40, very full 40+. Shapes: flat, cupped, globular, high-centred, quartered, rosette [src] | `#B3123A`, `#F2B8C2`, `#F6EBD9` | spiral centre |
| Sunflower | 17–30 rays (13 to 100+); 150–1000+ disc florets; reddish disc lobes, dark anthers [src] | `#F2B31B` / `#4A2A14` | Vogel spiral disc |
| Cosmos | 8 broad rays with toothed tips; feathery leaves [gen] | `#E25A9A`, `#F4F0F2` | notched wedges |
| Cornflower | 25–35 florets; outer florets funnels with 5 lobes; scaly bracts [src] | `#3A5FD0` | frilly ring of funnels |
| Lavender | whorls packed at the spike top, spaced lower; purple-tinged woolly calyx; grey-green leaves [src] | `#8C7BC4`, `#8FA08A` | spaced whorls |
| Tulip | 6 tepals in two whorls of 3; cup; basal blotch; 2–6 blue-green strap leaves; never pure blue [src] | `#D9332B`, `#F2C230`, `#7A2A6E` | cup on a bare stem |
| Peony | forms: single, Japanese, anemone, semi-double, bomb, double [gen] | `#F3C6CF`, `#C2264B` | ruffled bowl; gold boss when single |
| Lily | 6 tepals; long stamens with dark anthers; Turk's cap form recurved, spotted, nodding [src] | `#E8742A`, `#FFFFFF` | 6 points, 6 stamens |
| Iris | 3 falls, 3 standards, 3 style arms; yellow beard; guide lines [src] | `#5B3C9C`, `#F2C230` | falls under standards |
| Forget-me-not | 5 sky-blue petals; yellow eye ring; buds pink [src] | `#7FB2E5`, `#F3D24A` | yellow eye, pink buds |
| Buttercup | 5 yellow petals with glass-like gloss: flat epidermis over an air gap [src] | `#F7D21E` | specular hotspot |
| Cherry | single flowers 5 notched petals [gen]; doubles 25–50+; clusters of 2–6; pink buds open white; bronze young leaves [src] | `#F6D3DC`, `#FFF7F8` | notched tip; clusters |
| Anemone | 5–8 tepals; red, blue or white; black centre with a stamen crown; leaf ruff just under the flower [src] | `#C8102E`, `#3B3FA0`, `#16121C` | black velvet eye |
| Zinnia | phyllotactic tiers, outer petals flatter [src: ABOP] | `#F05A28`, `#E83F7A` | stacked tiers |
| Foxglove | spotted tubular bells 5–7 cm on one side of a 30–60 cm spike [src] | `#B04F9B`, `#5A1E4A` | one-sided spotted bells |
| Bluebell | drooping stem; bells on one side; tips curl back; cream pollen [src] | `#4B4FB8` | bowed stem |
| Red clover | ball of tiny pea flowers; trifoliate leaf with a pale chevron [gen] | `#C25A8E` | pink pom, 3 leaflets |
| Queen Anne's lace | flat umbel 5–10 cm, ~1000 white florets, dark purple centre; curls into a "bird's nest" when seeding [src] | `#F5F3EC`, `#4A1F3D` | lace with one dark dot |
| Violet | 4 upswept/lateral petals + 1 broad spurred lower petal [src]; heart-shaped leaves [gen] | `#5C2E91` | the lower lip |
| Hydrangea | mophead ball or lacecap ring; the show is sepals (usually 4 [gen]); blue in acid soil, pink in alkaline [src] | `#7E9BD6`, `#E79BB8` | ball of 4-part florets |

**Slider order** [est], neighbours look related: daisy, chamomile, cosmos, sunflower, zinnia, cornflower, poppy, anemone, buttercup, rose, peony, tulip, lily, iris, cherry, forget-me-not, violet, bluebell, foxglove, lavender, clover, Queen Anne's lace, hydrangea, mixed.

Keep colours honest. No blue tulips [src] and no blue roses unless the user picks that hue.

---

## 3. Imprints

**Prior art**
- **Cyanotype:** Anna Atkins' *Photographs of British Algae* (1843): specimens laid on paper coated with ferric ammonium citrate and potassium ferricyanide, sun-exposed, washed. Uncovered areas go dark blue [src]. A flowering-plants volume with Anne Dixon followed in 1854 [src].
- **Katagami:** copper-brown persimmon-tannin stencils, silk-thread reinforced. They balance positive and negative space with minute perforations and repeat seamlessly [src].
- **Kamon:** "essentially monochrome" crests, reversible (jinuki). The imperial chrysanthemum has 16 petals; the paulownia flower spikes are counted 5-7-5 [src].
- **William Morris:** *Strawberry Thief* (1883), an indigo discharge print in blue and white with red and yellow added [src].
- **Millefleur** (c. 1480–1520): small plants evenly spread on a dark green ground [src].
- **Ditsy:** tiny motifs, scattered and facing every way, reading almost solid from a distance [src].
- **Herbarium:** specimens on 11.5″×16.5″ sheets [src], label lower right [gen].
- **Karl Blossfeldt** (1928): plants magnified up to 30× on plain grey or white [src].

**Hues:** H1 paper, H2 ink, H3 petal, H4 centre, H5 foliage, H6 second ink.

**Variations**
1. **Cyanotype.** Bloom (flatten 100, with stem) mask → Blur 1–2 → Invert → Gradient Map `#123E7A` → `#3C6EA8` → paper `#F2F0E6`. Thin petals (`thickness`) print mid-blue, not white [est]. Brushwork-masked coating edge; Grain.
2. **Pressed flower.** Bloom flatten 100 → desaturate 30% and drift toward brown [? which colours fade most is unsourced] → Light Engine at relief 3, which gives a hairline shadow on Old Paper. Two tape strips. Some translucency so the paper shows through.
3. **Herbarium sheet.** A 0.70 portrait sheet holds one whole plant, with long stems bent to fit [src]. Add linen strips and a seed envelope [gen]. The poem goes where the label would be.
4. **Ink stamp.** Bloom mask → Threshold → Displace by fine Noise (ink starvation) → Grain. Scatter 3–12 impressions, each with its own pressure and a 1–3° turn. A second colour can be misregistered 2–4 px.
5. **Linocut.** Bloom height → Posterize 3 → Threshold. For gouge marks, clip Flow Lines that follow the contour to the negative space. Add a 1 px Edges cut wall and uneven ink (Noise multiply).
6. **Botanical silhouette.** 1–3 side-view stems in one flat tone on a soft Gradient, like cut paper.
7. **Katagami repeat.** Bloom mask → Threshold → Mirror plus half-drop tile. Punch fine dots (Cells → Threshold) and add hairline "silk thread" bridges. Ground `#7A4A2A` [est].
8. **Kamon roundel.** One petal → Kaleidoscope at n (16 chrysanthemum, 5 cherry, 3 iris) → Shape ring. Two tones; reversed on half the seeds.
9. **Morris meander.** Mirrored half-drop. Tendrils stems grow along Flow Lines, Bloom heads sit at the tips and leaves fill the gaps. Indigo ground with red and yellow discharge.
10. **Ditsy calico.** Scatter 400–1200 Bloom sheet cells at 1–2% of page width, turn 100%, clump 0, over Canvas Weave. Two or three inks.
11. **Millefleur.** An even Scatter of whole plants on `#1F3A2A` [est], with no perspective.
12. **Blossfeldt plate.** One magnified bud on grey, warm-grey photogravure Gradient Map, soft top light.

**Unique to this app:** the poem becomes the herbarium label or the kamon's centre. In cyanotype the poem's words mask white (Poem words), as if laid on the paper beside the plant. The dial casts the pressed specimen's hairline shadow.

**Avoid:**
- black outline with flat fill on a naturalistic print;
- perfect five-petal icons;
- drop shadows, glossy gradients or rainbow palettes on period prints.

---

## 4. Bundles and bouquets

**Prior art**
- **Ruysch,** c. 1680: a dark ground with the centre "dramatically highlighted". A "pyramid-shaped", asymmetrical arrangement with "wildly curving stems", insects and browning leaves [src].
- **Van Huysum:** buds beside blooms "falling apart" [src].
- **Ikebana:** odd numbers and no symmetry. A scalene triangle of heaven, human and earth. Stems and leaves weigh as much as blossoms. Styles include shoka (a tight asymmetric bundle), nageire ("thrown-in") and moribana (in a shallow dish on a kenzan) [src].
- **Contemporary floristry** [gen]: posies, kraft-wrapped bouquets, crowns, overhead flat lays.

**Hues:** H1 ground, H2 main bloom, H3 secondary, H4 filler, H5 foliage, H6 wrap, ribbon or vessel.

**Variations**
1. **Overhead posy.** A dome of face-view Blooms placed by Vogel: largest near the centre, filler (lace, clover) in the gaps, a collar of leaves. Light Engine with occlusion 60.
2. **Wrapped bouquet.** A paper cone (Gradient + Noise creases into the height), heads fanned above a twine tie.
3. **Flat lay.** The bouquet lies diagonally on wood or linen, with stray petals and leaves. Optional Objects (scissors, a letter). Low dial for long shadows.
4. **Flower crown.** Blooms and leaves on a circle (Polar), turned to the tangent, size ±30%, circling the first stanza.
5. **Wreath / garland swag.** Denser foliage. The swag hangs as a catenary across the top margin.
6. **Ikebana (moribana or nageire).**
   - Three lines at about 1 : 0.75 : 0.5, leaning about 10°, 45° and 75° [est].
   - 3, 5 or 7 blooms in a shallow dish.
   - At least 60% empty ground, which holds the poem.
7. **Shoka.** One species in a tight bundle, asymmetric triangle.
8. **Dutch still life.**
   - Ground `#14110D` [est], a stone ledge and an urn.
   - A mixed pyramid on curving stems, one drooping bloom, 1–3 insects.
   - Key light from the upper left: shadow 80, ambient 10.
9. **Bud vase.** One stem in a Glass vase, refracted below the waterline.
10. **Armful of field flowers.** A loose, uneven meadow bunch with grasses, wind-Warped.
11. **Bridal cascade.** A teardrop shape with trailing Tendrils, creams plus one blush hue.
12. **Tussie-mussie.** A tiny posy in a Cells-lace doily. Optional Victorian "language of flowers" choice [? unsourced].

**Unique to this app:** crowns and wreaths frame a stanza. The ikebana void is the poem's space, with Poem distance keeping stems out. The dial moves the window light across the still life.

**Avoid:**
- symmetric ball bouquets;
- satin bows, glitter, hearts;
- catalogue perfection, with every bloom facing the camera;
- skull clip-art.

---

## 5. Wilting flowers and scattered petals

**Prior art**
- **Vanitas** juxtaposes buds, wilting flowers and insects to show transience [src].
- **Hanafubuki** ("cherry blossom snowstorm") is wind-lifted drifting petals [src]. **Zanō** is the last petal of the season [src]. **Hanaikada**, a petal raft on water [? term not covered by the source].
- **Millais' *Ophelia*:** riverbank flowers painted from life "with an extraordinary amount of specificity"; the violets carry meaning [src].

**Hues:** H1 surface (wood, linen, water), H2 fresh petal, H3 aged petal, H4 seed head, H5 stem and leaf, H6 light.

**Variations**
1. **Vanitas ledge.** A Bloom at stage 75–90 droops over a ledge, with 5–20 fallen petals and a dark ground under one key light. At most one Object (a guttered candle or an hourglass).
2. **Drooping rose.** The head bowed past 90°, edges browning, 3–5 petals down.
3. **Dried, hung bouquet.** Upside down, desaturated 50% toward ochre. Papery relief: Posterize the height to 6 levels, then a light Blur.
4. **Petals on a table.** Scatter single-petal cells clumped 60% around one fallen head, turn 100%. Their curl reads in the Light Engine shadows.
5. **Petal trail.** Scatter's Where = Poem lines, offset just below each line.
6. **Petals on water.** Water part, floating petals shadowing a shallow bottom, a Displace ripple ring around each.
7. **Hanafubuki drift.** Petal Particles in three depth bands, Motion Blur along the wind. The back band gets Blur 4; the front band Blur 12 at low alpha.
8. **Storm round the words.** A Warp vortex that keeps clear of the words (Poem distance). Petals thicken at punctuation (Poem punctuation → Where).
9. **Loves-me-not.** A daisy with most rays plucked, one plucked ray per poem line [est] and one left on the head.
10. **The last petal (zanō).** A bare capsule with one petal mid-fall on a near-empty page.
11. **Fallen into the book.** Petals pressed in a page gutter (Gradient crease) with faint stains (mask Blur, multiply 8%).
12. **Spent poppy.** A pepper-pot capsule [gen] with one faded petal `#8E3A2E` [est].
13. **Hanaikada.** A raft of cherry petals on dark water drifting along a Flow Lines current.

**Unique to this app:** petals follow the poem's lines and punctuation. The dial moves the curled-petal shadows. The seeded wilting stage means no two vanitas images catch the same moment.

**Avoid:**
- heart-shaped petal layouts;
- petals on a bed;
- gothic filigree;
- uniformly fresh red petals (some must age).

---

## 6. Idyllic meadow

**Prior art**
- **Monet,** *Poppy Field near Argenteuil* (1873): two mother-and-child pairs set on a diagonal. Red dominates the left, blue-green the right; a tree line and house at the back [src].
- **Van Gogh,** *Poppy Field* (Auvers, 1890): horizontal bands of poppies, dark trees and restless sky. The horizon is far higher than Monet's, "verges on the abstract", a "motif in red and green" [src].
- **Kazuo Oga** (*Totoro*): "Not piercing, raw primary colors, but softer… colors that make you feel relieved". He painted specific, identifiable plants instead of vague weeds [src].
- **Cottagecore:** "aspirational nostalgia" and slow pastoral life. It is criticised as romanticised and Eurocentric [src].

**Idyllic rules** [est]
- High-key, warm light with soft shadows: shadow at most 40, ambient 35–50.
- Aerial perspective: contrast and saturation fall with distance.
- At least 25% sky with cumulus, or the Van Gogh high horizon.
- One wind direction for grass, petals and clouds.
- Brush blobs in the distance; recognisable species only up close.
- No black: the darkest value is `#2E4A2C`.

**Hues:** H1 sky, H2 far land, H3 grass, H4 main flower, H5 second flower, H6 sunlight.

**Base build**
- **Sky:** Gradient with Perlin → Threshold → Blur cumulus, lit by the Light Engine from the dial.
- **Far band:** a Noise tree line, Blur 3, tinted toward the sky.
- **Mid band:** wind-Warped Perlin grass, plus a clumped Scatter of 2–6 px flower dabs.
- **Near band:**
  - Flow Lines grass blades;
  - full Bloom side and three-quarter views, Blurred 6–14 px for shallow depth of field;
  - grass rim light from a second light at 180°, height 120.
- **Air:** Particles (petals, seed fluff) with Motion Blur, plus Motes toward the sun.
- **Sun:** a Glow at the dial's position when the dial is low.

**Variations**
1. **Monet diagonal.** A diagonal drift of poppies; optional two-dab parasol figures at 5% of page height [est].
2. **Van Gogh bands.** Sky 15%, thick directional strokes.
3. **Ghibli hillside.** A Perlin hill line under towering cumulus in Oga-soft greens, with one tree or a path.
4. **Cottage garden edge.** A low wall (Bricks) with foxglove, lavender and roses spilling over it.
5. **Wind through grass.** Grass dominant, with a lighter gust band crossing the field (Warp) and few flowers.
6. **Golden hour.** Dial low behind the field, every blade rim-lit, motes and glowing fluff.
7. **Daisy lawn.** Low, oblique view of daisies and clover, with high-gloss buttercups glinting.
8. **Lavender rows.** Rows converging in perspective (Perspective on stripes), fading purple to grey-blue.
9. **Sunflower field.** Heads turned toward the dial [gen: mature heads mostly face east].
10. **Cornfield.** A wheat-gold base `#D9B867` flecked with poppy red and cornflower blue.
11. **Bluebell wood floor.** Violet haze under trunks; dappled Cells shadows that move with the dial.
12. **Bank by water.** A meadow sloping to a still stream (Water), with an *Ophelia*-specific foreground.
13. **Petals in the air.** Any meadow plus a hanafubuki layer released from the poem's punctuation.

**Unique to this app:** the dial is the sun. It sets cloud light, rim light, Glow and the sunflowers' facing. Wind runs along the poem's lines, and grass parts gently round the words (Poem distance → Warp).

**Avoid:**
- rainbow saturation;
- lens-flare stars and ubiquitous god-rays;
- glowing-cottage kitsch;
- uniform scatter (it must clump);
- every flower facing front;
- outlines, black shadows.

---

## 7. Macro photography (Light Engine showpiece)

**Prior art**
- **Backlighting:** shoot toward the sky with the sun beside or behind the flower to show translucent petals and veins. Use f/1.4–2.8 with the background about 1–1.5 m behind, in diffuse or golden-hour light [src: DPS].
- **Background:** "The background is almost more important than the flower itself". Other flowers serve as foreground bokeh; natural dew beats sprayed water [src: PetaPixel].
- **Depth-of-field rendering:** blur radius comes from depth. Bright points spread into discs because the aperture is round. Foreground and background are blurred separately so neither bleeds over the other [src: Catlike Coding].
- **Buttercup:** a glass-like gloss [src].

**Hues:** H1 bokeh A, H2 bokeh B, H3 petal, H4 centre, H5 foliage, H6 key light. The rim takes the page's second light.

**Base build**
- **Focal Bloom:** large, with its height into the Light Engine.
  - relief 30–60, occlusion 50;
  - translucency 40–80, driven by `thickness`;
  - gloss per species: high for buttercup and tulip, low and silky for poppy;
  - second light at 180°, height 120.
- **Background:**
  - screen-blended Scatter of soft discs, 4–18% of width, varied brightness, over a Blur 40+ foliage wash;
  - optional hexagonal aperture [est], cat's-eye discs toward the corners.
- **Foreground veil:** a second Bloom, Blur 25–40, at 40–60% alpha, crossing a corner.
- **Depth-of-field rule:** blur = |depth − focus|·k.
  - depth 0 = the focal flower; 0.3 = its own far petals (a height-masked Blur); 1 = background; −1 = veil.
- **Dew:**
  - Scatter domes 0.3–1.5% of width, clumped on rims and veins;
  - Glass refraction, so each drop holds a tiny inverted flower;
  - gloss 95, with a Glow on the specular highlights.

**Variations**
1. **Backlit veins.** Dial behind; translucency 80; raised Tendrils veins; the petal glows H6 tinted by H3.
2. **Dew at dawn.** Cool ambient `#BFD3E6`, drops along the rims, one large refracting drop.
3. **Stamen crown.** An anemone or poppy centre with anther heights and Motes pollen; the petals blurred.
4. **Phyllotaxis disc.** A sunflower centre fills the frame, with Vogel domes raked by a grazing dial (height 90+).
5. **Buttercup glint.** A hotspot that slides round the cup as the dial turns, plus a yellow reflected Glow.
6. **Rose spiral.** High-centred, seen from above; deep occlusion; dial height 40 casts shadows into the whorl.
7. **Through the foreground.** The focal bloom at 25% of the frame on a third, a 70% veil of another hue, the poem in the clear window.
8. **Bokeh field.** A tiny forget-me-not or clover against 30–80 warm discs.
9. **Rim-lit silhouette.** Dial straight behind with a strong halo; only rim and translucency show.
10. **Frost edges.** Hoarfrost on Bloom edges, cold light.
11. **Lace against light.** Queen Anne's lace backlit, its dark centre floret in focus.
12. **Petal velvet.** Fine Cells domes as conical epidermal cells [?] under a raking light.
13. **Spike in shallow focus.** Lavender or foxglove: only the middle whorl or bell is sharp.

**Unique to this app:** the dial relights the flower live. The translucent glow moves, dew and buttercup highlights slide, and shadows rotate in the rose. Bokeh clusters away from the text (Poem distance), so the poem sits in the soft field. Dew can bead along the poem's lines.

**Avoid:**
- HDR oversaturation;
- grid-regular sprayed drops;
- identical bokeh circles;
- pasted butterflies or ladybirds;
- flare stars;
- blown-out white petals with no translucency gradient.

---

## 8. Shared seed and composition rules

**Seed jitter**
- hue ±8°, saturation ±12%;
- bloom count ±30%; petal jitter 10–25%;
- stage 30–70 (60–100 on the wilting surface);
- clump 30–80%;
- wind ±25° around the poem's line direction.

**"Mixed" stop** [est]: 2–4 species from one habitat.
- meadow: daisy, poppy, cornflower, buttercup, clover, Queen Anne's lace, chamomile;
- woodland: bluebell, foxglove, violet, anemone;
- garden: rose, peony, lavender, foxglove;
- spring: tulip, cherry, forget-me-not;
- the Dutch still life may mix seasons, as the originals did [gen].

**Composition**
- Odd numbers and asymmetry. One hero bloom, 2–4 secondary, the rest filler [src: ikebana, Ruysch].
- Keep a calm field for the poem (Poem distance).
- Overlap the frame edges. No floating central ring, except the crown.
- Foliage is 30–50% of the floral mass; stems and leaves matter as much as blossoms [src: ikebana].
- At least one imperfection per seed: a turned petal, a browning leaf, a bud.

**Anti-clip-art**
- Outlines with flat fills only for media that justify them (stamp, linocut, kamon).
- Never identical copies.
- No emoji-style five-petal icons.
- No pillow gradients on every petal.
- No sparkles, hearts or script banners.

---

## 8b. Ruby's first look, and what changed (Saturn series)

Ruby: "most of them are good. The simple ones are really good. We could use more simple ones." Three asked
for more:

- **Macro** "needs to actually try to generate more than just the flower bulb." A macro photograph is a
  *framing*, not a flower centred on bokeh: the heart filling the page with petals running off every edge,
  a second flower nearer the lens than the focus as a soft wash across a corner, more of its kind far behind,
  pollen fallen about the stamens, the petal's own crinkle catching the light [gen]. The seed now chooses
  the framing on a continuum, from the whole flower in its setting to its heart filling the page, and the
  closer the framing the further off the middle the flower may sit (Bloom Size and the seed both bring it
  near); a Perlin crinkle goes into the Light Engine's heights; Bloom draws more points along a petal the
  larger it is, so no facets show close up.
- **Meadow** "reminds me way too much of the Windows XP Bliss wallpaper." Bliss is one smooth green hill
  under saturated blue and white cumulus [gen]. The meadow is now seen from inside it: a high horizon, a
  hedgerow or line of trees along it, hazed blue by distance; fields beyond in long bands of green and gold;
  the nearest grass tall and out of focus across the page's foot; the sky long soft streaks of high cloud and
  haze, warm toward the sun. Default hues: a pale hazy sky, a muted far land, an olive grass, a warm sun.
- **Fallen Petals** "too cartoony. Getting better." What read as a drawing: an inked rim round every petal;
  a dark fringe round every stamp (a half-covered pixel drawn half over black); flat even colour; perfectly
  symmetrical leaves; hard drop shadows with a lit halo. Now: no outline; Scatter gives a "black is clear"
  stamp its colour back where it only partly covers (its coverage kept apart); Bloom gives back the colour
  of its own half-covered edge pixels and leaves a hair of coverage clear; every petal has a few soft lighter
  and darker patches, and as it ages, brown creeping in from the tip and the edges, its edge crumpling; leaves
  have side veins, uneven edges and brown patches with age; the heights are soft inside each petal and flat
  on the ground, so they cast a shadow, not a halo.

### More simple ones

**Ditsy Print.** A "very small scale all-over pattern with a random look, not linear or geometric"; flowers
are the usual motif; mass-produced on cheap cotton for 1920s–40s day dresses, back in the 1970s; Liberty's
are the finer grade [src: Vintage Fashion Guild]. So: tiny flowers at random (never in rows), a sprig of leaf
between, flat (pressed, face on), on cloth whose weave shows. Bloom's sheet of sixteen heads, once per colour
(three flower hues; Colors says how many print), Bloom's leaves as sprigs, Canvas Weave for the cloth.

**Botanical Line.** Flower line art: "a single uninterrupted line", "simplify petals and stems, and use clean,
confident lines. Less is more", "clear outlines instead of shading or heavy color", "leave negative space";
thicker lines for focal points, thin for delicacy [src: Craftionary]. The field guide's margin drawing, and
line-and-wash. So: Bloom's whole plants from the side, a few, large; Edges of their shape for the outline and
of their colours for the inner lines (Detail); Blur and Threshold as the pen (Line); the wash their own
colour multiplied in and slipped off the line (Wash, Wash Slip); leaves and stems in a second ink (Split HSB
finds the green).

## 8c. Macro, lit with maps (Ruby: "Use them!! We built these tools so you could use them!")

The close-up was still drawn already lit. It is now made as a renderer's material (docs/prior-art/lit-maps.md): Bloom
hands on its colours unlit, how squarely each part faces the light (Facing, from each petal's true normals), heights
with each petal's cross-section and sunk veins, gloss (most petals matte from their conical cells, a buttercup's or a
tulip's wax bright: Stavenga 2020), and thickness (adding where petals overlap and along the veins). The Light Engine's
Translucency, a map, wraps the light round each petal and lets it through in the pigment's own colour as the light
sinks or shines from behind: a backlit poppy glows, its veins and its overlaps darker; a leaf glows green. Checked from
the front, the side and behind before it was shown.

## 8d. What else is in a macro photograph of a flower (Ruby: "pollen, dew, jumping spider, loose petals … shadow casters")

- **Visitors.** Macro photographers' favourite subjects are "the fluffy body of a bee" and "the comically expressive
  face of a jumping spider"; an insect's eyes are the sharpest point of the picture [src: Adorama].
  - *Jumping spider:* eight eyes, the front pair (anterior median) large, "big, beady eyes that look disproportionate";
    "a dense covering of iridescent scales or hairs"; often a red back (Johnson's red-backed) [src: NPS; A-Z Animals].
  - *Seven-spot ladybird:* "oval, convex", 6.5–7.8 mm; orange-red elytra with three black spots each and one shared
    beside the scutellum, two white patches ahead of it; a black pronotum with two pale spots; black legs [src: Wikipedia].
  - *Hoverfly:* 8–20 mm, a large head of eyes, "yellow and black bands of equal width", one pair of clear wings,
    "hovering among flowers" [src: Australian Museum].
  - *Aphids:* 2–4 mm, "pear-like or teardrop shape", often green, with cornicles "like a pair of tailpipes", on young
    buds and stems; ants tend them [src: University of Maryland Extension].
- **Dew.** A drop is a lens: "Each droplet focusses sunlight to form a tail", a bright caustic on the surface beyond it
  [src: Atmospheric Optics]; photographers light drops from "diagonally behind" for starbursts on their outlines
  [src: Canon]. So each drop: a dark rim, a highlight toward the light, a bright tail away from it.
- **Shadow casters.** The rule is to avoid "casting shadows over your subject" [src: Adorama] — which is exactly what a
  blade of grass or a leaf between the sun and the flower does in the wild: a soft shadow across the petals.

Built: Bloom's Part: Visitor draws the seed's visitor as maps (shell gloss, eye gloss, clear wings that let light
through), laid into the flower's maps before the Light Engine, so it is lit with the flower and casts its shadow on it.
A blade, a stem or leaves out of frame cast a soft shadow along the light, now and then crossing the frame near the lens.

## 8e. Through a real lens: the focal plane, the camera dial, one clear slider each (Ruby, 2026-10-19)

Ruby: "view with the camera dial with a guide, slider for aperture which should control bokeh why are there two sliders
for the same thing?; also insects should be rare … smaller? At most two insects carefully placed … Sliders appear to be
changing different things in non-deterministic ways … It should be a physically accurate focal plane … on the GPU."

Read for it:
- A post-process depth of field derives the circle of confusion from the thin lens; "there is no upper bound on the
  circle of confusion closer than the focal point", and it grows much faster in front of the focus than behind it. A
  scatter-as-gather version showed ringing at sharp edges; a near (foreground) blur must spread fully over what is
  behind its edge, D = max(D0, 2DB − D0) [src: GPU Gems 3 ch. 28].
- Call of Duty's depth of field gathers in one 2D kernel (49 taps, a circle: separable kernels did not suit
  scatter-as-you-gather), weights each sample by 1/(π c²) and normalises, splits background and foreground smoothly,
  and keeps in-focus pixels from bleeding [src: Jimenez, Next Generation Post Processing, notes].
- Macro depth of field goes as 2CNU²/f²: the closer the subject, the thinner the focus, and a wider aperture isolates
  the subject and blurs the rest [src: Stanford CS178, Assignment 3 – Macro].

Built [est]:
- **Lens Blur**, a general part (stepsLens.js): the depth map's black to white laid on a log scale of distance; each
  point's disc ∝ |1 − focus distance/distance| (the thin lens, for one focus); a gather on a golden-angle spiral, a
  neighbour counting where its own disc reaches, one behind the point capped at twice the point's own disc (so sharp
  edges stay sharp in front of blurred lights, and a blurred leaf in front spreads over them); lights brighter than
  white before the gather, so their discs stay bright; round or 5–9 blades. On the GPU (WebGL2) where there is one;
  measured against the CPU gather at the same sampling: a mean difference of 0.0001.
- **Macro Bloom remade on it**: everything painted sharp beside a depth map (the wash and lights farthest, more flowers
  behind, the flower, a flower near the lens), one Lens Blur. The camera dial frames the flower (Zoom, View, Turn, with
  a wireframe guide of its rim and heart); the sliders are Species, Stage, Aperture (the lens alone), Focus, Lights
  Behind, Dew, Translucency, Visitors, each one thing. Insects: rare at the default (about one seed in eight), at most
  two, on a petal partway out from the heart, a quarter smaller than before.

Sources (this section):
- GPU Gems 3, ch. 28, "Practical Post-Process Depth of Field": https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-28-practical-post-process-depth-field
- Notes on Jimenez, "Next Generation Post Processing in Call of Duty: Advanced Warfare": https://scrapbox.io/0b5vr/Next_Generation_Post_Processing_in_Call_of_Duty:_Advanced_Warfare
- Stanford CS178, "Assignment 3 – Macro": https://graphics.stanford.edu/courses/cs178/assignments/assn3.html

## 9. Sources consulted

- **Generative:**
  - https://algorithmicbotany.org/papers/abop/abop-ch4.pdf
  - https://thatsmaths.com/2014/06/05/sunflowers-and-fibonacci-models-of-efficiency/
  - https://www.tylerxhobbs.com/words/a-guide-to-simulating-watercolor-paint-with-generative-art (about 4% opacity over 30–100 deformed-polygon layers [src]; good for soft watercolour petals. No Hobbs florals were found.)
  - https://inconvergent.net/generative/hyphae (branching growth that avoids collisions; for Morris stems and Tendrils)
  - https://catlikecoding.com/unity/tutorials/advanced-rendering/depth-of-field/
- **Prints:**
  - https://publicdomainreview.org/collections/cyanotypes-of-british-algae-by-anna-atkins-1843/
  - https://www.cooperhewitt.org/2016/09/14/pattern-papers/
  - https://en.wikipedia.org/wiki/Mon_(emblem)
  - https://en.wikipedia.org/wiki/Strawberry_Thief
  - https://en.wikipedia.org/wiki/Millefleur
  - https://www.ragandmagpie.co.uk/blog/what-is-a-ditsy-print
  - https://ncbg.unc.edu/2022/04/05/pressing-matters-how-to-make-an-herbarium-specimen/
  - https://en.wikipedia.org/wiki/Karl_Blossfeldt
  - https://budsandtendrils.substack.com/p/how-to-keep-the-colour-in-pressed
  - https://forums.vintagefashionguild.org/threads/fabric-friday-ditzy-ditsy-print.77336 (Ditsy Print, §8b)
  - https://www.craftionary.net/?p=31207 (flower line art, Botanical Line, §8b)
- **Arrangements and vanitas:**
  - https://en.wikipedia.org/wiki/Ikebana
  - https://nmwa.org/art/collection/roses-convolvulus-poppies-and-other-flowers-urn-stone-ledge/
  - https://openlab.citytech.cuny.edu/apss15/2015/02/25/vanitas-van-huysum-ruysch-and-membreno-canales/
  - https://thecreativeadventurer.com/the-beautiful-meaning-behind-japans-many-words-for-cherry-blossoms/
  - https://smarthistory.org/millais-ophelia
- **Meadow:**
  - https://en.wikipedia.org/wiki/The_Poppy_Field_near_Argenteuil
  - https://www.metmuseum.org/art/collection/search/438004
  - https://en.wikipedia.org/wiki/Poppy_Field
  - https://animationobsessive.substack.com/p/defining-the-world-of-my-neighbor
  - https://en.wikipedia.org/wiki/Cottagecore
- **Macro:**
  - https://digital-photography-school.com/how-to-do-more-unique-flower-photography/
  - https://petapixel.com/2022/03/06/13-tips-for-photographing-tiny-spring-flowers/
  - https://www.cam.ac.uk/research/news/why-buttercups-reflect-yellow-on-chins
  - https://www.adorama.com/alc/macro-photography-for-small-wonders/ (§8d)
  - https://www.nps.gov/articles/000/jumping-spider.htm (§8d)
  - https://a-z-animals.com/articles/why-jumping-spiders-have-some-of-the-sharpest-eyes-in-nature/ (§8d)
  - https://en.wikipedia.org/wiki/Coccinella_septempunctata (§8d)
  - https://australian.museum/learn/animals/insects/hover-flies/ (§8d)
  - https://extension.umd.edu/resource/aphids-flowers/ (§8d)
  - https://atoptics.co.uk/blog/opod-breakfast-droplets/ (§8d)
  - https://snapshot.asia.canon/en/article/macro-photography-techniques-flowers-in-water-droplets (§8d)
- **Botany:**
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
  - https://www.treesandshrubsonline.org/articles/prunus/prunus-serrulata/
  - https://en.wikipedia.org/wiki/Anemone_coronaria
  - https://plants.ces.ncsu.edu/plants/digitalis-purpurea/
  - https://www.discoverwildlife.com/plant-facts/flowers/bluebells-identify-species-where-to-see
  - https://hort.extension.wisc.edu/articles/queen-annes-lace-daucus-carota/
  - https://en.wikipedia.org/wiki/Viola_(plant)
  - https://www.gardensbythebay.com.sg/en/learn-with-us/explore-resources/whats-blooming/hydrangea.html

**Not fetched,** so their facts are marked [gen]: the Wikipedia pages on Cosmos, Vanitas and Herbarium; the inconvergent index; the artprice vanitas article. The peony-forms page held no form descriptions.

**Not inspected:** Shadertoy and OpenProcessing flower sketches. Searches returned only sketch pages, so no technique is attributed to them.
