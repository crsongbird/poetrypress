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
export const RELEASE = 'Saturn–Rhea';
// the day this release was named (`node build.mjs --next` sets it): the Grimoire's first poem is dated it
export const RELEASE_DATE = '2026-10-16';
// each surface's thumbnail stamp (build.mjs, from its fingerprints): a tile is painted again only when it changes
export const TEXTURE_STAMPS = {"ash":"x1H4Euh6","astral":"7wDpCBM_","astral_fog":"n2ouptTF","astral_stars":"pRVITqrB","athanor":"itTWDgMJ","aurora":"_kOuEHYE","aurorasky":"MVgybw1m","blackhole":"_xM1jgzH","bokeh":"2ULWW1AF","brushstrokes":"eKexUgAV","cards":"7KDjgF4u","cells":"UKWll1yK","checker":"KkB1dIau","chladni":"fg4n11Wm","circuit":"T0JyuUt0","cityscape":"9zF5WxQZ","clouds":"w_l6OqVB","coldpress":"CP7Fb68B","contour":"diqF4TTe","crackedglaze":"4C-ldMio","crackle":"Q__MAGU6","crystal":"MqYKutGn","cupring":"0vFkxODz","dunes":"sihYp08z","embers":"IH3hkliS","flowers":"r8ele9LK","flowfield":"ssRdiHHI","frost":"lwimNqDT","glassrain":"npIroxL4","grain":"sXiGDWE0","growth":"0StFvT4O","guilloche":"gPrm4jnw","halftone":"ZRBlxOXn","hatch":"adXBHkrA","inkbleed":"AlVr1C12","kintsugi":"qCXId_zX","knotwork":"wuoRQXck","landscape":"r6wnhJ89","lichtenberg":"waq0_kgT","linen":"G4Q8Fhfh","magicparticles":"gUGxBVgN","mathnoise":"Tro0JaUq","metalleaf":"KDP6dXY1","moon":"Z6tKwfwn","moss":"PZ0yae4a","oldpaper":"KiTyhvQT","plainnoise":"67Yj0nb8","polka":"Ubp9x1Rl","rainstreaks":"HNYmyNX6","rainwater":"puqcxPGZ","ringworld":"2aCtAb-9","sigils":"oFaAKxnj","snow":"HyhkmU8T","softgradient":"GjaVQAV9","spangle":"53CijlRT","stainedglass":"aVKpXREs","stripes":"X8DOKxcF","suminagashi":"gK_sciu_","summoning":"UYGfse5f","tessellate":"6S_Mr36q","turing":"S_tqYKwy","veins":"prRcdxbI","water":"JzwOUOSi","watercolour":"pg8g8DCf","wax":"bCiCHM1m"};
export const SWATCH_STAMP = 'cGh5McfV';
