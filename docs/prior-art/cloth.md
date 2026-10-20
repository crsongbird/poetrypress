# Cloth for PoetryPress: Prior Art for a Simulated, Map-Lit Drape

Scope: replace the baked-shading "Linen" ladder (silk → twill → linen → canvas → burlap) with node graphs in which a small cloth simulation settles once per image, the weave is mapped through the simulated surface so threads follow the folds, and everything is lit by the Light Engine from maps.

How claims are tagged:
- **[Sn]** means source n in the Sources list at the end, which gives the URL. I opened and read every listed source unless its entry says otherwise.
- **[est]** means my own estimate or design proposal.
- **[bench]** means I measured it with a small XPBD test in Node 22 (V8) on a 2.1 GHz Xeon core. The script and setup are in Appendix A.

---

## 1. Cloth simulation cheap enough for a phone

### 1.1 The candidates

**Mass-spring (Provot 1995).**
- The cloth is an m×n grid of point masses. Three kinds of spring connect them [S2]:
  - structural springs between horizontal and vertical neighbours, which resist stretch;
  - shear springs on the diagonals;
  - flexion springs between masses two apart, which resist bending.
- Provot integrated it with explicit Euler [S2].
- **The super-elastic problem.** A 17×17 sheet hung from two adjacent corners stretched by more than 100% near the corners. Real woven fabric stops at about 10%, and less for linen, calico and denim [S2].
- Stiffer springs don't fix this. Above a critical stiffness the integration diverges, so the time step has to shrink [S2].
- **Provot's fix.** After each step, clamp any spring stretched past a critical rate T_c (10% in the paper, 5% for a flag):
  - if both ends are free, move both toward the midpoint;
  - if one end is fixed, move only the free end;
  - apply it to structural springs first, then shear springs, and never to flexion springs [S2].
- Results: about 15% more cost per step than plain springs, about 90% faster at equal stiffness, and the super-elastic effect was "totally suppressed" [S2].
- This clamp is the ancestor of every position-based method below [est].

**Jakobsen / Hitman Verlet (GDC 2001).**
- Each particle stores its current and previous position and no velocity. The update is x' = 2x − x* + a·Δt². Changing the 2 to 1.99 adds drag [S1].
- Constraints are satisfied by repeated local projection (relaxation) [S1].
- Iteration counts: "for most pieces of cloth only one iteration is necessary!" Hitman used 1–10 iterations depending on the object [S1].
- Square-root trick: approximate it with one Newton step around the rest length, so each stick costs no square roots and one division [S1].
- Collisions: push particles back to the nearest valid point. Pins: reset the particle every iteration, or give it inverse mass 0 [S1].
- This is the simplest code to write. It is effectively PBD with stiffness 1 [est].

**Position Based Dynamics (Müller et al. 2006/2007).**
- Each step [S3]:
  1. apply gravity and damping to the velocities;
  2. predict positions p = x + Δt·v;
  3. project the constraints Gauss–Seidel style for n_s iterations;
  4. set v = (p − x)/Δt.
- It is unconditionally stable with respect to the time step [S3].
- Updating positions immediately, instead of Jacobi style, "speeds up convergence significantly" [S3].
- Stiffness k is corrected per iteration as k′ = 1 − (1 − k)^(1/n_s). It still depends on the time step [S3].
- Bending uses a dihedral-angle constraint, so bending and stretch stiffness are independent [S3].
- Self-collision is vertex–triangle with a thickness h, found by spatial hashing [S3].
- Reported cloth sizes: 1364 vertices with self-collision at about 30 fps, and 4264 vertices at about 47 fps, on a 3 GHz Pentium 4 [S3].

**XPBD (Macklin, Müller, Chentanez 2016).**
- Each constraint gets a compliance α (inverse stiffness), scaled as α̃ = α/Δt². Each iteration updates a Lagrange multiplier: Δλ = (−C − α̃λ) / (∇C·M⁻¹∇Cᵀ + α̃), then Δx = M⁻¹∇Cᵀ Δλ [S4].
- This "resolves the iteration and time step dependent stiffness issue of PBD" [S4]. The experiments use 20 iterations [S4].
- "Small Steps" (2019) found that n substeps with one iteration each beats one step with n iterations, with much less constraint error and numerical damping [S5]. That is the right choice for animation.
- Ten Minute Physics' JavaScript cloth uses XPBD with these settings [S7]:
  - 15 substeps, 1 iteration each;
  - stretch compliance 0;
  - bending as a distance constraint between the opposite vertices of each pair of adjacent triangles.
- The tutorial says this runs a 6,400-triangle cloth at 30+ fps on a smartphone, in plain JS [S9].
- I couldn't open the original XPBD PDF (fetch was blocked). The formula above comes from DiffXPBD's restatement [S4].

**Projective Dynamics (Bouaziz et al. 2014).**
- Each iteration has two parts [S6]:
  - a local step that projects each constraint independently and in parallel;
  - a global step that solves one linear system whose matrix stays constant, so it is Cholesky-factored once.
- Each iteration weakly decreases the energy, and it converges to a true implicit-Euler solution [S6].
- The paper also notes that PBD's stiffness depends on the iteration count [S6].
- "5–10 iterations are usually sufficient," at 1–6 ms per iteration for models under 30K DoF [S6].
- Stopping early causes damping, which is worse on large meshes [S6].
- For a phone-side JS app, the cost is a sparse Cholesky factorization and solver in JS. That is a lot of code for a 64² grid that XPBD already handles [est].

**Quasi-static solvers.** If you want a true "rest pose" rather than a settled dynamic one:
- Recent work argues that XPBD's residual "stagnates after an iteration or two" when used for quasi-statics [S12].
- A position-based nonlinear Gauss–Seidel does better there, and stays stable on tiny budgets where Newton does not [S12].
- Visually, a damped dynamic settle is good enough for drapery [est, bench].

### 1.2 Which converges fastest for a static, settled drape

**Recommendation: XPBD distance constraints with Gauss–Seidel, plus long-range tethers, heavy damping, a good initial guess and early stopping. Use few substeps and several iterations, not "small steps".** [est, bench]

Why, from my own measurements on a gathered curtain [bench]:
- **Small steps keep buzzing.** 10 substeps × 1 iteration never came to rest. RMS velocity stayed around 0.3–0.6 m/s after 4 simulated seconds, even with heavy velocity damping. Small steps keep energy in the system, which is good for animation and bad for settling.
- **Iterations help a static result.** With few substeps and several iterations, the numerical damping that hurts animation [S5, S6] helps. 1 × 10 and 2 × 5 both settled cleanly.
  - 2 substeps × 5 iterations was the best of the splits I tried: 0.39% mean stretch error, settled within 150 frames at 60 Hz.
- **Tethers are essential.** Without long-range attachments, a 96² hanging sheet stretched about 31% even with 10 iterations, which is Provot's super-elastic problem again. With tethers it stayed under 1%.
  - A tether is a one-sided "no farther than rest distance" constraint from each free particle to its anchor [S10]. Unreal ships them as cloth tethers, generated by Dijkstra over the mesh [S11].
- **A good starting shape is the biggest single win.** Starting the curtain pre-buckled (a sinusoid between rings) and stepping at 30 Hz settled a 64² sheet to RMS velocity under 0.01 in about 30 frames. That was about 0.4 s on the desktop core, versus about 1.4 s from a flat start.
- **Per-sweep cost.** One constraint sweep took about 40–50 ns per distance constraint in V8:
  - 64² (about 24k constraints): about 1.0 ms;
  - 96² (about 54k): about 2–2.5 ms;
  - 128² (about 97k): about 3.3–4.6 ms.
- **On the phone.** A 2022 Moto G Stylus 5G is probably 2–4× slower per core [est]. That puts a settled 64² drape at about 1–2 s and a 96² drape at about 2–4 s, in a Web Worker [est].

**Grid size.** Simulate at 48²–64² by default, and 96² only for "fine" presets [est].
- A distance-constraint grid can't buckle at wavelengths shorter than about 4–6 particle spacings [est]. A 64² sheet therefore resolves folds down to about 1/12 of its width.
- Finer wrinkles should be procedural, driven by compression (see §2.3), not paid for with particles [est].
- 160² (about 150k constraints, about 7 ms per sweep [est, extrapolated]) is not worth it on a phone [est].

### 1.3 A concrete solver recipe [est unless tagged]

- **Particles:** Float64Array positions, previous positions and velocities, plus inverse masses.
  - Use Float64 and avoid Math.sin, cos and exp inside the loop. Arithmetic and sqrt are correctly rounded, but the transcendental functions differ between engines, and a chaotic settle amplifies tiny differences. The same seed could then give different folds on Firefox and Chrome [est].
- **Constraints**, using the Ten Minute Physics layout [S8]:
  - structural (0,1) and (1,0), compliance 0, or slightly soft in compression (see §2.3);
  - shear (1,1) and (1,−1), compliance about 1e-4 [S8];
  - bend (0,2) and (2,0) distance constraints, with compliance per fabric (§4). Ten Minute Physics uses 1.0 as its slider default [S7, S8].
  - Order them by type, as in [S8].
- **Tethers:** from each free particle to its nearest pin, with the rest distance taken from the flat sheet [S10]. Project them after each sweep, only when stretched.
- **Time step:** Δt = 1/30 s, 2 substeps × 5 iterations, gravity −9.8 [bench].
  - Damp velocities by about 5–10% per frame [bench].
  - Clamp speed to about 0.5 spacing per substep [bench]. With self-collision, clamp to 0.2·thickness/Δt instead [S8].
- **Stop** when RMS speed falls below about 0.01 m/s, or below 0.002 spacing per frame, or after a frame cap (about 90) [bench, est].
- **Cache the settled mesh by seed and drape parameters.** It is small: 64²×3 doubles is about 100 KB. Weave, colour, sheen and light changes then re-render without re-simulating. This is most of the "half the cost" [est].

### 1.4 Pinning and support recipes [est unless tagged]

| Scene | Setup | Folds you get |
|---|---|---|
| **Hung from a rod, gathered** | Pin every k-th top-row particle (rings) on a rod shorter than the cloth (gather 0.5–0.8). Pre-buckle with alternating front/back bulges between rings. | Vertical pipe folds from the rings, softening into drop folds lower down. |
| **Hung from a rod, flat** | Pin the whole top row at full width, with a small random z jitter. | Few folds, gentle sway. Add a side pull or a floor contact for interest. |
| **Hung from two corners** | Pin (0,0) and (N−1,0) at a spread of 0.6–0.9 × width. Tether from both. | Diaper folds sagging between the pins, with tension lines radiating from the corners. |
| **One corner, or a nail** | Pin one particle. | Drop and spiral folds hanging from the point. |
| **Draped over an object** | Collide with a sphere, box or cylinder SDF by projecting out along the gradient [S1]. Friction keeps only part of the tangential move. Start flat just above the object. | Drop folds off the edges, cone-like folds at table corners. |
| **Crumpled on a table** | No pins. Ground plane with friction, as in Ten Minute Physics, which projects onto the plane and cancels the step's motion [S8]. Start compressed in-plane (scale about 0.6) with low-frequency random height. Needs self-collision. | Zigzag and inert folds with overlapping layers. |
| **Twisted** | Pin top and bottom rows and rotate the bottom row about the vertical axis before settling. | Spiral folds. |

**Self-collision shortcuts:**
1. Skip it for hanging and draped scenes viewed head-on. They rarely self-intersect, and the rasterizer's z-buffer hides small overlaps [est].
2. For crumpled scenes, use particle–particle spheres found by spatial hash, with thickness about equal to the spacing [S8]:
   - skip pairs whose rest distance is under the thickness;
   - average the pair's velocities for friction;
   - clamp velocity so nothing tunnels [S8].
3. Rebuild the hash once per frame, not per substep [S8].
4. Vertex–triangle collisions [S3] are more robust but cost more than this app needs [est].

---

## 2. Getting folds that read well

### 2.1 Where folds come from

- Cloth barely stretches but bends easily. Any compression, from gathering, sag between supports, gravity pulling against contact, or crumpling, is absorbed by buckling out of plane [est, consistent with S2 and S17].
- **The wrinkle wavelength law.** Cerda–Mahadevan give λ ∼ (B/K)^(1/4) for tension-induced wrinkling, with B the bending modulus. Wavelength grows with the square root of thickness [S17].
- Practical consequence: fold width grows only with the fourth root of bending stiffness. Doubling fold width takes about 16× stiffer bending, so the per-fabric bending compliances in §4 must span several orders of magnitude [est, derived from S17].
- **Tension and compression.** Tension lines run straight from pins and supports. Compression zones form folds perpendicular to the compression direction [est].
- Marvelous Designer and CLO expose this directly [S23, S24, S25]:
  - **Bending-Weft/Warp** sets stiffness separately per thread direction. High values for denim and leather, low for silk [S24].
  - **Buckling Ratio** controls how easily fabric bends once pushed past its tendency to hold its shape. Near 100% for silk and jersey, near 0% for denim and wool [S23].
  - **Buckling Stiffness** sets the percentage of bending stiffness that applies once a part is folded, e.g. 80% of 60 gives 48 [S25].
  - The takeaway for us: bending should soften once a fold starts, which makes folds crisp instead of rubbery [est].

### 2.2 The drapery-drawing taxonomy

- The seven folds — pipe, zigzag, spiral, half-lock, diaper, drop and inert — are widely taught. Swinton's Art lists exactly these seven, with what each looks like [S14]:
  - **Pipe:** tube-like rolls with strong cast shadows.
  - **Drop:** fabric flowing over a support, softer than pipe folds.
  - **Diaper:** a soft sway between two pinch points.
  - **Zigzag:** snaking folds on flatter surfaces.
  - **Spiral:** fabric wrapping and twisting around itself.
  - **Half-lock:** forms where the support underneath bends.
  - **Inert:** lifeless fabric at rest.
- Proko teaches a variant set of seven: pipe, diaper, half-lock, spiral, compression, flag and inert [S15].
- **On the Hogarth attribution:** I couldn't confirm it from a source I could read. The publisher's description of *Dynamic Wrinkles and Drapery* lists "direct thrust," "bend" and "crossing" wrinkles and "wrinkle texture and material" [S16]. The seven-fold list is commonly credited to Hogarth, but treat that as unverified [est].

**Use the taxonomy as the preset vocabulary**, with each fold type mapped to a support recipe from §1.4 [est]:

| Fold type | Recipe |
|---|---|
| pipe | gathered rod |
| diaper | two corners |
| drop | over an edge |
| spiral | twist |
| half-lock | bent support, e.g. a rod with an elbow |
| zigzag | crumpled, low compression |
| inert | crumpled, settled on the floor |

### 2.3 How games and artists fake fine wrinkles, and what to borrow

- **Wrinkle maps.** A base normal map is blended with "wrinkled" normal maps through region masks with animated weights. The GPU Pro 2 face technique uses 8 regions in two RGBA masks and costs about 0.1–0.3 ms [S18].
  - On bodies and clothes, the weights are often driven by bone rotations, with "wrinkled left/right" variants blended from −1 to +1 [S19].
  - I couldn't find a readable primary source for Uncharted's or The Last of Us's cloth wrinkle tech. Naughty Dog's SIGGRAPH 2020 talks don't mention it. Treat any claim about it as unverified.
- **Tension maps.** Per-vertex stretch and compression are measured against the rest pose and output as two channels: stretch in green, compression in red [S20].
  - They then blend a "constriction" and a "stretch" fold texture, either as displacement or as normal maps [S21].
- **Marvelous Designer → ZBrush → bake.**
  - Big folds come from the cloth sim. Asymmetry, folds and damage are hand-sculpted [S22].
  - High-poly detail is baked into normal maps, and tiling PBR fabric maps carry the weave and micro-wrinkles [S22].
  - Normal maps can't change the silhouette or cast real shadows [S22].
- **Wrinkle meshes (Müller & Chentanez 2010).** A finer mesh rides on the coarse sim. Each vertex may deviate up to a painted maximum distance, solved statically, and it runs in real time [S13].
  - This is a proof that "coarse sim + fine detail layer" is the accepted game answer [est].

**What PoetryPress should do: a sub-grid wrinkle layer driven by compression** [est]:
- Make the structural constraints asymmetric: stiff in stretch (compliance 0), softer in compression (about 1e-6 to 1e-5). This is the position-based analogue of Buckling Ratio [S23].
- After the settle, per quad, compute the compression strain ε = 1 − len/rest and its principal direction.
- Add procedural wrinkles perpendicular to that direction:
  - wavelength λ from the fabric's bending (via §2.1, about 2–6 px of weave scale for silk and much more for canvas);
  - amplitude A ≈ (λ/π)·√ε, which is the sinusoid whose extra arc length absorbs the strain [est, geometry];
  - phase noise so the wrinkles don't look ruled.
- These go into the height and normal maps only, never into the sim.

---

## 3. From simulated mesh to maps for a 2D lit renderer

### 3.1 The pipeline [est unless tagged]

1. **Inputs.** The settled grid P(i,j) with u = i/(N−1), v = j/(N−1), and a camera: orthographic front view for hangings, top view for tables.
2. **Smooth surface.** Evaluate each quad as a bicubic (Catmull-Rom) patch, subdivided 2–4×. Otherwise a 64² grid shows facets in the normals.
   - Compute per-vertex normals for lighting; Ten Minute Physics recomputes vertex normals each frame [S7].
3. **Rasterize triangles** into the output map resolution with a z-buffer, so the nearest layer wins and front pipe folds occlude the valleys behind them. Per pixel, store:
   - depth (becomes height);
   - the mesh normal N, in view space;
   - interpolated (u,v);
   - the surface tangent frame T = ∂P/∂u and B = ∂P/∂v, from the triangle's Jacobian;
   - compression ε and its direction;
   - front or back face (satin has a glossy face and a dull back [S37]);
   - the number of cloth layers on the view ray, for translucency.
4. **Weave lookup through the mesh UV.** Evaluate the weave procedure (§3.3) at (u·threadsU, v·threadsV). It returns:
   - the thread id, warp or weft;
   - which thread is on top;
   - a height within the thread;
   - a thread tangent in uv space.

   Map the tangent to screen space through T and B. Threads then follow the folds, compress on steep fold walls, and the twill diagonal bends around pipe folds. A 2D texture generator can't do this.
5. **Foreshortening anti-aliasing.** Must have. On steep fold walls, |∂uv/∂screen| grows and threads alias into moiré.
   - Per pixel, compute the uv footprint from the Jacobian.
   - Fade the weave's height and normal contribution toward the weave's average, its mean height and mean tangent distribution, once a thread drops below about 1.5 px.
   - Keep the anisotropy direction even after fading, because sheen still runs along the threads at sub-pixel scale.
6. **Height map:**
   - normalized depth (macro)
   - \+ sub-grid wrinkles (§2.3)
   - \+ weave height × (1 − fade)
   - \+ slub and fuzz noise.
7. **Normal map.** Take the macro normal from the mesh, then perturb it in the (T,B,N) frame by the gradient of the micro height (wrinkles + weave), like Substance's height-to-normal and normal-blend nodes [S28].
   - Don't rebuild macro normals from the depth image. The mesh normal is exact and continuous across occlusion edges, and the depth gradient is not.
8. **Ambient occlusion.** Use horizon-based AO on the depth buffer, like Substance's HBAO filter on height [S28]. Fold valleys between pipe folds darken naturally.
   - Multiply by a weave cavity term, darker at thread crossings and gaps.
   - Multiply by a contact term where cloth meets the table or object.
9. **Gloss and anisotropy maps:**
   - gloss (roughness) per thread type;
   - a 2-channel thread-direction map (screen-space angle of the visible top thread's tangent);
   - an anisotropy-strength map.

   The current Light Engine takes albedo, height/normal, gloss and translucency. **Add a thread-direction / anisotropy input.** Woven fabric's look is mostly highlights stretched along threads [S29, S31, S34]. Without it, satin and silk read as plastic [est].
10. **Translucency map.**
    - The open-gap fraction from the weave transmits directly, which is leno or gauze's openness [S41].
    - Threads transmit diffusely, tinted by the albedo [S31 volume term].
    - Overlapping layers multiply their transmittances.
    - For thin-cloth light bleed on the lit side, a wrapped diffuse with a subsurface colour works: f_d ∝ ((N·L + w)/(1 + w)²) · (c_subsurface + N·L), with w = 0.5 [S33].
11. **Albedo.** Warp and weft colours by thread id, per-thread colour jitter, and tweed flecks (dyed wool mixed before spinning [S39]). Then wear masks (denim fades at seams and knees because indigo ring-dyes only the yarn surface [S38]).

### 3.2 Anisotropic sheen: what the research says, made cheap

- **Irawan & Marschner.**
  - 2006 report: a cotton twill's highlight per thread segment is an ellipse whose centre moves with the half vector. They give twill values: warp segments 1×6, α = 3, η = 0.995, φ_E = 95°; weft segments 1×2, α = 1 [S30].
  - 2012 TOG paper: a procedural model built on specular reflection from the fibres, with a few physically meaningful parameters (fibre, yarn geometry, weave pattern), validated on staple and filament yarns [S29]. I could read only the abstract page; the full PDF was blocked.
- **Sadeghi et al. 2013 microcylinder model** [S31]:
  - Warp and weft are microcylinders. A thread has a surface lobe (Fresnel, Gaussian width γ_s) and a volume lobe (width γ_v, coloured by albedo A), plus an isotropic k_d for cellulose fibres such as linen and cotton.
  - The weave is the smallest repeat, with coverage a₁ and a₂ and a tangent curve per thread. Constant-slope segments give distinct off-specular highlights.
  - Fitted parameters [S31, Table II]:

    | Fabric | η | k_d | γ_s | γ_v | Coverage |
    |---|---|---|---|---|---|
    | Linen plain | 1.46 | 0.3 | 12° | 24° | 0.33 |
    | Silk crepe de chine | 1.345 | flat 0.2 / twisted 0.3 | 5° / 18° | — | 0.75 / 0.25 |
    | Polyester satin charmeuse | 1.539 | 0.1 / 0.7 | flat 2.5° / twisted 30° | — | 0.9 / 0.1 |
    | Velvet | — | — | 6° | 12° | — |

  - Velvet's tangents point nearly along the surface normal, which gives asymmetric highlights. Satin shows 3 highlights on the front and 4 on the back. Linen shows no strong peaks except at grazing angles [S31].
- **Sheen and velvet.**
  - Ashikhmin's velvet distribution: D = (1/(π(1 + 4α²)))·(1 + 4·exp(−cot²θ_h/α²)/sin⁴θ_h) (normalized form) [S33].
  - Charlie sheen: D = (2 + 1/α)·sin(θ)^(1/α)/2π [S32, S33]. The highlight stays at grazing angles when roughness is low [S32].
  - Cloth has "a softer specular lobe with a large falloff," with rim light from forward and backward fibre scattering [S33].
  - Velvet's pile direction changes its shade: pile up looks darker, pile down lighter and shinier [S44]. Fabric looks different by nap direction [S43].
- **A practical renderer: Thunderloom (V-Ray)** [S34]:
  - shades per thread segment from a WIF/PTN pattern;
  - Twist acts as roughness (low for silk and nylon, high for cotton);
  - Bend sets the loop shape (higher for satin floats);
  - Yarn Size sets thread radius and gaps;
  - specular colour should match the fabric colour, because the coloured secondary highlight carries the look;
  - a falloff on diffuse gives sheen, and inverting it gives denim's darker grazing look.
- **Deformation changes the look.** Yarn and fibre arrangements shift under tension and contact, which changes the macroscopic appearance [S35]. Cheap version: on stretched areas, open the gaps and narrow the threads; on compressed areas, close the gaps and bunch the highlights [est].

**What the Light Engine should run per pixel, two lobes** [est, distilled from S31, S34, S33]:
- Thread tangent T_t: the screen-space thread direction tilted toward N by the twist angle (staple yarns tilt more and spread wider).
- **Lobe R (surface):**
  - Kajiya-Kay-style (√(1 − (T_t·H)²))^p;
  - white or near-white;
  - p from γ_s: satin and silk p ≈ 200–800, linen and cotton p ≈ 10–40.
- **Lobe TT/volume:**
  - the same form, wider (p ≈ ¼ of R's), shifted further along the tilt;
  - tinted by albedo.
- **Plus:**
  - k_d·Lambert (wrapped, w = 0.5, for thin cloth);
  - a Charlie sheen lobe with weight per fabric, high for velvet, cotton, wool and brushed fabrics;
  - for velvet, the sheen weighted by pile direction from a nap map.

### 3.3 Weave patterns and how to parameterize them

- **Plain:** one over, one under. The tightest weave, flat and even. Muslin, chambray, flannel [S36].
- **Basket:** plain weave with threads in pairs. More texture, less stable [S36].
- **Twill:** over 2, under 2 (or 2/1, 3/1), offset each row, giving a diagonal wale. Strong, but frays [S36]. Denim is a warp-faced twill with an indigo warp and white weft, so it is blue outside and whitish inside [S38].
- **Satin:** long floats over 3, 4 or 7 threads and under 1 (4-, 5- and 8-harness), giving a glossy face and dull back. With staple cotton yarn the same weave is sateen [S37].
- **Herringbone:** a twill whose diagonal reverses every K threads [est]. It is a classic tweed structure, along with plain and twill [S39].
- **Leno / gauze:** pairs of warp yarns twist around the weft in a figure-eight. Open, sheer and stable [S41].

**A weave as a draft matrix** [est]: a binary R×R "warp on top" matrix, like the WIF/PTN files Thunderloom reads [S34]:
- plain: up = (i + j) mod 2;
- twill a/b: up = ((i + s·j) mod (a + b)) < a;
- satin n/m: up = ((i·m − j) mod n == 0), with m coprime to n and m ∉ {1, n−1};
- basket: plain at ⌊i/2⌋, ⌊j/2⌋;
- herringbone: twill with s = ±1, flipping every K columns.

From the draft, derive per cell:
- float length (the run of the same thread on top);
- thread height profile (a bump along the float, flattened for long floats: Thunderloom's Bend [S34], Substance's Shape [S26]);
- width and gap (Substance's Gap [S26], Thunderloom's Yarn Size [S34]).

**What the commercial generators expose:**
- Substance Designer's Weave Generator: Tile X/Y, Shape (stitch height profile), Weave (stitches per block), Gap and non-square compensation [S26].
- Substance Sampler's Cloth Weave adds [S27]:
  - pattern size by warp and weft;
  - fiber tension per direction;
  - per-thread colour count, width, thread type, fiber amount (0–8) and fiber finish;
  - imperfection intensity, normal intensity, a custom mask.

**Node set for the Athanor** [est]:
- Weave Draft (pattern + params) → Thread Profile (shape, gap, fibers, twist) → Yarn Irregularity (slub, width jitter, colour jitter).
- These output a "weave field" (height, tangent, thread id, gap).
- Drape Sim → Rasterize Mesh produces the uv, frame, depth, normal, compression and layer buffers.
- Map Weave Through Mesh combines the two and outputs the Light Engine's maps.

---

## 4. Real fabrics a seed can choose among

The bending, damping and threads columns are my starting presets [est], scaled by the fourth-root law [S17] and Marvelous Designer's descriptions [S23, S24]. Each look note carries its own tag.

| Fabric | Weave | Threads across a 1080 px card | Bend compliance (relative) | Look: what makes it |
|---|---|---|---|---|
| **Silk** (charmeuse, habotai) | plain or satin | 300–600 (sub-pixel; anisotropy only) | ×100 (very soft) | Flat filament yarns give narrow highlights (γ_s about 2.5–5°) [S31]. Many small folds [S23, S24]. Shot silk has different warp and weft colours, with coverage about 0.86/0.14 [S31]. |
| **Satin** | 4–8 harness satin | 300–500 | ×50 | Long floats reflect strongly; glossy face, dull back [S37]. One dominant highlight direction, coverage about 0.9 [S31]. Liquid, high-contrast folds [est]. |
| **Muslin / gauze** | loose plain, or leno | 80–200 | ×30 | Ranges "from delicate sheers to coarse sheeting" [S40]. Leno is sheer and lets light through [S41]. High translucency; overlapping layers show as darker bands [est]. |
| **Linen** | plain | 60–150 | ×3 | Slubs (thick-thin yarn), crisp folds that hold creases, matte with a slight lustre [est]. Twisted-cellulose lobes: k_d 0.3, γ_s 12° [S31]. |
| **Cotton canvas** | plain or basket, heavy yarn | 40–90 | ×0.3 | Even, round threads, matte (high k_d), fold-resistant: few broad, blunt folds [est]. Burlap is used as a painting support [S42], and so is canvas [est]. |
| **Denim** | 3/1 or 2/1 warp-faced twill | 50–120 | ×0.2 | Diagonal wale [S36]. Blue warp and white weft show as speckle [S38]. Fades at seams and creases [S38]. Darker at grazing angles [S34]. Stiff [S24]. |
| **Wool tweed** | plain, twill or herringbone | 30–80 | ×0.3 | Flecks from wool dyed before spinning; rough but soft and open [S39]. Fuzzy sheen and blurred thread edges [est]. Resists bending [S23]. |
| **Burlap / hessian** | coarse, open plain | 15–40 | ×0.1 | Coarse jute, flax or hemp [S42]. Big gaps (high translucency through holes), strong slub, hairy fibres, stiff, crumples into few big folds [est]. |
| **Velvet** | pile on a base weave | (pile hides weave) | ×1–×3 heavy | Rim and grazing sheen [S33]. Fibres point along the normal [S31]. Pile direction changes shade [S44]. Deep, soft folds, very dark valleys [est]. |
| **Lace** | not woven: open motif | n/a | ×20 | Treat as an alpha/translucency motif map (seeded rosettes and net) over a fine net, with no weave lobes [est]. |

**Rules of thumb for a seed** [est]:
- Heavy fabrics (canvas, burlap, denim, tweed, velvet) get stiff bending, few broad folds and slower settles.
- Light fabrics (silk, satin, muslin) get soft bending, many small folds and stronger sub-grid wrinkles.
- Because fold width ∝ (bending)^(1/4) [S17], space the presets by about 10× in compliance between neighbouring weights.
- The old ladder maps onto this table: silk → twill (denim) → linen → canvas → burlap. The new axis is drape (pin recipe), independent of fabric.

---

## 5. What PoetryPress could do that others don't (opinionated)

1. **Weave that truly follows the folds, in a 2D app.**
   - Filter Forge and Substance-style generators make flat tiling weave.
   - Marvelous Designer drapes but needs a 3D renderer.
   - Mapping a procedural weave through a tiny settled mesh, with foreshortening-aware filtering and screen-space thread directions handed to a relightable 2D engine, is a gap between those tools [est].
2. **Simulate once, relight forever.** Cache the settled mesh. Light, colour, weave, sheen and wear are all post-sim and instant, and only the drape knobs re-simulate. This is the honest route to "full cloth simulation for half the cost" [est].
3. **The fold taxonomy as the UI.** Present drapes by the artist's names (pipe, diaper, drop, spiral, half-lock, zigzag, inert), each a pin recipe [S14, S15, est]. That is friendlier than physical parameters, and the Athanor can still expose the pins.
4. **Poem-aware drapery.**
   - Use the text block as an invisible support so the cloth lies flat and readable under the lines, with folds gathering around it.
   - Or pin the cloth at stanza breaks, so the poem's structure literally hangs the fabric.
   - Readability becomes a constraint in the sim, not a post-effect [est].
5. **Seed-stable across browsers.** Use Float64, a fixed constraint order, no transcendentals in the loop, and a fixed frame cap, so a shared seed gives the same folds on Firefox and Chrome [est]. Most web sims never promise this.
6. **Thread-level lighting as a feature.** A movable light that makes satin's highlight slide along the folds, velvet's pile flip shade, and gauze glow when backlit will sell the cloth more than any amount of geometry [S31, S33, S44, est].

---

## Appendix A: The benchmark behind the [bench] numbers

- **Setup:** a single-threaded Node 22 script at /tmp/claude-0/-home-claude/9a783686-a833-54b9-840c-84e00218ad9d/scratchpad/bench/xpbd_bench3.js.
- **Scene:** a 1 m square N×N sheet hung from a rod at gather 0.6, with every 4th top particle pinned.
- **Constraints:** XPBD distance constraints:
  - structural, compliance 0;
  - shear, compliance 1e-6;
  - bend (0,2) and (2,0), compliance 1e-3.
- **Solver:** Gauss–Seidel; optional tethers to the nearest pin (rest distance from the flat sheet), a velocity clamp of 0.5 spacing per substep, and per-frame velocity damping.

| N | Substeps × iterations | Frame rate | Start | Frames | Mean stretch error | RMS speed at end | Time (Xeon 2.1 GHz) |
|---|---|---|---|---|---|---|---|
| 96 | 10×1 | 60 | flat, no tethers | 240 | 6–98% | 0.6 m/s (never settles) | 4.9 s |
| 96 | 1×10 | 60 | flat, no tethers | 240 | 31% | 0.2 | 4.6 s |
| 96 | 1×10 | 60 | flat + tethers | 240 | 0.73% | 0.0023 | 4.6 s |
| 96 | 2×5 | 60 | flat + tethers | 180 | 0.39% | 0.0028 | 3.7 s |
| 96 | 10×1 | 60 | flat + tethers | 240 | 2–3% | 0.4–0.6 (buzzing) | 6.1 s |
| 128 | 8×1 | 60 | flat, no tethers | 180 | blew up | — | 5.4 s |
| 64 | 2×5 | 60 | flat + tethers | 150 | 0.39% | 0.011 | 1.4 s |
| 64 | 2×5 | 30 | pre-buckled + tethers | 30 / 60 | 1.0% | 0.007 / 0.0036 | about 0.4 / 0.77 s |
| 96 | 2×5 | 30 | pre-buckled + tethers | 30 / 60 | 1.0% | 0.0042 / 0.0028 | about 0.75 / 1.5 s |

- **Per-constraint cost:** about 40–50 ns per distance constraint per sweep in V8 [bench].
- **Phone:** expect 2–4× slower [est].

---

## Sources

- **S1.** Jakobsen, T. "Advanced Character Physics" (GDC 2001 / Game Developer). https://gamedeveloper.com/programming/advanced-character-physics
- **S2.** Provot, X. "Deformation Constraints in a Mass-Spring Model to Describe Rigid Cloth Behavior," Graphics Interface 1995. https://graphicsinterface.org/wp-content/uploads/gi1995-17.pdf
- **S3.** Müller, Heidelberger, Hennix, Ratcliff. "Position Based Dynamics" (VRIPHYS 2006; JVCIR 2007). https://alecjacobson.com/seminar/mueller-et-al-2007.pdf (bibliographic record: https://diglib.eg.org/items/deb0a7a1-2ddf-496f-889a-fe0df1feeb73/full)
- **S4.** XPBD formulation (Macklin, Müller, Chentanez, MIG 2016), as restated in Stuyck & Chen, "DiffXPBD." https://arxiv.org/html/2301.01396v3 (I couldn't fetch the original XPBD PDF.)
- **S5.** Macklin et al. "Small Steps in Physics Simulation," SCA 2019. https://diglib.eg.org/items/322424d5-a24f-490a-a6bb-542233852032/full
- **S6.** Bouaziz et al. "Projective Dynamics: Fusing Constraint Projections for Fast Simulation," SIGGRAPH 2014. https://users.cs.utah.edu/~ladislav/bouaziz14projective/bouaziz14projective.pdf
- **S7.** Müller, Ten Minute Physics #14 "Cloth Simulation," JS source. https://github.com/matthias-research/pages/blob/master/tenMinutePhysics/14-cloth.html (read via raw.githubusercontent.com)
- **S8.** Müller, Ten Minute Physics #15 "Self-Collision," JS source. https://github.com/matthias-research/pages/blob/master/tenMinutePhysics/15-selfCollision.html
- **S9.** GIGAZINE on Ten Minute Physics (the 6,400-triangle cloth at 30+ fps on a smartphone). https://gigazine.net/gsc_news/en/20221212-ten-minute-physics/
- **S10.** Kim, Chentanez, Müller. "Long Range Attachments: A Method to Simulate Inextensible Clothing in Computer Games," SCA 2012. https://diglib.eg.org/items/909412a2-8791-41ce-acba-f084965a2633/full
- **S11.** Unreal Engine API, FClothTetherData. https://dev.epicgames.com/documentation/unreal-engine/API/Runtime/ClothingSystemRuntimeCommon/FClothTetherData?lang=en-US
- **S12.** "Position-Based Nonlinear Gauss-Seidel for Quasistatic Hyperelasticity." https://arxiv.org/pdf/2306.09021
- **S13.** Müller & Chentanez. "Wrinkle Meshes," SCA 2010. https://diglib.eg.org/items/b3de6809-9e17-45cf-97db-d781b7661125/full
- **S14.** Swinton's Art. "7 kinds of fabric folds that are good for painting." https://swintonsart.com/post/7-kinds-of-fabric-folds-that-are-good-for-painting
- **S15.** Proko. "A Review of The 7 Folds." https://www.proko.com/lesson/a-review-of-the-7-folds
- **S16.** Penguin Random House, Hogarth, *Dynamic Wrinkles and Drapery* (description). https://penguinrandomhouse.com/books/81469/dynamic-wrinkles-and-drapery-by-burne-hogarth
- **S17.** "Stretching Hookean ribbons: from buckling instability to tensional wrinkling," which states the Cerda–Mahadevan law. https://ar5iv.arxiv.org/html/2012.13051
- **S18.** Jimenez et al. "Practical and Realistic Facial Wrinkles Animation" (GPU Pro 2), project page. https://iryoku.com/wrinkles/
- **S19.** GameDev.net. "How to write / setup shaders that support wrinkle maps." https://www.gamedev.net/forums/topic/675523-how-to-write-setup-shaders-that-support-wrinkle-maps/
- **S20.** BlenderArtists. "Revised mesh tension add-on." https://blenderartists.org/t/revised-mesh-tension-add-on/1239091/1
- **S21.** Folds Modifier (tension map for Blender), docs. https://superhivemarket.com/products/folds-modifier/docs
- **S22.** Style3D. "How Do Normal Maps Add Realistic Wrinkles to 3D Garments?" https://www.style3d.com/blog/?p=13034
- **S23.** Marvelous Designer. "Adjust Buckling Ratio." https://support.marvelousdesigner.com/hc/en-us/articles/47358420908313-FABRIC-PHYSICAL-PROPERTIES-Adjust-Buckling-Ratio
- **S24.** Marvelous Designer. "Adjust Bending-Weft/Warp." https://support.marvelousdesigner.com/hc/en-us/articles/47358432358809-FABRIC-PHYSICAL-PROPERTIES-Adjust-Bending-Weft-Warp
- **S25.** CLO. "Adjust Buckling Stiffness." https://support.clo3d.com/hc/en-us/articles/115002685527-Adjust-Buckling-Stiffness
- **S26.** Adobe Substance 3D Designer. "Weave Generator." https://experienceleague.adobe.com/en/docs/substance-3d-designer/using/substance-graphs/nodes-reference-for-substance-graphs/node-library/texture-generators/patterns/weave-generator
- **S27.** Adobe Substance 3D Sampler. "Cloth Weave." https://experienceleague.adobe.com/en/docs/substance-3d-sampler/using/filters/generators/cloth-weave
- **S28.** Adobe Substance 3D Designer. Node library (Normal Sobel / Normal Blend / HBAO / Curvature listings). https://experienceleague.adobe.com/en/docs/substance-3d-designer/using/substance-graphs/nodes-reference-for-substance-graphs/node-library/node-library
- **S29.** Irawan & Marschner. "Specular Reflection from Woven Cloth," ACM TOG 2012 (abstract page). https://www.cs.cornell.edu/~srm/publications/TOG12-cloth.html
- **S30.** Irawan & Marschner. "A Simple, Accurate Texture Model for Woven Cotton Cloth," Cornell tech report 2006. https://en-cg-web.coecis.cornell.edu/pubs/2006/IM06.pdf
- **S31.** Sadeghi, Bisker, De Deken, Jensen. "A Practical Microcylinder Appearance Model for Cloth Rendering," ACM TOG 2013. https://datarepo.eng.ucsd.edu/visiondata/obisker/public_html/cloth/microcylinder-sg13.pdf
- **S32.** Estevez & Kulla. "Production Friendly Microfacet Sheen BRDF," SIGGRAPH 2017 course. https://blog.selfshadow.com/publications/s2017-shading-course/imageworks/s2017_pbs_imageworks_sheen.pdf
- **S33.** Google Filament. "Physically Based Rendering in Filament," cloth model section. https://google.github.io/filament/main/filament.html
- **S34.** Thunderloom fabric shader docs (V-Ray). https://derekflood.powweb.com/renderdocsDir/texture/fabricShader.html
- **S35.** Montazeri et al. "Mechanics-Aware Modeling of Cloth Appearance" (abstract). https://arxiv.org/abs/1904.11116v1
- **S36.** A Thrifty Notion. "Weave Patterns ep.1: Plain, Basket, Twill, and Satin." https://athriftynotion.com/blogs/a-thrifty-notion/weave-patterns-ep-1-plain-basket-twill-and-satin
- **S37.** Wikipedia. "Satin." https://en.wikipedia.org/wiki/Satin
- **S38.** Wikipedia. "Denim." https://en.wikipedia.org/wiki/Denim
- **S39.** Wikipedia. "Tweed." https://en.wikipedia.org/wiki/Tweed
- **S40.** Wikipedia. "Muslin." https://en.wikipedia.org/wiki/Muslin
- **S41.** Wikipedia. "Leno weave." https://en.wikipedia.org/wiki/Leno_weave
- **S42.** CAMEO (Museum of Fine Arts Boston). "Burlap." https://cameo.mfa.org/wiki/Burlap
- **S43.** Wikipedia. "Nap (fabric)." https://en.wikipedia.org/wiki/Nap_(fabric)
- **S44.** Threads Magazine. "How to Sew Velvet Like a Pro." https://www.threadsmagazine.com/2009/11/17/how-to-sew-velvet-like-a-pro

**Searched but not readable:**
- the original PBD and XPBD PDFs on matthias-research.github.io (fetch blocked);
- the full Irawan & Marschner 2012 PDF and the Sadeghi SIGGRAPH disc copy (robots-disallowed; the UCSD copy of Sadeghi, S31, was read instead);
- Wikipedia "Slub" (blocked);
- Hogarth's book text;
- any primary source on Uncharted / The Last of Us cloth wrinkle tech.

Claims that would have rested on these are marked [est] or noted as unverified.
