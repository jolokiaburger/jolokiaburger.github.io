/* The Wrong Supper Crate: physical records, attributed accounts and two resolutions. */
(function () {
  'use strict';
  const M = window.VoyageModel, P = window.VoyagePorts, C = window.VoyageConversations;
  const evidence = {
    label: {quay:'market',who:'nao',name:'Compare the counter’s label',minutes:3,kind:'Physical evidence',text:'The counter has a brass-bushing crate labelled K-17. Under the destination slip is a rice-supplier seal. The slip was tied on after the crate was sealed.'},
    manifest: {quay:'landing',who:'priya',name:'Check Priya’s dispatch manifest',minutes:4,kind:'Dispatch record',text:'Dispatch K-17: Mei’s dry supper ingredients, Metro transfer shelf, then Nao’s counter. Dispatch W-17: workshop bushings, Starling Yard. A copied destination slip crossed the two rows.'},
    recipe: {quay:'bar',who:'mei',name:'Read Mei’s packing card',minutes:3,kind:'Packing record',text:'Mei packed rice, dried mushrooms and sesame in an intact supplier case. Her card specifies the rice seal, not the colour of the destination string.'}
  };
  const endings = {
    counter: {name:'Return the sealed supper case',quay:'market',minutes:6,text:'Nao checks Mei’s seal before opening the lid. “We nearly made a very well-engineered soup.” Priya corrects the dispatch row; the familiar counter has a new supper special.'},
    platform: {name:'Share supper with the late platform crew',quay:'metro',minutes:8,text:'Lam clears the platform table. Nao’s permission is clipped to the corrected manifest. Mei’s rice becomes supper for the watch that found it. “A useful connection,” Lam says, “even without a train.”'}
  };
  const own = (o,k)=>Object.hasOwn(o,k), record=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
  function valid(s) {
    const r=s.crateMystery;if(r===undefined||r===null)return s.neighbours?.replies['nao-crate']!=='matched'&&s.neighbours?.replies['priya-crate']!=='shelf'&&s.neighbours?.replies['lam-crate']!=='table';
    if(!record(r)||!['active','recovered','done','closed'].includes(r.stage)||!record(r.evidence)||!Object.entries(r.evidence).every(([id,at])=>own(evidence,id)&&Number.isFinite(at)&&at>=1420&&at<=s.clock))return false;
    if(!(r.ending===null||own(endings,r.ending))||typeof r.consent!=='boolean'||!Number.isFinite(r.started)||r.started<1420||r.started>s.clock)return false;
    if(!(r.recoveredAt===null||Number.isFinite(r.recoveredAt)&&r.recoveredAt>=r.started&&r.recoveredAt<=s.clock)||!(r.finishedAt===null||Number.isFinite(r.finishedAt)&&r.finishedAt>=r.started&&r.finishedAt<=s.clock))return false;
    if(Object.values(r.evidence).some(at=>at<r.started))return false;
    if(r.carriedChecks!==undefined&&(!Array.isArray(r.carriedChecks)||new Set(r.carriedChecks).size!==r.carriedChecks.length||!r.carriedChecks.every(id=>own(evidence,id)&&r.evidence[id]!==undefined)))return false;
    if(r.recoveredAt!==null&&(!Object.keys(evidence).every(id=>r.evidence[id]!==undefined&&r.evidence[id]<=r.recoveredAt)))return false;
    if(r.stage==='active'&&(r.recoveredAt!==null||r.consent||r.ending||r.finishedAt!==null))return false;
    if(r.stage==='recovered'&&(r.recoveredAt===null||r.ending||r.finishedAt!==null))return false;
    if(r.stage==='done'&&(r.recoveredAt===null||!r.ending||r.finishedAt===null||r.finishedAt<r.recoveredAt||r.ending==='platform'&&!r.consent))return false;
    if(r.stage==='closed'&&(r.ending||r.finishedAt!==null))return false;
    const replies=s.neighbours?.replies||{};
    if(replies['nao-crate']==='matched'&&r.evidence.manifest===undefined||replies['priya-crate']==='shelf'&&r.evidence.recipe===undefined||replies['lam-crate']==='table'&&!r.consent)return false;
    return M.held(s)<=M.capacity(s);
  }
  function startStatus(s){return s.ended?'This night has ended':s.docked!=='market'?'Ask Nao at the Night Market':!M.people(s).includes('nao')?'Bring Nao home first':s.crateMystery?'This case is already in your Journal':'';}
  function start(s){if(startStatus(s))return false;s.crateMystery={stage:'active',evidence:{},ending:null,consent:false,started:s.clock,recoveredAt:null,finishedAt:null};s.track='crate-mystery';M.log(s,'The Wrong Supper Crate · Nao received workshop bushings. Compare the label, dispatch manifest and Mei’s packing card before following a guess.');return true;}
  function inspectStatus(s,id){const r=s.crateMystery,d=evidence[id];return !own(evidence,id)||!r||r.stage!=='active'?'No open evidence check':s.ended?'This night has ended':r.evidence[id]!==undefined?'Already recorded':s.docked!==d.quay?'Read the record at its named quay':s.clock+d.minutes>1800?'Needs '+d.minutes+' min before 06:00':'';}
  function inspect(s,id){if(inspectStatus(s,id))return false;const d=evidence[id];s.crateMystery.evidence[id]=s.clock+d.minutes;M.advance(s,d.minutes);M.log(s,d.kind+' · '+d.text);return true;}
  function recoverStatus(s){const r=s.crateMystery;return !r||r.stage!=='active'?'No case waiting for recovery':s.ended?'This night has ended':!Object.keys(evidence).every(id=>r.evidence[id]!==undefined)?'Compare all three physical records first':s.docked!=='metro'?'Check the Metro transfer shelf':M.held(s)>=M.capacity(s)?'Needs one freight slot':s.clock+4>1800?'Needs 4 min before 06:00':'';}
  function recover(s){if(recoverStatus(s))return false;const r=s.crateMystery;r.stage='recovered';r.recoveredAt=s.clock+4;M.advance(s,4);M.log(s,'Recovered Mei’s sealed supper case from the Metro transfer shelf · Free, 4 min, one freight slot.');return true;}
  function consentStatus(s){return s.crateMystery?.stage!=='recovered'?'Recover the intact case first':s.ended?'This night has ended':s.crateMystery.consent?'Nao has already agreed':s.docked!=='market'?'Ask Nao at her counter':!M.people(s).includes('nao')?'Bring Nao home first':'';}
  function consent(s){if(consentStatus(s))return false;s.crateMystery.consent=true;M.log(s,'Nao authorised a platform supper. The case remains sealed aboard until an explicit handover at Metro.');return true;}
  function finishStatus(s,id){const r=s.crateMystery,d=endings[id];return !own(endings,id)||r?.stage!=='recovered'?'Recover the intact case first':s.ended?'This night has ended':id==='platform'&&!r.consent?'Ask Nao’s permission at the Market first':s.docked!==d.quay?'Visit the selected supper table':s.clock+d.minutes>1800?'Needs '+d.minutes+' min before 06:00':'';}
  function finish(s,id){if(finishStatus(s,id))return false;const d=endings[id],r=s.crateMystery;r.stage='done';r.ending=id;r.finishedAt=s.clock+d.minutes;M.advance(s,d.minutes);M.log(s,d.text+' · Free, '+d.minutes+' min. No delivery fee or refund.');return true;}
  function close(s){const r=s.crateMystery;if(!r||!['active','recovered'].includes(r.stage)||s.ended||!s.docked)return false;r.stage='closed';M.log(s,'Crate investigation closed. Any recovered case is left with the quay office for forwarding; the hold is freed, no payout.');return true;}
  function next(s){const r=s.crateMystery;if(!r||!['active','recovered'].includes(r.stage))return null;if(r.stage==='recovered')return {kind:'mystery-return',id:'counter',quay:'market'};const id=Object.keys(evidence).find(id=>r.evidence[id]===undefined);return id?{kind:'mystery-evidence',id,quay:evidence[id].quay}:{kind:'mystery-recover',id:'crate',quay:'metro'};}
  const oldHeld=M.held,oldValid=M.valid,oldStories=M.stories;
  M.held=s=>oldHeld(s)+(s.crateMystery?.stage==='recovered'?1:0);
  const freight=M.freight,action=M.action,status=M.actionStatus;
  M.freight=(s,id,deliver)=>!deliver&&M.held(s)>=M.capacity(s)?false:freight(s,id,deliver);
  const takesSlot=(s,id)=>['accept-tea','lamp-collect','market-collect'].includes(id)||id==='festival-rice'&&!s.flags.festivalCitrus||id==='festival-citrus'&&!s.flags.festivalRice||id==='letter-collect'&&P.letterJobs[s.letterJob?.id]?.case;
  M.actionStatus=(s,id)=>takesSlot(s,id)&&M.held(s)>=M.capacity(s)?{...status(s,id),ok:false,reason:'Hold is full'}:status(s,id);
  M.action=(s,id)=>takesSlot(s,id)&&M.held(s)>=M.capacity(s)?false:action(s,id);
  M.valid=s=>oldValid(s)&&valid(s);
  M.stories=s=>[...oldStories(s),...(s.crateMystery?[{id:'crate-mystery',title:'The Wrong Supper Crate',done:!['active','recovered'].includes(s.crateMystery.stage),outcome:s.crateMystery.stage==='closed'?'Closed':undefined,to:next(s)?.quay,text:s.crateMystery.stage==='done'?endings[s.crateMystery.ending].text:s.crateMystery.stage==='closed'?'Closed with no payment. Any recovered case was forwarded ashore.':s.crateMystery.stage==='recovered'?'One sealed case aboard. Return it to Nao or ask permission for a platform supper.':Object.keys(s.crateMystery.evidence).length+' / 3 physical records checked. Each record is in the investigation notebook.'}]:[])];
  function addTopic(id,who,title,speech,fact,choices){C.topics[id]={id,who,title,kind:'Working knowledge',speech:()=>speech,fact,choices:choices.map(c=>({...c,reply:()=>c.reply}))};}
  addTopic('nao-crate','nao','What can a destination label prove?','A label tells the next person where somebody meant the case to go. It does not tell me what is inside. Tonight my rice appears to have developed brass teeth.','A destination slip and a sealed supplier mark record different parts of a delivery. In this case, compare both with the dispatch record.',[{id:'check',label:'I’ll compare the physical records.',reply:'Good. Keep what each record actually says in the notebook. We can give a mistake a sensible ending.'},{id:'matched',label:'K-17 and W-17 crossed on the dispatch sheet.',reply:'Then we have a copied label to correct, not a missing cook to blame.',when:s=>s.crateMystery?.evidence.manifest!==undefined}]);
  addTopic('priya-crate','priya','Why keep a dispatch number beside a destination?','A destination can be copied badly. A dispatch number lets us compare the original packing entry with the transfer shelf. I have a drawer devoted to preventing confident guesses.','The fictional K-17 dispatch record identifies Mei’s ingredients and the Metro transfer shelf. Its original record takes precedence over the copied destination slip.',[{id:'method',label:'So the number connects records from different quays.',reply:'Exactly. A name, a time and an identifier make an account something we can check.'},{id:'shelf',label:'The rice seal matches Mei’s packing card.',reply:'Then inspect the Metro shelf. Bring the sealed case to Nao before choosing a different table.',when:s=>s.crateMystery?.evidence.recipe!==undefined}]);
  addTopic('lam-crate','lam','What happens to a parcel between two boats?','We keep transfer cases on a numbered shelf until the next boat signs for them. The late watch found a supper case beside our tools. It was patient enough to wait for the right captain.','Metro’s transfer shelf holds the misplaced supper case. Recovery requires the label, manifest and packing card; docking alone does not claim it.',[{id:'seal',label:'I’ll compare the seal before taking it.',reply:'And leave the forwarding entry legible. The next watch deserves a quiet start.'},{id:'table',label:'Nao has agreed to supper here.',reply:'Then our table is yours. Keep her permission beside the corrected dispatch row.',when:s=>s.crateMystery?.consent===true}]);
  window.VoyageCrateMystery={evidence,endings,valid,startStatus,start,inspectStatus,inspect,recoverStatus,recover,consentStatus,consent,finishStatus,finish,close,next};
})();
