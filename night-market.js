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
  /* Nao's optional personal thread. No meal, gold purchase or invitation is
     required to see its ending. One extra food batch is a separate capped trade. */
  T.breakfast = { servings: 12, price: 4, demand: { order: 5, vault: 3, both: 4 },
    inviteFlags: ["nb_invite_mei", "nb_invite_priya", "nb_invite_lam"] };
  T.people.nao.push({ if: { flag: ["nb_started"] }, text: "Nao wants to revive her father Haruto's breakfast counter. Tonight is a small trial, not a promise to take on every morning shift." },
    { if: { flag: ["nb_done"] }, text: "She served her first sunrise bowls. The recipe is her father's; the handwritten menu is finally signed with her own name." });
  T.rumors.r_nao_breakfast = { source: "nao", origin: "market", note: "Nao plans a trial breakfast at 05:00. Helping or attending is free. Optional: one extra twelve-portion batch costs 24 cr at the market or 18 cr at Landing 3. Delivered portions sell for 4 cr each; zero to twelve may sell. Fuel and time are extra. Deliver before 05:45. Invitations and a working warmer may help turnout.", truth: truthAll, reliability: 1, affected: "market", effect: "opportunity", expires: "05:45" };
  T.rumors.r_nao_wharf = { source: "priya", origin: "landing", note: "The Landing 3 co-op's breakfast batch costs 18 cr and takes ten minutes to collect. It closes at 04:30; carrying the batch to Nao takes another crossing and a five-minute handover. One extra batch per skipper, with no guaranteed sales.", truth: truthAll, reliability: 1, affected: "market", effect: "supply", expires: "04:30" };
  const food = { marketSpot: "food" };
  T.actions.market.push(
    action("nb_start", "talk", "Nao's folded recipe · Ask about breakfast", "nao", "Dad used to serve rice porridge to the first dock crews. He's retired now, and every time I unfold his recipe I hear him arguing with the kettle. I'd like to try a little breakfast opening at five. My own pantry covers the first bowls. You could help with the warmer, invite a few neighbours, or simply be here. You don't have to buy anything to make this matter.", { once: true, marketSpot: "food", when: { maxClock: "06:00" }, sets: ["nb_started"], hears: ["r_nao_breakfast"] }),
    action("nb_recipe", "talk", "The last bowl before sunrise · Hear Nao's story", "nao", "Haruto—Dad—always kept one bowl for whoever arrived last. I thought it was terrible business. He said a counter isn't only a place where money changes hands. I want that part back. But I want my own name on the menu too. Is that selfish? ...No, don't answer quickly. I needed a little practice saying it aloud.", { once: true, marketSpot: "food", when: { flag: ["nb_started"], notFlag: ["nb_done"] }, sets: ["nb_story"] }),
    action("nb_local_batch", "search", "Optional breakfast batch · 12 portions · 24 cr", "nao", "One sealed batch from the market co-op, twenty-four credits. This is your extra stock; my first bowls are already covered. Sales will return four credits a portion, up to twelve portions, but nobody can promise a crowd. Bring it back to my counter before quarter to six. You can still help without taking this deal.", { once: true, marketSpot: "food", cost: 24, minutes: 5, supplyPurchase: true, when: { flag: ["nb_started"], notFlag: ["nb_batch_owned", "nb_done"], maxClock: "04:50" }, sets: ["nb_batch_owned", "nb_local"] }),
    action("nb_deliver", "search", "Hand Nao the extra breakfast batch · 5 min", "nao", "Seal intact, date checked. Into the covered serving tray it goes. I'll keep your batch separate and return the actual sales when we open together. Anything left over goes to the morning crew; nobody's breakfast gets wasted.", { once: true, marketSpot: "food", minutes: 5, when: { flag: ["nb_batch_owned"], notFlag: ["nb_batch_delivered", "nb_done"], maxClock: "05:40" }, sets: ["nb_batch_delivered"] }),
    action("nb_handwarm", "search", "Help Nao heat the serving trays · 15 min", "nao", "Kenji's bench has closed, so we'll use the old insulated trays. You hold the kettle while I wrap them. Dad would have called this a repair made of tea towels. Good thing we have excellent tea towels.", { once: true, marketSpot: "food", minutes: 15, when: { flag: ["nb_started"], notFlag: ["nb_warmer", "nb_done"], minClock: "03:30", maxClock: "04:45" }, sets: ["nb_warmer", "nb_handwarm"] }),
    action("nb_wait_trays", "system", "Wait for tray preparation · Until 03:30", "nao", "I'll clear the last grill order first. You find a dry stack of tea towels while I make room for the trays.", { once: true, marketSpot: "food", when: { flag: ["nb_started"], notFlag: ["nb_warmer", "nb_done"], minClock: "03:20", maxClock: "03:30" }, effects: { clockTo: "03:30" } }),
    action("nb_wait", "system", "Stay for Nao's opening · Wait until 05:00", "nao", "You secure the Tern and help turn the counter toward morning. Nao unfolds the menu, smooths one corner, and leaves it flat this time. While you wait, the harbour keeps moving. At five she puts the first pot on.", { once: true, marketSpot: "food", when: { flag: ["nb_started"], notFlag: ["nb_done"], maxClock: "05:00" }, effects: { clockTo: "05:00" } }),
    action("nb_open", "talk", "The first sunrise bowls · Open with Nao", "nao", "There. My name on the menu. Dad's recipe in the pot. Thank you for being here when I stopped folding it away.", { once: true, marketSpot: "food", breakfastOpen: true, when: { flag: ["nb_started"], notFlag: ["nb_done"], minClock: "05:00", maxClock: "05:45" }, sets: ["nb_done"], effects: { breakfastSettlement: true }, lines: [
      "Nao turns a small sign toward the quay: SUNRISE BOWLS · NAO MIZUNO. The first workers shake rain from their sleeves and make room for one another.",
      { if: { flag: ["nb_repaired"] }, lines: [say("nao", "Kenji's warmer is purring. He left a note: 'No dramatic noises. Let the breakfast have the attention.'")] },
      { if: { flag: ["nb_handwarm"] }, lines: [say("nao", "Our tea-towel engineering is holding! Dad would be unbearably pleased with us.")] },
      { if: { notFlag: ["nb_warmer"] }, lines: [say("nao", "We'll serve in smaller rounds. Nothing wrong with a little opening. The kettle and I can manage.")] },
      { if: { flag: ["nb_invite_mei"] }, lines: [say("mei", "A new menu deserves a good thermos. Here, Nao. And leave your name at the top, where it belongs.")] },
      { if: { flag: ["nb_invite_priya"] }, lines: [say("priya", "I have ten minutes before handing over the log. That is a very respectable amount of breakfast.")] },
      { if: { flag: ["nb_invite_lam"] }, lines: [say("lam", "Your father once fed me after a disastrous crossing. Today I get to pay his daughter. A pleasant improvement.")] },
      say("nao", "My name on the menu. Dad's recipe in the pot. Thank you for being here when I stopped folding it away."),
      { if: { flag: ["nb_batch_owned"], notFlag: ["nb_batch_delivered"] }, text: "Your extra batch is still aboard the Tern. It was not served, so it earns no sales; you arrange for the unopened batch to go to the morning crew." },
      "She sets one last bowl aside for the next skipper. The counter feels like a beginning."
    ] }),
    action("nb_open_late", "talk", "Catch the last bowl · Return to Nao", "nao", "You made it. The first crews have already eaten, and I was starting to put the sign away. Then I remembered Dad's last bowl. Yours is still warm. We did a small thing tonight. I'd like to do it again, in my own way.", { once: true, marketSpot: "food", breakfastOpen: true, breakfastLate: true, when: { flag: ["nb_started"], notFlag: ["nb_done"], minClock: "05:45", maxClock: "06:00" }, sets: ["nb_done", "nb_late"], effects: { breakfastSettlement: true }, lines: [
      "The first breakfast rush has passed. Nao's signed menu is still propped beside the pot.",
      say("nao", "You made it. Dad's last bowl rule wins again. Yours is still warm."),
      { if: { flag: ["nb_invite_mei"] }, text: "Mei left a thermos and a note: 'Keep your name at the top.'" },
      { if: { flag: ["nb_invite_priya"] }, text: "Priya's receipt says FIRST BREAKFAST: APPROVED. Nao has kept it." },
      { if: { flag: ["nb_invite_lam"] }, text: "Captain Lam left a little brass star beside the menu, a greeting for Haruto." },
      { if: { flag: ["nb_batch_owned"], notFlag: ["nb_batch_delivered"] }, text: "Your extra batch was never handed over. It earns no sales; the unopened portions go to the morning crew." },
      say("nao", "It was a small opening. But it was mine. I'd like to do it again, in my own way.")
    ] }),
    action("nb_after", "talk", "Ask Nao what comes next", "nao", "One morning a week, perhaps. Enough to learn what works without forgetting to sleep. I'll tell Dad about the recipe. And about the part I changed: I asked people to come. That was harder than the cooking.", { once: true, marketSpot: "food", when: { flag: ["nb_done"] }, sets: ["nb_after"] }),
    action("nb_bowl", "order", "Nao's sunrise bowl & barley tea", "nao", "Rice porridge, pickled greens, a little sesame. Seven credits and ten minutes to enjoy it. Dad's recipe never specified the story on the side; I think I'll keep that part.", { marketSpot: "food", cost: 7, minutes: 10, sitting: "nao_breakfast", when: { flag: ["nb_done"] } })
  );
  T.actions.landing.push(
    action("nb_quote", "talk", "Compare Nao's supply offer with Priya", "priya", "The co-op has the same sealed twelve-portion batch for eighteen credits, collected in ten minutes. It closes at half past four. Add your crossings and fuel before calling it cheaper. Nao needs the handover finished before quarter to six. One batch only; breakfast demand is yours to judge.", { once: true, when: { flag: ["nb_started"], notFlag: ["nb_done"], maxClock: "04:30" }, hears: ["r_nao_wharf"], sets: ["nb_quote"] }),
    action("nb_wharf_batch", "search", "Optional co-op batch · 12 portions · 18 cr", "priya", "Eighteen credits, seal checked, collection receipt tucked under the string. Now get it to Nao's counter in time. A cheaper crate can still cost more after the crossing.", { once: true, cost: 18, minutes: 10, supplyPurchase: true, when: { flag: ["nb_started", "nb_quote"], notFlag: ["nb_batch_owned", "nb_done"], maxClock: "04:30" }, sets: ["nb_batch_owned", "nb_wharf"] }),
    action("nb_invite_priya", "talk", "Invite Priya to Nao's breakfast", "priya", "Five o'clock? I can stop by during handover. I'll tell the early crew there's a pot on. Tell Nao she doesn't need a grand opening; a working kettle will do nicely.", { once: true, when: { flag: ["nb_started"], notFlag: ["nb_done"], maxClock: "05:00" }, sets: ["nb_invite_priya"] })
  );
  T.actions.market.find(a => a.id === "nb_start").lines = [
    { if: { maxClock: "05:00" }, lines: [say("nao", "Dad used to serve rice porridge to the first dock crews. He's retired now, and every time I unfold his recipe I hear him arguing with the kettle. I'd like to try a little breakfast opening at five. My pantry covers the first bowls. You could help with the warmer, invite neighbours, or simply be here. You don't have to buy anything to make this matter.")] },
    { if: { minClock: "05:00" }, lines: [say("nao", "I put Dad's old breakfast recipe on the stove this morning. He's retired; I'm still learning to sign the menu myself. You're welcome to join me for the opening—or the last bowl, if the first crews have gone. No purchase required. A familiar face is a good beginning.")] }
  ];
  const foodVisit = T.actions.market.find(a => a.id === "nm_visit_food");
  foodVisit.lines.forEach(line => { line.if.notFlag = ["nb_done"]; });
  foodVisit.lines.unshift({ if: { flag: ["nb_done"] }, lines: [say("nao", "Welcome to my breakfast counter. A sunrise bowl with tea is seven credits and ten minutes. The old tea and bun orders are here too. Or stay for a free chat; I have quite a morning to tell you about.")] });
  T.actions.bar.push(action("nb_invite_mei", "talk", "Invite Mei to Nao's breakfast", "mei", "Haruto's girl finally unfolded that recipe? I'll bring the good thermos. And send the first noodle delivery crew past her counter. A new breakfast is good for the whole quay.", { once: true, when: { flag: ["nb_started"], notFlag: ["nb_done"], maxClock: "05:00" }, sets: ["nb_invite_mei"] }));
  T.actions.metro.push(action("nb_invite_lam", "talk", "Invite Captain Lam to Nao's breakfast", "lam", "Haruto fed half the tug crews in my day. I'd be pleased to meet the new cook. I'll bring two early-shift friends, if their launch is on time. Better promise the visit than promise the crowd.", { once: true, when: { flag: ["nb_started"], notFlag: ["nb_done"], maxClock: "05:00" }, sets: ["nb_invite_lam"] }));
  T.actions.market.push(action("nb_repair", "search", "Help Kenji mend Nao's warmer · 10 min", "kenji", "Hold the lamp. Clean contact, tight screw... there it is. Nao thought she needed a new cabinet. This one needed someone to give it ten patient minutes. You can tell her it still has a few good breakfasts in it.", { once: true, marketSpot: "repair", minutes: 10, when: { flag: ["nb_started"], notFlag: ["nb_warmer", "nb_done"], maxClock: "03:20" }, sets: ["nb_warmer", "nb_repaired"] }));
  C.nao.lines.unshift(
    { id: "breakfast_after", when: { flag: ["nb_done"] }, text: "I signed the menu without practising on the back first. You'd think that wouldn't feel like an adventure. It did." },
    { id: "breakfast_warmer", when: { flag: ["nb_started", "nb_warmer"], notFlag: ["nb_done"] }, text: "The serving trays are ready. Now I only have to stop rearranging the spoons whenever I get nervous." },
    { id: "breakfast_pantry", when: { flag: ["nb_batch_owned"], notFlag: ["nb_batch_delivered", "nb_done"] }, text: "Your extra batch is still aboard. A five-minute handover gets it into the tray; finish before 05:45. I'll account for actual sales when we open together." },
    { id: "breakfast_shy", when: { flag: ["nb_started"], notFlag: ["nb_done"] }, text: "I can shout an order over three kettles. Inviting one friend to breakfast somehow takes all my courage." },
    { id: "breakfast_hint", when: { notFlag: ["nb_started"] }, text: "That folded paper? An old breakfast recipe. I keep meaning to put it on the counter. You can ask me about it, if you like." }
  );
  C.nao.lines.find(line => line.id === "market_late_watch").when.notFlag = ["nb_done"];
  C.kenji.lines.unshift({ id: "breakfast_repair", when: { flag: ["nb_repaired"] }, text: "Nao's cabinet was built to last. I like helping it keep that promise." });
  T.conversations.push({ id: "nb_meal_intro", at: "market", via: ["market_meal", "market_tea"], when: { notFlag: ["nb_started"] }, lines: [
    "Nao unfolds a handwritten recipe, then folds it again before anyone can read the heading.", say("nao", "Not a secret menu. More of a menu I'm arguing with. Ask me about breakfast when you're ready.")
  ] });
  T.conversations.push({ id: "nb_breakfast_chat", at: "market", via: ["nao_breakfast"], lines: [say("nao", "Dad used to say the last bowl was the one you remembered. I think the first one might matter too."), say("sora", "I'd happily test both theories. In the interests of sound market research.")] });
  T.ambience.push({ at: "market", via: ["nao_breakfast"], text: "Someone draws a tiny sunrise on the corner of Nao's menu. She pretends not to notice, then moves the kettle so it won't drip on it." });
  T.sceneClasses.push(
    { class: "nao-breakfast-planned", when: { flag: ["nb_started"], notFlag: ["nb_done"] } },
    { class: "nao-breakfast-ready", when: { flag: ["nb_warmer"] } },
    { class: "nao-breakfast-stock", when: { flag: ["nb_batch_delivered"] } },
    { class: "nao-breakfast-open", when: { flag: ["nb_done"] } },
    { class: "nao-breakfast-guests", when: { flag: ["nb_done"], notFlag: ["nb_late"], flagAny: T.breakfast.inviteFlags } }
  );
  T.scenes.market.again.unshift(
    { if: { flag: ["nb_done"] }, text: "SUNRISE BOWLS · NAO MIZUNO. The signed menu is propped beside a warm pot. Nao keeps one bowl for the next skipper." },
    { if: { flag: ["nb_started"], notFlag: ["nb_done"], minClock: "05:00" }, text: "Nao has set the breakfast pot beside her folded menu. The first crews are arriving. Stop by her counter if you're staying for the opening." }
  );
  T.expeditionObjectives.unshift(
    { when: { flag: ["nb_started"], notFlag: ["nb_done"], minClock: "05:45" }, text: "Nao kept the last bowl for you · Visit her food counter before dawn." },
    { when: { flag: ["nb_started"], notFlag: ["nb_done"], minClock: "05:00" }, text: "Nao's breakfast is ready · Join her at the Night Market's food counter." }
  );
  T.ending.closing.unshift(
    { if: { flag: ["nb_done"], notFlag: ["nb_late"] }, text: "SUNRISE BOWLS: Nao Mizuno's first breakfast welcomed the early crews. Her father Haruto's recipe sits beneath a new signature. She tells the Tern's skipper: 'Next time, I'll leave the menu unfolded.'" },
    { if: { flag: ["nb_late"] }, text: "Nao served the first crews before you returned, then kept the last bowl warm for you. A small opening, a handwritten name, and one more reason to cross the harbour again." },
    { if: { flag: ["nb_started"], notFlag: ["nb_done"] }, text: "Nao tried the breakfast counter while you were elsewhere. She leaves a note for the Tern: 'A small start. Come taste it another morning.' Any extra batch left unserved earned no sales." },
    { if: { flag: ["nb_done", "nb_warmer"] }, text: "The serving trays held their warmth. Nao credits a patient skipper for helping the old counter keep its promise." },
    { if: { flag: ["nb_done"], notFlag: ["nb_late"], flagAny: T.breakfast.inviteFlags }, text: "Your invitations brought neighbours to the opening. Nao discovered that asking people to come was part of the recipe too." }
  );
})();
