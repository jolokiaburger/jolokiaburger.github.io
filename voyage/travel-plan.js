/* Fuel stops are simulated separately from the original distance-only estimates. */
(function () {
  'use strict';
  const M = window.VoyageModel, W = window.VoyageWorld;
  const pumps = W.ports.filter(p => ['landing', 'yard', 'canal', 'observatory','tea-island','coast-station'].includes(p.id));
  const quay = id => W.ports.find(p => p.id === id);
  const routeCache = new Map();
  function route(s, a, b) {
    const key = [!!s.flags.engine, s.breakwater?.route||'base',!!s.breakwater?.steps.includes('trim'),a.x, a.y, b.x, b.y].join(':');
    if (!routeCache.has(key)) { if (routeCache.size >= 1024) routeCache.delete(routeCache.keys().next().value); routeCache.set(key, M.routeStats(s, a, b)); }
    return routeCache.get(key);
  }
  function sailingOptions(s, start, end, tank) {
    const choices = [];
    function visit(pos, fuel, minutes, used, stops, seen) {
      const direct = route(s, pos, end);
      if (direct.fuel <= fuel + 1e-9) choices.push({fuel: Math.max(0, fuel - direct.fuel), minutes: minutes + direct.minutes, used: used + direct.fuel, stops});
      for (const pump of pumps) {
        if (seen.includes(pump.id) || window.VoyageRegions && !window.VoyageRegions.available(s,pump.id)) continue;
        const leg = route(s, pos, pump);
        if (leg.fuel > fuel + 1e-9 || fuel - leg.fuel >= 5.99) continue;
        visit(pump, 6, minutes + leg.minutes + 10, used + leg.fuel, [...stops, {quay: pump.id, at: minutes + leg.minutes, minutes: 10, cost: 30}], [...seen, pump.id]);
      }
    }
    visit(start, tank, 0, 0, [], []);
    return choices.filter((a, i, all) => !all.some((b, j) => i !== j && b.stops.length <= a.stops.length && b.minutes <= a.minutes && b.fuel >= a.fuel && (b.stops.length < a.stops.length || b.minutes < a.minutes || b.fuel > a.fuel)));
  }
  function simulate(s, tasks) {
    let candidates = [{pos: s.ship, clock: s.clock, cash: s.credits, fuel: s.fuel, used: 0, stops: [], legs: [], purchase: 0, payment: 0, load: M.held(s)}];
    let reason = 'No reachable fuel stop with this tank';
    for (const task of tasks) {
      const next = [], target = quay(task.quay); if (!target) return null;
      for (const prior of candidates) for (const option of sailingOptions(s, prior.pos, target, prior.fuel)) {
        const refillCost = option.stops.length * 30, cash = prior.cash - refillCost;
        let clock = prior.clock + option.minutes;
        if (cash < 0) { reason = 'Needs money for a 30 cr fuel stop'; continue; }
        if (task.kind === 'collect') clock = Math.max(clock, task.opens || 1420);
        if (task.deadline !== undefined && (task.kind === 'collect' ? clock + 5 : clock) > task.deadline) { reason = 'Refuelling and travel miss the handover deadline'; continue; }
        if (clock + (task.minutes || 0) > 1800) { reason = 'Travel and fuel stops reach beyond 06:00'; continue; }
        if (task.kind === 'collect' && (cash < task.cost || prior.load >= M.capacity(s))) { reason = cash < task.cost ? 'Purchase and refuelling exceed the purse' : 'Hold is full at collection'; continue; }
        const load = prior.load + (task.kind === 'collect' ? 1 : task.kind === 'deliver' ? -1 : 0);
        next.push({pos: target, clock: clock + (task.minutes || 0), cash: cash - (task.cost || 0) + (task.payment || 0), fuel: option.fuel, used: prior.used + option.used, stops: [...prior.stops, ...option.stops.map(r => ({...r, at: prior.clock + r.at}))], legs: [...prior.legs, {...task, at: clock, fuel: option.used}], purchase: prior.purchase + (task.cost || 0), payment: prior.payment + (task.payment || 0), load});
      }
      // At a common destination, earlier arrival, more cash and more fuel dominate.
      candidates = next.filter((a, i, all) => !all.some((b, j) => i !== j && b.clock <= a.clock && b.cash >= a.cash && b.fuel >= a.fuel && (b.clock < a.clock || b.cash > a.cash || b.fuel > a.fuel))).sort((a, b) => b.cash - a.cash || a.clock - b.clock).slice(0, 64);
      if (!candidates.length) return {feasible: false, reason};
    }
    const best = candidates.sort((a, b) => b.cash - a.cash || a.clock - b.clock)[0];
    return {...best, feasible: true, minutes: best.clock - s.clock, refillCost: best.stops.length * 30, cashAfter: best.cash};
  }
  function cargo(s, id) {
    const orders = window.VoyagePorts.orders(s); if (!Object.hasOwn(orders, id)) return null;
    const d = orders[id]; if (s.cargo[id] && !s.cargo[id].units) return null;
    const held = !!s.cargo[id]?.units, tasks = [];
    if (!held) tasks.push({quay: d.from, kind: 'collect', cost: d.cost, opens: d.opens, deadline: d.deadline, minutes: 5});
    tasks.push({quay: d.to, kind: 'deliver', payment: d.payment, deadline: d.deadline, minutes: 5}, {quay: 'bar', kind: 'home', minutes: 0});
    const result = simulate(s, tasks); if (!result.feasible) return result;
    return {...result, alreadyPaid: held ? d.cost : 0, gross: d.payment - d.cost, netCash: d.payment - d.cost - result.refillCost};
  }
  function journey(s, id) { return simulate(s, [{quay: id, kind: 'visit', minutes: 0}]); }
  window.VoyageTravel = {simulate, cargo, journey};
})();
