# The Ringworld's Sprites: Less Cartoony, Billboards, and a Wider Library

**What Ruby asked (2026-10-20).** "Please continue to expand this library … to create a wider variety of things."
"Some objects that are like five square things in a row … I don't even know what it's supposed to be." "All of the old
sprites should be looked at to make sure they have similar detail levels to new ones, and the old ones should all have
slightly more detail in general." "A wider variety of billboards and have them be somewhat tongue in cheek, referencing
fake brands or other things that rarely appear." "Like the banana? That should be something… less cartoony. A slightly
less cartoony art style for some of these sprites would be really helpful."

**What was built from it** (paintKit.js, stepsRing.js):
- **The finish** (Part A §2.6, §3): every face shaded from the sky down to the ground (lighter at its top, darker at
  its foot where the sky can't reach), a shadow cast on the ground away from the light, weather streaking down walls,
  materials of their own (wood, stone, brick, rust, paint, galvanised steel) lit by the scene's light instead of one
  grey; windows that hold the sky by day and are lit in clusters by night, with sills and lintels where near (§4);
  crowns of leaf clumps with ragged edges and sky holes instead of balls (§3, Rung C); trunks that flare and carry
  bark; boulders of many facets with cracks, lichen and grass at their foot. No faces on anything (§2.3, §5).
- **The five squares in a row** were the wilds' standing stones, drawn as plain slabs side by side at the size of the
  builders' works. They are now a stone circle at true scale (Part C §2): stones of two and a half to seven metres round
  a ring fifteen to fifty-five metres across, each standing where it stands in the world, some gone, one fallen, some
  joined by lintels; each stone rough, tapering and leaning, lichened, cracked (pkStone, pkLintel).
- **The old sprites** brought up to the new: the city's towers (lobbies, piers, crowns, shopfronts under awnings, fire
  escapes, cornices, pilotis, colonnades and porticos), the houses and farm buildings, the landmarks, the trees.
- **Boards** (Part B): thirty-eight original designs and four serial verses, on the board each world would put up,
  beside the roads (pkBoard, PK_BOARDS, PK_SERIALS); the moon mascot is gone.
- **The library** (Part C): forty-odd new small things by world, sixteen vernacular buildings chosen by region and
  climate (one tradition to a settlement, PK_VERNACULAR), poles carrying wires along the roads.

## Part A. Less cartoony, more grown-up: style rules for a procedural flat-shaded painter

Scope: a 2D canvas painter that builds a ring-world landscape from flat polygons, ellipses, lines and radial glows (no bitmaps). Sprites are 10 to 200 px tall and seen through haze at many distances. Goal: a slightly less cartoony style, and an even detail level across old and new sprites.

Tagging: [src URL] means the claim was read on that page during this research. [est] means it is my own inference or a suggested number, not a sourced fact. Most of the numeric rules are [est]: they turn sourced principles into parameters, and they need tuning by eye.

---

### 0. Diagnosis: why the current sprites read as cartoony

1. **Baby-schema cues.** Big round head, large eyes, small nose and mouth, short thick limbs and a plump body are the measured triggers for "cute" [src https://pmc.ncbi.nlm.nih.gov/articles/PMC3260535/]. The same paper notes that the film, toy and advertising industries exploit these cues, and that line drawings and schematic faces trigger them too [src https://pmc.ncbi.nlm.nih.gov/articles/PMC3260535/]. A crescent with a face is exactly this: a simple rounded shape plus a schematic face. At small size the face disappears first, which leaves a yellow curved blob, hence "banana" [est].
2. **Round shapes dominate.** Circles read as friendly, innocent, soft and safe, and suit mascots and comic relief [src https://pixune.com/blog/shape-language-technique/]. Rounded forms read as friendly or safe, and irregular forms read as less "designed" [src https://rocketbrush.com/blog/shape-language-in-game-character-design-how-to-make-characters-readable-and-consistent]. Ellipse-heavy primitives push everything toward "cute" by default [est].
3. **Iconic figures in a less iconic world.** McCloud's "masking" effect pairs simple, archetypal characters with detailed realistic backgrounds, and the simple character invites identification [src https://en.wikipedia.org/wiki/Understanding_Comics]. Ligne claire is defined in part by "cartoonish characters" set against a "realistic background" [src https://en.wikipedia.org/wiki/Ligne_claire]. So if the landscape is hazy and naturalistic but the robots and mascots are iconic, the mismatch itself reads as cartoon [est].
4. **Perfect symmetry, even spacing and identical repeats.** Townscaper deliberately uses an irregular grid because its "organic nature ... breaks up the repetition of the tiling", and credits the "randomly-shaped grid" with its "naturalistic feel" [src https://mcvuk.com/business-news/when-we-made-townscaper].
5. **Saturated, high-key flat fills with no light logic.** Firewatch's stated aim was "realism through stylised graphics", using flat shapes with abstract internal detail plus colour layers and fog for depth [src https://www.thumbsticks.com/gdc-2015-the-art-of-firewatch]. Flatness alone is not the problem. Flatness without a consistent light, value and atmosphere system is [est].
6. **Missing grounding.** The occlusion shadow at a contact point is the darkest shadow in a scene [src https://diannemize.substack.com/p/what-do-we-know-about-shadows]. Without it, sprites look pasted on, like stickers [est].

---

### 1. What the references actually contribute

| Reference | Takeaway for this painter | Tag |
|---|---|---|
| Firewatch (Jane Ng GDC 2015, Olly Moss) | Flat shapes with strong, distinctive silhouettes and abstract internal details. Bold colour in distinct layers creates depth. The sky sets most of the colour. Fog adds depth. More texture detail marks narratively important objects. | [src https://www.thumbsticks.com/gdc-2015-the-art-of-firewatch] |
| Firewatch sky shader | Sky is a 3-colour gradient (top, half, bottom) plus separate sun disc, sun halo and horizon halo layers, added together. | [src https://blog.camposanto.com/post/112703721804/this-blog-post-is-an-in-detail-explanation-of-a] |
| Firewatch production | The goal was to make the game feel real, not to make hyper-detailed assets. Objects were scaled by what felt right, not by accurate size. 23 hand-made trees. | [src https://80.lv/articles/creating-the-world-of-firewatch/?amp=1] |
| Olly Moss posters (secondary blog analysis) | Limited colour per ground zone. Each forest row is a different hue. Dark foreground, lighter background. Buildings take the palette of the trees around them. | [src https://blogs.ulster.ac.uk/cormacmccann/2021/02/26/ixd104-olly-moss] [src https://blogs.ulster.ac.uk/bethbuchanan/2021/03/05/ixd104-further-looking-into-the-art-of-firewatch] |
| Eyvind Earle (Sleeping Beauty) | Detail is tied to light: "Where a streak of light crosses a tree, you'll suddenly see this ornate bark", and trunks in shadow are simpler (Pete Docter). Deep, rich, analogous colours that "vibrate" (Mike Giaimo). Medieval, tapestry and manuscript sources. | [src https://d23.com/sleeping-beauty-stunning-art/] |
| Earle technique (secondary) | Shapes run along horizontals and verticals. Block in large dark shapes first, then work up from darkest greys to the smallest, brightest highlights. Opaque marks with slightly broken edges, plus speckle texture. | [src https://zoungyart.substack.com/p/painting-in-the-style-of-sleeping] |
| Kazuo Oga (Ghibli) | "Extracts the essence of important elements", aiming to "get the essential point across effectively". | [src https://animationobsessive.substack.com/p/what-kazuo-oga-thinks-about-when] |
| Oga on Totoro | Painted plants as identifiable species, not vague weeds. "Subdued but beautiful" colours. Warm, soft colours instead of harsh primaries. Light changes the colour of a pillar. | [src https://animationobsessive.substack.com/p/defining-the-world-of-my-neighbor] |
| Syd Mead | "Everything looks a certain way because of the history of its use." Even in fantasy, "there must be a logic". | [src https://www.indexmagazine.com/interviews-syd-mead] |
| Fallout art book | Leaning too far toward 1950s retro gives "something campy and unrealistic". Show "a layer of years of decay and grime". Machines should look "authentic and mechanically sound". | [src https://fallout-archive.fandom.com/wiki/The_Art_of_Fallout_3] |
| Moebius | Late work: "the figures are always small" and "the landscapes are always enormous". Empty space is treated as actively as filled space. A clean line without hatching. | [src https://whatnotmark.substack.com/p/line-between-worlds] |
| Sable | Flat shading, with depth carried by lighting, fog and lines. Outlines fade in opacity with distance. Detailed "islands of content" separated by sparse dunes. | [src https://www.gamedeveloper.com/marketing/how-shedworks-refined-the-art-of-sable-in-pursuit-of-readability] |
| Kentucky Route Zero | "Universally dull and muted colour palette". | [src https://www.pcgamer.com/uk/welcome-to-the-zero-the-making-of-kentucky-route-zeros-open-road] |
| Kentucky Route Zero (theatre) | Theatre scripts shaped the "treatment of space, lighting and movement". | [src https://en.wikipedia.org/wiki/Kentucky_Route_Zero] |
| Alto's Adventure / Odyssey | Built explicitly to avoid the "cartoon-y kind of look" of mobile games. | [src https://80.lv/articles/altos-adventure-a-game-with-style] |
| Alto's Odyssey (Harry Nesbitt) | "Minimalist, impressionistic", "stripping away the noise". | [src https://www.cgmagonline.com/interviews/interview-with-the-team-behind-altos-odyssey] |
| Tom Haugomat | Pared-back palette with graininess. | [src https://www.itsnicethat.com/articles/tom-haugomat] |
| Haugomat interview | "Muted tones, the soft light, the stillness". Likes things "rough, textured and alive". | [src https://www.spherelife.com/interviews/5-minutes-illustrator-tom-haugomat] |
| Charley Harper | "Count the wings, not the feathers": flat planes of contained colour, but checked against field guides so the result stays naturalistic. | [src https://www.audubon.org/magazine/january-february-2008/counting-wings] |
| WPA park posters | Serigraphs made 1938 to 1941. | [src https://www.npr.org/transcripts/314941202] |
| WPA print process | One colour per screen, added separately and registered. Art deco, "clean, simple designs of iconic park images". | [src https://nationalparktraveling.com/listing/history-of-national-park-posters/] |
| Townscaper | An irregular grid breaks repetition. A gap between two colours marks the border between houses. | [src https://mcvuk.com/business-news/when-we-made-townscaper] |
| Bad North | Deliberately "adorable" storybook watercolour. This is what to avoid if the goal is less cute. | [src https://gamesbeat.com/bad-north-shows-that-even-bloody-viking-battles-can-be-artsy-and-cute/] |
| Old Man's Journey | GDC talk abstract only: a hand-drawn 2D style kept crisp across resolutions. | [src https://www.gdcvault.com/play/1024236/] |
| Halo | No accessible source found on its art-direction rules (the book page only lists contents). Halo is not used below. | [src https://www.halopedia.org/The_Art_of_Halo] |

---

### 2. Core rules

#### 2.1 Shape and silhouette

- **Use the dominant-shape rule, but make the dominant shape angular or irregular.** Most good designs mix shape languages and keep one dominant shape [src https://pixune.com/blog/shape-language-technique/]. For a grown-up read, man-made things should be dominantly rectilinear with few curves, and natural things irregular. Keep perfect circles and ellipses to minor parts: wheels, lamps, glows [est].
- **Contrast straights against curves.** "Using straights against curves create interest and elegance by magnifying contrast", and good art balances both [src https://www.animatedspirit.com/straights-curves]. Rule: every rounded form gets at least one straight edge, such as a flat base, a cut top or a straight trunk, and every boxy form gets at least one soft element [est].
- **Never draw a silhouette from a pure primitive.** Build tree crowns from 5 to 9 overlapping lobes, with radii varied by ±25% and centres jittered. Break rooflines with a chimney, vent, antenna or parapet step. Displace rock outlines with 2 to 4 irregular facets [est]. Slynyrd's cityscape tutorial: build from "simple geometry and few but precise angles", but break straight lines with variation on organic subjects [src https://www.slynyrd.com/blog/2019/2/23/pixelblog-14-cityscapes].
- **Make every sprite pass a grayscale test.** It should read in grayscale, at a distance and in motion. A weak silhouette cannot be fixed by adding detail [src https://rocketbrush.com/blog/shape-language-in-game-character-design-how-to-make-characters-readable-and-consistent]. Implementation: render each sprite type at 12 px as a single flat value and check it is still identifiable [est].
- **Avoid perfect symmetry.** Make each instance asymmetric by 3 to 8% in width per side, tilt by ±1 to 3° for natural things, and keep man-made verticals at 0° but vary heights [est].
- **Choose a good camera relationship.** Sprites should mostly sit on horizontals and verticals, as in Earle [src https://zoungyart.substack.com/p/painting-in-the-style-of-sleeping]. Cartoon "squash" tilts and bulges should go [est].

#### 2.2 Proportions

- **Human figures.** An average figure is 7.5 heads tall and an idealised one 8 heads [src https://www.proko.com/human-figure-proportions-average-richer]. Rule: figures at 7 to 8 heads, so a 20 px person has a head under 3 px. Chunky 3 to 4 head figures are the main cartoon tell [est].
- **Robots and machines.** Give robots industrial proportions: head (sensor housing) at most 1/6 of total height, limbs thinner than the torso, visible joints, and a low centre of mass for heavy units [est]. Proportions communicate role, for example wide blocky bodies with a low centre of gravity for heavy units [src https://rocketbrush.com/blog/shape-language-in-game-character-design-how-to-make-characters-readable-and-consistent]. Machines should look "mechanically sound" [src https://fallout-archive.fandom.com/wiki/The_Art_of_Fallout_3].
- **Buildings and props.** Keep door height at roughly 1.15 to 1.3 times human height, window sills about 0.5 to 0.6 times human height above the floor, and storey height about 1.6 to 1.8 times human height [est]. Cartoon buildings use oversized doors and windows, and real proportions make windows small relative to walls [est]. Familiar size is a depth cue: when the real size of an object is known, its apparent size tells you its distance [src https://perspectiveresearchcentre.com/depth-cues/]. So wrong door, window and person ratios break the sense of distance [est].
- **Scale for feel, not accuracy.** Firewatch scaled objects by what felt right, not what was accurate [src https://80.lv/articles/creating-the-world-of-firewatch/?amp=1]. Keep ratios consistent within one sprite class even if the absolute scale is fudged [est].
- **Small figures, big world.** Following Moebius, "the figures are always small" and "the landscapes are always enormous" [src https://whatnotmark.substack.com/p/line-between-worlds]. Keep mascot and figure sprites small relative to the landscape [est].

#### 2.3 Faces and mascots

- **No faces on mascots or objects.** Baby-schema faces are what make a thing cute [src https://pmc.ncbi.nlm.nih.gov/articles/PMC3260535/]. Remove eyes and mouths from crescents, suns, robots and products. Give robots sensor clusters instead: 1 to 3 small lit points or a horizontal visor slit, placed off-centre or asymmetric [est].
- **Human faces at small sizes.** Under 40 px figure height, draw no facial features at all: the head gets just a lit side and a shadow side. From 40 to 200 px, show only a darker eye-socket band and a lit cheek or nose plane, never round eyes or highlights [est].
- **Replace character mascots with one of these** [est]:
  - a figure seen in silhouette or from three-quarters behind, with no face (Haugomat-like framing, where the viewer stands behind the figure [src https://www.spherelife.com/interviews/5-minutes-illustrator-tom-haugomat]);
  - a painted product shot (see section 6);
  - a geometric logo mark: a crescent as a clean glyph, not a character;
  - the celestial object rendered as an object, such as a moon as a lit sphere with a terminator.

#### 2.4 Value structure

- **Use three value families and never weight them equally.** Group values into lights, mid-tones and darks, never in "1/3-1/3-1/3 proportions", and let one family dominate. Lights and darks do the structural work, and mid-tones are a foil [src https://www.outdoorpainter.com/designing-your-paintings-with-values-along-with-some-tips-on-scene-selection/]. Rule per sprite: about 60% mid, 25 to 30% shadow, 10 to 15% light, with the highlight under 5% [est].
- **Block in dark shapes first and finish with the smallest, brightest highlights**, as Earle did [src https://zoungyart.substack.com/p/painting-in-the-style-of-sleeping]. For the painter, the draw order per sprite is base shadow silhouette, then lit planes, then accents, then highlights [est].
- **Do not add texture until the value structure is set**, and never let texture disrupt the value relationships [src https://www.outdoorpainter.com/designing-your-paintings-with-values-along-with-some-tips-on-scene-selection/]. Rule: texture marks stay within ±6% of the value of the plane they sit on [est].
- **Weld shapes into large masses.** Related shapes of one value can merge into "super shapes", such as a stand of pines and its cast shadow [src https://www.outdoorpainter.com/designing-your-paintings-with-values-along-with-some-tips-on-scene-selection/]. For clusters of trees or buildings beyond mid-distance, draw one merged silhouette rather than separate outlined objects [est].

#### 2.5 Colour

- **Use subdued, analogous palettes.** Oga used "subdued but beautiful (kirei) colors", warm and soft rather than harsh primaries [src https://animationobsessive.substack.com/p/defining-the-world-of-my-neighbor]. Kentucky Route Zero is "universally dull and muted" [src https://www.pcgamer.com/uk/welcome-to-the-zero-the-making-of-kentucky-route-zeros-open-road]. Haugomat uses a pared-back palette [src https://www.itsnicethat.com/articles/tom-haugomat]. Earle's colours are "deep, rich, analogous" [src https://d23.com/sleeping-beauty-stunning-art/].
  - Base fills sit at HSL saturation 20 to 55%. Above 70% is reserved for small emissive accents such as lamps, neon and signal lights [est].
  - Never pair high saturation with high lightness. Slynyrd advises avoiding high saturation together with high brightness [src https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes].
- **Hue-shift every shading ramp.** Slynyrd uses a positive hue shift of up to 20° per step and says "20 is about as high as I go". Positive shift, warming as colours brighten, "usually results in more natural colors". Saturation peaks mid-ramp and never reaches 0 or 100 [src https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes]. Skipping hue shift can look muddy or grey in warm daylight [src https://blog.usesession.com/blog/ardouradvice/766774775809032192]. Concrete defaults for a sunlit scene [est]:
  - **Shadow plane:** hue rotated 10 to 20° toward blue (about 220 to 240°), lightness −22 to −32 points, saturation −5 to +5 (do not grey out).
  - **Lit plane:** hue rotated 5 to 12° toward warm (about 40 to 50°), lightness +8 to +14 points, saturation −5.
  - **Highlight:** lightness +20, saturation −15, only on top-facing edges.
  - **Bounce or reflected light in shadow:** lerp the shadow 15 to 25% toward the ground colour, only on the lower third of a shadowed face.
- **Warm light, cool shadow is a default, not a law.** Warmer light gives cooler shadows, because the warm wavelengths are blocked [src https://streamlinepublishing.com/inside-art/does-warmer-light-have-cooler-shadows/]. Asked about the rule, Gurney answered "it all depends", and a commenter notes that cool north light gives warm-reflected shadows [src https://gurneyjourney.blogspot.com/2010/02/light-and-form-part-1_15.html?m=1]. Rule: derive the shadow hue from the scene's sky colour and the lit hue from the sun colour, rather than hardcoding blue and orange. At night, invert: emissive light is warm and ambient light is cool [est].
- **The sky drives the palette.** In Firewatch "the biggest chunk of colour is actually determined by the sky" [src https://www.thumbsticks.com/gdc-2015-the-art-of-firewatch]. Rule: every sprite's shadow colour and haze colour come from the current sky gradient [est].
- **Use colour-zone discipline.** Give each depth band or zone its own restricted hues, and make man-made objects share the palette of their surroundings so there are no "opposing or odd colours" [src https://blogs.ulster.ac.uk/cormacmccann/2021/02/26/ixd104-olly-moss]. Rule: building and robot base colours are drawn from the biome palette, shifted by at most 30° in hue, and only signage or emissive points break out [est].
- **Separate adjacent same-family colours.** In Townscaper a small gap marks the border where two colours meet [src https://mcvuk.com/business-news/when-we-made-townscaper]. Rule: put a 1 px darker seam between adjacent buildings or panels instead of an outline [est].

#### 2.6 Light, shadow and grounding

- **Draw every object with three shadow components** [est, based on the shadow types at https://diannemize.substack.com/p/what-do-we-know-about-shadows]:
  1. **Occlusion or contact band.** This is the darkest value in the sprite, at the contact point, where "all light is shut out" [src https://diannemize.substack.com/p/what-do-we-know-about-shadows]. Implementation: a flattened ellipse or band at the base, 1 to 2 px tall below 60 px sprite height, at roughly 75 to 90% of the shadow plane's lightness. Make it darker and narrower directly under the object, then fade it out sideways [est]. Contact shadows exist in engines to "harden shadow contact points" [src https://dev.epicgames.com/documentation/unreal-engine/contact-shadows-in-unreal-engine].
  2. **Form shadow.** One side plane, consistent with the global sun direction [est].
  3. **Cast shadow.** Draw this only above about 20 px. It is a skewed polygon in the sun direction, coloured like the sky-tinted shadow, with a hard edge near the object and softer further away [est].
- **Light trees from the outside in.** Foliage is "lightest at its outer and upper edges" and "darkest at its base or its core" [src https://gurneyjourney.blogspot.com/2015/12/foliage-is-lightest-at-its-outer-edges.html]. Rule: paint each crown lobe dark core first, then a lighter rim on its upper and sun-side edge [est].
- **Make sky holes in foliage few, darker and softer than the sky.** Don't paint them in the sky colour, or they look "like Christmas lights". Use "a few strategically placed sky holes", each with at least one soft edge [src https://www.artistsnetwork.com/art-mediums/pastel/pastel-techniques-painting-tips-for-sky-holes]. Rule: 0 to 3 holes per crown, value about 12% darker than the sky behind, and only on crowns over 30 px [est].
- **Put detail only where light falls.** Earle's ornate bark shows where light crosses a tree, and shadowed trunks are simpler [src https://d23.com/sleeping-beauty-stunning-art/]. Rule: texture marks are drawn only on lit planes, and shadow planes stay flat [est]. This is also a cheap way to reduce noise [est].

#### 2.7 Edges and outlines

- **Avoid uniform dark outlines.** Ligne claire, with strong clear lines and cartoonish characters, is the comic-book tradition [src https://en.wikipedia.org/wiki/Ligne_claire]. Rule: no black outlines. Where separation is needed, use a 1 px edge in the darker local colour, only on the shadow side [est].
- **If lines are used, fade them with distance.** Sable's outlines fade in opacity with distance to support perspective [src https://www.gamedeveloper.com/marketing/how-shedworks-refined-the-art-of-sable-in-pursuit-of-readability]. Suggested line alpha: 1.0 under 0.2 of max distance, falling to 0 by 0.6 [est].
- **Soften edges with distance.** Distant edges "appear soft" and foreground edges stay crisp [src https://finearttutorials.com/guide/atmospheric-perspective/]. Rule: beyond mid-distance, draw an extra 1 px halo at 30 to 40% alpha in the haze colour around the silhouette, or draw the silhouette twice, the second time slightly inflated and at low alpha [est].
- **Vary edge type within a sprite.** Use a hard edge where a lit plane meets the sky, and a softer or lost edge where a shadow plane meets a similar-value background [est]. The Earle technique notes recommend opaque marks with "slightly broken edges" [src https://zoungyart.substack.com/p/painting-in-the-style-of-sleeping].

#### 2.8 Texture through small irregular marks

- **Use grain and roughness, not smooth vector fills.** Haugomat's work has "graininess" [src https://www.itsnicethat.com/articles/tom-haugomat], and he likes things "rough, textured and alive" [src https://www.spherelife.com/interviews/5-minutes-illustrator-tom-haugomat]. For digital Earle-style work, use speckle brushes [src https://zoungyart.substack.com/p/painting-in-the-style-of-sleeping].
- **Implementation** [est]:
  - Per lit plane, scatter N = area / 40 to area / 80 marks: 1 to 2 px dabs or short strokes aligned to the material (vertical for bark and rain streaks, horizontal for planks and strata), at ±4 to 6% value.
  - Seed the marks from the sprite instance id so they don't shimmer frame to frame.
  - Cluster marks rather than spreading them uniformly. Use 2 or 3 clusters per plane, with emptier areas between them [est]. Sable's "islands of content" separated by sparse areas is the same idea at world scale [src https://www.gamedeveloper.com/marketing/how-shedworks-refined-the-art-of-sable-in-pursuit-of-readability].
  - Add a whole-canvas grain overlay at 2 to 4% alpha so flat fills stop looking like clean vector art [est].
- **Weathering tells you the object has a history.** Mead: things look the way they do "because of the history of its use" [src https://www.indexmagazine.com/interviews-syd-mead]. Fallout uses "a layer of years of decay and grime" [src https://fallout-archive.fandom.com/wiki/The_Art_of_Fallout_3]. Rules [est]:
  - Streaks under sills and vents: 1 px wide, 3 to 8 px long, 6 to 10% darker.
  - A darker band at the bottom 8 to 12% of walls (splash zone).
  - Lighter, desaturated tops on sun-facing surfaces.
  - Rust and dirt concentrated at joints.
- **Use real species and real materials.** Oga painted identifiable species instead of vague weeds [src https://animationobsessive.substack.com/p/defining-the-world-of-my-neighbor]. Harper simplified but checked against field guides [src https://www.audubon.org/magazine/january-february-2008/counting-wings]. Rule: each tree type should copy one real species' silhouette logic: conifer tiers, oak lobes, palm fronds, birch with white bark [est].

#### 2.9 Variation of repeated elements

Townscaper's irregular grid is what gives it a naturalistic look [src https://mcvuk.com/business-news/when-we-made-townscaper]. Suggested jitter per instance, seeded [est]:

| Property | Natural (trees, rocks, grass) | Man-made (buildings, poles, signs) |
|---|---|---|
| Size | ±12 to 20% | ±5 to 10% height, width from a small set |
| Lean or rotation | ±2 to 4° | 0° (vertical), occasional ±1° on old poles |
| Hue | ±4 to 8° | ±3° within one palette slot |
| Value | ±4 to 7% | ±3 to 5% |
| Spacing | 25 to 40% jitter, clustered (Poisson-disk plus clumping) | 10 to 20% jitter, with occasional gaps |
| Sub-element count | e.g. 5 to 9 crown lobes | e.g. 0 to 3 roof props |

- **Never repeat the same sprite variant twice in a row.** Keep at least 4 variants per class on screen [est].
- **Vary repeats within a single sprite too.** Window lighting, panel seams and fence posts all get small jitter [est].

#### 2.10 Atmospheric perspective

Sourced rules:
- Distant objects are paler, closer in value to the sky, lower in contrast, less saturated, bluer, softer-edged and less detailed [src https://finearttutorials.com/guide/atmospheric-perspective/].
- At sunset, against a bright warm sky, distant objects can turn warmer and lighter, or appear as dark silhouettes against a low sun [src https://finearttutorials.com/guide/atmospheric-perspective/].
- The perception literature describes aerial perspective as far objects being "less sharp, lower in contrast, and may shift in hue" [src https://perspectiveresearchcentre.com/depth-cues/].
- In Firewatch, colours lighten toward the horizon [src https://blogs.ulster.ac.uk/bethbuchanan/2021/03/05/ixd104-further-looking-into-the-art-of-firewatch]. Fog was used to create depth and distance [src https://www.thumbsticks.com/gdc-2015-the-art-of-firewatch].
- For distant buildings, keep the light-to-dark range to about "two to three value steps" and use "no more than three or four" distinct shapes [src https://cypaint.com/article/how-to-paint-buildings-in-the-distance]. This is a lower-authority hobby site, so treat it as a starting point.

Implementation [est]:
- **Haze factor.** h = 1 − exp(−d / D), where D is tuned per biome. The final colour is mix(paintedColour, hazeColour, h). The haze colour is the sky's horizon colour from the Firewatch-style 3-colour gradient.
- **Contrast compression.** Multiply each sprite's internal value deltas (lit minus shadow) by (1 − 0.8h). This matters more than tinting: a hazed sprite that keeps full internal contrast still reads as a sticker.
- **Detail culling.** Choose the detail rung (section 3) from on-screen height multiplied by (1 − 0.5h). Hazed sprites drop a rung early.
- **Line and outline alpha.** Multiply by (1 − h)² [est], following Sable's approach [src https://www.gamedeveloper.com/marketing/how-shedworks-refined-the-art-of-sable-in-pursuit-of-readability].

#### 2.11 Detail density and focus

- **Spend texture on objects that matter.** In Firewatch, more texture detail marks objects important to the story [src https://www.thumbsticks.com/gdc-2015-the-art-of-firewatch]. Rule: billboards, landmarks and interactive props get one rung more detail than ambient filler of the same size [est].
- **Texture density follows distance.** Surface detail becomes "progressively smaller and more densely packed" as a surface recedes [src https://perspectiveresearchcentre.com/depth-cues/]. In a painter this works only if the marks also shrink and merge into a tone. Below a mark size of about 1 px, replace the marks with a flat average tone rather than drawing sub-pixel noise [est].
- **Count the wings, not the feathers** [src https://www.audubon.org/magazine/january-february-2008/counting-wings]. At each size, render the countable large parts (wings, windows rows, branches, limbs) and never the uncountable small parts (feathers, bricks, leaves) [est].
- **Treat empty space as active.** Moebius treated empty space as actively as filled space [src https://whatnotmark.substack.com/p/line-between-worlds]. Alto strips away the noise [src https://www.cgmagonline.com/interviews/interview-with-the-team-behind-altos-odyssey]. Rule: give an equal detail level per size, not equal detail per sprite. Leave rest zones between clusters [est].

---

### 3. Detail ladder by on-screen height

Use on-screen pixel height after haze adjustment (section 2.10). Every sprite class, old or new, should implement all four rungs, which is how detail levels stay even across the set [est]. The principles come from the sources above. The thresholds are [est].

#### Rung A: under 8 px (silhouette and signal)
- 1 to 3 polygons. The silhouette must still be irregular: 1 notch or step, with no perfect ellipses [est].
- A single value plus haze. Optionally one darker pixel row at the base if the sprite is at least 4 px wide (the occlusion contact) [est].
- At most one signal accent: a lit window pixel, a lamp glow or a sign colour patch, sized at least 1 px with no sub-pixel specks [est].
- No outlines, faces, text or texture marks [est].
- Merge neighbours of similar value into one mass, following the "super shapes" idea [src https://www.outdoorpainter.com/designing-your-paintings-with-values-along-with-some-tips-on-scene-selection/].

#### Rung B: 8 to 20 px (two planes and grounding)
- **Two-plane lighting.** Draw a lit face and a shadow face with hue-shifted ramps (section 2.5). For trees, use a dark core with a lighter upper-outer rim [src https://gurneyjourney.blogspot.com/2015/12/foliage-is-lightest-at-its-outer-edges.html].
- **Contact band.** 1 px, the darkest value in the sprite [src https://diannemize.substack.com/p/what-do-we-know-about-shadows].
- **Silhouette breakers.** 2 to 4 per sprite: chimney, antenna, branch tip, roof step, sensor mast [est].
- **Man-made accents.** At most 3 marks, such as a door as one dark vertical rectangle and a window row as 1 px dashes with gaps. A window becomes a separate rectangle only once it is at least 2×2 px [est].
- **Figures.** 7 to 8 heads (section 2.2). The head is a single colour [est].
- **Signage.** A coloured rectangle with one value-contrast blob for the "image" and one lighter bar for the "text". No letters [est].

#### Rung C: 20 to 60 px (structure)
- **Add a cast shadow polygon.** Add reflected light on the lower third of shadow planes [est].
- **Draw window grids as irregular lit and unlit patterns.**
  - Each window is a rectangle of at least 2×3 px, with sills implied by a 1 px lighter top edge on the wall below [est].
  - Unlit windows are not black. They reflect the sky and neighbours, and windows get lighter and more reflective higher up a building [src https://streamlinepublishing.com/inside-art/summer-in-the-city/]. Rule: unlit glass = mix(sky colour, wall shadow colour, 0.5), with lightness rising 3 to 5% per storey [est].
  - Lit windows are clustered by floor or unit rather than uniformly random. Use a Markov run along each floor with p(stay) ≈ 0.7, and vary lit-window warmth by ±10° hue (mixed bulb types) [est].
  - Don't paint every window. Suggest them [src https://streamlinepublishing.com/inside-art/summer-in-the-city/].
  - In darker areas, merge windows into a few vertical strokes [est].
- **Doors.** A frame (1 px lighter or darker), a step or threshold band, and an optional awning shadow band above [est].
- **Foliage.** 3 to 7 lit clumps on a dark mass, plus 0 to 2 sky holes darker than the sky [src https://www.artistsnetwork.com/art-mediums/pastel/pastel-techniques-painting-tips-for-sky-holes].
- **Texture marks** on lit planes only (section 2.8) [src https://d23.com/sleeping-beauty-stunning-art/].
- **Signage.** Show a headline only if cap height is at least 5 px, using block capitals and a single word. Otherwise use a value bar. Image areas use 3 values [est].
- **Robots.** Panel seams as 1 px darker lines on the shadow side only, joints as small darker gaps, and a sensor as 1 to 3 lit points [est].

#### Rung D: 60 to 200 px (material and history)
- **Windows.** Mullions or transoms (1 px, frame colour) when a window is at least 4 px wide. Partial curtains or blinds: a random 20 to 60% fill of a slightly warmer value. One specular glint on 10 to 20% of glass panes, oriented to the sun. Sills with a 1 px underside shadow [est].
- **Weathering.** Streaks under sills, a dark splash band at the base, lighter sun-bleached tops, rust at joints [src https://fallout-archive.fandom.com/wiki/The_Art_of_Fallout_3] [est for the specifics].
- **Small believable props.** Gutters, downpipes, vents, AC boxes, cable runs, utility meters, bolts, guard rails. Each prop should answer "what is this for" [src https://www.indexmagazine.com/interviews-syd-mead].
- **Legible typography** on signs, plus small print stand-ins (thin lighter bars) under the headline [est].
- **Bark and grain detail** only where sunlight strikes [src https://d23.com/sleeping-beauty-stunning-art/].
- **Figures.** Clothing folds as 2 to 3 value planes, hands as single shapes, faces as planes (section 2.3) [est].
- **Secondary light.** Bounce light from the ground on undersides and warm spill from lit windows onto adjacent walls (radial glow at 10 to 15% alpha) [est].

#### Calibrating old simple sprites
For each legacy sprite, list what it draws at each rung and add whatever is missing. In practice the usual gaps are [est]:
- the contact band;
- a second plane;
- silhouette breakers;
- texture marks on the lit plane;
- haze contrast compression.

A sprite "passes" when a strip of all sprite classes rendered side by side at 16, 40 and 120 px has a similar count of distinct value regions per 100 px² [est].

---

### 4. Drawing small human-made things believably

- **Windows** [est]:
  - Use real ratios: residential windows are about 0.5 to 0.7 times human height wide.
  - Space windows regularly but not perfectly: storeys are equal, but the end bays and ground floor differ (shopfront, garage, door).
  - Ground floors are taller and different.
  - The top floor or roof has equipment.
- **Window clustering and reflection.** See Rung C. Rarely black, lighter higher up [src https://streamlinepublishing.com/inside-art/summer-in-the-city/].
- **Doors.** Off-centre on most building types, at human-relative height (section 2.2). Draw the step or threshold band [est].
- **Signage** [est]:
  - Rectangular boards with a visible frame, mounting posts or brackets, and lamp arms on billboards.
  - At small sizes, render signs as value structure (dark field, light bar), never as fake squiggle text.
  - Text appears only when the letters can be legible.
- **Vehicles.** Lower and longer than cartoon cars, with wheels about 1/3 of body height or less, a darker window band, and a contact band under each wheel [est].
- **Poles, wires and rails.** These are the cheapest "grown-up" signal. Thin 1 px verticals and catenary curves between poles, with slight sag variation [est].
- **Colour.** Man-made objects take colours from the zone palette, with paint faded on sun-facing sides [src https://blogs.ulster.ac.uk/cormacmccann/2021/02/26/ixd104-olly-moss] [est for fading].
- **Function first.** "Even if it's fantasy, there must be a logic to why it looks the way it does" [src https://www.indexmagazine.com/interviews-syd-mead]. Every robot needs visible locomotion, a power or cooling feature and a sensor. Every building needs an entrance, services and a roof drainage line [est].
- **Avoid campy retro.** Leaning too far into 1950s styling becomes "campy and unrealistic". Blend it with plausible function [src https://fallout-archive.fandom.com/wiki/The_Art_of_Fallout_3].

---

### 5. Specific fix for the crescent-moon mascot

Pick one approach [est]:
1. **Astronomical crescent.**
   - A full disc, with the lit crescent as the intersection of the disc and an offset disc.
   - The dark side faintly visible (earthshine), at about 8 to 12% lighter than the sky behind.
   - 2 or 3 maria as slightly darker irregular ellipses on the lit part.
   - Soft terminator via a 2 to 3 px gradient.
   - Set on a deep blue to violet vertical gradient, with a soft radial glow behind it at 10 to 20% alpha.
   - This reads as "moon", never as "banana".
2. **Logo glyph.** A thin, sharp crescent (inner and outer arcs with points tapering to under 1 px) in a single metallic or cream colour, paired with a serif or geometric capital wordmark. A logo, not a character.
3. **Figure.** A small adult figure in silhouette looking up at a real crescent in a landscape: the travel-poster approach in section 6.

Never add eyes, a mouth, cheeks, a nightcap or limbs. These are baby-schema and comic-relief cues [src https://pmc.ncbi.nlm.nih.gov/articles/PMC3260535/] [src https://pixune.com/blog/shape-language-technique/].

---

### 6. Billboard art that is not cartoony

#### 6.1 Constraints from real outdoor advertising
- At most 7 words. "Most drivers will stop reading after five words". One main message, one identifier, high text and background contrast, large bold type, no fine print [src https://www.blipbillboards.com/billboard-design-guidelines/].
- Cassandre was "the first graphic artist to simplify his designs so that they could be read from fast moving vehicles". In his posters type is "integrated with the image", he used only capitals for legibility at scale, and he worked with stencils and airbrush [src https://artyfactory.com/graphic_design/graphic_designers/cassandre.htm].
- So in a game world, each billboard is one image idea, plus 1 to 5 words in capitals, plus a brand mark [est].

#### 6.2 Five non-cartoon billboard genres to generate procedurally

1. **Painted product shot** (mid-century magazine and billboard realism; e.g. Sundblom's Coca-Cola oil paintings were product advertising [src https://www.illustrationhistory.org/illustrations/play-refreshed]) [est for the recipe]:
   - Product types: bottle, can, tyre, appliance, battery cell, ration pack or engine part, as one large centred object, often cropped by the frame edge.
   - Shading:
     - A cylinder gets a dark-mid-light-mid-dark vertical band sequence.
     - Add a thin specular stripe at about 30% of its width from the lit side.
     - Add a reflected-light strip on the shadow edge.
   - A contact shadow ellipse plus a soft reflection under the object.
   - Backdrop: a single vertical gradient of two analogous colours, darker at the top, with a soft radial glow behind the product.
   - A wordmark in a band at the bottom or side.
2. **Painted landscape or travel poster** (WPA and park-poster tradition: silkscreen built one colour at a time, "clean, simple designs of iconic park images" [src https://nationalparktraveling.com/listing/history-of-national-park-posters/]; the Firewatch / Olly Moss layered-hue rows [src https://blogs.ulster.ac.uk/cormacmccann/2021/02/26/ixd104-olly-moss]) [est for the recipe]:
   - 4 to 6 flat colour layers, dark in the foreground and lighter toward the horizon.
   - A 3-colour sky gradient, with an optional sun disc and halo, as in Firewatch's sky stack [src https://blog.camposanto.com/post/112703721804/this-blog-post-is-an-in-detail-explanation-of-a].
   - One small figure or structure for scale, after Moebius's small figures in an enormous landscape [src https://whatnotmark.substack.com/p/line-between-worlds].
   - A solid type band at the bottom with the destination name in caps and a one-line tagline.
   - Slight misregistration (1 px offset of one layer) and grain to suggest print [est].
3. **Typography-led** (Cassandre and Swiss poster tradition [src https://artyfactory.com/graphic_design/graphic_designers/cassandre.htm]) [est for the recipe]:
   - One huge word in capitals, wide-spaced or condensed, over a field of one colour.
   - One geometric graphic element that interlocks with the letters: a bar, an arc, a disc.
   - Palette of 2 to 3 colours.
   - This is the cheapest genre to make look adult, and it scales cleanly from Rung B (value bars) to Rung D (legible letters).
4. **Photographic-gradient corporate** [est]:
   - A smooth radial or linear gradient field (sky, metal, glass) with a vignette.
   - A small, crisp product or logo off-centre on a rule-of-thirds point.
   - A thin sans tagline.
   - Reads as late-20th-century corporate photography.
5. **Modelled mid-century figure** [est]:
   - An adult figure (7.5 to 8 heads [src https://www.proko.com/human-figure-proportions-average-richer]) in a three-quarter back or profile view.
   - Rendered in 3 value planes with hue-shifted shadows. No facial features under 60 px billboard height.
   - Engaged with the product or the view (looking out over a landscape, holding a tool).
   - Avoid exaggerated poses and grins.

#### 6.3 The billboard as a physical object
Make the board itself believable [est]:
- steel or wood posts with a contact band;
- a walkway or catwalk rail;
- 2 to 4 lamp arms projecting from the top or bottom edge, casting a radial glow onto the face at night;
- a 1 to 2 px frame;
- paper-panel seams as faint vertical and horizontal lines on paste-up boards;
- sun-fading that shifts the artwork toward lower saturation and cooler hue, more on older boards;
- occasional peeled corners or partial re-pastes showing an older ad underneath.

Billboards are narrative objects, so give them one rung more detail than neighbours of the same size [src https://www.thumbsticks.com/gdc-2015-the-art-of-firewatch].

---

### 7. Quick checklist per sprite class

1. Is the silhouette irregular, asymmetric, and readable as a flat 12 px shape? [src https://rocketbrush.com/blog/shape-language-in-game-character-design-how-to-make-characters-readable-and-consistent]
2. Is the dominant shape angular or irregular, with curves as accents? [est]
3. Are faces absent, and do figures and robots use adult, mechanical proportions? [src https://pmc.ncbi.nlm.nih.gov/articles/PMC3260535/] [src https://www.proko.com/human-figure-proportions-average-richer]
4. Are there three unequal value families, with a hue-shifted ramp? [src https://www.outdoorpainter.com/designing-your-paintings-with-values-along-with-some-tips-on-scene-selection/] [src https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes]
5. Is there a contact band at the base, the darkest value in the sprite? [src https://diannemize.substack.com/p/what-do-we-know-about-shadows]
6. Is texture limited to lit planes and clustered? [src https://d23.com/sleeping-beauty-stunning-art/]
7. Is saturation 20 to 55% for base fills, with colours from the zone palette? [est] [src https://blogs.ulster.ac.uk/cormacmccann/2021/02/26/ixd104-olly-moss]
8. Does haze compress contrast, and does detail drop a rung as h rises? [src https://finearttutorials.com/guide/atmospheric-perspective/] [est]
9. Does every instance vary per the jitter table? [est]
10. Do all four detail rungs exist for this class? [est]

---

### 8. Gaps and caveats

- No transcript of Jane Ng's GDC talk was accessible. The Firewatch points come from press write-ups, the Campo Santo sky-shader post and student analyses.
- No primary source was found for Olly Moss's process, Kentucky Route Zero's rendering technique, Old Man's Journey beyond its abstract, or Halo's art rules.
- Older posts on James Gurney's blog redirected to plain http and could not be fetched. Only the 2015 foliage post and the 2010 Light and Form post were read.
- Wikipedia's Cuteness and Depth perception pages were blocked by the fetch tool. The perception-cue definitions come from perspectiveresearchcentre.com instead.
- The cypaint.com numbers (3 to 4 shapes, 2 to 3 value steps) come from a low-authority hobby site.
- All numeric parameters marked [est] are starting points to tune by eye on a contact sheet of sprites at 16, 40 and 120 px.

### Sources read
- https://www.thumbsticks.com/gdc-2015-the-art-of-firewatch
- https://blog.camposanto.com/post/112703721804/this-blog-post-is-an-in-detail-explanation-of-a
- https://80.lv/articles/creating-the-world-of-firewatch/?amp=1
- https://blogs.ulster.ac.uk/cormacmccann/2021/02/26/ixd104-olly-moss
- https://blogs.ulster.ac.uk/bethbuchanan/2021/03/05/ixd104-further-looking-into-the-art-of-firewatch
- https://d23.com/sleeping-beauty-stunning-art/
- https://zoungyart.substack.com/p/painting-in-the-style-of-sleeping
- https://animationobsessive.substack.com/p/what-kazuo-oga-thinks-about-when
- https://animationobsessive.substack.com/p/defining-the-world-of-my-neighbor
- https://www.indexmagazine.com/interviews-syd-mead
- https://fallout-archive.fandom.com/wiki/The_Art_of_Fallout_3
- https://whatnotmark.substack.com/p/line-between-worlds
- https://www.gamedeveloper.com/marketing/how-shedworks-refined-the-art-of-sable-in-pursuit-of-readability
- https://www.pcgamer.com/uk/welcome-to-the-zero-the-making-of-kentucky-route-zeros-open-road
- https://en.wikipedia.org/wiki/Kentucky_Route_Zero
- https://80.lv/articles/altos-adventure-a-game-with-style
- https://www.cgmagonline.com/interviews/interview-with-the-team-behind-altos-odyssey
- https://www.itsnicethat.com/articles/tom-haugomat
- https://www.spherelife.com/interviews/5-minutes-illustrator-tom-haugomat
- https://www.audubon.org/magazine/january-february-2008/counting-wings
- https://www.npr.org/transcripts/314941202
- https://nationalparktraveling.com/listing/history-of-national-park-posters/
- https://mcvuk.com/business-news/when-we-made-townscaper
- https://gamesbeat.com/bad-north-shows-that-even-bloody-viking-battles-can-be-artsy-and-cute/
- https://www.gdcvault.com/play/1024236/
- https://pixune.com/blog/shape-language-technique/
- https://rocketbrush.com/blog/shape-language-in-game-character-design-how-to-make-characters-readable-and-consistent
- https://www.animatedspirit.com/straights-curves
- https://pmc.ncbi.nlm.nih.gov/articles/PMC3260535/
- https://en.wikipedia.org/wiki/Understanding_Comics
- https://en.wikipedia.org/wiki/Ligne_claire
- https://www.proko.com/human-figure-proportions-average-richer
- https://finearttutorials.com/guide/atmospheric-perspective/
- https://perspectiveresearchcentre.com/depth-cues/
- https://www.outdoorpainter.com/designing-your-paintings-with-values-along-with-some-tips-on-scene-selection/
- https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes
- https://www.slynyrd.com/blog/2019/2/23/pixelblog-14-cityscapes
- https://blog.usesession.com/blog/ardouradvice/766774775809032192
- https://streamlinepublishing.com/inside-art/does-warmer-light-have-cooler-shadows/
- https://gurneyjourney.blogspot.com/2010/02/light-and-form-part-1_15.html?m=1
- https://gurneyjourney.blogspot.com/2015/12/foliage-is-lightest-at-its-outer-edges.html
- https://diannemize.substack.com/p/what-do-we-know-about-shadows
- https://dev.epicgames.com/documentation/unreal-engine/contact-shadows-in-unreal-engine
- https://www.artistsnetwork.com/art-mediums/pastel/pastel-techniques-painting-tips-for-sky-holes
- https://streamlinepublishing.com/inside-art/summer-in-the-city/
- https://cypaint.com/article/how-to-paint-buildings-in-the-distance
- https://www.blipbillboards.com/billboard-design-guidelines/
- https://artyfactory.com/graphic_design/graphic_designers/cassandre.htm
- https://www.illustrationhistory.org/illustrations/play-refreshed
- https://www.halopedia.org/The_Art_of_Halo

## Part B. Ring-World Billboards: Research and 39 Original Designs

Brief: give the ring-world painter a wider, tongue-in-cheek set of roadside boards. Every brand here is invented. None borrows a real brand, a game franchise name, or a specific game's ad layout. Every factual claim is tagged [src] with a URL, or [est] where it is my own estimate or reasoning.

---

### Part 1. How fiction does fake advertising, and why it works

#### Grand Theft Auto (parody brands)
- Take-Two's CEO says the GTA world is fictional, so any real brand would have to fit that setting. Fictional brands are "very much a creative decision driven by the team at Rockstar" and "not a financial decision." In GTA, players "don't really have that expectation... except for fictional brands." [src: https://www.videogameschronicle.com/news/take-two-explains-why-grand-theft-auto-doesnt-include-more-real-world-brands/]
- Lesson: a fake brand belongs to the world, while a real one pulls the viewer out of it. Parody works when the joke is about the world's own habits, not when it copies a logo. [est]

#### Fallout (retro-futurist optimism over ruin)
- Fallout's backstory freezes culture in the 1950s while technology keeps advancing, and "propaganda art remained in vogue." The cheerful corporate imagery is a facade that hides how institutions profited from disaster. [src: https://www.denofgeek.com/games/loki-fallout-retrofuturism-design-references-style-influences]
- The gap between a hopeful look and a ruined world tells the viewer that "something has gone horribly wrong" before they know what happened. [src: same]
- Setting a supposed golden age against decay is "darkly comic and that much more disturbing." [src: https://kotaku.com/you-say-apocalypse-i-say-retro-chic-5552980]
- Lesson for the ruins kind: draw the old boards as relentlessly sunny, and let the damage carry the joke. [est]

#### BioShock (Art Deco in a drowned utopia)
- Rapture "draws heavily from the Art Deco movement of the 1920s and 1930s," with bold geometric shapes and metallic finishes. [src: https://thegameloop.substack.com/p/remembering-rapture]
- Its retro ads and Art Deco architecture make the horror stronger, because a cheerful 1950s figure feels wrong in a broken place. [src: https://kotaku.com/you-say-apocalypse-i-say-retro-chic-5552980]

#### Half-Life 2 (Combine posters)
- Valve's early posters were text-heavy slogans. The team judged them overused, made the final posters abstract, and moved most of the propaganda to broadcasts. [src: https://combineoverwiki.net/wiki/Combine_imagery]
- The symbols are kept simple so they can be read across the many cultures and species the regime controls. One poster pairs a peace dove with the regime's emblem, which is ironic. The same poster comes in several colourways: red, yellow, green and blue. [src: same]
- The City 17 welcome poster recalls the Swiss designer Josef Muller-Brockmann. [src: same]
- Lessons: abstract shapes outlast slogans, and one layout reprinted in several colourways reads as an institution. [est]

#### Cyberpunk 2077 (ads that watch you)
- In the demo, ads were personalised to the viewer, and they pointed the player toward the nearest vendor. The article called this a "pretty scary kind of advertising." [src: https://www.inverse.com/article/48512-cyberpunk-2077-ads-make-future-marketing-look-invasively-scary]

#### Blade Runner and Blade Runner 2049
- The 1982 film showed real brands, and many of them later declined: Pan Am, Atari, the Bell System and RCA. Fans call this the "Blade Runner curse." [src: https://slashfilm.com/809210/the-blade-runner-curse-explained]
- Lesson: real brands date a world, while invented ones age with it. [est]
- 2049's ads are holograms that lean down and speak to passers-by. One companion ad tells the hero he looks lonely. [src: https://oaaa.org/blog-posts/the-future-of-ooh-what-blade-runner-2049-gets-right-and-wrong/]

#### Deus Ex: Human Revolution (straight-faced corporate)
- The fictional augmentation firm was marketed with a "slick" commercial and an "elaborate" website. [src: https://laughingsquid.com/sophisticated-ad-for-biomechanical-firm-is-viral-ruse-for-deus-ex-game/]
- A UK tabloid reported the firm's eye implant as a real product. [src: https://www.gamestar.de/artikel/kurioses-boulevardzeitung-the-sun-haelt-kybernetic-firma-aus-deus-ex-fuer-echt,3029075.html]
- Lesson: a deadpan delivery sells a fake brand. The city boards here use earnest corporate polish, and the joke sits in the words. [est]

#### The Outer Worlds (absurd corporate taglines)
- The writers call "hilarious and bizarre taglines and slogans for every corporation" a core source of the game's humour. Their example is a diet toothpaste sold as a lunch item and treated as ordinary. [src: https://gamesbeat.com/the-outer-worlds-interview-crafting-galactic-sarcasm/]
- The satire works through the outsider's view: the player sees the absurdity, while the colonists find it natural. Dark humour keeps heavy themes from becoming "too oppressive." [src: same]
- Lesson: the ring-world residents treat spin gravity and endless noon as normal, and the viewer is the outsider who gets the joke. [est]

#### Portal (clinical signage)
- Aperture's signage uses a "DIN-like industrial sans-serif" with no ornament. Its calm, orderly signs contrast with lethal tests, and that contrast is part of the game's dark humour. Portal 2 adds warmer 1950s-style signage in the older areas. [src: https://madegooddesigns.com/portal-font/]
- Lesson: a public notice in calm municipal type can be funnier than a loud ad. [est]

#### Mirror's Edge
- The art direction aims for "a stylized graphical simplicity," strong colours, light and colour contrast, and red to guide the player. [src: https://www.slideshare.net/slideshow/style-and-gameplay-in-the-mirrors-edge/127661765]
- Its city is often described as having almost no visible advertising. The source deck does not say this. [est]

#### Disco Elysium
- The game is painted in a hand-made, impressionist style. [src: https://hypercritic.org/collection/disco-elysium-rpg-analysis-review]
- Its palette is "deliberately muted" with "splashes of vibrant colors," and its locations reflect political turmoil and neglect. [src: https://hyper3d.ai/blog/disco-elysiums-art-style-a-deep-dive-into-its-unique-visuals]
- Lesson: old political posters for causes nobody remembers suit the faded-nonsense poster here. [est]

#### Common threads
1. Every joke comes from the world's own logic, never from a real brand. [est, from GTA and Outer Worlds above]
2. The voice is deadpan, and the content is absurd. [est, from Deus Ex and Portal]
3. Optimism decays into irony: in a ruin, the sunnier the board, the darker it reads. [src: Fallout and BioShock sources above]
4. Simple abstract shapes beat heavy text. [src: Combine imagery page]
5. Variety comes from format as well as content, such as notices, serial signs, painted barns and neon. [est]

---

### Part 2. Real roadside advertising history

#### Burma-Shave serial signs (1925 to 1963)
- The first sets went up in autumn 1925 on Minnesota highways. Each set had six boards, placed 100 ft (about 30 m) apart, with the brand name on the last board. [src: https://www.mnhs.org/mnopedia/search/index/thing/burma-shave]
- More than 6,000 sets went up across 45 states. Short rhyming lines replaced the earlier non-rhyming ones so drivers could read them quickly. Many verses carried a safe-driving message. [src: same]
- The signs declined after higher speeds and Interstate set-backs made them hard to read. They were removed after the 1963 sale to Philip Morris. [src: same]
- One surviving board measures 46 x 102 cm, about 4.5 cm thick, and is made of wood. [src: https://www.si.edu/object/nmah_844939]

#### Wall Drug
- Dorothy Hustead suggested offering free ice water to hot travellers heading to Mount Rushmore. Most of the billboards line about 1,050 km (650 mi) of I-90. [src: https://en.wikipedia.org/wiki/Wall_Drug]
- Visitors put up mileage signs around the world, including one in Antarctica that reads "Free Ice Water, 9,333 miles." [src: same]
- The Husteads bought the store in late 1931. The ice-water idea came about five years later. [src: https://www.rvtravel.com/sign-promising-free-ice-water-was/]
- Lessons: repetition over a long distance becomes a joke in itself, and a distance-to sign travels well. [est]

#### Mail Pouch barns
- Harley Warrick painted or retouched more than 20,000 barn signs in 55 years. A two-man team took about 6 hours per barn: one painted the black background and the other the lettering, and they could do two barns a day. [src: https://en.wikipedia.org/wiki/Harley_Warrick]
- The 1965 Act's 200 m (660 ft) Interstate limit effectively ended barn advertising. The surviving signs were later protected as landmarks. [src: same]

#### Ghost signs
- Ghost signs are old hand-painted wall ads that survive because their lead-based oil paint bonds to brick. A new sign was often painted over an old one, which builds up a palimpsest. Their painters were called "wall dogs." Many date from the 1890s to the 1960s. [src: https://en.wikipedia.org/wiki/Ghost_sign]

#### Googie and mid-century design
- Googie is postwar Los Angeles design, named by Douglas Haskell in 1952 after John Lautner's 1949 coffee shop. Its features are towering neon, boomerang and starburst motifs, tapering pylons, tailfin roofs, and signs built to catch drivers' eyes. [src: https://archipediavm.upress.virginia.edu/essays/TH-01-ART002]

#### Highway Beautification Act (1965)
- Lyndon Johnson signed it on 22 October 1965. It created a 660 ft (201 m) controlled corridor on each side of the Interstates, with a penalty of 10% of a state's federal highway funds. Commercial and industrial zones were exempt. [src: https://www.scenic.org/why-scenic-conservation/billboards-and-sign-control/hba/]
- Ring-world use: the rim could have its own "Beautification Act" that strips boards from the most scenic stretches. That would explain empty frames and stumps of posts. [est]

#### Soviet and space-age propaganda posters
- Typical techniques were diagonals for urgency, two or three colours (mostly red, black and white), type used as an image, a single focal point, geometric human figures, and negative space used as structure. [src: https://www.ls.graphics/ideas/7-soviet-poster-techniques-designers-still-use-today-without-realizing-it]
- One example is Valentin Viktorov's 1964 poster, in which a rocket streaks through a wheat wreath beside a red star and Earth. Its slogan reads "Heroic Labour the path to cosmic victories!" [src: https://antikbar.co.uk/collections/propaganda-posters/products/conquest-of-space-heroic-labour-ussr-pp1294]

#### Japanese kanban
- Kanban culture peaked in the Edo period (1615 to 1868). Signs were made of wood, bamboo, paper, fabric and iron. Mokei kanban were three-dimensional replicas of the goods sold, such as a soy-sauce bottle, a pipe, a sandal or a comb. Because the shape showed the trade, even people who could not read could find the shop. [src: https://hyperallergic.com/handcrafted-japanese-shop-signs-kanban-mingei-museum.md]
- Ring-world use: object-shaped signs fit the magic and wilds kinds, and they need no faces. [est]

#### Hong Kong neon
- Neon arrived in the 1920s and became the city's night signature. After tighter rules came in from 2010, many signs were removed. [src: https://www.mplus.org.hk/en/magazine/collecting-conserving-exhibiting-neon-signs-mplus-museum-hong-kong/]
- Removal orders for overhanging signboards rose to 1,119 a year, from under 700 in 2015. The gas sets the colour: neon glows red and argon blue. Tubes are bent by hand over a flame. [src: https://hongkongfp.com/2023/04/16/its-disappearing-very-fast-hong-kongs-fading-neon-heritage-shines-a-spotlight-on-the-craft/]
- One M+ sign uses red tubing for its Chinese characters and white for its English text. [src: M+ link above]

---

### Part 3. Physical structure and dimensions (metres)

| Format | Size (W x H) | Aspect | Where | Source |
|---|---|---|---|---|
| Bulletin (standard) | 14.63 x 4.27 m (48 x 14 ft) | 3.4 : 1 | highways | [src: https://aws.oaaa.org/AboutOOH/OOHBasics/OOHMediaFormats/Bulletins.aspx] |
| Bulletin (other standards) | 12.19 x 3.05 m; 10.97 x 3.20 m | 4 : 1; 3.4 : 1 | highways | [src: same] |
| Spectacular | 18.29 x 6.10 m; 18.29 x 4.88 m | 3 : 1; 3.75 : 1 | city centres | [src: same] |
| 30-sheet poster | 7.47 x 3.73 m overall, 6.91 x 3.18 m copy area | about 2 : 1 | primary and secondary roads | [src: https://dashtwo.com/blog/what-are-billboard-dimensions/], [src: https://www.papersizes.org/billboard-sizes.htm] |
| 24-sheet (original standard) | 5.94 x 2.65 m (19.5 x 8.7 ft) | 2.2 : 1 | historic standard | [src: https://www.madehow.com/Volume-5/Billboard.html] |
| 8-sheet junior | 3.66 x 1.83 m | 2 : 1 | pedestrians, streets | [src: dashtwo link above] |
| UK 48-sheet / 96-sheet | 6.10 x 3.05 m / 12.19 x 3.05 m | 2 : 1 / 4 : 1 | UK | [src: papersizes link above] |
| Burma-Shave board | 1.02 x 0.46 m | 2.2 : 1 | rural roads, 30 m apart | [src: https://www.si.edu/object/nmah_844939] |

The "overall" and "copy area" pairing for the 30-sheet is my reading of two sources that differ. [est]

**Structure**
- Monopoles are steel tubes 0.9 to 1.8 m across and up to 30 m tall, set in concrete footings 6 to 9 m deep. The head frame is made of steel I-beams. [src: https://www.madehow.com/Volume-5/Billboard.html]
- Catwalks run along the front and back of the frame, with a ladder at the rear and tie-off points for safety cables. [src: same]
- Lights use high-wattage lamps switched on by timers or dusk photocells. [src: same]
- Paper poster sheets are pasted onto the face, and the next campaign is pasted over the old one. [src: same] This is the real basis for the "torn to an older layer" state.
- Painted bulletins are painted onto plywood panels, transferred with a charcoal pounce pattern, and whitewashed for reuse. [src: same]
- Cut-out extensions can project about 1.5 to 1.7 m above the frame, 0.6 m at the sides and 0.3 m below. [src: OAAA bulletins link above]
- Older or rural boards stand on two to four timber or lattice posts. The face sits about 3 to 6 m off the ground, with angled kicker braces at the back and a row of gooseneck lamps along the bottom edge. [est]
- One sign builder says peeling paint degrades the message and rust shortens a structure's life. [src: https://billboardinsider.com/the-better-the-frame-the-better-the-picture/]

**Visual grammar at speed**
- Use about 5 to 7 words. The headline should be readable aloud in under two seconds. Use one idea, with one dominant visual. [src: https://www.adquick.com/answers/how-many-words-should-a-billboard-ad-have]
- Burma-Shave split one longer message across several boards to stay within this limit. [src: MNopedia link above]
- Keep to two or three colours and one focal point, with deliberate negative space. [src: ls.graphics link above]
- For the painter, each board gets one silhouette or product shape, one line of heavy type, and a band of solid colour, with the type covering no more than about 40% of the face. [est]

---

### Part 4. Ring-world jokes to draw on (setting logic) [est]
- **Spin gravity:** "down" is outward. Thrown things curve, pours drift sideways, and levels and plumb lines matter.
- **The arch overhead:** the far side of the ring is always visible as a band across the sky, so every window has "a view of the ring."
- **No horizon:** the ground curves up into the sky in both directions, and driving "to the horizon" never ends.
- **Endless day:** night exists only under shadow panels, if at all, so darkness, sleep and stars become luxury goods.
- **The rim wall:** a wall of unimaginable height at the edge, with the void beyond.
- **The Builders left:** relics, glyphs, humming monoliths, maintenance that never came, and cracks in wonders.
- **Directions:** spinward, antispinward, rimward and hubward replace compass points.

---

### Part 5. Original designs

Columns: brand, slogan (7 words or fewer), art built from flat shapes, palette of three colours, and rarity. Rarity follows how loud or jokey a board is: common boards are quiet and believable, and very rare boards are the big gags. [est]

Suggested spawn weights within a kind are common 55%, uncommon 28%, rare 13% and very rare 4%. [est]

No art uses faces or mascots with faces. Any figures are flat silhouettes.

#### WILDS (farms and villages): painted timber boards on posts, barn-side paintings, Mail Pouch and Burma-Shave grammar

| # | Brand | Slogan | Art (flat shapes) | Palette | Rarity |
|---|---|---|---|---|---|
| 1 | Upcurve Feed & Seed | "Our fields go up. Yields too." | Crop rows in converging stripes that curve up and off the top edge of the board; a squat seed-sack rectangle in the foreground | barn red #9e2b25, wheat #d9a441, cream #f2e8cf | common |
| 2 | Spinward Plough Works | "Ploughs straight. Ring curves. Not our fault." | Plough silhouette at left; the furrow behind it begins straight and then bends in a long arc | soil brown #5b3a29, sky #8fb8de, white #f7f4ea | uncommon |
| 3 | Old Pale Dairy | "From cows that have never seen night." | Cow silhouette in profile, solid black with no features; a sun disc fixed directly overhead | grass #6a994e, black #1b1b1b, milk #fdfcf7 | common |
| 4 | Coriolis Cider | "Pours a little to the left." | Tilted bottle with a pour stream that curves sideways and misses a tumbler | apple green #8ab83a, amber #c97b2a, oak #4a3222 | uncommon |
| 5 | Longnoon Tonic (painted across a barn side) | "For the afternoon that never ends." | Typography only, in large cream slab letters on black, Mail Pouch style; a small bottle shape at the end of the line | barn black #141414, cream #efe3c2, mustard #d4a017 | common |
| 6 | Archlight Almanac | "Forecast: sunny. Again. Still. Forever." | A closed book shape; on its cover, a row of seven identical sun icons, one per day | sky #6cb4e4, sun #f6c90e, ink #23303b | uncommon |

#### CITIES (daytime cities): steel 30-sheet panels and bulletins with catwalks, deadpan corporate polish

| # | Brand | Slogan | Art (flat shapes) | Palette | Rarity |
|---|---|---|---|---|---|
| 7 | Archview Residences | "Every window faces the ring. Every one." | Slim tower silhouette with a grid of lit windows; behind it a thin pale band arcs from corner to corner (the arch) | slate #3d4a5c, gold #e0b84f, haze #dfe7ef | common |
| 8 | Edgeward Mutual (insurance) | "Fell off the edge? You're covered. Eventually." | Tall vertical rim wall at right; a tiny standing figure silhouette at the top edge; a dotted arc trailing off the board | navy #1d3557, safety orange #f77f00, white #f1faee | rare |
| 9 | Spokeline Transit | "Antispinward in twenty minutes. Probably." | Long low train capsule silhouette with speed lines; a big arrow pointing left | transit teal #00818a, white #f4f4f4, signal yellow #ffd23f | common |
| 10 | Shadowsquare Blinds | "Night, sold by the metre." | Window rectangle with a blind pulled halfway; the dark lower half is dotted with small stars | midnight #14213d, daylight #fca311, paper #e5e5e5 | common |
| 11 | Plumb & True Levels | "Trust the bubble, not the horizon." | Spirit-level bar across the board with its bubble in the centre; the ground line behind it is visibly tilted and curved | tool yellow #f2c12e, graphite #2e2e2e, sky #a9d6e5 | uncommon |
| 12 | Roundabout Savings & Loan | "Your money goes around. And around." | Big coin disc with a thin ring orbiting it; small arrow-heads on the ring | bank green #2d6a4f, brass #c9a227, ivory #f8f5ec | common |

#### NEON (night cities under the shadow panels): tube outlines, vertical projecting signs in the kanban and Hong Kong manner

| # | Brand | Slogan | Art (flat shapes) | Palette (unlit tube / lit glow / backing) | Rarity |
|---|---|---|---|---|---|
| 13 | Deep Shade Lounge | "Darkness by the hour. Two drink minimum." | Outline of a cocktail glass with a crescent of shadow in it; slogan in tube script | magenta #ff2e88, violet #7b2ff7, black #0b0b12 | common |
| 14 | Noonbowl Noodle (vertical sign) | "Hot broth under a cold arch." | Tall narrow sign: a bowl outline with three wavy steam tubes rising, and vertical lettering below | neon red #ff3b30, argon blue #3fa7ff, lacquer black #111 | common |
| 15 | Starless Cinema | "Tonight only: real stars. Projected." | Marquee rectangle edged with a chase of bulbs; a beam fanning out of a small projector shape into star dots | warm white #fff4d6, cyan #37e2d5, deep plum #2b0f3a | uncommon |
| 16 | Overflux (energy drink) | "Stay awake. The sun does." | Can silhouette with a double chevron on it; a sun outline behind with tubes for rays | acid green #a6ff00, hot orange #ff6b00, charcoal #161616 | common |
| 17 | Spinlock Arcade | "Win prizes. Lose your sense of down." | Spiral tube with a small arrow tumbling along it; word blocks set at a slant | electric yellow #ffe600, magenta #ff00a8, navy #0a0f2c | uncommon |
| 18 | Halfway Hotel (vertical sign) | "Rooms by the hour. Hours extra." | Stacked vertical letters with a small arrow pointing down at a door rectangle; the word VACANCY sits beneath | rose #ff4f79, white #f6f6f6, rust backing #3a1d16 | rare |

#### BUILDERS (alien megastructure builders): seamless monolithic panels, glyph rows, no frames or posts, and the humans' small boards next to them

| # | Brand | Slogan | Art (flat shapes) | Palette | Rarity |
|---|---|---|---|---|---|
| 19 | Prior Tenants Relic Removal | "Ancient. Humming. Gone by Tuesday." | A tall obelisk with a row of glowing glyph dashes, strapped onto a two-wheeled hand-truck silhouette | concrete #b8b8aa, relic teal #2ec4b6, hazard yellow #ffbf00 | rare |
| 20 | Rimwall Climb Co. | "Summit in a thousand kilometres. Bring snacks." | A vertical wall filling the board, with a hairline rope and a tiny figure silhouette halfway up | wall grey #6b7078, rope orange #e85d04, sky #bde0fe | uncommon |
| 21 | Mendwell Filler | "For hairline cracks in ancient wonders." | Product tub and putty knife; behind them a vast arch shape with one jagged crack line that has been neatly plastered | putty #e9dcc9, arch bronze #8c6a43, crack black #222 | uncommon |
| 22 | Hollowmark Survey Guild | "We map what they forgot to." | A grid laid over half of an arch silhouette; the other half is left blank with a question mark shape | survey blue #264653, chalk #f1f1e6, red pencil #d62828 | common |
| 23 | Builder plaque (a notice, not an ad) | "Out for maintenance. Back in 40,000 years." | A seamless dark slab with a row of alien glyphs; a human-added enamel strip below translates it | obsidian #121418, glyph cyan #48e5c2, enamel white #f0f0f0 | very rare |

#### RUINS (post-fall, a tonal nod to the retro-apocalypse genre without its names or designs): rusted frames, missing sheets, sagging catwalks

| # | Brand | Slogan | Art (flat shapes) | Palette (as faded) | Rarity |
|---|---|---|---|---|---|
| 24 | Brightside Acres (pre-fall housing) | "Gravity included at no extra charge!" | Starburst behind a boomerang-roofed house silhouette; two adult figure silhouettes and a child silhouette, featureless; Googie lettering | faded turquoise #7fb7b2, salmon #e8a598, bone #efe6d2 | common |
| 25 | Everglow Kettle | "Boils in seconds. Glows for centuries." | Rounded chrome kettle shape with radiating lines, and a small glow halo around it | mint #a8d5ba, chrome grey #9aa5ab, warning red #c1440e | uncommon |
| 26 | Canned Daylight | "Shelf life: yes." | One big tin can whose label is a sun with rays; a tower of identical cans behind it | sun yellow #f4c430, tin grey #8d99ae, rust #8b3a1a | uncommon |
| 27 | Dutiful Domestics | "A helper that will outlast you!" | A boxy robot silhouette carrying a tray, with no face (a single round lamp on top is allowed); dated starburst behind | cream #f3e9d2, robin blue #6fa8dc, cherry #c0392b | rare |
| 28 | Ring Bonds | "Buy a share of forever." | Bond-certificate rectangle with a scalloped border; a ring symbol in the middle and diagonal rays, poster style | red #b22222, cream #f5ecd7, black #1a1a1a | common |
| 29 | Survivor sign (hand-painted on salvaged boards over an old frame) | "WATER. TRADE. NO RAIDERS. DOGS OK." | Typography only, in uneven brush capitals on mismatched planks; one arrow; a dog silhouette | whitewash #e8e4d8, tar black #1c1c1c, oxide red #9b2d20 | rare |

#### MAGIC: hanging shingle signs and object-shaped signs in the mokei kanban manner, with gilt lettering

| # | Brand | Slogan | Art (flat shapes) | Palette | Rarity |
|---|---|---|---|---|---|
| 30 | Truedown Charm | "Always know which way is down." | A pendant on a chain, pointing firmly toward the bottom edge while the board itself is drawn slightly tilted | amethyst #6a4c93, gilt #d4af37, parchment #f4ecd8 | common |
| 31 | Wellwater Oracle | "Futures read. Pasts refunded." | A crystal-ball circle on a stand, with a tiny arch reflected inside it | deep teal #0b525b, moon white #e8f1f2, gilt #c9a227 | uncommon |
| 32 | Broomworks | "Fly straight. Arrive somewhere else." | Broom silhouette with a long trail that curls into a hook | twilight blue #2c3e75, straw #e1b866, ember #e2573b | uncommon |
| 33 | Moonless Apothecary (bottle-shaped sign) | "Sleeping draughts for a sleepless sky." | The whole sign is cut in a bottle shape; a crescent on the label with a strike through it | bottle green #2f5d50, wax red #a4161a, label cream #f1e3c3 | common |
| 34 | Wardwright | "Curses lifted. Wards painted. Walk-ins welcome." | A hexagonal ward sigil of nested lines, with a key shape crossing it | oxblood #5c1a1b, gold #e0b13a, slate #2f3e46 | common |

#### NON-ADS (any kind unless noted)

| # | Item | Text (7 words or fewer) | Art (flat shapes) | Palette | Rarity |
|---|---|---|---|---|---|
| 35 | Public notice: Spin Advisory (cities and wilds) | "Thrown objects will not come back." | Municipal enamel plate; a pictogram of a ball leaving a hand along a curved dotted path that bends away; reference number in small type | enamel white #f2f2f2, municipal blue #1f4e79, red rule #c00000 | common |
| 36 | Missing robot poster (cities and neon, pasted to poles and boards) | "MISSING: Unit 7. Answers to 'Hey'." | A small sheet: a boxy robot silhouette in a photo box, a REWARD bar, and a fringe of tear-off tabs along the bottom edge | photocopy white #f5f5f0, toner black #222, highlighter #fff35c | uncommon |
| 37 | Faded political poster (ruins and cities) | "ORRIN VASQUE: MORE TOMORROW, SOONER." | Soviet-style diagonal: a geometric figure silhouette striding upward and to the right, one red wedge, and the slogan as a slanted type block | faded red #b5544c, black #2a2a2a, yellowed paper #e9dfc4 | rare |
| 38 | You Are Here map (all kinds, at rest stops) | "You are here. Also, eventually, here." | A long horizontal band representing the ring, with one red dot and an arrow that runs off the right end and returns at the left; legend squares below | map cream #f6f0e1, route blue #2a6f97, dot red #e63946 | uncommon |
| 39 | Serial roadside set (wilds and ruins) | 4 to 5 small boards, each under 5 words (verses below) | Each board is about 1.0 x 0.46 m on a single post, spaced about 30 m apart. Typography only, with the brand name on the last board | white #ffffff on red #c1121f; alternate boards in black #111 | uncommon |

**Serial set verses.** Each slash is a new board, and the last board names the brand. All brands are invented here.
- A: HE DROVE ALL DAY / TO REACH THE HORIZON / THERE ISN'T ONE / HE'S STILL DRIVING / LOOPWAY MOTOR OIL
- B: DON'T LEAN OUT / NEAR THE RIM / THE DROP IS LONG / THE CLAIM FORM LONGER / EDGEWARD MUTUAL
- C: THE BUILDERS LEFT / WITHOUT A NOTE / BUT LEFT THE LIGHTS ON / SO DO WE / ALL-NOON DINER 40 KM
- D (safety-message style, as in the originals): SPIN IS FREE / SO IS DOWN / BUT BRAKES / COST EXTRA / CHECK YOURS

The originals used six boards with roughly 30 m between them. [src: https://www.mnhs.org/mnopedia/search/index/thing/burma-shave] Four or five boards keep the set within one screen width. [est]

---

### Part 6. Boards that change by state

Every state below is grounded in how real boards age or get posted: paper is pasted over the previous campaign, peeling paint degrades the message, and lamps run on dusk timers. [src: https://www.madehow.com/Volume-5/Billboard.html], [src: https://billboardinsider.com/the-better-the-frame-the-better-the-picture/]

1. **Peeling.** Paper sheets lift at the seams and corners. Draw paler triangles curling away from the grid lines that divide the sheets, with a strip of bare grey backing showing. This suits any paper poster (7 to 12, 24 to 28, 36, 37). [est]
2. **Torn to an older layer.** A ragged hole shows an older board underneath. Suggested pairs [est]:
   - 29 Survivor sign over 24 Brightside Acres (a sunny starburst shows through the planks).
   - 37 Political poster over 28 Ring Bonds (the two are the same red, a decade apart).
   - 8 Edgeward Mutual over an older Edgeward board with a longer, smaller-print slogan. The insurer keeps reprinting.
   - Any city board over a ghost-sign wall painting, using the palimpsest effect. [src: https://en.wikipedia.org/wiki/Ghost_sign]
3. **Unlit or lit at night.** In daytime the neon boards (13 to 18) are grey tubes on dark backing; at night they glow with bloom. A broken-letter variant [est]:
   - 18 HALFWAY HOTEL loses "WAY" and reads HALF HOTEL.
   - 15 Starless Cinema has one dead bulb run in its marquee chase.
   - City bulletins get a row of gooseneck lamps that cast light cones upward at night. [est]
4. **Half-pasted by a crew.** Some sheets are up and some are blank, with a diagonal edge where the pasting stopped. Add one or two worker silhouettes on the catwalk (no faces), a paste bucket, a long-handled brush and rolled sheets on the catwalk. [est] The catwalk and rear ladder match real structures. [src: madehow link above]
5. **Extra for the builders kind: a dormant or awake plaque.** Item 23's glyph row is dark most of the time and occasionally pulses cyan. [est]
6. **Extra for the wilds kind: a repainted barn.** Item 5 shows a fresh coat on one half and faded paint on the other. Real barn signs were kept alive by repainting. [src: https://en.wikipedia.org/wiki/Harley_Warrick]

---

### Part 7. Format by kind (quick reference) [est]

| Kind | Typical format | Mount | Ageing |
|---|---|---|---|
| Wilds | Painted timber board (about 3 x 1.5 m), barn-side painting, serial sets | 2 timber posts; barn wall | sun-fade, repaint |
| Cities | 30-sheet (about 2:1) and bulletin (about 3.4:1) | Steel monopole or lattice, catwalk, lamps | peel, re-paste, crew |
| Neon | Vertical projecting sign, rooftop tube board | Wall bracket, rooftop frame | dead tubes, flicker |
| Builders | Seamless slab, glyph strip | Grown from the ground; no posts | none, or dormant glow |
| Ruins | Rusted bulletins, missing sheets, hand-painted planks | Leaning posts, sagging catwalk | torn layers, holes |
| Magic | Hanging shingle, object-shaped sign | Iron bracket, chains | gilt wear |

---

### Sources (all fetched for this note)
- https://www.videogameschronicle.com/news/take-two-explains-why-grand-theft-auto-doesnt-include-more-real-world-brands/
- https://www.denofgeek.com/games/loki-fallout-retrofuturism-design-references-style-influences
- https://kotaku.com/you-say-apocalypse-i-say-retro-chic-5552980
- https://thegameloop.substack.com/p/remembering-rapture
- https://combineoverwiki.net/wiki/Combine_imagery
- https://www.inverse.com/article/48512-cyberpunk-2077-ads-make-future-marketing-look-invasively-scary
- https://slashfilm.com/809210/the-blade-runner-curse-explained
- https://oaaa.org/blog-posts/the-future-of-ooh-what-blade-runner-2049-gets-right-and-wrong/
- https://laughingsquid.com/sophisticated-ad-for-biomechanical-firm-is-viral-ruse-for-deus-ex-game/
- https://www.gamestar.de/artikel/kurioses-boulevardzeitung-the-sun-haelt-kybernetic-firma-aus-deus-ex-fuer-echt,3029075.html
- https://gamesbeat.com/the-outer-worlds-interview-crafting-galactic-sarcasm/
- https://madegooddesigns.com/portal-font/
- https://www.slideshare.net/slideshow/style-and-gameplay-in-the-mirrors-edge/127661765
- https://hypercritic.org/collection/disco-elysium-rpg-analysis-review
- https://hyper3d.ai/blog/disco-elysiums-art-style-a-deep-dive-into-its-unique-visuals
- https://www.mnhs.org/mnopedia/search/index/thing/burma-shave
- https://www.si.edu/object/nmah_844939
- https://en.wikipedia.org/wiki/Wall_Drug
- https://www.rvtravel.com/sign-promising-free-ice-water-was/
- https://en.wikipedia.org/wiki/Harley_Warrick
- https://en.wikipedia.org/wiki/Ghost_sign
- https://archipediavm.upress.virginia.edu/essays/TH-01-ART002
- https://www.scenic.org/why-scenic-conservation/billboards-and-sign-control/hba/
- https://www.ls.graphics/ideas/7-soviet-poster-techniques-designers-still-use-today-without-realizing-it
- https://antikbar.co.uk/collections/propaganda-posters/products/conquest-of-space-heroic-labour-ussr-pp1294
- https://hyperallergic.com/handcrafted-japanese-shop-signs-kanban-mingei-museum.md
- https://www.mplus.org.hk/en/magazine/collecting-conserving-exhibiting-neon-signs-mplus-museum-hong-kong/
- https://hongkongfp.com/2023/04/16/its-disappearing-very-fast-hong-kongs-fading-neon-heritage-shines-a-spotlight-on-the-craft/
- https://aws.oaaa.org/AboutOOH/OOHBasics/OOHMediaFormats/Bulletins.aspx
- https://dashtwo.com/blog/what-are-billboard-dimensions/
- https://www.papersizes.org/billboard-sizes.htm
- https://www.madehow.com/Volume-5/Billboard.html
- https://www.encyclopedia.com/literature-and-arts/performing-arts/theater/billboard
- https://oaaa.org/resources/history-of-ooh/
- https://billboardinsider.com/the-better-the-frame-the-better-the-picture/
- https://www.adquick.com/answers/how-many-words-should-a-billboard-ad-have

The fetch tool blocked these pages, so nothing here relies on them: Wikipedia's Billboard, Neon signs in Hong Kong and Kanban articles, and Smithsonian Magazine's Blade Runner billboard article.

## Part C. Ring-world sprite library: what to add next

Research for widening the procedural painter's set of placed objects. Every factual claim carries a tag: [src] links to the page it came from (reference-style links, listed at the bottom), [est] marks my own estimate or design judgement, [calc] marks arithmetic on sourced figures.

Existing set (not repeated below): the trees; brick, glass, deco, slab, dome, needle, pylon, arch, wizard, onion, cottage, aframe, barn, silo, windmill, stave, row, pagoda, torii, castle, lighthouse, cathedral, mosque, clock, factory, watertower, capsule, megablock, geodome, observatory and turbine buildings; fence, lamp, bench, hydrant, bicycle, sign, mailbox, barrel, crate and figure props; the robots; the easter eggs.

---

### 1. How games make placed objects feel diverse (and what to copy)

| Game / source | What it does | Rule to adopt here |
|---|---|---|
| Townscaper | Big shapes stay predictable, small shapes vary: "I want the larger shapes to feel very predictable, but the smaller shapes are allowed to vary quite a bit." Props (windows, chimneys, bushes, benches) are placed against surfaces the shape leaves open. Gardens appear only in enclosed areas. Colour changes which details appear. Simple birds anchor to nearby objects [src][townscaper] | Keep building silhouettes stable and spend variety on attached overlays (awnings, rooftop clutter, water tanks, flower boxes). Gate some props on context, e.g. a fairy ring only where trees enclose a clearing. |
| Minecraft villages | One style per biome (plains, desert sandstone, savanna acacia, taiga spruce, snowy). Buildings drawn at random from a pool, with weights per village type. Decorations (lamp posts, hay bales, melon patches, pumpkin piles) fill gaps where no building fits. A village spanning two biomes keeps one style. 2% of villages spawn abandoned: mossy cobble, cobwebs, no doors, no torches [src][mc] [src][mcvar] | Pick a vernacular family once per settlement, not per sprite. Give gap-filler props their own pass. Build "derelict" as a transform over existing sprites (darker palette, missing parts, lean) and apply it at a low rate outside the ruins world. |
| Dorfromantik | An "ideal and harmonic interpretation of the real-world landscapes". Small details and tiny animations reward looking closely, and anything that would break the calm is rejected [src][dorf] | Cap the number of loud elements per view. Animate only small things (wisps, flags, blades, steam). |
| Islanders | A building scores by what is near it (a lumberjack near trees and away from other lumberjacks), so the layout reads as purposeful [src][islanders] | Express placement as "near X, away from same kind": a windpump near a trough, a beehive near an orchard, an oast house near hop poles. |
| RimWorld ruins | Ruins are damaged walls, columns, steles, urns, sarcophagi, stone flooring and debris. They blend into mountain edges. Debris sits along roads. A wall with no damage reads as a shrine, not a ruin [src][rim] | The jagged top edge is the cue that says "ruin". Scatter debris along roads in the ruins world. |
| Stardew Valley artifact spots | Spawning in an area stops once 2 or more already exist (1 on the Farm). Nothing spawns on tiles that already hold objects [src][stardew] | Per-region caps: a hard maximum per sprite per view stops clumping and repeats. |
| Death Stranding | Player structures (postbox, watchtower, bridge, generator, timefall shelter, safe house, zip-line) sit along delivery routes, and a new zip-line must connect to an existing one [src][ds] | Network sprites (monorail, zip-line pylons, relay beacons, power poles) should place as chains along a path, never as isolated singles. |
| No Man's Sky | Fully random generation looked natural only about 1% of the time. Simple combined rules (moisture by distance from the sun, then rivers, erosion and weather) "seem natural" [src][nms] | Drive props from the painter's existing fields (moisture, slope, road distance, city amount) instead of free random scatter. |
| Bad North | "a beautiful array of watered down tones" and minimalism throughout [src][badnorth] | Use a limited palette for each world kind, and vary within it. |
| Sample without replacement | Picking 20 of 100 items independently gives about an 87% chance of at least one repeat (the birthday problem). A shuffle bag avoids it [src][bag] | When choosing variants for neighbouring sprites, draw from a shuffle bag of the 3 to 5 variants. |
| "Oatmeal" and spice | Endless unique output still feels samey. The fix is to take things away: make a few big choices per output, use discrete palettes, correlate properties, and add rare feature flags at about 10% or less each. "You must establish a rule before you break it" [src][oatmeal] | Per scene: choose a vernacular family, a fence type and a palette, then hold them. Set landmark and rare tiers at 10% or below. |

#### Rarity tiers used in the table
- **common**: filler. It can appear many times per view.
- **frequent**: several per view where its context exists.
- **uncommon**: 0 to 2 per view.
- **rare**: appears in roughly 10% of scenes or fewer (the spice rule [src][oatmeal]).
- **landmark**: at most 1 per view, and never twice in a row along the ring [est].
- **overlay**: attaches to another sprite rather than standing alone.

#### Readability at 20 to 60 px [est]
- If a 10 m building is drawn 40 px tall, 1 px is 0.25 m. A 1 m prop then gets only 4 px, so anything under about 1.5 m needs 1.5 to 2 times exaggeration, or should be shown as a cluster.
- Each sprite gets 1 key signature that survives tiny sizes, and the silhouette descriptions below put it first: the sag of a power line, a pole poking out of a haystack, the cowl on an oast kiln, the dark gap under a dolmen.
- Two-tone shading (a lit side and a shadow side) does more than outline detail below 30 px.
- Give each world kind a palette of 5 to 8 colours, and draw variants from it rather than from free HSV.

---

### 2. Standing stones, stone circles, dolmens: the real numbers

#### Reference sites

| Site | Plan | Diameter | Stones | Heights | Notable features |
|---|---|---|---|---|---|
| Stonehenge, sarsen circle | true circle with lintels | about 30 m, lintels about 4 m up [src][eh-stones] | 30 uprights, 30 lintels [src][eh-stones] | uprights 4.0 h × 2.2 w × 1.2 d; lintels 0.8 thick × 3.5 long [src][eh-kit] | lintels fixed by mortise and tenon and by tongue and groove; lintel faces worked into a continuous curve [src][eh-stones] |
| Stonehenge, trilithon horseshoe | horseshoe of 5 trilithons inside the circle [src][eh-kit] | — | 5 × (2 uprights + 1 lintel) | uprights 5.2, 6.0, 6.5 m (great trilithon); lintels 0.5 thick × 4.5 long [src][eh-kit]; tallest stone 6.7 m above ground plus 2.4 m buried [src][gwr-tri] | bluestones: 1.6 m in the circle, 2.2 m in the horseshoe [src][eh-kit] |
| Avebury | huge ring inside a ditch and bank | 427 m [src][avebury] | 98 originally, 27 in place; two inner circles of 30 [src][avebury] | each about 40 t or more [src][avebury] | stones "left rough and not dressed" [src][avebury] |
| West Kennet Avenue | paired rows | 2.5 km long, 15 m wide [src][wka] | about 100 pairs, a pair every 24.5 m [src][wka] | average about 3 m [src][wka] | tall cylindrical stones face broad triangular ones across the avenue [src][wka] |
| Ring of Brodgar | true circle inside a rock-cut ditch | 104 m; ditch 136 m across, 6 m wide, 3 m deep [src][brodgar] [src][brodgar2] | 60 originally, 36 survive [src][brodgar] | 2.1 to 4.7 m [src][brodgar] | one stone split by lightning in 1980 [src][brodgar2]; the stones are thin slabs [est] |
| Callanish | small circle, central monolith, cross-shaped rows | 11.4 m, flattened on the east [src][calla] | 13 in the circle; avenue 83.2 m with 19 remaining; three short rows of 5, 5 and 4 stones [src][calla] | circle stones average about 3 m; central monolith 4.8 m, shaped "like a ship's rudder"; eastern avenue stones about 3/4 the height of the western [src][calla] | all local Lewisian gneiss [src][calla] |
| Castlerigg | flattened circle | 32.6 × 29.5 m [src][castle] | 38 to 42 [src][castle] | tallest about 2.3 m; 1843 account: one about 7 ft, several about 4 ft, others much less [src][castle] | 3.3 m entrance gap on the north; a rectangle of 10 stones inside on the east [src][castle] |
| Carnac, Ménec | 11 converging rows | 1,165 m × 100 m [src][carnac] | more than 3,000 stones across the area; a cromlech of 71 blocks at the west end [src][carnac] | about 4 m at the wide west end, falling to about 0.6 m, then rising again at the east [src][carnac] | Grand Menhir Brisé was about 17 m tall plus 3 m below ground [src][carnac] |
| Poulnabrone (portal dolmen) | tomb chamber on a low mound | mound about 10 m [src][poul] | 2 portal stones plus side stones; sources disagree on the count [src][poul] | capstone 3.9 m long, 2 to 3 m wide, 0.3 m thick, sloping up to the west [src][poul] | originally covered by a cairn; now a "stone skeleton" [src][poul] |
| Classic Breton dolmen | table on legs | — | — | tablestone about 7.6 m long and about 40 t, on pillars about 1.8 m high [src][carnac] | — |

#### Generation rules derived from these
- **Diameter**: 10 to 35 m for most circles (Callanish, Castlerigg, Stonehenge), and 100 m or more as a rare landmark (Brodgar, Avebury) [calc from the table].
- **Spacing**: about 2.5 to 3 m between stone centres for small circles (Castlerigg is about 40 stones on about 98 m of circumference, so about 2.4 m; Callanish is 13 on about 36 m, so about 2.8 m). Large rings are sparser: Brodgar is 60 on about 327 m, so about 5.4 m [calc].
- **Count**: 9 to 40, plus 1 central stone in about 20% of circles [est]. Many real circles are incomplete: Brodgar keeps 36 of 60 and Avebury 27 of 98 [src][brodgar] [src][avebury]. Remove 20 to 50% of stones and lay 10 to 20% flat, fallen outward [est].
- **Shape**: not a perfect circle. Flatten one side by 5 to 10% (Castlerigg, Callanish) [src][castle] [src][calla]. Leave a 1-stone gap as an entrance facing the road [src: Castlerigg gap][castle].
- **Heights**: within one circle, the tallest should be 1.5 to 2.5 times the shortest (Castlerigg and Brodgar ranges) [calc]. Grade heights toward one side or toward the entrance. Callanish's avenue drops by about 25% from west to east, and Ménec drops from 4 m to 0.6 m along the rows [src][calla] [src][carnac].
- **Avenues**: pairs every 8 to 10 stone widths, with the gap across 5 to 6 stone widths (West Kennet is 24.5 m between pairs and 15 m across for stones about 3 m high) [src][wka] [calc]. Alternate a tall pillar with a broad triangle across each pair [src][wka].
- **Dressed vs rough**: a lintelled circle (trilithon world) has squarer uprights and flat tops, because Stonehenge's tops were levelled and the lintels curved [src][eh-stones]. A plain circle has rough, undressed stones like Avebury's [src][avebury]. Never mix the two within one ring [est].

#### What makes a standing stone read in silhouette
1. **Taper to the top**: menhirs "often taper toward the top" [src][menhir]. Draw a quadrilateral whose top is 40 to 70% of the base width, with one shoulder higher than the other [est].
2. **No two the same**: vary width as well as height. Pair a pillar with a lozenge or triangle (West Kennet's two types) [src][wka].
3. **Lean**: 0 to 12° in either direction, with a few at 15 to 25° for drama and 1 fallen stone lying flat [est].
4. **Rough edges**: 1 or 2 notches or chips on the outline, and an irregular rounded top rather than a point [est].
5. **Lichen and weathering**: yellow and grey lichen patches are typical on sarsen [src][lichen]. Use 3 to 6 small pale-yellow or grey-green blotches on the lit side, 1 or 2 dark vertical crack lines, and a darker damp band with a grass tuft at the foot [est].
6. **Depth in the ring**: draw the circle as an ellipse. Back stones sit higher on screen and smaller (about 85%), and front stones are darker and overlap them. This depth cue is what makes the "ring" read at 30 px [est].
7. **Dolmen key read**: the dark hollow under the capstone. The capstone is a thin slab (Poulnabrone is about 0.3 m thick on a 3.9 m length) that tilts upward at one end [src][poul]. It must overhang its supports.
8. **Trilithon key read**: the lintel gap. Keep the uprights close (about 0.3 to 0.5 of an upright's width apart), and show a slight overhang and a tenon knob where a lintel is missing [src: tenon on stone 56][eh-stones] [est].

---

### 3. Candidate sprites (91)

Size is height × width in metres, or a diameter or length where noted. The silhouette column lists 3 to 7 flat shapes, with the cue that reads at 20 to 60 px first. Placement uses the painter's inputs: world kind, slope, moisture, distance to road and city amount.

#### 3a. Wilds: farms, fields, roadsides

| # | Name | Worlds | Size H × W (m) | Silhouette (3 to 7 flat shapes) | Placement rule | Rarity |
|---|---|---|---|---|---|---|
| 1 | Utility pole + wires | wilds, cities (low), ruins | 10.7–16.8 × 0.3; crossarm about 2.4 wide. Poles come in 35–55 ft [src][usda]; crossarm width [est] | **sagging catenary wires to the next pole**; tall thin brown tapered rect; 1 crossarm bar; 2–3 insulator dots; optional grey transformer can | Single file along one side of the road, 3–6 m off the verge; spacing 45–70 m [est] (USDA's worked example allows spans of about 72 m [src][usda]); follow road curves; absent from high-city cores (buried) [est] | common |
| 2 | Leaning pole, dropped wire | ruins | as #1, lean 5–25° [est] | as #1, tilted; 1 wire hanging to the ground; crossarm askew | Replace 20–40% of poles in ruins [est] | frequent (ruins) |
| 3 | Round hay bale | wilds | 1.2–1.5 diameter (4×4 to 5×6 ft) [src][hay] | **spiral line on the end face**; circle (end-on) or rounded rect (side-on); dark ground-shadow wedge; plastic-wrapped white or green silage variant [est] | Mown fields: low slope, mid moisture, not by houses; loose rows of 3–12 along field edges; a pyramid stack of 6 now and then [est] | frequent |
| 4 | Square bale stack | wilds | bale 0.36 × 0.46 × 0.91 [src][hay]; stack 1.5–3 × 2–4 [est] | 3–10 brick-bonded straw rects; 1–2 twine lines per bale; lighter top row | Beside a barn or on a trailer; 1 per farm [est] | uncommon |
| 5 | Haystack / stooks | wilds, magic | 3–5 × 2–4 [est] | **centre pole sticking out of the top** (Eastern European style) [est]; tall beehive cone; darker rain-cap; stooks are rows of 3–6 small triangles | Hand-farmed fields, older-feeling worlds; stook rows across gentle slopes [est] | uncommon |
| 6 | Tractor | wilds | 2.5–3 × 4–5 long [est] | **big rear wheel and small front wheel**; boxy hood; cab rect with window; exhaust stack line; red, green or blue body | In a field heading along the furrows, or at a barn door; 0–1 per farm [est] | uncommon |
| 7 | Stock water trough | wilds | 0.3–0.6 × 1.2–2.4 (1–2 ft high, 4–8 ft long) [src][trough] | low galvanised-grey rect with rounded ends; **thin pale water line on top**; 1 rim highlight | Against fences, at the foot of a windpump, near grazing [est] | frequent (pasture) |
| 8 | Windpump (American farm type) | wilds, ruins | about 10 × 2.4 (a 33 ft tower and 8 ft wheel are the reference model) [src][windpump] | **many-bladed wheel disc** (12–18 radial blades [est]); narrow lattice trapezoid tower with 2–3 X-braces; tail-vane triangle; tank or trough at the base | Dry pasture (low moisture), away from the road; 1 per ranch; ruins variant missing blades [est] | uncommon |
| 9 | Village well | wilds, magic | 2.5 × 1.5 [est] | short stone drum with brick lines; 2 posts; **small gable roof over the hole**; windlass bar; bucket dot | Village centre. Minecraft villages organise around a meeting point [src][mc]. 1 per village; magic variant is #89 | uncommon |
| 10 | Scarecrow | wilds, magic | 1.6–1.9 × 1.2 [est] | **T of pole and crossbar**; sack-head circle; hat brim and crown; ragged shirt trapezoid with jagged hem; 1–2 crow dots | Middle of a crop field, at most 1 per field; magic variant has a pumpkin head [est] | uncommon |
| 11 | Beehives (box stack) | wilds | 0.5–1.0 × 0.41–0.51 (box 19⅞ × 16 in; deep box 9⅝ in) [src][bee] | 2–3 stacked rects; lid overhang; tiny entrance slit; **a different pastel per box** | Rows of 3–8 at an orchard or field edge, all facing one way [est] | uncommon |
| 12 | Straw skep | wilds, magic | 0.4–0.5 × 0.4 [est] | bell dome with **4–6 horizontal coil bands**; dark entrance notch; plank bench | 2–5 on a bench by cottages or in fey glades [est] | rare |
| 13 | Grain bin (corrugated) | wilds | 5–20 × 4.6–18 (15–60 ft diameter) [src][bins]; height about 1–1.5 × diameter [est] | silver cylinder with vertical shade bands; **shallow cone roof with cap**; spiral ladder line; auger diagonal linking bins | Farmsteads on flat ground, rows of 2–6, high grain-farm amount [est] | frequent (grain farms) |
| 14 | Prairie grain elevator | wilds | 24+ × 8–12 [src][elev] | **tall box with a gabled cupola box on top**; lower gabled annex; painted name band; CPR red or corporate colours [src][elev] | Beside a railway or road in a small town, often in a row (Inglis, Manitoba has 5) [src][elev] | landmark |
| 15 | Dry stone wall | wilds, ruins, magic | 1.2–1.5 × run [est] | long low band; **comb of upright coping stones on top** [src: coping][wall]; irregular stone blotches; slightly narrower top [est] | Field boundaries on high, steep, dry ground; follows contours and runs straight up hills; gaps for gates [est] | frequent |
| 16 | Fence variants (zigzag split-rail, wattle hurdle, barbed wire, picket) | wilds, magic, ruins | 1.0–1.4 [est] | zigzag of alternating diagonals; woven horizontal band (wattle); thin posts with 3 lines (barbed); white comb (picket) | Extends the existing fence. Choose one type per region, not per segment ("big decisions" [src][oatmeal]) | common |
| 17 | Hedgerow | wilds | 1.5–3 × run [est] | long lumpy dark-green band of 3–5 bulges; **an occasional tree rising out of it** | Field edges in wet lowlands; trade off against #15 by moisture and slope [est] | frequent |
| 18 | Five-bar gate | wilds | 1.2 × 3.6 [est] | 5 horizontal bars; **1 diagonal brace**; 2 thick posts | In wall or hedge gaps facing the road [est] | frequent |
| 19 | Cairn (trail / summit) | wilds, magic, ruins | trail cairns about 0.3 [src][cairn]; summit cairns up to about 5 high × 24 across (Brown Willy) [src][cairn] | 3–7 stacked ellipses shrinking upward; grey; summit form is a wide low mound | Ridgelines, peaks, passes, unclear path junctions [src][cairn]; bigger near summits, because walkers add stones [src][cairn] | uncommon |
| 20 | Inuksuk | wilds (cold), magic | 0.5–2 × up to 2 [src][inuk] | **human form**: 2 leg blocks, a wide slab across them, torso block, arm slab, head block | Hilltops and shores in snow or tundra; singles or a few [src][inuk] | rare |
| 21 | Milestone | wilds, ruins | 0.6–1.0 × 0.4 [est] | short slab with a rounded or angled top; 1–2 tiny dark text lines; white-painted variant | On the road verge at a fixed distance per ring segment; also against walls and on bridges [src][mile] | frequent (roads) |
| 22 | Wayside shrine (pillar or niche) | wilds, magic | 2–3.5 × 0.6–1 [est] | pillar rect; box with a **dark niche hole**; small gable or tent roof; cross or finial; flower dots | Crossroads, field corners, tops of passes [est] | uncommon |
| 23 | Roadside crucifix | wilds | 3–4 × 1.5 [est] | tall cross; **tiny roof over the crossbar**; small figure blob; picket enclosure | Village edges on the road [est] | rare |
| 24 | Prayer-flag line | wilds (mountain), magic | 0.3 × 10–30 run [est] | catenary string between 2 poles or rocks; **10–30 squares repeating blue, white, red, green, yellow** [src][flags]; flutter animation | Passes, bridges, summits and chortens; high slope [est] | uncommon |
| 25 | Chorten | wilds (mountain), magic | 3–8 × 2–5 [est] | stepped square base (2–3 rects); bulb body that flares rather than domes (Tibetan); **spire of stacked rings with a crescent and disc finial**; white (red band [est]); Bhutanese variant is a square pillar; Nepali variant has painted eyes [src][chorten] | River junctions, crossroads, passes, bridges, hilltops [src][chorten]; pair with #24 | rare |
| 26 | Mani wall | wilds (mountain) | 1–1.5 × 3–30 [est] | long low band of flat stones; **pale carved-glyph dots**; small chorten at each end | Along mountain paths [est] | rare |
| 27 | Dovecote (round tower) | wilds | 6–10 × 3–5 [est] | cylinder; conical or domed roof [src][dove]; **groups of 4–15 small round holes** [src][dove]; ledge band [est]; variant on pillars that looks "like mushrooms" [src][dove] | Alone mid-field, or beside a farmhouse or château [src][dove] | rare |
| 28 | Oast house | wilds | 10–14 tall [est]; kilns 3.7–5.5 diameter [src][oast] | 1–8 round kilns [src][oast]: drum + steep cone + **white cowl with a tilted vane**; long barn rect attached | Rolling hills, near a hop garden (#43) [est] | rare |
| 29 | Hórreo (raised granary) | wilds | 3–5 × 3–6 [est] | box on 4–6 short pillars with **flat stone discs on top of the pillars** (rodent guards) [src][horreo]; pyramid hip roof (square, Asturias) or long gable (rectangular, Galicia) [src][horreo]; slatted sides | Beside farmhouses on damp, hilly ground; 1 per farm [est] | uncommon |
| 30 | Trullo cluster | wilds | 4–6 × 3–4 per cone [est]; walls 1.6–2 m to the vault [src][trullo] | whitewashed drum or cube; **grey stone cone with course lines and a ball, disc or bowl pinnacle**; painted white symbol on the cone [src][trullo] | 3–5 joined units, or farm clusters of 12–24 [src][trullo]; dry, rocky, gentle ground | uncommon |
| 31 | Rondavel | wilds | 4–5 × 4–6 [est] | **cone on a drum** [src][rond]; thatch with a fringe; painted or patterned wall band (decorated dung finish) [src][rond]; corrugated-tin variant [src][rond] | Clusters of 3–7 around a circular cattle pen [src][up]; savanna, lower moisture | uncommon |
| 32 | Yurt / ger | wilds | 2.7 × 6.5 (6-wall ger: wall 1.7, centre 2.7) [src][ger] | low white drum; shallow cone roof; crown-ring dot; **orange decorated door** [src][ger2]; 2–3 tension-band lines | Flat dry grassland; groups of 1–5, every door facing south [src][ger2]; horse-line poles [est] | uncommon |
| 33 | Stilt longhouse | wilds (tropical, wet) | 6–9 × 30–150 [est] | **very long rect on many thin stilts**; long low gable; continuous veranda band; notched-log ladder | Riverbanks and hillsides [src][longh]; high moisture; 1 per village | rare |
| 34 | Bahay kubo (stilt hut) | wilds (tropical) | 4–6 × 4 [est] | cube on 4–6 posts; **tall steep thatch roof with a peak and long eaves** [src][kubo]; woven-bamboo texture; ladder | Wet lowlands near palms and bamboo; animals and storage under the floor [src][kubo] | uncommon |
| 35 | Adobe pueblo block | wilds, ruins | 3–15 × 10–40 [est] | 2–5 stacked set-back rects [src][pueblo]; **rows of protruding beam-end dots** (vigas) [src][pueblo]; small dark doors; ladder poles above the roofline [src][pueblo]; dome oven [est] | Desert (low moisture) near saguaro and joshua trees; plaza in the middle [src][pueblo] | uncommon |
| 36 | Machiya row | cities, wilds | 6–8 tall × 5.4–6 frontage [src][machiya] | narrow 2-storey rect; tiled eave band at each floor; **vertical lattice lines on the ground floor**; slatted upper window [src][machiya]; shop curtain [est] | Continuous terraces along old-town streets; vary only the lattice and its colour (red in pleasure districts) [src][machiya] | frequent (old town) |
| 37 | Gasshō-zukuri farmhouse | wilds (snowy mountain) | 10–15 × 10–20 [est] | **huge steep thatched A-triangle** with 3–4 rows of gable windows [est]; Gokayama's roofs are steeper than Shirakawa-go's [src][gassho] | Narrow valleys with heavy snow and high moisture; groups of 3–10, all aligned [est] | rare |
| 38 | Village chapel (bell-cote) | wilds | 6–10 × 6–10 [est] | white gable box; **small open bell-cote on the ridge**; arched door; graveyard crosses | Village edge on a rise; 1 per village [est] | uncommon |
| 39 | Gas station | wilds, cities, ruins | canopy underside 4–5.5 (13–18 ft) [src][canopy]; 6 × 20–30 overall [est] | **thin flat canopy slab on 2–4 columns** with a coloured fascia stripe; 2–4 pump boxes; tall price sign; small shop box | Road edge between settlements; ruins: canopy tilted, pumps toppled [est] | uncommon |
| 40 | Motel | wilds, neon | 4–7 × 20–40 [est] | long low bar of repeated door and window units; walkway rail; **tall arrow sign** (lit in neon) | Highway outskirts near #39 [est] | rare |
| 41 | Diner | wilds, cities, neon | 4 × 12 [est] | **rounded rail-car body with a chrome stripe**; band of windows; script roof sign | Roadside, near #39 and #40 [est] | rare |
| 42 | Greenhouse / polytunnel | wilds, builders | 2.5–4 × 6–30 [est] | gabled glasshouse with a pale grid; or a **ribbed half-cylinder** (polytunnel) | Rows of 3–10 on flat farmland; builders variant is a glowing hex [est] | uncommon |
| 43 | Hop garden / vineyard rows | wilds | vines 1.5; hop poles 5 [est] | parallel rows of short posts with a green ribbon; hops: **tall poles with a wire lattice** | Vineyards on sun-facing slopes; hops next to #28 [est] | uncommon |
| 44 | Guyed radio mast | wilds, cities, builders | 50–300 × 2 [est] | hair-thin lattice line with red and white bands; **3–6 guy wires fanning to the ground**; red light dot at night | Hilltops or open flat land away from towns; 1 per region [est] | landmark |

#### 3b. Cities and neon: street furniture and roofs

| # | Name | Worlds | Size H × W (m) | Silhouette | Placement rule | Rarity |
|---|---|---|---|---|---|---|
| 45 | Rooftop wooden water tank | cities | 3–3.7 × 3–3.7 (10–12 ft, about 10,000 gal) [src][tank] | wooden barrel with **3–5 steel hoop lines**; conical roof [src][tank]; steel stand legs [est] | On mid-rise roofs, about 1 per building (attach to brick, row and deco) [est] | frequent (overlay) |
| 46 | Bus shelter | cities, wilds, neon | 2.5 × 3–4 [est] | thin roof slab on 2 posts; pale glass back panel; **lit advert rect at one end**; bench line; pole with a disc sign | Every 300–500 m on main roads near buildings [est] | frequent |
| 47 | Phone box (K6 type) | cities, wilds, ruins | 2.4–2.5 × 0.9 [est] | tall red rect; **domed top** [src][k6]; crown dot; grid of small panes; sign band | Village greens and corners, often by the post office [src][k6]; 1 per village | uncommon |
| 48 | Vending machine bank | cities, neon | 1.8 × 1.0 each [est] | upright rect; **lit upper window holding 3–4 rows of coloured product dots**; dark slot; 2–4 side by side | Street corners and stations. Japan has about 4 million machines (2020), 56% selling drinks [src][vend], so in neon treat them as dense filler | frequent (neon) |
| 49 | Traffic light | cities, neon, ruins | UK pole up to 3.4 [src][signal]; US mast arm 6–8 [est] | pole + dark head with 3 dots, **only 1 lit**; or an L-shaped mast arm over the road | Every intersection; ruins: all dark, one head dangling [est] | frequent |
| 50 | Newsstand / kiosk | cities | 2.5–3 × 2–3 [est] | box with a deep awning; magazines as colour stripes; **round-top kiosk variant with a dome cap** | Plaza corners, near stations [est] | uncommon |
| 51 | Food cart | cities, neon | 2–2.5 × 1.5–2 [est] | box on 2 wheels; **umbrella dome**; steam wisps; lantern dot (neon) | Groups of 2–5 by parks and markets; night-market light strings in neon [est] | uncommon |
| 52 | Parked car | cities, wilds, neon | 1.5 × 4.5 [est] | rounded body rect; cabin trapezoid with window; **2 wheel circles**; 6-colour palette per world | Nose-to-tail along kerbs with 1–2 gaps; single cars in driveways [est] | common |
| 53 | Scooter / moped | cities, neon | 1.1 × 1.8 [est] | 2 small wheels; step-through body curve; handlebar T | Groups of 3–10 on dense-city pavements [est] | frequent |
| 54 | Shop awning | cities, wilds | 0.5–1 deep × shopfront [est] | sloped trapezoid with **4–8 colour stripes and a scalloped hem** | Ground floors of brick, row and deco buildings; one stripe colour per street [est] | frequent (overlay) |
| 55 | Rooftop clutter | cities, neon, builders | 0.8–1.5 [est] | 2–4 boxes with a **fan circle**; pipe line; small dish | 1–4 per flat roof, more in neon [est] | common (overlay) |
| 56 | Billboard | cities, wilds, neon | 6–10 × 14.6 [est] | 1–2 legs; wide rect with a bold 2-colour graphic; **catwalk line under it**; glows and flickers in neon | Highways at the city edge; rooftops in neon [est] | uncommon |
| 57 | Vertical neon blade sign | neon | 3–8 × 0.8 [est] | narrow rect jutting from the façade; **3–6 stacked glowing glyph blocks**; tube outline | 1–3 per façade, alternating sides of the street [est] | common (neon) |
| 58 | Steam stack / vent | neon, cities | 1.5 × 0.5 [est] | short orange-and-white striped cylinder; **puffy steam column** | In the road, about 1 per block [est] | uncommon |

#### 3c. Ruins (post-apocalyptic)

| # | Name | Worlds | Size H × W (m) | Silhouette | Placement rule | Rarity |
|---|---|---|---|---|---|---|
| 59 | Rubble pile | ruins | 0.5–3 × 2–8 [est] | low mound of 5–7 angular polygons in 2 tones; **rebar lines sticking out** | Bases of broken buildings and road edges; RimWorld scatters debris along roads [src][rim] | common |
| 60 | Broken wall / façade | ruins, magic | 2–10 × 3–10 [est] | rect with a **jagged top edge**; 1–2 empty window holes; ivy blob | Outlines a former building. The damage is the cue: an intact wall reads as a shrine, not a ruin [src][rim] | frequent |
| 61 | Broken column | ruins, magic | 1–5 × 0.8 [est] | short fluted cylinder with a **diagonal break**; drum segments lying beside it; toppled capital block | Rows of 3–6 (a lost colonnade); add steles, urns and sarcophagi as in RimWorld ruins [src][rim] | uncommon |
| 62 | Toppled statue | ruins, magic | 1–3 × 3–6 lying [est] | **head circle lying on its side**; torso slab; empty plinth block; raised arm stub | Ruined-city plaza; 1 per city [est] | rare |
| 63 | Rusted car hulk | ruins | 1.3 × 4.5 [est] | car silhouette with **dark empty windows**; sunken flat-tyre ellipses; rust blotches | Along roads in jams of 3–8 [est] | frequent |
| 64 | Burnt-out bus | ruins | 3 × 12 [est] | long rect with a row of dark windows; **sagging roof line**; char smudge | Mid-road or at a dead bus stop [est] | rare |
| 65 | Shipping container | ruins, builders, cities | 2.59 × 6.10 or 12.19, width 2.44 [src][cont] | rect with **vertical corrugation lines**; door end with 2 lock bars; faded red, blue, green or rust | Stacks of 2–4, container walls, singles on their side; ports and edges [est] | frequent |
| 66 | Collapsed overpass | ruins | 6–10 × 30–60 [est] | **deck slab broken into 2 tilted pieces**; 2–3 piers; dangling rebar | Over a road crossing; 1 per ruin region [est] | landmark |
| 67 | Crater | ruins | 0–2 deep × 5–30 [est] | dark ellipse centre; **lighter rim crescent**; scattered chips; scorch ring | Anywhere, including off-road [est] | uncommon |
| 68 | Tank traps / sandbags | ruins | 1–1.5 × 1.5 [est] | **3-beam steel X star**; or rows of stacked sandbag ellipses | Lines across roads at city edges [est] | uncommon |
| 69 | Derelict transform (any sprite) | ruins, plus a little elsewhere | — | the existing sprite tilted 3–10°, darker palette, missing pieces, moss and stain | Ruins: most sprites. Elsewhere about 2%, like Minecraft's 2% abandoned villages with moss, cobwebs and no doors [src][mc] | frequent (variant) |

#### 3d. Builders (megastructure works, sci-fi)

| # | Name | Worlds | Size H × W (m) | Silhouette | Placement rule | Rarity |
|---|---|---|---|---|---|---|
| 70 | Landing pad | builders | 0.5 × 20–40 [est] | flat ellipse with an **H or ring marking**; 4–8 edge light dots; short control mast | Flat ground (low slope only), near megablocks; 1 per settlement [est] | uncommon |
| 71 | Antenna array / dish | builders, wilds | 10–25 × 10–20 [est] | **parabolic dish arc**; feed-horn line; lattice mount trapezoid; rows of 3–8 dishes all aimed the same way | High, flat ground away from city light [est] | rare |
| 72 | Solar field | builders, cities, wilds | 2–4 tall [est]; tables 28 modules long × 2 high [src][solar] | rows of thin **dark-blue parallelograms with pale grid lines, all at one tilt**; small inverter box [src: inverters][solar] | Flat, sunny, low moisture; large rectangular blocks, with tilt constant inside a field [est] | frequent |
| 73 | Monorail pylon + beam | builders, cities, neon | 8–15 × 2 [est] | T or Y pier; **thick beam band continuing to the next pier**; occasional pod car | A chain at fixed spacing along the road or straight across terrain. It must connect, like Death Stranding's zip-lines [src][ds] | uncommon (network) |
| 74 | Pipe run | builders, ruins | 1–3 × run [est] | 1–3 parallel tubes; support frame every few metres; flange rings; **a valve wheel** | Between factory or megablock and geodome; follows contours [est] | frequent |
| 75 | Cargo crate stack | builders | 1–2.5 [est] | chamfered boxes; **hazard-stripe band**; 1 glowing tag | Around landing pads, in piles of 2–6 [est] | frequent |
| 76 | Relay beacon | builders, neon, magic | 4–12 × 1 [est] | slim mast; **glowing tip orb with 2–3 halo rings** | Regular intervals along routes, like Death Stranding's watchtowers, generators and postboxes [src][ds]; hilltops | uncommon |
| 77 | Construction crane | builders, cities | 30–60 × 40–60 [est] | lattice tower line; **long jib bar**; counterweight block; hook line | Beside an unfinished megastructure; 1–3 per city [est] | uncommon |
| 78 | Scaffold | builders, cities | variable [est] | grid of thin lines over part of a façade; green mesh tint | Attached to 5–10% of buildings [est] | uncommon (overlay) |
| 79 | Survey tripod | builders, wilds | 1.5 [est] | 3-leg tripod; instrument box; **little flag** | Road ends and unfinished terrain [est] | rare |

#### 3e. Magic / fey (and ancient)

| # | Name | Worlds | Size H × W (m) | Silhouette | Placement rule | Rarity |
|---|---|---|---|---|---|---|
| 80 | Standing stone (menhir) | magic, wilds, ruins | usually 1–4.7 (Brodgar 2.1–4.7 [src][brodgar]); giants 17–20.6 (Grand Menhir Brisé, Er Grah) [src][carnac] | **quadrilateral tapering to the top** [src][menhir] with one shoulder higher; lean 0–12° [est]; 2–3 crack lines; yellow and grey lichen blotches [src][lichen]; dark damp foot band [est] | Alone on ridges, moors and path sides; mid to low moisture [est] | uncommon |
| 81 | Stone circle | magic, wilds | diameter 10–35 (rarely 100+) [src][calla] [src][castle] [src][brodgar] | ellipse of 9–40 menhirs, back stones smaller; **1 gap as an entrance**; 10–20% fallen [est]; see section 2 | Open level ground or a gentle rise; road distance moderate [est] | rare |
| 82 | Trilithon / lintelled circle | magic | uprights 4–6.5; lintels 3.5–4.5 long, 0.5–0.8 thick [src][eh-kit] | 2 squared uprights + **1 overhanging lintel**; tenon knob where a lintel is missing [src][eh-stones] | Centre of the grandest circles, as 1–5 in a horseshoe [src][eh-kit] | landmark |
| 83 | Dolmen | magic, wilds, ruins | capstone 3.9 × 2–3, 0.3 thick (Poulnabrone) [src][poul]; large: 7.6 m table on 1.8 m legs [src][carnac] | 2–4 upright slabs; **thin tilted capstone over a dark hollow** [src][poul]; low mound ellipse | Hillsides and bare limestone; standalone [est] | rare |
| 84 | Stone row / avenue | magic | 0.6–4 per stone; pairs every 24.5 m, 15 m across (West Kennet) [src][wka] | paired stones receding in perspective; **pillar vs triangle across each pair** [src][wka]; or Carnac-style parallel rows grading 4 m → 0.6 m [src][carnac] | Leads up to a circle; follows a ridge or the road [est] | rare |
| 85 | Fairy ring | magic, wilds | mushrooms 0.05–0.15 [est]; rings over 10 m across, record about 600 m [src][fairy] | ring of 8–20 tiny caps; **darker-green grass band outside, pale dead band inside** [src][fairy]; sparkle dots (magic) | Damp meadows and enclosed woodland clearings; high moisture [est] | uncommon |
| 86 | Will-o'-the-wisp | magic | orb 0.2–0.5, a few inches to 1 m above the ground [src][wisp] | **soft glow disc with a bright core**; bluish, greenish or red [src][wisp]; 2–5 in a trailing line | Bogs, marshes, graveyards [src][wisp]; high moisture, low slope; night only; drifts away from the viewer [src: recedes when approached][wisp] | uncommon |
| 87 | Giant flower | magic | 3–6 × 1–3 [est]; real titan arum about 3 m (record 3.73 m) [src][titan]; real Rafflesia 1.11 m across [src][raff] | tall spadix in a **frilled bell-shaped spathe** [src][titan], or 5 fat petals spread on the ground (Rafflesia type); glowing centre [est] | Glades near fern and mushroom; 1–3 per glade [est] | uncommon |
| 88 | Floating rock | magic | 3–15 × 3–20 [est] | **inverted teardrop of rock**; flat grassy top with 1 tree or ruin; 2–3 dangling roots; small shadow on the ground far below | Above cliffs and steep slopes; 1–3 per scene; slow bob [est] | rare |
| 89 | Wishing well | magic | 2.5 [est] | well silhouette (#9) + flowering vines + **glow rising from the shaft**; coin sparkle | Glade centre; the magic variant of #9 [est] | rare |
| 90 | Toadstool house | magic | 2–4 [est] | **huge spotted cap dome**; round door in the stalk; tiny window; little chimney | In mushroom clusters, 2–5 together [est] | uncommon |
| 91 | Moon gate / living arch | magic | 3–4 [est] | **circular ring** of stone or woven branches; leaf blobs; inner glow | Ends of paths, or between 2 standing stones [est] | rare |

---

### 4. Suggested first batch (highest value per effort) [est]

1. Utility pole + wires (#1, #2): one sprite that makes every road read as inhabited, and changes character across worlds (intact, leaning, buried).
2. Round hay bale (#3) and grain bin (#13): instant "farm" at 20 px.
3. Dry stone wall and hedgerow (#15, #17): field structure, chosen by moisture and slope.
4. Standing stone, stone circle and dolmen (#80, #81, #83): the magic world's anchors, using section 2's rules.
5. Parked car and bus shelter (#52, #46), plus rooftop water tank and clutter (#45, #55): cities stop looking empty.
6. Vending machines and neon blade signs (#48, #57): neon density.
7. Shipping container, rusted car and rubble (#65, #63, #59), plus the derelict transform (#69): the ruins world for little new art.
8. Solar field and pipe run (#72, #74): builders' ground texture.
9. Fairy ring and will-o'-the-wisp (#85, #86): cheap and animated.
10. One vernacular family per region (yurt, trullo, rondavel, hórreo, machiya, pueblo): pick one per settlement, never mixed [src: Minecraft per-biome style][mc].

---

### 5. Sources

Blocked or unread: these Wikipedia pages could not be fetched directly under the session's fetch rules, so their facts came from other pages or are marked [est]: Ring of Brodgar, Fairy ring (used the Utah State herbarium page instead), Prayer flag (used the Samye Institute page), Bildstock / wayside shrine (marked [est]), Doocot (used Connexion France). Bad North's generation details are not covered by the articles found. The windpump page gives a model scenario rather than a survey of real towers.

[eh-stones]: https://www.english-heritage.org.uk/visit/places/stonehenge/things-to-do/stone-circle/stones-of-stonehenge/
[eh-kit]: https://www.english-heritage.org.uk/siteassets/home/learn/teaching-resources/small-scale-stonehenge_stonehenge-teachers-kit_ks3.pdf
[gwr-tri]: https://www.guinnessworldrecords.com/world-records/69023-largest-trilithons
[avebury]: https://stonepages.com/england/avebury.html
[wka]: https://english-heritage.org.uk/visit/places/west-kennet-avenue/history
[brodgar]: https://www.historicenvironment.scot/visit-a-place/places/ring-of-brodgar-stone-circle-and-henge/history/
[brodgar2]: https://www.undiscoveredscotland.co.uk/westmainland/ringofbrodgar/
[calla]: https://en.wikipedia.org/wiki/Callanish_Stones
[carnac]: https://en.wikipedia.org/wiki/Carnac_stones
[castle]: https://en.wikipedia.org/wiki/Castlerigg_stone_circle
[menhir]: https://en.wikipedia.org/wiki/Menhir
[poul]: https://en.wikipedia.org/wiki/Poulnabrone_dolmen
[lichen]: https://uksouthwest.net/wiltshire/avebury-world-heritage-site/avebury-lichen-stone.html
[townscaper]: https://www.gamedeveloper.com/game-platforms/how-townscaper-works-a-story-four-games-in-the-making
[dorf]: https://www.gamedeveloper.com/disciplines/sparking-joy-through-tile-placement-in-idyllic-village-builder-i-dorfromantik-i-
[mc]: https://minecraft.fandom.com/wiki/Village
[mcvar]: https://www.sportskeeda.com/minecraft/all-village-variants-minecraft-explained
[islanders]: https://islaguru.com/articles/islanders-game
[rim]: https://rimworldwiki.com/wiki/Ruins
[stardew]: https://stardewvalleywiki.com/Twigs
[ds]: https://samurai-gamers.com/death-stranding/structures-and-facilities-guide/
[nms]: https://www.technologyreview.com/2014/07/22/12940/no-mans-sky-a-vast-game-crafted-by-algorithms/
[badnorth]: https://www.pocketgamer.biz/interview/68638/indie-spotlight-plausible-concept-on-bad-north/
[bag]: https://diplograph.net/notes/games/procgen/sample-without-replacement-procgen
[oatmeal]: https://www.boristhebrave.com/2026/07/05/oatmeal-spice/
[hay]: https://www.skidsteers.com/blog/hay-bale-size/
[usda]: https://rd.usda.gov/sites/default/files/UEP_Bulletin_1724E-150.pdf
[windpump]: https://www.firgelliauto.com/blogs/mechanisms/windmill-and-steel-tower
[trough]: https://north40.com/tarter-oval-galvanized-stock-tank
[bee]: https://beeprofessor.com/langstroth-hive-dimensions/
[bins]: https://www.siouxsteel.com/explore-our-products/grain-storage/farm-bins
[elev]: https://thecanadianencyclopedia.ca/en/article/grain-elevators
[wall]: https://www.northyorkmoors.org.uk/__data/assets/pdf_file/0035/509696/SPECIFICATIONS-Drystone-walling.pdf
[cairn]: https://www.newworldencyclopedia.org/entry/cairn
[inuk]: https://newworldencyclopedia.org/entry/Inuksuk
[mile]: https://www.peterboroughcivicsociety.org.uk/doc/MILESTONES.pdf
[chorten]: https://www.dailybhutan.com/amp/why-bhutanese-built-chortens-everywhere
[flags]: https://samyeinstitute.org/wiki/prayer-flags
[dove]: https://www.connexionfrance.com/Practical/Property/France-s-vanishing-pigeon-palaces
[oast]: https://en.wikipedia.org/wiki/Oast_house
[horreo]: https://en.wikipedia.org/wiki/H%C3%B3rreo
[trullo]: https://en.wikipedia.org/wiki/Trullo
[rond]: https://en.wikipedia.org/wiki/Rondavel
[up]: https://repository.up.ac.za/handle/2263/10792
[ger]: https://mongoliabusiness.mn/made-in-mongolia-online-shop/buy-mongolian-yurt/mongolia-6-walled-yurt-ger/
[ger2]: https://eternal-landscapes.co.uk/the-mongolian-ger/
[longh]: https://www.nst.com.my/amp/news/nation/2024/03/1028745/tradition-longhouse-living-sarawak
[kubo]: https://en.wikipedia.org/wiki/Bahay_kubo
[pueblo]: https://en.wikipedia.org/wiki/Pueblo_architecture
[machiya]: https://en.wikipedia.org/wiki/Machiya
[gassho]: https://www.mlit.go.jp/tagengo-db/R1-00113.html
[canopy]: https://newimagecanopy.com/how-tall-are-gas-station-canopies/
[tank]: https://www.jlconline.com/how-to/watering-manhattan_o/
[k6]: https://charnwood.gov.uk/listed_buildings/k6_telephone_kiosk_main_street_swithland
[vend]: https://unseen-japan.com/number-of-vending-machines-in-japan-dwindling/
[signal]: https://www.sheffield.gov.uk/sites/default/files/docs/roads-and-pavements/guidance-for-developers/Traffic%20Signals%20Standard%20Detail.pdf
[cont]: https://boxhub.com/resources/shipping-container-dimensions-guide
[solar]: https://knowledgebase.glintsolar.com/en/article/equipment-and-layout
[fairy]: https://artsci.usu.edu/herbarium/activities_fun-stuff/fun-facts-about-fungi/fairy-rings
[wisp]: https://en.wikipedia.org/wiki/Will-o%27-the-wisp
[titan]: https://www.rbge.org.uk/news/amorphophallus-titanum/about-the-plant
[raff]: https://www.guinnessworldrecords.com/world-records/66511-largest-single-flower

