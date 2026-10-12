import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const context = vm.createContext({window: {}, console});
for (const file of ['trade.js', 'market.js', 'voyage/world-map.js', 'voyage/regions.js', 'voyage/navigation.js', 'voyage/ports.js', 'voyage/model.js', 'voyage/leisure.js','voyage/neighbours.js','voyage/conversations.js', 'voyage/breakwater.js','voyage/supper-routes.js','voyage/sailing-challenges.js','voyage/harbour-mystery.js','voyage/travel-plan.js','voyage/route-board.js', 'voyage/profile.js', 'voyage/leisure-profile.js','voyage/neighbours-profile.js','voyage/breakwater-profile.js','voyage/evenings-profile.js']) vm.runInContext(fs.readFileSync(root + file, 'utf8'), context, {filename: file});
const {VoyageModel: M, VoyageWorld: W, VoyagePorts: P, VoyageLeisure: L, VoyageTravel: T, VoyageProfile: Pr, VoyageNavigation: N} = context.window;
let checks = 0;
const check = (v, message) => { assert.ok(v, message); checks++; };
const equal = (a, b, message) => { assert.equal(a, b, message); checks++; };
const clone = value => JSON.parse(JSON.stringify(value));
const moor = (s, id) => { const p = W.ports.find(p => p.id === id); if(p.region==='coast')s.breakwater={...context.window.VoyageBreakwater.fresh(),chapter:2,menu:'herbs',steps:['packed','trim']}; s.docked = id; s.ship = {x: p.x, y: p.y, angle: 0, speed: 0}; };
let s = M.create('pastimes');
delete s.leisure; check(M.valid(s), 'old save remains valid'); const legacyCash = s.credits; M.hydrate(s);
equal(s.credits, legacyCash, 'migration creates no money'); equal(s.leisure.fishing.casts, 0, 'migration creates no catches'); check(M.valid(clone(s)), 'migrated save valid');
check(L.cast(s), 'cast at existing home quay'); equal(s.clock, 1420, 'cast is not charged until landed');
const chosen = s.leisure.fishing.pending.id; check(L.pack(s), 'line can be packed'); check(L.cast(s), 'cast again'); equal(s.leisure.fishing.pending.id, chosen, 'packing cannot reroll a catch');
const pending = clone(s); check(M.valid(pending), 'pending cast save valid'); check(L.reel(pending), 'pending cast resumes after reload'); equal(pending.clock, 1424, 'reel charges four minutes once'); check(!L.reel(pending), 'duplicate reel rejected');
for (let i = 0; i < 3; i++) { check(L.cast(s), 'available cast'); check(L.reel(s), 'catch lands'); }
equal(M.held(s), 0, 'fish do not use freight space'); check(!L.cast(s), 'three-fish basket limit');
check(!L.share(s, 0), 'share requires Nao at market'); check(L.releaseFish(s, 0), 'release one'); check(!L.releaseFish(s, 0), 'cannot release twice');
check(L.cast(s), 'released space allows next catch'); check(M.depart(s), 'depart with a line'); equal(s.leisure.fishing.pending, null, 'departure packs line'); check(M.valid(clone(s)), 'departed save valid');
moor(s, 'market'); const purse = s.credits; check(L.share(s, 1), 'Nao accepts a kept catch'); equal(s.credits, purse + 6, 'fixed six-credit payment'); check(!L.share(s, 1), 'no duplicate catch payment'); check(M.ledgerReport(s).reconciled, 'fresh-catch ledger reconciles');
while (s.leisure.fishing.casts < 6) { for (let i = 0; i < s.leisure.fishing.catches.length; i++) L.releaseFish(s, i); check(L.cast(s), 'next limited cast'); check(L.reel(s), 'next catch'); }
check(!L.cast(s), 'six-catch voyage limit'); check(M.valid(clone(s)), 'fishing outcomes survive reload');
const seen = new Set();
for (const port of W.ports) for (let seed = 0; seed < 8; seed++) { const t = M.create('fish-' + seed); moor(t, port.id); t.clock = 1420 + seed * 13; check(L.cast(t), 'fishing at every quay'); const c = L.reel(t); check(!!c, 'quay catch available'); seen.add(c.id); check(M.valid(clone(t)), 'quay/weather catch valid'); }
equal(seen.size, 6, 'all six species are obtainable');
s = M.create('late-fish'); s.clock = 1797; check(!L.cast(s), 'full fishing duration required'); s.clock = 1796; check(L.cast(s), 'exact-dawn cast budget'); check(L.reel(s), 'exact-dawn catch lands'); check(s.ended && M.valid(s), 'dawn catch ends valid voyage');

s = M.create('kitchen'); check(!L.serve(s, L.customers[0].order), 'kitchen is at market'); moor(s, 'market'); s.flags.naoAboard = true; check(!L.serve(s, L.customers[0].order), 'Nao cannot run two counters while aboard'); s.flags.naoAboard = false;
check(!L.serve(s, {broth: 'constructor', topping: 'tofu', tea: 'roasted'}), 'unknown recipe rejected');
for (const c of L.customers) { const result = L.serve(s, c.order); check(result?.matched, 'authored favourite recognised'); equal(result.payment, 6, 'favourite tray pays six'); }
equal(s.credits, 378, 'three favourite trays pay eighteen'); equal(s.clock, 1438, 'three trays use eighteen minutes'); check(!L.serve(s, L.customers[0].order), 'three-customer shift settles once'); check(M.ledgerReport(s).reconciled, 'kitchen ledger reconciles');
const partialKitchen=M.create('older-kitchen-ledger');moor(partialKitchen,'market');delete partialKitchen.ledger;check(L.serve(partialKitchen,L.customers[0].order),'older ledger-less save can serve');equal(partialKitchen.ledger.openingCash,360,'legacy ledger opens before the kitchen payment');check(M.ledgerReport(partialKitchen).reconciled&&!partialKitchen.ledger.complete,'legacy kitchen accounting reconciles and remains partial');
const profile = Pr.create(); Pr.syncLeisure(profile, s); check(profile.charms.includes('cup'), 'shift unlocks tea-cup charm'); check(Pr.chooseCharm(profile, 'cup'), 'earned decoration selectable'); check(!Pr.chooseCharm(profile, 'star'), 'unearned decoration cannot be selected'); check(Pr.valid(clone(profile)), 'cosmetic profile valid');
s.ended = true; check(Pr.record(profile, s), 'completed voyage recorded'); equal(profile.history[0].entry.result, 18, 'kitchen income appears in voyage result'); check(Pr.valid(clone(profile)), 'new history remains valid');
s = M.create('wrong-tray'); moor(s, 'market'); const response = L.serve(s, {broth: 'ginger', topping: 'greens', tea: 'black'}); check(!response.matched, 'alternate tray receives gentle feedback'); equal(response.payment, 4, 'alternate tray still receives thanks'); s.clock = 1795; check(!L.serve(s, L.customers[1].order), 'late shift does not partially charge');
s.clock = 1794; check(L.serve(s, L.customers[1].order), 'tray can finish exactly at dawn'); check(s.ended && M.valid(s), 'exact-dawn tray save valid');

s = M.create('photographs'); check(!L.acceptPhotos(s, 'yumi'), 'meet photo requester first');
moor(s, 'metro'); const photoCash = s.credits; check(L.acceptPhotos(s, 'yumi'), 'Yumi request accepted'); check(!L.acceptPhotos(s, 'yumi'), 'request accepted once'); moor(s, 'observatory'); check(L.acceptPhotos(s, 'mio'), 'Mio request accepted');
const album = Pr.create();
for (const id of Object.keys(L.photos)) {
  const d = L.photos[id]; s.docked = null; s.ship = {x: d.x, y: id === 'lighthouse-beam' ? 1660 : d.y, angle: 0, speed: 0};
  check(N.water(s.ship.x, s.ship.y), 'photo can be approached in actual navigable water'); equal(L.nearPhoto(s), id, 'requested view is nearby'); s.ship.speed = 2; check(!L.takePhoto(s, id, 'wide'), 'stop before photograph'); s.ship.speed = 0;
  check(!L.takePhoto(s, id, 'unknown'), 'invalid frame rejected'); const shot = L.takePhoto(s, id, 'close'); check(!!shot, 'photograph captured'); check(!L.takePhoto(s, id, 'close'), 'photograph cannot consume time twice'); check(Pr.addPhoto(album, shot, 'data:image/webp;base64,AQIDBA=='), 'bounded local thumbnail saved'); check(M.valid(clone(s)), 'photo progress reloads');
}
equal(s.credits, photoCash, 'photo errands require no purchase');
moor(s, 'metro'); check(L.deliverPhotos(s, 'yumi'), 'Yumi receives both views'); check(!L.deliverPhotos(s, 'yumi'), 'Yumi reward only once'); moor(s, 'observatory'); check(L.deliverPhotos(s, 'mio'), 'Mio receives lighthouse view');
Pr.syncLeisure(album, s); check(album.charms.includes('star') && album.charms.includes('pennant'), 'both photo decorations earned'); equal(album.album.length, 3, 'three postcards persist'); check(Pr.valid(clone(album)), 'album profile reloads'); equal(s.credits, photoCash, 'cosmetic photo rewards add no cash');
check(!Pr.addPhoto(album, {id: 'constructor'}, 'data:image/webp;base64,AQIDBA=='), 'unknown photo metadata rejected');
for (const corrupt of [p => p.album.push(clone(p.album[0])), p => p.album[0].image = 'javascript:alert(1)', p => p.album[0].image = 'data:image/svg+xml;base64,AQIDBA==', p => p.album[0].image = 'data:image/webp;base64,' + 'A'.repeat(250001), p => p.charms.push('constructor')]) { const bad = clone(album); corrupt(bad); check(!Pr.valid(bad), 'malformed album/charms rejected'); }
for (const corrupt of [t => t.leisure.fishing.casts = 99, t => t.leisure.fishing.catches.push({id: 'toString'}), t => t.leisure.photos.accepted.push('constructor'), t => t.leisure.photos.shots[0].frame = 'invalid', t => t.leisure.photos.shots[0].at = t.clock + 1, t => t.leisure.photos.shots.push(clone(t.leisure.photos.shots[0])), t => t.leisure.kitchen = [{customer: 'mei', at: t.clock, matched: true, dish: L.customers[0].order}]]) { const bad = clone(s); corrupt(bad); check(!M.valid(bad), 'malformed optional activity save rejected'); }
const oldProfile = Pr.create(); check(Pr.valid(oldProfile), 'profile without optional fields valid'); Pr.hydrate(oldProfile); equal(oldProfile.album.length, 0, 'older profile gets empty album'); equal(oldProfile.look.charm, 'none', 'no reward invented during migration');

const bowl = Object.keys(P.orders(s)).find(id => P.orders(s)[id].from === 'canal' && P.orders(s)[id].to === 'bar');
s = M.create('fuel-budget'); moor(s, 'landing'); s.fuel = .1;
let trip = T.cargo(s, bowl); check(trip.feasible, 'low-tank job gets reachable fuel stops'); check(trip.stops.length > 0, 'refills explicitly present'); equal(trip.stops[0].quay, 'landing', 'empty-ish boat refuels where it is'); equal(trip.refillCost, trip.stops.length * 30, 'actual full-tank charges included'); equal(trip.cashAfter, s.credits - trip.purchase + trip.payment - trip.refillCost, 'purse simulation reconciles'); equal(trip.netCash, trip.gross - trip.refillCost, 'net cash includes fuel bought'); check(trip.clock < 1800, 'return included before dawn'); check(trip.legs.find(r => r.kind === 'deliver').at <= P.orders(s)[bowl].deadline, 'deadline includes fuel-stop time');
s.credits = 29; check(!T.cargo(s, bowl).feasible, 'cannot promise a refill without money'); s.credits = 360; s.clock = 1799; check(!T.cargo(s, bowl).feasible, 'late trip cannot promise an on-time return');
s = M.create('no-pump'); s.fuel = .01; check(!T.journey(s, 'canal').feasible, 'unreachable pumps are not invented'); equal(T.cargo(s, 'toString'), null, 'inherited cargo ID rejected');
const budgetsStarted = performance.now();
for (const port of W.ports) {
  const t = M.create('budget-sweep'); moor(t, port.id);
  for (const id of Object.keys(P.orders(t))) {
    const plan = T.cargo(t, id); check(!!plan, 'each order has budget or clear failure');
    if (!plan.feasible) continue;
    check(plan.fuel >= 0 && plan.fuel <= 6, 'simulated tank stays bounded'); check(plan.cashAfter >= 0, 'simulated purse stays nonnegative'); check(plan.clock <= 1800, 'simulated return before dawn');
    equal(plan.refillCost, plan.stops.length * 30, 'sweep refill cost reconciles'); check(plan.legs.filter(r => r.kind === 'deliver').every(r => r.at <= P.orders(t)[id].deadline), 'sweep deadlines honoured');
  }
}
console.log(`Passed ${checks} harbour-activity, save, reward and fuel-budget checks. Budget sweep: ${Math.round(performance.now() - budgetsStarted)} ms.`);
