# Prior art: synthesizer-style controls for the Materia panel (PoetryPress / Unfixable Vellum)

Key: **[src]** = stated in a consulted source, with its URL. **[est]** = my estimate or inference, not stated by a source.

Researched 2026-10-19. Every [src] link below was opened and read during this session. Limits:
- The search budget ran out before I found sources on astrolabe/armillary UI motifs, so those parts are [est].
- Apple's current HIG "Sliders" page returned "Page Not Found" from the mirror I reached. I used Apple's archived NSSlider tick-mark documentation instead.
- Two PDFs (RWTH and LMU papers on touch knobs) were blocked by the fetch tool.

---

## 1. What reviewers say about synth and visual-synth control panels

### 1.1 Hardware synths

**Teenage Engineering OP-1 / OP-1 Field.**
- MusicRadar praised the four colour-coded encoders, where "each knob's function is shown by the screen graphics." It also warned that "it may not be obvious what you're actually controlling behind the flashy graphics," and called the manual "little more than a list of parameter names" [src](https://www.musicradar.com/reviews/teenage-engineering-op-1).
- CDM said the screen "seems like part of the hardware and the instrument, rather than being a menu system." It credited "color-coded knobs and extensive graphical feedback" with making synthesis "toy-like in the best way" [src](https://cdm.link/teenage-engineerings-op-1-instrument-hands-on-videos-why-its-different/).
- Gearnews on the OP-1 Field: the encoder colours match the on-screen parameters, and "it's impossible to get lost in deep menus." The downside is that four encoders give at most eight settings with Shift, so "there are sometimes simply too few adjustable parameters" [src](https://www.gearnews.com/teenage-engineering-op-1-field-review/).
- A designer's write-up describes TE's ethos as a deliberate choice of priorities, "not a compromise between different points of views," plus pervasive playfulness [src](https://read.cv/jdsimcoe/inside-design-at-teenage-engineering).

**OP-Z.**
- It has four endless dials coloured green, blue, yellow and red. Each track has up to four parameter pages, and each page has its own colour [src](https://teenage.engineering/guides/op-z/interface-overview).
- The LED beside each dial shows the value in one of three ways: brightness that scales with the value, a neutral green at 50%, or distinct colour segments for stepped values [src](https://teenage.engineering/guides/op-z/interface-overview).
- Engadget found its "small glyph-like icons" "not all instantly obvious," and found settings easier to navigate on the phone app than on the device [src](https://www.engadget.com/2019-02-19-teenage-engineering-op-z-review-synth.html).

**Elektron Digitakt.** Parameters are reached through five page buttons (TRIG, SRC, FLTR, AMP, LFO) below high-resolution endless encoders. The reviewer criticised an "arbitrary, and as far as I could tell undocumented, button combo" and "a bit of a learning curve" [src](https://www.soundonsound.com/reviews/elektron-digitakt).

**Make Noise.** Panels are "graphic, experimental and mysterious": black panels with white/silver line-art, a gold accent, and "enigmatic symbols and diagrams." The brand positions this as "an invitation to explore" [src](https://madegooddesigns.com/make-noise-brand-guidelines/). This is the closest hardware precedent to a flat, line-drawn, occult-flavoured panel [est].

### 1.2 Software synths and patchers

- **Bitwig Grid.** Modules sit on a fixed grid like "Scrabble tiles." Cord colours are "advisory rather than mandatory," and unselected cords "turn translucent," which "minimises" clutter. The built-in help window was singled out as "massively useful" [src](https://www.soundonsound.com/reviews/bitwig-studio-3).
- **Vital.** Reviewers call it "not crammed with endless knobs and sliders" and "neatly arranged, color-coded" [src](https://pluginoise.com/vital-synth-review/). Its controls "are animated at a beautiful 60 FPS" [src](https://producelikeapro.com/blog/vital-synth-review/).
- **Serum 2.** "Modulation feedback is clearer at a glance" [src](https://pitchinnovations.com/blog/serum-2-vs-serum-1-worth-upgrading/).
- **VCV Rack.** In a thread on randomisation, one user proposed "tiny parameter locks next to controls" but doubted it "could be standardised or enforced." The developer proposed a per-parameter `randomizable` flag instead [src](https://community.vcvrack.com/t/randomize-right-click-context-menu/1492).

### 1.3 Video synths and visual tools

- **Critter & Guitari EYESY.**
  - It has five knobs [src](https://critterandguitari.com/eyesy). "The role of the knobs is dependent on the current mode," and knob values carry over when you switch modes [src](https://docs.critterandguitari.com/EYESY/ey_os_3/).
  - The on-screen display shows "the current positions of the knobs" along its bottom, and recolours them by state: white idle, green when a sequence plays, red when recording [src](https://docs.critterandguitari.com/EYESY/ey_os_3/).
  - Mixdown calls it "perhaps the easiest unit on the list to understand and operate right out of the box" [src](https://mixdownmag.com.au/features/entering-the-wonderfully-strange-realm-of-video-synthesisers/).
  - This is the nearest analogue to Vellum's surfaces, where the same slider slots mean different things per surface [est].
- **LZX Videomancer.** The quick-start lists a "rotary encoder, big slider, and motion and nav buttons" [src](https://cdm.link/videomancer/).
- **Hydra.** Olivia Jack: "Inspired by analog video synths," "(Parameters are like knobs.)" [src](https://cdm.link/hydra-olivia-jack/).
- **TouchDesigner value ladder.** Vertical movement picks a scale (increment size), then horizontal drag changes the value at that scale. A 0.375-second delay stops the scale from flipping by accident. Users asked for the scale to stay locked while the button is held [src](https://forum.derivative.ca/t/rfe-lock-value-ladder-to-selected-increment-level/230652).
- **Filter Forge.** Users "randomize or control specific parameters of each filter through sliders, color pickers, and checkboxes," with storable presets [src](https://en.wikipedia.org/wiki/Filter_Forge).
- **Substance Designer.** Exposed parameters carry several settings [src](https://helpx.adobe.com/substance-3d-designer/using/exposing-parameters.html):
  - a UI Label and Group
  - "Minimum value for UI" / "Maximum value for UI"
  - a **Clamp** that sets whether the limits are soft or hard
  - a **Step** for granularity
  - **Visible If** conditions

### 1.4 Skeuomorphism, and knobs vs sliders as such

- One UX essay argues skeuomorphism persists in music software for commercial reasons ("the skin of the plugin is the only element of differentiation"), not for usability. It cites Native Instruments' Play Series and Endlesss as flat counter-examples [src](https://uxdesign.cc/why-is-skeuomorphism-hard-to-die-in-music-production-interface-design-a634efa3e089).
- On the MOD forum, a developer doubts skeuomorphism is "the best way for an efficient workflow" and points to "all that wasted space" [src](https://forum.mod.audio/t/skeuomorphism-in-plugin-uis-should-we-avoid-it/1267).
- The Outline's critique of knobs in audio software is summed up as "Except you have to control them with a mouse" [src](https://tech.slashdot.org/story/17/08/25/1550203/why-are-there-so-many-knobs-in-audio-software).
- With *physical* controls, a NIME study found "no significant difference … between using knobs and sliders" [src](https://nime.org/proc/nime2009_gelineck/). Any knob-vs-slider difference on a phone therefore comes from touch ergonomics, not from the control type itself [est].

**Takeaways for Vellum** [est]:
- Reviewers reward three things: colour or glyph identity tying a control to what it changes (OP-1, OP-Z), one clear readout location (OP-1 screen, EYESY on-screen display), and restraint (Vital, Bitwig's translucent cords).
- They punish two things: graphics that hide what is being controlled (OP-1) and glyphs that aren't learnable (OP-Z).

---

## 2. Touch knobs: interaction research and practice

### 2.1 Drag mode

- **Apple GarageBand** has a system setting for "Knob Gestures": Automatic, Linear or Circular. The default, Automatic, responds to both [src](https://support.apple.com/guide/garageband-iphone/chs75fb2314/ios).
- **Circular vs linear on touch** (a small three-person thread):
  - One user finds circular mode neither "particularly intuitive or accurate."
  - Linear mode "avoids value jumps because movement is relative to the knob's starting position."
  - "Bigger knobs allow for more precise control."
  - [src](https://community.midikinetics.com/viewtopic.php?p=10082)
- **Loopy Pro forum, thread 1:**
  - Knobs on touch are hard because you can't tell how far to drag, and the finger covers the control. Faders are easier because you can judge the distance.
  - Linear mode's range is "a guessing game."
  - Users like a one-notch **flick** (Korg), **double-tap to recentre**, and controls that enlarge while held (Heavy Brass).
  - [src](https://forum.loopypro.com/discussion/comment/283469/)
- **Loopy Pro forum, thread 2:**
  - Thor's distance-based scaling: "further away you move your finger from the knob, larger the fader turns."
  - "the finger can hide the value being changed."
  - Values "shift slightly when the finger lifts."
  - On touchscreens "there is still no standard way" to do fine control.
  - [src](https://forum.loopypro.com/discussion/comment/490460/)
- **Desktop conventions:**
  - FabFilter: drag up/down to turn, Shift for fine, Ctrl/Cmd-click to reset, double-click to type a value, hover popup for name and value [src](https://www.fabfilter.com/help/pro-q/using/knobs).
  - webaudio-controls: up or right increases; the full range spans `128/sensitivity` px; there's a `valuetip` overlay; Ctrl-click restores `defvalue` [src](https://github.com/webmusicdevelopersjp/webaudio-controls).
  - Ableton users reset with "Press and hold Delete and tap" and say a double-tap would be better [src](https://forum.ableton.com/viewtopic.php?p=1819410).

### 2.2 Fine adjustment precedents

- **iOS media scrubbing.** Hold the thumb, drag *down away* from the track, and the speed steps through "Hi-Speed … Half-Speed, Quarter-Speed, and Fine," with the current speed shown on screen [src](https://www.howtogeek.com/254608/how-to-scrub-through-audio-and-video-slowly-in-ios/).
- **TouchDesigner's ladder** (§1.3): pick the scale on one axis, drag on the other, with a hysteresis delay [src](https://forum.derivative.ca/t/rfe-lock-value-ladder-to-selected-increment-level/230652).
- **Nomad Sculpt.** A second-finger tap to "reset the slider to its pre-drag value" was proposed and declined by the developer [src](https://forum.nomadsculpt.com/t/slider-gesture-idea-for-small-increments/23421).

### 2.3 What mobile synth apps do and what goes wrong

- **Moog Model D (iOS).**
  - "There's a lot crammed into the GUI," it is "a bit awkward to program," and it copies the hardware panel rather than enlarging controls.
  - Tip: "touch the representation of the wooden case while turning the knob and everything becomes easier to control."
  - [src](https://www.soundonsound.com/node/4918957)
- **Moog Model 15.** Users complain that "we can't use multiple knobs at the same time" [src](https://forum.moogmusic.com/t/model-15-app-badly-needs-multi-knob-control/22523).
- **Drambo.**
  - "Tapping a knob to nudge often triggers connection mode instead."
  - Users want an overlay showing the exact value, and one asked for a lock option because accidental edits make live use "risky and annoying."
  - [src](https://forum.beepstreet.com/discussion/comment/52438/)
  - Its knobs appear "when you need them," and it offers "customizable compact, rack views" [src](https://www.sonicstate.com/news/2020/04/02/modular-ios-groovebox/).
- **Thor (iPad).** Tapping a knob brings up "a graphic indicator" of the exact amount, and "Knobs and sliders are so, so easy to use" [src](https://ask.audio/articles/review-thor-for-ipad). Its touch redesign gave "extra visual feedback" and reduced accidental contact [src](https://cdm.link/propellerheads-thor-synth-on-ipad-redesigned-for-touch-and-why-thatd-be-nice-on-pc/).
- **Korg Gadget.** Mobile layout splits vertically: sequencer on top, mixer and gadget below [src](https://ask.audio/articles/review-korg-gadget-for-ios). The Switch edition uses a held button for "more precise" adjustment [src](https://detune.co.jp/KORG_Gadget_User_Manual_en.html).
- **AUM.** Praised for "sharp vector graphics" and a channel strip of fader plus Mute/Solo/Record buttons [src](https://musicradar.com/reviews/tech/kymatica-aum-636178).
- **Koala.** I found no reviewer text about its knob behaviour [est: gap].

### 2.4 Accessibility and target sizes

- **ARIA slider pattern** [src](https://www.w3.org/WAI/ARIA/apg/patterns/slider/):
  - role `slider`, with `aria-valuenow`/`min`/`max`
  - `aria-valuetext` when the number isn't meaningful (their example: "Monday")
  - `aria-orientation="vertical"` for vertical sliders
  - keys: arrows step, Home/End jump to the ends, Page Up/Down make bigger steps
  - The pattern doesn't cover rotary knobs, but a knob is semantically a slider [est].
- **WCAG 2.5.7 (Dragging Movements, AA).** Anything done by dragging needs a single-pointer alternative, such as tapping the track or using an adjacent input. "Achieving keyboard equivalence … does not automatically meet this success criterion" [src](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements). Another guide suggests + and − buttons as an option [src](https://tabnav.com/academy/wcag/success-criterion-2.5.7).
- **WCAG 2.5.8 (AA).** Targets must be at least 24×24 CSS px, or spaced so that 24-px circles don't overlap [src](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- **Android.** Recommends 48×48 dp, "about 9mm," with 8 dp spacing [src](https://support.google.com/accessibility/android/answer/7101858?hl=en).
- **Slider design guide.** 44×44 px thumb areas, with the invisible hit area extending past the visible thumb [src](https://www.setproduct.com/blog/slider-ui-design).
- **CSS `touch-action`.** By default the browser takes pans and fires `pointercancel`. Custom drag surfaces use `touch-action: none`, and changes after a gesture has started have no effect [src](https://developer.mozilla.org/Web/CSS/touch-action).

---

## 3. Vertical sliders and faders on phones

- **The strongest evidence.** In a CHI 2019 study, Colley, Mayer and Henze had 20 people set values 0–100 on horizontal and vertical sliders [src](https://www.medien.ifi.lmu.de/pubdb/publications/pub/colley2019investigatingthe/colley2019investigatingthe.pdf):
  - "the vertical orientation introduced more offset distortion."
  - Orientation had no significant effect on absolute error or time.
  - A filled "Bar" style had less offset than a bare "Thumb" style.
  - Errors were largest at 70–95% of the track.
  - Recommendation: horizontal bar where distortion matters.
- **Implication** [est]: vertical faders are a *density* choice, not a precision choice. Pay for them with a filled bar, a readout, and fine-adjust.
- **When to go vertical.** "Use vertical sliders where horizontal space is limited." Also: show ticks only "if they're truly helpful," "avoid too many steps on small sliders," and "show current value on drag, then hide it" [src](https://www.setproduct.com/blog/slider-ui-design).
- **Tick conventions (Apple NSSlider)** [src](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/Slider/Tasks/UsingSliderTickMarks.html):
  - Ticks are evenly spaced.
  - On vertical sliders they sit left or right (default left).
  - For circular sliders "the tickmarks are always outside the circle."
  - `allowsTickMarkValuesOnly` makes the knob jump "to the tick mark nearest the cursor."
- **Material 3.** Discrete sliders snap to values "marked with stop indicators." The handle is a thin upright bar, and a value label appears while pressed or dragged [src](https://9to5google.com/2024/01/18/material-you-sliders/).
- **Detents.** A detent is "one or more physical click-stops which can be felt when a rotary control is moved" [src](https://www.soundonsound.com/glossary/detent).
- **Mixer-row grammar.** In AUM, the per-channel buttons sit with the fader in the strip [src](https://musicradar.com/reviews/tech/kymatica-aum-636178). The mixer analogue for a lock is therefore a small button at the foot of each strip, aligned in one row [est].
- **Locks elsewhere:**
  - Minimal Audio Rift: "Right-click on a parameter to bring up the lock option" [src](https://manual.minimal.audio/rift-manual/modulation/randomization).
  - VCV users want visible "tiny parameter locks next to controls" [src](https://community.vcvrack.com/t/randomize-right-click-context-menu/1492).
  - Hidden locks (long-press or right-click) are invisible on a phone, so a visible lock row is better here [est].

---

## 4. Haptics on the web

### 4.1 `navigator.vibrate`

- **API behaviour** [src](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate):
  - It needs **sticky user activation**.
  - It takes a number or an on/off pattern array.
  - A new call cancels the running one.
  - Over-long patterns are truncated.
  - Some devices don't vibrate in Silent or Do Not Disturb.
- **Spec limits** [src](https://www.w3.org/TR/vibration/): max 10 pattern entries and 10 s per entry. It is refused when the page isn't visible.
- **Support.**
  - The W3C TAG review notes that Firefox "decided to make the API act as no-op," and that "only implementation is chrome" [src](https://tag-github-bot.w3.org/gh/w3ctag/design-reviews/971).
  - An Apple engineer filed a formal objection, saying the spec "is falsely claiming to be implemented by Firefox" [src](https://lists.w3.org/Archives/Public/public-review-comments/2024May/0000.html).
  - In Firefox the function exists even without hardware, so "there is no way to detect whether or not the device supports vibration" [src](https://bugzilla.mozilla.org/show_bug.cgi?id=1653318).
- **For Ruby** [est]: Ruby tests on Chrome *and* Firefox on a Moto G Stylus, so haptics will work in Chrome and silently do nothing in Firefox. Don't read success from the return value.

### 4.2 The iOS switch trick: works on iOS 17.4 to 26.4, patched in 26.5

- **The control.** `<input type="checkbox" switch>` shipped in Safari 17.4 with the ARIA `switch` role. WebKit's announcement doesn't mention haptics [src](https://webkit.org/blog/15054/an-html-switch-control/).
- **The hack.**
  - Early `ios-haptics` created a hidden `<label>` and switch, "clicks" it programmatically, and removes them. Intensity and pattern can't be customised [src](https://unpkg.com/ios-haptics@0.0.8/README.md).
  - WebHaptics uses the same off-screen-label click. The author calls it a "hack" that may stop working, and notes that the WebKit team opposes the Vibration API [src](https://azukiazusa.dev/en/blog/ios-safari-web-haptics).
- **The patch.**
  - A tester page: "Programmatic iOS haptics work on iOS 17.4 to 26.4." Apple "patched the underlying behavior in iOS 26.5," but "direct user interaction with a real `<input type="checkbox" switch>` still works" [src](https://rapidtoolset.com/en/tool/ios-haptics-tester).
  - An independent user says a web demo worked for "sliders, rotary knobs, toggles" on iOS 26.1, but "nothing has worked since he updated to iOS 26.5" [src](https://openstagecontrol.discourse.group/t/haptics-support-on-sliders-and-buttons/4255).
  - The current `ios-haptics` README now "renders a transparent `<label>` on top of your element … when the user taps the element, the label forwards the tap to the switch as a trusted click" [src](https://npmjs.com/package/ios-haptics). Its v3.0.0 rewrite was published 2026-06-24, per the npm registry.
  - MDN's compat data team was confused by iPhones "vibrating" through polyfills [src](https://github.com/mdn/browser-compat-data/issues/29166).
- **Consequence** [est]:
  - On current iOS, a web page can give a haptic only when the finger *taps* a real switch's label.
  - Drag detents on iOS are impossible.
  - Tap targets (steppers, the lock, named-step chips) can tick if each is built as a label over a real switch.

### 4.3 Durations and patterns

- **Android's haptics principles** [src](https://developer.android.com/develop/ui/views/haptics/haptics-principles):
  - "A good keyclick haptic feedback signal should last between 10 to 20 milliseconds."
  - The actuator "may continue to ring for another 20 to 50 milliseconds."
  - Legacy one-shot `vibrate(long)` "might feel buzzy."
  - "Given the choice of buzzy haptics or no haptics … choose no haptics."
  - Frequent events "should be very subtle."
  - A rising-amplitude sequence of ticks can signal approaching a target.
  - Keep haptics in sync with visuals, and use them sparingly.
- **Other practice.**
  - One developer's composable uses `navigator.vibrate(10)` on non-iOS devices [src](https://kimsal.com/blog/2026/03/20/a-bit-of-feedback/).
  - The web-haptics guide reserves its `selection` preset for "slider detent" and says to fire it at the same instant as the visual change [src](https://cdn.jsdelivr.net/gh/lochie/web-haptics@main/SKILL.md).
- **Inference** [est]: the web only has the legacy on/off motor path, so keep pulses at the short end (8–12 ms). Rate-limit to about one pulse per 50 ms so the 20–50 ms ring-out doesn't smear into a buzz.

---

## 5. Flat, ornamental and occult-themed UI precedents

- **Cultist Simulator** (the closest tonal match):
  - Its board is "very bright iconic images with one or two words beneath them," with flavour text on demand. The look is "darkness with spots of bright colour" and "you want negative space. And that is the essence of dread." The colour code is "fairly robust" but not strictly enforced [src](https://www.thumbsticks.com/interview-unseen-arts-behind-cultist-simulator/).
  - The aspect icons worked ("the Aspects were fine"), and "the moment that there is anything broken in the UI, that immediately breaks the fun" [src](https://mcvuk.com/development-news/when-we-made-cultist-simulator/).
  - Critics: text "too small," the game "explains nothing" [src](https://gamecritics.com/brad-gallaway/cultist-simulator-initiate-edition-review/).
  - On mobile, the "smaller screen is a constant headache" and text "less prominent" [src](https://Pocketgamer.com/cultist-simulator/cultist-simulator-mobile-review-its-forbidden-secrets-may-prove-too-forbidding-f/). Yet dragging "feels right at home on the touchscreen" and the style is "clear and attractive" [src](https://toucharcade.com/2019/04/01/cultist-simulator-review/).
- **Book of Hours.** Players complain the skill grid overflows, and 75% UI scaling is "verging on too small." They ask for a way to "reduce card sizes, but keep text size" [src](https://steamcommunity.com/app/1028310/discussions/0/3812913565881867057). Lesson: shrink the ornament, never the label [est].
- **Hades.**
  - "Headers and names carry more classical, stylised treatment," while "body and UI text lean toward clean, readable faces" [src](https://madegooddesigns.com/hades-font/).
  - Supergiant's UI-illustrator brief asks for "hundreds of icons in a stylistically consistent way" and knowledge of "video game accessibility standards" [src](https://www.supergiantgames.com/blog/job-opportunity-ui-illustrator-for-hades-ii).
- **Opus Magnum** (alchemy). Glyphs are functional: they "bond elements together when they pass over them." The parts are "burnished steel," a skeuomorphic route Vellum should avoid [src](https://pcgamer.com/opus-magnum-review).
- **Inscryption.** A deliberately skeuomorphic "remediation" of analogue card games, using "immediacy and hypermediacy" [src](https://dl.digra.org/index.php/dl/article/view/2474). Useful as the opposite pole.
- **Disco Elysium.** The source I found only covers its Twitter-like column dialogue, built for skimming [src](https://80.lv/articles/disco-elysium-working-on-ui-design).
- **Alchemical glyphs as type.** The Unicode block U+1F700–1F77F has 128 characters, but "few fonts support more than a few characters in this block" [src](https://en.wikipedia.org/wiki/Alchemical_Symbols_(Unicode_block)). Draw knob-pointer glyphs as SVG paths rather than relying on font fallback, especially on Android [est].
- **Astrolabe / armillary / magic-circle motifs** [est, no sources read]. The useful vocabulary is a graduated outer *limb* (tick ring), a rotating *rule* or *alidade* (the pointer), and concentric rings for different quantities. Vellum's light and camera dials already speak this language. The knobs should be the same instrument at a smaller scale.

**Readability rules distilled from these precedents** [est, from the sources above]:
1. Ornament in the frame, plain type in the label (Hades).
2. One or two words under every glyph (Cultist).
3. Bright accent only on what's active (Cultist's spots of colour, Bitwig's translucent idle cords).
4. Never shrink label text to fit more controls (Book of Hours).
5. Glyphs must be learnable from one consistent family (OP-Z criticism, Hades brief).

---

## 6. Recommendations for Vellum

These are design proposals [est], grounded in the sources above. On a ~412-CSS-px-wide phone with 16 px gutters there are about 380 px of usable width [est].

### 6.1 Layout rule: choosing knobs, vertical faders or horizontal sliders

Let **N** be the number of continuous surface sliders (Opacity excluded) and **W** the usable width.

| Condition | Layout | Why |
|---|---|---|
| N ≤ 3 | Full-width horizontal sliders | Most precise orientation (Colley) |
| 4 ≤ N ≤ 8 and W ≥ N×44 + gaps (~380 px fits 8) | **Console row of vertical faders**, ~150–170 px travel; Opacity as the rightmost "master" strip, set apart by a hairline | Density where horizontal space is short (setproduct); mixer grammar (AUM) |
| N > 8, or W too narrow, or landscape | **Knob grid**: 4 per row at ~380 px (cells ≥ 80 px wide, knob face 52–56 px, hit area ≥ 48 px) | Knobs use space best (Loopy forum); bigger knobs are finer (midikinetics) |
| Stepped parameter (Species, Second Flower if discrete) | **Stepped knob** with named ticks, in either layout | Rotary selector convention; ticks outside the circle (Apple) |
| Any layout | A "Fine" sheet: tap a control's readout to open a full-width horizontal slider plus − / + steppers | Precision (Colley); WCAG 2.5.7 alternative |

A per-surface override in the surface definition (`layout: "console" | "knobs" | "rows"`) lets Ruby hand-pick, the way EYESY modes reassign generic knobs. Mixing is allowed: faders for "how much" parameters (Flowers, Grass, Petals in the Air, Clouds) and knobs for character or angle-like ones (Wind, Horizon, Species).

### 6.2 Knob

- **Ring.** One 1–1.25 px cream circle at about 40% opacity, with no fill, gradient or shadow.
- **Value arc.** A 2 px rose (#E07A8A) arc over a 270° sweep from 7:30 to 4:30. Bipolar parameters draw the arc from 12 o'clock. Animate only `stroke-dashoffset` for the low-end phone.
- **Tick dots.** Outside the ring, matching the light dial's dots: 11 dots at 10% steps, with the default position's dot slightly larger. For stepped parameters, one dot per step, and the current step's dot fills rose. Apple's convention puts circular-slider ticks outside the circle.
- **Pointer.** The parameter's own glyph (a flower glyph for Flowers, a wind glyph for Wind), drawn as an SVG stroke at the arc's end on the limb. Use a short radial line only when no glyph is defined.
- **Centre.** The numeric value in Literata small figures, hidden at rest and shown while touched. The name sits below in one or two words (Cultist rule).
- **Drag.**
  - Relative vertical drag (no jump on touch-down), with about 200 px for the full range [est].
  - Horizontal drift is ignored until it passes 24 px, then becomes fine mode (§6.5).
  - `touch-action: none` on the control itself, not the panel, so the panel still scrolls from the gaps.
- **Tap without moving.** Selects the control: the readout pins to the display line and ± steppers appear. No value change.
- **Double-tap.** Resets to default, with a 15 ms pulse on Android. This is the Loopy forum's double-tap-recentre and Ableton users' wish.
- **Multi-touch.** Allow two controls at once by tracking each `pointerId` separately (the Model 15 complaint).

### 6.3 Vertical fader

- **Track.** A 1 px cream hairline inside a 44–48 px wide hit strip.
- **Fill.** A filled rose **bar** from the bottom, 2–3 px wide. Colley found the bar style had less offset than thumb-only.
- **Handle.** A short horizontal rule. On press it thins, Material 3 style, and the parameter's glyph appears beside it.
- **Ticks.** Dots on the left at 25% steps, plus a larger dot at the default (the "detent").
- **Strip stack, top to bottom:** glyph, fader, name (one word, rotated never), value, lock.
- **Opacity.** The master strip, separated by a vertical hairline.

### 6.4 Ticks, detents and named steps (Species)

- **Continuous parameters.** A soft detent at the default: a ±2% capture zone with a tick on entry. This is the SOS "click-stop" made virtual.
- **Stepped parameters.** Hard snap, like `allowsTickMarkValuesOnly`. Use `aria-valuetext` for the step name, e.g. "Species: Rose."
  - While dragging Species, show a short **arc of names** (previous / current / next) floating *above* the finger, in the display line. Names never sit round the knob, where Literata won't fit.
  - At rest, the readout shows the current name.
- **Hard-clamp vs soft-limit.** Follow Substance's Clamp: hard for Opacity, soft for randomise-safe ranges.

### 6.5 Fine control

Use iOS-scrub-style tiers keyed to horizontal distance from the control: 0–24 px = 1×, 24–72 px = ½, 72–140 px = ¼, beyond that = ⅒. Add a 300 ms hysteresis (TouchDesigner's lesson) and show the tier ("½", "¼", "fine") in the display line. Keep the ± steppers in the selected state for exact nudges (one step per tap). The Fine sheet (§6.1) covers everything else.

### 6.6 Readouts

- **One display line at the top of the Materia panel**, the OP-1 screen / EYESY on-screen display idea: `glyph · Name · value` in cream, with the tier or step name to the right.
- It appears on touch, stays 1.2 s after release, and is never under the finger (the Loopy complaints).
- **Small per-control values** show only for the selected control and the one being touched, so the panel stays quiet at rest (setproduct: show on drag, then hide).
- **Lift-off jitter.** On `pointerup`, restore the value from about 60 ms earlier if the last movement was under 3 px (the Loopy lift-off complaint).

### 6.7 Locks

- A **visible lock under every control**: in the fader foot row, or after the knob's name.
- The glyph is an outlined circle that fills rose when locked. It needs a 24 px target with 24 px spacing to meet WCAG 2.5.8; 44 px is better if the row allows.
- Locks exclude the parameter from Rituals' randomise (Rift, VCV). No long-press hiding.
- The name gives a natural pun: Vellum is "Unfixable," and a lock *fixes* a value against chance. Label the lock in hidden help as "Fix" [est, flavour only].

### 6.8 Haptics

- **Android Chrome:**
  - `navigator.vibrate(10)` on each tick crossing, rate-limited to 1 per 50 ms
  - `vibrate(15)` on default-detent capture and double-tap reset
  - `vibrate([10, 40, 10])` when a soft limit is hit
  - Nothing during continuous movement between ticks ("very subtle," "less is more")
- **Firefox:** silent no-op. Don't feature-detect from the return value.
- **iOS ≥ 26.5:**
  - No drag haptics are possible.
  - Build the lock, ± steppers and Species step chips as labels over real `<input type="checkbox" switch>` elements (the `ios-haptics` v3 overlay pattern), so taps on them get the native tick.
  - The lock really *is* a toggle, so it can also be an actual switch semantically.
- **Everywhere:**
  - An optional murmur.js soft tick that mirrors detents.
  - A "Haptics & ticks" setting in Esoterica.
  - Fire haptic, sound and visual on the same frame (Android principles; web-haptics guide).

### 6.9 Accessibility

- Every knob and fader gets `role="slider"`, `aria-valuenow`/`min`/`max`, a step-name `aria-valuetext`, and `aria-orientation="vertical"` on faders.
- Keys: arrows step, Page Up/Down step by 10%, Home/End go to the ends, Delete/Backspace resets to default.
- The ± steppers and the Fine sheet satisfy the WCAG 2.5.7 single-pointer rule, which keyboard support alone doesn't.

### 6.10 What makes it unique to Vellum

1. Each knob's **pointer is its own glyph** riding the limb, like the alidade of an astrolabe. The panel reads as a set of instruments, not generic dials.
2. Knobs, the light dial and the camera dial share **one tick-dot limb** and one rose arc, so Materia looks like a single orrery.
3. **Named-step arcs** (Species) read like an alchemical progression rather than a dropdown.
4. A **"Fix" lock row** for randomisation in Rituals.
5. A single **display line** written in the app's voice (glyph · name · value), with the witchy tone reserved for flavour, never for instructions.
6. **Haptics, murmur ticks and the visual** are designed as one detent event, not added afterwards.
