#!/usr/bin/env node
/**
 * prune.mjs — what has gone unused. Run it every pass (AGENTS.md §1 rule 12);
 * test/hygiene.test.mjs fails on the same findings, so nothing dead ships.
 *
 *   node tools/prune.mjs          the report
 *   node tools/prune.mjs --json   the same, as JSON (the hygiene test reads it)
 *
 * It finds:
 *   - top-level names (functions, consts, classes) that nothing uses;
 *   - names only the tests use (a test of nothing the app does);
 *   - strings.js keys nothing asks for;
 *   - CSS classes and ids the stylesheet styles but nothing makes;
 *   - fixtures no test reads, tools nothing mentions.
 * Each module is flattened into one scope (build.mjs), so a name is used when
 * it appears anywhere outside its own declaration, in any module.
 * Haiku: / what no one calls for / still costs the phone to carry — / sweep, and keep the light
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const rd = f => readFileSync(join(ROOT, f), 'utf8');
const ls = d => existsSync(join(ROOT, d)) ? readdirSync(join(ROOT, d)) : [];

/** Strip comments (and, with `strings`, the insides of string literals) from JS, keeping line breaks. */
export function pruneStrip(src, strings = false){
  let out = '', i = 0, prev = '';
  const n = src.length;
  const regexOk = () => /[(,=:[!&|?{};+\-*%<>~^]$|^$|\b(?:return|typeof|case|in|of|delete|void|throw|new)$/.test(prev.trimEnd());
  while(i < n){
    const c = src[i], d = src[i + 1];
    if(c === '/' && d === '/'){ while(i < n && src[i] !== '\n') i++; continue; }
    if(c === '/' && d === '*'){ const e = src.indexOf('*/', i + 2); const chunk = src.slice(i, e < 0 ? n : e + 2); out += chunk.replace(/[^\n]/g, ' '); i = e < 0 ? n : e + 2; continue; }
    if(c === '"' || c === "'" || c === '`'){
      const q = c; let j = i + 1, body = '';
      while(j < n && src[j] !== q){
        if(src[j] === '\\'){ body += src[j] + src[j + 1]; j += 2; continue; }
        if(q === '`' && src[j] === '$' && src[j + 1] === '{'){
          // a template's ${…} is code: keep it as code
          let depth = 1, k = j + 2;
          while(k < n && depth){ if(src[k] === '{') depth++; else if(src[k] === '}') depth--; k++; }
          body += ' ' + pruneStrip(src.slice(j + 2, k - 1), strings) + ' '; j = k; continue; }
        body += src[j]; j++; }
      out += q + (strings ? body.replace(/[^\n ]/g, ' ') : body) + q; prev = q; i = j + 1; continue; }
    if(c === '/' && regexOk()){
      let j = i + 1, cls = false;
      while(j < n && (cls || src[j] !== '/') && src[j] !== '\n'){ if(src[j] === '\\') j++; else if(src[j] === '[') cls = true; else if(src[j] === ']') cls = false; j++; }
      const lit = src.slice(i, j + 1); out += strings ? '/' + ' '.repeat(Math.max(0, lit.length - 2)) + '/' : lit; i = j + 1; prev = '/'; continue; }
    out += c; if(!/\s/.test(c)) prev = (prev + c).slice(-12); else prev += c; i++;
  }
  return out;
}

/** Class prefixes made by code that isn't ours: the libraries load from a CDN and build their own markup. */
export const CSS_MADE_ELSEWHERE = ['clr-' /* Coloris, the color picker */, 'drawflow' /* Drawflow, the Athanor's grid */, 'panzoom'];

const MODULES = ls('.').filter(f => /^\w+\.js$/.test(f));
const TESTS = ls('test').filter(f => /\.mjs$/.test(f)).map(f => 'test/' + f);
const TOOLS = ls('tools').filter(f => /\.\w+$/.test(f)).map(f => 'tools/' + f);
/** A declaration may say why it stays though nothing calls it: `// test hook: …` (the tests' window into
 *  the app) or `// kept: …` (data kept whole on purpose). The report lists them, so the reasons stay visible. */
const KEEP_MARK = /\/\/\s*(test hook|kept):/;

export function pruneReport(){
  const code = Object.fromEntries(MODULES.map(f => [f, pruneStrip(rd(f))]));
  const html = rd('index.html'), css = rd('poetrypress.css');
  const testCode = TESTS.map(f => pruneStrip(rd(f))).join('\n');
  const build = rd('build.mjs') + '\n' + TOOLS.filter(t => /\.(mjs|html|py)$/.test(t) && !t.endsWith('prune.mjs')).map(rd).join('\n');
  const appAll = Object.values(code).join('\n') + '\n' + html;

  // 1 · top-level names nothing uses
  const decl = [];
  for(const [f, src] of Object.entries(code))
    for(const m of src.matchAll(/^(?:export\s+)?(?:async\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/gm)) decl.push([m[1], f]);
  const count = (hay, name) => (hay.match(new RegExp('(?<![\\w$])' + name.replace(/\$/g, '\\$') + '(?![\\w$])', 'g')) || []).length;
  const unused = [], testOnly = [], marked = [];
  const rawLines = Object.fromEntries(MODULES.map(f => [f, rd(f).split('\n')]));
  for(const [name, f] of decl){
    const inApp = count(appAll, name) + count(build, name);
    if(inApp > 1) continue;
    const line = rawLines[f].find(l => new RegExp('^(?:export\\s+)?(?:async\\s+)?(?:const|let|var|function\\*?|class)\\s+' + name.replace(/\$/g, '\\$') + '\\b').test(l)) || '';
    if(KEEP_MARK.test(line)){ marked.push(`${name} (${f}): ${line.slice(line.search(KEEP_MARK) + 2).trim()}`); continue; }
    (count(testCode, name) ? testOnly : unused).push(`${name} (${f})`);
  }

  // 2 · strings.js keys nothing asks for
  const strings = rd('strings.js');
  const used = appAll.replace(/^[\s\S]*$/, m => m);
  const dead = [];
  const appNoStrings = Object.entries(code).filter(([f]) => f !== 'strings.js').map(([, s]) => s).join('\n') + '\n' + html;
  for(const m of strings.matchAll(/^\s*'([\w.:-]+)':/gm)){
    const key = m[1];
    if(appNoStrings.includes(key)) continue;
    // keys made from a prefix and a value: 'option.' + id, 'tip.' + id …
    const [pre, rest] = [key.slice(0, key.lastIndexOf('.') + 1), key.slice(key.lastIndexOf('.') + 1)];
    if(pre && new RegExp(`['"\`]${pre.replace(/\./g, '\\.')}['"\`]\\s*\\+|\`${pre.replace(/\./g, '\\.')}\\$\\{`).test(appNoStrings) && (appNoStrings.includes(`'${rest}'`) || appNoStrings.includes(`"${rest}"`) || appNoStrings.includes(rest))) continue;
    dead.push(key);
  }
  void used;
  for(const group of ['DIALOGS', 'SURFACE_LAYERS', 'FORGE_BAR', 'PML_GUIDE', 'CHOOSER', 'DIE', 'KEPT', 'PICKER', 'THEME_NOTES']){
    const at = strings.indexOf(`export const ${group} = {`); if(at < 0) continue;
    const body = strings.slice(at, strings.indexOf('\n};', at));
    for(const m of body.matchAll(/^  (\w+):/gm))
    {
      const key = m[1];
      // GROUP.key, GROUP['key'], or a key made from a value and a suffix: DIE[level + 'Word']
      const suffixes = [...appNoStrings.matchAll(new RegExp(`${group}\\[[^\\]]*\\+\\s*['"](\\w+)['"]\\]`, 'g'))].map(x => x[1]);
      if(new RegExp(`${group}\\.${key}\\b|${group}\\[['"]${key}['"]\\]`).test(appNoStrings) || new RegExp(`['"]${key}['"]`).test(appNoStrings)) continue;
      if(suffixes.some(sx => key.endsWith(sx))) continue;
      dead.push(`${group}.${key}`);
    } }

  // 3 · CSS classes and ids nothing makes
  const cssClean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const classes = new Set([...cssClean.replace(/\{[^}]*\}/g, '{}').matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)].map(m => m[1]));
  const ids = new Set([...cssClean.replace(/\{[^}]*\}/g, '{}').matchAll(/#([a-zA-Z_][\w-]*)/g)].map(m => m[1]));
  const raw = MODULES.map(rd).join('\n') + '\n' + html;
  // a class made from a prefix and a value (`pml-${kind}`, 'forge-' + category) counts as made when the
  // value appears as a word in the code's strings (forge-output: the Output category)
  const prefixes = new Set([...raw.matchAll(/([a-z][\w]*-)(?:\$\{|['"`]\s*\+)/g)].map(m => m[1]));
  const words = new Set((raw.match(/[A-Za-z][\w]*/g) || []).map(w => w.toLowerCase()));
  const made = c => raw.includes(c) || CSS_MADE_ELSEWHERE.some(p => c.startsWith(p))
    || [...prefixes].some(p => c.startsWith(p) && c.slice(p.length).split('-').every(w => words.has(w)));
  const deadCss = [...classes].filter(c => !made(c)).map(c => '.' + c)
    .concat([...ids].filter(i => !/^[0-9a-fA-F]{3,8}$/.test(i) && !made(i)).map(i => '#' + i));

  // 4 · fixtures no test reads, tools nothing mentions
  const testRaw = TESTS.map(rd).join('\n');
  const fixtures = ls('test/fixtures').filter(f => !testRaw.includes(f)).map(f => 'test/fixtures/' + f);
  const helpers = TESTS.filter(f => !/\.test\.mjs$/.test(f)).filter(f => !testRaw.includes(f.split('/')[1]));
  const docs = ['AGENTS.md', 'README.md', 'ROADMAP.md', 'build.mjs', 'package.json'].filter(f => existsSync(join(ROOT, f))).map(rd).join('\n') + TOOLS.filter(t => existsSync(join(ROOT, t)) && !/\.(png|jpg)$/.test(t)).map(rd).join('\n');
  const tools = TOOLS.filter(t => !docs.includes(t.split('/')[1].replace(/\.[^.]+$/, '')) && !docs.includes(t));

  return { unused, testOnly, strings: dead, css: deadCss, fixtures, helpers, tools, marked };
}

if(process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]){
  const r = pruneReport();
  if(process.argv.includes('--json')){ console.log(JSON.stringify(r, null, 1)); process.exit(0); }
  const say = (title, list, why) => { console.log(`\n${title} (${list.length})${list.length ? ':' : ''}`); if(list.length){ console.log('  ' + why); for(const x of list) console.log('   ·', x); } };
  say('Unused top-level names', r.unused, 'nothing in the app, the build or the tests uses them: delete them.');
  say('Used only by the tests', r.testOnly, 'the app never calls them: delete them and their tests, or say why they stay.');
  say('strings.js keys nothing asks for', r.strings, 'delete them (or wire them where they belong).');
  say('CSS nothing makes', r.css, 'no module or the page makes this class or id: delete the rules.');
  say('Fixtures no test reads', r.fixtures, 'delete them.');
  say('Test helpers no test imports', r.helpers, 'delete them.');
  say('Tools nothing mentions', r.tools, 'list them in AGENTS.md §2, or delete them.');
  if(r.marked.length){ console.log(`\nKept on purpose (${r.marked.length}), each with its reason:`); for(const x of r.marked) console.log('   ·', x); }
  const total = Object.entries(r).filter(([k]) => k !== 'marked').reduce((a, [, l]) => a + l.length, 0);
  console.log(total ? `\n${total} things to prune.` : '\nNothing to prune.');
}
