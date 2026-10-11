# Voyage gameplay, dialogue and code audit

**Reviewed:** Voyage 0.11. **Fix release:** 0.12, 11 October 2026.

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

Refuelling remains outside the route planner's time/budget simulation. A route needing fuel is now described as conditional, with each refill's 30-cr/10-min cost stated. Turns, detours and actual dealer allowances also remain practical limits on an estimate. A map calculation is not a guaranteed arrival or resale price.

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
