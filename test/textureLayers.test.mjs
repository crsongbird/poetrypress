/**
 * textureLayers.test.mjs — TEXTURE LAYERS: a base texture under the main one,
 * with its own variant, two knobs, opacity and blend; saved with the look;
 * presets turn it off; its seed is turned so it never echoes the main one.
 */
import { readFileSync } from 'fs';
let failures = 0;
const check = (name, ok) => { console.log((ok ? 'ok: ' : 'FAIL: ') + name); if(!ok) failures++; };
const src = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const html = src('index.html'), ev = src('appEvents.js'), cr = src('canvasRenderer.js');

check('the controls: a toggle, the variant, two knobs, opacity and blend, inside the Surface card',
  ['baseToggle', 'baseType', 'baseP1', 'baseP2', 'baseOpacity', 'baseBlend'].every(id => html.includes(`id="${id}"`))
  && html.indexOf('id="baseToggle"') > html.indexOf('id="textureBlock"') && html.indexOf('id="baseToggle"') < html.indexOf('id="insetPanel"'));
check('all six are saved with the look (and so in the JSON, spells and share links)',
  ['baseToggle', 'baseType', 'baseP1', 'baseP2', 'baseOpacity', 'baseBlend'].every(k => new RegExp(`\\['${k}',\\s+'${k}',`).test(ev)));
check('a look restores its base variant before its knobs (so they take the right range)',
  ev.indexOf("if(s.baseType && $('baseType')){ $('baseType').value = s.baseType; syncBaseParams(false); }") > 0
  && ev.indexOf("if(s.baseType && $('baseType'))") < ev.indexOf('applyPersisted(s.cardLink === undefined'));
check('a preset turns the base layer off (it never leaks from one look to the next)', /cardFxScale:'50', baseToggle:false \};/.test(ev));
check('drawn beneath the main texture, with a turned seed and the variant\'s own hues',
  cr.indexOf("requestTexture('base', bt, W, H,") > 0 && cr.indexOf("requestTexture('base', bt, W, H,") < cr.indexOf("const type = $('textureType').value;")
  && /\^ 0x5bd1e995\) >>> 0/.test(cr) && /c === 'accent1' \? a1 : c === 'accent2' \? a2 : c/.test(cr));
check('the base offers every variant but the composites (Deep Field, the Crucible)', /if\(o\.value === 'astral' \|\| o\.value === 'crucible'\) continue;/.test(ev));

console.log();
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
