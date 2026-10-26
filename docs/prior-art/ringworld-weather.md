# The Ringworld's weather, falling and lying

Ruby, 2026-10-25: "Are we working on weather accumulation and depth (snow still seems like a curtain in front of the
image)". How to read the tags: [src](URL) is a page that was opened and read; [est] is an estimate, a computation or a
design judgment.

## 1 · How fast it falls and how far one sees through it

- Video analysis of a dozen snowflakes gives "a terminal velocity estimate of ~2 m/s"
  [src](https://www.vernier.com/vernier-ideas/the-terminal-velocity-of-a-snowflake).
- Small raindrops fall "about 2 mph"; large ones, about a quarter inch, "about 10 meters per second"
  [src](https://wxguys.ssec.wisc.edu/2018/07/16/raindrop-speed).
- Snow is light "when the visibility is 1 km … or more", moderate under 1 km but not under half a kilometre, heavy
  "when the visibility is less than 1/2 km" [src](https://glossary.ametsoc.org/wiki/snow/).
- Games and films have long drawn rain and snow as textures on a double cone round the camera, "translate[d] and
  elongate[d]" as it moves [src](https://history.siggraph.org/?p=93028).

## 2 · So in the painter [est]

- No sheet of flakes over the page: flakes and streaks in the world round the eye, in shells of distance (snow: 1 to
  150 m in five shells, rain: 1.5 to 110 m in four), a few big flakes near, many small ones far (`rgFalling`). Each is
  a point of the world projected like everything else, so it turns with the camera and slides by at its own depth;
  it falls (snow 1.4 m/s, swaying; rain 8.5 m/s, a streak half a metre long) and drifts with the seed's wind; it is
  hidden wherever the land stands nearer. Each by the hash of its cell of the sky round the eye, so a film's flakes
  are the same flakes frame to frame.
- Beyond the shells the fall is a veil over the far land and everything on it: the land's haze reaches its full depth
  far sooner (snow some 1.4 km, the AMS's light snow, a storm 1.3 km, rain 2.6 km), its colour the snow's white or the
  rain's grey.
- What lies: snow over the open ground, thinner on the steep, the rock showing on cliffs, a town's ways a little
  trodden; along every conifer tier's top, in caps on broadleaf crowns, on bare twigs, on roofs; the meadow flowers
  closed, the tufts frosted.
- The overcast ceiling is laid as one solid sheet and laid on the sky once (Ruby: "there's a grid on this seed"): its
  quads, each see-through and each edge stroked, had laid every seam twice.

## 3 · Less of it (Ruby, 2026-10-25: "feel like it snows too much") [est]

- Snow only in a seed's winter (December to February and the edges of November and March); the same seeds fall as rain
  in the other seasons. The fall less than half as thick, and the veil a light snow's.

## 4 · The rarer weathers (Ruby, 2026-10-25: "interesting weathers")

- Sunshower: rain blown from a shower, sometimes miles off, into a clear sky, or one shower cloud passing without
  hiding the sun; "kitsune no yomeiri", the fox's wedding [src](https://en.wikipedia.org/wiki/Sunshower). The primary
  bow lies about 40–42° from the antisolar point, red outside, the secondary at 50–53° with its colours reversed,
  Alexander's dark band between; with the sun higher than 42° the bow is below the horizon
  [src](https://dlab.epfl.ch/wikispeedia/wpcd/wp/r/Rainbow.htm).
- Dust: a haboob's wall is several km high and up to 100 km wide [src](https://en.wikipedia.org/wiki/Haboob); Phoenix
  sees 3 to 20 a year, 25 of 96 bringing visibility to 1.6 km or less [src](https://par.nsf.gov/servlets/purl/10038391).
  The harmattan's Saharan dust turns the sky "milky white" and the horizon brown, lying in horizontal stripes across a
  low sun [src](https://earthsky.org/todays-image/photos-saharan-dust-june-2020-florida-texas/).
- The aurora: green from oxygen at 557.7 nm about 100 km up, red at 630 nm above it, purple from nitrogen
  [src](https://wp.lancs.ac.uk/aurorawatchuk/2017/05/10/the-vivid-lights-what-causes-the-colour-of-the-aurora/); its
  sharp lower edge about 105 km up, curtains running east and west with rays along the field lines
  [src](https://www.antarctica.gov.au/about-antarctica/ice-and-atmosphere/atmosphere/aurora/); to the eye usually
  changing over 30 s to a few minutes [src](https://asterisk.phy.mtu.edu/viewtopic.php?p=96630).
- Ash: smoke takes the blue out of the light, the sun milky or red, the sky white-grey
  [src](https://www.theweathernetwork.com/en/news/weather/forecasts/ask-a-met-how-wildfire-smoke-turns-the-sky-an-eerie-red);
  ash flakes drifting down "like snow" [src](https://www.cbsnews.com/sanfrancisco/news/wildfire-smoke-plume-blankets-bay-area-skies/).
- Petals: hanafubuki, the "blossom blizzard", cherry petals falling so thick they look like snow
  [src](https://www.tkgje.jp/entries/13500/13961_hanafubuki.html); a petal's terminal speed worked out at 0.0535 m/s
  [src](https://journals.le.ac.uk/index.php/pst/article/download/3916/3375/12011). Ghost of Tsushima drives all its
  leaves, grass and cloth by one wind [src](https://blog.playstation.com/?p=345372).
- How games share them out: Minecraft rains only in biomes of middling temperature, never in deserts
  [src](https://minecraft.fandom.com/wiki/Weather); Breath of the Wild's sandstorms come only in its desert, its snow at
  height [src](https://zelda.fandom.com/wiki/Weather).
- Never a flash: no more than three in a second, the flashing area small
  [src](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html).
- So in the painter [est]: six more weathers, each by the place the seed stands you (`rgWeatherOf`), each standing on a
  common sky (`RG_WX_BASE`) and with its own things falling or drifting in the same shells as snow and rain
  (`RG_FALLS`). Of the seeds that would rain, two in five fall as a sunshower instead: a thin rain lit warm by the sun
  under a broken sky, its rainbow always there when the sun is low enough. Where the land is dry, three clear days in
  ten are dust: the air ochre and the far land gone into it, a dust streaming level on the wind. In the cold, a clear
  sky now and then holds the aurora: curtains over one side of the sky, a violet hem, green, red fading out high, their
  folds drifting a few degrees a minute and their light breathing by a tenth over minutes (on the ring's thin air it
  shows by day too, fainter). In spring the blossom drifts, petals tumbling and turning edge-on and back. In the magic
  world motes of light rise slowly, each breathing on its own clock of tens of seconds. Over the ruins ash falls grey
  and slow as snow under a sepia air. None of them ever flashes.
