/**
 * interface.test.mjs — the interface's standing rules that a test can read:
 * the texture menu's groups (AGENTS.md §8 Add a texture), every Athanor
 * category holding three parts or more (§6.2), and the teaching notes'
 * shape (§6.3, §11 Three voices). How the controls behave is tested by
 * their own suites (locks, persistence, audit, draft, forge).
 *
 * Run: node test/interface.test.mjs
 */
import { readFileSync } from 'fs';
let failures = 0;
const check = (name, ok) => { console.log((ok ? 'ok: ' : 'FAIL: ') + name); if(!ok) failures++; };
const src = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const html = src('index.html');

// ---- the texture menu: grouped by how a surface is made ----
{
  const O = await import('../appOptions.js');
  const groups = [...html.matchAll(/<optgroup label="([^"]+)"/g)].map(m => m[1]);
  const textureGroups = groups.filter(g => O.TEXTURE_GROUPS.some(t => g === t.glyph + ' ' + t.name.replace(/&/g, '&amp;')));
  const sel = (html.match(/<select id="textureType">([\s\S]*?)<\/select>/) || ['', ''])[1];
  const blocks = [...sel.matchAll(/<optgroup[^>]*>([\s\S]*?)<\/optgroup>/g)].map(m => m[1]);
  const sizes = blocks.map(b => (b.match(/<option/g) || []).length);
  check('the texture menu goes by TEXTURE_GROUPS (the same in the Athanor), each group at least three (but Yours), each headed by a Runology Archetype',
    textureGroups.length === O.TEXTURE_GROUPS.length && sizes.slice(0, -1).every(n => n >= 3) && O.TEXTURE_GROUPS.slice(0, -1).every((g, i) => g.types.length === sizes[i])
    && O.TEXTURE_GROUPS.every(g => ['🜃','🜚','🜁','🝊','🜥','🜄','Ᏹ','🝓','🝆','⎐','🜉'].includes(g.glyph)));
  check('…each group alphabetical', blocks.every(b => { const names = [...b.matchAll(/>([^<]+)<\/option>/g)].map(x => x[1].toLowerCase().replace(/'/g, ''));
    return names.every((n, i) => i === 0 || names[i - 1] <= n); }));
  check('…and the Basics are the Athanor\'s alone (hidden options, so old looks still open)',
    !O.TEXTURE_GROUPS.some(g => g.name === 'Basics') && O.ATHANOR_BASICS.types.every(t => new RegExp('<option value="' + t + '"[^>]*hidden>').test(html)));
}

// ---- the Athanor's categories and teaching notes ----
{
  const S = await import('../steps.js'), A = await import('../athanor.js'), CH = await import('../chains.js');
  check('every Athanor category keeps at least three parts',
    S.STEP_CATEGORIES.filter(c => c !== 'Output').every(c => Object.values(S.STEPS).filter(st => st.cat === c).length >= 3));
  check('every chain and starter carries a teaching note: what it makes, how its parts make it, and one thing to try',
    [...Object.values(A.ATHANOR_STARTERS), ...Object.values(CH.TEXTURE_CHAINS)].every(t => /Try: /.test(t.teach) && t.teach.split(/\s+/).length >= 15 && !/^This (graph makes|is) /.test(t.teach)));
}

console.log();
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
