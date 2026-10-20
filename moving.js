/**
 * moving.js — the Moving Image's pure parts: a look blended toward another, and the three containers the frames are
 * put into (an MP4, a WebM, a zip of PNG frames), written here so nothing is fetched.
 *
 * The frames themselves are drawn and encoded by uiMoving.js (the page's renderer, and the browser's own video encoder,
 * WebCodecs). What arrives here is bytes: each encoded frame, whether it is a key frame, and the codec's own setup.
 * Prior art: docs/prior-art/moving-image.md.
 */

// ---------- a look toward another ----------

const HEX = /^#[0-9a-f]{6}$/i;
const numOf = v => (typeof v === 'number' ? v : (typeof v === 'string' && v.trim() !== '' && isFinite(+v) ? +v : NaN));
const ANGLED = /angle|turn|light$|rim$/i;   // (dials and gradient angles go round the short way)
/**
 * A look between a and b, t from 0 to 1. Numbers ease between (the dials' angles the short way round), colours mix,
 * and what can't be between (a surface's kind, a typeface, a seed, a switch) is a's or b's whole: `side` says which
 * (0 a's, 1 b's), so a frame near the change can be drawn both ways and faded. `snap(key)` names more keys that
 * must not be between (the page's own selects). Keys only one look has keep it.
 */
export function blendLooks(a, b, t, side, snap = () => false){
  const out = {};
  for(const k of new Set([...Object.keys(a || {}), ...Object.keys(b || {})])){
    const va = a ? a[k] : undefined, vb = b ? b[k] : undefined;
    if(va === undefined){ out[k] = vb; continue; }
    if(vb === undefined){ out[k] = va; continue; }
    out[k] = blendValue(k, va, vb, t, side, snap);
  }
  return out;
}
function blendValue(k, va, vb, t, side, snap){
  if(va && vb && typeof va === 'object' && typeof vb === 'object' && !Array.isArray(va) && !Array.isArray(vb)) return blendLooks(va, vb, t, side, snap);
  const whole = side ? vb : va;
  if(/seed/i.test(k) || snap(k)) return whole;
  if(typeof va === 'string' && typeof vb === 'string' && HEX.test(va) && HEX.test(vb)) return blendHex(va, vb, t);
  const na = numOf(va), nb = numOf(vb);
  if(isNaN(na) || isNaN(nb) || typeof va === 'boolean' || typeof vb === 'boolean') return whole;
  let d = nb - na; if(ANGLED.test(k)) d = ((d % 360) + 540) % 360 - 180;
  let v = Math.round((na + d*t)*1000)/1000; if(ANGLED.test(k)) v = (v % 360 + 360) % 360;
  return typeof va === 'string' ? String(v) : v;
}
function blendHex(a, b, t){
  const c = (h, i) => parseInt(h.slice(1 + 2*i, 3 + 2*i), 16);
  return '#' + [0, 1, 2].map(i => Math.round(c(a, i) + (c(b, i) - c(a, i))*t).toString(16).padStart(2, '0')).join('');
}
/** The keys whose values can't be between the two looks and differ, so the film fades across where they change. */
export function wholeChanges(a, b, snap = () => false){
  const out = [];
  const walk = (x, y, at) => { for(const k of new Set([...Object.keys(x || {}), ...Object.keys(y || {})])){ const va = x[k], vb = y[k];
    if(va === undefined || vb === undefined || va === vb) continue;
    if(va && vb && typeof va === 'object' && typeof vb === 'object' && !Array.isArray(va)){ walk(va, vb, at + k + '.'); continue; }
    if(blendValue(k, va, vb, 0.5, 0, snap) !== blendValue(k, va, vb, 0.5, 1, snap)) out.push(at + k); } };
  walk(a || {}, b || {}, '');
  return out;
}
/** How far along the move a frame is: eased in and out; "and back" goes there and returns, so the film loops. */
export function moveAt(i, n, back){
  const u = n > 1 ? i/n : 0, s = back ? (u < 0.5 ? u*2 : 2 - u*2) : Math.min(1, i/Math.max(1, n - 1));
  return 0.5 - 0.5*Math.cos(Math.PI*s);
}

// ---------- the sun through a day ----------

/**
 * THE SUN'S PATH (Ruby: "sunset / sunrise in a parabolic arc with physically accurate timing rather than just a circle,
 * with slightly longer days than nights, extended sunset and sunrise"; docs/prior-art/ringworld-time.md): the sun of a
 * place at 48° in early summer (declination 15°), its elevation and bearing from the hour angle as the solar
 * calculators give them, so it climbs the sky in an arc and sinks slowly along the horizon, the day some fourteen hours
 * and the night ten. On the light dial: its turn the bearing (from where the dial stands now), its tilt the height
 * (the middle overhead, the rim the horizon, past the rim the twilight deepening to night at 18° below).
 * Starting where the dial is, it gives for any hours since [the dial's turn, its tilt].
 */
const SUN_LAT = 48*Math.PI/180, SUN_DEC = 15*Math.PI/180;
const sunEl = H => Math.asin(Math.sin(SUN_LAT)*Math.sin(SUN_DEC) + Math.cos(SUN_LAT)*Math.cos(SUN_DEC)*Math.cos(H));
const sunAz = H => Math.atan2(Math.sin(H), Math.cos(H)*Math.sin(SUN_LAT) - Math.tan(SUN_DEC)*Math.cos(SUN_LAT));
const sunTilt = el => el >= 0 ? 100*(1 - el/(Math.PI/2)) : 100 + 30*Math.min(1, -el/(18*Math.PI/180));
export function sunPath(deg0, tilt0){
  const el0 = tilt0 <= 100 ? (1 - tilt0/100)*Math.PI/2 : -Math.min(1, (tilt0 - 100)/30)*18*Math.PI/180;
  const c = (Math.sin(el0) - Math.sin(SUN_LAT)*Math.sin(SUN_DEC))/(Math.cos(SUN_LAT)*Math.cos(SUN_DEC)), H0 = -Math.acos(Math.max(-1, Math.min(1, c)));   // (the morning's)
  const a0 = deg0 - sunAz(H0)*180/Math.PI;
  return hours => { const H = H0 + hours*Math.PI/12; return [((a0 + sunAz(H)*180/Math.PI) % 360 + 360) % 360, Math.round(sunTilt(sunEl(H))*100)/100]; };
}

/**
 * THE FILM'S CLOCK through a day (as games keep it, docs/prior-art/ringworld-time.md: the hours near sunrise and sunset
 * given more of the film than the rest): from u, 0 to 1 along the film, the hours since it began, the clock running
 * slowest while the sun is near the horizon (some three times slower), so a day in seconds still has a dawn and a dusk
 * to watch. sun: a sunPath; hours: how long the film spans.
 */
export function filmHours(sun, hours){
  const N = 2400, w = h => 1 + 2.2*Math.exp(-Math.pow((sun(h)[1] - 100)/14, 2)), cum = [0];
  for(let i = 1; i <= N; i++) cum.push(cum[i - 1] + w(hours*(i - 0.5)/N));
  const tot = cum[N];
  return u => { const t = Math.max(0, Math.min(1, u))*tot; let lo = 0, hi = N; while(hi - lo > 1){ const m = (lo + hi) >> 1; if(cum[m] <= t) lo = m; else hi = m; }
    return hours*(lo + (t - cum[lo])/((cum[hi] - cum[lo]) || 1))/N; };
}

// ---------- bytes ----------

const enc = new TextEncoder();
const u8 = n => new Uint8Array(n);
function cat(parts){ let n = 0; for(const p of parts) n += p.length; const o = u8(n); let at = 0; for(const p of parts){ o.set(p, at); at += p.length; } return o; }
const be32 = v => { const o = u8(4); new DataView(o.buffer).setUint32(0, v >>> 0); return o; };
const be16 = v => { const o = u8(2); new DataView(o.buffer).setUint16(0, v & 0xffff); return o; };
const le32 = v => { const o = u8(4); new DataView(o.buffer).setUint32(0, v >>> 0, true); return o; };
const le16 = v => { const o = u8(2); new DataView(o.buffer).setUint16(0, v & 0xffff, true); return o; };

// ---------- the zip (stored, not compressed: PNGs are compressed already) ----------

const CRC_TABLE = (() => { const t = new Uint32Array(256);
  for(let n = 0; n < 256; n++){ let c = n; for(let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t; })();
export function crc32(bytes, crc = 0){
  let c = ~crc >>> 0;
  for(let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}
/**
 * A zip's parts, in order, for a Blob: each entry { name, size, crc, data } (data any Blob part, so a long film's
 * frames can stay in the browser's blob store instead of in memory). Stored, with a fixed date.
 */
export function zipParts(entries){
  const parts = [], central = []; let at = 0;
  const DOS_TIME = 0, DOS_DATE = ((2026 - 1980) << 9) | (10 << 5) | 20;
  for(const e of entries){
    const name = enc.encode(e.name);
    const local = cat([le32(0x04034b50), le16(20), le16(0x0800), le16(0), le16(DOS_TIME), le16(DOS_DATE), le32(e.crc), le32(e.size), le32(e.size), le16(name.length), le16(0), name]);
    central.push(cat([le32(0x02014b50), le16(20), le16(20), le16(0x0800), le16(0), le16(DOS_TIME), le16(DOS_DATE), le32(e.crc), le32(e.size), le32(e.size), le16(name.length), le16(0), le16(0), le16(0), le16(0), le32(0), le32(at), name]));
    parts.push(local, e.data); at += local.length + e.size;
  }
  const dir = cat(central);
  parts.push(dir, cat([le32(0x06054b50), le16(0), le16(0), le16(entries.length), le16(entries.length), le32(dir.length), le32(at), le16(0)]));
  return parts;
}

// ---------- the MP4 (ISO BMFF: one H.264 track, the index first so it plays as it loads) ----------

const box = (type, ...parts) => { const body = cat(parts); return cat([be32(8 + body.length), enc.encode(type), body]); };
const full = (type, version, flags, ...parts) => box(type, new Uint8Array([version, flags >> 16 & 255, flags >> 8 & 255, flags & 255]), ...parts);
const MATRIX = cat([be32(0x00010000), be32(0), be32(0), be32(0), be32(0x00010000), be32(0), be32(0), be32(0), be32(0x40000000)]);
/**
 * The film as an MP4's parts: { width, height, fps, avcC (the encoder's decoderConfig.description), frames: [{ data,
 * key }] } at a steady rate. The moov (the index) is written before the mdat, so a page can play it while it loads.
 */
export function mp4Parts({ width, height, fps, avcC, frames }){
  const scale = fps*1000, delta = 1000, n = frames.length, dur = n*delta;
  const moov = chunkAt => box('moov',
    full('mvhd', 0, 0, be32(0), be32(0), be32(scale), be32(dur), be32(0x00010000), be16(0x0100), u8(10), MATRIX, u8(24), be32(2)),
    box('trak',
      full('tkhd', 0, 3, be32(0), be32(0), be32(1), be32(0), be32(dur), u8(8), be16(0), be16(0), be16(0), be16(0), MATRIX, be32(width << 16), be32(height << 16)),
      box('mdia',
        full('mdhd', 0, 0, be32(0), be32(0), be32(scale), be32(dur), be16(0x55c4), be16(0)),
        full('hdlr', 0, 0, be32(0), enc.encode('vide'), u8(12), enc.encode('Moving Image\0')),
        box('minf',
          full('vmhd', 0, 1, u8(8)),
          box('dinf', full('dref', 0, 0, be32(1), full('url ', 0, 1))),
          box('stbl',
            full('stsd', 0, 0, be32(1), box('avc1', u8(6), be16(1), u8(16), be16(width), be16(height), be32(0x00480000), be32(0x00480000), be32(0), be16(1),
              u8(32), be16(0x18), be16(0xffff), box('avcC', avcC))),
            full('stts', 0, 0, be32(1), be32(n), be32(delta)),
            full('stss', 0, 0, be32(frames.filter(f => f.key).length), ...frames.map((f, i) => f.key ? be32(i + 1) : null).filter(Boolean)),
            full('stsc', 0, 0, be32(1), be32(1), be32(n), be32(1)),
            full('stsz', 0, 0, be32(0), be32(n), ...frames.map(f => be32(f.data.length))),
            full('stco', 0, 0, be32(1), be32(chunkAt)))))));
  const ftyp = box('ftyp', enc.encode('isom'), be32(512), enc.encode('isomiso2avc1mp41'));
  const size = frames.reduce((s, f) => s + f.data.length, 0);
  const head = moov(0).length, m = moov(ftyp.length + head + 8);
  return [ftyp, m, cat([be32(8 + size), enc.encode('mdat')]), ...frames.map(f => f.data)];
}

// ---------- the WebM (Matroska's EBML: one VP9 or VP8 track, a cluster from each key frame) ----------

const ebmlId = id => { const o = []; for(let v = id; v > 0; v = Math.floor(v/256)) o.unshift(v & 255); return new Uint8Array(o); };
const ebmlSize = n => { const o = u8(8); o[0] = 0x01; let v = n; for(let i = 7; i > 0; i--){ o[i] = v % 256; v = Math.floor(v/256); } return o; };
const el = (id, ...parts) => { const body = cat(parts.map(p => typeof p === 'string' ? enc.encode(p) : p)); return cat([ebmlId(id), ebmlSize(body.length), body]); };
const uint = n => { const o = []; let v = n; do { o.unshift(v % 256); v = Math.floor(v/256); } while(v > 0); return new Uint8Array(o); };
const f64 = v => { const o = u8(8); new DataView(o.buffer).setFloat64(0, v); return o; };
/** The film as a WebM's bytes: { width, height, fps, codec ('V_VP9' or 'V_VP8'), frames: [{ data, key }] }. */
export function webmBytes({ width, height, fps, codec, frames }){
  const ms = i => Math.round(i*1000/fps), clusters = [];
  for(let i = 0; i < frames.length;){
    const start = i, blocks = [];
    do { const rel = ms(i) - ms(start), f = frames[i];
      blocks.push(el(0xA3, new Uint8Array([0x81, rel >> 8 & 255, rel & 255, f.key ? 0x80 : 0]), f.data)); i++;
    } while(i < frames.length && !frames[i].key && ms(i) - ms(start) < 30000);
    clusters.push(el(0x1F43B675, el(0xE7, uint(ms(start))), ...blocks));
  }
  return cat([
    el(0x1A45DFA3, el(0x4286, uint(1)), el(0x42F7, uint(1)), el(0x42F2, uint(4)), el(0x42F3, uint(8)), el(0x4282, 'webm'), el(0x4287, uint(4)), el(0x4285, uint(2))),
    el(0x18538067,
      el(0x1549A966, el(0x2AD7B1, uint(1000000)), el(0x4D80, 'PoetryPress'), el(0x5741, 'PoetryPress'), el(0x4489, f64(ms(frames.length)))),
      el(0x1654AE6B, el(0xAE, el(0xD7, uint(1)), el(0x73C5, uint(1)), el(0x83, uint(1)), el(0x86, codec), el(0x23E383, uint(Math.round(1e9/fps))),
        el(0xE0, el(0xB0, uint(width)), el(0xBA, uint(height))))),
      ...clusters)]);
}
