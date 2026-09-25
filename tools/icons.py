"""
tools/icons.py — every drawn glyph and icon, generated from one place.

    python3 tools/icons.py

Writes the navigation glyphs and the Vellum sigil into index.html, and the
app icons into icons/. Re-run after editing a shape below.

THE HAND: each stroke is drawn several times, each copy nudged a little, the
way a pen goes over a line it isn't sure of. Jitter is seeded, so a build is
reproducible, and it is path-aware: arc commands keep their radii, rotation
and 0/1 flags, and only their endpoints move. (An earlier version nudged every
number, flags included, which produces arcs some renderers reject.)
"""
import re, random, os, zlib

LAYERS = 4                     # how many times the hand goes over each stroke
JITTER = 0.55                  # how far, in 24-unit viewBox space
WHIMSY = ['#E0526F', '#9B7FE8', '#6FA8FF', '#C9A0FF']   # red, purple, blue, lilac

NUM = r'-?\d*\.?\d+(?:e-?\d+)?'

def jitter_path(d, rng, amt):
    """Nudge a path's coordinates, leaving arc flags and radii alone."""
    out = []
    for cmd, args in re.findall(r'([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)', d):
        nums = re.findall(NUM, args)
        if cmd in 'Aa':
            moved = []
            for i in range(0, len(nums), 7):
                g = nums[i:i+7]
                if len(g) == 7:
                    g[5] = f'{float(g[5]) + rng.uniform(-amt, amt):.2f}'
                    g[6] = f'{float(g[6]) + rng.uniform(-amt, amt):.2f}'
                moved += g
            nums = moved
        elif cmd not in 'Zz':
            nums = [f'{float(n) + rng.uniform(-amt, amt):.2f}' for n in nums]
        out.append(cmd + ' '.join(nums))
    return ''.join(out)

def hand(shapes, colours, seed, layers=LAYERS, amt=JITTER, width=1.6, opacity=None):
    """Draw each shape `layers` times. colours: one per layer ('currentColor'
    is fine). The first pass is the truest; later ones fade as the hand
    loosens."""
    rng = random.Random(seed)
    parts = []
    for L in range(layers):
        a = 0 if L == 0 else amt * (0.6 + 0.4 * L / max(1, layers - 1))
        # nav glyphs fade as the hand loosens; the sigil keeps every pass vivid
        op = opacity if opacity is not None else (1.0 if L == 0 else round(0.72 - 0.16 * (L - 1), 2))
        col = colours[L % len(colours)]
        for kind, spec in shapes:
            if kind == 'path':
                d = spec if L == 0 else jitter_path(spec, rng, a)
                parts.append(f'<path d="{d}" stroke="{col}" opacity="{op}"/>')
            elif kind == 'dot':           # a filled mark: drawn once, on the first pass
                if L == 0:
                    cx, cy, r = spec
                    parts.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{col}" stroke="none"/>')
            elif kind == 'ring':
                cx, cy, r = spec
                if L: cx += rng.uniform(-a, a); cy += rng.uniform(-a, a); r += rng.uniform(-a/2, a/2)
                parts.append(f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}" stroke="{col}" opacity="{op}"/>')
            elif kind == 'fill':           # filled polygon, drawn once
                if L == 0:
                    parts.append(f'<path d="{spec}" fill="{col}" stroke="none"/>')
    return ''.join(parts)

def svg(inner, size=None, width=1.6, extra=''):
    dim = f' width="{size}" height="{size}"' if size else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"{dim} fill="none" '
            f'stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"{extra}>{inner}</svg>')

# ---------------------------------------------------------------- nav glyphs
NAV = {
  'write': [('path', 'M6.6 4.2A2.5 2.5 0 0 1 9.1 6.7V9.1h5.9V6.6A2.5 2.5 0 1 1 17.5 9.1H15v5.9h2.4A2.5 2.5 0 1 1 15 17.4V15H9.1v2.4A2.5 2.5 0 1 1 6.6 15H9V9.1H6.6A2.5 2.5 0 0 1 6.6 4.2Z')],
  'style': [('path', 'M12 20.9 6.7 4.7 20.5 14.7H3.5L17.3 4.7Z'), ('ring', (12, 11.6, 9.6))],
  'type':  [('path', 'M4.4 4.6H19.6L12 15.9Z'), ('path', 'M12 7.4V12.4'),
            ('path', 'M2.4 16.1H21.6'), ('ring', (12, 20, 2.25))],
  'page':  [('path', 'M12 2.7 21.3 12 12 21.3 2.7 12Z'), ('fill', 'M12 7.9 16.1 12 12 16.1 7.9 12Z')],
  'more':  [('path', 'M12 2.9 19.9 7.5v9L12 21.1 4.1 16.5v-9Z'), ('path', 'M12 2.9v2.2M12 18.9v2.2'),
            ('ring', (12, 12, 3.3))],
}

# ---------------------------------------------------------------- the sigil
# The Vellum mark, from the diamond the header has always carried: an outer
# diamond, an inner one, the Thoughtforms bar through the middle, and a point
# at the heart. Each pass of the hand is a different whimsy hue — red, purple,
# blue, lilac — so where the passes separate, the colour splits.
SIGIL = [
  ('path', 'M12 1.9 21.9 12 12 22.1 2.1 12Z'),
  ('path', 'M12 7.1 16.9 12 12 16.9 7.1 12Z'),
  ('path', 'M12 4.4V19.6'),
  ('dot',  (12, 12, 1.25)),
]

# Drawn blue, lilac, purple, then red on top, every pass at the same
# strength: fading later passes turned the red into a muddy smudge.
SIGIL_ORDER = ['#6FA8FF', '#C9A0FF', '#9B7FE8', '#E0526F']
SIGIL_WIDTH = 0.95

def sigil(seed=9):
    strokes = [s for s in SIGIL if s[0] != 'dot']
    body = hand(strokes, SIGIL_ORDER, seed, layers=4, amt=0.9, opacity=0.88)
    return body + '<circle cx="12" cy="12" r="1.35" fill="#E0526F" stroke="none"/>'

# ---------------------------------------------------------------- build
ROSE_DEEP, ROSE_MID = '#161414', '#2D2A2A'

def app_icon(size, maskable=False):
    """The sigil on a Rosé ground. Maskable icons get a full-bleed ground and
    keep the mark inside the central 60%, since launchers crop to a circle or
    squircle of their own choosing."""
    import cairosvg
    inner = sigil()
    scale = 0.60 if maskable else 0.74
    pad = (1 - scale) / 2 * 24
    radius = 0 if maskable else 5.2
    bg = (f'<defs><radialGradient id="g" cx="50%" cy="42%" r="70%">'
          f'<stop offset="0" stop-color="{ROSE_MID}"/><stop offset="1" stop-color="{ROSE_DEEP}"/>'
          f'</radialGradient></defs><rect width="24" height="24" rx="{radius}" fill="url(#g)"/>')
    doc = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="{size}" height="{size}">{bg}'
           f'<g transform="translate({pad:.3f} {pad:.3f}) scale({scale})" fill="none" '
           f'stroke-width="{SIGIL_WIDTH / scale * 0.9:.3f}" stroke-linecap="round" stroke-linejoin="round">'
           f'{inner}</g></svg>')
    return cairosvg.svg2png(bytestring=doc.encode())

def build(root):
    import base64
    idx = os.path.join(root, 'index.html')
    html = open(idx, encoding='utf-8').read()

    # navigation glyphs: four passes of the hand, in the theme's own colour
    for tab, shapes in NAV.items():
        # a stable seed: Python's hash() changes every run, which would
        # redraw every glyph on every build
        # 0.85: at the nav's real size (~24px) anything gentler disappears
        inner = hand(shapes, ['currentColor'], seed=zlib.crc32(tab.encode()), amt=0.85)
        pat = re.compile(r'(data-tab="%s" type="button"[^>]*><span class="tab-ico"><svg[^>]*>)(.*?)(</svg>)' % tab, re.S)
        html, n = pat.subn(lambda m: m.group(1) + inner + m.group(3), html, count=1)
        assert n == 1, 'nav glyph not found: ' + tab

    # the header mark, replacing the diamond emoji
    mark = svg(sigil(), width=SIGIL_WIDTH).replace(
        '<svg ', '<svg class="vellum-sigil" aria-hidden="true" ', 1)
    html = re.sub(r'(<strong class="app-header-title"[^>]*>Unfixable Vellum)\s*(?:♦️|<svg class="vellum-sigil"[\s\S]*?</svg>)',
                  lambda m: m.group(1) + ' ' + mark, html, count=1)

    # favicon: the same mark, as an inline SVG so the single-file build keeps it
    fav = svg(sigil(), width=1.5).replace('viewBox="0 0 24 24"', 'viewBox="-1 -1 26 26"')
    fav_uri = 'data:image/svg+xml;base64,' + base64.b64encode(fav.encode()).decode()
    html = re.sub(r'<link rel="icon"[^>]*>', f'<link rel="icon" type="image/svg+xml" href="{fav_uri}">', html, count=1)
    html = re.sub(r'<title>[^<]*</title>', '<title>Unfixable Vellum</title>', html, count=1)
    open(idx, 'w', encoding='utf-8').write(html)

    # app icons
    out = os.path.join(root, 'icons'); os.makedirs(out, exist_ok=True)
    for size in (192, 512):
        open(os.path.join(out, f'icon-{size}.png'), 'wb').write(app_icon(size))
    open(os.path.join(out, 'icon-maskable-512.png'), 'wb').write(app_icon(512, maskable=True))
    open(os.path.join(out, 'apple-touch-icon.png'), 'wb').write(app_icon(180, maskable=True))
    open(os.path.join(out, 'sigil.svg'), 'w').write(svg(sigil(), width=SIGIL_WIDTH))
    return ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'sigil.svg']

if __name__ == '__main__':
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print('wrote:', ', '.join(build(root)))
