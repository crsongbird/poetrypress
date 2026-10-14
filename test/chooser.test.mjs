/**
 * chooser.test.mjs — the surface menus shown as tiles (chooser.js), and the
 * preset grid's search and folding groups.
 *
 * Ruby: "search functions, collapsible categories … a UI for the texture
 * selector that has a thumbnail generated and stored in cache".
 *
 * Run: node test/chooser.test.mjs
 */
import { readFileSync } from 'fs';
const { chGroupsOf, chMatches, chCacheFor, CHOOSER_CACHE_KEY } = await import('../chooser.js');
let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ev = readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8');

// a <select> as the markup has it, parsed simply
const sel = html.slice(html.indexOf('<select id="textureType">'), html.indexOf('</select>', html.indexOf('<select id="textureType">')));
const fake = { children: [] };
for(const m of sel.matchAll(/<(optgroup|option)\b([^>]*)>([^<]*)/g)){
  const attrs = m[2], label = (attrs.match(/label="([^"]*)"/) || [])[1], value = (attrs.match(/value="([^"]*)"/) || [])[1];
  if(m[1] === 'optgroup') fake.children.push({ tagName: 'OPTGROUP', label, children: [] });
  else { const o = { tagName: 'OPTION', value, hidden: /\bhidden\b/.test(attrs), textContent: m[3] };
    const g = fake.children[fake.children.length - 1]; (g && g.tagName === 'OPTGROUP' && !/^\s*$/.test(m[3]) && !o.hidden ? g.children : fake.children).push(o); }
}
const groups = chGroupsOf(fake);
check('the texture menu reads as its groups, each with a glyph and a name', groups.length >= 10 && groups.every(g => g.glyph && g.name && g.items.length));
check('hidden options (old looks\' surfaces) are not offered as tiles', !groups.some(g => g.items.some(i => ['cells', 'crackedglaze', 'checker'].includes(i.value))));
check('group names lose their glyph and their &amp;', groups.some(g => g.name === 'Materials & Craft'));
check('a search needs every word, anywhere in the name, group or extra words',
  chMatches('rose glass', { text: 'Stained Glass', value: 'stainedglass' }, 'Materials & Craft', 'Rose Window Seedy Amber') &&
  !chMatches('rose paper', { text: 'Stained Glass', value: 'stainedglass' }, 'Materials & Craft', 'Rose Window') &&
  chMatches('', { text: 'x', value: 'x' }, '', ''));
check('thumbnails are kept per release: a new release starts empty',
  chCacheFor(JSON.stringify({ release: 'A', map: { moon: 'data:' } }), 'A').map.moon === 'data:' &&
  Object.keys(chCacheFor(JSON.stringify({ release: 'A', map: { moon: 'data:' } }), 'B').map).length === 0 &&
  Object.keys(chCacheFor('not json', 'B').map).length === 0);
check('the cache key is versioned', /\.v\d+$/.test(CHOOSER_CACHE_KEY));
check('both surface menus are shown as choosers, and refreshUi keeps their buttons current',
  /\[\$\('textureType'\), CHOOSER\.surfaceTitle\], \[\$\('baseType'\), CHOOSER\.baseTitle\]/.test(ev) && /for\(const ch of CHOOSERS\) ch\.refresh\(\)/.test(ev));
check('a thumbnail is the surface as a preset wears it, made at three times the tile and drawn down',
  /const wornBy = type =>/.test(ev) && /canvas\.width\*3, canvas\.height\*3/.test(ev));
check('the base menu takes real groups only (an <option> has a label too)', /String\(g\.tagName\)\.toUpperCase\(\) !== 'OPTGROUP' \|\| g\.id === 'athanorGroup'/.test(ev));
check('the preset grid has a search, and its group headings are buttons that fold',
  /id="presetSearch"/.test(html) && /hd\.type = 'button'; hd\.className = 'preset-group-head'/.test(ev) && /PRESET_FOLD_KEY = 'uv\.presets\.folded'/.test(ev));
console.log(failures ? `\n${failures} FAILURES` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
