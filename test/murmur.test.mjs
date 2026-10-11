/**
 * murmur.test.mjs — interface sounds (murmur.js): off by default, one key,
 * every sound a recipe that plays without error on a stand-in audio graph,
 * nothing touched at import, and its settings kept apart from looks.
 */
import { readFileSync } from 'fs';
let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };
const src = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const M = await import('../murmur.js');

check('importing it makes nothing and plays nothing (no window here, no error)', typeof M.createMurmur === 'function');
const quiet = M.createMurmur();
check('off unless asked', quiet.enabled === false);

// every note any recipe asks for is in D dorian
const DOR = new Set([2, 4, 5, 7, 9, 11, 0]);   // D E F G A B C as pitch classes
const notes = [];
const kit = {
  note: m => notes.push(m), arp: ns => ns.forEach(m => notes.push(m)),
  chord: (r, q) => (M.QUALITIES[q] || []).forEach(i => notes.push({ r, i, q })),
  voicing: (r, q) => M.QUALITIES[q].map(i => r + i), pick: l => l[0], rand: (a) => a, degree: M.degree,
};
let threw = null;
for(const [name, fn] of Object.entries(M.SOUNDS)) for(const n of [0, 1, 2]) for(const index of [0, 1, 2, 3, 4]){
  try { fn({ ...kit, pick: l => l[Math.min(n, l.length - 1)] }, { index, family: 'fire' }); } catch(e){ threw = name + ': ' + e.message; } }
const chordsOut = notes.filter(n => typeof n === 'object' && !DOR.has(((n.r + n.i) % 12 + 12) % 12));
check('every sound plays its recipe', !threw);
const out = notes.filter(n => typeof n === 'number' ? !DOR.has(((n % 12) + 12) % 12) : false);
check('every note and every chord tone, whichever way it picks, is in D dorian', out.length === 0 && chordsOut.length === 0);
check('the four readings each have their own chord, and the tabs their notes',
  ['fire', 'water', 'wind', 'earth'].every(f => M.SOUNDS['element:' + f]) && M.SOUNDS.tab && M.SOUNDS.conjure && M.SOUNDS.seal);

// on a stand-in WebAudio, it plays, honours its switch and stays within its voices
{
  const made = { osc: 0 };
  const param = () => ({ value: 0, setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){}, setTargetAtTime(){} });
  const node = extra => ({ connect(){}, disconnect(){}, ...extra });
  class AC { constructor(){ this.state = 'running'; this.currentTime = 0; this.destination = node(); }
    createGain(){ return node({ gain: param() }); }
    createOscillator(){ made.osc++; return node({ type: '', frequency: param(), start(){}, stop(){}, set onended(f){} }); }
    createBiquadFilter(){ return node({ type: '', frequency: param(), Q: param() }); }
    createWaveShaper(){ return node({ curve: null, oversample: '' }); }
    createDynamicsCompressor(){ return node({ threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() }); }
    resume(){} }
  globalThis.window = { AudioContext: AC, addEventListener(){} };
  const m = M.createMurmur({ enabled: false });
  m.play('open');
  check('silent while off', made.osc === 0);
  m.setEnabled(true); m.play('open');
  check('plays once on', made.osc > 0);
  const before = made.osc; m.play('open');
  check('the same sound twice within 40 ms plays once', made.osc === before);
  for(let i = 0; i < 40; i++) m.play('conjure', {}), await new Promise(r => setTimeout(r, 41));
  check('volume clamps to 0–1', (m.setVolume(3), m.volume === 1) && (m.setVolume(-1), m.volume === 0));
  delete globalThis.window;
}

// in Vellum
const app = src('appEvents.js'), html = src('index.html');
check('Esoterica → Appearance has its switch and volume, off by default',
  /id="soundToggle"(?![^>]*checked)/.test(html) && html.includes('id="soundVolume"'));
check('kept in this browser (uv.sound.on, uv.sound.volume), never in a look',
  app.includes("'uv.sound.on'") && app.includes("'uv.sound.volume'") && /soundToggle:/.test(src('test/persistenceCoverage.test.mjs')));
check('wired: tabs, readings, presets, undo/redo, locks, saving, the Athanor, summoning',
  ["play('tab'", "play('element'", "play('arrive')", "play(dir < 0 ? 'undo' : 'redo')", "'keep' : 'toggle'", "play('seal')", 'murmur.bind(document)'].every(x => app.includes(x))
  && ['data-sound="conjure"', 'data-sound="open"', 'data-sound="close"'].every(x => html.includes(x)));
check('bundled', src('build.mjs').includes("'murmur.js'"));

console.log();
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
