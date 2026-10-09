/* ==========================================================================
   NEON TIDES — game logic
   --------------------------------------------------------------------------
   This file never contains story text. It reads window.NEON_TIDES (cases.js)
   and decides what to show, when, and what it costs.

   Map of this file
   ----------------
   1. constants & tiny helpers        el(), $(), clocks
   2. seeds                           hashSeed(), pickVariantIndex() (pinned seeds first)
   3. building & validating a case    buildCase(), mergeConfrontation(), validateCase()
   4. state                           newState(), setState()
   5. conditions & text               conditionHolds(), expandLines()
   6. progress                        currentObjective(), syncSceneClasses()
   7. travel & the ferry              travelTo(), beginCrossing(), positionFerry()
   8. actions                         locationActions(), performAction(), addClue()
   8b. the gold night                 trade.js + market.js: startTradeNight(), sitDown(), buyGold()
   9. the confrontation               startConfrontation() … chooseEnding()
   10. rendering                      render() and the render* functions
   11. notebook, modal, toast, the phone sheet (focusEncounter(), updateActionsCue())
   12. saving                         saveGame(), readSave(), saveProblem(), the case-file profile
   13. settings, sound, motion        the boat radio, applyMood()
   14. events & start-up              requestNewShift(), openCaseFiles(), bindEvents(), init()
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* 1 · CONSTANTS & TINY HELPERS                                        */
  /* ------------------------------------------------------------------ */
  const DATA = window.NEON_TIDES;
  const BASE_TRADE = window.NEON_TIDES_TRADE;
  const SECOND_TRADE = window.NEON_TIDES_NIGHT_TWO ? window.NEON_TIDES_NIGHT_TWO.build(BASE_TRADE) : null;
  const THIRD_TRADE = window.NEON_TIDES_MORNING ? window.NEON_TIDES_MORNING.build(SECOND_TRADE) : null;
  let TRADE = BASE_TRADE;   // the gold night: story and market data (trade.js)
  const BASE_CHAT = window.NEON_TIDES_CHAT || {};
  const SECOND_CHAT = window.NEON_TIDES_NIGHT_TWO ? window.NEON_TIDES_NIGHT_TWO.buildChat(BASE_CHAT) : null;
  const THIRD_CHAT = window.NEON_TIDES_MORNING ? window.NEON_TIDES_MORNING.buildChat(SECOND_CHAT) : null;
  let CHAT = BASE_CHAT; // optional, authored conversations (dialogue.js)
  const MARKET = window.NeonMarket;        // pricing and gold lots, no DOM (market.js)
  const SAVE_KEY = "neon-tides:save:v1";
  const SETTINGS_KEY = "neon-tides:settings:v1";
  const PROFILE_KEY = "neon-tides:profile:v1";   // which endings you have seen, per case; survives new shifts
  const SAVE_VERSION = 2;            // bumped when the saved shape changes; older saves are cleared
  const FERRY_MS = 2200;             // matches --ferry-ms in styles.css

  function $(id) { return document.getElementById(id); }

  // el("p", { class: "x", text: "hi" }, [children]) builds a DOM element.
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        const value = attrs[key];
        if (value === null || value === undefined || value === false) return;
        if (key === "class") node.className = value;
        else if (key === "text") node.textContent = value;
        else if (key.indexOf("on") === 0 && typeof value === "function") node.addEventListener(key.slice(2), value);
        else node.setAttribute(key, value === true ? "" : value);
      });
    }
    appendChildren(node, children);
    return node;
  }
  // The same, for elements inside the picture.
  const SVG_NS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs, children) {
    const node = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        const value = attrs[key];
        if (value === null || value === undefined || value === false) return;
        if (key === "class") node.setAttribute("class", value);
        else if (key === "text") node.textContent = value;
        else if (key.indexOf("on") === 0 && typeof value === "function") node.addEventListener(key.slice(2), value);
        else node.setAttribute(key, value === true ? "" : value);
      });
    }
    appendChildren(node, children);
    return node;
  }
  function appendChildren(node, children) {
    if (children === undefined || children === null) return;
    if (Array.isArray(children)) { children.forEach(function (c) { appendChildren(node, c); }); return; }
    if (typeof children === "string") { node.appendChild(document.createTextNode(children)); return; }
    node.appendChild(children);
  }

  // The clock is stored as minutes. Times after midnight count as the next day,
  // so 23:40 (1420) is before 00:55 (1495).
  function parseClock(text) {
    const parts = String(text).split(":");
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) || 0;
    let minutes = h * 60 + m;
    if (h < 12) minutes += 24 * 60;
    return minutes;
  }
  function formatClock(minutes) {
    const total = ((minutes % 1440) + 1440) % 1440;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return (h < 10 ? "0" + h : "" + h) + ":" + (m < 10 ? "0" + m : "" + m);
  }
  const START_CLOCK = parseClock(DATA.meta.startClock);
  const DAWN_CLOCK = parseClock(DATA.meta.dawnClock);

  /* ------------------------------------------------------------------ */
  /* 2 · SEEDS — the same text always picks the same case                */
  /* ------------------------------------------------------------------ */
  function normaliseSeed(seed) { return String(seed || "").trim().toLowerCase(); }

  // FNV-1a: a small, well-known hash. Same input, same 32-bit number, everywhere.
  function hashSeed(text) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  }
  // A case can pin seeds of its own (variant.seeds), so the seeds printed in the docs and on the title
  // screen keep naming the same case however many cases are added. Every other seed is hashed.
  function pickVariantIndex(seed) {
    const text = normaliseSeed(seed);
    for (let i = 0; i < DATA.variants.length; i++) {
      if ((DATA.variants[i].seeds || []).indexOf(text) !== -1) return i;
    }
    return hashedIndex(text, DATA.variants.length);
  }
  // Unpinned seeds. With two cases this is exactly the 2.x rule (hash % 2). Every case added after that
  // takes a fair one-in-n share of all seeds and never moves a seed between earlier cases, so a seed
  // someone wrote down opens either the case it always did or a case newer than it. Plain
  // `hash % n` would reshuffle seeds between old cases each time one is added. The rule depends on
  // order: new cases are only ever appended to `variants`.
  function hashedIndex(text, n) {
    let index = hashSeed(text) % Math.min(n, 2);
    for (let k = 3; k <= n; k++) {
      if (mix32(hashSeed(text + "#" + k)) % k === 0) index = k - 1;
    }
    return index;
  }
  // FNV-1a multiplies by an odd prime, so its lowest bits mix poorly (bit 0 is just the parity of the
  // odd character codes). The two-case rule has to keep that for compatibility; the steps for newer
  // cases run the hash through MurmurHash3's finaliser first, so every bit counts.
  function mix32(h) {
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
  }
  function randomSeed() {
    const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
    let out = "";
    for (let i = 0; i < 5; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return "tide-" + out;
  }
  function variantById(id) {
    return DATA.variants.filter(function (v) { return v.id === id; })[0] || null;
  }

  /* ------------------------------------------------------------------ */
  /* 3 · BUILDING & VALIDATING A CASE                                    */
  /* ------------------------------------------------------------------ */
  // Every clue id an action can hand out, including the conditional ones in givesWhen.
  function cluesGivenBy(action) {
    const given = (action.gives || []).slice();
    (action.givesWhen || []).forEach(function (g) { (g.gives || []).forEach(function (id) { given.push(id); }); });
    return given;
  }

  // The confrontation is world defaults plus whatever the variant overrides. A case with its own lie
  // (a different liar, other proofs, another place to confront them) overrides most of it.
  function mergeConfrontation(base, own) {
    const merged = Object.assign({}, base, own || {});
    merged.challenge = Object.assign({}, base.challenge, (own && own.challenge) || {});
    merged.stageLabels = Object.assign({}, base.stageLabels, (own && own.stageLabels) || {});
    return merged;
  }

  // A playable case = the shared world + one variant, merged. variant.omit drops shared actions that
  // belong to a different story (a case with its own lie has its own briefing, for example).
  function buildCase(variant) {
    const world = DATA.world;
    const omit = variant.omit || [];
    const built = {
      id: variant.id,
      title: variant.title,
      tagline: variant.tagline,
      truth: variant.truth,
      allClues: Object.assign({}, world.clues, variant.clues),
      ownClues: Object.keys(variant.clues || {}),
      clues: {},
      scenes: variant.scenes,
      actions: {},
      confrontation: mergeConfrontation(world.confrontation, variant.confrontation),
      threads: variant.threads || world.threads,
      objectives: variant.objectives || world.objectives,
      timeline: variant.timeline || world.timeline || [],
      names: world.timelineNames || [],
      things: world.things || {},
      sceneClasses: (world.sceneClasses || []).concat(variant.sceneClasses || []),
      responses: variant.responses,
      finalChoices: variant.finalChoices,
      endings: variant.endings,
      omitted: omit.slice()
    };
    Object.keys(world.locations).forEach(function (loc) {
      const shared = (world.actions[loc] || []).filter(function (a) { return omit.indexOf(a.id) === -1; });
      const own = (variant.actions && variant.actions[loc]) || [];
      const shows = (variant.showActions && variant.showActions[loc]) || [];   // 3.3: showing a clue
      built.actions[loc] = shared.concat(own, shows);
    });
    // Only clues something in this case can hand out belong to it, so a shared clue from a story this
    // case left out never counts towards "x of y clues" or settles a thread.
    Object.keys(built.actions).forEach(function (loc) {
      built.actions[loc].forEach(function (action) {
        cluesGivenBy(action).forEach(function (id) { if (built.allClues[id]) built.clues[id] = built.allClues[id]; });
      });
    });
    return built;
  }

  // Returns a list of problems (empty = valid). Run on every variant at start-up.
  function validateCase(built) {
    const problems = [];
    const world = DATA.world;
    const conf = built.confrontation;
    const clueIds = Object.keys(built.clues);
    function proving(tag) {
      return clueIds.filter(function (id) { return (built.clues[id].proves || []).indexOf(tag) !== -1; });
    }
    const requires = conf.requires || [];
    if (requires.length === 0) problems.push("the confrontation requires no proofs");
    requires.forEach(function (tag) {
      if (proving(tag).length === 0) problems.push("no clue proves '" + tag + "'");
      if (requires.length > 1 && !(conf.challenge.missing && conf.challenge.missing[tag])) problems.push("missing challenge.missing." + tag);
    });
    if (!world.locations[conf.at]) problems.push("the confrontation happens at unknown place '" + conf.at + "'");
    if (conf.thing && !built.things[conf.thing]) problems.push("the confrontation names unknown thing '" + conf.thing + "'");

    const explanations = conf.explanations || [];
    const truth = explanations.filter(function (e) { return e.id === built.truth; })[0];
    if (!truth) problems.push("truth '" + built.truth + "' is not one of the explanations");
    else if (proving(truth.proof).length === 0) problems.push("no clue proves the true explanation (" + truth.proof + ")");
    explanations.forEach(function (e) {
      if (e.id !== built.truth && proving(e.proof).length > 0) problems.push("a clue proves the false explanation '" + e.id + "'");
      const response = built.responses && built.responses[e.id];
      if (e.id === built.truth && !(response && response.correct)) problems.push("missing responses." + e.id + ".correct");
      if (e.id !== built.truth && !(response && response.wrong)) problems.push("missing responses." + e.id + ".wrong");
    });

    Object.keys(world.locations).forEach(function (loc) {
      if (!built.scenes[loc] || !built.scenes[loc].first) problems.push("missing scene text for " + loc);
      const seen = {};
      (built.actions[loc] || []).forEach(function (action) {
        if (seen[action.id]) problems.push("duplicate action id '" + action.id + "' at " + loc);
        seen[action.id] = true;
        cluesGivenBy(action).forEach(function (id) { if (!built.allClues[id]) problems.push("action " + action.id + " gives unknown clue '" + id + "'"); });
        // 3.3: a thing must be a drawn, named thing; a show action needs answers for real clues and a fallback
        if (action.thing && !built.things[action.thing]) problems.push("action " + action.id + " names unknown thing '" + action.thing + "'");
        if (action.thing && typeof document !== "undefined" && !document.getElementById(action.thing)) problems.push("action " + action.id + "'s thing '" + action.thing + "' is not drawn in the picture");
        if (action.kind === "show") {
          if (!action.shows || typeof action.shows !== "object") problems.push("show action " + action.id + " has no 'shows'");
          else Object.keys(action.shows).forEach(function (id) { if (!built.clues[id]) problems.push("show action " + action.id + " answers unknown clue '" + id + "'"); });
          if (!action.otherwise) problems.push("show action " + action.id + " has no 'otherwise'");
        }
      });
    });
    // A clue written for this case that nothing hands out is almost always a typo or a forgotten action.
    built.ownClues.forEach(function (id) { if (!built.clues[id]) problems.push("clue '" + id + "' is never given by any action"); });
    built.omitted.forEach(function (id) {
      const known = Object.keys(world.actions).some(function (loc) { return world.actions[loc].some(function (a) { return a.id === id; }); });
      if (!known) problems.push("omit names unknown shared action '" + id + "'");
    });

    // The timeline (3.1): every line names a known person, is at a known place, has a clock and a
    // question; a line the counter tests carries a rebuttal and a tag some clue proves; every required
    // tag has a line to be tested; the clues a line names exist in this case.
    const names = built.names.map(function (n) { return n.id; });
    const lineIds = {};
    built.timeline.forEach(function (row) {
      if (lineIds[row.id]) problems.push("duplicate timeline line '" + row.id + "'");
      lineIds[row.id] = true;
      if (names.indexOf(row.answer) === -1) problems.push("timeline line '" + row.id + "' answers with unknown name '" + row.answer + "'");
      if (!row.question || !row.clock) problems.push("timeline line '" + row.id + "' needs a clock and a question");
      if (row.place && !world.locations[row.place]) problems.push("timeline line '" + row.id + "' is at unknown place '" + row.place + "'");
      if (row.proof && proving(row.proof).length === 0) problems.push("timeline line '" + row.id + "' needs proof '" + row.proof + "', which no clue gives");
      if (row.proof && requires.indexOf(row.proof) !== -1 && !row.wrong) problems.push("timeline line '" + row.id + "' is tested at the counter but has no 'wrong' rebuttal");
      (row.clues || []).forEach(function (id) { if (!built.clues[id]) problems.push("timeline line '" + row.id + "' names unknown clue '" + id + "'"); });
    });
    requires.forEach(function (tag) {
      if (!built.timeline.some(function (row) { return row.proof === tag; })) problems.push("no timeline line for required proof '" + tag + "'");
    });
    if (built.timeline.length && !conf.challenge.timeline) problems.push("missing challenge.timeline");

    if (!built.objectives || !built.objectives.length) problems.push("no objectives");
    if (!built.finalChoices || built.finalChoices.length === 0) problems.push("no final choices");
    (built.finalChoices || []).forEach(function (choice) {
      if (!built.endings || !built.endings[choice.ending]) problems.push("choice " + choice.id + " points to unknown ending '" + choice.ending + "'");
    });
    return problems;
  }

  function validateAll() {
    const report = {};
    const pinned = {};
    DATA.variants.forEach(function (v) {
      report[v.id] = validateCase(buildCase(v));
      // The case files open each case by its first pinned seed, so every case needs one.
      if (!v.seeds || !v.seeds.length) report[v.id].push("no pinned seed (variant.seeds)");
      (v.seeds || []).forEach(function (seed) {
        if (pinned[seed]) report[v.id].push("seed '" + seed + "' is already pinned to " + pinned[seed]);
        else pinned[seed] = v.id;
        if (seed !== normaliseSeed(seed)) report[v.id].push("pinned seed '" + seed + "' must be trimmed lower case");
      });
    });
    const current = TRADE;
    try {
      TRADE = BASE_TRADE;
      if (TRADE) report["night:" + TRADE.meta.id] = validateTrade();
      if (SECOND_TRADE) { TRADE = SECOND_TRADE; report["night:lantern-tomorrow"] = validateTrade(); }
      if (THIRD_TRADE) { TRADE = THIRD_TRADE; report["shift:morning-after"] = validateTrade(); }
    } finally { TRADE = current; }
    return report;
  }

  /* ------------------------------------------------------------------ */
  /* 4 · STATE — everything that gets saved                              */
  /* ------------------------------------------------------------------ */
  let state = null;         // the saved game
  let activeCase = null;    // built from state.variantId
  const transient = { travelling: null, timer: null, mode: "title", sceneClasses: [], objective: null, camera: null, cameraFrame: 0 };
  const settings = { station: "off", effects: false, effectsVolume: 0.6, motion: "auto", coached: false, camera: "close", hints: "on" };
  const profile = { version: 1, cases: {} };   // cases[variantId] = { endings: [endingId, ...] }
  const storage = { ok: true, reason: "" };
  const dom = {};

  function newState(seed, variantId) {
    return {
      version: SAVE_VERSION,
      seed: seed,
      variantId: variantId,          // the truth is fixed here and never recomputed
      location: "bar",
      clock: START_CLOCK,
      fuel: DATA.meta.startFuel,
      cans: DATA.meta.startCans,     // energy-drink cans in hand
      canArmed: false,               // a can has been drunk; the next crossing is free of clock time
      flags: {},
      clues: [],                     // { id, foundAt, where }
      timeline: {},                  // lineId -> nameId: what the notebook's timeline says (3.1)
      shown: {},                     // showActionId -> [clueId]: what has been held up to whom (3.3)
      hinted: [],                    // timeline lines the notebook has already pointed at
      used: {},                      // actionId -> times used
      visited: { bar: 1 },
      lastResult: null,              // what the encounter panel is showing
      confront: null,                // confrontation progress, or null
      resolved: false,
      ending: null,
      endedAt: null,
      startedAt: new Date().toISOString()
    };
  }
  function setState(next) {
    state = next;
    TRADE = state.kind === "trade" && state.night === 3 && THIRD_TRADE ? THIRD_TRADE : state.kind === "trade" && state.night === 2 && SECOND_TRADE ? SECOND_TRADE : BASE_TRADE;
    CHAT = state.kind === "trade" && state.night === 3 && THIRD_CHAT ? THIRD_CHAT : state.kind === "trade" && state.night === 2 && SECOND_CHAT ? SECOND_CHAT : BASE_CHAT;
    transient.marketSpot = null;
    if (!state.timeline) state.timeline = {};   // saves from before 3.1
    if (!state.hinted) state.hinted = [];
    if (!state.shown) state.shown = {};
    activeCase = state.kind === "trade" ? buildTradeNight() : buildCase(variantById(state.variantId));
  }

  /* ------------------------------------------------------------------ */
  /* 5 · CONDITIONS & TEXT                                               */
  /* ------------------------------------------------------------------ */
  function hasClue(id) { return state.clues.some(function (c) { return c.id === id; }); }
  function clueProves(id, tag) {
    const clue = activeCase.clues[id];
    return !!clue && (clue.proves || []).indexOf(tag) !== -1;
  }
  function proven(tag) { return state.clues.some(function (c) { return clueProves(c.id, tag); }); }
  function cluesProving(tag) {
    return state.clues.filter(function (c) { return clueProves(c.id, tag); }).map(function (c) { return c.id; });
  }
  // The proof tags of every explanation offered at the confrontation: a clue carrying one is a motive lead.
  function motiveTags() { return activeCase.confrontation.explanations.map(function (e) { return e.proof; }); }
  function motiveKnown() { return motiveTags().some(proven); }

  // Every field of a condition must hold. See the top of cases.js for the list.
  function conditionHolds(cond) {
    if (!cond) return true;
    if (cond.tradeLoss && !(state.trades || []).some(function (t) { return t.kind === "sell" && typeof t.basis === "number" && t.total < t.basis; })) return false;
    if (cond.everFlagAny && !cond.everFlagAny.some(function (f) { return state.flags[f] || (state.previous && state.previous.flags[f]); })) return false;
    if (cond.lastStart && state.clock > parseClock(cond.lastStart)) return false;
    if (cond.freightSpace && freightHeld() >= 2) return false;
    if (cond.visited && !Object.keys(cond.visited).every(function (loc) { return (state.visited[loc] || 0) >= cond.visited[loc]; })) return false;
    if (cond.night && (state.night || 1) !== cond.night) return false;
    const previous = state.previous ? state.previous.flags : {};
    if (cond.priorFlag && !cond.priorFlag.every(function (f) { return !!previous[f]; })) return false;
    if (cond.priorNotFlag && cond.priorNotFlag.some(function (f) { return !!previous[f]; })) return false;
    if (cond.cargoAtLeast && (!state.cargo || state.cargo.crates < cond.cargoAtLeast)) return false;
    if (cond.has && !cond.has.every(hasClue)) return false;
    if (cond.hasAny && !cond.hasAny.some(hasClue)) return false;
    if (cond.lacks && cond.lacks.some(hasClue)) return false;
    if (cond.flag && !cond.flag.every(function (f) { return !!state.flags[f]; })) return false;
    if (cond.flagAny && !cond.flagAny.some(function (f) { return !!state.flags[f]; })) return false;
    if (cond.notFlag && cond.notFlag.some(function (f) { return !!state.flags[f]; })) return false;
    if (cond.minClock && state.clock < parseClock(cond.minClock)) return false;
    if (cond.maxClock && state.clock >= parseClock(cond.maxClock)) return false;
    if (typeof cond.creditsBelow === "number" && !(state.credits < cond.creditsBelow)) return false;
    if (typeof cond.fuelBelow === "number" && !(state.fuel < cond.fuelBelow)) return false;
    if (typeof cond.resolved === "boolean" && state.resolved !== cond.resolved) return false;
    if (cond.ending && state.ending !== cond.ending) return false;
    if (cond.proven && !cond.proven.every(proven)) return false;
    if (cond.unproven && cond.unproven.some(proven)) return false;
    if (typeof cond.motive === "boolean" && motiveKnown() !== cond.motive) return false;
    if (typeof cond.confronting === "boolean" && !!state.confront !== cond.confronting) return false;
    if (cond.timeline === "filled" && !timelineFilled()) return false;
    if (cond.timeline === "unfilled" && timelineFilled()) return false;
    // the gold night (trade.js): the hidden truth, relationships, what has been heard, world events
    if (cond.truth && cond.truth.indexOf(state.truth) === -1) return false;
    if (cond.rel && !Object.keys(cond.rel).every(function (id) { return relOf(id) >= cond.rel[id]; })) return false;
    if (cond.relBelow && !Object.keys(cond.relBelow).every(function (id) { return relOf(id) < cond.relBelow[id]; })) return false;
    if (cond.heard && !cond.heard.every(heard)) return false;
    if (cond.heardAny && !cond.heardAny.some(heard)) return false;
    if (cond.notHeard && cond.notHeard.some(heard)) return false;
    if (cond.happened && !cond.happened.every(function (id) { return MARKET.eventHappened(TRADE, state.truth, id, state.clock); })) return false;
    if (typeof cond.goldAtLeast === "number" && goldHeld() < cond.goldAtLeast) return false;
    return true;
  }

  // The notebook's timeline (3.1): lines the player fills in with a name. Lines whose proof the
  // confrontation requires are tested at the counter; the rest only when the case closes.
  function timelineRows() { return activeCase.timeline; }
  function timelineName(id) {
    const entry = activeCase.names.filter(function (n) { return n.id === id; })[0];
    return entry ? entry.name : "";
  }
  function timelineWhere(row) { return row.where || (row.place ? DATA.world.locations[row.place].short : ""); }
  function timelineVerdict(row) {
    const answer = state.timeline[row.id];
    if (!answer) return "empty";
    return answer === row.answer ? "right" : "wrong";
  }
  function timelineTested() {
    const required = activeCase.confrontation.requires || [];
    return timelineRows().filter(function (row) { return row.proof && required.indexOf(row.proof) !== -1; });
  }
  function timelineFilled() { return timelineTested().every(function (row) { return !!state.timeline[row.id]; }); }
  function timelineScore() {
    const rows = timelineRows();
    return { right: rows.filter(function (row) { return timelineVerdict(row) === "right"; }).length, total: rows.length };
  }
  function setTimelineAnswer(rowId, nameId) {
    if (!state || state.resolved) return;
    if (!timelineRows().some(function (row) { return row.id === rowId; })) return;
    if (nameId && !activeCase.names.some(function (n) { return n.id === nameId; })) return;
    if (nameId) state.timeline[rowId] = nameId; else delete state.timeline[rowId];
    saveGame();
  }

  // Story entries -> flat list of { type: "p" | "speech" | "notice", ... }
  function expandLines(lines) {
    const out = [];
    (lines || []).forEach(function (entry) {
      if (typeof entry === "string") { out.push({ type: "p", text: entry }); return; }
      if (entry.if && !conditionHolds(entry.if)) return;
      if (entry.lines) { expandLines(entry.lines).forEach(function (item) { out.push(item); }); return; }
      if (entry.who) { out.push({ type: "speech", who: entry.who, text: entry.text }); return; }
      if (entry.notice) { out.push({ type: "notice", text: entry.notice, tone: entry.tone || "" }); return; }
      if (entry.text) out.push({ type: "p", text: entry.text });
    });
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* 6 · PROGRESS                                                        */
  /* ------------------------------------------------------------------ */
  // Objectives are an ordered list of { when: CONDITION, text }; the first rule that holds is shown.
  // That keeps "what now?" in cases.js, where each case can phrase it for its own lie.
  function currentObjective() {
    if (isTrade()) {
      const active = storyProgress().filter(function (row) { return !row.done; });
      if (active.length) return active.length + " active stor" + (active.length === 1 ? "y" : "ies") + " · " + active[0].text + " Notebook: all next steps.";
    }
    const rules = isTrade() ? (TRADE.expeditionObjectives || []) : activeCase.objectives;
    for (let i = 0; i < rules.length; i++) {
      if (conditionHolds(rules[i].when)) return rules[i].text;
    }
    return "";
  }

  // Independent story cards are derived from existing flags; old saves need no migration.
  function storyProgress() {
    const f = state.flags, rows = [];
    function add(id, title, done, next, outcome) { rows.push({ id: id, title: title, done: !!done, text: done ? outcome : next }); }
    if (f.exp_job) add("lantern", "Hoshimi · Guiding lights", f.exp_done,
      f.exp_cargo ? "Return the kits to Sora at the Night Market; choose 85 cr or 1 g of gold." : f.exp_chart ? "Collect the kits on Hoshimi Island; allow 15 min at the storehouse." : "Ask Rin at Starling Yard for the reef chart, then refuel for the island.",
      "Lantern kits delivered · " + (f.exp_gold ? "1 g of gold received." : "85 cr received."));
    if (f.nm_job) add("dispatch", "Market · The overdue launch", f.nm_done,
      f.nm_verified ? (state.clock < parseClock("03:30") ? "Return to the market: report to Sora for 25 cr, or fill Kenji's 2 g order before 03:30." : "Kenji's bench has closed; report the checked dispatch to Sora for 25 cr.") : f.nm_manifest ? "Check the dispatch with " + (state.truth === "vault" ? "Priya at Landing 3." : "Rin at Starling Yard.") : "Read the current dispatch slip in the market delivery lane.",
      f.nm_contract_done ? "Kenji's sensor-gold order filled at the agreed premium." : "Dispatch checked · 25 cr courier reward received.");
    if (f.nb_started) add("breakfast", "Nao · The last sunrise bowl", f.nb_done,
      state.clock >= parseClock("05:00") ? "Return to Nao before dawn for breakfast; the last bowl stays warm after 05:45." : "Meet Nao at 05:00. Optional: hear her recipe, help with trays and invite neighbours; buying stock is optional.",
      f.nb_late ? "You shared the saved bowl with Nao." : "Nao opened her counter with her own name on the menu.");
    if (f.n2_started) add("recipe", "Nao · A lantern for tomorrow", f.n2_done,
      !f.n2_menu ? "Choose smoky mushroom or plum-and-sesame rice at Nao's counter." : state.clock >= parseClock("05:00") ? "Taste Nao's recipe before dawn, at the market or in Kisaragi if she is aboard." : "Optional: test the seasoning. Taste the recipe with Nao from 05:00; ingredients are not required.",
      (f.n2_smoky ? "Smoky mushroom" : "Plum-and-sesame") + " recipe tasted · Tomorrow's menu is ready.");
    if (f.ct_parcel) add("parcel", "Kisaragi · The fourth table", f.ct_parcel_done,
      !f.ct_notice ? "Read the festival noticeboard by Hana in Kisaragi." : !f.ct_recipient ? "Ask Jun who keeps the fourth table." : "Deliver Mako's parcel to Hana by the bridge.", "Hana received the spare spoons · 12 cr delivery fee received.");
    if (f.cf_invited) {
      const missing = [];
      if (!f.cf_prepared) missing.push("prepare a sample with Nao at the market");
      if (!f.cf_met_hana) missing.push("meet Hana in Kisaragi");
      if (!f.cf_aroma) missing.push("ask Jun for a tea pairing");
      add("festival", "Nao · Lanterns beyond the locks", f.cf_done,
        f.cf_choice ? (f.cf_card ? "Take Nao's signed recipe to Hana in Kisaragi." : "Sail with Nao to Kisaragi and join Hana's preview supper before dawn.") : missing.length ? "Next: " + missing.join("; ") + "." : "Return to Nao and choose the small festival table or a signed recipe with an evening off.",
        f.cf_shared ? "Signed recipe shared · Nao kept her afternoon with Haruto." : "Preview supper shared · Nao reserved her own small festival table.");
    }
    if (f.fs_started) {
      const remaining = ["bowls", "tea", "cloth"].filter(function (id) { return !f["fs_" + id + "_done"]; });
      add("festival-supply", "Hana · A table across the water", f.fs_done,
        remaining.length && state.clock > parseClock(state.night === 3 ? "10:20" : "05:20") ? "Delivery window closed. Undelivered cases stay aboard without automatic payment; settled deliveries remain in your cargo accounts." : remaining.length ? (f.fs_stock ? "Stock route" : "Courier route") + " · Still to deliver: " + remaining.join(", ") + ". Check each cargo offer for destination, payment and deadline." : "Visit Hana in Kisaragi for a quiet cup; every cargo payment is already settled.",
        "All three festival cases delivered · You shared Hana's closing cup.");
    }
    if (f.wire_umbrella_started) add("wire-umbrella", "Priya · A patch of blue sky", f.wire_umbrella_done,
      f.wire_umbrella_found ? "Return the umbrella to Priya at Landing 3; no deadline." : "Search by the Metro Quay vending machine; five minutes, no purchase.", "Priya's umbrella returned · Her thank-you is on the Harbour Wire.");
    if (f.yard_started) add("yard", "Rin · Second Helping", f.yard_done, f.yard_pump_fixed ? "Return to Rin at Starling Yard and celebrate the repaired ferry." : "Help Rin fix the bilge pump at Starling Yard; ten minutes, no parts purchase.", "Second Helping's pump repaired and launch celebrated.");
    if (f.yard_star_found) add("star", "Lam · A safe-homecoming star", f.yard_star_returned, "Return the brass keepsake to Captain Lam at Metro Quay.", "Captain Lam received his daughter's brass star.");
    if (f.n3_started) add("morning", "Festival · A table through the tide", f.n3_shared,
      f.n3_done ? "Join Hana's crew breakfast at the delivery location before 11:00." : !f.n3_cargo ? "Collect the stranded table kit from Rin at Starling Yard." : !f.n3_route ? "Check Priya's revised festival route at Landing 3." : "Deliver to Hana " + (state.truth === "vault" ? "at the Night Market" : "in Kisaragi") + "; start handover by 10:15.", "Festival table delivered · You joined the crew for breakfast.");
    if (f.ay_started) add("assay", "Rin · The wrong golden parcel", f.ay_done,
      !f.ay_receipt ? "Check the dispatch copy with Priya at Landing 3; five minutes." : !f.ay_stamp ? "Ask Kenji at Starling Yard to identify the part stamp." : !f.ay_compared ? "Compare both records with Rin at the yard; ten minutes, no stock purchase." : "Return the checked assay card to Priya and correct the receipt.", "Swapped receipt corrected · No gold or credits wagered.");
    if (f.af_started) add("afternoon", "Nao & Haruto · An afternoon off", f.af_done,
      !f.af_picnic ? "Pack Mei's free picnic at Kurage 33; five minutes." : !f.af_route ? "Check the afternoon meeting place with Priya at Landing 3." : !f.af_ready ? "Tell Nao at the market that the picnic and route are ready before ending the morning." : "Finish the morning, then open the afternoon vignette from your shift report.",
      f.af_join ? "You joined Nao and Haruto for their picnic." : f.af_carry ? "You carried the basket and left them family time." : "You helped arrange a private afternoon for Nao and Haruto.");
    Object.keys(state.freight || {}).forEach(function (id) {
      const d = TRADE.freight[id], cargo = state.freight[id];
      add("freight-" + id, d.title, !cargo.units, "Deliver to " + DATA.world.locations[d.to].short + " · " + deliveryTime(d.lastStart) + ".", "Delivered · " + cargo.revenue + " cr received; " + cargo.cost + " cr purchase.");
    });
    return rows;
  }
  function renderStoryProgress(container) {
    const rows = storyProgress();
    const section = el("section", { class: "nb-section story-log" }, [el("h3", { text: "Stories · Next steps & outcomes" })]);
    if (!rows.length) section.appendChild(el("p", { class: "nb-empty", text: "No stories accepted yet. Visit the market counters, or ask Mako about the fourth table in Kisaragi." }));
    [false, true].forEach(function (done) {
      const group = rows.filter(function (row) { return row.done === done; });
      if (!group.length) return;
      section.appendChild(el("h4", { text: done ? "Completed" : "Active" }));
      const list = el("ul", { class: "story-list" });
      group.forEach(function (row) { list.appendChild(el("li", { id: "story-" + row.id, tabindex: "-1", class: row.done ? "story-complete" : "story-active" }, [el("strong", { text: row.title }), el("p", { text: row.text })])); });
      section.appendChild(list);
    });
    container.appendChild(section);
  }
  function deliveryTime(lastStart) {
    const remaining = parseClock(lastStart) - state.clock;
    return remaining < 0 ? "Delivery window closed" : remaining === 0 ? "Start handover now" : remaining + " min to start handover";
  }
  function cargoProgress() {
    const rows = [], f = state.flags, c = state.cargo, tea = state.canalTrade;
    if (c && c.bought) rows.push({ title: "Rice · Nao at the Night Market", text: "Purchase " + c.cost + " cr · Promised " + (c.courier ? "12 cr courier fee" : c.bought * 30 + " cr") + " · " + (c.crates ? deliveryTime("04:25") + " (5 min handover; completed by 04:30). Return at Landing 3: " + (c.courier ? "0 cr" : c.crates * 16 + " cr") + " · " + deliveryTime("05:40") + "." : "Settled · " + (c.courier && c.sold ? 12 : c.revenue) + " cr received.") });
    if (tea) rows.push({ title: "Sealed tea · Sora at the Night Market", text: "Purchase " + tea.cost + " cr · Promised 38 cr · " + (tea.units ? deliveryTime("05:55") + " (5 min handover; completed by 06:00)." : "Delivered · " + tea.revenue + " cr received.") });
    if (f.nb_batch_owned) rows.push({ title: "Breakfast batch · Nao's counter", text: "Purchase " + (state.breakfastCost || 0) + " cr · Payment depends on actual sales: 0–48 cr · " + (f.nb_done ? "Settled · " + (state.breakfastRevenue || 0) + " cr received." : f.nb_batch_delivered ? "Stock handed over; open with Nao from 05:00." : deliveryTime("05:39") + " (5 min handover; start before 05:40).") });
    Object.keys(state.freight || {}).forEach(function (id) {
      const c = state.freight[id], d = TRADE.freight[id];
      rows.push({ title: d.title + " · " + DATA.world.locations[d.to].short, text: "Purchase " + c.cost + " cr · Promised " + d.payment + " cr · " + (c.units ? deliveryTime(d.lastStart) + " (5 min handover; last start " + d.lastStart + ")." : "Delivered · " + c.revenue + " cr received.") });
    });
    if (f.n3_cargo) rows.push({ title: "Festival table kit · Crew property", text: "Purchase 0 cr · Promised 18 cr courier fee · " + (f.n3_done ? "Delivered; fee received." : deliveryTime("10:15") + " · " + (f.n3_route ? "Hana at " + (state.truth === "vault" ? "the market." : "Kisaragi.") : "Confirm the destination with Priya.")) });
    return rows;
  }
  function renderCargoProgress(container) {
    const rows = cargoProgress();
    if (!rows.length) return;
    const section = el("section", { class: "nb-section cargo-log" }, [el("h3", { text: "Cargo · Cost, payment & delivery" }), el("p", { class: "clue-meta", text: "Fuel and travel time are extra. Payment requires handover; no automatic payout." })]);
    rows.forEach(function (row) { section.appendChild(el("article", { class: "cargo-card" }, [el("strong", { text: row.title }), el("p", { text: row.text })])); });
    container.appendChild(section);
  }
  function freightHeld() { return Object.values(state.freight || {}).reduce(function (sum, c) { return sum + c.units; }, 0); }
  function freightTotals() { return Object.values(state.freight || {}).reduce(function (sum, c) { sum.cost += c.cost; sum.revenue += c.revenue; return sum; }, { cost: 0, revenue: 0 }); }
  function travelPlan(dest) {
    const check = canTravel(dest), route = travelCost(state.location, dest);
    if (!route) return { destination: dest, ok: false, text: "No direct route." };
    const minutes = travelMinutes(route), arrive = state.clock + minutes;
    const back = travelCost(dest, state.location), returnFuel = back ? route.fuel + back.fuel : Infinity;
    const payments = [];
    Object.keys(state.freight || {}).forEach(function (id) {
      const c = state.freight[id], d = TRADE.freight[id];
      if (c.units && d.to === dest) payments.push(d.title + ": " + d.payment + " cr · " + (arrive <= parseClock(d.lastStart) ? (parseClock(d.lastStart) - arrive) + " min left to start 5 min handover" : "deadline missed on arrival"));
    });
    if (dest === "market" && state.canalTrade && state.canalTrade.units) payments.push("Jun's tea: 38 cr · " + (arrive <= parseClock("05:55") ? (parseClock("05:55") - arrive) + " min to start 5 min handover" : "deadline missed on arrival"));
    if (dest === "market" && state.cargo && state.cargo.crates) payments.push("Rice: " + (state.cargo.courier ? "12 cr fee" : state.cargo.crates * 30 + " cr") + " · " + (arrive <= parseClock("04:25") ? (parseClock("04:25") - arrive) + " min to start 5 min handover" : "delivery deadline missed on arrival"));
    if (state.flags.n3_cargo && !state.flags.n3_done && state.flags.n3_route && dest === (state.truth === "vault" ? "market" : "canal")) payments.push("Festival kit: 18 cr fee · " + (arrive <= parseClock("10:15") ? (parseClock("10:15") - arrive) + " min to start 5 min handover" : "deadline missed on arrival"));
    const refill = ["landing", "yard", "canal"].indexOf(dest) !== -1;
    const returnNote = state.fuel >= returnFuel ? "Fuel covers the direct return (" + returnFuel + " total)." : "Direct return needs " + returnFuel + " total fuel; your tank has " + state.fuel + ". " + (refill ? "A refill here costs 30 cr / 10 min; " + (state.credits >= 30 ? "your purse covers it." : "your current purse cannot cover it.") : "No full refill at this quay; plan another route or tug recovery.");
    const text = DATA.world.locations[dest].short + " · " + route.fuel + " fuel / " + minutes + " min · Arrive " + formatClock(arrive) + ". " + (check.ok ? "" : "Cannot sail: " + check.why + ". ") + returnNote + (back ? " Return crossing: " + back.minutes + " min, before handovers or refuelling." : "") + (arrive >= dawnClock() ? " Arrival reaches shift end." : "") + (payments.length ? " Cargo: " + payments.join("; ") + "." : " No held delivery is due here.");
    return { destination: dest, ok: check.ok, arrival: arrive, returnFuel: returnFuel, payments: payments, text: text };
  }
  function renderTravelPlanner(container) {
    const places = Object.keys(DATA.world.locations).filter(function (id) { return id !== state.location && locationAvailable(id); });
    if (!places.length) return;
    const section = el("details", { class: "travel-planner action-group" }, [el("summary", { text: "Plan a crossing · Fuel, return & deliveries" })]);
    section.open = !!transient.planOpen;
    const label = el("label", { for: "plan-destination", text: "Destination" });
    const select = el("select", { id: "plan-destination" });
    places.forEach(function (id) { select.appendChild(el("option", { value: id, text: DATA.world.locations[id].short })); });
    select.value = places.indexOf(transient.planDestination) !== -1 ? transient.planDestination : places[0];
    const note = el("p", { class: "travel-plan-note", role: "status" });
    const button = el("button", { class: "btn", type: "button", onclick: function () { travelTo(select.value); } });
    function update() { const plan = travelPlan(select.value); transient.planDestination = select.value; note.textContent = plan.text; button.textContent = "Cast off for " + DATA.world.locations[select.value].short; button.disabled = !plan.ok; }
    select.addEventListener("change", update);
    section.addEventListener("toggle", function () { transient.planOpen = section.open; });
    [label, select, note, button].forEach(function (node) { section.appendChild(node); }); update(); container.appendChild(section);
  }

  function rememberedQuote(loc) {
    const quote = state.seen[loc], age = Math.max(0, state.clock - quote.at);
    return DATA.world.locations[loc].short + " · Observed " + formatClock(quote.at) + " · " + age + " min ago · " + (quote.buy ? "Buy " + quote.buy + " / " : "") + "Sell " + quote.sell + " cr/g · " + (age ? "Remembered quote; recheck on arrival." : "Just observed.");
  }

  // Classes on <body> that let the picture follow the story: the platform empties after the last train,
  // a stool stands empty after one ending. Rules live in cases.js; styles.css draws the difference.
  function syncSceneClasses() {
    const next = state && activeCase && transient.mode === "play"
      ? activeCase.sceneClasses.filter(function (rule) { return conditionHolds(rule.when); }).map(function (rule) { return rule.class; })
      : [];
    (transient.sceneClasses || []).forEach(function (name) { if (next.indexOf(name) === -1) document.body.classList.remove(name); });
    next.forEach(function (name) { document.body.classList.add(name); });
    transient.sceneClasses = next;
  }

  /* ------------------------------------------------------------------ */
  /* 7 · TRAVEL & THE FERRY                                              */
  /* ------------------------------------------------------------------ */
  function travelCost(from, to) {
    const route = DATA.world.travel.filter(function (r) {
      return r.between.indexOf(from) !== -1 && r.between.indexOf(to) !== -1;
    })[0];
    return route ? { fuel: route.fuel, minutes: route.minutes } : null;
  }
  function travelMinutes(cost) { return state.canArmed ? 0 : cost.minutes; }
  function canTravelFromUnlocked(dest) {
    const loc = DATA.world.locations[dest];
    return !loc.unlockFlag || !!state.flags[loc.unlockFlag];
  }
  function cheapestExit(from) {
    let min = Infinity;
    Object.keys(DATA.world.locations).forEach(function (to) {
      if (to === from || !locationAvailable(to) || !canTravelFromUnlocked(to)) return;
      const cost = travelCost(from, to);
      if (cost && cost.fuel < min) min = cost.fuel;
    });
    return min;
  }
  function locationAvailable(dest) {
    const loc = DATA.world.locations[dest];
    return !!loc && (!loc.tradeOnly || isTrade());
  }
  function canTravel(dest) {
    if (!locationAvailable(dest)) return { ok: false, why: "not on this adventure" };
    if (state.night === 3 && (dest === "canal" || state.location === "canal")) {
      if (state.truth === "vault") return { ok: false, why: "lock bulletin: low water · no passage this shift" };
      if (state.truth === "both" && state.clock < parseClock("08:00")) return { ok: false, why: "lock bulletin: gate reopens at 08:00" };
    }
    const place = DATA.world.locations[dest];
    if (place.unlockFlag && !state.flags[place.unlockFlag]) return { ok: false, why: place.lockedText || "route not discovered" };
    if (dest === state.location) return { ok: false, why: "moored here" };
    if (transient.travelling) return { ok: false, why: "under way" };
    if (state.confront) return { ok: false, why: activeCase.confrontation.busyLabel };
    const cost = travelCost(state.location, dest);
    if (!cost) return { ok: false, why: "no route" };
    if (state.fuel < cost.fuel) return { ok: false, why: "needs " + cost.fuel + " fuel", cost: cost };
    return { ok: true, cost: cost };
  }

  // Clicking a destination ends up here.
  function travelTo(dest) {
    const check = canTravel(dest);
    if (!check.ok) {
      if (check.why && check.why.indexOf("needs") === 0) toast("Not enough fuel. Refuel at Landing 3 or radio the tug.");
      return;
    }
    const from = state.location;
    const minutes = travelMinutes(check.cost);
    const before = state.clock;
    state.fuel -= check.cost.fuel;
    state.clock += minutes;
    state.canArmed = false;
    state.location = dest;
    transient.marketSpot = null;
    state.visited[dest] = (state.visited[dest] || 0) + 1;
    const crossing = crossingLines(from, dest);
    state.lastResult = crossing.length ? { label: "Crossing to " + DATA.world.locations[dest].short, lines: crossing, clues: [] } : null;
    if (isTrade()) { advanceMarket(before); observeMarket(); }   // the board you moor at, read on arrival
    saveGame();
    if (settings.station === "off" && !settings.effects && !transient.hintedRadio) {
      transient.hintedRadio = true;
      toast(touchFirst() ? "Sound is off. Open Menu for gentle effects, or tune the radio for music." : "Sound is off. Menu (M) has gentle effects; radio (R) has music.");
    }
    beginCrossing(from, dest, minutes, check.cost.fuel);
  }

  function crossingLines(from, to) {
    if (!isTrade()) return [];
    const rules = (DATA.world.crossings || []).filter(function (rule) {
      return (!rule.to || rule.to === to) && (!rule.from || rule.from === from) && conditionHolds(rule.when);
    });
    if (!rules.length) return [];
    const rule = rules[0], key = "crossing:" + rule.id;
    const index = state.used[key] || 0;
    state.used[key] = index + 1;
    return expandLines(rule.exchanges[index % rule.exchanges.length]);
  }

  function beginCrossing(from, dest, minutes, fuel) {
    transient.showing = null;
    transient.travelling = { from: from, to: dest, minutes: minutes, fuel: fuel };
    document.body.classList.add("travelling");
    positionFerry(dest, from, true);
    render();
    syncAspect(true);                        // a close camera pulls back for the crossing
    const wait = motionReduced() ? 80 : FERRY_MS;
    sfxCastOff(wait, fuel === 0);            // a crossing that cost no fuel is the tug towing us
    clearTimeout(transient.timer);
    transient.timer = setTimeout(finishCrossing, wait);
  }
  function finishCrossing() {
    transient.travelling = null;
    document.body.classList.remove("travelling");
    sfxMoor();
    render();
    syncAspect(true);                        // and glides in on the quay once moored
    focusEncounter();
    checkDawn();                             // a crossing can carry a gold night into dawn
  }

  // Moves the boat in the picture. CSS animates the transform unless animate=false.
  function positionFerry(dest, from, animate) {
    const target = DATA.world.locations[dest].ferry;
    const ferry = dom.ferry;
    if (!animate) ferry.style.transition = "none";
    ferry.style.transform = "translate(" + target.x + "px, " + target.y + "px)";
    if (from && from !== dest) {
      const origin = DATA.world.locations[from].ferry;
      ferry.classList.toggle("facing-left", origin.x > target.x);
    }
    if (!animate) {
      void ferry.getBoundingClientRect();   // force the browser to apply the jump first
      ferry.style.transition = "";
    }
  }

  /* ------------------------------------------------------------------ */
  /* 8 · ACTIONS                                                         */
  /* ------------------------------------------------------------------ */
  function locationActions() {
    const list = activeCase.actions[state.location] || [];
    return list.concat(casualActions()).filter(function (action) {
      if (action.once && state.used[action.id]) return false;
      if (isTrade() && action.freightBuy && freightHeld() >= 2) return false;
      if (isTrade() && state.location === "market" && state.flags.companion_nao && action.id !== "life_nao_return" && action.lines && action.lines.some(function (line) { return line.who === "nao"; })) return false;
      return conditionHolds(action.when);
    });
  }

  // Optional conversations share existing save counters. Unheard lines come first, and
  // repeat chats never advance the clock or grant relationship points, clues or money.
  function chatModeMatches(entry) {
    return !entry.mode || entry.mode === (isTrade() ? "trade" : "case");
  }
  function casualActions() {
    if (!state || state.resolved || state.confront) return [];
    return Object.keys(CHAT).filter(function (id) {
      return CHAT[id].visits.some(function (v) {
        return v.at === state.location && chatModeMatches(v) && conditionHolds(v.when);
      });
    }).map(function (id) {
      const person = DATA.world.characters[id] || TRADE.characters[id];
      return { id: "chat_" + id, casual: id, kind: "talk", minutes: 0,
        label: id === "radio" ? "Check in with Bengt · Channel 9" : "Chat with " + person.name,
        // Moving characters bind to the figure at their current quay.
        thing: (CHAT[id].thingsByPlace && CHAT[id].thingsByPlace[state.location]) || CHAT[id].thing,
        marketSpot: CHAT[id].marketSpot };
    });
  }
  function nextCasual(id) {
    const pool = CHAT[id].lines.filter(function (line) { return chatModeMatches(line) && conditionHolds(line.when); }).sort(function (a, b) { return Number(!!b.when) - Number(!!a.when); });
    let index = pool.findIndex(function (line) { return !state.used["chat_seen:" + id + ":" + line.id]; });
    if (index < 0) {
      const last = state.used["chat_last:" + id];
      index = pool.findIndex(function (line) { return CHAT[id].lines.indexOf(line) + 1 === last; });
      index = (index + 1) % pool.length;
    }
    const line = pool[index];
    state.used["chat_seen:" + id + ":" + line.id] = 1;
    state.used["chat_last:" + id] = CHAT[id].lines.indexOf(line) + 1;
    return [{ type: "speech", who: id, text: line.text }];
  }
  function lessonLines(topic) {
    const def = window.NEON_TIDES_LESSONS[topic];
    const pool = def.lines.filter(function (line) { return conditionHolds(line.when); }).sort(function (a, b) { return Number(!!b.when) - Number(!!a.when); });
    const prefix = "lesson:" + topic + ":";
    let line = pool.find(function (entry) { return !state.used[prefix + entry.id]; });
    if (!line) {
      const last = state.used[prefix + "last"] || 0;
      const old = pool.findIndex(function (entry) { return def.lines.indexOf(entry) + 1 === last; });
      line = pool[(old + 1) % pool.length];
    }
    state.used[prefix + line.id] = 1;
    state.used[prefix + "last"] = def.lines.indexOf(line) + 1;
    return [{ type: "speech", who: "nao", text: line.text }];
  }
  function actionLines(action) {
    if (action.casual) return nextCasual(action.casual);
    if (action.lesson) return lessonLines(action.lesson);
    const lines = expandLines(action.lines);
    if (action.directory) return lines;
    // Preserve the first reading of each distinct story response. Once read, the same
    // repeatable Talk action offers small talk; changed evidence unlocks its new response.
    const speaker = lines.find(function (line) { return line.type === "speech" && CHAT[line.who]; });
    if (action.kind === "talk" && !action.once && speaker) {
      const key = "dialogue:" + action.id + ":" + hashSeed(JSON.stringify(lines));
      if (state.used[key]) return nextCasual(speaker.who);
      state.used[key] = 1;
    }
    return lines;
  }

  // Actions the game itself adds: the confrontation, the drink, the tug.
  function systemActions() {
    if (isTrade()) return tradeSystemActions();
    const out = [];
    const world = DATA.world;
    const conf = activeCase.confrontation;
    if (state.location === conf.at && state.flags.accepted && !state.resolved && state.clues.length > 0) {
      out.push({ id: "sys_confront", kind: "confront", label: conf.actionLabel, minutes: 0 });
    }
    if (state.cans > 0 && !state.canArmed) {
      out.push({ id: "sys_drink", kind: "use", label: "Drink a " + world.drink.name + " — next crossing takes no time", minutes: 0 });
    }
    if (state.location !== "landing" && state.fuel < cheapestExit(state.location)) {
      out.push({ id: "sys_tug", kind: "system", label: world.tug.label, minutes: world.tug.minutes });
    }
    return out;
  }

  function actionMinutes(action) {
    if (action.effects && action.effects.clockTo) return Math.max(0, parseClock(action.effects.clockTo) - state.clock);
    return action.minutes || 0;
  }

  function performAction(actionId) {
    if (transient.travelling || state.resolved || state.confront) return;
    if (isTrade()) { performTradeAction(actionId); return; }
    if (actionId === "sys_confront") { startConfrontation(); return; }
    if (actionId === "sys_drink") { drinkCan(); return; }
    if (actionId === "sys_tug") { radioTug(); return; }

    const action = locationActions().filter(function (a) { return a.id === actionId; })[0];
    if (!action) return;
    if (action.kind === "show") {           // pick the clue first (renderShowPicker); performShow() does the rest
      transient.showing = action.id;
      render();
      focusEncounter();
      return;
    }

    // Text reflects the moment of speaking, so expand it before anything changes.
    const lines = actionLines(action);

    state.clock += actionMinutes(action);
    if (action.fuel) state.fuel = Math.max(0, state.fuel - action.fuel);
    state.used[action.id] = (state.used[action.id] || 0) + 1;
    (action.sets || []).forEach(function (flag) { state.flags[flag] = true; });
    applyEffects(action.effects);

    const newClues = [];
    (action.gives || []).forEach(function (id) { if (addClue(id)) newClues.push(id); });
    (action.givesWhen || []).forEach(function (g) {
      if (conditionHolds(g.if)) (g.gives || []).forEach(function (id) { if (addClue(id)) newClues.push(id); });
    });

    state.lastResult = { label: action.label, lines: lines, clues: newClues };
    // A clue that reveals a line of the timeline: point at the notebook once per line, so the timeline
    // is never a surprise at the counter.
    const revealed = timelineRows().filter(function (row) {
      return !state.timeline[row.id] && state.hinted.indexOf(row.id) === -1 && (row.clues || []).some(function (id) { return newClues.indexOf(id) !== -1; });
    });
    revealed.forEach(function (row) { state.hinted.push(row.id); });
    saveGame();
    render();
    focusEncounter();
    if (revealed.length && hintsOn()) toast("Notebook: the timeline has " + (revealed.length === 1 ? "a line" : revealed.length + " lines") + " you can fill in now.");
  }

  // Showing a clue (3.3): the witness answers the clue they are shown, or with `otherwise`. Free of
  // clock time and repeatable; the picker marks what has been shown to whom.
  function performShow(actionId, clueId) {
    const action = locationActions().filter(function (a) { return a.id === actionId && a.kind === "show"; })[0];
    if (!action || !hasClue(clueId)) return;
    const response = action.shows[clueId];
    const entries = !response ? action.otherwise : (Array.isArray(response) ? response : response.lines);
    const lines = expandLines(entries);
    const newClues = [];
    if (response && !Array.isArray(response)) {
      (response.sets || []).forEach(function (flag) { state.flags[flag] = true; });
      (response.gives || []).forEach(function (id) { if (addClue(id)) newClues.push(id); });
    }
    state.used[action.id] = (state.used[action.id] || 0) + 1;
    if (!state.shown[action.id]) state.shown[action.id] = [];
    if (state.shown[action.id].indexOf(clueId) === -1) state.shown[action.id].push(clueId);
    transient.showing = null;
    state.lastResult = { label: action.label.replace(/ something.*$/, "") + ": " + activeCase.clues[clueId].title, lines: lines, clues: newClues };
    saveGame();
    render();
    focusEncounter();
  }
  function cancelShow() {
    transient.showing = null;
    render();
    focusEncounter();
  }

  function applyEffects(effects) {
    if (!effects) return;
    (effects.clearFlags || []).forEach(function (flag) { delete state.flags[flag]; });
    if (effects.fuel) state.fuel = Math.min(DATA.meta.fuelMax, Math.max(0, state.fuel + effects.fuel));
    if (effects.cans) state.cans = Math.max(0, state.cans + effects.cans);
    if (effects.refuel) state.fuel = DATA.meta.fuelMax;
    if (isTrade() && effects.credits) {
      state.credits += effects.credits;
      state.rewardCredits = (state.rewardCredits || 0) + effects.credits;
    }
    if (isTrade() && effects.rewardGold) {
      state.rewardGrams = (state.rewardGrams || 0) + effects.rewardGold;
      state.gold = MARKET.lots.buy(state.gold, effects.rewardGold, 0, { where: state.location, at: state.clock, provenance: "Earned for returning the Hoshimi lantern kits. Sora's stamped payment." });
    }
    if (isTrade() && effects.breakfastSettlement && !state.flags.nb_supply_settled) {
      const offer = breakfastOffer(!!state.flags.nb_late);
      state.breakfastSold = offer.sold;
      state.breakfastRevenue = (state.breakfastRevenue || 0) + offer.revenue;
      state.credits += offer.revenue;
      state.flags.nb_supply_settled = true;
    }
    if (isTrade() && effects.canalTeaBuy) state.canalTrade = { cost: 24, revenue: 0, units: 1 };
    if (isTrade() && effects.canalTeaSell && state.canalTrade && state.canalTrade.units === 1) {
      state.credits += 38;
      state.canalTrade.revenue = 38;
      state.canalTrade.units = 0;
    }
    if (effects.parcelCompare && TRADE.assayQuest) {
      const checked = MARKET.compareAssay(TRADE.assayQuest.receipt, TRADE.assayQuest.assay);
      state.flags.ay_mismatch = checked.code === "lot-mismatch";
    }
    if (effects.clockTo) state.clock = Math.max(state.clock, parseClock(effects.clockTo));
  }

  // The notebook keeps the clue's exact wording; only the id is stored.
  function addClue(id) {
    if (!activeCase.clues[id] || hasClue(id)) return false;
    state.clues.push({ id: id, foundAt: state.clock, where: state.location });
    return true;
  }

  function drinkCan() {
    if (state.cans <= 0 || state.canArmed) return;
    state.cans -= 1;
    state.canArmed = true;
    state.lastResult = { label: DATA.world.drink.name, lines: expandLines(DATA.world.drink.lines), clues: [] };
    saveGame();
    render();
  }

  // Recovery route: an empty tank away from the pump is never a dead end.
  function radioTug() {
    const from = state.location;
    const tug = DATA.world.tug;
    const before = state.clock;
    state.clock += tug.minutes;
    state.location = "landing";
    state.visited.landing = (state.visited.landing || 0) + 1;
    state.lastResult = { label: tug.label, lines: expandLines(tug.lines), clues: [] };
    if (isTrade()) { advanceMarket(before); observeMarket(); }
    saveGame();
    beginCrossing(from, "landing", tug.minutes, 0);
  }

  /* ------------------------------------------------------------------ */
  /* 8b · THE GOLD NIGHT                                                 */
  /* A shift where the player trades physical gold on what they hear.    */
  /* trade.js holds the text and numbers, market.js prices them; this    */
  /* section keeps the state and reuses travel, actions, lines, things,  */
  /* saves and the notebook from the investigations.                     */
  /* ------------------------------------------------------------------ */
  function isTrade() { return !!state && state.kind === "trade"; }
  function relOf(id) { return (state.rel && state.rel[id]) || 0; }
  function heard(id) { return !!state.rumors && state.rumors.some(function (r) { return r.id === id; }); }
  function goldHeld() { return state.gold ? MARKET.lots.total(state.gold) : 0; }
  function grams(n) { return (Math.round(n * 100) / 100) + " g"; }
  function fill(text, vars) {
    return String(text || "").replace(/\{(\w+)\}/g, function (all, key) { return vars[key] !== undefined ? String(vars[key]) : all; });
  }
  // The player's own trades are passed in, so the quote carries their weight on the price and what the
  // dealer still has to sell or will still take (4.0.1).
  function tradeQuote(loc) { return MARKET.quote(TRADE, state.truth, state.seed, loc || state.location, state.clock, state.trades); }
  function dawnClock() { return parseClock(TRADE.meta.dawnClock || "06:00"); }
  const REL_MAX = 3;

  // The night has the shape the shared renderers expect from a case, with nothing to confront.
  function buildTradeNight() {
    const world = DATA.world;
    const built = {
      kind: "trade", id: TRADE.meta.id, title: TRADE.meta.title, truth: null,
      allClues: {}, ownClues: [], clues: {}, scenes: TRADE.scenes, actions: {},
      confrontation: { at: null, requires: [], explanations: [], challenge: {}, stageLabels: {}, busyLabel: "" },
      threads: [], objectives: [], timeline: [], names: [],
      things: Object.assign({}, world.things, TRADE.things),
      sceneClasses: (TRADE.sceneClasses || []).slice(),
      responses: {}, finalChoices: [], endings: {}, omitted: []
    };
    Object.keys(world.locations).forEach(function (loc) { built.actions[loc] = (TRADE.actions[loc] || []).slice(); });
    return built;
  }

  function newTradeState(seed) {
    const clock = parseClock(TRADE.meta.startClock);
    const lots = TRADE.meta.startGold.map(function (lot) { return Object.assign({ at: clock }, lot); });
    const truth = MARKET.pickTruth(TRADE, seed);
    const start = MARKET.quote(TRADE, truth, seed, "bar", clock);
    return {
      version: SAVE_VERSION,
      kind: "trade",
      seed: seed,
      variantId: TRADE.meta.id,
      truth: truth,                  // hidden; fixed here and never recomputed
      location: "bar",
      clock: clock,
      fuel: TRADE.meta.startFuel,
      cans: 0, canArmed: false,
      credits: TRADE.meta.startCredits,
      spent: 0,                      // credits spent on orders and fuel (not on gold)
      gold: lots,                   // lots: { grams, cost, karat, purity, provenance, where, at }
      trades: [],                    // { kind: buy|sell, grams, price, total, basis?, at, where }
      rumors: [],                    // { id, at, where }: what the notebook has written down
      rel: {},                       // personId -> 0..3, never shown as a number
      convos: [],                    // conversations already had
      ambience: {},                  // placeId -> ambience lines played
      seen: {},                      // placeId -> { buy, sell, at }: the last board you read there
      fired: [],                     // { id, at }: events the clock has passed (debug, the morning)
      marketNote: null,              // "the board has changed since…", for the screen now
      start: { credits: TRADE.meta.startCredits, grams: MARKET.lots.total(lots), sell: start.sell, worth: MARKET.worth(TRADE.meta.startCredits, lots, start.sell) },
      finish: null,
      flags: {}, clues: [], timeline: {}, shown: {}, hinted: [], used: {},
      visited: { bar: 1 },
      lastResult: null, confront: null,
      resolved: false, ending: null, endedAt: null,
      startedAt: new Date().toISOString()
    };
  }

  function startTradeNight(seedText) {
    const seed = normaliseSeed(seedText) || randomSeed();
    TRADE = BASE_TRADE;
    setState(newTradeState(seed));
    transient.objective = null;
    observeMarket();                     // the first board is read, nothing has moved yet
    saveGame();
    setMode("play");
    positionFerry(state.location, null, false);
    render();
    toast("Cast off for adventure · seed " + seed);
    debugMarket("start");
  }

  // A chapter transition is only allowed from a finished first night. Create and
  // save the entire new state once; retries cannot duplicate the carried purse.
  function startSecondNight() {
    if (!SECOND_TRADE || !isTrade() || !state.resolved || (state.night || 1) >= 3) return false;
    const old = state;
    const chapter = (old.night || 1) + 1;
    TRADE = chapter === 3 ? THIRD_TRADE : SECOND_TRADE;
    if (!TRADE) return false;
    const next = newTradeState(old.seed + (chapter === 2 ? ":night-2" : ":morning-3"));
    next.night = chapter;
    next.credits = old.credits;
    next.gold = JSON.parse(JSON.stringify(old.gold));
    next.fuel = old.fuel;
    next.rel = Object.assign({}, old.rel);
    next.previous = { seed: old.seed, flags: Object.assign({}, old.previous ? old.previous.flags : {}), worth: old.finish.worth };
    Object.keys(old.flags).filter(function (flag) { return old.flags[flag] === true && !/^end_/.test(flag) && flag !== "companion_nao" && flag !== "cf_aboard"; }).forEach(function (flag) {
      next.previous.flags[flag] = true;
    });
    if (old.flags.exp_chart) next.flags.exp_chart = true;
    if (old.flags.ct_route) next.flags.ct_route = true;
    ["yard_pump_fixed", "yard_done", "yard_star_found", "yard_star_returned", "ay_started", "ay_stamp", "ay_receipt", "ay_compared", "ay_mismatch", "ay_done", "wire_umbrella_started", "wire_umbrella_found", "wire_umbrella_done"].forEach(function (flag) { if (old.flags[flag]) next.flags[flag] = true; });
    next.wireRead = Object.assign({}, old.wireRead || {});
    next.wirePins = Object.assign({}, old.wirePins || {});
    next.cargo = { crates: 0, bought: 0, cost: 0, revenue: 0, sold: 0, returned: 0, courier: false };
    Object.keys(old.used).filter(function (key) { return key.indexOf("chat_") === 0 || key.indexOf("lesson:") === 0 || key.indexOf("ay_") === 0 || key.indexOf("wire_umbrella_") === 0; }).forEach(function (key) { next.used[key] = old.used[key]; });
    const q = MARKET.quote(TRADE, next.truth, next.seed, "bar", next.clock);
    next.start = { credits: next.credits, grams: MARKET.lots.total(next.gold), sell: q.sell, worth: MARKET.worth(next.credits, next.gold, q.sell) };
    setState(next);
    transient.objective = null;
    observeMarket();
    saveGame();
    setMode("play");
    positionFerry(state.location, null, false);
    render();
    focusEncounter();
    toast(TRADE.meta.title);
    return true;
  }
  function nextNightLabel() {
    return state && state.night === 3 ? "Start fresh Night One" : state && state.night === 2 ? "Continue to Chapter Three · Morning After the Lanterns" : "Continue to Night Two · Keep earnings & choices";
  }
  function continueTradeStory() { if (state && (state.night || 1) < 3 && SECOND_TRADE) return startSecondNight(); startTradeNight(""); return true; }

  // The trade data must hang together before anyone plays it. Returns a list of problems.
  function validateTrade() {
    const problems = [];
    const world = DATA.world;
    const truthIds = TRADE.truths.map(function (t) { return t.id; });
    const places = Object.keys(world.locations);
    const seeds = {};
    TRADE.truths.forEach(function (t) {
      if (!t.seeds || !t.seeds.length) problems.push("truth '" + t.id + "' has no pinned seed");
      (t.seeds || []).forEach(function (s) {
        if (seeds[s]) problems.push("seed '" + s + "' is pinned twice");
        seeds[s] = true;
        if (s !== normaliseSeed(s)) problems.push("pinned seed '" + s + "' must be trimmed lower case");
      });
    });
    if (!TRADE.market.dealers.bar) problems.push("Kurage 33 needs a dealer: the night is valued at its scale");
    Object.keys(TRADE.market.dealers).forEach(function (loc) {
      const d = TRADE.market.dealers[loc];
      if (!world.locations[loc]) problems.push("dealer at unknown place '" + loc + "'");
      if (d.thing && typeof document !== "undefined" && !document.getElementById(d.thing)) problems.push("dealer thing '" + d.thing + "' is not drawn in the picture");
      if (!d.sellText) problems.push("dealer at " + loc + " has no sellText");
      if (!d.buyOnly && !d.buyText) problems.push("dealer at " + loc + " has no buyText");
      (d.truths || []).forEach(function (t) { if (truthIds.indexOf(t) === -1) problems.push("dealer at " + loc + " names unknown truth '" + t + "'"); });
    });
    const eventIds = {};
    TRADE.events.forEach(function (e) {
      if (eventIds[e.id]) problems.push("duplicate event '" + e.id + "'");
      eventIds[e.id] = true;
      Object.keys(e.truths || {}).forEach(function (t) {
        if (truthIds.indexOf(t) === -1) problems.push("event '" + e.id + "' names unknown truth '" + t + "'");
        (e.truths[t].mods || []).forEach(function (m) {
          const locs = m.loc === "*" ? [] : (Array.isArray(m.loc) ? m.loc : [m.loc]);
          locs.concat(m.except || []).forEach(function (l) { if (!world.locations[l]) problems.push("event '" + e.id + "' moves unknown place '" + l + "'"); });
          if (typeof m.pct !== "number") problems.push("event '" + e.id + "' has a modifier without pct");
        });
      });
    });
    Object.keys(TRADE.rumors).forEach(function (id) {
      const r = TRADE.rumors[id];
      if (!r.note) problems.push("rumor '" + id + "' has no note");
      if (r.source !== "you" && !world.characters[r.source] && !TRADE.characters[r.source]) problems.push("rumor '" + id + "' has unknown source '" + r.source + "'");
      if (!world.locations[r.origin]) problems.push("rumor '" + id + "' comes from unknown place '" + r.origin + "'");
      Object.keys(r.truth || {}).forEach(function (t) { if (truthIds.indexOf(t) === -1) problems.push("rumor '" + id + "' names unknown truth '" + t + "'"); });
      if (r.relatedEvent && !eventIds[r.relatedEvent]) problems.push("rumor '" + id + "' names unknown event '" + r.relatedEvent + "'");
    });
    function checkHears(owner, item) {
      (item.hears || []).forEach(function (id) { if (!TRADE.rumors[id]) problems.push(owner + " hears unknown rumor '" + id + "'"); });
      (item.hearsWhen || []).forEach(function (g) { (g.hears || []).forEach(function (id) { if (!TRADE.rumors[id]) problems.push(owner + " hears unknown rumor '" + id + "'"); }); });
    }
    const things = Object.assign({}, world.things, TRADE.things);
    const orders = {};
    places.forEach(function (loc) {
      if (!TRADE.scenes[loc] || !TRADE.scenes[loc].first) problems.push("missing night scene text for " + loc);
      const seen = {};
      (TRADE.actions[loc] || []).forEach(function (a) {
        if (seen[a.id]) problems.push("duplicate night action '" + a.id + "' at " + loc);
        seen[a.id] = true;
        if (["talk", "order", "search", "system"].indexOf(a.kind) === -1) problems.push("night action " + a.id + " has unknown kind '" + a.kind + "'");
        if (a.cost !== undefined && !(typeof a.cost === "number" && a.cost >= 0)) problems.push("night action " + a.id + " has a bad cost");
        if (a.thing && !things[a.thing]) problems.push("night action " + a.id + " names unknown thing '" + a.thing + "'");
        if (a.thing && typeof document !== "undefined" && !document.getElementById(a.thing)) problems.push("night action " + a.id + "'s thing '" + a.thing + "' is not drawn");
        if (a.sitting) orders[loc + ":" + a.sitting] = true;
        checkHears("night action " + a.id, a);
      });
    });
    const convoIds = {};
    TRADE.conversations.forEach(function (c) {
      if (convoIds[c.id]) problems.push("duplicate conversation '" + c.id + "'");
      convoIds[c.id] = true;
      if (!world.locations[c.at]) problems.push("conversation '" + c.id + "' at unknown place '" + c.at + "'");
      if (!c.via || !c.via.length) problems.push("conversation '" + c.id + "' has no via");
      (c.via || []).forEach(function (v) { if (!orders[c.at + ":" + v]) problems.push("conversation '" + c.id + "' waits for an order nobody can place there ('" + v + "')"); });
      checkHears("conversation " + c.id, c);
    });
    TRADE.ambience.forEach(function (a, i) { if (!world.locations[a.at] || !a.text) problems.push("ambience line " + i + " is incomplete"); });
    Object.keys(TRADE.people).forEach(function (id) { if (!world.characters[id] && !TRADE.characters[id]) problems.push("people names unknown person '" + id + "'"); });
    if (!TRADE.ending || !TRADE.ending.byTruth) problems.push("no morning wire");
    if (!TRADE.meta.dawnClock) problems.push("meta.dawnClock is missing: the night must end by itself");
    if (!TRADE.ending.reflections || !TRADE.ending.reflections.length) problems.push("no reflections for the morning card");
    Object.keys(TRADE.market.dealers).forEach(function (loc) {
      const d = TRADE.market.dealers[loc];
      if (!d.depth) problems.push("dealer at " + loc + " has no depth: your own trades would never move his price");
      if (!d.buyOnly && d.stock === undefined) problems.push("dealer at " + loc + " has no stock: he could sell you gold without end");
      if (d.buyOnly && d.limit === undefined) problems.push("dealer at " + loc + " has no limit: he could buy your gold without end");
      (d.stockArrivals || []).forEach(function (arrival) {
        if (!/^\d{2}:\d{2}$/.test(arrival.at) || !Number.isFinite(arrival.grams) || arrival.grams <= 0) problems.push("dealer at " + loc + " has an invalid stock arrival");
        (arrival.truths || []).forEach(function (truth) { if (truthIds.indexOf(truth) === -1) problems.push("dealer at " + loc + " has a stock arrival for unknown truth '" + truth + "'"); });
      });
    });
    truthIds.forEach(function (t) { if (!TRADE.ending.byTruth[t]) problems.push("no morning wire for truth '" + t + "'"); });
    return problems;
  }

  function applyRel(rel) {
    if (!rel) return;
    Object.keys(rel).forEach(function (id) { state.rel[id] = Math.max(0, Math.min(REL_MAX, relOf(id) + rel[id])); });
  }
  function hearRumor(id, into) {
    if (!TRADE.rumors[id] || heard(id)) return;
    state.rumors.push({ id: id, at: state.clock, where: state.location });
    into.push(id);
  }
  function hearsOf(item, into) {
    (item.hears || []).forEach(function (id) { hearRumor(id, into); });
    (item.hearsWhen || []).forEach(function (g) { if (conditionHolds(g.if)) (g.hears || []).forEach(function (id) { hearRumor(id, into); }); });
  }

  // The clock moved: note every event whose time has come (not only the ones just crossed, so a clock
  // set from the console or a save from an older build catches up). Prices need no update: they are
  // read at the minute.
  function advanceMarket(before) {
    MARKET.eventsBetween(TRADE, state.truth, -Infinity, state.clock).forEach(function (e) {
      if (!state.fired.some(function (f) { return f.id === e.id; })) state.fired.push({ id: e.id, at: parseClock(e.at) });
    });
    debugMarket("clock " + formatClock(before) + " → " + formatClock(state.clock));
  }
  // Reading the board where you are: if it moved since you last read it here, say so once.
  function observeMarket() {
    state.marketNote = null;
    const q = tradeQuote();
    if (!q) return;
    const prev = state.seen[state.location];
    if (prev && Math.abs(q.sell - prev.sell) >= 2 && q.dealer.moved) {
      state.marketNote = fill(q.dealer.moved, { time: formatClock(prev.at), old: prev.sell, new: q.sell });
    }
    state.seen[state.location] = { buy: q.buy, sell: q.sell, at: state.clock };
  }

  // Sitting with an order: the first conversation here that waits for it and holds, else a small moment.
  function sitDown(order) {
    const here = state.location;
    const heardNow = [];
    const convo = TRADE.conversations.filter(function (c) {
      return c.at === here && c.via.indexOf(order) !== -1 && state.convos.indexOf(c.id) === -1 && conditionHolds(c.when);
    })[0];
    if (convo) {
      const lines = expandLines(convo.lines);   // read before its own flags change
      state.convos.push(convo.id);
      (convo.sets || []).forEach(function (flag) { state.flags[flag] = true; });
      applyRel(convo.rel);
      hearsOf(convo, heardNow);
      return { lines: lines, heard: heardNow };
    }
    const pool = TRADE.ambience.filter(function (a) { return a.at === here && a.via.indexOf(order) !== -1 && conditionHolds(a.when); });
    if (!pool.length) return { lines: [], heard: [] };
    const n = state.ambience[here] || 0;
    state.ambience[here] = n + 1;
    return { lines: [{ type: "p", text: pool[n % pool.length].text }], heard: [] };
  }

  function tradeSystemActions() {
    const out = [];
    if (state.resolved) return out;
    const q = tradeQuote();
    if (q) out.push({ id: "sys_scale", kind: "trade", label: q.dealer.name, thing: q.dealer.thing, minutes: 0 });
    if (state.location !== "landing" && state.fuel < cheapestExit(state.location)) {
      out.push({ id: "sys_tug", kind: "system", label: DATA.world.tug.label, minutes: DATA.world.tug.minutes });
    }
    if (state.clock >= parseClock(TRADE.meta.turnInFrom)) {
      out.push({ id: "sys_turn_in", kind: "system", label: state.night === 3 ? "Rest aboard the Tern · Finish the morning shift" : "Rest aboard the Tern · Finish the night", minutes: 0 });
    }
    return out;
  }

  function performTradeAction(actionId) {
    if (actionId === "sys_scale") { focusGold(); return; }
    if (actionId === "sys_turn_in") { endTradeNight(); return; }
    if (actionId === "sys_tug") { radioTug(); return; }
    if (state.resolved) return;
    const action = locationActions().filter(function (a) { return a.id === actionId; })[0];
    if (!action) return;
    const cost = action.cost || 0;
    if (action.wireBoard) { openHarbourWire(); return; }
    if (action.readingRack) transient.reviewOpen = true;
    if (cost > state.credits) { toast("Not enough credits for that."); return; }
    // A repair order is a real sale, not an adventure cash reward. Freeze this quote
    // before any action changes the clock or flags, and share the dealer's buying cap.
    const sale = action.goldSale, quote = sale ? tradeQuote() : null;
    if (sale && (!quote || goldHeld() < sale.grams || quote.canSell < sale.grams)) {
      toast(goldHeld() < sale.grams ? "Kenji needs two grams. Keep exploring, or report to Sora for the courier fee." : "Sora's buying allowance cannot cover this order. You can still take the courier fee.");
      return;
    }
    if (action.freightBuy && ((state.freight || {})[action.freightBuy] || freightHeld() >= 2)) return;
    if (action.freightDeliver && (!(state.freight || {})[action.freightDeliver] || state.freight[action.freightDeliver].units !== 1)) return;
    const lines = actionLines(action);   // the moment of speaking, before anything changes
    if (action.marketBrowse) transient.marketSpot = action.marketBrowse;
    if (action.marketBrowse === "gold") {
      const board = tradeQuote();
      if (board) lines.push({ type: "p", text: "Current board · Buy " + board.buy + " cr/g · Sell " + board.sell + " cr/g · " + grams(board.canBuy) + " available to buy · " + grams(board.canSell) + " buying allowance remains." });
    }
    const before = state.clock;
    state.credits -= cost;
    state.spent = (state.spent || 0) + cost;   // noodles, tea and fuel: the morning card counts them apart
    if (action.freightBuy) {
      if (!state.freight) state.freight = {};
      state.freight[action.freightBuy] = { cost: cost, revenue: 0, units: 1 };
    }
    if (action.freightDeliver) {
      const cargo = state.freight[action.freightDeliver], def = TRADE.freight[action.freightDeliver];
      cargo.units = 0; cargo.revenue = def.payment;
      state.credits += def.payment;
      lines.push({ type: "p", text: "Purchase " + cargo.cost + " cr · Sales " + cargo.revenue + " cr · " + (cargo.revenue - cargo.cost) + " cr gross margin, before fuel and time." });
    }
    if (action.cargoBuy) {
      state.cargo.crates = action.cargoBuy.crates;
      state.cargo.bought = action.cargoBuy.crates;
      state.cargo.courier = !!action.cargoBuy.courier;
      state.cargo.cost += cost;
    }
    if (action.cargoSell || action.cargoReturn) {
      const crates = state.cargo.crates;
      const total = state.cargo.courier ? (action.cargoSell ? 12 : 0) : crates * (action.cargoSell ? 30 : 16);
      state.credits += total;
      if (state.cargo.courier) state.rewardCredits = (state.rewardCredits || 0) + total;
      else state.cargo.revenue += total;
      state.cargo[action.cargoSell ? "sold" : "returned"] = crates;
      state.cargo.crates = 0;
      lines.push({ type: "p", text: crates + " sealed crate" + (crates === 1 ? "" : "s") + " handed over · " + total + " cr received" + (state.cargo.courier ? " as a courier fee" : " in the cargo account") + ". Fuel and time are counted separately." });
    }
    if (action.supplyPurchase) state.breakfastCost = (state.breakfastCost || 0) + cost;
    state.clock += actionMinutes(action);
    if (action.fuel) state.fuel = Math.max(0, state.fuel - action.fuel);
    state.used[action.id] = (state.used[action.id] || 0) + 1;
    (action.sets || []).forEach(function (flag) { state.flags[flag] = true; });
    applyEffects(action.effects);
    applyRel(action.rel);
    if (action.breakfastOpen && state.flags.nb_batch_owned) {
      lines.push({ type: "p", text: "Your extra batch · " + (state.breakfastSold || 0) + " of 12 portions sold · " + (state.breakfastRevenue || 0) + " cr returned · " + (state.breakfastCost || 0) + " cr purchase cost · " + ((state.breakfastRevenue || 0) - (state.breakfastCost || 0)) + " cr before fuel and time. Unsold portions go to the morning crew." });
    }
    if (sale) {
      const sold = MARKET.lots.sell(state.gold, sale.grams);
      const price = quote.sell + sale.premium, total = Math.round(sold.sold * price);
      state.gold = sold.lots;
      state.credits += total;
      state.trades.push({ kind: "sell", grams: sold.sold, price: price, total: total, basis: sold.basis, at: state.clock, where: state.location, contract: action.id });
      lines.push({ type: "p", text: "Sold " + grams(sold.sold) + " at " + price + " cr/g · Received " + total + " cr. This uses two grams of Sora's eighteen-gram buying allowance." });
    }
    soundCue(action.breakfastOpen ? "opening" : (sale ? "sell" : (action.sound || (TRADE.soundscape && TRADE.soundscape.actions[action.id]))));
    const heardNow = [];
    hearsOf(action, heardNow);
    advanceMarket(before);
    if (action.sitting) {
      const sat = sitDown(action.sitting);
      sat.lines.forEach(function (line) { lines.push(line); });
      sat.heard.forEach(function (id) { heardNow.push(id); });
    }
    observeMarket();
    state.lastResult = { label: action.label, lines: lines, clues: [], heard: heardNow };
    saveGame();
    render();
    focusEncounter();
    checkDawn();
  }
  // At dawn the night ends by itself (4.0.1); the last thing you did stays on screen under the card.
  function checkDawn() {
    if (isTrade() && !state.resolved && !transient.travelling && state.clock >= dawnClock()) endTradeNight(true);
  }

  // Trading takes no clock time. The buttons keep focus, so a few grams can be bought in a row.
  function buyGold(amount) {
    if (!isTrade() || state.resolved || transient.travelling) return false;
    const q = tradeQuote();
    if (!q || q.buyOnly) return false;
    if (q.canBuy < 1) { toast(q.dealer.soldOut || "Nothing left to sell you here."); return false; }
    const g = Math.max(0, Math.min(Math.floor(amount), q.canBuy));
    const total = g * q.buy;
    if (!g || total > state.credits) { toast("Not enough credits for that."); return false; }
    state.credits -= total;
    state.gold = MARKET.lots.buy(state.gold, g, q.buy, { where: state.location, at: state.clock, provenance: q.dealer.provenance || "" });
    state.trades.push({ kind: "buy", grams: g, price: q.buy, total: total, at: state.clock, where: state.location });
    observeMarket();
    const after = tradeQuote();
    const lines = [{ type: "p", text: fill(q.dealer.buyText, { grams: grams(g), total: total + " cr", price: q.buy }) }];
    if (after.canBuy < 1 && q.dealer.soldOut) lines.push({ type: "p", text: q.dealer.soldOut });
    else if (after.canBuy <= 5 && q.dealer.lowStock) lines.push({ type: "p", text: q.dealer.lowStock });
    state.lastResult = { label: "Bought " + grams(g) + " · " + q.dealer.name, lines: lines, clues: [], heard: [] };
    soundCue("buy");
    saveGame();
    renderKeepingFocus();
    return true;
  }
  function sellGold(amount) {
    if (!isTrade() || state.resolved || transient.travelling) return false;
    const q = tradeQuote();
    if (!q) return false;
    if (q.canSell <= 0) { toast(q.dealer.full || "They won't take any more from you tonight."); return false; }
    const g = Math.min(goldHeld(), amount, q.canSell);
    if (!(g > 0)) return false;
    const sold = MARKET.lots.sell(state.gold, g);
    const total = Math.round(sold.sold * q.sell);
    state.gold = sold.lots;
    state.credits += total;
    state.trades.push({ kind: "sell", grams: sold.sold, price: q.sell, total: total, basis: sold.basis, at: state.clock, where: state.location });
    observeMarket();
    const lines = [{ type: "p", text: fill(q.dealer.sellText, { grams: grams(sold.sold), total: total + " cr", price: q.sell }) }];
    if (tradeQuote().canSell <= 0 && q.dealer.full) lines.push({ type: "p", text: q.dealer.full });
    state.lastResult = { label: "Sold " + grams(sold.sold) + " · " + q.dealer.name, lines: lines, clues: [], heard: [] };
    soundCue("sell");
    saveGame();
    renderKeepingFocus();
    return true;
  }
  // Tapping a scale in the picture brings the gold controls into view.
  function focusGold() {
    const group = $("gold-group");
    if (!group) return;
    group.scrollIntoView({ block: "nearest", behavior: motionReduced() ? "auto" : "smooth" });
    const first = group.querySelector(".action-btn:not([disabled])");
    if (first) first.focus({ preventScroll: true });
    group.classList.remove("pulse");
    void group.offsetWidth;
    group.classList.add("pulse");
  }

  // Turning in ends the night: the board at Kurage 33 values what you hold, the morning wire says what happened.
  function endTradeNight(atDawn) {
    if (!isTrade()) return;
    if (state.resolved) { showResolution(); return; }
    // valued at Mei's board as it stands for anyone, without the weight of the player's own trades
    const q = MARKET.quote(TRADE, state.truth, state.seed, "bar", state.clock);
    state.resolved = true;
    state.ending = "night";
    state.endedAt = state.clock;
    if (atDawn !== true) state.lastResult = null;
    state.finish = { credits: state.credits, grams: goldHeld(), sell: q.sell, worth: MARKET.worth(state.credits, state.gold, q.sell) };
    setEndFlags(atDawn === true);
    saveGame();
    render();
    showResolution();
    debugMarket("turned in");
  }

  // What the player did, as flags the morning card's reflections read (trade.js ending.reflections).
  function setEndFlags(atDawn) {
    const f = state.flags;
    const desk = parseClock("01:00");
    function heardAt(id) { const r = state.rumors.filter(function (x) { return x.id === id; })[0]; return r ? r.at : null; }
    const teoAt = heardAt("r_frostline"), meiAt = heardAt("r_vault");
    const buys = state.trades.filter(function (t) { return t.kind === "buy"; });
    const sells = state.trades.filter(function (t) { return t.kind === "sell"; });
    f.end_dawn = atDawn;
    f.end_held = state.trades.length === 0;
    f.end_bought_on_teo = teoAt !== null && buys.some(function (t) { return t.at < desk && t.at >= teoAt; });
    f.end_sold_on_mei = meiAt !== null && sells.some(function (t) { return t.at < desk && t.at >= meiAt; });
    f.end_bought_late = buys.some(function (t) { return t.where === "bar" && t.at >= parseClock("01:20"); });
    f.end_sold_to_oduya = sells.some(function (t) { return t.where === "landing"; });
    f.end_bought_at_hatch = buys.some(function (t) { return t.where === "landing"; });
    f.end_sold_at_desk = sells.some(function (t) { return t.where === "pier"; });
    f.end_both_queues = f.end_bought_at_hatch && f.end_sold_at_desk;
    const deskDealer = TRADE.market.dealers.pier;
    const soldAtDesk = sells.filter(function (t) { return t.where === "pier"; }).reduce(function (n, t) { return n + t.grams; }, 0);
    f.end_hit_limit = !!(deskDealer && deskDealer.limit) && soldAtDesk >= deskDealer.limit;
    f.end_missed_correction = state.truth === "vault" && teoAt !== null && !heard("r_pulled") && buys.length > 0;
    const choices = tradeChoicesResult();
    f.end_beat_idle = !f.end_held && choices >= 10;
    f.end_lost_to_idle = !f.end_held && choices <= -10;
    f.end_never_left = Object.keys(state.visited).every(function (loc) { return loc === "bar"; });
    f.end_looked = ["r_seen_gilt", "r_seen_bars", "r_seen_twelve", "r_matte_lit", "r_matte_dark"].some(heard);
  }
  // What the trades themselves made against holding the opening gold, with food and fuel left out.
  function tradeChoicesResult() {
    const s = state.start, f = state.finish;
    return Math.round(f.worth + (state.spent || 0) - (state.rewardCredits || 0) - (state.breakfastRevenue || 0) - (state.cargo ? state.cargo.revenue : 0) - (state.canalTrade ? state.canalTrade.revenue : 0) - freightTotals().revenue - (state.rewardGrams || 0) * f.sell - (s.credits + s.grams * f.sell));
  }

  // Development view: the hidden truth, every price's parts, the rumours' truth, relationships.
  // NeonTides.trade.debug() returns it; ?debug=market logs it whenever the clock moves.
  function tradeDebug() {
    if (!isTrade()) return null;
    const prices = {};
    Object.keys(DATA.world.locations).forEach(function (loc) {
      const b = MARKET.breakdown(TRADE, state.truth, state.seed, loc, state.clock);
      const q = tradeQuote(loc);
      prices[loc] = { mid: b.mid, buy: q ? q.buy : null, sell: q ? q.sell : null, dealer: q ? q.dealer.name : null, local: b.localPct, events: b.events, noise: b.noisePct,
        yourWeight: q ? q.impact : null, canBuy: q ? q.canBuy : null, canSell: q ? q.canSell : null };
    });
    return {
      truth: state.truth, clock: formatClock(state.clock), fired: state.fired.map(function (f) { return f.id + " @" + formatClock(f.at); }),
      prices: prices,
      rumors: state.rumors.map(function (r) { const def = TRADE.rumors[r.id]; return { id: r.id, heard: formatClock(r.at), source: def.source, truth: (def.truth || {})[state.truth] || "n/a", effect: def.effect }; }),
      rel: Object.assign({}, state.rel), credits: state.credits, gold: goldHeld(), average: MARKET.lots.average(state.gold)
    };
  }
  function debugMarket(why) {
    if (!transient.debugMarket || !isTrade()) return;
    const d = tradeDebug();
    console.debug("[market] " + why + " · truth " + d.truth + " · " + d.clock + " · fired: " + (d.fired.join(", ") || "none"));
    if (console.table) console.table(d.prices);
  }

  /* ------------------------------------------------------------------ */
  /* 9 · THE CONFRONTATION                                               */
  /* ------------------------------------------------------------------ */
  // Stages: select (pick up to 3) -> explain (theory + one supporting clue) -> choice (ending)
  function startConfrontation() {
    state.confront = { stage: "select", selected: [], feedback: null, explanation: null, support: null };
    state.flags.confronted = true;
    state.lastResult = null;
    saveGame();
    render();
    focusEncounter();
  }
  function stepBack() {
    state.confront = null;
    saveGame();
    render();
  }
  function toggleEvidence(id) {
    const c = state.confront;
    const at = c.selected.indexOf(id);
    if (at !== -1) c.selected.splice(at, 1);
    else if (c.selected.length < activeCase.confrontation.maxEvidence) c.selected.push(id);
    c.feedback = null;
    saveGame();
    renderKeepingFocus();
  }
  // The lie breaks when the evidence on the counter covers every tag in confrontation.requires.
  // Partly covered: the rebuttal for the first required tag still missing. Nothing relevant: "nothing".
  function submitEvidence() {
    const c = state.confront;
    const conf = activeCase.confrontation;
    const challenge = conf.challenge;
    const shown = conf.requires.filter(function (tag) {
      return c.selected.some(function (id) { return clueProves(id, tag); });
    });
    if (shown.length === conf.requires.length) {
      // The paper is right. Now the notebook must say what happened: the first tested line that is not
      // right is asked for (empty) or rebutted (wrong), in the order of the night.
      const line = timelineTested().filter(function (row) { return timelineVerdict(row) !== "right"; })[0];
      if (line && timelineVerdict(line) === "empty") c.feedback = expandLines(challenge.timeline);
      else if (line) c.feedback = expandLines(line.wrong);
      else { c.stage = "explain"; c.feedback = expandLines(challenge.success); }
    } else if (shown.length === 0) {
      c.feedback = expandLines(challenge.nothing);
    } else {
      const missing = conf.requires.filter(function (tag) { return shown.indexOf(tag) === -1; })[0];
      c.feedback = expandLines(challenge.missing[missing]);
    }
    saveGame();
    render();
    focusEncounter();
  }
  function submitExplanation() {
    const c = state.confront;
    const conf = activeCase.confrontation;
    const explanation = conf.explanations.filter(function (e) { return e.id === c.explanation; })[0];
    if (!explanation || !c.support) return;
    if (explanation.id !== activeCase.truth) {
      c.feedback = expandLines(activeCase.responses[explanation.id].wrong);
    } else if (!hasClue(c.support) || !clueProves(c.support, explanation.proof)) {
      c.feedback = expandLines(conf.noProof);
    } else {
      c.stage = "choice";
      c.feedback = expandLines(activeCase.responses[explanation.id].correct);
    }
    saveGame();
    render();
    focusEncounter();
  }
  function chooseEnding(choiceId) {
    const choice = activeCase.finalChoices.filter(function (ch) { return ch.id === choiceId; })[0];
    if (!choice) return;
    state.resolved = true;
    state.ending = choice.ending;
    state.endedAt = state.clock;
    state.confront = null;
    state.lastResult = null;
    saveGame();
    recordEnding(state.variantId, choice.ending);
    render();
    showResolution();
  }

  /* ------------------------------------------------------------------ */
  /* 10 · RENDERING                                                      */
  /* ------------------------------------------------------------------ */
  function render() {
    if (!state) return;
    syncSceneClasses();
    syncTradeMode();
    renderGoldBoard();
    renderInstruments();
    renderHarbour();
    renderThings();
    renderChips();
    renderEncounter();
    renderNotebook();
    updateScrollHint();
    updateActionsCue();
    applyMood();
  }
  // Fades the bottom of the story text while there is more to scroll (desktop panel).
  function updateScrollHint() {
    const body = dom.encBody;
    const more = body.scrollHeight - body.clientHeight - body.scrollTop > 6;
    body.classList.toggle("has-more", more);
  }
  // Ticking a piece of evidence rebuilds the list; the reader stays where they were in it.
  function renderKeepingFocus() {
    const focusedId = document.activeElement && document.activeElement.id;
    const sheetTop = dom.encounter.scrollTop;
    const bodyTop = dom.encBody.scrollTop;
    render();
    dom.encounter.scrollTop = sheetTop;
    dom.encBody.scrollTop = bodyTop;
    if (focusedId && $(focusedId)) $(focusedId).focus({ preventScroll: true });
    updateScrollHint();
    updateActionsCue();
  }

  function setMode(mode) {
    transient.mode = mode;
    transient.showing = null;
    document.body.setAttribute("data-mode", mode);
    syncSceneClasses();                 // the title screen always shows the harbour as it starts
    syncAspect();
    syncTradeMode();
    dom.titleOverlay.hidden = mode !== "title";
    // Every change of mode clears the ending card (showResolution() runs after setMode when it is
    // needed). Leaving it up let it cover the title screen after "New shift…" from the card itself.
    dom.resolution.hidden = true;
  }
  // The camera. "close", the standard since 3.2.1, glides in on the quay the Tern is moored at and
  // pulls back to the whole harbour for every crossing, so the quay fills a phone's small frame and the
  // things drawn on it are big enough to be looked at; the title screen always shows the whole harbour
  // (fitted, "meet", except a portrait phone's title, which fills the frame, "slice", with the bar and
  // the moon). "wide" (Menu → Camera, or index.html?camera=wide) is the picture as it was before 3.2:
  // the whole harbour all the time. The viewBox cannot be transitioned in CSS, so it is tweened by
  // hand; during the 0.9 s glide the picture repaints every frame, which is the price of doing it this
  // way (a still picture repaints nothing: MOBILE.md §12).
  const CAMERA_MODES = ["wide", "close"];
  const CAMERA_MS = 900;
  const FULL_VIEW = { x: 0, y: 0, w: 1440, h: 800 };
  const TITLE_CROP = { x: 567, y: 0, w: 640, h: 800 };
  const QUAY_W = 760, QUAY_H = 800 * 760 / 1440, QUAY_Y = 215;   // a quay in the picture's own 18:10: sign glow to waterline
  const QUAY_X = { landing: 0, metro: 130, bar: 507, pier: 680, market: 340, yard: 340, island: 340 };  // the crop's left edge, clamped to the picture
  function portraitPhone() { return window.matchMedia("(max-width: 899px) and (orientation: portrait)").matches; }
  function cameraTarget() {
    if (transient.mode === "title") return portraitPhone() ? TITLE_CROP : FULL_VIEW;
    // The market is an illustrated arcade: all three stalls must remain in view.
    if (state && ["market", "canal"].indexOf(state.location) !== -1) return FULL_VIEW;
    if (settings.camera === "close" && state && !transient.travelling && QUAY_X[state.location] !== undefined) {
      return { x: QUAY_X[state.location], y: QUAY_Y, w: QUAY_W, h: QUAY_H };
    }
    return FULL_VIEW;
  }
  function sameView(a, b) { return !!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h; }
  function viewBoxOf(v) { return [v.x, v.y, v.w, v.h].map(function (n) { return Math.round(n * 100) / 100; }).join(" "); }
  function syncAspect(animate) {
    // Portrait only: a landscape phone's title frame is wide, and the bar crop would cut the sign.
    const phoneTitle = transient.mode === "title" && portraitPhone();
    dom.svg.setAttribute("preserveAspectRatio", phoneTitle ? "xMidYMid slice" : "xMidYMid meet");
    moveCamera(cameraTarget(), !!animate);
  }
  function moveCamera(target, animate) {
    const from = transient.camera || FULL_VIEW;
    cancelAnimationFrame(transient.cameraFrame);
    if (!animate || motionReduced() || sameView(from, target)) {
      transient.camera = target;
      dom.svg.setAttribute("viewBox", viewBoxOf(target));
      renderThings();                      // hit areas are sized against the camera
      return;
    }
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / CAMERA_MS);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;   // ease in, ease out
      transient.camera = t < 1
        ? { x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, w: from.w + (target.w - from.w) * e, h: from.h + (target.h - from.h) * e }
        : target;
      dom.svg.setAttribute("viewBox", viewBoxOf(transient.camera));
      if (t < 1) transient.cameraFrame = requestAnimationFrame(step);
      else renderThings();                 // hit areas are sized against the finished camera
    }
    transient.cameraFrame = requestAnimationFrame(step);
  }
  function setCamera(mode) {
    if (CAMERA_MODES.indexOf(mode) === -1) return;
    settings.camera = mode;
    saveSettings();
    syncAspect(true);
  }
  function cycleCamera() { setCamera(CAMERA_MODES[(CAMERA_MODES.indexOf(settings.camera) + 1) % CAMERA_MODES.length]); }

  // Hints (3.4). On, the notebook says which threads the evidence settles ("settled · the arrival
  // tally") and which timeline lines a clue has just made answerable ("ready to fill in", with a
  // toast). Off is the hard mode: the same notebook without those marks, so the timeline is a real
  // deduction. The counter's rebuttals and the ending card's count are not hints and stay.
  const HINT_MODES = ["on", "off"];
  function hintsOn() { return settings.hints !== "off"; }
  function setHints(mode) {
    if (HINT_MODES.indexOf(mode) === -1) return;
    settings.hints = mode;
    saveSettings();
    if (state && transient.mode === "play") render();
  }
  function cycleHints() { setHints(hintsOn() ? "off" : "on"); }

  // body.trade-mode: the gold night is being played (styles.css shows Mei's gold board, relabels the
  // dashboard on phones). The title screen never has it.
  function syncTradeMode() {
    document.body.classList.toggle("trade-mode", transient.mode === "play" && isTrade());
  }
  // Mei's gold board in the picture shows tonight's numbers while you are at Kurage 33, and the
  // numbers you last read there while you are not: the picture never tells you more than you know.
  function renderGoldBoard() {
    if (!dom.boardBuy || !isTrade()) return;
    const live = state.location === "bar" && !transient.travelling ? tradeQuote("bar") : null;
    const shown = live || state.seen.bar;
    dom.boardBuy.textContent = shown ? "B " + shown.buy : "B —";
    dom.boardSell.textContent = shown ? "S " + shown.sell : "S —";
  }

  function renderInstruments() {
    dom.instClock.textContent = formatClock(state.clock);
    renderFuel();
    if (isTrade()) { renderTradeInstruments(); return; }
    dom.instCanLabel.textContent = DATA.world.drink.name;
    dom.instObjectiveLabel.textContent = "Objective";
    dom.instClock.classList.toggle("late", state.clock >= DAWN_CLOCK);
    dom.instDawn.textContent = state.clock >= DAWN_CLOCK ? "the dawn truck has gone" : "dawn truck " + DATA.meta.dawnClock;

    dom.instCan.textContent = "×" + state.cans;
    dom.instCan.className = "inst-value" + (state.canArmed ? " armed" : "");
    dom.instCanSub.textContent = state.canArmed ? "armed: next crossing 0 min" : (state.cans > 0 ? "skips one crossing's time" : "none in hand");

    // A new objective glows for a moment, so "what now?" is noticed when it changes.
    setObjectiveText(currentObjective());
  }
  function setObjectiveText(objective) {
    if (dom.instObjective.textContent !== objective) {
      dom.instObjective.textContent = objective;
      dom.instObjectiveCell.title = objective;
      if (transient.objective) {
        dom.instObjectiveCell.classList.remove("updated");
        void dom.instObjectiveCell.offsetWidth;       // restart the animation
        dom.instObjectiveCell.classList.add("updated");
      }
    }
    transient.objective = objective;
  }
  // On the gold night the dashboard carries the purse and the board where you are instead of the
  // drink and an objective. Nothing tells you what to do; the cell glows when the board changes.
  function renderTradeInstruments() {
    dom.instClock.classList.remove("late");
    dom.instDawn.textContent = state.night === 3 ? (state.resolved ? "morning shift complete" : "morning crew · shift ends 11:00") : state.resolved ? "the night is over"
      : state.clock >= parseClock(TRADE.meta.firstLight || "05:00") ? "first light at " + (TRADE.meta.dawnClock || "06:00")
      : "rain on the Basin";
    dom.instCanLabel.textContent = "Purse";
    // phones hide the sub line, so the grams ride in the label there (styles.css 13b)
    dom.instCanLabel.appendChild(el("span", { class: "phone-only", text: " · " + grams(goldHeld()) }));
    dom.instCan.textContent = state.credits + " cr";
    dom.instCan.className = "inst-value";
    dom.instCanSub.textContent = grams(goldHeld()) + " of gold";
    dom.instObjectiveLabel.textContent = "Gold, per gram";
    setObjectiveText(goldBoardText());
  }
  function goldBoardText() {
    if (transient.travelling) return "Under way";
    const here = DATA.world.locations[state.location].short;
    const q = tradeQuote();
    if (q) return q.buyOnly ? here + " · the desk pays " + q.sell : here + " · buy " + q.buy + " · sell " + q.sell;
    let last = null;
    Object.keys(state.seen).forEach(function (loc) { if (!last || state.seen[loc].at > state.seen[last].at) last = loc; });
    if (!last) return here + " · no scale here";
    const s = state.seen[last];
    return here + " · no scale here · " + DATA.world.locations[last].short + " at " + formatClock(s.at) + ": " + (s.buy ? s.buy + " / " : "") + s.sell;
  }

  function renderFuel() {
    dom.fuelGauge.innerHTML = "";
    for (let i = 0; i < DATA.meta.fuelMax; i++) {
      const seg = el("span", { class: "fuel-seg" + (i < state.fuel ? " on" : "") + (i < state.fuel && state.fuel <= 1 ? " low" : "") });
      dom.fuelGauge.appendChild(seg);
    }
    dom.fuelGauge.setAttribute("aria-label", "fuel " + state.fuel + " of " + DATA.meta.fuelMax);
    dom.instFuelText.textContent = state.fuel + " / " + DATA.meta.fuelMax;
  }

  function costText(dest) {
    const check = canTravel(dest);
    if (dest === state.location) return "moored here";
    if (state.confront) return activeCase.confrontation.busyLabel;      // "at the counter", "under the floodlight"
    const cost = travelCost(state.location, dest);
    if (!cost) return "";
    const minutes = travelMinutes(cost);
    if (!check.ok) return check.why;
    return cost.fuel + " fuel · " + minutes + " min" + (state.canArmed ? " (" + DATA.world.drink.name + ")" : "");
  }

  function renderHarbour() {
    document.body.setAttribute("data-location", state.location);
    document.body.setAttribute("data-adventure", isTrade() ? "trade" : "case");
    dom.hotspots.forEach(function (spot) {
      const dest = spot.getAttribute("data-dest");
      const loc = DATA.world.locations[dest];
      const check = canTravel(dest);
      spot.setAttribute("data-current", dest === state.location ? "true" : "false");
      spot.setAttribute("aria-disabled", check.ok ? "false" : "true");
      spot.setAttribute("aria-label", loc.name + " — " + costText(dest));
      spot.querySelector(".hs-tag-name").textContent = (loc.tag || loc.name).toUpperCase();
      spot.querySelector(".hs-tag-cost").textContent = costText(dest);
    });
  }

  // Big buttons under the picture (phones, and touch screens at desktop widths; CSS decides).
  // An affordable crossing shows its fuel as amber pips, like the gauge, so four chips fit in one
  // row on a phone; anything else (moored here, needs fuel) is said in words.
  // Things (3.3): while an action naming a drawn thing is on offer, that thing gets a ring and a tag in
  // the picture, and tapping it performs the action. The hit area is at least 44 css px on any screen.
  // Geometry is read from the drawn element in screen space and mapped back into the picture's units,
  // so transformed groups (the ferry) and case art (hidden when display:none) come out right.
  function renderThings() {
    const layer = dom.things;
    if (!layer) return;
    layer.innerHTML = "";
    if (!state || transient.mode !== "play" || transient.travelling || state.confront) return;
    const bound = {};
    const order = [];
    locationActions().forEach(function (action) {
      if (action.thing && !bound[action.thing]) { bound[action.thing] = action; order.push(action.thing); }
    });
    if (["canal", "yard"].indexOf(state.location) !== -1) casualActions().forEach(function (action) {
      if (action.thing) { if (!bound[action.thing]) order.push(action.thing); bound[action.thing] = action; }
    });
    const conf = activeCase.confrontation;
    systemActions().forEach(function (action) {
      // a system action may name its own thing (a scale on the gold night); the confrontation uses conf.thing
      const thing = action.thing || (action.kind === "confront" ? conf.thing : null);
      if (thing && !bound[thing]) { bound[thing] = action; order.push(thing); }
    });
    const ctm = dom.svg.getScreenCTM();
    if (!ctm || !ctm.a) return;
    const inverse = ctm.inverse();
    const minUnits = 44 / ctm.a;
    function toPicture(x, y) { const p = dom.svg.createSVGPoint(); p.x = x; p.y = y; return p.matrixTransform(inverse); }
    // A thing's box is the union of its drawn shapes. Decorative emitters (steam, frost, exhaust) are
    // left out: their CSS animations scale about the picture's origin and would drag the box across the
    // quay. Hidden case art is left out too. If nothing is left, the element's own box is used.
    const DECOR = ".steam, .puff, .frost, .exhaust, .case-art";
    function thingBox(node) {
      let box = null;
      Array.prototype.forEach.call(node.querySelectorAll("rect, path, circle, ellipse, line, polygon, polyline, text, use"), function (shape) {
        const decor = shape.closest(DECOR);
        if (decor && node.contains(decor)) return;
        const r = shape.getBoundingClientRect();
        if (!r.width && !r.height) return;
        box = box ? { left: Math.min(box.left, r.left), top: Math.min(box.top, r.top), right: Math.max(box.right, r.right), bottom: Math.max(box.bottom, r.bottom) }
                  : { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      });
      if (box) return box;
      const r = node.getBoundingClientRect();
      return r.width || r.height ? { left: r.left, top: r.top, right: r.right, bottom: r.bottom } : null;
    }
    const placedTags = [];
    function tagClear(tag) { return !placedTags.some(function (t) { return tag.x < t.x + t.w && tag.x + tag.w > t.x && tag.y < t.y + t.h && tag.y + tag.h > t.y; }); }
    order.forEach(function (thingId) {
      const node = $(thingId);
      if (!node) return;
      const r = thingBox(node);
      if (!r) return;                                           // not drawn tonight (case art)
      const a = toPicture(r.left, r.top), b = toPicture(r.right, r.bottom);
      let x = a.x - 6, y = a.y - 6, w = b.x - a.x + 12, h = b.y - a.y + 12;
      if (w < minUnits) { x -= (minUnits - w) / 2; w = minUnits; }
      if (h < minUnits) { y -= (minUnits - h) / 2; h = minUnits; }
      const action = bound[thingId];
      const cost = thingCost(action);
      const name = activeCase.things[thingId] || thingId;
      const label = cost ? name + " · " + cost : name;
      const width = Math.max(70, label.length * 7.4 + 18);
      // the tag sits above the ring; if that overlaps a tag already placed, it goes below, then higher up
      const view = transient.camera || FULL_VIEW;
      let tag = { x: Math.min(Math.max(x + w / 2 - width / 2, view.x + 4), view.x + view.w - width - 4), y: y - 24, w: width, h: 22 };   // kept inside the picture
      if (!tagClear(tag)) tag.y = y + h + 2;
      if (!tagClear(tag)) tag.y = y - 48;
      placedTags.push(tag);
      const g = svgEl("g", { class: "thing kind-" + action.kind + (thingId.indexOf("canal-") === 0 ? " canal-person-target" : ""), role: "button", tabindex: "0", "data-thing": thingId, "data-action": action.id,
        "aria-label": action.label + (cost ? " (" + cost + ")" : ""),
        onclick: function () { performAction(action.id); },
        onkeydown: function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); performAction(action.id); } } }, [
        svgEl("rect", { class: "thing-hit", x: x, y: y, width: w, height: h }),
        svgEl("rect", { class: "thing-ring", x: x, y: y, width: w, height: h, rx: 4 }),
        svgEl("g", { class: "thing-tag", transform: "translate(" + (tag.x + width / 2) + " " + (tag.y + 11) + ")" }, [
          svgEl("rect", { class: "thing-tag-bg", x: -width / 2, y: -11, width: width, height: 22 }),
          svgEl("text", { class: "thing-tag-text", x: 0, y: 4.5, "text-anchor": "middle" }, [
            svgEl("tspan", { class: "thing-tag-name", text: name }),
            cost ? svgEl("tspan", { class: "thing-tag-cost", text: " · " + cost }) : null
          ])
        ])
      ]);
      layer.appendChild(g);
    });
  }
  // What a thing's tag says it costs. The investigations always name the minutes ("0 min"); the
  // gold night names credits and minutes only when there are any.
  function thingCost(action) {
    const minutes = actionMinutes(action);
    if (!isTrade()) return minutes > 0 ? "+" + minutes + " min" : "0 min";
    const parts = [];
    if (action.cost) parts.push(action.cost + " cr");
    if (minutes > 0) parts.push("+" + minutes + " min");
    return parts.join(" · ");
  }

  function renderChips() {
    dom.chips.innerHTML = "";
    Object.keys(DATA.world.locations).filter(locationAvailable).forEach(function (dest) {
      const loc = DATA.world.locations[dest];
      const check = canTravel(dest);
      const cost = travelCost(state.location, dest);
      const pips = [];
      if (cost) for (let i = 0; i < cost.fuel; i++) pips.push(el("i", { class: "pip" }));
      const costNode = check.ok
        ? el("span", { class: "chip-cost" }, [
            el("span", { class: "chip-pips", "aria-hidden": "true" }, pips),
            el("span", { class: "chip-time", text: travelMinutes(cost) + " min" })
          ])
        : el("span", { class: "chip-cost plain", text: costText(dest) });   // a block, so a long word can ellipsise
      const chip = el("button", {
        class: "chip", type: "button",
        "data-current": dest === state.location ? "true" : "false",
        disabled: !check.ok,
        "aria-label": loc.name + " — " + costText(dest),
        onclick: function () { travelTo(dest); }
      }, [
        el("span", { class: "chip-name", text: loc.short }),
        costNode
      ]);
      dom.chips.appendChild(chip);
    });
  }

  function renderEncounter() {
    const body = dom.encBody;
    const actions = dom.encActions;
    body.innerHTML = "";
    actions.innerHTML = "";
    dom.encCoach.innerHTML = "";

    if (transient.travelling) {
      const trip = transient.travelling;
      const to = DATA.world.locations[trip.to];
      dom.encKicker.textContent = "Under way";
      dom.encTitle.textContent = "Crossing to " + to.name;
      renderLines(body, state.lastResult ? state.lastResult.lines : approachLines(trip.to));
      body.appendChild(el("p", { class: "notice", text: (trip.fuel ? "−" + trip.fuel + " fuel · " : "") + "+" + trip.minutes + " min" }));
      return;
    }

    const loc = DATA.world.locations[state.location];
    dom.encKicker.textContent = state.night >= 2 ? TRADE.meta.title : loc.kicker;
    dom.encTitle.textContent = loc.title;

    if (state.confront) { renderConfrontation(body, actions); return; }
    // The card lives outside the story's aria-live region, so a screen reader doesn't re-read it
    // with every result.
    if (touchFirst() && !settings.coached) dom.encCoach.appendChild(coachCard());
    if (isTrade() && state.marketNote) body.appendChild(el("p", { class: "notice market-note", text: state.marketNote }));
    if (state.lastResult) {
      renderResult(body, state.lastResult);
      if (state.lastResult.label.indexOf("Crossing to ") === 0) renderScene(body);
    }
    else renderScene(body);
    if (isTrade()) { renderCargoProgress(body); renderTradeActions(actions); }
    else renderActions(actions);
  }

  // First shift on a touch screen: one card that says how the screen works, until it is dismissed.
  // (The help text describes the same thing; nobody opens the help text first.)
  function coachCard() {
    return el("div", { class: "coach", role: "note" }, [
      el("p", { class: "coach-title", text: "Welcome aboard" }),
      el("p", { text: "The picture shows the quay you are moored at; people and things with a dashed ring can be tapped. Use the destination buttons under it to cross the harbour. Everything you can do is also listed under the story, with what it costs." }),
      el("button", { class: "btn btn-small", type: "button", onclick: function () { settings.coached = true; saveSettings(); render(); focusFirstChoice(); } }, "Got it")
    ]);
  }
  // When the control that had focus disappears (the card's button, the cue), focus moves to the first
  // choice instead of falling back to <body>.
  function focusFirstChoice() {
    const first = visibleActionButtons()[0];
    if (first) first.focus({ preventScroll: true });
  }

  function renderScene(container) {
    const scene = activeCase.scenes[state.location];
    const first = (state.visited[state.location] || 1) <= 1;
    let items = expandLines(first ? scene.first : scene.again);
    if (items.length === 0 && !first) items = approachLines(state.location);
    if (isTrade()) {
      const greetings = {
        market: { who: "sora", text: first ? "Welcome under the lanterns, captain. The scale is here; the kettle is over there. Neither requires you to hurry." : "Tern on the quay again! Check the board if you're trading; there's room to sit if you're visiting." },
        landing: { who: "priya", text: state.flags.wire_umbrella_done ? "Welcome back. Your patch of blue sky is keeping my clipboard dry." : "There you are, captain. The Wire has the neighbours' news; I have the current paperwork." },
        bar: { who: "mei", text: state.flags.freight_ceramics_done ? "Home again. One of Jun's bowls is waiting for its next adventure with broth." : "A dry stool, captain. Come in before your coat orders tea without you." },
        canal: { who: "hana", text: state.flags.fs_done ? "Our festival captain! Today you may arrive empty-handed and leave well fed." : first ? "Welcome to Kisaragi. Follow the warm windows; the bridge will introduce the rest of us." : "Back beyond the locks. Good. A familiar face is an excellent reason to put water on." }
      };
      if (greetings[state.location]) items.push(greetings[state.location]);
    }
    renderConversation(container, items, "scene:" + state.variantId + ":" + state.location + ":" + state.visited[state.location]);
  }

  // A place's approach text is one line, or a list of entries with conditions (the metro's terminus
  // is dark after the last train). The clock has already moved to the arrival time when it is read.
  function approachLines(locId) {
    const approach = DATA.world.locations[locId].approach;
    return expandLines(Array.isArray(approach) ? approach : [approach]);
  }

  function renderResult(container, result) {
    renderConversation(container, result.lines, result);
    (result.clues || []).forEach(function (id) {
      const clue = activeCase.clues[id];
      if (!clue) return;
      container.appendChild(el("div", { class: "clue-found" }, [
        el("span", { class: "clue-found-label", text: "Discovery recorded · " + clue.title }),
        clue.text
      ]));
    });
    // The gold night: what was just written into the notebook, as it was heard. Never interpreted.
    (result.heard || []).forEach(function (id) {
      container.appendChild(el("div", { class: "clue-found rumor-found" }, [
        el("span", { class: "clue-found-label", text: "New lead · " + rumorSource(id) }),
        TRADE.rumors[id].note
      ]));
    });
  }
  function rumorSource(id) {
    const def = TRADE.rumors[id];
    const entry = (state.rumors || []).filter(function (r) { return r.id === id; })[0];
    const place = DATA.world.locations[(entry && entry.where) || def.origin].short;
    if (def.source === "you") return "What you saw, " + place;
    const who = DATA.world.characters[def.source];
    return (who ? who.name : def.source) + ", " + place;
  }

  // The gold night's choices: what you can do here (talk, order, look), the scale if there is one,
  // and the ferry. Free actions carry no cost badge at all; credits and minutes show when they're spent.
  function tradeBadges(minutes, fuel, cost) {
    const badges = [];
    if (cost) badges.push(el("span", { class: "cost credits", text: cost + " cr" }));
    if (fuel) badges.push(el("span", { class: "cost fuel", text: fuel + " fuel" }));
    if (minutes > 0) badges.push(el("span", { class: "cost", text: "+" + minutes + " min" }));
    return badges.length ? el("span", { class: "act-costs" }, badges) : null;
  }
  function renderTradeActions(container) {
    let key = 0;
    function nextKey() { key += 1; return key <= 9 ? String(key) : null; }

    if (state.resolved) {
      const done = el("div", { class: "action-group" }, [el("p", { class: "action-group-label", text: "Morning" })]);
      done.appendChild(actionButton({ kind: "choice", label: "Read your morning report", key: nextKey(), onClick: showResolution }));
      done.appendChild(actionButton({ kind: "choice", label: nextNightLabel(), key: nextKey(), onClick: continueTradeStory }));
      if (state.night === 3 && state.flags.af_ready) done.appendChild(actionButton({ kind: "choice", label: state.flags.af_done ? "Read your afternoon with Nao & Haruto" : "An afternoon off · Nao & Haruto", onClick: openFamilyAfternoon }));
      container.appendChild(done);
      return;
    }

    // Gold stays at the top. Optional chats are folded so they never bury a trade.
    const market = state.location === "market";
    const spot = transient.marketSpot || "all";
    if (market) renderMarketDirectory(container, spot);
    const gold = !market || spot === "all" || spot === "gold" ? renderGoldGroup(nextKey) : null;
    container.appendChild(el("p", { class: "expedition-lead", text: currentObjective() }));
    if (state.night === 2) renderSecondNightProgress(container);
    renderCanalProgress(container);
    if (market && state.flags.nb_started && (spot === "all" || spot === "food")) renderBreakfastProgress(container);
    if (gold) container.appendChild(gold);
    else if (!market) container.appendChild(el("p", { class: "market-away", text: "No open gold desk here. Compare the boards in your journal, or ask around for a lead." }));
    const visible = function (a) { return !a.directory && (!market || spot === "all" || !a.marketSpot || a.marketSpot === spot); };
    const here = locationActions().filter(function (a) { return a.kind !== "system" && visible(a); });
    [
      { label: "Explore & follow leads", match: function (a) { return !a.casual && !a.lesson && a.kind !== "order"; } },
      { label: "Trading over tea · Nao", match: function (a) { return !!a.lesson; }, folded: true, stateKey: "lessonOpen" },
      { label: "Food, tea & stories", match: function (a) { return a.kind === "order"; } },
      { label: "People · Free conversation", match: function (a) { return !!a.casual; }, folded: true }
    ].forEach(function (group) {
      const available = here.filter(group.match);
      if (!available.length) return;
      const local = el(group.folded ? "details" : "div", { class: "action-group" + (group.folded ? " casual-group" : "") });
      local.appendChild(el(group.folded ? "summary" : "p", { class: "action-group-label", text: group.label }));
      available.forEach(function (action) {
        renderCargoOffer(action, local);
        local.appendChild(actionButton({
          kind: action.casual ? "chat" : action.kind, label: marketActionLabel(action),
          key: group.folded ? null : nextKey(), disabled: !tradeActionAffordable(action),
          costs: tradeBadges(actionMinutes(action), action.fuel, action.cost),
          onClick: function () { performAction(action.id); }
        }));
      });
      if (group.folded) {
        local.open = !!transient[group.stateKey || "chatOpen"];
        local.addEventListener("toggle", function () { transient[group.stateKey || "chatOpen"] = local.open; updateActionsCue(); });
      }
      container.appendChild(local);
    });

    renderReviewShelf(container);
    renderTravelPlanner(container);
    const sys = systemActions().filter(function (a) { return a.id !== "sys_scale"; });
    const ferryActions = locationActions().filter(function (a) { return a.kind === "system" && visible(a); }).concat(sys);
    const ferry = el("div", { class: "action-group" + (ferryActions.length ? "" : " only-travel") }, [el("p", { class: "action-group-label", text: "Ferry" })]);
    Object.keys(DATA.world.locations).filter(locationAvailable).forEach(function (dest) {
      if (dest === state.location) return;
      const loc = DATA.world.locations[dest];
      const check = canTravel(dest);
      const cost = travelCost(state.location, dest);
      ferry.appendChild(actionButton({
        kind: "travel", label: "Cast off for " + loc.short, key: phoneShell() ? null : nextKey(),
        disabled: !check.ok,
        costs: tradeBadges(travelMinutes(cost), cost.fuel, 0),
        onClick: function () { travelTo(dest); }
      }));
      if (!check.ok && check.why.indexOf("needs") === 0) {
        ferry.appendChild(el("p", { class: "act-why", text: "Not enough fuel. Refuel at Landing 3, or radio the tug if you are stuck." }));
      }
    });
    ferryActions.forEach(function (action) {
      ferry.appendChild(actionButton({
        kind: "system", label: action.label, key: nextKey(),
        disabled: (action.cost || 0) > state.credits,
        costs: tradeBadges(actionMinutes(action), action.fuel, action.cost),
        onClick: function () { performAction(action.id); }
      }));
    });
    container.appendChild(ferry);
  }
  function tradeActionAffordable(action) {
    if ((action.cost || 0) > state.credits) return false;
    if (!action.goldSale) return true;
    const q = tradeQuote();
    return !!q && goldHeld() >= action.goldSale.grams && q.canSell >= action.goldSale.grams;
  }
  function cargoOffer(action) {
    let def;
    if (action.freightBuy) {
      const d = TRADE.freight[action.freightBuy];
      def = { title: d.title, cost: d.cost, payment: d.payment, to: d.to, lastStart: d.lastStart };
    } else if (action.cargoBuy) def = { title: action.cargoBuy.courier ? "Co-op courier rice" : "Owned rice · " + action.cargoBuy.crates + " crate(s)", cost: action.cost || 0, payment: action.cargoBuy.courier ? 12 : action.cargoBuy.crates * 30, to: "market", lastStart: "04:25" };
    else if (action.id === "ct_buy_tea") def = { title: "Jun's sealed tea", cost: 24, payment: 38, to: "market", lastStart: "05:55" };
    if (!def) return null;
    const route = state.location === def.to ? { fuel: 0, minutes: 0 } : travelCost(state.location, def.to);
    const crossing = route ? travelMinutes(route) : null;
    const arrival = crossing === null ? null : state.clock + actionMinutes(action) + crossing;
    const remaining = parseClock(def.lastStart) - (arrival === null ? state.clock : arrival);
    const routeAvailable = state.location === def.to || canTravel(def.to).ok;
    return Object.assign(def, { margin: def.payment - def.cost, fuel: route ? route.fuel : null, crossing: crossing, arrival: arrival, reachable: routeAvailable && remaining >= 0,
      text: "Purchase " + def.cost + " cr · Promised " + def.payment + " cr · Gross " + (def.payment - def.cost) + " cr, before fuel and other costs. Deliver to " + DATA.world.locations[def.to].short + ". " +
        (route ? "After " + actionMinutes(action) + " min pickup: " + route.fuel + " fuel / " + crossing + " min crossing; arrive " + formatClock(arrival) + ". " : "No direct crossing. ") +
        (remaining >= 0 ? remaining + " min left on arrival to start the 5 min handover" : "Arrival misses the handover window") + "; last start " + def.lastStart + ". " + (!routeAvailable ? "Current route unavailable. " : "") + "Return travel and any refill are extra." });
  }
  function renderCargoOffer(action, container) {
    const offer = cargoOffer(action);
    if (!offer) return;
    container.appendChild(el("article", { class: "cargo-offer" + (offer.reachable ? "" : " cargo-warning") }, [el("strong", { text: offer.title + " · Before you accept" }), el("p", { text: offer.text })]));
  }
  function renderReviewShelf(container) {
    if (state.location !== "bar") return;
    const rack = el("details", { class: "action-group review-shelf" }, [el("summary", { text: "The Lantern Review · Read an issue" }), el("p", { class: "clue-meta", text: "Free reading · No clock time. Seasonal issues are companion stories." })]);
    rack.open = !!transient.reviewOpen;
    rack.addEventListener("toggle", function () { transient.reviewOpen = rack.open; updateActionsCue(); });
    locationActions().filter(function (a) { return a.readingIssue; }).forEach(function (a) { rack.appendChild(actionButton({ kind: "talk", label: a.label, onClick: function () { performAction(a.id); } })); });
    container.appendChild(rack);
  }
  function marketActionLabel(action) {
    if (action.freightBuy || action.freightDeliver) {
      const d = TRADE.freight[action.freightBuy || action.freightDeliver];
      return action.label + " · Buy " + d.cost + " cr / receive " + d.payment + " cr · Gross " + (d.payment - d.cost) + " cr · " + deliveryTime(d.lastStart) + " · Fuel/time extra";
    }
    if (action.cargoBuy) return action.label + " · Purchase " + (action.cost || 0) + " cr · Promised " + (action.cargoBuy.courier ? "12 cr fee" : action.cargoBuy.crates * 30 + " cr") + " · " + deliveryTime("04:25") + " · Fuel/time extra";
    if (action.id === "ct_buy_tea") return action.label + " · Promised 38 cr at Sora's scale · " + deliveryTime("05:55") + " · Fuel/time extra";
    if ((action.cargoSell || action.cargoReturn) && state.cargo) {
      const total = state.cargo.courier ? (action.cargoSell ? 12 : 0) : state.cargo.crates * (action.cargoSell ? 30 : 16);
      return (action.cargoSell ? "Deliver rice to Nao" : "Return unopened rice at the co-op") + " · " + state.cargo.crates + " crate(s) · " + total + " cr · 5 min";
    }
    if (action.breakfastOpen && state.flags.nb_batch_delivered) {
      const offer = breakfastOffer(!!action.breakfastLate);
      return action.label + " · Your batch: " + offer.sold + " portions / " + offer.revenue + " cr";
    }
    if (!action.goldSale) return action.label;
    const q = tradeQuote();
    return action.label + (q ? " · " + (action.goldSale.grams * (q.sell + action.goldSale.premium)) + " cr now" : "");
  }
  // The small food trade is accounted separately from gold and quest rewards.
  // Demand is only exposed when the opening action is available at five.
  function breakfastOffer(late) {
    const def = TRADE.breakfast;
    if (!def || !state.flags.nb_batch_delivered) return { sold: 0, revenue: 0 };
    const invitations = def.inviteFlags.filter(function (flag) { return state.flags[flag]; }).length;
    const demand = def.demand[state.truth] + invitations * 2 + (state.flags.nb_warmer ? 2 : 0) - (late ? 3 : 0);
    const sold = Math.max(0, Math.min(def.servings, demand));
    return { sold: sold, revenue: sold * def.price };
  }
  function breakfastProgress() {
    const f = state.flags, guests = TRADE.breakfast.inviteFlags.filter(function (flag) { return f[flag]; }).length;
    return [
      f.nb_done ? (f.nb_late ? "Opening complete · You shared the last bowl." : "Opening complete · Nao signed her own menu.") : state.clock >= parseClock("05:45") ? "The first crews have eaten · Nao keeps the last bowl for you until dawn." : "Opening from 05:00 · Return before 05:45 for the first crews; the last bowl stays warm until dawn.",
      (f.nb_done ? "Opening preparation · " + (f.nb_warmer ? "Warm trays ready" : "Nao served in smaller rounds") : "Optional help · " + (f.nb_warmer ? "Serving trays ready" : state.clock >= parseClock("04:45") ? "Nao can manage without the warmer" : "Help Kenji before 03:20, or heat trays with Nao from 03:30 to before 04:45")) + " · Neighbours invited: " + guests + "/3" + (f.nb_done || state.clock >= parseClock("05:00") ? "" : " (before 05:00)."),
      f.nb_batch_owned ? "Extra batch · " + (f.nb_batch_delivered ? "Handed over" : f.nb_done ? "Unserved; donated" : "Aboard the Tern · Hand over for 5 min before 05:40") + " · Cost " + (state.breakfastCost || 0) + " cr" + (f.nb_done ? " · Sales " + (state.breakfastRevenue || 0) + " cr" : " · Actual sales 0–48 cr; fuel and time extra.") : "No extra batch bought · You can complete the story for free. Optional batch: market 24 cr / Landing 3 co-op 18 cr, plus time and crossings."
    ];
  }
  function secondNightProgress() {
    const c = state.cargo;
    const f = state.flags;
    return [
      "Carry-over · " + state.start.credits + " cr · " + grams(state.start.grams) + " gold · Fuel carried from Night One. New market boards, fresh dealer allowances.",
      f.n2_done ? "Nao's festival recipe complete · " + (f.n2_smoky ? "Smoky mushroom rice" : "Plum & sesame rice") + (f.n2_late ? " · Saved bowl ending" : " · First spoonful ending") : f.n2_menu ? "Recipe chosen · Optional seasoning help; free tasting from 05:00 until dawn." : "Visit Nao, then choose a recipe · No purchase required.",
      "Ingredient hold · " + c.crates + "/2 slots · " + (c.courier ? "Co-op property; 12 cr for on-time delivery" : "Your owned cargo") + ". " + c.cost + " cr spent / " + c.revenue + " cr returned, before fuel and time.",
      "One purchase or courier route tonight · Deliver by 04:30 (last start 04:25); return unopened crates by 05:45 (last start 05:40). No automatic payout."
    ];
  }
  function renderSecondNightProgress(container) {
    const section = el("details", { class: "breakfast-progress nb-section" }, [el("summary", { text: "Night Two · Recipe & cargo log" })]);
    secondNightProgress().forEach(function (line) { section.appendChild(el("p", { text: line })); });
    container.appendChild(section);
  }
  function renderCanalProgress(container) {
    if (!state.flags.ct_route && !state.flags.cf_invited) return;
    const f = state.flags, cargo = state.canalTrade;
    const section = el("details", { class: "breakfast-progress nb-section" }, [el("summary", { text: state.night === 3 ? "Kisaragi · Morning routes & cargo" : "Kisaragi · Routes, tea & festival log" })]);
    const lines = ["Harbour crossings: 2 fuel / 40 min each way. Hoshimi: 4 fuel / 55 min each way. Refuel in town for 30 cr / 10 min; tug recovery is available.",
      cargo ? "Tea case · " + cargo.cost + " cr purchase / " + cargo.revenue + " cr sales · " + cargo.units + " aboard. Fuel and time extra; no automatic payout." : "Optional tea trade · One sealed case, 24 cr from Jun / 38 cr to Sora. No purchase needed for either side quest.",
      f.ct_parcel_done ? "Address mystery complete · Hana received the spare spoons; 12 cr fee paid once." : f.ct_parcel ? "Parcel lead · Read the bridge notice and ask Jun, then deliver to Hana." : "Mako has a parcel with an unfinished address."];
    if (state.night === 3) {
      lines.splice(1, 2, "Morning cargo · Jun offers ceramic bowls for Mei and Hana offers lantern cloth for Sora. Read the written cost, payment and deadline before purchasing.", state.truth === "vault" ? "Lock bulletin: low water; no canal passage this shift. Hana's crew table is at the market." : state.truth === "both" && state.clock < parseClock("08:00") ? "Lock bulletin: gate reopens at 08:00. Priya can wait with you for the signed release." : "The canal gate is open. Hana's festival crew table is in Kisaragi.");
    }
    if (f.cf_invited) lines.push(f.cf_done ? (f.cf_shared ? "Nao shared her signed recipe and kept her afternoon off." : "Nao joined the preview supper and reserved a small festival table.") : f.cf_choice ? "Decision made · Return to Hana before dawn with Nao or her signed card." : "Invitation preparation · Sample: " + (f.cf_prepared ? "ready" : "help Nao") + " / Hana: " + (f.cf_met_hana ? "met" : "visit town") + " / Pairing: " + (f.cf_aroma ? "noted" : "ask Jun") + ". Return to Nao to choose.");
    lines.forEach(function (text) { section.appendChild(el("p", { text: text })); });
    container.appendChild(section);
  }
  function renderBreakfastProgress(container) {
    const section = el("section", { class: "breakfast-progress nb-section" }, [el("h3", { text: "Nao · The Last Bowl Before Sunrise" })]);
    breakfastProgress().forEach(function (line) { section.appendChild(el("p", { text: line })); });
    container.appendChild(section);
  }
  function renderMarketDirectory(container, spot) {
    const directory = el("div", { class: "market-directory", role: "group", "aria-label": "Browse the Night Market" });
    directory.appendChild(el("p", { class: "action-group-label", text: "Lantern Market · Pick a stall" }));
    directory.appendChild(el("p", { class: "market-status", text: state.night === 3 ? "Morning crew · Gold, small cargo & a festival table" : state.night === 2 ? (state.flags.n2_done ? "Festival recipe ready · Gold and tea until dawn" : "Festival preparations · Gold, ingredients & Nao’s new recipe") : state.flags.nb_done ? "Nao's breakfast counter open · Gold until dawn · Repair bench closed" : state.flags.nb_started && state.clock >= parseClock("05:00") ? "Nao's breakfast is ready · Visit her food counter" : state.clock >= parseClock("03:30")
      ? "Late watch · Tea and gold until dawn · Repair bench closed"
      : "Gold scale · Hot food · Repairs · A delivery to trace" }));
    const buttons = el("div", { class: "market-stalls" });
    [{ spot: "all", label: "All stalls" }, { spot: "gold", label: "Sora · Gold", id: "nm_visit_gold" }, { spot: "food", label: "Nao · Food & tea", id: "nm_visit_food" }, { spot: "repair", label: "Kenji · Repairs", id: "nm_visit_repair" }, { spot: "lane", label: "Delivery lane", id: "nm_visit_lane" }].forEach(function (entry) {
      const closed = entry.spot === "repair" && state.clock >= parseClock("03:30");
      buttons.appendChild(el("button", { type: "button", class: "market-stall", disabled: closed, "aria-pressed": entry.spot === spot ? "true" : "false", onclick: function () {
        if (entry.id) performAction(entry.id);
        else { transient.marketSpot = null; render(); focusEncounter(); }
      } }, closed ? "Kenji · Closed" : entry.label));
    });
    directory.appendChild(buttons);
    if ((state.night || 1) === 1 && spot === "repair" && state.clock < parseClock("03:30")) directory.appendChild(el("p", { class: "market-help", text: "Kenji's order needs 2 g and at least 2 g of Sora's remaining buying allowance. You can report the delivery for 25 cr instead. His bench closes at 03:30." }));
    container.appendChild(directory);
  }
  // The scale where you are: its two numbers, what you hold, and a few sizes of trade.
  function renderGoldGroup(nextKey) {
    const q = tradeQuote();
    if (!q) return null;
    const held = goldHeld();
    const avg = MARKET.lots.average(state.gold);
    const group = el("div", { class: "action-group gold-group", id: "gold-group" }, [
      el("p", { class: "action-group-label", text: "Gold exchange · " + q.dealer.name }),
      el("p", { class: "gold-quote" }, q.buyOnly
        ? ["The desk pays ", el("b", { text: String(q.sell) }), " cr a gram"]
        : ["Buy ", el("b", { text: String(q.buy) }), " · Sell ", el("b", { text: String(q.sell) }), " cr a gram"]),
      el("p", { class: "gold-hold", text: "You hold " + grams(held) + (held ? ", paid " + Math.round(avg) + " a gram on average" : "") + " · " + state.credits + " cr in your purse" })
    ]);
    function tradeButton(id, kind, label, badge, disabled, onClick) {
      const button = actionButton({ kind: kind, label: label, key: nextKey(), disabled: disabled,
        costs: el("span", { class: "act-costs" }, [el("span", { class: "cost credits", text: badge })]), onClick: onClick });
      button.id = id;
      return button;
    }
    group.appendChild(el("p", { class: "market-help", text: "Buy: you pay · Sell: you receive · Trades take no time" }));
    group.appendChild(el("p", { class: "market-stock", text: q.buyOnly
      ? "Desk can still buy " + grams(q.canSell) + " from you tonight"
      : "Available here: " + grams(q.canBuy) + " · Keep credits for food and fuel" }));
    // a dealer running low, sold out, or with his fill of your gold says so (4.0.1)
    if (q.buyOnly && q.dealer.limitNote) group.appendChild(el("p", { class: "gold-hold", text: q.canSell <= 0 ? q.dealer.full : q.dealer.limitNote }));
    if (!q.buyOnly && q.canBuy < 1 && q.dealer.soldOut) group.appendChild(el("p", { class: "gold-hold", text: q.dealer.soldOut }));
    else if (!q.buyOnly && q.canBuy <= 5 && q.dealer.lowStock) group.appendChild(el("p", { class: "gold-hold", text: q.dealer.lowStock }));
    if (!q.buyOnly) {
      const afford = Math.min(Math.floor(state.credits / q.buy), q.canBuy);
      group.appendChild(tradeButton("trade-buy-1", "buy", "Buy 1 g", "−" + q.buy + " cr", afford < 1, function () { buyGold(1); }));
      const big = Math.min(5, afford);
      if (big > 1) group.appendChild(tradeButton("trade-buy-n", "buy", "Buy " + big + " g" + (big < 5 ? (q.canBuy <= big ? " (all there is)" : " (all you can afford)") : ""), "−" + big * q.buy + " cr", false, function () { buyGold(big); }));
    }
    const sellable = Math.min(held, q.canSell);
    group.appendChild(tradeButton("trade-sell-1", "sell", "Sell 1 g", "+" + q.sell + " cr", sellable < 1, function () { sellGold(1); }));
    if (sellable > 1) group.appendChild(tradeButton("trade-sell-all", "sell", (sellable < held ? "Sell " : "Sell all ") + grams(sellable) + (sellable < held ? " (all they'll take)" : ""), "+" + Math.round(sellable * q.sell) + " cr", false, function () { sellGold(sellable); }));
    return group;
  }

  function renderLines(container, items) {
    items.forEach(function (item) {
      if (item.type === "speech") container.appendChild(speechNode(item));
      else if (item.type === "notice") container.appendChild(el("p", { class: "notice " + (item.tone || ""), text: item.text }));
      else container.appendChild(el("p", { class: "narration", text: item.text }));
    });
  }

  // A compact RPG dialogue box, with full-text reading always available. Paging is
  // presentation only: no timers, typewriter delays, extra costs or duplicate actions.
  function renderConversation(container, items, key) {
    if (!items.some(function (item) { return item.type === "speech"; })) { renderLines(container, items); return; }
    const pages = [];
    let page = [];
    items.forEach(function (item) {
      if (page.some(function (line) { return line.type === "speech"; }) && item.type === "speech") {
        pages.push(page); page = [];
      }
      page.push(item);
    });
    if (page.length) pages.push(page);
    if (!transient.dialogue || transient.dialogue.key !== key) transient.dialogue = { key: key, page: 0, all: false };
    const view = transient.dialogue;
    const box = el("section", { class: "dialogue-box", "aria-label": "Conversation" });
    function draw(focusId) {
      box.innerHTML = "";
      box.appendChild(el("p", { class: "dialogue-kicker", text: "Harbour voices · Take your time" }));
      renderLines(box, view.all ? items : pages[Math.min(view.page, pages.length - 1)]);
      if (pages.length > 1) {
        const controls = el("div", { class: "dialogue-controls" });
        if (!view.all) {
          controls.appendChild(el("button", { id: "dialogue-back", class: "btn btn-small", type: "button", disabled: view.page === 0,
            onclick: function () { view.page--; draw(view.page === 0 ? "dialogue-next" : "dialogue-back"); } }, "Previous"));
          controls.appendChild(el("span", { class: "dialogue-progress", text: (view.page + 1) + " / " + pages.length }));
          if (view.page < pages.length - 1) controls.appendChild(el("button", { id: "dialogue-next", class: "btn btn-small btn-primary", type: "button",
            onclick: function () { view.page++; draw(view.page < pages.length - 1 ? "dialogue-next" : "dialogue-all"); } }, "Next →"));
          else controls.appendChild(el("span", { class: "dialogue-end", text: "Your move, skipper." }));
        }
        controls.appendChild(el("button", { id: "dialogue-all", class: "btn btn-small", type: "button",
          "aria-pressed": view.all ? "true" : "false", onclick: function () { view.all = !view.all; draw("dialogue-all"); } }, view.all ? "One line at a time" : "Read full exchange"));
        box.appendChild(controls);
      }
      if (focusId) { const button = box.querySelector("#" + focusId); if (button) button.focus({ preventScroll: true }); }
    }
    draw(); container.appendChild(box);
  }

  function speechNode(item) {
    const who = DATA.world.characters[item.who] || { name: item.who, color: "#8fb6b5" };
    const wrapper = el("div", { class: "speech" + ((who.artStyle === "anime" || who.artStyle === "manga") ? " featured-portrait" : "") + (who.portrait ? "" : " no-portrait"), style: "--speaker:" + who.color });
    if (who.portrait) {
      const img = el("img", { class: "portrait", src: who.portrait, alt: "", width: "112", height: "112", decoding: "async" });
      img.addEventListener("error", function () { wrapper.classList.add("no-portrait"); img.remove(); });
      wrapper.appendChild(img);
    }
    wrapper.appendChild(el("div", { class: "speech-text" }, [
      el("span", { class: "speaker", text: who.name }),
      who.role ? el("span", { class: "speaker-role", text: who.role }) : null,
      el("p", { text: item.text })
    ]));
    return wrapper;
  }

  function costBadges(minutes, fuel, extraLabel) {
    const badges = [];
    if (fuel) badges.push(el("span", { class: "cost fuel", text: fuel + " fuel" }));
    if (extraLabel) badges.push(el("span", { class: "cost", text: extraLabel }));
    else if (minutes > 0) badges.push(el("span", { class: "cost", text: "+" + minutes + " min" }));
    else badges.push(el("span", { class: "cost free", text: "0 min" }));
    return el("span", { class: "act-costs" }, badges);
  }

  function actionButton(opts) {
    const button = el("button", {
      class: "action-btn kind-" + (opts.kind || "talk"),
      type: "button",
      disabled: opts.disabled ? true : null,
      "data-key": opts.key || null,
      "data-label": opts.label,
      onclick: opts.onClick
    }, [
      el("span", { class: "act-label" }, [opts.key ? el("span", { class: "key", text: opts.key }) : null, opts.label]),
      opts.costs || null
    ]);
    return button;
  }

  function renderActions(container) {
    let key = 0;
    function nextKey() { key += 1; return key <= 9 ? String(key) : null; }

    // Showing a clue: the choices give way to the clues held, until one is picked or the notebook is put away.
    const showing = transient.showing && locationActions().filter(function (a) { return a.id === transient.showing && a.kind === "show"; })[0];
    if (showing) {
      const group = el("div", { class: "action-group" }, [el("p", { class: "action-group-label", text: showing.label + " · which clue?" })]);
      if (!state.clues.length) group.appendChild(el("p", { class: "act-none", text: "Nothing in the notebook yet." }));
      state.clues.forEach(function (entry) {
        const clue = activeCase.clues[entry.id];
        const shownBefore = (state.shown[showing.id] || []).indexOf(entry.id) !== -1;
        group.appendChild(actionButton({
          kind: "show", label: clue.title + (shownBefore ? " · shown" : ""), key: nextKey(), costs: costBadges(0),
          onClick: function () { performShow(showing.id, entry.id); }
        }));
      });
      group.appendChild(actionButton({ kind: "system", label: "Put the notebook away", key: nextKey(), costs: costBadges(0), onClick: cancelShow }));
      container.appendChild(group);
      return;
    }

    const here = locationActions().filter(function (a) { return a.kind !== "system" && !a.casual; });
    const chats = casualActions();
    const sys = systemActions();
    const confront = sys.filter(function (a) { return a.kind === "confront"; });
    const ferryActions = locationActions().filter(function (a) { return a.kind === "system"; })
      .concat(sys.filter(function (a) { return a.kind !== "confront"; }));

    if (here.length || confront.length) {
      const local = el("div", { class: "action-group" }, [el("p", { class: "action-group-label", text: DATA.world.locations[state.location].short })]);
      here.concat(confront).forEach(function (action) {
        const minutes = actionMinutes(action);
        local.appendChild(actionButton({
          kind: action.kind, label: action.label, key: nextKey(),
          costs: costBadges(minutes, action.fuel, action.costLabel && minutes > 0 ? "+" + minutes + " min · " + action.costLabel : null),
          onClick: function () { performAction(action.id); }
        }));
      });
      container.appendChild(local);
    }

    if (chats.length) {
      const casual = el("details", { class: "action-group casual-group" }, [el("summary", { class: "action-group-label", text: "People · Free conversation" })]);
      casual.open = !!transient.chatOpen;
      chats.forEach(function (action) {
        casual.appendChild(actionButton({ kind: "chat", label: action.label, costs: costBadges(0), onClick: function () { performAction(action.id); } }));
      });
      casual.addEventListener("toggle", function () { transient.chatOpen = casual.open; updateActionsCue(); });
      container.appendChild(casual);
    }

    // On phones the chips above the sheet are the travel buttons, so a Ferry group holding nothing
    // but crossings is marked and hidden there (styles.css 13b).
    const ferry = el("div", { class: "action-group" + (ferryActions.length ? "" : " only-travel") }, [el("p", { class: "action-group-label", text: "Ferry" })]);
    Object.keys(DATA.world.locations).filter(locationAvailable).forEach(function (dest) {
      if (dest === state.location) return;
      const loc = DATA.world.locations[dest];
      const check = canTravel(dest);
      const cost = travelCost(state.location, dest);
      ferry.appendChild(actionButton({
        // hidden in the phone shell (the chips travel), so they take no number there
        kind: "travel", label: "Cast off for " + loc.short, key: phoneShell() ? null : nextKey(),
        disabled: !check.ok,
        costs: costBadges(travelMinutes(cost), cost.fuel, state.canArmed ? "0 min · " + DATA.world.drink.name : null),
        onClick: function () { travelTo(dest); }
      }));
      if (!check.ok && check.why.indexOf("needs") === 0) {
        ferry.appendChild(el("p", { class: "act-why", text: "Not enough fuel. Refuel at Landing 3, or radio the tug if you are stuck." }));
      }
    });
    ferryActions.forEach(function (action) {
      const minutes = actionMinutes(action);
      ferry.appendChild(actionButton({
        kind: action.kind === "use" ? "use" : "system", label: action.label, key: nextKey(),
        costs: costBadges(minutes, action.fuel, action.costLabel && minutes > 0 ? "+" + minutes + " min · " + action.costLabel : null),
        onClick: function () { performAction(action.id); }
      }));
    });
    container.appendChild(ferry);
    if (!here.length && !confront.length && !ferryActions.length) {
      container.appendChild(el("p", { class: "act-none", text: "Nothing more to do here for now. Cross the harbour with the buttons under the picture." }));
    }
  }

  function renderConfrontation(body, actions) {
    const c = state.confront;
    const conf = activeCase.confrontation;
    body.appendChild(el("p", { class: "stage-label", text: conf.stageLabels[c.stage] }));

    if (c.stage === "select") {
      renderLines(body, expandLines(conf.intro));
      // What the notebook's timeline says about the lines the liar will test, so the link between the
      // notebook and the counter is visible here.
      const tested = timelineTested();
      if (tested.length) {
        const list = el("ul", { class: "tl-summary" });
        tested.forEach(function (row) {
          const answer = state.timeline[row.id];
          list.appendChild(el("li", {}, [
            el("span", { class: "tl-when", text: row.clock + " · " + timelineWhere(row) }),
            el("span", { class: "tl-said" + (answer ? "" : " empty"), text: answer ? timelineName(answer) : "not filled in" })
          ]));
        });
        body.appendChild(el("div", { class: "tl-summary-wrap" }, [el("p", { class: "tl-summary-head", text: "Your notebook's timeline says" }), list]));
      }
      if (c.feedback) renderLines(body, c.feedback);
      body.appendChild(el("p", { class: "notice", text: conf.selectPrompt }));
      const list = el("div", { class: "evidence-list", role: "group", "aria-label": "Evidence" });
      state.clues.forEach(function (entry) {
        const clue = activeCase.clues[entry.id];
        const selected = c.selected.indexOf(entry.id) !== -1;
        const full = c.selected.length >= conf.maxEvidence && !selected;
        const input = el("input", { type: "checkbox", id: "ev-" + entry.id, checked: selected ? true : null, disabled: full ? true : null,
          onchange: function () { toggleEvidence(entry.id); } });
        list.appendChild(el("label", { class: "evidence-item" + (selected ? " selected" : "") + (full ? " disabled" : ""), for: "ev-" + entry.id }, [
          input,
          el("span", {}, [el("span", { class: "ev-title", text: clue.title }), el("span", { class: "ev-text", text: clue.text })])
        ]));
      });
      body.appendChild(list);
      body.appendChild(el("p", { class: "evidence-counter", text: c.selected.length + " / " + conf.maxEvidence + " " + conf.counterLabel }));
      actions.appendChild(actionButton({ kind: "confront", label: conf.submitLabel, disabled: c.selected.length === 0, costs: costBadges(0), onClick: submitEvidence }));
      actions.appendChild(actionButton({ kind: "system", label: conf.stepBackLabel, costs: costBadges(0), onClick: stepBack }));
      return;
    }

    if (c.stage === "explain") {
      if (c.feedback) renderLines(body, c.feedback);
      body.appendChild(el("p", { class: "notice", text: conf.explainPrompt }));
      const theories = el("div", { class: "evidence-list", role: "radiogroup", "aria-label": "Explanation" });
      conf.explanations.forEach(function (e) {
        const input = el("input", { type: "radio", name: "explanation", id: "ex-" + e.id, checked: c.explanation === e.id ? true : null,
          onchange: function () { c.explanation = e.id; c.feedback = null; saveGame(); syncAccuseButton(); } });
        theories.appendChild(el("label", { class: "evidence-item" + (c.explanation === e.id ? " selected" : ""), for: "ex-" + e.id }, [
          input, el("span", {}, [el("span", { class: "ev-theory", text: e.label })])
        ]));
      });
      body.appendChild(theories);
      body.appendChild(el("p", { class: "notice", text: conf.supportPrompt }));
      const supports = el("div", { class: "evidence-list", role: "radiogroup", "aria-label": "Supporting clue" });
      state.clues.forEach(function (entry) {
        const clue = activeCase.clues[entry.id];
        const input = el("input", { type: "radio", name: "support", id: "sp-" + entry.id, checked: c.support === entry.id ? true : null,
          onchange: function () { c.support = entry.id; c.feedback = null; saveGame(); syncAccuseButton(); } });
        supports.appendChild(el("label", { class: "evidence-item" + (c.support === entry.id ? " selected" : ""), for: "sp-" + entry.id }, [
          input, el("span", {}, [el("span", { class: "ev-title", text: clue.title }), el("span", { class: "ev-text", text: clue.text })])
        ]));
      });
      body.appendChild(supports);
      const accuse = actionButton({ kind: "confront", label: conf.accuseLabel, disabled: !(c.explanation && c.support), costs: costBadges(0), onClick: submitExplanation });
      accuse.id = "btn-accuse";
      actions.appendChild(accuse);
      actions.appendChild(actionButton({ kind: "system", label: conf.stepBackLabel, costs: costBadges(0), onClick: stepBack }));
      return;
    }

    // stage === "choice"
    if (c.feedback) renderLines(body, c.feedback);
    body.appendChild(el("p", { class: "notice", text: conf.choicePrompt }));
    // A choice that names the dawn ("until the dawn truck") can say something else once dawn has gone.
    const late = state.clock >= DAWN_CLOCK;
    activeCase.finalChoices.forEach(function (choice, i) {
      const label = late && choice.lateLabel ? choice.lateLabel : choice.label;
      actions.appendChild(actionButton({ kind: "choice", label: label, key: String(i + 1), costs: costBadges(0), onClick: function () { chooseEnding(choice.id); } }));
    });
  }
  function syncAccuseButton() {
    const button = $("btn-accuse");
    const c = state.confront;
    if (button && c) button.disabled = !(c.explanation && c.support);
    document.querySelectorAll(".evidence-item").forEach(function (item) {
      const input = item.querySelector("input");
      item.classList.toggle("selected", !!(input && input.checked));
    });
  }

  /* ------------------------------------------------------------------ */
  /* 11 · NOTEBOOK, MODAL, TOAST                                         */
  /* ------------------------------------------------------------------ */
  // The gold night's notebook: what you heard (in their words, who and when), your gold, the boards
  // you have read, and the people you have met, as impressions rather than numbers.
  function renderTradeNotebook() {
    dom.notebookCount.textContent = String(state.rumors.length);
    dom.notebookCount.setAttribute("aria-label", "notes");
    const body = dom.nbBody;
    body.innerHTML = "";

    if (transient.wireOpen) { renderHarbourWire(body); return; }
    body.appendChild(el("button", { class: "btn wire-shortcut", type: "button", onclick: openHarbourWire, text: "Harbour Wire · " + wirePosts().filter(function (p) { return p.unread; }).length + " unread · Neighbours & notices" }));
    renderStoryProgress(body);
    renderCargoProgress(body);
    if (state.night === 2) renderSecondNightProgress(body);
    renderCanalProgress(body);
    if (state.flags.nb_started) renderBreakfastProgress(body);
    const heardSection = el("section", { class: "nb-section" }, [el("h3", { text: "Rumours & discoveries (" + state.rumors.length + ")" })]);
    if (!state.rumors.length) {
      heardSection.appendChild(el("p", { class: "nb-empty", text: "Nothing written down yet. What people tell you goes here, in their words, with who said it and when. Whether it's true is up to you." }));
    }
    state.rumors.slice().reverse().forEach(function (entry) {
      const def = TRADE.rumors[entry.id];
      const old = def.expires && state.clock > parseClock(def.expires);
      heardSection.appendChild(el("article", { class: "clue rumor" + (old ? " old" : "") }, [
        el("p", { class: "clue-meta rumor-meta", text: formatClock(entry.at) + " — " + rumorSource(entry.id) + (old ? " · a while ago now" : "") }),
        el("p", { class: "rumor-note", text: def.note })
      ]));
    });
    body.appendChild(heardSection);

    const held = goldHeld();
    const goldSection = el("section", { class: "nb-section" }, [
      el("h3", { text: "Gold" }),
      el("p", { class: "nb-gold", text: grams(held) + (held ? " · paid " + Math.round(MARKET.lots.average(state.gold)) + " cr a gram on average" : "") + " · " + state.credits + " cr" })
    ]);
    state.gold.forEach(function (lot) {
      goldSection.appendChild(el("article", { class: "clue" }, [
        el("p", { class: "clue-title", text: grams(lot.grams) + " · " + lot.karat + "k · " + lot.cost + " cr a gram" }),
        lot.provenance ? el("p", { class: "clue-meta", text: lot.provenance }) : null
      ]));
    });
    if (state.trades.length) {
      const list = el("ul", { class: "nb-trades" });
      state.trades.forEach(function (t) {
        list.appendChild(el("li", { text: formatClock(t.at) + " · " + DATA.world.locations[t.where].short + " · " + (t.kind === "buy" ? "bought " : "sold ") + grams(t.grams) + " at " + t.price + " (" + t.total + " cr)" }));
      });
      goldSection.appendChild(list);
    }
    body.appendChild(goldSection);

    const seenIds = Object.keys(state.seen);
    if (seenIds.length) {
      const list = el("ul", { class: "nb-trades" });
      Object.keys(DATA.world.locations).forEach(function (loc) {
        const s = state.seen[loc];
        if (!s) return;
        list.appendChild(el("li", { text: rememberedQuote(loc) }));
      });
      body.appendChild(el("section", { class: "nb-section" }, [el("h3", { text: "Market boards · Last observed" }), el("p", { class: "clue-meta", text: "These are recorded prices, not guaranteed current offers." }), list]));
    }

    const met = Object.keys(TRADE.people).filter(function (id) {
      return state.flags["met_" + id] || state.rumors.some(function (r) { return TRADE.rumors[r.id].source === id; });
    });
    if (met.length) {
      const peopleSection = el("section", { class: "nb-section" }, [el("h3", { text: "People" })]);
      met.forEach(function (id) {
        const lines = expandLines(TRADE.people[id]).map(function (item) { return item.text; });
        peopleSection.appendChild(el("p", { class: "nb-person", text: lines.join(" ") }));
      });
      body.appendChild(peopleSection);
    }

    body.appendChild(el("section", { class: "nb-section" }, [
      el("h3", { text: "Shift" }),
      el("p", { class: "clue-meta", text: "Seed " + state.seed + " · started " + TRADE.meta.startClock + " · now " + formatClock(state.clock) + (storage.ok ? "" : " · saving unavailable") })
    ]));
  }

  function renderNotebook() {
    if (isTrade()) { renderTradeNotebook(); return; }
    dom.notebookCount.setAttribute("aria-label", "clues");
    dom.notebookCount.textContent = String(state.clues.length);
    const body = dom.nbBody;
    body.innerHTML = "";

    body.appendChild(el("section", { class: "nb-section" }, [
      el("h3", { text: "Objective" }),
      el("p", { class: "nb-objective", text: currentObjective() })
    ]));

    const rows = timelineRows();
    if (rows.length) {
      const filled = rows.filter(function (row) { return !!state.timeline[row.id]; }).length;
      const section = el("section", { class: "nb-section nb-timeline" }, [
        el("h3", { text: "The night (" + filled + " of " + rows.length + " filled in)" }),
        el("p", { class: "tl-intro", text: state.resolved
          ? "How the night went, against what you wrote down."
          : "Who was where, and when. Fill it in from what you have read; it is tested at the counter alongside the evidence." })
      ]);
      rows.forEach(function (row) {
        const answer = state.timeline[row.id] || "";
        const ready = hintsOn() && !answer && !state.resolved && (row.clues || []).some(hasClue);
        const selectId = "tl-" + row.id;
        const select = el("select", { id: selectId, class: "tl-select", "aria-label": row.clock + ", " + timelineWhere(row) + ": " + row.question,
          disabled: state.resolved ? true : null,
          onchange: function (e) { setTimelineAnswer(row.id, e.target.value); renderNotebookKeepingPlace(selectId); } });
        select.appendChild(el("option", { value: "", text: "— who? —" }));
        activeCase.names.forEach(function (n) { select.appendChild(el("option", { value: n.id, text: n.name, selected: answer === n.id ? true : null })); });
        const line = el("div", { class: "tl-row" + (ready ? " ready" : ""), "data-line": row.id }, [
          el("p", { class: "tl-when", text: row.clock + " · " + timelineWhere(row) + (ready ? " · ready to fill in" : "") }),
          el("p", { class: "tl-q", text: row.question }),
          select
        ]);
        if (state.resolved) {
          const verdict = timelineVerdict(row);
          line.appendChild(el("p", { class: "tl-verdict " + verdict, text:
            verdict === "right" ? "Right: " + timelineName(row.answer) :
            verdict === "wrong" ? "Wrong. It was " + timelineName(row.answer) + "." :
            "Left blank. It was " + timelineName(row.answer) + "." }));
        }
        section.appendChild(line);
      });
      body.appendChild(section);
    }

    const threads = el("ul", { class: "threads" });
    activeCase.threads.forEach(function (thread) {
      // A "leads" thread with no proof of its own counts clues for any explanation on offer.
      const tags = thread.proof ? (Array.isArray(thread.proof) ? thread.proof : [thread.proof]) : motiveTags();
      const settledBy = tags.reduce(function (acc, tag) {
        cluesProving(tag).forEach(function (id) { if (acc.indexOf(id) === -1) acc.push(id); });
        return acc;
      }, []);
      let status = "open";
      if (thread.leads) {
        status = settledBy.length ? settledBy.length + (settledBy.length === 1 ? " lead" : " leads") : "no leads yet";
      } else if (settledBy.length) {
        status = "settled · " + activeCase.clues[settledBy[0]].title;
      }
      threads.appendChild(el("li", {}, hintsOn()
        ? [el("span", { text: thread.question }), el("span", { class: "status" + (settledBy.length ? " done" : ""), text: status })]
        : [el("span", { text: thread.question })]));
    });
    const threadsSection = el("section", { class: "nb-section" }, [el("h3", { text: "Threads" }), threads]);
    if (!hintsOn()) threadsSection.appendChild(el("p", { class: "nb-nohints", text: "Hints are off: the notebook does not say what your evidence settles, or which lines you can fill in yet." }));
    body.appendChild(threadsSection);

    const evidence = el("section", { class: "nb-section" }, [el("h3", { text: "Evidence (" + state.clues.length + ")" })]);
    if (state.clues.length === 0) {
      evidence.appendChild(el("p", { class: "nb-empty", text: "Nothing written down yet. Clues appear here with their exact wording." }));
    } else {
      Object.keys(DATA.world.locations).forEach(function (locId) {
        const found = state.clues.filter(function (c) { return c.where === locId; });
        if (!found.length) return;
        const group = el("div", { class: "nb-loc-group" });
        found.forEach(function (entry) {
          const clue = activeCase.clues[entry.id];
          group.appendChild(el("article", { class: "clue" }, [
            el("p", { class: "clue-title", text: clue.title }),
            el("pre", { class: "clue-text", text: clue.text }),
            el("p", { class: "clue-meta", text: "Found at " + DATA.world.locations[entry.where].short + " · " + formatClock(entry.foundAt) })
          ]));
        });
        evidence.appendChild(group);
      });
    }
    body.appendChild(evidence);

    body.appendChild(el("section", { class: "nb-section" }, [
      el("h3", { text: "Shift" }),
      el("p", { class: "clue-meta", text: "Seed " + state.seed + " · started " + DATA.meta.startClock + " · now " + formatClock(state.clock) + (storage.ok ? "" : " · saving unavailable") })
    ]));
  }

  // Filling in a timeline line re-renders everything (the objective may change); the reader stays
  // where they were in the drawer and keeps the control they used.
  function renderNotebookKeepingPlace(focusId) {
    const top = dom.nbBody.scrollTop;
    render();
    dom.nbBody.scrollTop = top;
    const node = $(focusId);
    if (node) node.focus({ preventScroll: true });
  }

  function wirePosts() {
    const posts = window.NEON_TIDES_WIRE ? window.NEON_TIDES_WIRE.visible(state, TRADE, conditionHolds, parseClock) : [];
    return posts.map(function (p) {
      const fingerprint = JSON.stringify([p.title, p.text, !!p.stale]);
      return Object.assign({}, p, { fingerprint: fingerprint, unread: (state.wireRead || {})[p.id] !== fingerprint, savedPin: !!(state.wirePins || {})[p.id] });
    });
  }
  function markWireRead(id) {
    const post = wirePosts().find(function (p) { return p.id === id; });
    if (!post) return false;
    if (!state.wireRead) state.wireRead = {};
    state.wireRead[id] = post.fingerprint; saveGame(); return true;
  }
  function toggleWirePin(id) {
    if (!wirePosts().some(function (p) { return p.id === id; })) return false;
    if (!state.wirePins) state.wirePins = {};
    state.wirePins[id] = !state.wirePins[id]; saveGame(); return true;
  }
  function refreshWire(focusId) {
    const top = dom.nbBody.scrollTop; renderNotebook(); dom.nbBody.scrollTop = top;
    const button = $(focusId) || dom.nbBody.querySelector('.wire-filters button[aria-pressed="true"]'); if (button) button.focus({ preventScroll: true });
  }
  function openWireStory(id) {
    transient.wireOpen = false; renderNotebook();
    const row = $("story-" + id);
    if (row) { row.scrollIntoView({ block: "nearest" }); row.focus({ preventScroll: true }); }
  }
  function openHarbourWire() {
    if (!isTrade()) return;
    transient.wireOpen = true;
    transient.wireFilter = "All";
    openNotebook(true);
  }
  function renderHarbourWire(body) {
    body.appendChild(el("button", { class: "btn wire-shortcut", type: "button", text: "Back to journal", onclick: function () { transient.wireOpen = false; renderNotebook(); dom.nbBody.scrollTop = 0; dom.nbBody.querySelector("button").focus({ preventScroll: true }); } }));
    body.appendChild(el("h3", { text: "Harbour Wire · " + wirePosts().filter(function (p) { return p.unread; }).length + " unread" }));
    body.appendChild(el("p", { class: "wire-intro", text: "A little wire across the water · " + formatClock(state.clock) + ". Reading is free. Posts are neighbours' words, not live quotes; check the scale and current offers before trading." }));
    const filters = el("div", { class: "wire-filters", role: "group", "aria-label": "Filter Harbour Wire" });
    window.NEON_TIDES_WIRE.categories.forEach(function (category) {
      filters.appendChild(el("button", { class: "btn btn-small", type: "button", "aria-pressed": (transient.wireFilter || "All") === category ? "true" : "false", text: category, onclick: function () {
        transient.wireFilter = category; renderNotebook();
        const index = window.NEON_TIDES_WIRE.categories.indexOf(category);
        dom.nbBody.querySelectorAll(".wire-filters button")[index].focus({ preventScroll: true });
      } }));
    });
    body.appendChild(filters);
    const list = el("div", { class: "wire-posts", "aria-live": "polite" });
    const posts = wirePosts().filter(function (p) { return !transient.wireFilter || transient.wireFilter === "All" || (transient.wireFilter === "Unread" ? p.unread : transient.wireFilter === "Pinned" ? p.savedPin : p.category === transient.wireFilter); });
    posts.forEach(function (p) {
      const who = TRADE.characters[p.who] || DATA.world.characters[p.who];
      const card = el("article", { class: "wire-post" + (p.stale ? " wire-stale" : "") + (p.unread ? " wire-unread" : "") }, [
        el("p", { class: "wire-meta", text: (who ? who.name : p.who) + " · " + p.category + " · " + (p.time === null ? "Community follow-up" : (p.pinned ? "Pinned · " : "") + formatClock(p.time)) + (p.stale ? " · Offer deadline passed" : "") }),
        el("h4", { text: (p.unread ? "New · " : "") + p.title }), el("p", { text: p.text })
      ]);
      if (p.id === "umbrella" && !state.flags.wire_umbrella_started && !state.resolved) {
        if (state.location === "landing") card.appendChild(el("button", { class: "btn btn-small", type: "button", text: "Offer to find the umbrella", onclick: function () { closeNotebook(); performTradeAction("wire_umbrella_accept"); } }));
        else card.appendChild(el("p", { text: "Meet Priya at Landing 3 to accept this request." }));
      }
      const controls = el("div", { class: "wire-controls" });
      controls.appendChild(el("button", { id: "wire-read-" + p.id, class: "btn btn-small", type: "button", text: p.unread ? "Mark read" : "Read", disabled: !p.unread, onclick: function () { markWireRead(p.id); refreshWire("wire-pin-" + p.id); } }));
      controls.appendChild(el("button", { id: "wire-pin-" + p.id, class: "btn btn-small", type: "button", "aria-pressed": p.savedPin ? "true" : "false", text: p.savedPin ? "Unpin" : "Pin", onclick: function () { toggleWirePin(p.id); refreshWire("wire-pin-" + p.id); } }));
      const storyMap = { umbrella: "wire-umbrella", "umbrella-thanks": "wire-umbrella", yard: "yard", "pump-thanks": "yard", breakfast: "breakfast", "festival-supply": "festival-supply", "festival-supply-thanks": "festival-supply" };
      const story = p.cargo ? "freight-" + p.id.slice(6) : storyMap[p.id];
      if (story && storyProgress().some(function (row) { return row.id === story; })) controls.appendChild(el("button", { class: "btn btn-small", type: "button", text: "View journal entry", onclick: function () { markWireRead(p.id); openWireStory(story); } }));
      card.appendChild(controls);
      list.appendChild(card);
    });
    if (!posts.length) list.appendChild(el("p", { text: "No posts in this category yet. Neighbours pin more as the shift unfolds." }));
    body.appendChild(list);
  }
  let lastFocus = null;
  function openNotebook(keepWire) {
    if (keepWire !== true) transient.wireOpen = false;
    if (dom.notebook.hidden) lastFocus = document.activeElement;
    renderNotebook();
    dom.toast.classList.remove("show");   // a "line you can fill in" toast must not cover the drawer's head
    clearTimeout(toastTimer);
    dom.notebook.hidden = false;
    dom.scrim.hidden = false;
    dom.btnNotebook.setAttribute("aria-expanded", "true");
    dom.btnNotebookClose.focus({ preventScroll: true });
    dom.nbBody.scrollTop = 0;          // after focus: older engines ignore preventScroll and scroll anyway
  }
  function closeNotebook() {
    dom.notebook.hidden = true;
    dom.scrim.hidden = true;
    dom.btnNotebook.setAttribute("aria-expanded", "false");
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function openModal(options) {
    lastFocus = document.activeElement;
    transient.modalAfterClose = options.onClose || null;
    dom.modalTitle.textContent = options.title;
    dom.modalBody.innerHTML = "";
    appendChildren(dom.modalBody, options.body);
    dom.modalActions.innerHTML = "";
    (options.actions || []).forEach(function (action) {
      dom.modalActions.appendChild(el("button", {
        class: "btn" + (action.primary ? " btn-primary" : "") + (action.danger ? " btn-danger" : ""),
        type: "button",
        onclick: function () { closeModal(); if (action.onClick) action.onClick(); }
      }, action.label));
    });
    dom.modal.hidden = false;
    // The card scrolls, and the action buttons are its last child. Focusing a button without
    // preventScroll makes the browser reveal it, which opened long panels ("Captain’s guide") at the end.
    const first = dom.modalActions.querySelector("button");
    if (first) first.focus({ preventScroll: true });
    if (dom.modalCard) dom.modalCard.scrollTop = 0;   // after focus, for engines without preventScroll
  }
  function closeModal() {
    dom.modal.hidden = true;
    const afterClose = transient.modalAfterClose;
    transient.modalAfterClose = null;
    if (afterClose) afterClose();
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  let toastTimer = null;
  function toast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { dom.toast.classList.remove("show"); }, 2800);
  }

  // Phones get the fixed shell (styles.css 13b) only where dvh exists; older engines keep the
  // scrolling layout, where the page itself moves to the story.
  const SHELL_SUPPORTED = !!(window.CSS && CSS.supports && CSS.supports("height", "100dvh"));
  function phoneLayout() { return window.matchMedia("(max-width: 899px)").matches; }
  function phoneShell() { return SHELL_SUPPORTED && phoneLayout(); }

  // After every action the reader starts at the top of what just happened.
  function focusEncounter() {
    if (phoneShell()) {
      dom.encounter.scrollTop = 0;            // the sheet scrolls; the page never does
    } else if (phoneLayout()) {
      dom.encounter.scrollIntoView({ block: "start", behavior: motionReduced() ? "auto" : "smooth" });
    } else {
      dom.encBody.scrollTop = 0;
      dom.encActions.scrollTop = 0;
    }
    updateActionsCue();
  }

  // Phones: "N choices below" floats over the sheet while the first choice is out of view. At the
  // counter it names the one thing to press instead ("Put it on the counter").
  function visibleActionButtons() {
    return Array.prototype.filter.call(dom.encActions.querySelectorAll(".action-btn"), function (b) { return b.offsetParent !== null; });
  }
  function updateActionsCue() {
    const cue = dom.actionsCue;
    let show = false;
    if (phoneShell() && state && transient.mode === "play" && !transient.travelling && dom.resolution.hidden) {
      const buttons = visibleActionButtons();
      if (buttons.length) {
        show = buttons[0].getBoundingClientRect().top > dom.encounter.getBoundingClientRect().bottom - 24;
        if (show) {
          const naming = state.confront && state.confront.stage !== "choice";
          cue.textContent = naming ? buttons[0].getAttribute("data-label") : buttons.length + (buttons.length === 1 ? " choice below" : " choices below");
        }
      }
    }
    cue.hidden = !show;
  }
  function scrollToActions() {
    const sheet = dom.encounter;
    const top = sheet.scrollTop + dom.encActions.getBoundingClientRect().top - sheet.getBoundingClientRect().top - 10;
    sheet.scrollTo({ top: top, behavior: motionReduced() ? "auto" : "smooth" });
    focusFirstChoice();
  }

  // On a phone the objective is one truncated line that opens on a tap; there it is also a real
  // control for keyboards and screen readers. Elsewhere it is plain text, always shown in full.
  function syncObjectiveControl() {
    const cell = dom.instObjectiveCell;
    if (phoneShell()) {
      cell.setAttribute("role", "button");
      cell.setAttribute("tabindex", "0");
      cell.setAttribute("aria-expanded", cell.classList.contains("open") ? "true" : "false");
    } else {
      cell.removeAttribute("role");
      cell.removeAttribute("tabindex");
      cell.removeAttribute("aria-expanded");
    }
  }
  function toggleObjective() {
    dom.instObjectiveCell.classList.toggle("open");
    syncObjectiveControl();
  }

  /* ------------------------------------------------------------------ */
  /* 12 · SAVING (localStorage, with graceful failure)                   */
  /* ------------------------------------------------------------------ */
  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (err) { markStorageBroken(err); return null; }
  }
  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); return true; } catch (err) { markStorageBroken(err); return false; }
  }
  function storageRemove(key) {
    try { window.localStorage.removeItem(key); } catch (err) { markStorageBroken(err); }
  }
  function markStorageBroken(err) {
    if (!storage.ok) return;
    storage.ok = false;
    storage.reason = (err && err.message) || "blocked";
    if (dom.toast) toast("Saving is unavailable in this browser. This shift won't survive a reload.");
  }

  function saveGame() {
    if (!state) return;
    storageSet(SAVE_KEY, JSON.stringify(state));
  }
  function clearSave() { storageRemove(SAVE_KEY); }

  // Returns a valid save object, null if none, or { invalid: reason }.
  function readSave() {
    const raw = storageGet(SAVE_KEY);
    if (!raw) return null;
    let parsed;
    try { parsed = JSON.parse(raw); } catch (err) { return { invalid: "unreadable" }; }
    const problem = saveProblem(parsed);
    return problem ? { invalid: problem } : parsed;
  }
  function saveProblem(obj) {
    if (!obj || typeof obj !== "object") return "not an object";
    if (obj.version !== SAVE_VERSION) return "incompatible version " + obj.version;
    if (typeof obj.seed !== "string") return "missing seed";
    if (obj.kind === "trade") return tradeSaveProblem(obj);
    const variant = variantById(obj.variantId);
    if (!variant) return "unknown case '" + obj.variantId + "'";
    if (!DATA.world.locations[obj.location]) return "unknown location";
    if (typeof obj.clock !== "number" || typeof obj.fuel !== "number") return "bad numbers";
    if (!Array.isArray(obj.clues) || !obj.flags || !obj.used || !obj.visited) return "missing fields";
    const built = buildCase(variant);
    if (obj.clues.some(function (c) { return !c || !built.clues[c.id]; })) return "unknown clue";
    if (obj.timeline && (typeof obj.timeline !== "object" || Array.isArray(obj.timeline))) return "bad timeline";
    if (obj.shown && (typeof obj.shown !== "object" || Array.isArray(obj.shown))) return "bad shown";
    if (obj.ending && !built.endings[obj.ending]) return "unknown ending";
    return null;
  }
  // A saved gold night: the same care, against trade.js instead of a case.
  function tradeSaveProblem(obj) {
    const definition = obj.night === 3 ? THIRD_TRADE : obj.night === 2 ? SECOND_TRADE : BASE_TRADE;
    if (!definition || obj.variantId !== definition.meta.id) return "unknown night '" + obj.variantId + "'";
    if (!definition.truths.some(function (t) { return t.id === obj.truth; })) return "unknown night state";
    if (!DATA.world.locations[obj.location]) return "unknown location";
    if ([obj.clock, obj.fuel, obj.credits].some(function (n) { return typeof n !== "number" || !isFinite(n); })) return "bad numbers";
    if (!Array.isArray(obj.gold) || obj.gold.some(function (lot) { return !lot || typeof lot.grams !== "number" || typeof lot.cost !== "number"; })) return "bad gold";
    if (!Array.isArray(obj.rumors) || obj.rumors.some(function (r) { return !r || !definition.rumors[r.id]; })) return "unknown rumor";
    if (!Array.isArray(obj.trades) || !Array.isArray(obj.convos) || !Array.isArray(obj.fired) || !Array.isArray(obj.clues)) return "missing fields";
    if (!obj.flags || !obj.used || !obj.visited || !obj.rel || !obj.seen || !obj.ambience || !obj.start) return "missing fields";
    if (["rewardCredits", "rewardGrams"].some(function (key) { return obj[key] !== undefined && (!Number.isFinite(obj[key]) || obj[key] < 0); })) return "invalid adventure reward";
    if (["breakfastCost", "breakfastRevenue"].some(function (key) { return obj[key] !== undefined && (!Number.isFinite(obj[key]) || obj[key] < 0); })) return "invalid breakfast trade";
    if (obj.canalTrade !== undefined) {
      const ct = obj.canalTrade;
      if (!ct || ct.cost !== 24 || ![0, 1].includes(ct.units) || ct.revenue !== (ct.units ? 0 : 38) || !obj.flags.ct_tea_owned || (!!obj.flags.ct_tea_sold !== (ct.units === 0))) return "invalid canal tea cargo";
    }
    if (obj.flags.ct_tea_owned && !obj.canalTrade) return "missing canal tea cargo";
    if (obj.breakfastSold !== undefined && (!Number.isInteger(obj.breakfastSold) || obj.breakfastSold < 0 || obj.breakfastSold > 12)) return "invalid breakfast portions";
    if (obj.night !== undefined && obj.night !== 1 && obj.night !== 2 && obj.night !== 3) return "unknown chapter";
    if (obj.night >= 2) {
      if (!obj.previous || typeof obj.previous.seed !== "string" || !obj.previous.flags || Array.isArray(obj.previous.flags) || Object.values(obj.previous.flags).some(function (v) { return typeof v !== "boolean"; }) || !Number.isFinite(obj.previous.worth)) return "bad chapter memory";
      const c = obj.cargo;
      if (!c || typeof c.courier !== "boolean" || ["crates", "bought", "sold", "returned"].some(function (key) { return !Number.isInteger(c[key]) || c[key] < 0 || c[key] > 2; }) || c.crates + c.sold + c.returned !== c.bought || ["cost", "revenue"].some(function (key) { return !Number.isFinite(c[key]) || c[key] < 0; }) || (c.courier && (c.bought > 1 || c.cost !== 0 || c.revenue !== 0))) return "bad ingredient cargo";
    }
    if (obj.freight !== undefined) {
      if (!obj.freight || Array.isArray(obj.freight)) return "bad small freight";
      for (const id of Object.keys(obj.freight)) {
        const c = obj.freight[id], d = (definition.freight || {})[id];
        if (!d || !c || c.cost !== d.cost || ![0, 1].includes(c.units) || c.revenue !== (c.units ? 0 : d.payment) || !obj.flags["freight_" + id + "_owned"] || (!!obj.flags["freight_" + id + "_done"] !== (c.units === 0))) return "invalid small freight";
      }
      if (Object.values(obj.freight).reduce(function (sum, c) { return sum + c.units; }, 0) > 2) return "freight hold overflow";
    }
    if (Object.keys(definition.freight || {}).some(function (id) { return obj.flags["freight_" + id + "_owned"] && !(obj.freight || {})[id]; })) return "missing small freight";
    if (obj.resolved && !obj.finish) return "missing fields";
    return null;
  }

  // The case-file record lives under its own key, like the settings: a corrupt or erased save never
  // takes it along, and a broken record is ignored rather than trusted.
  function loadProfile() {
    const raw = storageGet(PROFILE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || !parsed.cases || typeof parsed.cases !== "object") return;
      Object.keys(parsed.cases).forEach(function (id) {
        const variant = variantById(id);
        const entry = parsed.cases[id];
        if (!variant || !entry || !Array.isArray(entry.endings)) return;
        profile.cases[id] = { endings: entry.endings.filter(function (e) { return !!variant.endings[e]; }) };
      });
    } catch (err) { /* ignore a broken record */ }
  }
  function saveProfile() { storageSet(PROFILE_KEY, JSON.stringify(profile)); }
  function recordEnding(variantId, endingId) {
    const entry = profile.cases[variantId] || (profile.cases[variantId] = { endings: [] });
    if (entry.endings.indexOf(endingId) === -1) entry.endings.push(endingId);
    saveProfile();
  }
  function endingsFound(variantId) { return profile.cases[variantId] ? profile.cases[variantId].endings : []; }

  /* ------------------------------------------------------------------ */
  /* 13 · SETTINGS, SOUND, MOTION                                        */
  /* ------------------------------------------------------------------ */
  function loadSettings() {
    const raw = storageGet(SETTINGS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      settings.station = STATIONS.some(function (s) { return s.id === parsed.station; }) ? parsed.station : "off";
      settings.effects = typeof parsed.effects === "boolean" ? parsed.effects : settings.station !== "off";
      settings.effectsVolume = [0.3, 0.6, 1].indexOf(parsed.effectsVolume) !== -1 ? parsed.effectsVolume : 0.6;
      settings.motion = MOTION_MODES.indexOf(parsed.motion) !== -1 ? parsed.motion : (parsed.reduceMotion ? "reduced" : "auto");
      settings.coached = parsed.coached === true;
      settings.camera = CAMERA_MODES.indexOf(parsed.camera) !== -1 ? parsed.camera : "close";
      settings.hints = parsed.hints === "off" ? "off" : "on";
    } catch (err) { /* ignore a broken settings blob */ }
  }
  function saveSettings() { storageSet(SETTINGS_KEY, JSON.stringify(settings)); }
  // Motion: "auto" follows the system's reduced-motion request, "full" overrides it, "reduced" forces stillness.
  // The CSS only knows body.reduce-motion; this code decides when to set it.
  const MOTION_MODES = ["auto", "full", "reduced"];
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  function systemReducesMotion() { return motionQuery.matches; }
  function motionReduced() {
    return settings.motion === "reduced" || (settings.motion === "auto" && systemReducesMotion());
  }
  function applyMotionSetting() { document.body.classList.toggle("reduce-motion", motionReduced()); }
  function cycleMotion() {
    settings.motion = MOTION_MODES[(MOTION_MODES.indexOf(settings.motion) + 1) % MOTION_MODES.length];
    saveSettings();
    applyMotionSetting();
  }
  function motionLabel() {
    if (settings.motion === "auto") return "auto · system says " + (systemReducesMotion() ? "reduced" : "full");
    return settings.motion;
  }
  function motionSummary() {
    if (settings.motion === "auto" && systemReducesMotion()) return "Your system or browser asks for reduced motion, so the picture is still. Set Motion to \"full\" to override that here.";
    if (settings.motion === "full" && systemReducesMotion()) return "Full motion is forced despite your system's reduced-motion request.";
    if (settings.motion === "reduced") return "Reduced motion is forced by the setting above.";
    return "Your system allows full motion.";
  }

  /* ------------------------------------------------------------------ */
  /* 13b · THE BOAT RADIO — music generated with the Web Audio API       */
  /* No audio files are used: rain is filtered noise, Lantern FM plucks  */
  /* a string model on a pentatonic scale, Basin Lo-Fi sequences drums   */
  /* and synths. Audio starts only after tuning or enabling effects with a gesture. */
  /* ------------------------------------------------------------------ */
  const STATIONS = [
    { id: "off",     name: "Off",         sub: "music off" },
    { id: "rain",    name: "Rain only",   sub: "harbour ambience" },
    { id: "lantern", name: "Lantern FM",  sub: "ambient · plucked strings" },
    { id: "basin",   name: "Basin Lo-Fi", sub: "hypnotic techno" }
  ];
  const radio = { ctx: null, master: null, reverb: null, rainGain: null, noise: null, stop: null, plucks: {}, sfxPlayed: 0, effects: null, lastCue: -Infinity, ambientTimer: null };

  function stationById(id) { return STATIONS.filter(function (s) { return s.id === id; })[0] || STATIONS[0]; }
  function cycleStation() {
    let index = 0;
    STATIONS.forEach(function (s, i) { if (s.id === settings.station) index = i; });
    setStation(STATIONS[(index + 1) % STATIONS.length].id);
  }

  // Builds the shared audio graph once: master → compressor → speakers, a rain loop, a reverb.
  function ensureAudio() {
    if (radio.ctx) return true;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    let ctx;
    try { ctx = new Ctx(); } catch (err) { return false; }
    const rate = ctx.sampleRate;
    const master = ctx.createGain();
    master.gain.value = MASTER_GAIN;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.ratio.value = 4;
    master.connect(compressor);
    compressor.connect(ctx.destination);
    const effects = ctx.createGain();
    effects.gain.value = settings.effects ? settings.effectsVolume : 0;
    effects.connect(compressor);

    // Two seconds of noise, reused for rain, hats, claps and vinyl crackle.
    const noise = ctx.createBuffer(1, rate * 2, rate);
    const noiseData = noise.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;

    // Rain: the noise loop, softened by a low-pass filter that a slow oscillator "gusts".
    const rainSource = ctx.createBufferSource();
    rainSource.buffer = noise;
    rainSource.loop = true;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = "lowpass";
    rainFilter.frequency.value = 1400;
    const rainGain = ctx.createGain();
    rainGain.gain.value = 0;
    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(master);
    rainSource.start();
    const gust = ctx.createOscillator();
    gust.frequency.value = 0.07;
    const gustDepth = ctx.createGain();
    gustDepth.gain.value = 400;
    gust.connect(gustDepth);
    gustDepth.connect(rainFilter.frequency);
    gust.start();

    // Reverb: a convolver fed with a decaying burst of noise, which sounds like a room.
    const impulse = ctx.createBuffer(2, Math.floor(rate * 2.4), rate);
    for (let channel = 0; channel < 2; channel++) {
      const d = impulse.getChannelData(channel);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.4) * 0.6;
    }
    const reverb = ctx.createConvolver();
    reverb.buffer = impulse;
    const wet = ctx.createGain();
    wet.gain.value = 0.4;
    reverb.connect(wet);
    wet.connect(master);

    radio.effects = effects;
    radio.ambientTimer = setInterval(marketAmbience, 16000);
    radio.ctx = ctx; radio.master = master; radio.reverb = reverb; radio.rainGain = rainGain; radio.noise = noise;
    return true;
  }

  function setStation(id, quiet) {
    const station = stationById(id);
    settings.station = station.id;
    saveSettings();
    renderRadio();
    if (station.id === "off") {
      stopMusic();
      if (radio.ctx) {
        radio.rainGain.gain.setTargetAtTime(0, radio.ctx.currentTime, 0.3);
        setTimeout(function () { if (settings.station === "off" && !settings.effects && radio.ctx) radio.ctx.suspend(); }, 1200);
      }
      return;
    }
    if (!ensureAudio()) {
      toast("Audio isn't available in this browser.");
      settings.station = "off"; saveSettings(); renderRadio();
      return;
    }
    const ctx = radio.ctx;
    if (ctx.state === "suspended") resumeAudio();
    stopMusic();
    if (!quiet) radioStatic(ctx.currentTime);
    radio.rainGain.gain.setTargetAtTime(station.id === "rain" ? 0.09 : 0.035, ctx.currentTime, 0.6);
    if (station.id === "lantern") radio.stop = startLanternFM();
    if (station.id === "basin") radio.stop = startBasinLoFi();
  }
  function stopMusic() { if (radio.stop) { radio.stop(); radio.stop = null; } }

  // The music follows the night. Basin Lo-Fi's dull low-pass opens as the shift wears on towards dawn
  // (about 3 kHz at the start of the shift, 7 kHz by the dawn truck), and the whole radio drops back
  // a little while you stand at the counter, the way Mei turns the burner down. Called on every render;
  // setTargetAtTime glides, so repeated calls are harmless.
  const MASTER_GAIN = 0.8;
  function nightProgress() {
    if (!state) return 0;
    return Math.max(0, Math.min(1, (state.clock - START_CLOCK) / (DAWN_CLOCK - START_CLOCK)));
  }
  function nightFilter() { return 3000 + nightProgress() * 4000; }
  function applyMood() {
    if (!radio.ctx || radio.ctx.state !== "running") return;
    const t = radio.ctx.currentTime;
    if (radio.basinFilter) radio.basinFilter.frequency.setTargetAtTime(nightFilter(), t, 2.5);
    radio.master.gain.setTargetAtTime(state && state.confront ? MASTER_GAIN * 0.7 : MASTER_GAIN, t, 0.8);
  }
  // resume() is asynchronous: the mood is applied once the context actually runs again, or a render in
  // the same moment would skip it (and leave the radio ducked after a confrontation, for example).
  function resumeAudio() {
    const resumed = radio.ctx.resume();
    if (resumed && resumed.then) resumed.then(applyMood, function () { /* a refused resume waits for a gesture */ });
  }
  function renderRadio() {
    if (!dom.radioName) return;
    const station = stationById(settings.station);
    dom.radioName.textContent = station.name;
    dom.radioSub.textContent = station.sub;
    dom.btnRadio.setAttribute("data-on", station.id === "off" ? "false" : "true");
    dom.btnRadio.setAttribute("aria-label", "Radio: " + station.name + ". Press to tune to the next station.");
  }

  // A short burst of band-passed noise between stations.
  function radioStatic(t) {
    const ctx = radio.ctx;
    const src = ctx.createBufferSource(); src.buffer = radio.noise;
    const band = ctx.createBiquadFilter(); band.type = "bandpass"; band.frequency.value = 1800; band.Q.value = 0.8;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    src.connect(band); band.connect(g); g.connect(radio.master);
    src.start(t); src.stop(t + 0.3);
  }

  // Travel sound effects: a horn and engine when casting off, a hull bump and bell when mooring.
  // Effects use an independent dry bus: muting it also silences in-flight ferry cues.
  function sfxReady() {
    if (!settings.effects || document.hidden) return false;
    if (!ensureAudio()) return false;
    if (radio.ctx.state === "suspended") resumeAudio();
    return true;
  }
  function sfxCastOff(ms, tug) {
    if (!sfxReady()) return;
    const ctx = radio.ctx, t = ctx.currentTime, dur = Math.max(0.35, ms / 1000);
    radio.sfxPlayed += 1;
    // horn: two detuned sawtooths, low-passed, with a soft swell (the tug's is deeper)
    const hornGain = ctx.createGain();
    hornGain.gain.setValueAtTime(0.0001, t);
    hornGain.gain.exponentialRampToValueAtTime(tug ? 0.16 : 0.12, t + 0.09);
    hornGain.gain.setValueAtTime(tug ? 0.16 : 0.12, t + 0.42);
    hornGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.72);
    const hornTone = ctx.createBiquadFilter(); hornTone.type = "lowpass"; hornTone.frequency.value = 900;
    (tug ? [82.41, 123.47] : [110, 164.81]).forEach(function (f) {
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = Math.random() * 8 - 4;
      o.connect(hornTone); o.start(t); o.stop(t + 0.8);
    });
    hornTone.connect(hornGain); hornGain.connect(radio.effects);
    // engine: a sub-bass triangle with a 9 Hz "chug", plus band-passed noise for the wash
    const engine = ctx.createGain();
    engine.gain.setValueAtTime(0.0001, t);
    engine.gain.exponentialRampToValueAtTime(0.16, t + 0.5);
    engine.gain.setValueAtTime(0.16, t + Math.max(0.5, dur - 0.4));
    engine.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
    const sub = ctx.createOscillator(); sub.type = "triangle"; sub.frequency.value = 46;
    const chugGain = ctx.createGain(); chugGain.gain.value = 0.5;
    const chug = ctx.createOscillator(); chug.frequency.value = 9;
    const chugDepth = ctx.createGain(); chugDepth.gain.value = 0.45;
    chug.connect(chugDepth); chugDepth.connect(chugGain.gain);
    sub.connect(chugGain); chugGain.connect(engine);
    const wash = ctx.createBufferSource(); wash.buffer = radio.noise; wash.loop = true;
    const washBand = ctx.createBiquadFilter(); washBand.type = "bandpass"; washBand.frequency.value = 800; washBand.Q.value = 0.6;
    const washGain = ctx.createGain(); washGain.gain.value = 0.35;
    wash.connect(washBand); washBand.connect(washGain); washGain.connect(engine);
    engine.connect(radio.effects);
    const end = t + dur + 0.3;
    sub.start(t); chug.start(t); wash.start(t);
    sub.stop(end); chug.stop(end); wash.stop(end);
  }
  function sfxMoor() {
    if (!sfxReady()) return;
    const ctx = radio.ctx, t = ctx.currentTime;
    radio.sfxPlayed += 1;
    const thud = ctx.createOscillator();
    thud.frequency.setValueAtTime(90, t); thud.frequency.exponentialRampToValueAtTime(38, t + 0.18);
    const thudGain = ctx.createGain(); thudGain.gain.setValueAtTime(0.28, t); thudGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    thud.connect(thudGain); thudGain.connect(radio.effects); thud.start(t); thud.stop(t + 0.32);
    // the ferry's bell: three partials with long decays
    [[1, 0.11], [2.4, 0.045], [4.1, 0.02]].forEach(function (partial) {
      const bell = ctx.createOscillator(); bell.frequency.value = 660 * partial[0];
      const g = ctx.createGain(); g.gain.setValueAtTime(partial[1], t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      bell.connect(g); g.connect(radio.effects); bell.start(t + 0.06); bell.stop(t + 1.7);
    });
  }

  // Tiny, original procedural cues: muted ceramics, paper and pentatonic glints.
  // The dry effects bus keeps mute immediate; finite sources disconnect when finished.
  function setEffects(on, volume) {
    settings.effects = on === true;
    if ([0.3, 0.6, 1].indexOf(volume) !== -1) settings.effectsVolume = volume;
    if (settings.effects && !ensureAudio()) {
      settings.effects = false;
      toast("Audio isn't available in this browser.");
    }
    saveSettings();
    if (!radio.ctx) return;
    radio.effects.gain.setTargetAtTime(settings.effects ? settings.effectsVolume : 0, radio.ctx.currentTime, 0.03);
    if (settings.effects) { resumeAudio(); soundCue("tea"); }
    else if (settings.station === "off") setTimeout(function () {
      if (!settings.effects && settings.station === "off" && radio.ctx) radio.ctx.suspend();
    }, 250);
  }
  function effectTone(frequency, offset, duration, level, type, endFrequency) {
    const ctx = radio.ctx, t = ctx.currentTime + offset;
    const source = ctx.createOscillator(), gain = ctx.createGain();
    source.type = type || "sine"; source.frequency.setValueAtTime(frequency, t);
    if (endFrequency) source.frequency.exponentialRampToValueAtTime(endFrequency, t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    source.connect(gain); gain.connect(radio.effects);
    source.onended = function () { source.disconnect(); gain.disconnect(); };
    source.start(t); source.stop(t + duration + 0.02);
  }
  function effectNoise(frequency, offset, duration, level, attack) {
    const ctx = radio.ctx, t = ctx.currentTime + offset;
    const source = ctx.createBufferSource(), band = ctx.createBiquadFilter();
    const soften = ctx.createBiquadFilter(), gain = ctx.createGain();
    source.buffer = radio.noise;
    band.type = "bandpass"; band.Q.value = 0.5;
    band.frequency.setValueAtTime(frequency, t);
    band.frequency.exponentialRampToValueAtTime(frequency * 0.7, t + duration);
    // Round off the hiss: steam, pouring water and paper should never crackle
    // like UI static. A slow swell gives the longer textures room to breathe.
    soften.type = "lowpass"; soften.frequency.value = 1800; soften.Q.value = 0.5;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + (attack || 0.03));
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    source.connect(band); band.connect(soften); soften.connect(gain); gain.connect(radio.effects);
    source.onended = function () { source.disconnect(); band.disconnect(); soften.disconnect(); gain.disconnect(); };
    source.start(t); source.stop(t + duration + 0.02);
  }
  function effectCup(offset, level) {
    // A brief, quiet ceramic contact rather than a sustained notification note.
    effectTone(620, offset, 0.16, level);
    effectTone(1030, offset + 0.006, 0.09, level * 0.3);
  }
  function soundCue(kind) {
    if (["buy", "sell", "opening", "repair", "grill", "tea", "bowl"].indexOf(kind) === -1 || !sfxReady()) return false;
    const t = radio.ctx.currentTime;
    // A brief shared cooldown prevents repeated clicks from stacking loud cues.
    if (t - radio.lastCue < 0.45) return false;
    radio.lastCue = t; radio.sfxPlayed += 1;
    if (kind === "buy" || kind === "sell") {
      // A wooden scale settling, low water under the quay, then a paper wrap.
      // No rising electronic arpeggio: the successful action stays understated.
      effectTone(210, 0, 0.11, 0.018, "sine", 135);
      effectNoise(360, 0.04, 0.7, 0.017, 0.12);
      effectNoise(kind === "buy" ? 950 : 760, 0.22, 0.38, 0.012, 0.07);
    } else if (kind === "opening") {
      [261.63, 329.63, 392, 440, 523.25].forEach(function (f, i) { effectTone(f, i * 0.22, 0.85, 0.028, "triangle"); });
      effectTone(130.81, 0, 1.9, 0.022);
      effectNoise(700, 0.1, 0.35, 0.012);
    } else if (kind === "repair") {
      // Two felted bench taps, not three pitched confirmation beeps.
      [0, 0.19].forEach(function (offset) {
        effectTone(185, offset, 0.085, 0.013, "sine", 115);
        effectNoise(580, offset, 0.13, 0.01);
      });
    } else if (kind === "grill") {
      effectNoise(1400, 0, 0.85, 0.018, 0.12);
      effectNoise(680, 0.18, 0.42, 0.009, 0.06);
    } else if (kind === "tea") {
      // A mellow kettle exhale, a pour, then the cup meeting its saucer.
      // Deliberately no high whistle; the texture sits beneath the music.
      effectNoise(850, 0, 1.05, 0.018, 0.2);
      effectNoise(430, 0.16, 0.65, 0.016, 0.12);
      effectCup(0.72, 0.012);
    } else if (kind === "bowl") {
      effectNoise(470, 0, 0.38, 0.011, 0.07);
      effectTone(170, 0.13, 0.12, 0.016, "sine", 110);
      effectCup(0.15, 0.009);
    }
    return true;
  }
  function marketAmbience() {
    // Never wakes a suspended context. No ambience on title, crossings, endings,
    // hidden tabs or reading panels. A sparse cycle avoids voice-like babble.
    if (!settings.effects || !radio.ctx || radio.ctx.state !== "running" || document.hidden ||
        !state || !isTrade() || state.resolved || state.location !== "market" ||
        transient.mode !== "play" || transient.travelling ||
        (dom.modal && !dom.modal.hidden) || (dom.notebook && !dom.notebook.hidden)) return;
    const spot = transient.marketSpot || "all";
    const palette = TRADE.soundscape && TRADE.soundscape.stalls[spot];
    if (!palette || !palette.length) return;
    let kind = palette[Math.floor(radio.ctx.currentTime / 16) % palette.length];
    if (kind === "repair" && state.clock >= parseClock("03:30")) kind = "tea";
    if (kind === "grill" && state.clock >= parseClock("03:30")) kind = "tea";
    if (radio.ctx.currentTime - radio.lastCue >= 8) soundCue(kind);
  }

  // Karplus-Strong: a burst of noise circulating through a short, averaging delay line
  // sounds like a plucked string. Rendered once per pitch into a buffer, then replayed.
  function pluckBuffer(freq) {
    if (radio.plucks[freq]) return radio.plucks[freq];
    const ctx = radio.ctx, rate = ctx.sampleRate;
    const period = Math.max(2, Math.round(rate / freq));
    const buffer = ctx.createBuffer(1, Math.floor(rate * 2.8), rate);
    const out = buffer.getChannelData(0);
    const ring = new Float32Array(period);
    for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
    const damping = 0.997 - freq / 60000;
    let at = 0;
    for (let i = 0; i < out.length; i++) {
      const current = ring[at];
      const following = ring[(at + 1) % period];
      out[i] = current;
      ring[at] = damping * 0.5 * (current + following);
      at = (at + 1) % period;
    }
    radio.plucks[freq] = buffer;
    return buffer;
  }
  function pluck(t, freq, volume, dest, pan) {
    const ctx = radio.ctx;
    const src = ctx.createBufferSource(); src.buffer = pluckBuffer(freq);
    const tone = ctx.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = 2600;
    const g = ctx.createGain(); g.gain.value = volume;
    src.connect(tone); tone.connect(g);
    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner(); panner.pan.value = pan || 0;
      g.connect(panner); panner.connect(dest);
    } else {
      g.connect(dest);
    }
    src.start(t); src.stop(t + 2.8);
  }
  // A struck bowl: a few sine partials with long decays.
  function bowl(t, freq, dest) {
    const ctx = radio.ctx;
    [[1, 0.35], [2.71, 0.16], [5.4, 0.07], [8.93, 0.03]].forEach(function (partial) {
      const o = ctx.createOscillator(); o.frequency.value = freq * partial[0];
      const g = ctx.createGain(); g.gain.setValueAtTime(partial[1], t); g.gain.exponentialRampToValueAtTime(0.0005, t + 7);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + 7.2);
    });
  }
  function chime(t, freq, dest) {
    const ctx = radio.ctx;
    const o = ctx.createOscillator(); o.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.07, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 1.6);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + 1.7);
  }

  // Lantern FM: a low drone, a wandering melody on a Japanese hirajoshi scale, a bowl now and then.
  function startLanternFM() {
    const ctx = radio.ctx;
    const out = ctx.createGain(); out.gain.value = 0;
    out.connect(radio.master); out.connect(radio.reverb);
    out.gain.setTargetAtTime(1, ctx.currentTime, 1.5);
    const droneFilter = ctx.createBiquadFilter(); droneFilter.type = "lowpass"; droneFilter.frequency.value = 420;
    const droneGain = ctx.createGain(); droneGain.gain.value = 0.11;
    droneFilter.connect(droneGain); droneGain.connect(out);
    const drones = [[73.42, "sine"], [110, "triangle"], [146.83, "sine"]].map(function (spec) {
      const o = ctx.createOscillator(); o.type = spec[1]; o.frequency.value = spec[0]; o.detune.value = Math.random() * 6 - 3;
      o.connect(droneFilter); o.start(); return o;
    });
    const swell = ctx.createOscillator(); swell.frequency.value = 0.06;
    const swellDepth = ctx.createGain(); swellDepth.gain.value = 180;
    swell.connect(swellDepth); swellDepth.connect(droneFilter.frequency); swell.start();

    const scale = [146.83, 155.56, 196.0, 220.0, 233.08, 293.66, 311.13, 392.0, 440.0];   // D hirajoshi, two octaves
    const rests = [0.6, 0.9, 1.2, 1.8, 2.4, 3.0];
    let next = ctx.currentTime + 0.4, degree = 3;
    const melody = setInterval(function () {
      while (next < ctx.currentTime + 0.6) {
        const step = Math.random() < 0.65 ? (Math.random() < 0.5 ? -1 : 1) : Math.floor(Math.random() * 5) - 2;
        degree = Math.max(0, Math.min(scale.length - 1, degree + step));
        if (Math.random() < 0.85) pluck(next, scale[degree], 0.45 + Math.random() * 0.3, out, Math.random() * 0.8 - 0.4);
        if (Math.random() < 0.3) pluck(next + 0.14, scale[Math.max(0, degree - 2)], 0.25, out, -0.3);
        next += rests[Math.floor(Math.random() * rests.length)];
      }
    }, 150);
    // These two schedule against the clock "now", so they must skip while the context is suspended:
    // its clock is frozen, and everything they queued would play at once on resume.
    const bowls = setInterval(function () { if (ctx.state === "running" && Math.random() < 0.7) bowl(ctx.currentTime + 0.05, [110, 146.83, 220][Math.floor(Math.random() * 3)], out); }, 11000);
    const chimes = setInterval(function () { if (ctx.state === "running" && Math.random() < 0.5) chime(ctx.currentTime + Math.random() * 0.5, [880, 932.33, 1174.66, 1318.5][Math.floor(Math.random() * 4)], out); }, 2800);
    bowl(ctx.currentTime + 0.2, 146.83, out);
    return function stop() {
      clearInterval(melody); clearInterval(bowls); clearInterval(chimes);
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
      setTimeout(function () { drones.forEach(function (o) { o.stop(); }); swell.stop(); out.disconnect(); }, 1800);
    };
  }

  // Basin Lo-Fi: 104 bpm, four-on-the-floor kick, off-beat hats, a two-bar bass line, a pad that
  // ducks under every kick, a sparse echoing lead and vinyl crackle, all through a dull low-pass.
  function startBasinLoFi() {
    const ctx = radio.ctx;
    const out = ctx.createGain(); out.gain.value = 0;
    const dull = ctx.createBiquadFilter(); dull.type = "lowpass"; dull.frequency.value = nightFilter(); dull.Q.value = 0.6;
    out.connect(dull); dull.connect(radio.master);
    radio.basinFilter = dull;              // applyMood() opens it as the night goes on
    out.gain.setTargetAtTime(0.9, ctx.currentTime, 1.2);
    const send = ctx.createGain(); send.gain.value = 0.3; send.connect(radio.reverb);

    const padGain = ctx.createGain(); padGain.gain.value = 0.05; padGain.connect(out); padGain.connect(send);
    const padFilter = ctx.createBiquadFilter(); padFilter.type = "lowpass"; padFilter.frequency.value = 800; padFilter.Q.value = 2.5; padFilter.connect(padGain);
    const padOscs = [];
    [220, 261.63, 329.63, 392].forEach(function (f) {
      [-6, 6].forEach(function (cents) {
        const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = cents; o.connect(padFilter); o.start(); padOscs.push(o);
      });
    });
    const sweep = ctx.createOscillator(); sweep.frequency.value = 0.04;
    const sweepDepth = ctx.createGain(); sweepDepth.gain.value = 520; sweep.connect(sweepDepth); sweepDepth.connect(padFilter.frequency); sweep.start();
    const wobble = ctx.createOscillator(); wobble.frequency.value = 0.4;
    const wobbleDepth = ctx.createGain(); wobbleDepth.gain.value = 4; wobble.connect(wobbleDepth);
    padOscs.forEach(function (o) { wobbleDepth.connect(o.detune); }); wobble.start();

    const echo = ctx.createDelay(1); echo.delayTime.value = 0.4327;   // a dotted eighth at 104 bpm
    const echoBack = ctx.createGain(); echoBack.gain.value = 0.38;
    const echoTone = ctx.createBiquadFilter(); echoTone.type = "lowpass"; echoTone.frequency.value = 2200;
    echo.connect(echoTone); echoTone.connect(echoBack); echoBack.connect(echo);
    const echoOut = ctx.createGain(); echoOut.gain.value = 0.5; echoTone.connect(echoOut); echoOut.connect(out); echoOut.connect(send);

    function kick(t) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.2);
      g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.4);
      padGain.gain.cancelScheduledValues(t); padGain.gain.setValueAtTime(0.015, t); padGain.gain.setTargetAtTime(0.05, t + 0.03, 0.14);
    }
    function noiseHit(t, type, freq, volume, length) {
      const src = ctx.createBufferSource(); src.buffer = radio.noise; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = 1;
      const g = ctx.createGain(); g.gain.setValueAtTime(volume, t); g.gain.exponentialRampToValueAtTime(0.001, t + length);
      src.connect(f); f.connect(g); g.connect(out); src.start(t); src.stop(t + length + 0.02);
    }
    function bass(t, freq) {
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = freq;
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 7;
      f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(220, t + 0.16);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t + 0.32);
    }
    function lead(t, freq) {
      const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = freq;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.11, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(g); g.connect(echo); g.connect(out); o.start(t); o.stop(t + 0.32);
    }

    const bpm = 104, sixteenth = 60 / bpm / 4;
    const A2 = 110, G2 = 98, C3 = 130.81, E2 = 82.41, F2 = 87.31;
    const bassLine = [A2, 0, A2, 0, 0, A2, 0, A2, C3, 0, 0, A2, 0, G2, 0, 0, A2, 0, A2, 0, 0, A2, 0, E2, F2, 0, 0, A2, 0, G2, 0, C3];
    const leadScale = [440, 523.25, 587.33, 659.25, 783.99, 880];
    let step = 0, next = ctx.currentTime + 0.15;
    const sequencer = setInterval(function () {
      while (next < ctx.currentTime + 0.3) {
        const s = step % 32;
        if (s % 4 === 0) kick(next);
        if (s % 8 === 4) noiseHit(next, "bandpass", 1700, 0.22, 0.14);
        if (s % 2 === 1) noiseHit(next, "highpass", 7000, s % 8 === 7 ? 0.12 : 0.07, s % 8 === 7 ? 0.22 : 0.05);
        if (bassLine[s]) bass(next, bassLine[s]);
        if (s >= 16 && s % 2 === 0 && Math.random() < 0.5) lead(next, leadScale[Math.floor(Math.random() * leadScale.length)]);
        if (Math.random() < 0.35) noiseHit(next + Math.random() * sixteenth, "bandpass", 3000, 0.04, 0.008);
        next += sixteenth; step += 1;
      }
    }, 60);
    return function stop() {
      clearInterval(sequencer);
      radio.basinFilter = null;
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
      setTimeout(function () { padOscs.forEach(function (o) { o.stop(); }); sweep.stop(); wobble.stop(); out.disconnect(); echo.disconnect(); }, 1500);
    };
  }

  /* ------------------------------------------------------------------ */
  /* 14 · SCREENS, EVENTS & START-UP                                     */
  /* ------------------------------------------------------------------ */
  function startNewGame(seedText) {
    const seed = normaliseSeed(seedText) || randomSeed();
    const variant = DATA.variants[pickVariantIndex(seed)];
    setState(newState(seed, variant.id));
    transient.objective = null;
    saveGame();
    setMode("play");
    positionFerry(state.location, null, false);
    render();
    toast("Adventure begun · seed " + seed);
  }

  function continueGame(saved) {
    setState(saved);
    transient.objective = null;
    // A case closed before the case files existed (2.x) still counts as found.
    if (!isTrade() && state.resolved && state.ending) recordEnding(state.variantId, state.ending);
    setMode("play");
    positionFerry(state.location, null, false);
    render();
    if (state.resolved) showResolution();
    toast("Saved shift loaded · " + formatClock(state.clock));
  }

  const RELEASE_SEEN_KEY = "neon-tides:release-seen";
  let sessionReleaseSeen = null;
  function releaseIsNew() {
    const release = window.NEON_TIDES_RELEASE;
    return !!release && sessionReleaseSeen !== release.version && storageGet(RELEASE_SEEN_KEY) !== release.version;
  }
  function releaseLabel() {
    const release = window.NEON_TIDES_RELEASE;
    return release ? "v" + release.version + " · Updated " + release.dateLabel : "";
  }
  function refreshRelease() {
    if (dom.releaseVersion) dom.releaseVersion.textContent = releaseLabel();
    if (dom.btnReleaseNotes) dom.btnReleaseNotes.textContent = "What's new" + (releaseIsNew() ? " · New" : "");
  }
  function openReleaseNotes(fromMenu) {
    const release = window.NEON_TIDES_RELEASE;
    if (!release) return;
    sessionReleaseSeen = release.version;
    storageSet(RELEASE_SEEN_KEY, release.version);
    refreshRelease();
    const notes = el("ul", { class: "release-notes" });
    release.notes.forEach(function (line) { notes.appendChild(el("li", { text: line })); });
    openModal({ title: "What's new", body: [el("p", { class: "muted", text: releaseLabel() }), notes],
      actions: [{ label: fromMenu ? "Back to Menu" : "Close", onClick: fromMenu ? openMenu : null }] });
  }
  function showTitle() {
    setMode("title");
    refreshTitle();
    dom.btnNew.focus({ preventScroll: true });
  }
  function refreshTitle() {
    refreshRelease();
    const saved = readSave();
    const valid = saved && !saved.invalid ? saved : null;
    dom.btnContinue.hidden = !valid;
    if (valid) {
      dom.btnContinue.textContent = valid.kind === "trade"
        ? (valid.resolved ? "Read " : "Continue ") + "Night " + (valid.night || 1) + (valid.resolved ? " morning report" : " · " + formatClock(valid.clock))
        : (valid.resolved ? "Read your case ending" : "Continue investigation · " + formatClock(valid.clock));
    }
    if (!storage.ok) {
      dom.storageNote.textContent = "Saving is unavailable here (private mode or blocked storage). You can still play; progress won't survive a reload.";
    } else if (valid) {
      dom.storageNote.textContent = valid.kind === "trade" && valid.resolved && (valid.night || 1) < 3
        ? "Your shift report is saved. Open it to continue the next chapter with your earnings and choices."
        : valid.kind === "trade" && valid.night >= 2 ? "Your chapter is saved, including the people and choices you carried forward."
        : "Your journey is saved in this browser.";
    } else {
      dom.storageNote.textContent = "Progress autosaves in this browser after every action.";
    }
    if (transient.dataProblem) dom.storageNote.textContent = transient.dataProblem + " — " + dom.storageNote.textContent;
  }

  // The gold night's morning: the harbour wire says what really happened, then what you hold now
  // against what you came ashore with, both valued at Mei's scale.
  function showTradeResolution() {
    const end = TRADE.ending;
    const own = end.byTruth[state.truth];
    const s = state.start, f = state.finish;
    dom.resKicker.textContent = end.kicker;
    dom.resTitle.textContent = own.title;
    dom.resBody.innerHTML = "";
    if (state.flags.end_dawn && end.dawnLine) dom.resBody.appendChild(el("p", { class: "epilogue", text: end.dawnLine }));
    own.wire.forEach(function (text) { dom.resBody.appendChild(el("p", { class: "wire", text: text })); });
    const clockNow = state.clock;
    state.clock = state.endedAt;               // read at the moment you turned in, like the cases' endings
    // what you did, read back: the first three reflections that hold, most specific first
    const reflections = expandLines(end.reflections || []).slice(0, 3);
    const closing = expandLines(end.closing);
    state.clock = clockNow;
    reflections.forEach(function (item) { dom.resBody.appendChild(el("p", { class: "reflection", text: item.text })); });
    closing.forEach(function (item) { dom.resBody.appendChild(el("p", { text: item.text })); });
    dom.resBody.appendChild(el("p", { class: "epilogue", text: "You came ashore with " + s.credits + " cr and " + grams(s.grams) + " of gold, " + s.worth + " cr at Mei's prices then. You turn in with " + f.credits + " cr and " + grams(f.grams) + ", " + f.worth + " cr at Mei's prices now." }));
    if (state.night >= 2 && state.cargo.crates) dom.resBody.appendChild(el("p", { class: "epilogue", text: "Unserved rice · The unopened crates go to the morning co-op. No sale, return or courier payment is awarded automatically. Your purchase cost remains in the cargo account." }));
    const net = f.worth - s.worth;
    // What the same gold would be worth had you only held it: separates the harbour's drift from your choices.
    const idle = Math.round(s.credits + s.grams * f.sell) - s.worth;
    function signed(n) { return (n > 0 ? "+" : n < 0 ? "−" : "±") + Math.abs(n) + " cr"; }
    dom.resStats.innerHTML = "";
    [
      [state.flags.end_dawn ? (state.night === 3 ? "Shift end" : "Dawn") : "Turned in", formatClock(state.endedAt)],
      ["The night", signed(net) + ", valued at Mei's scale"],
      ["Had you sat still", signed(idle) + ": your " + grams(s.grams) + ", held all night"],
      ["Your gold trades", state.trades.length ? signed(tradeChoicesResult()) + " against holding, food, fuel, food cargo and adventure rewards aside" : "none"],
      ["Breakfast batch", state.breakfastCost ? (state.breakfastRevenue || 0) + " cr sales − " + state.breakfastCost + " cr stock = " + signed((state.breakfastRevenue || 0) - state.breakfastCost) + " before fuel and time" : "No extra batch bought"],
      ["Adventure reward", (state.rewardCredits || 0) + " cr · " + grams(state.rewardGrams || 0) + " of gold"],
      ["Ingredient cargo", state.cargo ? state.cargo.revenue + " cr returned − " + state.cargo.cost + " cr stock = " + signed(state.cargo.revenue - state.cargo.cost) + " before fuel/time; " + state.cargo.crates + " crate(s) unserved" + (state.cargo.courier ? "; courier fee listed as adventure reward" : "") : "No ingredient trade on Night One"],
      ["Small cargo", freightTotals().revenue + " cr sales − " + freightTotals().cost + " cr stock, before fuel/time"],
      ["Canal tea", state.canalTrade ? state.canalTrade.revenue + " cr sales − " + state.canalTrade.cost + " cr stock = " + signed(state.canalTrade.revenue - state.canalTrade.cost) + " before fuel/time; " + state.canalTrade.units + " case aboard" : "No canal tea bought"],
      ["Spent ashore", ((state.spent || 0) - (state.breakfastCost || 0) - (state.cargo ? state.cargo.cost : 0) - (state.canalTrade ? state.canalTrade.cost : 0) - freightTotals().cost) + " cr on food, tea and fuel"],
      ["Credits", s.credits + " → " + f.credits],
      ["Gold", grams(s.grams) + " → " + grams(f.grams) + " (Mei pays " + f.sell + " a gram)"],
      ["Trades", state.trades.length ? state.trades.length + (state.trades.length === 1 ? " trade" : " trades") : "none: you held what you had"],
      ["Heard", state.rumors.length + " of " + Object.keys(TRADE.rumors).length + " things worth writing down"],
      ["Seed", state.seed + " — the same seed is the same night"]
    ].forEach(function (pair) {
      dom.resStats.appendChild(el("dt", { text: pair[0] }));
      dom.resStats.appendChild(el("dd", { text: pair[1] }));
    });
    if (state.night === 3 && state.flags.af_ready) dom.resBody.appendChild(actionButton({ kind: "choice", label: state.flags.af_done ? "Read your afternoon with Nao & Haruto" : "An afternoon off · Nao & Haruto", onClick: openFamilyAfternoon }));
    dom.btnResContinue.textContent = "Look around";
    dom.btnResNew.textContent = nextNightLabel();
    revealResolution();
  }

  function finishFamilyAfternoon(choice) {
    if (!state || !isTrade() || state.night !== 3 || !state.resolved || !state.flags.af_ready || state.flags.af_done || !TRADE.familyAfternoon[choice]) return false;
    state.flags.af_done = true;
    state.flags["af_" + choice] = true;
    saveGame();
    openFamilyAfternoon();
    return true;
  }
  function openFamilyAfternoon() {
    if (!state || state.night !== 3 || !state.resolved || !state.flags.af_ready) return;
    dom.resolution.hidden = true;
    const choice = ["join", "carry", "private"].find(function (id) { return state.flags["af_" + id]; });
    const body = [el("p", { class: "clue-meta", text: "12:30 · After the morning shift. Your trading accounts and fuel are settled; this vignette has no charges or deadline." }), el("p", { text: state.truth === "vault" ? "The quiet harbour bench, beside the market. Low water changed the address, not the afternoon." : "Jun's quiet canal bench. The family took the scheduled day ferry; the Tern rests after her shift." })];
    if (choice) {
      const story = el("section", { class: "family-afternoon" });
      expandLines(TRADE.familyAfternoon[choice]).forEach(function (line) {
        const person = line.who && TRADE.characters[line.who];
        story.appendChild(el("p", { text: (person ? person.name + ": " : "") + line.text }));
      });
      body.push(story);
    } else body.push(el("p", { text: "The picnic is packed and the meeting place checked. How would you like to help Nao and Haruto keep their afternoon?" }));
    const actions = choice ? [] : [{ label: "Join their picnic", onClick: function () { finishFamilyAfternoon("join"); } }, { label: "Carry the basket, then leave them time", onClick: function () { finishFamilyAfternoon("carry"); } }, { label: "Leave them a private afternoon", onClick: function () { finishFamilyAfternoon("private"); } }];
    actions.push({ label: "Back to the shift report" });
    openModal({ title: "Nao & Haruto · An afternoon of their own", body: body, actions: actions, onClose: showTradeResolution });
  }
  function showResolution() {
    if (isTrade()) { showTradeResolution(); return; }
    dom.btnResContinue.textContent = "Continue";
    dom.btnResNew.textContent = "New shift…";
    const ending = activeCase.endings[state.ending];
    if (!ending) return;
    dom.resKicker.textContent = "Case closed · " + activeCase.title;
    dom.resTitle.textContent = ending.title;
    dom.resBody.innerHTML = "";
    // Ending lines may carry conditions like any other lines (a paragraph that only holds before the
    // dawn truck, say). They are read at the moment the case closed, not at the clock now: after a
    // case ends the ferry can still cross, and the ending must not change with it.
    const clockNow = state.clock;
    state.clock = state.endedAt;
    const paragraphs = expandLines(ending.lines);
    state.clock = clockNow;
    paragraphs.forEach(function (item) { dom.resBody.appendChild(el("p", { text: item.text })); });
    if (ending.late && state.endedAt >= DAWN_CLOCK) dom.resBody.appendChild(el("p", { class: "epilogue", text: ending.late }));
    dom.resStats.innerHTML = "";
    const total = Object.keys(activeCase.clues).length;
    const found = endingsFound(state.variantId).length;
    [
      ["Shift ended", formatClock(state.endedAt) + (state.endedAt >= DAWN_CLOCK ? " (after the dawn truck)" : " (before dawn)")],
      ["Fuel left", state.fuel + " / " + DATA.meta.fuelMax],
      ["Evidence", state.clues.length + " of " + total + " clues"],
      ["Timeline", timelineScore().right + " of " + timelineScore().total + " lines right"],
      ["Case file", found + " of " + activeCase.finalChoices.length + " endings found" + (found < activeCase.finalChoices.length ? " — the same seed replays this night" : "")],
      ["Seed", state.seed + " — replay it for the same case"]
    ].forEach(function (pair) {
      dom.resStats.appendChild(el("dt", { text: pair[0] }));
      dom.resStats.appendChild(el("dd", { text: pair[1] }));
    });
    revealResolution();
  }
  function revealResolution() {
    dom.resolution.hidden = false;
    updateActionsCue();                 // a cue computed a moment ago must not show through the card
    dom.btnResContinue.focus({ preventScroll: true });
    // Both resets are needed: styles.css puts the scrolling on .resolution-card on desktop and on
    // .resolution on phones. After focus, for engines that ignore preventScroll.
    if (dom.resCard) dom.resCard.scrollTop = 0;
    dom.resBody.scrollTop = 0;
    dom.resolution.scrollTop = 0;
  }

  function confirmNewShift() {
    const saved = readSave();
    const valid = saved && !saved.invalid ? saved : null;
    if (!valid) { clearSave(); showTitle(); return; }
    openModal({
      title: "Start a new shift?",
      body: [
        el("p", { text: "Your saved shift (seed " + valid.seed + ", clock " + formatClock(valid.clock) + (valid.resolved ? ", case closed" : "") + ") will be erased." }),
        el("p", { class: "muted", text: "Restarting cannot be undone." })
      ],
      actions: [
        { label: "Keep it" },
        { label: "Erase and start new", danger: true, onClick: function () { clearSave(); state = null; showTitle(); } }
      ]
    });
  }

  function openMenu() {
    const list = el("div", { class: "menu-list" });
    if (state && transient.mode === "play") {
      list.appendChild(el("button", { class: "btn", type: "button", onclick: function () { closeModal(); openNotebook(); } }, ["Journal", el("span", { class: "val", text: isTrade() ? state.rumors.length + " notes" : state.clues.length + " clues" })]));
    }
    list.appendChild(el("button", { class: "btn", type: "button", onclick: function () { cycleStation(); openMenu(); } }, ["Radio", el("span", { class: "val", text: stationById(settings.station).name })]));
    list.appendChild(el("button", { class: "btn", type: "button", onclick: function () { setEffects(!settings.effects); openMenu(); } }, ["Harbour sounds", el("span", { class: "val", text: settings.effects ? "on" : "off" })]));
    list.appendChild(el("button", { class: "btn", type: "button", onclick: function () { const levels = [0.3, 0.6, 1]; setEffects(settings.effects, levels[(levels.indexOf(settings.effectsVolume) + 1) % levels.length]); openMenu(); } }, ["Effects volume", el("span", { class: "val", text: Math.round(settings.effectsVolume * 100) + "%" })]));
    list.appendChild(el("p", { class: "muted", text: "Soft gold, ferry and market sounds. Independent of the radio; off starts quiet. Volume changes only effects." }));
    list.appendChild(el("button", { class: "btn", type: "button", onclick: function () { cycleMotion(); openMenu(); } }, ["Motion", el("span", { class: "val", text: motionLabel() })]));
    list.appendChild(el("p", { class: "muted", text: motionSummary() }));
    list.appendChild(el("button", { class: "btn", type: "button", onclick: function () { cycleCamera(); openMenu(); } }, ["Camera", el("span", { class: "val", text: settings.camera === "close" ? "close · the quay you're at" : "wide · the whole harbour" })]));
    list.appendChild(el("p", { class: "muted", text: "Close follows the Tern: the quay you are moored at, and the whole harbour while you cross. Wide shows the whole harbour all the time." }));
    if (!isTrade() || transient.mode !== "play") {   // hints belong to the investigations' notebook
      list.appendChild(el("button", { class: "btn", type: "button", onclick: function () { cycleHints(); openMenu(); } }, ["Hints", el("span", { class: "val", text: hintsOn() ? "on · marks in the notebook" : "off · hard mode, no marks" })]));
      list.appendChild(el("p", { class: "muted", text: hintsOn()
        ? "The notebook says which threads your evidence settles and which lines of the night you can fill in. Turn hints off for a night where you have to work that out yourself."
        : "Nothing in the notebook says what you have settled or which lines are ready; the liar at the counter still tells you what is missing. Turn hints on to see the marks again." }));
    }
    list.appendChild(el("button", { class: "btn", type: "button", onclick: openHelp }, ["Captain’s guide"]));
    if (state) {
      list.appendChild(el("div", { class: "muted", text: "Case seed: " + state.seed + " — the same seed always gives the same case." }));
      if (transient.mode === "play") list.appendChild(el("button", { class: "btn", type: "button", onclick: function () { showTitle(); } }, ["Return to title", el("span", { class: "val", text: "keeps save" })]));
      list.appendChild(el("button", { class: "btn btn-danger", type: "button", onclick: confirmNewShift }, ["New shift…"]));
    }
    list.appendChild(el("p", { class: "muted", text: storage.ok ? "Autosave: on (after every action)." : "Autosave: unavailable in this browser (" + storage.reason + "). The session still works." }));
    const releaseLine = el("div", { class: "release-line" }, [el("span", { text: releaseLabel() }),
      el("button", { class: "release-link", type: "button", text: "What's new" + (releaseIsNew() ? " · New" : ""), onclick: function () { closeModal(); openReleaseNotes(true); } })]);
    list.appendChild(releaseLine);
    openModal({ title: "Menu", body: list, actions: [{ label: "Close" }] });
  }

  // Touch-first devices get touch wording: no keys to mention, nothing to hover, a dashboard instead of
  // a strip "under the picture".
  function touchFirst() { return window.matchMedia("(hover: none) and (pointer: coarse)").matches; }

  // How to play on the gold night: what the numbers are, what sitting down is for, and nothing about
  // what to believe.
  function openTradeHelp() {
    const touch = touchFirst();
    const items = [
      "Gold is money in the Basin, kept when the banks fail, and it is also what the wet machines run on: contacts, sensors, radios, drones. Every scale chalks two numbers a gram: what you pay to buy, and what you get when you sell.",
      "Your goal is to grow the value of your purse and gold before you finish the night. Prices respond to boats, buyers and news. Compare leads, check the quays, and choose your moment.",
      "Chat with people for free; repeated visits reveal different casual lines. Food and tea still unlock the important meal conversations. Casual chat never spends time or buys trust.",
      "Use Next to read a conversation at your pace, or Read full exchange to see it all. Reading never moves the clock.",
      "Food and tea cost a few credits and some time. Sitting down is how you hear things; leaving at once saves both, and you may miss something.",
      "What you hear goes into the notebook" + (touch ? "" : " (N)") + " as it was said, with who said it, where and when. Whether it's true is up to you. Going to look for yourself costs fuel and time, and the news may be old by the time you get there.",
      "Scales are at Kurage 33 and Landing 3. Trading takes no time. " + (touch ? "Tap" : "Click") + " a ringed thing in the picture to do what the matching choice does.",
      "Crossings cost fuel and minutes; refuel at Landing 3. Out of fuel elsewhere, radio the harbour tug.",
      "From " + TRADE.meta.turnInFrom + " you can turn in aboard the Tern. The morning wire says what really happened, and Mei's scale says what your night was worth.",
      "Every night is a seed; the same seed is the same night. Four mystery adventures await under Case files on the title screen.",
      "Nothing moving? Your system may be asking for reduced motion. Open the Menu and set Motion to \"full\" to override it."
    ];
    if (!touch) items.push("Keys: 1–9 choose actions, N notebook, M menu, R radio, Esc closes panels.");
    openModal({
      title: "Captain’s guide",
      body: [
        el("p", { text: "You run the night ferry Tern, with a little gold, a few hundred credits and most of a tank. The picture shows the quay you are moored at; it pulls back to the whole harbour while you cross." }),
        el("ul", {}, items.map(function (text) { return el("li", { text: text }); }))
      ],
      actions: [{ label: "Back" }]
    });
  }

  function openHelp() {
    if (isTrade() && transient.mode === "play") { openTradeHelp(); return; }
    const touch = touchFirst();
    const items = [
      "Talking and casual chats are free. Repeated chats offer different lines. Searching and crossing cost minutes; reading with Next or Read full exchange never does.",
      "Clues go into the notebook" + (touch ? "" : " (N)") + " with their exact wording.",
      "Somebody tonight is lying. When you can prove it, go back to them and put up to three pieces of evidence down: first the proofs that break the story, then the reason, and the one clue that supports it.",
      "Things you can act on are marked in the picture with a dashed ring and a label: " + (touch ? "tap" : "click") + " one and it does what the matching choice under the story does, for the same cost. \"Show … something from the notebook\" lets you hold a clue up to a witness and hear what they make of it.",
      "The notebook's timeline asks who was where, and when. Fill it in from what you have read: the liar tests it against the paper you put down, and the ending card counts the lines you got right.",
      "The notebook marks the threads your evidence settles and the lines you can fill in. Menu → Hints turns those marks off for a harder night; the liar's rebuttals at the counter stay.",
      DATA.world.drink.name + ": one can, one use. Drink it and your next crossing takes no time. The vending machine at the Metro Quay has more.",
      "Out of fuel? Refuel at Landing 3, or radio the harbour tug if you are stuck elsewhere.",
      "The radio " + (touch ? "on the dashboard" : "under the picture") + " tunes between Off, Rain only, Lantern FM and Basin Lo-Fi. The music is generated on the spot; nothing is downloaded. Menu → Harbour sounds enables soft ferry, trading and market effects independently of the radio. Effects volume has three levels.",
      "Every case is a seed, and the same seed always opens the same night. Case files on the title screen lists the mysteries and endings you have found.",
      "Nothing moving? Your system may be asking for reduced motion. Open the Menu and set Motion to \"full\" to override it, or \"reduced\" to keep the picture still."
    ];
    if (!touch) items.push("Keys: 1–9 choose actions, N notebook, M menu, R radio, Esc closes panels.");
    openModal({
      title: "Captain’s guide",
      body: [
        el("p", { text: touch
          ? "The picture shows the quay you are moored at; it pulls back to the whole harbour while you cross. Tap one of the four buttons under it to cross the Basin. What you can do where you are is listed under the story; every crossing and search shows its cost before you commit."
          : "The picture shows the quay you are moored at; it pulls back to the whole harbour while you cross. Cast off with the Ferry buttons under the story, or click a neighbouring quay where it shows at the edge of the picture. Every crossing shows its fuel and clock cost before you commit." }),
        el("ul", {}, items.map(function (text) { return el("li", { text: text }); }))
      ],
      actions: [{ label: "Back" }]
    });
  }

  // Starting a shift, from the title screen (the gold night) or a case file (an investigation). An
  // unfinished save is never erased silently.
  function requestNewShift(seedText, starter) {
    const start = starter || startNewGame;
    const saved = readSave();
    const valid = saved && !saved.invalid ? saved : null;
    if (valid && !valid.resolved) {
      openModal({
        title: "Start a new shift?",
        body: [el("p", { text: "A saved shift (seed " + valid.seed + ", clock " + formatClock(valid.clock) + ") will be erased." })],
        actions: [{ label: "Keep it" }, { label: "Erase and start new", danger: true, onClick: function () { start(seedText); } }]
      });
      return;
    }
    start(seedText);
  }

  // One file per case, with a seed that always opens it. A case's title names its truth, so it stays
  // hidden until you have closed that case at least once.
  function openCaseFiles() {
    const list = el("div", { class: "case-files" });
    DATA.variants.forEach(function (variant, i) {
      const seed = (variant.seeds || [])[0];             // validateAll() insists every case has one
      const found = endingsFound(variant.id);
      const total = variant.finalChoices.length;
      const status = found.length === 0 ? "waiting to be discovered"
        : found.length + " of " + total + " endings · " + found.map(function (id) { return variant.endings[id].title; }).join(", ");
      list.appendChild(el("article", { class: "case-file" + (found.length ? " solved" : "") + (found.length === total ? " complete" : "") }, [
        el("p", { class: "case-file-no", text: "Adventure " + (i < 9 ? "0" : "") + (i + 1) + " · seed " + seed }),
        el("h3", { class: "case-file-title", text: found.length ? variant.title : "An untold story" }),
        found.length ? el("p", { class: "case-file-tag", text: variant.tagline }) : null,
        el("p", { class: "case-file-status", text: status }),
        el("button", { class: "btn btn-small", type: "button", "aria-label": (found.length ? "Play case file " : "Take case file ") + (i + 1) + ", seed " + seed,
          onclick: function () { closeModal(); requestNewShift(seed); } }, found.length ? "Play it again" : "Begin this adventure")
      ]));
    });
    openModal({
      title: "Case files · Investigations",
      body: [
        el("p", { class: "muted", text: "Every night in the Basin is a seed. These are the ones on file; any other word you type as a seed opens one of them at random, and always the same one." }),
        list
      ],
      actions: [{ label: "Back" }]
    });
  }

  function bindEvents() {
    dom.btnReleaseNotes.addEventListener("click", function () { openReleaseNotes(false); });
    dom.hotspots.forEach(function (spot) {
      const dest = spot.getAttribute("data-dest");
      spot.addEventListener("click", function () { if (transient.mode === "play") travelTo(dest); });
      spot.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (transient.mode === "play") travelTo(dest); }
      });
    });

    dom.btnNew.addEventListener("click", function () { requestNewShift(dom.seedInput.value, startTradeNight); });
    dom.btnCases.addEventListener("click", openCaseFiles);
    dom.seedInput.addEventListener("keydown", function (e) { if (e.key === "Enter") dom.btnNew.click(); });
    dom.btnContinue.addEventListener("click", function () {
      const saved = readSave();
      if (saved && !saved.invalid) continueGame(saved);
      else { refreshTitle(); toast("The saved shift could not be read."); }
    });

    dom.btnNotebook.addEventListener("click", function () { if (dom.notebook.hidden) openNotebook(); else closeNotebook(); });
    dom.btnNotebookClose.addEventListener("click", closeNotebook);
    dom.scrim.addEventListener("click", closeNotebook);
    dom.btnMenu.addEventListener("click", openMenu);
    dom.btnRadio.addEventListener("click", function () { cycleStation(); });
    dom.modal.addEventListener("click", function (e) { if (e.target === dom.modal) closeModal(); });

    dom.encBody.addEventListener("scroll", updateScrollHint);
    dom.encounter.addEventListener("scroll", updateActionsCue, { passive: true });
    dom.actionsCue.addEventListener("click", scrollToActions);
    dom.instObjectiveCell.addEventListener("click", toggleObjective);
    dom.instObjectiveCell.addEventListener("keydown", function (e) {
      if ((e.key === "Enter" || e.key === " ") && phoneShell()) { e.preventDefault(); toggleObjective(); }
    });
    window.addEventListener("resize", function () { syncAspect(); renderThings(); updateScrollHint(); updateActionsCue(); syncObjectiveControl(); });
    // Follow the system's reduced-motion setting if it changes while the game is open.
    if (motionQuery.addEventListener) motionQuery.addEventListener("change", applyMotionSetting);
    else if (motionQuery.addListener) motionQuery.addListener(applyMotionSetting);

    dom.btnResContinue.addEventListener("click", function () { dom.resolution.hidden = true; render(); });
    // After a gold night the card offers another night straight away; the closed night has nothing to lose.
    dom.btnResNew.addEventListener("click", function () { if (isTrade() && state.resolved) continueTradeStory(); else confirmNewShift(); });

    document.addEventListener("keydown", function (e) {
      const typing = e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA");
      if (e.key === "Escape") {
        if (!dom.modal.hidden) { closeModal(); return; }
        if (!dom.notebook.hidden) { closeNotebook(); return; }
        return;
      }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (transient.mode !== "play") return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); if (dom.notebook.hidden) openNotebook(); else closeNotebook(); return; }
      if (e.key === "m" || e.key === "M") { e.preventDefault(); if (dom.modal.hidden) openMenu(); return; }
      if (e.key === "r" || e.key === "R") { e.preventDefault(); cycleStation(); return; }
      if (/^[1-9]$/.test(e.key) && dom.modal.hidden && dom.notebook.hidden && dom.resolution.hidden) {
        const button = dom.encActions.querySelector('.action-btn[data-key="' + e.key + '"]');
        if (button && !button.disabled && button.offsetParent !== null) { e.preventDefault(); button.click(); }
      }
    });

    // A phone that locks or switches apps hides the page. Suspend the radio with it and bring it back on
    // return: Android never resumes an AudioContext by itself, and while the page is hidden the
    // schedulers' timers are throttled to once a second, which made the music stutter. With the
    // context suspended its clock stops too; the schedulers that read the clock wait for it, and the
    // two that schedule "now" (Lantern FM's bowls and chimes) skip while it is not running.
    document.addEventListener("visibilitychange", function () {
      if (!radio.ctx) return;
      if (document.hidden) radio.ctx.suspend();
      else if (settings.station !== "off" || settings.effects) resumeAudio();
    });

    // Sound that was on last time may only resume after a user gesture.
    const resumeOnce = function () {
      if (settings.station !== "off") setStation(settings.station, true);
      if (settings.effects && ensureAudio()) resumeAudio();
      document.removeEventListener("pointerdown", resumeOnce);
      document.removeEventListener("keydown", resumeOnce);
    };
    document.addEventListener("pointerdown", resumeOnce);
    document.addEventListener("keydown", resumeOnce);
  }

  function cacheDom() {
    dom.svg = $("harbour");
    dom.things = $("things");
    dom.ferry = $("ferry");
    dom.hotspots = Array.prototype.slice.call(document.querySelectorAll(".hotspot"));
    dom.titleOverlay = $("title-overlay");
    dom.btnNew = $("btn-new");
    dom.btnCases = $("btn-cases");
    dom.btnContinue = $("btn-continue");
    dom.seedInput = $("seed-input");
    dom.storageNote = $("storage-note");
    dom.resolution = $("resolution");
    dom.resKicker = $("res-kicker");
    dom.resTitle = $("res-title");
    dom.resBody = $("res-body");
    dom.resStats = $("res-stats");
    dom.btnResContinue = $("btn-res-continue");
    dom.btnResNew = $("btn-res-new");
    dom.chips = $("dock-chips");
    dom.instClock = $("inst-clock");
    dom.instDawn = $("inst-dawn");
    dom.fuelGauge = $("fuel-gauge");
    dom.instFuelText = $("inst-fuel-text");
    dom.instCan = $("inst-can");
    dom.instCanLabel = $("inst-can-label");
    dom.instCanSub = $("inst-can-sub");
    dom.instObjective = $("inst-objective");
    dom.instObjectiveCell = dom.instObjective.parentNode;
    dom.instObjectiveLabel = dom.instObjectiveCell.querySelector(".inst-label");
    dom.boardBuy = $("gold-board-buy");
    dom.boardSell = $("gold-board-sell");
    dom.actionsCue = $("actions-cue");
    dom.btnRadio = $("btn-radio");
    dom.radioName = $("radio-name");
    dom.radioSub = $("radio-sub");
    dom.encounter = $("encounter");
    dom.encKicker = $("enc-kicker");
    dom.encTitle = $("enc-title");
    dom.encBody = $("enc-body");
    dom.encCoach = $("enc-coach");
    dom.encActions = $("enc-actions");
    dom.releaseVersion = $("release-version");
    dom.btnReleaseNotes = $("btn-release-notes");
    dom.notebook = $("notebook");
    dom.btnNotebook = $("btn-notebook");
    dom.btnNotebookClose = $("btn-notebook-close");
    dom.notebookCount = $("notebook-count");
    dom.nbBody = $("notebook-body");
    dom.scrim = $("scrim");
    dom.btnMenu = $("btn-menu");
    dom.modal = $("modal");
    dom.modalTitle = $("modal-title");
    dom.modalBody = $("modal-body");
    dom.modalActions = $("modal-actions");
    dom.modalCard = document.querySelector(".modal-card");
    dom.resCard = document.querySelector(".resolution-card");
    dom.toast = $("toast");
  }

  // Served from a web host, the game can be installed to a home screen, where Android runs it with no
  // URL bar at all. The manifest is linked only then: from file:// the browser would refuse to load it.
  function linkManifest() {
    if (location.protocol !== "http:" && location.protocol !== "https:") return;
    document.head.appendChild(el("link", { rel: "manifest", href: "manifest.webmanifest" }));
  }

  function init() {
    linkManifest();
    cacheDom();
    dom.instCanLabel.textContent = DATA.world.drink.name;   // the drink is named in cases.js, not here
    // The gold night's extra speakers join the cast for speech bubbles; the investigations never name them.
    Object.keys(TRADE.characters).forEach(function (id) { if (!DATA.world.characters[id]) DATA.world.characters[id] = TRADE.characters[id]; });
    transient.debugMarket = /[?&]debug=market\b/.test(location.search);
    loadSettings();
    // index.html?camera=wide (or close) sets the camera from the address; it is remembered like a
    // menu choice.
    const asked = /[?&]camera=(wide|close)\b/.exec(location.search);
    if (asked) { settings.camera = asked[1]; saveSettings(); }
    const askedHints = /[?&]hints=(on|off)\b/.exec(location.search);
    if (askedHints) { settings.hints = askedHints[1]; saveSettings(); }
    loadProfile();
    applyMotionSetting();
    renderRadio();

    // Story data must be coherent before anyone plays it.
    const report = validateAll();
    const broken = Object.keys(report).filter(function (id) { return report[id].length; });
    if (broken.length) {
      broken.forEach(function (id) { console.error("Neon Tides: case '" + id + "' has problems:", report[id]); });
      // Kept, so refreshTitle() shows it every time instead of writing over it.
      transient.dataProblem = "Story data problem in cases.js: " + broken.map(function (id) { return id + " (" + report[id].join("; ") + ")"; }).join(" · ");
    }

    // Storage check: a corrupt or incompatible save is cleared, not crashed on.
    const found = readSave();
    if (found && found.invalid) {
      clearSave();
      toast("A saved shift couldn't be read (" + found.invalid + ") and was cleared.");
    }

    bindEvents();
    syncObjectiveControl();
    positionFerry("bar", null, false);
    showTitle();
  }

  // A small window for the console, tests and the tutorial. Not needed to play.
  window.NeonTides = {
    getState: function () { return state; },
    getCase: function () { return activeCase; },
    hashSeed: hashSeed,
    pickVariantIndex: pickVariantIndex,
    validateAll: validateAll,
    startNewGame: startNewGame,
    travelTo: travelTo,
    performAction: performAction,
    toggleEvidence: toggleEvidence,
    submitEvidence: submitEvidence,
    submitExplanation: submitExplanation,
    chooseEnding: chooseEnding,
    setTimelineAnswer: setTimelineAnswer,
    setCamera: setCamera,
    setHints: setHints,
    hints: function () { return settings.hints; },
    performShow: performShow,
    things: function () { return Array.prototype.slice.call(document.querySelectorAll("#things .thing")).map(function (t) { return { thing: t.getAttribute("data-thing"), action: t.getAttribute("data-action"), rect: t.querySelector(".thing-hit").getBoundingClientRect() }; }); },
    camera: function () { return { mode: settings.camera, viewBox: dom.svg.getAttribute("viewBox") }; },
    timelineScore: function () { return state ? timelineScore() : null; },
    currentObjective: function () { return state ? currentObjective() : ""; },
    getProfile: function () { return JSON.parse(JSON.stringify(profile)); },
    openCaseFiles: openCaseFiles,
    readSave: readSave,
    formatClock: formatClock,
    parseClock: parseClock,
    radio: {
      setStation: setStation,
      stations: STATIONS,
      setEffects: setEffects,
      state: function () { return { station: settings.station, effects: settings.effects, effectsVolume: settings.effectsVolume, hasContext: !!radio.ctx, contextState: radio.ctx ? radio.ctx.state : null, sfxPlayed: radio.sfxPlayed }; }
    },
    storage: storage,
    // the gold night: start it, act in it, and look behind the board (debug() shows the hidden truth)
    trade: {
      start: startTradeNight,
      nextNight: startSecondNight,
      buy: buyGold,
      sell: sellGold,
      turnIn: endTradeNight,
      quote: function (loc, clock) { return state && isTrade() ? MARKET.breakdown(TRADE, state.truth, state.seed, loc || state.location, clock === undefined ? state.clock : (typeof clock === "string" ? parseClock(clock) : clock)) : null; },
      debug: tradeDebug,
      validate: validateTrade,
      get data() { return TRADE; }
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

