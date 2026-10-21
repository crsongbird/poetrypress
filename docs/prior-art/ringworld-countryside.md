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

## 12. Farmsteads seen from a little height

**What a farmstead holds.**
- In Lyon County, Iowa, the dominant Corn Belt farmstead was a single-family house and a general-purpose barn with "a cluster of smaller accessory buildings and sheds": granaries, cribs, silos, open cattle sheds, later hog houses, in a dispersed arrangement, "a small building in the midst of a group of larger buildings". Groves and windbreaks sheltered house, outbuildings and garden. Pioneer farmsteads were compact groups with a few acres ploughed round them [src](https://npgallery.nps.gov/NRHP/GetAsset/NRHP/64500161_text).
- A small listed Iowa farmstead covers about 2 acres (0.81 ha): cottage, barn, blacksmith shop, smokehouse, chicken house, milk house and shed, a windbreak round the house planted about 1900, and the farm drive [src](https://en.wikipedia.org/wiki/August_H.J._and_Justena_Lange_Farmstead_Historic_District). That is a square about 90 m on a side [est].
- Buildings stand at least 30 m apart against fire; livestock smells can need over 100 m from houses, and stock goes downwind of the house [src](https://funaab.edu.ng/funaab-ocw/LectureByWeek/LectureByWeek/AGE%20507/Lecture%201.pdf). The house sits between the barns and the road, front door to the drive, on ground higher than the drive [src](https://objects.lib.uidaho.edu/uiext/uiext15410.pdf).
- A cost estimator's steel grain bins run 30 to 59 ft (9 to 18 m) across and 15 to 59 ft (4.5 to 18 m) tall [src](https://www.swiftestimator.com/SE7Help/CE/help/Components/C_1701.htm). Storage silos in general are 3 to 27 m across and 10 to 90 m tall [src](https://en.wikipedia.org/wiki/Silo); a farm's own tower silo sits at the small end, about 5 m by 15 to 25 m [est].

**How the buildings stand round the yard.**
- South East England [src](https://www.southdowns.gov.uk/wp-content/uploads/2018/05/TSF-35-South-East-Farmsteads-Character-Statement.pdf): the loose courtyard has detached buildings on one to four sides of a yard (one or two on small Weald farms, three or four on arable downland). Regular plans are L (barn and shelter shed), U (barn central, sheds and stables in the wings), E, F, H, T and Z round two cattle yards (mostly 1820s to 1880s), and the full courtyard (rare, estate farms). Dispersed plans are clusters with no defined yard in an irregular paddock, driftway farms strung along a routeway, and multi-yard groups. Linear, row and parallel plans are rarer. Most barns are five bays long.
- Peak District [src](https://www.peakdistrict.gov.uk/__data/assets/pdf_file/0023/75416/PDNP_Farmsteads_Character_Statement_v2.pdf): linear plans about 40% (31% in line, 9% L with the house attached), courtyards about 37% (loose 25%, regular 12%), dispersed about 21%. Linear ranges under 20 m long gather in the South West Peak and those over 40 m in the White Peak. 1,688 field barns stand away from the farmsteads, a typical small one housing six cattle.
- Norway [src](https://snl.no/tun): square yards in the east (open, with wide gaps at the corners) and in Trøndelag (closed); clusters on the west coast; rows in the inland valleys. Some farms have two yards, an inner one for the people and an outer one for the cattle, and a yard is often given a yard tree (tuntre).

**How far apart.**
- Switzerland counts single-farm settlement only where the main houses stand at least 100 m apart; closer is a group [src](https://hls-dhs-dss.ch/de/articles/007948/2005-10-17/). Austria treats two single farms under 150 m apart as one. Its dispersed settlement (each farm amid its own plots, mostly founded 1000 to 1400) holds the Alps, pre-Alps and steep valley sides [src](https://austria-forum.org/af/AEIOU/Siedlungsformen/Siedlungsformen_english).
- Plains homesteaders lived on scattered quarter sections of 160 acres, with schools, churches and post offices only now and then between [src](https://plainshumanities.unl.edu/encyclopedia/doc/egp.ea.033.html); a quarter is a half-mile square [src](https://geographyworlds.com/blog/homestead-act-geography-guide/). One house per claim puts houses about 800 m apart [est]. Lyon County averaged 196 acres a farm in 1880 [src](https://npgallery.nps.gov/NRHP/GetAsset/NRHP/64500161_text): one farm per 79 ha, about 890 m apart [est].
- The Peak District park has over 2,500 recorded farmsteads, 80% isolated or in small clusters [src](https://www.peakdistrict.gov.uk/__data/assets/pdf_file/0023/75416/PDNP_Farmsteads_Character_Statement_v2.pdf), in 1,438 km² [src](https://www.peakdistrict.gov.uk/learning-about/news/mediacentrefacts): 1.7 per km², about 760 m apart on average, and 1.2 field barns per km² [est].
- Ireland: after rundale, the Commissioners preferred "squared" farms with the house in the middle of the holding; in the west, "ladder farms" strung the houses out like a street, with holdings running back from the line in parallel [src](https://www.open.edu/openlearn/openlearn-ireland/ireland-places-culture-heritage/the-rural-dimension-after-rundale).

## 13. Shelterbelts and windbreaks

**Round the farmstead.**
- Iowa [src](https://naturalresources.extension.iastate.edu/forestry/planning/windbreaks.html): at least three rows, 8 to 11 for more shelter; rows at least 20 ft (6 m) apart, plants 4 to 20 ft (1.2 to 6 m) apart by mature size; tallest trees inside, shortest shrubs upwind; on the north and west, never a solid ring round the farm. Conifers lead, since deciduous trees are 5 to 20% as effective. Shelter fades to little at 15 to 20 times the height. The inside row stands about 50 ft (15 m) from the site, 100 ft (30 m) for wide belts, to keep the drifts off it.
- Wisconsin [src](https://forestry.extension.wisc.edu/files/2017/09/FR-70.pdf): windward, interior and leeward rows (4 to 6 are better), 10 to 15 ft (3 to 4.5 m) apart, the middle row staggered; shrubs 4 ft (1.2 m) apart in the row, conifers 8 ft (2.4 m); at least 65 ft (20 m) from a building on its north or west; an optional snow trap of one or two shrub rows 50 ft (15 m) upwind. Windward: cedar, spruce, dogwood, hazel, ninebark, wild plum; interior: white and red pine, green ash, red oak. Heights: dogwood 1.2 to 3 m, hazel 2.4 to 3 m, hawthorn 6 to 7 m, white cedar 12 to 15 m, green ash 15 to 18 m, red pine 18 to 24 m, white pine to 30 m. 300 trees make a three-row belt 800 ft (244 m) long.
- Buildings and work areas lie within 2 to 5 heights of the belt, and in snow country at least 100 ft (30 m) from the windward row; density 60 to 80% all year [src](https://www.nrcs.usda.gov/conservation-basics/natural-resource-concerns/land/forests/agroforestry-systems/farmstead-windbreak). Colorado plants two or three juniper rows as an L on the north and west, and living snow fences 150 ft (46 m) from a road [src](https://sam.extension.colostate.edu/wp-content/uploads/sites/40/2018/04/Windbreak-Design.pdf).

**Along the fields** [src](https://www1.agriculture.alberta.ca/$department/deptdocs.nsf/all/agdex2073):
- Two to four belts per quarter section (805 m), up to eight on erodible soil; primary belts run north-south across the westerlies, secondary ones along the north or south edges of quarters. Belts stand perpendicular to the wind and continuous, gaps only for field approaches and machinery.
- Single rows: caragana at 30 to 50 cm (5 to 6 m tall), green ash at 1.5 to 2 m (15 m), white spruce at 3 m (20 m tall, 7 m spread), willow at 3 m (15 to 20 m), poplar at 2.5 to 3 m (25 m tall, 6 m spread, living 20 to 30 years). Saskatchewan sets two or three caragana between each pair of ash in one row.
- Shelter reaches about 20 heights downwind and 3 to 5 upwind (up to 25, or 125 m behind a 5 m belt); erosion shelter about 10. A young belt takes about 5 m: 1 m of plants and a 2 m cultivated strip each side.
- Colorado's field windbreaks are one or two rows about 200 ft (61 m) apart [src](https://sam.extension.colostate.edu/wp-content/uploads/sites/40/2018/04/Windbreak-Design.pdf). So belts fall 60 to 400 m apart, and from a little height read as dark dashes ruled across the patchwork, each with its shadow on the lee side [est].

## 14. Orchards and olive groves

- **Traditional orchards** [src](https://buildingconservation.com/articles/traditional-orchards/traditional-orchards.htm): apples 8 to 10 m apart, plums and cobnuts as close as 3 m, cherries and perry pears often over 20 m; usually under 150 trees per hectare, in permanent grass grazed by sheep or cattle or cut for hay. Trees on vigorous stocks grow 3 to 10 m tall (1 to 3 m on dwarfing stocks), with crowns high enough for stock to graze beneath. Planting may be regular, but replanting has often "blurred any original order"; old trees carry dead wood ("stag's heads") and mistletoe. The average orchard is about 1 ha.
- **Modern apples** (tall spindle) [src](https://fruitgrowersnews.com/article/the-tall-spindle-system-apple-orchard-design-for-the-future/): trees 3 ft (0.9 m) apart in rows 11 ft (3.4 m) apart, about 10 ft (3 m) tall on a three-wire trellis, about 3,300 trees per hectare [est]. A weed-free strip 3 to 4 ft (0.9 to 1.2 m) wide runs under each row, with grass in the alleys [src](https://www.omafra.gov.on.ca/neworchard/english/apples/18floor.html).
- **Olives.** A traditional grove holds usually under 100 trees per hectare (64 in the reference plot), mostly multi-trunked, mostly on steep slopes, unirrigated until recent decades [src](https://olivaterm.ujaen.es/en/search/traditional%20olive%20grove); Spain's family groves run 80 to 120 per hectare on small, fragmented plots [src](https://www.oliveoiltimes.com/production/traditional-growers-unite-to-defend-spains-historic-olive-groves/142777). That is a grid of 9 to 12 m [est]. Denser groves are planted 8 × 5 m (about 250 per hectare) or 7.5 × 4.5 m, rows 7 to 8 m apart for the harvesters [src](https://olivaterm.ujaen.es/en/word/233/tree-spacing). Hedgerow groves hold 1,500 to 2,500 per hectare in rows 4 m apart, 1 to 2.5 m in the row, topped at 2.5 m and 1.2 to 1.5 m wide [src](https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2017.01790/full).
- **From a height.** Jaén's more than 60 million trees stand in "endless rows of olive trees in perfect formation" over hill, plain and mountain, with farmhouses scattered among them [src](https://www.jaenparaisointerior.es/en/oleotour/paisajes). From a train they are "ubiquitous green blobs" on rocky, stony ground [src](https://worldstrides.com/en-us/teachers/how-it-works/blog/jaen-spain-land-olive-tree). So a grove is a dotted grid, each dot lit and shadowed, the ground showing between and the grid bending over the hill [est].

## 15. Stones, ponds, gates and tracks at the field edge

- **Clearance cairns** are "an irregular and unstructured collection of fieldstones" from arable or pasture, gathered into a low mound, mostly on waste ground: steep slopes, wood edges, field corners and round earth-fast boulders. They stand alone, in cairnfields, or in lines [src](https://en.wikipedia.org/wiki/Clearance_cairn). One listed cairnfield has at least 17 cairns up to 5 m across and 0.5 m tall, in two groups over about 150 × 350 m [src](https://historicengland.org.uk/listing/the-list/list-entry/1019755): about 3 per hectare [est]. Ploughing still brings stones up; Farming Simulator 22 makes them a field state, picked or rolled under [src](https://www.gamedeveloper.com/press-release/rocks-n-rolling-new-ground-working-features-in-farming-simulator-22).
- **Consumption dykes.** The Broad Dyke at Kingswells, Aberdeenshire, is 440 m long in four sections, 10 m wide and 2 m tall: two inward-leaning walls round a rubble core, dressed ends and a paved path on top, built to bound fields and use up their stones (later 18th to mid 19th century) [src](https://her.aberdeenshire.gov.uk/Monument/MAB20522).
- **Dew ponds.** Shallow circles 30 to 60 ft (9 to 18 m) across and 3 to 6 ft (0.9 to 1.8 m) deep, lined with puddled clay or chalk (concrete since the 19th century) and fed only by rain; about 300 on the South Downs; some fenced off, feeding a trough by pipe [src](https://fulking.net/dew-ponds/). They watered big upland sheep flocks [src](https://archaeologists.net/sites/default/files/2025-09/Dew-Ponds.pdf). One on a Dorset down is a 20 × 15 m embanked enclosure round an oval hollow [src](https://hbsmrweb-dorset.esdm.co.uk/Monument/MDO45304).
- **Gates.** A field gate is 14 ft (4.27 m) wide and 1.145 m tall, seven tubular rails set closer near the ground [src](https://firstfence.co.uk/14-0ft-wide-7-rail-galvanised-farm-gate-leaf). By use: 10 ft (3 m) for a tractor, 12 to 14 ft (3.7 to 4.3 m) for trailers and lane entrances off a road, 16 ft (4.9 m) or more, often a double gate, for combines and hay wagons [src](https://systemequine.com/fence-installation/paddock-gates/).
- **Gateways go to mud.** Cattle stand round gateways to watch whatever is happening, tractors cut the ground up, a driver who swings wide ruts the side too, a trough beside the gate makes it worse, and water lies on top [src](https://www.farmersjournal.ie/restoring-the-ground-around-muddy-gateways-167766).
- **Tracks in the crop.** Tramlines, the wheelings a drill leaves for the sprayer, run 24 m apart, each nearly 0.9 m wide in beet [src](https://www.fwi.co.uk/news/on-track-for-sugar-beet-benefits-with-tramlines).

## 16. Birds behind the plough, and a field half ploughed

**Who comes.**
- Gulls: a scattered few become thousands within minutes of ploughing starting. Some arrive first, watching from roofs, cliffs and trees, and the same flocks return to the same farms every year [src](https://www.cprenorfolk.org.uk/discover/seagulls-how-do-they-know-when-the-tractor-is-ploughing/).
- Mixed flocks: "a mixed flight of gulls and crows" behind a tractor in Fife in January [src](https://www.geograph.org.uk/photo/1114501); black-headed gulls and rooks behind a plough in Skåne in spring [src](https://p12.photo12.com/en/image/brk22g35_325). American gulls learned it as well [src](https://sora.unm.edu/sites/default/files/journals/wilson/v071n04/p0387-p0388.pdf).
- Sussex [src](https://www.sussexexpress.co.uk/news/opinion/columnists/richard-williamson-riding-happily-inches-from-the-turning-furrow-887242): black-headed and common gulls dive for worms within inches of the turning furrow; up to 18 buzzards have been counted on one field, and red kites fight the gulls right behind the plough. The earth turns over in "brown waves".
- Cattle egrets follow tractors for the insects and frogs they stir up [src](https://lauraerickson.com/bird/cattle-egret). With cattle they feed within 2 m of a cow: 79% at the head, 17% at the side, 3% behind; up to five egrets per cow in one study, 2.4 cows per egret in another. An egret with a cow to itself walks 28 steps a minute and makes 2 catches; alone, 44 steps and 0.6 [src](https://sora.unm.edu/sites/default/files/journals/wilson/v088n01/p0145-p0148.pdf).

**How they move** [src](https://sora.unm.edu/sites/default/files/journals/wilson/v052n01/p0034-p0034.pdf). About 200 herring gulls worked a Wisconsin field 40 rods (200 m) long and half as wide. No bird followed the tractor down the furrow. They spread along the whole field, each waiting on unploughed ground until the tractor came opposite, then flying across to the fresh furrow, so a wave of birds moved with the tractor and reversed when it turned. Each fed on its own small patch, and once it was cleared waited for the tractor to pass on the far side.

**A field ploughed in lands.**
- Lands as near 10 rods (50 m) wide as possible; a shallow marker furrow 20 ft (6 m) from each end for the headland; a back furrow (two furrows thrown together) down each land, ploughed round until the strips between meet in a dead furrow; the headlands last, outward or inward [src](https://www.cj3apage.com/index/Tech_Tips/operation_and_care_manual/Manual%20Plow.htm).
- Headlands are about twice the length of tractor and plough, with rounded corners; dead furrows running downhill are avoided [src](https://smallfarmersjournal.com/laying-out-fields-for-plowing/). With a reversible plough the field goes in parallel runs from one side to the other, turning on the headlands and leaving no furrows [src](https://www.slideshare.net/slideshow/ploughing-pattern/60338729).
- Good work is straight and uniform, with no unploughed land and no stubble or grass showing [src](https://www.farmersjournal.ie/what-makes-for-award-winning-ploughing-400021). Half ploughed, then: dark ribbed bands of turned earth with a crisp edge against the stubble, and an unploughed headland ring round the whole field [est].

## 17. Farmland that isn't a cartoon: painters and game artists

- **Ravilious.** A dry, "starved" brush, so flecks of white paper show through like chalk through weathered turf; muted greens, yellows and browns under wide overcast skies; a designer's eye for pattern in ploughed, harrowed and stubble fields crossing each other and chalk tracks worn by walkers [src](https://www.southdowns.gov.uk/artist-eric-ravilious-and-the-beauty-of-winter/). The brush is "used quite dry, and in places stippled"; fence lines mark out territory, and roads cut across the land as the chalk figures do [src](https://www.onsitereview.ca/22war-1/2009/12/3/eric-ravilious-the-scale-of-the-land.html).
- **John Nash, The Cornfield (1918).** A line of stooks runs across a dipping landscape, and long evening shadows slice across the land [src](https://www.newstatesman.com/long-reads/2020/04/greats-outdoors-john-nash-s-harvesting).
- **Grant Wood** shows the other road: hills as "sensuous, bulbous swellings", corn rows "striped like fabric", read as "pleasant idealized rural life" [src](https://www.paintersonpaintings.com/archive/laurie-hogin-on-grant-wood); in Fall Plowing the corn shocks stand in "orderly rows" [src](https://www.artchive.com/artwork/fall-plowing-grant-wood-1931/). Swollen hills, even stripes and toy rows are the cartoony register [est].
- **Hockney's Yorkshire.** Garrowby Hill (1998), "in which distant fields many miles away are spied from the summit of a steep hill"; roads and tracks give the land immediacy and restlessness [src](https://www.theartnewspaper.com/2020/10/09/what-colour-is-the-road-david-hockney-tells-us-to-take-a-closer-look). Field boundaries and winding roads cut each canvas into segments, roads are often pink or purple, and "to see colour, you have to look" [src](https://annamcnay.art/2012/03/review-of-david-hockney-ra-bigger/). He kept going back to the same places through the year [src](https://royalacademy.org.uk/article/david-hockney-ra-bigger-picture).
- **Kuindzhi** was faulted for a birch grove painted in two greens only, one in sun and one in shade, a "purely decorative effect" [src](https://www.cambridge.org/core/journals/slavic-review/article/painting-light-scientifically-arkhip-kuindzhis-intermedial-environment/ED518454581C6AE96E7225496B181756). Two tones per surface reads as decoration, not light [est].
- **Painters' rules.** Group the scene into 3 to 4 dominant values; mix hard, soft and lost edges, since all-hard looks unreal [src](https://drawpaintacademy.com/problem-solving-checklist-2/). Block in three or five masses of unequal size, build them from small shapes close in value, alter any similar-sized masses so each differs, avoid a 50-50 split of light and shadow, and exaggerate differences: "same same, bad bad" [src](https://www.outdoorpainter.com/?p=35311).
- **Game art.** Repetition seen from a height breaks under a slowly varying index that picks among several offset copies of one texture, for about two fetches and a cheap lookup [src](https://iquilezles.org/articles/texturerepetition). Farming Simulator 22 redid nearly all its ground textures to show soil states more accurately [src](https://www.gamedeveloper.com/press-release/rocks-n-rolling-new-ground-working-features-in-farming-simulator-22). Manor Lords is gridless, its house plots modelled on medieval burgage plots, built with photogrammetry [src](https://store.epicgames.com/news/manor-lords-solo-developer-s-highly-anticipated-medieval-strategy-game-hits-this-month).
- **Gerster's air photographs.** His 1979 ploughed field near Palouse shows contour ploughing raised to land art: the machines' paths make the pattern [src](https://www.onsitereview.ca/26-dirt/2011/5/25/georg-gerstner-land.html).
- What these share: edges that wander, marks of use (tracks, wheelings, machine paths), sizes that differ, a few value families, and light that changes across a surface rather than two flat tones [est].

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

### This round: the wide view from a little height

**Farmsteads** [est from §12]:
- Spacing: in dispersed worlds, a Poisson disc with a mean of 600 to 900 m (one farm per 40 to 80 ha) and a floor of 150 m, since closer makes a hamlet. Grid worlds put one per 805 m cell, at the cell's road edge. Western ladder rows string houses 80 to 150 m apart along a lane, holdings running back as strips.
- Footprint: 0.8 to 2 ha with its trees (90 to 140 m across); a working yard 30 to 60 m across of packed earth or gravel.
- Pieces: a house 8 to 12 × 10 to 14 m, nearest the road and upwind; a barn, the largest, 12 to 18 × 25 to 40 m (five bays); 2 to 5 sheds of 6 to 10 × 10 to 20 m; 2 to 6 grain bins 9 to 15 m across and 6 to 12 m tall, in a row 1 to 3 m apart; at most one tower silo, about 5 m across and 15 to 25 m tall, against the barn; a garden 15 × 20 m by the house; pens and yards downwind. Buildings 30 m apart where there is room.
- Plan, weighted as the Peak District: linear 40% (house and barn in one range 20 to 40 m long), courtyard 37% (loose, buildings on one to four sides, 25%; regular L or U, 12%), dispersed cluster 21%. Cold worlds take Norway's: square with open corners on the flat, cluster on the coast, row in valleys, and one yard tree.
- A lane 3 to 4 m wide runs straight to the nearest road, 30 to 400 m. In stock country, add field barns at about one per km², alone in the fields.

**Windbreaks** [est from §13]:
- Farmstead: an L on the two windward sides (north and west in the sources; on the ring, the two sides facing the scene's wind), 3 to 5 rows (up to 10 in cold worlds), rows 4 to 6 m apart, the inside row 15 to 30 m off the yard, each arm running 30 to 60 m past the last building.
- Rows from outside in: shrubs 2 to 4 m tall at 1.2 m, small trees about 6 m at 2.4 m, conifers 15 to 25 m at 2.4 to 3 m, tallest inside. At 60 to 80% density, draw it as one dark mass with a ragged crown line, never a row of balls.
- In winter a snow drift fills the gap on the lee side, and a shrub snow trap 15 m upwind wears its own drift.
- Field belts: single rows across the wind, 60 to 400 m apart (2 to 4 per 805 m on big fields), continuous but for 5 m gaps at field approaches, each in a 5 m strip. Caragana 5 to 6 m tall, dense at 0.4 m; ash 15 m at 1.75 m; poplar 25 m at 2.75 m in big-country bands. Shadows show their height at low sun.

**Orchards** [est from §14]:
- Traditional: a grid of 9 m for apples, 3 m for plums and nuts, 20 m for cherries and perry pears, each tree jittered 0.5 to 1 m and the grid turned 0 to 10° off the field. Leave 10 to 20% of places empty and make 5 to 10% young trees at half size, with one or two stag-headed veterans. Crowns 4 to 8 m across on 1.8 m trunks, grass beneath, sheep at 14 per ha or a hay cut.
- Modern: rows 3.4 m apart, trees 0.9 m apart and 3 m tall, read as continuous hedges 1 m wide; a 1 m bare strip under each row in soil colour; mown grass alleys; trellis posts every 10 m.
- Olives: traditional groves on a 10 to 12 m grid, 3 to 4 trunks per tree, crowns 5 to 7 m in grey-green, on slopes and terraces, with stony tan or red soil between and the grid following the hill. Intensive groves 7.5 × 4.5 to 8 × 5 m. Hedgerow groves in rows 4 m apart, 2.5 m tall and 1.3 m wide.

**At the field edge** [est from §15]:
- Stones: in stony worlds, one pile 2 to 4 m across and 0.5 m tall in one field corner in three, or round a boulder. On moorland, cairnfields of 10 to 20 cairns at about 3 per hectare, up to 5 m across. A consumption dyke (10 m wide, 2 m tall, 100 to 440 m long, a path on top) at most once per scene.
- Dew ponds: one per hilltop pasture, a circle 9 to 18 m across that mirrors the sky as the paddies do, a pale rim of trodden clay 1 to 2 m wide, sheep on the rim.
- Gates: one per field, 4.3 m wide (its rails visible only near), on the side facing the farm or lane; a fan of mud 6 to 10 m into the field, and a trough beside it in pasture.
- Tracks: tramline pairs every 24 m along the drilling direction (wheel tracks 0.5 m wide, 1.8 m apart), and a worn track from gate to lane, pale as Ravilious's chalk tracks.

**The plough and its birds** [est from §16]:
- A field being ploughed: lands 40 to 60 m wide, a 6 to 12 m headland ring left till last, a low ridge (back furrow) down each land and a dark groove (dead furrow) between lands. The turned earth is darker and rougher, with a crisp line against the stubble. A reversible plough leaves plain parallel bands with no ridges.
- Birds: 30 to 200 gulls (more near water, in autumn and winter) spread along the furrow line level with the tractor. Each waits on unploughed ground and flies across when the tractor comes opposite, so a wave travels with it and turns back at the headland. 5 to 20% are in the air at any moment, 2 to 6 m up. A few rooks walk 5 to 30 m behind, and now and then one to three kites or buzzards circle 20 to 50 m above.
- The same wave follows the Harvester robot (the Robots table above) as it cuts a field.
- Warm worlds: one egret per one to three cows, within 2 m of a cow's head; a flock of 10 to 40 egrets walking the cut strip behind a mower or harvester.
- Cattle drift to the gate and stand watching when a robot or a person passes, as they do at real gateways [src](https://www.farmersjournal.ie/restoring-the-ground-around-muddy-gateways-167766).

**A less cartoony hand** [est from §17]:
- Values: group the whole patchwork into 3 to 4 value families: plough and bare earth darkest, crops and grass mid, stubble and ripe grain light, water and sky lightest. Inside a family, neighbouring fields step by small amounts of hue and value, never jump.
- Sizes: no two neighbouring fields within 15% of each other's area, and sizes in one block spanning at least 3 to 1. Never split a hill 50-50 into light and shadow.
- Edges: hard on near, lit hedge sides; soft or lost with distance and inside a value family. Old-country field edges wander 0.5 to 2 m from straight.
- No field in two flat tones: each gets a slow variation (Quilez's index over 4 to 8 offset copies of its crop texture), its rows, its tramlines, and a margin 2 to 4 m wide in a different colour along the hedge.
- Ravilious's fleck: in grass and stubble, 5 to 15% of the area takes small pale dry-brush flecks instead of smooth fill.
- Lanes and tracks cut the view into segments, as Hockney's do. At low sun (6° to 15°), a line of stooks, bales or trees throws shadows 4 to 10 times its height across the slope, as in Nash.

**Interactions nobody asked for** [est from §13, §15, §16]:
- A small stone-picker robot trails the plough by one land, carrying turned-up stones to the field corner, where the clearance pile grows by one stone a pass.
- Where a windbreak has a dead tree, a tongue of drifted snow runs through the gap toward the yard, since a gap in a belt increases erosion behind it [src](https://www1.agriculture.alberta.ca/$department/deptdocs.nsf/all/agdex2073).
- Egrets lift and resettle each time their cow walks on, keeping within 2 m of its head.
- At dusk the dew pond holds the last of the sky after the pasture round it has gone dark.

## What this app can do that others don't [est]

- The fields lie on a ring floor that rises into the sky. The far side's patchwork hangs overhead as a band of coloured stripes, and at night its towns are a river of warm dots across the arch, something no flat-world game can show.
- One seed turns the seasons: the same fields go green, then gold, then stubble, then plough, and the scene can be dated by its crops.
- Terraces are lit from the light dial, so risers catch the low sun and paddies mirror the sky.
- Robots act on the world (a lamp lit, a field cut), with no game rules to serve.
