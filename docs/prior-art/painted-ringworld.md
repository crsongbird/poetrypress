# Painted Ringworld Prior Art: Flat Things That Read, and Placement That Holds Still

**Confidence key.** **[src: URL]** means the point was read in that source during this session. **[est]** means it is my own design or implementation estimate, to be tuned by eye. **[code]** means it was observed in this repo (`paintKit.js`, `stepsRing.js`) on 2026-10-20.

**Sources that failed this session.** Treat anything that would have come from them as [est]:
- The Guerrilla PDF of Van Muijden's GDC 2017 slides (fetch error).
- The Kill Screen Firewatch piece (paywall).
- Inigo Quilez's site (robots.txt).
- Wikipedia's Aerial perspective and Art Deco pages (provenance block; Britannica and MasterClass were used instead).

No source with technique-level detail was found for Kurzgesagt, Olly Moss, Moebius or Monument Valley. Lines that rely on them are marked [est].

**What the owner asked for.** The things "are basically just squares or basic shapes". They should gain artistry while staying flat (flat-colour polygons lit on the light's side, no textures) and readable when small. `paintKit.js` is shared by Painted Ringworld, the night-city skyline and Ring in the Sky, so every recipe below lands in all three.

---

## 0. What a ringworld floor looks like (for the backdrop the things stand on)

**Niven's Ringworld:**
- Size: a band about 1,000,000 mi wide and about 600 million mi long, at roughly Earth's orbital radius. Rim walls are about 1,000 mi high [src: https://www.h2g2.com/approved_entry/A87815604].
- The sun is always overhead, and there is no true horizon: distance fades into haze. At night the rest of the ring is "a giant arch" across the sky, with "lit and dark sections" [src: https://www.h2g2.com/approved_entry/A87815604].
- Shadow squares: 20 of them, wired in a circle at about 0.3 AU, with gaps "over twice the length" of a square. Their shadows can be seen on the Arch [src: https://logosconcarne.com/2015/01/03/ring-around-a-star/]. The squares are linked by shadow-square wire [src: https://larryniven.fandom.com/wiki/Ringworld].
- Mountains are places where the metal floor itself is raised, so they do not erode. Pumps carry silt to "silt mountains" at the feet of the rim walls [src: https://www.h2g2.com/approved_entry/A87815604].
- Fist-of-God is a mountain punched up through the floor by an impact. Its top, above the air, is "just a hole" [src: https://en.wikipedia.org/wiki/Ringworld].
- The Great Ocean holds one-to-one maps of inhabited worlds [src: https://larryniven.fandom.com/wiki/Ringworld].
- Advanced regions have cities floating on maglev [src: https://www.h2g2.com/approved_entry/A87815604].
- Scrith is "milky-gray, translucent" [src: https://larryniven.fandom.com/wiki/Ringworld].

**Halo's Installation 04:** 10,000 km across and 318 km wide. Its floor has Pacific-Northwest pine and fir, arid plateaus, mangroves and swamps [src: https://www.halopedia.org/Installation_04]. From the ground it reads as "the unyielding curvature" overhead [src: https://www.supercluster.com/editorial/the-ringworlds-of-halo].

**Elysium:** a torus about 2 km wide and 40 km in diameter. Its floor is modern Malibu: mansions, pools and retaining walls. Distant floor was a matte painting projected from a 180° render [src: https://www.fxguide.com/?p=45905]. Mead was "the inspiration behind a lot of this" [src: https://www.fxguide.com/?p=45905].

**The arch's width as seen from the floor [est].** The band always faces you across its width, so its angular width at elevation `e` is about `w / (2R·sin e)`:

| Ring | At the zenith | At 10° | At 1° |
|---|---|---|---|
| Niven | ≈0.31° | ≈1.8° | ≈18° |
| Halo | ≈1.8° | ≈10° | (not computed) |

So the arch must **fan out toward both horizons**, and a hairline arch is correct only for Niven.

**What follows for the painting [est]:**
- Niven's nearest rim wall subtends about 0.1°, so it is invisible. The app's "painter's exaggeration" of walls is a choice. Keep it, but show the walls as the arch's two pale edge lines, which is where they really read.
- Shadow-square nights are hard-edged dark bands on the arch: about 20 of them, each about ⅓ of a period.
- A rolling world with no horizon means far ridges should dissolve upward into haze, not stop at a line.

---

## 1. How flat illustrators make things recognizable with few shapes

### 1.1 Rules that apply to everything

- **Silhouette first.** Valve designed TF2's classes to be readable in silhouette alone. It checked designs as silhouettes and made interior shapes "echo the silhouette". It put rim highlights on edges instead of dark outlines, and kept extreme values for edge lines and highlights [src: https://cdn.steamstatic.com/apps/valve/2008/GDC2008_StylizationWithAPurpose_TF2.pdf]. A thing is recognizable if its outline alone names it. The interior only confirms it [est].
- **Shadows are cool, not black, and the terminator warms a little** [src: TF2 PDF above]. For a three-tone flat shape:
  - shadow = body mixed toward the sky's hue;
  - body = local colour;
  - lit = body mixed toward the light's hue, used on a *small* area [est].
- **Shadow shapes are simpler than their objects, and may differ from them.** Eyvind Earle gave curved objects pointy shadows. His canopies were several circular sub-canopies with light points "biased towards the edges (rim light) and in the direction of incoming light". Nearer trees got more sub-canopies [src: https://history.siggraph.org/wp-content/uploads/2022/12/2014-Poster-97-Murphy_Stylized-Trees-and-Landscapes.pdf]. Earle blocked in "large, dark shapes … along horizontal and vertical lines", then went lighter, finishing with the smallest, brightest highlights [src: https://zoungyart.substack.com/p/painting-in-the-style-of-sleeping]. **Paint dark mass first, then light last and smallest.**
- **Firewatch:**
  - Objects are flat forms with bold silhouettes and abstract interior detail. Colour sits in distinct depth layers with fog between them, and the sky sets most of the colour [src: https://www.thumbsticks.com/gdc-2015-the-art-of-firewatch].
  - Jane Ng hand-modelled 23 trees and called pines "the worst" tree to make in 3D [src: https://80.lv/articles/creating-the-world-of-firewatch].
  - The sky shader adds a three-colour gradient, a sun halo and a separate horizon halo [src: https://blog.camposanto.com/post/112703721804/this-blog-post-is-an-in-detail-explanation-of-a].
- **Aerial perspective.** With distance, contrast and the light-to-shadow gap narrow. Dark things go bluish, bright things go a little warmer, and edges and inner detail drop. The effect is strongest low down, in dense air [src: https://www.britannica.com/art/aerial-perspective]. In flat terms:
  - a far thing's three tones converge on the air colour, with the shadow tone converging fastest;
  - its silhouette simplifies;
  - its base sinks into haze [est].
- **Oga and Ghibli.**
  - Kazuo Oga "extracts the essence of important elements of the scene", renders only the essential point, and mixes a wide range from about 21 colours [src: https://animationobsessive.substack.com/p/what-kazuo-oga-thinks-about-when].
  - For Totoro he moved from "symbolic" trees to specific species (sawtooth oak, konara oak, camphor) in "subdued but beautiful" warm colours [src: https://animationobsessive.substack.com/p/defining-the-world-of-my-neighbor].
  - **Lesson:** each species must be a distinct silhouette, not one tree with a different colour.
- **The clump method.** Don't draw leaves. Group them into simple circular clumps, and keep the light/shadow boundary on each clump uneven. Start each clump dark and add light toward the light, keeping the brightest areas small. Gaps in the canopy let sky or light through. Far trees get simpler and lower in contrast [src: https://tips.clip-studio.com/en-us/articles/7585].
- **Monument Valley.** Ken Wong's sources were Escher, Japanese prints, minimalist sculpture, Middle-Eastern architecture and low-poly art [src: https://gdcvault.com/play/1022299/The-Art-of-Monument]. Each frame should be "worthy of public display" [src: https://en.wikipedia.org/wiki/Monument_Valley_(video_game)]. The technique I take from it: one flat colour per face orientation (top, light side, dark side) gives solid form with no gradients at all [est].
- **Kurzgesagt and Alto [est; the sources found say only "rounded shapes and vibrant colors" and "minimalist … moving art"]:**
  - [src: https://artsatmichigan.umich.edu/ink/2019/09/27/simple-bright-beautiful-the-work-of-kurzgesagt]
  - [src: https://80.lv/articles/altos-adventure-a-game-with-style]
  - The usual recipe is no outlines; a shape lit by an inner, offset, lighter copy of itself; a soft glow behind light sources; and parallax layers that differ by value only.

### 1.2 Buildings

**Base, shaft and crown.** New York's 1916 zoning resolution set height zones, after which a façade had to recede along an angled plane. A tower of unlimited height could rise over 25% of the lot [src: https://skyscraper.org/skyline/impact-of-1916-zoning/]. That produced "large, bulky bases and slender towers", the "wedding-cake" or setback-and-tower form [src: https://www.onverticality.com/blog/nyc-zoning-envelopes]. Ferriss's envelope study ends at a central tower of about 70 storeys flanked by 40-storey stepped wings [src: https://skyscraper.org/skyline/impact-of-1916-zoning/]. Examples are 70 Pine, the Chanin and the Chrysler [src: same].

**Crowns are the identity at a distance.** The Chrysler crown is seven terraced arches per side with triangular windows lit at night, a sunburst, and a 186 ft spire. The building is 1,046 ft and 77 storeys [src: https://www.masterclass.com/articles/chrysler-building-architecture-guide]. Ferriss drew towers as night masses, "solid but seemingly translucent", in "soft chiaroscuro of an artificially lit landscape" [src: https://drawingmatter.org/hugh-ferriss/]. That is the model for the night-city generator: masses first, with light carving the crowns.

**Roof furniture is the cheapest realism.** New York required rooftop tanks on buildings of six or more storeys. The tanks are wooden barrels holding 5,000–10,000 gal, and up to 17,000 of them exist [src: https://www.6sqft.com/nyc-water-towers-history-use-and-infrastructure/]. Other cheap pieces [est]:
- the mechanical penthouse, a smaller box set back from the parapet;
- antenna masts with one red light at night;
- stair bulkheads;
- cooling-tower slats;
- a cornice line, a dark strip one floor tall on pre-war buildings.

**Windows by floor bands [est]:**
- Pre-war masonry: punched holes in a grid, with piers between the bays. Deco adds continuous vertical piers and recessed spandrels.
- Modern slabs: horizontal ribbon windows.
- Glass towers: mullion lines only, with sky colour on the lit half.
- At night, lights are lit per floor (offices) or per unit (housing), never as pure noise. Some floors are all on, some all off, and the top floor is often dark.

**Ground floors [est].** The ground floor is taller, about 1.5× a floor, and darker or more glazed. An awning strip, or at night a warm shop band, anchors a building to the street. Without it, buildings float.

**Distance [est, consistent with aerial perspective above]:**
1. Near: everything — windows, piers, roof furniture.
2. Mid: floor bands become 2–4 value stripes. Roof furniture is reduced to the single most iconic item (tank, mast or crown).
3. Far: silhouette only, as one flat tone near the air colour. Its rhythm is what reads: tall-short-tall steps, spires as needles.
4. Very far: one city "comb" polygon whose top edge is a step function.

**Mead's lesson.** He mapped dense ornament over simple geometric solids ("supersonic baroque") and liked the hour after sundown [src: https://en.wikipedia.org/wiki/Syd_Mead]. Big plain forms take a band of fine repeated detail at one place, not all over.

### 1.3 Trees

**Silhouette classes from nursery practice.** Hillier's guide lists rounded, pyramidal, broad, fastigiate, broadly columnar, irregular (Scots pine), spreading, vase, teardrop, wide oval and weeping (pendula: beech, birch, *Salix babylonica*) [src: https://trees.hillier.co.uk/useful-resources/guide-to-tree-shapes/]. Each needs its own outline.

**Flat-vector construction [src: https://design.tutsplus.com/tutorials/how-to-create-a-flat-winter-scene-in-adobe-illustrator--cms-25369]:**
- A fir is stacked triangles, light on top and dark at the bottom, "gradually darkening the lower shapes", or rotated branch bars mirrored on both sides.
- A broadleaf crown is three stacked rounded shapes. The shadow side is a darker duplicate with half erased.

**Pines** have needles in groups jutting from the sides, dark inside and light at the tips [src: https://tips.clip-studio.com/en-us/articles/7585].

### 1.4 Rocks [est]

Painters use the same three facets as boxes: top plane lit, light side mid, shadow side dark. What makes a rock read as rock rather than a blob:
- straight cuts with few, long edges;
- one big plane change;
- a darker crack or two following the cleavage;
- a cast-shadow sliver on the ground.

Groups follow "one big, two medium, a few small", overlapping, never in a row.

### 1.5 Sci-fi works and megastructures

- Stålenhag paints rural landscape with giant machines. He sketches "mechanical designs that fit the rythm of the landscape" and keeps visible "handwriting" brushwork [src: https://wertn.com/2014/01/interview-simon-stalenhag/]. His influences are Mead, McQuarrie and Lars Jonsson [src: https://en.wikipedia.org/wiki/Simon_St%C3%A5lenhag].
- Blomkamp wanted structures that made real-world engineering sense (bridges, oil platforms) and rejected designs that "felt too sci-fi" [src: https://www.fxguide.com/?p=45905].
- **Lessons [est]:**
  - Megastructures need scale cues: repeated modules, tiny trees or people, and fog at the base.
  - Alien works read through extreme simplicity (one primitive) plus one engineering detail (a seam, a ring of lights, a support leg).
  - Moebius's desert works are huge simple masses with a small figure for scale [est; the source found gives only "desert … signature motif": https://eportfolios.capilanou.ca/lienpham/2019/03/11/blogpost8j%e2%80%8b%e2%80%8bean-giraud-moebius].

---

## 2. Recipes

**Tones.**
- **D** is dark: the shadow side, cool and mixed toward the air.
- **B** is body.
- **L** is lit, toward the light's hue. It covers only 10–25% of the area.
- **G** is glow or accent.

**Detail tiers by on-screen height `h` [est].**
- **T0** (h < 6 px): silhouette in D/B only.
- **T1** (6–20 px): add L and the single identity detail.
- **T2** (20–60 px): add rhythm (windows, tiers, clumps).
- **T3** (> 60 px): add furniture, ground floor and wear.

Every detail must be a *subset* of the larger tier. A tier never moves anything that was already drawn (see §3.4).

### 2.1 Buildings: ten archetypes

| Archetype | Silhouette (the T0 identity) | Proportion (h : w) | T1 identity detail | T2/T3 detail |
|---|---|---|---|---|
| Brick walk-up | flat top, cornice lip overhanging 3% | 1.2–2.5 | cornice strip D; a water tank (barrel + cone roof + 3 legs) on ~40% | punched window grid in bays of 2–3; pier gaps; ground-floor shop band 1.5× floor; fire-escape zigzag on one face |
| Deco setback tower | 3–4 stacked boxes, each 0.7× the one below, shaft tallest | 4–8; base 30% of h, crown 15% | crown: terraced arches or stepped pyramid + needle spire (16% of h) | continuous vertical piers L/B alternating; spandrels D; crown windows lit at night as a chevron |
| Glass curtain tower | clean prism, top cut flat, slanted or notched | 5–10 | lit-half sky reflection (L at 18%), a mast | mullions every floor-width; a dark mechanical band every ~20 floors |
| Modernist slab | wide, flat-topped box | 0.4–0.8 | ribbon windows (one band per floor) | rooftop machine box set back; pilotis (dark gap) at ground |
| Tenement or housing block | long box plus regular stair cores rising above the roofline | 0.5–1.2 | stair-core rhythm (every ~4 bays) | balconies as short D ticks; per-unit night lights in a checker of families |
| Gothic or cathedral | nave box + one or two tall towers + pointed roof | towers 3–5 | spire or pinnacles; rose window G at night | buttress ticks; lancet windows |
| Needle or comms tower | thin shaft + saucer pod at 70–80% + mast | 10–20 | pod disc with L rim | red beacon at night; antenna dishes |
| Neon block | any of the above with an outline of G on 1–2 edges | — | one vertical blade sign or horizontal band, G at 90% | sign glow on the air; window lights G2; rooftop billboard frame |
| Builders' white megastructure | one primitive (rounded pylon, arch, ring, torus segment) far too big | pylon 6–12; arch span 2× its height | a single line of light along one edge; a seam ring | repeated modules (ribs every 1/12 of h); a dark doorway at the foot for scale; fog at the base |
| Ruin | a known archetype cut along a jagged line, top missing | — | one standing corner taller than the rest (asymmetric break) | exposed floor slabs as D lines; rubble wedges at the foot; a tree growing from the top (reuse pkTree) |

**City skyline, far tier (the "comb") [est].** Merge buildings into one polygon per haze layer. Its top edge is the max of the silhouettes, and its colour is a single B mixed 50–80% toward the air. Add 2–3 crowns or needles that rise out of the comb in L. These are what the eye locks onto. At night, the comb carries G window flecks at a density by layer, and the brightest layer is the nearest.

### 2.2 Trees: eight kinds

| Kind | Silhouette | h : w | Tones and light | T2/T3 |
|---|---|---|---|---|
| Spruce/fir | narrow cone of drooping tiers, tip a single spike; jagged edge (tiers overlap down) | 3–5 | D whole; B on the lit half; L as short tier tips facing the light | 5–8 tiers, each tier's edge saw-toothed; skirt touches ground |
| Pine (Scots/umbrella) | tall bare trunk with a kink + flat, irregular cloud-layer clumps at the top 30% | 1.3–2 | trunk warm (orange-brown) on the lit side; clumps flattened ellipses D→B→L | 2–4 separate pads with sky gaps between; one dead lower branch stub |
| Broadleaf (oak/beech) | broad dome of 5–9 overlapping lobes, wider than the trunk is tall | 0.8–1.2 | D lobes, B offset toward light, L small on light-facing lobes only; 1–3 sky holes | trunk forks visible under the crown; a dark cast shadow ellipse |
| Poplar/cypress (fastigiate) | flame or candle: narrow, pointed top, widest at ⅓ | 4–7 | split down the middle: B on lit half, D the other; L as a thin rim stripe | small lobes stacked; a slight S-curve of the axis |
| Birch | slender white trunk (often 2–3 stems) + airy, small, gappy crown | 2–3 | trunk L/white with D dashes (lenticels); crown B with many holes | drooping tips at the crown's edge (weeping hint) |
| Palm | thin curved trunk + 6–10 arching fronds from one point, a dark crown knot | 2–4 | fronds D on the underside, B top; trunk ringed with ticks | each frond a curved tapering strip with notches; coconut cluster D |
| Willow (weeping) | wide dome whose outline falls in vertical curtains to near the ground | 0.8–1 | curtain strands B, dark interior D visible between them | strands as a fringe of tapered bezier strips; trunk barely visible |
| Dead or snag | forking trunk, 2–3 levels, tips upward; no crown | 1–2 | D only (silhouette against sky), L sliver down one side | a broken top; one hanging branch |

**Clumps everywhere [est].**
- A crown is a few big clumps, each a small-lobed blob rather than a perfect circle.
- Each clump is painted D, then B offset toward the light (0.2r), then L (0.4r offset, 0.4r size) on light-facing clumps only.
- Clumps facing away from the light get no L.
- 1–3 holes go in the crown.
- At T0 a crown is *one* polygon in B, with a D underside. The current `pkLobes` already does D→B→L. What it lacks is clump outline variety (lumpy edges) and holes.

### 2.3 Rocks and the rest

| Thing | Shapes | Tones | Proportion | LOD |
|---|---|---|---|---|
| Boulder | 6–8-gon with 2 long straight edges, flat bottom | top L, lit side B, shadow side D, cast shadow sliver | w : h 1.2–2 | T2: one crack line D; T3: a small companion rock and grass tufts at the base |
| Crag/cliff | stacked slabs with vertical cleavage, tops tilting one way | vertical faces B/D by side; ledges L as horizontal strips | — | T2: ledge strips; T3: a tree clinging on a ledge |
| Spire (natural or builders') | tall taper on a plinth; banded | lit side as a narrow wedge from base to tip | 12–30 | T2: 3 bands; T3: a light ring and tip glow (builders), or erosion notches (natural) |
| Monolith | slab, a slight tilt, a chamfered top | B face, D side, L top bevel | 3–6 | T2: carved lines; T3: a tiny figure or campfire at the foot for scale |
| Dome | flattened half-ellipse on a short drum | D rim, B body, L crescent on the light side | 0.6–0.85 of the radius | T2: ribs as ellipse arcs; T3: an oculus (G at night) and a lantern |
| Crystal | 3–7 prisms from one root, fanned 30–50° | D body, B lit facet, L tip facet, G glow at the tips | 3–5 per prism | T2: inner facet line; T3: small shards at the foot |
| Flying ship | a long lens or wedge (length 4–8× height) + a fin; silhouette tilted 3–8° | B hull, D belly (sky-side shadow), L dorsal strip | — | T2: engine glow G at the stern, a row of port lights; T3: a cast shadow on the land far below, offset by the sun dir |
| Wreck | the same hull broken at an angle, nose buried, a rib-cage gap | D-heavy; L only on the exposed ribs | — | T2: 4–7 rib ticks; T3: a debris trail, a scar groove in the ground behind it |
| Bridge of light | a thin arc across the band (two parallel lines converging) | G core 1–2 px plus a soft glow; L where it crosses the arch | — | T2: support pylons where it lands; T3: pulses of brighter G along it (static by seed) |

---

## 3. Camera-stable procedural placement

### 3.1 What games do

- **Hash the world, not the screen.** Feed a hash the *integer cell id*, not continuous screen coordinates. Then "every fragment inside a cell receives exactly the same random value" and nothing flickers. Get extra independent values by re-hashing with a large irregular offset. A seed shifts the whole field [src: https://gamedev.net/shaderlab/20-randomness-from-a-hash/]. Sine-based hashes differ by GPU precision and correlate [src: same]. Prefer integer bit-mixing hashes [est].
- **Minecraft seeds by place and purpose:**
  - `setPopulationSeed(worldSeed, blockX, blockZ)` gives each chunk its own decoration stream.
  - `setDecoratorSeed(popSeed, index, step)` salts each feature by `index + 10000*step`. The docs warn that a small salt causes "unwanted alignment between features with nearby indexes".
  - `setRegionSeed` gives 32×32-chunk regions one seed for structure starts [src: https://maven.fabricmc.net/docs/yarn-1.21+build.9/net/minecraft/util/math/random/ChunkRandom.html].
  - Generation is deterministic from the seed, so the world doesn't depend on exploration order [src: https://www.alanzucconi.com/?p=13702].
  - **Lessons:** salt by kind *and* by cell, use strong mixing, and choose features region-first, then cell, then object.
- **Horizon Zero Dawn.** Placement is generated on the GPU around the player from artist-authored rule graphs and density logic. Painting a tree line or turning desert into swamp changes the result [src: https://www.guerrilla-games.com/read/gpu-based-procedural-placement-in-horizon-zero-dawn]. The slides' details (density-map dithering and tile footprints) were not readable this session [est: as I recall, placement is a per-tile ordered-dither of density, and because density and pattern are world-anchored, objects are stable as tiles stream in].
- **No Man's Sky** runs the pipeline voxels → polygons → texturing → population continuously in real time [src: https://gdcvault.com/play/1024265/Continuous-World-Generation-in-No].
- **Blue noise:**
  - Bridson's Poisson disk uses a background grid with cell size r/√n, k = 30 candidates in the r–2r annulus, and runs in O(N) [src: https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf]. It is order-dependent: one changed sample changes all later ones [est]. So it is only stable if run per world tile, with the tile's own seed and a fixed domain.
  - Recursive Wang tiles give an infinite, pannable, *progressive* blue-noise set: any first N points are evenly spread, so density is a cut-off on a fixed sequence [src: https://prideout.net/recursive-wang-tiles/].
  - **The cheap equivalent [est]:** a jittered grid in world cells, with one candidate per cell at `hash(cell)`. Keep a candidate if `hash2(cell) < density(world pos)`. Density changes then add or remove points but never move them.

### 3.2 Applied to the ringworld floor [est]

The floor is a cylinder strip, with coordinates `a` (around) and `z` (across).
- Use cells in (a, z) with sizes per kind: big works 1/200 W, buildings 1/2000 W, trees finer. The cell id is `(floor(a/ca), floor(z/cz))`, and around the ring `a` wraps, so mod the cell count.
- Use **one hash per object id**: `id = hash(seed, kindSalt, ia, iz)`. Then derive every attribute from `hash(id, attrIndex)`: position jitter, height, archetype, palette shift, lit-window pattern, ruin cut.
- Do **not** use a running stream whose consumption depends on screen size or tier.
- **LOD by distance in world units, not by on-screen size,** when deciding *whether* a thing exists. Use a per-object threshold `exists = hash(id,0) < density(d)`. Here `density(d)` falls smoothly with distance and is constant in screen size, so the visible count per screen area stays steady (thinning like Wang-tile progressive cut-offs).
- On-screen size decides only the *drawing tier* (§2). Tiers only add detail.

### 3.3 Ridge behind ridge, sampled so that turning in place changes nothing [est]

Painted layered landscapes (Firewatch's distinct colour layers with fog between [src: https://www.thumbsticks.com/gdc-2015-the-art-of-firewatch]) are a stack of bands at increasing distances.

- **Sample each ridge on a constant-distance arc around the camera's world position.** The world point is `P + d_k·(cos θ, sin θ)` for every bearing θ. The heights then depend only on (position, d_k, θ). Turning the camera (yaw) changes which θ range is on screen, not the values. Pitch and roll are a 2D transform of the same picture.
- Use a fixed geometric ladder of distances, e.g. 16 rings, `d_k = d_0·q^k` (the code already uses "16 ridges at distances growing from your feet" [code]).
- Sample θ at a fixed world-angular step per ring, not per pixel. Use step ∝ 1/d_k in *world* arc length, so far rings are coarser in world terms and roughly constant in screen terms. Interpolate between samples.
- Objects on a ridge belong to the world cells that ring k passes through. Draw each object between rings k and k+1 by its true distance, which the code already does with "works stand in world cells … drawn between the ridges" [code].
- When the camera *moves*, ring distances slide through the world, and crests would "boil". **Fix it by snapping the ring centres to a coarse world grid that is coarser for far rings,** e.g. the centre of ring k is quantized to `d_k/8`. Cross-fade over a few frames, or just accept it in a still-image app.
- Translation only matters for animation. Since PoetryPress renders stills, rotation stability is the property that matters for "sweep the camera and see it not really change much" (Ruby, quoted in `stepsRing.js` [code]).

### 3.4 A stability hazard observed in the current kit [code]

`pkTree` and `pkBuilding` draw from one running stream `R()` per object. The stream is seeded per object (`rgRand(s, 511, i)`, `o.R`), which is good. But some calls happen only at some sizes:
- `small ? 3 : 5 + Math.floor(R()*3)` (spruce tiers);
- `pkWindows` calls `R()` only when `detail`, then ruin rubble wedges draw more `R()` afterwards;
- the brick water tank `R() < 0.45` is drawn only when `detail`.

So when a thing crosses a size threshold (zoom, lens or turning it nearer the edge), every later random choice in that object shifts. The rubble moves, the lobes change, and the window pattern reshuffles. **The fix:** take a fixed number of `R()` values upfront into named fields, or use `hash(id, k)` per attribute, and only then branch on size.

---

## 4. What this app should do: the ten most valuable changes

1. **Make per-object randomness keyed, not streamed** (§3.4). Use `const r = k => hash01(o.id, k)` in `pkTree`, `pkBuilding`, `pkRock` and `pkCrystals`, and give each attribute a fixed index. Then tiers can add detail without moving anything. It is cheap and it removes popping in all three surfaces that share `paintKit`.
2. **Add a deliberate T0–T3 ladder** with fixed px thresholds and one identity detail per kind at T1: cornice and tank, deco crown, glass reflection, pod, needle. Today it is a single `detail` or `small` bool. Below T1, draw silhouette-only shapes in D/B, nudged toward the air.
3. **Give the deco tower a real crown.** Add 2–3 crown variants: a terraced arch fan like Chrysler, a stepped ziggurat with a mast like 70 Pine, and a lit chevron. Build it as base 30%, shaft, crown 15% with each setback 0.7×, and add vertical piers at T2. This is the strongest single "it's a skyscraper" cue, and it serves the night skyline too.
4. **Add roof furniture and ground floors to every city archetype.** Pick from a seeded set (water tank, mechanical penthouse, mast with a red beacon, stair bulkhead, billboard frame) and give each archetype its own probabilities. Add a 1.5× ground-floor band, a glazed or warm shop strip at night. This turns "boxes" into "buildings" at T1–T2 for a few polygons each.
5. **Light windows by floor, not by pane.** Choose a per-floor state from the hash (all on, all off, partial), keep the top floor often dark, and use per-unit warm or cool variants for housing. Keep the existing ribbon and mullion kinds. Add new archetypes: tenement with stair cores, gothic towers, and ruin with an asymmetric standing corner and a tree on top.
6. **Silhouette-specific trees with lumpy clumps and sky holes.** Give `pkLobes` lumpy clump outlines (8–12 point blobs with radius jitter ±15%), 1–3 crown holes in the sky or air colour, and L only on light-facing clumps. Add **palm** and **fastigiate cypress** kinds. Make pine pads flat, separate ellipses with gaps, and give the trunk a warm lit side. Push spruce tiers to saw-tooth edges.
7. **A far-city "comb"** (§2.1): beyond a distance, merge buildings per haze band into one step-topped polygon in a single air-mixed tone, with 2–3 L crowns or needles poking through and G flecks at night. It reads as a city at 2–6 px, where individual boxes read as noise.
8. **Consistent three-tone lighting with cool shadows.** Derive D by mixing the body toward the air or sky hue (not black), and L toward the sun hue on ≤25% of the area. Use a single rim stripe of L on the light-side silhouette edge instead of outlines (TF2 and Earle). Converge D, B and L on the air with distance, with D fastest.
9. **Scale cues for megastructures, wrecks and ships.** Repeat modules (ribs or seams every 1/12 of h), add a tiny dark doorway or tree at the foot, put base fog where works meet the land, and give flying ships a cast shadow on the land offset along the sun direction. Wrecks get a rib-cage gap, a buried nose and a scar groove.
10. **Arch truthfulness.** Widen the arch toward both horizons, with angular width ∝ 1/sin(elevation): Niven ≈0.3° at the zenith, Halo ≈1.8°. Draw rim walls as the arch's two pale edge lines, and shadow-square nights as about 20 hard-edged dark bands. Ridges should dissolve upward into haze rather than end at a horizon line. Keep the existing 3.2× far-land exaggeration as a stated painter's choice.
