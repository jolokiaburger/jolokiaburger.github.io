/* Kisaragi Canal Town and Nao's festival invitation. Load after night-two.js.
   Shared destination; Night Two's story is installed on its cloned chapter only. */
(function () {
  "use strict";
  const D = window.NEON_TIDES, T = window.NEON_TIDES_TRADE, C = window.NEON_TIDES_CHAT;
  const say = (who, text) => ({ who, text });
  const action = (id, kind, label, who, text, extra) => Object.assign({ id, kind, label, minutes: 0, lines: [say(who, text)] }, extra || {});
  const loc = { id: "canal", name: "Kisaragi Canal Town", short: "Kisaragi Town", tag: "Canal Town", kicker: "Inland waterway · Tea, ceramics & a small festival", title: "Kisaragi · Lanterns Beyond the Locks", tradeOnly: true, unlockFlag: "ct_route", lockedText: "Ask Priya at Landing 3 for the canal route", ferry: { x: 720, y: 742 }, approach: "The Tern passes the old lock gates. Warm shop windows gather along a narrow canal; paper lanterns hang from a stone bridge." };
  Object.keys(D.world.locations).forEach(id => D.world.travel.push({ between: [id, "canal"], fuel: id === "island" ? 4 : 2, minutes: id === "island" ? 55 : 40 }));
  D.world.locations.canal = loc;
  D.variants.forEach(v => { v.scenes.canal = { first: [loc.approach], again: [loc.approach] }; });
  // Specific companion exchanges precede the general route observations.
  D.world.crossings.unshift(
    { id: "nao-locks", to: "canal", when: { flag: ["cf_aboard"], notFlag: ["cf_done"] }, exchanges: [
      [{ who: "nao", text: "Hello, I'm Nao, and this is... No. Hello, I'm Nao. I made this. That's enough, isn't it?" }, "The lock walls rise around the Tern. As the water lifts you, Nao tries her introduction once more, a little louder."],
      [{ who: "nao", text: "I practised on the kettle this time. It interrupted less than the engine. I think I'm ready to say my name first." }, { who: "mako", text: "Tern, welcome back. Hana's kept a place by the bridge. No speeches required to moor here." }],
      ["Nao watches the warehouse windows give way to lanterns and tiled roofs.", { who: "nao", text: "I can bring one little pot a long way. That feels like a good size of adventure." }]
    ] },
    { id: "canal-out", to: "canal", exchanges: [
      ["The last container crane falls behind. Reeds brush the banks; the old lock gate opens with a patient groan.", { who: "mako", text: "Kisaragi locks to Tern. Green lantern on the left, slow water ahead. Welcome inland, skipper." }],
      ["You recognise the blue-tiled bathhouse at the bend. Someone on a balcony raises a cup to the Tern.", { if: { everFlagAny: ["freight_seals_done"] }, lines: [{ who: "mako", text: "Those seals you brought are fitted. Hear the steady pump? Your receipt has become part of the lock now." }] }, { who: "mako", text: "Back for tea or another little mystery? Your usual mooring is clear." }],
      ["A kingfisher darts between the reeds. Jun's shop light appears beyond the bridge before the town sign does.", { who: "mako", text: "The lock's ready. Hana says arriving without a task counts as visiting, too." }]
    ] },
    { id: "canal-home-nao", from: "canal", when: { flag: ["cf_attended"] }, exchanges: [
      [{ who: "nao", text: "Two people asked for my recipe. I remembered to sign it before I apologised. Actually... I didn't apologise." }, "The lock lowers the Tern toward the harbour. Nao leans against the rail, smiling into her scarf."],
      [{ who: "nao", text: "Next visit, I'd like to try the dumplings instead of being the cook. We can be guests. Imagine that." }, "Harbour neon begins to colour the canal behind you."]
    ] },
    { id: "canal-home", from: "canal", exchanges: [
      ["Lantern reflections stretch behind the stern. Beyond the locks, the first crane light blinks like an old acquaintance.", { who: "mako", text: "Tern, clear of the gate. Give the harbour our regards; come back when the kettle wins the argument." }],
      ["A bicycle keeps pace along the towpath, then rings its bell goodbye. The open Basin feels wider after the quiet canal."],
      [{ who: "mako", text: "Safe home, skipper. Jun's saving the green cups for your next visit." }, "The last stone bridge slips into the rain behind you."]
    ] }
  );
  const cast = {
    hana: { name: "Hana Tsukino", role: "Festival organiser · A table for new beginnings", color: "#e6b6c5", portrait: "assets/portraits/hana-manga.webp", artStyle: "manga" },
    jun: { name: "Jun Arai", role: "Tea merchant · Small cargo, careful promises", color: "#b5d4b2", portrait: "assets/portraits/jun-manga.webp", artStyle: "manga" },
    mako: { name: "Mako Senda", role: "Lockkeeper · Knows every doorstep", color: "#b1ccd9", portrait: "assets/portraits/mako-manga.webp", artStyle: "manga" }
  };
  Object.assign(T.characters, cast);
  Object.keys(cast).forEach(id => {
    T.things["canal-" + id] = cast[id].name;
    C[id] = { thing: "canal-" + id, visits: [{ at: "canal", mode: "trade" }], lines: [] };
  });
  const pools = {
    hana: ["I wanted six festival tables. Mako measured the bridge and suggested four. Very persuasive tape measure.", "A guest cook can bring one dish. Nobody has to become an entirely new person for an evening.", "Paper lanterns look effortless because somebody climbed the ladder before you arrived.", "My favourite festival memory is the rain stopping halfway through supper. We applauded the sky.", "There is a spare chair by the noticeboard. Being here is a perfectly good use for it."],
    jun: ["The tea smells expensive. The price is written down, so you needn't guess.", "My grandmother said to warm the pot first. She was right about that and surprisingly competitive at cards.", "Small cargo fits a small ferry. Grand ambitions tend to arrive without checking the hold.", "I like a receipt with enough room for a thank-you.", "The first cup is for tasting. The second is for whatever you meant to say before you were busy tasting."],
    mako: ["A lock gate does one thing at a time. I try to learn from it.", "Ceramic bowls travel beautifully when nobody stacks an engine on top of them.", "I know every doorstep here. Names are harder; people keep lending each other coats.", "The bridge was built before the street lamps. It has heard some excellent arguments about supper.", "Take a minute before you cast off. A checked rope is much less dramatic than an unchecked one."]
  };
  Object.keys(pools).forEach(id => { C[id].lines = pools[id].map((text, i) => ({ id: "ct_" + id + "_" + i, text })); });
  C.hana.lines.unshift(
    { id: "festival_cloth_here", when: { flag: ["fs_cloth_done"] }, text: "Your cloth is on the bridge lanterns now. A case became six little lights; I rather like that exchange rate." },
    { id: "festival_tea_here", when: { flag: ["fs_tea_done"] }, text: "Mei's tea is on the crew table. The delivery is paid for. Sitting down is the part we don't put on a receipt." },
    { id: "parcel_spoons", when: { flag: ["ct_parcel_done"] }, text: "Every table has enough spoons now. Your mysterious parcel became three very ordinary second helpings. A fine ending." },
    { id: "return_chair", when: { visited: { canal: 2 } }, text: "You found us again! The spare chair is still spare in exactly the direction of you." }
  );
  C.jun.lines.unshift(
    { id: "festival_bowls_safe", when: { flag: ["fs_bowls_done"] }, text: "Nao said the bowls arrived without a chip. I wrap them for the voyage; a careful captain finishes the work." },
    { id: "tea_delivered", when: { flag: ["ct_tea_sold"] }, text: "Sora radioed to say the seal was perfect. A clear promise, a careful crossing, a warm kettle at the other end. Thank you." },
    { id: "return_cup", when: { visited: { canal: 2 } }, text: "The green cup? Yes, I remembered. You don't have to buy a case every time you visit a tea shop." }
  );
  C.mako.lines.unshift(
    { id: "parcel_closed", when: { flag: ["ct_parcel_done"] }, text: "Hana has her spoons, I have a complete address, and you have your fee. Next parcel, I'm asking my sister to use a surname." },
    { id: "return_rope", when: { visited: { canal: 2 } }, text: "That was a tidy approach. You're starting to know the current here. One day I'll have to wave instead of give directions." }
  );
  function installShared(data) {
    Object.assign(data.characters, cast);
    Object.assign(data.things, T.things);
    Object.assign(data.people, {
      hana: [{ text: "Hana welcomes visiting cooks to Kisaragi's festival. One dish and a small table are enough." }],
      jun: [{ text: "Jun sells one sealed tea case for 24 cr tonight. Sora's confirmed order pays 38 cr; fuel and time remain your costs." }],
      mako: [{ text: "Mako tends the canal locks, lends directions and keeps a fuel pump at the mooring." }]
    });
    data.market.local.canal = 2;
    data.market.dealers.canal = { name: "Jun's canal exchange", thing: "canal-jun", spread: 6, stock: 10, limit: 10, depth: 8, accepts: "any", provenance: "Assayed at Jun's canal exchange, with a dated green receipt.", buyText: "Jun weighs {grams} and wraps it with the assay slip. You pay {total}. 'Compare the return bid before the next crossing.'", sellText: "Jun checks your {grams}, pays {total}, and stamps the receipt. 'A long route deserves clear terms.'", soldOut: "Jun's ten-gram tray is empty tonight.", full: "Jun has bought ten grams from you. His allowance stays closed until tomorrow." };
    data.scenes.canal = { first: [loc.approach, say("mako", "Welcome through the locks, skipper. Fuel here, tea by the bridge, and Hana's festival tables just beyond it."), say("jun", "A gold board, a kettle, and one sealed tea case for Sora. Have a look before you make a plan.")], again: ["Lantern reflections drift beneath the bridge. Jun clears a place at the tea counter; Mako checks the Tern's mooring.", { if: { flag: ["cf_done", "cf_attended"] }, lines: [say("hana", "Nao's little supper table made quite an evening. You can visit again without carrying a task.")] }] };
    data.actions.canal = [
      action("ct_jun_hello", "talk", "Visit Jun's tea counter & gold exchange", "jun", "Welcome, skipper. The current gold board is below; tea is five credits and ten minutes. There's one sealed tea case for Sora if you want a cargo trade, but saying hello costs nothing.", { thing: "canal-jun" }),
      action("ct_board", "search", "Explore the bridge & festival noticeboard · 5 min", "hana", "Four supper tables, local ceramics, and lanterns along the canal. Guest cooks can preview a dish tonight before tomorrow's public festival. One signature, one dish, no obligation to expand a business.", { minutes: 5, once: true, sets: ["ct_notice"], thing: "canal-hana" }),
      action("ct_refuel", "system", "Refuel by the locks · 30 cr · 10 min", "mako", "Full tank, secure cap. The harbour crossing costs two fuel and forty minutes; Hoshimi is four fuel and fifty-five. Leave room for the return.", { minutes: 10, cost: 30, effects: { refuel: true } }),
      action("ct_tea", "order", "Roasted tea beside the canal · 5 cr · 10 min", "jun", "Warm the cup in both hands. The bridge has somewhere to be; we don't, for a minute.", { cost: 5, minutes: 10, sitting: "ct_tea", sound: "tea", thing: "canal-jun" }),
      action("ct_meal", "order", "Canal dumplings & tea · 9 cr · 15 min", "hana", "Mushroom dumplings, pickled greens, and a seat facing the water. Supper is allowed to be the destination.", { cost: 9, minutes: 15, sound: "bowl" }),
      action("ct_walk", "search", "Wander the ceramics arcade · 10 min", "mako", "Glazed bowls dry beneath a shop lamp. One has a tiny ferry painted inside. The potter says it will still be here when you've decided; looking costs only a little time.", { minutes: 10, once: true }),
      action("ct_buy_tea", "search", "Buy Jun's sealed tea case · 24 cr · 5 min", "jun", "One sealed case, twenty-four credits. Sora's written order pays thirty-eight at the market; handover takes five minutes. One case tonight, no replenishment. The return crossing costs fuel and forty minutes, so the fourteen-credit margin is not fourteen credits of guaranteed profit.", { minutes: 5, cost: 24, once: true, when: { notFlag: ["ct_tea_taken"], maxClock: "05:10" }, sets: ["ct_tea_taken", "ct_tea_owned"], effects: { canalTeaBuy: true }, thing: "canal-jun" }),
      action("ct_parcel", "talk", "An unfinished address · Help Mako find a recipient", "mako", "This parcel says 'the woman who keeps the fourth table for strangers'. No name. Could you check the festival notice and ask Jun? Bring the answer back; I'll pay twelve credits for sorting it out.", { once: true, sets: ["ct_parcel"], thing: "canal-mako" }),
      action("ct_parcel_jun", "talk", "Ask Jun about the fourth table", "jun", "Hana saves the fourth festival table for visiting cooks. It isn't reserved for a famous name. She likes people having room to begin.", { once: true, when: { flag: ["ct_parcel"] }, sets: ["ct_recipient"] }),
      action("ct_parcel_deliver", "talk", "Deliver the parcel to Hana · 12 cr fee", "hana", "A box of spare spoons! My sister writes addresses like riddles. Tell Mako I've got them, and keep the promised twelve credits. The table is ready now.", { once: true, when: { flag: ["ct_parcel", "ct_recipient", "ct_notice"], notFlag: ["ct_parcel_done"] }, sets: ["ct_parcel_done"], effects: { credits: 12 }, thing: "canal-hana" })
    ];
    data.actions.landing.push(action("ct_route", "talk", "Beyond the locks · Ask Priya about Kisaragi", "priya", "Here's the canal pilot sheet. Kisaragi is two fuel and forty minutes from the harbour quays. Mako has a fuel pump there; the tug can bring you home if you're stranded. Jun has a bounded tea order, and Hana welcomes visiting cooks. Check the clock before a long crossing.", { once: true, sets: ["ct_route"] }));
    data.actions.market.push(action("ct_sell_tea", "search", "Deliver Jun's sealed tea to Sora · 38 cr · 5 min", "sora", "Seal intact, the right blend. Here's the agreed thirty-eight credits. I'll keep the kettle busy; your cargo account keeps the purchase separate from gold and favours.", { minutes: 5, once: true, when: { flag: ["ct_tea_owned"], notFlag: ["ct_tea_sold"], maxClock: "05:56" }, sets: ["ct_tea_sold"], effects: { canalTeaSell: true }, marketSpot: "gold", sound: "sell" }));
    data.conversations.push({ id: "ct_tea_story", at: "canal", via: ["ct_tea"], lines: [say("jun", "Hana invited a cook who kept apologising for bringing only one dish. Everyone asked for the recipe. I don't think the apologies made it onto the card."), say("mako", "The tea case can wait while you sit. I like visitors who notice the town before they leave it.")] });
    data.ambience.push({ at: "canal", via: ["ct_tea"], text: "A bicycle bell rings on the bridge. Jun turns the cups to warm their other sides; the canal carries lantern reflections toward home." });
    data.ending.closing.push(
      { if: { flag: ["ct_parcel_done"] }, text: "KISARAGI: Hana's spare spoons reached the fourth festival table. Mako crossed the mysterious parcel off the list." },
      { if: { flag: ["ct_tea_sold"] }, text: "CANAL TRADE: Jun's tea reached Sora. Your fourteen-credit gross margin still had a journey attached to it." },
      { if: { flag: ["ct_tea_owned"], notFlag: ["ct_tea_sold"] }, text: "CANAL TRADE: One unsold sealed tea case is set aside for the morning crew. No sale or automatic payout was awarded; a new night starts with a fresh cargo allowance." }
    );
  }
  installShared(T);
  const build = window.NEON_TIDES_NIGHT_TWO.build;
  window.NEON_TIDES_NIGHT_TWO.build = function (base) {
    const data = build(base);
    installShared(data);
    const food = { marketSpot: "food" };
    data.actions.market.push(
      action("cf_invitation", "talk", "Nao's festival invitation · Read Hana's letter", "nao", "Hana Tsukino has offered me a small table at Kisaragi's festival. Just one dish, signed with my name. Could you meet her while I work on the recipe? I'd like to know what I'm saying yes to. We can prepare a spoonful together; no ingredient purchase is required.", { ...food, once: true, when: { flag: ["n2_menu"] }, sets: ["cf_invited", "ct_route"] }),
      action("cf_prepare", "search", "Help Nao prepare a festival sample · 10 min", "nao", "A little ginger, a clean recipe card, my name at the top. I thought an invitation meant I had to make something enormous. This fits in a bowl. Much better.", { ...food, once: true, minutes: 10, when: { flag: ["cf_invited"], notFlag: ["cf_done"] }, sets: ["cf_prepared"], sound: "bowl" }),
      action("cf_accept", "talk", "Nao's choice · Take the small festival table", "nao", "A small table and no promises about next year? Yes. Let's take the Tern to Kisaragi for tonight's preview supper. I'll close my counter while I'm aboard. We can still finish our free recipe tasting together there after five.", { ...food, once: true, when: { flag: ["cf_invited", "cf_prepared", "cf_met_hana", "cf_aroma"], notFlag: ["cf_choice"] }, sets: ["cf_choice", "cf_aboard"] }),
      action("cf_send_recipe", "talk", "Nao's choice · Send the recipe, keep her evening off", "nao", "I'd like Hana to have the recipe, but I'm keeping my afternoon with Dad. A card can make the crossing without its cook. Tell her it's a yes to sharing, and a no to a table this time.", { ...food, once: true, when: { flag: ["cf_invited", "cf_prepared", "cf_met_hana", "cf_aroma"], notFlag: ["cf_choice"] }, sets: ["cf_choice", "cf_card"] })
    );
    data.actions.canal.push(
      action("cf_hana", "talk", "Meet Hana · What does the invitation promise?", "hana", "One table, one dish, one evening. No entry fee and no grand opening speech. Nao keeps her name and her recipe. Tonight's preview supper is for the crew; tomorrow is the public festival. She can come, send the recipe, or decline. An invitation should leave room for an answer.", { once: true, when: { flag: ["cf_invited"] }, sets: ["cf_met_hana"], thing: "canal-hana" }),
      action("cf_aroma", "talk", "Ask Jun for a pairing · No purchase needed", "jun", "For smoky mushroom rice, roasted barley tea. For plum and sesame, a lighter green tea. Here are the notes for both. Nao already has enough for a sample; buying my cargo case is a separate trade.", { once: true, when: { flag: ["cf_invited"] }, sets: ["cf_aroma"], thing: "canal-jun" }),
      action("cf_preview", "talk", "A table with her name · Join Nao's preview supper · 10 min", "hana", "Nao sets her handwritten recipe beside a small pot. Two crew members ask for seconds; she laughs and writes down one suggestion. 'I can do this size,' she says. 'And I can still go home afterward.' Hana reserves the same little table for tomorrow. A new place on Nao's terms.", { once: true, minutes: 10, sound: "opening", when: { flag: ["cf_aboard"], notFlag: ["cf_done"], maxClock: "05:50" }, sets: ["cf_done", "cf_attended"] }),
      action("cf_preview_late", "talk", "The quiet table · Share Nao's sample before dawn", "nao", "The crew's supper has finished, but Hana saved a place for my pot and signed tomorrow's table card. We share one bowl under the bridge lantern. A quieter beginning still belongs to me.", { once: true, when: { flag: ["cf_aboard"], notFlag: ["cf_done"], minClock: "05:50", maxClock: "06:00" }, sets: ["cf_done", "cf_attended", "cf_late"] }),
      action("cf_card_deliver", "talk", "Deliver Nao's signed recipe to Hana", "hana", "Her recipe, her name, her evening off. I'll display the card with permission and tell anyone who asks where her counter is. Please tell Nao that choosing her own pace is an excellent beginning.", { once: true, when: { flag: ["cf_card"], notFlag: ["cf_done"] }, sets: ["cf_done", "cf_shared"], thing: "canal-hana" })
    );
    // The original recipe remains finishable while Nao is visiting Kisaragi.
    data.actions.market.filter(a => ["n2_wait", "n2_taste", "n2_taste_late", "n2_bowl"].includes(a.id)).forEach(a => data.actions.canal.push(JSON.parse(JSON.stringify(a))));
    data.actions.canal.filter(a => ["n2_wait", "n2_taste", "n2_taste_late", "n2_bowl"].includes(a.id)).forEach(a => { a.when = Object.assign({}, a.when, { flag: (a.when.flag || []).concat("cf_aboard") }); });
    data.expeditionObjectives.unshift(
      { when: { flag: ["cf_done"] }, text: "Kisaragi festival story complete · Nao chose her own pace. Finish the recipe tasting, trade or rest." },
      { when: { flag: ["cf_choice"] }, text: "Return to Hana in Kisaragi · Share Nao's preview supper or deliver her signed recipe before dawn." },
      { when: { flag: ["cf_met_hana", "cf_aroma", "cf_prepared"] }, text: "Return to Nao's food counter · Let her choose the table or an evening off." },
      { when: { flag: ["cf_invited"] }, text: "Nao's invitation · Prepare a sample with her, then meet Hana and ask Jun about tea in Kisaragi." }
    );
    data.ending.closing.push(
      { if: { flag: ["cf_attended"] }, text: "NAO'S INVITATION: A small preview supper in Kisaragi gave her a table for tomorrow, with her name on it and time to go home." },
      { if: { flag: ["cf_shared"] }, text: "NAO'S INVITATION: Her signed recipe reached Hana; Nao kept her afternoon off with Haruto. Sharing did not require growing the stall." },
      { if: { flag: ["cf_invited"], notFlag: ["cf_done"] }, text: "NAO'S INVITATION: The crossing or handover remained unfinished. Hana keeps the invitation open; no festival completion was awarded." }
    );
    return data;
  };
  const buildChat = window.NEON_TIDES_NIGHT_TWO.buildChat;
  window.NEON_TIDES_NIGHT_TWO.buildChat = function (base) {
    const chat = buildChat(base);
    chat.nao.visits.push({ at: "canal", mode: "trade", when: { flag: ["cf_aboard"] } });
    chat.nao.lines.unshift(
      { id: "cf_nao_table", when: { flag: ["cf_attended"] }, text: "Hana left room for a little pot and a large signature. I think I liked that order of priorities." },
      { id: "cf_nao_card", when: { flag: ["cf_shared"] }, text: "My recipe is visiting Kisaragi. I'm visiting Dad. We both get a good afternoon." },
      { id: "cf_nao_boat", when: { flag: ["cf_aboard"], notFlag: ["cf_done"] }, text: "I practised my introduction on the ferry. The engine was a generous audience." }
    );
    chat.nao.lines.unshift(
      { id: "cf_return_guest", when: { flag: ["cf_attended"], visited: { canal: 2 } }, text: "Hana greeted me by name before I opened the pot. I think that's my favourite thing about coming back." },
      { id: "cf_paid_rice", when: { flag: ["n2_rice_delivered"] }, text: "Your rice is stacked under my counter, and your agreed payment is done. Now we can talk about something besides invoices. Tea?" }
    );
    chat.jun.lines.unshift({ id: "cf_pairing_after", when: { flag: ["cf_done"] }, text: "Nao chose her own pace. My pairing notes fit on one card; perhaps good plans should leave space around the edges." });
    chat.hana.lines.unshift({ id: "cf_hana_after", when: { flag: ["cf_done"] }, text: "A festival should make room for its cooks, not decide their lives for them. Nao made a good choice." });
    return chat;
  };
})();

// The optional afternoon is a resolved-shift vignette, never another timed trade.
window.NEON_TIDES_CANAL_OUTING = function (data) {
  const a = (id, label, who, text, extra) => Object.assign({ id, label, kind: "talk", minutes: 0, once: true, lines: [{ who, text }] }, extra);
  data.characters.haruto = { name: "Haruto Mizuno", role: "Nao's father · Recipes and unhurried afternoons", color: "#d5be99" };
  data.actions.market.push(
    a("af_start", "Nao & Haruto · Plan an afternoon off", "nao", "After the crew breakfast I'd like a proper afternoon with Dad. Could we arrange a picnic and ask Priya about the route? Nothing to sell, no bigger stall to open. If the canal is closed, the quiet harbour bench will do.", { marketSpot: "food", when: { flag: ["n3_breakfast"] }, sets: ["af_started"] }),
    a("af_ready", "Tell Nao the picnic and route are ready", "nao", "A picnic, a checked route, and an afternoon that isn't an assignment. Thank you. Finish your morning at your own pace. When you read the shift report, you can join us, carry the basket, or leave us a little family time.", { marketSpot: "food", when: { flag: ["af_picnic", "af_route"] }, sets: ["af_ready"] })
  );
  data.actions.bar.push(a("af_picnic", "Pack Mei's family picnic · 5 min · Free", "mei", "Rice balls, pickled greens and a flask of tea. I have everything here; no shopping list. Tell Haruto his opinions about sesame are welcome as long as he carries the cups.", { kind: "search", minutes: 5, when: { flag: ["af_started"] }, sets: ["af_picnic"] }));
  data.actions.landing.push(a("af_route", "Check the afternoon route with Priya", "priya", "An outing isn't a cargo deadline. I'll mark a safe meeting place for the afternoon and leave the morning trade board alone.", { when: { flag: ["af_started"] }, sets: ["af_route"], lines: [
    { if: { truth: ["order", "both"] }, lines: [{ who: "priya", text: "The afternoon meeting is Jun's quiet canal bench, after the gates open. The family can take the scheduled day ferry. If you join after your shift, your Tern rests; no extra fuel or fare is charged to your morning accounts." }] },
    { if: { truth: ["vault"] }, lines: [{ who: "priya", text: "Low water rules out the canal today. I've marked the quiet harbour bench beside the market. Same picnic, no risky crossing. The afternoon won't cost your morning purse or fuel." }] }
  ] }));
  data.familyAfternoon = {
    join: [{ who: "nao", text: "12:30. The counter is closed for a little while. Look, Dad: we remembered how to sit down before somebody handed us a ticket." }, { who: "haruto", text: "The sesame is excellent. I was hoping to find something to complain about, but you've made that unnecessarily difficult." }, "You share the rice balls, trade stories about the harbour and let a whole cup of tea go by without checking a price board."],
    carry: ["12:30. You carry Mei's basket to the meeting place. Haruto takes the cups before Nao can apologise for asking.", { who: "haruto", text: "A ferry captain delivering a picnic. Admirable use of your qualifications." }, { who: "nao", text: "Thank you. We'll keep this afternoon small enough to enjoy." }, "You leave them talking beside the water. The basket has arrived; the family time belongs to them."],
    private: ["12:30. Mei's picnic is waiting and Priya's route is checked. You wave from a little farther along the quay.", { who: "nao", text: "Dad brought the old recipe card. I brought a new one. I think we'll let them get acquainted." }, "Nao and Haruto have the afternoon to themselves. Helping them keep it private counts as keeping your promise."]
  };
  data.ending.closing.push({ if: { flag: ["af_ready"] }, text: "AN AFTERNOON OFF: Nao and Haruto's picnic is arranged. After the shift report, choose whether to join, carry the basket or leave them family time." });
};
