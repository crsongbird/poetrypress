/**
 * mobileLayout.test.mjs — runs appEvents.js as if on a phone, so the
 * mobile branch is actually executed rather than assumed correct.
 *
 * Run: node test/mobileLayout.test.mjs
 */
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock, installMobileEnv } from './domMock.mjs';

installCanvasMock();
const registry = installDomMock(makeMockContext, makeMockCanvas);
const { panels, buttons, bodyClasses } = installMobileEnv(registry);

let threw = null;
try { await import('../appEvents.js'); } catch(e){ threw = e; }

let failures = 0;
const check = (label, cond) => { cond ? console.log('ok:', label) : (failures++, console.log('FAIL:', label)); };

check('appEvents.js boots on a mobile device without throwing', threw === null);
if(threw) console.log('  threw:', threw.stack || threw.message);

check('body gets the is-mobile class', bodyClasses.has('is-mobile'));
// 14 = Inscription 2, Rituals 2, Thoughtforms 2, Materia 4, Esoterica 4
// (Esoterica gained the Appearance card)
check('every card was found as a tab panel', panels.length === 14);
check('all five tab buttons were found', buttons.length === 5);
check('preset grid still populated on mobile', registry['presetGrid'].children.length === 16);

// Write is the landing tab
const writePanels = panels.filter(p => p.dataset.tab === 'write');
check('Write panels are visible on load', writePanels.every(p => p.classList.contains('tab-active')));
check('other panels are hidden on load', panels.filter(p => p.dataset.tab !== 'write').every(p => !p.classList.contains('tab-active')));
check('Write button is marked active on load', buttons.find(b => b.dataset.tab === 'write').classList.contains('active'));

// switching tabs actually swaps which panels show
buttons.find(b => b.dataset.tab === 'page').dispatchEvent({ type: 'click' });
check('tapping Page reveals the Page panels', panels.filter(p => p.dataset.tab === 'page').every(p => p.classList.contains('tab-active')));
check('tapping Page hides the Write panels', writePanels.every(p => !p.classList.contains('tab-active')));
check('only one tab button is active at a time', buttons.filter(b => b.classList.contains('active')).length === 1);

// every tab must own at least one panel, or it would open to an empty screen
const tabsWithPanels = new Set(panels.map(p => p.dataset.tab));
const orphans = buttons.map(b => b.dataset.tab).filter(t => !tabsWithPanels.has(t));
check('no tab button opens to an empty screen', orphans.length === 0);
if(orphans.length) console.log('  orphan tabs:', orphans);

// --- viewport math: the actual bug from the phone screenshot ---
// A 360x800 Android phone showing a bottom URL bar has innerHeight 800 but
// only ~670 visible. Sizing from vh would hand the preview 32% of 800 while
// the user can only see 670 -- which is how the preview ended up eating half
// the screen and pushing controls under the tab bar.
const vars = global.__cssVars;
check('--vvh is set from measured visible height, not innerHeight',
  vars['--vvh'] === '670px');
check('URL-bar shrinkage alone is NOT treated as a keyboard',
  vars['--kb-height'] === '0px');

// now actually focus a textarea and shrink further, as a real keyboard would
global.document.activeElement = { tagName: 'TEXTAREA' };
global.window.visualViewport.height = 380;
global.window.visualViewport._fire();
check('a focused field plus real shrinkage IS treated as a keyboard',
  vars['--kb-height'] === '290px');
check('keyboard-open class is set while typing', bodyClasses.has('keyboard-open'));

// blur again; the bar must come back down
global.document.activeElement = null;
global.window.visualViewport.height = 670;
global.window.visualViewport._fire();
check('closing the keyboard returns the bar to the bottom', vars['--kb-height'] === '0px');

console.log();
console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
