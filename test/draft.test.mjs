/**
 * draft.test.mjs — the poem in progress survives a dropped tab.
 *
 * Phones kill background tabs without an unload event, so the poem and its
 * look are kept as a DRAFT (localStorage uv.draft.v1: { poem, look, savedAt })
 * a moment after each change, and again when the page is hidden. At boot a
 * draft is put back through safeRestore, at the page shape it was left at;
 * no draft, or a draft that won't load, opens on the welcome page, exactly as
 * before. The look comes back whatever the poem is: an empty poem stays empty,
 * the welcome poem stays the welcome, and the surface chosen stays chosen
 * (Ruby, 2026-10-19: the controls showed the opening look's after a reload).
 *
 * Each boot runs in its own process (appEvents.js runs once per import), with
 * an in-memory localStorage handed over from the boot before.
 *
 * Run: node test/draft.test.mjs
 */
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const DRAFT_KEY = 'uv.draft.v1', FIRST_VISIT_KEY = 'uv.firstvisit.v1';

// ---------------- one boot (child process) ----------------
if(process.env.DRAFT_BOOT){
  const { installCanvasMock, makeMockContext, makeMockCanvas } = await import('./canvasMock.mjs');
  const { installDomMock } = await import('./domMock.mjs');
  const { WELCOME_POEM } = await import('../appOptions.js');
  const { readFileSync } = await import('fs');
  const store = new Map(Object.entries(JSON.parse(readFileSync(0, 'utf8') || '{}')));   // handed over on stdin (a big draft won't fit in the environment)
  const failWrites = process.env.DRAFT_FAIL_WRITES === '1';
  global.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { if(failWrites) throw new Error('QuotaExceededError'); store.set(k, String(v)); },
    removeItem: k => store.delete(k),
  };
  const winListeners = {};
  global.window = { addEventListener: (t, fn) => (winListeners[t] = winListeners[t] || []).push(fn) };
  installCanvasMock();
  installDomMock(makeMockContext, makeMockCanvas);
  let threw = null;
  try { await import('../appEvents.js'); } catch(e){ threw = String(e && e.stack || e); }
  const out = { threw, welcome: WELCOME_POEM, poemAtBoot: document.getElementById('poemText').value, textMarginAtBoot: document.getElementById('textMargin').value };
  try { document.getElementById('advancedRefreshBtn').dispatchEvent({ type: 'click' }); out.aspectAtBoot = JSON.parse(document.getElementById('advancedJson').value).aspect; } catch(e){}
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const act = process.env.DRAFT_ACT || '';
  if(!threw && act){
    // a person writes, and moves a look control
    document.getElementById('poemText').value = 'a draft the phone must not lose';
    document.getElementById('textMargin').value = '17';
    document.dispatchEvent({ type: 'input', target: document.getElementById('poemText') });
    document.dispatchEvent({ type: 'input', target: document.getElementById('textMargin') });
    out.savedAtOnce = store.has(DRAFT_KEY) && JSON.parse(store.get(DRAFT_KEY)).poem === document.getElementById('poemText').value;
    if(act === 'debounce') await wait(1300);
    if(act === 'hide'){ document.visibilityState = 'hidden'; document.dispatchEvent({ type: 'visibilitychange' }); }
    if(act === 'pagehide') (winListeners.pagehide || []).forEach(fn => fn({ type: 'pagehide' }));
  }
  await wait(50);
  out.store = Object.fromEntries([...store].filter(([, v]) => v.length < 100000));   // (a huge value would not flush before exit)
  console.log('BOOT ' + JSON.stringify(out));
  process.exit(0);
}

// ---------------- the checks ----------------
let failures = 0;
const check = (l, c) => { c ? console.log('ok:', l) : (failures++, console.log('FAIL:', l)); };
const self = fileURLToPath(import.meta.url);
function boot(store = {}, act = '', extra = {}){
  const r = spawnSync(process.execPath, [self], { encoding: 'utf8', timeout: 60000, input: JSON.stringify(store),
    env: { ...process.env, DRAFT_BOOT: '1', DRAFT_ACT: act, ...extra } });
  const line = (r.stdout || '').split('\n').find(l => l.startsWith('BOOT '));
  if(!line){ console.log('  (boot produced no result)\n' + (r.stderr || '').slice(-1500)); return { threw: 'no result', store: {} }; }
  const out = JSON.parse(line.slice(5));
  if(out.threw) console.log('  threw:', out.threw.slice(0, 600));
  return out;
}
const draftOf = store => { try { return JSON.parse(store[DRAFT_KEY]); } catch(e){ return null; } };

// 1. nothing kept: the welcome page, as always
const first = boot();
check('a first boot does not throw', first.threw === null);
check('with no draft, the welcome page opens', first.poemAtBoot === first.welcome);
check('the first visit is still marked once', first.store[FIRST_VISIT_KEY] === '1');
check('booting alone writes no draft', !(DRAFT_KEY in first.store));

// 2. the draft is written a moment after a change (debounced), not on every keystroke
const typed = boot({ [FIRST_VISIT_KEY]: '1' }, 'debounce');
check('the draft is not written on every keystroke', typed.savedAtOnce === false);
const d = draftOf(typed.store);
check('a moment after a change, the draft is kept', !!d);
check('the draft holds the poem', d && d.poem === 'a draft the phone must not lose');
check('the draft holds the look, made by serializeCurrentSettings', d && d.look && typeof d.look === 'object' && d.look.lookVersion !== undefined && String(d.look.textMargin) === '17');
check('the look in the draft carries no poem (the poem is kept beside it)', d && d.look && d.look.poemText === undefined);
check('the draft is dated', d && typeof d.savedAt === 'number' && d.savedAt > 0);

// 3. a phone that hides the tab: kept at once, no waiting for the debounce
const hidden = boot({ [FIRST_VISIT_KEY]: '1' }, 'hide');
check('hiding the page keeps the draft at once', (draftOf(hidden.store) || {}).poem === 'a draft the phone must not lose');
const gone = boot({ [FIRST_VISIT_KEY]: '1' }, 'pagehide');
check('pagehide keeps the draft at once', (draftOf(gone.store) || {}).poem === 'a draft the phone must not lose');

// 4. the round trip: the next visit opens on the draft, poem and look
const back = boot(typed.store);
check('a boot with a draft does not throw', back.threw === null);
check('the next visit opens on the draft poem', back.poemAtBoot === 'a draft the phone must not lose');
check('the next visit wears the draft look', String(back.textMarginAtBoot) === '17');

// 5. a draft of the welcome poem keeps the welcome poem, and the look it was left at (a surface tried on it stays)
const wel = boot({ [FIRST_VISIT_KEY]: '1', [DRAFT_KEY]: JSON.stringify({ poem: first.welcome, look: { ...((d && d.look) || {}), textMargin: 17 }, savedAt: 1 }) });
check('a draft that is the welcome poem opens the welcome poem', wel.poemAtBoot === first.welcome);
check('… at the look it was left at', String(wel.textMarginAtBoot) === '17');

// 6. a corrupt or failing draft falls back to the welcome page and never breaks boot
const corrupt = [
  ['unreadable JSON', '{"poem": "half a'],
  ['a look that is not a look', JSON.stringify({ poem: 'kept?', look: [1, 2], savedAt: 1 })],
  ['a look too large to load', JSON.stringify({ poem: 'kept?', look: { pad: 'x'.repeat(600 * 1024) }, savedAt: 1 })],
];
for(const [what, raw] of corrupt){
  const r = boot({ [FIRST_VISIT_KEY]: '1', [DRAFT_KEY]: raw });
  check(`a draft with ${what} does not break boot`, r.threw === null);
  check(`a draft with ${what} opens the welcome page`, r.poemAtBoot === r.welcome);
}

// 7. storage that refuses writes (private mode, quota): the app carries on
const full = boot({ [FIRST_VISIT_KEY]: '1' }, 'hide', { DRAFT_FAIL_WRITES: '1' });
check('a refused write does not throw', full.threw === null && !(DRAFT_KEY in full.store));

// 8. the first-visit examples are seeded exactly as before, draft or not
const fv = boot({ [DRAFT_KEY]: typed.store[DRAFT_KEY] });
check('a first visit with a draft still seeds the examples once', fv.store[FIRST_VISIT_KEY] === '1' && fv.poemAtBoot === 'a draft the phone must not lose');

// 9. the page's shape is the person's, and is kept between visits (Lain and Ruby)
{ const look = { ...((d && d.look) || {}), aspect: '1:1' };
  const shaped = boot({ [FIRST_VISIT_KEY]: '1', [DRAFT_KEY]: JSON.stringify({ poem: 'a square poem', look, savedAt: 1 }) });
  check('a draft reopens at the page shape it was left at', shaped.poemAtBoot === 'a square poem' && shaped.aspectAtBoot === '1:1' && first.aspectAtBoot !== '1:1'); }

// 10. an empty poem keeps its look: the surface, the sliders, the locks and the shape all come back, the page empty
{ const look = { ...((d && d.look) || {}), aspect: '1:1', locks: ['textMargin'] };
  const blank = boot({ [FIRST_VISIT_KEY]: '1', 'uv.theme.v1': 'aether', [DRAFT_KEY]: JSON.stringify({ poem: '  \n ', look, savedAt: 1 }) });
  check('a draft whose poem was left empty reopens empty, at its own look and shape',
    blank.threw === null && blank.poemAtBoot === '  \n ' && blank.aspectAtBoot === '1:1');
  check('…the theme as it was, and the draft kept', blank.store['uv.theme.v1'] === 'aether' && DRAFT_KEY in blank.store); }

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
