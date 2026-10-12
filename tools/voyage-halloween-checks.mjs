/* Opt-in theme persistence, audio independence and native high-resolution artwork. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {boot} from './voyage-ui-checks.mjs';
let createCanvas;try{({createCanvas}=createRequire(import.meta.url)('@napi-rs/canvas'));}catch(e){}
const walk=n=>[n,...n.children.flatMap(walk)];
const KEY='neon-tides:voyage:halloween:v1';
let checks=0;const check=(v,m)=>{assert.ok(v,m);checks++;};
function toggle(ui,value){ui.key('m');const input=walk(ui.nodes.get('panel-content')).find(n=>n.type==='checkbox'&&n['aria-label']==='Halloween mode');check(!!input,'native labelled checkbox available');input.checked=value;input.listeners.change();return input;}
let ui=boot();const before=JSON.stringify(ui.current()),profile=ui.saved.get('neon-tides:voyage:profile:v1');check(!ui.context.document.body.classList.contains('halloween-theme'),'default is ordinary harbour');toggle(ui,true);check(ui.context.document.body.classList.contains('halloween-theme'),'checkbox enables theme');check(JSON.parse(ui.saved.get(KEY)).enabled,'choice persists separately');check(JSON.stringify(ui.current())===before,'theme does not mutate gameplay');check(ui.saved.get('neon-tides:voyage:profile:v1')===profile,'profile unaffected');check(ui.saved.get('neon-tides:save:v1')==='classic-unchanged','Classic untouched');check(ui.nodes.get('radio-button').textContent.startsWith('Radio · Off'),'theme works without audio');
ui.nodes.get('radio-button').onclick();ui.click(ui.find('panel-content','Radio off'));check(ui.context.document.body.classList.contains('halloween-theme'),'turning radio off preserves theme');toggle(ui,false);check(!ui.context.document.body.classList.contains('halloween-theme'),'unchecked restores normal appearance');
for(const raw of ['null','{','{"enabled":"true"}','{"enabled":false}','[]']){ui=boot(({saved})=>saved.set(KEY,raw));check(!ui.context.document.body.classList.contains('halloween-theme'),'malformed or false preference defaults off');}
ui=boot(({saved})=>saved.set(KEY,'{"enabled":true}'));check(ui.context.document.body.classList.contains('halloween-theme'),'saved choice restored');const H=ui.context.window.VoyageHalloween;check(!H.load({getItem(){throw Error('blocked');}}),'storage read failure safe');check(!H.save({setItem(){throw Error('blocked');}},true),'storage write failure reported');
ui.context.localStorage.setItem=()=>{throw Error('blocked');};toggle(ui,false);check(!ui.context.document.body.classList.contains('halloween-theme'),'storage failure still permits session toggle');check(ui.nodes.get('toast').textContent.includes('only in this tab'),'honest persistence notice');
const out=process.argv[2];if(out)fs.mkdirSync(out,{recursive:true});
const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
if(createCanvas){
for(const [id,port] of [['home','bar'],['canal','canal'],['coast','tea-island']]){
 const r=boot(({state,moor,B,saved})=>{if(port==='tea-island')state.breakwater={...B.fresh(),chapter:2,menu:'herbs',steps:['packed','trim']};moor(port);saved.set(KEY,'{"enabled":true}');},{canvasFactory:createCanvas,reduced:true});
 r.nodes.get('sea').rect=rect(0,0,1280,720);r.nodes.get('sailing-top').rect=rect(16,16,380,100);r.nodes.get('sailing-bottom').rect=rect(16,650,800,60);r.nodes.get('touch-pad').rect=rect(16,570,150,110);r.nodes.get('port').rect=rect(812,8,460,700);r.frame(1000);const themed=r.nodes.get('sea').native.toBuffer('image/png');r.frame(2000);check(themed.equals(r.nodes.get('sea').native.toBuffer('image/png')),'reduced-motion artwork remains still');toggle(r,false);r.nodes.get('panel-close').onclick();r.frame(3000);check(!themed.equals(r.nodes.get('sea').native.toBuffer('image/png')),'theme changes actual harbour pixels');if(out)fs.writeFileSync(out+'/halloween-'+id+'.png',themed);
}
const c=createCanvas(1920,660),ctx=c.getContext('2d');H.preview(ctx,1920,660);check(ctx.getImageData(0,0,1,1).data[3]===255,'high-resolution preview fills its canvas');if(out)fs.writeFileSync(out+'/halloween-preview.png',c.toBuffer('image/png'));
}else if(out)throw Error('Native rendering requires @napi-rs/canvas.');
console.log('Passed '+checks+' Halloween preference, integration and native-art checks; browser CSS and phone QA remain separate.');
