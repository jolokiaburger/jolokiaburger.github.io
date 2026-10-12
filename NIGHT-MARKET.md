# Classic Lantern Night Market specification

**Scope:** the Classic trading season. The market has Sora's scale, Nao's food counter, Kenji's repair bench and a delivery lane. Free directory browsing filters available actions while retaining the full arcade composition.

## Facilities and late watch

| Facility | Rules |
| --- | --- |
| Sora's scale | Ordinary gold quotes, trade impact, finite selling stock and buying allowance |
| Nao's counter | Skewers 9 cr/ten minutes; barley tea 6 cr/ten minutes; authored meal conversations |
| Kenji's bench | One fuel for 6 cr/five minutes, once per night, below a full tank and before closure |
| Late watch | Kenji and grill close at 03:30; bun/tea replaces skewers at 8 cr; kettle and scale remain available until dawn |

Browsing and casual chat are free. Food/search costs are explicit; casual replies do not substitute for required dispatch evidence. Directory selection is transient and resets on arrival/load, while progression and payments save normally.

## Dispatch investigation — story spoilers

Ask Sora about the overdue launch, read the current manifest in the delivery lane for five minutes, then verify it with the named dispatcher. The Journal retains the courier guess and checked dispatch separately, with source and time.

| Seed | Dispatcher | Arrival | Gold added to Sora's selling tray |
| --- | --- | --- | --- |
| `frost-order` | Rin, Starling Yard | 02:00 | 16 g |
| `two-tides` | Rin, Starling Yard | 02:00 | 12 g |
| `vault-light` | Priya, Landing 3 | 03:00 | 12 g |

Sora begins with 12 g. Arrival occurs regardless of investigation and adds stock cumulatively without resetting purchases. Her 18 g buying allowance does not replenish. A local shortage begins at 00:40, rising to +7% over ten minutes; arrival adds a −9% modifier over fifteen minutes. Other events, noise and trades still affect prices.

After verification, choose one mutually exclusive settlement:

| Choice | Payment and requirements |
| --- | --- |
| Kenji's contact order | Sell exactly 2 g before 03:30 at current bid plus 4 cr/g; consumes actual gold, purchase basis and 2 g buying allowance |
| Sora's dispatch report | 25 cr courier fee, once; requires no gold and remains available after Kenji closes |

The sale preview displays its total; insufficient gold/capacity disables it. The courier fee is separate from trading performance. A checked schedule offers an explicit wait to arrival; waiting advances the market without buying a meal. Completion is guarded against repeated clicks and reload payouts.

## Source ownership

| Source | Responsibility |
| --- | --- |
| [night-market.js](night-market.js) | Stalls, dispatch branches, rumours, conversations, arrivals and story state |
| [market.js](market.js) | Cumulative selling-stock arrival, retained purchases and buying caps |
| [game.js](game.js) | Directory, filters, contract preview/sale guards and camera |
| [classic.html](classic.html), [styles.css](styles.css) | Arcade plate, sprites, semantic targets and late-watch overlays |

The lighthouse actions retain their IDs. Nao's breakfast uses the separate rules in [NAO-STORY.md](NAO-STORY.md). Asset specifications and inventory are in [ART-DIRECTION.md](ART-DIRECTION.md).

## Validation

Run `node tools/adventure-checks.mjs`. Required regressions include both dispatch routes/outcomes across all truths, actual crossings/refuelling, arrival boundaries, exhausted stock, buying caps, insufficient gold/cash, late closure, waiting, reload and repeated settlement. Browser/phone QA must check target selection, directory scroll, the complete arcade view and whether investigation costs are understood before travel.
