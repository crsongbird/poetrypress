# Buildings, fields and plants on the ground they need

Ruby, 2026-10-25: "buildings should never spawn in the air like in this screenshot and terrain should flatten around
them or they should only spawn on appropriate terrain (each building will have to define it's slopes and entrances and
how deeply it should be set into the ground and which side has to be level with the terrain for it to look good and
make sense) - similar for farms, groves, etc... farms should not be on a basically vertical slope / tree moisture
gradients, shouldn't be saguaros here, should we have trees and small shrubs that obey moisture, aridity, soil angle
rules?" How to read the tags: [src](URL) is a page that was opened and read; [est] is an estimate, a computation or a
design judgment.

## 1 · Levelling the ground under a building

- In Unity a building is set level by editing the terrain's height map under it (TerrainData)
  [src](https://discussions.unity.com/t/adjust-terrain-after-placed-object/598053).
- In Cities: Skylines a player reports that as each building grew "it deformed the terrain around it", and that
  building on uneven ground can leave "the terrain on either side unbuildable"
  [src](https://steamcommunity.com/app/255710/discussions/0/1694920442949665213).
- So in the painter [est]: each kind says how far its ground may fall across its footprint, as a share of its width
  (`RG_FALL`): a house a fifth (some 11°), a row of houses, a factory or a greenhouse about a tenth, a filling station
  less; what is built into a slope (a pueblo, a castle on its hill, a stave church, a chapel) a quarter to nearly a
  half. Where it is built, the land under it is levelled to the height at its middle and eased back to the slope over a
  skirt of 4 m and a third of its width (`rgPads`), so its foot, its door and its yard meet the ground; the strongest of
  several pads wins where they overlap. Its door is on its face, toward its street, the side that is level.

## 2 · Fields on slopes

- FAO: broad-based graded terraces "For cultivation purposes on slopes not exceeding 8% on erodible soils and not
  exceeding 12% on erosion resistant soils"; for establishing grass or pasture up to 15%
  [src](https://www.fao.org/4/ad083e/AD083e10.htm).
- FAO: "hand-made terraces should be employed on 7 to 25 degree (12%-47%) slopes", machine-built ones on 7 to 20
  degree (12%-36%) slopes; bench terraces "are not recommended for slopes below 7 degrees"
  [src](https://www.fao.org/4/ad083e/AD083e07.htm).
- So in the painter [est]: a ploughed field where the land falls under one in five (a painted country ploughs a
  little steeper than the FAO's cautious figures), a terrace between one in five and 47 in a hundred, and nothing
  steeper; and since the middle's slope can lie (a field on a knoll's shoulder, across a gully), its four corners are
  asked too, and a field whose corners fall more than that across it is not sown. A grove keeps to slopes under 0.4.

## 3 · Plants by moisture, warmth and slope

- The biomes are Whittaker's, by warmth and moisture (landKit's `LK_BIOMES`, docs/prior-art/ringworld-terrain.md);
  the desert's plants and where they grow are in docs/prior-art/ringworld-desert-plants.md, the trees' in
  docs/prior-art/ringworld-trees.md.
- So in the painter [est]: a tree is chosen from its place's biomes, each biome's weight raised to the fourth power so
  the strongest decides and a border mixes only near it (`floraAt`, `RG_BIOME_FLORA`): no plants on ice; birch, fir
  and shrubs on tundra; conifers in the taiga; broadleaf, birch and poplar on the meadow, warm ones where it is warm;
  shrubs, prickly pear, agave, acacia and dead trees on the steppe; cacti and Joshua trees only in desert; acacia,
  baobab and many shrubs on the savanna. Where the land is steeper than 0.55 only what holds a slope grows
  (`RG_STEEP_OK`): a cactus there becomes a shrub, a broadleaf a spruce or a shrub.
