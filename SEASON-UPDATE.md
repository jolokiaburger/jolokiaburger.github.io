# Classic season and world continuity

**Scope:** Classic 4.6.1's three connected trading chapters. Reports provide explicit continuation controls; a fresh season remains a separate action.

## Chapter schedule

| Chapter | Time | Main thread |
| --- | --- | --- |
| Night One | 23:40–06:00; turn-in from 01:30 | Gold rumours, market dispatch and Nao's first breakfast |
| A Lantern for Tomorrow | 23:40–06:00; turn-in from 01:30 | Recipe trial, sealed rice and Kisaragi invitation |
| Morning After the Lanterns | 06:40–11:00; rest from 08:00 | Revised lock route, stranded festival kit and late breakfast |

Continue through each shift report. Credits, gold purchase basis, fuel, relationships and eligible memories carry forward. New markets have fresh stock/allowances and orders; there is no free refill or repeated quest payout. Unfinished commercial stock is handled at settlement rather than silently becoming a new purchase.

## Persistent harbour state

[harbour-life.js](harbour-life.js) provides current/earlier delivery reactions and props: reef kits, Nao's menu, Hana's spoons, signed recipe, Jun's tea, repaired pump and returned keepsake. An unfinished brass-star reunion can continue across chapters. Scene memory uses existing flags and counters and preserves older valid saves.

Starling Yard offers pump repair, salvage records, Lam's brass keepsake, bracket checks, workshop food and character encounters alongside gold/refuelling. [classic.html](classic.html) uses its local workshop plate with native portrait/work targets.

## Small cargo and company

Ceramic bowls for Mei, pump seals for Mako and lantern cloth for Sora use a two-slot small-freight hold separate from rice. Offers show written costs/windows and settle once after delivery. Fuel may consume a gross margin.

Nao can join a quiet ferry break after appropriate recipe/breakfast progress. Lighthouse and canal-bench visits are free apart from ordinary crossings. Her counter closes while she is aboard; the Market return action restores her work presence. Follow-up dialogue reflects completed visits.

## Crossing planner

[game.js](game.js) provides Plan a crossing. Selecting a destination spends nothing. The card reports arrival, fuel, return cost, refill affordability and held delivery deadlines/payments. Recorded quotes retain their observation time and age. Direct destination controls remain available. Estimates require practical allowance for route-specific actions.

## Chapter Three delivery — story spoilers

After Mei's introduction and Nao's free breakfast, collect Hana's stranded table kit at the yard and consult Priya's revised route. The five-minute handover must start by **10:15**, finishing by 10:20, for an 18-cr courier reward.

| Seeded situation | Destination/access |
| --- | --- |
| Clear canal | Deliver to Hana in Kisaragi |
| Low water | Canal closed to the Tern; Hana receives at Night Market |
| Late lock release | Locks reopen at 08:00; obtain the signed route and deliver in Kisaragi |

Normal progression derives morning conditions from the earlier seed. `morning-clear`, `morning-low` and `morning-late` are development examples. Gold trading and repairs are optional. A bounded emergency voucher keeps the main free delivery recoverable with an empty purse.

The late breakfast closes the morning thread. An optional prepared family picnic appears as a settled post-shift scene, not a fourth trading chapter; see [HARBOUR-REFINEMENTS.md](HARBOUR-REFINEMENTS.md).

## Sources and validation

[night-two.js](night-two.js) and [morning-after.js](morning-after.js) build chapter data; [harbour-life.js](harbour-life.js) owns continuity; [game.js](game.js) owns transitions, validation, accounts and planner presentation. [classic.html](classic.html)/[styles.css](styles.css) render scene memories.

Run `node tools/adventure-checks.mjs` and `node tools/sound-checks.mjs`. Required cases include all morning routes, real resources, boundary handovers, chapter reload/continuation, memories, companion visits, zero-purse recovery and repeated-payment guards. Manual QA must verify the complete three-chapter season, planner scrolling and persistence on desktop/phones.
