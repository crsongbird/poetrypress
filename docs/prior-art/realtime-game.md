# Prior Art: From Poetry Surfaces to a Real-Time Ringworld Game

A long-range research brief for forking the poetry-image app (painted Ringworld floor, Idyllic Meadow, Windward Sea, Sunrise Scroll, Liminal Spaces, black hole; lit from height/normal/albedo maps with light and camera dials) into a separate browser game: exploring ringworlds, finding idyllic places, doing quests, with a story Ruby writes. Target: (semi) real time, phone resolution, in a browser, node graph removed and compiled into small fast blocks.

**Key:** [src] = stated in a consulted source, with its URL; [est] = my estimate or derivation (not stated by a source). Where a source is a vendor blog or an uncited secondary site, the text says so.

**Research limits.** Every [src] below was read during this session. The per-turn web-search budget ran out before I could find primary sources for Tunic, Eastward, Wilmot's Warehouse, Genshin's rendering specifics, Okami's exact ink-filter technique and how Halo renders its ring. Those gaps are named where they come up, not filled from memory. A few pages could not be fetched: the Babylon.js snapshot-rendering docs, ink's "RunningYourInk" doc, the Yarn Spinner design deep-dive on Game Developer, and the Team Fortress 2 paper's Princeton mirror (the realtimerendering.com copy was read instead). Ruby can send a follow-up to continue the search.

---

## 1. Web engines and phone rendering, 2025–2026

### 1.1 WebGL2 is the floor; WebGPU is the ceiling

- WebGL 2.0 reached all major browsers when Safari 15 shipped it on macOS and iOS; Apple built it on ANGLE running over Metal (Khronos, Feb 2022) [src](https://www.khronos.org/blog/webgl-2-achieves-pervasive-support-from-all-major-web-browsers).
- Web3D Survey reports WebGL2 support in 98.05% of reports overall, 99.37% on Android and 98.85% on iOS (undated page; share of survey reports, not devices) [src](https://web3dsurvey.com/webgl2).
- WebGPU: Chrome/Edge desktop since 113; **Chrome on Android since 121 for Android 12+ with Qualcomm and ARM GPUs**; Safari 26 on macOS Tahoe 26, **iOS 26**, iPadOS 26 and visionOS 26; Firefox 141 on Windows and 145 on ARM macOS; Firefox on Android "in progress" (web.dev, Nov 2025) [src](https://web.dev/blog/webgpu-supported-major-browsers).
- The gpuweb implementation-status wiki adds: Imagination GPUs need Android 16+ (Chrome 139); Samsung Xclipse "probably 154"; Firefox Android is behind a flag and "Mozilla expects to do work on Android in 2026" [src](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status). Chrome's own 121 post says support "will gradually expand," with Android 11 named as a near-term target [src](https://developer.chrome.com/blog/new-in-webgpu-121).
- **A conflict to note:** an uncited secondary site (abratabia) says Safari iOS got WebGPU in iOS 18.2 and that ~78% of Chrome Android users had WebGPU in Q1 2026 [src](https://abratabia.com/mobile-browser-performance/webgpu-on-mobile.php). The web.dev post and the gpuweb wiki both say iOS 26, so I treat the iOS 18.2 claim as wrong and the 78% as unverified.

**What this means for Ruby's own phone.** The Moto G Stylus 5G (2022) has a Snapdragon 695 with an **Adreno 619** GPU, a 1080×2460 screen (~395 ppi), 4–8 GB RAM, and shipped on Android 12 [src](https://m.gsmarena.com/motorola_moto_g_stylus_5g_(2022)-11462.php). On paper that meets Chrome's Qualcomm + Android 12 rule [src](https://developer.chrome.com/blog/new-in-webgpu-121), but Chrome also blocklists individual drivers, so whether WebGPU actually turns on for it has to be tested on the device [est]. Ruby also tests in Firefox, and **Firefox Android has no WebGPU by default** [src](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status). So the game has to run in full on WebGL2, with WebGPU as an extra [est].

### 1.2 Engines

| Option | What the sources say | Fit for Ruby [est] |
|---|---|---|
| **three.js `WebGLRenderer`** | "still maintained and the recommended choice for pure WebGL 2 applications," but "no plans to add larger new features" [src](https://threejs.org/manual/en/webgpurenderer) | Stable, huge ecosystem, custom `ShaderMaterial` works. The safest base for porting existing GLSL. |
| **three.js `WebGPURenderer` + TSL** | "can automatically fall back to using a WebGL 2 backend"; TSL shader code "can be transpiled to WGSL or GLSL"; but "still in an experimental state," and `ShaderMaterial`/`onBeforeCompile`/`EffectComposer` are not supported [src](https://threejs.org/manual/en/webgpurenderer) | The future path. TSL is itself a node graph written in JS, close to what the Athanor already is. Experimental status is the risk. |
| **Babylon.js** | Forum best practices for low-end devices: `setHardwareScalingLevel()`, `material.freeze()`, thin instances, merging meshes, WebGPU snapshot rendering [src](https://forum.babylonjs.com/t/best-practices-for-optimizing-babylon-js-scenes-not-just-on-lower-end-devices/58688). Snapshot rendering uses WebGPU render bundles for claimed "potentially 10x" CPU-side gains on static geometry (third-party summary) [src](https://app.cinevva.com/news/2024-03-28-babylonjs-7) | Fuller engine than three.js. Heavier, and its own way of doing things. |
| **PlayCanvas** | Low-end mobile target "100-200 draw calls"; DPR can "significantly lower frame rate"; post effects cost fill; shader compilation causes "startup delays and frame rate glitches" [src](https://developer.playcanvas.com/user-manual/optimization/guidelines/). Compute shaders "only supported on the WebGPU platform" [src](https://developer.playcanvas.com/user-manual/graphics/shaders/compute-shaders/) | Good engine; its editor is a desktop web app, which is hard to use on a phone [est]. |
| **Godot 4 web export** | WebGL 2.0 only, through the Compatibility renderer; "Godot currently does not support WebGPU"; C# projects "cannot be exported to the Web"; native mobile exports "will always perform better by a significant margin"; single-threaded export since 4.3 "works very well on macOS and iOS" [src](https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/export/exporting_for_web.rst) | Good editor, but Ruby would be shipping a WASM engine with a WebGL2-only renderer to phones. |
| **Bevy (Rust → wasm)** | WebGPU support landed for 0.11 (May 2023 post); "WebGL2 is still the default backend" for web builds at that time [src](https://bevy.org/news/bevy-webgpu/) | Needs a Rust toolchain. Not workable on a phone-only setup [est]. |

### 1.3 Phone performance budgets

- **Draw calls:** PlayCanvas puts low-end mobile at 100–200 per frame [src](https://developer.playcanvas.com/user-manual/optimization/guidelines/). An uncited secondary site says ~300–500 under WebGL and ~1000–2000 under WebGPU on the same phone [src](https://abratabia.com/mobile-browser-performance/webgpu-on-mobile.php). Godot's docs say driver overhead per draw call is "quite costly, especially in OpenGL, OpenGL ES and WebGL" [src](https://docs.godotengine.org/fr/4.5/_sources/tutorials/performance/gpu_optimization.rst.txt).
- **Fill rate:** On mobile "fill rate is very expensive"; transparency is "particularly bad for fill rate"; post-processing and shadows cost fragment work [src](https://docs.godotengine.org/fr/4.5/_sources/tutorials/performance/gpu_optimization.rst.txt). Mobile GPUs are tilers, where "memory bandwidth is often the most significant performance factor," overdraw is cheaper than on desktop GPUs (but not free), and MSAA is "particularly efficient" [src](https://docs.vulkan.org/guide/latest/tile_based_rendering_best_practices.html).
- **Thermal throttling:** Netmarble's Android case study (vendor-reported) saw FPS swing "from 40 to 56" from heat. **Resolution scaling** "had the most significant impact on GPU load and thermal output." Their adaptive frame rate stepped down from 60 to a floor of 30 [src](https://developer.android.com/stories/games/netmarble-got-adpf). An uncited secondary site says flagships hold peak clocks for 2–5 minutes, budget phones throttle within 60–90 s, sustained GPU performance is 40–70% of peak, and iOS does not expose thermal state to web pages [src](https://abratabia.com/mobile-browser-performance/battery-and-thermal.php). Treat those figures as plausible but unverified.
- **Memory:** Unity developers report iOS Safari reloading the tab with no error when WebGL memory grows (256 → 300–500 MB), and one reports ~512 MB as a practical ceiling on 4 GB iPhones [src](https://discussions.unity.com/t/webgl-memory-increment-issue-and-crash-on-ios/894771). GPU-compressed textures help. three.js `KTX2Loader` transcodes Basis Universal into whatever compressed format the device supports [src](https://threejs.org/docs/pages/KTX2Loader.html).
- **A working budget for Ruby's phone** [est]: render internally at about 0.5× the screen's pixel ratio (≈540×1230, about 0.66 MP against 2.66 MP native), cap at 30 fps by design, stay under ~100 draw calls, use one full-screen post pass (two at most), keep transparent layers few and small, and stay under ~250 MB of GPU memory. Measure after 10+ minutes of play, not in the first minute.

---

## 2. How stylized games get their look, and what survives on a phone

### 2.1 What the sources say

- **Okami.** Clover first used a photorealistic engine whose PS2 performance "was not great." A brush drawing of the wolf by Kenichiro Yoshimura led to the sumi-e/ukiyo-e direction, which "also resolved the performance problems." The PS2 version applied a paper-parchment filter to everything on screen [src](https://en.wikipedia.org/wiki/%C5%8Ckami). *Lesson: the style was chosen partly because it was cheap.* (I did not find a primary technical source for its ink outlines.)
- **The Wind Waker.** A Polycount breakdown concludes that shading is "done entirely in the shader and not with light sources." Static shadows are baked through geometry cuts with vertex colours or a two-level bitmap. Stars are "just a bunch of additive quads" [src](https://polycount.com/discussion/comment/1634442). For the HD remake, Takizawa says they "used practically the same shader" with improved lighting [src](https://iwataasks.nintendo.com/interviews/wiiu/wind-waker/0/3). Takizawa says the cel style made puzzle mechanisms easier to read [src](https://en.wikipedia.org/wiki/Cel_shading). gordonnl's analysis series rebuilds Wind Waker's ocean and fire effects in three.js [src](https://medium.com/@gordonnl/wind-waker-graphics-analysis-a0b575a31127).
- **Breath of the Wild.** Takizawa's team made "a painterly art style that combined the realism of the game world with its playability" [src](https://nintendoeverything.com/art-director-on-why-zeldas-art-style-constantly-changes-and-how-breath-of-the-wilds-look-was-made/).
- **Sable (Moebius style).** Built in layers: flat shading, then lighting, fog, lines, and outlines that fade with distance. **Fog "had the largest overall impact"** on readability. Fading lines stopped objects that "would just pop in" [src](https://www.gamedeveloper.com/marketing/how-shedworks-refined-the-art-of-sable-in-pursuit-of-readability). The goal was something that "looks like a line drawing in screenshots but reads as a 3D environment in movement" [src](https://shacknews.com/article/139488/sable-shedworks-fis-games-conference-interview). Unity's case study adds low-poly models, hand-drawn textures and VFX made on iPads, a noise shader for rocks, MapMagic for terrain and ProBuilder for ~80% of environments [src](https://unity.com/resources/shedworks-sable-modular-design-approach).
- **A web Moebius recreation.** Maxime Heckel runs Sobel filters on depth and normal buffers, uses luminance-threshold crosshatching built from `mod()` and white-dot specular, all in one custom pass in three.js/React Three Fiber. The scene is rendered three times (colour, depth, normals) [src](https://blog.maximeheckel.com/posts/moebius-style-post-processing).
- **Team Fortress 2 (the source of the toon ramp).** Half-Lambert (×0.5 + 0.5) indexes an artist-painted **1D warp texture** that tightens the terminator and pushes shadows "to cool, not black." It adds Fresnel-masked rim lights and an ambient cube, inspired by Leyendecker's preference for rim highlights over dark outlines [src](https://www.advances.realtimerendering.com/s2007/Mitchell-IllustrativeRenderingInTF2(Siggraph07%20Course%20Notes).pdf).
- **Journey.** thatgamecompany spent three years "continually refining (and rewriting)" its sand [src](https://gdcvault.com/play/1017742/Sand-Rendering-in). Alan Zucconi's breakdown of John Edwards's talk separates it into cheap terms: diffuse contrast, grain normals, ripple textures blended triplanar-style, Fresnel rim, Blinn-Phong "ocean specular," and glitter [src](https://www.alanzucconi.com/2019/10/08/journey-sand-shader-1/).
- **Genshin Impact.** All I could confirm is a GDC 2021 art-direction talk by Haoyu Cai on its anime style and pipeline. The listing says nothing about rendering [src](https://www.gdconf.com/news/learn-about-making-genshin-impacts-open-world-gdc-2021). **Gap.**
- **Hades.** Supergiant moved from a planned painterly look to **pen and ink because it was faster to produce** at its scale. 3D was modelled in Maya and post-processed in After Effects. It shipped with 1,400 environment textures and 942,489 character animation frames [src](https://mcvuk.com/?p=216051).
- **Gris.** Its watercolour look "imitates how watercolor pools on paper," with colour spilling past lines. Art by Conrad Roset; it was Nomada's first game [src](https://www.thisiscolossal.com/2018/09/gris-video-game-by-nomada-studio/).
- **Kentucky Route Zero.** Cardboard Computer came from artware and live audio/video work. They used "always-moving-forward conversations" rather than hub-and-spoke dialogue [src](https://funambulism.com/2013/07/23/interview-cardboard-computer-on-kentucky-route-zero/). Two developers, Jake Elliott and Tamas Kemenczy [src](https://history.siggraph.org/?p=23050).
- **Hi-Fi Rush** (a modern reference). A deferred toon renderer built into UE4 post-process volumes, used "for the entire game, both characters and environment" [src](https://80.lv/articles/the-making-of-hi-fi-rush-s-3d-toon-rendering-style).
- **Tunic, Eastward.** No primary rendering sources found before the search budget ran out. **Gap.** As a nearby reference, normal-mapped pixel-art sprites lit dynamically, with hand-painted normal maps, are documented [src](https://80.lv/articles/exploring-next-gen-pixel-art-with-real-time-dynamic-lighting), as is a normal-mapped-sprite pipeline from Dan Moran [src](https://80.lv/articles/case-study-dead-cells-character-art-pipeline/).
- **A Short Hike.** Rendered with "as few pixels as possible": flat shading, no anti-aliasing, a soft outline for readability, and a pixel size the player can change [src](https://blog.playstation.com/2021/08/05/crafting-a-tiny-open-world-a-look-behind-the-scenes-at-the-creation-of-a-short-hike/).
- **Painterly filters.** The anisotropic Kuwahara filter (Kyprianidis, Kang, Döllner 2009) flattens along local feature direction for an oil-paint look, and "the GPU implementation of our method processes video in real-time" on 2009 desktop hardware [src](https://diglib.eg.org/handle/10.2312/CGF.v28i7pp1955-1963). Meier's 1996 painterly rendering keeps brush strokes coherent over time by attaching 3D particles to surfaces and drawing them as 2D strokes in screen space [src](https://history.siggraph.org/?p=117028).
- **Cel-shading basics.** Lighting is quantized to a few shades; outlines come from inverted back-face hulls or from a Sobel filter on depth and normals [src](https://en.wikipedia.org/wiki/Cel_shading).

### 2.2 What translates to a phone browser

| Technique | Phone cost [est] | Verdict for Ruby [est] |
|---|---|---|
| 1D toon/warp ramp (TF2) | One texture fetch per pixel | **Yes.** A painted ramp per biome is the "light dial" turned into an art asset. |
| Distance fog and atmospheric haze (Sable) | A few ALU ops | **Yes.** It's the biggest win for readability, and it hides streaming. |
| Baked shadows and vertex colour (Wind Waker) | Free at runtime | **Yes** for static scenery. |
| Painted or analytic sky (Halo matte, §3) | One full-screen pass, or done in the clear pass | **Yes.** |
| Low internal resolution + upscale (A Short Hike) | Cuts fragment cost roughly in proportion | **Yes.** It's also the main thermal lever [src](https://developer.android.com/stories/games/netmarble-got-adpf). |
| Sobel outlines from depth/normals (Moebius) | One full-screen pass plus a normal target (WebGL2 MRT) | **Yes, at reduced resolution**, with distance fade. |
| Inverted-hull outlines | Draws each outlined mesh twice | Use sparingly (characters only), because it eats into the draw-call budget. |
| Anisotropic Kuwahara | A structure tensor plus many taps per pixel | **Bake it** into the textures or apply it at ½–¼ resolution. Not full screen at native resolution. |
| Screen-space brush particles (Meier) | Alpha-blended overdraw | Only small and few: transparency is the fill-rate killer on mobile [src](https://docs.godotengine.org/fr/4.5/_sources/tutorials/performance/gpu_optimization.rst.txt). |
| Journey-style stack of cheap terms | Several cheap ALU terms | **Yes.** It's the model for turning one of Ruby's node graphs into a short shader. |

---

## 3. Ringworlds and megastructures

- **Niven's Ringworld.** About 186 million miles (299 million km) across and about one million miles (1.6 million km) wide. It spins to give 99% of Earth's gravity, has an inner ring of shadow squares joined by wire, and its area equals about three million Earths. The "Ringworld is unstable!" criticism led to *The Ringworld Engineers* [src](https://en.wikipedia.org/wiki/Ringworld).
- **Seen from the floor.** At night the rest of the ring shows overhead as "a giant arch," with lit and dark bands matching each region's day and night. The floor looks flat with no horizon, and distance disappears into haze. The sun never sets; shadow squares cut it off. Rim walls ~1,000 miles (1,600 km) high would hold the air. It turns about once every 9 days [src](https://www.h2g2.com/approved_entry/A87815604).
- **Halo.** Its ring overhead is described as non-interactive sky art, with early skyboxes being "basically fancy matte paintings," the original Halo's ring among them [src](https://finalboss.io/everyone-s-chasing-photoreal-skies-but-i-miss). Craig Mullins was a matte and concept artist on *Halo: Combat Evolved* [src](https://www.halopedia.org/Craig_Mullins). Halo Infinite's time-of-day system is "one of, if not THE largest graphical feature" in its engine, and fragments of the ring float in its sky [src](https://www.halowaypoint.com/news/inside-infinite-february-2021). **Gap:** I found no primary source on how Halo builds its ring geometry.
- **Curved worlds.** Unity's "Curved World" asset bends meshes only "inside camera during rendering," leaving the editor's world flat [src](https://discussions.unity.com/t/curved-world/591290). For a Niven-scale ring this isn't needed, because local curvature is negligible [est].
- **Distant objects.** A three.js forum demo renders 3072×3072 terrain with 200k trees: BatchedMesh with LOD, InstancedMesh2 with BVH culling, simplified meshes out to 100 units, and **octahedral impostors** beyond that. The author says it "should work quite good on mobile" but gives no benchmarks [src](https://discourse.threejs.org/t/a-forest-of-octahedral-impostors/85735).

**Derived geometry for Ruby's arch** [est]. With radius R ≈ 1.5×10⁸ km (half the 299 M km diameter) and width W ≈ 1.6×10⁶ km, the far side of the ring is ~3×10⁸ km away at the zenith. The arch there spans W/2R ≈ 0.0053 rad ≈ **0.31°, thinner than the ~0.5° sun**. It widens toward the spinward and antispinward horizons, where the ring is closer. So the arch should be drawn **analytically in the sky shader**, not as geometry. For each pixel's view ray, intersect a cylinder of radius R from a point on its inner surface. If the hit's axial coordinate is within ±W/2, shade it as ring: albedo by longitude, darkened where a shadow square covers it (a 1D texture or a step function of longitude and time), with haze and in-scattering by distance. That's one ray–cylinder solve per sky pixel, which is cheap. The walkable ground is ordinary flat chunked terrain whose far edge fades into haze. Ruby's existing "painted Ringworld seen from its floor" surface is already a still of exactly this, so it ports directly [est]. A smaller, Halo-sized ring would need visible upward curvature of the ground, which a vertex-shader bend of the Curved World kind provides [est].

---

## 4. Turning offline procedural textures into real time

- **Bake what doesn't move.** Unreal's noise write-up: "most of the noise options are significantly slower than a simple texture lookup." Voronoi costs ~160–640 instructions per octave against ~100 for "a typical material." Six octaves at top quality is "around 30x as expensive." Recommendation: bake the expensive noise into textures [src](https://www.unrealengine.com/en-US/tech-blog/getting-the-most-out-of-noise-in-ue4).
- **Ship baked results compressed.** Basis Universal "can be quickly transcoded to a wide variety of GPU texture compression formats" [src](https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/libs/basis/README.md), through `KTX2Loader` [src](https://threejs.org/docs/pages/KTX2Loader.html). One caveat: Godot notes many Android devices don't support compressing textures that have transparency [src](https://docs.godotengine.org/fr/4.5/_sources/tutorials/performance/gpu_optimization.rst.txt).
- **Signed distance fields and raymarching.** Inigo Quilez's heightfield marching steps a ray against y=f(x,z), growing the step with distance. His brute-force version "was very slow," and normals and shadows each add more marches. It's "perfect for small size demos" [src](https://iquilezles.org/articles/terrainmarching). SDF primitives are catalogued at [src](https://iquilezles.org/articles/distfunctions). *For phones:* raymarch only small regions (sky, the arch, one hero object, the black hole's lensing) at low resolution, and never the whole walkable world [est].
- **GPU compute (WebGPU only).** Compute shaders are "only supported on the WebGPU platform" [src](https://developer.playcanvas.com/user-manual/graphics/shaders/compute-shaders/). Codrops' *False Earth* (Apr 2026) moved from WebGL GPGPU ("encoding data as pixels and juggling" framebuffers) to WebGPU storage buffers. Its compute-driven indirect draws cull about 80% of instances before the vertex shader, its grass uses three LOD tiers (15/5/2 segments at 0–5/5–20/20 m+) and it renders "over a million grass blades" in three.js TSL. It also warns that "on some mobile GPUs, compilation can stall," which they handle with a queued async compile [src](https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/).
- **Chunked terrain LOD.** CDLOD (2010) renders heightmap terrain from a quadtree of regular grids, picks LOD by true 3D distance, and transitions between levels smoothly [src](https://github.com/fstrugar/CDLOD). It works in WebGL2 with vertex-texture-fetch heightmaps [est].
- **Compile hitches.** Shader compilation causes "startup delays and frame rate glitches." Materials that differ by a single map still generate separate shaders [src](https://developer.playcanvas.com/user-manual/optimization/guidelines/).

**How Ruby's node graph becomes "small fast blocks"** [est]:
1. **Classify each node's output** as *static* (depends only on the seed: bake it), *slow* (depends on the light dial or time of day: re-bake into a texture now and then, spread over frames), or *live* (depends on per-pixel view or animation: compile into the shader).
2. **Compile live subgraphs to code** by walking the graph and emitting one GLSL function per surface. Constants get folded and dead branches removed, the way TSL turns a JS node graph into GLSL or WGSL [src](https://threejs.org/manual/en/webgpurenderer). Each block then costs about as much as a hand-written shader.
3. **Keep the app's lighting model as the game's lighting model.** The app already lights surfaces from height, normal and albedo maps. A real-time 3D scene writes the same three things into a G-buffer (WebGL2 multiple render targets), and the app's existing light-and-composite pass runs on it. The "painterly" pass then sits after lighting, so every scene shares one look [est].

---

## 5. Small-team, story-driven exploration games

### 5.1 Scope and structure

- **A Short Hike.** Mostly one person (Adam Robinson-Yu); music by Mark Sparling. A "tiny open world" that rewards players who don't take the obvious path, with fishing, boating and volleyball off the main route. The dialogue was written in an improvised, texting-a-friend voice [src](https://blog.playstation.com/2021/08/05/crafting-a-tiny-open-world-a-look-behind-the-scenes-at-the-creation-of-a-short-hike/). It grew from a prototype made while "a major project" was put on the back burner [src](https://gamedeveloper.com/design/video-a-postmortem-look-at-the-making-of-i-a-short-hike-i-). It used Yarn Spinner [src](https://yarnspinner.dev/timeline/).
- **Sable.** Two core developers, Fineberg and Kythreotis, plus writer Meg Jayanth. Started in 2017, released Sept 2021 after two delays, built in Unity [src](https://en.wikipedia.org/wiki/Sable_(video_game)). Unity's case study says six full-time staff and four part-time contractors at its peak, a modular "lemon-shaped" story (fixed start and end, standalone middle parts), Gameflow visual scripting plus a custom trigger system, and collectibles that are reusable costume modules [src](https://unity.com/resources/shedworks-sable-modular-design-approach). "Multiple planned quests … had to be cut weeks before release," and the team went three years without a holiday [src](https://shacknews.com/article/139488/sable-shedworks-fis-games-conference-interview).
- **Outer Wilds.** Talks cover a design driven by curiosity, with no missions [src](https://gdcvault.com/play/1027008/Independent-Games-Summit-Sparking-Curiosity), and "4D level design" that controls "the pacing and delivery of narrative information within a large-scale physics simulation" [src](https://gdconf.com/news/see-4d-level-design-outer-wilds-deconstructed-gdc-2020). The full talks are members-only, so I can't cite specifics of the ship log.
- **Wilmot's Warehouse.** **Gap**: I found no source before the search budget ran out.

### 5.2 World state and quests

- **Facts and rules.** Valve's dynamic-dialogue system (Ruskin, GDC 2012) matches lines against a "continually changing world state" and, like Inform, "applies the most specific one it can find, using less-specific ones as fall-backs" [src](https://emshort.blog/2012/03/16/gdc-2012-talk-on-dynamic-dialogue/). This fits ambient barks and "what does this NPC say right now."
- **A recommended shape for Ruby** [est]:
  - **World facts:** a flat key→value store (`met_lamplighter: true`, `meadow_found: 3`, `ring_hour: 14.2`). It is the single source of truth and is saved as JSON.
  - **Quests as data:** each quest is a small state machine, `{id, states: {unknown → offered → active → done/failed}, transitions: [{when: <fact predicate>, to, sets: {...}}]}`, checked whenever a fact changes. No per-quest code.
  - **Places:** each idyllic area is a record (seed, surface preset, biome ramp, fog, discovery condition) built from the same JSON presets the poetry app already imports and exports.
  - **Narrative:** ink holds the words and branching. It reads and writes world facts through external functions and variable sync, so the quest machine and the script never disagree.

### 5.3 Writing tools for the web

- **ink / inkjs.** inkjs is "a javascript port of inkle's ink," "fully compatible with the original," with "zero dependency," MIT licence [src](https://www.npmjs.com/package/inkjs). It has `story.Continue()` and `currentChoices`, `EvaluateFunction`, and a **compiler that runs in the browser** (`inkjs/full`, `new inkjs.Compiler(...).Compile()`) [src](https://cdn.jsdelivr.net/npm/inkjs@2.4.0/README.md). Saving uses `state.ToJson()` and restoring uses `state.LoadJson()` [src](https://videlais.com/tag/ink/). ink itself is MIT-licensed and ships Unity plugins [src](https://en.wikipedia.org/wiki/Inkle_(company)).
- **Yarn Spinner.** Used by Night in the Woods, A Short Hike and DREDGE, among others [src](https://yarnspinner.dev/timeline/). The web runtimes are community projects. YarnBound wraps a fork of bondage.js and targets the **Yarn 2.0** spec [src](https://npmjs.com/package/yarn-bound), so it lags the current official version (Yarn Spinner 3 docs mention only Unity) [src](https://yarnspinner.dev/docs/readme/02-ys3/).
- **Twine.** A story format "is the engine." Twine publishes a single HTML file with the format bundled in. The formats are Harlowe, Snowman, SugarCube and Chapbook [src](https://twinery.org/cookbook/starting/twine2/storyformat.html). It's good for sketching branching on a phone, but it's a whole presentation engine rather than a narrative layer to embed in a game [est].
- **Kentucky Route Zero's forward-moving conversations** [src](https://funambulism.com/2013/07/23/interview-cardboard-computer-on-kentucky-route-zero/) suit ink, whose default flow is a sequence of knots and diverts [est].

**Why ink fits Ruby** [est]: it compiles inside the browser, so Ruby can write `.ink` on her phone and the game can compile it live, with no PC needed. It's a plain-text markup language, close in spirit to her PML. Its save state is plain JSON, which sits next to the world-fact JSON.

---

## 6. Synthesis: architecture options

| Path | For | Against |
|---|---|---|
| **A. three.js `WebGLRenderer` + custom GLSL** | Stable; WebGL2 everywhere including Firefox Android; existing GLSL ports straight over [src](https://threejs.org/manual/en/webgpurenderer) | No compute; three.js says no big new features are coming |
| **B. three.js `WebGPURenderer` + TSL, with automatic WebGL2 fallback** | One shader source for both backends; node-based like the Athanor; compute where available [src](https://threejs.org/manual/en/webgpurenderer) | "Experimental"; `ShaderMaterial` and `EffectComposer` unsupported; compile stalls on some mobile GPUs [src](https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/) |
| **C. Custom WebGL2 renderer** | Smallest and fastest for a fixed look; no engine to learn | Ruby writes the culling, loading, input and audio herself |
| **D. Godot web export** | Real editor, scene tools | WebGL2 only, WASM payload, Safari WebGL2 issues, worse than native on mobile [src](https://raw.githubusercontent.com/godotengine/godot-docs/master/tutorials/export/exporting_for_web.rst); a phone-only workflow is untested here [est] |

My estimate: **A now, written so it can move to B later.** Keep each compiled surface as a plain function in one place, so it can be re-emitted as TSL when WebGPURenderer matures and Firefox Android ships WebGPU [est].

---

## Recommendations

**R1. Make WebGL2 at 30 fps on the Moto G Stylus the definition of "done."** That phone (Adreno 619, Android 12) [src](https://m.gsmarena.com/motorola_moto_g_stylus_5g_(2022)-11462.php) plus Firefox Android (no WebGPU) [src](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status) is the worst realistic case. Add a WebGPU path only as an enhancement [est].

**R2. Stage 0: one scene, real time, no gameplay** [est]. Port the **Idyllic Meadow** first. Poppies are instanced and forgiving, and the scene shows wind, light and fog. Steps:
- Bake the static node outputs (ground albedo, normal, height) to KTX2 [src](https://www.unrealengine.com/en-US/tech-blog/getting-the-most-out-of-noise-in-ue4), [src](https://threejs.org/docs/pages/KTX2Loader.html).
- Instance the poppies.
- Write height, normal and albedo into a WebGL2 G-buffer and run the app's own light-dial lighting on it.
- Add one painted 1D ramp [src](https://www.advances.realtimerendering.com/s2007/Mitchell-IllustrativeRenderingInTF2(Siggraph07%20Course%20Notes).pdf) and distance fog [src](https://www.gamedeveloper.com/marketing/how-shedworks-refined-the-art-of-sable-in-pursuit-of-readability).
- Render at ~0.5 DPR [src](https://developer.android.com/stories/games/netmarble-got-adpf).
- Show an FPS and frame-time overlay and leave it running for 15 minutes.

Success means the still image and the live scene look like the same artwork.

**R3. Stage 1: the Ringworld floor walk** [est]. Analytic arch-and-shadow-square sky (§3), flat CDLOD-style terrain chunks [src](https://github.com/fstrugar/CDLOD), haze that hides the chunk edge, touch joystick and camera, and the camera dial reused as camera framing. Add Sobel outlines at reduced resolution with Sable-style distance fade [src](https://blog.maximeheckel.com/posts/moebius-style-post-processing).

**R4. Stage 2: one quest, one conversation, one save** [est]. A world-fact store, one quest as a data state machine, and one ink conversation that reads and writes facts. Save `{facts, inkState: story.state.ToJson()}` [src](https://videlais.com/tag/ink/). Ruby writes the ink on her phone and the game compiles it with `inkjs/full` [src](https://cdn.jsdelivr.net/npm/inkjs@2.4.0/README.md).

**R5. Stage 3: the graph compiler** [est]. Turn the Athanor into an offline compiler. Static nodes get baked, slow nodes go to texture updates spread over frames, live nodes become one GLSL function per surface. Expect each port to look like Journey's sand: a short stack of cheap terms rather than the full graph [src](https://www.alanzucconi.com/2019/10/08/journey-sand-shader-1/).

**R6. Stage 4: the world** [est]. Multiple ring segments streamed by chunk, idyllic areas as JSON place records, impostors for distant landmarks [src](https://discourse.threejs.org/t/a-forest-of-octahedral-impostors/85735), and a WebGPU compute path for dense grass or particles on devices that have it [src](https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/). Save the expensive scenes for last: Liminal Spaces' ray-cast rooms and the black hole are raymarching-heavy [src](https://iquilezles.org/articles/terrainmarching). Ship them as low-resolution "shrines" or as baked panoramas.

**R7. Choose the style so it's cheap, as Okami and Hades did** [src](https://en.wikipedia.org/wiki/%C5%8Ckami), [src](https://mcvuk.com/?p=216051). Use flat or ramp shading, fog, lines, painted skies and baked Kuwahara-like brushwork in the textures. Use full-screen painterly filters only at reduced resolution, or not at all.

**R8. The honest risks** [est unless linked]:
- **Scope.** Two-person Sable took ~4 years and still cut quests weeks before launch [src](https://en.wikipedia.org/wiki/Sable_(video_game)), [src](https://shacknews.com/article/139488/sable-shedworks-fis-games-conference-interview). Plan a game the size of A Short Hike first: one ring segment, 3–5 idyllic areas, 5–10 quests.
- **Phone-only development.** No Blender or desktop editor. This pushes toward code- and preset-authored geometry, which is actually Ruby's strength, but debugging GPU problems without desktop tools will be slow.
- **Thermals and memory.** Expect performance to drop after minutes of play [src](https://developer.android.com/stories/games/netmarble-got-adpf), and expect iOS Safari to silently reload the tab when memory runs high [src](https://discussions.unity.com/t/webgl-memory-increment-issue-and-crash-on-ios/894771). Adaptive resolution and a hard memory budget belong in Stage 0, not later.
- **Platform churn.** three.js's WebGPU renderer is still "experimental" [src](https://threejs.org/manual/en/webgpurenderer). Firefox Android WebGPU is a 2026 *expectation*, not a date [src](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status).
- **Art and readability.** Flat styles struggle to show depth. Sable needed lighting, fog, lines and fade to fix it [src](https://www.gamedeveloper.com/marketing/how-shedworks-refined-the-art-of-sable-in-pursuit-of-readability). Ruby's surfaces were built as still images, and motion will expose problems a still hides.
- **Writing volume.** A story-led game needs far more text than poems do. ink keeps it in plain files that can be versioned, but the hours are real.
- **Saves.** Browser storage can be cleared by the user or the browser. Offer save export and import as JSON, which matches how the app already moves presets.

**R9. Keep the fork clean** [est]. Pull the lighting model, presets and PML-adjacent text tools into a shared module both apps import. The poetry app stays the "art bench" where scenes are designed, and the game consumes its compiled output.
