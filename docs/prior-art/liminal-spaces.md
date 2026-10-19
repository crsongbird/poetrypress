# Liminal Space Prior Art: Generator Catalogue

**Key to confidence:** **[src]** = stated in a consulted source. **[std]** = standard real-world building or lighting dimension, from general knowledge, not checked against a cited source this session. **[est]** = my aesthetic estimate (hex values, densities); tune it by eye. All hex values are [est] unless marked otherwise.

Units: metres. "Cell" = one grid cell of the ray-caster. A 1.2 m cell suits most kinds; use 0.6 m for tile-aligned pools.

---

## 1. Catalogue of kinds

### 1. Backrooms Level 0 ("The Lobby / Threshold")
- **Ref:** Backrooms wiki Level 0 (https://backrooms.fandom.com/wiki/Level_0). Wikipedia, The Backrooms (https://en.wikipedia.org/wiki/The_Backrooms).
- **Source text:** "mono-yellow"; "fluorescent lights at maximum hum-buzz"; worn, moist carpet; drop ceiling; lights "inconsistently placed"; outlets and "empty mounts"; rooms share the same surfaces but differ "significantly in shape and layout" [src]. The original 2002 photo is of a renovated Oshkosh furniture store, shot at a tilt [src].
- **Walls:** yellowed wallpaper `#C9B458`–`#D6C26A`. Faint vertical stripes, with a small chevron/arrow motif repeating every ~0.15 m ("arrows and vertical lines" [src]).
- **Floor:** damp carpet `#9C8A4A`, low-frequency mottling plus darker damp blotches.
- **Ceiling:** drop tiles at 0.6 m [std], `#D9D2A8`. Height 2.5–2.7 m.
- **Layout:** large irregular open plan of partial walls, stubs, pillars and doorless openings. Room sizes vary from 2×2 to 8×12 cells. No doors, no windows, no destination.
- **Light:** 0.6×1.2 m troffers, ~4100 K but tinted toward yellow by the walls. Placement is deliberately irregular: drop 20–40% of grid slots. One or two units may be dead or flickering.
- **Props:** wall outlets at 0.3 m height, empty mounts. Nothing else.
- **Grade:** slight yellow-green cast, mild overexposure, camcorder grain, tilted horizon of 2–5° (from the original photo).

### 2. Kane Pixels "Found Footage" variant
- **Ref:** Kane Parsons, *The Backrooms (Found Footage)*, 2022. Made in Blender plus After Effects and framed as a 1990s VHS tape [src, Wikipedia]. Async facility with drop ceilings and fluorescent lamps (https://kanepixelsbackrooms.fandom.com/wiki/Async_Research_Institute).
- **Spec:** same as Level 0, but with lower, simpler geometry and a heavy VHS treatment. The source argues the VHS distortion "has implied more detail exists" than was modelled (https://aaronordover.substack.com/p/implied-detail) [src].
- **Grade:** 4:3 crop, chroma bleed (shift chroma 2–4 px horizontally), luma noise, top/bottom tracking-line wobble, a date stamp, slight barrel distortion, and auto-exposure "breathing".
- **Generator lesson:** degrade the image instead of adding geometry.

### 3. Level 1: concrete warehouse ("Habitable Zone")
- **Ref:** https://a-syncbackroomsinvestigationwiki.webador.es/level-1-habitable-warehouse. Also BoredPanda's level list (https://www.boredpanda.com/backrooms-liminal-levels-scary-creepy/).
- **Source text:** concrete walls and floors, "exposed rebar", condensation puddles, "low-hanging fog with no discernable source", lights that "flicker and fail at inconsistent intervals", supply crates, heavy metal doors [src].
- **Materials:** walls `#8E8C86`, floor `#6F6E69` with puddle decals (dark, slightly specular), ceiling `#5A5955`.
- **Height:** 3.5–6 m.
- **Layout:** vast halls on a 6–8 m column grid of 0.6 m square pillars, with narrower corridors off them behind metal doors.
- **Light:** sparse hanging tube fixtures at 4000–5000 K, one per 6–10 m², roughly 10% failing.
- **Effects:** distance fog `#9A9A96`.
- **Props:** crates, rebar stubs, doors.

### 4. Level 2: "Pipe Dreams" maintenance tunnels
- **Ref:** https://teambytethebackrooms.wiki.gg/wiki/Level_2. BoredPanda list.
- **Source text:** "dark maintenance tunnels with pipes and shelves lining the walls", steam, flowing-liquid sounds; dark grey walls with white trim, darker grey floor, dark red ceiling (that wiki's version) [src]. BoredPanda adds "flickering white and orange lights" and pitch-black sections [src].
- **Materials:** walls `#4A4A4A` with a white trim band `#D8D8D0` at 1.0 m, floor `#2E2E2E`, ceiling `#4A1E1A`.
- **Height:** 2.2–2.4 m.
- **Layout:** long 1–2-cell-wide corridors with right-angle turns and occasional rooms.
- **Wall detail:** pipe bundles of 2–4 cylinders, drawn as horizontal bands at 1.6–2.1 m.
- **Light:** caged bulbs at 2700 K orange alternating with 5000 K white, 50% dark gaps. Add a steam sprite.

### 5. Level 3: "Electrical Station"
- **Ref:** https://a-syncbackroomsinvestigationwiki.webador.es/level-3-electrical-station. BoredPanda list.
- **Source text:** "claustrophobic tunnels made of yellow bricks and iron doors with small pipes"; rusty metal corridors, generators, low ceilings, prison bars [src].
- **Materials:** brick walls `#A88A4E` with mortar `#6B5A3A`, 0.215×0.065 m bricks [std]. Floor is rusted steel plate `#5B3E2A`.
- **Height:** 2.1–2.3 m.
- **Layout:** a 1-cell maze that is dense and dead-end heavy. Iron doors `#3C3A36` are about 30% of the openings.
- **Light:** bare bulbs at 2700 K, one per 4–6 cells, often dead.
- **Props:** wall-box panels, bar grilles blocking corridors.

### 6. Level 37: Poolrooms
- **Ref:** https://backrooms.fandom.com/wiki/Level_37. Wikipedia: "a (seemingly infinite) labyrinth of pristine, white-tiled indoor swimming pools" [src].
- **Source text:** white ceramic tiles "all identical to one another", lukewarm blue-green water with constant faint ripples, "light is cast from irregular angles, leaving some areas completely cast in darkness", pillars rising from water, stairs descending "directly into deep pits of water" [src].
- **Tile:** white `#EEF1EF` on a 0.15 m (6") grid [std] with grout `#B9C3C2`. Make the grout lines crisp; they carry the whole look.
- **Water:** surface at -0.1 to -1.5 m below the walkway. Base colour `#5FC9C4` shading toward `#1E6F78` with depth. Caustics are animated Voronoi lines projected on the pool floor.
- **Layout:** rooms are pool basins joined by 1-cell tile corridors, plus some open, oddly shaped halls with pillars standing in the water.
- **Light:** soft high-key light at 5000–6500 K with deliberately unlit zones.

### 7. Jared Pike "Dream Pools" (sunlit poolcore)
- **Ref:** designboom (https://www.designboom.com/?p=1047890). Scare-Me interview (https://scare-me.beehiiv.com/p/interview-artist-jared-pike-on-dream-pools-and-the-allure-of-liminal-spaces).
- **Source text:** "Sun-splashed white tile. Aqua water. Shadows plunging into unseen depths"; a 24 or 35 mm lens at eye or waist height; "some of the scene is exposed in sunlight, and then I'll intentionally try to create a dark area"; "warm sunlight… juxtaposed with unlit corners"; "you can't see around the corner"; made in Blender; inspired by Act Romegialli's La Piscina del Roccolo [src].
- **Spec:** as Poolrooms, with these differences:
  - Arches and rounded doorways.
  - Skylight or window shafts of warm 3500–4500 K light, rendered as bright floor rectangles.
  - Exposure keyed so sunlit tile clips to white and the dark doorway stays near black.
  - Low camera at 0.8–1.2 m and a moderate FOV (equivalent to 24–35 mm, ~55–75° horizontal).
  - Clean image with no grain: the "way too perfect" look [src].

### 8. POOLS (Tensori) variant
- **Ref:** UploadVR review (https://www.uploadvr.com/pools-vr-review/). KeenGamer review (https://www.keengamer.com/articles/reviews/pc-reviews/pools-game-review-a-deep-dive-into-liminal-spaces-horror/).
- **Source text:** "all-white and clean looking" rooms; slides in blue, yellow and red; flooded hallways; a sauna maze; a "Kubrick-esque" hallway; hallways that lean, narrow or stretch; oversized rubber ducks; HVAC white noise; puddles appearing [src]. The 2D release used a "retro tape filter" [src].
- **Spec:** Poolrooms tile plus props drawn as sprites: primary-coloured slide tubes (`#2B5FD9`, `#F2C200`, `#D93A2B`), a single duck sprite `#F5D300`, and a sauna room in wood `#9A6A3E`.
- **Grammar:** corridors whose width changes along their length.

### 9. Anemoiapolis (blue Backrooms / 90s underground)
- **Ref:** TechRaptor (https://techraptor.net/gaming/reviews/anemoiapolis-chapter-1-review).
- **Source text:** "monoliths of mid-90s American architecture", a "giant underground pool", elevators, "Exit" signs that may not lead out, buzzing overhead lights, "sometimes-excessive" bloom, "Backrooms but Blue" [src].
- **Spec:** Level 0 grammar with a cool palette:
  - Walls `#9DB4C8`, carpet `#4C6A8A`, ceiling `#C9D3DC`.
  - Fluorescent at 5000 K.
  - Strong bloom of 0.3–0.5.
  - Exit signs as red emissive boxes.

### 10. The Exit 8 subway corridor
- **Ref:** Adrian Hon (https://adrianhon.substack.com/p/the-exit-8). TV Tropes (https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/TheExit8).
- **Source text:** "white tiles lit by harsh fluorescent strips in the ceiling"; a poster wall facing locked doors; yellow tactile floor tiles; hum and click; "any departure from its perfect cleanliness and straight lines seems even scarier"; ceiling lights hanging askew [src].
- **Materials:** wall tile `#E9ECEA` at 0.2–0.3 m, floor `#B8BCBC` with a 0.3 m-wide yellow tactile strip `#E8C21A`.
- **Height:** 2.6 m.
- **Lights:** continuous linear strips at 5000–6500 K.
- **Layout:** a 2–3-cell-wide L or U loop that repeats identically.
- **Props:** a poster row (rectangles at 1.2–1.8 m), numbered signs, flush grey doors.
- **Uncanny lever:** one subtle anomaly per seed, e.g. one tilted light or one odd poster.

### 11. Hotel corridor at night
- **Ref:** liminal canon listing hotels and corridors (https://en.wikipedia.org/wiki/Liminal_space_(aesthetic)). Hyperallergic cites Kubrick as a precursor (https://hyperallergic.com/how-liminalism-became-the-defining-aesthetic-of-our-time.md) [src].
- **Walls:** two-tone, with beige or damask paper `#C8B79A` above a 0.9 m wainscot `#7A5A3E`.
- **Carpet:** loud repeating geometric or hexagon pattern in maroon/orange (`#6E1F23`, `#C25A2A`) on a 0.6–0.9 m repeat.
- **Proportions:** height 2.4–2.6 m, corridor width 1.5–1.8 m [std], very long (30–60 cells) with symmetric doors every ~4 m on both sides.
- **Light:** warm 2700–3000 K sconces every ~4 m, alternating sides or paired. Add a red or green exit sign at the far end.
- **Props:** door frames with number plates, an ice-machine alcove.

### 12. School hallway after hours
- **Ref:** Wikipedia (a schoolhouse emptied of people) [src]. Skkruse's "school corridor at midnight" (https://www.skkruse.com/libations-from-the-liminal/liminal-spaces) [src].
- **Floor:** VCT tiles at 0.305 m (12") [std], alternating `#D8D3C4` and `#A9A396`, glossy with a mirror-like smeared reflection of the lights.
- **Walls:** painted block `#CFC9B5` above, lockers below.
- **Ceiling:** 0.6 m drop tile. Height 2.7–3.0 m.
- **Proportions:** corridor width 2.4–3.0 m [std], doors every 8–10 m with small wire-glass windows.
- **Light:** 4100 K troffers, with 70% off at night so only every third unit is lit.
- **Props:** locker banks of 0.3 m units in `#3F6E9E` or `#8C2B2B` at 1.8 m tall, a drinking fountain, an exit sign.

### 13. Office after hours / cubicle farm (cf. Backrooms Level 4 "Abandoned Office")
- **Ref:** BoredPanda list (Level 4: "empty rooms, cubicles, fluorescent lights… blacked-out windows") [src].
- **Materials:** grey-blue carpet tile `#6C7480` at 0.5 m, drop ceiling at 0.6 m, height 2.6 m.
- **Layout:** an open floor with 1.2 m-high cubicle partitions `#8A8F96` on a 2.4 m grid. Ray-cast them as half-height walls if supported; otherwise use full walls with a window band.
- **Light:** 4100 K, with half the floor dark and one lit island.
- **Windows:** black.
- **Props:** chairs, a dark monitor, the green glow of an exit sign.

### 14. Hospital / clinic corridor
- **Ref:** liminal canon (corridors, waiting rooms; https://en.wikipedia.org/wiki/Weirdcore_aesthetic) [src]. Specs are [std/est].
- **Materials:** sheet vinyl floor `#C9D2C8` (pale mint) or `#D7D9DC`, walls `#E6E8E2`, a stainless handrail at 0.9 m, a corner guard strip.
- **Proportions:** height 2.7 m, corridor width 2.4 m.
- **Light:** 5000–6500 K, overly even.
- **Props:** double doors with round porthole windows, a parked wheelchair or gurney silhouette, coloured wayfinding stripe lines on the floor (`#2F7FBF`, `#3FA34D`).

### 15. Waiting room / DMV / laundromat
- **Ref:** Skkruse: waiting areas are "charged with anticipation, anxiety, even dread" [src]. Weirdcore article lists waiting rooms [src].
- **Spec:** a single 6×8-cell room plus a corridor.
- **Seating:** rows of linked chairs (`#3C5A8C` or orange `#D9772B`) facing one wall.
- **Floor:** 0.3 m VCT. Ceiling: drop tile at 2.6 m.
- **Light:** 4100–5000 K, very bright.
- **Laundromat variant:** a wall of 0.7 m front-loader squares (white body, dark round port) and ceiling-mounted TVs.

### 16. Stairwell
- **Ref:** Wikipedia lists stairwells [src]. POOLS has a stairwell with windows [src].
- **Materials:** painted concrete `#BDB8AE`, safety yellow nosing `#E0B500`, a steel railing `#5A5F63`, a large painted floor number on the wall.
- **Height:** 3.0 m per floor.
- **Ray-cast:** a 2×3-cell well. Fake the stairs as stacked floor steps of 0.17 m [std], or as a sloped ceiling.
- **Light:** one wall-pack per landing at 4000 K, every other one dead.

### 17. Parking garage (cf. Backrooms Level 35 "An Empty Car Park", Level 22)
- **Ref:** BoredPanda list (Level 35: concrete garage, flickering lights, "yellow and blue-green illumination"; Level 22: collapsing garage) [src].
- **Spec:** low concrete slab `#7D7B76`, clear height 2.1–2.4 m [std].
  - Columns 0.6×0.6 m on an ~8×8 m grid, with painted bands (yellow `#E2B714` or numbered zone colours).
  - Floor `#5E5D5A` with white stall lines 0.1 m wide at a 2.5 m pitch.
  - Bays open to black night at the edges.
- **Light:** either high-pressure sodium (orange-pink, ~2000–2200 K [std]; source confirms "pinkish-orange" HPS and "bright yellow" monochrome LPS at 589 nm — https://www.chemeurope.com/en/encyclopedia/Sodium_vapor_lamp.html) or 4000–5000 K tubes with a blue-green cast `#BFE3D0`. Space fixtures every 4–8 m.

### 18. Dead mall concourse
- **Ref:** Hazlitt, "The Dead Mall Society" (https://hazlitt.net/longreads/dead-mall-society). Dan Bell's *Dead Mall Series* (https://en.wikipedia.org/wiki/Dan_Bell).
- **Source text:** "murky glass atriums", a dry fountain "reminiscent of a grounded UFO", beige floor tiles with cracks "spreading like cobwebs", faux-brick tiling, "dusty green awnings", "bubblegum pink" walls, "smoky mirrored walls", one floor "as bright and gleaming as an operating room" [src].
- **Spec:**
  - A 4–6-cell-wide concourse, height 4–8 m, with a grey skylight strip down the centre (ceiling cells emitting `#B9BEC2`).
  - Storefronts every ~8 m as dark-glass cells with metal roll-down grilles `#8E9296`.
  - Beige 0.3–0.45 m tile `#CDBFA6`.
  - A circular dry fountain in the atrium.
  - Planters, a bench.

### 19. Playplace / soft-play / ball pit
- **Ref:** Upworthy, "sad McDonald's PlayPlace" (https://www.upworthy.com/sad-mcdonalds-play-place/?nb=1). Backrooms Level 18 "Memories" (preschool, playground) and Level 31 roller rink (BoredPanda) [src].
- **Spec:** primary-colour padded walls (`#D92B2B`, `#2B5FD9`, `#F2C200`, `#2BA84A`), a rubber floor `#3A3A3A`, height 3–5 m.
  - Mesh netting walls: a semi-transparent hatch over dark.
  - Ball-pit cells: a floor replaced by a dense multicoloured dot noise, raised 0.5 m.
  - Tube openings as circles on walls.
- **Light:** few warm downlights at 3000 K.
- **Grade:** heavy grain, darkened. Reads as childhood plus abandonment.

### 20. Airport / transit concourse
- **Ref:** Augé's "non-places" and transit areas (Wikipedia, Hyperallergic) [src]. Specs are [std/est].
- **Spec:**
  - Very wide (6–10 cells) and long, height 4–6 m, with ceiling panels in long linear bands.
  - Polished terrazzo `#BFBAB2` with strong reflection.
  - Gate seating rows, glass walls to a dark sky (night) or flat white sky (overcast).
- **Light:** 4000 K linear, plus pale flight-board rectangles.

### 21. Indoor community pool (municipal, realistic)
- **Ref:** the poolcore canon above, made ordinary.
- **Spec:**
  - 25 m pool [std]. Depth 1.0–1.2 m shallow to 3.5 m diving [std].
  - Black lane lines 0.25 m wide with T-ends [std] on 2.5 cm mosaic or 0.15 m tile.
  - Painted depth numbers on the deck edge, steel ladders (two vertical tubes plus steps).
  - Vaulted ceiling 6–9 m with exposed trusses, high clerestory windows.
- **Light:** metal-halide at 4000–4500 K, slightly green.
- **Grade:** humid haze (low-contrast fog).

### 22. Endless suburb at night (Backrooms Level 9), for an exterior-feeling seed
- **Ref:** BoredPanda list: "permanent midnight sky… flickering streetlights, wet asphalt, and fog" [src].
- **Spec:** as an "interior" ray-cast, treat house facades as walls and the sky as the ceiling (`#0A0D16`).
  - Asphalt `#2A2B2E` with a wet specular sheen.
  - Sodium streetlights every 30 m, as orange pools of light on the floor.
  - Fog.

### 23. Weirdcore / dreamcore overlay (a grade, not a place)
- **Ref:** Wikipedia, Weirdcore aesthetic (https://en.wikipedia.org/wiki/Weirdcore_aesthetic).
- **Source text:** "blurry or low-resolution photography", VHS artifacts, chromatic aberration, "Fragmented or cryptic text", floating eyes, mannequins, impossible architecture; dark environments or heavily saturated colours [src].
- **Use:** as an optional layer on any kind:
  - Saturation +40% or a crushed dark exposure.
  - One centred caption line in the poetry text style.
  - A doorway that opens onto sky or clouds.
  - A single eye or sun sprite.
  - Sparingly: 10–15% of seeds.

**Not verified:** I found no game titled "Liminal Ranger"; searches returned only unrelated titles such as *Liminalcore* and the *Liminal* RPG. Check the name. For Petscop, my search returned nothing usable this session. From general knowledge (unverified): it is a fictional PS1 game with flat untextured pastel rooms, low-poly geometry and big blocky doorways. If you want it, treat it as a "flat-shaded PS1" grade: no textures, vertex-colour pastels (`#B9D7A8`, `#E8C7D8`), nearest-neighbour 320×240 upscale.

---

## 2. Principles for making a space liminal (generator rules)

1. **Nobody is there, and no use is visible.** Never render people. Emptiness of a space built for crowds is the core trigger: "Our minds recognize the setting but cannot reconcile it with the absence of life it usually contains" (Skkruse). "Failure of presence" (Heft, via Wikipedia). One exception: Diel & Lewis found that human presence *reduced* uncanniness in distorted public spaces but *increased* it in private rooms (https://orca.cardiff.ac.uk/id/eprint/151790). A single distant figure is therefore only for bedroom- or home-like seeds.
2. **Use spaces built for passing through.** Corridors, lobbies, stairwells, garages and waiting rooms are in-between by function; "on our way… stalled" (Skkruse). Prefer layouts that are long, with corridors as a large share of floor area.
3. **Keep it familiar but structurally off.** Uncanniness is driven by "deviations from familiar configural patterns" (Diel & Lewis 2022). Start from correct real-world dimensions (section 1), then break one or two of them:
   - ceiling 15–30% too low or too high;
   - corridor too long;
   - a door that opens onto a wall;
   - stairs into water;
   - a light hanging askew (Exit 8).
4. **Repeat with no landmarks.** Identical tiles, lights and doors ("all identical to one another", Level 37). A mono palette ("mono-yellow"). Vary room shape but never materials (Level 0).
5. **Never arrive.** No visible exit, or exits that loop or lead nowhere (Anemoiapolis "Exit" signs; Exit 8 loop). "No arrival… no destination" (Skkruse).
6. **Hide the end of the space.** "You can't see around the corner"; "How far does it go?" (Pike). Always leave at least one dark opening or a turn in view, and let fog or darkness swallow the far distance.
7. **Contrast light and dark.** Either overly even fluorescent light (Exit 8, hospital) or bright zones next to deliberately unlit voids (Pike, Level 37 "irregular angles"). Avoid medium, moody, cinematic lighting; it reads as a game level, not a liminal space.
8. **Low fidelity implies more.** VHS or camcorder degradation "implied more detail exists" (Ordover on Kane Pixels). Alternatively, use too-clean rendering ("way too perfect", Pike). Pick one end of that scale, never the middle.
9. **Frame like a snapshot, not a hero shot.** Camera at waist to eye height, 24–35 mm lens (Pike). A slight tilt and a casual off-centre framing (the original Backrooms photo), or dead-centre one-point perspective down a corridor (Kubrick; the Exit 8 tunnel).
10. **The hum is implied in the image.** "Maximum hum-buzz". Visually: a slight 1–3% frame-to-frame luminance flicker on one fixture.

---

## 3. Seed variety

**Two-level choice:** the seed picks a kind from section 1, then jitters that kind's parameters within the ranges below. Weight the kinds roughly as follows: Level 0 family 20%, pools 20%, corridors (hotel, school, hospital, Exit 8) 25%, utility/concrete 15%, mall/garage/airport/playplace 15%, outdoor-ish 5%.

**Safe ranges (relative to each kind's base):**
- Hue shift ±8°, saturation ±15%, wall brightness ±10%. Keep each kind's palette to 1 dominant hue plus 1 neutral.
- Ceiling height: 0.85–1.3× base. Corridor width: 0.8–1.5× base.
- Room size distribution: open-plan kinds 2–12 cells; corridor kinds 1–3 cells wide and 15–60 cells long.
- Light density: 30–100% of grid slots. Dead or flicker fraction 0–25%. CCT ±500 K around the kind's value.
- Tile size: snap to real modules (0.15, 0.2, 0.3, 0.6 m). Off-module sizes read as fake.
- Water level: 0.05–1.5 m below the walkway, or flooding the walkway at 0.1–0.3 m deep (POOLS-style flooded corridors).
- Camera: height 0.8–1.7 m. Horizontal FOV 60–90°. Tilt 0–5°. Yaw either aligned to a corridor axis (one-point perspective, 40% of seeds) or off-axis.
- Grade: one of three looks.
  - Clean: no grain, bloom 0.1, slight overexposure.
  - Camcorder: grain 0.04–0.08, chroma shift 1–3 px, vignette 0.2–0.4, softness.
  - VHS: everything in Camcorder plus scanlines, tracking wobble and 4:3 framing.
- Anomaly budget: 0–2 per seed (askew light, door to a wall, stairs into water, misplaced sky, one oversized prop).

**Combinations to avoid:**
- People or creatures (except per rule 1). Gore. Overt monsters. Liminal unease comes from wrongness, not threat; Kotaku makes this point via Wikipedia.
- More than one dominant hue, or saturated multi-colour lighting outside the playplace and roller-rink kinds.
- Mixing material families in one seed (yellow wallpaper plus pool tile plus brick). This kills recognisability. POOLS-style deliberate cross-overs are fine at ≤5% of seeds.
- Heavy VHS on sunlit pools. Pike-style pools rely on clean clipping highlights; give them the Clean look or light grain at most.
- Clutter. Keep to at most 1 prop type per room. Empty is the point.
- Warm, cosy, low-key light (fireplace, candle) and natural greenery indoors. These read as inhabited or comfortable.
- Perfectly lit endings: an exit sign may glow, but no visible door with daylight beyond it.
- Ceiling height above ~3× corridor width in narrow kinds. It reads as a cathedral, not a liminal space; reserve that for mall, airport and pool hall kinds.

---

## 4. Sources consulted

- https://backrooms.fandom.com/wiki/Level_0
- https://backrooms.fandom.com/wiki/Level_37
- https://en.wikipedia.org/wiki/The_Backrooms
- https://en.wikipedia.org/wiki/Liminal_space_(aesthetic)
- https://en.wikipedia.org/wiki/Weirdcore_aesthetic
- https://a-syncbackroomsinvestigationwiki.webador.es/level-1-habitable-warehouse
- https://a-syncbackroomsinvestigationwiki.webador.es/level-3-electrical-station
- https://teambytethebackrooms.wiki.gg/wiki/Level_2
- https://www.boredpanda.com/backrooms-liminal-levels-scary-creepy/
- https://kanepixelsbackrooms.fandom.com/wiki/Async_Research_Institute
- https://aaronordover.substack.com/p/implied-detail
- https://nofilmschool.com/backrooms-blender
- https://www.designboom.com/?p=1047890
- https://scare-me.beehiiv.com/p/interview-artist-jared-pike-on-dream-pools-and-the-allure-of-liminal-spaces
- https://www.uploadvr.com/pools-vr-review/
- https://www.keengamer.com/articles/reviews/pc-reviews/pools-game-review-a-deep-dive-into-liminal-spaces-horror/
- https://techraptor.net/gaming/reviews/anemoiapolis-chapter-1-review
- https://adrianhon.substack.com/p/the-exit-8
- https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/TheExit8
- https://www.skkruse.com/libations-from-the-liminal/liminal-spaces
- https://hyperallergic.com/how-liminalism-became-the-defining-aesthetic-of-our-time.md
- https://orca.cardiff.ac.uk/id/eprint/151790 (Diel & Lewis 2022, abstract only)
- https://hazlitt.net/longreads/dead-mall-society
- https://www.chemeurope.com/en/encyclopedia/Sodium_vapor_lamp.html
- https://www.paclights.com/explore/troffer-light-fixture-lighting-explained/ (troffer sizes 1×4, 2×2, 2×4 ft)

**Blocked or unavailable this session (not used):** backrooms.fandom.com Level_1, Level_2 and Level_3 pages; the Diel & Lewis full text (doi.org/10.1016/j.jenvp.2022.101844), so the specific deviations they tested are unverified; Dan Bell's Wikipedia page was found but not read; no usable Petscop or "Liminal Ranger" sources were found.
