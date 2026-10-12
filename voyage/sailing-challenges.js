/* Ordered lantern gates use real movement, fuel and the voyage clock. */
(function () {
  'use strict';
  const M = window.VoyageModel, N = window.VoyageNavigation;
  const courses = {
    kitchen: {name: 'Kitchen-window loop', quay: 'bar', par: 48, gates: [{x:1500,y:425},{x:1780,y:450},{x:1810,y:685},{x:1510,y:745},{x:1250,y:680},{x:1320,y:440}]},
    office: {name: 'Western lantern weave', quay: 'landing', par: 49, gates: [{x:575,y:390},{x:650,y:555},{x:555,y:800},{x:390,y:860},{x:170,y:680},{x:315,y:425}]},
    sky: {name: 'Tsukimi starlight turns', quay: 'observatory', par: 42, gates: [{x:2690,y:750},{x:2590,y:930},{x:2680,y:1190},{x:2900,y:1190},{x:2680,y:890},{x:2835,y:830}]}
  };
  const own = (o, k) => Object.hasOwn(o, k), record = o => !!o && typeof o === 'object' && !Array.isArray(o);
  const fresh = () => ({active: null, results: []});
  function hydrate(s) { if (s.lanternRuns === undefined) s.lanternRuns = fresh(); return s.lanternRuns; }
  function valid(s) {
    const r = s.lanternRuns; if (r === undefined) return true;
    if (!record(r) || !Array.isArray(r.results) || r.results.length > 6 || new Set(r.results.map(g => g?.id + ':' + g?.mode)).size !== r.results.length) return false;
    function base(g) { return record(g) && own(courses, g.id) && ['relaxed', 'timed'].includes(g.mode) && typeof g.engine === 'boolean' && typeof g.trim === 'boolean' && [g.started, g.elapsed, g.distance, g.fuel].every(Number.isFinite) && g.started >= 1420 && g.started <= s.clock && g.elapsed >= 0 && g.elapsed <= s.clock - g.started + 1e-6 && g.distance >= 0 && g.distance < 20000 && g.fuel >= 0 && g.fuel < 40; }
    if (!r.results.every(g => base(g) && Number.isFinite(g.at) && g.at >= g.started && g.at <= s.clock && Math.abs(g.at - g.started - g.elapsed) < 1e-6 && g.distance > 0 && Number.isFinite(g.efficiency) && g.efficiency >= 0 && g.efficiency <= 1 && g.grade === grade(g.mode, g.elapsed, g.efficiency, courses[g.id].par))) return false;
    return r.active === null || base(r.active) && Number.isInteger(r.active.gate) && r.active.gate >= 0 && r.active.gate < courses[r.active.id].gates.length && !r.results.some(g => g.id === r.active.id && g.mode === r.active.mode);
  }
  function startStatus(s, id, mode) {
    if (!own(courses, id) || !['relaxed', 'timed'].includes(mode)) return 'Choose a course and mode';
    if (s.ended) return 'This night has ended';
    if (s.docked !== courses[id].quay) return 'Moor at the course’s starting quay';
    if (s.lanternRuns?.active) return 'Finish or close the active run first';
    if (s.lanternRuns?.results.some(g => g.id === id && g.mode === mode)) return 'This mode is complete for tonight';
    const reserve=Math.max(1,Math.ceil(ideal(id)/620*(s.flags.engine?.8:1)*(s.breakwater?.steps.includes('trim')?.9:1)*1.05*10)/10);
    if (s.fuel < reserve) return 'Keep '+reserve.toFixed(1)+' fuel for the run';
    return s.clock + courses[id].par > 1800 ? 'Leave ' + courses[id].par + ' min before 06:00' : '';
  }
  function start(s, id, mode) {
    if (startStatus(s, id, mode)) return false;
    hydrate(s).active = {id, mode, gate: 0, started: s.clock, elapsed: 0, distance: 0, fuel: 0, engine: !!s.flags.engine, trim: !!s.breakwater?.steps.includes('trim')};
    s.track = 'lantern-run'; M.log(s, courses[id].name + ' · ' + (mode === 'timed' ? 'Timed run' : 'Relaxed practice') + '. Cross the numbered gates in order. Normal fuel and sailing time apply; no entry fee or cash reward.'); return true;
  }
  function close(s) { if (!s.lanternRuns?.active) return false; s.lanternRuns.active = null; M.log(s, 'Lantern run closed. Sailing fuel and time already used remain spent; no penalty.'); return true; }
  function touches(a, b, p) { const dx = b.x - a.x, dy = b.y - a.y, d = dx * dx + dy * dy, t = d ? Math.max(0, Math.min(1, ((p.x-a.x)*dx+(p.y-a.y)*dy)/d)) : 0; return Math.hypot(p.x-a.x-dx*t, p.y-a.y-dy*t) <= 40; }
  const distances=new Map(),routes=new Map();
  function ideal(id) { if(distances.has(id))return distances.get(id);const d=courses[id],W=window.VoyageWorld;let p=W.ports.find(p=>p.id===d.quay),n=0,line=[p];for(const g of d.gates){for(const q of N.route(p,g)){n+=Math.hypot(p.x-q.x,p.y-q.y);p=q;line.push(q);}}distances.set(id,n);routes.set(id,line);return n; }
  function grade(mode, elapsed, efficiency, par) { return mode === 'relaxed' ? 'practice' : elapsed <= par && efficiency >= .78 ? 'gold' : efficiency >= .65 ? 'silver' : 'bronze'; }
  const oldValid = M.valid, oldMove = M.move, oldStories = M.stories, oldAdvance=M.advance;
  let moving=false;
  M.advance=(s,minutes)=>{oldAdvance(s,minutes);if(s.ended&&!moving&&s.lanternRuns?.active)close(s);};
  for(const key of ['action','freight','waitFreight']){const original=M[key];M[key]=(s,...args)=>{const result=original(s,...args);if(s.ended&&s.lanternRuns?.active)close(s);return result;};}
  M.valid = s => oldValid(s) && valid(s);
  M.move = (s, input, dt) => {
    const a = {x:s.ship.x,y:s.ship.y}, fuel = s.fuel;let d;moving=true;try{d=oldMove(s,input,dt);}finally{moving=false;}const r = s.lanternRuns?.active;
    if (r && d > 0) {
      r.distance += d; r.fuel += Math.max(0, fuel-s.fuel); r.elapsed = s.clock-r.started;
      r.engine=r.engine||!!s.flags.engine;r.trim=r.trim||!!s.breakwater?.steps.includes('trim');
      if (touches(a,s.ship,courses[r.id].gates[r.gate])) {
        r.gate++;
        if (r.gate === courses[r.id].gates.length) {
          const efficiency = Math.min(1, ideal(r.id)/r.distance), result = {...r, at:s.clock, efficiency, grade:grade(r.mode,r.elapsed,efficiency,courses[r.id].par)}; delete result.gate;
          s.lanternRuns.results.push(result); s.lanternRuns.active = null; M.log(s, courses[r.id].name + ' finished · ' + result.grade + ' · ' + r.elapsed.toFixed(1) + ' min, ' + r.fuel.toFixed(2) + ' fuel. Results are on the lantern board.');
        }
      }
    }
    if (s.ended && s.lanternRuns?.active) close(s);
    return d;
  };
  M.stories = s => [...oldStories(s), ...(s.lanternRuns?.active ? [{id:'lantern-run',title:courses[s.lanternRuns.active.id].name,done:false,to:null,text:'Gate '+(s.lanternRuns.active.gate+1)+' / 6 · '+(s.lanternRuns.active.mode==='relaxed'?'Relaxed practice':'Timed run · sailing clock only')+'. Lantern runs are in Menu.'}] : [])];
  function draw(c, s, phase, reduced) {
    const r = s.lanternRuns?.active; if (!r) return; const gates = courses[r.id].gates;
    ideal(r.id);c.save(); c.lineWidth = 2; c.setLineDash([4,8]); c.strokeStyle = '#bfcfbd66'; c.beginPath(); routes.get(r.id).forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y)); c.stroke(); c.setLineDash([]);
    gates.forEach((p,i)=>{ c.strokeStyle=i<r.gate?'#93bba577':i===r.gate?'#ffd596':'#a4bbbf88'; c.lineWidth=i===r.gate?3:1; c.beginPath();c.arc(p.x,p.y,40,0,Math.PI*2);c.stroke(); c.fillStyle=i===r.gate?'#edb97430':'#173e47';c.beginPath();c.arc(p.x,p.y,13+(i===r.gate&&!reduced?Math.sin(phase*2)*2:0),0,Math.PI*2);c.fill(); c.fillStyle=i<r.gate?'#9ebfab':'#ffe0a7';c.font='bold 15px system-ui';c.textAlign='center';c.fillText(String(i+1),p.x,p.y+5); }); c.restore();
  }
  window.VoyageLanternRuns = {courses, fresh, hydrate, valid, startStatus, start, close, touches, ideal, grade, draw};
})();
