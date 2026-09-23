/**
 * tunables.js — the numbers, in one place, meant to be edited by hand.
 *
 *   Every magic number
 *   was a decision someone
 *   made and forgot why.
 *
 * These were scattered across five files as literals. Nothing here is
 * load-bearing in a way that breaks if you nudge it — the ranges are chosen
 * so any sensible value works. Change one, reload, look.
 */

/** What the app opens with. Must match a preset's `name` exactly; an unknown
 *  name falls back to the first preset rather than failing. */
export const DEFAULTS = {
  preset: 'Lotus Bloom',
};

/** The preview pane and the divider that sizes it. */
export const PREVIEW = {
  /** Fraction of the screen the preview may occupy. Portrait: height.
   *  Landscape: width. The divider clamps to these. */
  minFraction: 0.10,
  maxFraction: 0.80,
  defaultFraction: 0.30,
  /** Pinch-zoom limits inside the preview. */
  minZoom: 1,
  maxZoom: 6,
};

/** Preset and spell snapshot tiles. */
export const SWATCH = {
  /** Painted at roughly the display box's aspect, so filling it is
   *  distortion-free. Changing these without changing the CSS height will
   *  stretch the tiles. */
  width: 208,
  height: 48,
  /** Glyph size and border weight, both as a share of swatch height. */
  glyphScale: 0.22,
  borderScale: 0.05,
  /** Seed used when a preset does not carry its own. */
  fallbackSeed: 4242,
};

/** The PML editor. */
export const EDITOR = {
  fontSize: 13,
  lineHeight: 1.62,
  /** Beyond this many characters the mirror is repainted on a timer rather
   *  than on every keystroke. */
  debounceMs: 150,
};

/** Texture generation. */
export const TEXTURES = {
  /** How many generated textures are kept before the oldest is dropped.
   *  Higher costs memory; lower costs regeneration when switching around. */
  cacheEntries: 40,
  /** The page size the absolute slider readouts are quoted against. A count
   *  of "1,124 sparkles" means 1,124 on a page this size. */
  referenceWidth: 3072,
  referenceHeight: 3072,
};

/** Border and vignette. */
export const EFFECTS = {
  /** Widening passes drawn under a bloomed border. More is smoother and
   *  slower; each pass is fainter than the last. */
  bloomPasses: 5,
  bloomSpread: 1.9,
  bloomAlpha: 0.22,
  /** One speck of vignette grit per this many pixels, at full strength. */
  gritDensity: 2600,
};

/** Watermark and the glyph spell that sits opposite it. */
export const MARKS = {
  /** Share of the average page dimension. Both use the same size. */
  scale: 0.01,
  /** Inset from the page edge, as a share of width/height. */
  insetX: 0.035,
  insetY: 0.025,
};

/** Glyph spells. */
export const SPELLS = {
  /** Allowed lengths. Must all be prime — validation checks it. */
  primes: [5, 7, 11, 13, 17],
  /** A spell is always split into this many segments. Changing it means
   *  changing the wrapper logic in spell.js too. */
  segments: 3,
};
