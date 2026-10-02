/* ==========================================================================
   NEON TIDES — story data
   --------------------------------------------------------------------------
   Everything the player reads lives in this file: places, people, clues,
   dialogue, the confrontation and the endings. game.js never contains story
   text; it only decides WHEN to show what is written here.

   Shape of the data
   -----------------
   window.NEON_TIDES = {
     meta:     numbers the game needs (start time, dawn, fuel)
     world:    shared by every case: locations, travel costs, characters,
               the energy drink, shared clues, shared actions, objectives
     variants: the complete cases. One is chosen from the seed. Each
               variant adds its own clues, actions, testimony, confrontation
               responses, final choices and endings.
   }

   Text entries
   ------------
   Anywhere you see `lines: [...]`, each entry may be:
     "plain text"                         narration paragraph
     { who: "teo", text: "..." }          a character speaks
     { notice: "...", tone: "warn" }      a boxed game note (tone: "", "warn", "bad")
     { if: CONDITION, ...any of above }   only shown when the condition holds
     { if: CONDITION, lines: [...] }      a whole block, only when it holds

   CONDITION fields (all optional, all must hold):
     has: ["clueId"]        every listed clue is in the notebook
     hasAny: ["clueId"]     at least one listed clue is in the notebook
     lacks: ["clueId"]      none of the listed clues are in the notebook
     flag: ["name"]         every listed flag is set
     notFlag: ["name"]      none of the listed flags are set
     minClock: "00:55"      the clock is at or past this time
     maxClock: "00:55"      the clock is before this time
     fuelBelow: 6           fuel is lower than this number
     resolved: true|false   whether the case has ended
     ending: "id"           the case ended with this ending
     proven: ["tag"]        every listed proof tag is carried by some clue in the notebook
     unproven: ["tag"]      no clue in the notebook carries any of the listed tags
     motive: true|false     some clue supports one of the explanations on offer
     confronting: true|false   the player is at the confrontation right now

   Actions
   -------
   { id, kind, label, minutes, fuel, once, when, lines, gives, givesWhen, sets, effects, costLabel }
     kind:     "talk" (free), "search", "use", "confront", "system"
     minutes:  clock cost. Talking is free; reading text never costs time.
     once:     true = disappears after it has been used
     when:     a CONDITION for the action to be offered at all
     gives:    clue ids added to the notebook (exact wording preserved)
     givesWhen: [{ if: CONDITION, gives: [...] }] — clues added only if the condition holds then
     sets:     flags to set
     effects:  { fuel: +3, cans: +1, refuel: true, clockTo: "00:55" }

   A variant (a case)
   ------------------
   { id, title, tagline, truth, seeds, clues, scenes, actions, responses, finalChoices, endings,
     and optionally: omit, confrontation, objectives, threads, sceneClasses }
     seeds:        seeds pinned to this case, so they keep naming it however many cases exist
     omit:         ids of shared world actions this case leaves out (a case with its own lie
                   brings its own briefing)
     confrontation: overrides world.confrontation key by key — a different liar, other proof tags
                   in `requires`, another place to confront them (`at`), its own explanations
     objectives:   replaces world.objectives (ordered rules; the first that holds is shown)
     threads:      replaces world.threads (the notebook's open questions)
     sceneClasses: added to world.sceneClasses — classes on <body> that let the picture follow
                   the case (styles.css draws them)
   finalChoices: [{ id, label, lateLabel?, ending }] — lateLabel replaces label after 06:00, for a
                 choice that names the dawn ("until the dawn truck")
   endings:      { id: { title, lines, late } } — lines are entries like any other, so a paragraph
                 that only holds before dawn takes { if: { maxClock: "06:00" }, text: "..." } and can
                 have a late twin; conditions are read at the time the case closed. `late` is one
                 extra line shown after the ending when the case closed at or after 06:00. Avoid
                 fixed clock times ("at ten past one") in endings: the player may close at any hour.
   seeds:        every case pins at least one. Add new cases at the END of `variants`, never in
                 between: unpinned seeds keep their case only while the order holds.
   validateCase() in game.js checks all of it at start-up; the title screen lists any problem.
   ========================================================================== */

window.NEON_TIDES = (function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* META                                                                */
  /* ------------------------------------------------------------------ */
  var meta = {
    title: "Neon Tides",
    version: "3.0.0",
    startClock: "23:40",   // the shift begins here
    dawnClock: "06:00",    // Frostline's truck leaves; endings mention it if you are late
    fuelMax: 6,
    startFuel: 3,          // accepting the job adds a fuel chit (+3)
    startCans: 0           // Mei hands you one can when you accept
  };

  /* ------------------------------------------------------------------ */
  /* WORLD — shared by both cases                                        */
  /* ------------------------------------------------------------------ */
  var world = {

    locations: {
      bar: {
        id: "bar",
        name: "Kurage 33 Noodle",
        tag: "Kurage 33 Noodle",         // label on the harbour picture (keep it short)
        short: "Kurage 33",
        kicker: "East quay",
        title: "Kurage 33 Noodle",
        ferry: { x: 902, y: 604 },       // where the Tern moors in the picture
        approach: "You bring the Tern alongside under the awning. Orange lanterns on black water; the smell of pork-bone broth and chilli oil."
      },
      landing: {
        id: "landing",
        name: "Ferry Landing 3",
        tag: "Ferry Landing 3",
        short: "Landing 3",
        kicker: "West basin",
        title: "Ferry Landing 3",
        ferry: { x: 176, y: 606 },
        approach: "Landing 3's boarding lights swing into view, five warm bulbs on a wire and nobody underneath them."
      },
      metro: {
        id: "metro",
        name: "Metro Quay, Line 9 terminus",
        tag: "Metro Quay · Line 9",
        short: "Metro Quay",
        kicker: "Under the viaduct",
        title: "Metro Quay · Line 9 Terminus",
        ferry: { x: 510, y: 606 },
        // approach may be a list of entries with conditions, like any other lines
        approach: [
          { if: { maxClock: "01:40" }, text: "The viaduct comes up first, then the lanterns under it. A train stands at the terminus with its doors open and nobody getting off." },
          { if: { minClock: "01:40" }, text: "The viaduct comes up first, then the lanterns under it. Above them the terminus is dark; the last train has gone." }
        ]
      },
      pier: {
        id: "pier",
        name: "Frostline Cold Store, Pier 9",
        tag: "Cold Store · Pier 9",
        short: "Pier 9",
        kicker: "North pier",
        title: "Frostline Cold Store · Pier 9",
        ferry: { x: 1278, y: 600 },
        approach: "Pier 9 comes up white and humming. The floodlight makes the rain look like static."
      }
    },

    // Travel costs are symmetric. Kurage 33 sits between the metro quay and the pier.
    travel: [
      { between: ["bar", "landing"],   fuel: 1, minutes: 15 },
      { between: ["bar", "metro"],     fuel: 1, minutes: 10 },
      { between: ["bar", "pier"],      fuel: 1, minutes: 15 },
      { between: ["landing", "metro"], fuel: 1, minutes: 10 },
      { between: ["metro", "pier"],    fuel: 2, minutes: 20 },
      { between: ["landing", "pier"],  fuel: 2, minutes: 25 }
    ],

    characters: {
      teo:   { name: "Teo Lindqvist-Goh", role: "Co-op dispatcher",          color: "#ffb04a", portrait: "assets/portraits/teo.svg" },
      mei:   { name: "Auntie Mei",        role: "Owner, Kurage 33",           color: "#ff7a3d", portrait: "assets/portraits/mei.svg" },
      priya: { name: "Priya Holm",        role: "Night clerk, Landing 3",    color: "#3df5ff", portrait: "assets/portraits/priya.svg" },
      matte: { name: "Matte Ruud",        role: "Night watch, Frostline",    color: "#9b93d6", portrait: "assets/portraits/matte.svg" },
      dex:   { name: "Dex Amani",         role: "Co-op rider",               color: "#ffb04a", portrait: "assets/portraits/dex.svg" },
      yumi:  { name: "Yumi Osei-Tan",     role: "Night nurse, harbour clinic", color: "#2fbfa8", portrait: "assets/portraits/yumi.svg" },
      lam:   { name: "Old Lam",           role: "Retired tug engineer",      color: "#c4b0ff", portrait: "assets/portraits/lam.svg" },
      radio: { name: "Radio",             role: "Channel 9",                 color: "#c9bdd9", portrait: "assets/portraits/radio.svg" }
    },

    // The one energy drink with a mechanical effect.
    drink: {
      name: "Tiger Volt",
      slogan: "Sharp till sunrise.",
      rule: "Drink a can to make your next crossing take no clock time. One can, one use.",
      lines: [
        "The can is cold enough to sting. Lychee, ginger, and something that tastes the way the colour cyan looks. Somewhere between the first swallow and the last, the night gets shorter.",
        { notice: "Tiger Volt armed: your next crossing costs no clock time. Fuel is still spent.", tone: "" }
      ]
    },

    // Recovery route when the tank is empty away from the pump.
    tug: {
      label: "Radio the harbour tug (tow to Landing 3)",
      minutes: 40,
      lines: [
        { who: "radio", text: "Tug Vidar, channel nine. …A ferry. With no fuel. Right. Forty minutes." },
        "Bengt on the tug doesn't ask why. He tows you to Landing 3 in the rain and leaves you at the pump with an empty tank and a favour owed.",
        { notice: "Towed to Landing 3. Refuel here before you leave.", tone: "warn" }
      ]
    },

    refuel: {
      label: "Refuel the Tern (fill the tank)",
      minutes: 20,
      lines: [
        "The pump at Landing 3 is slow and its meter lies, but it fills.",
        { notice: "Tank full.", tone: "" }
      ]
    },

    // "What now?" — the first rule whose condition holds is shown on the dashboard and in the notebook.
    // A case with its own lie brings its own list (variant.objectives).
    objectives: [
      { when: { resolved: true },                       text: "Case closed. Read the notebook, or start a new shift from the menu." },
      { when: { confronting: true },                    text: "Choose what to put on the counter." },
      { when: { notFlag: ["accepted"] },                text: "Hear Teo out at Kurage 33, then accept the job." },
      { when: { proven: ["arrived", "met"], motive: true }, text: "You have enough to put on the counter. Confront Teo at Kurage 33." },
      { when: { proven: ["arrived", "met"] },           text: "Teo closed Ari's run at Pier 9 at 23:05. Find out why she is lying, then go back to Kurage 33." },
      { when: { proven: ["met"] },                      text: "Teo's signature closes Ari's run at Pier 9. Pin Ari to the Basin too — the tally at Landing 3 — and find out why she is lying." },
      { when: { proven: ["arrived"] },                  text: "Ari's pass was scanned at Landing 3 at 22:23. Find out who met them. Closed runs are filed at Pier 9." },
      {                                                  text: "Find out whether Ari reached the Basin. Try Landing 3, the Metro Quay and Pier 9." }
    ],

    // Threads shown in the notebook. `proof` is the tag a clue needs to settle it; a `leads` thread
    // without a proof counts clues for any explanation offered at the confrontation.
    threads: [
      { id: "arrived", question: "Did Ari reach the Basin?",  proof: "arrived" },
      { id: "met",     question: "Did Teo meet Ari tonight?", proof: "met" },
      { id: "why",     question: "Why is Teo lying?",         leads: true }
    ],

    // Classes set on <body> while their condition holds, so the picture follows the night.
    // styles.css draws the difference; variants can add their own (variant.sceneClasses).
    sceneClasses: [
      { class: "after-last-train", when: { minClock: "01:40" } }   // Line 9 stops; Dex has left on it
    ],

    /* ---- shared clues: exact wording is what the notebook shows ---- */
    clues: {
      arrival_tally: {
        title: "Arrival tally, Landing 3",
        text: "22:10 MAINLAND — ARRIVED 22:21 (LATE 11).\nPASSENGERS 4.\nCO-OP PASS SCANNED: BEXELL, A. — 22:23.\nCLERK: P. HOLM.",
        proves: ["arrived"]
      },
      run_sheet: {
        title: "Signed run sheet, Pier 9",
        text: "CO-OP RUN 4471 — SEALED SAMPLE CASE, MAINLAND LAB TO FROSTLINE.\nDELIVERED TO COLD ROOM B 22:58.\nRUN CLOSED 23:05 AT PIER 9 DOCK OFFICE.\nCOURIER: A. Bexell   DISPATCHER: T. Lindqvist-Goh\nREMARK (dispatcher's hand): \"Courier released. Nothing outstanding.\"",
        proves: ["met"]
      },
      truck_schedule: {
        title: "Frostline collection notice",
        text: "DAWN COLLECTION 06:00 — CONTRACT DRIVER.\nLOAD: CRATE 17, CRATE 08, CRATE 23.\nNO LATE LOADS. NO EXCEPTIONS. — GARROW",
        proves: []
      },
      priya_account: {
        title: "Priya on the two figures",
        text: "\"At 22:38 two people walked off toward the east quay under one umbrella. One had a courier jacket. The other had Teo's walk — like the ground owes her money. I do times, not faces.\"",
        proves: []
      },
      yumi_foreman: {
        title: "Yumi on the Frostline man",
        text: "\"A Frostline man came up the metro stairs at quarter past eleven with a phone to his ear, saying 'count them again' — or 'find them again'. I was too tired to care which. He bought two OX-9 from the machine and didn't open either.\"",
        proves: []
      },
      lam_jellies: {
        title: "Old Lam on lantern jellies",
        text: "\"Farmed lantern jellies glow blue and go to aquariums. Wild ones from Bell Reef glow greener and go nowhere — protected since the tide station closed. You can tell them apart if you know how. Frostline knows how.\"",
        proves: []
      }
    },

    /* ---- shared actions, by location ---- */
    actions: {
      bar: [
        {
          id: "bar_accept", kind: "talk", label: "Accept the job", minutes: 0, once: true,
          when: { notFlag: ["accepted"] },
          sets: ["accepted"],
          effects: { fuel: 3, cans: 1 },
          lines: [
            { who: "teo", text: "Landing 3. The metro quay. Pier 9. Wherever you'd look for someone who isn't here. Bring me something I can put in a report and I'll tell the office we looked." },
            "She slides a fuel chit across the counter without looking at it.",
            { who: "teo", text: "Three units on the co-op account. Don't waste it. The dawn truck leaves at six and Frostline stops answering after that." },
            "Mei sets a can beside the chit. TIGER VOLT, it says, in letters made of lightning. SHARP TILL SUNRISE.",
            { who: "mei", text: "On the house. Drink it when you need the hour back. One can. I'm not a charity." },
            { notice: "Fuel chit: +3 fuel. Tiger Volt: +1 can — drink it to make your next crossing take no clock time.", tone: "" }
          ]
        },
        {
          id: "bar_ask_job", kind: "talk", label: "Ask Teo what she actually wants", minutes: 0, once: true,
          when: { notFlag: ["accepted"] },
          lines: [
            { who: "teo", text: "I want to tell the office that somebody with a boat looked, so they stop calling me. That's what I want." },
            { who: "teo", text: "Ari never got off in the Basin. You'll go, you'll find nothing, and I'll write it down. Everyone sleeps." },
            { who: "mei", text: "Nobody sleeps. Thirty-three's coming." }
          ]
        },
        {
          id: "bar_report", kind: "talk", label: "Tell Teo what you have so far", minutes: 0,
          when: { flag: ["accepted"], resolved: false },
          lines: [
            { if: { lacks: ["arrival_tally", "run_sheet"] }, who: "teo", text: "Nothing yet? Then you're standing in the wrong place, skipper." },
            { if: { has: ["arrival_tally"], lacks: ["run_sheet"] }, who: "teo", text: "A pass got scanned at Landing 3. Passes get scanned. It doesn't put anyone at my counter, or anywhere near me." },
            { if: { has: ["run_sheet"] }, lines: [
              "Teo glances at the run sheet, then back at the radio.",
              { who: "teo", text: "Runs get closed over the radio every night of the week. You want to accuse me of something, do it properly. Put it on the counter." }
            ] },
            { if: { has: ["arrival_tally"], lacks: ["run_sheet"] }, notice: "Teo's answer is a dodge. Something at Pier 9 might pin her down.", tone: "" }
          ]
        }
      ],
      landing: [
        {
          id: "landing_ask_priya", kind: "talk", label: "Ask Priya about the 22:10", minutes: 0, once: true,
          lines: [
            { who: "priya", text: "Eleven minutes late. Four off. One of them ran, which people do when they think the co-op is waiting." },
            { who: "priya", text: "I don't do faces. I do times. The tally's on the board if you want it in writing — everything's on the board." },
            "She goes back to the crossword. Seven down is giving her trouble."
          ]
        },
        {
          id: "landing_read_board", kind: "search", label: "Read the tally on the timetable board", minutes: 10, once: true,
          gives: ["arrival_tally"],
          lines: [
            "Behind the timetable glass, tonight's tally scrolls in Priya's square capitals across the LED board. You read it twice.",
            { who: "priya", text: "You can photograph it. Everyone does." }
          ]
        },
        {
          id: "landing_ask_teo", kind: "talk", label: "Ask Priya whether she saw Teo tonight", minutes: 0, once: true,
          when: { has: ["arrival_tally"] },
          gives: ["priya_account"],
          lines: [
            { who: "priya", text: "Teo? At 22:38 two people walked off toward the east quay under one umbrella. One had a courier jacket. The other had Teo's walk — like the ground owes her money." },
            { who: "priya", text: "I do times, not faces. Don't quote me on the walk." }
          ]
        },
        {
          id: "landing_wait", kind: "system", label: "Wait for the 00:40 to sail", minutes: 0, once: true,
          when: { has: ["arrival_tally"], maxClock: "00:55" },
          effects: { clockTo: "00:55" },
          costLabel: "until 00:55",
          lines: [
            "You sit in the shelter where the light is broken and listen to the rain change key.",
            "At 00:40 the mainland ferry backs off the pontoon eleven minutes late, like everything tonight. Priya writes on the board before the wake has settled.",
            { notice: "The clock has moved to 00:55. The departure tally can be read now.", tone: "" }
          ]
        },
        {
          id: "landing_refuel", kind: "system", label: "Refuel the Tern (fill the tank)", minutes: 20,
          when: { fuelBelow: 6 },
          effects: { refuel: true },
          lines: [
            "The pump at Landing 3 is slow and its meter lies, but it fills.",
            { notice: "Tank full.", tone: "" }
          ]
        }
      ],
      metro: [
        {
          id: "metro_talk_yumi", kind: "talk", label: "Talk to the nurse by the vending machine", minutes: 0, once: true,
          gives: ["yumi_foreman"],
          lines: [
            { who: "yumi", text: "Night shift at the harbour clinic. I've stitched three Frostline hands this month; the cold makes people careless with knives." },
            "She turns the can in her fingers so the tiger on it catches the lantern light.",
            { who: "yumi", text: "You're asking about tonight? A Frostline man came up the metro stairs at quarter past eleven with a phone to his ear, saying 'count them again' — or 'find them again'. I was too tired to care which. He bought two OX-9 from the machine and didn't open either." }
          ]
        },
        {
          id: "metro_talk_lam", kind: "talk", label: "Sit with the old man by the water", minutes: 0, once: true,
          gives: ["lam_jellies"],
          lines: [
            "Old Lam doesn't look up from the water. Under it, a lantern jelly pulses cyan and drifts toward the pilings.",
            { who: "lam", text: "Forty years on the tugs. Now I watch the jellies for free. Farmed lantern jellies glow blue and go to aquariums. Wild ones from Bell Reef glow greener and go nowhere — protected since the tide station closed." },
            { who: "lam", text: "You can tell them apart if you know how. Frostline knows how." }
          ]
        },
        {
          id: "metro_vending", kind: "search", label: "Work the vending machine", minutes: 5, once: true,
          effects: { cans: 1 },
          lines: [
            "You feed the machine a coin. It thinks about it, the way it thinks about everyone's coin.",
            "You put your shoulder into the side panel where the paint is worn, the way the whole night shift does, and a Tiger Volt drops into the tray.",
            { notice: "+1 Tiger Volt. Drink it to make a crossing take no clock time.", tone: "" }
          ]
        }
      ],
      pier: [
        {
          id: "pier_ask_matte", kind: "talk", label: "Ask Matte about tonight's deliveries", minutes: 0, once: true,
          sets: ["matte_talked"],
          lines: [
            { who: "matte", text: "Nothing came through this gate after ten. Frostline wants a sample case for the dawn truck; it isn't here; that's your co-op's problem." },
            "He drinks from the thermos. His breath hangs in the floodlight.",
            { who: "matte", text: "Garrow's been on the phone twice tonight. Don't quote me. Don't quote me on anything, actually." }
          ]
        },
        {
          id: "pier_dock_office", kind: "search", label: "Check the dock office window", minutes: 10, once: true,
          gives: ["run_sheet", "truck_schedule"],
          lines: [
            "The dock office is locked, but the outbound tray sits on the window ledge under the light where anyone could read it. Runs closed tonight: one.",
            "Cold Room B, 22:58. Run closed 23:05. Two signatures. One of them is Teo's.",
            "Pinned above the tray, Frostline's collection notice for the dawn truck."
          ]
        }
      ]
    },

    /* ---- the confrontation: Teo's lie, shared by every case that doesn't bring its own ---- */
    confrontation: {
      at: "bar",                                   // where the liar is confronted
      actionLabel: "Put your evidence on the counter",
      submitLabel: "Put it on the counter",
      accuseLabel: "Make the accusation",
      stepBackLabel: "Step back from the counter",
      counterLabel: "on the counter",              // "2 / 3 on the counter"
      busyLabel: "at the counter",                 // what the destination chips say while you're here
      stageLabels: { select: "The counter · evidence", explain: "The counter · explanation", choice: "The counter · decision" },
      supportPrompt: "…and the one clue that supports it:",
      maxEvidence: 3,
      requires: ["arrived", "met"],                // shown together, these break the lie
      intro: [
        "You put your notebook on the counter between the chilli-oil pot and Teo's cold milk tea. Mei turns the burner down without being asked.",
        { who: "teo", text: "Go on, then. You get three things. I've got a radio to answer." }
      ],
      selectPrompt: "Pick up to three pieces of evidence to put on the counter. To break the lie, you need to show that Ari arrived and that Teo met them.",
      challenge: {
        nothing: [
          { who: "teo", text: "You've brought me a weather report. Show me one thing that puts Ari on this quay." }
        ],
        // Some but not all of `requires` shown: the rebuttal for the first required tag still missing.
        missing: {
          met: [
            { who: "teo", text: "A pass got scanned at Landing 3. Passes get scanned. It doesn't put anyone at my counter, or anywhere near me." },
            { notice: "Ari arrived — proven. Now prove that Teo met them.", tone: "" }
          ],
          arrived: [
            { who: "teo", text: "That's my signature on a form I sign twenty times a night. Runs get closed over the radio. It says I closed a run. It doesn't say I stood next to anybody." },
            { who: "teo", text: "Put Ari in the Basin first." },
            { notice: "Teo met Ari — nearly proven. You still need to show Ari physically arrived.", tone: "" }
          ]
        },
        success: [
          "Teo looks at the tally, then at the run sheet, then at the clock over the shelf. She takes the headset off and sets it on the counter, which you have never seen her do.",
          { who: "teo", text: "All right. I met them. Pier 9, five past eleven, two bowls of ramen going cold in a bag." },
          { who: "teo", text: "Now you tell me why I'd lie about that, skipper — and you tell me what you've got that says so." }
        ]
      },
      explainPrompt: "Choose the explanation, and the one clue that supports it.",
      explanations: [
        { id: "protect", label: "You hid Ari. They found something wrong with Crate 17, Frostline wanted them gone, so you got them out and said they never came.", proof: "motive_protect" },
        { id: "sale",    label: "You and Ari sold something out of Crate 17. The meeting was a handover, and 'never arrived' keeps everyone away from the pier.", proof: "motive_sale" },
        { id: "debt",    label: "Ari owed money, and you sent them to work it off on a boat that doesn't ask questions. 'Never arrived' keeps anyone from looking for that boat.", proof: "motive_debt" },
        { id: "harm",    label: "Ari threatened to report you for something, and you made sure they never left the pier.", proof: "motive_harm" }
      ],
      noProof: [
        { who: "teo", text: "That doesn't say what you want it to say. Look at your notebook again." }
      ],
      choicePrompt: "Teo waits. Mei ladles two bowls. What do you do with what you know?"
    }
  };

  /* ------------------------------------------------------------------ */
  /* Shared scene text (both cases open the same way)                    */
  /* ------------------------------------------------------------------ */
  var barFirst = [
    "Kurage 33 is the only lit thing on the east quay: cyan tube letters, an orange neon jellyfish pulsing beside them, lanterns dripping under the awning. Behind the counter Auntie Mei skims the pork-bone broth without looking at it.",
    "On the corner stool, Teo Lindqvist-Goh has her headset half on and a milk tea she isn't drinking. Her dispatch bag is zipped shut for once.",
    { who: "teo", text: "Skipper. Sit. No — don't sit, you'll want to be moving." },
    { who: "teo", text: "Ari Bexell, co-op courier, was on the 22:10 from the mainland with a sealed sample case for Frostline's dawn truck. The mainland says they boarded. I say they never got off in the Basin." },
    { who: "teo", text: "Doesn't matter what I say. The office wants it looked at tonight, and you're the only hull still moving." },
    { who: "mei", text: "Which number?" },
    "She doesn't wait for an answer.",
    { who: "mei", text: "Thirty-three. You look like a thirty-three." }
  ];
  var barAgainShared = [
    { if: { resolved: false, has: ["arrival_tally"], notFlag: ["confronted"] }, lines: [
      "Teo is outside under the awning, arguing quietly with her radio. Her dispatch bag sits open on the corner stool, next to a can that means the seat is taken.",
      "Mei watches you notice it and says nothing, which is a kind of permission."
    ] },
    { if: { resolved: false, lacks: ["arrival_tally"] }, lines: [
      "Kurage 33, again. The broth hasn't stopped. Teo's radio mutters on Frostline's channel and she answers it in single words."
    ] },
    { if: { resolved: false, has: ["arrival_tally"], flag: ["confronted"] }, lines: [
      "Teo has put the headset back on. Every so often the radio pulls her out under the awning; the bag stays on the stool. Neither of you mentions the counter."
    ] }
  ];
  var landingScene = {
    first: [
      "Landing 3 is a shelter, a booth and a string of boarding lights swinging in the wind. Nobody waits. The 22:10's wake is long gone.",
      "In the booth, Priya Holm has a crossword and a radiator turned up until the window smells of dust."
    ],
    again: [
      "The shelter's fluorescent tube buzzes. Priya doesn't look up.",
      { if: { minClock: "00:55" }, text: "The 00:40 has gone. The pontoon is still rocking from it." }
    ]
  };
  var metroScene = {
    first: [
      "Under the Line 9 viaduct the quay is lit by paper lanterns and a vending machine the colour of a bruise. The night shift waits here for nothing in particular: the last train, the first ferry, the end of the rain.",
      { if: { maxClock: "01:40" }, text: "A rider in a co-op jacket sits on a bench with a thermal bag and a can. A nurse in scrubs leans on the machine with a Tiger Volt. An old man on an upturned crate watches the water like it owes him money." },
      { if: { minClock: "01:40" }, text: "The platform above is dark; the last train has gone and taken the rider with it. A nurse in scrubs leans on the machine with a Tiger Volt. An old man on an upturned crate watches the water like it owes him money." }
    ],
    again: [
      "Lanterns, rain, the hum of the vending machine.",
      { if: { maxClock: "01:40" }, text: "Overhead a train sighs at the buffers. Dex is still on the bench, phone in hand, watching the departures strip." },
      { if: { minClock: "01:40" }, text: "Overhead the platform is dark. The bench where the rider sat is empty. LAST TRAIN 01:40, says the strip, and then nothing." }
    ]
  };
  var pierScene = {
    first: [
      "Pier 9 smells of diesel and freezer burn. The refrigeration units on the roof hum a note you feel in your teeth.",
      "Door B stands a hand's width open, spilling cold light across the concrete. Matte Ruud, night watch, stands by the chain-link gate with a thermos and the expression of a man who has been asked too many questions tonight."
    ],
    again: [
      "Matte hasn't moved. The fan on the roof turns. Door B still leaks light onto the quay."
    ]
  };

  /* ------------------------------------------------------------------ */
  /* VARIANT A — THE KIND LIE                                            */
  /* Teo hid Ari after Ari discovered protected wild jellyfish in Crate 17 */
  /* ------------------------------------------------------------------ */
  var kindLie = {
    id: "kind-lie",
    title: "The Kind Lie",
    tagline: "A dispatcher, a courier, and two bowls of ramen going cold.",
    truth: "protect",
    seeds: ["high-tide"],              // pinned: this seed always opens this case, however many cases exist
    sceneClasses: [
      { class: "teo-gone", when: { ending: "by_the_book" } }   // "Teo's stool is empty."
    ],

    clues: {
      note_timetable: {
        title: "Folded note behind the timetable",
        text: "T —\nI've seen inside 17. It isn't what the paper says.\nDon't put any of this on the radio.\nI'll wait at the shelter where the light's broken.\n— A",
        proves: ["motive_protect"]
      },
      departure_tally: {
        title: "Departure tally, Landing 3",
        text: "00:40 TO MAINLAND — DEPARTED 00:52.\nPASSENGERS 2.\nCO-OP PASS SCANNED: BEXELL, A.\nFARE CHARGED TO: DISPATCH ACCOUNT (LINDQVIST-GOH).\nCLERK: P. HOLM.",
        proves: ["motive_protect"]
      },
      crate17_tags: {
        title: "Crate 17 tank tags",
        text: "FROSTLINE MANIFEST: CRATE 17 — LANTERN JELLIES, FARMED, 6 TANKS, 40 KG.\nInner tank tags, half scraped off:\nBELL REEF TIDE STATION · WILD STOCK · NO TAKE · PROTECTED",
        proves: ["motive_protect"]
      },
      matte_threat: {
        title: "Matte on the foreman",
        text: "\"Garrow came through at half eleven asking if the courier was still on the pier. He asked it the way you ask if a dog is still loose. I said I hadn't seen anyone. I'd like that to stay true.\"",
        proves: ["motive_protect"]
      },
      dispatch_bag: {
        title: "Inside the dispatch bag",
        text: "A mainland ferry timetable, 00:40 circled twice.\nA spare co-op pass lanyard, name tag torn off.\nA receipt from Kurage 33: 2 × NO. 33 RAMEN, EXTRA CHILLI OIL, TAKE AWAY — 22:50.",
        proves: ["motive_protect"]
      },
      dex_message: {
        title: "Dex's rider-group message",
        text: "RIDER GROUP — 23:12 — A. BEXELL:\n\"Frostline saw me look. Getting out tonight. T is handling it. Delete this.\"\n(Dex did not delete it.)",
        proves: ["motive_protect"]
      },
      mei_bowls: {
        title: "Mei on the late bowls",
        text: "\"Teo took two number thirty-threes to go at ten to eleven. Extra chilli oil, both. Teo never eats ramen — she says it's soup pretending. She carried them like medicine.\"",
        proves: []
      }
    },

    scenes: {
      bar: {
        first: barFirst,
        again: barAgainShared.concat([
          { if: { ending: "two_bowls" }, lines: ["The bar is warm and nobody talks about Ari. On the third stool, a can nobody moves."] },
          { if: { ending: "cold_light" }, lines: ["Mei has pinned a chit to the wire behind the counter with your boat's name on it. You don't ask what it says."] },
          { if: { ending: "by_the_book" }, lines: ["Teo's stool is empty. Mei serves you anyway, and puts the chilli oil where you can reach it."] }
        ])
      },
      landing: landingScene,
      metro: metroScene,
      pier: {
        first: pierScene.first,
        again: pierScene.again.concat([
          { if: { has: ["crate17_tags"] }, text: "Crate 17 sits under the floodlight, breathing cold. You know what's in it now." }
        ])
      }
    },

    actions: {
      bar: [
        {
          id: "bar_ask_ari", kind: "talk", label: "Ask Teo about Ari", minutes: 0, once: true,
          when: { flag: ["accepted"], resolved: false },
          lines: [
            { who: "teo", text: "Ari Bexell. Twenty-six. Good on a boat, bad at sitting still. Two years with the co-op." },
            { who: "teo", text: "Used to work the Bell Reef tide station before Frostline bought the lease and shut it. Never quite got over it. Talks about the reef like other people talk about a person." },
            { who: "mei", text: "Says thank you to the bowl. Not many do." }
          ]
        },
        {
          id: "bar_talk_mei", kind: "talk", label: "Talk to Mei", minutes: 0,
          when: { resolved: false },
          lines: [
            { if: { lacks: ["arrival_tally"] }, lines: [
              { who: "mei", text: "Ari? Third stool, number thirty-three, extra chilli oil. Says thank you to the bowl. That's all a noodle cook knows." },
              { who: "mei", text: "The cans on the stools — that's a seat taken. Night-shift rule. Don't move someone's can." }
            ] },
            { if: { has: ["arrival_tally"], lacks: ["mei_bowls"] }, lines: [
              "Mei wipes the counter that is already clean.",
              { who: "mei", text: "Teo took two number thirty-threes to go at ten to eleven. Extra chilli oil, both. Teo never eats ramen — she says it's soup pretending. She carried them like medicine." },
              { who: "mei", text: "I'm not telling you anything. I'm telling you what I sold." }
            ] },
            { if: { has: ["mei_bowls"] }, lines: [
              { who: "mei", text: "Eat first. Talk after. I've said what I sold." }
            ] }
          ],
          givesWhen: [ { if: { has: ["arrival_tally"] }, gives: ["mei_bowls"] } ]
        },
        {
          id: "bar_look", kind: "search", label: "Look around the bar", minutes: 10, once: true,
          when: { flag: ["accepted"], resolved: false },
          lines: [
            "Melamine bowls stacked by colour. Red chopsticks in a tin, bamboo steamers breathing on the counter, a waving cat with a chipped ear. On the wire behind the counter, the tabs: Teo's is two milk teas, paid Thursdays.",
            "Above the counter, tonight's chits in order: thirty-three, thirty-three, five, twelve — and one at 22:50 for two number thirty-threes, extra chilli oil, take away.",
            "Under the counter, a case of Tiger Volt and a case of OX-9, the orange one, for the hours nobody counts."
          ]
        },
        {
          id: "bar_bag", kind: "search", label: "Look in the dispatch bag while Teo is outside", minutes: 5, once: true,
          when: { has: ["arrival_tally"], resolved: false },
          gives: ["dispatch_bag"],
          lines: [
            "You keep one eye on the awning. The bag holds a radio charger, a run book, and three things that don't belong to a dispatcher who thinks her courier never arrived.",
            { who: "mei", text: "I didn't see that. Eat something." }
          ]
        }
      ],
      landing: [
        {
          id: "landing_shelter", kind: "search", label: "Check the shelter", minutes: 10, once: true,
          gives: ["note_timetable"],
          lines: [
            "The shelter's back light is broken; somebody has broken it recently, the glass is still on the bench.",
            "Under the timetable frame, folded small enough to miss, a page torn from a co-op run book."
          ]
        },
        {
          id: "landing_departures", kind: "search", label: "Read the departure tally", minutes: 10, once: true,
          when: { minClock: "00:55" },
          gives: ["departure_tally"],
          lines: [
            "Priya has added the 00:40 to the board without being asked. She turns it so you can read.",
            { who: "priya", text: "Dispatch account. I don't usually see that. Don't usually see anyone pay somebody else's fare at one in the morning, either." }
          ]
        }
      ],
      metro: [
        {
          id: "metro_talk_dex", kind: "talk", label: "Talk to the rider on the bench", minutes: 0, once: true,
          when: { maxClock: "01:40" },
          gives: ["dex_message"],
          lines: [
            { who: "dex", text: "You the ferry? Teo said the ferry might come asking. She didn't say what to tell you, which for Teo is a whole speech." },
            "He looks at the departures strip, then at his phone, then turns the phone so you can read it.",
            { who: "dex", text: "Ari's in my rider group. Was. Is. This came in at twelve past eleven. I was supposed to delete it. I'm bad at being told." },
            { who: "dex", text: "Last train's at one-forty. I'm on it. Whatever you do with that, do it before Frostline reads it over my shoulder." }
          ]
        }
      ],
      pier: [
        {
          id: "pier_cargo", kind: "search", label: "Check the numbered cargo", minutes: 10, once: true,
          gives: ["crate17_tags"],
          lines: [
            "Crate 17 sits under the floodlight, breathing cold. The manifest pocket says farmed. You lift the lid an inch.",
            "Inside, six tanks glow faintly green-cyan, and the tags on the tanks have been scraped — not well enough."
          ]
        },
        {
          id: "pier_press_matte", kind: "talk", label: "Show Matte the run sheet", minutes: 0, once: true,
          when: { has: ["run_sheet"] },
          gives: ["matte_threat"],
          lines: [
            "Matte reads it under the floodlight. His mouth moves on the time.",
            { who: "matte", text: "Five past eleven. Your dispatcher was on my pier and I didn't see it. I've decided I didn't see it." },
            { who: "matte", text: "Garrow came through at half eleven asking if the courier was still on the pier. He asked it the way you ask if a dog is still loose. I said I hadn't seen anyone. I'd like that to stay true." },
            "He hands the sheet back and looks at Door B, not at you."
          ]
        }
      ]
    },

    responses: {
      protect: {
        correct: [
          { if: { has: ["dispatch_bag"] }, who: "teo", text: "You went through my— fine. Yes." },
          { if: { lacks: ["dispatch_bag"] }, who: "teo", text: "…Fine. Yes." },
          "She turns the milk tea a quarter turn on the counter.",
          { who: "teo", text: "Ari opened Crate 17 because the tanks were sweating. Farmed jellies don't come with reef tags. They photographed it. Garrow saw them do it." },
          { who: "teo", text: "So I closed the run so nothing was outstanding, walked Ari to the shelter with the broken light, and bought them a fare out on the dispatch account. Then I told everyone they never arrived — because Frostline doesn't chase people who don't exist." },
          { who: "mei", text: "Eat something before you decide anything." }
        ]
      },
      sale: {
        wrong: [
          { who: "teo", text: "Sold? Nothing on this counter says money moved. You're guessing, and you're guessing ugly." },
          { if: { has: ["departure_tally"] }, who: "teo", text: "You've got the departure tally in your own notebook. I paid their fare out. Nobody sells a thing and then buys the seller a ticket." },
          { notice: "That theory isn't supported by anything you found. Try another explanation.", tone: "warn" }
        ]
      },
      debt: {
        wrong: [
          { who: "teo", text: "Debt? Ari owes Mei for a bowl and nobody else. You're reaching, skipper, and you're reaching past what's in your own notebook." },
          { if: { has: ["departure_tally"] }, who: "teo", text: "I paid their fare out. You don't send somebody off to sea by buying them a ticket home." },
          { notice: "That theory isn't supported by anything you found. Try another explanation.", tone: "warn" }
        ]
      },
      harm: {
        wrong: [
          "Teo goes very still.",
          { who: "teo", text: "You think I— No. Ari is alive, skipper. If you've got a single thing that says otherwise, put it down. You haven't, because it doesn't exist." },
          { notice: "Nothing you found suggests Ari was harmed. Try another explanation.", tone: "warn" }
        ]
      }
    },

    finalChoices: [
      { id: "protect_ari", label: "Keep Ari out of it. Tell the office the trail ends at the landing.", ending: "two_bowls" },
      { id: "report_crate", label: "Report Crate 17 to the harbour authority, but leave Ari and Teo out of the paperwork.", ending: "cold_light" },
      { id: "report_all", label: "Report everything: Teo, Ari, the run sheet and the crate.", ending: "by_the_book" }
    ],

    endings: {
      two_bowls: {
        title: "Two Bowls of Ramen",
        lines: [
          "You radio the co-op office: the courier's pass was scanned at Landing 3 and nothing after that. It is, word for word, true.",
          "Teo puts the headset back on. She doesn't thank you; she pushes the chilli oil an inch closer, which in this bar is the same thing.",
          "Ari's message comes through Mei a week later, on a chit: reef station reopened. wild stock returned. tell the skipper number thirty-three, extra chilli.",
          "Crate 17 goes out on the dawn truck. Somebody else will have to open it."
        ],
        late: "The dawn truck had already gone by the time you radioed. Nobody asked what was in it."
      },
      cold_light: {
        title: "Cold Light",
        lines: [
          // paragraphs that only hold before the dawn truck carry a clock condition; the late line covers after
          { if: { maxClock: "06:00" }, text: "You tie up at Pier 9 with the harbour authority's night inspector, a woman who has clearly done this before. Crate 17 is opened under the floodlight. The tags read what they read." },
          { if: { minClock: "06:00" }, text: "You tie up at Pier 9 with the harbour authority's night inspector, a woman who has clearly done this before. Crate 17's place under the floodlight is empty." },
          "You leave Teo and Ari out of it. The inspector doesn't ask who tipped you off; she writes 'ferry operator, routine' and underlines routine.",
          { if: { maxClock: "06:00" }, text: "Frostline's dawn truck leaves empty. Garrow is not on the pier to see it." },
          "Teo finds out from the radio. A chit reaches the Tern by lunchtime: you didn't have to. you did. — T."
        ],
        late: "By the time the inspector arrives, the truck has gone with Crate 17 on it. The paperwork follows it anyway; it just takes longer, and Garrow gets a head start."
      },
      by_the_book: {
        title: "By the Book",
        lines: [
          "You file everything: the tally, the run sheet, the note, the crate. The co-op suspends Teo pending review. Frostline denies knowledge of any tags.",
          { if: { maxClock: "06:00" }, text: "The harbour authority opens Crate 17 under the floodlight and finds exactly what Ari found." },
          "Ari is located on the mainland and asked to testify. They do. It costs them the co-op job; it gets the reef station's evidence into a courtroom.",
          "Teo still sits on the corner stool when she's allowed back in the harbour. She doesn't speak to you. Mei still serves you, which in this bar is a verdict."
        ],
        late: "The crate has gone by dawn. The case rests on paper and testimony instead of jellyfish, and takes a year longer."
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* VARIANT B — THE COLD SALE                                           */
  /* Teo and Ari sold a tank out of Crate 17 to a private buyer           */
  /* ------------------------------------------------------------------ */
  var coldSale = {
    id: "cold-sale",
    title: "The Cold Sale",
    tagline: "A launch with no lights, a tank the size of a beer keg, and a tab paid in full.",
    truth: "sale",
    seeds: ["bellwater"],
    sceneClasses: [
      { class: "teo-gone", when: { ending: "receipts" } }      // "Teo's stool is empty."
    ],

    clues: {
      buyers_card: {
        title: "Card behind the timetable",
        text: "MERIDIAN PRIVATE AQUARIA\nLive specimen collection · discretion assured\nSlip 4 · 23:30 · cash on handover\nAsk for the dispatcher, not the courier.",
        proves: ["motive_sale"]
      },
      departure_tally_b: {
        title: "Departure tally, Landing 3",
        text: "00:40 TO MAINLAND — DEPARTED 00:52.\nPASSENGERS 1.\nNO CO-OP PASS SCANNED.\nCLERK: P. HOLM.",
        proves: []
      },
      crate17_short: {
        title: "Crate 17 count",
        text: "FROSTLINE MANIFEST: CRATE 17 — LANTERN JELLIES, FARMED, 6 TANKS DECLARED.\nTANKS PRESENT: 5. Slot 3 empty, seal cut clean.\nTEMPERATURE LOG: gap 22:58–23:20, then \"checked — T.L.G.\"",
        proves: ["motive_sale"]
      },
      matte_launch: {
        title: "Matte on the launch",
        text: "\"A launch with its lights off tied up at Slip 4 about half eleven. Two people carried something down the ladder — size of a beer keg, wrapped in a blanket. Frostline doesn't pay me to watch slips. I watched anyway.\"",
        proves: ["motive_sale"]
      },
      envelope: {
        title: "Envelope in the dispatch bag",
        text: "Thick envelope, unsealed. Fish-scale logo.\nOn the flap, in marker: \"T — your half. Don't count it at the counter. — M.P.A.\"",
        proves: ["motive_sale"]
      },
      dex_buyer: {
        title: "Dex on the buyer",
        text: "\"Ari asked me last week who buys live lantern jellies with no paperwork. I said Meridian, Slip 4, cash. I'm not proud of it. Ari said the dispatcher was in — 'T signs, I carry.'\"",
        proves: ["motive_sale"]
      },
      mei_tab: {
        title: "Mei on Teo's tab",
        text: "\"Teo's tab was three months. Tonight she paid it. Cash, from an envelope with a fish on it. I don't ask. I'm telling you because you asked.\"",
        proves: ["motive_sale"]
      }
    },

    scenes: {
      bar: {
        first: barFirst,
        again: barAgainShared.concat([
          { if: { ending: "receipts" }, lines: ["Teo's stool is empty. The tab wire has one fewer chit on it, and Mei has not replaced it."] },
          { if: { ending: "dawn_truck" }, lines: ["Teo's tab is back on the wire. Nobody mentions Slip 4. Your number thirty-three has extra chilli oil."] },
          { if: { ending: "black_water" }, lines: ["Teo nods when you come in. That's all. You find yourself reading the crate numbers on the pier every time you pass."] }
        ])
      },
      landing: landingScene,
      metro: metroScene,
      pier: {
        first: pierScene.first,
        again: pierScene.again.concat([
          { if: { has: ["crate17_short"] }, text: "Crate 17 sits under the floodlight with one slot too many." }
        ])
      }
    },

    actions: {
      bar: [
        {
          id: "bar_ask_ari", kind: "talk", label: "Ask Teo about Ari", minutes: 0, once: true,
          when: { flag: ["accepted"], resolved: false },
          lines: [
            { who: "teo", text: "Ari Bexell. Twenty-six. Good on a boat, bad with money. Two years with the co-op." },
            { who: "teo", text: "Owes the kind of people who don't send reminders. Not my business. I dispatch, I don't lend." },
            { who: "mei", text: "Says thank you to the bowl. Not many do." }
          ]
        },
        {
          id: "bar_talk_mei", kind: "talk", label: "Talk to Mei", minutes: 0,
          when: { resolved: false },
          lines: [
            { if: { lacks: ["arrival_tally"] }, lines: [
              { who: "mei", text: "Ari? Third stool, number thirty-three, extra chilli oil. Says thank you to the bowl. That's all a noodle cook knows." },
              { who: "mei", text: "The cans on the stools — that's a seat taken. Night-shift rule. Don't move someone's can." }
            ] },
            { if: { has: ["arrival_tally"], lacks: ["mei_tab"] }, lines: [
              "Mei looks at the tab wire, then at you.",
              { who: "mei", text: "Teo's tab was three months. Tonight she paid it. Cash, from an envelope with a fish on it." },
              { who: "mei", text: "I don't ask. I'm telling you because you asked." }
            ] },
            { if: { has: ["mei_tab"] }, lines: [
              { who: "mei", text: "Eat first. Talk after. I've said what I was paid." }
            ] }
          ],
          givesWhen: [ { if: { has: ["arrival_tally"] }, gives: ["mei_tab"] } ]
        },
        {
          id: "bar_look", kind: "search", label: "Look around the bar", minutes: 10, once: true,
          when: { flag: ["accepted"], resolved: false },
          lines: [
            "Melamine bowls stacked by colour. Red chopsticks in a tin, bamboo steamers breathing on the counter, a waving cat with a chipped ear. On the wire behind the counter, the tabs: Teo's says three months, underlined twice — and tonight, a thick line through it.",
            "Between the cans on the counter, a matchbook with a fish-scale logo. Nobody smokes in here.",
            "Under the counter, a case of Tiger Volt and a case of OX-9, the orange one, for the hours nobody counts."
          ]
        },
        {
          id: "bar_bag", kind: "search", label: "Look in the dispatch bag while Teo is outside", minutes: 5, once: true,
          when: { has: ["arrival_tally"], resolved: false },
          gives: ["envelope"],
          lines: [
            "You keep one eye on the awning. The bag holds a radio charger, a run book, and an envelope thick enough to be a mistake.",
            { who: "mei", text: "I didn't see that. Eat something." }
          ]
        }
      ],
      landing: [
        {
          id: "landing_shelter", kind: "search", label: "Check the shelter", minutes: 10, once: true,
          gives: ["buyers_card"],
          lines: [
            "The shelter's back light is out. Somebody has been sitting in the dark end; the bench is dry there.",
            "Wedged behind the timetable frame: a business card, thick stock, still dry."
          ]
        },
        {
          id: "landing_departures", kind: "search", label: "Read the departure tally", minutes: 10, once: true,
          when: { minClock: "00:55" },
          gives: ["departure_tally_b"],
          lines: [
            "Priya has added the 00:40 to the board without being asked. She turns it so you can read.",
            { who: "priya", text: "One passenger, a drunk with a bicycle. No pass. Whoever your courier is, they didn't leave by ferry." }
          ]
        }
      ],
      metro: [
        {
          id: "metro_talk_dex", kind: "talk", label: "Talk to the rider on the bench", minutes: 0, once: true,
          when: { maxClock: "01:40" },
          gives: ["dex_buyer"],
          lines: [
            { who: "dex", text: "You the ferry? Teo said the ferry might come asking. She didn't say what to tell you, which for Teo is a whole speech." },
            "He crushes the can slowly, the way people do when they've decided to say something.",
            { who: "dex", text: "Ari asked me last week who buys live lantern jellies with no paperwork. I said Meridian, Slip 4, cash. I'm not proud of it. Ari said the dispatcher was in — 'T signs, I carry.'" },
            { who: "dex", text: "Last train's at one-forty. I'm on it. If you write that down, spell my name wrong." }
          ]
        }
      ],
      pier: [
        {
          id: "pier_cargo", kind: "search", label: "Check the numbered cargo", minutes: 10, once: true,
          gives: ["crate17_short"],
          lines: [
            "Crate 17 sits under the floodlight. The manifest pocket says six tanks. You count five.",
            "The third slot is empty; the seal was cut with something sharp and patient. The temperature log has a gap and a signature you're starting to recognise."
          ]
        },
        {
          id: "pier_press_matte", kind: "talk", label: "Show Matte the run sheet", minutes: 0, once: true,
          when: { has: ["run_sheet"] },
          gives: ["matte_launch"],
          lines: [
            "Matte reads it under the floodlight. His mouth moves on the time.",
            { who: "matte", text: "Two signatures. Fine. Then I'll tell you what I didn't see either." },
            { who: "matte", text: "A launch with its lights off tied up at Slip 4 about half eleven. Two people carried something down the ladder — size of a beer keg, wrapped in a blanket. Frostline doesn't pay me to watch slips. I watched anyway." },
            "He hands the sheet back and screws the cap onto the thermos very carefully."
          ]
        }
      ]
    },

    responses: {
      sale: {
        correct: [
          { if: { has: ["envelope"] }, who: "teo", text: "You've been in my bag." },
          { if: { lacks: ["envelope"] }, who: "teo", text: "You've done your homework." },
          "She says it without heat. Then she laughs once, which is worse.",
          { who: "teo", text: "Meridian pays four months of tabs for one tank of lantern jellies, no questions. Ari knew a man who knew Meridian. I knew the crate. Ari carried, I signed, and the launch left at half eleven with the tank and Ari on it." },
          { who: "teo", text: "'Never arrived' means no courier on the pier when Frostline counts to five. That's all it was ever for." },
          { who: "mei", text: "Three months I said nothing. Tonight I say something. Eat, both of you." }
        ]
      },
      protect: {
        wrong: [
          { who: "teo", text: "Protect them from what? Nothing on this counter says Ari was in any danger. You've built a kind story out of a form and a timetable." },
          { who: "teo", text: "I'd like it to be true. It isn't." },
          { notice: "That theory isn't supported by anything you found. Try another explanation.", tone: "warn" }
        ]
      },
      debt: {
        wrong: [
          { who: "teo", text: "Ari owes. Half the Basin owes. Nothing on this counter says I sent anybody anywhere to pay it off." },
          { if: { has: ["crate17_short"] }, who: "teo", text: "And you've counted that crate yourself. Somebody's debt didn't cut the seal on slot three." },
          { if: { has: ["matte_launch"] }, who: "teo", text: "That launch at Slip 4 took a tank in a blanket. It wasn't hiring." },
          { notice: "That theory isn't supported by anything you found. Try another explanation.", tone: "warn" }
        ]
      },
      harm: {
        wrong: [
          { who: "teo", text: "Ari walked off that pier on their own two feet, skipper. Show me something that says otherwise. You can't. It doesn't exist." },
          { notice: "Nothing you found suggests Ari was harmed. Try another explanation.", tone: "warn" }
        ]
      }
    },

    finalChoices: [
      { id: "expose", label: "Expose the sale. The co-op and the harbour authority get everything by dawn.", ending: "receipts" },
      { id: "ultimatum", label: "Give Teo until the dawn truck to bring the tank back and come clean herself.", lateLabel: "Give Teo the morning to bring the tank back and come clean herself.", ending: "dawn_truck" },
      { id: "walk_away", label: "Say nothing. Take your fuel chit back to the water.", ending: "black_water" }
    ],

    endings: {
      receipts: {
        title: "Receipts",
        lines: [
          "You radio the co-op office and read them the run sheet, the count, the card. Teo listens to you do it. She doesn't interrupt; dispatchers know what a clear channel sounds like.",
          { if: { maxClock: "06:00" }, text: "Frostline counts to five at dawn and, for once, has somebody to blame who isn't the weather." },
          "The co-op suspends Teo. Meridian's launch is never found. Ari is, three weeks later, with the tank sold and the money mostly gone.",
          "Mei pays Teo's tab back into the envelope and hands it to the inspector herself. 'I don't keep money that came out of a fish,' she says."
        ],
        late: "The truck left before the inspector arrived; the count was done on the road. It still came to five."
      },
      dawn_truck: {
        title: "The Dawn Truck",
        lines: [
          { if: { maxClock: "06:00" }, text: "You give her until six. Teo argues for the length of one cigarette she doesn't light, then radios Ari on a channel the co-op doesn't use." },
          { if: { minClock: "06:00" }, text: "It is already past six. Teo argues for the length of one cigarette she doesn't light, then radios Ari on a channel the co-op doesn't use." },
          { if: { maxClock: "06:00" }, text: "At twenty to six a launch with no lights ties up at Slip 4, and a tank the size of a beer keg comes back up the ladder in a blanket. Ari doesn't look at you. Teo signs the temperature log again — a different remark, in different handwriting, that is mostly true." },
          { if: { minClock: "06:00" }, text: "A launch with no lights ties up at Slip 4 in the grey, and a tank the size of a beer keg comes back up the ladder in a blanket. Ari doesn't look at you." },
          { if: { maxClock: "06:00" }, text: "Frostline counts six at dawn. Meridian keeps its deposit and its silence. Teo's tab is unpaid again by Tuesday." },
          "Nobody thanks you. Mei puts extra chilli oil in your number thirty-three, which is not nothing."
        ],
        late: "The tank comes back to a pier with no truck to load it. Frostline will count tomorrow, count wrong, and never know why."
      },
      black_water: {
        title: "Black Water",
        lines: [
          "You close the notebook. Teo watches you do it, and you both understand that this is a transaction too.",
          "Frostline counts five at dawn, blames the mainland, and doubles the padlocks. Ari sends Teo a postcard with no words on it. The tab stays paid.",
          "You run the Tern the way you always have. The jellyfish under the pontoon glow the same as before. You notice you check the crate numbers now, every time, and never say anything."
        ],
        late: "The dawn truck had gone before you closed the notebook. Five tanks' worth of quiet, on the road to the mainland."
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* VARIANT C — THE QUIET DEBT                                          */
  /* Ari owes a lender. Teo found them a berth on a factory trawler that  */
  /* pays the lender straight from the wages and asks no questions.       */
  /* "Never arrived" keeps the harbour police off the outer mole until    */
  /* the trawler sails on the morning tide. Crate 17 is clean this time.  */
  /* ------------------------------------------------------------------ */
  var quietDebt = {
    id: "quiet-debt",
    title: "The Quiet Debt",
    tagline: "A final notice, a trawler taking on ice, and six months of a tab paid in advance.",
    truth: "debt",
    seeds: ["low-water"],
    sceneClasses: [
      // the trawler's masts and work lights over Landing 3's roof, until she sails (every ending has her sail)
      { class: "kittiwake", when: { maxClock: "06:00", resolved: false } }
    ],

    clues: {
      mole_note: {
        title: "Final notice behind the timetable",
        text: "HALDANE MARINE CREDIT — FINAL NOTICE\nDEBTOR: BEXELL, A.   BALANCE: 41,600\nTERMS: PAYMENT IN FULL OR LABOUR ASSIGNMENT.\nOn the back, in pencil:\n\"T — the mate says yes, if you witness the slip.\nOuter mole, 05:40. Six months.\nDon't put it on the radio. — A\"",
        proves: ["motive_debt"]
      },
      departure_tally_c: {
        title: "Departure tally, Landing 3",
        text: "00:40 TO MAINLAND — DEPARTED 00:52.\nPASSENGERS 3.\nNO CO-OP PASS SCANNED.\nCLERK: P. HOLM.",
        proves: []
      },
      crate17_c: {
        title: "Crate 17, by the book",
        text: "FROSTLINE MANIFEST: CRATE 17 — LANTERN JELLIES, FARMED, 6 TANKS, 40 KG.\nTANKS PRESENT: 6. SEALS INTACT.\nTAGS: MAINLAND HATCHERY, LOT 0921.\nTEMPERATURE LOG: unbroken, initialled every hour — M.R.",
        proves: []
      },
      matte_mole: {
        title: "Matte on the courier at the pier end",
        text: "\"After they signed, the courier stood at the end of my pier for a quarter of an hour, looking across at the outer mole. You can see the Kittiwake's work lights from there. They asked me whether the Kittiwake pays her crew or pays their paper. I said the paper. They said good. Don't quote me.\"",
        proves: ["motive_debt"]
      },
      crew_advance: {
        title: "Crew slip in the dispatch bag",
        text: "GREY KITTIWAKE — FACTORY TRAWLER — CREW ADVANCE\nBERTH: DECKHAND. SIX MONTHS, NORTHERN GROUNDS. NO SHORE LEAVE.\nWAGES ASSIGNED TO: HALDANE MARINE CREDIT (ACCT BEXELL)\nSIGNED: A. Bexell     WITNESS: T. Lindqvist-Goh\nREPORT ABOARD: OUTER MOLE, 05:40. SAILS ON THE MORNING TIDE.",
        proves: ["motive_debt"]
      },
      dex_slow_ferry: {
        title: "Dex on Ari's way out",
        text: "\"Ari's been paying Haldane two-thirds of every run since spring. Their mum's in a home on the mainland. Last week they said they'd found a way to pay it all at once: six months on the Kittiwake. I said nobody comes back off that boat the same. They said that's the point.\"",
        proves: ["motive_debt"]
      },
      mei_stool: {
        title: "Mei on the stool kept free",
        text: "\"Teo paid Ari's tab tonight. And the next six months of it, in advance, in that jar. She asked me to keep the third stool. 'They'll want a thirty-three in the spring.' I asked which spring. She didn't say.\"",
        proves: ["motive_debt"]
      },
      lam_kittiwake: {
        title: "Old Lam on the slow ferry",
        text: "\"The Grey Kittiwake's taking on ice at the outer mole. Factory trawler, northern grounds. Six months out, no shore leave, wages paid to whoever holds your paper. On the tugs we called her the slow ferry. She always has room for one more.\"",
        proves: []
      }
    },

    scenes: {
      bar: {
        first: barFirst,
        again: barAgainShared.concat([
          { if: { ending: "slow_ferry" }, lines: ["Teo is on the corner stool with the headset half on. The third stool has a can on it that nobody drinks. Mei moves it an inch every night, so it never looks forgotten."] },
          { if: { ending: "the_paper" }, lines: ["Ari is on the third stool, eating a thirty-three like it might be taken away. They don't look at you. Teo does, once, and goes back to her radio."] },
          { if: { ending: "meis_wire" }, lines: ["A new chit hangs on the wire behind the counter: BEXELL, and a number with too many digits. Somewhere in the back, somebody is washing bowls and singing badly."] }
        ])
      },
      landing: landingScene,
      metro: metroScene,
      pier: {
        first: pierScene.first,
        again: pierScene.again.concat([
          { if: { has: ["crate17_c"] }, text: "Crate 17 sits under the floodlight: six tanks, all present, all boring." },
          { if: { maxClock: "06:00", resolved: false }, text: "Far across the Basin, over Landing 3's roof, the trawler's work lights burn on the outer mole." }
        ])
      }
    },

    actions: {
      bar: [
        {
          id: "bar_ask_ari", kind: "talk", label: "Ask Teo about Ari", minutes: 0, once: true,
          when: { flag: ["accepted"], resolved: false },
          lines: [
            { who: "teo", text: "Ari Bexell. Twenty-six. Good on a boat, good with a load, bad at saying no to anybody who needs something. Two years with the co-op." },
            { who: "teo", text: "Mother's in a care home on the mainland. Ari visits on Sundays and comes back quiet. That's all I know, and it's more than I should." },
            { who: "mei", text: "Says thank you to the bowl. Not many do." }
          ]
        },
        {
          id: "bar_talk_mei", kind: "talk", label: "Talk to Mei", minutes: 0,
          when: { resolved: false },
          lines: [
            { if: { lacks: ["arrival_tally"] }, lines: [
              { who: "mei", text: "Ari? Third stool, number thirty-three, extra chilli oil. Pays on Fridays, even the Fridays they don't eat. That's all a noodle cook knows." },
              { who: "mei", text: "The cans on the stools — that's a seat taken. Night-shift rule. Don't move someone's can." }
            ] },
            { if: { has: ["arrival_tally"], lacks: ["mei_stool"] }, lines: [
              "Mei looks at the third stool, then at the jar by the till.",
              { who: "mei", text: "Teo paid Ari's tab tonight. And the next six months of it, in advance, in that jar. She asked me to keep the third stool. 'They'll want a thirty-three in the spring.'" },
              { who: "mei", text: "I asked which spring. She didn't say. I'm not telling you anything. I'm telling you what's in my jar." }
            ] },
            { if: { has: ["mei_stool"] }, lines: [
              { who: "mei", text: "Eat first. Talk after. The jar stays where it is." }
            ] }
          ],
          givesWhen: [ { if: { has: ["arrival_tally"] }, gives: ["mei_stool"] } ]
        },
        {
          id: "bar_look", kind: "search", label: "Look around the bar", minutes: 10, once: true,
          when: { flag: ["accepted"], resolved: false },
          lines: [
            "Melamine bowls stacked by colour. Red chopsticks in a tin, bamboo steamers breathing on the counter, a waving cat with a chipped ear. On the wire behind the counter, the tabs: Ari's has been paid every Friday for a year, always the same small amount, never quite enough to close it. Tonight it's stamped PAID in Mei's red ink.",
            "By the till, a jam jar stuffed with notes, and a strip of masking tape across the lid: BEXELL — SPRING.",
            "Under the counter, a case of Tiger Volt and a case of OX-9, the orange one, for the hours nobody counts."
          ]
        },
        {
          id: "bar_bag", kind: "search", label: "Look in the dispatch bag while Teo is outside", minutes: 5, once: true,
          when: { has: ["arrival_tally"], resolved: false },
          gives: ["crew_advance"],
          lines: [
            "You keep one eye on the awning. The bag holds a radio charger, a run book, a receipt for two thirty-threes, and a carbon copy of something with a trawler's name printed across the top.",
            { who: "mei", text: "I didn't see that. Eat something." }
          ]
        }
      ],
      landing: [
        {
          id: "landing_shelter", kind: "search", label: "Check the shelter", minutes: 10, once: true,
          gives: ["mole_note"],
          lines: [
            "The shelter's back light is broken. On the bench under it, somebody has left the dry outline of a person who sat there a long time.",
            "Folded behind the timetable frame: a letter on heavy paper with a red stripe across the top. The kind of paper that costs money to send."
          ]
        },
        {
          id: "landing_departures", kind: "search", label: "Read the departure tally", minutes: 10, once: true,
          when: { minClock: "00:55" },
          gives: ["departure_tally_c"],
          lines: [
            "Priya has added the 00:40 to the board without being asked. She turns it so you can read.",
            { who: "priya", text: "Three. Nobody of yours. Whoever you're looking for didn't go home by ferry." }
          ]
        }
      ],
      metro: [
        {
          id: "metro_talk_dex", kind: "talk", label: "Talk to the rider on the bench", minutes: 0, once: true,
          when: { maxClock: "01:40" },
          gives: ["dex_slow_ferry"],
          lines: [
            { who: "dex", text: "You the ferry? Teo said the ferry might come asking. She didn't say what to tell you, which for Teo is a whole speech." },
            "He turns the can round in his hands until the tiger faces him.",
            { who: "dex", text: "Ari's been paying Haldane two-thirds of every run since spring. Their mum's in a home on the mainland. Last week they said they'd found a way to pay it all at once. Six months on the Kittiwake." },
            { who: "dex", text: "I said nobody comes back off that boat the same. They said that's the point. Last train's at one-forty and I'm on it, and I'd like to be wrong about that boat." }
          ]
        },
        {
          id: "metro_ask_lam_boats", kind: "talk", label: "Ask Old Lam about the boats on the mole", minutes: 0, once: true,
          when: { has: ["lam_jellies"], maxClock: "06:00" },
          gives: ["lam_kittiwake"],
          lines: [
            "Old Lam points with his chin at the lights past the breakwater, where something big is taking on ice under work lamps.",
            { who: "lam", text: "The Grey Kittiwake. Factory trawler, northern grounds. Six months out, no shore leave, wages paid to whoever holds your paper." },
            { who: "lam", text: "On the tugs we called her the slow ferry. She always has room for one more." }
          ]
        }
      ],
      pier: [
        {
          id: "pier_cargo", kind: "search", label: "Check the numbered cargo", minutes: 10, once: true,
          gives: ["crate17_c"],
          lines: [
            "Crate 17 sits under the floodlight, breathing cold. You lift the lid an inch, then all the way.",
            "Six tanks, six blue glows, farmed and bored. The seals are whole, and the log is initialled every hour in the same square hand. Whatever happened tonight, it didn't happen in here."
          ]
        },
        {
          id: "pier_press_matte", kind: "talk", label: "Show Matte the run sheet", minutes: 0, once: true,
          when: { has: ["run_sheet"] },
          gives: ["matte_mole"],
          lines: [
            "Matte reads it under the floodlight. His mouth moves on the time.",
            { who: "matte", text: "Five past eleven. Fine. 'Nothing after ten' is what I tell anyone in a co-op jacket; it saves us both a form. I didn't see the signing. I saw after." },
            { who: "matte", text: "After they signed, the courier stood at the end of my pier for a quarter of an hour, looking across at the outer mole. You can see the Kittiwake's work lights from there." },
            { who: "matte", text: "They asked me whether the Kittiwake pays her crew or pays their paper. I said the paper. They said good. Don't quote me." },
            "He hands the sheet back and looks past you, at the lights on the mole."
          ]
        }
      ]
    },

    responses: {
      debt: {
        correct: [
          { if: { has: ["crew_advance"] }, who: "teo", text: "You found the slip." },
          { if: { lacks: ["crew_advance"] }, who: "teo", text: "So. You know." },
          "She says it to the milk tea, not to you.",
          { who: "teo", text: "Haldane Marine Credit. Forty-one thousand and change, for a care home that costs more than a courier earns. Haldane doesn't send reminders; Haldane sends paper, and then a boat." },
          { who: "teo", text: "The Kittiwake's mate owes me for a winter I don't talk about. Six months on the northern grounds, wages straight to the ledger, and Ari comes home owing nobody." },
          { who: "teo", text: "I closed the run so they'd be paid for it. I bought the bowls so they'd eat." },
          { who: "teo", text: "If the co-op logs Ari as arrived and gone, the office files a missing courier by morning, the harbour police walk the mole, and that boat sails without them." },
          { who: "teo", text: "'Never arrived' is a mainland problem. It buys six hours. Six hours was all I needed." },
          { who: "mei", text: "Eat. Both of you. Nobody decides anything hungry." }
        ]
      },
      protect: {
        wrong: [
          { who: "teo", text: "Protect them from what? Frostline doesn't know Ari's name, and doesn't want to." },
          { if: { has: ["crate17_c"] }, who: "teo", text: "You've had the lid off Crate 17 yourself. Six tanks, all farmed, all boring. Nobody chases a courier over boring." },
          { notice: "That theory isn't supported by anything you found. Try another explanation.", tone: "warn" }
        ]
      },
      sale: {
        wrong: [
          { who: "teo", text: "Sold what, and to whom? Nothing's missing off that pier. You're telling me a story from some other night." },
          { if: { has: ["crate17_c"] }, who: "teo", text: "You counted the crate. Six. Count it again if it helps." },
          { notice: "That theory isn't supported by anything you found. Try another explanation.", tone: "warn" }
        ]
      },
      harm: {
        wrong: [
          "Teo looks at you for a long moment, and then, surprisingly, almost smiles.",
          { who: "teo", text: "Ari's alive, skipper. More alive tonight than they've let themselves be in a year. You've got nothing that says otherwise, because there isn't anything." },
          { notice: "Nothing you found suggests Ari was harmed. Try another explanation.", tone: "warn" }
        ]
      }
    },

    finalChoices: [
      { id: "let_sail", label: "Let the Kittiwake sail. Tell the office the trail ends at the landing.", ending: "slow_ferry" },
      { id: "report_paper", label: "Report Haldane's labour contract to the harbour authority.", ending: "the_paper" },
      { id: "mei_wire", label: "Bring Ari off the Kittiwake, and let Mei put the debt on her wire.", ending: "meis_wire" }
    ],

    endings: {
      slow_ferry: {
        title: "The Slow Ferry",
        lines: [
          "You radio the co-op office: the courier's pass was scanned at Landing 3, and nothing after that. It is, word for word, true.",
          { if: { maxClock: "06:00" }, text: "Before dawn you watch from the wheelhouse as a figure with a duffel bag walks the length of the outer mole and goes up the Kittiwake's gangway without looking back. The trawler's work lights swing off the breakwater on the morning tide." },
          "Teo doesn't come in the next night, or the one after. When she does, she orders a thirty-three, doesn't eat it, and leaves the third stool alone.",
          "In April Mei takes a call on the counter radio from the northern grounds, all static and gulls. Somebody asks for a thirty-three to be kept warm for September. Mei writes it on a chit and pins it to the wire beside the jar."
        ],
        late: "By the time you radioed, the Kittiwake had already gone out on the tide. All you decided was what to call it."
      },
      the_paper: {
        title: "Paper",
        lines: [
          "The harbour authority's night inspector reads the crew slip twice under the work lamps on the outer mole. Assigning a debtor's wages to a lender has been illegal in Basin waters since the tide station closed.",
          "Nobody has enforced it in years. She enforces it.",
          { if: { maxClock: "06:00" }, text: "The Kittiwake sails at dawn one deckhand short. The deckhand is on the third stool at Kurage 33, still owing Haldane every coin, and furious with you in a way that keeps them warm." },
          { if: { minClock: "06:00" }, text: "The Kittiwake has already sailed, so the inspector radios the northern grounds for one deckhand." },
          "Haldane's paper is void in the Basin and nowhere else; the mainland will take longer. Teo files the run as delivered and speaks to you only on channel nine for a month. Then one night she orders you a thirty-three without asking which number."
        ],
        late: "It takes a month to bring one deckhand home from the northern grounds. Ari comes back owing less, and liking you less."
      },
      meis_wire: {
        title: "Mei's Wire",
        lines: [
          "Mei hears the whole thing with the ladle in her hand, then writes BEXELL and a number with too many digits on a chit and pins it to the wire. 'Haldane buys paper at thirty on the coin,' she says, 'and sells it at fifty to anybody who asks. A tab is a kind of bank; mine charges dishes.'",
          "Before dawn the jar has Teo's money in it, and Priya's, and Bengt's, and some of yours.",
          { if: { maxClock: "06:00" }, text: "On the last of the dark you run Teo out to the outer mole. Ari comes back down the Kittiwake's gangway with a duffel bag and a face like a closed door, thanks nobody, and gets into the Tern anyway." },
          { if: { minClock: "06:00" }, text: "It is past six. Bengt's tug runs the Kittiwake down past the beacon, and Ari comes down a pilot ladder in the swell with a duffel bag and a face like a closed door." },
          "Ari washes bowls at Kurage 33 three nights a week now. The chit on the wire gets a line through it every Friday. Ari still says thank you to the bowl."
        ],
        late: "Bengt sends Mei the bill for the tug's fuel. She pins it to the wire, under Ari's."
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* VARIANT D — THE EBB                         (a case with its own lie) */
  /* Another night, another liar. Frostline says a boat took Crate 17 off */
  /* Pier 9 and blames the Tern, the only hull moving. Matte Ruud, the    */
  /* night watch, told that story. There was no boat: Matte let the wild   */
  /* jellies go on the ebb himself. You confront him at Pier 9, and the   */
  /* proofs that break his story are different ones.                      */
  /*                                                                      */
  /* Night of the case: 22:21 mainland ferry in · 22:30 the Tern moors at */
  /* Kurage 33 and you fall asleep · 22:40 the ebb turns; tug Vidar goes  */
  /* to stand by on the outer mole · 22:40–22:46 six tanks go down the    */
  /* slip ladder, inside the fence · 22:47 Matte badges out, palm cut ·   */
  /* 22:50 the boat he says he saw · 23:00 Yumi stitches him · 23:10 he   */
  /* sits by Mei's tank · 23:24 badges back in · 23:30 Garrow counts and  */
  /* calls it in · 23:40 Teo knocks.                                      */
  /* ------------------------------------------------------------------ */
  var theEbb = {
    id: "the-ebb",
    title: "The Ebb",
    tagline: "A crate that left by water, a boat nobody else saw, and a night watch with a stitched hand.",
    truth: "release",
    seeds: ["slack-water"],
    // Teo's lie about Ari belongs to the other nights; this one has its own briefing and its own pier.
    omit: ["bar_accept", "bar_ask_job", "bar_report", "landing_ask_priya", "landing_read_board", "landing_ask_teo", "landing_wait", "pier_ask_matte", "pier_dock_office"],
    sceneClasses: [
      { class: "crate17-gone" },                                  // 17 gone; 08 lifted down into its place
      { class: "matte-bandaged" },                                // his right hand in a clinic bandage
      { class: "wild-jelly" },                                    // one green straggler circling under the pilings
      { class: "matte-gone", when: { ending: "night_watch" } }   // the gate stands unwatched
    ],

    confrontation: {
      at: "pier",
      actionLabel: "Put it to Matte under the floodlight",
      submitLabel: "Show Matte",
      busyLabel: "under the floodlight",
      accuseLabel: "Say it",
      stepBackLabel: "Step away from the gate",
      counterLabel: "in your hand",
      stageLabels: { select: "The floodlight · evidence", explain: "The floodlight · explanation", choice: "The floodlight · decision" },
      requires: ["no_boat", "not_at_gate"],
      intro: [
        "You hold the notebook up into the floodlight so Matte can see what's in it. He doesn't take it. He unscrews the cap of the thermos and waits.",
        { who: "matte", text: "Three things, then. Then I walk the fence. It's what they pay me for." }
      ],
      selectPrompt: "Pick up to three pieces of evidence to show Matte. To break his story, you need to show that no boat came alongside, and that he wasn't at the gate when he says he saw one.",
      challenge: {
        nothing: [
          { who: "matte", text: "That's a list of things that happened tonight. None of it is a boat that wasn't there." }
        ],
        missing: {
          not_at_gate: [
            { who: "matte", text: "So nobody saw it. Boats run dark. That's what dark is for. I was at the gate, and I saw it." },
            { notice: "No boat came — proven. Now show where Matte really was at ten to eleven.", tone: "" }
          ],
          no_boat: [
            { who: "matte", text: "So I went for stitches. After. After they'd gone. You think I'd walk off and leave a crate going down my ladder?" },
            { notice: "Matte left the gate — proven. You still need to show that no boat came.", tone: "" }
          ]
        },
        success: [
          "Matte reads what you've shown him, then reads it again, then looks at the bandage on his hand for long enough that the floodlight buzzes twice.",
          { who: "matte", text: "There was no boat." },
          "He says it to the water, not to you, and it comes out easier than he expected.",
          { who: "matte", text: "Go on, then. Tell me why I'd say there was. And show me what makes you think so." }
        ]
      },
      explanations: [
        { id: "release", label: "There was no boat. You opened Crate 17 yourself and let the jellies go on the ebb, then told Garrow somebody stole them.", proof: "motive_release" },
        { id: "theft",   label: "You sold Crate 17, carried it off yourself, and made up a boat to cover the sale.", proof: "motive_theft" },
        { id: "orders",  label: "Garrow had you lose the crate so Frostline could claim the insurance, and a boat nobody saw was your part of it.", proof: "motive_orders" }
      ],
      noProof: [
        { who: "matte", text: "That doesn't say what you want it to say. Read it again. Slowly. I'm not going anywhere." }
      ],
      choicePrompt: "Matte drinks from the thermos at last. Somewhere past the beacon the tide is still going out. What do you do with what you know?"
    },

    objectives: [
      { when: { resolved: true },                               text: "Case closed. Read the notebook, or start a new shift from the menu." },
      { when: { confronting: true },                            text: "Choose what to show Matte." },
      { when: { notFlag: ["accepted"] },                        text: "Hear Teo out under the awning at Kurage 33, then take the job." },
      { when: { proven: ["no_boat", "not_at_gate"], motive: true }, text: "You can break Matte's story. Put it to him under the floodlight at Pier 9." },
      { when: { proven: ["no_boat", "not_at_gate"] },           text: "No boat came, and Matte wasn't at his gate. Find out what really happened to Crate 17, then go back to Pier 9." },
      { when: { proven: ["not_at_gate"] },                      text: "Matte wasn't at his gate when he says he saw the boat. Now prove there was no boat at all — somebody in the Basin watches every hull." },
      { when: { proven: ["no_boat"] },                          text: "No hull was under way at ten to eleven, and the Tern was tied up at Kurage 33. Now find out where Matte really was." },
      {                                                          text: "Prove no boat took Crate 17. Hear Matte's story at Pier 9, and ask the people who watch the water." }
    ],

    threads: [
      { id: "boat", question: "Did a boat come alongside Pier 9?",      proof: "no_boat" },
      { id: "gate", question: "Was Matte at his gate at ten to eleven?", proof: "not_at_gate" },
      { id: "why",  question: "Why is Matte lying?",                     leads: true }
    ],

    clues: {
      matte_story: {
        title: "Matte's account of the boat",
        text: "\"A launch with no lights came alongside at ten to eleven. Two men. They had Crate 17 down the slip ladder before I could get across. I shouted. I was at the gate the whole time.\"",
        proves: []
      },
      movements_log: {
        title: "Basin movements log, Landing 3",
        text: "BASIN MOVEMENTS — RADAR REPEATER, LANDING 3\n22:21 MAINLAND FERRY ALONGSIDE L3\n22:30 TERN MOORED, KURAGE 33\n22:40 TUG VIDAR TO OUTER MOLE (STANDING BY)\n22:00–23:40 NO OTHER HULLS UNDER WAY.\n23:40 TERN UNDER WAY (CO-OP).\nCLERK: P. HOLM",
        proves: ["no_boat"]
      },
      bengt_radio: {
        title: "Bengt on channel nine",
        text: "TUG VIDAR, CHANNEL NINE, ON TEO'S HANDSET:\n\"Launch? No launch. I've sat on the outer mole since twenty to eleven with nothing to do but watch the Basin. Nothing came out past the beacon but the tide.\"",
        proves: ["no_boat"]
      },
      gate_log: {
        title: "Pier 9 gate log",
        text: "PIER 9 GATE LOG — BADGE 0417 (RUUD, M.)\nOUT 22:47\nIN  23:24\nNO OTHER BADGES AFTER 22:00.",
        proves: ["not_at_gate"]
      },
      loss_report: {
        title: "Frostline loss report",
        text: "FROSTLINE LOSS REPORT — CRATE 17\nLANTERN JELLIES, FARMED, 6 TANKS, 40 KG.\nREMOVED BY WATER, APPROX. 22:50.\nWITNESS: M. RUUD (NIGHT WATCH) — 'UNLIT LAUNCH, TWO MEN, SLIP LADDER.'\nVESSEL SUSPECTED: FERRY TERN (ONLY HULL UNDER WAY). — GARROW",
        proves: []
      },
      yumi_stitch: {
        title: "Yumi on the night watch's hand",
        text: "\"I stitched the Frostline night watch at eleven. Up at the clinic, top of the metro stairs. Cut across the palm, salt water in it. He said he caught it on his gate. Gates don't cut like that. Tank seals do.\"",
        proves: ["not_at_gate"]
      },
      crate_slot: {
        title: "The slip ladder",
        text: "SLIP LADDER, PIER 9 —\nCrate 17's pallet, empty, pushed to the edge. Lid bolts undone with a key, not cut.\nSix tank lids stacked by the ladder, wiped dry.\nTags on the lids: BELL REEF TIDE STATION · WILD STOCK · NO TAKE.\nOn the third rung down: a smear of blood, and something faintly green.\nOff the bottom rung, six empty tanks on a line, knocking together in the swell.",
        proves: ["motive_release"]
      },
      gatehouse: {
        title: "In the gatehouse",
        text: "Rubber gauntlets hung over the heater, still wet. Salt water, not rain.\nA Bell Reef tide table, tonight's ebb circled: 22:40.\nA clinic chit: 1 × SUTURE, PALM (R) — 23:00 — Y. OSEI-TAN.",
        proves: ["not_at_gate", "motive_release"]
      },
      lam_ebb: {
        title: "Old Lam on the ebb",
        text: "\"The ebb turned at twenty to eleven. Anything let go off Pier 9 on that ebb rides out past the beacon by midnight and reaches Bell Reef in nine days. The Frostline night watch sat where you're sitting on Sunday and asked me that exact thing. I told him. He wrote it on his hand.\"",
        proves: ["motive_release"]
      },
      dex_green: {
        title: "Dex on the green water",
        text: "\"I came in on the 22:44. From the viaduct you can see clean across the Basin to Pier 9's floodlight. Quarter to eleven, the water under the slip lit up green — not cyan like the bar's tank, green — spreading out on the tide like somebody had poured the reef back in. I wasn't looking for a boat. I was looking at that.\"",
        proves: ["motive_release"]
      },
      mei_tank: {
        title: "Mei on the man at the tank",
        text: "\"Matte came in at ten past eleven. Not a Thursday, so I noticed. Hand in a clinic bandage. Ordered nothing. Sat looking at my tank for ten minutes, then asked if mine were wild. I said they come from a shop on the mainland. He said, 'Good. They shouldn't be in a box either.'\"",
        proves: ["motive_release"]
      }
    },

    scenes: {
      bar: {
        first: [
          "Somebody is knocking on the hull. You come up out of sleep in the Tern's wheelhouse with the chart table printed on your cheek, and the clock on the bulkhead says twenty to twelve.",
          "On the quay under Kurage 33's awning, Teo Lindqvist-Goh has her headset round her neck and her radio in her hand. Behind her the lanterns drip, the orange neon jellyfish pulses beside the cyan letters, and Auntie Mei is pretending not to watch.",
          { who: "teo", text: "Skipper. Up. Frostline's lost a crate, and they've decided you took it." },
          { who: "teo", text: "Crate 17, Pier 9. Matte Ruud says a launch with no lights came alongside at ten to eleven, and two men had it down the slip ladder. Garrow says the only hull that moved in the Basin tonight was the co-op's night ferry. That's you." },
          { who: "teo", text: "He's asked the harbour authority to hold the Tern at dawn. They hold the Tern, the co-op loses its ferry, you lose your licence, and I lose the only skipper who answers at this hour." },
          { who: "mei", text: "You were asleep. I could hear you through the hull. I'll swear to it." },
          { who: "teo", text: "She's the woman who sold you the noodles that put you to sleep. Nobody will believe her. Find me the boat that isn't you." }
        ],
        again: [
          { if: { resolved: false, notFlag: ["accepted"] }, text: "Teo waits on the quay with the radio. Mei keeps a bowl warm on the counter, whether or not you want it." },
          { if: { resolved: false, flag: ["accepted"] }, text: "Kurage 33. Teo has moved inside, to the corner stool, and talks to the co-op office in single words. Mei keeps a bowl warm on the counter, whether or not you want it." },
          { if: { ending: "green_water" }, lines: ["Teo is back on the corner stool with the headset on. Nobody mentions Crate 17. Mei has put a second jellyfish in the tank, blue like the first, and named it something she won't tell you."] },
          { if: { ending: "wild_stock" }, lines: ["The radio behind the counter is full of Frostline: inspectors at the ramp, trucks held, a lease on the reef under review. Mei turns it up when Garrow's name comes on, and down again after."] },
          { if: { ending: "night_watch" }, lines: ["Some nights now, Matte is on the stool nearest the tank, in a co-op jacket that doesn't fit him yet. He nods at you. Mei sets down two thirty-threes without being asked."] }
        ]
      },
      landing: {
        first: [
          "Landing 3 is a shelter, a booth and a string of boarding lights swinging in the wind. Nobody waits.",
          { if: { maxClock: "00:40" }, text: "The mainland ferry sits dark at the pontoon, waiting for the 00:40." },
          { if: { minClock: "00:40" }, text: "The 00:40 has gone; the pontoon is still rocking from it." },
          "In the booth, Priya Holm has a crossword, a radiator turned up until the window smells of dust, and a small green radar screen that sweeps the Basin every four seconds."
        ],
        again: [
          "The shelter's fluorescent tube buzzes. Priya's radar sweeps the Basin and finds one hull moving: yours."
        ]
      },
      metro: metroScene,
      pier: {
        first: [
          "Pier 9 smells of diesel and freezer burn. The refrigeration units on the roof hum a note you feel in your teeth.",
          "Where Crate 17 stood under the floodlight, crate 08 sits on the bare concrete, lifted down off the stack; around it the rain is still darkening the dry outline of a bigger crate. Beside it, a pallet jack with nothing on it.",
          "Matte Ruud, night watch, stands at the chain-link gate with a thermos, and his right hand wrapped in a clinic bandage."
        ],
        again: [
          { if: { resolved: false }, text: "Matte hasn't moved. The fan on the roof turns. The dry outline around crate 08 is getting wet at the edges." },
          { if: { has: ["crate_slot"] }, text: "Under the pilings one green glow is still circling, caught in the eddy, too tired for the tide." },
          { if: { ending: "green_water" }, text: "Matte is at the gate with his thermos. He nods at you, which is new. The slip ladder has a chain across it now." },
          { if: { ending: "wild_stock" }, text: "Matte is at the gate with his thermos. The authority's yellow tape is across the slip ladder, with a notice nobody reads." },
          { if: { ending: "night_watch" }, text: "These days the gate has a new padlock and a new sign: NIGHT WATCH — VACANCY. Nobody is behind it." }
        ]
      }
    },

    actions: {
      bar: [
        {
          id: "ebb_accept", kind: "talk", label: "Take the job", minutes: 0, once: true,
          when: { notFlag: ["accepted"] },
          sets: ["accepted"],
          effects: { fuel: 3, cans: 1 },
          lines: [
            { who: "teo", text: "Pier 9 for the story. Landing 3 for the times. The metro quay for anyone who was looking at the water. Bring me something the authority will read before breakfast." },
            "She slides a fuel chit across the wet rail of the Tern without looking at it.",
            { who: "teo", text: "Three units on the co-op account. Don't waste it. The authority comes for the Tern at six, and the dawn truck leaves with or without Crate 17." },
            "Mei leans out under the awning and sets a can on your deck. TIGER VOLT, it says, in letters made of lightning. SHARP TILL SUNRISE.",
            { who: "mei", text: "You've had your sleep. Have this instead. One can. I'm not a charity." },
            { notice: "Fuel chit: +3 fuel. Tiger Volt: +1 can — drink it to make your next crossing take no clock time.", tone: "" }
          ]
        },
        {
          id: "ebb_ask_teo", kind: "talk", label: "Ask Teo what Frostline is saying", minutes: 0, once: true,
          when: { notFlag: ["accepted"] },
          lines: [
            { who: "teo", text: "Garrow came to count Crate 17 for the dawn truck at half eleven and found 08 on the deck and 17 gone. Matte told him about the launch. Garrow looked at the Basin, saw one boat with its lights on under Mei's awning, and picked up the phone." },
            { who: "teo", text: "I'm not saying Matte's lying. I'm saying Matte doesn't tell stories, and tonight he's told one with two men and a ladder in it." },
            { who: "mei", text: "Thirty-three's going cold." }
          ]
        },
        {
          id: "ebb_radio_bengt", kind: "talk", label: "Ask Teo to raise the tug on her radio", minutes: 0, once: true,
          when: { flag: ["accepted"], resolved: false },
          gives: ["bengt_radio"],
          lines: [
            "Teo turns her radio to channel nine and holds it out so you can both hear.",
            { who: "radio", text: "Tug Vidar. Bengt. …Launch? No launch. I've sat on the outer mole since twenty to eleven with nothing to do but watch the Basin. Nothing came out past the beacon but the tide." },
            { who: "radio", text: "You want it in writing, ask Priya. I want it in writing that I'm cold." },
            { who: "teo", text: "Bengt can see the whole Basin from the mole. Bengt also likes you. Garrow will say both of those things." }
          ]
        },
        {
          id: "ebb_talk_mei", kind: "talk", label: "Talk to Mei", minutes: 0,
          when: { resolved: false },
          lines: [
            { if: { unproven: ["not_at_gate"] }, lines: [
              { who: "mei", text: "You slept through two thirty-threes going cold on the counter. I ate one. The other's yours, whenever you stop running about." },
              { who: "mei", text: "Matte? Thursdays, number twelve, no chilli. Doesn't say much. He's not a man who lies easily, which is why he does it so badly." }
            ] },
            { if: { proven: ["not_at_gate"], lacks: ["mei_tank"] }, lines: [
              "Mei looks at the jellyfish tank, then at you.",
              { who: "mei", text: "Matte came in at ten past eleven. Not a Thursday, so I noticed. Hand in a clinic bandage, ordered nothing, sat looking at my tank for ten minutes." },
              { who: "mei", text: "Then he asked if mine were wild. I said they come from a shop on the mainland. He said, 'Good. They shouldn't be in a box either.'" },
              { who: "mei", text: "I'm not telling you anything. I'm telling you what I heard." }
            ] },
            { if: { has: ["mei_tank"] }, lines: [
              { who: "mei", text: "Eat first. Talk after. I've said what I heard." }
            ] }
          ],
          givesWhen: [ { if: { proven: ["not_at_gate"] }, gives: ["mei_tank"] } ]
        },
        {
          id: "ebb_tank", kind: "search", label: "Look at Mei's jellyfish tank", minutes: 5, once: true,
          when: { flag: ["accepted"], resolved: false },
          lines: [
            "Mei's lantern jellies are the blue of a gas flame turned low, pulsing quick and even, the way farmed ones do. A card taped to the glass says FROM THE MAINLAND · PLEASE DON'T TAP.",
            "At the height of a man sitting on the nearest stool, there's a smudge on the glass where somebody rested their forehead for a while."
          ]
        },
        {
          id: "ebb_report", kind: "talk", label: "Tell Teo what you have so far", minutes: 0,
          when: { flag: ["accepted"], resolved: false },
          lines: [
            { if: { unproven: ["no_boat", "not_at_gate"] }, who: "teo", text: "Nothing yet? Then the authority holds a boat at six, and it's yours." },
            { if: { proven: ["no_boat"], unproven: ["not_at_gate"] }, who: "teo", text: "Nothing under way at ten to eleven, and you tied up under Mei's awning. Good. Garrow will say a launch can slip under a radar. Find me where Matte really was." },
            { if: { proven: ["not_at_gate"], unproven: ["no_boat"] }, who: "teo", text: "So Matte wasn't at his gate. That's Matte's problem. The Tern's problem is a boat. Prove there wasn't one." },
            { if: { proven: ["no_boat", "not_at_gate"] }, lines: [
              { who: "teo", text: "No boat, and Matte off his gate. That's not a theft, skipper. That's a man with a reason." },
              { who: "teo", text: "Go and put it to him. Under his own floodlight, where he can't pretend he didn't hear you." }
            ] }
          ]
        }
      ],
      landing: [
        {
          id: "ebb_ask_priya", kind: "talk", label: "Ask Priya about a launch with no lights", minutes: 0, once: true,
          lines: [
            { who: "priya", text: "A launch. With no lights. At ten to eleven." },
            "She doesn't look up from the crossword. Her pencil fills in a word that might be RADAR.",
            { who: "priya", text: "Boats run dark. Radar doesn't care. I do times, not faces, and I write down every hull that moves in this Basin, because the harbour authority pays me to and because nobody else will. The log's in the booth, if you want it in writing." }
          ]
        },
        {
          id: "ebb_movements", kind: "search", label: "Read the movements log in the booth", minutes: 10, once: true,
          gives: ["movements_log"],
          lines: [
            "Priya turns the log book round on the counter and taps the page with her pencil, once, the way people tap a sum they have checked twice.",
            "The radar repeater sweeps beside it. Green, nothing, green, nothing.",
            { who: "priya", text: "You can photograph it. Everyone does." }
          ]
        }
      ],
      metro: [
        {
          id: "ebb_yumi_hands", kind: "talk", label: "Ask Yumi about the Frostline hands she stitches", minutes: 0, once: true,
          when: { has: ["yumi_foreman"] },
          gives: ["yumi_stitch"],
          lines: [
            "Yumi rolls the cold can across the back of her neck.",
            { who: "yumi", text: "You asked about men on the stairs. You didn't ask about hands." },
            { who: "yumi", text: "I stitched the Frostline night watch at eleven. Up at the clinic, top of the metro stairs. Cut across the palm, salt water in it." },
            { who: "yumi", text: "He said he caught it on his gate. Gates don't cut like that. Tank seals do. I didn't argue. I'm on a twelve-hour shift; I argue with nobody after hour nine." }
          ]
        },
        {
          id: "ebb_lam_tide", kind: "talk", label: "Ask Old Lam about tonight's tide", minutes: 0, once: true,
          when: { has: ["lam_jellies"] },
          gives: ["lam_ebb"],
          lines: [
            "Old Lam looks at the water the way other people look at a clock.",
            { who: "lam", text: "The ebb turned at twenty to eleven. Anything let go off Pier 9 on that ebb rides out past the beacon by midnight and reaches Bell Reef in nine days." },
            { who: "lam", text: "The Frostline night watch sat where you're sitting on Sunday and asked me that exact thing. How long to the reef, on the ebb. I told him. He wrote it on his hand." }
          ]
        },
        {
          id: "ebb_dex", kind: "talk", label: "Talk to the rider on the bench", minutes: 0, once: true,
          when: { maxClock: "01:40" },
          gives: ["dex_green"],
          lines: [
            { who: "dex", text: "You the ferry? Half the quay says you nicked a crate. The other half says you were asleep. I'm in the second half; I've heard you snore." },
            { who: "dex", text: "I came in on the 22:44. From the viaduct you can see clean across the Basin to Pier 9's floodlight. Quarter to eleven, the water under the slip lit up green — not cyan like the bar's tank, green — spreading out on the tide like somebody had poured the reef back in." },
            { who: "dex", text: "I wasn't looking for a boat. I was looking at that. Last train's at one-forty, if you need me to say it to somebody with a badge." }
          ]
        }
      ],
      pier: [
        {
          id: "ebb_matte_story", kind: "talk", label: "Ask Matte what he saw", minutes: 0, once: true,
          sets: ["matte_told"],
          gives: ["matte_story"],
          lines: [
            "Matte tells it to the floodlight, not to you, the way people recite a thing they've practised.",
            { who: "matte", text: "A launch with no lights came alongside at ten to eleven. Two men. They had Crate 17 down the slip ladder before I could get across. I shouted. I was at the gate the whole time." },
            "He drinks from the thermos. The bandaged hand stays wrapped round it, as if the heat helps.",
            { who: "matte", text: "That's what I told Garrow. That's what I'm telling you. Don't quote me." }
          ]
        },
        {
          id: "ebb_dock_office", kind: "search", label: "Check the dock office window", minutes: 10, once: true,
          gives: ["gate_log", "loss_report", "truck_schedule"],
          lines: [
            "The dock office is locked, but the night's paperwork sits on the window ledge under the light, where anyone could read it.",
            "A gate log with one badge on it. Garrow's loss report, still warm from the printer, with your boat's name typed into it. And pinned above them, Frostline's collection notice for the dawn truck."
          ]
        },
        {
          id: "ebb_slip", kind: "search", label: "Look over the slip ladder", minutes: 10, once: true,
          gives: ["crate_slot"],
          lines: [
            "The slip ladder goes down the side of the pier into black water. Crate 17's empty pallet has been pushed right to the edge, as if somebody worked from here.",
            "Six tank lids are stacked beside the ladder, wiped dry and squared off neatly. Somebody tidy did this. You turn the top one over under your torch."
          ]
        },
        {
          id: "ebb_gatehouse", kind: "search", label: "Look in the gatehouse while Matte walks the fence", minutes: 5, once: true,
          when: { flag: ["matte_told"], resolved: false },
          gives: ["gatehouse"],
          lines: [
            "Matte walks the far end of the fence with his torch, the way he does every hour. The gatehouse door is on the latch.",
            "Inside it smells of wet rubber and the heater. You are back on the quay before the torch turns round."
          ]
        }
      ]
    },

    responses: {
      release: {
        correct: [
          "Matte unwinds the end of the bandage and looks at the stitches as if they belong to somebody else.",
          { who: "matte", text: "Lam told me how you tell them apart. Wild ones glow greener and pulse slower. I counted the pulses through the slot in the lid for a week." },
          { who: "matte", text: "Frostline's paper says farmed. The lids say Bell Reef. The ebb turned at twenty to eleven." },
          { who: "matte", text: "I took the bolts out with my own key and put six tanks down that ladder one at a time, and tipped them into the tide. One of the seals opened my hand on the way." },
          { who: "matte", text: "Then I went up to the clinic, and sat with Mei's tank for a bit, and came back, and Garrow came to count. I said a boat. I didn't think about whose boat." },
          { who: "matte", text: "I'm sorry about that part. Only that part." },
          "He puts the cap back on the thermos and holds it in both hands."
        ]
      },
      theft: {
        wrong: [
          { who: "matte", text: "Sold it to who? Six tanks, one good hand, and I leave the lids behind with the reef's name on them? There was no boat. You've just proved it yourself." },
          { notice: "That theory isn't supported by anything you found. Try another explanation.", tone: "warn" }
        ]
      },
      orders: {
        wrong: [
          { who: "matte", text: "Garrow? Garrow can't order a coffee without a form in triplicate. If he wanted a crate lost, he'd lose it on the road, where the insurance pays double. And he'd never have called the harbour authority down on his own pier." },
          { notice: "Nothing you found suggests Garrow knew. Try another explanation.", tone: "warn" }
        ]
      }
    },

    finalChoices: [
      { id: "clear_tern", label: "Clear the Tern with the movements log, and give Garrow nothing else.", ending: "green_water" },
      { id: "report_tags", label: "Report the reef tags on the tank lids to the harbour authority, and leave Matte's name out.", ending: "wild_stock" },
      { id: "matte_tells", label: "Give Matte until the dawn truck to tell Garrow himself.", lateLabel: "Let Matte go up to the office and tell Garrow himself.", ending: "night_watch" }
    ],

    endings: {
      green_water: {
        title: "Green Water",
        lines: [
          "You read Priya's movements log to the harbour authority over channel nine, line by line. The complaint against the Tern is closed by noon: no vessel. Garrow writes 'unknown' in the loss book and has the slip ladder chained.",
          "Matte keeps the gate. He doesn't thank you. He starts initialling the temperature log of every crate twice, in a hand that gets steadier as the weeks go by.",
          "Nine days later, a dive team at Bell Reef logs wild lantern jellies drifting over the reef where none had been seen in years. The report calls it a mystery. Old Lam calls it the ebb.",
          "You sleep in the wheelhouse again the next night. Nobody knocks."
        ],
        late: "At six the authority's launch came alongside the Tern before you had said a word. The log still clears you. It just clears you later, and in an office."
      },
      wild_stock: {
        title: "Wild Stock",
        lines: [
          "The harbour authority's night inspector arrives in a raincoat older than the pier. She photographs the six tank lids under the floodlight, reads the tags twice, and asks Garrow to come down from the office.",
          "Frostline withdraws the complaint against the Tern before breakfast. You can't claim insurance on animals you were never allowed to own, and you can't call a boat a thief when it stole nothing you can admit to having.",
          "The inspector doesn't ask who opened the crate; she writes 'released by persons unknown' without looking at anyone. Matte keeps the gate, keeps not looking at you, and once leaves a thermos of something hot on the Tern's deck without a note.",
          "By spring the tide station on Bell Reef has its lease back."
        ],
        late: "The dawn truck had gone before the inspector came, and the Tern spent the morning held at its moorings. Six lids with reef tags didn't need a truck."
      },
      night_watch: {
        title: "The Night Watch",
        lines: [
          { if: { maxClock: "06:00" }, text: "You give him until six. Matte spends it walking the fence, three times round, then goes up to the office with the bandage still on and tells Garrow everything in the time it takes the kettle to boil." },
          { if: { minClock: "06:00" }, text: "It is already past six. Matte goes up to the office with the bandage still on and tells Garrow everything in the time it takes the kettle to boil." },
          "Garrow sacks him on the spot, then withdraws the complaint against the Tern by noon. A crate of animals Frostline was never allowed to own is not something you report stolen twice.",
          "Teo hears it on the radio and sends Matte a co-op jacket with the next courier. Night runner, Pier 9 to Landing 3, cash on delivery. He's good at it: he doesn't say much, and nothing gets past him.",
          "He eats at Kurage 33 on Thursdays now, on the stool nearest the tank. Mei says he talks to the jellies. Mei says they don't mind."
        ],
        late: "By then the dawn truck had gone with two crates instead of three, and Garrow heard him out with his coat still on. The co-op jacket came anyway. He's growing into it."
      }
    }
  };

  return {
    meta: meta,
    world: world,
    variants: [kindLie, coldSale, quietDebt, theEbb]
  };
})();
