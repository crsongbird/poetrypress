/**
 * athanorWiki.js — THE ATHANOR'S WIKI: an internal encyclopedia that teaches the node editor.
 *
 *   Ask the grimoire:
 *   every page leads to the next
 *   until the hand knows.
 *
 * Ruby: the help should be organized like a wiki and genuinely teach — someone who has never used a
 * node editor should come away able to build with one (a skill that carries to Blender, Substance,
 * Filter Forge). Filter Forge's own help is the model for its tone: key facts, worked examples,
 * links between pages. Written for an adult; approachable, never talking down.
 *
 * Articles are { id, group, title, body } with [[id]] or [[id|words]] links between them; a part's
 * page is 'part:<key>', built from steps.js and athanorWikiParts.js. forge.js shows it all
 * (wikiShellHtml / wikiArticleHtml / wikiSearch) and opens a part's page from that part's menu.
 */
import { STEPS } from './steps.js';
import { WIKI_PARTS } from './athanorWikiParts.js';

const wkEsc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// the five kinds of data, and the article that explains each
export const WIKI_KINDS = { field: ['gray map', 'graymap'], image: ['picture', 'picture'], colour: ['color', 'color'], value: ['number', 'number'], curve: ['curve', 'curve'] };

export const WIKI_GROUPS = ['Start here', 'Data and wires', 'Building techniques', 'The page and your graph', 'Using the editor', 'Parts', 'Glossary'];

export const WIKI_ARTICLES = [
  // ------------------------------------------------------------------ Start here
  { id: 'welcome', group: 'Start here', title: 'What the Athanor is', body: `
<p>The Athanor is a <b>node editor</b> for making surface textures. Instead of painting a texture, you build a small machine that makes it: a chain of <b>parts</b> (nodes), each doing one simple job, joined by <b>wires</b> that carry the result of one part into the next.</p>
<p>If you have used filters in a photo editor, you already know the idea. Blur, Levels, a color gradient: each is one step. A node editor lets you chain those steps, branch them, and combine them, and keeps the whole recipe editable. Change a setting at the start and everything after it updates.</p>
<h3>Key facts</h3>
<ul>
<li>A graph is read <b>from left to right</b>. Parts on the left make something; parts to their right change it; the <b>Surface</b> at the far right is where the texture comes out.</li>
<li>Every part shows a <b>small preview</b> of what it makes, so you can see each step.</li>
<li>Wires carry one of <b>five kinds of data</b>: gray maps, pictures, colors, numbers and curves. See [[kinds]].</li>
<li>Most of the app’s own textures are graphs. <b>Open</b>, in the bar, opens any of them, so you can see how they are made and borrow their parts.</li>
<li>Nothing here can break your page: undo and <b>Revert</b> are always there. The page shows a graph only when it is the page’s surface: the bar says <b>✓ On the Page</b> when it is, and <b>⇱ Show on Page</b> puts it there.</li>
</ul>
<p>The same way of working runs Blender’s shader nodes, Substance Designer, Houdini, Nuke and Filter Forge. What you learn here carries over.</p>
<p>New to this? Start with [[first|your first surface]].</p>` },
  { id: 'first', group: 'Start here', title: 'Your first surface, step by step', body: `
<p>This walk-through builds a simple colored, lit stone in about five minutes. It touches every basic idea once.</p>
<h3>1. Start clean</h3>
<p>Open <b>⋯</b> in the bar and choose <b>Clear the grid</b>. Only the <b>Surface</b> is left: the end of every graph.</p>
<h3>2. Make a pattern</h3>
<p>Open <b>＋ Parts</b>, find <b>Perlin Noise</b> (in Noise), and add it. Its preview shows soft gray hills. Wire its output (the dot on its right edge) into the Surface’s <b>Image</b> input (a dot on the Surface’s left edge). The big preview in the corner now shows the noise: you have made a texture.</p>
<p>With a mouse, drag from dot to dot. On a touch screen, hold the noise, choose <b>Connect its output…</b>, then tap the Surface and pick <b>picture</b>. See [[mouse]] and [[touch]].</p>
<h3>3. Shape it</h3>
<p>Add <b>Levels</b> (in Shape) and put it between the two: noise → Levels → Surface. Wiring Levels’ output into the Surface replaces the old wire, because an input takes only one. Raise <b>Black Point</b> and the noise becomes darker blotches with brighter peaks. This is the heart of node work: <b>generate, then shape</b>.</p>
<h3>4. Color it</h3>
<p>Add a <b>Gradient Map</b> (Light &amp; Color) after Levels. It turns each gray into a color from its list: black takes the first color, white the last. You now have a color picture instead of a gray map. See [[graymap]] and [[picture]] for the difference.</p>
<h3>5. Light it</h3>
<p>Add a <b>Light Engine</b> (Light &amp; Color). Wire the Gradient Map into its <b>picture</b>, and the Levels output into its <b>height</b> as well. One output can feed many inputs. Wire the Light Engine into the Surface. Turn the light dial on the page: the hills cast shadows. See [[heights]].</p>
<h3>6. Put a control on the page</h3>
<p>Add a <b>Knob</b> (Inputs), name it “Roughness”, and wire it into the Perlin Noise’s <b>Roughness</b> ⚙ port. Press <b>⇱ Show on Page</b> (unless the bar already says On the Page): the Surface section of the page now has a Roughness slider. See [[controls]].</p>
<h3>7. Keep it</h3>
<p>Press <b>Keep</b> and give it a name. It joins Your Surfaces in the surface menu. See [[keeping]].</p>` },
  { id: 'reading', group: 'Start here', title: 'Reading a graph', body: `
<p>A graph shows its own working. To understand one you didn’t build, follow it the way the data flows.</p>
<ol>
<li><b>Find the Surface</b> at the right. What is wired into its Image is the final picture.</li>
<li><b>Walk back</b> along that wire. Each part’s preview shows what it hands on; compare it with the preview of the part before it to see what that part did.</li>
<li><b>Look at the colors.</b> A wire’s color says what it carries (see [[kinds]]). A part’s title color shows what it makes.</li>
<li><b>Look at the ⚙ ports.</b> A wire into a setting means something else is driving it: a Knob from the page, the light dial, or a map. See [[ports]].</li>
<li><b>Open a part’s page.</b> Its menu (right-click, or hold on touch) has <b>About this part</b>, which opens it here.</li>
</ol>
<p>Notes on the grid (the Note part) are the builder’s own explanations.</p>` },

  // ------------------------------------------------------------------ Data and wires
  { id: 'kinds', group: 'Data and wires', title: 'The five kinds of data', body: `
<p>Everything that travels along a wire is one of five kinds. Ports and wires are colored by kind, so you can tell at a glance what goes where.</p>
<table class="wk-table"><tr><th>Kind</th><th>What it is</th><th>Typical use</th></tr>
<tr><td>${'{{k:field}}'}</td><td>A grid of numbers, one per point, each from 0 (black) to 1 (white).</td><td>Noise, masks, heights, amounts.</td></tr>
<tr><td>${'{{k:image}}'}</td><td>A grid of colors: three gray maps (red, green, blue) stacked.</td><td>Anything you see in color.</td></tr>
<tr><td>${'{{k:colour}}'}</td><td>One single color.</td><td>A hue, an ink, a tint.</td></tr>
<tr><td>${'{{k:value}}'}</td><td>One single number, from 0 to 1.</td><td>Driving a setting.</td></tr>
<tr><td>${'{{k:curve}}'}</td><td>A shape: for every input from 0 to 1, an output from 0 to 1.</td><td>Reshaping tones and gradients.</td></tr></table>
<p>The difference between a <b>map</b> and a <b>single value</b> is the most important one: a gray map can be different at every point of the page; a number is the same everywhere. That is why a gray map can be used as a mask, and a number can’t.</p>
<p>Any output can be wired into any input. When the kinds differ, the value is converted on the way: see [[convert]].</p>` },
  { id: 'graymap', group: 'Data and wires', title: 'Gray maps', body: `
<p>A <b>gray map</b> is the basic material of the Athanor. It is a grid covering the page, with one number at every point, from 0 to 1. It is shown as gray: 0 is black, 1 is white, 0.5 is middle gray.</p>
{{fig:graymap}}
<p>The same gray map can mean very different things depending on where it is wired:</p>
<ul>
<li>As a <b>mask</b>, white means “here” and black means “not here” (Mix, Blend). See [[masks]].</li>
<li>As a <b>height map</b>, white is high and black is low (Light Engine). See [[heights]].</li>
<li>As an <b>amount</b>, it sets how strong something is at each point (a setting driven by a map). See [[mapping]].</li>
<li>As something to <b>color</b>, each gray picks a color (Gradient Map, Tint). See [[picture]].</li>
</ul>
<h3>Key facts</h3>
<ul>
<li>Most generators (noise, cells, waves) make gray maps.</li>
<li>Most filters in <b>Shape</b> (levels, blur, warp, threshold) take and give gray maps.</li>
<li>Working in gray first and coloring last keeps graphs simple: shape the pattern, then decide its colors.</li>
</ul>` },
  { id: 'picture', group: 'Data and wires', title: 'Pictures', body: `
<p>A <b>picture</b> is a color image. On a screen, every color is a mix of red, green and blue light, so a picture is really <b>three gray maps stacked together</b>: one says how much red there is at each point, one green, one blue. Where all three are 1, you see white; where all three are 0, black; where only red is high, red.</p>
{{fig:picture}}
<p>That is why the two kinds convert so easily:</p>
<ul>
<li>A <b>gray map wired into a picture input</b> becomes a gray picture: the same map used for red, green and blue.</li>
<li>A <b>picture wired into a gray input</b> becomes its brightness (luminance), so a colored texture can be used as a mask or a height.</li>
</ul>
<h3>Where pictures come from</h3>
<p>Most pictures are made in the graph, but one comes from the page: <b>Page Backdrop</b> brings in the backdrop (its color, or its gradient top to bottom), so a surface can be made of the page itself and change when the backdrop does. Circuit Board draws its board on it.</p>
<h3>Turning gray into color</h3>
<p>Parts in <b>Light &amp; Color</b> make pictures from gray maps: <b>Tint</b> and <b>Color Ramp</b> (two colors), <b>Gradient Map</b> (up to five), <b>Spectrum</b> (a rainbow). The Light Engine takes a picture and lights it.</p>
<h3>Working with channels</h3>
<p><b>Split Channels</b> takes a picture apart into its red, green, blue and brightness gray maps; <b>Merge Channels</b> puts three gray maps back together. With them you can process one channel at a time, or build a picture from three different maps.</p>
<h3>The Surface’s ground</h3>
<p>A Surface set to <b>gray</b> treats whatever arrives as a gray map and lets the page color it with its own hues. A Surface set to <b>color</b> shows the picture as it is. See [[surface]].</p>` },
  { id: 'color', group: 'Data and wires', title: 'Colors', body: `
<p>A <b>color</b> wire carries one color for the whole page. Colors come from <b>Hue</b> parts (the page’s hue pickers), <b>Accent</b> parts (the poem’s accent colors), and the <b>Color</b> part (a hex code you type).</p>
{{fig:color}}
<p>Parts take colors through ports like <i>light hue</i>, <i>ink</i>, <i>glass hue</i>. When such a port is empty, the part uses its own default (often the page’s hue), so wiring a color in is a way to <b>override</b> it.</p>
<p>Using Hue parts rather than fixed colors lets whoever uses your surface recolor it from the page. See [[controls]].</p>` },
  { id: 'number', group: 'Data and wires', title: 'Numbers', body: `
<p>A <b>number</b> wire carries one value from 0 to 1, the same everywhere on the page. Numbers come from <b>Knobs</b> (page sliders), the <b>Light Dial</b>, <b>Number</b>, <b>Random Number</b> and <b>Seed</b>.</p>
{{fig:number}}
<p>Numbers are mostly wired into <b>⚙ setting ports</b>, where 0 means the setting’s lowest value and 1 its highest. See [[ports]] and [[ranges]].</p>` },
  { id: 'curve', group: 'Data and wires', title: 'Curves', body: `
<p>A <b>curve</b> is a rule for changing one number into another. Picture a graph: along the bottom, inputs from 0 to 1; up the side, outputs from 0 to 1. A straight diagonal line changes nothing; a line that rises quickly brightens the darks; a wave makes values go up and down repeatedly.</p>
{{fig:curve}}
<p>You meet curves in photo editors (the Curves adjustment) and in animation (easing). Here they do two jobs:</p>
<ul>
<li><b>Tone Curve</b> runs every value of a picture through a curve: Stairs posterizes softly, Wave makes bands.</li>
<li><b>Profile Gradient</b> shapes a gradient with a curve: an Impulse curve laid radially makes a raised ring; a Wave makes ripples.</li>
</ul>
<p><b>Curve</b> makes the basic shapes; <b>Curve Ops</b> repeats, flips, shifts or combines them. A curve wired where a gray map goes is laid across the page from left to right.</p>` },
  { id: 'convert', group: 'Data and wires', title: 'When kinds don’t match', body: `
<p>You can wire any output into any input. When the kinds differ, the Athanor converts the value as it passes:</p>
<table class="wk-table"><tr><th>From</th><th>Into</th><th>Becomes</th></tr>
<tr><td>gray map</td><td>picture</td><td>A gray picture (the same map in red, green and blue).</td></tr>
<tr><td>picture</td><td>gray map</td><td>Its brightness.</td></tr>
<tr><td>color or number</td><td>a map or picture</td><td>A flat fill of that color or gray.</td></tr>
<tr><td>map or picture</td><td>number</td><td>Its average brightness (but see [[mapping]]: newer graphs use it point by point).</td></tr>
<tr><td>anything else</td><td>color</td><td>The input uses its own default.</td></tr></table>
<p>Converting is never an error, and it can be useful: a color wired into a ⚙ port gives its brightness as a number.</p>` },
  { id: 'ports', group: 'Data and wires', title: 'Inputs, outputs and ⚙ settings', body: `
<p>A part has three kinds of connection point:</p>
<ul>
<li><b>Inputs</b>, the dots on its left edge, take what the part works on. Each takes <b>one</b> wire; wiring a new one replaces the old.</li>
<li><b>Outputs</b>, the dots on its right edge, hand on its results. One output can feed <b>any number</b> of inputs. Some parts have several outputs (Cells gives distance, edges and a number per cell).</li>
<li><b>⚙ setting ports</b> sit beside most sliders. A wire there takes over the slider: the setting now follows whatever is wired in.</li>
</ul>
<h3>Key facts about ⚙ ports</h3>
<ul>
<li>A number wired in sweeps the slider’s <b>whole range</b>: 0 is its minimum, 1 its maximum. To use only part of the range, see [[ranges]].</li>
<li>A <b>gray map</b> wired in can set the value <b>separately at every point</b> (in graphs made with this version). See [[mapping]].</li>
<li>A setting can also be <b>bound</b> to a page slider or the light dial without a wire: use the setting’s menu.</li>
</ul>
<p>Some inputs are <b>required</b>: see [[required]].</p>` },
  { id: 'required', group: 'Data and wires', title: 'Required inputs', body: `
<p>Some parts can’t do anything without something to work on: Blur needs a map to blur, Levels a map to adjust. Their first input is <b>required</b>, and while it is empty the port shows <b>red</b>.</p>
<p>So the rest of the part still shows something useful, its preview uses a stand-in image (an exclamation mark) in place of the missing input. The stand-in never reaches the Surface. Wire something into the red port and the warning goes.</p>` },
  { id: 'mapping', group: 'Data and wires', title: 'Driving a setting with a map', body: `
<p>This is the idea that makes node editors powerful (Filter Forge calls it <b>parameter mapping</b>). A setting doesn’t have to be one value for the whole page: wire a <b>gray map</b> into its ⚙ port and the setting takes a different value at every point, read from the map.</p>
{{fig:mapping}}
<h3>An example</h3>
<p>Take a <b>Blur</b>. Its Radius is normally the same everywhere. Now wire a <b>Gradient</b> (left to right) into Radius’s ⚙: the left edge, where the gradient is black, isn’t blurred; the right edge, where it is white, is blurred fully; in between it grows steadily. A focus fall-off, made from two parts.</p>
<p>Other ideas: noise on a Threshold’s Cutoff for uneven edges; The Poem’s Distance on a Mix’s amount so a texture fades near the words; noise on Scatter’s Size.</p>
<h3>Key facts</h3>
<ul>
<li>It works where a part reads the setting point by point. Settings that can’t vary (how many octaves, which shape) use the map’s average.</li>
<li>It works in graphs made with this version. Older graphs, and the app’s own textures, use the average, so they keep looking exactly as before.</li>
<li>Combine it with [[ranges]] to choose how far the setting moves.</li>
</ul>` },
  { id: 'ranges', group: 'Data and wires', title: 'Wire ranges (remapping)', body: `
<p>A wire into a ⚙ port normally sweeps the setting’s whole range. Often you want less, or want it reversed. A <b>wire range</b> sets the two values the setting takes at the wire’s lowest (0) and highest (1).</p>
{{fig:ranges}}
<h3>An example</h3>
<p>You put a Knob on the page and wire it into Perlin Noise’s <b>Roughness</b> (0–100). Above 50 the noise looks harsh, so half the slider is wasted. Open Roughness’s menu and choose <b>Set wire range…</b>, then enter <b>0, 50</b>. Now the whole slider sweeps 0 to 50.</p>
<p>Want the slider called “Smoothness” instead? Rename the Knob and enter the range backwards, <b>50, 0</b>: the slider at 0 now gives Roughness 50, and the slider at 100 gives Roughness 0.</p>
<p>One Knob can feed several settings, each with its own range, so a single slider moves them all by different amounts. The app’s textures do this often: open one from <b>Open</b> and look at the Knobs.</p>` },

  // ------------------------------------------------------------------ Building techniques
  { id: 'masks', group: 'Building techniques', title: 'Masks, mixing and blending', body: `
<p>A <b>mask</b> is a gray map used to say where: white means yes, black means no, gray means partly. Most of the craft of combining textures is making good masks.</p>
{{fig:masks}}
<h3>Using a mask</h3>
<ul>
<li><b>Mix</b> shows picture A where the mask is black and picture B where it is white.</li>
<li><b>Blend</b> lays one picture over another with a blend mode, only where its mask is white.</li>
<li><b>Math › Multiply</b> keeps a gray map only where the mask is white.</li>
</ul>
<h3>Making a mask</h3>
<ul>
<li><b>Threshold</b> any map for a hard-edged one; <b>Levels</b> for a softer one.</li>
<li><b>Shape Mask</b>, <b>Border Mask</b> and <b>Gradient</b> for simple areas.</li>
<li><b>The Poem › Words</b> or <b>Distance</b> for masks around the text.</li>
<li><b>Grow &amp; Shrink</b> and <b>Blur</b> to tidy a mask’s edges.</li>
</ul>
<p>Masks combine like sets: <b>Max</b> of two masks is their union, <b>Min</b> their overlap, <b>Invert</b> the opposite. See [[blendmodes]].</p>` },
  { id: 'blendmodes', group: 'Building techniques', title: 'Blend modes', body: `
<p>A blend mode decides how a layer combines with what is beneath it. The same modes appear in every image editor.</p>
{{fig:blendmodes}}
<table class="wk-table"><tr><th>Mode</th><th>Effect</th></tr>
<tr><td>Normal</td><td>The layer covers what is beneath.</td></tr>
<tr><td>Multiply</td><td>Darkens: white leaves things unchanged, black makes black. For ink, shadows, grime.</td></tr>
<tr><td>Screen</td><td>Lightens: black leaves things unchanged. For light, glow, stars.</td></tr>
<tr><td>Overlay, Soft Light</td><td>Darkens the darks and lightens the lights; middle gray does nothing. For texture and grain.</td></tr>
<tr><td>Darken, Lighten</td><td>Keeps the darker (or lighter) of the two.</td></tr>
<tr><td>Difference</td><td>Shows how different they are; identical areas go black.</td></tr>
<tr><td>Color Dodge, Burn</td><td>Strong brightening or darkening, for glows and scorches.</td></tr></table>
<p>The whole Surface is also blended onto the page with the blend chosen under Surface.</p>` },
  { id: 'heights', group: 'Building techniques', title: 'Height maps and light', body: `
<p>A <b>height map</b> is a gray map read as a landscape: white is high, black is low. Lit from one side, it looks raised: the side facing the light is bright, the other side dark, and taller parts cast shadows. This is how flat textures become stone, paint and paper.</p>
{{fig:heights}}
<h3>Two ways to light</h3>
<ul>
<li>Wire a gray map into the <b>Surface’s Height</b>: the page lights it with its own dial.</li>
<li>Use the <b>Light Engine</b>: wire a picture (the color) and a height map (the shape). It adds cast shadows, shine, soft shading in crevices (ambient occlusion) and colored light. Use one or the other for the same heights, not both.</li>
</ul>
<h3>Tips for good heights</h3>
<ul>
<li><b>Blur</b> a height map a little: hard steps light badly.</li>
<li><b>Relief</b> on the Light Engine sets how tall the heights stand.</li>
<li><b>High Pass</b> keeps only fine detail, for grain without big hills.</li>
<li>Add maps together (Math › Add) to put small detail on top of big shapes.</li>
</ul>` },
  { id: 'seeds', group: 'Building techniques', title: 'Seeds, Variation and chance', body: `
<p>Random parts (noise, cells, scattered marks) aren’t truly random: they follow a <b>seed</b>, a number that decides the pattern. The same seed always gives the same picture, so a look can be saved and shared exactly.</p>
{{fig:seeds}}
<h3>Key facts</h3>
<ul>
<li>Every random part uses the <b>page’s seed</b> combined with its own place in the graph, so two copies of a part still differ.</li>
<li><b>⟳ Seed</b> (in the corner here, or beside the seed on the page) rolls a new seed: everything random changes together.</li>
<li><b>Variation</b> on a single part changes only that part’s pattern, leaving the rest of the graph as it is.</li>
<li>The parts that draw one of the app’s whole textures have <b>Variant</b> instead: at 0 the part draws exactly what the texture draws for this seed; any other number gives another of its kind.</li>
<li><b>Random Number</b> makes an ordinary setting part of the roll.</li>
</ul>` },
  { id: 'resolution', group: 'Building techniques', title: 'Size and resolution', body: `
<p>The same surface is drawn small in the preview and large (3072 pixels) when the page is saved, and it should look the same at both. So every distance in the Athanor (blur radius, line width, scale) is measured relative to the page, not in screen pixels.</p>
<p>The Surface’s <b>Size</b> scales every distance in the graph at once: at 200, everything is twice as large. It is the quickest way to make a texture coarser or finer.</p>` },

  // ------------------------------------------------------------------ The page and your graph
  { id: 'controls', group: 'The page and your graph', title: 'Putting controls on the page', body: `
<p>A graph is used on the page as the surface <b>From the Athanor</b> (<b>⇱ Show on Page</b> in the bar puts it there; when you press Done after changing a graph the page doesn’t show, the app offers to). The page shows only the controls you give it:</p>
<ul>
<li>Each <b>Knob</b> becomes one of the six sliders under Surface, labelled with the Knob’s name.</li>
<li>Each <b>Hue</b> becomes one of the two hue pickers.</li>
<li>The <b>light dial</b> is always there for anything lit.</li>
</ul>
<h3>Key facts</h3>
<ul>
<li>Only Knobs and Hues whose wires <b>reach the Surface</b> appear. One left unconnected is hidden.</li>
<li>Choose which sliders matter. Two to four good controls are easier to use than six.</li>
<li>Give each Knob a [[ranges|wire range]] that keeps its whole slider useful.</li>
</ul>` },
  { id: 'surface', group: 'The page and your graph', title: 'The Surface', body: `
<p>The Surface is the end of every graph. There is always exactly one: it can’t be deleted or copied, and Clear leaves a new one.</p>
<ul>
<li><b>Image</b>: the texture.</li>
<li><b>Height</b> (optional): a gray map the page lights with its dial. See [[heights]].</li>
<li><b>Name</b>: the surface’s name on the page and on the shelf. Keeping it under a new name renames it here too.</li>
<li><b>Ground</b>: <i>gray</i> means the page tints it with its Light and Dark hues and blends it, like the app’s gray textures; <i>color</i> means it is shown in its own colors.</li>
<li><b>Size</b>: scales the whole graph. See [[resolution]].</li>
</ul>` },
  { id: 'poem', group: 'The page and your graph', title: 'Using the poem', body: `
<p>Surfaces here sit behind poems, so a graph can know where the words are. <b>The Poem</b> part hands on gray maps of the text: where the words are, how far each point is from them, and which line, stanza or rhyme each belongs to.</p>
<p>The most useful is <b>Distance</b>: 0 at the words, rising to 1 far away. Wired into a Mix’s amount (through Invert), it makes a texture fade near the text so the poem stays readable. Wired into Contour Lines, it makes rings spread from the words. <b>Open</b> › Starters to take apart › Ripples from the Words shows both.</p>` },
  { id: 'keeping', group: 'The page and your graph', title: 'Keeping and sharing surfaces', body: `
<ul>
<li><b>Keep</b>, in the bar, saves the graph on this browser’s shelf under its Surface’s name. It then appears under <b>Your Surfaces</b> in the surface menu, with a picture.</li>
<li><b>Open</b> › <b>Your surfaces</b> opens one again.</li>
<li><b>⋯</b> › <b>Copy the wiring</b> copies the graph on the grid as text, to paste anywhere or into another Athanor.</li>
<li><b>⋯</b> › <b>Your shelf…</b> replaces a kept surface with the graph on the grid, copies or shares its <b>wiring</b>, takes it off the shelf, takes pasted wiring in, and saves or loads the whole shelf as a file.</li>
<li>In the surface menu, hold (or right-click) a surface you made to share or copy its wiring.</li>
<li>The graph is also saved inside your look, so spells, shared links and saved JSON carry it.</li>
</ul>
<p><b>Revert</b> (in ⋯) returns to the graph as it was when the Athanor opened.</p>` },

  // ------------------------------------------------------------------ Using the editor
  { id: 'mouse', group: 'Using the editor', title: 'With a mouse and keyboard', body: `
<ul>
<li><b>Wire:</b> drag from an output dot to an input dot.</li>
<li><b>Move a part:</b> drag it by its title bar.</li>
<li><b>Pan:</b> drag the empty grid (or drag with the middle button, or hold Space and drag).</li>
<li><b>Zoom:</b> the mouse wheel, or − ⌖ + in the bar (⌖ fits everything in view).</li>
<li><b>Menus:</b> right-click anything. See [[menus]].</li>
<li><b>Cut a wire:</b> click it, then ✂ or Delete.</li>
</ul>
<h3>Keys</h3>
<table class="wk-table"><tr><td>Ctrl+Z / Ctrl+Shift+Z</td><td>Undo / redo</td></tr><tr><td>Ctrl+D</td><td>Duplicate the selected part</td></tr><tr><td>Delete</td><td>Delete the selected part or wire</td></tr><tr><td>F</td><td>Fit everything in view</td></tr></table>` },
  { id: 'touch', group: 'Using the editor', title: 'On a touch screen', body: `
<ul>
<li><b>Move a part:</b> drag its title bar. Dragging anywhere else pans the grid.</li>
<li><b>Zoom:</b> pinch.</li>
<li><b>Menus:</b> hold anything. See [[menus]].</li>
<li><b>Wire:</b> hold a part and choose <b>Connect its output…</b> (or <b>Connect an input…</b>). A bar at the top shows what is being wired; tap the other part and choose its port. Cancel stops.</li>
<li><b>Add parts:</b> ＋ Parts opens the drawer; tap a part to add it.</li>
<li><b>When things overlap,</b> the Athanor asks which you meant.</li>
</ul>` },
  { id: 'menus', group: 'Using the editor', title: 'The menus', body: `
<p>Right-click (or hold) anything for its menu:</p>
<ul>
<li><b>A part:</b> wire it, duplicate it, pin it in place, reset its settings, delete it, or open <b>About this part</b>.</li>
<li><b>A setting:</b> wire a Knob or the light dial into it, bind it to a page slider, set its [[ranges|wire range]], reset it.</li>
<li><b>A port:</b> wire into or out of it, or cut its wire.</li>
<li><b>A wire:</b> see what it connects, or cut it.</li>
<li><b>The empty grid:</b> add a part there, fit everything in view, tidy the layout.</li>
</ul>` },
  { id: 'tidy', group: 'Using the editor', title: 'Undo, pins and tidying', body: `
<ul>
<li><b>Undo and redo</b> (↶ ↷) step through every change: parts, wires, settings, whole graphs opened.</li>
<li>The <b>lock</b> in a part’s title bar pins it in place.</li>
<li><b>Tidy into columns</b> (the grid’s menu) arranges the graph in columns from left to right; pinned parts stay where they are.</li>
<li>In <b>⋯</b>: <b>Revert</b> goes back to the graph as it was when the Athanor opened; <b>Clear the grid</b> empties it. Both ask first.</li>
</ul>` },
  { id: 'limits', group: 'Using the editor', title: 'Limits and speed', body: `
<p>A graph can hold up to {{nodes}} parts. Heavy graphs are drawn on a coarser grid so the page stays responsive on a phone; the status line in the corner says when. Turning off <b>Steps</b> (the small previews) makes editing faster on slow devices.</p>` },

  // ------------------------------------------------------------------ Glossary
  { id: 'glossary', group: 'Glossary', title: 'Glossary', body: `
<dl class="wk-gloss">
<dt>Ambient occlusion</dt><dd>Darkening in creases and corners, where less light reaches. The Light Engine’s Occlusion.</dd>
<dt>Blend mode</dt><dd>How one layer combines with another. See [[blendmodes]].</dd>
<dt>Channel</dt><dd>One of a picture’s three color components (red, green, blue), each a gray map. See [[picture]].</dd>
<dt>Curve</dt><dd>A rule that turns each number from 0 to 1 into another. See [[curve]].</dd>
<dt>Gamma</dt><dd>A bend in the tones that lightens or darkens the middle grays without moving black or white.</dd>
<dt>Gradient map</dt><dd>A list of colors that a gray map is read through. See [[part:gradmap]].</dd>
<dt>Gray map</dt><dd>A grid of numbers from 0 to 1, one per point, shown as gray. See [[graymap]].</dd>
<dt>Height map</dt><dd>A gray map read as heights, for lighting. See [[heights]].</dd>
<dt>Luminance</dt><dd>How bright a color looks, as one number.</dd>
<dt>Mask</dt><dd>A gray map that says where something applies. See [[masks]].</dd>
<dt>Node</dt><dd>A part: one step in a graph.</dd>
<dt>Octave</dt><dd>One layer of noise. Each octave is finer and fainter than the last; together they give natural detail.</dd>
<dt>Parameter mapping</dt><dd>Driving a setting with a map, so it varies across the page. See [[mapping]].</dd>
<dt>Remapping</dt><dd>Changing the range a wire sweeps. See [[ranges]].</dd>
<dt>Seed</dt><dd>The number that decides a random pattern. See [[seeds]].</dd>
<dt>Threshold</dt><dd>A cutoff: values above it become white, below it black.</dd>
<dt>Voronoi</dt><dd>Dividing the page into cells around scattered points. See [[part:cells]].</dd>
</dl>` },
];

// ------------------------------------------------------------------ rendering
const wkArticle = id => WIKI_ARTICLES.find(a => a.id === id) || null;
/** A part's display label (steps.js). */
const wkPartLabel = k => (STEPS[k] || {}).label || k;
/** Titles for links: articles and parts. */
export function wikiTitle(id){
  if(String(id).startsWith('part:')) return wkPartLabel(id.slice(5));
  if(String(id).startsWith('cat:')) return id.slice(4);
  const a = wkArticle(id); return a ? a.title : id;
}
const wkKindChip = t => { const k = WIKI_KINDS[t] || WIKI_KINDS.field;
  return `<a href="#" class="wk-kind" data-wiki="${k[1]}"><i class="fd-swatch" style="background:var(--t-${t in WIKI_KINDS ? t : 'field'})"></i>${k[0]}</a>`; };

/**
 * FIGURES (Ruby: a picture for each concept): a small graph and what each of its parts makes, drawn live by the
 * texture worker when the page opens (so a figure is always what the parts really do). In an article, {{fig:key}}.
 *   nodes, wires  the graph (as the starters are written: 1-based)
 *   rows          what to show: node numbers, with '+' or '→' between (default '→'; ' ' for a gap); one row per line
 *   labels        a node's own caption, where its part's name isn't enough
 */
export const WIKI_FIGURES = {
  graymap: { caption: 'Perlin Noise makes a gray map; Levels pulls its dark and light points together for more contrast; Threshold cuts it into a mask. Each is a number at every point, shown as gray.',
    nodes: [['perlin', { scale: 40 }], ['levels', { lo: 30, hi: 72 }], ['threshold', { at: 50, soft: 6 }], ['surface', {}]],
    wires: [[1, 1, 2, 1], [2, 1, 3, 1], [3, 1, 4, 1]], rows: [[1, 2, 3]] },
  picture: { caption: 'Gradient Map gives every gray its color: a picture. The Light Engine lights that picture, using the same gray map as its heights.',
    nodes: [['perlin', { scale: 40 }], ['gradmap', {}], ['material', { relief: 200, ambient: 25 }], ['surface', { ground: 'colour' }]],
    wires: [[1, 1, 2, 1], [2, 1, 3, 1], [1, 1, 3, 2], [3, 1, 4, 1]], rows: [[1, 2, 3]] },
  color: { caption: 'Two colors and a gray map go into Tint: the light color where the map is white, the dark color where it is black.',
    nodes: [['colour', { hex: '#24365C' }], ['colour', { hex: '#F2C8A0' }], ['waves', { freq: 8, angle: 30 }], ['tint', {}], ['surface', { ground: 'colour' }]],
    wires: [[3, 1, 4, 1], [2, 1, 4, 2], [1, 1, 4, 3], [4, 1, 5, 1]], rows: [[3, '+', 2, '+', 1, '→', 4]], labels: { 1: 'Color (dark)', 2: 'Color (light)' } },
  number: { caption: 'The same Waves with a number wired into its ⚙ Frequency. A number is one value for the whole page (shown as one flat gray): 0.05 makes a few broad bands, 0.35 many fine ones.',
    nodes: [['number', { value: 5 }], ['waves', {}], ['number', { value: 35 }], ['waves', {}], ['surface', {}]],
    wires: [[1, 1, 2, 2], [3, 1, 4, 2], [2, 1, 5, 1]], rows: [[1, 2], [3, 4]], labels: { 1: 'Number 0.05', 3: 'Number 0.35' } },
  curve: { caption: 'A Curve (here, stairs) reshapes the tones of a smooth Gradient through Tone Curve: each gray moves to the height the curve gives it.',
    nodes: [['gradient', { angle: 0 }], ['curve', { shape: 'stairs', count: 4 }], ['tonecurve', {}], ['surface', {}]],
    wires: [[1, 1, 3, 1], [2, 1, 3, 2], [3, 1, 4, 1]], rows: [[1, '+', 2, '→', 3]] },
  mapping: { caption: 'A Gradient wired into Blur’s ⚙ Radius: the radius follows the map point by point, so the cells are sharp at the left and soft at the right.',
    nodes: [['cells', { scale: 30 }], ['gradient', { angle: 0 }], ['blur', {}], ['surface', {}]],
    wires: [[1, 2, 3, 1], [2, 1, 3, 2], [3, 1, 4, 1]], rows: [[1, '+', 2, '→', 3]] },
  ranges: { caption: 'One number, two wire ranges. The first Waves sweeps its whole Frequency range; the second’s range is set to 16 down to 4, so the same number gives broader bands.',
    nodes: [['number', { value: 40 }], ['waves', {}], ['waves', { '~freq': '16,4' }], ['surface', {}]],
    wires: [[1, 1, 2, 2], [1, 1, 3, 2], [2, 1, 4, 1]], rows: [[1, 2], [1, 3]], labels: { 1: 'Number 0.4', 2: 'Waves (whole range)', 3: 'Waves (16 to 4)' } },
  masks: { caption: 'Blend lays a layer over a base only where its mask is white: here a Spectrum over a colored noise, inside a Shape Mask’s circle.',
    nodes: [['perlin', { scale: 40 }], ['gradmap', {}], ['spectrum', { angle: 45 }], ['shape', { form: 'circle', size: 60, soft: 20 }], ['blend', {}], ['surface', { ground: 'colour' }]],
    wires: [[1, 1, 2, 1], [2, 1, 5, 1], [3, 1, 5, 2], [4, 1, 5, 3], [5, 1, 6, 1]], rows: [[2, '+', 3, '+', 4, '→', 5]], labels: { 2: 'Base', 3: 'Layer', 4: 'Mask' } },
  blendmodes: { caption: 'The same two layers in three modes. Multiply only darkens, Screen only lightens, Overlay does both, keeping the base’s middle tones.',
    nodes: [['perlin', { scale: 40 }], ['gradmap', {}], ['waves', { freq: 10, angle: 45 }], ['blend', { mode: 'multiply' }], ['blend', { mode: 'screen' }], ['blend', { mode: 'overlay' }], ['surface', { ground: 'colour' }]],
    wires: [[1, 1, 2, 1], [2, 1, 4, 1], [3, 1, 4, 2], [2, 1, 5, 1], [3, 1, 5, 2], [2, 1, 6, 1], [3, 1, 6, 2], [4, 1, 7, 1]], rows: [[2, '+', 3, '→', 4, ' ', 5, ' ', 6]],
    labels: { 2: 'Base', 3: 'Layer', 4: 'Multiply', 5: 'Screen', 6: 'Overlay' } },
  heights: { caption: 'A gray map read as heights: the Light Engine raises the white and sinks the black, lights the slopes from the dial and lets the peaks cast shadows.',
    nodes: [['cells', { scale: 22, jitter: 70 }], ['material', { relief: 200, shadow: 85, ambient: 20 }], ['surface', {}]],
    wires: [[1, 1, 2, 2], [2, 1, 3, 1]], rows: [[1, 2]], labels: { 1: 'Cells (as heights)' } },
  seeds: { caption: 'The same Perlin Noise with Variation 0 and Variation 37: the same kind of pattern, a different draw. The page’s seed changes every part at once.',
    nodes: [['perlin', { scale: 40 }], ['perlin', { scale: 40, variation: 37 }], ['surface', {}]],
    wires: [[1, 1, 3, 1]], rows: [[1], [2]], labels: { 1: 'Variation 0', 2: 'Variation 37' } },
};
/** A figure as the page shows it: tiles the editor fills from the worker (data-n: the node), arrows between. */
function wkFigureHtml(key){
  const F = WIKI_FIGURES[key]; if(!F) return '';
  const label = n => (F.labels || {})[n] || ((STEPS[(F.nodes[n - 1] || [])[0]] || {}).label || '');
  const row = r => { let out = '', prev = false;
    for(const x of r){ if(x === '+' || x === '→' || x === ' '){ out += `<span class="wk-fig-op" aria-hidden="true">${x === ' ' ? '' : x}</span>`; prev = false; continue; }
      if(prev) out += '<span class="wk-fig-op" aria-hidden="true">→</span>';
      out += `<span class="wk-fig-step"><canvas data-n="${x}" width="112" height="112"></canvas><small>${wkEsc(label(x))}</small></span>`; prev = true; }
    return `<div class="wk-fig-row">${out}</div>`; };
  return `<figure class="wk-fig" data-fig="${wkEsc(key)}">${F.rows.map(row).join('')}<figcaption>${wkEsc(F.caption)}</figcaption></figure>`;
}
/** [[id]] and [[id|words]] become links; {{k:kind}} a kind chip; {{nodes}} the node limit; {{fig:key}} a figure. */
function wkLinks(html, ctx){
  return html.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (m, id, words) => `<a href="#" data-wiki="${wkEsc(id)}">${wkEsc(words || wikiTitle(id))}</a>`)
    .replace(/\{\{k:(\w+)\}\}/g, (m, t) => wkKindChip(t)).replace(/\{\{nodes\}\}/g, String((ctx && ctx.nodes) || 64))
    .replace(/\{\{fig:(\w+)\}\}/g, (m, k) => wkFigureHtml(k));
}
/** A part's page: what it is, its inputs, outputs and settings, what to try, related pages. */
function wkPartHtml(k, ctx){
  const S = STEPS[k], W = WIKI_PARTS[k] || {}; if(!S) return '<p>No such part.</p>';
  const cat = S.cat, catName = ctx && ctx.catName ? ctx.catName(cat) : cat;
  const ins = S.ins.slice(0, S.dataIns), inT = S.inTypes || [], outT = S.outTypes || [], req = S.required || [];
  const word = n => String(n).replace(/colour/g, 'color').replace(/\bgrey\b/g, 'gray').replace(/^field$/, 'map').replace(/^image$/, 'picture');
  const row = (name, kind, text, extra = '') => `<tr><td><b>${wkEsc(word(name))}</b>${extra}</td><td>${wkKindChip(kind)}</td><td>${wkLinks(wkEsc(text || ''), ctx)}</td></tr>`;
  let h = `<p class="wk-kicker"><a href="#" data-wiki="cat:${wkEsc(cat)}">${wkEsc(catName)}</a> · part</p>`;
  h += `<p class="wk-lead">${wkEsc(W.line || S.doc || '')}</p>`;
  if(W.about) h += `<p>${wkLinks(wkEsc(W.about), ctx)}</p>`;
  if(ins.length) h += `<h3>Inputs</h3><table class="wk-table">` + ins.map((n, i) => row(n, inT[i] || 'field', (W.ins || {})[n], req.includes(i + 1) ? ' <span class="wk-req" title="Required: see Required inputs">required</span>' : '')).join('') + `</table>`;
  if(S.outs.length) h += `<h3>Outputs</h3><table class="wk-table">` + S.outs.map((n, i) => row(n, outT[i] || 'field', (W.outs || {})[n])).join('') + `</table>`;
  const params = S.params || [];
  if(params.length){
    h += `<h3>Settings</h3><table class="wk-table">` + params.map(p => {
      const [key, label, type, def, o] = p, gear = (S.paramPorts || []).includes(key);
      const range = type === 'range' ? `${o.min}–${o.max}, default ${def}` : type === 'select' ? (o.options || []).join(' · ') : 'text';
      return `<tr><td><b>${wkEsc(label)}</b>${gear ? ' <span class="wk-gear" title="Has a ⚙ port: a wire can drive it">⚙</span>' : ''}</td><td class="wk-range">${wkEsc(range)}</td><td>${wkLinks(wkEsc((W.set || {})[key] || ''), ctx)}</td></tr>`;
    }).join('') + `</table>`;
  }
  if((W.tips || []).length) h += `<h3>Try</h3><ul>` + W.tips.map(t => `<li>${wkLinks(wkEsc(t), ctx)}</li>`).join('') + `</ul>`;
  const see = (W.see || []).concat(['ports']);
  h += `<p class="wk-see">See also: ` + [...new Set(see)].map(id => `<a href="#" data-wiki="${wkEsc(id)}">${wkEsc(wikiTitle(id))}</a>`).join(' · ') + `</p>`;
  return h;
}
/** A category's page: what its parts are for, and each part with its line. */
function wkCatHtml(cat, ctx){
  const parts = Object.entries(STEPS).filter(([, s]) => s.cat === cat).sort((a, b) => a[1].label.localeCompare(b[1].label));
  return `<p class="wk-lead">${wkEsc((ctx && ctx.catDoc && ctx.catDoc(cat)) || '')}</p><dl class="wk-gloss">`
    + parts.map(([k, s]) => `<dt><a href="#" data-wiki="part:${k}">${wkEsc(s.label)}</a></dt><dd>${wkEsc((WIKI_PARTS[k] || {}).line || s.doc || '')}</dd>`).join('') + '</dl>';
}
/** One page of the wiki, by id ('welcome', 'part:levels', 'cat:Noise'). */
export function wikiArticleHtml(id, ctx = {}){
  id = String(id || 'welcome');
  if(id.startsWith('part:')) return `<h2>${wkEsc(wkPartLabel(id.slice(5)))}</h2>` + wkPartHtml(id.slice(5), ctx);
  if(id.startsWith('cat:')){ const c = id.slice(4); return `<h2>${wkEsc(ctx.catName ? ctx.catName(c) : c)}</h2>` + wkCatHtml(c, ctx); }
  const a = wkArticle(id) || wkArticle('welcome');
  return `<h2>${wkEsc(a.title)}</h2>` + wkLinks(a.body, ctx);
}
/** The contents: every group, its articles; Parts by category. */
export function wikiContentsHtml(ctx = {}){
  const cats = ctx.categories || [];
  return WIKI_GROUPS.map(g => {
    let items = WIKI_ARTICLES.filter(a => a.group === g).map(a => [a.id, a.title]);
    if(g === 'Parts') items = cats.map(c => ['cat:' + c, ctx.catName ? ctx.catName(c) : c]);
    if(!items.length) return '';
    return `<h4>${wkEsc(g)}</h4><ul>` + items.map(([id, t]) => `<li><a href="#" data-wiki="${wkEsc(id)}">${wkEsc(t)}</a></li>`).join('') + '</ul>';
  }).join('');
}
/** The reading order, as the contents lists it: each group's articles; under Parts, each category's
 *  page followed by its parts (as its page lists them). Previous and next walk it. */
export function wikiOrder(ctx = {}){
  const cats = ctx.categories || [];
  return WIKI_GROUPS.flatMap(g => g === 'Parts'
    ? cats.flatMap(c => ['cat:' + c, ...Object.entries(STEPS).filter(([, s]) => s.cat === c).sort((a, b) => a[1].label.localeCompare(b[1].label)).map(([k]) => 'part:' + k)])
    : WIKI_ARTICLES.filter(a => a.group === g).map(a => a.id));
}
/** The pages either side of one in the reading order: { prev, next }, each { id, title } or null. */
export function wikiNeighbors(id, ctx = {}){
  const order = wikiOrder(ctx), i = order.indexOf(String(id));
  const at = j => (i >= 0 && order[j]) ? { id: order[j], title: String(order[j]).startsWith('cat:') && ctx.catName ? ctx.catName(order[j].slice(4)) : wikiTitle(order[j]) } : null;
  return { prev: at(i - 1), next: at(i + 1) };
}
/** Search: titles first, then words in the text. Returns [{ id, title, where }]. */
export function wikiSearch(q){
  q = String(q || '').trim().toLowerCase(); if(q.length < 2) return [];
  const plain = s => String(s).replace(/<[^>]+>/g, ' ').replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (m, a, b) => b || a);
  const hits = [];
  for(const a of WIKI_ARTICLES){ const t = a.title.toLowerCase(), b = plain(a.body).toLowerCase();
    if(t.includes(q)) hits.push({ id: a.id, title: a.title, score: 3 }); else if(b.includes(q)) hits.push({ id: a.id, title: a.title, score: 1 }); }
  for(const [k, s] of Object.entries(STEPS)){ const W = WIKI_PARTS[k] || {}, t = s.label.toLowerCase(), b = [W.line, W.about, s.doc, ...Object.values(W.set || {})].join(' ').toLowerCase();
    if(t.includes(q)) hits.push({ id: 'part:' + k, title: s.label, score: 3 }); else if(b.includes(q)) hits.push({ id: 'part:' + k, title: s.label, score: 1 }); }
  return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, 30);
}
