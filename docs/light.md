# Light

How the page's light works: the dial, the engine (`lightHeights`), the rig (rim and ambient), shine and shadows. Moved from AGENTS.md §5.5; read it before touching light or a lit surface.

- The ☉/🜚 dial sets a direction and a height (`textureLight`,
  `textureLightTilt`). `lightVec` scales by height.
- **The dial's geometry** (appEvents `DIAL_R`): a handle at 100% sits on
  ☉'s ring (26 units of the 100-unit box), under the finger; past the rim
  it goes on to the dashed circle (130%, 33.8). The camera dial the same.
  🜚's spike and curls grow with the light's height (`shadowOf`); where the
  two shadows cross, the overlap colour shows (`lightSpikeMask`).
- **The handle is the light** (Ruby: "dragging a light around an object in
  the center … it projects a shadow"). Every surface is lit from the
  handle's side, and shadows fall away from it; 🜚's spike on the dial (and
  the rim light's, in its colour) points where they fall.
  - `lightVec` is the way the light travels (away from the handle);
    `dialVec` is the handle's own way, for a dial that is a direction or a
    place (wind, a breath, Pigment's flow, where a circle stands); Athanor
    parts take `genDial(E, n, port)` (travel), or `light: false` for an
    angle of their own (Lichtenberg's strike).
  - Older looks (format < 6), presets and readings on the surfaces that were
    lit from the far side (`LIGHT_TURNED`; an Athanor look unless its graph
    holds a `LIGHT_KEPT_PARTS` part) are turned half round on load
    (`retireFormat6`, `halfRound`), so their pictures stay. A new surface
    reads `lightVec`/`dialVec` and is never added to `LIGHT_TURNED`.
- `lightHeights(H, …)` lights a height field like a game engine: diffuse,
  specular by material, soft cast shadows, ambient occlusion. New lit
  textures build a height field and use it.
- **Heights or normals?**
  - Heights for anything that should cast a shadow (the shadow tracer
    marches over them). Keep the height range to what casts shadows: the
    trace length follows it.
  - A detail normal map (`opts.normals`) for detail that only shades: Cold
    Press fibres, Linen's weave, the glaze's fine crazing.
  - A `glossMap` for a surface of two materials: Kintsugi's gold, moss
    beside stone.
- **Sparse details** on flat ground (seams, buttons, carved sigils) use
  `lightSparse(H, …)`. It lights only the tiles a shadow can reach, and is
  exact.
- **Materials:** `materialOf(highlight, shade)` (null when both are white),
  then per channel `litK(L, i, ambient, M, c)` and `litS(M, c)`.
  - The Shadow Hue colours what's darker than flat ground (`L.flat`), the
    Shine Hue the shine. Hues are normalised to white's brightness.
  - Caps `material: true` show the two pickers (`textureTint3Hex`,
    `textureTint4Hex`).
  - `opts.components` returns diffuse and occlusion apart.
  - `opts.marchSteps` passes the whole field's shadow march to each sparse
    piece.
  - **With white hues a texture draws exactly as before** (the fingerprints
    prove it).
  - The Athanor's Light Engine also takes a color for the ambient light (its
    eighth input, `ambient hue`; ROADMAP C1): the ambient share of the light (`ambient × (1 −
    occlusion)`, from `opts.components`) is tinted by it per channel, so the
    shade, lit mostly by it, takes its color most. Empty or white: unchanged.
  - And a **Second Light** (ROADMAP C2): the same engine called again from
    another way (turned from the dial's: 180 a backlight), at its own height
    (read as Light Height: past 100 it grazes, a rim light), soft as three
    ways averaged, its direct light and shine alone (`ltSecondK`,
    `ltSecondS`), in its own color (the ninth input); negative draws light
    out. At 0 the loops are the old ones exactly. The GPU path is the same
    engine, so it stays line for line with the CPU.
  - **Translucency as a map** (graphs v4 and later; a chain opts in with `v: 5`
    on its entry): how thin each point is. There the shading is blurred a
    little and WRAPPED, `(k + w)/(1 + w)` with w = 0.6·t; a band of the
    surface's own colour lies where light turns to shadow (the scatter band);
    and light comes THROUGH, `TR = t × back`, back growing as the dial sinks
    toward and past the horizon (`lightTiltNow`, `lightLow`) and with a second
    light from behind. What comes through is the pigment's hue at full
    strength (the picture normalised by its brightest channel, deepened), so
    a backlit petal glows red however dark its lit face. The scalar
    Translucency is untouched by any of this (no fingerprint moved).
    docs/prior-art/lit-maps.md.
  - **What heights can and can't do.** Relief 100 is a rise of 3% of the
    page's shorter side per unit of height (200 at most: 6%). That is the
    scale of grain, crinkle, a bevel, a vein; it can't turn a cupped petal
    or a feather half away from the light. A process part that knows its
    object's 3D shape hands on **Facing** (Bloom's), the light at the
    object's own scale from its true normals; the graph multiplies it into
    the albedo and the engine adds the surface's own light on top.
  - **Smooth maps, never stepped** (Ruby: stepped maps made "cardboard
    cut-outs"; a "cardboard diorama" is pinned as a style of its own,
    ROADMAP): Facing and Height are blurred within the object's own shape (a
    blur of the map over a blur of the shape), so they curve and taper while
    the outline stays sharp and nothing darkens round it.
  - **Check by turning the light round:** front, side, behind and low, and
    the rim on and off. If two opposite lights give the same picture, the
    light isn't reaching the shape (measure a half-page mean if unsure).
- **The page's lights** (ROADMAP C1, C2 on the page; texCore
  `withLightRig`, built by `lightRigOf` from a layer's keys through
  `layerLights`): set round one texture's making, as `withLightTilt` is.
  - The **rim light** is the light dial's second handle (`textureRim`,
    `textureRimTilt`; its hue `textureTint7Hex`, whose alpha is its
    strength: 0 is off). lightHeights adds its direct light and shine, with
    shadows marched its own way (`lightWay`); lightSparse widens its margins
    to both lights' reach. Flat ground's `flat` includes it. With Rim
    chosen above the dial, the slider under it is that alpha (`rimStrength`,
    `setRimStrength`; a view, not saved on its own), and the rim handle
    fades with it.
  - The **Ambient slider** (`textureAmbient`, 0–200, 100 the surface's own)
    scales the ambient share's odds against the direct light, so 200% is
    twice the fill and never more than all the light.
  - The **light hues**: Main Light (`textureTint6Hex`: a Diffuse Hue
    surface's material `di`, else the rig's `mainHue`), Rim Light, Ambient.
    lightHeights then returns the shares (`aa`, `ma`, `ra`, `rs`) and `hue`;
    `litK` adds `litT(L, i, c)` and `litS(M, c, L, i)` colours a rim's own
    shine. A texture compositing its own way takes `litT`/`litS` where it
    uses the light (Cold Press and Old Paper through `litGrey`, Sigil
    Scatter, Guilloché, the Surface's heights).
  - The Light Engine takes the ambient (`rig: 'ambient'`) and makes the
    page's rim its Second Light when its own is 0; unwired, its Diffuse and
    Ambient Hue inputs are the page's.
  - Which surfaces: `TEXTURE_CAPS[t].rig`, measured (each changes under
    them; tools: a sheet of real pixels). Never a dial that is only a
    direction or the day. Others never see the rig and key as before.
  - Null rig, white hues, alpha 0, ambient 100: no rig at all; the
    fingerprints prove it. The GPU agrees with the CPU to 0.01/255
    (compared under `?softgl`-style SwiftShader).
- **GPU lighting:** the WebGL2 shader must stay line-for-line with the CPU
  `lightHeights`.
  - Change both together and compare them (`opts.cpuLight`; they agree to
    within 1/255).
  - Node always runs the CPU path, so the fingerprints test it.
  - `?softgl` in the address lets a machine without a GPU test the GPU path.
- **The dial as a joystick:** `caps.dial` renames it (Wind Direction,
  View…).
  - Rename labels with `setLabelText`, never `textContent` (that wiped the
    padlocks: the surface knobs' locks vanished this way twice).
  - Point things FROM the dial's handle: (cos a, sin a) with
    a = (deg − 90)°.
