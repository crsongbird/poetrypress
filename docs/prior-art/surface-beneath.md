# Surface Beneath Prior Art: glass, water, lenses and gravity that take what lies under them

**Why this file exists.** Ruby (2026-10-24): "textures that have displacement (glass/crystal, etc) or distortion using
the lighting system or that could theoretically take the surface under them (as two surfaces), I think they should
take the texture below as an input and do something creative with it."

**Key:** [src](URL) stated in a source read this session (all listed under Sources). [est] my own reading, design or
estimate; where it rests on a source it says "from src". Numbers I measured this session say "measured". Repo facts
are read from the code and docs named beside them.

---

## 0. What the app does today (read from the code)

**Two Surfaces is a blend, nothing more.** canvasRenderer.js draws the lower layer, then the upper (drawSurfaceLayer,
called for the base slot, then the main one). Each layer's texture is asked of the worker on its own, from its own
settings; the upper never sees the lower. It is laid on with a canvas blend, or one of the six blends mixed per pixel
by boxBlend (boxFx.js), and that is all. docs/surfaces.md says it outright, under Under Glass: "Two Surfaces is a
blend: no bending." uiLayers.js holds the two layers' controls (one set shows either layer; Swap trades them whole),
and test/textureLayers.test.mjs tests the controls, the swap, the locks, the lights and every blend. It tests no
bending, because there is none.

**What already reads what lies beneath** (the prior art inside the repo):
- **The inset box's glass** (boxGlass, boxFx.js): the page as drawn so far, cropped to the box, seen through frost
  (scattered, then blurred in two Gaussian passes, then lifted and grained), a lens (magnified toward the middle, the
  colors parted at the rim), reeded glass (each flute refracting its strip), a mosaic, an emboss or a prism (red and
  blue split). It runs on WebGL2 through webgl.js when there is a GPU, and a smaller CPU path otherwise. PML's /glass
  letters reuse it. This is a grab pass already (section 3.1), shaped as a rectangle.
- **The page kept as it is:** /cut letters keep the page under the surfaces (UNDER_CANVAS), and Cut Out by Text keeps
  it before the first surface that cuts (CUT_CANVAS), both in canvasRenderer.js. The "back buffer" a refraction needs
  is already captured twice.
- **The backdrop's colors only** (pageEnv in textureGenerators.js): Rain on Glass, Circuit Board, Cartomancy and
  Floral Imprints are told the page's backdrop colors. Rain on Glass (genGlassRain, texTouch.js) invents an outdoors
  from them (a sky, a skyline, far lights), and every drop shows it upside down, its R, G and B bent a little apart.
  It shows that invented outdoors, not the surface beneath.
- **In the Athanor, by hand:** Texture from the Menu (steps.js) wired into the Glass Pane's Picture (stepsTouch.js;
  the starter A Picture Under Glass) or the Glass Shards' Picture (stepsGenerative.js; A Dropped Frame), Displace and
  Lookup (stepsPatterns.js, after Filter Forge's Refraction and Lookup), Chromatic Offset and Kaleidoscope (steps.js),
  Lens Blur (stepsLens.js), Crystal Druse's Inside and Stained Glass's Scene (stepsTouch.js), and Page Backdrop.
- **Planned:** ROADMAP.md F7 Refraction; docs/renderer-pass.md R0.9 Refraction ("Displace a picture by a normal map,
  with a small chromatic split") and R1.3, water and glass.

So the gap is the one Ruby names: a menu surface can't see the surface under it, and in a graph it can only see a
texture made inside the same graph.

## 1. The candidates in this app, and what each could do with what lies beneath

Ids are the keys of TEXTURE_CAPS (textureGenerators.js); names are the menu's (strings.js, index.html). "Beneath"
means the page as drawn before this layer: the backdrop, and the lower surface when this is the upper.

| Surface (id) | What it is now (code) | What it could do with the beneath [est] |
|---|---|---|
| Rain on Glass (glassrain) | simulated drops as heights, lit; each drop shows an invented outdoors upside down; fog between | each drop an upside-down miniature of the beneath; the fog a blur of it; the runners' wiped trails clear |
| Black Hole (blackhole) | ray-traced; the sky "sampled at full size through the lens map" (docs/surfaces.md) | the beneath is its sky: an Einstein ring and a second image of the lower surface round the shadow |
| Stained Glass (stainedglass) | Panes into the Stained Glass part; Glass Texture from cathedral to hammered, seedy, opal; a Scene input | each pane tints the beneath by its glass, hammered panes shift it, opal panes frost it; the lead stays dark |
| Scrying Pool (water) | waves refract its own floor (koi, stones, a well) more the deeper it lies; caustics; tipped, the sky mirrored | the beneath as the pool's floor, bent by the waves, netted with caustics, mirrored toward the horizon |
| Facet Field (tessellate) | a Voronoi of flat facets, each tilted its own way, lit | each facet a prism showing the beneath shifted its own way: a mosaic of offset copies |
| Crystal Leaf (crystal) | Crystal Druse's maps (albedo, height, normals, gloss, veil, fire), lit | the beneath as what lies inside the stone, bent by each face's normal, split into colors by the fire |
| Under Glass (underglass) | Glass Pane over mid-grey; its waves and shards bend a Picture in a graph only | old glass's waviness and each broken piece bend the beneath |
| Broken Glass (brokenglass) | Glass Shards over mid-grey; each shard bends a Picture by its tilt in a graph only | shards lying on the beneath, each bending what it lies on, their edges split in color |
| Dewy Webs (dewwebs) | silk and dew screened on mid-grey; each drop "a lens": a point of light and a crescent | each bead a ball lens holding the beneath upside down |
| Hoarfrost (frost) | frost ferns grown across a pane, a matte rime toward the edges, lit | the beneath blurred under the rime, clearer between the ferns |
| Pool Caustics (caustics) | a light net on mid-grey, to lay over a page | the beneath read as clear glass, and the caustic that glass would cast |
| Rain on Water (rainwater) | ripples displace a tint of the sky; lit | the beneath seen under the water overhead, mirrored on it toward the horizon, broken by the rings |
| Fractured Glaze (crackle), Kintsugi (kintsugi) | crackle and gold seams over a glaze, lit | the beneath crazed like an old varnished painting; broken and mended in gold, each piece shifted |
| Poured Wax (wax) | pools lit with Translucency (the Light Engine) | the beneath sealed in wax: clear where thin, clouded and tinted where thick |
| Burning Mana, the Sparkler (embers) | Particles: sparks flung and bent by gravity | heat haze over the burst, a shimmer in the beneath |
| Drapery (drapery) | a simulated cloth lit from its maps; light through its gaps | a sheer: the beneath through the weave, shifted by the folds |
| Dream Bloom (bokeh) | motes blurred by a thin lens's circle of confusion | the beneath out of focus, its brightest points opening into aperture discs |

The Light Engine (stepsLight.js; docs/light.md) already takes a Normal Map, a Height and a Translucency map. Normals
are exactly what a screen-space refraction offsets by (section 3.1), and Translucency is how much comes through
(docs/prior-art/lit-maps.md). So every surface lit from maps already carries most of what it needs to bend the page.

## 2. How the real things change what is seen through them

**Refraction.** At a boundary n1 sin θ1 = n2 sin θ2 [src](https://en.wikipedia.org/wiki/Total_internal_reflection).
Water's index is 1.333 and diamond's 2.42; the higher the index, the more the ray bends
[src](https://blog.maximeheckel.com/posts/refraction-dispersion-and-other-shader-light-effects/). Common glass is about
1.50 [src](https://en.wikipedia.org/wiki/Total_internal_reflection), textured window glass 1.5 to 1.6
[src](https://homes.cs.washington.edu/~yoshi/papers/obscure_glass_eccv10.pdf).
- What it does to a flat page seen from straight above [est from src]: a facet tilted by t bends the eye's ray by
  t − asin(sin t / n), turning it toward the facet's high side, so the beneath shows displaced that way by the glass's
  thickness times the tangent of that angle. For n = 1.5: 10.5° at a tilt of 30°, 16.9° at 45°. A uniform tilt per
  facet means a uniform shift per facet: one copy of the beneath per facet.

**Total internal reflection.** Past the critical angle, arcsin(n2/n1), light is reflected whole: about 48.6° for water
to air, 41.8° for glass, 24.5° for diamond [src](https://en.wikipedia.org/wiki/Total_internal_reflection). The water's
surface seen obliquely from below "appears mirror-like, reflecting objects below" (Snell's window); a brilliant cut
uses it on the back facets, diamond's small angle making it work over a wide range of views
[src](https://en.wikipedia.org/wiki/Total_internal_reflection).
- So [est from src]: where the ray inside a stone meets a face steeper than the critical angle, that face shows no
  beneath at all, only the stone's own mirrored inside. That is what makes a cut stone flash and not merely tint. It
  happens on faces met from inside (a brilliant's back facets, the far faces of a crystal's points), not on a face the
  eye's ray enters from the air: entering, the ray only bends.

**Dispersion.** The index varies with wavelength: blue bends more than red, which is the prism's rainbow
[src](https://physicsbook.gatech.edu/Dispersion_and_Scattering). Crown glass: n = 1.5293 (F, blue), 1.5230 (D),
1.5204 (C, red); flint 1.7378, 1.7200, 1.7130. Abbe numbers 58.76 (crown) and 29.03 (flint): "a low v value implies
high dispersion" [src](https://physicsbook.gatech.edu/Dispersion_and_Scattering).
- So [est from src]: the blue-to-red spread of the bending is (nF − nC)/(nD − 1), about 1.7% for crown glass and 3.4%
  for flint. Sample red and blue at the green offset times (1 ± 0.85%) for window glass, (1 ± 1.7%) for flint or a
  crystal's fire. Physically it is faint; artists turn it up (Heckel's "split intensity" slider, section 3.3).

**Textured and obscure glass.** "The dominant visual effect when looking through obscure glass arises from refraction
of viewing rays" (Snell's law at a textured surface); smooth, wavy glass mostly distorts, finer texture blurs, and very
rough frosted glass can scatter so completely that no image is left. The authors model the view as I = FL + N: the
scene times a matrix of spatially varying blur-and-distortion kernels, plus noise
[src](https://homes.cs.washington.edu/~yoshi/papers/obscure_glass_eccv10.pdf). The trade's names for it: reeded (1/2
and 1/16 inch), squares, water, rain, ice crystals, glue chip, seedy, krinkle, baroque, cord, frosted
[src](https://www.core77.com/posts/59214/Designers-Resource-Different-Types-of-Textured-Glass). Microfacet theory
extends to "transmission through rough surfaces such as etched glass"
[src](https://www.cs.cornell.edu/~srm/publications/EGSR07-btdf.html).

**Frosted glass is an anti-aperture.** "Being close to the glass actually reveals more of YOU … Being further from the
glass reveals less"; it acts like "many many tiny apertures which are diffracting (diffusing) light"
[src](https://threadreaderapp.com/thread/1208725925245935623.html). Tape on privacy glass makes a clear peephole,
"still slightly blurry because of the etching and glue"
[src](https://www.howtogeek.com/93599/use-packing-tape-to-see-through-privacy-glass-geek-tricks/).
- So [est from src]: the blur's radius grows with how far behind the glass a thing lies (the scatter's cone). On a
  page with two surfaces there is one natural depth: the lower surface lies a little behind the glass, so it blurs,
  while the glass's own marks stay sharp.

**A drop is a tiny lens that turns the world over.** "A water droplet resting on a blade of grass acts as a natural
convex lens", forming "a sharp yet inverted image" of the print behind it
[src](https://www.optica-opn.org/home/gallery/image_of_the_week/2025/1025/droplet_lens/); a falling drop shows the
checkerboard behind "only upside-down", undistorted at its center and most distorted at its edges
[src](https://aapt.secure-platform.com/a/gallery/rounds/51/details/6523). Photographers place a flower "some 3 to 5
inches behind the drops" and shoot wide open so the background melts
[src](https://121clicks.com/tutorials/15-tips-to-take-water-drops-with-refractions-in-them). A lensball shows "the
background of your photo appearing inside the ball as an upside-down image", its horizon "bent and distorted", the
background around it blurred [src](https://digital-photography-school.com/lensball-perspectives-for-creative-photography/).

**Prisms, faceted filters and kaleidoscopes repeat the view.** Sam Hurd's "prisming": a 6-inch prism before the lens
gives "rainbows to triangular shapes to Holga-esque light-leak looks", reflects branches above into the lower half of
a portrait, and changes "from frame to frame"; reflections read best "with strong side light"
[src](https://www.popphoto.com/how-to/2013/11/pro-tip-use-prism-front-your-lens-unique-photos/). Angled glass "produces
a double, or sometimes triple image"; such filters work best "when the glass itself isn't in focus at all"
[src](https://shootitwithfilm.com/using-prisms-for-creative-photography-effects/). Brewster patented the kaleidoscope
in July 1817; three reflectors at 60° give an endless pattern of equilateral triangles; his telescopic form (later the
teleidoscope) has lenses instead of a cell of loose pieces and views the world at any distance
[src](https://en.wikipedia.org/wiki/Kaleidoscope). A teleidoscope is a kaleidoscope whose object is whatever lies
beyond: here, the surface beneath.

**Colored glass filters what is behind it.** Glass is colored by metal compounds in the melt: cobalt blue-violet, gold
red ("ruby gold", "cranberry"), copper blue, green or red, iron greens and browns, manganese purple, chromium emerald,
uranium fluorescent yellow-green, selenium reds [src](https://geology.com/articles/color-in-glass.shtml). Absorbance
follows A = CEL (concentration, extinction, thickness); too much cobalt and the glass is "effectively opaque in common
thicknesses" [src](https://www.lehigh.edu/imi/teched/GlassProcess/Lectures/Lecture04_Shelby_ColoredGlass.pdf). Apple's
tinted glass "draws inspiration from how colored glass works in reality: changing its hue, brightness and saturation
depending on what's behind" [src](https://developer.apple.com/videos/play/wwdc2025/219?time=1013).
- So [est from src]: stained glass is a multiply of the beneath by the pane's transmittance, deeper where the glass is
  thicker (a hammered pane's dimples darker), never a flat paint over it.

**Caustics are where bent light gathers.** A caustic is "the envelope of light rays which have been reflected or
refracted by a curved surface", a "curve of concentrated light"; "Rippling caustics are commonly formed when light
shines through waves on a body of water" [src](https://en.wikipedia.org/wiki/Caustic_(optics)). Their brightness is the
ratio of a patch's area before and after the light is bent
[src](https://medium.com/@evanwallace/rendering-realtime-caustics-in-webgl-2a99a29a0b2c).
- **Magic windows** look like plain glass yet cast a picture. Berry's Laplacian magic window: for a nearly flat surface
  of height f, the light on the wall is approximately its Laplacian
  [src](https://blog.wolfram.com/2017/08/25/how-laplace-would-hide-a-goat-the-new-science-of-magic-windows/); to first
  order the intensity is 1 − z(n−1)∇²h at a throw z [src](https://ar5iv.arxiv.org/html/2112.07053). Matt Ferraro
  carved one in acrylic: "A Magic Window appears to be a clear piece of glass or plastic … the distortion encodes a
  hidden image, visible only when light passes through" [src](https://hackaday.com/tag/morphic/).
- **The Magic Lens** (Papas, Houit, Nowrouzezahrai, Gross, Jarosz, SIGGRAPH Asia 2012): a lenslet array laid over a
  printed source image, each facet matched to a source patch that resembles its tile of a hidden target, so the target
  appears through it [src](https://cs.dartmouth.edu/wjarosz/publications/papas12magic.pdf). It is prior art for a
  faceted surface that chooses which piece of the beneath each facet shows.

**Heat haze.** Light bends through air layers of different temperature; the inferior mirage (a bright "puddle" of
sky) is "usually upside-down"; heat haze over hot roads or flames is the same through turbulent air, so the image may
"vibrate" [src](https://en.wikipedia.org/wiki/Mirage).

**Gravitational lensing.** Light passing a mass at distance b is bent by 4GM/bc² (1.75 arcseconds at the Sun's limb),
so the closer it passes the more it bends; a source right behind the mass spreads into "a bright ring", one slightly
off center into multiple images [src](https://www.jb.man.ac.uk/distance/frontiers/glens/section1.htm).

**Craquelure.** Crack patterns in paintings are distinct enough to tell 14th–15th century Italian panels, 15th–16th
century Flemish panels, 17th century Dutch and 18th century French paintings apart, 95 to 100% correctly by pairs
[src](https://chart.cch.kcl.ac.uk/chart97/bucklow.html): kinds a seed can choose among.

## 3. How games and shaders do it, with the scene behind as an input

**3.1 The grab pass** (Tiago Sousa, Crytek, GPU Gems 2 ch. 19). The scene without its refractive meshes is the
refraction map, "the current back buffer"; a normal map's red and green "are used and scaled by some small value to
add a displacement into the projected texture coordinates" (e.g. 0.05 of the screen; water 0.075 for refraction and
0.02 for reflection) [src](https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-19-generic-refraction-simulation).
- Its flaw is "refraction 'leakage'": the offset pulls in what stands in front. The fix is a mask in the alpha channel
  where the refractive meshes are, perturbing only there.
- Water blends toward a deep color by distance and adds reflection by Fresnel; glass multiplies its diffuse texture by
  the refraction, so different glasses are different bump maps, diffuse textures and environment maps.
- Overlapping refractive surfaces of different colors come out wrong unless sorted back to front with a refraction map
  per mesh. One pass; "extremely efficient" [src](https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-19-generic-refraction-simulation).

**3.2 The engines.** Blender EEVEE: Screen Space Refraction makes refraction BSDFs "raytrace against the depth buffer";
a Refraction Depth above 0 treats the object "as if the object is a thin slab"; when the trace fails, the nearest probe's
color is used [src](https://docs.blender.org/manual/ja/2.90/render/eevee/materials/settings.html). Unity HDRP traces a
screen-space ray first and falls back to reflection probes where the refracted area is "off screen"; its models are
Sphere (filled), Box (hollow, like bubbles) and Thin (a box 5 cm thick)
[src](https://docs.unity3d.com/Packages/hdrp/manual/Refraction-in-HDRP.html).

**3.3 Glass with dispersion** (Maxime Heckel). Hide the mesh, render the scene to a target, show the mesh again and
sample that target at refract(eye, normal, 1/ior) added to the screen coordinate. Dispersion uses an IOR per channel
(split further into six bands, red yellow green cyan blue violet, for smoother color); a loop of samples smooths it,
with a warning that loops "can be a performance pitfall"; a Fresnel rim pow(1 − |eye·normal|, p); a back-face pass
first, then the front [src](https://blog.maximeheckel.com/posts/refraction-dispersion-and-other-shader-light-effects/).

**3.4 Rain on a window** (Heartfelt, Martijn Steinrucken aka BigWings, 2017, Shadertoy ltffzl, as credited in a Unity
port). Drops and trails are masks; the normal is the finite difference of the drop mask; the background is sampled
with a level of blur, focus = mix(maxBlur − trail, minBlur, smoothstep(.1, .2, drop)), so fogged glass is blurred, a
drop shows the scene sharp, and a trail clears the fog; "inside the heart slighly less foggy": a heart drawn in the
condensation [src](https://github.com/yumayanagisawa/Unity-Raindrops/blob/master/Raindrop/Assets/Raindrop.shader).
A Godot port reads it the same way: the offset n added to the screen coordinate before the lookup, the blur chosen by
mip level [src](https://godotshaders.com/shader/rain-on-glass/).

**3.5 Glass in interfaces.** CSS backdrop-filter "applies one or more filters to an element, changing the appearance of
anything behind the element": frosted glass is a translucent fill plus blur, and it "may harm performance"
[src](https://web.dev/articles/backdrop-filter). Apple's Liquid Glass (WWDC 2025): "Where as previous materials
scattered light, this new set of materials dynamically bends, shapes, and concentrates light in real time" (lensing);
larger glass behaves as thicker, with "more pronounced lensing and refraction effects, and a softer scattering of
light"; a clear variant "needs a dimming layer to darken the underlying content" for legibility; Reduced Transparency
makes it "frostier", Reduced Motion "decreases the intensity of some effects"
[src](https://developer.apple.com/videos/play/wwdc2025/219?time=1013).

**3.6 Heat haze.** Never change the scene, only where each pixel looks: two value noises, recentered on zero, at
different scales and speeds, scrolled so the shimmer rises, masked to fade with height; strength 0.016 of the screen by
default (0 to 0.030), "a few thousandths" convincing, more reads as underwater; distorting the whole frame "looks like
a broken lens" [src](https://gamedev.net/shaderlab/38-heat-haze-distortion/).

**3.7 A black hole in 2D.** Games pull the screen toward the center, strength/(d² + 0.01), fade it out at a "shelf",
and blacken a disc for the horizon [src](https://forum.godotengine.org/t/how-to-make-black-hole-effect-in-2d/20577).
This app's Black Hole already ray-traces the real thing (texChaos.js genBlackHole, after Luminet, Interstellar's
renderer and Starless, by its comments).

**3.8 Caustics in real time.** Project the water mesh along refracted rays onto the floor and light each triangle by
its area before over after; it keeps the "intricate light patterns with sharp creases" approximate methods blur
[src](https://medium.com/@evanwallace/rendering-realtime-caustics-in-webgl-2a99a29a0b2c). Scrying Pool is after
Evan Wallace's WebGL Water already (texTouch.js genWater).

## 4. Artists and photographers who work through glass

- **Saul Leiter** photographed "through fogged windows, half-open doors, and falling snow", "through rain-streaked glass
  and steamed windows", "often bringing out strong colors in out-of-focus foreground elements", with a 150 mm lens and
  expired Kodachrome for its "surprise color shifts"; "A window covered with raindrops interests me more than a
  photograph of a famous person" [src](https://jamesmaherphotography.com/street_photography/saul-leiter/). Curator Ann
  Morin: "optical games, tangles of shapes and planes that conceal and reveal what lies in the intervals", "often
  flipping the focus from foreground to background"
  [src](https://loeildelaphotographie.com/en/belvedere-della-reggia-di-monza-saul-leiter-a-window-dotted-with-raindrops/).
  What it teaches [est from src]: the glass is the subject and the world behind is color; the beneath should go soft and
  saturated, not merely bent.
- **Rainy windows:** focus "nice and close on the raindrops", a fast lens to "blow the background out", low light
  "looking out at an artificially lit scene" [src](https://amateurphotographer.com/technique/expert_advice/8-photography-projects-for-rainy-days/).
- **Prisms and multi-image glass** (Hurd; the film-camera filters above): copies, rainbows at the edges, reflections of
  what lies to one side.
- **Kaleidoscopes and teleidoscopes** (Brewster): the beneath folded into 60° symmetry.
- **Lensballs and drop refractions:** the beneath small, whole and upside down inside a sharp sphere, the rest blurred.

## 5. How image editors do it

- **Photoshop's Displace** "uses an image, called a displacement map, to determine how to distort a selection"; "the
  greatest displacement is 128 pixels (because middle gray produces no displacement)"
  [src](https://helpx.adobe.com/my_ms/photoshop-elements/desktop/guided-edits-effects-and-filters/distort-filters.html).
  The map's first channel moves pixels across and the second up and down; white moves them up and to the left, black
  down and to the right; blur the map first; Stretch to Fit and Repeat Edge Pixels
  [src](https://community.adobe.com/questions-712/clear-tutorial-on-displacement-maps-1184848). The classic water
  reflection: flip the scene below the horizon, displace it by an embossed noise (across about half the vertical),
  motion-blur it, fade it [src](https://photoshopcontest.com/tutorials/26/displacement-water.html).
- **Photoshop's Glass** "makes an image appear as if it were being viewed through different types of glass" (scaling,
  distortion, smoothness, a built-in or loaded texture); Ocean Ripple makes it "look as if it were under water";
  Diffuse Glow renders it "as though it were viewed through a soft diffusion filter"
  [src](https://helpx.adobe.com/my_ms/photoshop-elements/desktop/guided-edits-effects-and-filters/distort-filters.html).
- **GIMP's Displace:** separate horizontal and vertical grey maps, displacement scaled by (intensity − 127.5)/127.5
  times a coefficient; a Polar mode where the map changes the distance from a center (Pinch) or the angle (Whirl);
  fractional shifts interpolated [src](https://docs.gimp.org/en/gimp-filter-displace.html).
- **Filter Forge's Refraction** lays the Source under a refracting layer whose thickness is the Height map; Refraction =
  100·(1 − IOR1/IOR2) [src](https://www.filterforge.com/more/help/Components/Processing/Refraction3.html). Its Offset
  "shifts the source image horizontally or/and vertically" by Offset X and Y maps (black is no offset), for
  "distortions, zooming, stretch, rotation and much more"
  [src](https://www.filterforge.com/more/help/Components/Transform/Offset4.html). This app's Displace and Lookup are
  its versions already (stepsPatterns.js).
- **Blender:** the glass sees what the depth buffer holds (EEVEE's Screen Space Refraction, section 3.2).

## 6. What makes a refractor recognizable [est from sections 2 to 5]

It is recognized by what it does to the beneath, not by its own color:
- an upside-down miniature (a drop, a dew bead, a ball);
- copies, each shifted its own way, broken at sharp seams (facets, a prism, a multi-image filter);
- a blur that keeps the colors (frost, fog, opal glass), sharper where the glass is wiped or touches;
- colored fringes where the bending is strongest, red and blue apart (dispersion; faint in window glass, strong in
  crystal);
- a mirror where the ray inside meets a face too steeply (total internal reflection), so a cut stone flashes;
- bright lines where the bent light gathers (caustics), dark where it spreads;
- a ring and a second image round a mass (gravity);
- a tint that deepens with thickness, multiplied into the beneath (colored glass).

## 7. What we take [est]

### 7.0 The machine: one pass, the box's glass given any shape

1. **A switch per layer, off by default.** Old looks then draw exactly as before (no fingerprint moves, no
   LOOK_VERSION bump). It is a control, so it follows the persistence rule (AGENTS.md §5.4): a key in uiLayers.js's
   LAYER_KEYS, saved, restored, reset by presets, swapped with its layer, its label and tooltip in strings.js. It
   shows only for a surface whose caps say it can see through. A plain, honest name, Ruby to choose: "See Through"
   or "Bend What Lies Beneath". Its hint: the glass, water or lens bends and blurs what lies under it (the page and the
   lower surface) instead of only blending over it.
2. **The surface hands back a lens beside its picture**, made in the worker with the texture and cached with it. Per
   pixel: where to look (dx, dy in canonical pixels), how scattered (a frost level), how much glass (coverage; 0
   leaves the beneath to the surface's own blend, as now). This is Photoshop's and GIMP's displacement map and GPU
   Gems' normal-map offset, with frost added as Heartfelt adds it.
   - Carry the offsets as a Float32Array transferred from the worker, not as an 8-bit image: Photoshop's 8-bit map
     reaches 128 steps; spread over a black hole's reach that would step the bent picture visibly.
   - Half resolution where the lens is smooth (waves, frost, heat); full where it has edges (drops, facets, panes).
3. **At composite time** (drawSurfaceLayer, canvasRenderer.js), before laying the picture, warp the page as drawn so
   far through the lens: one lookup per pixel, red and blue at the offset times (1 ± split) where the surface has
   dispersion, and the frost level choosing between the page and two or three smaller, smoother copies of it (made as
   boxFx.js's CPU path makes its soft blur, by shrinking and growing; Heartfelt's mip level). Then lay the surface's
   own picture by its own blend: Multiply for a tint, Screen for the light glass catches.
   - Because the lens is made apart from the beneath, changing the lower surface never remakes the upper, and the
     upper's cache stays its own.
   - GPU Gems' leakage can't happen: the words, box and border are drawn after the surfaces, so nothing in front can be
     pulled into the glass, and no mask is needed.
   - The order is fixed (lower, then upper), so two glasses stacked come out right without sorting.
   - Past the page's edge, mirror the lookup (Lookup's mirror edges): the engines fall back to a probe there, and our
     "probe" is the backdrop itself.
4. **In the Athanor**, the same two things as parts, so a graph can do anything to the beneath:
   - Surface Beneath, an Inputs part beside Page Backdrop: the page under this layer as a picture (in the Athanor's own
     preview, the Page Backdrop);
   - Refraction (ROADMAP F7, docs/renderer-pass.md R0.9): a picture, a normal map or a height, a frost amount and a
     split, out a picture. The Light Engine's Normal Map is what it reads.
   - At most one new process part, as AGENTS.md §8 asks; the lens a menu surface hands back is then just this graph's
     output.

**Speed on the phone.** Measured this session in Node (a scratch script, not in the repo), one lookup per pixel:

| Page | nearest | bilinear | bilinear, colors split | bilinear, frost level |
|---|---|---|---|---|
| 768×960 (a phone's preview) | 7 ms | 26 ms | 34 ms | 32 ms |
| 3072×3840 (the export) | 99 ms | 421 ms | 500 ms | 540 ms |

PERFORMANCE-AUDIT.md says a phone is roughly 3 to 5 times slower. So:
- on the CPU, nearest sampling at preview sizes (about 20 to 35 ms on the phone) and bilinear only for Save image
  (about 1.3 to 2.7 s, inside a save that already waits for its textures);
- on the GPU, a new mode in boxFx.js's shader reading the lens as its second texture, as mode 9 reads a layer for the
  ⚡ blends. It pays the same read-back the ⚡ blends pay at full size today (PERFORMANCE-AUDIT.md: reading back stalls
  the GPU, so do it once per layer and never per part);
- skip the pass wherever coverage is 0 (rows with no glass), and while a slider is dragged, draw the half-size draft
  the slow textures already use.

**Photosensitivity** (AGENTS.md §11; WCAG: no more than three flashes a second, a flash being opposing changes of 10%
or more of the brightest luminance where the darker is below 0.80, over more than 25% of any 10° field, about a 341 ×
256 px rectangle [src](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html)):
- A still page is safe: refraction only moves color around.
- In a film, a lens may move only on a gentle clock (as the Ringworld's sway does), never re-seeded between frames, and
  its strength eased in. Bending keeps the beneath's brightness on average, but a lens sliding over a high-contrast
  lower surface can swing a large region light-dark-light. Measure each 341 × 256 region's mean between frames and
  ease the lens wherever it would change by 10% or more.
- Caustics brighten; keep a moving caustic's gain low and its clock slow. Fine noise is exempt, but a regular stripe
  pattern is not noise (section 9).

### 7.1 The list, by how striking and how cheap

Every item below uses the switch of 7.0 and, at most, one knob of its own. "Fast" means it adds only the composite
pass (7.0), because the lens comes out of the work the surface already does.

1. **Rain on Glass: each drop holds the beneath upside down** (glassrain). The drops are already heights. Their slopes
   give the lens, scaled so a drop's rim looks several drop-widths out and signed so the view turns over (the optics of
   2: a drop gathers a wide view, small and inverted). Condensation becomes the frost level, so a fogged pane is the
   beneath blurred and the runners' wiped trails show it sharp (Heartfelt's focus). That is Leiter's window, made of
   Ruby's own page.
   - Bonus, with Shape Aware: the poem's lines wiped clear in the condensation, as Heartfelt's heart is.
   - Knob: none (Condensation already is the fog). Fast; the simulation is unchanged.
   - Safe: drops don't move in a still; in a film they slide on the simulation's own steps.
2. **Black Hole: the beneath is its sky** (blackhole). The tracer already knows where each escaped ray lands in the
   sky ("sampled at full size through the lens map"); land it on the beneath instead, so the lower surface wraps into
   an Einstein ring, a thin second image hugs the shadow, and far off it shears into arcs. The shadow stays black and
   the disc is laid over as now.
   - Knob: none (Chaos is already "how far behind it the sky lies"). Fast; this is the case that needs float offsets.
   - Safe: keep the photon ring's brightness fixed while the camera turns in a film.
3. **Stained Glass: the panes tint the beneath** (stainedglass). Each pane multiplies the beneath by its glass, deeper
   where thicker (A = CEL); hammered and seedy panes shift it a little within each pane, opalescent panes frost it, and
   the lead stays dark. That is a cathedral window over the lower surface, and the colors are real glass's.
   - Knob: none (Glass Texture already runs from clear cathedral glass to milky opal: from bent to frosted; Scene,
     which colors the panes from a picture behind them today, could take the beneath in a graph).
   - Fast: a lens per pane from the Panes maps. Safe.
4. **Scrying Pool: the beneath as the pool's floor** (water). Its waves already bend the floor more the deeper it lies;
   lay the beneath there instead of the koi, stones or well, keep the caustics playing over it, and as View tips toward
   the horizon let the water mirror rather than show it (Fresnel, as now). The beneath becomes something seen in a
   pool, which is what scrying is.
   - Knob: none (Depth exists). Fast. Safe; caustics as in 7.0.
5. **Facet Field: a mosaic of shifted copies** (tessellate). Each facet's tilt gives one uniform shift (the formula in
   2), so the beneath breaks into many copies along the seams, the multi-image filter and the Magic Lens's facets;
   red and blue part along the seams. Read as cut on the underside, as a cut-glass dish is, a facet steeper than
   glass's critical angle (41.8°) reflects whole and shows the Facet Hue instead, so some facets flash.
   - Knob: none, or one: Thickness (how far a tilt shifts its copy). Fast: one offset per facet. Safe.
6. **Under Glass: old glass, and broken glass** (underglass). The Glass Pane already bends a picture by its waves and
   sends each shard its own way (ugPane, stepsTouch.js); give it the beneath. Ruby wanted it as a glass to lay over
   another surface (docs/surfaces.md), and this makes it one in the menu, not only in a graph.
   - Knob: none (Waviness already is old glass's waviness, and Cracks breaks it). Fast. Safe.
7. **Dewy Webs: a world in every bead** (dewwebs). Each bead a ball lens holding the beneath small and upside down
   (the lensball, the drop photographs), its point of light and crescent laid over as now.
   - Knob: none. Fast: the beads' centers and sizes are known. Safe.
8. **Crystal Leaf: the beneath as what lies inside the stone** (crystal). Crystal Druse already takes an Inside picture
   and hands on each face's normals; bend the beneath by them, split it strongly where the Fire is (flint's spread or
   more), frost it where the Veil is, and mirror it on faces past the critical angle.
   - Knob: none (Clarity and Fire exist). Fast: the normals are already made. Safe.
9. **Hoarfrost: a frozen pane** (frost). The rime is the frost level: the beneath blurred toward the frame, clearer
   between the ferns, each needle shifting it a hair.
   - Knob: none (Frost and Rime exist). Fast. Safe.
10. **Broken Glass: shards lying on the beneath** (brokenglass). Each shard bends what it lies on by its tilt, its edges
    split in color (Glass Shards' Picture input already does this in A Dropped Frame).
    - Knob: none. Fast. Safe.
11. **Pool Caustics: the beneath as clear glass** (caustics). Read the beneath's brightness as the height of a clear,
    nearly flat window and lay on the light it would cast, 1 − z(n−1)∇²h (Berry's magic window): its edges become lines
    of light and its soft places pools of shade. A light overlay made from the page itself, and nothing else in the
    menu does it.
    - Knob: one, Throw (z: how far the light falls; near is faint, far is sharp, then it breaks into caustics).
    - Fast: a five-point Laplacian of the beneath, blurred first, in the composite pass. Safe in a still; in a film
      the beneath changes, so ease it as 7.0 says.
12. **Rain on Water: the beneath under the water, then on it** (rainwater). Looking down (View low), the beneath under
    the water, bent by the rings; toward the horizon, mirrored about it (the Photoshop water reflection: flip,
    displace, blur), broken by the same rings.
    - Knob: none (the camera dial's View already tips it from overhead to the horizon). Fast. Safe.
13. **Fractured Glaze and Kintsugi: the beneath crazed, or broken and mended** (crackle, kintsugi). Under the glaze,
    the beneath as an old varnished painting: each crack cell shifts it a hair, grime fills the cracks, the seed
    choosing among the craquelure of the old schools. Kintsugi breaks the beneath into its pieces, each turned and
    shifted a little, the gold seams laid on top.
    - Knob: none. Fast: one offset (and turn) per cell, from the cell maps the cracks already make. Safe.
14. **Poured Wax: the beneath sealed in wax** (wax). Encaustic: the beneath clear where the wax is thin, clouded and
    tinted toward the Wax Hue where it is thick (frost and A = CEL by thickness). This is the Light Engine's
    Translucency read as "how much of the beneath comes through".
    - Knob: none. Fast. Safe.
15. **The Sparkler: heat haze** (embers). Above each burst, the beneath shimmers: the heat-haze recipe (two noises,
    rising, fading with height), a few thousandths of the page, no more.
    - Knob: none. Fast.
    - In a film the shimmer moves: amplitude small, its clock slow. Shimmer only moves color around, and it is local.
16. **Drapery: a sheer** (drapery). The beneath through the weave's gaps, softened and shifted by the folds' normals
    (Drape already makes them).
    - Knob: none, or Sheerness. Medium: the gaps' coverage at full resolution. Safe.
17. **Dream Bloom: the beneath out of focus** (bokeh). The beneath through the 50 mm lens, its brightest points opening
    into discs the shape of the aperture, as the motes do.
    - Knob: none (Focal Plane exists). Slow: a convolution. Lens Blur runs on the GPU only in the worker, so this waits
      for a page-side kernel. Last.

## 8. Beyond glass

The same switch and the Surface Beneath part open takes that aren't optical. Each is a part the Athanor already has,
fed the beneath [est]:
- Retro Dots printing it as halftone (Halftone Screen's tone);
- Silverpoint Hatch hatching its tones;
- Flow-Field Ink or Suminagashi combing it as marbling combs a print;
- Metal Spangle's grains as mirrors, each showing a piece of it.
Ruby's request is about glass and light, so these follow, if wanted.

## 9. Gaps

- **Blocked or failed, not read:** Heartfelt's own Shadertoy page (read through the credited Unity port and a Godot
  port instead); Matt Ferraro's own write-up (read through Hackaday and Berry's window through Wolfram and the Flat
  Magic Window paper); Photoshop's full Displace help (read Photoshop Elements' help and Adobe community answers, so the
  channel mapping comes from users, not Adobe); Filter Forge's Lookup page; Wikipedia's Snell's law and Dispersion pages
  (the Total internal reflection page and the Georgia Tech physics book instead).
- **Read but not used:** a dev.to "physically accurate" black hole shader (no background texture; a heuristic); an
  Australian Photography lensball page (nothing on inversion); Canon's droplet macro page (nothing on refraction);
  Bucklow's abstract only (no features of the crack patterns themselves).
- **Not found in a source:** that frosted glass blurs more the farther a thing lies behind it (an inference from the
  scattering, marked [est]); the color fringe at a lensball's rim.
- **Not researched:** ice (clear against white, bubbles, cracks); moving-pattern photosensitivity beyond WCAG (stripes,
  e.g. reeded glass over Stripes in a film; the broadcast pattern guidelines are the next read).
- **Not measured on the phone:** the timings above are Node on a development machine, times 3 to 5 by
  PERFORMANCE-AUDIT.md's rule. The GPU mode is unmeasured.
- **For Ruby:**
  - whether the poem's words should ever be bent too (Rain on Water's teaching note already suggests seeing the poem
    through the water in a graph); legibility says not by default;
  - the switch's name;
  - whether a new look should start with it on, for surfaces that see through.
- **Not worked through:** Lotus Pond (its ground is already the backdrop as water), Windward Sea, Liminal Spaces' pools,
  Night City's water.

## Sources

- Tiago Sousa, "Generic Refraction Simulation", GPU Gems 2 ch. 19:
  https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-19-generic-refraction-simulation
- Maxime Heckel, "Refraction, dispersion, and other shader light effects":
  https://blog.maximeheckel.com/posts/refraction-dispersion-and-other-shader-light-effects/
- Heartfelt (Martijn Steinrucken aka BigWings, 2017), as credited in Unity-Raindrops' Raindrop.shader:
  https://github.com/yumayanagisawa/Unity-Raindrops/blob/master/Raindrop/Assets/Raindrop.shader
- "Rain on Glass", Godot Shaders: https://godotshaders.com/shader/rain-on-glass/
- Qi Shan, Brian Curless, Tadayoshi Kohno, "Seeing through Obscure Glass" (ECCV 2010):
  https://homes.cs.washington.edu/~yoshi/papers/obscure_glass_eccv10.pdf
- Walter, Marschner, Li, Torrance, "Microfacet Models for Refraction through Rough Surfaces" (EGSR 2007), abstract:
  https://www.cs.cornell.edu/~srm/publications/EGSR07-btdf.html
- Alex Hunsley on frosted glass (thread): https://threadreaderapp.com/thread/1208725925245935623.html
- "Use Packing Tape to See Through Privacy Glass", How-To Geek:
  https://www.howtogeek.com/93599/use-packing-tape-to-see-through-privacy-glass-geek-tricks/
- "Total internal reflection", Wikipedia: https://en.wikipedia.org/wiki/Total_internal_reflection
- "Dispersion and Scattering", Georgia Tech Physics Book: https://physicsbook.gatech.edu/Dispersion_and_Scattering
- "Droplet Lens", Optics & Photonics News image of the week:
  https://www.optica-opn.org/home/gallery/image_of_the_week/2025/1025/droplet_lens/
- "Water Drop Refraction", AAPT photo contest: https://aapt.secure-platform.com/a/gallery/rounds/51/details/6523
- "15 tips to take water drops with refractions in them", 121clicks:
  https://121clicks.com/tutorials/15-tips-to-take-water-drops-with-refractions-in-them
- "Lensball perspectives for creative photography", Digital Photography School:
  https://digital-photography-school.com/lensball-perspectives-for-creative-photography/
- "Pro Tip: Use a Prism In Front of Your Lens" (Sam Hurd), Popular Photography:
  https://www.popphoto.com/how-to/2013/11/pro-tip-use-prism-front-your-lens-unique-photos/
- Tom Box, "Using Prisms for Creative Photography Effects": https://shootitwithfilm.com/using-prisms-for-creative-photography-effects/
- "Kaleidoscope", Wikipedia: https://en.wikipedia.org/wiki/Kaleidoscope
- "Designers Resource: Different Types of Textured Glass", Core77:
  https://www.core77.com/posts/59214/Designers-Resource-Different-Types-of-Textured-Glass
- "Color in Glass", Geology.com: https://geology.com/articles/color-in-glass.shtml
- J. E. Shelby, "Colored Glasses" (lecture 4), Lehigh University:
  https://www.lehigh.edu/imi/teched/GlassProcess/Lectures/Lecture04_Shelby_ColoredGlass.pdf
- "Meet Liquid Glass", Apple, WWDC 2025 session 219: https://developer.apple.com/videos/play/wwdc2025/219?time=1013
- "Create OS-style backgrounds with backdrop-filter", web.dev: https://web.dev/articles/backdrop-filter
- "Heat haze distortion", gamedev.net Shader Lab 38: https://gamedev.net/shaderlab/38-heat-haze-distortion/
- "Mirage", Wikipedia: https://en.wikipedia.org/wiki/Mirage
- "Gravitational lenses: introduction", Jodrell Bank: https://www.jb.man.ac.uk/distance/frontiers/glens/section1.htm
- "How to make black hole effect in 2D?", Godot Forum: https://forum.godotengine.org/t/how-to-make-black-hole-effect-in-2d/20577
- Evan Wallace, "Rendering Realtime Caustics in WebGL":
  https://medium.com/@evanwallace/rendering-realtime-caustics-in-webgl-2a99a29a0b2c
- "Caustic (optics)", Wikipedia: https://en.wikipedia.org/wiki/Caustic_(optics)
- "How Laplace Would Hide a Goat: The New Science of Magic Windows" (on M. V. Berry, "Laplacian magic windows", J. Opt.
  2017), Wolfram Blog: https://blog.wolfram.com/2017/08/25/how-laplace-would-hide-a-goat-the-new-science-of-magic-windows/
- Hufnagel et al., "Flat Magic Window": https://ar5iv.arxiv.org/html/2112.07053
- "Math, Optics, And CNC Combine To Hide Secret Images In Acrylic" (Matt Ferraro), Hackaday: https://hackaday.com/tag/morphic/
- Papas, Houit, Nowrouzezahrai, Gross, Jarosz, "The Magic Lens: Refractive Steganography" (SIGGRAPH Asia 2012):
  https://cs.dartmouth.edu/wjarosz/publications/papas12magic.pdf
- Spike Bucklow, on craquelure (CHArt 1997): https://chart.cch.kcl.ac.uk/chart97/bucklow.html
- James Maher, "Saul Leiter Street Photography": https://jamesmaherphotography.com/street_photography/saul-leiter/
- "Saul Leiter: a window dotted with raindrops", L'Œil de la Photographie:
  https://loeildelaphotographie.com/en/belvedere-della-reggia-di-monza-saul-leiter-a-window-dotted-with-raindrops/
- "8 photography projects for rainy days", Amateur Photographer:
  https://amateurphotographer.com/technique/expert_advice/8-photography-projects-for-rainy-days/
- "Distort filters", Adobe Photoshop Elements help:
  https://helpx.adobe.com/my_ms/photoshop-elements/desktop/guided-edits-effects-and-filters/distort-filters.html
- "Clear tutorial on displacement maps", Adobe Community:
  https://community.adobe.com/questions-712/clear-tutorial-on-displacement-maps-1184848
- "Displacement water", PhotoshopContest: https://photoshopcontest.com/tutorials/26/displacement-water.html
- "Displace", GIMP manual: https://docs.gimp.org/en/gimp-filter-displace.html
- "Refraction", Filter Forge help: https://www.filterforge.com/more/help/Components/Processing/Refraction3.html
- "Offset", Filter Forge help: https://www.filterforge.com/more/help/Components/Transform/Offset4.html
- "Material settings" (EEVEE), Blender 2.90 manual: https://docs.blender.org/manual/ja/2.90/render/eevee/materials/settings.html
- "Refraction in the High Definition Render Pipeline", Unity: https://docs.unity3d.com/Packages/hdrp/manual/Refraction-in-HDRP.html
- "Understanding SC 2.3.1: Three Flashes or Below Threshold", W3C:
  https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
