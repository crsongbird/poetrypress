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
const ids = new Set([...W.WIKI_ARTICLES.map(a => a.id), ...keys.map(k => 'part:' + k)]);
const links = [];
for(const a of W.WIKI_ARTICLES) for(const m of a.body.matchAll(/\[\[([^\]|]+)/g)) links.push([a.id, m[1]]);
for(const [k, w] of Object.entries(P.WIKI_PARTS)) for(const id of w.see || []) links.push(['part:' + k, id]);
const dead = links.filter(([, id]) => !ids.has(id) && !id.startsWith('cat:'));
check('every link in the wiki leads to a page' + (dead.length ? ': ' + dead.slice(0, 4).map(d => d.join('→')).join(', ') : ''), !dead.length);
check('the concept pages answer the basics: what a gray map, a picture, a curve and a mask are', ['graymap', 'picture', 'curve', 'masks', 'kinds'].every(id => W.WIKI_ARTICLES.find(a => a.id === id && a.body.length > 400)));
check('a part page lists its inputs, outputs and settings', (() => { const h = W.wikiArticleHtml('part:levels'); return /Inputs/.test(h) && /Outputs/.test(h) && /Settings/.test(h) && /Black Point/.test(h) && /required/.test(h); })());
check('search finds articles and parts', W.wikiSearch('mask').length > 3 && W.wikiSearch('levels').some(h => h.id === 'part:levels'));
console.log(failures ? `\n${failures} FAILURES` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
