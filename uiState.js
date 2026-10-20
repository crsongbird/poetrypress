/**
 * uiState.js — the app's working state, in one place: what it remembers that the controls themselves don't hold
 *
 * Split from appEvents.js (its wiring, the listeners, stays there, in the order it runs).
 */

/**
 * Everything the app remembers that the controls themselves don't hold.
 *   page   the look's own settings that live outside an <input>: alignment
 *          and aspect (radio groups) and the gradient stop counts
 *   ui     working flags that are not part of a look
 *   locks  which controls the person has pinned
 * One object, so undo can take a snapshot, texture layers can hold more than
 * one surface, and nothing can read a half-declared variable during boot.
 */
export const state = {
  page: { align: 'left', valign: 'center', aspect: '9:16', bgStops: 2, textStops: 2, exportW: 0, exportH: 0 },
  ui:   { tintBySystem: false, tintFollows: [true, true, true, true, true, true], palette: [], pickingField: null, zoom: 1, fullPreview: false, saving: false, previewMeasured: false, element: null, edits: 0 },
  locks: new Set(),
  // SURFACE LAYERS: which one the controls show (upper or lower), the other one's settings (a layer: the
  // upper's own keys), its locks, and its reading and hue-following; see the surface layers section
  layers: { editing: 'upper', other: null, otherLocks: [], otherUi: null },
  // undo/redo: look snapshots (see the history section)
  history: { stack: [], index: -1, restoring: false, timer: null },
};
