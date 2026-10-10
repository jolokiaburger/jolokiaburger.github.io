/* Ghost Tide FM: shared procedural station. No files, network or game-state effects. */
(function(){'use strict';
function start(ctx,destination){
 const nodes=new Set(),sources=new Set();let closed=false,next=ctx.currentTime+.12,step=0;
 const keep=n=>{nodes.add(n);return n;},source=n=>{keep(n);sources.add(n);return n;};
 const out=keep(ctx.createGain());out.gain.setValueAtTime(.0001,ctx.currentTime);out.gain.setTargetAtTime(.6,ctx.currentTime,.8);out.connect(destination);
 const tone=keep(ctx.createBiquadFilter());tone.type='lowpass';tone.frequency.value=980;tone.Q.value=.45;tone.connect(out);
 // Low-pass noise is a continuous bed; slow sine modulation makes long, gentle wave sets.
 const noise=ctx.createBuffer(1,ctx.sampleRate*8,ctx.sampleRate),data=noise.getChannelData(0);let brown=0;
 for(let i=0;i<data.length;i++){brown=(brown+(Math.random()*2-1)*.018)/1.018;data[i]=brown*5;}
 function bed(type,freq,volume,rate,depth){const sea=source(ctx.createBufferSource());sea.buffer=noise;sea.loop=true;const f=keep(ctx.createBiquadFilter());f.type=type;f.frequency.value=freq;f.Q.value=.6;const g=keep(ctx.createGain());g.gain.value=volume;sea.connect(f);f.connect(g);g.connect(out);sea.start();
 const lfo=source(ctx.createOscillator());lfo.type='sine';lfo.frequency.value=rate;const mod=keep(ctx.createGain());mod.gain.value=depth;lfo.connect(mod);mod.connect(g.gain);lfo.start();}
 bed('lowpass',700,.18,.085,.11);bed('bandpass',380,.075,.037,.04);
 function note(t,freq,level,attack,duration,type){const o=source(ctx.createOscillator()),g=keep(ctx.createGain());o.type=type||'sine';o.frequency.value=freq;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(level,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(tone);o.start(t);o.stop(t+duration+.08);o.onended=()=>{o.disconnect();g.disconnect();sources.delete(o);nodes.delete(o);nodes.delete(g);};}
 const beat=60/72,roots=[55,65.406,48.999,58.27];
 function tick(){if(closed||ctx.state!=='running')return;if(next<ctx.currentTime-.5)next=ctx.currentTime+.12;
 while(next<ctx.currentTime+.35){const root=roots[Math.floor(step/16)%roots.length];
 if(step%2===0)note(next,root,.09,.12,1.25,'sine');
 if(step%8===0){note(next,root*2,.025,1.4,beat*7.7,'triangle');note(next,root*2*Math.pow(2,3/12),.022,1.8,beat*7.7,'sine');note(next,root*3,.014,2,beat*7.7,'sine');}
 if(step%16===12)note(next,root*8,.009,.7,3.1,'sine');
 next+=beat;step++;}}
 tick();const timer=setInterval(tick,120);
 return function stop(){if(closed)return;closed=true;clearInterval(timer);out.gain.setTargetAtTime(.0001,ctx.currentTime,.15);
 // Stop even a suspended context's scheduled sources, then disconnect the entire private graph.
 for(const s of sources){try{s.stop(ctx.currentTime+.65);}catch(e){}}
 setTimeout(()=>{for(const n of nodes){try{n.disconnect();}catch(e){}}nodes.clear();sources.clear();},750);};
}
window.NeonGhostRadio={start,bpm:72,name:'Ghost Tide FM'};
})();
