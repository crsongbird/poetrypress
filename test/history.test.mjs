/**
 * history.test.mjs — undo and redo (AGENTS.md §5.7): ☋ and ☊ step the look's
 * history, and the poem's own when the poem was the last thing changed
 * (Saturn–Albiorix: on a phone nothing undid a cleared poem). Tested on the
 * booted app: type, wait for the step to be kept, undo, read the poem back.
 *
 * Run: node test/history.test.mjs
 */
import { installCanvasMock, makeMockContext, makeMockCanvas } from './canvasMock.mjs';
import { installDomMock } from './domMock.mjs';
import { check, done } from './harness.mjs';

installCanvasMock();
const reg = installDomMock(makeMockContext, makeMockCanvas);
await import('../appEvents.js');

const wait = ms => new Promise(r => setTimeout(r, ms));
const poem = reg['poemText'], undo = reg['undoBtn'], redo = reg['redoBtn'];
const type = t => { poem.value = t; poem.dispatchEvent({ type: 'input', target: poem }); };
const click = el => el.dispatchEvent({ type: 'click', target: el });

await wait(50);
const start = poem.value;
type('the first line of my own'); await wait(800);
type('the first line of my own\nand a second, longer line'); await wait(800);
check('typing is kept as steps: ☋ is ready', undo.disabled === false);
click(undo);
check('☋ steps the poem back one step', poem.value === 'the first line of my own');
click(redo);
check('☊ steps it forward again', poem.value === 'the first line of my own\nand a second, longer line');

// a big cut is kept at once, so one ☋ brings the whole poem back
type(''); await wait(30);
const toast = document.getElementById('toast');
const { PAGE_SAYS } = await import('../strings.js');
check('cutting most of the poem says so, with Undo', !!toast && !toast.hidden && toast.textContent === PAGE_SAYS.poemCut && (toast.children || []).some(c => c.textContent === PAGE_SAYS.undo));
click(undo);
check('one ☋ puts back what was cut', poem.value === 'the first line of my own\nand a second, longer line');


done();
