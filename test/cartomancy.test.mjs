/**
 * cartomancy.test.mjs — Cartomancy (cartomancy.js, cartomancyTable.js): a game
 * in progress dealt by the seed, what else lies on the table, and the parts it
 * shares with the Athanor (Table, Card Deal, Coins). Its picture is guarded by
 * the fingerprints; this checks the deal and the parts' shapes.
 *
 * Run: node test/cartomancy.test.mjs
 */
import { installCanvasMock } from './canvasMock.mjs';
import { check, done } from './harness.mjs';
installCanvasMock();
const C = await import('../cartomancy.js'), TT = await import('../cartomancyTable.js'), S = await import('../steps.js'), A = await import('../athanor.js'), CH = await import('../chains.js');

check('the seed picks one of the games (CARD_GAMES), each a game of its own', Object.keys(C.CARD_GAMES).length >= 11);
{
  const items = C.crtDeal('wager', 1000, 1000, { cw: 100, count: 1, scatter: 0, stakes: 1, suits: [0, 1], coinage: C.COINAGES[0] });
  check('a deal is a list of what lies where, by the game\'s rules (a wager: hands, five shared cards, a pot and every player\'s stack)',
    items.filter(i => i.kind === 'card').length >= 11 && items.some(i => i.kind === 'stack') && items.some(i => i.kind === 'coin'));
}
check('the table, the card stock and the coinage come from their own lists, each complete',
  Object.keys(C.TABLE_MATERIALS).length >= 8 && Object.keys(C.CARD_STOCKS).length >= 4 && C.COINAGES.length >= 6 && C.COINAGES.every(c => c.name && c.mark && C.COIN_METALS[c.metal]));
check('what else is on the table: at least sixteen kinds, each placed on the table', Object.keys(TT.TABLE_OBJECTS).length >= 16
  && TT.crtTableObjects([], 1000, 1000, 110, 1).every(o => o.kind === 'object' && o.x >= 0 && o.x <= 1000));
check('wear changes a card\'s outline: a tear cuts a corner; a ring stain cuts nothing', TT.crtCut({ kind: 'tear', corner: 2, size: 0.2, b: 0.5 }).corner === 2 && TT.crtCut({ kind: 'ring' }) === null);
check('its parts are the Athanor\'s: Table, Card Deal (a picture and four suit colors in; a picture and its mask out) and Coins, and Table and Deal paint at full size',
  S.STEPS.table && S.STEPS.deal && S.STEPS.coins && S.STEPS.deal.inTypes.slice(0, 5).join(',') === 'image,colour,colour,colour,colour' && S.STEPS.deal.outTypes.join(',') === 'image,field'
  && S.STEPS.coins.outTypes[1] === 'field' && typeof S.STEPS.table.paint === 'function' && typeof S.STEPS.deal.paint === 'function');
{
  const d = A.athanorStarter('cards').drawflow.Home.data;
  check('Cartomancy is a chain made by a canvas pass, and what the seed picks stays at "seed"',
    CH.TEXTURE_CHAINS.cards && CH.TEXTURE_CHAINS.cards.canvas && Object.values(d).some(n => n.name === 'deal' && n.data.game === 'seed'));
}

done();
