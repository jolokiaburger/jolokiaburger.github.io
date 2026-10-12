/* Persistent supper invitations and bounded sailing records; never restores cash. */
(function () {
  'use strict';
  const P=window.VoyageProfile,L=window.VoyageLeisure,R=window.VoyageLanternRuns,S=window.VoyageSuppers;
  Object.assign(L.charms,{supper:'Travelling supper page',lantern:'Lantern-run pennant',dispatch:'Checked dispatch tag'});
  const fresh=()=>({tables:[],endings:[],runs:[]}),valid=P.valid,hydrate=P.hydrate,record=P.record;
  P.valid=p=>valid(p)&&(p.evenings===undefined||p.evenings&&Array.isArray(p.evenings.tables)&&p.evenings.tables.length<=8&&new Set(p.evenings.tables).size===p.evenings.tables.length&&p.evenings.tables.every(id=>Object.hasOwn(S.tables,id)||S.stationGuests.some(g=>g.id===id))&&Array.isArray(p.evenings.endings)&&new Set(p.evenings.endings).size===p.evenings.endings.length&&p.evenings.endings.every(id=>Object.hasOwn(window.VoyageCrateMystery.endings,id))&&Array.isArray(p.evenings.runs)&&p.evenings.runs.length<=12&&new Set(p.evenings.runs.map(r=>r?.id+':'+r?.mode+':'+r?.engine)).size===p.evenings.runs.length&&p.evenings.runs.every(r=>r&&Object.hasOwn(R.courses,r.id)&&['relaxed','timed'].includes(r.mode)&&typeof r.engine==='boolean'&&Number.isFinite(r.elapsed)&&r.elapsed>0&&r.elapsed<=380&&Number.isFinite(r.efficiency)&&r.efficiency>=0&&r.efficiency<=1&&r.grade===R.grade(r.mode,r.elapsed,r.efficiency,R.courses[r.id].par)));
  P.hydrate=p=>{hydrate(p);if(p.evenings===undefined)p.evenings=fresh();return p;};
  P.restoreEvenings=(p,s)=>{P.hydrate(p);if(p.breakwater.completed&&!s.supperPermit)s.supperPermit=p.breakwater.ending;};
  P.syncEvenings=(p,s)=>{
    P.hydrate(p);const b=p.evenings,unlock=id=>{if(!p.charms.includes(id))p.charms.push(id);};
    for(const g of s.supper?.served||[])if(!b.tables.includes(g.id))b.tables.push(g.id);
    if(s.supper?.stage==='done')unlock('supper');
    if(s.crateMystery?.stage==='done'){if(!b.endings.includes(s.crateMystery.ending))b.endings.push(s.crateMystery.ending);unlock('dispatch');}
    for(const r of s.lanternRuns?.results||[]){const at=b.runs.findIndex(g=>g.id===r.id&&g.mode===r.mode&&g.engine===r.engine),prior=b.runs[at];const row={id:r.id,mode:r.mode,engine:r.engine,elapsed:r.elapsed,efficiency:r.efficiency,grade:r.grade};if(!prior)b.runs.push(row);else if(r.mode==='timed'?r.elapsed<prior.elapsed:r.efficiency>prior.efficiency)b.runs[at]=row;unlock('lantern');}
  };
  P.record=(p,s)=>{const result=record(p,s);if(result)P.syncEvenings(p,s);return result;};
})();
