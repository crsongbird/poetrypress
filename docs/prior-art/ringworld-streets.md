# The Ringworld's streets: paved towns in a hierarchy, dirt roads wandering

Ruby, 2026-10-25: "Paved roads need to not be generated as long noodles (those are fine for dirt roads) but the moment
things get paved or neon they need to be organized and hierarchical - see city sims". How to read the tags: [src](URL)
is a page that was opened and read; [est] is an estimate, a computation or a design judgment.

## 1 · How streets are ordered

- Roads are classed by what they do: "Roads that deliver a high degree of mobility are called arterials"; collectors
  gather traffic from local roads and feed it to arterials; "local roads prioritize accessibility", serving the land
  beside them at low speed. Arterials are spaced farther apart than collectors, collectors than local streets; "minor
  arterial streets in urban cores should be 1/8 – 1/2 mile apart"
  [src](https://kp.uky.edu/knowledge-portal/articles/understanding-functional-classification-and-context-classification/).
- City blocks: "The standard block in Manhattan is about 264 by 900 feet (80 m × 274 m)"; Chicago's "330 by 660 feet
  (100 m × 200 m)"; cities on grids "have much more regular arrangements"
  [src](https://en.wikipedia.org/wiki/City_block).
- Parish and Müller's procedural cities grow "a system of highways and streets" from an extended L-system steered by
  "global goals and local constraints", input maps of land and water and population density, then divide the land into
  lots [src](https://history.siggraph.org/?p=116923).

## 2 · So in the painter [est]

- One grid of streets for the whole ring, turned its own way by the seed, as a planned colony's would be, its lines
  fixed in the world. Local streets every 68 to 84 m (a Manhattan block's short side), every third line a collector
  (some 230 m), every ninth an arterial (some 690 m, inside the guide's eighth to half a mile), wider.
- The hierarchy follows the town's density, as Parish and Müller's follows population: an arterial runs wherever there
  is town at all, a collector where it is middling, the local streets only where it is dense; each line straight,
  broken where the town ends or water stands. Where the world paves (cities, neon, the builders', and the ruins'
  broken asphalt), the towns lay no wandering spokes.
- Paved roads between towns and the main roads are engineered: they turn gently and hold to their goal, cutting and
  filling rather than wandering (`walk`'s stiff). Earth, gravel, flagstone and moss paths keep wandering with the land.
