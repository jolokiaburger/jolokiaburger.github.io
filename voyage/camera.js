/* The camera may look beyond the world edge so controls never pin the ferry underneath them. */
(function(){'use strict';
function viewport(width,height,top,bottom,right){const left=12,t=Math.max(12,top+12),b=Math.min(height-12,bottom-12),r=Math.min(width-12,right-12);return {left,top:t,right:Math.max(left+1,r),bottom:Math.max(t+1,b)};}
function follow(camera,ship,focus,area,scale,snap){const cx=(area.left+area.right)/2,cy=(area.top+area.bottom)/2,weight=focus?.28:0,target={x:ship.x+(focus?focus.x-ship.x:0)*weight-cx/scale,y:ship.y+(focus?focus.y-ship.y:0)*weight-cy/scale},ease=snap?1:.08;
 let x=camera.x+(target.x-camera.x)*ease,y=camera.y+(target.y-camera.y)*ease;
 // Apply a hard safety bound after smoothing, including the first frame after resize or zoom.
 const fx=focus?focus.x:ship.x,fy=focus?focus.y:ship.y,pad=Math.max(0,Math.min(64,(area.right-area.left)/4,(area.bottom-area.top)/4,((area.right-area.left)-Math.abs(fx-ship.x)*scale)/2,((area.bottom-area.top)-Math.abs(fy-ship.y)*scale)/2));
 x=Math.max(Math.max(ship.x,fx)-(area.right-pad)/scale,Math.min(Math.min(ship.x,fx)-(area.left+pad)/scale,x));
 y=Math.max(Math.max(ship.y,fy)-(area.bottom-pad)/scale,Math.min(Math.min(ship.y,fy)-(area.top+pad)/scale,y));
 return {x,y,scale};}
window.VoyageCamera={viewport,follow};
})();
