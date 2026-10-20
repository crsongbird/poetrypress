# Prior art: time on the Ringworld (a day, a night and a giant planet in a short film)

Key: **[src](URL)** = read in that source for this doc. **[est]** = my own estimate, inference or arithmetic. Researched 2026-10-20 by searching and opening each source. What could not be opened or confirmed is under **Gaps** at the end.

## Summary

- **The sun model is one line of spherical trigonometry.** sin(el) = sin φ sin δ + cos φ cos δ cos H [src](https://gml.noaa.gov/grad/solcalc/solareqns.PDF). Latitude 45° and declination +14° give a 14.1 h day, a 59° noon sun, about 60 min of golden light at each end and 32 min of civil twilight [est, computed].
- **Golden hour is short.** It is sun elevation −4° to +6° [src](https://www.home-assistant.io/conditions/sun.is_golden_hour/). That is about 1 h per end, roughly 8% of the 24 h, so a day squeezed into 30 s gives it about 1.3 s of film per end [est]. Games bend the clock instead: RDR2's night hours run faster than its day hours [src](https://powerpyx.com/how-long-is-1-day-in-red-dead-redemption-2).
- **Niven's ring turns once per 7.5 Ringworld days of 30 h, so 225 h** [src](https://academickids.com/encyclopedia/index.php/Ringworld). The stars turn 360/225 = **1.6° per hour**, in the plane of the arch [est].
- **Two clocks.** Sky, sun, giant and moons follow scene time t. Rain, insects, meteors and flicker are real-second events seen through one shutter; when a frame spans more than a second of t, they decorrelate frame to frame, as in a time-lapse [est].
- **Real giants are paler than their famous pictures.** Jupiter's colours sit close to white [src](https://arxiv.org/pdf/1905.02978). Neptune's Voyager images were "made artificially too blue": Uranus and Neptune are a similar greenish-blue [src](https://www.ox.ac.uk/news/2024-01-05-new-images-reveal-what-neptune-and-uranus-really-look-0).

## 1. The sun's path

**Formulas (NOAA)** [src](https://gml.noaa.gov/grad/solcalc/solareqns.PDF)
- Hour angle ha = tst/4 − 180, with tst the true solar time in minutes: 15° per hour, 0 at noon.
- Zenith: cos ζ = sin(lat) sin(decl) + cos(lat) cos(decl) cos(ha); elevation el = 90° − ζ [src](https://en.wikipedia.org/wiki/Solar_zenith_angle).
- Azimuth, clockwise from north: cos(180 − θ) = −(sin(lat) cos ζ − sin(decl)) / (cos(lat) sin ζ), taking the afternoon branch for ha > 0. A form with no branch is θ = atan2(−sin H cos δ, sin δ cos φ − cos δ sin φ cos H) [est].
- Sunrise and sunset use zenith 90.833° (refraction plus the sun's radius): ha = ±arccos(cos 90.833° / (cos lat cos decl) − tan lat tan decl).

**Day length**
- The plain form is cos ω0 = −tan φ tan δ, and the day lasts 2ω0/15 hours. Declination is positive in the northern summer, so days there are longer than nights; there is no solution in polar day or night [src](https://en.wikipedia.org/wiki/Sunrise_equation).
- Computed with the 90.833° form [est]: φ 45°, δ +14° gives a 14.09 h day, noon el 59° and sunrise azimuth 69° (north of east). φ 45° at the solstice (δ +23.44°) gives 15.6 h; φ 40°, δ +15° gives 13.9 h.

**Twilight**
- The bands are civil (sun 0 to −6°), nautical (−6 to −12°) and astronomical (−12 to −18°). Twilight is shorter near the equator, and at high latitude in summer astronomical twilight can last all night [src](https://www.timeanddate.com/astronomy/different-types-twilight.html). Blue hour is −4° to −6° [src](https://www.home-assistant.io/conditions/sun.is_golden_hour/).
- **Why sunsets are extended at higher latitude:** the sun's path meets the horizon at a shallow angle, so it takes longer to sink through each band [src](https://earthsky.org/space/twilight-2).
- Sunset to the end of civil twilight lasts about 24 min at the equator, about 33 min in New York and 42 min in London on 21 June, and 35–90 min at 60°. That source's rule of thumb is about 24 min / cos(lat) [src](https://converttime.com/en/blog/equator-sunset-speed).
- At mid latitudes, civil twilight averages about ½ h, nautical about ½ h (45 min in summer) and astronomical ½ h to 1 h [src](https://earthsky.org/space/twilight-2).
- Computed for φ 45°, δ +14° [est]: golden band (+6 to −4°) 60 min, civil 32, nautical 39, astronomical 44. The sun sinks at 9.8°/h at the horizon there (15°/h on the equator), so the disc takes 3.2 min to set (2.1 min on the equator).

**Shape**
- On an azimuth–elevation chart each day's path is an arc that rises in the east, peaks at noon and falls to the west. The arcs sit higher in summer, and the summer path rises and sets north of east and west [src](https://pvlib-python.readthedocs.io/en/stable/gallery/solar-position/plot_sunpath_diagrams.html).
- In the sky the path is a small circle tilted 90° − φ from the horizon. On a flat painted view it reads as a parabola-like arc, never a full circle [est].

## 2. How games do time of day

- **Breath of the Wild:** a 24-minute day, one real minute per game hour, as in Ocarina of Time [src](https://gamesbeat.com/nintendos-zelda-booth-at-e3-has-a-24-minute-day-night-cycle/).
- **Red Dead Redemption 2:** a day lasts about 48 real minutes, with day hours of about 2.5 min and night hours of about 75 s [src](https://powerpyx.com/how-long-is-1-day-in-red-dead-redemption-2). The clock is deliberately uneven.
- **Firewatch's sky** is procedural and art-driven, built for "color" and "tone" rather than Mie factors. It adds four layers: a three-colour gradient (top, half, bottom), a sun disc, a sun halo and a horizon halo [src](https://blog.camposanto.com/post/112703721804/this-blog-post-is-an-in-detail-explanation-of-a).
- **Firewatch's look:** flat shapes with strong silhouettes, "very distinct layers" of bold colour, fog for depth, and a colour script tied to narrative moments [src](https://www.thumbsticks.com/gdc-2015-the-art-of-firewatch). This is the closest match to our flat, illustrative hand [est].
- **Unreal Sky Atmosphere:** sky colour follows sun altitude, and sunsets redden because the light crosses more air. Moonlight at zenith should be about 0.26 lux, and a second (moon) light gets no multi-scattering [src](https://dev.epicgames.com/documentation/en-us/unreal-engine/sky-atmosphere-component-in-unreal-engine).
- **Factorio:** {time, LUT} keyframes, blended between neighbours; two keys at nearly the same time give a sharp switch [src](https://lua-api.factorio.com/latest/types/DaytimeColorLookupTable.html). A gamedev.net cycle uses a sky lookup texture indexed by time of day and altitude [src](https://gamedev.net/blogs/entry/2260700-daynight-cycle).
- **Illustrators' keys:** by day a yellow-warm key light with blue or purple shadows; at sunset a red key light with deeper blue shadows; moonlight soft and diffuse with blue shadows [src](https://tips.clip-studio.com/ja-jp/articles/1684?org=1).
- **The Witness:** no day cycle could be confirmed. Its art simplifies shapes and starts bright and saturated [src](https://en.wikipedia.org/wiki/The_Witness_(2016_video_game)).
- **Ratio:** golden light is about 1/12 of the clock at mid latitudes (§1). Games that dwell on it slow the clock there, as RDR2 does at night [est].

## 3. Niven's Ringworld: spin, day and stars

**Spin and day**
- The ring spins at 770 mi/s (1,200 km/s). One turn takes 7.5 Ringworld days of 30 h, so 225 h or 9.375 Earth days [src](https://academickids.com/encyclopedia/index.php/Ringworld) [src](https://larryniven.fandom.com/wiki/Ringworld); h2g2 rounds this to about 9 days [src](https://www.h2g2.com/approved_entry/A87815604).
- With no shadow square in the way, the sun stays at high noon, with no sunrise or sunset [src](https://larryniven.fandom.com/wiki/Ringworld).

**Shadow squares**
- There are 20 squares, wired in a circle at about 0.3 AU, with gaps more than twice a square's length. Days last 21 h and nights 9 h [src](https://logosconcarne.com/2015/01/03/ring-around-a-star/).
- They turn slightly faster than the ring; a later design uses five longer squares orbiting retrograde [src](https://larryniven.fandom.com/wiki/Ringworld). Light is cut off suddenly and returns just as suddenly [src](https://www.h2g2.com/approved_entry/A87815604).

**The arch and the rim walls**
- At night the rest of the ring is a giant arch with lit and dark parts [src](https://www.h2g2.com/approved_entry/A87815604), which the natives call "the Arch of Heaven" [src](https://logosconcarne.com/2015/01/03/ring-around-a-star/). The rim walls are 1,000 mi (1,600 km) high [src](https://academickids.com/encyclopedia/index.php/Ringworld).

**What the stars do** [est]
- The spin axis is perpendicular to the ring plane. On the floor it lies across the ring, so the celestial poles sit low over the two rim walls, and the ring plane, along which the arch lies, is the celestial equator.
- Stars rise over the spinward horizon, move parallel to the arch, slide behind it and set antispinward. Stars near the rim-wall poles circle them slowly.
- Rate: 360°/225 h = 1.6°/h, so an 8 h night turns the field 12.8° and 2 days turn it 77°.
- The arch itself never moves, being rigid with the floor; only its lit and dark bands slide. With 20 squares, one square and gap pass every 30 h, which is 18° of ring longitude per 30 h.

**The tension in our surface** [est]
- A true Ringworld sun never moves. Our brief wants a sun path, so use the Earth-like sun of §1 as artistic licence and keep the stars turning at the ring's 1.6°/h.
- An optional Niven-faithful mode would keep the sun at zenith and dim the day with a shadow-square edge (minutes of dusk), with dark bands on the arch.

## 4. Clouds

- **Heights:** cumulus sit at about 0.6–2 km and cirrus at 8–12 km [src](https://content.meteoblue.com/en/research-education/educational-resources/meteoscool/weather/clouds/cloud-types). The jet stream is 50 kt (26 m/s) or more, and banded jet cirrus lies on its equatorial side near the tropopause [src](https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC%2000-6A%20Chap%2013-15.pdf).
- **Speeds** [est]: cumulus drift at 5–12 m/s and cirrus at 15–40 m/s. Overhead the angular speed is v/h: cumulus at 10 m/s and 1.5 km move 0.38°/s (about 1,400°/h, a whole new sky within minutes), and cirrus at 30 m/s and 10 km move 0.17°/s. Near the horizon the rate falls roughly as sin²(el), so distant clouds crawl.
- **Lifetime:** shallow cumulus that live under 45 min are bubble-like; longer-lived ones are plume-like [src](https://arm.gov/research/highlights/1185). Fair-weather cumulus live about 10–40 min and cirrus sheets last hours [est].
- **Time-lapse practice:** shoot at 10–20 s intervals for slow clouds and 2–5 s for storms, and play back at 24–30 fps [src](https://www.miops.com/blogs/news/cloud-timelapse-photography-techniques-for-dynamic-skies), so about 300–600 s of sky per film second. 24 h in 30 s is 2,880 s per film second: a cumulus would move about 1 km per frame at 30 fps, which strobes [est].

## 5. Meteors and comets

- **Showers:** Perseids have a ZHR of about 100 in the literature (155–185 measured in 2020–23) at 58.8 km/s; Geminids about 120 (221 measured in 2021) at 35.0 km/s [src](https://arxiv.org/html/2411.00183v1). Geminids are slow and long, a second or more, and sometimes break into "blobs"; observed UK peak rates run 60–80/h [src](https://britastro.org/pipermail/baa-ebulletin/2015-December/000362.html).
- **Sporadics:** at 45°N about 1/h in the evening and 4/h before dawn; at 25°S about 2/h and 12/h [src](https://amsmeteors.org/2024/02/meteor-activity-outlook-for-february-17-23-2024/).
- **Duration and length:** "Most meteors glow for about a second", lighting up at 75–120 km [src](https://en.wikipedia.org/wiki/Meteor). Fast ones take a fraction of a second and slow ones several seconds; those near the radiant are short, and earth-grazers cross the whole sky [src](https://www.cs.cmu.edu/~zhuxj/astro/html/meteorbasic.html). Typical visible trails are 5–30° [est].
- **Colour:** pink near the horizon, yellow to white, green and blue [src](https://www.cs.cmu.edu/~zhuxj/astro/html/meteorbasic.html). Sodium gives 589 nm (yellow) and magnesium 517 nm (green), over a blackbody-like core of 4,200–5,500 K [src](https://ar5iv.labs.arxiv.org/html/2106.07403). A fireball is magnitude −4 or brighter, and ionisation trails can persist [src](https://en.wikipedia.org/wiki/Meteor).
- **Comets** wander, "changing position slightly night after night"; Hyakutake's tail stretched more than halfway across the sky. Dust tails are white or pale yellow, ion tails blue, and heads green from C₂ [src](https://www.astronomy.com/observing/how-to-observe-comets-from-your-back-yard/). NEOWISE showed a golden dust tail and a blue ion tail [src](https://en.wikipedia.org/wiki/Comet_NEOWISE).
- A typical bright comet moves about 0.5–3° per day, so up to about 6° over our 2 days, with the tail pointing away from the sun [est].

## 6. Flicker and town lights

- **Discharge lamps** (sodium among them) flicker at twice mains, about 100 Hz on 50 Hz mains. This is normally not perceived but can strobe moving things [src](https://dialux4.support-en.dial.de/support/solutions/articles/9000078420-stroboscopic-effect-). On 60 Hz mains it is 120 Hz; either way it is far above our frame rates, so do not model it [est].
- **Candles:** single diffusion flames flicker at 10–12 Hz; two candles cycle in 87 ms (11.5 Hz) and four in 105 ms (9.5 Hz) [src](https://www.nature.com/articles/srep16994).
- **Fires:** the puffing rate falls with size, f ≈ 1.5 D^−½ Hz, about 1.5 Hz at D = 1 m [src](https://arxiv.org/pdf/1803.10400) and about 2.7 Hz for a 0.3 m hearth [est].
- **Windows through a night** (ResStock interior-lighting fraction by hour) [src](https://discourse.ladybug.tools/t/ashrae-lighting-schedules/22763):

| Hour | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 0 | 1 | 2–4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Fraction lit | .41 | .48 | .62 | .78 | **.88** | .60 | .25 | .12 | .07 | .05 | .14 | .33 | .42 |

- The peak is at 21:00. After midnight the fraction falls to about 5%, with a small dawn rise [src](https://discourse.ladybug.tools/t/ashrae-lighting-schedules/22763).

## 7. Rain and snow

- **Speeds:** drizzle under 0.5 mm falls at about 2 m/s, and drops of 5–6 mm at about 9–10 m/s (9–13 m/s reported) [src](https://hypertextbook.com/facts/2007/EvanKaplan.shtml). Snow and graupel both fall at about 1 m/s, and snow "clearly swirls" [src](https://actu.epfl.ch/news/turbulence-and-temperature-effects-on-hydrometeor-).
- **Shutter:** the 180° rule sets it to 1/(2 × fps), so 1/48 s at 24 fps [src](https://www.studiobinder.com/blog/what-is-the-180-degree-shutter-rule/), 1/60 at 30 fps and 1/120 at 60 fps [est]. Photographers get streaks at 1/30 s and frozen drops at 1/1000 s [src](https://fstoplounge.com/two-ways-to-photograph-in-the-rain/).
- **Streak length is v × shutter** [est]: rain at 9 m/s and 1/48 s leaves 19 cm, drizzle 4 cm, and snow 2 cm, so flakes read as dots with a wobble. On screen, px = v × shutter × focal_px / distance.

## 8. Insects and fireflies

- **Flight speeds:** mosquito 0.5 m/s, honeybee 3, locust 4.4 and dragonfly 7.5 m/s [src](https://ffden-2.phys.uaf.edu/645fall2007_web.dir/debasmita_phys645/insect.html). Unloaded honeybees cruise at about 7.5 m/s outdoors [src](https://bionumbers.hms.harvard.edu/bionumber.aspx?id=107550).
- **Midge swarms:** midges are unpolarised (neighbours share no heading and turn any way) and fly about twice as fast horizontally as vertically. A centre-directed acceleration holds the swarm together, "as if trapped in a box", and swarms of 100 or more are slightly taller than wide [src](https://softbites.org/?p=4841). Swarms sit over a marker and follow it with viscous damping [src](https://www.quantamagazine.org/how-swarming-insects-act-like-fluids-20190710/).
- **Fireflies:** Photinus pyralis flashes for about ¾ s every 5–6 s [src](https://silentsparks.com/2018/06/02/a-guide-to-lightningbug-linguistics/), a duty of about 13% [est]. P. carolinus flashes in synchronous trains of 5–8, then stays dark 8–10 s, from full dark until about midnight. Most flashes are yellow; blue ghosts glow pale blue-green for 30–40 s [src](https://home.nps.gov/grsm/learn/nature/firefly-flash-patterns.htm).

## 9. The four giants and their moons

**Planets** (equatorial radius, tilt, rotation) [src](https://physics.info/astronomical/)
- Jupiter 71,492 km, 3.13°, 9.93 h; Saturn 60,268 km, 26.73°, 10.66 h; Uranus 25,559 km, 97.77°, −17.24 h; Neptune 24,764 km, 28.32°, 16.11 h.
- So the Great Red Spot crosses Jupiter's face in about 5 h, which shows over a 2-day t [est].

**Jupiter**
- Zones are light, from ammonia ice; belts are darker. The Great Red Spot sits at about 22°S, about 24,000–40,000 × 12,000–14,000 km in the historical range and shrinking, coloured from brick-red to pale salmon. White ovals sit in the zones, and the poles are bluish-grey and featureless [src](https://en.wikipedia.org/wiki/Atmosphere_of_Jupiter).
- True colours sit near white, within CIE x, y 0.3–0.4, with an orange chromophore at x 0.375, y 0.370 [src](https://arxiv.org/pdf/1905.02978). That converts to about sRGB 255, 212, 172 at full brightness [est, computed].
- The limb darkens with a slight blue tinge [src](https://www.syfy.com/syfy-wire/jupiter-from-hubble-enormous-magnificent-and-fading-at-the-edge).
- **Rings:** a main ring at 1.72–1.81 RJ with optical depth about 6×10⁻⁶, plus a halo and gossamer rings out to about 3.1 RJ. They are reddish (the halo bluish) and bright only when backlit [src](https://en.wikipedia.org/wiki/Rings_of_Jupiter), so draw them only when Jupiter is a crescent near the sun [est].

**Saturn**
- Pale yellow with hints of orange; its bands are fainter than Jupiter's and wider near the equator [src](https://www.universetoday.com/articles/color-of-saturn).
- Ring radii [src](https://planetarynames.wr.usgs.gov/Page/Rings), with Saturn radii in brackets [est]: C ring 74,490–91,980 km (1.24–1.53), B ring to 117,500 km (1.95), Cassini Division to 122,050 km (2.03), A ring to 136,770 km (2.27) with the Encke Gap at 2.22, F ring 2.33.
- The C ring is see-through, the B ring optically thick, and the Cassini Division a 4,800 km gap [src](https://science.nasa.gov/resource/colorful-threads-and-shadows/). B-ring bands are "sandy", coloured by rock or carbon contaminating white water ice [src](https://www.jpl.nasa.gov/news/saturns-rings-offer-a-fresco-of-color/).

**Uranus**
- Tilt 97.77°, cyan from methane, and through most telescopes a "featureless blue-green sphere"; it has 13 rings, "small, dark and faint" [src](https://www.skyatnightmagazine.com/news/uranus). The epsilon ring is at 51,140 km, 2.0 RU [src](https://planetarynames.wr.usgs.gov/Page/Rings) [est].
- It looks greener at solstice and bluer at equinox [src](https://www.ox.ac.uk/news/2024-01-05-new-images-reveal-what-neptune-and-uranus-really-look-0).

**Neptune**
- A similar greenish-blue to Uranus, slightly bluer because of thinner haze; the deep blue is Voyager enhancement [src](https://www.ox.ac.uk/news/2024-01-05-new-images-reveal-what-neptune-and-uranus-really-look-0).
- The Great Dark Spot is 13,000 × 6,600 km, about 26% of the disc's width [est]. Bright cirrus sits higher than the dark spot, with a white companion cloud on its lower edge; the "Scooter" gains about 30° per rotation, and the weather changes within one 18 h rotation [src](https://pds-rings.seti.org/press_releases/pages/PIA02xxx/PIA02245.html).
- Faint rings lie at 41,900–62,930 km, Adams with its arcs outermost [src](https://planetarynames.wr.usgs.gov/Page/Rings).

**Moons**
- Sizes and periods: [src](https://physics.info/astronomical/) [src](https://windows2universe.org/our_solar_system/moons_table.html) [src](https://www.aanda.org/articles/aa/full/2004/01/aa3475/table1.html). Colours: [src](https://pages.uoregon.edu/jschombe/ast121/lectures/lec13.html) [src](https://en.wikipedia.org/wiki/Callisto_(moon)) [src](https://www.britannica.com/print/article/597100) [src](https://www.esa.int/Our_Activities/Space_Science/Cassini-Huygens/The_most_reflective_body_in_the_Solar_System) [src](https://en.wikipedia.org/wiki/Ariel_(moon)) [src](https://en.wikipedia.org/wiki/Oberon_(moon)) [src](https://astro.if.ufrgs.br/solar/triton.htm). Relative size (Ganymede = 1) and RGB are [est].

| Moon | Radius km | Rel. | Period d | Look | RGB [est] |
|---|---|---|---|---|---|
| Ganymede | 2,631 | 1.00 | 7.155 | dark cratered and grooved terrain, white fresh craters | 165 155 140 |
| Titan | 2,575 | 0.98 | 15.945 | featureless brownish-red haze | 205 145 75 |
| Callisto | 2,410 | 0.92 | 16.689 | dark (albedo 0.22), bright frost spots | 110 100 90 |
| Io | 1,822 | 0.69 | 1.769 | yellow, red, black-brown sulfur | 230 200 110 |
| Europa | 1,561 | 0.59 | 3.551 | bright smooth ice, red-brown cracks | 225 215 195 |
| Triton | 1,353 | 0.51 | −5.877 (retrograde) | pinkish polar cap, albedo 0.7 | 225 205 200 |
| Titania | 789 | 0.30 | 8.706 | grey ice | 165 160 155 |
| Rhea | 764 | 0.29 | 4.518 | grey ice | 190 188 185 |
| Oberon | 761 | 0.29 | 13.463 | reddest Uranian moon, albedo 0.31 | 150 135 125 |
| Umbriel | 585 | 0.22 | 4.144 | darkest Uranian moon | 95 95 95 |
| Ariel | 579 | 0.22 | 2.520 | neutral, brightest Uranian moon (0.53) | 190 190 188 |
| Enceladus | 252 | 0.10 | 1.370 | reflects >90% of sunlight | 245 245 245 |
| Miranda | 236 | 0.09 | 1.414 | grey | 170 170 170 |

**Painting a giant in a sky**
- Bonestell's Saturn as Seen from Titan (1944) gave Titan a clear, sapphire-blue sky. He built it from clay models and photographic tricks, with "the slanting sunlight mathematically calculated" [src](https://en.wikipedia.org/wiki/Chesley_Bonestell); he photographed the model, enlarged the photo and painted over it [src](https://www.atlasobscura.com/articles/meet-the-father-of-modern-space-art).
- **Phase:** the lit fraction is k = (1 + cos i)/2, where i is the phase angle [src](https://astroplan.readthedocs.io/en/stable/_modules/astroplan/moon.html). For a distant giant, i ≈ 180° − its angle from the sun in our sky, and the lit limb points along the great circle toward the sun. 90° from the sun it is half lit; near the sun it is a thin crescent with backlit rings [est].

## 10. What we take (for stepsRing.js, paintKit.js, moving.js and uiMoving.js) [est unless tagged]

**Clocks**
- t is scene seconds, up to 172,800 (2 days). Hour h = (t/3600 + h0) mod 24, and per frame dt = span / (seconds × fps).
- Real-second effects (rain, insects, meteors, flicker) use local time τ = frame/fps × min(1, dt × fps). If dt > 1 s, re-seed their phase each frame, as a time-lapse does.

**Sun**
- φ = 45°, δ = +14°: a 14.1 h day, 59° at noon [est, computed with the NOAA form [src](https://gml.noaa.gov/grad/solcalc/solareqns.PDF)]. H = 15° × (h − 12), with el and az from §1.
- Optional time warp in uiMoving.js: slow the clock 2× where |el| < 8°, like RDR2's uneven hours [src](https://powerpyx.com/how-long-is-1-day-in-red-dead-redemption-2).

**Elevation to sky key** (top / mid / horizon; sun). Blend the keys in el like Factorio's LUT [src](https://lua-api.factorio.com/latest/types/DaytimeColorLookupTable.html), and add Firewatch-like sun and horizon halos [src](https://blog.camposanto.com/post/112703721804/this-blog-post-is-an-in-detail-explanation-of-a).

| el | Phase | Top | Mid | Horizon | Sun |
|---|---|---|---|---|---|
| ≥ 20° | day | 70 120 190 | 130 175 220 | 200 215 225 | 255 250 235 |
| 6° | late | 80 120 180 | 160 180 200 | 235 210 170 | 255 225 170 |
| 0° | sunset | 60 80 140 | 180 140 150 | 250 160 90 | 255 150 70 |
| −4° | blue hour | 40 55 110 | 110 100 150 | 220 130 110 | — |
| −6° | civil end | 25 35 80 | 60 65 115 | 150 100 110 | — |
| −12° | nautical end | 12 16 40 | 22 28 60 | 45 45 80 | — |
| ≤ −18° | night | 6 8 20 | 10 12 28 | 16 18 36 | — |

- Stars fade in from el −4° (bright ones) to −18° (all) [src](https://www.timeanddate.com/astronomy/different-types-twilight.html) [est]. Windows light up when el < 2°, following §6. Shadows run blue-violet by day and blue at night [src](https://tips.clip-studio.com/ja-jp/articles/1684?org=1).

**Sky motion**
- **Stars** rotate about the rim-wall axis at 1.6°/h (0.000444°/s), rising spinward [est from [src](https://academickids.com/encyclopedia/index.php/Ringworld)].
- **Clouds** use their real drift (cumulus 0.38°/s, cirrus 0.17°/s overhead) only while dt ≤ 2 s. Otherwise cap translation at about 3° per film second and evolve the shapes through a noise phase of about one lifetime per 30 min of t.
- **Meteors** are events on the film timeline, not in t: 0.3–1 per film second in a shower and 1 per 10–20 film seconds for sporadics. Each lasts 0.3–1.0 s (Geminids up to 1.5 s), runs 5–30° and moves away from one radiant. They are white-yellow with a green or yellow tint, and 1 in 30 is a fireball.
- **Comets** move 1–3°/day in t, with the tail pointing antisolar.

**Small motion**
- **Flicker:** candle 10–12 Hz and hearth 1.5/√D Hz, band-limited below fps/4 (7.5 Hz at 30 fps), with ±5–10% amplitude. No flicker on sodium lamps. Each window gets a seeded on and off time, so the lit fraction follows §6.
- **Rain** falls at 9 m/s (drizzle 2), with streaks of 9/48 m at 1/48 s. **Snow** falls at 1 m/s with a lateral wobble of 0.3–1 Hz. Shutter = 0.5/fps.
- **Insects:** midges random-walk at 0.3–1 m/s, horizontal speed 2× vertical, pulled to the swarm centre. Bees fly at 3–7.5 m/s, dragonflies at 7.5 m/s in straight darts. Fireflies flash for 0.75 s every 5.5 s, from full dark (el < −10°) until midnight.

**Giant**
- The seed picks Jupiter, Saturn, Uranus or Neptune.
- **Palettes:**
  - Jupiter: zone 236 228 214, belt 196 160 128, Great Red Spot 200 120 90, pole 150 150 155.
  - Saturn: bands 226 206 160 and 205 180 130; B ring 214 196 160, A ring 190 180 160, C ring 120 115 110 at α 0.3, Cassini Division α 0.08.
  - Uranus 172 214 220; Neptune 120 165 215 (true-ish), with a "classic" option of 60 90 200.
- Phase k = (1 + cos i)/2, with the limb darkened about 30% and tinted blue. Bands advance 360° per rotation period of t.
- Moons are the §9 table: radius scaled by Rel. and placed on circles at period P in t.

## 11. What this app can do that others don't [est]

- Every frame is an exact offline render at its own t, so a 2-day sky, a 9.9 h Jovian rotation and the ring's 1.6°/h star turn all stay consistent. Real-time games need fast clocks; we don't.
- Two clocks give a time-lapse sky with real-second rain, fireflies and meteors in the same shot, which a camera cannot do.
- A seed picks a giant with true-colour palettes and real moon ratios, painted in a flat illustrative hand rather than a photoreal skybox.
- A Niven-faithful mode is possible: a zenith sun and shadow-square dusk sliding along the arch.

## Gaps

- **Opened but missing the needed detail:** the IMO 2024 calendar page (the site was being rebuilt), the Great Dark Spot Wikipedia page (blocked), and the candle PMC article (blocked; the Nature paper was used instead).
- **No source found for:** cloud drift speeds in m/s, comet rates in degrees per day, Saturn's A and C ring colours, and Sky: Children of the Light's lighting.
- **Not confirmed:** Jupiter's current Great Red Spot size in km; only the historical range is given.
