# Scenes to render: a brainstorm

Ruby (2026-10-20) asked for more 3D rendered scenes: fascinating, impossible, dreamlike, mundane, painterly,
psychedelic, eldritch. The starting points were Ruby's own document and these ideas:
- "inside randomly generated space stations with scenes in the windows";
- "standing on a cliff in a world where all textures are painted that is also a liminal space with MC Escher
  architecture";
- "a wild natural world made out of black and white smoke coalescing into recognizable forms".

The brief: ignore the animation directions and imagine static scenes. Where an idea is varied, treat the variations as
seed independence: the seed picks among them.

## What every scene must do

- **Read at a glance, grow impossible with looking.** The thumbnail says "a hotel", "a desert", "a grocery store". The
  impossible part is found on the second look (Ruby's document: "immediately readable from a distance, but become
  increasingly impossible the longer you stare").
- **Leave the poem room.** A quiet field (sky, floor, water, fog) where text sits. The busy part sits on one third.
- **Be lit from maps, from the dial.** Every scene uses the renderer (docs/renderer-pass.md). Anything with a position
  stays put while the camera sweeps.
- **Let the seed choose, not repeat.** Each list below is the seed's to choose from. A scene with one look gets old
  on the third seed.
- **Love letters stay unnamed.** Recognizable, but never a copied character, logo or name.

## Six engine features the scenes share (each a general part, built once)

1. **Portal**: a frame (window, painting, balcony, mirror, porthole, monitor) that shows another surface rendered
   inside it, at its own camera. Two levels at most, so recursion ends.
   - It unlocks the space station windows, the planet-sized museum, the hotel balconies, the canyon of paintings, the
     showroom civilizations and the library's pages.
   - The surfaces we already have become the views.
2. **Style Mask**: one scene rendered in several finishes, chosen by a mask: pencil, wireframe, flat colour study,
   oil. It unlocks the Unfinished World and the Charcoal Planet, and gives any surface a "half-painted" reading.
3. **Escher camera**: an isometric or parallel projection, with edge-joined stairs and impossible joins (Penrose
   stairs, the Penrose triangle, Ascending and Descending). Built from the painted kit's boxes.
4. **Coalescing Smoke**: a silhouette from the kit (a tree, a deer, a heron, a whale), used as a density target. Curl
   noise erodes it from its edges outward, so the form is clear at its heart and turbulent at its rim.
5. **Sky Things**: the Ringworld's directions-in-the-world helper, made general. Planets, moons, eclipses,
   upside-down oceans and floating islands stand in sky directions, so a camera turns past them.
6. **Kit Furniture**: paintKit grows interiors: shelves, counters, chairs, lamps, boarding gates, departure boards
   (text in web fonts, ON_PAGE), bookcases, washing machines. Each piece is flat shapes lit from maps.

---

## The scenes

**How to read each entry**
- **See:** the first glance.
- **Twist:** what the second look finds.
- **Seed:** what the seed chooses.
- **Parts:** what it is built from.

### Cosmic and impossible architecture

**Station Windows** (Ruby's own)
- **See:** a corridor of a space station, ribbed and lit in strips, with a row of windows down one side.
- **Twist:** every window shows a different reality, by Portal. One might show:
  - a medieval city (the kit);
  - an eye in the dark (Black Hole's tracer, an iris);
  - the same corridor again;
  - the corridor five hundred years later (Ruins);
  - a sea from below;
  - Saturn.
- **Seed:** the station's style (white clean, industrial, overgrown, derelict, neon); how many windows; their shape
  (round porthole, slit, hexagon); what each shows.
- **Parts:** the Room Caster (a corridor kind), Portal, the kit, and Lens Blur on the far windows.

**Cliffside of the Painted World** (Ruby's own)
- **See:** you stand on a cliff edge over a painted world: brushstroke mountains, a watercolour sea, oil clouds.
- **Twist:** Escher staircases climb between floating cliffs in the sky. One stair turns back on itself, and a
  doorway opens onto the same view.
- **Seed:**
  - the medium of each element (oil, watercolour, gouache, ink);
  - the time of day;
  - how many floating cliffs;
  - which impossible figure stands in the sky: Penrose stairs, an endless arch, or a waterfall that feeds itself.
- **Parts:** Curves and Profile Gradient ridges, Escher camera, Style Mask (each element its own medium), Oil Paint,
  the Light Engine.

**Cathedral in the Disc**
- **See:** a gothic nave whose far end opens onto a black hole's accretion disc.
- **Twist:** the light bends round the columns, so each pillar shows twice: the tracer's lensing applied to the nave.
- **Seed:** the order (gothic, romanesque, brutalist); the disc's tilt; stained glass or open sky.
- **Parts:** Black Hole's tracer as a process part, the Room Caster (a nave kind), stained glass from R1.2.

**Lighthouse on an Iceberg in Space**
- **See:** an iceberg drifting through stars, a lighthouse on its peak, its beam sweeping out into nothing.
- **Twist:** the beam lights other drifting things. Seed: a whale, a ship, a second iceberg with a lit window.
- **Seed:** the ice (blue, black, white); the nebula behind; the beam's colour.
- **Parts:** Crystal Druse's maps for the ice (translucent, refracting), Sky Things, Streamers or Lens Blur for the beam.

### Dreamlike and liminal

**The Endless Hotel**
- **See:** a hotel's balconies in rows wrapping round the horizon.
- **Twist:** each balcony holds a scene (Portal, small):
  - a birthday party, frozen;
  - an empty pool;
  - a rainstorm in one room;
  - a forest grown indoors;
  - the same balcony.
- **Seed:** the hotel's era (art deco, motel, brutalist, ryokan); dusk or night; which rooms are lit.
- **Parts:** the kit's facades on a Curve that wraps, Portal, and the windows as emission.

**The Suburban Moon**
- **See:** a quiet suburb on the moon: mailboxes, a bicycle on its side, a lawn sprinkler. Earth fills half the sky.
- **Twist:** through each front window, the living room is a sea, with waves under the lamp.
- **Seed:** which planet fills the sky (Earth, Saturn, a gas giant, a ringworld's arch); the houses' style; a
  kid's chalk on the dust.
- **Parts:** the kit's houses, Dune Ripples' ground in grey, Sky Things, Portal (the window seas).

**Airport to Nowhere**
- **See:** an airport's glass hall in an endless desert at golden hour.
- **Twist:** no planes land. Whales glide over the runways, clouds queue at the gates, and the departure board lists:
  - "Yesterday";
  - "Underwater";
  - "Room 7";
  - one line from the poem itself (G: the poem as an input).
- **Seed:** what waits at the gates; the hour; the board's destinations, from a bank of impossible places.
- **Parts:** the kit (the hall, gates, board), Dune Ripples, Sky Things for the whales.

**Laundromat at 3 A.M.** (new)
- **See:** fluorescent tubes, a row of washers, plastic chairs, a vending machine's hum made visible as light.
- **Twist:** each washer's porthole holds weather: a storm, a galaxy, a koi pond, someone's hand pressed to the glass
  from inside.
- **Seed:** the tile; how many tubes flicker out; what each porthole holds.
- **Parts:** the Room Caster (a laundromat kind), the kit, Portal in the portholes.

**Bus Stop in the Rain** (new)
- **See:** a lit shelter on an empty road at night, rain in the streetlight.
- **Twist:** the timetable lists dreams. The road runs to a horizon where the sea stands upright like a wall.
- **Seed:** the season; the shelter's era; the vertical sea or a city of lights.
- **Parts:** Harsh Rain, the kit, Lens Blur, emission.

### Psychedelic and natural

**Smoke Ecology** (Ruby's own)
- **See:** a forest and its creatures, made entirely of black-and-white smoke.
- **Twist:** each form is clear at its heart and coming apart at its edges: a deer whose antlers are curling into the
  trees, an owl turning into its own branch.
- **Seed:**
  - which creatures: deer, heron, wolf, whale (in a smoke sea), moth, fox;
  - the forest: pine, birch, mangrove;
  - white smoke on black, or black on white;
  - a single tint, maybe (the seed's choice).
- **Parts:** Coalescing Smoke, the kit's silhouettes as targets, Sleep Haze's shaft for one beam of light.

**Liquid Crystal Forest**
- **See:** a rainforest of iridescent glass.
- **Twist:** the trunks are mid-pour, between coral and melting.
- **Seed:** the glass's colours (the thin-film palette); dawn or dusk; mist.
- **Parts:** Crystal Druse's maps per trunk (Scatter carrying maps, R0.1), the Light Engine's translucency,
  environment reflection.

**The Ocean Overhead**
- **See:** a dry desert, and over it a bioluminescent ocean hanging upside down in the sky. Fish swim overhead.
- **Twist:** one enormous glowing creature casts caustics on the dunes below.
- **Seed:** what swims (jellyfish, whale, manta, a school); day or night; the desert's colour.
- **Parts:** Dune Ripples, Pool Caustics as light on the dunes, Sky Things, emission.

**Mushroom Cathedral** (Ruby's document: "a forest of cathedral-sized mushrooms illuminated by miniature suns")
- **See:** mushrooms the size of cathedrals.
- **Twist:** small suns hang among their caps, each with its own day around it.
- **Seed:** the species (fly agaric, morel, chanterelle, the bioluminescent kinds); how many suns.
- **Parts:** Bloom-like caps (a mushroom species list for floraKit), the Light Engine with several point lights
  (a new light feature: "suns among things").

### Eldritch without horror

**The Library That Reads You**
- **See:** an infinite library, its stacks receding.
- **Twist:** open books hold places you have never been (Portal), and the shelves curve like ribs.
- **Seed:** the wood; candles or green banker's lamps; how organic the architecture is.
- **Parts:** the Room Caster (a library kind), the kit's shelves, Portal in the open books.

**Sleeping God Mountain**
- **See:** a mountain range at dawn.
- **Twist:** on the second look it is a sleeping creature. The rivers are veins, the forests fur, the clouds its
  breath at its mouth.
- **Seed:** which creature, as a silhouette in the ridges (a dragon, a cat, a stag, a whale); the season.
- **Parts:** Curves ridges shaped by a silhouette mask, the painted kit's trees, one cloud bank as breath.

**Garden of Impossible Organisms**
- **See:** a botanical garden.
- **Twist:** Möbius leaves (Streamers' twisted ribbons), Klein-bottle fruit, tesseract flowers drawn as two nested
  blooms joined at their corners.
- **Seed:** which impossible forms; a greenhouse or open beds.
- **Parts:** Bloom, Specimen, Streamers, the Light Engine.

**Ocean of Eyes**
- **See:** a calm sea at dusk.
- **Twist:** every wave forms an eye, and they all look down, at something beneath the water.
- **Seed:** the eyes' colour; the sky; one eye looking up.
- **Parts:** Waves, a crest mask stamping the eyes (Scatter carrying maps), environment reflection.

### Mundane, with one terrible twist

**The Grocery Store Horizon**
- **See:** an ordinary grocery aisle.
- **Twist:** it runs for miles, the shelves curve into the sky, the fluorescent lights form constellations, and a
  herd of carts grazes in the distance.
- **Seed:** the store's chain-free style; the produce; the constellation.
- **Parts:** the Room Caster (an aisle kind), the kit's shelves, emission.

**The Showroom Universe**
- **See:** a furniture showroom's room sets.
- **Twist:** weather lives inside a display kitchen, and a tiny civilization in a bookcase (Portal).
- **Seed:** each room set's style; which one holds the world.
- **Parts:** the Room Caster, the kit, Portal.

**Moon Orbiting a House**
- **See:** a small rural house, a backyard, a fence.
- **Twist:** a moon-sized sphere hangs at fence-post height beside the house, lit by the sun, casting a huge shadow on
  the field. A neighbour hangs laundry.
- **Seed:** the season; the moon (cratered, ringed, a planet); the hour.
- **Parts:** Dome (R0.4), the painted kit, Grass Blades.

**Office at the Edge**
- **See:** a corporate tower at night.
- **Twist:** every floor's window shows a different law: an underwater accounting floor, a jungle meeting room,
  zero-gravity paperwork, the break room's eternal sunset.
- **Seed:** which laws; which floors are lit.
- **Parts:** Night City's tower from the kit, Portal per floor.

### Megascale

**Civilization on a Colossus**
- **See:** a landscape of cities and forests.
- **Twist:** it is a sleeping giant. Cities sit on its shoulders, forests cover its arms, its folded clothes are the
  mountain ranges.
- **Seed:** the giant's pose; what it wears; its era.
- **Parts:** Curves ridges from a body silhouette, the painted kit, the Ringworld's layered land.

**The Planet-Sized Museum**
- **See:** galleries so large the exhibits are landscapes, and airships between them.
- **Twist:** one exhibit holds weather. One frame holds a civilization that believes itself real.
- **Seed:** the museum's architecture; the exhibits (any of our surfaces, by Portal).
- **Parts:** Portal (the frames show our own surfaces), the kit, haze.

**Ringworld of Forgotten Dreams**
- A new World for the Ringworld, **Dreams**: the land changes without borders between childhood memories, the
  impossible architecture above, recurring nightmares (gentle) and half-remembered cities.
- **Seed:** which dreams, region by region (Mixed's way).
- **Parts:** the Ringworld, Style Mask (each region its own finish).

### Painterly worlds

**The Charcoal Planet**
- Everything rendered as charcoal: the maps drawn as hatching (Silverpoint Hatch's parts) and smudged. One hill is
  erased by rain.
- **Seed:** charcoal, graphite or conté; paper tooth; how much is erased.
- **Parts:** any landscape's maps, Hatching, Paper Tooth.

**The Unfinished World**
- One scene in several states of finish: pencil sketch, wireframe, colour study, finished oil. The state follows a
  soft mask, so the finished part is where the poem's eye falls.
- **Seed:** which scene; where the finish is.
- **Parts:** Style Mask over any scene.

**The Living Oil Sea**
- A sea of thick oil paint, its waves in impasto.
- **Seed:** each wave borrows a palette (nocturne, sunrise, storm); the horizon blends them.
- **Parts:** Waves height, Oil Paint, Paint Detail, the Light Engine (impasto catching the light).

### Really strange

**The Fossilized Storm**
- **See:** a thunderstorm frozen into a sculpture.
- **Twist:** the lightning hangs still (Discharge as a lit, glowing solid), the rain is crystal needles (Crystal
  Druse's maps on Harsh Rain's streaks), and birds nest in the thunderheads.
- **Seed:** the storm's colour; stone or glass; day or night.
- **Parts:** Discharge, Harsh Rain, Crystal Druse, smoke clouds lit as stone.

**The Machine Dreaming Nature** (the document's favourite)
- **See:** a colossal machine imagining a forest into existence.
- **Twist:** trees grow out of gears, animals condense from steam, and mountains extrude from circuitry. You can see
  where engineered becomes natural.
- **Seed:** the machine's era (clockwork, industrial, circuit, crystal); the forest; where the seam runs.
- **Parts:** Circuit Traces, the kit, Coalescing Smoke, Style Mask between "machine" and "nature".

**A City Inside a Raindrop**
- **See:** one huge raindrop on a leaf at dawn.
- **Twist:** inside it, refracted and upside down, a whole city.
- **Seed:** the city (any kit style); the leaf; the hour.
- **Parts:** Dome (R0.4), Refraction (R0.9), Specimen's leaf, Night City.

**The Snow Globe Village**
- A snowy village under a glass dome the size of a planet, seen from outside, from space.
- **Seed:** the village (the kit); the dome's crack; what lies beyond.
- **Parts:** Dome, Refraction, First Snow, the kit.

**Walking Statues**
- A field of colossal statues mid-stride, all toward one unseen point.
- **Seed:** their era (classical, moai-like, robots, saints); the field (wheat, snow, salt flat).
- **Parts:** silhouettes lit as stone, Grass Blades, haze.

**Desert of Physical Shadows**
- A desert where the shadows are solid. Children climb a shadow, and a shadow casts its own shadow.
- **Seed:** what casts them (a tower, a tree, a person); the hour, which sets the shadows' length.
- **Parts:** Dune Ripples, the kit's shadows extruded as dark solids, the Light Engine.

### Witchy, for this app especially (new)

**The Apothecary Shelf**
- **See:** shelves of bottles in candlelight.
- **Twist:** each bottle holds tiny weather: a thunderstorm, a nebula, a meadow at dusk, a moth, the sea (Portal at
  bottle size).
- **Seed:** the glass's colours; the labels in Runology glyphs; candles or moonlight.
- **Parts:** the kit (bottles with refraction), Portal, Cartomancy's table.

**Greenhouse on Enceladus** (for Ruby's favourite moon)
- **See:** a glass greenhouse on blue ice, its plants lit warm.
- **Twist:** outside, the plume rises into the black, and Saturn fills the sky.
- **Seed:** what grows (floraKit species); the plume's light; day or Saturn-shine.
- **Parts:** Bloom and Specimen, Crystal Druse's ice, Sky Things, Saturn and Enceladus (paintSaturn, paintEnceladus).

**The Tide-Pool Universe** (new)
- A rock pool in close-up whose anemones are galaxies and whose sand is stars.
- **Seed:** which galaxies; the pool's rim; the tide.
- **Parts:** Macro Bloom's camera and Lens Blur, Starfield as R0.6, water by R0.8 and R0.9.

**Altar of Candles** (new)
- An infinite nave of candles burning in the dark, their light pooling on stone.
- **Seed:** the candles' colours (the page's accents); offerings; a reflecting floor.
- **Parts:** Scatter carrying emission, the Light Engine's point lights, Lens Blur.

---

## Which first

The order counts Portal and Coalescing Smoke as their only new parts:

1. **Station Windows.** Ruby's first idea, and Portal makes every existing surface a window view.
2. **Smoke Ecology.** Ruby's idea, and it is unlike anything in the app.
3. **Cliffside of the Painted World.** It adds the Escher camera, which other scenes reuse.
4. **The Apothecary Shelf.** The app's own witchery, and Portal again.
5. **Greenhouse on Enceladus.** It brings together pieces that already exist.

After those, each scene is mostly a new arrangement of the same parts: the payoff of building them once.
