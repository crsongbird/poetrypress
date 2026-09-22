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
  'tab.inscripton':                        "Inscripton",
  'tab.rituals':                           "Rituals",
  'tab.thoughtforms':                      "Thoughtforms",
  'tab.materia':                           "Materia",
  'tab.esoterica':                         "Esoterica",

  // ---- card ----
  'card.incantation_editor_poetic_magick_l': "Incantation Editor (Poetic Magick Language)",
  'card.arcane_guidance_pml_syntax':       "Arcane Guidance (PML Syntax)",
  'card.form_amp_bearing':                 "Form &amp; Bearing",
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
  'button.textureSeedReroll':              "⟳ Reroll",
  'button.spellCreateBtn':                 "Create",
  'button.spellApplyBtn':                  "Invoke",
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
};

/**
 * Prompts and confirmations. `{name}` is replaced with whatever the dialog
 * is about — a spell's name, a poem's title.
 */
export const DIALOGS = {
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

/** Shown under the theme picker. */
export const THEME_NOTES = {
  cinder: 'Ash and rose. The default.',
  aether: 'The original violet and gold.',
  fathom: 'Deep water. Quiet at the edges.',
  vellum: 'Light mode. A brave and lonely road — the moths will find you.',
};

/** Fills in a {name} placeholder. */
export function fill(text, name){
  return String(text).replace(/\{name\}/g, name == null ? '' : name);
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
    // tab buttons hold an icon before their label; replace only the text
    const icon = el.querySelector && el.querySelector('.tab-ico');
    if(icon){
      el.innerHTML = '';
      el.appendChild(icon);
      el.appendChild(scope.createTextNode ? scope.createTextNode(value) : document.createTextNode(value));
    } else {
      el.textContent = value;
    }
    n++;
  });
  return n;
}
