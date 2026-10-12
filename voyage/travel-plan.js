/* Shared cash, capacity and fuel-stop simulation for cargo and the route board. */
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
    const choices = [], labels = new Map();
    function visit(pos, fuel, minutes, used, stops, seen) {
      const direct = route(s, pos, end);
      if (direct.fuel <= fuel + 1e-9) choices.push({fuel: Math.max(0, fuel - direct.fuel), minutes: minutes + direct.minutes, used: used + direct.fuel, stops});
      for (const pump of pumps) {
        if (window.VoyageRegions && !window.VoyageRegions.available(s,pump.id)) continue;
        const leg = route(s, pos, pump);
        if (leg.fuel > fuel + 1e-9 || fuel - leg.fuel >= 5.99) continue;
        const arrival = minutes + leg.minutes + 10, count = stops.length + 1, prior = labels.get(pump.id) || [];
        if (prior.some(r => r.minutes <= arrival && r.count <= count)) continue;
        labels.set(pump.id, [...prior.filter(r => !(r.minutes >= arrival && r.count >= count)), {minutes: arrival, count}]);
        visit(pump, 6, arrival, used + leg.fuel, [...stops, {quay: pump.id, at: minutes + leg.minutes, minutes: 10, cost: 30}], [...seen, pump.id]);
      }
    }
    visit(start, tank, 0, 0, [], []);
    return choices.filter((a, i, all) => !all.some((b, j) => i !== j && b.stops.length <= a.stops.length && b.minutes <= a.minutes && b.fuel >= a.fuel && (b.stops.length < a.stops.length || b.minutes < a.minutes || b.fuel > a.fuel)));
  }
  function simulate(s, tasks) {
    let candidates = [{pos: s.ship, clock: s.clock, cash: s.credits, fuel: s.fuel, used: 0, stops: [], legs: [], purchase: 0, payment: 0, load: M.held(s)}];
    let reason = 'No reachable fuel stop with this tank';
    for (const task of tasks) {
      const next = [], target = quay(task.quay); if (!target || window.VoyageRegions && !window.VoyageRegions.available(s, task.quay)) return {feasible: false, reason: 'This quay is not available'};
      for (const prior of candidates) for (const option of sailingOptions(s, prior.pos, target, prior.fuel)) {
        const refillCost = option.stops.length * 30, cash = prior.cash - refillCost;
        let clock = prior.clock + option.minutes;
        if (cash < 0) { reason = 'Needs money for a 30 cr fuel stop'; continue; }
        const arrival = clock; clock = Math.max(clock, task.opens || 1420);
        const cost = task.refill && option.fuel >= 5.99 ? 0 : task.cost || 0, duration = task.refill && option.fuel >= 5.99 ? 0 : task.minutes || 0;
        if (task.deadline !== undefined && (task.kind === 'collect' ? clock + duration : clock) > task.deadline) { reason = 'Refuelling and travel miss the handover deadline'; continue; }
        if (clock + duration > 1800) { reason = 'Travel and fuel stops reach beyond 06:00'; continue; }
        const delta = task.loadDelta ?? (task.kind === 'collect' ? 1 : task.kind === 'deliver' ? -1 : 0), load = prior.load + delta;
        if (cash < cost || load > M.capacity(s) || load < 0) { reason = cash < cost ? 'Purchase and refuelling exceed the purse' : load < 0 ? 'A delivery is planned before its collection' : 'Hold is full at collection'; continue; }
        next.push({pos: target, clock: clock + duration, cash: cash - cost + (task.payment || 0), fuel: task.refill ? 6 : option.fuel, used: prior.used + option.used, stops: [...prior.stops, ...option.stops.map(r => ({...r, at: prior.clock + r.at}))], legs: [...prior.legs, {...task, cost, minutes: duration, at: clock, arrival, wait: clock-arrival, fuel: option.used, tank: task.refill ? 6 : option.fuel, cash: cash-cost+(task.payment||0), load}], purchase: prior.purchase + (task.refill ? 0 : cost), payment: prior.payment + (task.payment || 0), explicitFuel: (prior.explicitFuel || 0) + (task.refill ? cost : 0), load});
      }
      // At a common destination, earlier arrival, more cash and more fuel dominate.
      candidates = next.filter((a, i, all) => !all.some((b, j) => i !== j && b.clock <= a.clock && b.cash >= a.cash && b.fuel >= a.fuel && (b.clock < a.clock || b.cash > a.cash || b.fuel > a.fuel))).sort((a, b) => b.cash - a.cash || a.clock - b.clock).slice(0, 64);
      if (!candidates.length) return {feasible: false, reason};
    }
    const best = candidates.sort((a, b) => b.cash - a.cash || a.clock - b.clock)[0];
    return {...best, feasible: true, minutes: best.clock - s.clock, refillCost: best.stops.length * 30 + (best.explicitFuel || 0), cashAfter: best.cash};
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
  function combined(s, ids) {
    const orders = window.VoyagePorts.orders(s);
    if (!Array.isArray(ids) || ids.length !== 2 || new Set(ids).size !== 2 || !ids.every(id => Object.hasOwn(orders,id) && (!s.cargo[id] || s.cargo[id].units))) return null;
    const tasks = ids.flatMap(id => {const d=orders[id];return [...(s.cargo[id]?.units?[]:[{id,quay:d.from,kind:'collect',cost:d.cost,minutes:5,opens:d.opens,deadline:d.deadline}]),{id,quay:d.to,kind:'deliver',payment:d.payment,minutes:5,deadline:d.deadline}];}), results=[];
    function visit(rest,list) {if(!rest.length){const r=simulate(s,[...list,{quay:'bar',kind:'home',minutes:0}]);if(r.feasible)results.push({...r,tasks:list});return;}rest.forEach((t,i)=>{if(t.kind==='deliver'&&!s.cargo[t.id]?.units&&!list.some(p=>p.id===t.id&&p.kind==='collect'))return;visit(rest.filter((_,j)=>i!==j),[...list,t]);});}
    visit(tasks,[]);return results.sort((a,b)=>b.cashAfter-a.cashAfter||a.clock-b.clock)[0]||{feasible:false,reason:'No collection order fits the tank, refill budget, hold and deadlines'};
  }
  window.VoyageTravel = {simulate, cargo, journey, combined, pumps};
})();
