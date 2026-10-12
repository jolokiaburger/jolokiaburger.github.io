# Voyage harbour pastimes and travel budgets

**Scope:** optional fishing, kitchen shifts, photographs, cosmetics and individual-route estimates in Voyage 0.18. Entry points are Menu, Journal and the relevant People/Services controls. Activities open through explicit player choices.

## Fishing rules

Fishing is available while moored at every unlocked quay, including the coast. A cast settles for 2.2 real seconds; after the bite, Reel in remains available without a reaction deadline. Relaxed mode reels automatically after the same settling time. Casting, waiting, viewing the basket and packing away are free of game time.

Each landed catch uses four game minutes, which must fit before dawn. A voyage allows six landed catches and a separate three-fish kept basket. Fish do not occupy freight slots. Releasing a kept fish frees space. Nao's market counter pays 6 cr for each shared kept catch, once, without additional game time. Gifting and learned recipes use their own explicit consumption rules.

Six species vary deterministically with quay, weather and seed: silver sprat, lantern bream, canal carp, blue mackerel, reef rockfish and moonfin. Recasting does not reroll a pending result. Species knowledge persists in the profile.

A pending line is saved without forcing its panel open. Departure packs it away. Closing or replacing the panel disposes its timer; no catch may commit behind another activity. The first shared catch unlocks the paper-fish decoration.

## Nao's kitchen shift

Nao supplies ingredients at her Night Market counter. The three customers arrive in a fixed order:

| Customer | Favourite broth | Topping | Tea |
| --- | --- | --- | --- |
| Priya | Gentle miso | Silken tofu | Roasted |
| Kenji | Ginger | Roasted mushrooms | Black |
| Mei | Gentle miso | Spring greens | Jasmine |

Serving takes six game minutes and pays 4 cr, plus 2 cr for the favourite combination. An alternate tray receives its own response and the normal payment. A complete shift takes eighteen minutes and pays 12–18 cr. Each customer settles once per voyage; the final tray unlocks the tea-cup decoration.

Ingredient selection is a free draft until serving. Rejected or abandoned trays spend nothing. The shift is unavailable while Nao is aboard. Learned fish recipes are a separate activity; see [VOYAGE-NEIGHBOURS.md](VOYAGE-NEIGHBOURS.md).

## Photographs and album

| Requester | Required views | Reward |
| --- | --- | --- |
| Yumi at Metro | Market lanterns and Kisaragi bridge | Pennant decoration |
| Mio at Tsukimi | Hoshimi's light | Brass-star decoration |

Accept at the requester's home quay, approach the marked view and choose Frame a photo. Opening the camera stops the ferry. Wide/close selection is free; capture takes two game minutes and no credits. Each view can be captured once per voyage. Return explicitly to settle the request; there is no delivery deadline or automatic reward.

Photographs draw the actual Canvas harbour at 480 × 320. The persistent album stores the latest capture of each of the three views with framing, weather and time. Thumbnail values have bounded size and accept only local PNG/WebP data. If image storage fails, recorded errand progress remains and the UI displays the limitation. No device camera permission or upload is required.

Owned decorations are selected in the ferry studio and appear on the Tern's rail. They change appearance, not navigation, fuel, prices or cargo capacity.

## Individual-route budget contract

The journey strip combines destination, estimated arrival, route fuel and the nearest cargo deadline. If the tank cannot cover a leg, [voyage/travel-plan.js](voyage/travel-plan.js) searches reachable pumps. A workable result names the next pump and includes its 30-cr/ten-minute full refill. The player must set course to it; advice does not silently replace an assisted route.

Cargo trip budgets simulate collection, release waits, shared hold occupancy, purchase funding, five-minute handovers, deadlines, useful pump stops and return to Kurage. They report fuel used, ending tank, cash on return and failure reasons.

| Term | Meaning |
| --- | --- |
| Gross margin | Promised cargo payment minus purchase price |
| Estimated net cash | Gross margin less new fuel purchases on the simulated trip |
| Starting fuel | Already aboard; its earlier purchase is excluded from estimated net cash |
| Arrival estimate | Route estimate with modelled waits/actions; manual turns and detours need allowance |

The two-order planner in [voyage/model.js](voyage/model.js) retains its distance estimate and conditional refuelling limitation. Route previews never guarantee a future gold quote.

## Presentation and implementation

Portrait selection uses [voyage/ports.js](voyage/ports.js). Optional seats at Kurage, the Market and Kisaragi use local scenes and explicit return controls. Food/fish shapes are native SVG; photographs, markers and keepsakes are native Canvas. Asset specifications are in [ART-DIRECTION.md](ART-DIRECTION.md) and [tools/asset-manifest.json](tools/asset-manifest.json).

| Source | Responsibility |
| --- | --- |
| [voyage/leisure.js](voyage/leisure.js) | Activity costs, eligibility, rewards and optional-state validation |
| [voyage/leisure-profile.js](voyage/leisure-profile.js) | Bounded species notebook, album and cosmetics |
| [voyage/leisure-ui.js](voyage/leisure-ui.js) | Activity panels, tray controls, fishing timer lifecycle and illustrated seats |
| [voyage/travel-plan.js](voyage/travel-plan.js) | Pump-aware budget simulation and bounded route cache |
| [voyage/voyage.js](voyage/voyage.js), [voyage/voyage.css](voyage/voyage.css) | Journey strip, photo drawing, keepsakes and responsive integration |

The optional `leisure` records preserve version-1 save compatibility. Validators check known IDs, unique records, timing, rewards, thumbnail constraints and consumed-catch consistency. Pending UI timers are transient; pending line data is persistent. All committed activities obey the full-duration dawn contract.

## Validation

Run the leisure, neighbour, base-engine and UI suites in [VOYAGE-PLAYTEST.md](VOYAGE-PLAYTEST.md). Inspect native photographs and keepsakes through the optional render suite. Manual QA must cover touch fishing, relaxed controls, closing during a bite, tray drafts, all photo views, storage failure and phone return controls. Browser layout and real-device performance require separate results.
