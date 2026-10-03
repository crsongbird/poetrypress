/**
 * release.js — which release this is, by name.
 *
 * Releases are named for moons, in order of their average distance from the
 * planet's barycentre (named moons only). The Jupiter series runs until the
 * app changes substantially enough for a final release; then Saturn.
 * `node build.mjs --next` moves this file to the next moon.
 *
 * Kept in a module of its own so the name shows even when the site is served
 * straight from the source files, without a build (§Build).
 */
// planet and moon joined by an en dash: a slash would be read as a PML
// directive inside a segment (<…/right>), dropping the moon's name
export const RELEASE = 'Jupiter–Callisto';
