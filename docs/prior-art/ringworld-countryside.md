# Ringworld Countryside: Fields, Terraces, Night Lights, Working Robots, the Shore

Research for the Ringworld surface's countryside pass: farmland in rings round towns, terraces on steep ground, a town's lights at night, placing rules between kinds, robots that work, a hard-light bridge, and boats at a jetty. The code it informs is stepsRing.js (placing) and paintKit.js (painting).

**Tags.** [src](URL) marks a claim from a source opened and read for this note. [est] marks an estimate or design judgement. Lengths are metres unless marked.

## Summary

- Land use round a settlement falls off with distance: intensive gardens and dairy nearest, then wood, then grain, then pasture and stock, then wild land [src](https://vivekanandacollegekolkata.ac.in/uploads/1776077779_VONTHUNENS_AGRICULTURAL_LAND_USE_MODEL_geography.pdf). Archaeology puts real numbers on it: arable land lies within about 0.5 km of a 2 ha village and within about 1.2 km of a 10 ha one; grazing reaches 2 to 5 km [src](https://arxiv.org/pdf/1705.03398).
- Field sizes span three orders of magnitude. A medieval strip was about 201 × 20 m [src](https://en.wikipedia.org/wiki/Selion), a mechanized Japanese paddy is 30 × 100 m [src](https://www.jircas.go.jp/sites/default/files/publication/tars/tars9-_291-298.pdf), and an American quarter section is 805 m square [src](https://en.wikipedia.org/wiki/Section_(United_States_land_surveying)). Fields average about 1 ha worldwide [src](https://www.farmersjournal.ie/tillage/news/research-reveals-1-6-billion-crop-fields-worldwide-932007).
- A patchwork reads by season. The same field goes green, then gold, then taupe stubble, then bare earth [src](https://orionmagazine.org/article/pullman-washington-7453/). The loud accents (rapeseed yellow, lavender purple, poppy red) last only a few weeks [src](https://www.moustiers.fr/de/node/2045).
- Hedges are kept at about 2 m tall and 1.5 m wide, with a tree every 20 to 30 m [src](https://www.gov.uk/countryside-stewardship-grants/management-of-hedgerows-be3) [src](https://teagasc.ie/wp-content/uploads/2025/05/stockproofhedge.establishment.factsheet_2-2.pdf). Dry-stone walls stand 1.2 to 1.6 m, with a base half the height and a top half the base [src](https://conservationhandbooks.com/?p=569).
- Terrace risers are 1 to 2 m on rice and about 2 m (up to 3.3 m) on Douro vines; treads are 1 to 5 m [src](https://qcat.wocat.net/zh/wocat/technologies/view/permalink/5056) [src](https://www.fortheloveofport.com/historic-terraces-in-the-douro/).
- At night, towns are bright clusters joined by faint tendrils of road, and farmland is dark gaps [src](https://svs.gsfc.nasa.gov/Gallery/EarthatNightImagery.html). Sodium lamps glow orange and take minutes to warm up; LEDs are whiter and come on at once [src](https://petapixel.com/2026/09/08/astronauts-before-and-after-photos-show-how-cities-switched-from-orange-to-white-light/) [src](https://en.wikipedia.org/wiki/Sodium-vapor_lamp).
- Robots read as friendly or threatening from their body plan and their eyes. Horizon made its gentle machines on vertebrates and its war machines on insects, arachnids and crustaceans [src](https://en.wikipedia.org/wiki/Machines_(Horizon)). Fallout's designers found that big eyes read cute and small eyes read predatory [src](https://bethesda.net/en-EU/news/fallout-4-creating-codsworth).

## 1. Rings round a village

**Von Thünen** (1826: one market town, a uniform plain, horse and cart) [src](https://vivekanandacollegekolkata.ac.in/uploads/1776077779_VONTHUNENS_AGRICULTURAL_LAND_USE_MODEL_geography.pdf). The zones run outward: I horticulture and dairy (perishable, manured with the town's waste); II forestry (fuel wood, bulky to haul); III intensive crops, mainly rye; IV mixed farming on a seven-year rotation (rye, barley, oats, three years of pasture, fallow); V the three-field system; VI livestock. A loaded cart moved about 1 mile per hour. Zone II suits a 19th-century fuel economy; a painted village can put woodlots in the gaps instead [est].

**Real radii** [src](https://arxiv.org/pdf/1705.03398). Fields lie within 5 km of a settlement, preferably within 1 to 2 km, and livestock within 5 km (after Chisholm 1979, Higgs and Vita-Finzi 1972). A 2 ha village had arable land within 0.5 km of its edge and grazing within 2 km; a 10 ha village (about 270 people) had fields within 1.2 km. Both fit an arable radius of about 0.35 km × √(village hectares) [est].

**Infield and outfield** (Scotland) [src](https://en.wikipedia.org/wiki/Agriculture_in_Scotland_in_the_Middle_Ages). The infield was the best land, next to the houses, cropped every year (bere barley, oats) and given most of the manure. The outfield was larger and farther out, mostly oats, manured by folding cattle on it overnight and often fallow. In the uplands a small infield sat inside a large outfield. Runrig strips ran downhill, so each holder had wet and dry ground.

**Open fields** [src](https://en.wikipedia.org/wiki/Open-field_system). A village had two or three great fields of several hundred acres, divided into furlongs and then strips (selions). A family held about 70 strips (about 8 ha) scattered across them, and each house had a croft of about half an acre. One field was in autumn crops, one in spring crops, one fallow; common pasture, woodland and closes lay beyond. Enclosure ran from the 15th century to about 1850, through more than 5,000 Acts of Parliament.

**Bocage** [src](https://en.wikipedia.org/wiki/Bocage). Small irregular fields are bounded by earth banks and ditches, with hedges up to 4.9 m tall on the banks and sunken lanes between. One square mile of Normandy could hold hundreds of enclosures. In Ireland, trees on the banks make land look wooded where there is little woodland.

**Walls tell an enclosure's age** [src](https://knowledge.ullswaterheritage.org/heritage-knowledge-bank/history-contents/history-by-theme/farming/dry-stone-walls-around-ullswater). Meandering walls round the farmstead are the oldest; straighter "intake" walls climb the valley sides; arrow-straight Enclosure Act walls cross the high fells (about 1750 to 1850). So: irregular near the village, rectilinear far out [est].

**Parcels in research** [src](https://perso.liris.cnrs.fr/egalin/Articles/2012-villages.pdf). Emilien et al. 2012 grow field parcels by Euclidean distance, at infinite cost across roads, water and walls, so parcels follow a road's curve. Growth is slope-sensitive (a quadratic cost on the directional gradient), so fields don't spread straight up a slope, and a bell curve on slope sends corn farms to the flat and vineyards to hills.

## 2. Field sizes

| System | Size | Shape and notes |
|---|---|---|
| Medieval selion | 1 acre: 660 × 66 ft, about 201 × 20 m [src](https://en.wikipedia.org/wiki/Selion) | long strip, grouped in furlongs |
| Japanese traditional paddy | about 0.1 ha, with 1 m paths [src](https://www.jircas.go.jp/sites/default/files/publication/tars/tars9-_291-298.pdf) | made for animal ploughing |
| Japanese mechanized paddy | 0.3 to 0.9 ha; long sides 100 to 150 m, short 30 to 60 m; blocks of 3 to 9 ha with 15 to 16 lots; roads 4 to 7 m [src](https://www.jircas.go.jp/sites/default/files/publication/tars/tars9-_291-298.pdf) | 0.2 to 0.45 ha on steep ground |
| US survey grid | section 260 ha (1,609 m square), quarter 65 ha (805 m), quarter-quarter 16 ha (402 m) [src](https://en.wikipedia.org/wiki/Section_(United_States_land_surveying)) | a north-south grid |
| World | about 1.6 billion fields, mean about 1 ha [src](https://www.farmersjournal.ie/tillage/news/research-reveals-1-6-billion-crop-fields-worldwide-932007) | — |
| Size classes | under 0.64; 0.64 to 2.56; 2.56 to 16; 16 to 100; over 100 ha [src](https://essd.copernicus.org/articles/14/4397/2022/essd-14-4397-2022.html) | — |

**By region** [src](https://www.technologynetworks.com/applied-sciences/news/smallholdings-more-important-to-global-food-production-than-previously-thought-312156): very small fields in Ethiopia, Mali, Nigeria, Tanzania, China, India and Indonesia; medium in Europe; very large in Australia, Brazil, Kazakhstan and the US. Fields under about 2 ha cover 40% of farmland. Farms are larger than fields: the EU average farm is 12.6 ha, Germany's 46 ha, and the US average 419 acres [src](https://www.farm-equipment.com/articles/6100-squeezed-for-space).

## 3. Crop colours across the season, and what is in a field

**The Palouse.** Winter wheat is thin green under snow, spring is fresh green, summer brings "fat golden heads", and harvest leaves dusty taupe: "verdant green, dusty taupe, harvest gold" [src](https://orionmagazine.org/article/pullman-washington-7453/). Wheat and legumes are the crops, with canola as yellow accents. Tractor lines follow the contours of the loess hills [src](https://kevinlisota.photography/2019/06/the-rolling-hills-and-patterns-of-the-palouse/).

**Biei, Hokkaido.** Crops grow in separate sections: fresh green fields and golden wheat in summer, all white under snow in winter [src](https://cdn.gltjp.com/en/directory/item/15893/). The palette is green, yellow and brown, and rotation changes the view from year to year [src](https://www.his-usa.com/destination-japan/hokkaido/biei_in_hokkaido.html). Lone trees are the landmarks (the Ken and Mary Tree, the Seven Stars Tree) [src](https://cdn.gltjp.com/en/directory/item/15893/).

**Valensole, Provence** [src](https://www.moustiers.fr/de/node/2045). Lavandin blooms from mid-June to mid-July, deepest in early July, and harvest starts about July 15. Wheat, oats, sunflowers and sage grow alongside, almonds blossom in March, and red soil shows in autumn. The plateau is at about 500 m.

**Rows.** Lavandin rows are about 0.9 m apart (1.2 m is common), with plants 0.4 m apart in the row [src](https://www.richters.com/questions-and-answers/05-20040120-1). Vine rows are 1.8 to 2.4 m apart and vines 1.2 to 1.8 m. Rows run north-south, or along the contour on steep ground, and the trellis stands about 1.7 to 1.8 m [src](https://doubleavineyards.com/blogs/field-notes/vineyard-design-row-orientation-row-and-vine-spacing-and-trellis-height).

**Rapeseed, China.** Luoping is best in February and March and finished by June; at Niujie the flowers are planted in contour rings like rice terraces [src](https://www.amusingplanet.com/2012/10/rapeseed-fields-in-luoping-china.html). In Wuyuan about 6,700 ha bloom from mid-March to early April round white-walled, grey-tiled Huizhou villages, with pink peach and white pear blossom at the same time [src](https://govt.chinadaily.com.cn/s/202203/30/WS6243eca8498e6a12c122899f/wuyuan-county-jiangxi-province.html).

**Val d'Orcia, Tuscany.** In late spring the wheat is still green and the hills go red with poppies. Rows of cypresses line the lanes, and villages perch on the ridges [src](https://www.agriturismi.it/en/routes/focus/val_dorcia_and_crete_senesi_rural_heart_of_tuscany).

**Rice terraces (Longji)** [src](https://www.revigorate.com/longji-rice-terraces.html): flooded in spring ("tiled in silver"); pale to emerald green in summer, each level at a slightly different stage; gold in late September and early October; bare walls in winter, with snow above.

**Stacks and bales.** Monet's "haystacks" were grain stacks, 3 to 6 m tall, round, with steep thatched tops. At sunset the shadowed side glows brick red inside vermilion and yellow, and the field is flecked with pink, orange and mauve [src](https://en.wikipedia.org/wiki/Haystacks_(Monet_series)). Round bales are 1.2 to 1.8 m across and 1.2 to 1.5 m wide [src](https://chess.jefferson.edu/round-hay-bale-size).

**What a field holds.** A dry lowland farm runs 14 to 15 ewes per hectare [src](https://www.daera-ni.gov.uk/news/boosting-flock-performance). A scarecrow is a T-frame stuffed with straw in old clothes; Japan's kakashi is humanoid; today they are mostly decorative [src](https://www.invent.org/blog/everyday-stem/scarecrows).

## 4. Hedges and walls

**Hedges.**
- Kept at least 2 m tall and 1.5 m wide, cut no more than one year in two or three, between autumn and winter [src](https://www.gov.uk/countryside-stewardship-grants/management-of-hedgerows-be3).
- Management stages run past 2 m, 3 m and 4 m tall; laying needs 3 to 4 m of growth [src](https://ptes.org/wp-content/uploads/2014/09/Hedgelink_Hedge_Management_Cycle.pdf).
- In Britain, 68% of hedges are 1 to 2 m wide, and most have a canopy base 0.1 to 0.5 m off the ground [src](https://nora.nerc.ac.uk/id/eprint/4798/1/M03_hedgerows_final_report.pdf).
- Britain had about 1.8 million hedgerow trees in 1998 [src](https://nora.nerc.ac.uk/id/eprint/4798/1/M03_hedgerows_final_report.pdf).
- Planting is a staggered double row, 5 plants per metre, trimmed into an A shape, with one hedgerow tree every 20 to 30 m [src](https://teagasc.ie/wp-content/uploads/2025/05/stockproofhedge.establishment.factsheet_2-2.pdf).

**Dry-stone walls.**
- At least 1.2 m tall for cattle and 1.6 m for sheep; base about half the height; top about half the base, never under 0.3 m (0.35 m is better) [src](https://conservationhandbooks.com/?p=569).
- Field walls round Ullswater are about 0.9 m at the base and 0.4 m at the top, with through-stones and a coping row [src](https://knowledge.ullswaterheritage.org/heritage-knowledge-bank/history-contents/history-by-theme/farming/dry-stone-walls-around-ullswater).

## 5. Terraces

**Ifugao (Philippine Cordilleras)** [src](https://qcat.wocat.net/zh/wocat/technologies/view/permalink/5056) [src](https://en.wikipedia.org/wiki/Rice_Terraces_of_the_Philippine_Cordilleras). Risers are 1 to 2 m tall, in places as tall as the bed is wide; treads 1 to 5 m on slopes of 30 to 60%, of earth with grass-bound bunds. Stone or mud walls follow the contours, at over 1,000 m, and a communal forest (muyong) caps each cluster and feeds its water.

**Honghe Hani (Yuanyang)** [src](https://en.wikipedia.org/wiki/Honghe_Hani_Rice_Terraces). From top to bottom: forest above 2,000 m, villages at 1,400 to 2,000 m, terraces below fed by canals. Some slopes hold over 3,000 terraces from forest edge to valley floor. **Longji** runs from 300 to 1,100 m, its water feeding "more than 10,000 fields" [src](https://www.revigorate.com/longji-rice-terraces.html).

**Douro** [src](https://www.winewisdom.com/?p=3552). Old stone terraces have high walls, a flat top and one or two vine rows along the contour; late-19th-century ones lower walls, a sloping bed and more rows; 1980s patamares are earth banks with two rows; one-row patamares serve slopes above about 35%; vertical planting is limited to slopes under 35%. Measured walls [src](https://www.fortheloveofport.com/historic-terraces-in-the-douro/): schist, about 2 m high and 0.7 m thick, in runs of about 400 m, with stone steps every 100 m and mule ramps at the ends; about 5.5 to 6 ft high for one row of vines, about 10 ft (3.3 m) for two or three; square holes for vines every 2 m in the oldest.

**Cinque Terre.** Nearly 6,000 km of terrace walls over about 2,000 ha, on slopes up to 100%, vineyards mostly at 16° to 34° [src](https://riviste.unige.it/bels/article/view/1070/1045). Vines alternate with olive strips, lemons on the lower terraces [src](https://www.cinqueterre.com/en/cinque-terre-on-foot-the-unesco-world-heritage-walls). That is 3 km of wall per hectare: one wall every 3.3 m of ground [est].

## 6. A settlement's lights at night

**From orbit.**
- Cities show as bright clusters with "faint tendrils of roads and highways", and farmland is unlit gaps between settlements. VIIRS pixels are about 742 m, enough to catch one isolated highway lamp. In Naples, old green mercury lamps sit beside yellow-orange sodium [src](https://svs.gsfc.nasa.gov/Gallery/EarthatNightImagery.html).
- Fishing fleets glow as islands at sea [src](https://svs.gsfc.nasa.gov/vis/a010000/a014800/a014872/script_38814_00.html).
- Some cities show orderly grids, others fan out from hubs, and ring roads mark past growth [src](https://www.scientificamerican.com/blog/plugged-in/cities-at-night-learning-about-cities-from-a-different-perspective/).

**Sodium against LED.**
- Old sodium glows warm orange, and LEDs are whiter and sharper. A switch to LED can look dimmer from space even with streets as bright [src](https://www.earth.com/image/nasa-satellites-reveal-dramatic-changes-in-earths-nighttime-lights/).
- Los Angeles's early LEDs were about 4,000 K and were warmed to about 3,000 K. Hong Kong kept sodium. Sodium lamps take time to warm up; LEDs turn on instantly [src](https://petapixel.com/2026/09/08/astronauts-before-and-after-photos-show-how-cities-switched-from-orange-to-white-light/).
- Low-pressure sodium is nearly monochromatic at 589 nm. It starts as a dim red-pink glow and turns bright yellow over a few minutes. Sodium lamps span 1,400 to 2,700 K, and white high-pressure sodium is about 2,500 K [src](https://en.wikipedia.org/wiki/Sodium-vapor_lamp).

**Street lamps.**
- Residential columns are about 6 m tall and 40 to 55 m apart, depending on road width [src](https://www.mpdc.govt.nz/wmmp/120-district-plan/mpdc-development-manual/1887-part-3-3142).
- Photocells switch on below 20 lux and off above 80 lux, after a 10 to 15 s delay [src](https://www.electrical4less.co.uk/wp-content/uploads/2019/09/Photocells-TECH-Sheet-Jan-18.pdf). Lamps therefore come on one by one, as each cell reads its own sky [est].

**Dusk.** Civil twilight ends with the sun 6° below the horizon, and artificial light is often not yet needed. Nautical twilight ends at 12°, when detailed outdoor work needs lamps. Astronomical twilight ends at 18° [src](https://www.weather.gov/lmk/twilight-types?lv=true).

## 7. How games and tools make farmland

- **Dorfromantik.** Hex tiles with forest, field, village, water, rail and barren sides. Matching edges score, and quests ask for a contiguous field of an exact size. The look comes from romantic and impressionist landscape painting [src](https://en.wikipedia.org/wiki/Dorfromantik).
- **Townscaper.** Decoration is a second pass after the modules: gardens form only in fully enclosed flat areas, and small stone walls appear at house corners. "I want the larger shapes to feel very predictable, but the smaller shapes are allowed to vary quite a bit" [src](https://gamedeveloper.com/blogs/how-townscaper-works-a-story-four-games-in-the-making).
- **Bad North.** Islands come from WFC over 300+ tiles. A navigability check gives unreachable ground forest instead of houses, and failed islands are rejected and retried [src](https://gamedeveloper.com/blogs/how-townscaper-works-a-story-four-games-in-the-making). Stålberg on diorama worlds: "Small diorama-like environments have been a thread throughout all my art" [src](https://www.pocketgamer.biz/interview/68638/indie-spotlight-plausible-concept-on-bad-north/).
- **Manor Lords.** Fields are drawn as four-sided plots measured in morgen, over a fertility map (green good, orange and red poor). Rotation leaves a fallow year that can serve as pasture [src](https://Gamespot.com/articles/manor-lords-farming-harvest-crops/1100-6523012/).
- **Farming Simulator.** The steps are plough (deep, removes stubble), cultivate (shallow), sow, roll and harvest, then straw is baled, chopped or made into silage [src](https://gameservercheck.com/en/wiki/arable-crop-planting-sowing-harvesting-in-fs-25). Each step is a visible field state [est].
- **Cities: Skylines.** Crop fields are buildings placed on fertile land, in "a variety of appearances"; on snow maps they become greenhouses [src](https://admin-forum.paradoxplaza.com/forum/developer-diary/cities-skylines-industries-dev-diary-2-industry-areas.1123567).
- **Watabou's Village Generator** added fields in 1.2.5 and improved them in 1.2.7 and 1.5.1. The method is described only on Patreon, which was not read [src](https://watabou.itch.io/village-generator/devlog/248943/125-fields).
- **Red Blob's mapgen4** mixes views: "the rivers and coastlines are top-down but the mountains and trees are side view", in an oblique projection [src](https://www.redblobgames.com/maps/mapgen4/). Fields painted flat on the ground with upright hedges and trees is the same trick [est].
- **"Martin Evans' village generators"**: no such source was found. The road-network blogs found were other authors'.

## 8. Robots: shape language, and robots at work

- **Horizon.** Machines blend animals, "not a literal translation of a singular one", and thin-legged designs were dropped for big readable bodies [src](https://blog.playstation.com/2017/02/24/the-making-of-horizon-zero-dawns-machines/). Terraforming machines are modelled on vertebrates, old military machines on insects, arachnids and crustaceans. The Watcher looks like a security camera, so its look tells its job; the Tallneck is peaceful and can't be harmed; roles are acquisition, recon and combat [src](https://en.wikipedia.org/wiki/Machines_(Horizon)).
- **WALL-E.** A trash compactor's body, binocular eyes that pivot and zoom: "A machine only does what is necessary to complete each task". EVE is a seamless egg [src](https://www.creativebloq.com/computer-arts/walle-year-s-model-11089200).
- **NieR: Automata** [src](https://en.wikipedia.org/wiki/Machines_(Nier:_Automata)). Spherical heads simple enough that "even a kid could draw" them, curves instead of sharp angles, and Yoko Taro's brief: "cute", "a little unbalanced", "rough, retro and a little dirty". Blinking camera covers and birdlike head twitches make them "gentle and alive". Weapons get more detail, so they look fearsome; stronger units are black and red, the strongest gold.
- **Fallout.** Codsworth is "a ball", designed from toasters and blenders, with eye pods styled after a 1950s scooter; "Bigger doe eyes give you the sense of something more cute", and small eyes feel predatory; with the armour off he turns sharp-angled and menacing [src](https://bethesda.net/en-EU/news/fallout-4-creating-codsworth). Eyebots come as combat, medical and repair kinds, Protectrons as security and shipping workers [src](https://fallout.wiki/wiki/Fallout:_New_Vegas_Robots).
- **Breath of the Wild.** The Guardian Stalker walks on six legs; its eye lights and charges for a few seconds before it fires (a telegraph). Decayed Guardians are blackened, mossy and still until approached [src](https://zeldadungeon.net/wiki/Guardian_Stalker).
- **Halo.** The Monitor (343 Guilty Spark) is a compact hovering sphere with one blue eye that turns red when enraged, set against the Sentinels' angular forms [src](https://en.wikipedia.org/wiki/343_Guilty_Spark). Sentinel castes do work: Constructors build and service, Gatherers keep constructed biomes in balance, Stewards gather raw materials [src](https://www.halopedia.org/Sentinels).
- **Real field robots.** Hands Free Hectare (2017) grew and harvested about 4.5 t of spring barley with a GPS-guided small tractor and combine, plus sampling drones [src](https://www.livescience.com/60567-robotically-tended-farm-completes-first-harvest.html). SwagBot is a "spindly all-terrain robotic cowboy" that animals "don't much like" [src](https://spectrum.ieee.org/swagbot-to-herd-cattle-on-australian-ranches). BeBot sifts the top 10 cm of sand for dice-sized litter, covers about 3,000 m² an hour, and runs partly on solar power [src](https://www.freethink.com/energy/beach-cleaning).

## 9. The hard-light bridge (a nod)

- Halo's light bridges are a "visible, horizontal band of light", mostly blue-white, solid enough to carry tanks across chasms. Emitters flicker when damaged; a holographic panel of symbols on a pedestal switches them on; one world's bridges carry symmetrical geometric line patterns [src](https://halopedia.org/Light_bridge).
- Hard light gives off blue-violet light where it breaks up [src](https://www.halopedia.org/Hard_light). Some Forerunner canyon bridges hang from energy cables like a truss arch [src](https://www.halopedia.org/Special:MobileDiff/1078518).
- Under the earlier note's rule (take the idea, invent the expression), ours should differ in at least three of shape, colour, proportion, ornament and context [est].

## 10. Boats and a jetty

- A small timber jetty stands on pairs of piles 1.65 m apart, 15 to 20 cm thick, in bays of about 3 m [src](https://downloads.unido.org/ot/47/91/4791633/10001-15000_10901.pdf).
- The deck sits at the level of high water at spring tides, with steps or a ladder where it stands more than about 1 m above low water [src](https://downloads.unido.org/ot/47/91/4791633/10001-15000_10901.pdf).
- A pontoon is at least half the longest boat and not under 6 m, about 3 m wide [src](https://downloads.unido.org/ot/47/91/4791633/10001-15000_10901.pdf).

## 11. Flat-shaded painters: fields and far lights

- **Eyvind Earle** [src](https://history.siggraph.org/wp-content/uploads/2022/12/2014-Poster-97-Murphy_Stylized-Trees-and-Landscapes.pdf): flat colour areas, smooth gradients, and point work for foliage packed along rims and on the lit side; shadows simpler than the things that cast them, often a different shape; rough terrain outlines first, then shapes, then dense points.
- **Firewatch (from Olly Moss's poster)** [src](https://www.thumbsticks.com/gdc-2015-the-art-of-firewatch): bold colour in distinct layers for depth; flat shapes with strong silhouettes and abstract inner detail; the sky sets most of the colour, fog adds distance, and a colour script ties palette to story beats.
- **Monet's coloured light on stacks and stubble** (see §3) [src](https://en.wikipedia.org/wiki/Haystacks_(Monet_series)).
- **Alena Aenami.** The one source opened describes only her format (speedpaint making-ofs, PSDs) [src](https://3dvf.com/actualite-21345-alena-aenami-artiste-freelance-html/). This note makes no claim about her style.

## What we take

**Rings** (m; the code's metre is its unit M) [est from §1]:

| Ring | Radius from the village edge | Holds |
|---|---|---|
| 0, yard | 0 to 30 | gardens, a hay rick, hives, an orchard; trees only at the far side of the yard |
| 1, infield | to 0.35 × √(village ha) km, about 0.5 km for a hamlet and 1.1 km for a town | small fields and strips, the year's crops, the most varied colours |
| 2, outfield and pasture | to 2 to 3 × ring 1 | larger fields, pasture with sheep, fallow, a woodlot in a hollow |
| 3, wild | beyond | forest, which starts only here (farmland before forest) |

**Fields** [est from §2]:

| Country or world | Field long × short | Notes |
|---|---|---|
| Old wilds, strips | 150 to 220 × 15 to 25 | in furlong blocks of 10 to 20, one direction per block |
| Wilds, hedged (bocage) | 60 to 150 × 40 to 100 | irregular, close to the village |
| Wilds, enclosure | 150 to 400 × 100 to 250 | straight walls, farther out |
| Rice, flat | 30 to 60 × 100 to 150 (mechanized), 20 × 50 (old) | bunds 0.3 to 0.5 wide |
| Big-country ranches (rare, far bands) | 400 to 800 square | one direction across the whole band |
| Vines and lavender | 50 to 150 × 30 to 80 | rows at 2.2 (vines) and 1.0 to 1.2 (lavender); rows north-south on the flat, along the contour on slopes |

- Orientation: one angle per town, with each furlong block turned ±15° from it. Strips turn to run downhill, as runrig does [src](https://en.wikipedia.org/wiki/Agriculture_in_Scotland_in_the_Middle_Ages).
- Fields nearer the village are smaller [est].

**Boundaries:**
- Hedges are 2 m tall (1.5 to 4) and 1.5 m wide, with a tree every 20 to 30 m, and gaps of 3 to 5 m at gateways [est].
- Walls are 1.2 to 1.6 m tall, with base = height/2, top = base/2 (at least 0.3 m), and a coping band 0.2 to 0.3 m tall [est from §4].
- Use walls in dry or high country and hedges in wet country. Edges near the village wander; far ones run straight.

**In fields:** round bales 1.5 m across in rows along the harvest lines, 20 to 40 m apart [est]; grain stacks 3 to 6 m tall with a thatched cone, two to six near the farm [src](https://en.wikipedia.org/wiki/Haystacks_(Monet_series)); sheep at 14 per hectare in loose flocks [src](https://www.daera-ni.gov.uk/news/boosting-flock-performance); one scarecrow per few fields of grain, 1.8 m tall on a T-frame [est].

**Terraces:** riser h of 1 to 2 m for rice and 1.5 to 3.3 m for vines and olives; tread t = h ÷ slope (rise over run), clamped to 1 to 6 m [est from §5]. A 1.5 m riser on a 50% slope gives a 3 m tread, as Ifugao's numbers show. Riser faces are earth (green-brown) for rice, grey stone for vines and olives. From top to bottom: forest cap, village, terraces, water [src](https://en.wikipedia.org/wiki/Honghe_Hani_Rice_Terraces).

**Colours** (RGB before light, all [est]):

| Crop | Field | Detail | Crop | Field | Detail |
|---|---|---|---|---|---|
| Young wheat or barley | 112 150 70 | — | Hay, mown | 150 170 90 | stripes 178 192 112 |
| Ripe wheat | 214 184 100 | tramlines 190 160 88 | Rapeseed in flower | 234 210 52 | after, 110 140 60 |
| Ripe barley | 206 190 138 | — | Lavender in bloom | 126 106 168 | soil 176 156 118 |
| Stubble | 206 184 128 | — | Lavender, harvested | 132 140 110 | — |
| Ploughed loam | 124 94 66 | furrows 92 68 48 | Vines, summer | 80 110 58 | soil 150 128 96 |
| Palouse taupe | 150 130 104 | — | Vines, autumn | 176 124 60 or 140 64 52 | — |
| Red soil (Provence) | 150 90 64 | — | Rice, flooded | sky mixed 0.7 with 110 120 110 | — |
| Grey clay (Crete Senesi) | 160 150 132 | — | Rice, growing to ripe | 118 156 112 to 196 170 84 | — |
| Pasture, summer | 104 146 72 | — | Tea | 74 110 62 | — |
| Pasture, winter | 122 140 84 | — | Poppies (accent) | 200 52 40 | — |

**Lights at night** [est from §6]:
- Colours: high-pressure sodium (about 2,100 K) 255 150 60; white sodium (about 2,500 K) 255 170 90; low-pressure sodium 255 176 40; LED at 3,000 K 255 180 107; LED at 4,000 K 255 209 163; windows (incandescent, about 2,700 K) 255 169 87; mercury 200 235 230.
- Choose by world: wilds and magic use windows and sodium, cities a mix shifting to LED, neon LED and signs, ruins fires (255 140 64).
- Density: one lamp every 45 m along lit streets, only within towns and on main roads within about 1 km of them. Rural roads stay dark, so farmland reads as dark gaps. Each house shows 1 to 3 window dots [src](https://svs.gsfc.nasa.gov/Gallery/EarthatNightImagery.html) [src](https://www.mpdc.govt.nz/wmmp/120-district-plan/mpdc-development-manual/1887-part-3-3142).
- Far towns: once neighbouring dots are under about 1.5 px apart, draw a soft glow of the same total light in place of the dots.
- Dusk order: windows come on as the sun goes from 0° to −6°. Each street lamp gets its own threshold (15 to 25 "lux") and a 0 to 15 s lag; sodium lamps then warm from red-pink 200 90 90 to their colour over a few minutes, while LEDs come on at full colour. At dawn, lamps go off at about four times their switch-on level, the photocell's hysteresis [src](https://www.electrical4less.co.uk/wp-content/uploads/2019/09/Photocells-TECH-Sheet-Jan-18.pdf).

**Placing rules** [est from §1, §7]:
- Order: houses, yards, ways, fields (within the rings), hedges and walls along field edges, hedgerow trees in the hedge lines, and forest only outside the farmed rings.
- Trees stand at least 4 m clear of walls. Ground no way reaches becomes forest or rough grazing, never fields (Bad North's rule). Fields never cross a way, water or a wall (Emilien's infinite costs).

**Robots** (friendly: round, vertebrate, big round eyes, low pose; threat: arthropod legs, slit or many small eyes, high pose, weapons more detailed than the body):

| Robot | Silhouette | What it does | Where and when |
|---|---|---|---|
| Harvester | a low barrel on two big wheels, a reel at the front, two lens eyes on a short neck, 3 to 4 m long | crosses a ripe field, leaving stubble and dropped bales behind | wilds and builders' fields, by day; at most one per town |
| Lamplighter | a tall thin pole on a single wheel, a hooded lantern head, one round eye | stops at each street lamp at dusk, and that lamp comes on as it leaves | cities and magic, from −2° to −8° sun |
| Shepherd | a quadruped (dog's chest, heron's legs), round head, tail-light antenna | walks the edge of a flock, keeping 10 to 20 m off | pasture, any time |
| Beachcomber crab | a shell 1 m wide on six short legs, a sieve at the back, one eye on a stalk | walks the tideline in a zigzag | coasts near towns, low sun |
| Threat counterparts | the same jobs with insect legs, a narrow red visor, and a telegraphing eye that glows before it acts | a reaper in an abandoned field, a sentry by a ruined jetty | ruins and neon only |

**The hard-light bridge** (rare: about 1 in 8 scenes where builders or ruins meet water) [est]: a flat plane 4 to 6 m wide, level from bank to bank, 15 to 25% opaque, pale blue-white (210 240 255), with bright edge lines (240 250 255) and faint chevrons every 3 m; an angular emitter block at each end and no pylons between; in ruins it flickers, with a gap where it fails. No Halo names, glyphs or exact shapes (the nod rule, §9).

**Boats and jetty** [est from §10]: a deck 2 to 2.5 m wide on pairs of piles every 3 m, about 1 m above the water, 15 to 40 m long; one or two boats of 4 to 7 m moored at its end, side-on, bows to the wind; only within 300 m of a town's houses.

## What this app can do that others don't [est]

- The fields lie on a ring floor that rises into the sky. The far side's patchwork hangs overhead as a band of coloured stripes, and at night its towns are a river of warm dots across the arch, something no flat-world game can show.
- One seed turns the seasons: the same fields go green, then gold, then stubble, then plough, and the scene can be dated by its crops.
- Terraces are lit from the light dial, so risers catch the low sun and paddies mirror the sky.
- Robots act on the world (a lamp lit, a field cut), with no game rules to serve.
