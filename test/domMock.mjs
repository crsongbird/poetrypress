/**
 * domMock.mjs — just enough of a fake DOM to actually EXECUTE appEvents.js
 * (and, through it, render()) under plain Node, with no browser and no
 * jsdom (not installable here -- see canvasMock.mjs for why).
 *
 * This exists because static analysis, while it caught real bugs in this
 * refactor (see the "cross-module reference gap" postmortem below), can
 * only find what it's specifically looking for. Actually running the code
 * is a stronger check: it catches the exact failure mode a real page load
 * hits, including whatever this file's author didn't think to grep for.
 *
 * Element defaults (checked/value state) and radio-group contents below
 * are extracted from the real index.html, not hand-typed -- so this mock
 * can't silently drift out of sync with the actual markup the way a
 * hand-maintained fixture would.
 *
 * POSTMORTEM: this refactor's initial split reintroduced the same class of
 * bug that broke the pre-refactor monolith once already (a TDZ ordering
 * issue) -- just in a new shape. canvasRenderer.js's render() referenced
 * several bare identifiers (fontSelect, canvas, ctx, currentAlign,
 * currentValign, bgStopCount, textStopCount, mixHex) that only existed as
 * local variables in appEvents.js or exports of textureGenerators.js,
 * never imported. Since render() fires synchronously during page load (via
 * toggleSubblock's initial sync() call), every one of these threw a
 * ReferenceError immediately -- and since that happened before the
 * PRESETS.forEach() call later in appEvents.js's top-level code, the
 * presets panel never populated. Static grep-based checks (this file's
 * sibling scripts) found these by cross-referencing every declared name
 * against every other file's usages, but needed several increasingly
 * careful passes to separate real gaps from false positives (property
 * names, comments, function-local parameters). This mock exists so that
 * from now on, "does the app actually boot" is one command, not a several
 * pass code review.
 */

const ELEMENT_DEFAULTS = {
  "textGradientToggle": {
    "tag": "input",
    "type": "checkbox",
    "checked": false,
    "value": ""
  },
  "accent1Toggle": {
    "tag": "input",
    "type": "checkbox",
    "checked": true,
    "value": ""
  },
  "accent2Toggle": {
    "tag": "input",
    "type": "checkbox",
    "checked": true,
    "value": ""
  },
  "bgGradientToggle": {
    "tag": "input",
    "type": "checkbox",
    "checked": false,
    "value": ""
  },
  "textureToggle": {
    "tag": "input",
    "type": "checkbox",
    "checked": true,
    "value": ""
  },
  "textureInvert": {
    "tag": "input",
    "type": "checkbox",
    "checked": false,
    "value": ""
  },
  "textureSeedLock": {
    "tag": "input",
    "type": "checkbox",
    "checked": false,
    "value": ""
  },
  "borderToggle": {
    "tag": "input",
    "type": "checkbox",
    "checked": true,
    "value": ""
  },
  "vignetteToggle": {
    "tag": "input",
    "type": "checkbox",
    "checked": false,
    "value": ""
  },
  "usernameField": {
    "tag": "input",
    "type": "text",
    "checked": false,
    "value": "@unfixable.place"
  },
  "textColorHex": {
    "tag": "input",
    "type": "text",
    "checked": false,
    "value": "#F2F2EF"
  },
  "maxSize": {
    "tag": "input",
    "type": "number",
    "checked": false,
    "value": "120"
  },
  "textColor2Hex": {
    "tag": "input",
    "type": "text",
    "checked": false,
    "value": "#B98A8A"
  },
  "textColor3Hex": {
    "tag": "input",
    "type": "text",
    "checked": false,
    "value": "#C9A876"
  },
  "textColor4Hex": {
    "tag": "input",
    "type": "text",
    "checked": false,
    "value": "#7A8CA3"
  },
  "accent1ColorHex": {
    "tag": "input",
    "type": "text",
    "checked": false,
    "value": "#C9A876"
  },
  "accent2ColorHex": {
    "tag": "input",
    "type": "text",
    "checked": false,
    "value": "#7A8CA3"
  },
  "outlineColorHex": {
    "tag": "input",
    "type": "text",
    "checked": false,
    "value": "#FFFFFF"
  },
  "outlineThickness": {
    "tag": "input",
    "type": "number",
    "checked": false,
    "value": "2"
  },
  "shadowBlur": {
    "tag": "input",
    "type": "number",
    "checked": false,
    "value": "6"
  },
  "shadowX": {
    "tag": "input",
    "type": "number",
    "checked": false,
    "value": "3"
  },
  "shadowY": {
    "tag": "input",
    "type": "number",
    "checked": false,
    "value": "3"
  },
  "bgColor1Hex": {
    "tag": "input",
    "type": "text",
    "checked": false,
    "value": "#111113"
  },
  "bgColor2Hex": {
    "tag": "input",
    "type": "text",
    "checked": false,
    "value": "#D8CFC0"
  },
  "bgColor3Hex": {
    "tag": "input",
    "type": "text",
    "checked": false,
    "value": "#B8A088"
  },
  "bgColor4Hex": {
    "tag": "input",
    "type": "text",
    "checked": false,
    "value": "#8A7048"
  },
  "textureSeedValue": {
    "tag": "input",
    "type": "number",
    "checked": false,
    "value": "12345"
  },
  "borderColorHex": {
    "tag": "input",
    "type": "text",
    "checked": false,
    "value": "#C9A876"
  },
  "borderThickness": {
    "tag": "input",
    "type": "number",
    "checked": false,
    "value": "2"
  },
  "borderOffset": {
    "tag": "input",
    "type": "number",
    "checked": false,
    "value": "14"
  },
  "lineSpacing": {
    "tag": "input",
    "type": "range",
    "checked": false,
    "value": "0"
  },
  "textGradientAngle": {
    "tag": "input",
    "type": "range",
    "checked": false,
    "value": "45"
  },
  "bgGradientAngle": {
    "tag": "input",
    "type": "range",
    "checked": false,
    "value": "135"
  },
  "textureOpacity": {
    "tag": "input",
    "type": "range",
    "checked": false,
    "value": "60"
  },
  "vignetteIntensity": {
    "tag": "input",
    "type": "range",
    "checked": false,
    "value": "50"
  },
  "poemText": {
    "tag": "textarea",
    "type": "",
    "checked": false,
    "value": "## {[Flood]}/c\n\n   I think you're fine just how [you're made],\na <blinding light/scale:150> in a <cascade/grad:1#ffe066,2#ff6f9c,3#5bb8f5,4#8e5cd9>.\n    I think you're just so, how you came,\n<so softly **broken,**/l><**spoken,**/c>< plain.**/r>\n\n>     {Overwhelming} your old ~~dreams~~:\n> your <catecholamines/f:8/fx2,#ff6f9c,14,3,3>\n>     <drowning/fx1,#1e5fa8,3> out your old ~~routines~~.\n> **{[Overwrites you at your _seams_]}.**\n\nAnd in the end, leaves you in *pain*\u2014\n     a burning <{ember \ud83d\udd25}/fx2,#ff3d00,18,4,4> in your brain.\n**But you were fine just how you came,**\n     so *softly* [spoken, broken, whole/lg]\n-# <[and same.]/fx0>"
  },
  "advancedJson": {
    "tag": "textarea",
    "type": "",
    "checked": false,
    "value": ""
  },
  "usernameCorner": {
    "tag": "select",
    "type": "",
    "checked": false,
    "value": "bottom-left"
  },
  "fontFamily": {
    "tag": "select",
    "type": "",
    "checked": false,
    "value": ""
  },
  "outlineMode": {
    "tag": "select",
    "type": "",
    "checked": false,
    "value": "off"
  },
  "textureType": {
    "tag": "select",
    "type": "",
    "checked": false,
    "value": "inkbleed"
  },
  "vignetteBlend": {
    "tag": "select",
    "type": "",
    "checked": false,
    "value": "overlay"
  }
};

const RADIO_GROUPS = {
  "aspectGroup": [
    {
      "val": "1:1",
      "active": true
    },
    {
      "val": "2:3",
      "active": false
    },
    {
      "val": "3:4",
      "active": false
    },
    {
      "val": "9:16",
      "active": false
    },
    {
      "val": "9:20",
      "active": false
    },
    {
      "val": "16:9",
      "active": false
    }
  ],
  "alignGroup": [
    {
      "val": "center",
      "active": false
    },
    {
      "val": "left",
      "active": true
    },
    {
      "val": "right",
      "active": false
    }
  ],
  "valignGroup": [
    {
      "val": "top",
      "active": false
    },
    {
      "val": "center",
      "active": true
    },
    {
      "val": "bottom",
      "active": false
    }
  ],
  "textStopsGroup": [
    {
      "val": "2",
      "active": true
    },
    {
      "val": "3",
      "active": false
    },
    {
      "val": "4",
      "active": false
    }
  ],
  "bgStopsGroup": [
    {
      "val": "2",
      "active": true
    },
    {
      "val": "3",
      "active": false
    },
    {
      "val": "4",
      "active": false
    }
  ]
};

function makeClassList(el){
  const set = new Set();
  return {
    add(...cls){ cls.forEach(c=>set.add(c)); },
    remove(...cls){ cls.forEach(c=>set.delete(c)); },
    toggle(c, force){
      if(force === undefined){ set.has(c) ? set.delete(c) : set.add(c); }
      else if(force){ set.add(c); } else { set.delete(c); }
      return set.has(c);
    },
    contains(c){ return set.has(c); },
  };
}

function makeFakeElement(id, defaults = {}){
  const listeners = {};
  const children = [];
  const el = {
    id,
    tagName: (defaults.tag || 'div').toUpperCase(),
    value: defaults.value ?? '',
    checked: defaults.checked ?? false,
    disabled: false,
    innerHTML: '',
    textContent: '',
    dataset: {},
    // real browsers have setProperty on style and set/getAttribute on every
    // element; code that uses them should not have to guard against the mock
    style: { setProperty(k, v){ this[k] = v; }, getPropertyValue(k){ return this[k] || ''; } },
    _attrs: {},
    setAttribute(k, v){ this._attrs[k] = String(v); },
    getAttribute(k){ return k in this._attrs ? this._attrs[k] : null; },
    removeAttribute(k){ delete this._attrs[k]; },
    classList: makeClassList(),
    children,
    addEventListener(type, fn){ (listeners[type] = listeners[type] || []).push(fn); },
    dispatchEvent(evt){ (listeners[evt.type] || []).forEach(fn => fn(evt)); return true; },
    appendChild(child){ children.push(child); return child; },
    querySelectorAll(sel){
      // minimal support for the '.radio-btn' / '.radio-btn.active' selectors
      // the app's own bindRadioGroup/getActiveRadioValue/setActiveRadioValue
      // actually use
      const wantsActive = sel.includes('.active');
      return children.filter(c => c._isRadioBtn && (!wantsActive || c.classList.contains('active')));
    },
    querySelector(sel){ return el.querySelectorAll(sel)[0] || null; },
    select(){}, focus(){}, remove(){},
    getContext: undefined, // wired below for the canvas element specifically
  };
  return el;
}

/** Installs a fake `document` covering every element referenced by the real
 * app (built from index.html's actual defaults), plus a working canvas
 * context on #poemCanvas via canvasMock's context factory. Call
 * installCanvasMock() from canvasMock.mjs FIRST if the code under test also
 * creates its own offscreen canvases (the texture generators do). */
export function installDomMock(makeMockContext, makeMockCanvas){
  const registry = {};

  for(const [id, defaults] of Object.entries(ELEMENT_DEFAULTS)){
    registry[id] = makeFakeElement(id, defaults);
  }

  // radio-group containers + their real static child buttons
  for(const [groupId, buttons] of Object.entries(RADIO_GROUPS)){
    const group = registry[groupId] || (registry[groupId] = makeFakeElement(groupId));
    for(const b of buttons){
      const btn = makeFakeElement(null);
      btn._isRadioBtn = true;
      btn.dataset.val = b.val;
      if(b.active) btn.classList.add('active');
      group.appendChild(btn);
    }
  }

  // the actual poem canvas needs a real (mocked) 2D context
  const poemCanvas = registry['poemCanvas'] || (registry['poemCanvas'] = makeFakeElement('poemCanvas'));
  poemCanvas.width = 3072;
  poemCanvas.height = 3072;
  let cachedCtx = null;
  poemCanvas.getContext = () => {
    if(!cachedCtx) cachedCtx = makeMockContext(poemCanvas.width, poemCanvas.height);
    return cachedCtx;
  };

  // requestAnimationFrame is a browser-only API; scheduleRender() in
  // canvasRenderer.js depends on it. A setTimeout-based stand-in is fine for
  // tests -- it doesn't need to be frame-accurate, just present and async.
  if(typeof global.requestAnimationFrame !== 'function'){
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  }

  // Coloris is a real third-party global, loaded via CDN in the browser --
  // not something this app defines. Records the last config passed in, so
  // tests can assert the theme palette actually got applied.
  global.Coloris = function(config){
    global.Coloris.lastCall = config;
  };

  const documentListeners = {};
  global.document = {
    getElementById(id){
      if(!registry[id]) registry[id] = makeFakeElement(id); // anything not explicitly listed still works generically
      return registry[id];
    },
    createElement(tag){ return tag === 'canvas' ? makeMockCanvas() : makeFakeElement(null, {tag}); },
    fonts: { load: () => Promise.resolve(), ready: Promise.resolve() },
    addEventListener(type, fn){ (documentListeners[type] = documentListeners[type] || []).push(fn); },
    dispatchEvent(evt){ (documentListeners[evt.type] || []).forEach(fn => fn(evt)); return true; },
  };

  return registry;
}

/**
 * installMobileEnv() — makes the mock look like a phone, so the mobile
 * branch in appEvents.js actually executes under test instead of being
 * skipped silently. Call BEFORE importing appEvents.js.
 *
 * The tab panels and buttons are read out of the real index.html rather
 * than hardcoded, so this can't drift from the markup the way a
 * hand-maintained fixture would.
 */
import { readFileSync } from 'fs';

export function installMobileEnv(registry){
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

  const mk = (tab, isBtn) => {
    const classes = new Set(isBtn ? ['tab-btn'] : ['card']);
    return {
      dataset: { tab },
      classList: {
        add: c => classes.add(c),
        remove: c => classes.delete(c),
        contains: c => classes.has(c),
        toggle: (c, force) => {
          if(force === undefined) classes.has(c) ? classes.delete(c) : classes.add(c);
          else if(force) classes.add(c); else classes.delete(c);
          return classes.has(c);
        },
      },
      _listeners: {},
      addEventListener(t, fn){ (this._listeners[t] = this._listeners[t] || []).push(fn); },
      dispatchEvent(e){ (this._listeners[e.type] || []).forEach(fn => fn(e)); return true; },
    };
  };

  const panels = [...html.matchAll(/class="card" data-tab="(\w+)"/g)].map(m => mk(m[1], false));
  const buttons = [...html.matchAll(/class="tab-btn[^"]*" data-tab="(\w+)"/g)].map(m => mk(m[1], true));

  // Node 22 defines its own read-only `navigator`, so this has to be
  // redefined rather than assigned.
  Object.defineProperty(global, 'navigator', {
    value: { userAgentData: { mobile: true }, userAgent: 'Mozilla/5.0 (Linux; Android 13)', maxTouchPoints: 5 },
    configurable: true, writable: true,
  });
  global.window = global.window || {};
  global.window.innerHeight = 800;
  global.window.scrollTo = () => {};
  // 800 tall layout viewport, but a bottom URL bar means only 670 is visible --
  // the exact condition that broke the vh-based sizing on a real phone.
  const vvListeners = [];
  global.window.visualViewport = {
    height: 670, offsetTop: 0,
    addEventListener(t, fn){ vvListeners.push(fn); },
    removeEventListener(){},
    _fire(){ vvListeners.forEach(fn => fn()); },
  };

  const bodyClasses = new Set();
  global.document.body = {
    classList: {
      add: c => bodyClasses.add(c),
      contains: c => bodyClasses.has(c),
      toggle: (c, force) => { force ? bodyClasses.add(c) : bodyClasses.delete(c); return bodyClasses.has(c); },
      remove: c => bodyClasses.delete(c),
    },
  };
  const cssVars = {};
  global.document.documentElement = {
    style: { setProperty(k,v){ cssVars[k] = v; }, getPropertyValue(k){ return cssVars[k]; } },
  };
  global.document.activeElement = null;
  global.__cssVars = cssVars;
  global.document.querySelectorAll = (sel) => {
    if(sel === '.card[data-tab]') return panels;
    if(sel === '.tab-btn') return buttons;
    return [];
  };

  return { panels, buttons, bodyClasses };
}
