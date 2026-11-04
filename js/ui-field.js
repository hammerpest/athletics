/* ===== Field Station =====
   The field rules are question 8, so attempts, heights and ties come from the organiser's settings, and the
   dashed placeholders stay until Jordan sets them. Results are final at the station; the event coordinator
   can overrule (decision 23). Each attempt saves on its own, so two teachers can work one group. */
function fSave(){ssSet("aths_field",JSON.stringify({station:A.f.station,gid:A.f.gid,i:A.f.i,typed:A.f.typed}))}
function fieldGroupOpen(){return A.R?A.R.fgroups.find(f=>f.id===A.f.gid)||null:null}
function fieldDocOf(f){return A.field[f.id]||{ath:{},marks:{}}}
function deepMerge(a,b){const o=Object.assign({},a||{});for(const k in b){if(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k])&&o[k]&&typeof o[k]==="object")o[k]=deepMerge(o[k],b[k]);else o[k]=b[k]}return o}
function stationGroups(id){return A.R.fgroups.filter(f=>f.station===id).sort((a,b)=>(a.block==null?99:a.block)-(b.block==null?99:b.block))}
/* the group a station is up to: the first one not final */
function stationNow(list){return list.findIndex(f=>{const G=A.R.groups.get(f.key);return !(G&&G.final)})}
function renderField(){
  const f=fieldGroupOpen();
  if(f&&A.R.stations.some(s=>s.id===f.station))return phoneNow()?renderFieldPhone(f):renderFieldTable(f);
  A.f.gid=null;
  return renderFieldStart();
}
function renderFieldStart(){
  const R=A.R;
  /* two-location sports first, then the rest, as drawn on A1.7 */
  const st=R.stations.slice().sort((a,b)=>b.locs-a.locs);
  if(!st.some(s=>s.id===A.f.station)){A.f.station=null}
  const cur=A.f.station;
  const chooser=`<div class="mrow" style="padding:0"><span class="label">Your station</span><div class="choices">${st.map(s=>`<button type="button" class="choice" data-act="fstation" data-v="${s.id}" aria-pressed="${cur===s.id}">${esc(s.name)}</button>`).join("")}</div></div>`;
  if(!cur)return `${lockBar()}<div class="stack" style="max-width:1040px;margin:0 auto">${chooser}<div class="msg info">Pick your station to see its groups for the day.</div></div>`;
  const list=stationGroups(cur);const now=stationNow(list);const name=(R.stations.find(s=>s.id===cur)||{}).name;
  const shared=list.some(f=>list.some(o=>o!==f&&o.block===f.block&&f.block!=null));
  return `${lockBar()}<div class="stack" style="max-width:1040px;margin:0 auto">${chooser}
    ${shared?`<div class="msg info">In ${list.filter((f,i)=>list.findIndex(o=>o.block===f.block)===i&&list.filter(o=>o.block===f.block).length>1).length} blocks two age groups are on ${esc(name)} at once. Both can be open here.</div>`:""}
    <div class="gcard"><div class="ghead"><h3>${esc(name)}: your day</h3><span class="meta">${plural(list.length,"group")} · tap a group to open it</span></div>
    ${list.map((f,i)=>{const G=R.groups.get(f.key);const fin=!!(G&&G.final);const isNow=!fin&&(i===now||(now>=0&&f.block!=null&&f.block===list[now].block));
      return `<div class="runrow ${isNow?"now":""}"><b>${esc(f.at)}</b><span class="chip ${fin?"final":isNow?"prov":""}">${fin?"Finished":isNow?"Now":"Later"}</span><span class="gname" style="font-weight:700">${esc(sexName(f.x)+" "+grpName(f.g))}</span>
      <button type="button" class="btn ${isNow?"go":""} small" data-act="fopen" data-v="${f.id}">Open</button></div>`}).join("")}</div></div>`;
}
function ruleBanner(ev,rule){
  const items=ev.style==="height"?["[START HEIGHT]","[STEPS]","[3 TRIES AT A HEIGHT?]","[COUNTBACK ON TIES?]"]:[`[ATTEMPTS: ${rule.attempts} DRAWN]`,"[FINAL ROUND?]","[COUNTBACK ON TIES?]","[MARKS TO 2 DECIMALS?]"];
  return `<div class="todo" style="margin-bottom:12px">Placeholder until Jordan sets the rules: ${items.map(x=>`<b>${x}</b>`).join(" ")} ${qchip(8)}</div>`;
}
function fieldHead(f,ev,G){
  const name=(A.R.stations.find(s=>s.id===f.station)||{}).name;const fin=!!(G&&G.final);
  return `<div class="racebar"><span class="racebadge"><small>FIELD</small><b>${esc(f.station)}</b></span><div class="info"><b>${esc(groupLabel(ev,f.x,f.g))}</b><span>${esc(name)} · ${esc(f.at)}${f.block!=null?" block":""} · 2 teachers</span></div>
    <button type="button" class="btn" data-act="faddopen" ${fin||locked()?"disabled":""}>Add an athlete</button><button type="button" class="btn" data-act="fall">All groups</button><button type="button" class="btn navy big" data-act="ffinish" ${fin||locked()?"disabled":""}>${fin?"Final":"Group finished"}</button></div>`;
}
function fieldEditable(G){return !locked()&&!(G&&G.final)}
function markCell(f,r,ri,a,v){
  const c=v==="x"?"foul":v==="-"?"pass":"";
  return `<input class="markin ${c}" id="mk-${ri}-${a}" data-mark="${esc(r.id)}" data-a="${a}" data-g="${f.id}" aria-label="${esc(pname(r.p))} attempt ${a+1}" value="${esc(fmtCell(v))}" placeholder="metres" inputmode="decimal" autocomplete="off">`;
}
function hjCell(f,r,h,v){
  const c=/O$/.test(v)?"clear":/^X+$/.test(v)?"out":v==="-"?"pass":"";
  return `<button type="button" class="hjc ${c}" data-act="hjtap" data-g="${f.id}" data-id="${esc(r.id)}" data-h="${h}" aria-label="${esc(pname(r.p))} at ${fmtMark(h)} metres: ${esc(v||"not tried")}">${esc(v)||" "}</button>`;
}
function renderFieldTable(f){
  const ev=eventOf(A.cfg,f.k);const G=A.R.groups.get(f.key);const rule=fieldRule(A.cfg,ev);
  const rows=G?fieldRowsInOrder(G):[];const edit=fieldEditable(G);const fin=!!(G&&G.final);
  const dis=edit?"":"disabled";const hts=ev.style==="height"?heightList(rule,(G&&G.doc.marks)||{}):null;
  const head=hts?hts.map(h=>`<th class="todoh" style="text-align:center">${fmtMark(h)} m</th>`).join(""):Array.from({length:rule.attempts},(_,a)=>`<th class="todoh">Attempt ${a+1}</th>`).join("");
  const body=rows.map((r,ri)=>{
    const cells=hts?hts.map(h=>`<td style="text-align:center;padding:6px">${hjCell(f,r,h,(r.m.h||{})[h]||"").replace("<button ",`<button ${dis} `)}</td>`).join("")
      :Array.from({length:rule.attempts},(_,a)=>`<td>${markCell(f,r,ri,a,(r.m.a||{})[a]).replace("<input ",`<input ${dis} `)}</td>`).join("");
    return `<tr><td class="nmcell"><span class="htag">${hdot(r.p.h)}<b>${esc(pname(r.p))}</b></span></td>${cells}
      <td class="num"><span class="bestm">${r.best?fmtMark(r.best):"&ndash;"}</span></td><td>${placeCell(r.place)}</td><td class="num"><b>${fmtPts(r.pts||0)}</b></td>
      <td><button type="button" class="stbtn" data-act="fns" data-g="${f.id}" data-id="${esc(r.id)}" aria-pressed="${!!r.m.ns}" ${dis}>NS</button></td></tr>`}).join("");
  const cols=5+(hts?hts.length:rule.attempts);
  return `${lockBar()}${fieldHead(f,ev,G)}${ruleBanner(ev,rule)}
    <div class="panel" style="padding:0;overflow:hidden"><div class="tablewrap"><table>
      <thead><tr><th>Athlete</th>${head}<th class="num">Best</th><th>Place</th><th class="num">Points</th><th>No show</th></tr></thead>
      <tbody>${body||`<tr><td colspan="${cols}" class="muted">No athletes yet. Use Add an athlete as they arrive.</td></tr>`}</tbody></table></div></div>
    <p class="muted" style="font-size:.9rem;margin:10px 0 0">${hts?"Tap a box to step through: O cleared first try, XO second, XXO third, XXX out, - passed. Tied places are shown as equal until the tie rule is set.":"Type digits only: 534 is 5.34 m. Type x for a foul and - for a pass. Open entry: use Add an athlete for anyone not on the list. Everyone with a valid mark gets points; no valid mark gets 0."}</p>
    ${fin?`<div class="msg ok" style="margin-top:10px">Final. Results are in. Only the event coordinator can change them now.</div>`:""}`;
}
/* the list stays in the order athletes were added, so nobody jumps while the group works */
function fieldRowsInOrder(G){const a=G.doc.ath||{};return G.rows.slice().sort((x,y)=>(a[x.id]||0)-(a[y.id]||0)||x.id.localeCompare(y.id))}
function fieldUndoPush(f,id,kind,key,prev){A.f.undo.push({g:f.id,id,kind,key,prev});A.f.undo=A.f.undo.slice(-40)}
async function fieldWrite(f,patch){
  if(locked()){toast("Results are locked. Nothing can be changed.");return}
  const G=A.R.groups.get(f.key);
  if(G&&G.final)patch=Object.assign({},patch,{over:Date.now()});
  A.field[f.id]=deepMerge(Object.assign({k:f.k,x:f.x,g:f.g},fieldDocOf(f)),patch);recompute();
  /* after the focus has moved, so the box the helper is now in stays focused */
  setTimeout(()=>render(),0);
  await w(()=>A.store.update("field/"+f.id,Object.assign({k:f.k,x:f.x,g:f.g},patch)));
}
function setMark(f,id,a,v,noUndo){
  const m=fieldDocOf(f).marks||{};const prev=((m[id]||{}).a||{})[a]||"";
  if(prev===v)return;
  if(!noUndo)fieldUndoPush(f,id,"a",a,prev);
  return fieldWrite(f,{marks:{[id]:{a:{[a]:v}}}});
}
function setHeight(f,id,h,v,noUndo){
  const m=fieldDocOf(f).marks||{};const prev=((m[id]||{}).h||{})[h]||"";
  if(!noUndo)fieldUndoPush(f,id,"h",h,prev);
  return fieldWrite(f,{marks:{[id]:{h:{[h]:v}}}});
}
function setNs(f,id,v,noUndo){
  const m=fieldDocOf(f).marks||{};
  if(!noUndo)fieldUndoPush(f,id,"ns",0,!!(m[id]||{}).ns);
  return fieldWrite(f,{marks:{[id]:{ns:v}}});
}
function hjStep(f,id,h){
  const ev=eventOf(A.cfg,f.k);const seq=heightSeq(fieldRule(A.cfg,ev));
  const cur=((fieldDocOf(f).marks||{})[id]||{}).h||{};const v=cur[h]||"";
  setHeight(f,id,h,seq[(seq.indexOf(v)+1)%seq.length]);
}
function fieldUndo(){
  const f=fieldGroupOpen();if(!f)return;
  if(A.f.typed){A.f.typed="";fSave();render();return}
  const u=A.f.undo.filter(x=>x.g===f.id).pop();if(!u){toast("Nothing to undo.");return}
  A.f.undo.splice(A.f.undo.lastIndexOf(u),1);
  if(u.kind==="a")setMark(f,u.id,u.key,u.prev,true);else if(u.kind==="h")setHeight(f,u.id,u.key,u.prev,true);else setNs(f,u.id,u.prev,true);
}
async function fieldAdd(f,id){
  await fieldWrite(f,{ath:{[id]:Date.now()}});
}
MODALS.fieldAdd=M=>{
  const f=fieldGroupOpen();if(!f)return "";const ev=eventOf(A.cfg,f.k);const on=fieldDocOf(f).ath||{};
  const q=(A.f.filter||"").toLowerCase();
  const list=eligible(ev,f.x,f.g).filter(s=>!q||listName(s).toLowerCase().includes(q));
  return `<h2>Add an athlete</h2><p class="muted" style="margin:0">${esc(groupLabel(ev,f.x,f.g))}. Open entry: tap everyone who is here.</p>
    <input id="ffilter" placeholder="Type to find a name" value="${esc(A.f.filter||"")}" autocomplete="off">
    <div class="addlist">${list.map(s=>`<button type="button" class="pick" data-act="fadd" data-id="${esc(s.id)}" ${on[s.id]?"disabled":""}>${hdot(s.h)}<span>${esc(listName(s))}</span>${on[s.id]?`<span class="muted" style="margin-left:auto;font-size:.8rem">On the list</span>`:""}</button>`).join("")||`<div class="muted" style="padding:10px">No names match.</div>`}</div>
    <div class="acts"><button type="button" class="btn" data-act="faddnew">Not on the list</button><button type="button" class="btn primary" data-act="closemodal">Done</button></div>`;
};
MODALS.fieldFinish=M=>`<h2>Finish this group?</h2><p style="margin:0">${esc(M.label)}. The results go final and show on every device. After this only the event coordinator can change them.</p><div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back</button><button type="button" class="btn go" data-act="ffinishok">Group finished</button></div>`;
async function fieldFinish(){
  const f=fieldGroupOpen();if(!f)return;A.modal=null;
  await fieldWrite(f,{final:true,finalAt:Date.now(),by:DEV});
}

/* ---------- phone: one athlete at a time (A1.10) ---------- */
function renderFieldPhone(f){
  const ev=eventOf(A.cfg,f.k);const G=A.R.groups.get(f.key);const rule=fieldRule(A.cfg,ev);
  const rows=G?fieldRowsInOrder(G):[];const edit=fieldEditable(G);const fin=!!(G&&G.final);
  if(A.f.i>=rows.length)A.f.i=0;
  const r=rows[A.f.i];
  const head=`<div class="racebar ph" style="margin:0"><span class="racebadge sm"><small>FIELD</small><b>${esc(f.station)}</b></span><div class="info"><b>${esc(groupLabel(ev,f.x,f.g))}</b><span>${r?`Athlete ${A.f.i+1} of ${rows.length}`:"No athletes yet"}</span></div></div>`;
  const tools=`<div class="row" style="flex-wrap:nowrap;gap:8px"><button type="button" class="btn" style="flex:1;padding-inline:6px" data-act="faddopen" ${edit?"":"disabled"}>Add an athlete</button><button type="button" class="btn" style="flex:1;padding-inline:6px" data-act="fall">All groups</button><button type="button" class="btn" style="flex:1;padding-inline:6px" data-act="ffinish" ${edit?"":"disabled"}>${fin?"Final":"Group finished"}</button></div>`;
  if(!r)return `${lockBar()}<div class="stack" style="gap:8px">${head}<div class="msg info">Add the athletes as they arrive.</div>${tools}</div>`;
  const name=`<div class="row" style="flex-wrap:nowrap;justify-content:space-between"><span class="htag bigath"><span class="hdot h${esc(r.p.h)}" style="width:30px;height:30px;font-size:.9rem">${esc(r.p.h)}</span>${esc(pname(r.p))}</span><span class="qchip">Q8</span></div>`;
  let main,bar;const dis=edit?"":"disabled";
  if(ev.style==="height"){
    const hts=heightList(rule,G.doc.marks||{});const mh=r.m.h||{};
    const cur=hts.findIndex(h=>!mh[h]);const at=hts[cur<0?hts.length-1:cur];
    main=`<div class="attrow hts">${hts.map(h=>{const v=mh[h]||"";return `<div class="attcell ${h===at?"cur":""} ${/^X+$/.test(v)?"foul":""}"><span>${fmtMark(h)} m</span><b>${esc(v)||" "}</b></div>`}).join("")}</div>
      <div class="markshow" aria-live="polite">${fmtMark(at)} m</div>
      <div class="hjset">${heightSeq(rule).filter(s=>s&&s!=="-").map(s=>`<button type="button" class="btn" data-act="hjset" data-v="${s}" data-h="${at}" ${dis}>${s}</button>`).join("")}</div>`;
    bar=`<button type="button" class="btn" data-act="fundo">Undo last</button><button type="button" class="btn" data-act="hjset" data-v="-" data-h="${at}" ${dis}>Pass</button><button type="button" class="btn navy" data-act="fnext">Next athlete</button>`;
  }else{
    const a=r.m.a||{};const n=rule.attempts;let cur=n;for(let i=0;i<n;i++)if(!a[i]){cur=i;break}
    const t=A.f.typed;const show=t.length?(t.length>2?t.slice(0,-2)+"."+t.slice(-2):"0."+t.padStart(2,"0"))+" m":"0.00 m";
    const keys=["1","2","3","4","5","6","7","8","9","Foul","0","Back"];
    main=`<div class="attrow" style="grid-template-columns:repeat(${Math.min(n,4)},minmax(0,1fr))">${Array.from({length:n},(_,i)=>`<div class="attcell ${i===cur?"cur":""} ${a[i]==="x"?"foul":""}"><span>Attempt ${i+1}</span><b>${esc(a[i]==="x"?"Foul":fmtCell(a[i]))||" "}</b></div>`).join("")}</div>
      <div class="markshow" aria-live="polite">${show}</div>
      <div class="keypad fp">${keys.map(l=>`<button type="button" class="${/^[0-9]$/.test(l)?"":"w"}" data-act="fkey" data-k="${l}" aria-label="${l}" ${dis}>${l}</button>`).join("")}</div>`;
    bar=`<button type="button" class="btn" data-act="fundo">Undo last</button><button type="button" class="btn" data-act="fpass" ${dis}>Pass</button><button type="button" class="btn navy" data-act="fsave">${t?"Save mark":"Next athlete"}</button>`;
  }
  return `${lockBar()}<div class="stack" style="gap:8px">${head}${name}${main}${tools}
    ${fin?`<div class="msg ok">Final. Only the event coordinator can change them now.</div>`:""}</div>
    <div class="pbar"><div class="wrap">${bar}</div></div>`;
}
function fieldCurAttempt(f,r,rule){const a=r.m.a||{};for(let i=0;i<rule.attempts;i++)if(!a[i])return i;return -1}
function fieldPhoneAct(kind,val){
  const f=fieldGroupOpen();if(!f)return;const ev=eventOf(A.cfg,f.k);const G=A.R.groups.get(f.key);if(!G)return;
  const rule=fieldRule(A.cfg,ev);const r=fieldRowsInOrder(G)[A.f.i];if(!r)return;
  const cur=fieldCurAttempt(f,r,rule);
  if(kind==="key"){
    if(/^[0-9]$/.test(val)){if(A.f.typed.length<4&&(A.f.typed||val!=="0"))A.f.typed+=val;fSave();render();return}
    if(val==="Back"){A.f.typed=A.f.typed.slice(0,-1);fSave();render();return}
    if(cur>=0){A.f.typed="";fSave();setMark(f,r.id,cur,"x")}return;
  }
  if(kind==="pass"){if(cur>=0){A.f.typed="";fSave();setMark(f,r.id,cur,"-")}return}
  if(kind==="save"){
    if(A.f.typed&&cur>=0){const v=A.f.typed;A.f.typed="";fSave();setMark(f,r.id,cur,v);return}
    A.f.typed="";A.f.i=(A.f.i+1)%Math.max(1,G.rows.length);fSave();render();window.scrollTo(0,0);
  }
}
