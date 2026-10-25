# Terrain for the Painted Ringworld

**What was asked (2026-10-25).** Ruby's orders for the Painted Ringworld's land: "the land generated and drawn: real landmasses and biomes by the seed, rendered with intention, with transition zones; water with clear shores; nothing morphing as the camera rises or turns; the bands kept to mark drops in elevation and sharp borders; ground textures for each kind of terrain; ground meeting objects well; far land drawn far and well (the distant ring no longer squares, the far land in regions not a checkerboard); floating islands, deep canyons, caves and undergrounds made possible; elevated highways in a neon (cyberpunk) world; draw distance and level of detail by a Detail setting (Low/Medium/High/Ultra) that changes how detailed the terrain is, how far detailed terrain is drawn, and how well biomes blend; no mountain above the rim walls." This doc gathers how papers, games, painters and Niven's books make and draw such land, and ends (§11) with numbered rules for stepsRing.js. It sits beside docs/prior-art/ringworld-stability.md (why the old ridges swam), docs/prior-art/painted-ringworld.md (flat things that read) and docs/prior-art/ringworld-countryside.md (fields, terraces, the shore).

**How to read the tags.** [src](URL) is a page that was opened and read; [est] is an estimate, a computation or a design judgment.

---

## 1. Landmasses from noise

### 1.1 fBm: octaves and their gain
- fBm adds noise octaves, each at double the frequency and with its amplitude cut by a constant gain, so detail repeats at every scale [src](https://iquilezles.org/articles/fbm).
- The gain is G = 2^−H with H from 0 to 1; H = 1 (G = 0.5) is the smoothest case, the one Quilez ties to terrain and clouds, and G = 0.5 is "the most popular value of G found in all fbm implementations" [src](https://iquilezles.org/articles/fbm).
- Mountains look alike zoomed equally in both directions, so a higher mountain "is also wider at its base by the same amount"; a rough test of real silhouettes gave about −9 dB per octave, which fits H = 1 [src](https://iquilezles.org/articles/fbm).
- Detuning the octave step (2.01, 1.99) or rotating the domain between octaves keeps the peaks and zeros of successive octaves from lining up into visible patterns [src](https://iquilezles.org/articles/fbm).
- Red Blob's recipe: amplitudes 1, 0.5, 0.25 summed and divided by 1.75, each octave offset (+5.3/+9.1, +17.8/+23.5) or given its own seed, wavelength = map size / frequency [src](https://redblobgames.com/maps/terrain-from-noise/).
- So for land: gain 0.5, lacunarity near 2 but not exactly, a rotation per octave, and octaves cut at the drawn cell's size (§4) [est].

### 1.2 Domain warping (Quilez)
- Warping computes f(p + h(p)) instead of f(p), h kept close to zero so the warp stays near the identity; both f and h are fBm [src](https://iquilezles.org/articles/warp).
- Single warp: q = (fbm(p), fbm(p + (5.2, 1.3))), result fbm(p + 4·q); the offsets only decorrelate the calls and the 4.0 sets the warp's strength [src](https://iquilezles.org/articles/warp).
- Double warp: r is built the same way from p + 4·q with offsets (1.7, 9.2) and (8.3, 2.8), and the result is fbm(p + 4·r): swirled, "more organic" structure [src](https://iquilezles.org/articles/warp).
- The intermediate q and r can colour the result (a ramp on f, blended by |q|, then by r's second component) [src](https://iquilezles.org/articles/warp).
- For continents, one warp of the continent field gives bays, peninsulas and tongues of land that plain fBm lacks; |q| is a free, coherent second field for regional variation (soil tint, a biome's variant) [est].

### 1.3 Ridged multifractal and its kin (Musgrave)
- Blender's Musgrave node names the family: fBM (additive, "an unnatural homogeneous and isotropic result"), Multifractal (multiplicative, "more similar to a real terrain"), Hybrid Multifractal (mountains rising from plains), Ridged Multifractal (abs value flipped: "sharp peaks"), Hetero Terrain (river-channel look) [src](https://docs.blender.org/manual/en/2.80/render/shader_nodes/textures/musgrave.html).
- Its knobs: Dimension (how fast finer layers weaken), Lacunarity (scale step), Detail (octave count), Offset and Gain (for the hybrid, ridged and hetero kinds) [src](https://docs.blender.org/manual/en/2.80/render/shader_nodes/textures/musgrave.html).
- Red Blob's ridge: ridge(n) = 2·(0.5 − |0.5 − n|), with each higher octave multiplied by the octave below so only mountains gain detail [src](https://redblobgames.com/maps/terrain-from-noise/).
- Quilez damps each octave by 1/(1 + d·d), d the summed analytic derivative, so steep slopes stop gaining detail and flats stay flat: an erosion-like look, "a rich variety of shapes" [src](https://iquilezles.org/articles/morenoise).
- Analytic derivatives are about five times cheaper than central differences and give the slope for free, which a painter needs for lighting and slope-based ground [src](https://iquilezles.org/articles/morenoise).

### 1.4 Minecraft 1.18 and after: continentalness, erosion, peaks and valleys
- The surface is shaped by three noises, continentalness, erosion and peaks-and-valleys (weirdness), which also place biomes [src](https://minecraft.wiki/w/Terrain).
- High erosion gives lower, "windswept" land with steep cliffs; low erosion gives smooth land that can rise higher; mountains reach Y = 256 and plateaus flatten near Y = 130; the same PV noise usually makes the rivers [src](https://minecraft.wiki/w/Terrain).
- Continentalness is "how inland a part of the world is"; high continentalness with low erosion and high PV gives massive steep mountains [src](https://dawnosaur.substack.com/p/how-minecraft-generates-worlds-you).
- Splines turn the noises into heights and allow "sharp elevation changes" plain Perlin cannot; 3D noise is used sparingly, for overhangs, arches and floating islands [src](https://dawnosaur.substack.com/p/how-minecraft-generates-worlds-you).
- Three splines carry the shape: offset (height, from continentalness, erosion, PV), factor (always positive, small where windswept or shattered land goes), jaggedness ("0 in most places", positive at high continentalness, low erosion, high PV) [src](https://minecraft.wiki/w/Tutorial%3ACustom_world_generation).
- A spline's points are ordered by location, each with a value or a nested spline and a derivative, which is how vanilla layers continentalness, erosion and ridges into one offset [src](https://kore.ayfri.com/docs/data-driven/worldgen/noise).
- Depth runs from 1.5 at Y = −64 to −1.5 at Y = 320, falling 1/128 per block and zero at Y = 128, plus the offset spline [src](https://minecraft.wiki/w/Tutorial%3ACustom_world_generation).
- The final density decides each block alone: "positive density is a block", negative is air, or fluid below sea level [src](https://kore.ayfri.com/docs/data-driven/worldgen/noise).
- For a heightfield painter the lesson is the spline: land height = S(continent) + S2(continent, erosion)·ridged(PV), so coasts, plains, plateaus and ranges each get their own designed curve instead of one noise doing everything [est].

### 1.5 Red Blob Games: redistribution, islands, coasts
- Redistribution: e = (e·1.2)^exponent flattens valleys and steepens peaks; terraces are round(e·n)/n [src](https://redblobgames.com/maps/terrain-from-noise/).
- Islands: with nx, ny in −1..1, a square bump d = 1 − (1 − nx²)(1 − ny²) or Euclidean-squared d = min(1, (nx² + ny²)/√2), then e = lerp(e, 1 − d, mix), water at 0.5 [src](https://redblobgames.com/maps/terrain-from-noise/).
- The polygon generator marks water where 1 + noise − √(x² + y²) < 0; water touching the border is ocean, other water is lake, and coastlines are the edges between ocean and land [src](https://www.redblobgames.com/maps/polygon-map-generation/).
- There, elevation is distance from the coast (breadth-first), giving symmetric, volcanic islands; lakes are flat across [src](https://www.redblobgames.com/maps/polygon-map-generation/).
- Real coasts are fractal: Mandelbrot gives 1.02 for South Africa's smooth coast and 1.25 for Britain's west coast [src](https://sciencefocus.hkust.edu.hk/node/277).
- Off a coast the shelf runs on average about 80 km at about 0.5° to a break at a "remarkably uniform" ~140 m, then the slope drops at about 3°; passive margins have wide shelves, active ones narrow and steep [src](https://en.wikipedia.org/wiki/Continental_shelf).
- Earth's heights have two maxima, near 100 m (lowlands) and 4,700 m deep (the sea floor) [src](https://www.britannica.com/print/article/280163), a bimodal spread put down to light continental and dense oceanic crust [src](https://en.wikipedia.org/wiki/Hypsometry).
- So a continent field should be pushed toward two levels (a spline with a steep middle) rather than left Gaussian; that gives broad lowlands, broad sea floor, a shelf, and coasts that are a line, not a smear [est].
- A coast reads as Britain-like when octaves continue down to the drawn cell along the shoreline; dimension 1.2 to 1.3 is the target, and the smooth end (1.02) suits a builders' or a city world [est].

### 1.6 A seed's world as a pure function of position
- Minecraft makes the solid-or-air decision at every position from the final density there [src](https://kore.ayfri.com/docs/data-driven/worldgen/noise).
- Red Blob puts trees on Poisson discs or jittered grids rather than high-frequency noise [src](https://redblobgames.com/maps/terrain-from-noise/).
- The rule: height, climate, biome weights, rivers and the things' seats are functions of (seed, a, z) and of a fineness only; nothing reads the camera, the frame or what was drawn before [est].
- A precomputed coarse field (flow accumulation, §3) stays pure if it is computed from the seed alone on a world-fixed lattice and cached by seed [est].

### 1.7 Choosing sea level
- Minecraft fixes the level (air at Y ≤ 62 becomes water) and shapes the noise around it [src](https://minecraft.wiki/w/Terrain); a world's seaLevel defaults to 63 [src](https://kore.ayfri.com/docs/data-driven/worldgen/noise).
- Red Blob fixes water at 0.5 of a normalized elevation [src](https://redblobgames.com/maps/terrain-from-noise/).
- For the ring: the seed picks a land share (say 25% to 70%), and sea level is that quantile of the continent field sampled on a fixed coarse lattice over the band; it is then lowered if needed so the eye stands on land [est].
- Seas then come out as real basins in some worlds and as scattered lakes in others, and the share is a world trait (one of the seed's choices, shared by arch and land) [est].

---

## 2. Biomes

### 2.1 Whittaker and table lookups
- Whittaker plotted biomes on mean annual temperature against annual precipitation: tropical rain forest, seasonal forest, savanna, desert, temperate grassland, deciduous forest, tundra and others as shaded areas [src](https://academic.marietta.edu/departments/biology/biomes/biome_main.htm).
- Fire, bedrock, drainage and rainfall timing also decide what grows and do not show on the graph [src](https://academic.marietta.edu/departments/biology/biomes/biome_main.htm).
- Red Blob's lookup: e < 0.1 ocean, e < 0.12 beach, then rows by elevation band split by moisture thresholds, with the warning that the numbers need tuning per project [src](https://redblobgames.com/maps/terrain-from-noise/).
- Its rough climate: equivalent_elevation = 10·e² + poles + (equator − poles)·sin(π·y/height) [src](https://redblobgames.com/maps/terrain-from-noise/).
- The polygon generator takes moisture from distance to rivers and lakeshores, and admits it cannot make a desert river [src](https://www.redblobgames.com/maps/polygon-map-generation/).

### 2.2 Minecraft's multi-noise placement
- A biome point has six climate parameters: temperature, humidity, continentalness, erosion, depth and weirdness [src](https://jd.papermc.io/paper/1.21.0/org/bukkit/generator/BiomeParameterPoint.html).
- The noise router carries temperature and vegetation (humidity) beside continents, erosion, ridges and depth [src](https://kore.ayfri.com/docs/data-driven/worldgen/noise).
- In effect the land is sorted by continentalness and erosion, then temperature and humidity pick the biome, and high weirdness picks variants (bamboo jungle, ice spikes) [src](https://dawnosaur.substack.com/p/how-minecraft-generates-worlds-you).
- No Man's Sky's talks describe realistic and alien terrains generated mathematically, without artistic input [src](https://gdcvault.com/play/1024514/Building-Worlds-Using), through a pipeline "from voxel-based generation to eventual population and simulation" [src](https://www.gdcvault.com/play/1024265/Continuous-World-Generation-in-No).

### 2.3 Blending biomes
- Per-biome heights blended by weights that "always add up to a 100% contribution" give smooth transitions; a sigmoid in place of the linear blend sharpens them; a sparse list of contributing biomes keeps it cheap [src](https://gamedev.net/forums/topic/643213-procedural-terrain-and-biomes).
- A weight of the form (impact − |mask − location|)/impact per biome is a common start; another reply argues for terrain first and biomes inferred from elevation, slope, roughness and moisture [src](https://gamedev.net/forums/topic/643213-procedural-terrain-and-biomes).
- A "bridge" biome between two does not hide an abrupt border; Voronoi cells avoid the donut-shaped biomes plain noise thresholds make [src](https://hub.jmonkeyengine.org/t/biome-blending-w-3d-noise/43485).
- Minecraft's Biome Blend setting runs from 0x0 to 29x29 cells of colour averaging; the Better Biome Blend mod makes it "sRGB correct" and large-scale [src](https://modrinth.com/mod/bbrb).
- So: blend in climate space (each biome a centre and a reach in temperature and moisture), not in map space; mix colours in linear light; and let Detail set the blend's width [est].

### 2.4 Real transition zones
- A woodland edge is an ecotone with its own trees, hedge plants and brambles; its line can differ by "several tens of metres" between observers; a gradual edge of young trees and bushes is stabler in storms [src](https://en.wikipedia.org/wiki/Woodland_edge).
- The alpine tree line is "seldom abrupt": closed forest ends at the timberline, then sparse stunted krummholz ("crooked wood") up to the tree line [src](https://en.wikipedia.org/wiki/Tree_line).
- It follows a seasonal mean near 6 °C over about 94 growing days, sits lower on shaded slopes, and runs about 300 to 1,000 m below the snow line [src](https://en.wikipedia.org/wiki/Tree_line).
- Tree lines run from about 500 m (Scotland) to 2,200 m (Swiss Alps) to 5,200 m (Bolivian Andes); the Arctic forest-tundra averages about 145 km wide while alpine ones are "telescoped" [src](https://en.wikipedia.org/wiki/Tree_line).
- The Sahel is a belt "several hundred to a thousand kilometers" wide between Sahara and Sudanian savanna; rain rises from 100–200 mm in the north to 700–1,000 mm in the south, acacia savanna to desert shrub [src](https://en.wikipedia.org/wiki/Sahel).
- A marsh zones by depth: wet meadow about 30 cm, shallow marsh 40–50 cm, deep marsh of pickerelweed, an open-water centre in some [src](https://wetlands.el.erdc.dren.mil/herbmarsh.html).
- A dune coast runs strandline, embryo dunes, white or yellow marram dunes with "plenty of bare sand", grey dune grassland, damp slacks "flooded in winter", heath, scrub, woodland [src](https://coastalwiki.org/wiki/Sand_dunes).

### 2.5 Rain shadow and lapse rate
- Moist air forced up a range cools and rains on the windward side; the air that crosses the crest sinks, warms and dries, giving shrub-steppe or desert behind (the Cascades and the Columbia Basin) [src](https://en.wikipedia.org/wiki/Rain_shadow).
- Convection holds the troposphere's lapse rate near 6.5 °C/km; dry air 9.8, moist about 5; the standard atmosphere uses 6.5 to 11 km, then holds −56.5 °C [src](https://en.wikipedia.org/wiki/Lapse_rate).
- The Ringworld has no Coriolis effect, and its climate "was never explained" [src](https://www.h2g2.com/approved_entry/A87815604), so a prevailing wind is the seed's choice [est].
- Rain shadow without a simulation: march a few samples upwind; moisture falls by the height climbed above the point and recovers over open water [est].
- With 6.5 °C/km and a lowland growing-season mean of 20 °C, the tree line falls near (20 − 6)/6.5 ≈ 2.2 km and the snow line 0.3 to 1 km above it [est].

---

## 3. Rivers, lakes, canyons

### 3.1 Cheap noise rivers and real drainage
- Noise rivers: one or two ridged octaves laid on the land ((1 − |n|) per octave) cut river-like channels; another fractal warps them so they don't run straight [src](https://www.gamedev.net/forums/topic/646350-perlin-noise-for-rivers/).
- Their fault: they "run up and down hills at whim"; erosion, flow accumulation, or tracing rivers uphill from a mouth are the stronger methods [src](https://www.gamedev.net/forums/topic/646350-perlin-noise-for-rivers/).
- Flow accumulation gives each cell its own flow plus "all the flow which ultimately passes through it from upstream", flow handed downstream by a metric such as D8 [src](https://richdem.readthedocs.io/en/latest/flow_accumulation.html).
- Red Blob points each corner at its lowest neighbour, so streams "merge but never split", and rivers are the streams above a threshold [src](https://www.redblobgames.com/maps/polygon-map-generation/).
- Mapgen4 grows rivers from simulated rainfall and wind; a min-flow knob shows more small streams [src](https://www.redblobgames.com/maps/mapgen4/).
- For the ring: a noise valley (the zero set of a warped PV field) whose bed is pulled down toward sea level as continentalness falls flows downhill by construction; flow accumulation on a coarse world lattice, cached per seed, can thin and widen it [est].
- Detail can lower the drawn river's minimum flow the way mapgen4's knob does, so High and Ultra show creeks that Low leaves out [est].

### 3.2 Lakes
- Lakes are water regions not joined to the map's edge, and a lake has one level across [src](https://www.redblobgames.com/maps/polygon-map-generation/).
- A lake is a basin below a local spill height; in a pure-function world the simplest form is a basin in the noise whose floor lies under a level chosen per basin cell from the seed [est].

### 3.3 Canyons, mesas, terraces
- Terragen's canyons: altitude made a scalar, multiplied (10 for steep, 100 near vertical walls), then clamped between floor and plateau heights [src](https://planetside.co.uk/forums/index.php/topic,1266.0.html).
- Mesas form where a resistant caprock protects flat strata; streams cut the plateau's edge into mesas, then buttes; their sides are "cliff-and-bench topography", undercut by basal sapping [src](https://en.wikipedia.org/wiki/Mesa).
- Minecraft's carver canyons are short steep ravines that can reach the lava level [src](https://minecraft.wiki/w/Terrain).
- Wulingyuan has "more than 3,000 quartzite sandstone pillars", many over 200 m, among ravines, gorges and waterfalls [src](https://en.wikipedia.org/wiki/Wulingyuan).
- A canyon in a heightfield: h' = min(h, floor + k·clamp(g(p))), g a warped river field; strata from a terrace function on h' with a soft riser (round(h/t) with a smoothstep), the riser band being a crease to draw (§5) [est].

### 3.4 How the shore reads
- Water's colour by depth: fog = exp2(−density·depth) and colour = lerp(fogColour, bottom, fog); blue is absorbed least, so depth turns blue [src](https://catlikecoding.com/unity/tutorials/flow/looking-through-water/).
- Foam where the water's depth over the ground is small: a clamped depth difference under a threshold (0.7 in the tutorial) brightens the colour, its width set by scaling the difference [src](https://code.tutsplus.com/creating-toon-water-for-the-web-part-2--cms-30485t).
- Wet sand is darker because light bends less at wet grains and travels a longer path, so more is absorbed [src](https://www.hko.gov.hk/en/education/earth-science/optical-phenomena/00362-why-does-wet-sand-look-darker-than-dry-sand.html).
- Shelves are shallow, well lit, sandy near the shore and finer offshore [src](https://en.wikipedia.org/wiki/Continental_shelf).
- So a shore is drawn as five bands: dry sand or grass, a darker wet band, a thin foam line at the waterline, a pale turquoise shelf, then depth to the sea's blue at the shelf break; widths scale with the shore's slope [est].

---

## 4. Terrain level of detail without popping or morphing

### 4.1 Geometry clipmaps (Losasso and Hoppe)
- Clipmaps cache the terrain "in a set of nested regular grids centered about the viewer", updated as the view moves, for "visual continuity" and a steady frame rate [src](https://hhoppe.com/proj/geomclipmap/).
- Each level is n = 255 (odd, 2^k − 1) so its perimeter lies on the next coarser grid; a transition region of width n/10 blends each level into its parent [src](https://developer.nvidia.com/gpugems/gpugems2/part-i-geometric-complexity/chapter-2-terrain-rendering-using-gpu-based-geometry).
- The blend comes from the (x, y) position relative to the viewer, per axis and combined by max: α = clamp((|worldPos − viewerPos| − offset)/width) [src](https://developer.nvidia.com/gpugems/gpugems2/part-i-geometric-complexity/chapter-2-terrain-rendering-using-gpu-based-geometry).
- Clipmaps update by toroidal access, compress well, and have "no exact screen space error control" and many triangles [src](https://www.cs.cit.tum.de/fileadmin/w00cfj/cg/Research/Tutorials/Terrain.pdf).
- Terrain3D builds its clipmap mesh once and recentres it on the camera at intervals, reading heights in the vertex shader [src](https://terrain3d.readthedocs.io/en/latest/docs/system_architecture.html).

### 4.2 CDLOD (Strugar) and chunked LOD (Ulrich)
- CDLOD is "structured around a quadtree of regular grids", its LOD "based on the precise three-dimensional distance between the observer and the terrain" [src](https://github.com/fstrugar/CDLOD).
- It "continuously morphs vertices between LODs depending on their distance from the camera", which also closes seams between tiles [src](https://github.com/tschie/terrain-cdlod).
- "Each vertex is morphed individually based on its own LOD metric", seamlessly and "predictably based on the 3D distance"; other data (normals) is harder to interpolate [src](https://gamedev.net/forums/topic/620084-a-good-heightmap-lod-technique-no-vtf-please).
- For noise terrain, one reply suggests refining octaves as the camera nears; how CDLOD behaves for a viewer far above the land went unanswered [src](https://gamedev.net/forums/topic/704946-lod-for-procedural-terrains/).
- Chunked LOD meshes quadtree tiles offline to a world-space error, picks them by screen-space error, and hides cracks with skirts [src](https://www.cs.cit.tum.de/fileadmin/w00cfj/cg/Research/Tutorials/Terrain.pdf).
- Geomorphs let vertices "smoothly animate from their interpolated position to their correct position"; Ulrich's notes favour an error proportional to view distance in the L1 norm over screen-space error [src](https://courses.cs.duke.edu/cps124/fall02/notes/12_datastructures/lod_terrain.html).

### 4.3 The point that matters here: a grid fixed in the world
- If every vertex is a lattice point k·c of a ring whose cell c is fixed, and its height is h(k·c) from a pure function, then a turn, a tilt or a zoom about a fixed eye moves no vertex: only the projection changes [est].
- Ring centres snapped to multiples of 2c keep each coarser ring's vertices on every other vertex of the finer ring, the condition the clipmap chapter's odd n secures [est].
- Choosing a level by 3D distance makes the land coarsen as the eye rises, which is morphing during a rise; choosing it by horizontal distance along the floor keeps the grid identical as the eye rises [est].
- The cost of horizontal selection from a height is fine rings under the eye smaller than a pixel; such a ring can be left out, because what it would add is under a pixel, so nothing visible changes [est].
- A geomorph by place (the outer 30% of each ring easing into its parent, a design choice near the clipmap's n/10 per side) keeps ring edges crack-free and is also fixed in the world [est].

### 4.4 Far terrain, impostors and the horizon
- Far land is drawn with impostors or billboards, the silhouette "smeared across the far edge of the terrain block", or with coarser rings, the transition hidden by fog [src](https://gamedev.net/forums/topic/711289-far-away-objects-and-horizon-in-an-open-world-game/).
- Players dislike "mountains that grow as you approach", and distant ranges still need silhouettes against the sky [src](https://gamedev.net/forums/topic/711289-far-away-objects-and-horizon-in-an-open-world-game/).
- Distant Horizons draws far chunks "as simplified, low-resolution models", out to "thousands of blocks", without altering world data [src](https://blog.curseforge.com/distant-horizons-frequently-asked-questions/).
- The ring has no horizon: the floor ahead curves up into the arch. With radius R ≈ 93 million miles (half the 186-million-mile diameter [src](https://larryniven.fandom.com/wiki/Ringworld)) the floor at distance d along the ring has risen d²/2R above the eye's tangent plane, the walls' 1,000 miles at d ≈ √(2R·1000) ≈ 431,000 miles, about 0.43 of the width [est].
- A floor point θ round the ring is seen at a grazing angle of θ/2 (chord geometry), so the land a quarter round is seen at 45° and the zenith straight down: the far arch is the land seen as a map, not as ridges [est].
- The air is a thin skin on the floor, so a ray to the arch crosses air only near both ends; haze on the arch is set by the far end's air path, about the air's thickness over sin(θ/2), most at the arch's feet and least overhead [est].

---

## 5. Drawing terrain as a painter

### 5.1 Silhouette and crease edges
- A silhouette is the visible part of the edges that join back-facing to front-facing polygons; a ridge crease is where the dihedral angle passes a threshold θ, a valley where it passes φ [src](https://www.merl.com/publications/docs/TR2001-23.pdf).
- In screen space, a Sobel kernel on the depth buffer catches outer silhouettes and one on normals catches inner creases; depth is weighted more because normals miss some edges [src](https://blog.maximeheckel.com/posts/moebius-style-post-processing).
- A Moebius pass scales the kernel by a thickness, adds a "slight displacement" so straight lines go "wiggly", and hatches shadows denser as they darken [src](https://blog.maximeheckel.com/posts/moebius-style-post-processing).
- For a heightfield seen from its floor, the silhouette is where a farther cell rises above the occlusion horizon held by nearer land (a depth jump in one column of the page); that is where Ruby's bands belong [est].

### 5.2 Sable and Firewatch: flat colour that still reads deep
- Sable's flat shading made depth hard to read, so Shedworks added lighting, then fog ("really, really key" at mid to long range, tuned per biome), then lines; outlines fade with distance, or objects "would just pop in" [src](https://www.gamedeveloper.com/marketing/how-shedworks-refined-the-art-of-sable-in-pursuit-of-readability).
- Firewatch's palette is bold and laid in distinct layers for depth, with flat shapes and strong silhouettes, the sky giving much of the colour and fog adding depth [src](https://www.thumbsticks.com/gdc-2015-the-art-of-firewatch).
- Its sky is one three-colour gradient plus a sun disc, a sun halo and a horizon halo, added together [src](https://blog.camposanto.com/post/112703721804/this-blog-post-is-an-in-detail-explanation-of-part).
- Taken together: bands of fog colour by distance, outlines whose opacity falls with distance, and a sky gradient that the far land's haze is drawn from [est].

### 5.3 Aerial perspective and layered distance in painting
- With distance, contrast falls and colours shift to the air's hue, "bluish when sunlit", reddish near sunrise or sunset; it lowers the contrast of all spatial frequencies and is not a blur [src](https://en.wikipedia.org/wiki/Aerial_perspective).
- Value compression: four or five value steps in the foreground, two or three in the middle, one to one and a half far off, where hills and trees "merge into a single tone" [src](https://willkempartschool.com/?p=49838).
- Guo Xi's three distances: high (looking up from below), deep (from a mountain's front to the peaks behind), level (across to low hills) [src](https://projects.mcah.columbia.edu/jaanus/record/sanen).
- Shanshui builds depth from layered forms, blank areas standing for mist, air or water, and ink going from sharp line to soft wash with distance [src](https://fiveable.me/introduction-art/key-terms/shanshui).
- Watercolour practice: "far things are light, near things are dark", and "the further the mountain, the more it dissolves into the sky" [src](https://drawing-dog.com/blog/how-to-paint-mountains/).

### 5.4 How ridges and planes take the light
- Carlson's planes: sky lightest, flat ground next, slanted hills darker, upright trees darkest; "The more perpendicular a plane is to the source of light, the lighter the plane will appear" [src](https://artistsofutah.org/15Bytes/angles-and-values/).
- Painters mark the shadow side first and put snow only on the sunlit parts [src](https://drawing-dog.com/blog/how-to-paint-mountains/).
- Alpenglow is a "horizontal reddish glow" on peaks opposite the sun when it is just below the horizon [src](https://en.wikipedia.org/wiki/Alpenglow).
- A crest is drawn as a line where its two slopes meet: the slope facing the sun at its Carlson value, the other a step darker, and a thin bright rim on the crest when the sun is low behind it [est].

### 5.5 Far land as regions of colour
- Albala: "larger, simpler shapes and masses convey the essence of a subject better than its details"; small notes stay inside the large shapes [src](https://www.seattleartistleague.com/2016/09/19/mitchell-albala-simplification-massing/).
- Mapgen4 draws coasts and rivers top-down and mountains side-on, an oblique projection for a hand-drawn map [src](https://www.redblobgames.com/maps/mapgen4/).
- The arch's land is seen at θ/2 (§4.4), so it is painted as a map: regions outlined by contouring the dominant biome and sea level on a lattice, filled in one colour each, with hillshade inside; a cell-by-cell fill is the checkerboard Ruby saw [est].

---

## 6. Ground textures by terrain kind

### 6.1 Splat maps, height blends, triplanar
- Texture splatting lays tiled textures by alpha (weight) maps; plain alpha blends make "rather unnatural transitions", and height-based blending improves them [src](https://en.wikipedia.org/wiki/Texture_splatting).
- The height blend: top = max(h1 + a1, h2 + a2) − depth; wᵢ = max(hᵢ + aᵢ − top, 0); colour = Σ cᵢwᵢ / Σ wᵢ, with depth 0.2, so stone tops stay clean and sand fills the cracks [src](https://www.gamedeveloper.com/programming/advanced-terrain-texture-splatting).
- Triplanar mapping samples zy, xz and xy projections weighted by |normal| (to the 4th power, normalized), and on cliffs "the texture stretching has completely vanished" [src](https://bgolus.medium.com/normal-mapping-for-a-triplanar-shader-10bf39dca05a).
- Minecraft's surface layers run about 5 blocks deep by a surface-depth noise, and the preliminary surface sits 2 to 8 blocks below the height [src](https://minecraft.wiki/w/Terrain), [src](https://minecraft.wiki/w/Tutorial%3ACustom_world_generation).
- For a painter, the ground kind at a point is biome weights times a slope rule (rock above a slope limit, scree at its foot, soil and plants below), merged by the height blend so borders are crisp but not straight [est].

### 6.2 What makes each ground read
- Scree gathers at the base of cliffs from rockfall, is sorted with "larger particles" at the bottom, and its slope is concave, near the angle of repose only where it is actively fed [src](https://en.wikipedia.org/wiki/Scree).
- Wind ripples are about 10 cm apart with crests a few mm high, "perpendicular to the wind direction", with gentle stoss faces and steep lee faces [src](https://www.scientificamerican.com/article/why-do-regular-wavelike-s/).
- Sastrugi run parallel to the wind, steep on the windward side [src](https://en.wikipedia.org/wiki/Sastrugi).
- Ridge-and-furrow fields show as parallel stripes, "'S' shaped at the ends" where ox teams turned [src](https://history.charneybassett.org.uk/ancient-history/ring-ditch/).
- Marks by kind: grass as upright ticks in clumps, two tones; scree as dots growing downslope; sand as thin curved lines across the wind; snow as white with blue shade and strokes along the wind; mud as dark low-chroma patches with sky-coloured glints; tilled land as stripes along the field; moss as soft yellow-green blots on shaded faces and at tree feet [est].
- Each mark set is drawn only where its spacing exceeds about 1.5 px on the page; below that the kind is its mean colour, so marks fade with distance rather than switching [est].

### 6.3 Stylized examples
- Breath of the Wild's team wanted art that would "intuitively suggest possible physics and chemistry gameplay" and "an information-dense, mature art style", refreshed from Wind Waker HD [src](https://zeldauniverse.net/2017/03/14/takizawa-explains-how-the-wind-waker-hd-inspired-the-visual-style-for-breath-of-the-wild/).
- Kazuo Oga paints from about 21 poster colours mixed subtly, wet into wet, and distils a scene's key elements, enriching only the details that carry the mood [src](https://animationobsessive.substack.com/p/what-kazuo-oga-thinks-about-when).
- Genshin's GDC 2021 talk describes a "stylized look" built by layering several rendering effects [src](https://www.siliconera.com/mihoyo-gen).
- The common thread: a few colours per kind, variation from mixing within a region, and detail spent where the eye rests [est].

---

## 7. Things meeting the ground

- Contact shadows trace a ray from each pixel toward the light against the depth buffer, adding shadow "where objects meet surfaces"; length 0 is off, 1 the whole screen [src](https://dev.epicgames.com/documentation/unreal-engine/contact-shadows-in-unreal-engine).
- Ambient occlusion darkens "corners and at mesh intersections, creases, and cracks"; a short distance keeps it local, and falloff lightens distant occluders [src](https://docs.blender.org/manual/pt/2.79/render/blender_render/world/ambient_occlusion.html).
- BeamNG's forest brushes limit placement by slope (slopeMin, slopeMax) and sink items into the ground by a random amount over a radius "especially on slopes" [src](https://documentation.beamng.com/modding/levels/level_formats/forestbrush/).
- Unreal's foliage offers Align to Normal, a Ground Slope Angle range, a Height range, a random Z Offset, Random Yaw and a Shade Radius [src](https://dev.epicgames.com/documentation/unreal-engine/open-world-tools-property-reference-in-unreal-engine).
- Flight simulators float distant buildings because they were placed on a lower-resolution mesh and "cached in that position" [src](https://support.justflight.com/support/solutions/articles/17000084809-buildings-in-the-distance-that-appear-to-be-floating-why-is-this-).
- Unity hides cave-mouth edges with rock meshes [src](https://docs.unity3d.com/Manual/terrain-PaintHoles.html); the same trick, a rock or a tuft over a seam, joins any object to the land [est].
- Sable added a moon shadow so characters cast shadows as often as possible [src](https://www.gamedeveloper.com/marketing/how-shedworks-refined-the-art-of-sable-in-pursuit-of-readability).
- The rules: a thing stands on the height the painter draws at its place (the mesh's own interpolation, never the finer true height), its base sunk by its footprint's radius times the slope, its foot darkened by a short occlusion gradient and a contact shadow toward the sun's ground direction [est].
- Trees and buildings stay upright, rocks and props tilt toward the normal, and a skirt of the ground's own marks (tufts, sand, snow) is drawn over the lowest few percent of each trunk or wall [est].

---

## 8. The ringworld's own geography (Niven)

- The ring: diameter 186 million miles, width about 997,000 miles, "Walls 1000 miles tall" along both edges holding the air [src](https://larryniven.fandom.com/wiki/Ringworld).
- Its inner face equals "approximately three million Earths" at gravity "99% as strong as Earth's"; night comes from shadow squares on wires [src](https://en.wikipedia.org/wiki/Ringworld).
- The role-playing game gives 0.992 g and 20 shadow squares near Mercury's orbit [src](https://en.wikipedia.org/wiki/Ringworld_%28role-playing_game%29).
- A 1,000-mile wall "should be enough to keep in the atmosphere"; silt carried to the seas is pumped by "giant pipes and pumps" to "giant silt mountains at the base" of the walls [src](https://www.h2g2.com/approved_entry/A87815604).
- An animation's notes give the spill mountains as about 30 miles high against the walls' 1,000 [src](https://www.nextbigfuture.com/2013/12/video-animations-of-ringworld.html).
- Fist-of-God: a meteoroid pushed the floor up until it broke through, leaving a hole above the air; it is missing from the map [src](https://en.wikipedia.org/wiki/Ringworld).
- The floor there is pushed up roughly a thousand miles over "millions of square miles of desolation", arid and lunar, roughly conical [src](https://planetside.co.uk/forums/index.php?msg=150679); it is "the impossibly colossal mountain" [src](https://zealotscript.co.uk/2017/10/08/superstructure-of-the-week-ringworld/).
- The Great Ocean "contains one-to-one maps of all of the inhabited worlds of known space"; the other great ocean maps the Pak homeworld [src](https://larryniven.fandom.com/wiki/Ringworld).
- In The Ringworld Engineers, the Map of Mars stands about 20 miles above the floor for its thin air, with the control room in the hollow under it, and attitude jets ring the rim [src](https://en.wikipedia.org/wiki/The_Ringworld_Engineers).
- Readers' maps label "Far Great Ocean Ridges" and an "Oval Ocean"; one notes the Fist's hole is "as big across as the earth" [src](https://www.metafilter.com/92702/Visualisation-of-Larry-Nivens-Ringworld-spoilers).
- Scrith is "milky-gray translucent", "nearly frictionless", the floor "only measuring about 30m (100 ft) thick", absorbing nearly all radiation, and makes the walls as well [src](https://larryniven.fandom.com/wiki/Scrith).
- Rivers erode soil into the seas, which is why the pumps exist [src](https://www.h2g2.com/approved_entry/A87815604).
- Ratios: wall/width ≈ 1,000/997,000 ≈ 0.1%; spill mountains ≈ 3% of the wall; Everest (8.85 km, 5.5 miles) would be 0.55% of it [est].
- At the spill mountains' 48 km, with an air scale height near 8.5 km, pressure is about e^(−48/8.5) ≈ 0.35% of the floor's: their tops are bare, airless rock, darker sky, no snow [est].
- Plausible heights, then: true-scale ranges are a few percent of the wall and would be invisible beside it; a painter exaggerates for reading, but under a soft ceiling well below the wall's top (Ruby's order) [est].
- Fist-of-God alone reaches the wall's height in canon; if ever drawn it is a single landmark, and Ruby's "no mountain above the rim walls" rules it to stay below the wall top [est].

---

## 9. Overhangs: floating islands, canyons, caves, undergrounds

- Avatar's islands float because they hold "huge amounts of unobtanium" pulled by Pandora's magnetic currents; the Na'vi name means "floating mountain"; one account bases them on Huangshan [src](https://www.thedigitalfix.com/avatar/why-do-the-islands-float).
- Zhangjiajie's Southern Sky Column, renamed Avatar Hallelujah Mountain in 2010, stands 3,544 feet among some 3,000 pillars [src](https://www.atlasobscura.com/places/avatar-hallelujah-mountain).
- Tears of the Kingdom added "verticality"; to scale, islands looked small from the ground, stepping stones "like loose specks of trash", and many islands made the skies look messy [src](https://www.nintendo.com/sg/interview/totk/03.html).
- Its Depths mirror the surface, highs for lows, which let the base landforms come together "in an extremely short period of time" [src](https://www.zeldadungeon.net/the-legend-of-zelda-tears-of-the-kingdom-developers-say-the-depths-were-made-in-a-surprisingly-short-period-of-time/).
- Cartographers note "the highest elevation on the Surface is actually the lowest point in the Depths", and that stacked layers "can easily confuse players" [src](https://stamen.com/cartographers-play-video-games-a-review-of-the-map-in-the-legend-of-zelda-tears-of-the-kingdom/).
- Minecraft's noise caves (cheese, spaghetti, noodle) can reach the surface, "exposing stone or creating floating islands"; large ones hold pillars; aquifers set water at several levels [src](https://minecraft.wiki/w/Terrain).
- Unity's terrain cuts holes for cave mouths and overhangs; the cave itself is separate geometry, with rocks hiding the jagged hole edges [src](https://docs.unity3d.com/Manual/terrain-PaintHoles.html).
- A heightfield can carry caves with extra heightfields for a cave's floor and ceiling (packed in colour channels), the surface switched off over the opening; it cannot stack caves, and voxels are the general answer [src](https://community.khronos.org/t/heightfields-and-caves-overhangs/44866).
- For the painter: a floating island is a separate object with a heightfield top, an underside of an inverted, ridged cone, a seed-placed seat on a sparse jittered lattice, and a cast shadow on the floor; it is drawn in depth order among the land's cells [est].
- Islands are few and large (TotK's lesson), float well below the wall top, and come mostly in magic or builders' worlds [est].
- Canyons need no overhang: they are a carve in the heightfield (§3.3) with crease bands on each riser [est]. Caves show from outside as dark mouths on steep faces (a decal with a rock lip); an underground is a second floor, the surface heightfield inverted under a ceiling (TotK's mirror), drawn only when the camera is in it [est].

---

## 10. Elevated highways in cyberpunk cities

- Blade Runner's Los Angeles: towers past 3,000 feet, "an elevated network of connections" above the street, the street left "an access corridor and really nothing more", at Hong Kong density, built up by retrofit and "accumulative-accretion" [src](https://theasc.com/articles/blade-runner-set-design).
- Night City's roads, bridges and overpasses were laid by a spline tool and adjusted by hand; the team aimed for "controlled chaos" with negative space and grouped colours [src](https://80.lv/articles/interview-how-cyberpunk-2077-s-night-city-was-built-almost-entirely-by-hand/).
- An urban planner shaped its layout so players usually have good views and can orient themselves [src](https://rpgsite.net/interview/8896-cyberpunk-2077-interview-exploring-the-environment-with-senior-concept-artist-marthe-jonkers).
- Tokyo's Shuto Expressway: about 280 km, first opened in 1962, "many sharp curves", limits of 50 to 80 km/h [src](https://en.wikipedia.org/wiki/Shuto_Expressway).
- Its Inner Circular Route has covered "almost the entire length" of the Nihonbashi River since 1962 [src](https://en.wikipedia.org/wiki/Nihonbashi_River).
- Where a road could not cut through homes it went over rivers on columns along the banks, usually one or two storeys up, crossing over and under other routes [src](https://eugene.kaspersky.com/2024/06/18/the-shuto-expressway-a-pioneering-road-project-from-back-in-the-day/).
- Many decks are "multi-layered, often consisting of four or more", and the Akasaka-Roppongi bends are notorious [src](https://japanesenostalgiccar.com/the-shuto-japans-elevated-expressways).
- Bangkok's Bang Na Expressway is a 55 km six-lane viaduct above National Highway 34, spans averaging 42 m [src](https://en.wikipedia.org/wiki/Bang_Na_Expressway).
- Its deck is a 27 m box girder carrying two 13 m roadways of three lanes; columns average 16 m with 14 m clearance over the old road; single H-shaped columns widen toward the top; 36 ramps 6 to 10.75 m wide [src](https://www.pci.org/PCI_Docs/Design_Resources/Guides_and_manuals/references/bridge_design_manual/JL-00-January-February_Bang_Na_Expressway,_Bangkok,_Thailand-World_s_Longest_Bridge_and_Largest_Precasting_Operation.pdf).
- So a deck is about 4.3 m a lane with shoulders, its girder 2.6 m deep (about 1/16 of a span), and its columns stand about 2.6 times their own 16 m height apart [est].
- How they read: a long horizontal line of deck edge, the underside in shadow, columns as a regular rhythm that shortens with distance, ramps peeling off in pairs; at night two lines of lamps and the neon of the city caught on the deck's wet top [est].
- Placement: along a spline that follows contours (gentle grades), over rivers and canals where they exist, stacked into junctions of two to four decks, each column meeting the ground by §7's rules [est].

---

## 11. What this means for the painter

1. The height is a pure function of world position: h(seed, a, z, fineness), with no camera, frame or drawing order in it; the eye enters only through the fineness asked for at a place [est].
2. Landmasses come from a low-frequency continent field (fBm, gain 0.5, three or four octaves) warped once (q-warp, strength about 4 in the field's own units), pushed toward two levels by a spline so lowlands and sea floor are broad and coasts are lines [est].
3. Height is S(continent) plus mountains: a ridged multifractal masked by a peaks field and lowered by an erosion field, each with its own designed curve, as Minecraft's offset, factor and jaggedness splines [est].
4. Sea level comes from the seed: a land share chosen by the seed, sea level its quantile of the continent field on a fixed coarse lattice, then lowered if needed so the eye stands on land [est].
5. A shelf: the spline holds a gentle step just under sea level so every coast has a pale shallow band before it drops to deep water [est].
6. No mountain above the rim walls: positive heights pass through a soft ceiling h' = C·tanh(h/C), with C about half the wall's height, after any painter's exaggeration of far land, so even an exaggerated far range stays under the wall top [est].
7. The tallest land lies at the walls' feet (the spill mountains), still under the same ceiling, and spill mountains' upper parts are bare airless rock, no snow [est].
8. Climate is a pure function too: temperature = the seed's base − lapse × height; moisture = noise + nearness to water − a rain shadow from a few upwind samples along the seed's prevailing wind [est].
9. Biomes are weights, not labels: each biome a centre and reach in (temperature, moisture, height), weights smoothstepped and normalized, colours mixed in linear light [est].
10. Detail sets the blend's width in climate space: Low about 0.15, Medium 0.45, High 0.75, Ultra 1 of the full width; even at Low, borders are evaluated per point, never per cell, so they are never squares [est].
11. Transition zones are drawn as their own bands where the weights cross: forest edge with a shrub mantle tens of metres wide, krummholz below the tree line, beach to wet sand to marram dune to grey dune to scrub, marsh zones by water depth, a semi-arid belt between desert and savanna [est].
12. Rivers are downhill by construction: a warped zero-set valley whose bed falls toward sea level as continentalness falls, thinned and widened by a seed-cached coarse flow accumulation; Detail lowers the smallest drawn flow [est].
13. Shores are the iso-line h = sea interpolated inside each cell, drawn in five bands (dry, wet and darker, foam line, shallow turquoise, depth to the sea's blue at the shelf break), widths set by the shore's slope [est].
14. The grid is fixed in the world: nested rings of cells, each ring's cell twice the last, ring centres snapped to twice their cell, the level chosen by horizontal distance along the floor only [est].
15. Each ring's outer 30% eases into its parent's shape by place, so ring edges never crack and nothing in the easing depends on the view [est].
16. Each cell asks the height function for detail down to its own size, octaves finer than that fading over about ±15% of their wavelength, so a cell and its neighbours agree [est].
17. Detail sets the cells' size on the page and the land's reach: finer cells and farther detailed rings at High and Ultra, coarser and nearer at Low, so the land's detail, the detailed land's distance and the biomes' blend all follow the one setting [est].
18. Rings finer than a pixel from the eye's height are left out; their land is the next ring's, with nothing visible lost [est].
19. Bands are drawn at silhouettes (where farther land rises above the occlusion horizon held by nearer land), at creases (cliff tops, mesa caprocks, terrace risers, a dihedral threshold), and at biome borders sharp enough to be a line (coast, forest edge); never at distances fixed to the eye [est].
20. A band's depth on the page shrinks with distance and its contrast follows value compression: four or five value steps near, two or three in the middle, one far [est].
21. Crests take Carlson's values: the sunlit slope by its angle to the light, the far slope a step darker, a thin bright rim when the sun is low behind, alpenglow on the highest at dusk [est].
22. Haze is by the air a ray crosses: near land by its distance along the floor, the arch by its own air thickness over sin(θ/2), colour drawn from the sky's gradient [est].
23. Far land, and all of the arch, is painted as a map: regions outlined by contouring biome dominance and sea level on a coarse lattice, each region one colour with hillshade inside, coast and river lines on top; no cell-by-cell fill [est].
24. Ground kind = biome weights × slope rule (rock above about 35°, scree at the cliff foot with larger stones lower, soil and plants below), merged by the height blend (depth about 0.2) [est].
25. Each ground kind has its marks (grass ticks, scree dots, ripples across the wind, sastrugi along it, mud glints, tilled stripes with S-shaped ends, moss blots), drawn only where their spacing exceeds about 1.5 px, else the kind's mean colour [est].
26. Things stand on the drawn mesh's height at their place, sink by footprint radius × slope, get a short occlusion at the foot and a contact shadow, stay upright if they grow or are built, tilt if they are rocks, and wear a skirt of the ground's marks [est].
27. Floating islands are separate objects (heightfield top, ridged inverted-cone underside, shadow on the floor), few and large, seated by the seed on a sparse jittered lattice, below the wall top [est].
28. Canyons are heightfield carves with terraced risers and crease bands; caves show as dark mouths with a rock lip on steep faces; an underground is a second floor (the surface inverted under a ceiling) drawn only from inside [est].
29. Elevated highways in the neon world follow contour-hugging splines, decks 10 to 16 m up on single columns about 40 m apart, 4.3 m a lane, ramps 6 to 11 m wide peeling off in pairs, junctions of two to four decks, over rivers and canals where present; at night two lamp lines, a dark underside and neon on the deck [est].
30. Everything above is one world shared by the arch and the land at the eye's feet, so a coast seen overhead is the same coast walked to [est].

## 12. Steps, smooth shading and things drawn once (Ruby, 2026-10-25)

Ruby: "terrain generator should generate more steps and ridgelines so we can kinda nail the look of the original, even
if that is sort of 'unrealistic' terrain"; "horizontal lines on the terrain and shadow acne are common"; "tree trunks
and stuff change size every few frames … write once, read many".

- libnoise's Terrace module maps heights onto a curve whose control points each "resets the slope to zero", so each
  makes a flat step, the slope rising smoothly between them; it is "often used to generate terrain features such as
  your stereotypical desert canyon" [src](https://libnoise.sourceforge.net/docs/classnoise_1_1module_1_1Terrace.html).
- Gaea's Terrace node "adds even stratification to the terrain", set by its number of terraces, their uniformity and
  their steepness [src](https://docs.quadspinner.com/Reference/Profile/Terrace.html).
- Shadow acne "is a surface shadowing itself from depth-map error", worst at grazing angles; the cure is a bias that
  grows with the surface's angle to the light, not a large flat one, which detaches shadows from what casts them
  [src](https://bugnet.io/blog/how-to-fix-shadow-acne-on-large-flat-surfaces).
- Gouraud shading gives each vertex the average of its faces' normals, lights each vertex, and interpolates the
  intensities across the polygon, which removes the sharp changes at polygon edges
  [src](https://education.siggraph.hosting.acm.org/static/HyperGraph/scanline/shade_models/shadgou.htm).
- An impostor replaces a model with billboards: rendered from one or several views into textures, for what is seen
  from a distance, and for vegetation above all [src](https://documentation.simplygon.com/overview/concepts/impostor.html).
- So in the painter [est]: the land laid in shelves of a seed's own height (some 8 to 40 m by Landforms), each a broad
  level and a short rise in its last fifth, their edges wandering on noise, some regions more stepped, the highest crags
  left to their ridges and the steps faded where the land is read coarsely; no line drawn at a shelf's lip (Ruby, later
  the same day: "the terrain crest contour lines can be removed"; the land's gleam in their place,
  docs/prior-art/ringworld-painted.md §3). Each corner of the mesh shaded by its own slope, read from its neighbours, the cells between
  graded from corner to corner; the walk toward the sun begun past the corner's own cell, a little above the ground.
  Each tree drawn once onto its own sheet, whole whatever its size, and stamped after; each building's shape read once,
  at one size and unlit, and lit wherever it is used.

### Gaps
- Strugar's CDLOD paper could not be opened from here (its PDF links were refused); its claims above come from the project's README, a demo's README and a forum thread [est].
- No source was found for Firewatch's fog specifics or for vanilla Minecraft's biome-blend radius; those rules rest on Sable's account and the Better Biome Blend mod [est].
