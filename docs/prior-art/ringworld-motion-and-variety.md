# Prior art: motion, light and variety on the Ringworld (clouds that build, smoke on the wind, lights that live, a wider world)

Ruby, 2026-10-24, on the Painted Ringworld (stepsRing.js and paintKit.js, films drawn offline frame by frame from the scene clock, nothing carried between frames): "more animations: clouds building, smoke following the wind, smoothly iterated. glow, lights, etc should also be animated but be careful not to flicker too much, this includes large spires and other buildings like this. more colouration in variety seed dependent. clouds and smoke should follow the wind and never flicker (cirrus clouds do this a bit). a wider variety of objects being generated and used in the scenes? minor variations on buildings (cheap) and expanding the library and spawning logic (expensive) are both approved options and desired."

And Ruby's further notes the same day: the comet should move with the scene clock and point its tail away from the star; shooting stars and aurora checked and improved; "a slightly greater sense of scale ... with minor adjustments to layering"; lightning never on a film's first frame, and lighting the whole scene and its shading fairly starkly, reconciled with photosensitivity; farms only near densely settled rings (cities, builders), the wilds given druid groves and other wild things instead.

How to read the tags: [src](URL) is a page that was opened and read; [src: stepsRing.js lines N] is this repository's code as it stood on 2026-10-24; [est] is an estimate, a computation from the code's own numbers, or a design judgment. This doc builds on, and does not repeat: docs/prior-art/ringworld-time.md (cloud heights and speeds, Wind Waker's sky, candle and fire flicker, the hour-by-hour share of lit windows, meteors), docs/prior-art/ringworld-sky.md (cloud light, cumulus life, time-lapse arithmetic), docs/prior-art/ringworld-life-and-views.md (clouds over a time-lapse, Sea of Thieves, dissolves), docs/prior-art/ringworld-stability.md (morph, don't switch; crossfades and hysteresis), docs/prior-art/painted-ringworld.md (CGA, Parish and Müller, WFC, Townscaper), docs/prior-art/painted-ringworld-2.md (the placing rule table), docs/prior-art/ringworld-sprites.md (per-instance jitter, Part C's library, Islanders, Dorfromantik), docs/prior-art/ringworld-countryside.md (von Thünen rings, farmsteads, night lights, photocells) and docs/prior-art/film-animation.md (the film's own photosensitivity rules).

## Summary

- **Why the cirrus flickers (found):** not a reseed, not a jumpy clock, not culling, not a count. Every high cloud starts at one end of the chord it drifts along, so the wraparound in the drift sends about half of them across the sky in the first frame or two of every film, and each one later pops out and back in mid-sky with no fade (§1.2). The clear sky's low bands share the same drift and the same fault.
- **Heaps re-deal their billows** whenever the number of billows changes with their size on the page, which a drifting, growing or panned heap does all the time; that must be fixed before clouds can visibly build (§1.3).
- **Lights and smoke run on clocks capped per frame, not per second of film,** so in a time-lapse their rates rise with the frame rate: the wall-top lights pulse at 2.9 Hz at 30 fps and 5.7 Hz at 60 fps, a chimney's puff train restarts 9 to 18 times a second, and windows and far lights switch on and off in one frame (§1.4).
- **Research:** cumulus live about a quarter of an hour, their size rising and falling roughly as a sine; games keep a cloud's large shape and animate only its detail, and move or reset anything only while it is invisible; smoke can be a closed-form function of emission time; aviation lights flash 20 to 60 times a minute, lighthouses 4 to 30; WCAG and broadcast guidance allow isolated flashes but nothing over three a second (§2 to §5).
- **Scale, palettes and places:** painters show scale by repeating known things smaller, lifting shadow values and narrowing the tonal range with distance; real towns get their colors from one rule each (Falu red, Burano's assigned palettes, Jaipur's geru pink, Cycladic lime); wild land holds groves, stone rows, hermitages, holy wells, beaver ponds, game trails, charcoal hearths and kettles of hawks (§6, §7).
- **What we take** (§8) begins with the cheap fixes (the drift seam, a film-seconds clock, lights that fade, a stateless smoke train, heaps that keep their billows) and ends with the expensive library and spawning work.

## 1. What the code does today, and why things flicker

### 1.1 The clocks

- Four clocks run from the film's frame: each is the frame number times the film's mean step, held to a cap per frame: clouds 0.7 s, sway 0.25 s, motion 2.5 s, water 0.4 s [src: stepsRing.js lines 147–153]. The wind is one way and speed per seed, 3 to 7 m/s, 5 more in a storm [src: stepsRing.js line 156].
- The cap is per frame, so in a time-lapse (any film whose step is larger than the cap; the default film is an hour over 12 s, 10 s of scene a frame at 30 fps) a clock runs at cap times fps scene seconds per film second: the sway clock runs 7.5 times real time at 30 fps and 15 times at 60 fps [est, from uiMoving.js lines 200–201 and index.html's frame-rate and span choices].
- A real-time film's step (1/fps) is rounded to a hundredth of a second on its way to the surface, so 1/30 arrives as 0.03 and 1/60 as 0.02: the scene's clocks run 10% slow at 30 fps and 20% fast at 60 [src: textureGenerators.js line 531; est for the percentages]. Harmless for clouds; a light's rate in film seconds would inherit it.
- What that does to the rates that matter for flicker, in a time-lapse [est, each computed as the code's angular rate times the cap times fps over 2π]:

| What | Where | Clock | 30 fps | 60 fps |
|---|---|---|---|---|
| Wall-top lights for ships | stepsRing.js line 413 | sway, 2.4 rad/s | 2.9 Hz | 5.7 Hz |
| One far light in sixteen, and ruin fires | stepsRing.js line 1297 | sway, 1.5–2.9 rad/s | 1.8–3.5 Hz | 3.6–6.9 Hz |
| Grass sway | stepsRing.js line 1358 | sway, 1.7 and 2.3 | 2.0 and 2.7 Hz | 4.1 and 5.5 Hz |
| A walker's stride | stepsRing.js line 1382 | sway, 5.5 | 6.6 Hz | 13 Hz |
| A drone's bob | stepsRing.js line 1401 | sway, 1.3 | 1.6 Hz | 3.1 Hz |
| Aurora ripple | stepsRing.js line 325 | sway, at most 0.2 | 0.24 Hz | 0.48 Hz |
| A heap's billows breathing | stepsRing.js line 1627 | clouds, 0.021 | 0.07 Hz | 0.14 Hz |
| Chimney smoke, a new puff | paintKit.js line 871 | motion, 0.12 cycles/s | 9 a second | 18 a second |
| Low mist breathing | stepsRing.js line 1774 | raw scene time, 0.002 | 0.1 Hz (an hour in 12 s) to 4.6 Hz (two days in 12 s) | the same: raw time is set by the span over the length, not the frame rate |

In a real-time film each of these is its own rate in Hz (the wall lights 0.38 Hz, the smoke one puff every 8 s), which is why the problem shows only in time-lapses [est].

### 1.2 Why the cirrus flickers

Checked one by one, as Ruby's question asks:
- **Not reseeded:** each streak takes its own stream keyed by the seed and its index [src: stepsRing.js line 517], and the strands inside it draw from that stream in a fixed order [src: stepsRing.js line 522].
- **Not count-quantized:** how many there are is drawn once from the seed [src: stepsRing.js line 516].
- **Not culled by the view in practice:** a streak is dropped only when its anchor direction has no projection, which happens past about 152° from the view's axis, behind the camera [src: stepsRing.js lines 101 and 268; est for the angle].
- **The clock is continuous:** the clouds' clock is the frame times a constant [src: stepsRing.js lines 147–148].
- **The cause is the drift's seam.** Each cloud is set on a circle as far out as it began, d = h/tan(elevation), and carried along the chord of that circle that runs through its start with the wind; its position along the chord wraps at the chord's ends [src: stepsRing.js lines 507–512]. But a chord through a point on a circle has that point as one of its ends: the start is always an end of the chord, to rounding [est, from the geometry]. For about half the clouds it is the downwind end, so the wrap throws them to the far end at the first tick of the clock.
- **Measured with the code's own formula** for 10,000 random cirrus (their 9 km height, their 2.5 times faster layer, 18 to 50° up, the seeded wind) [est, a scratch script copying stepsRing.js lines 509–512 and 517]:
  - 50% are not where the still drew them by the film's second frame: about 25% jump between frames 0 and 1, and about 25% have already jumped at frame 0, so the film opens on a different sky from the still.
  - The jump keeps the elevation (mid-sky, 18 to 50°) and moves the azimuth by a median 90° (10% under 18°, 10% over 162°).
  - After that, each streak crosses its chord in a median of about 1,950 frames of a time-lapse (10% under 460, 10% over 4,380), then pops out at the downwind end and in at the upwind end, again in mid-sky and with no fade. Over a 60 s film at 60 fps (3,600 frames) most streaks do this once or twice more.
  - The clear sky's long low bands use the same drift at 2 to 12° up [src: stepsRing.js line 513]: 63% of them jump at the start.
- **What makes it read as flicker rather than motion** [est]: a thin, faint, near-horizontal streak that vanishes in one place and appears in another between two frames, often in view, at the start of every film and now and then later.
- **Two lesser faults** that are not flicker but are why the cirrus doesn't feel carried by the wind:
  - A streak keeps one size and one screen angle for its whole crossing: its length comes from the frame's scale and the stream, its angle is drawn once within ±0.25 rad of level, and the drift's third value, how much nearer it has come, is dropped [src: stepsRing.js lines 517 and 520]. So it neither grows as it comes overhead nor lines up with the wind.
  - Overhead, the elevation is held at about 73° (the distance is clamped at 0.3 of the height), so a streak whose chord passes near the zenith swings round it instead of passing over [src: stepsRing.js line 511; est for the angle].
- An aside: the first cirrus's stream is the same as the unfinished stretch's, rgRand(s, 812) with and without index 0 [src: stepsRing.js lines 375 and 517], so the two are correlated. Harmless.

### 1.3 Heaps re-deal their billows

- A heap's billow count comes from its size on the page: at least 10, at most 64, the smaller of a shape term (about 45 for a tall heap, less for a flat one) and its width over 4 canonical pixels [src: stepsRing.js line 1610]. The first 30% of them form the base row, the rest grow from billows already placed, each try drawing from the heap's stream a variable number of times [src: stepsRing.js lines 1621–1626].
- So [est, from reading those lines]:
  - whenever the count changes by one, one billow appears or vanishes whole at the top of the growth order, and every fringe wisp is re-pointed at a different billow, because the wisps index the billows by position modulo their count [src: stepsRing.js line 1657];
  - every three or four counts the base row's size changes, which changes the number of draws taken before the growing billows, and the whole heap's layout re-deals at once.
- The count changes with anything that changes the heap's width on the page: drifting nearer or farther, growing (its width runs from 60% to 100% over the first 30% of its life, and spreads 25% more as it fades [src: stepsRing.js lines 1595–1597]), and a camera turn (the painter's stereographic projection draws things about 10% larger 37° off the axis [est, from the projection at stepsRing.js lines 101–102]). At a 1080 px film the 4-pixel term is about 1.4 screen pixels, so a heap under about 60 px wide changes its count every 1.4 px of width [est].
- A heap whose own sheet would exceed 4.2 million pixels is not drawn at all [src: stepsRing.js line 1612]; the overhead fade starts at 0.55 of the frame's width and ends at 1.2 [src: stepsRing.js line 1675], so a large near heap can vanish in one frame while still partly opaque [est].
- Heaps wrap round the band too (±1.6 band widths along it, ±0.44 across), with no fade [src: stepsRing.js line 1589]; rare in a short film [est].

### 1.4 Lights and smoke that switch or strobe today

- **Windows** are on or off: a window is lit while its own phase in a period of 1.5 to 5.5 h of scene time is under the hour's share [src: paintKit.js lines 526–527]; framed windows go straight to 90% lamp color [src: paintKit.js lines 571–575]; the sides of turned buildings the same way [src: paintKit.js line 986]. In a one-hour film 20 to 60% of windows switch once, each in one frame [est].
- **The turned buildings' proofs** (a small drawing of each face read back for its shape and colors) are cached by the scene's hour and by the night in steps of a twentieth [src: paintKit.js lines 932 and 974]. Their wall, end and roof colors are medians of a few sample points that can land on lit windows [src: paintKit.js lines 961–965], so at an hour's turn a turned building's side walls may change color in one frame, all such buildings together [est, not measured]. The cache is also kept per worker and filled by whichever frame came first within a size step [src: paintKit.js lines 927–936], so two workers drawing alternate frames may hold slightly different proofs [est, not measured].
- **Far lights** (houses too small to draw, lamps, the lights between houses) come on one by one at dusk at full strength, each at its own threshold, and every half hour of scene time one in seven goes out for that half hour, in one frame [src: stepsRing.js lines 1295–1296].
- **Steady beacons:** the needle tower's, the glass tower's mast, the radio mast's and the turbine's red lights are steady, at half strength by day and full once night passes 0.2 [src: paintKit.js lines 761, 831, 1134 and 1184]; the relay beacon's orb and rings are steady [src: paintKit.js lines 1599–1602]; the lighthouse's beam points one way all night [src: paintKit.js lines 689–692].
- **Neon boards** step from a quarter to full light as night passes 0.2 [src: paintKit.js line 1903].
- **Nothing turns:** a turbine's blades and a windmill's sails are set once by the stream [src: paintKit.js lines 626 and 759].
- **Chimney smoke** is a train of puffs whose phase runs at 0.12 cycles a second of the motion clock; a new puff appears at the pot at full strength each cycle [src: paintKit.js lines 871–874]. In a time-lapse that is 0.3 of a cycle a frame (§1.1): the train strobes [est].
- **Rain** falls by the motion clock times 1.6 screen heights a second [src: stepsRing.js line 1782]: 4 screen heights a frame in a time-lapse, so its streaks are in effect re-dealt every frame [est].
- **Low mist** breathes on the raw scene time [src: stepsRing.js line 1774], over a whole band of the land; a fast film turns that into a shimmer of a large region (§1.1) [est].
- **Lightning** strikes in slots of 24 frames, each with an even chance, each strike playing over about 10.5 frames [src: stepsRing.js lines 1586–1587]. Two neighboring slots can strike 12 frames apart, 0.4 s at 30 fps and 0.2 s at 60, so "at most one a second" (AGENTS.md §11) holds at no frame rate [est]. Frame 0 itself cannot strike (the earlier slot's phase is past 1 there), but a strike can begin in the first two frames when its timing draw is small [est, from line 1587]. A still shows one bolt whole [src: stepsRing.js line 1585]. The light a strike gives is a glow in the heap and a small glow where it lands [src: stepsRing.js lines 1683 and 1689], never the scene.
- **Meteors** are drawn only in the one frame whose exposure holds their moment, in a real-time film too [src: stepsRing.js lines 310–317], though a real one glows for about a second (docs/prior-art/ringworld-time.md §5).
- **The comet** drifts 1.5° a scene day along its own way and turns with the far sky, 1.6° an hour [src: stepsRing.js lines 131 and 302; est for the degrees]: about 1.7° over the default hour's film, which reads as standing still [est]. Its tail is drawn at a random angle near the vertical, not away from the star [src: stepsRing.js lines 303–304].
- **The aurora** is one hue in curtains low over the horizon, rippling on the sway clock [src: stepsRing.js lines 321–330].

### 1.5 Variety today

- A style's buildings come from weighted archetypes [src: paintKit.js lines 499–504]; a wilds village from its region's tradition [src: paintKit.js lines 507–517]; each building takes one material from three to six per style, mixed 55% into the world's colors [src: paintKit.js lines 496–497 and 1057–1058]. The 36 kinds in the wider kit draw 31 per-building choices between them, fewer than one each [est, counted in paintKit.js lines 576–862]: a cottage's wall (cream or stone) and door color, a barn's red or gray boards and roof, a terrace's 3 to 5 houses each of six paints, a pagoda's 3 to 5 tiers, a castle's banner.
- What stands where: kinds by ground [src: stepsRing.js lines 672–683]; farmsteads by tradition [src: stepsRing.js lines 677–680]; farmsteads and hamlets are built only in the wilds and in magic [src: stepsRing.js line 859]; fields go round every village's heart in every world but neon, and round each wild farmstead [src: stepsRing.js lines 787–792, 957–958].

## 2. Clouds that build and drift

### 2.1 The real cumulus

- **Life:** shallow cumulus tracked by Doppler lidar and in simulations had a median life of 15 ± 2 min, a median greatest thickness of about 500 m and a greatest radius of about 240 m [src](https://www.romps.berkeley.edu/papers/pubdata/2019/lifecycle/19lifecycle.pdf).
- **Shape over life:** the cloud's top rises and sinks back while its base "undulates relatively little"; the base rises late in life, so the last remnants are aloft; the base's radius over the life "closely follows a sine curve", rising and falling about symmetrically; observed clouds "behave more like bubbles than plumes" [src](https://www.romps.berkeley.edu/papers/pubdata/2019/lifecycle/19lifecycle.pdf).
- **Many are brief:** in one simulated field "a little less than a third" of the clouds lived under 4 min; lifetimes are strongly skewed; 89% ended by "decaying away" and 8% by merging with another [src](https://acp.copernicus.org/articles/12/1101/2012/acp-12-1101-2012.pdf).
- **Small cumulus** "typically last 10 to 15 minutes"; a young cloud from a vigorous thermal looks "like cauliflower, with crisp top and side edges"; old clouds "often have frayed or wispy edges, as the cloud sinks and evaporates" [src](https://www.flowvis.org/Flow%20Vis%20Guide/clouds-4-clouds-in-unstable-atmosphere/).
- **How a tower climbs:** between a single rising thermal and a steady plume lies "an organized succession of rising thermals"; narrow clouds in dry air are single thermals, wide updrafts in moist air look like plumes [src](https://arm.gov/research/highlights/1020). The updraft speeds (about 1 m/s under fair-weather cumulus, 4 to 5 m/s under congestus) are in docs/prior-art/ringworld-sky.md §5.
- **Thermals show in the air too:** a hawk kettle of 20 to 100 birds circles in one thermal for minutes, then glides off; a thermal is "often topped by a cumulus" [src](https://whyevolutionistrue.com/2019/04/06/hawks-in-a-kettle/).

### 2.2 How games and tools move and grow clouds without popping

- **Horizon Zero Dawn's Nubis (2017):** movement is "an offset in the wind direction which is incremented in time"; clouds are skewed downwind with height (an offset of height fraction times the wind times 500); "the general shapes do not change, but the details do", because "the noise in the density model is animated, the coverage signal is not"; rising coverage makes clouds "inflate"; weather states change by a plain blend over "about 10-30 seconds" [src](https://advances.realtimerendering.com/s2017/Nubis%20-%20Authoring%20Realtime%20Volumetric%20Cloudscapes%20with%20the%20Decima%20Engine%20-%20Final%20.pdf).
- **Wind Waker** (docs/prior-art/ringworld-time.md §4): a cloud is moved to a new place only while invisible, and fades in and out at the dome's edges.
- **Flow maps (Valve, Portal 2):** a texture is offset along a flow vector "scaled by time"; the distortion "looks reasonable for the first 1/3", so two layers run "offset half a phase so we can hide the restart for each layer", and a noise texture breaks the visible pulsing that the shared restart leaves [src](https://www.advances.realtimerendering.com/s2010/Vlachos-Waterflow(SIGGRAPH%202010%20Advanced%20RealTime%20Rendering%20Course).pdf).
- **Advected textures (Neyret 2003):** layers of advected, "periodically regenerated" parameterizations, blended "based on the local accumulated deformation", for "flowing water, foam, lava, mud, flames, cloud layers" [src](https://diglib.eg.org/items/c4bf80cc-23f0-4107-958d-e03c0b9c8ac4/full).
- **Curl noise (Bridson and others, 2007):** a flow taken as the curl of a noise potential is "automatically divergence-free", so nothing gathers in sinks as plain noise does; it is animated "very simply by using time-varying noise"; boundaries are made by "modulating the potential down to zero"; it "can be cheaply and repeatably evaluated anywhere in space and time" [src](https://www.dneg.com/wp-content/uploads/2022/11/2007.pdf).

### 2.3 What that means for a painter with no memory [est]

- A cloud's place is a closed form of the clock: start plus wind times time, wrapped on a domain large enough that the wrap happens below the horizon, and faded out before it and in after it.
- A cloud's body is a fixed list of parts drawn the same way every frame; time and distance change only continuous weights (how big, how bright, how far grown), never how many parts there are or the order the stream deals them. This is ringworld-stability.md's "morph, don't switch", applied to time.
- Its growth and its drift need different clocks. Drift is capped by the eye (a cloud should not move more than a small part of its own width in a frame); growth by the story (a 15 min cumulus should live several seconds of film). At the drift cap of 0.7 s a frame, a 15 min cloud lives about 1,300 frames, 43 s of film at 30 fps; Ruby's "clouds building" needs it to live 5 to 10 s, a growth clock of about 3 to 6 s of scene a frame.

## 3. Smoke that follows the wind

- **How far it rises:** a buoyant plume bent over by the wind rises as the two-thirds power of the distance downwind and inversely with the wind's speed, Δh = 1.6 F^(1/3) x^(2/3) / u; "the reciprocal wind speed relationship ... is well established" [src](https://repository.library.noaa.gov/view/noaa/33598/noaa_33598_DS1.pdf). So in light air a chimney's smoke climbs steeply and in a strong wind it lies nearly flat, its curve the same shape at every wind [est].
- **Its form follows the air's stability** [src](https://ebooks.inflibnet.ac.in/esp08/chapter/9-plume-behaviour/):
  - looping, a wave that dips toward the ground, in strongly unstable sunny air;
  - coning, "most likely to occur during cloudy or windy periods";
  - fanning, spreading "out horizontally but do not mix vertically", "quite common" at night "with light winds and clear skies";
  - lofting, which "diffuses upward but not downwards";
  - fumigation, reaching the ground along its length on a sunny morning under an inversion, most likely with clear skies and light winds.
  These are a time of day and a weather the Ringworld already knows [est].
- **Particles with no memory:** a stateless particle system keeps no positions; each particle's place is "a closed form function" of its start values and the current time; it "can hardly react to a dynamic environment" [src](https://www.cin.ufpe.br/~sbm/CG/Artigo5.pdf). Smoke from a fixed chimney in a seeded wind needs no more [est].
- **Flipbooks and smooth slow playback:** game smoke is a flipbook of simulated frames, made smooth when played slowly by blending frames along stored motion vectors, at a cost in memory [src](https://realtimevfx.com/t/increasing-flipbook-based-effects-duration/27592).
- **Turbulence without sinks:** curl noise (§2.2), its strength rising up the column of smoke [src](https://www.dneg.com/wp-content/uploads/2022/11/2007.pdf).

## 4. Lights that live but never flicker

### 4.1 The limits

- **WCAG 2.3.1:** nothing may flash "more than three times in any one second period", unless the flashes are below the general and red thresholds; a general flash is "a pair of opposing changes in relative luminance of 10% or more of the maximum relative luminance (1.0)" where the darker image is below 0.80; the area limit is ".006 steradians" combined, "25% of any 10 degree visual field", estimated as "a 341 x 256 pixel rectangle anywhere on the displayed screen area when the content is viewed at 1024 x 768 pixels" [src](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html).
- **Broadcast guidance (the ITC note the UK regulator published):** a harmful flash is a change of 20 cd/m² or more where the darker image is below 160 cd/m², or any transition to or from a saturated red; a sequence is not permitted when the flashes cover more than a quarter of the screen and there are more than three in any second; "Isolated single, double, or triple flashes are acceptable", but "a sequence of flashing images lasting more than 5 seconds might constitute a risk" even within the limits; stripes are a risk with more than five light-dark pairs over 40% of the screen, or 25% when they move or reverse [src](https://www.ofcom.org.uk/__data/assets/pdf_file/0021/16248/gn_flash.pdf).
- **Platforms:** Playdate's Reduce Flashing is a system-wide flag that games read, turning an effect off or warning [src](https://help.play.date/accessibility/reduce-flashing/).
- **Ruby's rule is stricter than both:** no large region may brighten or darken suddenly and come back, not even for one frame; small lights may go on and off; lightning eased, local and soft, at most one a second (AGENTS.md §11). Ruby's new lightning note asks for the scene to be lit; §5.4 reconciles the two.

### 4.2 Lights on masts, towers and turbines

- **FAA:** the L-864 red obstruction light flashes at "30 FPM (+/- 3 FPM)", where it was formerly 20 to 40; the L-810 is a low-intensity red, steady [src](https://wirelessestimator.com/CI-app/index.php/faa_lighting/script_data) [src](https://flightlight.com/what-is-an-faa-l-864-obstruction-light/).
- **ICAO Annex 14** [src](https://www.flashtechnology.com/icao-annex-14-obstacle-lighting/):

| Type | Color | Signal | Flashes a minute |
|---|---|---|---|
| Low intensity A, B | red | steady | — |
| Low intensity C, D (vehicles) | yellow or blue | flashing | 60–90 |
| Medium intensity A | white | flashing | 20–60 |
| Medium intensity B | red | flashing | 20–60 |
| Medium intensity C | red | steady | — |
| High intensity A, B | white | flashing | 40–60 |

- **Wind farms:** lights can carry "GPS synchronization circuitry, so it can synch up with other lights of the same model in the vicinity" [src](https://www.windpowerengineering.com/?p=6061): a whole row of turbines blinks together [est].
- **Rotors:** a 100 m rotor turns once in about 4 s (15 rpm), a 10 m one in about 0.4 s [src](https://www.renewableenergyworld.com/?p=201591).

### 4.3 Lighthouse characters

- **Flashing (Fl):** under 50 a minute, 4 to 30 recommended; light under 2 s; the dark at least three times as long as the light [src](https://en.wikipedia.org/wiki/Light_characteristic).
- **Long flashing (LFl):** 2 to 5 s of light in a period of 8 to 20 s. **Quick (Q):** 50 to 79 a minute. **Very quick (VQ):** 80 to 159. **Occulting (Oc):** more light than dark. **Isophase (Iso):** equal. **Group (Fl(2)):** a group of flashes, then dark, the period at most 20 s for two-flash groups; written as "Fl(2) 10s" [src](https://en.wikipedia.org/wiki/Light_characteristic).
- For this app: Fl, LFl, Oc, Iso and slow groups are all under one cycle a second; Q and VQ would need their flash rounded to a pulse (§4.7) [est].

### 4.4 Windows going on and off

- **A patent for procedural window lights** lights rooms whose value from a 2D function passes a threshold that "may be dependent on a time of day", and avoids abrupt changes with a smoothstep as the threshold moves: "the transition ... resembles the effect of sliding the window curtains"; colors blend between two lamp colors and brightness is randomly modulated; a building index shifts the pattern so neighbors differ [src](https://patents.justia.com/patent/20170372512).
- **Cities: Skylines:** an illumination mask whose values from 128 to 255 make windows lit at random, "closer to the edges of that range are more likely to be lit and brighter", and a color mask where "diffuse map is multiplied by variable color" [src](https://wiki.biligame.com/csl/Asset_Editor).
- **The plain hash-and-threshold window shader** switches each window with a hard step and never animates [src](https://godotshaders.com/shader/basic-skyscraper-window-lights/): the counter-example.
- The hour-by-hour share of lit windows (a peak of 0.88 at 21:00, about 0.05 after 2:00) is in docs/prior-art/ringworld-time.md §6; photocells switching street lamps one by one, with a 10 to 15 s delay, in docs/prior-art/ringworld-countryside.md §6.

### 4.5 Neon and tubes

- **Colors by gas:** neon orange-red, argon blue-lavender, mercury blue, green and yellow, phosphors yellow and orange; flickering "may indicate a problem with gas pressures" or a failing transformer [src](https://en.wikipedia.org/wiki/Conservation_and_restoration_of_neon_objects).
- **Mercury tubes are slow to come up:** a sign maker reports old argon-mercury tubes "take a while" to reach their color, the mercury having "rested to the cold spot in the tube" [src](https://www.neonshop.com/neontech/index.cgi?read=17505); another asks whether a blue tube dim in freezing weather needs warming [src](https://www.neonshop.com/neontech/index.cgi?read=17734).
- **Fluorescent tubes with glow starters** take "several cycles" of about a second each to strike, and a dying one will "continuously blink on and off" [src](https://en.wikipedia.org/wiki/Glow_switch_starter): a striking tube is a few blinks, which here must become a few slow pulses.

### 4.6 Flames

Candles flicker at 10 to 12 Hz and fires puff at about 1.5 Hz for a meter-wide fire (docs/prior-art/ringworld-time.md §6). Those rates are fine only for lights a few pixels wide at small amplitude, and in a time-lapse a flame is better drawn steady at its mean brightness, as a long exposure would record it [est].

### 4.7 A safe envelope for this app [est]

| Rule | Value |
|---|---|
| Clock for any light's modulation | film seconds (frame over fps), never a scene clock capped per frame |
| Fastest pulse, any light | 1 cycle a second; 0.5 for anything wider than about 1% of the frame |
| Any switch on or off | eased over at least 1 s of film (a smoothstep), at least a few seconds for a window in a time-lapse |
| Brightness swing of a large region (over about 3% of the frame, a quarter of WCAG's 10° field on a 1024 × 768 screen) | under 0.03 in relative luminance, at under 0.2 Hz; a slow breath, not a pulse |
| A real flasher (beacon, lighthouse) | the real rate when it is 20 to 60 a minute, each flash a raised-cosine pulse of at least 0.4 s rise and 0.4 s fall; Q and VQ characters slowed to 40 a minute |
| Events (lightning, a tube striking) | at most one every 2.5 s, never in the first 1.5 s of a film (§5.4) |

## 5. The sky's other movers

### 5.1 The comet

- **Tails:** the ion tail is carried by the solar wind "straight out from the Sun" and "typically glows blue"; the dust tail is "a diffuse, curved tail that typically appears white or pink", its grains still following the comet's orbit [src](https://skyandtelescope.org/astronomy-resources/why-do-comets-have-tails/). The ion tail "always points directly away from the Sun"; the dust tail only "appears curved", grains shed at different points of the orbit lying along it [src](https://bigthink.com/starts-with-a-bang/why-does-comet-neowise-have-two-tails/).
- **Tails turn as the light moves:** between 17 and 25 July 2020 NEOWISE's blue ion tail "pointed in slightly different directions" as the sun's apparent place shifted [src](https://science.nasa.gov/image-article/apod-2020-august-12-the-shifting-tails-of-comet-neowise/). Its first tail was blue, the second golden dust, and its coma green [src](https://en.wikipedia.org/wiki/Comet_NEOWISE).
- **Speed:** a bright comet moves about 0.5 to 3° a day among the stars (docs/prior-art/ringworld-time.md §5, an estimate there); on the ring the far sky also turns 1.6° an hour [src: stepsRing.js line 131; est for the degrees]. So in a scene day a comet should move a few degrees on its own and about 38° with the sky; in the default hour's film, about 2° in all, which is subtle but must not be zero [est]. A rarer sungrazer close to the ring's star could move a degree or more an hour and swing its tail as it rounds the star [est].

### 5.2 Shooting stars

Most meteors glow for about a second (docs/prior-art/ringworld-time.md §5). In a real-time film a meteor should be drawn over its 0.3 to 1.5 s, its head traveling and its train fading behind; in a time-lapse, where a frame holds many seconds, today's whole streak in one frame is right, the shutter catching it [est].

### 5.3 Aurora

- **Colors by height:** green from atomic oxygen at 557.7 nm, 100 to 150 km up; red from oxygen at 630 nm, 200 to 300 km; purple-pink from ionized nitrogen at the lower edge, 90 to 100 km; blue, rare, 95 to 120 km [src](https://aurores.pulsar-si.com/en/learn/aurora/). So a curtain's hem is green to pink, its body green and its tops red, fading upward [est].
- **Forms and motion:** calm arcs are the commonest; rays and folds are "vertical animated columns"; coronas converge overhead; "a stable arc can suddenly break up and transform into moving rays within minutes" [src](https://aurores.pulsar-si.com/en/learn/aurora/).
- **Pulsating aurora is the part to avoid copying:** patches 10 to 200 km across pulse with periods of about 2 to 20 s, on-times of 0.2 to 0.5 s or 2 to 6 s, drifting at a few hundred m/s to a few km/s; more than half carry a modulation of about 3 Hz (most often 1.5 to 3.3 Hz) at up to 20% amplitude [src](https://eprints.soton.ac.uk/437950/1/ISSIbook_pulsating_and_diffuse_aurora_revise3_nohighlight.pdf). The slow 2 to 20 s pulsing is safe if eased; the 3 Hz must never be drawn [est].
- **How renderers build it:** Gaia Sky models aurorae as a volume round the planet, their footprints drawn as splines and "stretched in the vertical direction" by a vertical deposition profile, green low and red higher [src](https://tonisagrista.com/blog/2024/rendering-aurorae-nebulae/).
- **On a ringworld** [est]: no planet's oval, so an aurora needs the builders' fields: curtains hung along a rim wall's top, where a field leaving the wall's superconducting lattice would meet the thin air, their rays standing up the wall's length. A nod, on builders' and magic rings, as now.

### 5.4 Lightning that lights the scene, safely

- **The real thing must not be copied:** a ground flash is usually 3 or 4 strokes 40 to 60 ms apart, after a stepped leader of about 18 ms [src](https://faculty.luther.edu/~bernatzr/Courses/Sci123/Chapter12/lightningSequence.html): a 15 to 25 Hz flicker lasting a fifth of a second [est].
- **What the guidance allows:** isolated single flashes are acceptable [src](https://www.ofcom.org.uk/__data/assets/pdf_file/0021/16248/gn_flash.pdf); a change under 0.1 in relative luminance is not a flash at all [src](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html).
- **So Ruby's stark scene light fits under the threshold** [est]: a storm scene is dark, its mean relative luminance around 0.02 to 0.05 (an sRGB value of 40 to 60); lifting it by up to 0.08 takes it to 0.10 to 0.13 (sRGB 90 to 100), more than twice as bright to the eye, and still not a general flash. The starkness comes less from added light than from its direction: every facet and thing lit hard from the bolt's side, shadows thrown away from it, colors pushed toward a cool white, the side away from the bolt left dark.
- **The envelope:** see §8, item 7.

## 6. A greater sense of scale, by layering

- **Painters' tools** [src](https://www.creativebloq.com/how-to/achieve-scale-in-your-paintings):
  - "Placing a human figure into a scene is an easy way to help convey scale";
  - "A viewer can piece together the scale mentally once the same object is used twice at different sizes";
  - "Atmosphere through dust, pollution and smoke lifts the value of shadows as they recede";
  - distant detail is kept "confined to the lit areas";
  - distant textures loose, edges soft, the palette neutral;
  - a low viewpoint for height.
- **Three planes:** foreground, middle ground and background give scale; a small foreground figure makes a middle-ground thing read as huge; "distant object are lower contrast, less saturated, less detailed" and take the sky's color [src](https://ctrlpaint.com/blog/are-you-remembering-fmb).
- **Aerial perspective:** loss of contrast is a more reliable sign of distance through air than any one shift of color; the far scene has a "narrower tonal range"; bluing is a convention, not a law, and haze or a low sun can push the far colors elsewhere; at the end of the scale the form disappears (Leonardo's perspective of disappearance) [src](https://perspectiveresearchcentre.com/aerial-perspective/).
- **Halo's ring:** its first art director wants it "massive, dark, mysterious, sinister, but also full of wonder", set against the Milky Way, and calls a remake's ring "out of scale" partly because it looks like "shiny metal that looks like it was built a few years ago" [src](https://www.videogameschronicle.com/news/out-of-scale-no-mystery-damn-ugly-halos-original-art-director-shares-his-thoughts-on-campaign-evolveds-architecture/). Age and wear are scale cues [est].
- **Niven's numbers:** "Walls 1000 miles tall along the edges retain the atmosphere"; it spins at 770 miles a second, with a 30 h day [src](https://larryniven.fandom.com/wiki/Ringworld); about a million miles wide [src](https://en.wikipedia.org/wiki/Ringworld). Against an air whose density halves every few kilometers, a wall a thousand miles high stands almost wholly in vacuum: hazed and soft at its foot, crisp, dark and sunlit high up [est].
- **What the Ringworld already layers** [src: docs/surfaces.md, Ringworld entry]: haze by distance, far land drawn up to 3.2 times taller, the arch's floor hazed low and clear overhead, mist between ridges. What it lacks is listed in §8, item 18 [est].

## 7. Variety: buildings, colors, and what goes where

### 7.1 Cheap variety in buildings

- CGA, split and repeat rules, mass models and WFC are in docs/prior-art/painted-ringworld.md §5.6. What matters here: each rule can carry a probability ("The rule is selected with probability prob"), and variety comes from "a combination of random numbers and stochastic rule selection" [src](https://course.ccs.neu.edu/cs5150f13/readings/muller_buildings.pdf).
- **Kit-bashing (Skyrim):** seven kits built over 400 dungeon interiors; "Art fatigue sets in where this repetition becomes obvious"; and "players were quicker to react negatively to repeated detail elements, as opposed to broad architectural repetition" [src](https://gamedeveloper.com/design/skyrim-s-modular-approach-to-level-design). So the cheapest variety goes into the small things on a building (chimneys, porches, signs, plants), not its body [est].
- **Per-instance color by mask:** Cities: Skylines multiplies the painted color by a variable color only where a mask is white (§4.4) [src](https://wiki.biligame.com/csl/Asset_Editor): trim and shutters can vary while stone stays stone [est].

### 7.2 Real palettes, each from one rule

- **Falu red (Sweden):** a pigment from the Falun copper mines' by-products since the 16th century; iron-rich, it "protected wooden facades", and its color "resembled the brick facades of European aristocratic homes"; first for landowners and churches, common by the mid-19th century; red walls with white details [src](https://visitsweden.com/about-sweden/swedish-red-houses).
- **Burano:** households need the municipality's approval to repaint and must use the palette assigned to their street; orange, green, blue and lilac fronts [src](https://ccmagazine.es/en/?p=96512). A palette per street, a slot per house [est].
- **Jaipur:** painted pink around 1876 for the Prince of Wales's visit; the color "geru, or terracotta pink", nearer "a light maroon"; an 1877 law made any other color in the old city illegal; before, white or "sallow yellow" [src](https://mentalfloss.com/article/542269/why-jaipurs-king-painted-his-city-pink-impress-prince-wales).
- **The Cyclades:** stone houses whitewashed with lime to reflect the heat; a 1938 order to whitewash during cholera; blue from cheap boat paint and the cleaning powder loulaki; a 1974 law requiring blue and white [src](https://greekreporter.com/2022/03/21/why-greek-island-houses-blue-white/).
- **Kyoto's machiya:** frontages of about 5.4 to 6 m and 20 m deep, one or two stories, lattices "frequently painted in bengara", a red ochre, in the geisha quarters, baked tile roofs [src](https://en.wikipedia.org/wiki/Machiya); "neatly aligned dark-gray kawara tiles", small lattice windows in earthen upper walls, arched bamboo fences at the foot, lattice styles by trade [src](https://www.nippon.com/en/guide-to-japan/gu900011/recognizing-design-features-in-kyoto%E2%80%99s-machiya-townhouses.html).
- **Suggested starting values for the seed's palettes** [est, to be matched by eye against photographs before use]:

| Palette | Walls | Trim and doors | Roof | Where |
|---|---|---|---|---|
| Falu | 128, 38, 30 (red), now and then 196, 150, 70 (ochre) | 236, 232, 222 | 70, 74, 80 slate or turf | north, shire |
| Cycladic | 242, 240, 234 | 40, 90, 160 | flat white or 70, 110, 170 domes | apulia, dry coasts |
| Burano | per street: 226, 120, 56 · 70, 140, 96 · 60, 110, 170 · 170, 140, 196 · 230, 196, 80 | 236, 232, 222 | 170, 90, 60 | cities by water |
| Jaipur | 200, 110, 96 | 240, 230, 210 line-work | flat | a dry city |
| Terracotta south | 214, 180, 132 · 196, 150, 100 | 90, 110, 80 shutters | 176, 92, 60 | warm country, cities |
| Machiya | 70, 52, 40 wood, 150, 60, 44 bengara | 220, 210, 190 earth | 74, 78, 86 | kyo |
| Prairie | 236, 232, 222 clapboard | 40, 40, 44 | 120, 120, 124 tin | prairie |

### 7.3 Where things gather

- **Village forms:** the Haufendorf, an irregular cluster; the Straßendorf and Zeilendorf along one road or line; the Angerdorf round a green; the Platzdorf round a square; the Rundling, compact and round [src](https://austria-forum.org/af/AEIOU/Dorf). A nucleated village clusters "around a central church, which is perhaps close to the village green", in a field system of large open fields [src](https://en.wikipedia.org/wiki/Nucleated_village).
- **Central places:** places of the same order are spaced equally, larger ones farther apart; a central place sits "at the center of a hexagon, containing six lower-order settlements", each larger place having on average 3 of the next size down (the marketing principle), 4 by transport, 7 by administration [src](https://www.geog.leeds.ac.uk/people/a.turner/projects/medalus3/cpt.htm); range is "the maximum distance consumers will travel", threshold "the smallest market area necessary" [src](https://www.britannica.com/print/article/102569).
- **Demands as placing rules:** Dorfromantik's quests read "the deer wants to live in a forest with at least X trees" [src](https://www.gamedeveloper.com/disciplines/sparking-joy-through-tile-placement-in-idyllic-village-builder-i-dorfromantik-i-); Islanders scores a building by what lies within its own radius, a circus gaining near houses and losing near mansions [src](https://en.wikipedia.org/wiki/Islanders_(video_game)).

### 7.4 What wild land holds (Ruby's note on the wilds)

- **Sacred groves:** woods "for the most part, untouched by local people"; the Celtic nemeton, sometimes a square enclosed by ditch and palisade; Baltic "sacred groves and springs"; about 14,000 reported in India and perhaps 100,000; Shinto shrine forests; groves as "islands of biodiversity" among croplands, or Finnish sites "on the top of stony mountains or hills and are often close to water"; the largest Estonian ones up to 100 ha; shrines, sculptures, uncut trees and springs inside [src](https://en.wikipedia.org/wiki/Sacred_grove).
- **Holy wells hung with rags:** a spring with a tree beside it, strips of cloth tied to its branches, in Scotland, Ireland, Man and Cornwall [src](https://en.wikipedia.org/wiki/Clootie_well).
- **Stone rows:** lines of standing stones from a few meters to several kilometers long, the stones about 1 m tall (to 2 m), the largest often at the ends, burial cairns at the terminals, found in isolated moorland [src](https://en.wikipedia.org/wiki/Stone_row). Carnac's measurements are in docs/prior-art/ringworld-sprites.md Part C §2.
- **A hermitage:** Skellig Michael's monks lived in six dry-stone, corbelled beehive cells with two oratories on a terrace over 183 m up, reached by 618 steps, with a hermitage on ledges near the south peak [src](https://www.britannica.com/place/Skellig-Michael).
- **Beaver country:** dams from a few meters to about 100 m long (the largest known 775 m); the pond floods round the lodge; abandoned, the dam breaches, the silt grows grass, aspens and willows come in, and beavers often return [src](https://en.wikipedia.org/wiki/Beaver_dam).
- **Game trails:** paths worn by "human or animal traffic", the "shortest or the most easily navigated route" [src](https://en.wikipedia.org/wiki/Desire_path).
- **Charcoal hearths:** round platforms 5 to 20 m across (8 to 12 m on slopes), up to 30 cm high in a shallow ditch, almost all on gentle ground in pine forest, up to thousands in 25 km² [src](https://essd.copernicus.org/articles/18/493/2026/).
- **Hawks in a kettle** circling in a thermal under a cumulus (§2.1) [src](https://whyevolutionistrue.com/2019/04/06/hawks-in-a-kettle/).

## 8. What we take [est]

Built in Ursa Major–Phecda: items 1 to 7 (the drift's seam closed, the cirrus by the wind, the film's own clock for
lights, lights easing, the smoke's plume, heaps keeping their billows and building on a growth clock, lightning that
lights the land within a measured limit), and fast movers drawn faint. The rest are still to come.

Ordered by what it does for the picture over what it costs. Each says what changes, where, how a film stays stateless and calm (the scene clock or film seconds only, nothing switched faster than an ease of at least 1 s, no large region changing quickly), and what a still shows. Any visible change goes to Ruby as tools/compare.mjs or tools/review.mjs sheets first (AGENTS.md §1 rule 1).

1. **Close the drift's seam** (rgPaintArch's drift, the cirrus and the low bands). Keep each cloud's starting direction, but carry it on a circle far larger than its start, so that the chord's ends lie a few degrees above the horizon (for cirrus at 9 km, 2.5° up is about 200 km out) and the start lies inside the chord, not at its end; fade the cloud out over the last tenth of the chord and in over the first. Stateless: the position stays start plus wind times the cloud clock, wrapped. Still: unchanged, since at time 0 every cloud is where it was; a film's first frame then equals the still. Cost: a few lines.
2. **Cirrus carried by the wind, in perspective** (the cirrus loop). Scale each streak by the drift's nearness value, which the code already returns, and turn it to the wind's direction as seen at its place (project a short step downwind and take the screen angle), with a few degrees of the seed's spread. Stateless and continuous. Still: streaks a little larger overhead, and combed along one way of the sky instead of all near level.
3. **A film-seconds clock for lights** (the scene time handed from uiMoving.js through canvasRenderer.js's setSceneTime to the camera). Carry the frame rate, or the frame's length in film seconds, unrounded; every pulse, flicker, beacon, sweep and turn reads it; the sway, motion, cloud and water clocks stay for things that move through the world. Then the rates in the table of §1.1 stop depending on fps: wall-top lights, far-light flicker and ruin fires at 0.2 to 0.5 Hz, nothing over 1 Hz. Still: unchanged.
4. **Lights fade instead of switching** (pkLit, pkFrame, pkWindows, pkTurned's windows, nightDot, neon boards). pkLit returns a level from 0 to 1, a smoothstep of its phase against the share with a soft band, as the patent's curtains slide (§4.4), so a window takes a few seconds of film to light; the same for nightDot's dusk thresholds and its half-hour outages (an ease over about a minute of scene time in a real-time film, several frames in a time-lapse); neon warms over about a second of film, an argon-mercury blue tube over several, now and then a tube striking in two or three slow pulses. Keep turned buildings' proofs free of the clock (read them with every window dark) so no wall changes color at the hour. Stateless: each level is a function of the scene time and the window's own number. Still: identical where a window was fully on or off; a few windows in their band show half lit.
5. **Smoke as a stateless puff train on the wind** (pkSmoke, the cottage's and factory's chimneys, the wreck's and the crater's smoke in rgWork). Puff k was born at its own emission time; its age is the smoke clock minus that; its place is the pot plus the wind's lean times its age plus a rise of age to the two-thirds over the wind's speed (§3), plus a gentle curl-noise wobble by age and k; its radius grows with age, its strength eases in from 0 at birth and out by its end, so nothing ever pops. Give smoke its own clock with a cap of about a quarter of a second a frame, so a puff moves at most a tenth of the puff spacing a frame; in a time-lapse, draw the plume as the long exposure would (puffs spaced closer than their size, the train a continuous ribbon). Choose the plume's form by the hour and weather: fanning flat at night in clear calm air, looping by day in sun, coning when overcast or windy. Light: the lit side toward the sun, the plume's color the sky's at its height. Still: a plume shaped by the wind and the hour instead of a straight line of discs.
6. **Heaps keep their billows** (paintHeap). Deal a fixed list of billows per heap (the most it can ever show, 64), in growth order, once; the base row a fixed share of that list; size and distance change only each billow's weight (its size times a smoothstep of the heap's growth against its place in the order, and a fade for those too small on the page), never the list; the fringe wisps indexed into the fixed list. Draw a heap too large for its sheet at a lower resolution instead of dropping it. Stateless and continuous. Still: a heap draws much as now, with its billows dealt from the full list.
7. **Lightning, stark and safe** (rgPaintLand's lightning and the light it gives). The envelope:
   - no strike begins in a film's first 1.5 s or its last 0.5 s (so a looping film never opens or closes on one), and a still keeps its one whole bolt;
   - at most one strike every 2.5 s of film, set by film seconds, at any frame rate;
   - each strike: the leader creeping down over 0.2 s; the scene's light rising over at least 0.15 s (5 frames at 30 fps), held at most 0.1 s, fading over at least 0.6 s; never two peaks within one strike;
   - the whole scene's lift under 0.08 in relative luminance (mean over any tenth of the frame), so it is not a flash by WCAG's measure; the bolt and its heap may be brighter, being small;
   - the stark look made by direction: a second light from the bolt's place (as the sun's side is set for facets and things), hard shadows away from it, the lit side pushed to a cool white, the far side left dark.
   A small offline check over a rendered film (mean luminance per region per frame, flashes counted per second) would prove it. Stateless: each strike's moment is a function of its slot's own stream. Still: one bolt, the scene lit from it.
8. **The comet moves and points away from the star** (the comet in rgPaintArch). Its head moves along its own great circle a few degrees a scene day (rarer: a sungrazer a degree an hour), on top of the far sky's turn; its ion tail runs straight away from the star (the direction on the sky away from the star's direction, projected through a point a little along it), blue, thin; a dust tail wider, white to golden, curved back along its path; a faint green coma. Stateless: the head's place and the tails' directions are functions of the scene time. Still: the tail away from the star, two tails where it is large.
9. **Meteors live their second** (the meteors in rgPaintArch). In a real-time film each meteor spans its 0.3 to 1.5 s: its head traveling from A to B, its streak growing behind it and fading, a faint train lingering a second; in a time-lapse, the whole streak in the one frame, as now. Stateless: each meteor's moment and duration come from its own stream. Still: as now.
10. **Aurora with height and drift** (the aurora in rgPaintArch). A green body with a pink-violet hem (on a strong night) and red tops fading upward; rays as fine vertical striations; folds drifting along the arc at a few degrees a minute of scene time; a slow breathing of at most 15% over 6 s or more of film; now and then a brightening over 20 s of film, as a breakup; never the 3 Hz pulsing. On builders' rings, a curtain may hang along a rim wall's top instead. Still: colors by height, rays.
11. **Beacons, lighthouses and glowing works that breathe** (paintKit's needle, glass mast, radio mast, turbine, relay beacon and lighthouse; rgWork's pillars, circles and crystals; the pylon's edge light, the wizard tower's windows). Red mast lights pulse at 20 to 30 a minute in film seconds, each a raised-cosine pulse (0.4 s up, 0.4 s down), a tower's lights in step and a row of turbines in step (§4.2); a lighthouse takes a character by the seed (Fl 5s, Fl(2) 10s, Fl(3) 15s, LFl 10s, Oc 6s, Iso 4s), its beam a soft wedge sweeping round at the character's rate, its lantern glowing up only as the beam faces the camera, eased; glows on spires, pillars of light and crystals breathe by at most 10 to 15% over 6 to 12 s of film, each with its own phase; a soft bright spot climbs a pylon's light line once every 4 to 8 s. All small but the lighthouse's lantern, which stays a glow at most a few percent of the frame. Still: each at its mean brightness, the lighthouse's beam at the stream's angle.
12. **Turbines and windmills turn** (paintKit's turbine and windmill). Blades by film seconds at their real rate (15 rpm for a large rotor, slower for a mill's sails, by the wind's speed); where a time-lapse would turn a three-bladed rotor more than about a twelfth of a turn a frame, draw it as a faint disc of blur with the blades ghosted, as a long exposure records a fan. Still: as now.
13. **Rain and mist on the right clocks** (rgPaintLand). Mist's breathing on the clouds' clock; rain's fall capped to about half a streak's length a frame, so the curtain slides instead of re-dealing, and in a time-lapse the curtain under a heap drawn as a veil that sways. Still: unchanged.
14. **Clouds that build** (paintHeap and the heaps' placing). On top of item 6: a growth clock separate from the drift (about 3 to 6 s of scene a frame, so a 15 min cumulus lives 5 to 10 s of film, §2.3); a heap's life as the measured curve, its size rising and falling as a sine with its base nearly still and rising late; its growth made of turrets, each a group of billows rising from the top at 1 to 3 m/s of scene time, swelling, then flattening and fraying at the edges as it ages; crisp cauliflower edges young, frayed edges old (§2.1); in clouds weather by day a few heaps grow to congestus, in storm weather one to an anvil; under the strongest growing heap now and then a kettle of hawks circling. Stateless: every turret's birth is a function of the heap's own stream and the growth clock, every weight continuous. Still: each heap at its stage, some young and crisp, some old and frayed.
15. **Small variations on the kinds already drawn** (PK_BUILT, pkBuilding; each new feature keyed to a stream of its own from pkSub, so nothing else on a building changes when it is added, and drawn only where the building is large enough, as the kit already does):

| Kind | What could vary, cheaply |
|---|---|
| cottage | wall: limewash, stone, Falu red with white corners, ochre; roof: thatch, slate, stone slab, turf; chimney at one end, both or the middle; a porch or a hood; shutters by palette; a lean-to; window boxes; a water butt |
| barn | roof: gambrel, plain gable, a monitor; boards red, gray, white; a lean-to; a hay hood or not; a ventilator cupola or two |
| aframe | wood light or dark; a deck or none; a stovepipe with smoke; solar panels on one slope |
| row | chimney pot counts; dormers; area railings; one house painted from the street's palette |
| brick, slab, glass, deco | rooftop water tanks, plant rooms, aerials, dishes, a roof garden, a billboard frame; balconies with plants; awnings by palette; air-conditioning boxes on the near face |
| chapel, cathedral | a spire or a tower; a copper roof gone green; a clock |
| mosque, onion, dome | dome color from the town's palette; one, two or four minarets |
| pagoda, torii | roof color; vermilion, black or stone |
| lighthouse | bands red, black or white, or a spiral daymark; its character (item 11) |
| windmill | sails spread, half or furled by the wind; cap color |
| silo, watertower, elevator | a town's name painted; a color band |
| gasstation, motel | fascia color by a seeded brand; the sign's shape |
| machiya | bengara lattice or bare wood; shop curtain color; a bamboo fence |
| yurt, rondavel, trullo, pueblo | door color; band patterns; ladders and beam ends |
| factory | how many chimneys smoke; a tank or none |
| megablock, capsule | colored pods or panels by palette; window fields lit in rooms, not at random |
| pylon, arch, wizard, observatory | glow hue offset by a few degrees each; the observatory's slit open at night |

16. **Seeded colors** (PK_MATS by region instead of by style alone, colsOf's materials). The seed chooses, per region of the world, a palette family (§7.2) by its tradition and climate, a roof material and the region's stone (granite gray, honey limestone, red sandstone, dark basalt, chalk white), so walls, plinths, field walls and castles agree; a town chooses a palette per street (Burano's rule) and each house a slot; inside a slot, the per-instance jitter of docs/prior-art/ringworld-sprites.md §2.9. Violet stays an accent, never a ground (AGENTS.md §11). Still: towns that look like one place each, and different on another seed.
17. **Spawning rules** (rgStore, its seats, fields and sow calls; RG_PLACE, RG_FARM, RG_PROF):
   - **Farms only where people are many:** farmsteads, hamlets and their fields only in cities' and builders' worlds, round their towns in von Thünen's rings (docs/prior-art/ringworld-countryside.md §1), never in the wilds; the wilds' villages stay small and few.
   - **The wilds' places instead,** each sown sparsely in coarse cells, as the seats are now, each on the ground it belongs on:

| Place | Where | What it holds | Spacing |
|---|---|---|---|
| Sacred grove | a forest island on a stony rise, near water, or a ring of great trees in open country | a great oak or ash at the middle, a stone or a small shrine, a ring of lesser trees, a spring; in magic, faint lights | 2 to 5 km |
| Holy well | a hollow at a forest's edge, by a spring | one tree hung with strips of cloth in the page's colors, a low stone curb | 1 to 3 km |
| Stone row | open moor in cold or dry country, gentle slope | 6 to 30 stones of about 1 m, the largest at the ends, a cairn at one end, a circle at the other now and then | 3 to 6 km |
| Hermitage | the highest steep crag or headland in view | 1 to 6 beehive cells and a tiny oratory on a terrace, a stair or path up | one per region |
| Beaver pond | a low, wet hollow in forest | a dam 10 to 100 m across, a pond with standing dead trees, a lodge; an old one a meadow with young aspens | where wet |
| Game trails | from forest to the nearest water | narrow worn lines walked by the ways' own walker, following the contours | 1 to 3 per forest |
| Charcoal hearths | pine forest on gentle slopes | 3 to 12 round platforms of 8 to 15 m, one now and then smoking with its stack | clusters |
| Wild camp | beside a trail near water | a tent or a lean-to, a fire glowing at night, smoke at dusk | sparse |
| Ruin of the old ones | anywhere in forest or moor | a broken arch, a column, a wall's corner, overgrown | 3 to 8 km |
| Lookout | a summit | a timber tower, a lit window at night | one per range |

   - **Near this, away from its own kind,** as Islanders and Dorfromantik score (§7.3): a holy well near a grove, a camp near a trail and water, hearths near pine, each a few kilometers from another of its kind.
   - **Towns by central places:** the larger towns spaced evenly and farther apart, each with about three smaller ones round it (k = 3) [src](https://www.geog.leeds.ac.uk/people/a.turner/projects/medalus3/cpt.htm), and a village's form chosen by its seed from the forms of §7.3: round a green with its well, along its one road, round a square, a loose cluster.
   Still: a different, emptier and wilder country in the wilds; denser farmland round cities.
18. **Scale by layering** (Ruby's note; small changes to the order and the haze in rgPaintArch and rgPaintLand):
   - **The walls rise out of the air:** haze along a wall's height, thick at its foot, thinning to nothing within its lowest few percent, so the wall above is crisp, darker and sunlit against space;
   - **Weather on the far arch:** the arch's own cloud streaks given their shadows on the arch's floor, offset by the sun, so a weather system is seen from above, far away;
   - **A cloud deck below the far horizon** on some rings: a pale level layer the far ridges stand out of;
   - **Known sizes repeated smaller:** rows of poles, pylons or turbines running back from near to far along a way or a ridge;
   - **Three planes:** the nearest ridges full contrast, the middle ones a step lighter, the far ones lighter still, narrowing the tonal range and lifting the shadows rather than only bluing;
   - **The megastructure old:** stains, repairs and seams on the walls and the arch at every scale;
   - **Tiny moving things against huge ones:** a ship's light crawling along the wall's top in film seconds.
   Each is a still change for Ruby's sheets, with no motion beyond the slow ones above.
19. **New kinds by world (the larger library):**
   - **Wilds:** a shieling hut, a bothy, a beehive cell, a lookout tower, a woodcutter's camp, a charcoal stack, a raised hunting hide, a beaver lodge, stepping stones at a ford, a rope bridge, a holy-well tree.
   - **Cities:** a market hall, a bandstand on the green, a fountain, a tram stop and line, a mural wall, laundry lines between houses, allotment gardens at the edge.
   - **Neon:** stacked sign towers, a lit footbridge, a monorail on pylons, rooftop advertising frames, a street-food cluster.
   - **Builders:** a field of sun-tracking mirrors, a maglev line, tall steam stacks venting (smoke, item 5), a sealed vault door in a hill, a docking cradle.
   - **Ruins:** a fallen overpass, a rusted gantry crane, scrap shanties with chimney smoke where survivors live, a toppled water tower, a fire in a barrel at night.
   - **Magic:** floating stones orbiting slowly (by film seconds, at a turn a minute), lantern trees, a stair to nowhere, runestones whose glyphs light one by one over several seconds.
   Each kind gets its size in PK_SIZE, its place in the tables, its own streams, and its sheets.

## 9. What this app can do that the others don't [est]

- Its films are drawn offline from a clock, so every motion can be an exact function of time: a cloud can fade before its seam and a light can ease for exactly a second, which a game running on frame deltas can only approximate.
- It can carry Ruby's photosensitivity rule as arithmetic: rates in film seconds and ceilings on luminance change, checkable on every film.
- Its seed already picks a world, a tradition and a region; adding palettes and wild places lets one seed give a whole recognizable country.

## Gaps

- Not read: Nubis Evolved (2022) and Nubis Cubed (2023), the slides that would say how Horizon Forbidden West's clouds evolve and how it hides fast-moving clouds' artifacts (one site error, one link not approved); Red Dead Redemption 2's atmosphere talk (video only); the Xbox photosensitivity guideline's own page; Shamus Young's procedural city windows (a redirect loop); a Briggs plume-rise page (refused by the reader; the NOAA paper stood in).
- Not found: Christaller's distances between orders of place in kilometers; any source on how Ghibli or other painted animation grows cumulus; a measured warm-up time for neon or argon-mercury tubes; a source on lighthouse beams' sweep speeds.
- Not researched here: SimCity's building variants, Banished's placing, Bad North's tile rules.
- Unconfirmed in this repository: that turned buildings change color at the hour, and that two workers' proofs differ (§1.4), both read from the code, not measured; the heaps' re-deal rate (§1.3) is reasoned from the code's numbers, not counted on a render; the flicker rates of §1.1 are computed, not measured from films; the cirrus measurement is a copy of the code's formula run alone, not a render.
- The palette RGB values of §7.2 are starting guesses to be matched against photographs, not measurements.
