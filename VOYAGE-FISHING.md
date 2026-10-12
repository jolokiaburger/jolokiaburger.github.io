# Voyage angling system

**Baseline:** Voyage 0.21. **Scope:** optional harbour and coastal fishing, catch presentation, field-guide content, personal records and save compatibility. Player instructions are in [PLAYER-GUIDE.md](PLAYER-GUIDE.md).

## Design and entry points

Fishing is a patient decision minigame. The player chooses borrowed tackle, waits for a persistent bite, sets the hook and responds to the fish's next movement. There is no reaction deadline, purchased bait, rod damage or cash penalty. Only an explicit landing spends game time. Relaxed mode retains automatic landing after the same settling time.

Open **Menu → Harbour pastimes → Dockside fishing** while moored. Every unlocked quay supports harbour fishing. **Coastal fishing** appears on the sailing controls in unlocked outer water at or east of x = 3400. It uses the same minigame and a separate expedition basket. **Captain's fish notebook** is available from pastimes, either basket and the catch reveal; reading it is free.

## Tackle and encounter selection

| Choice | Options | Function |
| --- | --- | --- |
| Lure | Bread crumb, silk fly, tin spinner | Adds weight to species favouring that lure |
| Depth | Surface, mid-water, near the bottom | Adds weight to species favouring that layer |

The quay determines eligible harbour species. Rain adds lantern bream to its harbour pool. The outer coast has moon mullet and ribbon mackerel. Eligible species start at selection weight 1 and gain 3 for each matching lure or depth. The interface lists local species and tackle preferences before casting; a preference improves the chance without guaranteeing a particular fish.

Selection is deterministic from seed, expedition night, source, quay, weather, catch index and tackle. Reopening a pending line keeps its species and tackle. Packing and recasting under identical conditions does not reroll it. Older pending lines retain the species already stored by the earlier system.

## Fight states and controls

| State | Player action | Time and persistence |
| --- | --- | --- |
| Tackle selection | Choose lure/depth and cast | Free; creates one pending line |
| Settling | Wait 2.2 real seconds while the fishing panel is open | Game clock stays paused; no hidden callback after close/replacement |
| Bite | Set the hook when ready | Free; bite has no expiry |
| Fight | Choose one line-control action per movement | Free; every decision waits for input and is saved |
| Beside the net | Lift into the landing net | Requires four complete game minutes before 06:00 |
| Practice limit | Reset the same fight or pack the rod | Free; no catch, payment or time penalty |

| Movement | Recommended response | Effect |
| --- | --- | --- |
| Swimming evenly | Reel steadily | Raises tension slightly and gains distance |
| Pulling away | Give line | Relieves a surge while retaining progress |
| Turning towards the boat | Lift the rod | Takes up slack and brings the fish closer |

Tension starts at 45%. The comfort range is 20–80%; leaving it lets the fish gain distance and returns tension to 45%. Misread movements can be recovered. Each species has a repeatable movement pattern with a tackle-dependent starting offset. A fight accepts at most 24 actions. Resetting at the practice limit keeps the encounter rather than granting a new catch.

Landing progress must reach 100% for a manual catch. Grades describe technique: **Delicate touch** for no recorded mistakes, **Steady hands** for at most two, and **Patient landing** otherwise. Assisted landings are labelled **Relaxed catch**. Grades and measurements award no additional credits, fuel, freight capacity or recipe knowledge.

The same Relaxed preference applies to both waters. In a new cast it hooks and lands automatically after the settling period while the panel remains open. An existing manual fight can be finished through an explicit assistance control. Native buttons support touch, keyboard focus and Enter/Space; no rapid tapping or held pointer is required. Reduced motion stops decorative float movement.

## Species and field guide

The eight pages describe fictional Basin observations. They are game-world lore, rather than taxonomic or real-world food guidance. Each page includes an illustration, habitat, preferred tackle, guide size range, bite description, diet, attributed character note, supper suggestion and tea pairing. Food notes do not unlock recipes or consume inventory.

| Species | Suggested tackle | Guide length | Main water |
| --- | --- | --- | --- |
| Silver sprat | Silk fly · Surface | 7–18 cm | Kurage, Market, Metro |
| Lantern bream | Bread crumb · Mid-water | 17–42 cm | Landing, Frostline, Market; other quays in rain |
| Canal carp | Bread crumb · Near the bottom | 22–65 cm | Kurage, Kisaragi |
| Blue mackerel | Tin spinner · Mid-water | 18–44 cm | Yard, Frostline, Shiosai |
| Reef rockfish | Tin spinner · Near the bottom | 14–38 cm | Hoshimi |
| Moonfin | Silk fly · Mid-water | 12–35 cm | Tsukimi, Hoshimi, Aonami |
| Moon mullet | Bread crumb · Surface | 25–58 cm | Outer coast |
| Ribbon mackerel | Tin spinner · Mid-water | 24–60 cm | Outer coast |

New catches receive a deterministic length in millimetres and a species-scaled mass in grams. Both depend on seed, current expedition night, source, catch index and species; technique does not change size. The reveal and basket display length, mass, technique, tackle and weather. The profile keeps the largest measured specimen per species, with at most eight pages. Syncing a catch repeatedly changes no counters or rewards. Earlier catches remain observed without fabricated measurements.

## Inventory and economy contracts

| Water | Limit | Kept capacity | Disposition |
| --- | --- | --- | --- |
| Harbour | Six landed catches per night | Three kept fish; separate from freight | Release free; Nao pays 6 cr once at the Market with no handover time; existing gifts/recipes consume the selected catch |
| Coast | Three landed catches per expedition night | Separate expedition basket | Share at Aonami or the Market, free, four game minutes; no sale or harbour-recipe use |

Full-duration checks run before casting and again before landing. A catch finishing exactly at 06:00 settles once, shows its illustrated reveal and offers **Back to voyage report**. Waiting, practicing, packing and inspecting do not advance simulation time or spend propulsion fuel. Normal sailing after closing the activity still spends fuel and time.

## Source and save contracts

| Source | Responsibility |
| --- | --- |
| [voyage/fishing.js](voyage/fishing.js) | Species metadata, weighted selection, bounded action replay, measurements, transitions and validation |
| [voyage/fishing-ui.js](voyage/fishing-ui.js) | Shared tackle/fight panels, timer disposal, catch reveal, baskets and notebook |
| [voyage/fishing-profile.js](voyage/fishing-profile.js) | Optional bounded observations and largest measured specimens |
| [voyage/leisure.js](voyage/leisure.js) | Existing harbour catch ownership, six-catch limit, release and Nao payment |
| [voyage/breakwater.js](voyage/breakwater.js) | Existing coastal basket, access, three-catch limit, sharing and continuation |
| [voyage/leisure-ui.js](voyage/leisure-ui.js), [voyage/breakwater-ui.js](voyage/breakwater-ui.js) | Activity entry points and shared presentation adapters |
| [voyage/voyage.js](voyage/voyage.js) | Saving, profile sync, explicit panel lifecycle and report return |
| [assets/fish/](assets/fish/) | Eight local 1536 × 1024 WebP illustrations, loaded in activity panels |
| [tools/voyage-fishing-checks.mjs](tools/voyage-fishing-checks.mjs) | Rule, malformed-state, legacy and production-callback regressions |

Voyage and profile schemas remain version 1, with unchanged storage keys. Optional state `angling.pending` stores source, species, index, quay/position, starting clock, tackle, phase and at most 24 known action IDs. Tension and progress are derived by replay rather than stored as trusted values. Harbour ownership remains in `leisure.fishing`; coastal ownership remains in `breakwater.catches`. Each new catch has optional `measure` metadata. Profile `fishJournal` holds at most eight unique observed species and optional best measurements.

Validators reject mismatched ownership/indexes, unknown identifiers, future or non-finite fields, impossible size/mass combinations, actions after a completed fight and invalid technique grades. Older lines, catches and profile observations remain valid before hydration. No migration creates money, physical inventory, expedition access or measurements for an earlier catch.

Closing/replacing a panel cancels its timer and invalidates its callback generation. Hidden tabs postpone bite/automatic landing until the panel is visible again. A saved line can be resumed without opening a startup popup. Departure, docking, actual boat displacement or loss of landing eligibility packs it; dawn clears it. Completed catches remain subject to existing single-use cooking, gifting and sharing validators. The new system does not read or write Classic storage.

## Validation

Run `node tools/voyage-fishing-checks.mjs` with the activity, neighbour, expedition, UI, base-engine and Classic suites in [VOYAGE-PLAYTEST.md](VOYAGE-PLAYTEST.md). Coverage includes all tackle combinations at all quays, both coastal species, saved phases, finite recovery, assistance, limits, single payments, exact dawn, malformed records, timer cancellation and illustrated production callbacks.

Inspect all eight illustrations at catch-card and phone widths, including loading failure. Manually test button focus, panel scroll, touch comfort, portrait/landscape layouts, reduced motion and return from a dawn reveal. Browser/device observations remain separate from mock DOM and native image verification.
