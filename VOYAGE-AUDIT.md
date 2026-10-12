# Voyage gameplay, dialogue and code audit

**Reviewed:** Voyage 0.11. **Fix release:** 0.12, 11 October 2026.

**Latest follow-up:** Voyage 0.17, 12 October 2026; scope and validation are recorded at the end of this audit.

This is a critical review by the coding assistant, using a game-development and QA lens. It is not an independent human review or a substitute for observing players. Voyage is the current game; Classic received regression checks for the shared repository and assets.

## Verdict

Keep the foundation. Separating the sailing model, navigation, content, presentation and profile is a sound starting point, and the seeded economy and shared cargo hold already support interesting routes. The welcoming harbour and relationships give the trading decisions a reason to matter. Starting again would discard useful work without solving the main problems.

The largest weaknesses were unreliable edge cases and misleading feedback: a missed deadline could block the hold indefinitely, an activity could charge for time the player never received, quest text and destination markers could disagree, and two reports described the same inventory differently. Those are more damaging to trust than a shortage of destinations. The dialogue also leaned too often on the same reassuring phrases instead of noticing what had happened.

## Findings and fixes

| ID / severity | Evidence in 0.11 | Change in 0.12 |
| --- | --- | --- |
| A01 · High | Expired tea and lighthouse couriers still occupied both hold slots, with no way to unload them. | Unload expired couriers at any quay through Cargo or Journal. No payment/refund; the story is marked **Closed**, capacity is released, and delivery cannot pay later. Closed couriers are not saved as successful story memories. |
| A02 · High | Buying an eight-minute breakfast at 05:58 charged 4 cr, advanced only two minutes and marked it complete. Other optional activities had the same pattern. | A shared activity budget rejects an action that cannot finish by dawn. Buttons explain the time/cash/hold limit. An activity ending exactly at 06:00 is allowed. Sea discoveries and boat encounters follow the same timing rule. |
| A03 · High | A save with `finds: {toString: 'read'}` threw during validation. Inherited character names, negative trades and future quote times could be accepted. | Validate object shapes and own content IDs before following references. Check positive trade amounts, timestamps, cargo terminals and menu consistency. Malformed history receipts are rejected before rendering. |
| A04 · Medium | Invalid voyage data was replaced at startup; a JSON failure in captain history was silently reset. | Keep the unreadable original in a separate local recovery slot where storage permits, and display a recovery notice. Voyage and history recovery remain independent of Classic. |
| A05 · Medium | A festival objective said “Give the basket to Hana” while its marker pointed to the Market if Nao was not aboard. | Derive the festival destination from the same ordered step as its text. Expired delivery objectives lead to unloading rather than an impossible buyer handover. |
| A06 · Medium | An undelivered 20-cr bowl case produced −20 in the illustrated logbook while the ledger correctly retained 20 of stock. Letters had the same premature loss. | The logbook and new history rows use settled cargo results. Deliverable cases remain inventory; expired or unloaded purchases are written down once. Older summaries retain their original numbers with explicit labels. |
| A07 · Medium | Sora sold a gram for 46 cr. Across 30 seeds, nine quays and four clock samples, every bid exceeded that price: sampled bids were 77–101 cr. The bargain overshadowed normal trading decisions. | New voyages use 86 cr, between the sampled bids. Older voyages retain their advertised 46-cr terms and existing lots retain their actual purchase basis. This is an initial balance correction, not a claim of final balance. |
| A08 · Medium | Trading comparisons assumed one gram, although the trading panel also supports three-gram purchases. A route's fixed sailing cost can conceal a useful bulk margin. | Compare either one or three grams. Purchase and spread scale with quantity; sailing fuel is charged once. Purse and local stock limits are shown. Remembered bids remain uncertain. |
| A09 · Medium | A past-voyage greeting could postpone a current delivery reaction and bypass hearing available trading news. | Process the current reaction/news first, then use an old memory in an ordinary chat slot. A memory does not consume an introductory line. |
| A10 · Medium | Metro crossing text still described a moving train after 01:40. Matte named Kenji as the yard seal seller. Delivery thanks used one generic line. One Nao crossing line was unreachable. | Fix the time and seller references, add distinct seller/buyer replies for all eight cargo definitions, add festival reactions and state-aware casual replies across all fourteen characters, and make all five supper crossing lines reachable. |
| A11 · Medium | First-launch help began with a release catalogue. Unavailable actions often failed with a generic message. Long panels required scrolling to reach Close. | Give the first tea crossing a clear objective and a direct Mei shortcut. Put active stories and their next-quay previews first in the Journal; fold completed outcomes and detailed planning. Reopen help through Ferry tools. Explain common action limits in buttons and keep Close outside the scrolling panel content. |
| A12 · Low | Unloading a selected expired stock case could leave the saved combined route pointing at its old destination. Cancelling a tug confirmation still dismissed Ferry tools. | Refresh the saved route on unload. Keep the tools panel on cancellation, and keep the dawn report visible after final-minute recovery. The tug advertises the actual minutes left before dawn. |

## Dialogue direction

The tone stays warm and optimistic. Reactions now speak through each person's work: Priya files the receipt, Kenji listens to a quieter machine, Matte checks the cold-room seal, and Hana notices Nao accepting her own place at the table. Casual replies refer to the dawn crew, finished repairs, food, the festival and the actual train schedule. They still cost no time or credits.

Repeated conversations use authored pools, not an endless text generator. They will eventually repeat. Fresh story reactions have priority, and ordinary conversation varies beyond the introductory four lines; expanding those pools should follow new character situations rather than adding interchangeable reassurance.

## Trading and route assessment

Not every cargo order should be profitable as a dedicated round trip. The pump seals pay a 14-cr gross margin, while their outbound sailing alone uses about 2.68 fuel, or 13.4 cr at the full-tank rate. They make more sense as work along an existing route than as a guaranteed money-maker. The comparisons expose collection and homeward costs; no blanket increase to every payment was made.

In the 0.12 review, refuelling remained outside the route planner's time/budget simulation. Voyage 0.15 adds a separate simulation to individual cargo offers and the journey strip; the two-order planner still uses its older distance estimate. A route needing fuel is now described as conditional, with each refill's 30-cr/10-min cost stated. Turns, detours and actual dealer allowances also remain practical limits on an estimate. A map calculation is not a guaranteed arrival or resale price.

## Engineering changes

- `voyage/model.js`: shape-first save validation, terminal courier flags, shared activity budgets, correct settled-result accounting, refreshed saved routes, and quantity-aware gold comparisons.
- `voyage/ports.js`: generation-specific travelling offers, distinct delivery/festival replies and time/quest-aware conversation.
- `voyage/profile.js`: settled history results, compatible old summaries and safe history receipt validation.
- `voyage/voyage.js` / `voyage.css`: recovery controls, visible action reasons, memory priority, onboarding/help, quantity selection and persistent panel dismissal.
- `tools/voyage-checks.mjs`: focused regressions alongside the existing simulated navigation and economy checks.
- `tools/voyage-ui-checks.mjs`: portable DOM integration checks using the actual presentation code. Run with Node; no dependencies. It does not emulate CSS or a real browser.

The save format remains version 1. Optional fields allow earlier saves to load; `encounterVersion` preserves travelling-price terms. Failed actions do not charge or progress stories. Unreadable data can be retained locally under the original storage key plus `:unreadable`; no data is uploaded.

## Validation

- `node tools/voyage-checks.mjs`: **71,619 assertions**, including simulated steering for every port pair, existing story branches, and the new expiry/dawn/inventory/migration regressions. The large count includes assertions on individual navigation frames; it is not a count of distinct play sessions.
- `node tools/voyage-ui-checks.mjs`: **84 DOM integration assertions** covering the first crossing, blocked capacity, courier recovery, exact-dawn meals, tug cancellation, reaction/memory ordering, legacy/current prices, quantity selection and unreadable-save recovery.
- `node tools/adventure-checks.mjs`: **3,211 Classic engine/data assertions** passed.
- `node tools/sound-checks.mjs`: **134 mocked Web Audio assertions** passed. No audio changes were needed in this audit.
- Native Canvas smoke scenarios exercise startup, port tabs, conversation, assisted sailing, docking, combined planning and the canal festival, including a phone-sized canvas with reduced motion.

These automated checks establish concrete behaviour, not fun, touch comfort or audio quality. A live Chromium layout check was attempted but the remote browser timed out before opening the game; no real-browser result is claimed. Browser layout and real-device performance require their own observations; Safari/iOS and listening on speakers are not covered by the scripts.

## Next development decisions

Refine before adding another region. Observe a few new players completing Mei's delivery, making one gold decision and following two stories concurrently. Record where they lose the objective, whether they preserve fuel money, and how often they choose a cargo route expecting a profit. Tune prices and information pacing from those observations.

The remaining structural debt is the large `voyage.js` renderer and its handwritten action conditions. Extract one area at a time behind the existing model and UI checks—conversation, then trading, then journal. There is no evidence here that a new engine or a wholesale rewrite is needed. More difficult routes, additional quests and richer character animation should wait until the core loop is understood and comfortable on a real phone.


## Voyage 0.14 follow-up · Player feedback

The next refinement responds to reported interface confusion: the first-voyage guide blocked the harbour, and the arrival overlay's “Skip arrival” button did not explain its purpose. Source review also found that the absolutely positioned arrival card occupied the phone port header's area.

`voyage/voyage.js` no longer opens welcome help or an older release notice automatically. `voyage/index.html` exposes Menu in the header; help remains an explicit menu choice and Mei's tea case remains optional. The arrival message now belongs to the port panel below its tabs, uses orange styling, states **Docked at…**, counts down six seconds, and offers **Dismiss**. It clears on departure or opening a menu. Reduced motion removes animation without shortening reading time. Save recovery notices remain visible and available in Menu.

Jun, Hana and Mako's 512 px scene portraits left comparatively little detail for their faces. New 1024 px portraits use closer framing while retaining their identities and clothes. Only Voyage references change; Classic and the older image files are preserved. Exact prompts: `tools/voyage-14-art-prompts.json`.

Validation: **71,619** Voyage engine assertions, **168** DOM integration checks, **3,211** Classic checks and **134** mocked audio checks pass. The UI checks cover startup, legacy announcements, optional help, keyboard Menu, countdown boundaries, redocking, dismissal, reduced motion and recovery data retention. They do not render CSS. Live-browser layout and physical-phone testing remain outstanding; no browser screenshot or device result is claimed. The fuel-planner limitation described above remains unchanged in this release.


## Harbour pastimes and interface follow-through · Voyage 0.15

The requested six additions are implemented within the existing Basin: fishing, Nao's kitchen shift, photo errands/album, a journey strip and individual fuel-stop budgets, refreshed Mei/Priya expressions, and three illustrated dockside views. `VOYAGE-HARBOUR-LIFE.md` documents exact rules and limitations.

New activity data is optional under `leisure`; old saves are accepted before empty defaults are added. Profile album/notebook/decorations are also optional. The validators reject unknown/inherited IDs, duplicate rewards/records, invalid timestamps, oversized thumbnail strings and unsafe image types. Fish use their own basket; kitchen ingredients and photographs do not take freight slots. Cash awards are fixed, finite per voyage, recorded in the existing ledger and included in the illustrated voyage result. Draft kitchen choices, cast waiting and menu navigation are free. The full game-time cost must fit before dawn, including exact-dawn settlement.

Fishing callbacks are disposed when a panel closes or changes, and verify the voyage/line before acting. A pending line survives reload without forcing the panel. Departure packs it away. Normal bites remain available indefinitely; relaxed mode automates reeling. Photo previews render native game artwork rather than requesting camera access or uploading images. Album storage is bounded to three small captures.

`voyage/travel-plan.js` checks reachable pumps, the full 30-cr/10-min refill, current purse, pickup funding/capacity, release waits, handovers, deadlines and return to Kurage. It considers useful early refills and caches route geometry with a size bound. Net cash, gross margin, fuel used and the ending tank have distinct labels. Starting fuel is already aboard; its earlier purchase is excluded from this net-cash estimate. Combined two-order planning retains its existing conditional refuelling warning. Navigation geometry, market prices and Classic rules are unchanged.

Validation includes 677 focused activity/save/budget assertions, 285 DOM checks and real native Canvas renders of all photo views and all decorations. This is automated inspection, not independent player observation. Browser CSS, mobile touch comfort, Safari/iOS and real-phone performance remain outstanding.

## People across the water · Voyage 0.16

All six requested additions now work on existing routes: three finite passenger fares, four neighbour favours, three learned recipes, optional docking practice, dock GUI refinements and three illustrated seats. The requested dialogue direction adds 28 optional topics, full player replies and an attributed knowledge notebook. A small evidence-based bell investigation allows two clearly labelled interpretations. `VOYAGE-NEIGHBOURS.md` records exact terms, costs, source files and limitations.

The new model, conversation, profile and UI concerns are separate modules. Money changes only through a guarded explicit fare handover or the late-crew favour; docking, reading, recipe drafts and dawn grant no automatic fare. Optional tea stops do not prevent a direct homecoming. Passenger and recipe baskets remain outside freight capacity. All paid/consuming actions require their full duration before dawn, including settlement exactly at 06:00. Closing a fare or favour preserves an honest closed outcome without payment. Consumed fish have a corresponding real serving/gift record and cannot be reused.

The optional voyage/profile records accept older saves before hydration, reject unknown or inherited IDs and duplicate/inconsistent records, and bound persistent knowledge and landings. Current-voyage learning reconciles with the profile at load; fresh voyages restore recipes and practice without restoring cash, catches, passengers or completed jobs. Five additional charms follow the existing ownership rules. Classic's scripts, original assets and separate storage key are unchanged.

Conversation choices stay inside the quay view and never appear automatically. Full replies are visible before selection. Practical topics describe actual game rules and never expose unseen prices. The notebook separates rules/outlooks, history/rumours and recipes/science, attributes the speaker and keeps first-heard times. The two science notes link to primary USGS/NASA material; the Basin economy and bell lore are fictional. The choice requiring Mako's evidence is gated on the account the player actually heard.

Port/dialog return controls stay outside scrolling content, and port scroll is remembered by quay/tab/person. Explicit phone header grid positions avoid implicit placement; phone camera framing uses the measured exposed sea above/beside the port pane. New scene art preserves the established cast. Luggage, approach marks, keepsakes and reduced-motion-aware blinks remain native drawings; approach grading does not change collisions, fuel or docking eligibility.

Validation: **775** new model/profile assertions, **401** total DOM integration checks, **71,627** engine assertions, **677** pastimes checks, **3,211** Classic checks and **134** mocked audio checks. Native Canvas inspection covers photo scenery, all nine charms, three passengers, docking marks and portrait/landscape camera framing. Counts describe assertions, including simulated navigation frames, not independent play sessions. The checks do not render browser CSS or establish whether the additions are fun.

Browser access was declined earlier in this session. Real-browser CSS/focus, touch comfort, Safari/iOS, physical-phone performance and listening remain outstanding; the 0.16 manual checklist is in `VOYAGE-PLAYTEST.md`. The combined cargo planner's conditional fuel estimate and large renderer remain known limitations. The next evaluation should observe the existing loop on phones before expanding the Basin further.


## Beyond the Breakwater · Voyage 0.17

The authorised expansion adds a continuing three-chapter Nao/Rin adventure and two outer-coast quays. Preparation, exploration and homecoming are distinct stages; the player explicitly starts and continues the story. Unfinished chapters can continue on another night. Original quay coordinates remain fixed, the coast is gated before chapter two, and Classic is untouched. `VOYAGE-BREAKWATER.md` documents full terms and limitations.

Continuation preserves real purse, gold purchase basis, tank, engine/racks and trim, owned sealed stock and finite contract receipts. Renewed next-night delivery windows are stated before continuation. Prior delivery/discovery/courier receipts are subtracted from current-night illustrated results, while the cash ledger starts at the carried purse. A moored continuation grants no fuel. Finishing at sea explicitly uses an overnight tug, charging at most the current 20-cr fee and recovering to Landing 3 with at least three fuel. It does not claim a passenger homecoming or pay an unfinished fare. Coastal catches are shared with the overnight crew as stated in the continuation terms.

Knowledge changes available actions: Priya’s survey unlocks a genuinely shorter route, Jun’s introduction unlocks a second tasting, and Rin’s recovered notebook unlocks the station-kitchen ending. Both final outcomes produce their own letters. Routes use the actual navigation function and previews share their geometry. Rin’s fitting reduces actual fuel per distance by 10% while keeping steering and game-time rules. The two new pumps use the existing 30-cr/10-min/full-tank terms. New cargo uses the shared hold, fixed costs/payments and one-time receipts. All consuming activities require their full advertised duration before dawn.

Optional bounded expedition and profile records retain version-one compatibility and reject unknown choices, routes, chapter numbers, duplicated steps and malformed carryover fields. The chart is generated from navigation data, with native landmark illustrations, visible pins, accessible named controls and a larger pannable view. New native map art and two original dockside scenes retain the cast and warm harbour direction. The expanded world adds more pathfinding work; a real phone performance assessment remains needed.

Validation covers 10,169 focused expedition checks and 458 DOM checks, plus the expanded engine, pastimes, neighbour, Classic and mocked-audio suites. Native Canvas inspections cover both new quays, the illustrated chart and small camera framing. Counts include per-frame navigation assertions. Browser CSS/focus, touch comfort, Safari/iOS, listening and physical-device performance remain outstanding; browser access was declined earlier. Automated coverage establishes specific behaviour and compatibility, not fun or an independent human review.
