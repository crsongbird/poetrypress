"""
tools/fit-audit.py — does every control fit its panel, at every width?

Ruby, from a phone: with hints written out, a hint beside a row of buttons
pushed the Materia card past the screen, and the panel slid sideways. This
opens every tab at phone widths and on a desk, with the hints written out and
every card and sub-section unfolded, and names anything that reaches past the
panel it scrolls in (a textarea's own scrolling aside). It prints nothing but
the widths when all is well.

    pip install playwright && python -m playwright install chromium
    node build.mjs && python3 tools/fit-audit.py [path/to/dist/index.html]
"""
import sys, os, asyncio
from playwright.async_api import async_playwright
URL = 'file://' + os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'dist', 'index.html'))
CHROME = os.environ.get('CHROME')   # optional: a specific Chromium binary
TABS = ['write', 'style', 'type', 'page', 'more']
WIDTHS = [(360, True), (412, True), (1280, False)]   # the narrowest common phone, the baseline phone (§1 rule 8), a desk
FIND = """() => { const out = [];
  for(const e of document.querySelectorAll('.controls *')){ if(e.offsetParent === null || e.closest('textarea')) continue;
    const r = e.getBoundingClientRect(); if(!r.width) continue;
    let q = e.parentElement; while(q && getComputedStyle(q).overflowX === 'visible') q = q.parentElement; if(!q) continue;
    const over = r.right - q.getBoundingClientRect().right;
    if(over > 1 && ![...e.children].some(c => c.getBoundingClientRect().right - q.getBoundingClientRect().right > 1))
      out.push(`${Math.round(over)}px past: ${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${[...e.classList].map(c => '.' + c).join('')} “${(e.textContent || '').trim().slice(0, 48)}”`); }
  return out; }"""
async def main():
    bad = 0
    async with async_playwright() as p:
        b = await p.chromium.launch(**({'executable_path': CHROME} if CHROME else {}), args=['--no-sandbox', '--allow-file-access-from-files'])
        for w, phone in WIDTHS:
            ctx = await b.new_context(viewport={'width': w, 'height': 860}, is_mobile=phone, has_touch=phone)
            await ctx.route('**/fonts.gstatic.com/**', lambda r: r.abort())
            page = await ctx.new_page()
            await page.goto(URL, wait_until='load'); await page.evaluate("localStorage.setItem('uv.hints.on', '1')")
            await page.reload(wait_until='load'); await asyncio.sleep(2)
            for t in TABS:
                await page.click(f'.tab-btn[data-tab="{t}"]')
                await page.evaluate("document.querySelectorAll('.controls details').forEach(d => d.open = true); document.querySelectorAll('.controls .subblock').forEach(d => d.classList.add('open'))")
                await asyncio.sleep(0.4)
                found = await page.evaluate(FIND)
                print(f'{w:5}px {t:6} ' + ('fits' if not found else f'{len(found)} reach past their panel'))
                for f in found[:12]: print('        ' + f)
                bad += len(found)
            await ctx.close()
        await b.close()
    sys.exit(1 if bad else 0)
asyncio.run(main())
