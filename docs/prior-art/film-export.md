# Prior art: the film dialog (how the Moving Image's export settings are worded, ordered and laid out)

Key: **[src](URL)** = read in that source for this doc. **[est]** = my own estimate or inference (arithmetic shown where there is some). Researched 2026-10-22 by searching and opening each source; what could not be opened is under **Gaps**. The dialog as it stands is in index.html (movingSheet) and strings.js (moving.*); its bitrate rule, w × h × fps × 0.15 held to 4–40 Mbps, is in uiMoving.js [est].

## Summary

- **Most tools put the file first** (Premiere, Media Encoder, Canva, Procreate Dreams, Motion). After Effects and Blender put the picture first: size, frame rate and time span, then the file [src](https://film-media.dartmouth.edu/sites/department_film.prod/files/department_film/wysiwyg/exporting_from_premiere_pro_2022.pdf) [src](https://www.storyblocks.com/resources/tutorials/after-effects-rendering). For a painter's film, the move is the first choice and the file the last [est].
- **Frame rates are written as a number plus "fps"**: Blender draws "24 fps" and Procreate Dreams "Cinema - 24 FPS" [src](https://projects.blender.org/archive/blender-archive/src/commit/552c262cee8ea26cbacc354af570cfece40d7dcf/scripts/startup/bl_ui/properties_output.py) [src](https://help.procreate.com/dreams/handbook/movie-settings/project). OBS's "24 NTSC" label, which is really 23.976, confuses users [src](https://obsproject.com/forum/threads/why-is-24fps-labeled-as-ntsc-in-settings-shouldnt-that-be-29-97.183091/).
- **Sizes are written as "1920 × 1080"** with spaced multiplication signs [src](https://learn.microsoft.com/en-us/style-guide/checklists/numbers-checklist). Aspect is written "9:16" [src](https://ads.tiktok.com/help/article/video-ads-specifications).
- **A tall 1080 × 1920 MP4 at 30 fps suits every platform here.** Instagram's own API reference allows 23–60 FPS [src](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media). YouTube lists 24, 25, 30, 48, 50 and 60 [src](https://support.google.com/youtube/answer/1722171?hl=en).
- **Time-lapse tools set time passing in one of two ways.** Some take a span: record time against play time [src](https://cdn.shopify.com/s/files/1/2463/3081/t/5/assets/edelkrone--app-details.pdf?0051). Others take a speed: GoPro's 2x to 30x [src](https://gopro.com/content/dam/help/hero10-black/manuals/HERO10Black_UM_ENG_REVB.pdf). Motion-control apps add ease in and out, and "bounce back" [src](https://apps.apple.com/us/app/manfrotto-motion/id1566807793?uo=4).
- **Radios beat selects under about five options** [src](https://www.nngroup.com/articles/dropdown-list/). Segmented controls should keep to about five segments on a phone [src](https://developer.apple.com/design/human-interface-guidelines/segmented-controls.md). Each radio group belongs in a fieldset with a short legend [src](https://w3.org/WAI/tutorials/forms/grouping).

## 1. How professional tools word and order export settings

**1.1 File first**
- **Premiere Pro (Export mode, 2022).** The order is File Name, Location, Preset ("High Quality 1080p HD"), Format (H.264), then the Video and Audio switches. You check the summary "and that the estimated file size is within reason", then choose "Send to Media Encoder" or "Export" [src](https://film-media.dartmouth.edu/sites/department_film.prod/files/department_film/wysiwyg/exporting_from_premiere_pro_2022.pdf).
  - Adobe's guide lists the video settings as Format, Frame rate, Frame size ("1920 x 1080 for HD"), Field order, Aspect, Profile, Level, Bitrate encoding ("VBR, 1pass") and Target bitrate ("20-30 Mbps for HD"). It suggests starting from the "Match Source-Adaptive Bitrate" presets [src](https://www.adobe.com/creativecloud/video/hub/guides/best-export-settings-for-premiere-pro.html).
  - "Match Source" sits under Basic Video Settings. A school guide sets 1920×1080 at 23.98 there [src](https://pages.vassar.edu/film-majors/premiere-pro-exporting-media/).
- **Media Encoder.** Export Settings run Format, Preset, Comments, Output Name, Export Video, Export Audio, Export Captions and Summary. Below them are the tabs Effects, Video, Audio, Multiplexer, Captions and Publish [src](https://helpx.adobe.com/ie/media-encoder/desktop/encoding-and-exporting/export-settings-reference.html).
  - The Summary "Displays a brief overview of the selected export settings, including resolution, frame rate, codec, and estimated file size." That size "is a rough estimate based on a constant bit rate video without audio or metadata." Bitrates are given in Mbps [src](https://helpx.adobe.com/ie/media-encoder/desktop/encoding-and-exporting/export-settings-reference.html).
- **DaVinci Resolve (Deliver page).** A row of presets comes first: Custom Export and YouTube 720p/1080p/1440p/2160p [src](https://davinciresolveclub.com/davinci-resolve-youtube-export-settings.md). Name and location sit above the settings [src](https://tutkit.com/en/text-tutorials/1769-effective-working-in-the-deliver-area-of-davinci-resolve).
  - The Video tab runs Format, Codec, Encoder, Network Optimization, Resolution ("Timeline Resolution"), Frame Rate ("Timeline Frame Rate"), Quality ("Automatic"), Encoding Profile, Key Frames and Frame Reordering [src](https://io.bikegremlin.com/36082/davinci-resolve-best-export-settings-for-youtube/).
  - Quality is "Automatic" or "Restrict to", and there is a "Use vertical Resolution" box [src](https://edits101.com/export-page-in-da-vinci-resolve/). "Restrict to" sets a maximum data rate [src](https://davinciresolveclub.com/davinci-resolve-youtube-export-settings.md).
- **Final Cut Pro (Share).** The settings are Format (mastering formats, or Apple Devices, Computer and Web Hosting), Video Codec, Resolution, Color Space, Audio Format and Action [src](https://support.apple.com/guide/final-cut-pro/ver13664388c/mac).
  - Which codecs are offered depends on the project's resolution and frame rate. The Info pane shows "frame size and frame rate, audio channels and sample rate, duration, output file type, and file size" [src](https://support.apple.com/HT204322).
- **Apple Motion (Export Movie).** The order is Export (format), Open with, Include, and Duration (the whole project or between the In and Out points). Then come a Render pane and a Summary [src](https://help.apple.com/motion/mac/5.2/en.lproj/motn189cfcd6.html).
  - The Render pane holds Color, Camera, Lighting, Shadows, Reflections, Depth of Field, Motion Blur, Frame Blending and Fields. The last three are each On, Off or the canvas setting [src](https://help.apple.com/motion/mac/5.4/en.lproj/motn189cf92b.html).
- **Procreate Dreams (Advanced export).** The order is Format (Video, GIF, Current frame, Frames as images), Resolution, Video codec (H.264, HEVC, Apple ProRes), File container, Playback and Audio encoding [src](https://help.procreate.com/dreams/handbook/movie-settings/advanced-export).
  - Resolution offers "Document size", 720p, 1080p (1920 x 1080), 4K and Custom. Playback is "One Shot" or "Ping Pong", and a GIF's is "Loop" or "Ping Pong" [src](https://help.procreate.com/dreams/handbook/movie-settings/advanced-export).
  - The movie's frame rate is set in Project, with presets named for their use: "Frame by frame - 12 FPS", "Anime - 15 FPS", "Cinema - 24 FPS", "Television - 30 FPS", "PAL - 50 FPS", "NTSC - 60 FPS", "Mobile - 120 FPS" and Custom [src](https://help.procreate.com/dreams/handbook/movie-settings/project).
- **Canva (Share, then Download).** File type is "MP4 Video" and Quality is 480p, 720p, 1080p or 4K. Then come "Save download settings", Pages and Download. There is no frame-rate choice [src](https://www.canva.com/en_in/help/download-as-video/).
- **CapCut.** Bit rate is Lower, Recommended, Higher or Custom. Codec is H.264 or HEVC, and format is MP4 or MOV. Frame rates are 24, 25, 30, 50 and 60 [src](https://store.hollyland.com/blogs/creator-hub/best-export-settings-from-capcut-desktop-for-youtube-shorts). The phone app writes "1080P" and "4K (2160P)" [src](https://www.capcut.com/help/export-videos-in-capcut).

**1.2 Picture first**
- **After Effects (Render Queue).** Render Settings come first:
  - Quality ("Best", "Draft", "Wireframe"), Resolution, Proxy Use, Frame Rate, and Time Span (Start, End, Duration).
  - Then the Output Module: Format, Video Output (Channels), Resize, Crop and Audio. Then Output To [src](https://www.storyblocks.com/resources/tutorials/after-effects-rendering).
  - A school guide writes the frame rate as "Use comp's frame rate 24.00" [src](https://film-media.dartmouth.edu/sites/department_film.prod/files/department_film/wysiwyg/exporting_from_after_effects.pdf). Every render has at least one Output Module [src](https://www.provideocoalition.com/cmg_hidden_gems_chapter_42_render_queue/).
- **Blender (Output Properties).** The Format panel holds Resolution X and Y, %, pixel aspect, crop, and then Frame Rate. Time Stretching sits under Frame Range [src](https://projects.blender.org/archive/blender-archive/src/commit/552c262cee8ea26cbacc354af570cfece40d7dcf/scripts/startup/bl_ui/properties_output.py).
  - The menu's label is "%.4g fps", so it reads "24 fps" or "29.97 fps". The standard rates are 23.98, 24, 25, 29.97, 30, 50, 59.94, 60, 120 and 240. FPS and Base fields appear only under "Custom (… fps)" [src](https://projects.blender.org/archive/blender-archive/src/commit/552c262cee8ea26cbacc354af570cfece40d7dcf/scripts/startup/bl_ui/properties_output.py).
  - Presets such as "HDTV 1080p" sit above the panel. The Output panel with File Format and Encoding comes later [src](https://vse-docs.readthedocs.io/video_editing/setup/project-settings.html).
- **OBS.** Video settings run Base (Canvas) Resolution, Output (Scaled) Resolution, Downscale Filter, and FPS. Output settings run Recording Format, Encoder, Rate Control and Bitrate [src](https://yandex.cloud/en/docs/video/operations/streams/obs-config-help).
  - One OBS commit's list of common rates is plain numbers: 10, 20, 25, 29.97, 30, 48, 59.94, 60 [src](https://git.tjdev.de/mirror/obs-studio/commit/5f6cf614498683d2b4fa51f9116027859da7095c).
  - "24 NTSC" (24000/1001) was added later. A maintainer says common values "should include only integer numbers" [src](https://obsproject.com/forum/threads/why-is-24fps-labeled-as-ntsc-in-settings-shouldnt-that-be-29-97.183091/). A user found that choosing 24 gave 23.98 [src](https://obsproject.com/forum/threads/selecting-frame-rates-in-obs.169989/).

**1.3 Units and writing**
- **Numbers.** Use numerals in UI. Put a space between the numeral and the unit [src](https://learn.microsoft.com/en-us/style-guide/a-z-word-list-term-collections/term-collections/units-of-measure-terms). Use "×", spaced, for screen resolutions [src](https://learn.microsoft.com/en-us/style-guide/checklists/numbers-checklist).
- **Frame rates.** Professional menus write a bare decimal (23.976, 29.97) or the number plus fps. The ones we offer are whole numbers, so "24 fps" never needs a decimal [est].
- **Size names.** Procreate Dreams spells "1080p" out as 1920 x 1080 [src](https://help.procreate.com/dreams/handbook/movie-settings/advanced-export). Canva and CapCut offer "1080p" and "1080P" as quality steps [src](https://www.canva.com/en_in/help/download-as-video/) [src](https://www.capcut.com/help/export-videos-in-capcut). But "1080p" does not say which way up the frame is. A tall film needs its aspect and its pixels: "9:16 · 1080 × 1920" [est].
- **Duration.** Duration is shown as a span: Start, End and Duration in After Effects [src](https://www.storyblocks.com/resources/tutorials/after-effects-rendering), or hours, minutes and seconds in Procreate Dreams [src](https://help.procreate.com/dreams/handbook/movie-settings/project). Motion offers a whole-or-In/Out choice [src](https://help.apple.com/motion/mac/5.2/en.lproj/motn189cfcd6.html). For short films, "12 s" or "12 seconds" is enough [est].
- **Quality.** Tools offer either named levels or a bitrate in Mbps.
  - Named levels: CapCut's Lower/Recommended/Higher [src](https://store.hollyland.com/blogs/creator-hub/best-export-settings-from-capcut-desktop-for-youtube-shorts) and Resolve's Automatic [src](https://io.bikegremlin.com/36082/davinci-resolve-best-export-settings-for-youtube/).
  - A bitrate in Mbps: Premiere and Media Encoder [src](https://www.adobe.com/creativecloud/video/hub/guides/best-export-settings-for-premiere-pro.html) [src](https://helpx.adobe.com/ie/media-encoder/desktop/encoding-and-exporting/export-settings-reference.html). Size is bitrate × length ÷ 8: 10 Mbps for 120 s is 150 MB, and the estimate "doesn't always match the final exported file" [src](https://screenlight.tv/blog/bits-and-bytes-the-simple-math-of-premiere-pros-exports).

## 2. Which frame rates matter, and what platforms accept

| Rate | Why it exists |
|---|---|
| 24 | Cinema's rate, a middle ground chosen when sound came in, still used for its look [src](https://help.viostream.com/technical-information/what-is-frame-rate) |
| 23.976 | 24p on NTSC, so it conforms to 29.97 broadcast [src](https://community.adobe.com/questions-529/why-23-976-fraction-in-composition-setting-68988) |
| 25, 50 | PAL [src](https://help.viostream.com/technical-information/what-is-frame-rate) |
| 29.97, 30 | NTSC [src](https://help.viostream.com/technical-information/what-is-frame-rate); a streaming guide calls "30 fps" optimal [src](https://yandex.cloud/en/docs/video/operations/streams/obs-config-help) |
| 48 | The Hobbit's high frame rate, for an "illusion of real life, where movement feels smoother"; a projectionist said it looked like "a made-for-TV movie" [src](https://www.slashgear.com/the-hobbit-48fps-footage-met-with-mixed-reactions-27224629) |
| 50, 60 | Sports, for clearly defined motion; "render that clip in 50 or 60 fps to really make that motion pop" [src](https://help.viostream.com/technical-information/what-is-frame-rate) |

**Platforms**
- **YouTube.**
  - Common rates are "24, 25, 30, 48, 50, 60 frames per second". Encode at the rate you recorded, in MP4 with H.264, with a closed GOP of half the frame rate.
  - 1080p SDR wants 8 Mbps at 24–30 fps and 12 Mbps at 48–60. The standard aspect is 16:9, but vertical and square are accepted [src](https://support.google.com/youtube/answer/1722171?hl=en).
- **YouTube Shorts.** Up to three minutes, "a square or vertical aspect ratio" [src](https://support.google.com/youtube/answer/15424877?hl=en).
- **Instagram Reels (Meta's API reference):**
  - MOV or MP4 with moov at the front, HEVC or H264, 23–60 FPS, at most 1920 columns; 9:16 recommended "to avoid cropping".
  - VBR at most 25 Mbps, 3 s to 15 min, 300 MB at most [src](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media).
  - Third-party guides still say "Maximum 30fps" [src](https://help.hopperhq.com/en/articles/6535168-video-guidelines) and "3 seconds to 180 seconds" [src](https://www.bestever.ai/post/meta-video-ad-specs). Meta's own reference wins [est].
- **TikTok.** Its ad specs take 9:16, 1:1 or 16:9, with suggested minimums of 720*1280, 640*640 or 1280*720. Files are .mp4 or .mov, within 500 MB, at 516 kbps or more. No frame rate is stated [src](https://ads.tiktok.com/help/article/video-ads-specifications). Kapwing recommends 1080 x 1920 and "at least 30 frames per second" [src](https://kapwing.com/resources/the-best-tiktok-video-size-guide-for-2022/).
- **For us** [est]:
  - Tall 1080 × 1920 at 24, 30, 48 or 60 fps fits YouTube and Instagram. TikTok states no rate, and Kapwing's advice of at least 30 makes 30 fps the safe default.
  - 25 and 50 add nothing on the web, and fractional rates add nothing to a film we render ourselves.
  - Our keys come every 2 s (uiMoving.js), while YouTube asks for half the frame rate, a key every 0.5 s. That is worth a later look, not part of the dialog.

## 3. Time-lapse and hyperlapse with a moving camera

- **The terms.** A hyperlapse moves the camera "a short distance between each shot". It keeps the time-lapse principle "but adds movement over much longer distances", and is stabilized afterwards [src](https://en.wikipedia.org/wiki/Hyperlapse).
- **Time given as a span.**
  - DJI Hyperlapse: in every mode (Free, Circle, Course Lock, Waypoints) "you will need to set the shooting interval time and the video length". The app then works out the number of photos and how long shooting will take [src](https://www.heliguy.com/blogs/knowledge-base/how-to-use-hyperlapse-on-dji-mini-4-pro/).
  - edelkrone sets Start and Finish positions, a "Record Time" (the total time-lapse duration), a "Play Time" (the final video's duration) and an interval, with "Ramping settings" [src](https://cdn.shopify.com/s/files/1/2463/3081/t/5/assets/edelkrone--app-details.pdf?0051).
- **Time given as a speed.**
  - GoPro TimeWarp offers 2x, 5x, 10x, 15x, 30x and Auto (the default). Its table: 2x turns 1 min into 30 s, and 30x turns 5 min into 10 s. A tap during recording drops to Real Speed (1x) or Half Speed [src](https://gopro.com/content/dam/help/hero10-black/manuals/HERO10Black_UM_ENG_REVB.pdf).
  - Instagram's Hyperlapse picks a speed "between 1x-12x" after recording [src](https://about.instagram.com/blog/announcements/introducing-hyperlapse-time-lapse-video-app).
- **Time given as an interval.**
  - Lapse It sets the capture interval and an adjustable frame rate [src](https://www.engadget.com/2014-05-15-daily-app-lapse-it-pro-is-a-robust-time-lapse-tool-thats-easy.html).
  - Calculators work out frames = length × fps and interval = event ÷ frames. A 2-hour event filmed as 10 s at 30 fps is 300 frames, one every 24 s [src](https://enlaps.io/guide/time-lapse-calculator). PhotoPills takes clip length, event duration and fps ("usually 25 fps") [src](https://photopills.com/calculators/timelapse).
  - For us, speed = span ÷ length [est]. A day in 12 s is 7200x: 2 hours a second, or 4 minutes a frame at 30 fps. An hour in 12 s is 5 minutes a second.
- **Start time of day.**
  - Blender's Sun Position takes a local time, time zone and daylight saving "to the moment you wish to simulate". It animates from keyframes on them [src](https://docs.blender.org/manual/it/3.3/addons/lighting/sun_position.html).
  - Ghost of Tsushima's photo mode sets Time of Day "right down to the second", which moves the shadows and sun. Animated Environment is on by default, and Tracking Shot keeps camera angles [src](https://www.androidcentral.com/ghost-tsushima-how-use-photo-mode).
- **The holy grail (day into night).** The day-to-night transition is "the Holy Grail of time lapse photography". The trouble is "the constantly changing light", which forces exposure ramping and causes flicker [src](https://www.photojoseph.com/tips/2016/9/2/create-stunning-sunrise-and-sunset-time-lapses-qdslr-dashboard-and-lrtimelapse).
  - LRTimelapse calculates a compensation curve for the ramping. Its deflicker smoothing should "leave mid and long term changes in brightness alone" [src](https://lrtimelapse.com/?p=23611).
  - We render, so there is no flicker. What we can take is the slow clock at dawn and dusk, which filmHours already does [est].
- **Easing.**
  - Manfrotto Motion: "Keyframe motion setup", "Set your ease in / ease out for smoothly ramping movement", and "interval, record time and playback time" [src](https://apps.apple.com/us/app/manfrotto-motion/id1566807793?uo=4).
  - Blender's default interpolation is Bézier, which "gives nicely smoothed curves" [src](https://docs.blender.org/manual/en/3.6/editors/graph_editor/fcurves/properties.html).
- **Loops.** Procreate Dreams offers "One Shot" or "Ping Pong", and "Loop" for a GIF [src](https://help.procreate.com/dreams/handbook/movie-settings/advanced-export). Manfrotto has "Bounce back for video (repeat)" [src](https://apps.apple.com/us/app/manfrotto-motion/id1566807793?uo=4).
  - A full round at even speed loops by construction, and so does a whole number of days [est].
  - "There and back" makes any move loop, but with time passing the sun runs backward on the way home [est].
- **Motion blur.**
  - The 180° rule sets the shutter at twice the frame rate (1/48 s at 24 fps), and a larger angle blurs more [src](https://www.studiobinder.com/blog/what-is-the-180-degree-shutter-rule/).
  - After Effects: 360° is "a full frame of continuous blur", and more samples per frame cost render time [src](https://www.provideocoalition.com/cmg_hidden_gems_chapter_8_motion_blur_and_more/). Motion's export has Motion Blur and Frame Blending switches [src](https://help.apple.com/motion/mac/5.4/en.lproj/motn189cf92b.html).
  - For us, blur means drawing k sub-frames for each frame, so k times the render. It is not cheap [est].

## 4. Dialog UX

- **Radios or a select.**
  - "For fewer than 5 options, radio buttons are usually better." Dropdowns suit about 5–10, and a combobox well past 15 [src](https://www.nngroup.com/articles/dropdown-list/).
  - The same article cites other thresholds: USWDS fewer than 7, Material 6, Carbon 3. GOV.UK calls the select "a last resort" [src](https://design-system.service.gov.uk/components/select/).
  - Prefer radios so options can be compared; lay them out one per line; make the labels clickable [src](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/).
- **Segmented controls.**
  - Apple: "no more than about five segments on iPhone", five to seven when wide. Segments are equal in width and either all text or all images. Labels are nouns or noun phrases, and segments "can also have text labels beneath them" [src](https://developer.apple.com/design/human-interface-guidelines/segmented-controls.md).
  - Material's segmented button is "typically used in cases where there are only 2-5 options", with single selection by default [src](https://api.flutter.dev/flutter/material/SegmentedButton-class.html).
- **Order.** "Always place numbers and dates in sequential order" [src](https://www.nngroup.com/articles/listbox-dropdown/). GOV.UK orders by the alphabet unless there is reason not to, and warns that most-common-first "can reinforce bias" [src](https://design-system.service.gov.uk/components/radios/).
- **Defaults.** NN/g: "select a single radio button by default in most cases" [src](https://www.nngroup.com/articles/radio-buttons-default-selection/). GOV.UK: "Do not pre-select" [src](https://design-system.service.gov.uk/components/radios/). Those are questions about the person; a render setting with a sensible default is NN/g's case [est].
- **Grouping.** Proximity and white space group fields; "You don't need group headings, but they can help" [src](https://www.nngroup.com/articles/form-design-white-space/). Use a single column, with labels "immediately above the field for mobile" [src](https://www.nngroup.com/articles/web-form-design/).
- **Summary and estimates.**
  - Media Encoder's Summary shows resolution, frame rate, codec and estimated file size [src](https://helpx.adobe.com/ie/media-encoder/desktop/encoding-and-exporting/export-settings-reference.html).
  - Final Cut's Info pane shows frame size, frame rate, duration and file size [src](https://support.apple.com/HT204322).
  - DJI shows the photo count and shooting time before flying [src](https://www.heliguy.com/blogs/knowledge-base/how-to-use-hyperlapse-on-dji-mini-4-pro/).
  - A wait of 10 s or more wants a percent-done indicator with "a text explanation of the process" [src](https://www.nngroup.com/articles/progress-indicators/).
- **Keyboard and accessibility.**
  - "Radio button groups should always be grouped using fieldset", and a legend should be "as short as possible" [src](https://w3.org/WAI/tutorials/forms/grouping).
  - Tab goes to the checked radio. The arrow keys move to the next radio and check it, wrapping at the ends [src](https://www.w3.org/TR/2021/NOTE-wai-aria-practices-1.2-20211129/examples/radio/radio-activedescendant.html).
  - Targets are at least 24 by 24 CSS pixels [src](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- **Phones.** Inline radios only for "two options" when "both options are short", and they still stack on small screens [src](https://design-system.service.gov.uk/components/radios/). Segmented controls "preserve their grouping regardless of the view size" [src](https://developer.apple.com/design/human-interface-guidelines/segmented-controls.md).

## 5. What we take

Everything here is [est]: decisions built on the sources above.

**The order: what moves, then how long, then size, then output.** This is After Effects' and Blender's picture-first order, with the move ahead of all of it. The file comes last, because the browser decides what it can be. Each group is a fieldset with a one- or two-word legend, in one column, with labels above. Segmented groups are native radios styled as segments, so the arrow keys work without extra code. Today's light picker uses aria-pressed buttons, which have no radio semantics. Segments are at least 44 px tall.

**What moves** (legend "Move")
- **Move:** radios, one per line: Camera round · Light round · Time passing · To another look. Default Camera round. "To another look and back" becomes To another look with Playback set to There and back.
- **The other look:** stays a select, because the list of kept looks can grow long. Shown for To another look.
- **Turn** (Camera round only): segmented, Quarter · Half · Full round. Default Full round.
- **Time passes** (Camera round and Time passing): segmented, Real time · 1 hour · 6 hours · 1 day · 2 days.
  - Real time is today's behaviour (the clock runs at 1x) and the default for Camera round. 1 day is the default for Time passing, which hides Real time.
  - This is the artist's "time should pass during the camera pan move": the span runs while the camera turns, through filmHours as Time passing does now.
- **Begins at** (when time passes on a daylit surface): segmented, As lit · Dawn · Midday · Dusk · Night. Default As lit: the sun starts where the light dial stands.
- **Easing:** segmented, Even · Ease in and out. Default Even for a full round, which keeps the seam clean, and Ease in and out for a part turn or a look. Time keeps its own slow dawn and dusk.
- **Playback:** segmented, Once through · There and back. Under There and back, when time passes, a caption reads "the sun returns the way it came".
- **Motion blur:** leave it out for now. Each frame would cost 4x. If it comes, it is Off · On with the caption "4x slower", for camera moves only.

**How long** (legend "Length")
- **Length:** stays a select. Its six options are past the five a phone row holds, and the order stays sequential: 6 seconds · 12 seconds · 24 seconds · 30 seconds · 45 seconds · 1 minute ("A minute" becomes "1 minute"). Default 12 seconds.
- **Frame rate:** segmented, 24 fps · 30 fps · 48 fps · 60 fps. Captions beneath each read film · phones and web · high frame rate · smoothest. Default 30 fps. No 23.976, 25, 29.97 or 50.

**Size** (legend "Size")
- Radio cards ordered narrow to wide, two by two when wide and stacked on a phone. Each has a name and, beneath it, the aspect and pixels:
  - The page (its own pixels, live, for example 2400 × 3200);
  - Tall (9:16 · 1080 × 1920, captioned "Reels, TikTok, Shorts");
  - Square (1:1 · 1080 × 1080);
  - Wide (16:9 · 1920 × 1080).
- Default The page.

**Output** (legend "Output")
- **Format:** segmented, MP4 · WebM · PNG frames, with captions H.264 · VP9 · zip. Default MP4, which every platform above takes. A format the browser cannot make is hidden, as today.

**Summary line** (aria-live, above Make the film)
- It reads: "12 s · 30 fps · 360 frames · 1080 × 1920 · MP4, about 14 MB".
  - The size comes from our own rule: 1080 × 1920 × 30 × 0.15 = 9.3 Mbps, and 9.3 × 12 ÷ 8 = 14 MB.
  - At 60 fps the same film is 720 frames and about 28 MB.
  - For PNG frames it reads "360 PNG frames, about 1–2 GB" (3–6 MB each, from moving-image.md).
- When time passes, it adds "a day at 2 hours a second" (span ÷ length, from section 3).
- After the first few frames it adds "about 3 minutes to make", timed from those frames, and from then on a percent and the frame count.

## Gaps

- **Not loaded or refused.** Blender's current English Format page and Adobe's Premiere helpx pages gave navigation only; the Blender code, an older manual and school guides stand in. Material 3's pages need JavaScript; Flutter's docs stand in. Apple's HIG accessibility page timed out, so 44 px is [est]. GoPro's TimeWarp article did not render; the HERO10 manual stands in. ProVideoCoalition's loopOut article was refused.
- **Resolve.** Blackmagic's own manual was not reached. Its Deliver page comes from three third-party walkthroughs that agree.
- **Search ran out** before NN/g's touch-target article, OBS's current common-FPS list, or a game photo mode that runs time during a camera move, so section 3 has no game precedent for that.
