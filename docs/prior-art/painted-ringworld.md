# Ringworld Prior Art: Flat Things That Read, and Placement That Holds Still

**Confidence key.** **[src: URL]** means the point was read in that source during this session. **[est]** means it is my own design or implementation estimate, to be tuned by eye. **[code]** means it was observed in this repo (`paintKit.js`, `stepsRing.js`) on 2026-10-20.

**Sources that failed this session.** Treat anything that would have come from them as [est]:
- The Guerrilla PDF of Van Muijden's GDC 2017 slides (fetch error).
- The Kill Screen Firewatch piece (paywall).
- Inigo Quilez's site (robots.txt).
- Wikipedia's Aerial perspective and Art Deco pages (provenance block; Britannica and MasterClass were used instead).

No source with technique-level detail was found for Kurzgesagt, Olly Moss, Moebius or Monument Valley. Lines that rely on them are marked [est].

**What the owner asked for.** The things "are basically just squares or basic shapes". They should gain artistry while staying flat (flat-colour polygons lit on the light's side, no textures) and readable when small. `paintKit.js` is shared by Ringworld, the night-city skyline and Ring in the Sky, so every recipe below lands in all three.

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

---

## 5. A much bigger tile set: kinds, real sizes, close-up detail (2026-10-20)

**What Ruby asked.** Ruby loves the kit and wants "an incredible amount of diversity" in every tile set: wilds, cities, neon, builders, magic, ruins, Night City's skylines and Ring in the Sky. Ruby also saw buildings drawn the size of shrubs. So every kind below has a **real-world size in metres** and the **detail it shows close up**.

**How to read the tags in this section.** `[S12]` means source 12 in the list below, opened and read during this session. `[est]` is my design estimate. `[code]` was observed in this repo. Every recipe (silhouette, colours, close-up) is [est] unless a cell cites a source.

**What failed this session, so the figures are [est]:**
- Wikipedia's *Storey*, *Water tower* and *Space elevator* pages, and the Science Museum's K6 kiosk page (provenance block).
- CTBUH's height calculator gave its method but no numbers [S37].
- The terrace-width article (redirect blocked).

**Sources.**
- **Trees and plants:** S1 https://dimensions.com/element/norway-spruce-picea-abies · S2 https://treelib.ca/species/263/abies_lasiocarpa · S3 https://www.maine.gov/DACF/mfs/publications/handbooks_guides/forest_trees/pdf/scots_pine.pdf · S4 https://extension.usu.edu/treebrowser/catalog/pine-scotch-scots · S5 https://en.wikipedia.org/wiki/Pinus_pinea · S6 https://www.portland.gov/trees/cedrus-libani · S7 https://www.dimensions.com/element/italian-cypress-cupressus-sempervirens · S8 https://www.vdberk.co.uk/trees/populus-nigra-italica/ · S9 https://nps.gov/seki/learn/nature/sherman.htm · S10 https://nfs.unl.edu/oak-english · S11 https://plants.ces.ncsu.edu/plants/acer-saccharum/common-name/northern-sugar-maple · S12 https://www.burncoose.co.uk/site/plants.cfm?pl_id=74 · S13 https://plants.ces.ncsu.edu/plants/prunus-x-yedoensis/common-name/yoshino-cherry/ · S14 https://ashridgetrees.co.uk/silver-birch-betula-pendula-standard · S15 https://www.dimensions.com/element/weeping-willow-leafless-salix-babylonica · S16 https://dimensions.com/element/coconut-palm-cocos-nucifera · S17 https://pza.sanbi.org/node/9652 · S18 https://pza.sanbi.org/node/9642 · S19 https://en.wikipedia.org/wiki/The_Great_Banyan · S20 https://en.wikipedia.org/wiki/Dracaena_cinnabari · S21 https://www.dimensions.com/element/joshua-tree-tall-yucca-brevifolia · S22 https://dimensions.com/element/saguaro-cactus · S23 https://www.dimensions.com/element/prickly-pear-opuntia-ficus-indica · S24 https://en.wikipedia.org/wiki/Phyllostachys_edulis · S25 https://hardyferns.org/ferns/dicksonia-antarctica/ · S26 https://www.dimensions.com/element/red-mangrove-x-large-rhizophora-mangle · S27 https://wildlifetrusts.org/node/648 · S28 https://en.wikipedia.org/wiki/Prototaxites · S29 https://www.heritagedaily.com/2023/04/the-cave-of-crystals/146731 · S30 https://www.guinnessworldrecords.com/world-records/66511-largest-single-flower
- **Scale:** S31 https://ourworldindata.org/human-height · S32 https://www.doors.com/pages/standard-door-size · S33 https://www.getagent.co.uk/blog/properties/house-height-average · S34 https://openlab.citytech.cuny.edu/kingbtech3fa17/files/2017/11/Ying-Ren-Stick-Curtain-Wall-System.pdf · S35 https://www.studiomatrx.org/students/drawing-fundamentals/entourage-scale-figures · S36 https://dev.epicgames.com/documentation/unreal-engine/creating-and-using-lods-in-unreal-engine · S37 https://www.skyscrapercenter.com/height-calculator
- **Houses:** S38 https://www.thatchadvicecentre.co.uk/articles/7-thatch-design-points-for-architects-to-consider · S39 https://www.museum.ie/en-IE/Collections-Research/Collection/Traditional-houses-from-the-Irish-Folklife-Archite/Artefact/F-2006-156/7a5bc095-05ad-44f4-87d4-30102b8140fb · S40 https://historycolorado.org/frame · S41 https://en.wikipedia.org/wiki/Stilt_house · S42 https://mongoliabusiness.mn/made-in-mongolia-online-shop/buy-mongolian-yurt/mongolia-6-walled-yurt-ger/ · S43 https://homepages.bluffton.edu/~SULLIVANM/taos/taos.html · S44 https://habitatio.epitesz.bme.hu/en/portfolio/gassho-type-minka/ · S45 https://www.newworldencyclopedia.org/entry/Horyu-ji · S46 https://www.studiomatrx.org/architecture-canon/santorini-cave-dwellings · S47 https://kringom.no/en/laerdal/borgund-stave-church · S48 https://www.barnyard.com/structures/post-and-beam-barns/30-x-36-pioneer-gambrel-barn · S49 https://en.wikipedia.org/wiki/Silo
- **Towers:** S50 https://www.newworldencyclopedia.org/entry/Empire_State_Building · S51 https://en.wikipedia.org/wiki/Trellick_Tower · S52 https://en.wikipedia.org/wiki/Ziggurat_of_Ur · S53 https://en.wikipedia.org/wiki/CN_Tower · S54 https://guinnessworldrecords.com/world-records/112047-tallest-twisted-tower · S55 https://en.wikipedia.org/wiki/Turning_Torso · S56 https://www.britannica.com/print/article/1270092 · S57 https://en.wikipedia.org/wiki/Arcosanti
- **Civic:** S58 https://en.wikipedia.org/wiki/Cologne_Cathedral · S59 https://en.wikipedia.org/wiki/List_of_highest_church_naves · S60 https://www.britannica.com/print/article/572389 · S61 https://en.wikipedia.org/wiki/Blue_Mosque,_Istanbul · S62 https://www.miyajima.or.jp/english/spot/spot_ootorii.html · S63 https://en.wikipedia.org/wiki/Tower_of_London · S64 https://worldhistory.org/Medieval_Castle · S65 https://en.wikipedia.org/wiki/List_of_tallest_lighthouses_in_the_United_States · S66 https://galex.caltech.edu/palomar/audioguide/haletelescopedome_en.html · S67 https://pages.astronomy.ua.edu/keel/telescopes/wilson.html · S68 https://en.wikipedia.org/wiki/Big_Ben · S69 https://en.wikipedia.org/wiki/De_Verwachting,_Hollum · S70 https://en.wikipedia.org/wiki/Windlust,_Burum · S71 https://www.caldwelltanks.com/tank_types/fluted-column-elevated-storage-tank-flc · S72 https://pttg.com/elevated-water-storage-tanks · S73 https://en.wikipedia.org/wiki/KVLY-TV_mast · S74 https://www.nationalgrid.com/stories/energy-explained/what-is-a-pylon · S75 https://www.energy.gov/eere/articles/wind-turbines-bigger-better · S76 https://www.designingbuildings.co.uk/Cooling_tower_design_and_construction · S77 https://www.ferrovial.com/en/resources/industrial-chimneys/ · S78 https://gracesguide.co.uk/Palm_House,_Kew_Gardens · S79 https://ingenia.org.uk/articles/how-an-eden-was-created-in-cornwall/ · S80 https://www.goldengate.org/bridge/history-research/statistics-data/design-construction-stats/ · S81 https://pontdugard.fr/en/ancient-work-art · S82 https://the-colosseum.net/wp/en/numbers/
- **Works, magic, ruins and cyberpunk:** S83 https://en.wikipedia.org/wiki/Stanford_torus · S84 https://spaceflightnow.com/?p=4054 · S85 https://www.zonnefabriek.nl/en/knowledge-center/dimensions-solar-panels/ · S86 https://ship4wd.com/logistics-shipping/20ft-40ft-shipping-containers-specs · S87 https://en.wikipedia.org/wiki/Irish_round_tower · S88 https://www.english-heritage.org.uk/visit/places/stonehenge/things-to-do/stone-circle/stones-of-stonehenge/ · S89 https://aerospaceweb.org/aircraft/jetliner/b747 · S90 https://displaydaily.com/new-times-square-led-sign-could-be-largest-in-the-world/ · S91 https://roadsandkingdoms.com/2026/what-happened-to-hong-kongs-neon/ · S92 https://en.wikipedia.org/wiki/Nakagin_Capsule_Tower · S93 https://metropolismag.com/projects/how-hong-kongs-vertical-village-came-be/
- **Land:** S94 https://en.wikipedia.org/wiki/Grain_size · S95 https://www.newworldencyclopedia.org/entry/Bryce_Canyon_National_Park · S96 https://www.worldatlas.com/articles/what-is-a-butte-in-geography.html · S97 https://www.nps.gov/articles/arch-rock-stars.htm · S98 https://www.geolsoc.org.uk/GeositesHoy · S99 https://en.wikipedia.org/wiki/Scree · S100 https://www.summitpost.org/mountain/150993
- **Small things:** S101 https://www.angi.com/articles/standard-fence-height.htm · S102 https://www.paclights.com/explore/typical-light-pole-is-how-tall-lighting-explained/ · S103 https://engineerfix.com/where-can-i-buy-a-utility-pole-for-private-use/ · S104 https://www.hunker.com/13425243/dimensio… · S105 https://about.usps.com:443/who/profile/history/pdf/curbside-mailboxes-size-chronology.pdf · S106 https://creativewinebarrels.yolasite.com/wine-barrel-sizes.php · S107 https://quivo.co/en/euro-pallets-dimensions-explained/
- **Generation:** S108 https://course.ccs.neu.edu/cs5150f13/readings/muller_buildings.pdf · S109 https://history.siggraph.org/?p=116923 · S110 https://www.cg.tuwien.ac.at/research/publications/2003/Wonka-2003-Ins/ · S111 https://peterwonka.net/Publications/pdfs/2008.CGA.Watson.ProceduralModelingTutorial.pdf · S112 https://awesome.ecosyste.ms/projects/github.com%2Fmxgmn%2Fwavefunctioncollapse · S113 https://www.gamedeveloper.com/game-platforms/how-townscaper-works-a-story-four-games-in-the-making · S114 https://www.gamedeveloper.com/design/skyrim-s-modular-approach-to-level-design · S115 https://80.lv/articles/building-huge-open-worlds-modularity-kits-art-fatigue

### 5.0 Why buildings came out shrub-sized [code]

Two places pick sizes:
- **`stepsRing.js:437`** sets the tree height: `tH = min(wh*0.3, W*0.0035*kpx)`.
- **`stepsRing.js:441–443`** sets the building height: `hh = min(wh*(k<=3 ? 0.14 : 0.28), bH*rnd(0.5, 2.6))`, where `bH = min(wh*0.16, W*0.006*kpx)`.

`wh` is the band's height on screen. Out on the far bands the proportions are right: a building is about 2.7× a tree. In near bands both kinds hit their caps, and **the caps are set per kind**: 0.30·wh for trees but 0.14·wh for buildings. So a near building comes out at about half a tree, the size of a shrub.

Ring in the Sky has the same fault: it sizes its trees as `sz*1.7` (`stepsWhimsy.js:936`), with nothing tying them to its works.

**The cure** (§5.1):
- Give each band one ruler, px per metre.
- Give every kind a size in metres.
- Apply any cap to the band's ruler, or cull the object, never to one kind.

### 5.1 Scale: one ruler for the whole kit

**Known sizes to calibrate by:**
- **People.** The world-average adult is 171 cm for men and 159 cm for women [S31].
- **Doors.** A standard door is 80 in (2.03 m) tall. Exterior doors are usually 36 in (0.91 m) wide, interior doors 30–32 in [S32].
- **House floors and roofs:**
  - Floor to ceiling is 2.4–2.7 m in a modern house and 3.5 m or more in a Victorian or Edwardian one.
  - A two-storey house stands 6–8 m and a bungalow 3.5–4 m.
  - A pitched ridge sits 1.5–3 m above the top ceiling [S33].
- **Floor-to-floor (my estimate):** about 3.0–3.2 m for housing, 3.9–4.2 m for offices, and about 1.5× a floor for the ground floor [est].
- **Curtain walls.** Mullions are spaced 1.2–2 m apart [S34].
- **What illustrators do.** They draw one scale figure at about 1.7 m with its eyes near the eye line, then more figures at other distances. Figures that are too small make a building "monstrous"; figures that are too large make it look like a model. Figures are kept simpler and lower in contrast than the building [S35].

**Rules for the kit [est]:**
1. **Measure in metres.** Callers pass metres (`hM`, `wM`) and the band's ruler `ppm` (px per metre), and the kit draws `h = hM·ppm`.
   - For the ring, `ppm = W·0.00025·kpx`. That keeps today's mean tree at about 14 m (`W·0.0035·kpx` ÷ 14).
   - Ring in the Sky derives `ppm` the same way from its tree size `sz` (mean tree = 14 m), and its works (`unit·(0.16 + 0.16·R())·s` and the like) move onto the same ruler.
   - Night City sets `ppm` from its row depth.
2. **Take sizes from the kind's real range.** `hM = lerp(lo, hi, r(id,1)^1.5)`, so tall specimens are rarer. A world may scale its whole flora (magic ×1.5, ruins ×0.8), but never one kind against another without a reason.
3. **Keep the scale ladder in order:**
   - grass 0.1–1 m;
   - shrub 1–3 m;
   - house 5–9 m;
   - tree 8–40 m;
   - church or chapel 15–60 m;
   - tower 50–600 m;
   - works 300 m–10 km.

   A world that breaks this ladder does it on purpose: giant mushrooms, a crystal forest.
4. **Caps cull, they don't shrink.** If a thing is taller than its band, either let it overlap the band above (megastructures should) or don't place it. Never clamp one kind's height.
5. **Every built kind carries a scale cue** once it is at least 20 px tall:
   - a door 2 m tall;
   - storeys at 3–3.5 m;
   - optionally a 1.7 m figure, a lamp or a fence.

   The eye reads size from these, not from the outline.
6. **The feature-size rule for detail.** Each detail has a real size in metres and is drawn when `sizeM·ppm ≥ 1.5 px`. Examples: a window 1.2 m, a door 2 m, a fence picket 0.1 m, a leaf clump 1.5 m.

   This one rule replaces the per-kind `detail`/`small` flags. A 300 m tower shows windows from far away; a cottage shows them only up close. Unreal does the same thing by screen coverage, not distance: a smaller mesh at the same distance drops a LOD sooner. Its auto setting for 3 LODs switches at 66.7% and 33.3% of the screen [S36].

   The tiers T0–T3 (§2) become *groups* of features rather than global thresholds. Add **T4, the close-up** (object over 200 px), which draws material marks:
   - bricks and shingles;
   - leaf clusters;
   - bark plates;
   - mortar;
   - signs' letters;
   - weathering streaks.

### 5.2 Trees and plants: 33 kinds

Crown ratio is the crown's width divided by the tree's height. The recipe columns (shapes, colour roles, close-up) are [est] unless a source is cited.

**Colour roles.**
- **Foliage:** F-D, F-B and F-L.
- **Trunk:** T.
- **Bloom or accent:** A.
- **Seasons:** sp, su, au and wi. In winter a deciduous tree drops its F shapes and keeps T as a twig silhouette.

| Kind (world) | Height m | Crown ratio | Silhouette in flat shapes | Colours by role and season | Close up (T3/T4) |
|---|---|---|---|---|---|
| Norway spruce (wilds) | 30–46 [S1] | 0.25–0.3 [S1] | Existing tiered cone; skirt to the ground | F deep blue-green all year; wi: snow L on the tier tops | Drooping tier tips; cones as small D ovals |
| Subalpine fir (wilds, alpine) | up to 50; "narrow, spire-like" [S2] | 0.12–0.18 | A needle cone of 9–14 tiny tiers, tip a long spike | F blue-grey | Tiers stiff, not drooping; upright cones |
| Scots pine (wilds, ruins) | 18 (record tree, 14 m spread) [S3] | 0.5–0.8 | Kinked bare trunk; 2–4 flat pads at the top 30% | T orange in the crown region, grey-brown below [S3][S4] | Plate bark; one dead stub branch |
| Stone (umbrella) pine (Mediterranean cities) | 12–20 (25 or more); crown over 8 m; globe, then umbrella, then flat [S5] | 0.6–1.0 | Straight or forked trunk under one wide flat-bottomed dome | T red-brown with plated fissures [S5] | Underside D band; small sky holes |
| Cedar of Lebanon (magic, cities' parks) | 26–27, spread 24–26; layered [S6] | 0.9–1 | 3–5 horizontal shelves offset sideways, flat-topped | F dark blue-green | Shelf edges L; upright barrel cones |
| Italian cypress (cities, magic) | 12–21 (up to 35); spread 1.5–3 [S7] | 0.1–0.15 | Flame: one tall pointed ellipse, widest at ⅓ | F near-black green | Split light along the axis; a slight S-curve |
| Lombardy poplar (wilds, roadside rows) | 15–20 (30); width 3–5; columnar, broadening below [S8] | 0.2–0.25 | Existing poplar, made narrower and stood in rows | F mid-green; au yellow-green [S8] | Leaf flicker as L specks |
| Giant sequoia (wilds ×, magic) | 83.8; base 11.1; first big branch at 39.6 [S9] | ≈0.25 | Fat flared trunk taller than its crown; 3–5 rounded clumps high up | T rust-red | Furrowed bark stripes; fire scar D |
| Oak, broadleaf (wilds) | 15–21, spread 12–15 [S10] | 0.7–1 | Existing broadleaf: a dome of lobes, wide low limbs | F su green; au russet; wi bare forks | Clumps of lumps; acorn specks |
| Sugar maple (autumn) | 12–37, width 9–18; dense oval [S11] | 0.5–0.75 | Oval of 7–9 lobes on a short trunk | au: yellow, orange and red-burgundy [S11], chosen per lobe | Leaf-scatter decals on the ground |
| Japanese maple (magic, temple) | up to 8, spread up to 10; round-headed [S12] | 1.2–1.3 | Low wide dome, tiered layers, a twisting trunk | F red or green; au orange, yellow, red [S12] | Lace edge: a notched lobe rim |
| Cherry blossom (Yoshino) | 9–12, width 6–15; vase or spreading; weeping forms exist [S13] | 0.7–1.3 | Vase trunk forks; a broad cloud of 6–10 lobes | sp A white or pale pink for 2–3 weeks; au gold; T glossy with horizontal lenticels [S13] | Petal drift on the ground; lenticel dashes |
| Silver birch (wilds, magic) | up to 25, spread over 8; narrowly conical, drooping twigs [S14] | 0.3–0.4 | Existing birch | T white, black and rugged at the base [S14]; au yellow | Hanging twig fringe; catkins |
| Weeping willow (wilds by water) | 9–15, spread 9–15 [S15] | 1.0 | Existing willow | F yellow-green; wi gold twigs | Strand fringe; reflection under it |
| Coconut palm (tropics, cities) | 20–30; crown 6.7–10; trunk 0.3–0.45; fronds 4–6 [S16] | 0.33 | Curved thin trunk; 8–12 arching fronds from one knot | F green, D underside; T grey ringed | Notched frond strips; coconut cluster |
| Baobab (savanna) | ≤25; trunk up to 10.5–15.9 in record trees; branches "like roots" [S17] | 0.8–1 (trunk 0.4) | Bottle trunk; stubby root-like branches; small leaf pads | wi leafless; A white flowers [S17] | Bark folds as vertical D lines |
| Umbrella thorn acacia (savanna) | 5–20 wild; spread 8–13; umbrella [S18] | 1.5–2 | 2–3 forked limbs under one flat-topped wide pad | T grey to near-black [S18]; A cream puffs | Thorn ticks; a weaver-nest ball |
| Banyan (jungle, magic) | 24; crown 486 m around; 3,772 prop roots [S19] | 2–6 | A wide dome over a colonnade of vertical prop roots | T pale grey | Root curtains; a shrine at its foot |
| Dragon's blood (magic, desert) | up to 9, crown to 12, trunk 1.5; repeated two-way forking [S20] | 1.3 | Trunk, then binary forks, then a dense inverted-umbrella cap | resin A crimson [S20] | Spiky leaf rosettes along the rim |
| Joshua tree (desert) | 4.6–9.1, spread 3–5.5 [S21] | 0.6 | Shaggy trunk; 3–8 crooked arms ending in spiky balls | F olive; T straw-shaggy | Dead-leaf skirt texture |
| Saguaro (desert) | 4.6–15.2, width 1.5–3.7 [S22] | 0.25 | Ribbed column + 0–5 arms (out then up) | F sage green; A white crown flowers | Rib lines; spine dots |
| Prickly pear (desert) | 0.9–3, spread 0.8–2.4; flat oval pads [S23] | 0.8 | 5–15 overlapping ovals stacked | F blue-green; A yellow or magenta fruit | Areole dots |
| Moso bamboo (Asia, magic) | culms up to 28, ø 22 cm [S24] | grove 0.5–2 | 6–20 thin vertical culms; feathery tops | F light green; T jade | Node rings every ~0.3 m |
| Tree fern (jungle, magic) | trunk ~4.6; fronds up to 3 [S25] | ≈1.3 | Shaggy trunk; a shuttlecock of 8–14 arching fronds | F glossy dark green [S25] | Fiddleheads at the crown |
| Red mangrove (coast) | 15–24 (XL), spread 9–12; lattice prop roots [S26] | 0.5–0.6 | Dome crown over arched root legs standing in water | F dark green; roots T | Waterline; root arches doubled in reflection |
| Reeds (wetland) | up to 4; plumes dark purple to brown, Aug–Oct [S27] | — | A fringe band of vertical strokes + plume tips | F straw (au/wi), green (su) | Leaning with the wind (`stepsGrass` style) |
| Giant mushroom (magic) | real anchor: *Prototaxites* 8–8.8 tall, trunk ~1 [S28]; fantasy 3–30 [est] | cap 0.6–1.2 | Stalk + one cap (dome or shelf) + gill underside D | A cap red, white or violet; gills glow G at night | Spots; ring skirt; spores as G motes |
| Crystal tree (magic) | real anchor: Naica selenite crystal 11.4 long, 12 t, colourless [S29]; fantasy 5–25 [est] | 0.4–0.7 | A pkCrystals cluster turned upward as trunk + branches | A glass tints; G tips | Inner facet lines; refraction stripe |
| Glow tree (magic, existing) | 8–20 [est] | 0.8 | Broadleaf + pkGlow | G motes | — |
| Dead snag (ruins, burn) | the living species' height minus its crown [est] | 0.2–0.5 | Existing dead; add a broken top and peeled bark | T silver-grey | Woodpecker holes; shelf fungi |
| Bush and hedge | bush 0.5–3; hedge 1–2 [est] | 1–3 | 3–5 lobes (bush); one flat-topped box with lumpy edges (hedge) | F as the trees | Clipped facets; berries A |
| Flower field | 0.2–1.5 [est]; giant flower: real *Rafflesia* 1.11 m across [S30], fantasy 5–30 [est] | — | Far: a dotted band of A over green. Near: Bloom's species (`stepsFlora`) | A by species and season | Individual heads; stems |
| Vines and ivy | follow the host, 0 to the host's full height [est] | — | Drape polygons hung from roof edges and branches; a curtain on ruins | F dark green; au red (Virginia creeper) | Leaf rosettes along a wandering stem |

### 5.3 Buildings and structures: 62 kinds

Recipes are [est] except where cited. All sizes are in metres. "Far / near" says what reads at T1 and what is added at T3/T4.

**Houses and farms**

| Kind | Real size | Silhouette (3–8 flat shapes) | Roof furniture | Window rhythm | Far / near |
|---|---|---|---|---|---|
| Thatched cottage | ridge 5–7; thatch pitch at least 45° [S38]; Irish 45–50°, rafter = house width [S39] | Low wall box + a tall rounded hip of thatch (2× the wall height) + chimney | Chimney with smoke; flush or patterned block ridge [S38] | 2–3 small deep windows; eyebrow dormer | Far: a fat thatch hump. Near: ridge pattern, rose by the door |
| A-frame | 6–10 tall [est]; a steep roof down to grade that forms the side walls; 1960s kit and ski huts; sleeping loft [S40] | One tall triangle + an inset gable triangle + a deck plank | Stovepipe | Full-glass gable grid of 3×3 panes | Far: a sharp Δ. Near: deck rail, shingle rows |
| Row (terraced) house | 2–4 storeys = 6–14; frontage 4–6 [est] | Repeated narrow boxes sharing walls; stepped roofline on hills | Chimney stacks on the party walls; dormers | 2 bays per house, ground-floor door + bay window | Far: a comb of equal teeth. Near: stoops, railings, a different door colour each |
| Stilt house | floor 1.5–3 up [est]; in Assam the stilts are set to the last big flood level [S41] | Deck box on 4–8 posts + a steep hip roof + a ladder | Ridge finials | Shutter openings | Far: a hut floating on ticks. Near: water line, boat, ladder |
| Yurt (ger) | ø 6.5, wall 1.7, centre 2.7, crown ø 1.8 [S42] | Short drum + a shallow cone + a crown ring | Stovepipe through the crown | Door only (no windows) | Far: a white bump. Near: rope bands, a painted door |
| Adobe pueblo | up to 5 storeys, stepped; reached by roof hatches [S43] | 3–5 stacked boxes stepping back + parapets | Ladders poking above the roofs; vigas (dark beam stubs) under the parapets [est] | Few small dark doors | Far: a stepped beige mass. Near: ladders, ovens, rounded corners |
| Gassho minka (thatch farmhouse) | roof ~60°; floor ~6.4×12.7 to 12.7×21.8; posts one ken (1.82 m) apart [S44]; ridge 10–15 [est] | A huge steep thatch A over a short wall band | Ridge cap of timber cross-pieces | 2–3 rows of small gable windows | Far: a steep tan Δ. Near: rows of gable windows, snow on the roof |
| Pagoda | Hōryū-ji's five storeys: 32.45 [S45] | 5 stacked roofs, each narrower, eaves curling up + a spire (sōrin) | Bronze finial rings | None visible; bracket rows | Far: a stack of wings. Near: bracket ticks, bells at the eave tips |
| Mediterranean whitewash | units 3–6 [est]; shallow barrel vaults, limewashed white, blue church domes; each roof terrace is the doorstep of the house above [S46] | Cubes and barrel vaults stacked down a slope + a blue dome | Bell gable; chimneys | 1–2 small blue shutters per unit | Far: white dice on a cliff. Near: stairs, bougainvillea A |
| Scandinavian stave church | nave 7.35×6.1, ridge ~11; six stacked roof sections; dragon heads on the ridges [S47] | A stack of steep roofs + a ridge turret | Dragon heads; spire | Few; a dark gallery band | Far: a pine-cone of roofs. Near: shingle scales, carved portal |
| Scandinavian timber house | 6–8 [est] | Box + a steep gable + a white trim band | Turf roof (green) or a red tile ridge | 2–3 white-framed windows | Far: falu red box. Near: board lines, flag pole |
| Farmhouse + gambrel barn | barn footprint 7.3–11 wide × 6–22 long, plate 3.4, doors 2.7×2.4, loft door 1.8×2.1 [S48]; ridge 9–12 [est] | Gambrel (2-slope) roof + box; the house a gable box nearby | Hay hood over the loft door; cupola; weathervane | Barn: big X-braced doors; house: 2×2 | Far: red barn + white house. Near: X-braces, hay bales |
| Silo / grain elevator | storage silos ø 3–27, height 10–90 [S49]; farm tower silo ~6×15–25 [est] | A cylinder + a dome cap (silo); 4–12 grouped cylinders + a headhouse (elevator) | Chute pipe; ladder cage | None | Far: a white or grey pillar. Near: hoop bands, rust streaks |

**Towers**

| Kind | Real size | Silhouette | Top | Windows | Far / near |
|---|---|---|---|---|---|
| Glass curtain tower | 100–400 [est]; mullions 1.2–2 apart [S34] | Existing glass prism; also notched, chamfered or split-top variants | Mast with a red light; sloped crown | Mullion every 1.2–2 m × floor bands | Far: a flat sky-tinted plane. Near: reflections of the neighbours as offset blocks |
| Art Deco setback | Empire State: roof 381 m, 102 floors, 1916-zoning setbacks [S50] | 3–5 boxes, each 0.7× the one below + crown + spire (existing deco) | Crown, spire | Vertical piers | §2.1 |
| Brutalist slab + service tower | Trellick: roof 98 (120 with mast), 31 floors; a separate service tower linked at every third storey, boiler house on top [S51] | Tall slab + a thin core tower beside it + bridges every 3 floors + a jutting top box | The cantilevered plant room | Deep balcony ribbons; window ticks in the core | Far: an "h" or "Π" shape. Near: board-marked concrete stripes |
| Stepped ziggurat | Ur: base 64×45, over 30 tall [S52] | 3–7 terraces, each narrower + a central stair ramp + a shrine box | Shrine | None | Far: a stepped mound. Near: buttress ribs, stair ticks |
| Needle (comms) | CN Tower: 553.3 total, pod top 356, SkyPod 446.5; three legs joining into a hexagonal core (a Y at the base) [S53] | Tapering shaft + a fat pod at 64% + a small pod at 81% + an antenna | Antenna with red beacons | A pod window ring | Far: a needle with a bead. Near: a lit window band, a glass floor |
| Twisting tower | Shanghai: 632, 128 floors, ~120° twist [S54]; Turning Torso: 190, 54 storeys, 9 five-storey segments, 90° twist, exterior steel frame [S55] | Stack of floor slabs, each rotated (draw as slices whose width follows a cosine) | Slanted top | Floor lines curving across the twist | Far: an S-curved spindle. Near: an exterior lattice spine (Torso) |
| Supertall spire | Burj Khalifa: 828, 163 floors, Y plan, wings stepping back in a spiral, spire over 200 [S56] | 3 lobes stepping back in a spiral + a long spire | Spire | Fine vertical lines | Far: a needle among towers. Near: wing tips at each setback |
| Arcology | Arcosanti: apses (quarter-spheres), barrel vaults, south-facing, silt-cast concrete; planned for 1,500–5,000 [S57]; fantasy arcologies 300–3,000 [est] | A giant terraced mountain or bowl + an apse + vaults + hanging gardens | Solar sails, gardens | Terrace ribbons; port holes | Far: a man-made mesa. Near: terraced gardens, tiny figures for scale |

**Civic and industry**

| Kind | Real size | Silhouette | Top | Windows | Far / near |
|---|---|---|---|---|---|
| Gothic cathedral | Cologne: spires 157.4, length 144.6, façade 61.5, nave 43.35 [S58]; naves Beauvais 47, Amiens 42.3, Chartres 37 [S59] | Long nave box + a pitched roof + 2 west towers + flying-buttress ticks + a crossing spire | Pinnacles, crockets | Lancets; a rose window (G at night) | Far: twin spikes over the roofs. Near: buttress arcs, tracery |
| Mosque | Süleymaniye dome 53 high, ø 27, 4 minarets [S60]; Blue Mosque: 6 minarets of 64 with 2–3 balconies, dome 43 high / ø 23.5 inside, a cascade of semi-domes [S61] | Central dome + 2–4 half-domes stepping down + 2–6 needle minarets with balcony rings | Finials (alem) on domes and minarets | Rows of small arched windows at the dome drums | Far: dome hill + needles. Near: balcony rings, lead-grey ribs |
| Shinto torii | Itsukushima: 16.8 high, crossbeam 23.3, vermilion [S62]; common torii 3–8 [est] | 2 posts + an upper curved lintel + a straight tie beam | — | — | Far: Π in vermilion. Near: black cap, cypress-bark roof (on a shrine) |
| Castle keep + curtain wall | White Tower: 27, 36×32 [S63]; keeps commonly ~20 (up to 40); walls ~2.5 thick [S64]; wall height 8–12 [est] | Square keep + 4 corner turrets; a long wall + round towers every 30–50 m [est] | Crenellations (merlon ticks); flags | Arrow slits | Far: a toothed block. Near: machicolation ticks, a gate with a portcullis |
| Lighthouse | US: 4.9–64 (Cape Hatteras), most 9–27 [S65] | Tapered tower + gallery ring + lantern box + dome cap | Lamp G + a beam wedge at night | Small windows spiralling up | Far: a striped needle on a point. Near: daymark stripes, keeper's cottage |
| Observatory | Palomar dome ø 42, 41 tall [S66]; Mt Wilson solar tower ~50 [S67]; small domes 5–15 [est] | Drum + a hemisphere + a dark slit | The slit open, showing a telescope tube | None | Far: a white pearl on a ridge. Near: shutter rails |
| Clock tower | Big Ben: 96, 12 m square, dials ø 6.9 at 54.9 m [S68] | Square shaft + a clock-face band + a belfry + a steep spire | Spire, finials | Dial disc (G at night) | Far: a needle with a light disc. Near: hands, tracery |
| Windmill (smock) | sails span 18.5–22; stage at 5.1–6.1 [S69][S70]; body 15–25 [est] | Tapered octagon + a cap + an X of 4 sails + a stage ring | Fantail | 1–2 tiny windows | Far: an X on a cone. Near: sail lattice, the stage rail |
| Water tower | fluted column: head range 9–37 (30–120 ft), tank ø 13–37, pedestal ø 7.6–27 [S71]; types: multi-leg, spheroid, composite, fluted [S72]; NYC roof tanks (§1.2) | Leg lattice + tank (multi-leg), or a stalk + bulb (spheroid) | A town name painted on the tank | — | Far: a lollipop. Near: ladder, catwalk |
| Radio mast | KVLY: 605.6 (628.8 until 2019), guyed [S73]; local masts 30–150 [est] | A hairline lattice + 2–3 guy-wire fans | Red beacons stepped up it | — | Far: a red blink line. Near: lattice zigzag |
| Transmission pylon | UK at least 36, Thames crossing 190; the T-pylon is about 15 m (50 ft) shorter [S74] | Tapered lattice + 2–3 cross-arms + sagging wires | Earth-wire peak | — | Far: a chain of Ys with catenaries. Near: insulator strings |
| Wind turbine | US 2023 average: hub 103.4, rotor 133.8 [S75] | A white stalk + a nacelle + 3 blades | Red light | — | Far: a three-armed star. Near: blade tip stripes |
| Cooling tower | up to 200 tall, ø 100 [S76] | Hyperboloid (concave sides) + a steam plume | Plume | — | Far: a waisted cup + cloud. Near: a ring of legs at the base |
| Factory + chimneys | chimneys 39–343 in Ferrovial's examples [S77]; brick mill chimney 30–90 [est] | A saw-tooth roof shed + 1–4 tall chimneys + a tank | Smoke; ladder; bands | Big multi-pane windows | Far: saw-tooth + sticks. Near: rust, pipes |
| Greenhouse | Kew Palm House: 110.5 long, centre 30.5 wide × 19.2 high, wings 15.2 × 8.2 [S78]; Eden biomes 55 high × 110 wide × 240 long, hexagons up to 10.9 [S79] | Vault body + a raised centre + a lantern (Kew), or chained geodesic bubbles (Eden) | Lantern | Glazing bars every ~1 m (Kew) or hexes (Eden) | Far: glinting bubbles. Near: palms inside, through glass |
| Suspension bridge | Golden Gate: towers 227, span 1,280, deck 67 up, 27 wide, cables ø 0.92 [S80] | 2 towers + catenary + a deck line + hanger ticks | Tower lights | Tower portals | Far: two Π and a smile. Near: hangers every ~15 m [est] |
| Arch aqueduct / viaduct | Pont du Gard: 49, 3 tiers (6 and 11 arches on the lower two), spans ~25 [S81] | Repeated arch tiers, smaller arches above | — | — | Far: a lace band. Near: voussoir stones |
| Beam / foot bridge | 1–10 tall, spans 5–50 [est] | A deck slab + piers, or a hump arch | Lamps | — | Far: a line. Near: rails, lamps |

**Builders' megastructures and sci-fi** (the builders' style)

| Kind | Real size | Silhouette | Top | Lights | Far / near |
|---|---|---|---|---|---|
| Pylon | 50–2,000 [est] | Existing rounded pylon | Glow cap | A line of light up one edge | §2.1 |
| Ring habitat | Stanford torus: ø 1.8 km, tube 130, 6 spokes ø 15, a mirror over the hub [S83]; ringworld §0 | Ellipse ring + spokes + a hub, seen tilted in the sky or standing on edge | Mirror | Lit windows band | Far: a sky ring. Near: hull panels, docking lights |
| Dome habitat | Eden-type domes 30–110 [S79]; fantasy up to 2 km [est] | Hemisphere + a hex grid | Oculus G | Hex glints | Far: a pearl. Near: gardens inside, through a hex grid |
| Landing pad | 61 m square + four 46 m contingency pads [S84] | A flat disc or square + a ring of lights + a lander | Beacon | Edge lights | Far: a lit ring on the ground. Near: H mark, scorch |
| Space-elevator tether | tens of thousands of km up [est; S-source blocked] | A hairline from the ground to the zenith, fading upward; a base station; climber beads | Counterweight in the sky | Climber lights | Far: a vertical silver line. Near: the base anchor platform |
| Solar arrays | panels 1.65–1.75 × 1.0 [S85] | Tilted dark-blue strips in rows following the land | — | Sky glint stripe | Far: blue-black terraces. Near: cell grid, frame |
| Container stacks / port | containers 6.06 or 12.19 × 2.44 × 2.59 (high cube 2.9) [S86] | Coloured bricks in stacks 3–7 high + gantry cranes | Crane boom | — | Far: striped blocks. Near: corrugation lines, stencils |
| Maglev / monorail line | beam 5–20 up [est] | A beam on T-pylons + a capsule train | — | A window strip | Far: a lit thread. Near: pylon heads |

**Magic**

| Kind | Real size | Silhouette | Top | Lights | Far / near |
|---|---|---|---|---|---|
| Wizard tower | anchor: Irish round towers 18–40, base ø 4–6, door 2–3 up (up to 8), conical stone cap, slits at the top [S87]; wizard 20–80 [est] | Existing wizard; add raised door, cap and lean | Star finial; orbiting motes | High slit windows G | Far: a pencil. Near: stone courses, a ladder to the raised door |
| Floating island | 20–500 across [est] | An inverted cone of rock + a grassy top lens + hanging roots + a waterfall | Trees, a cottage | — | Far: a spinning-top shape. Near: roots, a waterfall dissolving into mist |
| Standing stones | Stonehenge circle ~30 across, lintels ~4 up, Heel Stone over 36 t [S88] | Existing monolith; add trilithon (2 posts + a lintel) and circle layouts | Lintels | Rune G at night | Far: a broken comb. Near: lichen dots |
| Crystal spire | anchor: 11.4 m Naica crystal [S29]; spires 20–200 [est] | Existing crystals scaled up, 1–3 prisms | Glow tip | Inner light | Far: a glass needle. Near: facets, shards |
| Giant flower | anchor: *Rafflesia* 1.11 across [S30]; fantasy 5–30 [est] | Stalk + a bloom (from `stepsFlora`) + leaves | Pollen G | — | Far: a coloured disc on a stick. Near: petal veins |
| Onion-dome palace | 20–60 [est] | Existing onion + more drums, at mixed heights | Finial | Arched windows | Far: bulb cluster. Near: gilt ribs |

**Ruins and post-apocalyptic**

| Kind | Real size | Silhouette | Note | Far / near |
|---|---|---|---|---|
| Broken arches | Colosseum: 48.5, 188×156, 80 arches per tier, 3 arcades + an attic [S82] | An arcade band cut by a jagged line, tall on one side | Reuse the aqueduct, then cut it | Far: a sawn ring. Near: vegetation in the arches |
| Skeletal tower | the glass tower's size | Floor slabs as D lines + a column grid, with no glass; the top bent or missing | §2.1 ruin + exposed frame | Far: a ladder silhouette. Near: hanging cables, a tree on top |
| Overgrown block | any | Any kind + vine drapes + a canopy on the roof | Vines (§5.2) | Far: green-capped boxes. Near: leaf rosettes |
| Crashed ship | 747: 70.7 long, 64.5 wingspan, 19.4 tall [S89]; starships 100–2,000 [est] | Hull lens tilted 10–30°, nose buried + a broken fin + a scar groove (§2.3 wreck) | — | Far: a tilted wedge. Near: rib gaps, a debris trail |
| Shanty / scrap shack | 2.5–4 [est] | Mismatched boxes + lean-to roofs + a container | Tarp colours | Far: a patchwork. Near: corrugation, a barrel fire |

**Neon and cyberpunk**

| Kind | Real size | Silhouette | Signs and lights | Far / near |
|---|---|---|---|---|
| Holo / LED megascreen | Times Square sign: 23.7 × 100.5, "eight stories tall" [S90] | A flat rectangle wrapped on a façade corner | G full, sometimes split into 2–3 tones | Far: a glowing slab. Near: an image band, pixel grid |
| Projecting neon signs | Hong Kong signs projected from façades over the streets; Hong Kong's 2010 Signboard Control System made about 190,000 signboards illegal, and fewer than 400 neon signs remain [S91] | Stacked vertical blades and horizontal boards out over the street, overlapping in depth | Tube outlines in 2 colours, "one color bleeding into the next" [S91] | Far: coloured bars filling the gap between buildings. Near: glyph strokes, frame |
| Capsule block | Nakagin: capsules 2.5×2.5×4.0 with a 1.3 m round window, 140 capsules on towers of 11 and 13 floors [S92] | Core shafts + cubes stuck on at angles | A round porthole per cube | Far: a sugar-cube stack. Near: portholes lit unevenly |
| Megablock (walled-city) | Kowloon: up to 14 storeys under the airport height limit; roofs as public space; corridors joining buildings [S93] | Many slabs merged into one mass with a flat common roof + antenna forests | Window ACs, signs, laundry | Far: one block with a lit pixel field. Near: roof gardens, aerials, laundry poles |

### 5.4 Rocks and landforms as tiles

| Kind | Real size | Silhouette | Far / near |
|---|---|---|---|
| Boulder | more than 256 mm (Wentworth); ISO: 200–630 mm, larger counts as "large boulder" [S94]; erratics 1–10 m [est] | Existing pkRock | Near: a crack line, lichen |
| Hoodoo | up to 60; soft rock under a harder cap; red, orange, yellow, white [S95] | Stacked bulging drums + a flat cap, wider than the neck | Far: a fence of pins. Near: banding, a balanced cap |
| Mesa / butte | a mesa's top is wider than it is tall; a butte's is narrower; hard rock over soft [S96]; 50–600 [est] | Flat top + a vertical cliff band + a talus apron | Far: a table. Near: strata stripes, talus fan |
| Natural arch | Delicate Arch: opening 14, whole 18; Landscape Arch: span 93.3; Double Arch: 34 high, 44 across [S97] | A slab with an elliptical hole + legs | Far: a ring. Near: varnish streaks |
| Sea stack | Old Man of Hoy: ~137 tall, 30 at the base; sandstone and flagstone layers, blocky jointing [S98] | A tall block on a wave-cut base | Far: a pillar in the sea. Near: layer ledges, birds, foam ring |
| Scree / talus | concave, near the angle of repose only where fed; coarse clasts gather at the foot [S99]; 30–40° [est] | A triangular fan under a cliff notch, dotted with grading size | Far: a pale fan. Near: individual stones, larger at the bottom |
| Cliff / big wall | El Capitan: ~1,000 above its talus (3,300 ft) [S100] | Stacked slabs (§2.3 crag) | Far: a vertical wall with a pale face. Near: crack systems, ledges, a tiny climber (scale!) |
| Balanced rock | 3,577 tons [S97] | A boulder on a narrow pedestal | Near: the shadow gap under the boulder |

### 5.5 Small things for close-ups (drawn only when ≥ 1.5 px per feature, §5.1)

| Thing | Real size m | Shapes | Use |
|---|---|---|---|
| Person (scale figure) | 1.71 / 1.59 [S31] | A capsule body + a head disc, with no features | Every built scene at T3 |
| Door | 2.03 × 0.76–0.91 [S32] | Dark rect + a step | On every building at T2 |
| Fence | picket 0.9–1.2; privacy 1.8–2.4; pool 1.2–1.5 [S101] | Posts + rails, or pickets every ~0.15 [est] | Houses, farms |
| Streetlight | residential 3–4.6; parking 4.6–9.1; highway over 9.1 [S102] | Pole + an arm + a head + a G pool at night | Cities, neon |
| Utility pole | e.g. a 12.2 m (40 ft) pole buried 10% + 0.6 m (2 ft), so about 10.4 above grade [S103] | Pole + a cross-arm + insulator dots + sagging wires | Suburbs, ruins, Night City |
| Bench | seat 0.36–0.48 (typically 0.41) high, 0.41 deep, at least 1.3 long (1.5 common), back at least 0.41 above the seat [S104] | 2 slats + legs | Parks |
| Mailbox (curbside) | 0.47–0.58 × 0.16–0.28 × 0.15–0.38 [S105]; on a post ~1.1 [est] | A loaf box on a post + a flag A | Farms, suburbs |
| Barrel | 225 L: 0.995 tall, ø 0.56 at the ends, 0.70 at the belly [S106] | A bulged rect + 2 hoops | Ruins, docks, taverns |
| Pallet / crate | pallet 1.2 × 0.8 × 0.144 [S107]; crates 0.4–1.2 [est] | Slats; a box + a cross brace | Docks, ruins |
| Shipping container | as in §5.3 [S86] | Box + corrugation | Ports, neon |
| Well | wall 0.8–1 high, ø 1–1.5; roof to ~2.5 [est] | A drum + 2 posts + a small gable + a bucket | Cottages, magic |
| Cart / handcart | 1.5–3 long, wheels ø 0.8–1.2 [est] | A box + 2 wheel discs + shafts | Farms, markets |
| Bicycle | ~1.7–1.8 long, wheels ~0.7 [est] | 2 rings + a triangle | Cities, Night City |
| Laundry line | posts 1.8–2.2, line between buildings at any storey [est] | A catenary + 4–8 coloured rect flags | Megablocks, Mediterranean, row houses |
| Phone box | ~2.5 tall [est; source blocked] | Red box + a crown + glazing bars | Cities |
| Hydrant | 0.6–0.8 [est] | A stub + a dome + side nubs | Cities |
| Sign | road plate 0.6–0.9 at ~2.1 [est]; shop sign as wide as the shop front | Plate on a post; a board over a door | All |

### 5.6 How games build big, varied kits from few parts

**What they do:**
- **CGA shape grammar** (Müller et al. 2006):
  - A shape is a symbol plus a *scope*, an oriented box. Rules have the form `pred : cond ; succ : prob`, applied in priority order "from low detail to high detail".
  - **Split** divides along an axis, **Repeat** tiles as many as fit, and **Comp** breaks a volume into faces and edges.
  - A building starts as a crude **mass model** (a union of boxes, cylinders and roofs). Façades come from its faces, then floors, tiles and windows.
  - **Snap lines** keep floors and openings aligned across volumes, and **occlusion queries** turn a window hidden by a neighbour back into wall.
  - Shapes are marked inactive, not deleted, so the derivation can be queried [S108].
- **The origins:**
  - Parish & Müller 2001 built a city in three stages: L-system roads guided by image maps under global goals and local constraints, then lots, then a building L-system [S109].
  - Wonka et al. 2003 introduced the split grammar plus a *control grammar* and attribute matching, so one system builds many styles [S110].
- **In practice:**
  - One style was "39 shape-grammar rules and 32 control parameters".
  - "Just a few well-modeled stochastic buildings can populate a complete city", but "too much randomness creates chaotic, uninteresting designs".
  - First get one instance right, then randomise gradually [S111].
- **Wave Function Collapse:**
  - Its output is locally similar to an example.
  - Simple-tiled mode works from tiles plus allowed adjacencies.
  - It loops by collapsing the lowest-entropy cell, then propagating, until done; a contradiction means failure [S112].
- **Townscaper:**
  - An irregular grid of hexes split into quads with points moved.
  - Modules are **corners** (in the manner of Marching Cubes), chosen by WFC.
  - Priority "recipes" (a garden only in an enclosed flat area).
  - Small details (windows, chimneys, bushes, benches) vary more, while large shapes stay predictable. Failure is allowed to be silent [S113].
- **Skyrim's kits:**
  - Two kit artists made seven kits that served more than 400 cells.
  - Pieces stay inside their footprint, sub-kit footprints are multiples of each other, and grid snaps are large.
  - Players notice repeated *clutter* more than repeated architecture.
  - Variants are numbered swaps with the same footprint, and standard pieces are preferred over hero pieces [S114].
- **Shared standards.** Use one shared door and window standard across kits, and commit to kit dimensions early because they set a space's proportions [S115].

**What to adopt for a 2D painted kit [est]:**
1. **A building is a small grammar, not a function.** Every archetype becomes a rule set in metres:

   ```
   Building(culture, kind, hM, wM) → Mass
   Mass   → Base(gf = 1.5·storey) + Body(n = floor((hM - base - crownH)/storey)) + Crown(kind) + Furniture*
   Body   → Floor × n            (Repeat along y; storey = culture.storey, 3.0–4.2 m)
   Floor  → Bay × floor(wM/bayM) (Repeat along x; bay = culture.bay, 1.2–4 m)
   Bay    → Pier | Window(culture.win) | Balcony | Blank   : by keyed prob
   Crown  → Cornice | Gable(pitch) | Hip | Gambrel | Dome | Onion | Setback×k + Spire | Thatch | Terrace | Pagoda×n
   Furniture → { tank, penthouse, mast+beacon, chimney, dragonhead, finial, sign, antenna, solar, laundry } : by culture weights
   ```

   Doors, storeys and bays are shared metres, which is CGA's snap lines in 2D. Windows then line up along a street and the scale reads.
2. **Cultures are tables, not code.** One row per culture:
   - storey and bay in metres;
   - roof kinds and pitch (thatch at least 45° [S38], gassho ~60° [S44], A-frame to grade [S40]);
   - wall materials;
   - window shapes (lancet, arched, round porthole [S92], ribbon, punched);
   - furniture weights;
   - night-light pattern.

   Worlds pick cultures by weight:
   - wilds: cottage, stave, farm;
   - cities: row, deco, glass, brutalist, civic;
   - neon: capsule, megablock, glass + signs;
   - builders: pylons, rings, domes, pads;
   - magic: wizard, pagoda, onion, minka, crystal;
   - ruins: any culture's rules + a ruin pass.
3. **Ruin and overgrowth are passes over any building** (cut, strip glass, drape vines, tilt), not kinds of their own. That multiplies the ruin set by every culture.
4. **Keyed randomness per rule** (§3.4): each rule draws `r(id, ruleIndex)`, so the feature-size rule (§5.1) adds windows without moving the crown.
5. **Streets as 1D WFC or adjacency lists.**
   - Row houses share party walls and alternate door sides.
   - A shop front sits only on a ground floor facing the street.
   - Tall buildings cluster (downtown) and step down outward.
   - Night City's rows use the same adjacency on height classes, so a skyline has rhythm: tall, short, tall, steps.
6. **Vary the small things more than the big ones** (Townscaper's lesson [S113], and Skyrim's [S114]). Keep silhouettes per kind predictable and let furniture, colour, window states and clutter vary widely. That is also the right way round for readability (§1.1).
7. **Count of combinations.** Take 8 bases × 10 bodies × 14 crowns × 20 furniture items (pick 0–3) × 12 cultures' palettes. That is on the order of 10⁶ visibly different buildings from about 60 drawing parts.

### 5.7 Data shape for the kinds [est]

```js
// paintKit: one row per kind; sizes in metres; parts drawn by the grammar; details by real size
PK_KINDS.spruce   = { cls:'tree', h:[30,46], crown:[0.25,0.3], worlds:{ wilds:3, ruins:1 }, parts:['trunk','tiers'],
                      season:{ wi:'snowTips' }, details:[['tierTips',0.6], ['cones',0.12]] };
PK_KINDS.pagoda   = { cls:'bldg', h:[20,55], storey:6, culture:'jp', parts:['base','roofTier*5','sorin'],
                      details:[['brackets',0.3], ['bells',0.25]] };
PK_KINDS.capsule  = { cls:'bldg', h:[30,60], storey:2.5, culture:'metab', module:[2.5,2.5,4.0], window:{ round:1.3 } };
```

- `pkThing(x, X, Y, kind, ppm, c, id, night, season)` replaces the many entry points. Size is `lerp(h, r(id,1)^1.5)·ppm`; details are drawn when `size·ppm ≥ 1.5 px`.
- The existing `pkTree` and `pkBuilding` stay as the drawing parts it calls, so old renders keep their look under the old ids (AGENTS §7).

### 5.8 What to build, in order [est]

1. **Fix scale first:**
   - one `ppm` per band in `stepsRing`, `stepsWhimsy` and `genCityscape`;
   - sizes from `PK_KINDS`;
   - caps that cull or overlap, never clamp per kind (§5.0).

   This alone fixes shrub-sized buildings.
2. **Use the feature-size LOD rule and T4 close-up marks** (§5.1, rule 6). It replaces `detail`/`small`.
3. **Add trees in silhouette families:**
   - the narrow-spire fir;
   - flat-pad pine;
   - umbrella pine;
   - layered cedar;
   - cypress flame;
   - palm;
   - baobab;
   - acacia;
   - banyan;
   - dragon's blood;
   - Joshua tree;
   - saguaro;
   - prickly pear;
   - bamboo;
   - tree fern;
   - mangrove;
   - mushroom;
   - crystal.

   Then add the season variants for maple, cherry, birch and oak. That is 18 new outlines from about 6 drawing parts: cone tiers, pad, lobes, frond fan, column + arms, and fork.
4. **Put the building grammar in place** (§5.6). Port the existing 10 archetypes onto it first, unchanged, then add cultures one at a time:
   - farm;
   - jp;
   - med;
   - nordic;
   - pueblo;
   - gothic;
   - islamic;
   - metabolist / walled-city;
   - brutalist;
   - builders.
5. **Civic landmarks as rare "hero" kinds**, at most one or two per view: cathedral, mosque, lighthouse, clock tower, windmill, observatory, bridge, aqueduct. Their silhouettes make a world legible at T1.
6. **Infrastructure threads that join a world:** pylons with catenaries, utility poles, maglev, aqueducts. They are long, cheap, give scale for free, and are camera-stable when keyed by world cell.
7. **Landforms as tiles:** hoodoo fields, mesas, arches, sea stacks, scree fans, big walls. Each is a band-spanning object for ridges (§3.3).
8. **Small-things clutter at T3+:** figures, doors, fences, lamps, signs, laundry. Vary these most (§5.6, item 6).
9. **Night City:** neon blades in the gaps between buildings, LED megascreens on corners, capsule and megablock kinds, laundry and AC clutter, antenna forests on the roofs.
10. **Ring in the Sky and the ringworld:** the builders' set, ring habitats in the sky, tethers, landing pads, solar terraces, all in real metres, with tiny doors and figures at their feet. A 2 km pylon reads as 2 km only beside a 2 m door.
