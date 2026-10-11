/* Keep small photographs and cosmetic rewards across voyages, beside the old history. */
(function () {
  'use strict';
  const P = window.VoyageProfile, L = window.VoyageLeisure;
  const valid = P.valid, hydrate = P.hydrate, record = P.record;
  const imageOK = image => typeof image === 'string' && image.length <= 250000 && /^data:image\/(webp|png);base64,[A-Za-z0-9+/=]+$/.test(image);
  P.valid = p => valid(p) && (p.album === undefined || (Array.isArray(p.album) && p.album.length <= 3 && new Set(p.album.map(r => r?.id)).size === p.album.length && p.album.every(r => r && Object.hasOwn(L.photos, r.id) && ['wide', 'close'].includes(r.frame) && Number.isFinite(r.at) && r.at >= 1420 && r.at <= 1800 && typeof r.weather === 'string' && r.weather.length < 30 && imageOK(r.image)))) && (p.fishSeen === undefined || (Array.isArray(p.fishSeen) && p.fishSeen.length <= 6 && new Set(p.fishSeen).size === p.fishSeen.length && p.fishSeen.every(id => Object.hasOwn(L.fish, id)))) && (p.charms === undefined || (Array.isArray(p.charms) && p.charms.length <= 4 && new Set(p.charms).size === p.charms.length && p.charms.every(id => Object.hasOwn(L.charms, id)))) && (p.look.charm === undefined || p.look.charm === 'none' || p.charms?.includes(p.look.charm));
  P.hydrate = p => { hydrate(p); if (p.album === undefined) p.album = []; if (p.fishSeen === undefined) p.fishSeen = []; if (p.charms === undefined) p.charms = []; if (p.look.charm === undefined) p.look.charm = 'none'; return p; };
  P.syncLeisure = (p, s) => {
    P.hydrate(p); const l = s.leisure; if (!l) return;
    for (const c of l.fishing.catches) if (!p.fishSeen.includes(c.id)) p.fishSeen.push(c.id);
    const unlock = id => { if (!p.charms.includes(id)) p.charms.push(id); };
    if (l.fishing.catches.some(c => c.outcome === 'shared')) unlock('fish');
    if (l.kitchen.length === 3) unlock('cup');
    for (const id of l.photos.delivered) unlock(L.jobs[id].charm);
  };
  P.addPhoto = (p, shot, image) => { if (!shot || !Object.hasOwn(L.photos, shot.id) || !imageOK(image)) return false; P.hydrate(p); p.album = [{...shot, image}, ...p.album.filter(r => r.id !== shot.id)].slice(0, 3); return true; };
  P.chooseCharm = (p, id) => { P.hydrate(p); if (id !== 'none' && !p.charms.includes(id)) return false; p.look.charm = id; return true; };
  P.record = (p, s) => { const result = record(p, s); if (result) P.syncLeisure(p, s); return result; };
})();
