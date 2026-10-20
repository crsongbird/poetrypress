/**
 * tools/snapshot.mjs — the registry as data, to prove a refactor changed nothing.
 *
 *   node tools/snapshot.mjs [repo] out.json      every chain, its starter graph, every slider, every cap, every part
 *   cmp before.json after.json                   (byte for byte: key order too)
 *
 * Functions are written as "[fn]" and the parts' descriptions are left out (the wiki keeps them). Take one on the
 * tree before (a git worktree of the older commit) and one after; the pictures are the fingerprints' job.
 */
import fs from 'fs'; import path from 'path'; import { pathToFileURL } from 'url';
const args = process.argv.slice(2), out = args.pop(), R = path.resolve(args[0] || path.join(path.dirname(new URL(import.meta.url).pathname), '..'));
const imp = f => import(pathToFileURL(path.join(R, f)).href);
const C = await imp('chains.js'), T = await imp('textureGenerators.js'), S = await imp('steps.js'), A = await imp('athanor.js');
const fnless = o => JSON.parse(JSON.stringify(o, (k, v) => typeof v === 'function' ? '[fn]' : v));
const starters = {}; for(const k of Object.keys(C.TEXTURE_CHAINS)){ try { starters[k] = A.athanorStarter(C.TEXTURE_CHAINS[k]); } catch(e){ starters[k] = 'ERR ' + e.message; } }
const steps = {}; for(const [k, s] of Object.entries(S.STEPS)){ const { doc, ...rest } = s; steps[k] = fnless(rest); }
fs.writeFileSync(out, JSON.stringify({ chains: fnless(C.TEXTURE_CHAINS), starters, params: T.TEXTURE_PARAMS, caps: fnless(T.TEXTURE_CAPS), steps }));
console.log('snapshot:', Object.keys(starters).length, 'chains,', Object.keys(steps).length, 'parts →', out);
