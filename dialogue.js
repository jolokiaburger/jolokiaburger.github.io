/* NEON TIDES — optional harbour conversations.
   Authored, spoiler-safe lines; no generated text or network calls.
   game.js chooses an unheard eligible line first, then rotates without immediate repeats.
   Chat never grants evidence, relationships, money or clock time. Story actions do that.
   Character/action IDs stay stable so saves from earlier nights still work. */
window.NEON_TIDES_CHAT = {
  mei: {
    visits: [{ at: "bar" }], thing: "mei",
    lines: [
      { id: "welcome", text: "Back in one piece? Good. That's my favourite kind of entrance. Sit down; you can look mysterious after you've eaten." },
      { id: "recipe", text: "The broth takes patience. People do too. Unfortunately, adding ginger only works on one of them." },
      { id: "cat", text: "That lucky cat's been waving for fifteen years. Rei tried to put it on the courier rota. I told her it already has a full-time job." },
      { id: "home", text: "When I opened this counter, I had one pot and three stools. Now half the harbour calls it home. Best trade I ever made." },
      { id: "seat", text: "The stool by the tank is yours. No reservation, no grand title. Just show up. A person ought to have somewhere they can do that." },
      { id: "market", mode: "trade", text: "Buy is what you pay me; sell is what I pay you. Read both numbers. Then keep enough for fuel and tea. Clever people forget the simple things first." },
      { id: "friend", mode: "trade", when: { rel: { mei: 2 } }, text: "You're learning when to listen and when to cast off. I noticed. I also noticed you like the egg a little softer. Both things matter." },
      { id: "late", when: { minClock: "02:00" }, text: "Hear that? No trains, fewer engines, just rain and the kettle. At this hour the harbour stops performing and starts talking." }
    ]
  },
  teo: {
    visits: [{ at: "bar", mode: "case" }, { at: "bar", mode: "trade", when: { maxClock: "01:20" } }, { at: "pier", mode: "trade", when: { minClock: "01:30" } }], thing: "teo-figure", thingsByPlace: { bar: "teo-figure", pier: "rei-pier" },
    lines: [
      { id: "hello", text: "Skipper! If anyone asks, this is a briefing. If nobody asks, it's my first break tonight. Don't ruin it with paperwork." },
      { id: "dream", text: "One day I'll take a ferry without this headset. Pick a light, follow it, find somewhere I haven't already scheduled a delivery. Sounds dangerous. I can't wait." },
      { id: "riders", text: "Dex says he's Bellwater's fastest rider. Priya says he's fastest at explaining why he's late. I put both statements in his performance review." },
      { id: "tern", text: "A small boat can slip through where the big ships have to wait. Remember that when somebody tells you the Tern isn't enough." },
      { id: "tea", text: "Mei can tell how my shift is going by how I hold the cup. Two hands means she's already making another. That's better dispatch support than the office provides." },
      { id: "trade", mode: "trade", text: "A rumour is a lead. Check the time, check the buyer, check your tank. Then decide. You don't have to win every bargain to have a good night." },
      { id: "friend", mode: "trade", when: { rel: { teo: 2 } }, text: "You actually go and look. Most people just repeat the loudest voice. Keep doing that, skipper. I like knowing you're out there." },
      { id: "pier", mode: "trade", when: { minClock: "01:30" }, text: "From here I can see Mei's lanterns. Funny. Spend the whole shift planning routes, and there's still one light that always tells you where home is." }
    ]
  },
  priya: {
    visits: [{ at: "landing" }], thing: "booth",
    lines: [
      { id: "hello", text: "Welcome back, captain. You're not late. I haven't put you on a timetable. Very generous of me." },
      { id: "puzzle", text: "Seven letters. 'A journey worth taking.' I put ADVENTURE, ran out of squares, and decided the crossword was wrong." },
      { id: "lights", text: "I check all five boarding lamps before every shift. Someone coming home should never have to guess where to land." },
      { id: "ferries", text: "Every ferry has its own whistle. The Tern sounds like she's asking a question. I rather like that." },
      { id: "map", text: "My first map of Bellwater was drawn on a napkin. Mei still charges me for the napkin. In soup, fortunately." },
      { id: "trade", mode: "trade", text: "If you're comparing prices, write down when you saw them. Yesterday's bargain is a perfectly accurate description of yesterday." },
      { id: "late", when: { minClock: "01:40" }, text: "Last train's gone. Now it's us, the ferries and the stars. I should start a second crossword." }
    ]
  },
  matte: {
    visits: [{ at: "pier" }], thing: "matte",
    lines: [
      { id: "hello", text: "Evening, skipper. Mind the puddle by the gate. Looks shallow. Isn't. Found out for both of us." },
      { id: "tea", text: "Ginger tea. In the thermos. People think it's coffee. Let them. A man needs one harmless mystery." },
      { id: "stars", text: "Clear nights, you can see the northern star between those cranes. Best bit of the shift. Doesn't need a key or a form." },
      { id: "warmth", text: "Mei asked me to bring her bowls back. I washed them first. She said that made me management material." },
      { id: "boat", text: "The Tern looks well cared for. You can tell. A boat knows when someone bothers." },
      { id: "trade", mode: "trade", text: "Read the window before you unload. A buying desk has its own limits. Better to know them with your gold still in your pocket." },
      { id: "late", when: { minClock: "02:00" }, text: "Long night. Still a few lights across the water. Helps, knowing other people are awake." }
    ]
  },
  dex: {
    visits: [{ at: "metro", when: { maxClock: "01:40" } }], thing: "dex",
    lines: [
      { id: "hello", text: "Hey, skipper! Fancy a race? Boat against bicycle. We should probably agree on the course before I say anything else." },
      { id: "kid", text: "My kid drew wings on my delivery bag. Says I'm faster now. I'm not arguing with the engineer." },
      { id: "noodles", text: "I once delivered six bowls of ramen over these cobbles without spilling a drop. Greatest achievement. No medal. Still waiting." },
      { id: "music", text: "That Lantern FM tune's stuck in my head. I whistle it on the hills. Makes the hills feel shorter." },
      { id: "home", text: "The last train's at 01:40. Promised I'd be on it. Big adventure tomorrow: breakfast pancakes shaped like boats." },
      { id: "trade", mode: "trade", text: "I carry gold in my pocket, too. Not much. Enough to dream about a bike with gears that all agree with each other." },
      { id: "train", when: { minClock: "01:20", maxClock: "01:40" }, text: "Nearly train time. If you've got a question about tonight, ask now. I'll cheer you on from the window!" }
    ]
  },
  yumi: {
    visits: [{ at: "metro", mode: "case" }, { at: "metro", mode: "trade", when: { maxClock: "01:40" } }], thing: "yumi",
    lines: [
      { id: "hello", text: "Hi, skipper. Nothing bandaged? Nothing on fire? Excellent. We can have a normal conversation!" },
      { id: "stars", text: "The clinic kids call those lanterns bottled stars. I was going to explain electricity, but their version is better." },
      { id: "rest", text: "Rest is part of the adventure. So is dinner. I tell people this professionally, which means you should listen." },
      { id: "dream", text: "Someday I'd like to take the ferry all the way round the outer islands. No pager. Just a sketchbook and far too many sandwiches." },
      { id: "kindness", text: "Most nights, someone leaves tea outside the clinic. No note. Bellwater can be very good at looking after its own." },
      { id: "late", when: { minClock: "01:20" }, text: "You've still got that spark in your eyes. Good. Just promise me you'll save a little of it for tomorrow." }
    ]
  },
  lam: {
    visits: [{ at: "metro" }], thing: "lam",
    lines: [
      { id: "hello", text: "Ah, the Tern's captain! Sit a moment. The tide won't mind sharing your attention." },
      { id: "engine", text: "An engine is a conversation. Knock, rattle, hum. Learn its voice and it'll tell you what it needs. Usually oil. Sometimes a holiday." },
      { id: "jelly", text: "Watch that little light under the quay. No map, no hurry. Still gets where it's going. There's a lesson there, if you like lessons." },
      { id: "captain", text: "They still call me Captain. My boat these days is this crate. Steady in a following sea. Poor turn of speed." },
      { id: "horizon", text: "When I was young, I thought adventure lived beyond the horizon. Turns out it also lives two piers over. Saves on fuel." },
      { id: "trade", mode: "trade", text: "Salt gets at most metals. Gold holds on. That's why a gram can be a savings account or the heart of a machine." },
      { id: "dawn", when: { minClock: "04:00" }, text: "Look east when you next cast off. The colour changes before the sun arrives. The world's way of giving us a little notice." }
    ]
  },
  hollis: {
    thingsByPlace: { landing: "hollis-landing", bar: "hollis-bar" },
    visits: [{ at: "landing", mode: "trade", when: { minClock: "00:20", maxClock: "00:40" } }, { at: "bar", mode: "trade", when: { minClock: "00:45", maxClock: "01:40" } }],
    lines: [
      { id: "hello", text: "Skipper! Above water at last. Lovely place. Breathable. Excellent noodles." },
      { id: "treasure", text: "Best thing I ever found? A music box that still played. Sold the silver round it. Kept the tune." },
      { id: "boots", text: "My boots weigh more than your dinner. Haven't weighed your dinner, mind. Mei's generous." },
      { id: "boat", text: "We named the boat Long Patience so we'd remember to have some. Results have been mixed." },
      { id: "dream", text: "There's a whole street down there with lantern hooks still on the walls. Imagine the stories! I'll bring one up for you someday." },
      { id: "trade", text: "A good trader asks what actually came up. A good diver asks for supper before answering. We're a natural partnership." }
    ]
  },
  oduya: {
    thing: "oduya-figure",
    visits: [{ at: "landing", mode: "trade" }],
    lines: [
      { id: "hello", text: "Captain! Welcome to the smallest treasure house in Bellwater. Mind your head. The profits have more room than I do." },
      { id: "gloves", text: "The gloves? Habit. Also warmth. Mystery is easier when your fingers aren't freezing." },
      { id: "coin", text: "I keep my first coin in a little box. Not for luck. To remember how exciting one coin can be." },
      { id: "scale", text: "This scale was my mother's. She taught me to check it every night. Charm is useful; honest weights are essential." },
      { id: "tea", text: "Priya says I talk too much. I say she keeps excellent records of it. We meet for tea and both consider ourselves victorious." },
      { id: "trade", text: "My buying and selling prices are different. That gap keeps the hatch open. Always read both numbers before making your grand plan." }
    ]
  },
  radio: {
    visits: [{ at: "landing" }],
    lines: [
      { id: "hello", text: "Vidar to Tern. No emergency? Wonderful. Bengt here. How's the little ship treating you?" },
      { id: "gull", text: "A gull has claimed my foredeck. We've agreed on a rota. He gets mornings; I get the bits that require thumbs." },
      { id: "song", text: "If you hear singing on channel nine, that's the engine. Very musical engine. Tell nobody." },
      { id: "home", text: "There's always another light round the headland. And if yours goes out, give us a call. That's what a harbour's for." },
      { id: "toast", text: "Here's to small boats and good neighbours. Vidar standing by. Finish your tea before you cast off!" }
    ]
  }
};

// Fresh reactions become eligible as the harbour remembers your work.
window.NEON_TIDES_CHAT.mei.lines.unshift(
  { id: "after_lights", mode: "trade", when: { flag: ["exp_done"] }, text: "Sora told me about those lantern kits. People will get home by that light. Have an extra napkin; heroic work still drips sauce." },
  { id: "after_breakfast", mode: "trade", when: { flag: ["nb_done"] }, text: "Nao put her name on the menu. I remember the first time I did that. The letters looked much larger than the shop." },
  { id: "return_canal", mode: "trade", when: { visited: { canal: 1, bar: 2 } }, text: "You smell faintly of barley tea and lock water. Kisaragi? Sit down and tell me which light you liked best." }
);
window.NEON_TIDES_CHAT.priya.lines.unshift(
  { id: "tea_receipt", mode: "trade", when: { flag: ["ct_tea_sold"] }, text: "Jun's case delivered, payment confirmed. A very satisfying line in the ledger. I drew a tiny ferry beside it. Officially, that's a routing symbol." },
  { id: "rice_receipt", mode: "trade", when: { flag: ["n2_rice_delivered"] }, text: "Nao confirmed the rice arrived. Your receipt is filed, your fee is settled, and you may now discuss something wonderfully unrelated to paperwork." },
  { id: "canal_return", mode: "trade", when: { visited: { canal: 1, landing: 2 } }, text: "Back through the locks! Mako said your approach was tidy. High praise from someone who argues with ropes for a living." }
);

// Optional lessons are authored replies, with their own saved rotation per topic.
window.NEON_TIDES_LESSONS = {
  spread: { title: "Why are there two gold prices?", lines: [
    { id: "loss", when: { tradeLoss: true }, text: "That sale came in below the purchase cost. We can read it together without calling the whole night a failure. Compare the next buyer's bid with what you actually paid; fuel and supper are separate costs." },
    { id: "board", text: "Buy is what you pay the counter. Sell is what it pays you. The gap is the spread. Buying and immediately selling at the same board usually gives some credits to the counter, not to you." },
    { id: "size", text: "A bigger trade changes the price against you: buying lifts that dealer's ask, selling lowers the bid. One promising gram doesn't promise the same margin for a whole tray." },
    { id: "reserve", text: "Keep a little room in your purse for fuel. A clever trade that leaves you unable to reach its buyer is mostly a lovely calculation." }
  ] },
  history: { title: "Why does the Basin use gold?", lines: [
    { id: "banks", text: "The banks kept failing. People wanted something they could carry to a scale. Your share of the Heron became four grams last winter, after the bank on Pier 2 failed twice. That's a history, not just a starting number." },
    { id: "trust", text: "Gold doesn't remove trust. Somebody still weighs it, records where it came from and pays fairly. Mei's scale and Rin's assay slip are small promises we can actually check." },
    { id: "machines", text: "Our wet machines need gold too. That's why an industrial order can matter as much as somebody protecting savings. But your ferry's fuel and your gold are separate supplies. Don't feed the engine your savings!" }
  ] },
  rumors: { title: "How should I judge a trading rumour?", lines: [
    { id: "clock", text: "Ask who saw it, and when. A courier can repeat yesterday's true order after it has been cancelled. The notebook remembers the words and the time; it doesn't settle the question for you." },
    { id: "events", text: "More usable salvage can put pressure on a local ask. A real industrial buyer can lift demand. But a wreck called a vault isn't an assay, and a rumour about a desk isn't an open window." },
    { id: "visit", text: "Going to check uses minutes and fuel. Staying for tea can bring a lead, or simply good company. Decide what you want to learn before making the crossing." }
  ] },
  cargo: { title: "Is this cargo order worth the journey?", lines: [
    { id: "delivery", when: { flagAny: ["ct_tea_sold", "freight_ceramics_done", "freight_seals_done", "freight_cloth_done", "n2_rice_delivered", "n3_done"] }, text: "You've made a delivery now. Purchase and payment are different entries; arrival and handover are different moments. The new offer card keeps all four beside the crossing cost." },
    { id: "tea", text: "Jun's case costs 24 and Sora pays 38. Fourteen credits gross, before the trip. The canal takes forty minutes and two fuel from a harbour quay. It may fit a visit you already wanted; it isn't automatically worth a special trip." },
    { id: "courier", text: "A courier crate belongs to the co-op: no purchase, twelve credits for delivery. An owned rice crate is your stock and your risk. Read which promise you're accepting." },
    { id: "food", text: "My first tasting stays free. An optional breakfast batch might sell twelve portions at four credits, or fewer if the crew is quiet. Forty-eight is a maximum, not a queue I have already promised you." }
  ] }
};
window.NEON_TIDES_REVIEW = [
  { id: "harbour", title: "The Lantern Review · Harbour edition", byline: "From the editor's counter", lines: [
    "A small ferry can connect a remarkable number of lives. This issue visits Nao's counter, Sora's market and the people who keep the night shift moving.",
    "Nao keeps a place for a tired skipper. Sora keeps two prices on the board. Neither thinks the evening should be measured by a receipt alone."
  ] },
  { id: "summer", title: "Summer archive · Before the First Lantern", byline: "A July back issue, before the market opened", lines: [
    "Sora wants a market where a gold scale can stand beside a supper counter. Nao has a dish she might finally put her own name beside. Beyond the locks, Hana is saving four tables for a festival.",
    "At Starling Yard, Rin is saving a boat that other people have already written off. None of it is finished. The first lanterns are still in their boxes.",
    { if: { everFlagAny: ["nb_done", "n2_done", "n3_breakfast"] }, notice: "Margin note, today: Nao's counter has found its welcome. The old application feels like a beginning you helped make real." },
    { if: { everFlagAny: ["yard_done"] }, notice: "Margin note, today: Second Helping's pump is repaired. You remember the little launch celebration." },
    { if: { everFlagAny: ["cf_done"] }, notice: "Margin note, today: the invitation became Nao's own choice. The four tables left room for her answer." }
  ] },
  { id: "gold", title: "Gold special · The Gold We Carry", byline: "Essays by Nao Mizuno", lines: [
    { who: "nao", text: "A bank balance is a promise made somewhere else. A few grams wrapped in cloth are something you can bring to Mei's counter and ask her to weigh." },
    { who: "nao", text: "A quote belongs to a place and a moment. Keeping the old number is useful; expecting the world to keep it for you is another matter." },
    { who: "nao", text: "My first tasting bowl is free. The recipe invitation is a story choice. A paid breakfast is a sale. Keeping those things separate lets me offer a kindness without pretending it was a business error." }
  ] },
  { id: "halloween", title: "Halloween special · Harbour after dark", byline: "Seasonal companion fiction", lines: [
    "Paper lanterns, playful shadows and a ferry crossing that makes ordinary lights look mysterious. The night shift has found a reason to sit a little closer to the kettle.",
    "A seasonal story from the Review's shelf. These imagined festivities aren't a timed harbour event or a new trading order."
  ] },
  { id: "christmas", title: "Christmas special · A Table for the Night Shift", byline: "Seasonal companion fiction", lines: [
    "Nao plans a modest Christmas supper. The harbour brings the company. At Sora's counter, a frame from Rin, a repair from Kenji and a light for the stairwell become a gift with no price.",
    "Hot rice, ginger broth and room beside the stove. This imagined winter edition is a story to read, not a promise of seasonal stock on today's board."
  ] }
];
