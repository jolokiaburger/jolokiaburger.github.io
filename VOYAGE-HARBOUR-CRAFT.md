# Harbour craft and changing water

**Baseline:** Voyage 0.21. This specification covers Jun’s tea table, small recoveries, nightly requests, current assistance and precision steering. World geometry, eleven quays, Classic and both Voyage save schemas remain unchanged.

## Player access and costs

| Activity | Entry | Commitment |
| --- | --- | --- |
| Tea brewing | Kisaragi → Jun → Brew tea, or Menu/Pastimes → Jun’s tea-brewing table | Preparation is free; sharing one cup uses 6 game minutes. Six cups per night. |
| Small recoveries | Menu → Small salvage adventures; Recover appears within 75 world units of a site | Preparation is free; bringing an object aboard uses 4 minutes. Returning it to its owner uses another 4 minutes. |
| Harbour requests | Menu/Pastimes → Tonight’s harbour requests, or the relevant character | Three optional goals; the thank-you is free and instantaneous. No cash payout or inventory consumption. |
| Currents | Read water above the sailing view; Menu → Tides & sailing symbols | A following stream assists movement. Normal distance-based fuel applies. |
| Gentle helm | Helm toggle in the sailing controls | Manual propulsion runs at 55% of normal speed. Assisted courses keep normal speed. |

All committed activities require their complete duration before 06:00. An activity ending exactly at dawn succeeds. Tea and recovery reveals retain a Morning report action at dawn. Panels are deliberate and never interrupt a crossing automatically.

## Jun’s tea simulation

[voyage/tea-brewing.js](voyage/tea-brewing.js) owns blends, action validation, replay and serving. [voyage/harbour-craft-ui.js](voyage/harbour-craft-ui.js) renders the tray, recipe cards, phase sequence, target bands, keyboard-operable controls and cup result. The simulation is action-paced: no wall-clock callback changes temperature or forces a pour. Closing the panel pauses preparation; reopening or reloading resumes the recorded inputs.

| Blend | Target water temperature | Reference extraction | Guest preference |
| --- | --- | --- | --- |
| Aonami green | 78°C | 60 seconds | Jun |
| Lantern roast | 92°C | 90 seconds | Hana |
| Moon jasmine | 84°C | 75 seconds | Mako |

The reference water dose is 180 ml for each blend. Jun supplies the leaves; no money or freight is involved. Guests rotate in the listed order, twice per night. A different blend is welcome; the guest response distinguishes a well-made favourite.

### Phases

1. **Kettle:** water starts at 60°C. Heat adds 8°C, gentle heat adds 2°C and cooling subtracts 3°C, bounded to 40–100°C. Begin approximately 3°C above the recipe target to allow for pouring losses.
2. **Pour:** add 30 ml or 10 ml, up to 240 ml. Each pour cools the kettle by 1°C. The first pour locks the kettle controls. The simulation records the volume-weighted initial infusion temperature. At least 90 ml is needed to immerse the leaves.
3. **Steep:** advance by 15 or 5 brewing seconds, bounded to 180 seconds. Extraction integrates elapsed brewing time, temperature and concentration. Water cools by 0.035°C per brewing second. Decanting becomes available after five seconds. The pale band marks 90–110% extraction.
4. **Cup:** decanting locks the result. Share it for six game minutes, or discard the practice pour at no cost. The score penalises extraction error, water-dose error, initial temperature error and excessive initial heat. A score is feedback, never a monetary multiplier.

Brewing seconds are simulation units within the activity; only sharing advances the harbour clock. Actions cap at 120 per pour. Practice reset is always available for an unfinished or unserved pour. Departure packs unfinished tea. Finishing a voyage clears uncommitted preparation.

## Recovery adventures

[voyage/salvage-adventures.js](voyage/salvage-adventures.js) defines three fixed, navigable sites in existing waterways:

| Object | Coordinates | Owner / return quay | Story |
| --- | --- | --- | --- |
| Silent bicycle bell | 590, 880 | Yumi / Metro | Soup-delivery signals before the platform wire |
| Blue recipe tin | 1780, 1190 | Nao / Market | Floating kitchens and making room for another diner |
| Clouded signal lens | 2660, 1130 | Mio / Observatory | Coloured weather lamps and night vision |

Amber diamonds identify unrecovered sites in the sailing view. The notebook can set a safe assisted course to each one. Approach within 75 units, stop and lower the line. The separate recovery box never occupies freight slots. These adventures do not replace the original paid signal-kit salvage.

The player aligns a seven-lane hook with three successive visible gaps. Lowering outside a gap records a snag without damage or item loss. Once attached, lifting adds 25% recovery and 24 tension; easing removes 30 tension, with a floor of 15. A lift above 85 tension slips back by that lift’s progress and resets tension to 45. Reaching 100% enables the four-minute retrieval. There are at most 80 preparation actions; packing and restarting is free.

Moving the boat, docking, leaving the site or reaching dawn cancels an uncommitted line. Closing its screen preserves it. Retrieval is recorded once per site per night. Returning the object records a separate timestamp and reveals attributed fictional Basin history. The notebook displays an illustrated object and owner; returning never creates money.

## Nightly request board

[voyage/harbour-requests.js](voyage/harbour-requests.js) deterministically selects three of four goals using the voyage seed and expedition night:

- Share tea scoring at least 80; report to Jun at Kisaragi.
- Record two different fish species; report to Nao at the Market. Keeping, cooking, gifting, sharing or releasing a caught fish does not erase its observation.
- Return one recovered object; report to Yumi at Metro.
- Complete two kitchen trays; report to Nao at the Market.

The board shows actual progress, destination, requirement and disabled reason. Goals can be completed before opening it. A thank-you requires the relevant quay, completed evidence and a live voyage. Each is recorded once, without consuming the evidence or adding money. These requests supplement the existing letter jobs and neighbour favours.

## Currents and precision sailing

[voyage/tides.js](voyage/tides.js) derives a four-hour cycle from the seed and game clock. Flood runs east; ebb runs west. Strength follows a smooth sine envelope, reaching a maximum 18% speed contribution. Assistance is the nonnegative projection of the requested heading onto the current. Crossing or opposing the stream retains normal engine speed. Within 120 world units of any quay, assistance is zero.

[voyage/navigation.js](voyage/navigation.js) applies the bounded multiplier to desired speed. Both [voyage/model.js](voyage/model.js) and the replacement coastal movement function in [voyage/breakwater.js](voyage/breakwater.js) supply it. Collision checks, route geometry, world limits, fuel per travelled distance and the coast unlock remain authoritative. No current displaces a stopped boat. Lantern course times reflect actual sailing conditions.

Mint arrows show direction only on clear water. Reduced motion makes them static. The Read water control names the stream and explains the next turn. Existing route estimates use normal cruising speed without current assistance, so a following stream can produce an earlier arrival. Gentle helm is a controller preference for manual precision at 55% propulsion speed; its additional sailing time is not included in normal-speed estimates. It does not persist in the save or affect assisted courses.

[voyage/voyage.js](voyage/voyage.js) draws widening wake rings, exposes contextual recovery and adds the precision toggle. Touch directions retain pointer cancellation and have a minimum 48-pixel target. Recovery uses both shape and text; current information is available without interpreting colour.

## Persistence and validation

| Optional field | Bound and responsibility |
| --- | --- |
| `teaCraft.pending` | Blend ID and at most 120 replayed actions; only valid at Jun’s quay before the voyage ends |
| `teaCraft.cups` | At most six completed replays with chronologically consistent serving timestamps |
| `recoveries.pending` | Site, start position and at most 80 replayed actions; boat must remain within reach and stationary |
| `recoveries.finds` | At most three unique completed recoveries, with retrieval and optional later return timestamps |
| `harbourRequests` | At most three unique selected request IDs, timestamps and existing completion evidence |
| Profile `craftBook.tea` | At most three unique blend IDs and integer personal-best scores from 0–100 |
| Profile `craftBook.stories` | At most three unique returned-object history IDs |

Missing fields remain valid for old saves. Live activity fields are created only when needed. [voyage/craft-profile.js](voyage/craft-profile.js) adds bounded profile defaults and reconciles committed cups and returned histories idempotently. No replay creates credits or modifies Classic storage.

Expedition continuation starts fresh servings, recovery sites and request progress. Unreturned objects are forwarded ashore. Personal-best tea scores and already learned histories remain available across nights and fresh voyages through the captain profile. Existing money, gold, fuel, cargo and expedition continuation follow their earlier rules.

## Verification

Run `node tools/voyage-craft-checks.mjs` for production-module sequences, legacy saves, action bounds, resource conservation, exact dawn, malformed receipts, current limits, navigable sites, profile records and mock DOM integration. Run all regression suites listed in [VOYAGE-PLAYTEST.md](VOYAGE-PLAYTEST.md).

Real-browser review must cover narrow layouts, phase transitions, focus after repeated actions, meter announcements, native SVG decoding, long recovery notebooks, contextual button crowding, Gentle helm touch comfort and sustained current/wake rendering. Native drawing and mock DOM checks do not complete that coverage.
