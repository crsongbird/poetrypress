# Prior art: an Arena on a ringworld (seed-made provinces, a walkable ring, gates to other worlds)

Ruby, 2026-10-24: "I keep thinking of remaking Elder Scrolls Arena basically and setting it on a ringworld (also with transporters to other places like mars and other lands) and if we keep that in mind for this project and these generators we'll have a really good idea of what to do together."

**How to read the tags.**
- [src](URL) is a page or source file that was opened and read for this doc.
- [src: file, name] is this repository's code as it stood on 2026-10-24, cited by the function or table rather than by line, because the Ringworld files were being edited while this was written.
- [est] is an estimate, a figure worked out from a source's numbers, or a design proposal.

OpenTESArena (commit 5b38e81, 2026-10-22) and Daggerfall Unity (commit 4e78e14, 2026-10-21) were cloned and their code read directly. This doc builds on two earlier ones and doesn't repeat them: docs/prior-art/realtime-game.md ("the game doc": engines, phone budgets, the analytic arch, chunked terrain, world facts and quests as data, ink) and docs/prior-art/ringworld-motion-and-variety.md ("the motion doc": clocks, lights, palettes, central places, the wild places).

## Summary

Arena (1994) was a small team's procedural world:
- nine provinces, each with a fixed count of places [src](https://app.uesp.net/wiki/Arena:Places);
- cities assembled from hand-made blocks on a seeded plan [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/World/ArenaCityUtils.cpp);
- a 64×64-block wilderness round each town, seeded by the first four letters of the town's name [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/WorldMap/ArenaLocationUtils.cpp);
- random dungeons stitched from 32-voxel chunks [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/World/MapGeneration.cpp);
- a main quest bolted on late, through hand-made dungeons [src](https://content1.uesp.net/wiki/General:The_Making_of_The_Elder_Scrolls_Arena).

Every seed is a position or a name, so nothing is stored [est]. Later games kept that rule ("same seed, same world, any chunk on demand") and added streaming and levels of detail [src](https://en.wikipedia.org/wiki/Development_of_No_Man%27s_Sky) [src](https://minecraft.fandom.com/wiki/Chunk).

The Ringworld surface already has much of Arena's machinery: worlds, vernacular regions, towns, ways, farms, walkers with timetables and doors, weather, the shadow squares' night and signboards [src: stepsRing.js, `rgWorldOf`, `rgVernacular`, `rgStore`, `RG_MOVES`]. It lacks a position along the ring, named regions with rulers, interiors, dungeons, roles, quests, a map and a ground camera [est]. §5 orders the work so each step also gives the paintings something new [est].

## 1. What Arena generated, and how

### 1.1 The world's shape

- **Provinces.** There are nine. The Imperial Province holds only the Imperial City. Each of the other eight has 8 city-states, 8 towns, 16 villages, 2 main-quest dungeons and 14 random-quest dungeons, for 387 places in all [src](https://app.uesp.net/wiki/Arena:Places).
- **Size.** Bethesda never gave one. A making-of article estimates about six million km², which made fast travel a necessity [src](https://content1.uesp.net/wiki/General:The_Making_of_The_Elder_Scrolls_Arena). Wikipedia calls the world "infinite" and says fast travel is required between towns [src](https://en.wikipedia.org/wiki/The_Elder_Scrolls:_Arena).
- **The lesson** [est]: a fixed recipe per province gives the world a known size and rhythm, and the seed only furnishes it.

### 1.2 Cities from blocks

- **The plan.** A city is a square of blocks: 6×6 for a city-state, 5×5 for a town, 4×4 for a village [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/WorldMap/LocationDefinition.cpp).
- **Filling it.** The city's template reserves some blocks [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/World/ArenaCityUtils.cpp). The template's skeleton holds the walls, gates and palace [est]. Then one equipment store, Mages Guild, noble house, temple, tavern and spacer go into random empty slots, and every slot left gets a weighted draw [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/World/ArenaCityUtils.cpp).
- **The draw's weights.** On a 16-bit roll the thresholds are houses ≤ 0x7333, tavern ≤ 0xA666, equipment ≤ 0xCCCC, temple ≤ 0xE666, noble house above [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/Assets/MIFUtils.cpp). That is about 45%, 20%, 15%, 10% and 10% [est].
- **Blocks.** Each is one of 10 to 20 hand-made variations of its type, turned to one of four rotations, and laid 20 voxels apart [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/Assets/MIFUtils.cpp) [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/World/ArenaCityUtils.cpp).
- **Authored, then generated.** Town buildings are designer-made, and their order and names are generated [src](https://en.wikipedia.org/wiki/The_Elder_Scrolls:_Arena).
- **The random generator** is one multiply: the value times 7143469, top 16 bits returned [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/Math/Random.cpp).
- **The seed.** A city's seed is its map position, (x << 16) + y [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/WorldMap/ArenaLocationUtils.cpp).

### 1.3 The wilderness

- **Size.** Round each settlement lies a 64×64 grid of blocks, each 64×64 cells, with the settlement in the middle four. There are 66 hand-made blocks. Walking from a city-state's gate to the edge takes about 20 minutes [src](https://app.uesp.net/wiki/Arena:Places).
- **The seed** is the settlement name's first four letters, read as a 32-bit number [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/WorldMap/ArenaLocationUtils.cpp). So Rockgrove, Rockpark, Rockguard, Rockpoint and Rockspring share one wilderness [src](https://app.uesp.net/wiki/Arena:Places).
- **Choosing blocks.** Each chunk picks a list, then a block from it [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/World/ArenaWildUtils.cpp):
  - normal: a roll under 0x6666, about 40% [est];
  - village: the next 0x4000, about 25% [est];
  - dungeon: the next 0x2666, about 15% [est];
  - tavern: the next 0x1999, about 10% [est];
  - temple: the rest, about 10% [est].
- **Not infinite.** Past the edge the four central blocks repeat, and odd "glitch lands" can follow [src](https://app.uesp.net/wiki/Arena:Places).
- **Its own seeds.** Wilderness taverns and temples are named per chunk, seeded by the chunk's coordinates [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/World/MapGeneration.cpp). A wilderness dungeon's seed is the province's seed plus the block's index [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/WorldMap/ArenaLocationUtils.cpp).

### 1.4 Dungeons

- **Prefabs and procedural.** Random dungeons are the only procedural interiors. Crypts, shops, houses, guilds, noble houses, palaces, taverns, temples and towers are prefabs [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/World/ArenaInteriorUtils.cpp).
- **Building a level.** A level is a grid of 32×32-voxel chunks. The dungeon draws one of four tilesets, then each chunk from that tileset's eight in RANDOM1.MIF, carrying over the chunk's locks and text triggers [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/World/MapGeneration.cpp).
- **Depth and seed.** A quest dungeon has one or two levels, an artifact dungeon four [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/World/ArenaInteriorUtils.cpp). Its seed is its map position, bit-rotated and inverted [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/WorldMap/ArenaLocationUtils.cpp).
- **Entrances.** Big wilderness dungeons show as a hill with a door, or a crypt between four towers [src](https://app.uesp.net/wiki/Arena:Places).
- **The main quest's dungeons.** Its 17 dungeons were designed by hand, beside several hundred random ones [src](https://en.wikipedia.org/wiki/The_Elder_Scrolls:_Arena). The first, Fang Lair, is a brick tower over a two-level Dwarven mine, with a riddle door, mine-cart tracks and magma streams [src](https://content1.uesp.net/wiki/Arena:Fang_Lair_(place)).

### 1.5 Time, light and weather

- **The clock's rate.** One real second is 13 game seconds, so a day takes 6,646 real seconds (about 1 h 51 min) [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/Time/ArenaClockUtils.h) [est for the minutes]. Daggerfall Unity runs at 12 [src](https://github.com/Interkarma/daggerfall-unity/blob/master/Assets/Scripts/Internal/WorldTime.cs).
- **The day's clock** [src](https://github.com/afritz1/OpenTESArena/blob/main/data/Clocks.txt):
  - light rises 6:00 to 6:15 and dims 17:45 to 18:00;
  - lampposts burn 17:45 to 6:15;
  - thunderstorms come only between 18:01 and 6:00.
- **Day and night.** Arena had one of the first realistic day/night cycles: shops close at sunset and monsters roam until morning [src](https://en.wikipedia.org/wiki/The_Elder_Scrolls:_Arena).
- **The city after dark.** When no townsfolk are near, enemies can appear each minute, and entering most buildings is trespassing [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/Entities/ArenaEntityUtils.cpp) [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/World/ArenaInteriorUtils.cpp).
- **Weather.** There are seven kinds: sunny, overcast, rain, thunderstorm, fog, thick fog and snow. Each is weighted by place, season and hour, and snow or rain can double the travel time [src](https://content2.uesp.net/wiki/Arena:Weather). Desert snow becomes rain [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/Weather/ArenaWeatherUtils.cpp).
- **A file per climate and weather.** Each has its own INF file, named by climate (temperate, desert, mountain), place (C for city, W for wild) and weather [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/World/ArenaWildUtils.cpp).

### 1.6 People and quests

- **Townsfolk have no schedules.** Fifteen walk a city and seven the wilds. They spawn 2,048 to 3,072 units (16 to 24 voxels) from the player and walk the four compass directions [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/Entities/ArenaCitizenUtils.h) [est for the voxels].
- **Names** come from NAMECHNK.DAT. Per people and sex, a rule joins syllable lists, fixed strings ("sen") and parts that only sometimes appear [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/Assets/TextAssetLibrary.cpp).
- **Shop names** [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/World/MapGeneration.cpp):
  - a tavern is one of 23 prefixes and one of 23 suffixes (marine suffixes on coasts), with no pair repeated in a city;
  - an equipment store fills in the city's type and a generated first name, seeded by the store's own position.
- **Inns** have a bartender (drink, rooms, rumors), rude patrons, five room sizes and eight layouts [src](https://content1.uesp.net/wiki/Arena:Inns).
- **The quest generator** [src](https://content1.m.uesp.net/wiki/Arena:Random_Quests):
  - Inns: ask passers-by about work, then see the bartender for a delivery, retrieval or escort. There are at most four a day, due by midnight two days later, worth 50 × level XP.
  - Palaces: rulers give harder ones (rescue, capture a criminal, slay a creature), taken only between 6 AM and 6 PM, worth 500 × level XP.
  - The target's dungeon "bears a name similar to" the target.

### 1.7 Travel

- **Fast travel by the map.** Every arrival opens with a message giving the place's type, name and province, the date and the days spent [src](https://app.uesp.net/wiki/Arena:Places).
- **Pricing a journey** [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/WorldMap/ArenaLocationUtils.cpp):
  - travel days are summed along a Bresenham line over the world map;
  - each pixel costs 2000 ÷ speed, the speed being the terrain's for the month times a weather factor;
  - the days are the total over 100, clamped to 1–2000, with ±5 days of noise past 20.
- **The lesson** [est]: travel time is a cheap function of the map, the month and the weather, so a journey can be priced without simulating it.

### 1.8 The Staff of Chaos as a structure

- **Origins.** The game began as a touring gladiator league, after the film Flesh and Blood. Side quests grew more engaging than the fights, and the story came late: "we could bolt on a story, but the questing would be fairly linear" (Lakshman) [src](https://content1.uesp.net/wiki/General:The_Making_of_The_Elder_Scrolls_Arena). Ted Peterson said Arena "was much different from the way it was initially envisioned" [src](https://content2.uesp.net/wiki/General:Ted_Peterson_Interview).
- **The frame.** Jagar Tharn usurps the throne and splits the Staff of Chaos. Each time the player rests, Ria Silmane gives the next piece's general location [src](https://en.wikipedia.org/wiki/The_Elder_Scrolls:_Arena). The quest runs in ten stages, from the Imperial Dungeons through eight piece dungeons to the Imperial Palace [src](https://en.UESP.net/wiki/Arena:Main_Quest).
- **One stage's rhythm** (Fang Lair) [src](https://app.uesp.net/wiki/Arena:Fang_Lair):
  - a dream names the place;
  - people in the street point to a province and a city;
  - the ruler asks for an item from a first dungeon (Stonekeep);
  - in return the ruler marks the second dungeon, where the piece lies.

  That fits the two main-quest dungeons each province holds [src](https://app.uesp.net/wiki/Arena:Places), though the pattern holding everywhere is a guess [est].
- **The people behind it.** Vijay Lakshman directed and co-designed with Ted Peterson, and Julian LeFay was lead programmer [src](https://en.wikipedia.org/wiki/The_Elder_Scrolls:_Arena). LeFay led Daggerfall and died on 22 July 2025 [src](https://en.wikipedia.org/wiki/Julian_LeFay).
- **Their next world.** The three co-founded the studio making The Wayward Realms: a "life-sized procedurally generated open world" of over a hundred islands, with no traditional main quest [src](https://en.wikipedia.org/wiki/The_Wayward_Realms).
- **The postmortem.** Peterson and LeFay gave Arena's GDC 2024 postmortem; only its description was read [src](https://schedule.gdconf.com/session/classic-game-postmortem-the-elder-scrolls-chapter-i-arena/902611).

### 1.9 Daggerfall, at greater scale

- **Places.** The Iliac Bay holds 15,251 locations: 4,229 dungeons, 4,400 homes, 1,532 temples and shrines, and 5,090 cities, towns, villages and taverns, across 44 regions and 9 climates. They are "pre-generated, and are consequently always the same". The land between comes from a heightmap with 800 m pixels [src](https://content1.m.uesp.net/wiki/Daggerfall:Places).
- **The heightmap.** WOODS.WLD is a 1000×500 elevation map (0–127, with 2 and under water) carrying a 5×5 noise grid per pixel [src](https://en.uesp.net/wiki/Tes2Mod:WOODS.WLD_format). Area estimates run from 160,000 to about 340,000 km² [src](https://content1.m.uesp.net/wiki/Daggerfall:Dimensions_of_the_Iliac_Bay).
- **Blocks.** BLOCKS.BSA holds 920 exterior blocks (RMB) and 187 dungeon blocks (RDB). A town is a grid of RMBs, and each RDB has two passages on each of its four sides [src](https://en.uesp.net/wiki/Tes2Mod:BLOCKS.BSA).
- **Quests as scripts.** A quest declares its people, places, items and clocks, for example "Place _dirtypit_ remote tavern" and "Clock _invitepc_ 7.00:00 14.00:00" [src](https://www.dfworkshop.net/category/daggerfall-unity/page/11/). The compiled form is a list of state records; one of them reads "if State TRUE set one State at Random" [src](https://app.uesp.net/wiki/Daggerfall:Quest_pseudo-codes).
- **Daggerfall Unity's terrain.** One map pixel is "one full-sized city". Bilinear sampling turns the 1000×500 map into a 128000×64000 grid that matches the RMB blocks [src](https://www.moddb.com/mods/daggerfall-unity/news/streaming-world-part-1). Today's sampler adds three layers, then clamps at the ocean [src](https://github.com/Interkarma/daggerfall-unity/blob/master/Assets/Scripts/Terrain/DefaultTerrainSampler.cs):
  - a bicubic base height ×8;
  - a larger map's noise ×4;
  - low-frequency times high-frequency noise ×10.
- **Streaming.** Terrain tiles stream out to three tiles round the player, at most 256 in memory, and a floating origin keeps the player near the centre [src](https://github.com/Interkarma/daggerfall-unity/blob/master/Assets/Scripts/Terrain/StreamingWorld.cs).
- **Names** come from banks per people (Breton, Redguard, Nord and others, plus three monster banks) [src](https://github.com/Interkarma/daggerfall-unity/blob/master/Assets/Scripts/Game/Utility/NameHelper.cs).
- **What it cost.** Peterson said Daggerfall was harder "by a lot. A lot more ambitious project", with crunch "round the clock, for a year", under a mission statement that "this would be a game where you do anything and be anyone" [src](https://content2.uesp.net/wiki/General:Ted_Peterson_Interview).

### 1.10 What the history teaches

- **Hand-made parts on a seeded plan** (blocks, chunks, name syllables) gave a small team a large world that still looked authored [est]. That is already how paintKit works: kinds, archetypes, features keyed to streams of their own [src: AGENTS.md §4].
- **Every seed was a position or a name,** so nothing had to be saved. Arena's one flaw shows the limit: four letters made twins [src](https://app.uesp.net/wiki/Arena:Places).
- **Small data.** The recipe per province, the weighted block draw and the quest generator each fit in a few lines of data [est].
- **A warning.** Daggerfall's scale came with feature creep and a year of crunch [src](https://content2.uesp.net/wiki/General:Ted_Peterson_Interview). Arena's size with Daggerfall's unevenness is the cautionary tale [est].

## 2. Seed-made worlds you can walk, since

- **No Man's Sky.**
  - A 64-bit seed for over 18 quintillion planets. Generation is deterministic and nothing is stored: each planet is recomputed on demand, each star's values seeding its system and each planet's position seeding its features [src](https://en.wikipedia.org/wiki/Development_of_No_Man%27s_Sky).
  - The terrain generator is about 1,400 lines; planets are cubes projected onto spheres; about 90% are uninhabitable [src](https://en.wikipedia.org/wiki/Development_of_No_Man%27s_Sky).
  - The world streams from orbit to ground through voxel generation, then polygonization and texturing, then population and simulation [src](https://www.gdcvault.com/play/1024265/Continuous-World-Generation-in-No).
  - In the art director's words, "you essentially take random elements and funnel them into a box of 'maths'" [src](https://www.killscreen.com/no-mans-sky-and-technology-created-18-quintillion-planets/).
- **Elite Dangerous (Stellar Forge).**
  - A 1:1 Milky Way of about 400 billion systems. About 150,000 come from real catalogues; the rest are generated "according to scientific models" [src](https://en.wikipedia.org/wiki/Elite_Dangerous).
  - Each planet is simulated from its birth (accretion, orbits, chemistry) "in a fraction of a second" [src](https://www.pcgamer.com/uk/the-mind-bending-science-behind-the-planets-of-elite-dangerous/).
  - Features run "from high orbit down to human scale", and artists can place their own topography for settlements [src](https://www.pcgamer.com/uk/the-mind-bending-science-behind-the-planets-of-elite-dangerous/).
- **Elite (1984).** Each system has three 16-bit seeds. Its name is three or four two-letter tokens, with the seeds twisted between tokens (LA·VE gives Lave). All 2,048 names are unique [src](https://elite.bbcelite.com/deep_dives/generating_system_names.html).
- **Minecraft.**
  - "the same seed generates the same terrain every time." Text seeds hash to 32 bits. Deleted chunks regenerate unchanged while the seed and generator stay. Some features read only part of the seed [src](https://minecraft.gamepedia.com/World_Generation).
  - Chunks are 16×16 and 384 blocks tall, generated as the player moves. Render distance and simulation distance are separate squares [src](https://minecraft.fandom.com/wiki/Chunk).
  - A chunk is made in stages: structure starts, biomes, noise, surface, carvers, features, light, spawn, heightmaps [src](https://jd.spongepowered.org/spongeapi/8.0.0/org/spongepowered/api/world/chunk/ChunkStates.html).
- **Dwarf Fortress.** Elevation, rainfall, drainage, temperature and salinity make the biomes, and rivers run from eroded mountains. History then runs for the chosen number of years, and Legends mode lists its figures, sites and wars. Biome and river names come from the peoples' languages, shown in English [src](https://en.wikipedia.org/wiki/Dwarf_Fortress).
- **Caves of Qud.**
  - Five sultans' lives, each about twelve events drawn from a pool of nineteen. The generator "first decides that a particular historical event will occur, then it rationalizes a cause" [src](https://pcgworkshop.com/archive/grinblat2017subverting.pdf).
  - The results are written as gospels on shrines, paintings and engravings, generated as the player explores [src](https://pcgworkshop.com/archive/grinblat2017subverting.pdf).
  - A few main-quest places are pre-built and the rest generated; each period adds 2–3 regions [src](https://wiki.cavesofqud.com/wiki/World_generation).
- **Starfield.** "Our system builds a planet as the player approaches it, and we stitch together a block of terrain", and another system adds "interesting locations". The risk is the "10,000 Bowls of Oatmeal Problem" [src](https://news.northeastern.edu/2023/08/31/starfield-bethesda-video-game-creation).
- **Valheim** (from an unofficial guide built on community reverse engineering). A ten-character seed makes a flat disc 10 km in radius. Biomes are placed by distance from the centre, meadows in the middle and harder lands outward, and at the rim a waterfall drops into the void [src](https://cybrancee.com/blog/how-does-valheim-world-generation-work/).

**What carries over:**
- **Determinism by address.** Each thing's seed is a hash of the world seed and its address (region, cell, slot), as with Arena's positions and No Man's Sky's hierarchy [est]. The Ringworld already sows each cell from its own stream [src: stepsRing.js, `rgStore`]. What it lacks is an address along the ring (§5) [est].
- **Generation in stages,** as Minecraft does it: land, then regions, towns, ways, buildings, people, then light [est]. Each stage reads only the stages before it, so any chunk can be made on its own [est].
- **Detail by distance.** The store's nested cells are already a level of detail: "a thing, once sown, is the same thing from wherever it is seen" [src: stepsRing.js, the comment above `RG_KEPT_STORES`]. A walkable version adds Daggerfall Unity's ring of tiles and its floating origin [est].
- **Authored islands in a generated sea,** as Elite, Starfield and Qud have them: hand-made places for Ruby's story, set into seeded country [est].

## 3. Ringworlds as places to walk

### 3.1 Niven's Ringworld

- **Size.** About 1 AU in radius and 997,000 miles wide, three million Earths of floor at 0.992 g [src](https://larryniven.fandom.com/wiki/Ringworld?oldid=4725).
- **Time.** A day is 30 hours and a turn 7.5 days; a falan is 75 days [src](https://larryniven.fandom.com/wiki/Ringworld?oldid=4725).
- **Walls.** They are 1,000 miles tall and "retain the atmosphere" [src](https://larryniven.fandom.com/wiki/Ringworld?oldid=4725).
- **Floor and mountains.** The floor is scrith "only about 30m (100 ft) deep" [src](https://larryniven.fandom.com/wiki/Ringworld?oldid=4725). Mountains are raised floor, so they don't erode. Silt is carried to "giant silt mountains at the base of the atmosphere-retaining rim walls" [src](https://www.h2g2.com/approved_entry/A87815604).
- **The 1993 adventure game.** Ringworld: Revenge of the Patriarch gives spill mountains 30–40 miles high, about 30% of them active, with hominids living on their ice. It puts the rim transport and spaceports on the walls, three spaceports on each [src](https://www.mocagh.org/miscgame/ringworld2-hintbook.pdf).
- **Night.** Shadow squares joined by wire make the night [src](https://en.wikipedia.org/wiki/Ringworld). It falls suddenly, with no sunset. The rest of the ring stands overhead as "a giant arch", lit and dark by its own days [src](https://www.h2g2.com/approved_entry/A87815604).
- **Getting about.** Spaceports must lie outside the ring, served by "a magnetic linear accelerator consisting of a sequence of mag-lev hoops", and whole cities float on magnetic levitation [src](https://www.h2g2.com/approved_entry/A87815604). The first expedition crosses the ring on flycycles [src](https://en.wikipedia.org/wiki/Ringworld).
- **Maps of worlds.** The Great Ocean holds "one-to-one maps of all of the inhabited worlds of known space". The Other Ocean holds many maps of the Pak homeworld. The ring is home to many hominid species [src](https://larryniven.fandom.com/wiki/Ringworld?oldid=4725).
- **The Map of Mars** stands 20 miles above the floor for its thin air, with the control rooms and the meteor defense in the hollow beneath [src](https://en.wikipedia.org/wiki/The_Ringworld_Engineers).
- **The Fist-of-God** is a mountain a meteor pushed up from below. Its top, above the air, "is therefore just a hole" [src](https://en.wikipedia.org/wiki/Ringworld).
- **Stepping disks** are the Puppeteers' open teleport disks. Step on one and you arrive at a receiver "at or near light speed"; filters can stop some substances. Baedeker and Tunesmith used them widely on the Ringworld [src](https://larryniven.fandom.com/wiki/Stepping_disk).

### 3.2 Halo's rings

- **Installation 04** [src](https://www.halopedia.org/Installation_04):
  - 10,000 km across and 318 km wide, at 0.992 g;
  - dark about three-quarters of the time, with no sunrise as a planet has one;
  - land from glaciers to jungles and swamps, and rain that stopped "as if at the flip of a switch";
  - a Control Room, a Library and a map room (the Silent Cartographer).
- **The teleport grid** runs on "pre-computed routes between fixed endpoints", giving up flexibility for "safety, speed, and security". Characters such as a Monitor or Cortana work it, not the player [src](https://halopedia.org/Teleportation_grid).

### 3.3 Banks' Orbitals

- **Size and day.** About 3 million km across and 1,000–6,000 km wide (some 10 million km round). One turn takes about a day, giving both gravity and night [src](https://www.techno-science.net/fr/definitions/orbitale-la-culture-de-iain-banks).
- **Walls and rivers.** Walls tens to hundreds of km high hold the air, and a great river can loop the whole ring under bridges several km high [src](https://www.techno-science.net/fr/definitions/orbitale-la-culture-de-iain-banks).
- **Masaq'** is a loop of several dozen Plates, separated by "vast trans-atmospheric mountain ranges". Over the unfinished Plates its Great River runs in transparent tunnels [src](https://theculture.fandom.com/wiki/Masaq%27_Orbital).
- **The far side** shows as "A thin, dimly glowing line directly above" [src](https://www.centauri-dreams.org/?p=27991).
- **Orbit.** An Orbital orbits its star as a planet does, tilted to give days and seasons; Niven's ring encircles its star [src](https://mcdemarco.net/blog/2018/02/02/banks-orbital).

### 3.4 The painter's ring, measured

- **The band.** The store counts a metre as W × 0.00025 ring units, so at any Band Width the floor is 4,000 of the land's metres from wall to wall [src: stepsRing.js, `rgStore`'s metre; est for the reading].
- **The ring's size.** W is 0.012 + 0.22 b² of the ring's radius [src: stepsGenerative.js, `ringParams`]. That gives [est]:
  - at the default Band Width of 45, a radius of about 70.7 km (444 km round);
  - at 0, 333 km (2,094 km round);
  - at 100, 17 km (108 km round).
- **Walls and eye.** At the default Rim Walls of 25 the walls stand W × 0.215 high, about 860 m. At Altitude 0 the eye is about 2.5 m up, and at the default 15 about 7 m [est, from `ringParams`].
- **On foot.** At a walker's 1.4 m/s, crossing the band takes about 48 minutes and circling the default ring about 88 hours [est]. Arena's wilderness is about 20 minutes from gate to edge [src](https://app.uesp.net/wiki/Arena:Places).
- **Night** is the shadow squares, which cover 0.36 of each turn [src: stepsGenerative.js, `RING_COV`]. The ring turns under the stars once in 225 hours, after Niven [src: stepsRing.js, `RG_SPIN`].
- **Spill mountains, already.** The terrain raises "mountains piled at the walls' feet": spill mountains in all but name [src: stepsRing.js, the comment above `rgTerrain`].

### 3.5 Getting about on a ring

- **Directions.** Spinward and antispinward along the band, rimward toward a wall, replace north and south [est]. The boards already speak this way: "ANTISPINWARD IN 20 MINUTES. PROBABLY." [src: paintKit.js, `PK_BOARDS` transit].
- **On foot and by road** within a region [est].
- **By rail** along the band [est]. A "Spokeline" train is already a board [src: paintKit.js, `PK_BOARDS` transit].
- **By the wall-top maglev** for long distances, as Niven's hoops and the game's rim transport suggest [src](https://www.h2g2.com/approved_entry/A87815604) [src](https://www.mocagh.org/miscgame/ringworld2-hintbook.pdf).
- **By flycycle** across the band, as in the novel [src](https://en.wikipedia.org/wiki/Ringworld).
- **By transporter disk** between stations with fixed endpoints, as on Halo, so each station is a place and not a menu [src](https://halopedia.org/Teleportation_grid) [src](https://larryniven.fandom.com/wiki/Stepping_disk) [est].
- **Travel time** as Arena prices it: sum a cost along the route by terrain, hour and weather, with no simulation [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/WorldMap/ArenaLocationUtils.cpp). On a ring the route can run either way round, so the shorter is chosen [est].

## 4. Gates to other worlds

### 4.1 How games and fiction use them

- **Stargate.** Seven symbols: six for the destination and a seventh, the point of origin. An eighth reaches other galaxies, and addresses drift with the stars [src](https://stargate.fandom.com/wiki/Stargate_address). An address is a coordinate, so a world can be named by its dial [est].
- **Morrowind's Guild Guides** teleport between five Mages Guild halls, instantly and cheaply, but you arrive without the rest a slow journey gives [src](https://content1.uesp.net/wiki/Morrowind:Guild_Guide).
- **Morrowind's Propylon Chambers** link ten Dunmer strongholds. Each destination needs its index, found somewhere on the island, and a Master Index rewards collecting all ten [src](https://content2.uesp.net/wiki/Morrowind:Propylon_Index). The network is a collection quest [est].
- **Oblivion** [src](https://www.uesp.net/wiki/Oblivion:Oblivion_Gate):
  - 100 gate sites, 20 fixed and 80 random;
  - a random gate leads to one of seven Oblivion worlds;
  - a gate closes when you take the Sigil Stone from the top of its world's main tower;
  - the chance of a gate opening rises and falls with the main quest, and is nil once it ends.
- **Myst.** A book's panel shows its destination, and touching it takes you there. Ages already exist and a book is written to match one. Only one descriptive book exists per Age, and a link can't take you elsewhere in the same world [src](https://dni.fandom.com/wiki/Link).
- **Daggerfall.** Recall's first cast sets an anchor and the second returns you to it [src](https://pt.m.uesp.net/wiki/Daggerfall:Mysticism_Spells). The Mages Guild's teleporter, for Master Wizards and above, sends you free to "any point marked on your map", one way unless you've anchored at the Guild [src](https://En.UESP.net/wiki/Daggerfall:Teleporter_Service).
- **Minecraft.** A lit obsidian frame takes you to the Nether and builds a return portal where you arrive. Distances there are 8:1, and every portal leads into the one Nether [src](https://minecraft-archive.fandom.com/wiki/Nether_Portal).
- **CandyCraft,** a Minecraft mod. Its CandyLands are the overworld's noise terrain made of candy: pudding for grass, flour for dirt, marshmallow logs [src](https://candycraft.fandom.com/wiki/CandyLands). That is another world from the same generator under new materials [est].

### 4.2 A gate scene as a seed-made place of its own [est]

- **A station is a building kind.** It could be a ring of standing stones (the henges already exist [src: stepsRing.js, `rgHenge`]), a stepping-disk plaza, or a gate arch on the builders' worlds. It would go in `RG_PLACE` with its own rule: one per region, near the capital or on a spill mountain's shoulder.
- **Its destination's seed is its address,** hash(ring seed, station id), so a station always leads to the same world, as Myst gives one book per Age [est].
- **Or a station takes a phrase.** Every 32-bit seed has one phrase and back [src: AGENTS.md §5.8], so a typed phrase dials a world, as a Stargate address does.
- **The destinations are surfaces the app already paints** [src: strings.js]: Ring in the Sky (a planet's ground under its rings), Sunrise Scroll (the ink lands by the seed: the fantasy land), Night City, Windward Sea, Idyllic Meadow, Liminal Spaces' rooms. Saturn and Enceladus are already painted (`paintSaturn`, `paintEnceladus`) [src: stepsRing.js, its imports]. Each needs a walkable version only once it becomes a destination.
- **Mars, Niven's way:** a Map of Mars on the ring itself, a raised plateau of thin red air, reached by climbing instead of a gate [src](https://en.wikipedia.org/wiki/The_Ringworld_Engineers).
- **Venus and the candy world:** a cloud city for Venus, and for the candy world the ring's land generator under a candy palette, as CandyCraft does [est].
- **Scale through the gate,** as in Minecraft's 8:1: a small world (Enceladus) walked round in minutes, a planet shown as a patch a few km across [est].
- **Gates as structure,** borrowing one of two rules [est]:
  - Oblivion's: more gates open as the story goes on, and closing one takes a thing from its tower's top;
  - Morrowind's: collect each station's index to unlock it.

## 5. What our generators need for this

### 5.1 What already exists (Arena's systems, in the Ringworld)

| Arena's system | The Ringworld today |
|---|---|
| Provinces | six worlds plus Mixed, which lays three side by side region by region [src: stepsRing.js, `RG_WORLDS`, `rgWorldOf`]; vernacular regions (north, steppe, savanna, mesa, tropic, shire, prairie, apulia, galicia, kyo) [src: stepsRing.js, `rgVernacular`]; a palette per region [src: stepsRing.js, `RG_PALETTE_OF`] |
| Cities and towns | towns where `cityAt` rises; hubs on a 200 m grid, each with ways out and one on to the next town [src: stepsRing.js, `rgView`, `rgStore`]; buildings by vernacular [src: paintKit.js, `PK_VERNACULAR`] |
| Roads | ways walked across the land toward the level, in the world's own materials, worn or broken [src: stepsRing.js, `rgStore`]; at most one main road along and one across, placed by the eye [src: stepsRing.js, `rgRoadsOf`] |
| Farms and the wilds | farmsteads by tradition [src: stepsRing.js, `RG_FARM`]; the wild places of the motion doc's §8 item 17 |
| Townsfolk | walkers with timetables of independent stops [src: stepsRing.js, `RG_MOVES`]; a door each, the nearest house within 250 m, entered at the walker's own moment of dusk and left at dawn [src: stepsRing.js, `rgStore`, `toDoor`]; buildings no one enters [src: stepsRing.js, `RG_DOORLESS`] |
| Day and night | the shadow squares' night and each place's own hour [src: stepsGenerative.js, `RING_COV`, `ringDay`] |
| Weather | clear, clouds, rain, storm, snow or fog by the seed [src: stepsRing.js, `RG_WEATHER_SEL`] |
| Signs and rumors | boards in the ring's own voice, roadside serial verses and a "YOU ARE HERE" map board [src: paintKit.js, `PK_BOARDS`, `PK_SERIALS`] |
| Interiors | Liminal Spaces' Room Caster: eleven kinds of empty interior, among them a maze of tunnels [src: stepsRoom.js, `ROOM_KINDS`] |
| Level of detail | the store's nested cells, kept per world [src: stepsRing.js, `RG_KEPT_STORES`] |

### 5.2 What is missing

- **A place along the ring.** The eye always stands at angle 0, and its place across the band is set by the seed [src: stepsRing.js, `rgView`; stepsGenerative.js, `ringPlaceOf`]. The store's key holds no position along the ring [src: stepsRing.js, `rgStore`]. Every noise and cell hash needs a ring longitude added [est].
- **True land and painted land, kept apart.** Heights are gentled near the eye, and far land is drawn up to 3.2 times taller; `T.true` exists beside `T` [src: stepsRing.js, `rgView`]. A walker must stand on the true land [est].
- **Regions with names and rulers,** and factions between neighboring regions [est].
- **Roads and rail at world scale.** Today's main roads are placed by the eye; the wall-top maglev doesn't exist yet [est].
- **Building roles:** inn, guild, temple, shop, house, noble house and palace, as Arena's city blocks are [est].
- **NPC roles** (innkeeper, guard, priest, farmer, pilgrim) with timetables by role [est].
- **The rest** [est]:
  - interiors joined to doors;
  - dungeons;
  - quests;
  - a map;
  - collision;
  - a ground-level camera;
  - a saved store of world facts (the game doc §5.2).

### 5.3 The order, so each step also improves the paintings [est]

1. **A ring longitude.** [est]
   - *Build:* a new Where on the Ring knob (or the second half of the seed phrase), added to every along-coordinate in the land, the store's cells and its key.
   - *Paintings:* one seed gives a whole ring of views, and a film can dolly along the band.
2. **Regions as arcs.** [est]
   - *Build:* cut the ring into perhaps 9 to 36 arcs, by Band Width. Each arc takes a world, a vernacular, a palette, a ruler's seed and Arena's recipe of so many city-states, towns and villages [src](https://app.uesp.net/wiki/Arena:Places), spaced as central places (the motion doc §7.3).
   - *Paintings:* country that changes at a believable scale, and a region you can recognize from seed to seed.
3. **Names** (§5.4). [est]
   - *Paintings:* milestones, station signs and town boards with local names ("ARCHVIEW 3 KM").
4. **The world's ways.** [est]
   - *Build:* a ring road near each wall, crossings at towns, a railway along the band and the maglev's track on the wall top, all keyed to the region and not the eye.
   - *Paintings:* roads that lead somewhere, and a maglev's light crawling along the wall's top (the motion doc §8 item 18).
5. **Building roles.** [est]
   - *Build:* Arena's draw (about 45% houses, 20% taverns, 15% shops, 10% temples, 10% noble houses), one guild per town, and the palace at the capital.
   - *Paintings:* inn signs, temple roofs, guild glyph boards, and windows lit by role and hour (the inn late, the temple at its offices).
6. **People by role.** [est]
   - *Build:* each walker's timetable visits its role's places: the innkeeper goes from home to the inn, the guard to the gate, the pilgrim along the ring road. Arena's townsfolk spawned near the player and wandered [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/Entities/ArenaCitizenUtils.h); these keep the Ringworld's stateless timetables.
   - *Paintings:* motion that means something, such as a crowd at the inn's door at dusk.
7. **The ground camera, walkable metres and collision.** [est]
   - *Build:* an eye 1.6 m up (just under today's Altitude 0), and capsule tests against footprints (buildings and boards already carry their width in metres). This is the game doc's Stage 1.
   - *Paintings:* true eye-level views as camera choices.
8. **Interiors.** [est]
   - *Build:* a door leads to a Room Caster room seeded by the building's id, with kinds by role (an inn's hall, a temple's nave, a shop) beside the eleven.
   - *Paintings:* lit rooms seen through windows at night, and a new view from inside.
9. **Dungeons, Arena's way.** [est]
   - *Build:* one tileset per dungeon, chunks drawn from that tileset's eight (the Room Caster's maze is the first), one or two levels and four for an artifact. Place them in spill mountains, under ruins and inside fallen giants (`RG_GIANTS`).
   - *Paintings:* dungeon mouths on the mountains' flanks, lit and smoking.
10. **Quests as data.** [est]
    - *Build:* Arena's generator (the inn's three kinds, the ruler's three) in the game doc's world-fact store (§5.2), with targets drawn from the store's own records and Daggerfall's declared places and people as the template.
    - *Paintings:* nothing directly; the boards carry the rumors.
11. **The map and fast travel.** [est]
    - *Build:* the arch overhead is the map (the game doc §3). A paper map unrolls it, the "YOU ARE HERE" board is the one in the world, and travel days are summed along the arc as Arena does.
12. **Gates, then a frame story.** [est]
    - *Build:* the gates of §4.2, then a frame story in Ruby's words.
    - *The shape:* Arena's main quest is ready to borrow, piece by piece: a dream, a city, a ruler, a first dungeon, then the piece.

### 5.4 Naming

- **Arena's ways** [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/WorldMap/ArenaLocationUtils.cpp) [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/Assets/TextAssetLibrary.cpp) [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/World/MapGeneration.cpp):
  - a seed from position (a city's (x << 16) + y);
  - a seed from a name (the wilderness from four letters);
  - syllable lists joined by per-people rules, with optional parts;
  - tavern names as prefix plus suffix, with marine suffixes by the sea.
- **Others' ways:**
  - Elite's seeded two-letter tokens [src](https://elite.bbcelite.com/deep_dives/generating_system_names.html);
  - Daggerfall's name banks per people [src](https://github.com/Interkarma/daggerfall-unity/blob/master/Assets/Scripts/Game/Utility/NameHelper.cs);
  - Dwarf Fortress's biomes and rivers named in the peoples' languages [src](https://en.wikipedia.org/wiki/Dwarf_Fortress);
  - Qud's places named in its sultans' gospels [src](https://pcgworkshop.com/archive/grinblat2017subverting.pdf).
- **For the ring:**
  - **A region's name** comes from its arc index and the ring seed, through a grammar per vernacular [est]:
    - shire takes English-like compounds;
    - kyo takes Japanese-like morae;
    - galicia takes Iberian-like endings;
    - the builders' and ruins' worlds take Elite-like token names, machine designations worn smooth.

    Each grammar is a small syllable bank with Arena's optional parts [est].
  - **The ring's own words** make the compounds: spinward, rimward, longnoon, archlight, edgeward [est]. The boards already use them (Upcurve, Coriolis, Longnoon, Edgeward) [src: paintKit.js, `PK_BOARDS`]. Examples: Longnoon Reach, Archlight Under-Wall, Spinward Hollow [est].
  - **A town's name** comes from its hub cell, so it has the same name from every view [est].
  - **An inn's name** is prefix plus suffix (Arena's form) from ring-flavored lists: The Long Noon, The Square's Edge, The Lamp and Wire [est].
  - **A ruler's name** comes from the region's people bank, and the ruler's seed from the palace's place, as Arena's ruler seed is [src](https://github.com/afritz1/OpenTESArena/blob/main/OpenTESArena/src/WorldMap/ArenaLocationUtils.cpp) [est].
  - **Each name is a seed phrase too.** Typing a place's name regenerates the place, as Arena's four letters did. Because every seed has a phrase of its own (seedWords.js), there are no Rockgrove twins [src: AGENTS.md §5.8] [est].
  - **Never Arena's or Tamriel's names.** Nods take names of their own [src: ROADMAP.md, L5].

## 6. Brainstorm: what a ringworld Arena could have that no other game does

1. **The arch is the map.** Look up and see the region you are bound for, in its own day or night, with quest marks glowing on it [est].
2. **Night you can watch coming.** The shadow square's edge sweeps along the arch toward you, so dusk has an edge and a speed [est].
3. **Racing the dark.** A flycycle run that stays inside the day until it reaches a town before the square does [est].
4. **The broken square.** One square sticks: a region of endless noon (a desert people) beside one of endless night (lamplit and nocturnal) [est].
5. **Rim-wall cities** stacked up the wall's face, their lowest streets in haze and their highest in near-vacuum, served by lifts [est].
6. **The wall-top maglev,** a train on the edge of space. Its stations are the ring's fast travel, and its windows look down on a whole region [est].
7. **Spill mountains as dungeons,** with the spill pipes inside and levels climbing toward thin air, the last needing a suit [est].
8. **The Fist-of-God dungeon,** whose last level opens onto space [est], after Niven's holed mountain [src](https://en.wikipedia.org/wiki/Ringworld).
9. **The underside:** the scrith floor's outer face and the spaceports in vacuum, a dungeon that is the outside of the world [est].
10. **A pilgrimage round the ring,** one region per piece of the quest. The ring closes, so the last piece is where you began [est].
11. **Transporter stations** to Mars (or a Map of Mars on the ring, climbed instead of dialed), to Venus's clouds, to Enceladus's ice, to a candy world [est].
12. **Stations you dial by phrase:** a typed seed phrase opens a world no one else has visited [est].
13. **Festivals at eclipse,** when the gas giant crosses the star, or when two shadow squares' gaps line up for a long noon [est].
14. **A different hour in every region.** Fast travel lands you at another time of day, and "the night is 40 km spinward" is a real direction [est].
15. **The lamplighter's wave,** running ahead of the shadow's edge town after town [est]. The lamplighter already walks its round [src: stepsRing.js, `RG_MOVES`].
16. **Weather seen from afar:** a storm over the next region on the arch, a day before you reach it [est].
17. **Thrown things curve:** Coriolis archery and rimward winds [est]. A board already warns "THROWN OBJECTS WILL NOT RETURN" [src: paintKit.js, `PK_BOARDS` advisory].
18. **The far wall as a compass:** a thin line across the band always shows which way is rimward [est].
19. **Floating cities** that drift over regions on magnetic lift, a city-state you must catch up with [est], as Niven's float [src](https://www.h2g2.com/approved_entry/A87815604).
20. **Peoples instead of races:** each region a different hominid people [est], as Niven peopled the ring [src](https://larryniven.fandom.com/wiki/Ringworld?oldid=4725).
21. **The builders' maintenance robots** as townsfolk with timetables [est], and a dungeon door behind the plaque "BACK IN 40,000 YEARS." [src: paintKit.js, `PK_BOARDS` plaque].
22. **Gospels on the walls:** the builders' history in rim-wall murals, generated event first and cause after [est], as Qud does [src](https://pcgworkshop.com/archive/grinblat2017subverting.pdf).
23. **Boards as rumor-givers:** a serial verse along a country road is a quest's first clue [est].
24. **Fallen giants** as walk-in dungeons [est]. The kneeling robots already lie in the grass [src: stepsRing.js, `RG_GIANTS`].
25. **The Great Ocean's maps:** islands that are one-to-one maps of other worlds, other worlds without a gate [est] [src](https://larryniven.fandom.com/wiki/Ringworld?oldid=4725).
26. **A ring calendar** of falans and turns [src](https://larryniven.fandom.com/wiki/Ringworld?oldid=4725), with fairs that move spinward one region a turn [est].
27. **Every place is a painting:** stand anywhere, frame the view, and the app makes a poem's page from it. The photo mode is the app itself [est].
28. **Arch-lit nights:** where the arch overhead is in day, nights are lit by it as by a moon; where it is dark, nights are black and starry [est].

## Gaps

- **Not reached** (permission not given in time): OpenTESArena's GitHub page and wiki, and UESP's Arena dungeons page. OpenTESArena's code was cloned and read instead.
- **Not read in full:** Julian LeFay's own words (one page is paywalled), the GDC 2024 Arena postmortem and the No Man's Sky GDC talks (only their descriptions).
- **Not found:**
  - the number of Niven's shadow squares;
  - the height of Halo's rim walls;
  - a source on spill mountains other than the 1993 game's hint book;
  - how Daggerfall resolves a quest's random places when the quest starts;
  - an official source for Valheim's generation (the one used is unofficial).
- **Not measured in this repository:**
  - The painter's-scale figures of §3.4 are read from the code's constants, not checked on a render.
  - That the land and the store would stay seamless once a longitude is added is reasoned from their noise being in world coordinates, not tested.
