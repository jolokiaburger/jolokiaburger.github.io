# Neon Tides

A short investigation game set in a rain-soaked neon harbour at night. You run the night ferry *Tern* between a noodle bar, a ferry landing, a metro terminus and a refrigerated cargo pier, looking for a courier who "never arrived". One case takes 5–10 minutes. Fog banks drift through now and then, the rain gusts, lightning flickers far off, a beacon sweeps the sky and a distant boat crosses the horizon while you work. There are two different cases; a seed decides which one you get.

Everything is plain HTML, CSS and JavaScript. No installation, no build step, no server, no network.

## Launch

**On a computer:** double-click `index.html`. It opens in your default browser and starts immediately.

**On a phone:** copy the whole folder to any static web host (or run `python -m http.server 8000` in the folder on your computer and open `http://<your-ip>:8000/` on a phone on the same network). The same files work unchanged; the layout adapts to the narrow screen.

Nothing is downloaded while you play. Tested in Chromium-based browsers (Edge); Firefox and Safari should work but were not verified — see `TESTING.md`.

## Controls

| Input | What it does |
| --- | --- |
| Mouse / touch | Click a destination in the harbour picture (desktop) or one of the four destination buttons under it (phone). Click an action in the story panel. |
| Keyboard | `Tab` moves between controls, `Enter` or `Space` activates. `1`–`9` choose the numbered actions. `N` opens the notebook, `M` the menu, `Esc` closes panels. |
| Radio | The dial under the picture (or `R`) tunes between **Off**, **Rain only**, **Lantern FM** (ambient plucked strings on a pentatonic scale) and **Basin Lo-Fi** (hypnotic techno at 104 bpm). The music is generated in the browser as you listen; nothing is downloaded, and it starts only after you tune. Off by default. While the radio is on (any station), the ferry also sounds its horn and engine when you cast off and rings its bell when you moor; **Off** silences those too. |
| Menu | Radio, reduced motion, how to play, return to title (keeps your save), new shift (asks for confirmation). |

## The harbour

- **Kurage 33 Noodle** on the east quay, under a cyan tube-letter sign with an orange neon jellyfish (*kurage* is Japanese for jellyfish): Auntie Mei's counter, numbered ramen, laksa and bao, a chit wire, plastic stools where a can on the seat means it's taken, and Teo the dispatcher on the corner stool.
- **Ferry Landing 3**: shelter, LED timetable board, ticket booth, the fuel pump.
- **Metro Quay** under the Line 9 terminus: lanterns, a vending machine, and the night shift waiting for the last train — a co-op rider, a nurse and a retired tug engineer, all worth talking to.
- **Frostline Cold Store, Pier 9**: insulated doors, pipes, numbered crates, and a night watch who has been asked too many questions.

## How to play, without spoilers

- Accept the job at Kurage 33. The **Objective** line under the picture always says what you are missing.
- Every crossing shows its **fuel** and **clock** cost before you commit. Searching costs minutes. Talking and reading never do.
- **Tiger Volt** is the night shift's energy drink. Drink a can and your next crossing takes no clock time. Mei gives you one; the vending machine at the Metro Quay has another.
- Out of fuel? Refuel at Landing 3. Stuck elsewhere with an empty tank? Radio the harbour tug.
- Some evidence only exists later in the night, and one witness leaves on the last train at 01:40. Waiting is an explicit, labelled action.
- Back at Kurage 33, put **up to three** pieces of evidence on the counter. To break the dispatcher's story you must prove two things; then name the explanation and the one clue that supports it; then decide what to do with the truth.
- The dawn truck leaves at 06:00. It is a soft deadline: endings change tone if you are late, but nothing is ever locked away.

## Seeds

Type anything into **Seed (optional)** on the title screen. The same seed always produces the same case. Leave it blank for a random seed; the seed is shown in the menu, the notebook and the ending screen so you can share or replay it. Two suggested seeds: `high-tide` and `bellwater` (they give different cases; `TESTING.md` says which is which, under a spoiler heading).

## Saving

Progress autosaves in the browser (`localStorage`) after every action. Reopen `index.html` and press **Continue shift**. If storage is blocked (private mode, strict settings) the game says so on the title screen and still plays normally for the session. A save that cannot be read (corrupt, or from an older version of the game) is cleared with a short notice instead of crashing. Nothing is sent anywhere.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure, the illustrated harbour (inline SVG, 1440×800) and the panels. Loads the two scripts. |
| `styles.css` | Layout (desktop grid and phone stack), the neon palette, button and focus states, animation, reduced-motion rules. |
| `cases.js` | All story data: places, people, clues, dialogue, both case variants, confrontation text, endings. |
| `game.js` | State, actions, travel, deduction checks, seeded case selection, rendering, saving, sound. |
| `assets/` | Favicon and eight small character portraits (SVG). All original. |
| `README.md` | This file. |
| `TUTORIAL.md` | How it is built and how to change it, for beginners. |
| `TESTING.md` | What was checked, how, and spoiler-marked walkthroughs. |
| `CREDITS.md` | Asset origins and licences. |
| `HANDOFF.md` | Design and engineering handoff: the whole idea, the world bible, every rule and decision. |
| `MOBILE.md` | The phone build: what an Android play-test found, what was fixed in 2.2, the full finding list, and the layout design still to be built. Read before changing any phone rule. |
| `ROADMAP.md` | Future planning: three shapes a full game could take, versions, a feature catalogue graded easy to very hard, content costs, and effort estimates. |
| `ROADMAP-ALTERNATIVES.md` | Alternative roadmap: market research (Asia first, rising trends, 2025–2026), twelve variations of the game with different gameplay and business models, regional playbooks and one recommendation. |
| `tools/` | Optional test tooling (Node 22+ plus Edge or Chrome): a headless-browser harness, 121 automated checks and screenshot scenarios. Not needed to play. |
| `LICENSE` | MIT for the code, CC BY 4.0 for artwork and story text. |
| `.gitignore` | Keeps the generated ZIP, screenshots and local editor configuration out of version control. |

## For developers

Open the browser console (F12) and type `NeonTides.getState()` to see the current save, or `NeonTides.validateAll()` to check the story data for contradictions. `TUTORIAL.md` walks through the code and ends with exercises (change dialogue, adjust the palette, add a clue, add a destination, write a third case).

## Known limitations

- Verified in Chromium (headless Edge and the desktop preview). Firefox: the project owner confirmed on 2026-09-11 that the animations run after the film-grain filter was removed and the Motion override was added. Safari and mobile browsers were not run.
- **Nothing moves?** The game honours your system's reduced-motion request (Windows *Animation effects* off, or Firefox's `ui.prefersReducedMotion` set to 1 in `about:config`, which some privacy configurations do). Hover highlights still work in that state, but no animation runs. Open the Menu: the *Motion* line reports what the system says, and setting Motion to **full** overrides it for this game only. Content blockers do not affect the animations; everything is inline CSS.
- Firefox: an earlier build also drew the film grain with an SVG turbulence filter over the whole picture, which Firefox re-renders on every frame; this build uses a plain dot pattern and contains no SVG filters.
- Signage uses system fonts (Bahnschrift and Impact on Windows, fallbacks elsewhere), so lettering differs slightly between operating systems.
- The radio's rain and both stations are generated with the Web Audio API (two short procedural loops, not composed tracks), are off by default, and start only after a click because browsers require a gesture for audio. Their exact sound varies a little between browsers.
- The harbour is a fixed 18:10 composition. Very tall or very wide windows show extra sky or water above and below rather than cropping the destinations.
- Saves live in one browser on one device. Some browsers treat every `file://` page as a separate origin, so a save made from one copy of the folder may not appear from another. Saves from version 1 of the game are not compatible and are cleared with a notice.
- There are two case variants. The structure supports more (see the tutorial's last exercise).

## Licence

Code is MIT-licensed; artwork and story text are CC BY 4.0. See `LICENSE` for the exact split and `CREDITS.md` for asset origins. Everything in the project is original and fictional.
