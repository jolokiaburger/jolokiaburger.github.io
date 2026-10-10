/* Optional ferry and weather sound bus, independent of the radio. */
(function(){'use strict';
function create(ctx,destination){const nodes=new Set(),sources=new Set(),bus=ctx.createGain();nodes.add(bus);bus.gain.value=0;bus.connect(destination);let enabled=false;
 const keep=n=>{nodes.add(n);return n;},source=n=>{keep(n);sources.add(n);return n;};
 const noise=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
 function texture(type,freq){const s=source(ctx.createBufferSource());s.buffer=noise;s.loop=true;const f=keep(ctx.createBiquadFilter());f.type=type;f.frequency.value=freq;f.Q.value=.4;const g=keep(ctx.createGain());g.gain.value=0;s.connect(f);f.connect(g);g.connect(bus);s.start();return g;}
 const wake=texture('lowpass',560),wind=texture('lowpass',420),rain=texture('bandpass',850),engine=source(ctx.createOscillator()),hum=keep(ctx.createGain());engine.type='sine';engine.frequency.value=42;hum.gain.value=0;engine.connect(hum);hum.connect(bus);engine.start();
 function enable(on,volume){enabled=!!on;bus.gain.setTargetAtTime(enabled?volume:0,ctx.currentTime,.12);}
 function update(s,w,sailing){const moving=sailing&&!s.docked&&!s.ended&&s.fuel>0,ratio=moving?Math.min(1,s.ship.speed/99):0,t=ctx.currentTime;engine.frequency.setTargetAtTime(42+ratio*22,t,.25);hum.gain.setTargetAtTime(.022*ratio,t,.2);wake.gain.setTargetAtTime(.025*ratio,t,.25);wind.gain.setTargetAtTime(.009+w.mist*.007+w.rain*.006,t,1.2);rain.gain.setTargetAtTime(w.rain*.016,t,1.2);}
 function cue(kind){if(!enabled||ctx.state!=='running'||!['depart','moor'].includes(kind))return false;const t=ctx.currentTime;
 function tone(freq,peak,seconds,attack){const o=source(ctx.createOscillator()),g=keep(ctx.createGain());o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+seconds);o.connect(g);g.connect(bus);o.start(t);o.stop(t+seconds+.05);o.onended=()=>{o.disconnect();g.disconnect();nodes.delete(o);nodes.delete(g);sources.delete(o);};}
 if(kind==='depart'){tone(126,.025,.85,.18);tone(189,.006,.9,.2);}else{tone(342,.009,1.1,.03);tone(513,.004,1.3,.03);}return true;}
 function stop(){enable(false,0);for(const s of sources){try{s.stop(ctx.currentTime+.3);}catch(e){}}setTimeout(()=>{for(const n of nodes){try{n.disconnect();}catch(e){}}nodes.clear();sources.clear();},400);}
 return {enable,update,cue,stop};
}
window.VoyageSound={create};
})();
