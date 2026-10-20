# Prior art: the Moving Image (a page as a short film, made in the browser)

Key: **[src](URL)** = read in that source for this doc. **[est]** = my own estimate or inference (arithmetic shown where there is some). Researched 2026-10-20 by searching and opening each source; what could not be opened is under **Gaps** at the end.

## Summary

- **WebCodecs does the encoding and nothing else.** It hands back encoded chunks, a key flag and (for H.264) the codec setup; putting them in a file is the page's job [src](https://developer.chrome.com/docs/web-platform/best-practices/webcodecs?authuser=7). So a small muxer of our own is the normal shape of this work, not a workaround [src](https://cuberoot.me/dev/algorithms/webcodecs).
- **The encoder makes no B-frames**, so decode order is presentation order and one steady time-to-sample table is enough [src](https://npmjs.com/package/mp4-muxer).
- **Size sets the H.264 level.** 1920×1080 at 30 fps just fits level 4.0, and the page's own size may not [src](https://ffmpeg.org/doxygen/6.1/h264__levels_8c_source.html) [est].
- **Support in 2026:** Chrome and Edge since 94, Firefox desktop since 130 (not Android), Safari partial from 16.4 and full from 26 [src](https://caniuse.com/webcodecs) [src](https://caniuse.com/mdn-api_videoencoder).
- **A loop closes when frame n would be frame 0.** The film holds frames 0 to n−1 and never draws the repeat [src](https://www.provideocoalition.com/dmoe8_loop/) [src](https://tproger.ru/translations/drawing-loopy-gifs-from-noise-in-processing).
- **What others record is a screen; we render.** CCapture fakes the clock so a slow sketch films at a steady rate [src](https://cdn.jsdelivr.net/gh/spite/ccapture.js@1.0.9/README.md). Our renderer is already offline, so every frame is exact by construction [est].

## 1. WebCodecs VideoEncoder

**Configuration**
- The config takes:
  - codec (required) and width, height;
  - bitrate (bits per second) and framerate;
  - hardwareAcceleration ("no-preference", "prefer-hardware", "prefer-software");
  - alpha ("discard" by default);
  - bitrateMode ("variable" by default, "constant", or "quantizer", where the per-frame quantizer in the encode options decides);
  - latencyMode ("quality" by default; "realtime" may drop frames to keep the frame rate) [src](https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder/configure).
- Offline rendering wants latencyMode "quality" and bitrateMode "variable", which are the defaults [est].

**Codec strings: H.264**
- WebCodecs needs fully specified strings, never bare "h264" or "vp9" [src](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API/Codec_selection).
- H.264 is "avc1." followed by three hex bytes, per RFC 6381 and ISO 14496-15 [src](https://www.w3.org/TR/2024/DNOTE-webcodecs-avc-codec-registration-20240610/):
  - PP is profile_idc: 0x42 Baseline, 0x4D Main, 0x64 High;
  - CC holds the constraint_set flags;
  - LL is the level × 10, so 0x1F is 3.1 and 0x28 is 4.0.
  - Examples: avc1.42E01E is Baseline 3.0, avc1.4D401F is Main 3.1, avc1.640028 is High 4.0 [src](https://blog.pearce.org.nz/2013/11/what-does-h264avc1-codecs-parameters.html).
- MDN's table: avc1.42001f is Baseline up to 720p; avc1.4d0034 is Main up to 4K (level 5.2); avc1.64003e is High up to 8K. MDN probes a ladder of candidates from best to worst with isConfigSupported [src](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API/Codec_selection).

**H.264 level limits** (max frame size MaxFS and max rate MaxMBPS, both in 16×16 macroblocks) [src](https://ffmpeg.org/doxygen/6.1/h264__levels_8c_source.html):

| Level | MaxFS | MaxMBPS | MaxBR (kbit/s, Baseline/Main) |
|---|---|---|---|
| 3.1 | 3600 | 108000 | 14000 |
| 3.2 | 5120 | 216000 | 20000 |
| 4.0 | 8192 | 245760 | 20000 |
| 4.1 | 8192 | 245760 | 50000 |
| 5.1 | 36864 | 983040 | 240000 |
| 5.2 | 36864 | 2073600 | 240000 |

Our sizes against that table [est]:
- **1920×1080:** 120 × 68 = 8160 MBs, under 4.0's 8192. 8160 × 30 = 244800 MB/s, under 245760. So level 4.0 fits, with almost no room.
- **1080×1920:** the same count, so the same level.
- **1080×1080:** 68 × 68 = 4624 MBs, which fits level 3.2.
- **The page:** a 3072 px tall portrait page is far past level 5.2's 36864 MBs. It must be scaled down to fit a level the encoder will accept.

**Codec strings: VP9 and VP8**
- VP9 is "vp09." plus a suffix defined by the VP codec ISO binding, and takes no description [src](https://www.w3.org/TR/webcodecs-vp9-codec-registration/).
- MDN reads vp09.00.40.08.00 as profile 0, level 4 (up to 2K), 8-bit, with candidates vp09.00.50.08.00 (4K) and vp09.00.10.08.00 [src](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API/Codec_selection).
- VP8 is plain "vp8" [src](https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder/configure).

**"avc" or "annexb" format**
- The AVC config's format defaults to "avc" [src](https://www.w3.org/TR/2024/DNOTE-webcodecs-avc-codec-registration-20240610/).
- In "avc" format:
  - chunks are length-prefixed access units (ISO 14496-15 §5.3.2);
  - the SPS and PPS are left out of the bitstream;
  - they come instead in the output callback's metadata, as decoderConfig.description, an AVCDecoderConfigurationRecord: the avcC box's body.
- In "annexb" format the parameter sets travel in-band, with start codes [src](https://www.w3.org/TR/2024/DNOTE-webcodecs-avc-codec-registration-20240610/).
- The decoderConfig arrives with the first chunk, and again only when it changes [src](https://developer.chrome.com/docs/web-platform/best-practices/webcodecs?authuser=7).
- MP4 wants "avc"; WebM carries VP9 or VP8, which have no description [est].

**isConfigSupported**
- It resolves to whether the config is supported, echoing back only the members it recognized. configure() with an unsupported config fails with NotSupportedError [src](https://www.w3.org/TR/2026/WD-webcodecs-20260827/).
- Chrome's guide checks a config before configuring [src](https://developer.chrome.com/docs/web-platform/best-practices/webcodecs?authuser=7).

**Backpressure**
- encodeQueueSize is "the number of pending encode requests", and it falls as the codec accepts input. A dequeue event fires when it drops [src](https://www.w3.org/TR/2026/WD-webcodecs-20260827/) [src](https://developer.mozilla.org/docs/Web/API/VideoEncoder/encodeQueueSize).
- Chrome's live-capture example drops a frame when the queue passes 2 [src](https://developer.chrome.com/docs/web-platform/best-practices/webcodecs?authuser=7).
- An offline film must wait for dequeue instead: a dropped frame is a hole in the film [est].

**Key frames**
- keyFrame: false leaves the choice to the browser; true forces a key frame [src](https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder/encode).
- Chrome's example asks for a key frame every 150 frames [src](https://developer.chrome.com/docs/web-platform/best-practices/webcodecs?authuser=7).
- YouTube asks uploads for a closed GOP of half the frame rate [src](https://support.google.com/youtube/answer/1722171?hl=en).

**B-frames and order**
- The mp4-muxer README takes a composition offset for B-frames, but notes that WebCodecs encoding does not produce them [src](https://npmjs.com/package/mp4-muxer).
- Decoders must output frames in presentation order [src](https://www.w3.org/TR/2026/WD-webcodecs-20260827/).
- Demuxing camera files does meet decode order ≠ display order [src](https://cuberoot.me/dev/algorithms/webcodecs). That is a concern for reading files, not for our encoder.

**Browser support**
- VideoEncoder: Chrome and Edge 94, Firefox 130, Safari and iOS Safari 16.4 [src](https://caniuse.com/mdn-api_videoencoder).
- The whole WebCodecs API: Safari is partial from 16.4 to 18.7 and full from 26.0; Firefox for Android has none; Chrome for Android has it [src](https://caniuse.com/webcodecs).
- Safari gained AAC in AudioEncoder only at 26; earlier Safari could not encode audio [src](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API/Codec_selection). That does not matter here, since the film is silent [est].

## 2. MP4 for one H.264 track

**The boxes**
- What each box holds [src](https://mp4ra.org/registered-types/boxes):
  - ftyp: the file type;
  - moov: all the metadata; mvhd the movie header;
  - trak: the track; tkhd its header; mdia its media; mdhd the media header; hdlr the handler ("vide");
  - minf: media information; vmhd the video media header; dinf/dref where the data lives;
  - stbl: the sample table, with stsd (sample descriptions, holding avc1 and its avcC), stts (decode time to sample), ctts (composition offsets, unneeded without B-frames), stss (sync samples, the key frames), stsc (sample to chunk), stsz (sample sizes), stco (chunk offsets; co64 is the 64-bit form);
  - mdat: the media data.
- When the track has data, stsd, stsz, stsc and chunk offsets are required. Without stss, every sample is a sync sample [src](https://developer.apple.com/documentation/quicktime-file-format/sample_table_atom.md).
- stsc maps samples to chunks through runs of (first chunk, samples per chunk, description id) [src](https://developer.apple.com/documentation/quicktime-file-format/sample-to-chunk_atom.md). So one entry, "every sample in one chunk", with a single stco offset at the start of the mdat payload, is valid [est].

**Faststart**
- A player can begin before the download ends only when it already has the moov. Hence ffmpeg's faststart flag and qt-faststart, which move the moov forward [src](https://walterebert.com/blog/start-playing-mp4-videos-before-download-has-finished).
- YouTube asks for the moov at the front and no edit lists [src](https://support.google.com/youtube/answer/1722171?hl=en).
- BrightSign's seamless-loop guidance says the same, and asks that every track be the same length to the sample [src](https://docs.brightsign.biz/author/seamlessly-loop-videos.md).

**How the small muxers do it**
- Vanilagy's mp4-muxer offers four fastStart modes [src](https://npmjs.com/package/mp4-muxer):
  - false: the moov at the end;
  - "in-memory": every chunk kept until finalize, then the moov first;
  - "fragmented": fMP4;
  - an object that reserves room for a declared chunk count.
- It prefers a fixed frame rate, because irregular timestamps upset QuickTime [src](https://npmjs.com/package/mp4-muxer).
- mp4-muxer is deprecated in favour of Mediabunny [src](https://raw.githubusercontent.com/Vanilagy/mp4-muxer/HEAD/MIGRATION-GUIDE.md). Mediabunny keeps the same modes ("reserve" replaces the object form) and says some players lack seeking in fragmented files [src](https://mediabunny.dev/guide/output-formats).
- Mediabunny is pure TypeScript with zero dependencies, tree-shaken down to "5 kB gzipped" [src](https://cdn.jsdelivr.net/npm/mediabunny@1.61.3/README.md). Remotion sponsors it, and has deprecated its own parser in its favour [src](https://www.remotion.dev/blog/mediabunny).
- A 6–24 s film is a few megabytes, so "in-memory" (moov computed last, written first) is the right mode for us. `mp4Parts` builds the moov twice: once to learn its length, then again with the real mdat offset [est].

## 3. WebM / Matroska

**The structure**
- A Matroska file is an EBML document whose root is the Segment. Its top-level children include Info, Tracks, Cluster and Cues [src](https://www.muonics.com/rfc/rfc9559.php).
- WebM is the restricted profile with DocType "webm" [est].
- Element IDs, matching `webmBytes` [src](https://www.muonics.com/rfc/rfc9559.php):
  - EBML 1A45DFA3, Segment 18538067, Info 1549A966, Tracks 1654AE6B;
  - Cluster 1F43B675, Timestamp E7, SimpleBlock A3, CodecID 86;
  - Video E0, PixelWidth B0, PixelHeight BA.

**Timing**
- TimestampScale defaults to 1000000 ns, so timestamps are in milliseconds [src](https://www.ietf.org/archive/id/draft-ietf-cellar-matroska-06.html).
- Each Cluster has a Timestamp, and each SimpleBlock's is a signed 16-bit offset from it [src](https://www.ietf.org/archive/id/draft-ietf-cellar-matroska-06.html). So a cluster can span at most 32.767 s [est].

**SimpleBlock**
- It holds the track number as an EBML varint (0x81 for track 1), the 16-bit relative timestamp, and a flags byte [src](https://www.ietf.org/archive/id/draft-ietf-cellar-matroska-06.html):
  - 0x80 keyframe;
  - 0x08 invisible;
  - lacing bits;
  - 0x01 discardable.

**Unknown sizes and Cues**
- Segment and Cluster may have unknown size [src](https://www.ietf.org/archive/id/draft-ietf-cellar-matroska-06.html). An MSE stream ends an unknown-size cluster at the next Cluster header, and the cluster's Timecode must precede its blocks [src](https://www.w3.org/TR/mse-byte-stream-format-webm/).
- A random access point is a SimpleBlock with the keyframe flag [src](https://www.w3.org/TR/mse-byte-stream-format-webm/).
- Cues are not mandatory, but a file SHOULD have at least one CuePoint, and seeking without them is "much harder" [src](https://www.ietf.org/archive/id/draft-ietf-cellar-matroska-06.html).
- We know every size before writing, so known sizes (8-byte size fields) are simpler and need no patching [est].

**The small muxers**
- Vanilagy's webm-muxer handles V_VP8, V_VP9 and V_AV1. Its streaming mode never patches what it has written, which costs duration and seeking [src](https://npmjs.com/package/webm-muxer).
- Mediabunny closes a cluster after a minimumClusterDuration (1 s by default) [src](https://mediabunny.dev/guide/output-formats).

## 4. The zip of PNG frames

**The format**
- A zip is local file headers (0x04034b50), each followed by its data; then the central directory (0x02014b50); then the end record (0x06054b50) [src](https://flutter.googlesource.com/third_party/libzip/+/0eed45daf116d3f5a015a85428fe2c690279eb2e/docs/appnote.txt).
- Compression method 0 is stored. General-purpose bit 11 marks UTF-8 names. Dates are MS-DOS dates. The CRC-32 "magic number" is 0xdebb20e3 [src](https://flutter.googlesource.com/third_party/libzip/+/0eed45daf116d3f5a015a85428fe2c690279eb2e/docs/appnote.txt). `crc32` uses the reflected polynomial 0xEDB88320 [est].
- ZIP64 records take over when a size or offset field would overflow (0xFFFFFFFF) [src](https://flutter.googlesource.com/third_party/libzip/+/0eed45daf116d3f5a015a85428fe2c690279eb2e/docs/appnote.txt). So a plain zip ends at 4 GiB [est].

**Why stored**
- PNG data is already deflate, in a zlib stream [src](https://www.libpng.org/pub/png/spec/1.2/PNG-Compression.html).
- Zipping images with DEFLATE and with STORE gave "essentially the same file-size", but STORE was about twice as fast [src](https://www.bennadel.com/blog/3802-zipping-image-archives-with-deflate-and-store-compression-methods-in-lucee-cfml-5-2-9-31.htm).
- Stored entries also let `zipParts` hand Blob parts straight through, without reading the frames back into memory [est].

## 5. How other creative tools export loops

**Sketch and canvas recorders**
- p5's saveGif takes a duration in seconds from a running sketch [src](https://p5js.org/reference/p5/saveGif/).
- p5's saveFrames caps a capture at 15 s and 22 fps, to keep memory from crashing the browser [src](https://p5js.org/reference/p5/saveFrames/).
- CCapture (used with three and Shadertoy-style canvases) films at a fixed rate however slow each frame is [src](https://cdn.jsdelivr.net/gh/spite/ccapture.js@1.0.9/README.md):
  - it hooks requestAnimationFrame, setTimeout, Date.now and performance.now, so time steps evenly per frame;
  - it writes WebM through Whammy (Chrome only, since it rides on WebP), GIF, or PNG/JPEG in a tar;
  - it splits big captures with autoSaveTime, since large ones break the browser's allocation limits.

**Turntables and loop conventions**
- Blender turntables use linear interpolation and a cyclic F-curve modifier [src](https://www.studiorola.com/tutorials/animation-tutorials/blender-3d-turntable-animation-for-2-5). Bezier, the default, "messes with cycle animations" [src](https://discourse.threejs.org/t/advice-on-creating-seamless-animation-loops-in-blender-for-gltf-export/26174).
- A turntable add-on takes a step count and an optional start and end angle [src](https://extensions.blender.org/add-ons/turntable-camera/).
- After Effects' loopOut has cycle, pingpong, offset and continue [src](https://www.provideocoalition.com/dmoe8_loop/). cycle treats the last keyframe as the same instant as the first: one frame past it shows the frame after the first keyframe.

**Animated wallpapers**
- On Windows, Wallpaper Engine's developer says hardware-decoded H.264 MP4 "isn't seamless". WebM loops seamlessly, but is kept off the Workshop for CPU load [src](https://steamcommunity.com/app/431960/discussions/2/1621724915817399541).
- That thread says nothing on loop length, so I found no published length convention [est].

**Social sizes**
- 9:16 at 1080×1920 for Reels, Stories, TikTok and Shorts; 1:1 at 1080×1080 and 16:9 at 1920×1080 for feeds and YouTube [src](https://metricool.com/social-media-image-sizes/).
- Reels: H.264 in MP4 at 30 fps [src](https://postfa.st/sizes/instagram/reels).
- Square counts as a Short, but shows bars [src](https://postfa.st/sizes/youtube/shorts).
- YouTube for SDR 1080p at 24–30 fps: 8 Mbps (12 Mbps at 48–60 fps), High Profile, 4:2:0, variable bitrate, 2 consecutive B-frames [src](https://support.google.com/youtube/answer/1722171?hl=en). We can't give it B-frames, and needn't [est].

## 6. Seamless loops

**The off-by-one**
- A perfect loop runs t from 0 to 1 over n frames, and drives everything by periodic functions of 2πt, such as noise sampled round a circle [src](https://tproger.ru/translations/drawing-loopy-gifs-from-noise-in-processing) [src](https://thecodingtrain.com/challenges/136-polar-noise-loops).
- The frame at t = 1 is the frame at t = 0, so it is drawn once only.
- Blender users disagree whether to end on a copy of the first pose or one frame before it [src](https://discourse.threejs.org/t/advice-on-creating-seamless-animation-loops-in-blender-for-gltf-export/26174). The copy shows as a hitch: one pose held for two frames [est].
- So the camera round draws angle = start + 360·i/n for i = 0…n−1. The last frame is one step short of 360, and the player's wrap supplies the step [est].

**Easing**
- Penner's easeInOutSine is −c/2·(cos(πt/d) − 1) + b [src](https://essential-books.onrender.com/essential/htmlcanvas/easing-using-robert-penners-equations-24984e75aa774fb6b3c673827605fef8.html). That is 0.5 − 0.5·cos(πs), which `moveAt` uses.
- Its speed is zero at both ends, so "from this look to another" settles instead of stopping dead [est].
- Rounds (camera, light) must stay linear. An eased turn would pause once a cycle, the cyclic-curve problem above [est].

**Ping-pong**
- After Effects' pingpong plays the keys forward then back [src](https://www.provideocoalition.com/dmoe8_loop/).
- With a triangle s = 2u for the first half and 2 − 2u for the second (u = i/n), the far look is drawn once at u = ½, and the start is drawn only at i = 0. The ease's zero speed at both turns makes "and back" loop with no seam [est].

## 7. What this app can do that others don't [est]

- **Frames are the page's own renders, not a capture.** The poem stays typeset at every frame. There is no faked clock (CCapture's trick), no dropped frames, and no limit like saveFrames' 15 s.
- **The moves mean something in the picture.** A day passing over a painted ring world, or the ring turning under the camera. Generic recorders only replay time.
- **A tween between two whole looks.** Every dial and colour eases, and a surface's kind or a seed cross-fades. Most tools tween keyframes on one property at a time.
- **Seamless by construction.** Rounds end one step short of the start, and "and back" eases into both turns.
- **Nothing leaves the page.** No upload, no server-side ffmpeg (CCapture's fallback), no library, and the same film as MP4, WebM or frames.

## What we take

Everything in this section is [est]: decisions built on the sources above, where they are cited.

**Decisions (matching the plan)**
- **Encode offline, in order:**
  - draw frame i, make a frame of it, then wait on dequeue while encodeQueueSize is above about 2–4; never drop a frame;
  - close each frame after encode;
  - give timestamps as exact multiples of 1/30 s, and write the MP4's own steady stts rather than trusting chunk timestamps.
- **Key frames:** force one at frame 0 and about every 1 s (30 frames). The wrap of a loop seeks to 0, and YouTube likes half-second GOPs; every 30 is a fair middle for a few-megabyte file.
- **H.264:** format "avc", and wait for the first chunk's decoderConfig.description before `mp4Parts` writes avcC.
  - Probe a ladder at the film's real size: avc1.640028, then avc1.4d0028, then avc1.420028 (High, Main, Baseline at 4.0, from Pearce's layout).
  - For larger page sizes, the same profiles at 5.1 (…33).
- **VP9 / VP8:** vp09.00.40.08 for up to 1080p, vp09.00.50.08 above, then "vp8". Codec names V_VP9 and V_VP8 in `webmBytes`.
- **Bitrate:** variable.
  - About 8 Mbps for 1920×1080 and 1080×1920 (YouTube's 1080p30), and about 4.5 Mbps for 1080×1080 (scaled by pixels).
  - Up to 12 Mbps is cheap for painted grain: 24 s at 12 Mbps is 36 MB.
- **Containers:**
  - MP4: one chunk, moov first, no ctts, no edit list.
  - WebM: known sizes, a cluster at each key frame and before 30 s, no Cues.
  - Zip: stored, UTF-8 names, fixed date.
- **Moves:**
  - rounds are linear over i/n, with i = 0…n−1;
  - "from this look to another" eases by `moveAt`;
  - `wholeChanges` names the keys to cross-fade, and `blendLooks` with side 0 and 1 draws both halves of the fade.

**Risks to watch**
- **B-frames.** None today. If a browser ever reorders, chunk timestamps will stop rising. Check that they rise, and refuse MP4 (offer WebM) rather than write a wrong stts.
- **Odd or oversized dimensions.**
  - H.264 at 4:2:0 wants even sides (Google's transcoder: "Must be an even integer" [src](https://docs.cloud.google.com/python/docs/reference/transcoder/latest/google.cloud.video.transcoder_v1.types.VideoStream.H264CodecSettings)), so round "the page" down to even.
  - Also scale it to fit the level, about 2.1 MP for 4.0 or 9.4 MP for 5.1. Then confirm with isConfigSupported before rendering a single frame.
- **1080p30 sits at level 4.0's very edge** (244800 of 245760 MB/s). A 31 fps or 1088-row variant would need 4.2 or 5.x.
- **Safari.**
  - WebCodecs is partial before 26. VP9 encoding on Safari is unconfirmed (Gaps), and MDN says native VP9 playback is missing on macOS and iOS [src](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API/Codec_selection).
  - So offer MP4 first on Safari, and hide a format whose probe fails.
  - Firefox for Android has no WebCodecs at all: offer only the zip there.
- **Memory for long PNG zips.**
  - A noisy 1920×1080 PNG is perhaps 3–6 MB, so 24 s × 30 fps = 720 frames is about 2–4 GB. That brushes the 4 GiB plain-zip limit and a phone's Blob store.
  - Keep each PNG as a Blob part, never in an array of bytes. Show the estimated size before starting, and cap or warn past about 3.5 GiB (ZIP64 otherwise).
  - p5 and CCapture both cap or split for this reason.
- **The cross-fade doubles the render cost** for the frames it covers: two looks drawn per frame. Budget the progress bar for it.
- **The loop seam in players.** Hardware MP4 may hitch on Windows wallpapers. For wallpapers, WebM is the format to suggest.

## Gaps

- These would not open (permission not granted in time), so their points are taken from the dated W3C draft, MDN and caniuse instead:
  - the live WebCodecs editor's draft (w3c.github.io/webcodecs);
  - the undated W3C TR WebCodecs page;
  - WebKit's Safari 16.4 post;
  - the webcodecsfundamentals codec-support table (per-browser encoder results, including Safari VP9);
  - the VP codec ISO binding on GitHub;
  - Mediabunny's Matroska muxer source.
- The WebCodecs draft's VideoEncoder output algorithm (when decoderConfig is attached, and timestamp rules) could not be read in full; Chrome's guide stands in.
- No primary source for H.264 per-side limits (√(8·MaxFS) macroblocks) or for VP9's level-4 picture size: those are [est].
