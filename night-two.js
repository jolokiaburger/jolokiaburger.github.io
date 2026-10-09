/* Night Two · A Lantern for Tomorrow. A separate chapter, built from shared world data.
   Loaded after night-market.js; never mutates Night One. */
(function () {
  "use strict";
  const clone = value => JSON.parse(JSON.stringify(value));
  const say = (who, text) => ({ who, text });
  const action = (id, kind, label, who, text, extra) => Object.assign({ id, kind, label, minutes: 0, lines: [say(who, text)] }, extra || {});
  const all = { order: "true", vault: "true", both: "true" };
  function build(base) {
    const T = clone(base);
    T.meta.title = "Night Two · A Lantern for Tomorrow";
    T.meta.chapter = 2;
    T.truths = [
      { id: "order", seeds: ["lantern-clear"], note: "Clear crossings. Festival instruments create demand for gold at Pier 9." },
      { id: "vault", seeds: ["lantern-mist"], note: "Fog postpones the pier's instrument order. The co-op's recycled gold still arrives." },
      { id: "both", seeds: ["lantern-bright"], note: "Extra festival crews arrive. Both the co-op delivery and instrument order are substantial." }
    ];
    T.market.base = 94;
    Object.assign(T.market.dealers.landing, { stock: { order: 20, vault: 45, both: 35 }, stockFrom: "01:00", stockBefore: 8,
      provenance: "Assayed recycled gold from the festival co-op, released through Landing 3.",
      buyText: "Oduya checks the co-op stamp and wraps {grams}. 'Fresh assay, no harbour legends required.' You pay {total}.",
      soldOut: "The co-op's selling tray is empty. Oduya keeps the hatch open for sellers." });
    T.market.dealers.pier.from = "02:00";
    T.market.dealers.pier.sellText = "The festival instrument clerk weighs {grams} for weather-sensor contacts and pays {total}. 'A little gold, a safer festival.'";
    T.market.dealers.market.stockArrivals = [{ at: "01:00", truths: ["order", "vault", "both"], grams: 12 }];
    T.market.dealers.market.full = "Sora has bought eighteen grams from you tonight. Tomorrow's business starts tomorrow; tonight's allowance stays closed.";
    T.events = [
      { id: "n2_coop_gold", at: "01:00", where: "landing", cause: "The co-op releases assayed recycled gold.", truths: {
        order: { mods: [{ loc: "landing", pct: -4, ramp: 10, hold: "end" }] },
        vault: { mods: [{ loc: ["landing", "market"], pct: -8, ramp: 15, hold: "end" }] },
        both: { mods: [{ loc: "landing", pct: -6, ramp: 10, hold: "end" }] }
      } },
      { id: "n2_instruments", at: "02:00", where: "pier", cause: "The confirmed festival instrument desk opens.", truths: {
        order: { mods: [{ loc: "pier", pct: 12, ramp: 10, hold: "end" }, { loc: "market", pct: 3, ramp: 20, hold: "end" }] },
        both: { mods: [{ loc: "pier", pct: 15, ramp: 10, hold: "end" }, { loc: ["bar", "market"], pct: 4, ramp: 20, hold: "end" }] }
      } }
    ];
    T.rumors = {
      n2_instruments: { source: "teo", origin: "bar", note: "Rei has a provisional festival instrument order for Pier 9 at 02:00. Fog may postpone it. Check the desk before betting on it.", truth: { order: "true", vault: "outdated", both: "true" }, reliability: 0.7, affected: "pier", effect: "demand", relatedEvent: "n2_instruments" },
      n2_coop: { source: "priya", origin: "landing", note: "Assayed recycled gold reaches the co-op exchange at 01:00. Delivery size varies; this is supply, not a promise of a profitable resale.", truth: all, reliability: 1, affected: "landing", effect: "supply", relatedEvent: "n2_coop_gold" },
      n2_pier_open: { source: "matte", origin: "pier", note: "The instrument desk is confirmed open. Compare its current bid with purchase, spread and crossing costs.", truth: { order: "true", both: "true" }, reliability: 1, affected: "pier", effect: "demand" },
      n2_pier_fog: { source: "matte", origin: "pier", note: "Fog postponed the instrument order. The buying desk will stay closed tonight.", truth: { vault: "true" }, reliability: 1, affected: "pier", effect: "none" },
      n2_rice: { source: "nao", origin: "market", note: "Nao buys up to two sealed rice crates at 30 cr each. Buy at Landing 3 for 18 cr/crate or at the market for 26. One purchase route tonight; Tern has two ingredient slots. Hand over by 04:30 (5 min). Co-op buys owned leftovers back for 16 cr/crate by 05:45 (5 min). Fuel and time cost extra. Courier option: one co-op crate, 12 cr delivery fee; you cannot sell it as your own. Nao's story needs no purchase.", truth: all, reliability: 1, affected: "market", effect: "opportunity", expires: "04:30" }
    };
    T.conversations = [
      { id: "n2_mei_supper", at: "bar", via: ["noodles", "tea", "teo_tea"], lines: [say("mei", "Nao brought me a menu draft. Two dishes, three crossings-out, one enormous signature. That is progress."), say("teo", "And festival sensors need gold—possibly. My order is provisional until two. Please don't turn 'possibly' into 'Rei promised'.")], hears: ["n2_instruments"] },
      { id: "n2_nao_table", at: "market", via: ["market_meal", "market_tea", "n2_bowl"], lines: [say("nao", "I tried practising a cheerful welcome in the mirror. Kenji heard and answered from the next stall. Apparently my reflection wants extra pickles."), say("sora", "Good. Every excellent market needs someone who takes pickles seriously.")] },
      { id: "n2_priya_flask", at: "landing", via: ["tea"], lines: [say("priya", "The co-op delivery is real. What you earn carrying it depends on where you go next—and what it costs to get there.")], hears: ["n2_coop"] }
    ];
    T.ambience = [
      { at: "bar", via: ["noodles", "tea", "teo_tea"], text: "Mei folds a little paper lantern from a spare receipt. The rain gives her time to finish the corners." },
      { at: "market", via: ["market_meal", "market_tea", "n2_bowl"], text: "A kettle clicks. Someone tests a lantern, and the counter briefly fills with honey-coloured light." },
      { at: "landing", via: ["tea"], text: "Priya dries the flask lid with a corner of her scarf. Behind her, the arrivals board blinks patiently." }
    ];
    T.people = {
      nao: [{ text: "Nao is testing a festival breakfast menu. Your earlier visit changes what she remembers; choosing and tasting her new dish is free." }],
      sora: [{ text: "Sora is preparing the lantern festival and running a fresh, capped gold tray. She remembers whether you completed the lighthouse delivery." }],
      priya: [{ text: "Priya logs the co-op deliveries. Her sealed rice crates cost 18 cr each; a courier route requires no purchase." }],
      teo: [{ text: "Rei has a provisional instrument order. Confirmation at the pier matters more than optimism." }]
    };
    const scenes = {
      bar: ["The next evening finds the Tern at Kurage 33. Paper lanterns dry above Mei's counter. Your purse, gold and fuel are what you brought home; the harbour remembers you.", say("mei", "Back already? Excellent. Nao has a new menu to test. And eat something before you go negotiating with the whole harbour.")],
      market: ["Lantern Market is preparing for tomorrow's festival. Nao has two recipe cards, Sora has a fresh gold tray, and Kenji is arguing kindly with a lamp."],
      landing: ["Co-op rice crates line Landing 3 beneath sealed blue labels. Priya keeps the supplies and the stories in separate columns."],
      metro: ["Festival crew finish their tea beneath Line 9. Captain Lam is inspecting a paper lantern as though it were a newly commissioned tug."],
      pier: ["Frostline's festival instrument desk is due at two. A provisional order is pinned beside the gate; its status is worth checking."],
      yard: ["Rin's yard smells of rain and warm metal. Lantern frames lean beside the assay bench."],
      island: ["Hoshimi's light sweeps over the festival preparations. Aki has saved a dry chair and a view of the entire Basin."]
    };
    T.scenes = {};
    Object.keys(scenes).forEach(loc => { T.scenes[loc] = { title: "Night Two · " + window.NEON_TIDES.world.locations[loc].short, first: scenes[loc], again: scenes[loc] }; });
    T.scenes.bar.first.push(
      { if: { priorFlag: ["nb_done"], priorNotFlag: ["nb_late"] }, lines: [say("mei", "Nao told me about her opening. Especially the part where you were there.")] },
      { if: { priorFlag: ["nb_late"] }, lines: [say("mei", "She saved you the last bowl, didn't she? Tonight you get another chance to arrive while the pot's still full.")] },
      { if: { priorNotFlag: ["nb_done"] }, lines: [say("mei", "You missed her first bowls. No need to apologise to the kettle. Go see what she's trying next.")] }
    );
    T.actions = {};
    Object.keys(scenes).forEach(loc => { T.actions[loc] = []; });
    // Familiar meals remain, with fresh speech and no first-night quest effects.
    const meals = [
      ["bar", "bar_noodles", "noodles", "No. 33 ramen · Supper before adventure", "mei", 14, 15, "Steam first, decisions second. Same good ramen; a completely new evening."],
      ["bar", "bar_tea", "tea", "Milk tea & festival stories", "mei", 6, 20, "I put the festival lantern out of reach of the soup. An important improvement on last year."],
      ["bar", "bar_teo_tea", "teo_tea", "Share tea with Rei", "teo", 6, 5, "Thank you. My dispatcher voice requires tea. My regular voice requires considerably more tea."],
      ["landing", "landing_tea", "tea", "Barley tea from Priya's flask", "priya", 2, 10, "A dry cup, a warm drink, and a minute without a clipboard. Splendid."],
      ["metro", "metro_soymilk", "tea", "Warm soy milk under the lanterns", "lam", 3, 10, "A sensible cargo for the stomach. Much easier to unload than machinery."],
      ["market", "market_skewers", "market_meal", "Festival skewers & counter stories", "nao", 9, 10, "I practised the glaze until Kenji volunteered to stop testing. That means success, I think."],
      ["market", "market_tea", "market_tea", "Barley tea & a seat with Nao", "nao", 6, 10, "The recipe cards can wait while the tea steeps. So can we."],
      ["yard", "yard_tea", null, "Workshop tea with Rin", "rin", 5, 10, "Tea break. No one is allowed to improve this kettle; it already works."],
      ["island", "island_tea", null, "Tea above the festival lights", "aki", 6, 10, "From here, the harbour looks as though everyone has left a light on for someone."]
    ];
    meals.forEach(([loc,id,sitting,label,who,cost,minutes,text]) => T.actions[loc].push(action(id,"order",label,who,text,{cost,minutes,sitting,sound:sitting && sitting.includes("tea") ? "tea" : "bowl",when:id==="market_skewers"?{maxClock:"03:30"}:undefined})));
    T.actions.landing.push(action("landing_refuel","system","Refuel the Tern · 30 cr · 20 min","priya","Full tank. Festival preparations look much nicer when the ferry can still get home.",{cost:30,minutes:20,effects:{refuel:true}}));
    T.actions.yard.push(action("yard_refuel","system","Refuel at Rin's yard · 30 cr · 10 min","rin","Fuel, cap, check. Adventure can continue.",{cost:30,minutes:10,effects:{refuel:true}}),
      action("n2_chart","talk","Ask Rin about the island channel","rin","Same marked channel, three fuel and thirty-five minutes each way. No delivery job tonight—visit Aki if you'd like the view. Plan your return fuel.",{once:true,sets:["exp_chart"]}));
    T.actions.bar.push(action("n2_invitation","talk","A new evening · Ask Mei about Nao","mei","Nao wants to test her festival breakfast. Help her choose a dish, taste the trial, or trade her ingredients. Her story is open to you even if your purse is empty.",{once:true}),
      action("n2_rei_order","talk","Rei's provisional order · Ask about gold","teo","Festival sensors use gold contacts. Pier 9 expects to open at two, unless fog delays the crews. I have an order sheet, not a crystal ball. Ask Matte for confirmation.",{once:true,hears:["n2_instruments"]}));
    T.actions.landing.push(action("n2_reserve_fuel","system","Priya's emergency fuel voucher · 2 fuel · Once","priya","The festival co-op keeps two units for a stranded skipper. No debt, no purchase—use them to get moving again. One voucher tonight; normal refills still cost thirty credits.",{once:true,minutes:5,when:{fuelBelow:1,creditsBelow:30},effects:{fuel:2},sets:["n2_reserve_fuel"]}));
    T.actions.landing.push(action("n2_coop_board","talk","Check tonight's co-op gold delivery","priya","Assayed recycled gold arrives at one. How much is on this launch varies with the crew's load. Read both prices when it lands; a cheap ask still has to survive the trip home.",{once:true,hears:["n2_coop"]}));
    T.actions.pier.push(
      action("n2_pier_check_open","talk","Check the festival instrument order","matte","Confirmed, signed and open. The desk buys thirty grams per skipper; the bid is on the board. Now you have a fact, not just Rei's hopeful timetable.",{once:true,when:{minClock:"02:00",truth:["order","both"]},hears:["n2_pier_open"]}),
      action("n2_pier_check_fog","talk","Read the amended instrument order","matte","Fog held the commissioning crew outside the Basin. The desk is postponed. No point polishing a closed window; there are other trades and a breakfast worth getting back for.",{once:true,when:{minClock:"02:00",truth:["vault"]},hears:["n2_pier_fog"]}),
      action("n2_wait_pier","system","Wait for the desk notice · Until 02:00","matte","You secure the ferry and wait for the signed notice. Everywhere else, prices and plans keep moving.",{once:true,when:{maxClock:"02:00"},effects:{clockTo:"02:00"}})
    );
    // Keep the visual stall bindings, but give every directory a new chapter intro.
    const directory = {
      gold:["sora","Fresh tray, same fair scale. Festival deliveries arrive at one; I still buy eighteen grams per skipper tonight."],
      food:["nao","Two recipe cards and one slightly nervous cook. Let's try something new. Ask about the festival breakfast; helping doesn't require buying a crate."],
      repair:["kenji","I'm mending lantern frames tonight. Nao's recipe debate is the only thing here with more than two settings."],
      lane:["sora","Sealed rice deliveries go to Nao by half past four. After that, owned unopened crates can go back to the co-op by quarter to six."]
    };
    Object.keys(directory).forEach(spot => { const [who,text]=directory[spot];T.actions.market.push(action("nm_visit_"+spot,"talk","Browse · "+spot,who,text,{directory:true,marketBrowse:spot,marketSpot:spot,when:spot==="repair"?{maxClock:"03:30"}:undefined})); });
    T.actions.market.find(a=>a.id==="nm_visit_food").lines = [
      {if:{flag:["n2_done"]},lines:[say("nao","The festival recipe is ready. A full bowl and tea cost seven credits and ten minutes; chatting is still free.")]},
      {if:{flag:["n2_menu"],notFlag:["n2_done"]},lines:[say("nao","Our recipe is chosen. We can test the seasoning, arrange ingredients, or wait for the free first spoonful at five.")]},
      {if:{notFlag:["n2_menu"]},lines:[say("nao","Two recipe cards and one slightly nervous cook. Ask about the festival breakfast; helping doesn't require buying a crate.")]}
    ];
    T.actions.market.find(a=>a.id==="nm_visit_gold").thing="market-scale";
    T.actions.market.find(a=>a.id==="nm_visit_food").thing="exp-nao";
    T.actions.market.find(a=>a.id==="nm_visit_repair").thing="exp-kenji";
    T.actions.market.find(a=>a.id==="nm_visit_lane").thing="market-lane";
    T.actions.market.push(action("n2_wish","search","Leave a wish for tomorrow's festival","nao","You write 'Good crossings, good company' on a paper star. Nao adds, 'And enough spoons.' Practical magic.",{once:true,thing:"market-wall",marketSpot:"food",sets:["nm_wish"]}));
    const food={marketSpot:"food"};
    T.actions.market.push(
      action("n2_nao_start","talk","A lantern for tomorrow · Nao's new recipe","nao","Tomorrow's lantern festival has an early crew. I'd like to test one new breakfast tonight: smoky mushroom rice, or bright plum-and-sesame rice. Choose with me and taste it at five. No purchase required. If you want a small trade, I buy up to two sealed rice crates at thirty credits each by half past four. Landing 3 sells them at eighteen; the market co-op charges twenty-six. Fuel and time are extra.",{...food,once:true,sets:["n2_started"],hears:["n2_rice"],lines:[
        {if:{priorFlag:["nb_done"],priorNotFlag:["nb_late"]},lines:[say("nao","You were there when I finally put my name on the menu. I left it there. Tonight I'd like to put a new recipe underneath it.")]},
        {if:{priorFlag:["nb_late"]},lines:[say("nao","My last-bowl skipper! Tonight let's aim for the first spoonful. No pressure. Well, a tiny amount of friendly pressure.")]},
        {if:{priorNotFlag:["nb_done"]},lines:[say("nao","I tried the breakfast opening while you were away. Small beginnings still count. I'd like you here for the next experiment.")]},
        {if:{priorFlag:["nb_warmer"]},lines:[say("nao","The warmer we prepared is holding beautifully. I think it enjoyed having an audience.")]},
        {if:{priorFlag:["nb_invite_mei"]},lines:[say("nao","Mei's thermos is still here from the morning you invited her. She asked whether I needed it back. I said, 'Not emotionally.'")]},
        {if:{priorFlag:["nb_invite_priya"]},lines:[say("nao","Priya wrote her breakfast visit into the log as 'important local business'. I kept the note.")]},
        {if:{priorFlag:["nb_invite_lam"]},lines:[say("nao","Captain Lam came back to tell me Dad approved. Apparently the two of them have been talking. A formidable review committee.")]},
        say("nao","Two ideas: smoky mushroom rice, or plum-and-sesame rice. Choose one with me; tasting at five is free. For trading, I buy at most two sealed rice crates at 30 cr each by 04:30. Co-op price: 18 each at Landing 3, 26 here. One purchase route; two cargo slots. Return owned unopened leftovers to the co-op for 16 each by 05:45. Fuel and time are extra. Or take a no-purchase courier job. Whatever you choose, you can stay for the story.")
      ]}),
      action("n2_menu_smoky","talk","Choose smoky mushroom rice","nao","Warm, earthy, a little ginger. I can imagine it on a foggy morning. Good—we'll test this one, and save the other recipe for another day.",{...food,once:true,when:{flag:["n2_started"],notFlag:["n2_menu"]},sets:["n2_menu","n2_smoky"]}),
      action("n2_menu_plum","talk","Choose plum & sesame rice","nao","Bright, sharp, and a little sweet at the end. Like finding a clear patch between rain showers. That's tonight's experiment!",{...food,once:true,when:{flag:["n2_started"],notFlag:["n2_menu"]},sets:["n2_menu","n2_plum"]}),
      action("n2_prep","search","Help Nao test the seasoning · 10 min","nao","One spoon for you, one for me. More ginger? Yes. Fewer dramatic pauses while I taste it? Impossible. Thank you; now it feels like our experiment.",{...food,once:true,minutes:10,sound:"bowl",when:{flag:["n2_menu"],notFlag:["n2_prepped","n2_done"],maxClock:"04:50"},sets:["n2_prepped"]}),
      action("n2_wait","system","Stay for the recipe trial · Until 05:00","nao","We clear space for the new pot and leave the handwritten recipe beside it. While we wait, the harbour carries on with its own plans.",{...food,once:true,when:{flag:["n2_menu"],notFlag:["n2_done"],maxClock:"05:00"},effects:{clockTo:"05:00"}}),
      action("n2_taste","talk","First spoonfuls · Taste Nao's new breakfast","nao","There. A recipe that wasn't on Dad's old card. I kept the last-bowl rule, but this part is mine. Tomorrow I can offer something new without pretending I know everything already.",{...food,once:true,sound:"opening",when:{flag:["n2_menu"],notFlag:["n2_done"],minClock:"05:00",maxClock:"05:45"},sets:["n2_done"],lines:[
        {if:{flag:["n2_smoky"]},lines:[say("nao","Mushroom, ginger and a little smoke. The warmth stays after the spoonful. I think this one's earned its place.")]},
        {if:{flag:["n2_plum"]},lines:[say("nao","Plum first, sesame after. Bright enough to wake the morning crew without arguing with them. I like it!")]},
        {if:{flag:["n2_prepped"]},lines:[say("nao","Our seasoning test helped. Tomorrow I can stop adjusting it every time someone walks past.")]},
        {if:{flag:["n2_rice_delivered"]},lines:[say("nao","And your rice delivery means I can try it for the festival crew. The agreed payment is already in your purse; this bowl is a thank-you, not another transaction.")]},
        {if:{notFlag:["n2_rice_delivered"]},lines:[say("nao","My pantry covered this trial. I'll arrange festival stock with the co-op in the morning. We didn't need a big deal to make a new recipe.")]},
        say("nao","Dad's last-bowl rule, my new recipe. Turns out keeping something and changing something can belong on the same menu.")
      ]}),
      action("n2_taste_late","talk","The saved spoonful · Catch Nao before dawn","nao","The early crew already tried it, but I saved a little bowl for you. New recipe, old last-bowl rule. Tomorrow's menu is ready. I'm glad you came back.",{...food,once:true,sound:"opening",when:{flag:["n2_menu"],notFlag:["n2_done"],minClock:"05:45",maxClock:"06:00"},sets:["n2_done","n2_late"]}),
      action("n2_after","talk","Tomorrow's lanterns · Ask what's next","nao","One festival breakfast, then a proper afternoon off. I might take Dad to see the lanterns. He can complain about my sesame ratio while secretly taking a second helping.",{...food,once:true,when:{flag:["n2_done"]}}),
      action("n2_bowl","order","Festival breakfast & tea · 7 cr · 10 min","nao","A full bowl of the new recipe, barley tea, and a seat with your name temporarily claimed by a spoon.",{...food,cost:7,minutes:10,sitting:"n2_bowl",sound:"bowl",when:{flag:["n2_done"]}})
    );
    // One purchase, one delivery, two slots. No replenishing or selling co-op cargo as your own.
    for (const [loc,unit,minutes] of [["landing",18,10],["market",26,5]]) for (const crates of [1,2]) {
      T.actions[loc].push(action("n2_buy_"+loc+"_"+crates,"search","Buy "+crates+" sealed rice crate"+(crates===1?"":"s")+" · "+(unit*crates)+" cr",loc==="landing"?"priya":"nao","Seals intact, dates checked. Your cargo, your decision. Deliver to Nao by 04:30 for 30 cr a crate, or return unopened crates at Landing 3 by 05:45 for 16 each. Fuel and time are extra.",{...food,cost:unit*crates,minutes,once:true,cargoBuy:{crates},when:{flag:["n2_started"],notFlag:["n2_stock_taken","n2_done"],maxClock:loc==="landing"?"04:00":"04:20"},sets:["n2_stock_taken"]}));
    }
    T.actions.landing.push(action("n2_courier","talk","Carry one co-op crate · No purchase · 12 cr delivery fee","priya","This sealed crate stays the co-op's property. Deliver it to Nao by 04:30 and earn twelve credits. No deposit, no gold purchase. If you're late, return it here by 05:45; there is no fee for a late return.",{once:true,minutes:10,cargoBuy:{crates:1,courier:true},when:{flag:["n2_started"],notFlag:["n2_stock_taken","n2_done"],maxClock:"04:00"},sets:["n2_stock_taken","n2_courier"]}),
      action("n2_return","search","Return unopened rice crates · 16 cr each if owned","priya","Seals intact. Owned crates return at sixteen each; co-op cargo simply comes home. There is no delivery fee on a return.",{once:true,minutes:5,cargoReturn:true,when:{cargoAtLeast:1,maxClock:"05:41"},sets:["n2_rice_returned"]}));
    T.actions.market.push(action("n2_deliver","search","Deliver rice to Nao · 30 cr each / 12 cr courier fee","nao","Perfect seals, good dates. I'll pay the agreed price now and stack these for the festival. You've turned a route into something useful.",{...food,once:true,minutes:5,cargoSell:true,sound:"bowl",when:{cargoAtLeast:1,maxClock:"04:26"},sets:["n2_rice_delivered"]}));
    T.expeditionObjectives = [
      {when:{flag:["n2_done"]},text:"Night Two's recipe complete · Keep trading, enjoy a bowl, or turn in aboard the Tern."},
      {when:{cargoAtLeast:1,maxClock:"04:26"},text:"Rice aboard · Deliver to Nao by 04:30; leave five minutes for handover. Fuel and time cost extra."},
      {when:{cargoAtLeast:1,maxClock:"05:41"},text:"Delivery window closed · Return unopened crates at Landing 3 by 05:45; leave five minutes."},
      {when:{cargoAtLeast:1},text:"Rice remains aboard · Return deadline passed. No automatic payout; the morning co-op will collect the unopened cargo."},
      {when:{flag:["n2_menu"],minClock:"05:00"},text:"Visit Nao's food counter before dawn · Your free recipe tasting is ready."},
      {when:{flag:["n2_menu"]},text:"New recipe chosen · Optional seasoning help, ingredient trade, or wait with Nao until 05:00."},
      {when:{flag:["n2_started"]},text:"Choose Nao's new breakfast recipe · No purchase needed. Ingredient trading is optional."},
      {text:"Night Two · Visit Nao at Lantern Market, check festival gold news, and plan your next route."}
    ];
    T.sceneClasses = [
      {class:"night-two",when:{night:2}},
      {class:"market-restocked",when:{minClock:"01:00"}},
      {class:"market-late-watch",when:{minClock:"03:30"}},
      {class:"market-wish",when:{flag:["nm_wish"]}},
      {class:"nao-breakfast-planned",when:{flag:["n2_started"],notFlag:["n2_done"]}},
      {class:"nao-breakfast-ready",when:{priorFlag:["nb_warmer"]}},
      {class:"nao-breakfast-open",when:{flag:["n2_done"]}},
      {class:"n2-rice-delivered",when:{flag:["n2_rice_delivered"]}}
    ];
    T.ending = {
      kicker:"Morning wire · Night Two",dawnLine:"The festival lanterns go dark for a few hours. Dawn brings a new menu and a well-earned rest.",
      byTruth:{
        order:{title:"A clear crossing, a new recipe",wire:["The festival instrument desk opened at 02:00. Gold contacts went into the weather sensors; the co-op's assayed supply reached Landing 3 at 01:00."]},
        vault:{title:"A little light through the fog",wire:["Fog postponed the instrument desk. The co-op's recycled gold arrived as planned and eased prices at Landing 3 and the market. Provisional demand stayed provisional."]},
        both:{title:"More lanterns than expected",wire:["Extra festival crews arrived. Both the co-op gold delivery and the instrument order were substantial; a cheap quay and a dear quay existed at the same time, with crossing costs between them."]}
      },
      reflections:[
        {if:{flag:["n2_rice_delivered","n2_courier"]},text:"You carried the co-op's rice for a twelve-credit fee. A delivery route was an adventure without a purchase."},
        {if:{flag:["n2_rice_delivered"],notFlag:["n2_courier"]},text:"Your rice reached Nao under the agreed thirty-credit price. The cargo account below separates its return from gold trading and fuel."},
        {if:{flag:["n2_rice_returned"]},text:"You brought the unopened cargo back. Sometimes a sensible return is the best ending for a trade."},
        {if:{flag:["end_beat_idle"]},text:"Your gold decisions beat simply holding your opening gold, with food, fuel, cargo and rewards counted separately."},
        {if:{flag:["end_lost_to_idle"]},text:"Your gold decisions trailed holding. The harbour leaves room to learn; a rumour is still worth checking."},
        {text:"You took another evening's measure of the Basin. Good company and a useful route belong in the log alongside the numbers."}
      ],
      closing:[
        {if:{flag:["n2_done","n2_smoky"]},text:"NAO'S MENU: smoky mushroom rice joins the festival breakfast. Her signature stays at the top."},
        {if:{flag:["n2_done","n2_plum"]},text:"NAO'S MENU: plum-and-sesame rice joins the festival breakfast. Her signature stays at the top."},
        {if:{flag:["n2_late"]},text:"Nao saved your bowl. A late return still found a place at her counter."},
        {if:{flag:["n2_started"],notFlag:["n2_done"]},text:"You helped begin a recipe, but missed its tasting. Nao finishes the trial with the morning crew; no story completion or trade payout is awarded automatically."},
        {if:{notFlag:["n2_started"]},text:"Nao tested her festival menu with her neighbours. You followed other tides tonight."},
        {text:"The Tern rests beneath a paper lantern. Two evenings, familiar faces, and something new to look forward to. The morning crew is arriving. Continue to Morning After the Lanterns when you are ready."}
      ]
    };
    return T;
  }
  function buildChat(base) {
    const C=clone(base);
    const pools={
      nao:["I kept my name on the menu. Funny how a few letters can take up so much courage.","Mushrooms or plum? Don't say both. I've already had that argument with myself.","Dad asked whether the spoonful test was scientifically rigorous. I told him we used two spoons.","Tomorrow I want to see the lanterns from the water. Counters deserve an evening off too.","I like a plan that has room for tea. Otherwise it's probably too ambitious."],
      sora:["A fresh tray for a fresh night. Yesterday's price is a memory, not an offer.","A lantern festival is mostly people carrying ladders and pretending it will all be effortless.","Nao's signature is getting larger. I consider that a promising market indicator.","Small trades can make a useful route. Big trades can make a very expensive lesson.","If your ferry ever needs a market banner, I know someone with excellent handwriting."],
      priya:["Rice crates and gold parcels. The logbook does not accept 'miscellaneous adventure' as a category.","Check the seal before you cast off. A dry label is a rather lovely thing.","No deposit on the courier crate. Trust is useful when it comes with clear terms.","Sixteen credits back for an owned unopened crate. A return can be sensible without being profitable.","My festival wish? One entire mug of tea while it's still hot."],
      mei:["She brought the recipe card back with her own notes on it. That's how recipes stay alive.","Every new night deserves supper. Even if yesterday's trade was magnificent.","I folded six lanterns. Five of them look like lanterns. The sixth has confidence.","My festival special is the same ramen with an extra spring onion. Never undervalue a reliable bowl.","Go see your people. I'll keep the soup moving."],
      teo:["Provisional means I can be cheerful about it without being certain.","Tonight's dispatcher forecast: scattered paperwork, clearing after tea.","Festival timetables have more decorative stars than ordinary timetables. Operationally unnecessary. Emotionally essential.","If Matte confirms the order, believe Matte. Until then, price the uncertainty too.","You look more at home aboard the Tern tonight. The harbour noticed."],
      kenji:["I've repaired four lantern frames and one bruised opinion. The opinion took longer.","Nao wants the pot quiet. I approve of machinery that knows when someone else has the scene.","Tomorrow I'm watching the festival from a chair. That's my most ambitious design.","A frame can bend and still hold a light. Useful principle.","If this lamp blinks, it's testing. If it keeps blinking, I'm testing my patience."],
      lam:["A festival is a fine reason to arrive somewhere without a cargo manifest.","Nao asked what I thought of her new menu. I said, 'Bring a spoon.' Decisive advice.","The first crossing teaches you the route. The second teaches you to notice the people on it.","A paper lantern has no seaworthiness at all. Still, I admire the design.","Keep a little fuel for getting home. Celebration doesn't change the distance."],
      rin:["Lantern brackets, fresh assay, hot kettle. The yard is positively festive.","Everyone wants a dramatic launch. I want all the bolts accounted for.","The island channel is still marked. No errand required; a visit can be its own reason.","Take your time at a new bench. Fast enthusiasm and slow mistakes are a poor combination.","I'll watch the lanterns from the rescued ferry. She deserves to see something pretty."],
      aki:["Tomorrow the lanterns will look like a second constellation floating on the water.","No collection job tonight. You can sit down without being useful first.","I planted plum stones behind the tower. Give me a few years and an optimistic gull.","The reef lights don't know it's a festival. Reliable company.","From here, even a small ferry seems to be carrying a story."],
      matte:["A signed order is a wonderful thing. You can put it beside a rumour and see the difference.","The festival crews wanted a decorative desk sign. I gave them a legible desk sign. Everyone wins.","Gold contacts are tiny. Their paperwork is surprisingly large.","Clear weather is welcome. Confirmed schedules are even better.","Come back after two for the actual desk status. Before that, have a look at the lantern frames."]
    };
    Object.keys(pools).forEach(id=>{if(C[id])C[id].lines=pools[id].map((text,i)=>({id:"n2_"+id+"_"+i,text}));});
    C.nao.lines.unshift(
      {id:"n2_nao_remembers",when:{priorFlag:["nb_done"]},text:"The menu is still signed. I wanted you to know that before we talk about tonight's recipe."},
      {id:"n2_nao_warmer",when:{priorFlag:["nb_warmer"]},text:"The warmer from our first trial is working. Some help lasts longer than the evening you gave it."},
      {id:"n2_nao_after",when:{flag:["n2_done"]},text:"We made a new recipe together. I think Dad will pretend to criticise it, then ask for the card."}
    );
    C.sora.lines.unshift({id:"n2_sora_lights",when:{priorFlag:["exp_done"]},text:"Those reef kits you delivered are doing their job. The festival boats will have a safer channel tomorrow."});
    return C;
  }
  window.NEON_TIDES_NIGHT_TWO={build,buildChat};
})();
