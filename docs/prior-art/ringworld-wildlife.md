# Prior art: wildlife on the Ringworld (herds that scatter, flocks that lift, birds in every sky, small things everywhere)

The Ringworld's animals today are sheep on two-metre timetables and a few marks that loop on sines, so nothing travels far and nothing flees [est]. Real animals give a painter firm numbers. Roe and fallow deer flee a walker at 42–65 m [src](https://agris.fao.org/search/en/records/65def2bb0f3e94b9e5d32977), and a white-tailed deer sprints at 60 km/h [src](https://en.wikipedia.org/wiki/White-tailed_deer). A flushed hare runs about 420 m [src](https://pure.au.dk/ws/files/229257859/wlb.00840.pdf), and flushed waterbirds stay up about a minute [src](https://www.waderstudygroup.org/article/1847/). A soaring bird circles a thermal on a radius of about 21 m once every 15.5 s, banked 23–26° and climbing about 1 m/s [src](https://arxiv.org/pdf/0902.0312). Birds' airspeeds run from 8 to 23 m/s [src](https://pmc.ncbi.nlm.nih.gov/articles/PMC1914071), and their wingbeats from 2 Hz in a heron to 25 Hz in a tit [src](https://hoopermuseum.carleton.ca/birds/pg4pt3.htm). Games make such life cheap in four ways. ABZU moves tens of thousands of fish by mathematics in their materials instead of skeletons [src](https://80.lv/articles/interview-with-the-creative-director-of-abzu/). Developers describe drawing distant crowds as animated sprites, animated less the farther they are [src](https://discussions.unity.com/t/how-does-uebs-get-a-million-troops-on-the-field-simultaneously/661025). Each animal gets its own phase, so a flock never moves in lockstep [src](https://docs.godotengine.org/de/4.3/_sources/tutorials/performance/vertex_animation/animating_thousands_of_fish.rst.txt). And Half-Life 2's crow simply flies off when anything comes too close [src](https://developer.valvesoftware.com/wiki/Npc_crow). Every model below is a pure function of a creature's seed and the clock, built from four pieces: timetables of stops, events in slots, a flock drawn as delayed copies of one path, and a look back along a walker's own timetable for the moment it came too near. So any film frame can be painted alone, and a game could reuse the same functions with the player as one more walker [est].

## 1. The request, and where the wildlife stands now

> "Wildlife still travel on short predictable paths and do not really move or scatter, we should probably have more wildlife in general (birds, small things)" (Ruby, on the Painted Ringworld's films)

- **How to read the tags.** [src](URL) marks a page opened and read for this doc on 2026-10-24. [est] marks an estimate, a sum worked from sourced numbers, a reading of this repository's code, or a design proposal [est].
- **What this doc leaves to its companions.** Timetables, Reynolds' steering and incommensurate sines are covered in docs/prior-art/ringworld-life-and-views.md. The clocks, hawk kettles and wild-land features are in docs/prior-art/ringworld-motion-and-variety.md. The heron-walker and shell-grazer bots are in docs/prior-art/painted-ringworld-2.md [est].
- **The only animal on a timetable is the sheep.** `RG_MOVES` gives it 2 m along and 2 m across its home at 0.15 m/s, with each stop drawn round a home that never moves [est, read in stepsRing.js].
- **The gulls behind the plough are marks on a loop.** They, the insects and the fairies are drawn by `rgSmallLife`, which moves each one by one or two sines of `rgSwayTime` around a fixed point. A gull in the air sways across on sin(0.5t), every 12.6 s, and up and down on sin(0.8t); the two close into one small Lissajous loop that repeats every 63 s. That is the "short predictable path" [est, read in stepsRing.js].
- **The murmuration is a single cloud.** It is one dusk flock folded by sines [est, read in stepsRing.js].
- **Nothing reacts to anything.** No animal has a trigger: nothing flushes or flees from a walker, a tractor or a storm. The ring has no deer, hares, raptors, swallows, geese, herons, ducks, bats, dragonflies or butterflies, and no single bird crosses the day sky [est, read in stepsRing.js].
- **The clocks are fixed per kind of motion.** The motion clock is capped at 2.5 s a frame (`rgMotionTime`), the sway clock at 0.25 s (`rgSwayTime`), and the film clock counts the film's own seconds (`rgFilmTime`). On the motion clock in a time-lapse, a bird flying at 12 m/s would move 30 m a frame [est].

## 2. How each creature moves, rests and flees

### 2.1 One stateless pattern for all of them [est]

- **A home that wanders.** Each herd, flock or animal has a home of its own, home(t) = home₀ + R·noise(t/τ, seed), with τ = 5–20 min and R = 50–300 m. Its paths then run for hundreds of metres and never close into a loop [est].
- **Stops, as movedRound already does them.** Stop k = floor(t/T) lies at hash(seed, k) near home(t), and the animal walks between stops at its kind's pace (§2.2–2.13) [est].
- **Events in slots, as `rgStrike` times lightning.** Each slot of S s holds an event (a flush, a pounce, a dive) when hash(seed, slot) < p. Everything after it is a closed-form function of τ = t − t₀: alert, then flee, then stop and look, then regroup, then graze again [est].
- **Triggers without memory.** A walker, a tractor or the player is itself a pure function of time. To find when it last came within a flock's flight distance, sample its position at t − iΔ for i = 0…30 with Δ ≈ 2 s, then bisect 4–5 times. That is about 35 evaluations per flock per frame, and the answer is exact in every frame [est].
- **A flock is one path with delays.** Member i is drawn at path(t − lagᵢ) + offsetᵢ(t), with lags of 0–2 s. Offsets shrink in flight, which bunches the flock, and grow over minutes after landing, which spreads it. A turn of the path then runs down the flock like a ribbon, which is the look of wheeling [est].
- **Each member has its own constants.** Every member has its own flap phase, its own speed (×0.8–1.2), and its own flee heading: away from the threat, plus or minus up to 40° [est]. Batman Returns started each simulated bat's flapping cycle at a random point [src](https://beforesandafters.com/2022/04/07/a-history-of-cg-bird-flocking/).
- **Which clock drives what.** Gaits and wingbeats run on film time, so a heron beats at 2 Hz in any film. The positions of flying things run on the sway clock (0.25 s a frame), so in a time-lapse a crossing bird is at most about 8 times faster than life. Grazing drift and timetables run on the motion clock. Events are scheduled in film seconds and played on a cap of 0.5 s a frame, so a flush lasts some seconds of film and is never over in one frame [est].

### 2.2 Deer (red, roe, white-tailed)

- **Sizes.**
  - White-tailed deer: 53–120 cm at the shoulder, 95–220 cm long including a 10–37 cm tail [src](https://en.wikipedia.org/wiki/White-tailed_deer).
  - Roe deer: 63–67 cm at the shoulder, 95–135 cm long [src](https://en.wikipedia.org/wiki/Roe_deer).
  - Red deer: hinds 1–1.2 m and stags 1–1.3 m at the shoulder [src](https://bestpracticeguides.scot/deer-ecology/red-deer/).
- **Groups.**
  - Red deer groups range from 4 animals to over 100. On Rum the median hind party was 7 in summer and 5 in winter, and stag groups 7 and 4. Groups grow through the day, largest in late afternoon and evening, and small groups are "jumpier" [src](https://www.wildlifeonline.me.uk/animals/article/red-deer-behaviour-social-structure).
  - In Mediterranean habitat, mean red deer groups were 2.7 animals in summer and 5.25 in winter and spring [src](https://other.museucienciesjournals.cat/other/mz/mz-volum-16-1992/organizacion-social-del-ciervo-en-habitat-mediterraneo).
  - Roe are not gregarious. They are seen in twos and threes, and gather into small bevies in hard winters [src](https://cdn.forestresearch.gov.uk/1966/04/fclf045_1966.pdf).
- **Their day.**
  - Red deer feed in bouts about every three hours and ruminate in between. In woodland they feed mostly at dawn and dusk; on open range they move from high to low ground at dusk and back up at dawn [src](https://bestpracticeguides.scot/deer-ecology/red-deer/).
  - Roe come out to feed before sunrise and from about an hour before sunset [src](https://cdn.forestresearch.gov.uk/1966/04/fclf045_1966.pdf), and keep to cover by day [src](https://en.wikipedia.org/wiki/Roe_deer).
- **The alarm, in order.**
  - A white-tailed deer stamps its front feet, then snorts. An "explosive whistle" comes just before it turns to flee, and its tail goes up as it bounds away. A startled deer may skip every warning but the raised tail [src](https://tpwd.texas.gov/publications/nonpwdpubs/young_naturalist/animals/whitetail_body_language/).
  - Red deer stamp with a short bark that turns the herd toward the threat. Adults flee at a run; calves and hinds sometimes stott; tail-flagging is rare [src](https://www.wildlifeonline.me.uk/animals/article/red-deer-behaviour-social-structure). Hinds lead a disturbed group [src](https://bestpracticeguides.scot/deer-ecology/red-deer/).
  - Roe "slink away or squat" rather than bolt. When they do run, an "agile bouncing gait" takes them back into cover, and they bark "Boh" three or four times [src](https://cdn.forestresearch.gov.uk/1966/04/fclf045_1966.pdf), flashing the white rump [src](https://en.wikipedia.org/wiki/Roe_deer).
- **Flight-initiation distance (FID).**
  - Roe and fallow deer fled a walker at 64.7 m when the walker walked downwind (the wind carrying their scent ahead to the deer), 41.7 m walking upwind and 44.2 m in calm air, and later in dense vegetation than in open fields [src](https://agris.fao.org/search/en/records/65def2bb0f3e94b9e5d32977).
  - In mule deer, FID = 14.9 + 0.365 × alert distance, and alert distance = 5.6 + 0.821 × starting distance, for an observer walking at 1 m/s [src](https://sites.lifesci.ucla.edu/eeb-blumstein/wp-content/uploads/sites/104/2017/05/Price_etal_2014_CurrZool.pdf).
  - White-tailed deer approached by a truck had a median FID of 69 m, 40% of the starting distance [src](https://pmc.ncbi.nlm.nih.gov/articles/PMC4198184).
  - Stags kept 371 m from a hill track on busy Sundays and 286 m on quiet Wednesdays [src](https://researchonline.jcu.edu.au/42428/).
- **Speeds and gaits.**
  - White-tailed deer sprint at 60 km/h, hold 50 km/h over 5–6 km, and jump 3 m high and 9 m forward [src](https://en.wikipedia.org/wiki/White-tailed_deer).
  - Red deer run at up to 40 mph, according to a student mammal project [src](https://ougfc.montana.edu/litt/mammal_project_files_2022/Morrow%20-%20Mamm%20Final%20Project.pdf).
  - A stotting mule deer keeps its legs together, is in the air 64% of each stride, and reaches about 9.5 m/s, as fast as a gallop [src](https://wildaboututah.org/?p=1525).
- **Painter's model [est].**
  - **Graze.** The herd's home drifts at 0.05–0.15 m/s. Each deer takes a stop every 20–60 s, 1–4 m long, with its head down 70% of the time and up for 2–5 s every 10–30 s [est].
  - **Alert.** When a walker comes within FID (45 m, ×1.5 when the walker is upwind of the deer), the deer raise their heads for 1–4 s, one stamps, and the nearest turns its head toward the walker [est].
  - **Bolt.** The deer reach 10–13 m/s in about 1 s, in bounds about 0.5 s apart. White-tails raise their tails and roe flash their rumps. The herd fans out ±30° from directly away, each deer with a lag of 0–1.5 s, then closes into file behind the lead hind [est].
  - **Stop and look.** After 100–400 m they halt at cover or on a rise, turn, and watch for 5–20 s [est].
  - **Regroup.** They walk on, the herd closes up over 2–10 min, and grazing resumes [est].

### 2.3 Hares and rabbits

- **The hare by day.** A hare rests in a "form" with its ears laid flat and "lies perfectly still" when disturbed. When an enemy "comes too near" it leaps up and runs, tail held down, swerving in zig-zags at up to 35 mph. It feeds in early morning and at dusk, and moves about a field low, with its ears flat along its back [src](https://betterplaneteducation.org.uk/factsheets/hare-brown-hare-habits). Another source gives up to 70 km/h [src](https://www.gardensafari.net/en_picpages/lepus_europaeus.htm).
- **How far a hare runs.** Hares moved 422 ± 206 m (69–802 m) straight after being flushed, and 454 m when a shot was fired. Their movement was back to normal within the hour [src](https://pure.au.dk/ws/files/229257859/wlb.00840.pdf).
- **Hare against rabbit.** A hare zig-zags where a rabbit darts straight for cover. Its hind prints are about 15 cm long and fall parallel [src](https://www.northyorkmoors.org.uk/wildlife-and-habitats/mammals/Brown-hare).
- **Rabbits.**
  - Rabbits live in warrens, feed close to them at dawn and dusk, and thump a hind foot in alarm. "A flash of white from under its tail as it runs for a burrow" is itself an alarm signal [src](https://beta.ypte.org.uk/factsheets/rabbit/daily-life).
  - A cottontail's stride is 20 cm, and "can be much longer" [src](https://campus.murraystate.edu/faculty/tderting/mammalogy2001/tracks/Lagomorphs.html).
- **Unpredictable escapes.** After an attack, an escape path grows more complex and stays so for at least 10 s. It needs changes in both speed and turning, since either alone can be predicted [src](https://cob.silverchair.com/jeb/article/220/11/2076/18014/Escape-path-complexity-and-its-context-dependency).
- **Painter's model [est].**
  - **Hare.** A hare sits as a low oval with its ears flat until a walker is within 5–15 m, then bursts away at 15–19 m/s. It changes heading by ±20–60° every 0.4–1.2 s, slowing at each turn, and runs 200–800 m. Then it slows to a lope and sits up, ears raised, for 5–30 s [est].
  - **Rabbit.** A rabbit grazes within 10–20 m of its warren, in hops of 0.2–0.5 m at 1–2 a second. Alarmed, it runs straight for the burrow in 1–3 s with its white tail showing, and the others follow within 0.5 s [est].

### 2.4 Ground-feeding flocks (rooks, crows, pigeons, starlings, gulls behind a plough)

- **Rooks.** Rooks forage "striding about" on the ground. They fly direct, "with regular wingbeats and little gliding", are 44–46 cm long with a wingspan of 81–99 cm, and flock in winter with jackdaws. They gather at the rookery in the evening and disperse in the morning, up to 10 km [src](https://en.wikipedia.org/wiki/Rook_%28bird%29).
- **Airspeeds.** Rook 11.5 m/s, jackdaw 12.5, carrion crow 13.5, wood pigeon 16.3, starling 16.2, black-headed gull 11.9, herring gull 12.8 and lapwing 12.8 [src](https://nsip-documents.planninginspectorate.gov.uk/published-documents/EN010080-001847-%C3%98rsted%20Hornsea%20Project%20Three%20%28UK%29%20Ltd%20-Appendix%2020%20-%20Protocol%20S1%20-%20Alerstam%20et%20al.,%202007.pdf).
- **FID on foot.** Jackdaw 24.6 ± 14.3 m, Australian raven 25.8, gulls 16.8–24.4, pigeons and doves 8–22, house sparrow 13.2. Larger species flush farther, but the starting distance predicts FID best [src](https://blumsteinlab.eeb.ucla.edu/wp-content/uploads/sites/104/2017/05/Blumstein2006-AB.pdf).
- **Pigeon flocks.** Pigeons fly at an average of 18 m/s, 1.3 ± 1.8 m from their nearest neighbour, and a flock is wide as a turn begins and oblong as it leaves it (how a turn spreads: §3.2) [src](https://pmc.ncbi.nlm.nih.gov/articles/PMC8782486).
- **Brent geese and walkers.**
  - About a third of walkers coming within 100 m flushed the geese, and larger flocks flushed at greater distances [src](https://wildfowl.wwt.org.uk/index.php/wildfowl/article/download/540/540).
  - Three approaches in one hour flushed them at about 200, then 600, then 800 m [src](https://wildfowl.wwt.org.uk/index.php/wildfowl/article/download/540/540).
  - They resettled in dense flocks and spread out gradually; the effects rarely lasted beyond 20 minutes [src](https://wildfowl.wwt.org.uk/index.php/wildfowl/article/download/540/540).
- **Time in the air.** Waterbirds that were flushed flew for a mean of 61 s each time [src](https://www.waderstudygroup.org/article/1847/).
- **Gulls behind the plough.** A popular article, citing no studies, says ploughing turns up worms, that one gull diving in draws others, and that "thousands" can come "within minutes" [src](https://www.cprenorfolk.org.uk/discover/seagulls-how-do-they-know-when-the-tractor-is-ploughing/).
- **Swallows over the beaters.** Swallows fed on insects stirred up by starling flocks and grazing cattle, "20 cm over the ground", and lowest in rain [src](https://journals.lub.lu.se/os/article/download/22959/20427/55880).
- **Painter's model [est].**
  - **Feed.** A flock of 10–200 birds walks in bursts of 1–3 s at 0.3–0.6 m/s, pecking in bouts of 1–3 Hz. The whole flock drifts up the field at 0.05–0.2 m/s, as birds at the back hop or fly 2–10 m over the rest [est].
  - **Flush.** When a walker comes within 15–30 m, the flock lifts within 0.5–1.5 s, the edge nearest the walker first. It climbs to 5–30 m and wheels once or twice on a radius of 30–100 m at 11–16 m/s, for 20–90 s in all [est].
  - **Resettle.** It lands 50–300 m away, into the wind and close together, and spreads out over minutes [est].

### 2.5 Raptors soaring on thermals (buzzard, red kite, eagle)

- **Thermal circling, measured.** A falcon and a stork circled at radii of 20–22 m, at 9.5–10 m/s, climbing 0.9–1.4 m/s. A circle took 15.4–15.5 s at a bank of 23–26°. Between thermals they glided at 12–13 m/s, sinking 1.1–1.9 m/s [src](https://arxiv.org/pdf/0902.0312).
- **Radius and updraft.** Frigatebirds, black vultures and pelicans circle at 12–18 m. Updrafts run at 1–10 m/s, and modelled thermals are 100–300 m across [src](https://arxiv.org/pdf/1012.0434). Near the ground, thermals are small and weak and force tight turns; higher up they widen [src](https://audubon.org/news/a-closer-look-how-vultures-lazily-circle-air-1).
- **Airspeeds.** Buzzard 11.6 m/s, red kite 12.0, golden eagle 11.9, white-tailed eagle 13.6, osprey 13.3, kestrel 10.1 and sparrowhawk 11.3 [src](https://nsip-documents.planninginspectorate.gov.uk/published-documents/EN010080-001847-%C3%98rsted%20Hornsea%20Project%20Three%20%28UK%29%20Ltd%20-Appendix%2020%20-%20Protocol%20S1%20-%20Alerstam%20et%20al.,%202007.pdf).
- **Kite against buzzard.** A buzzard soars "on raised wings in a shallow 'V'", with a fanned tail, and flaps more. A kite soars "with wings bowed and not raised", glides more, and its forked tail is "constantly twisting" [src](https://yorkshireredkites.net/general/is-it-a-red-kite-or-is-it-a-buzzard).
- **Hovering.** A hovering kestrel's head moves less than 5 mm; it holds steady by reshaping its wings and tail rather than by flapping [src](https://www.bristol.ac.uk/cabot/news/2024/kestrels.html).
- **Painter's model [est].**
  - **Circle.** position(t) = centre(t) + r(cos(ωt + φ), sin(ωt + φ)), with ω = 2π/15.5 s and r = 20–25 m (tighter near the ground). The wings tilt 23–26°, and each bird circles one way or the other by its seed [est].
  - **Climb.** The bird climbs 1 m/s from about 50 m to its ceiling (cloud base, or 300–1500 m), while the centre drifts downwind at the wind's speed (`rgWind`) [est].
  - **Glide.** It then glides straight at 12 m/s, sinking 1.5 m/s, toward the next cumulus 1–5 km off. In slots: circle for 2–6 min, glide for 1–4 min [est].
  - **A kettle.** Several birds share one thermal at staggered heights, each with its own phase [est].

### 2.6 Swallows, martins and swifts

- **Speeds.**
  - Cruising: barn swallow 10.0 m/s, house martin 9.7, common swift 9.7 [src](https://nsip-documents.planninginspectorate.gov.uk/published-documents/EN010080-001847-%C3%98rsted%20Hornsea%20Project%20Three%20%28UK%29%20Ltd%20-Appendix%2020%20-%20Protocol%20S1%20-%20Alerstam%20et%20al.,%202007.pdf).
  - In screaming parties, swifts averaged 20.9 ± 5.1 m/s, peaked at 31.1 m/s, and climbed at 4.0 m/s [src](https://www.lunduniversity.lu.se/lup/publication/8b79bdb9-8fc7-4109-a422-fa617647a84c).
- **The swift.**
  - Shape: 16–17 cm long with a wingspan of 38–40 cm; its sickle wings are longer than its body, and its silhouette "resembles an anchor" [src](https://en.wikipedia.org/wiki/Common_swift).
  - Screaming parties: "10–20 swifts" gather in flight around the nesting area on summer evenings, and later in the season larger parties fly higher. They climb together in the evening and come down together at dawn [src](https://en.wikipedia.org/wiki/Common_swift).
  - Numbers: up to 2,000 feed together over flooded gravel pits [src](https://en.wikipedia.org/wiki/Common_swift).
  - Season: they arrive in the second half of April and early May, and leave from the first day with less than 17 hours of light [src](https://en.wikipedia.org/wiki/Common_swift).
- **Heights.**
  - Purple martins: a median trip height of 38 m, a median trip maximum of 88 m, and up to 1,889 m [src](https://www.nature.com/articles/srep28670).
  - Swallows beating with starlings flew 20 cm over the grass, and in rain "nearly settle" [src](https://journals.lub.lu.se/os/article/download/22959/20427/55880).
  - "When the swallows fly low, rain is on the way": before rain, insects stay low in cool, dense, humid air, though the sign "isn't foolproof" [src](https://www.farmersalmanac.com/?p=433025).
- **Painter's model [est].**
  - **Forage.** A swallow flies at 8–12 m/s, steered by noise turns of up to 2 rad/s at three incommensurate rates [est].
  - **Height by weather.** Fair: 10–80 m for swallows, 30–150 m for swifts. Cloud: 3–20 m. Wind or rain: 0.2–2 m over grass and water [est].
  - **Drink.** A swallow dips to touch the water every 20–60 s [est].
  - **Screaming party.** On clear summer evenings, from an hour before sunset, 10–20 swifts follow one path round the roofs at 20 m/s, 0.2–0.5 s apart. At dusk they climb at 4 m/s until they are gone [est].

### 2.7 Geese skeins

- **Speeds.** Greylag 17.1 m/s, barnacle 17.0, brent 17.7, Canada 16.7, mute swan 16.2 and whooper swan 17.3 [src](https://nsip-documents.planninginspectorate.gov.uk/published-documents/EN010080-001847-%C3%98rsted%20Hornsea%20Project%20Three%20%28UK%29%20Ltd%20-Appendix%2020%20-%20Protocol%20S1%20-%20Alerstam%20et%20al.,%202007.pdf).
- **Wingbeats.** Whooper swans beat at 3.56 Hz in level flight and 3.95 Hz on take-off; brent geese at 4.5–5.5 Hz [src](https://cob.silverchair.com/jeb/article-pdf/199/7/1613/3391219/jexbio_199_7_1613.pdf).
- **Spacing.**
  - Field studies measured wingtip spacings of −171 to 183 cm in Canada geese, −90 to 189 cm (mean 16.9 cm, 54 skeins) in pink-footed geese, and −100 to 160 cm in greylags. The average formation held 7–11 birds [src](https://dept.aem.umn.edu/~SeilerControl/Papers/2002/SeilerEtAl_02CDC_AnalysisOfBirdFormations.pdf). In wind, Vs show "propagated 'oscillations'" along their legs and break up and re-form more often [src](https://dept.aem.umn.edu/~SeilerControl/Papers/2002/SeilerEtAl_02CDC_AnalysisOfBirdFormations.pdf).
  - Shorebirds in a compound V keep "one wingspan to the side and one and a half of a wingspan behind" the bird ahead [src](https://www.audubon.org/magazine/why-birds-fly-v-formation-migration-science).
  - Ibises (wingspan 1.2 m) flew about 1.2 m behind the bird ahead at about 45° to it, overlapping wingtips by 0.115 m. They flapped in phase in the V and in antiphase directly behind [src](https://www.researchgate.net/profile/Steven_Portugal/publication/259766376_Upwash_exploitation_and_downwash_avoidance_by_flap_phasing_in_ibis_formation_flight/links/0046353629e2f160d9000000.pdf).
  - V angles measured in Canada geese were "much more acute than previously" thought [src](https://digitalcommons.uri.edu/theses/739). The shape "does not stay constant" [src](https://en.wikipedia.org/wiki/V_formation).
- **Height and the day.**
  - Migrating Canada geese fly "usually between 980 and 3,300 feet", at over 30 mph, calling, and take turns leading [src](https://northernwoodlands.org/pdf/tos_canada_goose_migration.pdf).
  - Pink-footed geese leave their roost at first light to feed in the fields and come back at dusk; 85,632 were counted at Montrose Basin in October 2015 [src](https://www.wildlifetrusts.org/node/4667).
  - Canvasbacks shift "from waving lines to temporary V's" [src](https://gutenberg.org/cache/epub/18884/pg18884-images.html).
- **Painter's model [est].**
  - **Leader.** The leader flies a chord at 17 m/s [est].
  - **The V.** A bird of rank k on an arm sits 1.5k wingspans back and k wingspans aside, so each arm runs 34° off the track and the V opens about 67°. Arms are unequal by the seed [est].
  - **Wobble.** Each bird drifts ±0.3 wingspan at 0.05–0.2 Hz. A wave runs down each arm, 0.5 s per rank, and flap phase lags along it the same way [est].
  - **Rotation.** Every 30–120 s the leader drops back, its rank change eased over 10 s [est].
  - **Heights and hours.** 30–150 m on dawn and dusk flights between roost and field, 300–1000 m on migration [est].
  - **Landing.** Skeins break into loose bunches, whiffle, and land into the wind [est].

### 2.8 Ducks and swans on water

- **Swimming.** A mallard swims steadily at 0.35–0.70 m/s, paddling at a constant 2.44 strokes a second. Its limit, 0.71 m/s, is the hull speed of a 0.33 m waterline; it can go faster only for a few seconds [src](https://cob.silverchair.com/jeb/article-pdf/53/3/763/3179623/jexbio_53_3_763.pdf).
- **The wake.** Each wake line runs at 19.47° from the path, "independent of" speed [src](https://en.wikipedia.org/wiki/Kelvin_wake_pattern).
- **Time budgets.** Foraging takes from 19% of the time (male pintail) to 40–60% (female mallard, teal, pintail and gadwall); resting and preening 20–34%, vigilance 8–20%, moving about 20% [src](https://www.utupub.fi/items/d64336db-3558-44e8-ae3d-0261c64cc098/full).
- **Feeding and take-off.**
  - Dabblers feed "by dabbling or tipping rather than submerging". Divers "patter along the water before becoming airborne", though a bufflehead can "fly straight up" [src](https://gutenberg.org/cache/epub/18884/pg18884-images.html).
  - Seven timed shoveler dives lasted 7–10 s [src](https://www.birdsnz.org.nz/wp-content/uploads/2011/03/Notornis_8_4_119-120.pdf).
  - Mute swans feed on the bottom while floating, with their long necks [src](https://birdsoutsidemywindow.org/?p=174189).
- **Flying and flushing.** Mallards fly at 18.5 m/s, teal 19.7, wigeon 20.6 [src](https://nsip-documents.planninginspectorate.gov.uk/published-documents/EN010080-001847-%C3%98rsted%20Hornsea%20Project%20Three%20%28UK%29%20Ltd%20-Appendix%2020%20-%20Protocol%20S1%20-%20Alerstam%20et%20al.,%202007.pdf). Ducks flush at 25–47 m, a black swan at 50 m [src](https://blumsteinlab.eeb.ucla.edu/wp-content/uploads/sites/104/2017/05/Blumstein2006-AB.pdf).
- **Painter's model [est].**
  - **Drift.** A duck drifts at 2–4% of the wind's speed plus the current, with paddling bursts of 0.2–0.5 m/s lasting 2–6 s and slow turns [est].
  - **Feed.** Head-dips last 1–3 s and up-ends 3–8 s (tail straight up, head gone), every 10–40 s [est].
  - **Wake.** Two lines at 19.5° behind it, longer the faster it swims, gone a few seconds after it stops [est].
  - **Take-off.** A dabbler springs straight up; a diver runs 5–15 m, pattering [est].

### 2.9 Herons and egrets

- **The grey heron.** It stands "motionless for long periods", resting on one leg or waiting to ambush, and also "wade[s] slowly and occasionally run[s]". It flies "with slow wingbeats on heavily bowed wings", its neck pulled in, and forages alone in territories of about 20 ha [src](https://allaboutbirds.org/guide/Gray_Heron/lifehistory).
- **Wading and waiting.** For white-faced herons, wading or walking slowly was the main way of searching. Standing to wait was used mainly in deep water and strong wind [src](https://www.birdsnz.org.nz/wp-content/uploads/2022/05/Notornis_31_4-pp285-299.pdf).
- **The strike.** It begins from "the coiled 'S'": the neck "starts off apparently slow, but then extends really, really fast". Herons can sit still "for what seems like hours" [src](https://www.audubon.org/magazine/more-you-ever-wanted-know-about-heron-necks).
- **Flight and flushing.**
  - A grey heron beats 2 times a second [src](https://hoopermuseum.carleton.ca/birds/pg4pt3.htm) and flies at 12.5 m/s [src](https://nsip-documents.planninginspectorate.gov.uk/published-documents/EN010080-001847-%C3%98rsted%20Hornsea%20Project%20Three%20%28UK%29%20Ltd%20-Appendix%2020%20-%20Protocol%20S1%20-%20Alerstam%20et%20al.,%202007.pdf).
  - FIDs: great blue heron 36.6 m, great egret 39.9, little egret 52.4 [src](https://blumsteinlab.eeb.ucla.edu/wp-content/uploads/sites/104/2017/05/Blumstein2006-AB.pdf).
- **The cattle egret.** It is 46–56 cm long with a wingspan of 88–96 cm. Beside cattle it catches prey 3.6 times as often, and it picks grazers moving "5–15 steps per minute". It follows farm machinery too [src](https://www.thainationalparks.com/species/cattle-egret).
- **Painter's model [est].**
  - **Wait.** A heron stands 30–300 s, shifting its neck once or twice [est].
  - **Wade.** One step every 2–6 s, about 0.1 m/s [est].
  - **Strike.** The neck goes out in 0.15 s, holds for 0.5 s, and the heron swallows over 1–2 s [est].
  - **Flush.** At 35–50 m it lifts with 3–5 heavy beats, flies at 2 Hz with its legs trailing, and lands 100–300 m along the shore [est].

### 2.10 Foxes

- **Gaits.** A fox's "normal travelling gait" is a direct-register trot. The side trot is "used when the animal has a destination in mind", and a lope is faster still [src](https://www.pei-untamed.com/post/canine-gaits).
- **Mousing.**
  - It walks slowly with head and tail low, freezes with ears cocked, and creeps [src](https://www.wildlifeonline.me.uk/animals/article/red-fox-diet-hunting-strategies-behaviour).
  - Then it rears and jumps at about 40° (±6°), or about 80° to break a snow crust, landing front paws first [src](https://www.wildlifeonline.me.uk/animals/article/red-fox-diet-hunting-strategies-behaviour).
  - About 32% of 434 hunts succeeded; a vixen took 4 worms a minute. Foxes are mainly nocturnal, hunting from late evening [src](https://www.wildlifeonline.me.uk/animals/article/red-fox-diet-hunting-strategies-behaviour).
- **The dive.** Foxes plunge headfirst into snow at 2–4 m/s [src](https://news.cornell.edu/node/328573).
- **Direction.** In almost 600 jumps by 84 foxes, foxes preferred to jump about 20° east of magnetic north. They killed on 73% of north-east jumps, 60% of jumps the opposite way, and 18% of all others [src](https://www.nationalgeographic.com/science/article/foxes-use-the-earths-magnetic-field-as-a-targeting-system).
- **Painter's model [est].**
  - **Rounds.** A fox trots at 2–3.5 m/s along hedges and field edges, on a timetable with legs of 100–500 m, from dusk [est].
  - **Mousing.** It walks at 0.3 m/s, freezes for 2–10 s, then pounces in a ballistic arc. At 40° and 3–4 m/s the leap is 0.9–1.6 m long and peaks at 0.2–0.34 m. At 80° (in snow) it rises 0.45–0.8 m for a leap of 0.3–0.6 m [est].
  - **Direction.** It faces about 20° east of the seed's own "north" (the ring has no magnetic field to give one) [est].

### 2.11 Bats at dusk

- **Pipistrelle.** It emerges about 20 min after sunset, earlier on warm nights. It flies "fast and jerky" at 2–10 m and weighs 4–8 g, with a wingspan of 200–235 mm [src](https://www.bats.org.uk/about-bats/what-are-bats/uk-bats/common-pipistrelle). It is usually seen 5–10 m above the ground [src](https://www.bio.bris.ac.uk/research/bats/britishbats/batpages/commonpipi.htm).
- **Noctule.**
  - It emerges 0–40 min after sunset, with a median of 5 min. Its flight is "straight but includes deep dives to chase insects and occasional glides", and it weighs 18–40 g [src](https://www.bio.bris.ac.uk/research/bats/britishbats/batpages/noctule.htm).
  - It is "generally first bat to emerge", flies "high and straight" toward its foraging areas, and has a wingspan of 320–400 mm [src](https://www.mammal.org.uk/wp-content/uploads/2022/07/Noctule-Bat-Fact-Sheet-v2.pdf).
- **Daubenton's bat.** It skims the water and catches insects with its feet. It flies at up to 24 km/h, has a wingspan of 24–27 cm, and is "often seen an hour after sunset, circling over water" [src](https://ptes.org/get-informed/facts-figures/daubentons-bat/).
- **Speeds.** Kuhl's pipistrelle commutes at 9.3 m/s and forages at 6.7 m/s [src](https://digitalcommons.usf.edu/kip_articles/9608).
- **Flying foxes.** Their wingspan is over 1.5 m. Their camps hold "tens of thousands", they cover up to 30 km a night at around 30.6 km/h, and their wings "beat slowly and powerfully" [src](https://discoverwildlife.com/animal-facts/mammals/flying-foxes).
- **Painter's model [est].**
  - **Emergence.** Noctules at sunset + 5 min, pipistrelles at + 20 min (+ 15 when warm), Daubenton's at + 45–60 min. Each species' count ramps up over 20 min [est].
  - **A beat.** Each bat flies a beat 20–80 m long along a hedge, a tree line or water, for 5–20 min. It jinks every 0.3–1 s by 30–90°, dipping 1–3 m, at 5–7 m/s [est].
  - **Weather.** No bats in rain or strong wind; all of them return toward dawn [est].

### 2.12 Dragonflies (hover and dart) and butterflies (flutter and glide)

- **Dragonfly speeds.** In the field, mean speeds were 0.4–1.9 m/s (1.6–1.7 m/s for *Anax junius*). The larger species "rarely exceeded 4 m s-1", though others have recorded 7.5 m/s for *Anax* and 10 m/s for *Aeshna* [src](https://cob.silverchair.com/jeb/article-pdf/158/1/325/3284380/jexbio_158_1_325.pdf).
- **Dragonfly wings and agility.** Wingbeats ran at 29–43 Hz and peak accelerations at 11–19 m/s². One small species spends most of its flight time hovering [src](https://cob.silverchair.com/jeb/article-pdf/158/1/325/3284380/jexbio_158_1_325.pdf).
- **Butterfly flight.** Neotropical butterflies beat at a mean of 11 Hz (6.4–13.9) and flew at 0.74–3.16 m/s, bodies near horizontal (16°), sweeping their wings through about 100°. Their "vertical oscillation" gives the "characteristic fluttering flight path" [src](https://cob.silverchair.com/jeb/article-pdf/150/1/37/2640156/jexbio_150_1_37.pdf).
- **Erratic flight.** Palatable butterflies "exhibit erratic flight" and fly faster than unpalatable ones [src](https://sicb.org/?p=34324).
- **Warmth.** A popular guide says the thorax must reach 28–40 °C before take-off, that most butterflies stay down below about 13 °C, and that monarchs glide "for minutes at a time" [src](https://www.butterflyidentification.com/butterfly-facts/butterfly-flying).
- **Monarchs.** A monarch cruises at 5 m/s [src](https://people.eecs.berkeley.edu/~ronf/MFI/TABLES/tables.html).
- **Painter's model [est].**
  - **Hawker dragonflies.** They patrol a beat 5–30 m along the water at 1–2 m/s, with darts of 0.2–0.5 s at 4–8 m/s and hovers of 1–4 s [est].
  - **Percher dragonflies.** They sit on a reed tip and sally 2–5 m out and back [est].
  - **Butterflies.** They fly forward at 1–3 m/s, bobbing 2–10 cm with each wingbeat (drawn at about a third of the true rate, with its own phase). Their heading turns ±30–90° every 0.2–1 s, and they stop at flowers for 2–20 s. Glider kinds glide 1–3 s between bursts of flapping [est].
  - **Weather.** Both fly only in sun, above about 15 °C, in light wind [est].

### 2.13 Songbirds (flitting, hopping, undulating)

- **Hops and pauses.** Painted redstarts hop about 10.8 cm, like other warbler-sized insectivores (about 10 cm), and pause for 0.54 s. Foliage gleaners pause for 2.4 s [src](https://academic.oup.com/condor/article/104/3/657/5563169).
- **Who flap-bounds.** Birds under 20 g with low-aspect wings "may flap-bound at all speeds". Birds of 35–158 g flap-glide at slow speeds and flap-bound at fast ones, and birds much over 300 g do not flap-bound [src](https://umimpact.umt.edu/en/publications/morphology-velocity-and-intermittent-flight-in-birds/). All six woodpeckers studied flap-bound, and their wingbeat frequency and phase lengths fall with mass [src](https://scholarworks.umt.edu/biosci_pubs/212).
- **One bound, measured.** Budgerigars beat at 13.2 Hz, in flapping phases of 0.73 s (about 10 beats) between pauses of 0.06 s. During a bound they dropped about 10 cm [src](https://cob.silverchair.com/jeb/article-pdf/2853086/jexbio_187_1_1.pdf).
- **Styles to tell apart.**
  - A redpoll gives a very short burst of beats, rises, then falls a long way with its wings folded, zig-zagging a little; goldfinches fly a "roller-coaster"; house sparrows barely undulate [src](https://sibleyguides.com/2011/03/identifying-small-songbirds-by-flight-style).
  - A great spotted woodpecker flies "arrow-straight, losing height in a regular undulating fashion". Blackbirds "dash low into cover when disturbed" [src](https://sussexwildlifetrust.org.uk/news/flapping-gliding-soaring-identifying-birds-by-how-they-move).
  - The spotted flycatcher sallies out and comes back to the same perch, while the pied flycatcher changes perch often [src](https://en.wikipedia.org/wiki/Hawking_%28birds%29).
- **Rates and distances.** Tits beat at 25–27 Hz and starlings at 5.1 Hz [src](https://hoopermuseum.carleton.ca/birds/pg4pt3.htm). Small passerines flush at 3.4–13 m [src](https://blumsteinlab.eeb.ucla.edu/wp-content/uploads/sites/104/2017/05/Blumstein2006-AB.pdf).
- **Painter's model [est].**
  - **In a tree.** Each tree has a few perches, by its seed. A bird hops to a neighbouring perch every 0.5–3 s [est].
  - **Flitting.** It crosses to the next bush, 5–30 m away, in bounds: 3–6 beats (0.2–0.4 s), then a fall of 0.1–0.5 m with wings closed (0.2–0.5 s). A party of finches crosses together, with lags [est].
  - **Sallies.** A flycatcher sallies 2–8 m out and back in 1–2 s [est].
  - **On a lawn.** A thrush runs 0.5–2 m, stops 1–3 s with its head cocked, and pecks [est].

### 2.14 The numbers in one table

| Kind | Cruise | Wingbeat or gait | Flushes at | After flushing |
|---|---|---|---|---|
| Deer | graze 0.05–0.15 m/s [est]; sprint 60 km/h [src](https://en.wikipedia.org/wiki/White-tailed_deer) | bound; stott 9.5 m/s [src](https://wildaboututah.org/?p=1525) | 42–65 m [src](https://agris.fao.org/search/en/records/65def2bb0f3e94b9e5d32977) | 100–400 m, then look back [est] |
| Hare | sprint to 70 km/h [src](https://www.gardensafari.net/en_picpages/lepus_europaeus.htm) | zig-zag [src](https://betterplaneteducation.org.uk/factsheets/hare-brown-hare-habits) | 5–15 m [est] | 422 ± 206 m [src](https://pure.au.dk/ws/files/229257859/wlb.00840.pdf) |
| Rook, crow | 11.5–13.5 m/s [src](https://nsip-documents.planninginspectorate.gov.uk/published-documents/EN010080-001847-%C3%98rsted%20Hornsea%20Project%20Three%20%28UK%29%20Ltd%20-Appendix%2020%20-%20Protocol%20S1%20-%20Alerstam%20et%20al.,%202007.pdf) | regular beats [src](https://en.wikipedia.org/wiki/Rook_%28bird%29) | about 25 m [src](https://blumsteinlab.eeb.ucla.edu/wp-content/uploads/sites/104/2017/05/Blumstein2006-AB.pdf) | wheel 20–90 s [est] |
| Pigeon | 16–18 m/s [src](https://pmc.ncbi.nlm.nih.gov/articles/PMC8782486) | 1.3 m apart [src](https://pmc.ncbi.nlm.nih.gov/articles/PMC8782486) | 8–22 m [src](https://blumsteinlab.eeb.ucla.edu/wp-content/uploads/sites/104/2017/05/Blumstein2006-AB.pdf) | wheel, resettle [est] |
| Gull | 11.9–13.4 m/s [src](https://nsip-documents.planninginspectorate.gov.uk/published-documents/EN010080-001847-%C3%98rsted%20Hornsea%20Project%20Three%20%28UK%29%20Ltd%20-Appendix%2020%20-%20Protocol%20S1%20-%20Alerstam%20et%20al.,%202007.pdf) | 2.8 Hz [src](https://hoopermuseum.carleton.ca/birds/pg4pt3.htm) | 17–24 m [src](https://blumsteinlab.eeb.ucla.edu/wp-content/uploads/sites/104/2017/05/Blumstein2006-AB.pdf) | land into the wind [src](https://www.naturalnavigator.com/news/2014/01/the-seagull-windvane/) |
| Buzzard, kite | 11.6–12.0 m/s [src](https://nsip-documents.planninginspectorate.gov.uk/published-documents/EN010080-001847-%C3%98rsted%20Hornsea%20Project%20Three%20%28UK%29%20Ltd%20-Appendix%2020%20-%20Protocol%20S1%20-%20Alerstam%20et%20al.,%202007.pdf) | circle r 21 m in 15.5 s [src](https://arxiv.org/pdf/0902.0312) | not modelled | glide 12–13 m/s [src](https://arxiv.org/pdf/0902.0312) |
| Swallow, swift | 9.7–10 m/s; parties 20.9 [src](https://www.lunduniversity.lu.se/lup/publication/8b79bdb9-8fc7-4109-a422-fa617647a84c) | erratic [est] | not modelled | not modelled |
| Goose, swan | 16.2–17.7 m/s [src](https://nsip-documents.planninginspectorate.gov.uk/published-documents/EN010080-001847-%C3%98rsted%20Hornsea%20Project%20Three%20%28UK%29%20Ltd%20-Appendix%2020%20-%20Protocol%20S1%20-%20Alerstam%20et%20al.,%202007.pdf) | 3.6–5.5 Hz [src](https://cob.silverchair.com/jeb/article-pdf/199/7/1613/3391219/jexbio_199_7_1613.pdf) | 100–800 m (brent) [src](https://wildfowl.wwt.org.uk/index.php/wildfowl/article/download/540/540) | about 61 s aloft [src](https://www.waderstudygroup.org/article/1847/) |
| Duck | swim 0.35–0.7 m/s [src](https://cob.silverchair.com/jeb/article-pdf/53/3/763/3179623/jexbio_53_3_763.pdf) | 2.44 strokes/s [src](https://cob.silverchair.com/jeb/article-pdf/53/3/763/3179623/jexbio_53_3_763.pdf) | 25–47 m [src](https://blumsteinlab.eeb.ucla.edu/wp-content/uploads/sites/104/2017/05/Blumstein2006-AB.pdf) | fly 18.5–20.6 m/s [src](https://nsip-documents.planninginspectorate.gov.uk/published-documents/EN010080-001847-%C3%98rsted%20Hornsea%20Project%20Three%20%28UK%29%20Ltd%20-Appendix%2020%20-%20Protocol%20S1%20-%20Alerstam%20et%20al.,%202007.pdf) |
| Heron | wade about 0.1 m/s [est]; fly 12.5 m/s [src](https://nsip-documents.planninginspectorate.gov.uk/published-documents/EN010080-001847-%C3%98rsted%20Hornsea%20Project%20Three%20%28UK%29%20Ltd%20-Appendix%2020%20-%20Protocol%20S1%20-%20Alerstam%20et%20al.,%202007.pdf) | 2 Hz [src](https://hoopermuseum.carleton.ca/birds/pg4pt3.htm) | 37–52 m [src](https://blumsteinlab.eeb.ucla.edu/wp-content/uploads/sites/104/2017/05/Blumstein2006-AB.pdf) | 100–300 m along the shore [est] |
| Bat | 6.7 foraging, 9.3 commuting [src](https://digitalcommons.usf.edu/kip_articles/9608) | jerky [src](https://www.bats.org.uk/about-bats/what-are-bats/uk-bats/common-pipistrelle) | not modelled | not modelled |
| Dragonfly | 0.4–1.9 m/s, darts to 4+ [src](https://cob.silverchair.com/jeb/article-pdf/158/1/325/3284380/jexbio_158_1_325.pdf) | 29–43 Hz [src](https://cob.silverchair.com/jeb/article-pdf/158/1/325/3284380/jexbio_158_1_325.pdf) | not modelled | not modelled |
| Butterfly | 0.74–3.16 m/s [src](https://cob.silverchair.com/jeb/article-pdf/150/1/37/2640156/jexbio_150_1_37.pdf) | 6.4–13.9 Hz [src](https://cob.silverchair.com/jeb/article-pdf/150/1/37/2640156/jexbio_150_1_37.pdf) | not modelled | not modelled |
| Small songbird | 12.8–14.5 m/s [src](https://nsip-documents.planninginspectorate.gov.uk/published-documents/EN010080-001847-%C3%98rsted%20Hornsea%20Project%20Three%20%28UK%29%20Ltd%20-Appendix%2020%20-%20Protocol%20S1%20-%20Alerstam%20et%20al.,%202007.pdf) | bounds; 25 Hz in tits [src](https://hoopermuseum.carleton.ca/birds/pg4pt3.htm) | 3.4–13 m [src](https://blumsteinlab.eeb.ucla.edu/wp-content/uploads/sites/104/2017/05/Blumstein2006-AB.pdf) | into cover, low [src](https://sussexwildlifetrust.org.uk/news/flapping-gliding-soaring-identifying-birds-by-how-they-move) |

## 3. How games make ambient wildlife convincing and cheap

### 3.1 Spawning by biome near the player

- **Horizon Zero Dawn.** Its GPU placement builds "fully-fledged environments while the player walks through them, complete with sounds, effects, wildlife and game-play elements" [src](https://www.guerrilla-games.com/read/gpu-based-procedural-placement-in-horizon-zero-dawn).
- **Red Dead Redemption 2.** It has "more than 200 species of animal in a variety of habitats". Deer, bison and pronghorn cross the plains in herds, "birds of prey soar on thermals", and deer "react to unseen predators", warning the player of cougars in the grass [src](https://salford-repository.worktribe.com/OutputFile/1374100). Its animation director gave a GDC 2020 talk on how its "virtual ecosystem" was planned, though only the summary was read for this doc [src](https://gdconf.com/article/learn-how-rockstar-breathed-life-into-the-wildlife-of-red-dead-redemption-2-at-gdc/).
- **Microsoft Flight Simulator.** Players report that animals "spawn randomly during the flight within very large areas" from a density map, that some species sit in the wrong ranges, and that deer by a runway "ran off when I approached". These are user reports, not the developer's [src](https://forums.flightsimulator.com/t/fauna-update/696801).
- **Far Cry 5.** Its biome recipes place each plant species for "its own reason for growing at any specific location" [src](https://blog.eu.playstation.com/2018/03/22/how-the-stunning-open-world-of-far-cry-5s-hope-county-montana-was-created/). No source on its ambient birds was found (§7).
- **What we take [est].** One roll per candidate place picks a kind or nothing, as products of the land's fields, the way the placing table in docs/prior-art/painted-ringworld-2.md does. Wildlife is just one more class of thing in that roll.

### 3.2 Flee and scatter

- **Half-Life 2.** Its crow is "a simple ambient crow that flies away when it hears gunfire or when anything gets too close to it", flying to the nearest "fly to" hint node [src](https://developer.valvesoftware.com/wiki/Npc_crow).
- **A student game.** Its birds each fly to the point opposite the player, rising as they go: "Each individual bird needs to fly away from the player in a different direction" [src](https://hookedfeelings.itch.io/dungeon-siege-project/devlog/100759/bird-ai-and-inheritance).
- **Sea of Thieves.** Its gulls fly alongside ships and scatter when they sense danger [src](https://seaofthieves.wiki.gg/wiki/Seagulls).
- **Horizon Forbidden West.** Its Watchers "patrol larger herds and scan for potential threats", and machines make distinct sounds when idle, when alerting others and when attacking [src](https://blog.playstation.com/?p=356418).
- **Pigeons under attack.** A few initiators turn first, their neighbours turn toward them, and the turn spreads from the inner edge of the flock to the outer [src](https://pmc.ncbi.nlm.nih.gov/articles/PMC8782486).
- **What we take [est].** Every flush in §2 uses a per-animal heading away from the threat with jitter (§2.1), and the birds nearest the threat lift first, each neighbour a fraction of a second after the last.

### 3.3 Flocks

- **Reynolds' boids.** Three rules in strict priority: avoid collisions, match velocity, stay near flockmates. Each boid perceives only its neighbours, so flocks "bifurcate" round obstacles and merge again. The cost grows with the square of the flock: 80 boids took about 95 seconds a frame on a Lisp Machine. Scripting works by a "migratory" goal that leads the flock [src](https://my.eng.utah.edu/~cs6665/Reynolds-1987-FHS.pdf).
- **Batman Returns (1992).** Its bats were boids given per-shot "directional goals". A box just outside the frame sent a bat leaving one side back in at the other ("bat teleportation"). Leopard-like spots kept detail under motion blur, and ears were drawn taller [src](https://beforesandafters.com/2022/04/07/a-history-of-cg-bird-flocking/).
- **Sea of Thieves.** Large circling flocks of gulls mark shipwrecks and small ones barrels; each flock size has its own count and circling radius [src](https://seaofthieves.wiki.gg/wiki/Seagulls).
- **What we take [est].** Boids need memory from frame to frame; the delayed-path flock of §2.1 gives the same ribbon of turns and bunching with none. Real boids could still be run once, offline, for a hero murmuration and kept as a path.

### 3.4 Level of detail (LOD) for distant animals

- **Unreal's Mass.** It has four LOD values (High, Medium, Low, Off), each with distances and a cap on numbers. The far representation is an instanced static mesh, the cheapest of the four, and the LOD checks visibility as well as distance [src](https://dev.epicgames.com/documentation/unreal-engine/overview-of-mass-gameplay-in-unreal-engine?lang=es-ES).
- **Mass battles.** Developers guess that distant soldiers are "billboarded as animated sprites", and that "the farther away they are the less animated they become" [src](https://discussions.unity.com/t/how-does-uebs-get-a-million-troops-on-the-field-simultaneously/661025).
- **Kingdom Come: Deliverance II.** It keeps nearly 2,400 NPCs on its map at 60 fps, using new "level of detail of the AI simulation" [src](https://schedule.gdconf.com/session/supporting-thousands-of-npcs-in-kingdom-come-deliverance-kingdom-come-deliverance-ii/915120).
- **ABZU.** It puts "a swarm of 10,000 fish" on screen in up to 100 schools, voiced by about 4 sounds per school [src](https://www.audiokinetic.com/fr/blog/abzu_game_audio).
- **What we take [est].** Far off, a flock is a cloud of dots (the murmuration's way). At middle distance each creature is a flat shape with 2–4 poses. Near, it gets its gait cycle. And each tier of LOD changes only how much is drawn, never where the animal is.

### 3.5 Motion that is deterministic or follows a schedule

- **ABZU.** Its fish were "animated using mathematical motion in their materials", which is what let it render "schools of tens of thousands of fish" [src](https://80.lv/articles/interview-with-the-creative-director-of-abzu/).
- **The Godot version.** The same technique adds a per-instance value to time, so fish sit at different points of the swim cycle, and scales each fish's speed from 50% to 150%. Without that, the school moves in lockstep and looks robotic [src](https://docs.godotengine.org/de/4.3/_sources/tutorials/performance/vertex_animation/animating_thousands_of_fish.rst.txt).
- **Noise-based random numbers.** A noise function replaces a random-number generator, giving "unordered access, better reseeding, record/playback ... lock-free parallelization" [src](https://gdcvault.com/play/1024365/Math-for-Game-Programmers-Noise). This app's `mnHash` and `mulberry32` already work this way [est].
- **Timetables.** Stardew Valley and Skyrim timetables are covered in docs/prior-art/ringworld-life-and-views.md §1 [est].

### 3.6 What reads at a distance

- **Jizz.** Birders call a bird's overall impression its "jizz", read from shape, posture, flight style and "habitual movements". It often names the family rather than the species [src](https://en.wikipedia.org/wiki/Jizz_%28birding%29).
- **Biological motion.** Johansson showed in 1973 that a few moving dots at a person's joints are read as a person in motion [src](https://en.wikipedia.org/wiki/Biological_motion_perception).
- **Ducks at a Distance.** Flock patterns tell kinds apart: mallards "form loose groups", teal "flash by in small, compact bunches", and scoters string "into irregular, wavy lines" [src](https://gutenberg.org/cache/epub/18884/pg18884-images.html).
- **Ghost of Tsushima.**
  - Golden birds and foxes "lead you to special landmarks or activities" [src](https://www.playstation.com/en-gr/editorial/ghost-of-tsushima-beginners-guide/).
  - "The goal was that everything was moving in the frame if possible" [src](https://www.techradar.com/news/ghost-of-tsushima-interview-nature-sprawls-in-ps4s-epic-samurai-swan-song).
  - Its wind drives cloth, grass and "hundreds of thousands of particles" [src](https://gdconf.com/news/see-how-ghost-tsushima%E2%80%99s-guiding-wind-came-life-gdc-2021), with "upwards of 60,000" leaf particles common [src](https://vfxvoice.com/creating-the-way-of-the-warrior-for-ghost-of-tsushima/).
- **Firewatch.** Its birds mostly live in the soundscape: "nothing but the birds tweeting and wind blowing" [src](https://www.thesoundarchitect.co.uk/firewatch/).

## 4. Small silhouettes: what makes each one recognizable a few pixels tall

- **Simplify to the iconic.** ABZU's team chose "the most iconic elements of each species" to "convey the essence of the creature", balancing "visual noise versus clarity" [src](https://80.lv/articles/interview-with-the-creative-director-of-abzu/).
- **How big things are on the page.** For a 60° view across the 3072 px export, one metre spans about 2660/d px at a distance of d m: 27 px at 100 m, 5.3 px at 500 m, 2.7 px at 1 km [est]. A rook's 81–99 cm wingspan [src](https://en.wikipedia.org/wiki/Rook_%28bird%29) is then about 2.4 px at 1 km, and a swift's 38–40 cm [src](https://en.wikipedia.org/wiki/Common_swift) about 1 px [est]. Past that distance, flocks are clouds of dots and single birds are flecks that move [est].
- **Wingbeats against the frame rate.** At 30 fps a beat needs about four frames to read as up and down, which is beats of 7.5 Hz or slower: herons (2 Hz), gulls (2.8 Hz), swans and geese (3.6–5.5 Hz) and starlings (5.1 Hz). Faster wings (tits at 25 Hz, dragonflies at 29–43 Hz, butterflies at about 11 Hz) are drawn as a soft blur or as two poses blended by phase, never a hard flicker between frames [est].

| Kind | What identifies it | In flat shapes [est] |
|---|---|---|
| Deer | white-tail's raised tail as it bounds [src](https://tpwd.texas.gov/publications/nonpwdpubs/young_naturalist/animals/whitetail_body_language/); roe's white rump [src](https://en.wikipedia.org/wiki/Roe_deer); stott with legs together [src](https://wildaboututah.org/?p=1525) | a level body block on four thin legs; neck down when grazing, up at 45° when alert; ears as two ticks; one pale mark at the rump when fleeing |
| Hare | ears flat in the form; low with ears along the back [src](https://betterplaneteducation.org.uk/factsheets/hare-brown-hare-habits) | a crouched oval; sitting up, two tall ears; running, a long stretched shape |
| Rabbit | white tail flashing as it runs [src](https://beta.ypte.org.uk/factsheets/rabbit/daily-life) | a smaller rounder hump; one white dot at the back while it runs |
| Rook | strides; direct flight, regular beats [src](https://en.wikipedia.org/wiki/Rook_%28bird%29) | black body and black wings; walking, not hopping |
| Gull | faces into the wind [src](https://www.naturalnavigator.com/news/2014/01/the-seagull-windvane/); slow 2.8 Hz beats [src](https://hoopermuseum.carleton.ca/birds/pg4pt3.htm) | white with a grey back; long wings bent at the wrist (already drawn) |
| Buzzard | shallow V, fanned tail [src](https://yorkshireredkites.net/general/is-it-a-red-kite-or-is-it-a-buzzard) | broad wings tipped up a little; short fan of a tail |
| Red kite | bowed wings; forked tail always twisting [src](https://yorkshireredkites.net/general/is-it-a-red-kite-or-is-it-a-buzzard) | long angled wings; a forked tail that tilts with the clock |
| Vulture, eagle | turkey vulture's bold dihedral and rocking; eagles' flat "slab-like" wings [src](https://www.hmana.org/wp-content/uploads/2021/10/Eastern-Migrant-Raptor-Flight-Guide-2021.pdf) | a long plank of a wing, held up in a V or flat; ±5° of rocking |
| Kestrel | hovers with its head still [src](https://www.bristol.ac.uk/cabot/news/2024/kestrels.html) | a small cross pinned in the air; only the wingtips and tail move |
| Swift | anchor silhouette; sickle wings longer than the body [src](https://en.wikipedia.org/wiki/Common_swift) | a crescent with a short body; in parties, chains of them |
| Tern | deeply forked tail; plunges from 1–6 m [src](https://www.mass.gov/info-details/common-tern) | a thin white angle over the water; the dive is a vertical stroke |
| Goose | skeins in V's that never hold still [src](https://en.wikipedia.org/wiki/V_formation) | a necked dash per bird, in a wobbling V |
| Heron | neck pulled in, bowed wings, slow beats [src](https://allaboutbirds.org/guide/Gray_Heron/lifehistory) | standing: a tall grey stroke; flying: a hunched crescent with trailing legs |
| Woodpecker, finch | regular undulations; roller-coaster [src](https://sussexwildlifetrust.org.uk/news/flapping-gliding-soaring-identifying-birds-by-how-they-move) | a dot on a path of shallow scallops |
| Bat | jerky [src](https://www.bats.org.uk/about-bats/what-are-bats/uk-bats/common-pipistrelle); noctule high and straight with dives [src](https://www.bio.bris.ac.uk/research/bats/britishbats/batpages/noctule.htm) | a dark W against the dusk sky, jinking; tall ears near |
| Butterfly | vertical bob; fluttering path [src](https://cob.silverchair.com/jeb/article-pdf/150/1/37/2640156/jexbio_150_1_37.pdf) | two coloured petals on a bobbing path |
| Dragonfly | hovers, then darts [src](https://cob.silverchair.com/jeb/article-pdf/158/1/325/3284380/jexbio_158_1_325.pdf) | a thin stroke with a glint of wing; still, then elsewhere |

## 5. The kinds a seed and a biome choose among

### 5.1 Real kinds, by biome

- **Temperate fields and woods.** Red and roe deer, hares and rabbits, rooks and jackdaws, pigeons, starlings with their dusk murmurations, buzzards and kites, kestrels, swallows and swifts, finches and woodpeckers, foxes, pipistrelles and noctules, and butterflies (§2) [est].
  - Murmurations average 30,082 birds (up to 750,000) and last a mean of 26 min. They run from October to March, largest in early February, and with a raptor present tend to end with the birds "descending en masse" [src](https://eprints.glos.ac.uk/4726/1/Birds%20of%20a%20feather%20flock%20together.pdf).
- **Wetlands and coasts.** Herons and egrets, ducks and swans, geese, gulls, Daubenton's bats and dragonflies [est].
  - Common terns plunge from 1–6 m, gather in up to about 1,000 over fish, and display in "high flights" of 30–100 m [src](https://www.mass.gov/info-details/common-tern).
  - Sanderlings run "relentlessly chasing waves up and down a beach", and common sandpipers bob their rear ends [src](https://sussexwildlifetrust.org.uk/news/flapping-gliding-soaring-identifying-birds-by-how-they-move).
- **Dry country.** Pronghorn, vultures, kestrels, and cattle egrets among grazers (§2.9) [est].
  - Pronghorn run 88.5 km/h for 800 m and 56 km/h for 6.5 km. Their rump hair "flares open" in alarm, and they go "under fences" rather than over [src](https://en.wikipedia.org/wiki/Pronghorn).
- **The cold north.** Geese, foxes in the snow (§2.10), and caribou and muskoxen [est].
  - Caribou groups are smallest in winter and at calving and largest under biting insects in July, when one group held about 10,000 animals, over 30% of its herd [src](https://www.nps.gov/articles/000/caribou-group-size.htm).
  - Muskoxen "run together", face the threat, and against a pack "form a tight circle, all facing outward", calves inside [src](https://www.nps.gov/gaar/learn/nature/muskox-circle-defense.htm).
- **Jungle.** Parrots, flying foxes (§2.11) and butterflies (§2.12) [est].
  - Amazon parrots are most active shortly after sunrise, with a second peak after a midday lull. Most species fly in groups of one to four, which suggests pairs and families, and macaws can be counted at up to 300 m [src](https://atrium.andesamazon.org/biblio_display_info.php?id=813).

### 5.2 Invented creatures for the fantasy and sci-fi worlds, on the same motion models [est]

- **Luminous moths** (magic, at night): the butterfly model at 0.5–1.5 m/s with a cold glow that swells and fades on the film clock, never blinks. They are drawn to lanterns and lit windows and circle a light 0.5–2 m out; this extends the fireflies already in `rgSmallLife` [est].
- **Sky-rays** (magic, sci-fi; noon and afternoon): the raptor's thermal model at 2–4 times the size, wings rippling as a single slow wave (0.2–0.4 Hz) instead of flapping. They kettle in threes under cumulus and glide off to the next [est].
- **Crystal-backed grazers** (magic, ruins): the deer herd model, with a back of facets that catches the sun. A flush makes a scatter of glints moving across the field, which reads at 1 km where the bodies do not [est].
- **Rim-wall gliders** (any world with walls): seabirds that ride the updraft along the ring's rim walls, circling up the wall face and gliding far across the band; the Ringworld's own albatross [est].
- **Spinward swifts** (cities, builders): the screaming-party model round towers and spires at dusk; in neon cities they trail a faint line of light [est].
- **Ley-moths** (magic): butterflies that keep to a ley road (the magic world's road), drifting along it in loose strings [est].
- **Drone flocks** (builders, neon): the pigeon model with a hard, square turn and synchronised "flaps" of light. They roost on masts, all facing the wind like gulls [est].
- **Lantern herons and shell grazers** (magic, wilds): the bots proposed in docs/prior-art/painted-ringworld-2.md, moved by the heron (§2.9) and grazing (§2.2) models [est].
- **Drift-jellies** (magic, sci-fi; calm evenings): gas-floats that rise and drift with the wind at its speed, pulsing their bells at 0.3 Hz. They sink to the water at dawn [est].

## 6. What this app can do that others don't [est]

- **Every frame reproducible.** Every creature is a function of its seed and the film's clocks, so any frame of a film can be painted alone and again, and a still shows a moment of the same scene. A game evaluates the same functions with the player as one more walker, using the backward search of §2.1 [est].
- **Animals that answer the weather and the hour.**
  - Bats appear at their species' own minutes after sunset (§2.11) [est].
  - Swallows fly low before and during rain, drawing on the lore (§2.6) [est].
  - Swifts hold screaming parties only on clear summer evenings [est].
  - Butterflies and dragonflies fly only in sun and warmth [est].
  - Raptors kettle under the day's cumulus and drift downwind with them (§2.5) [est].
  - Geese go out at dawn and come back at dusk, and land into the wind [est].
  - Perched and standing birds all face the wind, or face every way in calm air ("a sign of light variable winds") [src](https://www.naturalnavigator.com/news/2019/11/birds-and-weather-signs/).
- **Interactions nobody asked for** [est].
  - Gulls behind the plough, as now, but some walk the fresh furrow and lift when the tractor turns at the headland [est].
  - Swallows skim low over grazing cattle and feeding starlings, picking off the insects they stir up [src](https://journals.lub.lu.se/os/article/download/22959/20427/55880); on the ring, over the sheep too [est].
  - Cattle egrets choose the slow grazers, at 5–15 steps a minute [src](https://www.thainationalparks.com/species/cattle-egret).
  - Rooks lift when a walker passes within 25 m, wheel, and settle farther up the field; deer raise their heads at 60 m and bolt at 45 m [est].
  - A fox mouses at dusk, always facing the seed's north-east [est].
  - When a sparrowhawk or falcon works a murmuration, the flock grows larger and stays up longer, then ends by descending en masse rather than dispersing [src](https://eprints.glos.ac.uk/4726/1/Birds%20of%20a%20feather%20flock%20together.pdf).
  - A heron lifts as a boat passes; gulls follow a fishing boat home; a kestrel hovers over the verge of a road [est].
- **Scale for free.** A herd, a skein or a kettle of known size is a ruler laid on the land: a V of 9 geese with 1.6 m wings spans about 13 m, and a thermal circle about 42 m [est].
- **Safe and still where it must be.** A flush plays over seconds, never in one frame; small lights (moths, drones) swell and fade; and nothing large brightens suddenly [est].
- **Where to start** [est].
  - First, a wandering home and longer stops for the sheep, and a flock with flush events for rooks and gulls (§2.1, §2.4) [est].
  - Then raptors and swallows, which fill the empty day sky [est].
  - Then deer and hares, with triggers from the walkers already on timetables [est].
  - Then geese, herons, ducks, bats and insects, by biome (§5) [est].

## 7. Gaps

- **Pages that could not be read.**
  - The full roe and fallow deer flight-distance paper (blocked by bot protection; its abstract was read through AGRIS).
  - "Stick or twist" on roe deer flight (blocked).
  - Vultures varying their bank angle in near-ground thermals (blocked).
  - Two PMC articles behind a CAPTCHA.
  - The Horizon Zero Dawn placement slides (failed to load).
  - The God is a Geek page on RDR2's wildlife (failed to load).
  - Mute swans' foraging in Chesapeake Bay (blocked).
  - Gould and Heppner's V angles in degrees, and Tobalske's woodpecker numbers (their SORA pages redirect elsewhere).
  - Wikipedia's red deer page (a permission request timed out).
- **Not found.**
  - A primary source on Breath of the Wild's animals fleeing; only its chemistry-engine rules were read [src](https://www.thumbsticks.com/gdc-17-breath-of-the-wild-science-lies).
  - Anything on Far Cry's ambient birds.
  - The content of the RDR2 GDC talk.
  - Measured durations of a duck's up-end, a rabbit's hop rate, a fox's trotting speed, a bat's wingbeat, and a heron's strike in milliseconds. These appear above as [est].
- **Weak sources, used with care.** The 40 mph for red deer is from a student project. Gulls finding the plough comes from a popular article citing no studies. The butterfly temperatures are from a popular guide. The Flight Simulator animals are players' reports [est].

## 8. Bigger, fewer, more colourful birds

Ruby, 2026-10-25: "Can we increase the size of and diversity of birds (and colors, shading, etc) and reduce their number
overall?"

- Eurasian jay: "a length of 34–35 cm … and a wingspan of 52–58 cm", "light rufous brown to a pinkish brown body
  plumage", "a prominent bright blue patch with fine black bars" on the wing, "The tail is mainly black"
  [src](https://en.wikipedia.org/wiki/Eurasian_jay).
- European goldfinch: "12–13 cm … long", wingspan "21–25 cm"; "a red face", black wings with a "broad yellow bar",
  "Warm brown upperparts" and "white underparts with buff flanks"; in winter "flocks of up to 40"
  [src](https://en.wikipedia.org/wiki/European_goldfinch).
- Eurasian magpie: "44–46 cm … in length, more than half of which is the tail", wingspan "52–62 cm"; head, neck and
  breast "glossy black with a metallic green and violet sheen", belly and shoulders "pure white"
  [src](https://en.wikipedia.org/wiki/Eurasian_magpie).
- Rose-ringed parakeet: about 40 cm, "vibrant green plumage", "red beak", "highly social", "often seen in noisy
  flocks", in "cities, plantations, woodlands, and farmlands" [src](https://bigbird.alibaba.com/guides/rose-ringed-parakeet).
- European robin: "12.5–14.0 cm long", wingspan "20–22 cm", "an orange breast and face", upperparts "brownish", belly
  "whitish" [src](https://www.jungledragon.com/specie/72/european-robin.html).
- Great egret: "over 4 feet in height", wingspan "more than 50 inches", "stout yellow bill", black legs; flies
  "slowly and with its neck retracted"; hunts standing or walking slowly in shallow water
  [src](https://www.nps.gov/ever/learn/nature/greategret.htm).
- So in the painter [est]: half as many flocks over the land and fewer birds near you, each drawn larger again (2.4
  times life, as a painter puts birds where they will read). Each kind by its field marks (`WK_KINDS`: breast, wing,
  patch, face, tail, bill), its body shaded round (lit along its back, its breast's colour under it), its wing folded
  with its patch or beating with its patch near the shoulder and darker tips (`wkSongbirdUp`, `wkSongbirdDown`).
  Parakeets where it is warm and in town, goldfinches over the meadows, magpies and jays at the woods' edges, robins
  near cover; egrets beside herons at warm water; the rooks, starlings, pigeons and sparrows given their own marks too.

## 9 · The hunters, small and middling

Ruby, 2026-10-25: "can we introduce a wider diversity of wildlife, medium and small predators, fantastic life,
interesting weathers". (The fantastic ones are in docs/prior-art/ringworld-magic-creatures.md §3–6, the weathers in
docs/prior-art/ringworld-weather.md §4.)

- Stoat: body 24–32 cm, tail 9–14 cm; "orangey-brown" back, creamy white throat and belly, black-tipped tail; in cold
  country "almost completely white" in winter but for the black tip (ermine); a "distinctive bounding gait, arching its
  back as it moves"; active "both by day and by night"; grassland, heath, farmland, woodland
  [src](https://www.wildlifetrusts.org/node/25). Its tail "around half the length of its body"
  [src](https://www.woodlandtrust.org.uk/blog/2019/02/stoat-or-weasel-how-to-tell-the-difference/).
- European badger: body 60–90 cm, shoulder 25–30 cm, tail 12–24 cm; silvery-grey back, black legs and chest, two black
  head bands and a "wide, white band" from nose to crown; mainly nocturnal and crepuscular; woodland, clearings,
  pasture, scrub; short-legged, but it "can run at full gallop" [src](https://en.wikipedia.org/wiki/European_badger).
- Eurasian lynx: body 73–106 cm, shoulder 55–75 cm, a "short 'bobbed' tail with an all-black tip", black ear tufts,
  reddish or brown with black spots; "mainly nocturnal or crepuscular", solitary; boreal and montane forest; "mainly an
  ambush predator", "stalking, sneaking and jumping on prey" [src](https://en.wikipedia.org/wiki/Eurasian_lynx).
- Grey wolf: 1.0–1.3 m nose to tail, shoulder 60–90 cm, tail 35–52 cm, grey, brown and cinnamon; travels at about
  8 km/h; packs of 2–36, "most have 5 to 9"; tundra, taiga, forest, prairie, arid land
  [src](https://animaldiversity.org/site/accounts/information/Canis_lupus.html).
- Golden jackal: body 80–105 cm, golden to yellow-brown, alone, in pairs or small packs, "primarily nocturnal"
  [src](https://www.kora.ch/en/species/golden-jackal/profile); the coyote, its dry-country cousin, "freezes with stiff
  legs, then pounces" on mice [src](https://www.azgfd.com/species/coyote/).
- Barn owl: wingspan 89 cm, a "pure white underside", a white heart-shaped face [src](https://www.wildlifetrusts.org/wildlife-explorer/birds/birds-prey/barn-owl);
  it "slowly and deliberately flies in lines above a field", hovers, drops onto its prey, seen "within the hours
  either side of dawn and dusk" [src](https://www.lancswt.org.uk/node/5894).
- Kestrel: wingspan 76 cm, the male's head and tail grey, his back ginger-brown
  [src](https://www.lancswt.org.uk/wildlife-explorer/birds/birds-prey/kestrel); it hovers into a light headwind and
  "fans out" its tail [src](https://gwct.org.uk/wildlife/species-of-the-month/2021/common-kestrel/); measured
  wind-hovering at 9.1 ± 2.8 m up, in winds of 5–11 m/s
  [src](https://cob.silverchair.com/jeb/article/155/1/519/6382/Field-Measurements-Of-Hanging-Flight-Aerodynamics).
- How few: "every kilogram of meat-eating mammal needs 111 kilograms of prey" (Carbone and Gittleman, 2002)
  [src](https://innovations-report.com/life-sciences/report-8728). Skyrim's wolves come alone or up to three, and
  players "hear their howls before they are spotted" [src](https://content2.uesp.net/wiki/Skyrim:Animals); Breath of the
  Wild ties each wolf to its region (forest, desert, snow) [src](https://zelda-archive.fandom.com/wiki/Wolf).
- So in the painter [est]: five hunters on the ground and two in the air, each a few strokes in profile by its own form
  (`WK_HUNT`, `wkHunter`): its back's height and chest, its legs, its ears (a badger's and stoat's small and round, a
  wolf's pointed, a jackal's tall, a lynx's tufted), its tail as a plume widest a third of the way out, hung as it
  carries it and level as it runs. A stoat bounds with its back arched in one long stroke and turns ermine in a seed's
  winter; a badger is grey with black legs and a white face crossed by its stripe; a lynx is spotted, long-legged,
  bob-tailed, creeping low on the walk; wolves trot in packs of four to eight and lie up; jackals come by ones to
  threes. Wolves and lynx keep to the cold woods and the tundra (wolves only in the wild worlds), stoats to the open
  country, badgers to where wood meets meadow, jackals to the steppe, savanna and the desert's edge; none in a town. An
  owl quarters low and slow over open fields from dusk, gliding between short runs of beats; a kestrel hangs on the
  wind over one spot facing into it, its head still, then slides on or drops to the grass (`hover`). By their hours: a
  badger and an owl at dusk and by night, a lynx most at dusk and dawn, a kestrel by day and never in the rain. Sown
  about a third as often as what they hunt, and now and then one of the small ones near you.
