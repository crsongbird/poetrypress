/**
 * textureFingerprints.test.mjs — refactors must not change what a texture draws.
 *
 * Every texture is rendered at three knob settings with a fixed seed, and its
 * drawing is summarised: arc radii, path lengths and directions, pixel sums,
 * rotations, canvases created. The summary is compared with a stored one.
 *
 * WHEN THIS FAILS:
 *   - after moving, renaming or tidying code: something changed behaviour.
 *     Find it. That is what this test is for.
 *   - after deliberately changing a texture: expected. Regenerate with
 *       node test/textureFingerprints.test.mjs --update
 *     and say in the commit which texture changed and why.
 *
 * (Contrast pml-golden.json, which must NEVER be regenerated: a poem's
 * meaning is a promise to its author; a texture's look is ours to improve.)
 *
 * Run: node test/textureFingerprints.test.mjs [--update]
 */
import { readFileSync, writeFileSync } from 'fs';
import * as M from './canvasMock.mjs';
M.installCanvasMock();
const T = await import('../textureGenerators.js');

const FIXTURE = new URL('./fixtures/texture-fingerprints.json', import.meta.url);
const current = {};
const types = [...Object.keys(T.TEXTURE_PARAMS), 'astral_fog', 'astral_stars'];
for(const t of types){
  const d = T.TEXTURE_PARAMS[t] || [{min:50,def:100,max:200},{min:50,def:100,max:200}];
  for(const [a, b] of [[d[0].min, d[1].min], [d[0].def, d[1].def], [d[0].max, d[1].max]]){
    M.resetCreatedCanvases();
    T.getTextureCanvas(t, 320, 320, '#c9a876', '#7a8ca3', false, 4242, a, b, 135, '#D9B45B', '#7a8ca3');
    const agg = {};
    for(const c of M.createdCanvases)
      for(const [k, v] of Object.entries(c.getContext('2d')._stats))
        agg[k] = (agg[k] || 0) + (typeof v === 'number' ? v : 0);
    for(const k of Object.keys(agg)) agg[k] = +agg[k].toFixed(6);
    agg.canvases = M.createdCanvases.length;
    current[`${t}@${a},${b}`] = agg;
  }
}

if(process.argv.includes('--update')){
  writeFileSync(FIXTURE, JSON.stringify(current));
  console.log(`updated ${Object.keys(current).length} fingerprints`);
  process.exit(0);
}

const stored = JSON.parse(readFileSync(FIXTURE, 'utf8'));
let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };
const missing = Object.keys(stored).filter(k => !(k in current));
const added = Object.keys(current).filter(k => !(k in stored));
const changed = Object.keys(stored).filter(k => k in current && JSON.stringify(stored[k]) !== JSON.stringify(current[k]));
check(`all ${Object.keys(stored).length} stored renders still exist`, missing.length === 0);
check('no renders appeared without a fingerprint', added.length === 0);
check('every texture draws exactly as it did', changed.length === 0);
if(missing.length) console.log('   missing:', missing.slice(0, 6).join(', '));
if(added.length) console.log('   new (run with --update):', added.slice(0, 6).join(', '));
if(changed.length){
  const tex = [...new Set(changed.map(k => k.split('@')[0]))];
  console.log('   changed textures:', tex.join(', '));
  console.log('   if deliberate: node test/textureFingerprints.test.mjs --update');
}
console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
