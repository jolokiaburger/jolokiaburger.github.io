/* Bounded, optional learning and keepsakes; never migrates money or completes a job. */
(function () {
  'use strict';
  const P = window.VoyageProfile, H = window.VoyageNeighbours, C = window.VoyageConversations, W = window.VoyageWorld;
  const originalValid = P.valid, originalHydrate = P.hydrate, originalRecord = P.record;
  const unique = (a, allowed) => Array.isArray(a) && new Set(a).size === a.length && a.every(id => Object.hasOwn(allowed, id));
  const fresh = () => ({facts: [], recipes: [], cooked: [], rides: [], favours: [], gentle: [], preferences: [], practice: false});
  P.valid = p => originalValid(p) && (p.neighbours === undefined || p.neighbours && !Array.isArray(p.neighbours) && unique(p.neighbours.facts, C.topics) && unique(p.neighbours.recipes, H.recipes) && unique(p.neighbours.cooked, H.recipes) && p.neighbours.cooked.every(id => p.neighbours.recipes.includes(id)) && unique(p.neighbours.rides, H.rides) && unique(p.neighbours.favours, H.favours) && unique(p.neighbours.gentle, Object.fromEntries(W.ports.map(p => [p.id, p]))) && unique(p.neighbours.preferences, Object.fromEntries(window.VoyageLeisure.customers.map(c => [c.id, c]))) && typeof p.neighbours.practice === 'boolean');
  P.hydrate = p => { originalHydrate(p); if (p.neighbours === undefined) p.neighbours = fresh(); return p; };
  P.syncNeighbours = (p, s) => {
    P.hydrate(p); const h = s.neighbours; if (!h) return;
    const book = p.neighbours, keep = (key, id) => { if (!book[key].includes(id)) book[key].push(id); }, unlock = id => { if (!p.charms.includes(id)) p.charms.push(id); };
    Object.keys(h.facts).forEach(id => keep('facts', id)); h.learned.forEach(id => keep('recipes', id)); h.recipes.forEach(r => keep('cooked', r.id));
    for (const [id, r] of Object.entries(h.rides)) if (r.stage === 'done') keep('rides', id);
    for (const [id, f] of Object.entries(h.favours)) if (f.stage === 'done') keep('favours', id);
    h.landings.filter(r => r.grade === 'gentle').forEach(r => keep('gentle', r.port));
    s.leisure.kitchen.filter(r => r.matched).forEach(r => keep('preferences', r.customer)); book.practice = h.practice;
    if (book.rides.length) unlock('ticket'); if (book.favours.some(id => id !== 'bell')) unlock('ribbon'); if (book.favours.includes('bell')) unlock('bell'); if (book.cooked.length === 3) unlock('bowl'); if (book.gentle.length >= 3) unlock('rope');
  };
  P.restoreNeighbourLearning = (p, s, carryPractice = false) => { P.hydrate(p); const h = H.hydrate(s); p.neighbours.recipes.forEach(id => { if (!h.learned.includes(id)) h.learned.push(id); }); if (carryPractice) h.practice = p.neighbours.practice; };
  P.record = (p, s) => { const result = originalRecord(p, s); if (result) P.syncNeighbours(p, s); return result; };
})();
