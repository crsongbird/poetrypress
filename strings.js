/**
 * strings.js — every user-facing string in one editable place.
 *
 *   Say it once, plainly.
 *   Say it again, differently.
 *   Keep the better one.
 *
 * HOW IT WORKS: elements in the markup carry `data-str="key"`. At boot
 * applyStrings() writes the value from UI_STRINGS into each one, so the
 * markup holds a readable default and this file is the single place to
 * change wording. Editing a value here changes the app — no other file
 * needs touching.
 *
 * Dialog text lives in DIALOGS below, since those strings never appear in
 * the markup at all.
 */

export const UI_STRINGS = {
  // ---- tab ----
  'tab.inscription':                        "Inscription",
  'tab.rituals':                           "Rituals",
  'tab.thoughtforms':                      "Thoughtforms",
  'tab.materia':                           "Materia",
  'tab.esoterica':                         "Esoterica",

  // ---- card ----
  'card.incantation_editor_poetic_magick_l': "Incantation Editor (Poetic Magick Language)",
  'card.arcane_guidance_pml_syntax':       "Arcane Guidance (PML Syntax)",
  'card.form_amp_bearing':                 "Form & Bearing",
  'card.builtin_presets':                  "Built-In Presets",
  'card.custom_presets':                   "Custom Presets",
  'hint.custom_presets_empty':             "Use ＋ Save this look to keep the current look here, under a name you choose.",
  'card.script_options':                   "Script Options",
  'card.typeface_effects':                 "Text Effects",
  'card.backdrop_color':                   "Backdrop Color",
  'card.surface_texture':                  "Surface Texture",
  'card.border_options':                   "Border Options",
  'card.inset_box':                       "Inset Box",
  'card.vignette_options':                 "Vignette Options",
  'card.appearance':                       "Interface",
  'card.spellcrafting':                    "Spellcrafting",
  'card.grimoire':                         "Grimoire",
  'card.workbench':                        "Workbench",

  // ---- hint ----
  'hint.standard':                         "Standard",
  'hint.landscape':                        "Landscape",
  'hint.create_saves_the_current_look_as_a': "Create saves the current look as a spell. Invoke puts it back on the page.",
  'hint.the_grimoire_is_empty_record_a_poe': "The Grimoire is empty. Record saves your poem's text here.",
  'hint.spells_are_looks':                  "Spells keep looks: every setting, but not the poem's words.",
  'hint.grimoire_keeps_words':              "The Grimoire keeps poems: the words only. Choose one, then Invoke or Dissolve.",

  // ---- button ----
  'button.randomFontBtn':                  "⟳ Summon New Typeface",
  'button.randomBgBtn':                    "⟳ Summon New Backdrop",
  'button.randomSurfaceBtn':               "⟳ New Random Surface",
  'button.revealSurfaceBtn':               "🜉 Edit in the Athanor",
  'button.protectTextBtn':                 "◐ Protect the Text",
  'button.summonVariationBtn':             "⟳ Summon Variation",
  'button.mutateGentlyBtn':                "≈ Mutate Gently",
  'button.freezeSeedBtn':                  "❄︎ Freeze This Seed",
  'button.spellCreateBtn':                 "Create",
  'button.spellApplyBtn':                  "Invoke",
  'button.spellShareBtn':                     "Share",
  'button.spellDeleteBtn':                 "Dissolve",
  'button.spellExportBtn':                 "Export JSON",
  'button.spellImportBtn':                 "Import JSON",
  'button.poemSaveBtn':                    "Record",
  'button.poemApplyBtn':                   "Invoke",
  'button.poemDeleteBtn':                  "Dissolve",
  'button.poemExportBtn':                  "Export JSON",
  'button.poemImportBtn':                  "Import JSON",
  'button.advancedRefreshBtn':             "↻ Refresh",
  'button.advancedCopyBtn':                "⧉ Copy",
  'button.advancedLoadBtn':                "⇩ Load settings from JSON above",
  'button.resetViewBtn':                   "⟲",
  'button.downloadBtn':                    "Save image",
  'button.modalConfirm':                   "OK",
  'button.modalCancel':                    "Cancel",
  // ---- labels ----
  'label.script_highlighting':                 "Script Highlighting",
  'label.witch_artificer':                     "Witch / Artificer",
  'label.corner':                              "Corner",
  'label.spell_mark':                          "Show Spell Code",
  'label.aspect_ratio':                        "Aspect Ratio",
  'label.custom_resolution':                   "Custom Resolution",
  'label.width':                               "Width",
  'label.height':                              "Height",
  'label.alignment':                           "Alignment",
  'label.attunement_vertical':                 "Attunement (Vertical)",
  'label.typeface':                            "Typeface",
  'label.inscription_hue':                      "Inscription Hue",
  'label.maximum_size_px':                     "Maximum Size (px)",
  'label.breathing_room':                      "Breathing Room",
  'label.highlight_hue':                       "Specular Hue",
  'label.shade_hue':                           "Shadow Hue",
  'label.diffuse_hue':                         "Diffuse Hue",
  'label.fifth_hue':                           "Glow Hue",
  'label.text_margins':                        "Text Margins",
  'label.radial_gradient_text':                "Radial Gradient Text?",
  'label.aura_stops':                          "Aura Stops",
  'label.inscription_hue_2':                    "Inscription Hue 2",
  'label.inscription_hue_3':                    "Inscription Hue 3",
  'label.inscription_hue_4':                    "Inscription Hue 4",
  'label.radial_gradient_angle':               "Gradient Angle",
  'label.opposition_hue':                      "Opposition Hue",
  'label.conjunction_hue':                     "Conjunction Hue",
  'label.background_hue':                      "Background Hue",
  'label.radial_aura':                         "Radial Aura?",
  'label.aura_stops2':                         "Aura Stops",
  'label.aura_stop_2':                         "Aura Stop 2",
  'label.aura_stop_3':                         "Aura Stop 3",
  'label.aura_stop_4':                         "Aura Stop 4",
  'label.arc_angle':                           "Arc Angle",
  'label.customize_surface':                   "Customize Surface",
  'label.surface_variant':                     "Surface Variant",
  'label.text_clearing':                       "Text Clearing",
  'ph.preset_search':                          "Search looks: a name, a mood, a surface…",
  'note.preset_none':                          "No preset matches. Try a mood (rain, gold) or a surface (glass, paper).",
  'label.x':                                   "—",
  'label.x2':                                  "—",
  'label.opacity':                             "Opacity",
  'label.blend_mode':                          "Blend Mode",
  'label.light_direction':                     "Light Direction",
  'label.camera':                              "Camera",
  'label.tint':                                "Tint",
  'label.second_tint':                         "Second Tint",
  'label.texture_seed':                        "Texture Seed",
  'label.enable_border':                       "Enable Border",
  'label.border_hue':                          "Border Hue",
  'label.radial_gradient_border':              "Gradient Border?",
  'label.border_hue_2':                        "Border Hue 2",
  'label.border_hue_3':                        "Border Hue 3",
  'label.bloom':                               "Bloom",
  'label.enable_vignette':                     "Enable Vignette",
  'label.blend_mode2':                         "Blend Mode",
  'label.intensity':                           "Intensity",
  'label.aperture':                            "Aperture",
  'label.centre_x':                            "Center X",
  'label.centre_y':                            "Center Y",
  'label.grit':                                "Grit",
  'label.theme':                               "Theme",
  'label.soundToggle':                         "Sound",
  'label.hintsToggle':                         "Hints",

  // ---- options ----
  'option.dunes':                            "Dune Ripples",
  'option.kintsugi':                         "Kintsugi",
  'option.moss':                             "Moss on Stone",
  'option.rain_on_glass':                    "Rain on Glass",
  'option.rain_on_water':                    "Rain on Water",
  'option.dewy_webs':                        "Dewy Webs",
  'option.ringworld':                        "Ringworld",
  'option.painted_ringworld':                "Painted Ringworld",
  'option.ring_in_the_sky':                  "Ring in the Sky",
  'label.fx1_type':                          "Effect 1",
  'label.fx1_color':                         "Color",
  'label.fx1_angle':                         "Angle",
  'label.fx2_type':                          "Effect 2",
  'label.fx2_color':                         "Color",
  'label.fx2_angle':                         "Angle",
  'label.fx3_type':                          "Effect 3",
  'label.fx3_color':                         "Color",
  'label.fx3_angle':                         "Angle",
  'label.border_stitch':                     "Border Stitch",
  'label.border_stitch_out':                 "Points Outward?",
  'label.full_preview':                      "Full-Size Preview (slower; exactly as saved)",
  'label.border_angle':                      "Gradient Angle",
  'label.form':                              "Form",
  'label.border_blend':                      "Border Blend",
  'label.bloom_blend':                       "Bloom Blend",
  'label.box_gradient_shape':                "Gradient Shape",
  'option.box_linear':                       "Linear",
  'option.box_radial':                       "Radial",
  'option.box_rectangular':                  "Rectangular",
  'option.box_sweep':                        "Sweep",
  'option.box_mirrored':                     "Mirrored",
  'label.box_arc_angle':                     "Arc Angle",
  'label.box_opacity':                       "Opacity",
  'label.box_blend_mode':                    "Blend Mode",
  'label.gradient_shape':                    "Gradient Shape",
  'option.linear':                           "Linear",
  'option.radial':                           "Radial",
  'option.rectangular':                      "Rectangular",
  'label.text_gradient_shape':               "Gradient Shape",
  'option.text_linear':                      "Linear",
  'option.text_mirrored':                    "Mirrored",
  'option.text_radial':                      "Radial",
  'option.text_sweep':                       "Sweep",
  'option.sweep':                            "Sweep",
  'option.mirrored':                         "Mirrored",
  'label.center_x':                          "Center X",
  'label.center_y':                          "Center Y",
  'label.radius':                            "Radius",
  'label.thickness':                         "Thickness",
  'label.offset':                            "Offset",
  'label.grain':                             "Grain",
  'label.rounded_corners':                   "Rounded Corners?",
  'label.roundedness':                       "Roundedness",
  'label.inset_box':                         "Inset Box?",
  'label.box_glass':                         "Glass",
  'label.base_layer':                        "Two Surfaces",
  'label.text_aware':                        "Text Aware",
  'label.text_blend':                        "Blend with Text",
  'label.shape_aware':                       "Shape Aware",
  'label.text_cut':                          "Cut Out by Text",
  'label.shape_strength':                    "Shape Strength",
  'button.layer_upper':                      "Upper",
  'button.layer_lower':                      "Lower",
  'button.layer_swap':                       "⇅ Swap",
  'label.glass_strength':                    "Strength",
  'label.glass_scale':                       "Scale",
  'label.box_link':                          "⛓ Shape Linked to Border",
  'label.box_stitch':                        "Edge Stitch",
  'label.box_offset':                        "Offset",
  'label.box_thickness':                     "Thickness",
  'label.box_rounded':                       "Rounded Corners?",
  'label.box_roundedness':                   "Roundedness",
  'label.box_stitch_out':                    "Points Outward?",
  'option.glass_none':                       "None",
  'option.glass_frost':                      "Frosted Glass",
  'option.glass_lens':                       "Lens",
  'option.glass_reeded':                     "Reeded Glass",
  'option.glass_pixel':                      "Pixel Mosaic",
  'option.glass_emboss':                     "Emboss",
  'option.glass_prism':                      "Prism",
  'label.box_hue':                           "Box Hue",
  'label.box_gradient':                      "Box Gradient?",
  'label.box_hue_2':                         "Box Hue 2",
  'option.landscape':                         "Painted Landscape",
  'option.cityscape':                         "Night City",
  'option.blackhole':                         "Black Hole",
  'option.scrying_pool':                      "Scrying Pool",
  'option.fractal_moon':                      "Fractal Moon",
  'option.bottom_left':                        "Bottom Left",
  'option.bottom_right':                       "Bottom Right",
  'option.top_left':                           "Top Left",
  'option.top_right':                          "Top Right",
  'option.sleep_haze':                         "Sleep Haze",
  'option.dream_bloom':                        "Dream Bloom",
  'option.deep_field':                         "Deep Field",
  'option.euphoria_dust':                      "Pixie Dust",
  'option.burning_mana':                       "Sparkler",
  'option.first_snow':                         "First Snow",
  'option.aurora_veil':                        "Silk Ribbons",   // (was Aurora Veil: it looks like combed silk, not a sky; the id stays 'aurora')
  'option.aurora':                             "Aurora",
  'option.veins_of_light':                     "Veins of Light",
  'option.circuit_board':                      "Circuit Board",
  'option.knotwork':                           "Knotwork",
  'option.lichtenberg':                        "Lichtenberg Figures",
  'option.ruffled_growth':                     "Ruffled Growth",
  'option.cells':                              "Cells",
  'option.checkerboard':                       "Checkerboard",
  'option.gradient':                           "Gradient",
  'option.plain_noise':                        "Plain Noise",
  'option.polka_dots':                         "Polka Dots",
  'option.stripes':                            "Stripes",
  'option.waking_grain':                       "Waking Grain",
  'option.metal_leaf':                         "Scattered Polygons",
  'option.lotus_pond':                         "Lotus Pond",
  'option.painter_s_frustration':              "Painter's Frustration",
  'option.90s_dots':                           "Retro Dots",
  'option.still_rain':                         "Harsh Rain",
  'option.silverpoint_hatch':                  "Silverpoint Hatch",
  'option.sigil_scatter':                      "Sigil Scatter",
  'option.binary_pattern':                     "Binary Pattern",
  'option.summoning_circles':                  "Transmutation Circle",
  'option.rorschach_test':                     "Rorschach Test",
  'option.fractured_glaze':                    "Fractured Glaze",
  'option.crazed_glaze':                       "Crazed Glaze",
  'option.facet_field':                        "Facet Field",
  'option.cartomancy':                         "Cartomancy",
  'option.linen_tooth':                        "Linen Tooth",
  'option.cold_press':                         "Cold Press",
  'option.crystal_leaf':                       "Crystal Leaf",
  'option.metal_spangle':                      "Metal Spangle",
  'option.old_paper':                          "Old Paper",
  'option.cup_ring':                           "Cup Ring",
  'option.burnt_letter':                       "Burnt Letter",
  'option.turing_skin':                        "Turing Skin",
  'option.hoarfrost':                          "Hoarfrost",
  'option.flow_field':                         "Flow-Field Ink",
  'option.guilloche':                          "Guilloché",
  'option.chladni':                            "Chladni Sand",
  'option.contour':                            "Contour Map",
  'option.stained_glass':                      "Stained Glass",
  'option.under_glass':                        "Under Glass",
  'option.broken_glass':                       "Broken Glass",
  'option.suminagashi':                        "Suminagashi",
  'option.watercolour':                        "Watercolor Wash",
  'option.poured_wax':                         "Poured Wax",
  'option.overlay':                            "Overlay",
  'option.color_burn':                         "Color Burn",
  'option.color_dodge':                        "Color Dodge",
  'option.lighten':                            "Lighten",
  'option.rose':                               "Rosé",
  'option.aether':                             "Aether",
  'option.fathom':                             "Fathom",
  'option.vellum':                             "Vellum",
  // ---- the Athanor's bar ----
  'kept.keep':                             "Keep",
};

/**
 * Prompts and confirmations. `{name}` is replaced with whatever the dialog
 * is about — a spell's name, a poem's title.
 */
export const DIALOGS = {
  shareSpell: {
    title: 'Share \u201C{name}\u201D',
    bodyCopied: 'Link copied. Anyone who opens it can add this one spell (not your whole list) to their Esoterica.',
    bodyManual: 'Copy this link. Anyone who opens it can add this one spell (not your whole list) to their Esoterica.',
    confirm: 'Done',
  },
  shareLook: {
    name: 'A Shared Look',
    title: 'Name this look to share it',
    nameFirst: 'The link carries this name, and the look is saved to your spells as well.',
    bodyCopied: 'Link copied. Anyone who opens it can add the current look to their Esoterica.',
    bodyManual: 'Copy this link. Anyone who opens it can add the current look to their Esoterica.',
    confirm: 'Done',
  },
  receiveSpell: {
    title: 'A spell for you: \u201C{name}\u201D',
    body: 'Someone shared this look. Add it to your Esoterica? Your own spells stay as they are.',
    confirm: 'Add Spell',
  },
  shareBroken: {
    title: 'That spell did not survive the trip',
    body: 'The link was cut short or altered, so nothing was added. Ask for it again.',
  },
  spellCreate: {
    title: 'Keep this look?',
    body: 'Name it. Only the look is saved, not the poem (Record keeps poems in the Grimoire).',
    confirm: 'Yes (Inscribe)',
    cancel: 'No (Ignore)',
  },
  spellDelete: {
    title: 'Dissolve this spell?',
    body: '“{name}” will be removed from this browser.',
    confirm: 'Yes (Remove)',
    cancel: 'No (Retain)',
  },
  poemSave: {
    title: 'Record in the Grimoire?',
    body: 'Save the text of “{name}”? The look isn’t included (Create saves looks as spells).',
    confirm: 'Yes (Decide)',
    cancel: 'No (Deny)',
  },
  overwrite: {
    title: 'Overwrite?',
    body: 'A spell named “{name}” already exists. Replace it?',
    confirm: 'Replace',
  },
  exportList: {
    title: 'Export {name}',
    body: 'Copy this text somewhere safe. To restore it, paste it into Import JSON.',
    confirm: 'Done',
  },
  importList: {
    title: 'Import {name}',
    body: 'Paste a list made by Export JSON. Your current entries stay; duplicates and damaged entries are skipped.',
    confirm: 'Import',
  },
  importDone: {
    title: 'Import finished',
    /** {name} carries the counts. */
    body: '{name}',
    confirm: 'OK',
  },

  poemDelete: {
    title: 'Tear out this page?',
    body: 'Remove “{name}” from the Grimoire. This cannot be undone.',
    confirm: 'Yes (Preclude)',
    cancel: 'No (Preserve)',
  },
};

/** The visual menus (chooser.js): the surface menus shown as tiles. */
/** Blend modes by name, for every surface layer's menu (⚡: mixed per pixel, on the GPU when there is one). */
export const BLEND_NAMES = {
  'source-over': 'Normal', multiply: 'Multiply', screen: 'Screen', overlay: 'Overlay', 'soft-light': 'Soft Light', 'hard-light': 'Hard Light',
  darken: 'Darken', lighten: 'Lighten', 'color-dodge': 'Color Dodge', 'color-burn': 'Color Burn', lighter: 'Linear Dodge',
  difference: 'Difference', exclusion: 'Exclusion', hue: 'Hue', saturation: 'Saturation', color: 'Color', luminosity: 'Luminosity',
  'vivid-light': 'Vivid Light ⚡', 'linear-light': 'Linear Light ⚡', 'pin-light': 'Pin Light ⚡', 'linear-burn': 'Linear Burn ⚡',
  subtract: 'Subtract ⚡', divide: 'Divide ⚡',
  suits: 'Made for this surface', others: 'Every other blend', default: ' (default)',
};

/** The PML guide's examples (the Arcane Guidance): a button after each puts it in the poem. */
export const PML_GUIDE = {
  try: '⤓ Try',
  tryHint: 'Insert this example at the cursor, or at the end',
  tried: 'Added to your poem. ☋ Undo takes it out.',
};
/** The editor's hint line, under the poem, for a directive PML can't read ({d} is the directive as written). */
export const PML_HINTS = {
  unknown:     "/{d} isn't a PML directive, so it does nothing.",
  unknownLike: "/{d} isn't a PML directive. Did you mean /{like}?",
  value:       "/{d}: PML knows /{name}, but not the value after it, so it does nothing.",
  valueLike:   "/{d}: /{name} takes no value. Did you mean /{like}?",
  style:       "/@{name}: no style has that name. Define it on its own line: §style {name} = /color:rose",
  font:        "/{d}: no typeface has that name, so the line keeps its own.",
  where:       " (line {n}{more})",
  more:        ", and {n} more",
};
/** The two surface layers (the layer bar above the surface's controls). */
export const SURFACE_LAYERS = {
  swappedUp: 'Surfaces swapped: the lower one is now on top.',
  swappedDown: 'Surfaces swapped: the upper one is now beneath.',
};
// PROTECT THE TEXT (the button under Text Clearing): what it found and what it did.
// {words} is the faintest line's opening words, {ratio} its contrast, {need} the aim, {amount} the clearing.
export const PROTECT = {
  locked: 'Text Clearing is locked. Unlock it so Protect the Text can raise it.',
  noWords: 'No words on the page to protect.',
  already: 'Already readable: the faintest line, “{words}”, has {ratio}:1 contrast; {need}:1 is enough.',
  raised: 'Text Clearing raised to {amount}%: every line now has {ratio}:1 contrast or better.',
  raisedBut: 'Text Clearing raised to {amount}%: every line it can help now has {need}:1 or better. “{words}” can’t get there (at most {ratio}:1): its ink is too close to the backdrop.',
  short: 'Cleared all the way, but “{words}” now stands at {ratio}:1, short of {need}:1: its ink is close to the backdrop. Try a lighter or darker ink.',
  cannot: 'Clearing can’t help: “{words}” has {ratio}:1 contrast because its ink is close to the backdrop color. Try a lighter or darker ink or backdrop.',
  noSurface: 'No surface is on, so there is nothing to clear. “{words}” has {ratio}:1 contrast with the backdrop; try a lighter or darker ink or backdrop.',
};
// THE PRESET LEVEL'S ACTIONS (above the presets): what they did, when it needs saying
export const PRESET_ACTS = {
  frozen: 'Seed frozen: presets, dice and variations keep this pattern until you thaw it.',
  thawed: 'Seed thawed: presets and dice can change the pattern again.',
  frozenReading: 'The seed is frozen, so this variation switched the surface to another reading.',
  frozenStill: 'The seed is frozen and this surface has no other reading. Thaw the seed to vary it.',
  noSurface: 'No surface is on, so there is nothing to vary. Turn on Customize Surface first.',
  freezeLabel: '❄︎ Freeze This Seed',
  thawLabel: '❄︎ Seed Frozen · Thaw',
};
/** The dialog's two handles for a range (the Athanor's wire ranges). */
export const MODAL_RANGE = {
  low: 'At the low end',
  high: 'At the high end',
  reversed: 'Reversed: the setting falls as the wire rises.',
  still: 'Both ends the same: the setting won’t move.',
};
/** The fifth hue's hint, by its job ({name}: the texture's own words for it, textureGenerators.js hue5.why). */
export const HUE5_HINTS = {
  glow: 'Color of light from inside the surface: {name}. Black is none.',
  ground: 'Base color of the surface, between its light and dark marks. Mid-gray leaves it unchanged.',
  base: 'Sets {name}. White leaves it unchanged.',
};
/** Short notes the page gives as it works, and the padlocks' hints. */
export const PAGE_SAYS = {
  sizeClamped: 'Page size set to {name} px. Each side can be 256 to 4096 px.',
  poemCut: 'Most of the poem was removed.',
  undo: 'Undo',
  recorded: 'This poem is already in the Grimoire. Change it to record it again.',
  hintsShow: 'Show this section’s hints under its controls',
  hintsHide: 'Hide the hints',
  lock: 'Lock: dice and presets won’t change this.',
  locked: 'Locked: dice and presets won’t change this. Click to unlock.',
};
export const CHOOSER = {
  search: 'Search by name, group or mood…',
  close: 'Close',
  open: 'Opens a menu of tiles',
  none: 'No match. Try a group (Weather), a mood (rose, frost) or a material (glass).',
  surfaceTitle: 'Surface Variant',
  athanorNamed: 'The Athanor: {name}',
  athanorEmpty: 'The Athanor (empty)',
};

/** The dice (a die beside each section's lock) and their menu: a long press on a phone, ▾ on a desk.
 *  The way last chosen is remembered, and every die and Summon button rolls that way. {name} is the way. */
export const DIE = {
  title: 'Randomize this section {name}; locked settings stay. Ctrl-click a control’s name to roll just that one.',
  titleSurface: 'Randomize this section {name}; locked settings stay. Shift-click for a new pattern only.',
  titlePhone: 'Randomize this section {name}; locked settings stay. Hold to choose how.',
  summonTitle: 'Randomize {name}; locked settings stay. Use a die’s ▾ (or hold a die) for gentler or wilder rolls.',
  // each Summon button says what it rolls ({name}: gently, as usual or wildly)
  summon: {
    randomFontBtn: 'Pick a random typeface, {name}. Locked settings stay. A die’s ▾ (or holding a die) sets how wild.',
    randomBgBtn: 'Pick random backdrop colors and gradient, {name}. Locked settings stay. A die’s ▾ (or holding a die) sets how wild.',
    randomSurfaceBtn: 'Pick a random surface and its settings, {name}. Locked settings stay. A die’s ▾ (or holding a die) sets how wild.',
  },
  more: 'How to roll: gently, as usual or wildly, or undo the last roll',
  menuTitle: 'Roll this section',
  now: 'every die rolls this way now',
  gentle: 'Gently',
  gentleWord: 'gently',
  gentleHint: 'Small nudges to sliders, colors and light; the same surface; perhaps a similar typeface',
  usual: 'As usual',
  usualWord: 'as usual',
  usualHint: 'Sliders within their middle range, any menu choice, new colors of similar lightness',
  wild: 'Wildly',
  wildWord: 'wildly',
  wildHint: 'Anything goes: full slider ranges, any menu choice, any color, the light anywhere',
  back: 'Back',
  backHint: 'Undo this section’s last roll',
  backNone: 'No roll to undo yet',
  seed: 'Only a new seed',
  seedHint: 'The same surface with a new pattern',
  locked: 'Locked: the light stays where it is',
  oneLocked: 'Locked: it stays as it is',
};

/** Surfaces made in the Athanor and kept on this browser's shelf: their menus (the Athanor's Kept,
 *  and a long press on one of Your Surfaces in the surface menu). {name} is the surface's name. */
export const KEPT = {
  keep: 'Keep',
  keepAsk: 'Keep this surface?',
  keepBody: 'Saved to this browser’s shelf and listed in the surface menu. The name also renames the graph’s Surface part.',
  replaceAsk: 'Replace the kept \u201C{name}\u201D?',
  replaceBody: 'A kept surface already has that name. Replacing it overwrites the kept copy.',
  replaceWith: 'Replace it with the graph on the grid',
  replaceWithAsk: 'Replace \u201C{name}\u201D with the graph on the grid?',
  replaceWithBody: 'The kept surface becomes the graph on the grid. Its old wiring is deleted from this browser.',
  replace: 'Replace',
  use: 'Use it as the surface',
  open: 'Open it in the Athanor',
  copy: 'Copy the wiring',
  copyHint: 'as text, to paste anywhere or into another Athanor',
  share: 'Share the wiring…',
  copied: 'The wiring of \u201C{name}\u201D is copied.',
  copyFailed: 'This browser blocked copying. Select the wiring shown here and copy it yourself.',
  drop: 'Take it off the shelf',
  paste: 'Paste a surface’s wiring…',
  pasteAsk: 'Paste a surface’s wiring',
  pasteBody: 'Paste text made by Copy the wiring, or a shelf file’s text. It goes on your shelf.',
  pasteNone: 'That isn’t a surface’s wiring. Nothing was changed.',
  current: 'The surface on the page',
};

/** The Athanor's bar (Ruby: "Start… Kept, Keep, Use: Use feels redundant"): Open (every graph there is to begin
 *  from), Keep, undo, ⋯ (everything else), whether the page shows this graph, and Done. */
export const FORGE_BAR = {
  // the Surface card's 🜉 Open in the Athanor (ROADMAP H1: Reveal Spell Graph)
  revealNone: 'This surface isn’t a graph yet, so it can’t open in the Athanor.',
  revealAskTitle: 'Open {name} in the Athanor?',
  revealAskBody: 'The Athanor’s current graph isn’t kept and will be replaced. Revert (in the ⋯ menu) brings it back until you close the Athanor; Keep it first to save it.',
  revealAskYes: 'Open (Reveal it)',
  openTitle: 'Open a graph',
  openNow: 'Open · {name}',
  yours: 'Your surfaces',
  starters: 'Starters to take apart',
  basics: 'Basics',
  studies: 'Surface Studies',
  more: 'The Athanor',
  onPage: '✓ Applied',
  onPageHint: 'The page shows this graph; changes here appear there',
  toPage: '⇱ Apply',
  toPageHint: 'Make this graph the page’s surface; later changes here show on the page too. Keep saves it by name.',
  toPageItem: 'Apply it to the page',
  shelf: 'Your shelf…',
  shelfHint: 'open, replace, copy, share or remove kept surfaces; save or load them as a file',
  revert: 'Revert',
  revertHint: 'undo every change since the Athanor opened',
  clear: 'Clear the grid',
  clearHint: 'remove every part except the Surface',
  tidy: 'Tidy into columns',
  tidyHint: 'line parts up in columns, left to right; pinned parts stay',
  spread: 'Spread out',
  spreadHint: 'like Tidy, with wider gaps so each wire is easy to follow',
  snapOn: 'Snap parts to the grid',
  snapOff: 'Stop snapping to the grid',
  snapHint: 'moved parts settle on grid lines, so columns line up',
  help: 'Wiki and help',
  helpHint: 'how the Athanor works, and a page for every part',
  // Done, after the graph changed while the page shows something else
  applyAskTitle: 'Put this graph on the page?',
  applyAskBody: 'You changed the graph, but the page still shows its old surface. Apply makes this graph the page’s surface. Not Now keeps it in the Athanor for later.',
  applyAskYes: 'Apply to Page',
  applyAskNo: 'Not Now',
};

/** The colour picker's own button. */
export const PICKER = {
  done: 'Done',
};

/** Shown under the theme picker. */
export const THEME_NOTES = {
  rose: 'Faded rosewood. The default.',
  aether: 'The original violet and gold.',
  fathom: 'Deep blue and slate.',
  vellum: 'Light mode. A brave and lonely road — the moths will find you.',
};

/** Fills in a {name} placeholder. */
export function fill(text, name){
  return String(text).replace(/\{name\}/g, name == null ? '' : name);
}

/**
 * Replaces an element's OWN text while leaving its child elements alone.
 *
 * Several tagged elements hold other elements: tab buttons carry an icon,
 * and labels carry the lock button injected at boot. Setting textContent
 * would delete those children — and since strings are applied after the
 * locks are installed, every lock in the app would silently vanish.
 */
function setOwnText(el, value){
  const kids = el.childNodes ? Array.from(el.childNodes) : [];
  const textNode = kids.find(k => k.nodeType === 3 && k.nodeValue.trim());
  if(textNode){ textNode.nodeValue = value; return; }
  if(!kids.some(k => k.nodeType === 1)){ el.textContent = value; return; }
  // only element children: put the text before them
  const doc = el.ownerDocument || (typeof document !== 'undefined' ? document : null);
  if(doc && doc.createTextNode) el.insertBefore(doc.createTextNode(value), el.firstChild);
}

/**
 * Writes every string into the markup. Missing keys are left alone, so the
 * markup's own text is the fallback and a typo here never blanks the UI.
 */
export function applyStrings(root){
  const scope = root || (typeof document !== 'undefined' ? document : null);
  if(!scope || !scope.querySelectorAll) return 0;
  let n = 0;
  scope.querySelectorAll('[data-str]').forEach(el => {
    const key = el.getAttribute('data-str');
    const value = UI_STRINGS[key];
    if(value === undefined) return;
    setOwnText(el, value);
    n++;
  });
  // a field's placeholder and its spoken name (data-str-ph)
  scope.querySelectorAll('[data-str-ph]').forEach(el => {
    if(!el || typeof el.setAttribute !== 'function' || typeof el.getAttribute !== 'function') return;
    const value = UI_STRINGS[el.getAttribute('data-str-ph')];
    if(value === undefined) return;
    el.setAttribute('placeholder', value); el.setAttribute('aria-label', value); n++;
  });
  return n;
}
