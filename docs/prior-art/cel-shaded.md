# Cel-Shaded Worlds Prior Art: the first love letters to video games

**The brief (Ruby, 2026-10-19):** "we should come up with other filters that are love letters to video games. I am a
game dev first after all" — all of cel-shaded worlds, painted 2D, retro hardware, atmospheric journeys, city simulators
and space games, eventually; "focus on cell shaded stuff at first". A nod to a look, never a character, a logo or a
name (ROADMAP L5). What could live in another group hides there and only nods (the Meadow already reads as a famous
green field).

**Key:** [src] read this session (Sources). [est] my design.

---

## 1. What cel shading is

- Lighting is computed as usual, then "quantized to a small number of discrete shades", so shadows and highlights are
  flat blocks of colour, not gradients [src: Wikipedia, Cel shading].
- The name comes from the painted acetate cels of 2D animation; it first meant the flat shading, and only later the ink
  outlines too [src: Wikipedia].
- Outlines, when there are any: an inverted hull (the back faces drawn black, slightly enlarged) or edge detection on
  depth and normals [src: Wikipedia]; or a hard cutoff where the surface turns from the eye, N·V < 0.2 [src: Flax].
- A practical recipe: the brightest light's N·L into three bands, with hard thresholds — highlight above 0.9, key
  above 0.4, shadow below — each band its own colour [src: Flax Engine].

## 2. The sea and sky of the great cel-shaded sailing game (2002)

- Its art director chose the style so that puzzles and objects read clearly: photorealism "would have made information
  harder to convey" [src: Wikipedia, quoting Takizawa].
- Wind comes "in beautiful, large streams", fires in "wide bursts", and waves are "actual giant lines on the ocean";
  effects that don't try to be real are why it hasn't dated [src: Source Gaming].
- Its clouds were "affected by the wind" [src: Zelda Universe]; its effects are drawn through black-and-white masks
  ("the ocean, fire and particle effects") because the hardware had no shaders [src: Gordon, Medium].
- A faithful fan shader of its water: three colours only (water, second water, foam), sampled from the original; the
  foam is about a hundred hand-placed circles in a seamless tile, the coordinates warped by noise so the pattern isn't
  rigid; a second, reversed layer of the same pattern adds more foam [src: Godot Shaders].
- Stylized water generally: simplified forms, "very reduced gravity waves", hand-drawn foam lines, a muted art-directed
  palette, caustics kept because they "felt right" [src: 80.lv, Nimue].

## 3. Its successors, and the ink-painted one

- The open-world successor kept the toon lineage but aimed for "an information-dense, mature art style" and a slogan
  of "Refreshing and full-flavoured" for its shaders, lighting and weather [src: Zelda Universe; Thumbsticks].
- The ink-painted wolf game "abandoned the realistic style" for traditional Japanese art, to capture the countryside's
  beauty [src: Wikipedia, Cel shading]. (Its brush-and-paper look is a later love letter: §6.)

## 4. The first surface: Windward Sea [est]

A sea and sky in the cel-shaded sailing look, built from general parts and no new part:
- **Light in bands.** The Light Engine lights the clouds' and islands' rounded heights from the dial; its light is
  posterized into two to four bands (Toon Bands) and each band mapped to a hue: the shadow, the key, a bright edge.
- **The sea: three colours.** Sea, a second deeper sea, and foam. Foam is circles (Cells' distance, thresholded) warped
  by noise, as the fan shader does; the "giant lines" of the waves are thin bands of Waves, warped, white; both laid
  into Perspective so they recede to the horizon. The sun's path is a column of flat glints on the water.
- **Clouds** that read as drawn: noise thresholded hard into puffs, Twirl curling them into the swirls (Swirls), lit in
  bands; **wind** in long white streams (Flow Lines, thinned).
- **Islands** on the horizon, toon-lit hills (Islands: none to several).
- **The sun** stands where the dial lays it: across by the light's way, as high as its height, so a low light sets it
  into the sea behind the islands (Sunset Sail).
- **As built:** the foam is Scatter's dots, not Cells, and the waves' lines Scatter's dashes, both thrown smaller with
  depth (Scatter's Size as a map) and flattened: Perspective over a tile that isn't seamless showed seams. Wind is
  Streamers (§5).
- **Six hues:** Sky, Sea, Deep Sea, Foam (also the clouds' lit side), Island, Sun.
- **Its home:** Places & Scenes (a sea could live there; it only nods).

## 5. Ruby's first look: weather, and the wind as objects (2026-10-19)

Ruby: "the weather should be dependent on the seed", and "in the actual game the wind waker, the streams of wind were
cell shaded objects in space, not a texture against the sky." Read again for this round:
- The game's wind, rebuilt: a curve's every point becomes two vertices, pushed apart so "the curve has thickness"
  (a ribbon); simplest pushes them up and down, for any curve across the path, from the cross product of neighbouring
  segments. The main path is a spiral whose "radius decreases a lot at the beginning, but less over time"; the line
  starts and ends smoothly, its ends faded; one spiral "duplicated … 6 times, all slightly offset", the group turned
  so its shape is hidden [src: Gordon, "Wind"]. A three.js thread asks the same and lands on extruding a spline into a
  ribbon [src: three.js forum].
- The sea, rebuilt: a base blue, a white layer through a mask texture, a second layer of the same in dark blue,
  offset so the lines don't meet; sine curves displace the lookup to ripple it [src: Gordon, "The Ocean"].
- Its weather: a curse brings "a Storm that creates choppy seas and strong winds", and "visibility is reduced as the
  world is cast in darkness" [src: Zelda Wiki, Thunderstorm; Zelda Wiki, Rain].

Built [est]:
- **Streamers**, a process part: gusts placed at depths where the map allows (high ones far, low ones near and above
  the sea), each path a run with the wind and then a curl that tightens (or a spiral, a loop, a wave), made a ribbon in
  the plane it bends in, twisted to show its back, a few strands side by side, ends faded; projected through a camera
  level with the horizon. It hands on Facing, Side and Depth, and the graph lights it in the sea's toon bands.
- **Weather** by seed: clear (a few small clouds), fair (heaped cumulus), overcast (many, large), storm (the world
  darkened toward slate, more waves' lines, more wind). The knob leans it; at its middle every weather can come.

## 6. Later love letters (ROADMAP L5)

- **Ink and brush** (the wolf game): sumi-e strokes, a parchment ground, the outline as a brush.
- **Painted 2D** (Hollow Knight, Ori, Gris): layered parallax silhouettes, glowing motes, watercolour washes.
- **Retro hardware**, in a Video Games group: PS1 (affine wobble, dithering, fog), a handheld's four greens, a CRT
  arcade, 16-bit parallax.
- **Atmospheric journeys**: glittering dunes, vast ruins in mist, a lone tower.
- **City simulators**: a city from above, zoning colours, traffic and night lights.
- **Space games**: a cockpit's star map, a jump gate in a nebula.
- **Small nods**: stitches and underlines with a game's grammar (a row of hearts, a dialogue box), a pixel font, a
  Sierpiński triangle's first steps (mathematics, under a name of its own).

## 7. The ink-painted one: Sunrise Scroll (2026-10-19)

Read for it:
- The brush-painted wolf game "features a sumi-e-inspired cel-shaded visual style"; its world is "a woodcut, watercolor
  style, cel-shaded environment" that resembles "an animated Japanese ink-illustration", drawing on the "wood carving
  techniques used in notable works such as those of Hokusai". Realistic rendering strained the console; a designer
  "drew the wolf character using a brush", and the leads took up ukiyo-e and sumi-e, which "better conveyed the
  connection of restoring nature". An early demo had flowers "blossoming in its wake"; a later port kept "a paper
  parchment filter applied to all on-screen elements" [src: Wikipedia, Ōkami]. Its look is "hand drawn, cel shaded"
  [src: TheXboxHub].
- Ink painting's methods: kouroku, a form outlined; mokkotsu, a form "expressed by the shading of sumi ink or color
  rather than by using outlines"; tarashikomi, pigments bleeding into a natural blur; bokashi, water added to applied
  paint for shading; and mist and clouds, painted to "give perspective or express the height of mountains", or placed
  at intervals to mark a change of scene [src: Nomura Kakejiku].
- Sumi ink gives "very intense blacks" and, diluted, transparent greys enough for "volume, texture, and atmosphere";
  blank paper is left to make "both atmosphere and light"; "a single, well-executed line is better than a hundred rough
  lines" [src: Dessindigo].
- The woodblock's gradation, bokashi: ichimonji bokashi, a brush drawn across the block, "most associated with horizons,
  seas, and skies"; Prussian blue fading in skies and water for depth; itabokashi, edges abraded so the transition is
  ruffled [src: Wikipedia, Bokashi (printing)]. A print's outline block left "a network of raised ridges", and Hokusai's
  Thirty-six Views first used only Prussian blue and indigo [src: British Museum].

Built [est], general parts only:
- **Mountains band behind band** (a mountain-and-water painting): each ridge a 1D noise laid along the page (a Curve's
  noise in two octaves, through a Profile Gradient), so it is a true profile, not a blob; the far ones folded at their
  middle into crags. Each a flat wash of ink diluted by distance (mokkotsu), tinted by Wash, lit by the Light Engine in
  toon bands, its foot fading to paper as mist (kiri, bokashi), its ridge brushed in ink (kouroku): the line thick and
  thin where a noise lifts the brush, broken by dry-brush streaks.
- **The sky** graded across the top in the Sky Hue, its edge a little ragged (ichimonji bokashi, itabokashi); a red sun
  where the dial lays it, sinking behind the mountains as its height falls.
- **Mist bands** with rounded ends across the sky (suyari-gasumi), a few curled, outlined.
- **Cherry petals** adrift (Bloom's cherry petals, thrown), the flowers in the game's wake.
- **The paper**: its tooth through everything, and its edges darkened with Age (the parchment filter).
- **Readings**: Spring Scroll; Vermilion Dusk; Indigo Print (a blue print, after the Prussian-blue prints); Bare Ink
  (no colour at all).

Sources (this section):
- Wikipedia, "Ōkami": https://en.wikipedia.org/wiki/%C5%8Ckami
- TheXboxHub, "Looking back to 2006 and the doodlings of Okami": https://www.thexboxhub.com/looking-back-to-2006-and-the-doodlings-of-okami/
- Nomura Kakejiku, "Methods of expression": https://nomurakakejiku.com/lesson_lineup/methods-of-expression
- Dessindigo, "What is Sumi-e painting?": https://dessindigo.com/en/blog/advice/sumi-e-painting
- Wikipedia, "Bokashi (printing)": https://en.wikipedia.org/wiki/Bokashi_(printing)
- British Museum, "Technique: making a good impression": https://www.britishmuseum.org/blog/technique-making-good-impression

## 8. Wind-swept toon grass and hills: Windswept Hills (2026-10-19)

Ruby picked it next ("Toon grass and hills"). The nod is to the great open-air cel-shaded adventure (2017) and its
green hills, and to the fields the samurai game rides through; the surface takes their grammar, never their picture.

**What the sources say**

- **The art direction.** The 2017 game's look grew from the sailing game's HD remake: its art "stood out from the other
  HD mockups" [src: Zelda Universe]. It needed to be "an information-dense, mature art style" that still read clearly,
  so cel shading grew some realism. The team's slogan, "refreshing and full-flavoured", covered "shaders, lighting,
  models, terrain, effects, UI, weather" [src: Zelda Universe; Thumbsticks].
- **The grass's light.** Its blades are thought to be low-poly geometry, not alpha cards, with a translucency
  (subsurface) approximation: sun-facing grass "become[s] almost white"; a texture probably varies its light and dark
  apart from shadow, and its colour shifts with weather [src: Unreal forum, a reading of the game, not Nintendo's
  word]. Grass "lighter at grazing angles" separates one hill from the next (a fresnel) [src: Polycount].
- **A blade, a clump, a field.** In a GPU grass after Ghost of Tsushima's: each blade a cubic Bézier curve; colour from
  a gradient along the blade, a colour per clump, and the ground's texture; blades grouped in Voronoi clumps that
  share their parameters, "which breaks up the uniform look"; wind as scrolling 2D Perlin noise through a sine
  [src: Rademan, ArtStation]. Ghost of Tsushima's own talk: "generating individual blades of grass on the GPU that
  could each have their own procedural appearance and animation", and "making thousands of individual blades of grass
  look like a natural field" [src: GDC Vault, Wohllaib].
- **Gusts you can see.** Ghost of Tsushima's wind keeps one direction but varies its strength over the field "using
  time-varying Perlin noise": "This is visible on large fields of grass when you can see gusts of winds blow through"
  [src: Game Developer, Rockenbeck]. A toon grass shader takes its wind from a scrolling distortion texture
  [src: 80.lv, after Roystan].
- **Why a gust is pale.** Thoreau, 14 June 1852, on wind in the meadows: the light reflected from "the bent blades
  (horizontal tops) of rank grass", and leaves' "under sides … turned up by the wind" [src: Walden.org]. A blade bowed
  over shows its flat top to the sky and to the eye: a running pale band.
- **Patches lean together.** "Most blades should wave almost in the same direction"; a patch a few metres across bends
  mostly one way, with gradual shifts between regions [src: POV-Ray newsgroup].
- **The painter's greens.** Kazuo Oga came to paint the grasses of Totoro "with an awareness of what they were", not
  "a lot of grass … growing vaguely"; Miyazaki asked for "subdued but beautiful (kirei) colors", and Oga for "softer"
  warm tones, not "piercing, raw primary colors" [src: Animation Obsessive].

**What makes it recognizable** [est]: rolling hills band behind band, the far ones hazed toward the sky; a field of
blades in two flat tones (root and tip), the near ones large, shrinking to a smooth colour at the horizon; one wind,
and pale gust bands running across the grass; light in a few flat bands on the hills' rounded forms; big soft clouds.

**How it is made here** [est]: one new process part, **Grass Blades** (stepsGrass.js): blades in two tones by clump,
leaning with one wind, bowed and paled where a gust map says, shrinking toward a horizon; maps for the rest (albedo,
height, sheen). The hills are a Gradient raised by broad Perlins and thresholded, three bands; their forms (blurred
bands) and the clouds' domes go to the Light Engine, whose light, posterized (Toon Bands), multiplies the colours; the
gusts are a slow Perlin; the sheen screens the Sheen Hue over the bowed blades.

**Ruby's first look (2026-10-19): "If you're trying to go for a video game Love Letter it needs to be recognizable."**
The second round adds the game's signatures, researched again:
- its look is "painterly, gouache-inspired, *en plein air*" [src: Artpublika], "a painterly art style that combined
  the realism of the game world with its playability" (Takizawa) [src: TweakTown; Nintendo Everything];
- gouache's atmospheric perspective: "lightening colours of distant elements"; "the distant mountain appears as a
  neutral blue colour, much lighter than the mountains in the foreground" [src: Fine Art Tutorials]: the mountain
  ranges, paled and cooled;
- its trees are foliage whose normals are transferred from a hemisphere so they shade as one round mass, grass tips
  brighter [src: Polycount]: the round trees, lit as domes;
- its wind is drawn: white breeze lines that glide over the land, "a 2D plane is enough" [src: three.js forum, after
  the game]; the stylized Zelda effects use "a simple geometry with the shape of a curve", eroded at its ends
  [src: Game Developer]: the curling trails (Streamers).

**What it can do that the games can't** [est]: any hue (a lavender field, autumn gold, a blue-grass night), the light
dial turning the bands round the hills, and words on it.

## Sources

- Wikipedia, "Cel shading": https://en.wikipedia.org/wiki/Cel_shading
- Flax Engine manual, "Cel Shading": https://docs.flaxengine.com/manual/graphics/shaders/cel-shading.html
- Source Gaming, "Holism: The Wind Waker's cel-shaded graphics":
  https://sourcegaming.info/2017/08/10/holism-the-wind-wakers-cel-shaded-graphics/
- Zelda Universe, "Cloudscape": https://zeldauniverse.net/2005/08/15/cloudscape/
- Nathan Gordon, "Wind Waker Graphics Analysis" (Medium): https://medium.com/@gordonnl/wind-waker-graphics-analysis-a0b575a31127
- Godot Shaders, "Wind Waker water – no textures needed": https://godotshaders.com/shader/wind-waker-water-no-textures-needed/
- 80.lv, "How to Build a Stylized Water Shader" (Nimue):
  https://80.lv/articles/how-to-build-stylized-water-shader-design-implementation-for-nimue/
- Zelda Universe, "Takizawa explains how the Wind Waker HD inspired the visual style for Breath of the Wild":
  https://zeldauniverse.net/2017/03/14/takizawa-explains-how-the-wind-waker-hd-inspired-the-visual-style-for-breath-of-the-wild/
- Thumbsticks, "GDC17: Designing Zelda: Breath of the Wild": https://www.thumbsticks.com/gdc17-designing-zelda-breath-of-the-wild/
- Nathan Gordon, "Wind. Wind Waker Graphics Analysis Series" (Medium): https://medium.com/@gordonnl/wind-f4fc7a3b366a
- Nathan Gordon, "The Ocean. Wind Waker Graphics Analysis Series" (Medium): https://medium.com/@gordonnl/the-ocean-170fdfd659f1
- three.js forum, "How would I go about creating wind lines?": https://discourse.threejs.org/t/how-would-i-go-about-creating-wind-lines/68280
- Zelda Wiki, "Thunderstorm": https://zeldawiki.wiki/wiki/Thunderstorm
- Zelda Wiki (Fandom), "Rain": https://zelda.fandom.com/wiki/Rain

- GDC Vault, Eric Wohllaib, "Procedural Grass in Ghost of Tsushima" (abstract): https://gdcvault.com/play/1027214/Advanced-Graphics-Summit-Procedural-Grass
- Game Developer, "Using vorticles to simulate wind in Ghost of Tsushima": https://gamedeveloper.com/design/using-vorticles-to-simulate-wind-in-i-ghost-of-tsushima-i-
- Cain Rademan, stylized grass (ArtStation): https://cainrademan.artstation.com/projects/QndNax
- 80.lv, "Guide: Unity Grass Shader": https://80.lv/articles/guide-unity-grass-shader/
- Unreal Engine forums, "BotW grass style": https://forums.unrealengine.com/t/botw-grass-style/437647
- Polycount discussion: https://polycount.com/discussion/comment/2583208
- Walden.org, Thoreau's journal, 14 June 1852: https://www.walden.org/log-entry/14-june-1852-concord-mass
- POV-Ray newsgroup on grass: https://news.povray.org/3ca60dc4%40news.povray.org
- Animation Obsessive, "Defining the World of My Neighbor Totoro": https://animationobsessive.substack.com/p/defining-the-world-of-my-neighbor
- Animation Obsessive, "What Kazuo Oga Thinks About When He Thinks About Backgrounds": https://animationobsessive.substack.com/p/what-kazuo-oga-thinks-about-when

- Artpublika, "The artistic adventure that is Legend of Zelda: Breath of the Wild": https://www.artpublikamag.com/post/the-artistic-adventure-that-is-legend-of-zelda-breath-of-the-wild
- TweakTown, "Breath of the Wild art-style explained": https://www.tweaktown.com/news/63954/legend-zelda-breath-wild-art-style-explained/index.html
- Nintendo Everything, art director on Breath of the Wild's look: https://nintendoeverything.com/art-director-on-why-zeldas-art-style-constantly-changes-and-how-breath-of-the-wilds-look-was-made/
- Fine Art Tutorials, gouache landscape: https://finearttutorials.com/?p=10133
- Polycount, stylized trees: https://polycount.com/discussion/comment/2677432
- three.js forum, "Creating white breezy effect": https://discourse.threejs.org/t/creating-white-breezy-effect-seeking-guidance-and-insights/55552
- Game Developer, "Recreating the Zelda VFX in Unity": https://www.gamedeveloper.com/art/recreating-the-zelda-vfx-in-unity

**Read but thin:** Zelda Dungeon's summary of a Polycount analysis (the analysis itself is linked, not reproduced); Zelda
Dungeon's "Analyzing The Wind Waker's Art Style" (nothing on wind, sky or weather).
**Not read:** Wikipedia's Okami page (the fetch timed out); its facts here come from the Cel shading page. Roystan's
grass shader guide itself (the permission to fetch it lapsed); 80.lv's summary of it is cited instead.
