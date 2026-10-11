// The Murmur Studio (tools/murmur-studio.html): the template with murmur.js
// inlined, so the studio plays exactly what Vellum plays. Run after changing
// murmur.js:  node tools/make-murmur-studio.mjs   (test/murmur.test.mjs checks it is current)
import { readFileSync, writeFileSync } from 'fs';
const here = f => new URL(f, import.meta.url);
export const studioEngine = () => readFileSync(here('../murmur.js'), 'utf8').replace(/^export /gm, '');
const page = readFileSync(here('./murmur-studio.template.html'), 'utf8').replace('/*MURMUR*/', () => studioEngine());
writeFileSync(here('./murmur-studio.html'), page);
console.log('wrote tools/murmur-studio.html');
