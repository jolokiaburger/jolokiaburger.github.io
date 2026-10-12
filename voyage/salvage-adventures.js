/* Small recoveries, owned receipts and dockside stories; no freight or cash rewards. */
(function () {
  'use strict';
  const M=window.VoyageModel;
  const sites={
    bell:{name:'The silent bicycle bell',x:590,y:880,quay:'metro',who:'yumi',colour:'#d7b879',lanes:[2,4,3],clue:'A brass circle glints below three strands of ribbon.',fact:'“The night crews used bicycle bells to announce soup deliveries before the platform wire was fitted. This one belonged to my first route.”'},
    tin:{name:'The blue recipe tin',x:1780,y:1190,quay:'market',who:'nao',colour:'#86b7c6',lanes:[4,1,2],clue:'A blue corner catches the light between loose reed stems.',fact:'“A recipe tin travelled with the floating kitchens. The pencilled quantities are for twelve people; the last line says to make room for thirteen.”'},
    lens:{name:'A clouded signal lens',x:2660,y:1130,quay:'observatory',who:'mio',colour:'#b9b1d6',lanes:[1,3,4],clue:'A round piece of glass flashes softly above the sand.',fact:'“Before the observatory opened, boats exchanged weather readings with coloured lamps. This lens diffused the light so a nearby crew could read it without losing their night vision.”'}
  };
  const actions={left:'Hook left',right:'Hook right',lower:'Lower through the gap',lift:'Lift carefully',ease:'Ease the line'};
  const data=s=>s.recoveries||(s.recoveries={pending:null,finds:[]});
  function near(s){return !s.docked&&!s.ended?Object.keys(sites).find(id=>!(s.recoveries?.finds||[]).some(f=>f.id===id)&&Math.hypot(s.ship.x-sites[id].x,s.ship.y-sites[id].y)<75)||null:null;}
  function status(s,id){return !Object.hasOwn(sites,id)?'Unknown recovery':s.ended?'This night has ended':s.docked?'Cast off before lowering a line':near(s)!==id?'Approach the marked recovery':s.clock+4>1800?'Needs 4 min before 06:00':'';}
  function simulate(p){
    if(!p||typeof p.id!=='string'||!Object.hasOwn(sites,p.id)||!Array.isArray(p.moves)||p.moves.length>80)return null;
    const r={lane:3,depth:0,tension:35,progress:0,snags:0,done:false};
    for(const a of p.moves){
      if(r.done||typeof a!=='string'||!Object.hasOwn(actions,a))return null;
      if(r.depth<3){
        if(a==='left')r.lane=Math.max(0,r.lane-1);else if(a==='right')r.lane=Math.min(6,r.lane+1);
        else if(a==='lower'){if(r.lane===sites[p.id].lanes[r.depth])r.depth++;else r.snags++;}
        else return null;
      }else if(a==='lift'){r.tension+=24;r.progress+=25;if(r.tension>85){r.snags++;r.tension=45;r.progress=Math.max(0,r.progress-25);}r.done=r.progress>=100;}
      else if(a==='ease'){r.tension=Math.max(15,r.tension-30);}else return null;
    }return r;
  }
  function start(s,id){if(status(s,id)||s.recoveries?.pending)return false;data(s).pending={id,x:s.ship.x,y:s.ship.y,moves:[]};s.ship.speed=0;return true;}
  function active(s){const p=s.recoveries?.pending;return !!p&&!status(s,p.id)&&Math.hypot(s.ship.x-p.x,s.ship.y-p.y)<.01;}
  function act(s,a){const p=s.recoveries?.pending;if(!active(s)||!simulate({...p,moves:[...p.moves,a]}))return false;p.moves.push(a);return true;}
  function cancel(s){if(!s.recoveries?.pending)return false;s.recoveries.pending=null;return true;}
  function retrieve(s){const p=s.recoveries?.pending;if(!active(s)||!simulate(p)?.done)return false;const f={id:p.id,moves:p.moves.slice(),at:s.clock+4,returnedAt:null};s.recoveries.finds.push(f);cancel(s);M.advance(s,4);M.log(s,'Recovered '+sites[f.id].name+' · 4 min. Its owner may recognise it.');return f;}
  function returnStatus(s,id){const f=s.recoveries?.finds.find(f=>f.id===id);return !f?'Recover the object first':f.returnedAt!==null?'Already returned':s.ended?'This night has ended':s.docked!==sites[id].quay?'Visit the owner’s quay':s.clock+4>1800?'Needs 4 min before 06:00':'';}
  function give(s,id){if(returnStatus(s,id))return false;s.recoveries.finds.find(f=>f.id===id).returnedAt=s.clock+4;M.advance(s,4);M.log(s,'Returned '+sites[id].name+' and heard its harbour history · 4 min, free.');return true;}
  function valid(s){const d=s.recoveries;if(d===undefined)return true;if(!d||Array.isArray(d)||!Array.isArray(d.finds)||d.finds.length>3||!Object.hasOwn(d,'pending'))return false;
    if(new Set(d.finds.map(f=>f?.id)).size!==d.finds.length)return false;
    if(!d.finds.every(f=>f&&simulate(f)?.done&&Number.isFinite(f.at)&&f.at>=1424&&f.at<=s.clock&&(f.returnedAt===null||Number.isFinite(f.returnedAt)&&f.returnedAt>=f.at+4&&f.returnedAt<=s.clock)))return false;
    const p=d.pending;return p===null||!!(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&simulate(p)&&active(s));
  }
  const old={valid:M.valid,move:M.move,dock:M.dock,advance:M.advance};
  M.valid=s=>old.valid(s)&&valid(s);
  M.move=(s,...args)=>{const x=s.ship.x,y=s.ship.y,r=old.move(s,...args);if(x!==s.ship.x||y!==s.ship.y)cancel(s);return r;};
  M.dock=s=>{const r=old.dock(s);if(r)cancel(s);return r;};
  M.advance=(s,...args)=>{const r=old.advance(s,...args);if(s.recoveries?.pending&&!active(s))cancel(s);return r;};
  window.VoyageRecoveries={sites,actions,data,near,status,simulate,start,active,act,cancel,retrieve,returnStatus,give,valid};
})();
