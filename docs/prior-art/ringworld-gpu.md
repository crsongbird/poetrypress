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
- Next: the trees as instanced quads from their kept sheets, then the arch; the land's heights and colours in a compute
  shader; the things' depth against the land's per pixel instead of by bucket.

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
