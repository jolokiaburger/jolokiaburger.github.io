# Neon Tides Voyage · Playtest 0.2

Open the main game link and choose **Voyage**, or open `voyage/index.html` directly. Choose **Classic** for the complete previous game (`classic.html`). Classic's HTML, scripts and asset paths remain at the same origin, and its original localStorage key is unchanged. Voyage saves under `neon-tides:voyage:v1`. Saves do not transfer between the different rule systems.

## First route to try

1. Close the welcome guide. At Kurage 33, select Mei under People and collect her free tea case (5 minutes).
2. Cast off. Steer with WASD or arrow keys, use the touch direction buttons, or choose **Night Market** in Set course. Manual steering cancels assistance. The boat turns toward your chosen direction and slows when you release it; Stop holds position immediately.
3. Enter the quay's dotted ring and press **Dock** or E. The assisted route stops near the port; it does not dock without your choice.
4. Speak to Nao and deliver the tea: 24 cr, 5-minute handover, start by 03:40. Have a bun, or chat again for different replies.
5. Sail to Landing 3. Read the gold board, compare it with your remembered quotes in the Journal, and refuel if needed. The co-op releases recycled gold at 00:20; market crews create demand after 00:55. Observe the actual price before committing.
6. Explore the lantern in the western reeds. Close enough, an Investigate button appears. Recover the signal-light kit once for 36 cr and 12 minutes.
7. Finish under Services at any port, or continue until 06:00. The report separates realised gold profit, courier payment and salvage.

## Controls and rules

- WASD/arrows or held touch buttons: direct steering. J: Journal. P: pause. E: dock. Escape: cancel course/stop, or dismiss an open panel.
- Click open water for an assisted course. The Set course selector work with keyboard and touch too. Assisted routes avoid land; manual steering remains available.
- Time advances only during movement and explicitly labelled activities. Conversations, trading, journal reading and panels pause it. Background tabs do not advance time.
- Start: 360 cr, 2 g gold, full tank. Gold lots use the existing deterministic `market.js` pricing, spreads, dealer impact and stock caps.
- Small tea courier contract: no stock purchase, one payment, deadline checked at handover start. Fuel is the captain's cost.
- Landing 3, Starling Yard or Kisaragi refuel: 30 cr, 10 min, tank filled to 6. Market engine tuning: 80 cr, 15 min, 15% more speed and 20% less fuel per distance. Upgrade once.
- Out of fuel: the tug recovers you to Landing 3 in 20 min for up to 20 cr, including free recovery if penniless. No combat, hull damage or permanent death in this stage.
- Closing/reopening resumes the Voyage save. Corrupt or incompatible Voyage saves start fresh without altering Classic. Storage-blocked browsers still play for the session.

## Scope

This is the expanded sailing stage of the intended new full game. Eight quays are navigable: Kurage 33, Landing 3, Lantern Market, Metro Quay, Starling Yard, Frostline, Kisaragi and Hoshimi. Thirteen characters have fresh casual replies, with contextual reactions after story progress. Classic remains the complete previous game.

## New routes and stories

- **Rin → Aki:** collect the free lighthouse kit at Starling Yard and take it to Hoshimi. Start the handover by 05:00 for 40 cr. The lighthouse brightens after delivery. Help Rin repair Second Helping for a separate ten-minute story outcome.
- **Nao → Kisaragi → home:** after delivering Mei’s tea, invite Nao aboard at Lantern Market. Speak to Hana or Nao in Kisaragi for the preview supper, then bring Nao home to her counter. Nao appears in the People list while travelling with you. This is a social story without a fee or special delivery deadline; the voyage still ends at dawn.
- **Stock cargo:** Jun sells a sealed bowl case in Kisaragi for 20 cr; Mei pays 36 cr at Kurage 33 by 05:10. Rin sells pump seals at the yard for 18 cr; Frostline pays 32 cr by 04:50. These are one-time purchases and payments. Buying and handing over take five minutes each. The difference is gross margin: fuel and other expenses are extra.
- **Shared hold:** tea, lighthouse kit and stock cases share two slots. Kenji’s cargo racks at Lantern Market cost 65 cr and ten minutes, adding a third slot. Gold and Nao do not occupy case slots.
- **Journal:** lists several active stories and completed outcomes, with a Track action for the objective line. The Basin chart marks visited quays and lets you set a course after casting off. Remembered gold boards include their observation time.

Buildings now have roof tiles, skylights, warm windows, quay reflections, trees and cargo stacks. New landmarks include the yard crane and repair ferry, Metro platforms, Frostline chillers, Kisaragi’s canal bridge and lantern table, and Hoshimi’s sweeping lighthouse. Small workboats and restrained rain add movement. The map remains procedural Canvas artwork for playtesting; final painted environments, the broader chapters, Harbour Wire and radio remain future stages.

Existing 0.1 Voyage saves retain their purse, stories, upgrades and discoveries. If you ended an early voyage before dawn, **Continue this voyage** on the report reopens it for the new destinations. Dawn-ended voyages need a fresh start. Classic saves remain separate.

## Files and validation

`world-map.js`: navigable land, ports, landmarks. `navigation.js`: steering, collisions and safe assisted routing. `ports.js`: adapted character text, cargo contracts and market events. `model.js`: time, cargo, fuel, gold, upgrades, recovery and save validation. `voyage.js`: Canvas map, HUD, People/Market/Cargo/Services panels, input, dialogs and autosave. `voyage.css`: desktop/mobile views. No build or dependencies needed to play.

Run `node tools/voyage-checks.mjs`, `node tools/adventure-checks.mjs`, and `node tools/sound-checks.mjs`. Sailing checks simulate every port-to-port route through the actual steering function, not just path existence. A local canvas/DOM smoke pass also exercises startup, tabs, portraits, assisted sailing, docking and the journal. Actual browser layout, touch comfort and device performance still need player testing.

Most useful feedback: Does the ferry turn comfortably? Are the quay rings easy to find? Do the four port tabs feel clear? Does the gold/cargo presentation make sense? Is the map too empty, too zoomed out, or difficult to read on your device?
