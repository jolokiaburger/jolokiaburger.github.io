/* Beyond the breakwater: authored trading-night expansion. Loaded before game.js. */
(function () {
  "use strict";
  const D = window.NEON_TIDES, T = window.NEON_TIDES_TRADE, C = window.NEON_TIDES_CHAT;
  const places = {
    market: { id: "market", name: "Lantern Night Market", tag: "Night Market", short: "Night Market", kicker: "South quay · Street food & golden bargains", title: "Lantern Market · A Thousand Small Stars", tradeOnly: true, ferry: { x: 720, y: 606 }, approach: "Paper lanterns swing above a floating arcade. Someone cheers as your rope lands neatly on the cleat." },
    yard: { id: "yard", name: "Starling Salvage Yard", tag: "Salvage Yard", short: "Salvage Yard", kicker: "Outer docks · Wrecks, repairs & discoveries", title: "Starling Yard · Treasure Beneath the Rust", tradeOnly: true, ferry: { x: 720, y: 606 }, approach: "A crane lifts a glittering engine from the water. The yard crew salute the Tern with steaming mugs." },
    island: { id: "island", name: "Hoshimi Lighthouse Island", tag: "Lighthouse", short: "Hoshimi Island", kicker: "Beyond the breakwater · An island expedition", title: "Hoshimi · The Light Beyond the Tide", tradeOnly: true, unlockFlag: "exp_chart", lockedText: "Find the island chart at the Salvage Yard", ferry: { x: 720, y: 606 }, approach: "The harbour falls behind you. A bright lighthouse beam guides the Tern to a sheltered cove beneath the stars." }
  };
  Object.assign(D.world.locations, places);
  // Every pair has an explicit crossing, so the existing cost previews remain total.
  const all = Object.keys(D.world.locations);
  all.forEach(function (a, i) { all.slice(i + 1).forEach(function (b) {
    if (!places[a] && !places[b]) return;
    const island = a === "island" || b === "island";
    D.world.travel.push({ between: [a, b], fuel: island ? 3 : 1, minutes: island ? 35 : (a === "yard" || b === "yard" ? 20 : 15) });
  }); });
  const cast = {
    sora: { name: "Sora Ember", role: "Lantern market host", color: "#ffd08a" },
    rin: { name: "Rin Starling", role: "Salvage engineer", color: "#8aead9" },
    aki: { name: "Aki Hoshimi", role: "Keeper of the guiding light", color: "#bcb5ff" }
  };
  Object.assign(T.characters, cast);
  Object.keys(cast).forEach(function (id) { T.things["exp-" + id] = cast[id].name; });
  T.people.sora = [{ text: "Sora Ember runs the market's gold stall and feeds anyone who brings news. She wants the lighthouse lantern kits delivered safely." }];
  T.people.rin = [{ text: "Rin Starling restores wrecked engines at the salvage yard. She has a safe chart through the outer reef." }];
  T.people.aki = [{ text: "Aki Hoshimi keeps the lighthouse shining and buys small quantities of gold for its instruments." }];
  Object.assign(T.market.local, { market: 1, yard: -3, island: 5 });
  function dealer(name, spread, stock, limit, provenance) {
    return { name: name, spread: spread, stock: stock, limit: limit, depth: 8, accepts: "any", provenance: provenance,
      buyText: "The dealer weighs {grams} carefully and hands it over for {total}. A fresh adventure, wrapped in paper.",
      sellText: "Your {grams} passes the scale test. The dealer pays {total} and thanks you for making the crossing.",
      lowStock: "Only a few grams remain in the tray tonight.", soldOut: "The tray is empty. Tonight's stock has all found a home.", full: "That's all the gold this stall can buy from you tonight." };
  }
  T.market.dealers.market = dealer("Sora's lantern scale", 5, 12, 18, "Bought at the Lantern Night Market, with Sora's stamped receipt.");
  T.market.dealers.yard = dealer("Starling assay bench", 7, 8, 12, "Recovered gold, tested at Rin's salvage bench.");
  T.market.dealers.island = dealer("Hoshimi instrument fund", 4, 3, 8, "Bought from the lighthouse instrument reserve.");
  const speech = (who, text) => ({ who: who, text: text });
  T.scenes.market = { first: ["Lanterns reflected in the water make the market look twice its size. Gold scales sit between dumpling steam and bright little repair stalls.", speech("sora", "Welcome, skipper! Browse the board, try a skewer, or help me send a little light beyond the breakwater." )], again: [speech("sora", "The Tern returns! What did the tide bring you this time?")] };
  T.scenes.yard = { first: ["Crane hooks hang like sleeping birds above a jumble of rescued engines. A cheerful whistle comes from beneath a ferry propeller.", speech("rin", "Mind the paint! That's yesterday's wreck and tomorrow's proud little boat. Looking for gold, a chart, or a proper cup of tea?")], again: ["Warm work lamps shine on the assay bench. Rin clears a space for you beside the kettle."] };
  T.scenes.island = { first: ["Beyond the reef, Hoshimi's cove is calm. The lighthouse makes one bright sweep across the sea, then another. You made it.", speech("aki", "A visitor! Come up the steps. The kettle's warm, and the light can spare me for a minute.")], again: ["The lighthouse sweeps over the Tern. Aki waves from the sheltered steps."] };
  // Old investigations retain their original four destinations. Scene fallbacks keep validators complete.
  D.variants.forEach(function (v) { Object.keys(places).forEach(function (id) { v.scenes[id] = { first: [places[id].approach], again: [places[id].approach] }; }); });
  function action(id, kind, label, who, text, extra) { return Object.assign({ id: id, kind: kind, label: label, minutes: 0, lines: [speech(who, text)] }, extra || {}); }
  T.actions.market = [
    action("exp_accept", "talk", "Ask Sora about the lighthouse delivery", "sora", "Aki ordered lantern kits for the reef markers, but the courier left them at the island storehouse. Pick them up, bring them here for testing, and I'll handle the final delivery. Rin at the Salvage Yard has the safe chart. I'll pay 85 credits, or one gram of gold. Your choice!", { once: true, sets: ["exp_job"] }),
    action("market_skewers", "order", "Share grilled skewers · 9 cr · 10 min", "sora", "Sweet glaze, a little chilli, and a seat beside the water. Our stall buys only eighteen grams per skipper. Check the bid before carrying a big load!", { cost: 9, minutes: 10 }),
    action("exp_deliver_cash", "talk", "Deliver the lantern kits · Take 85 cr", "sora", "You brought them home! I'll test the lamps and send them back with the morning launch. Here's your 85 credits. Next time you see those reef lights, remember: you helped put them there.", { once: true, when: { flag: ["exp_cargo"], notFlag: ["exp_done"] }, sets: ["exp_done", "exp_cash"], effects: { credits: 85 } }),
    action("exp_deliver_gold", "talk", "Deliver the lantern kits · Take 1 g of gold", "sora", "A golden reward for a bright little adventure. One gram, weighed and stamped. May it carry you toward your next discovery!", { once: true, when: { flag: ["exp_cargo"], notFlag: ["exp_done"] }, sets: ["exp_done", "exp_gold"], effects: { rewardGold: 1 } })
  ];
  T.actions.yard = [
    action("exp_chart", "talk", "Ask Rin for the reef chart", "rin", "Sora sent you? Here's the marked channel to Hoshimi. It's three fuel and thirty-five minutes each way. Watch your tank; I can refuel you here. Aki's gold bid is higher, but the island fund buys only eight grams. Don't sail out just because a number shines!", { once: true, when: { flag: ["exp_job"] }, sets: ["exp_chart"] }),
    action("yard_refuel", "system", "Refuel at the yard · 30 cr · 10 min", "rin", "Full tank, secure cap, and a little luck for the crossing. You're ready!", { cost: 30, minutes: 10, effects: { refuel: true } }),
    action("yard_tea", "order", "Tea beside the workshop · 5 cr · 10 min", "rin", "Recovered doesn't mean worthless. Every gram on my bench is tested. Prices still move with harbour news, though. A cheaper ask isn't a promise of profit.", { cost: 5, minutes: 10 }),
    action("yard_wreck", "search", "Explore the rescued ferry · 10 min", "rin", "This hull spent a year underwater. We found a child's brass star wedged in the helm and returned it to its owner. Gold's good; a happy reunion is better. Come see her launch when the repairs are done!", { minutes: 10, once: true })
  ];
  T.actions.island = [
    action("exp_collect", "search", "Collect the lantern kits · 15 min", "aki", "There they are, high and dry in the storehouse. Let's lash them aboard together. Sora will test them, then the morning launch will bring them back. Thanks, skipper. Safe reef lights help everyone find their way home.", { once: true, minutes: 15, when: { flag: ["exp_job"], notFlag: ["exp_cargo"] }, sets: ["exp_cargo"] }),
    action("island_tea", "order", "Tea at the lighthouse · 6 cr · 10 min", "aki", "From up here, every ferry is a moving star. The instrument fund buys eight grams per visitor tonight. Leave yourself enough time and fuel to return, and let the view be part of the reward.", { cost: 6, minutes: 10 }),
    action("island_view", "search", "Climb to the lantern gallery · 10 min", "aki", "Look! The market lanterns, the train line, Mei's orange sign. All those little lives, all those stories. Your boat connects them. That's quite a calling, skipper.", { minutes: 10, once: true })
  ];
  // A free invitation at home makes the new journey discoverable from existing saves.
  T.actions.bar.push(action("exp_invitation", "talk", "A new route · Ask about the Night Market", "mei", "Sora's lantern market is open on the south quay. She has a delivery waiting for an adventurous skipper. And Rin's salvage yard has a new assay bench. Take a look, then come tell me everything!", { once: true }));
  const casual = {
    sora: ["Every lantern here was mended at least once. We call that character.", "Try the skewers while they're hot. Even treasure hunters need supper.", "My first stall was a folding table. It folded during my first sale. Memorable opening!", "Bargain kindly. The person across the scale has a tomorrow to get through too.", "Listen to the market before you listen to the prices. You might find an adventure."],
    rin: ["That engine's not broken. It's being dramatic.", "I name every rescued boat. This one's Second Helping. Mei approved.", "Never trust a shiny bolt until you've checked the thread. Same goes for a bargain.", "There's room at the bench. Hold this lamp and tell me about your night.", "My favourite sound? An engine starting after everyone said it never would."],
    aki: ["The stars are excellent company, but they never offer to wash the cups.", "Sometimes I wave at a ferry I can't identify. Someone always waves back.", "A clear horizon makes the world feel enormous. A warm kettle makes it feel like home.", "I grow herbs behind the tower. The wind helps; the gulls offer unsolicited advice.", "If you get lost, look for my light. That's what it's here for."]
  };
  Object.keys(casual).forEach(function (id, i) { C[id] = { thing: "exp-" + id, visits: [{ at: ["market", "yard", "island"][i], mode: "trade" }], lines: casual[id].map(function (text, n) { return { id: "casual_" + n, text: text }; }) }; });
  C.sora.lines.push({ id: "delivery_thanks", when: { flag: ["exp_done"] }, text: "Your lantern kits are on my bench. Tomorrow the reef will have a few more stars. Good work, skipper!" });
  C.rin.lines.push({ id: "chart_seen", when: { flag: ["exp_chart"] }, text: "Remember the marked channel. Six fuel covers the outward and return crossings; leave some room in the night for exploring." });
  C.aki.lines.push({ id: "kits_aboard", when: { flag: ["exp_cargo"], notFlag: ["exp_done"] }, text: "The kits are aboard your ferry. Take them back to Sora when you're ready. She'll have your payment waiting." });
  T.expeditionObjectives = [
    { when: { flag: ["exp_done"] }, text: "Lantern delivery complete · Keep trading, explore, or rest aboard the Tern from 01:30." },
    { when: { flag: ["exp_cargo"] }, text: "Return the lantern kits to Sora at the Night Market · Choose credits or gold." },
    { when: { flag: ["exp_chart"] }, text: "Sail to Hoshimi Island and collect the kits · Each crossing costs 3 fuel and 35 min." },
    { when: { flag: ["exp_job"] }, text: "Visit Rin at the Salvage Yard for the reef chart · Refuel before your expedition." },
    { text: "Grow your gold, follow harbour news, or ask Sora at the Night Market about a lighthouse delivery." }
  ];
  T.ending.closing.push(
    { if: { flag: ["exp_done"] }, text: "HOSHIMI REEF: New marker lanterns will arrive on the morning launch. Sora credits the Tern's skipper for fetching the kits. Aki signs off: 'A little more light for everyone.'" },
    { if: { flag: ["exp_cargo"], notFlag: ["exp_done"] }, text: "The lantern kits remain safe aboard the Tern. Sora can arrange their delivery after your rest; tonight's reward was not collected." },
    { if: { flag: ["exp_job"], notFlag: ["exp_cargo"] }, text: "Sora sends the morning launch to collect the kits. Your island invitation remains a story for another night." }
  );
})();
