# Ornamental Borders: Prior Art for Vellum

**Key.** **[src]** = stated in a consulted source, linked to its URL. **[est]** = my own estimate or synthesis (including standard maths written from memory), not stated in any consulted source.

---

## 0. Method and gaps

I read primary design writers, generative-ornament papers, and craft and trade notes:
- **Primary design writers:** Owen Jones, William Morris's *Some Hints on Pattern Designing* and *The Ideal Book*, Walter Crane's *Line and Form*.
- **Generative-ornament papers:**
  - Wong, Zongker and Salesin 1998, read in full;
  - Hamekasi and Samavati 2012;
  - Xu and Mould 2009;
  - Lopyrev 2016;
  - Runions et al. 2005 and 2007;
  - Levien 2009.
- **Craft and trade notes:** blacksmithing, building conservation, letterpress fleurons, guilloché, Illustrator pattern brushes.

Several sources could not be read:
- **Lewis F. Day, *Pattern Design*, chapter "Borders."** The OCR I could reach stopped before it, so only its figure captions are used.
- **F. S. Meyer, *Handbook of Ornament*.** The fetch failed.
- **The English Wikipedia *Arabesque* article.** It redirects, which the fetch tool blocks.
- **The British Library glossary of manuscript terms.**

This session's web-search budget also ran out before I could find a dedicated Art Nouveau source. The Art Nouveau section is therefore mostly [est].

---

## 1. The governing rules of ornament (they apply to every border)

**Owen Jones, *The Grammar of Ornament* [src][jones]:**
- Prop. 6: "Beauty of form is produced by lines growing out of one from the other in gradual undulations."
- Prop. 8: "All ornament should be based upon a geometrical construction."
- Prop. 9: every member should be "a multiple of some simple unit," and the best proportions are those "most difficult for the eye to detect."
- Prop. 11: "all lines should flow out of a parent stem… Every ornament, however distant, should be traced to its branch and root."
- Prop. 12: "All junctions of curved lines with curved or of curved lines with straight should be tangential."
- Prop. 13: flowers are to be used as "conventional representations," not copied.
- Gold ornaments take black outlines, and colours are separated by edgings of white, gold or black.

**Wong, Zongker and Salesin's principles [src][wong]:**
- **Repetition:** translation, rotation, reflection, glide, radiation, and "organic variation."
- **Balance:** includes **uniform density** (*horror vacui*), and lines answering one another (after Crane).
- **Conformation to geometric constraints:**
  - fitting a meander's period to the panel;
  - **tangential junction**;
  - elements at "signal geometric points" (maxima of concavity or convexity);
  - **"dedicating elements to corners"**;
  - following the region's skeleton;
  - hierarchical subdivision.
- **Growth, intention and conventionalization**, which they define as "inventive prefiltering of phenomenal reality followed by a creative resynthesis of form."

**William Morris [src][hints]:**
- "Rational growth is necessary to all patterns, or at least the hint of such growth."
- Lines must be "strong and crisp," never "thready or flabby."
- Even an ending line should suggest it could keep growing.
- "avoid vagueness… definite form bounded by firm outline."
- Prefer familiar plants: "the rose, the lily, the tulip, the oak, the vine."

**Walter Crane [src][crane]:**
- A curve "is a proposition or question" answered by a corresponding curve, and this "forms the basis for a scroll design."
- "A spiral curve is a harmonious line… repeat it, reversed, and you prolong the harmony."
- "the shape of the space must influence the character of the filling."

**What these rules ask of the code [est]:**
- Every element is attached to a parent stem.
- Every junction is G1, tangent-continuous.
- Spirals alternate their turning sense.
- Density stays even.
- The repeat fits the frame exactly.
- The corners are designed, not cropped.

---

## 2. Frame proportion and the page

- **Margins.** Morris: "the hinder edge (that which is bound in) must be the smallest member of the margins, the head margin must be larger than this, the fore larger still, and the tail largest of all." The two-page opening is "the unit of the book." Ornament "must form as much a part of the page as the type itself" [src][ideal].
- **Border members and width.** Morris: "All borders should be made up of several members, even where they are narrow," and "The bigger your cloth is the narrower in comparison should be your border" [src][hints].
- **Persian carpet borders.** In Crane's example, "the border proper inclosed in two bands of about the same width," with no blank, unbroken strip around the field [src][crane]. This is the classic *guard–main band–guard* triple [est].
- **A Kelmscott measurement.** One Morris border piece is L-shaped, 103 × 181 mm, with a band 25 mm wide [src][kelm].
- **Manuscript terms.** A *bar border* is a "solid decorative border extending around three or four sides of the writing space" [src][nott].
- **Proposed defaults for Vellum [est]:**
  - main band 5–9 % of the page's short side, plus two guard rules of about 1/8 of the band each;
  - inner gap to the text of about 1/3 band;
  - Morris's margin order (inner < head < outer < tail) when a page is meant as a book page, and equal margins when it's a single card;
  - narrower relative bands on larger pages (Morris).

---

## 3. Corners: how a border turns

There are five sourced corner strategies. A seed should pick one:

1. **Run on round the corner.** Morris: borders should "turn corners and run on rather than stop at a rosette" [src][hints]. The vine bends on a quarter arc and keeps growing. The corner bay holds a leaf cluster or a spiral that opens *into* the corner [est].
2. **Dedicated corner element.** This is a rosette, fan, palmette or cartouche. Wong's "dedicating elements to corners" [src][wong]. Letterpress fleuron borders depend on matching corner pieces, and Simon Oliver warned that a flower "with corner pieces that can be repeated" is "no easy undertaking" [src][jury]. Some flowers were cast as pairs [src][jury].
3. **Mitred mirror.** The side design is reflected across the 45° diagonal. In the Kelmscott example, one short border was made by the engraver "mirror-reversing Morris's left-hand short border" [src][kelm]. Day's figure captions include "Border design turned over in each direction" and "The border in relation to the corner" [src][day].
4. **Growth from corners to mid-sides.** Each side grows from both corners and meets a symmetric boss at mid-side, or the reverse. Day's caption reads "Border growing alternately from either side" [src][day]; growing from the corners is my reading [est].
5. **Breaks.** The border is interrupted by panels or blocks. Day's captions are "Breaks in the border" and "Block or panel border" [src][day].

**Fitting the repeat.**
- Illustrator's pattern brush has a side tile, outer- and inner-corner tiles, and start and end tiles. Corners can be generated automatically, and the fit options are "Stretch to Fit," "Add Space to Fit" and "Approximate Path" [src][adobe].
- A compositor would "set a corner first," then turn units or choose others until the run fitted [src][jury].
- Wong lists fitting "a meander's period to the panel" as a principle [src][wong].
- **Algorithm [est]:** set `n = round(L_side / u₀)` and `u = L_side / n`, so stretch stays within about ±12 %. When the long and short sides need different stretch, use different `n` per side, but give both the same phase at the corners.

---

## 4. How scrolls spiral

- **Ionic volute constructions [src][volute]:**
  - Vitruvius: quarter circles from a compass, "decreasing by one-half unit the distance from the center of the eye at each successive quarter-circle."
  - Alberti: two centres, semicircles, "two turns and the distance between them remains constant."
  - Serlio: six centres, three turns.
  - Salviati, simplified by Palladio and Vignola: twelve centres and twelve quarter-circle arcs, "approximately a series of truncated Archimedean spirals."
  - Philandrier–Dürer: 24 points.
- **Blacksmith layout [src][anvil]:**
  - A grid of "concentric circles 1/2" (13mm) apart and divided into right angles, 45's and 22.5's."
  - Step one circle outward per radial line. Skipping lines gives "a slower, tighter spiral," and using every line gives "a faster more open spiral."
  - "All true spirals are mathematically progressive."
  - Tapering stock "forges more naturally into a scroll."
  - Using the same jig for both ends of an S-scroll "gives a pleasing sense of continuity."
- **Persian circle-arc spirals [src][hamekasi]:**
  - Spirals are built from tangent circle arcs: "reduce the radius of the inner circle by a constant value."
  - "number of the turns of a spiral should be proportional to the size of its outer circle."
- **Euler and log-aesthetic curves [src][levien]:**
  - The Euler spiral's "curvature varies linearly with arc length."
  - Its curvature is monotone, so it has no curvature extrema, which the visual system is sensitive to.
  - The log-aesthetic family is κ = c·s^α.
  - Respondents in Levien's user study preferred an exponent around 1.5–2.
- **Magnetic curves [src][xu]:**
  - A charged particle in a constant field follows F = q v × B, with charge q(t) = (T − t)^(−α). This gives "constantly and smoothly varying curvature," following Ruskin's "steady change… from less to more curvature."
  - Flipping the sign of q reverses the turn.
  - Larger T and α give larger curves and tighter spirals.
- **Logarithmic spiral [est].** r = a·e^(bθ) is self-similar, so each turn is a scaled copy. It is the natural choice for a volute that should look "the same" at any size. A **clothoid** suits the *entry* of a scroll, where a straight stem must ease into the curl. In practice, the best scroll is a clothoid lead-in plus a log or Archimedean coil plus an eye or terminal.

**Recommendation [est].** Define a scroll by its curvature function κ(s) and integrate it: θ(s) = ∫κ, then x, y = ∫(cos θ, sin θ). Every source above is then one profile:
- Euler: κ linear in s.
- Log-aesthetic: κ = c·s^α.
- Volute: piecewise-constant κ, a run of circle arcs.
- Magnetic: κ ∝ q(t).

The integral turns them all into the same part, so one integrator node covers them all.

---

## 5. Stems, leaves and branching

- **Phyllotaxis [src][phyllo]:**
  - Distichous alternate leaves are offset by half a rotation.
  - Spiral arrangements use Fibonacci fractions (2/5, 3/8, 5/13).
  - Opposite pairs are a "whorl of two," and decussate pairs turn 90° per node.
  - Whorls are "fairly unusual" outside short internodes.
  - **In a flat border [est],** spiral phyllotaxis projects to *alternate*, so use alternate or opposite.
- **Wong's leaf rule [src][wong].** A leaf attaches at the stem midpoint at a right angle, with tangent angles ±π/4, and only on stems longer than a threshold. Their willow pattern "grows stems with alternating leaves" but was judged "jumbled in comparison to the more elegant original," because leaves need rhythm, not just alternation.
- **Wong's spirals [src][wong].** These are "equal-angle spirals made of multiple curved segments." Each curve has "the opposite orientation from its parent" (Crane's question and answer). The repeat period follows "the changing width of the space" and simplifies in narrow areas.
- **True scrolls [src][scroll]:**
  - The main stems "typically do not cross."
  - "Running scrolls" fill narrow bands, friezes and borders.
  - Vine is the true climber with tendrils, while acanthus, lotus and peony are conventionalised.
  - The basic arabesque is "a heart shape made from two confronted volutes on stems."
- **Space colonisation [src][colon]:**
  - Attraction points sit inside an envelope.
  - Each point links to its nearest node within the influence radius di.
  - A node grows one step D along the normalised sum of the directions to its points, and points die at kill distance dk.
  - Smaller di gives "wiggly or gnarly" tips, and larger dk gives sparser, smoother branches.
  - Branch radii follow rⁿ = r₁ⁿ + r₂ⁿ, with n "usually between 2 and 3."
  - **As a border fill [est],** this works for thorny briar, hawthorn and wild-rose borders, not for classical scrolls, which are planned rather than grown toward light.

---

## 6. The styles

Each style has rules, a procedural recipe [est], and a look.

### 6.1 Running vine scroll, rinceau, acanthus scroll
- **Rules:**
  - A wave stem carries an alternating series of spirals.
  - Each spiral branches tangentially from a crest (Jones 12 [src][jones]) into the bay on the opposite side from the last.
  - It turns the opposite way to its parent (Wong [src][wong]) and ends in a flower, rosette, bud or leaf.
  - Stems don't cross [src][scroll].
  - Acanthus leaves sheathe the branch points [est].
  - Inhabited scrolls put creatures in the coils, often out of scale [src][scroll].
- **Recipe [est]:**
  1. The spine is a sine wave along the frame path, with period u (the repeat) and amplitude 0.25–0.35 band.
  2. At each crest, offset one quarter period, branch a log-aesthetic spiral of 1–1.75 turns into the bay. Alternate its sense.
  3. Terminate it with a species flower from Vellum's flower models, scaled to the spiral's eye.
  4. Fill remaining gaps with secondary tendrils and leaves by largest-empty-circle growth (Wong) at decreasing size.
- **Proportions [est].** The flower diameter is about 0.4–0.6 band. The spiral eye is half the flower. The stem tapers from about 6 % to 2 % of band width.

### 6.2 Leaf garlands and wreaths
- **Rules [est].** Leaves are laid in overlapping, scale-like succession along a path. They all point one way, the way a bound laurel or bay garland does.
  - A **wreath** meets itself head to tail, often at a ribbon tie, or it starts as two branches from the bottom centre that meet at the top.
  - A **garland or swag** hangs in catenary curves between ties or rosettes.
  - Leaves alternate sides with slight random rotation (phyllotaxis [src][phyllo]), plus berries or small flowers every 3–5 leaves.
- **Recipe [est].** Follow the path. For each step, place a leaf on the left or right at an angle of 25–40° to the tangent, overlapping the previous one by 30–50 %. Run the leaf direction toward the tie points. Bend swags as y = a·cosh(x/a).

### 6.3 Rosettes
- **Rules [est].** A rosette has radial symmetry with 5, 6, 8 or 12 petals (radiation in Wong's list [src][wong]). It sits at corners, mid-sides or junctions. Morris prefers running borders to rosette stops, so use rosettes as nodes, not as the default [src][hints].
- **Guilloché rosettes** are "a series of nested additions and multiplications of sinusoids," bounded by inner and outer envelope curves [src][mathw]. A rose engine is "a lathe with an eccentric cam that moves the cutting head in a programmed path" [src][fontlab]. Spanish notes put guilloché in their corners and frames [src][colecc].
- **Recipe [est].** In polar form, r(θ) = R₀ + Σ aᵢ sin(kᵢθ + φᵢ). Draw N phase-shifted copies of the curve between two envelopes.

### 6.4 Wrought-iron flowers and scrollwork
- **Rules:**
  - Early 18th-century work used "sinuous bar work often terminating in leaves and flowers" in flat panels [src][bcon].
  - Bars are joined by **collars**, which "wrap tightly around two or more parallel pieces" [src][bcon].
  - Repoussé leaves and flowers are "hammering thin sheet metal… set in pitch" [src][bcon].
  - Scrolls follow the progressive grid, and S-scrolls use matching ends [src][anvil]. Bars taper into the scroll [src][anvil].
  - Wrought-iron spreading scrolls with flowers are on a door of Notre-Dame, from the 12th–13th century [src][scroll].
  - Cast iron is moulded, mass-produced and "equally attractive" in different forms [src][bcon].
- **Recipe [est]:**
  - Build from **C- and S-scrolls of constant bar width**, with a taper only at the eye.
  - Collar every place two scrolls touch tangentially, as a small band 1.5–2× bar width long.
  - Terminals come from a short list: snub, fishtail or "bean" [src][anvil], leaf, bud or rosette.
  - Panels are mirror-symmetric about the vertical (the gate habit) [est].
- **Look:** a silhouette with no hairlines. Light catches the edges of the bars, and repoussé leaves are domed.

### 6.5 Victorian frames, printers' flowers, botanical letterhead frames
- **Rules:**
  - Fleurons "set solid" make grounds, or "running" make borders [src][arrange].
  - Corners need matching corner pieces, and combined flowers interlace so much that it's hard "to tell where a pattern begins or ends" [src][jury].
  - Fleurons were cheap after Monotype, and Fournier gave the Rococo revival its "florid form" [src][jury].
  - Bruce Rogers experimented with "a small case of borders" [src][arrange].
- **Recipe [est].** Use a **tile system**: side unit, rotated unit, and corner unit. Units are rotated 0/90/180/270° and mirrored. Botanical letterhead frames sit within this family: a thin double rule, a corner spray, often a single botanical vignette top centre, with the text block enclosed.

### 6.6 Art Nouveau (mostly [est], source gap)
- **Rules [est]:**
  - Whiplash curves: long S-curves whose curvature rises sharply at one end, in effect high-α log-aesthetic curves.
  - Asymmetric but balanced.
  - Stems rise vertically, then burst into a flower head at the top corners.
  - Frames often end in arches or circles behind a figure.
  - Lines are uniform, mid-weight contours.
  - Lilies, irises, poppies, peacock-eye motifs.
- **Recipe [est].** Two tall stems up the sides with Euler-spiral lead-ins, flowers at the top corners, roots tangled at the base. Mirror is optional, with deliberate mismatch.

### 6.7 Arts and Crafts (William Morris)
- **Rules:**
  - The continuous pattern's two main forms are "the branch formed on a diagonal line" and "the net" [src][hints].
  - Hide the construction, but let viewers "trace it out" [src][hints].
  - Borders have several members [src][hints].
  - Morris drew borders with India ink and Chinese white, from only "slight pencil indications of the main stems." He treated the design as "grown" as he went, solving turns as they came: "the forms were led along and bent over and rounded at the edge with definitive pleasure" [src][kelm].
  - Kelmscott borders were vine-based, printed black from a block engraved by Hooper, together with the initial and headings [src][bryars].
- **Recipe [est].** Dense foliage on a black or dark ground, with white "reserved" leaves outlined. One main stem per side meanders diagonally. Leaves fill the space completely (horror vacui), and grapes or flowers punctuate.

### 6.8 Illuminated manuscript borders
- **Rules:**
  - Scrolls were "mostly used for borders in illuminated manuscripts" [src][scroll].
  - Borders are drawn "around the writing space," and bar borders run three or four sides [src][nott].
  - Johnston's chapter "A Theory of Illumination" was found but not readable [gap].
  - **Gothic and Book of Hours conventions [est]:**
    - a gold or colour bar along the text;
    - sprays of hairline stems with ivy leaves (gold, red, blue) breaking out of it;
    - the full border fills the margins and grows from the initial letter.
- **Recipe [est].** A bar along one or more text edges. From the bar, hairline tendrils grow by space colonisation into the margin, with ivy-leaf terminals in two or three colours plus gold. Density stays uniform (horror vacui).

### 6.9 Engraved banknote and certificate borders
- **Rules:**
  - Guilloché is "interlocking curves no hand can reproduce consistently," made by rose engine [src][fontlab].
  - Intaglio ink sits raised, and you can feel it [src][fontlab].
  - Desvignes's 1827 "Speiragraph" was a geared drawing machine [src][fontlab].
  - Spirograph-style curves were combined with the rose engine for security marks [src][colecc].
- **Recipe [est]:**
  - **Bands:** n phase-shifted copies of y = A·sin(2πx/λ + φᵢ)·m(x), where m is an envelope or a second sinusoid, along the frame path.
  - **Corners:** epitrochoid rosettes.
  - **Text cartouches:** lathe-work ovals.
  - **Lines:** very fine (0.1–0.2 mm at print scale) and uniform.
  - **Colour:** a single ink colour per layer.

### 6.10 Islamic arabesque
- **Rules:**
  - Endless and "can be infinitely expanded to cover a surface of any size" [src][scroll].
  - Elements "appear to grow from one another" in a "seamless, rhythmic pattern in which no element appears to move into the foreground" [src][ebsco].
  - A stem "loops back on itself, splits in two at a leaf-fork, and returns." The split halves mirror each other [src][satyori].
  - Palmettes, split palmettes and half palmettes sit at forks and ends [src][satyori].
  - The layout follows bilateral, 4-, 8- or 12-fold axes [src][satyori].
  - In Ottoman work, *hatayi* flowers are "symmetrical on a vertical axis." *Rumi* derives from stylised wings, and *bulut* is the cloud band [src][ottoman].
  - The illuminators "primarily utilized gold and navy blue" [src][ottoman].
  - Persian floral patterns are built on spirals [src][hamekasi].
- **Recipe [est].** Hamekasi and Samavati's pipeline (section 7.2). Frames are a guard rule, a main band of a *rumi* or *hatayi* scroll on a lapis ground, and another guard rule. Corners are bilaterally symmetric, with a palmette on the diagonal.

---

## 7. Procedural generation literature

### 7.1 Wong, Zongker and Salesin, "Computer-Generated Floral Ornament," SIGGRAPH 1998 [src][wong]
- **Scope.** Floral growth *within panels*. Bands, half-open borders and the open plane are excluded, as are strict symmetries.
- **Adaptive clip art.** The rules encode a pattern so that it "regenerates to fill" any reshaped region.
- **Two parts:**
  - **elements** (flowers, leaves, stems), each with simple **proxies** used for spacing and collision;
  - **growth rules**, which run on a parent element, query the environment, and create children.
- **Why not L-systems.** Three reasons:
  - they wanted to "model the appearance of an ornament rather than some underlying process," with "tighter control";
  - environment feedback is easier to express procedurally;
  - **serial** rule application permits a form of global planning.
- **Engine.** About 600 lines of Perl and 3,600 lines of C++, with PostScript output.
  - Users place **seeds**.
  - The loop finds the **largest empty circle** not touching the boundary or an element, using a Manhattan-distance medial axis on a low-resolution buffer.
  - It tries nearby elements' rules in order, nearest first, and on failure adds the circle's centre to an **exclude list**.
  - The authors summarise it as growth into "the largest empty circle adjacent to the growing ornament."
- **Examples:**
  - flowers with radius 3, placed up to 10 units toward the goal;
  - leaves 3 units long at the stem midpoint, at right angles, tangent angles ±π/4, only on stems over 8 units;
  - spirals of curved segments, each with the opposite orientation to its parent;
  - a Chinese vase pattern with flowers on a grid;
  - a hierarchical vine pattern, main vines first;
  - a willow pattern, judged weaker;
  - bamboo spirals, judged the best.
- **Rendering.** Default outlines, custom PostScript, or skeletal strokes. One design is shown in four stroke styles, and reversing line-width variation gives a "filigreed" effect.
- **Limits and future work.** Weak global planning, since growth is always from the nearest element. Future work: authoring tools, manifolds, balance and symmetry planning, and "artist in the loop." Fully automatic generation is suited to web pages.
- **For Vellum [est].** Adopt the *element plus proxy plus rule* split and the largest-empty-circle filler. Their scope gap, bands and borders, is exactly what the border path follower adds: a planned spine plus Wong-style fill.

### 7.2 Hamekasi and Samavati 2012, Persian floral patterns by circle packing [src][hamekasi]
- They separate combinatorics from geometry. Spirals are circle arcs, and the stem is a tree in a circle-tangency graph.
- Thurston-style packing sets the radii, and "balanced combinatorics" (vertex degrees close together) gives visual balance.
- Symmetry is encoded in the combinatorics, which gives imperfect symmetry.
- Boundaries: push, scale or "cookie cut" the packing.
- Boundary spirals should be **leaves of the stem tree**, which reduces visual weight at the edges.
- Ornaments go in leftover circles inside each spiral.
- Their critique of Wong: it "does not provide a mechanism" for balance.

### 7.3 Xu and Mould 2009, Magnetic Curves [src][xu]
- Particles in a magnetic field with charge q(t) give curves whose curvature changes smoothly.
- Branching: child particles are released at intervals with random charge sign.
- Packing:
  - a cell-occupancy grid;
  - a curve ends when it leaves the region or crosses a previous curve;
  - it retries with smaller (T, α) pairs, so large curves fill first.
- Example values: T = 650/450/250/50 and α = 0.8–0.65.
- Applications: a Klimt-style tree, window ornament (one side built, then mirrored), hair, flames.
- Limits: "Exact control over the path is difficult."

### 7.4 Lopyrev 2016, floral ornament from magnetic curves [src][lopyrev]
- A practical blog implementation: q(t) = (T − t)^(−α), forward Euler with dt = 1, and Catmull–Rom smoothing.
- Child charge sign flips for every second sub-particle, so neighbours curl apart.
- Children may not be longer than their parent.
- Four levels with stroke widths that taper.
- Leaf, flower and bud clip-art sit at sub-particle starts, aligned to the initial velocity.
- The author judges Wong's results "significantly more attractive."

### 7.5 Runions et al. 2005 and 2007, venation and space colonisation [src][venation][colon]
See section 5. The 2005 paper also gives closed (looping) venation through relative neighbourhoods, and marginal versus uniform growth. Ivy-leaf manuscript sprays and briar borders are its best border uses [est].

### 7.6 Levien 2009 [src][levien]
The Euler spiral is the generating curve for a fair interpolating spline, and log-aesthetic curves "may be even better" for some uses. Use it for user-drawn spines: Spiro-style control points through which the vine passes.

---

## 8. Borders printed in the Part A media

These pair the border with the media in `floral-imprints.md`.

- **Chalk on dark paper.** Place outlines *outside* the silhouette for light-on-dark forms [src][crane]. Leave large areas of untouched ground, or it looks "chalky" [src][wilson]. Hatch leaves along their axis. A chalk border is best as a loose running vine or a wreath, since guilloché is impossible by hand [est].
- **Cyanotype.**
  - A photogram border is made of real objects. Lace, cheesecloth, roots and Spanish moss are used as masks in wet cyanotype [src][alt-wet].
  - Atkins made her name plates and title pages as cyanotypes too [src][getty].
  - A border of lace or of pressed fern fronds laid end to end around the sheet is the authentic form. It needs the same soft-edge and transmission developer as the floral imprint [est].
  - A painted-on border shows as brush-coat edges [src][ap-tips].
  - Wrought-iron scrollwork laid on a cyanotype would be fully opaque. It would give a crisp white silhouette with soft edges wherever the bar's thickness held it off the paper [est].
- **Emboss and deboss.**
  - Leave clear space between lines [src][bw].
  - Depth runs 0.004–0.025 in, with flat, bevel, V or rounded "sculptured" profiles [src][billerud].
  - Karazuri is the historical blind-embossed floral [src][famsf].
  - Guilloché bands need the finest die and are best done shallow [est].
- **Foil.** Lines of at least 0.5 pt with gaps of at least 0.5 pt, no large solids, and screens below 20 LPI [src][zazzle][aura]. Foil suits thin rule-plus-corner frames, fleurons and Art Nouveau contours. Dense Morris foliage would fill in [est].
- **Wrought iron in silhouette.** Constant bar width, collars, tapered eyes [src][anvil][bcon]. Silhouettes print well as stamp, riso or cyanotype, because the forms have no hairlines [est].
- **Guilloché.** At home in intaglio and foil-like single-ink layers. Its raised intaglio ink is tactile [src][fontlab], so in Vellum it should write to the height map as well as albedo [est].

---

## 9. Recommendations for Vellum

The house rules apply: general parts, at most one new process part, hues from inputs, lit from maps by the Light Engine.

### 9.1 What Vellum can do that others don't [est]
Stock border clip-art is fixed and gets stretched at the corners. Wong's system grew panels, not borders.

Vellum can:
- **Regenerate** a border for any page aspect with designed corners (adaptive clip art for frames).
- Grow it from the **same species models** as the imprints, so a poppy wreath matches a poppy cyanotype.
- **Render one border through any medium developer**, lit live: foil glints as the light dial moves, emboss shadows swing.

### 9.2 Parts
1. **Frame path.** A rectangle, rounded rectangle, arch, oval, or a user spline (Euler-spiral spline [src][levien]). It outputs arc-length-parameterised sides, corner positions, inner and outer normals, and band width (default 5–9 % of the short side [est]). It applies Morris's margin order as an option [src][ideal].
2. **Repeat fitter.** Per side, `n = round(L/u₀)` and `u = L/n` [est]. It reports corner phase so that adjacent sides meet in phase. Modes are stretch, add-space and approximate, as in Illustrator [src][adobe].
3. **Corner planner** (seed-chosen):
   - run-on [src][hints];
   - dedicated corner element [src][wong][jury];
   - mitred mirror [src][kelm][day];
   - corner-to-centre growth [src][day];
   - breaks/panels [src][day].
   It outputs a corner "bay" region with its own spine stub.
4. **Spine follower.** Lays a wave or meander, or a straight bar for manuscript and Victorian rules, along the fitted path. It writes the parent-stem curve and tangents. Every later junction joins it tangentially [src][jones].
5. **Curvature integrator.** The single *new process part*. It takes κ(s) profiles (Euler, log-aesthetic, circle-arc volute, magnetic q(t), sinusoid stack) and returns curves [src][levien][volute][xu][mathw][est]. It covers scrolls, tendrils, whiplashes, iron scrolls and guilloché bands.
6. **Branch placer.** At signal points on the spine (crests, concavities [src][wong]), it spawns spirals with alternating sense [src][wong][crane]. Turns are proportional to available circle size [src][hamekasi]. It places leaves alternate or opposite [src][phyllo] at a 25–40° tangent angle. Terminals come from the flower generator.
7. **Gap filler.** Largest-empty-circle growth with an exclude list [src][wong], or magnetic packing with decreasing (T, α) [src][xu]. Space colonisation [src][colon] is an option for briar or ivy sprays. It enforces uniform density.
8. **Tile mode.** Fleuron, wrought-iron and guilloché styles skip growth. They place rotated or mirrored units [src][arrange][jury] along the fitted path, with corner units.
9. **Stroke and relief maker.** Turns curves into masks with width tapering per Murray's law [src][colon]. It also handles constant bar width with collars for iron [src][bcon], and hairline mode for guilloché. It writes M, H and V maps identical to the imprint specimen maps, so the **same medium developers** render borders.

### 9.3 Style presets as part settings [est]

| style | spine | κ profile | corner | fill | terminals |
|---|---|---|---|---|---|
| Rinceau / acanthus | sine wave | log-aesthetic, 1–1.75 turns | run-on or corner rosette | Wong fill | species flowers, acanthus sheath |
| Leaf garland / wreath | path offset | gentle Euler | tie / bottom-centre meet | none | berries every 3–5 leaves |
| Wrought iron | none or straight bar | circle-arc volutes (progressive grid) | mirrored corner scroll | tile | snub / fishtail / leaf / rosette, collars |
| Victorian fleuron | none | — | corner unit | tile | — |
| Botanical letterhead | double rule | — | corner spray (imprint spray) | none | single vignette top-centre |
| Art Nouveau | vertical side stems | high-α whiplash | flower heads at top corners | sparse | lilies, irises, poppies |
| Morris / Arts & Crafts | diagonal meander per side | Euler | mitred mirror | dense fill (horror vacui) | grapes, roses, tulips |
| Illuminated | gold bar | — | bar wraps 3–4 sides | space colonisation hairlines | ivy leaves in 2–3 colours plus gold |
| Banknote / certificate | path | sinusoid stack bands | epitrochoid rosette | none | lathe ovals |
| Arabesque | guard, main band, guard | circle-arc spirals, split stems | diagonal palmette, bilateral | circle packing | palmettes, hatayi |

### 9.4 Phone budget [est]
- Curves are cheap. Only the gap filler is costly.
- Cap growth iterations, use a low-resolution occupancy grid (as Wong and Xu both did [src][wong][xu]), and cache the result per seed and page size.

---

[jones]: https://readingdesign.org/grammar-of-ornament
[wong]: https://grail.cs.washington.edu/projects/ornament/ornament-lowres.pdf
[hints]: https://www.marxists.org/archive/morris/works/1881/hints.htm
[ideal]: https://www.marxists.org/archive/morris/works/1893/ideal.htm
[crane]: https://www.gutenberg.org/cache/epub/25290/pg25290-images.html
[kelm]: https://www.victorianweb.org/victorian/painting/morris/drawings/2.html
[bryars]: https://bryarsandbryars.co.uk/blogs/books/william-morris-announces-his-pocket-cathedral-a-specimen-leaf-from-the-kelmscott-chaucer
[nott]: https://www.nottingham.ac.uk/manuscriptsandspecialcollections/researchguidance/medievalbooks/glossary.aspx
[day]: https://dn720304.ca.archive.org/0/items/patterndesignboo00dayl/patterndesignboo00dayl_hocr.html
[jury]: https://davidjury.com/writings/in-place-of-the-heavy-rule-and-sullen-grot/
[arrange]: https://briarpress.org/37521
[adobe]: https://www.adobe.com/learn/illustrator/web/illustrator-create-pattern-brush
[volute]: https://emis.muni.cz/journals/NNJ/AndGal.html
[anvil]: https://anvilfire.com/iForge/tutor/spiral1/index.htm
[hamekasi]: https://www.scitepress.org/Papers/2012/38501/38501.pdf
[levien]: https://levien.com/phd/thesis.pdf
[xu]: https://gigl.scs.carleton.ca/papers/artn-cae.pdf
[lopyrev]: https://www.gwern.net/docs/www/medium.com/7bd8bde613014cbb3fa8aabed5733ebbb8709c50.html
[phyllo]: https://en.wikipedia.org/wiki/Phyllotaxis
[scroll]: https://en.wikipedia.org/wiki/Scroll_(art)
[colon]: https://www.algorithmicbotany.org/papers/colonization.egwnp2007.pdf
[venation]: https://www.algorithmicbotany.org/papers/venation.sig2005.pdf
[mathw]: https://MathWorld.Wolfram.com/GuillochePattern.html
[fontlab]: https://blog.fontlab.com/2026/04/14/money-lace-guilloche-intaglio-spirograph/
[colecc]: https://coleccionismodemonedas.com/en/guilloche
[bcon]: https://Buildingconservation.com/articles/wroughtiron/wrought2000.htm
[ebsco]: https://www.ebsco.com/research-starters/ethnic-and-cultural-studies/arabesque
[satyori]: https://satyori.com/sacred-geometry/arabesque/
[ottoman]: https://en.wikipedia.org/wiki/Ottoman_illumination
[wilson]: https://chriswilsonstudio.com/how-to-draw-on-black-paper/
[alt-wet]: https://www.alternativephotography.com/wet-cyanotype-colours/
[getty]: https://museum-essays.getty.edu/photographs/atkins-british-algae/
[ap-tips]: https://amateurphotographer.com/technique/make-cyanotypes-top-tips/
[bw]: https://barnardandwestwood.com/blind-embossing-debossing/
[billerud]: https://www.billerud.com/globalassets/billerud/insights/technique-ly-speaking/billerud_print-techniques_embossing.pdf
[famsf]: https://www.famsf.org/learn-engage/read-watch-listen/special-effects-japanese-prints
[zazzle]: https://www.zazzle.com.au/hc/article/designing_hot_stamped_foil_some_concepts_and_guidance-26319554002711
[aura]: https://aura-print.com/usa/foil-printing-problems
