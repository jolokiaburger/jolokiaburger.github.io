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
      sceneClasses: (world.sceneClasses || []).concat(variant.sceneClasses || []),
      responses: variant.responses,
      finalChoices: variant.finalChoices,
      endings: variant.endings,
      omitted: omit.slice()
    };
    Object.keys(world.locations).forEach(function (loc) {
      const shared = (world.actions[loc] || []).filter(function (a) { return omit.indexOf(a.id) === -1; });
      const own = (variant.actions && variant.actions[loc]) || [];
      built.actions[loc] = shared.concat(own);
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
      });
    });
    // A clue written for this case that nothing hands out is almost always a typo or a forgotten action.
    built.ownClues.forEach(function (id) { if (!built.clues[id]) problems.push("clue '" + id + "' is never given by any action"); });
    built.omitted.forEach(function (id) {
      const known = Object.keys(world.actions).some(function (loc) { return world.actions[loc].some(function (a) { return a.id === id; }); });
      if (!known) problems.push("omit names unknown shared action '" + id + "'");
    });

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
    return report;
  }

  /* ------------------------------------------------------------------ */
  /* 4 · STATE — everything that gets saved                              */
  /* ------------------------------------------------------------------ */
  let state = null;         // the saved game
  let activeCase = null;    // built from state.variantId
  const transient = { travelling: null, timer: null, mode: "title", sceneClasses: [], objective: null };
  const settings = { station: "off", motion: "auto", coached: false };
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
    activeCase = buildCase(variantById(state.variantId));
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
    if (cond.has && !cond.has.every(hasClue)) return false;
    if (cond.hasAny && !cond.hasAny.some(hasClue)) return false;
    if (cond.lacks && cond.lacks.some(hasClue)) return false;
    if (cond.flag && !cond.flag.every(function (f) { return !!state.flags[f]; })) return false;
    if (cond.notFlag && cond.notFlag.some(function (f) { return !!state.flags[f]; })) return false;
    if (cond.minClock && state.clock < parseClock(cond.minClock)) return false;
    if (cond.maxClock && state.clock >= parseClock(cond.maxClock)) return false;
    if (typeof cond.fuelBelow === "number" && !(state.fuel < cond.fuelBelow)) return false;
    if (typeof cond.resolved === "boolean" && state.resolved !== cond.resolved) return false;
    if (cond.ending && state.ending !== cond.ending) return false;
    if (cond.proven && !cond.proven.every(proven)) return false;
    if (cond.unproven && cond.unproven.some(proven)) return false;
    if (typeof cond.motive === "boolean" && motiveKnown() !== cond.motive) return false;
    if (typeof cond.confronting === "boolean" && !!state.confront !== cond.confronting) return false;
    return true;
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
    const rules = activeCase.objectives;
    for (let i = 0; i < rules.length; i++) {
      if (conditionHolds(rules[i].when)) return rules[i].text;
    }
    return "";
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
  function cheapestExit(from) {
    let min = Infinity;
    Object.keys(DATA.world.locations).forEach(function (to) {
      if (to === from) return;
      const cost = travelCost(from, to);
      if (cost && cost.fuel < min) min = cost.fuel;
    });
    return min;
  }
  function canTravel(dest) {
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
    state.fuel -= check.cost.fuel;
    state.clock += minutes;
    state.canArmed = false;
    state.location = dest;
    state.visited[dest] = (state.visited[dest] || 0) + 1;
    state.lastResult = null;
    saveGame();
    if (settings.station === "off" && !transient.hintedRadio) {
      transient.hintedRadio = true;
      toast(touchFirst() ? "Radio is off. Tap the radio for engine sound and music." : "Radio is off. Tune it (R) for engine sound and music.");
    }
    beginCrossing(from, dest, minutes, check.cost.fuel);
  }

  function beginCrossing(from, dest, minutes, fuel) {
    transient.travelling = { from: from, to: dest, minutes: minutes, fuel: fuel };
    document.body.classList.add("travelling");
    positionFerry(dest, from, true);
    render();
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
    focusEncounter();
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
    return list.filter(function (action) {
      if (action.once && state.used[action.id]) return false;
      return conditionHolds(action.when);
    });
  }

  // Actions the game itself adds: the confrontation, the drink, the tug.
  function systemActions() {
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
    if (transient.travelling) return;
    if (actionId === "sys_confront") { startConfrontation(); return; }
    if (actionId === "sys_drink") { drinkCan(); return; }
    if (actionId === "sys_tug") { radioTug(); return; }

    const action = locationActions().filter(function (a) { return a.id === actionId; })[0];
    if (!action) return;

    // Text reflects the moment of speaking, so expand it before anything changes.
    const lines = expandLines(action.lines);

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
    saveGame();
    render();
    focusEncounter();
  }

  function applyEffects(effects) {
    if (!effects) return;
    if (effects.fuel) state.fuel = Math.min(DATA.meta.fuelMax, Math.max(0, state.fuel + effects.fuel));
    if (effects.cans) state.cans = Math.max(0, state.cans + effects.cans);
    if (effects.refuel) state.fuel = DATA.meta.fuelMax;
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
    state.clock += tug.minutes;
    state.location = "landing";
    state.visited.landing = (state.visited.landing || 0) + 1;
    state.lastResult = { label: tug.label, lines: expandLines(tug.lines), clues: [] };
    saveGame();
    beginCrossing(from, "landing", tug.minutes, 0);
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
      c.stage = "explain";
      c.feedback = expandLines(challenge.success);
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
    renderInstruments();
    renderHarbour();
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
    document.body.setAttribute("data-mode", mode);
    syncSceneClasses();                 // the title screen always shows the harbour as it starts
    syncAspect();
    dom.titleOverlay.hidden = mode !== "title";
    // Every change of mode clears the ending card (showResolution() runs after setMode when it is
    // needed). Leaving it up let it cover the title screen after "New shift…" from the card itself.
    dom.resolution.hidden = true;
  }
  // The picture normally fits inside its frame ("meet"). On a phone's tall title screen it
  // fills the frame instead ("slice") so the noodle bar stays large behind the title.
  function syncAspect() {
    // Portrait only: a landscape phone's title frame is wide, and the bar crop would cut the sign.
    const phone = window.matchMedia("(max-width: 899px) and (orientation: portrait)").matches;
    const phoneTitle = transient.mode === "title" && phone;
    dom.svg.setAttribute("preserveAspectRatio", phoneTitle ? "xMidYMid slice" : "xMidYMid meet");
    // On a phone's title screen, frame the noodle bar (x 567–1207) instead of the whole harbour.
    dom.svg.setAttribute("viewBox", phoneTitle ? "567 0 640 800" : "0 0 1440 800");
  }

  function renderInstruments() {
    dom.instClock.textContent = formatClock(state.clock);
    dom.instClock.classList.toggle("late", state.clock >= DAWN_CLOCK);
    dom.instDawn.textContent = state.clock >= DAWN_CLOCK ? "the dawn truck has gone" : "dawn truck " + DATA.meta.dawnClock;

    dom.fuelGauge.innerHTML = "";
    for (let i = 0; i < DATA.meta.fuelMax; i++) {
      const seg = el("span", { class: "fuel-seg" + (i < state.fuel ? " on" : "") + (i < state.fuel && state.fuel <= 1 ? " low" : "") });
      dom.fuelGauge.appendChild(seg);
    }
    dom.fuelGauge.setAttribute("aria-label", "fuel " + state.fuel + " of " + DATA.meta.fuelMax);
    dom.instFuelText.textContent = state.fuel + " / " + DATA.meta.fuelMax;

    dom.instCan.textContent = "×" + state.cans;
    dom.instCan.className = "inst-value" + (state.canArmed ? " armed" : "");
    dom.instCanSub.textContent = state.canArmed ? "armed: next crossing 0 min" : (state.cans > 0 ? "skips one crossing's time" : "none in hand");

    // A new objective glows for a moment, so "what now?" is noticed when it changes.
    const objective = currentObjective();
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

  function costText(dest) {
    const check = canTravel(dest);
    if (dest === state.location) return "moored here";
    if (state.confront) return activeCase.confrontation.busyLabel;      // "at the counter", "under the floodlight"
    const cost = travelCost(state.location, dest);
    if (!cost) return "";
    const minutes = travelMinutes(cost);
    if (!check.ok && check.why.indexOf("needs") === 0) return check.why;
    return cost.fuel + " fuel · " + minutes + " min" + (state.canArmed ? " (" + DATA.world.drink.name + ")" : "");
  }

  function renderHarbour() {
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
  function renderChips() {
    dom.chips.innerHTML = "";
    Object.keys(DATA.world.locations).forEach(function (dest) {
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
      renderLines(body, approachLines(trip.to));
      body.appendChild(el("p", { class: "notice", text: (trip.fuel ? "−" + trip.fuel + " fuel · " : "") + "+" + trip.minutes + " min" }));
      return;
    }

    const loc = DATA.world.locations[state.location];
    dom.encKicker.textContent = loc.kicker;
    dom.encTitle.textContent = loc.title;

    if (state.confront) { renderConfrontation(body, actions); return; }
    // The card lives outside the story's aria-live region, so a screen reader doesn't re-read it
    // with every result.
    if (touchFirst() && !settings.coached) dom.encCoach.appendChild(coachCard());
    if (state.lastResult) renderResult(body, state.lastResult);
    else renderScene(body);
    renderActions(actions);
  }

  // First shift on a touch screen: one card that says how the screen works, until it is dismissed.
  // (The help text describes the same thing; nobody opens the help text first.)
  function coachCard() {
    return el("div", { class: "coach", role: "note" }, [
      el("p", { class: "coach-title", text: "How this works" }),
      el("p", { text: "Tap a place in the picture, or one of the four buttons under it, to cross the harbour. What you can do where you are is listed under the story, with what it costs." }),
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
    renderLines(container, items);
  }

  // A place's approach text is one line, or a list of entries with conditions (the metro's terminus
  // is dark after the last train). The clock has already moved to the arrival time when it is read.
  function approachLines(locId) {
    const approach = DATA.world.locations[locId].approach;
    return expandLines(Array.isArray(approach) ? approach : [approach]);
  }

  function renderResult(container, result) {
    renderLines(container, result.lines);
    (result.clues || []).forEach(function (id) {
      const clue = activeCase.clues[id];
      if (!clue) return;
      container.appendChild(el("div", { class: "clue-found" }, [
        el("span", { class: "clue-found-label", text: "Added to notebook · " + clue.title }),
        clue.text
      ]));
    });
  }

  function renderLines(container, items) {
    items.forEach(function (item) {
      if (item.type === "speech") container.appendChild(speechNode(item));
      else if (item.type === "notice") container.appendChild(el("p", { class: "notice " + (item.tone || ""), text: item.text }));
      else container.appendChild(el("p", { class: "narration", text: item.text }));
    });
  }

  function speechNode(item) {
    const who = DATA.world.characters[item.who] || { name: item.who, color: "#8fb6b5" };
    const wrapper = el("div", { class: "speech" + (who.portrait ? "" : " no-portrait"), style: "--speaker:" + who.color });
    if (who.portrait) {
      const img = el("img", { class: "portrait", src: who.portrait, alt: "", width: "56", height: "56" });
      img.addEventListener("error", function () { wrapper.classList.add("no-portrait"); img.remove(); });
      wrapper.appendChild(img);
    }
    wrapper.appendChild(el("div", { class: "speech-text" }, [
      el("span", { class: "speaker", text: who.name }),
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

    const here = locationActions().filter(function (a) { return a.kind !== "system"; });
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

    // On phones the chips above the sheet are the travel buttons, so a Ferry group holding nothing
    // but crossings is marked and hidden there (styles.css 13b).
    const ferry = el("div", { class: "action-group" + (ferryActions.length ? "" : " only-travel") }, [el("p", { class: "action-group-label", text: "Ferry" })]);
    Object.keys(DATA.world.locations).forEach(function (dest) {
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
  function renderNotebook() {
    dom.notebookCount.textContent = String(state.clues.length);
    const body = dom.nbBody;
    body.innerHTML = "";

    body.appendChild(el("section", { class: "nb-section" }, [
      el("h3", { text: "Objective" }),
      el("p", { class: "nb-objective", text: currentObjective() })
    ]));

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
      threads.appendChild(el("li", {}, [
        el("span", { text: thread.question }),
        el("span", { class: "status" + (settledBy.length ? " done" : ""), text: status })
      ]));
    });
    body.appendChild(el("section", { class: "nb-section" }, [el("h3", { text: "Threads" }), threads]));

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

  let lastFocus = null;
  function openNotebook() {
    lastFocus = document.activeElement;
    renderNotebook();
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
    // preventScroll makes the browser reveal it, which opened long panels ("How to play") at the end.
    const first = dom.modalActions.querySelector("button");
    if (first) first.focus({ preventScroll: true });
    if (dom.modalCard) dom.modalCard.scrollTop = 0;   // after focus, for engines without preventScroll
  }
  function closeModal() {
    dom.modal.hidden = true;
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
    const variant = variantById(obj.variantId);
    if (!variant) return "unknown case '" + obj.variantId + "'";
    if (!DATA.world.locations[obj.location]) return "unknown location";
    if (typeof obj.clock !== "number" || typeof obj.fuel !== "number") return "bad numbers";
    if (!Array.isArray(obj.clues) || !obj.flags || !obj.used || !obj.visited) return "missing fields";
    const built = buildCase(variant);
    if (obj.clues.some(function (c) { return !c || !built.clues[c.id]; })) return "unknown clue";
    if (obj.ending && !built.endings[obj.ending]) return "unknown ending";
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
      settings.motion = MOTION_MODES.indexOf(parsed.motion) !== -1 ? parsed.motion : (parsed.reduceMotion ? "reduced" : "auto");
      settings.coached = parsed.coached === true;
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
  /* and synths. Everything starts only after the player tunes the dial. */
  /* ------------------------------------------------------------------ */
  const STATIONS = [
    { id: "off",     name: "Off",         sub: "no sound" },
    { id: "rain",    name: "Rain only",   sub: "harbour ambience" },
    { id: "lantern", name: "Lantern FM",  sub: "ambient · plucked strings" },
    { id: "basin",   name: "Basin Lo-Fi", sub: "hypnotic techno" }
  ];
  const radio = { ctx: null, master: null, reverb: null, rainGain: null, noise: null, stop: null, plucks: {}, sfxPlayed: 0 };

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
    const ctx = new Ctx();
    const rate = ctx.sampleRate;
    const master = ctx.createGain();
    master.gain.value = MASTER_GAIN;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.ratio.value = 4;
    master.connect(compressor);
    compressor.connect(ctx.destination);

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
        setTimeout(function () { if (settings.station === "off" && radio.ctx) radio.ctx.suspend(); }, 1200);
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
  // They play only while the radio is on (any station), so "Off" stays completely silent.
  function sfxReady() {
    if (settings.station === "off") return false;
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
    hornTone.connect(hornGain); hornGain.connect(radio.master); hornGain.connect(radio.reverb);
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
    engine.connect(radio.master);
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
    thud.connect(thudGain); thudGain.connect(radio.master); thud.start(t); thud.stop(t + 0.32);
    // the ferry's bell: three partials with long decays
    [[1, 0.11], [2.4, 0.045], [4.1, 0.02]].forEach(function (partial) {
      const bell = ctx.createOscillator(); bell.frequency.value = 660 * partial[0];
      const g = ctx.createGain(); g.gain.setValueAtTime(partial[1], t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      bell.connect(g); g.connect(radio.master); g.connect(radio.reverb); bell.start(t + 0.06); bell.stop(t + 1.7);
    });
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
    toast("Shift started · seed " + seed);
  }

  function continueGame(saved) {
    setState(saved);
    transient.objective = null;
    // A case closed before the case files existed (2.x) still counts as found.
    if (state.resolved && state.ending) recordEnding(state.variantId, state.ending);
    setMode("play");
    positionFerry(state.location, null, false);
    render();
    if (state.resolved) showResolution();
    toast("Saved shift loaded · " + formatClock(state.clock));
  }

  function showTitle() {
    setMode("title");
    refreshTitle();
    dom.btnNew.focus({ preventScroll: true });
  }
  function refreshTitle() {
    const saved = readSave();
    const valid = saved && !saved.invalid ? saved : null;
    dom.btnContinue.hidden = !valid;
    if (valid) {
      dom.btnContinue.textContent = "Continue shift · " + formatClock(valid.clock) + (valid.resolved ? " · closed" : "");
    }
    if (!storage.ok) {
      dom.storageNote.textContent = "Saving is unavailable here (private mode or blocked storage). You can still play; progress won't survive a reload.";
    } else if (valid) {
      dom.storageNote.textContent = "A saved shift was found in this browser.";
    } else {
      dom.storageNote.textContent = "Progress autosaves in this browser after every action.";
    }
    if (transient.dataProblem) dom.storageNote.textContent = transient.dataProblem + " — " + dom.storageNote.textContent;
  }

  function showResolution() {
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
      ["Case file", found + " of " + activeCase.finalChoices.length + " endings found" + (found < activeCase.finalChoices.length ? " — the same seed replays this night" : "")],
      ["Seed", state.seed + " — replay it for the same case"]
    ].forEach(function (pair) {
      dom.resStats.appendChild(el("dt", { text: pair[0] }));
      dom.resStats.appendChild(el("dd", { text: pair[1] }));
    });
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
      list.appendChild(el("button", { class: "btn", type: "button", onclick: function () { closeModal(); openNotebook(); } }, ["Notebook", el("span", { class: "val", text: state.clues.length + " clues" })]));
    }
    list.appendChild(el("button", { class: "btn", type: "button", onclick: function () { cycleStation(); openMenu(); } }, ["Radio", el("span", { class: "val", text: stationById(settings.station).name })]));
    list.appendChild(el("button", { class: "btn", type: "button", onclick: function () { cycleMotion(); openMenu(); } }, ["Motion", el("span", { class: "val", text: motionLabel() })]));
    list.appendChild(el("p", { class: "muted", text: motionSummary() }));
    list.appendChild(el("button", { class: "btn", type: "button", onclick: openHelp }, ["How to play"]));
    if (state) {
      list.appendChild(el("div", { class: "muted", text: "Case seed: " + state.seed + " — the same seed always gives the same case." }));
      if (transient.mode === "play") list.appendChild(el("button", { class: "btn", type: "button", onclick: function () { showTitle(); } }, ["Return to title", el("span", { class: "val", text: "keeps save" })]));
      list.appendChild(el("button", { class: "btn btn-danger", type: "button", onclick: confirmNewShift }, ["New shift…"]));
    }
    list.appendChild(el("p", { class: "muted", text: storage.ok ? "Autosave: on (after every action)." : "Autosave: unavailable in this browser (" + storage.reason + "). The session still works." }));
    openModal({ title: "Menu", body: list, actions: [{ label: "Close" }] });
  }

  // Touch-first devices get touch wording: no keys to mention, nothing to hover, a dashboard instead of
  // a strip "under the picture".
  function touchFirst() { return window.matchMedia("(hover: none) and (pointer: coarse)").matches; }

  function openHelp() {
    const touch = touchFirst();
    const items = [
      "Talking is free. Searching and crossing cost minutes; only labelled actions move the clock. Reading never does.",
      "Clues go into the notebook" + (touch ? "" : " (N)") + " with their exact wording.",
      "Somebody tonight is lying. When you can prove it, go back to them and put up to three pieces of evidence down: first the proofs that break the story, then the reason, and the one clue that supports it.",
      DATA.world.drink.name + ": one can, one use. Drink it and your next crossing takes no time. The vending machine at the Metro Quay has more.",
      "Out of fuel? Refuel at Landing 3, or radio the harbour tug if you are stuck elsewhere.",
      "The radio " + (touch ? "on the dashboard" : "under the picture") + " tunes between Off, Rain only, Lantern FM and Basin Lo-Fi. The music is generated on the spot; nothing is downloaded. While the radio is on, the ferry also sounds its horn and engine when you cast off and rings its bell when you moor.",
      "Every case is a seed, and the same seed always opens the same night. Case files on the title screen list them all, with the endings you have found.",
      "Nothing moving? Your system may be asking for reduced motion. Open the Menu and set Motion to \"full\" to override it, or \"reduced\" to keep the picture still."
    ];
    if (!touch) items.push("Keys: 1–9 choose actions, N notebook, M menu, R radio, Esc closes panels.");
    openModal({
      title: "How to play",
      body: [
        el("p", { text: touch
          ? "Tap a place in the harbour picture, or one of the four buttons under it, to cross the Basin. What you can do where you are is listed under the story; every crossing and search shows its cost before you commit."
          : "Click a destination in the harbour picture to cross the Basin. Every crossing shows its fuel and clock cost before you commit." }),
        el("ul", {}, items.map(function (text) { return el("li", { text: text }); }))
      ],
      actions: [{ label: "Back" }]
    });
  }

  // Starting a shift, from the title screen or a case file. An unfinished save is never erased silently.
  function requestNewShift(seedText) {
    const saved = readSave();
    const valid = saved && !saved.invalid ? saved : null;
    if (valid && !valid.resolved) {
      openModal({
        title: "Start a new shift?",
        body: [el("p", { text: "A saved shift (seed " + valid.seed + ", clock " + formatClock(valid.clock) + ") will be erased." })],
        actions: [{ label: "Keep it" }, { label: "Erase and start new", danger: true, onClick: function () { startNewGame(seedText); } }]
      });
      return;
    }
    startNewGame(seedText);
  }

  // One file per case, with a seed that always opens it. A case's title names its truth, so it stays
  // hidden until you have closed that case at least once.
  function openCaseFiles() {
    const list = el("div", { class: "case-files" });
    DATA.variants.forEach(function (variant, i) {
      const seed = (variant.seeds || [])[0];             // validateAll() insists every case has one
      const found = endingsFound(variant.id);
      const total = variant.finalChoices.length;
      const status = found.length === 0 ? "not yet closed"
        : found.length + " of " + total + " endings · " + found.map(function (id) { return variant.endings[id].title; }).join(", ");
      list.appendChild(el("article", { class: "case-file" + (found.length ? " solved" : "") + (found.length === total ? " complete" : "") }, [
        el("p", { class: "case-file-no", text: "Case file " + (i < 9 ? "0" : "") + (i + 1) + " · seed " + seed }),
        el("h3", { class: "case-file-title", text: found.length ? variant.title : "Unsolved" }),
        found.length ? el("p", { class: "case-file-tag", text: variant.tagline }) : null,
        el("p", { class: "case-file-status", text: status }),
        el("button", { class: "btn btn-small", type: "button", "aria-label": (found.length ? "Play case file " : "Take case file ") + (i + 1) + ", seed " + seed,
          onclick: function () { closeModal(); requestNewShift(seed); } }, found.length ? "Play it again" : "Take this case")
      ]));
    });
    openModal({
      title: "Case files",
      body: [
        el("p", { class: "muted", text: "Every night in the Basin is a seed. These are the ones on file; any other word you type as a seed opens one of them at random, and always the same one." }),
        list
      ],
      actions: [{ label: "Back" }]
    });
  }

  function bindEvents() {
    dom.hotspots.forEach(function (spot) {
      const dest = spot.getAttribute("data-dest");
      spot.addEventListener("click", function () { if (transient.mode === "play") travelTo(dest); });
      spot.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (transient.mode === "play") travelTo(dest); }
      });
    });

    dom.btnNew.addEventListener("click", function () { requestNewShift(dom.seedInput.value); });
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
    window.addEventListener("resize", function () { syncAspect(); updateScrollHint(); updateActionsCue(); syncObjectiveControl(); });
    // Follow the system's reduced-motion setting if it changes while the game is open.
    if (motionQuery.addEventListener) motionQuery.addEventListener("change", applyMotionSetting);
    else if (motionQuery.addListener) motionQuery.addListener(applyMotionSetting);

    dom.btnResContinue.addEventListener("click", function () { dom.resolution.hidden = true; render(); });
    dom.btnResNew.addEventListener("click", confirmNewShift);

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
      else if (settings.station !== "off") resumeAudio();
    });

    // Sound that was on last time may only resume after a user gesture.
    const resumeOnce = function () {
      if (settings.station !== "off") setStation(settings.station, true);
      document.removeEventListener("pointerdown", resumeOnce);
      document.removeEventListener("keydown", resumeOnce);
    };
    document.addEventListener("pointerdown", resumeOnce);
    document.addEventListener("keydown", resumeOnce);
  }

  function cacheDom() {
    dom.svg = $("harbour");
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
    loadSettings();
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
    currentObjective: function () { return state ? currentObjective() : ""; },
    getProfile: function () { return JSON.parse(JSON.stringify(profile)); },
    openCaseFiles: openCaseFiles,
    readSave: readSave,
    formatClock: formatClock,
    parseClock: parseClock,
    radio: {
      setStation: setStation,
      stations: STATIONS,
      state: function () { return { station: settings.station, hasContext: !!radio.ctx, contextState: radio.ctx ? radio.ctx.state : null, sfxPlayed: radio.sfxPlayed }; }
    },
    storage: storage
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
