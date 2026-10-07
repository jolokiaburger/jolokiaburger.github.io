# Neon Tides — the phone build

This document is the phone-specific companion to `HANDOFF.md`. It exists because version 2.1 was
built, tested and confirmed entirely on desktop: 121 automated checks passed while the game was, on a
real Android phone, close to unusable. Everything here was produced in one session on 2026-09-18,
after the project owner play-tested the demo on Android and reported three symptoms.

Read `HANDOFF.md` first for the project as a whole. This document covers only what is different,
broken or undecided on a phone, and what to do about it.

> **Status, version 3.0.1 (2026-10-06).** The fixed app shell recommended in §8 is built (styles.css
> section 13b), with its landscape branch, the first-run card, hover and overscroll guards, audio
> resume, the animation budget, a manifest and an Android font fallback (§11). **The owner has now
> played it on the Android phone: it works and the menu no longer moves.** The one thing it showed,
> a flickering title screen, was traced to a single stroke-colour animation on the neon sign and is
> fixed in 3.0.1: see §12. The fix has been measured in emulation only; a second look at the phone
> is the cheap confirmation.

Contents

1. The owner's report
2. How the phone build was measured
3. The three symptoms, with their root causes
4. What version 2.2 changed
5. Every finding, by symptom
6. Findings that were investigated and refuted
7. Choosing the phone layout: three designs
8. The recommendation: a fixed app shell
9. The task list
10. What is still unverified
11. What version 3.0 built, measured
12. The real-device session and the flicker (3.0.1)

---

## 1. The owner's report

Verbatim, after play-testing on Android:

> it sort of works. its a bit glitchy, the main meny jumps up and down when scrolling or clicking on
> anything. some of the texts, like how to play, opens showing the last sentence instead of starting
> to view from the top. the layout is also a bit confusing, especially on a phone, since the user has
> to scroll down and may not understand how things work, but it might work.

Three symptoms, referred to throughout this document as **symptom 1** (jumping), **symptom 2** (text
panels opening at the bottom) and **symptom 3** (confusing layout).

## 2. How the phone build was measured

Nothing in this document is estimated. Two methods were used, and both are repeatable.

**The project's own harness.** `tools/harness.mjs` already supports a phone viewport, and it was used
directly from `file://`:

```js
import { launch, openPage, sleep } from "file:///C:/Users/mm/Desktop/test123/tools/harness.mjs";
const h = await launch();
const page = await openPage(h.cdp, { width: 390, height: 650, mobile: true });
const n = await page.eval(`document.documentElement.scrollHeight`);
await page.close();
await h.close();
```

Note `openPage` takes `{ width, height, mobile }`, and `launch()` returns `{ cdp, close }` — it is
`await h.close()`, not `kill()`. Import by a `file://` URL: Node's ESM loader rejects a bare Windows
path.

**A local static server.** Android cannot open `file://` the way a desktop can, so a server is the
only honest way to look at the real thing on the real device. `.claude/launch.json` in this repo
starts one:

```bash
python -m http.server 8123
```

Then open `http://<your-PC-ip>:8123/index.html` on a phone on the same network. This is also the
fastest way for the owner to re-check any fix here on the actual hardware.

**One trap worth recording.** `tools/test.mjs` fails in confusing, inconsistent ways — different
check counts, unrelated audio failures, `TypeError: ... reading 'click'` — if any other Chromium
instance is holding the DevTools port the harness uses. During this session a browser preview pane
was open on the same machine and produced two phantom audio failures and one run that stopped at 107
checks. Close every other Chromium before trusting a run. A run that reports a check count other than
the expected total is a broken run, not a regression.

## 3. The three symptoms, with their root causes

### Symptom 1 — the main menu jumps up and down

Two independent mechanisms, both real, both in the stylesheet.

**(a) The document was one URL-bar taller than the screen.** `html { height: 100% }` and
`body { min-height: 100% }` resolve against the initial containing block, which on Android is the
*large* viewport — the height with the URL bar hidden. The visible area is the *small* viewport. So
even the title screen, which has no content to scroll, was scrollable by exactly the height of the
URL bar. Scrolling retracts the bar, which makes the document fit, which brings the bar back, which
makes it scrollable again. That is the oscillation.

**(b) The title picture was sized in `dvh`.** `body[data-mode="title"] .harbour-frame` was
`calc(100dvh - var(--topbar-h))`. `dvh` re-resolves *continuously* while the URL bar animates, and
the title card is bottom-anchored inside that frame (`justify-content: flex-end`). Measured, with the
viewport simulating the bar at 650px and 712px: the **START NIGHT SHIFT button moved 62px**, from
y=399 to y=461. That is the menu walking up and down under the player's thumb.

A `100vh` fallback does **not** help. `vh` *is* the large viewport by definition, so a vh fallback
preserves the bug exactly on the older phones this project deliberately supports.

### Symptom 2 — long panels open at their last sentence

`openModal()` ended with `first.focus()` on the first button in `#modal-actions`, which is the **last
child** of `.modal-card` — and `.modal-card` is the scroll container (`max-height: 90vh;
overflow-y: auto`). A `.focus()` without `{ preventScroll: true }` makes the browser scroll that
container to reveal the focused element, so the card opened at its end.

Measured at 390×650 before the fix: "How to play" opened at `scrollTop: 326` of a `maxScroll` of
`326` — pinned to the very bottom, showing the "Keys: 1–9…" bullet, with `#modal-title` above the
visible area. At 360×640 it was worse: `scrollTop: 531` of `531`. This was never phone-specific; at
1280×800 the same modal opened at `scrollTop: 90` of `90`.

The ending card (`showResolution`) had the identical defect and was worse in practice, because
`#btn-res-continue` sits below four paragraphs of ending text and a stats table.

### Symptom 3 — the layout is confusing

Not a bug; the phone port. Measured at 390×812 in play mode, seed `high-tide`:

| | |
| --- | --- |
| Document height | **2119px** — 2.6 screens |
| Harbour picture | 208px (26% of the screen) |
| Chips + instruments below it | 322px — **the dashboard is larger than the picture** |
| Story text block | 915px |
| First action button | y = **1644px**, over two full screens below the fold |

With the URL bar showing (~650px of usable height) that is roughly three screens. The phone port also
disables the only affordance that hinted at more content: `.encounter-body.has-more`, the bottom fade,
is set to `mask-image: none` inside the phone media query.

So the player sees a picture they cannot tell is interactive (`.hs-tag` and `.hs-outline` are
`display: none` on phones), a dashboard, and no indication that the only things they can actually do
are two screens further down. That is exactly what the owner described.

## 4. What version 2.2 changed

Seven hunks in two files. All three symptoms are addressed; symptom 3 is only *partly* addressed,
because it needs the layout work in §8, not a patch.

**`game.js`**

- `openModal()` — reset the card and focus without scrolling. The reset runs **after** the focus
  call, deliberately: `preventScroll` is Chrome 64+, and on older engines the options object is
  ignored and `focus()` scrolls anyway, undoing a reset that ran first.
- `openNotebook()` and `showResolution()` — the same treatment. The ending needs two resets because
  the stylesheet puts the scrolling on `.resolution-card` on desktop and on `.resolution` on phones.
- `cacheDom()` — caches `dom.modalCard` and `dom.resCard`, matching how the rest of the file caches
  nodes.

**`styles.css`**

- Deleted `html { height: 100% }` and `body { min-height: 100% }`. The body background already
  propagates to the canvas, so nothing visual depends on them, and nothing in the stylesheet resolves
  a percentage against the body's height.
- `body[data-mode="title"] .harbour-frame` is now `aspect-ratio: 18 / 10; height: auto;` followed by
  `height: calc(100svh - var(--topbar-h))`. `svh` is the small viewport and never re-resolves.
  Engines without `svh` (Chrome < 108) fall back to the ordinary 18:10 picture — shorter, but stable.
  There is deliberately **no `vh` fallback**, for the reason in §3.
- `.modal-card` gained `max-height: 90svh` after its `90vh`, and the phone `.notebook` rule now uses
  `88svh` instead of `88dvh`. On Android `vh` is the large viewport, so a 90vh card could put its own
  close button under the URL bar.

**Verified.** 121/121 checks pass. Through the harness at 390×650: "How to play" now opens at
`scrollTop: 0`, first paragraph visible, focus still on "Back" so keyboard access is unchanged; the
notebook opens at `scrollTop: 0`; no page exceptions.

**Not verified, and this matters.** `svh`, `dvh` and `lvh` are all identical in a desktop browser
emulating a phone — the difference only exists on a browser with retractable chrome. The symptom 1
fix is sound reasoning and zero-risk, but **the only real test is the owner on the actual Android
device.** If the menu still moves, the answer is the structural one in §8, which does not depend on
viewport units behaving.

## 5. Every finding, by symptom

Four independent audits produced 46 findings; 24 were then re-checked by an adversarial verifier
whose default was to refute. "Confirmed, fix needs adjusting" means the diagnosis survived but the
proposed patch had a flaw — read the verifier's correction before implementing one of those.
Findings marked "not re-checked" were below the verification cut and carry no verdict.

_(Line numbers are as of version 2.1, before the §4 patch. Anything in `styles.css` past line 44 has
shifted by a few lines since.)_

### Symptom 1 — the layout jumps

| # | Severity | Finding | Where | Status |
| --- | --- | --- | --- | --- |
| 1 | critical | The page is permanently ~1 URL-bar taller than the screen, and the title frame is sized in dvh — that is the up/down oscillation | `styles.css:44` | confirmed, fix needs adjusting |
| 2 | high | `.app { height: 100dvh }` applies to landscape phones, because the phone breakpoint is width-only | `styles.css:68` | confirmed, fix needs adjusting |
| 3 | high | focusEncounter() fires a smooth page scroll after every click, which itself triggers the URL-bar retraction | `game.js:955` | confirmed, fix needs adjusting |
| 4 | high | Every crossing empties the action list for 2.2s, collapsing the page and then re-growing it | `game.js:641` | confirmed, fix needs adjusting |
| 5 | high | The chips and the objective line change height on every render, shifting everything below them | `styles.css:432` | **refuted** |
| 6 | medium | The resize handler runs a full inline-SVG invalidation and a forced layout on every frame of the URL-bar animation and on every keyboard open | `game.js:1568` | **refuted** |
| 7 | medium | Notebook, modal and toast are sized against the large viewport, so they resize or sit off-screen as the bar moves | `styles.css:453` | not re-checked |
| 8 | medium | viewport-fit=cover is declared but no rule ever reads env(safe-area-inset-*) | `index.html:5` | not re-checked |
| 9 | low | The sticky topbar is what the owner sees moving, but it is a passenger, not a cause | `styles.css:412` | not re-checked |
| 10 | medium | openModal focuses the last button, which scrolls the modal to its bottom — a jump on open, and the cause of symptom 2 | `game.js:940` | not re-checked |

### Symptom 2 — panels open in the wrong place

| # | Severity | Finding | Where | Status |
| --- | --- | --- | --- | --- |
| 1 | critical | openModal focuses the last child of the scrollable .modal-card, so every long modal opens scrolled to its end | `game.js:940` | confirmed |
| 2 | high | showResolution focuses Continue at the bottom of the ending card, so the ending text opens scrolled past | `game.js:1472` | confirmed, fix needs adjusting |
| 3 | high | On Android the phone rule .modal{align-items:flex-end} plus .modal-card{max-height:90vh} pushes the card's top above the viewport, where it can never be scrolled back | `styles.css:461` | **refuted** |
| 4 | medium | renderKeepingFocus restores focus with preventScroll after innerHTML has already reset the panel to scrollTop 0, leaving the focused checkbox off screen | `game.js:553` | **refuted** |
| 5 | medium | Menu buttons that reopen the modal overwrite lastFocus with a node the next statement destroys, so closing drops focus to <body> | `game.js:926` | confirmed, fix needs adjusting |
| 6 | medium | focusEncounter scrolls the encounter flush to y=0 on a phone, so the sticky 48px top bar covers the scene kicker and title | `game.js:957` | not re-checked |
| 7 | medium | focusEncounter only scrolls; the button the user just pressed is destroyed by the rebuild, so focus is lost to <body> after every single action | `game.js:955` | not re-checked |
| 8 | high | Emptying #enc-body and #enc-actions collapses the document height mid-render, so Android clamps the page scroll upward before focusEncounter scrolls back down | `game.js:640` | **refuted** |
| 9 | medium | aria-live="polite" on a container that is fully rebuilt every turn makes TalkBack re-announce the entire scene and move its cursor | `index.html:1236` | not re-checked |
| 10 | low | openNotebook focuses the drawer's Close button without preventScroll | `game.js:916` | not re-checked |

### Symptom 3 — the phone layout is confusing

| # | Severity | Finding | Where | Status |
| --- | --- | --- | --- | --- |
| 1 | critical | Nothing the player can do is within 2.4 screens of the fold on a phone | `styles.css:439` | confirmed, fix needs adjusting |
| 2 | high | The objective line — the only "what do I do now" text — scrolls off-screen the moment it changes | `game.js:590` | confirmed |
| 3 | high | The phone page is 2045px tall with no signal that anything exists below the fold | `styles.css:448` | confirmed |
| 4 | high | Every action scrolls the story so its heading is hidden behind the sticky top bar | `game.js:957` | confirmed |
| 5 | high | On phones the harbour is an unlabelled picture with four invisible, instantly-committing tap targets | `styles.css:419` | confirmed, fix needs adjusting |
| 6 | medium | The same four destinations appear three times, in three visual languages, 1400px apart | `game.js:751` | confirmed, fix needs adjusting |
| 7 | medium | No onboarding on phones, and the help text that exists describes a desktop the player cannot see | `game.js:1514` | not re-checked |
| 8 | low | The phone title screen crops away two of the four berths, so the map is never established | `game.js:571` | not re-checked |

### Not reported yet — found by sweeping Android behaviour

| # | Severity | Finding | Where | Status |
| --- | --- | --- | --- | --- |
| 1 | high | AudioContext is never resumed on visibilitychange — the radio dies for good the first time the phone locks or the user switches apps | `game.js:1568` | confirmed, fix needs adjusting |
| 2 | high | 102 concurrent animations inside one non-composited SVG: measured 38 fps idle and 23 fps during a crossing at 6x CPU | `styles.css:518` | confirmed, fix needs adjusting |
| 3 | high | After every action the scene kicker and title are scrolled underneath the sticky topbar | `game.js:957` | confirmed |
| 4 | high | Phone modals are bottom-anchored and sized in vh, so the action buttons sit under Android's URL bar | `styles.css:461` | confirmed, fix needs adjusting |
| 5 | high | In landscape the NEON TIDES wordmark is clipped off the top of the frame, and opening the seed box cuts the entire logo | `styles.css:455` | confirmed, fix needs adjusting |
| 6 | high | Every Android resize (URL bar sliding, keyboard, rotation) unconditionally rewrites the SVG viewBox and forces a synchronous layout | `game.js:1568` | **refuted** |
| 7 | medium | Toasts render 195 px wide on a 390 px phone — the storage-failure message becomes a 4-line sliver | `styles.css:354` | not re-checked |
| 8 | medium | No @media (hover: hover) anywhere — tapped buttons keep their hover styling on Android and look permanently selected | `styles.css:252` | not re-checked |
| 9 | medium | touch-action is auto everywhere, and tapping the harbour picture gives literally no visual feedback on a phone | `styles.css:419` | not re-checked |
| 10 | medium | Impact, Bahnschrift, Arial Black, Arial Narrow, Trebuchet MS and Segoe UI are all absent on Android — the entire game renders in Roboto | `styles.css:31` | not re-checked |
| 11 | medium | Nothing sets overscroll-behavior, so an over-pull at the top of the page reloads the game and the notebook drawer scroll-chains into it | `styles.css:44` | not re-checked |
| 12 | medium | The audio schedulers use a 0.3 s lookahead on a 60 ms timer — background tab throttling clamps that to 1 s and the music stutters | `game.js:1389` | not re-checked |
| 13 | medium | "Double-click index.html" has no Android equivalent — a content:// URI blocks the stylesheet, the scripts and localStorage | `index.html:1272` | not re-checked |
| 14 | medium | The seed box summary is a 33 px tap target at the very bottom of a bottom-anchored overlay, and the soft keyboard covers the hint that explains it | `styles.css:385` | not re-checked |
| 15 | medium | Every tap rebuilds the entire notebook DOM even while it is hidden, then forces a synchronous layout, then starts a smooth scroll | `game.js:541` | not re-checked |
| 16 | low | The jellyfish bell-pulse, glow-breathe and tentacle sway never run — the selectors cannot reach inside a <use> shadow tree | `styles.css:532` | not re-checked |
| 17 | low | No theme-color, no manifest and an SVG-only favicon — a white URL bar over a near-black game and a blank home-screen icon | `index.html:5` | not re-checked |
| 18 | low | The seed input is 15px — harmless on Android, but it will zoom the page on iOS | `styles.css:388` | not re-checked |

## 6. Findings that were investigated and refuted

Recorded so nobody spends the effort again. Each of these looked plausible and is not the problem:

- **`innerHTML = ""` on the encounter collapsing the page mid-render.** The citations are right, the
  mechanism is not — Chrome's scroll anchoring absorbs it.
- **The phone `.modal { align-items: flex-end }` plus `90vh` clipping the card's top beyond reach.**
  A `position: fixed; inset: 0` box is laid out against the visible viewport, so the top stays
  reachable. (The `90vh` sizing is still worth fixing, for the different reason in §4.)
- **The resize handler "storm" and the SVG viewBox rewrite.** `syncAspect()` sets two attributes; it
  is not a per-frame layout thrash and it does not cause the jump.
- **`renderKeepingFocus` hiding the focused checkbox.** The rebuild already resets the panel to
  `scrollTop 0`; `preventScroll` is correct there.
- **The chips and objective line reflowing above the fold.** Measured; they do not change height
  enough to shift anything.

## 7. Choosing the phone layout: three designs

Three independent designs were produced and measured against a real prototype in the harness.

**A · Minimal repair.** Keep the stacked layout; fix the units, add a scroll cue, add a "what now"
hint. Cheapest, lowest risk, and it leaves the actions below the fold — it makes symptom 3 more
survivable rather than solving it.

**B · Fixed app shell, no page scroll.** Make the phone obey the same contract as the desktop: the
document never scrolls, the picture and a slim instrument bar are fixed, and the story and actions
live in one scrollable sheet. Prototyped and measured at 390×844: `document.scrollHeight === 844 ===
window.innerHeight`, fixed chrome 401px, sheet 443px. Instruments shrink from 198px to 65px, chips
from 124px to 72px (one row of four, each 92×61, well over the 44px floor `tools/test.mjs` asserts).

**C · Picture-first with a draggable bottom sheet.** The harbour fills the screen, hotspot tags come
back at phone-legible size, story lives in a sheet that drags up from a peek.

### Scoring

| | A · Minimal | B · App shell | C · Bottom sheet |
| --- | --- | --- | --- |
| Kills the jitter *class* structurally | no — damps it | **yes** | yes |
| Fixes "everything is below the fold" | no | mostly | partly |
| Honours pillar 1 (the harbour is the face) | unchanged | picture becomes a 217px header | destroys the composition (see below) |
| Lines touched | ~10 | ~55 CSS, 4 JS functions, 1 `id` | ~13 CSS rules, 2 HTML edits, new drag JS |
| Desktop risk | none | none — all inside the media query | none |
| `tools/test.mjs` risk | none | none; verified against the live prototype | touch-target and hotspot checks need review |
| New gesture surface | none | none | two gestures 34px apart |

## 8. The recommendation: a fixed app shell

**Build B.** The deciding argument came from C's own author: the artwork is 1440×800, a 1.8:1
composition, and a portrait phone below the topbar is roughly 0.5:1. There is no framing that is both
full-bleed and complete. Filling the height means showing about 35% of the width — so "picture-first"
on a phone buys its full-bleed image by permanently destroying the thing that sells the game: the
banded moon over the skyline with four lit places in one frame. A small complete picture serves
pillar 1 better than a large fragment. C's design is excellent and its ideas are worth keeping; its
premise does not survive the aspect ratio.

**Graft into B:**

- From A: ship the focus and unit fixes independently of any layout work. Already done in §4.
- From C: move the destination chips *into* the sheet as a complete, guaranteed-52px list under a
  "Cross to" heading, in addition to B's slim always-visible row. `renderChips()` writes by id, so
  moving `#dock-chips` needs no JS change at all.
- From C: keep the objective prominent. Both B and C shrink it to one ellipsised line, and it is the
  single most orienting string on screen for exactly the confused player this work is for. It should
  stay legible, and probably become tappable to expand.

**Three constraints that are not optional:**

1. **Gate the whole non-scrolling shell behind `@supports (height: 100dvh)`.** On Chrome < 108,
   `height: 100vh` with `overflow: hidden` clips the bottom of the sheet under the URL bar *with no
   way to scroll to it* — strictly worse than today. Outside the `@supports` block, keep the current
   scrolling layout. This means maintaining two phone layouts, and that is the real cost of B.
2. **Inside the shell, use `dvh`, not `svh`.** The reasoning inverts once the document cannot scroll:
   with no scroll the URL bar never retracts, so `dvh` never changes, and it fills the screen exactly
   instead of leaving a permanent gap. `svh` is right for a scrolling page; `dvh` is right for a
   fixed shell.
3. **Write a landscape branch.** `max-width: 899px` also catches a landscape phone. Measured at
   844×390 without a cap, `aspect-ratio: 18/10` makes the picture 469px and collapses the encounter
   to **2px** — unplayable. `max-height: 38dvh` rescues it to a 148px picture and a 72px sheet, which
   is still barely a game. Landscape probably wants the picture hidden entirely.

**Accept this trade-off knowingly:** a page that cannot scroll never lets Android retract its URL
bar, so roughly 56–60px — about 7% of the screen — is surrendered permanently. That is the price of
the layout never moving.

## 9. The task list

Ordered. Steps 1 and 2 are done; the rest is the phone pass proper.

| # | Task | Effort |
| --- | --- | --- |
| 1 | ✅ Focus and scroll-reset fixes (§4) | done |
| 2 | ✅ Viewport-unit fixes (§4) — but see §11: one of them broke the phone title screen | done |
| 3 | ✅ Owner played the 3.0 shell on Android (2026-10-06): it holds, nothing moves. The title flicker it showed is fixed in 3.0.1 (§12) | done |
| 4 | ✅ A phone group in `tools/test.mjs` at 390×650 and 844×390 (`phoneShell`, 18 checks) | 3.0 |
| 5 | ✅ The app shell (§8) behind `@supports (height: 100dvh)`, with the landscape branch | 3.0 |
| 6 | ✅ First-run card on touch screens, dismissed for good with *Got it*; the help text and the radio hint speak touch | 3.0 |
| 7 | ✅ `@media (hover: hover)` around every hover rule; `overscroll-behavior` on the page and the sheet; no tap flash | 3.0 |
| 8 | ✅ The `AudioContext` is suspended when the page is hidden and resumed on return | 3.0 |
| 9 | ✅ Phone animation budget (styles.css 14b, after the base rules): 109 → 57 running animations | 3.0 |
| 10 | ✅ `theme-color`, `manifest.webmanifest` and PNG icons; the manifest is linked only over http(s) | 3.0 |
| 11 | ✅ `sans-serif-condensed` (Android's Roboto Condensed) in the UI and signage stacks; the neon sign is pinned with `textLength` | 3.0 |

Task 3 is done. What a real device has still not shown is listed in §10 and at the end of §12.

## 10. What is still unverified

- **Everything about the real device.** All measurement here was a desktop Chromium emulating a phone
  viewport. Emulation cannot reproduce a retracting URL bar, so the symptom 1 fix is reasoned, not
  observed.
- **iOS and Safari.** Not examined at all in this session.
- **The `@supports` fallback path.** No Chrome < 108 engine was available to test against.
- **Audio on real Android hardware.** The `AudioContext` suspension behaviour in task 8 is a
  code-reading finding, not an observed one.
- **Landscape** was measured in emulation only.
- The synthesis stage of the audit that produced this document did not complete; §7 and §8 were
  written by hand from the three design documents and the verifier's corrections, not generated.

## 11. What version 3.0 built, measured

Built on 2026-10-02. All numbers come from the project's harness in Chromium's device emulation
(`tools/test.mjs phoneShell`, plus one-off probes recorded here), seed `high-tide` unless noted.

### A regression the 2.2 fix introduced

The 2.2 rule for the phone title frame was `aspect-ratio: 18 / 10; height: auto; height:
calc(100svh - var(--topbar-h))`. With a definite height and `width: auto`, `aspect-ratio` computes
the **width** from the height: at 390×650 the frame measured **1084px wide**, the document 1085px,
and Chromium's mobile emulation zoomed the whole page out to fit it (`innerWidth` read 1085). The
title text and the Start button ran off the right edge. The shell replaces that rule; the fallback
layout now uses a fixed pixel height with `aspect-ratio: auto`, and the decision log in `HANDOFF.md`
records the rule: never `aspect-ratio` together with a height. Two phone checks guard it.

### The shell

`styles.css` 13b, inside `@supports (height: 100dvh)`: `.app` is a 100dvh flex column that never
scrolls; the picture (18:10, capped at 31dvh), one row of four chips and a slim dashboard are fixed;
the story and its choices scroll in one sheet (`.encounter`). Travel buttons are hidden on phones —
the chips above the sheet are the travel buttons — and a floating *N choices below* button appears
while the first choice is out of view (`updateActionsCue()` in `game.js`). The objective is one
line, prefixed *Now*, tap to read it all; a changed objective glows for two seconds on every layout.

| Measured | 2.2 | 3.0 |
| --- | --- | --- |
| Document height in play, 390×650 | 2101px (3.2 screens) | 650px — equal to the viewport, every size tried |
| Phone title frame width, 390×650 | 1084px (page zoomed out) | 390px |
| First choice | y=1626, no cue (the fade was disabled on phones) | in a 255px sheet at 390×650 (434px at 390×844); a cue names how many choices are below, and tapping it brings the first one into view |
| Chips | 2×2 grid, 124px tall | one row of four, 49px tall, fuel shown as amber pips |
| Landscape 844×390 | sheet collapsed to 2px | picture 197px on the left, sheet 342px on the right; title wordmark fully visible |
| Running animations, phone | 103 | 57 |
| Frame rate at 6× CPU throttle, idle / crossing | 38 / 23 fps | 45 / 55 fps |
| Long panels (How to play, notebook, case files, ending) | opened at their end before 2.2 | open at their top (checked) |
| Ticking evidence in a long list | — | keeps the sheet where it was (checked) |

Fixed sizes in the shell, for whoever adjusts it: top bar 48px, chips row 54px, dashboard plus
objective about 91px. At 390×650 that leaves the sheet 255px; on an installed (standalone) app or a
taller phone it grows. If the sheet ever feels too short, the cheapest 30px is the dashboard labels.

### Also done

- First-shift card on touch screens (`coachCard()`), dismissed for good; help text and the radio
  hint in touch wording; no key numbers shown on phones.
- `@media (hover: hover)` around every hover style; `-webkit-tap-highlight-color: transparent` and
  `touch-action: manipulation` on controls; `overscroll-behavior` so an over-pull never reloads.
- The radio suspends with the page and resumes on return (`visibilitychange`).
- Toasts drop in under the top bar over the picture, `width: max-content`, never 195px wide.
- The scrolling fallback's story heading clears the sticky top bar (`scroll-margin-top`).
- From the code review: focus moves to the first choice when *Got it* or the cue disappears; the
  truncated objective is a keyboard control (`role=button`, `aria-expanded`) in the shell only; the
  hidden travel buttons take no number key; the coach card sits outside the story's live region.
- `theme-color`, a manifest and PNG icons (`tools/icons.mjs`), linked only over http(s).

### Still unverified (adds to §10)

- The shell on a real phone: URL bar behaviour, and the soft keyboard over the seed box (the page
  can't scroll, so this relies on the browser panning the visual viewport).
- Safe areas: the shell now pads the top bar, the sheet's end, the choices cue, the toast and the
  notebook with `env(safe-area-inset-*)` (for `viewport-fit=cover` on installed apps), and the
  landscape columns for a side notch. `env()` is 0 in emulation, so none of it has been seen working.
- The fallback layout for engines without `dvh`: written, not run on such an engine.
- Installing from a real https host; the manifest was checked over local http only.

## 12. The real-device session and the flicker (3.0.1)

**The owner's report, 2026-10-06:** the title screen flickers on Android; the game works. Nothing
moves under the thumb any more, so the 3.0 shell (§8, §11) holds on real hardware. This section is
what the flicker was, how it was found, and the rule that keeps it away.

### What was measured

Every number below comes from the project's harness driving headless Chromium in device emulation
at 390×844, `mobile: true`, on the title screen, with the DevTools `Tracing` domain recording
`devtools.timeline` for two to three seconds: the number of main-thread `Paint` events, the area they
covered, and the summed duration of `RasterTask`s (software raster, one desktop core). Emulation
cannot show the flicker itself, which needs a phone GPU missing its frame budget, but it shows
exactly what the phone is being asked to do sixty times a second.

| 3.0, title screen, 3 s | Paints | Raster |
| --- | --- | --- |
| As shipped | 360 (two per frame, each the whole viewport) | 1,301 ms (434 ms/s: 43% of a core) |
| Rain layer removed | the same | about the same |
| Rain and lightning removed | the same | 774 ms |
| Rain stepped (`steps(10)`) | the same | 946 ms |
| Every SVG animation *paused* | the same | 770 ms |
| Reduced motion (every animation removed) | 2 | 7 ms |

So the picture was repainted in full on every frame, and neither the rain nor pausing anything
stopped it; only removing the animations did. Running one animation at a time, with every other one
removed (`animation-name: none`), on top of `.harbour { will-change: transform }`:

| Alone | Paints/s | Raster ms/s |
| --- | --- | --- |
| none | 1 | 3 |
| 17 jellyfish drifting, bells, glows, tentacles | 1–2 | 2–9 |
| steam, lanterns, fan, ferry bob, train, beam, far boat | 1–2 | 2–9 |
| neon flicker, buzz, tube glow, the neon jellyfish | 1 | 2–7 |
| rain falling, rain gusting, heavy rain, both fogs, lightning | 1 | 4–23 |
| **`tube-hue`: the sign tubes' stroke colour fading `#3df5ff` → `#8ae6ff` over 6 s** | **121** | **343** |
| all together | 121 | 354 |

**One animation was the whole cost.** Opacity and transform animations on SVG elements are
composited: the compositor moves or fades a cached layer and the main thread paints nothing. A
colour cannot be composited. Each frame the stroke changed, the SVG was invalidated, repainted and
re-rasterised in full: gradients, patterns, four layers of stroked text, at 390×796 pixels on the
title screen. On a phone GPU that is more than a frame's budget, tiles arrive late, and the picture
flickers. (In play the picture is a 200-pixel strip, which is why the owner noticed it on the title
screen rather than in the game. The desktop renders it at 960×533 and simply spends the CPU.)

### The fix

The paler cyan is now a fifth text layer, `.tube-cyan-shift`, drawn on top of the cyan core in
`#8ae6ff` with `opacity: 0`, and `tube-hue` fades its opacity 0 → 1 → 0 over the same six seconds.
Alpha-blending the pale copy over the cyan core gives the same interpolation the stroke animation
did, so the sign looks the same at every point of the fade. Under reduced motion the copy stays at
0 and the sign is plain cyan, as before.

| 3.0.1, title screen, 3 s | Paints | Raster |
| --- | --- | --- |
| As shipped | 5 | 155 ms (52 ms/s; the moving rain layer's tiles) |
| Rain layer removed | 6 | 11 ms |

Paints fell from 120 a second to under two; raster from 434 to 52 ms/s. What remains is the rain's
own layer being re-tiled as it moves, which is compositor work and cheap on a GPU.

### Refuted on the way, so nobody tries them again

- **The rain.** The obvious suspect (two 2600×2100 pattern-filled rectangles moving at 60 fps) and
  not the cause: removing it left the paint count unchanged. It is composited.
- **`will-change: transform` on the SVG.** Gave the picture its own layer and stopped the title
  text's glow shadows and the top bar from being re-rasterised with it (a third less raster), but the
  picture itself still repainted every frame. Not needed once the colour animation was gone; not
  shipped.
- **Stepping or slowing the rain.** No effect on paints; the per-frame repaint was never about the
  rain's rate.
- **Pausing** every animation with `animation-play-state: paused` still repainted at 60 fps in this
  Chromium; only `animation: none` stopped it. The paint-budget test therefore checks keyframe
  properties, not play state.

### The rule, and the check

Inside the picture, animate **only `opacity` and `transform`**. Never `fill`, `stroke`, `color`,
`stop-color`, `stroke-dashoffset` or any other paint property. A colour that must drift is a second
copy of the shape in the other colour, faded with opacity. `tools/test.mjs` (`paintBudget`, three
checks) lists every running animation inside `#harbour` on the phone title screen and in desktop
play and fails on any keyframe property other than those two; re-injecting the 3.0 stroke animation
makes it report `tube-hue:stroke`.

One known exception is tolerated: `wake-run` animates `stroke-dashoffset` on the ferry's wake for
the 2.2 seconds of a crossing (the check runs while moored). If a crossing ever stutters on a phone,
that is the next thing to replace (a translating dashed copy under a clip would do it).

### Still unverified

- The fix on the phone itself. Emulation shows the work is gone; only the owner's phone shows
  whether the flicker is.
- Everything in §10 that a real device has not yet shown: the soft keyboard over the seed box,
  safe areas on an installed app, Safari.
- The close camera (3.2, the standard since 3.2.1; `index.html?camera=wide` restores the old view):
  whether the 0.9 s glide (per-frame repaints, by design) is smooth on the phone.
- The things (3.3): the rings around people and objects are sized to at least 44px (checked in
  emulation), but their tags are about 7px of type on a phone and may read as noise; whether a tap
  on the crate feels like the picture answering is the question for the real phone.
- Hints off (3.4, *Menu → Hints*): the menu line fits on one line at 390px and the notebook's
  note sits under the threads without adding page scroll (both checked in emulation); whether a
  night without the marks is fair on a phone, where the notebook is a drawer the player opens and
  closes rather than a column always in view, is a question for a person.

## 13. The gold night on a phone (4.0, 2026-10-07)

The trading night uses the same shell and changes nothing about its rules: the page never scrolls, the picture, the chips and the dashboard stay put, the story and its choices scroll in the sheet.

**What changed on the dashboard.** The drink cell is the **Purse** (credits); because the shell hides every cell's sub line, the grams of gold ride in the cell's label instead (`PURSE · 4 g`, a `.phone-only` span shown only inside the shell). The objective line is the **gold board where you are**, with the `::before` prefix changed from *Now ·* to *Gold ·* under `body.trade-mode` (for example *Gold · Kurage 33 · buy 93 · sell 88*); it still truncates to one line and opens on a tap.

**In the picture.** Mei's gold board (`#gold-board`) is a 30×40-unit sandwich board on the quay between two stools. At a phone's ~200px picture its chalk numbers are about 4px tall: legible as "there are numbers here", not as numbers. The dashboard line is where a phone player reads the price; the board is atmosphere and a tappable thing (tapping it brings the Gold group into view). Nothing on the board animates, so it costs no paint (§12).

**In the sheet.** The Gold group (two prices, what you hold, four trade buttons) sits between the place's actions and the Ferry group, so at Kurage 33 it is usually below the fold; the *choices below* cue covers it like any other choice. Trade buttons keep focus after a trade (`renderKeepingFocus`), so buying a few grams in a row doesn't jump the sheet.

**Measured in emulation** (390×650 in `tools/test.mjs` `goldNight`, and 375×812 in the desktop app's browser pane): the document height equals the viewport after a meal; the purse label shows the grams. **Not yet on a real phone**: whether the Gold group is found, whether the dashboard line is read as the price, the tap target of the board (it is 44px by rule, like every thing).
