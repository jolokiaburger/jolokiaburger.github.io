# Neon Tides Voyage · Playtest 0.1

Open the main game link and choose **Voyage**, or open `voyage/index.html` directly. Choose **Classic** for the complete previous game (`classic.html`). Classic's HTML, scripts and asset paths remain at the same origin, and its original localStorage key is unchanged. Voyage saves under `neon-tides:voyage:v1`. Saves do not transfer between the different rule systems.

## First route to try

1. Close the welcome guide. At Kurage 33, select Mei under People and collect her free tea case (5 minutes).
2. Cast off. Steer with WASD or arrow keys, use the touch direction buttons, or press **Set course → Night Market**. Manual steering cancels assistance. The boat turns toward your chosen direction and slows when you release it; Stop holds position immediately.
3. Enter the quay's dotted ring and press **Dock** or E. The assisted route stops near the port; it does not dock without your choice.
4. Speak to Nao and deliver the tea: 24 cr, 5-minute handover, start by 03:40. Have a bun, or chat again for different replies.
5. Sail to Landing 3. Read the gold board, compare it with your remembered quotes in the Journal, and refuel if needed. The co-op releases recycled gold at 00:20; market crews create demand after 00:55. Observe the actual price before committing.
6. Explore the lantern in the western reeds. Close enough, an Investigate button appears. Recover the signal-light kit once for 36 cr and 12 minutes.
7. Finish under Services at any port, or continue until 06:00. The report separates realised gold profit, courier payment and salvage.

## Controls and rules

- WASD/arrows or held touch buttons: direct steering. J: Journal. P: pause. E: dock. Escape: cancel course/stop, or dismiss an open panel.
- Click open water for an assisted course. The three Set course buttons work with keyboard and touch too. Assisted routes avoid land; manual steering remains available.
- Time advances only during movement and explicitly labelled activities. Conversations, trading, journal reading and panels pause it. Background tabs do not advance time.
- Start: 360 cr, 2 g gold, full tank. Gold lots use the existing deterministic `market.js` pricing, spreads, dealer impact and stock caps.
- Small tea courier contract: no stock purchase, one payment, deadline checked at handover start. Fuel is the captain's cost.
- Landing 3 refuel: 30 cr, 10 min, tank filled to 6. Market engine tuning: 80 cr, 15 min, 15% more speed and 20% less fuel per distance. Upgrade once.
- Out of fuel: the tug recovers you to Landing 3 in 20 min for up to 20 cr, including free recovery if penniless. No combat, hull damage or permanent death in this stage.
- Closing/reopening resumes the Voyage save. Corrupt or incompatible Voyage saves start fresh without altering Classic. Storage-blocked browsers still play for the session.

## Scope

This is the first stage of the intended new full game, not a replacement for Classic. It deliberately starts with three ports, four characters, direct sailing, one delivery, one discovery and one upgrade. The map uses crisp procedural Canvas art for testing readability and movement. Final painted map art, distant destinations, the broader chapter stories, Harbour Wire and radio are later stages; all of them remain available in Classic today.

## Files and validation

`world-map.js`: navigable land, ports, landmarks. `navigation.js`: steering, collisions and safe assisted routing. `ports.js`: adapted first-stage character text and market events. `model.js`: time, cargo, fuel, gold, upgrades, recovery and save validation. `voyage.js`: Canvas map, HUD, People/Market/Services panels, input, dialogs and autosave. `voyage.css`: desktop/mobile views. No build or dependencies needed to play.

Run `node tools/voyage-checks.mjs`, `node tools/adventure-checks.mjs`, and `node tools/sound-checks.mjs`. Sailing checks simulate every port-to-port route through the actual steering function, not just path existence. A local canvas/DOM smoke pass also exercises startup, tabs, portraits, assisted sailing, docking and the journal. Actual browser layout, touch comfort and device performance still need player testing.

Most useful feedback: Does the ferry turn comfortably? Are the quay rings easy to find? Do the three port tabs feel clear? Does the gold/cargo presentation make sense? Is the map too empty, too zoomed out, or difficult to read on your device?
