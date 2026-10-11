/**
 * seedWords.js — WORD SEEDS (after RimWorld's and Minecraft's seed phrases,
 * made exactly reversible the way proquints are).
 *
 * Every seed is still a NUMBER — saved, shared and locked as one, so no old
 * look changes — but it is shown as a PHRASE, and every one of the 2³² seeds
 * has exactly one:
 *     n  →  mix(n)  →  pattern (n mod 4) + four words, one from each bank
 *     "Enceladus's quiet lantern, turning"
 * and a phrase reads back to exactly its number. A number typed in still
 * works; any other text is hashed to a seed (one way, as games do).
 *
 *   banks    256 adjectives · 256 nouns · 128 -ing words · 128 names of
 *            planets, moons, stars, constellations and old gods
 *            (2 bits of pattern × 8 × 8 × 7 × 7 = 32 bits, exactly)
 *   mixing   an invertible scramble (an odd multiply, an xorshift), so
 *            neighbouring numbers get unrelated phrases
 *
 * THE BANKS' SIZES AND ORDER ARE FIXED: changing a word changes the phrase of
 * every seed that used it (never the seed, nor its texture). Ruby changed
 * them once, on purpose (Jupiter–Iocaste → Runology): the Archetypes are
 * among the names (the lantern of Quintessence), the Accent Runes among the
 * nouns, the Chroma among the colours, and a few of their verbs. Append
 * nowhere, reorder nothing; a word swapped stays in its slot.
 */
export const ADJ = [
  "quiet", "hollow", "silver", "gilded", "ashen", "amber", "velvet", "wandering", "sleeping", "waking",
  "drowned", "burning", "frozen", "gentle", "feral", "tender", "bitter", "sweet", "distant", "primal",
  "hidden", "secret", "open", "broken", "mended", "unfixable", "patient", "restless", "lucid", "dreaming",
  "fading", "rising", "falling", "shining", "dim", "pale", "dark", "bright", "golden", "copper", "iron",
  "glass", "paper", "woven", "folded", "torn", "stitched", "painted", "inked", "faint", "sapient", "soft",
  "sharp", "cosmological", "slow", "swift", "still", "wild", "lonely", "twin", "first", "last", "lost", "found",
  "new", "old", "ancient", "young", "ageless", "spectral", "ghostly", "hallowed", "holy", "profane", "sacred",
  "strange", "familiar", "foreign", "kind", "cruel", "honest", "crooked", "straight", "curved", "spiral",
  "round", "hexed", "charmed", "cursed", "blessed", "feathered", "furred", "scaled", "thorned", "blooming",
  "wilted", "salted", "sweetened", "smoky", "misty", "foggy", "rainy", "snowy", "windy", "stormy", "sunlit",
  "moonlit", "starlit", "dusky", "dawning", "midnight", "vernal", "autumnal", "wintry", "summer", "hungry",
  "magnetic", "empowered", "weary", "tireless", "brave", "shy", "bold", "humble", "proud", "gracious", "graceful",
  "precise", "nimble", "small", "vast", "tiny", "endless", "short", "long", "deep", "shallow", "high", "low",
  "red", "green", "blue", "yellow", "violet", "indigo", "azure", "cobalt", "teal", "jade",
  "emerald", "verdant", "mossy", "rosy", "crimson", "scarlet", "vermilion", "ruby", "garnet", "coral",
  "peach", "ivory", "pearl", "opal", "onyx", "obsidian", "ebon", "sable", "umber", "ochre", "sepia", "russet",
  "tawny", "bronze", "brass", "pewter", "leaden", "mercurial", "sulfurous", "saline", "vitreous", "crystal",
  "liquid", "molten", "vapor", "hazy", "clouded", "clear", "cloudless", "veiled", "bare", "robed", "crowned",
  "black", "masked", "silent", "humming", "singing", "whispering", "howling", "purring", "weeping",
  "laughing", "smiling", "grieving", "hopeful", "wistful", "mournful", "joyful", "gleeful", "fierce", "calm",
  "serene", "placid", "turbulent", "chaotic", "orderly", "whimsical", "mythic", "fabled", "storied",
  "nameless", "purple", "pink", "brown", "unbound", "bound", "tethered", "untethered", "orbiting",
  "lunar", "solar", "stellar", "astral", "cosmic", "planetary", "nebular", "radiant", "luminous", "glowing",
  "gleaming", "glinting", "shimmering", "flickering", "white", "kindled", "smoldering", "cinder",
  "candlelit", "twilit", "gloaming", "eclipsed", "waxing", "waning", "gibbous", "crescent", "full",
];
export const NOUN = [
  "lantern", "tide", "ember", "moon", "star", "seed", "glyph", "vellum", "ink", "quill", "page", "poem",
  "verse", "stanza", "rhyme", "spell", "rune", "sigil", "charm", "hex", "ward", "circle", "spiral", "orbit",
  "comet", "meteor", "nebula", "galaxy", "void", "abyss", "well", "pool", "mirror", "window", "door",
  "threshold", "gate", "key", "lock", "chain", "thread", "needle", "loom", "spindle", "shuttle", "weave",
  "knot", "braid", "ribbon", "veil", "shroud", "cloak", "hood", "crown", "ring", "halo", "aura", "lotus",
  "petal", "thorn", "rose", "lily", "iris", "violet", "fern", "moss", "lichen", "root", "branch", "leaf",
  "bough", "blossom", "bud", "bolt", "acorn", "pine", "cedar", "willow", "birch", "oak", "ash", "rowan",
  "hazel", "yew", "elder", "river", "stream", "lance", "arrow", "lake", "sea", "ocean", "wave", "current",
  "eddy", "whirlpool", "fountain", "spring", "rain", "storm", "thunder", "lightning", "cloud", "mist", "fog",
  "frost", "snow", "hail", "ice", "glacier", "mountain", "hill", "valley", "canyon", "cave", "grotto",
  "hollow", "meadow", "field", "garden", "orchard", "grove", "forest", "wood", "beam", "blast", "wall",
  "tower", "spire", "volley", "bell", "chime", "song", "hymn", "chant", "whisper", "echo", "silence",
  "shadow", "shade", "light", "flame", "fire", "smoke", "cinder", "coal", "candle", "wick", "torch", "beacon",
  "lighthouse", "harbor", "shore", "island", "reef", "shell", "pearl", "coral", "salt", "sulfur", "mercury",
  "gold", "silver", "copper", "iron", "glass", "prism", "crystal", "geode", "quartz", "amethyst", "opal",
  "garnet", "jade", "amber", "obsidian", "onyx", "marble", "stone", "pebble", "sand", "dune", "desert",
  "oasis", "compass", "map", "atlas", "chart", "clock", "dawn", "dusk", "noon", "midnight", "eclipse",
  "equinox", "solstice", "season", "winter", "summer", "autumn", "harvest", "feast", "fox", "kitsune",
  "familiar", "witch", "raven", "crow", "owl", "moth", "butterfly", "accent", "spider", "bee", "wren",
  "robin", "sparrow", "heron", "crane", "swan", "dove", "hare", "stag", "wolf", "serpent", "dragon", "wyrm",
  "phoenix", "koi", "archetype", "phase", "shimmer", "otter", "seal", "whale", "cat", "chroma", "horse", "bird",
  "feather", "wing", "claw", "tail", "runist", "scale", "fang", "heart", "hand", "eye", "mouth", "breath",
  "bone", "blood", "skin", "hair", "voice",
];
export const VERB = [
  "turning", "drifting", "falling", "rising", "burning", "dreaming", "waking", "sleeping", "singing",
  "humming", "whispering", "weeping", "laughing", "dancing", "spinning", "weaving", "mending", "stitching",
  "folding", "tearing", "breaking", "healing", "growing", "fading", "blooming", "wilting", "glowing",
  "gleaming", "flickering", "kindling", "smoldering", "melting", "freezing", "flowing", "pooling", "spilling",
  "rippling", "scrying", "seeking", "finding", "losing", "keeping", "guarding", "watching", "waiting",
  "wandering", "roaming", "flying", "soaring", "diving", "swimming", "floating", "sinking", "drowning",
  "breathing", "remembering", "forgetting", "naming", "calling", "answering", "listening", "echoing",
  "orbiting", "circling", "spiraling", "tumbling", "rolling", "empowering", "phasing", "climbing", "reaching",
  "holding", "releasing", "opening", "closing", "unlocking", "binding", "loosening", "tying", "untying",
  "knotting", "braiding", "casting", "conjuring", "summoning", "banishing", "charming", "hexing", "warding",
  "blessing", "praying", "chanting", "blasting", "measuring", "mapping", "charting", "writing", "inking",
  "reading", "sketching", "painting", "gilding", "glazing", "firing", "shattering", "scattering", "gathering",
  "harvesting", "sowing", "rooting", "branching", "nesting", "hatching", "molting", "shedding", "returning",
  "departing", "arriving", "leaving", "staying", "becoming", "waning", "waxing", "beckoning", "lingering",
  "beaming", "resting", "shimmering",
];
export const NAME = [
  "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Ceres", "Eris",
  "Haumea", "Makemake", "Sedna", "Io", "Europa", "Ganymede", "Callisto", "Fire", "Wind", "Mimas",
  "Enceladus", "Tethys", "Dione", "Rhea", "Titan", "Hyperion", "Iapetus", "Phoebe", "Janus", "Epimetheus",
  "Pandora", "Prometheus", "Atlas", "Pan", "Water", "Amber", "Calypso", "Miranda", "Ariel", "Umbriel",
  "Titania", "Oberon", "Puck", "Triton", "Nereid", "Proteus", "Vitrum", "Galatea", "Sound", "Charon",
  "Nix", "Hydra", "Radio", "Styx", "Phobos", "Deimos", "Luna", "Sirius", "Vega", "Rigel", "Betelgeuse",
  "Altair", "Deneb", "Arcturus", "Capella", "Aldebaran", "Spica", "Antares", "Polaris", "Canopus", "Procyon",
  "Contract", "Time", "Regulus", "Castor", "Pollux", "Mira", "Quintessence", "Destruction", "Astral", "Planar",
  "Creation", "Electra", "Maia", "Merope", "Taygeta", "Alcyone", "Celaeno", "Sterope", "Andromeda",
  "Cassiopeia", "Orion", "Lyra", "Cygnus", "Draco", "Order", "Dyna", "Aether", "Chaos", "Materia",
  "Death", "Life", "Aquila", "Pegasus", "Perseus", "Sovereign", "Gemini", "Hesperus", "Eos", "Selene", "Nyx",
  "Hecate", "Thoth", "Isis", "Osiris", "Brigid", "Morrigan", "Freya", "Frigg", "Odin", "Loki", "Ishtar",
  "Inanna", "Astarte", "Lilith", "Ostara", "Yule",
];

const MUL = 0x9E3779B1;
// the multiply's inverse mod 2^32 (Newton's iteration; MUL is odd)
const INV = (() => { let x = MUL; for(let i = 0; i < 5; i++) x = Math.imul(x, 2 - Math.imul(MUL, x)); return x >>> 0; })();
const mix   = n => { let x = Math.imul(n >>> 0, MUL) >>> 0; x = (x ^ (x >>> 16)) >>> 0; return x; };
const unmix = x => { x = (x ^ (x >>> 16)) >>> 0; return Math.imul(x, INV) >>> 0; };

const cap = w => w.charAt(0).toUpperCase() + w.slice(1);
/** The phrase for a seed (any integer; it is taken as 32 bits, as the textures take it). */
export function seedPhrase(n){
  let x = mix(Math.trunc(+n || 0));
  const p = x & 3; x = x >>> 2;
  const a = ADJ[x & 255], no = NOUN[(x >>> 8) & 255], v = VERB[(x >>> 16) & 127], nm = NAME[(x >>> 23) & 127];
  switch(p){
    case 0: return `${nm}'s ${a} ${no}, ${v}`;
    case 1: return `${cap(a)} ${no} ${v} over ${nm}`;
    case 2: return `The ${no} of ${nm}, ${a} and ${v}`;
    default: return `${cap(v)} ${no}, ${a} as ${nm}`;
  }
}
const idx = (bank, w) => { const i = bank.findIndex(b => b.toLowerCase() === w); return i; };
const PATTERNS = [
  [/^([a-z]+)'s? ([a-z\-]+) ([a-z\-]+),? ([a-z]+)$/, m => [m[2], m[3], m[4], m[1]]],
  [/^([a-z\-]+) ([a-z\-]+) ([a-z]+) over ([a-z]+)$/,  m => [m[1], m[2], m[3], m[4]]],
  [/^the ([a-z\-]+) of ([a-z]+),? ([a-z\-]+) and ([a-z]+)$/, m => [m[3], m[1], m[4], m[2]]],
  [/^([a-z]+) ([a-z\-]+),? ([a-z\-]+) as ([a-z]+)$/,  m => [m[3], m[2], m[1], m[4]]],
];
/** The seed a phrase stands for, or null if it isn't one of ours. */
export function phraseSeed(text){
  const t = String(text || '').toLowerCase().replace(/[’`]/g, "'").replace(/\s+/g, ' ').trim().replace(/[.!?;:]+$/g, '').trim();
  for(let p = 0; p < 4; p++){
    const m = t.match(PATTERNS[p][0]); if(!m) continue;
    const [a, no, v, nm] = PATTERNS[p][1](m).map(s => s.replace(/'s$/, ''));
    const ia = idx(ADJ, a), ino = idx(NOUN, no), iv = idx(VERB, v), inm = idx(NAME, nm);
    if(ia < 0 || ino < 0 || iv < 0 || inm < 0) continue;
    const x = ((((inm * 128 + iv) * 256 + ino) * 256 + ia) * 4 + p) >>> 0;
    return unmix(x);
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
