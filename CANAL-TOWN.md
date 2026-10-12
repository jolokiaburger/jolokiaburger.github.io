# Classic Kisaragi Canal Town specification

**Scope:** the Classic trading season. Kisaragi contains Hana Tsukino's festival work, Jun Arai's tea shop and Mako Senda's lock records. Case-file investigations retain their original destinations.

## Access and facilities

Priya's canal pilot sheet unlocks the route. Crossings cost two fuel/forty minutes from harbour quays or four fuel/55 minutes from Hoshimi. Unlocks carry across chapters. Morning access follows Chapter Three's lock state, described in [SEASON-UPDATE.md](SEASON-UPDATE.md).

Facilities include bounded gold trading, 30-cr/ten-minute refuelling, tea, dumplings, ceramics/bridge reading and free authored character exchanges. The existing tug recovers to Landing 3 when required.

## Sealed tea trade

Jun offers one case for 24 cr/five minutes. Sora pays 38 cr at the Night Market with a five-minute handover. The 14-cr gross margin excludes travel and fuel. Collection closes at 05:10; last night handover starts at 05:55. There is no replenishment or automatic dawn payout. Unsettled commercial cases are set aside at shift end rather than carried to a fresh market.

[game.js](game.js) stores the optional `canalTrade` account and separates its stock cost/revenue from gold performance. Parcel rewards use a distinct account; rice retains its own ingredient rack. Older valid saves without the tea field remain supported.

## Unfinished address

Accept Mako's parcel, check the festival notice for five minutes and ask Jun about the fourth table. Hand it to Hana for 12 cr, once. Reading/talking and the final parcel handover are free; ordinary crossing costs apply. Purchases are not required.

## Nao's Chapter Two invitation — story spoilers

1. Choose Nao's recipe and read Hana's invitation; it also supplies the pilot sheet.
2. Prepare a free sample for ten minutes, meet Hana in town and ask Jun about tea without purchasing stock.
3. Return to Nao and choose a small festival table or a signed recipe that preserves her afternoon with Haruto.
4. Return to Kisaragi for the preview supper or card delivery. Supper takes ten minutes; from 05:50 a free quiet-table ending remains until dawn. Card delivery is free.

Nao's original recipe tasting can occur in town after 05:00 when she travels with the captain. These branches award no gold or cash. Early turn-in records unfinished progress rather than completing it automatically. Follow-up dialogue, scene props and the wire use the selected outcome.

The folded Kisaragi log gathers route, tea, parcel, sample and invitation progress in both story and notebook. Chapter Three's afternoon vignette is specified in [HARBOUR-REFINEMENTS.md](HARBOUR-REFINEMENTS.md).

## Source and validation

| Source | Responsibility |
| --- | --- |
| [canal-town.js](canal-town.js) | Route registration, residents, actions, invitation and chapter extensions |
| [game.js](game.js) | Tea account, validation, route memory, folded log and camera |
| [classic.html](classic.html), [styles.css](styles.css) | Canal plate, portrait targets, labels and scene state |
| [assets/scenes/kisaragi-canal.webp](assets/scenes/kisaragi-canal.webp) | Local scene plate; portraits listed in the asset manifest |

Run `node tools/adventure-checks.mjs` for route/resource costs, parcel gates, rewards, saves, both invitation branches across truths, town tasting, late arrival and recovery. Run audio regressions for shared changes. Manual phone checks cover three person targets, log readability, canal departure and companion return.
