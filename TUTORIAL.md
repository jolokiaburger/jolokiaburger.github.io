# Neon Tides — how it is built, and how to change it

This is a walkthrough of the finished project for someone who has never programmed a browser game. You need the project folder, a browser and a plain text editor (Notepad, TextEdit, VS Code, anything that saves plain text). Every time you change a file: save it, then reload the page in the browser (`F5`). If something stops working, press `F12` and look at the **Console** tab; error messages name the file and the line.

Contents

1. Three languages, three jobs
2. Why there is nothing to install or build
3. How `index.html` loads the project
4. How the artwork is constructed and animated
5. How `styles.css` controls composition and the phone layout
6. How `game.js` stores state and responds to you
7. How `cases.js` supplies conditional dialogue and evidence
7b. How `trade.js` and `market.js` run the gold night (4.0)
8. Deduction checks, seeds and saves
9. One interaction, traced from click to autosave
10. Design choices and trade-offs
11. Exercises

---

## 1. Three languages, three jobs

A web page is built from three languages that browsers understand natively.

- **HTML** describes *what is on the page*: a header, a picture, a panel, buttons. In this project `index.html` also contains the entire harbour illustration, because SVG (Scalable Vector Graphics) is a drawing language that lives inside HTML.
- **CSS** describes *how it looks*: colours, fonts, where the picture sits relative to the story, what happens when a button is hovered, and how the page rearranges itself on a phone. That is `styles.css`.
- **JavaScript** describes *what happens*: what a click does, how fuel goes down, when a clue is added, how the game is saved. That is `game.js` (the rules), `cases.js` (the investigations' story, written as data the rules read), `trade.js` (the gold night's story and numbers, also data) and `market.js` (the gold market's arithmetic, kept apart from everything on screen).

An analogy: HTML is the stage and props, CSS is the lighting and paint, JavaScript is the actors following a script — and `cases.js` is the script itself.

## 2. Why there is nothing to install or build

Browsers run HTML, CSS and JavaScript directly. A "build step" is only needed when a project is written in something the browser does not read (TypeScript, Sass, JSX) or when many small files must be bundled into one. This project uses none of that, so double-clicking `index.html` is the whole installation.

Three deliberate choices keep it that way:

- **Ordinary `<script>` tags, not JavaScript modules.** Modules (`<script type="module">`) are blocked by most browsers when a page is opened from a `file://` address, because module loading follows the same security rules as network requests. Classic scripts have no such restriction.
- **Story data is a `.js` file, not a `.json` file.** Loading `cases.json` with `fetch()` also fails on `file://` in Chromium. Instead, `cases.js` simply runs and puts one big object on `window.NEON_TIDES`, which `game.js` reads.
- **No fonts or libraries from the internet.** The page never asks for anything outside its own folder, so it works offline and starts instantly.

## 3. How `index.html` loads the project

Open `index.html`. Near the top, inside `<head>`, the stylesheet is linked:

```html
<link rel="stylesheet" href="styles.css">
```

At the very bottom, just before `</body>`, the four scripts are loaded in this order:

```html
<script src="cases.js"></script>
<script src="trade.js"></script>
<script src="market.js"></script>
<script src="game.js"></script>
```

The order matters. `cases.js` runs first and defines `window.NEON_TIDES`; `trade.js` defines `window.NEON_TIDES_TRADE`; `market.js` defines `window.NeonMarket`. `game.js` runs last and begins with:

```js
const DATA = window.NEON_TIDES;
const TRADE = window.NEON_TIDES_TRADE;   // the gold night: story and market data (trade.js)
const MARKET = window.NeonMarket;        // pricing and gold lots, no DOM (market.js)
```

If `game.js` came first, those would be `undefined` and nothing would work. (`trade.js` and `market.js` don't depend on each other, so their order between themselves doesn't matter.) Scripts sit at the end of the body so that every element they look up (`document.getElementById("harbour")` and so on) already exists.

All of `game.js` is wrapped in a function that calls itself:

```js
(function () {
  "use strict";
  ...
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
```

This keeps its variables private (nothing leaks into other scripts) and runs `init()` once the page is ready. `init()` caches the elements it needs (`cacheDom`), writes the drink's name from the data into the instrument strip, loads settings, validates the story data, checks for a save, wires up events (`bindEvents`), parks the ferry at the bar and shows the title screen.

## 4. How the artwork is constructed and animated

The harbour is one inline `<svg>` with `viewBox="0 0 1440 800"`. Everything inside is drawn in those 1440 × 800 "user units"; the browser scales the whole picture to whatever size the frame has, so it stays crisp on any screen.

**Layers.** The SVG is written in painting order, back to front, with a comment above each layer:

1. Sky: a purple-to-indigo gradient, a few stars, and the **banded moon** — a sunset-gradient circle seen through horizontal slots (`<clipPath id="moonBands">`), a classic retro device
2. Background: warehouses, a gantry crane, a tower crane, a neon-ringed tower, an antenna with a blinking light, distant windows in amber, cyan and pink, a row of far quay lights, and the **Line 9 viaduct** carrying a three-car metro to a terminus above the quay
3. Water — with a faint **neon grid** of city-light lines converging on the horizon, the jellyfish drawn first, and a translucent "surface tint" rectangle over them so they read as *beneath* the surface
4. The four destinations: Ferry Landing 3 (shelter, LED timetable board, station clock, ticket booth, bollards, boarding lights), the Metro Quay (retaining wall with a purple neon strip, stair tower with cyan strip lights, paper lanterns, a glowing vending machine, a payphone, benches, and three night-shift figures), Kurage 33 Noodle (awning, cyan tube-letter sign with an orange neon jellyfish, lanterns, counter, magenta stools, bowls, bamboo steamers, can pyramid, jellyfish tank, waving cat, chit wire, Mei and Teo) and Frostline Cold Store (insulated doors A and B, pipes and valves, rooftop fan, floodlight, chain-link gate, crates 17, 08 and 23)
5. Animated light reflections on the water
6. The player's ferry (`<g id="ferry">`)
7. Foreground pilings, ropes, a tyre fender
8. Film grain, then rain
9. The hotspots — invisible rectangles over each destination that receive clicks

**Reusable pieces.** The `<defs>` block holds gradients, patterns (halftone dots, corrugated metal, awning stripes, chain-link, rain streaks, and a 120-unit tile of faint dots that gives the whole picture its film grain) and small drawings with ids such as `sym-piling`, `sym-stool`, `sym-can`, `sym-can-ox`, `sym-bowl`, `sym-lantern`, `sym-bench`, `sym-jelly`. They are stamped wherever needed:

```html
<use href="#sym-stool" x="752" y="546"/>
<use href="#sym-stool" x="812" y="546"/>
```

Change `sym-stool` once and every stool changes.

**Colour.** The palette is deliberate: nearly black indigo water (`#03020a`–`#1a1240`), desaturated indigo metal (`#26355c`, `#33406a`, `#4a5f8f`), cyan for jellyfish and neon tubes (`#3df5ff`), hot magenta and purple for signage (`#ff2fa8`, `#8a5cff`), sunset orange and amber for the bar's warmth (`#ff7a3d`, `#ffb04a`), and warm off-white text (`#f6e9d8`). The halftone and corrugated patterns at low opacity give surfaces a screen-print feel without costing much.

**Neon lettering.** The KURAGE 33 sign is the same text drawn three times: a wide translucent stroke (`.tube-glow`), a thin bright stroke (`.tube-core`) and a hairline white stroke (`.tube-hot`), with `fill: none`. Stacked, they read as a glass tube. The jellyfish beside the letters is drawn the same way (a bell path and one path for all four tentacles, each drawn twice), and its tentacles sway with a small CSS skew animation.

**Letterboxing without seams.** The sky and water rectangles are drawn *larger than the frame* (from `y=-400` to `y=1200`) and their gradients use `gradientUnits="userSpaceOnUse"`. When the frame is taller or wider than 18:10, the browser shows more sky above and more water below instead of a hard edge.

**Animation** is done in CSS, not JavaScript, so it costs almost nothing:

```css
@keyframes drift {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33%      { transform: translate(7px, -12px) rotate(3deg); }
  66%      { transform: translate(-6px, -5px) rotate(-3deg); }
}
.jelly > use { animation: drift 10s ease-in-out infinite; animation-delay: var(--d, 0s); }
```

Each jellyfish sets its own delay with a custom property so they do not move in lockstep:

```html
<g class="jelly" style="--d:-4.2s" transform="translate(420 748) scale(0.8)"><use href="#sym-jelly"/></g>
```

The same idea drives steam (`.steam`), water reflections (`.refl`, which use `transform-box: fill-box` so they stretch in place), blinking mast lights (`.blink`), the rooftop fan (`.fan path`), the ferry's gentle bob (`.ferry-bob`), the neon's occasional flicker (`.neon`) and the rain (`.rain-rect` slides one pattern period and loops). The metro is one group, `#train`, moved by a 28-second keyframe loop: it waits at the terminus for half the cycle, departs to the left, and the next train arrives from the same side.

A second layer of ambient life uses the same technique on smaller things. Each jellyfish bell breathes (`#sym-jelly .bell`, a `scaleY` pulse anchored at the bottom of the bell) while its glow brightens and dims (`#sym-jelly .glow`). Note the selector: a jellyfish in the picture is a `<use>` copy of the drawing in `<defs>`, and CSS matches the parts of a copy as if they were still in `<defs>` — so `.jelly .bell` ("a bell inside a jellyfish wrapper") never matches anything, and for two versions the bells silently never moved. Style the symbol itself; each copy still gets its own delay, because custom properties like `--d` are inherited from the `<use>` element. The water carries slow waves: `sym-wave` is a line that repeats every 80 units, and `.wave` slides it exactly 80 units per loop, so the animation never visibly jumps. The lanterns swing from their hooks (`.lantern > use`, rotating about the top of the string), the neon's white core buzzes with a stepped opacity (`.buzz`), the wide glow pulses (`.neon .tube-glow`), the neon jellyfish's tentacles skew back and forth (`.neon-tentacles`), the vending machine flickers (`.vend-glow`) and the moon's halo breathes (`.moon-glow`). Every one of these is a few lines of CSS on an element that already existed.

**Weather** works the same way but on long, uneven cycles so it feels occasional rather than mechanical. Two fog banks (`.fog-far` behind the quays, `.fog-near` over the near water) are soft radial-gradient ellipses whose keyframes keep them invisible for a third of an 80- or 110-second cycle and drift them across the picture for the rest; because the cycles differ, sometimes both are present and sometimes neither. The rain sits in `.rain-layer`, which every 38 seconds gusts: the whole layer skews a few degrees and brightens while a second, heavier streak pattern (`.rain-heavy`) fades in and falls faster, then everything settles again. `.lightning` is a sky-sized rectangle that flashes to about a fifth opacity twice in quick succession once a minute — kept faint on purpose. A breakwater beacon's `.beam` swings across the low sky on a nine-second sweep, a `.far-boat` crosses the horizon every two minutes, the chimney's `.puff` ellipses rise and fade, the cold-store floodlight and Door B's spill flicker like tired fluorescent tubes (`.flood`, `.fluoro`), and the small LEDs pulse (`.led-pulse`). Under reduced motion the fog, lightning, gust rain and far boat are hidden outright and the beam rests at a fixed angle, so a still picture is left rather than a frozen mid-drift.

**The picture follows the story.** A few pieces of the drawing change with the night. `cases.js` lists `sceneClasses` — `{ class: "after-last-train", when: { minClock: "01:40" } }` — and `syncSceneClasses()` in `game.js` puts each class on `<body>` while its condition holds; `styles.css` does the rest with one rule each, such as `body.after-last-train #train, body.after-last-train #dex { display: none; }`. So after the last train the platform empties and Dex's bench is bare; after one ending Teo's stool stands empty; in *The Ebb* Crate 17 is gone from the pier and one wild jelly glows green under the pilings. Pieces drawn for one case only carry the class `case-art`, which hides them until a rule shows them. Nothing in `game.js` knows what a crate or a train is.

The ferry is the one thing JavaScript moves. `positionFerry()` sets `style.transform = "translate(x px, y px)"` and CSS does the rest:

```css
#ferry { transition: transform var(--ferry-ms) cubic-bezier(.42, .02, .28, 1); }
.ferry.facing-left .ferry-body { transform: scaleX(-1); }
```

**Framing.** `syncAspect()` in `game.js` keeps the whole picture visible (`preserveAspectRatio="xMidYMid meet"`) except on a phone's tall title screen, where it switches to `slice` and narrows the `viewBox` to `567 0 640 800` so the noodle bar and the moon fill the frame behind the title.

**Reduced motion.** The stylesheet knows one switch: when `<body>` carries the class `reduce-motion`, every animation is turned off, the fog, lightning, gust rain and far boat are hidden, and the ferry jumps instead of gliding. `game.js` decides when to set that class. The Motion setting in the menu has three values: *auto* follows the system's request (`matchMedia("(prefers-reduced-motion: reduce)")`, which Windows sets when *Animation effects* is off and Firefox also sets from `ui.prefersReducedMotion`), *full* ignores the request, and *reduced* forces stillness. `motionReduced()` returns the combined answer and is also used to shorten the crossing timer to almost nothing, so the game never waits for an animation that is not playing. An earlier build used a `@media (prefers-reduced-motion: reduce)` block in the CSS as well; that was removed because a media query cannot be overridden from inside the page, and a player whose browser quietly requested reduced motion had no way to see the animations at all.

**Sound: the boat radio.** There are no audio files in the project. Everything you hear is made on the spot with the Web Audio API, the browser's built-in synthesiser, in the section of `game.js` marked *THE BOAT RADIO*. The dial under the picture cycles through the `STATIONS` list:

```js
const STATIONS = [
  { id: "off",     name: "Off",         sub: "no sound" },
  { id: "rain",    name: "Rain only",   sub: "harbour ambience" },
  { id: "lantern", name: "Lantern FM",  sub: "ambient · plucked strings" },
  { id: "basin",   name: "Basin Lo-Fi", sub: "hypnotic techno" }
];
```

`ensureAudio()` builds the shared plumbing once: a master gain into a compressor into the speakers, a two-second buffer of random numbers (white noise) that is reused everywhere, the rain (that noise looped through a low-pass filter whose cutoff a very slow oscillator nudges up and down, like gusts), and a reverb (a `ConvolverNode` fed with a decaying burst of noise, which the ear accepts as a room). `setStation()` stops whatever is playing, fades the rain to the right level, plays a short burst of static, and starts one of two engines. Each engine returns a `stop` function, so switching stations is just "call stop, start the next".

*Lantern FM* plays plucked strings. `pluckBuffer()` uses the Karplus-Strong trick: fill a very short ring buffer (one wavelength) with noise, then repeatedly average each sample with its neighbour and write the result back. The high frequencies die away first and what remains sounds remarkably like a plucked koto or guzheng. It is computed once per pitch into an `AudioBuffer` and replayed with `pluck()`. A `setInterval` "scheduler" walks up and down a D hirajoshi scale (a Japanese pentatonic) a little ahead of the clock, adding grace notes and rests at random, over a slow filtered drone; every eleven seconds or so `bowl()` strikes a singing bowl made of four sine partials with long decays, and `chime()` adds sparse high notes.

*Basin Lo-Fi* is a sequencer. It divides time into sixteenths at 104 bpm and, for each step of a 32-step loop, decides what to trigger: a kick (a sine that sweeps from 150 Hz down to 42 Hz in a fifth of a second), off-beat hats and a clap (the noise buffer through high-pass or band-pass filters with fast envelopes), a two-bar bass line (a sawtooth through a resonant low-pass filter whose cutoff drops on every note), a detuned sawtooth pad that ducks under each kick, a sparse triangle-wave lead through a feedback echo, and tiny noise clicks for vinyl crackle. The whole station passes through one dull low-pass filter, which is most of what "lo-fi" means. Because everything is scheduled against `ctx.currentTime` rather than played the instant a timer fires, the groove stays tight even when the page is busy.

Browsers only allow sound after the player has clicked or pressed a key, so the radio starts from the dial, the menu or the `R` key, and a remembered station only resumes after the first gesture of the next visit. Settings store the station id, and *Off* is a real silence: the audio context is suspended after the fade.

*Travel effects* use the same graph. `beginCrossing()` calls `sfxCastOff(ms, tug)`: a horn made of two detuned sawtooth waves through a low-pass filter with a soft swell (the tug's is a fifth lower), then an engine that lasts exactly as long as the crossing — a 46 Hz triangle wave whose volume is wobbled nine times a second by a second oscillator, which is what makes it "chug", plus band-passed noise for the wash. `finishCrossing()` calls `sfxMoor()`: a short pitch-dropping thud for the hull touching the pontoon and a bell built from three sine partials with long decays. Both functions begin with `sfxReady()`, which returns false while the radio is *Off*, so one switch controls everything you hear. The first time you cast off with the radio off, a toast points at the dial.

## 5. How `styles.css` controls composition and the phone layout

The stylesheet begins with **tokens** — named colours, fonts and sizes in `:root` — so the palette can be changed in one place:

```css
:root {
  --water: #05030f;
  --surface-700: #26205a;
  --cyan: #3df5ff;
  --magenta: #ff2fa8;
  --amber: #ffb04a;
  --paper: #f6e9d8;
  --font-prose: Georgia, "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif;
  ...
}
```

**Desktop composition** is one CSS grid: a top bar across the whole width, the harbour column taking two thirds and the story panel one third.

```css
.app {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(380px, 1fr);
  grid-template-rows: var(--topbar-h) minmax(0, 1fr);
  height: 100vh;
}
```

The harbour column is a vertical flexbox: the picture frame grows to fill it and the compact **instruments** strip (clock, fuel, Tiger Volt, the radio dial, objective) sits underneath. The story panel is also a flexbox: `.encounter-body` scrolls, while `.encounter-actions` is pinned to the bottom so the choices are always visible. When there is more story text below the fold, `game.js` adds the class `has-more`, and a CSS mask fades the last few lines as a hint.

On the **title screen** the body has `data-mode="title"`. One rule collapses the grid to a single column and hides the panel, so the illustration fills the screen behind the title card:

```css
body[data-mode="title"] .app { grid-template-columns: 1fr; }
body[data-mode="title"] .encounter,
body[data-mode="title"] .instruments,
body[data-mode="title"] .dock-chips { display: none; }
```

**Phones** get a fixed screen, an *app shell*, that never scrolls. Instead of shrinking the desktop screen, the page becomes one column whose pieces stay put — the harbour as a small but complete picture on top, four big destination buttons (the "chips") in one row, a slim dashboard and a one-line objective — and below them a *sheet* that holds the story and its choices and scrolls on its own:

```css
@supports (height: 100dvh) {
  @media (max-width: 899px) {
    html, body { overflow: hidden; }                       /* the page itself never scrolls */
    .app { display: flex; flex-direction: column; height: 100dvh; }
    .harbour-frame { aspect-ratio: 18 / 10; max-height: 31dvh; }
    .hs-tag { display: none; }                             /* labels move to the chips */
    .dock-chips { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .encounter { flex: 1 1 auto; min-height: 0; overflow-y: auto; }   /* the sheet */
    .action-btn.kind-travel { display: none; }             /* the chips already are the travel buttons */
  }
}
```

Why a page that cannot scroll? On Android, scrolling a page makes the browser's address bar slide away and back, which changes the height of the screen while you are touching it; on version 2.1 that made the title menu walk up and down under the player's thumb. A page that never scrolls never moves the bar. `dvh` is the visible height; `@supports` keeps older phones, which do not know `dvh`, on a simpler scrolling layout. `MOBILE.md` tells the whole story with measurements.

The in-picture labels are hidden because at 390 pixels wide they would be unreadable; the chips carry the same names, with the fuel shown as small amber pips like the gauge. When the choices are scrolled out of sight under a long scene, a floating *choices below* button appears (`updateActionsCue()` in `game.js` measures where the first choice is). The notebook becomes a bottom sheet, and the ending card covers the viewport instead of the small picture frame. Turn the phone sideways and a second rule puts the picture on the left and the sheet on the right.

**Interaction states** are defined once for every button: `:hover` (amber border), `:active` (pressed one pixel down), `:focus-visible` (a 3-pixel cyan outline for keyboard users) and `[disabled]` (faded, not-allowed cursor). Hover styles sit inside `@media (hover: hover)`, because on a touch screen a tapped button otherwise keeps its hover look and seems stuck. Hotspots in the picture have the same states drawn in SVG: a dashed cyan outline appears on hover or focus, and the current mooring is marked in amber.

## 6. How `game.js` stores state and responds to you

Everything the game knows about your shift is one plain object, created by `newState()`:

```js
return {
  version: SAVE_VERSION,
  seed: seed,
  variantId: variantId,          // the truth is fixed here and never recomputed
  location: "bar",
  clock: START_CLOCK,
  fuel: DATA.meta.startFuel,
  cans: DATA.meta.startCans,     // energy-drink cans in hand
  canArmed: false,               // a can has been drunk; the next crossing is free of clock time
  flags: {},
  clues: [],                     // { id, foundAt, where }
  used: {},                      // actionId -> times used
  visited: { bar: 1 },
  lastResult: null,              // what the encounter panel is showing
  confront: null,                // confrontation progress, or null
  resolved: false,
  ending: null,
  endedAt: null,
  startedAt: new Date().toISOString()
};
```

The game follows one loop: **an event changes the state, the state is saved, and the screen is redrawn from the state**. `render()` calls `renderInstruments()`, `renderHarbour()` (hotspot labels and the current mooring), `renderChips()`, `renderEncounter()` and `renderNotebook()`. Nothing is ever edited "in place" on screen; every function rebuilds its part of the page from `state`. That is why reloading a save shows exactly the same screen: the same state produces the same picture.

Events are attached once in `bindEvents()`. Hotspots respond to clicks and to `Enter`/`Space`; the document listens for the shortcut keys; each action button is created with its click handler already attached. Hotspots are discovered by their class, so a new destination in the picture needs no new JavaScript.

Elements are built with a small helper instead of pasting HTML strings:

```js
container.appendChild(el("p", { class: "notice " + (item.tone || ""), text: item.text }));
```

`el(tag, attributes, children)` creates the element, sets attributes, and uses `textContent` for text, so story text can contain any characters without being mistaken for HTML.

A separate object, `transient`, holds things that are *not* saved: whether the ferry is currently crossing, the animation timer, and whether we are on the title screen or playing.

**Two kinds of shift.** Since 4.0 there are two shapes of `state`. *Start night shift* calls `startTradeNight()`, which builds a gold night with `newTradeState()`: the same `location`, `clock`, `fuel`, `flags`, `used` and `visited` as above, plus `kind: "trade"`, the night's hidden `truth`, `credits`, `gold` (a list of lots), `trades`, `rumors` (what the notebook has written down), `rel` (relationships), `seen` (the last price you read at each quay) and a few more. A case file calls `startNewGame()` and gets the shape above. `isTrade()` tells them apart, and the render functions branch on it at the top (`renderInstruments`, `renderEncounter`, `renderNotebook`, `showResolution`); everything else — travel, the ferry, things in the picture, lines and conditions, saving — is shared.

## 7. How `cases.js` supplies conditional dialogue and evidence

`cases.js` is data, not logic. It has three parts:

- `meta` — numbers: start time 23:40, dawn 06:00, fuel maximum 6, starting fuel 3, starting cans 0.
- `world` — everything the cases share: `locations` (with the ferry's mooring point in picture coordinates), `travel` costs, `characters`, the `drink`, the `tug`, `objectives`, notebook `threads`, `sceneClasses` (see §4), shared `clues`, shared `actions`, and the default `confrontation` — Teo's lie, which three of the four cases share.
- `variants` — the four complete cases, `kindLie`, `coldSale`, `quietDebt` and `theEbb`. Each has its own `clues`, `scenes`, `actions`, `responses`, `finalChoices` and `endings`, plus `truth`, the id of the correct explanation, and `seeds`, the seeds that always open it. Scene text that several cases share (the opening at Kurage 33, the landing, the metro quay, the pier) lives in variables such as `barFirst` and `metroScene` above the variants, and each variant adds its own ending lines with `.concat(...)`. A case with a lie of its own (`theEbb`) also brings its own `confrontation`, `objectives` and `threads`, and an `omit` list naming the shared actions that belong to Teo's story.

**Text entries** can be plain strings, speech, notices, or conditional blocks:

```js
{ if: { has: ["arrival_tally"], lacks: ["run_sheet"] }, who: "teo",
  text: "A pass got scanned at Landing 3. Passes get scanned. It doesn't put anyone at my counter, or anywhere near me." },
```

`expandLines()` in `game.js` walks a list of entries and keeps only those whose `if` condition holds right now. `conditionHolds()` understands `has`, `hasAny`, `lacks` (clues), `flag`, `notFlag`, `minClock`, `maxClock`, `fuelBelow`, `resolved`, `ending`, and four that think in proofs rather than clues: `proven` and `unproven` (a list of proof tags), `motive` (some clue supports an explanation on offer) and `confronting`. The full list is documented in the comment block at the top of `cases.js`. The same conditions drive the objective line — `objectives` is an ordered list of `{ when, text }` rules and the first that holds is shown — and the `sceneClasses` that change the picture. Time-gated content uses the clock conditions: the departure tally appears after `minClock: "00:55"`, and Dex's action at the metro quay has `when: { maxClock: "01:40" }` because he leaves on the last train.

**Actions** are the things you can do at a place:

```js
{
  id: "landing_read_board", kind: "search", label: "Read the tally on the timetable board", minutes: 10, once: true,
  gives: ["arrival_tally"],
  lines: [
    "Behind the timetable glass, tonight's tally scrolls in Priya's square capitals across the LED board. You read it twice.",
    { who: "priya", text: "You can photograph it. Everyone does." }
  ]
},
```

`kind` decides the button style and grouping (`talk` is free, `search` costs minutes, `system` is a ferry action). `once` removes the action after use. `when` hides it until a condition holds. `gives` adds clues, `sets` raises flags, and `effects` changes numbers (`fuel: 3`, `cans: 1`, `refuel: true`, `clockTo: "00:55"`). `givesWhen` adds a clue only if a condition holds at that moment — Mei's testimony only exists once you have the arrival tally.

**Clues** are the bridge between exploring and deducing:

```js
run_sheet: {
  title: "Signed run sheet, Pier 9",
  text: "CO-OP RUN 4471 — SEALED SAMPLE CASE, MAINLAND LAB TO FROSTLINE.\n...",
  proves: ["met"]
},
```

The notebook prints `text` exactly as written. `proves` is a list of tags — `arrived`, `met`, `motive_protect`, `motive_sale`, `motive_debt` for Teo's lie; `no_boat`, `not_at_gate`, `motive_release` for the night watch's — or nothing at all for red herrings such as Yumi's deliberately ambiguous account of the Frostline man. A clue may carry two tags. The deduction never looks at the words, only at the tags.

**Building a playable case.** `buildCase(variant)` merges the shared world with one variant: shared actions (minus any the variant `omit`s) followed by the variant's actions for each location, the world's confrontation with the variant's changes laid over it, and only the clues that some action in the case can actually hand out. `validateCase()` then checks that the result is coherent: every tag the confrontation `requires` is proved by some clue, at least one clue proves the true explanation, **no clue proves a false one**, every explanation has a response, every action's `gives` names a real clue, every clue the case defines is handed out somewhere, every location has scene text, and every final choice points at an ending. If anything is wrong, the title screen shows the problem. This is what "complete, validated variants" means in practice: you cannot accidentally ship a case that contradicts itself.

## 7b. How `trade.js` and `market.js` run the gold night (4.0)

The gold night is a different game on the same engine: you hold a little gold, hear rumours over noodles and tea, and trade on what you believe. Its files split the work three ways, on purpose:

- `trade.js` is **data**, like `cases.js`: the night's starting purse, the hidden night states (`truths`), the market's numbers, world `events`, `rumors`, `people`, `scenes`, `actions`, `conversations`, `ambience` and the morning wire. The comment block at its top documents every field.
- `market.js` is **arithmetic only**: no DOM, no story text, no `Math.random`. It answers "what does a gram cost at this quay at this minute, on this night?" and does the bookkeeping for lots of gold. You can run it in Node, which makes it easy to print a whole night's prices.
- `game.js` (section *8b · THE GOLD NIGHT*) holds the state and connects the two to the existing screen.

**A price.** `NeonMarket.breakdown(data, truth, seed, place, minute)` adds four things to the base price of 91 credits a gram: the quay's standing offset (Landing 3 sells salvage, so it is a little cheaper), every active event's modifier, and a little smooth noise made from the seed. The dealer's spread makes two numbers out of the middle one:

```
mid  = base × (1 + (local + events + noise) / 100)
buy  = mid + half the spread      // what you pay
sell = mid − half the spread      // what you get
```

An event is an entry like this, with a different effect for each night state (or none, if it never happens that night):

```js
{
  id: "frostline_order", at: "01:00", where: "pier",
  truths: {
    order: { mods: [
      { loc: "pier", pct: 14, ramp: 10, hold: "end" },
      { loc: "*", except: ["pier"], from: "01:20", pct: 6, ramp: 25, hold: "end" }
    ] }
  }
}
```

Read it as: on an `order` night, from 01:00 the price at Pier 9 climbs 14% over ten minutes and stays there; from 01:20 everywhere else follows by 6% over twenty-five minutes. Because a price is just a function of the night, the seed, the place and the minute, the same seed always gives the same prices, and nothing needs saving except the seed and the truth. Try it in the console during a gold night: `NeonTides.trade.quote("pier", "01:15")`.

**What you hear.** A rumour is data too:

```js
r_vault: {
  topic: "salvage", source: "mei", origin: "bar",
  note: "Salvage divers from Landing 3 have found the old Harbour Savings vault off the breakwater. \"Gold bars. A whole vault, they say.\"",
  truth: { order: "exaggerated", vault: "true", both: "partial" }, reliability: 0.55,
  relatedEvent: "vault_salvage", affected: "landing", effect: "supply", expires: "02:00"
}
```

The player only ever sees `note`, with the time and who said it. `truth` and `reliability` are for writers and for `NeonTides.trade.debug()`. Write notes as what was said or seen, never as advice: "Mei says salvage divers found a vault", not "price likely to fall".

**Sitting down.** An action with `sitting` is an order (`"noodles"`, `"tea"`) that costs credits and minutes. After it, `sitDown()` plays the first entry in `conversations` at that place whose `via` lists the order, whose `when` holds, and which hasn't been had yet; if there is none, a small `ambience` line. That is how *Mei talks while you eat* and *Teo talks while you drink tea* without any dialogue menu: the order of the list decides who speaks first.

**New conditions.** `conditionHolds()` gained a few fields that only the gold night uses: `truth: ["order", "both"]` (the night is in one of these states), `rel: { teo: 1 }` and `relBelow` (relationships, never shown as numbers), `heard`, `heardAny`, `notHeard` (rumours in the notebook), `happened: ["frostline_order"]` (the event exists tonight and its time has come) and `goldAtLeast`. An action can also carry `cost` (credits), `rel` (a relationship change), `hears` and `hearsWhen` (rumours it writes into the notebook).

**Gold as lots.** Every purchase is a lot, `{ grams, cost, karat, purity, provenance, where, at }`. `NeonMarket.lots.sell()` sells the oldest gold first and reports what it had cost. Purity and provenance aren't priced yet; they are where assaying and counterfeit coins will go.

**Validation.** `validateTrade()` (part of `validateAll()`, under the key `night:two-rumours`) checks that every rumour, event, dealer, conversation and thing in `trade.js` names things that exist. Run `NeonTides.validateAll()` after editing either data file.

## 8. Deduction checks, seeds and saves

**Deduction** happens in three stages at Mei's counter, all in `game.js`:

1. *Select.* You tick up to `maxEvidence` (3) clues. `submitEvidence()` checks the ticked clues against the tags the case's confrontation `requires` — `["arrived", "met"]` for Teo, `["no_boat", "not_at_gate"]` for the night watch in *The Ebb*:

   ```js
   const shown = conf.requires.filter(function (tag) {
     return c.selected.some(function (id) { return clueProves(id, tag); });
   });
   if (shown.length === conf.requires.length) { c.stage = "explain"; c.feedback = expandLines(challenge.success); }
   else if (shown.length === 0) c.feedback = expandLines(challenge.nothing);
   else {
     const missing = conf.requires.filter(function (tag) { return shown.indexOf(tag) === -1; })[0];
     c.feedback = expandLines(challenge.missing[missing]);
   }
   ```

   Each miss gets the liar's specific rebuttal from `challenge`, keyed by the first proof still missing, which also tells you what to look for.

   Since 3.1 the paper is only half of it. The notebook's **timeline** (`activeCase.timeline`, from `cases.js`) is a list of moments with a question each, and the player answers every one with a name. Once the evidence covers every required tag, `submitEvidence()` walks the lines whose `proof` is one of those tags (`timelineTested()`): the first one left empty gets `challenge.timeline`, the first one answered wrong gets that line's own `wrong`, and only when all of them are right does the stage move to *explain*. The other lines are never gates; `timelineScore()` counts them for the ending card, and the notebook shows the verdicts once the case is closed. The notebook never says whether a line is right, so the only place to find out is in front of the liar.

   Two more verbs arrived in 3.3, both pure data from your side. Give any action a `thing: "cargo"` (a key of `world.things`, which maps an element id in `index.html` to a short name) and, while that action is on offer, `renderThings()` draws a ring and a tag around the drawn crate and makes tapping it perform the action; the button under the story stays. And an action of `kind: "show"` with `shows: { clueId: [lines] }` and an `otherwise` lets the player hold a clue up to a witness: `performShow()` picks the answer, costs no time, and remembers the pair in `state.shown`. Neither needs a line of JavaScript to extend.

   Since 3.4 everything the notebook says about *progress* is a hint, and hints are a setting. `hintsOn()` (next to the camera functions) reads `settings.hints`, which the menu toggles, `loadSettings()` restores and `index.html?hints=off` sets. `renderNotebook()` asks it before writing a thread's status (*settled · Arrival tally*), before marking a timeline line *ready to fill in*, and `performAction()` asks it before raising the toast that a clue has revealed a line; with hints off the notebook shows the same questions with none of the marks and one italic line saying so. Two things never ask: the counter's rebuttals and the ending card's count, because those are the game teaching, not hinting. Keep that split if you add a mark of your own: anything that tells the player *where they stand* goes behind `hintsOn()`; anything the liar says does not. The save is unchanged either way (`state.hinted` is still recorded), so the setting can be flipped mid-case.

2. *Explain.* You pick one of the case's explanations (four for Teo's lie, three in *The Ebb*) and one supporting clue. `submitExplanation()` compares the explanation with `activeCase.truth`, and checks that the clue you chose is one you hold *and* carries that explanation's `proof` tag. A wrong theory gets the variant's `responses[theory].wrong`; a right theory with the wrong clue gets `noProof`; a right theory with a real proof gets `responses[truth].correct` and moves on.

3. *Choice.* Three final choices, each mapped to an ending. `chooseEnding()` marks the case resolved and shows the ending card, adding the `late` line if the clock passed dawn.

Collecting every clue does not solve anything by itself: the player still has to choose which three to show, which theory fits, and which clue actually supports it.

**Seeds.** A seed is any text. It is lower-cased and trimmed. If a case lists it in its `seeds`, that case wins; otherwise the seed is hashed with FNV-1a (a tiny, well-known function), and the hash picks a variant:

```js
function hashSeed(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
function pickVariantIndex(seed) {
  const text = normaliseSeed(seed);
  for (let i = 0; i < DATA.variants.length; i++) {
    if ((DATA.variants[i].seeds || []).indexOf(text) !== -1) return i;   // a pinned seed
  }
  return hashSeed(text) % DATA.variants.length;
}
```

Why pin seeds at all? `hash % 4` gives different answers from `hash % 2`: when the third and fourth cases were added, `bellwater` would silently have moved from *The Cold Sale* to another case. Pinned, the four documented seeds — `high-tide`, `bellwater`, `low-water`, `slack-water` — keep their cases forever, and the *Case files* on the title screen list them. The chosen `variantId` is also written into the state and never recomputed, so a saved game keeps its truth even if the list of variants changes later.

**Saves.** `saveGame()` runs after every change and writes `JSON.stringify(state)` to `localStorage` under one key. Reading is defensive: `readSave()` parses the text and `saveProblem()` rejects anything with the wrong version (`SAVE_VERSION` is 2; the first release's saves are cleared with a notice), an unknown case, an unknown location or clue, or missing fields. The title screen only offers **Continue** for a save that passes. All storage access goes through three tiny wrappers:

```js
function storageSet(key, value) {
  try { window.localStorage.setItem(key, value); return true; } catch (err) { markStorageBroken(err); return false; }
}
```

If the browser throws (private mode, blocked storage), `storage.ok` becomes `false`, a message appears once, and the game keeps running from memory. Settings (radio station, motion) are saved under a second key so a broken save never takes your preferences with it, and the case files — which endings you have found in which case — under a third, so starting a new shift never erases them.

## 9. One interaction, traced from click to autosave

You are at Kurage 33. You click **Metro Quay · Line 9** in the picture.

1. The hotspot's click listener (set up in `bindEvents`) calls `travelTo("metro")`.
2. `travelTo` asks `canTravel("metro")`, which finds the route `bar ↔ metro` in `world.travel` (1 fuel, 10 minutes) and checks you have the fuel and are not mid-crossing or at the counter.
3. Fuel and clock are deducted (minutes are 0 if a Tiger Volt was armed), `state.location` becomes `"metro"`, the visit counter increases, `state.lastResult` is cleared, and `saveGame()` writes the new state. Even if you closed the tab now, the save already says you are at the metro quay.
4. `beginCrossing()` records the trip in `transient.travelling`, adds the class `travelling` to `<body>` (which switches off the hotspots and shows the wake), and calls `positionFerry("metro", "bar", true)`. That sets the ferry's `transform`; CSS animates it across the water over 2.2 seconds and flips the hull because the quay is to the left.
5. `render()` runs. The encounter panel shows "Crossing to Metro Quay, Line 9 terminus" with the approach text and the cost; the hotspot labels update; the instruments show the new clock and fuel.
6. After the timer, `finishCrossing()` clears the transient trip, removes the class, and calls `render()` again. `renderScene()` sees this is your first visit and prints `metroScene.first` — including the line about the rider only while the clock is before 01:40; `renderActions()` lists the nurse, the old man, the vending machine, Dex, and the ferry actions with their costs.
7. You click **Talk to the rider on the bench**. Its button calls `performAction("metro_talk_dex")`.
8. `performAction` expands the action's lines first (so text reflects the moment of speaking), adds 0 minutes (talking is free), marks the action as used (it had `once: true`, so it disappears), then calls `addClue("dex_message")`, which pushes `{ id, foundAt, where }` onto `state.clues`.
9. `state.lastResult` stores the lines and the new clue id. `saveGame()` writes everything.
10. `render()` again: `renderResult()` prints Dex's lines and a paper-coloured **Added to notebook** block with the message's exact wording; `renderNotebook()` rebuilds the drawer (the badge count rises, the thread *Why is Teo lying?* reads *1 lead*); `currentObjective()` picks the objective line from what you now know, by walking the case's `objectives` rules.

Reload the page: the title shows **Continue shift** with the current clock, and `continueGame()` rebuilds exactly this screen from the saved state.

**The same idea on a gold night.** You are at Kurage 33 and click **Milk tea, and stay a while**. `performAction("bar_tea")` hands over to `performTradeAction()`, which expands the action's lines, takes 6 credits, moves the clock 20 minutes, applies the action's `rel` and `sets`, lets `advanceMarket()` note any events the clock has reached, then calls `sitDown("tea")`. The first conversation at the bar waiting for tea is Teo's (`cv_teo_frostline`); its lines are appended and its rumour, `r_frostline`, is written into `state.rumors` with the time and place. `observeMarket()` reads Mei's board: if the sell price moved by 2 or more since you last read it, `state.marketNote` says so. Then the usual: save, render. The dashboard's gold cell shows the new board, the encounter shows Teo's lines and an *In your notebook* card, and the notebook's *Heard* list has one more line.

## 10. Design choices and trade-offs

- **Story as data, rules as code.** Writers can change `cases.js` without touching a line of logic, and `validateCase` catches contradictions at start-up. The cost is a small "language" of entries and conditions to learn; it is documented at the top of `cases.js`.
- **Inline SVG instead of image files.** The drawing is editable text, styled by the same CSS, and its parts can be clicked and animated. The cost is a long `index.html`.
- **Rebuild the screen from state instead of patching it.** Simple to reason about and impossible to get out of sync with the save. Two consequences had to be handled: focus is restored after a rebuild (`renderKeepingFocus`), and the story panel scrolls back to the top.
- **Whole variants instead of mix-and-match pieces.** Randomly combining motives, clues and endings could produce a case where the evidence contradicts the truth. Each variant is a complete, checked story; the seed only picks one.
- **The clock only moves on labelled actions.** Reading, talking and thinking are free, so nobody is punished for reading slowly. Costs appear on the button before you press it. A witness who leaves on the last train adds tension without ever locking away essential evidence — the two proofs and several motive clues stay available all night.
- **A recovery route rather than a dead end.** An empty tank away from the pump would otherwise strand the player. The tug costs time, not the game.
- **`localStorage`, with a fallback.** It is the simplest persistent storage a page has, but it can be blocked. The game treats saving as a convenience, never a requirement.
- **Prices from a formula, not a dice roll** (the gold night). A random walk would make every price unexplainable and every save different. A price that is a pure function of the night's truth, the seed, the place and the minute can be printed, tested and debugged, and it moves only when the world does (plus a little seeded noise so the board breathes).
- **Rumours are notes, not hints.** The player reads what somebody said, never what it means. The hidden truth of each rumour lives in the data for writers and the debug view, and a test checks the notebook never shows it.
- **CSS animation, few elements, no SVG filters at all.** Cheap enough for a phone, and it all switches off under reduced motion. The first build drew the film grain with an `feTurbulence` filter over the whole picture; Chromium renders that on the GPU once, but Firefox re-renders SVG filters in software every time anything in the picture changes, which with a dozen looping animations meant every frame and froze the whole scene. The grain is now a repeating pattern of faint dots, rasterised once. Rule of thumb: patterns and gradients are cheap everywhere, filters are not.

## 11. Exercises

Each exercise names the file to edit and how to see the result. Reload after saving.

### Exercise 1 — change a line of dialogue

Open `cases.js` and find `var barFirst = [`. This is the opening scene at Kurage 33, shared by the three cases that use Teo's lie. Change Teo's line

```js
{ who: "teo", text: "Skipper. Sit. No — don't sit, you'll want to be moving." },
```

to anything you like. Save, reload, start a shift with any seed and read the first screen. To change something in only one case, look inside `kindLie.actions.bar` or `coldSale.actions.bar` instead — for example Teo's answer to *Ask Teo about Ari* differs between them. To give a character a new voice colour, change `color` in `world.characters`.

### Exercise 2 — adjust the palette

In `styles.css`, change `--magenta: #ff2fa8;` to a warmer `#ff5d5d`, or `--cyan: #3df5ff;` to a green `#7dffb0`. Interface accents change everywhere at once. The drawing uses literal colours in `index.html`; search for `awningStripes` and change `#ff7a3d` (orange) to `#ff2fa8` (magenta) to repaint the awning, or change the three `stop-color` values in `moonGrad` to recolour the moon. Check the title screen and the bar in play. Keep the contrast between text and background: warm off-white on dark indigo is what keeps the story readable.

### Exercise 3 — add a clue

1. In `kindLie.clues`, add:

   ```js
   milk_tea_receipt: {
     title: "Milk-tea receipt from the counter",
     text: "KURAGE 33 — 22:49 — 1 MILK TEA, 2 × NO. 8 (TAKE AWAY). PAID: DISPATCH ACCOUNT.",
     proves: []
   },
   ```

2. Find the action with `id: "bar_look"` in `kindLie.actions.bar` and add `gives: ["milk_tea_receipt"],` above its `lines`.
3. Reload, start `high-tide`, accept the job, choose **Look around the bar**. The clue appears in the encounter and in the notebook (`N`).

Now make it count: change `proves: []` to `proves: ["motive_protect"]`. At the counter, the receipt can support the *protect* explanation. Finally, try `proves: ["motive_sale"]` and reload: the title screen reports "a clue proves the false explanation 'sale'". That message comes from `validateCase()` — it is the guard against incoherent cases.

### Exercise 4 — add a destination

A fifth place, Slip 4, needs data, a scene, and a hotspot. `game.js` needs no changes: it discovers hotspots by class and routes by data.

1. **`cases.js`, `world.locations`:** add

   ```js
   slip4: {
     id: "slip4", name: "Slip 4", tag: "Slip 4", short: "Slip 4", kicker: "South basin", title: "Slip 4",
     ferry: { x: 1000, y: 700 },
     approach: "Slip 4 is a ladder, a ring bolt and nobody."
   }
   ```

2. **`world.travel`:** add routes, e.g. `{ between: ["bar", "slip4"], fuel: 1, minutes: 10 }` and one from each other place.
3. **Both variants, `scenes`:** add `slip4: { first: ["..."], again: ["..."] }` — `validateCase` insists on scene text for every location. (Or define `var slipScene = {...}` next to `metroScene` and reuse it in both, as the other shared scenes do.)
4. **Optionally, actions:** `actions.slip4: [ { id: "slip4_look", kind: "search", label: "Look along the ladder", minutes: 5, once: true, lines: ["..."] } ]` in `world.actions` or in a variant.
5. **`index.html`:** inside `<g id="hotspots">`, copy one `<g class="hotspot" ...>` block, set `data-dest="slip4"`, and move its `hs-hit`, `hs-outline` and `hs-tag` to where you drew the slip (try a small pontoon near `x=1000, y=700` in the foreground water, drawn as a few rectangles above the hotspot group).
6. **`styles.css`:** with five chips on phones, change `repeat(4, minmax(0, 1fr))` in the phone shell's `.dock-chips` rule (section 13b) to `repeat(5, minmax(0, 1fr))` — they get narrower; check the names still fit at 360 pixels — and `repeat(2, 1fr)` in the older scrolling layout to `repeat(3, 1fr)`.

Reload: the new tag appears in the picture with its cost, the phone layout grows a fifth chip, and the ferry sails there.

### Exercise 5 — write a fifth case with Teo's lie

This exercise used to be "write a third case", and it was followed to the letter: *The Quiet Debt* (`var quietDebt` in `cases.js`, seed `low-water`) is the result, so read it as the worked example. A new case that keeps Teo's lie needs a *new explanation*, otherwise its evidence could not be told apart from an existing case.

1. In `world.confrontation.explanations`, add a fifth explanation with a new proof tag, for example `{ id: "rescue", label: "Ari was never the courier you think. You were getting someone else off the Basin, and Ari carried them.", proof: "motive_rescue" }`.
2. Copy the whole `var quietDebt = { ... };` block, rename it, give it a new `id`, `title`, `truth: "rescue"` and a new pinned seed in `seeds`.
3. Replace its motive clues so they prove `motive_rescue` (and none prove `motive_protect`, `motive_sale`, `motive_debt` or `motive_harm`). Rewrite testimony (Dex, Matte, Mei), `responses` (a `correct` for your truth, a `wrong` for each of the other four), `finalChoices` and `endings`. Write endings that hold at any hour: the player may close the case at 01:00 or at 06:30, so leave out fixed times, and give a paragraph that only makes sense before the dawn truck an `if: { maxClock: "06:00" }` (and, if it needs one, a late twin with `minClock`).
4. The three existing Teo cases now also need `responses.rescue = { wrong: [...] }`, because a player can pick the new theory in any of them. `validateCase` will list exactly what is missing on the title screen until every case is complete.
5. Add it to the list at the bottom of `cases.js`. Thanks to pinned seeds, the four existing seeds keep their cases; `NeonTides.pickVariantIndex("your-seed")` in the console tells you which index a seed gives.

The notebook's *Why is Teo lying?* thread counts leads for every explanation on offer by itself (`leads: true`), so there is no list to update any more. Run `NeonTides.validateAll()` in the console: empty lists mean the story is coherent. Then play it through to each ending, add a test group to `tools/test.mjs` (copy `caseC`), and add the walkthrough to `TESTING.md`.

### Exercise 6 — add a radio station

The radio is a list plus one function per station, so a new station is three edits in `game.js`.

1. Add an entry to `STATIONS`, before `"off"` wraps round: `{ id: "fog", name: "Fog Horn", sub: "drones and bells" }`.
2. Write `startFogHorn()` next to `startLanternFM()`. Copy the drone part of Lantern FM (three oscillators through a low-pass filter into an `out` gain that fades in), change the frequencies to a low fifth such as `55` and `82.41`, and replace the melody interval with a slow `setInterval` that calls `bowl()` on a random note every eight seconds. Return a `stop` function that clears the interval, fades `out` and stops the oscillators, exactly as the other two engines do.
3. In `setStation()`, add `if (station.id === "fog") radio.stop = startFogHorn();` beside the two existing lines.

Reload, start a shift, and press `R` until the dial reads *Fog Horn*. If nothing plays, open the console: a typo in a node name is the usual cause, and Web Audio errors name the method that failed. For a melody instead of bells, borrow the `melody` interval from Lantern FM and give it a different `scale` array — try a major pentatonic such as `[130.81, 146.83, 164.81, 196.0, 220.0, 261.63]`.

### Exercise 7 — write a case with a lie of its own

Three cases share Teo's lie; a player who has broken it once knows its shape. *The Ebb* (`var theEbb`, seed `slack-water`) shows the other way: a different liar, different proofs, and a different place to confront them. Read it next to this list.

1. **Pick the liar and the lie**, and the two things that, shown together, break it. In *The Ebb*, Matte says a boat took Crate 17 while he watched from the gate; you break it by proving no boat came (`no_boat`) and that he was not at the gate (`not_at_gate`). Give each proof two or three sources at different places, so there is more than one route.
2. **Leave out what belongs to Teo's story** with `omit: [...]` — her briefing (`bar_accept`, `bar_ask_job`, `bar_report`), the Landing 3 tally actions, Matte's shared lines — and write your own versions. Shared actions that fit any night (the fuel pump, the vending machine) stay.
3. **Write the confrontation** as `confrontation: { at: "pier", requires: [...], challenge: { nothing, missing: { tag: [...] }, success }, explanations: [...], noProof, ... }`, plus the labels (`actionLabel`, `submitLabel`, `stageLabels`, `counterLabel`…). Anything you leave out comes from Teo's version.
4. **Write `objectives`** (ordered `{ when, text }` rules: use `proven`, `unproven`, `motive` and `confronting`) and **`threads`** (one per proof, plus a `leads: true` thread for the motive).
5. **Give the picture something to show** with `sceneClasses`: The Ebb hides Crate 17, drops crate 08 to the deck, bandages Matte's hand and lets one wild jelly circle under the pier. Each piece is an id or a `.case-art` group in `index.html` and one rule in `styles.css`.
6. Pin a seed, add the case to `variants`, run `NeonTides.validateAll()`, and copy the `caseD` test group in `tools/test.mjs` for yours.

The confrontation does not have to be at the bar, and the liar does not have to be Teo: Priya could have logged a passenger who was never aboard; Dex could need an alibi on the last train.

### Exercise 8 — add a rumour to the gold night

Open `trade.js`. In `rumors`, add an entry, for example a ferry crew's gossip:

```js
r_ferry_crew: {
  topic: "salvage", source: "priya", origin: "bar",
  note: "A ferry crew at the next stool says the Long Patience took on extra winch cable at Landing 3 last week. \"You don't buy cable for trays.\"",
  truth: { order: "false", vault: "true", both: "partial" }, reliability: 0.5,
  relatedEvent: "vault_salvage", affected: "landing", effect: "supply", expires: "02:00"
},
```

(`source` must be a character, or `"you"` for something the player saw; Priya stands in here because a ferry crew has no character entry. To give them one, add `crew: { name: "Ferry crew", role: "…", color: "#9fd0ff" }` to `characters` in `trade.js` and use `source: "crew"`.)

Now make it reachable. In `conversations`, add an entry **after** `cv_mei_vault`, so Mei's rumour still comes first:

```js
{
  id: "cv_ferry_crew", at: "bar", via: ["noodles"],
  when: { heard: ["r_vault"], maxClock: "01:00" },
  lines: [ "Four ferry hands come in dripping and take the stools beside you. One of them hasn't stopped talking since the rain started." ],
  hears: ["r_ferry_crew"]
},
```

Reload, start a night, order noodles twice: the second bowl should bring the crew. `NeonTides.validateAll()['night:two-rumours']` must be an empty list; it complains if `hears` names a rumour that doesn't exist or the conversation waits for an order nobody can place there.

### Exercise 9 — add a world event

Events change prices; rumours are how the player hears about them first. Add a storm that closes in at two:

```js
{
  id: "storm_front", at: "02:00", where: "landing",
  cause: "A squall line comes in off the shelf; nothing lands at Landing 3 for an hour.",
  truths: {
    order: { mods: [{ loc: "*", pct: 2, ramp: 20, hold: 60, decay: 40, residual: 0 }] },
    vault: { mods: [{ loc: "*", pct: 2, ramp: 20, hold: 60, decay: 40, residual: 0 }] },
    both:  { mods: [{ loc: "*", pct: 2, ramp: 20, hold: 60, decay: 40, residual: 0 }] }
  }
}
```

Print the effect before you play it: in the console, `NeonTides.trade.start("frost-order")`, then `NeonTides.trade.quote("bar", "01:55").mid` and `NeonTides.trade.quote("bar", "02:30").mid`. Then foreshadow it: a rumour from Old Lam ("the glass is dropping"), given at the Metro Quay with `hears`. Finally, say what happened in the morning: add a sentence to each night state's `wire` in `ending.byTruth`. A good event always has three pieces: a cause someone can hear about, a price that moves, and a line in the morning that explains it.
