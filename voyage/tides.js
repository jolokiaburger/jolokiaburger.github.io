/* A following stream aids propulsion; quays and stopped boats remain sheltered. */
(function () {
  'use strict';
  const W=window.VoyageWorld,N=window.VoyageNavigation;
  function flow(s,point=s.ship){
    let seed=0;for(const c of s.seed)seed=(seed+c.charCodeAt(0))%4;
    const phase=((s.clock-1420)/60+seed)%4,angle=phase<2?0:Math.PI;
    const sheltered=W.ports.some(p=>Math.hypot(point.x-p.x,point.y-p.y)<120);
    const strength=sheltered?0:.18*Math.abs(Math.sin(phase*Math.PI/2));
    return {angle,strength,name:strength<.025?'Slack water':angle===0?'Flood stream · East':'Ebb stream · West',turn:Math.ceil((2-phase%2)*60)};
  }
  function factor(s,input){if(!input||!Math.hypot(input.x,input.y))return 1;const f=flow(s);return 1+Math.max(0,Math.cos(Math.atan2(input.y,input.x)-f.angle))*f.strength;}
  function draw(ctx,s,now,reduced){
    const phase=reduced?0:now/1400;
    ctx.save();ctx.strokeStyle='#9bd2c03b';ctx.lineWidth=1.4;
    for(let y=420;y<1700;y+=210)for(let x=180;x<W.width-100;x+=250){const f=flow(s,{x,y});if(f.strength<.025||!N.water(x,y,55)||!N.segment({x:x-22,y},{x:x+22,y},35))continue;
      const dx=f.angle===0?1:-1,offset=Math.sin(phase+x)*7;ctx.beginPath();ctx.moveTo(x-19*dx+offset,y);ctx.quadraticCurveTo(x+offset,y-4,x+19*dx+offset,y);ctx.lineTo(x+12*dx+offset,y-5);ctx.moveTo(x+19*dx+offset,y);ctx.lineTo(x+12*dx+offset,y+5);ctx.stroke();
    }ctx.restore();
  }
  window.VoyageTides={flow,factor,draw};
})();
