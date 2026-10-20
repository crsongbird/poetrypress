"""
tools/css-prune.py — remove the CSS declarations that never do anything, and
prove nothing changed.

tools/css-audit.py finds declarations that something else always overrides,
in every state a person sees. This maps each back to its line in
poetrypress.css, deletes the ones whose every longhand is overridden (and
the ones the browser can't even parse), and then checks: in every state, the
computed style of every drawn element (and its ::before and ::after) must be
exactly what it was. Any element that differs puts back the declarations
that could have changed it, and it checks again, until nothing differs.

    node build.mjs && python3 tools/css-prune.py           # report what it would remove, verified
    node build.mjs && python3 tools/css-prune.py --write   # and write poetrypress.css

Read the REMOVED list before keeping the result: a rule that matters only
after an interaction no state here performs (a drawer opened and closed
again) looks overridden everywhere. Add that state to css-audit.py's STATES.

Left alone: :root's custom properties (the colors before theme.js runs), a
property written twice in one rule (a fallback for older browsers: the first
one is for them), transitions and animations (the check freezes them), and
anything in a rule the audit can't judge (:hover and the like, libraries).
"""
import sys, os, re, json, asyncio, difflib, importlib.util
sys.dont_write_bytecode = True     # no __pycache__ beside the tools
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('css_audit', os.path.join(HERE, 'css-audit.py'))
A = importlib.util.module_from_spec(spec); spec.loader.exec_module(A)
CSS_PATH = os.path.join(HERE, '..', 'poetrypress.css')

# ---------- the source, rule by rule, declaration by declaration ----------
def parse(css):
    """[(kind, selector, media_chain, [(prop, value, start, end, important)], body_start, body_end)] in document order."""
    rules, n = [], len(css)
    def skip_ws_comments(i):
        while i < n:
            if css.startswith('/*', i): i = css.find('*/', i + 2) + 2 if css.find('*/', i + 2) >= 0 else n
            elif css[i].isspace(): i += 1
            else: break
        return i
    def block_end(i):        # i at '{'; returns index after the matching '}'
        depth, j = 0, i
        while j < n:
            if css.startswith('/*', j): j = css.find('*/', j + 2) + 2; continue
            c = css[j]
            if c in '"\'':
                q = c; j += 1
                while j < n and css[j] != q: j += 2 if css[j] == '\\' else 1
            elif c == '{': depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0: return j + 1
            j += 1
        return n
    def decls(s, e):
        out, i = [], s
        while i < e:
            i = skip_ws_comments(i)
            if i >= e: break
            j, depth = i, 0
            while j < e:
                if css.startswith('/*', j): j = css.find('*/', j + 2) + 2; continue
                c = css[j]
                if c in '"\'':
                    q = c; j += 1
                    while j < e and css[j] != q: j += 2 if css[j] == '\\' else 1
                elif c == '(': depth += 1
                elif c == ')': depth -= 1
                elif c == ';' and depth == 0: break
                j += 1
            text = css[i:j]
            if ':' in text:
                prop, val = text.split(':', 1)
                imp = bool(re.search(r'!\s*important\s*$', val))
                val = re.sub(r'\s*!\s*important\s*$', '', val)
                out.append((prop.strip().lower(), re.sub(r'/\*[\s\S]*?\*/', '', val).strip(), i, min(j + 1, e) if j < e else j, imp))
            i = j + 1
        return out
    def walk(s, e, media):
        i = s
        while i < e:
            i = skip_ws_comments(i)
            if i >= e: break
            j = i
            while j < e and css[j] not in '{;':
                if css.startswith('/*', j): j = css.find('*/', j + 2) + 2; continue
                j += 1
            if j >= e: break
            head = css[i:j].strip()
            if css[j] == ';': i = j + 1; continue           # @import / @charset
            end = block_end(j)
            if head.startswith('@media') or head.startswith('@supports'):
                walk(j + 1, end - 1, media + [head])
            elif head.startswith('@'):
                rules.append(('at', head, media, [], j + 1, end - 1))
            else:
                rules.append(('style', head, media, decls(j + 1, end - 1), j + 1, end - 1))
            i = end
    walk(0, n, [])
    return rules

# in the page: CSSOM style rules in order (path, selectorText); a selector normalized; a declaration's longhands
CSSOM_RULES = r"""() => {
  const out = [];
  const sh = [...document.styleSheets].findIndex(s => s.ownerNode && s.ownerNode.tagName === 'STYLE' && s.ownerNode.textContent.length > 50000);
  const walk = (rules, path) => { for(let i = 0; i < rules.length; i++){ const r = rules[i], p = path + '/' + i;
    if(r.cssRules && !(r instanceof CSSStyleRule) && !(window.CSSKeyframesRule && r instanceof CSSKeyframesRule)) walk(r.cssRules, p);
    else if(r instanceof CSSStyleRule) out.push([p, r.selectorText]); } };
  walk(document.styleSheets[sh].cssRules, 's' + sh);
  return out;
}"""
NORMALIZE = r"""(items) => {
  const st = document.createElement('style'); document.head.appendChild(st);
  const sels = items.sels.map(s => { try { st.sheet.insertRule(s + '{}', 0); const t = st.sheet.cssRules[0].selectorText; st.sheet.deleteRule(0); return t; } catch(e){ return null; } });
  const longs = items.decls.map(([p, v]) => { try { st.sheet.insertRule('#__x{' + p + ':' + v + '}', 0); const s = st.sheet.cssRules[0].style; const l = []; for(let k = 0; k < s.length; k++) l.push(s[k]); st.sheet.deleteRule(0); return l; } catch(e){ return []; } });
  st.remove();
  return { sels, longs };
}"""
SNAPSHOT = r"""() => {
  const kill = document.getElementById('__freeze') || Object.assign(document.createElement('style'), { id: '__freeze', textContent: '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}' });
  if(!kill.isConnected) document.head.appendChild(kill);
  // each element keyed by where it is (its id, or its tag and place among its siblings, up to one with an id), so an
  // element the page adds or removes on its own between two snapshots doesn't shift every other one
  const keyOf = el => { const parts = []; for(let e = el; e && e.nodeType === 1; e = e.parentElement){ if(e.id){ parts.push('#' + e.id); break; }
    const p = e.parentElement; parts.push(e.tagName + (p ? ':' + [...p.children].indexOf(e) : '')); } return parts.reverse().join('>'); };
  const out = [];
  document.querySelectorAll('*').forEach((el, idx) => {
    if(!el.getClientRects().length) { out.push([keyOf(el), idx, null]); return; }
    const rows = [];
    for(const ps of [null, '::before', '::after']){ const cs = getComputedStyle(el, ps); let s = ''; for(let k = 0; k < cs.length; k++) s += cs[k] + ':' + cs.getPropertyValue(cs[k]) + ';'; rows.push(s); }
    out.push([keyOf(el), idx, rows]);
  });
  return out;
}"""
SWAP = r"""(css) => { const st = [...document.querySelectorAll('style')].find(s => s.textContent.length > 50000); st.textContent = css; return true; }"""

def props_of(row):
    return dict(x.split(':', 1) for x in row.split(';') if ':' in x)

SUSPECTS = r"""([idx, sels]) => { const all = [...document.querySelectorAll('*')], out = new Set();
  for(const i of idx){ const el = all[i]; if(!el) continue;
    sels.forEach(([k, s]) => { try { if(el.matches(s) || el.closest(s) || el.querySelector(s)) out.add(k); } catch(e){} }); }
  return [...out]; }"""

async def verify(b, css_new, sels=()):
    """Every state: computed styles before and after the swap. Returns ({state: [(element index, pseudo, [props])]},
    the candidates whose rules touch a differing element: on it, around it or inside it)."""
    bad, suspects = {}, set()
    for name, size, steps in A.STATES:
        ctx, page = await A.open_state(b, name, size, steps)
        # the page moves on its own (previews arriving, a line of work shown): the new sheet is bracketed by the
        # old one, before and after, and only what differs from BOTH is the new sheet's doing
        css_old = await page.evaluate("() => [...document.querySelectorAll('style')].find(s => s.textContent.length > 50000).textContent")
        before = await page.evaluate(SNAPSHOT)
        await page.evaluate(SWAP, css_new); await asyncio.sleep(0.3)
        after = await page.evaluate(SNAPSHOT)
        await page.evaluate(SWAP, css_old); await asyncio.sleep(0.3)
        again = await page.evaluate(SNAPSHOT)
        diffs = []
        B = { k: r for k, _, r in before }; G = { k: r for k, _, r in again }
        for key, i, y in after:
            # (an element only one snapshot has came or went on its own: the page's doing, not the sheet's)
            if key not in B: continue
            x = B[key]
            if x == y or (key in G and G[key] == y): continue
            if x is None or y is None: diffs.append((i, 'drawn', ['(shown or hidden)'])); continue
            for k, ps in enumerate(['', '::before', '::after']):
                if x[k] != y[k]:
                    px, py = props_of(x[k]), props_of(y[k])
                    diffs.append((i, ps, sorted(p for p in set(px) | set(py) if px.get(p) != py.get(p))))
        if diffs:
            bad[name] = diffs
            await page.evaluate(SWAP, css_new)
            suspects |= set(await page.evaluate(SUSPECTS, [[d[0] for d in diffs if d[0] >= 0], list(sels)]))
            await page.evaluate(SWAP, css_old)
        await ctx.close()
    return bad, suspects

async def main():
    write = '--write' in sys.argv
    css = open(CSS_PATH).read()
    rules = parse(css)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--no-sandbox'])
        print('auditing…', file=sys.stderr)
        seen = await A.audit(b, quiet=True)
        ctx, page = await A.open_state(b, 'map', (1280, 800), [])
        cssom = await page.evaluate(CSSOM_RULES)
        style_rules = [r for r in rules if r[0] == 'style']
        all_decls = [(d[0], d[1]) for r in style_rules for d in r[3]]
        norm = await page.evaluate(NORMALIZE, { 'sels': [r[1] for r in style_rules], 'decls': all_decls })
        await ctx.close()
        # align the source's style rules to the CSSOM's by their normalized selectors
        src_keys = [s or '__invalid__' for s in norm['sels']]
        om_keys = [s for _, s in cssom]
        path_of = {}
        for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, src_keys, om_keys, autojunk=False).get_opcodes():
            if tag == 'equal':
                for k in range(i2 - i1): path_of[i1 + k] = cssom[j1 + k][0]
        longs = iter(norm['longs'])
        cands, kept_reason = [], {}
        for ri, r in enumerate(style_rules):
            ds = r[3]; L = [next(longs) for _ in ds]
            props = [d[0] for d in ds]
            twice = {pp for pp in props if props.count(pp) > 1}
            path = path_of.get(ri)
            for d, lh in zip(ds, L):
                prop, val, s0, e0, imp = d
                if prop in twice: continue
                if r[1].strip() == ':root' and prop.startswith('--'): continue
                if not lh:
                    cands.append((s0, e0, r[1], prop, val, [], 'the browser cannot parse it')); continue
                if not path or any(re.match(r'(transition|animation)', x) for x in lh): continue
                recs = [seen.get(path + '|' + x) for x in lh]
                if all(rec and rec['matched'] and not rec['effective'] and not rec.get('wins') for rec in recs):
                    cands.append((s0, e0, r[1], prop, val, lh, 'overridden in every state'))
        print(f'{len(cands)} candidate declarations; verifying…', file=sys.stderr)
        if '--dump' in sys.argv:
            json.dump({ 'cands': [list(c) for c in cands], 'path_of': { str(k): v for k, v in path_of.items() }, 'seen': seen }, open(sys.argv[sys.argv.index('--dump') + 1], 'w'))
            await b.close(); return
        keep = set()
        bad = True
        for rnd in range(8):
            take = [c for i, c in enumerate(cands) if i not in keep]
            out, last = [], 0
            for s0, e0, *_ in sorted(take):
                out.append(css[last:s0]); last = e0
            out.append(css[last:]); new = ''.join(out)
            new = re.sub(r'\{\s*\}', '{}', new)
            bad, suspects = await verify(b, new, [(i, c[2].split('::')[0]) for i, c in enumerate(cands) if i not in keep])
            if not bad: break
            changed = set()
            for st, diffs in bad.items():
                for _, _, ps in diffs: changed |= set(ps)
            back = [i for i, c in enumerate(cands) if i not in keep and (set(c[5]) & changed or not c[5])]
            # a change in what an element is drawn as (its tracks, its size) comes from a rule on it, around it or in it
            if not back: back = sorted(suspects)
            print(f'  round {rnd + 1}: {sum(len(v) for v in bad.values())} differences in {len(bad)} states ({", ".join(sorted(changed))[:200]}); putting back {len(back)}', file=sys.stderr)
            if not back:
                print('  differences no candidate explains: nothing is written', file=sys.stderr)
                for st, diffs in list(bad.items())[:4]: print('   ', st, diffs[:3], file=sys.stderr)
                write = False; keep |= set(range(len(cands))); break
            keep |= set(back)
        await b.close()
    removed = [c for i, c in enumerate(cands) if i not in keep]
    print(f'\nREMOVED ({len(removed)}), verified: no drawn element in any state computes differently')
    for s0, e0, sel, prop, val, lh, why in removed:
        line = css.count('\n', 0, s0) + 1
        print(f'  {line:5}  {sel[:60]} {{ {prop}: {val[:40]} }}   ({why})')
    if write and not bad:
        # drop rules left empty, and their now-orphaned blank lines
        new = re.sub(r'(?m)^[^\n{}@]*\{(?:\s|/\*(?:[^*]|\*(?!/))*\*/)*\}[ \t]*\n', '', new)   # a rule left with nothing but comments
        open(CSS_PATH, 'w').write(new)
        print(f'\nwrote {CSS_PATH}: {len(css.splitlines())} → {len(new.splitlines())} lines')

asyncio.run(main())
