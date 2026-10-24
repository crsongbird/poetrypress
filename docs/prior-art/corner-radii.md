# Prior art: corner radii for the interface (PoetryPress / Unfixable Vellum)

Key:
- **[src](URL)** = stated in a source opened and read for this doc.
- **[code]** = read from this repository (poetrypress.css, index.html, uiLook.js, vault.js, chooser.js, tools/phone-shot.mjs, AGENTS.md), with the file named.
- **[est]** = my own judgment, inference or arithmetic (the arithmetic is shown).

Researched 2026-10-24. Every [src] link was opened and read in this session. What could not be reached, and what Ruby should decide, is in **Gaps** at the end.

**Scope.** The interface's own corners only. The picture's Rounded Corners (the page border's and the inset box's radii, the borderRounded, borderRadius and cardRadius settings in index.html) are part of the look and are not touched: old work draws as before (AGENTS.md §1 rule 1) [code].

---

## 0. The request

Ruby: "All these sharp edges, we need to round them. But just, like, 2px of rounding (obviously I know there are hierarchies too — circles barely any rounding), and only the ones that make sense to round — windows and buttons and stuff — and we should make sure that radio buttons and buttons without gaps between them are only blunted on outside edges."

Read as four requirements [est]:
1. **About 2px.** A blunting, not a visible curve.
2. **A hierarchy.** Different things get different steps around that 2px.
3. **Only what makes sense:** windows (sheets, dialogs, menus, toasts, panels) and buttons (and the fields that sit beside them). Not every box.
4. **Groups are one shape.** Radio rows, and buttons that touch, are blunted only on the group's outside corners.

"Circles barely any rounding" is unclear: it may mean that small things get the least rounding, or it may be a transcription of something else. It is listed under Gaps as a question.

---

## 1. What the stylesheet does now

### 1.1 One rule squares everything

Near the foot of poetrypress.css, under the POLISH banner ("Square corners on everything"), one block sets border-radius:0 !important on [code]:

- .card, details.card, summary, **button** (every button), .radio-btn, .preset-btn, .tab-btn, .ld-btn, .seed-moon, .snap-btn;
- select, textarea, input[type="text"], input[type="number"], input[type="search"];
- .subblock, .eso-drawer, .hint code;
- .clr-field button, .clr-picker, .clr-swatches button (Coloris, the colour picker);
- .download-btn, .modal, .toast, body:not(.is-mobile) .tab-btn, .preset-group-head.

Its comment reads "square, everywhere (circles stay circles: they have no corners)". The Athanor's banner says the same: "Square corners, as everywhere" [code].

Because the block is !important, it beats every earlier radius on those elements. The CHANGELOG and docs/changelog-archive.md record no request from Ruby for square corners, so this looks like an earlier polish pass's choice, not one of Ruby's rules [code].

### 1.2 Every radius declared, and whether it takes effect

**Declared, but beaten by the square block** (they never draw) [code]:

| Selector | Declared | Draws |
|---|---|---|
| .card | 2px | 0 |
| select, textarea, text, number and search inputs | 2px | 0 |
| .modal-input (a textarea) | 2px | 0 |
| .radio-btn | 2px | 0 |
| button.ghost | 2px | 0 |
| .preset-btn | 2px | 0 |
| .btn-major, .btn-danger | 2px | 0 |
| .download-btn | 2px | 0 |
| .reset-view-btn (and the undo, redo and film buttons that share it) | 2px | 0 |
| .hint code | 2px | 0 |
| .clr-field button, .clr-picker, .clr-swatches button | 2px !important | 0 (a later !important wins) |
| #clr-picker .clr-close | 2px | 0 |
| .spell-chip (a button, vault.js) | 3px | 0 |
| .snap-btn | 6px | 0 |
| .ld-btn (the light dial's corner buttons) | 8px | 0 |
| body:not(.is-mobile) .tab-btn (the desk's tabs) | 8px | 0 |

**Live today** (not on the square list) [code]:

| Selector | Radius | What it is |
|---|---|---|
| .controls::-webkit-scrollbar-thumb | 2px | the sidebar's scrollbar |
| .grimoire-list | 2px | the Grimoire's list box |
| .pml-match | 2px | the bracket pair beside the caret, in the editor's mirror |
| #clr-picker .clr-hue, #clr-picker .clr-gradient | 2px | inside the colour picker |
| body.is-mobile .drag-grip | 2px | the divider's grip, 52 × 4 px (a capsule: radius = half its height) |
| .editor-wrap | 3px (0 in phone focus mode) | the poem editor's frame |
| body.is-mobile .canvas-wrap | 3px | the phone's preview frame |
| .is-picking | 3px | the field the colour picker is editing (uiLook.js markPicking) |
| :focus-visible | 3px | every keyboard-focused element not on the square list |
| .die-menu | **10px** | the die's levels menu: the one large radius in the app |
| .light-seg .ls-dot, .fd-swatch, .forge-pending i | 50% | dots: circles |

**Set to 0 explicitly** (the Athanor, mostly) [code]: .forge-part, .drawflow-node, .forge-param input and select, the ports (.input, .output), .forge-cut, .forge-help-btn, .forge-pending-x, .forge-note-x, .forge-find, .fd-close, .fd-swatch.pp (a rotated square: the diamond), .wk-search, .forge-seed-btn, .forge-channel; and .athanor-top, .el-btn, .film-frame, .shortcut-btn, .sheet, kbd, .ch-trigger, .ch-tile, .ch-group > summary, the desk .canvas-wrap.

**Never set** (square by default) [code]: .ch-panel, .forge-menu, .forge-doc, .forge-dock, .forge-note, .forge-pending, input.switch, .controls-fold, .support-btn, .ch-thumb, .ch-close, .toast-act, .wk-pager a, .sr-step, .rack-btn, .wk-fig, .curve-pad canvas.

### 1.3 Groups of buttons, and whether they touch

| Group | Markup (index.html) | Layout (poetrypress.css) | Touching? |
|---|---|---|---|
| Aspect Ratio, Standard | #aspectGroup, 6 .radio-btn divs | .radio-group: flex, gap 5px, wrap; each flex 1 1 28%, so three to a row: **two rows of three** | no (5px) |
| Landscape, Alignment, Attunement, both Gradient Stops | #aspectGroupWide, #alignGroup, #valignGroup, #textStopsGroup, #bgStopsGroup: 3 each | the same, one row | no (5px) |
| Main / Rim | .radio-group.light-seg: 2 buttons | display flex, the group's 5px gap | no |
| Upper / Lower / Swap | .radio-group.layer-seg: 2 choices and an action (Swap) | the same; Swap is flex 0 1 auto | no |
| The Moving Image sheet's rows | .film-seg.film-pick: a label per choice wrapping a native radio and a .radio-btn span | flex, gap 4px, one row | no (4px) |
| Move, Size | .film-moves, .film-cards: 4 each | grid, two columns, gap 4px: **a 2 × 2 block** | no (4px) |
| Four readings | .element-row: 4 .el-btn | flex, gap 4px (3px inside .surface-pick) | no |
| The Athanor's zoom: minus, fit, plus | .forge-zoom | inline-flex, gap 0; button + button { border-left:none } | **yes** |
| The Athanor's Apply and Keep | .forge-use | the same | **yes** |
| The phone's tab bar | five .tab-btn | flex 1 1 0, border 0; .tab-btn + .tab-btn a hairline on the left; the bar runs edge to edge | **yes**, at the screen's edges |
| The die and its arrow | .die-pair | inline-flex, gap 0; both borderless glyphs | yes, but there is no box to round |
| Dialog and Grimoire buttons | .btn-row | flex, gap 7px, wrap | no: separate actions |
| Preset actions, surface actions | .preset-actions (grid, gap 6px), .surface-acts (gap 6px) | | no |

So **only two groups truly touch** (the Athanor's zoom and Apply/Keep), plus the phone's tab bar, which is a bar at the screen's edge. Every radio row has a 4–5px gap [code].

Two more things are named in the TYPE rules (.chip and .seg button), but no element in index.html or the modules carries those classes [code].

### 1.4 Focus today

- :focus-visible draws a 2px outline at a 2px offset, **and sets border-radius:3px on the element itself** [code]. On anything off the square list, focus therefore changes the element's own shape. Examples are the switch (input.switch has a border and a background), the light and camera dials (role="slider" divs with tabindex), range inputs and links.
- .card:focus-visible and summary:focus-visible draw a 1px outline inset by 1px, on the border [code].
- .is-picking rings the edited field with an outline, a 6px glow and border-radius 3px [code]. It is set on the input, which the square block keeps at 0, and on its .clr-field wrapper, which becomes 3px. The ring's two layers therefore disagree.
- Elsewhere: .film-pick input:focus-visible + .radio-btn has a 1px outline at a 2px offset; the rack's knob has a dotted outline on its svg (a square ring round a circle); the chooser's tiles show focus as a ring on .ch-thumb [code].

---

## 2. Nested radii: concentric corners

**The rule.**
- "outerRadius - gap = innerRadius" [src](https://cloudfour.com/thinks/the-math-behind-nesting-rounded-corners/).
- "Two rounded rectangles only look parallel when their radii differ by exactly the distance between them" [src](https://dev.to/sgbp/the-concentric-border-radius-rule-why-nested-rounded-corners-look-slightly-wrong-3hog).

**Why a mismatch looks wrong.**
- The two arcs must share a centre. When they don't, the gap "swells or collapses at 45°", so the diagonal differs from the straight edges [src](https://dev.to/sgbp/the-concentric-border-radius-rule-why-nested-rounded-corners-look-slightly-wrong-3hog).
- With the same radius on both, the gap widens in the corners [src](https://cloudfour.com/thinks/the-math-behind-nesting-rounded-corners/).

**The border counts.**
- The gap is border-width + padding. Forgetting the border is why "1px-off corners survive review" [src](https://dev.to/sgbp/the-concentric-border-radius-rule-why-nested-rounded-corners-look-slightly-wrong-3hog).
- The CSS Backgrounds spec, as quoted: "The padding edge (inner border) radius is the outer border radius minus the corresponding border thickness. In the case where this results in a negative value, the inner radius is zero" [src](https://prykhodko.medium.com/css-border-radius-how-does-it-work-bfdf23792ac2).

**Clamp at zero.**
- A negative border-radius is invalid, and the whole declaration is thrown away. Clamp with max(0px, calc(…)), and write 0px, not 0, because max() can't compare a unitless 0 with a length [src](https://dev.to/sgbp/the-concentric-border-radius-rule-why-nested-rounded-corners-look-slightly-wrong-3hog).
- Cloud Four prefers deriving the inner radius with calc() from two custom properties over keeping separate inner and outer tokens [src](https://cloudfour.com/thinks/the-math-behind-nesting-rounded-corners/).

**Apple's version (WWDC25, "Meet Liquid Glass").**
- "concentric shapes calculate their radius by subtracting padding from the parent's" [src](https://developer.apple.com/videos/play/wwdc2025/356/?time=255).
- Three shape types: **fixed** (a constant radius), **capsules** ("a radius that's half the height of the container") and **concentric**.
- "keep an eye out for corners that feel too pinched— or flared. … One place this often shows up in is nested containers—like artwork in a card."
- On macOS, small and medium controls keep rounded rectangles "for compact, high-density layouts like inspector panels."

**What this means at 1–3px** [est]. The rule only bites where the gap is smaller than the outer radius. In this app almost every container's padding (6–20px) is far larger than 3px, so nested things never need a derived radius: each takes its own step. The rule matters in three places:

1. **A child clipped flush to its parent's border.**
   - A preset tile (.preset-btn: border 1px, padding 0, overflow hidden) clips its swatch canvas to the inner curve. At 2px that curve is 2 − 1 = 1px, and the browser makes it.
   - The same holds for .spell-chip.
   - .film-frame needs overflow hidden added for its canvas to be clipped the same way.
2. **A coloured band inside the border box.**
   - **The Athanor's node.** With a 3px radius, a 3px coloured top border and 1px sides, the inner corner is 3 − 1 = 2px across and 3 − 3 = 0 down. A zero on either axis is a square corner, so the title bar's square background fits exactly.
   - **The card's accent edge** (.card::before: a 2px strip at left −1px, top −1px, bottom −1px) is square and would stick out past a rounded card's left corners. Give it the card's radius on its left corners. On a 2px-wide strip, CSS scales those radii down to 2px (radii are scaled when they exceed the side they sit on), which pokes out about 0.4px at 45°. That is invisible; check it by eye.
3. **The switch's thumb.** The track is 34 × 18 with a 1px border; the thumb is inset 2px. The rule gives 2 − 1 − 2 < 0, so the thumb comes out square. §7 gives it the small step instead, because here the rule can't be met at all.

**Scrolling boxes clip their children to the inner curve.** Examples are .editor-wrap's gutter, .grimoire-list's rows, and the backgrounds at the top of .forge-menu and .forge-doc. So a 2px list box needs nothing more. A box that doesn't scroll (.ch-panel, whose .ch-head has its own background across the top) needs overflow hidden, or the head's top corners given the inner radius [est].

---

## 3. Shape scales in design systems

### 3.1 The scales

**Material 3 (Android).**
- The scale: extra small 4dp, small 8dp, medium 12dp, large 16dp, large increased 20dp, extra large 28dp, extra large increased 32dp, extra extra large 48dp, full 50% [src](https://gitea.com/784622644/material-components-android/src/branch/master/docs/theming/Shape.md).
- Which components take each step, by default [src](https://kotlinlang.org/api/compose-multiplatform/material3/androidx.compose.material3/-shapes/-shapes.html):
  - extra small: menus, snackbars and text fields;
  - small: chips;
  - medium: cards and small FABs;
  - large: FABs and navigation drawers;
  - extra large: large FABs.
- Its smallest non-zero step is 4dp: Material has no 1–2px step.

**Fluent 2** [src](https://fluent2.microsoft.design/shapes).
- The steps:
  - None 0: navigation bars and tab bars;
  - Small 2px: small badges;
  - Medium 4px: buttons and dropdowns;
  - Large 8px: large buttons;
  - X-Large 12px: sheets and popovers;
  - Circle 50%: personas.
- "In most cases, corner radiuses on rectangle shapes are 4 pixels by default." Corners drop to 2px on shapes smaller than 32px.
- "Rounded corners are not necessary for components that reach the edge of the screen."
- "Be sure to exclude space between multiple UI elements in a single container" (the split button).

**Windows 11** [src](https://learn.microsoft.com/en-my/WINDOWS/APPS/design/signature-experiences/geometry).
- "Top-level containers such as app windows, flyouts and dialogs are rounded using an 8px corner radius. In-page elements such as buttons and list backplates are rounded using a 4px corner radius."
- "Straight edges that intersect with other straight edges are not rounded."
- Window corners are not rounded when a window is snapped or maximized.
- Transient overlays (dialogs, flyouts, menus) use 8px; the tooltip uses 4px "due to its small size".
- No rounding where elements inside a container touch (the two halves of a SplitButton), or where a flyout attaches to what opened it.

**Atlassian** [src](https://atlassian.design/foundations/radius).
- The steps:
  - xsmall 2px: badges, checkboxes, avatar labels, keyboard shortcuts;
  - small 4px: labels, lozenges, tags, tooltips, compact buttons;
  - medium 6px: buttons, inputs, text areas, selects, navigation items;
  - large 8px: cards, in-page containers, floating UI, dropdown menus;
  - xlarge 12px: modals and large containers;
  - full: avatars, pills and dividers.
- "The corner radius of the focus ring must align visually with the component it surrounds": the ring sits 2px out, and its radius is the component's plus 2px.

**ServiceNow Horizon** [src](https://horizon.servicenow.com/foundations/corner-radius).
- 2px for "smaller components, such as badges";
- 6px for "elements often nested inside others, like buttons";
- 8px for "large vessel-like containers, such as modals".

**Radix Themes** [src](https://radix-ui.com/themes/docs/theme/radius).
- One radius factor (none, small, medium, large, full) scales a six-step scale, --radius-1 to --radius-6.
- Panels (Card, Dialog, Popover) inherit the theme's radius.
- At full, a Button becomes a pill, "but a Checkbox never becomes fully rounded, so it isn't confused with a Radio". Shape tells kinds apart.

**Tailwind.**
- v4: rounded-xs 2px, rounded-sm 4px, rounded-md 6px, rounded-lg 8px, up to rounded-4xl 32px; rounded-full is calc(infinity × 1px). Logical corner utilities (rounded-s, rounded-e, rounded-ss, rounded-se, rounded-es, rounded-ee) follow the writing direction [src](https://tailwindcss.com/docs/border-radius).
- In v3, 2px was rounded-sm and 4px plain rounded [src](https://v3.tailwindcss.com/docs/border-radius).

**IBM Carbon.**
- A third-party design summary of IBM's system gives every button, card, input, tab and tile 0, with 2px only for "Small badges (rare exception)". Its FAQ adds: "Even 4px rounding starts to break the look" [src](https://www.shadcn.io/design/ibm/raw).
- That is a secondary source. Carbon's own checkbox spec, read directly, lists a 16px box with a 1px border and a 2px focus border, and no radius row at all [src](https://carbondesignsystem.com/components/checkbox/style).

**GOV.UK.**
- A GOV.UK-styled button sheet in use sets "border-radius: 0", "border: 2px solid transparent" and "box-shadow: 0 2px 0" [src](https://www.policeconduct.gov.uk/modules/custom/civic_govuk_webform/css/govuk-button.css).
- The Design System's button page says nothing about corners [src](https://design-system.service.gov.uk/components/button).

**The National Archives (UK).**
- "Square buttons are perceived as more formal than rounded buttons." They wanted to "sit somewhere in between professional yet friendly", and "went with a small but noticeable border radius" [src](https://www.nationalarchives.gov.uk/blogs/digital/designing-our-button/).

### 3.2 What the scales agree on

- **Containers are rounder than the controls inside them, and controls rounder than small marks.**
  - Windows: 8 over 4 [src](https://learn.microsoft.com/en-my/WINDOWS/APPS/design/signature-experiences/geometry).
  - Atlassian: 8–12 over 6 over 2 [src](https://atlassian.design/foundations/radius).
  - ServiceNow: 8 over 6 over 2 [src](https://horizon.servicenow.com/foundations/corner-radius).
  - Fluent: 12 over 4 over 2 [src](https://fluent2.microsoft.design/shapes).
- **2px is the smallest non-zero step everywhere it exists**, kept for the smallest things: badges, checkboxes, keyboard shortcuts. Sources: [Atlassian](https://atlassian.design/foundations/radius), [Fluent](https://fluent2.microsoft.design/shapes), [ServiceNow](https://horizon.servicenow.com/foundations/corner-radius), [Tailwind](https://tailwindcss.com/docs/border-radius).
- **Radius tracks size.** Fluent halves its radius below 32px [src](https://fluent2.microsoft.design/shapes); the tooltip gets 4px "due to its small size" [src](https://learn.microsoft.com/en-my/WINDOWS/APPS/design/signature-experiences/geometry).
- **Edges stay square.**
  - Where a thing meets the screen's or window's edge: [Fluent](https://fluent2.microsoft.design/shapes), [Windows](https://learn.microsoft.com/en-my/WINDOWS/APPS/design/signature-experiences/geometry).
  - Where two straight edges meet: [Windows](https://learn.microsoft.com/en-my/WINDOWS/APPS/design/signature-experiences/geometry).
  - Bars and tab bars: [Fluent](https://fluent2.microsoft.design/shapes).

**What this means for Vellum** [est].
- Ruby's "about 2px" sits at the very bottom of every system's scale. The app's controls are small (fields stand 34px tall, most buttons 24–34px), so Fluent's rule (4px, halved under 32px) already lands near 2px for them.
- A scale of **1 / 2 / 3px** is Fluent's ladder at half size: small marks, controls, windows. It keeps the hierarchy the systems share and stays "just, like, 2px".

---

## 4. Segmented controls and button groups

**What a segmented control is.**
- "a linear set of two or more segments, each of which functions as a button."
- "all segments are usually equal in width."
- "Avoid using a segmented control to offer actions, such as adding, removing, or editing content" (Apple HIG, read through a mirror) [src](https://glama.ai/mcp/servers/@tmaasen/apple-dev-mcp/blob/b82f0efe2115dc4539c83a2374a714a84aeb350a/content/universal/segmented-controls.md).
- This bears on Upper / Lower / Swap: Swap is an action sitting in a row of choices [est].

**Bootstrap 5's button group** (the stylesheet behind .btn-group) [src](https://eic-code-browser.sdcc.bnl.gov/lxr/source/iDDS/monitor/data/scss/bootstrap/_button-group.scss):
- **Collapse the double border.** Every button after the first gets margin-left equal to minus the border width ("Prevent double borders when buttons are next to each other").
- **Square the inner corners.** Every button but the last has its end corners at 0. Any button not at the start has its start corners at 0.
- **Raise the active segment.** Each button is position:relative. A hovered, focused, active or checked button gets z-index 1 "to overlay the borders properly", so its whole border shows over its neighbour's.
- **Radios join too.** The docs: "Combine button-like checkbox and radio toggle buttons into a seamless looking button group"; a group carries role="group" and an aria-label [src](https://unpkg.com/uba-bootstrap-theme@0.3.1/bootstrap/site/content/docs/5.3/components/button-group.md).

**Material's toggle group (segmented buttons).**
- The group's shape sets the outer corners; "Size of inner corners" defaults to 0dp, and "Spacing between buttons" to 0dp. The buttons share "a shared stroked container" [src](https://gitea.com/784622644/material-components-android/src/branch/master/docs/components/ToggleButtonGroup.md).
- Compose shapes each segment by its place in the row, with itemShape(index, count). The base shape is for "buttons that are not in the start or the end" [src](https://kotlinlang.org/api/compose-multiplatform/material3/androidx.compose.material3/-segmented-button-defaults/item-shape.html).

**Material 3 Expressive's connected button group: a group with gaps that still reads as one shape.**
- "The group overrides each button's shape to visually join them, with 2dp spacing, 8dp inner corners, and fully rounded outer corners" [src](https://gitea.com/784622644/material-components-android/src/branch/master/docs/components/ButtonGroup.md).
- This is the precedent for Ruby's radio rows. They keep their small gap, and the inner corners are less rounded than the outer.
- At Vellum's scale, full outer corners and 8dp inner become 2px outer and 0 inner [est].

**Fluent and Windows** say the same thing from the other side.
- No space between pieces of one container [src](https://fluent2.microsoft.design/shapes).
- No rounding where the pieces touch [src](https://learn.microsoft.com/en-my/WINDOWS/APPS/design/signature-experiences/geometry).

**When a group wraps** [est].
- First-child and last-child rounding assumes one row. #aspectGroup lays six buttons out as two rows of three (§1.3). There, first and last child would round the top-left button's lower-left corner, which is inside the block.
- A wrapped block's outside corners are its four corners:
  - top-left: the first button;
  - top-right: the last of the first row;
  - bottom-left: the first of the last row;
  - bottom-right: the last button.
- CSS can't see where flexbox wrapped, so this only works where the count and the columns are fixed: #aspectGroup (3 + 3), and .film-moves and .film-cards (2 × 2 grids).

**Direction** [est]. Logical corner properties (border-start-start-radius and its kin, Tailwind's rounded-s and rounded-e [src](https://tailwindcss.com/docs/border-radius)) keep "start" and "end" right if the page is ever read right to left. They cost nothing here.

---

## 5. Small radii on thin-line, dark interfaces

### 5.1 What rounding does to how a thing feels

- Contour affects how people feel about an object. Bar & Neta (2006) hypothesized that "sharp transitions in contour might convey a sense of threat", triggering "a negative bias" [src](https://nmr.mgh.harvard.edu/publications/journal_articles/743).
- Square reads formal; a small radius sits "in between professional yet friendly" [src](https://www.nationalarchives.gov.uk/blogs/digital/designing-our-button/).
- "Just a small amount of corner radius to elements like form fields can soften their appearance". Apply it "to every sharp corner in the interface", so that no corner is sharp while its neighbours are slightly rounded [src](https://anthonyhobday.com/sideprojects/visualtechniques/techniques/rounded-corners/rounded-corners-as-subtle-softeners.html).

**What this means for Vellum** [est].
- The app's language is thin lines, glyphs and rings, flat, never skeuomorphic (AGENTS.md §11) [code].
- A 1–3px radius doesn't make a box look soft or bubbly. It makes the corner look drawn, as a pen's corner is never a perfect mitre: the hairline turns rather than snaps.
- Ruby's own word, "blunted", is the right register: a softened edge, not a rounded shape.

### 5.2 How 1–3px read at different pixel densities

devicePixelRatio is "the ratio of the resolution in *physical pixels* to the resolution in *CSS pixels*". 1 is "a classic 96 DPI display", 2 is "expected for HiDPI/Retina", and phones "often yield a devicePixelRatio value greater than 2" [src](https://developer.mozilla.org/en-US/docs/Web/API/Window.devicePixelRatio).

The app's phone review shot uses 412 CSS px at a device scale of 2.6 (tools/phone-shot.mjs) [code]. The audit of which declarations win runs at a scale of 1 (tools/css-audit.py) [code].

Corner radius in device pixels [est, radius × ratio]:

| Ratio | 1px | 2px | 3px |
|---|---|---|---|
| 1 (a desk monitor) | 1 | 2 | 3 |
| 2 | 2 | 4 | 6 |
| 2.6 (the baseline phone, as the tool shoots it) | 2.6 | 5.2 | 7.8 |
| 3 | 3 | 6 | 9 |

What that means [est]:
- **At a ratio of 1**, a 1px radius only shades the corner pixel, a step you feel more than see. 2px removes about a pixel and a half from each corner, which reads as a bevel, a blunted corner. 3px is the first step that reads as a curve.
- **On the phone**, every step is a smooth arc.
- **So the hierarchy reads strongest on the phone and stays subtle on the desk.** That is right for a phone-first app (AGENTS.md §1 rule 8) [code].
- **Look at both.** Render the phone at 412 / 2.6 and the desk at a ratio of 1 before showing Ruby.

**Continuous ("squircle") corners don't matter at this size.**
- Smoothing is limited to the side's midpoint, and "at small radii relative to the element size the effect is subtle; at large radii it becomes pronounced" [src](https://squircle.js.org/docs/corner-smoothing).
- The continuous curve fixes corners that look "not as smooth as we'd expect" with a larger radius [src](https://swiftbysundell.com/articles/rounded-corners-uikit-swiftui).
- At 1–3px, a plain circular border-radius is indistinguishable from it [est].

**Two artefacts to watch for.**
1. WebKit once drew a faint X from corner to corner on boxes with a small radius and some transparency, most visibly on non-retina screens. The bug was closed as resolved by a configuration change [src](https://bugs.webkit.org/show_bug.cgi?id=213456). Several Vellum surfaces are translucent (the preview's buttons, the film frames), so look at them on a desk screen [est].
2. When a parent and a child both have rounded corners and different backgrounds, the parent's colour can show at the child's antialiased corner [src](https://dev.to/rashidshamloo/css-fixing-background-color-bleed-in-rounded-corners-2kh4). Here that means a .radio-btn's gradient on a card, or a .ch-tile thumb on its panel. At 2px it is likely invisible [est].

### 5.3 A glyph-like option: the bevel

- CSS corner-shape changes the curve that border-radius makes. Its values are round (the default), squircle, **bevel** ("straight line between the radius endpoints (snipped corners)"), scoop, notch, square and superellipse().
- "Without border-radius, corner-shape does nothing."
- Support: "corner-shape is only supported in Chrome 139+ and other Chromium-based browsers. Firefox and Safari don't support it yet." The Smashing article keeps a plain border-radius baseline and adds corner-shape inside @supports, so other browsers keep ordinary rounded corners [src](https://www.smashingmagazine.com/2026/03/beyond-border-radius-css-corner-shape-property-ui/).
- As of June 2026, Safari and Firefox still lacked it [src](https://squircle.js.org/blog/squircles-in-css).
- An outline follows "the border-radius curve … as well as the corner-shape" [src](https://www.w3.org/TR/css-ui/).

What this means for Vellum [est].
- A 2px bevel is a literal blunting: a 45° cut like a carved seal or the angle of a sigil's stroke. That is closer to "glyph-like, thin lines" than a curve.
- It costs one @supports block and falls back to the round version.
- Offer it to Ruby as a variant on the review sheet, not as the default: Firefox and Safari would show the round version, and the app must look the same everywhere it can.

---

## 6. What stays square, and what stays round

**Things at the screen's or window's edge** [src](https://fluent2.microsoft.design/shapes), [src](https://learn.microsoft.com/en-my/WINDOWS/APPS/design/signature-experiences/geometry). In Vellum [code]:
- the sidebar (.controls) and the stage;
- the header and the tab bars, phone and desk;
- Esoterica's drawer (.eso-drawer, a grid column);
- the Athanor's bar and palette;
- the chooser as a phone sheet (.ch-panel.ch-sheet, docked left 0, right 0, bottom 0) and as a side drawer (.ch-side);
- the Athanor's menu as a phone sheet;
- the desk preview pane (.canvas-wrap, the whole pane);
- the full-screen veils (.modal-veil, .sheet-veil, .forge-veil).

**Lines.** Rules, dividers and edges drawn as lines [est]:
- .card-title's underline (a border-image);
- .subcard and .film-group (a top rule);
- .layer-bar and .words-bar;
- the sub-blocks' inset rule;
- the preset group heads' trailing rule;
- the drag edges (.side-resize, .drawer-resize);
- the seed's hair-thin scroller;
- the working shimmer;
- the tab bar's hairlines;
- the wiki's table rules.

A line has no corners to blunt. Atlassian gives dividers radius.full [src](https://atlassian.design/foundations/radius), but on a 1px rule that rounds nothing.

**Pictures.**
- **The preview canvas (#poemCanvas) stays square.** "The preview … must look like the export scaled down", and the export is a rectangle (AGENTS.md §5.2) [code]. Rounding it would show a picture the app doesn't save [est].
- The same holds for the Athanor's previews (.forge-preview, .forge-node-preview) and the wiki's figure tiles (.wk-fig-step canvas) [est].
- A picture inside a rounded button is clipped by the button, not rounded itself (§2): the preset swatches, the spell chips and the film frames [est].

**Shape-coded marks.**
- The Athanor's ports are squares, and a diamond (.input.pp, a rotated square) marks a different kind; the wiki's legend repeats it (.fd-swatch round, .fd-swatch.pp diamond) [code].
- Shape there carries meaning, as Radix keeps a checkbox from ever looking like a radio [src](https://radix-ui.com/themes/docs/theme/radius). Leave them exactly as they are [est].

**Rows inside a list or menu that run to its edges** [est]: .forge-menu-item, .die-menu-item and .grimoire-row. Their hover and selected backgrounds are full-width bands; rounded, they would look like pills floating in the menu. The scrolling parent clips them to its own curve (§2).

**Borderless glyph buttons** (the lock, the die, the hint mark, the eye, .forge-node-btn, the menu's close) have no box, so rounding them does nothing visible [code]. That is why §7 never sets a radius on bare button.

**Circles and capsules.**
- A capsule's radius is "half the height of the container" [src](https://developer.apple.com/videos/play/wwdc2025/356/?time=255); Tailwind's full is calc(infinity × 1px) [src](https://tailwindcss.com/docs/border-radius).
- Vellum's circles stay circles: the dots (.ls-dot, .fd-swatch, the wiring bar's dot), the dials' rings and ticks, and the knob and fader skins (SVG). The 4px-tall grip at 2px is already a capsule [code].

**Focus rings follow the element.**
- "To the extent that the outline follows the border edge, it should follow the border-radius curve" [src](https://www.w3.org/TR/css-ui/).
- Outlines have followed border-radius since Chromium 94, Firefox 88 and Safari 16.4 [src](https://github.com/Fyrd/caniuse/issues/6099).
- So a ring never needs a radius of its own. Atlassian's rule: the ring's radius aligns with the component's (component + 2px for a 2px offset) [src](https://atlassian.design/foundations/radius).
- The spec says only that an offset outline "is outset from the border edge by that amount" [src](https://www.w3.org/TR/css-ui/). It doesn't say whether the ring's radius grows by the offset, so look at it in each browser [est].

---

## 7. What we take [est]

### 7.1 The tokens

Four steps, on :root in poetrypress.css beside the theme's colours. They are shared by every theme, since corners don't change with the palette:

| Token | Value | For |
|---|---|---|
| --r-0 | 0 | what stays square (§6), and the inner corners of a group |
| --r-1 | 1px | small marks, about 20px or less: keyboard keys, code, colour swatches, the switch's thumb, compact fields in the Athanor's nodes |
| --r-2 | 2px | controls: every bordered button, field, tile and segment; and the drawer inside a card |
| --r-3 | 3px | windows: cards, sheets, dialogs, menus, toasts, the picker, and the Athanor's floating panels and nodes |

Plus 50% for circles, which already exist. The names say steps, not sizes, so Ruby can turn the whole hierarchy up or down from one place.

Keep the names away from the picture's own Rounded Corners (borderRadius, cardRadius), which belong to the look.

### 7.2 Which selectors get which

**--r-3: windows.** These float over the page or hold a section:
- .card (with details.card);
- .sheet (so .moving-sheet);
- .modal (with .modal-hard: its top band is an inset shadow, which follows the curve);
- .toast, desk and phone (on a phone it is inset 8px from both sides);
- .die-menu (from 10px);
- .ch-panel when it floats on a desk (add overflow hidden for .ch-head's background), but 0 as a phone sheet or side drawer;
- .forge-menu when it floats, but 0 as the phone's bottom sheet;
- #clr-picker (with !important, over Coloris's own). Its .clr-gradient keeps 2px. Wherever the gradient sits flush with the picker's 1px border, 2px is exactly the concentric inner radius of a 3px picker, and the picker already clips with overflow hidden. Where Coloris insets it, its own 2px is simply a control's step. Coloris's layout was not checked; look at it;
- .forge-doc, .forge-dock, .forge-note, .forge-pending;
- .drawflow-node (§2: its title bar then fits the inner corner);
- the phone's preview frame (body.is-mobile .canvas-wrap), already 3px. The picture letterboxes inside it, so the curve never cuts the picture unless the page's shape exactly matches the frame's; check by eye.

**The card's accent edge** (.card::before) takes the card's radius on its left corners only (§2).

**--r-2: controls.**
- **Buttons:**
  - the ordinary ones: button.ghost, .btn-major, .btn-danger, .download-btn, .toast-act, .ch-close;
  - tiles: .preset-btn, .spell-chip, .film-frame (add overflow hidden);
  - the header's: .athanor-top, .support-btn (a link drawn as a button), .shortcut-btn;
  - the preview's: .reset-view-btn (with the undo, redo and film buttons);
  - the dial's corner buttons, .ld-btn;
  - the bordered .snap-btn (the borderless one in the knob's mouth shows nothing);
  - .el-btn;
  - the desk's tabs (body:not(.is-mobile) .tab-btn);
  - the readout's steps, .sr-step, and .rack-btn;
  - the seed's moon button (.seed-moon, #textureSeedReroll);
  - the wiki's pager links (.wk-pager a);
  - in the Athanor: .forge-part, .forge-cut, .forge-open-group, .forge-pending-x, .fd-close.
- **Fields:**
  - select, textarea and the text, number and search inputs, so .modal-input, .ch-search and the seed's words come with them;
  - .forge-find, .wk-search;
  - .ch-trigger (its thumbnail stays square: the trigger's 4px padding is larger than its radius);
  - .editor-wrap (from 3px; 0 stays in phone focus mode, where it runs edge to edge);
  - .grimoire-list;
  - the switch's track (input.switch);
  - .curve-pad canvas (a surface you draw on, a control, not a picture).
- **The chooser's tiles:** .ch-thumb, the tile's visible frame (it already clips its image).
- **The drawer inside a card:** .controls-fold.

**--r-1: small marks.**
- kbd; .hint code and the guide's code;
- .pml-match (from 2px: on a monospace glyph about 8px wide, 2px is a large share);
- .wk-req and the wiki's map tags (.wk-page a.wk-map);
- the colour swatches, with !important: .clr-swatches button, .clr-field button;
- the switch's thumb (input.switch::after; §2: the concentric rule can't be met there, and a thumb sharper than its track would look like a mistake);
- .forge-help-btn (22px);
- the compact controls in a node: .forge-param input and select, .forge-seed-btn, .forge-channel.

**Left at 2px:** the sidebar's scrollbar thumb and the phone's grip (a capsule).

### 7.3 Groups: blunted only on their outside corners

**The rule.**
- A group is one shape. Its outside corners take --r-2; every corner inside the group is --r-0.
- Gaps are kept as they are (4–5px). This is Material 3 Expressive's connected group at Vellum's scale (§4).
- Nothing in the layout moves, so the change can't break "nothing moves under a hand" (AGENTS.md §11) [code].

**Single-row groups** (the start corners of the first segment, the end corners of the last):
- .radio-group > .radio-btn: #aspectGroupWide, #alignGroup, #valignGroup, #textStopsGroup, #bgStopsGroup, .light-seg;
- .film-seg: here the segment is the .radio-btn inside each label, so the first and last are label:first-child > .radio-btn and label:last-child > .radio-btn.

**Two-row blocks** (the block's four corners, by position):
- #aspectGroup, three by two: the 1st button top-left, the 3rd top-right, the 4th bottom-left, the 6th bottom-right. Override what the single-row rule gave the 1st and 6th.
- .film-moves and .film-cards, two by two: the 1st top-left, the 2nd top-right, the 3rd bottom-left, the 4th bottom-right.

**Upper / Lower / Swap.** The choices are the group: Upper takes the start corners and Lower the end corners. Swap is an action ("Avoid using a segmented control to offer actions", §4), so it is a button of its own with all four corners at --r-2. A slightly wider gap before Swap would say so; that is Ruby's call (Gaps).

**Joined groups** (gap 0, the shared border collapsed with button + button { border-left:none }):
- .forge-zoom (minus, fit, plus) and .forge-use (Apply, Keep): the first button's start corners, the last button's end corners, the rest square.
- The collapse can stay as it is: ghost buttons change their background on hover, not their border.
- The focused segment is raised (position relative, z-index 1, as Bootstrap does, §4) so its ring is drawn over its neighbour.

**The phone's tab bar** is joined but runs edge to edge: square entirely (§6).

**Not groups.** Each of these is a button of its own with all four corners at --r-2: .btn-row (separate actions, 7px apart), .preset-actions, .surface-acts, the seed's field and moon button, and the Athanor bar's other buttons. .element-row too, unless Ruby wants the four readings read as one instrument (Gaps).

In CSS, roughly. This is a sketch for the pass that makes the change, not code to paste:

    .radio-group > .radio-btn, .film-pick .radio-btn { border-radius: var(--r-0) }
    .radio-group > .radio-btn:first-child, .film-seg > label:first-child > .radio-btn,
    .forge-zoom > button:first-child, .forge-use > button:first-child
      { border-start-start-radius: var(--r-2); border-end-start-radius: var(--r-2) }
    .radio-group > .radio-btn:last-child, .film-seg > label:last-child > .radio-btn,
    .forge-zoom > button:last-child, .forge-use > button:last-child
      { border-start-end-radius: var(--r-2); border-end-end-radius: var(--r-2) }
    #aspectGroup > .radio-btn:nth-child(1)  top-left only
    #aspectGroup > .radio-btn:nth-child(3)  top-right only
    #aspectGroup > .radio-btn:nth-child(4)  bottom-left only
    #aspectGroup > .radio-btn:nth-child(6)  bottom-right only
    .film-moves, .film-cards: label 1 top-left, 2 top-right, 3 bottom-left, 4 bottom-right
    .layer-seg > .layer-swap { border-radius: var(--r-2) }
    .layer-seg > [data-layer="lower"]  end corners (it is not the last child)
    .forge-zoom > button:focus-visible, .forge-use > button:focus-visible
      { position: relative; z-index: 1 }

### 7.4 Focus outlines

- **Delete border-radius from :focus-visible.** Today it reshapes the switch, the dials and the range inputs whenever they take focus (§1.4). Delete it from .is-picking too.
- The outline then follows each element's own radius: CSS UI 4 [src](https://www.w3.org/TR/css-ui/), in Chromium 94, Firefox 88 and Safari 16.4 [src](https://github.com/Fyrd/caniuse/issues/6099):
  - a square element gets a square ring;
  - a blunted one gets a blunted ring;
  - a segment's ring has its own outer and inner corners.
- **Check by eye** that the 2px-offset ring looks concentric, since the spec doesn't fix that (§6). At a 2–3px radius it will read as concentric either way.
- **Inset rings stay as they are.** .card:focus-visible and summary:focus-visible (offset −1px) sit on the border and take the card's curve.
- **The rack's knob.** Give its svg border-radius 50%, so the dotted keyboard ring round a knob is a circle, not a square round a circle. Circles stay circles.
- **The chooser's tile** shows focus as a ring on .ch-thumb (a box-shadow, which follows the radius). Nothing to change.

### 7.5 Doing it

1. **Replace the square block** (§1.1) with the token rules, without !important. Keep !important only where Coloris needs it: .clr-picker, the swatches and .clr-field button.
2. **Write each radius into its selector's existing rule** rather than adding a later block, so the stylesheet's overridden-declaration count doesn't climb (test/hygiene.test.mjs) [code].
3. **Delete the radii that never drew** (§1.2): .ld-btn 8px, .snap-btn 6px, the desk tabs' 8px, .spell-chip 3px.
4. **Run tools/css-audit.py**, then **tools/css-prune.py**, as AGENTS.md §3 asks when the stylesheet is touched.
5. **Look at it:**
   - the phone with tools/phone-shot.mjs (412 px at 2.6), on the Materia tab (the radio rows, the dials, the switch), the Rituals tab (the presets) and the Moving Image sheet;
   - the desk at a ratio of 1;
   - all four themes. Vellum is light, so its hairlines are the faintest.
6. **Show Ruby the sheet before the release** (AGENTS.md §3) [code]. Show the round version beside the bevel version (§5.3).

---

## Gaps

**Unread or secondary**
- **Material 3's own pages** (m3.material.io: the shape scale, segmented buttons) and the Compose reference for SingleChoiceSegmentedButtonRow could not be fetched (the tool refused URLs not reached by a search). Material's values and component mapping come from the Android components docs mirror on gitea and the Compose API reference instead.
- **Apple's HIG segmented-controls page** returned "Page Not Found" from the mirror reached. Its text was read through a third-party copy.
- **Carbon's sharp default** rests on a secondary summary. Carbon's own checkbox spec, read directly, gives no radius at all.
- **GOV.UK's square button** rests on a copy of its button styles in use on another government site. The Design System page itself says nothing about corners.
- **Fluent UI's web tokens** (often quoted as 2, 4, 6 and 8px) were not verified. The Fluent 2 shapes page read here gives 0, 2, 4, 8 and 12px.
- **Frontend Masters' "Classic Border Radius Advice" article** redirected to a host the tool would not fetch.
- **Clipping to the inner curve.** No source was read for overflow clipping to the padding edge's curve (§2). That claim is [est] from how browsers draw; look at it.
- **No source measured how a 1–3px radius reads** at a ratio of 1 against 3. §5.2 is arithmetic and judgment.
- **The offset ring's radius** (whether a 2px-offset outline grows its radius by 2px) is left open by the spec, and was not checked browser by browser.

**For Ruby to decide**
1. **"circles barely any rounding"**: what did Ruby mean? Read here as "the smallest things get the least" (--r-1), with the app's real circles left round.
2. **The radio rows**: keep their 4–5px gaps, with only the group's outside corners blunted (§7.3, the default here)? Or close the gaps into one joined bar with shared borders, as Bootstrap and Material's toggle group do (a layout change)?
3. **Windows at 3px, or 2px like the buttons?** "Just, like, 2px" could mean nothing rounder than 2px.
4. **The four readings**: four buttons, or one group blunted only at its ends?
5. **Swap**: its own button beside Upper and Lower (the default here), and with a wider gap?
6. **The bevel** (§5.3): a 45° cut instead of a curve on Chromium, falling back to round elsewhere, on the review sheet as a variant?
