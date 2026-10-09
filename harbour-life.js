/* Shared small contracts, workshop stories, companions and persistent world memories.
   Load after canal-town.js and before morning-after.js / game.js. */
(function () {
  "use strict";
  const T = window.NEON_TIDES_TRADE, C = window.NEON_TIDES_CHAT;
  const say = (who, text) => ({ who, text });
  const act = (id, label, who, text, extra) => Object.assign({ id, kind: "talk", label, minutes: 0, lines: [say(who, text)] }, extra || {});
  function install(data, morning) {
    const deadlines = morning ? ["09:40", "10:15", "10:30"] : ["04:40", "05:15", "05:30"];
    data.freight = {
      ceramics: { title: "Jun's ceramic bowls", from: "canal", to: "bar", who: "mei", cost: 20, payment: 36, lastStart: deadlines[0], source: "jun" },
      seals: { title: "Workshop pump seals", from: "yard", to: "canal", who: "mako", cost: 16, payment: 32, lastStart: deadlines[1], source: "kenji" },
      cloth: { title: "Hana's lantern cloth", from: "canal", to: "market", who: "sora", cost: 12, payment: 24, lastStart: deadlines[2], source: "hana" }
    };
    Object.keys(data.freight).forEach(id => {
      const d = data.freight[id], flag = "freight_" + id;
      data.actions[d.from].push(act(flag + "_buy", "Cargo offer · " + d.title, d.source,
        "One wrapped case, " + d.cost + " credits. " + (data.characters[d.who] || window.NEON_TIDES.world.characters[d.who]).name + " has promised " + d.payment + " on delivery. Start the five-minute handover by " + d.lastStart + ". Fuel is yours to budget. One case per shift; this is an optional trade, not a favour you owe anyone.",
        { kind: "search", cost: d.cost, minutes: 5, once: true, freightBuy: id, when: { notFlag: [flag + "_owned"], maxClock: d.lastStart }, sets: [flag + "_owned"], marketSpot: d.from === "market" ? "lane" : undefined }));
      data.actions[d.to].push(act(flag + "_deliver", "Deliver · " + d.title, d.who,
        "Seal checked, everything safe. Here's the promised " + d.payment + " credits. Thank you for bringing something useful across the water.",
        { kind: "search", minutes: 5, once: true, freightDeliver: id, when: { flag: [flag + "_owned"], notFlag: [flag + "_done"], lastStart: d.lastStart }, sets: [flag + "_done"], marketSpot: d.to === "market" ? "gold" : undefined, sound: "sell" }));
      data.ending.closing.push({ if: { flag: [flag + "_done"] }, text: "SMALL CARGO: " + d.title + " delivered for " + d.payment + " cr; purchase " + d.cost + " cr, before fuel and time." });
      data.ending.closing.push({ if: { flag: [flag + "_owned"], notFlag: [flag + "_done"] }, text: "UNSOLD CARGO: " + d.title + " stayed aboard. No automatic payment; the case is set aside when this shift closes." });
    });
    if (morning) data.actions.yard.find(a => a.id === "freight_seals_buy").when.truth = ["order", "both"];
    installFestivalSupply(data, morning);
    installReadingAndAssay(data);
    if (morning) window.NEON_TIDES_CANAL_OUTING(data);
    Object.assign(data.things, { "yard-board": "Rin's work board", "yard-ferry": "Second Helping · Rescued ferry", "yard-kettle": "Workshop kettle", "yard-kenji": "Kenji · Parts bench" });
    data.actions.yard.push(
      act("yard_board", "Read Rin's work board", "rin", "A ferry called Second Helping, a tired bilge pump, three clean mugs. Those are today's grand projects. You can help with a repair, look through the salvage ledger, or sit down. The gold assay stays separate from the odd jobs.", { once: true, thing: "yard-board", sets: ["yard_started"] }),
      act("yard_pump", "Help Rin repair the bilge pump · 10 min", "rin", "Hold the light. One cleaned valve, one tightened seal... there! A pump should sound boring. Boring means a dry hull. No parts purchase needed; the crew already has the kit.", { kind: "search", once: true, minutes: 10, thing: "yard-ferry", when: { flag: ["yard_started"], notFlag: ["yard_pump_fixed"] }, sets: ["yard_pump_fixed"], sound: "repair" }),
      act("yard_star", "Search the rescued ferry's wheelhouse · 10 min", "rin", "Behind the compass is a brass star scratched with 'For safe homecomings'. The recovery ledger says its owner was Captain Lam. No treasure to sell this time. You wrap it in a clean rag instead.", { kind: "search", once: true, minutes: 10, thing: "yard-ferry", when: { flag: ["yard_started"], notFlag: ["yard_star_found"] }, sets: ["yard_star_found"] }),
      act("yard_ledger", "Read the salvage ledger · 5 min", "rin", "Every recovered tray is assayed; every wreck has an owner to check. There's a little drawing of Second Helping on the launch page, with 'pump first, celebration second' beneath it. The market price is on the current board, not in this ledger.", { kind: "search", once: true, minutes: 5, thing: "yard-board" }),
      act("yard_soup", "Workshop miso soup & rice · 7 cr · 10 min", "kenji", "Rin called this a parts delivery. The part was dinner. We agreed it was essential equipment.", { kind: "order", cost: 7, minutes: 10, sitting: "yard_meal", thing: "yard-kettle", sound: "bowl" }),
      act("yard_kenji", "Check in with Kenji at the parts bench", "kenji", "I'm borrowing Rin's tools while the market bench is quiet. The pump-seal case has a written order from Mako. Or help us check this lantern bracket for free; I'd rather send a working light than a dramatic one.", { thing: "yard-kenji" }),
      act("yard_bracket", "Check a lantern bracket together · 5 min", "kenji", "You hold the bracket against the lamp. No cracks, a little rust, plenty of life left. Kenji stamps the repair card and adds a tiny smiling face. 'Quality assurance,' he says.", { kind: "search", once: true, minutes: 5, thing: "yard-kenji", sets: ["yard_bracket_done"], sound: "repair" }),
      act("yard_launch", "Celebrate Second Helping's repair", "rin", "The pump runs clean. Rin ties a paper star to the helm; Kenji raises his mug. 'She'll launch with the day crew,' Rin says. 'For now, listen. No knocking. That's a very good song.'", { once: true, thing: "yard-ferry", when: { flag: ["yard_pump_fixed"], notFlag: ["yard_done"] }, sets: ["yard_done"] })
    );
    data.actions.metro.push(act("yard_return_star", "Return the brass star to Captain Lam", "lam", "Well now. My daughter made that before my last long voyage. I'd forgotten which boat it was on; I never forgot her handwriting. Keep the clean rag. I'll keep the star. Thank you, skipper.", { once: true, when: { flag: ["yard_star_found"], notFlag: ["yard_star_returned"] }, sets: ["yard_star_returned"] }));
    const companion = morning ? { flag: ["n3_breakfast"] } : data.meta.chapter === 2 ? { flag: ["n2_done"], notFlag: ["cf_aboard"] } : { flag: ["nb_done"] };
    companion.notFlag = (companion.notFlag || []).concat("companion_nao");
    data.actions.market.push(act("life_invite_nao", "Invite Nao for a quiet ferry break", "nao", "The pot is covered and my counter can close for a little while. I'd like to see the lighthouse without bringing a recipe card. Or we could sit by the canal. Just a visit, no assignment.", { once: true, when: companion, sets: ["companion_nao"], marketSpot: "food" }),
      act("life_nao_return", "Bring Nao back to her counter", "nao", "Home again. I'm keeping that view for the next busy morning. Thank you for making space for a trip that didn't need to earn anything.", { when: { flag: ["companion_nao"] }, effects: { clearFlags: ["companion_nao"] }, marketSpot: "food" }));
    data.actions.island.push(act("life_island_nao", "Watch the lighthouse sweep with Nao · 5 min", "nao", "From here my whole stall is smaller than a fingernail. That's oddly comforting. I can love it without making it my whole world. Aki, do you ever get tired of the view? ...Don't answer; I know.", { once: true, minutes: 5, when: { flagAny: ["companion_nao", "cf_aboard"] }, sets: ["companion_island"] }));
    data.actions.canal.push(act("life_canal_nao", "Share the quiet bench with Nao · 5 min", "nao", "No pot, no speech, no test portion. Just us and somebody else's kettle. Jun says the bridge is older than every shop here. I wonder how many people sat here deciding they were allowed a day off.", { once: true, minutes: 5, when: { flagAny: ["companion_nao", "cf_aboard"] }, sets: ["companion_canal"] }));
    data.conversations.push({ id: "yard_supper", at: "yard", via: ["yard_meal"], lines: [say("rin", "I used to apologise for how this yard looked. Then a boat I rescued carried a nurse home through a storm. Now I just apologise for the puddles."), say("kenji", "The puddles are getting excellent reviews from the frogs.")] });
    data.ambience.push({ at: "yard", via: ["yard_meal"], text: "Rain ticks on the workshop roof. A test lamp glows warm beside a row of mended tools." });
    const visuals = [
      ["memory-kits", { flag: ["exp_done"] }], ["memory-kits", { priorFlag: ["exp_done"] }],
      ["memory-bowls", { flag: ["freight_ceramics_done"] }], ["memory-bowls", { priorFlag: ["freight_ceramics_done"] }],
      ["memory-cloth", { flag: ["freight_cloth_done"] }], ["memory-cloth", { priorFlag: ["freight_cloth_done"] }],
      ["memory-seals", { flag: ["freight_seals_done"] }], ["memory-seals", { priorFlag: ["freight_seals_done"] }],
      ["memory-menu", { flagAny: ["nb_done", "n2_done", "n3_breakfast"] }], ["memory-menu", { priorFlag: ["nb_done"] }],
      ["memory-spoons", { flag: ["ct_parcel_done"] }], ["memory-spoons", { priorFlag: ["ct_parcel_done"] }],
      ["memory-recipe", { flag: ["cf_shared"] }], ["memory-recipe", { priorFlag: ["cf_shared"] }],
      ["memory-tea", { flag: ["ct_tea_sold"] }], ["memory-tea", { priorFlag: ["ct_tea_sold"] }],
      ["yard-repaired", { flag: ["yard_pump_fixed"] }], ["yard-repaired", { priorFlag: ["yard_pump_fixed"] }],
      ["nao-away", { flag: ["companion_nao"] }]
    ];
    data.sceneClasses = (data.sceneClasses || []).concat(visuals.map(v => ({ class: v[0], when: v[1] })));
    data.ending.closing.push({ if: { flag: ["yard_done"] }, text: "STARLING YARD: Second Helping's bilge pump is ready for the day crew. A rescued ferry has another beginning." }, { if: { flag: ["yard_star_returned"] }, text: "HOMEWARD STAR: Captain Lam has his daughter's brass keepsake again." }, { if: { flagAny: ["companion_island", "companion_canal"] }, text: "A QUIET VISIT: You and Nao took a little time without turning it into an errand." });
  }
  function installFestivalSupply(data, morning) {
    data.sceneClasses = data.sceneClasses || [];
    data.sceneClasses.push({ class: "nao-away", when: { flagAny: ["companion_nao", "cf_aboard"] } });
    const deadline = morning ? "10:20" : "05:20";
    data.actions.landing.push(
      act("fs_courier", "Festival supplies · Choose courier work", "priya", "Three separate cases: Jun's bowls from Kisaragi to Nao at the market, Mei's tea from Kurage 33 to Hana in Kisaragi, and Sora's lantern cloth from the market to Hana. No stock purchase. Fees: 6, 5 and 5 credits. Each collection and handover takes five minutes; start every delivery by " + deadline + ". Fuel is yours. Choose this or stock trading for this shift, not both.", { once: true, when: { notFlag: ["fs_started"], maxClock: deadline }, sets: ["fs_started", "fs_courier"] }),
      act("fs_stock", "Festival supplies · Choose stock trading", "priya", "Buy Jun's bowls for 18 cr and sell to Nao for 28; Mei's tea for 12 and Hana pays 20; Sora's cloth for 10 and Hana pays 18. Three separate cases, two cargo slots shared with other small freight. Each collection and handover takes five minutes; start delivery by " + deadline + ". Promised payments require delivery; unsold goods earn nothing this shift. Fuel costs extra. Your route choice stays fixed for this shift.", { once: true, when: { notFlag: ["fs_started"], maxClock: deadline }, sets: ["fs_started", "fs_stock"] })
    );
    const goods = [
      { id: "bowls", title: "Festival bowls", from: "canal", to: "market", source: "jun", who: "nao", cost: 18, payment: 28, fee: 6 },
      { id: "tea", title: "Festival tea", from: "bar", to: "canal", source: "mei", who: "hana", cost: 12, payment: 20, fee: 5 },
      { id: "cloth", title: "Festival lantern cloth", from: "market", to: "canal", source: "sora", who: "hana", cost: 10, payment: 18, fee: 5 }
    ];
    goods.forEach(g => ["courier", "stock"].forEach(route => {
      const id = "fs_" + g.id + "_" + route, cost = route === "stock" ? g.cost : 0, payment = route === "stock" ? g.payment : g.fee;
      data.freight[id] = Object.assign({}, g, { cost, payment, lastStart: deadline });
      data.actions[g.from].push(act(id + "_buy", (route === "stock" ? "Buy · " : "Collect courier case · ") + g.title, g.source,
        "One sealed case. " + cost + " cr purchase; " + payment + " cr promised on intact delivery. Start handover by " + deadline + "; fuel and five-minute handling at each end are yours to plan.",
        { kind: "search", once: true, cost, minutes: 5, freightBuy: id, when: { flag: ["fs_" + route], notFlag: ["fs_" + g.id + "_owned"], maxClock: deadline }, sets: ["fs_" + g.id + "_owned", "freight_" + id + "_owned"] }));
      data.actions[g.to].push(act(id + "_deliver", "Deliver · " + g.title, g.who,
        "Seal intact, case counted. Here's the promised " + payment + " credits. That corner of the festival has a little of your voyage in it now.",
        { kind: "search", once: true, minutes: 5, freightDeliver: id, sound: "sell", when: { flag: ["fs_" + g.id + "_owned", "fs_" + route], notFlag: ["fs_" + g.id + "_done"], lastStart: deadline }, sets: ["fs_" + g.id + "_done", "freight_" + id + "_done"] }));
    }));
    data.actions.canal.push(act("fs_finish", "Hana · A table carried across the water", "hana", "Bowls, tea, lantern cloth. Three ordinary things; a whole evening when they come together. All your payments are already settled. This last cup is simply for staying a moment.", { once: true, sound: "tea", when: { flag: ["fs_bowls_done", "fs_tea_done", "fs_cloth_done"], notFlag: ["fs_done"] }, sets: ["fs_done"] }));
    ["bowls", "tea", "cloth"].forEach(g => data.sceneClasses.push({ class: "festival-" + g, when: { everFlagAny: ["fs_" + g + "_done"] } }));
    data.ending.closing.push({ if: { flag: ["fs_done"] }, text: "FESTIVAL SUPPLIES: Bowls, tea and lantern cloth delivered. Individual cargo payments are included in your freight accounts; fuel remains a separate cost." });
  }
  function installReadingAndAssay(data) {
    data.things["review-rack"] = "The Lantern Review · Magazine rack";
    data.actions.bar.push(act("review_rack", "Browse The Lantern Review", "mei", "A fresh gold special, a summer back issue and a few seasonal stories. Choose an issue from the rack below. Reading is free; the clock can rest while you do.", { readingRack: true, directory: true, thing: "review-rack" }));
    (window.NEON_TIDES_REVIEW || []).forEach(issue => data.actions.bar.push(act("review_" + issue.id, issue.title, "mei", "", { readingIssue: issue.id, directory: true, lines: [issue.byline].concat(issue.lines) })));
    Object.keys(window.NEON_TIDES_LESSONS || {}).forEach(id => data.actions.market.push(act("nao_lesson_" + id, window.NEON_TIDES_LESSONS[id].title, "nao", "", { lesson: id, marketSpot: "food", when: { notFlag: ["companion_nao", "cf_aboard"] } })));
    data.assayQuest = { receipt: { lot: "F-17", karat: 24 }, assay: { lot: "P-17", karat: 0 }, displayOnly: true };
    data.actions.yard.push(
      act("ay_start", "Rin's mystery · The wrong golden parcel", "rin", "This gold-coloured fitting arrived with a receipt for bullion. It's quarantined, not on my sale tray. Could you check the dispatch copy with Priya and the part stamp with Kenji? No purchase, no gold wager.", { once: true, thing: "yard-board", sets: ["ay_started"] }),
      act("ay_stamp", "Ask Kenji to identify the parcel's stamp", "kenji", "P-17. A gold-plated brass display fitting, not a bullion lot. I have the maker's assay card. The receipt should describe a prop, not twenty-four-karat gold.", { once: true, thing: "yard-kenji", when: { flag: ["ay_started"] }, sets: ["ay_stamp"] }),
      act("ay_compare", "Compare receipt and assay card · 10 min", "rin", "F-17 on the receipt, P-17 on the fitting. The assay card identifies plated brass. Two parcels shared a dispatch envelope; a swapped receipt made this one sound much more valuable. The gold sale tray hasn't been touched.", { once: true, kind: "search", minutes: 10, when: { flag: ["ay_receipt", "ay_stamp"] }, sets: ["ay_compared"], effects: { parcelCompare: true }, thing: "yard-board" })
    );
    data.actions.landing.push(
      act("ay_receipt", "Read Priya's parcel dispatch copy · 5 min", "priya", "Receipt F-17 describes bullion. The envelope log pairs F-17 with display parcel P-17. I won't amend the record from a rumour; bring Rin's checked assay card and we'll correct the mix-up.", { once: true, kind: "search", minutes: 5, when: { flag: ["ay_started"] }, sets: ["ay_receipt"] }),
      act("ay_finish", "Correct the parcel receipt with Priya", "priya", "P-17: plated display fitting. F-17: a separate bullion receipt, reattached to its own file. No gold bought or sold, no purse lost. Rin can release the fitting to its rightful owner. That is a very satisfying kind of paperwork.", { once: true, when: { flag: ["ay_compared", "ay_mismatch"] }, sets: ["ay_done"] })
    );
    data.ending.closing.push({ if: { flag: ["ay_done"] }, text: "THE WRONG GOLDEN PARCEL: You checked the fitting and corrected its swapped bullion receipt. No gold was bought or sold." });
  }
  function chatInstall(chat) {
    if (!chat.kenji.visits.some(v => v.at === "yard")) chat.kenji.visits.push({ at: "yard", mode: "trade" });
    chat.kenji.thingsByPlace = Object.assign({}, chat.kenji.thingsByPlace, { yard: "yard-kenji", market: "exp-kenji" });
    chat.nao.visits.forEach(v => { if (v.at === "market") { v.when = Object.assign({}, v.when, { notFlag: ((v.when || {}).notFlag || []).concat("companion_nao") }); } });
    ["yard", "island", "canal"].forEach(at => { if (!chat.nao.visits.some(v => v.at === at && v.when && (v.when.flag || []).includes("companion_nao"))) chat.nao.visits.push({ at, mode: "trade", when: { flag: ["companion_nao"] } }); });
    const reactions = {
      rin: [
        { id: "life_assay", when: { flag: ["ay_done"] }, text: "P-17 has its own honest receipt now. You saved a display fitting from a very expensive identity crisis." },
        { id: "life_pump", when: { flag: ["yard_pump_fixed"] }, text: "Hear that calm little hum? That's your repair. Every dry floorboard aboard Second Helping will have a little of your patience in it." },
        { id: "life_pump_memory", when: { priorFlag: ["yard_pump_fixed"] }, text: "The pump you helped mend is still steady. You can visit a boat after fixing it, you know. She likes the company." },
        { id: "life_yard_return", when: { visited: { yard: 2 } }, text: "Back at the bench! I've cleared your usual patch of tabletop. No repair quota; tell me something from beyond the cranes." }
      ],
      hana: [
        { id: "life_festival_supply", when: { flag: ["fs_done"] }, text: "There you are, captain. Tonight you can follow the lanterns to a table you helped make possible. No more loading for this visit." },
        { id: "life_recipe_memory", when: { priorFlag: ["cf_shared"] }, text: "Nao's signed recipe is on the festival board. I kept the card exactly as she sent it. People should recognise their own words when they come back." },
        { id: "life_attended_memory", when: { priorFlag: ["cf_attended"] }, text: "Her little preview table made everyone less nervous about their own dishes. I'll keep the same-sized table for her; a good evening needn't become a bigger obligation." }
      ],
      sora: [
        { id: "life_cloth_memory", when: { priorFlag: ["freight_cloth_done"] }, text: "Hana's cloth from your delivery is on the lantern frames now. Come back when the lamps warm up; you'll recognise your crossing in the light." },
        { id: "life_tea_memory", when: { priorFlag: ["ct_tea_sold"] }, text: "Jun's tea was a hit with the stall crews. Someone asked whether you take passengers along that route. I said they'd have to ask the captain." },
        { id: "life_cloth", when: { flag: ["freight_cloth_done"] }, text: "The new lantern cloth is drying behind my stall. Your receipt is settled. The warm light will be the extra thank-you." }
      ],
      mei: [{ id: "life_bowls_memory", when: { priorFlag: ["freight_ceramics_done"] }, text: "The blue bowls you delivered are still doing good work. I recognise them before I recognise my own inventory numbers." }, { id: "life_bowls", when: { flag: ["freight_ceramics_done"] }, text: "Jun's bowls are on the shelf. The blue one holds exactly enough broth for somebody returning from an adventure. Very scientific sizing." }],
      mako: [{ id: "life_seals_memory", when: { priorFlag: ["freight_seals_done"] }, text: "Your pump seals are fitted. The lock pump is steady again. A good delivery keeps helping after its receipt dries." }, { id: "life_seals", when: { flag: ["freight_seals_done"] }, text: "Those seals are on the pump bench. Clear terms, intact cargo. You make paperwork feel almost sociable." }],
      nao: [{ id: "life_festival_bowls", when: { flag: ["fs_bowls_done"] }, text: "Jun's bowls are ready on the counter. I keep turning the blue one toward the lantern; even an empty bowl can look welcoming." }, { id: "life_view_memory", when: { priorFlag: ["companion_island"] }, text: "When the counter gets busy, I picture Aki's lighthouse sweep. A little room around a thought. I'm glad we went." }, { id: "life_canal_memory", when: { priorFlag: ["companion_canal"] }, text: "I keep thinking of that quiet bench. Nothing to serve, nothing to prove. We should be guests somewhere again." }],
      lam: [{ id: "life_star", when: { flag: ["yard_star_returned"] }, text: "The star's in my coat pocket. Every now and then I check it's there. My daughter will laugh when I tell her her little charm finally travelled home." }]
    };
    Object.keys(reactions).forEach(id => {
      const ids = reactions[id].map(line => line.id);
      chat[id].lines = chat[id].lines.filter(line => !ids.includes(line.id));
      chat[id].lines.unshift(...reactions[id]);
    });
    return chat;
  }
  install(T, false); chatInstall(C);
  const build = window.NEON_TIDES_NIGHT_TWO.build, buildChat = window.NEON_TIDES_NIGHT_TWO.buildChat;
  window.NEON_TIDES_NIGHT_TWO.build = base => { const data = build(base); install(data, false); return data; };
  window.NEON_TIDES_NIGHT_TWO.buildChat = base => chatInstall(buildChat(base));
  window.NEON_TIDES_LIFE = { install, chatInstall };
})();
