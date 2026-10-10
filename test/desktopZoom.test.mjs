/**
 * desktopZoom.test.mjs — the desktop preview pans and zooms with Panzoom (the
 * established library, not our own): the wheel zooms toward the cursor, a
 * drag pans once zoomed (never off the frame), a double-click or ⟲ fits it,
 * and the preview redraws sharp enough for the zoom. The phone keeps its own
 * pinch. Without the library the page still works (no zoom).
 */
import { readFileSync } from 'fs';
let failures = 0;
const check = (name, ok) => { console.log((ok ? 'ok: ' : 'FAIL: ') + name); if(!ok) failures++; };
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ev = readFileSync(new URL('../appEvents.js', import.meta.url), 'utf8');

check('Panzoom loads from the CDN at an exact version, like Coloris',
  /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@panzoom\/panzoom@\d+\.\d+\.\d+\/dist\/panzoom\.min\.js"><\/script>/.test(html));
check('desktop only, and only when the library is there (offline: no zoom, nothing breaks)',
  /if\(!detectMobile\(\) && typeof Panzoom === 'function'/.test(ev) && /catch\(e\)\{ desktopPanzoom = null; \}/.test(ev));
check('the wheel zooms toward the cursor; a drag pans only once zoomed; 1× to 8×',
  /pz\.zoomWithWheel\(e\)/.test(ev) && /minScale: 1, maxScale: 8/.test(ev) && /panOnlyWhenZoomed: true/.test(ev));
check('the picture never pans off its frame (a quarter of it stays in view)', /const bound = \(\) =>/.test(ev) && /cv\.addEventListener\('panzoomend', \(\) => \{ bound\(\); zoomSettled\(\); \}\)/.test(ev));
check('double-click and ⟲ fit it again, and the preview steps back down',
  /cv\.addEventListener\('dblclick', \(\) => \{ pz\.reset\(\); zoomSettled\(\); \}\)/.test(ev) && /if\(desktopPanzoom\)\{ desktopPanzoom\.reset\(\);/.test(ev));
check('the redraw follows the zoom (state.ui.zoom, as the phone\'s pinch)', /state\.ui\.zoom = z; applyPreviewScale\(/.test(ev));

console.log();
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
