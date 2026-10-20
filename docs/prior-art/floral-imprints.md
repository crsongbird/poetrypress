# Floral Imprints: Prior Art for Vellum

**Key.** **[src]** = stated in a consulted source, linked to its URL. **[est]** = my own estimate or synthesis, not stated in any consulted source. All hex values are [est] unless marked [src]. Where a source was *not* readable, it is listed in section 0.

---

## 0. Method and gaps

- I searched for and read process notes from practitioners, museum and conservation pages, printing-trade guides, and two SIGGRAPH papers (for watercolour and for venation). Each medium section separates the physical cause of the marks from what the eye uses to recognise the medium.
- Gaps: some redirects and hosts were blocked. These include the English Wikipedia *Cyanotype* article (it redirects), archive.org book scans, and the full Yoshitoshi woodblock glossary. This session's web-search budget also ran out before I could look up a dedicated source on halos in eco-printing on paper, or the Met's essay on Islamic vegetal ornament. Claims those sources would have covered are marked [est].

---

## 1. What all imprints share (the physics that the maps must carry)

Every medium below is one of four physical acts, applied to a flower that has a **silhouette**, a **thickness** (petal layers, stem), **veins** (raised ridges, mostly on the underside), and **moisture/pigment**:

1. **Light passing a mask** (cyanotype, lumen print, anthotype, chlorophyll print). Light blocked by a solid object leaves a white silhouette, and light passing through a translucent one gives "varied blue tones" [src][ap-tips]. An object held off the paper lets light "pass around and through" and gives "soft blurry edges" [src][ap-tips].
2. **Pressure through paper onto relief** (rubbing, frottage, brass rubbing, emboss/deboss). In a rubbing the pattern "underneath the paper" comes through, and for a leaf the lines are "the veins, stem and edges" [src][oak-frottage]. The leaf is placed "vein-side up" [src][oak-frottage].
3. **Ink or dye transferred from the plant or from relief** (nature printing, inked leaf prints, gel plate, eco-print, rubber stamp, woodblock, riso). For an inked leaf, ink goes on "the veiny side" [src][wheaton]. In eco-printing, tannin in the leaf meets iron and leaves a print with "contours and veins" [src][dulman].
4. **The flower itself, dried** (pressed flowers, herbarium). The plant is the image. "Pressing and drying completely changes the color and the form of the plant" [src][hagley].

Drawn media (chalk, charcoal, graphite, watercolour) are a fifth case. Their marks come from the drawing tool meeting the paper's tooth, and an artist chooses where they go [est].

**Consequence for maps [est].** One flower, generated once, should produce at least these maps:
- **mask M**: coverage, 0–1.
- **opacity/thickness T**: sum of overlapping petal layers, so the overlaps darken.
- **vein map V**: ridge strength, plus a flag for which face is up.
- **height H**: the mask blurred and rounded, plus the vein ridges.
- **contact map C**: how flat each part pressed against the paper. Petal tips pressed flat; the centre of a daisy or rose stood off the paper.
- **moisture/juice map J**: where sap and pigment sit, usually in thick tissue and in crushed edges.

Every developer below is a function of these maps plus paper and seed.

---

## 2. Cyanotype, photogram and other sun prints

### 2.1 Process (why it looks the way it does)
- **Atkins's method.** Anna Atkins coated writing paper (Whatman Turkey Mill) with ferric ammonium citrate and potassium ferricyanide. She laid pressed algae directly on it and exposed it to sun "for five to fifteen minutes." Exposed paper turns "Prussian blue," and covered areas "remain white" [src][getty]. She likely used a printing frame of glass and wood; the Getty marks this as an inference [src][getty]. Her name plates and title pages were themselves cyanotypes, and she oiled the handwritten pages "so they were translucent and could serve as negatives" [src][getty].
- **Layout and production.** Atkins arranged specimens "root down" but curved or extended them to fit the page [src][getty]. The Rijksmuseum copy has 307 plates, and the run probably did not exceed 25 copies [src][rijks]. She issued replacement plates, so copies differ: "Some sets have more than 400 plates" [src][getty]. Every plate is a separate hand-made print, so plates vary from one another [est].
- **Coating.** The sensitiser is brushed on, and "brush strokes will appear on the developed print" [src][demigod]. Practitioners lay one direction of strokes, cross it with a second pass, then smooth the coat with a dry brush [src][demigod]. A brush gives painterly edges, a sponge a harder edge, and masking with card gives a clean border [src][ap-tips].
- **Exposure.** A test strip tells you when the print is properly exposed: it turns "a dark blue/green" and the shadows look "slightly solarised" [src][ap-tips]. During exposure the colour moves "from yellow to greenish/blue then to rusty brown tones and finally to a silvery grey" [src][alt-wet]. 10 min in bright sun is typical, and a UV lamp can take 2–3 h [src][ap-tips].
- **Washing and toning.** Wash until the water runs clear. Under-washing leaves "a yellowish or greenish stain," and over-washing strips the blue [src][demigod]. Full density arrives only after drying overnight, or at once with a dilute peroxide bath [src][ap-tips]. Toning:
  - Tannic acid (strong tea) moves the blue toward navy [src][ap-tips].
  - Coffee gives "almost black to indigo" [src][demigod].
  - Hibiscus gives "a soft pink," and onion or shallot skins give "a warm yellow-brown" [src][demigod].
  - Soda ash crisps the whites but dulls the blues, and too much leaves white specks [src][demigod].
- **Wet cyanotype.** Wet cyanotype adds pigments, spices and plastic wrap:
  - Turmeric gives rust and yellow, and yellow spray over the blue gives "a soft sage green" [src][alt-wet].
  - Soap bubbles give "cell-like patterns," and plastic wrap gives wrinkle lines [src][alt-wet].
  - The edges of the image show a silvery grey [src][alt-wet].

### 2.2 Related sun prints a seed could also choose
- **Lumen print.** A plant lies on black-and-white photo paper in daylight [src][pingwish]. Exposure sets the colour:
  - 5 min: "light blue with sharp separation."
  - 30 min: "warm purples."
  - 2 days: "a flat brown."
  The palette runs through "pinks, lilacs, browns, tans and blue-greys." A juicy plant "sweats" against the paper and can leave a halo [src][pingwish].
- **Anthotype.** A plant-juice coating bleaches where light reaches it, so the image is *positive* (the masked area keeps the colour). It cannot be fixed [src][pingwish].
- **Chlorophyll print.** The image is printed into a leaf. It gives greens, yellows, browns, ochres and oranges, and the leaf's own veins shape the image. These prints fade, and "It's part of the process" [src][chloro].

### 2.3 Recognisers [est]
1. A single Prussian-blue ground with no black in it.
2. Pure paper-white where solid tissue blocked the light: stems, seed heads, thick centres.
3. **Petals are not white.** A thin petal transmits some UV, so it reads as pale-to-mid blue, and a stack of overlapping petals steps back toward white. Veins sit darker or lighter than the petal, depending on whether they transmit more or less light than the blade.
4. Edges that lifted off the paper (a poppy's cupped petals, a rose's outer petals) are soft and fringed with mid-blue, while edges pressed flat are razor-sharp.
5. The brushed coating shows as a ragged outer edge and faint stroke banding in the blue.

### 2.4 Colours [est]
| role | hex |
|---|---|
| deep Prussian (full exposure) | `#14315F` |
| classic mid cyanotype | `#24508C` |
| pale (one petal layer) | `#7FA6CF` |
| two petal layers | `#BCD2E6` |
| paper white (warm) | `#F3F0E7` |
| overexposed shadow, bronzed/olive | `#4F5F5C` |
| silvery grey | `#8A97A0` |
| tea-toned navy | `#1E2A40` |
| coffee-toned near-black | `#2A2930` |
| hibiscus pink tone | `#D9A9B6` |
| onion yellow-brown | `#B88A58` |
| under-washed yellow stain | `#E6DC9A` |

### 2.5 Failure marks a seed can add
- Brush banding and dry-brush skips [src][demigod].
- Yellow-green stain from under-washing [src][demigod].
- White specks from soda ash [src][demigod].
- Bronzed, solarised shadows from overexposure [src][ap-tips][alt-wet].
- A plant that shifted during exposure leaves a double edge [est].
- Water spots, and a print left in a puddle that "washed off entirely" (local loss of blue) [src][demigod].
- Paper cockle: the sheet curls and wrinkles after washing [src][ap-tips].

### 2.6 Photographic vs illustrative [est]
An illustrative version uses a white silhouette with a flat blue ground. A photographic version needs three things:
- Graded transmission through petals, with layer stacking.
- Contact-dependent edge softness.
- Coating texture in the blue: brush strokes, paper fibre, slight mottling.

The blue must never be a single flat value.

### 2.7 Maps and developer [est]
`exposure E = sun · coat(x) · (1 − M · (1 − τ)^T)`, where τ is petal transmission and T is the layer count. The term `blur(M, r = k·(1 − C))` sets edge softness. Then:
- Density `D = 1 − exp(−γE)`.
- Colour = paper mixed toward Prussian blue by D.
- Above a threshold D′, mix toward bronze grey for overexposure.
- Toner and stains run as a final curve.

`coat(x)` is the brush-stroke field: anisotropic noise along the stroke direction, multiplied by a ragged edge mask. Atkins-style plates put a cyanotype label strip at the bottom and lay the specimen root down [src][getty].

---

## 3. White chalk and pastel on dark paper; rubbings

### 3.1 Process
- **Drawing light, not shadow.** Dark paper "already gives you the darkest value," so the artist adds light and lets edges "disappear completely into the paper." Covering too much makes a drawing look "chalky" [src][wilson]. Light pressure comes first, and the brights are built "over several passes" [src][wilson].
- **Tooth.** "A paper with more tooth catches more pigment and can create a grainier appearance" [src][wilson].
- **Smudging.** Pastels are "easier to smudge" [src][wilson].
- **Historic coloured grounds.** Old-master drawings used black chalk with white heightening on blue paper. That blue paper fades: one Raphael-circle study is catalogued as "white heightening on faded blue paper that is now grey" [src][cooper].
- **Outline placement.** For light forms on dark grounds, Crane advises placing "one's outline outside the silhouette boundary of the form rather than within it" [src][crane].
- **Rubbings.**
  - Frottage is paper laid over a relief and rubbed with crayon or pencil; Max Ernst's *Histoire naturelle* used leaves among other surfaces [src][moma].
  - A brass rubbing "reproduce[s] the form" of the object, while frottage captures texture [src][brass].
  - Traditional brass rubbings are black heelball on white paper. Modern ones use gold, silver or bronze crayon on "black velvety material" [src][brass].

### 3.2 Recognisers [est]
- **Chalk.** Pigment sits only on the *peaks* of the paper's tooth, so whites break up into a grain that matches the paper texture. Strokes are directional hatching, light at the start of a stroke and heavier where it lands. Smudged areas lose the grain and spread into soft clouds.
- **Rubbing.** Only the *raised* relief prints. The crayon's flat side makes parallel streaks across the whole area, the veins come up as bright lines, and the outline goes soft wherever the leaf thins. Paper texture shows everywhere the crayon touched, even off the leaf.

### 3.3 Colours [est]
| role | hex |
|---|---|
| black drawing paper | `#1C1B1D` |
| dark blue-grey paper | `#2E3742` |
| historic blue paper | `#4E6A86` |
| faded blue paper, now grey | `#8C9497` |
| chalk white | `#F2F0EA` |
| warm chalk | `#EDE3CF` |
| sanguine chalk | `#A4492E` |
| pastel tints | `#E9B8C0`, `#C9D8B5`, `#B9C7E2` |
| heelball black | `#141414` |
| gold crayon | `#C7A24C` |
| silver crayon | `#BFC3C7` |

### 3.4 Failure marks and variety
- **Failure marks [est]:** chalk dust smeared by a resting hand [src][wilson]; fixative spots; a broken edge where the stick skipped across a fibre; ghost lines left by erasure.
- **Seed variety [est]:**
  - white chalk on black, toned or historic blue grounds;
  - three-crayon (black + sanguine + white) on buff;
  - soft pastel colour on black;
  - crayon leaf rubbing (several overlapping crayon colours, light first [src][oak-frottage]);
  - brass-style metallic rubbing on black.

### 3.5 Maps and developer [est]
- **Chalk.** `deposit = smoothstep(threshold(pressure), 1, paperHeight)`. Pressure comes from a hatching field built on `M`, plus shading from the flower's normal map (the botanical light convention puts the light at the top-left [src][harper]). A smudge pass blurs the deposit and lowers its dependence on tooth.
- **Rubbing.** `deposit = smoothstep(a, b, H_flower + paperHeight·k)`, laid down along a streak field at one angle. Use `V` with vein side up and `H` from the blurred mask. Deposit appears wherever the relief and the tooth meet the crayon, including a faint field outside the leaf.

---

## 4. Charcoal and graphite botanical drawing

### 4.1 Process
- Compressed charcoal gives the deepest blacks and is hard to erase. Vine charcoal is lighter and lifts easily. Charcoal is "matte in finish" and needs paper with tooth [src][fat].
- Graphite is "more reflective, grey and almost metallic." It gives "harder edges," works on smoother paper, and needs no fixative [src][fat].
- Botanical practice [src][harper]:
  - H/2H leads for the drawing, and HB/B for the darks.
  - Light from the top left.
  - Veins drawn in order: largest laterals first, then branches and capillaries.
  - The hand rests on clean paper to avoid smudging, and the artist does not finger-smudge, because the shadow shapes are part of the observation.

### 4.2 Recognisers [est]
- **Graphite.** Grey, never black, with a metallic sheen at a glancing angle. That sheen suits Vellum's specular channel. Tone comes from directional hatching or smooth gradation, and fine veins are crisp. A thin outline usually follows the petal edge.
- **Charcoal.** A velvety matte black with visible tooth in the mid-tones. Smudged passages go soft, edges are lifted with an eraser, and the highlights have dusty halos.

### 4.3 Colours [est]
| role | hex |
|---|---|
| cartridge paper | `#F4F1E8` |
| graphite 2H | `#9A9C9F` |
| graphite HB | `#6B6D71` |
| graphite 6B, burnished | `#3F4144` |
| graphite specular tint | `#C9CDD3` |
| vine charcoal | `#4A4746` |
| compressed charcoal | `#18181A` |
| smudge haze | `#8E8A86` |

### 4.4 Failure marks and variety
- **Failure marks [est]:** a smeared heel-of-hand print [src][harper]; indented "ghost" lines from a hard pencil, which later shading shows as white lines; eraser crumbs and a bright eraser streak; graphite shine on dark patches.
- **Seed variety [est]:**
  - plate-style botanical study, with a single stem, dissected parts in a row, and a pencil label;
  - loose sketchbook study;
  - charcoal floral with heavy smudge;
  - a "tracing" left on watercolour paper. Many professionals trace finished drawings onto watercolour paper [src][harper].

### 4.5 Maps and developer [est]
- Tone comes from the flower's normal and `T`, lit from the top-left.
- Hatching follows the petal's principal direction: the base-to-tip vector of each petal.
- Graphite writes a specular map in proportion to tone squared.
- Charcoal sets specular to 0 and lets grain from paperHeight show at mid-tones.

---

## 5. Pressed flowers and herbarium sheets

### 5.1 Process and colour change
- **What holds colour.** Yellow, white, orange and pale flowers generally hold their colour, while "dark red, violet, and purple flowers fade or change to gray or brown." Most foliage discolours, but silver foliage holds its colour [src][nybg]. The cause is microbes breaking down tissue, which is why fast drying helps [src][nybg]. Deep larkspur and cosmos are "colour retentive," and blue lobelia "seldom fade[s]" [src][buds].
- **Damage.** Moisture turns pressings "black and mouldy," and sun fades them [src][buds]. The RHS warns that "There will inevitably be colour loss or change," and cultivars can revert to the species colour [src][rhs].
- **Herbarium layout [src][rhs]:**
  - Card 267 × 419 mm, acid-free, 175–200 gsm.
  - Label at the bottom right. It gives the Latin name in bold italic, the author in plain type, the family below it on the right in italic, then date and collector.
  - A fragment packet, usually at the bottom left.
  - At least one leaf and one flower shown underside up.
  - Long stems folded to fit.
  - Dissected flower parts "in a row above the label."
  - Glued with PVA dabs and strapped with "strips of moistened gummed linen tape."
- **Older specimens.** Old mounts used "thin strips of brown paper tapes." A specimen that shifted leaves "light brown staining on the mount" in its old position [src][hagley].

### 5.2 Recognisers [est]
- Petals are **semi-transparent**, and the paper shows through where petals overlap less. Overlapping petals darken.
- Colour is uneven. Petal edges brown first, and veins darken or show as paler lines.
- The flower is flattened, not drawn: rose petals fold, poppy petals crease, and stamens smear into a dark disc.
- The plant casts a very slight shadow, and tape straps glint.
- A faint brown "ghost" stain sits near the specimen.

### 5.3 Colours after drying [est]
| fresh → dried | hex |
|---|---|
| yellow | `#E9C64A` → `#D7B347` |
| orange | `#E07A2E` → `#C9732F` |
| red (rose/poppy) | `#B3202C` → `#7A2F2A`, edges `#5A2B22` |
| violet/purple | `#6A3D8F` → `#6E5A6B`, toward grey-brown |
| lavender | `#8E7CC3` → `#9A8FB0`; lavender holds its colour fairly well |
| blue (lobelia/cornflower) | `#3D5BB0` → `#4C5FA8`, holds |
| white | `#F7F5EE` → cream `#EEE3C6` with brown bruises `#B89A6A` |
| green leaf | `#4E7A34` → olive `#6F7444` → brown `#8B7A4F` |
| silver foliage (holds) | `#A7B0A2` |
| ghost stain | `#D9C8A2` at 20–40 % |
| brown paper tape | `#A8885E` |
| gummed linen tape | `#E9E1CF` |
| herbarium card | `#F1EDE2` |

### 5.4 Failure marks and variety
- **Failure marks:** mould spots (black specks) [src][buds]; brown edge rot; a torn petal; a lost stem with a tape strap left holding nothing [src][hagley]; ghost stain from a shifted specimen [src][hagley]; yellowed, brittle tape adhesive [src][hagley].
- **Seed variety [est]:**
  - a single herbarium sheet with a label;
  - pressed-flower stationery: a few heads scattered at a corner, petals arranged as a wreath, or a single stem under tissue;
  - book-pressed: one flower with a stain on the opposite page;
  - resin or glass-framed: no tape, a slight gloss.

### 5.5 Maps and developer [est]
- **Albedo** is the species colour run through the dry-shift table above. Brown it by `edgeDistance⁻¹` and by a noise map.
- **Transmission** is `exp(−σT)`. Final colour is `paper·(1−M) + M·mix(petalColour, paper·petalColour, transmission)`, which is the transmitted light picking up paper colour.
- **Specular** is low on petals and moderate on tape.
- **Height** is a tiny raise, and the shadow comes from `H`.
- Add tape straps as rectangles that cross the stem at 2–5 points, rotated slightly. Add the label block bottom right and the packet bottom left [src][rhs].

---

## 6. Letterpress, blind emboss and deboss, foil

### 6.1 Process
- **Blind embossing and debossing.** These shape paper by pressure with no ink, so the design shows only through "light, shadow, and texture." Heavier, cotton-rich stocks give the best depth [src][bw]. Pressure "flattens the texture" inside the image area, which contrasts with the textured paper around it [src][bw]. Lines need space between them, and on light stock a deep emboss bows the sheet [src][bw].
- **Profiles and depth.** Edge profiles can be flat, bevelled, V-shaped or rounded; a rounded, multi-level die is called "sculptured" [src][billerud]. Depth runs from ".004 inch to a dramatic .025 inch" [src][billerud]. Dies are brass, copper or magnesium, in falling order of cost and run length [src][billerud].
- **Letterpress impression.** Early book printers aimed at a "kiss impression." A common rule of thumb is that "Text smaller than about 18pt should not be deeply impressed" [src][briar]. Faults are "ink squeeze," distortion and "lumpy backs," and the back of the sheet should not show the embossing if it will be seen [src][briar]. Japanese woodblock *karazuri* presses damp paper into a carved block without ink, for flora and feathers [src][famsf].
- **Hot foil [src][zazzle][aura]:**
  - A heated plate *debosses* and bonds the foil.
  - Minimum line 0.5 pt (≈0.18 mm), minimum gap ≈0.5 pt, screens below 20 LPI.
  - Large solids and gradients are rejected.
  - Fine detail "may merge."
  - Foil edges soften on textured stock.
  - Register with the print drifts up to about 1 mm.

### 6.2 Recognisers [est]
- **Emboss.** A highlight on the side facing the light and a shadow on the far side. The face of the relief is smoother than the paper around it. A rounded or sculpted die gives graded shading across petals, and a bevel gives a crisp facet line.
- **Deboss and letterpress.** The reverse: a shadow on the near wall and a highlight inside the far wall. Inked letterpress shows a darker rim where ink squeezes to the edge.
- **Foil.** Mirror-bright facets where the surface faces the viewer, near-black where it faces away, sitting slightly sunk below the paper. Any break in the foil exposes paper.

### 6.3 Colours [est]
| role | hex |
|---|---|
| cotton paper | `#F7F5EF` |
| cream stock | `#F1E9D6` |
| emboss highlight | paper + `#FFFFFF` at 35 % |
| emboss shadow | paper × `#B8B2A6` |
| gold foil base | `#C9A54C` |
| gold foil highlight | `#F5E4A3` |
| gold foil shadow | `#6E5320` |
| rose gold | `#C99280` |
| silver | `#C8CCD2` (shadow `#5D636B`) |
| copper | `#B8734A` |
| letterpress inks | navy `#23324F`, blush `#E3B5AE`, sage `#93A58A` |

### 6.4 Failure marks and variety
- **Failure marks:**
  - foil fill-in, where narrow gaps bridge [src][aura];
  - patchy metallic coverage [src][aura];
  - soft foil edges on textured stock [src][aura];
  - foil drifted from the print by up to 1 mm [src][aura];
  - letterpress ink squeeze [src][briar];
  - an emboss that bows a light sheet [src][bw];
  - pinholes in foil [est];
  - cracked paper at the steepest edge of a deep emboss [est].
- **Seed variety [est]:**
  - blind emboss, single level;
  - blind emboss, sculpted;
  - blind deboss;
  - letterpress in one ink plus deboss;
  - foil only (gold, silver, rose, copper, white pearl);
  - foil plus blind emboss, with the foil on the flowers and the emboss on the leaves.

### 6.5 Maps and developer [est]
- **Height:**
  - single level: `H = depth · sign · smoothstep(0, bevel, distanceInside(M))`;
  - sculpted: add the petal-dome profile and `V` ridges.
- **Detail limits.** Before deriving the height, erode the mask, and drop strokes thinner than the 0.5 pt foil minimum (scaled to the page) [src][zazzle].
- **Albedo** is unchanged for blind work. Inside the relief, flatten the paper texture by lowering paperHeight's contribution [src][bw].
- **Foil.** Albedo is the metal colour, specular is high with low roughness, and the normal comes from `H`. Add noise for flecks of missing foil. Offset the foil layer up to 1 mm from any ink layer [src][aura].

---

## 7. Botanical ink prints: nature printing, leaf prints, gel plate, eco-print

### 7.1 Process
- **Victorian nature printing.** Ferns were pressed into soft lead, the lead was electroplated into a printing plate, and the plate was coloured and printed in two colours. Ferns suited the method because their fronds are largely two-dimensional [src][ferns]. Auer made his lead impression between steel and lead, then electrotyped it [src][sanders]. The result is a "highly detailed and realistic depiction" [src][ferns]. These prints are themselves intaglio-like, so the paper should carry a slight emboss of the veins [est].
- **Inked leaf print.** Ink goes on the veiny side with a brayer. The leaf is laid ink-down, rubbed through a paper towel, and peeled away. Layering colours mixes them (red then yellow gives orange) [src][wheaton].
- **Gel plate.** Keep the paint thin, "because then you will lose the details" [src][gelli]. The plate offers three pulls [src][gelli]:
  - single: leaves mask the plate, so the print is a negative silhouette;
  - double: positive and negative pulled onto one sheet;
  - "ghost" print: from dried paint plus a thin new layer.
- **Eco-print chemistry.** Tannin plus iron prints "will always be grey or black" [src][dulman]:
  - gallic tannins (oak gall, sumac) give grey/purple;
  - ellagic tannins (pomegranate, myrobalan) give yellow;
  - catechic tannins (black tea, walnut, eucalyptus bark) give red-brown.
  Sumac prints "crisp, precise and clear" [src][dulman].
- **Eco-print effects.**
  - An iron blanket gives a "defined outline around the Eco print leaf shapes," with "less dark outline" when iron water is used instead [src][barb]. This outline is the halo.
  - Red maple prints blue or purple, Weigela golden, and Cotinus purple [src][barb].
  - Eucalyptus prints from both sides at once, giving mirror images [src][barb][euc]; round eucalyptus leaves print "quite red" [src][euc].
  - Soaking leaves reduces the halo effect. Soaked cloth with dry leaves gives "a watercolor-like image," and leaves print best vein side down [src][kaliko].
- **Eco-print on paper.** Bundles are simmered 1–1.5 h or steamed for 2 h or more, and cardstock gives clear outlines [src][fiber].

### 7.2 Recognisers [est]
- **Nature print.** Extreme vein fidelity, ink sitting on the ridges of the leaf, and a subtle relief.
- **Ink leaf print.** Ink is heavy on veins and margins and thin in the blade, broken by the leaf's own texture. Brayer edges show where ink spilled past the leaf, and a slight drag appears at the peel edge.
- **Gel print.** A silhouette in a flat, slightly mottled acrylic field, a brayer line across the sheet, and the ghost print's softened double edge.
- **Eco-print.** Colour lies in the *leaf's tissue*: the blade is a soft fill, veins are pale or dark lines, and a dark iron halo surrounds the leaf. Mirror twins appear where a leaf printed through to both sheets. The background is a mottled stain from iron or tannin, and the fold lines of the bundle form a grid.

### 7.3 Colours [est]
| print | hex |
|---|---|
| iron–tannin grey-black | `#3E3D3A` |
| sumac/oak purplish grey | `#5D5262` |
| eucalyptus orange | `#C8652C` |
| eucalyptus red | `#A1402B` |
| maple blue-purple | `#5E5578` |
| Weigela gold | `#C7A341` |
| rose leaf green-grey | `#7A8064` |
| iron-blanket background | `#B7AE95` |
| rust | `#9A5A34` |
| paper | `#EFE7D6` |
| nature-print ink pair | fern green `#3F5B3A` + brown `#6B4E34` |
| relief ink | black `#1F1E1C`, oxblood `#6D2427` |

### 7.4 Failure marks and variety
- **Failure marks:** detail lost in over-thick paint [src][gelli]; a "watercolor-like" bleed from wet cloth [src][kaliko]; leaves that will not print when dry-on-dry [src][kaliko]; dulling from too much iron [src][euc]; mould spots [est]; bundle-string lines [est].
- **Seed variety [est]:**
  - fern nature print, Bradbury style, in two colours;
  - single inked leaf;
  - overlapping layered leaf prints in two to three colours;
  - gel-plate negative silhouettes;
  - eco-print bundle sheet: several leaves with halos, mirrored pairs and fold grid.

### 7.5 Maps and developer [est]
- **Ink leaf print.** `ink = rollerCoverage(H_leaf) · (0.4 + 0.6·V)`. Thresholding a broken noise by `C` gives the coverage. Spread ink beyond the mask by a few pixels on one side for brayer spill.
- **Eco-print:**
  - leaf fill = species colour mixed by `J`, the tannin/juice map;
  - halo = ring of `blur(M) − M` × ironStrength, in grey-black;
  - mirror twin = flipped copy at the fold;
  - background = low-frequency iron stain plus fold grid.

---

## 8. Relief and stencil prints: rubber stamp, woodblock, risograph

### 8.1 Process
- **Rubber stamp faults.** Stamp failures fall into four groups [src][dharma]:
  - uneven ink or rocking pressure gives an uneven image;
  - too much ink gives blur;
  - uneven pressure or debris leaves missing parts;
  - dried residue gives patchy, spotty coverage.
- **Woodblock effects.** Japanese woodblock prints use a set of named effects [src][famsf][fitz]:
  - *bokashi*: gradation, from a sloped block or wiped inking;
  - *karazuri*: embossing with no ink;
  - *nunomezuri*: a cloth texture pressed into the paper;
  - *itame mokuhan*: printing wood grain from a soaked, grainy block;
  - *kirazuri*: mica;
  - spattered *gofun* white;
  - *tsuyazumi*: burnished gloss black.
- **Risograph.**
  - A master stencil is burned for each colour, and soy ink is forced through it from a drum [src][saic].
  - The ink is translucent and "will never quite dry," so heavy coverage smudges and leaves roller marks [src][saic].
  - "Misregistration WILL happen." Solids at 90–100 % look visibly uneven, so 70–85 % is recommended [src][saic].
  - Metallic gold always appears to sit on top [src][saic].

### 8.2 Recognisers [est]
- **Rubber stamp.** Ink is darker at the edges, where pressure spreads it, and speckled in large solids. Bits go missing where the stamp lost contact. The impression is slightly rotated, and repeated impressions vary in density.
- **Woodblock.** The grain shows as fine parallel striations in solids. A wavy, slightly rounded edge comes from carving, with nicks. Where pigment was rubbed by hand with a baren, it shows a mottled grain. Colour blocks drift a little from the key line.
- **Riso.** Translucent overprints make a third colour. The halftone or grain dither is visible, colour plates sit out of register, flat colour is a touch uneven, and the colours are bright, vivid and flat.

### 8.3 Colours
- **Riso inks [src][saic]:**

| ink | hex |
|---|---|
| Burgundy | `#914E72` |
| Fluorescent Pink | `#FF48B0` |
| Bright Red | `#F15060` |
| Flo-Orange | `#FF7477` |
| Sunflower | `#FFB511` |
| Yellow | `#FFE800` |
| Lime Green | `#D4E356` |
| Green | `#00A75C` |
| Cornflower | `#62A8E5` |
| Blue | `#0075BF` |
| Light Teal | `#009DA5` |
| Purple | `#5D5580` |
| Metallic Gold | `#AC936E` |
| Mint | `#82D8D5` |

- **Stamp inks [est]:** black `#1E1C1D`, sepia `#6B4A33`, oxblood `#6E2229`, navy `#26365A`, sage `#7E9278`, embossing-powder gold `#CFAE58`.
- **Woodblock [est]:** sumi `#232221`, indigo `#2C3E66`, beni `#C23A4B`, sap green `#5E7A3A`, ground on washi `#F0E8D8`.

### 8.4 Variety [est]
- **Rubber stamp:** a single stamp; a repeated sprig as powdering; a stamp heat-embossed with gold powder (raised and glossy).
- **Woodblock:** key-line-only black; three-block colour with bokashi; white-line karazuri.
- **Riso:** one, two or three colours, with a seed-chosen offset of 0.3–1.5 mm per plate.

### 8.5 Maps and developer [est]
- **Stamp:** `ink = M_eroded · contact(noise, pressureTilt) + edgeRim(M)·0.25`. Run a random affine jitter per impression.
- **Woodblock:**
  - `M` passes through a "carve" filter: smooth the curvature, then add nicks;
  - multiply ink by grain stripes (an anisotropic noise along the block's direction);
  - per-block offset;
  - bokashi as a linear ramp;
  - karazuri goes to height only.
- **Riso:**
  - posterise each layer to a stochastic grain, from a blue-noise threshold;
  - multiply-blend the translucent layers;
  - per-layer offset;
  - coverage capped at about 85 % [src][saic].

---

## 9. Watercolour florals and lace

### 9.1 Watercolour (process from the SIGGRAPH model [src][curtis])
The SIGGRAPH watercolour model names each effect with its cause [src][curtis]:
- **Edge darkening:** "the pigment migrates from the interior of the painted region towards its edges."
- **Backruns:** branching dark-edged shapes, where water flows into a drying wash.
- **Granulation:** pigment settling into the hollows of rough paper.
- **Pigment separation:** dense pigments settle first.
- **Wet-in-wet flow:** soft feathery shapes.
- **Dry-brush:** only the paper's peaks are wetted.
- **Glazing:** layers combine optically, modelled with Kubelka–Munk absorption/scattering per pigment.

The paper is modelled as a procedural height field that also sets its fluid capacity [src][curtis].

**Recognisers [est].** Petals read as transparent washes with hard dark rims (edge darkening). A wet-in-wet bloom runs where petal meets centre, grain sits in blues and earths, white paper is left for highlights, and veins are often lifted or drawn wet-into-wet.

**Colours [est]:**

| pigment | hex |
|---|---|
| quinacridone rose | `#D2457A` |
| permanent rose wash | `#F0B8C8` |
| ultramarine (granulating) | `#3F57A8` |
| sap green | `#5F7F2E` |
| raw sienna | `#C38A3E` |
| Payne's grey | `#3F4A57` |
| paper | `#FBF8F1` |

**Variety [est]:**
- loose wedding-stationery florals: wreaths and corner sprays;
- botanical-plate watercolour, tight and over graphite;
- single-wash silhouette.

**Developer [est].** The Curtis model is too heavy for a phone, so fake it:
- `wash = M · density`, with density mixed toward the rim by `edgeDarken = 1 − smoothstep(0, w, distInside(M))`;
- granulation = density × paperHeight inverted;
- a backrun ring where the seed puts one;
- multiply-blend glazes.

### 9.2 Lace
- Lace on stationery appears as laser-cut lace, or as lace patterns "printed or stamped… in contrast colors" [src][dp].
- Wet-cyanotype makers use lace and cheesecloth as masks [src][alt-wet].
- Japanese *nunomezuri* presses real cloth into the paper [src][famsf].

**Recognisers [est].** A mesh ground of hexagonal net carrying floral motifs (cordonnet outlines), scalloped edges, and threads that read as round in an emboss or soft in a cyanotype.

**Model [est].** Lace is a *mask generator*, not a medium. Build a hex-net mask with floral motifs placed by the flower generator and outlined with a stroke. Every developer above can then use it: lace cyanotype, lace deboss, lace stamp.

---

## 10. Composition conventions

- **Atkins plate.** One specimen, root down, curved to fit the sheet, with a label strip [src][getty].
- **Herbarium sheet.** Natural habit, one leaf and one flower underside up, long stems folded, dissected parts in a row above the label, label bottom right, packet bottom left, pieces evenly spaced [src][rhs].
- **Botanical plate.** A single stem, light from the top-left [src][harper].
- **Corner spray.** Crane balances a principal mass "near the top left-hand corner" with a second mass near the bottom right [src][crane]. This works for a two-corner stationery layout: a big spray top-left and a small echo bottom-right.
- **Powdering.** Morris lists "powdering" (scattered small motifs) as a supplementary pattern form [src][morris-hints]. It works for scattered stamp sprigs and pressed petals.
- **Wreath and border.** These belong with the border system in the companion document, where the path follower places the flowers [est].
- **Two-page unit.** For letters and books, Morris treats the "two pages making an opening" as the unit [src][ideal]. A spray on a letter sheet can echo across a fold [est].
- **Density rule.** Crane warns that covering too much makes chalk on black look "chalky," so leave the ground showing [src][wilson]. For any imprint, keep coverage under about 35 % of the page so the text stays readable [est].

---

## 11. Recommendations for Vellum

These are built as Athanor-style components, so the same flower feeds every medium [est]. The house rules apply throughout:
- a chain of general parts, with at most one new process part;
- every colour comes from a hue input, so the hex tables above are *default hue presets*, not constants;
- everything is lit by the Light Engine from albedo/height/specular maps, never painted already lit.

This changes two recipes above. Chalk and graphite "tone from the top-left light" should read the Light Engine's light direction. Emboss and foil shading is computed from `H`, never baked in.

### 11.0 What Vellum can do that others don't [est]
Stationery mock-up tools and stock "cyanotype flower" overlays are flat raster images.

Vellum's imprint is generated from the *same specimen maps* that already draw its 23 species. That gives it three things:
- One rose can become a cyanotype, a blind deboss, an eco-print or a pressed flower, and stay consistent across a poem series.
- The imprint is relit live by the light dial. Only Vellum can do this, because emboss, foil and graphite sheen are material properties here, not pictures.
- Pigment can follow the page's own paper tooth, which a pasted overlay can't do.

### 11.1 Specimen maker (silhouette, vein and height maps)
**Input:** species, seed, pose (face-on, profile, three-quarter, *pressed-flat* with folded petals), and stem habit (single, branched, folded).

**Output:** a bundle of single-channel maps at imprint resolution:
- `M` mask;
- `T` layer count, from overlapping petals: each petal's mask is added, not unioned;
- `V` veins;
- `H` height;
- `C` contact;
- `J` juice;
- `N` normal, derived from `H`;
- `ID`: part type (petal, sepal, stem, leaf, centre).

**Veins.** Grow them inside each petal or leaf polygon with the open space-colonisation venation model. Sources are dart-thrown at birth distance `bs`, each node grows a step `D` toward the normalised sum of its sources, and sources die at kill distance `dk`. Widths follow `r_parent^n = r_1^n + r_2^n`, with n ≈ 2–3 [src][venation]. Closed (looping) venation suits leaves, and open venation suits petals [src][venation]. For speed on the low-end phone, precompute about 3 venation templates per species shape and warp them per seed [est].

**Height and contact.**
- `H = dome(distInside(M)) + 0.3·V + 0.2·T`.
- `C = 1 − normalise(H_original_3D)`. Petals that lie flat get C ≈ 1, and centres and cups get low C.

**Pressed pose.** Fold and overlap the petals, smear stamens into a disc, and apply drying shrink and curl at the edges [est].

### 11.2 Medium developers
Each developer is a pure function `(maps, paper{albedo,height,colour}, seed) → {albedo, alpha, height, specular, roughness}`, plus a default blend mode. Each one exposes about 4 user controls: exposure or pressure, edge softness, colour variant, and failure amount.

| developer | uses | default blend | key controls |
|---|---|---|---|
| Cyanotype / lumen / anthotype | M, T, C, V | replace (it *is* the page) or multiply | exposure, transmission τ, coat-brush strokes, toner |
| Chalk / pastel | N, T, paperHeight | screen / lighten on dark | pressure, hatch angle, smudge |
| Rubbing | H, V, paperHeight | multiply (dark crayon) or screen (metallic) | crayon angle, pressure, colour |
| Graphite / charcoal | N, V, paperHeight | multiply; graphite writes specular | grade, smudge, line weight |
| Pressed flower | M, T, J, ID | normal (opaque-ish) + multiply stain | dryness/age, species colour shift, tape |
| Emboss / deboss / foil | M, H, V | height-only (blind) or metal material | depth, profile (flat/bevel/sculpted), foil metal |
| Ink leaf / nature print | M, V, H, C | multiply | ink load, roller spill, colours |
| Eco-print | M, J, V | multiply | tannin type, iron halo, mirror twin |
| Stamp / woodblock / riso | M (eroded), H | multiply | coverage, grain, misregister |
| Watercolour | M, T, paperHeight | multiply | wetness, edge darkening, granulation |

All of them share a few rules [est]:
- **Paper interaction is mandatory.** Every developer reads `paperHeight`, so pigment follows the page's existing tooth. This one rule moves a result from illustrative to photographic.
- **Failure marks** come from one shared "accident" node: stains, specks, missing patches, offsets. Each developer weights it with its own sourced failure list.
- **Physical limits** are enforced inside the developer, so the result stays believable:
  - foil: 0.5 pt line minimum [src][zazzle];
  - riso: about 85 % coverage cap [src][saic];
  - deep deboss: no deep impression on details smaller than an 18 pt stroke [src][briar].

### 11.3 Seeds and variety
A seed should pick:
1. medium family and sub-variant (the lists in each section);
2. species, 1–3 of them;
3. composition, following section 10;
4. palette, from that medium's colour table;
5. failure severity, mostly low.

Two seeds of the same medium should differ in flower placement and accidents, not in how the medium works [est]. Keep the medium's identity fixed and let the seed vary its accidents.

### 11.4 Performance [est]
- Render the specimen maps once per seed at about 1024 px on the long side, and cache them.
- Developers run as one shader pass each, or a few canvas passes.
- Venation is the costly step, so use templates.
- The full SIGGRAPH watercolour simulation is not practical on a phone, so use the distance-field approximation.

---

[getty]: https://museum-essays.getty.edu/photographs/atkins-british-algae/
[rijks]: https://www.rijksmuseum.nl/en/collection/RP-F-2016-133
[ap-tips]: https://amateurphotographer.com/technique/make-cyanotypes-top-tips/
[demigod]: https://demigodette.substack.com/p/002-things-ive-learned-with-cyanotypes
[alt-wet]: https://www.alternativephotography.com/wet-cyanotype-colours/
[pingwish]: https://pingwish.com/discover/anthotype-and-lumen-prints-without-chemicals
[chloro]: https://www.alternativephotography.com/chlorophyll-prints/
[wilson]: https://chriswilsonstudio.com/how-to-draw-on-black-paper/
[cooper]: https://www-4.collection.cooperhewitt.org/media/890290193
[crane]: https://www.gutenberg.org/cache/epub/25290/pg25290-images.html
[moma]: https://www.moma.org/collection/works/94250
[oak-frottage]: https://www.thenational.academy/teachers/lessons/make-frottage-leaf-studies
[brass]: https://en.wikipedia.org/wiki/Brass_rubbing
[fat]: https://finearttutorials.com/?p=10257
[harper]: https://lizzieharper.co.uk/?p=3070
[nybg]: https://www.nybg.org/blogs/plant-talk/wp-json/wp/v2/posts/6092
[buds]: https://budsandtendrils.substack.com/p/how-to-keep-the-colour-in-pressed
[rhs]: https://www.plantheritage.org.uk/media/1894/rhs-guide-to-making-herbarium-specimens.pdf
[hagley]: https://www.hagley.org/librarynews/conservation-peter-lindtner-herbarium-plants-hagley-yard
[bw]: https://barnardandwestwood.com/blind-embossing-debossing/
[billerud]: https://www.billerud.com/globalassets/billerud/insights/technique-ly-speaking/billerud_print-techniques_embossing.pdf
[briar]: https://briarpress.org/13607
[zazzle]: https://www.zazzle.com.au/hc/article/designing_hot_stamped_foil_some_concepts_and_guidance-26319554002711
[aura]: https://aura-print.com/usa/foil-printing-problems
[famsf]: https://www.famsf.org/learn-engage/read-watch-listen/special-effects-japanese-prints
[fitz]: https://yoshitoshi.fitzmuseum.cam.ac.uk/techniques/
[ferns]: https://en.wikipedia.org/wiki/The_Ferns_of_Great_Britain_and_Ireland
[sanders]: https://www.sandersofoxford.com/shop/product/a-polystichum-angulare-b-pangulare-hastulatum-c-pangulare-irregulare-d-pangulare-bisseratum-e-pangulare-imbricatum-soft-field-fern-plate-xii/
[wheaton]: https://www.wheatonarts.org/leaf-prints/
[gelli]: https://gelliartsblog.com/2017/11/17/gelli-arts-printing-with-leaves-3-ways/amp
[dulman]: https://iritdulman.com/?p=28983
[barb]: https://www.madebybarb.com/2024/11/01/natures-palette-a-guide-to-the-best-leaves-for-eco-printing/
[euc]: https://www.madebybarb.com/2021/01/22/oh-eucalyptus/
[kaliko]: https://kaliko.co/blog/eco-printing-with-leaves.html
[fiber]: https://www.fiberartsy.com/?p=22845
[dharma]: https://www.dharmatrading.com/blogs/a/troubleshooting-stamping
[saic]: https://sites.saic.edu/servicebureau/wp-content/uploads/sites/20/2025/03/EverythingRiso_2024.pdf
[curtis]: https://www.cs.princeton.edu/courses/archive/fall00/cs597b/papers/curtis97.pdf
[dp]: https://www.designandpaper.com/inspiration-paper-lace-trend/
[venation]: https://www.algorithmicbotany.org/papers/venation.sig2005.pdf
[morris-hints]: https://www.marxists.org/archive/morris/works/1881/hints.htm
[ideal]: https://www.marxists.org/archive/morris/works/1893/ideal.htm
