# Veins of Light Prior Art: Networks Running Through Matter

**Key to confidence:** **[src]** = stated in a consulted source (see Sources). **[gen]** = general knowledge, not confirmed this session. **[est]** = my estimate or design proposal; tune it by eye.

**The brief (Ruby):** "a network / circuitry going through these things … more like a network and less like the first layer of the lichtenberg." The materials are stone, sand, fibre and skin (Growth Medium). Today's Tendrils part grows a **tree** from the dial's side: every tip is a dead end and nothing reconnects. A Lichtenberg figure is also a tree. So the rebuild must make **cycles**: closed loops, nodes of degree 3 or more, and more than one route between two points.

**Hue roles.** Six hues, H1–H6. Nothing is drawn in a fixed colour.

| Hue | Colours | Default intent [est] |
|---|---|---|
| H1 | Material | the stone, sand, fibre or skin |
| H2 | Second material | the inlay inside chosen loops, or the alternate strata |
| H3 | Network core | the line itself: copper, gold, resin, lumen |
| H4 | Network glow | the halo the lines throw into the material |
| H5 | Node / pad | junction pads, vias, synapse beads |
| H6 | Pulse | the data or sap travelling along the edges |

**No procedural borders.** The network runs off every edge of the canvas. No frame, no vignette, and no trunk that starts politely at the margin.

---

## A. Why the current one reads as Lichtenberg

- Space colonization in its **open** form gives each attraction point to its *nearest* vein node only, so two veins never grow to the same place and no loop can close [src: Runions 2005].
- A single root on the dial's edge plus pruned growth gives the dielectric-breakdown look: one trunk, forking, then thinning to nothing [gen].
- Missing pieces: no junction nodes, no reconnection, no hierarchy *across* loops. It has a hierarchy *along* one trunk, and nothing that says "designed" or "carrying signal".

---

## B. Network algorithms that make loops

The **cyclomatic number** (edges − nodes + components) counts independent loops: 0 for any tree, about 2n for a full Delaunay triangulation [gen]. Every method below is a way to choose where it sits between those extremes.

### B.1 Proximity graphs: the cheap, controllable family

- **The containment chain:** Euclidean MST ⊆ relative neighbourhood graph (RNG) ⊆ Gabriel graph ⊆ Delaunay triangulation [src: Wikipedia, Gabriel graph]. (The matgeom documentation states the Gabriel graph is a subgraph of the RNG, which is backwards; Wikipedia has it right.)
- **Gabriel edge:** two points are joined when the disc with them as diameter holds no other point [src].
- **RNG edge:** joined when no third point is closer to both than they are to each other (the empty "lune") [gen].
- **Look [est]:** Delaunay is all triangles (a wireframe); Gabriel mostly quads and pentagons (areole-like); RNG long irregular loops (the most "grown"); MST a tree (Lichtenberg again).
- **MST plus k edges:** add back the Delaunay edges with the highest **detour ratio** (tree path ÷ straight length) first, the way a planner adds a ring road [est]. One slider, Loops, sweeps from tree to mesh.
- Triangle Mesh (Delaunay, Thin Out) exists but has no hierarchy, routing style or junction outputs (§E).

### B.2 Leaf venation, closed form (Runions et al. 2005)

- **Open venation** [src]:
  - Auxin sources are dart-thrown, at least a birth distance from other sources and veins.
  - Each source pulls only its nearest vein node, which steps a fixed distance D along the averaged direction.
  - A source dies when any vein comes within the kill distance d_k.
  - Smaller d_k gives denser venation, whose higher-order veins "eventually anastomose".
- **Closed venation** [src]:
  - A source pulls *every* node in whose relative neighbourhood it lies, so several veins converge on it.
  - It is removed only when all the tagged veins have reached it.
  - That delay is what makes them meet and close loops.
  - The Urquhart approximation (Delaunay minus each triangle's longest edge) is faster and "qualitatively similar".
- **Width** [src]:
  - Murray's law: rⁿ(parent) = Σ rⁿ(children).
  - n = 3 for the developmental model, 2 for the others; veinlets get the minimum width.
  - In closed patterns all children contribute equally.
- **Growth mode** [src]:
  - Marginal growth gives smooth primaries and ladder-like tertiaries.
  - Uniform (isogonic) growth gives fine reticulate tertiaries.
- Nervous System's *Hyphae* lamps grow from root points into an "auxin filled environment", flow reinforcing used paths [src].
- **Lesson:** Tendrils is one rule from loops, but the result stays botanical. It is the organic end of the axis, not the whole surface.

### B.3 Why nature keeps loops (Katifori; Ronellenfitsch)

- With network cost ∝ conductance^γ, steady-flow optima are **trees** for γ < 1 [src: Katifori, Szöllősi & Magnasco].
- **Random damage or a fluctuating load** (a moving sink) produces **hierarchically nested loops** even at γ = 0.1 [src: Physics Today; arXiv 0906.0006].
- Dicot leaves reroute flow around injury; the "leaves are trees" claim is wrong because veins of different orders join directly [src].
- **Nesting** [src: arXiv 1507.04487]:
  - Large loops are made of thick veins and hold smaller loops of thinner veins.
  - Loops subdivide once they pass a threshold area.
  - Noise in that threshold sets how strongly nested a leaf is.
- **Leaf vocabulary** [src: Digiphyll glossary]:
  - Primary (1°) are the largest veins; then 2° and 3°.
  - An intercostal is a tertiary vein that meets a secondary vein but no primary.
  - The smallest closed loops are **areoles**; free-ending veinlets poke into them [gen].
- **Lesson [est]:** recursive subdivision is a direct algorithm. Take the faces of a coarse graph, split each face above an area threshold with a thinner chord, and repeat 2–4 orders. This is the best single recipe for "network, not lightning".

### B.4 Physarum transport networks

- **Jones's agents** (2010) [src: Jones, UWE repository]:
  - Agents sense three points ahead at sensor angle SA and sensor offset SO, turn by rotation angle RA, move, and deposit trail. The trail diffuses by a 3×3 mean and decays.
  - RA = SA = 45°: lacunae keep closing toward a minimal network.
  - RA > SA: spontaneous branching.
  - SA 22.5°, RA 45°: branches sprout and anastomose across lacunae, ever-changing.
  - Foraging between nodes, low SA (11.25–22.5°) approximates the **Delaunay triangulation**; SA = 45° gives **Steiner-like** minimal trees.
  - Larger SO gives thicker paths; filamentous networks use a population of 2–3% of the lattice.
- **Sage Jenson** adapted Jones's model, rendering density with a Beer's-law path tracer, casting 3D forms in bronze, then moving to 2D for "softness" [src: Nervous System]. The loop: sense, rotate, move, deposit, diffuse, decay [src: r-bloggers]. NetLogo's version: higher "fluid turbulence" adds branches [src].
- **Tero et al. (2010):** the plasmodium linked oat flakes placed as Tokyo-area cities, rivalling the rail network for cost, efficiency and fault tolerance, through flux-to-conductance feedback [gen; abstract behind a captcha].
- **For us [est]:** agents are costly at 3072 px. Run Tero's model on a *graph*: Kirchhoff flow on Delaunay between rotating source/sink pairs (Katifori's fluctuating load, so loops survive), conductance growing with flux. About 40 iterations over ≤ 600 nodes is cheap.

### B.5 Roads and streets

- **Parish & Müller (2001):** an extended L-system grows highways and streets from image maps; **global goals** are street patterns and density, **local constraints** water, parks, elevation and street crossings; the result is blocks and lots [src: SIGGRAPH archive; Purdue course]. Constraints snap a segment to a nearby intersection or extend it across a road, which closes blocks; patterns are rectangular, radial and branching [gen].
- **Chen et al. (2008):** streets as hyperstreamlines of a designed **tensor field**, two orthogonal families with singularities: grids that bend [src]. **Galin et al. (2010):** anisotropic shortest paths over terrain cost [src].
- **Lesson [est]:** a snap radius turns growth into a network. A tip within r of an edge joins it and stops.

### B.6 Voronoi edges

- Worley noise (1996) gives F1, F2…; with Euclidean distance it is non-differentiable exactly on the Voronoi edges [src]. F2 − F1 is the classic edge map [gen]. The app's Cells part already outputs it.
- **Every Voronoi vertex has degree 3 at roughly 120°** [gen]. That reads as foam, cracked mud and kintsugi, not circuitry. Use it for the second material's cells, or as the routing "ways", rather than as the network itself.

### B.7 Shortest-path trees with redundancy

- **The union of shortest-path trees from 2–6 hubs** over a cost field (the material's ways) has a loop wherever two trees meet, and each edge's use count is its hierarchy: w ∝ use^(1/n), Murray's law [est].
- **2-edge-connected augmentation** (no single cut disconnects anything) is the engineer's form of Katifori's damage criterion [gen].

### B.8 Biological networks

- **Retina** [src: arXiv 1605.00763]: vessels leave the optic disc, branching and thinning; arteries are thinner than veins, with a wider light reflex; arteries and veins *cross without joining*. **Two interleaved trees that cross** read as a network without being one.
- **Mycelium:** hyphae fuse (anastomosis) into loops, and cords thicken along used routes [gen; Fricker et al., "The Mycelium as a Network", title only]. *Panellus stipticus* mycelium glows in culture, peak emission 525 nm [src].
- **Neurons:** small-world wiring, with dense local loops plus a few long links, and beaded varicosities along axons [gen]. Beads are a natural "pad" vocabulary for the organic end.
- **Murray's law (1926):** parent r³ = Σ child r³ minimizes pumping power plus blood volume [gen]. Runions found n = 2 better for leaf drawings [src].

---

## C. Visual prior art: "circuitry through matter"

- **Resin and LED river tables:** NeoPixels under the river, a first resin pour dyed with mica to **diffuse**, clear layers over it, the wood grain beside [src: Adafruit]. **Lesson:** the light lives *in a channel*; the material round it stays matte and room-lit.
- **"Circuit board" stone and brass inlay:** traces of brass or resin set flush in marble or wood [gen; no good source found].
- **Light-transmitting concrete:** LiTraCon (Áron Losonczi) is about 4% glass fibre, mixed in "like an aggregate" [src: Dwell]; translucent concrete passes about 2% of light, and shadows show through as silhouettes [src: Wikipedia]; LUCEM Starlight scatters fibres of 1–6 mm irregularly, up to 1,000/m² [src]; lit from the front it looks like ordinary concrete [src: Architerials]. **Lesson:** a network in stone is *invisible until lit from within*. That is the light dial's job (§G).
- **Tron:** Legacy kept the original's "circuitry – the line work" ("LED lines … exposed technology"), and laid its city out like a microchip seen from above [src: Den of Geek]. Ares's red Grid is "dark, glossy, wet", after circuit boards [src: ILM]. Constant widths, rounded 45°/90° corners, black gloss [gen].
- **Electroluminescent wire:** glows evenly along its length and all round [gen; page blocked]. **Lesson:** even brightness reads as *wire*; brightness falling along an edge reads as *organic* or *lightning*.
- **Death Stranding:** "knots" (cities) joined by "strands", growing as strands connect [src: Decon/Recon]; on screen, the map lighting node by node in holographic gold-orange [gen; unverified]. **Lesson:** nodes are *places*; the network is *between* them.
- **Kintsugi:** urushi and gold following the fracture, breakage "acknowledged rather than erased" [src: Musubi Kiln]. It is a *fracture* network (T-junctions, no hubs, no flow); circuitry is *designed* (terminals, hierarchy, routing). The app already has Kintsugi; don't drift into it.
- **PCB art:** mask as canvas, ENIG gold, silkscreen, exposed copper highlights, hatched pours as mid-tones, Voronoi fills [src: JLCPCB, Wokwi]. 45° routing saves space and makes almost no electrical difference [src: Altium]. **It is a convention, which is why it reads as "designed".**
- **Neural lace:** Banks's term [gen]. Lieber's injectable mesh is about 95% open space, with tissue growing through it [src: ScienceAlert]. **Lesson:** a *regular* lattice that organic matter has distorted.
- **Network maps:** Beck's Tube map used "only straight lines and 45 degree angles", evenly spaced stations, after an electrical circuit diagram [src: Wikipedia]. **Octilinear = schematic.** Opte plots each IP-to-IP link coloured by region [src: MoMA]; the 2021 map has a white backbone and fringe "dandelion-like blooms" [src: steve.blog].
- **Bioluminescence:** foxfire is the "bluish-green" cold fire of decaying wood [src: Fungi Perfecti]. A comb jelly's rainbow is scattering, *not* bioluminescence [src: NOAA], so keep rainbow sheen out of the glow. Deep-sea photophores string discrete points along a body: a pad vocabulary [gen].
- **Cyberpunk "techno-organic":** Giger biomechanics, cyberbrains, cables swelling like tendons [gen; no useful source].

---

## D. What makes a network read as circuitry, and what as organic

| Cue | Circuitry | Organic |
|---|---|---|
| Direction | 0/45/90° only (octilinear) [src Beck, Altium] | free curvature |
| Width along an edge | constant [gen] | tapers toward the tips [src Runions] |
| Width across edges | 2–4 discrete classes (power, signal, bus) [gen] | continuous, Murray's law [src] |
| Junctions | pads and vias, discs and rings larger than the line [src Wokwi] | smooth Y-forks, a slight swelling |
| Ends | always terminate in a pad or via [src Den/Wokwi; app's Circuit Traces] | free-ending, fading [gen] |
| Parallelism | buses: 2–8 lines a fixed pitch apart, turning together [app's Circuit Traces] | rare; veins and arteries pair up [src retina] |
| Brightness | even along the line (EL wire) [gen] | strongest at the trunk |
| Motion | discrete pulses, a bright head and a fading tail [app's Circuit Traces Data] | a slow swell, peristalsis |
| Loops | rectangular, regular | polygonal areoles [src glossary] |
| Crossings | via hop or jumper | over/under without joining [src retina] |

**The decisive cues [est]:** routing angle, pads at ends, and constant width. Change only those three and the same graph flips from leaf to board. So these become **one axis, Organic ↔ Circuit**, in the new part, and Ruby's "network running through things" lives at about 60–75 on it: octilinear trunks, softened corners, pads, and minor veins still allowed to curve.

---

## E. Proposal (a): the graph

### E.1 The one new process part: **Network** (Marks)

**Network** builds a graph with loops (not a tree), gives each edge a weight by how much flow it carries, and draws it with a routing style.

**Inputs**

| Port | Kind | Does |
|---|---|---|
| where | gray map | where nodes may land (light = allowed); also the travel cost |
| ways | gray map | paths the edges prefer to bend along (Growth Medium › ways) |
| hubs at | gray map | the brightest spots become hubs (e.g. Poem › punctuation); empty: seeded |
| flow from | direction | trunks run from this side (Light Dial › direction) |

**Settings** (all ranges get ⚙ ports; all except Variation take maps by point where noted)

| Key | Label | Range, default | Does |
|---|---|---|---|
| weave | Weave | 0–100, 40 | ticks: Tree+Loops · Relative · Gabriel · Slime · Streets · Subdivided |
| nodes | Nodes | 3–600, 120 | point count (per area) |
| even | Evenness | 0–100, 60 | clumped to blue-noise (as Triangle Mesh) |
| loops | Loops | 0–100, 50 | 0 is a pure tree (MST); 100 keeps every candidate edge |
| hubs | Hubs | 1–8, 3 | flow sources; more hubs, more meeting loops |
| order | Hierarchy | 0–100, 60 | width contrast; also subdivision depth (1–4 orders) |
| style | Organic ↔ Circuit | 0–100, 65 | curved → straight → octilinear → orthogonal; taper off and pads on as it rises |
| wander | Wander | 0–100, 30 | bend along the ways / jitter (by point) |
| width | Line Width | 30–300, 100 | canonical px scale |
| pads | Pads | 0–100, 50 | size of the junction and terminal pads (0: none) |
| bus | Buses | 0–100, 20 | the share of trunks drawn as 2–6 parallel lines |
| pulses | Pulses | 0–100, 30 | pulse count along the edges, heading away from the hubs |
| variant | Variation | 0–99, 0 | another network |

**Outputs**

| Port | Is |
|---|---|
| lines | every edge, white, at its width |
| core | a thin centreline (about 35% of the width), for the hot core |
| order | each edge in a gray by its flow (trunk white, capillary dark) |
| nodes | pads, vias and beads at junctions and terminals |
| pulses | pulse heads with fading tails, along the edges |
| loops | each closed face in its own gray (areoles), for the second material |
| height | the lines raised, pads domed, via holes sunk |

**How it works [est]:**
1. Place the nodes in `where`: dart-throwing scaled by Evenness, so material without ways gets no nodes. Pick the hubs from `hubs at` maxima, else at random, biased toward `flow from`.
2. Build the candidate graph by Weave:
   - **Tree+Loops:** MST plus edges in order of detour ratio, up to the Loops share (§B.1).
   - **Relative / Gabriel:** the proximity subgraphs of Delaunay (§B.1), with Loops adding Delaunay edges back.
   - **Slime:** Tero-style conductance on the Delaunay graph, with rotating hub pairs (§B.4). Loops sets the fluctuation strength.
   - **Streets:** a growth from the hubs with a snap radius, along a tensor field taken from `ways` (§B.5).
   - **Subdivided:** a coarse Gabriel graph whose faces split recursively (§B.3).
3. **Flow:** the union of shortest-path trees from every hub, which also counts each edge's use. Width w = min + (use/max)^(1/n), with n running from 3 to 2 as Hierarchy rises [src Runions; est].
4. **Route** each edge by Organic ↔ Circuit:
   - 0–33: Catmull-Rom through points nudged along `ways`.
   - 33–66: straight.
   - 66–90: octilinear (the leg that leaves the higher-order node goes first, with a chamfer).
   - 90–100: Manhattan.
   - Taper is (1 − style); pads scale with style.
   - Edges crossing after routing get a via hop at circuit settings, and an over/under gap at organic ones (§B.8).
5. **Buses:** trunks above the order threshold are offset into parallel lines a fixed pitch apart, which keep their spacing round the corners (reuse Circuit Traces' corner logic).
6. **Pulses:** a few per edge, phase from the seed, travelling away from the hubs. Each is a bright head with an exponential tail along the edge.

**Why it is general [est]:** street maps, subway schematics, constellations, river deltas, neural meshes, and areole cells for other surfaces: "a part someone would reach for twice."

### E.2 The Veins of Light chain

Knobs (8): **1 Material** (steps: Seeded · Strata · Pebbles · Sand · Fibres · Skin), **2 Weave** (steps: Seeded + six), **3 Density**, **4 Loops**, **5 Organic ↔ Circuit**, **6 Hierarchy**, **7 Glow**, **8 Pulses**.

```
Knob1 ─┐   Random ─┐
       Switch(choose=Knob1<4) ─→ Growth Medium.kind     (Seed picks when "Seeded")
Knob2 ─┐   Random ─┐
       Switch ─→ Network.weave
Random(lo 0,hi 99) → Growth Medium.variant, Network.variant (a different seed each)
Random → Growth Medium.angle; Random → Network.hubs (1–8)
Knob3 → Network.nodes ; Knob4 → loops ; Knob5 → style ; Knob6 → order ; Knob8 → pulses
Light Dial.direction → Network.flow from
Growth Medium.ways → Blur(4) → Math×(Poem.distance thresholded by Poem.round the words) → Network.where
Growth Medium.ways → Network.ways
Poem.punctuation → Network.hubs at

Material:  Tint(GM.picture, H1, H1·dark) = A ;  Tint(GM.picture, H2, H2·dark) = B
           Network.loops → Threshold(Random cutoff, soft 0) → Mix(A, B)        (inlaid areoles)
Height:    Math subtract(GM.height, Blur(Network.lines)·Random depth) → Math max(·, Network.height)
           (Random depth > 0: carved channel, resin river; ≈0: raised wire)
Light Engine(picture, height, gloss map = Network.lines, dial = Light Dial)
Multiblend(base = lit,
           L1 = Tint(Network.core, H3) masked by core,
           L2 = Tint(Network.nodes, H5),
           L3 = Tint(Network.pulses, H6))
Glow(picture, glows = max(core, nodes, pulses), color = H4,
     strength ⚙ = Knob7 × (1 − 0.6·Light Dial.height) × (0.5 + 0.5·Light Engine.light))
→ Surface
```

**Notes [est]:**
- The glow's strength map multiplies by the Light Engine's `light`, so halos pool on lit grain and die in shadowed hollows. The glow is *in* the stone, not a sticker over it.
- `Light Dial.height` dims the glow by day and lets it blaze when the light is low or below the horizon (the surface keeps `lowLight`).
- Gloss map = lines: resin and copper shine, sand doesn't.
- `Network.order` can replace `core` on L1 through a Threshold, so only trunks carry the hot core and capillaries are drawn dimmer (Mix with H4).

---

## F. Proposal (b): seeded variations

The seed picks (via Random parts) the Material and Weave when their knobs sit on "Seeded", plus the hub count, the angle, the inlay threshold, the carve depth and every part's Variation. Each reading below is a region of that space; the knob values are starting points for the four readings and the compare sheet [est].

| # | Name | Material | Weave | Loops | Style | Hier. | Character |
|---|---|---|---|---|---|---|---|
| 1 | Circuit Marble | Strata | Tree+Loops | 45 | 85 | 50 | octilinear gold traces flush in banded stone, pads at every node |
| 2 | Leaf Lumen | Fibres | Subdivided | 80 | 15 | 85 | 3–4 vein orders, areoles in H2, tapering |
| 3 | Slime Road | Sand | Slime | 60 | 35 | 70 | thick-thin tubes between a few hubs, Steiner-ish junctions |
| 4 | Undercity | Pebbles | Streets | 55 | 75 | 60 | blocks between pebbles, buses on the trunks |
| 5 | Neural Lace | Skin | Gabriel | 70 | 60 | 30 | even lattice distorted by the creases, bead pads |
| 6 | Foxfire Mycelium | Fibres | Relative | 50 | 10 | 40 | fine, wandering, faint pulses, H4 green by default |
| 7 | Retina | Skin | Tree+Loops | 15 | 20 | 90 | one hub at a seeded "disc", two crossing trees (two runs, over/under) |
| 8 | Tube Map | Strata | Streets | 35 | 70 | 20 | thick constant lines, ring pads at every junction, few nodes |
| 9 | Resin River | Pebbles | Relative | 30 | 40 | 75 | deep carve, glow in the channel, matte stone |
| 10 | Litracon | Sand | Gabriel | 50 | 55 | 0 | uniform hairlines, pads as fibre ends; invisible until the dial sinks |
| 11 | Bus Bedrock | Strata | Tree+Loops | 25 | 95 | 60 | Manhattan, Buses 70, parallel runs following the strata angle |
| 12 | Chiral Knots | Pebbles | Slime | 40 | 65 | 55 | hubs at punctuation, big H5 knots, gold strands |
| 13 | Deep Photophore | Skin | Relative | 20 | 25 | 50 | sparse lines, Pads 90: strings of glowing beads |
| 14 | Opte Bloom | Sand | Tree+Loops | 20 | 30 | 95 | one central hub; fringe blooms on hair-thin links |

**Variety safeguards [est]:** the seed never moves hue roles. It picks hub layout (random, a line, a ring, thirds anchors, or off-canvas so trunks enter from outside), and node counts span 30–400, from sparse map to dense mesh.

---

## G. Proposal (c): what makes it this app's own

- **The light dial lights the material and the glow.**
  - It sets the Light Engine's direction and height on the material's relief.
  - It points the trunks (flow from).
  - Its height trades daylight for glow: at noon a network inlaid in stone is barely there (like Litracon from the lit side [src]); at dusk it wakes.
  - The glow's halo is modulated by the lit relief, so it lights the grain next to it.
- **The poem:**
  - *As a node:* Poem › punctuation into `hubs at`. Every comma and stop becomes a hub, and trunks run between the poem's pauses. Line ends could also seed terminal pads [est].
  - *Avoided:* Poem › distance gated by Poem › round the words into `where`, so no node lands in the text margin, while edges may still pass *behind* it at low glow.
  - Both are wired, and the page's Shape Aware decides which shows.
- **Six hues:** as the table at the top. The material and the second material are separate so the network can **separate two materials**, like leaded stone, rather than only decorate one.
- **Every knob matters:** each of the eight drives a Network or Growth Medium setting or the Glow. None is decorative.

---

## H. Proposal (d): what to avoid

- **A single tree from one edge** (the current look), and Tendrils' open mode as the backbone.
- **Fading tips** on a circuit setting. At Organic ↔ Circuit above 50, every end terminates in a pad.
- **Uniform Delaunay triangles** (Loops 100 on Relative/Gabriel with Evenness 100): a wireframe, not a network.
- **Voronoi-only Y-junctions** as the network: that is crackle or kintsugi, which the app already has.
- **Rainbow sheen in the glow** (the comb-jelly confusion) and any fixed "neon cyan".
- **A glow screened flat over everything.** It must be shaded by the material's light, or it reads as a sticker.
- **Brightness falling along an edge at circuit settings:** that reads as discharge.
- **Too many pads** (every degree-2 node padded) at circuit settings. Pad only degree ≠ 2 nodes, and vias at layer hops.
- **Copying a PCB literally** (chips, silkscreen): that is Circuit Board. Veins of Light has no components, only network and matter.
- **Borders**, margin-hugging trunks, and a network centred like a medallion.

---

## Sources

- Runions et al., "Modeling and visualization of leaf venation patterns" (SIGGRAPH 2005): https://www.algorithmicbotany.org/papers/venation.sig2005.html and the PDF https://www.algorithmicbotany.org/papers/venation.sig2005.pdf
- Katifori, Szöllősi & Magnasco, "Damage and fluctuations induce loops in optimal transport networks": https://arxiv.org/pdf/0906.0006
- Physics Today, "Loopy leaf veins": https://physicstoday.aip.org/news/loopy-leaf-veins
- Quanta, "In Natural Networks, Strength in Loops": https://www.quantamagazine.org/20130814-in-natural-networks-strength-in-loops
- Katifori seminar abstract: https://berkeleyams.lbl.gov/spring10/katifori.html
- Ronellenfitsch et al., topological phenotypes of leaf venation: https://arxiv.org/pdf/1507.04487
- Digiphyll leaf glossary: https://digiphyll.smns-bw.org/sample-apps/x/2019-04_en/html/glossary_en.html
- Jones, Physarum transport networks (UWE): https://uwe-repository.worktribe.com/output/980579 and https://uwe-repository.worktribe.com/OutputFile/957224
- Nervous System, Sage Jenson residency: https://n-e-r-v-o-u-s.com/blog/?p=9137
- Le Random, Sage Jenson, *36 Points*: https://lerandom.art/collection/36-points-12
- r-bloggers, "Abstractions" (physarum steps): https://www.r-bloggers.com/2020/08/abstractions/
- NetLogo Slime Mold Network: https://ccl.northwestern.edu/netlogo/models/SlimeMoldNetwork
- Nervous System, Hyphae lamps: https://n-e-r-v-o-u-s.com/pressKit/hyphaeLamp.html
- Wikipedia, Gabriel graph: https://en.wikipedia.org/wiki/Gabriel_graph
- matgeom, relativeNeighborhoodGraph: https://octave.sourceforge.io/matgeom/function/relativeNeighborhoodGraph.html
- Parish & Müller, SIGGRAPH archive: https://history.siggraph.org/?p=116923
- Purdue/SIGGRAPH 2011 urban layouts course: https://www.cs.purdue.edu/cgvlab/urban/sg_2011_course/umc_SG11_02_urban_layouts.pdf
- Chen et al., Interactive Procedural Street Modeling: https://www2.cs.uh.edu/~chengu/Publications/streetModeling/street_modeling.html
- Wikipedia, Worley noise: https://en.wikipedia.org/wiki/Worley_noise
- Retinal artery/vein identification: https://arxiv.org/pdf/1605.00763
- Wikipedia, *Panellus stipticus*: https://en.wikipedia.org/wiki/Panellus_stipticus
- Fungi Perfecti, fungal luminescence: https://fungi.com/blogs/articles/fungal-luminescence
- NOAA Ocean Exploration, comb jelly: https://oceanexplorer.noaa.gov/multimedia/daily-image/media/20201015.html
- Adafruit, Glowing NeoPixel Resin River Table: https://learn.adafruit.com/glowing-neopixel-resin-river-table?view=all
- Dwell, LiTraCon: https://dwell.com/amp/article/litracon-light-transmitting-concrete-85f0b715
- Wikipedia, Translucent concrete: https://en.wikipedia.org/wiki/Translucent_concrete
- LUCEM Starlight: https://lucem.com/translucent-concrete/lucem-starlight/
- Architerials, Lucem and Litracon: https://www.architerials.com/2010/02/get-lit-lucem-and-litracon/trackback/index.html
- Den of Geek, Tron: Legacy design team interview: https://www.denofgeek.com/?p=142524
- ILM, Tron: Ares visual effects: https://www.ilm.com/?p=42026
- Decon/Recon, "Death Unstranding (Entry 3)": https://deconrecon.asia/death-unstranding-entry-3-connecting-the-knots/
- Death Stranding wiki, Chiral Network (lore only): https://deathstranding.fandom.com/wiki/Chiral_Network
- Musubi Kiln, kintsugi guide: https://musubikiln.com/blogs/journal/what-is-kintsugi-a-guide-to-japans-art-of-gold-repair
- Wokwi, practical guide to PCB art: https://blog.wokwi.com/a-practical-guide-to-designing-pcb-art/
- JLCPCB, PCB art guide: https://jlcpcb.com/blog/pcb-art-design-guide
- Altium, PCB routing angle myths: https://resources.altium.com/p/pcb-routing-angle-myths-45-degree-angle-versus-90-degree-angle
- ScienceAlert, injectable mesh electronics: https://www.sciencealert.com/injectable-electronics-now-exist-that-could-one-day-help-treat-paralysis
- Wikipedia, Harry Beck: https://en.wikipedia.org/wiki/Harry_Beck
- MoMA, Opte Project: https://www.moma.org/collection/works/110263
- steve.blog, Global Internet Map 2021: https://steve.blog/2021/05/26/2021-05-26t035127-000z/

**Blocked or unavailable this session (not used):** PubMed and PMC (Tero et al. 2010 abstract behind a captcha; the Murray's-law pulsatile-flow paper); Wikipedia's Murray's law, Electroluminescent wire and Kintsugi pages (permission timeouts); "The Mycelium as a Network" (Fricker et al.; title only); iquilezles.org Voronoi lines (robots). Not found: a usable source for "circuit board marble" furniture, Death Stranding's on-screen network visuals, or "techno-organic" texture practice. Those points are marked [gen].
