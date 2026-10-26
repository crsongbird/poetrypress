# The Ringworld on the GPU (WebGPU), and a PS1/PS2 look for the engine

Ruby, 2026-10-26: "the GPU path is the real fix. Can we go ahead and implement that sooner rather than later so testing
the flights doesn't take forever? … WEBGPU, why not use WEBGPU? What/how do you think this would look like if we went
with vertex snapping and affine texture mapping and radiance cascades for PS1/2 like rendering using webgpu for the game
engine build when we pull this into a realtime engine?" How to read the tags: [src](URL) is a page that was opened and
read; [est] is an estimate, a computation or a design judgment.

## 1 · Why WebGPU

- WebGPU "is intended to supersede the older WebGL as the main graphics standard for the Web", with "robust support for
  general-purpose GPU computations"; Chrome and Edge shipped it in April 2023 (Chrome 113), Android with Chrome 121,
  Safari with Safari 26 (June 2025), Firefox with Firefox 141 (July 2025); its shading language is WGSL
  [src](https://en.wikipedia.org/wiki/WebGPU).
- A games guide: WebGPU's CPU overhead is "Lower (command buffers, less driver chatter)" than WebGL's per draw call; it
  has compute shaders, which WebGL "simply can't do"; but "keep a WebGL2 fallback for the long tail of older devices"
  [src](https://app.cinevva.com/guides/webgpu-vs-webgl-games).
- So here [est]: WebGPU, with the canvas as the fallback (Node, the tests, a browser without it, a software adapter,
  which is slower than the canvas just as software WebGL is, AGENTS.md §5.5). Its compute shaders are what the land's
  heights and the trees' placement can move to later.

## 2 · What the first step lays on the GPU [est]

Measured in Node on a drone frame (a CPU profile, five frames at 960×540): the land's cells about a quarter of the
frame, the things about two fifths (the trees nearly all of that), the arch and sky a seventh, the land's mesh and the
occlusion the rest. In a browser the canvas's own work moves to its GPU in part, so the shares there differ; ?cpuland
compares the two on a real machine.

- The order changed first, for both paths: the land is laid whole, far to near, with what lies flat on it (the ways,
  the fields, the walls); then the things, far to near, each clipped where the nearer land reaches up into its box (the
  occlusion horizon of its depth bucket, 96 buckets now). So the land no longer has to be interleaved with the things,
  and can be laid in one pass.
- The GPU path (ringGpu.js): each cell two triangles with its corners' colours (Gouraud, as the canvas's gradients
  were), its water a fan, its shore and glints thin quads; the ground's marks and strokes worked out per pixel from
  where it lies in the world, on the world's own grids (docs/prior-art/ringworld-painted.md §5), so they cost nothing on
  the CPU and never jump. The ways, fields and walls are drawn on it after, clipped bucket by bucket.
- Next: the arch on the GPU; the land's heights and colours in a compute shader (§4 has the things).

## 3 · The PS1/PS2 look, for the engine build

- The PlayStation's rasterizer "only works with integer coordinates and does not accept vertex values with subpixel
  precision", so vertices snap to the pixel grid and polygons jitter; without depth per vertex the GPU "can only linearly
  interpolate the texture inside the 2D triangle geometry without any consideration for perspective", so textures warp,
  which subdividing polygons hid; there was no z-buffer, polygons sorted into ordering tables, depth "not per pixel";
  dithering in hardware; no mip-mapping [src](https://pikuma.com/blog/how-to-make-ps1-graphics).
- Radiance Cascades: Alexander Sannikov's approach to global illumination with probes in cascades; a conventional 3D
  probe grid "faces significant memory constraints", and screen-space probes with world-space intervals catch off-screen
  light more cheaply [src](https://odr.chalmers.se/items/3ee9fb4e-1880-46c2-802a-a660e38dc9ee/full).
- So for the engine [est]: the painter already sorts its land and things far to near as the PS1's ordering tables did,
  and lays flat colours with Gouraud shading; the land's cells are its polygons. Vertex snapping is a rounding of each
  vertex's page place to a coarse grid (a 320×240 one, say) in the vertex shader; affine mapping is the ground's marks
  interpolated without the perspective divide (WGSL's @interpolate(linear)), so the strokes swim a little across the
  near cells as the eye moves; a 15-bit palette with an ordered dither in the last pass. Radiance cascades would give the
  painted light its bounce (the green under the trees, the glow of a town on the hills) in screen space. The painted
  style and the PS1 look meet in flat colour and few polygons; they part on the jitter and the swimming, which the
  painted Ringworld avoids on purpose (Ruby: the ground's paint "terrible to look at" when it moves), so the look is
  best a switch of the engine's, not its default.

## 4 · The ground's paint and the things on the GPU (2026-10-26)

Ruby, 2026-10-26: "The ground texture made SENSE and was very pretty if it's drawn with the GPU with correct lods and
mipmapping it shouldn't do the recalculating thing … Go ahead and try to get the rest of the things on a GPU so we can
even render the video at a reasonable frameerate."

- A browser open world's impostors: each prop baked into an atlas, "The color pass is unlit, so no lighting gets baked
  into the texture"; at run time "The imposter is a single quad", its material lit by "the scene's sun and environment
  lighting"; each instance's place uploaded as instanced attributes, a shared unit quad expanded in the vertex shader
  [src](https://app.cinevva.com/blog/2026-05-04-open-world-browser-part-19-imposters).
- A dynamic texture atlas by shelf packing, which "works very well when there is a high number of items with similar
  sizes", as WebRender's glyph atlases are [src](https://docs.rs/crate/etagere/latest).
- Measured here [est] (Chromium, its WebGPU on a software adapter, so the GPU's own time says nothing; Ruby's seed and
  settings at 960×540): the canvas path spends about ten seconds of the page's own work a frame, a quarter of it laying
  the trees' sheets (some 6,700 a frame) and a third painting new sheets as the light and haze stepped; with the things
  on the GPU the page's own work is under two seconds a frame.
- So here [est]:
  - The ground's marks on the GPU are the canvas's own (rgBrush and rgGroundMarks: strokes toward the shared tints,
    tufts, ripples, chips, drift lines, hummocks, reeds, joints), on the world's grids as before, but drawn upright on
    the page as a painter draws them: each fragment turns the triangle's own map from the page to the world about to
    find where a mark's point lies on the page. Lying flat in the ground they were foreshortened to nothing at a drone's
    angle, which is why the GPU's ground had looked bare.
  - The land writes its depth (by the logarithm of distance, `ringGpuDepth`), its mask and its distance for the parts
    after.
  - A tree is a quad of its kept sheet, the sheet drawn once in a plain noon light, cropped to what is drawn, and kept on
    the GPU in rows of one height, a row unseen this frame given up when room runs out (`ringGpuPutSheet`). The shader
    lights it with stepsRing.js's own rgLit sums (toward the night's blue by the dark, toward the air by the haze), so a
    sheet serves every light, and the light runs smoothly with no steps. Its shadows are ellipses worked out there.
  - Every other thing is painted as ever, on a page of the frame's own (gtPaint), and laid as a quad; its glows are
    screened over what is behind them, as the canvas's 'screen' does.
  - All of them far to near, each hidden by the land nearer than it pixel by pixel. The canvas's buckets drew a far
    thing over a nearer hill now and then (a spire showing through the slope before it); the depth does not.
  - Kept on the canvas: a tree right before the eye and the trees with a light of their own (`RG_GLOW_TREES`).

## 5 · The buildings as solids (2026-10-26)

Ruby, 2026-10-26: "I wonder if we should just make all of these objects three-dimensional instead of two dimensional
billboards which might help with the z fighting (if we used extremely sparse geometry it wouldn't cost too much of a
performance degradation) … You COULD redo the trees and large plants … as 3D geometry IN THE STYLE OF the billboards.
You SHOULD do the same for roads and buildings."

- Hand-painted game art lays its look on simple geometry: "all the lighting and shading information comes from one map",
  "There is no actual geometry for the details", and a body's value "should shift from the darkest at the lower body to
  the lightest at the upper body" [src](https://www.theseus.fi/bitstream/handle/10024/107534/Thesis_ZuzanaBubenova.pdf?sequence=1).
- A browser engine's impostors bake the colour unlit and light it at run time [src](https://app.cinevva.com/blog/2026-05-04-open-world-browser-part-19-imposters).
- So here [est]:
  - A building the canvas turns (paintKit.js's PK_BOX3 kinds) is now a solid on the GPU, its shape read from its own
    face as the canvas reads it (`pkBuildingShape`): its walls, its setback tiers or its gabled roof, its plinth on a
    slope. That is a few dozen triangles a building, against a canvas that painted every building's turned faces afresh
    each frame.
  - Its front is its own painted face, drawn once in its unlit colours and kept on the GPU as a tree's sheet is, then lit
    there. Its other walls carry windows in storeys and bays. Its roof is laid in courses.
  - Each face is lit by the sun's true way to it (rgSunK, as the land's slopes are), so its shaded side is the side away
    from the sun. The canvas's turned buildings were lit by a left-or-right guess.
  - Each face is darkest at its foot. By night its windows, and the dark panes of its painted face, light at random,
    about half of them.
  - It hides, and is hidden by, the land and every other thing pixel by pixel.
  - Kept painted, on a page of the frame's: the pagodas, mosques, round towers, gates, greenhouses, a building fading as
    it fills the frame.
  - Next: the roads and paths as draped strips, then the trees as solids in their sheets' style.
