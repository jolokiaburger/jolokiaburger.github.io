/* Lantern Market: stalls, a verifiable shipment story, and a small repair order.
   Data only. Loaded after expansion.js and before game.js. */
(function () {
  "use strict";
  const T = window.NEON_TIDES_TRADE, C = window.NEON_TIDES_CHAT;
  window.NEON_TIDES.world.locations.market.ferry = { x: 720, y: 742 };
  const say = (who, text) => ({ who: who, text: text });
  const action = (id, kind, label, who, text, extra) => Object.assign({ id, kind, label, minutes: 0, lines: [say(who, text)] }, extra || {});
  Object.assign(T.characters, {
    nao: { name: "Nao Mizuno", role: "Food counter · A seat and a story", color: "#e7b391", portrait: "assets/portraits/nao-manga.webp", artStyle: "manga" },
    kenji: { name: "Kenji Arata", role: "Repair bench · Small things, second chances", color: "#b9c9a4", portrait: "assets/portraits/kenji-manga.webp", artStyle: "manga" }
  });
  Object.assign(T.things, { "exp-nao": "Nao · Food", "exp-kenji": "Kenji · Repairs", "market-scale": "Sora · Gold", "market-lane": "Delivery lane", "market-wall": "Lantern wall" });
  T.people.nao = [{ text: "Nao Mizuno keeps the skewers turning and the tea warm. Couriers eat here; she hears their plans, not their cargo manifests." }];
  T.people.kenji = [{ text: "Kenji Arata repairs the market's instruments. He needs two grams of gold for sensor contacts and will pay a small premium after the missing delivery is traced." }];
  T.people.sora = [{ text: "Sora Ember runs the lantern scale and looks after the market. She buys eighteen grams per skipper; deliveries replenish her selling tray, not that buying allowance." }];
  const dealer = T.market.dealers.market;
  Object.assign(dealer, {
    thing: "market-scale", name: "Sora's lantern scale", depth: 10,
    stockArrivals: [
      { at: "02:00", truths: ["order"], grams: 16 },
      { at: "02:00", truths: ["both"], grams: 12 },
      { at: "03:00", truths: ["vault"], grams: 12 }
    ],
    buyText: "Sora taps the assay stamp, weighs {grams}, and wraps your purchase in blue paper. You pay {total}; her receipt records the price and quay.",
    sellText: "Sora sets your {grams} on the brass scale. 'All accounted for.' She pays {total} and leaves room on the counter for the next skipper.",
    moved: "Sora's board has changed since {time}: the bid was {old} cr/g and is now {new} cr/g. Check both prices before trading.",
    full: "Sora has bought her eighteen grams from you tonight. Kenji's repair order shares that allowance; a new delivery does not reset it."
  });
  const truths = (mods) => ({ order: { mods }, vault: { mods }, both: { mods } });
  T.events.push(
    { id: "market_delay", at: "00:40", where: "market", cause: "The market's replacement gold is late. Buyers compete for the existing tray.", truths: truths([{ loc: "market", pct: 7, ramp: 10, hold: "end" }]) },
    { id: "market_shipment", at: "02:00", where: "market", cause: "The Starling launch brings assayed gold to the lantern scale. More stock eases the local shortage.", truths: { order: { mods: [{ loc: "market", pct: -9, ramp: 15, hold: "end" }] }, both: { mods: [{ loc: "market", pct: -9, ramp: 15, hold: "end" }] } } },
    { id: "market_late_shipment", at: "03:00", where: "market", cause: "Landing 3 finally releases the market shipment. Sora replenishes the selling tray.", truths: { vault: { mods: [{ loc: "market", pct: -9, ramp: 15, hold: "end" }] } } }
  );
  const truthAll = { order: "true", vault: "true", both: "true" };
  Object.assign(T.rumors, {
    r_market_delay: { source: "sora", origin: "market", note: "Sora's gold delivery is late. The scale has twelve grams before the launch arrives, and buys at most eighteen grams from each skipper tonight.", truth: truthAll, reliability: 1, relatedEvent: "market_delay", affected: "market", effect: "supply", expires: "03:15" },
    r_market_guess: { source: "nao", origin: "market", note: "A courier at Nao's counter said the market launch would arrive at two. Nao did not see its route sheet; the arrival time is unconfirmed.", truth: { order: "true", both: "true", vault: "outdated" }, reliability: 0.6, relatedEvent: "market_shipment", affected: "market", effect: "supply", expires: "02:00" },
    r_market_yard: { source: "you", origin: "market", note: "The delivery lane's current dispatch slip routes Sora's gold through Starling Yard. The scheduled arrival is 02:00; verify it with Rin before relying on it.", truth: truthAll, reliability: 0.9, relatedEvent: "market_shipment", affected: "market", effect: "supply", expires: "02:15" },
    r_market_landing: { source: "you", origin: "market", note: "An amended dispatch slip routes Sora's gold through Landing 3. The old two-o'clock note has been crossed out; Priya has the release time.", truth: truthAll, reliability: 0.9, relatedEvent: "market_late_shipment", affected: "market", effect: "supply", expires: "03:15" },
    r_market_confirmed_yard: { source: "rin", origin: "yard", note: "Rin checked the loaded Starling launch: Sora's gold arrives at 02:00. Her selling tray will gain twelve or sixteen grams. More supply may ease the shortage; other harbour news still affects the price.", truth: truthAll, reliability: 1, relatedEvent: "market_shipment", affected: "market", effect: "supply", expires: "02:15" },
    r_market_confirmed_landing: { source: "priya", origin: "landing", note: "Priya's amended release log confirms a 03:00 arrival at the market, with twelve more grams. The courier's two-o'clock story is stale. Other harbour news still affects the price.", truth: truthAll, reliability: 1, relatedEvent: "market_late_shipment", affected: "market", effect: "supply", expires: "03:15" }
  });
  T.scenes.market = {
    first: ["The Tern slips beneath a rope of amber lanterns. Nao fans a glowing grill to your left; Sora's brass scale gleams in the middle; Kenji is coaxing a little weather gauge back to life on the right.", say("nao", "Skipper! A seat, a skewer, a questionable joke? We have all three."), say("sora", "Welcome to the south quay. Trade at my scale, wander the stalls, or check the delivery lane. Tonight that empty crate has everyone talking."), { notice: "Browse a stall in the picture or use the market directory below. Gold, food and exploration all show their costs before you commit." }],
    again: [
      { if: { maxClock: "00:40" }, text: "The grill pops; Kenji's work lamp makes a small island of daylight. Sora still has the opening tray on her scale." },
      { if: { minClock: "00:40", truth: ["order", "both"], maxClock: "02:00" }, text: "A handwritten LATE notice hangs in the delivery lane. With new gold still on the water, Sora's opening stock is attracting a queue." },
      { if: { minClock: "00:40", truth: ["vault"], maxClock: "03:00" }, text: "The delivery lane is waiting for a launch. The two-o'clock chalk note has a question mark beside it." },
      { if: { happened: ["market_shipment"] }, text: "Blue-paper gold parcels sit beside the scale. The Starling launch arrived at two; Sora has replenished the tray." },
      { if: { happened: ["market_late_shipment"] }, text: "The Landing 3 launch finally delivered its parcels at three. Sora erases the LATE notice with a relieved laugh." },
      { if: { minClock: "03:30" }, text: "Kenji has covered his tools for the night. Nao's grill is cooling, but the kettle and Sora's scale will stay open until dawn." },
      say("sora", "Welcome back. A familiar face is always good for the market.")
    ]
  };
  // Browsing is free and never silently purchases food or gold.
  const stalls = [
    action("nm_visit_gold", "talk", "Browse Sora's gold scale", "sora", "My board shows what you pay to buy and what you receive to sell. Compare both, then choose your amount. The opening tray held twelve grams; deliveries replenish it. Eighteen grams is my buying allowance per skipper.", { thing: "market-scale", marketBrowse: "gold", directory: true }),
    action("nm_visit_food", "talk", "Take a seat at Nao's counter", "nao", "Welcome! Skewers are nine credits, tea is six. Take your time deciding; sitting down to order costs ten minutes. Saying hello is free.", { thing: "exp-nao", marketBrowse: "food", directory: true }),
    action("nm_visit_repair", "talk", "Look around Kenji's repair bench", "kenji", "Clocks, radios, things somebody nearly threw away. My little fuel can can top you up once tonight. I'm also looking for two grams for sensor contacts; Sora handles the payment at her scale. I close at half past three.", { thing: "exp-kenji", marketBrowse: "repair", directory: true, when: { maxClock: "03:30" } }),
    action("nm_visit_lane", "talk", "Explore the delivery lane", "sora", "Crates, dispatch slips, and one overdue launch. Read the notice, then the current manifest. A rumour is a starting point; a checked route is something you can plan around.", { thing: "market-lane", marketBrowse: "lane", directory: true })
  ];
  stalls.find(a => a.id === "nm_visit_food").lines = [
    { if: { maxClock: "03:30" }, lines: [say("nao", "Welcome! Skewers are nine credits, tea is six. Sitting down to order costs ten minutes; saying hello is free.")] },
    { if: { minClock: "03:30" }, lines: [say("nao", "The grill's closed, but tea is six credits, or eight with a warm bun. Either order takes ten minutes. Stay a while if you like.")] }
  ];
  stalls.find(a => a.id === "nm_visit_lane").lines = [
    { if: { truth: ["order", "both"], maxClock: "02:00" }, lines: [say("sora", "One overdue launch and a current dispatch slip. Read the notice, then the manifest. A checked route is something you can plan around.")] },
    { if: { truth: ["vault"], maxClock: "03:00" }, lines: [say("sora", "The launch is still overdue. The old time has a question mark beside it; the current manifest points to the dispatch log.")] },
    { if: { happened: ["market_shipment"] }, lines: [say("sora", "The launch arrived at two. New gold is on the tray, and Kenji's parts are safe. You can still check the paperwork if you're following that lead.")] },
    { if: { happened: ["market_late_shipment"] }, lines: [say("sora", "It arrived at three, as the amended log promised. New parcels on the scale, a little less worry on the quay. The paperwork is still here if you need it.")] }
  ];
  // Keep the published lighthouse action IDs so existing saves continue normally.
  const old = T.actions.market.filter(a => a.id !== "market_skewers");
  old.forEach(a => { a.marketSpot = "gold"; });
  T.actions.market = stalls.concat([
    action("nm_notice", "talk", "An overdue launch · Ask Sora what happened", "sora", "My replenishment launch is late, and its route sheet changed. Would you check the manifest in the lane, then ask whoever dispatched it? Kenji can pay the local bid plus four credits a gram for two grams of sensor gold once we know where his parts are. Or take twenty-five credits for the courier work. No need to buy gold just to help.", { once: true, sets: ["nm_job"], hears: ["r_market_delay"], marketSpot: "lane" }),
    action("nm_manifest", "search", "Read the current dispatch slip · 5 min", "sora", "Dates first, handwriting second. You lift the current slip from beneath yesterday's crate label.", { once: true, minutes: 5, when: { flag: ["nm_job"] }, sets: ["nm_manifest"], marketSpot: "lane", lines: [
      "An empty gold case is bolted to the lane rail; the delivery seal is still intact.",
      { if: { truth: ["order", "both"] }, text: "CURRENT ROUTE: Starling Yard → Lantern Market. ETA 02:00. Rin's loading stamp is fresh. You copy it into the notebook; the dispatch still needs a first-hand check." },
      { if: { truth: ["vault"] }, text: "AMENDED ROUTE: Landing 3 → Lantern Market. The old ETA 02:00 is crossed out. RELEASE TIME: see quay log. You copy the amendment into the notebook." }
    ], hearsWhen: [{ if: { truth: ["order", "both"] }, hears: ["r_market_yard"] }, { if: { truth: ["vault"] }, hears: ["r_market_landing"] }] }),
    action("market_skewers", "order", "Grilled skewers & a seat by the water", "nao", "Two skewers, sweet glaze, a little chilli. Here—sit out of the rain. News seems to arrive faster when someone is feeding it.", { cost: 9, minutes: 10, sitting: "market_meal", marketSpot: "food", when: { maxClock: "03:30" } }),
    action("market_tea", "order", "Roasted barley tea & counter stories", "nao", "A warm cup, a dry seat. Listen to the kettle for a moment; it has a surprisingly good sense of timing.", { cost: 6, minutes: 10, sitting: "market_tea", marketSpot: "food" }),
    action("nm_late_bun", "order", "Last warm bun & barley tea", "nao", "The grill's asleep, but I saved a bun for late arrivals. Don't rush the last good bite of the night.", { cost: 8, minutes: 10, sitting: "market_meal", marketSpot: "food", when: { minClock: "03:30" } }),
    action("nm_bench", "search", "Examine the weather gauge · 5 min", "kenji", "These sensor contacts need gold because they resist corrosion. Not a fortune—two grams. Knowing who actually needs the metal is sometimes more useful than hearing that everybody wants it.", { once: true, minutes: 5, marketSpot: "repair", sets: ["nm_bench_seen"], when: { maxClock: "03:30" } }),
    action("nm_fuel", "system", "Kenji's reserve can · Add 1 fuel", "kenji", "One unit, cap sealed. Keep enough aboard to get back to a proper pump. I only have the one spare can tonight.", { once: true, cost: 6, minutes: 5, effects: { fuel: 1 }, marketSpot: "repair", when: { fuelBelow: 6, maxClock: "03:30" } }),
    action("nm_contract", "talk", "Fill Kenji's order · Sell 2 g at bid + 4 cr/g", "kenji", "The dispatch is checked; now I can plan the repairs. Two grams for the contacts, paid through Sora's scale. A small premium for a small, useful order.", { once: true, when: { flag: ["nm_verified"], notFlag: ["nm_done"], maxClock: "03:30" }, sets: ["nm_done", "nm_contract_done"], goldSale: { grams: 2, premium: 4 }, marketSpot: "repair" }),
    action("nm_report", "talk", "Report the checked delivery · Take 25 cr", "sora", "That's the current dispatch, not the old chalk note. Thank you! Twenty-five credits for the checking. Keep your gold for whatever trade you choose next; Kenji will source his contacts elsewhere.", { once: true, when: { flag: ["nm_verified"], notFlag: ["nm_done"] }, sets: ["nm_done", "nm_report_done"], effects: { credits: 25 }, marketSpot: "lane" }),
    action("nm_lanterns", "search", "Read the wishes on the lantern wall", "nao", "'A safe crossing.' 'A working engine.' 'May Dad's dumplings finally win the contest.' Someone has added a tiny sketch of your ferry. You leave a little star beside it.", { once: true, thing: "market-wall", marketSpot: "food", sets: ["nm_wish"] }),
    action("nm_wait_early", "system", "Wait for the Starling delivery · Until 02:00", "sora", "You tie the Tern securely and wait beneath the awning. At two, a launch bumps the fenders and blue-paper parcels arrive at the scale. Waiting was a choice: the rest of the harbour kept moving too.", { once: true, when: { flag: ["nm_verified"], truth: ["order", "both"], maxClock: "02:00" }, effects: { clockTo: "02:00" }, marketSpot: "lane" }),
    action("nm_wait_late", "system", "Wait for the Landing 3 delivery · Until 03:00", "sora", "You wait out the amended schedule. At three, the launch arrives with the promised parcels. Sora fills her tray; all the other harbour clocks have kept running.", { once: true, when: { flag: ["nm_verified"], truth: ["vault"], maxClock: "03:00" }, effects: { clockTo: "03:00" }, marketSpot: "lane" })
  ], old);
  T.actions.yard.push(action("nm_dispatch_yard", "talk", "Check Sora's launch with Rin", "rin", "Loaded, assayed and tied down. The launch reaches Sora at two. More gold on her tray should ease that local shortage, though the rest of the Basin has its own news. Tell Kenji his sensor parts are aboard too.", { once: true, when: { flag: ["nm_manifest"], truth: ["order", "both"] }, sets: ["nm_verified"], hears: ["r_market_confirmed_yard"] }));
  T.actions.landing.push(action("nm_dispatch_landing", "talk", "Check the amended launch log with Priya", "priya", "Here's the release amendment: three o'clock at the market, not two. Twelve grams and Kenji's sensor parts. A courier repeated the old schedule. Happens to good people too; dates are why I keep the log.", { once: true, when: { flag: ["nm_manifest"], truth: ["vault"] }, sets: ["nm_verified"], hears: ["r_market_confirmed_landing"] }));
  T.conversations.push(
    { id: "nm_food_rumour", at: "market", via: ["market_meal", "market_tea"], when: { notHeard: ["r_market_guess"], maxClock: "02:00" }, lines: [say("nao", "A courier swore Sora's gold launch would be here at two. He also swore he didn't want a second skewer. One of those statements already failed."), say("sora", "Two was the old plan. The dispatch slip is in the lane; check it before you trade on that story.")], hears: ["r_market_guess"] },
    { id: "nm_food_verified", at: "market", via: ["market_meal", "market_tea"], when: { flag: ["nm_verified"] }, lines: [say("nao", "So you checked the launch yourself. Here I was telling everyone the old plan. I'll correct it with the next pot of tea."), say("kenji", "A checked time is a kindness. I can tell my customers when their repairs will be ready.")] },
    { id: "nm_food_after", at: "market", via: ["market_meal", "market_tea"], when: { flag: ["nm_done"] }, lines: [say("sora", "Tonight somebody brought us more than a boatload. A little clarity."), say("nao", "And somebody finished their supper before it went cold. A second miracle.")] },
    { id: "nm_food_late", at: "market", via: ["market_meal", "market_tea"], when: { minClock: "03:30" }, lines: [say("nao", "Kenji's gone to help his neighbour with a radio. Sora and I take the last watch. The stalls get quieter, but there's still a place for you here.")] }
  );
  T.ambience.push(
    { at: "market", via: ["market_meal", "market_tea"], text: "A courier and a cleaner compare the cats on their phone lock screens. Both insist theirs is the harbour's finest navigator." },
    { at: "market", via: ["market_meal", "market_tea"], text: "Kenji taps a repaired metronome. Nao turns the skewers in time, then deliberately misses a beat to make him laugh.", when: { maxClock: "03:30" } },
    { at: "market", via: ["market_meal", "market_tea"], text: "Rain rings against the awning. Someone quietly hums along with a distant radio, and for a moment the whole quay feels like one room." }
  );
  function chat(id, spot, lines) {
    C[id] = { thing: "exp-" + id, marketSpot: spot, visits: [{ at: "market", mode: "trade", when: id === "kenji" ? { maxClock: "03:30" } : undefined }], lines: lines.map((text, i) => ({ id: "market_casual_" + i, text })) };
  }
  chat("nao", "food", ["My menu has three items. Somehow everyone asks for the secret fourth.", "The chilli's mild. Unless you ask Kenji; then it's apparently a dangerous industrial material.", "A customer taught me this tea blend. Now half the quay says it was their idea.", "I used to rush every shift. Turns out the skewers cook at exactly the same speed either way.", "You can sit without ordering, skipper. A hello isn't something I put on the bill."]);
  chat("kenji", "repair", ["People apologise for bringing broken things. I wish they'd stop. That's why the bench is here.", "This screwdriver is older than Nao. She says it has better manners too.", "A quiet radio is either fixed or entirely broken. You learn to tell the difference.", "The market clock runs a minute fast. On purpose. We all enjoy being pleasantly early.", "I'm making a little tide alarm for my neighbour. She sleeps through foghorns but wakes for a kettle."]);
  C.sora.marketSpot = "gold";
  C.sora.thing = "market-scale";
  C.sora.lines.unshift(
    { id: "market_checked", when: { flag: ["nm_verified"], notFlag: ["nm_done"] }, text: "You have the checked dispatch. Kenji's two-gram order is open until 03:30, if I still have buying capacity. Or report back to me for twenty-five credits. Choose what suits your night." },
    { id: "market_completed", when: { flag: ["nm_done"] }, text: "The delivery's accounted for. Now we can get back to the pleasant problem of choosing supper." }
  );
  C.nao.lines.unshift({ id: "market_truth", when: { flag: ["nm_verified"] }, text: "I updated the chalk note with the checked time. Next rumour gets a question mark before it gets an audience." });
  C.nao.lines.unshift({ id: "market_late_watch", when: { minClock: "03:30" }, text: "Just the kettle now. The last watch is quieter, and I like it that way. Sit with us for a minute." });
  C.kenji.lines.unshift({ id: "market_contacts", when: { flag: ["nm_contract_done"] }, text: "Your gold is on the contact bench. By morning, three weather gauges will be working again. That's a good journey for two little grams." });
  T.sceneClasses.push(
    { class: "market-restocked", when: { happened: ["market_shipment"] } },
    { class: "market-restocked", when: { happened: ["market_late_shipment"] } },
    { class: "market-late-watch", when: { minClock: "03:30" } },
    { class: "market-wish", when: { flag: ["nm_wish"] } }
  );
  // Market objectives take priority only while this optional lead is active.
  T.expeditionObjectives.unshift(
    { when: { flag: ["nm_verified"], notFlag: ["nm_done"], minClock: "03:30" }, text: "Kenji's bench has closed · Report the checked delivery to Sora at the Night Market for 25 cr." },
    { when: { flag: ["nm_verified"], notFlag: ["nm_done"] }, text: "Return to the Night Market · Fill Kenji's 2 g order before 03:30, or report to Sora for 25 cr." },
    { when: { flag: ["nm_manifest"], notFlag: ["nm_verified"], truth: ["order", "both"] }, text: "Check the market launch with Rin at the Salvage Yard · The slip says 02:00." },
    { when: { flag: ["nm_manifest"], notFlag: ["nm_verified"], truth: ["vault"] }, text: "Check the amended market launch with Priya at Landing 3 · The old ETA is crossed out." },
    { when: { flag: ["nm_job"], notFlag: ["nm_manifest"] }, text: "Read the current dispatch slip in the Night Market's delivery lane · 5 min." }
  );
  T.ending.closing.unshift(
    { if: { flag: ["nm_contract_done"] }, text: "LANTERN MARKET: The Tern traced the delayed launch and supplied two grams for Kenji's sensor contacts. Three repaired weather gauges return to their owners this morning." },
    { if: { flag: ["nm_report_done"] }, text: "LANTERN MARKET: The Tern checked the amended dispatch. Sora paid the courier fee; Nao corrected the chalk note beside the kettle." },
    { if: { flag: ["nm_job"], notFlag: ["nm_done"] }, text: "The market launch found its berth in the end. Your dispatch lead remains unfinished; Sora settled it with the morning crew." }
  );
})();
