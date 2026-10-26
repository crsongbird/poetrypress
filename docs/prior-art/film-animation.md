# Prior art: animating any setting (more moves for the Moving Image)

Key: **[src](URL)** = read in that source for this doc. **[est]** = my own estimate or inference (arithmetic shown where there is some); a claim about this app's code is [est] with the file named. Researched 2026-10-24 by searching and opening each source; what could not be opened is under **Gaps**.

The request (Ruby): "I think we need more settings so we can do a wider variety of animations — arbitrary settings maybe." The sheet as it stands is in index.html (movingSheet), uiMoving.js and moving.js. The research before this one is docs/prior-art/moving-image.md (encoding, the loop's off-by-one, easing) and docs/prior-art/film-export.md (the dialog's order, wording and phone rules). This doc does not repeat them.

## Summary

- **Tools that let a person animate "anything" do it in one of four ways** [est, from the sources below]:
  1. keys on a timeline: After Effects, Blender, Procreate Dreams, Wallpaper Engine, Photoshop;
  2. two (or a few) snapshots of the whole state, and a tween between them: edelkrone's keyposes, iMovie's Ken Burns Start and End, Keynote's Magic Move, Ghost of Tsushima's marked shots;
  3. a modulator laid on any control, with a shape, a rate and a depth: Resolume's triangle, TouchDesigner's LFO exported to a parameter, Houdini's Motion Effects, VDMX's data-sources, a modular synth's offset and attenuverter, the rings of Bitwig- and Vital-style synths;
  4. everything a function of time: Shadertoy's iTime, Hydra's functions, Blender's drivers, Filter Forge's Normalized Time.
- **On a phone, the second and third need no timeline**, and Procreate Dreams' Performing (a gesture recorded in real time, smoothed) is the one way to draw a path by hand without one [src](https://help.procreate.com/dreams/handbook/keyframes-and-performing/performing).
- **The app already has the second.** To another look eases every number and colour of two whole looks and cross-fades what can't be between (moving.js) [est]. What it lacks is a way to set that far look on the spot ("set start, set end"), and any of the third.
- **Loops are whole numbers.** Each periodic motion runs a whole number of cycles per film, and the frame at t = 1 is never drawn [src](https://bit-101.com/blog/posts/2024-01-27/fotd-loopsin/). Noise loops when it is read round a circle in two extra dimensions, and the circle's radius is "how much the animation changes" [src](https://tproger.ru/translations/drawing-loopy-gifs-from-noise-in-processing).
- **Seeds don't morph; they cross-fade or evolve.** Remotion's Fractal Noise docs advise against animating the seed and say to animate Evolution, which loops by whole revolutions [src](https://www.remotion.dev/docs/effects/fractal-noise). Filter Forge's noises loop a Phase "within a given time frame" [src](https://www.filterforge.com/features/version14/3d-noises.html).
- **Photosensitivity shapes the menu, not just the output.** WCAG's line is three flashes in any one second [src](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html). Ruby's (AGENTS.md §11) is stricter: no large region brightening suddenly and coming back. So only smooth shapes are offered, rates are counted per film, and a sweep never snaps back [est].

## 1. Keys, easing, holds and loops

**After Effects**
- Temporal interpolation is "the interpolation of values in time". Linear "creates a uniform rate of change between keyframes". Bezier gives "the most precise control", with handles set by hand. Auto Bezier "creates a smooth rate of change through a keyframe" and is the default spatial method [src](https://helpx.adobe.com/ae_ar/after-effects/desktop/animate-in-after-effects/animation-keyframes/keyframe-interpolation.html).
- Hold is temporal only: "change the value of a layer property over time, but without a gradual transition". Easy Ease controls "automatically ease speed between keyframes" [src](https://helpx.adobe.com/ae_ar/after-effects/desktop/animate-in-after-effects/animation-keyframes/keyframe-interpolation.html).
- wiggle(2, 30) wiggles "2 times per second up to 30 pixels in any direction", to random values. Its amount can be a link to a Slider Control. loopOut's modes are cycle, ping-pong, offset and continue [src](https://helpx.adobe.com/mx/after-effects/desktop/work-with-expressions/expression-examples/expression-examples.html).
- A plain wiggle never comes back to where it began. The looping version wraps time to the loop's length, takes a second wiggle one whole loop earlier, and blends linearly from the first to the second across the loop, so the end meets the start [src](https://photofocus.com/video/looping-wiggle-in-after-effects/).

**Blender**
- Interpolation is Constant (the curve "holds the value of its last keyframe", stepped), Linear, or Bézier, "the default one" [src](https://docs.blender.org/manual/en/4.0/editors/graph_editor/fcurves/properties.html).
- Easing comes as Penner-style equations by strength (Sinusoidal to Circular) and as dynamic effects:
  - Back is "cubic easing with overshoot and settle";
  - Bounce is an "exponentially decaying parabolic bounce";
  - Elastic is an "exponentially decaying sine wave".
  - Each is applied as Ease In, Ease Out or Ease In Out [src](https://docs.blender.org/manual/en/4.0/editors/graph_editor/fcurves/properties.html).
- F-curve modifiers are "non-destructive effects", stacked [src](https://docs.blender.org/manual/en/2.83/editors/graph_editor/fcurves/modifiers.html):
  - Cycles repeats a curve: Repeat Motion, Repeat with Offset, or Repeat Mirrored, before and after, and "a value of 0 cycles the data infinitely";
  - Noise has a blend (Replace, Add, Subtract, Multiply), Scale (larger is slower), Strength, Offset (in time), Phase ("changes the random seed") and Depth;
  - the Built-in Function is a sine (and others) with Amplitude, Phase Multiplier, Phase Offset and Value Offset;
  - Stepped Interpolation holds each value for Step Size frames.
- Drivers set a property from an expression or from other properties. They are Average, Sum, Min, Max or a Scripted Expression, and frame is one of the Simple Expressions' globals [src](https://docs.blender.org/manual/en/3.5/animation/drivers/drivers_panel.html).

**Procreate Dreams (iPad, touch first)**
- Keyframes: in Keyframe mode, tap the Playhead, choose Move or Filter, set the values; move the Playhead and tap the keyframe icon again. Filters that animate include Opacity, Gaussian Blur, Noise, HSB and Lens Blur [src](https://help.procreate.com/dreams/handbook/keyframes-and-performing/keyframes).
- Ping-pong is made by copying a set of keys, pasting it, and choosing "Reverse keyframes" on the copy. The page names no loop setting [src](https://help.procreate.com/dreams/handbook/keyframes-and-performing/keyframes).
- Easing has four kinds: Linear, Ease in, Ease out, and Ease in and out. You tap and hold between two keys, then choose Set easing. "Set all easings" does a whole track. The easing's name is written between the two keys [src](https://help.procreate.com/dreams/handbook/keyframes-and-performing/easing).
- Performing records gestures "as keyframes in real time": drag on the stage to move, scale or rotate, and lift to pause. Any Live Filter, Opacity among them, is performed by moving its slider. A Motion Filtering slider "adds smoothness and reduces shakiness" [src](https://help.procreate.com/dreams/handbook/keyframes-and-performing/performing).

**Photoshop**
- A layer's Position, Opacity, Style, mask position, Text Warp and Transform can be keyed. "Simply click the stopwatch icon" to start, and Photoshop "automatically creates the animation in between". A filter animates only through a smart object holding the animated layer [src](https://www.smashingmagazine.com/2015/06/creating-advanced-animations-in-photoshop/). So the stopwatch is a per-property "animate" toggle over a short fixed list [est].

**Phone editors**
- Premiere on mobile: "set a keyframe by tapping the diamond with a plus symbol" at the start and at the end. An Ease button beside it sets how "the animation accelerates and decelerates" [src](https://www.adobe.com/au/learn/premiere-pro/web/video-keyframes-on-mobile).
- Its keyframes hold "position, scale, opacity, rotation" together [src](https://www.adobe.com/au/learn/premiere-pro/web/video-keyframes-on-mobile). One key is a snapshot of several properties, the second way in a small form [est].

**Easing as a curve, and holds**
- CSS's keywords are fixed cubic Béziers. linear is cubic-bezier(0.0, 0.0, 1.0, 1.0); ease-in-out is cubic-bezier(0.42, 0, 0.58, 1.0), slow, then faster, then slow again [src](https://developer.mozilla.org/en/CSS/animation-timing-function).
- steps() holds. steps(n, jump-none) "holds at both the 0% mark and the 100% mark, each for 1/n of the duration" [src](https://developer.mozilla.org/en/CSS/animation-timing-function).
- A drone's waypoint carries a "Hovering Time", a hold at that point [src](https://www.heliguy.com/blogs/knowledge-base/how-to-set-waypoint-flights-on-dji-mini-pro-4/).

**Staggering**
- In GSAP, each is the gap between start times. amount is "the total amount of time (in seconds) that gets split among all the staggers", so more targets get smaller gaps and the whole stays one length. from takes "start", "center", "edges", "random", "end" or an index, and an ease spreads the start times unevenly [src](https://www.gsap.com/resources/getting-started/Staggers/).
- For a film of fixed length, amount is the right half of it: the stagger never makes the film longer [est].

## 2. "Animate any slider" in generative and live tools

**Resolume** (VJ software)
- You "click the little grey triangle next to the parameter name" [src](https://resolume.com/support/en/6/parameter-animation).
  - Timeline mode can "loop, ping-pong, random or play once" at a speed.
  - BPM Sync sets the beats for one cycle, looping or ping-ponging.
  - Clip Position runs "exactly in time with the clip".
  - FFT drives it from sound.
- In and out points on the slider set the range it moves over; Shift drags the range without changing its length [src](https://resolume.com/support/en/6/parameter-animation).
- Its random direction jumps. Here that would be a flash [est].

**TouchDesigner**
- The LFO CHOP's Type is Sine, Gaussian, Triangle, Ramp, Square or Pulse. Frequency is "the cycles per second of the oscillation". Offset and Amplitude shift and scale it; Bias shapes the triangle, gaussian and square. Phase: "a value of .5 is a phase shift of 180 degrees, or one half cycle" [src](https://docs.derivative.ca/LFO_CHOP).
- Any channel may be "exported to a parameter of any operator, overriding that parameter's value" [src](https://docs.derivative.ca/LFO_CHOP). You "drag a channel from the viewer to the parameter", choose Export CHOP, and "the parameter goes green" [src](https://docs.derivative.ca/CHOP_Export).
- A looping-noise tutorial's export note: render so as to "prevent doubling the last frame in your loop" [src](https://derivative.ca/community-post/tutorial/looping-noise-part-1-ending-beginning/62085).

**Houdini**
- Right-click a parameter's label and open Motion Effects [src](https://sidefx.com/docs/houdini/network/motioneffects.html):
  - Noise "adds animated noise to the parameter values";
  - Cycle "offsets and repeats keyframed values";
  - Spring "adds overshoot and vibration";
  - Lag "slows and overshoots animation, creating an appearance of heaviness";
  - Limit "clamps, loops, and/or quantizes";
  - Wave "overrides the value of a parameter with the result of a simple wave function".
- They "build networks of CHOP (channel operator) nodes that override the values of a parameter". Several on one parameter are merged. Each can be switched off with Enable effect [src](https://sidefx.com/docs/houdini/network/motioneffects.html).

**Notch**
- Its modifiers include a Continuous Modifier ("a continually increasing modifier value"), a BPM Modifier ("based on a consistent BPM") and Sound, Smooth Value and Triggerable Value modifiers [src](https://manual.notch.one/1.0/en/docs/reference/nodes/modifiers/continuous-modifier) [src](https://manual.notch.one/1.0/en/docs/reference/nodes/modifiers/bpm-modifier). Their parameters were not on the pages reached (Gaps).

**VDMX**
- "Sliders, buttons, pop-up buttons, and just about everything in VDMX can be synced" to a data-source, LFOs among them. Right-click the slider, then choose 'Use Data-Source' [src](https://vdmx.vidvox.net/tutorials/syncing-a-slider-to-a-data-source).
- Its LFO draws Bézier curves, sine waves and random numbers, and its values "are available as data-sources for sliders and other UI items" [src](https://vdmx.vidvox.net/tutorials/generating-control-data-with-the-lfo-and-step-sequencer).

**Wallpaper Engine** (loops for desktops)
- Click "the cogwheel icon next to *Origin*" (or any property) and choose Bind Timeline Animation. Set seconds ("from the first to the last frame") and frames ("the number of keyframes") [src](https://docs.wallpaperengine.io/en/scene/timeline/introduction.html).
- With Auto Keyframe, "any changes you make will automatically become a keyframe". The motion eases in and out by default. Mode is Loop, Mirror ("return to the beginning backwards") or Single [src](https://docs.wallpaperengine.io/en/scene/timeline/introduction.html).
- Mirrored "will run in reverse at the same speed it ran forwards" rather than jump back [src](https://docs.wallpaperengine.io/en/scene/timeline/modes.html).

**Shadertoy and Hydra** (everything a function of time)
- A Shadertoy shader is handed iTime (playback time in seconds), iTimeDelta, iFrame, iFrameRate, iResolution, iMouse and iDate. This list is from Synthclipse's Shadertoy-compatible uniforms [src](https://synthclipse.sourceforge.net/user_guide/fragx/build_in_uniforms.html).
- In Hydra, "each numerical parameter in hydra can be defined as a function rather than a static variable", for example osc(() => 100 * Math.sin(time * 0.1)). An array steps through its values; .fast() speeds it, and it can be smoothed instead of jumping [src](https://hydra.ojack.xyz/docs/docs/learning/sequencing-and-interactivity).

**Filter Forge**
- Its component list has an Animation group: Current Frame, Time, Frame Count, Frame Rate, Normalized Time [src](https://www.filterforge.com/more/help/Components/Components.html).
- To key a value, a user plugs "the Normalized Time into a Tone Curve" and draws the curve: time across, the value up. A staff answer: "there's currently no interface for actual keyframes, but you can use the existing tools to achieve the same results" [src](https://www.filterforge.com/forum/read.php?TID=16520&MID=160002).
- Users ask for keyframes. One wrote, "they should just implement keyframes for all the variables". Another proposed built-in automation such as "change x parameter every x frames". Animating an existing filter's sliders means editing the filter [src](https://www.filterforge.com/forum/read.php?FID=5&TID=17008&MID=162950).
- Version 14's noises gained a Phase that "shifts the slice plane along the Z-axis". The noises "loop the animation within a given time frame", all with "the same duration of the animation cycle" so they combine. Phase can be mapped, so it differs across the picture [src](https://www.filterforge.com/features/version14/3d-noises.html).
- Version 12 could "export generative animation as a video file" [src](https://www.renderosity.com/article/26258/filter-forge-120-released-adds-support-for-video-processing-snippets-and-more).

**Modular synths and soft synths (how a modulation sits on a knob)**
- On a module, the knob sets an offset, the base with no modulation. An attenuverter sets depth and direction: "in its central position, there's no wiggling".
  - The value is the knob plus the gain times the LFO, held to the ends of the range.
  - Example: a 2.5 V knob, gain 0.5 and a ±5 V LFO sweep 0–5 V [src](https://pichenette.readthedocs.io/en/latest/tech_notes/cv_inputs/).
- Bitwig: a modulator's routing button switches to a mode where valid targets are highlighted; "click the target parameter and drag its value to set the point of maximum modulation" [src](https://www.bitwig.com/userguide/latest/the_unified_modulation_system/).
  - The range is relative, and the knob "can still be used", which shifts the range.
  - A list beneath each parameter shows every modulation reaching it.
- A soft synth (Ultra): "Drag this icon to a knob to make a modulation connection" [src](https://ultra.audio/help/synth/modulation/modulation).
  - "A ring will appear around it representing the amount", with a small range knob at its top right.
  - Dragging the range far enough down makes it subtract.
- Serum: "By dragging each LFO to a parameter, it can easily be applied". A blue line shows the span [src](https://sleepfreaks-dtm.com/en/softsynth/xfer-records-serum-3).
- Ableton:
  - An unlinked clip envelope runs on its own length, so it becomes "a slow LFO sweep". Its values are relative, so it is "superimposed" on the track's automation [src](https://www.soundonsound.com/techniques/using-clip-envelopes-ableton-live).
  - In MIDI Map Mode, "assignable elements of the interface become highlighted in blue". Each mapping keeps a Min and Max "that can be edited at any time", and can be inverted [src](https://www.ableton.com/live-manual/12/midi-and-key-remote-control/).

## 3. Camera moves and start and end framing

**The vocabulary**
- Pan and tilt pivot a camera that stays put. A dolly moves it forward or back, a truck sideways, a pedestal up or down. A crane can "sweep up and over the action" [src](https://masterclass.com/articles/guide-to-camera-moves).
  - A zoom changes focal length "while the camera remains stationary". A dolly zoom moves and zooms opposite ways, so the subject stays one size while the background distorts.
  - A rack focus changes focus "mid-shot in order to shift the viewer's attention".
- What each does to the viewer [src](https://artlist.io/blog/filmmaking/camera-movement/):
  - a push in is "usually intensifying the viewer's focus";
  - a pull out reveals, isolates, or gives a moment to breathe;
  - an arc "moves the camera around the subject, usually in a semi-circle", "the camera stalking the subject";
  - a tilt gives awe and reveals something tall.

**Drones (named moves on a phone)**
- DJI's QuickShots are named, set-and-go moves, each with one or two choices [src](https://www.digitalcameraworld.com/tutorials/dji-quickshot-modes-explained):
  - Rocket rises with the camera turning to point down;
  - Dronie "flies backward and upward";
  - Circle orbits "at a constant altitude and distance" left or right;
  - Helix "flies upward and away gradually, spiraling around your subject";
  - Boomerang flies an oval and ends where it began.
  - Heights are chosen from 40, 60, 80, 100 or 120 ft.
- Waypoints are added on the map or in flight, which the guide calls "convenient for framing the shots" [src](https://www.heliguy.com/blogs/knowledge-base/how-to-set-waypoint-flights-on-dji-mini-pro-4/).
  - Each holds Altitude, Speed, Heading, Gimbal Tilt, Zoom and Hovering Time.
  - A point of interest keeps the aircraft "facing toward the subject".
  - Routes can be "saved and repeated" to catch the seasons and day into night.

**Motion control**
- An edelkrone keypose is "a snapshot of the position of the whole system" [src](https://edelkrone.com/pages/edelkrone-system-wide-features-guide):
  - saved by tap and hold, recalled by a tap; "pressing one keypose after another" moves smoothly between them;
  - tapping two keyposes at once starts "a never ending loop between these 2 Keyposes";
  - with three or more, a sequencer plays them in any order, "separate transition speeds between each pose", or back and forth;
  - a time-lapse between two keyposes takes "the total time of the time-lapse shoot and the final video duration";
  - keyposes "can be edited numerically afterwards";
  - its turntable: "Simply set the start and end positions".
- In Unreal Editor for Fortnite, the rail and crane "work like the camera dolly and jib systems of the film industry". The camera's place along the rail is one number, keyed in Sequencer in small steps [src](https://dev.epicgames.com/documentation/fortnite/camera-rig-rails-and-rig-crane-in-unreal-editor-for-fortnite?lang=pt-BR).

**Photo modes and photo apps**
- Ghost of Tsushima: "move the camera anywhere and tap X to set that location", "up to 16 (!) times", then "the camera will smoothly sweep between those marked positions" [src](https://blog.playstation.com/?p=333345).
  - The focal length is saved with each position, and wind direction and speed can be set [src](https://blog.playstation.com/?p=333345).
  - Animated Environment "is on by default"; Focus Distance "works independent from Depth of Field"; Time of Day is set "right down to the second" [src](https://www.androidcentral.com/ghost-tsushima-how-use-photo-mode).
- iMovie on iPhone, Ken Burns: tap Start, "pinch to zoom in or out, then drag the image in the viewer to frame it the way you want". Then tap End and frame it again. The move "starts and ends on the parts of the image you specify" [src](https://support.apple.com/guide/imovie-iphone/knac3eec39c6/ios).
- Keynote's Magic Move: "any objects appearing on both slides become part of the transition". What is on only one side fades. The easiest way is to "duplicate the slide and rearrange, resize, or reorient the objects". Acceleration is None, Ease In, Ease Out, or Ease In & Ease Out [src](https://support.apple.com/guide/keynote-iphone/tanff5ae749e/ios). That is To another look's shape exactly [est].
- Live Photos: Loop "repeats the action", and Bounce "rewinds the action backward and forward" [src](https://www.macrumors.com/how-to/add-effects-live-photos/).
- Motionleap makes a photo move "by drawing paths along the lines where you want your photo to move, and adding anchors where you don't". It is valued because it "loops seamlessly"; "jumpy videos that loop aggressively" distract on a wall [src](https://infiniteobjects.com/blogs/blog/making-the-perfect-object-with-pixaloop).

## 4. Seamless loops and evolving seeds

**Periodic motion**
- t = frame / frameCount. Map it to an angle from 0 to 2π, and "this would form one full cycle through the range, which should then loop perfectly" [src](https://bit-101.com/blog/posts/2024-01-27/fotd-loopsin/).
  - Using cos(t·2π) rather than sin starts the cycle at an end of the range, not mid-swing.
  - Taking t all the way to 1.0 gives "one duplicate frame where it looped".
- So two motions loop together only if each makes a whole number of cycles in the film. A rate in cycles per second would rarely do that; a rate in cycles per film always does [est]. Resolume's BPM Sync (beats per cycle) is the same idea with a beat for the unit [src](https://resolume.com/support/en/6/parameter-animation).

**Noise that loops**
- To loop noise, "we draw a circle in two new dimensions of the noise space": noise(scale·x, scale·y, radius·cos(2πt), radius·sin(2πt)) [src](https://tproger.ru/translations/drawing-loopy-gifs-from-noise-in-processing).
  - "radius is the parameter that controls how much the animation changes";
  - this needs four-dimensional noise;
  - an independent curve is the same noise read far away (x + 1000).
- p5.createLoop's noise has a radius "similar to the concept of frequency", a seed that is a "noise field offset", and a progress from 0 to 1 [src](https://www.npmjs.com/package/p5.createloop). opensimplex-loops uses "the last two dimensions" to "describe a circle in time" [src](https://pypi.org/project/opensimplex-loops/). The Coding Train's polar noise loops make particles "move randomly, but always end up where they started" [src](https://thecodingtrain.com/challenges/136-polar-noise-loops).
- For one value, not a picture, the same circle is a smooth periodic random [est]. Sum a few sines with whole-number harmonics, their phases and weights drawn from a seed: it wanders, never repeats within the film, and closes exactly.

**Seeds**
- After Effects' Fractal Noise: key Evolution from 0 to 1, then choose Evolution Options › Cycle Evolution, with "Cycle (in Revolutions)" matching the last key. "Move out your final Evolution keyframe by one frame" so the same frame isn't shown twice [src](https://photofocus.com/video/tutorials/looping-fractal-noise-in-after-effects/).
- Remotion's port says the same [src](https://www.remotion.dev/docs/effects/fractal-noise):
  - evolution is the thing to "animate this value to morph the texture without moving it";
  - without cycling, "360 continues to a new pattern";
  - the seed picks "a repeatable noise pattern" and is not for smooth change.
- In generative models, White argues that linear interpolation "traverses locations that are extremely unlikely given the prior". The vector's length sags mid-path (the "tent-pole"), so he uses slerp, "a great circle path" [src](https://arxiv.org/pdf/1609.04468).
- The same sag happens to a plain cross-fade of two textures [est]. For independent fields A and B of equal variance, (1 − t)·A + t·B has variance ((1 − t)² + t²)·σ². At t = ½ that is σ²/2: the texture's contrast falls to 71% (1/√2) mid-fade. A·cos θ + B·sin θ keeps σ² at every θ (cos² + sin² = 1). That is the noise-on-a-circle construction again, and slerp's reason in small.

## 5. How the interfaces stay simple

| Pattern | Who | What the person does | On a phone |
|---|---|---|---|
| Two snapshots, tweened | edelkrone, iMovie Ken Burns, Keynote Magic Move, Ghost of Tsushima, Premiere mobile | sets the start, sets the end, picks an easing | yes: two taps and a gesture [src](https://support.apple.com/guide/imovie-iphone/knac3eec39c6/ios) |
| A per-control menu | Resolume's triangle, Wallpaper Engine's cogwheel, Houdini's right-click, VDMX's right-click, Photoshop's stopwatch | opens a control's menu, picks a behaviour (loop, ping-pong, a wave, noise), sets a range | yes, if the menu is reached by a tap, not a right-click [est] |
| A modulator with rate and depth | TouchDesigner LFO, modular attenuverter, Bitwig, Ultra, Serum | picks a shape, a rate and a depth; the knob stays the base | yes: the ring on the knob shows it [src](https://ultra.audio/help/synth/modulation/modulation) |
| A mode where everything assignable lights up | Ableton's MIDI Map Mode, Bitwig's routing mode | enters the mode, taps targets, leaves | yes: nothing extra on screen outside the mode [est] |
| Perform it | Procreate Dreams | moves the thing while time runs; the path is smoothed | made for touch [src](https://help.procreate.com/dreams/handbook/keyframes-and-performing/performing) |
| Everything a function of time | Shadertoy, Hydra, Blender drivers, Filter Forge's Normalized Time | writes an expression or wires a graph | no: it is code [est] |
| A timeline of keys | After Effects, Blender, Procreate Dreams, Wallpaper Engine | keys per property, curves between | heavy on a phone; Procreate Dreams manages it on an iPad [est] |

What the light patterns share [est]:
- the control itself stays the base value (a modular offset, Bitwig's relative range);
- the motion is described in the control's own units (Resolume's in and out points, Ableton's Min and Max);
- a rate counted against the whole (BPM Sync's beats, Wallpaper Engine's length);
- a mode or menu that leaves the main screen as it was.

## 6. What this app can do that others don't [est]

- **A whole look is one object.** serializeCurrentSettings and restoreSettings (uiLook.js) hold every control, and blendLooks (moving.js) already tweens two of them. Elsewhere, "set the end" has to be built per property; here it is the whole page, colours, light, camera, knobs and effects at once.
- **Every frame is rendered offline**, so a knob that takes seconds to draw can still move smoothly. A live VJ tool must keep up in real time.
- **The dials' guides draw at once** (uiDials.js, drawCameraGuide: "a guide of the shot is drawn over the page at once"). A camera path can be performed by hand and seen before any surface is made.
- **Seeds have names** (seedWords.js), so a film that drifts through seeds can say which ones in its note.
- **The moves mean something in the picture**: a sun crossing a ring world, a rack focus on Macro Bloom's own Focus knob (textureParams.js). Generic tools move pixels.

## What we take

Everything here is [est]: a design built on the sources above.

Built in Ursa Major–Mizar: A's four easings; B's set-now end look (the start is the page); C's Also row, its amounts in
tunables.js (FILM_CAMERA), a tilt and a spiral leaning toward the other side of the view from where the dial stands
(so one at the dial's middle still moves), the spiral a helix that pulls back as it leans; the summary's "ends where it
goes". Built in Hyades–Prima Hyadum: A's rest at the ends (None, ½ s, 1 s; dimmed where the film loops) and C's To a shot
(`shotAlong`; Set the shot… tucks the sheet as Set it now does and keeps only the camera). Built in Hyades–Secunda Hyadum: D's
marks, first within the sheet rather than on the page (an Also moving row: a control, how it moves, how far, how many
times; `markValue`), for the surface's knobs that are amounts and the light and its height. Still to come: marking on
the page itself (the ∿ in the locks' place), marks during To another look, and the seed (E).

**The shape of it.** Keep the four moves as the spine: Camera round, Light round, Time passing, To another look. Add two light ways to animate anything, and no timeline:
1. **Set the far look on the spot** (the second way). It moves any number of controls, once or there and back.
2. **Mark controls to move in the film** (the third way). Each marked control sways, sweeps or drifts on its own rate, on top of whatever the spine does.
The main page stays as it is. The marks show only in a marking mode entered from the sheet (Ruby, uiMoving.js: "a subtle video export panel that doesn't show up on the main user interface").

### A. Small additions to what is there (cheap)

- **Easing: Even · Ease in · Ease out · In and out.** These are Procreate Dreams' and Keynote's four [src](https://help.procreate.com/dreams/handbook/keyframes-and-performing/easing) [src](https://support.apple.com/guide/keynote-iphone/tanff5ae749e/ios).
  - Code: moveAlong takes a shape instead of a yes or no. Ease in is 1 − cos(πs/2); ease out is sin(πs/2).
  - UI: the Easing row gets two more segments, four in all, within the five a phone row holds (docs/prior-art/film-export.md §4).
  - Rounds stay Even by default: an eased round pauses once a lap (docs/prior-art/moving-image.md §6).
- **Rest at the ends: None · ½ s · 1 s.** This is a drone's Hovering Time, CSS's jump-none hold, an After Effects hold key [src](https://www.heliguy.com/blogs/knowledge-base/how-to-set-waypoint-flights-on-dji-mini-pro-4/) [src](https://developer.mozilla.org/en/CSS/animation-timing-function).
  - Code: moveAlong maps u through a plateau at 0 and 1, and at the turn under There and back.
  - It matters most for To another look and for a camera move to a shot, where the eye wants a beat on each framing.
  - UI: one segmented row, dimmed for rounds.

### B. The far look, set on the spot (cheap; the biggest reach for its cost)

- **What it is:** "set start, set end" for the whole page (iMovie's Start and End, Keynote's duplicate-and-change, edelkrone's keypose snapshot).
- **In the sheet:** the other-look picker (movingLook) gets a first entry, "Set it now…", beside the kept spells and "The look before the last change".
- **Choosing it:**
  - The sheet tucks into a slim bar over the foot of the page: "Change the page to how the film should end. · Done · Cancel". The bar overlays the page and pushes nothing (AGENTS.md §11, Nothing moves under a hand).
  - The whole app works under the bar: tabs, dials, knobs, colours, the Athanor.
  - Done takes the look as the end (serializeCurrentSettings), puts the start back (restoreSettings of the look taken on entering), and returns to the sheet with the entry named "The look you set".
  - Cancel puts the start back.
  - The undo steps made while setting are dropped back to where they were (uiHistory.js), so setting an end never litters the filmstrip.
- **Set the start too:** a second button, "Start from a look set now…", makes the film's first look a set one rather than the page. Without it, the start is the page as it is, which is what most people mean.
- **Code:** movingLooks (uiMoving.js) gains one entry. The tween, the fades, Playback and the summary are unchanged.
  - Cost: these frames are drawn without frames-ahead, as To another look is today (uiMoving.js sets no frames ahead for a move between looks). The summary's time estimate already measures that.
- **Stagger, later:** "Together · One after another" for this move.
  - The groups ease in turn: light, then camera, then the surface's knobs, then colours, then the page.
  - Each group's t is clamped from (t − k·s)/(1 − (G − 1)·s), with s about 0.15. That is GSAP's amount: the film's length never changes [src](https://www.gsap.com/resources/getting-started/Staggers/).
  - Code: blendLooks takes t per key instead of one t. A small change, but it touches the shared tween, so it comes after the rest.

### C. Camera paths (cheap)

- **"Also" under Camera round: Holds · Pushes in · Pulls back · Tilts · Spirals.** These are DJI's named moves, honest to this app's dial [src](https://www.digitalcameraworld.com/tutorials/dji-quickshot-modes-explained):
  - Pushes in: zoom from the live value to 1.5 times it;
  - Pulls back: to 1 ÷ 1.5;
  - Tilts: view 30 points toward the dial's middle;
  - Spirals: pulls back and tilts while it turns, a Helix.
- The amounts sit in tunables.js and start from the live dial. Each eases by the Easing row, and each is clamped to the dial's 25–400% zoom and 0–100 view (uiDials.js, putCamera).
- Under a Full round with Even easing, the turn loops but a push-in doesn't. The summary says so, and Playback There and back makes it loop (see Loops below).
- **The word for Tilts** comes from the surface's camera guide (textureGenerators.js, camera.guide): "looks down" on a plane, "looks up" on the Ringworld's ring. The dial's middle is straight down on one and straight up on the other (uiDials.js).
- **"To a shot" as a fourth Turn segment:** Quarter · Half · Full round · To a shot.
  - "Set the shot…" tucks the sheet as in B, but only the camera dial counts: Done keeps turn, view and zoom (cameraNow) and puts the camera back.
  - The film eases from the live camera to the shot, the short way round; There and back makes it a loop.
  - This is Ken Burns and a two-mark Ghost of Tsushima, with the shot set on the real dial while its guide draws at once.
- **Code:** place(i) in makeMoving (uiMoving.js) sets cameraView and cameraZoom as it already sets cameraTurn, and the finally block puts all three back.
  - The camera is in the texture's key (textureGenerators.js, describeRequest), so each frame is a new surface, exactly as Camera round is today; frames-ahead still works.
  - Dolly zoom is not offered: the dial has one zoom, not a distance and a lens.
- **Drone flight** (Ruby, 2026-10-25: "drone shot camera including movement (this introduces player movement)"):
  - DJI's QuickShots move the drone itself, not only its gimbal: a Dronie "flies backward and upward", a Rocket "flies
    straight up into the air", a Helix climbs "spiraling around your subject"
    [src](https://www.digitalcameraworld.com/tutorials/dji-quickshot-modes-explained).
  - A fly-over: "Fly low and level toward the object, then climb in a straight line as you reach it", approached at 8 to 15
    mph; most cinematic moves fall within 2 to 8 mph; "Keep speed constant"; "Commit to a single motion"
    [src](https://www.thedroneu.com/blog/types-of-shots-in-drone-cinematography/).
  - So in the app [est]: Also · Drone flight carries the Ringworld's eye itself ahead along the way it first looks, at a
    fly-over's 7 m/s (so a longer film flies farther, never faster), skimming low and then climbing (2.5 m/s by its end),
    its gaze dipping a little as it climbs; set off and arrive gently; the camera may turn as it flies (cameraAlso,
    tunables.js FILM_CAMERA). The eye's place goes in the camera's request (`fly`: metres flown, climbed, the heading, and
    the whole way), so each frame is its own surface; the world it flies over is built once for the whole way (the store
    sown along the flight's line), so no frame sees a thing appear or vanish; the land's mesh follows the eye, kept by
    place, and the eye never sinks into a hill it crosses.

### D. Moving controls: sway, sweep, drift (moderate; the "arbitrary settings")

**Choosing them**
- A new row at the foot of the Move group: "Also moving: none · Choose on the page". Once some are chosen, it reads "Also moving: Petals (sways twice), Light Hue (drifts), the seed (3 seeds) · Change". The row is always there and dims when the surface allows none, so nothing moves under a hand.
- **Choose on the page** enters marking mode (Ableton's MIDI Map Mode, Bitwig's highlighted targets).
  - The sheet tucks to a bar: "Tap ∿ beside what should move. · Done".
  - Every lock on the page fades out and a ∿ shows in its place (uiLocks.js places the locks; the ∿ uses the same slot, so nothing shifts). That covers every control the look saves except the few that aren't lockable (appEvents.js), the dials included.
  - A marked control's ∿ is drawn stiff and filled, an unmarked one relaxed: the nav glyphs' convention, AGENTS.md §11. The ∿ is drawn in the padlock's scratchy hand (LOCK_GLYPH in uiLocks.js).
  - Selects and switches get no ∿: they can't be between. They change only through a set end look (B), which cross-fades them. A knob whose named marks snap (uiDials.js sets snapTicks for a knob with names, unless its snap button is off: Window's Whole Page, Lancet Arch, Arcade) is a choice of kinds, not an amount, and is treated the same way; with snapping off it is an amount again and gets its ∿.
- **Tapping a ∿** opens a small dialog for that control, reusing the modal and its two-handle range (index.html, modalRange). The title is the control's name, as "Petals in the film". The rows:
  - **Moves:** Still · Sway · Sweep · Drift.
    - Sway is a sine around where the knob stands.
    - Sweep goes from one end of the range to the other.
    - Drift is a smooth periodic random (§4), seeded from the page's seed and the control's name, so the same page always drifts the same way.
  - **Range:** the two handles, in the control's own units (Resolume's in and out points, Ableton's Min and Max). For Sway and Drift it opens at the live value ±15% of the control's span; for Sweep, from the live value to the far handle. A hue's range is how far its hue turns, up to ±180°; an angle's (the light's turn, the camera's turn) is in degrees and wraps.
  - **Times in the film:** 1 · 2 · 3 · 4. A caption beneath gives the period in seconds: "once every 6 s" for 2 in a 12 s film.
  - **In step:** With the others · A quarter behind · Opposite. This is the LFO's Phase ("a value of .5 is a phase shift of 180 degrees") [src](https://docs.derivative.ca/LFO_CHOP), and it is the stagger for marks: two hues swaying opposite, a light that leads the petals by a quarter.
  - Buttons: Done · Remove (confirm on the left, AGENTS.md §11).
- **On a knob,** while marking mode is open, a marked knob shows its range as a faint second arc on its ring (uiSkins.js draws the value as an arc of light). That is the soft synths' ring [src](https://ultra.audio/help/synth/modulation/modulation). Outside the mode, nothing is drawn.

**How it moves**
- The knob stays the base, as a module's offset does [src](https://pichenette.readthedocs.io/en/latest/tech_notes/cv_inputs/).
  - Sway and Drift add to the base each frame: under To another look the base is the tweened value, otherwise the live one.
  - The result is held to the control's ends, and angles and hues wrap.
  - Sweep is absolute: it runs from the low handle to the high (Resolume's in and out points).
- Each mark runs on the film's own clock, u = i/n, a whole number of cycles. Under There and back it does not run backward with the move: it keeps going, and still closes, because its cycles are whole.
- **Sweep loops only where it can.**
  - An angle swept by whole turns loops.
  - Any other sweep goes once (low to high, eased by the Easing row), or there and back when Playback says so, or when the mark's Times is 2 or more (each cycle a triangle).
  - It never snaps from high back to low, because a jump of a brightness, opacity or colour across a large area is a flash (Photosensitivity, below).
  - So a rack focus is Macro Bloom's Focus swept 20 → 80, once, eased.
- **Code:**
  - place(i) loops over the marks after the move has set its fields, writing each control's value as it now writes cameraTurn. Setting a value from code fires no input event, so no undo step is made.
  - Frames-ahead keeps working: it calls place(j) for each frame ahead and reads the page's fields (surfaceRequests).
  - The finally block puts every marked control back.
- **Fractional values.** A knob is a range input with step 1, and a range input rounds what it is given. Measured in Chromium (Playwright, 2026-10-24): 50.3 reads back as 50 and 50.7 as 51; with step="any", 50.3 stays 50.3.
  - Without a fix, a ±5 sway stair-steps. Over one cycle of 360 frames the value visits 11 integers; mid-swing each holds about 11.5 frames (360 ÷ (2π·5)); at each peak it rests about 52 frames (the value rounds to 55 while sin ≥ 0.9, which is 51.7° of 360°).
  - So during a film each marked range input gets step="any", and the old step goes back afterward. Most surfaces read a knob as a number (textureGenerators.js, readParam: the value ÷ 100), and the texture key carries the value as given. A knob that is a count (the stones) rounds, so it steps however it is set: its dialog says it moves one at a time.
- **What it costs per frame:**
  - A mark on anything in the texture's key (a knob, a surface hue, the light, the seed, the camera) makes a new surface every frame. That is a camera round's cost, no more, with frames-ahead.
  - A mark on the page's own controls (the backdrop's colours, the text colours, the border, the vignette, the box, the text effects) costs a render() only.
  - The exception is a surface that shows the page behind its glass, which carries the backdrop in its key (env, textureGenerators.js).
  - Swaying the backdrop is the cheapest film there is.
- **Two Surfaces:** a mark belongs to the layer shown when it was chosen. The other layer's controls aren't on the page then (canvasRenderer.js reads them from SURFACE_SOURCE), so the first version marks the shown layer only and says so in the dialog.
- **A surface changed:** marks on its knobs are cleared, because texP3 means a different knob on another surface. Colour and page marks stay.

### E. The seed (a cheap dissolve now; a true evolution later)

- **Now, Drift through seeds.** The seed's ∿ dialog is its own: "The seed in the film: Stays · 2 · 3 · 4 seeds".
  - The film holds each seed, then cross-fades to the next. The last returns to the first, so it loops.
  - It uses the fade To another look already draws: both sides rendered, then a smoothstep alpha (uiMoving.js).
  - Each fade lasts at least 1 s, and no more than one fade runs a second (AGENTS.md §11, lightning: "at most one a second").
  - The next seeds are the seed's neighbours from seedChoice (texCore.js), so a page always drifts through the same ones. The note can name them by their phrases (seedWords.js).
  - Cost: two renders for each fading frame, and no frames-ahead during a fade.
  - With To another look, when the two looks' seeds differ, seed drift is dimmed: one cross-fade at a time.
- **Mid-fade the texture's contrast dips to about 71%** (§4). With 1 s fades among 3 s holds that reads as a breath, not a flaw. A true morph needs the evolution below.
- **Later, Evolution.** A surface's noise grids would be read round a circle: v(θ) = A·cos θ + B·sin θ, where A is today's grid and B a second grid from its own seeded stream.
  - At θ = 0 the picture is today's exactly, so fingerprints hold.
  - Turning θ once round in the film loops: After Effects' Cycle Evolution and Filter Forge's Phase.
  - The cost is per part, in texCore.js's noise helpers (fbmSampler, makeNoiseGrid) and in every part that draws its own random. It belongs with the renderer pass, part by part, not in the sheet.

### F. Later (worth it, not first)

- **Perform the camera or the light** (Procreate Dreams' Performing).
  - "Perform…" in the sheet tucks it. A count of three, then a thin bar runs for the film's length in real time while the person drags the dial. The guide draws at once (uiDials.js), so the shot is seen as it is made.
  - The pointer path is sampled each frame, smoothed (Procreate's Motion Filtering), and resampled to the film's frames.
  - Moderate cost: a recorder and a smoother, and the dials' own handlers.
- **More than two looks in turn**: Ghost of Tsushima's 16 marks, edelkrone's sequencer. The set-look entry from B becomes a short list, each leg eased, the last returning to the first for a loop.
- **The poem moving.** A §Variable that is a value at the frame (pmlVars.js) would let /arc or a colour breathe line by line: Hydra's "every parameter a function". PML is a contract: it can only be added, absent when unused, so every poem draws as before. Costly, and it needs Ruby's yes.

### How they combine

| Spine | What it drives | Marks on top | The seed |
|---|---|---|---|
| Camera round (+ Also) | the camera's turn, and view and zoom with Also | anything; a mark on the camera's turn adds a wobble to the orbit | may drift |
| Light round | the light's turn | anything; a mark on the light adds to the round | may drift |
| Time passing | the sun (the light's turn and height) and the scene's clock | anything but the light (dimmed: the sun owns it) | may drift |
| To another look (kept, set now, or the look before) | every key that differs | sway and drift ride the tweened value; a sweep on a key that also tweens is dimmed | dimmed when the seeds differ |

- Under Time passing the frames already run the scene's clock (setSceneTime in canvasRenderer.js). Marks ride the same frame index, so a Ringworld day with a drifting Land Hue keeps its clouds and lights in step.

### Loops, honesty and the summary line

- A film loops when its spine does and every mark does:
  - the spine: a full round with Even easing, a light round, a whole number of days, or There and back;
  - each mark: Sway or Drift (whole cycles), an angle swept by whole turns, or a sweep that goes there and back;
  - the seed: a drift (it returns to the first seed).
- The summary line (movingSummary in uiMoving.js) adds one plain clause at its end, beside the "sun returns the way it came" note:
  - "· loops", or "· ends where it goes" naming the first thing that doesn't loop ("· ends where it goes: the zoom pushes in");
  - and the marks counted: "· 3 controls moving".
- Words for strings.js (American, plain): Sway, Sweep, Drift, Still; "Times in the film"; "In step"; "Also moving"; "Choose on the page"; "Set it now…"; "Set the shot…". The ∿ glyph's tooltip: "Moves in the film: tap to choose how".

### Photosensitivity (AGENTS.md §11; WCAG 2.3.1)

- No square, pulse or random-jump shapes: Resolume's random and the LFO CHOP's Square and Pulse are left out on purpose.
- Rates are at most 4 per film and the shortest film is 6 s, so the fastest mark is 4 ÷ 6 = 0.67 cycles a second: at most one pair of opposing changes about every 1.5 s. WCAG's limit is three flashes in any one second [src](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html). Ruby's rule (no sudden large change and back) is met because every shape is smooth.
- A sweep never snaps back (D). A seed fade lasts at least 1 s, one a second at most (E).

### Saving

- The sheet's choices are "how a film is made, not part of the look" today (test/persistenceCoverage.test.mjs, EXEMPT). The marks and the set look would follow that rule: kept in the draft, so they survive a reload, but not in a look, a preset or a spell.
- **For Ruby to decide:** should a shared spell carry its motion? If so it is an added key in the look, absent when unused, which every preset resets (AGENTS.md §5.4). That is a choice about what a look is, so it is Ruby's.

### Phone layout (the baseline Moto G Stylus)

- The sheet stays one column of fieldsets.
- The new rows are Rest, "Also" under Camera round, "To a shot" as a Turn segment, and "Also moving". Each segmented row stays within five segments and each target at least 44 px tall (docs/prior-art/film-export.md §4).
- The tuck bar is one line and two buttons over the page's foot. It covers nothing a person must reach: the tab bar stays reachable, so the bar sits just above it [est; check with tools/phone-shot.mjs].
- The mark dialog is four rows and two buttons, the size of the existing range modal.
- Marking mode adds nothing outside itself. When it closes, every lock comes back in its slot.

### Order of work and cost

| Step | What changes | Cost | What it gives |
|---|---|---|---|
| 1 | Ease in and Ease out; Rest at the ends (moveAlong, two rows) | cheap | every move feels deliberate; holds |
| 2 | Camera "Also" row (place(i) sets view and zoom) | cheap | orbit and push in, spiral, tilt |
| 3 | "Set it now…" and "Set the shot…" (the tuck bar, movingLooks, cameraNow) | cheap | any change to anything, once or there and back: Ruby's "arbitrary settings" in one tap |
| 4 | Marks: marking mode, the ∿, the dialog, place(i)'s loop, step="any" | moderate | continuous, looping motion on any knob, hue, dial or page colour |
| 5 | Seed drift by dissolve | cheap to moderate (reuses the fade) | a page dreaming through its seeds, looping |
| 6 | Stagger for To another look (t per key in blendLooks) | moderate | a set end look that unfolds in turn |
| later | Perform the dial; three or more looks; Evolution per part; a time §Variable | moderate to costly | drawn paths; journeys; true morphs; a poem that moves |

**Films this makes possible**, each from the design above:
- **Macro Bloom:** a quarter orbit that pushes in, while its Focus sweeps 20 → 80 once (a rack focus) and Dew drifts.
- **A lantern:** the light swaying ±12° three times under any move.
- **The Ringworld:** a day passing while the Land Hue drifts and the camera tilts.
- **A dream:** a surface dissolving through three seeds and back to the first, in a loop.
- **The page itself:** the backdrop's colours swaying opposite each other. Cheap to make, and nothing on it remade.

## Gaps

- **Would not open (permission not granted to a link found in a page):**
  - Filter Forge's own pages for Normalized Time, Time, Frame Count and Frame Rate, and its help index. The component list and forum threads stand in.
  - Unreal's Camera Rig Rail and Crane pages (a redirect to dev.epicgames.com); the UEFN page stands in, and it does not name the crane's Pitch, Yaw or Arm Length.
  - Imaginando's GRFX modulator-rack manual (a redirect).
  - MDN's range-input page. The step attribute page says only that the default is 1 and "any" allows any value, so the rounding was measured in Chromium instead.
- **Opened but thin:**
  - Notch's modifier pages give one line each and no parameters.
  - Adobe's Photoshop timeline workflow page gave no body; Smashing Magazine stands in.
  - Apple's Live Photos page names Loop, Bounce and Long Exposure without saying what they do; MacRumors stands in.
  - The TouchDesigner looping-noise post links its write-up rather than containing it.
  - The Coding Train page gives the idea, not the formula; tproger's translation of Étienne Jacob's tutorial gives the formula.
  - Shadertoy's own page was not read; Synthclipse's Shadertoy-compatible list stands in.
  - Vital's own manual was not reached; Ultra's manual describes the same ring.
- **Not confirmed:**
  - After Effects' Easy Ease influence (33.33% is often quoted, but it was not on the page read).
  - Blender's "#" typed into a field to make a driver.
  - Whether DJI interpolates curved or straight between waypoints.
  - Procreate Dreams' playback speed while performing.
- **Not measured yet:** the frame time of a film whose marks remake the surface every frame, on the baseline phone. It should match a Camera round at the same size (both remake every frame); confirm with a 6 s film before promising a speed.
