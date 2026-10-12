/* A bounded tea record and three oral-history pages survive new harbour nights. */
(function () {
  'use strict';
  const P=window.VoyageProfile,T=window.VoyageTea,S=window.VoyageRecoveries;
  const old={valid:P.valid,hydrate:P.hydrate,sync:P.syncLeisure};
  P.valid=p=>old.valid(p)&&(p.craftBook===undefined||!!p.craftBook&&Array.isArray(p.craftBook.tea)&&p.craftBook.tea.length<=3&&new Set(p.craftBook.tea.map(c=>c?.blend)).size===p.craftBook.tea.length&&p.craftBook.tea.every(c=>c&&typeof c.blend==='string'&&Object.hasOwn(T.blends,c.blend)&&Number.isInteger(c.best)&&c.best>=0&&c.best<=100)&&Array.isArray(p.craftBook.stories)&&p.craftBook.stories.length<=3&&new Set(p.craftBook.stories).size===p.craftBook.stories.length&&p.craftBook.stories.every(id=>typeof id==='string'&&Object.hasOwn(S.sites,id)));
  P.hydrate=p=>{old.hydrate(p);if(p.craftBook===undefined)p.craftBook={tea:[],stories:[]};return p;};
  P.syncLeisure=(p,s)=>{old.sync(p,s);P.hydrate(p);for(const c of s.teaCraft?.cups||[]){const quality=T.simulate(c).quality,prior=p.craftBook.tea.find(r=>r.blend===c.blend);if(prior)prior.best=Math.max(prior.best,quality);else p.craftBook.tea.push({blend:c.blend,best:quality});}for(const f of s.recoveries?.finds||[])if(f.returnedAt!==null&&!p.craftBook.stories.includes(f.id))p.craftBook.stories.push(f.id);};
})();
