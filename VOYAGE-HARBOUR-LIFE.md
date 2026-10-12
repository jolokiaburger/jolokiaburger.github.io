# Voyage harbour pastimes and travel budgets

**Scope:** optional fishing, kitchen shifts, photographs, cosmetics and individual-route estimates in Voyage 0.20. Entry points are Menu, Journal and the relevant People/Services controls. Activities open through explicit player choices.

## Fishing rules

Harbour fishing is available while moored at every unlocked quay. [VOYAGE-FISHING.md](VOYAGE-FISHING.md) defines the lure/depth selection, persistent bite, patient tension minigame, Relaxed mode, illustrated species notebook and measurement records. Harbour and outer-coast fishing share this presentation while retaining separate inventory rules.

Each landed harbour catch requires four full game minutes before dawn. Six catches per night and three kept slots remain separate from freight. Releasing frees a slot; Nao pays 6 cr once for a kept catch at her market counter without additional handover time. Existing gifts and learned recipes consume the actual selected fish. The first shared harbour catch still unlocks the paper-fish decoration.

Pending lines and decisions are saved without forcing an activity window open. Closing/replacing a panel cancels its timer. Departure and actual movement pack the rod. Older catches retain their outcomes and observations without fabricated sizes.

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

The active two-order comparison and route board use the same pump-aware simulation. The older [voyage/model.js](voyage/model.js) helper remains for legacy saved routes, which can be imported. Route previews never guarantee a future gold quote. Full itinerary and action-dependency contracts are in [VOYAGE-EVENINGS.md](VOYAGE-EVENINGS.md).

## Presentation and implementation

Portrait selection uses [voyage/ports.js](voyage/ports.js). Optional seats at Kurage, the Market and Kisaragi use local scenes and explicit return controls. Food trays use native SVG; eight fish illustrations use local WebP cards. Photographs, markers and keepsakes are native Canvas. Asset specifications are in [ART-DIRECTION.md](ART-DIRECTION.md) and [tools/asset-manifest.json](tools/asset-manifest.json).

| Source | Responsibility |
| --- | --- |
| [voyage/leisure.js](voyage/leisure.js) | Activity costs, eligibility, rewards and optional-state validation |
| [voyage/leisure-profile.js](voyage/leisure-profile.js) | Bounded species notebook, album and cosmetics |
| [voyage/leisure-ui.js](voyage/leisure-ui.js) | Activity entry points, tray controls and illustrated seats |
| [voyage/fishing.js](voyage/fishing.js), [voyage/fishing-ui.js](voyage/fishing-ui.js), [voyage/fishing-profile.js](voyage/fishing-profile.js) | Shared angling rules, panels, timer lifecycle, notebook and records |
| [voyage/travel-plan.js](voyage/travel-plan.js) | Pump-aware budget simulation and bounded route cache |
| [voyage/voyage.js](voyage/voyage.js), [voyage/voyage.css](voyage/voyage.css) | Journey strip, photo drawing, keepsakes and responsive integration |

The optional `leisure` records preserve version-1 save compatibility. Validators check known IDs, unique records, timing, rewards, thumbnail constraints and consumed-catch consistency. Pending UI timers are transient; pending line data is persistent. All committed activities obey the full-duration dawn contract.

## Validation

Run the leisure, neighbour, base-engine and UI suites in [VOYAGE-PLAYTEST.md](VOYAGE-PLAYTEST.md). Inspect native photographs and keepsakes through the optional render suite. Manual QA must cover touch fishing, relaxed controls, closing during a bite, tray drafts, all photo views, storage failure and phone return controls. Browser layout and real-device performance require separate results.
