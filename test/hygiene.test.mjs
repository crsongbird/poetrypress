/**
 * hygiene.test.mjs — the project keeps itself current (AGENTS.md §1 rule 12).
 * It fails when something has gone stale, so staleness cannot ship:
 *   - dead code: names, strings, CSS, fixtures and tools nothing uses
 *     (tools/prune.mjs finds them; this fails on any);
 *   - the docs: every name, file and command they cite must exist, every
 *     count they state must be the code's, every module and tool must be in
 *     the map, the changelog must lead with this release, the lists of
 *     open work must hold only open work;
 *   - PML.md and the in-app guide: every directive they teach still parses;
 *   - the tests themselves: each says what it guards, none reads a surface's
 *     own source (the fingerprints guard the pictures), none is skipped.
 * When it fails, fix the doc or the code it names; never loosen it to pass.
 *
 * Run: node test/hygiene.test.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { check, done, UI_FILES } from './harness.mjs';
globalThis.document = globalThis.document || { createElement: () => ({ getContext: () => null }) };
const { pruneReport, pruneStrip } = await import('../tools/prune.mjs');

const ROOT = new URL('..', import.meta.url);
const rd = f => readFileSync(new URL(f, ROOT), 'utf8');
const ls = d => existsSync(new URL(d, ROOT)) ? readdirSync(new URL(d, ROOT)) : [];
const MODULES = ls('.').filter(f => /^\w+\.js$/.test(f));
const TESTS = ls('test').filter(f => /\.test\.mjs$/.test(f));
const TOOLS = ls('tools').filter(f => /\.\w+$/.test(f));
// the protocol is AGENTS.md and the long reference it points to (docs/)
const PROTOCOL = ['AGENTS.md', 'docs/light.md', 'docs/ui-machinery.md', 'docs/athanor.md', 'docs/surfaces.md', 'docs/pitfalls.md'];
const DOCS = [...PROTOCOL, 'ROADMAP.md', 'OPEN-ISSUES.md', 'PML.md', 'README.md', 'PERFORMANCE-AUDIT.md'];
const agents = rd('AGENTS.md'), protocol = PROTOCOL.map(rd).join('\n'), roadmap = rd('ROADMAP.md'), issues = rd('OPEN-ISSUES.md'), changelog = rd('CHANGELOG.md');

// ---------- 1 · nothing dead ----------
{
  const r = pruneReport();
  check('no top-level name goes unused (node tools/prune.mjs)', !r.unused.length, r.unused);
  check('no name is used only by the tests, unless it says why (// test hook: … or // kept: …)', !r.testOnly.length, r.testOnly);
  check('no strings.js entry goes unasked for', !r.strings.length, r.strings);
  check('no CSS styles a class or id that nothing makes', !r.css.length, r.css);
  check('no fixture goes unread, no test helper unimported', !r.fixtures.length && !r.helpers.length, [...r.fixtures, ...r.helpers]);
  check('no tool goes unmentioned', !r.tools.length, r.tools);
  // SEDIMENT: a declaration overridden by a LATER block of the same selector is dead (repeated iteration left many; they
  // were removed, and this keeps the count from climbing back). A property set twice in ONE block is a fallback, not dead.
  const css = rd('poetrypress.css').replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length)), seen = new Map(); let dead = 0, i = 0, ri = 0;
  while(i < css.length){ const b = css.indexOf('{', i); if(b < 0) break;
    const sel = css.slice(i, b).trim().replace(/\s+/g, ' '); let d = 1, j = b + 1;
    while(j < css.length && d){ if(css[j] === '{') d++; else if(css[j] === '}') d--; j++; }
    if(!sel.startsWith('@')) for(const dec of css.slice(b + 1, j - 1).split(';')){ const k = dec.split(':')[0].trim(); if(!k || !dec.includes(':')) continue;
      const key = sel + '|' + k; if(seen.has(key) && seen.get(key) !== ri) dead++; seen.set(key, ri); }
    i = j; ri++; }
  check('the stylesheet keeps its overridden declarations near zero (a later block of the same selector wins)', dead <= 10, dead > 10 ? [String(dead)] : []);
}

// ---------- 2 · the docs name only what exists ----------
{
  const corpus = [...MODULES, 'index.html', 'poetrypress.css', 'build.mjs', 'test.sh', 'check.sh', ...TESTS.map(t => 'test/' + t),
    ...ls('test').filter(f => /\.mjs$/.test(f) && !f.endsWith('.test.mjs')).map(f => 'test/' + f), ...TOOLS.map(t => 'tools/' + t)]
    .filter(f => existsSync(new URL(f, ROOT))).map(rd).join('\n');
  const words = new Set(corpus.match(/[A-Za-z_$][\w$]*/g));
  // what the docs may name that the code never will: placeholders, browser and library APIs named as don'ts
  const OUTSIDE = new Set(['genX', 'pkill', 'stash', 'worktree', 'scratch', 'input_N', 'isPointInPath', 'Path2D', 'add_script_tag', 'pack', 'NAMES', 'FORGE_CAT_', 'innerHTML', 'textContent',
    'confirm', 'filter', 'import', 'meta', 'export', 'async', 'function', 'module', 'node', 'check', 'git', 'npm', 'install', 'save', 'canvas',
    'napi', 'rs', 'python', 'python3', 'json', 'out', 'png', 'cols', 'knobs', 'min', 'max', 'only', 'update', 'ref', 'HEAD', 'next', 'notes', 'zip']);
  const missing = [];
  for(const doc of DOCS) for(const m of rd(doc).matchAll(/`([^`\n]+)`/g))
    for(const id of m[1].match(/[A-Za-z_$][\w$]*/g) || []) if(id.length >= 4 && !words.has(id) && !OUTSIDE.has(id)) missing.push(`${doc}: ${id} (in \`${m[1].slice(0, 40)}\`)`);
  check('every name the docs put in `code` exists in the code', !missing.length, [...new Set(missing)]);
  // files the docs name
  const files = [];
  for(const doc of [...DOCS, 'CHANGELOG.md']) for(const m of rd(doc).matchAll(/(?<![\w/.-])((?:test|tools|icons|pwa)\/[\w./-]+\.\w+|\w[\w-]*\.(?:js|mjs|py|sh|css|html|md|json|webmanifest))\b/g)){
    const f = m[1];
    if(/^(sw\.js|manifest\.webmanifest|drawflow\.min\.js|coloris\.min\.\w+|panzoom\.min\.js|index\.html|file\.js)$/.test(f)) continue;     // built, fetched, or a placeholder
    const found = [f, 'test/' + f, 'tools/' + f, 'test/fixtures/' + f, 'docs/' + f].some(p => existsSync(new URL(p, ROOT)));
    if(!found && doc !== 'CHANGELOG.md') files.push(`${doc}: ${f}`);
  }
  check('every file the docs name exists', !files.length, [...new Set(files)]);
}

// ---------- 3 · the maps are whole ----------
{
  const map = agents.slice(agents.indexOf('## 4 · Repository map'), agents.indexOf('## 5 · '));
  const unlisted = MODULES.filter(f => !map.includes('`' + f + '`'));
  check('AGENTS.md §4 lists every module', !unlisted.length, unlisted);
  const cmds = agents.slice(agents.indexOf('## 2 · Commands'), agents.indexOf('## 3 · '));
  const tools = TOOLS.filter(t => /\.(mjs|py)$/.test(t)).filter(t => !cmds.includes('tools/' + t));
  check('AGENTS.md §2 lists every tool someone runs', !tools.length, tools);
  const suites = TESTS.filter(t => !agents.includes(t.replace(/\.test\.mjs$/, '')) && !/^(bundle|appBoot)\.test\.mjs$/.test(t));
  void suites;
}

// ---------- 4 · counts the docs state are the code's ----------
{
  const { ATHANOR_STUDIES } = await import('../athanorStudies.js');
  const { CARD_GAMES } = await import('../cartomancy.js');
  const { ATHANOR_MAX_JSON, ATHANOR_LIMITS } = await import('../athanor.js');
  const { ALT_MAX } = await import('../altText.js');
  const ev = UI_FILES.map(rd).join('\n'), cr = rd('canvasRenderer.js');
  const WORD = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
  const n = s => WORD[s] ?? +s;
  // [doc, the sentence (its number captured), the code's number]. A sentence reworded must be reworded here too.
  const FACTS = [
    ['AGENTS.md', /the (\d+) Surface Studies/, Object.keys(ATHANOR_STUDIES).length],
    ['ROADMAP.md', /the (\d+) Surface Studies/, Object.keys(ATHANOR_STUDIES).length],
    ['AGENTS.md', /\((\w+) `CARD_GAMES`\)/, Object.keys(CARD_GAMES).length],
    ['AGENTS.md', /At most (\d+) KB \(`ATHANOR_MAX_JSON`\)/, ATHANOR_MAX_JSON / 1024],
    ['AGENTS.md', /`ATHANOR_MAX_JSON`\) and (\d+) nodes/, ATHANOR_LIMITS.nodes],
    ['AGENTS.md', /Past `GUARD_EDITS` \((\d+)\)/, +(ev.match(/const GUARD_EDITS = (\d+);/) || [])[1]],
    ['AGENTS.md', /clipped to (\d+) characters/, ALT_MAX],
    ['AGENTS.md', /The mask is (\d+) px across/, +(cr.match(/const mw = (\d+),/) || [])[1]],
  ];
  const wrong = [];
  for(const [doc, re, want] of FACTS){
    const m = (doc === 'AGENTS.md' ? protocol : rd(doc)).match(re);
    if(!m) wrong.push(`${doc}: the sentence ${re} is gone (reword it here too)`);
    else if(n(m[1]) !== want) wrong.push(`${doc}: says ${m[1]} (${re}), the code says ${want}`);
  }
  check('every count the docs state is the code\'s', !wrong.length, wrong);
}

// ---------- 5 · the textures that aren't chains yet: one list, the code's ----------
{
  const CH = await import('../chains.js');
  const html = rd('index.html');
  const sel = (html.match(/<select id="textureType">([\s\S]*?)<\/select>/) || ['', ''])[1];
  const menu = [...sel.matchAll(/<option value="([^"]+)"([^>]*)>/g)].filter(m => !/\bhidden\b/.test(m[2]) && m[1] !== 'athanor').map(m => m[1]);
  const todo = menu.filter(t => !CH.TEXTURE_CHAINS[t]).sort();
  const block = (roadmap.match(/<!-- not-chains -->([\s\S]*?)<!-- \/not-chains -->/) || [])[1];
  const listed = block ? block.match(/\b[a-z]+\b/g).filter(w => menu.includes(w)).sort() : null;
  check('ROADMAP.md keeps the one list of menu textures that aren\'t chains yet, and it is the code\'s',
    listed && JSON.stringify(listed) === JSON.stringify(todo), listed ? [...todo.filter(t => !listed.includes(t)).map(t => 'not listed: ' + t), ...listed.filter(t => !todo.includes(t)).map(t => 'a chain already: ' + t)] : ['no <!-- not-chains --> list in ROADMAP.md']);
  const counted = [...DOCS].flatMap(doc => [...rd(doc).matchAll(/(\d+) (?:of \d+ )?(?:textures )?(?:still )?aren't(?: chains)?|(\d+) of (\d+) are chains|(\d+) textures are chains/g)].map(m => `${doc}: “${m[0]}”`));
  check('no doc carries its own count of chains (the list is the count)', !counted.length, counted);
}

// ---------- 6 · the release and the lists of work ----------
{
  const { RELEASE } = await import('../release.js');
  const first = (changelog.match(/^## (.+?) \(/m) || [])[1];
  check('CHANGELOG.md leads with this release, ' + RELEASE, first === RELEASE);
  const archive = existsSync(new URL('docs/changelog-archive.md', ROOT)) ? rd('docs/changelog-archive.md') : '';
  const names = [...(changelog + '\n' + archive).matchAll(/^## (.+?) \(/gm)].map(m => m[1]);
  check('every release appears once in the changelog and its archive', new Set(names).size === names.length);
  check('the changelog keeps the newest twenty releases (node build.mjs --next moves the rest to docs/changelog-archive.md)', (changelog.match(/^## /gm) || []).length <= 21);
  // housekeeping (AGENTS.md §3 step 6): the tests reviewed within every five releases, the stylesheet pruned
  // within every ten (Ruby: the prune is slow)
  const within = n => changelog.split(/^## /m).slice(1, n + 1).join('\n');
  check('the last five releases reviewed the tests, and the last ten pruned the stylesheet (said under **Under the hood**)',
    /reviewed the tests/i.test(within(5)) && /pruned the stylesheet/i.test(within(10)));
  const done = [issues, roadmap].flatMap((t, i) => t.split('\n').filter(l => /^\s*[-*].*(\(done\b|\bDONE\b|✓|✅|\bshipped in\b)/.test(l)).map(l => (i ? 'ROADMAP: ' : 'OPEN-ISSUES: ') + l.trim().slice(0, 90)));
  check('OPEN-ISSUES.md and ROADMAP.md hold open work only (what is done is deleted, not marked)', !done.length, done);
}

// ---------- 6½ · the thumbnails' stamps are the fingerprints' (build.mjs writes them) ----------
{
  const { createHash } = await import('crypto');
  const fp = JSON.parse(rd('test/fixtures/texture-fingerprints.json')), by = {};
  for(const [k, v] of Object.entries(fp)){ const t = k.split('@')[0]; (by[t] = by[t] || []).push(k + JSON.stringify(v)); }
  const h = s => createHash('sha1').update(s).digest('base64url').slice(0, 8);
  const R = await import('../release.js');
  const stale = Object.keys(by).filter(t => R.TEXTURE_STAMPS[t] !== h(by[t].sort().join('|')));
  check('release.js stamps every surface from its current fingerprints (run node build.mjs)', !stale.length && R.SWATCH_STAMP === h(rd('swatches.js')), stale);
}

// ---------- 7 · what PML.md and the in-app guide teach still parses ----------
{
  const P = await import('../textParsers.js');
  const plain = JSON.stringify(P.buildLines('<word>', true, true));
  const dead = [];
  const table = rd('PML.md').slice(rd('PML.md').indexOf('### Segments'));
  for(const m of table.matchAll(/^\| `([^`|]+)` \|/gm)){
    const d = m[1].replace(/N\b/g, '150').replace(/hex/g, 'ff00aa').replace(/…/g, '');
    if(/[<>\s]/.test(d)) continue;
    const got = JSON.stringify(P.buildLines(`<word/${d}>`, true, true));
    if(got === plain) dead.push(`PML.md: /${m[1]} parses to nothing`);
  }
  check('every segment directive PML.md documents does something', !dead.length, dead);
  // the Arcane Guidance (index.html): every /directive it shows in <code>
  const guide = [];
  for(const m of rd('index.html').matchAll(/<code>\/([^<\s]+)<\/code>/g)){
    const d = m[1].replace(/&amp;/g, '&');
    if(['l', 'c', 'r', 'left', 'center', 'right'].includes(d)) continue;          // line suffixes: PML.md's own table
    if(JSON.stringify(P.buildLines(`<word/${d}>`, true, true)) === plain) guide.push(`index.html: /${d} parses to nothing`);
  }
  check('every /directive the in-app guide shows does something', !guide.length, guide);
  // its examples (⤓ Try): each one PML that does something (a §Variable one: something to resolve)
  const V = await import('../pmlVars.js');
  const unent = t => t.replace(/&#10;/g, '\n').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&');
  const flat = t => t.replace(/[*_~[\]{}<>#/`\\-]/g, c => '\\' + c);
  const idle = [];
  for(const m of rd('index.html').matchAll(/class="pml-ex" data-try="([^"]*)"/g)){ const ex = unent(m[1]);
    const does = ex.includes('§') ? V.resolvePmlVariables(ex, {}) !== ex : JSON.stringify(P.buildLines(ex, true, true)) !== JSON.stringify(P.buildLines(flat(ex), true, true));
    if(!does) idle.push(ex.slice(0, 40)); }
  check('every example the in-app guide offers to try does something', !idle.length && rd('index.html').includes('data-try='), idle);
}

// ---------- 8 · the hue names the docs use are the app's ----------
{
  const ui = rd('strings.js') + rd('index.html') + rd('textureGenerators.js');
  const hues = [...new Set([...protocol.matchAll(/\b([A-Z][a-z]+) [Hh]ue\b/g)].map(m => m[1] + " Hue"))].filter(h => !ui.includes(h) && !/^(Every|Each|The|One|A)\s/.test(h));
  check('every "… Hue" AGENTS.md names is a hue the app shows', !hues.length, hues);
}

// ---------- 9 · the tests themselves ----------
{
  const headless = TESTS.filter(t => !new RegExp('^/\\*\\*\\n \\* ' + t.replace(/\./g, '\\.') + ' — ').test(rd('test/' + t)));
  check('every suite opens by naming itself and what it guards', !headless.length, headless);
  const silent = TESTS.filter(t => !/import \{[^}]*\bdone\b[^}]*\} from '\.\/harness\.mjs'/.test(rd('test/' + t)) || !/^done\(\);/m.test(rd('test/' + t)));
  check('every suite ends with the shared harness\'s done() (ALL PASSED, so test.sh can count it)', !silent.length, silent);
  const copies = TESTS.filter(t => t !== 'hygiene.test.mjs' && /\blet failures\b|const check = /.test(rd('test/' + t)));
  check('no suite keeps its own copy of the check harness (test/harness.mjs)', !copies.length, copies);
  // the pictures are guarded by the fingerprints: a test that reads a surface's code tests how, not what
  const SURFACE = /(?:'|\.\.\/)(tex(?:Whimsy|Sharpness|Chaos|Touch|Core)|steps\w*|cartomancy\w*|chains|athanorStudies|textureGenerators)\.js/;
  const peek = TESTS.filter(t => t !== 'invariants.test.mjs' && t !== 'hygiene.test.mjs').filter(t => {
    const s = pruneStrip(rd('test/' + t));
    // (read directly, or through a suite's own helper: src, rd, read, raw)
    return [...s.matchAll(/readFileSync\([^)]*\)|\b(?:src|rd|read|raw)\(\s*['"][^'"]+['"]\s*\)/g)].some(m => SURFACE.test(m[0]));
  });
  check('no suite reads a surface\'s source (invariants.test.mjs scans for pitfalls; the fingerprints guard pictures)', !peek.length, peek);
  const seen = new Map();
  for(const t of TESTS) for(const m of rd('test/' + t).matchAll(/check\(\s*'((?:[^'\\]|\\.){12,})'/g)) seen.set(m[1], [...(seen.get(m[1]) || []), t]);
  const twice = [...seen].filter(([, v]) => new Set(v).size > 1).map(([k, v]) => `${[...new Set(v)].join(' & ')}: ${k.slice(0, 60)}`);
  check('no check is made twice, in two suites (keep it where its concern lives)', !twice.length, twice);
  const skipped = TESTS.filter(t => /\b(it|describe|test)\.skip\(|\bif\s*\(\s*false\s*\)/.test(rd('test/' + t)));
  check('no suite skips a check', !skipped.length, skipped);
}

console.log();
done();
