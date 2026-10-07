/* ==========================================================================
   NEON TIDES — the gold night (story and market data)
   --------------------------------------------------------------------------
   Everything the player reads during a trading night lives here, with the
   numbers the market runs on. market.js prices it; game.js decides when to
   show what. The four investigations stay in cases.js, under Case files.

   Shape
   -----
   window.NEON_TIDES_TRADE = {
     meta        start of the night: clock, credits, gold, fuel, when you may turn in
     truths      the hidden states a night can be in, each with pinned seeds. One is
                 picked from the seed and never shown; rumours and events follow it.
     market      base price per gram, district offsets, noise, dealers (who has a scale)
     events      world events with causes and, per truth, price modifiers
     rumors      what can be heard, with hidden truth per night state
     characters  extra speakers (added to cases.js's cast for speech bubbles)
     people      the notebook's impressions of people, by relationship (never numbers)
     things      drawn things this night names (added to world.things)
     scenes      arrival text per place
     actions     per place: talk, order (food and tea), search, system
     conversations  what can happen while you sit with an order
     ambience    small moments when nothing important happens
     sceneClasses   body classes the picture follows
     ending      the morning wire, per truth
   }

   New fields on actions (on top of cases.js's ACTION)
   ---------------------------------------------------
     cost:     credits spent (the button shows it)
     sitting:  an order id ("noodles", "tea", "teo_tea"); after the order, the first
               conversation at this place whose `via` holds it and whose `when` holds is
               played, else an ambience line
     rel:      { personId: +n } relationship change (hidden; impressions and conditions read it)
     hears:    rumor ids written into the notebook
     hearsWhen: [{ if: CONDITION, hears: [...] }]

   New CONDITION fields (on top of cases.js's)
   -------------------------------------------
     truth: ["order", "both"]        the night is in one of these states
     rel: { teo: 1 }                 relationship at least this
     relBelow: { teo: 2 }            relationship below this
     heard: ["r_vault"]              every listed rumor is in the notebook
     heardAny: [...]  notHeard: [...]
     happened: ["frostline_order"]   the event exists tonight and its time has come
     goldAtLeast: 1                  grams held

   Rumor
   -----
   { topic, source (character id, or "you"), origin (place), note (what the notebook says,
     never an interpretation), truth: { truthId: "true" | "false" | "exaggerated" |
     "outdated" | "partial" | "self-serving" }, reliability (0..1, a writer's note, never
     shown), relatedEvent, affected (place), effect ("supply" | "demand" | "mystery" | "none"),
     expires (clock: after it the notebook calls the note old) }
   The truth and reliability fields are for writers and the debug view only.

   Event
   -----
   { id, at, where, cause (debug), truths: { truthId: { mods: [MOD] } } }
     An event absent from a truth never happens in that night.
   MOD: { loc: placeId | [placeIds] | "*", except?: [placeIds], pct, from?: clock (default at),
          ramp: minutes, hold: minutes | "end", decay: minutes, residual: pct }
   ========================================================================== */

window.NEON_TIDES_TRADE = (function () {
  "use strict";

  var meta = {
    id: "two-rumours",
    title: "Two Rumours",
    startClock: "23:40",
    turnInFrom: "01:30",     // the night can be ended from here on ("Turn in aboard the Tern")
    startCredits: 480,
    startFuel: 4,
    fuelMax: 6,
    refuelCost: 30,
    startGold: [
      { grams: 4, cost: 88, karat: 24, purity: 0.999, provenance: "Your share of the Heron, sold last winter. You took it in gold because the bank on Pier 2 had failed twice that year.", where: "bar" }
    ]
  };

  // Hidden night states. Seeds pinned here always open the same night; any other seed is hashed.
  var truths = [
    { id: "order", seeds: ["frost-order"], note: "Frostline's order is real and large; the vault is mostly gilt." },
    { id: "vault", seeds: ["vault-light"], note: "The vault is real bullion; Frostline's order was pulled before it opened." },
    { id: "both",  seeds: ["two-tides"],   note: "Both are true: cheap salvage at Landing 3, a dear desk on Pier 9." }
  ];

  var market = {
    base: 91,                // credits per gram, the Basin's rough middle tonight
    unit: "g",
    noisePct: 0.7,           // smooth wobble, at most this many percent either way
    noiseKnotMin: 20,
    local: { bar: 0, landing: -1.5, metro: 0.5, pier: 1 },
    dealers: {
      // buyText / sellText / moved: {grams} {total} {price} {time} {old} {new} are filled in by game.js
      bar: {
        name: "Mei's scale", spread: 4.5, thing: "gold-board", accepts: "any",
        provenance: "Bought across the counter at Kurage 33. Mei's scale, Mei's waxed paper.",
        buyText: "Mei weighs out {grams} on the brass scale, folds it into waxed paper and slides it across the counter. {total} goes into the cash tin under the bao.",
        sellText: "Mei weighs your {grams} twice, once on the scale and once in her palm, and counts {total} into your hand.",
        moved: "Mei has rubbed out the gold board and chalked it again since {time}: sell {old} → {new}."
      },
      landing: {
        name: "The exchange hatch", spread: 6, thing: "booth", accepts: "any",
        provenance: "Bought at the Landing 3 exchange hatch. Oduya says it's from the Harbour Savings wreck; there's no assay stamp.",
        buyText: "Oduya pushes {grams} through the hatch in a twist of oilcloth, still cold from the sea. {total}, and he counts it with his gloves on.",
        sellText: "Oduya drops your {grams} into a tray without looking at it and pushes {total} back through the hatch.",
        moved: "The prices chalked on Oduya's hatch have changed since {time}: sell {old} → {new}."
      },
      pier: {
        name: "Frostline buying desk", spread: 3, thing: "dock-office", buyOnly: true, from: "01:00", truths: ["order", "both"], accepts: "any",
        sellText: "The Frostline clerk weighs your {grams}, scratches it once on a black stone, and pays {total} in clean notes without a word.",
        moved: "The desk's price has changed since {time}: {old} → {new} a gram."
      }
    }
  };

  var events = [
    {
      id: "frost_whisper", at: "00:00", where: "bar",
      cause: "Word of Frostline's interest goes round the night shift; small holders sit on their gold.",
      truths: {
        order: { mods: [{ loc: "*", pct: 1.5, ramp: 30, hold: "end" }] },
        both:  { mods: [{ loc: "*", pct: 1.5, ramp: 30, hold: "end" }] },
        vault: { mods: [{ loc: "*", pct: 1.5, ramp: 30, hold: 30, decay: 30, residual: 0 }] }
      }
    },
    {
      id: "vault_salvage", at: "00:20", where: "landing",
      cause: "The Long Patience lands the Harbour Savings haul at Landing 3 and sells it at the hatch.",
      truths: {
        order: { mods: [
          { loc: "landing", pct: -3.5, ramp: 10, hold: 40, decay: 60, residual: 0 },
          { loc: ["bar", "metro"], from: "00:45", pct: -1, ramp: 15, hold: 20, decay: 30, residual: 0 }
        ] },
        vault: { mods: [
          { loc: "landing", pct: -9, ramp: 10, hold: "end" },
          { loc: "*", except: ["landing"], from: "00:50", pct: -6, ramp: 30, hold: "end" }
        ] },
        both: { mods: [
          { loc: "landing", pct: -8, ramp: 10, hold: 100, decay: 60, residual: -3 },
          { loc: "*", except: ["landing"], from: "00:50", pct: -2, ramp: 20, hold: "end" }
        ] }
      }
    },
    {
      id: "frostline_order", at: "01:00", where: "pier",
      cause: "Frostline opens a buying desk on Pier 9 for thirty kilograms of high-purity gold.",
      truths: {
        order: { mods: [
          { loc: "pier", pct: 14, ramp: 10, hold: "end" },
          { loc: "*", except: ["pier"], from: "01:20", pct: 6, ramp: 25, hold: "end" }
        ] },
        both: { mods: [
          { loc: "pier", pct: 14, ramp: 10, hold: "end" },
          { loc: "*", except: ["pier"], from: "01:20", pct: 5, ramp: 25, hold: "end" }
        ] }
      }
    },
    {
      id: "order_pulled", at: "01:00", where: "pier",
      cause: "The desk never opens: the order was cancelled at eleven and nobody told the couriers. The premium the rumour put on gold drains away.",
      truths: { vault: { mods: [] } }
    }
  ];

  var characters = {
    hollis: { name: "Hollis",       role: "Salvage diver, Long Patience",       color: "#7fd1ff" },
    oduya:  { name: "Oduya",        role: "Broker, Landing 3 exchange hatch",   color: "#d9b071" }
  };

  /* ---- rumours: the notebook's wording is `note` ------------------------------ */
  var rumors = {
    r_vault: {
      topic: "salvage", source: "mei", origin: "bar",
      note: "Salvage divers from Landing 3 have found the old Harbour Savings vault off the breakwater. \"Gold bars. A whole vault, they say.\"",
      truth: { order: "exaggerated", vault: "true", both: "partial" }, reliability: 0.55,
      relatedEvent: "vault_salvage", affected: "landing", effect: "supply", expires: "02:00"
    },
    r_frostline: {
      topic: "frostline", source: "teo", origin: "bar",
      note: "Frostline is quietly looking for clean twenty-four karat. \"Somebody up there needs a lot of it.\"",
      truth: { order: "true", vault: "outdated", both: "true" }, reliability: 0.75,
      relatedEvent: "frostline_order", affected: "pier", effect: "demand", expires: "02:00"
    },
    r_desk: {
      topic: "frostline", source: "teo", origin: "bar",
      note: "Frostline's buying desk on Pier 9 opens at one. \"Over the board, for stamped twenty-four.\"",
      truth: { order: "true", vault: "outdated", both: "true" }, reliability: 0.75,
      relatedEvent: "frostline_order", affected: "pier", effect: "demand", expires: "01:30"
    },
    r_pulled: {
      topic: "frostline", source: "teo", origin: "bar",
      note: "After a call on her headset: \"Forget the desk. Order's pulled. Somebody upstairs changed their mind at eleven and nobody told the couriers.\"",
      truth: { vault: "true" }, reliability: 0.9,
      relatedEvent: "order_pulled", affected: "pier", effect: "demand", expires: "02:30"
    },
    r_desk_lit: {
      topic: "frostline", source: "teo", origin: "bar",
      note: "After a call on her headset, to nobody in particular: \"Desk's lit. One o'clock.\"",
      truth: { order: "true", both: "true" }, reliability: 0.85,
      relatedEvent: "frostline_order", affected: "pier", effect: "demand", expires: "01:30"
    },
    r_engineers: {
      topic: "frostline", source: "mei", origin: "bar",
      note: "Three Frostline engineers ate at ten. Paid cash, \"which engineers never do\", and asked where to buy clean twenty-four karat. She sold them forty grams.",
      truth: { order: "true", vault: "true", both: "true" }, reliability: 0.8,
      relatedEvent: "frostline_order", affected: "pier", effect: "demand", expires: "03:00"
    },
    r_gilt: {
      topic: "salvage", source: "hollis", origin: "bar",
      note: "The \"vault\" was display trays: \"gilt on lead, mostly\". Maybe four hundred grams of the real thing from a whole night's diving. The broker paid them as if it were bars.",
      truth: { order: "true" }, reliability: 0.8,
      relatedEvent: "vault_salvage", affected: "landing", effect: "supply", expires: "03:00"
    },
    r_bars: {
      topic: "salvage", source: "hollis", origin: "bar",
      note: "Forty-one bars, Harbour Savings stamp, pre-flood. \"We're going back down at dawn for the rest.\"",
      truth: { vault: "true" }, reliability: 0.75,
      relatedEvent: "vault_salvage", affected: "landing", effect: "supply", expires: "03:00"
    },
    r_twelve: {
      topic: "salvage", source: "hollis", origin: "bar",
      note: "Twelve bars, real. The broker at Landing 3 paid them under the board, \"because who else buys twelve bars at midnight?\"",
      truth: { both: "true" }, reliability: 0.8,
      relatedEvent: "vault_salvage", affected: "landing", effect: "supply", expires: "03:00"
    },
    r_seen_gilt: {
      topic: "salvage", source: "you", origin: "landing",
      note: "On the tarp under the boarding lights: coins, display trays, a bank's brass nameplate. The gilt has worn grey at the edges of most of it. A few small bars.",
      truth: { order: "true" }, reliability: 1, relatedEvent: "vault_salvage", affected: "landing", effect: "supply", expires: "06:00"
    },
    r_seen_bars: {
      topic: "salvage", source: "you", origin: "landing",
      note: "On the tarp under the boarding lights: bars stacked like bricks, each stamped HARBOUR SAVINGS, each beaded with seawater. A diver keeps losing count.",
      truth: { vault: "true" }, reliability: 1, relatedEvent: "vault_salvage", affected: "landing", effect: "supply", expires: "06:00"
    },
    r_seen_twelve: {
      topic: "salvage", source: "you", origin: "landing",
      note: "On the tarp under the boarding lights: a dozen real bars in a mess of plated trays. The broker is buying all of it, the bars at a fair price and the rest at none.",
      truth: { both: "true" }, reliability: 1, relatedEvent: "vault_salvage", affected: "landing", effect: "supply", expires: "06:00"
    },
    r_boat: {
      topic: "salvage", source: "priya", origin: "landing",
      note: "The salvage boat Long Patience logged out at 20:04, \"out by the breakwater\". Due back about a quarter past twelve.",
      truth: { order: "true", vault: "true", both: "true" }, reliability: 0.95,
      relatedEvent: "vault_salvage", affected: "landing", effect: "none", expires: "00:30"
    },
    r_priya_eng: {
      topic: "frostline", source: "priya", origin: "landing",
      note: "Three Frostline engineers came off the 22:10 with hard cases and went back on the 23:30. \"Lighter, by the way they carried them. I do times, not faces.\"",
      truth: { order: "true", vault: "true", both: "true" }, reliability: 0.95,
      relatedEvent: "frostline_order", affected: "pier", effect: "demand", expires: "06:00"
    },
    r_oduya: {
      topic: "salvage", source: "oduya", origin: "landing",
      note: "\"By tomorrow there'll be so much salvage gold the gulls will wear it. Sell to me tonight, while I'm feeling generous.\"",
      truth: { order: "self-serving", vault: "self-serving", both: "self-serving" }, reliability: 0.3,
      relatedEvent: "vault_salvage", affected: "landing", effect: "supply", expires: "02:00"
    },
    r_matte_lit: {
      topic: "frostline", source: "matte", origin: "pier",
      note: "Garrow has had the buying desk lit since midnight. \"Opens at one. Twenty-four karat, assayed. Don't quote me.\"",
      truth: { order: "true", both: "true" }, reliability: 0.85,
      relatedEvent: "frostline_order", affected: "pier", effect: "demand", expires: "01:30"
    },
    r_matte_dark: {
      topic: "frostline", source: "matte", origin: "pier",
      note: "The desk was lit last night. Tonight Garrow came down at eleven, turned the card in the window face down, and went home. \"Don't quote me.\"",
      truth: { vault: "true" }, reliability: 0.85,
      relatedEvent: "order_pulled", affected: "pier", effect: "demand", expires: "06:00"
    },
    r_lam: {
      topic: "mystery", source: "lam", origin: "metro",
      note: "The last time Frostline bought gold \"like it was rice\", the Bell Reef tide station closed a month later. \"I don't know why. I only fix engines.\"",
      truth: { order: "true", vault: "true", both: "true" }, reliability: 0.6,
      relatedEvent: null, affected: "pier", effect: "mystery", expires: "06:00"
    },
    r_dex: {
      topic: "mystery", source: "dex", origin: "metro",
      note: "Frostline courier runs have tripled this week. Sealed cases, \"heavy for their size\", always to Pier 9, never back out.",
      truth: { order: "true", vault: "true", both: "true" }, reliability: 0.7,
      relatedEvent: null, affected: "pier", effect: "mystery", expires: "06:00"
    },
    r_thirty: {
      topic: "mystery", source: "teo", origin: "bar",
      note: "The Frostline order is for thirty kilos. \"You know how much gold goes in a cold-room sensor? Two grams.\"",
      truth: { order: "true", vault: "true", both: "true" }, reliability: 0.9,
      relatedEvent: "frostline_order", affected: "pier", effect: "mystery", expires: "06:00"
    },
    r_desk_open: {
      topic: "frostline", source: "mei", origin: "bar",
      note: "\"Half the Basin's walked to Pier 9 with their grandmother's earrings. Frostline's desk opened at one.\"",
      truth: { order: "true", both: "true" }, reliability: 0.9,
      relatedEvent: "frostline_order", affected: "pier", effect: "demand", expires: "06:00"
    },
    r_glut: {
      topic: "salvage", source: "mei", origin: "bar",
      note: "Three people tried to sell her the same kind of bar tonight. \"Nobody's buying. Everybody's selling.\"",
      truth: { vault: "true" }, reliability: 0.9,
      relatedEvent: "vault_salvage", affected: "bar", effect: "supply", expires: "06:00"
    }
  };

  // The notebook's "People": impressions, never numbers. Shown once you have met someone (flag
  // met_<id>) or heard something from them; every impression whose condition holds is listed.
  var people = {
    mei:    [ { text: "Auntie Mei. Runs Kurage 33 and the brass scale behind the counter. Hears everything first, and tells it bigger." },
              { if: { rel: { mei: 2 } }, text: "She has started putting your bowl down before you order." } ],
    teo:    [ { text: "Teo. Co-op dispatcher. She routes the couriers, so the couriers' news routes through her. Says less than she knows." },
              { if: { rel: { teo: 1 } }, text: "She took the headset off one ear for you." },
              { if: { rel: { teo: 2 } }, text: "She told you a number she didn't have to." } ],
    hollis: [ { text: "Hollis, a salvage diver off the Long Patience. Loud when he's winning, louder when he isn't." } ],
    oduya:  [ { text: "Oduya, the broker at the Landing 3 exchange hatch. Never takes his gloves off. Buys low for a living." } ],
    priya:  [ { text: "Priya Holm, the night clerk at Landing 3. Logs every hull in the Basin. Times, not faces." } ],
    matte:  [ { text: "Matte Ruud, night watch at Frostline's gate. Notices everything, repeats almost nothing." } ],
    lam:    [ { text: "Old Lam, retired tug engineer. Knows what the sea does to metal, and what Frostline did last time." } ],
    dex:    [ { text: "Dex Amani, a co-op rider waiting for the last train. Carries Frostline's sealed cases for a living." } ]
  };

  var things = { "gold-board": "Mei's gold board", "booth": "Exchange hatch", "timetable-board": "Priya's log", "boarding-lights": "The tarp", "vending": "Soy-milk stall" };

  /* ---- arrival text ------------------------------------------------------------ */
  var scenes = {
    bar: {
      first: [
        "You wake in the Tern's wheelhouse with rain drumming on the roof and the engine ticking as it cools. Kurage 33's lanterns lie on the black water like dropped coins.",
        "Under the awning Auntie Mei is skimming the stock pot. Teo sits on the corner stool with her headset on, saying \"copy\" to somebody who isn't here.",
        "On the quay, beside the stools, Mei's gold board: two numbers in chalk, what she'll sell you a gram for and what she'll give you for one. She rubs them out and writes them again whenever the harbour changes its mind.",
        { notice: "You have a little gold, a few hundred credits, and most of a tank. Nobody is going to tell you what to do with them." }
      ],
      again: [
        { if: { maxClock: "01:20" }, text: "Kurage 33 again: broth, chilli oil, rain on the awning. Teo is still on her corner stool, still on the headset." },
        { if: { minClock: "01:20" }, text: "Kurage 33 again: broth, chilli oil, rain on the awning. Teo's stool is empty, her headset cord coiled on the counter." },
        { if: { minClock: "00:45", maxClock: "01:40" }, text: "A salvage diver sits by the jellyfish tank in a drysuit peeled to the waist, eating like the sea owes him money." },
        "Mei glances at her gold board before she glances at you."
      ]
    },
    landing: {
      first: [
        { if: { maxClock: "00:20" }, text: "Landing 3 is five bulbs on a wire and Priya's booth. The salvage berth beside it is empty; a rope trails into the water as if somebody left in a hurry." },
        { if: { minClock: "00:20" }, text: "The salvage boat Long Patience is tied up at Landing 3, still streaming seawater. Divers in drysuits stand around a tarp under the boarding lights, and the lamp over the exchange hatch is on." },
        "The exchange hatch is a steel window beside the booth. The broker behind it, Oduya, wears his gloves indoors and chalks his prices on the steel."
      ],
      again: [
        { if: { maxClock: "00:20" }, text: "Landing 3. The salvage berth is still empty. Priya is still doing her crossword." },
        { if: { minClock: "00:20" }, text: "Landing 3. The Long Patience drips at the salvage berth; the tarp under the boarding lights is still the most interesting thing in the Basin." },
        "Oduya's gloves rest on the sill of the hatch, waiting for somebody's gold."
      ]
    },
    metro: {
      first: [
        "Under the Line 9 viaduct the lanterns swing in the wind off the water. The night shift waits for the last train: a rider on the bench with a co-op bag, Old Lam by the edge of the quay with his feet over the water.",
        "A stall under the stairs sells hot soy milk in paper cups. There's no scale here; nobody on this quay has anything to sell but time."
      ],
      again: [
        { if: { maxClock: "01:40" }, text: "The Metro Quay. The last train hasn't gone yet; the rider is still on the bench." },
        { if: { minClock: "01:40" }, text: "The Metro Quay. The terminus is dark; the last train has gone, and the rider with it." },
        "Old Lam hasn't moved."
      ]
    },
    pier: {
      first: [
        "Pier 9 comes up white and humming. The floodlight makes the rain look like static. Matte Ruud stands at the gate in a Frostline parka.",
        { if: { truth: ["order", "both"], maxClock: "01:00" }, text: "The dock office window is lit. A hand-lettered card is taped inside it: BUYING DESK · 01:00 · 24K ASSAYED ONLY." },
        { if: { truth: ["order", "both"], minClock: "01:00" }, text: "The dock office window is open, and a queue stands in the rain in front of it. A hand-lettered card: BUYING DESK · 24K ASSAYED ONLY. Frostline is paying." },
        { if: { truth: ["vault"] }, text: "The dock office is dark. A card in the window has been turned face down." }
      ],
      again: [
        { if: { truth: ["order", "both"], maxClock: "01:00" }, text: "Pier 9. The dock office window is lit; the card still says one o'clock." },
        { if: { truth: ["order", "both"], minClock: "01:00" }, text: "Pier 9. The queue at the dock office window is longer than it was. Nobody in it is talking." },
        { if: { truth: ["vault"] }, text: "Pier 9. The dock office is still dark. Matte is still at the gate." },
        { if: { minClock: "01:30" }, text: "Teo is here, hood up, watching the dock office as if it owes her a courier fee." }
      ]
    }
  };

  /* ---- actions, by place --------------------------------------------------------- */
  var actions = {
    bar: [
      {
        id: "bar_noodles", thing: "mei", kind: "order", sitting: "noodles", label: "Order a thirty-three", cost: 14, minutes: 15,
        sets: ["ate"], rel: { mei: 1 },
        lines: [
          { if: { notFlag: ["ate"] }, lines: [
            { who: "mei", text: "Which number?" },
            { who: "mei", text: "Thirty-three. You look like a thirty-three." },
            "Pork-bone broth, a slick of chilli oil, an egg cut so the yolk just holds. Mei sets it down without asking how you are; the bowl is how she asks."
          ] },
          { if: { flag: ["ate"] }, text: "Another thirty-three. Mei doesn't ask. The bowl arrives with the egg cut the way you like it, which you didn't know she'd noticed." }
        ]
      },
      {
        id: "bar_tea", thing: "tank", kind: "order", sitting: "tea", label: "Milk tea, and stay a while", cost: 6, minutes: 20,
        sets: ["sat"], rel: { mei: 1 },
        lines: [
          { if: { notFlag: ["sat"] }, text: "Milk tea in a glass too hot to hold. You take the stool by the jellyfish tank and let the rain decide how long you stay." },
          { if: { flag: ["sat"] }, text: "Another milk tea. The stool by the tank still has the shape of you in it." }
        ]
      },
      {
        id: "bar_teo_tea", thing: "teo-figure", kind: "order", sitting: "teo_tea", label: "Buy Teo a milk tea", cost: 6, minutes: 5, once: true,
        when: { maxClock: "01:20" }, rel: { teo: 1 }, sets: ["met_teo"],
        lines: [ "You put a milk tea at Teo's elbow. She looks at it, then at you, and takes the headset off one ear." ]
      },
      {
        id: "bar_mei_talk", kind: "talk", label: "Talk to Mei", minutes: 0, sets: ["met_mei"],
        lines: [
          { if: { notFlag: ["ate", "sat"] }, lines: [
            { who: "mei", text: "Eat first. Talk after. House rule." },
            "She taps the menu board with her ladle, then the gold board, as if they were the same kind of list."
          ] },
          { if: { flag: ["ate"], notFlag: ["sat"] }, who: "mei", text: "You want more than soup, order tea. Gossip's thirsty work." },
          { if: { flag: ["sat"] }, lines: [
            { who: "mei", text: "Everybody's got a reason gold goes up and a reason it goes down. Tonight they've all got both." }
          ] }
        ]
      },
      {
        id: "bar_teo_hello", kind: "talk", label: "Say hello to Teo", minutes: 0, once: true,
        when: { maxClock: "01:20", notFlag: ["met_teo"] }, sets: ["met_teo"],
        lines: [
          { who: "teo", text: "Skipper. Give me a minute. Four riders in the rain and one of them thinks Landing 3 is a direction." },
          "She doesn't give you the minute."
        ]
      },
      {
        id: "bar_teo_why", kind: "talk", label: "Ask Teo what Frostline wants it for", minutes: 0,
        when: { heard: ["r_frostline"], maxClock: "01:20", notFlag: ["teo_why_deep"], notHeard: ["r_thirty"] },
        sets: ["teo_why_asked"],
        lines: [
          { if: { relBelow: { teo: 2 }, notFlag: ["teo_why_asked"] }, lines: [
            { who: "teo", text: "Sensors. Cold rooms. That's what the purchase courier said, and he gets paid not to wonder." },
            "She puts the headset back on both ears."
          ] },
          { if: { relBelow: { teo: 2 }, flag: ["teo_why_asked"] }, text: "Teo doesn't answer the same question twice. Not for a milk tea, anyway." },
          { if: { rel: { teo: 2 } }, lines: [
            "Teo looks at the rain for a while before she answers.",
            { who: "teo", text: "Thirty kilos, the order says. You know how much gold goes in a cold-room sensor? Two grams." },
            { who: "teo", text: "Somebody's building something that isn't a cold room. Don't put that on the wire." }
          ] }
        ],
        hearsWhen: [ { if: { rel: { teo: 2 } }, hears: ["r_thirty"] } ]
      },
      {
        id: "bar_tell_teo", kind: "talk", label: "Tell Teo what you've seen tonight", minutes: 0, once: true,
        when: { maxClock: "01:20", heardAny: ["r_seen_gilt", "r_seen_bars", "r_seen_twelve", "r_matte_lit", "r_matte_dark"] },
        rel: { teo: 1 }, sets: ["met_teo"],
        lines: [
          { if: { heardAny: ["r_matte_dark"] }, lines: [
            { who: "teo", text: "Dark." },
            "A long silence, with rain in it.",
            { who: "teo", text: "Then somebody's been sending my couriers after an order that doesn't exist." },
            "She looks at you differently now, the way you look at a tally that finally adds up."
          ] },
          { if: { heardAny: ["r_matte_lit"] }, lines: [
            { who: "teo", text: "Lit, is it." },
            "She writes something on the back of her hand.",
            { who: "teo", text: "You're useful, skipper. Don't let it go to your head." }
          ] },
          { if: { heardAny: ["r_seen_gilt", "r_seen_bars", "r_seen_twelve"], notHeard: ["r_matte_lit", "r_matte_dark"] }, lines: [
            { who: "teo", text: "Salvage is salvage. Comes up, goes down, the gulls get some. Frostline's different." },
            "But she listens to all of it, and she doesn't put the headset back on until you've finished."
          ] }
        ]
      },
      {
        id: "bar_hollis", kind: "talk", label: "Ask the diver by the tank about the vault", minutes: 0, once: true,
        when: { minClock: "00:45", maxClock: "01:40" }, sets: ["met_hollis"],
        lines: [
          { if: { flag: ["met_hollis"] }, text: "The diver raises his bowl at you. \"Ferry. You again.\"" },
          { if: { truth: ["order"] }, lines: [
            { who: "hollis", text: "Vault. Ha. Display trays. Gilt on lead, mostly. A whole night's diving and maybe four hundred grams of the real thing." },
            { who: "hollis", text: "Broker at Landing 3 paid us like it was bars, mind. He'll find out when somebody scratches one." }
          ] },
          { if: { truth: ["vault"] }, lines: [
            { who: "hollis", text: "Forty-one bars. Harbour Savings stamp, pre-flood, every one." },
            { who: "hollis", text: "We're going back down at dawn for the rest. Tell your friends. No, don't." }
          ] },
          { if: { truth: ["both"] }, lines: [
            { who: "hollis", text: "Twelve bars. Real. And a lot of plated rubbish round them." },
            { who: "hollis", text: "Broker paid us under the board, and we took it, because who else buys twelve bars at midnight?" }
          ] }
        ],
        hearsWhen: [
          { if: { truth: ["order"] }, hears: ["r_gilt"] },
          { if: { truth: ["vault"] }, hears: ["r_bars"] },
          { if: { truth: ["both"] }, hears: ["r_twelve"] }
        ]
      }
    ],

    landing: [
      {
        id: "landing_priya", thing: "timetable-board", kind: "talk", label: "Ask Priya about the salvage boat", minutes: 0, once: true, sets: ["met_priya"],
        lines: [
          { if: { maxClock: "00:20" }, lines: [
            { who: "priya", text: "Long Patience. Logged out 20:04, out by the breakwater. Due back a quarter past twelve. They're always late." }
          ] },
          { if: { minClock: "00:20" }, lines: [
            { who: "priya", text: "Long Patience. Logged in 00:21. Six crew, one winch, a great deal of shouting." }
          ] },
          { who: "priya", text: "Three Frostline engineers came off the 22:10 with hard cases. Went back on the 23:30. Lighter, by the way they carried them." },
          { who: "priya", text: "I do times, not faces." }
        ],
        hears: ["r_priya_eng"],
        hearsWhen: [ { if: { maxClock: "00:20" }, hears: ["r_boat"] } ]
      },
      {
        id: "landing_tarp", thing: "boarding-lights", kind: "search", label: "Look at what the divers brought up", minutes: 10, once: true,
        when: { minClock: "00:20" },
        lines: [
          { if: { truth: ["order"] }, text: "Coins, display trays, a bank's brass nameplate, all laid out on a tarp under the boarding lights. You turn a coin over. The edge is grey where the gilt has worn through to whatever's underneath. There are a few small bars. Not many." },
          { if: { truth: ["vault"] }, text: "Bars. Stacked on a tarp under the boarding lights like bricks for a wall, each one stamped HARBOUR SAVINGS and beaded with seawater. A diver counts them out loud and keeps losing his place." },
          { if: { truth: ["both"] }, text: "A dozen bars on a tarp under the boarding lights, real enough to make the divers stand differently around them, and a heap of plated trays beside them. Oduya is buying everything: the bars at a fair price, the rest at none." }
        ],
        hearsWhen: [
          { if: { truth: ["order"] }, hears: ["r_seen_gilt"] },
          { if: { truth: ["vault"] }, hears: ["r_seen_bars"] },
          { if: { truth: ["both"] }, hears: ["r_seen_twelve"] }
        ]
      },
      {
        id: "landing_hollis", kind: "talk", label: "Talk to the diver at the hatch", minutes: 0, once: true,
        when: { minClock: "00:20", maxClock: "00:40", notFlag: ["met_hollis"] }, sets: ["met_hollis"],
        lines: [
          "A diver in a drysuit is counting credits at the hatch with wet fingers. He calls himself Hollis, as if you'd asked.",
          { if: { truth: ["order"] }, lines: [
            { who: "hollis", text: "Don't believe what they're saying at Kurage. Vault. It's display trays. Gilt on lead, mostly." },
            { who: "hollis", text: "Four hundred grams of real, maybe. Oduya paid us like it was bars. Don't tell him." }
          ] },
          { if: { truth: ["vault"] }, lines: [
            { who: "hollis", text: "Forty-one bars, ferry. Forty-one. Harbour Savings stamp." },
            { who: "hollis", text: "And we haven't been in the back room yet. Back down at dawn." }
          ] },
          { if: { truth: ["both"] }, lines: [
            { who: "hollis", text: "Twelve bars. Real. The rest is plated junk." },
            { who: "hollis", text: "Oduya's paying under the board. We're taking it. Who else is buying at midnight?" }
          ] },
          "He goes off towards the east quay and the smell of broth."
        ],
        hearsWhen: [
          { if: { truth: ["order"] }, hears: ["r_gilt"] },
          { if: { truth: ["vault"] }, hears: ["r_bars"] },
          { if: { truth: ["both"] }, hears: ["r_twelve"] }
        ]
      },
      {
        id: "landing_broker", kind: "talk", label: "Ask the broker what he's paying for", minutes: 0, once: true, sets: ["met_oduya"],
        lines: [
          "Oduya takes off one glove to shake your hand, then puts it back on to talk.",
          { who: "oduya", text: "Everything, friend. Coins, chains, teeth. By tomorrow there'll be so much salvage gold in this Basin the gulls will wear it." },
          { who: "oduya", text: "Sell to me tonight, while I'm feeling generous." },
          "He smiles the way the pump's meter does."
        ],
        hears: ["r_oduya"]
      },
      {
        id: "landing_tea", thing: "shelter", kind: "order", sitting: "tea", label: "Barley tea from Priya's flask", cost: 2, minutes: 10,
        lines: [ "Priya pours you a paper cup of barley tea without looking up from her crossword. You drink it in the shelter, out of the rain, with the landing's noise around you." ]
      },
      {
        id: "landing_refuel", kind: "system", label: "Refuel the Tern (fill the tank)", cost: 30, minutes: 20,
        when: { fuelBelow: 6 },
        effects: { refuel: true },
        lines: [ "The pump at Landing 3 is slow and its meter lies, but it fills. Priya takes your credits without counting them; she counts later.", { notice: "Tank full." } ]
      }
    ],

    metro: [
      {
        id: "metro_lam", thing: "lam", kind: "talk", label: "Sit with Old Lam by the water", minutes: 0, once: true, sets: ["met_lam"],
        lines: [
          "Old Lam doesn't look up. He's watching a lantern jelly turn slowly under the quay.",
          { who: "lam", text: "Everything that matters under the water has gold on its contacts. Salt eats copper in a season. Gold, it never eats." },
          { who: "lam", text: "So the gold goes into the drones and the sensors and the old radios, and the old radios go into the sea, and the divers bring the gold back up. Round and round. Like the jellies." },
          { who: "lam", text: "Last time Frostline bought gold like it was rice, the tide station on Bell Reef closed a month later. I don't know why. I only fix engines." }
        ],
        hears: ["r_lam"]
      },
      {
        id: "metro_dex", thing: "dex", kind: "talk", label: "Talk to the rider on the bench", minutes: 0, once: true,
        when: { maxClock: "01:40" }, sets: ["met_dex"],
        lines: [
          { who: "dex", text: "Frostline? I carry for them three nights a week now. Used to be one." },
          { who: "dex", text: "Sealed cases. Heavy for their size. Always to Pier 9, never back out. I don't open them. I've got a kid." }
        ],
        hears: ["r_dex"]
      },
      {
        id: "metro_soymilk", thing: "vending", kind: "order", sitting: "tea", label: "Hot soy milk from the stall under the stairs", cost: 3, minutes: 10,
        lines: [ "Hot soy milk in a paper cup, sweet enough to count as dinner. You drink it on the stairs under the viaduct while the rain drips through the rails." ]
      }
    ],

    pier: [
      {
        id: "pier_matte", thing: "matte", kind: "talk", label: "Ask Matte about the dock office window", minutes: 0, once: true, sets: ["met_matte"],
        lines: [
          { if: { truth: ["order", "both"], maxClock: "01:00" }, lines: [
            { who: "matte", text: "Garrow's had the desk lit since midnight. Says it opens at one. Twenty-four karat, assayed, and he doesn't ask where it's from." },
            { who: "matte", text: "Don't quote me." }
          ] },
          { if: { truth: ["order", "both"], minClock: "01:00" }, lines: [
            { who: "matte", text: "Garrow had the desk lit from midnight and opened it at one on the dot. Twenty-four karat, assayed, and he doesn't ask where it's from." },
            { who: "matte", text: "He's been told to buy until four. Don't quote me." }
          ] },
          { if: { truth: ["vault"] }, lines: [
            { who: "matte", text: "Desk was lit last night. Tonight Garrow came down at eleven, turned the card over and went home." },
            { who: "matte", text: "Nobody tells the gate why. Don't quote me." }
          ] }
        ],
        hearsWhen: [
          { if: { truth: ["order", "both"] }, hears: ["r_matte_lit"] },
          { if: { truth: ["vault"] }, hears: ["r_matte_dark"] }
        ]
      },
      {
        id: "pier_queue", kind: "search", label: "Watch the queue at the desk", minutes: 5, once: true,
        when: { happened: ["frostline_order"] },
        lines: [ "A queue fifty long in the rain: dockworkers turning rings on their fingers, a grandmother with a chain folded in a handkerchief, two men with a strongbox between them and nothing to say to each other. At the window a Frostline clerk weighs, writes, pays. Nobody leaves the queue." ]
      },
      {
        id: "pier_teo", kind: "talk", label: "Talk to Teo", minutes: 0, once: true,
        when: { minClock: "01:30" }, sets: ["met_teo"],
        lines: [
          { if: { truth: ["order", "both"] }, lines: [
            { who: "teo", text: "Look at them. Every sock in the Basin, emptied onto one counter." },
            { who: "teo", text: "Thirty kilos is a lot of socks, skipper." }
          ] },
          { if: { truth: ["vault"] }, lines: [
            { who: "teo", text: "Came to see for myself. Dark." },
            { who: "teo", text: "Somebody owes my couriers a week of runs. Somebody always does." }
          ] }
        ]
      }
    ]
  };

  /* ---- sitting down ---------------------------------------------------------------- */
  // After an order with `sitting`, the first conversation here whose `via` holds the order and whose
  // `when` holds is played once. If none, an ambience line. Order matters: earlier entries win.
  var conversations = [
    {
      id: "cv_teo_frostline", at: "bar", via: ["tea", "teo_tea"],
      when: { maxClock: "01:20", notHeard: ["r_frostline"] }, sets: ["met_teo"],
      lines: [
        { if: { notFlag: ["met_teo"] }, text: "Teo slides along a stool to get out of the drip from the awning. Now she's next to you." },
        { who: "teo", text: "Skipper. Still keeping your savings in a sock, or did you get smart?" },
        { who: "teo", text: "Frostline's looking for clean twenty-four karat. Quietly. Somebody up there needs a lot of it." },
        { who: "teo", text: "Don't ask how I know. I route the couriers; couriers talk." }
      ],
      hears: ["r_frostline"]
    },
    {
      id: "cv_mei_vault", at: "bar", via: ["noodles", "tea"],
      when: { maxClock: "01:40", notHeard: ["r_vault"] }, sets: ["met_mei"],
      lines: [
        "Mei leans on the counter across from you, the ladle still in her hand.",
        { who: "mei", text: "Salvage boys from Landing 3 were in at nine for bao. Loud. They've found the old Harbour Savings vault, off the breakwater." },
        { who: "mei", text: "Gold bars. A whole vault, they say." },
        "She says \"a whole vault\" the way she says \"best laksa in the Basin\", which is about everything she sells."
      ],
      hears: ["r_vault"]
    },
    {
      id: "cv_teo_desk", at: "bar", via: ["tea", "teo_tea"],
      when: { maxClock: "00:30", heard: ["r_frostline"], rel: { teo: 1 }, notHeard: ["r_desk"] },
      lines: [
        "Teo drinks half the milk tea in one go, like medicine.",
        { who: "teo", text: "Desk on Pier 9 opens at one. They'll pay over the board for stamped twenty-four." },
        { who: "teo", text: "That's all you get for six credits." }
      ],
      hears: ["r_desk"]
    },
    {
      id: "cv_teo_call", at: "bar", via: ["tea", "teo_tea"],
      when: { minClock: "00:30", maxClock: "01:20", heard: ["r_frostline"], rel: { teo: 1 }, notFlag: ["teo_call"] }, sets: ["teo_call"],
      lines: [
        { if: { truth: ["vault"] }, lines: [
          "Teo listens to her headset for a long time. \"Copy,\" she says. Then, to you, quieter:",
          { who: "teo", text: "Forget the desk. Order's pulled. Somebody upstairs changed their mind at eleven and nobody told the couriers." }
        ] },
        { if: { truth: ["order", "both"] }, lines: [
          "Teo listens to her headset, says \"copy\", and turns the volume down.",
          { who: "teo", text: "Desk's lit. One o'clock." },
          "She says it to nobody in particular, which is how she says things she means you to hear."
        ] }
      ],
      hearsWhen: [
        { if: { truth: ["vault"] }, hears: ["r_pulled"] },
        { if: { truth: ["order", "both"] }, hears: ["r_desk_lit"] }
      ]
    },
    {
      // she took the call while you were a stranger; a milk tea later and she tells you anyway
      id: "cv_teo_late", at: "bar", via: ["tea", "teo_tea"],
      when: { minClock: "00:30", maxClock: "01:20", flag: ["teo_call"], rel: { teo: 1 }, notHeard: ["r_pulled", "r_desk_lit"] },
      lines: [
        { if: { truth: ["vault"] }, lines: [
          { who: "teo", text: "That call earlier. Forget the desk on Pier 9. Order's pulled, and nobody told the couriers." },
          "She says it into her milk tea, as if the tea had asked."
        ] },
        { if: { truth: ["order", "both"] }, lines: [
          { who: "teo", text: "That call earlier. Desk's lit. One o'clock. You didn't hear it from me." }
        ] }
      ],
      hearsWhen: [
        { if: { truth: ["vault"] }, hears: ["r_pulled"] },
        { if: { truth: ["order", "both"] }, hears: ["r_desk_lit"] }
      ]
    },
    {
      id: "cv_teo_call_cold", at: "bar", via: ["tea"],
      when: { minClock: "00:30", maxClock: "01:20", relBelow: { teo: 1 }, notFlag: ["teo_call"] }, sets: ["teo_call"],
      lines: [ "Teo takes a call. She says \"copy\" twice, writes something on the back of her hand, and doesn't look at you." ]
    },
    {
      id: "cv_mei_engineers", at: "bar", via: ["noodles", "tea"],
      when: { heard: ["r_vault"], rel: { mei: 2 }, notHeard: ["r_engineers"] },
      lines: [
        "Mei wipes the counter in front of you, which is clean.",
        { who: "mei", text: "Three Frostline engineers ate here at ten. Paid cash. Engineers never pay cash." },
        { who: "mei", text: "Asked where they could buy clean twenty-four karat. Not here, I said, I'm a noodle shop. Then I sold them forty grams." },
        { who: "mei", text: "Don't tell the engineers." }
      ],
      hears: ["r_engineers"]
    },
    {
      id: "cv_hollis", at: "bar", via: ["noodles", "tea"],
      when: { minClock: "00:45", maxClock: "01:40", notFlag: ["met_hollis"] }, sets: ["met_hollis"],
      lines: [
        "A salvage diver comes in out of the rain, drysuit peeled to the waist, and takes the stool beside yours because it's the only one without a can on it. He calls himself Hollis, as if you'd asked.",
        { if: { truth: ["order"] }, lines: [
          { who: "hollis", text: "Vault. Ha. Display trays. Gilt on lead, mostly. A whole night's diving for maybe four hundred grams of the real thing." },
          { who: "hollis", text: "Broker at Landing 3 paid us like it was bars, mind. He'll learn." }
        ] },
        { if: { truth: ["vault"] }, lines: [
          "He orders a round for the counter.",
          { who: "hollis", text: "Forty-one bars. Harbour Savings stamp. We're going back down at dawn for the rest." }
        ] },
        { if: { truth: ["both"] }, lines: [
          { who: "hollis", text: "Twelve bars. Real. And a heap of plated rubbish round them." },
          { who: "hollis", text: "Broker paid under the board. We took it. Who else buys twelve bars at midnight?" }
        ] }
      ],
      hearsWhen: [
        { if: { truth: ["order"] }, hears: ["r_gilt"] },
        { if: { truth: ["vault"] }, hears: ["r_bars"] },
        { if: { truth: ["both"] }, hears: ["r_twelve"] }
      ]
    },
    {
      id: "cv_mei_after", at: "bar", via: ["noodles", "tea"],
      when: { minClock: "01:05" },
      lines: [
        { if: { truth: ["order", "both"] }, lines: [
          { who: "mei", text: "Half the Basin's walked to Pier 9 with their grandmother's earrings. Frostline's desk opened at one." },
          "She rubs out a number on the gold board and writes a bigger one."
        ] },
        { if: { truth: ["vault"] }, lines: [
          { who: "mei", text: "Three people tonight tried to sell me the same kind of bar. Nobody's buying. Everybody's selling." },
          "She rubs out a number on the gold board and writes a smaller one."
        ] }
      ],
      hearsWhen: [
        { if: { truth: ["order", "both"] }, hears: ["r_desk_open"] },
        { if: { truth: ["vault"] }, hears: ["r_glut"] }
      ]
    },
    {
      id: "cv_landing_crew", at: "landing", via: ["tea"],
      when: { minClock: "00:20", maxClock: "01:30" },
      lines: [
        { if: { truth: ["order"] }, text: "Two divers argue at the edge of the tarp about whether a tray counts as gold if it's only gold on top. The one who thinks it does is the one Oduya is paying." },
        { if: { truth: ["vault"] }, text: "One of the divers is singing. Another is trying to remember the combination of a lock he hasn't found yet. Oduya keeps paying." },
        { if: { truth: ["both"] }, text: "Two crews argue about Oduya's price, loudly, and take it anyway, quietly." }
      ]
    },
    {
      id: "cv_metro_nurse", at: "metro", via: ["tea"],
      when: { maxClock: "01:40" },
      lines: [
        "A night nurse from the harbour clinic shares the stairs with you and her own cup.",
        { who: "yumi", text: "We had a Frostline man in with burns on his hands tonight. Said he'd been soldering. Nobody solders that much." }
      ]
    }
  ];

  var ambience = [
    { at: "bar", via: ["noodles", "tea", "teo_tea"], text: "The rain finds a new note on the awning. Mei hums along with it, wrong." },
    { at: "bar", via: ["noodles", "tea"], text: "A ferry crew of four comes in dripping, orders four thirty-threes by holding up fingers, and talks about nothing but a cousin's wedding." },
    { at: "bar", via: ["noodles", "tea"], text: "Somebody has left a can on the stool beside yours. Taken. You don't move it." },
    { at: "bar", via: ["noodles", "tea", "teo_tea"], text: "The jellies in the tank turn slowly, as if they're listening for something under the counter." },
    { at: "bar", via: ["noodles", "tea"], text: "A courier eats standing up, checks her wrist, and is gone before the steam has cleared." },
    { at: "landing", via: ["tea"], text: "Priya fills in a crossword clue, rubs it out, and fills it in again with the same word." },
    { at: "landing", via: ["tea"], text: "The boarding lights swing on their wire. Somewhere out past the breakwater a buoy bell rings for nobody." },
    { at: "metro", via: ["tea"], text: "A train comes in empty and goes out empty. The driver waves at Old Lam, who doesn't wave back." },
    { at: "metro", via: ["tea"], text: "The soy milk goes cold faster than it should. The rain on the rails sounds like frying." }
  ];

  var sceneClasses = [
    { class: "teo-gone", when: { minClock: "01:20" } }   // Teo leaves Kurage 33 for Pier 9
  ];

  /* ---- the morning ------------------------------------------------------------------ */
  var ending = {
    kicker: "Harbour wire · 06:00",
    byTruth: {
      order: {
        title: "The Desk on Pier 9",
        wire: [
          "FROSTLINE DESK LIFTS GOLD ACROSS THE BASIN. Frostline's buying desk on Pier 9 paid over the board from one until four. Chalk at Kurage 33 and the Landing 3 hatch followed within the hour.",
          "SALVAGE \"VAULT\" MOSTLY GILT. The Long Patience's haul from the Harbour Savings wreck assays at under a fifth fine. The broker at Landing 3 is said to be reviewing his position."
        ]
      },
      vault: {
        title: "The Vault off the Breakwater",
        wire: [
          "HARBOUR SAVINGS VAULT FOUND. Forty-one bars came ashore at Landing 3 overnight, with more expected at dawn. Gold traded soft across the Basin by two.",
          "FROSTLINE ORDER WITHDRAWN. A purchase order for high-purity gold, rumoured on the quays since Tuesday, was cancelled before its desk opened. The couriers were not told."
        ]
      },
      both: {
        title: "A Night of Two Prices",
        wire: [
          "TWO QUEUES, ONE METAL. Salvage bars sold cheap at the Landing 3 hatch while Frostline's desk paid over the board on Pier 9. Anyone with a boat and a scale could have stood in both queues.",
          "HARBOUR SAVINGS WRECK GIVES UP TWELVE BARS. The rest of the haul is plate, says the assayer."
        ]
      }
    },
    // read with the night's conditions, at the moment you turned in
    closing: [
      { if: { truth: ["order", "both"] }, text: "Frostline declined to say what thirty kilograms of high-purity gold is for. A spokesman mentioned sensors." },
      { if: { truth: ["vault"] }, text: "Nobody at Frostline would say who cancelled the order, or why thirty kilograms was ever asked for." },
      { if: { heardAny: ["r_lam", "r_dex", "r_thirty"] }, text: "You fold the wire and think about two grams to a sensor, and sealed cases that only go one way." }
    ]
  };

  return {
    meta: meta,
    truths: truths,
    market: market,
    events: events,
    characters: characters,
    rumors: rumors,
    people: people,
    things: things,
    scenes: scenes,
    actions: actions,
    conversations: conversations,
    ambience: ambience,
    sceneClasses: sceneClasses,
    ending: ending
  };
})();
