/**
 * uiWorking.js — the quiet line over the image while something slow is being made
 *
 * Split from appEvents.js (its wiring, the listeners, stays there, in the order it runs).
 */
import { $ } from './appOptions.js';
import { workingLine } from './appEvents.js';

// While something slow is being made, a quiet line over the image says what —
// each true to what is actually happening, put the way a workshop would
// ("Convolving the bokeh" is literally what Dream Bloom does). It waits a
// moment before it shows (fast work never flickers it) and stays a moment
// once shown; it and the shimmer above it keep moving even while the page
// itself is busy (they run on the compositor).
const WORKING_WORDS = {
  veins: 'Weaving the network', circuit: 'Routing the traces', knotwork: 'Plaiting the knot', lichtenberg: 'Striking the arc', growth: 'Growing the line',
  plainnoise: 'Stirring the noise', stripes: 'Ruling the stripes', polka: 'Spotting the dots', checker: 'Laying the squares', softgradient: 'Grading the light', cells: 'Growing the cells',
  bokeh: 'Convolving the bokeh', astral: 'Counting the stars', astral_fog: 'Thickening the nebula', astral_stars: 'Counting the stars',
  clouds: 'Folding the haze', magicparticles: 'Scattering the dust', embers: 'Throwing sparks', snow: 'Letting the snow settle',
  aurora: 'Combing the silk', aurorasky: 'Hanging the curtains of light', moon: 'Iterating the moon', landscape: 'Priming the canvas', flowfield: 'Tracing the flow lines',
  suminagashi: 'Floating the ink', grain: 'Developing the grain', metalleaf: 'Laying the leaf', flowers: 'Opening the lotuses', feathers: 'Letting the feathers fall', corvids: 'Gathering the crows’ feathers', dappled: 'Hanging the leaves', windowlight: 'Opening the window', lightleaks: 'Letting the light in', caustics: 'Rippling the water',
  brushstrokes: 'Loading the brush', halftone: 'Screening the dots', rainstreaks: 'Driving the rain', hatch: 'Hatching the shadows',
  cityscape: 'Lighting the windows', guilloche: 'Turning the rose engine', stainedglass: 'Leading the glass', underglass: 'Wiping the glass', brokenglass: 'Sweeping up the glass', dewwebs: 'Beading the silk', sigils: 'Inscribing the sigils',
  mathnoise: 'Flipping the bits', summoning: 'Chalking the circle', inkbleed: 'Folding the blot', crackedglaze: 'Firing the glaze', crackle: 'Letting the glaze crack',
  tessellate: 'Cutting the facets', cards: 'Shuffling the deck', blackhole: 'Bending the light', pixelspace: 'Placing the pixels', webb: 'Unfolding the mirror', inkscroll: 'Grinding the ink', windsea: 'Raising the sail', botline: 'Inking the stems', ditsy: 'Printing the cloth', macro: 'Focusing the lens', meadow: 'Walking into the meadow', petals: 'Letting the petals fall', bouquets: 'Gathering the flowers', imprints: 'Pressing the flowers', liminal: 'Finding the way back', turing: 'Letting the reaction diffuse',
  chladni: 'Bowing the plate', linen: 'Weaving the warp', coldpress: 'Pressing the paper', spangle: 'Galvanising the steel',
  crystal: 'Growing the crystals', drapery: 'Hanging the cloth', oldpaper: 'Ageing the paper', cupring: 'Setting down the cup', ash: 'Burning the letter',
  wax: 'Pouring the wax', dunes: 'Letting the wind shape the dunes', kintsugi: 'Mending with gold', moss: 'Growing the moss',
  water: 'Stilling the pool', glassrain: 'Beading the glass', rainwater: 'Letting the rain fall', ringpaint: 'Painting the ring', skyring: 'Hanging the ring', frost: 'Growing the frost', contour: 'Surveying the contours',
  watercolour: 'Wetting the wash', athanor: 'Stoking the athanor', athanorsteps: 'Showing each step', saving: 'Pressing the page at full size',
};
let workShowT = 0, workHideT = 0, workShownAt = 0;
export function setWorking(what){
  if(!workingLine || !workingLine.classList) return;
  clearTimeout(workShowT); clearTimeout(workHideT);
  // (the Athanor, over the page, shows the same words over its preview)
  const fw = $('forgeWorking'), both = f => { f(workingLine); if(fw && fw.classList) f(fw); };
  if(what){
    const words = WORKING_WORDS[what] || 'Making the surface';
    workShowT = setTimeout(() => { both(el => { el.textContent = words + '…'; el.classList.add('on'); }); workShownAt = Date.now(); }, 400);
  } else {
    const stay = Math.max(0, 700 - (Date.now() - workShownAt));
    workHideT = setTimeout(() => both(el => el.classList.remove('on')), workingLine.classList.contains('on') ? stay : 0);
  }
}
