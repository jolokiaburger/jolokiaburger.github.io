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

   Actions
   -------
   { id, kind, label, minutes, fuel, once, when, lines, gives, sets, effects }
     kind:     "talk" (free), "search", "use", "confront", "system"
     minutes:  clock cost. Talking is free; reading text never costs time.
     once:     true = disappears after it has been used
     when:     a CONDITION for the action to be offered at all
     gives:    clue ids added to the notebook (exact wording preserved)
     sets:     flags to set
     effects:  { fuel: +3, cans: +1, refuel: true, clockTo: "00:55" }
   ========================================================================== */

window.NEON_TIDES = (function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* META                                                                */
  /* ------------------------------------------------------------------ */
  var meta = {
    title: "Neon Tides",
    version: "2.2.0",
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
        approach: "The viaduct comes up first, then the lanterns under it. A train stands at the terminus with its doors open and nobody getting off."
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

    // Objective text by stage. game.js decides the stage from what you know.
    objectives: {
      briefing:    "Hear Teo out at Kurage 33, then accept the job.",
      start:       "Find out whether Ari reached the Basin. Try Landing 3, the Metro Quay and Pier 9.",
      arrived:     "Ari's pass was scanned at Landing 3 at 22:23. Find out who met them. Closed runs are filed at Pier 9.",
      met:         "Teo closed Ari's run at Pier 9 at 23:05. Find out why she is lying, then go back to Kurage 33.",
      metOnly:     "Teo's signature closes Ari's run at Pier 9. Pin Ari to the Basin too — the tally at Landing 3 — and find out why she is lying.",
      motive:      "You have enough to put on the counter. Confront Teo at Kurage 33.",
      confronting: "Choose what to put on the counter.",
      resolved:    "Case closed. Read the notebook, or start a new shift from the menu."
    },

    // Threads shown in the notebook. `proof` is the tag a clue needs to settle it.
    threads: [
      { id: "arrived", question: "Did Ari reach the Basin?",  proof: "arrived" },
      { id: "met",     question: "Did Teo meet Ari tonight?", proof: "met" },
      { id: "why",     question: "Why is Teo lying?",         proof: ["motive_protect", "motive_sale"] }
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
        text: "\"Around eleven, two people walked off toward the east quay under one umbrella. One had a courier jacket. The other had Teo's walk — like the ground owes her money. I do times, not faces.\"",
        proves: []
      },
      yumi_foreman: {
        title: "Yumi on the Frostline man",
        text: "\"A Frostline man came up the metro stairs at midnight with a phone to his ear, saying 'count them again' — or 'find them again'. I was too tired to care which. He bought two OX-9 from the machine and didn't open either.\"",
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
            { who: "priya", text: "Teo? Around eleven, two people walked off toward the east quay under one umbrella. One had a courier jacket. The other had Teo's walk — like the ground owes her money." },
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
            { who: "yumi", text: "You're asking about tonight? A Frostline man came up the metro stairs at midnight with a phone to his ear, saying 'count them again' — or 'find them again'. I was too tired to care which. He bought two OX-9 from the machine and didn't open either." }
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

    /* ---- the confrontation: the lie is the same in both cases ---- */
    confrontation: {
      actionLabel: "Put your evidence on the counter",
      maxEvidence: 3,
      intro: [
        "You put your notebook on the counter between the chilli-oil pot and Teo's cold milk tea. Mei turns the burner down without being asked.",
        { who: "teo", text: "Go on, then. You get three things. I've got a radio to answer." }
      ],
      selectPrompt: "Pick up to three pieces of evidence to put on the counter. To break the lie, you need to show that Ari arrived and that Teo met them.",
      challenge: {
        nothing: [
          { who: "teo", text: "You've brought me a weather report. Show me one thing that puts Ari on this quay." }
        ],
        arrivedOnly: [
          { who: "teo", text: "A pass got scanned at Landing 3. Passes get scanned. It doesn't put anyone at my counter, or anywhere near me." },
          { notice: "Ari arrived — proven. Now prove that Teo met them.", tone: "" }
        ],
        metOnly: [
          { who: "teo", text: "That's my signature on a form I sign twenty times a night. Runs get closed over the radio. It says I closed a run. It doesn't say I stood next to anybody." },
          { who: "teo", text: "Put Ari in the Basin first." },
          { notice: "Teo met Ari — nearly proven. You still need to show Ari physically arrived.", tone: "" }
        ],
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
          { who: "teo", text: "You went through my— fine. Yes." },
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
          "You radio the co-op office at ten past one: the courier's pass was scanned at Landing 3 and nothing after that. It is, word for word, true.",
          "Teo puts the headset back on. She doesn't thank you; she pushes the chilli oil an inch closer, which in this bar is the same thing.",
          "Ari's message comes through Mei a week later, on a chit: reef station reopened. wild stock returned. tell the skipper number thirty-three, extra chilli.",
          "Crate 17 goes out on the dawn truck. Somebody else will have to open it."
        ],
        late: "The dawn truck had already gone by the time you radioed. Nobody asked what was in it."
      },
      cold_light: {
        title: "Cold Light",
        lines: [
          "You tie up at Pier 9 with the harbour authority's night inspector, a woman who has clearly done this before. Crate 17 is opened under the floodlight. The tags read what they read.",
          "You leave Teo and Ari out of it. The inspector doesn't ask who tipped you off; she writes 'ferry operator, routine' and underlines routine.",
          "Frostline's dawn truck leaves empty. Garrow is not on the pier to see it.",
          "Teo finds out from the radio. A chit reaches the Tern by lunchtime: you didn't have to. you did. — T."
        ],
        late: "By the time the inspector arrives, the truck has gone with Crate 17 on it. The paperwork follows it anyway; it just takes longer, and Garrow gets a head start."
      },
      by_the_book: {
        title: "By the Book",
        lines: [
          "You file everything: the tally, the run sheet, the note, the crate. The co-op suspends Teo pending review. Frostline denies knowledge of any tags. The harbour authority opens Crate 17 and finds exactly what Ari found.",
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
          { who: "teo", text: "You've been in my bag." },
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
      harm: {
        wrong: [
          { who: "teo", text: "Ari walked off that pier on their own two feet, skipper. Show me something that says otherwise. You can't. It doesn't exist." },
          { notice: "Nothing you found suggests Ari was harmed. Try another explanation.", tone: "warn" }
        ]
      }
    },

    finalChoices: [
      { id: "expose", label: "Expose the sale. The co-op and the harbour authority get everything by dawn.", ending: "receipts" },
      { id: "ultimatum", label: "Give Teo until the dawn truck to bring the tank back and come clean herself.", ending: "dawn_truck" },
      { id: "walk_away", label: "Say nothing. Take your fuel chit back to the water.", ending: "black_water" }
    ],

    endings: {
      receipts: {
        title: "Receipts",
        lines: [
          "You radio the co-op office at twenty past one and read them the run sheet, the count, the card. Teo listens to you do it. She doesn't interrupt; dispatchers know what a clear channel sounds like.",
          "Frostline counts to five at dawn and, for once, has somebody to blame who isn't the weather. The co-op suspends Teo. Meridian's launch is never found. Ari is, three weeks later, with the tank sold and the money mostly gone.",
          "Mei pays Teo's tab back into the envelope and hands it to the inspector herself. 'I don't keep money that came out of a fish,' she says."
        ],
        late: "The truck left before the inspector arrived; the count was done on the road. It still came to five."
      },
      dawn_truck: {
        title: "The Dawn Truck",
        lines: [
          "You give her until six. Teo argues for the length of one cigarette she doesn't light, then radios Ari on a channel the co-op doesn't use.",
          "At twenty to six a launch with no lights ties up at Slip 4. A tank the size of a beer keg comes back up the ladder in a blanket. Ari doesn't look at you. Teo signs the temperature log again — a different remark, in different handwriting, that is mostly true.",
          "Frostline counts six at dawn. Meridian keeps its deposit and its silence. Teo's tab is unpaid again by Tuesday.",
          "Nobody thanks you. Mei puts extra chilli oil in your number thirty-three, which is not nothing."
        ],
        late: "Six o'clock has already gone. The tank comes back anyway, to a pier with no truck to load it. Frostline will count tomorrow, count wrong, and never know why."
      },
      black_water: {
        title: "Black Water",
        lines: [
          "You close the notebook. Teo watches you do it, and you both understand that this is a transaction too.",
          "Frostline counts five at dawn, blames the mainland, and doubles the padlocks. Ari sends Teo a postcard with no words on it. The tab stays paid.",
          "You run the Tern the way you always have. The jellyfish under the pontoon glow the same as before. You notice you check the crate numbers now, every time, and never say anything."
        ],
        late: "You watch the dawn truck leave from the wheelhouse. Five crates' worth of quiet."
      }
    }
  };

  return {
    meta: meta,
    world: world,
    variants: [kindLie, coldSale]
  };
})();
