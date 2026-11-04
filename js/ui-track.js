/* ===== Track Marshal and Place Judge ===== */
function groupChoices(ev){
  if(!ev)return AGE_GROUPS.map(g=>({g,l:grpName(g)}));
  return groupsOf(ev).map(g=>({g,l:grpName(g)}));
}
function eligible(ev,x,g){
  if(ev.relay)return TEAMS.map(id=>({id,team:true,name:houseName(id[2]),h:id[2]}));
  let list=students().filter(s=>s.x===x);
  if(ev.gk==="age")list=list.filter(s=>s.g===g);
  return list.slice().sort((a,b)=>(a.s+" "+a.f).localeCompare(b.s+" "+b.f));
}
function mEv(){return eventOf(A.cfg,A.m.k)}
function mMissing(){
  const m=A.m,ev=mEv();const miss=[];
  if(!ev)miss.push("the race");
  if(!m.x)miss.push("boys or girls");
  if(!m.g)miss.push(ev&&ev.gk!=="age"?"the group":"the age");
  return miss;
}
/* a race cancelled as not run frees its runners to be marshalled again */
function usedInGroup(){
  const m=A.m;const key=groupKey(m.k,m.x,m.g);const used=new Set();
  for(const h of A.heats)if(!h.cancelled&&groupKey(h.k,h.x,h.g)===key)for(const l in (h.lanes||{}))if(h.lanes[l])used.add(h.lanes[l]);
  return used;
}
function heatsSentFor(key){return Math.max(0,...A.heats.filter(h=>!h.cancelled&&groupKey(h.k,h.x,h.g)===key).map(h=>Number(h.heat)||0))}

function renderMarshal(){
  const m=A.m;
  if(m.phase==="lanes")return renderMarshalLanes();
  if(m.phase==="edit")return renderMarshalEdit();
  const types=trackEvents(A.cfg);const ev=mEv();const miss=mMissing();const showMiss=m.showMiss;
  const row=(id,title,inner,isMiss)=>`<div class="mrow ${showMiss&&isMiss?"miss":""}" id="${id}"><span class="label">${title}</span><div class="choices">${inner}</div></div>`;
  const raceBtns=types.map(x=>`<button type="button" class="choice" data-act="mpick" data-f="k" data-v="${esc(x.k)}" aria-pressed="${m.k===x.k}">${esc(x.name)}</button>`).join("");
  const sexBtns=[["F","Girls"],["M","Boys"]].map(([v,l])=>`<button type="button" class="choice" data-act="mpick" data-f="x" data-v="${v}" aria-pressed="${m.x===v}">${l}</button>`).join("");
  const gBtns=groupChoices(ev).map(c=>`<button type="button" class="choice" data-act="mpick" data-f="g" data-v="${c.g}" aria-pressed="${m.g===c.g}">${esc(c.l)}</button>`).join("");
  const name=!miss.length?groupLabel(ev,m.x,m.g):"";
  const note=!ev?"":ev.relay?"One team per house. Pick the house for each lane; no names.":ev.run==="multi"?"No lanes. The person with the multitimer enters the names and times this race on a phone.":"";
  return `${lockBar()}<div class="stack" style="max-width:1040px;margin:0 auto">
    ${m.msg?`<div class="msg ok">${esc(m.msg)}</div>`:""}
    ${A.heats.length===0&&!students().length?`<div class="msg warn">No student list loaded yet. The Carnival Organiser loads it first.</div>`:""}
    ${row("mr-race","Race",raceBtns,!ev)}
    ${row("mr-sex","Boys or girls",sexBtns,!m.x)}
    ${row("mr-age",ev&&ev.gk!=="age"?"Group":"Age",gBtns,!m.g)}
    ${note?`<div class="msg info">${esc(note)}</div>`:""}
    <div class="checkline">${badge(A.counter,"xl")}
      ${miss.length?`<div class="what not"><span class="label" style="color:var(--warn)">Not ready yet</span><br>Still to choose: ${esc(miss.join(", "))}</div>`:`<div class="what">${esc(name)}<br><span class="muted" style="font:600 .95rem var(--font-body)">Heat ${heatsSentFor(groupKey(m.k,m.x,m.g))+1}</span></div>`}
      <button type="button" class="btn go big" data-act="mgo" ${locked()?"disabled":""}>Go</button>
    </div>
    ${A.heats.length&&!locked()?`<div style="text-align:center"><button type="button" class="linkbtn" data-act="medit">Change an earlier race</button></div>`:""}
  </div>`;
}
async function marshalGo(){
  const m=A.m;const miss=mMissing();
  if(miss.length){m.showMiss=true;A.modal={t:"info",title:"Not ready yet",body:`<p style="margin:0">You have not selected ${esc(miss.join(", ").replace(/, ([^,]*)$/," and $1"))}.</p><p style="margin:0">Go back and choose them (marked in yellow), then press Go.</p>`,ok:"OK, go back"};render();return}
  const ev=mEv();const key=groupKey(m.k,m.x,m.g);
  if(otherPeers().some(p=>p.mk===key)){A.modal={t:"info",title:"Already selected",body:`<p style="margin:0">${esc(groupLabel(ev,m.x,m.g))} has already been selected on another iPad. Please go back and choose another race or group.</p>`,ok:"Back"};render();return}
  const sent=heatsSentFor(key);
  if(ev.relay&&sent){A.modal={t:"info",title:"Relay already sent",body:`<p style="margin:0">${esc(groupLabel(ev,m.x,m.g))} has been sent. Use Change an earlier race to change its lanes.</p>`,ok:"Back"};render();return}
  /* 800 m and 1500 m: no lanes here. The race gets its number now, and the multitimer phone enters the names */
  if(ev.run==="multi"){
    if(locked()||m.sending)return;m.sending=true;
    try{
      const n=await A.store.nextRace();
      const doc={race:n,k:m.k,x:m.x,g:m.g,heat:sent+1,multi:true,lanes:{},at:Date.now(),dev:DEV};
      const r=await w(()=>A.store.set("heats/"+rid(n),doc));
      if(r){A.heats=A.heats.filter(h=>h.race!==n).concat([Object.assign({_id:rid(n)},doc)]);m.msg=`Race ${n} (${groupLabel(ev,m.x,m.g)}, Heat ${sent+1}) sent to the multitimer phone.`;recompute()}
    }catch(e){toast("Not sent. A race number needs a connection. Try again.")}
    m.sending=false;render();return;
  }
  m.phase="lanes";m.lanes={};m.cur=1;m.open=1;m.filter="";m.heat=sent+1;m.sent=[];m.msg="";m.showMiss=false;m.bar="";
  announce();render();
}
function laneRow(l,id,open,cur,pick,word){
  const p=id?A.R.who(id):null;
  return `<div class="lane ${cur&&!id?"cur":""}"><div class="blk">${l}</div>
    <button type="button" class="body" data-act="mlane" data-l="${l}" aria-label="Lane ${l}">${p?`<span class="nm">${hdot(p.h)}<span>${esc(pname(p))}</span></span>`:`<span class="empty">Tap to add a ${word}</span>`}</button>
    <div class="wall" aria-hidden="true"></div>${pick}</div>`;
}
function renderMarshalLanes(){
  const m=A.m;const L=Number(A.cfg.lanes)||8;const ev=mEv();
  const filled=Object.keys(m.lanes).filter(l=>m.lanes[l]).length;
  const used=usedInGroup();const inHeat=new Set(Object.values(m.lanes));
  let lanes="";
  for(let l=1;l<=L;l++){
    const id=m.lanes[l];
    lanes+=laneRow(l,id,m.open===l,m.cur===l,m.open===l?laneList(l,ev,m.x,m.g,used,inHeat,id,"mset","mclear"):"",ev.relay?"house":"runner");
  }
  const info=ev.relay?`${filled} of 3 houses in a lane · no names`:`Heat ${m.heat} · ${filled} of ${L} lanes filled`;
  return `${lockBar()}<div class="racebar">
      <button type="button" class="btn" data-act="mback">Back</button>
      ${badge(A.counter,"xl")}
      <div class="info"><b>${esc(groupLabel(ev,m.x,m.g))}</b><span>${info}</span></div>
      ${ev.relay?"":`<button type="button" class="btn navy big" data-act="mnext" ${locked()?"disabled":""}>Next heat</button>`}
      <button type="button" class="btn big" data-act="mnew" ${locked()?"disabled":""}>New race</button>
    </div>
    ${m.bar?`<div class="msg ok" style="margin-bottom:12px">${esc(m.bar)}</div>`:""}
    <div class="pool track">${lanes}</div>`;
}
/* the name list for one lane: the Marshal's lanes and the Recorder's "Add runner to lane" */
function laneList(l,ev,x,g,used,inHeat,id,setAct,clearAct,usedLabel){
  const m=A.m;const list=eligible(ev,x,g);const q=m.filter.toLowerCase();
  const shown=q?list.filter(s=>(listName(s)).toLowerCase().includes(q)):list;
  return `<div class="picklist" role="listbox" aria-label="${ev.relay?"Houses":"Runners"} for lane ${l}">
        <div class="acts">${ev.relay?"":`<input id="mfilter" placeholder="Type to find a name" value="${esc(m.filter)}" style="flex:1 1 160px;min-height:48px" autocomplete="off">`}
          ${ev.relay||!clearAct?"":`<button type="button" class="btn small" data-act="maddnew" data-l="${l}">Not on the list</button>`}
          ${clearAct?`<button type="button" class="btn small" data-act="${clearAct}" data-l="${l}">Clear lane</button>`:""}
          <button type="button" class="btn small" data-act="${clearAct?"mclose":"closemodal"}">${clearAct?"Close":"Cancel"}</button></div>
        ${shown.length?shown.map(s=>{const dis=used.has(s.id)||(inHeat.has(s.id)&&id!==s.id);return `<button type="button" class="pick" data-act="${setAct}" data-l="${l}" data-id="${esc(s.id)}" ${dis?"disabled":""}>${hdot(s.h)}<span>${esc(listName(s))}</span>${used.has(s.id)?`<span class="muted" style="margin-left:auto;font-size:.8rem">${usedLabel||"Earlier heat"}</span>`:inHeat.has(s.id)&&id!==s.id?`<span class="muted" style="margin-left:auto;font-size:.8rem">In this heat</span>`:""}</button>`}).join(""):`<div class="muted" style="padding:10px">No names match.</div>`}
      </div>`;
}
/* change who is in a lane on a race already sent. Saves straight away; a time already in the lane stays
   with the lane; a race already checked goes back to "To check" */
function heatUsed(H){
  const key=groupKey(H.k,H.x,H.g);const used=new Set();
  for(const h of A.heats)if(h.race!==H.race&&!h.cancelled&&groupKey(h.k,h.x,h.g)===key)for(const l in (h.lanes||{}))if(h.lanes[l])used.add(h.lanes[l]);
  return used;
}
async function setHeatLane(race,l,id){
  const H=A.heats.find(h=>h.race===race);if(!H)return false;
  if(locked()){toast("Results are locked.");return false}
  const lanes={[l]:id||null};const edited=Date.now();const was={lanes:H.lanes,edited:H.edited};
  H.lanes=Object.assign({},H.lanes||{},lanes);H.edited=edited;recompute();render();
  const ok=await w(()=>A.store.update("heats/"+rid(race),{lanes,edited}));
  if(!ok){H.lanes=was.lanes;H.edited=was.edited;recompute();render()}
  return ok;
}
function renderMarshalEdit(){
  const m=A.m;const H=A.heats.find(h=>h.race===m.edit);
  if(!H){m.phase="start";m.edit=null;return renderMarshal()}
  const ev=eventOf(A.cfg,H.k);
  const L=Number(A.cfg.lanes)||8;const ln=H.lanes||{};
  const used=heatUsed(H);const inHeat=new Set(Object.values(ln).filter(Boolean));
  const filled=Object.keys(ln).filter(l=>ln[l]).length;
  let lanes="";
  for(let l=1;l<=L;l++){const id=ln[l];lanes+=laneRow(l,id,false,false,m.open===l?laneList(l,ev,H.x,H.g,used,inHeat,id,"meset","meclear","Other heat"):"",ev.relay?"house":"runner")}
  return `${lockBar()}<div class="racebar">
      <button type="button" class="btn navy big" data-act="medone">Done</button>
      ${badge(H.race,"xl")}
      <div class="info"><b>${esc(groupLabel(ev,H.x,H.g))}</b><span>Heat ${H.heat} · ${filled} of ${L} lanes filled</span></div>
    </div>
    <div class="msg warn" style="margin-bottom:12px">Changing Race ${H.race}. Changes save straight away. A time already in a lane stays with that lane.</div>
    <div class="pool track">${lanes}</div>`;
}
/* the heat being filled is kept on this device, so a reload brings the lanes back */
const M_KEY="aths_marshal";
function mSave(){
  const m=A.m;
  const v=A.job==="marshal"&&m.phase==="lanes"&&!A.past?JSON.stringify({k:m.k,x:m.x,g:m.g,lanes:m.lanes,heat:m.heat,cur:m.cur,sent:m.sent,bar:m.bar}):null;
  if(v!==mSave.last){mSave.last=v;ssSet(M_KEY,v)}
}
(function(){let d=null;try{d=JSON.parse(ssGet(M_KEY,"null"))}catch(e){}
  if(d&&d.k&&A.job==="marshal")Object.assign(A.m,{phase:"lanes",k:d.k,x:d.x,g:d.g,lanes:d.lanes||{},heat:d.heat||1,cur:d.cur||1,open:null,filter:"",sent:d.sent||[],bar:d.bar||"",msg:""})})();
function nextEmpty(from){const L=Number(A.cfg.lanes)||8;for(let i=1;i<=L;i++){const l=((from-1+i)%L)+1;if(!A.m.lanes[l])return l}return null}
async function sendHeat(){
  const m=A.m;
  const lanes={};for(const l in m.lanes)if(m.lanes[l])lanes[l]=m.lanes[l];
  if(!Object.keys(lanes).length){toast("Put at least one runner in a lane first.");return false}
  if(locked()){toast("Results are locked.");return false}
  if(m.sending)return false;m.sending=true;
  try{
    const n=await A.store.nextRace();
    const doc={race:n,k:m.k,x:m.x,g:m.g,heat:m.heat,lanes,at:Date.now(),dev:DEV};
    const r=await w(()=>A.store.set("heats/"+rid(n),doc));
    if(!r){m.sending=false;return false}
    A.heats=A.heats.filter(h=>h.race!==n).concat([Object.assign({_id:rid(n)},doc)]);
    m.sent.push(n);m.bar=`Race ${n} (Heat ${m.heat}) sent to the starter`;
    m.heat++;m.lanes={};m.cur=1;m.open=1;m.filter="";
    m.sending=false;recompute();return true;
  }catch(e){m.sending=false;toast(e&&e.code==="busy"?"Another marshal is sending. Press again.":"Not sent. A race number needs a connection. Try again.");return false}
}
function finishMarshalRace(){
  const m=A.m;
  m.msg=m.sent.length?`${raceRange(m.sent)} sent to the starter (${plural(m.sent.length,"heat")}). Choose the new race below.`:"";
  m.phase="start";m.k=null;m.x=null;m.g=null;m.lanes={};m.open=null;m.bar="";
  announce();render();window.scrollTo(0,0);
}
MODALS.confirmHeat=M=>{const m=A.m;const L=Number(A.cfg.lanes)||8;const f=Object.keys(m.lanes).filter(l=>m.lanes[l]).length;
  return `<h2>Confirm this heat</h2><p style="margin:0">Race ${A.counter} (Heat ${m.heat}): ${f} of ${L} lanes filled. It will be sent to the starter, then you go back to choose a new race.</p><div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back to lanes</button><button type="button" class="btn go" data-act="mconfirm">Confirm this heat</button></div>`};
/* someone not on the list: for the marshal, the multitimer phone and the field stations */
MODALS.addStudent=M=>{
  const ages=M.ages;
  return `<h2>Athlete not on the list</h2><p class="muted" style="margin:0">Adds the athlete for everyone. ${esc(sexName(M.x))}</p>
  <div class="fields"><label>Surname<input id="nsS" autocomplete="off"></label><label>First name<input id="nsF" autocomplete="off"></label>
  <label>House<select id="nsH">${HOUSES.map(h=>`<option value="${h.c}">${h.n}</option>`).join("")}</select></label>
  <label>Age group<select id="nsG">${ages.map(a=>`<option value="${a}">${esc(grpName(a))}</option>`).join("")}</select></label></div>
  <div class="acts"><button type="button" class="btn" data-act="closemodal">Cancel</button><button type="button" class="btn primary" data-act="addstudent">Add</button></div>`};
function agesFor(ev,g){return ev.gk==="age"?[g]:AGE_GROUPS}
async function addStudent(){
  const M=A.modal;
  const s=document.getElementById("nsS").value.trim(),f=document.getElementById("nsF").value.trim();
  if(!s||!f){toast("Type a surname and first name.");return}
  const st={id:"x-"+(s+"-"+f).toLowerCase().replace(/[^a-z0-9]+/g,"-")+"-"+Date.now().toString(36),s,f,h:document.getElementById("nsH").value,x:M.x,g:document.getElementById("nsG").value,added:true};
  const r=await w(()=>A.store.set("extras/"+st.id,st));if(!r)return;
  A.extras=A.extras.concat([st]);A.modal=null;recompute();
  await M.then(st);render();
}

/* ---------- Place Judge ---------- */
function judgeRaces(){return liveRaces().filter(r=>!r.multi)}
/* a relief judge or a reload opens on the first race after the last one with places */
function judgeRace(){
  const list=judgeRaces();if(!list.length)return null;
  if(A.j.race==null||!A.R.races.has(A.j.race)||A.R.races.get(A.j.race).multi){
    let i=-1;list.forEach((r,n)=>{if(r.tapped||r.F.ok)i=n});
    A.j.race=(list[i+1]||list[Math.max(i,0)]).race;
  }
  A.j.race=liveRaceNo(A.j.race,list);
  return A.R.races.get(A.j.race);
}
function judgeFin(r){return r.F||{}}
function renderJudge(){
  const r=judgeRace();
  if(!r)return waitingCard("Waiting for the marshal","The first race appears here as soon as the marshal sends it.");
  const L=Number(A.cfg.lanes)||8;const fin=judgeFin(r);const order=fin.order||[];
  const placeOf=finishOrderFromTaps(order);
  const placed=Object.keys(placeOf).length;const need=r.need;
  const list=judgeRaces();const max=latestRace(list);
  const done=placed>=need;const nextPlace=placed+1;
  let lanes="";
  for(let l=1;l<=L;l++){
    const id=r.lanes[l];const p=id?A.R.who(id):null;const pl=placeOf[String(l)];
    let wall="";
    if(p){
      if(pl)wall=`<button type="button" class="spot p${Math.min(pl,4)}" data-act="jtap" data-l="${l}" aria-label="Lane ${l}, place ${pl}. Tap to remove">${pl}</button>`;
      else if(!done)wall=`<button type="button" class="spot" data-act="jtap" data-l="${l}" aria-label="Lane ${l}, tap for place ${nextPlace}"></button>`;
      else wall=`<span class="bytime">By time</span>`;
    }
    lanes+=`<div class="lane"><div class="blk">${l}</div><div class="body" style="cursor:default">${p?`<span class="nm">${hdot(p.h)}<span>${esc(pname(p))}</span></span>`:`<span class="empty">Empty</span>`}</div><div class="wall">${wall}</div></div>`;
  }
  const ord=["1st","2nd","3rd","4th"];
  const prompt=done?`Top ${need} placed. Press Next race.`:`Tap the lane that crossed the line ${ord[placed]}${placed===0?" first":""}.`;
  const off=!placed||locked()?"disabled":"";
  const undoOff=!((fin.undo||[]).length||(fin.seq||[]).length)||locked()?"disabled":"";
  const goto=`<button type="button" class="btn" data-act="jgoto">Go to race</button>${r.race<max?`<button type="button" class="btn" data-act="jlatest">Back to latest</button>`:""}`;
  const next=nextRaceAfter(r.race,list)!=null?`<button type="button" class="btn navy big" data-act="jnext">Next race</button>`:`<button type="button" class="btn big" disabled>Waiting for marshal</button>`;
  const undo=`<button type="button" class="btn" data-act="jundo" ${undoOff}>Undo last</button>`;
  const reset=`<button type="button" class="btn danger" data-act="jreset" ${off}>Start again</button>`;
  const ph=phoneNow();
  const info=`<div class="info"><b>${esc(r.label)}</b><span>Heat ${r.heat}${r.race<max?(ph?" · Earlier race":" · Earlier race: changes save straight away"):""}</span></div>`;
  if(ph)return `${lockBar()}<div class="racebar ph">${badge(r.race,"sm")}${info}</div>
    <div class="prompt ${done?"done":""}">${esc(prompt)}</div>
    <div class="pool ph track">${lanes}</div>
    <div class="row" style="margin-top:12px">${goto}${reset}</div>
    <div class="pbar"><div class="wrap">${undo}${next.replace(" big","")}</div></div>`;
  return `${lockBar()}<div class="racebar">${badge(r.race,"xl")}${info}${goto}${next}</div>
    <div class="prompt ${done?"done":""}">${esc(prompt)}</div>
    <div class="pool track">${lanes}</div>
    <div class="row" style="margin-top:12px">${undo}${reset}</div>`;
}
async function judgeTap(l){
  const r=judgeRace();const fin=judgeFin(r);
  let order=(fin.order||[]).map(g=>g.slice());
  const at=order.findIndex(g=>g.includes(l));
  if(at>=0){order[at]=order[at].filter(x=>x!==l);order=order.filter(g=>g.length)}
  else{
    const placed=order.reduce((t,g)=>t+g.length,0);if(placed>=r.need)return;
    order.push([l]);
  }
  await saveFinish(r,order,true);
}
/* every change keeps the order before it, so Undo last puts back a removed place or a Start again.
   ck is the Times checked the judge saw: a change after it sends the race back to "To check" */
async function saveFinish(r,order,undoable,extra){
  const key=rid(r.race);const fin=judgeFin(r);
  const undo=(fin.undo||[]).slice();if(undoable)undo.push(fin.order||[]);
  const T=r.T||{};
  const doc=Object.assign({order,seq:order.flat(),undo:undo.slice(-20),gen:r.gen||0,ck:T.checked?T.checkedAt||0:0,ok:!!fin.ok,at:Date.now(),dev:DEV},extra||{});
  A.finish[key]=doc;recompute();render();
  await w(()=>A.store.set("finish/"+key,doc));
}
function judgeUndo(){const r=judgeRace();const fin=judgeFin(r);const undo=(fin.undo||[]).slice();
  if(undo.length){const prev=undo.pop();saveFinish(r,prev,false,{undo});return}}
function judgeNext(force){
  const r=judgeRace();
  if(!force){const placed=Object.keys(finishOrderFromTaps(judgeFin(r).order)).length;
    if(placed<r.need){A.modal={t:"confirmPlaces",race:r.race,heat:r.heat,placed,need:r.need};render();return}}
  else if(!judgeFin(r).ok)saveFinish(r,judgeFin(r).order||[],false,{ok:true});
  const nx=nextRaceAfter(r.race,judgeRaces());if(nx!=null)A.j.race=nx;
  A.modal=null;render();window.scrollTo(0,0);
}
MODALS.judgeReset=M=>`<h2>Start again?</h2><p style="margin:0">Race ${M.race}: this clears all ${plural(M.placed,"place")} tapped. Undo last puts them back.</p><div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back to lanes</button><button type="button" class="btn redfill" data-act="jresetok">Start again</button></div>`;
MODALS.confirmPlaces=M=>`<h2>Confirm places</h2><p style="margin:0">Race ${M.race}, Heat ${M.heat}: ${M.placed} of ${M.need} places tapped. Times will decide any place not tapped.</p><div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back to lanes</button><button type="button" class="btn go" data-act="jconfirm">Confirm</button></div>`;
MODALS.goRace=M=>{
  const list=M.job==="judge"?judgeRaces():M.job==="slips"?liveRaces():raceList();
  return `<h2>${M.job==="slips"?"Check race":M.job==="medit"?"Change an earlier race":"Go to race"}</h2><div class="stack" style="gap:6px">${list.length?list.slice().reverse().map(r=>{
    let st="";const H=A.heats.find(h=>h.race===r.race)||{};
    if(r.cancelled)st="Cancelled";
    else if(M.job==="medit"){const n=Object.values(H.lanes||{}).filter(Boolean).length;st=plural(n,"lane")+" filled"}
    else if(M.job==="judge"){const p=Object.keys(finishOrderFromTaps(judgeFin(r).order)).length;st=p>=r.need?`Top ${r.need} done`:p?`${p} of ${r.need} placed`:"Not started"}
    else if(M.job==="recorder"){st=lockedBy(r.race)?"On another device":r.differs.length?"Slip differs":r.tstatus}
    else{st=r.hasSlip?"":(r.multi?"No times yet":"No slip yet")}
    return `<button type="button" class="btn" style="justify-content:flex-start;gap:12px" data-act="pickrace" data-race="${r.race}" data-job="${M.job}">${badge(r.race,"sm")}<span style="flex:1;text-align:left">${esc(r.label)}<br><span class="muted" style="font-weight:600;font-size:.85rem">Heat ${r.heat}</span></span>${st?`<span class="chip">${esc(st)}</span>`:""}</button>`}).join(""):`<p class="muted">No races sent yet.</p>`}</div>
  <div class="acts"><button type="button" class="btn" data-act="closemodal">Close</button></div>`;
};
function waitingCard(t,s){return `<div class="panel stack" style="max-width:640px;margin:30px auto;text-align:center;align-items:center">${badge(null,"xl")}<h2>${esc(t)}</h2><p class="muted" style="margin:0">${esc(s)}</p></div>`}
function lockBar(){if(A.past)return `<div class="lockbar">You are looking at the ${esc(A.past)} carnival. Look only: nothing can be changed. Use Change year to go back to ${esc(curYear())}.</div>`;return locked()?`<div class="lockbar">Results are locked. You can look, but nothing can be changed until the organiser unlocks them.</div>`:""}
