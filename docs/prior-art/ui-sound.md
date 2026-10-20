# Prior art: interface sound for Unfixable Vellum (the Murmur sound pass)

Key:
- **[src]** = stated in a source I opened and read this session, with its URL.
- **[code]** = read from this repository (murmur.js, AGENTS.md, docs/), with the file named.
- **[Ruby]** = Ruby's own words, from an earlier chat (the Symbology conversation, October 2026).
- **[calc]** = worked out here (the arithmetic is shown or can be re-run).
- **[mem]** = a fact I recall but could not verify this session. Treat it as **[est]** until a source is opened (see §8).
- **[est]** = my own judgment or inference.

Researched 2026-10-19.

## Read this first: what this research could and could not reach

This is a weaker doc than the prior-art rule (AGENTS.md §8 step 0) asks for, and here is why:
- **WebSearch was exhausted.** The web search budget for this turn was already used up when this research started (200 searches per turn, shared by every agent). Every query returned "budget is used up" and nothing else.
- **WebFetch accepts only URLs with provenance.** That means URLs found by a search or given by the person. These fetches were refused, so none of them was read:
  - `https://m2.material.io/design/sound/applying-sound-to-ui.html` (Material Design sound guidelines)
  - `https://developer.apple.com/design/human-interface-guidelines/playing-audio` (Apple HIG, audio)
  - `https://developer.mozilla.org/en-US/docs/Web/API/Navigator/audioSession` (the iOS audio session, which governs the mute switch)
  - `https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getAutoplayPolicy`
  - `https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/User_activation`
- **What I could read:** only pages whose URLs earlier research had already found (they are cited in docs/prior-art/synth-controls.md). Those cover haptics, detents and knobs, not sound design.
- **Consequence:**
  - §5 recipes: the physics in them is **[calc]**.
  - §6 map: this is design, so it is **[est]** by nature.
  - §1 and §2 practitioner and game history: mostly **[mem]**. That covers Material, Apple, Windows, Reekes, Monument Valley, Journey, Mini Metro, Rez and the rest.
- **To fix it:** §8 lists the exact searches to run in a follow-up pass. Every [mem] claim should be confirmed or struck before anything ships on its strength.
- **Unverified attribution:** I could not check who "Arun Vemuri" is. I recall nothing reliable linking that name to a UI sound project, so this doc attributes nothing to him.

---

## 0. What exists today, and what Ruby has asked for

### 0.1 Murmur as it stands [code: murmur.js, docs/ui-machinery.md]

- **A sound design is data** (`MURMUR_DESIGN`): a scale, a home octave, room, warmth, humanize, six instruments, named compositions, and a map from UI function to composition.
- **Instruments** are sums of sine partials taken from real bodies:
  - `bell`: church-bell partials 0.5, 1, 1.19, 1.5, 2, 2.66, 4.05.
  - `glass`: 1, 2.32, 4.25.
  - `tine`: 1, 6.27, 17.55, which is the cantilever beam (§5.1).
  - `bar`: 1, 3.99, 10.0, a tuned wooden bar.
  - `pad`: harmonics 1 to 4.
  - `sine`.
- **The mix:** every voice passes through a tanh "warmth" shaper, a 2.6 kHz low-pass, a small convolution room and a soft limiter.
- **Shimmer:** a twin partial 0.3 to 0.9 Hz away, so the sound beats slowly.
- **Drop:** a 3% pitch fall over 30 ms, for struck things.
- **Scale and register:** D Aeolian, with home at **D2** (`octave: -1`). Pitches are clamped to 55–1100 Hz. Pentatonic scales exist (`minorPent`, `majorPent`) as a *snap* of the seven steps.
- **Rate limit:** the same function repeated within 40 ms plays once. At most 24 voices sound at once.
- **Off until turned on.** The switch and volume are app preferences kept in localStorage, never in a look (AGENTS.md §5.4). The AudioContext is created and resumed only on a pointerdown, keydown or touchstart.
- **Current policy** (the comment above `MURMUR_DESIGN`): "very plain, in one minor key… and few." Sounds mark what takes a while, what changes a lot, and what needs Ruby: saving, a look arriving, keeping, the Athanor, the soft no, the hard no, and a hollow knock. **Most settings are silent.** In the map, `tab`, `cardOpen`, `cardFold`, `checkbox`, `select`, `reroll`, `undo` and `redo` are all `null`.
- **Where it is called:** uiLocks.js (lock, unlock, reroll), uiHistory.js (undo, redo, nothingToUndo), uiLook.js (preset, blocked, reroll), appEvents.js (saveImage, tab, readings, confirm, soundOn), uiGuard.js (confirm, hardNo).

### 0.2 What Ruby has said she wants

- From the Symbology chat, when the first Murmur was built **[Ruby]**: "falling/suspended chords for closing a menu, rising chords for opening one, turbulent chords for magic, builds and downbeats when they matter. Aim for soft, ethereal, melodic and mystical feeling. Ensure volume is always low."
- Now: "a sound pass: appropriate, not too annoying, melodic noises for appropriate effects (and please, do research prior art for that one)."
- The design language **[code: AGENTS.md §11]**: "A spell synthesizer, not a music one." The eye toggle is "my favorite one"; switches turn features on.

---

## 1. Principles of UI sound, from practitioners

### 1.1 What the platform guides say (mostly [mem]; verify, §8)

- **Material Design (Google, the 2019-era "Sound" section).** It sorts UI sound into kinds [mem]:
  - **hero sounds**, for rare, celebratory moments;
  - **alerts and notifications**;
  - **feedback**, for confirming a gesture;
  - ringtones and ambient sound.
- **What Material asks of those kinds** [mem]:
  - Use sound sparingly, for moments that matter.
  - Keep feedback sounds very short.
  - Make the sounds of a product a family, sharing a palette.
  - Never use sound as the only carrier of meaning.
- **Who made Google's sounds.** Conor O'Sullivan, as Google's Pixel sound lead, has written and spoken about designing the Pixel's sounds as one coherent, musical family [mem].
- **Apple HIG ("Playing audio").** Its points [mem]:
  - The **Ring/Silent switch** silences sound effects and other non-essential audio. Users expect an app to honour it.
  - System-style UI sounds should be quiet and short.
  - Interface sound is paired with haptics on iPhone.
  - iOS separates sound settings in Settings → Sounds & Haptics: **Keyboard Clicks** and **Lock Sound** each have their own toggle [mem].
- **macOS.** Its options are "Play user interface sound effects" and "Play feedback when volume is changed" [mem]. The volume key's "pop" plays *at the new volume*: the sound itself reports the value. That is prior art for the pitch-mapped detents in §3 [est].
- **Android.** Its separate toggles are "Touch sounds", "Screen locking sound" and "Dial pad tones" [mem]. Granular switches are the platform norm [est].
- **Windows.**
  - Brian Eno composed the Windows 95 startup sound; it is about 3¼ seconds long [mem].
  - Windows 11 shipped softer, calmer system sounds. Microsoft said they become gentler still in dark mode [mem].
  - Dark mode means softer sound: a direct precedent for a dark-first app [est].
- **Haptics, which the same teams design alongside sound.** Android's haptics principles say [src](https://developer.android.com/develop/ui/views/haptics/haptics-principles):
  - "We strongly recommend co-design of visual, audio, and haptic effects. Make it harmonious or congruent with visual animations and sound patterns."
  - "a haptic feedback that is played out of sync or that feels inconsistent with visual and audio effects can be a bit unsettling to the user."
  - "Haptic effects applied to very frequent events, like scrolling or moving a text handle, should be very subtle to provide a pleasant overall experience."
  - "effects that become stronger as the interaction reaches a target, for example gradually increasing the amplitude of a sequence of ticks with dragging, dropping or snapping actions."
- **The web-haptics guide.** It says to "Fire haptic at the exact instant the visual change occurs." It reserves its `selection` type for "picker scroll, stepper increment, slider detent, segment switch" [src](https://cdn.jsdelivr.net/gh/lochie/web-haptics@main/SKILL.md). The same rule holds for sound: one detent is one event, seen, heard and felt on the same frame [est, and synth-controls.md §6].

### 1.2 Designers and products named in the brief (all [mem]; verify)

- **Jim Reekes (Apple).**
  - He made the Macintosh startup chime of the early 1990s, a major chord, and the "Sosumi" alert [mem].
  - He has said the older startup sound was a tritone, the most unsettling interval. He wanted a "palate cleanser" instead: a consonant, calm chord to start the day on [mem].
  - The lesson: **consonance for routine, dissonance only where something is wrong** [est]. Murmur already does this with its soft no.
- **Facebook.** In the early 2010s, a small in-house team led by Will Littlejohn designed its in-app sounds: soft, short, wooden and organic, and optional [mem].
- **Slack.** Its "knock brush" notification is so familiar that it became a cultural shorthand. Slack revised its sound set later [mem]. The lesson [est]: a sound heard hundreds of times a day must be **short, low-mid, with a soft wooden attack**. Bright beeps would not do.
- **Duolingo.** Its correct-answer chime is a short, bright, rising sound. Wrong answers get a lower, duller one. Sound is part of the reward loop, and the sound effects can be turned off [mem].
- **Nintendo Switch.** The "click" heard as a Joy-Con snaps on became the console's sonic logo in its advertising [mem]. Switch menus use very short, soft, pitched blips [mem].
- **Teenage Engineering OP-1 and OP-Z.**
  - OP-Z's dials are "endless dials", and their values show as LED level, a neutral green at 50%, or colour segments [src](https://teenage.engineering/guides/op-z/interface-overview).
  - That guide says nothing about clicks or detents, and I could not confirm whether OP-1's encoders are detented. TE is cited here only for its playful, toy-like grammar of control (synth-controls.md §1.1).
- **Animal Crossing (New Horizons).** Its menus and NookPhone use soft, rounded, cheerful pitched blips [mem]. Villager speech, "Animalese", is synthesized babble: sped-up phonemes pitched per character [mem]. The background music changes every hour [mem]. The lesson [est]: a world can be *very* chatty in sound when every sound is round, quiet and pitched.
- **Hades (Supergiant).** Its menu and boon sounds were not researched. The one thing I recall: each god's boon has its own sonic identity, as "families" do in Symbology's Murmur v2 [mem]. Nothing more is claimed.
- **Spiritfarer.** Not researched. Nothing is claimed.

### 1.3 Why some sounds annoy

Psychoacoustics, all [mem] (textbook material: ISO 226 equal-loudness contours, roughness, temporal integration):
- **Frequency.**
  - The ear is most sensitive at about **2–5 kHz**. Energy there sounds louder and more piercing at the same level. Alarms live there on purpose.
  - Frequent UI sounds should keep their energy at about **300–1500 Hz**, with upper partials rolled off.
  - Murmur's 2.6 kHz low-pass already does this [code].
- **Phone speakers** reproduce almost nothing below about **300–500 Hz** [mem; worth measuring on the Moto G].
  - **This matters for Murmur.** Home is D2, at 73 Hz [code]. `glass` sits at the design octave, so the tab notes fall on D3–D4 (147–294 Hz) [calc: degreeMidi with `octave -1`].
  - Glass's upper partials are weak (0.06 and 0.015). On a phone speaker those notes may be nearly inaudible, or come out as a dull thump [est].
  - **Recommendation:** short, frequent sounds should have fundamentals at about **300 Hz or above**. Low notes should carry audible upper partials, as the bell and pad do.
  - Check this on the Moto G's own speaker, not on headphones (§6.3).
- **Loudness and length.** Perceived loudness grows with duration up to about 200 ms, through temporal integration. A 40 ms tick at the same peak sounds much quieter than a 1 s bell. Peaks must therefore be set per sound, by ear.
- **Attack.**
  - An instant attack (under about 2 ms) on a sine makes a click: a broadband transient.
  - A sharp attack reads as "alarm". A 3–15 ms attack reads as "touched".
  - Murmur already sets an attack floor of 3 ms [code].
- **Roughness and dissonance.** Two partials closer than a critical band beat at 20–150 Hz, which is heard as roughness. This is why a minor second or a tritone sounds tense. It is also why slow beating, at 0.3–2 Hz, sounds alive rather than rough. That slow beating is Murmur's shimmer [code].
- **Repetition fatigue.** In game audio, the identical sample fired again and again is called the **"machine-gun effect"** [mem]. The fixes are in §1.4.
- **Meaninglessness** [est]. People forgive a sound that tells them something. They resent one that decorates something they do a hundred times a day. Murmur's policy of "most settings are silent" [code] is the right instinct. A sound pass should *add tiers* (§6.4), not noise.

### 1.4 How designers keep repeated sounds pleasant

Game-audio practice [mem] (Wwise and FMOD both provide these as standard features):
- **Pitch variation.** A random ±1–3% (±20–50 cents) on each play.
  - For a *melodic* system, randomness in pitch breaks the key. So vary **level, timing and timbre**, and pick a *different in-key note* instead.
  - Murmur already varies only time and level: "never in pitch" [code].
- **Round-robin.** Cycle through 3 to 8 variants: never the same one twice in a row. In-key round-robin means stepping through pentatonic notes [est]. Symbology's Murmur v1 did this ("Never the same note twice in a row") [Ruby chat code].
- **Quantising to a scale.** Every random pitch comes from the key, as in §1.5.
- **Very short envelopes.** Frequent sounds get 30–120 ms. Rare ones get 0.6–2 s tails.
- **Ducking.** When a big sound plays (save, summon), the small ones under it drop by 6–10 dB, or are skipped.
- **Rate limiting.** A minimum interval per sound, a voice cap, and voice stealing (the oldest stops first).
  - Murmur has 40 ms per function and 24 voices [code].
  - For detents, the better rule is "**play the newest; drop the rest**", plus thinning when the hand moves fast (§3).
- **Rising amplitude to a target.** This is Android's haptic pattern ("gradually increasing the amplitude of a sequence of ticks") [src](https://developer.android.com/develop/ui/views/haptics/haptics-principles). It carries over to sound: ticks swell slightly as a fader nears a named mark [est].

### 1.5 Melodic systems: one key, so any sequence harmonizes (all [mem]; verify)

- **Rez (2001, Tetsuya Mizuguchi).** The player's lock-on and shot sounds are **quantised to the beat** of the track, and pitched to fit it. Playing *is* adding to the music. The idea was inspired by Kandinsky and synesthesia. *Tetris Effect* (2018) does the same: every rotation and drop makes a sound in the song's key.
- **Journey (2012, thatgamecompany; music by Austin Wintory).** The player's "call" or "chirp" is a pitched musical tone that fits the score. Two strangers calling to each other make a duet.
- **Sky: Children of the Light (thatgamecompany; music by Vincent Diamante).** It keeps the musical call. Players can also play instruments to each other, in key.
- **Monument Valley (ustwo; audio by Stafford Bawler).** Turning a crank, moving a platform or pressing a switch plays musical notes that belong to the level's music. The architecture is an instrument.
- **Mini Metro (Dinosaur Polo Club; audio by Disasterpeace, Rich Vreeland).** The score is **generative**. Each metro line is an instrument, stations and trains trigger notes, and the clock sets the tempo. The music *is* the player's network.
- **Super Mario's coin.** It is two notes a fourth apart (B to E): a tiny melodic interval that resolves, so it never tires [mem].
- **What all of them do** [est]:
  1. They fix **one key or mode** for everything that can overlap.
  2. They use a **pentatonic or modal subset** for anything the player triggers in uncontrolled order.
  3. They keep **dissonance as a signal**, never as decoration.
  4. Where rhythm matters, they quantise **time** as well.

  For an app, (1)–(3) are enough. Quantising UI sounds to a beat would delay feedback, and "synchronized with the visual" wins [src](https://cdn.jsdelivr.net/gh/lochie/web-haptics@main/SKILL.md).

---

## 2. Magical, mystical and "spell" palettes

### 2.1 The timbres, and what they say

All [mem], plus [est] for the "says" part.

| Timbre | Physical source | What it says | Where it is heard |
|---|---|---|---|
| **Chimes / tubular bells** | struck tubes, inharmonic | ceremony, time, a threshold | fantasy menus, "quest complete" stings |
| **Kalimba / mbira** | plucked steel tines (cantilevers) | intimate, hand-made, gentle magic | indie games, meditation apps |
| **Music box** | a steel comb (cantilevers) plucked by pins | memory, childhood, a spell wound up | menus, save points, lullaby cues |
| **Celesta** | hammered steel plates over resonators | sugar-plum sparkle, wonder | film fantasy (the "magic" theme of the *Harry Potter* films is on celesta [mem]) |
| **Glass (struck or rubbed)** | a wine glass, glass harmonica | fragile, uncanny, clarity | crystal and puzzle UIs |
| **Singing bowl** | a struck or bowed bowl, its mode pairs beating | meditation, ritual, the beginning of a practice | "breathe" and timer apps |
| **Harp glissando** | a fast scale run on plucked strings | transformation, "and then…", a dream dissolve | film and TV transitions; summoning |
| **Pads / choir** | sustained, slow-attack | presence, the numinous | menus, ambient beds |
| **Wooden bar / tick** | marimba-like, short | the hand; a physical, honest click | clocks, toggles, detents |

- **Fantasy UI conventions** [mem; general across JRPGs and fantasy RPGs]:
  - The menu cursor is a very short, soft blip.
  - Confirm is brighter and rises. Cancel is duller and falls. The page turn and inventory open are paper or cloth.
  - Spell casting is a rising build (sparkle, whoosh or gliss) and then a release (an impact or a chord) when the spell takes effect.
  - Item get and level up are short fanfares in the game's key. The save point is a bell or chime.
- This matches Ruby's request ("builds and downbeats when they matter") [Ruby].
- **How it applies to Vellum** [est]:
  - The **hand** (detents, ticks, end stops) gets wood and tine: honest and physical, quiet.
  - **Moving around** (tabs, drawers, eyes) gets glass and short tine: light, airy, no weight.
  - **Magic** (dice, Summon, a surface changing) gets a celesta or harp-like gliss, then a pad downbeat. Glass sparkle sits on top.
  - **Keeping** (save, a preset arriving) gets bell and tine: ceremony.
  - **Asking or refusing** gets the pad with a half step, and a knock. These already exist.
  - **Singing bowl**: one special sound, the "Sound on" greeting, or the Athanor opening. It is too long for anything frequent.

---

## 3. Knobs, faders and detents in sound

- **What a detent is.** "One or more physical click-stops which can be felt when a rotary control is moved." It is "typically used to identify the centre of a control such as a pan or EQ cut/boost knob, or to give the impression of preset positions on a gain control" [src](https://www.soundonsound.com/glossary/detent).
- **Hardware practice.**
  - Ableton Push's encoders are touch-sensitive. One user finds it "pretty difficult to dial the encoders exactly to 0% or reset a parameter back to default". The answer is "Press and hold Delete and tap the encoder" [src](https://forum.ableton.com/viewtopic.php?p=1819410). Continuous controls without detents make "exactly home" hard to hit. That is why Vellum's double-tap reset needs a clear, distinct sound [est].
  - TE OP-Z: "endless dials", with values shown by LED level [src](https://teenage.engineering/guides/op-z/interface-overview).
  - Moog's Model D app offers fine adjustment: "touch the representation of the wooden case while turning the knob" [src](https://www.soundonsound.com/node/4918957).
  - The common pattern [mem, broadly true of Native Instruments' Maschine and Komplete Kontrol, and of Push]: **parameter knobs are smooth and touch-sensitive**, and touching one shows its value. **Navigation and selection encoders are detented**, often with 20–24 clicks per turn, the count of common encoder parts such as ALPS EC11 [mem].
  - Detents mean "steps". Smooth means "continuous".
- **Software prior art.**
  - The iOS date and time picker wheel ticks once per row, with a sound and a haptic. Flung fast, the ticks blur into a soft rattle [mem].
  - The macOS volume "pop" plays at the new level [mem].
  - Web knob libraries such as webaudio-controls give `step` ("The 'value' is always rounded to multiple of 'step'"), `sensitivity` and a `valuetip`, but **no audible feedback** [src](https://github.com/webmusicdevelopersjp/webaudio-controls).
- **Should software knobs tick per detent?** [est]
  - **Stepped knobs and named marks** (Species, any slider with `names`): yes. One tick per step, because the step is the meaning.
  - **Continuous knobs:** no tick per value unit.
    - At most, a whisper of a tick at the **drawn tick dots**: the 11 dots at 10% steps proposed in synth-controls.md §5.
    - A distinct **"home" tick** when the value crosses its default: the virtual centre detent, in SOS's sense.
    - These belong to the "Detent ticks" tier, which is off by default (§6.4).
  - **Rate:**
    - Play the newest detent and drop any that arrive less than 45 ms after the last.
    - When the hand moves faster than about 15 detents a second, play every other one, 3 dB quieter. The picker-wheel rattle is the model.
    - This matches the haptic limit of about 50 ms in synth-controls.md §4.3.
  - **The tick, the visual dot and the haptic** fire on the same frame, as one event [src](https://cdn.jsdelivr.net/gh/lochie/web-haptics@main/SKILL.md).
- **Pitch mapping** [mem + est]:
  - Sonification research finds that most listeners expect **positive polarity**: a higher value is a higher pitch. Bruce Walker's polarity studies found exceptions for some dimensions, such as size, where bigger can mean lower [mem].
  - For an interface, **consistency beats per-dimension polarity**. Every Vellum knob should map up to up [est].
  - Map the drawn dots onto the **pentatonic ladder** (§6.1). Sweeping a knob then plays a little harp run under the finger: Monument Valley's idea in a slider [est].
  - Lower notes sound quieter at equal level (equal-loudness). Lift the bottom of the ladder about 2–3 dB relative to the top [est].

---

## 4. Accessibility and etiquette

- **Off by default.** Murmur already is [code]. Keep it so [est]. People with hyperacusis, misophonia or sensory sensitivity, or anyone in a quiet room or on a bus, should never be surprised. Turning sound on plays one gentle greeting (`soundOn` → `arrive`) [code], so the person hears what they enabled.
- **Never on page load.**
  - Browsers' autoplay policies start an AudioContext made without a user gesture as `suspended`. It can only `resume()` after an activating gesture, and the gesture must be a real one such as pointerdown, keydown or touch [mem; the MDN pages that say so were blocked, see the top].
  - Murmur creates and resumes its context only in a gesture handler, and plays only on events [code].
  - The etiquette rule is stronger than the browser rule [est]. Even after a gesture, **no sound should play for something the person did not just do**: a texture finishing in the worker, a draft restoring, a service-worker update. Exception: a long job the person started and is waiting on, such as Save image.
  - Play nothing while `document.hidden` [est].
- **iOS and the Ring/Silent switch** [mem; verify, §8]:
  - In current iOS Safari, a page that only uses Web Audio is treated as *ambient* audio. It is muted by the silent switch and mixes with other audio.
  - Pages that play `<audio>` or `<video>` media get *playback* behaviour: they ignore the switch, and can pause the person's music.
  - Older iOS versions behaved differently. The npm package `unmute-ios-audio` existed to *defeat* the switch, which is the opposite of what Vellum wants.
  - Safari added `navigator.audioSession.type`, with values including `"ambient"`, `"playback"`, `"transient"`, `"transient-solo"` and `"auto"`.
  - **Recommendation [est]:** where it exists, set `navigator.audioSession.type = 'ambient'` before creating the context. This states the intent: obey the silent switch, and never interrupt the person's own music. Never play a media element for UI sound.
- **Android (Ruby's baseline phone)** [mem]:
  - Chrome on Android plays Web Audio on the **media** stream. The ringer's silent or vibrate mode does **not** mute it; only media volume does.
  - So on Ruby's Moto G, **Vellum's own switch is the real control**, and the default-off matters more there than on iOS [est].
- **Reduced motion as a proxy.**
  - As far as I know there is **no standard media query for sound** (nothing like "prefers-reduced-sound") [mem].
  - `prefers-reduced-motion` says something about sensory load, not about hearing. It should not switch sound off by itself [est].
  - A soft use is fair [est]: when reduced motion is set *and* sound is on, skip the **ornaments**. Ornaments are glissandi, shimmer and tails over 600 ms. Functional sounds stay.
- **Volume.**
  - The slider should be perceptual: gain = v², or a dB scale from −40 to 0 dB [mem; common practice]. A linear gain bunches all the audible change into the bottom of the slider.
  - Keep Murmur's limiter [code]. The loudest sound (Save done) should sit about 6 dB under where a phone's own notification sounds would sit, by ear [est].
- **Sound is never the only signal.** Every sound has a visual twin: a toast, a state change or a glyph [mem: WCAG 1.3.3 Sensory Characteristics]. WCAG 1.4.2 Audio Control applies only to audio that plays automatically for over 3 seconds [mem], which Murmur never does.
- **Screen readers** [est]:
  - A web page cannot detect a screen reader, and a long sound masks speech.
  - Keep frequent sounds under about 150 ms, and let the person mute each tier.
- **Power** [est]: suspend the AudioContext after about 10 s with no sound (`ctx.suspend()`), and resume on the next gesture. An idle running context keeps the audio hardware awake on phones.

---

## 5. Web Audio synthesis recipes

### 5.1 The physics of struck and plucked bodies [calc]

- **A free–free bar** (glockenspiel, an untuned marimba or xylophone bar). Its modes come from the roots of cos x · cosh x = 1. The ratios are **1 : 2.757 : 5.404 : 8.933**.
  - The brief's "kalimba: sine at f plus partial at 2.76·f" is therefore a *glockenspiel bar*, not a kalimba.
- **A clamped–free bar** (cantilever: kalimba tine, music-box tooth). Its modes come from cos x · cosh x = −1. The ratios are **1 : 6.267 : 17.547 : 34.386**.
  - Murmur's `tine` (1, 6.27, 17.55) is exactly this [code].
- **Tuned bars.** Marimba bars are undercut so the 2nd mode is **4×** (two octaves). Xylophone bars are tuned to **3×** (a twelfth) [mem]. Murmur's `bar` (1, 3.99, 10.0) is a tuned marimba bar [code].
- **Church bell partials** (hum, prime, tierce, quint, nominal): about **0.5, 1, 1.2, 1.5, 2**, with the tierce a *minor* third [mem]. Murmur's `bell` has these [code]. The minor tierce is why bells sit well in a minor mode.
- **Singing bowl.** Its modes run roughly **1 : 2.7 : 5.1 : 8.4** [mem, approximate; bowls vary widely]. Each mode is a *pair* a fraction of a hertz to a few hertz apart, because no bowl is perfectly round. That pairing is the bowl's slow "wah" beating, which is Murmur's shimmer [code].
- **Wine glass.** Its upper modes fall near **2.3× and 4.2×** [mem]. Murmur's `glass` uses 2.32 and 4.25 [code].
- **FM bell** (John Chowning's 1973 FM paper) [mem]:
  - An inharmonic carrier-to-modulator ratio such as **1 : 1.4** gives bell spectra.
  - The modulation index decays *with* the amplitude, so the bell starts bright and mellows.
  - The DX7-style electric piano adds a high-ratio modulator (about **1 : 14**) whose index dies in about 40 ms. That gives the "tine" ping on the attack.

### 5.2 Recipes

Parameters are for Web Audio. Each is cheap: 1 to 6 `OscillatorNode`s and a `GainNode` each, made per note and released afterwards, the way Murmur already does it [code]. Levels are relative, before Murmur's master and limiter. All values are [est], from the physics above, and need tuning by ear in the Murmur Studio.

- **Wood tick** (detents, lock latch)
  - **Tone:** a sine at f (A3–A5). Partials 3.99× at 0.10 and 10× at 0.02. Attack 2–3 ms; exponential decay **35–60 ms**.
  - **Pitch:** a fall from 1.03·f to f over 25 ms, Murmur's `drop` [code].
  - **Noise:** add a 4 ms **noise burst** through a band-pass at 2·f (Q 3–4), at 0.15 of the tone's level. It gives the "contact" of wood.
  - **Cost:** Murmur has no noise source, so make one 0.1 s noise `AudioBuffer` once and reuse it through `AudioBufferSourceNode`s.
- **Kalimba pluck** (switch on, fader mark)
  - **Body:** cantilever partials **1 (1.0), 6.267 (0.06), 17.55 (0.01)**.
  - **Envelope:** attack 3–4 ms. The fundamental decays over **0.5–0.9 s**; the partials die at 0.3× and 0.1× of that.
  - **Pitch:** drop 1.01→1 over 20 ms.
  - Murmur's `tine` is this body [code].
- **Glockenspiel / celesta** (sparkle, gliss notes, tab notes)
  - **Glockenspiel:** a free–free bar, partials **1 (1.0), 2.757 (0.18), 5.404 (0.05)**. Attack 2 ms; decay 0.8–1.5 s; the upper partials decay at 0.4× and 0.2× of the fundamental's.
  - **Celesta:** the same struck attack, but nearly pure. The partials are 1 (1.0) and 4 (0.04), since its plates are tuned and the resonator favours the fundamental [mem]. Decay 0.6–1.0 s.
- **Music box** (Keeping, preset tiles)
  - **Body:** the cantilever (as kalimba), up an octave (D5–A5).
  - **Envelope:** a shorter decay, 0.35–0.6 s.
  - **Variation:** a very slight random level (±1.5 dB) and timing (±6 ms) on each note: humanize, never pitch.
- **Struck glass** (eyes, tabs, summon sparkle)
  - **Body:** partials **1 (1.0), 2.32 (0.06–0.15), 4.25 (0.02)**.
  - **Envelope:** attack 8–15 ms, rounder than a bell's. Decay 0.4–0.8 s.
  - **Shimmer:** a twin of each partial +0.4–0.9 Hz at 0.05 [code].
- **Singing bowl** (the "Sound on" greeting; the Athanor opening)
  - **Struck:** partials **1 (1.0), 2.7 (0.45), 5.1 (0.2), 8.4 (0.08)**, each with a twin 0.5–3 Hz away at 0.3. Attack 3 ms; the fundamental decays over **2.5–4 s**; the upper partials over 0.6×, 0.4× and 0.25× of that.
  - **Bowed** (rubbed): the same partials with an **attack of 0.4–0.8 s**. A slow amplitude LFO at 0.3–0.7 Hz, depth 0.15, then release over 1.5 s.
  - **Use:** rarely. It is the longest sound in the set.
- **FM bell** (Save done, as an alternative to the additive bell)
  - **Patch:** a carrier sine at f, and a modulator sine at **1.4·f**. The modulator goes into the carrier's `frequency` through a gain of `index × 1.4·f`.
  - **Index:** from **3 to 0.2** over the decay, by an exponential ramp.
  - **Amplitude:** attack 3 ms, exponential decay **1.2–2 s**.
  - **Cost:** two oscillators for a whole bell.
- **FM tine "ping"** (a brighter switch-on)
  - **Patch:** a carrier at f, with a modulator at **14·f**, index **1.5 → 0 in 40 ms**.
  - **Amplitude:** decays over 0.6 s.
  - **Effect:** the ping lives only in the first 40 ms, so it reads as "bright" without a bright tail to tire of.
- **Harp-like pluck and glissando** (Summon, dice landing)
  - **Pluck:** harmonics **1, 2, 3, 4** at **1.0, 0.45, 0.22, 0.10**, each decaying faster with height (decay shares 1, 0.6, 0.4, 0.25). Attack 3 ms; decay 0.6–1.0 s.
  - **Brightness:** optionally a low-pass from 4 kHz down to 1.2 kHz over 150 ms, so the pluck darkens as a string does.
  - **Glissando:** 5–8 pentatonic notes, **25–40 ms apart**, rising.
    - Level ramps up about 1 dB per note.
    - The last note is held 1.5× longer.
    - The whole run lasts 150–300 ms.
- **Pad / breath** (open, arrive, soft no)
  - **Tone:** two sines at f, detuned ±4–6 cents, plus harmonics 2 and 3 at 0.14 and 0.05.
  - **Envelope:** attack **120–200 ms**, a short hold, then release **0.6–1.0 s**.
  - **Filter:** a low-pass at about 1.2 kHz.
  - Murmur's `pad` [code].
- **Knock** (end stop, blocked, hard no)
  - **Tone:** a sine at f (D3–A3) with a pitch drop from **1.6·f to f in 20 ms**. Decay **60–90 ms**.
  - **Noise:** a 3 ms noise burst, band-passed at 600 Hz with Q 2, at 0.2.
  - Murmur's `thud` [code], plus the noise.
- **Dice roll, made melodic** (New Random Surface)
  - **The tumble:** 4–5 wood ticks at random **pentatonic** pitches (never the same twice in a row). The gaps grow by about ×1.35: **40, 55, 75, 100 ms**, like a die settling. Levels fall about 1.5 dB each.
  - **The landing:** after the last tick, one glockenspiel note on the "landed" degree.
  - **Total:** about 350–450 ms.
  - There is no noise rattle, which keeps it music.
- **Sparkle** (an ornament over Summon)
  - **Tone:** 3–5 glass notes in the top octave (A5–C6, clamped at 1100 Hz [code]). Each is very quiet (−20 dB), at random times within 250 ms, with random pentatonic pitches.
  - **Reduced motion:** dropped when reduced motion is set (§4).

---

## 6. A proposed sound map for Vellum

### 6.1 The key: D, with two layers [est]

**Recommendation:**
- **Home is D**, as today. It keeps continuity with Murmur and Symbology, and Ruby has heard it.
- **Everything frequent, random or user-ordered** (detents, dice, undo walks, tab notes, sparkles) is drawn from **D minor pentatonic: D F G A C**.
- **Composed phrases** (drawers, arrivals, Summon's downbeat, the soft no) may use the full mode around it: **D Dorian (D E F G A B C)** for a brighter "spell" minor, or today's **D Aeolian (D E F G A B♭ C)**. Ruby picks by ear in the Studio.

Why:
- **Pentatonic cannot clash.** It has no half steps and no tritone, so any order, any overlap, any speed of a knob sweep is consonant [mem: the standard reason games and toys use it]. This is the Mini Metro and Monument Valley property, which an app needs because people trigger sounds in any order.
- **D minor pentatonic lies inside both D Dorian and D Aeolian.** Phrases in either mode always agree with the frequent layer.
- **Dissonance is saved as meaning.** The only half steps in the system (E–F, and A–B♭ or B–C) belong to the **asking and refusing sounds**. Murmur's soft no already steps down a half step, from degree 2 to degree 1 [code]. Routine sounds are consonant; "something needs you" is the one rub, as Reekes did with the startup chord [mem].
- **Why minor, and why Dorian over Aeolian** [est]:
  - The app is dark-first, Rosé and witchy (AGENTS.md §11). Minor pentatonic is open and "suspended", not sad.
  - Dorian's raised sixth (B♮) makes the full-mode phrases sound like folk magic rather than lament.
  - Switching Aeolian to Dorian changes only degree 5 and 12 notes. In today's compositions that is only the `tab` composition's fourth note (degree 12) [code]. The risk is low.
- **Why not D Lydian** [est]:
  - Lydian's signature is the raised fourth (G♯), a **tritone above home**. Every random run through Lydian would sound that tritone against the root.
  - Lydian is the film scorer's "wonder" mode, bright and major [mem], which is at odds with Vellum's dusk.
  - Good for one sting; wrong for a system.
- **Register** (see §1.3, phone speakers):
  - Frequent sounds: fundamentals **A3–A5 (220–880 Hz)**.
  - Rare big sounds: these may reach down to **D3** for a downbeat, but must carry audible partials.
  - Nothing goes over 1100 Hz [code].
  - Suggest raising the design `octave` to 0 (home D3), or raising the instrument octaves of `glass` and `tine` by +1. Then check on the Moto G's speaker.

**The pentatonic ladder** (used by detents, faders and undo walks; 11 rungs for the 11 drawn dots) [calc]:

| Rung | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Note | A3 | C4 | D4 | F4 | G4 | A4 | C5 | D5 | F5 | G5 | A5 |
| Hz | 220 | 262 | 294 | 349 | 392 | 440 | 523 | 587 | 698 | 784 | 880 |

**Meanings by direction** [Ruby, and est]:
- **Rising** means open, on, show, redo, more.
- **Falling** means close, off, hide, undo, less. Closing falls to a *suspended* chord, left unresolved [Ruby].
- **D (home)** means default, reset, done, rest.
- **A (the fifth)** means arrival, openness.

### 6.2 The map

Loudness is in dB relative to **Save done = 0 dB**, the loudest sound. Murmur's `level` per event is in brackets. Lengths include the tail. Tiers are explained in §6.4.

| Interaction | Murmur function (new: ✱) | Sound character | Musical role | Length | Loudness | Tier |
|---|---|---|---|---|---|---|
| **Knob detent tick** | ✱`detent` | wood tick, dry | the ladder rung for the dot crossed (higher value, higher rung). The default's dot adds a quiet octave above: the "home" detent | 40–60 ms | −20 dB (0.25); fast sweeps −23 dB | C |
| **Fader lands on a named mark** | ✱`mark` | kalimba pluck, a hint of glass | the mark's own pentatonic note by index (like `tab`'s `index` kind [code]) plus its fifth, 15 ms apart. Ticks swell slightly over the last two rungs before a mark (Android's rising-to-target [src](https://developer.android.com/develop/ui/views/haptics/haptics-principles)) | 200–350 ms | −14 dB (0.4) | C |
| **Reaching the end stop** | ✱`endStop` | knock, damped, no tail | at 0: low D3 knock. At 100: a knock on A3 plus a muted D4 tick. **Once per arrival**: it re-arms only after the value leaves the end by over 5% | 60–90 ms | −16 dB (0.5) | C |
| **Double-tap reset** | ✱`reset` | glass, two notes | **falls a fifth to home**: A4→D4, 60 ms apart. "Back to where it began." Distinct from every detent, because exact home is hard to hit by hand ([src](https://forum.ableton.com/viewtopic.php?p=1819410)) | 300 ms | −12 dB (0.45) | B |
| **Switch on** | `checkbox`, or ✱`switchOn` | kalimba or FM-tine ping | **rises a fourth**: A4→D5, 45 ms apart | 250 ms | −15 dB (0.4) | B |
| **Switch off** | ✱`switchOff` | kalimba, darker (`bright` −40%) | **falls**: D5→A4, 45 ms apart. 2 dB quieter than on: off is the lesser event | 220 ms | −17 dB (0.33) | B |
| **Eye: show** | ✱`eyeShow` | struck glass, soft attack (12 ms): an opening | one note, **F5** (the minor third above D5, warm), with a breath of shimmer | 300 ms | −18 dB (0.3) | B |
| **Eye: hide** | ✱`eyeHide` | glass, damped quickly | **C5**, a step below the show note, decay halved | 180 ms | −20 dB (0.25) | B |
| **Tab change** | `tab` (exists, `index` kind) | glass | each tab its own note: today degrees 7, 9, 11, 12, 14 [code]. Proposed pentatonic: **D4, F4, A4, C5, D5** (Inscription to Esoterica, low to high, so the tabs make a scale left to right) | 300–400 ms | −16 dB (0.35) | B |
| **Drawer / sheet open** | `cardOpen`, ✱`drawerOpen` | pad and glass | a **rising sus2** (D–E–A), arpeggiated 50 ms apart, with a glass A5 on top [Ruby: "rising chords for opening"]. Folding `<details>` cards stay silent: too frequent | 450–600 ms | −15 dB (0.35) | B |
| **Drawer / sheet close** | `cardFold`, ✱`drawerClose` | pad | a **falling sus4**: A–G–D downward, *left unresolved* (the G never falls to F♯ or F) [Ruby: "falling/suspended… for closing"] | 400–500 ms | −17 dB (0.3) | B |
| **Surface changed** (chosen from the menu or tiles) | ✱`surface` | a soft pad fifth and a celesta note | D3+A3 pad, then celesta A4. Like `arrive`, but lighter. Play it **when the new surface is drawn**, not on the tap: textures arrive from the worker [code: AGENTS.md §5.3] | 600–800 ms | −12 dB (0.4) | A |
| **New Random Surface** (dice) | `reroll` (exists, `null` today) | a melodic dice tumble (§5.2) | 4–5 wood ticks on random pentatonic rungs (5–9), gaps 40/55/75/100 ms, landing on a glockenspiel note **D5 or A4**. Random pitch is safe because it is pentatonic | 350–450 ms | −13 dB (0.4) | A |
| **Summon New Backdrop** | `summonBackdrop` (exists: two glass notes) | the spell: a harp/celesta **build**, then a **downbeat** [Ruby: "turbulent chords for magic, builds and downbeats"] | **On tap:** a rising pentatonic gliss D4→D5 (6 notes, 30 ms apart), sparkle above. **On arrival:** a pad D3+A3 with a bell D4 and a glass A5. If the backdrop arrives within 250 ms, play both as one phrase; if it is slow, the downbeat waits for it | 0.3 s + 1.0–1.4 s | −8 dB (0.5) | A |
| **Preset applied** | `preset` → `arrive` (exists) | pad chord and music-box | D–A–E (an add9, open) on pad; music-box D5 then A5 | 0.9–1.2 s | −8 dB (0.45) | A |
| **Save image / export done** | `saveImage` → `done` (exists) | tine and bell, ceremonial | tine A→D (fifth up to home), then a **bell D two octaves up**: the one full resolution in the system. Play it **when the JPEG is ready**. If the save takes over 1 s, one soft wood tick on the tap says "begun" | 1.2–2.0 s | **0 dB** (0.5–0.6) | A |
| **Error** (a save failed, a load refused) | `hardNo` / `blocked` (exist), ✱`error` | pad and knock | **the half step**: F→E falling, on pad, over a low knock on D3. The only rub in the system. Never higher or louder than done. Once per 2 s at most | 400–500 ms | −10 dB (0.45) | A |
| **Lock** | `lock` → `tick` (exists) | a latch: two wood ticks | **closing downward**: D5 then A4, 25 ms apart, like a clasp shutting. Drawn padlock and sound on the same frame | 120 ms | −17 dB (0.35) | B |
| **Unlock** | `unlock` → `tick` (exists) | the same latch, opening | **upward**: A4 then D5, 25 ms apart, a touch brighter | 120 ms | −17 dB (0.35) | B |
| **Undo** | `undo` (exists, `null` today) | a short kalimba note | **walks down the ladder**: each undo steps one rung down from the last (rungs 9→0, then holds). The walk resets to rung 9 after 1.5 s idle. Repeated undos sound like going back down a stair | 150–200 ms | −17 dB (0.33) | B |
| **Redo** | `redo` (exists, `null` today) | the same, a touch brighter | **walks up** from wherever undo left off | 150–200 ms | −17 dB (0.33) | B |
| **Nothing left to undo** | `nothingToUndo` → `blocked` (exists) | hollow knock | D3: the floor | 80 ms | −16 dB (0.5) | A |

Already mapped and kept as they are [code]: `confirm` (the soft no), `hardNo`, `blocked`, the Athanor's machine sounds, keeping and spells. The four readings (🜂🜄🜁🜃) could each take a tine note, as composed today (`fire`, `water`, `wind`, `earth`), in tier B.

### 6.3 Ducking, limits and ordering [est]

- **Ducking.** While a tier A sound is sounding (done, summon, preset), tier B and C sounds within 400 ms are dropped, not layered.
- **Detents.**
  - Keep a per-control "last rung". Play only when the rung changes, and only the newest.
  - Ignore detents less than 45 ms after the last. Thin to every other detent when the hand is moving fast.
  - No sound during programmatic changes: presets, undo restoring a value, dice moving knobs. **A sound only for the hand that moved it.**
- **Bulk changes** (a preset sets 40 controls; undo restores many) play **one** sound for the action, never one per control.
- **Voice budget.** Keep the 24 voices [code]. When full, steal the oldest tier C voice first.
- **Test on the Moto G's own speaker** at Ruby's usual volume, and in a quiet room at night. If a sound is noticed when nothing happened, or tires within ten uses, it is too loud or too long.

### 6.4 Tiers: what the switch in Esoterica turns on

This follows the platforms' practice of separate toggles (iOS's Keyboard Clicks and Lock Sound; Android's Touch sounds) [mem], and Murmur's own "most settings are silent" policy [code].

| Tier | Contents | Default |
|---|---|---|
| **A: Moments** | done, error, summon, preset, surface arrived, dice, soft and hard no, blocked | on, once Sounds is on |
| **B: Interface** | tabs, drawers, switches, eyes, locks, undo and redo, reset, readings | **off** (a second switch, "Interface sounds") |
| **C: Detent ticks** | knob detents, named marks, end stops | **off** (a third switch, "Ticks under the finger") |

The sub-switches are app preferences in localStorage, never in a look [code: AGENTS.md §5.4]. They need EXEMPT entries in `test/persistenceCoverage.test.mjs` and strings in `strings.js`, and they are drawn as switches, not checkboxes (AGENTS.md §11).

---

## 7. What Murmur would need (notes for the build, [est])

- **A `value` event kind**: a ladder rung from a 0–1 value, for detents, marks and end stops. Call it as `murmur.play('detent', { value })`.
- **A `walk` kind**: a rung kept in Murmur's state that steps up or down and resets after idle, for undo and redo.
- **`random` within the snap set**, never repeating the last note, for dice and sparkle. This is the only pitch randomness, and it stays in key.
- **A noise source**: one shared buffer, for the wood-tick and knock contact transients.
- **Tiers** on `MURMUR_FUNCTIONS` (`tier: 'A' | 'B' | 'C'`), and a priority for ducking.
- **The audio session**: `navigator.audioSession.type = 'ambient'` where it exists, set before `new AudioContext()`.
- **Idle**: suspend after about 10 s of silence. Play nothing while `document.hidden`.
- **The Murmur Studio** gets the new instruments (glockenspiel, celesta, music box, bowl, FM bell, harp pluck) as bodies. Then Ruby shapes them by ear, as today.

---

## 8. To verify in a follow-up pass (the searches this pass could not make)

Run these, open the sources, and turn each [mem] above into [src] or delete it:
1. "Material Design sound" guidelines (m2.material.io/design/sound): the categories and the wording on hero sounds and on sparing use.
2. Apple HIG "Playing audio" and "Playing haptics": the silent switch and sound effects.
3. WebKit or MDN on `navigator.audioSession`: the type values, which Safari version shipped it, and whether `ambient` obeys the silent switch. Also current behaviour for Web Audio under the silent switch on iOS 17, 18 and 26.
4. Chrome's autoplay policy for Web Audio (developer.chrome.com blog), and MDN's user-activation page: which events activate.
5. Chrome on Android: does Web Audio follow the media stream, and is it heard in silent or vibrate mode?
6. Jim Reekes on the startup chime: the tritone story, the chord and the "palate cleanser" quote.
7. Windows 11 sounds: Microsoft's own post on calmer sounds and the dark-mode variants. Eno's Windows 95 sound.
8. Conor O'Sullivan (Google) on Pixel sound design. Will Littlejohn on Facebook's sounds. Slack's sound redesign, and who made it.
9. "Arun Vemuri": who he is and what he wrote, if anything, on UI sound.
10. Stafford Bawler on Monument Valley's interactive audio. Disasterpeace on Mini Metro's generative score. Austin Wintory and Steve Johnson on Journey's call. Vincent Diamante on Sky. Mizuguchi on Rez's quantisation.
11. Game-audio practice on the "machine-gun effect", round-robin and pitch randomisation (Wwise and FMOD docs, GDC audio talks).
12. Bruce Walker's polarity studies (pitch mapping in sonification).
13. Singing-bowl and wine-glass mode ratios (Fletcher & Rossing, or acoustics papers). The celesta's spectrum.
14. Whether TE OP-1 and Native Instruments encoders are detented. The iOS picker's tick sound.
15. Animal Crossing, Hades and Spiritfarer: menu and UI sound design, from talks or interviews.
