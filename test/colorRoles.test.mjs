/**
 * colorRoles.test.mjs — every colour a texture offers has its own job, and
 * none repeats another's (Ruby: "make sure that all of them are being used to
 * their fullest and none of them are redundant").
 *
 *   Light     lighter marks          Dark      darker marks
 *   Material  the surface between    Highlight glints        Shade  cast shadow
 *   Glow      light it gives off     (a coloured texture's fifth hue)
 *
 * A texture with a base colour of its own gets a Glow as its fifth hue; a
 * grey one gets a Material (ground) colour; one with no colour at all gets
 * a base colour. Each hue's "none" draws exactly as before.
 */
import { readFileSync } from 'fs';
let failures = 0;
const check = (name, ok) => { console.log((ok ? 'ok: ' : 'FAIL: ') + name); if(!ok) failures++; };

const T = await import('../textureGenerators.js');
const C = await import('../texCore.js');
const caps = Object.entries(T.TEXTURE_CAPS);

// --- the plan, texture by texture
check('every grey (generic-tint) texture has a Material Hue, mid-grey by default',
  caps.filter(([, c]) => c.genericTint).every(([, c]) => c.hue5 && c.hue5.role === 'ground' && c.hue5.def === '#808080' && c.hue5.label === 'Material Hue'));
check('every glow is black by default, named Glow Hue, and says what glows',
  caps.filter(([, c]) => c.hue5 && c.hue5.role === 'glow').every(([, c]) => c.hue5.def === '#000000' && c.hue5.label === 'Glow Hue' && c.hue5.why.length > 10));
check('a texture with a base colour of its own gets a GLOW, never a second material',
  caps.filter(([, c]) => c.hue5 && c.hue5.role === 'glow').every(([, c]) => !c.genericTint && c.tints >= 1));
check('a texture with no colour at all (First Snow) gets a BASE colour, white by default',
  T.TEXTURE_CAPS.snow.hue5.role === 'base' && T.TEXTURE_CAPS.snow.hue5.def === '#FFFFFF');
check('no texture names two hues alike',
  caps.every(([, c]) => { const names = [...(c.tintLabels || []).slice(0, c.tints), ...(c.material ? ['Highlight Hue', 'Shade Hue'] : []), ...(c.hue5 ? [c.hue5.label] : [])];
    return new Set(names).size === names.length; }));
check('a texture that already emits light in its own hues gets no Glow (it would repeat them)',
  ['magicparticles', 'embers', 'aurora'].every(t => !T.TEXTURE_CAPS[t].hue5));

// --- the tint pass, on real pixels (a stand-in canvas)
const fake = (px) => { const data = new Uint8ClampedArray(px.flat()); return { width: px.length, height: 1,
  getContext: () => ({ getImageData: () => ({ data }), putImageData: () => {} }), data }; };
const run = (px, l, d, f, g) => { const c = fake(px); C.pixelPass(c, l, d, f, g); return [...c.data]; };
const greys = [[0,0,0,255],[64,64,64,255],[128,128,128,255],[200,200,200,255],[255,255,255,255]];
check('white over black over mid-grey is the identity', JSON.stringify(run(greys, '#FFFFFF', '#000000', null, '#808080')) === JSON.stringify(greys.flat()));
const gnd = run(greys, null, null, null, '#C08040');
check('Material Hue colours the ground (exactly mid-grey) and nothing at the extremes',
  gnd.slice(8, 11).join() === '192,128,64' && gnd.slice(0, 3).join() === '0,0,0' && gnd.slice(16, 19).join() === '255,255,255');
check('…and marks between move from it toward light and dark', gnd[12] > 192 && gnd[12] < 255 && gnd[4] < 192 && gnd[4] > 0);
const coloured = run([[220,160,160,255]], '#E0E0FF', '#000000', null, null), plain = run([[180,180,180,255]], '#E0E0FF', '#000000', null, null);
check('a coloured mark (a material\'s highlight) keeps its own colour through the tint pass',
  coloured[0] - plain[0] === 40 && coloured[1] - plain[1] === -20 && coloured[2] - plain[2] === -20);

console.log();
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
