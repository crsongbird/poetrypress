# Ringworld Kit 2: What Stands Where, Far Land, Unfinished Ring, Robots, Nods, Close-ups

This follows `docs/prior-art/painted-ringworld.md`. That doc already covers kinds, real sizes and silhouettes (its §5); this one adds what Ruby asked for on 2026-10-20:

1. Placement by relationship: what stands near what.
2. Detail in the far land.
3. Unfinished ring sections, builders' walls, writing and machinery.
4. Robots as life.
5. Halo and Fallout nods that stay non-infringing.
6. Close-up (T4) bases and small things near the viewer.

**How claims are tagged.** `[Sn]` cites a source that was opened and read (the list is at the end). `[est]` is design judgement, and `[code]` describes what `stepsRing.js` / `paintKit.js` do today.

**Names used from the code.**
- Worlds: `wilds cities neon builders magic ruins` (`RG_WORLDS`).
- Ground fields: `ground()` gives `e slope wet coast rise`, and `cityAt` gives `ci`.
- Placement already in place: `RG_PLACE` (lighthouse on coast; windmill, turbine, castle and observatory on a rise; barn and silo at the edge; cathedral, mosque and clock at the heart; geodome on flat ground) [code].
- Bots: `helper drone crawler walker sentry derelict` (`PK_BOTS`) [code].

---

## A. Placement with relationships

### A.1 What games and research actually do

| Source | Mechanism | What to take |
|---|---|---|
| Horizon Zero Dawn (Guerrilla) [S1][S2] | Artists write placement rules in a graph editor, and GPU algorithms build a dense world around the player as they move. Inputs are painted or generated per-tile maps; rivers and roads can be signed distance fields; slope and curvature are derived from terrain. Each asset's probability is a product, e.g. `P(tree_a) = (distance(water) < 10) * keyframe(elevation) * …`. Candidates sit on an irregular grid (blue noise or hex), and one random value picks an asset or nothing. The system also places sounds, effects, wildlife and gameplay elements, not only plants [S1]. | Treat every kind as **a product of factors read from ground fields**. One roll per candidate picks *which* kind or *none*, so the kinds compete for a spot instead of overlapping. |
| Ghost Recon Wildlands (Ubisoft) [S3] | Roads come from pathfinding: steep slopes and tight turns cost more, and existing roads are cheap, so new roads branch off old ones. Rivers only flow downhill to the nearest water. Towns are split into blocks by roads; buildings are placed **by priority (landmarks first, then houses, then market stalls and other secondary structures)**. Rules cover distance to the town centre, water's edge, railroads, slope and district. There are **over 70 rules per building**, e.g. a church blocks any other religious building within about **150 m**. | A **priority order** and **per-kind exclusion radii between kinds**. Roads are drawn first, and settlements hang off them. |
| Ghost Recon Wildlands vegetation [S4] | A **cascade**: big trees spawn medium trees, which spawn small trees and bushes. Rules are set first by density, scale, slope and spacing, then by sun direction and species per terrain material. Flow maps, river beds and cliffs are included or excluded. Rules combine with a **delete threshold**. Roads, railways, water and footpaths are cleared automatically. | Parent → child spawning gives clusters for free, and clearing along roads gives the "thread through the forest" look. |
| Emilien et al. 2012, villages on arbitrary terrain [S5] | Each building type has an **interest** `max(0, Σ wᵢ·fᵢ)`, where any fᵢ = −1 vetoes the spot. Factors: slope (a bell curve per type; corn on flat ground, vineyards on hills), altitude (domination, fading with distance), water (a decreasing function of distance, with λmin/λmax per type), road (an asymmetric bell around a preferred distance λ0), defence, **sociability** (attraction-repulsion at preferred distances) and **worship** (the same, for religious buildings only, which is why churches end up central). A random spot is kept with probability ∝ interest. Each new building is joined to the road network at once. Roads reuse existing roads (weight ≥ 1). Parcels grow **orthogonal to the road**; field parcels use Euclidean distance; water, walls and roads cost infinity. | The **veto + weighted-sum** form, and **attraction-repulsion curves between kinds**. Farms are parcels grown away from the road. |
| Townscaper (Stålberg) [S6] | WFC picks modules first, and **decoration comes second**. Recipes have priorities: garden pieces appear only where an area is enclosed. Large shapes are predictable and small ones vary: "I want the larger shapes to feel very predictable, but the smaller shapes are allowed to vary quite a bit." Rules should be learnable, so players "get" why the garden appears. | Two passes: **structures, then dressing** (fences, gardens, lamps) keyed to what the structures made. The rules should read as reasons. |
| RimWorld [S7] | Faction settlements tend to sit near roads, and you can't settle adjacent to one. Settling within 4 tiles of another faction warns of worse relations. Modern dirt roads connect bases to the main (ancient) roads. Rivers run to the ocean and are likelier in rainy areas. Biomes follow latitude and elevation. | **Minimum spacing between settlements**, and **old roads as the spine new roads join**. |
| Houdini heightfield scatter [S8] | Masks *define where points may appear* rather than deleting them. Three methods: by coverage, by density, or a fixed total count in the mask. Points are also removed beyond a camera distance with a random seam, and when occluded. | **Distance cut-offs with a random seam** per kind (the code's `hi` radius per sow pass already works this way [code]). |
| Bridson 2007 Poisson disk [S9] | Samples at least *r* apart, in O(N), using a background grid of cell r/√n and k ≈ 30 tries per active sample. | A kind's exclusion radius **is** its Poisson *r*. Use a per-kind *r* for "no two windmills closer than…". |
| Red Blob Games map generation [S10] | **Moisture = distance from lakeshore or riverbank**, rescaled so 0 distance gives 1.0. Biomes come from a Whittaker diagram indexed by temperature (from elevation and latitude) and moisture. | Add a **moisture field** to `ground()`: distance to `TR.sea` water, already sampled for `coast` [code]. Biomes and kinds can then read it. |
| von Thünen rings [S11] | Outward from the market town: (1) dairy and intensive farming (vegetables, fruit, milk), (2) timber and firewood, (3) extensive grain, (4) ranching; beyond that, wilderness. | **Farmland as rings round each village**: small busy plots near, woodlots, then big fields, then pasture, then wild. |
| Central place theory [S12] | Higher-order places are fewer and more widely spaced than lower-order ones. Each place has a threshold (the smallest viable market) and a range (how far people travel). | **Settlement hierarchy by spacing**: hamlets densely, villages wider apart, towns wider still, one city per region. |
| Skyrim level design [S13] | The level team made "over 300 locations and events", from multi-hour dungeons down to one-room affairs. | Points of interest come in **sizes**. A big landmark needs small companions. |
| Defensible-space zones (wildfire codes) [S14] | **0–5 ft**: no flammable plants, gravel and hardscape. **5–30 ft**: mature canopy at least **10 ft from the structure**, **18 ft between crowns**, limbed 6–10 ft up. **30–60 ft**: 12 ft between canopies; **60–100 ft**: 6 ft. | A measured basis for **trees thinning near buildings**: a gradient, not a hole. |
| Wind siting [S15] | Wind gains speed approaching a crest. Good sites: the top of a smooth rounded hill with slopes of about 1:3 or less on a flat plain, open shorelines, offshore, islands. Cities and forests have high roughness, which slows wind. Turbines want no tall obstructions upwind for about 3 km. | Windmills and turbines on **gentle crests, coasts and open plains, away from forest and city**. |
| Lighthouses [S16] | They mark dangerous coasts, shoals, reefs and harbour entries. Range lights come in aligned **pairs**. Nearby lighthouses get **different daymarks** (spiral stripes or bands) so they can be told apart. A keeper's house, fuel house and boathouse stand at the tower's foot. | Lighthouses go on **headlands and harbour mouths**. **Two in one view must wear different stripes.** The cottage cluster sits at the foot. |
| Old-field succession [S17] | Abandoned fields go annuals → perennials and grasses → shrubs → softwood trees → hardwoods, about **120 years** from pioneer to climax. | **A ruin's age** (seeded) picks how far its overgrowth has gone. |

**Not found in what was read.** A published Bethesda rule like "one point of interest every N metres" did not turn up. The BotW "triangle rule" page was blocked [S—gigazine]. The spacing in A.3 is therefore [est].

### A.2 The rule form, for a 2D painter [est, after S2, S3, S5, S9]

For each candidate from a `sow` pass:

```
score(kind) = veto(kind, g) ? 0
            : prior(world, kind) · Π fᵢ(g)                 // ground factors: slope, rise, moisture, coast, road, ci
                                 · Π attract(kind, near)   // kinds already placed (higher priority) within reach
pick ∝ score among the world's kinds, plus "nothing", with ONE R() roll
reject if any placed kind K lies within excl(kind, K)
```

- **Order of passes = priority** [S3]: roads (threads) → landmarks → settlement cores → houses → farms and fields → trees (with the clearing rule) → rocks → robots → dressing (fences, lamps) → near clutter.
- Each pass reads what earlier passes placed. Keep a coarse spatial hash of placed `{a, z, kind}` per pass, like the Bridson grid with cell = the largest exclusion radius [S9].
- **Camera stability.** All of this is per-candidate and seeded by cell (`rgRand(s, id, i, j)` [code]). An attraction must read only *earlier* passes, never the same one, or a pass becomes order-dependent [est].
- **Curve shapes** follow [S5]:
  - `bell(x; lo, best, hi)`: slope, height, road distance.
  - `near(x; λmax)`: falls from 1 at 0 to 0 at λmax. Water, centre.
  - `far(x; λmin)`: 0 below λmin, rising to 1. Exclusion, keep-away.

### A.3 The rule table

Units are metres (the kit is in metres [code `pkMetres`]).
- **Slope:** rise over run (the code's `g.slope`).
- **Rise:** the code's `g.rise` (positive means a crest, negative a hollow).
- **Moisture:** 0–1 from distance to water (A.1 [S10]).
- **Road:** distance to the nearest road thread.
- **ci:** city amount 0–1.
- **Cluster:** how many of the kind gather, and over what spread.
- **Excl:** minimum distance to the listed kinds; "self" is its own Poisson *r*.
- **Attract / repel:** what pulls it in or keeps it away.

Values are [est] unless cited.

**Settlements and civic**

| Kind | Slope | Height / rise | Moisture / water | Road | ci | Cluster | Excl (self; others) | Attract / repel |
|---|---|---|---|---|---|---|---|---|
| hamlet core (3–8 cottages) | ≤ 0.15 | not on peaks; rise −0.2…0.4 | 0.4–0.8, a stream within 300 m [S5][S10] | 0–60 (bell, best 15) [S5] | 0.05–0.3 | 3–8 within 80 m | self 600–1,200 [S7][S12] | + water, + road junction; − cliffs |
| village (main street + side lanes) [S3] | ≤ 0.12 | valley floor or gentle shoulder | river or coast within 500 m | on the road (it *makes* the road bend) | 0.3–0.6 | 15–60 within 300 m | self 2–4 km; town 6 km [S12] | + river crossing, + coast bay |
| town / city centre | ≤ 0.08 | lowland | river mouth, bay or lake | where ≥ 3 roads meet | 0.6–1 | dense | self 10+ km (one per region) [S12] | + harbour, + plain |
| cottage, aframe, stave, row | ≤ 0.25 | any | ≥ 0.3 | 5–40, front parallel to the road [S5] | 0.1–0.6 | 2–6 along the road | self 12; barn 25 | + village core (sociability [S5]) |
| cathedral, mosque | ≤ 0.08 | a slight rise in town (domination [S5]) | — | on a square, 0–20 | ≥ 0.7 [code] | 1 | **self and any other religious kind 150** [S3]; scaled up for skyline readability: 400 | + centre (worship [S5]); square left open in front |
| clock tower | ≤ 0.1 | — | — | on a square or junction | ≥ 0.6 [code] | 1 | self 300; cathedral 40 | + market square |
| castle | ≤ 0.6 | **rise ≥ 0.3** [code], a crest or a river bend | — | 50–400 (a lane winds up) | 0.1–0.5 | 1 + wall | self 3 km | + overlooking a village (≤ 1.5 km) |
| market stalls | ≤ 0.05 | — | — | on a square | ≥ 0.5 | 4–12 | — | + cathedral or clock square (secondary [S3]) |
| watertower | ≤ 0.2 | **highest local point in town** | — | ≤ 30 | 0.2–0.7 | 1 | self 1 km | + town edge high ground |

**Farm and field (von Thünen rings round each village [S11]; parcels grown away from the road [S5])**

| Kind | Slope | Rise | Moisture | Distance from village core | Cluster | Excl | Attract / repel |
|---|---|---|---|---|---|---|---|
| allotments, orchards, greenhouses (ring 1) | ≤ 0.15 | — | 0.4–0.9 | 50–400 | grid of plots | — | + village edge, + water |
| woodlot, coppice (ring 2) | any | — | ≥ 0.3 | 300–900 | patches | — | + steep ground no one ploughs |
| grain fields (ring 3) | ≤ 0.12 (bell) [S5] | — | 0.2–0.6 | 600–2,500 | large parcels, regular if planned [S19] | — | − wet hollows |
| pasture, ranch (ring 4) | ≤ 0.4 | — | any | 1.5–5 km | sparse | — | fences, a lone barn |
| barn, silo | ≤ 0.15 | — | — | at the village edge, ci ≤ 0.35 [code] | barn + 1–3 silos + farmhouse within 40 m | self 300 | + fields on ≥ 2 sides |
| vineyard / terraces | **0.3–0.6** (30–60% [S18]) | sun side (the higher-light side of the ridge) [S4: sun direction] | low–mid | 300–2,000 | strips following contours [S18] | — | + south-facing slopes [est] |
| rice / paddy terraces | 0.3–0.6 [S18] | — | ≥ 0.6, water draining bed to bed [S18] | any | stepped bands | — | + stream at the top |

**Ridge, coast and wind**

| Kind | Slope | Rise | Moisture / coast | Road | ci | Cluster | Excl | Attract / repel |
|---|---|---|---|---|---|---|---|---|
| windmill (smock) | ≤ 0.33 (1:3 [S15]) | **rise ≥ 0.4** [code], a rounded crest | open; not in forest [S15] | 50–500 | ≤ 0.4 | 1–3 along a crest | self 250 | − trees within 60 (roughness [S15]); + grain ring 3 (it grinds the grain) |
| wind turbine | ≤ 0.33 [S15] | **rise ≥ 0.6** [code], ridgelines | open plain, coast or offshore [S15] | a service track | ≤ 0.2 | **rows of 5–20 along the ridge line**, spaced 5–8 rotor diameters (≈ 650–1,000 m) | self 600; houses 500 | − forest, − city (roughness) [S15] |
| lighthouse | any | headland or reef | **coast** [code], a point jutting into water, a harbour mouth [S16] | lane | ≤ 0.4 | 1 + keeper's cottage, fuel house, boathouse [S16] | self 3 km; **if two are in view, different daymarks** [S16] | + headland, + harbour mouth; range-light pairs at a channel [S16] |
| observatory | ≤ 0.4 | **rise ≥ 0.6** [code], the highest dark peak | dry ≤ 0.4 | a switchback road | ≤ 0.05 | 1–4 domes | self 5 km; city 8 km (dark sky) | − city lights |
| radio mast, pylon line | any | crests | — | — | ≤ 0.5 | pylons in a line every 300–400 m with catenaries | — | joins town to town |

**Builders, neon, magic, ruins**

| Kind | Ground | Cluster | Excl | Attract / repel |
|---|---|---|---|---|
| pylon (builders) | any slope; often on the rim-wall foot | rows | self 400 | + rim wall, + unfinished section (C) |
| geodome, landing pad | flat ≤ 0.25 [code] / ≤ 0.05 | 1–5 domes in a chain; pads in pairs | self 300 | + builders' camp near scaffolding |
| megablock, capsule (neon) | ≤ 0.1 | massed; streets as canyons | — | + transit line; neon signs on canyon faces |
| needle (neon or city) | ≤ 0.1 | 1 per city | self 5 km | + centre or a hill in the city |
| wizard tower | rise ≥ 0.3 or on an island | 1 | self 1.5 km | + crystal field, + standing stones within 300 m |
| torii | path line | 1–many in a row along a path | — | + shrine/pagoda; leads uphill |
| pagoda, onion | ≤ 0.2 | 1 + a few cottages | self 800 | + water garden, + torii path |
| standing stones / circle | ≤ 0.15, open | circle of 8–30 | self 2 km | + crest, − trees within 40 |
| crystal field | rough, rise ≥ 0 | 5–30 in a fan | — | + cliff foot, + magic water |
| crater (ruins) | any | 1, with rubble ring 1–2 craters wide | self 600 | fire, smoke, dead trees inside 2 radii |
| wreck / crashed ship | gentle; nose into a slope | 1 + debris trail 3–10× its length, *down* the impact line | self 3 km | scorched-ground decal; trees knocked flat along the trail |
| ruin (any building kind, aged) | as its living kind | as its living kind | as its living kind | **age** seeds overgrowth stage (A.4) |

**Trees, rocks and life**

| Kind | Rule |
|---|---|
| all trees | **Clearing near buildings** (A.4) and along roads and water edges [S4]. A cascade parent → children: one large tree seeds 2–5 medium within 2–4 crown widths, each seeding 2–6 shrubs [S4]. |
| willow, poplar, alder-like | moisture ≥ 0.7; riverbanks, within 30 m of water [S10] |
| pine, spruce | heights and poor ground; slope up to 0.8 |
| birch | the edge of woods and clearings (pioneer [S17]) |
| palm, cypress | warm or dry country; palm on coasts |
| dead trees | ruins, crater rings, the edge of burnt areas; not in villages |
| rock (boulder) | slope-weighted already [code]; scree under cliffs (rise < 0 just below rise > 0.6); none on fields (cleared into **field-edge cairns and walls**) [est] |
| grass, flowers | everywhere near; fewer on paths; wildflowers at field margins |
| life: insects | moisture ≥ 0.5, flowers; near lamps at night (moths to the lantern: an interaction [est]) |
| life: fairies | magic; near water, mushrooms and glow trees; drawn to lanterns |
| life: slime | wet hollows (rise < −0.2, moisture ≥ 0.7), ruins' cellars |

### A.4 Three relationship rules worth hard-coding [est, from the cited numbers]

**1. Tree thinning round a building (from defensible space [S14], in metres).**
Let `d` be the distance from the nearest building edge and `cw` its canopy width.

| d | Tree density multiplier | Extra |
|---|---|---|
| 0–1.5 m | 0 (gravel, paving, garden beds) | only shrubs ≤ 1 m, flower pots |
| 1.5–9 m | 0.25 | canopy edge ≥ 3 m from the wall; crowns ≥ 5.5 m apart |
| 9–18 m | 0.55 | crowns ≥ 3.7 m apart |
| 18–30 m | 0.8 | crowns ≥ 1.8 m apart |
| > 30 m | 1 | the forest's own density |

This is the wildfire code turned into a curve. It gives *yards, then a thinned fringe, then forest*, which reads as people living there. The code today multiplies by `(1 − 0.85·town)` over the whole town [code]; the per-building gradient is what's missing.

**2. Ruin overgrowth by age (succession [S17], bases stained [S40]).**
Seed `age` from 0 to 1, roughly 0–120 years.

| age | On and around the ruin |
|---|---|
| < 0.1 | grass in cracks, annual weeds, soot and stains at the base |
| 0.1–0.3 | perennials and grasses over rubble; vines up one face |
| 0.3–0.55 | shrubs in doorways; birch and pine pioneers on the rubble (pioneers [S17]) |
| 0.55–0.8 | young trees through roofs; walls half hidden |
| > 0.8 | broadleaf canopy; only towers and arches show above it |

The Halo artist Eddie Smith's note says even an advanced material would show "staining or growth" at the bases and look like it was "coming out of the ground" [S40].

**3. Mutual exclusions (Poisson *r* between kinds; GRW's church-150 m rule is the model [S3]).**

| A ↔ B | Min distance |
|---|---|
| religious ↔ religious | 400 |
| windmill ↔ windmill | 250 |
| turbine ↔ house | 500 |
| observatory ↔ city (ci > 0.3) | 8 km |
| lighthouse ↔ lighthouse | 3 km (and different stripes) |
| castle ↔ castle | 3 km |
| village ↔ village | 2–4 km |
| crater ↔ village (living) | 1.5 km |
| robot sentry ↔ cottage | 400 |
| helper ↔ cottage | attract, within 60 |

### A.5 Roads as the spine [S3][S5][S7]

1. **Seed hubs** (city, villages, hamlets) by the hierarchy spacing [S12].
2. **Connect hubs** with a cost path: cost rises with slope² and turning, and is lower on existing roads (re-use weight ≥ 1) [S3][S5]. In 2D, a cheap version is a polyline that zigzags on slopes > 0.15 (switchbacks) and runs along valley floors [est].
3. **Clear** trees along each road, a band 1.5× its width [S4].
4. **Hang settlements on roads**: houses face the road at 5–40 m, with parcels orthogonal to it [S5]; a village's main street plus side lanes radiate [S3].
5. Bridges where roads cross water; a ford for lanes [est].

For camera stability, roads must be a function of seed and world position only, never of the view. Compute them on a coarse lattice (hubs per km² cell) once per seed and cache them like `RG_KEPT_STORES` [code].

---

## B. Far land with detail (no sprites needed)

### B.1 What painters and stylized games do

| Principle | Source | For the ring |
|---|---|---|
| Distance lowers contrast and saturation, softens edges, cools hue toward blue, and drops fine texture | [S23][S24] | Already the haze. The fields and lines below must **lose contrast with distance, not vanish at a hard cut**. |
| "Simplify the detail, soften the edges, and flatten the texture of distant objects"; distant trees "get fainter and fainter" | [S24] | Far forests become a flat tone with a darker scalloped edge, not individual crowns. |
| Firewatch: colour in "very distinct layers"; "flat-shapes with strong, distinctive silhouettes with abstract internal details"; fog for depth; important objects get more texture detail | [S22] | Each ridge band is one flat shape, and the **detail inside it is abstract pattern** (fields, hedgerows) rather than objects. |
| Kazuo Oga: "extracts the essence of important elements", focuses on small specifics and leaves the rest impressionistic | [S25] | One telling detail per band (a white farmhouse, a church spire) beats uniform texture. |
| Parallax: closer layers carry more detail, and open areas ("a calm sky or open stretch of water") prevent visual fatigue | [S26] | **Leave rest zones**: a lake or a plain without pattern between busy bands. |
| Field patterns are classed by form (regular = planned, irregular = altered or unplanned), boundary (straight, sinuous, mixed) and size: small 0–3 ha, small–medium 3–6, medium 6–12, large > 12 | [S19] | **Field mosaic generator**: pick form, boundary and size by the village's age and planning (seeded). |
| Bocage: dense hedgerows give small fields; as hedgerow density falls, fields grow. Open bocage shows "marked concentric patterns" around farmsteads; dense bocage gives "a fine grain and heterogeneous land use mosaic" | [S20] | Hedgerows as dark lines **round each farmstead in rings**, matching von Thünen [S11]. |
| Terraces: level beds 1–5 m wide on 30–60% slopes, risers 1–2 m, curving along contours; water drains bed to bed | [S18] | **Contour striping** on steep bands: bright bed, dark riser, following the ridge curve. Paddies glint sky-colour. |
| Night: "lights of cities and villages stand out against the dark"; fishing fleets "shine like glowing islands"; wildfires glow | [S21] | Night far land: **pin lights in settlement clusters**, **thread lights along roads**, a fleet of dots on water, a red glow line in ruins. |
| Ringworld: shadow squares on an inner ring, joined by thin wire, give night | [S51] | **Shadow-square night bands** across the arch and land: a moving terminator, a nod to the source. |

### B.2 A far-band detail recipe [est]

Each ridge band (the flat painted ridge shapes) gets a "land cover" pass. It runs **only where its features exceed a pixel threshold**, in canonical px, and fades as they shrink.

| Layer | Drawn when | How (flat shapes, two values) | Data |
|---|---|---|---|
| Field mosaic | field side ≥ 3 px (a 3 ha field is ≈ 170 m a side [S19]) | Voronoi or offset-grid cells clipped to the band, foreshortened by the band's tilt; each cell one of 3–5 crop tones (gold, green, ploughed brown, fallow pale); planned = regular grid, old = irregular cells | village rings [S11]; moisture; slope ≤ 0.12 |
| Hedgerows and walls | line ≥ 0.6 px | 1 dark line along cell edges; tree dots on 1 in 4 edges (hedgerow trees) | bocage density (seeded) [S20] |
| Terraces | slope 0.3–0.6 [S18] | contour stripes, each 2 tones; paddies pick up sky | ridge curve |
| Roads | width ≥ 0.4 px; else a 1 px pale thread at 50% | pale thread following A.5; switchbacks on slopes | A.5 |
| Rivers | always | sky-coloured ribbon widening downstream; willow dots along it | moisture |
| Forest masses | always | one flat tone + a scalloped top edge + 1 lighter edge facing the light | forestAt [code] |
| Settlement specks | building ≥ 1 px | a cluster of light rectangles (whitewash) or warm red (tile) + one taller spike for the church | A.3 |
| Cloud shadows | day | 2–5 large soft dark blots drifting slowly across bands, darkening ~15% and desaturating | seed |
| Night lights | night | settlement clusters as pin lights (count ∝ houses), roads as dotted warm lines, harbour and fleet dots, red ruin glow | [S21] |
| Rest zones | always | a lake, a plain or a band left untextured | [S26] |

**Fading rule** [est, after S23]: the pattern's contrast = `smoothstep(t0, t1, featurePx) × haze(z)`. It should go to zero smoothly, never cut. The same rule keeps it camera-stable: a field's tones are hashed from its cell id, not from screen position.

---

## C. Megastructure construction details (original designs)

### C.1 Vocabulary from real construction

| Element | Real anatomy | Flat-shape recipe [est] |
|---|---|---|
| Tube-and-coupler scaffold [S27] | **Standards**: vertical tubes carrying the load to the ground. **Ledgers**: horizontal, parallel to the façade. **Transoms**: horizontal at right angles to ledgers. **Braces**: diagonals, often an X between frames. **Base plates** on **sole boards** (timber). **Toe boards**: vertical edges on platforms. **Guardrails**: top rail 39–45 in (≈ 1–1.15 m) above the platform. | A grid of thin lines: standards every bay (~2–2.5 m [est]), ledgers every lift (~2 m [est]), one X brace per 3–5 bays, plank strips (lighter) on every second lift, a sole-board dash under each standard. Far: a hatched veil of hairlines. Near: couplers as dots at crossings, a hanging tarp or netting in a second tone. |
| Tower crane [S28] | **Mast** rising from a slab; a **slewing unit** to rotate; a long horizontal **jib** with a **trolley** and hook; a **counter-jib** carrying concrete-block **counterweights**; a **cab** where jib meets mast. | A lattice mast (zigzag), a T on top: long jib, short counter-jib with 2–4 block rects, a cab box, a hook line down from the trolley with a load rect. On the rim wall: cranes standing *on the wall top*, jibs pointing in random headings (seeded), a red light at each jib tip at night. |
| Gantry / launch frame [est] | Two lattice legs and a bridge beam, running on rails | A Π of lattice + a carriage + hanging cable bundle |
| Exposed ribs / lattice (unfinished ring) [est] | Where the floor plates end, the structure shows | **The floor stops in a stepped edge**: plates (flat slabs) → girders (parallel bars) → bare ribs (a comb of thin curves) → nothing (stars below). The arch overhead shows the same as a band of **truss** instead of solid land. |
| Greebles | Small raised details that "imply mechanical function without necessarily having any real purpose" and can make a model seem larger than it is; on Star Wars models, many started as plain shapes detailed with kit parts [S29] | Panel seams + small rect and circle nubs, **dense at the joints, sparse on spans**. Detail must cluster to read as function [est]. |

### C.2 Wall textures by builder (the rim wall and the giant spans)

Real history gives the idea of **sections built by different gangs, each signing its work**:

- **Hadrian's Wall** was built in sectors by legions. One sector shows the unfinished **Broad Wall** foundation with a **Narrow Wall** completing it on top. Centurial stones name the centurion whose century built each length, which shows the building ran west to east [S32].
- **Masons' marks**: banker marks identified which mason dressed each stone when pay was by measure. Assembly marks (Roman numerals) set the order. Quarry marks named the source [S33].
- **Béton brut**: concrete left as cast, showing formwork seams and **board grain** [S30]. **Tie holes** form a grid. Kahn sank them and plugged them with lead; Ando revived the visible pattern, with "only some of the holes … real ties—the rest are counterfeit" [S31].
- **Blade Runner 2049**: Gassner's brief was "brutality, scale and power" [S37]. Enormous animated billboards stand against "humble neon street signs"; lit windows signal density [S38].
- **Halo's Forerunner look** was a "sleek angular design" set apart from curved alien and functional human styles, with structures treated as **sculptures** [S41]. Lehto: the ring should feel "massive, dark, mysterious, sinister, but also full of wonder", "ancient, vast, alive" [S39].

**Builder styles for the ring.** These are original designs. The seed picks 2–4 per ring; each owns a run of wall segments with a visible seam between.

| Builder style | Panel module | Surface marks | Seams and joins | Writing / marks | Lights |
|---|---|---|---|---|---|
| **Founders' stone** (the oldest) | huge ashlar blocks, 1:2, offset courses | weathered, rounded arrises; lichen stain bands | none visible; a slight batter (lean back) | **builders' marks**: one glyph per block, repeated per gang (from Runology runes, Ruby's own) [S33][est] | none, or faint inlaid glow lines in grooves |
| **Poured grey** (utilitarian) | board-formed concrete lifts 1.2–3 m [S30] | horizontal board grain, **tie-hole grid** (some counterfeit, per Ando [S31]) | cold joints (a darker line every pour); rust streaks below each tie | stencilled segment numbers, hazard chevrons | row of small amber caution lights |
| **Sleek angular** (alien builders) | faceted plates, chamfered at 30–60°, few seams | smooth; a thin glow line inset along one edge of each facet | knife-edge seams; no bolts | **asemic** line-script running in a band ("having no specific semantic content" [S34]): generated, never a copy of any game's glyph set | pale cyan or violet inlay pulses slowly |
| **Hex-cell** (engineered) | hexagonal or triangular cells, 2–6 m | slight tone variation per cell (each cast separately) | raised ribs between cells | cell ids as small dot-codes | a lit cell here and there |
| **Patchwork** (later repairs) | mismatched plates bolted over damage | rivet rows; scorch around welds | overlapping plates, shadow lip | spray-painted repair notes, arrows | work lamps on poles |

**Seams between builders** [est, after S32]: one style's coursing ends at a vertical joint, often a step in thickness (broad below, narrow above, as on Hadrian's Wall [S32]). A **centurial-stone nod**: a larger plaque with a gang's mark appears at each segment start.

### C.3 Graffiti and writing on huge walls

| Kind (graffiti glossary [S35]) | Where on the wall | Recipe [est] |
|---|---|---|
| **Tag**: a quick signature | 0–2.2 m above the ground (reachable) | 1–3 looping strokes, one colour, small; dense near paths, doors and terminals |
| **Throw-up**: quick bubble letters, 1–2 colours | 0–3 m, along roads | rounded outline + fill, in 2 colours |
| **Piece**: large, fully coloured, often with characters | on big flat panels near settlements | a rect of 3–5 colours with a bold outline; at a distance just a coloured patch |
| **Heaven spot**: high-risk, hard-to-reach | high on the wall, on crane jibs, at scaffold tops | a single bold tag far above any reachable height: tells a story (someone climbed) [S66] |
| **Buff / ghost**: painted over, faintly showing | anywhere | a rect of slightly different grey with a ghost of a tag beneath |
| **Stencil** | repeated along walls | a crisp repeated glyph or arrow |

**Ghost signs** [S36]: old hand-painted adverts survive on walls, often layered over earlier ones ("palimpsest"). On the rim wall, a **giant faded painted sign** a hundred metres tall would be very loud (rare).

**Layering rule** [est]: builders' marks (oldest) → builders' stencils → ghost signs → buffs → throw-ups and tags (newest, lowest). Each layer is less faded than the one beneath.

**Text content.** The ring's writing is **asemic** (looks like writing, says nothing [S34]), in Runology runes, or in plain short English. That keeps every glyph original. Never copy a game's glyph set (§E).

### C.4 "Computerized bits"

All original [est], placed with C.2's styles.

| Bit | Silhouette | Where | Lights |
|---|---|---|---|
| Terminal pillar | a waist-high slab, a slanted screen, a cable down into the ground | at wall foot, every 200–800 m; by doors | a screen glow; 3 status dots |
| Status panel row | 5–20 small rects in a band | along the wall at 3–10 m | each blinks on its own hashed period |
| Antenna cluster | 3–7 thin masts of different heights + 1–2 dishes | wall top, tower tops | red tip beacons |
| Data conduit | a thick bundle of 3–6 parallel lines sagging between brackets (catenaries) | along the wall face, up the scaffold | travelling dot pulses (an interaction: data "flows" toward a city) |
| Cable tray | a straight band with rung ticks | horizontal, high on walls | — |
| Junction box | a box + 3 cables in, 1 out | at conduit bends | 1 light |
| Glow seam | an inset line of light along a facet edge | sleek builders only | slow pulse |
| Survey beacon | a tripod + a light | unfinished edges, near scaffolds | blinking white |
| Hologram plinth | a disc + a translucent shape above | builders' squares | the shape slowly turns |

### C.5 Unfinished sections, as a world feature [est]

- **Where:** the seed marks 0–2 segments of the ring as unfinished (more in `builders`, some in `ruins`, where it is abandoned construction).
- **On the land:** the floor edge steps down (C.1 ribs). Scaffold veils climb the rim wall. Cranes stand on the wall top. Material stacks (plates, girder bundles) sit by the edge. A builders' camp (geodomes, a landing pad) is within 2 km. Helper and crawler bots are attracted to it (D).
- **On the arch** (far): a gap where the arch is drawn as a lattice band, with tiny crane silhouettes on its edges and survey beacons blinking.
- **Light:** work floodlights (cool white cones) at night; welding sparks (tiny bright dots) as a rare interaction.

---

## D. Robots and droids as life

### D.1 What reads as cute and what reads as threat

| Finding | Source | Rule |
|---|---|---|
| Circles read as friendly, innocent, warm, safe; squares as strong, stable, reliable; triangles as dangerous, aggressive, fast. Designs mix shapes around one dominant shape | [S42] | One dominant shape per robot. Helpers are round; workers are square; sentries and hunters are triangular. |
| "The sharper an angle, the greater its perceived threat" | [S43] | Threat bots get **acute** angles (≤ 45°) on legs, fins and visor. |
| Baby schema: large head, large eyes, high protruding forehead, round face, small nose and mouth; children gaze most at the eyes | [S44] | **Cute = big round head relative to body, 1–2 big round eyes set low on the face.** |
| Round eyes and an upturned or neutral mouth raised trust in robot faces | [S45] | Cute bots: round eye discs. Threat bots: **narrow slit** visors. |
| A quadruped robot behaving submissively was rated safer than a dominant one | [S46] | Pose carries threat: **crouched, head low = friendly; tall, head high, facing the viewer = threat.** |
| HZD machines: broad readable bodies (thin-legged designs were dropped), several animals blended, never literal, a "sense of majesty", "awe-inspiring, threatening" | [S47] | Wilds bots blend animals (heron legs + tortoise shell), with broad bodies for silhouettes. |
| WALL-E: binocular eyes "magnifying the emotions"; "A machine only does what is necessary to complete each task"; worn workman WALL-E against sleek seamless egg-like EVE | [S48][S49] | Cute workers: **two-lens eyes on a neck** (tilt shows emotion); sleek ones are **seamless egg shapes**. Function shows in the body (a scoop, a brush, a lamp). |
| Machinarium: inspired by "old rusty machines, abandoned factories and industrial buildings" | [S50] | Rust and patchwork belong to ruins and cities' back lots. |

**Eye language** [est, from S44, S45]:

| Mood | Eyes |
|---|---|
| Cute | 1–2 large round, warm or white, with a highlight dot |
| Neutral worker | a lens or a visor bar, soft |
| Threat | 1 narrow slit, or 3 or more small eyes in a row, red; the code already shifts threat eyes red [code] |
| Derelict | dark, with one flickering |

**Scale**: cute ≤ 1.5 m, workers 1–4 m, threat 2–8 m, giants 15–60 m (derelict).

### D.2 Archetypes, original, by biome

Columns: cute (C) to threat (T) on a 0–4 scale; silhouette in 3–8 flat shapes; biomes; placement relationship.

| Archetype | C/T | Silhouette | Biomes (as life) | Placement relationship [est] |
|---|---|---|---|---|
| **helper** (exists) | C4 | round body on one wheel, dome head, one big eye [code] | builders, cities, wilds villages | within 60 m of cottages, doors, terminals; waves at the viewer when near |
| **gardener** (new) | C3 | a squat drum on 3 stubby legs, a watering-can spout arm, a leaf hat | wilds villages, magic | in ring-1 plots and orchards [S11]; beside flowers |
| **lamplighter** (new) | C3 | a tall thin pole-bot with a lantern head and a little hood | cities, magic at dusk | at streetlights at dusk: lamps light as it passes (an interaction) |
| **drone** (exists) | C2 | a hovering lens with rotors or none | all but wilds | over roads, sites, rooftops; in pairs along conduits |
| **courier skiff** (new) | C2 | a flat capsule with a stubby fin and a light strip | neon, cities | along transit lines and canyon streets, at roof height |
| **crawler** (exists) | C1 | a low box on many little legs | builders, ruins | on scaffolds and wall faces (it climbs); at unfinished edges (C.5) |
| **weaver** (new) | C1 | a 6-legged frame spinning a cable line behind it | builders | on unfinished ribs, laying girders; attracted to cranes |
| **heron walker** (new) | C2 | tall thin legs + a long neck + a lamp beak; wading [S47 blend-of-animals] | wilds, magic | in shallows (moisture ≥ 0.8); still, fishing; in small flocks |
| **shell grazer** (new) | C2 | a tortoise-dome on 4 short legs, moss on top | wilds, magic, ruins | grazing on pasture (ring 4); moss state by age |
| **walker** (exists) | T2 | a quadruped, tall body | neon, builders | on patrol along walls; tall, head up [S46] |
| **sentry** (exists) | T3 | a turret or tripod, slit eye, acute fins | neon, ruins | at gates, bridges, crater rims; **excl 400 from cottages** (A.4) |
| **hunter** (new) | T4 | a low long wedge on 4 jointed legs, spiked back, 3 red eyes | ruins (rare), neon back lots | among ruins and wrecks; **never** within 1 km of a living village |
| **swarm** (new) | T2 | 10–40 small triangles in a loose cloud | neon, ruins | over crater smoke; at night only |
| **derelict giant** (exists) | T1, quiet | kneeling or fallen mech, 15–60 m, moss and birds on it | wilds, ruins (rare, ≤ 20% of rolls [code]) | in a meadow, succession by age (A.4); trees growing through |

**Biome rule** [est]:
- `magic`: only gardeners, herons, shell grazers and a rare drone, so machines feel like guests.
- `wilds`: the cute and animal kinds, plus a rare derelict.
- `cities`: helpers, lamplighters, couriers, drones.
- `builders`: helpers, crawlers, weavers, drones, walkers.
- `neon`: drones, couriers, walkers, sentries, swarms.
- `ruins`: crawlers, sentries, hunters, derelicts, shell grazers (a cute surprise in the rubble).

---

## E. Halo and Fallout nods without infringing

### E.1 What the law protects and what it leaves free

Summarised from sources; this is not legal advice.

| Principle | Source |
|---|---|
| Copyright protects expression, not ideas. A fairy is free; a Tinker Bell look-alike may infringe | [S54] |
| **Scènes à faire**: stock elements customary to a genre are unprotected | [S53][S54][S57] |
| Functional elements and standard genre elements are not protected by copyright or trade dress | [S53] |
| Generally unprotectable: theme, rules, stock characters, method of play. Generally protectable: **layout, look and feel, storyline, dialogue, sounds**, code | [S57] |
| *Tetris v. Xio*: the rules and idea were free, but **copying the specific visual expression** (field dimensions, ghost piece, colours on lock) was "wholesale copying". Lesson: make your own visuals | [S56] |
| **Trade dress** protects the overall commercial look and feel that identifies a source. It must be distinctive (or have secondary meaning) and non-functional, and the test is likelihood of confusion; colour scheme + layout + iconography can count | [S55] |
| Names of games and products are trademarks. ZeniMax filed "Nuka Cola" for games, electronics and clothing | [S54][S59] |
| Practical advice: don't use others' characters, names or trademarks; fair-use parody is unlikely to fit a game; borrowing a general mechanic is fine; when unsure, don't | [S58] |

### E.2 Generic versus protected, for these two series

| Generic: the genre's, free to nod at | Why it's free |
|---|---|
| A ring-shaped world whose arch rises into the sky | Niven's *Ringworld* (1970). Halo took inspiration from it, and Banks's Orbitals are "miniature Ringworlds" [S51]. Spinning circular stations are over a century old [S52]. |
| Monolithic, angular, ancient alien architecture with inset light lines | A style (angular vs curved) [S41]; Brutalist scale [S37]; greebles [S29] |
| Light bridges, glowing seams, hovering drones | Stock SF devices [est] |
| Powered armour suits | Heinlein's *Starship Troopers* (1959), with earlier roots; "standard sf shorthand" [S60] |
| Googie diners: upswept roofs, starbursts, atomic models, boomerangs, saucer domes | A late-1940s architectural style named in 1949 [S61] |
| Raygun Gothic / retro-futurism | A named aesthetic (Gibson 1981) [S62] |
| Round vault doors | Early-20th-century bank design [S64] |
| Tailfin cars | GM and Cadillac, 1948–1965 [S65] |
| Yellow-and-black civil-defence shelter signage (three triangles in a circle) | A 1961 US Office of Civil Defense sign [S63]; a *real* public sign. Still, draw your own variant, not the sign [est] |
| Bottle caps, billboards with smiling mascots, ghost signs | Everyday objects and an advertising era [S36] |

| Protected: never draw or name | Why |
|---|---|
| Names: Vault-Tec, Nuka-Cola, Pip-Boy, Vault Boy, Master Chief, Spartan (as Halo's), Covenant, Forerunner, Flood, Sentinel (as Halo's), Brotherhood of Steel, Halo as a name for the ring | Trademarks or franchise identifiers [S54][S59] |
| Logos, the Vault Boy figure, the Nuka bottle shape | Expression + trade dress [S55] |
| A cog door painted **with a number** in Fallout's yellow-on-blue scheme | Combines iconic expression and trade dress [S55][S56] |
| Halo's own ring silhouette details: its specific installation designs, glyph sets, Sentinel shapes, the green armour + gold visor | Specific expression and character design [S54][S56] |
| Fallout's specific power-armour helmet designs; Halo's specific weapon and vehicle silhouettes | Specific expression [S57] |

**Design rule for every nod** [est, from S56]: take the **idea** (the genre device) and invent the **expression**. Change at least three of shape, colour scheme, proportion, ornament and context, and use no names or text from either series. A nod should make a fan smile, "that's like…", without being mistakable for the original's art (no likelihood of confusion [S55]).

### E.3 Twelve original Easter eggs

**Rarity**: the chance that a seed's scene has one in view where its world is present [est].
- common p ≈ 0.5
- uncommon ≈ 0.15
- rare ≈ 0.04
- very rare ≈ 0.008

**Loudness** decides rarity: big, iconic and joke-like means rarer.

**Seeding**: `present = mnHash(seed, EGG_ID, 7) < p·worldWeight`. Its spot is the best-scoring candidate for its ground rule within the visible range, found by a seeded search of the kind's sow cells [est]. At most **one loud egg (rare or very rare) per scene** [est].

**Halo-leaning (5)**

| # | Name | Looks like (3–8 flat shapes) | Where | Rarity | Why it's non-infringing |
|---|---|---|---|---|---|
| H1 | **Lantern Warden** | (1) a horizontal lens body, (2) one pale slit eye, (3) three short hanging light-tassels beneath, (4) a faint glow disc under it; drifts in pairs | builders; ruins of builders' walls; near terminals (C.4) | uncommon | A hovering drone is a stock device. Lens + tassels + pairs is our own shape, not Halo's Sentinel design (no forked body, no beam weapon) |
| H2 | **Hardlight Span** | (1, 2) two stubby trapezoid abutments with a glowing slot each, (3) a thin translucent band between them across a gorge or river, (4) chevron ticks along it, (5) glow spill on the water | builders, magic; over water or gorges on a road line (A.5) | uncommon | Light bridges are generic SF. Chevrons, abutment shape and colour are ours |
| H3 | **The Keyless Gate** | (1) a tall trapezoid slab set into a cliff, (2) a vertical slit of light, (3, 4) two inward-leaning buttresses, (5) an asemic glyph band on the lintel, (6) moss at its foot [S40] | builders, ruins; cliff faces with rise > 0.6 | rare | Angular monolithic architecture is a style [S41]. The glyphs are asemic or Runology, never Forerunner symbols [S34] |
| H4 | **Drop-Pod Bloom** | (1) a teardrop pod half-buried, (2–4) three opened petal doors splayed out, (5) a scorch disc, (6) a smoke wisp, (7) a trail of burnt ground behind | wilds, ruins; open meadows; never in towns | rare | Orbital drop capsules are a stock military-SF device [est]. The petal-flower opening is our expression |
| H5 | **Pulse Spire** | (1) a very tall narrow angular spire, (2) a ring-collar halfway up, (3) a vertical beam of light from its tip to the arch overhead, (4) a faint flare where it meets the arch | builders; on the highest crest in view; one per scene max | very rare (very loud) | A tower shooting a beam into the sky is a generic "activation" image. Spire shape, collar and colours are ours; no ring "firing" sequence |

**Fallout-leaning (5)**

| # | Name | Looks like (3–8 flat shapes) | Where | Rarity | Why it's non-infringing |
|---|---|---|---|---|---|
| F1 | **Cog-Door in the Hill** | (1) a round door with 10–14 blunt teeth, rolled aside, (2) a dark round opening, (3) a concrete apron, (4) two warning-stripe bollards, (5) a small rusted lamp; **no number**; painted oxblood and bone, or bare steel | wilds, ruins; hillsides (slope 0.3–0.8, rise > 0); 400 m+ from villages | uncommon | Round vault doors are historic bank design [S64]. No number, no yellow-on-blue, no logo [S55] |
| F2 | **Atomic Diner** | (1) a low glass box, (2) an upswept boomerang roof, (3) a pylon sign with (4) a starburst, (5) a rocket finial, (6) a neon "EATS" or asemic word, (7) a parked finned car (F3) | cities, ruins; beside a road (≤ 20 m), at a junction outside town | common in ruins, uncommon in cities | Googie is a public architectural style [S61]. "EATS" is generic; no brand |
| F3 | **Finned Wreck** | (1) a long low body, (2) two tall tailfins, (3, 4) flat wheel discs, (5) a rust patch, (6) a bush growing through (by age, A.4) | ruins, cities' edges; along roads, in clusters of 1–4 | common (quiet) | Tailfins are 1948–65 car design history [S65]; no marques |
| F4 | **Moon-Grin Billboard** | (1) a big peeling billboard on two posts, (2) a smiling crescent-moon mascot with a nightcap (original), (3) a glowing glass in its hand, (4) a torn strip showing an older layer beneath (ghost-sign palimpsest [S36]), (5) asemic or nonsense slogan | ruins, cities; beside roads, facing traffic | uncommon | An original mascot, not a thumbs-up boy. 1950s ad style and ghost signs are generic [S36] |
| F5 | **Rust Colossus Suit** | (1) a barrel chest, (2) a round porthole helmet (diving-suit style), (3, 4) thick limbs, (5) an open chest hatch, (6) moss and a bird's nest; kneeling | ruins, wilds; in a field or at a crossroads; trees per succession | rare | Powered armour is "standard sf shorthand" since 1959 [S60]. Porthole helmet + barrel chest is ours, not a Fallout helmet grille |

**Quiet scatter (bonus 2, near the viewer)**

| # | Name | Looks like | Where | Rarity | Why it's fine |
|---|---|---|---|---|---|
| Q1 | **Crimped caps** | 3–12 tiny discs with crinkled edges, in bone, red or blue | ruins, cities; near diners, wrecks, benches (T4 clutter) | common (quiet) | Bottle caps are everyday objects; no logo printed |
| Q2 | **The Far Bloom** | a faint mushroom-shaped cloud on the horizon, haze-coloured, barely there | ruins only; the farthest band; never when the scene is gentle (seed mood) | very rare (very loud; tonally heavy) | A historical image, not a franchise's; drawn haze-faint [est] |

---

## F. Close-up (T4): bases, and small things near the viewer

### F.1 What grounds a thing

| Principle | Source | For the ring |
|---|---|---|
| Environmental storytelling: props imply events; the player asks "What happened here?"; "A single prop can transform the scene"; "It has to be possible to miss some things to make finding them meaningful" | [S66][S67] | Each near cluster tells one small story (a dropped bike, a toy at a ruin). Keep them rare enough to be found. |
| Tie details to the premise; "Every anonymous environmental storytelling moment wastes the opportunity" | [S66] | Near clutter belongs to its world: builders' survey stakes, neon's cables, magic's mushroom rings. |
| Bases should show staining or growth; structures look "like they're coming out of the ground" | [S40] | **Every near base gets a stain band + growth.** |
| Foreground: "everything in front of the playable area", e.g. overhanging branches or arches framing a window; closer layers more detailed | [S26] | T4 adds a framing element (a branch or arch edge) on some seeds. |
| Scale matters most; pebbles gathered as piles and then hand-scattered; stacked naturally | [S68] | Rocks come with a pile of smaller stones, not single stones. |

### F.2 What a painter adds at the base, by kind [est]

These are flat shapes, drawn only where ≥ 1.5 px per feature (the existing doc's T4 rule).

| Kind | Base details (each 1–3 flat shapes) |
|---|---|
| **House** (cottage, row, aframe, stave) | plinth band (darker, 0.3–0.5 m); door + 1–3 steps; path from door to road (parcels face the road [S5]); fence or low wall along the parcel line; a bench or pot by the door; a lamp by the door (lit at night); a bin; a bicycle against the wall (cities); a woodpile (wilds); a rain-splash stain band 0.3 m up; moss on the shaded side |
| **Barn, silo** | hay bales; a cart; a water trough; mud ruts at the door; a cat; nettles along the wall |
| **Cathedral, mosque** | broad steps; a square with paving lines; a fountain; pigeons; a bench; lamp posts round the square |
| **Tower (glass, deco, slab)** | a canopy over the entrance; planters; bollards; a bus stop; a taxi; a revolving-door rect; street trees in grates |
| **Neon blocks** | stall awnings; cable bundles to the ground; AC units; puddles reflecting signs (hollows, rise < 0); vending boxes |
| **Builders' structures** | material stacks; survey stakes with flagging tape; a terminal pillar (C.4); cable reels; caution chevrons; a helper bot |
| **Ruins** | rubble fan (a scree-like grading of size, larger at the foot); broken glass glints; a rusted sign; vines up from the base; **one story prop** (a doll, a chair, a kettle) [S66] |
| **Lighthouse** | keeper's cottage, fuel house, boathouse [S16]; a rope coil; lobster pots; a dinghy on the shingle |
| **Windmill** | sacks; a cart; the stage rail shadow; a millstone leaning on the base |
| **Tree, broadleaf** | root flare (2–4 wedge shapes); leaf litter (autumn: a scatter of warm dots); a fallen branch; fungus brackets on dead trees; moss on the shaded side of the trunk |
| **Tree, conifer** | needle carpet (a darker disc, no grass); cones; ferns |
| **Tree, palm, dry** | a fallen frond; a sand ring; a coconut |
| **Rock / boulder** | buried a third (a lip of soil); 3–8 smaller stones scattered downslope (pile then scatter [S68]); lichen dots on the top; grass tuft in the crack |
| **Robot** | track marks or footprints behind it; a cable to a terminal (charging); a flower someone gave it (cute kinds) |
| **Wreck, crater** | a debris trail; scorch; ash; twisted panels |

### F.3 Small things near the viewer, by world

Draw within the existing near radius (grass's sow pass reaches `W*0.05` [code]). Each is 1–4 flat shapes. Relationships are [est].

| World | Common | Uncommon | Rare (story) |
|---|---|---|---|
| wilds | pebbles, wildflowers, fern, clover, a snail, mushrooms (moisture ≥ 0.6) | a feather, an animal track line, a bird's nest | a lost glove on a fence post; a picnic blanket |
| cities | bottle caps (Q1), tickets, leaves in a gutter, a pigeon | chalk hopscotch, a cat, a dropped scarf | a balloon caught on a lamp |
| neon | cable bundles, puddles with sign reflections, a noodle box | a sticker-covered post (slaps [S35]), a stray drone | a single lit paper lantern |
| builders | survey stakes, bolts, a dropped spanner, flagging tape | a cable reel, a hard hat | a helper bot's lost wheel |
| magic | mushroom ring, glowing pebbles, a quill | a fairy circle of lights, a tiny door in a tree root | a spell book left open |
| ruins | crimped caps (Q1), shards, rusted cans, weeds | a rusted sign, a car hubcap, a cracked helmet | a teddy bear, a photo frame [S66] |

**Near-placement relationships** [est]:
- A bin or bike within 3 m of a door.
- Leaves within 1.5 crown radii of broadleaf trees.
- Puddles in hollows (rise < −0.2) after rain (seeded weather).
- Caps near diners, wrecks and benches.
- Pebbles downslope of rocks.
- Flowers along field margins and paths.
- Nothing on the path itself except leaves and puddles.

### F.4 Buildings kept back unless detailed [est, extends the code's rule]

The code keeps tall buildings out of the near field (`hM > 24 + 420·smooth(r)` → skip [code]). Two refinements:

- A building may come closer than the T3 range **only if its kind has a T4 base set** (F.2). Otherwise its minimum distance is where its door would draw at ≤ 12 px.
- At T4, at most 1–2 buildings in the near field, never facing the viewer square-on (a 3/4 angle reads as a place, not a façade). The rest of the near field is ground, clutter and life.

---

## Sources

Every source below was opened and read in this session.

- [S1] Guerrilla Games, "GPU-Based Procedural Placement in Horizon Zero Dawn" (GDC 2017 abstract). https://www.guerrilla-games.com/read/gpu-based-procedural-placement-in-horizon-zero-dawn
- [S2] GameDev.net forum, "Placement and rendering techniques for vegetation/details", reply describing Horizon's placement graphs. https://gamedev.net/forums/topic/699541-placement-and-rendering-techniques-for-vegetationdetails/5393770/
- [S3] 80 Level, "Procedural World Building in Ghost Recon Wildlands". https://80.lv/articles/procedural-world-building-in-ghost-recon-wildlands/
- [S4] 80 Level, "Vegetation Generation in Ghost Recon Wildlands". https://80.lv/articles/vegetation-generation-in-ghost-recon-wildlands/
- [S5] Emilien, Bernhardt, Peytavie, Cani, Galin, "Procedural Generation of Villages on Arbitrary Terrains" (2012). https://perso.liris.cnrs.fr/egalin/Articles/2012-villages.pdf
- [S6] Game Developer, "How Townscaper works: a story four games in the making". https://www.gamedeveloper.com/game-platforms/how-townscaper-works-a-story-four-games-in-the-making
- [S7] RimWorld Wiki, "World generation". https://rimworldwiki.com/wiki/World_generation
- [S8] SideFX Houdini docs, "Removing scattered points" (heightfields). https://www.sidefx.com/docs/houdini/heightfields/scatterptremove.html
- [S9] Bridson, "Fast Poisson Disk Sampling in Arbitrary Dimensions" (SIGGRAPH 2007). https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf
- [S10] Red Blob Games (Amit Patel), "Polygonal Map Generation for Games". https://www.redblobgames.com/maps/polygon-map-generation/
- [S11] Minnesota Agriculture in the Classroom, "Von Thünen Model Reading and Activity". https://cdn.agclassroom.org/mn/edu/worksheet/9-12/von_model.pdf
- [S12] Britannica, "central-place theory". https://www.britannica.com/print/article/102569
- [S13] GameBanshee, Skyrim GDC talk transcript (Joel Burgess, modular level design). https://gamebanshee.com/kuuu
- [S14] Woodside Fire Protection District, "Defensible Space Zones / Home Ignition Zones". https://www.woodsidefire.org/our-district/vegetation-management-defensible-space/defensible-space-information/home-ignition-zones
- [S15] RCET course notes, wind turbine siting. https://www.rcet.org.in/uploads/academics/rohini_99071930003.pdf
- [S16] Wikipedia, "Lighthouse". https://en.wikipedia.org/wiki/Lighthouse
- [S17] Northern Arizona University BIO 301, "Succession". https://www2.nau.edu/~gaud/bio301/content/succ.htm
- [S18] WOCAT, "Rainfed paddy rice terraces" (Philippines). https://qcat.wocat.net/zh/wocat/technologies/view/permalink/5056
- [S19] Somerset Historic Landscape Characterisation guide. https://www.somersetheritage.org.uk/downloads/publications/SomHLCguide.pdf
- [S20] Hedgelink, bocage landscape gradient abstract. https://hedgelink.org.uk/?p=4374
- [S21] NASA SVS, "NASA's Black Marble: Stories from the Night Sky". https://svs.gsfc.nasa.gov/vis/a010000/a014800/a014872/script_38814_00.html
- [S22] Thumbsticks, "GDC 2015: The Art of Firewatch" (Jane Ng). https://www.thumbsticks.com/gdc-2015-the-art-of-firewatch
- [S23] LibreTexts, "Visual Characteristics of Atmospheric Perspective". https://human.libretexts.org/Courses/Coalinga_College/Drawing_Perspectives/05:_Atmospheric_Perspective/5.03:_Visual_Characteristics_of_Atmospheric_Perspective
- [S24] Draw Paint Academy, "How to Paint Atmospheric Perspective". https://drawpaintacademy.com/atmospheric-perspective/
- [S25] Animation Obsessive, "What Kazuo Oga Thinks About When He Thinks About Backgrounds". https://animationobsessive.substack.com/p/what-kazuo-oga-thinks-about-when
- [S26] GameMaker blog, "Creating Depth & Immersion: Parallax". https://gamemaker.io/blog/creating-depth-and-immersion-parallax
- [S27] HSE Blog, scaffolding standards, ledgers and transoms. https://www.hseblog.com/in-respect-of-scaffolding-the-difference-between-standard-ledgers-and-transoms/
- [S28] SkyriseCities, "Explainer: The Parts of a Tower Crane". https://skyrisecities.com/news/2015/11/explainer-parts-tower-crane
- [S29] Wikipedia, "Greeble". https://en.wikipedia.org/wiki/Greeble
- [S30] Wikipedia, "Béton brut". https://en.wikipedia.org/wiki/B%C3%A9ton_brut
- [S31] Witold Rybczynski, "The Form Tie Detail". https://www.witoldrybczynski.com/?p=3797
- [S32] English Heritage, "Significance of Willowford Wall, Turrets and Bridge" (Hadrian's Wall). https://english-heritage.org.uk/visit/places/willowford-wall-turrets-and-bridge-hadrians-wall/history/significance
- [S33] Wikipedia, "Mason's mark". https://en.wikipedia.org/wiki/Mason%27s_mark
- [S34] Wikipedia, "Asemic writing". https://en.wikipedia.org/wiki/Asemic_writing
- [S35] Go From The 413, "Graffiti Glossary". https://gofromthe413.substack.com/p/graffiti-glossary
- [S36] Historic England, Heritage Calling, "Ghost signs: spooky remains of a hidden past". https://heritagecalling.com/2023/05/26/ghost-signs-spooky-remains-of-a-hidden-past/
- [S37] Design Week, "How the graphics for Blade Runner 2049 were designed". https://www.designweek.co.uk/graphic-design-blade-runner-2049-film-dad-festival/
- [S38] Architect Magazine, "The Replicant City of Blade Runner 2049". https://www.architectmagazine.com/design/editorial/the-replicant-city-of-i-blade-runner-2049-i_o/
- [S39] Video Games Chronicle, Marcus Lehto on Campaign Evolved's architecture. https://www.videogameschronicle.com/news/out-of-scale-no-mystery-damn-ugly-halos-original-art-director-shares-his-thoughts-on-campaign-evolveds-architecture/
- [S40] FRVR, Eddie Smith on "the will of nature" and Forerunner structures. https://frvr.com/blog/og-halo-artist-says-campaign-evolveds-visuals-could-look-way-better-by-allowing-the-will-of-nature-to-take-over/
- [S41] "Factions of Halo" (Wikipedia, Kiwix mirror). https://kaweah.freedombox.rocks/kiwix/wikipedia_en_all_maxi_2023-10/Unggoy
- [S42] Pixune, "Shape Language Technique". https://pixune.com/blog/shape-language-technique/
- [S43] *Psychological Research* (2023), "sharper angle, greater perceived threat". https://link.springer.com/article/10.1007/s00426-023-01822-y
- [S44] Borgi et al., "Baby schema in human and animal faces…", *Frontiers in Psychology* 2014. https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2014.00411/full
- [S45] PolyU, "When trustworthiness meets face: facial design for social robots". https://research.polyu.edu.hk/en/publications/when-trustworthiness-meets-face-facial-design-for-social-robots/
- [S46] Hashimoto et al., "Safe Spot" (arXiv 2403.05400, 2024). https://arxiv.org/abs/2403.05400v1
- [S47] PlayStation Blog, "The Making of Horizon Zero Dawn's Machines". https://blog.playstation.com/2017/02/24/the-making-of-horizon-zero-dawns-machines/
- [S48] Creative Bloq, "WALL·E: this year's model". https://www.creativebloq.com/computer-arts/walle-year-s-model-11089200
- [S49] The List, Angus MacLane interview (WALL-E). https://list.co.uk/news/wall-e-angus-maclane-interview-34799
- [S50] GameCritics, interview with Jakub Dvorský (Machinarium). https://gamecritics.com/richard-naik/interview-with-jakub-dvorsky-lead-designer-of-machinarium/
- [S51] Wikipedia, "Ringworld". https://en.wikipedia.org/wiki/Ringworld
- [S52] Supercluster, "The Ringworlds of Halo". https://www.supercluster.com/editorial/the-ringworlds-of-halo
- [S53] Lexplug, case brief: *Incredible Technologies v. Virtual Technologies*. https://www.lexplug.com/casebrief/incredible_technologies_inc_v_virtual_technologies_inc_d_b_a_global_vr_67cce4ebd8a1dd72830cf1d3
- [S54] Revision Legal, "Intellectual Property Protections for Video Games". https://revisionlegal.com/revision-legal/intellectual-property-protections-for-video-games
- [S55] Revision Legal, "Trade Dress Protection". https://revisionlegal.com/trademark/trademark-law/trade-dress-protection/
- [S56] Lizerbram Law, "Tetris case: video game copyright". https://www.lizerbramlaw.com/blog/tetris-case-video-game-copyright/
- [S57] Fenwick, "Electronic Arts v. Zynga: Real Dispute Over Virtual Worlds". https://www.fenwick.com/insights/publications/electronic-arts-v-zynga-real-dispute-over-virtual-worlds
- [S58] Sloperama (Tom Sloper), FAQ 61 on using others' IP. https://sloperama.com/advice/faq61.html
- [S59] Destructoid, "'Nuka Cola' trademark applications filed by Zenimax Media". https://vip-develop.destructoid.com/?p=144592
- [S60] SF Encyclopedia, "Powered Armour". https://www.sf-encyclopedia.com/entry/powered_armour
- [S61] Architizer, "Googie 101: A Space-Age Pop-Architecture Primer". https://architizer.com/blog/practice/details/googie-101/
- [S62] Historical Dictionary of Science Fiction, "raygun Gothic". https://sfdictionary.com/view/3043/raygun-gothic
- [S63] Mental Floss, fallout shelter signs. https://www.mentalfloss.com/history/cold-war/fallout-shelter-signs
- [S64] Wikipedia, "Bank vault". https://en.wikipedia.org/wiki/Bank_vault
- [S65] History.com, "Car tailfins". https://www.history.com/articles/car-tailfins-automobiles
- [S66] Nieman Storyboard, "Harvey Smith on environmental storytelling and embedding narrative". https://niemanstoryboard.org/2011/01/14/harvey-smith-on-environmental-storytelling-and-embedding-narrative/
- [S67] GDC Vault, Smith and Worch, "What Happened Here? Environmental Storytelling" (2010). https://gdcvault.com/play/1012647/What-Happened-Here-Environmental
- [S68] 80 Level, "Setting Up Rocks and Vegetation for a Realistic 3D Environment". https://80.lv/articles/setting-up-rocks-and-vegetation-for-a-realistic-3d-environment/

**Blocked or not loaded this session.** These were not used for claims: the Guerrilla GDC 2017 slide PDF (fetch error), Gigazine's Breath of the Wild design article (permission timeout), Houdini "HeightField Mask by Feature" (permission), Wikipedia "Scaffold", "Von Thünen model" and "Central place theory" (permission; covered by S11, S12 and S27 instead).
