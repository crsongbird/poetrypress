/* ============================================================
   murmur.js — soft, ethereal interface sounds, synthesized.
   The engine Symbology uses (the project's sister app), with a set of
   sounds written for Vellum. OFF until it is turned on (Esoterica →
   Appearance → Sounds); its switch and volume are the person's own,
   kept in this browser, never in a look.

   ONE VOICE, so the sounds belong together:
   - one key, D dorian: anything that overlaps agrees
   - three instruments, each with one job —
       glass  the interface: taps, tabs, toggles, choices
       pad    the ground: things opening and closing, settling
       bell   arrivals: a look applied, an image saved, a spell kept
   - one gesture each way: OPENING rises a fifth over a lifted chord;
     CLOSING falls a fourth and is left suspended; ARRIVING lands on
     home, D with its fifth, under a bell
   - the four readings are the Chroma's chords (as in Symbology):
     Fire a bright major, Water a minor, Wind an open sus2, Earth a fifth
   - levels in three steps only: touches 0.28, ground 0.24, arrivals 0.3

   Rules the engine keeps: mono; fundamentals 105–1100 Hz, overtones
   filtered above 2.6 kHz; attacks never under 6 ms; notes, voicings and
   levels drift a little each time; a sound repeated within 40 ms is
   skipped; at most sixteen voices; a soft limiter on the sum; silent
   until the page has been touched.

     const murmur = createMurmur({ volume: 0.4, enabled: false });
     murmur.play('open'); murmur.play('element', { family: 'fire' });
     murmur.bind(document);       // <details>, <select>s, checkboxes, [data-sound]
   ============================================================ */

const LOW_HZ = 105, HIGH_HZ = 1100;     // guard rails for every fundamental
const PEAK = 0.06;                      // one voice at full volume, before the limiter
const MAX_VOICES = 16;
const REPEAT_MS = 40;

/* D dorian, as MIDI note numbers: D E F G A B C */
const M_DORIAN = [0, 2, 3, 5, 7, 9, 10];
export const MURMUR_KEY = 50;                  // D3
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
export const QUALITIES = {
  maj: [0, 4, 7], min: [0, 3, 7], sus2: [0, 2, 7], sus4: [0, 5, 7],
  add9: [0, 4, 7, 14], madd9: [0, 3, 7, 14], maj7: [0, 4, 7, 11], min7: [0, 3, 7, 10],
  fifth: [0, 7, 12], quartal: [0, 5, 10], cluster: [0, 2, 3, 7, 14], maj9: [0, 4, 7, 11, 14],
};
/* a scale degree (0 = D, may be negative or past 7) to MIDI */
export const degree = (d, base = MURMUR_KEY) => base + 12 * Math.floor(d / 7) + M_DORIAN[((d % 7) + 7) % 7];

/* the three levels, and home */
const M_TOUCH = 0.28, M_GROUND = 0.24, M_ARRIVE = 0.3;
const M_HOME = degree(0);

/* ---------- Vellum's sounds ----------
   Each is a function of (m, opts); m offers note(), chord(), arp(),
   voicing(), pick() and rand(); times are seconds from now. */
export const SOUNDS = {
  /* touches: the interface, in glass */
  tap:     m => m.note(m.pick([degree(9), degree(11), degree(12)]), { inst:'glass', level:M_TOUCH, dur:0.45 }),
  toggle:  m => m.note(m.pick([degree(11), degree(12), degree(14)]), { inst:'glass', level:M_TOUCH*0.85, dur:0.35 }),
  select:  m => { const r = m.pick([degree(7), degree(9), degree(10)]); m.arp([r, r + 7], { inst:'glass', level:M_TOUCH, gap:0.05, dur:0.4 }); },
  // five tabs, five notes of the pentatonic within the key, each over a breath of home
  tab:     (m, o) => { const d = [7, 9, 10, 11, 14][(o && o.index) || 0] ?? 7;
                       m.note(degree(d), { inst:'glass', level:M_TOUCH, dur:0.5 }); m.note(M_HOME, { inst:'pad', level:M_GROUND*0.5, dur:0.6 }); },

  /* opening and closing: the ground moves */
  open:    m => { const r = m.pick([degree(2), degree(3)]);                                // F and G: the key's own major chords
                  m.chord(r, m.pick(['add9', 'sus2']), { inst:'pad', level:M_GROUND, strum:0.04, dir:'up', dur:0.9 });
                  m.arp([r + 12, r + 19], { inst:'glass', level:M_TOUCH*0.7, gap:0.09, at:0.1 }); },          // the rising fifth
  close:   m => { const r = m.pick([degree(3), degree(4)]);
                  m.arp([r + 12, r + 7], { inst:'glass', level:M_TOUCH*0.6, gap:0.09 });                     // the falling fourth…
                  m.chord(r - 7, 'sus4', { inst:'pad', level:M_GROUND*0.9, strum:0.05, dir:'down', dur:0.8, at:0.06 }); },   // …left suspended
  unfold:  m => { const r = m.pick([degree(7), degree(9)]); m.arp([r, r + 7], { inst:'glass', level:M_TOUCH*0.8, gap:0.07 }); m.note(r - 12, { inst:'pad', level:M_GROUND*0.5, dur:0.6 }); },
  fold:    m => { const r = m.pick([degree(7), degree(8)]); m.arp([r + 5, r], { inst:'glass', level:M_TOUCH*0.7, gap:0.07 }); },

  /* arrivals: they land on home, under a bell */
  arrive:  m => { m.chord(M_HOME, 'fifth', { inst:'pad', level:M_GROUND, dur:1.0 }); m.arp(m.voicing(degree(7), 'madd9'), { inst:'bell', level:M_ARRIVE*0.8, gap:0.06, at:0.04 }); },
  keep:    m => { m.arp([degree(7), degree(9), degree(11), degree(14)], { inst:'bell', level:M_ARRIVE, gap:0.07 }); m.chord(M_HOME, 'fifth', { inst:'pad', level:M_GROUND*0.7, at:0.22, dur:0.9 }); },
  seal:    m => { m.chord(degree(9), 'sus2', { inst:'glass', level:M_TOUCH*0.8, strum:0.05, dir:'up', dur:0.7 });   // a build…
                  m.note(degree(14), { inst:'bell', level:M_ARRIVE, at:0.28 });
                  m.chord(M_HOME, 'fifth', { inst:'pad', level:M_GROUND, at:0.32, dur:1.3 }); },                       // …and home

  /* magic: a turbulent shimmer that builds, then the same home */
  conjure: m => { const r = m.pick([degree(7), degree(11)]);
                  m.chord(r, m.pick(['cluster', 'quartal']), { inst:'glass', level:M_TOUCH*0.8, strum:0.045, dir:'up', dur:0.8 });
                  m.arp([r + 12, r + 14, r + 19], { inst:'bell', level:M_ARRIVE*0.55, gap:0.06, at:0.2 });
                  m.chord(M_HOME, 'fifth', { inst:'pad', level:M_GROUND, at:0.44, dur:1.2 }); },

  /* the four readings: the Chroma's chords */
  element:          m => SOUNDS['element:earth'](m),
  'element:fire':   m => { m.chord(degree(2), 'maj', { inst:'bell', level:M_ARRIVE*0.85, strum:0.03, dir:'up' }); m.note(degree(2) - 12, { inst:'pad', level:M_GROUND*0.6, dur:0.8 }); },
  'element:water':  m => m.chord(degree(4), 'madd9', { inst:'pad', level:M_GROUND, strum:0.05, dir:'down', dur:1.0 }),
  'element:wind':   m => { m.chord(degree(3), 'sus2', { inst:'glass', level:M_TOUCH, strum:0.06, dir:'up', dur:0.8 }); m.note(degree(17), { inst:'glass', level:M_TOUCH*0.5, at:0.22 }); },
  'element:earth':  m => { m.chord(M_HOME, 'fifth', { inst:'pad', level:M_GROUND*1.1, strum:0.02, dur:1.0 }); m.note(M_HOME + 12, { inst:'bell', level:M_ARRIVE*0.6, at:0.05 }); },

  /* going back, and the one that says no */
  undo:    m => m.arp([degree(11), degree(9)], { inst:'glass', level:M_TOUCH*0.8, gap:0.06 }),
  redo:    m => m.arp([degree(9), degree(11)], { inst:'glass', level:M_TOUCH*0.8, gap:0.06 }),
  error:   m => m.arp([degree(4), degree(3)], { inst:'pad', level:M_GROUND, gap:0.12, dur:0.6 }),
};

export function createMurmur({ volume = 0.4, enabled = false, sounds = SOUNDS } = {}){
  let ctx = null, out = null, master = null, voices = 0;
  let vol = murmurClamp(volume, 0, 1), on = !!enabled;
  const lastTime = new Map(), lastPick = new Map();
  const hasWindow = typeof window !== 'undefined';

  function ensure(){
    if(ctx) return ctx;
    const AC = hasWindow && (window.AudioContext || window.webkitAudioContext);
    if(!AC) return null;
    ctx = new AC();
    // voices → warmth → low-pass → limiter → master → out
    const warmth = ctx.createWaveShaper(); warmth.curve = softCurve(1.4); warmth.oversample = '2x';
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.Q.value = 0.4;
    const limit = ctx.createDynamicsCompressor();
    limit.threshold.value = -28; limit.knee.value = 18; limit.ratio.value = 8; limit.attack.value = 0.004; limit.release.value = 0.3;
    master = ctx.createGain(); master.gain.value = vol * 0.9;
    warmth.connect(lp); lp.connect(limit); limit.connect(master); master.connect(ctx.destination);
    out = warmth;
    return ctx;
  }
  // nothing is made until it is on and the page has been touched
  const wake = () => { if(!on) return; const c = ensure(); if(c && c.state === 'suspended') c.resume(); };
  if(hasWindow && window.addEventListener) ['pointerdown', 'keydown', 'touchstart'].forEach(t => window.addEventListener(t, wake, { capture: true, passive: true }));

  const rand = (a, b) => a + Math.random() * (b - a);
  function pick(list, key){
    if(list.length < 2) return list[0];
    const prev = key ? lastPick.get(key) : undefined;
    const choices = list.filter(x => x !== prev);
    const v = choices[Math.floor(Math.random() * choices.length)];
    if(key) lastPick.set(key, v);
    return v;
  }

  /* one voice of one instrument */
  function voice(midi, { inst = 'bell', level = 0.3, at = 0, dur } = {}){
    if(!ctx || voices >= MAX_VOICES) return;
    while(mtof(midi) < LOW_HZ) midi += 12;
    while(mtof(midi) > HIGH_HZ) midi -= 12;
    const f = mtof(midi) * Math.pow(2, rand(-6, 6) / 1200);
    const t0 = ctx.currentTime + 0.01 + Math.max(0, at);
    const L = PEAK * level * rand(0.88, 1.08);
    const g = ctx.createGain(); g.connect(out);
    const parts = [];                                      // [ratio, level, pitch-fall]
    let attack, decay, sustain = 0, hold = 0;
    switch(inst){
      case 'glass': attack = 0.018; decay = dur ?? rand(0.6, 0.85); parts.push([1, 1, 1], [2, 0.07, 1]); break;
      case 'pad':   attack = rand(0.12, 0.18); hold = (dur ?? 0.8) * 0.35; decay = (dur ?? 0.8); sustain = 0.7; parts.push([1, 0.55, 1], [1.003, 0.45, 1]); break;
      case 'pluck': attack = 0.006; decay = dur ?? rand(0.3, 0.42); parts.push([1, 1, 1.018], [2, 0.12, 1.01]); break;
      default:      attack = 0.008; decay = dur ?? rand(0.75, 1.0); parts.push([1, 1, 1], [2.76, 0.06, 1], [5.4, 0.012, 1]); // bell
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(L, t0 + attack);
    if(sustain){ g.gain.setValueAtTime(L, t0 + attack); g.gain.linearRampToValueAtTime(L * sustain, t0 + attack + hold); }
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + decay);
    const tEnd = t0 + attack + hold + decay + 0.05;
    let first = null;
    for(const [ratio, amt, fall] of parts){
      const o = ctx.createOscillator(); o.type = 'sine';
      const pf = Math.min(f * ratio, 2600);
      o.frequency.setValueAtTime(pf * fall, t0);
      if(fall !== 1) o.frequency.exponentialRampToValueAtTime(pf, t0 + 0.03);
      const pg = ctx.createGain(); pg.gain.value = amt;
      o.connect(pg); pg.connect(g);
      if(inst === 'glass' && ratio === 1){                 // a slow shimmer: ±4 cents at ~5 Hz
        const lfo = ctx.createOscillator(), depth = ctx.createGain();
        lfo.frequency.value = rand(4.5, 5.5); depth.gain.value = pf * 0.0023;
        lfo.connect(depth); depth.connect(o.frequency); lfo.start(t0); lfo.stop(tEnd);
      }
      o.start(t0); o.stop(tEnd);
      if(!first) first = o;
    }
    voices++;
    first.onended = () => { voices--; try { g.disconnect(); } catch(e){} };
  }
  function voicing(root, quality){
    const iv = QUALITIES[quality] || QUALITIES.maj;
    let notes = iv.map(i => root + i);
    if(Math.random() < 0.35 && notes.length > 2) notes = notes.slice(1).concat(notes[0] + 12);   // an inversion, sometimes
    return notes;
  }
  function chord(root, quality = 'maj', { inst = 'pad', level = 0.3, strum = 0.03, dir = 'up', at = 0, dur } = {}){
    let notes = voicing(root, quality);
    if(dir === 'down') notes = notes.slice().reverse();
    const each = level / Math.sqrt(notes.length);          // a chord is no louder than a note
    notes.forEach((n, i) => voice(n, { inst, level: each, at: at + i * strum * rand(0.85, 1.15), dur }));
  }
  function arp(notes, { inst = 'bell', level = 0.3, gap = 0.06, at = 0, dur } = {}){
    notes.forEach((n, i) => voice(n, { inst, level: level * (1 - i * 0.06), at: at + i * gap * rand(0.88, 1.12), dur }));
  }
  const kit = { note: voice, chord, arp, voicing, rand, degree };

  function play(name, opts = {}){
    if(!on || vol <= 0) return;
    const key = opts.family ? `${name}:${opts.family}` : name;
    const recipe = sounds[key] || sounds[name]; if(!recipe) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if(now - (lastTime.get(name) || 0) < REPEAT_MS) return;
    lastTime.set(name, now);
    const c = ensure(); if(!c || c.state !== 'running') return;
    recipe({ ...kit, pick: l => pick(l, key) }, opts);
  }

  /* opt-in wiring: [data-sound="name"] on anything clickable (with an
     optional data-sound-family), <details> folding, <select>s changing and
     checkboxes ticking. Anything marked data-sound-off stays silent. */
  function bind(root = document, { details = true, selects = true, checks = true, attr = 'data-sound' } = {}){
    const quiet = el => el && el.closest && el.closest(`[${attr}-off]`);
    const onClick = e => { const el = e.target.closest && e.target.closest(`[${attr}]`); if(el && root.contains(el) && !quiet(el)) play(el.getAttribute(attr), { family: el.getAttribute(attr + '-family') || undefined }); };
    const onToggle = e => { if(details && e.target.tagName === 'DETAILS' && !quiet(e.target)) play(e.target.open ? 'unfold' : 'fold'); };
    const onChange = e => { const t = e.target; if(quiet(t)) return;
      if(selects && t.tagName === 'SELECT') play('select');
      else if(checks && t.type === 'checkbox') play('toggle'); };
    root.addEventListener('click', onClick);
    root.addEventListener('toggle', onToggle, true);
    root.addEventListener('change', onChange);
    return () => { root.removeEventListener('click', onClick); root.removeEventListener('toggle', onToggle, true); root.removeEventListener('change', onChange); };
  }

  return {
    play, bind,
    setVolume(v){ vol = murmurClamp(+v, 0, 1); if(master && ctx) master.gain.setTargetAtTime(vol * 0.9, ctx.currentTime, 0.05); },
    setEnabled(v){ on = !!v; if(on) wake(); },
    get volume(){ return vol; },
    get enabled(){ return on; },
    names: Object.keys(sounds),
  };
}

function murmurClamp(v, a, b){ return Math.min(b, Math.max(a, v)); }
/* tanh, normalised: a little warmth at the top, nothing that buzzes */
function softCurve(k){
  const n = 1024, c = new Float32Array(n), norm = Math.tanh(k);
  for(let i = 0; i < n; i++){ const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(k * x) / norm; }
  return c;
}
