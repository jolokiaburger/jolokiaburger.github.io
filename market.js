/* ==========================================================================
   NEON TIDES — the gold market (simulation only)
   --------------------------------------------------------------------------
   No DOM, no story text, no Math.random. Everything here is a pure function of
   the trade data (trade.js), the night's hidden truth, the seed and the clock,
   so the same night always prices the same way and any number can be explained.

   A local price is built like this:

     mid  = base × (1 + (local + events + noise) / 100)
     buy  = mid + half the dealer's spread      (what the player pays)
     sell = mid − half the dealer's spread      (what the player gets)

     local   a district's standing offset (salvage berths sell cheap, Pier 9 buys dear)
     events  every active event modifier for this place at this minute; each one has an
             envelope: ramp in, hold, decay to a residual
     noise   modest, smooth value noise from the seed (knots every few minutes), so the
             board breathes a little without ever moving on its own by much

   and then the player's own weight (4.0.1): buying from a dealer raises his asking price, selling to
   him lowers his bid (impact()), and a dealer has only so much to sell and will only take so much
   (available()). Both are read from the player's trades, so prices stay a pure function.

   game.js calls quote() and breakdown(); NeonTides.trade.debug() prints them.
   ========================================================================== */
(function () {
  "use strict";

  // Same clock rule as game.js: minutes, and times before noon count as the next day.
  function parseClock(text) {
    const parts = String(text).split(":");
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) || 0;
    let minutes = h * 60 + m;
    if (h < 12) minutes += 24 * 60;
    return minutes;
  }
  function minutesOf(value) { return typeof value === "number" ? value : parseClock(value); }

  // FNV-1a with MurmurHash3's finaliser, so every bit of the result mixes.
  function hash32(text) {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
  }
  function unit(text) { return hash32(text) / 4294967296; }   // [0, 1)

  // A night's hidden truth: pinned seeds first, otherwise the hash picks one.
  function pickTruth(def, seed) {
    const text = String(seed || "").trim().toLowerCase();
    for (let i = 0; i < def.truths.length; i++) {
      if ((def.truths[i].seeds || []).indexOf(text) !== -1) return def.truths[i].id;
    }
    return def.truths[hash32("truth|" + text) % def.truths.length].id;
  }

  // The event's modifiers for this truth (an event may simply not exist in some truths).
  function eventMods(event, truth) {
    const own = event.truths && event.truths[truth];
    if (!own) return null;
    return own.mods || [];
  }
  function eventExists(event, truth) { return !!(event.truths && event.truths[truth]); }

  function appliesTo(mod, loc) {
    if (mod.loc === "*") return (mod.except || []).indexOf(loc) === -1;
    if (Array.isArray(mod.loc)) return mod.loc.indexOf(loc) !== -1;
    return mod.loc === loc;
  }

  // Ramp in, hold, decay to a residual. hold: "end" holds for the rest of the night.
  function envelope(mod, event, clock) {
    const from = minutesOf(mod.from || event.at);
    if (clock < from) return 0;
    let d = clock - from;
    const ramp = mod.ramp || 0;
    if (d < ramp) return mod.pct * d / ramp;
    d -= ramp;
    if (mod.hold === "end" || mod.hold === undefined) return mod.pct;
    if (d < mod.hold) return mod.pct;
    d -= mod.hold;
    const residual = mod.residual || 0;
    const decay = mod.decay || 0;
    if (d < decay) return mod.pct + (residual - mod.pct) * d / decay;
    return residual;
  }

  // Smooth noise in [-1, 1] with knots every `knot` minutes.
  function noise(seed, loc, clock, knot) {
    const k = Math.floor(clock / knot);
    const t = (clock - k * knot) / knot;
    const a = unit(seed + "|" + loc + "|" + k) * 2 - 1;
    const b = unit(seed + "|" + loc + "|" + (k + 1)) * 2 - 1;
    const s = t * t * (3 - 2 * t);
    return a + (b - a) * s;
  }

  function dealerAt(def, loc) { return (def.market.dealers || {})[loc] || null; }
  function dealerOpen(dealer, truth, clock) {
    if (!dealer) return false;
    if (dealer.truths && dealer.truths.indexOf(truth) === -1) return false;
    if (dealer.from && clock < minutesOf(dealer.from)) return false;
    return true;
  }

  // Every component of a local price at one minute. Used by quote() and by the debug view.
  function breakdown(def, truth, seed, loc, clock) {
    const market = def.market;
    const local = (market.local && market.local[loc]) || 0;
    const events = [];
    (def.events || []).forEach(function (event) {
      const mods = eventMods(event, truth);
      if (!mods) return;
      mods.forEach(function (mod) {
        if (!appliesTo(mod, loc)) return;
        const pct = envelope(mod, event, clock);
        if (pct) events.push({ event: event.id, pct: Math.round(pct * 100) / 100 });
      });
    });
    const eventPct = events.reduce(function (sum, e) { return sum + e.pct; }, 0);
    const noisePct = noise(seed, loc, clock, market.noiseKnotMin || 20) * (market.noisePct || 0);
    const mid = market.base * (1 + (local + eventPct + noisePct) / 100);
    const dealer = dealerAt(def, loc);
    const spread = dealer ? dealer.spread : 0;
    return {
      loc: loc, clock: clock, truth: truth,
      base: market.base, localPct: local, events: events, eventPct: Math.round(eventPct * 100) / 100,
      noisePct: Math.round(noisePct * 100) / 100,
      mid: Math.round(mid * 100) / 100,
      spread: spread,
      buy: Math.ceil(mid * (1 + spread / 200)),
      sell: Math.floor(mid * (1 - spread / 200))
    };
  }

  // The player's own trades lean on a dealer (4.0.1). Buying from him raises his asking price, selling
  // to him lowers his bid; each gram counts 1/depth percent and fades with a half-life. Only the side
  // you trade on moves, so buying and selling back at one scale can never make money, and carrying
  // gold between two scales pays less with every load. trades: [{ kind, grams, at, where }].
  function impact(def, trades, loc, clock) {
    const dealer = dealerAt(def, loc);
    const out = { buyPct: 0, sellPct: 0 };
    if (!dealer || !dealer.depth || !trades) return out;
    const half = def.market.impactHalfLifeMin || 90;
    trades.forEach(function (t) {
      if (t.where !== loc || t.at > clock) return;
      const pct = (t.grams / dealer.depth) * Math.pow(0.5, (clock - t.at) / half);
      if (t.kind === "buy") out.buyPct += pct; else out.sellPct += pct;
    });
    out.buyPct = Math.round(out.buyPct * 100) / 100;
    out.sellPct = Math.round(out.sellPct * 100) / 100;
    return out;
  }

  // What a dealer will still trade tonight (4.0.1): `stock` is the grams he has to sell you (a number,
  // or per truth, from `stockFrom`; `stockBefore` until then), `limit` the grams he will buy from you.
  // Infinity where the data sets no bound.
  function available(def, truth, loc, clock, trades) {
    const dealer = dealerAt(def, loc);
    if (!dealer) return { buy: 0, sell: 0 };
    let stock = Infinity;
    if (dealer.stock !== undefined) {
      const after = typeof dealer.stock === "number" ? dealer.stock : (dealer.stock[truth] || 0);
      stock = dealer.stockFrom && clock < minutesOf(dealer.stockFrom) ? (dealer.stockBefore || 0) : after;
    }
    let bought = 0, sold = 0;
    (trades || []).forEach(function (t) {
      if (t.where !== loc) return;
      if (t.kind === "buy") bought += t.grams; else sold += t.grams;
    });
    return {
      buy: Math.max(0, stock - bought),                                   // grams you can still buy here
      sell: dealer.limit === undefined ? Infinity : Math.max(0, dealer.limit - sold)   // grams he will still take
    };
  }

  // What a dealer here offers right now, or null when nobody here deals in gold. Pass the player's
  // trades to include their own weight on the price and the dealer's remaining stock and appetite.
  function quote(def, truth, seed, loc, clock, trades) {
    const dealer = dealerAt(def, loc);
    if (!dealerOpen(dealer, truth, clock)) return null;
    const b = breakdown(def, truth, seed, loc, clock);
    const lean = impact(def, trades, loc, clock);
    const left = available(def, truth, loc, clock, trades);
    return {
      loc: loc, dealer: dealer, mid: b.mid,
      buy: dealer.buyOnly ? null : Math.ceil(b.mid * (1 + dealer.spread / 200) * (1 + lean.buyPct / 100)),
      sell: Math.floor(b.mid * (1 - dealer.spread / 200) * (1 - lean.sellPct / 100)),
      buyOnly: !!dealer.buyOnly, impact: lean, canBuy: dealer.buyOnly ? 0 : left.buy, canSell: left.sell
    };
  }

  // Events that start in (from, to]: the clock just moved across them.
  function eventsBetween(def, truth, from, to) {
    return (def.events || []).filter(function (event) {
      if (!eventExists(event, truth)) return false;
      const at = minutesOf(event.at);
      return at > from && at <= to;
    });
  }
  function eventHappened(def, truth, id, clock) {
    const event = (def.events || []).filter(function (e) { return e.id === id; })[0];
    return !!event && eventExists(event, truth) && clock >= minutesOf(event.at);
  }

  /* ---- gold held, as lots -------------------------------------------- */
  // A lot is { grams, cost (per gram), karat, purity, provenance, where, at }. Purity and provenance
  // are carried but not priced yet: they are where assaying, plating and counterfeits will go.
  function round2(n) { return Math.round(n * 100) / 100; }
  function totalGrams(lots) { return round2(lots.reduce(function (sum, lot) { return sum + lot.grams; }, 0)); }
  function averageCost(lots) {
    const grams = totalGrams(lots);
    if (!grams) return 0;
    return round2(lots.reduce(function (sum, lot) { return sum + lot.grams * lot.cost; }, 0) / grams);
  }
  function buyLot(lots, grams, price, meta) {
    const next = lots.map(function (lot) { return Object.assign({}, lot); });
    next.push(Object.assign({ grams: grams, cost: price, karat: 24, purity: 0.999, provenance: "" }, meta || {}));
    return next;
  }
  // Sells the oldest gold first. Returns the lots left and the cost basis of what was sold.
  function sellGrams(lots, grams) {
    const next = lots.map(function (lot) { return Object.assign({}, lot); });
    let left = grams, basis = 0;
    while (left > 0.0001 && next.length) {
      const lot = next[0];
      const take = Math.min(lot.grams, left);
      basis += take * lot.cost;
      lot.grams = round2(lot.grams - take);
      left = round2(left - take);
      if (lot.grams <= 0.0001) next.shift();
    }
    return { lots: next, basis: round2(basis), sold: round2(grams - left) };
  }
  function worth(credits, lots, sellPrice) { return Math.round(credits + totalGrams(lots) * sellPrice); }

  window.NeonMarket = {
    parseClock: parseClock,
    hash32: hash32,
    pickTruth: pickTruth,
    breakdown: breakdown,
    quote: quote,
    impact: impact,
    available: available,
    dealerAt: dealerAt,
    dealerOpen: dealerOpen,
    eventsBetween: eventsBetween,
    eventHappened: eventHappened,
    eventExists: eventExists,
    lots: { total: totalGrams, average: averageCost, buy: buyLot, sell: sellGrams },
    worth: worth
  };
})();
