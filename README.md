# Neon Tides

A short investigation game set in a rain-soaked neon harbour at night. You run the night ferry *Tern* between a noodle bar, a ferry landing, a metro terminus and a refrigerated cargo pier. Somebody's story doesn't hold: most nights it is the dispatcher's, about a courier who "never arrived"; one night it is about a crate that left by water and a boat nobody else saw. One case takes 5–10 minutes. There are four cases; a seed decides which one you get, and the **Case files** on the title screen list them all.

Fog banks drift through now and then, the rain gusts, lightning flickers far off, a beacon sweeps the sky and a distant boat crosses the horizon while you work. The picture follows the night: after the last train the metro platform empties, and some endings leave a stool or a gate empty.

Everything is plain HTML, CSS and JavaScript. No installation, no build step, no server, no network.

## Launch

**On a computer:** double-click `index.html`. It opens in your default browser and starts immediately.

**On a phone:** copy the whole folder to any static web host (or run `python -m http.server 8000` in the folder on your computer and open `http://<your-ip>:8000/` on a phone on the same network). The same files work unchanged. On a phone the game uses a fixed screen: the picture, four destination buttons and the dashboard stay put, and the story with its choices scrolls underneath. Served from a web host the game can be added to the home screen, where it runs without a browser bar.

Nothing is downloaded while you play. Tested in Chromium-based browsers (Edge, desktop and phone emulation) and by the project owner in Firefox and on an Android phone (version 2.2); Safari and iOS were not verified — see `TESTING.md`.

## Controls

| Input | What it does |
| --- | --- |
| Mouse | The picture shows the quay you are moored at and pulls back to the whole harbour while you cross. People and things with a dashed ring can be clicked: that does what the matching choice under the story does, for the same cost. Cast off with the Ferry buttons in the story panel, or click a neighbouring quay where it shows at the edge of the picture. |
| Touch | Tap a place in the picture, or one of the four destination buttons under it (the amber pips are the fuel it costs). Your choices are listed under the story; when they are out of sight, a *choices below* button takes you there. Tap the objective line to read all of it. |
| Keyboard | `Tab` moves between controls, `Enter` or `Space` activates. `1`–`9` choose the numbered actions. `N` opens the notebook, `M` the menu, `R` tunes the radio, `Esc` closes panels. |
| Radio | The dial under the picture (or `R`) tunes between **Off**, **Rain only**, **Lantern FM** (ambient plucked strings on a pentatonic scale) and **Basin Lo-Fi** (hypnotic techno at 104 bpm, which opens up as the night goes on). The music is generated in the browser as you listen; nothing is downloaded, and it starts only after you tune. Off by default. While the radio is on (any station), the ferry also sounds its horn and engine when you cast off and rings its bell when you moor; **Off** silences those too. |
| Menu | Notebook, radio, reduced motion, camera (close, the standard: the quay you are moored at, the whole harbour while you cross; or wide, the whole harbour all the time, also `index.html?camera=wide`), how to play, return to title (keeps your save), new shift (asks for confirmation). |

## The harbour

- **Kurage 33 Noodle** on the east quay, under a cyan tube-letter sign with an orange neon jellyfish (*kurage* is Japanese for jellyfish): Auntie Mei's counter, numbered ramen, laksa and bao, a chit wire, plastic stools where a can on the seat means it's taken, a jellyfish tank, and Teo the dispatcher on the corner stool.
- **Ferry Landing 3**: shelter, LED timetable board, ticket booth, a clerk who logs every hull in the Basin, the fuel pump.
- **Metro Quay** under the Line 9 terminus: lanterns, a vending machine, and the night shift waiting for the last train — a co-op rider, a nurse and a retired tug engineer, all worth talking to.
- **Frostline Cold Store, Pier 9**: insulated doors, pipes, numbered crates, and a night watch who has been asked too many questions.

## How to play, without spoilers

- Hear out whoever hires you at Kurage 33 and take the job. The **Objective** line always says what you are missing.
- Every crossing shows its **fuel** and **clock** cost before you commit. Searching costs minutes. Talking and reading never do.
- **Tiger Volt** is the night shift's energy drink. Drink a can and your next crossing takes no clock time. Mei gives you one; the vending machine at the Metro Quay has another.
- Out of fuel? Refuel at Landing 3. Stuck elsewhere with an empty tank? Radio the harbour tug.
- Some evidence only exists later in the night, and one witness leaves on the last train at 01:40. Waiting is an explicit, labelled action.
- **Show a clue.** "Show Priya something from the notebook" lets you hold any clue you have up to a witness; they answer the clue itself, or shrug. Free, and worth doing.
- **Show a clue.** "Show Priya something from the notebook" lets you hold any clue you have up to a witness; they answer the clue itself, or shrug. Free, and worth doing.
- The notebook has a **timeline**: who was where, and when. Fill it in from what you read. The liar tests it against the evidence you put down, and the ending counts the lines you got right.
- Somebody is lying. When you can prove it, go back to them and put **up to three** pieces of evidence down: first what breaks the story, then the explanation and the one clue that supports it; then decide what to do with the truth. Where you do that, and what breaks the story, depends on the case.
- The dawn truck leaves at 06:00. It is a soft deadline: endings change tone if you are late, but nothing is ever locked away.

## Seeds and case files

Type anything into **Seed (optional)** on the title screen. The same seed always produces the same case. Leave it blank for a random seed; the seed is shown in the menu, the notebook and the ending screen so you can share or replay it.

**Case files** on the title screen lists every case with a seed that always opens it (`high-tide`, `bellwater`, `low-water`, `slack-water`) and the endings you have found. A case's title stays hidden until you have closed it once, because the titles give the truth away. The record lives in this browser only and survives starting new shifts. A random seed from version 2.x opens the case it did then, or one of the two cases added in 3.0.

## Saving

Progress autosaves in the browser (`localStorage`) after every action. Reopen `index.html` and press **Continue shift**. If storage is blocked (private mode, strict settings) the game says so on the title screen and still plays normally for the session. A save that cannot be read (corrupt, or from an older version of the game) is cleared with a short notice instead of crashing. Nothing is sent anywhere.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure, the illustrated harbour (inline SVG, 1440×800) and the panels. Loads the two scripts. |
| `styles.css` | Layout (desktop grid, the fixed phone shell, a scrolling fallback for older phones), the neon palette, button and focus states, animation, the art that follows the story, reduced-motion rules. |
| `cases.js` | All story data: places, people, clues, dialogue, the four cases, their confrontations and endings. |
| `game.js` | State, actions, travel, deduction checks, seeded case selection, rendering, saving, the case files, sound. |
| `manifest.webmanifest` | Lets a web-hosted copy install to a phone's home screen. Linked only when served over http(s). |
| `assets/` | Favicon, home-screen icons (rendered from the favicon by `tools/icons.mjs`) and eight small character portraits (SVG). All original. |
| `README.md` | This file. |
| `TUTORIAL.md` | How it is built and how to change it, for beginners. |
| `TESTING.md` | What was checked, how, and spoiler-marked walkthroughs of all four cases. |
| `CREDITS.md` | Asset origins and licences. |
| `HANDOFF.md` | Design and engineering handoff: the whole idea, the world bible, every rule and decision. |
| `MOBILE.md` | The phone build: what an Android play-test found, what was fixed, the measurements before and after, and what is still unverified. Read before changing any phone rule. |
| `ROADMAP.md` | Future planning: three shapes a full game could take, versions, a feature catalogue graded easy to very hard, content costs, and effort estimates. |
| `ROADMAP-ALTERNATIVES.md` | Alternative roadmap: market research (Asia first, rising trends, 2025–2026), twelve variations of the game with different gameplay and business models, regional playbooks and one recommendation. |
| `neon-tides-next-steps*.pdf` | One-page summaries of the plan: the 18 September version, the 3.0 update and the 3.3 update (`-v4`, the current one; its source is `tools/next-steps-v4.html`, printed by `node tools/print-next-steps.mjs`). |
| `tools/` | Optional test tooling (Node 22+ plus Edge or Chrome): a headless-browser harness, 276 automated checks, screenshot scenarios and the icon renderer. Not needed to play. |
| `LICENSE` | MIT for the code, CC BY 4.0 for artwork and story text. |
| `.gitignore` | Keeps the generated ZIP, screenshots and local editor configuration out of version control. |

## For developers

Open the browser console (F12) and type `NeonTides.getState()` to see the current save, `NeonTides.validateAll()` to check all four cases for contradictions, or `NeonTides.getProfile()` for the case-file record. `TUTORIAL.md` walks through the code and ends with exercises (change dialogue, adjust the palette, add a clue, add a destination, write a case, write a case with a lie of its own, add a radio station).

## Known limitations

- Verified in Chromium (headless Edge, desktop and phone emulation). Firefox: the project owner confirmed on 2026-09-11 that the animations run. Android: the owner play-tested version 2.2; the fixed phone layout of 3.0 has been measured in emulation but **not yet on a real phone**. Safari and iOS were not run.
- **Nothing moves?** The game honours your system's reduced-motion request (Windows *Animation effects* off, or Firefox's `ui.prefersReducedMotion` set to 1 in `about:config`, which some privacy configurations do). Hover highlights still work in that state, but no animation runs. Open the Menu: the *Motion* line reports what the system says, and setting Motion to **full** overrides it for this game only. Content blockers do not affect the animations; everything is inline CSS.
- On phones some tiny ambient animations (glints, window twinkles, wave lines) rest to save battery and frames; they are below a pixel at that size.
- Signage uses system fonts (Bahnschrift and Impact on Windows, condensed Roboto on Android, fallbacks elsewhere); the neon sign is pinned to its width, so lettering differs slightly between systems but never overflows.
- The radio's rain and both stations are generated with the Web Audio API (two short procedural loops, not composed tracks), are off by default, and start only after a click because browsers require a gesture for audio. Their exact sound varies a little between browsers, and they were never tuned by ear on real speakers.
- The harbour is a fixed 18:10 composition. Tall or wide desktop windows show extra sky (a few more stars) and deep water (older, slower jellies) rather than cropping the destinations.
- Saves live in one browser on one device. Some browsers treat every `file://` page as a separate origin, so a save made from one copy of the folder may not appear from another. Saves from version 1 of the game are not compatible and are cleared with a notice; saves from 2.x continue.

## Licence

Code is MIT-licensed; artwork and story text are CC BY 4.0. See `LICENSE` for the exact split and `CREDITS.md` for asset origins. Everything in the project is original and fictional.
