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
  far sooner (snow some 900 m, a storm 1.3 km, rain 2.6 km, the AMS's moderate snow), its colour the snow's white or the
  rain's grey.
- What lies: snow over the open ground, thinner on the steep, the rock showing on cliffs, a town's ways a little
  trodden; along every conifer tier's top, in caps on broadleaf crowns, on bare twigs, on roofs; the meadow flowers
  closed, the tufts frosted.
- The overcast ceiling is laid as one solid sheet and laid on the sky once (Ruby: "there's a grid on this seed"): its
  quads, each see-through and each edge stroked, had laid every seam twice.
