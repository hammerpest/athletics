/* ===== The parents page (A1.29, Aths Opt 1.7) =====
   No PIN and no sign-in. It asks the server for one function, parent_results, which gives only what parents may see
   (nothing unless the organiser has turned the page on). The results are worked out here with the same engine as the
   app (js/engine.js). With no project set up, or with ?mode=local, it reads this browser's test data instead. */
(function(){
const C=window.ATHS_CONFIG||{};
const Q=new URLSearchParams(location.search);
const LOCAL=Q.get("mode")==="local"||!C.url||!C.key;
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const hdot=h=>`<span class="hdot h${esc(h||"")}">${esc(h||"?")}</span>`;
const medal=(p,tie)=>`<span class="medal m${Math.min(p,4)}">${tie?"=":""}${p}</span>`;
const placeCell=(p,tie)=>!p?"&ndash;":p<=3?medal(p,tie):`<span style="font-weight:800;min-width:32px;text-align:center;display:inline-block">${tie?"=":""}${p}</span>`;
function shortName(n){n=n.replace(/^Test: /,"").trim();const w=n.split(/\s+/);return w.length<2?(n?n[0]+".":""):w[0]+" "+w[w.length-1][0]+"."}
const pname=p=>p?(p.team?p.name:((p.f||"")+" "+(p.s||"")).trim()):"";
const fmtPts=n=>(Math.round(n*100)/100).toLocaleString("en-AU");
const SHOW0={house:true,age:true,events:true,find:true,champs:true,records:false,program:true};
const TABS=[["house","House points"],["age","By age"],["events","Event results"],["find","Find a student"],["champs","Age champions"],["records","Records"],["program","What is on"]];
let D=null,R=null,have="",tab=null,view="all",findQ="",openKeys=new Set(),timer=null;

/* ---- data ---- */
async function fetchLive(){
  const r=await fetch(C.url+"/rest/v1/rpc/parent_results",{method:"POST",headers:{apikey:C.key,"Content-Type":"application/json"},body:JSON.stringify({have})});
  if(!r.ok)throw new Error("status "+r.status);
  return r.json();
}
/* test mode: the same shape the server gives, from the data this browser keeps (names follow the organiser's choice) */
function fetchLocal(){
  const mem={};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith("aths_db:"))mem[k.slice(8)]=JSON.parse(localStorage.getItem(k))}}catch(e){}
  const cfg=mem["config/main"];
  if(!cfg||!cfg.parents)return {off:true};
  const namesOn=cfg.parentsNames==="short",prov=!!cfg.parentsProv;
  const col=p=>Object.keys(mem).filter(k=>k.startsWith(p+"/")).map(k=>Object.assign({_id:k.slice(p.length+1)},mem[k]));
  const map=(p,keep)=>Object.fromEntries(col(p).filter(keep||(()=>true)).map(d=>[d._id,d]));
  const stud=[].concat((mem["roster/F"]||{}).students||[],(mem["roster/M"]||{}).students||[],col("extras")).map(s=>({id:s.id,f:namesOn?(s.f||"Student"):"Student",s:namesOn&&s.s?s.s[0]+".":"",h:s.h,x:s.x,g:s.g}));
  const c=Object.assign({},cfg);delete c.pins;delete c.chief;delete c.runId;
  const recs=((mem["records/all"]||{}).list||[]).map(r=>Object.assign({},r,{holders:(r.holders||[]).map(h=>Object.assign({},h,{n:namesOn?shortName(String(h.n||"")):"A student"}))}));
  return {v:"local-"+Date.now(),config:c,heats:col("heats").filter(h=>h.race),times:map("times",d=>prov||d.checked),finish:map("finish"),
    field:map("field",d=>prov||d.final),records:recs,students:stud};
}
async function load(){
  let d;
  try{d=LOCAL?fetchLocal():await fetchLive()}catch(e){if(!D){$("pmain").innerHTML=`<div class="pcard poff"><h2>Could not load the results</h2><p class="muted" style="margin:0">Check your connection. This page tries again every minute.</p></div>`;setStatus("No connection")}else setStatus("No connection. Showing the last results.");return}
  if(d.off){D=null;R=null;render();return}
  if(d.same){setStatus(null);return}
  have=d.v;D=d;
  const S={config:d.config,students:d.students||[],heats:(d.heats||[]).filter(h=>h&&h.race),times:d.times||{},finish:d.finish||{},slips:{},field:d.field||{},records:d.records||[],openGroups:new Set()};
  try{R=compute(S)}catch(e){R=null}
  render();
  setStatus(null);
}
function setStatus(msg){
  const el=$("pupd");
  if(msg){el.hidden=false;el.textContent=msg;return}
  if(!D){el.hidden=true;return}
  el.hidden=false;el.textContent="Updated "+new Date(Date.now()).toLocaleTimeString("en-AU",{hour:"numeric",minute:"2-digit"});
}

/* ---- screens ---- */
const showOf=()=>Object.assign({},SHOW0,(D&&D.config&&D.config.parentsShow)||{});
const namesOn=()=>!!D&&!!D.config&&D.config.parentsNames==="short";
function tabsOn(){
  const s=showOf();
  return TABS.filter(([k])=>s[k]&&!(k==="find"&&!namesOn())&&!(k==="records"&&!(R&&R.broken&&R.broken.length)));
}
function statusChip(){
  const n=R.events.length,k=R.finalCount;
  return k>=n&&n?`<span class="chip final">Final, all ${n} events in</span>`:`<span class="chip prov">Provisional, ${k} of ${n} events in</span>`;
}
function houseTab(){
  const max=Math.max(1,...R.houseRank.map(h=>h.total));
  return R.houseRank.map((h,i)=>`<div class="hcard h${h.c}"><div class="row" style="justify-content:space-between">${medal(i+1)}<span class="htag">${hdot(h.c)}<b>${esc(h.n)}</b></span></div>
    <span class="pts">${fmtPts(h.total)}</span><div class="barw"><div class="bar" style="width:${Math.round(h.total/max*100)}%"></div></div></div>`).join("");
}
function ageTab(){
  const rows=AGE_GROUPS.map(a=>`<tr><td>${esc(grpName(a))}</td>${HOUSES.map(h=>`<td class="num">${fmtPts(R.house[h.c].byAge[a])}</td>`).join("")}</tr>`).join("");
  return `<div class="pcard"><h3>Points by age group</h3><div class="tablewrap"><table><thead><tr><th>Age group</th>${HOUSES.map(h=>`<th class="num">${hdot(h.c)}</th>`).join("")}</tr></thead><tbody>${rows}
    <tr><td>Relays</td>${HOUSES.map(h=>`<td class="num">${fmtPts(R.house[h.c].relay)}</td>`).join("")}</tr>
    <tr><td><b>Total</b></td>${HOUSES.map(h=>`<td class="num"><b>${fmtPts(R.house[h.c].total)}</b></td>`).join("")}</tr></tbody></table></div>
    <span class="pnote">Girls and boys together. Relays count for houses only.</span></div>`;
}
function groupsWithResults(){
  const out=[];
  for(const e of R.events){
    const G=R.groups.get(e.key);if(!G)continue;
    const rows=G.rows.filter(r=>r.place);
    if(!rows.length)continue;
    if(view==="F"&&e.x!=="F"||view==="M"&&e.x!=="M")continue;
    if(view==="track"&&G.field||view==="field"&&!G.field)continue;
    out.push(G);
  }
  return out.sort((a,b)=>(b.checkedAt||0)-(a.checkedAt||0));
}
function groupBody(G){
  const rows=G.rows.filter(r=>r.place).map(r=>{
    const val=G.field?resultText(G,r):(r.eff!=null?fmtTime(r.eff):(r.st||""));
    return `<div class="prow">${placeCell(r.place,r.tie)}<span class="nm">${namesOn()||(r.p&&r.p.team)?esc(pname(r.p)):""} ${hdot(r.p&&r.p.h)}</span><span class="vv">${esc(val)}</span></div>`}).join("");
  return `<div class="pbody">${rows}</div>`;
}
function eventsTab(){
  const gs=groupsWithResults();
  const f=[["all","All"],["F","Girls"],["M","Boys"],["track","Track"],["field","Field"]].map(([k,l])=>`<button type="button" data-view="${k}" aria-pressed="${view===k}">${l}</button>`).join("");
  return `<div class="pfilter">${f}</div>`+(gs.length?gs.map(G=>`<details class="pgroup" data-key="${esc(G.key)}" ${openKeys.has(G.key)||gs.length<=3?"open":""}><summary>${esc(G.label)}<span class="chip ${G.final?"final":"prov"}">${esc(G.status)}</span></summary>${groupBody(G)}</details>`).join(""):`<div class="pcard muted">No results yet.</div>`);
}
function findTab(){
  const q=findQ.trim().toLowerCase();
  let body=`<div class="pcard muted">Type at least 2 letters of a first name.</div>`;
  if(q.length>=2){
    const all=(D.students||[]).filter(s=>(pname(s)).toLowerCase().includes(q));const hits=all.slice(0,12);
    body=hits.length?hits.map(s=>{
      const res=[];
      for(const e of R.events){const G=R.groups.get(e.key);if(!G)continue;const r=G.rows.find(x=>x.p&&x.p.id===s.id&&x.place);if(r)res.push({G,r})}
      return `<div class="pcard"><div class="row" style="justify-content:space-between"><span class="htag">${hdot(s.h)}<b>${esc(pname(s))}</b></span><span class="chip">${esc(houseName(s.h))}</span></div>
        ${res.length?res.map(({G,r})=>`<div class="prow">${placeCell(r.place,r.tie)}<span class="nm">${esc(G.label)}</span><span class="vv">${esc(G.field?resultText(G,r):fmtTime(r.eff))}</span></div>`).join(""):`<span class="pnote">No results yet.</span>`}</div>`}).join(""):`<div class="pcard muted">Nobody found. Try the first name.</div>`;
    if(all.length>12)body+=`<span class="pnote">Showing the first 12 of ${all.length}. Type more letters.</span>`;
  }
  return `<label class="pfind"><span class="label">Find a student</span><input type="search" id="pfq" placeholder="Type a first name" value="${esc(findQ)}" autocomplete="off" aria-label="Find a student"></label>${body}`;
}
function champsTab(){
  return AGE_GROUPS.map(a=>{
    const rows=["F","M"].map(x=>{const c=R.champs[a+"|"+x];
      const line=(p,v)=>`<div class="prow">${medal(p)}<span class="nm">${namesOn()?esc(pname(v.p)):"A student"} <span class="muted">(${sexName(x)})</span></span>${hdot(v.p.h)}</div>`;
      return c&&c.winners.length?c.winners.map(v=>line(1,v)).join("")+c.runners.map(v=>line(2,v)).join(""):`<div class="prow"><span></span><span class="muted">${sexName(x)}: no points yet</span><span></span></div>`}).join("");
    return `<div class="pcard"><b style="font-family:var(--font-display)">${esc(grpName(a))}</b>${rows}</div>`}).join("")
    +`<span class="pnote">Most points, counting only 1st, 2nd and 3rd place. Relays do not count. Joint champions have no runner up.</span>`;
}
function recordsTab(){
  return R.broken.map(G=>`<div class="pcard"><b>${esc(G.label)}</b>${G.recordNote.rows.map(r=>`<div class="prow"><span>${G.recordNote.kind==="new"?"New":"Equal"}</span><span class="nm">${namesOn()?esc(pname(r.p)):"A student"} ${hdot(r.p.h)}</span><span class="vv">${esc(resultText(G,r))}</span></div>`).join("")}</div>`).join("");
}
function programTab(){
  const blk=blockNow(R);
  const now=R.fgroups.filter(f=>blk!=null&&f.block===blk&&!R.isFinal(f.key));
  const field=now.length?`<div class="pcard"><h3>Field events on now</h3>${now.map(f=>`<div class="prow"><span></span><span class="nm">${esc((R.stations.find(s=>s.id===f.station)||{}).name||"")} ${esc(grpName(f.g))} ${esc(sexName(f.x))}</span><span class="muted">${esc(f.at||"")}</span></div>`).join("")}</div>`:`<div class="pcard muted">No field events are running right now.</div>`;
  const tt=(R.cfg.timetable||[]);
  const track=tt.length?`<div class="pcard"><h3>Track program</h3>${tt.slice(0,24).map(t=>`<div class="prow"><b>${esc(t.at||"")}</b><span class="nm">${esc(((eventOf(R.cfg,t.k)||{}).name)||t.k)} ${esc(t.x==="FM"?"":sexName(t.x))}</span><span></span></div>`).join("")}</div>`:"";
  return field+track;
}
/* a soft fade on the right edge tells a parent there are more tabs to scroll to */
function hint(row){if(row)row.classList.toggle("more",row.scrollWidth>row.clientWidth+row.scrollLeft+4)}
document.addEventListener("scroll",e=>{if(e.target&&e.target.classList&&e.target.classList.contains("ptabs"))hint(e.target)},true);
/* Aths Opt 2.2: the ticker under the brand bar (decorative, hidden from screen readers) */
function pTicker(c){
  const t=$("ptick");if(!t)return;let day="";
  if(c&&c.date){const d=new Date(c.date+"T00:00:00");if(!isNaN(d))day=d.toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
  const words=[(c&&c.name)||"Athletics Carnival",c&&c.venue,day,"Results for parents","Bradman","Jackson","Newcombe"].filter(Boolean);
  const html=`<div>${words.map(w=>esc(w)+" &nbsp;/&nbsp; ").join("")}</div>`;
  if(t.dataset.w!==html){t.dataset.w=html;t.innerHTML=html}
}
function render(){
  const main=$("pmain");
  if(!D||!R){main.innerHTML=`<div class="pcard poff"><h2>Results will be here on the day</h2><p class="muted" style="margin:0">The school has not turned the results page on yet. Check back during the carnival.</p></div>`;$("ptitle").innerHTML=`Athletics <span class="y">Carnival</span>`;pTicker(null);setStatus(null);return}
  /* Aths Opt 2.2 (the swimming S1.46 look): big heading with the last word yellow, and the ticker */
  {const t=String(R.cfg.name||"Athletics Carnival").trim().split(/\s+/),last=t.pop();$("ptitle").innerHTML=(t.length?esc(t.join(" "))+" ":"")+`<span class="y">${esc(last)}</span>`;}
  pTicker(R.cfg);
  const tabs=tabsOn();
  if(!tabs.length){main.innerHTML=`<div class="pcard poff"><h2>Nothing to show yet</h2></div>`;return}
  if(!tab||!tabs.some(t=>t[0]===tab))tab=tabs[0][0];
  const tabBar=`<div class="ptabs" role="tablist">${tabs.map(([k,l])=>`<button type="button" role="tab" data-tab="${k}" aria-pressed="${tab===k}">${l}</button>`).join("")}</div>`;
  const body={house:()=>statusChip()+`<div class="stack">${houseTab()}</div>`,age:()=>statusChip()+ageTab(),events:()=>statusChip()+eventsTab(),find:()=>statusChip()+findTab(),champs:()=>statusChip()+champsTab(),records:recordsTab,program:programTab}[tab]();
  const foot=`<span class="pnote">Only what the school has turned on is shown. Times can change until a group is final.</span>`;
  const keepFocus=document.activeElement&&document.activeElement.id==="pfq";
  const oldTabs=main.querySelector(".ptabs");const keepLeft=oldTabs?oldTabs.scrollLeft:0;
  main.innerHTML=tabBar+body+foot;
  const row=main.querySelector(".ptabs");if(row){row.scrollLeft=keepLeft;const on=row.querySelector('[aria-pressed="true"]');if(on){const l=on.offsetLeft,r=l+on.offsetWidth;if(l<row.scrollLeft)row.scrollLeft=l-8;else if(r>row.scrollLeft+row.clientWidth)row.scrollLeft=r-row.clientWidth+8}hint(row)}
  if(keepFocus){const i=$("pfq");i.focus();i.setSelectionRange(i.value.length,i.value.length)}
}
document.addEventListener("click",e=>{
  const t=e.target.closest("[data-tab]");if(t){tab=t.dataset.tab;render();return}
  const v=e.target.closest("[data-view]");if(v){view=v.dataset.view;render();return}
});
document.addEventListener("input",e=>{if(e.target.id==="pfq"){findQ=e.target.value;render()}});
document.addEventListener("toggle",e=>{const d=e.target;if(d&&d.classList&&d.classList.contains("pgroup")){if(d.open)openKeys.add(d.dataset.key);else openKeys.delete(d.dataset.key)}},true);
load();
timer=setInterval(()=>{if(!document.hidden)load()},60000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)load()});
window.__parents={load,get tab(){return tab},get D(){return D},get R(){return R}};
})();
