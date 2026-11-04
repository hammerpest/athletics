/* ===== Field Station =====
   The rules are the 2027 instruction sheets (decisions 32 to 35), held as organiser settings. Athletes are
   numbered as they arrive, which is their order for the event. Results are final at the station; the event
   coordinator can overrule (decision 23). Each box saves on its own, so two teachers can work one group. */
function fSave(){ssSet("aths_field",JSON.stringify({station:A.f.station,gid:A.f.gid,i:A.f.i,typed:A.f.typed,a:A.f.a}))}
function fieldGroupOpen(){return A.R?A.R.fgroups.find(f=>f.id===A.f.gid)||null:null}
function fieldDocOf(f){return A.field[f.id]||{ath:{},marks:{}}}
function deepMerge(a,b){const o=Object.assign({},a||{});for(const k in b){if(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k])&&o[k]&&typeof o[k]==="object")o[k]=deepMerge(o[k],b[k]);else o[k]=b[k]}return o}
/* everything a group's screens need, whether or not it has started */
function fieldView(f){
  const ev=eventOf(A.cfg,f.k);const G=A.R.groups.get(f.key);const rule=fieldRule(A.cfg,ev);
  const rows=G?G.arrival:[];
  const plan=ev.style==="height"?(G?G.plan:hjPlan(A.cfg,ev,rule,f.x,f.g,[],{})):null;
  const turn=G?G.turn:{up:-1,next:-1,third:null};
  return {ev,G,rule,rows,plan,turn,fin:!!(G&&G.final),short:!!(G&&G.doc.short)};
}
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
    ${shared?`<div class="msg info">In ${["no","one","two","three","four","five","six","seven","eight"][list.filter((f,i)=>list.findIndex(o=>o.block===f.block)===i&&list.filter(o=>o.block===f.block).length>1).length]} blocks two age groups are on ${esc(name)} at once. Both can be open here.</div>`:""}
    <div class="gcard"><div class="ghead"><h3>${esc(name)}: your day</h3><span class="meta">${plural(list.length,"group")} · tap a group to open it</span></div>
    ${list.map((f,i)=>{const G=R.groups.get(f.key);const fin=!!(G&&G.final);const isNow=!fin&&(i===now||(now>=0&&f.block!=null&&f.block===list[now].block));
      return `<div class="runrow ${isNow?"now":""}"><b>${esc(f.at)}</b><span class="chip ${fin?"final":isNow?"prov":""}">${fin?"Finished":isNow?"Now":"Later"}</span><span class="gname" style="font-weight:700">${esc(sexName(f.x)+" "+grpName(f.g))}</span>
      <button type="button" class="btn ${isNow?"go":""} small" data-act="fopen" data-v="${f.id}">Open</button></div>`}).join("")}</div></div>`;
}
function fieldHead(f,v){
  const name=(A.R.stations.find(s=>s.id===f.station)||{}).name;
  return `<div class="racebar"><span class="racebadge"><small>FIELD</small><b>${esc(f.station)}</b></span><div class="info"><b>${esc(groupLabel(v.ev,f.x,f.g))}</b><span>${esc(name)} · ${esc(f.at)}${f.block!=null?" block":""} · 2 teachers</span></div>
    <button type="button" class="btn" data-act="faddopen" ${v.fin||locked()?"disabled":""}>Add an athlete</button><button type="button" class="btn" data-act="fall">All groups</button><button type="button" class="btn navy big" data-act="ffinish" ${v.fin||locked()?"disabled":""}>${v.fin?"Final":"Group finished"}</button></div>`;
}
function fieldEditable(v){return !locked()&&!v.fin}
function weightLabel(ev,cfg,x,g){const w=weightFor(cfg,ev.k,x,g);return w?(ev.k==="SP"?"Shot":ev.name)+": "+w:""}
function nameCell(r,v,i){
  const up=!v.fin&&i===v.turn.up,nx=!v.fin&&i===v.turn.next;
  return `<td style="text-align:center;font-weight:800">${r.no}</td><td class="nmcell"><span class="htag">${hdot(r.p.h)}<b>${esc(pname(r.p))}</b></span>${up?` <span class="chip info">Now up</span>`:nx?` <span class="chip info">Next</span>`:""}</td>`;
}
function resultCells(r){return `<td>${placeCell(r.place,r.tie)}</td><td class="num"><b>${fmtPts(r.pts||0)}</b></td>`}
function markCell(f,r,ri,a,v,dis){
  const c=v==="x"?"foul":v==="-"?"pass":"";
  return `<input class="markin ${c}" id="mk-${ri}-${a}" data-mark="${esc(r.id)}" data-a="${a}" data-g="${f.id}" aria-label="${esc(pname(r.p))} jump ${a+1}" value="${esc(v==="-"?"-":fmtCell(v))}" placeholder="${dis==="off"?"–":"metres"}" inputmode="decimal" autocomplete="off" ${dis?"disabled":""}>`;
}
function throwCell(f,r,a,v,dis){
  const c=v==="Fair"?"clear":v==="Foul"?"out":v==="Pass"?"pass":"";
  return `<button type="button" class="hjc ${c}" data-act="ttap" data-g="${f.id}" data-id="${esc(r.id)}" data-a="${a}" aria-label="${esc(pname(r.p))} throw ${a+1}: ${esc(v||"not thrown")}" ${dis?"disabled":""}>${esc(v)||" "}</button>`;
}
function bestCell(f,r,ri,dis){
  const fair=Object.values(r.m.t||{}).includes("Fair");
  return `<input class="markin" id="bs-${ri}" data-best="${esc(r.id)}" data-g="${f.id}" aria-label="${esc(pname(r.p))} best mark" value="${esc(fmtCell(r.m.best))}" placeholder="${fair?"metres":"–"}" inputmode="decimal" autocomplete="off" ${dis||!fair?"disabled":""}>`;
}
function hjCell(f,r,h,v,dis,width){
  const c=/O$/.test(v)?"clear":/^X+$/.test(v)?"out":v==="-"?"pass":"";
  return `<button type="button" class="hjc ${c}" ${width?`style="width:${width}px"`:""} data-act="hjtap" data-g="${f.id}" data-id="${esc(r.id)}" data-h="${h}" aria-label="${esc(pname(r.p))} at ${fmtHeight(h)} metres: ${esc(v||"not tried")}" ${dis?"disabled":""}>${esc(v)||" "}</button>`;
}
function raiseText(x,rule){
  return x==="M"?`Boys: up 10 cm first, then 5 cm, then 3 cm once 3 athletes remain. ${rule.tries} tries at each height.`:`Girls: up 5 cm, then 3 cm once 3 athletes remain. ${rule.tries} tries at each height.`;
}
function renderFieldTable(f){
  const v=fieldView(f);const {ev,rule,rows}=v;const edit=fieldEditable(v);const dis=!edit;
  let chips,head,body,note;
  if(ev.style==="height"){
    const hts=v.plan.heights;
    chips=`<span class="chip info">${v.plan.cur!=null?`Next height: ${fmtHeight(v.plan.cur)} m`:"All out"}</span><span class="chip">Start ${fmtHeight(v.plan.start)} m</span><span class="chip">${v.plan.left} left in</span><span class="muted">${esc(raiseText(f.x,rule))}</span>`;
    head=`<th>No.</th><th>Athlete</th>${hts.map(h=>`<th style="text-align:center">${fmtHeight(h)}</th>`).join("")}<th class="num">Best</th><th>Place</th><th class="num">Points</th>`;
    body=rows.map(r=>`<tr><td style="text-align:center;font-weight:800">${r.no}</td><td class="nmcell"><span class="htag">${hdot(r.p.h)}<b>${esc(pname(r.p))}</b></span></td>${hts.map(h=>`<td style="text-align:center;padding:5px">${hjCell(f,r,h,(r.m.h||{})[h]||"",dis||(v.plan.cur!=null&&h>v.plan.cur),60)}</td>`).join("")}<td class="num"><span class="bestm">${r.best?fmtHeight(r.best):"&ndash;"}</span></td>${resultCells(r)}</tr>`);
    note=`Tap a box to step through: O cleared first try, XO second, XXO third, XXX out${rule.pass?", - passed":""}. Equal heights: fewer misses at that height wins, then fewer misses overall, then they share the place.`;
  }else if(ev.style==="throw"){
    const w=weightLabel(ev,A.cfg,f.x,f.g);
    chips=`${w?`<span class="chip info">${esc(w)}</span>`:""}<span class="chip">${rule.attempts} throws each</span><span class="muted">The marker only moves for a better throw. Measure the best throw once, at the end.</span>`;
    head=`<th>No.</th><th>Athlete</th>${Array.from({length:rule.attempts},(_,a)=>`<th style="text-align:center">Throw ${a+1}</th>`).join("")}<th>Best mark</th><th>Place</th><th class="num">Points</th><th>No show</th>`;
    body=rows.map((r,i)=>`<tr class="${!v.fin&&i===v.turn.up?"selrow":""}">${nameCell(r,v,i)}${Array.from({length:rule.attempts},(_,a)=>`<td style="text-align:center;padding:6px">${throwCell(f,r,a,(r.m.t||{})[a]||"",dis)}</td>`).join("")}<td>${bestCell(f,r,i,dis)}</td>${resultCells(r)}<td><button type="button" class="stbtn" data-act="fns" data-g="${f.id}" data-id="${esc(r.id)}" aria-pressed="${!!r.m.ns}" ${dis?"disabled":""}>NS</button></td></tr>`);
    note=`Tap a box to step through Fair, Foul and Pass. If you are unsure which throw is best, measure both and type the better one. Discus and javelin work the same way, each with its own weights. Everyone with a valid mark gets points; no valid mark gets 0.`;
  }else{
    chips=`<span class="chip">${rule.attempts} jumps each</span><button type="button" class="btn small" data-act="fshort" aria-pressed="${v.short}" ${dis?"disabled":""}>${v.short?`2 jumps, then the top ${rule.shortTop} get a 3rd`:`Too many athletes: 2 jumps, then top ${rule.shortTop}`}</button>`;
    head=`<th>No.</th><th>Athlete</th>${Array.from({length:rule.attempts},(_,a)=>`<th>Jump ${a+1}</th>`).join("")}<th class="num">Best</th><th>Place</th><th class="num">Points</th><th>No show</th>`;
    body=rows.map((r,i)=>`<tr class="${!v.fin&&i===v.turn.up?"selrow":""}">${nameCell(r,v,i)}${Array.from({length:rule.attempts},(_,a)=>{const off=a===2&&v.turn.third&&!v.turn.third.has(r.id)&&!(r.m.a||{})[2];return `<td>${markCell(f,r,i,a,(r.m.a||{})[a],off?"off":dis)}</td>`}).join("")}<td class="num"><span class="bestm">${r.best?fmtMark(r.best):"&ndash;"}</span></td>${resultCells(r)}<td><button type="button" class="stbtn" data-act="fns" data-g="${f.id}" data-id="${esc(r.id)}" aria-pressed="${!!r.m.ns}" ${dis?"disabled":""}>NS</button></td></tr>`);
    note=`No. is the order athletes arrived, and is their jumping order. Type digits only: 534 is 5.34 m. Type x for a foul and - for a pass. Everyone with a valid mark gets points; no valid mark gets 0.`;
  }
  const cols=(head.match(/<th/g)||[]).length;
  return `${lockBar()}${fieldHead(f,v)}<div class="row" style="margin-bottom:12px">${chips}</div>
    <div class="panel" style="padding:0;overflow:hidden"><div class="tablewrap"><table class="field-table"><thead><tr>${head}</tr></thead>
      <tbody>${body.join("")||`<tr><td colspan="${cols}" class="muted">No athletes yet. Number them with Add an athlete as they arrive.</td></tr>`}</tbody></table></div></div>
    <p class="muted" style="font-size:.9rem;margin:10px 0 0">${note}</p>
    ${v.fin?`<div class="msg ok" style="margin-top:10px">Final. Results are in. Only the event coordinator can change them now.</div>`:""}`;
}
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
function curMark(f,id){return (fieldDocOf(f).marks||{})[id]||{}}
/* the one way a box changes: kind a (jump), t (throw), h (high jump), best or ns */
function setField(f,id,kind,key,val,noUndo){
  const m=curMark(f,id);const prev=kind==="best"?(m.best||""):kind==="ns"?!!m.ns:(m[kind]||{})[key]||"";
  if(prev===val)return;
  if(!noUndo)fieldUndoPush(f,id,kind,key,prev);
  const patch=kind==="best"?{best:val}:kind==="ns"?{ns:val}:{[kind]:{[key]:val}};
  return fieldWrite(f,{marks:{[id]:patch}});
}
function setMark(f,id,a,v,noUndo){return setField(f,id,"a",a,v,noUndo)}
function setHeight(f,id,h,v,noUndo){return setField(f,id,"h",h,v,noUndo)}
function setThrow(f,id,a,v,noUndo){return setField(f,id,"t",a,v,noUndo)}
function setBest(f,id,v,noUndo){return setField(f,id,"best",0,v,noUndo)}
function setNs(f,id,v,noUndo){return setField(f,id,"ns",0,v,noUndo)}
function hjStep(f,id,h){
  const seq=heightSeq(fieldRule(A.cfg,eventOf(A.cfg,f.k)));
  const v=(curMark(f,id).h||{})[h]||"";
  setHeight(f,id,h,seq[(seq.indexOf(v)+1)%seq.length]);
}
const THROW_SEQ=["","Fair","Foul","Pass"];
function throwStep(f,id,a){const v=(curMark(f,id).t||{})[a]||"";setThrow(f,id,a,THROW_SEQ[(THROW_SEQ.indexOf(v)+1)%THROW_SEQ.length])}
function fieldUndo(){
  const f=fieldGroupOpen();if(!f)return;
  if(A.f.typed){A.f.typed="";fSave();render();return}
  /* final at the station: only the event coordinator can change it (decision 23) */
  if(fieldView(f).fin){toast("Final. Only the event coordinator can change it.");return}
  const u=A.f.undo.filter(x=>x.g===f.id).pop();if(!u){toast("Nothing to undo.");return}
  A.f.undo.splice(A.f.undo.lastIndexOf(u),1);
  setField(f,u.id,u.kind,u.key,u.prev,true);
}
/* an athlete added by mistake, or who left before their first turn, comes off the list */
async function fieldToggle(f,id){
  const at=(fieldDocOf(f).ath||{})[id]||0;
  if(at<=0)return fieldAdd(f,id);
  await fieldWrite(f,{ath:{[id]:-at}});
}
async function fieldAdd(f,id){
  /* their number is the order they arrive (decision 32), even if two are added in one tick */
  const at=Math.max(Date.now(),...Object.values(fieldDocOf(f).ath||{}).map(n=>Math.abs(n)+1));
  await fieldWrite(f,{ath:{[id]:at}});
}
MODALS.fieldAdd=M=>{
  const f=fieldGroupOpen();if(!f)return "";const ev=eventOf(A.cfg,f.k);const on=Object.fromEntries(Object.entries(fieldDocOf(f).ath||{}).filter(e=>e[1]>0));
  const q=(A.f.filter||"").toLowerCase();
  const list=eligible(ev,f.x,f.g).filter(s=>!q||listName(s).toLowerCase().includes(q));
  return `<h2>Add an athlete</h2><p class="muted" style="margin:0">${esc(groupLabel(ev,f.x,f.g))}. Tap each athlete as they arrive: this is their number and their order.</p>
    <input id="ffilter" placeholder="Type to find a name" value="${esc(A.f.filter||"")}" autocomplete="off">
    <div class="addlist">${list.map(s=>{const m=(fieldDocOf(f).marks||{})[s.id];const has=!!m&&JSON.stringify(m).replace(/[{}":,]|\b(a|t|h|ns|best|false)\b|\d+(?=":)/g,"").length>0;return `<button type="button" class="pick ${on[s.id]?"on":""}" data-act="fadd" data-id="${esc(s.id)}" ${on[s.id]&&has?"disabled":""}>${hdot(s.h)}<span>${esc(listName(s))}</span>${on[s.id]?`<span class="muted" style="margin-left:auto;font-size:.8rem">${has?"On the list":"On the list. Tap to take off"}</span>`:""}</button>`}).join("")||`<div class="muted" style="padding:10px">No names match.</div>`}</div>
    <div class="acts"><button type="button" class="btn" data-act="faddnew">Not on the list</button><button type="button" class="btn primary" data-act="closemodal">Done</button></div>`;
};
MODALS.fieldFinish=M=>`<h2>Finish this group?</h2><p style="margin:0">${esc(M.label)}. The results go final and show on every device. After this only the event coordinator can change them.</p>${M.unmeasured?`<div class="msg warn">${plural(M.unmeasured,"athlete has","athletes have")} a fair throw but no best mark yet, so ${M.unmeasured===1?"gets":"get"} 0 points.</div>`:""}<div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back</button><button type="button" class="btn go" data-act="ffinishok">Group finished</button></div>`;
async function fieldFinish(){
  const f=fieldGroupOpen();if(!f)return;A.modal=null;
  await fieldWrite(f,{final:true,finalAt:Date.now(),by:DEV});
}

/* ---------- phone: one athlete at a time (A1.10, A1.19) ---------- */
function nextAfter(rows,i){for(let k=1;k<=rows.length;k++){const j=(i+k)%rows.length;if(!rows[j].m.ns)return j}return i}
/* the jump box the keypad fills: the one tapped to change, else the next empty one */
function jumpBox(v,r){
  const a=r.m.a||{};const n=v.rule.attempts;
  const can=i=>!(i===2&&v.turn.third&&!v.turn.third.has(r.id));
  if(A.f.a!=null&&A.f.a<n&&can(A.f.a))return A.f.a;
  for(let i=0;i<n;i++)if(!a[i]&&can(i))return i;
  return -1;
}
function renderFieldPhone(f){
  const v=fieldView(f);const {ev,rule,rows}=v;const edit=fieldEditable(v);
  if(A.f.i>=rows.length)A.f.i=0;
  const undoBtn=`<button type="button" class="btn" data-act="fundo" ${v.fin?"disabled":""}>Undo last</button>`;
  const r=rows[A.f.i];const dis=edit?"":"disabled";const nx=r?rows[v.turn.next>=0&&A.f.i===v.turn.up?v.turn.next:nextAfter(rows,A.f.i)]:null;
  const w=ev.style==="throw"?weightFor(A.cfg,ev.k,f.x,f.g):"";
  const sub=!r?"No athletes yet":ev.style==="throw"?`No. ${r.no} of ${rows.length}${w?" · "+esc(ev.k==="SP"?"Shot":ev.name)+" "+esc(w):""}`:`Athlete ${r.no} of ${rows.length}`;
  const head=`<div class="racebar ph" style="margin:0"><span class="racebadge sm"><small>FIELD</small><b>${esc(f.station)}</b></span><div class="info"><b>${esc(groupLabel(ev,f.x,f.g))}</b><span>${sub}</span></div></div>`;
  const tools=`<div class="row" style="flex-wrap:nowrap;gap:8px"><button type="button" class="btn" style="flex:1;padding-inline:6px" data-act="faddopen" ${dis}>Add an athlete</button><button type="button" class="btn" style="flex:1;padding-inline:6px" data-act="fall">All groups</button><button type="button" class="btn" style="flex:1;padding-inline:6px" data-act="ffinish" ${dis}>${v.fin?"Final":"Group finished"}</button></div>`;
  if(!r)return `${lockBar()}<div class="stack" style="gap:8px">${head}<div class="msg info">Add the athletes as they arrive.</div>${tools}</div>`;
  const name=`<span class="htag bigath"><span class="hdot h${esc(r.p.h)}" style="width:30px;height:30px;font-size:.9rem">${esc(r.p.h)}</span>${esc(pname(r.p))}</span>
    <span class="muted" style="font-size:.9rem">Next: ${nx&&nx!==r?esc(pname(nx.p)):"No one"}</span>`;
  const pad=keys=>`<div class="keypad fp">${keys.map(l=>`<button type="button" class="${/^[0-9]$/.test(l)?"":"w"}" data-act="fkey" data-k="${l}" aria-label="${l}" ${dis}>${l}</button>`).join("")}</div>`;
  const t=A.f.typed;const show=t.length?(t.length>2?t.slice(0,-2)+"."+t.slice(-2):"0."+t.padStart(2,"0"))+" m":"0.00 m";
  let main,bar;
  if(ev.style==="height"){
    const mh=r.m.h||{};const at=v.plan.cur!=null?v.plan.cur:v.plan.heights[0];const hs=v.plan.heights.filter(h=>h<=at||mh[h]);
    main=`<div class="attrow hts">${hs.map(h=>{const c=mh[h]||"";return `<div class="attcell ${h===at?"cur":""} ${/^X+$/.test(c)?"foul":""}" ${edit?`data-act="hjtap" data-g="${f.id}" data-id="${esc(r.id)}" data-h="${h}"`:""}><span>${fmtHeight(h)} m</span><b>${esc(c)||" "}</b></div>`}).join("")}</div>
      <div class="markshow" aria-live="polite">${v.plan.cur!=null?fmtHeight(at)+" m":"All out"}</div>
      <div class="hjset">${heightSeq(rule).filter(s=>s&&s!=="-").map(s=>`<button type="button" class="btn" data-act="hjset" data-v="${s}" data-h="${at}" ${dis}>${s}</button>`).join("")}</div>`;
    bar=`${undoBtn}${rule.pass?`<button type="button" class="btn" data-act="hjset" data-v="-" data-h="${at}" ${dis}>Pass</button>`:""}<button type="button" class="btn navy" data-act="fnext">Next athlete</button>`;
  }else if(ev.style==="throw"){
    const m=r.m.t||{};const n=rule.attempts;let cur=n;for(let i=0;i<n;i++)if(!m[i]){cur=i;break}
    const fair=Object.values(m).includes("Fair");
    const shown=!t&&r.m.best?fmtMark(markCm(r.m.best))+" m":show;
    main=`<div class="attrow" style="grid-template-columns:repeat(${Math.min(n,4)},minmax(0,1fr))">${Array.from({length:n},(_,i)=>`<div class="attcell ${i===cur?"cur":""} ${m[i]==="Foul"?"foul":""}" ${edit&&m[i]?`data-act="ttap" data-g="${f.id}" data-id="${esc(r.id)}" data-a="${i}"`:""}><span>Throw ${i+1}</span><b style="font-size:1.05rem">${esc(m[i]||"")||" "}</b></div>`).join("")}</div>
      ${cur<n?`<button type="button" class="btn go big" style="min-height:96px" data-act="fthrow" data-v="Fair" ${dis}>Fair</button><div class="row" style="flex-wrap:nowrap"><button type="button" class="btn redfill big" style="flex:1;min-height:96px" data-act="fthrow" data-v="Foul" ${dis}>Foul</button><button type="button" class="btn big" style="flex:1;min-height:96px" data-act="fthrow" data-v="Pass" ${dis}>Pass</button></div>`
       :fair?`<span class="label">Measure the best throw</span><div class="markshow" aria-live="polite">${shown}</div>${pad(["1","2","3","4","5","6","7","8","9","Clear","0","Back"])}`
       :`<div class="msg warn">No fair throw, so no mark and 0 points.</div>`}`;
    bar=`${undoBtn}<button type="button" class="btn navy" data-act="fsave">Next athlete</button>`;
  }else{
    const a=r.m.a||{};const third=!v.turn.third||v.turn.third.has(r.id);const n=rule.attempts;
    const cur=jumpBox(v,r);const pdis=cur<0?"disabled":dis;
    main=`<div class="attrow" style="grid-template-columns:repeat(${Math.min(n,4)},minmax(0,1fr))">${Array.from({length:n},(_,i)=>`<div class="attcell ${i===cur?"cur":""} ${a[i]==="x"?"foul":""}" ${edit&&a[i]?`data-act="fcell" data-a="${i}"`:""}><span>Jump ${i+1}</span><b>${esc(a[i]==="x"?"Foul":fmtCell(a[i]))||(i===2&&!third?"–":" ")}</b></div>`).join("")}</div>
      <div class="markshow" aria-live="polite">${cur<0?"All jumps done":show}</div>${pad(["1","2","3","4","5","6","7","8","9","Foul","0","Back"]).replace(/ ?>(\d|Foul|Back)<\/button>/g,cur<0?" disabled>$1</button>":">$1</button>")}`;
    bar=`${undoBtn}<button type="button" class="btn" data-act="fpass" ${pdis}>Pass</button><button type="button" class="btn navy" data-act="fsave">${t?"Save mark":"Next athlete"}</button>`;
  }
  return `${lockBar()}<div class="stack" style="gap:8px">${head}${name}${main}${tools}
    ${v.fin?`<div class="msg ok">Final. Only the event coordinator can change them now.</div>`:""}</div>
    <div class="pbar"><div class="wrap">${bar}</div></div>`;
}
function fieldPhoneAct(kind,val){
  const f=fieldGroupOpen();if(!f)return;const v=fieldView(f);if(!v.G)return;
  const {ev,rule,rows}=v;const r=rows[A.f.i];if(!r)return;
  const nextUp=()=>{A.f.typed="";A.f.i=A.f.i===v.turn.up&&v.turn.next>=0?v.turn.next:nextAfter(rows,A.f.i);fSave();render();window.scrollTo(0,0)};
  if(ev.style==="throw"){
    if(kind==="key"){
      if(/^[0-9]$/.test(val)){if(A.f.typed.length<4&&(A.f.typed||val!=="0"))A.f.typed+=val}
      else if(val==="Back")A.f.typed=A.f.typed.slice(0,-1);else A.f.typed="";
      fSave();render();return;
    }
    if(kind==="save"){
      if(A.f.typed&&A.f.typed.length<2){toast("Type the whole mark: 1124 is 11.24 m.");return}
      if(A.f.typed)setBest(f,r.id,A.f.typed);nextUp()}
    return;
  }
  const cur=jumpBox(v,r);
  if(kind==="key"){
    if(/^[0-9]$/.test(val)){if(A.f.typed.length<4&&(A.f.typed||val!=="0"))A.f.typed+=val;fSave();render();return}
    if(val==="Back"){A.f.typed=A.f.typed.slice(0,-1);fSave();render();return}
    if(cur>=0){A.f.typed="";A.f.a=null;fSave();setMark(f,r.id,cur,"x")}return;
  }
  if(kind==="pass"){if(cur>=0){A.f.typed="";A.f.a=null;fSave();setMark(f,r.id,cur,"-")}return}
  if(kind==="save"){
    if(A.f.typed&&cur>=0){
      /* the screen shows the mark in metres here, so 2 digits are fine */
      if(A.f.typed.length<2){toast("Type the whole mark: 534 is 5.34 m.");return}
      const m=A.f.typed;A.f.typed="";A.f.a=null;fSave();setMark(f,r.id,cur,m);return}
    /* typed digits are never dropped: with no box to take them, they stay on screen until one is picked */
    if(A.f.typed){toast("No box left. Tap a jump to change it.");return}
    A.f.a=null;nextUp();
  }
}
