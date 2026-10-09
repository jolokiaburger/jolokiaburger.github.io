/* Chapter Three · Morning After the Lanterns. Seeded markets, free main story,
   remembered decisions and one disrupted festival delivery. No servers or downloads. */
(function () {
  "use strict";
  const clone = value => JSON.parse(JSON.stringify(value));
  const say = (who, text) => ({ who, text });
  const act = (id, label, who, text, extra) => Object.assign({ id, kind: "talk", label, minutes: 0, lines: [say(who, text)] }, extra || {});
  function build(base) {
    const T = clone(base);
    Object.assign(T.meta, { id: "morning-after", title: "Chapter Three · Morning After the Lanterns", chapter: 3, startClock: "06:40", turnInFrom: "08:00", firstLight: "06:40", dawnClock: "11:00" });
    T.truths = [
      { id: "order", seeds: ["morning-clear"], note: "The supply launch broke down; the canal remains open." },
      { id: "vault", seeds: ["morning-low"], note: "Low water closes the lock; Hana moves the crew table to the market." },
      { id: "both", seeds: ["morning-late"], note: "The supply launch broke down and the locks reopen at eight." }
    ];
    T.market.base = 96;
    T.things["morning-hana"] = "Hana · Festival table";
    Object.keys(T.market.dealers).forEach(loc => {
      const d = T.market.dealers[loc];
      delete d.from; delete d.stockFrom; delete d.stockBefore; delete d.stockArrivals; delete d.truths;
      if (typeof d.stock === "object") d.stock = 18;
    });
    T.market.dealers.pier.from = "08:30";
    T.market.dealers.market.stockArrivals = [{ at: "07:30", truths: ["order", "vault", "both"], grams: 8 }];
    T.events = [
      { id: "morning_assay", at: "07:30", where: "yard", cause: "Rin releases a fresh assayed tray.", truths: { order: { mods: [{ loc: "yard", pct: -5, ramp: 10, hold: "end" }] }, vault: { mods: [{ loc: "yard", pct: -3, ramp: 10, hold: "end" }] }, both: { mods: [{ loc: "yard", pct: -4, ramp: 10, hold: "end" }] } } },
      { id: "morning_contacts", at: "08:30", where: "pier", cause: "The day crew opens its gold-contact desk.", truths: { order: { mods: [{ loc: "pier", pct: 7, ramp: 10, hold: "end" }] }, vault: { mods: [{ loc: "pier", pct: 2, ramp: 10, hold: "end" }] }, both: { mods: [{ loc: "pier", pct: 9, ramp: 10, hold: "end" }] } } }
    ];
    const all = { order: "true", vault: "true", both: "true" };
    T.rumors = {
      morning_yard: { source: "rin", origin: "yard", note: "Rin releases assayed salvage gold at 07:30. Read the current ask; the destination bid and fuel still decide the trade.", truth: all, reliability: 1, affected: "yard", effect: "supply", relatedEvent: "morning_assay" },
      morning_pier: { source: "matte", origin: "pier", note: "The day crew's instrument desk opens at 08:30, with a thirty-gram buying cap. The actual bid is on the board.", truth: all, reliability: 1, affected: "pier", effect: "demand", relatedEvent: "morning_contacts" }
    };
    const old = T.actions;
    T.actions = {}; T.scenes = {};
    const descriptions = {
      bar: "Morning rain shines on Mei's counter. The lanterns are still hanging; fresh bowls take the place of yesterday's worries.",
      landing: "The day crew changes shifts beneath a pale sky. Priya has a revised festival route clipped to her log.",
      market: "Sora rolls up the rain covers. Nao's kettle is on, and Kenji's repaired lanterns glow in the daylight.",
      yard: "Workshop lights meet the morning sky. Rin is checking a stranded supply launch beside Second Helping.",
      canal: "Kisaragi's lanterns sway above the first festival tables. Hana is setting out places for the crew.",
      metro: "Line 9 has its first passengers again. Captain Lam has brought a newspaper and absolutely no intention of hurrying.",
      pier: "Frostline's day crew checks the instrument order. Matte makes sure the opening time is written large enough to read.",
      island: "Hoshimi's beam fades into the morning brightness. Aki leaves the gallery door open for visitors."
    };
    Object.keys(descriptions).forEach(loc => {
      T.scenes[loc] = { first: [descriptions[loc]], again: [descriptions[loc]] };
      T.actions[loc] = (old[loc] || []).filter(a => ["bar_noodles", "bar_tea", "bar_teo_tea", "landing_tea", "metro_soymilk", "market_tea", "market_skewers", "yard_tea", "island_tea", "landing_refuel", "yard_refuel", "ct_refuel", "nm_fuel"].includes(a.id)).map(a => {
        delete a.when; delete a.hears; delete a.hearsWhen; delete a.sets;
        a.lines = [say((a.lines.find(l => l.who) || {}).who || "rin", "A warm drink, a familiar seat, and a little time to enjoy the morning. The plans can wait while the kettle finishes.")];
        return a;
      });
    });
    T.conversations = []; T.ambience = [];
    T.people = {
      rin: [{ text: "Rin has a tested salvage tray and the festival kit from the broken supply launch. Her yard welcomes helpers, visitors and anyone in need of a warm mug." }],
      nao: [{ text: "Nao offers a free morning bowl and remembers the recipe and pace she chose. She still plans a proper afternoon off." }],
      hana: [{ text: "Hana is arranging a table for the festival crew. Priya's current route notice tells you where the handover belongs." }],
      priya: [{ text: "Priya keeps today's lock conditions separate from yesterday's timetable, and has a bounded crew fuel voucher for a stranded skipper." }],
      sora: [{ text: "Sora has fresh gold allowances and a written lantern-cloth order. Earlier tea deliveries and reef kits have become part of her market's story." }],
      kenji: [{ text: "Kenji visits Rin's parts bench and helps test the festival lamps. A little patient repair is often enough." }],
      matte: [{ text: "Matte confirms the day crew's instrument order. The buying desk opens at 08:30; check the current gold bid and its remaining allowance." }]
    };
    T.sceneClasses = [{ class: "morning-shift", when: {} }, { class: "morning-hana-present", when: { truth: ["vault"] } }];
    T.actions.bar.push(act("n3_start", "Morning neighbours · Ask Mei about the festival", "mei", "Nao's breakfast is ready, but Hana's supply launch has lost its engine. Rin has the festival table kit safe at the yard. Help carry it if you'd like, and ask Priya where the crew can meet. No stock purchase required. Eighteen credits for a completed delivery; plenty of thanks for showing up.", { once: true, sets: ["n3_started"] }));
    T.actions.market.push(
      act("n3_breakfast", "Breakfast with Nao · A bowl on the house", "nao", "You stayed for another morning. Good. One bowl, on the house; the co-op covered the crew meal. You can help the festival later, or simply tell me what you saw from the ferry. I wanted breakfast to feel like this.", { once: true, sets: ["n3_breakfast"], sound: "bowl", marketSpot: "food" }),
      act("n3_kenji_lamp", "Help Kenji test the festival lamp · 10 min", "kenji", "Steady contact, dry housing... there. This lamp doesn't need new gold; it needs the screw seated properly. Hana's table kit now has a light that won't blink through introductions.", { once: true, minutes: 10, sets: ["n3_lamp"], marketSpot: "repair", sound: "repair" }),
      act("n3_deliver_market", "Deliver the table kit to Hana here · 18 cr fee", "hana", "Low water changed the address, not the welcome. We'll put the crew table here beside Nao's counter. Here's your agreed fee. Next year I'll put 'wherever the kettle is' on the invitation.", { once: true, minutes: 5, when: { flag: ["n3_cargo", "n3_route"], notFlag: ["n3_done"], truth: ["vault"], maxClock: "10:16" }, sets: ["n3_done"], effects: { credits: 18 }, marketSpot: "lane" })
    );
    T.actions.yard.push(act("n3_collect", "Collect Hana's stranded table kit · 10 min", "rin", "Lantern stands, tablecloths, clean cups. The broken launch can wait for a safe repair; these can't wait for the festival. Lash the kit beside the rail. It's festival property, with an eighteen-credit delivery fee, not stock to sell.", { once: true, minutes: 10, when: { flag: ["n3_started"], notFlag: ["n3_cargo"] }, sets: ["n3_cargo"], thing: "yard-board" }),
      act("n3_assay_news", "Check Rin's morning assay release", "rin", "The recovered tray is tested and dated. It opens at half past seven. Have a look at the numbers then; a good story about salvage isn't a buying price.", { once: true, hears: ["morning_yard"] }));
    T.actions.landing.push(act("n3_route", "Check Priya's revised festival route", "priya", "Current route, current date. I'll copy the meeting point into your notebook.", { once: true, when: { flag: ["n3_started"], truth: ["order", "vault"] }, sets: ["n3_route", "ct_route"], lines: [
      { if: { truth: ["order"] }, lines: [say("priya", "Kisaragi is open. Take the kit to Hana by the bridge; start handover by 10:15. Two fuel, forty minutes from the harbour.")] },
      { if: { truth: ["vault"] }, lines: [say("priya", "Low water has closed the canal to the Tern this morning. Hana moved the crew table to the Night Market. Take the kit there; start handover by 10:15.")] }
    ] }),
      act("n3_route_wait", "Wait for the lock release · Until 08:00", "priya", "Mako confirms the gate opens at eight. You secure the Tern and wait for the signed release. The gold boards elsewhere keep moving while you sit.", { once: true, when: { flag: ["n3_started"], truth: ["both"], maxClock: "08:00" }, effects: { clockTo: "08:00" }, sets: ["n3_route", "ct_route"] }),
      act("n3_route_late", "Read the signed lock release", "priya", "Mako opened the gate at eight. Hana is in Kisaragi; start the five-minute handover by 10:15. Your pilot sheet is ready.", { once: true, when: { flag: ["n3_started"], notFlag: ["n3_route"], truth: ["both"], minClock: "08:00" }, sets: ["n3_route", "ct_route"] })
    );
    T.actions.landing.push(act("n3_reserve_fuel", "Crew's emergency fuel voucher · 4 fuel · Once", "priya", "The festival crew pooled a little fuel for a stranded ferry. Four units, once this morning. No debt and no purchase. Use them for a useful route or a safe visit; the ordinary pump still costs thirty credits.", { once: true, minutes: 5, when: { fuelBelow: 1, creditsBelow: 30 }, effects: { fuel: 4 }, sets: ["n3_reserve_fuel"] }));
    T.actions.canal.push(act("n3_deliver_canal", "Deliver the table kit to Hana · 18 cr fee", "hana", "Everything dry, every cup intact. Here's the eighteen credits. The crew has somewhere to sit now. A broken launch turned into a little ferry adventure—and a proper table.", { once: true, minutes: 5, when: { flag: ["n3_cargo", "n3_route"], notFlag: ["n3_done"], truth: ["order", "both"], maxClock: "10:16" }, sets: ["n3_done"], effects: { credits: 18 }, thing: "canal-hana" }));
    ["market", "canal"].forEach(loc => T.actions[loc].push(act("n3_supper", "Join the festival crew's late breakfast · 10 min", "hana", "Mako claims a corner of the table. Rin brings the launch repair card, Nao passes the kettle, and someone asks the captain to sit before planning another route. A festival can begin with people eating together. That's quite enough for this morning.", { once: true, minutes: 10, when: { flag: ["n3_done"], notFlag: ["n3_shared"], truth: loc === "market" ? ["vault"] : ["order", "both"] }, sets: ["n3_shared"], sound: "opening" })));
    T.actions.pier.push(act("n3_pier_notice", "Read the day crew's gold order", "matte", "Signed and dated: the instrument desk opens at half past eight. Up to thirty grams per skipper; the bid changes with the morning's orders. Check the actual board before bringing a full hold of expectations.", { once: true, hears: ["morning_pier"] }));
    T.expeditionObjectives = [{ text: "Morning After the Lanterns · Visit Mei and Nao, check the revised festival route, or trade until 11:00." }];
    T.ending = {
      kicker: "Shift report · Morning After the Lanterns", dawnLine: "The late-morning crew takes over. The Tern has earned a rest.",
      byTruth: {
        order: { title: "A little ferry, a ready table", wire: ["The supply launch broke down. Kisaragi's canal remained open, and Rin released tested salvage gold at 07:30."] },
        vault: { title: "The festival found another doorstep", wire: ["Low water closed the canal to the Tern. Hana moved her crew table to the market; the day crew still opened its instrument desk at 08:30."] },
        both: { title: "Good things through the gates", wire: ["The locks reopened at 08:00. The delayed table kit had a safe canal route; the day crew's contact order was larger than expected."] }
      },
      reflections: [{ if: { flag: ["n3_shared"] }, text: "You helped people sit down together, then let yourself join them." }, { text: "Three shifts have made familiar lights into familiar people. There will be other tides; this little season has a place to rest." }],
      closing: [{ if: { flag: ["n3_done"] }, text: "FESTIVAL KIT: Delivered intact. Your eighteen-credit fee is accounted as a courier reward." }, { if: { flag: ["n3_cargo"], notFlag: ["n3_done"] }, text: "FESTIVAL KIT: Still aboard at shift end. Rin arranges a day-crew handover; no delivery fee was awarded." }, { if: { flag: ["n3_breakfast"] }, text: "NAO'S COUNTER: You shared the morning bowl, with no purchase required." }, { if: { flag: ["n3_lamp"] }, text: "KENJI'S BENCH: The festival lamp passed its contact test." }]
    };
    window.NEON_TIDES_LIFE.install(T, true);
    return T;
  }
  function buildChat(base) {
    const C = clone(base);
    // The morning cast is awake again; Nao still gets her chosen afternoon off.
    Object.keys(C).forEach(id => C[id].visits.forEach(v => { if (v.when && (v.when.minClock || v.when.maxClock)) delete v.when; }));
    C.hana.visits = [{ at: "canal", mode: "trade", when: { truth: ["order", "both"] } }, { at: "market", mode: "trade", when: { truth: ["vault"] } }];
    C.hana.thingsByPlace = { canal: "canal-hana", market: "morning-hana" };
    const pools = {
      nao: ["Morning light makes the rain look gentler. Same rain, better publicity.", "I wrote my name on the menu before I boiled the kettle. Small habit; good habit.", "Dad says the first bowl tells you how the day will go. I put extra ginger in yours.", "I'm keeping my afternoon off. A cheerful morning and a proper rest can be part of the same plan.", "Stay a moment. The next adventure can begin after the tea."],
      rin: ["The launch's engine failed; the cargo didn't. We'll get both where they belong.", "Morning shift. The bolts look exactly as dramatic in daylight.", "Second Helping's going to launch with a very sensible checklist.", "A repair is a promise you can test. I like that about it.", "Kenji brought breakfast. I have promoted him to extremely welcome visitor."],
      hana: ["An address can change without making the invitation any smaller.", "Four chairs and enough cups. Most grand plans should begin there.", "We can adjust the address without adjusting everybody's life.", "The crew always notices when somebody remembers the tea.", "A festival can be a little light left on for a neighbour."],
      priya: ["Morning log, clean page. We can change the route without pretending yesterday's timetable was right.", "I brought two pencils. Optimism and contingency planning.", "The day crew asked how the night went. I said the little ferries kept things moving.", "There's a rice grain in my clipboard hinge. An excellent sign of a proper breakfast.", "Mako's lock bulletin is the one to follow. My handwriting is merely the attractive delivery method."],
      sora: ["Fresh tray, fresh receipts. Same rule: read both numbers before chasing the shiny one.", "Jun's tea goes particularly well with opening the shutters.", "A good morning at the market includes somebody sitting down for no commercial reason.", "The lantern cloth looks lovely even with the lamps off. I didn't expect that.", "Bring me a story as well as a receipt. There's room on the counter for both."],
      mako: ["The morning current has opinions. I put them on the bulletin before anybody had to discover them with a hull.", "Nobody has ever argued a lock open. Plenty have tried.", "The kettle's on. The gate follows its own schedule; we can be pleasant while we wait.", "A spare seal is a surprisingly cheerful thing to have on a shelf.", "Come back in daylight again. You'll notice the painted fish under the bridge."],
      jun: ["Morning tea should give you somewhere to stand inside your own thoughts.", "Mei ordered the blue bowls. Excellent judgement; they make ginger look very distinguished.", "I dried the receipts before the cups. Occupational bias.", "The cases are sealed, the prices are written down. The view is complimentary.", "A little ferry brings trade, certainly. Also people I get to greet by name."],
      kenji: ["Daylight reveals the screws I dropped. It is a brutally helpful colleague.", "Rin's parts bench has a mug with my name on it. This is how workshops recruit you.", "The festival lamp passed. I gave it a sticker with a star. It looked pleased.", "A quiet pump and a steady light. That's my preferred kind of excitement before lunch.", "Nao insisted I eat before diagnosing anything. The engines have received much kinder opinions since."],
      mei: ["The morning bowl is allowed to taste different from the midnight bowl. People are, too.", "Three shifts, and you still come back looking for tea. Sensible captain.", "Haruto phoned about Nao's recipe. He used the phrase 'quite good' four times. This means he's proud.", "I put the blue bowls where the sunrise can find them.", "Sit before your next grand plan. Grand plans survive sitting very well."],
      lam: ["First train, first bowl, first unnecessary opinion about the weather. A complete morning.", "Second Helping's nearly ready? I'll come watch the day crew launch her.", "Daylight makes the harbour smaller. Familiar faces make it larger again.", "A festival kit is respectable cargo. Chairs are useful machinery for people.", "I brought the newspaper. So far, the best news is that the kettle works."],
      matte: ["Day-crew instrument orders open at 08:30. Today's notice is today's notice; I underlined the date.", "The night watch handed over one thermos and seventeen opinions about the rain.", "Tiny gold contacts, very useful machines. The buying allowance still has a limit.", "The crew is assembling its sensors. A clear window and a legible price are part of the equipment.", "Hana invited us to the table after handover. Excellent operational planning."],
      teo: ["Morning dispatch. The festival launch broke down, but the crew found a smaller boat with a bigger willingness.", "Priya has the signed route. I have coffee and helpful enthusiasm. Consult us in that order.", "Every functioning ferry is an opportunity with a rope tied to it.", "Nao handed me breakfast before I could call it a logistical challenge.", "When this shift ends, I'm turning off the headset. The harbour can enjoy ten minutes of my regular voice."],
      aki: ["Daylight is taking over my shift. I like an assistant with a very large lamp.", "The cove is calmer than the open channel. Come up for the view before you decide where to go next.", "I can see the festival lanterns even with their lamps off. Someone chose lovely colours.", "The kettle doesn't distinguish between midnight visitors and morning visitors. A wise machine.", "A ferry looks different in the morning: less like a star, more like a promise that kept going."],
      dex: ["Morning run! I delivered breakfast to the crew and only sampled the portion that was explicitly mine.", "My kid's pancake boats floated in syrup. Naval engineering is advancing beautifully.", "Priya has revised the route. I have revised my opinion that every shortcut is faster.", "I'll be back on the train after this run. The bicycle has earned a ride, too.", "Hana asked for enough spoons. For once, a cargo manifest made complete sense to me."],
      yumi: ["Morning shift. First check: everybody ate something? Excellent start.", "The clinic windows catch the festival colours. Patients keep asking who put the stars there.", "A little trip can do a person good. So can coming home afterward.", "I brought a clean sketchbook for my break. There are rumours I might actually use it.", "A safe route and a warm breakfast count as looking after people. You don't need a uniform."],
      oduya: ["Morning tray, fresh assay slips. Still two prices; sunlight hasn't abolished the spread.", "The co-op crew came early. Very unfair to somebody hoping for another cup of tea.", "I polished the scale before I polished the sign. My mother would approve.", "A short route isn't automatically a good trade. But it does leave more time for breakfast.", "Priya's new route notice is on the other window. Business is easier when information dries before you do."],
      radio: ["Vidar to Tern. Day crew checked in, kettle checked out. Bengt available for sensible requests.", "The foredeck gull has completed his morning inspection. No written report, thankfully.", "The festival launch is getting a tow to Rin's yard. Everybody aboard is fine; the engine has surrendered its opinion.", "If your tank runs dry, call us. A safe handover is a better story than stubborn drifting.", "Morning light on wet ropes. Not glamorous work, perhaps. Lovely place to do it."],
      hollis: ["Morning above water. A remarkable improvement on morning below it, especially at breakfast.", "Rin assayed the recovered tray. The stamps are hers; the muddy boots are mine.", "The tide keeps interesting hours. I keep a spare pair of socks.", "Someone put a lantern on our boat. I said it would rust. Then I said thank you.", "My next grand discovery will be a dry chair. Wish me luck, skipper."]
    };
    Object.keys(pools).forEach(id => { C[id].lines = C[id].lines.filter(line => line.when && (line.when.priorFlag || line.when.flag)); C[id].lines.push(...pools[id].map((text,i) => ({ id: "n3_" + id + "_" + i, text }))); });
    C.nao.lines.unshift({ id: "n3_table_memory", when: { priorFlag: ["cf_attended"] }, text: "I still have Hana's little table card. Tomorrow's invitation feels real now. Today I get to practise being glad about it." }, { id: "n3_card_memory", when: { priorFlag: ["cf_shared"] }, text: "Hana displayed my recipe just as I sent it. I'll go see Dad this afternoon. It turns out sharing and resting both fit on one card." });
    return C;
  }
  window.NEON_TIDES_MORNING = { build, buildChat };
})();
