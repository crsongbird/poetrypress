/**
 * wiki.test.mjs — the Athanor's wiki (Ruby: an internal encyclopedia that teaches someone new to node
 * editors). Every part has a page whose ports and settings match the part; every link goes somewhere.
 * Run: node test/wiki.test.mjs
 */
import { installCanvasMock } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';
installDomMock(); installCanvasMock();
const S = await import('../steps.js');
const W = await import('../athanorWiki.js');
const P = await import('../athanorWikiParts.js');
let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };
const keys = Object.keys(S.STEPS);
check('every part has a wiki entry with a line and an article', keys.every(k => P.WIKI_PARTS[k] && P.WIKI_PARTS[k].line.length > 30));
check('every part\'s one-line doc is its wiki line (one source)', keys.every(k => S.STEPS[k].doc === P.WIKI_PARTS[k].line));
const bad = [];
for(const k of keys){ const s = S.STEPS[k], w = P.WIKI_PARTS[k], ins = s.ins.slice(0, s.dataIns), pk = (s.params || []).map(p => p[0]);
  for(const n of Object.keys(w.ins || {})) if(!ins.includes(n)) bad.push(k + ' in ' + n);
  for(const n of Object.keys(w.outs || {})) if(!s.outs.includes(n)) bad.push(k + ' out ' + n);
  for(const n of Object.keys(w.set || {})) if(!pk.includes(n)) bad.push(k + ' setting ' + n); }
check('wiki entries name only ports and settings the part really has' + (bad.length ? ': ' + bad.slice(0, 4).join(', ') : ''), !bad.length);
const gaps = [];
for(const k of keys){ const s = S.STEPS[k], w = P.WIKI_PARTS[k];
  for(const n of s.ins.slice(0, s.dataIns)) if(!(w.ins || {})[n]) gaps.push(k + ' in ' + n);
  for(const n of s.outs) if(!(w.outs || {})[n]) gaps.push(k + ' out ' + n);
  for(const p of s.params || []) if(!(w.set || {})[p[0]]) gaps.push(k + ' setting ' + p[0]); }
check('every input, output and setting of every part is explained on its page' + (gaps.length ? ': ' + gaps.slice(0, 6).join(', ') : ''), !gaps.length);
// Rule 11 (AGENTS.md §1): the help moves with the app. What the wiki writes in <b>…</b> as a menu item
// (ending in …) or as Part › Port must be something the app still shows; old names must not creep back.
const fs = await import('node:fs');
const read = f => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const appText = ['forge.js', 'strings.js', 'index.html'].map(read).join('\n');
const bodies = [...W.WIKI_ARTICLES.map(a => [a.id, a.body]), ...Object.entries(P.WIKI_PARTS).map(([k, w]) => ['part:' + k, JSON.stringify(w)])];
const unb = t => t.replace(/&amp;/g, '&').replace(/&rsquo;|’/g, '’');
const staleMenu = [], stalePort = [];
const labelOf = new Map(keys.map(k => [S.STEPS[k].label, S.STEPS[k]]));
for(const [id, body] of bodies) for(const m of body.matchAll(/<b>([^<]{2,60})<\/b>/g)){ const t = unb(m[1]);
  if(/…$/.test(t) && !appText.includes(t) && !appText.includes(t.replace(/’/g, "\\'"))) staleMenu.push(id + ': ' + t);
  const pp = t.match(/^(.+?) › (.+)$/);
  if(pp){ const part = labelOf.get(pp[1]); const word = x => String(x).replace(/^⚙\s*/, '').toLowerCase();
    const names = part ? [...part.ins, ...part.outs, ...(part.params || []).flatMap(p => [p[1], ...((p[4] && p[4].options) || [])])].map(word) : [];
    if(!part || !names.includes(pp[2].toLowerCase())) stalePort.push(id + ': ' + t); } }
check('every menu item the wiki names is one the editor still has' + (staleMenu.length ? ': ' + staleMenu.slice(0, 4).join(', ') : ''), !staleMenu.length);
check('every Part › Port the wiki names is a real part and port' + (stalePort.length ? ': ' + stalePort.slice(0, 4).join(', ') : ''), !stalePort.length);
// Names that were renamed. When renaming a part, a setting or a menu item, add the old name here.
const RETIRED_NAMES = ['Light (heights)', 'Deal (Cards)', 'Growing Line', 'Angry Strokes', 'Wire from it', 'Tidy layout', 'Watercolour Wash', 'Start from…', '<b>Use</b>', '<b>Kept</b>',
  // surfaces' names that were lies (renamed long ago)
  'Non-Euclid Cracks', 'Twisting Geometry', 'Math Static', 'Summoning Circles'];
const teach = ['chains.js', 'athanorStudies.js', 'athanor.js'].map(read).join('\n').match(/teach:\s*(['"`])(?:\\.|(?!\1).)*\1/g) || [];
const docs = [...bodies.map(b => b[1]), ...teach, read('AGENTS.md'), appText];
const back = RETIRED_NAMES.filter(n => docs.some(d => d.includes(n)));
check('no retired name is back in the wiki, the TEACH notes, the menus or AGENTS.md' + (back.length ? ': ' + back.join(', ') : ''), !back.length);
const ids = new Set([...W.WIKI_ARTICLES.map(a => a.id), ...keys.map(k => 'part:' + k)]);
const links = [];
for(const a of W.WIKI_ARTICLES) for(const m of a.body.matchAll(/\[\[([^\]|]+)/g)) links.push([a.id, m[1]]);
for(const [k, w] of Object.entries(P.WIKI_PARTS)) for(const id of w.see || []) links.push(['part:' + k, id]);
const dead = links.filter(([, id]) => !ids.has(id) && !id.startsWith('cat:'));
check('every link in the wiki leads to a page' + (dead.length ? ': ' + dead.slice(0, 4).map(d => d.join('→')).join(', ') : ''), !dead.length);
check('the concept pages answer the basics: what a gray map, a picture, a curve and a mask are', ['graymap', 'picture', 'curve', 'masks', 'kinds'].every(id => W.WIKI_ARTICLES.find(a => a.id === id && a.body.length > 400)));
check('a part page lists its inputs, outputs and settings', (() => { const h = W.wikiArticleHtml('part:levels'); return /Inputs/.test(h) && /Outputs/.test(h) && /Settings/.test(h) && /Black Point/.test(h) && /required/.test(h); })());
// FIGURES: each a working graph of real parts, each shown somewhere, and each article's figure one that exists
{ const A = await import('../athanor.js'), F = W.WIKI_FIGURES, used = new Set();
  for(const a of W.WIKI_ARTICLES) for(const m of a.body.matchAll(/\{\{fig:(\w+)\}\}/g)) used.add(m[1]);
  const bad = Object.entries(F).filter(([, f]) => { const v = A.validateGraph(JSON.stringify(A.athanorGraphOf(f))); return !v.ok || v.problems.length
    || f.rows.flat().some(x => typeof x === 'number' && !f.nodes[x - 1]); }).map(([k]) => k);
  check('every wiki figure is a working graph of real parts, and shows only its own nodes' + (bad.length ? ': ' + bad.join(', ') : ''), !bad.length);
  check('every figure is shown in an article, and every article\'s figure exists', [...used].every(k => F[k]) && Object.keys(F).every(k => used.has(k)));
  check('a figure is drawn as tiles for the editor to fill, with its caption', /<canvas data-n="1"/.test(W.wikiArticleHtml('graymap')) && /<figcaption>/.test(W.wikiArticleHtml('graymap'))); }
check('search finds articles and parts', W.wikiSearch('mask').length > 3 && W.wikiSearch('levels').some(h => h.id === 'part:levels'));
// THE TREE (Ruby: better organization, more than one heading level, no pager on every page)
{ const ctx = { categories: S.STEP_CATEGORIES, catName: c => c, catDoc: () => '' };
  const listed = W.WIKI_TREE.flatMap(t => (t.subs || []).flatMap(sub => sub.pages));
  check('every article sits in the contents\' tree exactly once', new Set(listed).size === listed.length && W.WIKI_ARTICLES.every(a => listed.includes(a.id)) && listed.every(id => W.WIKI_ARTICLES.find(a => a.id === id)));
  const nav = W.wikiContentsHtml(ctx);
  check('every part is in the contents, under its category', keys.filter(k => !S.STEPS[k].hidden).every(k => nav.includes(`data-wiki="part:${k}"`)));
  check('the contents have three levels: sections, subsections, and parts under each category', /<h3 class="wk-nav-sec">/.test(nav) && /<h4>/.test(nav) && /<details class="wk-nav-cat">/.test(nav) && /data-wiki="part:levels"/.test(nav));
  check('every section has a page that lists what it holds', W.WIKI_TREE.every(t => { const h = W.wikiArticleHtml('sec:' + t.id, ctx); return h.includes('<h2>') && (t.parts ? /part:levels/.test(h) : (t.subs || []).every(sub => sub.pages.every(p => h.includes(`data-wiki="${p}"`)))); }));
  check('a page shows where it sits: its section, then its subsection', /wk-kicker">.*sec:data.*Ports and settings/.test(W.wikiArticleHtml('ranges', ctx)) && /sec:parts/.test(W.wikiArticleHtml('part:levels', ctx)));
  check('only Getting Started is read in order (Previous and Next); its last page leads to the next section',
    W.wikiWalks('welcome') && W.wikiWalks('reading') && !W.wikiWalks('ranges') && !W.wikiWalks('part:levels') && W.wikiWalkNeighbors('reading').next.id === 'sec:data' && !W.wikiWalkNeighbors('welcome').prev); }
console.log(failures ? `\n${failures} FAILURES` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
