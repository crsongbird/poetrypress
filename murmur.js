/* ============================================================
   murmur.js — soft interface sounds, synthesized from a SOUND DESIGN.
   OFF until it is turned on (Esoterica → Appearance → Sounds); its switch
   and volume are the person's own, kept in this browser, never in a look.

   Everything the sounds are is DATA (MURMUR_DESIGN, below), so it can be
   shaped by ear in the Murmur Studio and pasted back here:
     scale        the notes everything is drawn from (home is D)
     octave       where home sits (−1: D2, 0: D3)
     room         a little air around the sounds (0–100)
     warmth       gentle saturation (0–100; 0 is clean)
     humanize     small drifts in time and level (0–100; never in pitch)
     instruments  five voices: a body (its partials), level, attack, decay,
                  sustain, brightness, shimmer, octave, pitch drop
     compositions named little phrases, each a list of events:
                  { inst, kind: note | together | arp | chord | index,
                    notes: [scale degrees], shape (chords), at, gap, level, dir }
                  degrees: 0 is home, 7 the octave above, 2 the third, 4 the fifth
     map          which composition each UI function plays (null: silent)

   The same notes every time: nothing is chosen at random but a little
   timing and level (humanize). Pitches stay inside the scale, and between
   55 and 1100 Hz. A sound repeated within 40 ms plays once; at most 24
   voices; a soft limiter on the sum.

     const murmur = createMurmur({ volume: 0.4, enabled: false });
     murmur.play('saveImage'); murmur.play('tab', { index: 2 });
     murmur.bind(document);      // [data-sound="<ui function>"], <details>, <select>s, checkboxes
   ============================================================ */

/* the scales: seven steps from D (a pentatonic SNAPS each step to its own notes) */
export const MURMUR_SCALES = {
  aeolian:   { name: 'Aeolian',          steps: [0, 2, 3, 5, 7, 8, 10], say: 'Natural minor: wistful, warm.' },
  dorian:    { name: 'Dorian',           steps: [0, 2, 3, 5, 7, 9, 10], say: 'Minor with a bright sixth: folk-like.' },
  phrygian:  { name: 'Phrygian',         steps: [0, 1, 3, 5, 7, 8, 10], say: 'Minor with a flat second: dark, ritual.' },
  ionian:    { name: 'Major',            steps: [0, 2, 4, 5, 7, 9, 11], say: 'Plain major: open, sunny.' },
  minorPent: { name: 'Minor pentatonic', steps: [0, 2, 3, 5, 7, 8, 10], snap: [0, 3, 5, 7, 10], say: 'Five notes, no half steps: nothing can clash.' },
  majorPent: { name: 'Major pentatonic', steps: [0, 2, 4, 5, 7, 9, 11], snap: [0, 2, 4, 7, 9], say: 'Five notes, bright and calm: chimes.' },
};
/* chord shapes, in DEGREES of the scale (so a chord is always in key) */
export const MURMUR_SHAPES = { triad: [0, 2, 4], sus2: [0, 1, 4], sus4: [0, 3, 4], add9: [0, 2, 4, 8], fifth: [0, 4, 7], octave: [0, 7], sixth: [0, 2, 5] };
/* bodies: the partials of real things — [ratio, amount, share of the decay] */
export const MURMUR_BODIES = {
  bell:  { name: 'Tuned bell',  parts: [[0.5, 0.30, 1.5], [1, 0.60, 1], [1.19, 0.28, 0.75], [1.5, 0.15, 0.6], [2, 0.40, 0.5], [2.66, 0.09, 0.3], [4.05, 0.035, 0.18]] },
  glass: { name: 'Struck glass', parts: [[1, 1, 1], [2.32, 0.06, 0.6], [4.25, 0.015, 0.35]] },
  pad:   { name: 'Soft breath',  parts: [[1, 0.62, 1], [2, 0.14, 1], [3, 0.05, 1], [4, 0.018, 1]] },
  bar:   { name: 'Wooden bar',   parts: [[1, 1, 1], [3.99, 0.12, 0.35], [10.0, 0.02, 0.15]] },
  tine:  { name: 'Music-box tine', parts: [[1, 1, 1], [6.27, 0.05, 0.3], [17.55, 0.008, 0.1]] },
  sine:  { name: 'Pure tone',    parts: [[1, 1, 1]] },
};
/* the UI functions that can have a sound, as Vellum names them */
export const MURMUR_FUNCTIONS = [
  { id: 'tab',            group: 'Moving around', label: 'Change tab',             where: 'The five tabs (each its own note)' },
  { id: 'cardOpen',       group: 'Moving around', label: 'Open a card',            where: 'A folded section' },
  { id: 'cardFold',       group: 'Moving around', label: 'Fold a card',            where: 'A folded section' },
  { id: 'checkbox',       group: 'Settings',      label: 'Tick a checkbox',        where: 'Any checkbox' },
  { id: 'select',         group: 'Settings',      label: 'Choose from a menu',     where: 'Any drop-down' },
  { id: 'lock',           group: 'Settings',      label: 'Lock a setting',         where: 'The padlock beside a control' },
  { id: 'unlock',         group: 'Settings',      label: 'Unlock a setting',       where: 'The padlock beside a control' },
  { id: 'dialRandom',     group: 'Settings',      label: 'Random light angle',     where: 'The dial’s ⚄' },
  { id: 'soundOn',        group: 'Settings',      label: 'Turn sounds on',         where: 'Appearance → Sounds' },
  { id: 'preset',         group: 'Looks',         label: 'Apply a preset',         where: 'Rituals' },
  { id: 'reroll',         group: 'Looks',         label: 'Reroll the seed',        where: 'The moon beside the seed' },
  { id: 'summonType',     group: 'Looks',         label: 'Summon a typeface',      where: 'Inscription' },
  { id: 'summonBackdrop', group: 'Looks',         label: 'Summon a backdrop',      where: 'Materia' },
  { id: 'readingFire',    group: 'Looks',         label: '🜂 Fire reading',        where: 'Under Surface Variant' },
  { id: 'readingWater',   group: 'Looks',         label: '🜄 Water reading',       where: 'Under Surface Variant' },
  { id: 'readingWind',    group: 'Looks',         label: '🜁 Wind reading',        where: 'Under Surface Variant' },
  { id: 'readingEarth',   group: 'Looks',         label: '🜃 Earth reading',       where: 'Under Surface Variant' },
  { id: 'spellCreate',    group: 'Keeping',       label: 'Create a spell',         where: 'Spellcrafting' },
  { id: 'spellApply',     group: 'Keeping',       label: 'Invoke a spell',         where: 'Spellcrafting' },
  { id: 'spellShare',     group: 'Keeping',       label: 'Share a spell',          where: 'Spellcrafting' },
  { id: 'spellDissolve',  group: 'Keeping',       label: 'Dissolve a spell',       where: 'Spellcrafting' },
  { id: 'poemRecord',     group: 'Keeping',       label: 'Record a poem',          where: 'The Grimoire' },
  { id: 'saveImage',      group: 'Keeping',       label: 'Save image',             where: 'The Save image button' },
  { id: 'athanorOpen',    group: 'The Athanor',   label: 'Open the Athanor',       where: 'Esoterica' },
  { id: 'athanorClose',   group: 'The Athanor',   label: 'Close the Athanor',      where: 'Its Done button' },
  { id: 'nodeAdd',        group: 'The Athanor',   label: 'Add a node',             where: 'The palette' },
  { id: 'nodeRemove',     group: 'The Athanor',   label: 'Remove a node',          where: 'Delete, or its ✕' },
  { id: 'wireConnect',    group: 'The Athanor',   label: 'Connect a wire',         where: 'Port to port' },
  { id: 'wireDisconnect', group: 'The Athanor',   label: 'Cut a wire',             where: 'A wire’s ✕' },
  { id: 'graphLoad',      group: 'The Athanor',   label: 'Load a graph',           where: 'Open, Revert' },
  { id: 'confirm',        group: 'Asking',        label: 'Are you sure?',          where: 'Before something undoes your work' },
  { id: 'hardNo',         group: 'Asking',        label: 'That can’t be done',     where: 'Something that would break the page, refused' },
  { id: 'blocked',        group: 'Asking',        label: 'A switched-off control', where: 'Pressing what is off' },
  { id: 'undo',           group: 'History',       label: 'Undo',                   where: '↶ or Ctrl+Z' },
  { id: 'redo',           group: 'History',       label: 'Redo',                   where: '↷ or Ctrl+Shift+Z' },
  { id: 'nothingToUndo',  group: 'History',       label: 'Nothing left to undo',   where: '↶ at the start' },
];

/* Vellum's sounds: very plain, in one minor key (Aeolian, home D2), and few.
   They mark what takes a while, what changes a lot, and what needs you:
   saving, a look arriving, keeping, the Athanor's machinery, a question
   (the SOFT NO), a refusal (the HARD NO), a switched-off control (a hollow
   knock). Most settings are silent. */
export const MURMUR_DESIGN = {
  v: 2, scale: 'aeolian', octave: -1, room: 18, warmth: 10, humanize: 15,
  instruments: {
    glass: { name: 'Glass', body: 'glass', level: 0.5,  attack: 0.014, decay: 0.6,  sustain: 0,   bright: 0.35, shimmer: 0.2,  octave: 0, drop: 0 },
    bell:  { name: 'Bell',  body: 'bell',  level: 0.16, attack: 0.006, decay: 2.2,  sustain: 0,   bright: 0.25, shimmer: 0.2,  octave: 0, drop: 0 },
    pad:   { name: 'Pad',   body: 'pad',   level: 0.5,  attack: 0.16,  decay: 1.0,  sustain: 0.7, bright: 0.3,  shimmer: 0.3,  octave: 0, drop: 0 },
    tick:  { name: 'Tick',  body: 'bar',   level: 0.35, attack: 0.003, decay: 0.09, sustain: 0,   bright: 0.2,  shimmer: 0,    octave: 1, drop: 0.3 },
    tine:  { name: 'Tine',  body: 'tine',  level: 0.38, attack: 0.004, decay: 1.0,  sustain: 0,   bright: 0.3,  shimmer: 0.12, octave: 0, drop: 0 },
    thud:  { name: 'Knock', body: 'bar',   level: 0.6,  attack: 0.002, decay: 0.08, sustain: 0,   bright: 0.02, shimmer: 0,    octave: 0, drop: 0.6 },
  },
  compositions: {
    tick:     { name: 'Tick', events: [{ inst: 'tick', kind: 'note', notes: [7], at: 0, gap: 0, level: 0.5 }] },
    // the SOFT NO (Ruby's): a breath that steps down a half-step and stops — the question before undoing work
    confirm:  { name: 'A soft no', events: [{ inst: 'pad', kind: 'arp', notes: [2, 1], at: 0, gap: 0.12, level: 0.35 }] },
    // the HARD NO: two knocks, and the ground falls to home — final
    hardNo:   { name: 'A hard no', events: [
      { inst: 'thud', kind: 'arp', notes: [0, 0], at: 0, gap: 0.16, level: 0.8 },
      { inst: 'pad', kind: 'arp', notes: [1, 0], at: 0.04, gap: 0.16, level: 0.45 }] },
    blocked:  { name: 'A hollow knock', events: [{ inst: 'thud', kind: 'note', notes: [0], at: 0, gap: 0, level: 0.55 }] },
    done:     { name: 'Done', events: [
      { inst: 'tine', kind: 'arp', notes: [4, 7], at: 0, gap: 0.1, level: 0.45 },
      { inst: 'bell', kind: 'note', notes: [14], at: 0.18, gap: 0, level: 0.5 }] },
    arrive:   { name: 'A look arrives', events: [
      { inst: 'pad', kind: 'chord', notes: [0], shape: 'fifth', at: 0, gap: 0.02, level: 0.4 },
      { inst: 'tine', kind: 'note', notes: [9], at: 0.06, gap: 0, level: 0.35 }] },
    keep:     { name: 'Kept', events: [{ inst: 'tine', kind: 'arp', notes: [7, 9, 11], at: 0, gap: 0.08, level: 0.4 }] },
    summon:   { name: 'Summoned', events: [{ inst: 'glass', kind: 'arp', notes: [11, 9], at: 0, gap: 0.05, level: 0.3 }] },
    // the Athanor: a little machine, and a little spell
    open:     { name: 'The Athanor opens', events: [
      { inst: 'tick', kind: 'note', notes: [7], at: 0, gap: 0, level: 0.4 },
      { inst: 'glass', kind: 'arp', notes: [4, 7, 11], at: 0.04, gap: 0.06, level: 0.32 },
      { inst: 'pad', kind: 'note', notes: [0], at: 0.12, gap: 0, level: 0.3 }] },
    close:    { name: 'The Athanor closes', events: [
      { inst: 'glass', kind: 'arp', notes: [11, 7, 4], at: 0, gap: 0.06, level: 0.28 },
      { inst: 'tick', kind: 'note', notes: [0], at: 0.2, gap: 0, level: 0.4 }] },
    blipUp:   { name: 'Blip', events: [{ inst: 'tick', kind: 'note', notes: [11], at: 0, gap: 0, level: 0.35 }] },
    blipDown: { name: 'Low blip', events: [{ inst: 'tick', kind: 'note', notes: [4], at: 0, gap: 0, level: 0.3 }] },
    plugIn:   { name: 'Plugged in', events: [{ inst: 'glass', kind: 'arp', notes: [9, 11], at: 0, gap: 0.03, level: 0.25 }] },
    plugOut:  { name: 'Unplugged', events: [{ inst: 'glass', kind: 'arp', notes: [11, 9], at: 0, gap: 0.03, level: 0.2 }] },
    lit:      { name: 'A graph lit', events: [{ inst: 'tine', kind: 'arp', notes: [0, 4, 7], at: 0, gap: 0.07, level: 0.35 }] },
    tab:      { name: 'Tab note', events: [{ inst: 'glass', kind: 'index', notes: [7, 9, 11, 12, 14], at: 0, gap: 0, level: 0.35 }] },
    fire:     { name: 'Fire', events: [{ inst: 'tine', kind: 'note', notes: [9], at: 0, gap: 0, level: 0.35 }] },
    water:    { name: 'Water', events: [{ inst: 'tine', kind: 'note', notes: [11], at: 0, gap: 0, level: 0.35 }] },
    wind:     { name: 'Wind', events: [{ inst: 'tine', kind: 'note', notes: [13], at: 0, gap: 0, level: 0.35 }] },
    earth:    { name: 'Earth', events: [{ inst: 'tine', kind: 'note', notes: [7], at: 0, gap: 0, level: 0.35 }] },
  },
  map: {
    tab: null, cardOpen: null, cardFold: null, checkbox: null, select: null, lock: 'tick', unlock: 'tick', dialRandom: null, soundOn: 'arrive',
    preset: 'arrive', reroll: null, summonType: 'summon', summonBackdrop: 'summon',
    readingFire: null, readingWater: null, readingWind: null, readingEarth: null,
    spellCreate: 'keep', spellApply: 'arrive', spellShare: null, spellDissolve: null, poemRecord: 'keep', saveImage: 'done',
    athanorOpen: 'open', athanorClose: 'close', nodeAdd: 'blipUp', nodeRemove: 'blipDown', wireConnect: 'plugIn', wireDisconnect: 'plugOut', graphLoad: 'lit',
    confirm: 'confirm', hardNo: 'hardNo', blocked: 'blocked',
    undo: null, redo: null, nothingToUndo: 'blocked',
  },
};

const M_LOW_HZ = 55, M_HIGH_HZ = 1100, M_PEAK = 0.06, M_MAX_VOICES = 24, M_REPEAT_MS = 40;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const murmurClamp = (v, a, b) => Math.min(b, Math.max(a, v));
const M_PC = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
/** A MIDI note's name ("D2", "B♭3"). */
export const noteName = m => M_PC[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);

/** A design made whole: anything missing taken from the defaults (old or hand-edited designs still play). */
export function normalizeDesign(d){
  const D = MURMUR_DESIGN, x = (d && typeof d === 'object') ? d : {};
  const insts = {};
  for(const k of Object.keys(D.instruments)) insts[k] = { ...D.instruments[k], ...((x.instruments || {})[k] || {}) };
  return {
    v: 1, scale: MURMUR_SCALES[x.scale] ? x.scale : D.scale,
    octave: Number.isFinite(+x.octave) ? murmurClamp(Math.round(+x.octave), -1, 1) : D.octave,
    room: Number.isFinite(+x.room) ? murmurClamp(+x.room, 0, 100) : D.room,
    warmth: Number.isFinite(+x.warmth) ? murmurClamp(+x.warmth, 0, 100) : D.warmth,
    humanize: Number.isFinite(+x.humanize) ? murmurClamp(+x.humanize, 0, 100) : D.humanize,
    instruments: insts,
    compositions: x.compositions && typeof x.compositions === 'object' ? x.compositions : D.compositions,
    map: { ...D.map, ...(x.map || {}) },
  };
}

/** A scale degree (0 home, 7 the octave above) as a MIDI note, for this design. */
export function degreeMidi(design, d, instOctave = 0){
  const S = MURMUR_SCALES[design.scale] || MURMUR_SCALES.aeolian, base = 50 + 12*((design.octave || 0) + (instOctave || 0));
  let s = S.steps[((d % 7) + 7) % 7];
  if(S.snap){ let best = S.snap[0], bd = 99; for(const p of S.snap){ const dd = Math.abs(p - s); if(dd < bd || (dd === bd && p < best)){ bd = dd; best = p; } } s = best; }
  return base + 12*Math.floor(d / 7) + s;
}

/**
 * A composition as the notes it plays — pure (no sound): [{ midi, inst, at, level }].
 * opts.index picks the note of an 'index' event (the tabs).
 */
export function renderComposition(design, id, opts = {}){
  const D = normalizeDesign(design), C = D.compositions[id];
  if(!C || !Array.isArray(C.events)) return [];
  const out = [];
  const push = (inst, d, at, level) => {
    const I = D.instruments[inst]; if(!I) return;
    let m = degreeMidi(D, d, I.octave);
    while(mtof(m) < M_LOW_HZ) m += 12;
    while(mtof(m) > M_HIGH_HZ) m -= 12;
    out.push({ midi: m, inst, at: Math.max(0, at), level: murmurClamp(level, 0, 1) });
  };
  for(const e of C.events){
    const notes = (Array.isArray(e.notes) ? e.notes : String(e.notes || '').split(/[\s,]+/)).map(Number).filter(Number.isFinite);
    if(!notes.length) continue;
    const at = +e.at || 0, gap = +e.gap || 0, level = Number.isFinite(+e.level) ? +e.level : 0.4;
    if(e.kind === 'index'){ push(e.inst, notes[((opts.index || 0) % notes.length + notes.length) % notes.length], at, level); continue; }
    let seq = e.kind === 'chord' ? (MURMUR_SHAPES[e.shape] || MURMUR_SHAPES.triad).map(x => notes[0] + x) : e.kind === 'note' ? [notes[0]] : notes.slice();
    if(e.dir === 'down') seq = seq.reverse();
    const lone = e.kind === 'arp';
    seq.forEach((d, i) => push(e.inst, d, at + i*gap, lone ? level*(1 - i*0.06) : level/Math.sqrt(seq.length)));
  }
  return out;
}

export function createMurmur({ volume = 0.4, enabled = false, design = MURMUR_DESIGN } = {}){
  let ctx = null, voices = 0, nodes = null;
  let vol = murmurClamp(volume, 0, 1), on = !!enabled, D = normalizeDesign(design);
  const lastTime = new Map(), listeners = new Set();
  const hasWindow = typeof window !== 'undefined';

  function ensure(){
    if(ctx) return ctx;
    const AC = hasWindow && (window.AudioContext || window.webkitAudioContext);
    if(!AC) return null;
    ctx = new AC();
    // voices → warmth → low-pass → (dry + room) → limiter → master → analyser → out
    const warm = ctx.createWaveShaper(); warm.oversample = '2x';
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.Q.value = 0.4;
    const dry = ctx.createGain(), wet = ctx.createGain(), room = ctx.createConvolver();
    room.buffer = roomImpulse(ctx, 1.8);
    const limit = ctx.createDynamicsCompressor();
    limit.threshold.value = -24; limit.knee.value = 18; limit.ratio.value = 6; limit.attack.value = 0.004; limit.release.value = 0.3;
    const master = ctx.createGain(); master.gain.value = vol * 0.9;
    const analyser = ctx.createAnalyser(); analyser.fftSize = 8192; analyser.smoothingTimeConstant = 0.55;
    warm.connect(lp); lp.connect(dry); lp.connect(room); room.connect(wet);
    dry.connect(limit); wet.connect(limit); limit.connect(master); master.connect(analyser); analyser.connect(ctx.destination);
    nodes = { warm, dry, wet, master, analyser };
    applyMix();
    return ctx;
  }
  function applyMix(){
    if(!nodes) return;
    nodes.warm.curve = softCurve(0.2 + D.warmth/100*1.4);
    nodes.wet.gain.value = D.room/100*0.45; nodes.dry.gain.value = 1 - D.room/100*0.25;
  }
  // nothing is made until it is on and the page has been touched
  const wake = () => { if(!on) return; const c = ensure(); if(c && c.state === 'suspended') c.resume(); };
  if(hasWindow && window.addEventListener) ['pointerdown', 'keydown', 'touchstart'].forEach(t => window.addEventListener(t, wake, { capture: true, passive: true }));
  const rand = (a, b) => a + Math.random() * (b - a);

  /* one voice: the instrument's body, shaped by its settings */
  function voice(n){
    const I = D.instruments[n.inst], B = I && MURMUR_BODIES[I.body]; if(!B || !ctx || voices >= M_MAX_VOICES) return;
    const h = D.humanize/100;
    const f = mtof(n.midi) * Math.pow(2, rand(-3, 3)*h/1200);
    const t0 = ctx.currentTime + 0.02 + n.at + rand(0, 0.012)*h;
    const L = M_PEAK * n.level * I.level * (1 + rand(-0.1, 0.06)*h);
    if(L <= 0) return;
    const bus = ctx.createGain(); bus.connect(nodes.warm);
    const atk = Math.max(0.003, +I.attack || 0.01), dec = Math.max(0.04, +I.decay || 0.5), sus = murmurClamp(+I.sustain || 0, 0, 1), hold = sus > 0 ? dec*0.35 : 0;
    let end = t0;
    for(const [r, a0, share] of B.parts){
      const pf = f*r; if(pf > 6000) continue;
      const a = r > 1 ? a0*(I.bright ?? 0.5)*2 : a0; if(a < 0.002) continue;
      const g = ctx.createGain(); g.connect(bus);
      g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(L*a, t0 + atk);
      let tt = t0 + atk;
      if(hold){ g.gain.linearRampToValueAtTime(L*a*sus, tt + hold); tt += hold; }
      const d = dec*share; g.gain.exponentialRampToValueAtTime(0.0001, tt + d);
      const stop = tt + d + 0.05; end = Math.max(end, stop);
      const o = ctx.createOscillator(); o.type = 'sine';
      // a struck thing starts a hair sharp and settles (drop)
      if(I.drop > 0){ o.frequency.setValueAtTime(pf*(1 + I.drop*0.03), t0); o.frequency.exponentialRampToValueAtTime(pf, t0 + 0.03); } else o.frequency.value = pf;
      o.connect(g); o.start(t0); o.stop(stop);
      // SHIMMER: a near-pair a fraction of a hertz apart (a body never perfectly round) — it beats, slowly
      if(I.shimmer > 0){ const g2 = ctx.createGain(); g2.gain.value = I.shimmer*0.25; g2.connect(g);
        const o2 = ctx.createOscillator(); o2.frequency.value = pf + rand(0.3, 0.9)*(0.7 + r*0.15); o2.connect(g2); o2.start(t0); o2.stop(stop); }
    }
    voices++;
    setTimeout(() => { voices--; try { bus.disconnect(); } catch(e){} }, Math.max(0, (end - ctx.currentTime)*1000 + 150));
  }
  function playNotes(list){
    const c = ensure(); if(!c) return list;
    // a context that is still waking (the first touch) plays as soon as it is up
    if(c.state !== 'running'){ if(c.resume) c.resume().then(() => list.forEach(voice)).catch(() => {}); }
    else list.forEach(voice);
    listeners.forEach(fn => { try { fn(list); } catch(e){} });
    return list;
  }

  /** A UI function's sound (its composition in the map; silent if none). */
  function play(fn, opts = {}){
    if(!on || vol <= 0) return [];
    const id = D.map[fn]; if(!id) return [];
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if(now - (lastTime.get(fn) || 0) < M_REPEAT_MS) return [];
    lastTime.set(fn, now);
    return playNotes(renderComposition(D, id, opts));
  }

  /* opt-in wiring: [data-sound="<ui function>"] on anything clickable, <details>
     folding (cardOpen / cardFold), <select>s (select) and checkboxes (checkbox).
     Anything marked data-sound-off stays silent. */
  function bind(root = document, { attr = 'data-sound' } = {}){
    const quiet = el => el && el.closest && el.closest(`[${attr}-off]`);
    const onClick = e => { const el = e.target.closest && e.target.closest(`[${attr}]`); if(el && root.contains(el) && !quiet(el)) play(el.getAttribute(attr)); };
    const onToggle = e => { if(e.target.tagName === 'DETAILS' && !quiet(e.target)) play(e.target.open ? 'cardOpen' : 'cardFold'); };
    const onChange = e => { const t = e.target; if(quiet(t)) return;
      if(t.tagName === 'SELECT') play('select'); else if(t.type === 'checkbox') play('checkbox'); };
    root.addEventListener('click', onClick);
    root.addEventListener('toggle', onToggle, true);
    root.addEventListener('change', onChange);
    return () => { root.removeEventListener('click', onClick); root.removeEventListener('toggle', onToggle, true); root.removeEventListener('change', onChange); };
  }

  return {
    play, bind,
    // the studio's: a composition or one instrument, heard whatever the map says
    playComposition(id, opts = {}){ return playNotes(renderComposition(D, id, opts)); },
    playInstrument(inst, kind = 'note'){ const list = kind === 'chord'
      ? renderComposition({ ...D, compositions: { t: { events: [{ inst, kind: 'chord', notes: [0], shape: 'triad', gap: 0.04, level: 0.6 }] } } }, 't')
      : renderComposition({ ...D, compositions: { t: { events: [{ inst, kind: 'note', notes: [7], level: 0.7 }] } } }, 't'); return playNotes(list); },
    setDesign(d){ D = normalizeDesign(d); applyMix(); },
    get design(){ return D; },
    onNotes(fn){ listeners.add(fn); return () => listeners.delete(fn); },
    get analyser(){ return nodes ? nodes.analyser : null; },
    get context(){ return ctx; },
    setVolume(v){ vol = murmurClamp(+v, 0, 1); if(nodes && ctx) nodes.master.gain.setTargetAtTime(vol * 0.9, ctx.currentTime, 0.05); },
    setEnabled(v){ on = !!v; if(on) wake(); },
    get volume(){ return vol; },
    get enabled(){ return on; },
  };
}

/* tanh, normalised: warmth at the top, nothing that buzzes */
function softCurve(k){
  const n = 1024, c = new Float32Array(n), norm = Math.tanh(k);
  for(let i = 0; i < n; i++){ const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(k * x) / norm; }
  return c;
}
/* a small room: soft noise, dying away (mono) */
function roomImpulse(ctx, seconds){
  const n = Math.round(ctx.sampleRate*seconds), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  let lp = 0;
  for(let i = 0; i < n; i++){ const t = i/n; lp = lp*0.6 + (Math.random()*2 - 1)*0.4; d[i] = lp*Math.pow(1 - t, 3)*(i < ctx.sampleRate*0.012 ? i/(ctx.sampleRate*0.012) : 1); }
  return b;
}
