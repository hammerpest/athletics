/* ===== Field Station =====
   The rules are the 2027 instruction sheets (decisions 32 to 35), held as organiser settings. Athletes are
   numbered as they arrive, which is their order for the event. Results are final at the station; the event
   coordinator can overrule (decision 23). Each box saves on its own, so two teachers can work one group. */
function fSave(){ssSet("aths_field",JSON.stringify({station:A.f.station,gid:A.f.gid,i:A.f.i,id:A.f.id,typed:A.f.typed,a:A.f.a,summary:A.f.summary,ta:A.f.ta,measure:A.f.measure,keepN:A.f.keepN,guide:A.f.guide}))}
function fieldGroupOpen(){return A.R?A.R.fgroups.find(f=>f.id===A.f.gid)||null:null}
function fieldDocOf(f){return A.field[f.id]||{ath:{},marks:{}}}
function deepMerge(a,b){const o=Object.assign({},a||{});for(const k in b){if(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k])&&o[k]&&typeof o[k]==="object")o[k]=deepMerge(o[k],b[k]);else o[k]=b[k]}return o}
/* everything a group's screens need, whether or not it has started */
function fieldView(f){
  const ev=eventOf(A.cfg,f.k);const G=A.R.groups.get(f.key);const rule=fieldRule(A.cfg,ev);
  const rows=G?G.arrival:[];
  const plan=ev.style==="height"?(G?G.plan:hjPlan(A.cfg,ev,rule,f.x,f.g,[],{})):null;
  const turn=G?G.turn:{up:-1,next:-1,third:null};
  return {ev,G,rule,rows,plan,turn,fin:!!(G&&G.final)};
}
/* the phone stays on an athlete, not a place in the list: someone taken off on another device must never move
   typed work onto the next person. With no rows yet (the first draw after a reload) nothing changes */
function fieldCur(v){
  const rows=v.rows;if(!rows.length)return null;
  let i=A.f.id?rows.findIndex(r=>r.id===A.f.id):-1;
  if(i<0){
    if(A.f.id&&(A.f.typed||A.f.a!=null)){A.f.typed="";A.f.a=null;toast("That athlete was taken off the list. The typed mark was not saved.")}
    i=Math.min(A.f.i,rows.length-1);
  }
  if(A.f.i!==i||A.f.id!==rows[i].id){A.f.i=i;A.f.id=rows[i].id;fSave()}
  return rows[i];
}
function stationGroups(id){return A.R.fgroups.filter(f=>f.station===id).sort((a,b)=>(a.block==null?99:a.block)-(b.block==null?99:b.block))}
/* the group a station is up to: the first one not final */
function stationNow(list){return list.findIndex(f=>{const G=A.R.groups.get(f.key);return !(G&&G.final)})}
function renderField(){
  const f=fieldGroupOpen();
  if(f&&A.R.stations.some(s=>s.id===f.station)){
    if(!fieldStarted(fieldDocOf(f)))return renderTakeNames(f);
    return phoneNow()?renderFieldPhone(f):renderFieldTable(f);
  }
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
function hjOutCell(f,r,h){return hjOutAt(r.m.h,fieldRule(A.cfg,eventOf(A.cfg,f.k)).tries)===+h}
function hjCell(f,r,h,v,dis,width){
  const c=/O$/.test(v)?"clear":hjOutCell(f,r,h)?"out":v.includes("-")?"pass":"";
  return `<button type="button" class="hjc ${c}" ${width?`style="width:${width}px"`:""} data-act="hjtap" data-g="${f.id}" data-id="${esc(r.id)}" data-h="${h}" aria-label="${esc(pname(r.p))} at ${fmtHeight(h)} metres: ${esc(v||"not tried")}" ${dis?"disabled":""}>${esc(v)||" "}</button>`;
}
/* ---------- shared bits for the three sports ---------- */
const hjShow=v=>String(v||"").split("").map(c=>c==="-"?"Pass":c).join(" ");
function hjCm(t){const n=parseFloat(String(t).replace(",","."));if(!(n>0))return 0;return Math.round(n<10?n*100:n)}
const whereOf=i=>i>=4?"above":"below";
const keyBtns=(keys,act,dis)=>keys.map(l=>`<button type="button" class="${/^[0-9]$/.test(l)?"":"w"}" data-act="${act}" data-k="${l}" aria-label="${l}" ${dis?"disabled":""}>${l}</button>`).join("");
const typedShow=t=>t.length?(t.length>2?t.slice(0,-2)+"."+t.slice(-2):"0."+t.padStart(2,"0"))+" m":"0.00 m";
function finConfirm(r,n,where){
  return `<div class="hjpop ljconf ${where}" role="group" aria-label="Finish this athlete"><span>Finish ${esc(pname(r.p))} with ${n}?</span><div class="row" style="flex-wrap:nowrap"><button type="button" class="btn" style="flex:1" data-act="ffinno">Cancel</button><button type="button" class="btn navy" style="flex:1" data-act="ffinyes">Finish</button></div></div>`;
}
function finCell(f,r,i,dis,unit){
  const fin=!!r.m.fin;const n=Object.keys((unit==="throw"?r.m.t:r.m.a)||{}).filter(k=>((unit==="throw"?r.m.t:r.m.a)||{})[k]).length;
  return `<td style="position:relative"><button type="button" class="stbtn" style="min-width:72px" data-act="ffin" data-id="${esc(r.id)}" aria-pressed="${fin}" ${dis?"disabled":""}>${fin?"Put back":"Finish"}</button>${A.f.conf===r.id?finConfirm(r,plural(n,unit==="throw"?"throw":"jump"),whereOf(i)):""}</td>`;
}
/* ---------- A1.9 high jump, iPad ---------- */
function hjPopHtml(f,r,h,where,isUp){
  const box=(r.m.h||{})[h]||"";const d=`data-id="${esc(r.id)}" data-h="${h}" data-box="${esc(box)}" data-up="${isUp?1:0}"`;
  return `<div class="hjpop ${where}" role="group" aria-label="Record a try"><button type="button" class="btn go big" data-act="hjadd" ${d} data-v="O">Clear</button><button type="button" class="btn redfill big" data-act="hjadd" ${d} data-v="X">Miss</button>${fieldRule(A.cfg,eventOf(A.cfg,f.k)).pass?`<button type="button" class="btn big" data-act="hjadd" ${d} data-v="-">Pass</button>`:""}<button type="button" class="btn" data-act="hjadd" ${d} data-v="back">Remove last</button></div>`;
}
function hjControls(f,v,edit){
  const p=v.plan;const sh=fmtHeight(p.sheetStart);
  const startEdited=p.start!==p.sheetStart;const nextShown=p.cur!=null?(p.hs[p.at+1]!=null?p.hs[p.at+1]:p.nextSheet):null;
  const upBy=p.cur!=null&&nextShown!=null?`+${nextShown-p.cur} cm`:"";
  return `<div class="panel hjctl">
    <div class="stepbox"><label class="label" for="hjstart">Start height (m)</label><input id="hjstart" class="markin hjin" inputmode="decimal" data-hjs value="${fmtHeight(p.start)}" ${!edit||p.locked?"disabled":""}><span class="muted hsm">Sheet: ${sh} m ${startEdited&&!p.locked&&edit?`<button type="button" class="fwlink" data-act="hjsreset">Use sheet</button>`:""}${p.locked?" Locked after the first jump.":""}</span></div>
    <div class="stepbox"><label class="label" for="hjnext">Next height (m)</label><input id="hjnext" class="markin hjin" inputmode="decimal" data-hjn value="${nextShown!=null?fmtHeight(nextShown):""}" ${!edit||p.cur==null?"disabled":""}><span class="muted hsm">${p.cur!=null?`Up ${upBy} from ${fmtHeight(p.cur)} m. Sheet: ${fmtHeight(p.nextSheet)} m `:""}${p.nextTyped&&edit?`<button type="button" class="fwlink" data-act="hjnreset">Use sheet</button>`:""}</span></div>
    <div class="stepbox"><span class="label">Bar now</span><b class="stepval" style="text-align:left">${p.cur!=null?fmtHeight(p.cur)+" m":"All out"}</b><span class="muted hsm">Round ${p.cur!=null?p.at+1:p.heights.length}</span></div>
    <span class="chip">${p.left} left in</span><button type="button" class="btn" style="margin-left:auto" data-act="fundo" ${v.fin?"disabled":""}>Undo last</button></div>${p.left===3&&p.cur!=null&&!v.fin?`<div class="msg warn" style="margin-bottom:12px">3 left. The sheet raise is now 3 cm. The official decides the next height.</div>`:""}`;
}
function hjTable(f,v,edit){
  const {rows,plan}=v;const hts=plan.heights;const up=!v.fin&&v.turn.up>=0?v.rows[v.turn.up]:null;
  const head=`<th class="hjs1">No.</th><th class="hjs2">Athlete</th>${hts.map(h=>`<th style="text-align:center" class="${h===plan.cur?"curh":""}">${fmtHeight(h)}</th>`).join("")}<th class="num">Best</th><th>Place</th><th class="num">Points</th>`;
  const body=rows.map((r,i)=>`<tr><td class="hjs1" style="text-align:center;font-weight:800">${r.no}</td><td class="nmcell hjs2"><span class="htag">${hdot(r.p.h)}<b>${esc(pname(r.p))}</b></span>${up&&r.id===up.id?` <span class="chip">Up</span>`:v.turn.next>=0&&!v.fin&&rows[v.turn.next].id===r.id?` <span class="chip">Next</span>`:""}</td>${hts.map(h=>{
    const val=(r.m.h||{})[h]||"";const isUp=!!up&&r.id===up.id&&h===plan.cur;const open=A.f.pop&&A.f.pop.id===r.id&&+A.f.pop.h===h;
    const dis=!edit||(plan.cur!=null&&h>plan.cur)||(plan.cur==null&&!val);
    const c=/O$/.test(val)?"clear":hjOutCell(f,r,h)?"out":val.includes("-")?"pass":"";
    return `<td style="text-align:center;padding:5px;position:relative"><button type="button" class="hjc ${c}${isUp?" upc":""}" data-act="hjpop" data-id="${esc(r.id)}" data-h="${h}" aria-label="${esc(pname(r.p))} at ${fmtHeight(h)} metres: ${esc(val?hjShow(val):"not tried")}${isUp?", up now":""}" ${dis?"disabled":""}>${esc(hjShow(val))||" "}</button>${open?hjPopHtml(f,r,h,whereOf(i),isUp):""}</td>`}).join("")}<td class="num"><span class="bestm">${r.best?fmtHeight(r.best):"&ndash;"}</span></td>${resultCells(r)}</tr>`);
  return {head,body};
}
/* a try added to a box. The box the athlete on screen is up on only takes a try if it is as it was drawn (the other teacher may have saved it) */
function hjAdd(el){
  const f=fieldGroupOpen();if(!f)return;const id=el.dataset.id,h=+el.dataset.h,c=el.dataset.v;A.f.pop=null;
  if(c==="back"){const cur=((curMark(f,id).h||{})[h])||"";if(cur)setHeight(f,id,h,cur.slice(0,-1));else render();return}
  if(el.dataset.up==="1")return hjTry(f,id,h,c,el.dataset.box);
  const cur=((curMark(f,id).h||{})[h])||"";
  if(hjClosed(cur)||cur.length>=fieldRule(A.cfg,eventOf(A.cfg,f.k)).tries){toast("That box is closed. Use Remove last to change it.");render();return}
  setHeight(f,id,h,cur+c);
}
function hjTyped(inp){
  const f=fieldGroupOpen();if(!f)return;const v=fieldView(f);const p=v.plan;const cm=hjCm(inp.value);
  if(inp.hasAttribute("data-hjs")){
    if(p.locked){toast("The start height is locked after the first jump.");render();return}
    if(cm<50||cm>250){toast("Type the height in metres, for example 1.10.");render();return}
    return fieldWrite(f,{hs:cm===p.sheetStart?0:cm});
  }
  if(p.cur==null)return;
  if(cm<=p.cur||cm>250){toast("The next height must be higher than the bar now ("+fmtHeight(p.cur)+" m).");render();return}
  return fieldWrite(f,{hn:{[p.at+1]:cm}});
}
function hjNowScroll(){const g=document.querySelector(".hjgrid");const c=g&&g.querySelector("th.curh");if(!c){A.f.sc=null;return}if(A.f.sc!==c.textContent){A.f.sc=c.textContent;g.scrollLeft=Math.max(0,c.offsetLeft-320)}}
/* ---------- A1.8 long jump, iPad ---------- */
function ljPopHtml(f,r,a,where){
  const d=`data-id="${esc(r.id)}" data-a="${a}"`;
  return `<div class="hjpop ljpop ${where}" role="group" aria-label="Record a jump"><div class="markshow" aria-live="polite">${typedShow(A.f.typed)}</div><div class="keypad fp">${keyBtns(["1","2","3","4","5","6","7","8","9","Clear","0","Back"],"ljkey")}</div>
    <div class="row" style="flex-wrap:nowrap"><button type="button" class="btn redfill big" style="flex:1" data-act="ljput" data-v="x">Foul</button><button type="button" class="btn big" style="flex:1" data-act="ljput" data-v="-">Pass</button></div>
    <div class="row" style="flex-wrap:nowrap"><button type="button" class="btn" style="flex:1" data-act="ljcancel">Cancel</button><button type="button" class="btn navy" style="flex:1" data-act="ljput" data-v="save">Save mark</button></div></div>`;
}
function ljKey(k){
  if(/^[0-9]$/.test(k)){if(A.f.typed.length<4&&(A.f.typed||k!=="0"))A.f.typed+=k}else if(k==="Back")A.f.typed=A.f.typed.slice(0,-1);else A.f.typed="";
  fSave();render();
}
function ljPut(v){
  const f=fieldGroupOpen();const pop=A.f.pop;if(!f||!pop)return;const id=pop.id,a=pop.a;
  if(v==="save"){
    if(!A.f.typed){A.f.pop=null;render();return}
    if(A.f.typed.length<2){toast("Type the whole mark: 534 is 5.34 m.");return}
    v=A.f.typed;
  }
  A.f.typed="";A.f.pop=null;fSave();setMark(f,id,a,v);
}
function ljPopOpen(el){
  const id=el.dataset.id,a=+el.dataset.a;const f=fieldGroupOpen();if(!f)return;
  const open=A.f.pop&&A.f.pop.id===id&&A.f.pop.a===a;
  if(open){A.f.pop=null;A.f.typed=""}else{const cur=((curMark(f,id).a||{})[a])||"";A.f.pop={id,a};A.f.typed=/^[0-9]+$/.test(cur)?cur:""}
  A.f.conf=null;fSave();render();
}
function keepControls(v,dis){
  const n=A.f.keepN||4;
  return `<label class="label" for="keepn" style="display:flex;align-items:center;gap:8px;margin-left:auto">Keep top<input id="keepn" class="markin hjin" style="width:72px" inputmode="numeric" data-keepn value="${n}" ${dis?"disabled":""}></label><button type="button" class="btn" data-act="fkeep" ${dis?"disabled":""}>Keep top ${n}</button>${A.f.keepPrev&&A.f.keepPrev.length?`<button type="button" class="btn" data-act="fkeepundo" ${dis?"disabled":""}>Undo Keep top</button>`:""}`;
}
async function fieldKeep(){
  const f=fieldGroupOpen();if(!f)return;const v=fieldView(f);const n=Math.max(1,+A.f.keepN||4);
  if(!roundDone(v.rows,v.rule)){A.f.keepMsg="Finish this round first: some athletes have not jumped yet.";A.f.keepPrev=[];render();return}
  const ids=keepTop(v.rows,n,v.rule);
  if(!ids.length){A.f.keepMsg="Only "+v.rows.filter(r=>r.best>0).length+" marks so far. No one is finished.";A.f.keepPrev=[];render();return}
  A.f.keepPrev=ids;A.f.keepMsg="Kept the top "+n+" (equal marks stay in). "+plural(ids.length,"athlete")+" finished. Tap Put back on an athlete to change it.";
  await fieldWrite(f,{marks:Object.fromEntries(ids.map(id=>[id,{fin:true}]))});
}
async function fieldKeepUndo(){
  const f=fieldGroupOpen();if(!f)return;const ids=A.f.keepPrev||[];A.f.keepPrev=[];A.f.keepMsg="";
  await fieldWrite(f,{marks:Object.fromEntries(ids.map(id=>[id,{fin:false}]))});
}
/* ---------- shot put and discus, iPad (A1.18, A1.24) ---------- */
function throwDis(v,r,a,val){
  const m=r.m;const n=Object.keys(m.t||{}).filter(k=>(m.t||{})[k]).length;const again=!!((v.G&&v.G.doc.tg)||{})[r.id];
  return !val&&(m.ns||m.fin||(a>=1&&!again)||a>n);
}
function throwTag(v,r){
  if(r.m.ns)return "";const again=!!((v.G&&v.G.doc.tg)||{})[r.id];
  const wo=weightOpts(v.ev,{x:v.G.fg.x,g:v.G.fg.g,k:v.ev.k});const wk=((v.G.doc.wt)||{})[r.id];const wchip=wo.length&&wk?` <span class="chip info">${esc(wo[wk-1].w)}</span>`:"";
  if(again)return `<span class="chip info">Throws again</span>`+wchip;
  if(r.fair)return `<span class="chip">Participation</span>`+wchip;
  return (Object.values(r.m.t||{}).some(Boolean)?`<span class="chip">No fair throw</span>`:"")+wchip;
}
function setdControl(v,dis){
  const s=v.G&&v.G.setd?v.G.setd:{cm:0,low:0,ok:false,n:0};
  const bad=s.n>0&&!s.ok?(s.cm?`The set distance must be lower than the lowest measured mark (${fmtMark(s.low)} m).`:"Type one set distance for everyone who was not measured."):"";
  const doc=v.G?v.G.doc:{};
  return {html:`<label class="label" for="setd" style="display:flex;align-items:center;gap:8px;margin-left:auto">Set distance for everyone not measured (m)<input id="setd" class="markin hjin" inputmode="decimal" data-setd value="${esc(doc.setd?fmtCell(doc.setd):"")}" ${dis?"disabled":""}></label>`,bad};
}
function throwAgainTiles(f,v,cls){
  const doc=v.G?v.G.doc:{};const tg=doc.tg||{};
  return v.rows.filter(r=>!r.m.ns&&!r.m.fin).map(r=>{const t1=((r.m.t||{})[0])||"";const on=!!tg[r.id];
    return `<button type="button" class="namebtn ${on?"sel":""}" ${cls?`style="width:100%"`:""} aria-pressed="${on}" data-act="tgtick" data-id="${esc(r.id)}"><span class="medal m4" style="width:30px;height:30px;background:#ffffff;color:#1d3160">${r.no}</span>${hdot(r.p.h)}<span class="t">${esc(pname(r.p))}</span><span class="chip ${t1==="Foul"?"bad":""}">${esc(t1)}</span>${cls?"":`<b>${on?"Throws again":"Participation"}</b>`}</button>`}).join("");
}
function renderThrowAgain(f){
  const v=fieldView(f);const doc=v.G.doc;const n=Object.keys(doc.tg||{}).filter(k=>doc.tg[k]).length;const ph=phoneNow();const guide=A.f.guide||10;
  const name=(A.R.stations.find(s=>s.id===f.station)||{}).name;
  const start=`<button type="button" class="btn navy ${ph?"":"big"}" data-act="tgstart" ${locked()?"disabled":""}>Start throws 2 and 3</button>`;
  const head=ph?`<div class="racebar ph" style="margin:0"><span class="racebadge sm"><small>FIELD</small><b>${esc(f.station)}</b></span><div class="info"><b>Who throws again</b><span>${n} ticked, about ${guide}</span></div></div>`
   :`<div class="racebar"><span class="racebadge"><small>FIELD</small><b>${esc(f.station)}</b></span><div class="info"><b>${esc(groupLabel(v.ev,f.x,f.g))}: who throws again</b><span>${v.rows.length} thrown once · ${esc(name)} · ${esc(f.at)}${f.block!=null?" block":""}</span></div><button type="button" class="btn" data-act="fall">All groups</button>${start}</div>`;
  return `${lockBar()}<div class="stack" style="gap:${ph?8:10}px">${head}
    <div class="msg ok">${ph?"Tick who throws again. Everyone else is participation.":"Everyone has thrown once. Look at the markers, then tick who throws again. Everyone else is participation. You can change this before throw 2 starts."}</div>
    ${ph?"":`<div class="row" style="gap:12px;align-items:center"><span class="chip info">${n} ticked</span><label class="label" for="agn" style="display:flex;align-items:center;gap:8px">About<input id="agn" class="markin hjin" style="width:72px" inputmode="numeric" data-guide value="${guide}"></label><span class="muted hsm">A guide only. Tick as many or as few as you like.</span></div>`}
    <div class="${ph?"stack":"namegrid names3"}" ${ph?`style="gap:8px"`:""}>${throwAgainTiles(f,v,ph)}</div></div>
    ${ph?`<div class="pbar"><div class="wrap"><button type="button" class="btn" data-act="fall">All groups</button>${start}</div></div>`:""}`;
}
/* ---------- the group table, all three sports ---------- */
function renderFieldTable(f){
  const v=fieldView(f);const {ev,rule,rows}=v;const edit=fieldEditable(v);const dis=!edit;
  if(ev.style==="throw"&&v.turn.pick&&!v.fin)return renderThrowAgain(f);
  let chips,head,body,note,extra="",wrapCls="";
  if(ev.style==="height"){
    const t=hjTable(f,v,edit);head=t.head;body=t.body;wrapCls="hjgrid";extra=hjControls(f,v,edit);chips="";
    note=`Tap the highlighted box for the athlete who is up, then Clear, Miss or Pass. O is a clear, X a miss. A pass after a miss shows as X Pass. ${rule.tries} misses in a row is out, and misses carry on to the next height after a pass. A new height is added after each round, and the list goes on until every athlete is out. It scrolls sideways, with the names kept in view, and opens at the height now. Tap any other box to fix it. Equal heights: fewer misses at that height wins, then fewer misses overall, then they share the place.`;
  }else if(ev.style==="throw"){
    const w=weightLabel(ev,A.cfg,f.x,f.g);const doc=v.G?v.G.doc:{};const again=Object.keys(doc.tg||{}).filter(k=>doc.tg[k]).length;
    const sd=setdControl(v,dis);const meas=rows.filter(r=>r.m.best&&r.fair).length;
    chips=`${w?`<span class="chip info">${esc(w)}</span>`:""}<span class="chip">${again} throwing again, about ${A.f.guide||10}</span>${doc.tgo&&!v.fin?`<button type="button" class="btn small" data-act="tgchange" ${dis?"disabled":""}>Change who throws again</button>`:""}<span class="chip">${meas} measured, about 5</span>${sd.html}`;
    extra=sd.bad?`<div class="msg warn" style="margin-bottom:12px">${esc(sd.bad)}</div>`:"";
    head=`<th>No.</th><th>Athlete</th>${Array.from({length:rule.attempts},(_,a)=>`<th style="text-align:center">Throw ${a+1}</th>`).join("")}<th>Measured mark</th><th>Place</th><th class="num">Points</th><th>No show</th><th>Finish</th>`;
    body=rows.map((r,i)=>`<tr><td style="text-align:center;font-weight:800">${r.no}</td><td class="nmcell"><span class="htag">${hdot(r.p.h)}<b>${esc(pname(r.p))}</b></span> ${throwTag(v,r)}</td>${Array.from({length:rule.attempts},(_,a)=>{const val=(r.m.t||{})[a]||"";return `<td style="text-align:center;padding:6px">${throwCell(f,r,a,val,dis||throwDis(v,r,a,val))}</td>`}).join("")}<td>${bestCell(f,r,i,dis)}</td>${resultCells(r)}<td><button type="button" class="stbtn" data-act="fns" data-g="${f.id}" data-id="${esc(r.id)}" aria-pressed="${!!r.m.ns}" ${dis?"disabled":""}>NS</button></td>${finCell(f,r,i,dis,"throw")}</tr>`);
    note=`Everyone throws once. The official picks who throws again. Tap a box to step through Fair, Foul and Pass. Type a measured mark only for the athletes you measured (534 is 5.34 m). Everyone else with a fair throw is participation: they get the set distance, share a place and get 4 points. No fair throw or no show is 0. Discus and javelin work the same way, each with its own weights.`;
  }else{
    chips=`<span class="chip">Up to ${rule.attempts} jumps each</span><span class="chip">${rows.filter(r=>!r.m.ns&&!r.m.fin&&attemptsUsed(r,rule)<rule.attempts).length} still jumping</span>${keepControls(v,dis)}`;
    extra=A.f.keepMsg?`<div class="msg ok" style="margin-bottom:12px">${esc(A.f.keepMsg)}</div>`:"";
    head=`<th>No.</th><th>Athlete</th>${Array.from({length:rule.attempts},(_,a)=>`<th style="text-align:center">Jump ${a+1}</th>`).join("")}<th class="num">Best</th><th>Place</th><th class="num">Points</th><th>No show</th><th>Finish</th>`;
    body=rows.map((r,i)=>`<tr class="${!v.fin&&i===v.turn.up?"selrow":""}">${nameCell(r,v,i)}${Array.from({length:rule.attempts},(_,a)=>{
      const val=(r.m.a||{})[a]||"";const isUp=!v.fin&&i===v.turn.up&&a===attemptsUsed(r,rule);const open=A.f.pop&&A.f.pop.id===r.id&&A.f.pop.a===a;const off=!val&&(r.m.ns||r.m.fin);
      const c=(val==="x"?"foul":val==="-"?"pass":"")+(isUp?" upc":"");
      return `<td style="text-align:center;padding:5px;position:relative"><button type="button" class="hjc ${c}" data-act="ljpop" data-id="${esc(r.id)}" data-a="${a}" aria-label="${esc(pname(r.p))} jump ${a+1}${isUp?", up now":""}" ${dis||off?"disabled":""}>${off?"&ndash;":esc(val==="x"?"X":val==="-"?"Pass":fmtCell(val))||" "}</button>${open?ljPopHtml(f,r,a,whereOf(i)):""}</td>`}).join("")}<td class="num"><span class="bestm">${r.best?fmtMark(r.best):"&ndash;"}</span></td>${resultCells(r)}<td><button type="button" class="stbtn" data-act="fns" data-g="${f.id}" data-id="${esc(r.id)}" aria-pressed="${!!r.m.ns}" ${dis?"disabled":""}>NS</button></td>${finCell(f,r,i,dis,"jump")}</tr>`);
    note=`Tap the highlighted box for the athlete who is up. Type the distance (534 is 5.34 m), or tap Foul or Pass. Everyone can take up to 3 jumps, in the same order each round. Finish ends an athlete's jumping, and Keep top N finishes everyone below the Nth best mark. The official decides. Everyone with a valid mark gets points; no valid mark gets 0.`;
  }
  const cols=(head.match(/<th/g)||[]).length;
  return `${lockBar()}${fieldHead(f,v)}<div class="row" style="margin-bottom:12px;gap:12px;align-items:center">${chips}</div>${extra}
    <div class="panel" style="padding:0;${wrapCls?"":"overflow:hidden"}"><div class="tablewrap ${wrapCls}" ${wrapCls?"":`style="overflow:visible"`}><table class="field-table"><thead><tr>${head}</tr></thead>
      <tbody>${body.join("")||`<tr><td colspan="${cols}" class="muted">No athletes yet. Add them with Add an athlete as they arrive.</td></tr>`}</tbody></table></div></div>
    <p class="muted" style="font-size:.9rem;margin:10px 0 0">${note}</p>
    ${v.fin?`<div class="msg ok" style="margin-top:10px">Final. Results are in. Only the event coordinator can change them now.</div>`:""}`;
}
function fieldUndoPush(f,id,kind,key,prev,val){A.f.undo.push({g:f.id,id,kind,key,prev,val});A.f.undo=A.f.undo.slice(-40)}
async function fieldWrite(f,patch){
  if(locked()){toast("Results are locked. Nothing can be changed.");return}
  const G=A.R.groups.get(f.key);
  if(G&&G.final)patch=Object.assign({},patch,{over:Date.now()});
  A.field[f.id]=deepMerge(Object.assign({k:f.k,x:f.x,g:f.g},fieldDocOf(f)),patch);recompute();
  /* after the focus has moved, so the box the helper is now in stays focused */
  setTimeout(()=>render(),0);
  await w(()=>A.store.update("field/"+f.id,Object.assign({k:f.k,x:f.x,g:f.g},patch)));
}
/* final at the station: only the event coordinator can change it, from the Recorder (decision 23) */
function stationFinal(f){if(A.job!=="field"||!fieldView(f).fin)return false;toast("Final. Only the event coordinator can change it.");render();return true}
function curMark(f,id){return (fieldDocOf(f).marks||{})[id]||{}}
/* the one way a box changes: kind a (jump), t (throw), h (high jump), best or ns */
function setField(f,id,kind,key,val,noUndo){
  if(stationFinal(f))return;
  const m=curMark(f,id);const prev=kind==="best"?(m.best||""):kind==="ns"?!!m.ns:kind==="fin"?!!m.fin:(m[kind]||{})[key]||"";
  if(prev===val)return;
  if(!noUndo)fieldUndoPush(f,id,kind,key,prev,val);
  const patch=kind==="best"?{best:val}:kind==="ns"?{ns:val}:kind==="fin"?{fin:val}:{[kind]:{[key]:val}};
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
/* Clear, Miss or Pass: one more try in the box of the athlete on screen, and only if that box is as it was drawn:
   the other teacher may have just saved this try. A double tap counts once. The phone then moves to whoever is up */
let hjLast=0;
function hjTry(f,id,h,c,seen){
  const now=performance.now();if(now-hjLast<300)return;hjLast=now;
  const v=fieldView(f);const r=v.rows.find(x=>x.id===id);const box=r?(r.m.h||{})[h]||"":"";
  if(!r||v.plan.cur!==h||!v.plan.isIn(id,h)||hjClosed(box)||box!==seen){toast("That try was just saved on another device. Check who is up.");render();return}
  setHeight(f,id,h,box+c);
  const up=fieldView(f).turn.up;if(up>=0){A.f.i=up;A.f.id=null;fSave()}
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
  if(u.kind==="h"){
    A.f.id=u.id;fSave();
    /* the other teacher may have added a try since: take off this one try, never theirs */
    const now=(curMark(f,u.id).h||{})[u.key]||"";
    if(now!==u.val){
      const mine=String(u.val).slice(String(u.prev).length);
      if(mine.length!==1||!now.endsWith(mine)){toast("That box has changed since. Tap the box to fix it.");render();return}
      return setField(f,u.id,"h",u.key,now.slice(0,-1),true);
    }
  }
  setField(f,u.id,u.kind,u.key,u.prev,true);
  /* the bar stays where the boxes show, so tell the teacher if this try was at a lower height */
  if(u.kind==="h"&&fieldView(f).rows.some(r=>Object.keys(r.m.h||{}).some(h=>+h>u.key&&r.m.h[h])))toast("The bar has moved on. Check this athlete's box.");
}
/* an athlete added by mistake, or who left before their first turn, comes off the list */
async function fieldToggle(f,id){
  if(stationFinal(f))return;
  /* the sign says on or off the list; the size keeps their number, so coming back gives them the same one */
  const at=(fieldDocOf(f).ath||{})[id]||0;
  if(!at)return fieldAdd(f,id);
  await fieldWrite(f,{ath:{[id]:-at}});
}
/* A1.20 Take Names: every group opens here, for all five sports (decision 44). The tap order is the athlete's
   number and their order for the event. A second tap takes them off and the numbers close up: nobody has
   had a turn yet. Add an athlete stays for late arrivals once the group has started. */
function weightOpts(ev,f){
  if(ev.style!=="throw")return [];const w=weightFor(A.cfg,ev.k,f.x,f.g);if(!/years/.test(w))return [];
  return w.split(", ").map(t=>{const m=t.match(/^(\d+) years (.+)$/);return m?{age:m[1],w:m[2]}:null}).filter(Boolean);
}
async function fieldWeight(f,id,k){await fieldWrite(f,{wt:{[id]:k}})}
function fReset(){A.f.pop=null;A.f.conf=null;A.f.summary=false;A.f.ta=false;A.f.measure=false;A.f.mopen=null;A.f.edit=false;A.f.cut=false;A.f.typed="";A.f.a=null}
function renderTakeNames(f){
  const v=fieldView(f);const lk=locked();const ph=phoneNow();
  const name=(A.R.stations.find(s=>s.id===f.station)||{}).name;
  const word=v.ev.style==="throw"?"throwing":"jumping";
  const nos=new Map(v.rows.map(r=>[r.id,r.no]));
  const q=(A.f.q||"").toLowerCase();
  const list=eligible(v.ev,f.x,f.g).filter(s=>!q||listName(s).toLowerCase().includes(q)||nos.has(s.id));
  const sub=`${plural(v.rows.length,"athlete")} · ${esc(name)} · ${esc(f.at)}${f.block!=null?" block":""}`;
  const start=`<button type="button" class="btn navy ${ph?"":"big"}" data-act="fstart" ${lk?"disabled":""}>Start ${word}</button>`;
  const all=`<button type="button" class="btn" data-act="fall">All groups</button>`;
  const notOn=`<button type="button" class="btn" data-act="faddnew" ${lk?"disabled":""}>Not on the list</button>`;
  const head=ph?`<div class="racebar ph" style="margin:0"><span class="racebadge sm"><small>FIELD</small><b>${esc(f.station)}</b></span><div class="info"><b>${esc(groupLabel(v.ev,f.x,f.g))}: Take Names</b><span>${sub}</span></div></div>`
    :`<div class="racebar"><span class="racebadge"><small>FIELD</small><b>${esc(f.station)}</b></span><div class="info"><b>${esc(groupLabel(v.ev,f.x,f.g))}: Take Names</b><span>${sub}</span></div>${all}${notOn}${start}</div>`;
  const opts=weightOpts(v.ev,f);const wt=(fieldDocOf(f).wt)||{};
  const tile=s=>{const no=nos.get(s.id);return `<button type="button" class="namebtn ${no?"sel":""}" ${opts.length?`style="flex:1;min-width:0"`:""} aria-pressed="${!!no}" data-act="ftake" data-id="${esc(s.id)}" ${lk?"disabled":""}>${no?`<span class="medal m4" style="width:30px;height:30px;background:#ffffff;color:#1d3160">${no}</span>`:hdot(s.h)}<span class="t">${esc(s.f+" "+s.s)}</span></button>`};
  /* discus 12 and 13: the weight differs by age, so the teacher picks it for each athlete; no exact age is stored (decision 84) */
  const grid=list.map(s=>opts.length?`<div class="panel" style="padding:8px 10px;display:flex;align-items:center;gap:8px">${tile(s)}${opts.map((o,k)=>`<button type="button" class="stbtn" style="min-width:${o.w.length>5?76:60}px" data-act="wtset" data-id="${esc(s.id)}" data-v="${k+1}" aria-pressed="${wt[s.id]===k+1}" ${lk?"disabled":""}>${esc(o.w)}</button>`).join("")}</div>`:tile(s)).join("");
  const needW=opts.length?v.rows.filter(r=>!wt[r.id]).length:0;
  return `${lockBar()}<div class="stack" style="gap:${ph?8:10}px">${head}
    <div class="prompt" style="margin:0">Tap each athlete as they arrive. This is their number and their ${word} order.</div>
    ${opts.length?`<div class="prompt" style="margin:0">Then pick the ${esc(v.ev.name.toLowerCase())} weight for each athlete: ${opts.map(o=>o.age+" years is "+esc(o.w)).join(", ")}.</div>`:""}${needW?`<div class="msg warn">${plural(needW,"athlete still needs","athletes still need")} a weight.</div>`:""}
    <label class="label" style="display:flex;flex-direction:column;gap:4px">Find an athlete<input type="search" id="tnfilter" placeholder="Type part of a name" value="${esc(A.f.q||"")}" autocomplete="off"></label>
    <div class="namegrid ${opts.length?"names2":"names4"}">${grid||`<span class="muted">No names match.</span>`}</div></div>
    ${ph?`<div class="pbar"><div class="wrap">${all}${notOn}${start}</div></div>`:""}`;
}
async function fieldTake(f,id){
  if(((fieldDocOf(f).ath||{})[id]||0)>0)return fieldWrite(f,{ath:{[id]:0}});
  return fieldAdd(f,id);
}
async function fieldStart(){
  const f=fieldGroupOpen();if(!f)return;
  A.f.q="";A.f.i=0;A.f.id=null;fSave();
  await fieldWrite(f,{started:true});window.scrollTo(0,0);
}
async function fieldAdd(f,id){
  /* their number is the order they arrive (decision 32), even if two are added in one tick */
  const at=Math.max(Date.now(),...Object.values(fieldDocOf(f).ath||{}).map(n=>Math.abs(n)+1));
  await fieldWrite(f,{ath:{[id]:at}});
}
function modalGroup(){return (A.modal&&A.modal.gid&&fieldGroupById(A.modal.gid))||fieldGroupOpen()}
MODALS.fieldAdd=M=>{
  const f=modalGroup();if(!f)return "";const ev=eventOf(A.cfg,f.k);const on=Object.fromEntries(Object.entries(fieldDocOf(f).ath||{}).filter(e=>e[1]>0));
  const q=(A.f.filter||"").toLowerCase();
  const list=eligible(ev,f.x,f.g).filter(s=>!q||listName(s).toLowerCase().includes(q));
  return `<h2>Add an athlete</h2><p class="muted" style="margin:0">${esc(groupLabel(ev,f.x,f.g))}. Tap each athlete as they arrive: this is their number and their order.</p>
    <input id="ffilter" placeholder="Type to find a name" value="${esc(A.f.filter||"")}" autocomplete="off">
    <div class="addlist">${list.map(s=>{const m=(fieldDocOf(f).marks||{})[s.id];const has=!!m&&JSON.stringify(m).replace(/[{}":,]|\b(a|t|h|ns|best|false)\b|\d+(?=":)/g,"").length>0;return `<button type="button" class="pick ${on[s.id]?"on":""}" data-act="fadd" data-id="${esc(s.id)}" ${on[s.id]&&has?"disabled":""}>${hdot(s.h)}<span>${esc(listName(s))}</span>${on[s.id]?`<span class="muted" style="margin-left:auto;font-size:.8rem">${has?"On the list":"On the list. Tap to take off"}</span>`:""}</button>`}).join("")||`<div class="muted" style="padding:10px">No names match.</div>`}</div>
    <div class="acts"><button type="button" class="btn" data-act="faddnew">Not on the list</button><button type="button" class="btn primary" data-act="closemodal">Done</button></div>`;
};
MODALS.fieldFinish=M=>`<h2>Finish this group?</h2><p style="margin:0">${esc(M.label)}. The results go final and show on every device. After this only the event coordinator can change them.</p>${M.unmeasured?`<div class="msg warn">${plural(M.unmeasured,"athlete has","athletes have")} a fair throw but no measured mark and no set distance yet, so ${M.unmeasured===1?"gets":"get"} 0 points.</div>`:""}<div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back</button><button type="button" class="btn go" data-act="ffinishok">Group finished</button></div>`;
async function fieldFinish(){
  const f=fieldGroupOpen();if(!f)return;A.modal=null;
  await fieldWrite(f,{final:true,finalAt:Date.now(),by:DEV});
}

/* ---------- phone: one athlete at a time (A1.10, A1.19, A1.21) and the group results (A1.22, A1.23, A1.27) ---------- */
function liveAth(r,v){return !r.m.ns&&!r.m.fin&&(v.ev.style==="throw"?true:attemptsUsed(r,v.rule)<v.rule.attempts)}
function nextAfter(rows,i,v){for(let k=1;k<=rows.length;k++){const j=(i+k)%rows.length;if(!rows[j].m.ns&&!rows[j].m.fin&&(!v||liveAth(rows[j],v)))return j}return i}
/* a mark just saved moves the phone to the next athlete still going, as drawn on A1.10 */
function phoneMove(v){A.f.typed="";A.f.a=null;A.f.i=nextAfter(v.rows,A.f.i,v);A.f.id=null;A.f.conf=null;fSave()}
function summaryDetail(v,r){
  const st=v.ev.style;
  if(st==="height")return r.best?`${r.failsAtBest} ${r.failsAtBest===1?"miss":"misses"} at best, ${r.fails} in all`:"No height";
  const key=st==="throw"?r.m.t:r.m.a;const n=Object.values(key||{}).filter(Boolean).length;
  const one=x=>st==="throw"?x:(x==="x"?"Foul":x==="-"?"Pass":fmtMark(markCm(x)));
  const list=Object.keys(key||{}).sort().map(k=>one(key[k])).filter(Boolean).join(", ");
  if(r.m.ns)return "Did not take part";
  return (list||"No "+(st==="throw"?"throws":"jumps"))+(r.part?" (participation)":"")+(r.m.fin&&n<v.rule.attempts?" (finished early)":"");
}
function summaryBest(v,r){
  if(r.m.ns)return "No show";
  if(v.ev.style==="height")return r.best?fmtHeight(r.best)+" m":"No height";
  return r.best?fmtMark(r.best)+" m"+(r.part?" set":""):"No mark";
}
function renderPhoneSummary(f,v){
  const G=v.G;const sent=v.fin;const word=v.ev.style==="throw"?"throwing":"jumping";
  const setd=G.setd||{n:0,ok:true};const blocked=v.ev.style==="throw"&&setd.n>0&&!setd.ok;
  const stillOn=!sent&&(v.ev.style==="height"?v.plan.cur!=null:(v.turn.up>=0||!!v.turn.pick));
  const head=`<div class="racebar ph" style="margin:0"><span class="racebadge sm"><small>FIELD</small><b>${esc(f.station)}</b></span><div class="info"><b>${esc(groupLabel(v.ev,f.x,f.g))}</b><span>Group results</span></div></div>`;
  const msg=sent?`<div class="msg ok">Sent at ${esc(new Date(G.checkedAt||Date.now()).toLocaleTimeString("en-AU",{hour:"numeric",minute:"2-digit"}))}.</div>`
    :blocked?`<div class="msg warn">${setd.cm?"The set distance must be lower than the lowest measured mark.":"Type the set distance for everyone who was not measured."} Tap Back to measuring.</div>`:`<div class="msg warn">${stillOn?"Not everyone has finished. Check before you send.":"Check the places, then Send results."}</div>`;
  const list=G.rows.map(r=>{const medal=r.place&&r.place<=3;
    return `<div class="panel" style="padding:12px 14px;display:flex;align-items:center;gap:12px">${r.place?placeCell(r.place,r.tie):`<span style="width:32px;text-align:center;font-weight:800">&ndash;</span>`}
    <div style="flex:1;min-width:0"><span class="htag">${hdot(r.p.h)}<b>${esc(pname(r.p))}</b></span><br><span class="muted" style="font-size:.85rem"><b class="bestm" style="color:var(--ink)">${esc(summaryBest(v,r))}</b> &middot; ${esc(summaryDetail(v,r))}</span></div>
    <b style="text-align:right;font-size:1.05rem">${fmtPts(r.pts||0)} pts</b></div>`}).join("");
  const bar=sent?`<button type="button" class="btn navy big" data-act="fall">Next group</button>`
    :`<button type="button" class="btn" data-act="fsumback">${v.ev.style==="throw"?"Back to measuring":"Back to "+word}</button><button type="button" class="btn navy big" data-act="fsend" ${blocked||locked()?"disabled":""}>Send results</button>`;
  return `${lockBar()}<div class="stack" style="gap:8px">${head}${msg}${list}</div><div class="pbar"><div class="wrap">${bar}</div></div>`;
}
function phoneHjControls(f,v,edit){
  const p=v.plan;
  return `<div class="panel hjedit"><div class="stepbox"><label class="label" for="hjstartp">Start height (m)</label><input id="hjstartp" class="markin hjin" inputmode="decimal" data-hjs value="${fmtHeight(p.start)}" ${!edit||p.locked?"disabled":""}><span class="muted hsm">Sheet: ${fmtHeight(p.sheetStart)} m${p.locked?" Locked after the first jump.":""}</span></div>
    <div class="stepbox"><label class="label" for="hjnextp">Next height (m)</label><input id="hjnextp" class="markin hjin" inputmode="decimal" data-hjn value="${p.cur!=null?fmtHeight(p.hs[p.at+1]!=null?p.hs[p.at+1]:p.nextSheet):""}" ${!edit||p.cur==null?"disabled":""}><span class="muted hsm">${p.cur!=null?`Sheet: ${fmtHeight(p.nextSheet)} m `:""}${p.nextTyped&&edit?`<button type="button" class="fwlink" data-act="hjnreset">Use sheet</button>`:""}</span></div>
    <button type="button" class="btn navy" data-act="fedit">Done</button></div>`;
}
function renderFieldPhone(f){
  const v=fieldView(f);const {ev,rule,rows}=v;const edit=fieldEditable(v);const doc=v.G?v.G.doc:{};
  if(v.fin&&(A.f.typed||A.f.a!=null)){if(A.f.typed)toast("Final. The typed mark was not saved.");A.f.typed="";A.f.a=null;fSave()}
  if(v.fin||A.f.summary)return renderPhoneSummary(f,v);
  if(ev.style==="throw"&&v.turn.pick&&A.f.ta)return renderThrowAgain(f);
  if(ev.style==="throw"&&v.turn.over&&A.f.measure)return renderMeasurePhone(f,v,edit);
  const undoBtn=`<button type="button" class="btn" data-act="fundo">Undo last</button>`;
  const addBtn=`<button type="button" class="btn" data-act="faddopen" ${edit?"":"disabled"}>Add an athlete</button>`;
  const dis=edit?"":"disabled";
  /* the phone follows who is up; a tapped athlete is only for fixing a mark */
  let r;
  if(ev.style==="height"||ev.style==="throw"){r=v.turn.up>=0?rows[v.turn.up]:fieldCur(v)}
  else r=fieldCur(v);
  const word=ev.style==="throw"?"throwing":"jumping";
  const tools=`<div class="row" style="flex-wrap:nowrap;gap:8px">${ev.style==="distance"?`<button type="button" class="btn" style="flex:1;padding-inline:6px" data-act="faddopen" ${dis}>Add an athlete</button>`:""}<button type="button" class="btn" style="flex:1;padding-inline:6px" data-act="fall">All groups</button><button type="button" class="btn" style="flex:1;padding-inline:6px" data-act="ffinish" ${dis}>Group finished</button></div>`;
  const w=ev.style==="throw"?weightFor(A.cfg,ev.k,f.x,f.g):"";
  const racehead=(sub)=>`<div class="racebar ph" style="margin:0"><span class="racebadge sm"><small>FIELD</small><b>${esc(f.station)}</b></span><div class="info"><b>${esc(groupLabel(ev,f.x,f.g))}</b><span>${sub}</span></div></div>`;
  if(!r)return `${lockBar()}<div class="stack" style="gap:8px">${racehead("No athletes yet")}<div class="msg info">Add the athletes as they arrive.</div>${addBtn}${tools}</div>`;
  const nx=v.turn.next>=0?rows[v.turn.next]:null;
  const nameBlock=`<span class="htag bigath"><span class="hdot h${esc(r.p.h)}" style="width:30px;height:30px;font-size:.9rem">${esc(r.p.h)}</span>${esc(pname(r.p))}</span>`;
  const confirm=(n)=>A.f.conf===r.id?`<div class="msg warn">Finish ${esc(pname(r.p))} with ${n}?<div class="row" style="margin-top:8px;flex-wrap:nowrap"><button type="button" class="btn" style="flex:1" data-act="ffinno">Cancel</button><button type="button" class="btn navy" style="flex:1" data-act="ffinyes">Finish</button></div></div>`:"";
  if(ev.style==="height"){
    const p=v.plan;const mh=r.m.h||{};const at=p.cur!=null?p.cur:p.heights[0];const box=mh[at]||"";
    const up=v.turn.up>=0;const tryData=up?`data-act="hjtry" data-id="${esc(r.id)}" data-h="${at}" data-box="${esc(box)}"`:"";const td=edit&&up?"":"disabled";
    const tries=[0,1,2].map(i=>({v:box[i]||"",c:i===box.length&&up?"cur":""}));
    const main=!up?`<div class="msg ok">${p.cur==null?"Everyone is out.":"Everyone is done at this height."} Tap Group finished when the places look right.</div>`
      :`${nameBlock}<span class="muted" style="font-size:.9rem">Now up, try ${v.turn.tryNo} at ${fmtHeight(at)} m. Next: ${nx?esc(pname(nx.p)):"no one"}</span>
        <div class="attrow">${tries.map((t,i)=>`<div class="attcell ${t.c} ${t.v==="X"?"foul":""}"><span>Try ${i+1}</span><b>${esc(t.v==="-"?"Pass":t.v)||" "}</b></div>`).join("")}</div>
        <button type="button" class="btn go big" style="min-height:96px" ${tryData} data-v="O" ${td}>Clear</button><div class="row" style="flex-wrap:nowrap"><button type="button" class="btn redfill big" style="flex:1;min-height:96px" ${tryData} data-v="X" ${td}>Miss</button>${rule.pass?`<button type="button" class="btn big" style="flex:1;min-height:96px" ${tryData} data-v="-" ${td}>Pass</button>`:""}</div>`;
    return `${lockBar()}<div class="stack" style="gap:8px">${racehead(`Round ${p.cur!=null?p.at+1:p.heights.length} &middot; ${p.left} left in`)}
      <div class="row" style="flex-wrap:nowrap;justify-content:space-between;align-items:center"><div><span class="label">Bar now</span><br><b class="stepval" style="text-align:left">${p.cur!=null?fmtHeight(p.cur)+" m":"All out"}</b></div><button type="button" class="btn" data-act="fedit">Set heights</button></div>
      ${A.f.edit?phoneHjControls(f,v,edit):""}${p.left===3&&p.cur!=null?`<div class="msg warn">3 left. The sheet raise is now 3 cm. The official decides the next height.</div>`:""}${main}${tools}</div>
      <div class="pbar"><div class="wrap">${undoBtn}${addBtn}</div></div>`;
  }
  if(ev.style==="throw"){
    const t=r.m.t||{};const n=rule.attempts;const cnt=Object.keys(t).filter(k=>t[k]).length;
    const tg=doc.tg||{};const first=!rows.some(x=>!x.m.ns&&!x.m.fin&&!((x.m.t||{})[0]));
    const el=rows.filter(x=>!x.m.ns&&!x.m.fin&&(cnt===0||!!tg[x.id]));const done=el.filter(x=>Object.values(x.m.t||{}).filter(Boolean).length>cnt).length;
    const sub=`Throw ${Math.min(cnt+1,n)} &middot; ${done} of ${el.length} done${w?" &middot; "+esc(ev.k==="SP"?"Shot":ev.name)+" "+esc(w):""}`;
    let main;
    if(v.turn.pick)main=`<div class="msg ok">Everyone has thrown once. Look at the markers, then pick who throws again.</div><button type="button" class="btn navy big" style="min-height:72px" data-act="tgopen">Pick who throws again</button>`;
    else if(v.turn.over)main=`<div class="msg ok">Throwing is over. Go to Measure.</div><button type="button" class="btn navy big" style="min-height:72px" data-act="tgmeasure">Measure</button>`;
    else main=`${nameBlock}<span class="muted" style="font-size:.9rem">Marker ${r.no} &middot; Next: ${nx?esc(pname(nx.p)):"no one"}</span>
      <div class="attrow" style="grid-template-columns:repeat(${Math.min(n,4)},minmax(0,1fr))">${Array.from({length:n},(_,i)=>`<div class="attcell ${i===cnt?"cur":""} ${t[i]==="Foul"?"foul":""}" ${edit&&t[i]?`data-act="ttap" data-g="${f.id}" data-id="${esc(r.id)}" data-a="${i}"`:""}><span>Throw ${i+1}</span><b style="font-size:1.05rem">${esc(t[i]||"")||" "}</b></div>`).join("")}</div>
      <button type="button" class="btn go big" style="min-height:96px" data-act="fthrow" data-v="Fair" ${dis}>Fair</button><div class="row" style="flex-wrap:nowrap"><button type="button" class="btn redfill big" style="flex:1;min-height:96px" data-act="fthrow" data-v="Foul" ${dis}>Foul</button><button type="button" class="btn big" style="flex:1;min-height:96px" data-act="fthrow" data-v="Pass" ${dis}>Pass</button></div>`;
    const finBtn=`<button type="button" class="btn" data-act="ffinphone" ${dis}>Finish athlete</button>`;
    return `${lockBar()}<div class="stack" style="gap:8px">${racehead(sub)}${v.turn.up>=0?confirm(plural(cnt,"throw")):""}${main}${tools}</div>
      <div class="pbar"><div class="wrap">${undoBtn}${v.turn.up>=0?finBtn:""}${addBtn}</div></div>`;
  }
  /* long jump */
  const a=r.m.a||{};const n=rule.attempts;const cnt=attemptsUsed(r,rule);
  const cur=jumpBox(v,r);const t=A.f.typed;const used=cnt;
  const left=rows.filter(x=>liveAth(x,v)).length;
  const keepPanel=A.f.cut?`<div class="panel hjedit"><div class="stepbox"><label class="label" for="keepnp">Keep top</label><input id="keepnp" class="markin hjin" inputmode="numeric" data-keepn value="${A.f.keepN||4}" ${dis}><span class="muted hsm">Finishes everyone below the Nth best mark. Equal marks stay in.</span></div>
    <div class="row" style="flex-wrap:nowrap"><button type="button" class="btn navy" style="flex:1" data-act="fkeep" ${dis}>Keep top ${A.f.keepN||4}</button>${A.f.keepPrev&&A.f.keepPrev.length?`<button type="button" class="btn" style="flex:1" data-act="fkeepundo">Undo</button>`:""}<button type="button" class="btn" style="flex:1" data-act="fcut">Done</button></div>${A.f.keepMsg?`<div class="msg ok">${esc(A.f.keepMsg)}</div>`:""}</div>`:"";
  const pdis=cur<0||!edit?"disabled":"";
  const main=`<div class="attrow" style="grid-template-columns:repeat(${Math.min(n,4)},minmax(0,1fr))">${Array.from({length:n},(_,i)=>`<div class="attcell ${i===cur?"cur":""} ${a[i]==="x"?"foul":""}" ${edit&&a[i]?`data-act="fcell" data-a="${i}"`:""}><span>Jump ${i+1}</span><b>${esc(a[i]==="x"?"Foul":a[i]==="-"?"Pass":fmtCell(a[i]))||" "}</b></div>`).join("")}</div>
    <div class="row" style="flex-wrap:nowrap"><button type="button" class="btn redfill big" style="flex:1;min-height:64px" data-act="ffoul" ${pdis}>Foul</button><button type="button" class="btn big" style="flex:1;min-height:64px" data-act="fpass" ${pdis}>Pass</button></div>
    <div class="markshow" aria-live="polite">${cur<0&&!t?"All jumps done":typedShow(t)}</div><div class="keypad fp">${keyBtns(["1","2","3","4","5","6","7","8","9","Clear","0","Back"],"fkey",!edit||(cur<0&&!t))}</div>`;
  return `${lockBar()}<div class="stack" style="gap:8px">${racehead(`Athlete ${r.no} of ${rows.length} &middot; ${left} still jumping`)}
    <div class="row" style="flex-wrap:nowrap;justify-content:space-between;align-items:center">${nameBlock}<button type="button" class="btn" data-act="fcut">Cut the field</button></div>${keepPanel}${confirm(plural(used,"jump"))}
    <span class="muted" style="font-size:.9rem">Next: ${nx&&nx!==r?esc(pname(nx.p)):(nextAfter(rows,A.f.i,v)!==A.f.i?esc(pname(rows[nextAfter(rows,A.f.i,v)].p)):"no one")}</span>${main}${tools}</div>
    <div class="pbar"><div class="wrap">${undoBtn}<button type="button" class="btn" data-act="ffinphone" ${dis}>Finish athlete</button><button type="button" class="btn navy" data-act="fsave">${t?"Save mark":"Next athlete"}</button></div></div>`;
}
/* the jump box the keypad fills: the one tapped to change, else the next empty one */
function jumpBox(v,r){
  const a=r.m.a||{};const n=v.rule.attempts;
  if(A.f.a!=null&&A.f.a<n)return A.f.a;
  for(let i=0;i<n;i++)if(!a[i])return i;
  return -1;
}
function renderMeasurePhone(f,v,edit){
  const doc=v.G.doc;const s=v.G.setd;const t=A.f.typed;const open=A.f.mopen;
  const meas=v.rows.filter(r=>r.m.best&&r.fair).length;
  const rowsHtml=v.rows.map(r=>{const can=r.fair&&!r.m.ns;const op=open===r.id;
    const mark=r.m.ns?"No show":!r.fair?"No fair throw":r.m.best?fmtMark(markCm(r.m.best))+" m":"Participation";
    return `<div class="panel" style="padding:10px 12px"><button type="button" class="namebtn ${op?"sel":""}" style="width:100%" aria-pressed="${op}" data-act="mopen" data-id="${esc(r.id)}" ${can&&edit?"":"disabled"}><span class="medal m4" style="width:30px;height:30px;background:#ffffff;color:#1d3160">${r.no}</span>${hdot(r.p.h)}<span class="t">${esc(pname(r.p))}</span><b>${esc(mark)}</b></button>
      <span class="muted" style="font-size:.85rem">${esc(Object.values(r.m.t||{}).filter(Boolean).join(", ")||"No throws")}</span>
      ${op?`<div class="markshow" aria-live="polite">${typedShow(t)}</div><div class="keypad fp">${keyBtns(["1","2","3","4","5","6","7","8","9","Clear","0","Back"],"ljkey")}</div><div class="row" style="flex-wrap:nowrap;margin-top:8px"><button type="button" class="btn" style="flex:1" data-act="mcancel">Cancel</button><button type="button" class="btn navy" style="flex:1" data-act="msave">Save mark</button></div>`:""}</div>`}).join("");
  const sd=setdControl(v,!edit);
  return `${lockBar()}<div class="stack" style="gap:8px"><div class="racebar ph" style="margin:0"><span class="racebadge sm"><small>FIELD</small><b>${esc(f.station)}</b></span><div class="info"><b>${esc(groupLabel(v.ev,f.x,f.g))}: measure</b><span>${meas} measured, about 5</span></div></div>
    <div class="msg ok">Tap an athlete you measured and type the distance. Everyone else gets the set distance.</div>${rowsHtml}
    <div class="panel" style="padding:10px 12px"><label class="label" for="setdp">Set distance for everyone not measured (m)</label><input id="setdp" class="markin hjin" style="display:block;margin:6px 0" inputmode="decimal" data-setd value="${esc(doc.setd?fmtCell(doc.setd):"")}" ${!edit?"disabled":""}><span class="muted hsm">Lower than the lowest measured mark. They share a place and get 4 points.</span>${sd.bad?`<div class="msg warn" style="margin-top:8px">${esc(sd.bad)}</div>`:""}</div></div>
    <div class="pbar"><div class="wrap"><button type="button" class="btn" data-act="tgmback">Back to throwing</button><button type="button" class="btn navy big" data-act="ffinish" ${edit?"":"disabled"}>Group finished</button></div></div>`;
}
function fieldPhoneAct(kind,val){
  const f=fieldGroupOpen();if(!f)return;const v=fieldView(f);if(!v.G)return;
  const {ev,rule,rows}=v;const r=fieldCur(v);if(!r)return;
  const nextUp=()=>{phoneMove(v);render();window.scrollTo(0,0)};
  if(!fieldEditable(v)){if(kind==="save")nextUp();return}
  const cur=jumpBox(v,r);
  if(kind==="key"){
    if(/^[0-9]$/.test(val)){if(A.f.typed.length<4&&(A.f.typed||val!=="0"))A.f.typed+=val}
    else if(val==="Back")A.f.typed=A.f.typed.slice(0,-1);else{A.f.typed="";A.f.a=null}
    fSave();render();return;
  }
  if(kind==="foul"||kind==="pass"){if(cur>=0){const c=kind==="foul"?"x":"-";A.f.typed="";A.f.a=null;const wasMove=attemptsUsed(r,rule)<rule.attempts;fSave();setMark(f,r.id,cur,c);if(wasMove){phoneMove(v);}}return}
  if(kind==="save"){
    if(A.f.typed&&cur>=0){
      if(A.f.typed.length<2){toast("Type the whole mark: 534 is 5.34 m.");return}
      const m=A.f.typed;setMark(f,r.id,cur,m);phoneMove(v);return}
    if(A.f.typed){toast("No box left. Tap a jump to change it, or Back to clear.");return}
    A.f.a=null;nextUp();
  }
}
/* Finish: the official ends an athlete's jumping at any time (decision 73) */
async function fieldFinishAth(f,id){A.f.conf=null;await setField(f,id,"fin",0,true)}
