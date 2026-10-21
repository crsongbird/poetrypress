# Prior art: dramatic skies and the air over the Ringworld

Key: **[src](URL)** = opened and read for this doc. **[est]** = my own estimate, inference or arithmetic. Researched 2026-10-21 by searching and opening each source, for the artist's notes "More atmospheric effects" and "Slightly more dramatic skies" (and, earlier, clouds that were comical: slower, billowing, gathering, clean transitions, Wind Waker as a model). What could not be opened or confirmed is under **Gaps**. Sun path, twilight bands, cloud heights and Niven's numbers are in ringworld-time.md; the painted land is in painted-ringworld.md and painted-ringworld-2.md.

## Summary

- **Drama is value structure, not saturation.** Painters ask for one big dark mass against light, lights "more powerful and piercing when surrounded by a sea of black", and the strongest light and chroma kept to a few places [src](https://www.artistsnetwork.com/art-mediums/oil-painting/accentuate-bright-light-compress-your-value-scale/amp) [src](https://www.outdoorpainter.com/?p=18108). Constable called the sky "the key note, the standard of scale, and the chief organ of sentiment" [src](https://drrichardstemp.com/2020/05/04/day-47-salisbury-cathedral/).
- **Cloud shadows are the biggest missing atmosphere cue, and they are dark and sharp.** Under cumulus the ground gets about 20% of clear-sky sunlight, with edges only 40–60 m wide; cumulus drift at 4.5 ± 1 m/s [src](https://arxiv.org/pdf/2307.06980). In paint that is about half the lit value [est].
- **At 48 s per frame, real clouds are too fast for a film.** At 24 fps that is 1,152 s of world per film second, so a half-hour cumulus [src](https://frontdeskapparatus.com/wp-content/uploads/2023/03/ThornesJ-ConstablesClouds-1979.pdf) lives about 1.6 s on screen and boils. A cloud clock near 1/5 of world time matches a 10 s time-lapse interval [est].
- **Twilight has precise bands.** The Belt of Venus sits 10–20° up [src](https://en.wikipedia.org/wiki/Belt_of_Venus), brightest at sun −2° and gone about 25 min after sunset [src](https://skyandtelescope.org/astronomy-news/observing-news/earths-shadow-07292014/). The purple light runs from sun −2° to −6°, peaking at −4° [src](https://glossary.ametsoc.org/wiki/Purple_light).
- **A true Ringworld night is not dark.** The lit arch would give about 100 lux, as much light as a very dark overcast day, and a shadow square takes about 2 h to cover the sun, which never reddens [est, §12].

## 1. The clear sky: gradient, sun glow, horizon

- **Firewatch** builds its sky from four added layers: a three-colour gradient (top, half, bottom), a sun disc (colour, size, falloff), a sun halo ("halo/haze/atmospheric scattering") and a separate horizon halo. Physical parameters were rejected as "just not intuitive"; the key concepts are "color" and "tone" [src](https://blog.camposanto.com/post/112703721804/this-blog-post-is-an-in-detail-explanation-of-a). Outdoors "the biggest chunk of colour is actually determined by the sky", and "Sometimes it takes up half of the screen" [src](https://www.thumbsticks.com/gdc-2015-the-art-of-firewatch).
- **Hillaire (2020), the visual takeaways.** The Mie lobe is "a soft blob around the sun" (default g = 0.8). The horizon is where the sky changes fastest, because "the atmosphere quickly gets denser there". Aerial perspective tints terrain, mountains and buildings. Multiple scattering avoids "a yellow-ish atmosphere look". Away from the horizon the sky is "of low visual frequency" [src](https://diglib7.eg.org/bitstream/handle/10.1111/cgf14050/v39i4pp013-022.pdf) [src](https://blog.selfshadow.com/publications/s2020-shading-course/hillaire/s2020_pbs_hillaire_slides.pdf).
- **Halo falloff for g = 0.8** (Henyey–Greenstein): relative to the peak it is 0.49 at 10° from the sun, 0.16 at 20°, 0.022 at 45° and 0.004 at 90° [est, computed]. A canvas radial gradient with those stops is the physical glow.
- **Where the sky is darkest.** "There appears a darker band of blue in the sky 90 degrees away from the sun". Mie glare sits by the sun, and the horizon is white or pale blue [src](https://personal.math.ubc.ca/~cass/courses/m309/sky-colours.pdf). At noon the sky is "the deepest blue"; darkening the top acts as a vignette [src](https://tips.clip-studio.com/en-us/articles/10375).
- **A stylized sky shader's numbers** (Godot): day top 0.1, 0.6, 1.0 over bottom 0.4, 0.8, 1.0. The sunset tint starts when the sun is below 30° (0.5 − |sun.y|), is strongest toward the sun, and the disc grows 25% at the horizon. Cloud colours run top 1.0, middle 0.92/0.92/0.98, bottom 0.83/0.83/0.94: bases darker and bluer [src](https://godotshaders.com/shader/stylized-sky-with-procedural-sun-and-moon/).

## 2. Twilight: the shadow, the belt, the purple light

- **Earth's shadow and the Belt of Venus.** A pink arch 10–20° above the antisolar horizon, with a yellowish-orange band below it; it is more vivid in winter [src](https://en.wikipedia.org/wiki/Belt_of_Venus). The dark band is air that the Earth keeps out of sunlight, and the edge glows pink [src](https://old.atoptics.co.uk/fz680.htm).
- **Its timing** [src](https://skyandtelescope.org/astronomy-news/observing-news/earths-shadow-07292014/):
  - At sun −2° (about 8–10 min after sunset) the edge is sharpest and the belt "brightest and most colorful".
  - By −5° the shadow is higher and diffuse. By about 25 min it "blends into the deepening blue of twilight".
  - The shadow is purple-grey or blue-grey and rises as the sun sinks ("a teeter-totter").
- **Purple light:** from sun −2° to −6°, peaking at −4°, over the solar sky; 40–80° wide in azimuth, 10–15° tall, sinking toward the sun [src](https://glossary.ametsoc.org/wiki/Purple_light). At −7° the **bright segment** replaces it: 20–30° wide and a few degrees tall, lasting to −18° [src](https://glossary.ametsoc.org/wiki/Bright_segment).
- **The twilight arch:** a yellow band along the horizon up to 90° either side of the sun. The overhead sky stays deep blue, high clouds stay sunlit and then redden, and the end is a deep red horizon with purple and pink above [src](https://www.atoptics.co.uk/fza176.htm).
- **Why the zenith stays blue:** ozone's Chappuis band (400–650 nm, peaks at 575 and 603 nm) absorbs the yellows. Without it, models wrongly turned the dusk zenith yellow [src](https://en.wikipedia.org/wiki/Chappuis_absorption). The sky also doesn't step yellow → red → dark blue; that comes from over-contrasted photos [src](https://tips.clip-studio.com/en-us/articles/10375).

## 3. Rays: crepuscular and anticrepuscular

- **Crepuscular rays** spread from the sun through cloud gaps. A low sun makes them longer, haze intensifies them, and they show by contrast with darker surroundings [src](https://atoptics.co.uk/blog/crepuscular-rays-3/). The dark rays are cloud shadows in the air: "A tube of dark air reaches down" [src](https://www.atoptics.co.uk/blog/cloud-shadows-2/).
- **Anticrepuscular rays** are parallel beams that converge, by perspective, on the antisolar point: as far below the horizon as the sun is above it (12° in the example). They are best against dark backgrounds [src](https://atoptics.co.uk/atoptics/antray2.htm). At dusk "a crown of blue and pink beams" can converge above the rising shadow and pierce the Belt of Venus [src](https://skyandtelescope.org/astronomy-news/observing-news/earths-shadow-07292014/).
- **Light breaking through after a storm** reads as hope and calm, and a shaft can pick out one place in the land [src](https://tips.clip-studio.com/en-us/articles/10375).

## 4. Clouds: how they are lit

- **Silver lining:** at a thin edge, light is scattered once or twice and "mostly in the forward direction". Deeper in, it loses direction and is absorbed, so a cloud against the light is dark at heart but often "with surprising colours" [src](https://atoptics.co.uk/fz697.htm).
- **Ghost of Tsushima** varies the cloud phase with depth, from g ≈ −0.15 (back) to 0.85 (forward), and scales back-scatter by 2.16. That "gives 'silver lining' for backlit clouds, dark edges for front-lit clouds" [src](https://www.advances.realtimerendering.com/s2021/jpatry_advances2021/index.html).
- **Horizon Zero Dawn (Nubis):**
  - The "powdered sugar" effect darkens the edges facing the viewer when the sun is behind the viewer, so the crevices look lighter than the bulges.
  - Rain clouds get more absorption, so they look darker.
  - Forward scattering brightens clouds toward the sun [src](https://www.advances.realtimerendering.com/s2015/The%20Real-time%20Volumetric%20Cloudscapes%20of%20Horizon%20-%20Zero%20Dawn%20-%20ARTR.pdf).
- **Colours:** clouds are white because their droplets (≥10 µm) scatter all colours. Bases go grey as the cloud thickens and its droplets grow. At sunset a cloud takes the sun's red like "a red spotlight on a white sheet"; low clouds redden just before sunset and high cirrus "deep red" shortly after [src](https://www.hko.gov.hk/en/education/earth-science/optical-phenomena/00349-colours-of-clouds.html).
- **Undersides lit after sunset** need the cloud nearly overhead: rays slant up only about 2–3° to cirrus at 30,000 ft. Skylight from the west also lights bases from below [src](https://atoptics.co.uk/fz1025.htm).
- **Painters:** use white sparingly, vary edges soft and strong, and keep the lightest values and highest chroma for a few spots [src](https://www.outdoorpainter.com/?p=18108). "All clouds are capable of becoming brighter and darker, according to their relative position with respect to the sun" (Constable) [src](https://frontdeskapparatus.com/wp-content/uploads/2023/03/ThornesJ-ConstablesClouds-1979.pdf). Fluffy clouds are "an accumulation of spheres of various sizes with a flat base"; storm clouds are the same, condensed, heavier and darker [src](https://tips.clip-studio.com/en-us/articles/10375).

## 5. Clouds: shape, perspective, life and motion

- **Perspective** [src](https://johnmuirlaws.com/how-to-draw-clouds-in-perspective/):
  - Bases share one plane, so their shading lines converge below the horizon.
  - Far clouds are not "smaller versions" of near ones: they flatten into horizontal shapes, show their sides, and crowd closer toward the horizon.
  - Overhead clouds show their irregular undersides, not the billowy outline, and holes near the horizon become thin horizontal slots.
- **Stylized games:**
  - Sea of Thieves paints opaque cloud meshes, blurs them at quarter resolution, and gives distant clouds an alpha threshold for a "cartoon-like appearance", softer overhead. Wind offsets every cloud; high- and low-pressure zones fade clouds out of or into regions [src](https://history.siggraph.org/wp-content/uploads/2022/09/2018-Talks-Ang_The-Technical-Art-of-Sea-of-Thieves.pdf).
  - Wind Waker has "a whole bunch of different" swirl cloud textures "for all sorts of occasions", not one perfect sprite [src](https://simonschreibt.de/gat/zelda-wind-waker-hyrule-travel-guide/), and "white lines that float through the sky" show the wind [src](https://zeldauniverse.net/2019/08/06/zeldas-study-the-way-you-wake-me-feel/).
  - Breath of the Wild wanted weather that transitions, "The sun should blur in a cloudy sky", and three distance bands simplified with distance [src](https://thefamicast.com/2017/12/part-5-art-and-implementation-of-3d.html).
- **Life:** a fair-weather cumulus lasts about half an hour, and Constable "never painted a cumulus cloud when other weather elements were not conducive to its formation" [src](https://frontdeskapparatus.com/wp-content/uploads/2023/03/ThornesJ-ConstablesClouds-1979.pdf). Updrafts run about 1 m/s under fair-weather cumulus, 4–5 m/s under congestus and 10 m/s or more in cumulonimbus. Bases sit at about 600 m (UK winter) to 1,200 m or more (summer afternoon) [src](https://www.metlink.org/fieldwork-resource/cumulus-clouds/). Nubis puts low clouds at 1,500–4,000 m, alto and cirro above 4,000 m, and keeps the horizon about 50% covered [src](https://www.advances.realtimerendering.com/s2015/The%20Real-time%20Volumetric%20Cloudscapes%20of%20Horizon%20-%20Zero%20Dawn%20-%20ARTR.pdf).
- **Speeds:** cumulus 4.5 ± 1 m/s, altocumulus 14.3 m/s, cirrus 35 m/s [src](https://arxiv.org/pdf/2307.06980). Measured cloud-shadow speeds were 2.0–6.8 m/s, for clouds at 460–1,200 m [src](https://opac.geologie.ac.at/ais312/dokumente/copernicus.org/amt-7-1693-2014.pdf).
- **The film arithmetic** [est]:
  - At 48 s a frame, cumulus at 4.5 m/s move 216 m a frame, so a 1 km shadow crosses its own width in under 5 frames (0.2 s).
  - A 30 min life is 37 frames, 1.6 s at 24 fps. That is the "comical" boil.
  - On a clock at 1/5 of world time, a heap lives about 8 s of film, drifts about 43 m a frame, and its tops climb at most about 10 m a frame (1 m/s × 9.6 s): billowing you can watch.

## 6. Cloud shadows on the land

- **How dark** [src](https://arxiv.org/pdf/2307.06980):
  - Cumulus: the contrast from enhancement to shadow is "80 % of clear-sky irradiance", so a shadow is near 0.2 of full sun.
  - Altocumulus: "35 % below clear-sky".
  - Next to cloud edges the ground is brighter than clear sky: about +4% for cumulus (+9–12% averaged over the area), up to +40% locally under altocumulus.
- **How sharp:** cumulus shadow edges are "about 40 to 60 m". Variability runs from 50 m to 30 km [src](https://arxiv.org/pdf/2307.06980).
- **Shadow colour:** a shadow is lit by the sky alone, so it is lighter than the thing casting it and cool. Distance and mist lighten even the darkest verticals [src](https://theartistsroad.net/articles/thecarlsontheoryofangles). Shadow shapes follow the terrain they fall on; they "grow, shrink, get thinner, and eventually disappear" with their cloud [src](https://www.keptlight.com/on-shadows-and-clouds/).
- **Light on the ground must agree with the sky:** "any specific effect of lighting on the ground is consistent with one, and only one, distribution of clouds" [src](https://frontdeskapparatus.com/wp-content/uploads/2023/03/ThornesJ-ConstablesClouds-1979.pdf). Ghost of Tsushima lets cloud shadows modulate sunlight and shadows the Mie haze [src](https://www.advances.realtimerendering.com/s2021/jpatry_advances2021/index.html).
- **Into paint** [est]:
  - 0.2 linear is about 0.48 in sRGB, so a cumulus shadow is about half the lit value, shifted toward the sky's blue. Altocumulus (0.65 linear, about 0.83 sRGB) is a 17% veil.
  - The edge is about 5% of a 1 km shadow; the sun's 0.53° penumbra adds only about 9 m at 1 km.
  - Aerial perspective shrinks the contrast with distance (§8).

## 7. Storms and rain: anvils, mammatus, curtains, virga, lightning

- **Anvils:** the updraft stops at about 10–12 km and spreads into a "thin, flat formation", sometimes "dozens of kilometres" around one storm. An overshooting top can punch above it [src](https://www.theweathernetwork.com/en/news/science/explainers/how-an-explosive-thunderstorm-can-burst-into-the-stratosphere-anvil-overshooting-top?sa=X).
- **Mammatus** hang under anvils. Lobes are 1–3 km across and about 0.5 km deep; a lobe lasts about 10 min and a field from 15 min to a few hours [src](https://en.wikipedia.org/wiki/Mammatus_cloud).
- **Rain shafts** [src](https://en.wikipedia.org/wiki/Precipitation_shaft) [src](https://cloudlooks.substack.com/p/the-shape-of-rain):
  - Shafts are visible from far off, with "a fuzzy, bulbous appearance as they descend", and "very dark, nearly white, or even faintly glowing".
  - Weak storms look "like mist connecting the cloud base to the horizon"; strong ones like "a dark gray mass spilling to the earth".
  - They alternate heavy and light strands. Convective downpours last about 20 min; stratiform rain an hour or more.
- **Virga:** "Vertical or inclined trails of precipitation (fallstreaks) attached to the under surface of a cloud" that do not reach the ground [src](https://cloudatlas.wmo.int/en/clouds-supplementary-features-virga.html). Rain from a storm's forward head usually evaporates into virga [src](https://cloudlooks.substack.com/p/the-shape-of-rain).
- **Lightning:** 3–5 strokes per flash, about 60 ms apart; about 80% of negative flashes have two or more strokes and a continuing current, 30% of them over 40 ms [src](https://peg.atis.org/wp-content/uploads/2018/09/Lightning-Parameters-for-Engineering-Applications-1.pdf). So a whole flash lasts about 0.1–0.3 s, and in a 48-s-per-frame film it belongs to one frame [est]. Painters draw it as a jagged line with a blurred screen glow; "The sharp contrast between the dark areas and the parts lit by the lightning is a very powerful dramatic effect" [src](https://tips.clip-studio.com/en-us/articles/10375).
- **Weather states:** Nubis turns precipitation into cumulonimbus at 70% coverage, and raising wind speed with a chance of rain brings "rolling storm clouds" [src](https://www.advances.realtimerendering.com/s2015/The%20Real-time%20Volumetric%20Cloudscapes%20of%20Horizon%20-%20Zero%20Dawn%20-%20ARTR.pdf). Sucker Punch's "Kurosawa Mode" lists "Dramatic lighting, wind, clouds, haze, and fog", and lighting "can deviate from physical correctness" [src](https://www.advances.realtimerendering.com/s2021/jpatry_advances2021/index.html).

## 8. Fog, mist and aerial perspective

- **Aerial perspective beyond about 1 km:** less lightness contrast with the background, a narrower value range, lower chroma, a hue shift toward blue, and less detail [src](https://eclecticlight.co/2020/11/28/aerial-perspective-in-paintings-1-ground-rules/).
- **Firewatch** uses "fog to create depth and distance"; "Each layer adds to a feeling of depth and distance" [src](https://www.thumbsticks.com/gdc-2015-the-art-of-firewatch). Breath of the Wild's fog controls the middle distance, with particles for the far distance and dust in sunbeams as a reference [src](https://thefamicast.com/2017/12/part-5-art-and-implementation-of-3d.html).
- **Radiation and valley fog** [src](https://www.weather.gov/media/zhu/ZHU_Training_Page/fog_stuff/fog_guide/fog.pdf):
  - It forms on clear nights with light wind (2–7 kt thicken it; a stronger breeze prevents it), and cold-air drainage makes valleys "very dense".
  - After sunrise it dissipates "from the edges toward the center" or lifts into thin stratus.
- Kazuo Oga visited sites because "Photographs alone can't convey the atmosphere", to see how mist rises from valleys [src](https://animationobsessive.substack.com/p/what-kazuo-oga-thinks-about-when). In fog the sky gradient reverses, lighter at the top [src](https://tips.clip-studio.com/en-us/articles/10375).

## 9. Optics and extras

- **Rainbow:** the primary is 42° round the antisolar point, with the sky inside it brighter. The secondary is 51°, colours reversed, and Alexander's dark band fills the 9° between [src](https://atoptics.co.uk/fz682.htm) [src](https://atoptics.co.uk/rainbows/ord2form.htm). Keep the rain clouds behind it darker, and keep it subtle [src](https://tips.clip-studio.com/en-us/articles/10375).
- **22° halo:** red at 21.54° and blue at 22.37°; the inner edge is "sharp and appears reddened" and the outer edge is paler [src](https://hyperphysics.gsu.edu/hbase/atmos/halo22.html). **Sundogs** sit about 22° from a low sun, move outward as it climbs, and are hard to see above about 40° [src](https://atoptics.co.uk/halo/dogalt.htm).
- **Aurora:** green 557.7 nm at 120–180 km; red 630.0 nm higher; blue and violet mostly below 120 km; pink in the lower part. Tall rays redden at their tops. Mostly at 110–200 km [src](https://webexhibits.org/causesofcolor/4D.html).
- **Murmurations:** a mean of 30,082 birds (up to 750,000) and a mean of 26 min, at sunset before roosting, October to March. Their shapes are spheres, planes and waves, and a raptor is present at 29.6% of them [src](https://eprints.glos.ac.uk/4726/1/Birds%20of%20a%20feather%20flock%20together.pdf).
- **Dust and wind motes:** effects artists guess that Breath of the Wild's drifting wisps are stretched billboards facing the camera, their texture scrolled along the wind [src](https://realtimevfx.com/t/zelda-breath-of-the-wild-dust-particles/10639).

## 10. What makes a sky dramatic

1. **One big dark mass against light.** "Unequal distributions of value" turn a tranquil picture into one "wrought with tension and drama". Lights pierce when "surrounded by a sea of black" [src](https://www.artistsnetwork.com/art-mediums/oil-painting/accentuate-bright-light-compress-your-value-scale/amp).
2. **Contrast in a few places only.** "Keep values tight in some places and show greater contrast at several points to direct the eye." Reserve the strongest light or colour, and don't use too much white [src](https://www.outdoorpainter.com/?p=18108).
3. **Light breaking through onto the land.** Rays through gaps in dark clouds, a shaft picking out one place [src](https://tips.clip-studio.com/en-us/articles/10375), the ground's light matching its clouds [src](https://frontdeskapparatus.com/wp-content/uploads/2023/03/ThornesJ-ConstablesClouds-1979.pdf), and Constable's sky study with a shaft of sunlight [src](https://fitzmuseum.cam.ac.uk/learning/look-think-do/sky-study-with-a-shaft-of-sunlight).
4. **A sweeping structure.** Turner's storm "appears to twist back around on itself", and its curve echoes the ground's, a sublime of "immense scale, darkness" [src](https://smarthistory.org/jmw-turner-snowstorm-hannibal-army-crossing-alps/).
5. **Low sun on high cloud.** Church's "setting sun that intensely colors the dramatic altocumulus clouds", in gradations of purples, oranges and yellows [src](https://en.wikipedia.org/wiki/Twilight_in_the_Wilderness), and "clouds streaked with reddish light" [src](https://www.theartstory.org/artist/church-frederic-edwin/artworks/).
6. **Weather with its signs.** Silver linings when backlit, dark edges when front-lit [src](https://www.advances.realtimerendering.com/s2021/jpatry_advances2021/index.html), rain shafts, anvils, lightning against dark (§7), and a rainbow against darker rain.
7. **Not garish.** The zenith stays blue while the horizon burns (§2). Inness "painted the light of the whole painting", so that "sky and land are one" [src](https://myweb.rollins.edu/jsiry/Luminists-Art_America.html). The sky is almost always the lightest value [src](https://theartistsroad.net/articles/thecarlsontheoryofangles), so drama comes from darkening the clouds, not from saturating the sky [est].

## 11. What we take (canvas 2D, in priority order) [est unless tagged]

1. **A slower cloud clock.** Run cloud drift and life at about 1/5 of world time (about 10 s per 48 s frame): a half-hour heap gathers over 2–3 s of film, stands, and thins over 2–3 s, drifting about 43 m a frame. Fade whole heaps in and out, as Sea of Thieves does, never popping (§5). *Taken slower still, at the artist's word ("move slower"): 0.7 s of cloud time a frame, the heaps' lives 15–40 min of that clock, so a heap lives one to two minutes of film at 24 fps and its billows breathe over some 18 s.*
2. **Cloud shadows sweeping the land.** Cumulus shadows at about half the lit value (0.2 linear) and tinted toward the sky; altocumulus about 17%. The edge about 5% of the width, a faint brighter rim (+5–10%) just outside, the same drift as the cloud, and contrast fading into the haze (§6).
3. **A sun halo plus a horizon glow brighter on the sun's side.** Radial stops at 1 / 0.5 / 0.16 / 0.02 at 0° / 10° / 20° / 45° from the sun (g = 0.8, §1). The horizon band is whitest under the sun, and the deepest blue sits about 90° from it.
4. **A darker, deeper zenith.** Darken the top of the gradient as a vignette, most at noon and in storms, so cloud tops read lighter than the sky above them.
5. **Dusk on clouds by height.** Low heaps redden just before the sun sets, high cirrus deep red just after. Warm undersides only for clouds nearly overhead, with tops gone violet-grey, and the zenith kept blue (§2, §4).
6. **The twilight belt, timed.** A blue-grey band opposite the sun with pink 10–20° above it: strongest at sun −2°, diffuse by −5°, gone about 25 min after sunset (about −4° to −6° at mid latitudes). Over the sun, the purple light from −2° to −6° (40–80° wide, 10–15° tall), then the bright segment (§2).
7. **Composition per seed.** For storm and rain seeds, a dominant dark mass on one side with one lit gap, the gap's shaft landing on a lit patch of land below. A diagonal or curling sweep of cloud. Peak light and chroma in no more than 1–3 places (§10).
8. **Silver linings and dark edges.** With the sun behind a heap: dark heart, bright thin rim. With the sun behind you: darker edges, lighter crevices (§4).
9. **Softer rain curtains.** Strands of uneven weight, a fuzzy bulbous leading edge, very dark or pale or glowing by the light behind them. Showers stand for about 20 min of world time (§7).
10. **Virga and mammatus.** Fallstreaks fading halfway down, slanting with the wind. Under storm anvils, mammatus lobes about 1/5–1/10 of the anvil's span, warm-lit only at a low sun (§7).
11. **Anticrepuscular rays.** At a low sun on a cloudy seed, faint pale and dark wedges converging on the antisolar point below the opposite horizon, crossing the twilight belt (§3).
12. **Crepuscular rays with dark rays.** Lengthen them as the sun sinks and strengthen them with haze; the dark wedges are the cloud shadows in the air (§3).
13. **Lightning.** One frame per flash, the whole scene lit for that frame (§7).
14. **Dawn valley mist.** Pooled in the low land after clear calm nights, thinning from its edges inward after sunrise or lifting into a thin stratus sheet (§8).
15. **Dust in light shafts and wind lines.** A few dozen soft motes lit only inside a shaft, and Wind Waker's white wind streaks on breezy seeds, both on the real-second clock (ringworld-time.md).
16. **Optics.** A correct rainbow (42°, 51° reversed, darker 9° band, brighter inside), a 22° halo with a red inner edge and sundogs on cirrostratus seeds when the sun is under 40°, and murmurations at dusk (§9).

## 12. What this app can do that others don't [est, computed]

- **A sky with an arch instead of a horizon.** Niven's ring is 1,600,000 km wide at a radius of 0.95 × 10⁸ mi [src](https://academickids.com/encyclopedia/index.php/Ringworld). At elevation e the arch is at distance 2R sin e, so it is 0.30° wide at the zenith and widens as 1/sin e (painted-ringworld.md). Seen through the most air at its feet, it should rise out of the horizon haze and sharpen toward the zenith: aerial perspective as a gradient along the arch.
- **The arch carries its own day and night.** With 20 squares and a 30 h cycle (ringworld-time.md), night bands are 9/30 of each 18° of ring. A square's edge takes about 2 h to cross the 0.52° sun from the floor (it moves at about 0.25°/h as seen from there), so its shadow edge on the ring is about 3.4 million km wide, about 7% of each cycle. The night bands should have soft edges.
- **Shadow-square dusk is unlike any game's sunset.** The sun stays overhead, a straight-edged bite slowly covering it for about 2 h ("a lot of twilight" [src](https://academickids.com/encyclopedia/index.php/Ringworld)). Its light still crosses the air vertically, so it never reddens: a white noon dimming. The shadow's edge sweeps the ring at about 445 km/s, so all the land in view dims together. The Earth-like sunsets in ringworld-time.md stay as artistic licence; this could be a faithful mode.
- **Nights lit by the arch.** The lit arch, a Lambertian floor of albedo 0.3 under 100,000 lux of sun (sunlight runs 32,000–100,000 lux [src](https://en.wikipedia.org/wiki/Lux)), 70% lit, gives the floor about 100 lux. That is the table's "very dark overcast day" and 300–2,000 times the full moon's 0.05–0.3 lux [src](https://en.wikipedia.org/wiki/Lux).
  - Colours stay readable, and the sky glows a deep twilight blue with only the brightest stars.
  - Light comes from a line through the zenith, so tops and spinward and antispinward faces are lit, and soft shadows run along the arch's line.
  - A Niven-faithful night is blue and luminous, not black.
- **Cloud shadows on the arch.** The far floor is lit from straight above, so its clouds hide their own shadows near the zenith. Toward the arch's feet, seen obliquely, each cloud streak gains a dark twin beside it.
- **Two clocks in one film.** A time-lapse sky on a slowed cloud clock, with lightning, rain, motes and birds on real seconds (ringworld-time.md): a storm can boil past while its rain still falls in streaks.

## Gaps

- **Could not open:** the WMO atlas pages for incus and praecipitatio (permission timed out), Wikipedia's Blue hour and NASA's aurora feature (permission timed out), the PMC murmuration paper and the PubMed Belt-of-Venus abstract (captcha; the Gloucestershire eprint was used for the former), the Ghost of Tsushima PDF (error; its HTML slides were used), and atoptics anti1.htm (server error; antray2 was used).
- **No source found for:** Wind Waker's actual cloud and sky technique (only its many swirl sprites and wind lines), Firewatch's fog specifics, Kazuo Oga's way of painting clouds, Breath of the Wild's cloud shadows, measured sizes of cumulus shadows in km, the daily cycle of cumulus (onset, peak, decay), whether the sky is darker inside a 22° halo, and heat shimmer (not researched).
- **Conflicts:**
  - The Hillaire paper's text, as extracted, gives Rayleigh 1.2 km and Mie 8 km scale heights, the reverse of the usual. It was not used.
  - h2g2 (via ringworld-time.md) says shadow-square light is cut off suddenly; the ~2 h estimate here and academickids's "a lot of twilight" disagree.
- **Estimates resting on assumptions:** the 100 lux arch-light figure ignores both atmospheres, clouds and rim walls; the 1/5 cloud clock is a taste choice backed by time-lapse practice, not a measurement.
