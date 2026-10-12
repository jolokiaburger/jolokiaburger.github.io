/* Shared harbour/coastal angling panels. No reaction deadline or background catch commits. */
(function () {
  'use strict';
  const F=window.VoyageFishing,L=window.VoyageLeisure,B=window.VoyageBreakwater,M=window.VoyageModel,W=window.VoyageWorld;
  function create(api){
    const {el,button,openPanel,changed,toast}=api,state=()=>api.getState(),profile=()=>api.getProfile();
    let timer=0,generation=0,selectedLure='silk',selectedDepth='middle';
    function dispose(){clearTimeout(timer);timer=0;generation++;}
    function art(id,large=false){const d=F.species[id],img=el('img',undefined,large?'fish-art fish-art-large':'fish-art');img.src=d.art;img.alt=d.name+' swimming in teal water, with finely painted scales and fins.';img.width=1536;img.height=1024;img.loading=large?'eager':'lazy';img.decoding='async';img.onerror=()=>{img.hidden=true;};return img;}
    const length=n=>(n/10).toFixed(1)+' cm',weight=n=>n>=1000?(n/1000).toFixed(2)+' kg':n+' g';
    function stats(c){return c.measure?length(c.measure.lengthMm)+' · '+weight(c.measure.weightG)+' · '+F.grades[c.measure.grade]:'Earlier catch · Size was not recorded';}
    function about(id,back){
      const d=F.species[id],row=profile().fishJournal.find(r=>r.id===id),nodes=[art(id,true),el('h3',d.name),el('p',d.source==='coast'?'Coastal species · Expedition basket':'Harbour species · Separate catch basket','fish-kicker'),el('p',row?.seen?'Observed in your captain’s notebook':'Not yet caught · The harbour guide is available before your first cast','muted'),el('h3','Where to look'),el('p',d.habitat),el('p','Suggested tackle: '+F.lures[d.lure].name+' · '+F.depths[d.depth].name),el('p','Guide length: '+length(d.range[0])+'–'+length(d.range[1])),el('h3','Read the water'),el('p',d.tell),el('p','Basin diet: '+d.diet),el('h3',d.voice+'’s notebook'),el('p',d.field,'speech'),el('h3','A place at supper'),el('p',d.food+' Tea pairing: '+d.tea+'.'),el('p','These are stories and species descriptions from the fictional Neon Tides Basin. Food notes do not unlock a recipe or consume a catch.','muted')];
      if(row?.best)nodes.splice(4,0,el('p','Personal best: '+length(row.best.lengthMm)+' · '+weight(row.best.weightG)+' · '+F.grades[row.best.grade],'fish-best'));
      nodes.push(button('Back to '+(back===notebook?'fish notebook':'catch basket'),back));openPanel(d.name+' · Field guide',nodes);
    }
    function notebook(){
      const p=profile(),ended=state().ended,nodes=[el('p','Eight illustrated Basin species. Read habitats, tackle hints, behaviour and supper notes before casting. Your observations and largest measured catches stay between voyages.'),el('p',p.fishJournal.filter(r=>r.seen).length+' / 8 species observed','fish-kicker')];
      const grid=el('div',undefined,'fish-notebook-grid');for(const [id,d]of Object.entries(F.species)){const r=p.fishJournal.find(r=>r.id===id),card=el('article',undefined,'pastime-card fish-notebook-card');card.append(art(id),el('h3',d.name),el('p',r?.seen?'Observed ✓':'Not yet caught','muted'),el('p',F.lures[d.lure].name+' · '+F.depths[d.depth].name));if(r?.best)card.append(el('p','Best '+length(r.best.lengthMm)+' · '+weight(r.best.weightG),'fish-best'));card.append(button('Read '+d.name,()=>about(id,notebook)));grid.append(card);}nodes.push(grid,button('Harbour catch basket',()=>basket('harbour')),button('Coastal catch basket',()=>basket('coast')),button(ended?'Back to voyage report':'Back to pastimes',ended?api.finishReport:api.hub));openPanel('Captain’s fish notebook',nodes);
    }
    function basket(source='harbour'){
      const s=state(),rows=source==='coast'?s.breakwater?.catches||[]:s.leisure.fishing.catches,nodes=[el('p',source==='coast'?'Your expedition basket allows three catches per night. Share a kept catch with the cooks at Aonami or the Market · Free · 4 min. Coastal catches cannot be sold or used in harbour recipes.':'Your separate catch basket holds three kept fish. Release or share with Nao without extra game time; her counter pays 6 cr once per kept catch.')];
      for(const [i,c]of rows.entries()){const card=el('article',undefined,'pastime-card fish-catch-card');card.append(art(c.id),el('h3',F.species[c.id].name),el('p',stats(c),'fish-catch-stats'),...(c.measure?[el('p',F.lures[c.measure.lure].name+' · '+F.depths[c.measure.depth].name+' · '+c.measure.weather,'muted')]:[]),el('p',c.outcome+' · '+M.time(c.at)),button('Fish information',()=>about(c.id,()=>basket(source))));if(c.outcome==='kept'){
        if(source==='harbour'){card.append(button('Release gently',()=>{if(L.releaseFish(s,i)){changed();basket(source);}},s.ended),button('Share with Nao · Receive 6 cr',()=>{if(L.share(s,i)){changed();basket(source);}},!!L.status(s,'share')));}
        else card.append(button('Share with the cooks · Free · 4 min',()=>{if(B.shareFish(s,i)&&changed())basket(source);},s.ended||!['market','tea-island'].includes(s.docked)||s.clock+4>1800));
      }nodes.push(card);}
      if(!rows.length)nodes.push(el('p','No catches in this basket yet.'));
      nodes.push(button('Captain’s fish notebook',notebook),button(source==='coast'?'Fish the coastal water':'Dockside fishing',()=>fishing(source),!!F.status(s,source)),button(s.ended?'Back to voyage report':'Back to pastimes',s.ended?api.finishReport:api.hub));openPanel(source==='coast'?'Coastal fishing basket':'Catch basket & fish notebook',nodes);
    }
    function reveal(c,source){
      const s=state(),d=F.species[c.id],nodes=[art(c.id,true),el('p','CATCH LANDED · '+(source==='coast'?'OUTER COAST':'HARBOUR'),'fish-kicker'),el('h3',d.name),el('p',stats(c),'fish-catch-stats'),...(c.measure?[el('p',F.lures[c.measure.lure].name+' · '+F.depths[c.measure.depth].name+' · '+c.measure.weather,'muted')]:[]),el('p','Kept in the '+(source==='coast'?'expedition':'harbour catch')+' basket · 4 game min · No credits or freight space used.'),el('p',d.voice+'’s note: '+d.field,'speech'),button('Fish information & supper notes',()=>about(c.id,()=>basket(source)))];
      const best=profile().fishJournal.find(r=>r.id===c.id)?.best;if(c.measure&&best?.lengthMm===c.measure.lengthMm)nodes.splice(4,0,el('p','Your largest recorded '+d.name.toLowerCase(),'fish-best'));
      if(source==='harbour')nodes.push(button('Release gently',()=>{const i=s.leisure.fishing.catches.indexOf(c);if(L.releaseFish(s,i)){changed();fishing(source);}},s.ended));
      nodes.push(button('Another cast',()=>fishing(source),!!F.status(s,source)),button('Catch basket',()=>basket(source)),button('Captain’s fish notebook',notebook),button(s.ended?'Back to voyage report':'Back to pastimes',s.ended?api.finishReport:api.hub));openPanel('A catch worth remembering',nodes);
    }
    function landing(source,assisted=false){const c=F.land(state(),assisted);if(!c){toast(F.status(state(),source)||'Keep a gentle line until the fish is beside the net.');return;}changed();reveal(c,source);}
    function meter(label,value,safe=false){const outer=el('div',undefined,'fishing-meter-wrap'),caption=el('p',label+' · '+Math.round(value)+'%'),track=el('div',undefined,'fishing-meter'+(safe?' fishing-tension':'')),bar=el('span',undefined,'fishing-meter-fill');track.setAttribute('role','progressbar');track.setAttribute('aria-label',label);track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');track.setAttribute('aria-valuenow',String(value));bar.style.width=value+'%';track.append(bar);outer.append(caption,track);return {outer,caption,track,bar};}
    function fishing(source='harbour',focusTackle=null){
      const s=state(),f=s.leisure.fishing,a=F.hydrate(s);let p=a.pending;
      if(p&&p.source!==source){openPanel('One line at a time',[el('p','A '+p.source+' line is already saved. Resume it or pack it before choosing another fishing water.'),button('Resume saved line',()=>fishing(p.source)),button('Pack away the saved line · Free',()=>{F.pack(s);changed();fishing(source);}),button('Back to pastimes',api.hub)]);return;}
      if(p&&!F.active(s)){F.pack(s);changed();p=null;}
      if(!p&&source==='harbour'&&f.pending){p=F.cast(s,source,selectedLure,selectedDepth);if(p)changed();}
      const reason=F.status(s,source),rows=source==='coast'?s.breakwater?.catches||[]:f.catches;
      const water=el('div',undefined,'fishing-water angling-water'),float=el('span','◉','fishing-float');float.setAttribute('aria-hidden','true');water.append(float,el('span',source==='coast'?'OUTER COAST · TERN HOLDING POSITION':(W.ports.find(q=>q.id===s.docked)?.name||'HARBOUR')+' · QUIET WATER','fishing-water-label'));
      let focusControl=null;
      const shadow=el('span',undefined,'fishing-shadow');shadow.setAttribute('aria-hidden','true');shadow.hidden=p?.phase!=='fight';water.append(shadow);
      const nodes=[el('p','Free · 4 game min per landed catch · '+rows.length+' / '+(source==='coast'?3:6)+' catches tonight'),water];
      if(!p){
        nodes.push(el('p','Borrowed tackle, no bait cost. Choose your lure and depth, cast, then read each movement. The bite and every turn wait for you.','muted'));
        for(const [kind,choices]of [['lure',F.lures],['depth',F.depths]]){const group=el('div',undefined,'recipe-options fishing-tackle');group.setAttribute('role','group');group.setAttribute('aria-label','Choose '+kind);group.append(el('h3','Choose '+kind));for(const [id,d]of Object.entries(choices)){const choice=button(d.name,()=>{if(kind==='lure')selectedLure=id;else selectedDepth=id;fishing(source,{kind,id});});if(focusTackle?.kind===kind&&focusTackle.id===id)focusControl=choice;choice.setAttribute('aria-pressed',String((kind==='lure'?selectedLure:selectedDepth)===id));group.append(choice);}nodes.push(group);}
        const available=F.pool(s,source);if(available.length)nodes.push(el('p','Fish reported here: '+available.map(id=>F.species[id].name).join(' · ')),el('p','Your tackle favours: '+(available.filter(id=>F.species[id].lure===selectedLure||F.species[id].depth===selectedDepth).map(id=>F.species[id].name).join(' · ')||'an exploratory cast'),'muted'));
        nodes.push(button(source==='coast'?'Fish the coastal water · Cast the line':'Cast the line',()=>{if(F.cast(s,source,selectedLure,selectedDepth)){changed();fishing(source);}},!!reason,true));
      }else if(p.phase==='waiting'){
        const message=el('p','The float is settling. A bite will stay until you are ready.','fishing-message');message.setAttribute('role','status');const hookButton=button('Waiting for a bite…',()=>{if(F.hook(s)){changed();fishing(source);}},true,true);nodes.push(message,hookButton);
        nodes.push(button('Pack away the line · Free',()=>{F.pack(s);changed();fishing(source);}));
        footer();openPanel(source==='coast'?'Coastal angling':'Dockside fishing',nodes);
        const mine=generation,uid=s.uid,pending=p;
        function settle(){if(generation!==mine||state().uid!==uid||s.angling.pending!==pending||!F.active(s))return;if(document.hidden){timer=setTimeout(settle,500);return;}if(!F.bite(s))return;changed();water.classList.add('bite');message.textContent='A bite! Set the hook when you are ready. No reaction deadline.';hookButton.textContent='Set the hook';hookButton.disabled=false;if(f.relaxed){F.hook(s);landing(source,true);}}
        timer=setTimeout(settle,2200);
        return;
      }else if(p.phase==='bite'){
        water.classList.add('bite');nodes.push(el('p','A bite! Set the hook when you are ready. No reaction deadline.','fishing-message'),button('Set the hook',()=>{if(F.hook(s)){changed();if(f.relaxed)landing(source,true);else fishing(source);}},false,true));
      }else{
        water.classList.add('bite');const title=el('h3'),tell=el('p',undefined,'fishing-tell'),response=el('p','Choose one action for this movement. The game waits for your decision.','fishing-message'),initial=F.metrics(p),tension=meter('Line tension',initial.tension,true),progress=meter('Landing progress',initial.progress),controls=el('div',undefined,'fishing-actions');tell.setAttribute('role','status');response.setAttribute('role','status');nodes.push(title,tell,tension.outer,el('p','Comfort zone: 20–80%. Too tight or too loose gives the fish distance; the rod does not break.','muted'),progress.outer,response,controls);
        const buttons=[];for(const [id,d]of Object.entries(F.actions)){const choice=button(d.name,()=>{const before=F.metrics(p),r=F.move(s,id);if(!r)return;changed();response.textContent=r.mistakes>before.mistakes?'The fish finds some room. Read the next movement and recover your line.':'A patient response. The fish comes closer.';refresh();});choice.title=d.hint;buttons.push(choice);controls.append(choice);}
        const landButton=button('Lift into the landing net · 4 min',()=>landing(source),!initial.done,true),retry=button('Try this cast again · Free',()=>{if(F.restart(s)){changed();fishing(source);}},!initial.exhausted);nodes.push(landButton,retry);
        function refresh(){const r=F.metrics(p),c=F.cues[F.cue(p)];title.textContent=r.done?'Beside the landing net':r.exhausted?'The fish has found some space':c.name;tell.textContent=r.done?'A gentle last lift will finish the catch.':r.exhausted?'Reset this practice fight or pack the line. No time or credits have been spent.':c.text;for(const [m,v]of [[tension,r.tension],[progress,r.progress]]){m.bar.style.width=v+'%';m.track.setAttribute('aria-valuenow',String(v));m.caption.textContent=m===tension?'Line tension · '+v+'%':'Landing progress · '+v+'%';}shadow.style.left=(18+r.progress*.45)+'%';shadow.style.transform='rotate('+(F.cue(p)==='surge'?-8:F.cue(p)==='slack'?8:0)+'deg)';buttons.forEach(n=>{n.disabled=r.done||r.exhausted;});landButton.disabled=!r.done;retry.disabled=!r.exhausted;}
        refresh();focusControl=buttons[0];if(f.relaxed)nodes.push(button('Finish with relaxed assistance · 4 min',()=>landing(source,true)));
      }
      if(p&&p.phase!=='waiting')nodes.push(button('Pack away the line · Free',()=>{F.pack(s);changed();fishing(source);}));
      footer();openPanel(source==='coast'?'Coastal angling':'Dockside fishing',nodes);if(focusControl)focusControl.focus();
      function footer(){const toggle=button('Relaxed mode · '+(f.relaxed?'On · Automatic landing':'Off · Read & reel'),()=>{f.relaxed=!f.relaxed;changed();fishing(source);});toggle.setAttribute('aria-pressed',String(f.relaxed));nodes.push(toggle,button('Catch basket',()=>basket(source)),button('Captain’s fish notebook',notebook),button('Back to pastimes',api.hub));if(reason)nodes.push(el('p',reason,'activity-notice'));}
    }
    return {dispose,fishing,basket,notebook,art,about};
  }
  window.VoyageFishingUI={create};
})();
