# The Ringworld Holding Still: a Painted Land That Keeps Its Shape While the Camera Moves

**What Ruby asked (2026-10-24).** In the Painted Ringworld (stepsRing.js: the land painter rgPaintLand and the thing painter rgPaintThing), "the ground distorts and transforms when you move the camera … it's showing planes that approximate the data that has the actual ground composition … it's possible we can thread the needle and fix the artifacts without completely changing the art style … I like this weird look when it's a static image." Also: "some stuff changes in elevation, due to the land around them morphing", "some buildings pop over each other", and "trees change through stages as the camera moves slowly instead of holding their shape".

**The renderer.** It is CPU canvas 2D. A film is drawn offline, frame by frame. Each frame is drawn from its own camera, and no state carries from one frame to the next.

**How to read this.**
- A reference such as "stepsRing.js 1210" is a line read in this repository.
- [src](URL) marks a page opened and read for this doc.
- [est] marks my own reasoning, or a measurement I made for this doc. §3 describes how each measurement was made.
- Built in Ursa Major–Alcor: §4 steps 1 to 7 and 9, the cut as a circle about the eye (step 11a), and the envelope's
  cousin for fields and ways (each drawn with the ridge before its nearest end). Step 8 (fades between stages) is done
  only for the smallest trees; step 10 follows from 11a (the depth a thing is hazed by is its true distance).

---

## 1. Why the picture changes when the camera moves a little

### 1.1 The fact that makes this solvable: the eye never moves

- The eye stands at a = 0 along the ring, at z0 across it, and at the Altitude's height (stepsGenerative.js 1003, 1018). z0 comes from the seed.
- A film either turns the camera or eases one look toward another.
  - The turns are the Camera Round's quarter, half and full turns, eased or even (CHANGELOG.md, Neptune–Laomedeia).
  - Easing toward another look can also tilt and zoom the camera (moving.js, blendLooks).
  - The camera dial's turn, view and zoom feed ringParams (stepsRing.js 80–83).
- So in every camera move the films make, the camera rotates or zooms about a fixed point.
- A true 3D picture taken this way never changes what hides what. QuickTime VR is built on this: "any arbitrary view of the scene, as long as the viewpoint does not move, can be computed by a reprojection", and "Changing the camera's field of view is equivalent to zooming in and out in the image space" [src](https://www.cs.princeton.edu/courses/archive/spr01/cs598b/papers/chen95.pdf).
- **The consequence** [est]:
  - Any change in a ridge's crest, a thing's height, which thing is in front, or a tree's stage during a turn, tilt or zoom is made by the painter, not by the world.
  - Each one comes from a quantity the painter computes relative to the view. That means forward depth, a bearing measured from the heading, a size on the page, a screen position, or a sample's index.
  - Anything computed only from a point's true distance from the eye and its bearing in the world stays the same through a turn or a tilt. That distance is hypot(a, z − z0).
  - Through a zoom, only what depends on the zoom itself changes, and it can change smoothly.
- The store of things is already world-anchored. Its key has no camera in it, and its things have world positions and streams of their own (stepsRing.js 731–734, 1265–1270). The trouble is in how the painter reads the store and the terrain.

### 1.2 The ridges are planes cut across the view

- **Sixteen cuts.** There are K = 16 of them, at distances dOf(k) = d0·(d1/d0)^(k/15), with d0 = max(2.2·altitude, 0.0012·W) and d1 = 4W (stepsRing.js 1188).
  - Each cut is straight across the view, perpendicular to the heading, and bends round the eye as a circle past 55° (smax, stepsRing.js 1193–1194).
  - Each cut's samples lie at r = d/smax(cos φ) along bearings φ measured from the heading (stepsRing.js 1210).
- **These are Ruby's "planes".** A cut is a vertical slice through the height field, perpendicular to the view. Between two cuts the land is painted as the farther cut's face (stepsRing.js 1241–1242).
  - Volume renderers slice the same way, "perpendicular to the viewing direction" [src](https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-39-volume-rendering-techniques).
- **Why turning moves them** [est]. When the camera turns, the cuts turn with it. A world point at bearing φ from the heading lies on cut k when r·cos φ = d_k.
  - Turning by δ moves cut k, at that world bearing, by about d_k·sin φ/cos²φ·δ.
  - At 30° off the heading that is 0.67·d_k per radian. At 50° it is 1.85·d_k per radian.
  - So a hill off to the side is sliced at a new place every frame of a turn. Its crest rises and falls as the plane passes through it.
- **Measured** (§3, M3–M4, at 1080 × 1920):
  - At the part's default tilt (40.5° up), a 1° turn moves the crest at a fixed world bearing by a median of 0.87 px. The 90th percentile is 5.0 px, about half the height of a band.
  - With the camera tilted 20° up, the figures are 0.76 px and 3.9 px.
  - A 5° turn (20° up) moves it by a median of 0.38 of a band. The 90th percentile is 2.2 bands.
  - In a quarter turn over 12 s (0.25° a frame), the hills at the sides rise and sink by up to about a pixel every frame. That is the "distorts and transforms".
- **The ridges sample depth very coarsely** (§3, M1).
  - Neighbouring ridges are 59% apart in distance (q = 1.587).
  - The finest terrain octave kept on a ridge has a wavelength of only 8–17% of the gap to the next ridge.
  - Voxel Space draws a line for every depth step, starting at dz = 1 and growing it by 0.2 a line [src](https://cdn.jsdelivr.net/gh/s-macke/voxelspace@master/README.md). Here there are 16 lines in all.
- **This is the Ringworld's own look**: few planes and flat faces. What makes it swim is mostly not the small octaves. Dropping every octave finer than half the gap between ridges takes only about a third off the worst swim, and costs up to an eighth of the crest's detail (M4). The large landforms are what move through the plane.
- **The wall clamp** (stepsRing.js 1208). dWall depends on the heading (1198). A ridge past the wall is dropped, and the last one kept is set to 0.995·dWall.
  - As the heading swings toward a wall, a far ridge vanishes. The next one jumps about 2.5% in distance and takes its place [est].

### 1.3 Bearings, facets and fields tied to the screen

- **Bearings move with the camera.** The sample bearings are −PHI + 2·PHI·i/(M − 1) from the heading (stepsRing.js 1210). So the sample grid turns with the camera, and the land slides under it.
- **The crest itself hardly moves** because of this. 140 samples sample it finely: putting the samples at world bearings leaves the crest's swim unchanged (M3).
- **The shapes painted between samples do move.** They are keyed to the sample's index, which is a screen position:
  - **The facets** pair pts[q] with pts[q + 2] for even q (stepsRing.js 1726). The facet grid therefore stays fixed on the page while the land passes under it, and the facets crawl.
    - This is Meier's shower door: "brush strokes stick to the viewplane not to the animating surfaces" [src](https://www.cs.princeton.edu/courses/archive/fall00/cs597b/papers/meier96.pdf).
    - The facets' colours come from world noise at the facet's middle (stepsRing.js 1203, 1728). That world point slides too, so each facet's colour drifts.
  - **The choice between a facet and a lit band** is hard: slope > 0.32 on the page and gsl > 0.2 in the land (stepsRing.js 1745–1746). A facet appears or vanishes when either number crosses its threshold.
  - **The far fields painted in a band** pick their crop by the world cell under the facet's middle: fi = floor(am/cs) (stepsRing.js 1757). When that midpoint crosses a cell edge, a strip changes crop in one frame.
  - **The water's glints** are placed by the same per-facet noise (stepsRing.js 1736–1737).
- **The sample count switches.** M is 140 or 96 depending on whether PHI > 1.2 (stepsRing.js 1209). Zooming across that line changes every ridge's sample spacing at once [est].

### 1.4 Whole-ridge values read at the frame's centre

- Each ridge takes its band depth, its wash colour, its day and its seam from the single sample in the middle of its list, mid = pts[pts.length >> 1] (stepsRing.js 1714–1720).
  - depth = |yC − prevY|·1.4 + px(4). It compares this ridge's middle sample with the farther ridge's.
  - gm = rgGround(V, mid.a, mid.z, mid.ec) is the colour of the whole ridge's wash.
- That sample is whatever land lies under the centre of the frame [est]. As a peak or a snowfield passes through the centre:
  - every lit band and every facet on that ridge thickens or thins together, because they scale with depth (stepsRing.js 1746, 1750);
  - the whole ridge's wash changes colour.
- The low mist uses the same sample (stepsRing.js 1770).

### 1.5 Levels of detail that switch rather than slide

- **The octave cut-off is hard.** The terrain adds octaves until the wavelength falls below fine, then stops: if(wl < fine) break (stepsRing.js 60). fine = 2·Sd/M·1.3 depends on PHI and M (stepsRing.js 1194, 1209).
  - So a zoom drops or adds a whole octave, all along a ridge, in one frame.
  - Measured (M5), over a slow zoom from 95 to 160 in steps of 0.25: 12 of 1560 steps make the crest jump by more than 1 px, up to 2.7 px, and the whole ridge jumps at once.
- **Things use a different level.** A thing's foot uses its own fixed level, T(a, z, W·0.0015) (stepsRing.js 1264). The ridge it stands behind uses the coarser fine of its cut. So the two disagree about the height of the ground [est].

### 1.6 Things standing on a sliding crest

- **The slot.** A thing is drawn after the nearest ridge that lies beyond it (slot, stepsRing.js 1225). It is placed in that slot by its cut depth dd = r·smax(cos φ) (keep, stepsRing.js 1255–1256).
- **stand.** If a thing's foot would stand above that farther ridge's crest on the page, stand presses it down onto the crest plus half a pixel (stepsRing.js 1242).
- Both of these follow the cut, so as the camera turns [est]:
  - The farther crest at the thing's column slides, and a thing that stand has pressed down rises and sinks with it. That is "stuff changes in elevation, due to the land around them morphing".
  - A thing whose dd crosses a ridge's d changes slot in one frame. It is suddenly drawn in front of that ridge instead of behind it. stand then measures against a different crest, so its height jumps.
  - Ways and field pieces take their slots by cutOf in the same way (stepsRing.js 1440, 1489).

### 1.7 Order and haze from forward depth

- **The order.** The things are sorted by dd: nearest first for measuring (stepsRing.js 1707), farthest first within each slot for painting (stepsRing.js 1765). For bearings within 55° of the heading, dd is the depth along the view.
  - Under a pure turn, objects do not move against each other on the page: there is no parallax. But their depths along the view change by different amounts [est].
  - Two overlapping things whose bearings differ by Δ swap order when their true distances differ by less than about Δ·tan φ [est].
  - Example: buildings 20 m wide at 200 m (Δ ≈ 0.1) at 30° off the heading swap when they are within about 6% of each other in distance. Next-door neighbours in a street often are. That is "buildings pop over each other".
- **The cover depends on that order.** The coverage that culls hidden things is built in this same order. Its merge rule depends on order: an overlapping span is joined, otherwise the taller one replaces it (stepsRing.js 1237–1239). So when the order flips, the culling can flip with it.
- **The haze follows the same depth.** A thing's haze is hazeOf(dd) (stepsRing.js 1321). A work's haze is hazeOf(o.d), with o.d = dd (stepsRing.js 1417, 1431). A ridge's haze is its cut's d (stepsRing.js 1714).
  - So a thing panned from the centre to the side of a portrait frame is hazed as if up to about a quarter nearer, and its colour shifts during the pan [est].
  - seen likewise blends between the camera's eye and the painter's higher eye by the depth along the view (stepsRing.js 1284).

### 1.8 Stages keyed to the drawn size, and random numbers shared between stages

- **The drawn size swells off-axis.** A thing's size on the page is hM·f[2], with f[2] from the projection's q = l + vf (stepsRing.js 101–102, 1264).
  - In the painter's stereographic perspective, size grows by 2/(1 + cos θ) at θ off the axis [est from the code].
  - For a 9:16 frame at zoom 100 that is 1.15× at the side edges, 1.46× at the top and bottom edges and 1.61× at the corners [est].
  - So a pan alone carries a tree across a size threshold, and a tilt does so more strongly.
- **The stage thresholds are hard switches on that size:**
  - culling at h < px(1.6) and the tree's solid heart at h < px(4) (stepsRing.js 1322–1323);
  - a building turning into a night dot below px(1.2), and the door detail at 2.1 m > px(10) (stepsRing.js 1331, 1339);
  - small = h < px(7) (paintKit.js 264);
  - the crown drawn as discs or as clumps at rr > px(10) (paintKit.js 139–146);
  - leaves at rr > px(34) (paintKit.js 164);
  - the cedar's and acacia's slabs or crowns at px(30) (paintKit.js 297, 393);
  - the palm's feathered fronds at px(70) (paintKit.js 370);
  - a building's detail at px(14) and its fine detail at px(48) (paintKit.js 1057).
- **Crossing a threshold changes more than the detail.** paintKit gives each thing its own streams (pkSub, paintKit.js 14–15, 25), but within pkTree the shape stream R also feeds features drawn only at some sizes:
  - the bark at h > px(60) and the dead limbs when !small, both drawn before the conifer's tiers draw their widths (paintKit.js 229, 231);
  - the needles at h > px(80), drawn inside the tier loop, so every later tier changes (paintKit.js 250–254);
  - the birch's bark drawn before its crown is grown, with 3 or 12 lobes by small (paintKit.js 331–332);
  - the tier count itself: min(5, n) when small (paintKit.js 224).
  - In a building, the fire escape's draw is taken only when fine, so the water tower's draw changes when fine flips (paintKit.js 1101, 1105).
  - The near crown's backlit dashes take their numbers after the leaves, whose count grows with size. So the dash pattern re-rolls whenever the leaf count changes (paintKit.js 164–167, 181).
  - The palm's RC = sub(5) is the same stream as the tree's form, F = pkTreeForm(sub(5)) (paintKit.js 264, 376).
  - docs/prior-art/painted-ringworld.md §3.4 named this hazard. pkSub fixed it between things and between some features, but not inside the conifer, the birch or the brick building. That is "trees change through stages … instead of holding their shape".

### 1.9 Random seeds taken from the screen, and choices taken from what is in view

- **Wall grain.** The mottle on a large face is seeded by the face's screen position and width (paintKit.js 47). In a pan it re-rolls every frame, so every near wall shimmers.
- **Road wear.** The gravel, stones, cracks, potholes and weeds on a road are seeded by the run's projected middle point (stepsRing.js 1455). That point also changes as pieces change slot.
- Random change in every frame is what Meier's particles were made to stop: "brush stroke positions are randomly distributed, so successive frames of an animation would change randomly" [src](https://www.cs.princeton.edu/courses/archive/fall00/cs597b/papers/meier96.pdf).
- **The loud egg.** Only one is drawn, the first painted (stepsRing.js 1359–1361). A farther one entering at the frame's edge takes the place of one in the middle.
- **Dust devils.** The first four in view are kept (stepsRing.js 1535).
- **The lightning.** It strikes from inView[⌊strike·n⌋] (stepsRing.js 1597–1598), so a turn that changes how many heaps are in view moves the bolt to another cloud.
- **A cloud's billows.** Between about 40 and 180 px wide (in the export's pixels), a heap's billow count is round(W0/px(4)) (stepsRing.js 1606; above that its own shape's share, at most about 45, takes over [est]). Its base row is laid out by that count (stepsRing.js 1617–1619). So a far heap re-forms whenever its width crosses a multiple of 4 px.
- **What already works.** The heap's cauliflower detail fades in by size (stepsRing.js 1626) and the heap thins as it passes overhead (stepsRing.js 1671). A fading figure is drawn whole on its own sheet and laid down see-through (stepsRing.js 1380–1382). These are the patterns the fixes below should copy.

### 1.10 Culling that removes what still shows

- **The hearts.** A tree's solid heart reaches 0.13h either side of its trunk (X ± 0.13h), from Y − 0.8h to Y − 0.4h, for every kind except the dead tree and the willow (stepsRing.js 1323).
- **Narrow trees reach less far than that** [est from paintKit.js 224–235, 307]. These are half-widths, before each tree's own width factor of 0.78–1.28:
  - a fir's tiers reach 0.1–0.15h out at the base, and about half that at mid-height;
  - a spruce's reach falls from about 0.15h at 40% of its height to 0.05h at 85%;
  - a cypress reaches 0.055–0.085h at its widest.
- So the heart claims cover beside the tree's top. A farther house or tree there, which is visible, is culled.
- The cull is taken in columns ww/320 wide (stepsRing.js 1217, 1223). A thing at the edge of that cover pops in and out as it crosses a column.
- Bénard et al. trace popping in their point-sprite method to the same cause: "aliasing in the per-point-sprite visibility tests" [src](https://diglib.eg.org/bitstreams/309081b8-5f6e-4fb0-b903-2d80a5421fac/download).

### 1.11 The symptoms and their causes

| What Ruby sees | Cause | Where |
|---|---|---|
| the ground distorts and transforms as the camera turns | straight cuts at fixed distances along the view swing through the hills | stepsRing.js 1188, 1194, 1210 |
| facets crawl over the land; far fields flicker between crops | samples at bearings from the heading; facets paired by sample index; crops picked at the facet's middle | stepsRing.js 1210, 1726, 1745, 1757 |
| a whole ridge thickens, thins or changes colour | depth, wash, day and seam from the centre sample | stepsRing.js 1714–1720 |
| things rise and sink | stand presses a thing onto the sliding farther crest; things change slot | stepsRing.js 1225, 1242, 1255 |
| buildings pop over each other | order by depth along the view; cover built in that order; hearts too wide for narrow trees | stepsRing.js 1237, 1323, 1707, 1765 |
| trees change through stages | thresholds on the drawn size, which swells off-axis; near-only details drawn from the shape's stream | stepsRing.js 1322; paintKit.js 139, 164, 224–254, 264, 331, 1101–1105 |
| near walls and roads shimmer | random seeds from screen positions | paintKit.js 47; stepsRing.js 1455 |
| a cloud re-forms; the bolt jumps to another cloud | billow count from pixel width; the bolt's heap chosen among those in view | stepsRing.js 1597, 1606 |
| a zoom flicks the ridges | hard octave cut; 96/140 sample switch; ridges dropped at the wall | stepsRing.js 60, 1208, 1209 |
| colours shift across a pan | haze by depth along the view | stepsRing.js 1321, 1431, 1714 |

---

## 2. How other renderers keep a view stable

### 2.1 Terrain level of detail without popping: morph, don't switch

- **Geomorphs** (Hoppe, view-dependent progressive meshes): "These geomorphs eliminate "popping" artifacts by smoothly interpolating geometry", giving "visually smooth rendering even at 72 frames/sec" [src](https://www.microsoft.com/en-us/research/?p=151102).
  - The terrain tutorial from TU Munich lists "Geomorphs (vertex morphing)" as "Linear interpolation of the height of the center vertex" [src](https://www.cs.cit.tum.de/fileadmin/w00cfj/cg/Research/Tutorials/Terrain.pdf).
- **Geometry clipmaps** (Losasso and Hoppe). Each level is a regular grid. "we morph the geometry near the outer boundary of each render_region(l)" toward the next coarser level by z′ = (1 − α)z + α·z_c. α "evaluates to 0 except in the transition region" and "ramps up linearly to reach 1 at the outer perimeter" [src](https://www.hhoppe.com/geomclipmap.pdf).
  - The morph is "not timebased but instead tracks the continuous viewer position" [src](https://www.hhoppe.com/geomclipmap.pdf).
  - A level's edge must "lie on 'even' vertices" of the coarser grid, so the levels share world samples [src](https://www.hhoppe.com/geomclipmap.pdf).
  - The GPU version packs "the signed difference zd" with the fine height so the shader computes z = zf + α·zd [src](https://developer.nvidia.com/gpugems/gpugems2/part-i-geometric-complexity/chapter-2-terrain-rendering-using-gpu-based-geometry).
- **CDLOD** (Strugar 2010). The LOD is "based on the precise three-dimensional distance between the observer and the terrain", the same function "across the whole rendered mesh", with a transition that "gives smooth and accurate results" [src](https://github.com/fstrugar/CDLOD). It "continuously morphs vertices between LODs depending on their distance from the camera" [src](https://github.com/tschie/terrain-cdlod).
  - Distance from the observer is what stays fixed when a camera turns in place [est].
- **One morph amount per patch can itself pop.** Patches at different distances get different amounts. One developer found that a linear blend made "a noticable 'pop'". Blending from 0.0 to 2.0 and clamping at 1.0 guaranteed a patch reaches 1.0 before it splits [src](https://gamedev.net/blogs/entry/1007337-vertex-morphing-action).
- **Chunked LOD and ROAM.** Chunked LOD (Ulrich) picks a level by screen-space error, and its morph "animate[s] the adaptation of the vertices to new locations by slightly moving the location at each step" [src](https://user.ceng.metu.edu.tr/~nebil/calendar/docs/efficientTerrain.pdf). That morph runs in time.
- **What this means here** [est]:
  - A morph that runs in time needs the last frame, which this renderer never has. The clipmaps' morph is the kind that fits: a function of where the eye is and what it looks at, never of time.
  - The ROAM paper itself could not be fetched (§6).

### 2.2 Camera-anchored sampling swims

- **Voxel Space** (Comanche, 1992). The open write-up samples the height map along a line across the map at each distance z from the eye, steps z by a dz that grows with distance, and keeps a y-buffer per column for occlusion [src](https://cdn.jsdelivr.net/gh/s-macke/voxelspace@master/README.md).
  - The write-up says nothing about swimming [src](https://cdn.jsdelivr.net/gh/s-macke/voxelspace@master/README.md).
  - It is the Ringworld's ridge painter with hundreds of depth lines instead of 16 [est].
- **The projected grid** (Johanson's water) documents the same mechanism. It "suffers from the artefact known as swimming, which is somewhat similar (and related) to aliasing". "When the camera is moving, the locations of the points of the grid (and consequently the sampled height-data) will change" [src](https://fileadmin.cs.lth.se/graphics/theses/projects/projgrid/projgrid-hq.pdf).
  - Its remedies are a denser grid, and height data that is "band-limited", for which "Using mipmapping is an efficient way" [src](https://fileadmin.cs.lth.se/graphics/theses/projects/projgrid/projgrid-hq.pdf).
- **Too few slices.** A slice-based volume renderer "suffers horribly from woodgrain artifacts (moire patterns) if the number of slices is too low". The simplest fix, more slices, costs "severe performance" [src](https://community.khronos.org/t/moire-patterns-woodgrain-artifacts-volume-renderer/35737).
- **Steps by distance.** Ray marching terrain with a step proportional to distance gives "more uniform artifacts", because "details decay inverse-linearly with the distance" [src](https://iquilezles.org/articles/terrainmarching).
- **What this means here** [est]: the ridges are a camera-anchored grid with very few depth lines. Band-limiting is the classic remedy, but it blurs the crests Ruby likes, and here it takes only about a third off the worst swim (M4). The remedy that keeps the look is to stop the grid from turning with the camera (§2.3, §2.4).

### 2.3 Snap to the world

- **Shadow maps.** Shadow edges shimmer because the light's projection is recomputed every frame from the view frustum's "Size", "Orientation", the light's location and the camera's. Microsoft notes: "This cannot be seen in still images, but it is very noticeable and distracting in real time". The fix rounds the projection's bounds "to pixel size increments", so the texel grid stays on the same world positions [src](https://learn.microsoft.com/en-us/windows/win32/dxtecharts/common-techniques-to-improve-shadow-depth-maps).
  - That is Ruby's observation in another field: a still looks right, and the motion gives the sampler away.
- **Clipmaps** keep their grids on even vertices of the coarser level, so a level's samples are world samples [src](https://www.hhoppe.com/geomclipmap.pdf).
- **What this means here** [est]:
  - World-anchored here means a bearing in the world (a sample at bearing i·Δ, not at an offset from the heading), a distance from the eye (a cut at fixed r, not at a fixed depth along the view), and a world cell (a field's crop, a facet's colour).
  - Snapping the sample bearings fixes the facets, but not the crest. The crest's swim comes from the cut's distance along each bearing, and only the cut's shape can hold it still (M3).

### 2.4 Rotation about a fixed eye: panoramas and slice shells

- **One panorama serves every view.** QuickTime VR's panoramas are orientation-independent because "each of the images contains all the information needed to look around in 360 degrees". "Pitch and yaw can be accomplished by the reprojection of an environment map", and a player "displays a perspectively correct view by warping a panoramic image" [src](https://www.cs.princeton.edu/courses/archive/spr01/cs598b/papers/chen95.pdf).
- **Slices aligned to the object pop when the renderer switches between stacks.** Volume renderers that slice along the object's axes get "image-popping artifacts when switching from one set of slices to another", and "the sampling distance changes with the viewpoint" [src](https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-39-volume-rendering-techniques).
- **What this means here** [est]:
  - **The only rotation-proof cut shape.** A family of cuts that stays still under a turn about the eye must be defined by distance from the eye alone. That means circles about the eye.
  - **The middle ground.** Any shape set by the heading moves with it. A parabola with its focus at the eye, r = 2d/(1 + cos φ), moves about a third as much as a straight line (M4). On the page it reads as straight for a level camera (M2).
  - **Holding a heading instead.** Straight cuts held at a fixed world heading, such as a film's own reference heading, are world lines and do not move at all. They slant on the page as the camera turns away from that heading.
  - **Switching between held headings** would pop, as the volume renderers' stacks do, unless the change is morphed. A morph spreads the same change over the transition rather than removing it.
  - **A film painted from one panorama** could be drawn once and warped for every frame. That holds only while the clock stands still (§6).

### 2.5 Crossfades and hysteresis for sprites and impostors

- **Unity** defines cross-fading as "rendering two levels at the same time, with a weighting of 1 to 0 for the current LOD level and 0 to 1 for the next", by "screen-space dithering or transparency" [src](https://docs.unity.com/en-us/engine/6000.0/manual/analysis/graphics-performance-profiling/simplifying-distant-meshes-with-level-of-detail-lod/class-lodgroup).
  - The transition "begins the moment the Model's height ratio crosses the next LOD threshold" [src](https://docs.unity.com/en-us/engine/6000.0/manual/analysis/graphics-performance-profiling/simplifying-distant-meshes-with-level-of-detail-lod/class-lodgroup).
  - By default the fade is time-based. To make it depend on where the camera is, "disable the Animate Cross-fading option and set the Fade Transition Width" [src](https://docs.unity.com/en-us/engine/6000.0/manual/analysis/graphics-performance-profiling/simplifying-distant-meshes-with-level-of-detail-lod/class-lodgroup).
  - The Speed Tree mode instead stores "the next LOD position for each vertex" and interpolates between them [src](https://docs.unity.com/en-us/engine/6000.0/manual/analysis/graphics-performance-profiling/simplifying-distant-meshes-with-level-of-detail-lod/class-lodgroup).
- **SpeedTree's runtime** describes its LOD as "a floating point value, ranged from 1.0 to -1.0":
  - "Small outlying branches are gradually scaled down to their center line";
  - for leaves, "Some percentage of the leaf instances are gradually shrunk away and the remaining instances are scaled up";
  - the 3D tree "gradually become[s] transparent while the billboards gradually fade in" [src](https://docs.unity3d.com/speedtree-runtime-sdk/manual/level-of-detail.html).
- **Pixar's stochastic level of detail** solves "the "popping problem"" by tagging each primitive in a transition region "with an upper and lower range of valid m values". Each image sample then sees one representation or the other: "80% of the sample points will see the high detailed representation" in its example [src](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/6300956).
  - That is a dithered crossfade done per sample [est].
- **Stochastic simplification** ("Stochastic simplification of aggregate detail", Pixar) works by "randomly selecting a subset of the geometric elements" and "altering those elements statistically to preserve the overall appearance" [src](https://history.siggraph.org/?p=115388).
  - On The Good Dinosaur, the share kept "is smooth under camera motion" [src](https://history.siggraph.org/wp-content/uploads/2022/10/2015-Talks-Garcia_Environment-Rendering-Optimization-for-Pixars-The-Good-Dinosaur.pdf).
- **Hysteresis** adds or subtracts an offset to the LOD distance "to avoid popping when a LOD object moves close to the LOD transition continuously" (Blender's game engine, 10% of the gap between levels by default) [src](https://projects.blender.org/archive/blender-archive/commit/e7d051043dc82c2991eb491e0630d9b1065934c3). The threejs.org LOD calls it a "Threshold used to avoid flickering at LOD boundaries" [src](https://threejs.org/docs/pages/LOD.html).
  - Hysteresis needs to know which level was used last frame, so it cannot be used here as it is [est]. A fade band that depends only on the current view does the same job without memory.
- The earlier view research already took Leadwerks' crossfade between neighbouring billboard views (docs/prior-art/ringworld-life-and-views.md).

### 2.6 A stable painter's order

- **Unity sorts sprites one of two ways.** "Perspective view sorts sprites based on the distance from the Camera's position to the sprite's center". "Orthographic view sorts sprites based on the distance along the view direction" [src](https://docs.unity3d.com/2022.3/Documentation/Manual/sprites-sort.html).
  - For an eye that only turns, the first key never changes and the second does [est].
- **Meier** transforms the particles to screen space and sorts them "in order of their distance from the viewpoint". The paper allows that the per-frame sort can make strokes pop [src](https://www.cs.princeton.edu/courses/archive/fall00/cs597b/papers/meier96.pdf).
- **The painter's algorithm** needs only an order in which "an object obscuring another is painted after the one it obscures". It "does not have to respect the numerical distances", and it fails for "cyclic overlap or piercing polygons" [src](https://en.wikipedia.org/wiki/Painter%27s_algorithm).
- **For boxes of any size**, an isometric engine compares pairs only where "the rectangles enclosing the boxes overlap", then orders them topologically [src](https://www.texturemind.com/post2354/).
- **Ties.** "Array.prototype.sort is now guaranteed to be stable", so things whose keys are equal keep their order in the list [src](https://v8.dev/features/stable-sort).
  - A stable sort and a key that never ties (distance, then the thing's own seed) give the same order every frame [est].

### 2.7 Keeping a painted look coherent in motion

- **Meier.** "If we treat brush strokes as particles that are stuck to surfaces, we eliminate both the 'shower door' effect and random temporal noisiness" [src](https://www.cs.princeton.edu/courses/archive/fall00/cs597b/papers/meier96.pdf).
  - The particles live "in World Space", and "a seed is stored with each particle so that the same random perturbations will be used" [src](https://www.cs.princeton.edu/courses/archive/fall00/cs597b/papers/meier96.pdf).
- **Bénard et al.** name three goals, and the Ringworld already has the first:
  - "Flatness by which we mean the ability to convey the 2D aspect of a given stylization";
  - "Coherent motion represents the high correlation between the 3D scene motion field and the pattern motion";
  - "Temporal continuity is the quality of minimizing changes from frame to frame to ensure fluid animations" [src](https://diglib.eg.org/bitstreams/309081b8-5f6e-4fb0-b903-2d80a5421fac/download).
  - Any method "is necessarily a compromise" [src](https://diglib.eg.org/bitstreams/309081b8-5f6e-4fb0-b903-2d80a5421fac/download).
  - Their survey's aim is "minimizing distracting flickering and sliding artefacts", and the goals "are inherently conflicting" [src](https://diglib.eg.org/handle/10.1111/v30i8pp2367-2386).
  - The fixes below take coherent motion and temporal continuity without giving up flatness [est].
- **Tonal art maps** (Praun et al.) nest their strokes. "strokes in lighter images be subsets of those in darker ones", and strokes at coarser levels are subsets of those at finer ones, so "existing strokes persist while a small number of new strokes fade in" [src](https://gfx.cs.princeton.edu/proj/hatching/hatching.pdf).
  - Without nesting the strokes seem to swim as a surface nears or recedes [src](https://gfx.cs.princeton.edu/proj/hatching/hatching.pdf).
  - This is the model for a tree that gains detail as it nears: the far drawing should be a subset of the near one [est].
- **Counter-based random numbers** (Random123). Each value is g(counter, key), where "g() is a stateless, pure function" that "may be called any number of times in any context and always returns the same result for the same inputs" [src](https://www.thesalmons.org/john/random123/releases/1.09/docs/CBRNG.html).
  - A feature's random numbers keyed to (the thing, the feature) never depend on what was drawn before it. pkSub is this idea [est].

### 2.8 A continuous number of octaves

- Musgrave's fBm accepts a fractional number of octaves. The remainder scales the last octave: "remainder = octaves - (int)octaves; if ( remainder ) … value += remainder * Basis( point ) * exponent_array[i]" [src](https://klasses.cs.uchicago.edu/archive/2015/fall/23700-1/final-project/MusgraveTerrain00.pdf).
- It ties a band-limited octave count to the Nyquist limit: "octaves = log2(screen resolution) - 2" [src](https://klasses.cs.uchicago.edu/archive/2015/fall/23700-1/final-project/MusgraveTerrain00.pdf).
- That turns the terrain's octave switch into a slide [est].
- **Maximum mipmaps** store "the maximum height value of the four underlying mipmap pixels" at each coarser level, which bounds a whole region's height at once [src](https://pure.mpg.de/pubman/item/item_1325622_5/component/file_3590464/i3d08.pdf).
  - That is the cheap way to ask "how high does the land rise anywhere between two cuts" if that is ever wanted (§4, step 12) [est].

---

## 3. Measurements made for this doc [est]

**Method.**
- I wrote small node scripts outside the repo. They import ringParams, ringCamera and the noise from stepsGenerative.js and copy rgTerrain (stepsRing.js 56–67), rgView's T and projection (stepsRing.js 92, 101–103) and the ridge sampler (stepsRing.js 1188–1210).
- Settings: the wilds (no terraces or city flattening), Landforms 50, Band 45, Walls 25, Altitude 15, zoom 100, a 1080 × 1920 frame, and six to ten seeds.
- Tilt: the camera tilted 20° up, and again at 40.5° up. 40.5° is the Painted Ringworld's default: its camera dial's view 55 feeds the land's look up (chains.js 2627 and its wires; ringParams, stepsGenerative.js 1032). Its seeded views, 35 to 75, tilt it 58.5° to 22.5° up.
- The scripts measure the crest only. Bands, facets and colours were not measured.
- One "band" is the page height between a ridge and the next nearer one at the frame's centre, on flat ground.

**M1, the ridge ladder.**
- Each ridge is 1.587 times farther than the last.
- The octave cut-off fine is 1/10 to 1/15 of the gap between neighbouring ridges.
- The finest octave kept has a wavelength of 8–17% of that gap (ridges 5–15).

**M2, the shape on the page.** These are crest heights on flat ground relative to the frame's centre, in bands, for ridge distance d = 0.04W:

| Camera | Off the axis | Straight cut | Circle | Parabola |
|---|---|---|---|---|
| tilted 40.5° up (default) | 40° | 3.82 above | 3.41 above | 3.63 above |
| tilted 40.5° up (default) | 60° | 9.19 above | 8.39 above | 8.89 above |
| tilted 20° up | 40° | 1.93 above | 1.51 above | 1.73 above |
| tilted 20° up | 60° | 4.67 above | 3.79 above | 4.33 above |
| level | 40° | rises 0.19 | sags 0.24 | flat (0.01) |

- **The tilt dominates.** A camera tilted up bends every line of the land upward toward the sides of the frame. That bend dwarfs the difference between the shapes.
- **On the tilted cameras these looks use**, a circle's ends sit about 0.4 band lower than today's straight cut at 40° off the axis, and 0.8–0.9 band lower at 60°. So a circle reads slightly straighter on the page than today's cut, not more bowed.
- **On a level camera** a circle sags slightly where today's cut rises slightly.
- All shapes coincide at the centre.

**M3–M4, the swim.** The crest's page height at a fixed world bearing was compared across a 1° turn, seen from the same camera. A pure turn should move it by 0. The table is for ridges 4, 8 and 12 at 20° and 40° off the axis:

| Cut | 40.5° up (default): median / 90th percentile, px | 90th percentile, bands | 20° up: median / 90th percentile, px |
|---|---|---|---|
| today (straight, bearings from the heading) | 0.87 / 5.0 | 0.55 | 0.76 / 3.9 |
| straight, bearings in the world | as today (M3) | as today | 0.76 / 3.9 |
| d/cos^0.5 φ | 0.50 / 1.6 | 0.19 | 0.48 / 1.5 |
| parabola 2d/(1 + cos φ) | 0.49 / 1.5 | 0.18 | 0.45 / 1.4 |
| circle about the eye | 0 / 0 | 0 | 0 / 0 |
| straight, octaves finer than half the gap dropped | 1.02 / 3.1 | 0.34 | 0.90 / 2.8 |

- **Detail.** The parabola and the circle keep the crest's detail: its total variation along the cut stays within 3% of today's. Dropping the octaves loses 7% (20° up) to 12% (40.5° up).
- **Bigger turns.** For a 5° turn today's swim is 0.38 band (median) and 2.2 bands (90th percentile).
- **A slab envelope does not help.** Taking the topmost land from each cut to the next farther one, in 8 steps, does not reduce the swim (0.50 against 0.47 band at the 90th percentile, 20° up).

**M5, a slow zoom.**
- The zoom ran from 95 to 160 in steps of 0.25, measured at 30 points on ridge 8, for six seeds, 20° up.
- Today, 12 of 1560 steps jump by more than 1 px, up to 2.7 px.
- With a fractional last octave weighted by clamp(log2(wl/fine) + 1, 0, 1), none jump by more than 1 px (largest 0.7).

**M6, speed.**
- One pass of terrain samples for all ridges (16 × 140, all octaves) takes about 3 ms in node, and eight passes about 22 ms.
- PERFORMANCE-AUDIT.md measures a film frame at 2400 × 1500 at about 0.8 s.
- So the terrain sampling is under 2% of a frame.

---

## 4. What we take [est]

**The ordering.**
- Steps 1–9 keep a still as it is. Pixels move a little, but the look, its bands, its flat faces and its things do not change.
- Steps 10–12 change what a still shows, and need Ruby's eye on sheets.
- Step 11 is the biggest fix for the moving ground and a one-line change. So its sheets can be made first, while steps 1–9 are built.
- Every step is proven by measuring a pan and a zoom before and after (§3's crest test, plus counts of things that change stage, slot or order between neighbouring frames), and by the review sheet's moved camera (tools/review.mjs).

### 1. Seeds from the world, not the screen (cheapest; very visible in every pan)

- **Wall grain.** pkGrain (paintKit.js 44–55) should be seeded by the face's own stream, passed in by its caller, not by x0, y0 and w on the page. Its mottle and streaks should be laid in the face's own unit square (fractions of its box), so they move and scale with the face.
- **Road wear.** paintWay's Rm (stepsRing.js 1455) should come from the way and the world index of the run's first piece (wy.i and that piece's place along the way), not the run's projected middle.
- **Cost:** none.
- **Still:** the mottle and the wear re-roll once, with the same character.

### 2. One order that a turn cannot change (cheap; "buildings pop over each other")

- **Keys.** Sort the things (stepsRing.js 1707, 1765) by true distance from the eye, r = hypot(a, z − L.z0), then by o.rs. This is Unity's perspective key and Meier's order (§2.6).
  - Keep dd only for choosing a slot until step 11.
  - The ships already carry their true distance (stepsRing.js 1425). The other works carry dd (stepsRing.js 1417) and can carry r instead.
- **Large buildings.** For large buildings whose page boxes overlap (few in any frame), order the pairs by whose footprint lies in front along the ray from the eye, then topologically (§2.6).
- **Choices from the world.** Make the three choices that today go to whatever is in view, from the world instead:
  - the one loud egg: the nearest by r among all those kept;
  - the four dust devils: the first four by their own index among those standing in the world;
  - the bolt's heap: by the strike's number among all heaps within reach, not only those in view.
- **Cost:** none.
- **Still:** an order changes only where overlapping things off the axis were ordered by the depth along the view.

### 3. Detail by a size that a turn cannot change (cheap; "trees change through stages")

- **The size.** Give every thing a size for choosing its detail, lodPx = hM·W·0.00025·F/r, measured at the true distance with no off-axis swell. Pass it next to the drawn size (as a ratio on the colours object, so the kit's signatures stay).
- **Where it applies.** Compare it in every threshold:
  - in rgPaintThing (stepsRing.js 1322, 1323, 1331, 1339, 1347, 1350, 1358, 1364, 1368, 1392, 1400);
  - in pkTree, pkLobes, pkConifer and pkBuilding (paintKit.js 139, 164, 229, 250, 264, 297, 370, 393, 1057).
- **What is drawn.** Shapes are still drawn at the projected size.
- **Clouds.** A heap's billow count comes from its own measure, set once per heap from wd0 and ht0, not from W0/px(4) (stepsRing.js 1606).
- **The eye height.** seen takes r, not the depth along the view (stepsRing.js 1284).
- **Result.** A pan or a tilt then changes no thing's stage, and only a zoom does.
- **Cost:** none.
- **Still:** things near the frame's corners may show one stage less, because they are drawn up to 1.6 times their detail size.

### 4. Each feature its own stream (cheap; trees hold their shape through a zoom)

- **pkTree** (paintKit.js 263–490). The shape stream R serves only the shape. Bark, dead limbs, stubs, needles, highlights and backlit dashes each take a sub-stream of their own, as pkSub already allows.
  - Use indices from 6 up. Indices 1 to 5 are taken: the shape, the lobes, the glowing tree's, the fruit and blossom, and the form (paintKit.js 264, 472, 482, 486).
  - The palm's RC = sub(5) replays the tree's form today (paintKit.js 376), so move it to one of the new indices.
- **pkConifer** (paintKit.js 223–260). Draw every tier's numbers (widths, droops, the 10% stubs) into an array before any tier is drawn. Then draw the tiers, with each tier's needles from a stream of their own (one per tier).
  - When small, draw the same tiers that the full tree draws. That is the first min(5, n) of the same list, not five new ones.
- **pkLobes and pkBacklit** (paintKit.js 138–183). The leaves and the backlit dashes each take their own stream, so a growing leaf count moves nothing else.
- **pkBuilding** (paintKit.js 1101–1105). Take the fire escape's and the water tower's draws whether or not each is drawn.
- **Keeping the near stage exact.** Where a skipped feature's count does not depend on size (the bark's count is a ratio of the trunk's height to its width), draw its numbers and discard them. The near stage then keeps its exact look, and the far stages take on its shape.
- **Cost:** none.
- **Still:** a one-time re-roll of the far stages, or of the near stage where its count does depend on size. The fingerprints change, and Ruby judges with tools/compare.mjs.

### 5. Ridges sampled at bearings in the world; facets and fields with them (moderate; the crawl)

- **The bearings.** In the ridge loop (stepsRing.js 1209–1214), sample bearing i·Δ for every whole i between ψ − PHI and ψ + PHI, with ph = i·Δ − ψ.
  - Δ = 2·1.468/139 is today's spacing at zoom 100. It stays fixed for every heading and zoom, and the count follows PHI. That retires the 96/140 switch.
- **The facets** pair even world indices (stepsRing.js 1726). Each facet then stays on its own piece of land.
- **The facet test** becomes a weight on the land's own slope, w = smooth(0.15, 0.25, gsl), dropping the page's slope, which a turn changes.
  - w moves the facet's lower corners between the band's depth and the facet's, as a clipmap moves z toward its coarser level (§2.1).
  - That replaces the switch at stepsRing.js 1745–1750.
- **The far fields' crops** (stepsRing.js 1757) and the water's glints (stepsRing.js 1736–1737) follow the world indices.
- **Measured:** this leaves the crest's swim as it was (M3). It stops the facets and the fields from crawling.
- **Cost:** none. The count of samples is the same.

### 6. Each ridge read where it stands, not at the frame's centre (moderate; ridges that thicken or change colour)

Replace the reads of mid (stepsRing.js 1714–1720) in one of two ways.

- **(a) Keep one depth per ridge, from distance alone.** Set the depth from the page height between this ridge's distance and the next one's on level ground at the frame's centre. Take day and seam the same way.
  - Under a turn it is constant.
  - Under a tilt it changes smoothly with the projection.
  - A still keeps "one band thickness per ridge".
- **(b) Per column.** Take the depth from the gap to the farther crest at each column (both crest arrays exist, stepsRing.js 1217–1222), smoothed over a few samples.
  - The wash becomes a gradient through each sample's ground colour, and day and seam are taken per sample.
  - This is richer, but it changes a still: bands thicken where the land behind stands taller.
- **Recommendation:** (a) first. Then (b) on a sheet for Ruby.
- **Cost:** (a) none. (b) a gradient of up to M stops per ridge, well under a millisecond.

### 7. A smooth level of detail in the land itself (small; a zoom's flicks)

- **The octave.** In rgTerrain's raw (stepsRing.js 59–60), weight the last octave by its fraction (§2.8) over a narrow ramp, such as wl between 0.85 and 1.15 of fine, so a still barely changes.
- **The feet.** Give things' feet (stepsRing.js 1264) the same octave level as the ridge behind them at that distance. A thing then stands on the land its ridge shows, and stand (stepsRing.js 1242) rarely has to press it down.
- **The wall.** Replace the wall's drop and clamp (stepsRing.js 1208) with a fade. A ridge past the wall's line fades out by how far past it lies, so turning toward a wall thins the far ridges gently.
- **Measured:** no whole-ridge jumps over 1 px in a slow zoom (M5).
- **Cost:** at most one more octave per sample, under a millisecond.

### 8. Stages that fade instead of switching (moderate; "holding their shape")

- **Nest wherever the far drawing can be a subset of the near one** (Praun's nesting, §2.7):
  - The crown's far discs shrink inside the near crown's solid core as t rises from 0 to 1. t is smooth across ±20% of px(10) in lodPx. The near clusters draw over them at alpha t (paintKit.js 141–158).
  - The leaves shrink in instead of appearing, as SpeedTree's do (§2.5). Each leaf's size is scaled by its share of the continuous count, so leaf j grows in as n passes j (paintKit.js 164–166).
  - Needles, bark marks, streaks and windows grow in the same way.
- **Where the two drawings are different things**, crossfade over a band in lodPx. Draw both on one sheet each and lay them down at complementary alpha, as the fading figure does already (stepsRing.js 1380–1382) and as Unity's cross fade does (§2.5). These are:
  - the acacia's slab and crown, and the cedar's (px(30));
  - the conifer's small and full (px(7));
  - the palm's fronds (px(70));
  - a building's detail and fine detail (px(14), px(48)).
- **No memory needed.** The band depends only on this frame's view, so no hysteresis and no memory are needed (§2.5).
- **Cost:** a thing inside a band is drawn twice, plus a sheet. With bands of ±20%, perhaps a tenth to a fifth of the trees in a frame sit in one. That is roughly 5–10% of a frame (not measured; see §6).

### 9. Culling that never removes what shows (small; a farther house blinking beside a fir)

- **Hearts per kind** (stepsRing.js 1323), set inside the drawn shape:
  - for firs, spruces, cypresses and poplars, a heart a third as wide as today's ±0.13h, or none;
  - for the broadleaves, today's heart.
- **A column's margin.** A thing is culled only if it is covered with one column to spare on each side (stepsRing.js 1235). The rounding of a column then never decides it.
- **Cost:** a few more things drawn in towns, where the cull removes nine in ten (docs/surfaces.md).

### 10. Haze by true distance (tiny code; changes a still)

- **Things and works.** Haze them by r (stepsRing.js 1321, 1431), as the air does.
- **The ridges.** Haze them per facet by each sample's true distance (stepsRing.js 1714 onward).
- **Still:** the frame's sides grow a little hazier, by up to about a quarter of the distance at a portrait frame's side edges. That is the only way a pan can stop changing colours [est]. Ruby to judge.

### 11. The cut's shape (one line; the largest effect; Ruby's call)

**The three candidates.** Make sheets of all three with the camera moved (tools/review.mjs) and with before and after (tools/compare.mjs).

| Candidate | How it changes the cut (stepsRing.js 1194, 1196, 1210, 1255) | Swim in a turn | On the page |
|---|---|---|---|
| (a) circles about the eye | smax → 1 | none (M3–M4) | on the tilted cameras these looks use, each ridge's ends sit about 0.4 band lower than today's at 40° off the axis and 0.8–0.9 lower at 60°, a little straighter than today; on a level camera it sags slightly; the centre is the same (M2) |
| (b) parabolas focused on the eye | r = 2d/(1 + cos φ) | 90th percentile from 5.0 to 1.5 px per degree at the default tilt; crest detail kept (M4) | flat for a level camera; between today and (a) on a tilted one (M2) |
| (c) straight cuts held at the film's own heading | in a film, the cut's heading is one reference heading, such as the first frame's | none | the still at that heading exactly as now; the ridges slant as the camera turns away, about 0.6 band across a ±20° turn, so it suits short moves |

- **What (a) brings.** With (a), every remaining quantity in the painter can follow the world:
  - the slot by r against d_k, so a thing never changes ridge in a turn;
  - stand, which never makes a thing bob;
  - the ways' and fields' slots (stepsRing.js 1440, 1489).
  - (b) shrinks these effects by the same factor as the swim.
- **What (c) needs.** The Moving Image would have to hand each frame the film's reference heading beside its own (moving.js, uiMoving.js).
- **History.** The earlier research recommended arcs at fixed distances for exactly this reason (docs/prior-art/painted-ringworld.md §3.3). Ruby then asked for straight ridges again (docs/changelog-archive.md, Uranus–Desdemona).
- **What this offers Ruby.** The Painted Ringworld's cameras are tilted up 22° to 58°. On those, M2 finds that a circle's ends sit lower than today's cut, so a circle reads slightly straighter on the page, not more bowed.
  - What does change is which hills each ridge slices off the axis.
  - Ruby should judge (a) and (b) in films, not only stills.
- **Cost:** none.

### 12. Every thing on land that is drawn (optional; only if Ruby wants it)

- **The envelope.** Take each ridge's crest as the highest the land rises, on the page, between its cut and the next farther one, along each sample's bearing: 8 steps, or a maximum map (§2.8).
  - Nothing would then stand above the ridge behind it, so stand would never press anything down.
- **Measured:** this does not reduce the swim (M3).
- **Cost:** about 20 ms a frame.
- **Still:** more peaks show in each band.
- **Recommendation:** worth a sheet, not a default.

### What it costs, together

| Step | Speed | Still |
|---|---|---|
| 1 seeds from the world | none | the mottle and wear re-roll once |
| 2 order by true distance | none | rare order changes off the axis |
| 3 detail by a turn-proof size | none | a stage less, rarely, near the corners |
| 4 a stream per feature | none | a one-time re-roll of some stages |
| 5 bearings in the world | none | facets shift by up to a sample |
| 6a depth from distance | none | band thickness steadier, close to today's average |
| 7 smooth octaves, feet, wall | under 1 ms | barely |
| 8 fades between stages | about +5–10% (estimate) | none at rest outside the bands |
| 9 truer culling | a few more things drawn | none, or things that were wrongly hidden now show |
| 10 haze by distance | none | sides a little hazier |
| 11 the cut's shape | none | off-axis slices differ; (c) none at its heading |
| 12 the envelope (optional) | about 20 ms | more peaks per band |

---

## 5. What this app can do that the others don't [est]

- **Every move is about one eye.** The films only turn, tilt and zoom about a fixed eye, so this renderer can make its picture an exact function of the world and the eye. That is a stronger guarantee than a game, whose camera translates, can get.
- **Stills and films can share their reference.** Option (c) of step 11 keeps a still pixel-identical at its own heading and still gives a film ridges that never move.
- **Everything is keyed already.** The store, the per-thing streams and the world noise behind the facets already exist, so most of §4 is re-keying, not rebuilding.

---

## 6. Gaps

- **Pages that could not be read:**
  - the CDLOD paper's PDF and Unity's LOD transitions manual page were blocked by the fetcher (the CDLOD repository page and Unity 6's LOD Group page were read instead);
  - the ROAM paper was blocked by the site's robots file;
  - Pixar's stochastic simplification and stochastic pruning PDFs redirect away (the SIGGRAPH archive's abstract, Pixar's patent and The Good Dinosaur talk were read instead);
  - MDN's sort page was blocked (v8.dev's was read instead).
- **No source on Voxel Space's own swimming.** The s-macke write-up and a Hacker News thread say nothing about it. Johanson's projected grid is the documented case of the same mechanism.
- **No measured threshold** for how much swim, popping or crossfade a viewer notices. The earlier view research found none either (docs/prior-art/ringworld-life-and-views.md).
- **The measurements' limits** (§3): a copy of the terrain on the wilds, one camera, crests only, not rendered frames.
  - Bands, facets, colours, the things' stage changes and order flips were reasoned from the code, not counted.
  - The fades' cost in step 8 is an estimate, not a timing.
- **An eye that moves.** A move between two looks can ease Altitude, which moves the eye. d0 depends on the altitude (stepsRing.js 1188), so then every ridge's distance slides through the world too. This was not analysed. The fix would be a ladder of distances fixed in the world, with the nearest ridges fading in and out.
- **A panorama for films with the clock stopped.** The land could be painted once into a cylindrical panorama and warped to each frame (QuickTime VR, §2.4). That would be perfectly steady and far cheaper a frame.
  - It needs circle cuts (step 11a).
  - It fails once the clock runs, because the sun, the clouds and the walkers change.
  - A warp of every pixel needs the GPU (webgl.js) or a CPU loop over the frame.
  - Not costed.
- **Side findings: thresholds in raw pixels.** These switch at different sizes in the preview and in the export (AGENTS.md §1 rule 4):
  - pkLobes' rr > 6 (paintKit.js 145);
  - pkGrain's 24 px (paintKit.js 46);
  - pkShade's 2 and 70 px (paintKit.js 37–39).
- **Side finding: size bands.** pkFaceProof keys a building's read-off shape by size in steps of about 9% (paintKit.js 932). A building can step its proportions as its size crosses a band. With step 3 its size would only change in a zoom.
