"""
tools/css-audit.py — which CSS declarations never do anything.

The stylesheet grew in layers: a rule written, later a better one below it,
the first left behind. This opens the built page in the states a person sees
(desk and phone, every tab, focus mode, Esoterica's drawer, the Athanor and
its wiki, each theme) and, for every declaration, takes it away and looks at
what changed. One that never changes anything, in any state, is OVERRIDDEN
(something later always wins) and can go. One whose selector matches nothing
in any state is UNMATCHED: dynamic, or dead; look before deleting.
Selectors with :hover, :focus and the like are never judged (no state here
can show them), nor are @keyframes, @font-face, the libraries' classes, or
transitions and animations (they are frozen while it looks, so a change
shows at once). A rule is judged only where it matches something drawn, but
every element it matches is watched: taking away a display:none shows what
it hid. Two longhands that only work together (overflow-x and -y) can each
look idle alone: css-prune.py's check catches those and puts them back.

    node build.mjs && python3 tools/css-audit.py [--json out.json]

Run it in a pruning pass (AGENTS.md §1 rule 12). The report names each
declaration by its selector and property; delete with care, render, look.
Haiku: / a rule beneath rules, / outvoted every morning, / still read by the phone
"""
import sys, os, json, asyncio, glob
from playwright.async_api import async_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
URL = 'file://' + os.path.join(ROOT, 'dist', 'index.html')
# Drawflow comes from a CDN this sandbox can't reach: point DRAWFLOW at an unpacked copy (npm pack drawflow@0.0.60)
DRAWFLOW = [os.environ['DRAWFLOW']] if os.environ.get('DRAWFLOW') else sorted(glob.glob('/tmp/**/package/dist/drawflow.min.js', recursive=True))

# every declaration of every style rule, with a stable path, tested in the page as it stands
PROBE = r"""() => {
  const DYNAMIC = /:(hover|focus|focus-visible|focus-within|active|visited|target|checked|indeterminate|placeholder-shown|disabled|enabled|invalid|valid|empty|fullscreen|modal|-webkit-[\w-]+|-moz-[\w-]+)|::?(-webkit-[\w-]+|-moz-[\w-]+|placeholder|selection|backdrop|marker|file-selector-button)/;
  const LIB = /\.(clr-|drawflow|panzoom)|#clr-|\.connection|\.main-path|\.point|\.input\b|\.output\b|\.inputs\b|\.outputs\b|\.drawflow-node|\.parent-node/;
  const out = {};
  // transitions would hide a change (the computed value is still the old one, mid-transition): freeze them.
  // (transitions and animations themselves can't be judged this way: they are left out)
  const freeze = document.createElement('style'); freeze.id = '__audit_freeze';
  freeze.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}';
  document.head.appendChild(freeze);
  const walk = (rules, path, media) => {
    for(let i = 0; i < rules.length; i++){
      const r = rules[i], p = path + '/' + i;
      if(r.cssRules && (r instanceof CSSMediaRule || r instanceof CSSSupportsRule || (window.CSSLayerBlockRule && r instanceof CSSLayerBlockRule))){
        const active = !(r instanceof CSSMediaRule) || matchMedia(r.conditionText || r.media.mediaText).matches;
        walk(r.cssRules, p, (media ? media + ' ' : '') + (r.conditionText || (r.media && r.media.mediaText) || '') + (active ? '' : ' [inactive]'));
        continue;
      }
      if(!(r instanceof CSSStyleRule)) continue;
      const sel = r.selectorText;
      if(DYNAMIC.test(sel) || LIB.test(sel)) continue;
      const inactive = / \[inactive\]/.test(media || '');
      // split the list; a pseudo-element is read with getComputedStyle's second argument
      const parts = sel.split(/,(?![^()]*\))/).map(s => s.trim());
      const targets = [];
      for(const s of parts){
        const m = s.match(/::?(before|after|first-line|first-letter)$/);
        const base = m ? s.slice(0, m.index) : s;
        let els = []; try { els = [...document.querySelectorAll(base || '*')]; } catch(e){ els = []; }
        // every element it matches is watched (taking away a display:none shows what it hid), but a rule is
        // judged only where it matches something drawn: a closed modal in every state shows nothing about it
        for(const el of els) targets.push([el, m ? '::' + m[1] : null, el.getClientRects().length > 0]);
      }
      const decls = [];
      for(let k = 0; k < r.style.length; k++) decls.push(r.style[k]);
      for(const prop of decls){
        const key = p + '|' + prop;
        const rec = out[key] = { sel, prop, media: media || '', matched: targets.some(t => t[2]) && !inactive && !/^(transition|animation)/.test(prop), effective: false };
        if(!rec.matched) continue;
        // put the rule back by its whole text: a shorthand written with var() reports its longhands as '',
        // and setting a longhand back to '' would delete it (and spoil every reading after it)
        const saved = r.style.cssText, prio = r.style.getPropertyPriority(prop);
        const read = () => targets.map(([el, ps]) => getComputedStyle(el, ps).getPropertyValue(prop));
        const before = read();
        r.style.removeProperty(prop);
        const after = read();
        r.style.cssText = saved;
        rec.effective = before.some((v, i) => v !== after[i]);
        if(rec.effective) continue;
        // taking it away changed nothing: does it WIN and merely repeat what would be there anyway (redundant),
        // or does something else always win over it (overridden)? Give it other values and see if they show.
        const probes = prop.startsWith('--') ? ['__probe__'] : ['initial', 'inherit', 'unset'];
        for(const v of probes){
          r.style.setProperty(prop, v, prio);
          const got = read();
          r.style.cssText = saved;
          if(got.some((x, i) => x !== before[i])){ rec.wins = true; break; }
        }
      }
    }
  };
  [...document.styleSheets].filter(sh => sh.ownerNode !== freeze).forEach((sh, i) => { let rules; try { rules = sh.cssRules; } catch(e){ return; } if(sh.href && !/index\.html|poetrypress\.css/.test(sh.href)) return; walk(rules, 's' + i, ''); });
  freeze.remove();
  return out;
}"""

OPEN = "document.querySelectorAll('details').forEach(d => d.open = true)"   # every card open, so what is inside is drawn
STATES = [
  # (name, viewport, steps): steps are JS run in the page, in order, each followed by a short settle
  ('desk · Inscription', (1280, 800), [OPEN]),
  ('desk · Rituals', (1280, 800), ["document.querySelector('.tab-btn[data-tab=style]').click()", OPEN]),
  ('desk · Thoughtforms', (1280, 800), ["document.querySelector('.tab-btn[data-tab=type]').click()", OPEN]),
  ('desk · Materia', (1280, 800), ["document.querySelector('.tab-btn[data-tab=page]').click()", OPEN]),
  ('desk · Esoterica drawer', (1280, 800), ["document.querySelector('.tab-btn[data-tab=more]').click()", OPEN]),
  # opened and closed again: the drawer is still in the page, and must hide (a rule only this state shows)
  ('desk · Esoterica drawer closed', (1280, 800), ["document.querySelector('.tab-btn[data-tab=more]').click()", "document.querySelector('.tab-btn[data-tab=page]').click()"]),
  ('desk · narrow', (980, 760), ["document.querySelector('.tab-btn[data-tab=page]').click()"]),
  ('desk · the Athanor', (1280, 800), ["document.getElementById('athanorTopBtn').click()"]),
  ('desk · the wiki', (1280, 800), ["document.getElementById('athanorTopBtn').click()", "document.getElementById('forgeHelpBtn') && document.getElementById('forgeHelpBtn').click()"]),
  ('desk · Vellum (light)', (1280, 800), ["document.documentElement.setAttribute('data-theme','vellum')"]),
  ('desk · Aether', (1280, 800), ["document.documentElement.setAttribute('data-theme','aether')"]),
  ('desk · Fathom', (1280, 800), ["document.documentElement.setAttribute('data-theme','fathom')"]),
  ('phone · Inscription', (412, 915), [OPEN]),
  ('phone · Rituals', (412, 915), ["document.querySelector('.tab-btn[data-tab=style]').click()", OPEN]),
  ('phone · Thoughtforms', (412, 915), ["document.querySelector('.tab-btn[data-tab=type]').click()", OPEN]),
  ('phone · Materia', (412, 915), ["document.querySelector('.tab-btn[data-tab=page]').click()", OPEN]),
  ('phone · Esoterica', (412, 915), ["document.querySelector('.tab-btn[data-tab=more]').click()", OPEN]),
  ('phone · focus mode', (412, 915), ["document.body.classList.add('focus-mode')"]),
  ('phone · the Athanor', (412, 915), ["document.getElementById('athanorTopBtn').click()"]),
  ('phone · the wiki', (412, 915), ["document.getElementById('athanorTopBtn').click()", "document.getElementById('forgeHelpBtn') && document.getElementById('forgeHelpBtn').click()"]),
  ('phone · Vellum (light)', (412, 915), ["document.documentElement.setAttribute('data-theme','vellum')"]),
  ('tablet', (900, 1200), ["document.querySelector('.tab-btn[data-tab=page]').click()"]),
]

async def open_state(b, name, size, steps, css=None):
    """A fresh page in one state (optionally with another stylesheet in place of the page's own)."""
    w, h = size
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, is_mobile=w < 600, has_touch=w < 600)
    page = await ctx.new_page()
    async def route(r):
        u = r.request.url
        if 'drawflow.min.js' in u and DRAWFLOW: await r.fulfill(path=DRAWFLOW[0], content_type='text/javascript')
        elif 'drawflow.min.css' in u and DRAWFLOW: await r.fulfill(path=DRAWFLOW[0].replace('.min.js', '.min.css'), content_type='text/css')
        elif u.startswith('http'): await r.abort()
        else: await r.continue_()
    await page.route('**/*', route)
    await page.goto(URL, wait_until='load'); await asyncio.sleep(1.2)
    for s in steps:
        try: await page.evaluate('() => { ' + s + ' }')
        except Exception as e: print('  (state', name, 'step failed:', str(e)[:80], ')', file=sys.stderr)
        await asyncio.sleep(0.8)
    return ctx, page

async def audit(b, quiet=False):
    """Every declaration, judged across every state: matched, effective (taking it away changes something), wins."""
    seen = {}
    for name, size, steps in STATES:
        ctx, page = await open_state(b, name, size, steps)
        res = await page.evaluate(PROBE)
        for k, r in res.items():
            a = seen.setdefault(k, { **r, 'matched': False, 'effective': False, 'states': [] })
            a['matched'] = a['matched'] or r['matched']
            if r['effective']: a['effective'] = True; a['states'].append(name)
            if r.get('wins'): a['wins'] = True
        if not quiet: print(f'  {name}: {sum(1 for r in res.values() if r["matched"])} declarations matched, {sum(1 for r in res.values() if r["effective"])} doing something', file=sys.stderr)
        await ctx.close()
    return seen

def classify(seen):
    quiet = [r for r in seen.values() if r['matched'] and not r['effective']]
    # :root's custom properties are the page's colors before theme.js sets data-theme: fallbacks, kept
    over = [r for r in quiet if not r.get('wins') and not (r['sel'].strip() == ':root' and r['prop'].startswith('--'))]
    redundant = [r for r in quiet if r.get('wins')]
    unmatched = [r for r in seen.values() if not r['matched']]
    return over, redundant, unmatched

async def main():
    out_json = sys.argv[sys.argv.index('--json') + 1] if '--json' in sys.argv else None
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--no-sandbox'])
        seen = await audit(b)
        await b.close()
    over, redundant, unmatched = classify(seen)
    if out_json:
        json.dump({ 'overridden': over, 'redundant': redundant, 'unmatched': unmatched }, open(out_json, 'w'), indent=1)
    print(f'\nREDUNDANT ({len(redundant)}): they win, but only repeat what is there anyway (inherited or the default): harmless, tidy when near')
    print(f'\nOVERRIDDEN ({len(over)}): something else always wins over them, in every state: tools/css-prune.py removes them, verified')
    for r in over: print(f"  {r['sel'][:90]}  {{ {r['prop']} }}" + (f"   @ {r['media']}" if r['media'] else ''))
    print(f'\nUNMATCHED ({len(unmatched)}): matched nothing drawn in any state (dynamic, or dead: look first)')
    by = {}
    for r in unmatched: by.setdefault(r['sel'], []).append(r['prop'])
    for s, props in by.items(): print(f"  {s[:100]}  ({len(props)})")

if __name__ == '__main__':
    asyncio.run(main())
