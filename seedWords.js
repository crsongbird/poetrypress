/**
 * seedWords.js — WORD SEEDS (after RimWorld's and Minecraft's seed phrases,
 * made exactly reversible the way proquints are).
 *
 * Every seed is still a NUMBER — saved, shared and locked as one, so no look
 * changes — but it is shown as a PHRASE, and every one of the 2³² seeds has
 * exactly one, which reads back to exactly its number. A number typed in still
 * works; any other text is hashed to a seed (one way, as games do).
 *
 * The phrases are SENTENCES OF MANY SW_SHAPES (2026-10, Ruby: "more varied, less
 * formulaic, vary the tenses, rarely end in -ing"): sixteen kinds of
 * sentence, each a sixteenth of the seeds — past, present and future,
 * questions, fragments, a toast, a place — and the last sixteenth shared by
 * six smaller ones, one of which (1 seed in 512) still ends in -ing.
 *     n → mix(n) → its top 4 bits choose the shape; the other 28 fill it
 *     "Titan mended the lantern at dusk" · "Where no heron sleeps beneath Rhea"
 *     "Who woke every lantern before Enceladus?" · "To Rhea: the hollow ember, aglow"
 *
 *   banks    256 adjectives · 256 nouns · 128 names (planets, moons, stars,
 *            old gods, the Runology Archetypes) · 128 verbs that take an
 *            object and 128 that don't (each in all its forms) · 64 times ·
 *            32 codas · 16 places · determiners and openers
 *   mixing   an invertible scramble (an odd multiply, an xorshift), so
 *            neighbouring numbers get unrelated phrases
 *
 * THE BANKS' SIZES, ORDER AND THE SW_SHAPES ARE FIXED from here on: changing any
 * changes the phrase of every seed that used it (never the seed, nor its
 * texture). Ruby changed them on purpose twice: when Runology joined, and
 * when the phrases took many shapes. A word swapped stays in its slot.
 */
export const ADJ = [
  "quiet", "hollow", "silver", "gilded", "ashen", "amber", "velvet", "wandering", "sleeping", "waking", "drowned",
  "burning", "frozen", "gentle", "feral", "tender", "bitter", "sweet", "distant", "primal", "hidden", "secret",
  "open", "broken", "mended", "unfixable", "patient", "restless", "lucid", "dreaming", "fading", "rising",
  "falling", "shining", "dim", "pale", "dark", "bright", "golden", "copper", "iron", "glass", "paper", "woven",
  "folded", "torn", "stitched", "painted", "inked", "faint", "sapient", "soft", "sharp", "cosmological",
  "slow", "swift", "still", "wild", "lonely", "twin", "first", "last", "lost", "found", "new", "old", "ancient",
  "young", "ageless", "spectral", "ghostly", "hallowed", "holy", "profane", "sacred", "strange", "familiar",
  "foreign", "calcined", "cruel", "honest", "crooked", "sublime", "curved", "spiral", "saturnine", "hexed",
  "charmed", "cursed", "blessed", "feathered", "furred", "scaled", "thorned", "blooming", "wilted", "salted",
  "sweetened", "smoky", "misty", "foggy", "rainy", "snowy", "windy", "stormy", "sunlit", "moonlit", "starlit",
  "dusky", "dawning", "midnight", "vernal", "autumnal", "wintry", "summer", "hungry", "magnetic", "empowered",
  "weary", "tireless", "brave", "shy", "bold", "humble", "proud", "gracious", "graceful", "precise", "nimble",
  "occult", "vast", "hermetic", "endless", "short", "long", "deep", "shallow", "quicksilver", "distilled",
  "red", "green", "blue", "yellow", "violet", "indigo", "azure", "cobalt", "teal", "jade", "emerald", "verdant",
  "mossy", "rosy", "crimson", "scarlet", "vermilion", "ruby", "garnet", "coral", "peach", "ivory", "pearl",
  "opal", "onyx", "obsidian", "ebon", "sable", "umber", "ochre", "sepia", "russet", "tawny", "bronze", "brass",
  "pewter", "leaden", "mercurial", "sulfurous", "saline", "vitreous", "crystal", "liquid", "molten", "vapor",
  "hazy", "clouded", "clear", "cloudless", "veiled", "bare", "robed", "crowned", "black", "masked", "silent",
  "humming", "singing", "whispering", "howling", "purring", "weeping", "laughing", "smiling", "grieving",
  "hopeful", "wistful", "mournful", "joyful", "gleeful", "fierce", "calm", "serene", "placid", "turbulent",
  "chaotic", "orderly", "whimsical", "mythic", "fabled", "storied", "nameless", "purple", "pink", "brown",
  "unbound", "bound", "tethered", "untethered", "orbiting", "lunar", "solar", "stellar", "astral", "cosmic",
  "planetary", "nebular", "radiant", "luminous", "glowing", "gleaming", "glinting", "shimmering", "flickering",
  "white", "kindled", "smoldering", "cinder", "candlelit", "twilit", "gloaming", "eclipsed", "waxing", "waning",
  "gibbous", "crescent", "full",
];
export const NOUN = [
  "lantern", "tide", "ember", "moon", "star", "seed", "glyph", "vellum", "ink", "quill", "page", "poem",
  "verse", "stanza", "rhyme", "spell", "rune", "sigil", "charm", "hex", "ward", "circle", "spiral", "orbit",
  "comet", "meteor", "nebula", "galaxy", "void", "abyss", "well", "pool", "mirror", "window", "door", "threshold",
  "gate", "key", "lock", "chain", "thread", "needle", "loom", "spindle", "shuttle", "weave", "knot", "braid",
  "ribbon", "veil", "shroud", "cloak", "hood", "crown", "ring", "halo", "aura", "lotus", "petal", "thorn",
  "rose", "lily", "iris", "violet", "fern", "moss", "lichen", "root", "branch", "leaf", "bough", "blossom",
  "bud", "bolt", "acorn", "pine", "cedar", "willow", "birch", "oak", "ash", "rowan", "hazel", "yew", "elder",
  "river", "stream", "lance", "arrow", "lake", "sea", "ocean", "wave", "current", "eddy", "whirlpool", "fountain",
  "spring", "rain", "storm", "thunder", "lightning", "cloud", "mist", "fog", "frost", "snow", "hail", "ice",
  "glacier", "mountain", "hill", "valley", "canyon", "cave", "grotto", "hollow", "meadow", "field", "garden",
  "orchard", "grove", "forest", "wood", "beam", "blast", "wall", "tower", "spire", "volley", "bell", "chime",
  "song", "hymn", "chant", "whisper", "echo", "silence", "shadow", "shade", "light", "flame", "fire", "smoke",
  "cinder", "coal", "candle", "wick", "torch", "beacon", "lighthouse", "harbor", "shore", "island", "reef",
  "shell", "pearl", "coral", "salt", "sulfur", "mercury", "gold", "silver", "copper", "iron", "glass", "prism",
  "crystal", "geode", "quartz", "amethyst", "opal", "garnet", "jade", "amber", "obsidian", "onyx", "marble",
  "stone", "pebble", "sand", "dune", "desert", "oasis", "compass", "map", "atlas", "chart", "clock", "dawn",
  "dusk", "noon", "midnight", "eclipse", "equinox", "solstice", "season", "winter", "summer", "autumn", "harvest",
  "feast", "fox", "kitsune", "familiar", "witch", "raven", "crow", "owl", "moth", "butterfly", "accent",
  "spider", "bee", "wren", "robin", "sparrow", "heron", "crane", "swan", "dove", "hare", "stag", "wolf",
  "serpent", "dragon", "wyrm", "phoenix", "koi", "archetype", "phase", "shimmer", "verdigris", "seal", "lodestone",
  "cat", "chroma", "caduceus", "tincture", "feather", "wing", "claw", "tail", "runist", "scale", "fang",
  "heart", "athanor", "eye", "crucible", "breath", "bone", "blood", "retort", "alembic", "voice",
];
export const NAME = [
  "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Ceres", "Eris",
  "Pallas", "Juno", "Sedna", "Io", "Europa", "Ganymede", "Callisto", "Fire", "Wind", "Mimas", "Enceladus",
  "Tethys", "Dione", "Rhea", "Titan", "Hyperion", "Iapetus", "Phoebe", "Janus", "Chiron", "Pandora", "Prometheus",
  "Atlas", "Pan", "Water", "Amber", "Calypso", "Miranda", "Ariel", "Umbriel", "Titania", "Oberon", "Puck",
  "Triton", "Vesta", "Proteus", "Vitrum", "Galatea", "Sound", "Charon", "Nix", "Hydra", "Radio", "Styx",
  "Phobos", "Deimos", "Luna", "Sirius", "Vega", "Rigel", "Betelgeuse", "Altair", "Deneb", "Arcturus", "Capella",
  "Aldebaran", "Spica", "Antares", "Polaris", "Canopus", "Procyon", "Contract", "Time", "Regulus", "Castor",
  "Pollux", "Mira", "Quintessence", "Destruction", "Astral", "Planar", "Creation", "Hygiea", "Maia", "Merope",
  "Taygeta", "Alcyone", "Proserpina", "Astraea", "Andromeda", "Cassiopeia", "Orion", "Lyra", "Cygnus", "Draco",
  "Order", "Dyna", "Aether", "Chaos", "Materia", "Death", "Life", "Aquila", "Pegasus", "Perseus", "Sovereign",
  "Gemini", "Hesperus", "Eos", "Selene", "Nyx", "Hecate", "Thoth", "Isis", "Osiris", "Brigid", "Morrigan",
  "Freya", "Ophiuchus", "Odin", "Loki", "Ishtar", "Inanna", "Astarte", "Lilith", "Ostara", "Yule",
];
// verbs: 'base' or 'base|past|participle' for the irregular ones; the other forms are made below
export const VT = [
  "kindle", "mend", "wake|woke|woken", "break|broke|broken", "fold", "open", "close", "gild", "glaze", "weave|wove|woven",
  "spin|spun|spun", "braid", "bind|bound|bound", "loosen", "untie", "knot", "cast|cast|cast", "conjure",
  "summon", "banish", "charm", "hex", "ward", "bless", "measure", "map", "chart", "write|wrote|written",
  "ink", "read|read|read", "sketch", "paint", "shatter", "scatter", "gather", "harvest", "sow|sowed|sown",
  "keep|kept|kept", "guard", "seek|sought|sought", "find|found|found", "lose|lost|lost", "name", "call",
  "answer", "remember", "forget|forgot|forgotten", "hold|held|held", "release", "unlock", "carry", "bury",
  "unearth", "plant", "feed|fed|fed", "heal", "light|lit|lit", "douse", "quench", "steal|stole|stolen", "borrow",
  "mark", "seal", "sign", "stitch", "sew|sewed|sewn", "darn", "polish", "sharpen", "temper", "forge", "smelt",
  "distill", "dissolve", "purify", "brew", "steep", "pour", "spill", "crown", "veil", "unveil", "mask", "hide|hid|hidden",
  "reveal", "mirror", "follow", "lead|led|led", "cross", "climb", "haunt", "rouse", "lull", "hush", "tend",
  "draw|drew|drawn", "tear|tore|torn", "shake|shook|shaken", "take|took|taken", "give|gave|given", "bring|brought|brought",
  "teach|taught|taught", "catch|caught|caught", "sweep|swept|swept", "strike|struck|struck", "throw|threw|thrown",
  "bear|bore|borne", "choose|chose|chosen", "dig|dug|dug", "spread|spread|spread", "send|sent|sent", "build|built|built",
  "ring|rang|rung", "sing|sang|sung", "wind|wound|wound", "kiss", "cradle", "enchant", "transmute", "calcine",
  "anoint", "invoke", "scry", "divine", "ferry", "lure", "tame", "unravel",
];
export const VI = [
  "drift", "fall|fell|fallen", "rise|rose|risen", "burn", "dream", "sleep|slept|slept", "wake|woke|woken",
  "sing|sang|sung", "hum", "whisper", "weep|wept|wept", "laugh", "dance", "spin|spun|spun", "glow", "gleam",
  "flicker", "smolder", "melt", "freeze|froze|frozen", "flow", "pool", "ripple", "wander", "roam", "fly|flew|flown",
  "soar", "dive", "float", "sink|sank|sunk", "drown", "breathe", "echo", "orbit", "circle", "spiral", "tumble",
  "roll", "climb", "linger", "rest", "shimmer", "return", "depart", "arrive", "stay", "wane", "wax", "bloom",
  "wilt", "fade", "grow|grew|grown", "heal", "crack", "settle", "kneel|knelt|knelt", "pray", "listen", "wait",
  "watch", "blaze", "flare", "gutter", "wither", "unfold", "open", "close", "turn", "shiver", "tremble",
  "quiver", "sway", "bow", "sigh", "murmur", "rustle", "creak", "toll", "chime", "ring|rang|rung", "glimmer",
  "glisten", "glitter", "sparkle", "bleed|bled|bled", "rust", "crumble", "thaw", "steam", "simmer", "bubble",
  "surge", "ebb", "flood", "thunder", "shine|shone|shone", "vanish", "appear", "stir", "awaken", "slumber",
  "stray", "falter", "stumble", "mourn", "grieve", "rejoice", "speak|spoke|spoken", "dwell|dwelt|dwelt",
  "hunger", "ache", "hover", "glide", "perch", "nest", "roost", "prowl", "hunt", "molt", "hatch", "travel",
  "wade", "shudder", "quake", "billow", "drip", "trickle", "seep",
];
export const WHEN = [
  "at dusk", "at dawn", "at noon", "at midnight", "at first light", "at moonrise", "at low tide", "at the equinox",
  "at the solstice", "at the threshold", "before dawn", "before the rain", "before the frost", "before the harvest",
  "after the rain", "after the storm", "after midnight", "after the eclipse", "in winter", "in springtime", "in autumn",
  "in summer", "in the rain", "in the dark", "in the fog", "in the twilight", "in the long night", "in the deep",
  "in a dream", "under a new moon", "under a full moon", "under the stars", "under the snow", "by candlelight",
  "by moonlight", "by lamplight", "by starlight", "by firelight", "by the sea", "by the river", "on the tide",
  "on the wind", "on the last day", "on the first night", "on the shore", "until dawn", "until daybreak",
  "once again", "for a thousand years", "for a while", "for the last time", "for the first time", "through the night",
  "through the snow", "through the mist", "beneath the ice", "beyond the veil", "between the stars", "while the city sleeps",
  "while it rains", "as the bells toll", "as the tide turns", "when the moon is full", "when no one watched",
];
export const TAG = [
  "at last", "again", "anew", "aglow", "aflame", "afloat", "adrift", "awake", "asleep", "alone", "apart",
  "aloud", "astray", "ajar", "unbroken", "undone", "untold", "unseen", "unnamed", "forever", "for now", "in secret",
  "by heart", "in time", "in silence", "in pieces", "in bloom", "in flight", "in full", "in vain", "once",
  "unasked",
];
export const PREP = [
  "over", "under", "beneath", "beyond", "within", "across", "toward", "against", "behind", "before", "after",
  "around", "through", "above", "below", "beside",
];
export const DET = ['the', 'a', 'every', 'no'];
export const OPENER = ['yet', 'and', 'still', 'so'];
export const ART = ['the', 'a'];

// ---- verb forms ----
// doubled before -ed/-ing (a short vowel and one consonant, stressed)
const SW_DOUBLE = new Set(['hum', 'map', 'drip', 'nod', 'rot', 'plan', 'stop', 'spin', 'dig', 'swim', 'stir', 'sob', 'chat', 'trim', 'dip', 'grab', 'hug', 'step', 'tap', 'wrap', 'knot']);
const SW_NOT_DOUBLE = new Set();
function swForms(entry){
  const [base, past0, part0] = entry.split('|');
  const dbl = SW_DOUBLE.has(base) && !SW_NOT_DOUBLE.has(base);
  const cy = /[^aeiou]y$/.test(base);
  const ed = dbl ? base + base.slice(-1) + 'ed' : base.endsWith('e') ? base + 'd' : cy ? base.slice(0, -1) + 'ied' : base + 'ed';
  const third = /(s|sh|ch|x|z|o)$/.test(base) ? base + 'es' : cy ? base.slice(0, -1) + 'ies' : base + 's';
  const ing = base.endsWith('ie') ? base.slice(0, -2) + 'ying' : dbl ? base + base.slice(-1) + 'ing'
    : (base.endsWith('e') && !/(ee|ye|oe)$/.test(base)) ? base.slice(0, -1) + 'ing' : base + 'ing';
  return { base, past: past0 || ed, part: part0 || past0 || ed, third, ing };
}
const SW_VT_F = VT.map(swForms), SW_VI_F = VI.map(swForms);

// ---- the shapes ----
// slots: N noun · A adjective · M name · T/I a transitive/intransitive verb in a form
// (.base .past .part .third .ing) · W time · G coda · P place · D determiner ·
// O opener · R article (the/a) — and plain words. Bits: N,A 8 · M,T,I 7 · W 6 · G 5 · P 4 · D,O 2 · R 1.
const SW_BANK = { N: NOUN, A: ADJ, M: NAME, T: SW_VT_F, I: SW_VI_F, W: WHEN, G: TAG, P: PREP, D: DET, O: OPENER, R: ART };
const SW_SHAPES = [
  ['M', 'T.past', 'the', 'N', 'W'],                          // Titan mended the lantern at dusk
  ['to', 'T.base', 'the', 'N', 'of', 'M', 'W'],             // To mend the lantern of Titan before dawn
  ['where', 'D', 'N', 'I.third', 'P', 'M'],                 // Where no heron sleeps beneath Titan
  ['the', 'A', 'N', 'I.past', 'G'],                          // The hollow lantern burned at last
  ['M', "'s", 'N', ',', 'T.part', 'W'],                      // Titan's lantern, mended at dusk
  ['M', 'will', 'T.base', 'the', 'N', 'W'],                  // Titan will mend the lantern at dusk
  ['the', 'A', 'N', 'of', 'M', ',', 'G'],                    // The hollow lantern of Titan, aglow
  ['N', 'and', 'N', ',', 'T.part', 'G'],                     // Lantern and heron, mended at last
  ['O', 'the', 'N', 'I.past', 'P', 'M'],                     // Yet the lantern burned beyond Titan
  ['who', 'T.past', 'D', 'N', 'P', 'M', '?'],                // Who woke every heron beneath Titan?
  ['M', ',', 'A', 'and', 'T.part', 'W'],                     // Titan, hollow and mended at dusk
  ['A', 'M', 'I.third', 'W'],                                // Gilded Titan dreams before dawn
  ['D', 'N', 'that', 'I.past', 'P', 'M'],                    // Every heron that slept beneath Titan
  ['for', 'M', ':', 'the', 'A', 'N', ',', 'G'],              // For Titan: the hollow lantern, aglow
  ['how', 'the', 'N', 'of', 'M', 'I.third', 'W'],            // How the lantern of Titan sleeps at dusk
  null,                                                      // the last sixteenth: six smaller shapes
];
const SW_SMALL = [                                              // 27 + 26 + 25 + 24 + 23 + 23 bits = 2²⁸
  ['the', 'N', 'of', 'M', ',', 'T.part', 'G'],               // The lantern of Titan, mended at last
  ['D', 'N', 'P', 'M', ',', 'G'],                            // A lantern beneath Titan, aglow
  ['M', 'and', 'D', 'A', 'N'],                               // Titan and every hollow lantern
  ['D', 'A', 'N', 'W'],                                      // A hollow lantern at dusk
  ['A', 'N', ',', 'I.ing'],                                  // Hollow lantern, turning   (the one -ing ending: 1 seed in 512)
  ['M', 'T.past', 'R', 'N'],                                 // Titan woke the lantern
];
const swSlotOf = t => { const m = /^([NAMTIWGPDOR])(?:\.(\w+))?$/.exec(t); return m ? { b: m[1], f: m[2] } : null; };
const swSizeOf = sh => sh.reduce((n, t) => { const s = swSlotOf(t); return s ? n*SW_BANK[s.b].length : n; }, 1);
for(const sh of SW_SHAPES) if(sh && swSizeOf(sh) !== 2**28) throw new Error('seedWords: a shape is not 28 bits');
if(SW_SMALL.reduce((n, sh) => n + swSizeOf(sh), 0) !== 2**28) throw new Error('seedWords: the small shapes do not fill a sixteenth');

const MUL = 0x9E3779B1;
// the multiply's inverse mod 2^32 (Newton's iteration; MUL is odd)
const INV = (() => { let x = MUL; for(let i = 0; i < 5; i++) x = Math.imul(x, 2 - Math.imul(MUL, x)); return x >>> 0; })();
const mix   = n => { let x = Math.imul(n >>> 0, MUL) >>> 0; x = (x ^ (x >>> 16)) >>> 0; return x; };
const unmix = x => { x = (x ^ (x >>> 16)) >>> 0; return Math.imul(x, INV) >>> 0; };

/** Which shape and which words a mixed number is: [shape, [index per slot]]. */
function swDecode(x){
  let k = x >>> 28, r = x & 0x0FFFFFFF, shape = SW_SHAPES[k];
  if(!shape){ for(const sh of SW_SMALL){ const z = swSizeOf(sh); if(r < z){ shape = sh; break; } r -= z; } }
  const idx = [];
  for(const t of shape){ const s = swSlotOf(t); if(!s) continue; const n = SW_BANK[s.b].length; idx.push(r % n); r = Math.floor(r / n); }
  return [shape, idx];
}
function swEncode(shape, idx){
  let r = 0, mul = 1, i = 0;
  for(const t of shape){ const s = swSlotOf(t); if(!s) continue; r += idx[i++]*mul; mul *= SW_BANK[s.b].length; }
  const k = SW_SHAPES.indexOf(shape);
  if(k >= 0) return ((k << 28) >>> 0) + r;
  let off = 0; for(const sh of SW_SMALL){ if(sh === shape) break; off += swSizeOf(sh); }
  return ((15 << 28) >>> 0) + off + r;
}
function swRender(shape, idx){
  let i = 0;
  const words = shape.map(t => { const s = swSlotOf(t); if(!s) return t; const v = SW_BANK[s.b][idx[i++]]; return s.f ? v[s.f] : v; });
  let out = words.join(' ').replace(/ ([,:?])/g, '$1').replace(/ 's\b/g, "'s");
  out = out.replace(/\b([Aa]) (?=[aeiouAEIOU])/g, '$1n ');            // a → an
  return out.charAt(0).toUpperCase() + out.slice(1);
}
/** The phrase for a seed (any integer; it is taken as 32 bits, as the textures take it). */
export function seedPhrase(n){ const [sh, idx] = swDecode(mix(Math.trunc(+n || 0))); return swRender(sh, idx); }

// ---- reading a phrase back ----
const swNorm = t => String(t || '').toLowerCase().replace(/[’`]/g, "'").replace(/'s\b/g, " 's").replace(/[.!?;:,—–]+/g, ' ').replace(/\s+/g, ' ').trim()
  .replace(/\ban\b/g, 'a');
// each bank as token sequences → index (a time or a coda may be several words)
const SW_LOOKUP = {};
for(const [b, list] of Object.entries(SW_BANK)){
  SW_LOOKUP[b] = {};
  list.forEach((v, i) => { for(const f of (typeof v === 'string' ? [null] : ['base', 'past', 'part', 'third', 'ing'])){
    const w = swNorm(f ? v[f] : v); ((SW_LOOKUP[b][f || ''] ||= new Map()).has(w)) || SW_LOOKUP[b][f || ''].set(w, i); } });
}
function swMatchShape(shape, toks){
  const parts = shape.filter(t => !/^[,:?]$/.test(t));
  const out = [];
  const go = (pi, ti, idx) => {
    if(pi === parts.length){ if(ti === toks.length) out.push(idx.slice()); return; }
    const t = parts[pi], s = swSlotOf(t);
    if(!s){ if(toks[ti] === swNorm(t)) go(pi + 1, ti + 1, idx); return; }
    const map = SW_LOOKUP[s.b][s.f || ''];
    for(let len = 1; len <= 7 && ti + len <= toks.length; len++){
      const w = toks.slice(ti, ti + len).join(' '), i = map.get(w);
      if(i !== undefined){ idx.push(i); go(pi + 1, ti + len, idx); idx.pop(); }
    }
  };
  go(0, 0, []);
  return out;
}
/** The seed a phrase stands for, or null if it isn't one of ours. */
export function phraseSeed(text){
  const t = swNorm(text); if(!t) return null;
  const toks = t.split(' ');
  for(const shape of [...SW_SHAPES.filter(Boolean), ...SW_SMALL]){
    for(const idx of swMatchShape(shape, toks)){
      const n = unmix(swEncode(shape, idx) >>> 0);
      if(swNorm(seedPhrase(n)) === t) return n;                       // only an exact reading counts
    }
  }
  return null;
}
/** What the seed field takes: a number, a phrase, or any words at all (hashed). */
export function seedFromText(text){
  const t = String(text == null ? '' : text).trim();
  if(/^-?\d+$/.test(t)) return parseInt(t, 10);
  const p = phraseSeed(t); if(p != null) return p;
  // anything else: FNV-1a, as a game hashes a typed seed (one way)
  let h = 0x811C9DC5; for(const ch of t.toLowerCase()){ h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h & 0x7FFFFFFF;
}
