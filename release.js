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
export const RELEASE = 'Saturn–Beli';
// the day this release was named (`node build.mjs --next` sets it): the Grimoire's first poem is dated it
export const RELEASE_DATE = '2026-10-19';
// each surface's thumbnail stamp (build.mjs, from its fingerprints): a tile is painted again only when it changes
export const TEXTURE_STAMPS = {"ash":"-ItRfWAU","astral":"7wDpCBM_","astral_fog":"n2ouptTF","astral_stars":"pRVITqrB","athanor":"itTWDgMJ","aurora":"_kOuEHYE","aurorasky":"MVgybw1m","blackhole":"x0RvrQgF","bokeh":"2ULWW1AF","botline":"S43V6jqg","bouquets":"w70Yaia4","brokenglass":"g7WOgTdK","brushstrokes":"eKexUgAV","cards":"7KDjgF4u","caustics":"md662DRF","cells":"lxc8llRo","checker":"KkB1dIau","chladni":"zWMx2YEN","circuit":"oHi6RcKA","cityscape":"9zF5WxQZ","clouds":"w_l6OqVB","coldpress":"A_AS05h9","contour":"USsqBIgI","corvids":"2oBbiYxx","crackedglaze":"qXTmvqVV","crackle":"dGyJKoWz","crystal":"hMmdxNY4","cupring":"0vFkxODz","dappled":"B9tWFFtI","dewwebs":"cJgfSjJ_","ditsy":"rra12mqu","dunes":"YJnHzsfc","embers":"IH3hkliS","feathers":"eL19wBBV","flowers":"r8ele9LK","flowfield":"ssRdiHHI","frost":"lwimNqDT","glassrain":"GPMIear0","grain":"sXiGDWE0","growth":"YdBpogoK","guilloche":"gPrm4jnw","halftone":"ZRBlxOXn","hatch":"adXBHkrA","imprints":"0vhRfBfY","inkbleed":"AlVr1C12","kintsugi":"qSUAXJWp","knotwork":"wuoRQXck","landscape":"r6wnhJ89","lichtenberg":"bFjCCF2f","lightleaks":"Uw7oYTZv","liminal":"ZJH8zCCL","linen":"R8benyFh","macro":"EmRc7jEo","magicparticles":"gUGxBVgN","mathnoise":"Tro0JaUq","meadow":"zDlLn6P8","metalleaf":"KDP6dXY1","moon":"Z6tKwfwn","moss":"wLYxRJbY","oldpaper":"9Sn4mONW","petals":"ZRWpeH6r","pixelspace":"1OqJMNbo","plainnoise":"67Yj0nb8","polka":"Ubp9x1Rl","rainstreaks":"HNYmyNX6","rainwater":"BBNP1xWY","ringpaint":"nIPj4L7t","ringworld":"XM-ZCUnb","sigils":"oFaAKxnj","skyring":"_dJFoQV8","snow":"HyhkmU8T","softgradient":"GjaVQAV9","spangle":"rqqINBCQ","stainedglass":"7Pl9S8VH","stripes":"X8DOKxcF","suminagashi":"gK_sciu_","summoning":"UYGfse5f","tessellate":"IYsLGHhm","turing":"nXgzbOCG","underglass":"yw9UZYdJ","veins":"ldSTeU8u","water":"lDHzk--U","watercolour":"pg8g8DCf","wax":"fI2Bmko4","webb":"ZBDkWmXn","windowlight":"phkfASHA","windsea":"xgw5D-MU"};
export const SWATCH_STAMP = 'JaZ-ztYp';
