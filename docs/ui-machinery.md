# The page's machinery

How the interface works: the tabs and the phone layout, the preview, locks and dice, undo and the filmstrip, dialogs, the draft, the dials, the controls' wiring (appEvents.js and its ui*.js modules). Moved from AGENTS.md §5.7; read it before touching the interface.

- **Kinesis** (docs/prior-art/film-studio.md): on a desk the Moving Image's cards (`#movingBody`) move from their sheet
  into the Kinesis tab (`placeKinesis`, appEvents.js), so the stage beside them shows the page and then each frame as it
  is drawn; a held or right-clicked Save, or Esoterica's Make a film of the page…, opens the tab there (`showKinesis`).
  On a phone, or a window too narrow for the Esoterica drawer, the tab isn't shown and the cards stay in the sheet,
  which fills the screen, a preview box held at its top (`movingShow`: the page, each frame as it is made, then the
  film looping) and its foot held at the bottom. While a film is made the rest of the page is
  inert and faded (`movingInert`, body.film-making), the tabs don't change and no shortcut runs, and the preview's
  scale holds (`applyPreviewScale`).
- **`refreshUi()`** is THE refresh: every view of a value made to match it.
  - It is called after `restoreSettings`, undo/redo, and every
    `withLocksPreserved` (presets, randomisers, readings).
  - A new view of a value registers there, or in `SUBBLOCKS` / `ANGLES`.
- **Locks and dice:**
  - `LOCKABLE` covers the listed ids plus every slider and menu in the
    making tabs.
  - Master locks (`addMasterLock`) sit in each card's heading and in each
    sub-section's switch row.
  - Eyes are the old enable checkboxes (class `eye`); a card's own is moved
    into its heading (`CARD_EYES`). Both live in `.head-tools`, which never
    folds its section.
  - A die beside each lock rerolls only that section (`rollSection(root, level)`).
    - Three ways (Ruby): **gently** (sliders ±8%; colours drift together and
      a touch apart; the light turns a little; menus and switches stay, so the
      surface never changes; a typeface may become a similar one,
      `similarFont`), **as usual**, **wildly** (whole ranges, every menu, any
      colour, the light anywhere; never a switch).
    - The way is chosen from a long press on a phone, ▾ beside the die on a
      desk, and **remembered** (localStorage `uv.dice.level`, an app
      preference). Every die, the three Summon buttons and the light's ⚄
      roll that way; seed-only buttons don't. Dice show it (⚁ ⚄ ⚅).
    - **Back** (`dieBack`) puts back only what the section's last roll
      changed. A Summon that asks first is recorded once its work has run.
    - On the Surface, Shift-click (or a desk's long press) rolls only the
      seed; on a phone that is a menu item.
    - **One control alone** (`rollByLabel`, `rollControl`): Ctrl- or ⌘-click
      a control's name on a desk, or hold it on a phone; the dice's way.
  - **Above the presets** (ROADMAP H1, the preset level): **Summon
    Variation** (a new seed, now and then another reading: what a click on
    a lit preset does; a frozen seed leaves only the reading), **Mutate
    Gently** (every section's die, gently, at once) and **Freeze This Seed**
    (the seed's padlock as a button; `paintFreeze` keeps it pressed with the
    lock).
  - **Locks supersede every roll** (Ruby): rolls skip locked controls, and
    `restoreLocked` puts menus back before sliders (a surface put back resets
    its sliders).
- **Hints written out** (Ruby: readable on a phone, and switchable for
  density): every card's heading has ⓘ (`addHintsButton`), which writes each
  control's `title` under it as a small `.tip-line` (`writeHints`, kept current
  by `refreshHints` in `refreshUi`); the **Hints** switch (Esoterica →
  Interface, localStorage `uv.hints.on`, an app preference) writes them out
  everywhere. A `.hint-extra` note shows only with its card's hints. So a
  control's tooltip is its phone hint too: write it as one. A hint takes its own
  line in any row it is written into (`:has(> .tip-line)` wraps the row): one
  laid beside a row of buttons once slid a phone's panel sideways, and
  `tools/fit-audit.py` looks for that.
- **Asking and refusing:**
  - `askSure({title, body, confirmLabel, danger})` is the soft no, the app's
    own modal (never `confirm()`).
  - `hardNo(title, body)` is the hard no.
  - `toast(text)` is a quiet line; window errors become toasts too.
  - `state.ui.edits` counts commits since the last fresh start
    (`markFresh`). Past `GUARD_EDITS` (6), the `GUARDED` buttons (random
    font, random backdrop, random surface, apply spell, load JSON) and the
    presets ask first.
- **Every look from outside** (JSON, a spell, a saved tile) goes through
  `safeRestore`:
  - `checkLook` first (at most `LOOK_MAX_JSON`, and the Athanor graph
    through `validateGraph`);
  - then `restoreSettings`;
  - rolled back whole on a throw.
- **Layout:** `wantPhoneLayout` is the window's SHAPE (w/h ≤ 2/3), not its
  width.
  - The phone's rules are scoped to `body.is-mobile`.
  - In focus mode there is one scroller.
  - The editor's mirror matches the textarea's metrics.
  - The textarea is grown to its content (one line of slack, `fitHeight`)
    inside the scrolling `.editor-wrap`, and must never scroll itself: a
    scroll on it is undone and the height refitted (Firefox measured long
    edits short, and the last lines could not be reached). Fonts arriving
    and the room changing (`fitEditorRoom`) repaint it.
  - While the phone's keyboard is up, `fitEditorRoom` leaves the poem
    `WRITING_LINES` (12) and gives the preview the rest (`--kb-stage-h`).
    The PML guide opened then lies over the preview (`--guide-top`,
    `--guide-h`); a press on PML or in the guide never takes the poem's
    focus, so the keyboard stays up.
- **Text layout:** fitting predicts the size and checks the grid around it.
  Widths are remembered and cleared when a font arrives. Keep new text
  layout on that path: text measurement once took ~70% of the page's CPU.
- **THE POEM'S LAYOUT** (`TEXT_LAYOUT`, `textLayoutNow()`):
  - Each frame records its text runs as `x0,y0,x1,y1,line,stanza,rhyme;…` in page
    fractions.
  - After the runs come the punctuation marks as `x,y,mark` (`notePunct` in
    drawTextRun, while `PUNCT_NOW` is a list; `POEM_PUNCT` and `punctMark` in
    steps.js; `poemMarks` reads them). They are three numbers so every reader
    of the runs (which all want four or more) passes them over: keep it so.
    The Poem's ninth output, Punctuation, glows on them.
  - A surface drawn before the text reads the previous frame's record. A
    change asks for one more frame, and only when something reads it.
  - **Text Clearing** (`textureClearing`) takes a soft mask of the runs out
    of each surface layer. The mask is 192 px across, blurred there.
  - **Protect the Text** (`protectText`, ROADMAP G3) raises Text Clearing to
    the least that brings every line to `READABLE.ratio` (tunables.js).
    `measureTextGround()` draws a frame that keeps a small copy of its ground
    just before the words, and `groundContrast` reads each run against it,
    segment by segment in the ink written there (accents, a gradient along
    a segment, the page's text gradient, a quote's faintness). It never
    lowers the clearing and a lock holds it; a line clearing can't help is
    named by its words and left out of the aim.
  - The **Ink** part hands a graph the text color (after the two accents in
    `ctx.accents`); only a graph with one keys its cache on the ink.
  - **The surface and the words** (Ruby; layer keys `textureTextAware`,
    `textureTextBlend`, `textureShapeAware`, `textureTextCut`, saved with
    each layer, a look without them aware, unblended and uncut):
    - **Text Aware** (the first surface's box, ticked by default): only an
      aware surface is handed the layout; unticked, it is drawn as if the
      page had no words. The Poem's `aware` output says which.
    - **Blend with Text** (the second surface's box): the lower layer is not
      drawn under the page; while the words are drawn, every glyph fill is
      mirrored white onto `GLYPH_MASK` (`maskGlyphs`, with the context's own
      transform), and after them the page is copied, the surface drawn onto
      the copy with its own blend and opacity (`drawSurfaceLayer`), the copy
      cut to the mask and laid back. Effects and underlines stay unfilled.
    - **Shape Aware** (either surface; greyed on the first while it is not
      Text Aware). In the letters (with Blend with Text) the request carries
      `fill` (keyed `_F` for a poem-reading surface) → `ctx.fill`; The
      Poem's `in the letters` is 1. Parts that answer it read `ctx.fill`
      and the lines (`genLinesOf(ctx.text)`): Glass Shards lies only on the
      lines, Dewy Webs strings a web across each; Circuit Traces, Halftone
      Screen, Hatching, Flow Lines and Terrain go finer. On the page it
      carries `around` (keyed `_R`) → `ctx.around`, The Poem's `round the
      words`: the surface gives way round the words (Ruby: "literally
      anything that generates high contrast patterns all over the page …
      avoid the text or highlight the text or interact with the text").
      **Shape Strength** (`textureShapeStrength`, per layer, 100 for a look
      without it; Ruby: "a slider to soften the shape awareness") makes both
      numbers 0..1 (`fill`, `around`; keyed `_F` and `_R` followed by the strength); a part scales
      what it does by them. `wordsRoom(ctx, ww, wh, pad, reach)` (texCore)
      is 0 on and about each line, 1 a reach away (below full strength the
      words keep `1 - strength` of it): Halftone Screen's dots and
      Hatching's strokes shrink by it, Flow Lines bend along its contour and
      end on the words, Terrain levels the land under them to one height
      (contours ring the poem), Circuit Traces routes round what Keep Clear
      gives, Glass Shards drops a shard that would touch a line, Dewy Webs
      keeps a web to its hub's room, Knotwork leaves the cells out
      (`o.hole`), Panes sets the poem in one pale pane (`chamferDistance` for
      the came round it), Facet Field flattens whole facets, Turing Pattern
      kills its second chemical there, and Deep Field's star layer fades its
      stars (the renderer hands `astral_stars` the layout under Shape
      Aware). A chain that
      answers always says `poem: 'lines'`; one that answers only Shape Aware
      says `poem: 'shape'` (handed the layout only then, so typing never
      redraws it otherwise; `chainReadsPoem(type, shaped)`).
    - **Cut Out by Text** (either surface; Ruby: "so the page shows through
      the letters"): the page as it is before the first such surface is
      kept (`CUT_CANVAS`), and after the words it is laid back inside the
      glyph mask: the letters are windows, their effects still round them.
    - Text Aware used quietly (readability, never dramatic): a shard on a
      line is a small one; a web's hub is never on the words.
- **Stitches** (stitches.js):
  - `STITCH_STYLES` is the menu; parse with `STITCH_NAMES`; draw through
    `stitchOf()`.
  - `STITCH_ALIASES` maps retired stitches to their relatives.
  - Every motif has an `edge` (its silhouette); a new motif needs one too.
- **Linked controls:** `data-link="<id>"` with
  `data-link-switch="<checkbox>"` mirrors two controls both ways while the
  switch is on (the box ⛓ border).
- **The camera tilt** (texCore `obliqueFrame` / `obliqueRender`):
  - Build the ground on the frame's patch (larger than the page), light it
    from above, then render.
  - Tilt 0 returns `flat`: the texture is exactly its top-down self.
- **The camera dial** (right of the light dial; Ruby: the light dial is only
  the light):
  - A texture opts in with `caps.camera {turn, view, zoom, guide}` (its
    defaults; guide `'plane'` or `'ring'`). Its chain takes the camera from a
    `camdial` part (Turn, View, Zoom), wired like a knob.
  - An Athanor graph gets the dial when its Camera Dial reaches the Surface
    (`athanorCamera`; `applyAthanorGraph` sets `TEXTURE_CAPS.athanor.camera`,
    from the menu texture of the same name when there is one).
  - `opts.camera` → `cameraOf()` → the cache key `_cm` and `ctx.camera`; only
    a texture with the caps keys on it. Layer keys `cameraTurn/View/Zoom`,
    locked with the light (LOCKABLE), saved and restored (`putCamera`).
  - Deterministic: the same camera draws the same picture. While it moves,
    `cameraGuide()` draws a wireframe of the shot over the preview (fast, no
    render); the render follows on release.
  - Phone: the two dials side by side, the hues under both in two columns.
- **The two dials, a standing goal** (Ruby: "every time you look at a
  texture that has a camera and a viewport you should consider improvements
  to usability using these dials"):
  - Any tilt, pan, turn, zoom or position slider belongs on the camera
    dial (Turn, View, Zoom). Any light is placed with the light dial
    (direction and height; `caps.lowLight` lets it past the rim).
  - Use them creatively where it stays intuitive (Ringworld: the light dial
    is the time of day).
  - **The dial's guide** (`drawDialGuide`; Ruby: "anytime we use a light
    dial as a position selector or a light selector we need some kind of
    indicator of where on screen we are positioning a thing before the
    render"): while the light dial moves, what it places is drawn over the
    page at once, and stays until the new picture has landed
    (`holdGuideUntilMade` waits on `texturesSettled`; the camera's
    wireframe does the same). The marks, per surface (`DIAL_GUIDES`,
    `dialGuideMarks`, places by `dialGuidePlace`):
    - *sun*: any surface lit by the dial, at the dial's place stretched
      onto the page (`pageSunAt`), turned against a camera that turns the
      ground; the Ringworld's through its camera (`ringSunGuide`);
      the rim light's in the second accent.
    - *impact* (Crackle: where its cracks burst from), *place* (Transmutation
      Circle: its centre and size), *arrow* (wind, rain, a flow, a run of
      pigment: its heading),
      *axis* (hatching, breaths, aurora rays: their line).
    - A new surface whose dial places or heads something adds its entry to
      `DIAL_GUIDES` (check it against a render: the guide must match the
      picture). Every control on a dial must do what its handle suggests: a
      turn that changes nothing is worse than no dial.
  - Done: Lichtenberg, Ringworld, Broken Glass, Scrying Pool, Dune Ripples,
    Moss on Stone, Black Hole (format 7). Waiting: ROADMAP C5, C6 (the
    lighting audit: which surface is lit how, and what moves next).
- **The oblique camera's turn and lens** (texCore `obliqueFrame(ww, wh,
  tilt, hRange, cam)`, `cam {turn, zoom}`):
  - Turn spins the ground about the view's centre the way `groundCam`
    does, so the dial means one thing everywhere. Zoom is the lens, 60% to
    400% (the patch grows as the square of zooming out).
  - Tilt 0 with a turn or zoom is a straight-down camera, not `flat`: no
    haze, no sky mirrored in the water.
  - The kitWhole parts read Turn and Camera Zoom with `wholeCam` and turn
    the light against the camera (`wholeTurned`), so the sun stays where
    the light dial points while the ground turns under it.
  - Old looks: the Tilt slider's value became the camera's View (format 4,
    `retireFormat4Layer`); at the defaults the pictures are unchanged.
- **The report:** pmlVars drops a line whose surface variable has nothing to
  say (`LINE_DROP`, `ctx.surfOff`). `§Build` shows the release name.
- **`$` for `§`** (Ruby; `§` is hard to reach on a keyboard): pmlVars
  `dollarsAsSections` turns `$` into `§` before a known name
  (`PML_VAR_NAMES`) or `style`, first thing; `$5` and `\$` stay as typed.
  The editor's `varAt` marks the same names.
- **Sounds** (murmur.js): a sound design is data (`MURMUR_DESIGN`).
  - It holds a scale (D aeolian), instruments made of real partials, and
    compositions in scale degrees, so everything is in key.
  - `MURMUR_FUNCTIONS` maps each UI function to a composition, or to
    silence.
  - The app plays UI functions (`murmur.play('saveImage')`,
    `data-sound="athanorOpen"`), never notes. Most are silent: sounds are
    for long work finishing, complicated actions, and asking.
  - `confirm` is the soft no, `hardNo` two knocks, `blocked` one knock.
  - Ruby shapes it in tools/murmur-studio.html; the tests check the studio
    is current.
  - Off by default; its switch and volume are in localStorage.
