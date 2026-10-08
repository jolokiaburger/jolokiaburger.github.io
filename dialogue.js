/* NEON TIDES — optional harbour conversations.
   Authored, spoiler-safe lines; no generated text or network calls.
   game.js chooses an unheard eligible line first, then rotates without immediate repeats.
   Chat never grants evidence, relationships, money or clock time. Story actions do that.
   Character/action IDs stay stable so saves from earlier nights still work. */
window.NEON_TIDES_CHAT = {
  mei: {
    visits: [{ at: "bar" }], thing: "mei",
    lines: [
      { id: "welcome", text: "There you are! I was about to send a search party. Well, a bowl. Bowls are better at bringing people home." },
      { id: "recipe", text: "The secret to my broth? Patience. And ginger. People always forget the ginger because patience sounds more impressive." },
      { id: "cat", text: "That lucky cat's been waving for fifteen years. Most reliable employee I've ever had. Terrible at washing up, though." },
      { id: "home", text: "A good harbour needs three things: a light, a hot meal, and someone pleased to see you. We've got all three tonight." },
      { id: "seat", text: "See that spare stool? Yours whenever you need it. Even great adventurers have to sit down somewhere." },
      { id: "market", mode: "trade", text: "Buy is what you pay me. Sell is what I pay you. Keep enough for a crossing and a cup of tea; gold can't drink itself." },
      { id: "friend", mode: "trade", when: { rel: { mei: 2 } }, text: "I know that look now. You've got a plan. Take your time with it, skipper. I'll keep your usual bowl in mind." },
      { id: "late", when: { minClock: "02:00" }, text: "Quiet hours are my favourite. Listen: the whole harbour is breathing. And that kettle is about to whistle." }
    ]
  },
  teo: {
    visits: [{ at: "bar", mode: "case" }, { at: "bar", mode: "trade", when: { maxClock: "01:20" } }, { at: "pier", mode: "trade", when: { minClock: "01:30" } }], thing: "teo-figure",
    lines: [
      { id: "hello", text: "Skipper! Good timing. I have exactly one peaceful minute. Let's spend it on something that isn't a delivery form." },
      { id: "dream", text: "One day I'll take a ferry without a headset. No schedules. No calls. Just pick a light on the horizon and go." },
      { id: "riders", text: "Dex calls himself the fastest rider in Bellwater. Priya says he's the fastest at explaining why he's late. Both can be true." },
      { id: "tern", text: "The Tern has a good name. Small bird, long journey. Never let anyone convince you that you need a bigger boat to matter." },
      { id: "tea", text: "Milk tea is excellent dispatch equipment. Warm hands, clear head. The co-op keeps rejecting my expenses, but I'll win them over." },
      { id: "trade", mode: "trade", text: "A rumour is a lead, not a promise. Ask when they heard it. Then ask whether you can reach the buyer in time." },
      { id: "friend", mode: "trade", when: { rel: { teo: 2 } }, text: "You listen, then you go and look. I like that. Half this harbour does those in the wrong order." },
      { id: "pier", mode: "trade", when: { minClock: "01:30" }, text: "Different view from this end of the harbour, isn't it? I can almost see which stool I left my scarf on." }
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
