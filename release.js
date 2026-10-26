/**
 * release.js — which release this is, by name.
 *
 * Releases are named for moons, in order of their average distance from the
 * planet's barycentre (named moons only): Jupiter's, Saturn's, Uranus's and
 * Neptune's; then for stars, cluster and member (`Pleiades–Maia`), the nearest
 * clusters first and each one's members nearest first (build.mjs CLUSTERS).
 * `node build.mjs --next` moves this file to the next name.
 *
 * Kept in a module of its own so the name shows even when the site is served
 * straight from the source files, without a build (§Build).
 */
// planet and moon (or cluster and star) joined by an en dash: a slash would be read as a PML
// directive inside a segment (<…/right>), dropping the moon's name
export const RELEASE = 'Beehive–Meleph';
// the day this release was named (`node build.mjs --next` sets it): the Grimoire's first poem is dated it
export const RELEASE_DATE = '2026-10-26';
// each surface's thumbnail stamp (build.mjs, from its fingerprints): a tile is painted again only when it changes
export const TEXTURE_STAMPS = {"ash":"-ItRfWAU","astral":"7wDpCBM_","astral_fog":"n2ouptTF","astral_stars":"pRVITqrB","athanor":"itTWDgMJ","aurora":"_kOuEHYE","aurorasky":"LR0-S8Cq","blackhole":"x0RvrQgF","bokeh":"2ULWW1AF","botline":"2asp_lco","bouquets":"w70Yaia4","brokenglass":"g7WOgTdK","brushstrokes":"oIEmVI1Z","cards":"fsiMvw7Y","caustics":"md662DRF","cells":"lxc8llRo","checker":"KkB1dIau","chladni":"zWMx2YEN","circuit":"oHi6RcKA","cityscape":"DYmnH40B","clouds":"w_l6OqVB","coldpress":"A_AS05h9","contour":"USsqBIgI","corvids":"2oBbiYxx","crackedglaze":"qXTmvqVV","crackle":"dGyJKoWz","crystal":"MxaSoMvf","cupring":"0vFkxODz","dappled":"B9tWFFtI","dewwebs":"cJgfSjJ_","ditsy":"rra12mqu","drapery":"AzdXj4En","dunes":"YJnHzsfc","embers":"IH3hkliS","feathers":"eL19wBBV","flowers":"r8ele9LK","flowfield":"ssRdiHHI","frost":"lwimNqDT","glassrain":"GPMIear0","grain":"sXiGDWE0","growth":"YdBpogoK","guilloche":"gPrm4jnw","halftone":"ZRBlxOXn","hatch":"adXBHkrA","imprints":"kpHFZlhQ","inkbleed":"AlVr1C12","inkscroll":"Iw9OwPUJ","kintsugi":"qSUAXJWp","knotwork":"wuoRQXck","landscape":"dg_Yv4n2","lichtenberg":"bFjCCF2f","lightleaks":"Uw7oYTZv","liminal":"ZJH8zCCL","linen":"ZPpVyv5L","macro":"dNpGmf8x","magicparticles":"gUGxBVgN","mathnoise":"Tro0JaUq","meadow":"lCXAHLJQ","metalleaf":"KDP6dXY1","moon":"Z6tKwfwn","moss":"wLYxRJbY","oldpaper":"9Sn4mONW","petals":"MLA7WNck","pixelspace":"1OqJMNbo","plainnoise":"67Yj0nb8","polka":"Ubp9x1Rl","rainstreaks":"HNYmyNX6","rainwater":"JicGfKKz","ringpaint":"PbPnSa9W","sigils":"oFaAKxnj","skyring":"nGsTUanw","snow":"HyhkmU8T","softgradient":"GjaVQAV9","spangle":"rqqINBCQ","stainedglass":"7Pl9S8VH","stripes":"X8DOKxcF","suminagashi":"gK_sciu_","summoning":"nPyFd2HK","tessellate":"IYsLGHhm","turing":"nXgzbOCG","underglass":"yw9UZYdJ","veins":"ldSTeU8u","water":"sBGZ48m_","watercolour":"pg8g8DCf","wax":"fI2Bmko4","webb":"ZBDkWmXn","windowlight":"phkfASHA","windsea":"3789O0E6"};
export const SWATCH_STAMP = 'v1-21GxF';
