# Botanical Specimens: Prior Art for Floral Imprints

How to draw whole plants of 23 species so they read as a professional plate, a pressed herbarium sheet or a cyanotype,
not clip-art. Companion to docs/prior-art/floral-imprints.md (the media) and docs/prior-art/florals.md (the species
table and the Bloom part).

**Key.** **[src][key]** = stated in a source fetched and read this session; the key resolves to its URL at the foot of
the file. **[est]** = my estimate, synthesis or general botanical knowledge, **not** confirmed by a source this session.
Treat [est] numbers as starting values to tune by eye. All hex colours are [est].

---

## 0. Method and gaps

- I read 30 sources this session: floras and plant guides (Flora of North America, Illinois Wildflowers, Go Botany,
  Minnesota Wildflowers, Bean's *Trees and Shrubs Online*, NC State Extension, Museum für Naturkunde, Wisconsin
  Extension), herbarium practice (the RHS/Plant Heritage guide, the NC Botanical Garden, NYBG, Hagley), Atkins
  (Getty, Public Domain Review), drawing practice (Lizzie Harper, Walter Crane's *Line and Form*, a line-art guide) and
  the procedural literature (*The Algorithmic Beauty of Plants* ch. 4, Runions et al. on venation and on space
  colonisation).
- **Gaps.** The turn's shared web-search budget was used up before this task began. Fetches were then limited to URLs
  already cited in the project's docs, and every other URL was refused, among them Wikipedia's *Cosmos bipinnatus*,
  *Zinnia elegans*, *Ranunculus acris*, *Rosa canina*, *Bellis perennis*, *Viola odorata*, *L-system* and *Golden angle*
  pages, and ABOP chapters 2, 3 and 5. I could not reach the Kew botanical-illustration guidance, the ASBA, the Steere
  Herbarium, JSTOR Global Plants, eFloras, POWO or the Gielis paper.
- **Effect on this document.** These species' blocks rest mostly on [est]: Bellis, Cosmos, Zinnia, buttercup, dog rose,
  clover, and the leaves of iris and hydrangea. So do the superformula, the tropism formula and the
  monopodial/sympodial rules. They are standard botany and graphics, but unchecked this session, and should be verified
  in a follow-up session with search before they become hard rules.

---

## 1. How a professional plate or herbarium sheet is composed

### 1.1 The conventions (sourced)

- **Root down, fitted to the page.** Atkins followed botanical-illustration convention and laid plants "root down".
  Within that rule she was "curving them or extending them so that they fit on the page" [src][getty].
- **Natural position.** The RHS guide says to lay out the specimen "making sure not to bend things away from their
  natural position" [src][rhs]. Space the other pieces evenly [src][rhs].
- **Show both faces.** "Make sure that at least one leaf and one flower are showing their under surfaces." They can be
  "turned-over on the plant or removed and pressed separately" [src][rhs].
- **Long plants fold.** Long-leaved or long-stemmed plants "can be folded over to fit the format" [src][rhs]. A
  collector "bent the longest flowering stem so that it fits" [src][ncbg]. A large plant is cut into segments "no
  longer than 16″", and for shrubs a branch about 16″ long "with flower/fruit" [src][ncbg].
- **Sheet and furniture.**
  - Mounting card is 267 × 419 mm [src][rhs]; US sheets are 11.5″ × 16.5″ [src][ncbg]. Both are about 0.64 wide to
    high.
  - The label goes bottom right, a dissected flower or fruit in a row above it, and a fragment packet usually bottom
    left [src][rhs].
  - Stalk and stem ends are strapped with gummed linen tape [src][rhs]. Older sheets used "thin strips of brown paper
    tapes" [src][hagley].
  - A shifted specimen leaves "light brown staining on the mount" in its old place [src][hagley].
- **Everything that aids identification.** "Include all parts that will aid identification" [src][rhs]. The collector
  also photographs "a wide shot of the habit and close-ups of distinctive features" [src][rhs].
- **Thick parts.** Foam goes over the specimen so that "the thicker portion of the plant (typically roots or twigs)"
  doesn't stop the thin parts pressing flat [src][ncbg].
- **Pressing changes the plant.** "Pressing and drying completely changes the color and the form of the plant." Thick
  woody stems and bulky seed pods resist it, and the plant's position before pressing decides "what features are
  visible in the flattened form" [src][hagley].
- **Light.** In drawings the light comes from the top left and stays consistent: "Remember that there will be
  consistency here" [src][harper]. "Shadows often have distinct shapes" [src][harper]. Draw "exactly what you see" and
  avoid "putting a line just anywhere" [src][harper]. Veins go in order: outline, midrib, the largest laterals first,
  then branches [src][harper].

### 1.2 Childish versus professional

| Feature | Reads as childish | Reads as professional |
|---|---|---|
| **Symmetry** | Mirror-symmetric plant; a leaf pair at every node at identical angles; a perfectly round flower with equal petals | Natural irregularity: the stem leans and recovers; leaves differ in size and angle; petals vary ±10–20 % in length and width, and a few are turned or tucked under a neighbour [est]. Botanical draughtsmanship is "exactly what you see" [src][harper] |
| **Leaf pose** | Every leaf flat, face-on, the same green, in a fan | Some leaves overlap the stem or each other; some are foreshortened (seen edge-on, width × \|cos roll\|); at least one is turned to show its paler, more strongly veined underside [src][rhs], with the turn usually a twist through the petiole [est]. Leaves near the base are often torn, yellowing or partly withered on a pressed sheet [est] |
| **Stem** | A ruled line of constant width, or a perfect arc | Tapers from base to tip and narrows after each branch (pipe model, r^n = r₁^n + r₂^n, n ≈ 2–3 [src][colon]). A gentle S: the stem leans and then corrects upward (negative gravitropism), and droops under the head's weight near the top [est]. Zigzag kinks at nodes in species that have them [est] |
| **Flower view** | Every flower face-on, a flat star | A mix: one face-on, one in three-quarter view (petal ring an ellipse, minor axis = R·cos tilt), one in profile, plus buds and a spent flower [est]. ABOP's sunflower field shows heads in "four stages (buds, opening, open, drooping petals)" [src][abop4] |
| **Petals in perspective** | The same petal shape rotated around a centre | Each petal foreshortened by its own angle: the near petals overlap the centre, the far petals are hidden behind it, and side petals show their edge and cup [est]. Curve and taper the petal edge; don't draw a plain ellipse [est] |
| **Buds and seed** | Absent | Every inflorescence carries its development: buds at the top of a raceme and open flowers lower down (foxglove, bluebell, lavender); in a cyme the terminal flower opens first (buttercup, forget-me-not) [est]. A seed head or capsule where the season allows [est] |
| **Root or cut end** | The stem simply stops, often in a point | A root system (fibrous tuft, taproot, bulb or tuber) for herbs on a herbarium sheet; for cut flowers, a clean oblique cut showing a small cross-section ellipse, sometimes under a linen tape strap [src][rhs]. Root down [src][getty] |
| **Line weight** | One uniform outline everywhere: "often looks flat", like a colouring book [src][craft] | Heavier outer contour and shadow side, thin interior lines, strokes that "start thick and end in a sharp, thin point", gaps in the line where the light is strongest [src][craft]. For dark forms on light grounds the outline sits *inside* the silhouette [src][crane]. Line character follows the subject: the lily's "fine springing curves", the daisy's solid centre and stiff petals, the poppy's silky folds [src][crane] |
| **Colour** | Saturated flat fills, one green | Each organ its own green: leaf top, leaf underside (paler, greyer), stem, calyx. Petal colour shifts toward the base and veins [est]. On pressed sheets, colour follows §1.3 |
| **Density** | Crowded, or one centred icon | Negative space; the specimen fills about 60–80 % of the sheet's height, off-centre and diagonal, with the label region kept clear [est]. "Less is more"; avoid "crowding" [src][craft] |

### 1.3 How pressed specimens flatten and overlap

- **Colour after pressing.**
  - "Yellow, white, orange, and pale flowers tend to keep their color". Dark red, violet and purple flowers fade or turn
    grey or brown [src][nybg].
  - Most foliage discolours; silver foliage "holds its color nicely" [src][nybg].
  - Deeper cosmos and larkspur colours hold, and "Blue lobelias keep their colour extremely well" [src][buds].
  - Moisture turns pressings "black and mouldy", and sunlight fades them [src][buds].
- **Form.**
  - **Flat, face-down open flowers** (daisy, cosmos, poppy, anemone, single rose) press as a full ring with overlapping
    petals. The overlaps darken, as two layers of thin tissue [est].
  - **Cups and bells** (tulip, bluebell, foxglove, lily) press side-on and flatten into a two-layer silhouette: the near
    wall over the far wall, the tube's folds showing as darker creases along it [est]. A tulip on a sheet is often split
    open, or pressed in profile [est].
  - **Domes and spheres** (clover heads, hydrangea mopheads, chamomile cones, thistle-like involucres) stand proud. They
    press as a flattened disc with a dark compressed core [est]. Hydrangea is usually pressed floret by floret [est].
  - **Woody stems and bulky pods** keep their thickness [src][hagley]. In a cyanotype they print as hard-edged solid
    white, while thin petals let some light through and print pale blue (floral-imprints.md §2.3, [est]).
  - **Overlap.** Leaves overlap as they fell when the press closed. The stem crosses over some leaves and under others,
    never all one way [est].
  - **Shrinkage.** Petals shrink and wrinkle a little at the edges. Thin petals (poppy) become translucent and
    crinkled, and stamens smear into a darker disc (floral-imprints.md §5.2, [est]).
- **What survives in a cyanotype.** Only the outline and the graded transmission survive: thin parts pale blue, overlaps
  whiter, solid parts white. So each species needs its **silhouette tells** (listed per species in §2) to be legible in
  the outline alone [est]. Edges held off the paper (cupped petals, bulky heads) go soft; pressed-flat edges stay sharp
  (floral-imprints.md §2.3, [est]).

### 1.4 A geometric glossary for leaves

Width profile along the midrib: t ∈ [0,1], from base to tip. "Widest at" is the t where the width peaks. These ratios
are conventional usage [est].

| Term | Length : width | Widest at | Base / tip | Recipe |
|---|---|---|---|---|
| linear | ≥ 10–12 : 1 | – (parallel sides) | narrow / acute | a strip; taper only in the last 10 % |
| linear-filiform | ≥ 30 : 1 | – | thread | a stroke of 1–2 px canonical width |
| ensiform (sword) | 8–15 : 1 | ≈ 0.3 | sheathing / acute | flat, slightly curved strip, sharp tip |
| lanceolate | 3–6 : 1 | 0.25–0.35 | cuneate / acuminate | w(t) ∝ t^1·(1−t)^2 |
| oblanceolate | 3–6 : 1 | 0.65–0.75 | long cuneate / rounded | w(t) ∝ t^2·(1−t)^1 |
| elliptic | 1.5–3 : 1 | 0.5 | equal | w(t) ∝ t·(1−t) |
| ovate | 1.3–2 : 1 | 0.3–0.4 | rounded / acute | w(t) ∝ t^0.6·(1−t)^1.1 |
| obovate | 1.3–2 : 1 | 0.6–0.7 | cuneate / rounded | w(t) ∝ t^1.1·(1−t)^0.6 |
| spatulate | 3–5 : 1 | 0.8 | long narrow claw / round | a narrow stalk-like base for t < 0.5, then a round blade |
| cordate | 1.1–1.5 : 1 | 0.25 | two round basal lobes either side of a notch (sinus) / acute | an ovate outline plus two lobes reaching back 0.1–0.2 L past the petiole |
| reniform | 0.6–0.9 : 1 | – | deep sinus / round | kidney |
| oblong | 2–3 : 1 | 0.3–0.7 (flat middle) | round / round | parallel sides through the middle third |

The profile w(t) = t^a·(1−t)^b peaks at t* = a/(a+b) [est]. Choose a and b for where the leaf is widest; their size
sets how blunt or sharp the ends are.

- **Margins** [est]: entire (smooth); serrate (saw teeth pointing toward the tip); dentate (teeth pointing outward);
  crenate (rounded scallops); doubly serrate (small teeth on big teeth); lobed (cuts less than halfway to the midrib);
  pinnatifid (cut more than halfway); pinnately or bi- or tri-pinnately dissected (cut to the midrib, repeatedly).
- **Making teeth.** The venation model adds toothed margins "by summing triangular waveforms of different amplitudes and
  frequencies" [src][venation].
- **Venation** [est]: pinnate (a midrib with alternating laterals that curve toward the tip and join near the margin
  in loops); palmate (3–7 main veins from the base); triplinerved (3 strong veins from just above the base: zinnia,
  sunflower); parallel (monocots: tulip, lily, iris, bluebell).

---

## 2. The 23 species

Each block lists habit, stem, leaf, inflorescence, flower, buds and fruit, the **silhouette tells** (what must survive in
a cyanotype), and colours fresh → pressed.

"Pressed" colours follow NYBG's rule [src][nybg] unless the block says otherwise; the hexes are [est]. "Plate views" are
the angles a botanical plate typically gives the flower [est].

---

### 2.1 Daisy: use *Leucanthemum vulgare* (oxeye) by default, *Bellis perennis* as a variant

- **Choice** [est]. For a whole plant on a tall sheet, the oxeye daisy reads as "daisy": a long stem, toothed leaves,
  one big head. *Bellis* is a lawn rosette only 5–15 cm tall, with leafless scapes. Offer it as the "lawn daisy" seed.
- **Habit (oxeye).** A perennial 1–3 ft tall, "little branched" [src][oxeye]. Head diameter to plant height is about
  1 : 15 [est]. There may be 1–4 stems from a basal tuft [est].
- **Stem.** "Glabrous to slightly hairy, often angular or furrowed" [src][oxeye]. It is thin (about 2–3 mm), roughly a
  fifteenth of the head's width, and the top third is nearly bare [est].
- **Leaves.**
  - **Basal and lower:** a small basal tuft of oblanceolate leaves "with slender petioles, up to 5 in. long and ¾ in.
    across" [src][oxeye], so about 6–7 : 1. Recipe: oblanceolate, widest at about 0.7, tapering into the petiole
    [est].
  - **Cauline:** sparse and alternate; middle and upper leaves oblong and "often clasp the stem", shrinking as they
    ascend [src][oxeye]. Recipe: oblong strips 4–6 : 1 with two small ear-like lobes clasping the stem [est].
  - **Margin:** "Coarsely dentate". Some lower leaves are pinnatifid toward the base [src][oxeye].
  - **Surface:** hairless or nearly so [src][oxeye]. Venation is pinnate and faint [est].
- **Inflorescence.** One terminal capitulum per stem, "on a long, nearly naked stalk" [src][oxeye].
- **Flower.**
  - Head 1¼–2 in (3–5 cm) [src][oxeye].
  - **Rays:** 15–35 white, oblong [src][oxeye]. Each ray is about 3–4 : 1 with a tip bearing 2–3 tiny notches; ray
    length is about 0.35 × the head's diameter [est].
  - **Disc:** yellow, its "receptacle is noticeably flattened" [src][oxeye]. Disc diameter is about 0.3 × the head's
    [est]; disc florets on a Vogel spiral (§3.2).
  - **Involucre:** several series of green bracts with brown membranous margins [src][oxeye]. The brown rim shows in a
    side view [est].
  - **Plate views:** face-on, profile (rays a flat or slightly reflexed line, a shallow green cup beneath), back view
    (rings of bracts) [est].
- **Buds and seed.** A bud is a tight green button with bract scales, the rays showing as a white rim just before
  opening [est]. Achenes are dark with about 10 light ribs and no pappus [src][oxeye]. A spent head drops or browns
  its rays, leaving a bare domed disc [est].
- **Silhouette tells.** A single head on a long, nearly leafless stalk; many narrow rays radiating evenly; small toothed
  clasping leaves going up the stem; a basal tuft of spoon-shaped leaves [est].
- ***Bellis* variant** [est]:
  - a rosette of spatulate, slightly crenate leaves 2–6 cm long, pressed flat on the ground;
  - leafless, hairy scapes 3–15 cm;
  - heads 1.5–3 cm, with about 30–50 narrow white rays often tipped pink or crimson, especially beneath (so a bud
    looks pink);
  - heads close at night and in rain (a closed head is a pink-tipped tuft).
- **Colours.** Rays `#F7F5EE` → cream `#EEE3C6` with browned tips. Disc `#E8B21C` → `#D7B347`; yellow holds
  [src][nybg]. Leaves `#4E7A34` → olive `#6F7444`.

### 2.2 Chamomile (*Matricaria chamomilla*)

- **Habit.** An annual about 1–2 ft tall, branching "occasional to frequent" [src][chamo]. It is airy and much
  branched in its upper half, carrying many small heads at about the same height [est].
- **Stem.** "Round in cross-section and smooth (glabrous)", "light green, purplish green, or purple, with fine
  lengthwise veins" [src][chamo]. It is thin and wiry: about a fifth of the head's width at the base, and its upper
  branches are hair-fine [est].
- **Leaves.** "Alternate and sparse", sessile or short-petioled, up to 3 in × 1½ in, double- or triple-pinnate, with
  thread-like (linear-filiform) smooth segments [src][chamo].
  - Recipe: a feather of 2–3 orders. The main axis carries 6–10 pairs of side branches, each forking into 2–4 threads
    of 1–2 px, the threads 5–12 mm long [est].
  - Leaves shrink and simplify upward [est].
- **Inflorescence.** Heads "usually 1 or 2 per upper stem" on bare peduncles of variable length [src][chamo]. The
  whole plant reads as a loose corymb-like spray [est].
- **Flower.**
  - **Rays:** 10–20, white, oblong; they "spread outward or droop downward as the head matures" [src][chamo].
  - **Receptacle:** "globoid, subgloboid, or conical depending on maturity", with no chaff, "hollow inside"
    [src][chamo].
  - **Head size:** the source gives "1–2 in" [src][chamo]. I expect the true size is smaller, about 1.5–2.5 cm [est].
  - **Rays** are short (about 0.5 × the disc's width) and broad-oblong [est].
  - **Bracts:** 1–2 series, light green, lanceolate, with membranous margins [src][chamo].
  - **Plate views:** profile is the defining view: the rays hang down below a yellow dome or cone [est].
- **Buds and seed.** A bud is a small green-yellow button. The disc grows taller with age while the rays droop to
  vertical [src][chamo]. Achenes are tiny and ribbed [src][chamo].
- **Silhouette tells.** Reflexed rays hanging like a skirt below a raised cone; feathery thread leaves; many small
  heads on a branched, wiry frame [est]. Versus the oxeye: much smaller heads, many per plant, dissected leaves.
- **Colours.** Rays `#FBFAF4` → `#EFE6CC`. Disc `#F0C02A` → `#D9B13A`; yellow holds [src][nybg]. Leaves `#5E8A3A` →
  `#7A7A48`.

### 2.3 Cosmos (*Cosmos bipinnatus*)

No species source could be fetched; everything here is [est] unless tagged.

- **Habit.** An annual 0.6–2 m, open and branched, with long bare peduncles. Heads are about 1 : 15–25 of the plant's
  height [est].
- **Stem.** Slender, finely ribbed or striate, glabrous, green often flushed red at the nodes. Visibly thicker than a
  chamomile's but thin against the big head [est].
- **Leaves.** Opposite, sessile or nearly so, 2-pinnate (bipinnate), 6–11 cm long. Segments are linear-filiform, about
  0.5–1 mm wide and 1–3 cm long, so the whole leaf is airy and fern-like, wider than chamomile's [est]. Leaves shrink up
  the stem [est].
- **Inflorescence.** Solitary heads at the ends of long peduncles of 10–20 cm, several per branch system [est].
- **Flower.**
  - Heads 5–10 cm [est].
  - **Rays:** usually 8, broadly obovate-cuneate (wedge-shaped, widest at the tip). The tip is truncate with 3–5
    shallow teeth, and there are 2–4 faint parallel grooves along the ray [est]. Ray length is about 0.38 × the head's
    width; tip width is about 0.6 × the ray's length [est].
  - **Disc:** yellow, about 0.2–0.25 × the head's width [est].
  - **Involucre:** two series: the outer series narrow, green and spreading; the inner broad, membranous and brownish
    [est].
  - **Plate views:** face-on (8 wedges with toothed ends), three-quarter (wedges cup slightly forward) [est].
- **Buds and seed.** A round bud with the outer bracts like a star behind it. The seed head is a spray of long, slender,
  beaked achenes pointing outward, each with 2–4 barbed awns, like a bristly star [est].
- **Silhouette tells.** Eight broad wedge rays with toothed square ends; thread-leaf foliage in opposite pairs; long
  bare stalks; the starburst seed head [est].
- **Colours.** Pink `#E25A9A`, magenta `#B8287A` or white `#F4F0F2`, the pink often darker in a ring around the disc.
  Disc `#E8B21C`. The deeper colours are retentive when pressed [src][buds]: magenta → `#A33A72`.

### 2.4 Sunflower (*Helianthus annuus*)

- **Habit.** An annual 100–300 cm [src][fna-ha]. The wild form is branched with many small heads; the crop form has one
  huge head. Heads number 1–9 [src][fna-ha].
- **Stem.** Erect, "usually hispid" (bristly-hairy) [src][fna-ha]. It is thick: about 0.08–0.15 × the head's diameter
  in single-headed forms, and coarse, ribbed and pithy [est].
- **Leaves.** "Mostly cauline, mostly alternate" (the lowest pairs are often opposite [est]).
  - Petioles 2–20 cm; blades lanceolate to ovate, 10–40 × 5–40 cm; bases cuneate to cordate; margins serrate; the
    underside usually hispid [src][fna-ha].
  - Recipe: broad ovate to heart-shaped, about 1.2–1.6 : 1, widest at about 0.3, with three strong veins from just
    above the base (triplinerved), coarse teeth, rough [est].
  - Leaves get smaller and narrower near the head, and droop on long petioles [est].
  - The leaf spiral is 3/8 phyllotaxis [src][phyllo].
- **Inflorescence.** A capitulum: involucre 15–40 mm across in wild plants (to 200+ mm in cultivars), peduncles
  2–20 cm [src][fna-ha].
- **Flower.**
  - **Phyllaries:** 20–30, "ovate to lanceolate", "abruptly narrowed and long-acuminate", margins ciliate [src][fna-ha].
    They form a shaggy green collar behind the rays [est].
  - **Rays:** 13–30, laminae 25–50 mm [src][fna-ha]. Cultivars have about 34, 55 or more. Each ray is lanceolate, about
    3 : 1, often slightly twisted, with a pointed tip [est].
  - **Disc florets:** 150+ (to 1000+), corolla lobes usually reddish, anthers brownish to black [src][fna-ha]. They
    follow Vogel's spiral (§3.2), "55, 89 or 144" spirals in large heads [src][maths].
  - **Disc to head:** about 0.5–0.65 of the diameter in crop forms [est].
  - **Plate views:** face-on; three-quarter from below (the green bract collar and the back of the rays); nodding
    profile (mature heads bow) [est].
- **Buds and seed.** A bud is a green star of long-acuminate bracts. Rays wither, and the disc becomes a heavy seed
  face, browned and bowed [est]. ABOP's sunflower model swaps organs by index n: seeds for n ≤ 440, ray florets to 565,
  then petal types M, N, O, P [src][abop4].
- **Silhouette tells.** A huge round head on a thick stem; a ring of pointed rays; big heart-shaped leaves on long
  stalks alternating up the stem; the nodding head [est].
- **Colours.** Rays `#F2B31B` → `#D9A12E`; yellow holds [src][nybg]. Disc `#4A2A14` → `#3A2618`. Leaves `#4C6E2A` →
  `#7A6F45`. A whole sunflower is too bulky for a real sheet; plates show a head and one leaf [est].

### 2.5 Zinnia (*Zinnia elegans*)

No species source could be fetched; everything here is [est] unless tagged.

- **Habit.** An annual 30–100 cm, upright, branching in opposite pairs, so the branches fork symmetrically. Break that
  symmetry with unequal branch lengths [est].
- **Stem.** Stout, hispid-scabrous (rough-hairy). The peduncle swells and becomes hollow just under the head [est].
- **Leaves.** Opposite and sessile, clasping or joined around the stem, ovate to lanceolate, 4–10 × 2–5 cm, entire,
  rough, with three strong veins from the base. Recipe: ovate-lanceolate, 2–2.5 : 1, widest at 0.3 [est]. Each upward
  pair is rotated 90° (decussate) [est].
- **Inflorescence.** A solitary terminal capitulum on each branch [est].
- **Flower.**
  - Heads 5–12 cm in cultivars [est].
  - **Rays:** 8–21 in single forms, broadly obovate to spatulate, often with a notched tip. They are persistent and
    papery, and stay on the head after fading [est].
  - **Disc:** a raised boss of yellow-lobed florets, often ringed by a dark purple-brown band [est].
  - **Phyllaries:** in 3–4 imbricate rows, rounded, with dark margins (a scaly cup) [est].
  - **Doubles** (dahlia-flowered, cactus-flowered) are tiered domes: ABOP's zinnia model has petal "size grows linearly
    with n", "early petals are more vertical and later ones more horizontal" [src][abop4].
  - **Plate views:** profile (tiered dome over a scaly cup), three-quarter [est].
- **Buds and seed.** A scaly, cone-like bud; spent rays stay on as dry paper [est].
- **Silhouette tells.** Tiered, stacked rays forming a dome; opposite clasping leaves; a swollen neck under the head
  [est].
- **Colours.** Orange `#F05A28`, cerise `#E83F7A`, scarlet `#D2302A`, lime `#CFE07A`, white. Pressed: orange holds
  [src][nybg]; reds → `#8E3A2E`.

### 2.6 Cornflower (*Centaurea cyanus*)

- **Habit.** An annual 8–40 in, "usually single from the base and branched", starting upright and tending to "flop
  without surrounding support" [src][cornfl]. Each wiry branch ends in a head [src][cornfl].
- **Stem.** "Sparsely to moderately covered in woolly hairs" [src][cornfl]. It is thin and grey-green, and in drawings
  is often slightly angled at the branches [est].
- **Leaves.** Alternate, simple, stalkless, 1–4 in, "lance-linear, pointed at the tip", toothless, "or the lower leaves
  occasionally have a few narrow lobes"; long matted hairs [src][cornfl].
  - Recipe: linear-lanceolate, 10–20 : 1, widest at 0.4, grey-green [est].
  - Basal leaves are broader and may be lobed; upper leaves are narrow strips [est].
- **Inflorescence.** "Single, at the tips of branching stems" [src][cornfl]. There are 3–15 heads per plant [est].
- **Flower.**
  - Head "up to about 1¼ inches across", 25–35 florets [src][cornfl].
  - **Outer florets:** sterile, "widely spreading, and funnel-shaped", with "five lobes, shorter than the tube"
    [src][cornfl]. There are 5–8 big ones, each a narrow trumpet with a jagged five-toothed mouth, splaying sideways
    [est].
  - **Inner florets:** fertile, erect, purple to white, with dark blue-violet stamens [src][cornfl].
  - **Involucre:** "½ to 2/3 inch long and longer than wide"; bracts egg-shaped, appressed, in several layers, light
    green "with whitish to brown edging", finely toothed [src][cornfl]. An urn of fish-scale bracts, each with a dark
    fringed rim [est].
  - **Plate views:** profile (urn plus a ragged crown) is the classic view; face-on is a ragged blue rosette [est].
- **Buds and seed.** A bud is a scaly green-and-brown egg on a stalk. Achenes are 4–5 mm with a tuft of light-brown
  bristles [src][cornfl].
- **Silhouette tells.** An urn of overlapping scales topped by a ragged ring of flaring tubes; narrow, grass-like leaves;
  wiry, forked stems [est].
- **Colours.** Florets `#3A5FD0`, dark stamens `#2A2560`, involucre `#9AA88A` with brown rims `#7A5A3A`, leaves
  `#8FA08A` (grey-green). Pressed: the blue largely holds (blue is retentive, cf. lobelia [src][buds]; for cornflower
  [est]) → `#4C5FA8`.

### 2.7 Corn poppy (*Papaver rhoeas*)

- **Habit.** 10–60 cm, stems "upright or angled outward" [src][poppy]. Few-branched, each branch with one flower and a
  long, slightly wavy pedicel [est].
- **Stem.** Hairs "between the nodes", plain [src][poppy]. They are spreading bristles; drawn as fine perpendicular
  hairs on the stem's outline, they are a key tell in silhouette [est]. The stem is thin against a large flower, about
  0.04 × its width [est].
- **Leaves.** Alternate, petioled, blades "20–90 mm long and 10–120 mm wide", elliptic or oblong, cuneate base, lobed
  or toothed-and-lobed, hairy underneath, "nearly similar in size along the stem" [src][poppy].
  - Recipe: pinnatifid. A midrib carries 3–6 pairs of narrow, forward-pointing lobes, each lobe with 1–3 teeth; lobe
    width about 0.15 × the leaf's length; lower leaves stalked, upper ones sessile [est].
- **Inflorescence.** Solitary flowers at the stem tips [est].
- **Flower.**
  - **Petals:** four, "thin and delicate", 13–50 mm long, "crumpled erratically" in bud [src][poppy]. Two outer petals
    are broader than two inner, all broadly obovate to round, overlapping into a shallow bowl. Crumpled radial creases
    persist [est].
  - **Blotch:** the page says "no noticeable marks" [src][poppy], but many plants have a black basal blotch; use it on
    some seeds [est].
  - **Sepals:** two [src][poppy], bristly; they fall as the flower opens [est].
  - **Stamens:** "13 or more" [src][poppy]. Many dark filaments around the ovary [est].
  - **Ovary:** topped by a flat stigmatic disc with "mostly 8–15 stigmas" as radiating rays [src][poppy].
  - **Plate views:** three-quarter bowl (most common), face-on cross of 4, profile cup [est].
- **Buds and seed.**
  - The bud is an ovoid, bristly bud that nods on a hooked pedicel and straightens as it opens [est].
  - The capsule is "ovoid to subglobose, 1–1.5 times as long as wide" [src][poppy], crowned by the rayed disc like a
    pepper-pot lid. It is smooth and hairless [est].
- **Silhouette tells.** A nodding bristly bud on a hooked stalk; four broad, crinkled petals; the capsule with its flat,
  rayed lid; bristly stems; pinnatifid leaves [est].
- **Colours.** Petal `#D7261E`, blotch `#1A1414`, capsule `#8A9A6A` → `#B49A68`. Pressed: red fades toward brown
  [src][nybg] → `#8E3A2E`, and the thin petals go translucent and purplish at the edges [est].

### 2.8 Anemone (*Anemone coronaria*)

- **Habit.** 20–40 cm, rarely 60, from "hard black tubers" [src][anem]. One flower per stem (cultivars give 13–15
  blooms per plant) [src][anem].
- **Stem.** Bare, slightly hairy, about 0.05 × the flower's width; a gentle curve [est].
- **Leaves.**
  - **Basal:** "a basal rosette of a few leaves"; each leaf "divided into three leaflets", each "deeply lobed"
    [src][anem]. Recipe: triternate, like parsley, the segments narrow and toothed [est].
  - **Involucre:** a "whorl of small leaves" just below the flower [src][anem]. Recipe: 3 sessile bracts deeply cut into
    linear lobes, forming a ruff a third to halfway down the stem from the flower. Draw it as a frilled collar, the
    plant's tell [est].
- **Inflorescence.** Solitary [src][anem].
- **Flower.**
  - 3–8 cm across in the wild, 8–10 cm in cultivars [src][anem].
  - **Tepals:** 5–8 [src][anem], broadly obovate to oval, overlapping, forming a shallow open bowl [est].
  - **Centre:** black in most varieties, a central mound of "tightly packed pistils" with a "crown-like ring of
    stamens" [src][anem]. The centre is about 0.3 × the flower's diameter: a dark dome, a fringe of dark stamens and a
    pale band at the tepal bases (often white) [est].
  - **Plate views:** face-on and three-quarter bowl [est].
- **Buds and seed.** A nodding, then upright, bud wrapped in the ruff. The seed head is a woolly, elongated cylinder of
  achenes, like a cotton bud [est].
- **Silhouette tells.** A single bowl flower with a dark eye; a frilled leaf collar part way down a bare stem; a parsley
  rosette at the base [est].
- **Colours.** Red `#C8102E`, blue-violet `#3B3FA0`, white `#F6F3EE`; centre `#16121C`; pale ring `#F2EEE8`. Pressed:
  red and violet fade and darken [src][nybg] → `#7A2F2A` / `#5E5578`.

### 2.9 Buttercup (*Ranunculus acris*)

No species source could be fetched; everything here is [est] unless tagged.

- **Habit.** A perennial 30–100 cm, branched in the upper half into a loose, open cyme of many flowers. The tallest
  common buttercup [est].
- **Stem.** Upright, with fine appressed hairs, hollow, thin. The flower stalks (pedicels) are smooth and unfurrowed,
  which distinguishes it from *R. repens* [est].
- **Leaves.**
  - **Basal:** long-petioled (10–20 cm), the blade pentagonal in outline, 5–10 cm across, palmately divided almost to the
    base into 3–7 segments, each segment cut again into toothed lobes [est].
  - **Recipe:** a hand of 5 narrow-wedge segments from one point, each 2–3-lobed at the end, with deep gaps [est].
  - **Up the stem:** leaves get shorter-stalked and simpler. The top ones are sessile, 3-parted into linear strips
    [est].
- **Inflorescence.** A cyme: the terminal flower opens first, with side branches beyond it, so open flowers, buds and
  fruits mix [est].
- **Flower.**
  - 1.5–2.5 cm [est].
  - **Petals:** 5, broadly obovate, overlapping into a shallow cup, intensely glossy [est]. The gloss comes from a flat
    epidermis plus an air gap below it, two reflecting surfaces that "effectively double the gloss", reflecting yellow
    "with an intensity comparable to glass" (studied in *R. repens*) [src][cam].
  - **Sepals:** 5, spreading under the petals, greenish-yellow and hairy (not reflexed; reflexed sepals mark *R.
    bulbosus*) [est].
  - **Centre:** a green knob of carpels ringed by many yellow stamens, about 0.3 × the flower [est].
  - **Plate views:** three-quarter cup with a highlight, face-on, profile showing the sepals [est].
- **Buds and seed.** Globose green buds on long stalks; a spherical fruit head of achenes, each with a short hooked beak
  [est].
- **Silhouette tells.** A tall, branching frame with many small cup flowers on long, thin stalks; deeply cut "crowsfoot"
  basal leaves [est].
- **Colours.** Petal `#F7D21E` → `#E3C243`; yellow holds [src][nybg], but petals may go translucent and lose their
  gloss [est]. Leaves `#3E6E2A`.

### 2.10 Rose: dog rose (*Rosa canina*) for specimens, garden rose for plates

The dog-rose details are [est] unless tagged.

- **Habit.** A shrub 1–5 m with long, arching canes. A specimen is a 30–40 cm flowering branch, cut (§1.1: "a branch
  about 16″ long with flower/fruit" [src][ncbg]) [est].
- **Stem.** Woody, green to reddish. Prickles are stout, hooked, flattened and broad-based, pointing backward, scattered
  rather than in pairs [est]. Draw the cut end square or oblique, with a pith dot [est].
- **Leaves.**
  - Alternate and pinnate: 5–7 leaflets (a terminal one plus 2–3 pairs), leaflets ovate-elliptic, 1.5–4 cm,
    sharply serrate [est].
  - Stipules are winged, fused along the base of the petiole, ending in two free points [est].
  - Leaflets are slightly folded along the midrib [est].
- **Inflorescence.** Flowers solitary or in clusters of 2–4 (a corymb) at the ends of short side shoots [est].
- **Flower.**
  - 4–5 cm, five petals, pale pink to white, broadly obcordate, each with a notch at the tip; many yellow stamens around
    a woolly stigma boss [est].
  - **Sepals:** five, pinnately lobed (2 with lobes on both sides, 2 with none, 1 with lobes on one side), reflexed
    after flowering, falling before the hip ripens [est].
  - **Garden roses:** single 1–7 petals, semi-double 8–15, double 16–25, full 26–40, very full 40+ [src][rose]. Shapes:
    flat, cupped, globular, high-centred ("center petals stand above the outer petals"), quartered, rosette, pompon
    [src][rose].
  - **Plate views:** face-on single; three-quarter cupped double; profile bud; back view showing the sepals [est].
- **Buds and seed.** The bud is ovoid-pointed, wrapped in the feathery sepals, with pink showing at the tip. Hips are
  ovoid, 1.5–2 cm, scarlet, smooth and glossy [est].
- **Silhouette tells.** Hooked prickles on an arching stem; pinnate leaves with toothed leaflets; five notched petals
  around a stamen boss; feathery sepals; oval hips [est].
- **Colours.** Petal `#F2B8C2` → `#E8C4BE` (pale pink holds fairly well [src][nybg]); crimson garden roses `#B3123A` →
  `#6E2A2C`, browning [src][nybg]. Hips `#C42A1C` → `#7A2A1C`. Leaves `#3F6A34` → `#6B6A40`.

### 2.11 Peony (*Paeonia lactiflora*)

- **Habit.** A herbaceous perennial 50–70 cm "tall and broad" [src][peony]. A bushy clump of leafy stems [est].
- **Stem.** Stout, smooth, often reddish; about 0.06–0.08 × the flower's width; carries 1 terminal and 1–4 side buds
  [est].
- **Leaves.** "9-lobed", 20–40 cm [src][peony].
  - Recipe: biternate. The petiole forks into 3, and each branch carries 3 leaflets; leaflets elliptic to lanceolate,
    entire, dark and glossy, with a reddish midrib and petiole; leaflets 8–15 cm, often themselves 2–3-lobed [est].
  - Leaves get smaller toward the top; the uppermost is simple [est].
- **Inflorescence.** A terminal flower plus axillary side buds [est].
- **Flower.**
  - "Cup- or bowl-shaped", 8–16 cm, 5–10 petals in the species, "yellow stamens"; double cultivars turn stamens into
    petals [src][peony].
  - **Petals:** broadly obovate, concave, with crinkled margins [est].
  - **Sepals:** 3–5, green, leafy and rounded, persistent [est].
  - **Carpels:** 3–5 [est].
  - Double forms are a ruffled ball, the outer guard petals broader [est].
  - **Plate views:** three-quarter bowl, profile [est].
- **Buds and seed.** Buds are "large and round" [src][peony]: a hard sphere 2–3 cm with sepals cupping it. Follicles
  are leathery, splitting, with dark seeds [est].
- **Silhouette tells.** A large ball or bowl on a stout stem; divided leaves with long, smooth leaflets; spherical buds
  [est].
- **Colours.** Pink `#F3C6CF`, crimson `#C2264B`, white `#F6EFE6`, stamens `#E8B21C`. Pressed: pale pink → beige-pink
  `#E6C9C2`; crimson → `#6E2A3A` [src][nybg]. Pressed petals are typically separated, not a whole head [est].

### 2.12 Tulip (*Tulipa*, garden)

- **Habit.** Height varies by group, e.g. 15–45 cm for single earlies [src][tulip]. One stem, one flower, a few large
  leaves near the base [src][tulip].
- **Stem.** A smooth, round scape, bare above the top leaf [src][tulip]. It is thick and fleshy, about 0.12–0.15 × the
  cup's width. In a vase or on a sheet it bends and arcs toward the light [est].
- **Leaves.** "Typically two to six", alternate, cauline, "shrinking in size up the stem"; "strap-shaped with a waxy
  coating", fleshy and "often bluish-green", usually 10–25 cm [src][tulip].
  - Recipe: broad lanceolate to oblong strap, 3–5 : 1, widest at 0.3, clasping at the base, with parallel veins and an
    undulate edge [est].
  - The lowest leaf is broadest and arches outward and down; the upper ones are narrower and more erect [est].
- **Inflorescence.** "Usually a single terminal flower"; some species carry 2–4 [src][tulip].
- **Flower.**
  - "Erect, actinomorphic", "cup- or star-shaped" [src][tulip].
  - **Tepals:** six, in two whorls of three; inner tepals have "a small, delicate cleft at the tip", outer ones are
    "uninterrupted ovals" [src][tulip]. Each tepal is about 1.6–2 : 1, obovate-elliptic [est].
  - **Blotch:** a coloured basal blotch on the inner surface [src][tulip].
  - **Stamens and stigma:** six stamens with filaments "widened at the base", shorter than the tepals; a three-lobed
    stigma on a short or absent style [src][tulip].
  - **Plate views:** profile cup (the canonical view, 3 outer tepals seen, 2 inner showing between), a three-quarter
    look into the open cup, and an overblown one opened flat as a star [est].
- **Buds and seed.** A closed egg-shaped bud. The capsule is "globose or ellipsoid" and leathery [src][tulip]. A
  three-angled pod on an upright stem [est]. The bulb has a tunic, up to about 5 cm across [src][tulip]; draw it on
  sheets with a tuft of roots [est].
- **Silhouette tells.** An egg-cup on a long, bare stem; 2–4 broad strap leaves sheathing low on the stem; for whole
  plants, a bulb with roots [est].
- **Colours.** Red `#D9332B`, yellow `#F2C230`, purple `#7A2A6E`, white; never pure blue (florals.md cites the tulip page for this; not re-checked) [est]. Leaves
  glaucous `#7E9A86`. Pressed: yellow holds; red and purple darken and brown [src][nybg].

### 2.13 Lily (*Lilium*): Turk's cap and trumpet forms

- **Habit.** Turk's cap is "up to 6′", unbranched except at the inflorescence [src][turk]. Garden Asiatics are
  60–120 cm [est].
- **Stem.** "Stout and smooth" [src][turk]. Straight and erect, leafy throughout [est].
- **Leaves.** "In whorls of 3–9 along the stem", the upper ones "paired or alternate"; "up to 7″ long and 1″ across",
  lanceolate, with smooth margins and "parallel venation" [src][turk].
  - Recipe: lanceolate, 6–8 : 1, widest at 0.35, sessile, 3–5 parallel veins [est].
  - Whorls are 5–15 cm apart, and leaves shrink toward the inflorescence [est]. Trumpet and Asiatic lilies have
    scattered, alternate leaves instead [est].
- **Inflorescence.** "1–12 flowers per terminal cluster" on pedicels "4–8″ long" that "spread upward and outward"
  [src][turk]. A candelabrum-like umbel or raceme [est].
- **Flower.**
  - Nodding, "about 3–4″ across" [src][turk].
  - **Tepals:** six, "flaring outward, then curving strongly backward beyond the flower base"; spotted toward the throat
    [src][turk]. Each tepal is lanceolate, about 4 : 1 [est].
  - **Stamens:** strongly exserted, anthers "reddish brown to black, ½″ long or longer"; a long stigma that "curls
    slightly upward" [src][turk].
  - Trumpet lilies are horizontal funnels with six tepals flaring at the mouth [est].
  - **Plate views:** profile of the nodding flower (tepals swept back into a ball, stamens hanging below), seen from
    below, and side view of the trumpet [est].
  - Line character: "fine springing curves" [src][crane].
- **Buds and seed.** Elongated, six-ribbed buds on the same arching pedicels, opening from the bottom of the cluster
  [est]. The capsule is "oblong, 3-lobed", with flat, papery-winged seeds [src][turk]. The bulb is scaly and white
  [src][turk].
- **Silhouette tells.** Whorls of narrow leaves up a straight stem; recurved tepals forming a lantern; six long stamens
  dangling; arching pedicels [est].
- **Colours.** Orange `#E8742A` with dark spots `#5A1E1A`; white `#FFFFFF` (trumpet); anthers `#6B2A14`. Pressed:
  orange holds [src][nybg]. The thick tepals press poorly and darken [est].

### 2.14 Iris (bearded, *I. germanica* type)

Flower parts are sourced; leaves and habit are [est].

- **Habit.** A fan of sword leaves from a rhizome, and a flowering stem 40–90 cm rising above the leaves [est].
- **Stem.** Round, smooth, glaucous, 1–3-branched, with small sheathing leaves; thick (about 0.1 × the flower) [est].
- **Leaves.** Equitant (folded and overlapping at the base in one flat fan), ensiform (sword-shaped), 30–60 × 2.5–4 cm,
  with parallel veins, glaucous, the tips slightly curved and often brown-tipped [est]. Recipe: 10–15 : 1, widest at
  about 0.3, the tip acute and curved. The fan has 5–9 leaves, the outer ones shorter and splaying [est].
- **Inflorescence.** 2–6 flowers per stem, each emerging from papery spathes (bracts), opening in succession [est].
- **Flower.**
  - **Standards:** three, upright [src][iris].
  - **Falls:** three, hanging down, "a landing pad", with nectar-guide lines and (bearded types) a yellow beard
    [src][iris].
  - **Style arms:** three petal-like arms arching over each fall, with the stigmatic lip at the top and the stamen
    beneath [src][iris].
  - Each standard and fall is obovate with a narrow haft at the base (the haft about 0.3 × its length) and a ruffled
    edge [est].
  - **Plate views:** three-quarter (2 falls and 2 standards visible), profile (standards meeting at the top, a fall
    dropping in front) [est].
- **Buds and seed.** A tight, furled, pointed bud like a closed umbrella emerging from the spathes. The capsule is
  3-angled, 4–6 cm [est].
- **Silhouette tells.** A flat fan of swords; three falls hanging and three standards rising; a tall, stiff stem with
  papery bracts [est].
- **Colours.** Violet `#5B3C9C`, beard `#F2C230`, leaves `#6E8C7A` (glaucous). Pressed: violet fades toward grey-brown
  [src][nybg] → `#6E5A6B`. The thick falls press dark [est].

### 2.15 Cherry blossom: a flowering twig

- **Species.** *P. serrulata* (Japanese flowering cherry), often double cultivars; *P. avium* (wild cherry), single
  white. For a twig specimen, take a branch tip 20–35 cm [est].
- **Habit and stem.**
  - The twig is woody, brown-grey to chestnut, with horizontal lenticels. *P. serrulata* var. *spontanea* bark is
    "brownish or greyish with prominent, persistent lenticels" [src][prunus].
  - The twig zigzags slightly at each bud, and carries short spurs with clustered bud scales [est].
  - It tapers markedly, about 3 : 1 over its length [est].
- **Leaves.**
  - *P. serrulata*: "ovate to ovate-lanceolate", about 7.5–12.5 × 3–6 cm, the apex "long and taper-pointed", margin
    toothed "sometimes doubly", glaucous beneath [src][prunus]; in var. *spontanea* each tooth ends in "a short bristle
    (aristate)" [src][prunus].
  - **Young leaves:** "reddish-brown in var. *spontanea*, bronze in 'Kanzan'" [src][prunus], emerging with or just
    after the flowers.
  - **Recipe:** ovate-acuminate, 2–2.5 : 1, widest at 0.4, a long drip tip, fine teeth on the margin, pinnate veins
    with 8–12 pairs [est].
  - On a flowering twig, leaves are small, bronzy and half-unfolded (folded along the midrib) [est].
- **Inflorescence.** "Short-stalked racemose clusters of two to five flowers", stalks "up to 1½ in (4 cm) long"
  [src][prunus]. The clusters rise from spurs along the twig [est].
- **Flower.**
  - Typical *P. serrulata*: 2.5–4.5 cm, often double [src][prunus]. 'Kanzan' has "about 30 petals", "crimson in bud,
    opening purplish-rose" [src][prunus]; 'Senriko' has "notched petals" [src][prunus]; 'Tai Haku' is single,
    "saucer-shaped, pure white, up to 2½ in" [src][prunus].
  - **Single form:** 5 obovate petals with a small notch at the tip; about 30 long stamens forming a halo; a cup-shaped
    hypanthium and 5 sepals beneath [est].
  - **Plate views:** clusters showing one flower face-on, one in profile on its long pedicel, buds [est].
- **Buds and fruit.** Pink buds on long stalks, with brown bud scales at the base of each cluster [est]. Fruit is "a
  small black cherry" (typical) or "dark purplish-red", "about ¼ in (6 mm)" (var. *spontanea*) [src][prunus].
- **Silhouette tells.** A bare, slightly zigzag woody twig; clusters of long-stalked flowers hanging from spurs; notched
  petals; a stamen halo; a few small, folded young leaves [est].
- **Colours.** Petal `#F6D3DC` to `#FFF7F8`, buds `#D8708A`, twig `#5A4034`, young leaf `#8A5A3A` (bronze). Pressed:
  pale pink → `#F1E2DE` (pale holds [src][nybg]), going translucent [est].

### 2.16 Forget-me-not (*Myosotis*)

- **Species.** *M. sylvatica* (wood forget-me-not) is the garden type [src][myos]; *M. scorpioides* is the water
  forget-me-not [est].
- **Habit.** "Can grow to a height of 45 cm"; upright and "usually much-branched" [src][myos]. A loose dome of many
  coiled sprays [est].
- **Stem.** Covered in soft hairs [src][myos]; thin, branching [est].
- **Leaves.** "Alternate", basal and stem, "oval to lance-shaped and finely haired" [src][myos]. Basal leaves are
  oblanceolate with stalks and stem leaves sessile oblong, 2–8 cm; the margin is entire, the midrib only visible [est].
- **Inflorescence.** A "twisted compound flower head" [src][myos]: a scorpioid cyme, coiled at the tip like a
  fiddlehead and uncoiling as it flowers, without bracts [est]. Buds sit in the coil; open flowers are spaced below
  along a lengthening axis; nutlets in calyces sit lowest [est]. 10–30 flowers per spray [est].
- **Flower.**
  - "Small and sky-blue, with five partly fused petals"; a yellow ring of scales at the centre (the "eye")
    [src][myos].
  - 6–10 mm; five round petal lobes on a short tube; a white ring between the blue and the yellow eye [est].
  - **Plate views:** face-on (5 rounds with an eye), profile (a tiny salver) [est].
- **Buds and seed.** Buds "often appear pink at first", and flowers change "from pink to sky-blue" [src][myos]. Four
  nutlets [src][myos], held in hooked-haired calyces [est].
- **Silhouette tells.** A curled, fiddlehead tip; tiny 5-lobed discs strung along a curved axis; soft oblong leaves
  [est].
- **Colours.** Petal `#7FB2E5`, eye `#F3D24A`, bud `#E7A6C0`, leaves `#5F8A4A`. Pressed: pale colours hold [src][nybg] and blue
  is retentive in lobelia [src][buds]; for forget-me-not [est] → `#8AA8D6`.

### 2.17 Violet (*Viola odorata*)

The genus traits are sourced; the species details are [est].

- **Habit.** A stemless rosette 5–15 cm with long runners (stolons) rooting at their tips; flowers on long stalks
  rising from the rosette [est]. Stemless species form "basal rosettes" [src][viola].
- **Stem.** None above ground except stolons; the flower stalks (peduncles) are thin and carry "a pair of bracteoles"
  [src][viola]. The peduncle is hooked at the top so the flower faces sideways or nods [est].
- **Leaves.** "Usually heart-shaped or kidney-shaped with scalloped margins"; stipules "always present" [src][viola].
  - *V. odorata*: cordate to reniform, 2–6 cm, crenate, on long petioles (5–10 cm), downy [est].
  - **Recipe:** cordate, 1.1–1.3 : 1, a deep basal sinus, a rounded-acute tip, 10–16 crenations per side, palmate-pinnate
    veins [est].
  - Leaves get larger after flowering [est].
- **Inflorescence.** "Usually solitary" flowers on long stalks [src][viola].
- **Flower.**
  - "Strongly zygomorphic"; five petals: "Four petals sit in two pairs", "upswept or fan-shaped", and "a broad, lobed
    lower petal that points downward" with a spur behind [src][viola].
  - Five sepals, which persist [src][viola]. Five stamens, with nectar spurs from the lower two inserting into the lower
    petal's spur [src][viola].
  - *V. odorata*: 1.5–2 cm, deep violet or white, sweetly scented; spur short and blunt [est]. The lower petal is darker
    veined near the throat, with a white throat [est].
  - **Plate views:** face-on (2 up, 2 sideways, 1 down), profile (the hooked stalk, the spur pointing back) [est].
- **Buds and seed.** A nodding, pointed bud on a hooked stalk. Cleistogamous (petal-less) flowers come later in the
  season [src][viola]. The capsule "splits into three valves" [src][viola], round and downy in *V. odorata*, held near
  the ground [est].
- **Silhouette tells.** The lopsided five-petal face with a big lower lip; flowers on hooked stalks just above a clump
  of heart-shaped leaves [est].
- **Colours.** Petal `#5C2E91`, throat `#F4F0F6`, leaves `#3F6E3A`. Pressed: violet fades toward grey-brown
  [src][nybg] → `#6E5A7A`.

### 2.18 Bluebell (*Hyacinthoides non-scripta*)

- **Habit.** A bulb sends up 3–6 basal leaves and a single scape 20–50 cm [est].
- **Stem.** The scape is leafless, smooth and fleshy. The "flowers and stem droop or nod, with flowers all on one side"
  [src][blueb]. The top third arches over like a shepherd's crook [est]. About 0.04–0.06 × the scape's length thick
  [est].
- **Leaves.** Linear strap leaves 20–45 cm × 7–15 mm, glossy, slightly keeled, with parallel veins, arching and often
  longer than the scape when sprawling. Recipe: linear, 25–40 : 1, the tip hooded [est].
- **Inflorescence.** A one-sided raceme of 4–16 flowers, each on a short pedicel with 2 bluish bracts at its base; it
  opens from the bottom up, buds at the tip [est].
- **Flower.**
  - "Flowers appear tubular", the tips of the tepals "reflexed (curved back)" [src][blueb]. Six tepals fused at the
    base into a narrow bell 1.5–2 cm, about 3 : 1 long to wide [est].
  - "Cream" anthers (blue or green in the Spanish bluebell) [src][blueb].
  - **Plate views:** profile of the arched scape with hanging bells on one side [est].
- **Buds and seed.** Buds are slender and upward-pointing at the tip of the crook, turning down as they open [est]. The
  capsule is three-celled with black seeds; the scape straightens in fruit [est].
- **Silhouette tells.** An arched stem with bells all hanging on one side; curled-back tepal tips; long, narrow leaves
  from the base; versus the Spanish bluebell, which is "erect, without drooping" with saucer-shaped bells on all sides
  [src][blueb].
- **Colours.** Deep violet-blue [src][blueb], `#4B4FB8`; anthers `#F2E8C8`. Pressed: violet-blue
  shifts toward purple-grey `#6A6A9A` (violet fades [src][nybg]; the hue [est]).

### 2.19 Foxglove (*Digitalis purpurea*)

- **Habit.** A biennial: "the first year forms a basal rosette", "the second year produces a tall flowering spike";
  "about 2 to 5 feet tall" [src][foxg]. A single unbranched spike (sometimes side spikes) [est].
- **Stem.** Stout, round, downy, unbranched, its thickness about 0.2 × a bell's length at the base [est].
- **Leaves.** "Velvety, green, alternate, and simple, with a crenate margin. Basal leaves are large and long-stalked,
  and leaves get smaller up the stem" [src][foxg].
  - Recipe: ovate-lanceolate, 2.5–3.5 : 1, widest at 0.35, 15–30 cm basal. Net veins sunk above, prominent and grey-
    woolly below, so it is a strong candidate for the turned-leaf underside [est].
  - Leaves winged into their petioles; stem leaves become sessile, then grade into bracts within the raceme [est].
- **Inflorescence.** "Pendulous, tubular-bell flowers on a one-sided raceme" [src][foxg]. 20–80 flowers; open from the
  bottom up, buds at the top [est].
- **Flower.**
  - Spotted inside [src][foxg]. Bells 4–6 cm, about 2.5 : 1 long to wide, the mouth oblique with a longer lower lip
    fringed with hairs, the inside of the lower part spotted with dark spots ringed white [est].
  - Five calyx lobes, green, pointed [est].
  - **Plate views:** profile of the spike, bells hanging down and outward; one bell seen from the front showing the
    spotted throat [est].
- **Buds and seed.** Buds are tight green-to-pink tips at the top of the spike, angled upward; the spike's top often
  bends a little [est]. Capsules are ovoid, pointed, held lower on the spike once the bells fall [est].
- **Silhouette tells.** A tall spike with bells all to one side, tapering to buds; a rosette of big leaves at the base;
  the thick, unbranched stem [est].
- **Colours.** Bell `#B04F9B`, spots `#5A1E4A` with white halos `#F4EAF0`, leaves `#5A7A4A` with underside `#9AA890`.
  Pressed: purple → grey-mauve `#8E6A86` [src][nybg]. The bells press as flattened tubes [est].

### 2.20 Lavender (*Lavandula angustifolia*)

- **Habit.** A sub-shrub with a "well-developed woody base", about 2 ft [src][lav]. A dome of grey leafy shoots, with
  long, slender, bare flowering stems rising above it [est].
- **Stem.** Flowering stems are "slender and four-angled" [src][lav], 10–15 in long in 'Hidcote' [src][lav].
  Unbranched, straight, with 1–2 pairs of small leaves near the base [est].
- **Leaves.** "Linear to narrow-elliptic or narrow-oblanceolate, mostly 1 to 1¾ in. long and up to 3/16 in. wide,
  slightly revolute", "greyish at first, later greener" [src][lav]. That is 8–10 : 1. Opposite, in tufts on the woody
  shoots [est].
- **Inflorescence.** A terminal spike of whorls of paired condensed cymes (verticillasters); whorls "dense or, toward
  the spike base, widely spaced, with the lowest whorl usually distant from the rest" [src][lav]. Spike 2–4 in
  [src][lav]. 6–10 whorls of 6–10 flowers each [est].
- **Flower.**
  - **Calyx:** about 3/16 in, "thirteen longitudinal ribs", "tinged purple and usually densely woolly" [src][lav].
  - **Corolla:** "lavender-purple", upper lip 2-lobed, lower lip 3-lobed [src][lav].
  - **Bracts:** "papery, brown, and prominently veined" [src][lav].
  - In silhouette, the calyces make the spike's beaded outline [est].
- **Buds and seed.** Unopened spikes are a tight, grey-purple, beaded club. After flowering the calyces persist,
  greying [est].
- **Silhouette tells.** A long, bare, square stem; a narrow beaded spike with the lowest whorl separated by a gap; a
  tuft of needle leaves at the base [est].
- **Colours.** Corolla `#8C7BC4`, calyx `#6E5A8E`, leaves `#8FA08A` (grey). Pressed: the calyces hold their colour well
  and the leaves stay silvery (silver foliage holds [src][nybg]) → `#9A8FB0`.

### 2.21 Clover (*Trifolium pratense* red, *T. repens* white)

No species source could be fetched; everything here is [est].

- **Habit.**
  - **Red:** 20–60 cm, tufted and ascending.
  - **White:** creeping stolons that root at the nodes, with leaves and heads rising separately on long stalks to
    10–20 cm.
- **Stem.**
  - **Red:** hairy, slightly zigzag between nodes.
  - **White:** stolons lie flat with roots at the nodes, a good sheet feature.
- **Leaves.** Alternate and trifoliate (three leaflets) on petioles.
  - **Red:** leaflets elliptic to ovate, 1.5–3 cm, entire, with a pale crescent or V on each.
  - **White:** leaflets obovate to obcordate (notched tip), finely toothed, with a whitish chevron.
  - Stipules are membranous, sheathing, veined, with a bristle tip: drawn as a papery sheath at each node.
- **Inflorescence.**
  - **Red:** a dense globose to ovoid head 2–3 cm, sessile, with a pair of leaves directly beneath (like a collar).
  - **White:** a round head 1.5–2 cm on a long, leafless peduncle.
- **Flower.** 30–100+ tiny pea flowers (banner, wings, keel), each 1–1.5 cm (red) and pointing up and out.
  - **Recipe:** a sphere of short, upward-angled tubes on a Vogel spiral; in profile the outline is fringed.
- **Buds and seed.** Young heads are tight and green-tipped. In white clover, spent florets reflex downward and turn
  brown, giving a brown skirt under a white top. That is a key tell; draw some heads half-browned.
- **Silhouette tells.** Three-part leaves; pom-pom heads; red with a leaf collar under the head, white on a bare stalk
  with a reflexed brown skirt.
- **Colours.** Red clover `#C25A8E`; white `#F2EEE4` with brown `#9A7A5A`; leaf `#3E6E34` with chevron `#A8BC98`.
  Pressed: pink-purple fades to brown [src][nybg] → `#9A6A7A`; white → cream.

### 2.22 Queen Anne's lace (*Daucus carota*)

- **Habit.** A biennial: a first-year rosette of "ferny green leaves"; the second year "hollow, branched flower stems
  grow 2 to 4 feet tall" [src][daucus]. Branched candelabra-like, each branch ending in an umbel [est].
- **Stem.** Hollow, with "short, coarse hairs" [src][daucus]. Ribbed (striate) [est]. Thin (about 0.04 × the umbel's
  width) [est].
- **Leaves.** "Tri-pinnate", alternate, "the lower leaves are considerably larger than the upper ones" [src][daucus].
  - Recipe: a triangular-oblong blade of 3 orders of pinnae, the final segments small, narrow-lanceolate, about 1–2 mm
    [est].
  - The petiole has a sheathing base clasping the stem [est].
- **Inflorescence.** A compound umbel 2–4 in across of "up to a thousand tiny white flowers" with "a dark, purplish
  center" [src][daucus].
  - 20–50+ primary rays of unequal length, each ending in an umbellet of 15–60 flowers [est].
  - The umbel is flat to slightly concave in flower [est]. Outer flowers of the outer umbellets have one enlarged outer
    petal (radiant) [est].
  - **Involucre:** 7–13 conspicuous bracts, each pinnately divided into long, thread-like, forked segments, spreading or
    reflexed, about as long as the rays [est]. A key tell in profile.
- **Flower.** Florets of about 2–3 mm, five small petals, white; often a single dark purple floret at the centre
  [src][daucus].
  - **Plate views:** face-on lace disc; profile (the flat top on radiating rays over the forked bract ruff); the closed
    nest [est].
- **Buds and seed.** Young umbels are a tight, nodding cluster. In seed the head "curls inward to form a 'bird's nest'
  shape" and turns brownish, each stalk ending in "a small, bristly seed" [src][daucus].
- **Silhouette tells.** Radiating rays holding a flat lace top; the forked, thread-like bract ruff beneath; the curled
  bird's nest; ferny, finely cut leaves [est].
- **Colours.** Florets `#F5F3EC`, centre `#4A1F3D`, leaves `#5E7E3E`. Pressed: white → cream `#EEE3C6`; the lace
  flattens beautifully into a disc of dots on lines [est].

### 2.23 Hydrangea (*H. macrophylla*: mophead and lacecap)

The floret biology and pH colours are sourced; the leaves and habit are [est].

- **Habit.** A rounded deciduous shrub 1–2 m; specimens are a single flowering shoot about 30–40 cm [est].
- **Stem.** Stout, pithy, green to brown, with swollen nodes; branching opposite [est].
- **Leaves.** Opposite, broad ovate to elliptic, 10–20 cm, coarsely serrate, acuminate, thick, glossy, short-petioled,
  with strong pinnate veins of 6–9 pairs [est]. Recipe: ovate, 1.4–1.8 : 1, widest at 0.4, regular teeth [est].
- **Inflorescence.** Clusters [src][hydr]: a corymbose cyme [est].
  - **Mophead:** "globe-shaped flower clusters" [src][hydr], 12–20 cm, packed with sterile florets that "block access
    to the fertile ones" [src][hydr].
  - **Lacecap:** fertile florets exposed in a flat centre, ringed by a few large sterile florets [src][hydr].
- **Flower.** Two kinds: sterile florets "large, colourful", fertile ones "smaller and not showy but loaded with pollen
  and nectar" [src][hydr].
  - The colour is in "modified sepals" [src][hydr]. A sterile floret has 4 (3–5) petaloid sepals, broad ovate to round,
    2–4 cm across, often slightly toothed, with a tiny bead at the centre [est].
  - **Plate views:** a whole head in three-quarter (a dome of overlapping 4-part florets, each at its own tilt), one
    floret face-on [est].
- **Buds and seed.** Green, tight heads, colour flushing from the top. Old heads age to green, dusky red and parchment
  ("antique"), and stay on the plant into winter [est].
- **Silhouette tells.** A ball or flat disc made of hundreds of 4-part florets; big, opposite, toothed leaves [est].
  In a cyanotype, a head pressed whole is a dense, bulky white mass, so press loose florets or a lacecap ring [est].
- **Colours.**
  - Acid soil (pH 5.5 or lower) blue; alkaline (above 7) "pink or red"; in between purple or mixed; white stays white
    [src][hydr].
  - Blue `#7E9BD6`, pink `#E79BB8`, antique green `#9AA87E`.
  - Pressed: florets hold well [est], → `#8C9EC8` / `#D8A6B8`.

---

## 3. Procedural methods that read as real

### 3.1 L-systems (Prusinkiewicz & Lindenmayer, *The Algorithmic Beauty of Plants*)

- **Turtle grammar** [est]:
  - `F` moves forward and draws; `f` moves without drawing; `+`/`−` turn; `&`/`^` pitch; `\`/`/` roll; `|` turns
    180°; `[` `]` push and pop state (a branch).
  - Parametric modules carry values, e.g. `F(len, width)`; stochastic rules choose between productions with
    probabilities, so no two plants are identical.
- **Phyllotaxis in ABOP's own L-system** [src][abop4]:
  - `#define a 137.5`; `p1 : A(n) : * → +(a)[f(n^0.5)~D]A(n+1)`. Each module A places a floret at angle n·a and radius
    √n.
  - The cylinder version (cones, spikes): `#define a 137.5281`, `#define h 35.3`, `#define r 500`,
    `p1 : A : * → [&(90)f(r)~D]f(h)/(a)A`.
  - The *Carex* spike grows internodes by `IRATE 1.025` and spikelets by `SRATE 1.02` per step; spikelet growth stops
    at size 3 and the branch angle at 15°; branching `&(5)`, internode `F(0.2)`, roll `/(137.5)`.
  - These are concrete constants for a spike: lavender whorls, a foxglove raceme, a clover head on a short cylinder
    [est].
- **Development through organ type by index** [src][abop4]. The sunflower head uses one rule, with organ type switched
  by n: seeds for n ≤ 440, ray florets to 565, then petal types M, N, O and P to 610+, all in 630 steps. The **zinnia**:
  "petal size grows linearly with n", orientation changes linearly, "early petals are more vertical and later ones more
  horizontal". Use this for rose, peony and zinnia doubles.
- **Stage variation** [src][abop4]. The sunflower field shows "four stages (buds, opening, open, drooping petals)". It is
  modelled as a dibotryoid with basipetal flowering: the top flower opens first and lower ones follow.
- **Inflorescence architecture** [est] (ABOP ch. 3, not reached this session):
  - **Monopodial** (racemes, spikes, umbels): the apex keeps making buds, so it opens acropetally, bottom first, and the
    buds are at the tip. Foxglove, bluebell, lavender, lily clusters, cherry clusters, clover.
  - **Sympodial** (cymes): each axis ends in a flower, and growth continues from side buds below it, so the oldest
    flower is at the top or centre. Buttercup, forget-me-not's scorpioid cyme (all branches on one side, so it coils),
    hydrangea.
  - **Compound umbel:** rays from one point, each ending in a smaller umbel, the outer rays longer, so the top is flat.
    Queen Anne's lace.
  - **Capitulum:** a head of florets on a phyllotactic disc. Daisy, chamomile, cosmos, sunflower, zinnia, cornflower.
- **Tropism** [est] (ABOP ch. 2, not reached). A segment's heading H is bent toward a tropism vector T: rotate H about
  H × T by α = e·|H × T|, where e is a "susceptibility" constant.
  - **Gravity droop:** T = (0, −1) with e ≈ 0.05–0.25 per segment, larger for thin pedicels carrying heavy heads
    (bluebell crook, nodding poppy bud, lily pedicels).
  - **Phototropism/upright:** T = (0, +1) for main stems [est].
- **Space colonisation** for branching twigs and venation [src][colon][venation]:
  - Each node v grows toward the normalised sum of directions to its attraction points, n = Σ (s − v)/‖s − v‖.
  - A tropism bias: ñ = (n̂ + g)/‖n̂ + g‖ [src][colon].
  - **Kill distance d_k:** a point dies when a node comes within it. Examples use d_k = 2D to 20D and influence radii
    d_i = 8D to 17D or ∞ [src][colon].
  - Upward bias "produces pendulous branches" (Fig. 9) [src][colon].
  - **Pipe model:** r^n = r₁^n + r₂^n, n "usually between 2 and 3" [src][colon]. Venation uses n = 2, or 3 for its
    developmental model [src][venation].
  - **Open venation** (a tree) suits petals; **closed** (loops) suits leaves [src][venation].
  - Measured settings for real leaves are in its Table 1, e.g. poplar closed with d_k = 1 and b_s = 2, cherry open with
    d_k = 30 and b_s = 1 [src][venation].
  - Use it for the cherry twig's spurs and for leaf veins on large leaves (sunflower, hydrangea, foxglove) [est].

### 3.2 Vogel's golden-angle model

- **The model:** φ = n·137.5°, r = c·√n [src][abop4]; in polar form r(n) = √n, θ(n) = nφ, a Fermat spiral
  [src][maths].
- **The golden angle:** about 137.5°, (3 − √5)π radians [src][maths]. Its exact value is 360°·(2 − φ) =
  137.50776° [est, computed].
- **Sensitivity:** ABOP's Figure 4.2 shows 137.3°, 137.5° and 137.6° [src][abop4]; "the pattern breaks if the angle is
  off by one degree" [src][maths]. So jitter floret *size* and *position* slightly (±3–5 % of spacing), never the angle
  [est].
- **Cylindrical lattices** (spikes, cones) [src][abop4]:
  - φ = n·α, H = h·n, r constant.
  - For a (5, 8) contact pattern, α ∈ [135.918°, 138.140°].
  - Spacing of a triple-contact lattice: d = 2π / √(m² + mn + n²).
  - Rows from Table 4.1: (3,5,8) α = 135.918°, h = 0.111; (5,8,13) α = 138.140°, h = 0.042.
- **Leaf phyllotaxis up the stem.** Divergence fractions are 1/2 (distichous), 1/3 (beech), 2/5 (oak, apricot), 3/8
  (sunflower, poplar, pear) and 5/13 (willow, almond) [src][phyllo].
  - Opposite pairs at successive 90° are decussate [src][phyllo]: zinnia, cosmos, hydrangea, lavender [est].
  - In a 2D side view, alternate leaves at 137.5° alternate left/right irregularly and foreshorten: a leaf at azimuth θ
    projects with horizontal reach ∝ |sin θ| and comes forward or goes back by cos θ. That makes some leaves short
    (pointing at or away from the viewer) and some overlapping the stem [est]. This single projection removes most of
    the "fishbone" look.
- **Disc florets in perspective** [est]. Place them by Vogel in the head's plane, then project the plane with the head's
  tilt. A three-quarter sunflower disc is an ellipse whose florets foreshorten too.

### 3.3 Parametric leaf and petal outlines

- **The superformula (Gielis, 2003)** [est: the formula from memory; the paper was not reached]:

  r(θ) = ( |cos(mθ/4)/a|^n₂ + |sin(mθ/4)/b|^n₃ )^(−1/n₁)

  - m sets the rotational symmetry; n₁ the pinch; n₂ and n₃ the shape of the sides.
  - Starting values [est] (a = b = 1):
    - m = 1, n₁ = 0.5, n₂ = n₃ = 0.5: a teardrop or leaf with a point;
    - m = 2, n₁ = 1, n₂ = n₃ = 1: an ellipse (elliptic leaf);
    - m = 4, n₁ = 2–4, n₂ = n₃ = 4–8: rounded 4-lobed (hydrangea floret);
    - m = 5, n₁ = 0.3–1, n₂ = n₃ = 1: a 5-petal flower outline.
  - It is good for florets and kamon motifs. For botanical leaves it is too symmetric: it gives a polar outline about a
    centre, while a leaf grows from its base [est].
- **A width-profile model** (preferred for leaves and petals) [est]:
  - Midrib curve C(t), t ∈ [0,1], a quadratic or cubic Bézier with slight curvature and a twist.
  - Half-width w(t) = W·N·t^a·(1−t)^b, with N chosen so max w = W; widest at t* = a/(a+b) (§1.4).
  - **Asymmetry:** left and right halves get different W (±5–12 %) and slightly different a, b. Real leaves are rarely
    symmetric, and "perfectly symmetrical leaves" were one of the things Ruby flagged as cartoony (florals.md §8b).
  - **Base:** cuneate (w → 0 linearly), rounded (w ∝ √t near 0), cordate (add two lobes reaching back past t = 0),
    clasping (lobes wrap the stem).
  - **Tip:** acute (b ≈ 1), acuminate (b ≈ 1.5–2.5 plus a drip-tip extension), obtuse (b < 0.8), notched (subtract a
    small V at t = 1: violet and rose petals, cherry petals, white-clover leaflets).
  - **Margin:** add teeth as summed triangular waves along the arc length [src][venation]: amplitude 2–6 % of W,
    period 3–8 % of L, teeth asymmetric (steep side toward the tip) for serrate. Sum two frequencies for doubly serrate.
  - **Lobes and division:** recurse. Each lobe is its own small leaf on a secondary midrib from C(t_k), angle 30–60°
    toward the tip, shrinking toward the tip. Recursing twice gives bipinnate (cosmos, carrot); three times
    tripinnate.
  - **Petals:** the same model with a claw (narrow base) for rose, cherry and buttercup, a ray strap with 2–3 tip notches
    for daisy, an obcordate notch for cherry, a wedge (a > b) for cosmos.
- **Veins.** The midrib along C(t); laterals leave at t_k with spacing 6–12 % of L, at 35–60° to the midrib, curving
  toward the tip and fading before the margin (open) or looping (closed) [est]. Or grow them with space colonisation
  [src][venation]. Parallel venation for monocots (tulip, lily, iris, bluebell): 5–15 lines that follow the width
  profile [est].

### 3.4 Natural variation, droop and tropism

- **Per-organ jitter** [est]:
  - petal length ±8–15 %, width ±10 %, angle ±4–8° off the even step;
  - 1 in 5 petals tucked under its neighbour, 1 in 10 bent or turned;
  - per-leaf scale ±15 % about the expected size for its height on the stem.
  - Seed every jitter from the organ's index so a plant regenerates exactly.
- **Size down the stem** [est]. Leaf size follows a curve of node position u ∈ [0,1], base to top:
  - basal-dominant (daisy, foxglove, poppy, Queen Anne's lace, buttercup): size ∝ (1 − u)^0.8;
  - mid-peak (sunflower, lily): size ∝ sin(π·u^0.7);
  - near constant: poppy leaves are "nearly similar in size along the stem" [src][poppy].
- **Droop and gravity** [est]:
  - Apply the tropism rule (§3.1) per segment with e larger where the stem is thinner and the load further out:
    e_i ∝ (load beyond i)/(radius_i)^3, which is cantilever-like.
  - Leaves: the blade arches; the tip drops by 5–25 % of the length for strap leaves (tulip, bluebell, iris tips),
    10–40 % for soft broad leaves (foxglove, sunflower).
  - Petals: wilting rotates each petal down about its base, plus a tip curl that grows with stage (florals.md §1).
- **Tropism to light** [est]. Upper stems bend toward the light dial's azimuth by 5–15°, heads turning to face it (in the
  same spirit as the meadow's sunflowers facing the dial, florals.md §6).
- **Twist and turn-over** [est]. Every leaf gets a roll angle ψ along its midrib, plus a twist of ±20–40° over its
  length. Draw width × |cos ψ|; when cos ψ < 0, the underside shows: a paler, greyer colour (+12–20 % lightness, −15 %
  saturation) and raised veins. At least one leaf per sheet turned [src][rhs].
- **Wear** [est]. Lowest leaves yellowing or browning at the tips, one torn margin, an insect nibble on one leaf (a
  circular bite from the edge). Use them sparingly, but always some.
- **Pressed versus living pose** [est]. "Herbarium" mode keeps the jitter but flattens depth: overlaps are kept; the
  foreshortening of leaves in a turn shows as folds (the leaf creased along the midrib, one half over the other) rather
  than smooth perspective.

---

## 4. The most common mistakes that make generated flowers look clip-art, and the fix for each

| # | Mistake | Fix |
|---|---|---|
| 1 | **Radial perfection:** n identical petals at exact 360°/n | Jitter length, width and angle per petal (§3.4); tuck some under; use the species' real count range (oxeye 15–35 [src][oxeye], poppy 4 [src][poppy], anemone 5–8 [src][anem]) |
| 2 | **Every flower face-on** | Mix face, three-quarter and profile in each plant, plus buds and a spent bloom; the plate's canonical view per species (§2) is often profile: tulip, bluebell, foxglove, lily, chamomile [est] |
| 3 | **Fishbone leaves:** mirror pairs or left/right alternation, all flat | 137.5° phyllotaxis projected to the side view (§3.2), with foreshortening, overlap and one turned leaf showing its underside [src][rhs] |
| 4 | **Generic leaves:** one teardrop for all species | The species' arrangement, profile, margin and division (§2), from the width-profile model (§3.3); the leaf is often the species' best tell (poppy pinnatifid, iris fan, hydrangea opposite toothed) |
| 5 | **Constant-width ruled stems** | Taper and narrow after branches (pipe model [src][colon]); gentle S curve and droop (§3.4); hairs drawn on the outline where the species has them (poppy, cornflower, foxglove) |
| 6 | **Uniform black outline** | No outline for lit or pressed media; for line media, varied, tapering line, heavier on the shadow side, gaps at highlights [src][craft], the outline inside the silhouette [src][crane] |
| 7 | **No development** | Inflorescence order (§3.1): racemes bud at the top, cymes open at the centre; seed heads, capsules and hips [src][abop4] |
| 8 | **Floating flower with no base** | Root down [src][getty]: roots, bulb, tuber or rosette for herbs; a cut woody end with tape for twigs [src][rhs] |
| 9 | **Saturated, flat, unchanged colour** | Separate greens per organ, petal colour varying toward the base and veins; in pressed mode, apply the colour-retention rule [src][nybg] and the brown edges |
| 10 | **Sticker-like flatness in pressed mode** (opaque, no overlap) | Thin tissues partly transparent with overlaps darker; bulky parts thick (they "resist" pressing [src][hagley]); a hairline shadow and a ghost stain [src][hagley] |
| 11 | **Wrong species signature** (a "lily" with 5 petals, a "foxglove" with bells all round) | Encode each species' tells (§2) as hard constraints: one-sided raceme for foxglove and bluebell [src][foxg][blueb], six tepals for lily and tulip [src][turk][tulip], falls and standards for iris [src][iris] |
| 12 | **Centred, symmetric composition** | Off-centre diagonal habit, curved to fit the sheet [src][getty], long stems folded [src][rhs], label region bottom right [src][rhs], negative space [src][craft] |
| 13 | **Phyllotaxis jitter in the angle** | Never jitter the 137.5° step: the pattern breaks [src][maths]; jitter floret size and radius instead |
| 14 | **Petals as plain ellipses** | Petal profiles with claws, notches, ruffles and creases (§3.3); poppy petals crumpled [src][poppy], cosmos tips toothed, cherry notched [est] |

---

## Sources (fetched and read this session)

[harper]: https://lizzieharper.co.uk/?p=3070
[rhs]: https://www.plantheritage.org.uk/media/1894/rhs-guide-to-making-herbarium-specimens.pdf
[ncbg]: https://ncbg.unc.edu/2022/04/05/pressing-matters-how-to-make-an-herbarium-specimen/
[nybg]: https://www.nybg.org/blogs/plant-talk/wp-json/wp/v2/posts/6092
[hagley]: https://www.hagley.org/librarynews/conservation-peter-lindtner-herbarium-plants-hagley-yard
[getty]: https://museum-essays.getty.edu/photographs/atkins-british-algae/
[pdr]: https://publicdomainreview.org/collections/cyanotypes-of-british-algae-by-anna-atkins-1843/
[buds]: https://budsandtendrils.substack.com/p/how-to-keep-the-colour-in-pressed
[crane]: https://www.gutenberg.org/cache/epub/25290/pg25290-images.html
[craft]: https://www.craftionary.net/?p=31207
[abop4]: https://algorithmicbotany.org/papers/abop/abop-ch4.pdf
[venation]: https://www.algorithmicbotany.org/papers/venation.sig2005.pdf
[colon]: https://www.algorithmicbotany.org/papers/colonization.egwnp2007.pdf
[phyllo]: https://en.wikipedia.org/wiki/Phyllotaxis
[maths]: https://thatsmaths.com/2014/06/05/sunflowers-and-fibonacci-models-of-efficiency/
[cam]: https://www.cam.ac.uk/research/news/why-buttercups-reflect-yellow-on-chins
[oxeye]: https://illinoiswildflowers.info/weeds/plants/oxeye_daisy.htm
[chamo]: https://m.illinoiswildflowers.info/weeds/plants/ger_chamomile.htm
[poppy]: https://gobotany.nativeplanttrust.org/species/papaver/rhoeas/
[fna-ha]: https://floranorthamerica.org/Helianthus%20annuus
[cornfl]: https://minnesotawildflowers.info/flower/cornflower
[anem]: https://en.wikipedia.org/wiki/Anemone_coronaria
[peony]: https://en.wikipedia.org/wiki/Paeonia_lactiflora
[tulip]: https://en.wikipedia.org/wiki/Tulip
[turk]: https://illinoiswildflowers.info/savanna/plants/turkcap_lily.htm
[iris]: https://backyardnature.net/fl_iris.htm
[prunus]: https://www.treesandshrubsonline.org/articles/prunus/prunus-serrulata/
[myos]: https://naturblick.museumfuernaturkunde.berlin/species/portrait/373?lang=en
[viola]: https://en.wikipedia.org/wiki/Viola_(plant)
[blueb]: https://www.discoverwildlife.com/plant-facts/flowers/bluebells-identify-species-where-to-see
[foxg]: https://plants.ces.ncsu.edu/plants/digitalis-purpurea/
[lav]: https://www.treesandshrubsonline.org/articles/lavandula/lavandula-angustifolia/
[daucus]: https://hort.extension.wisc.edu/articles/queen-annes-lace-daucus-carota/
[hydr]: https://www.gardensbythebay.com.sg/en/learn-with-us/explore-resources/whats-blooming/hydrangea.html
[rose]: https://garden.org/ideas/view/Calif_Sue/1187/An-Explanation-of-Rose-Shapes-and-Types/

Also read, not cited above: Stavenga, Staal & van der Kooi 2020, on conical petal cells reducing gloss (the velvet
matte of most petals versus a buttercup's gloss): https://pubs.rsc.org/en/content/articlehtml/2020/fd/d0fd00055h

**Blocked or unreachable this session** (to fetch in a follow-up): Kew botanical-illustration guidance; ASBA; NYBG Steere
Herbarium; Smithsonian; JSTOR Global Plants; Wikimedia Commons herbarium sheets; eFloras / Flora of China; POWO; the
Wikipedia pages for *Cosmos bipinnatus*, *Zinnia elegans*, *Ranunculus acris*, *Rosa canina*, *Bellis perennis*,
*Viola odorata*, *L-system* and *Golden angle*; ABOP chapters 2, 3 and 5; Gielis 2003 (superformula). The Atkins &
Dixon *Cyanotypes of British and Foreign Flowering Plants and Ferns* (1854) is known only by title [src][pdr]; no plate
images were examined.
