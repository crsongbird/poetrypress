/**
 * altText.test.mjs — the saved image carries the poem's words as its alt text
 * (jpegMeta.js): an XMP packet in the JPEG with IPTC's AltTextAccessibility
 * and dc:description, set in after the JFIF header, the picture untouched.
 */
import { readFileSync } from 'fs';
let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };
const M = await import('../jpegMeta.js');
const ev = readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8');

// a tiny JPEG's skeleton: SOI, APP0 (JFIF, 16 bytes), then the rest, then EOI
const app0 = [0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00];
const rest = [0xFF, 0xDB, 0x00, 0x03, 0x00, 0xFF, 0xD9];
const jpg = new Uint8Array([0xFF, 0xD8, ...app0, ...rest]);
const words = 'somewhere in the dirt\nthere\'s a fire you can plant — & <so plunge>';
const out = M.insertXmp(jpg, words), txt = new TextDecoder().decode(out);
check('the packet goes in after the JFIF header, and everything else follows unchanged',
  out[0] === 0xFF && out[1] === 0xD8 && out[20] === 0xFF && out[21] === 0xE1 && out.slice(-rest.length).every((b, i) => b === rest[i]) && out.slice(2, 20).every((b, i) => b === app0[i]));
check('its length is written into the segment correctly', ((out[22] << 8) | out[23]) === out.length - jpg.length - 2);
check('it says the words as IPTC alt text and as a description, escaped for XML',
  txt.includes('http://ns.adobe.com/xap/1.0/') && txt.includes('<Iptc4xmpCore:AltTextAccessibility>') && txt.includes('<dc:description>')
  && txt.includes('fire you can plant — &amp; &lt;so plunge&gt;'));
check('a data URL round-trips through it; anything not a JPEG comes back as it was',
  M.withAltText('data:image/png;base64,AAAA', 'x') === 'data:image/png;base64,AAAA' && M.withAltText('data:image/jpeg;base64,' + Buffer.from(jpg).toString('base64'), words).length > 200);
const long = 'a line of a very long poem\n'.repeat(4000), big = M.insertXmp(jpg, long);
check('a poem too long for one segment is cut short, never breaks the file', ((big[22] << 8) | big[23]) <= 65535 && big[big.length - 1] === 0xD9);
check('saving puts them in, written from the page as it stands',
  /link\.href = withAltText\(canvas\.toDataURL\('image\/jpeg', 1\.0\), poemAltText\(\)\);/.test(ev) && /return describeLook\(\{/.test(ev));

// what it says (altText.js)
const A = await import('../altText.js');
const look = {
  poem: ['somewhere in the dirt', "there's a fire you can plant", '', 'so plunge your hands inside'],
  font: 'Cormorant Garamond', textColours: ['#F2E6D8', null], effects: ['glow'], background: ['#2A1E2E', '#0A0A0A'],
  surface: { type: 'bokeh', name: 'Dream Bloom', reading: 'Lantern Festival', element: 'Fire', opacity: 85, blend: 'screen',
    knobs: [{ label: 'Focal Plane', value: 160, min: 25, max: 400 }, { label: 'Orb Count', value: 70, min: 20, max: 260 }], hues: ['#FFB347', '#3A1205'], light: null },
  base: null, border: { colour: '#E8739E', stitch: 'scallop' }, box: false, vignette: true,
};
const alt = A.describeLook(look);
check('the poem\'s own words come first, as written (no markup)', alt.startsWith('somewhere in the dirt\nthere\'s a fire you can plant\nso plunge your hands inside\n\n'));
check('then plain English: the tool, the typeface and colours, the background, the surface as it looks, its reading, its settings, the frame',
  alt.includes('An image created with Unfixable Vellum (PoetryPress), an open source art tool.') && alt.includes('set in Cormorant Garamond, in cream, with a soft glow')
  && alt.includes('Dream Bloom (its Lantern Festival reading, Fire): soft, out-of-focus orbs of light, strongly glowing over the page')
  && /focal plane low, orb count low/.test(alt) && alt.includes('a scallop border in pink') && alt.includes('darkened edges'));
check('colours are named as a person would ("very dark plum", "tan", "near-black")', A.colourName('#2A1E2E') === 'very dark plum' && A.colourName('#C9A876') === 'tan' && A.colourName('#000000') === 'near-black');
const longLook = { ...look, poem: Array.from({ length: 400 }, (_, i) => 'a line of a long poem, number ' + i) };
const longAlt = A.describeLook(longLook);
check('never more than 1500 characters: a long poem gives way (at a word) before the description does', longAlt.length <= 1500 && longAlt.includes('An image created with Unfixable Vellum') && /…\n\nAn image/.test(longAlt));
check('every texture in the picker is described', Object.keys((await import('../textureElements.js')).TEXTURE_ELEMENTS).every(t => A.TEXTURE_LOOKS[t]));

console.log();
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
