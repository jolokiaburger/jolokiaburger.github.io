/* Pure sailing and assisted routing; no DOM or clock side effects. */
(function(){'use strict';const W=window.VoyageWorld,R=14;
function water(x,y,padding){const r=padding||R;return x>=r&&y>=r&&x<=W.width-r&&y<=W.height-r&&!W.land.some(a=>x>a.x-r&&x<a.x+a.w+r&&y>a.y-r&&y<a.y+a.h+r);}
function segment(a,b,padding){const d=Math.hypot(b.x-a.x,b.y-a.y),n=Math.max(1,Math.ceil(d/7));for(let i=0;i<=n;i++)if(!water(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,padding))return false;return true;}
function route(start,end){if(!water(end.x,end.y))return [];
 if(segment(start,end,42))return [end];const grid=40,cols=Math.ceil(W.width/grid),rows=Math.ceil(W.height/grid);
 const cells=new Map(),queue=[];let origin=null,finish=null,ds=Infinity,de=Infinity;
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const p={x:x*grid+20,y:y*grid+20,key:y*cols+x};if(!water(p.x,p.y,42))continue;cells.set(p.key,p);const a=Math.hypot(p.x-start.x,p.y-start.y),b=Math.hypot(p.x-end.x,p.y-end.y);if(a<ds&&segment(start,p)){origin=p;ds=a;}if(b<de&&segment(p,end,42)){finish=p;de=b;}}
 if(!origin||!finish)return [];queue.push(origin.key);const prev=new Map([[origin.key,null]]);
 for(let at=0;at<queue.length;at++){const key=queue[at];if(key===finish.key)break;const p=cells.get(key);for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const key2=key+dx+dy*cols,q=cells.get(key2);if(!q||Math.abs(p.x-q.x)+Math.abs(p.y-q.y)!==grid||prev.has(key2)||!segment(p,q,42))continue;prev.set(key2,key);queue.push(key2);}}
 if(!prev.has(finish.key))return [];const path=[end];let key=finish.key;while(key!==null){path.unshift(cells.get(key));key=prev.get(key);}let out=[],anchor=start;
 while(path.length){let far=0;for(let i=0;i<path.length;i++)if(segment(anchor,path[i],42))far=i;const next=path[far];out.push(next);anchor=next;path.splice(0,far+1);}return out;
}
function step(ship,input,dt,boost){dt=Math.max(0,Math.min(dt,.05));const length=Math.hypot(input.x,input.y);let target=length?Math.atan2(input.y,input.x):ship.angle;
 let turn=((target-ship.angle+Math.PI*3)%(Math.PI*2))-Math.PI;ship.angle+=Math.max(-3.8*dt,Math.min(3.8*dt,turn));
 const wanted=length?86*(boost?1.15:1):0;ship.speed+=(wanted-ship.speed)*Math.min(1,dt*4.5);if(ship.speed<.6)ship.speed=0;
 const dx=Math.cos(ship.angle)*ship.speed*dt,dy=Math.sin(ship.angle)*ship.speed*dt;
 if(segment(ship,{x:ship.x+dx,y:ship.y+dy})){ship.x+=dx;ship.y+=dy;return Math.hypot(dx,dy);}
 ship.speed=0;return 0;
}
window.VoyageNavigation={water,segment,route,step};})();
