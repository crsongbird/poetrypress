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
  'card.known_rituals':                    "Known Rituals",
  'card.script_options':                   "Script Options",
  'card.typeface_effects':                 "Typeface Effects",
  'card.backdrop_color':                   "Backdrop Color",
  'card.surface_texture':                  "Surface Texture",
  'card.border_options':                   "Border Options",
  'card.vignette_options':                 "Vignette Options",
  'card.appearance':                       "Appearance",
  'card.spellcrafting':                    "Spellcrafting",
  'card.grimoire':                         "Grimoire",
  'card.workbench':                        "Workbench",

  // ---- hint ----
  'hint.standard':                         "Standard",
  'hint.landscape':                        "Landscape",
  'hint.create_saves_the_current_look_as_a': "Create saves the current look as a spell you can bring back later.",
  'hint.the_grimoire_is_empty_record_a_poe': "The Grimoire is empty. Record a poem to keep it.",

  // ---- button ----
  'button.randomFontBtn':                  "⟳ Summon New Typeface",
  'button.randomBgBtn':                    "⟳ Summon New Backdrop",
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
  'label.radial_gradient_text':                "Radial Gradient Text?",
  'label.aura_stops':                          "Aura Stops",
  'label.inscription_hue_2':                    "Inscription Hue 2",
  'label.inscription_hue_3':                    "Inscription Hue 3",
  'label.inscription_hue_4':                    "Inscription Hue 4",
  'label.radial_gradient_angle':               "Radial Gradient Angle",
  'label.opposition_hue':                      "Opposition Hue",
  'label.conjunction_hue':                     "Conjunction Hue",
  'label.mode':                                "Mode",
  'label.color':                               "Color",
  'label.thickness_px':                        "Thickness (px)",
  'label.blur':                                "Blur",
  'label.x_offset':                            "X Offset",
  'label.y_offset':                            "Y Offset",
  'label.background_hue':                      "Background Hue",
  'label.radial_aura':                         "Radial Aura?",
  'label.aura_stops2':                         "Aura Stops",
  'label.aura_stop_2':                         "Aura Stop 2",
  'label.aura_stop_3':                         "Aura Stop 3",
  'label.aura_stop_4':                         "Aura Stop 4",
  'label.arc_angle':                           "Arc Angle",
  'label.customize_surface':                   "Customize Surface",
  'label.surface_variant':                     "Surface Variant",
  'label.x':                                   "—",
  'label.x2':                                  "—",
  'label.opacity':                             "Opacity",
  'label.blend_mode':                          "Blend Mode",
  'label.light_direction':                     "Light Direction",
  'label.tint':                                "Tint",
  'label.second_tint':                         "Second Tint",
  'label.texture_seed':                        "Texture Seed",
  'label.enable_border':                       "Enable Border",
  'label.border_hue':                          "Border Hue",
  'label.radial_gradient_border':              "Radial Gradient Border?",
  'label.border_hue_2':                        "Border Hue 2",
  'label.border_hue_3':                        "Border Hue 3",
  'label.bloom':                               "Bloom",
  'label.thickness_px2':                       "Thickness (px)",
  'label.offset_px':                           "Offset (px)",
  'label.enable_vignette':                     "Enable Vignette",
  'label.blend_mode2':                         "Blend Mode",
  'label.intensity':                           "Intensity",
  'label.aperture':                            "Aperture",
  'label.centre_x':                            "Center X",
  'label.centre_y':                            "Center Y",
  'label.grit':                                "Grit",
  'label.theme':                               "Theme",

  // ---- options ----
  'option.landscape':                         "Painted Landscape",
  'option.cityscape':                         "Night City",
  'option.blackhole':                         "Black Hole",
  'option.scrying_pool':                      "Scrying Pool",
  'option.fractal_moon':                      "Fractal Moon",
  'label.typeface_effect':                    "Typeface Effect",
  'label.effect_strength':                    "Effect Strength",
  'label.effect_hue':                         "Effect Hue",
  'label.effect_angle':                       "Effect Angle",
  'label.effect_distance':                    "Effect Distance",
  'label.effect_grain':                       "Effect Grain",
  'option.fx_none':                           "None",
  'option.fx_letterpress':                    "Letterpress",
  'option.fx_longshadow':                     "Long Shadow",
  'option.fx_doublestrike':                   "Double Strike",
  'option.fx_chromatic':                      "Chromatic Split",
  'option.fx_halo':                           "Halo",
  'option.fx_bevel':                          "Bevel",
  'option.fx_erosion':                        "Erosion",
  'option.fx_doubleline':                     "Double Underline",
  'option.fx_wavyline':                       "Wavy Underline",
  'option.fx_dottedline':                     "Dotted Underline",
  'option.fx_bloom':                          "Bloom",
  'option.bottom_left':                        "Bottom Left",
  'option.bottom_right':                       "Bottom Right",
  'option.top_left':                           "Top Left",
  'option.top_right':                          "Top Right",
  'option.off':                                "Off",
  'option.outline':                            "Outline",
  'option.shadow':                             "Shadow",
  'option.sleep_haze':                         "Sleep Haze",
  'option.dream_bloom':                        "Dream Bloom",
  'option.deep_field':                         "Deep Field",
  'option.euphoria_dust':                      "Pixie Dust",
  'option.burning_mana':                       "Sparkler",
  'option.first_snow':                         "First Snow",
  'option.aurora_veil':                        "Aurora Veil",
  'option.waking_grain':                       "Waking Grain",
  'option.metal_leaf':                         "Metal Leaf",
  'option.lotus_pond':                         "Lotus Pond",
  'option.painter_s_frustration':              "Painter's Frustration",
  'option.90s_dots':                           "Retro Dots",
  'option.still_rain':                         "Harsh Rain",
  'option.silverpoint_hatch':                  "Silverpoint Hatch",
  'option.sigil_scatter':                      "Sigil Scatter",
  'option.enochian_noise':                     "Enochian Noise",
  'option.summoning_circles':                  "Transmutation Circles",
  'option.rorschach_test':                     "Rorschach Test",
  'option.fractured_glaze':                    "Fractured Glaze",
  'option.facet_field':                        "Facet Field",
  'option.cartomancy':                         "Cartomancy",
  'option.linen_tooth':                        "Linen Tooth",
  'option.cold_press':                         "Cold Press",
  'option.foxing':                             "Foxing",
  'option.fold_ghost':                         "Fold Ghost",
  'option.cup_ring':                           "Cup Ring",
  'option.poured_wax':                         "Poured Wax",
  'option.raked_substrate':                    "Zen Garden",
  'option.overlay':                            "Overlay",
  'option.color_burn':                         "Color Burn",
  'option.color_dodge':                        "Color Dodge",
  'option.lighten':                            "Lighten",
  'option.rose':                               "Rosé",
  'option.aether':                             "Aether",
  'option.fathom':                             "Fathom",
  'option.vellum':                             "Vellum",
};

/**
 * Prompts and confirmations. `{name}` is replaced with whatever the dialog
 * is about — a spell's name, a poem's title.
 */
export const DIALOGS = {
  shareSpell: {
    title: 'Share \u201C{name}\u201D',
    bodyCopied: 'The link is copied. Anyone who opens it can add this spell to their own Esoterica — only this one, not your whole list.',
    bodyManual: 'Copy this link. Anyone who opens it can add this spell to their own Esoterica — only this one, not your whole list.',
    confirm: 'Done',
  },
  receiveSpell: {
    title: 'A spell for you: \u201C{name}\u201D',
    body: 'Someone shared this look. Add it to your Esoterica? Your own spells are untouched either way.',
    confirm: 'Add Spell',
  },
  shareBroken: {
    title: 'That spell did not survive the trip',
    body: 'The link was cut short or changed along the way, so there was nothing to add. Ask for it again.',
  },
  spellCreate: {
    title: 'Keep this look?',
    body: 'Give it a name. Only the look is saved — the poem itself belongs in the Grimoire.',
    confirm: 'Yes (Inscribe)',
    cancel: 'No (Ignore)',
  },
  spellDelete: {
    title: 'Dissolve this spell?',
    body: '“{name}” will be gone from this browser.',
    confirm: 'Yes (Remove)',
    cancel: 'No (Retain)',
  },
  poemSave: {
    title: 'Record in the Grimoire?',
    body: 'Keep “{name}” in the Grimoire?',
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
    body: 'Copy this somewhere safe. Paste it back through Import to restore.',
    confirm: 'Done',
  },
  importList: {
    title: 'Import {name}',
    body: 'Paste a previously exported list. Existing entries are kept; duplicates and malformed records are skipped.',
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
  return n;
}
