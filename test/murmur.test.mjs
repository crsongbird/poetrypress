/**
 * murmur.test.mjs — interface sounds (murmur.js) from a sound design: off by
 * default; every UI function named and mapped (or silent); every note of
 * every composition inside its scale and the safe range, the same every
 * time; a stand-in audio graph plays them; settings kept apart from looks.
 */
import { readFileSync } from 'fs';
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';
import { check, done, UI_FILES } from './harness.mjs';
const src = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const M = await import('../murmur.js');
const D = M.MURMUR_DESIGN;

check('importing it makes nothing and plays nothing (no window here, no error)', typeof M.createMurmur === 'function');
check('off unless asked', M.createMurmur().enabled === false);

// the design
const ids = new Set(M.MURMUR_FUNCTIONS.map(f => f.id));
check('every UI function has a place in the map, and the map names only UI functions', [...ids].every(k => k in D.map) && Object.keys(D.map).every(k => ids.has(k)));
check('every mapped composition exists; most settings are silent (checkbox, menu, cards)',
  Object.values(D.map).every(c => c === null || D.compositions[c]) && ['checkbox', 'select', 'cardOpen', 'cardFold'].every(k => D.map[k] === null));
check('a lock is a tick, not a fanfare', D.map.lock === 'tick' && D.map.unlock === 'tick' && D.compositions.tick.events.length === 1);
check('the soft no asks before work is undone; a hard no refuses; a switched-off control knocks, hollow',
  D.map.confirm === 'confirm' && JSON.stringify(D.compositions.confirm.events[0].notes) === '[2,1]' && D.compositions.confirm.events[0].inst === 'pad'
  && D.map.hardNo === 'hardNo' && D.map.blocked === 'blocked' && D.instruments.thud.bright < 0.1);
check('quiet by default: tabs, readings, undo and redo make no sound; saving, arrivals, keeping and the Athanor do',
  ['tab', 'readingFire', 'undo', 'redo', 'reroll'].every(k => D.map[k] === null) && ['saveImage', 'preset', 'spellCreate', 'athanorOpen', 'nodeAdd', 'wireConnect'].every(k => D.map[k]));
check('it is a minor key', ['aeolian', 'dorian', 'phrygian', 'minorPent'].includes(D.scale));
check('home sits an octave down (D2), and the bell is quiet', D.octave === -1 && M.degreeMidi(D, 0) === 38 && D.instruments.bell.level <= 0.2);
check('every instrument has a real body', Object.values(D.instruments).every(i => M.MURMUR_BODIES[i.body]));

// every note in its scale, in range, the same every time
let outOfKey = 0, outOfRange = 0, differs = false;
for(const [sk, S] of Object.entries(M.MURMUR_SCALES)){
  const pcs = new Set((S.snap || S.steps).map(s => (s + 2) % 12));
  const d = { ...D, scale: sk };
  for(const id of Object.keys(D.compositions)) for(const index of [0, 2, 4]){
    const a = M.renderComposition(d, id, { index }), b = M.renderComposition(d, id, { index });
    if(JSON.stringify(a) !== JSON.stringify(b)) differs = true;
    for(const n of a){ if(!pcs.has(((n.midi % 12) + 12) % 12)) outOfKey++; const f = 440*Math.pow(2, (n.midi - 69)/12); if(f < 55 || f > 1100) outOfRange++; }
  }
}
check('every note of every composition is in its scale, in all six scales (pentatonics snap)', outOfKey === 0);
check('…between 55 and 1100 Hz', outOfRange === 0);
check('…and the same notes every time (no random keys)', !differs);
check('a tab plays its own note', M.renderComposition(D, 'tab', { index: 0 })[0].midi !== M.renderComposition(D, 'tab', { index: 3 })[0].midi);
check('a design missing parts still plays (filled from the defaults)', M.normalizeDesign({ scale: 'phrygian', instruments: { bell: { level: 0.1 } } }).instruments.bell.level === 0.1
  && M.normalizeDesign({}).instruments.pad.body === 'pad' && M.renderComposition({ scale: 'nope' }, 'tick').length === 1);

// on a stand-in WebAudio
{
  const made = { osc: 0 };
  const param = () => ({ value: 0, setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){}, setTargetAtTime(){} });
  const node = extra => ({ connect(){}, disconnect(){}, ...extra });
  class AC { constructor(){ this.state = 'running'; this.currentTime = 0; this.sampleRate = 48000; this.destination = node(); }
    createGain(){ return node({ gain: param() }); }
    createOscillator(){ made.osc++; return node({ type: '', frequency: param(), start(){}, stop(){} }); }
    createBiquadFilter(){ return node({ type: '', frequency: param(), Q: param() }); }
    createWaveShaper(){ return node({ curve: null, oversample: '' }); }
    createConvolver(){ return node({ buffer: null }); }
    createBuffer(c, n){ return { getChannelData: () => new Float32Array(n) }; }
    createAnalyser(){ return node({ fftSize: 0, smoothingTimeConstant: 0 }); }
    createDynamicsCompressor(){ return node({ threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() }); }
    resume(){} }
  globalThis.window = { AudioContext: AC, addEventListener(){} };
  const m = M.createMurmur({ enabled: false });
  m.play('saveImage');
  check('silent while off', made.osc === 0);
  m.setEnabled(true); m.play('saveImage');
  check('plays once on', made.osc > 0);
  let before = made.osc; m.play('saveImage');
  check('the same sound twice within 40 ms plays once', made.osc === before);
  before = made.osc; m.play('checkbox');
  check('a silent function makes nothing', made.osc === before);
  m.setDesign({ ...D, map: { ...D.map, checkbox: 'tick' } }); m.play('checkbox');
  check('…until the design gives it a composition', made.osc > before);
  check('volume clamps to 0–1', (m.setVolume(3), m.volume === 1) && (m.setVolume(-1), m.volume === 0));
  delete globalThis.window;
}

// in Vellum
const app = UI_FILES.map(src).join('\n'), html = src('index.html');
const used = new Set([...app.matchAll(/murmur\.play\('(\w+)'[),]/g)].map(x => x[1]).concat([...html.matchAll(/data-sound="(\w+)"/g)].map(x => x[1])));
check('Vellum names only UI functions the design knows', [...used].every(k => ids.has(k)) && used.size >= 12);
check('Esoterica → Appearance has its switch and volume, off by default', /id="soundToggle"(?![^>]*checked)/.test(html) && html.includes('id="soundVolume"'));
check('the Murmur Studio carries this very engine (node tools/make-murmur-studio.mjs after changing murmur.js)',
  src('tools/murmur-studio.html').includes(src('murmur.js').replace(/^export /gm, '')));

// ---- the switch and the volume are this browser's, never a look's (booted, with a browser's storage in memory) ----
{ const store = new Map([['uv.firstvisit.v1', '1']]);
  globalThis.localStorage = { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  installCanvasMock(); const reg = installDomMock(makeMockContext, makeMockCanvas);
  await import('../appEvents.js');
  const box = reg['soundToggle'], vol = reg['soundVolume'];
  box.checked = true; box.dispatchEvent({ type: 'change', target: box });
  vol.value = '70'; vol.dispatchEvent({ type: 'input', target: vol });
  reg['advancedRefreshBtn'].dispatchEvent({ type: 'click' });
  const look = JSON.parse(reg['advancedJson'].value);
  check('kept in this browser (uv.sound.on, uv.sound.volume), never in a look',
    store.get('uv.sound.on') === '1' && store.get('uv.sound.volume') === '0.7' && !Object.keys(look).some(k => /sound|volume/i.test(k))); }

done();
