/* Eight bounded personal-best pages; syncing the same catch never adds a duplicate reward. */
(function () {
  'use strict';
  const P=window.VoyageProfile,F=window.VoyageFishing;
  const valid=P.valid,hydrate=P.hydrate,sync=P.syncLeisure;
  function entryOK(r){const d=F.species[r?.id];return !!d&&r.seen===true&&(r.best===null||r.best&&Number.isInteger(r.best.lengthMm)&&r.best.lengthMm>=d.range[0]&&r.best.lengthMm<=d.range[1]&&r.best.weightG===Math.max(1,Math.round(r.best.lengthMm**3*d.body/1000000))&&Object.hasOwn(F.grades,r.best.grade));}
  P.valid=p=>valid(p)&&(p.fishJournal===undefined||Array.isArray(p.fishJournal)&&p.fishJournal.length<=8&&new Set(p.fishJournal.map(r=>r?.id)).size===p.fishJournal.length&&p.fishJournal.every(entryOK));
  P.hydrate=p=>{hydrate(p);if(p.fishJournal===undefined)p.fishJournal=[];return p;};
  P.syncLeisure=(p,s)=>{
    sync(p,s);P.hydrate(p);
    const remember=c=>{if(!Object.hasOwn(F.species,c.id))return;let row=p.fishJournal.find(r=>r.id===c.id);if(!row){row={id:c.id,seen:true,best:null};p.fishJournal.push(row);}row.seen=true;if(c.measure&&(!row.best||c.measure.lengthMm>row.best.lengthMm))row.best={lengthMm:c.measure.lengthMm,weightG:c.measure.weightG,grade:c.measure.grade};};
    for(const id of p.fishSeen)remember({id});
    for(const c of [...(s.leisure?.fishing.catches||[]),...(s.breakwater?.catches||[])])remember(c);
  };
})();
