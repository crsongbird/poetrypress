/**
 * uiControls.js — the rest of the page's controls: the PML editor, text effects, border and vignette, the moon, frame and box, word seeds, theme, sounds, the Grimoire
 *
 * Split from appEvents.js (its wiring, the listeners, stays there, in the order it runs).
 */
import { $ } from './appOptions.js';
import { EFFECT_DEFS, legacyOutline, legacyTypeEffect } from './effects.js';
import { MODAL_RANGE } from './strings.js';
import { applyPersisted } from './uiLook.js';
import { paintMoons } from './uiLocks.js';
import { seedPhrase } from './seedWords.js';
import { setLabelText } from './uiDials.js';
import { state } from './uiState.js';
import { stitchSided } from './stitches.js';
import { pmlEditor, setColorField } from './appEvents.js';

export function repaintEditor(){ if(pmlEditor) pmlEditor.paint(); }
// Each slot is a type, a colour, two knobs whose labels follow the type (like
// the texture knobs), and an angle for effects with a direction.
export const EFFECT_SLOT_DEFAULTS = {};
export function syncFxSlot(i, resetToDefaults){
  const t = ($('fx'+i+'Type') || {}).value || 'none', d = EFFECT_DEFS[t] || EFFECT_DEFS.none;
  const show = (id, on) => { const el = $(id); if(el && el.style) el.style.display = on ? '' : 'none'; };
  show('fx'+i+'ColorField', !!d.color); show('fx'+i+'AngleField', d.angle != null);
  for(const k of ['K1', 'K2']){
    const def = d[k.toLowerCase()]; show('fx'+i+k+'Field', !!def);
    if(!def) continue;
    const el = $('fx'+i+k);
    if($('fx'+i+k+'Label')) setLabelText($('fx'+i+k+'Label'), def[0]);
    el.min = def[1]; el.max = def[2];
    if(resetToDefaults) el.value = def[3];
    if($('fx'+i+k+'Val')) $('fx'+i+k+'Val').textContent = el.value + def[4];
  }
  if(resetToDefaults){ if(d.color) setColorField('fx'+i+'Color', d.color); if(d.angle != null) $('fx'+i+'Angle').value = d.angle; }
  if($('fx'+i+'AngleVal')) $('fx'+i+'AngleVal').textContent = $('fx'+i+'Angle').value + '°';
}
export function syncAllFxSlots(){ for(const i of [1, 2, 3]) syncFxSlot(i, false); }
/** Older looks and presets: the Outline/Shadow mode and typeface effect, as slots. */
export function applyLegacyEffects(src){
  const stack = [], o = legacyOutline(src.outlineMode, src.outlineColor, src.outlineThickness, src.shadowBlur, src.shadowX, src.shadowY);
  if(o) stack.push(o);
  const t = legacyTypeEffect(src.typeEffect, src.typeEffectStrength, src.typeEffectColor, src.typeEffectAngle, src.typeEffectDistance, src.typeEffectGrain);
  if(t.fx) stack.push(t.fx);
  const vals = { ...EFFECT_SLOT_DEFAULTS, underAll: t.under ? t.under.style : '' };
  stack.slice(0, 3).forEach((fx, n) => { const i = n + 1;
    Object.assign(vals, { ['fx'+i+'Type']: fx.type, ['fx'+i+'Color']: fx.color, ['fx'+i+'K1']: String(fx.k1), ['fx'+i+'K2']: String(fx.k2), ['fx'+i+'Angle']: String(Math.round(((fx.angle % 360) + 360) % 360)) }); });
  applyPersisted(vals); syncAllFxSlots();
}
export const RANGE_UNITS = { borderGradientAngle:'°', bgRadialX:'%', bgRadialY:'%', bgRadialR:'%', borderThickness:'px', borderOffset:'px',
  borderGrain:'%', textureClearing:'%', textureShapeStrength:'%', borderRadius:'px', cardGradientAngle:'°', cardOffset:'px', cardThickness:'px', cardRadius:'px', cardFxAmount:'', cardFxScale:'' };
export function refreshReadouts(){
  for(const [id, unit] of Object.entries(RANGE_UNITS)){ const el = $(id), out = $(id + 'Val'); if(el && out) out.textContent = el.value + unit; }
  paintMoons();
}
/** Shows each control only when it applies. */
export function syncFrameVisibility(){
  const show = (id, on) => { const el = $(id); if(el && el.style) el.style.display = on ? '' : 'none'; };
  const bgType = ($('bgGradientType') || {}).value || 'linear';
  // the angle where a gradient has a direction; the centre where it has one; the radius for rings and boxes
  show('bgAngleField', ['linear', 'mirror', 'conic'].includes(bgType));
  for(const id of ['bgCenterXField','bgCenterYField']) show(id, ['radial', 'rect', 'conic'].includes(bgType));
  show('bgRadiusField', bgType === 'radial' || bgType === 'rect');
  show('textAngleField', ((($('textGradientType') || {}).value) || 'linear') !== 'radial');
  show('borderRadiusField', $('borderRounded') && $('borderRounded').checked);
  // sections open with the class the stylesheet keys on (.subblock.open);
  // setting display directly loses to that rule
  const card = $('cardToggle') && $('cardToggle').checked, grad = card && $('cardGradientToggle').checked;
  if($('cardBlock')) $('cardBlock').classList.toggle('open', !!card);
  const bgrad = $('borderGradientToggle') && $('borderGradientToggle').checked;
  show('borderColor2Field', bgrad); show('borderColor3Field', bgrad); show('borderAngleField', bgrad);
  for(const id of ['cardColor2Field','cardTypeField']) show(id, grad);
  show('cardAngleField', grad && ['linear', 'mirror', 'conic'].includes($('cardGradientType').value));
  show('cardRadiusField', $('cardRounded') && $('cardRounded').checked);
  // Points Outward? only where the stitch has a side to point (a solid line is the same either way); its tick is kept
  for(const [sel, box] of [['borderStitch', 'borderStitchOut'], ['cardStitch', 'cardStitchOut']]){
    const b = $(box), on = stitchSided((($(sel) || {}).value) || 'solid');
    if(b) b.disabled = !on; }
  // the glass's knobs only with glass, and the second named for what it moves
  const glass = ($('cardFx') && $('cardFx').value) || 'none';
  show('cardFxAmountField', glass !== 'none'); show('cardFxScaleField', glass !== 'none' && glass !== 'lens');
  const scaleName = { frost: 'Grit', reeded: 'Flute Width', pixel: 'Cell Size', emboss: 'Depth', prism: 'Split' }[glass];
  if($('cardFxScaleLabel') && scaleName) setLabelText($('cardFxScaleLabel'), scaleName);
}
// The seed field shows the seed's PHRASE (seedWords.js); the number itself
// stays in #textureSeedValue (what saves, shares and locks hold). Typing a
// phrase, a number or any words at all sets the number; whatever else sets
// it (a reroll, a preset, a load, undo) shows its phrase here.
export function syncSeedWords(force){
  const box = $('textureSeedWords'), num = $('textureSeedValue'); if(!box || !num) return;
  const n = parseInt(num.value, 10) || 0;
  if(force || (typeof document !== 'undefined' && document.activeElement !== box)){ if(force || box.dataset == null || box.dataset.seed !== String(n)){ box.value = seedPhrase(n); if(box.dataset) box.dataset.seed = String(n); } }
  if('title' in box) box.title = '№ ' + n;   // the number is only a tooltip now; the phrase is the seed
  if(state.ui.seedFit) requestAnimationFrame(state.ui.seedFit);
}
// switch and volume belong to this browser, not to a look
export const SOUND_ON = 'uv.sound.on', SOUND_VOL = 'uv.sound.volume';
// One modal serves every confirm/name/paste flow. Resolves to the typed
// string when it has an input, `true` for a plain confirm, or null on cancel.
export function modalPrompt(opts){
  return new Promise((resolve)=>{
    const veil = $('modalVeil');
    if(!veil){ resolve(null); return; }
    const titleEl = $('modalTitle'), bodyEl = $('modalBody'), input = $('modalInput');
    const ok = $('modalConfirm'), cancel = $('modalCancel');
    const wantsInput = !!opts.input;
    // A RANGE BY TWO HANDLES (opts.range { lo, hi, a, b, step, low, high }: ROADMAP D3, Filter Forge's remapper drawn
    // as two sliders): the answer is [a, b]; the first may sit above the second, which reverses the sweep
    const R = opts.range || null, rb = $('modalRange');
    if(rb) rb.hidden = !R;
    if(R && rb){
      const step = R.step || ((R.hi - R.lo) > 20 ? 1 : 0.01), fmt = v => String(Math.round(v/step)*step).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
      const say = () => { $('modalRangeAVal').textContent = fmt(+$('modalRangeA').value); $('modalRangeBVal').textContent = fmt(+$('modalRangeB').value);
        $('modalRangeNote').textContent = +$('modalRangeA').value > +$('modalRangeB').value ? MODAL_RANGE.reversed : +$('modalRangeA').value === +$('modalRangeB').value ? MODAL_RANGE.still : ''; };
      for(const [id, v, lab] of [['modalRangeA', R.a, R.low || MODAL_RANGE.low], ['modalRangeB', R.b, R.high || MODAL_RANGE.high]]){
        const el = $(id); el.min = String(R.lo); el.max = String(R.hi); el.step = String(step); el.value = String(v); el.oninput = say; $(id + 'Label').textContent = lab; }
      say();
    }
    titleEl.textContent = opts.title || '';
    bodyEl.textContent = opts.body || '';
    input.hidden = !wantsInput;
    input.value = wantsInput ? (opts.defaultValue || '') : '';
    input.rows = opts.rows || 1;
    input.setAttribute('rows', String(opts.rows || 1));
    ok.textContent = opts.confirmLabel || 'OK';
    cancel.textContent = opts.cancelLabel || 'Cancel';
    cancel.hidden = !!opts.alert;                       // a plain notice: one button
    const box = veil.querySelector('.modal'); if(box && box.classList) box.classList.toggle('modal-hard', !!opts.hard);
    ok.className = opts.danger ? 'btn-danger' : 'btn-major';
    veil.hidden = false;

    const finish = (val)=>{
      veil.hidden = true; cancel.hidden = false;
      document.removeEventListener('keydown', onKey, true);
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      resolve(val);
    };
    const onOk = ()=> finish(R ? [+$('modalRangeA').value, +$('modalRangeB').value] : wantsInput ? input.value : true);
    const onCancel = ()=> finish(null);
    // Escape cancels, Enter confirms (outside a text box); the safe choice has the focus
    const onKey = e => { if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); finish(opts.alert ? true : null); }
      else if(e.key === 'Enter' && !wantsInput){ e.preventDefault(); e.stopPropagation(); onOk(); } };
    document.addEventListener('keydown', onKey, true);
    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
    setTimeout(() => { try { (R ? $('modalRangeA') : wantsInput ? input : (opts.danger && !opts.alert ? cancel : ok)).focus(); } catch(e){} }, 0);
  });
}
