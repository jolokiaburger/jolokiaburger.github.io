# Harbour evenings specification

**Baseline:** Voyage 0.21. **Scope:** supper evenings, lantern sailing courses, the dispatch investigation, unified itineraries and persistent keepsakes. Existing activities are specified in [VOYAGE-HARBOUR-LIFE.md](VOYAGE-HARBOUR-LIFE.md) and [VOYAGE-NEIGHBOURS.md](VOYAGE-NEIGHBOURS.md).

## Access and interaction

Open **People → Harbour evenings**, **Menu → Harbour evenings** or the Journal. Supper and investigation controls also appear in Nao's character actions. The route board opens from People, Menu, Journal, the sailing journey strip and the region chart. All panels require a player choice; course completion records a result and shows a non-blocking notice.

Reading and menu drafting spend no resources. Purchases, physical checks and servings require their full displayed duration before 06:00. Exact-dawn completion settles once. Leaving or closing a panel does not buy, serve, recover a parcel or resolve an investigation.

## Supper evenings

[voyage/supper-routes.js](voyage/supper-routes.js) implements one evening per night. Complete **Beyond the Breakwater** to receive the invitation. Its travelling-book ending opens home-harbour supper routes; the station-kitchen ending also permits hosted suppers at Shiosai while the coast is unlocked.

A completed profile restores the supper invitation on a fresh Voyage. This restores neither chapter progress nor coastal access, cash, stock, fuel or completed jobs. To revisit the station immediately, use **Continue harbour evenings → Another night** on a completed expedition's report. Chapter three and its outcome remain complete; no fourth chapter is created.

At Nao's Market counter, choose exactly two dishes. For a travelling route, select two or three different tables in the intended sailing order. Deselecting and selecting a table moves it to the route's end. A hosted station evening has three fixed guest tables. The agreement is free and becomes fixed once accepted.

| Dish | Ingredients | Credited method |
| --- | --- | --- |
| Ginger-sesame rice | Dry rice; ginger and sesame | Mei's travelling rice |
| Mushroom and tea broth | Roasted mushrooms; supper tea | Nao's mushrooms with Jun's tea |
| Garden tea rice | Dry rice; supper tea | A credited growers' rice-and-tea table |

| Ingredient | Collection quay | Cost | Duration |
| --- | --- | --- | --- |
| Dry rice | Kurage 33 | 6 cr | 4 min |
| Ginger and sesame | Kurage 33 | 4 cr | 4 min |
| Roasted mushrooms | Night Market | 6 cr | 4 min |
| Supper tea | Kisaragi | 4 cr | 4 min |

Each required ingredient is bought once for the entire evening. Shared ingredients are not purchased twice. The separate recipe basket consumes no freight slot. The three possible two-dish menus cost 14, 16 or 20 cr and require 12 or 16 minutes of collection. Fuel and travel are additional expenses.

| Travelling table | Host | Preferred dish |
| --- | --- | --- |
| Metro's late platform crew | Lam | Garden tea rice |
| Starling Yard workshop | Rin | Ginger-sesame rice |
| Kisaragi lockside friends | Jun | Mushroom and tea broth |
| Kurage homecoming table | Mei | Ginger-sesame rice |
| Tsukimi sky-watch supper | Mio | Mushroom and tea broth |

The station serves the growers' watch, Rin's repair crew and the last signal watch in that order, preferring garden rice, ginger rice and mushroom broth respectively. Each serving takes six minutes and pays an explicit 12-cr contribution. Serving the preferred dish adds 3 cr. Another chosen dish is welcome and carries no penalty. Ingredient quantities cover all agreed tables; no additional servings can be created from the same batch.

The next table must be served in the agreed order after all ingredients are collected. A completed evening unlocks the travelling-supper page decoration. Closing an unfinished evening at a quay shares remaining ingredients ashore, grants no refund and prevents further contributions. Overnight continuation starts a new supper basket and permits a new evening. Actual purchases use the food ledger category; contributions use leisure. The illustrated result counts income once and deducts the evening's ingredient spending.

## Lantern sailing courses

[voyage/sailing-challenges.js](voyage/sailing-challenges.js) defines six ordered gates per course. Gates are drawn on the actual sailing map; they have a 40-unit acceptance radius and do not change collision, steering, quay eligibility or course assistance. Movement across the next ring advances one gate. Crossing a later ring first cannot skip progression.

| Course | Starting quay | Timed target |
| --- | --- | --- |
| Kitchen-window loop | Kurage 33 | 48 game min |
| Western lantern weave | Landing 3 | 49 game min |
| Tsukimi starlight turns | Tsukimi Observatory | 42 game min |

Start while moored at the named quay with the displayed course fuel reserve and target time available before dawn. The course panel shows nominal fuel for the current fittings; leave fuel for detours and the journey home. Starting is free. The interface casts off and returns to sailing. Manual steering and **Set course to the next lantern** are both supported.

Relaxed practice records route efficiency without a timed grade. Timed runs use elapsed game time; reading, pauses and hidden tabs do not advance it. Labelled activities such as refuelling do advance the clock. Passing the target does not end or penalise the run: the player may complete it for another grade or close it.

Efficiency is the safe-route reference distance divided by actual distance sailed, capped at 100%. Timed gold requires at least 78% efficiency and a finish within the target. Silver requires at least 65% efficiency; otherwise a completed timed course earns bronze. Each course/mode can be completed once per night, for at most six results. Closing an attempt grants no refund or extra penalty. Dawn closes an unfinished attempt. Courses never pay money, change boat statistics or inflict damage.

Completed runs unlock the lantern pennant. Profiles retain one best result per course, mode and standard/tuned engine configuration, bounded to twelve rows. Timed bests use elapsed time; relaxed bests use efficiency. Nightly results include actual fuel used. Completion requires sailing through every gate and is recorded without a forced modal.

## The Wrong Supper Crate

[voyage/harbour-mystery.js](voyage/harbour-mystery.js) contains an optional authored investigation started with Nao at the Market. Her delivery contains workshop bushings. The original records reveal a copied destination slip that crossed dispatch rows K-17 and W-17.

| Record | Quay | Duration | Evidential role |
| --- | --- | --- | --- |
| Counter label | Night Market | 3 min | Compare the copied destination slip with the sealed supplier mark |
| Dispatch manifest | Landing 3 | 4 min | Identify K-17, W-17 and the Metro transfer shelf |
| Mei's packing card | Kurage 33 | 3 min | Match the rice seal with the expected ingredients |

All checks are free and can be completed once in any order. The notebook attributes each physical record and shows its observation time. Three additional working-knowledge topics for Nao, Priya and Lam explain dispatch methods. Specific reply choices require the checked manifest, packing card or Nao's actual permission; reading a general account does not complete a physical check or reveal a remote market quote.

After all three checks, explicitly recover the intact case at Metro: free, four minutes, one freight slot. Capacity is shared with existing paid freight and courier cases. Recovery, docking and closing a panel pay nothing.

| Resolution | Requirements | Duration | Outcome |
| --- | --- | --- | --- |
| Return the sealed case | Recover it, then return to Nao at the Market | 6 min | Correct the dispatch record and open a counter supper special |
| Share with the platform crew | Recover it, obtain Nao's permission at the Market, then return to Metro | 8 min | A credited platform supper for the watch |

Both resolutions are free and grant the checked-dispatch decoration. The selected supper table appears in the native waterfront scene. A completed resolution releases the case's slot. Closing an investigation at any quay forwards a recovered case ashore, releases its slot and grants no payment or cosmetic completion. There is no special delivery deadline; the normal dawn limit applies.

Expedition continuation retains checked evidence, permission, the recovered case and terminal outcome. Current-night timestamps are rebased to the new night's opening; earlier physical checks are explicitly labelled retained, not newly observed. A fresh Voyage begins a new investigation while preserving earned profile keepsakes.

## Unified route board

[voyage/route-board.js](voyage/route-board.js) stores up to twelve ordered action descriptors, each containing only `kind` and `id`. Prices, durations, payments and locations are resolved from current rules. The board supports visits, whole refills, meals, freight collection/delivery, existing courier handovers, supper ingredients/tables and investigation steps. The player can reorder, remove or clear stops without cost.

[voyage/travel-plan.js](voyage/travel-plan.js) simulates the itinerary with actual starting purse, tank, capacity and boat fittings. The estimate includes release waits, complete action durations, handover deadlines and reachable 30-cr/ten-minute refills. Full tanks are not charged again. Every purchase requires funds at that point; a later payment cannot finance an earlier purchase. Collection precedes delivery and evidence/ingredient dependencies precede their resolutions or tables.

The region chart overlays the saved itinerary as a numbered purple water route and marks estimated fuel stops with F. Existing expedition pins remain available. The next-stop advice follows the whole itinerary's fuel schedule, including an early refill needed to leave a later quay. It does not merely check whether the immediate crossing fits. Budget calculations mutate no game state, observe no remote gold scale and claim no payout. Supper forecasts use the guaranteed 12-cr contribution; preference bonuses remain conditional. Estimated sailing requires allowance for turns and detours.

The two-order comparison evaluates valid collection orders through the same pump-aware simulation, including the return to Kurage. Legacy `plannedOrders` saves remain valid and can be imported into the board. The older distance-only `combinedPlan` model helper remains for legacy saved-route behaviour; the active comparison interface uses `VoyageTravel.combined`.

Visits and already-full fuel stops require an explicit free confirmation. Other actions call their existing guarded rule functions. Serving opens the dish choice. Successful pickups and handovers reconcile completed leading stops. Previewing or setting course never refuels, buys, delivers or completes the itinerary automatically.

## Source and save contracts

| Source | Responsibility |
| --- | --- |
| [voyage/supper-routes.js](voyage/supper-routes.js) | Menu, ingredients, agreed tables, contributions and validation |
| [voyage/sailing-challenges.js](voyage/sailing-challenges.js) | Ordered gates, actual sailing records, grades and gate drawing |
| [voyage/harbour-mystery.js](voyage/harbour-mystery.js) | Evidence, capacity, consent, resolutions and dispatch topics |
| [voyage/route-board.js](voyage/route-board.js), [voyage/travel-plan.js](voyage/travel-plan.js) | Bounded action IDs, dependencies and shared budgets |
| [voyage/evenings-profile.js](voyage/evenings-profile.js) | Persistent invitations, visited tables, case endings and best runs |
| [voyage/evenings-ui.js](voyage/evenings-ui.js), [voyage/route-board-ui.js](voyage/route-board-ui.js) | Deliberate choices, costs, route editing and accessible controls |
| [voyage/shoreline-art.js](voyage/shoreline-art.js), [voyage/coast-art.js](voyage/coast-art.js) | Contours, shallows, working coast props and story-state tables |

Voyage and profile schema versions remain 1. Optional voyage records are `supperPermit`, `supper`, `lanternRuns`, `crateMystery` and `routeBoard`; the profile adds `evenings`. Older saves without them remain valid. Validators reject unknown IDs, unsafe shapes, duplicate terminal records, future timestamps, unserved completion, unverified recovery, inconsistent contributions and itinerary-embedded prices or rewards. Neither subsystem reads or writes Classic storage.

## Validation

Run [tools/voyage-evenings-checks.mjs](tools/voyage-evenings-checks.mjs) alongside the relevant suites in [VOYAGE-PLAYTEST.md](VOYAGE-PLAYTEST.md). Coverage includes each menu/mode, both case resolutions, all six course/mode combinations using actual sailing, explicit cash settlement, early-refill itineraries, malformed optional state, profile bounds, continuation and production callbacks.

Native renders inspect numbered course gates, new decorations, coastline details, both investigation tables and hosted station suppers. Browser/device acceptance must additionally verify route editing, focus and fixed Back/Close at phone widths, touch steering around gates, performance of twelve-stop budgets and the readability of portraits and scene details. Automated and native-render results do not establish physical-phone comfort.
