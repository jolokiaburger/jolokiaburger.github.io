/* Optional nightly goals reference existing receipts without consuming or duplicating them. */
(function () {
  'use strict';
  const M=window.VoyageModel,T=window.VoyageTea,S=window.VoyageRecoveries;
  const requests={
    tea:{name:'A cup worth slowing down for',who:'jun',quay:'canal',hint:'Share a cup scoring 80 or more at Jun’s table.',progress:s=>(s.teaCraft?.cups||[]).filter(c=>T.simulate(c).quality>=80).length,need:1,text:'“You gave the water your attention. Keep that habit when the harbour gets loud.” Jun adds a leaf-shaped stamp to your request page.'},
    fish:{name:'A field guide for the counter',who:'nao',quay:'market',hint:'Record two different fish species tonight. Keep, share or release them as you wish.',progress:s=>new Set([...(s.leisure?.fishing.catches||[]),...(s.breakwater?.catches||[])].map(c=>c.id)).size,need:2,text:'“Two fish, two different suppers. Knowing the difference is where a good menu begins.” Nao stamps a tiny fish beside your notes.'},
    salvage:{name:'Something with a history',who:'yumi',quay:'metro',hint:'Return one recovered object to its owner tonight.',progress:s=>(s.recoveries?.finds||[]).filter(f=>f.returnedAt!==null).length,need:1,text:'“Everyone remembers the big departures. Thank you for remembering what comes back.” Yumi presses a brass-coloured circle onto the page.'},
    kitchen:{name:'Room at the kitchen counter',who:'nao',quay:'market',hint:'Help with two trays in Nao’s kitchen tonight.',progress:s=>s.leisure?.kitchen.length||0,need:2,text:'“A busy counter feels smaller with another pair of hands.” Nao saves the warmest corner for your next visit.'}
  };
  function selection(s){const ids=Object.keys(requests);let n=s.breakwater?.night||1;for(const c of s.seed)n+=c.charCodeAt(0);const skip=n%ids.length;return ids.filter((_,i)=>i!==skip);}
  function status(s,id){const d=requests[id];return !d||!selection(s).includes(id)?'Not on tonight’s board':s.harbourRequests?.some(r=>r.id===id)?'Thank-you already received':s.ended?'This night has ended':d.progress(s)<d.need?'Activity still in progress':s.docked!==d.quay?'Visit '+d.who+' at their quay':'';}
  function claim(s,id){if(status(s,id))return false;(s.harbourRequests||(s.harbourRequests=[])).push({id,at:s.clock});M.log(s,'Harbour request complete · '+requests[id].name+' · A personal thank-you, no cash payment.');return true;}
  function valid(s){const rows=s.harbourRequests;if(rows===undefined)return true;return Array.isArray(rows)&&rows.length<=3&&new Set(rows.map(r=>r?.id)).size===rows.length&&rows.every(r=>r&&selection(s).includes(r.id)&&Number.isFinite(r.at)&&r.at>=1420&&r.at<=s.clock&&requests[r.id].progress(s)>=requests[r.id].need);}
  const old=M.valid;M.valid=s=>old(s)&&valid(s);
  window.VoyageRequests={requests,selection,status,claim,valid};
})();
