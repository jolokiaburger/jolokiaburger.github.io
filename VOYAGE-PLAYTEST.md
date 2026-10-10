# Neon Tides Voyage · Playtest 0.8

Open the main game link and choose **Voyage**, or open `voyage/index.html` directly. Choose **Classic** for the complete previous game (`classic.html`). Classic's HTML, scripts and asset paths remain at the same origin, and its original localStorage key is unchanged. Voyage saves under `neon-tides:voyage:v1`. Saves do not transfer between the different rule systems.

## First route to try

1. Close the welcome guide. At Kurage 33, select Mei under People and collect her free tea case (5 minutes).
2. Cast off. Steer with WASD or arrow keys, use the touch direction buttons, or choose **Night Market** in Set course. Manual steering cancels assistance. The boat turns toward your chosen direction and slows when you release it; Stop holds position immediately.
3. Enter the quay's dotted ring and press **Dock** or E. The assisted route stops near the port; it does not dock without your choice.
4. Speak to Nao and deliver the tea: 24 cr, 5-minute handover, start by 03:40. Have a bun, or chat again for different replies.
5. Sail to Landing 3. Read the gold board, compare it with your remembered quotes in the Journal, and refuel if needed. The co-op releases recycled gold at 00:20; market crews create demand after 00:55. Observe the actual price before committing.
6. Explore the lantern in the western reeds. Close enough, an Investigate button appears. Recover the signal-light kit once for 36 cr and 12 minutes.
7. Finish under Services at any port, or continue until 06:00. The report separates realised gold profit, courier payment and salvage.

## Familiar faces, warmer quays · 0.8

- Nao, Rin and Mio have relaxed, thoughtful and pleased portrait variants. Plans use thoughtful faces; successful handovers, repairs and supper use pleased faces. Casual replies retain their normal or completed-story mood. No extra dialogue click is required.
- All fourteen quay figures have distinct hair, clothing and accessories matching the cast. Nao leaves her market figure while aboard and appears at the canal or observatory when moored there for her story.
- Small kettle steam, slow telescope adjustment, slack rope movement and a softly breathing work lamp add activity. System reduced motion freezes their movement. Shallow shoreline bands, submerged quay walls, shadows and small lantern reflections add depth without changing safe water or collision geometry.
- Three optional illustrations unlock after constellation supper, Nao’s market breakfast and Second Helping’s repair. **View moment** appears in relevant conversations and the Journal. Completed voyages retain those buttons in the captain’s history. Viewing is free, pauses sailing and never auto-opens over the map. Images have descriptive alternative text and a readable fallback if an image fails to load.
- Existing saves and histories remain valid. Older histories have no image record; existing supper/repair flags unlock their images in the current journal. A market breakfast played before 0.8 needs another breakfast visit to create its new memory flag.

All twelve new images are original, generated with the built-in image-generation tool from this game’s own character references. The exact prompts are in `tools/voyage-art-prompts.json`. Portraits are 512 × 512 WebP; optional scenes are 960 × 640 WebP. No image service runs during play.

## Familiar water, another night · 0.7

- **Captain’s history:** the Journal and Services show the latest twelve completed voyages, seeds, realised gold results, cargo result before fuel, discoveries, fuel purchases and shared moments. Finishing again or continuing and re-finishing updates the same entry. Active voyages are not archived. Finishing early counts as a completed voyage; reaching dawn is not required.
- **Different nights:** fresh voyages keep the five existing cargo requests and add one seeded request: Mei’s rice parcels (Kurage → Metro, 16/34 cr, release 00:20, deadline 04:20), Rin’s filters (yard → Landing, 22/46 cr, release 00:00, deadline 04:30), or Mio’s star charts (observatory → Kisaragi, 14/44 cr, release 00:40, deadline 05:20). The same seed selects the same request and demand pattern. Co-op supply and crew/instrument demand magnitudes vary, with unchanged event times. The board’s Tonight’s working harbour notice signals relative demand without promising profit. Older voyages without `demandVersion` preserve their original requests and market terms; start a fresh voyage for the new patterns.
- **Reservation:** reserve one uncollected request through the board. No credits or hold slot are taken. The Journal tracks the collection quay, release, cost and deadline; Cargo and board show collected/delivered status. Cancel before collecting for free. Collection uses the usual purchase and five-minute rules and clears the reservation. Other cargo remains available. Reserving does not extend a deadline, waive a purchase or promise spare hold space. Collected cases follow the existing delivery/expired-unload rules.
- **Ferry choices:** Services at Lantern Market or Starling Yard offers previews of three hull colours and three cabin lamps. Blue paint costs 12 cr, plum paint 14 cr, mint or rose lamps 8 cr; original choices are owned and free. A nameplate costs 5 cr once, then can be changed freely (up to twelve letters, numbers, spaces, apostrophes or hyphens). Previewing is free; buying/applying is explicit and takes no clock time. Owned styles carry between voyages, but money and gameplay upgrades do not. Cosmetics change no fuel, speed, capacity or dialogue identity.
- **Letters:** meaningful completed stories can produce letters from Nao, Mio, Rin, Aki or Jun. Read them in the Journal or captain’s history and mark them read. They survive starting a fresh voyage and do not unlock or complete quests. Reopening a report does not duplicate letters; a changed outcome updates the letter and marks it new. Letters belong to the latest twelve recorded voyages, with a maximum of forty-eight.

History, letters and cosmetics use `neon-tides:voyage:profile:v1`, separately from `neon-tides:voyage:v1`. A corrupt profile resets only that profile, with a notice; the active voyage remains intact. Storage-blocked sessions retain these features in memory but cannot persist them. `voyage/profile.js` owns profile validation, deduplicated records and cosmetic transactions. The optional `uid`, `reservation` and `demandVersion` fields keep older voyage saves compatible.

## A night worth bringing home · 0.6

- **Destination previews:** choose Plan your next destination in People, select a quay in the Journal chart, or use Set course while sailing. A preview shows local neighbours, fuel availability, cargo requests, unlocked jobs, active story steps and route estimates. Reading costs nothing and does not fetch unseen gold quotes. Cast off & set course is explicit; closing the preview commits nothing.
- **Encounter visitors:** each of the three existing discoveries has its original encounter and two seeded variants. Meet a fisherman or breakfast skipper, salvage released tea boxes or a survey chest, and read day-crew thanks or a folded star map. Labels, fuel/time costs and rewards remain explicit. The same seed has the same visitors. Resolved variants are saved, pay once and retain their specific journal outcome; older completed discoveries retain their original wording.
- **Trading feedback:** successful sales show revenue, purchase basis and realised result before fuel in the log and Market; the short toast shows revenue and result. Local harbour notices explain only events that have already occurred: recycled gold at 00:20, market crews at 00:55 and instruments at 02:00. No hidden future price is exposed. Fuel purchases and tug fees have separate report totals. Older saves begin a partial expense ledger at migration time; the report explicitly marks unavailable earlier expenses. Older sales without a purchase basis are excluded from realised results and labelled.
- **Nao aboard:** her existing portrait appears beside Crossing moment and in its reading panel. Four fresh post-supper lines reflect her recipe, the star map and the homeward crossing. The portrait uses the existing action area, with no new floating panel covering the sea.
- **Morning:** from 05:00 to 06:00 the water gradually brightens, with a gentle warm daylight tint and breakfast signage. Mei and Nao offer breakfast (4 cr, eight minutes) through People from 05:00. At dawn the closing harbour wire shares messages reflecting tea, Nao’s whereabouts, sky watching, supper and repairs. Finishing earlier uses evening wording. Messages grant no rewards and do not teleport the ferry or falsely return Nao home.

The optional `encounters` and `expenses` save fields retain version 1 compatibility. Tests cover preview side effects, all encounter visitors, duplicate rewards, expense migration, sale basis, breakfast timing and contextual endings. Native Canvas/mock-DOM checks exercise the new controls; real-browser phone layout still needs playtesting.

## Camera fix · 0.5.1

The camera centres the ferry and nearby quay/discovery in the area between the measured route controls, action buttons and touch pad. It can pan beyond world boundaries, so upper-edge water is reachable below the menu. A safety bound keeps the ferry clear immediately after zooming or resizing. Empty space beside the course selector passes clicks to the sea. `voyage/camera.js` contains the pure framing rules; rendering and hit-testing share the same camera transform in `voyage/voyage.js`.

## Stories across the water · 0.5

- **Harbour board:** read it through People at any quay, or the Journal. Neighbours post requests, casual remarks and notices reflecting deliveries, repairs and the new supper. Reading is free and pauses sailing. Cargo notices show fixed costs, payments, release times and destinations.
- **Trading talk:** the board and character conversations add trading notes to the Journal. Each note shows author, posting time, first hearing time and elapsed minutes. Re-reading preserves the first hearing time. Outlooks describe existing co-op supply, crew demand and instrument demand; they promise no profit. Fixed cargo contracts are labelled separately. Market has a Local trading talk button.
- **Constellation supper:** after sharing the sky watch with Nao, talk to her to plan supper. Collect Jun’s roasted tea at Kisaragi (6 cr, 5 minutes) and Mei’s ginger biscuits at Kurage 33 (4 cr, 5 minutes), in either order. The small recipe basket uses no freight slot. Bring Nao aboard, sail to Tsukimi and share the supper with Mio (free, 12 minutes). The Journal tracks each next step; the board, character reactions and observatory table reflect completion. Bring Nao home when ready. There is no additional deadline, but dawn still ends the voyage.
- **Navigation:** selecting a quay displays estimated arrival, sailing minutes, route fuel and a low-fuel warning. Estimates use safe assisted routing and reflect engine upgrades; turns, detours and stops need extra allowance. Manual steering, Stop and Escape clear the destination. View switches between close and wide; keyboard, touch and water-click targeting use the same camera transform.
- **Waterfronts:** a kitchen chimney, harbour clock tower, yard gantry and workers, canal banners and observatory supper table give quays distinct shapes. Market counters move into morning preparation after 03:30; Metro’s last train gives way to a departure notice after 01:40; Frostline’s unloading crew arrives after 02:00. Details stay decorative and do not change collisions. Reduced motion keeps ambient drawing still.

Existing saves preserve all earlier stories and gain an empty trading notebook; the save version remains 1. The new supper depends on the shared Nao sky-watch outcome, not a fresh voyage.

## The wider night · 0.4

- **Harbour sounds:** open Radio and turn Harbour sounds on independently of music. Quiet engine and wake follow sailing; wind and rain follow weather; departures have a low soft horn and mooring a gentle bell. Effects start Off, with separate 30%, 60% and 100% volume. Remembered settings require a tap after reopening. Panels, pauses and hidden tabs silence sailing ambience.
- **Discoveries:** look for a drifting survey chest, a resting delivery boat and a lantern message. Approach their dotted ring and choose Explore. Costs appear before committing; each outcome can be claimed once. Recovering the chest takes eight minutes and earns 18 cr. Helping the boat uses 0.6 fuel and ten minutes for 20 cr; arranging help by radio uses five minutes without fuel or payment. Reading the letter uses five minutes. Leaving a discovery also records its outcome.
- **Cargo planner:** the Journal lists paid cost, promised payment, destination, remaining delivery time and estimated route fuel for cargo aboard. Compare two available orders, including collection, release waits, return fuel and handover deadlines. Estimates exclude manoeuvres, refuelling time and detours; handover takes another five minutes. Fuel credit estimates use the full-tank rate and are not a guarantee of net profit.
- **Nao aboard:** crossing moments vary with destination, weather, visits and shared memories. After completing her festival return, invite her on another outing at Lantern Market. The original festival outcome stays completed; bring her back to finish the new outing.
- **Weather:** seeded clear water, rain and mist blend through the night. Weather is cosmetic: it does not change speed, fuel or prices. Quay markers remain above the haze; reduced motion removes animated rain.
- **Tsukimi Observatory:** ask Kenji at Lantern Market about Mio’s gold-contact kit. It opens at 00:40, costs 54 cr and pays 100 cr at Tsukimi if handover starts by 04:50. The outer-bay quay has a fuel pump, cocoa and astronomer Mio Amami. Delivering the kit unlocks a twelve-minute sky watch. Nao can join it, or share a six-minute return watch if you went alone first. The calibrated dome and telescope reflect delivery progress.

Older Voyage saves gain optional discovery records without a save-format change. Radio preferences use `neon-tides:voyage:radio:v1`; ferry effects use `neon-tides:voyage:sound:v1`. Neither changes Classic settings.

## Ghost Tide FM · 0.3.2

Open **Radio** (or `R`) and explicitly tune Ghost Tide FM for a mellow Halloween station: slow 72 BPM electronic pulses, minor chords, waves and wind. Volume cycles through 30%, 60% and 100%. Music preferences live separately from the game save; reopening asks you to tap to listen. Pumpkin accents, warm sea haze and small quay pumpkins follow the station and clear when it is Off. The sound and theme do not alter gameplay.

## Boat and waterfront detail · 0.3.1

The Tern now has deck rails, wheelhouse glazing, its nameplate, aerial, life ring, rope coil, navigation lights, visible case cargo and a softer curved wake. Moored and passing boats have fishing, tug, passenger-ferry and cargo-barge silhouettes. Waterfronts add ladders, fenders, cleats, mooring lines, rescue rings, rope coils, dock carts, nets and local freight equipment. These are visual details; sailing routes and save rules are unchanged. Reduced motion keeps wakes off and ambient details still.

## Refinement update · 0.3

- **Crossing moment:** after sailing 120 map units, an optional button opens one short passenger, radio or observation card. Opening the card pauses sailing. It never opens automatically, costs no clock time and can be ignored. New departures rotate the lines; Nao speaks when aboard. The selected line survives a save/reload.
- **Timed buyer requests:** Metro releases one gold-contact regulator case at 00:50: buy 48 cr, Kenji pays 78 at Lantern Market by 03:20. Frostline releases chilled jasmine starter at 02:00: buy 28 cr, Hana pays 50 at Kisaragi by 05:30. Cargo offers include labelled waits; these advance the clock to release time.
- **Route preview:** cargo cards show estimated sailing minutes and fuel for the safe outbound route, reflecting an engine upgrade. Fuel credits use the full-tank rate (30/6 = 5 cr per fuel). These are distance-based estimates; collection, turns, detours, the five-minute handover and return costs need separate allowance.
- **Expired cases:** unload at any quay after the delivery deadline. This frees a hold slot without payment or refund, keeps the purchase loss in the report, and cannot be used to buy the same contract again.
- **Working waterfronts:** striped kitchen awning and stools, market counters, train carriages, numbered cold bays, pipework, repair rails, crane hook, shop signs, small neighbours, moored skiffs, reeds and faint offshore mist. Decorative figures, vessels, reeds and mist do not create collision hazards. Buoys, quay rings and routes remain clear. After the pump repair, Second Helping leaves its dry slip and appears beside the yard; Nao’s table appears after the preview supper. Cargo buyers and sellers acknowledge settled deliveries.

## Controls and rules

- WASD/arrows or held touch buttons: direct steering. J: Journal. P: pause. E: dock. Escape: cancel course/stop, or dismiss an open panel.
- Click open water for an assisted course. The Set course selector work with keyboard and touch too. Assisted routes avoid land; manual steering remains available.
- Time advances only during movement and explicitly labelled activities. Conversations, trading, journal reading and panels pause it. Background tabs do not advance time.
- Start: 360 cr, 2 g gold, full tank. Gold lots use the existing deterministic `market.js` pricing, spreads, dealer impact and stock caps.
- Small tea courier contract: no stock purchase, one payment, deadline checked at handover start. Fuel is the captain's cost.
- Landing 3, Starling Yard, Kisaragi or Tsukimi refuel: 30 cr, 10 min, tank filled to 6. Market engine tuning: 80 cr, 15 min, 15% more speed and 20% less fuel per distance. Upgrade once.
- Out of fuel: the tug recovers you to Landing 3 in 20 min for up to 20 cr, including free recovery if penniless. No combat, hull damage or permanent death in this stage.
- Closing/reopening resumes the Voyage save. Corrupt or incompatible Voyage saves start fresh without altering Classic. Storage-blocked browsers still play for the session.

## Scope

This is the expanded sailing stage of the intended new full game. Nine quays are navigable: Kurage 33, Landing 3, Lantern Market, Metro Quay, Starling Yard, Frostline, Kisaragi, Hoshimi and Tsukimi. Fourteen characters have fresh casual replies, with contextual reactions after story progress. Classic remains the complete previous game.

## New routes and stories

- **Rin → Aki:** collect the free lighthouse kit at Starling Yard and take it to Hoshimi. Start the handover by 05:00 for 40 cr. The lighthouse brightens after delivery. Help Rin repair Second Helping for a separate ten-minute story outcome.
- **Nao → Kisaragi → home:** after delivering Mei’s tea, invite Nao aboard at Lantern Market. Speak to Hana or Nao in Kisaragi for the preview supper, then bring Nao home to her counter. Nao appears in the People list while travelling with you. This is a social story without a fee or special delivery deadline; the voyage still ends at dawn.
- **Stock cargo:** Jun sells a sealed bowl case in Kisaragi for 20 cr; Mei pays 36 cr at Kurage 33 by 05:10. Rin sells pump seals at the yard for 18 cr; Frostline pays 32 cr by 04:50. These are one-time purchases and payments. Buying and handing over take five minutes each. The difference is gross margin: fuel and other expenses are extra.
- **Shared hold:** tea, lighthouse kit and stock cases share two slots. Kenji’s cargo racks at Lantern Market cost 65 cr and ten minutes, adding a third slot. Gold and Nao do not occupy case slots.
- **Journal:** lists several active stories and completed outcomes, with a Track action for the objective line. The Basin chart marks visited quays and lets you set a course after casting off. Remembered gold boards include their observation time.

Buildings now have roof tiles, skylights, warm windows, quay reflections, trees and cargo stacks. New landmarks include the yard crane and repair ferry, Metro platforms, Frostline chillers, Kisaragi’s canal bridge and lantern table, and Hoshimi’s sweeping lighthouse. Small workboats and restrained rain add movement. The map remains procedural Canvas artwork for playtesting; final painted environments, the broader chapters, Harbour Wire and additional radio stations remain future stages.

Existing 0.1 Voyage saves retain their purse, stories, upgrades and discoveries. If you ended an early voyage before dawn, **Continue this voyage** on the report reopens it for the new destinations. Dawn-ended voyages need a fresh start. Classic saves remain separate.

## Files and validation

`world-map.js`: navigable land, ports, landmarks. `navigation.js`: steering, collisions and safe assisted routing. `ports.js`: adapted character text, cargo contracts and market events. `model.js`: time, cargo, fuel, gold, upgrades, recovery and save validation. `voyage.js`: Canvas map, HUD, People/Market/Cargo/Services panels, input, dialogs and autosave. `voyage.css`: desktop/mobile views. `sound.js`: optional ferry and weather synthesis; `../halloween-radio.js`: shared procedural radio. `../assets/portraits/mio-{relaxed,thoughtful,pleased}.webp`: observatory portraits; `mio.svg` remains as the original design reference. No build or dependencies needed to play.

Run `node tools/voyage-checks.mjs`, `node tools/adventure-checks.mjs`, and `node tools/sound-checks.mjs`. Sailing checks simulate every port-to-port route through the actual steering function, not just path existence. A local canvas/DOM smoke pass also exercises startup, tabs, portraits, assisted sailing, docking and the journal. Actual browser layout, touch comfort and device performance still need player testing.

Most useful feedback: Does the ferry turn comfortably? Are the quay rings easy to find? Do the four port tabs feel clear? Does the gold/cargo presentation make sense? Is the map too empty, too zoomed out, or difficult to read on your device?
