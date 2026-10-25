# Prior art: the film studio (Kinesis: a tab for the Moving Image, its live preview, two cameras, the sun's arc, keys)

Key: **[src](URL)** = read in that source for this doc. **[est]** = my own estimate, inference or design (arithmetic shown where there is some); a claim about this app's code is [est] with the file named. Researched 2026-10-24 by searching and opening each source; what could not be opened is under **Gaps**.

The request (Ruby, 2026-10-24): "Allowing to see the preview video while it's rendering in both views (and hiding the main viewer on mobile since it's entirely consumed by the video creation dialog) - perhaps design a new tab, new button on desktop that fits in with the current theme and naming conventions, setting it to the left, and building this menu like we have built all the other menus (complete with giving the user two cameras and sun dial controls, letting the user set the arc of the sun on filters that have these things), keyframe controls for all of the settings that we do give the user access to change including, perhaps a timeline feature?" And for phones: "it's best to invoke it by long pressing the save button … offset "Save Image" vertically up and then in tiny text below write "hold for video" (only if the surface has video features, many don't at this point. Surfaces should advertise whether they're capable of video rendering or not)."

Ruby's choice since then: the tab is **Kinesis**. On a desktop it sits after Materia, the fifth tab of the left group, its panel filling the left column while the preview on the right plays the film as it renders.

The research before this one is not repeated here: docs/prior-art/moving-image.md (encoding, loops), docs/prior-art/film-export.md (the dialog's order and wording, segment counts, 44 px targets), docs/prior-art/film-animation.md (the moves, Set it now, the marks; it chose "no timeline", which this request reopens) and docs/prior-art/synth-controls.md (touch knobs, the display line, fine control). Where this doc leans on one of them, it names the section.

## Summary

- **A key holds one property, or the whole state.**
  - Per property: After Effects' stopwatch, Alight Motion's and CapCut's diamonds beside each property, and Blender's channels [src](https://helpx.adobe.com/ru/after-effects/desktop/animate-in-after-effects/animation-keyframes/setting-selecting-deleting-keyframes.html) [src](https://filmora.wondershare.es/advanced-video-editing/how-to-add-keyframes-in-alight-motion.html) [src](https://www.capcut.com/resource/how-to-add-keyframes-in-capcut) [src](https://docs.blender.org/manual/id/4.0/editors/dope_sheet/introduction.html).
  - Whole state: Figma's frames, matched layer by layer "by name and hierarchy", and Resolve's grades, which dissolve between dynamic keyframes [src](https://help.figma.com/hc/en-us/articles/360039818874) [src](https://www.premiumbeat.com/blog/color-grading-quick-tip-keyframing-davinci-resolve/).
  - Here, a look already holds every control (AGENTS.md §1 rule 2). So a key that is a whole look covers "all of the settings" by construction, and the timeline can still show which controls change, as Blender's Summary row sits over its channels [est].
- **On a phone, a key is a toggle at the playhead.** CapCut's phone app adds one with its diamond and removes it with a second tap. After Effects' diamond is filled when the playhead sits on a key [src](https://videowizardtools.com/keyframes-in-capcut/) [src](https://helpx.adobe.com/ru/after-effects/desktop/animate-in-after-effects/animation-keyframes/setting-selecting-deleting-keyframes.html). Easing is set between two keys (Procreate Dreams) or on each key (LumaFusion) [src](https://help.procreate.com/dreams/handbook/interface-and-gestures/timeline) [src](https://luma-touch.com/speed-and-enhanced-keyframing/).
- **A small screen's timeline stays usable with few rows and big hit areas.** img.ly made its trim handles' hit areas "more than twice" their width and snapped only to points on screen [src](https://img.ly/blog/designing-a-timeline-for-mobile-video-editing/). Our films are 6 to 60 s, so the whole film always fits the width and needs no zoom [est].
- **Renderers show the frame being made.**
  - Blender shows progress "as each frame is produced individually" [src](https://www.katsbits.com/codex/?p=1887).
  - Media Encoder: "Video frames are shown as they are being encoded" [src](https://helpx.adobe.com/media-encoder/using/preferences.html).
  - Seeing the work makes a wait worth more, the labor illusion [src](https://ideas.repec.org/a/inm/ormnsc/v57y2011i9p1564-1579.html), and a wait past 10 s is owed a percent-done indicator [src](https://nngroup.com/articles/response-times-3-important-limits).
- **The code already does half of it.** makeMoving draws every frame into the page's own canvas (uiMoving.js), so the stage shows the film as it is made; only the sheet's veil hides it [est]. One gap: applyPreviewScale (uiLayout.js) holds off only while state.ui.saving is set, and a film never sets it [est].
- **Hidden gestures are rarely found.**
  - In a tablet study, 1 of 16 people found a hold gesture [src](https://arxiv.org/pdf/1806.06084).
  - Across 81 Android apps, long presses were 19.3% of interactions, and long presses, double taps and pinches made up 37.7% of the hidden ones [src](https://arxiv.org/pdf/2601.19258).
  - Apple: a custom gesture must be "Not the only way to perform an important action" [src](https://glama.ai/mcp/servers/@tmaasen/apple-dev-mcp/blob/b82f0efe2115dc4539c83a2374a714a84aeb350a/content/universal/gestures.md).
  - The hint has a precedent: Telegram's camera says "Tap for photo, hold for video" [src](https://translations.telegram.org/id/android/camera_and_media/TapForVideo). The iPhone's QuickTake holds the shutter and writes nothing [src](https://support.apple.com/en-asia/guide/iphone/iph61f49e4bb/13.0/ios).
- **When some items can and some can't**, the sources agree:
  - Apple badges a Live Photo in the same corner of every photo [src](https://developer-mdn.apple.com/design/human-interface-guidelines/technologies/live-photos).
  - Disable rather than hide what a person could use, and say why [src](https://smashingmagazine.com/2024/05/hidden-vs-disabled-ux/).
  - "Keep tabs visible even when their content is unavailable" [src](https://developer-rno.apple.com/design/human-interface-guidelines/components/navigation-and-search/tab-bars).
  - Of the 86 surfaces, 13 have a camera, 1 a clock, and 61 a camera, a clock or a sun [est, counted from TEXTURE_CAPS in textureGenerators.js].
- **Two cameras are a green frame and a red one with an arrow between** (Final Cut's Ken Burns), with a Swap button [src](https://support.apple.com/guide/final-cut-pro/verb8e5de9c/mac).
- **A sun's day is a thin curve on a polar chart.** SunCalc: "The closer a point in the center, the higher the sun" [src](https://www.suncalc.org/). PhotoPills draws sunrise and sunset as thick lines [src](https://www.photopills.com/user-guide/planner/find/sunmoon-azimuth-elevation). The light dial already reads that way, its middle overhead and its rim the horizon (uiDials.js), and two handles on it fix a real sun's latitude and season in closed form [est, What we take].
- **Kinesis** is Greek for "movement, motion" [src](https://www.etymonline.com/word/kinesis). Its glyph: ☿, quicksilver [src](https://www.wordorigins.org/big-list-entries/mercury).

## 1. Timelines and keyframes, on a phone and on a desktop

### 1.1 How a key is set, moved, eased and deleted

**After Effects** (desktop, per property)
- To set a key, "Select the Stopwatch icon next to the property name to activate it". Once the stopwatch is on, a change "automatically adds or changes a keyframe for the property at the current time" [src](https://helpx.adobe.com/ru/after-effects/desktop/animate-in-after-effects/animation-keyframes/setting-selecting-deleting-keyframes.html).
- The navigator's diamond is filled when "the current-time indicator lies precisely at a keyframe for that layer property", and empty between keys [src](https://helpx.adobe.com/ru/after-effects/desktop/animate-in-after-effects/animation-keyframes/setting-selecting-deleting-keyframes.html).
- With the stopwatch off, a value "remains the same for the duration of the layer" [src](https://helpx.adobe.com/ru/after-effects/desktop/animate-in-after-effects/animation-keyframes/setting-selecting-deleting-keyframes.html).
- Moving and deleting keys are on a page that could not be read (Gaps). Interpolation is in docs/prior-art/film-animation.md §1.

**Blender** (desktop: the Dope Sheet over the Graph Editor)
- The Dope Sheet "gives the animator a birds-eye-view of the keyframes", modeled on hand-drawn animation's exposure sheet [src](https://docs.blender.org/manual/id/4.0/editors/dope_sheet/introduction.html).
  - Time runs across. Each row down is a channel.
  - The Summary is one row "combining all the actions into one channel".
  - Selected keys are yellow and the rest gray. A key's shape gives its handle type.
  - A gray bar between two keys marks a hold: the two have the same value.
- Auto Keying, the record button: "It will add and/or replace existing keyframes for the active object when you transform it in the 3D Viewport". Its Layered Recording "Adds a new NLA Track and strip for every loop/pass made over the animation" [src](https://lists.blender.org/pipermail/bf-docboard-svn/2020-October/001074.html).

**Procreate Dreams** (iPad, touch first)
- Keyframe tracks "are visible only in the Keyframe and Perform modes". Compose mode hides them [src](https://help.procreate.com/dreams/handbook/interface-and-gestures/timeline).
- "Tap and hold on a keyframe track" to expand it, set the easing of all its keys, or delete them all. "tap and hold between two keyframes" sets the easing between them [src](https://help.procreate.com/dreams/handbook/interface-and-gestures/timeline).
- The timeline's height is set by holding just above the ruler and dragging. A flick of the playhead to the left plays the movie [src](https://help.procreate.com/dreams/handbook/interface-and-gestures/timeline).
- Its gestures [src](https://help.procreate.com/dreams/handbook/interface-and-gestures/gestures):
  - "A two-finger pinch zooms";
  - a fast pinch fits everything to the screen;
  - "Double-tap anywhere on the Timeline to zoom in closer";
  - three fingers sliding sideways change how much time shows, and up and down change the rows' height;
  - a second finger on the screen turns on snapping for Move and Scale keyframes.

**LumaFusion 5** (iPad and phone): "Easily move any keyframe by dragging or nudging". Each key has "Fast or slow Ease-in and Ease-out, Constant and Hold presets", edited on a Velocity or Ease graph [src](https://luma-touch.com/speed-and-enhanced-keyframing/).

**CapCut**
- On a desktop there is a diamond beside Position, Scale, Rotation and Opacity. A key is dragged to move it, with Ease In and Ease Out [src](https://www.capcut.com/resource/how-to-add-keyframes-in-capcut).
- On the phone app there is one diamond in the bottom toolbar [src](https://videowizardtools.com/keyframes-in-capcut/):
  - "The diamond turns red = keyframe added";
  - over a key, "tap the keyframe button again to remove" it;
  - a graph icon beside it offers Linear, Ease In, Ease Out and Ease In-Out;
  - the page contradicts itself on whether phones get those graphs.

**Alight Motion** (phone): a diamond per property. Its keys "guardan el valor de una propiedad en un momento concreto" (they hold one property's value at one moment). Between two keys, a curve editor offers Ease In, Ease Out and Ease In-Out [src](https://filmora.wondershare.es/advanced-video-editing/how-to-add-keyframes-in-alight-motion.html) [src](https://alightcreative.com/blog/getting-started-with-motion-design).

**Rive** (desktop)
- "Linear is the default interpolation type". Cubic, Hold and Elastic are the others. Hold keeps a value until the next key, then jumps [src](https://rive.app/docs/editor/animate-mode/interpolation-easing).
- The type is chosen for the selected keys in an Interpolation panel. The Graph Editor takes the timeline's place [src](https://rive.app/docs/editor/animate-mode/interpolation-easing).

**DaVinci Resolve's Color page** (whole grades)
- The dynamic keyframe is "the most common type of keyframe that most colorists use". Between two of them, "Resolve will then interpret the fade for you" [src](https://www.premiumbeat.com/blog/color-grading-quick-tip-keyframing-davinci-resolve/).
- With auto keyframing on, "every change you make in your color session automatically creates a new keyframe" [src](https://www.premiumbeat.com/blog/color-grading-quick-tip-keyframing-davinci-resolve/).
- A cross-fade between two whole grades is made by keying a node's opacity: "doing two grades and fade in between them" [src](https://4kshooters.net/2016/04/12/animating-grades-with-keyframes-in-davinci-resolve-12).
- A reader says the bracket keys jump between keys; it was not confirmed [src](https://larryjordan.com/?p=168130).

**Keynote** (phone; builds in a list, no timeline)
- Builds play in the Build Order list's order. Each is On Tap, With Previous, or After Previous with a Delay [src](https://support.apple.com/guide/keynote-iphone/tan3ad5f8d82/ios).
- To reorder, "touch and hold the build, then drag it to a new position" [src](https://support.apple.com/guide/keynote-iphone/tan3ad5f8d82/ios).
- Magic Move is in docs/prior-art/film-animation.md §3.

**Figma Smart Animate** (whole frames)
- It matches layers by "both the layer's name and where it sits within the hierarchy". It animates scale, position, opacity, rotation and fill [src](https://help.figma.com/hc/en-us/articles/360039818874).
- "If a layer's properties stay the same between two frames, Figma won't animate that layer at all." Anything it can't animate gets "a default dissolve transition", and a new layer "will dissolve" into view [src](https://help.figma.com/hc/en-us/articles/360039818874).
- Easing [src](https://help.figma.com/hc/en-us/articles/360051748654-Prototype-easing-and-spring-animations):
  - Linear, Ease In, Ease Out, Ease In And Out, and three Back curves that overshoot;
  - springs named Gentle, Quick, Bouncy and Slow;
  - a custom Bézier whose ends are fixed at 0,0 and 1,1.
  - "It's not possible to save a custom easing curve for future use."

### 1.2 Per-property tracks or whole-state keys

| | Per property | Whole state |
|---|---|---|
| Who (sources in 1.1) | After Effects, Blender's channels, CapCut on a desktop, Alight Motion, Rive | Figma's frames, Keynote's Magic Move, Resolve's grades, edelkrone's keyposes (docs/prior-art/film-animation.md §3) |
| To key | arm each property first (the stopwatch, a diamond beside each) [src](https://helpx.adobe.com/ru/after-effects/desktop/animate-in-after-effects/animation-keyframes/setting-selecting-deleting-keyframes.html) | change anything; it is matched by name, or every change keys [src](https://help.figma.com/hc/en-us/articles/360039818874) [src](https://www.premiumbeat.com/blog/color-grading-quick-tip-keyframing-davinci-resolve/) |
| What can't be between | stepped (Hold) [src](https://rive.app/docs/editor/animate-mode/interpolation-easing) | cross-faded [src](https://help.figma.com/hc/en-us/articles/360039818874) |
| Easing | per key or per gap (LumaFusion, Procreate Dreams) | per transition (Figma) |
| On a phone | a diamond beside every control [est] | one button [est] |

- Between the two, Blender's Summary row shows every key in one row above the channels [src](https://docs.blender.org/manual/id/4.0/editors/dope_sheet/introduction.html). Procreate Dreams hides keyframe tracks outside the two modes that use them [src](https://help.procreate.com/dreams/handbook/interface-and-gestures/timeline).
- What this app has [est]:
  - a look is one object, saved and restored whole (uiLook.js, serializeCurrentSettings and restoreSettings);
  - blendLooks (moving.js) already eases every number between two looks and cross-fades what can't be between, Figma's rule exactly;
  - wholeChanges already names the keys that differ.
  - So whole-look keys cost nothing new to capture, and the rows of a timeline can be derived rather than armed.

### 1.3 How a timeline stays usable on a small screen

- **img.ly's mobile timeline** [src](https://img.ly/blog/designing-a-timeline-for-mobile-video-editing/):
  - it "only grows as you add more clips", and can be collapsed "to focus on the video canvas";
  - pinching zooms; scrolling sideways moves in time;
  - targets are about a square centimeter, matching iPhone's 44 × 44 pt, though it "could go a little smaller" because editing is a focused task;
  - trim handles' hit areas are "more than twice the visual width";
  - "Snapping should only respect those snapping points that are currently visible", and a haptic marks each snap;
  - trimming must not move playback: "The trim preview needs to be independent of the composition's playback position."
- **Procreate Dreams** keeps its timeline in the bottom half and lets the person trade it against the stage (1.1) [src](https://help.procreate.com/dreams/handbook/interface-and-gestures/timeline).
- **Keynote** avoids a timeline altogether with an ordered list and three timings (1.1) [src](https://support.apple.com/guide/keynote-iphone/tan3ad5f8d82/ios).
- **For our films** [est]: a phone gives about 380 px of width (docs/prior-art/synth-controls.md §6).
  - A 12 s film is 31.7 px a second; the longest, 60 s, is 6.3 px a second.
  - Keys on half seconds stand 15.8 px apart at 12 s and 3.2 px apart at 60 s.
  - The whole film fits the width at every length, so it needs no zoom and no sideways scroll. Two keys closer than a finger are handled by selecting first and stepping after (What we take).

## 2. Previewing while rendering

- **Blender**
  - Its render goes where the person chooses: Keep UI ("the UI remains the same"), New Window, Image Editor, or Full Screen [src](https://docs.blender.org/manual/en/2.79/render/output/render_panel.html).
  - During an animation it shows progress in the render window "as each frame is produced individually" [src](https://www.katsbits.com/codex/?p=1887).
  - Frames "are automatically saved directly out to disk after being rendered". Stopping loses none already made. "Rendering takes all available CPU time" [src](https://wiki.blender.jp/Doc:2.6/Manual/Render/Animations).
- **Media Encoder**: "Video frames are shown as they are being encoded in the Encoding Panel" [src](https://helpx.adobe.com/media-encoder/using/preferences.html).
- **After Effects**: the Render Queue "monitors the progress of Renderings" [src](https://www.globalspec.com/reference/35228/203279/rendering-and-output). One user found that it sometimes went back to the timeline view during a render instead of showing the progress bar, and wanted the bar every time [src](https://community.adobe.com/t5/after-effects-discussions/render-progress-bar-only-sometimes-shows/m-p/13574520). Whether its viewer shows frames during a render was not confirmed (Gaps).
- **Procreate Dreams**: "For large and high-resolution projects, the export will take some time" [src](https://help.procreate.com/dreams/handbook/movie-settings/share). Its pages describe no preview during export [src](https://help.procreate.com/articles/dxjyml-exporting-movies).
- **CapCut**: its help for an export stuck at 99% suggests restarting, freeing storage, lowering the quality and checking permissions [src](https://www.capcut.com/help/export-stuck). What its phone export screen shows: Gaps.
- **Why show it at all**
  - Nielsen's limits are 0.1 s ("reacting instantaneously"), 1 s (thought "uninterrupted") and 10 s ("keeping the user's attention") [src](https://nngroup.com/articles/response-times-3-important-limits).
  - "percent-done progress indicators should be used for operations taking more than about 10 seconds", with "a clear way to interrupt the operation" [src](https://nngroup.com/articles/response-times-3-important-limits).
  - The labor illusion: "when websites engage in operational transparency by signaling that they are exerting effort", "people can actually prefer websites with longer waits to those that return instantaneous results", "even when those results are identical" [src](https://ideas.repec.org/a/inm/ormnsc/v57y2011i9p1564-1579.html).
  - A painter watching her page turn frame by frame is that transparency, and the frame shown is the film's own, not a proxy [est].
- **What a phone should show when the sheet fills the screen** [est]:
  - the frame just made, at the top, at a fixed size;
  - a thin rule of progress and the line the code already writes ("Drawing frame 41 / 360…", with "about 3 minutes to go": MOVING.frame and MOVING.eta in strings.js);
  - once done, the film itself, playing in a loop where the frames were.
  - Copying a frame into the preview is one scaled drawImage, far cheaper than drawing the frame. So every frame can be shown.

## 3. Hidden gestures and their hints

**Discoverability**
- NN/g: on touch, contextual menus "may appear after a long press on a specific element", and "Users are less likely to find or use actions hidden in contextual menus" [src](https://www.nngroup.com/articles/contextual-menus-guidelines/).
- Apple's HIG [src](https://glama.ai/mcp/servers/@tmaasen/apple-dev-mcp/blob/b82f0efe2115dc4539c83a2374a714a84aeb350a/content/universal/gestures.md):
  - "Touch (or pinch) and hold" is for "Reveal additional controls or functionality";
  - "Use shortcut gestures to supplement standard gestures, not replace them";
  - a custom gesture should be "Discoverable" and "Not the only way to perform an important action";
  - "Offer moments in your app to help people quickly learn and perform custom gestures."
- A tablet study of two chart apps (16 people) [src](https://arxiv.org/pdf/1806.06084):
  - "Operations that used basic interactions (tap, pan, and pinch) or had clear visual cues were easily discoverable";
  - a hold of 500 ms then a swipe was found by 1 of 16;
  - contextual swipes "were often discovered only serendipitously".
- GhostUI (1,970 interactions in 81 Android apps) [src](https://arxiv.org/pdf/2601.19258):
  - long presses were 19.3% of interactions, and 23.7% of all interactions were hidden;
  - long presses, double taps and pinches made up 37.7% of the hidden ones;
  - "their implicit nature makes them difficult for most users to uncover".
- Android's default long press is 500 ms [src](https://code.yawk.at/android/android-9.0.0_r35/android/view/ViewConfiguration.java). Save's hold is 550 ms (appEvents.js) [est].

**Holding a shutter for video**
- iPhone: "In Photo mode, touch and hold the Shutter button to start recording a QuickTake video", and "Slide the Shutter button to the right and let go over the lock for hands-free recording" [src](https://support.apple.com/en-asia/guide/iphone/iph61f49e4bb/13.0/ios). The page names no hint on the screen.
- WhatsApp's camera recorded while the shutter was held, "the same as you do on Snapchat" [src](https://thenextweb.com/news/whatsapp-gives-its-in-app-camera-a-makeover). It later tested separate photo and video buttons, because "If you take your finger off of the shutter button, it will stop recording" [src](https://www.androidheadlines.com/2022/11/whatsapp-dedicated-video-mode-okay-what-its-funcamera.html).
- Telegram's camera string is "Tap for photo, hold for video" (key TapForVideo; CameraButtonHint in its newer app) [src](https://translations.telegram.org/id/android/camera_and_media/TapForVideo). That is Ruby's "hold for video" almost word for word, on a shutter that does two things [est].

**Hints**
- NN/g: people "tend to dismiss them quickly and do not read thoroughly", so "it is more effective to focus on a single interaction". "Presenting hints one-by-one, at the right moment, makes it a lot easier for users to understand and learn instructions." A hint must look unlike the controls [src](https://www.nngroup.com/articles/mobile-instructional-overlay/).

**Advertising that some items can and others can't**
- Apple, on Live Photos [src](https://developer-mdn.apple.com/design/human-interface-guidelines/technologies/live-photos):
  - "Keep badge placement consistent. If you show a badge, put it in the same location on every photo", "Typically … in a corner";
  - "The best way to identify a Live Photo is through a hint of movement";
  - "Never include a playback button that could be interpreted as a video playback button."
- Smashing: "disable if you want the user to know a feature exists but is unavailable", and "Be sure to explain why a feature is disabled and also how to re-enable it" [src](https://smashingmagazine.com/2024/05/hidden-vs-disabled-ux/).
- Tabs [src](https://developer-rno.apple.com/design/human-interface-guidelines/components/navigation-and-search/tab-bars) [src](https://chromium.googlesource.com/external/github.com/material-components/material-components-ios/+/v55.5.0/components/BottomNavigation/README.md):
  - Apple: "use three to five tabs in iOS", and "Keep tabs visible even when their content is unavailable", since tabs that come and go make an interface "appear unstable and unpredictable";
  - Material: "three to five items".
- **So** [est]:
  - Ruby's sense that six tabs is too many is both platforms' rule; the phone has five today (index.html, tabBar).
  - Holding Save is a good shortcut, but it needs a second, visible way in (Apple), and the hint under Save is Telegram's precedent.
  - Apple's "hint of movement" is not taken here: the app's motion is kept for showing that the browser is working, and nothing moves under a hand (AGENTS.md §11).

## 4. Two cameras and a sun's arc

**A start camera and an end camera**
- Final Cut Pro's Ken Burns [src](https://support.apple.com/guide/final-cut-pro/verb8e5de9c/mac):
  - two rectangles over the picture, "a green one that defines the position and size for the start of the clip" and "a red one" for its end;
  - "A superimposed arrow shows the direction the image travels";
  - "To exchange the start and end positions, click the Swap button";
  - a Play Loop button;
  - four easings, Ease In and Out by default.
- iMovie's Start and End on a phone, and Ghost of Tsushima's marked shots, are in docs/prior-art/film-animation.md §3.
- DJI Fly moves a waypoint when the person will "press and hold the waypoint icon or the POI icon and drag it", and copies its heading and gimbal settings with "Apply to All" [src](https://www.heliguy.com/blogs/knowledge-base/how-to-set-waypoint-flights-on-dji-mini-pro-4/).
- Blender keys a camera as any object: with Auto Keying on, moving it adds or replaces its keys (1.1) [src](https://lists.blender.org/pipermail/bf-docboard-svn/2020-October/001074.html).

**The sun's path**
- PhotoPills [src](https://www.photopills.com/user-guide/planner/find/sunmoon-azimuth-elevation):
  - a "thin orange line tells you the position of the Sun for the selected date and time";
  - the "thick ones are the Sunrise (yellow) and Sunset (orange) directions";
  - "Use the Time Bar to change the date and time", "the colorful bar below the Map".
- SunCalc [src](https://www.suncalc.org/):
  - "The thin yellow-colored curve shows the trajectory of the sun", and a broad band shows how it shifts through the year;
  - "The closer a point in the center, the higher the sun above the horizon";
  - "The colors in the above time-slider shows the sunlight during the day", and the sun on that slider moves "by mouse or with the arrow keys".
- Blender's Sun Position add-on [src](https://docs.blender.org/manual/en/2.83/addons/lighting/sun_position.html):
  - Normal mode "uses physical characteristics to position the Sun in the scene: geographic location, time and date";
  - its Diurnal option will "visualize the trajectory of the Sun in the sky during a single day";
  - its time and place can be keyed: "create animations by setting keyframes on them".
- Unreal's Sky Atmosphere [src](https://dev.epicgames.com/documentation/en-us/unreal-engine/sky-atmosphere-component-in-unreal-engine):
  - a Directional Light with Atmosphere Sun Light on is the sun;
  - "Right Ctrl + L with mouse movement will adjust the Directional Light set to index 0";
  - the sky's color follows "the altitude of the sun", red at sunset because the light "need[s] to travel further in the atmosphere".

**What a phone-sized arc control looks like** [est]
- Every tool above draws the day as a curve on a chart. Two of them set the time with a strip colored by daylight (PhotoPills' Time Bar, SunCalc's slider).
- The app's light dial is already that chart. Its comment in uiDials.js says its middle is light from straight overhead and its distance out is how low the light is, raking at the rim. That is SunCalc's reading exactly.
- The sun's path is already physical: sunPath gives a sun at 48° in early summer, rising in an arc and slow at the horizon (moving.js, docs/prior-art/ringworld-time.md).
- So the arc goes on the dial itself, 132 px across (poetrypress.css, .light-dial), with two handles. Under it goes a strip of the day's colors for the film's span.

## 5. The name and its glyph

- **Kinesis** is from Greek kinēsis, "movement, motion", from kinein, "to move" [src](https://www.etymonline.com/word/kinesis). Aristotle defined motion as "the actuality (entelecheia) of a "potentiality as such"" [src](https://en.wikipedia.org/wiki/Potentiality_and_actuality). That suits a tab where a still page's possible films are made actual [est].
- **Its glyph: ☿** (U+263F, Mercury), the sign of quicksilver. "Quick" there is the old word for alive, and the metal's drops move like "something that is alive" [src](https://www.wordorigins.org/big-list-entries/mercury).
  - The app's lore already holds ☿ as Mercury among the Heavens (symbolLore.js) [est].
  - It would be drawn by tools/icons.py in the nav glyphs' scratchy hand, relaxed when the tab is not chosen and stiff when it is (AGENTS.md §11) [est].
  - An alternative in the dials' own language: a ring with one dot riding its rim and a short trailing arc, an orbit [est].

## What we take [est]

Everything here is [est]: a design for this app built on the sources above.

**The shape of it.** There is one set of cards, the Kinesis cards. On a desktop they are a tab and fill the left column, and the stage plays the film. On a phone they live in the Moving Image sheet, opened by holding Save, and the sheet's top is the preview. That is how Esoterica already works: its cards are moved into a drawer on a desktop and back into the panel on a phone (appEvents.js, placeEsoterica). So the cards are moved with the layout, never copied, and no id is doubled. The film's choices stay "how a film is made, not part of the look" (docs/prior-art/film-animation.md, Saving).

### The desktop tab

- **Where:** a sixth tab button in index.html's tabBar, after Materia and before Esoterica. Esoterica keeps the far right (poetrypress.css: its margin-inline-start is auto), so the left group reads Inscription · Rituals · Thoughtforms · Materia · Kinesis.
- **Its button:**
  - the glyph ☿ drawn as the others are (tools/icons.py), and the word Kinesis;
  - its data-tab "kinesis" and its strings in strings.js;
  - the tooltip, plain (AGENTS.md §11, Three voices): "Make a short film of the page: its cameras, its sun, and keys for anything else".
- **The tab is always there.** On a surface that can't film, its cards say what this surface can still do (keys, marks) and dim the rest, saying why. Apple's "Keep tabs visible" [src](https://developer-rno.apple.com/design/human-interface-guidelines/components/navigation-and-search/tab-bars).
- **The stage while Kinesis is open:**
  - Before a film, it shows the page at the playhead. The guides of both cameras and the sun's path draw over it at once (uiDials.js, drawCameraGuide and drawDialGuide), as they do while a dial moves.
  - During a film, it shows each frame as it is drawn, at the film's own shape (Tall, Square, Wide or the page). makeMoving already draws into the page's canvas.
  - After a film, the finished file plays over the page in a loop: a muted, inline, looping video from the made Blob, with the link's URL kept until Kinesis closes. A touch on the reel or any control puts the page back.
- **The cards, in the order a person meets them** (each a card as on every tab, with the folding heading the other tabs use):
  1. **The Reel.** The timeline: the film's length on a ruler, the playhead, ◆ Key and ▷ Rehearse, and four rows: Camera, Sun, Look, Also moving. It comes first because it is the film at a glance, as Blender's Summary row is [src](https://docs.blender.org/manual/id/4.0/editors/dope_sheet/introduction.html). Length moves here, since it is the reel's length.
  2. **Cameras.** From and To (below). Shown where the surface has a camera; dimmed with "This surface has no camera" elsewhere.
  3. **Sun.** The arc (below), with Time passes and Begins at. On a surface whose dial is a wind or a flow, it is "Light round" as today.
  4. **Keys.** The Look row's keys as a short list: time, what changes ("Petals, Light Hue, the backdrop"), and the easing into each. A second view of the reel, for the keyboard and for screen readers.
  5. **Also moving.** The marks (docs/prior-art/film-animation.md §D), as built.
  6. **Frames.** The frame rate (docs/prior-art/film-export.md §5).
  7. **Size.** As built.
  8. **File.** MP4 · WebM · PNG frames, as built.
  - **The foot**, held at the bottom of the column: the summary line (movingSummary), the note (movingNote), and Make the film, which reads Stop while a film is made.
- **Keys on a desk** [est]:
  - Left and Right step the playhead ½ s, Shift a frame, and Home and End go to the ends;
  - K keys the page at the playhead, as Blender's I does;
  - the shortcuts list in index.html gains them.

### The phone

- **Opening it:**
  - Hold Save (as today, 550 ms, haptic 'drawer'), or the visible way in that Apple asks for [src](https://glama.ai/mcp/servers/@tmaasen/apple-dev-mcp/blob/b82f0efe2115dc4539c83a2374a714a84aeb350a/content/universal/gestures.md).
  - The visible way is a "Moving Image…" row in Esoterica. No sixth tab (Apple's and Material's five [src](https://developer-rno.apple.com/design/human-interface-guidelines/components/navigation-and-search/tab-bars) [src](https://chromium.googlesource.com/external/github.com/material-components/material-components-ios/+/v55.5.0/components/BottomNavigation/README.md)).
  - Save's accessible description names the hold as well.
- **The hint under Save.** Ruby's design, measured against the button as it is (poetrypress.css, the phone's .download-btn):
  - **The size stays.** Today the button is a 2 px border, 6 px of padding above and below, and one line at clamp(11px, 2.8vw, 13px), about 11.5 px on a 412 px phone. That makes it about 30 px tall: 4 + 12 + 13.8 at line-height 1.2.
  - **What changes inside it.** The padding above and below drops from 6 px to 2 px, leaving 30 − 4 − 4 = 22 px inside. Two lines at line-height 1 take it: "Save image" at its size (11.5 px), and "hold for video" at 9 px in the same caps face, at about 70% opacity. 11.5 + 9 = 20.5 px, with 1.5 px to spare, so the button's outside size is unchanged.
  - **When it shows:** on the phone layout; while the surface can film (How a surface advertises, below); not while Save is saving (its label reads Saving…).
  - **It never moves the label.** On a phone the label always sits in the upper place and the second line's room is always kept: the words fade in or out as the surface changes, and nothing shifts (AGENTS.md §11, Nothing moves under a hand). On a surface with no film the label sits a little high, by about 5 px. The alternative is to center it there, and the label would then shift only when the surface changes, never under a finger on Save. Ruby to choose.
  - **The words** are Ruby's, "hold for video", lowercase as a caption, in strings.js. Telegram's camera says the same [src](https://translations.telegram.org/id/android/camera_and_media/TapForVideo).
- **The sheet:**
  - **The page behind it is hidden.** On the phone layout the sheet takes the whole screen: no veil, no 86% height cap. While it is open, the stage is given visibility: hidden, which keeps its room, so nothing moves when it comes back. Set it now, Set the shot and Change it… still tuck the sheet and show the page (uiMoving.js, movingSetNow).
  - **The preview box** is held at the sheet's top and never changes height (fixed, about a third of --vvh):
    - before: a copy of the page as the film's first frame, with thin crop lines for Tall, Square or Wide, and the guides of the two cameras drawn over it;
    - during: each frame as it is made (one drawImage from the page's canvas after sink.add), a thin rule of progress under it, and the note line;
    - after: the film itself looping (a video from the made Blob). A zip of PNG frames shows its last frame.
  - **Below it**, the same Kinesis cards. The Reel is open and the rest are folded, so the sheet starts short. The foot (summary, note, Make the film) is held at the bottom.
  - **While a film is made**, the cards are disabled where they stand (paintMoving already does this), the preview plays the frames, and Stop is two taps (makeMoving). The screen is kept awake (movingWake).

### The two cameras

- **The Cameras card: From and To.** Two camera dials side by side, drawn as Materia's is (uiDials.js: ring, tick dots, the handle, its sight line, the frame that shrinks as it zooms), each with its zoom slider under it. Two 116 px dials fit a 380 px phone row, as the light and camera dials already sit together (poetrypress.css, .tool-row.has-camera).
  - **From is the page's camera.** It is a second view of cameraTurn, cameraView and cameraZoom: moving it moves the page's camera, as Materia's dial does, and refreshUi keeps both views current. The film starts from the page.
  - **To is the film's shot** (movingRun.shot, which To a shot already uses). It starts as a copy of From. It replaces To a shot's tuck: the shot is set on its own dial, in plain sight.
  - **Swap** exchanges them (Final Cut [src](https://support.apple.com/guide/final-cut-pro/verb8e5de9c/mac)). Swapping changes the page's camera, so it is one undo step.
  - **The way round:** The short way · The long way · Once round more. shotAlong turns the short way today (moving.js); the other two add 360° to the turn's difference, one way or the other.
  - **Also** (push in, pull back, tilt, spiral out) stays for a full round, as built.
- **On the stage** (or the phone's preview box):
  - From's guide in the accent and To's in the second accent, which is already the rim light's guide color (uiDials.js, drawDialGuide);
  - a thin arrow from From's middle to To's (Final Cut's arrow);
  - drawCameraGuide reads cameraNow today; it takes a camera as an argument instead, and cameraGuide (stepsGenerative.js) already does.
- **In the frame loop:** place(i) eases From to To by shotAlong, as it does now. With keys on the Camera row (later), each pair of neighboring camera keys is a shotAlong of its own, eased by its gap's easing.

### The sun's arc

- **The Sun card's dial is the light dial, read as a polar sun chart:** the middle overhead, the rim the horizon, past the rim the twilight on surfaces that go there (dialMax, 130). On it:
  - **Noon** (☉): the arc's highest point. Its bearing is where the day's sun stands at noon; its distance from the middle is how high noon is.
  - **Rises**: a small hollow dot on the rim, where the sun comes up. Where it sets is drawn mirrored across noon's line, as the real sun's day is symmetric about noon [src](https://www.suncalc.org/).
  - **The arc** between them: a thin dotted curve with a dot for each hour, sampled from sunPath. The stretch the film covers is drawn solid over it (Time passes), with a small mark where the film begins (Begins at).
  - **Under the dial**: the day's length in words ("a day of 14 hours"), and a strip colored dawn to night across the film's span. That is PhotoPills' Time Bar and SunCalc's slider [src](https://www.photopills.com/user-guide/planner/find/sunmoon-azimuth-elevation) [src](https://www.suncalc.org/).
- **The two handles fix a real sun.** moving.js fixes SUN_LAT at 48° and SUN_DEC at 15° today. With the noon handle at tilt t, noon's height is e = 90° × (1 − t/100), as sunPath reads a tilt. Let z = 90° − e, and let A be the rise's bearing from north with noon due south. A sun rises where cos A = sin δ / cos φ, and stands at noon at 90° − (φ − δ). Solving the two:
  - tan φ = (cos A + sin z) / cos z, then δ = φ − z.
  - Check: φ = 48°, δ = 15° give z = 33° and cos A = sin 15° / cos 48° = 0.387, so A = 67.2°. Back again, tan φ = (0.387 + 0.545) / 0.839 = 1.111, so φ = 48.0°.
  - The day's length is SUN_DAY's own formula with these: 2 · acos(−tan φ · tan δ) · 12/π hours.
  - φ is held inside ±85° so a dragged handle never asks for a sun that never sets.
- **In code:** sunPath takes a latitude and a declination, defaulting to today's two. Every film made today draws the same; the test is in test/moving.test.mjs. filmHours is unchanged, so dawn and dusk still get about three times the film (1 + 2.2 at the horizon, moving.js).
- **Where it runs:**
  - Light round gains a second way, **Round · Along the arc**, on any surface whose light is a sun (58 of them, counted as dialGuideMarks counts a sun). Today only the Ringworld's Daylight dial runs a day (uiMoving.js, sunDay).
  - Along the arc moves the main light along the arc, eased by filmHours. The rim light stays where it is.
- **On the stage:** the sun's mark at the playhead's moment, and the whole day's path on the page as a dotted curve (pageSunAt for each hour, texCore.js). That is Blender's Diurnal and SunCalc's curve, drawn where the light will be [src](https://docs.blender.org/manual/en/2.83/addons/lighting/sun_position.html).
- **Photosensitivity.** A setting sun darkens the page slowly, three times slower near the horizon, never at once (AGENTS.md §11).

### Keys and the reel

- **What a key holds:**
  - **A Look key** is the whole look as Set it now takes it (stripToLook of serializeCurrentSettings, uiMoving.js). Every control the person can change is in it (AGENTS.md §1 rule 2), so it is Ruby's "all of the settings that we do give the user access to change".
  - **Camera keys** are From and To: { turn, view, zoom }.
  - **The Sun row holds no keys.** Its arc and its span set it.
  - While the Camera row or the Sun row is driven by its own move, a Look key's camera or light is not used there. That row of the reel says so, as Time passing dims light marks today (uiMoving.js, sunOwns).
- **The reel's rows** (fixed height, so a key added never grows the card: nothing moves):
  - a summary row with every key on it, Blender's Summary [src](https://docs.blender.org/manual/id/4.0/editors/dope_sheet/introduction.html);
  - Camera, Sun, Look and Also moving, each 32 px tall. A row the surface can't use stays, dimmed;
  - between two keys that differ, the Look row lists what changes when touched (wholeChanges); between two that are equal, a gray bar (Blender's hold).
- **The ruler:** the whole film across the width, a dot a second (img.ly's ruler [src](https://img.ly/blog/designing-a-timeline-for-mobile-video-editing/)), and a number every 2, 5 or 10 s by length. No zoom, no pan (1.3).
- **The playhead:**
  - Drag it to scrub. The page is set to that moment by the same place(i) the frame loop uses, and drawn at preview scale. The guides draw at once, and the surface follows when it has been made, as the dials do (uiDials.js). Requests coalesce, so a fast drag asks only for where it stops (AGENTS.md §5.3).
  - A tap on the ruler jumps there.
- **◆ Key**, beside the playhead:
  - hollow between keys and filled on one (After Effects' navigator [src](https://helpx.adobe.com/ru/after-effects/desktop/animate-in-after-effects/animation-keyframes/setting-selecting-deleting-keyframes.html));
  - hollow: a tap keys the page as it stands, at the playhead;
  - filled: a tap selects that key, with two chips, Change it… and Remove (CapCut's toggle, made safe by a choice [src](https://videowizardtools.com/keyframes-in-capcut/)).
- **Change it…** writes into that key. The page shows the key, and every change on any tab writes into it until Done: Blender's Auto Keying, Resolve's auto keyframe [src](https://lists.blender.org/pipermail/bf-docboard-svn/2020-October/001074.html) [src](https://www.premiumbeat.com/blog/color-grading-quick-tip-keyframing-davinci-resolve/).
  - On a desktop, Kinesis stays open and a line in the reel reads "Writing into the key at 4 s · Done".
  - On a phone, the sheet tucks to the bar, as Set it now does.
  - The changes leave the history afterward (uiHistory.js, historyHold and historyPutBack), as Set it now's do.
- **Moving a key:** drag it along its row. It snaps to half seconds, to the playhead and to the other rows' keys, with a haptic tick on each snap (uiSkins.js, haptic; img.ly [src](https://img.ly/blog/designing-a-timeline-for-mobile-video-editing/)).
  - Two keys closer than a finger: a tap selects the nearer, and the display line's − and + step it by half a second. That is the single-pointer way WCAG asks for beside a drag (docs/prior-art/synth-controls.md §2.4 and §6.6).
  - Keys stay at least half a second apart.
- **Easing:** tap the gap between two keys (Procreate Dreams' place for it [src](https://help.procreate.com/dreams/handbook/interface-and-gestures/timeline)).
  - The choices: Even · Ease in · Ease out · In and out · Hold, five segments, the phone's limit (docs/prior-art/film-export.md §4). moveAlong already does the first four.
  - **Hold** stays on the first key, then dissolves into the next over its last half second, with the fade To another look already draws. Rive's Hold jumps [src](https://rive.app/docs/editor/animate-mode/interpolation-easing), and a jump of a page's colors is a flash (AGENTS.md §11).
  - The gap shows its easing as a tiny drawn curve, which fits a narrow gap better than a word. The display line names it on touch.
- **Removing a key:** the Remove chip, then a toast with Undo. A key at 0 s can't be removed: the film begins somewhere.
- **▷ Rehearse** plays the reel's guides in real time over the page, without making a single surface: the camera's frame turning from From to To, the sun's mark gliding along its arc. A film that takes minutes to make is previewed in its own length.
- **To another look becomes the reel with two Look keys:** the page at 0 s and the other look at the end. One model, not two. The other-look picker (kept spells, the look before the last change, Set it now…) becomes a way to fill a key.
- **The frame loop:**
  - A pure function in moving.js gives, for frame i, the segment it lies in and how far along it, eased by that gap's easing. It generalizes moveAlong, and test/moving.test.mjs tests it.
  - place(i) then blends that segment's two keys by blendLooks, with the fade across a change that can't be between (wholeChanges, MOVING_FADE) per segment.
  - Frames-ahead stays off only across a Look segment whose keys differ, as To another look's frames are today (uiMoving.js). Camera and sun frames keep it.
- **Saving:** the reel is kept in the draft, so a reload doesn't lose an evening's keys. It is an added field, absent when unused (AGENTS.md §5.4, THE DRAFT). Whether a shared spell carries its film is Ruby's question in docs/prior-art/film-animation.md (Saving).

### How a surface advertises that it can film

- **One function beside capsFor** (textureGenerators.js), derived from what the caps already say, so no surface writes its abilities twice (AGENTS.md §1 rule 12, merge what repeats):
  - **camera:** caps.camera, or an Athanor graph that uses the camera dial (graphUsesCamera);
  - **clock:** caps.time;
  - **sun:** a light that dialGuideMarks (uiDials.js) draws as a sun, not as a wind, a flow or a place;
  - **knobs:** the knobs that are amounts (markables, uiMoving.js).
  - A surface may opt out with a film: false in its caps, where Ruby judges its film adds nothing.
- **Today's counts:** camera 13, clock 1 (the Ringworld), sun 58. A camera, a clock or a sun: 61 of 86. Another 8 have a direction dial (wind, rain, flow), and 17 have no dial and no camera.
- **Where it shows:**
  - the "hold for video" line under Save, for a camera, a clock or a sun: 61 of 86;
  - the surface chooser's tiles (chooser.js): a small ☿ in thin line in the same corner of every tile that can film (Apple's badge rule [src](https://developer-mdn.apple.com/design/human-interface-guidelines/technologies/live-photos)), never a play triangle (Apple's warning, same page);
  - the Kinesis cards: what the surface can't do is dimmed where it stands with one line saying why (Smashing [src](https://smashingmagazine.com/2024/05/hidden-vs-disabled-ux/)), as paintMoving dims rows now.
- **For Ruby:** if "many don't" means a camera or a clock only, the line shows on 13 surfaces and on Athanor graphs with a camera. Lights alone (a lantern swaying, a sun crossing) are films too, so this doc counts the sun. Either way it is one rule in one place.

### While a film is made, in both views

- **The rest of the page is inert:** the other tabs' cards, the tab buttons, the stage's undo, redo and filmstrip, and the shortcuts. An inert subtree takes no clicks and no focus, and is hidden from assistive technology. "By default, there is no visual way to tell", so the inert parts are faded as Esoterica's drawer fades the panel today [src](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert). Today the sheet's veil does this job; a tab beside an open stage needs it said.
- **The canvas keeps its size.** applyPreviewScale (uiLayout.js) returns early while state.ui.saving is set, but makeMoving sets only movingRun.busy. Once the stage is visible beside Kinesis, a pinch on the stage or a dragged sidebar could resize the canvas between frames. The guard should ask movingBusy too (not tested; found by reading the code).
- **The screen stays awake** (movingWake), and leaving asks first (appEvents.js, beforeunload), as built.

### What to build first, and later

| Step | What changes | Cost | What it gives |
|---|---|---|---|
| 1 | The Kinesis tab on a desktop, holding today's sheet groups as cards (moved with the layout, as Esoterica's are); the stage plays the frames as they are made; the rest inert; applyPreviewScale's guard | cheap | Ruby's "see the preview video while it's rendering" on a desktop, with no new film code |
| 2 | The phone's full-screen sheet: the preview box (latest frame, then the film looping), the page behind hidden; the Esoterica row | cheap | the same on a phone |
| 3 | The surface's film ability; the "hold for video" line; the chooser's mark | cheap | the hidden gesture found, and only where it does something |
| 4 | The Cameras card: To on its own dial, Swap, the way round, both guides | cheap to moderate | two cameras in plain sight; To a shot's tuck retired |
| 5 | The Sun card: sunPath with a latitude and a declination; the arc on the dial; Light round Along the arc; the path on the page | moderate | a day's sun on 58 surfaces, set by two handles |
| 6 | The Reel: Look keys (To another look as two keys), ◆ Key, Change it…, easing per gap, holds, scrub, Rehearse | moderate to costly | keys for every setting, on a timeline that fits a phone |
| later | Camera keys past two (the journeys of docs/prior-art/film-animation.md §F); marks with keys of their own; a draft film (small, 12 fps, encoded and played in the stage before the real one); Perform (the same §F) | moderate | paths; a quick look before a long render |

- Check each step on the baseline phone with tools/phone-shot.mjs and tools/fit-audit.py, and run tools/still.mjs: no slider in Kinesis may move the page. tools/smoke.mjs covers the new controls.
- The help moves with it (AGENTS.md §1 rule 11). Save's title in index.html ("Hold, or right-click, for a Moving Image") gains "or open Kinesis", and the shortcuts list gains the reel's keys.

## What this app can do that others don't [est]

- **A rehearsal before the render.** The camera and sun guides draw at once (uiDials.js), so a film whose frames take seconds each can be played as lines over the page in its own length before one surface is made. Blender's Diurnal path and Final Cut's arrow show a path; here the path plays.
- **The light dial is already a sun chart.** Its middle is overhead and its rim the horizon, so the sun's arc is set where the light is set, and the sun on it is physical: rising in an arc, slow at dawn and dusk, its day's length from a real latitude and season (moving.js).
- **One tap keys everything.** A key is the whole look, and every control is in the look by rule (AGENTS.md §1 rule 2). No stopwatch per property, yet the reel can still say what changes between two keys (wholeChanges), and what can't be between cross-fades (blendLooks).
- **The preview is the film.** Every frame shown while rendering is the film's own frame from the offline renderer, not a viewport's draft. The film shown after is the file itself.
- **Surfaces know what they can do.** The caps already say camera, clock and light, so the film's choices, the hint under Save and the chooser's mark come from one place, and an Athanor graph that wires in the camera dial gains a camera film by itself.
- **Holds never flash.** Every hold ends in a dissolve and every sun sets slowly, because the app's photosensitivity rule is stricter than any editor's default.

## Gaps

- **Would not open, or opened without their body text:**
  - Blender's current manual pages for editing keyframes, auto keying, Motion Paths, the Sun Position add-on (4.1) and rendering animations gave only navigation. The 4.0 Dope Sheet page, the 2.83 Sun Position page, the 2.79 render panel, a doc commit, the old Japanese wiki and katsbits stand in.
  - Adobe's English After Effects keyframe page was refused (robots); a Russian-locale copy in English stands in. Moving and deleting keys in After Effects were on a page not reached.
  - The Resolve 18.6 manual mirror failed; three third-party pages stand in, and none names static keyframes.
  - The CMU copy of Harrison et al., "Rethinking the Progress Bar", failed; its author page gives no findings, so nothing here rests on it.
- **Not confirmed:**
  - whether CapCut's phone keyframe holds a clip's position, scale, rotation and opacity together or one property;
  - what CapCut's and Procreate Dreams' export screens show while exporting;
  - whether After Effects' viewer shows frames during a Render Queue render;
  - whether Instagram or Snapchat ever wrote a "hold" hint under their shutters (Telegram's string is the one precedent read);
  - the shape of the iPhone's Bedtime control (Apple's page says only to drag the Bedtime and Alarm buttons), so no phone two-handle ring is cited;
  - Resolve's bracket keys for jumping between keys.
- **Not researched:** the history of moving-image devices and shows (the magic lantern, the zoetrope, phantasmagoria) once Ruby chose Kinesis.
- **Not measured yet:**
  - the hint's two lines at 9 px on the baseline Moto G Stylus: check legibility with tools/phone-shot.mjs before settling the size;
  - a scrub's cost on the phone, a surface remade per stop, which should match a dial's drag;
  - the canvas resize during a film (What we take, While a film is made) was found by reading uiLayout.js and uiMoving.js, not reproduced.
