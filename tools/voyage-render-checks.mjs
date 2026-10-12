/* Optional native Canvas art inspection; this renders no CSS and launches no browser. */
import {createRequire} from 'node:module';
const {createCanvas,loadImage} = createRequire(import.meta.url)('@napi-rs/canvas');
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {boot} from './voyage-ui-checks.mjs';
const out = process.argv[2];
if (!out) throw Error('Usage: node tools/voyage-render-checks.mjs <output-directory>');
fs.mkdirSync(out, {recursive: true});
const rect=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height});
function layout(r,width=1280,height=720) {
  const phone=width<=750,landscape=phone&&height<=400;
  r.nodes.get('sea').rect=rect(0,0,width,height);
  r.nodes.get('sailing-top').rect=rect(16,16,width-32,120);
  r.nodes.get('sailing-bottom').rect=rect(16,height-90,width-32,74);
  r.nodes.get('touch-pad').rect=rect(16,height-130,120,114);
  r.nodes.get('port').rect=phone&&!landscape?rect(8,height*.22,width-16,height*.78-8):rect(phone?width*.35:width-468,8,phone?width*.65-8:460,height-16);
}
for (const [id, port] of [['market-lights','market'],['canal-lanterns','canal'],['lighthouse-beam','island']]) {
  const r = boot(({state, moor, L}) => {
    moor('metro'); L.acceptPhotos(state, 'yumi'); moor('observatory'); L.acceptPhotos(state, 'mio');
    moor(port); state.docked = null; state.ship.x -= 30;
  }, {canvasFactory: createCanvas});
  layout(r);r.frame(1000); r.click(r.nodes.get('photo-button'));
  r.click(r.find('panel-content','Take photograph'));
  const image = JSON.parse(r.saved.get('neon-tides:voyage:profile:v1')).album[0];
  assert.equal(image.id, id); assert.ok(image.image.length <= 250000);
  const bytes = Buffer.from(image.image.split(',')[1], 'base64');
  const extension = image.image.startsWith('data:image/webp') ? '.webp' : '.png';
  fs.writeFileSync(out + '/' + id + extension, bytes);
  console.log(id + ': ' + bytes.length + ' bytes; actual game scenery rendered.');
}
for (const charm of ['fish','cup','pennant','star','ticket','ribbon','bell','bowl','rope','supper','lantern','dispatch']) {
  const r = boot(({saved,Pr}) => { const p=Pr.create();Pr.hydrate(p);p.charms=[charm];p.look.charm=charm;saved.set('neon-tides:voyage:profile:v1',JSON.stringify(p)); }, {canvasFactory: createCanvas, reduced: true});
  layout(r);r.frame(1000); fs.writeFileSync(out + '/tern-' + charm + '.png', r.nodes.get('sea').native.toBuffer('image/png'));
}
for(const id of ['priya','lam','rin']) {
  const r=boot(({state,moor,H,M})=>{const d=H.rides[id];moor(d.from);M.advance(state,d.opens-state.clock);H.ride(state,id,'board');state.docked=null;state.ship.x+=100;}, {canvasFactory:createCanvas,reduced:true});
  layout(r);r.frame(1000);fs.writeFileSync(out+'/passenger-'+id+'.png',r.nodes.get('sea').native.toBuffer('image/png'));
}
for(const [name,width,height]of [['portrait',390,640],['landscape',740,330]]) {
  const r=boot(()=>{}, {canvasFactory:createCanvas,reduced:true});layout(r,width,height);r.frame(1000);
  assert.equal(r.nodes.get('sea').width,width);assert.equal(r.nodes.get('sea').height,height);
  fs.writeFileSync(out+'/phone-camera-'+name+'.png',r.nodes.get('sea').native.toBuffer('image/png'));
}
const guide=boot(({state,moor})=>{moor('market');state.docked=null;state.ship.x-=20;state.neighbours.practice=true;},{canvasFactory:createCanvas,reduced:true});
layout(guide);guide.frame(1000);assert.equal(guide.nodes.get('dock-guide').hidden,false);
fs.writeFileSync(out+'/gentle-docking-guide.png',guide.nodes.get('sea').native.toBuffer('image/png'));
for(const port of ['tea-island','coast-station']){
 const r=boot(({state,moor,B})=>{state.breakwater={...B.fresh(),chapter:2,menu:'herbs',steps:['packed','trim'],crew:true};moor(port);},{canvasFactory:createCanvas,reduced:true});layout(r);r.frame(1000);fs.writeFileSync(out+'/'+port+'.png',r.nodes.get('sea').native.toBuffer('image/png'));
 r.expedition.chart();const chart=r.nodes.get('panel-content').children.flatMap(n=>[n,...n.children]).find(n=>n.className==='region-chart');assert.ok(chart.native);fs.writeFileSync(out+'/region-chart-'+port+'.png',chart.native.toBuffer('image/png'));
 layout(r,390,640);r.frame(1000);fs.writeFileSync(out+'/phone-'+port+'.png',r.nodes.get('sea').native.toBuffer('image/png'));
}
for(const id of ['kitchen','office','sky']){
 const r=boot(({state,moor,Lantern,M})=>{moor(Lantern.courses[id].quay);Lantern.start(state,id,'relaxed');M.depart(state);},{canvasFactory:createCanvas,reduced:true});layout(r);r.frame(1000);fs.writeFileSync(out+'/lantern-course-'+id+'.png',r.nodes.get('sea').native.toBuffer('image/png'));
}
for(const ending of ['counter','platform']){
 const r=boot(({state,moor,Q})=>{moor('market');Q.start(state);for(const [id,d]of Object.entries(Q.evidence)){moor(d.quay);Q.inspect(state,id);}moor('metro');Q.recover(state);if(ending==='platform'){moor('market');Q.consent(state);}moor(Q.endings[ending].quay);Q.finish(state,ending);},{canvasFactory:createCanvas,reduced:true});layout(r);r.frame(1000);fs.writeFileSync(out+'/crate-supper-'+ending+'.png',r.nodes.get('sea').native.toBuffer('image/png'));
}
const supper=boot(({state,moor,B,S})=>{state.breakwater={...B.fresh(),chapter:3,menu:'herbs',tasting:'brew',steps:['packed','trim','sample','pages','station','home','supper'],notes:['journal'],ending:'kitchen',crew:false};moor('market');S.start(state,['rice','broth'],'station',[]);for(const id of S.required(state.supper.menu)){moor(S.ingredients[id].quay);S.buy(state,id);}moor('coast-station');S.serve(state,'rice');S.serve(state,'broth');},{canvasFactory:createCanvas,reduced:true});layout(supper);supper.frame(1000);fs.writeFileSync(out+'/station-hosted-supper.png',supper.nodes.get('sea').native.toBuffer('image/png'));
const board=boot(({state,moor,B,S,D})=>{state.breakwater={...B.fresh(),chapter:3,menu:'herbs',tasting:'brew',steps:['packed','trim','sample','pages','station','home','supper'],notes:[],ending:'book',crew:false};moor('market');S.start(state,['rice','broth'],'route',['metro','yard']);D.save(state,[...D.supperTasks(state),{kind:'visit',id:'bar'}]);},{canvasFactory:createCanvas,reduced:true});board.expedition.chart();const routeChart=board.nodes.get('panel-content').children.flatMap(n=>[n,...n.children]).find(n=>n.className==='region-chart');assert.ok(routeChart.native);fs.writeFileSync(out+'/evening-itinerary-chart.png',routeChart.native.toBuffer('image/png'));
console.log('Native Canvas photographs, decorations, courses and evening scenery rendered; browser layout remains untested.');

// Decode illustrations from the production craft UI, without emulating browser layout.
const walkCraft=n=>[n,...n.children.flatMap(walkCraft)];
const craft=boot(({moor})=>moor('canal'));craft.context.window.NeonVoyage.craft.tea();craft.click(craft.find('panel-content','Choose Aonami green'));
let image=walkCraft(craft.nodes.get('panel-content')).find(n=>n.className==='craft-art');
const nativeTea=await loadImage(Buffer.from(decodeURIComponent(image.src.split(',')[1])));assert.equal(nativeTea.width,640);
const sheet=createCanvas(1280,620),paint=sheet.getContext('2d');paint.fillStyle='#102c34';paint.fillRect(0,0,1280,620);paint.drawImage(nativeTea,0,0,640,300);
const recover=boot(({state})=>{state.docked=null;state.ship={x:590,y:880,angle:0,speed:0};});
const SM=recover.context.window.VoyageRecoveries;
// Illustrated collection cards are rendered through the same public UI using valid receipts.
const recoveryMoves=id=>{let p={id,moves:[]};for(const target of SM.sites[id].lanes){while(SM.simulate(p).lane!==target)p.moves.push(SM.simulate(p).lane<target?'right':'left');p.moves.push('lower');}while(!SM.simulate(p).done)p.moves.push(SM.simulate(p).tension+24>85?'ease':'lift');return p.moves;};
const collection=boot(({state,moor})=>{moor('market');state.clock=1432;state.recoveries={pending:null,finds:Object.keys(SM.sites).map((id,i)=>({id,moves:recoveryMoves(id),at:1424+i*4,returnedAt:null}))};});collection.context.window.NeonVoyage.craft.salvage();
const objects=walkCraft(collection.nodes.get('panel-content')).filter(n=>n.className==='craft-art');assert.equal(objects.length,3);
for(let i=0;i<objects.length;i++){const native=await loadImage(Buffer.from(decodeURIComponent(objects[i].src.split(',')[1])));assert.equal(native.width,640);paint.drawImage(native,(i+1)%2*640,Math.floor((i+1)/2)*310,640,280);}
fs.writeFileSync(out+'/harbour-craft-illustrations.png',sheet.toBuffer('image/png'));
console.log('Tea tray and three recovery illustrations decoded from production SVG output.');
