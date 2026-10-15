/**
 * release.js — which release this is, by name.
 *
 * Releases are named for moons, in order of their average distance from the
 * planet's barycentre (named moons only): Jupiter's, which ran out at Kore,
 * then Saturn's (build.mjs SATURN).
 * `node build.mjs --next` moves this file to the next moon.
 *
 * Kept in a module of its own so the name shows even when the site is served
 * straight from the source files, without a build (§Build).
 */
// planet and moon joined by an en dash: a slash would be read as a PML
// directive inside a segment (<…/right>), dropping the moon's name
export const RELEASE = 'Saturn–Daphnis';
// the day this release was named (`node build.mjs --next` sets it): the Grimoire's first poem is dated it
export const RELEASE_DATE = '2026-10-15';
