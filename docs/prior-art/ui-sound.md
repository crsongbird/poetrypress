# Prior art: interface sound for Unfixable Vellum (the Murmur sound pass)

Key:
- **[src]** = stated in a source opened and read for this doc, with its URL.
- **[code]** = read from this repository (murmur.js, uiSkins.js, uiLocks.js, uiHistory.js, appEvents.js, index.html, AGENTS.md, docs/), with the file named.
- **[Ruby]** = Ruby's own words, from an earlier chat (the Symbology conversation, October 2026).
- **[calc]** = worked out here (the arithmetic is shown or can be re-run).
- **[est]** = my own judgment or inference.

Researched 2026-10-19, in two passes. The first pass had no web search, so most of its claims were unverified. The second pass (this one) ran the searches, opened the sources and either sourced, corrected or struck each claim. What could not be reached is listed in **Gaps** at the end.

## Read this first: what changed in the second pass

- **Confirmed:**
  - the platform rules: sound is sparing, short, never the only signal, and Web Audio on iOS obeys the silent switch;
  - Monument Valley, Journey, Rez and Mini Metro keep player sounds in a pitch set that fits the music;
  - pentatonic avoids half-step clashes;
  - the minor tierce in bells; the bar and tine ratios;
  - Chowning's 1 : 1.4 FM bell.
- **Overturned or corrected:**
  1. **The register.** Phone microspeakers peak near 1 kHz and fall off fast, and Windows asks for 600 Hz to 2 kHz. Today **almost every Murmur fundamental is under 300 Hz** (§1.3, the table). Home moves from D2 up to **D4**.
  2. **The loudness range.** Brewster's guidelines and Violet's say to keep loudness tight and matched. The map's 23 dB span shrinks to about 10 dB.
  3. **Length.** Windows says under a second, and Violet says taps are 30–150 ms. Every sound got shorter.
  4. **Repeats.** Windows says to sound only the first of a run of related events, and never more than twice in a row. The undo walk and the detents are now capped.
  5. **First touch on a phone.** On touch, `pointerdown` and `touchstart` do not count as user activation; only `pointerup` and `touchend` do. Murmur wakes on the first two (§4).
  6. **Reekes.** The "tritone" story is disputed. His own word was "freshen the palate", with a major chord.
  7. **Struck for want of a source:** Slack, Duolingo, Animal Crossing, Hades, Spiritfarer, Sky, the Mario coin, the NI and ALPS encoder counts, the DX7 attribution, and the wine-glass ratios.

---

## 0. What exists today, and what Ruby has asked for

### 0.1 Murmur as it stands [code: murmur.js, docs/ui-machinery.md]

- **A sound design is data** (`MURMUR_DESIGN`): a scale, a home octave, room, warmth, humanize, six instruments (the header comment says "five voices"; the table has six), named compositions, and a map from UI function to composition.
- **Bodies** are sums of sine partials taken from real things:
  - `bell`: 0.5, 1, 1.19, 1.5, 2, 2.66, 4.05.
  - `glass`: 1, 2.32, 4.25.
  - `tine`: 1, 6.27, 17.55, the cantilever beam (§5.1).
  - `bar`: 1, 3.99, 10.0, a tuned marimba bar.
  - `pad`: harmonics 1 to 4.
  - `sine`.
- **The mix:** every voice passes through a tanh "warmth" shaper, a 2.6 kHz low-pass (Q 0.4), a 1.8 s convolution room and a soft limiter (threshold −24 dB, ratio 6). Partials above 6 kHz are skipped.
- **Shimmer:** a twin partial 0.3 to 0.9 Hz away (scaled a little by partial number), so the sound beats slowly.
- **Drop:** struck instruments start sharp by `drop × 3%` and fall to pitch over 30 ms.
- **Scale and register:**
  - D Aeolian, home at **D2** (`octave: -1`, MIDI 38).
  - Every pitch is folded by octaves into **55–1100 Hz**.
  - Pentatonic scales (`minorPent`, `majorPent`) exist as a *snap* of the seven steps.
- **Humanize:**
  - The header says "never in pitch". In fact `voice()` detunes each note by up to ±3 × humanize/100 cents. At the default 15 that is ±0.45 cents, which is inaudible.
  - It also moves time by up to 12 ms × h, and level by −10% to +6% × h.
- **Rate limit:** the same function repeated within 40 ms plays once. At most 24 voices sound at once.
- **The knob skins** call `haptic(kind)` at a mark (`detent`) and at an end (`limit`). This is rate-limited to one per 50 ms. Each call plays the sound hook, and appEvents.js plays `murmur.play('detent')` for **every** kind, so an end stop and a mark sound the same today [code: uiSkins.js, appEvents.js].
- **Off until turned on.**
  - The switch and volume are app preferences in localStorage, never in a look (AGENTS.md §5.4).
  - The AudioContext is created and resumed in capture listeners for `pointerdown`, `keydown` and `touchstart`.
  - `playNotes` calls `resume()` again if the context is not running.
- **Current policy** (the comment above `MURMUR_DESIGN`): "very plain, in one minor key… and few". Most settings are silent.
  - **Mapped to `null`:** `tab`, `cardOpen`, `cardFold`, `checkbox`, `select`, `dialRandom`, `reroll`, the four readings, `spellShare`, `spellDissolve`, `undo` and `redo`.
  - **Already sounding:** `detent`, `lock` and `unlock` play `tick`.
- **Where it is called:**
  - uiLocks.js: lock and unlock; reroll for dice and single-control rolls; `undo` when a die roll is taken back.
  - uiHistory.js: undo, redo and nothingToUndo.
  - uiLook.js: preset, blocked and reroll.
  - appEvents.js: saveImage, tab, detent, the readings, confirm, soundOn and blocked.
  - uiGuard.js: confirm and hardNo.
  - uiAthanor.js: the Athanor's sounds.
  - index.html, through `data-sound`: Summon typeface, Summon backdrop, the spells, Record, the light die, the seed moon, the Athanor.
  - **Note:** the *New Random Surface* button carries `data-sound="summonBackdrop"`, not `reroll` (index.html).

### 0.2 What Ruby has said she wants

- From the Symbology chat, when the first Murmur was built **[Ruby]**: "falling/suspended chords for closing a menu, rising chords for opening one, turbulent chords for magic, builds and downbeats when they matter. Aim for soft, ethereal, melodic and mystical feeling. Ensure volume is always low."
- Now: "a sound pass: appropriate, not too annoying, melodic noises for appropriate effects (and please, do research prior art for that one)."
- The design language **[code: AGENTS.md §11]**: "A spell synthesizer, not a music one." The eye toggle is "my favorite one"; switches turn features on.

---

## 1. Principles of UI sound, from practitioners

### 1.1 What the platform guides say

**Windows (the Windows 7 UX guide).** The page notes that it "hasn't been updated for newer versions of Windows" [src](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound).
- **When to use sound:**
  - "When in doubt, don't use sound."
  - "Focus on sounds that keep users informed, are likely to change their behavior, or provide useful feedback."
- **Length:** "Use sounds that are short (less than one second)."
- **Frequency:** "Compose sounds with mostly mid-range to high frequencies (600 Hz to 2 kHz). Don't use low frequencies because they travel farther, are harder to locate, and can be alarming."
- **Loudness:**
  - "Set important sounds to be slightly louder", meaning action completions and failures.
  - "Set frequently occurring sounds to be slightly softer."
  - "An effective error sound can be slightly louder than the typical Windows sound, but need not be significantly louder."
- **Repetition:**
  - "The more often a sound is played, the less obtrusive it should be."
  - "Don't repeat a sound more than two times consecutively."
  - "For a consecutive sequence of related sound events, play a sound only on the first event."
- **Defaults:** "Consider not assigning sounds to frequently occurring events by default. Don't require users to configure their way out of an annoying initial experience."
- **Never alone:** "don't use sound as the only method of communication."
- **Pleasantness:**
  - "Don't beep."
  - "Choose pleasant sounds. Don't use unpleasant, alarming sounds, such as buzzing, crashing, and breaking."
- **Volume controls:** it also says "Don't have volume or mute controls in your program." That assumes a system mixer with a per-program slider, which a web page does not get. See §4 for why Vellum keeps its own switch [est].

**Apple HIG, "Playing audio"** [src](https://developer-mdn.apple.com/design/human-interface-guidelines/patterns/playing-audio):
- **Silent mode:**
  - "People switch their device to silent when they want to avoid being interrupted by unexpected sounds."
  - "When a device is in silent mode, it should play only the audio that people explicitly initiate."
  - People "want to silence nonessential sounds, such as keyboard clicks, sound effects, game soundtracks."
- **Categories:**
  - *Ambient*: "Sound isn't essential, and it doesn't silence other audio", "Mixes with other sounds", "Responds to the silence switch."
  - *Playback*: "Doesn't respond to the silence switch."
- **Other audio:** "don't make people stop listening to music from another app if you don't need to."

**Apple HIG, "Playing haptics"** [src](https://developer-mdn.apple.com/design/human-interface-guidelines/patterns/playing-haptics):
- **Harmony:** "When visual, auditory, and tactile feedback are in harmony" the experience feels more coherent. "You can also synchronize sound with haptics."
- **Overuse:** "Avoid overusing haptics. Sometimes a haptic can feel just right when it happens occasionally, but become tiresome when it plays frequently."
- **Standard controls:** "switches, sliders, and pickers automatically play haptic feedback on supported iPhone models." "Selection haptics provide feedback while the values of a UI element are changing."

**Apple, WWDC19 "Designing Audio-Haptic Experiences"** [src](https://developer.apple.com/videos/play/wwdc2019/810):
- Three principles:
  - **Causality:** "it must be obvious what caused it". "think about what would it feel and sound like, if what you interact with would be a physical object."
  - **Harmony:** "things should feel the way they look, the way they sound."
  - **Utility:** "Use moderation. Don't add sound and haptics just because you can."
- **Overload:** too much "will overwhelm people, and it will diminish the value of what's really important."
- The Digital Crown got "haptics and a very subtle sound".

**Material Design (Google).** Its sound pages need JavaScript and could not be read (see Gaps). Secondary sources quote them:
- **Kinds of sound:** sound "as feedback, as decoration, hero sounds, notifications and much more" [src](https://develop.designcode.io/ui-design-handbook-ui-sound-design).
- **Hero sounds:** they "highlight an important moment", "evoke an emotional state, or express celebration" [src](https://builtin.com/design-ux/10-insights-googles-material-design-guidelines).
  - They "Celebrate a significant positive action", "Welcome users to a new app or experience", "Confirm a key moment of a product's purpose".
  - They "occur infrequently, and because of their prominence, they should be applied in consistent ways."
- **Corrected:** the first pass listed "ringtones and ambient" as Material kinds, and said Material forbids sound as the only carrier of meaning. Neither could be confirmed for Material; Windows says the latter (above).

**Platform switches: sound is granular by default.**
- iOS: **Sounds & Haptics → Keyboard Feedback**, with Sound and Haptic toggled separately [src](https://support.apple.com/en-us/HT213404). The "Lock Sound" toggle claimed in the first pass was not found on the pages read, and is struck.
- macOS has two options [src](https://support.apple.com/guide/mac-help/-mchl9777ee30/mac):
  - "Play user interface sound effects": "such as dragging an item to the Trash";
  - "Play feedback when volume is changed": "Play a sound when you change the volume so you can hear the new volume". The sound itself reports the value [est: prior art for pitch-mapped detents, §3].
- Android (an LG user guide; the labels vary by maker) [src](https://lg.com/us/mobile-phones/VS930/JB/Userguide/settings_sound.html):
  - "Dial pad touch tones";
  - "Touch sounds": "plays a sound when you activate an item";
  - "Screen lock sound".

**Windows' own sounds.**
- **Windows 95:** Brian Eno recalled that the brief ended "and it must be 3.25 seconds long". He "made 84 pieces" [src](https://www.mentalfloss.com/article/50824/creating-windows-95-startup-sound).
- **Windows 11:** Microsoft told BleepingComputer, as PCWorld reports, that "The new sounds have a much rounder wavelength, making them softer". "Dark Sounds help you stay in focus while Light Sounds ensure you're always engaged" [src](https://www.pcworld.com/article/3632335/windows-11s-dark-mode-has-its-own-dark-sounds.html).
  - A dark theme with softer sounds is a direct precedent for a dark-first app [est].

**Haptics, designed alongside sound.**
- Android [src](https://developer.android.com/develop/ui/views/haptics/haptics-principles):
  - "We strongly recommend co-design of visual, audio, and haptic effects."
  - "Haptic effects applied to very frequent events, like scrolling or moving a text handle, should be very subtle."
  - It suggests "effects that become stronger as the interaction reaches a target, for example gradually increasing the amplitude of a sequence of ticks."
- The web-haptics guide says "Fire haptic at the exact instant the visual change occurs." Its `selection` type is for "picker scroll, stepper increment, slider detent, segment switch" [src](https://cdn.jsdelivr.net/gh/lochie/web-haptics@main/SKILL.md).
- One detent is therefore one event, seen, heard and felt on the same frame [est, and synth-controls.md §6].

### 1.2 Designers and products

**Jim Reekes (Apple).**
- **The old startup sound.** Reekes, on *Twenty Thousand Hertz*: it was "intentionally the hardest thing they could have made… It sounded horrible." He looked for "what sound could I use to unannoy you" [src](https://20k.org/episodes/letitbeep).
- **The chord:** "Couldn't be minor because that's so sad so it has to be major." He also said "I played an overtone series", and called it a "Zen calming gong like thing… to sort of freshen the palate" [src](https://20k.org/episodes/letitbeep).
  - AppleInsider's account says he "recorded a C-major chord on a synthesizer at home" [src](https://appleinsider.com/articles/18/03/25/creator-of-mac-startup-iphone-camera-sounds-talks-apple-sound-history).
- **Corrected:**
  - The first pass said the old sound was "a tritone". That label is disputed: "tritone? The original sound doesn't sound like a tritone to me" [src](https://cdm.link/jim-reekes-the-man-behind-mac-sound/). Say "harsh", not "tritone".
  - The "palate cleanser" quote is AppleInsider's paraphrase ("palette cleanser").
- **Sosumi:** Reekes wanted to call it "let it beep" and "spelled it funny… Sosumi" [src](https://appleinsider.com/articles/18/03/25/creator-of-mac-startup-iphone-camera-sounds-talks-apple-sound-history).
- **The lesson** [est]: consonance for routine, and harshness only where something is wrong. Murmur's soft no already works this way.

**Will Littlejohn (Facebook)** and **Conor O'Sullivan (Google Pixel)**, on *Twenty Thousand Hertz* [src](https://20k.org/episodes/facebook-and-google-pixel):
- Littlejohn:
  - "I'm the first person to pull sounds out of an experience if they don't really serve a purpose."
  - "We've found that the simpler, harmonically, things are, the higher their repetitive tolerance."
  - "When you approach it more from a family or a palette, it's really like painting a painting."
- O'Sullivan:
  - The Pixel's sounds are "based around the note and chord of G": one key for a whole product.
  - "The phone has a smaller speaker… It has its own unique resonances that you need to work with and work around."
  - "sounds that are heavier get lost."
- O'Sullivan elsewhere: "your goal as a sound designer is to provide feedback that doesn't jump out too much" [src](https://design.google/library/google-pixel-sound-design-ux-conor-osullivan).
- **Struck:** the first pass called Facebook's sounds "wooden and organic". No source said so.
- **The lesson** [est]: the sounds heard most often should be the **harmonically simplest**, one or two near-pure notes. Chords and runs are for rare moments.

**Violet Recording, "How to design UI sounds"** [src](https://violetrecording.com/how-to-design-ui-sounds/):
- **Length:**
  - "most interface cues last under 300 milliseconds"; "taps and clicks are 30–150 ms; notifications can stretch to around 500 ms."
  - "A cue that overstays its welcome becomes grating after the tenth trigger."
- **Frequency:**
  - cues "sit in a pleasant mid-high frequency range";
  - "high-pass the rumble below ~120 Hz and tame any harsh peaks around 2–5 kHz."
- **Loudness:**
  - "Match perceived loudness across the whole family, not just peak levels."
  - "If your error buzz is twice as loud as your tap, the interface feels unbalanced."
- **Pitch:**
  - "rising pitch reads as positive (success, confirm); falling or dissonant pitch reads as negative (error, cancel)."
  - "A major third or perfect fifth moving upward feels like an answered question."
  - "Higher, brighter cues feel lightweight and frequent; lower, fuller cues feel weightier and should be used sparingly."
- **Family:**
  - "all sounds in one product should feel related — same reverb, similar tone, a shared 'voice'."
  - "Reuse the same synth patch and just change pitch and envelope."
- **Small speakers:** "Bass-heavy cues… turn muddy or disappear entirely on phone and laptop speakers." "Always audition your final cues on the cheapest playback you can find."

**Nintendo Switch.**
- **The click:**
  - The "click" was "prominent in the entire marketing process". The console does make it when a Joy-Con is attached, with an on-screen cue [src](https://press-start.com.au/news/nintendo/2017/02/20/nintendo-switch-actually-makes-epic-clicking-noise-attach-joy-cons/).
  - The logo animation uses "A 'click'/'snap' sound when the Joycons are aligned, mimicking the sound of the Joycons being connected" [src](https://avid.wiki/Nintendo_Switch).
  - The click is a sonic logo **made from the product's own physical sound** [est]. That is Apple's causality principle (above).
- **The menus:** Nintendo's CEDEC 2018 talk said they "coupled sound effects with movement to make it clearer what was happening", with "rhythmic sound effects with no background music" [src](https://nintendowire.com/news/2018/08/22/nintendo-talks-about-the-design-of-the-switchs-os-at-cedec-2018/).
- **The tap's pitch:** one report, from a user's tweet and video, says the HOME menu's tap sound gets lower as the touched area grows: "More surface = lower pitch" [src](https://www.nintenderos.com/2017/07/los-sonidos-del-menu-home-de-switch-varian-en-funcion-del-tamano-de-la-superficie-que-toques/). It is unconfirmed by Nintendo, but it is a lovely idea: the sound reports the size of the touch [est].

**Teenage Engineering.**
- **The dials:**
  - OP-Z's dials are "endless dials", with values shown by LED [src](https://teenage.engineering/guides/op-z/interface-overview).
  - OP-1 field's encoders have "the same indented, endless action" as the original's, so they are **detented**, and they "are push buttons" [src](https://www.soundonsound.com/reviews/teenage-engineering-op-1-field).
  - Their feedback is visual: a pop-up "that shows encoder parameters and values when they're not obvious" [src](https://www.soundonsound.com/reviews/teenage-engineering-op-1-field).
- **TE's sound for others:** TE "worked on the audio for the 'ear (1)', Nothing's first product" [src](https://en.wikipedia.org/wiki/Teenage_Engineering).
- **No UI-sound writing found.** No TE writing on UI sound itself turned up (see Gaps). TE stays cited for its playful grammar of control (synth-controls.md §1.1) and for detented endless encoders.

**Struck (no source found):** Slack's "knock brush" and its redesign; Duolingo's chimes; Animal Crossing's menu sounds and Animalese; Hades; Spiritfarer. None of them is claimed here.

### 1.3 Why some sounds annoy, and what a phone speaker can play

**Frequency.**
- In Kumar et al. (2012, *Journal of Neuroscience*), the most unpleasant sounds fell in "the frequency range of around 2,000 to 5,000 Hz". Kumar: "This is the frequency range where our ears are most sensitive" [src](https://www.ncl.ac.uk/press/articles/archive/2012/10/nastynoiseswhydowerecoilatunpleasantsounds.html).
  - The citation is Kumar, von Kriegstein, Friston & Griffiths, 32(41):14184–92 [src](https://fis.tu-dresden.de/portal/en/publications/features-versus-feelings(f72a7ba0-f832-45c0-a5d2-fc5ac8680c07).html).
- Murmur's 2.6 kHz low-pass and 1100 Hz ceiling keep energy out of that band [code]. **Keep both.**
- Brewster's earcon guidelines put the earcon register "no higher than 5kHz" and "no lower than 125Hz-150Hz" [src](https://www.dcs.gla.ac.uk/~stephen/earcon_guidelines.shtml). That was for desktop speakers.
- On a phone, the floor is higher (below).

**Phone speakers** (the finding to keep: **fundamentals at about 300 Hz or higher for short sounds**, now sourced, and better still at 500–1200 Hz):
- "Most common telephones cannot reproduce sounds lower than 300 Hz." Pitch below that is still heard, through the *missing fundamental*, when the harmonics are present [src](https://en.wikipedia.org/wiki/Missing_fundamental).
- A patent on phone-style micro-speakers describes their response:
  - "a peak at a resonance frequency of around 1 kHz associated with the back-side cavity, and another peak… around 4-5 kHz";
  - "perceived loudness rolls off rapidly within a few hundred Hertz on either side of the resonance frequencies" [src](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/9553960).
- A tablet microspeaker study reports that its design extended "the audio frequency response… from 630 to 300 Hz" [src](https://academic.oup.com/jom/article/35/4/487/5950403). The stock speaker's floor was therefore near 630 Hz.
- Another microspeaker study judges "low-frequency performance" at 200, 300, 500 and 700 Hz, and calls it "poor… especially at low frequencies" [src](https://www.mdpi.com/2076-3417/10/24/8902/html).
- A mixing guide says "Most modern smartphone speakers struggle to reproduce anything below 200Hz", and that many have "a built-in filter that rolls off everything below 200 Hz". The way through is "the higher overtones that the speaker is actually capable of reproducing" [src](https://blog.landr.com/make-bass-audible-phone-speakers/).
- O'Sullivan: "sounds that are heavier get lost" [src](https://20k.org/episodes/facebook-and-google-pixel). Windows: 600 Hz–2 kHz [src](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound).
- **Murmur today, on a phone** [calc: `degreeMidi` with `octave: -1`, folded into 55–1100 Hz]:

  | Sound | Notes today | Fundamentals |
  |---|---|---|
  | soft no (`confirm`) | pad F2 → E2 | 87, 82 Hz |
  | hard no, hollow knock | knock D2 | 73 Hz |
  | done (Save image) | tine A2 → D3, bell D4 (hum D3) | 110, 147, 294 Hz |
  | arrive (preset, Sound on, spell) | pad D2 + A2 + D3, tine F3 | 73–175 Hz |
  | keep | tine D3, F3, A3 | 147–220 Hz |
  | summon | glass A3 → F3 | 220, 175 Hz |
  | tab notes | glass D3, F3, A3, B♭3, D4 | 147–294 Hz |
  | tick (detent, lock) | bar D4 | 294 Hz |

  - Nearly every fundamental is **below 300 Hz**, and all are below the ~1 kHz speaker peak.
  - The upper partials that would carry them are weak. Glass's 2.32× partial plays at 0.06 × bright 0.35 × 2 ≈ 0.04 [code].
  - **On the Moto G's own speaker, most of Murmur is probably nearly silent or a dull thump** [est]. Measure it (§6.3).
- **Recommendation** [est, from the sources above]:
  - Short, frequent sounds: fundamentals **≥ 300 Hz, ideally 440–1175 Hz** (A4–D6).
  - Low notes only in rare sounds, and only on bodies with strong upper partials (bell, pad, bar), so the missing fundamental carries them.

**Loudness, length and roughness.**
- **Intensity:** "Great care must be taken over the use of intensity because it is the main cause of annoyance due to sound." Earcons should sit between about 10 and 20 dB above the background threshold [src](https://www.dcs.gla.ac.uk/~stephen/earcon_guidelines.shtml). A 10 dB working range is enough [est].
- **Temporal integration:** "Listeners perceive short stimuli quieter than long stimuli at the same stimulus intensity", up to a "critical duration… of 200 ms" in normal hearing [src](https://www.egms.de/static/en/journals/zaud/2024-6/zaud000048.shtml). Peaks must therefore be set per sound, by ear [est].
- **Note length:** do "not use notes less than 0.0825 sec", but "if the earcon is very simple (one or two notes) then notes as short as 0.03 sec. can be used" [src](https://www.dcs.gla.ac.uk/~stephen/earcon_guidelines.shtml).
- **Annoyance model.** Zwicker & Fastl's model combines loudness, sharpness ("the perceived high-frequency tilt of a spectrum"), roughness and fluctuation strength [src](https://metricgate.com/docs/psychoacoustic-annoyance/).
  - Roughness is "rapid (15-300 Hz) amplitude modulation", greatest near 70 Hz. Fluctuation strength covers slower modulation, up to about 20 Hz, and peaks near 4 Hz [src](https://acoustics.salford.ac.uk/?p=716).
  - Murmur's shimmer beats at 0.3–0.9 Hz [code]. That is far below the 4 Hz fluctuation peak, so it reads as "alive", not as wobble or rough [est].
  - Keep the shimmer's beat **under about 1 Hz** [est].
  - The first pass's "20–150 Hz" roughness band is corrected to these figures.
- **Attack** [est, from the physics of a step]:
  - An instant onset on a sine is a broadband click.
  - Murmur's 3 ms attack floor [code] is right for a "touched" sound. Keep it.
- **Repetition:**
  - Repetitive game audio annoys "because they trigger identically again and again". The fix is "multiple variations, randomize pitch and sample selection" [src](https://sounddesign.irpr.agency/guides/why-is-my-game-audio-repetitive/).
  - Windows: "Don't repeat a sound more than two times consecutively" [src](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound).
  - The term "machine-gun effect" was not found in a source read here, and is dropped.
- **Meaning.**
  - Windows says sounds that do not inform, change behaviour or give useful feedback "should likely be eliminated" [src](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound).
  - Littlejohn: "I'm the first person to pull sounds out" [src](https://20k.org/episodes/facebook-and-google-pixel).
  - Murmur's policy that "most settings are silent" [code] is the right instinct. A sound pass should add *tiers* (§6.4), not noise [est].

### 1.4 How designers keep repeated sounds pleasant

- **Variation pools.** Unity's Audio Random Container is a typical engine tool [src](https://docs.unity.com/en-us/engine/6000.0/manual/audio/random-container/ui):
  - *Shuffle* "avoids repetition until all audio clips have played";
  - "Avoid Repeating Last" defines "how many items can play before an object plays again";
  - volume and pitch can each be randomized "with a minimum and a maximum distribution".
- **For a melodic system, random pitch breaks the key** [est].
  - Vary level and timing (Murmur already does [code]).
  - For variety in pitch, choose **another note from the pitch set**, never a detune.
  - Monument Valley 2 does this: a "randomised hang drum note", "tuned sympathetically to each level" (§1.5).
- **Round-robin within the key** [est]: step through pentatonic notes, never the same one twice in a row. Symbology's Murmur v1 did this ("Never the same note twice in a row") [Ruby chat code].
- **Short envelopes for frequent sounds:**
  - taps and clicks 30–150 ms [src](https://violetrecording.com/how-to-design-ui-sounds/);
  - nothing over 1 s [src](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound).
- **Only the first of a run.**
  - "For a consecutive sequence of related sound events, play a sound only on the first event" [src](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound).
  - Murmur's 40 ms per-function limit [code] covers only exact doubles. A longer burst rule is needed (§6.3) [est].
- **Rising to a target.** Android's "gradually increasing the amplitude of a sequence of ticks" [src](https://developer.android.com/develop/ui/views/haptics/haptics-principles) carries over to sound [est].

### 1.5 Melodic systems: one pitch set, so whatever the player does harmonizes

- **Rez (2001, Tetsuya Mizuguchi).** In PlayStation's account, the game "quantised all sound effects, from your shots to explosions, so they play in time and key with the music". It was "inspired by the artist Kandinsky, who had a neurological condition called synesthesia" [src](https://blog.eu.playstation.com/2017/10/20/classic-levels-deconstructed-tetsuya-mizuguchi-musician-adam-freeland-dissect-rez-infinites-area-5). This is the narrator's summary, not Mizuguchi's own words.
- **Tetris Effect (2018).** "rotating a block produces a sound that corresponds with the level's theme", played "in time with the upbeat rhythm" [src](https://www.gameinformer.com/preview/2018/10/29/a-colorful-riot-of-falling-musical-blocks).
- **Journey (2012, thatgamecompany; score by Austin Wintory).**
  - **The voice:** the player's voice is "re-pitched and processed birds, along with musical elements provided by composer Austin Wintory". Wintory "made musical parts for each type to compliment the score in each of the levels" [src](https://www.gamedeveloper.com/audio/the-sound-design-of-i-journey-i-).
  - **Pitch sets:** "Pitch sets were chosen for each game section so they harmonised with the score" [src](https://mcvuk.com/development-news/heard-about-journey/).
  - **A companion:** near another player "there are falling variations from your character, and rising variations from your companion" [src](https://www.gamedeveloper.com/audio/the-sound-design-of-i-journey-i-). Harp and viola enter only when another player is near, "written as counterpoint throughout" [src](https://mcvuk.com/development-news/heard-about-journey/).
- **Monument Valley (ustwo).**
  - **The first game:** Stafford Bawler did its sound design [src](https://www.mcvuk.com/learn-tearaway-and-monument-valleys-sound-design-secrets/). Whether *its* interactions were in key could not be confirmed (Gaps).
  - **Monument Valley 2 (Todd Baker):**
    - "The interactive rotating platforms have playful musical layers attached to their movement."
    - Navigation pings are a "randomised hang drum note" "tuned sympathetically to each level".
    - The mother's flute "triggers random phrases in a sympathetic musical key".
    - Baker "felt it was important to not overuse musical interactions" [src](https://www.audiokinetic.com/fr/blog/behind-the-beautiful-sound-of-monument-valley-2-with-todd-baker).
  - **Monument Valley 3:** a turning gear is "tuned, rhythmic, and harmonically in key with the scene's ambient music" [src](https://news.xbox.com/en-us/2025/07/18/how-monument-valley-3-uses-soundscapes-to-tell-its-story/).
- **Mini Metro (Dinosaur Polo Club; audio by Disasterpeace, Rich Vreeland)** [src](https://designingsound.org/2016/02/18/the-programmed-music-of-mini-metro-interview-with-rich-vreeland-disasterpeace):
  - "Each subway line has a rhythm and a note tied to it at any given time."
  - "Each city also has its own harmonic progression." Altering a line "replaces the oldest note in the harmonic structure with the next one in line."
  - The update loop is treated "like a sequencer", at "5 times a bar (quintuplets), or 16 times a bar".
  - The game clock's speed changes the notes' envelopes, and "When the game is paused, the music is at its most ambient."
  - The scale is not named.
- **Other products in one key:**
  - Google's Pixel is "based around the note and chord of G" [src](https://20k.org/episodes/facebook-and-google-pixel).
  - A designer of a UI sound pack: "The pack I created uses the D major scale." "I made different sequences, progressions, and chords that can be used together in harmony" [src](https://marvelapp.com/blog/designing-musical-user-interfaces/).
- **Struck:** Sky's in-key instruments, and the Mario coin's notes, could not be confirmed.
- **What they share** [est, drawn from the sources above]:
  1. **One pitch set per scene**: a level's key, a section's pitch set, a city's progression, a product's chord of G.
  2. **Randomness only inside that set**: MV2's randomised note, the flute's random phrases, Journey's pitch sets.
  3. **Restraint**: MV2's "not overuse".
  4. **Time quantised where rhythm is the game**: Rez, Mini Metro, Tetris Effect.
- **What an app takes from them** [est]: (1)–(3), but not (4). Quantising UI sounds to a beat would delay feedback. Feedback must be at "the exact instant the visual change occurs" [src](https://cdn.jsdelivr.net/gh/lochie/web-haptics@main/SKILL.md), and causality must be "obvious" [src](https://developer.apple.com/videos/play/wwdc2019/810).

**Why pentatonic for the random layer.**
- The pentatonic scale has "no half-step clashes between adjacent scale notes, so nothing grates", and its notes "always sound consonant together" [src](https://violetrecording.com/the-pentatonic-scale-explained/).
- Orff tuned children's percussion to pentatonic so that they could play together: "The notes in the pentatonic scale naturally sound good in any order" [src](https://www.playgrounds.co.nz/blog/the-pentatonic-scale-for-early-years).
- **For D minor pentatonic (D F G A C)** [calc]:
  - Intervals between any two notes: the smallest is a whole step (F–G, G–A, C–D). There is **no half step**.
  - There is **no tritone**: neither B nor A♭ is present to pair with F or D.
- None of the games above names the pentatonic as its method. That choice is **[est]**, built on the sourced property.

**Auditory icons and earcons (the research).**
- **Gaver (1989).**
  - "Auditory icons are everyday sounds meant to convey information about computer systems by analogy with everyday events."
  - They are mapped by source attributes, "such as material, size and force", rather than by musical parameters.
  - Because they are "the kinds of sounds one hears in everyday environments anyway", they are "less likely to be distracting or annoying than are musical sounds" [src](https://www.ioa.org.uk/system/files/publications/WW%20GAVER%20AUDITORY%20ICONS.pdf). This is an argument; Gaver notes "no rigorous user testing has been performed".
- **Blattner, Sumikawa & Greenberg.**
  - Earcons are "non-verbal audio messages that are used in the computer/user interface to provide information to the user".
  - They are built from motives: "A motive is a brief succession of pitches arranged in such a way as to produce a tonal pattern".
  - Unlike auditory icons, "there is no intuitive link between the sound and what it represents; the link must be learned" [src](https://www.dcs.gla.ac.uk/~stephen/generalearcons/generalearcons1.shtml).
- **Brewster, Wright & Edwards, guidelines** [src](https://www.dcs.gla.ac.uk/~stephen/earcon_guidelines.shtml):
  - "Use musical instrument timbres", with "multiple harmonics as this helps perception and can avoid masking";
  - "Make rhythms as different as possible";
  - "Earcons with up to six notes played in one second have been shown to be usable";
  - "use a 0.1 second gap" between serial earcons;
  - intensity "is the main cause of annoyance".
- **What this means for Vellum** [est]: Gaver's warning and Littlejohn's "simpler, harmonically" agree.
  - **Sounds of the hand** (detents, latches, end stops, knocks) should be *auditory icons*: wood and contact, short, with barely any melody.
  - **Earcons**, the motives and chords, go to the rarer moments, where their meaning is worth learning.
  - Each earcon should differ from the others in **rhythm and note count**, not only pitch (Brewster).

---

## 2. Magical, mystical and "spell" palettes

### 2.1 The timbres, and what they say

| Timbre | Physical source | What it says [est] |
|---|---|---|
| **Chimes, bells** | struck shells. A tuned bell's partials are hum 0.5, prime 1, **tierce 1.183 (a minor third)**, quint 1.506, nominal 2 [src](https://en.wikipedia.org/wiki/Strike_tone) | ceremony, time, a threshold |
| **Kalimba, music box** | clamped steel tines, i.e. cantilevers, ratios 1 : 6.267 : 17.547 [calc] | intimate, hand-made, gentle magic |
| **Celesta** | hammered steel plates over resonators. "The opening melody [of Hedwig's Theme] is played by a solo celesta" [src](https://www.classicfm.com/discover-music/periods-genres/film-tv/harry-potter-soundtrack-hedwig-theme-john-williams/) | the film's own sound of magic |
| **Glass** | a shell; modes from the ring formula 1 : 2.83 : 5.42 [calc]. Real glasses vary with stem and taper | fragile, clear, uncanny |
| **Singing bowl** | a shell whose modes come in pairs: "two peaks separated by several Hz arise and a beating mode is heard" [src](https://arxiv.org/pdf/1106.6348) | ritual, the start of a practice |
| **Harp glissando** | a fast scale on plucked strings (harmonic partials) | transformation, "and then…" |
| **Pad, choir** | sustained, slow attack | presence, the numinous |
| **Wooden bar, tick** | a free bar, 1 : 2.757 : 5.404 untuned [calc]. Marimba bars are tuned to 4:1 and about 10:1, xylophone bars to 3:1 [src](https://hyperphysics.gsu.edu/hbase/Music/xylo.html) | the hand: a physical, honest click |

- **Spell conventions** [est, with sourced pieces]:
  - Confirm rises and cancel falls ("rising pitch reads as positive… falling or dissonant pitch reads as negative") [src](https://violetrecording.com/how-to-design-ui-sounds/).
  - A spell is a build, then a release when it takes effect. This matches Ruby's request ("builds and downbeats when they matter") [Ruby].
  - The genre conventions of fantasy menus (cursor blip, paper page-turns, level-up fanfares) were not sourced, and are offered only as my own reading.
- **Why not Lydian, the "wonder" mode.** Lydian is the mode film uses for "awe rather than triumph", its fourth raised a half step, as in James Horner's Universal ident [src](https://markslater.net/unlocking-the-power-of-the-lydian-mode/). The raised fourth is a tritone above home, which is why it is kept out of the random layer (§6.1) [calc].
- **How it applies to Vellum** [est]:
  - **The hand** (detents, latches, end stops) gets wood and knock. These are auditory icons (Gaver).
  - **Moving around** (tabs, drawers, eyes) gets glass and short tine: light, one or two notes.
  - **Magic** (dice, Summon, a surface arriving) gets a celesta- or harp-like run, then a pad downbeat.
  - **Keeping** (save, a preset arriving) gets bell and tine: ceremony.
  - **Asking or refusing** gets the pad's half step, and a knock. These already exist.
  - **The singing bowl**: at most the one-time "Sound on" greeting. It is too long for anything else (Windows: under a second).

---

## 3. Knobs, faders and detents in sound

- **What a detent is.** "One or more physical click-stops which can be felt when a rotary control is moved." It is "typically used to identify the centre of a control such as a pan or EQ cut/boost knob, or to give the impression of preset positions on a gain control" [src](https://www.soundonsound.com/glossary/detent).
- **Hardware practice.**
  - **Ableton Push.** One user finds it "pretty difficult to dial the encoders exactly to 0% or reset a parameter back to default". The answer: "Press and hold Delete and tap the encoder" [src](https://forum.ableton.com/viewtopic.php?p=1819410). Smooth controls make "exactly home" hard to hit, so Vellum's double-tap reset needs a distinct sound [est].
  - **Teenage Engineering.** The OP-1 field has "indented, endless" encoders, so it is detented, and it shows values in a pop-up rather than sounding them [src](https://www.soundonsound.com/reviews/teenage-engineering-op-1-field). The OP-Z has endless dials with values on LEDs [src](https://teenage.engineering/guides/op-z/interface-overview).
  - **Moog's Model D app** offers fine adjustment: "touch the representation of the wooden case while turning the knob" [src](https://www.soundonsound.com/node/4918957).
  - **Struck:** the first pass's claim that NI and Push navigation encoders have "20–24 clicks" and use ALPS EC11 parts.
- **Software prior art.**
  - **iOS pickers:** "switches, sliders, and pickers automatically play haptic feedback". "Selection haptics provide feedback while the values of a UI element are changing" [src](https://developer-mdn.apple.com/design/human-interface-guidelines/patterns/playing-haptics). The first pass's claim of a picker *sound* is struck.
  - **macOS's volume feedback** "so you can hear the new volume" [src](https://support.apple.com/guide/mac-help/-mchl9777ee30/mac): a value reported by sound.
  - **Web knob libraries** such as webaudio-controls give `step` ("The 'value' is always rounded to multiple of 'step'"), `sensitivity` and a `valuetip`, but **no audible feedback** [src](https://github.com/webmusicdevelopersjp/webaudio-controls).
- **Should software knobs tick?**
  - The sources pull two ways:
    - Apple and Android give pickers and sliders selection feedback [src](https://developer-mdn.apple.com/design/human-interface-guidelines/patterns/playing-haptics).
    - Windows says frequent events should have no sound by default, and only the first of a run [src](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound).
  - The resolution [est]:
    - Detent ticks are **off by default** (tier C, §6.4).
    - They fire **only where the skin already gives a haptic**: a named mark, the default ("home") and the ends [code: uiSkins.js].
    - There is no tick per drawn dot. That is a revision of the first pass's "whisper at every 10% dot".
  - **Rate:**
    - At most one per 50 ms, as the haptic is today [code: uiSkins.js].
    - When the hand moves faster than about 15 marks a second, play every other one, 3 dB quieter [est].
  - The tick, the visual mark and the haptic fire on the same frame [src](https://cdn.jsdelivr.net/gh/lochie/web-haptics@main/SKILL.md).
- **Pitch mapping.**
  - Walker & Mauney (2010) found polarities that were mostly positive: higher temperature, pressure or velocity mapped to higher pitch. **Size split evenly** (4 positive, 4 negative), and dollars were mixed [src](https://wirelessrerc.gatech.edu/sites/default/files/publications/walker_et_al_-_a_comparison_of_sonification_mappings.pdf). The first pass's "bigger means lower" is corrected to "split".
  - For an interface, consistency beats per-dimension polarity: every Vellum knob maps up to up [est].
  - A mark's note comes from the **pentatonic ladder** (§6.1), by its position. Monument Valley 3's "harmonically in key" gear is the model [src](https://news.xbox.com/en-us/2025/07/18/how-monument-valley-3-uses-soundscapes-to-tell-its-story/).
  - Lift the ladder's bottom rungs about 2–3 dB. Two sources say lower notes will sound quieter: the ear is most sensitive at 2–5 kHz [src](https://www.ncl.ac.uk/press/articles/archive/2012/10/nastynoiseswhydowerecoilatunpleasantsounds.html), and a phone speaker's output rises toward its ~1 kHz resonance [src](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/9553960) [est].

---

## 4. Accessibility and etiquette

- **Off by default.**
  - Murmur already is [code]. Keep it so.
  - Windows: "Don't require users to configure their way out of an annoying initial experience" [src](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound).
  - Turning sound on plays one greeting (`soundOn` → `arrive`) [code], so the person hears what they enabled.
- **Autoplay and user activation.**
  - **Chrome:**
    - An AudioContext made before a gesture "will be created in the 'suspended' state", and "you will need to call `resume()` after the user gesture".
    - Also, "the `AudioContext` will be resumed after a user gesture if `start()` is called on any attached node".
    - Which events count "are still to be defined consistently across browsers", and Chrome recommends `click` [src](https://developer.chrome.com/blog/autoplay).
  - **MDN:**
    - Autoplay of Web Audio "(in particular for `AudioContexts`)" is gated by **sticky** activation.
    - The activating events are `keydown`, `mousedown`, `pointerdown` *if `pointerType` is "mouse"*, `pointerup` *if `pointerType` is not "mouse"*, and `touchend` [src](https://developer.mozilla.org/en-US/docs/Web/Security/User_activation).
    - WebKit lists the same set [src](https://webkit.org/blog/13862/the-user-activation-api/).
    - The web-platform test expects touch "pointerdown event should not result in activation" and touch "pointerup event should result in activation" [src](https://arai.searchfox.org/firefox-main/source/testing/web-platform/tests/html/user-activation/activation-trigger-pointerevent.html).
  - **This matters for Murmur** [code + est]:
    - Its `wake` runs on `pointerdown`, `keydown` and `touchstart`. On a phone, **none of these activates**, so the first `resume()` runs before the page has activation.
    - It probably still works, because `playNotes` calls `resume()` again from the click that follows, by when activation is sticky.
    - The fix is cheap and certain: add `pointerup` and `touchend` to the wake list. Test the first tap on the Moto G.
  - MDN's best-practice page says the same: "Create or resume context from inside a user gesture" [src](https://docs.w3cub.com/dom/web_audio_api/best_practices).
  - **Etiquette is stronger than the browser rule** [est]:
    - Even after a gesture, no sound for something the person did not just do: a texture finishing in the worker, a draft restoring, a service-worker update.
    - The exception is a long job the person started and is waiting on (Save image).
    - Play nothing while `document.hidden`.
    - This is Apple's "play only the audio that people explicitly initiate" [src](https://developer-mdn.apple.com/design/human-interface-guidelines/patterns/playing-audio).
- **iOS and the silent switch.**
  - Pages that play Web Audio are muted by the Ring/Silent switch. With the ringer off "there will be no audible playback", while "a regular… audio element… works" [src](https://www.audjust.com/blog/unmute-web-audio-on-ios).
  - The `unmute` library exists to *defeat* this, by playing a silent `<audio>` loop so that "web audio play on the media channel rather than the ringer channel" [src](https://github.com/swevans/unmute). That is the opposite of what Vellum wants. Never play a media element for UI sound [est].
  - **The Audio Session API:**
    - `navigator.audioSession.type` takes `auto` (the default), `playback`, `transient`, `transient-solo`, `ambient` and `play-and-record`. `ambient` is "Ambient audio that can mix with other types of audio" [src](https://developer.mozilla.org/docs/Web/API/AudioSession/type).
    - MDN marks it experimental and "Limited availability", not Baseline [src](https://developer.mozilla.org/en-US/docs/Web/API/Audio_Session_API).
    - The W3C draft (13 November 2024) says an `AudioContext` defaults to ambient and an `HTMLMediaElement` to playback. Under `auto`, a page with an active media element becomes `playback` [src](https://www.w3.org/TR/audio-session/).
    - A WebKit engineer, testing iOS 17.4 and 18, found that `transient` maps to Apple's ambient category, and "sound will not be heard if the silent switch is on" [src](https://bugs.webkit.org/show_bug.cgi?id=264473).
  - **Recommendation [est]:** where `navigator.audioSession` exists, set `navigator.audioSession.type = 'ambient'` before creating the context.
    - It is the default for a Web-Audio-only page already. Setting it pins the intent: obey the silent switch, and mix with the person's music.
    - It also stops `auto` from turning the page into `playback` if a media element ever plays.
- **Android (Ruby's baseline phone).**
  - Android has "separate audio streams for playing music, alarms, notifications, the incoming call ringer, system sounds"; apps "should play audio with usage `AudioAttributes.USAGE_MEDIA`" [src](https://developer.android.com/media/platform/output).
  - That Chrome plays page audio on the media stream, so that silent or vibrate mode does not mute it, is **[est]**, unconfirmed (Gaps). Test it on the Moto G.
  - If it holds, **Vellum's own switch is the real control** on Ruby's phone, and default-off matters more there than on iOS [est].
- **Reduced motion, and reduced sound.**
  - No shipped media query for sound was found. A 2020 CSS Working Group issue, #5607, proposed one: `sound-volume: mute | quiet | loud | auto` [src](https://lists.w3.org/Archives/Public/public-css-archive/2020Oct/0293.html).
  - `prefers-reduced-motion` says something about sensory load, not hearing. It should not switch sound off by itself [est].
  - A soft use is fair [est]: when reduced motion is set *and* sound is on, skip the ornaments (runs, sparkle, tails over 600 ms). Functional sounds stay.
- **Volume.**
  - Windows would have no in-app volume [src](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound). A web page has no per-page mixer slider, and on Android it may share the media stream with the person's music [est].
  - Keep Murmur's own volume, **low by default**. Make the slider perceptual (gain = v², or −40 to 0 dB) [est].
  - Keep the limiter [code].
- **Never the only signal.** Every sound has a visual twin: a toast, a state change or a glyph [src](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound).
  - WCAG 1.4.2 Audio Control applies only "If any audio on a Web page plays automatically for more than 3 seconds" [src](https://www.w3.org/WAI/WCAG20/Understanding/audio-control), which Murmur never does.
  - The first pass cited WCAG 1.3.3 for this; that was the wrong criterion.
- **Screen readers** [est]: a web page cannot detect one, and a long sound masks speech. Keep frequent sounds under about 150 ms, and let the person mute each tier.
- **Power** [est]: suspend the AudioContext after about 10 s with no sound, and resume on the next gesture.

---

## 5. Web Audio synthesis recipes

### 5.1 The physics of struck and plucked bodies

- **A free–free bar** (glockenspiel, an untuned bar). Its modes are the roots of cos x · cosh x = 1. The ratios are **1 : 2.757 : 5.404 : 8.933** [calc, re-run 2026-10-19].
  - Hyperphysics confirms that the free modes "are not a harmonic sequence, but they can be altered by removing material" [src](https://hyperphysics.gsu.edu/hbase/Music/xylo.html).
  - The brief's "kalimba: sine at f plus partial at 2.76·f" is therefore a *glockenspiel bar*, not a kalimba.
- **A clamped–free bar** (cantilever: kalimba tine, music-box tooth). Its modes are the roots of cos x · cosh x = −1. The ratios are **1 : 6.267 : 17.547 : 34.386** [calc]. Murmur's `tine` (1, 6.27, 17.55) is exactly this [code].
- **Tuned bars.**
  - Marimba: the first overtone is tuned to "the fourth harmonic" (4:1), and the next to "close to the 10th harmonic (48/5 if just intervals are used)".
  - Xylophone: tuned to "the third harmonic" (3:1) [src](https://hyperphysics.gsu.edu/hbase/Music/xylo.html).
  - Murmur's `bar` (1, 3.99, 10.0) is a tuned marimba bar [code].
- **Church bells.**
  - Partials relative to the prime: hum 0.500, prime 1.000, **tierce 1.183** (just 1.200, "minor third"), quint 1.506, nominal 2.000 [src](https://en.wikipedia.org/wiki/Strike_tone).
  - Murmur's `bell` uses 0.5, 1, 1.19, 1.5, 2 [code].
  - The minor tierce is why bells sit well in a minor mode [est].
- **Singing bowl.**
  - **Doublets:** "Due to the bowl asymmetry, two peaks separated by several Hz arise and a beating mode is heard" [src](https://arxiv.org/pdf/1106.6348).
  - **Size:** the measured bowls' fundamentals were 187–428 Hz [src](https://arxiv.org/pdf/1106.6348).
  - **Higher modes:** the paper gives no measured ratios. The thin-ring formula f ∝ n(n²−1)/√(n²+1) gives **1 : 2.83 : 5.42 : 8.77** for n = 2…5 [calc]. The first pass's "1 : 2.7 : 5.1 : 8.4" was a recollection and is replaced by this.
- **Wine glass.**
  - The same ring formula gives 1 : 2.83 : 5.42 [calc].
  - The first pass's claim that the modes "fall near 2.3× and 4.2×" was not confirmed, and is struck.
  - Murmur's `glass` (2.32, 4.25) is its own choice, tuned by ear, and fine as such [code].
- **FM bell (Chowning 1973).**
  - "The ratio c/m = 1/1.4 results in an inharmonic relation of the frequency components" (carrier 200 Hz, modulator 280 Hz).
  - The index is made proportional to the amplitude envelope (0 to 10), and the tone lasts 15 s [src](https://web.eecs.umich.edu/%7Efessler/course/100/misc/chowning-73-tso.pdf).
  - The bell therefore starts bright and mellows as it fades.
  - The first pass's "1 : 14 DX7 tine" attribution was not confirmed and is struck. The recipe stays below as [est].

### 5.2 Recipes

Parameters are for Web Audio. Each recipe is cheap: 1 to 6 `OscillatorNode`s and a `GainNode` each, made per note and released afterwards, the way Murmur already does it [code]. Levels are relative, before Murmur's master and limiter.

All values are **[est]** unless tagged. They come from the physics above and need tuning by ear in the Murmur Studio, then checking on the phone.

**Register for all recipes:** fundamentals **D4–D6 (294–1175 Hz)** for anything frequent (§1.3).

- **Wood tick** (detents, lock latch)
  - **Tone:** a sine at f, with partials 3.99× at 0.10 and 10× at 0.02. Attack 3 ms; exponential decay **35–60 ms**.
    - Brewster allows notes as short as 0.03 s for one- or two-note earcons [src](https://www.dcs.gla.ac.uk/~stephen/earcon_guidelines.shtml).
  - **Pitch:** a fall from 1.03·f to f over 25 ms (Murmur's `drop` [code]).
  - **Noise:** a 4 ms **noise burst** through a band-pass at 2·f (Q 3–4), at 0.15 of the tone's level. It gives the "contact", and carries the tick on a phone because its energy sits near the speaker's peak.
  - **Cost:** one 0.1 s noise `AudioBuffer`, reused through `AudioBufferSourceNode`s. Murmur has no noise source yet.
- **Kalimba pluck** (switch on and off, fader mark)
  - **Body:** cantilever partials **1 (1.0), 6.267 (0.06), 17.55 (0.01)**. Attack 3–4 ms.
  - **Decay:** 150–250 ms for interface use. The rare-moment version keeps 0.5–0.9 s.
  - Murmur's `tine` is this body [code].
- **Glockenspiel / celesta** (sparkle, run notes, tab notes)
  - **Glockenspiel:** a free–free bar, **1 (1.0), 2.757 (0.18), 5.404 (0.05)**. Attack 2 ms; decay 0.3–0.6 s.
  - **Celesta:** the same strike, nearly pure (1 and 4× at 0.04). Decay 0.3–0.6 s.
- **Music box** (keeping, preset tiles)
  - **Body:** the cantilever at D5–A5. Decay 0.35–0.6 s.
  - **Variation:** ±1.5 dB in level and ±6 ms in time per note. Never vary pitch.
- **Struck glass** (eyes, tabs)
  - **Body:** **1 (1.0), 2.32 (0.06–0.15), 4.25 (0.02)** [code body].
  - **Envelope:** attack 8–15 ms; decay **150–300 ms** for interface use.
  - **Shimmer:** a twin +0.4–0.9 Hz at 0.05 [code], kept under 1 Hz (§1.3).
- **Singing bowl** (the "Sound on" greeting only)
  - **Body:** partials **1 (1.0), 2.83 (0.45), 5.42 (0.2), 8.77 (0.08)** [calc ratios], each with a twin 1–4 Hz away at 0.3. "Several Hz" follows the bowl paper [src](https://arxiv.org/pdf/1106.6348).
  - **Envelope:** attack 3 ms; audible length **≤ 1.5 s**. Windows asks for under 1 s; this one is the sole exception, played once, on opt-in [est].
- **FM bell** (Save done)
  - **Patch:** a carrier at f, and a modulator at **1.4·f**, through a gain of `index × 1.4·f`. The ratio is Chowning's [src](https://web.eecs.umich.edu/%7Efessler/course/100/misc/chowning-73-tso.pdf).
  - **Index:** **3 → 0.2**, following the amplitude, as Chowning's does (his runs 10 → 0 over 15 s; this is a short UI version).
  - **Amplitude:** attack 3 ms; audible length **≤ 1.2 s**.
- **FM "ping"** (a brighter switch-on)
  - **Patch:** a carrier at f, with a modulator at 14·f, index **1.5 → 0 in 40 ms**.
  - **Effect:** a bright attack with no bright tail to tire of.
- **Harp-like pluck and run** (Summon, dice landing)
  - **Pluck:** harmonics **1, 2, 3, 4** at **1.0, 0.45, 0.22, 0.10**, the higher ones decaying faster. Decay 0.3–0.6 s.
  - **Run:**
    - 4–6 pentatonic notes, **30–40 ms apart**, rising, about 1 dB louder per note.
    - The run is an ornament, faster than Brewster's six notes a second for information-bearing earcons [src](https://www.dcs.gla.ac.uk/~stephen/earcon_guidelines.shtml), so it must carry no meaning of its own.
- **Pad / breath** (open, arrive, soft no)
  - **Tone:** two sines at f, ±4–6 cents, plus harmonics 2 and 3 at 0.14 and 0.05.
  - **Envelope:** attack **80–150 ms**, release **0.3–0.6 s**.
  - **Register:** low pads must keep their harmonics bright enough for the missing fundamental to carry them on a phone [src](https://en.wikipedia.org/wiki/Missing_fundamental). Raise `bright` for pads below D4.
- **Knock** (end stop, blocked, hard no)
  - **Tone:** a sine at f (**D4–A4**, not D2) with a pitch drop from **1.6·f to f in 20 ms**. Decay **60–90 ms**.
  - **Noise:** a 3 ms noise burst, band-passed at 800–1000 Hz (Q 2), at 0.25. On a phone the contact *is* the knock.
- **Dice roll, melodic** (`reroll`)
  - **The tumble:** 4–5 wood ticks on random **pentatonic** rungs, never the same twice in a row. The gaps grow: **40, 55, 75, 100 ms**. Levels fall about 1.5 dB each.
  - **The landing:** one glockenspiel note. Total about 350–450 ms.
- **Sparkle** (an ornament over Summon)
  - 3–5 glass notes in the top rungs (A5–D6), at −20 dB, at random times within 200 ms.
  - Dropped when reduced motion is set.

---

## 6. A proposed sound map for Vellum

### 6.1 The key: D, with two layers

The key recommendation is **kept**, because the sources support it in principle:
- **One pitch set for a whole product or scene.** Pixel's G [src](https://20k.org/episodes/facebook-and-google-pixel); Journey's "Pitch sets… so they harmonised with the score" [src](https://mcvuk.com/development-news/heard-about-journey/); MV2's "sympathetic musical key" [src](https://www.audiokinetic.com/fr/blog/behind-the-beautiful-sound-of-monument-valley-2-with-todd-baker).
- **Randomness inside it.** MV2's "randomised hang drum note" [src](https://www.audiokinetic.com/fr/blog/behind-the-beautiful-sound-of-monument-valley-2-with-todd-baker).
- **Pentatonic avoids half-step clashes** [src](https://violetrecording.com/the-pentatonic-scale-explained/).

The choice of D, and of minor pentatonic, is [est].

**The recommendation:**
- **Home is D**, as today: continuity with Murmur and Symbology, and Ruby has heard it.
- **Everything frequent, random or user-ordered** (detents, dice, undo, tab notes, sparkle) comes from **D minor pentatonic: D F G A C**. It has no half step and no tritone [calc].
- **Composed phrases** (drawers, arrivals, Summon's downbeat, the soft no) may use the full mode around it:
  - **D Dorian (D E F G A B C)**, a brighter "folk" minor;
  - or today's **D Aeolian (D E F G A B♭ C)**.

  Ruby picks by ear in the Studio. D minor pentatonic lies inside both.
- **Dissonance is kept for meaning.** The only half steps (E–F, and A–B♭ or B–C) belong to the asking and refusing sounds.
  - Murmur's soft no already steps down a half step [code].
  - Violet: "falling or dissonant pitch reads as negative" [src](https://violetrecording.com/how-to-design-ui-sounds/).
- **Why minor, and why Dorian over Aeolian** [est]:
  - The app is dark-first, Rosé and witchy (AGENTS.md §11). Minor pentatonic is open and suspended, not sad.
  - Dorian's B♮ makes phrases folk-magic rather than lament.
  - Changing Aeolian to Dorian changes only degree 5, which today is used only by `tab`'s fourth note (degree 12) [code]. The risk is low.
- **Why not Lydian:** its raised fourth is a tritone above home [calc]. It is good for one "wonder" sting [src](https://markslater.net/unlocking-the-power-of-the-lydian-mode/), wrong for a random layer.
- **Register (revised).** This was "A3–A5"; it is now raised by the phone-speaker sources (§1.3):
  - **Frequent sounds:** fundamentals **D4–D6 (294–1175 Hz)**.
  - **Rare sounds:** may add a layer down to **D3**, only on bodies with strong upper partials.
  - **Nothing below D3** (147 Hz) [est].
  - **In Murmur terms:**
    - Set the design `octave` to **+1**, so home is D4.
    - Raise `M_HIGH_HZ` from 1100 to **1200**, so D6 (1175 Hz) is not folded down onto D5. Today folding would make tab 1 and tab 5 the same note [calc].
    - Give the pad and bell an instrument octave of −1 where weight is wanted.
    - Then check on the Moto G's own speaker.

**The pentatonic ladder** (revised up an octave; used by detents, marks, reset and undo; 11 rungs) [calc]:

| Rung | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Note | D4 | F4 | G4 | A4 | C5 | D5 | F5 | G5 | A5 | C6 | D6 |
| Hz | 294 | 349 | 392 | 440 | 523 | 587 | 698 | 784 | 880 | 1047 | 1175 |

The ladder now starts and ends on home, D4 to D6, so the bottom and top of a knob both "rest". Lift rungs 0–2 by 2–3 dB (§3) [est].

**Meanings by direction:**
- **Rising** means open, on, show, redo, more.
- **Falling** means close, off, hide, undo, less.

Violet: rising is positive, falling negative [src](https://violetrecording.com/how-to-design-ui-sounds/). Journey uses falling for one's own call and rising for the companion's [src](https://www.gamedeveloper.com/audio/the-sound-design-of-i-journey-i-).
- Closing falls to a *suspended* chord, left unresolved [Ruby].
- **D (home)** means default, reset, done, rest. **A (the fifth)** means arrival and openness [est].

### 6.2 The map

**Loudness** is in dB relative to **Save done = 0 dB**, the loudest sound. It is compressed from the first pass's 0 to −23 dB to about **0 to −10 dB**:
- Brewster's 10–20 dB-above-threshold window, and intensity as "the main cause of annoyance" [src](https://www.dcs.gla.ac.uk/~stephen/earcon_guidelines.shtml);
- Violet's matched loudness [src](https://violetrecording.com/how-to-design-ui-sounds/);
- Windows' "slightly" louder and softer [src](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound).

Murmur's `level` per event is in brackets.

**Lengths** are the audible length:
- **Tier C:** 30–150 ms (Violet's taps).
- **Tier B:** ≤ 300 ms (Violet's "most interface cues").
- **Tier A:** ≤ 1 s (Windows), with ≤ 1.2 s for Save done.

**Tiers** are explained in §6.4. ✱ marks a new Murmur function.

| Interaction | Murmur function | Sound character | Musical role | Length | Loudness | Tier |
|---|---|---|---|---|---|---|
| **Knob passes a named mark, the default or an end** | `detent` (exists, plays `tick` today [code]), with the skin's `kind` passed through | wood tick, dry. An auditory icon (Gaver) | the ladder rung for the mark's position (up is up). The default's mark adds a quiet octave above. Only where the skin already buzzes [code: uiSkins.js]; no tick per dot | 40–60 ms | −8 dB (0.3); fast sweeps −11 dB | C |
| **Fader lands on a named mark** | ✱`mark` | kalimba pluck | the mark's own pentatonic note by index (like `tab`'s `index` kind [code]), with its fifth 15 ms later. Ticks swell over the last two marks before it [src](https://developer.android.com/develop/ui/views/haptics/haptics-principles) | 150–250 ms | −7 dB (0.35) | C |
| **End stop** | ✱`endStop` (from `kind === 'limit'` [code: uiSkins.js]) | knock, damped, with noise contact | at 0: D4 knock. At 100: A4 knock with a muted D5 tick. **Once per arrival**: it re-arms only after the value leaves the end by over 5% | 60–90 ms | −8 dB (0.4) | C |
| **Double-tap reset** | ✱`reset` | glass, two notes | **falls a fifth to home**: A5 → D5, 60 ms apart. Distinct from any detent, because exact home is hard to hit by hand [src](https://forum.ableton.com/viewtopic.php?p=1819410) | 250 ms | −6 dB (0.4) | B |
| **Switch on** | `checkbox` / ✱`switchOn` | kalimba, or the FM ping | **rises a fifth**: D5 → A5, 45 ms apart. This was a fourth; Violet: "a… perfect fifth moving upward feels like an answered question" [src](https://violetrecording.com/how-to-design-ui-sounds/) | 150–250 ms | −6 dB (0.38) | B |
| **Switch off** | ✱`switchOff` | kalimba, darker (`bright` −40%) | **falls**: A5 → D5, 45 ms apart. 1–2 dB quieter than on | 150–220 ms | −7 dB (0.33) | B |
| **Eye: show** | ✱`eyeShow` | struck glass, soft attack (12 ms) | one note, **F5**, with a breath of shimmer | 150–250 ms | −7 dB (0.3) | B |
| **Eye: hide** | ✱`eyeHide` | glass, damped quickly | **D5**, a third below the show note, decay halved | 100–180 ms | −8 dB (0.27) | B |
| **Tab change** | `tab` (exists, `index` kind; `null` in the map today) | glass | each tab its own note, left to right: **D5, F5, G5, A5, C6**. Today it is degrees 7, 9, 11, 12, 14 at D3–D4 [code] | 200–300 ms | −6 dB (0.33) | B |
| **Drawer / sheet open** | `cardOpen`, ✱`drawerOpen` | pad and glass | a **rising sus2** (D5 E5 A5), 40 ms apart [Ruby: "rising chords for opening"]. Folding `<details>` cards stay silent: too frequent [src](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound) | 300–400 ms | −6 dB (0.33) | B |
| **Drawer / sheet close** | `cardFold`, ✱`drawerClose` | pad | a **falling sus4**: A5 G5 D5 downward, *unresolved* [Ruby: "falling/suspended… for closing"] | 300–400 ms | −7 dB (0.3) | B |
| **Surface arrived** (from the menu or tiles) | ✱`surface` | a soft pad fifth and a celesta note | D4 + A4 pad, then celesta A5. Played **when the new surface is drawn**, not on the tap, because textures arrive from the worker [code: AGENTS.md §5.3]. Only the last of a run of quick changes [src](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound) | 400–600 ms | −4 dB (0.4) | A |
| **Dice, rerolls** (the seed moon, ⚄ dice, single-control rolls) | `reroll` (exists, `null` today) | a melodic tumble (§5.2) | 4–5 wood ticks on random rungs 4–8 (C5–A5), landing on **D5 or A5**. Random pitch is safe because it is pentatonic [calc]. *New Random Surface* plays `summonBackdrop` today [code: index.html]; point it here | 350–450 ms | −4 dB (0.4) | A |
| **Summon New Backdrop / Typeface** | `summonBackdrop`, `summonType` (exist: two glass notes, A3 → F3 today [calc]) | the spell: a **build**, then a **downbeat** [Ruby: "builds and downbeats"] | **On tap:** a rising pentatonic run D5 → D6 (5 notes, 35 ms apart), sparkle above. **On arrival:** pad D4 + A4, bell D5, glass A5. If the result arrives within 250 ms, play both as one phrase; if it is slow, the downbeat waits | 0.2 s + ≤ 0.8 s | −3 dB (0.45) | A |
| **Preset applied** | `preset` → `arrive` (exists) | pad chord and music box | D–A–E (an open add9) on pad at D4; music box D5, then A5 | ≤ 1 s | −3 dB (0.42) | A |
| **Save image done** | `saveImage` → `done` (exists) | tine and bell, ceremonial | tine A4 → D5 (a fifth up to home), then a bell D6 with its hum on D5: the one full resolution in the system. Played **when the JPEG is ready**; if the save takes over 1 s, one soft wood tick on the tap says "begun". A completion: "slightly louder" [src](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound) | ≤ 1.2 s | **0 dB** (0.5) | A |
| **Error** (a save failed, a load refused) | `hardNo` / `blocked` (exist), ✱`error` | pad and knock | **the half step**: F5 → E5 falling, on pad, over a knock on D4. The only rub in the system. Windows: errors "slightly louder… need not be significantly louder", never buzzing [src](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound). Once per 2 s at most | 300–400 ms | −2 dB (0.45) | A |
| **Lock** | `lock` → `tick` (exists) | a latch: two wood ticks | **closing downward**: D6, then A5, 25 ms apart. The drawn padlock and the sound on the same frame | 100 ms | −7 dB (0.33) | B |
| **Unlock** | `unlock` → `tick` (exists) | the same latch, opening | **upward**: A5, then D6, 25 ms apart | 100 ms | −7 dB (0.33) | B |
| **Undo** | `undo` (exists, `null` today) | a short kalimba note | **steps down the ladder**, one rung per undo from rung 8. Only the **first two** of a burst (undos under 400 ms apart) sound; the rest are silent until 1.5 s idle. Windows: "play a sound only on the first event", "not more than two times consecutively" [src](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound). Slow, deliberate undos still walk down the stair | 120–180 ms | −7 dB (0.3) | B |
| **Redo** | `redo` (exists, `null` today) | the same, a touch brighter | **steps up** from where undo left off, with the same burst rule | 120–180 ms | −7 dB (0.3) | B |
| **Nothing left to undo** | `nothingToUndo` → `blocked` (exists) | hollow knock, with contact | **D4**: the floor. It was D2 (73 Hz [calc]), likely inaudible on a phone | 80 ms | −6 dB (0.45) | A |

- **Already mapped and kept** [code]: `confirm` (the soft no), `hardNo`, `blocked`, the Athanor's machine sounds, keeping and spells. All of them rise by the octave change.
- **The four readings** (🜂🜄🜁🜃) could each take a tine note, as composed today (`fire`, `water`, `wind`, `earth`), in tier B.

### 6.3 Ducking, limits and ordering

- **Ducking.** While a tier A sound is sounding, tier B and C sounds within 400 ms are **dropped**, not layered. Windows warns that overlapping sounds "may collide with each other" [src](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound) [est].
- **Bursts.** For a run of the same function under 400 ms apart, play the first and at most one more [src](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound). Murmur's 40 ms limit [code] stays as the floor.
- **Detents.**
  - Keep a per-control "last mark", and play only when it changes.
  - Keep the skin's 50 ms limit [code]. Thin to every other mark when the hand is fast.
  - No sound during programmatic changes: presets, undo restoring a value, dice moving knobs. **A sound only for the hand that moved it** [est; Apple: "play only the audio that people explicitly initiate" [src](https://developer-mdn.apple.com/design/human-interface-guidelines/patterns/playing-audio)].
- **Bulk changes** (a preset sets 40 controls; undo restores many) play **one** sound for the action, never one per control [src](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound).
- **Voice budget.** Keep the 24 voices [code]. When full, drop tier C first.
- **Test on the Moto G's own speaker**, at Ruby's usual volume and in a quiet room at night. Violet: "Always audition your final cues on the cheapest playback you can find" [src](https://violetrecording.com/how-to-design-ui-sounds/).
  - **Measure first:** play a sine sweep of the ladder (D3 to D6) at one level, and note where it fades. If the floor sits higher than D4, raise the ladder again [est].
  - If a sound is noticed when nothing happened, or tires within ten uses, it is too loud or too long. Violet: a long cue "becomes grating after the tenth trigger" [src](https://violetrecording.com/how-to-design-ui-sounds/).

### 6.4 Tiers: what the switch in Esoterica turns on

This follows the platforms' separate toggles: iOS's Keyboard Feedback [src](https://support.apple.com/en-us/HT213404), macOS's "Play user interface sound effects" [src](https://support.apple.com/guide/mac-help/-mchl9777ee30/mac), and Android's Touch sounds [src](https://lg.com/us/mobile-phones/VS930/JB/Userguide/settings_sound.html). It also follows Windows' "Consider not assigning sounds to frequently occurring events by default" [src](https://learn.microsoft.com/en-us/windows/win32/uxguide/vis-sound), and Murmur's own "most settings are silent" [code].

| Tier | Contents | Default |
|---|---|---|
| **A: Moments** | done, error, summon, preset, surface arrived, dice, soft and hard no, blocked, nothing to undo | on, once Sounds is on |
| **B: Interface** | tabs, drawers, switches, eyes, locks, undo and redo, reset, readings | **off** (a second switch, "Interface sounds") |
| **C: Ticks under the finger** | knob marks, named marks, end stops | **off** (a third switch, "Ticks under the finger") |

The sub-switches are app preferences in localStorage, never in a look [code: AGENTS.md §5.4]. They need EXEMPT entries in `test/persistenceCoverage.test.mjs` and strings in `strings.js`, and they are drawn as switches, not checkboxes (AGENTS.md §11).

---

## 7. What Murmur would need (notes for the build, [est])

- **Register:**
  - `octave: 1` (home D4).
  - `M_HIGH_HZ` 1100 → **1200**, so D6 is not folded.
  - Instrument octave −1 on pad and bell where weight is wanted.
  - Raise `bright` on bodies that play below D4.
  - Measure the sweep on the Moto G (§6.3).
- **Wake:** add `pointerup` and `touchend` to the listeners that create and resume the context. On touch, those are the activating events [src](https://developer.mozilla.org/en-US/docs/Web/Security/User_activation).
- **Audio session:** `navigator.audioSession.type = 'ambient'` where it exists, before `new AudioContext()` [src](https://developer.mozilla.org/docs/Web/API/AudioSession/type).
- **A `value` event kind:** a ladder rung from a 0–1 value, for detents, marks and end stops: `murmur.play('detent', { value, kind })`. The skin's `haptic(kind)` should pass its kind through, so `limit` plays `endStop` [code: uiSkins.js].
- **A `walk` kind:** a rung kept in Murmur's state that steps up or down and resets after idle, for undo and redo.
- **A burst rule:** per function, the first two of a run under 400 ms; then silence until idle.
- **`random` within the snap set**, never repeating the last note, for dice and sparkle. This is the only pitch randomness, and it stays in key.
- **A noise source:** one shared buffer, for the contact of the wood tick and the knock.
- **Tiers** on `MURMUR_FUNCTIONS` (`tier: 'A' | 'B' | 'C'`), and a priority for ducking.
- **Idle:** suspend after about 10 s of silence. Play nothing while `document.hidden`.
- **Housekeeping** [code]:
  - Point *New Random Surface* (`randomSurfaceBtn`) at `reroll`, not `summonBackdrop`.
  - Correct the header's "never in pitch". Humanize detunes by ±3 × h/100 cents, which is inaudible but real. Either say so, or remove it.
  - Correct "five voices" to six.
- **The Murmur Studio** gets the new bodies (glockenspiel, celesta, music box, bowl, FM bell, harp pluck). Ruby shapes them by ear, as today.

---

## Gaps (sources this pass could not reach)

- **Material Design's sound pages** (m2.material.io/design/sound/applying-sound-to-ui.html, about-sound.html, sound-choreography.html). They render only with JavaScript, and the archived copy was refused. Material is cited through two secondary pages (§1.1).
  - A search for "Arun Vemuri" returned Material's "About sound" page, which suggests he is credited there, but that page could not be read. Nothing is attributed to him.
- **Wikipedia's Macintosh startup page**, for the tritone question (permission not granted in time). The CDM page records the doubt instead.
- **Stafford Bawler on Monument Valley 1's interactive audio.** Only the interview's introduction and a later process quote were reachable. MV2 and MV3 stand in.
- **Teenage Engineering's own writing on UI sound.** None was found; only the Nothing ear (1) audio credit and the OP-1 field review.
- **Kumar et al. 2012 full text** (PubMed Central showed a CAPTCHA). It is cited through Newcastle's press release and the TU Dresden record. The Cambridge *Journal of Mechanics* page (permission) was reached through its OUP copy.
- **Chrome on Android:** whether page audio uses the media stream and ignores silent and vibrate modes. It is inferred from Android's stream docs; test it on the Moto G.
- **The Safari version that shipped `navigator.audioSession`.** MDN's compatibility table did not come through. A WebKit bug shows it present on iOS 17.
- **FMOD's instrument docs** (the page was empty). Unity's docs stand in.
- **Struck, unconfirmed:**
  - Slack, Duolingo, Animal Crossing, Hades, Spiritfarer;
  - Sky's in-key instruments; the Mario coin's notes;
  - the "machine-gun effect" term; NI and ALPS encoder counts;
  - the DX7 tine attribution; wine-glass ratios of 2.3 and 4.2;
  - iOS's Lock Sound toggle; a picker *sound*.
