/* Persistent expedition memories; no automatic cash or job completion. */
(function(){'use strict';
 const P=window.VoyageProfile,B=window.VoyageBreakwater;
 const valid=P.valid,hydrate=P.hydrate,record=P.record;
 const fresh=()=>({chapters:[],notes:[],menu:null,ending:null,completed:false});
 P.valid=p=>valid(p)&&(p.breakwater===undefined||p.breakwater&&Array.isArray(p.breakwater.chapters)&&new Set(p.breakwater.chapters).size===p.breakwater.chapters.length&&p.breakwater.chapters.every(n=>[1,2,3].includes(n))&&Array.isArray(p.breakwater.notes)&&new Set(p.breakwater.notes).size===p.breakwater.notes.length&&p.breakwater.notes.every(n=>['inlet','leaf','journal','signal'].includes(n))&&(p.breakwater.menu===null||Object.hasOwn(B.menus,p.breakwater.menu))&&(p.breakwater.ending===null||Object.hasOwn(B.endings,p.breakwater.ending))&&typeof p.breakwater.completed==='boolean'&&(!p.breakwater.completed||p.breakwater.chapters.includes(3)&&p.breakwater.ending));
 P.hydrate=p=>{hydrate(p);if(p.breakwater===undefined)p.breakwater=fresh();return p;};
 P.syncBreakwater=(p,s)=>{P.hydrate(p);if(!s.breakwater)return;const b=s.breakwater,h=p.breakwater;for(const n of b.notes)if(!h.notes.includes(n))h.notes.push(n);h.menu=b.menu;for(let n=1;n<b.chapter;n++)if(!h.chapters.includes(n))h.chapters.push(n);if(B.ready(s)&&!h.chapters.includes(b.chapter))h.chapters.push(b.chapter);if(b.steps.includes('supper')){h.completed=true;h.ending=b.ending;}};
 P.record=(p,s)=>{const result=record(p,s);if(result)P.syncBreakwater(p,s);return result;};
})();
