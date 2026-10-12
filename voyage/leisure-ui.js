/* Deliberately opened activities; no activity interrupts sailing or claims a reward twice. */
(function () {
  'use strict';
  const L = window.VoyageLeisure, M = window.VoyageModel, P = window.VoyagePorts, Profile = window.VoyageProfile;
  function create(api) {
    const {el, button, openPanel, changed, toast} = api;
    const state = () => api.getState(), profile = () => api.getProfile();
    const angling = window.VoyageFishingUI.create({...api, hub: () => hub()});
    function dispose() { angling.dispose(); }
    function image(src, alt, cls = 'dockside-art') { const img = el('img'); img.src = src; img.alt = alt; img.className = cls; img.onerror = () => { img.hidden = true; }; return img; }
    function reasonButton(label, kind, fn) { const reason = L.status(state(), kind); return button(label + (reason ? ' · ' + reason : ''), fn, !!reason); }
    function portrait(id, mood = 'thoughtful') { const head = el('div', undefined, 'activity-host'); head.append(image(P.portrait(id, mood), P.characters[id].name, 'activity-portrait'), el('strong', P.characters[id].name)); return head; }
    function dishArt(dish) {
      const topping = dish.topping === 'greens' ? '#799465' : dish.topping === 'mushroom' ? '#a28467' : '#eee0bc';
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220"><rect width="400" height="220" rx="20" fill="#283e42"/><ellipse cx="190" cy="177" rx="125" ry="16" fill="#122c3480"/><path d="M65 92Q80 187 187 187Q290 183 308 92Z" fill="#c8b899" stroke="#ebd7ae" stroke-width="3"/><ellipse cx="187" cy="93" rx="122" ry="44" fill="' + (dish.broth === 'ginger' ? '#c3985e' : '#aa8161') + '" stroke="#ebd7ae" stroke-width="6"/><path d="M100 88Q151 54 224 99M100 100Q170 62 264 97M113 114Q173 80 240 117" fill="none" stroke="#e4ce9c" stroke-width="6"/><g fill="' + topping + '"><ellipse cx="139" cy="84" rx="20" ry="10"/><ellipse cx="204" cy="104" rx="22" ry="11"/><ellipse cx="246" cy="82" rx="19" ry="10"/></g><path d="M324 132H367V181Q346 195 324 181Z" fill="#83a2a0"/><ellipse cx="345" cy="132" rx="22" ry="7" fill="#a57b4e"/><path d="M360 143Q389 143 368 170" fill="none" stroke="#83a2a0" stroke-width="7"/></svg>';
      return image('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), L.dishes.broth[dish.broth] + ' with ' + L.dishes.topping[dish.topping] + ' and ' + L.dishes.tea[dish.tea] + '.', 'dish-art');
    }
    function hub() {
      const s = state(), l = s.leisure;
      openPanel('Harbour pastimes', [el('p', 'A quiet cast, a warm tray, or a view worth bringing home. Every activity is optional.'),
        button('Jun’s tea-brewing table',()=>window.NeonVoyage.craft.tea()),button('Tonight’s harbour requests',()=>window.NeonVoyage.craft.requests()),
        reasonButton('Dockside fishing · Free · 4 min per catch', 'fish', fishing),
        reasonButton('Help Nao’s kitchen · Receive 4–6 cr · 6 min per tray', 'kitchen', kitchen),
        button('Catch basket · ' + l.fishing.catches.filter(c => c.outcome === 'kept').length + ' / 3', basket),
        button('Captain’s fish notebook · Eight illustrated species', angling.notebook),
        button('Photo errands & album', album), button('Recipe notebook', () => api.neighbourUI().recipes()), button('Passenger trips', () => api.neighbourUI().routes()), button('Neighbour favours', () => api.neighbourUI().favours()), button('Ferry decorations', decorations),
        el('p', 'Fishing uses a separate three-fish basket, never your freight hold. Six catches per voyage; Nao offers 6 cr each. Kitchen ingredients belong to her stall. No purchase is required.', 'muted')]);
    }
    function fishing() { angling.fishing('harbour'); }
    function basket() { angling.basket('harbour'); }
    function kitchen() {
      const s = state(), rows = s.leisure.kitchen, customer = L.customers[rows.length];
      if (!customer) { openPanel('A counter full of familiar faces', [portrait('nao'), el('p', 'All three trays have reached their customers. ' + rows.filter(r => r.matched).length + ' / 3 favourite orders remembered. Nao has saved a little tea-cup decoration for the Tern.'), button('Ferry decorations', decorations), button('Back to pastimes', hub)]); return; }
      const dish = {broth: 'miso', topping: 'tofu', tea: 'roasted'}, preview = el('div'); preview.append(dishArt(dish));
      const nodes = [portrait('nao'), ...(profile().neighbours?.preferences.includes(customer.id) ? [el('p', 'Remembered favourite: ' + Object.keys(L.dishes).map(k => L.dishes[k][customer.order[k]]).join(' · '), 'remembered-recipe')] : []), el('p', 'Tray ' + (rows.length + 1) + ' / 3 · Nao supplies ingredients · Receive 4 cr thanks, plus 2 cr for the favourite combination · 6 min.'), portrait(customer.id), el('p', customer.hint, 'speech'), preview];
      for (const kind of Object.keys(L.dishes)) {
        const group = el('div', undefined, 'recipe-options'); group.setAttribute('role', 'group'); group.setAttribute('aria-label', 'Choose ' + kind); group.append(el('h3', 'Choose ' + kind));
        const choices = [];
        for (const [id, label] of Object.entries(L.dishes[kind])) {
          const choice = button(label, () => { dish[kind] = id; choices.forEach(([key, n]) => n.setAttribute('aria-pressed', key === id ? 'true' : 'false')); preview.replaceChildren(dishArt(dish)); }); choice.setAttribute('aria-pressed', dish[kind] === id ? 'true' : 'false'); choices.push([id, choice]); group.append(choice);
        }
        nodes.push(group);
      }
      nodes.push(reasonButton('Serve the tray · 6 min', 'kitchen', () => { const result = L.serve(s, dish); if (!result) { toast(L.status(s, 'kitchen')); return; } if (!changed()) return; openPanel('One warm tray', [dishArt(dish), el('p', result.text), el('p', 'Received ' + result.payment + ' cr · 6 min · ' + s.leisure.kitchen.length + ' / 3 customers served'), button(s.leisure.kitchen.length === 3 ? 'Finish the shift' : 'Next customer', kitchen), button('Back to pastimes', hub)]); }), button('Leave the counter · No cost', hub));
      openPanel('Nao’s kitchen shift', nodes);
    }
    function album() {
      const s = state(), p = s.leisure.photos, nodes = [el('p', 'Accept Yumi’s request at Metro or Mio’s at Tsukimi. Take the views from the water, then return to your neighbour. Each photograph costs two minutes; there is no fee or delivery deadline.')];
      for (const [id, j] of Object.entries(L.jobs)) {
        const card = el('article', undefined, 'pastime-card'); card.append(portrait(id), el('h3', j.title));
        for (const key of j.shots) card.append(el('p', (p.shots.some(r => r.id === key) ? '✓ ' : '○ ') + L.photos[key].title));
        if (!p.accepted.includes(id)) card.append(button('Accept photo errand · Free', () => { if (L.acceptPhotos(s, id)) { changed(); album(); } }, s.ended || s.docked !== j.port));
        else if (!p.delivered.includes(id)) card.append(button('Bring back the photos · Free', () => { if (L.deliverPhotos(s, id)) { changed(); openPanel(j.title, [portrait(id, 'pleased'), el('p', j.thanks), button('Ferry decorations', decorations), button('Back to album', album)]); } }, s.ended || s.docked !== j.port || !j.shots.every(key => p.shots.some(r => r.id === key))));
        else card.append(el('p', 'Completed · ' + L.charms[j.charm] + ' unlocked'));
        nodes.push(card);
      }
      const nearby = L.nearPhoto(s); if (nearby) nodes.unshift(button('Frame a photo · ' + L.photos[nearby].title, camera, false, true));
      nodes.push(el('h3', 'Your postcard album'));
      for (const r of profile().album) { const card = el('article', undefined, 'postcard'); card.append(image(r.image, L.photos[r.id].title + ' in ' + r.weather + ', ' + r.frame + ' framing.', 'postcard-image'), el('h3', L.photos[r.id].title), el('p', M.time(r.at) + ' · ' + r.weather + ' · ' + r.frame)); nodes.push(card); }
      if (!profile().album.length) nodes.push(el('p', 'Your photographs will stay here between voyages.'));
      nodes.push(button('Back to pastimes', hub)); openPanel('Photo errands & postcard album', nodes);
    }
    function camera() {
      const s = state(), id = L.nearPhoto(s); if (!id) { toast('Accept an errand and sail beside its view first.'); return; }
      let frame = 'wide'; const caption = el('p','Wide view selected','muted'); const preview = image(api.photoSource(id, frame), L.photos[id].title + ' camera preview.', 'postcard-image'), controls = el('div', undefined, 'recipe-options');
      for (const size of ['wide', 'close']) controls.append(button(size === 'wide' ? 'Wide view' : 'Closer view', () => { frame = size; caption.textContent = size === 'wide' ? 'Wide view selected' : 'Closer view selected'; preview.src = api.photoSource(id, frame); preview.alt = L.photos[id].title + ' · ' + frame + ' framing.'; }));
      openPanel('Frame a photo · ' + L.photos[id].title, [el('p', 'The ferry is stopped. Choose your framing, then take the photograph · Free · 2 min.'), preview, controls, caption, button('Take photograph · Free · 2 min', () => { const imageData = api.photoSource(id, frame), shot = L.takePhoto(s, id, frame); if (!shot) { toast('Check the view and allow two minutes before dawn.'); return; } if (!Profile.addPhoto(profile(), shot, imageData)) toast('The view was recorded, but this browser could not keep its thumbnail.'); if (changed()) album(); }, s.clock + 2 > 1800, true), button('Leave camera · No cost', album)]);
    }
    function decorations() {
      const p = profile(), nodes = [el('p', 'Small keepsakes for the cabin rail. They persist between voyages and do not change fuel, speed or cargo space.')];
      for (const id of ['none', ...Object.keys(L.charms)]) nodes.push(button((p.look.charm === id ? '✓ ' : '') + (id === 'none' ? 'No decoration' : L.charms[id]) + (id !== 'none' && !p.charms.includes(id) ? ' · Earn through pastimes' : ''), () => { if (Profile.chooseCharm(p, id)) { changed(); decorations(); } }, id !== 'none' && !p.charms.includes(id)));
      nodes.push(button('Back to pastimes', hub)); openPanel('Ferry decorations', nodes);
    }
    function dockside() {
      const views = {
        bar: {who: 'mei', file: 'mei', title: 'Mei’s kitchen', alt: 'Mei at her warm kitchen counter with ceramic bowls and a broth pot.'},
        market: {who: 'nao', file: 'nao', title: 'Nao’s lantern counter', alt: 'Nao serving a bowl beside tea and the lantern-lit harbour.'},
        canal: {who: 'jun', file: 'jun', title: 'Jun’s canal tea table', alt: 'Jun beside the canal, with a kettle and ceramic cups beneath warm lanterns.'},
        metro: {who: 'yumi', file: 'metro', title: 'A seat by Metro’s night platform', alt: 'Captain Lam and Yumi share tea beneath Metro Quay’s shelter, with a brass thermos and sketchbook.'},
        yard: {who: 'rin', file: 'yard', title: 'Rin’s workshop supper table', alt: 'Rin beside a repaired pump, kettle and miso bowl in her warm harbour workshop.'},
        observatory: {who: 'mio', file: 'observatory', title: 'Mio’s dockside chart table', alt: 'Mio points at a star chart between cocoa cups, with the observatory dome and harbour beyond.'}
      };
      const s = state(), view = views[s.docked]; if (!view || view.who === 'nao' && s.flags.naoAboard) return;
      const id = view.who, frame = el('div', undefined, 'dockside-scene'); frame.append(image('../assets/scenes/' + view.file + '-dockside.webp', view.alt), el('span', '', 'dockside-steam'));
      const nodes = [frame, portrait(id), el('p', 'An illustrated seat beside the quay. Looking is free and pauses the clock.'), button('Chat with ' + P.characters[id].name.split(' ')[0], () => { api.closePanel(); api.showPerson(id); }), button('Jun’s tea-brewing table',()=>window.NeonVoyage.craft.tea()),button('Tonight’s harbour requests',()=>window.NeonVoyage.craft.requests()),
        reasonButton('Dockside fishing · Free · 4 min', 'fish', fishing), button('Neighbour favours', () => api.neighbourUI().favours())];
      if (id === 'nao') nodes.push(reasonButton('Help with the kitchen shift', 'kitchen', kitchen), button('Nao’s recipe notebook', () => api.neighbourUI().recipes()));
      if (s.docked === 'metro') nodes.push(button('Passenger trips', () => api.neighbourUI().routes()));
      if (id === 'mio') nodes.push(button('Photo errands & postcard album', album));
      const meal = P.meals[s.docked]; if (meal) nodes.push(button(meal.name + ' · ' + meal.price + ' cr · ' + meal.minutes + ' min', () => { if (M.action(s, 'meal') && changed()) dockside(); }, !M.actionStatus(s, 'meal').ok));
      nodes.push(button('Back to the quay', api.closePanel)); openPanel(view.title, nodes);
    }
    return {dispose, hub, fishing, coastalFishing: () => angling.fishing('coast'), coastalBasket: () => angling.basket('coast'), fishNotebook: angling.notebook, kitchen, basket, album, camera, decorations, dockside, dishArt};
  }
  window.VoyageLeisureUI = {create};
})();
