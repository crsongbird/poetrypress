/**
 * persistenceCoverage.test.mjs — every control a person can fiddle with is part of a look: saved, restored, and so
 * carried by everything built on those two (the Workbench JSON, the Grimoire and shared spells, undo and redo).
 *
 * Ruby's standing rule: ANY new field, slider, colour or toggle must be captured by the look. This suite finds every
 * <input>, <select> and <textarea> in index.html by itself and, on the booted page, for each one: changes it as a
 * person would (a value it can take, its input and change events), saves the look, loads another look (which must put
 * the control back, never leave the last look's value behind), loads the saved look, and reads the control back. A
 * new control that isn't saved and restored fails here, unless it is in EXEMPT below with the reason it is not part
 * of a look. (audit.test.mjs goes the other way: every saved key round-trips.)
 */
import { readFileSync } from 'fs';
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';
import { check, done } from './harness.mjs';

installCanvasMock();
const reg = installDomMock(makeMockContext, makeMockCanvas);
await import('../appEvents.js');
const { athanorStarter } = await import('../athanor.js');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const save = () => { reg['advancedRefreshBtn'].dispatchEvent({ type: 'click' }); return reg['advancedJson'].value; };
const load = text => { reg['advancedJson'].value = text; reg['advancedLoadBtn'].dispatchEvent({ type: 'click' }); };

// controls that are deliberately NOT part of a look — each with its reason
const EXEMPT = {
  uiTheme:      'the app\'s own theme: a preference saved on its own, not part of an image',
  forgeSteps:   'the Athanor\'s step previews on or off: a working preference of this browser (localStorage), not part of an image',
  forgeChannel: 'which channel the Athanor\'s preview shows: a view of the graph while working on it, never part of an image',
  soundToggle:  'interface sounds on or off (murmur.js): this browser\'s preference, kept in localStorage, not part of an image',
  soundVolume:  'interface sound volume: this browser\'s preference, kept in localStorage, not part of an image',
  hapticsToggle: 'haptic ticks on or off: this browser\'s preference, kept in localStorage, not part of an image',
  hintsToggle:  'hints written out under every section: this browser\'s preference, kept in localStorage, not part of an image',
  fullPreview:  'a view preference (the preview at full size), not part of an image',
  advancedJson: 'the Workbench JSON box IS the saved look',
  modalInput:   'the text field of a dialog',
  // (the Moving Image sheet: how a film is made, not part of the look)
  ...Object.fromEntries(['movingLook', 'movingLength'].map(id => [id, 'the Moving Image sheet: how a film is made, not part of the look'])),
  cameraZoomSlider: 'a view of the camera\'s zoom (cameraZoom, saved with the layer)',
  modalRangeA:  'a dialog\'s low handle (a wire\'s range, kept in the graph)',
  modalRangeB:  'a dialog\'s high handle (a wire\'s range, kept in the graph)',
  lightDegIn:   'the dial\'s angle typed or read: a view of textureLight, which is saved and restored',
  lightTiltIn:  'the dial\'s reach typed or read: a view of textureLightTilt, which is saved and restored',
  rimStrength:  'the rim\'s strength under the dial: a view of the rim colour\'s alpha (textureRim), which is saved and restored',
  lightRimKIn:  'the rim strength\'s number typed or read: the same view of textureRim',
  lightAmbIn:   'the Ambient slider\'s number typed or read: a view of textureAmbient, which is saved and restored',
  presetSearch: 'a search over the preset grid: it filters what the grid shows, and is not part of an image',
  cameraTurnIn: 'the camera dial\'s turn typed or read: a view of cameraTurn, which is saved and restored',
  cameraViewIn: 'the camera dial\'s view typed or read: a view of cameraView, which is saved and restored',
  forgeOpenSelect: 'the Athanor\'s Open drawer: picking one opens that graph on the bench; the bench is kept by itself, not as a control',
  textureSeedWords: 'the seed shown as its phrase: a view of textureSeedValue, which is saved and restored (seedWords.js turns each into the other exactly)',
};
// the page's shape is the person's (AGENTS.md §5.4): a look loaded from outside never changes it, and it comes back
// with the draft (draft.test.mjs), so it is checked to stay put, not to round-trip through a look
const SHAPE = new Set(['customSizeToggle', 'customW', 'customH']);
// what a control needs first to be part of the look at all (a third or fourth stop is saved only while in use)
const radio = (group, val) => { const b = reg[group].children.find(c => c.dataset.val === val); b.dispatchEvent({ type: 'click', target: b }); };
const CONTEXT = { bgColor3Hex: () => radio('bgStopsGroup', '4'), bgColor4Hex: () => radio('bgStopsGroup', '4'), textColor3Hex: () => radio('textStopsGroup', '4'), textColor4Hex: () => radio('textStopsGroup', '4') };

// every control in the page, with what it is: its type, its range, its options
const controls = [];
for(const m of html.matchAll(/<(input|select|textarea)\b([^>]*)>/g)){ const at = m[2], id = (at.match(/\bid="([^"]+)"/) || [])[1]; if(!id) continue;
  const num = k => { const v = at.match(new RegExp('\\b' + k + '="([^"]+)"')); return v ? +v[1] : undefined; };
  const opts = m[1] === 'select' ? [...html.slice(m.index, html.indexOf('</select>', m.index)).matchAll(/<option\b[^>]*value="([^"]*)"/g)].map(o => o[1]) : null;
  controls.push({ id, type: m[1] === 'input' ? ((at.match(/\btype="([^"]+)"/) || [])[1] || 'text') : m[1], min: num('min'), max: num('max'), step: num('step'), opts }); }
// a different value each kind of control can take
const another = (c, el) => { const cur = el.value;
  if(c.type === 'checkbox') return !el.checked;
  if(c.type === 'range' || c.type === 'number'){ const st = c.step || 1, v = +cur; return String(+(v + st*3 <= (c.max ?? 100) ? v + st*3 : v - st*3).toFixed(6)); }
  if(c.opts) return c.opts.find(o => o !== cur && o !== '') ?? null;
  if(c.id === 'forgeGraph') return JSON.stringify(athanorStarter('grain'));
  if(c.type === 'color' || /^#[0-9a-f]{3,8}$/i.test(cur) || /Hex$|Color$/.test(c.id)) return cur.toUpperCase() === '#123456' ? '#654321' : '#123456';
  if(cur !== '' && !isNaN(+cur)) return String(+cur < 90 ? +cur + 7 : +cur - 7);
  return cur === 'a poem' ? 'another poem' : 'a poem'; };
const read = (c, el) => c.type === 'checkbox' ? el.checked : el.value;
const same = (c, a, b) => c.id === 'forgeGraph' ? JSON.stringify(JSON.parse(a || 'null')) === JSON.stringify(JSON.parse(b || 'null')) : String(a).toLowerCase() === String(b).toLowerCase();

check('the page has controls to check, and the app reaches every one not exempt (the scan works)', controls.length > 80 && controls.every(c => EXEMPT[c.id] || reg[c.id]));
const base = save(), wontTake = [], leaks = [], notKept = [], shapeMoved = []; let tried = 0;
for(const c of controls){ if(EXEMPT[c.id]) continue; const el = reg[c.id];
  load(base); if(CONTEXT[c.id]) CONTEXT[c.id]();
  const nv = another(c, el); if(nv === null) continue;
  if(c.type === 'checkbox') el.checked = nv; else el.value = nv;
  el.dispatchEvent({ type: 'input', target: el }); el.dispatchEvent({ type: 'change', target: el });
  if(!same(c, read(c, el), nv)){ wontTake.push(c.id); continue; }
  const saved = save(); tried++;
  load(base);
  if(SHAPE.has(c.id)){ if(!same(c, read(c, el), nv)) shapeMoved.push(c.id); continue; }
  if(same(c, read(c, el), nv)) leaks.push(c.id);
  load(saved);
  if(!same(c, read(c, el), nv)) notKept.push(c.id); }
check(`every control takes a value a person could give it (${tried} tried)`, wontTake.length === 0 && tried > 80);
if(wontTake.length) console.log('   would not take a value:', wontTake.join(', '));
check('every control on the page is SAVED with a look and RESTORED from it (or exempt, with a reason)', notKept.length === 0);
if(notKept.length) console.log('   not saved and restored:', notKept.join(', '), '— add it to PERSISTED in appEvents.js (or to EXEMPT here, with the reason)');
check('loading a look puts every control back to that look\'s value, never the last look\'s (a value never leaks)', leaks.length === 0);
if(leaks.length) console.log('   left as the last look had it:', leaks.join(', '));
check('loading a look never changes the page\'s shape (it is the person\'s)', shapeMoved.length === 0);
check('no exemption names a control that no longer exists', Object.keys(EXEMPT).every(id => controls.some(c => c.id === id)));

done();
