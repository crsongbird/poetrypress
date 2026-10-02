"""
tools/page-audit.py — does the WHOLE page look the same drawn small?

For every preset (texture seed fixed at 4242): render the page at the export
size and scale it down, then render it directly at 1024px with S = 1/3 (via
window.vellumDebug), and score the difference relative to the page's own
contrast — the same measure as tools/scale-audit.mjs, but for everything the
renderer draws: text, effects, box, border, bloom, grain, credit, spell.

    pip install playwright pillow && python -m playwright install chromium
    node build.mjs && python tools/page-audit.py [path/to/dist/index.html]
"""
import sys, os
URL = 'file://' + os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'dist', 'index.html'))
CHROME = os.environ.get('CHROME')   # optional: a specific Chromium binary
import asyncio, base64, io
from playwright.async_api import async_playwright
from PIL import Image, ImageChops, ImageStat
SNAP = "() => { const c=document.getElementById('poemCanvas'); const s=document.createElement('canvas'); s.width=1024; s.height=Math.round(1024*c.height/c.width); const x=s.getContext('2d'); x.imageSmoothingQuality='high'; x.drawImage(c,0,0,s.width,s.height); return s.toDataURL('image/png'); }"
img = lambda d: Image.open(io.BytesIO(base64.b64decode(d.split(',')[1]))).convert('L')
def score(a, b):
    A, B = a.resize((128,128), Image.LANCZOS), b.resize((128,128), Image.LANCZOS)
    diff = ImageStat.Stat(ImageChops.difference(A, B)).mean[0]
    m = ImageStat.Stat(A).mean[0]; px = A.tobytes(); spread = sum(abs(v-m) for v in px)/len(px)
    return diff, 100*diff/max(0.5, spread)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**({'executable_path': CHROME} if CHROME else {}), args=['--no-sandbox'])
        page = await (await b.new_context(viewport={'width':1100,'height':900})).new_page()
        await page.goto(URL, wait_until='load'); await asyncio.sleep(1.5)
        names = await page.evaluate("() => [...document.querySelectorAll('#presetGrid .preset-btn')].map(b => b.title || b.getAttribute('aria-label') || b.textContent.trim().slice(0,14))")
        rows = []
        for i, name in enumerate(names):
            await page.evaluate("""(i) => { window.vellumDebug.setRenderScale(1); const c=document.getElementById('poemCanvas'); c.width=3072; c.height=3072;
              document.querySelectorAll('#presetGrid .preset-btn')[i].click(); const sd=document.getElementById('textureSeedValue'); sd.value='4242'; sd.dispatchEvent(new Event('change',{bubbles:true})); }""", i)
            await asyncio.sleep(1.4); full = img(await page.evaluate(SNAP))
            await page.evaluate("() => { const c=document.getElementById('poemCanvas'); c.width=1024; c.height=1024; window.vellumDebug.setRenderScale(1/3); window.vellumDebug.render(); }")
            await asyncio.sleep(0.6); small = img(await page.evaluate(SNAP))
            d, rel = score(full, small); rows.append((rel, d, name))
        await page.evaluate("() => { window.vellumDebug.setRenderScale(1); const c=document.getElementById('poemCanvas'); c.width=3072; c.height=3072; window.vellumDebug.render(); }")
        rows.sort(reverse=True)
        print('preset              relative   structure')
        for rel, d, n in rows: print(f'{n[:18]:18} {rel:8.0f}%  {d:9.1f}   ' + ('fine' if rel <= 10 else 'close' if rel <= 25 else 'needs work'))
        await b.close()
asyncio.run(main())
