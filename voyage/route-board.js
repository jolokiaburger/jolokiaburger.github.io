/* A bounded itinerary stores action IDs, never prices, rewards or remote quotes. */
(function () {
  'use strict';
  const M=window.VoyageModel,P=window.VoyagePorts,W=window.VoyageWorld,T=window.VoyageTravel,S=window.VoyageSuppers,Q=window.VoyageCrateMystery;
  const own=(o,k)=>Object.hasOwn(o,k), quay=id=>W.ports.find(p=>p.id===id);
  function validStop(s,t){if(!t||typeof t!=='object'||Array.isArray(t)||Object.keys(t).length!==2||typeof t.id!=='string')return false;switch(t.kind){case 'visit':return !!quay(t.id);case 'fuel':return T.pumps.some(p=>p.id===t.id);case 'collect':case 'deliver':return own(P.orders(s),t.id);case 'courier':return ['tea','lamp'].includes(t.id);case 'meal':return own(P.meals,t.id);case 'supper-buy':return own(S.ingredients,t.id);case 'supper-serve':return own(S.tables,t.id)||S.stationGuests.some(g=>g.id===t.id);case 'mystery-evidence':return own(Q.evidence,t.id);case 'mystery-recover':return t.id==='crate';case 'mystery-return':return own(Q.endings,t.id);case 'mystery-consent':return t.id==='nao';default:return false;}}
  function valid(s){return s.routeBoard===undefined||Array.isArray(s.routeBoard)&&s.routeBoard.length<=12&&s.routeBoard.every(t=>validStop(s,t));}
  function completed(s,t){switch(t.kind){case 'collect':return !!s.cargo[t.id];case 'deliver':return !!s.cargo[t.id]&&!s.cargo[t.id].units;case 'courier':return !!s.flags[t.id+'Delivered']||!!s.flags[t.id+'Closed'];case 'supper-buy':return s.supper?.packed[t.id]!==undefined;case 'supper-serve':return !!s.supper?.served.some(g=>g.id===t.id);case 'mystery-evidence':return s.crateMystery?.evidence[t.id]!==undefined;case 'mystery-recover':return s.crateMystery?.recoveredAt!=null;case 'mystery-return':return s.crateMystery?.stage==='done';case 'mystery-consent':return !!s.crateMystery?.consent;default:return false;}}
  function reconcile(s){if(!s.routeBoard)return;while(s.routeBoard.length&&completed(s,s.routeBoard[0]))s.routeBoard.shift();}
  function save(s,list){if(s.ended||!Array.isArray(list)||list.length>12||!list.every(t=>validStop(s,t)))return false;s.routeBoard=list.map(t=>({...t}));reconcile(s);s.track='route-board';return true;}
  function add(s,list){return save(s,[...(s.routeBoard||[]),...list]);}
  function describe(s,t){
    if(!validStop(s,t))return null;
    const base={...t,minutes:0,cost:0,payment:0,loadDelta:0};
    if(t.kind==='visit')return {...base,quay:t.id,title:'Visit '+quay(t.id).name};
    if(t.kind==='fuel')return {...base,quay:t.id,title:'Refuel at '+quay(t.id).name,refill:true,cost:30,minutes:10};
    if(['collect','deliver'].includes(t.kind)){const d=P.orders(s)[t.id],pick=t.kind==='collect';return {...base,quay:pick?d.from:d.to,title:(pick?'Collect ':'Deliver ')+d.title,cost:pick?d.cost:0,payment:pick?0:d.payment,minutes:5,loadDelta:pick?1:-1,opens:pick?d.opens:undefined,deadline:d.deadline};}
    if(t.kind==='courier'){const tea=t.id==='tea';return {...base,quay:tea?'market':'island',title:'Hand over '+(tea?'Mei’s tea':'the lighthouse kit'),payment:tea?P.tea.fee:P.lamp.payment,deadline:tea?P.tea.deadline:P.lamp.deadline,minutes:5,loadDelta:-1};}
    if(t.kind==='meal'){const d=P.meals[t.id];return {...base,quay:t.id,title:d.name,cost:d.price,minutes:d.minutes};}
    if(t.kind==='supper-buy'){const d=S.ingredients[t.id];return {...base,quay:d.quay,title:'Pack '+d.name,cost:d.cost,minutes:d.minutes};}
    if(t.kind==='supper-serve'){const station=S.stationGuests.find(g=>g.id===t.id);return {...base,quay:station?'coast-station':t.id,title:'Serve '+(station?station.name:S.tables[t.id].name),payment:12,minutes:6};}
    if(t.kind==='mystery-evidence'){const d=Q.evidence[t.id];return {...base,quay:d.quay,title:d.name,minutes:d.minutes};}
    if(t.kind==='mystery-recover')return {...base,quay:'metro',title:'Recover the sealed supper case',minutes:4,loadDelta:1};
    if(t.kind==='mystery-consent')return {...base,quay:'market',title:'Ask Nao about a platform supper'};
    if(t.kind==='mystery-return'){const d=Q.endings[t.id];return {...base,quay:d.quay,title:d.name,minutes:d.minutes,loadDelta:-1};}
    return null;
  }
  function evaluate(s,list=s.routeBoard||[]){
    if(!Array.isArray(list)||!list.every(t=>validStop(s,t)))return {feasible:false,reason:'This itinerary contains an unavailable action'};
    const cargo=new Set(Object.entries(s.cargo).filter(([,c])=>c.units).map(([id])=>id)),purchased=new Set(Object.keys(s.cargo)),couriers=new Set(),meals=new Set(),packs=new Set(Object.keys(s.supper?.packed||{})),checks=new Set(Object.keys(s.crateMystery?.evidence||{}));let recovered=s.crateMystery?.stage==='recovered',consent=!!s.crateMystery?.consent,served=s.supper?.served.length||0,resolved=false;
    const tasks=[];
    for(const t of list){
      if(completed(s,t))continue;
      if(t.kind==='collect'){if(purchased.has(t.id))return {feasible:false,reason:'This contract can be purchased only once'};purchased.add(t.id);cargo.add(t.id);}
      if(t.kind==='deliver'){if(!cargo.has(t.id))return {feasible:false,reason:'Collect the case before its handover'};cargo.delete(t.id);}
      if(t.kind==='courier'){if(!s.flags[t.id+'Accepted']||s.flags[t.id+'Closed'])return {feasible:false,reason:'Collect this courier case before planning its handover'};if(couriers.has(t.id))return {feasible:false,reason:'A courier can pay only once'};couriers.add(t.id);}
      if(t.kind==='meal'){if(s.flags['meal-'+t.id]||meals.has(t.id))return {feasible:false,reason:'This quay’s meal has already been shared tonight'};meals.add(t.id);}
      if(t.kind.startsWith('supper-')){
        const r=s.supper;if(!r||r.stage!=='active')return {feasible:false,reason:'Plan a supper evening with Nao first'};
        if(t.kind==='supper-buy'){if(!S.required(r.menu).includes(t.id)||packs.has(t.id))return {feasible:false,reason:'This ingredient is not needed again'};packs.add(t.id);}
        else {const expected=r.mode==='station'?S.stationGuests[served]?.id:r.stops[served];if(expected!==t.id||!S.required(r.menu).every(id=>packs.has(id)))return {feasible:false,reason:'Pack the ingredients and keep the agreed table order'};served++;}
      }
      if(t.kind.startsWith('mystery-')){
        if(resolved)return {feasible:false,reason:'An investigation can resolve only once'};
        if(!s.crateMystery||!['active','recovered'].includes(s.crateMystery.stage))return {feasible:false,reason:'Open the crate investigation with Nao first'};
        if(t.kind==='mystery-evidence'){if(checks.has(t.id))return {feasible:false,reason:'A physical record is checked only once'};checks.add(t.id);}
        if(t.kind==='mystery-recover'){if(recovered||!Object.keys(Q.evidence).every(id=>checks.has(id)))return {feasible:false,reason:'Check all three records before recovering the case'};recovered=true;}
        if(t.kind==='mystery-consent'){if(!recovered||consent)return {feasible:false,reason:'Recover the case and ask Nao once'};consent=true;}
        if(t.kind==='mystery-return'){if(!recovered||t.id==='platform'&&!consent)return {feasible:false,reason:'Recover the case and obtain permission for the chosen table'};recovered=false;resolved=true;}
      }
      const task=describe(s,t);if(!task)return {feasible:false,reason:'This action is unavailable'};tasks.push(task);
    }
    const r=T.simulate(s,tasks);return {...r,tasks,minimumContributions:true};
  }
  function cargoTasks(s,id){if(!own(P.orders(s),id)||s.cargo[id]&&!s.cargo[id].units)return [];return [...(s.cargo[id]?.units?[]:[{kind:'collect',id}]),{kind:'deliver',id}];}
  function supperTasks(s){const r=s.supper;if(!r||r.stage!=='active')return [];return [...S.required(r.menu).filter(id=>r.packed[id]===undefined).map(id=>({kind:'supper-buy',id})),...(r.mode==='station'?S.stationGuests.map(g=>g.id):r.stops).slice(r.served.length).map(id=>({kind:'supper-serve',id}))];}
  function mysteryTasks(s,ending='counter'){const r=s.crateMystery;if(!r||!['active','recovered'].includes(r.stage))return [];return [...(r.stage==='active'?[...Object.keys(Q.evidence).filter(id=>r.evidence[id]===undefined).map(id=>({kind:'mystery-evidence',id})),{kind:'mystery-recover',id:'crate'}]:[]),...(ending==='platform'&&!r.consent?[{kind:'mystery-consent',id:'nao'}]:[]),{kind:'mystery-return',id:ending}];}
  function next(s,estimate=true){const t=s.routeBoard?.[0];if(!t)return null;const d=describe(s,t),r=estimate?evaluate(s):null,pump=r?.feasible&&r.stops[0]?.at<=(r.legs[0]?.at??s.clock)?r.stops[0]:null;return d?{...d,pump:pump||null,reason:r&&!r.feasible?r.reason:''}:null;}
  function executeStatus(s){const t=s.routeBoard?.[0],d=t&&describe(s,t);if(!d)return 'No stop waiting';if(s.ended)return 'This night has ended';if(s.docked!==d.quay)return 'Moor at '+quay(d.quay).name;if(t.kind==='visit')return '';if(t.kind==='fuel')return s.fuel>=5.99?'':M.actionStatus(s,'fuel').reason;if(t.kind==='meal')return M.actionStatus(s,'meal').reason;if(t.kind==='courier')return M.actionStatus(s,t.id==='tea'?'deliver-tea':'lamp-deliver').reason;if(['collect','deliver'].includes(t.kind)){if(s.clock+5>1800)return 'Needs 5 min before 06:00';if(t.kind==='collect'){if(s.clock<(d.opens||1420))return 'Wait for desk release';if(s.clock+5>d.deadline)return 'Collection window closed';if(s.cargo[t.id])return 'Already collected';if(s.credits<d.cost)return 'Needs '+d.cost+' cr';if(M.held(s)>=M.capacity(s))return 'Hold is full';}else{if(!s.cargo[t.id]?.units)return 'No case aboard';if(s.clock>d.deadline)return 'Delivery window closed';}return '';}if(t.kind==='supper-buy')return S.buyStatus(s,t.id);if(t.kind==='supper-serve')return S.serveStatus(s);if(t.kind==='mystery-evidence')return Q.inspectStatus(s,t.id);if(t.kind==='mystery-recover')return Q.recoverStatus(s);if(t.kind==='mystery-consent')return Q.consentStatus(s);if(t.kind==='mystery-return')return Q.finishStatus(s,t.id);return 'This action is unavailable';}
  function execute(s){const t=s.routeBoard?.[0],d=t&&describe(s,t);if(!d||s.ended||s.docked!==d.quay)return false;let okay=false;switch(t.kind){case 'visit':okay=true;break;case 'fuel':okay=s.fuel>=5.99||M.action(s,'fuel');break;case 'collect':case 'deliver':okay=M.freight(s,t.id,t.kind==='deliver');break;case 'courier':okay=M.action(s,t.id==='tea'?'deliver-tea':'lamp-deliver');break;case 'meal':okay=M.action(s,'meal');break;case 'supper-buy':okay=S.buy(s,t.id);break;case 'mystery-evidence':okay=Q.inspect(s,t.id);break;case 'mystery-recover':okay=Q.recover(s);break;case 'mystery-consent':okay=Q.consent(s);break;case 'mystery-return':okay=Q.finish(s,t.id);break;}if(okay){if(s.routeBoard[0]===t)s.routeBoard.shift();reconcile(s);}return okay;}
  const validModel=M.valid,stories=M.stories;M.valid=s=>validModel(s)&&valid(s);
  M.stories=s=>[...(s.routeBoard?.length?[{id:'route-board',title:'Your evening itinerary',done:false,to:describe(s,s.routeBoard[0])?.quay,text:describe(s,s.routeBoard[0])?.title+'. Review cash, fuel stops and action time on the route board.'}]:[]),...stories(s)];
  window.VoyageRouteBoard={valid,validStop,completed,reconcile,save,add,describe,evaluate,cargoTasks,supperTasks,mysteryTasks,next,executeStatus,execute};
})();
