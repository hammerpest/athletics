/* ===== Recorder: track and field ===== */
function lockedBy(race){
  /* another Recorder that opened this race first holds it */
  const mine=A.job==="recorder"&&A.r.race===race?A.r.since:Infinity;
  return otherPeers().some(p=>p.job==="recorder"&&p.rec===race&&(p.recSince||0)<mine);
}
/* a relief Recorder or a reload opens on the first race that still needs work, else the latest race */
function recRace(){
  const list=liveRaces();if(!list.length)return null;
  if(A.r.race==null||!A.R.races.has(A.r.race)){const r=list.find(r=>!r.done||r.flagged||r.differs.length)||list[list.length-1];A.r.race=r.race;A.r.since=Date.now();announce()}
  return A.R.races.get(A.r.race);
}
function overallTable(G){
  if(!G||!G.rows.length)return `<p class="muted" style="margin:0">No runners yet.</p>`;
  return `<div class="tablewrap"><table><thead><tr><th>Place</th><th>Runner</th><th>Time</th><th class="num">Points</th><th></th></tr></thead><tbody>
  ${G.rows.map(x=>`<tr><td>${placeCell(x.place)}</td><td class="nmcell"><span class="htag">${hdot(x.p&&x.p.h)}${esc(pname(x.p))}</span></td>
    <td class="${x.pink?"pinkt":""}" style="font-weight:700">${noTimeSt(x.st)?x.st:x.eff!=null?fmtTime(x.eff)+(x.auto?` <span class="muted" style="font-weight:600;font-size:.8rem">+1 s</span>`:""):`<span class="muted">waiting</span>`}</td>
    <td class="num">${fmtPts(x.pts||0)}</td><td>${x.tag?`<span class="tag ${x.tag==="NEW RECORD"?"rec":"eq"}">${x.tag}</span> `:""}${x.hris?`<span class="tag hris">HRIS</span>`:""}</td></tr>`).join("")}
  </tbody></table></div>`;
}
function recTabs(){return `<div class="tabs">${[["track","Track"],["field","Field events"]].map(([k,l])=>`<button type="button" data-act="rtabrec" data-v="${k}" aria-pressed="${A.r.tab===k}">${l}</button>`).join("")}</div>`}
function renderRecorder(){return A.r.tab==="field"?recTabs()+renderRecField():renderRecTrack()}
function renderRecTrack(){
  const r=recRace();
  if(!r)return recTabs()+waitingCard("Waiting for the first race","Race 1 appears here once the marshal sends it. Times arrive from the time slip photo, or you can type them.");
  const lk=lockedBy(r.race)||locked();const lkc=lk||r.cancelled;
  const G=A.R.groups.get(r.key);const max=latestRace();
  let rows="";
  for(const l of r.filled){
    const id=r.lanes[l];const p=A.R.who(id);const v=r.times[l]||{};const e=r.eff[l];const jp=r.placeTaps[l];
    const odd=v.t!=null&&!noTimeSt(v.st)&&!v.keep?(oddTime(r.k,v.t,A.cfg.limits)||(v.chk?"slip hard to read":null)):null;
    /* a late slip keeps the typed time; the Recorder picks */
    const dif=r.differs.includes(+l)?v.slip:null;
    const err=A.r.errs[r.race+"-"+l];
    const val=err?err.raw:(v.t!=null?fmtTime(v.t):"");
    const pinkrow=e&&e.pink&&!noTimeSt(v.st);
    const res=noTimeSt(v.st)?`<b>${v.st}</b>`:e&&e.eff!=null?`<b class="${e.pink?"pinkt":""}">${fmtTime(e.eff)}</b>${e.pink?`<span class="under pinkn">Slip ${fmtTime(e.rec)}</span>`:e.auto?`<span class="under">+1 s</span>`:""}`:"";
    rows+=`<tr class="${pinkrow?"pinkrow":odd?"flagrow":""}">
      <td class="num" style="text-align:center;font-weight:800">${l}</td>
      <td class="nmcell"><span class="htag">${hdot(p.h)}<b>${esc(pname(p))}</b></span></td>
      <td>${r.multi?`<span class="muted">By time</span>`:jp?medal(jp):`<span class="muted">${r.tapped?"By time":"&ndash;"}</span>`}</td>
      <td><input class="timein ${odd?"flag":""} ${pinkrow?"pinkt":""}" style="min-height:48px" id="t-${r.race}-${l}" data-time="${l}" inputmode="numeric" autocomplete="off" value="${esc(val)}" placeholder="Type time" ${lkc||v.st==="DNS"?"disabled":""} aria-label="Time for lane ${l}">
        ${err?`<span class="under" style="color:var(--bad);font-weight:700">${esc(err.msg)}</span>`:dif!=null?`<span class="under" style="color:var(--warn);font-weight:700">Slip differs: ${fmtTime(dif)}</span>`:""}</td>
      <td class="num">${res}</td>
      <td><div class="row" style="gap:6px;flex-wrap:nowrap"><button type="button" class="stbtn" data-act="rst" data-l="${l}" data-st="DNS" aria-pressed="${v.st==="DNS"}" ${lkc?"disabled":""}>DNS</button><button type="button" class="stbtn" data-act="rst" data-l="${l}" data-st="DQ" aria-pressed="${v.st==="DQ"}" ${lkc?"disabled":""}>DQ</button></div>
      ${dif!=null?`<div class="row" style="gap:6px;margin-top:6px"><button type="button" class="btn small" data-act="rslipuse" data-l="${l}" ${lk?"disabled":""}>Use slip</button><button type="button" class="btn small" data-act="rslipkeep" data-l="${l}" ${lk?"disabled":""}>Keep typed</button></div>`:odd?`<div style="color:var(--warn);font-weight:700;font-size:.85rem;margin-top:6px">Check this time: ${esc(odd)}</div><div class="row" style="gap:6px;margin-top:4px"><button type="button" class="btn small" data-act="rkeep" data-l="${l}" ${lk?"disabled":""}>Keep</button><button type="button" class="btn small" data-act="rfix" data-l="${l}" ${lk?"disabled":""}>Fix</button></div>`:""}</td>
    </tr>`;
  }
  const canCheck=r.nTimes>0&&!lk;const nextNo=nextRaceAfter(r.race);
  const hasPhoto=r.hasSlip&&!r.multi;
  return `${lockBar()}${recTabs()}<div class="recgrid"><div class="stack">
      <div class="racebar" style="margin:0">${badge(r.race,"xl")}<div class="info"><b>${esc(r.label)}</b><span>Heat ${r.heat} · <span class="chip ${r.checked?"final":r.nTimes?"prov":""}">${esc(r.tstatus)}</span></span></div>
        <button type="button" class="btn" data-act="rgoto">Go to race</button><button type="button" class="btn" data-act="rslip" ${hasPhoto?"":"disabled"}>View slip photo</button></div>
      ${r.extra.length?`<div class="msg warn">The slip has a time for ${r.extra.length>1?"lanes "+r.extra.slice(0,-1).join(", ")+" and "+r.extra.slice(-1):"lane "+r.extra[0]}, but no runner was marshalled there. A runner may have been missed: add them here or check with the marshal.
        <div class="row" style="gap:8px;margin-top:8px">${r.extra.map(l=>`<button type="button" class="btn small" data-act="raddlane" data-l="${l}" ${lk?"disabled":""}>Add runner to lane ${l}</button>`).join("")}</div></div>`:""}
      ${r.cancelled?`<div class="msg warn">Race ${r.race} was cancelled (not run). Its runners can be marshalled again.<div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn small" data-act="runcancel" ${lk?"disabled":""}>Bring this race back</button></div></div>`:""}
      ${lockedBy(r.race)?`<div class="msg warn">Being entered by another device. You can look, but times cannot be changed here until it is finished.</div>`:""}
      <div class="panel" style="padding:0;overflow:hidden"><div class="tablewrap"><table>
        <thead><tr><th>${r.multi?"No.":"Lane"}</th><th>Runner</th><th>Place</th><th>Time</th><th class="num">Result</th><th>DNS / DQ</th></tr></thead><tbody>${rows||`<tr><td colspan="6" class="muted">${r.multi?"The multitimer phone has not entered the names yet.":"No runners in this heat."}</td></tr>`}</tbody></table></div></div>
      <p class="muted" style="font-size:.86rem;margin:0">Type digits only: 1284 is 12.84 and 10234 is 1:02.34. Press Enter to save and move down. Pink times were moved by the Place Judge's order; the slip time shows underneath. DQ is a lane change in the 100 m, 200 m and 400 m.</p>
      <button type="button" class="btn navy big" data-act="rcheck" ${canCheck?"":"disabled"}>${r.checked?"Checked. Press to undo":"Times checked"}</button>
      <div class="row" style="justify-content:space-between">
        <div class="row">${r.race<max?`<button type="button" class="btn" data-act="rlatest">Back to latest</button>`:""}${nextNo!=null?`<button type="button" class="btn" data-act="rnext">Next race</button>`:""}</div>
        ${r.cancelled?"":`<div class="row" style="gap:20px"><button type="button" class="linkbtn" data-act="rcancel" ${lk?"disabled":""}>Cancel this race (not run)</button><button type="button" class="linkbtn" data-act="rrerun" ${lk?"disabled":""}>Re-run this race</button></div>`}
      </div>
    </div>
    <div class="stack"><div class="panel stack"><div class="row" style="justify-content:space-between"><h3>Race overall</h3>${G?`<span class="chip ${G.final?"final":"prov"}">${G.status}</span>`:""}</div>
      <span class="muted" style="font-size:.86rem">${esc(r.label)} · ${G?`${raceRange(G.raceNos)}, ${plural(G.heats.length,"heat")}, timed final`:"no heats run yet"}</span>
      ${overallTable(G)}</div>
      ${slipPanel(r)}</div>
  </div>`;
}
async function saveTime(l,raw){
  const r=recRace();if(!r||lockedBy(r.race)||locked())return false;
  const key=r.race+"-"+l;
  if(!String(raw).trim()){delete A.r.errs[key];return true}
  const p=parseTime(raw);
  if(p.err){A.r.errs[key]={raw,msg:p.err};render();return false}
  delete A.r.errs[key];
  const cur=r.times[l]||{};
  if(cur.t===p.cs&&cur.st!=="DNS")return true;
  const lanes={};lanes[l]={t:p.cs,st:"ok",src:"typed",keep:false,chk:false,slip:null};
  const T=r.T||{};
  A.times[rid(r.race)]=Object.assign({},T,{lanes:Object.assign({},T.lanes||{},lanes),checked:false,gen:r.gen});
  recompute();
  await w(()=>A.store.update("times/"+rid(r.race),{lanes,checked:false,gen:r.gen,by:DEV,at:Date.now()}));
  return true;
}
async function setLane(l,patch){
  const r=recRace();if(!r||lockedBy(r.race)||locked())return;
  const T=r.T||{};const cur=(T.lanes||{})[l]||{};
  const nv=Object.assign({},cur,patch);
  const lanes={};lanes[l]=nv;
  const same=Object.keys(patch).every(k=>k==="keep"||k==="slip");
  A.times[rid(r.race)]=Object.assign({},T,{lanes:Object.assign({},T.lanes||{},lanes),checked:same?!!T.checked:false,gen:r.gen});
  recompute();render();
  await w(()=>A.store.update("times/"+rid(r.race),{lanes,checked:A.times[rid(r.race)].checked,gen:r.gen,by:DEV,at:Date.now()}));
}
function recNextToCheck(from){
  const list=liveRaces().filter(x=>x.race>from&&!x.checked);
  const nx=nextRaceAfter(from);
  return list.length?list[0].race:(nx!=null?nx:from);
}
async function timesChecked(force){
  const r=recRace();if(!r)return;
  const key=rid(r.race);const T=r.T||{};
  if(r.checked){A.times[key]=Object.assign({},T,{checked:false});recompute();render();await w(()=>A.store.update("times/"+key,{checked:false,gen:r.gen}));return}
  const missing=r.filled.filter(l=>{const v=r.times[l]||{};return v.t==null&&!noTimeSt(v.st)&&!(r.eff[l]&&r.eff[l].auto)});
  if(missing.length){A.modal={t:"info",title:"A lane has no time",body:`<p style="margin:0">${missing.length===1?"Lane "+missing[0]+" has":"Lanes "+missing.join(", ")+" have"} no time yet. Type the time from the paper slip, or mark DNS or DQ, then press Times checked.</p>`,ok:"< Back to times"};render();return}
  if(!force&&r.flagged){A.modal={t:"flagged",n:r.flagged};render();return}
  const patch={checked:true,checkedAt:Date.now(),checkedBy:DEV,gen:r.gen};
  if(force){const lanes={};for(const l in (T.lanes||{})){const v=T.lanes[l];if(v.t!=null&&(oddTime(r.k,v.t,A.cfg.limits)||v.chk))lanes[l]=Object.assign({},v,{keep:true})}patch.lanes=lanes}
  A.times[key]=Object.assign({},T,patch,{lanes:Object.assign({},T.lanes||{},patch.lanes||{})});
  A.modal=null;
  const ok=await w(()=>A.store.update("times/"+key,patch));
  if(ok){A.r.race=recNextToCheck(r.race);A.r.since=Date.now();announce()}
  recompute();render();
}
/* cancel a race sent in error, or clear a race for a re-run. A re-run keeps the number; the race's gen goes
   up, so the old places, times and slip no longer count anywhere */
async function cancelRace(race,on){
  const H=A.heats.find(h=>h.race===race);if(!H)return;
  if(locked()){toast("Results are locked.");return}
  const was={cancelled:H.cancelled};H.cancelled=on;A.modal=null;recompute();render();
  const ok=await w(()=>A.store.update("heats/"+rid(race),{cancelled:on,cancelAt:Date.now()}));
  if(!ok){H.cancelled=was.cancelled;recompute();render();return}
  toast(on?`Race ${race} cancelled (not run)`:`Race ${race} is back`);
}
async function rerunRace(race){
  const H=A.heats.find(h=>h.race===race);if(!H)return;
  if(locked()){toast("Results are locked.");return}
  const gen=(H.gen||0)+1;const was=H.gen;
  H.gen=gen;A.times[rid(race)]={lanes:{},gen,checked:false};A.modal=null;recompute();render();
  const ok=await w(()=>A.store.update("heats/"+rid(race),{gen}));
  if(!ok){H.gen=was;recompute();render();return}
  await w(()=>A.store.set("times/"+rid(race),{lanes:{},gen,checked:false,by:DEV,at:Date.now()}));
  toast(`Race ${race} cleared for the re-run`);
}
MODALS.cancelRace=M=>`<h2>Cancel Race ${M.race}?</h2><p style="margin:0">Only for a race sent in error that will not be run. Its runners can be marshalled again, and its group no longer waits for it.</p><p style="margin:0">Race numbers do not change. Check the timing console's next race number still matches the app's.</p><div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back</button><button type="button" class="btn redfill" data-act="rcancelok">Cancel the race</button></div>`;
MODALS.rerunRace=M=>`<h2>Re-run Race ${M.race}?</h2><p style="margin:0">Clears the places, times and slip for Race ${M.race}. The runners stay in their lanes and the race keeps its number, as the timing printer prints the re-run as Race ${M.race}.</p><div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back</button><button type="button" class="btn redfill" data-act="rrerunok">Clear for the re-run</button></div>`;
MODALS.flagged=M=>`<h2>A time still needs a check</h2><p style="margin:0">${plural(M.n,"time is","times are")} marked yellow because ${M.n===1?"it looks":"they look"} odd for this race.</p><div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back to times</button><button type="button" class="btn go" data-act="rforce">Times are right</button></div>`;
MODALS.slip=M=>`<h2>Slip photo: Race ${M.race}</h2>${M.img?`<img src="${M.img}" alt="Time slip photo for race ${M.race}" style="border-radius:10px;border:1px solid var(--line)">`:`<p class="muted">${M.loading?"Loading the photo...":"No photo stored for this race."}</p>`}
  ${M.read?`<div class="label">What was read</div><table><tbody>${Object.keys(M.read).sort((a,b)=>a-b).map(l=>`<tr><td>Lane ${l}</td><td class="num">${fmtTime(M.read[l])}</td></tr>`).join("")}</tbody></table>`:""}
  <div class="acts"><button type="button" class="btn primary" data-act="closemodal">Close</button></div>`;
async function viewSlip(race){
  const key=rid(race);const meta=(A.R.races.get(race)||{}).slip||{};
  A.modal={t:"slip",race,loading:true,read:meta.read||null};render();
  try{const d=await A.store.get("photos/"+(A.past?"y"+A.past+"-":"")+key);if(A.modal&&A.modal.t==="slip"){A.modal.img=d&&d.img;A.modal.loading=false;render()}}catch(e){if(A.modal){A.modal.loading=false;render()}}
}
function slipPanel(r){
  const meta=r.slip;if(!meta||!meta.multi)return "";
  return `<div class="panel stack"><h3>Multitimer</h3><p class="muted" style="margin:0">Timed on the phone multitimer: no slip photo. Splits in finish order:</p><ol class="splits">${(meta.splits||[]).map((t,i)=>`<li><b>${i+1}</b><span>${fmtTime(t)}</span></li>`).join("")}</ol></div>`;
}
MODALS.pickLane=M=>{const r=A.R.races.get(M.race);if(!r)return `<p>Race not found.</p><div class="acts"><button type="button" class="btn" data-act="closemodal">Close</button></div>`;
  const H=A.heats.find(h=>h.race===M.race)||{};const t=(r.times||{})[M.l];
  return `<h2>Add runner to lane ${M.l}</h2><p class="muted" style="margin:0">Race ${M.race}, ${esc(r.label)}, heat ${r.heat}.${t&&t.t!=null?` The slip time ${fmtTime(t.t)} becomes theirs.`:""}</p>
  <div style="position:relative;min-height:320px">${laneList(M.l,r.ev,r.x,r.g,heatUsed(H),new Set(Object.values(H.lanes||{}).filter(Boolean)),null,"rsetlane",null,"Other heat").replace('class="picklist"','class="picklist" style="position:static;box-shadow:none"')}</div>`};

/* ---------- Recorder, field events ---------- */
function recFieldRows(){
  /* the block the day is up to, then anything else under way or final */
  const R=A.R;const now=blockNow(R);const out=[];const seen=new Set();
  const add=f=>{if(!seen.has(f.key)){seen.add(f.key);out.push(f)}};
  R.fgroups.filter(f=>f.block===now).forEach(add);
  R.fgroups.filter(f=>{const G=R.groups.get(f.key);return G&&!G.final}).forEach(add);
  R.fgroups.filter(f=>{const G=R.groups.get(f.key);return G&&G.final}).sort((a,b)=>R.groups.get(b.key).checkedAt-R.groups.get(a.key).checkedAt).forEach(add);
  return out;
}
function renderRecField(){
  const R=A.R;const list=recFieldRows();const now=blockNow(R);
  if(!list.length)return waitingCard("No field groups","Turn on a field event in Carnival Organiser, Program.");
  const nFinal=R.fgroups.filter(f=>R.groups.get(f.key)&&R.groups.get(f.key).final).length;
  if(!A.r.fkey||!list.some(f=>f.key===A.r.fkey))A.r.fkey=(list.find(f=>R.groups.get(f.key))||list[0]).key;
  const sel=list.find(f=>f.key===A.r.fkey);const G=R.groups.get(sel.key);
  const stn=id=>(R.stations.find(s=>s.id===id)||{}).name||id;
  const ev=eventOf(A.cfg,sel.k);const ovr=A.r.ovr;
  const nowAt=now!=null?((A.cfg.timetable[now]||{}).at||"")+" block · ":"";
  const left=`<div class="gcard"><div class="ghead"><h3>Stations</h3><span class="meta">${esc(nowAt)}${nFinal} of ${R.fgroups.length} final</span></div>
    <table><thead><tr><th>Station</th><th>Group</th><th>Status</th></tr></thead><tbody>${list.map(f=>{const g=R.groups.get(f.key);const s=g?(g.final?"Final":"Running"):"Not started";
      return `<tr class="${f.key===A.r.fkey?"selrow":""}"><td><button type="button" class="linkbtn" data-act="rfgroup" data-v="${esc(f.key)}">${esc(stn(f.station))}</button></td><td>${esc(sexName(f.x)+" "+grpName(f.g))}</td><td><span class="chip ${s==="Final"?"final":""}">${s}</span></td></tr>`}).join("")}</tbody></table></div>`;
  const when=G&&G.final?`finished by the station at ${new Date(G.checkedAt).toLocaleTimeString("en-AU",{hour:"numeric",minute:"2-digit"}).toLowerCase()} · `:"";
  const right=`<div class="stack">
    <div class="racebar" style="margin:0"><span class="racebadge"><small>FIELD</small><b>${esc(sel.station)}</b></span><div class="info"><b>${esc(groupLabel(ev,sel.x,sel.g))}</b><span>${esc(stn(sel.station))} · ${esc(when)}<span class="chip ${G&&G.final?"final":""}">${G?G.status:"Not started"}</span></span></div></div>
    <div class="panel" style="padding:0;overflow:hidden"><div class="tablewrap">${recFieldTable(sel,G,ev,ovr)}</div></div>
    ${ovr?`<div class="msg warn">Override is on. Changes show on every device at once. An ended athlete's boxes are locked: press Bring back to change them.</div>
      <div class="row"><button type="button" class="btn" data-act="rfadd">Add an athlete</button>${G&&G.final?`<button type="button" class="btn" data-act="rfreopen">Reopen this group</button>`:""}</div>`:""}
    <p class="muted" style="font-size:.86rem;margin:0">Results are final at the station. The event coordinator can overrule any result at any time.</p>
    <button type="button" class="btn big" data-act="rovr">${ovr?"Finish override":"Override (event coordinator)"}</button>
  </div>`;
  return `${lockBar()}<div class="recgrid rf${ovr?" rfwide":""}">${left}${right}</div>`;
}
function recFieldTable(f,G,ev,ovr){
  const v=fieldView(f);const rule=v.rule;const rows=G?G.rows:[];const dis=!ovr||locked();const dis_=r=>dis||!!r.m.fin;
  const n=rule.attempts;const hts=ev.style==="height"?v.plan.heights.filter(h=>rows.some(r=>(r.m.h||{})[h])||h===v.plan.cur):null;
  /* shot put and discus in override (A1.31): weight, throws again, measured mark, the set distance and Finish */
  const T=ev.style==="throw"&&ovr;const doc=fieldDocOf(f);const tg=doc.tg||{};const wt=doc.wt||{};
  const wo=T?weightOpts(ev,{k:f.k,x:f.x,g:f.g}):[];
  const heads=hts?hts.map(h=>`<th>${fmtHeight(h)}</th>`).join(""):Array.from({length:n},(_,i)=>`<th>${i+1}</th>`).join("");
  const box=(r,ri)=>{
    if(hts)return hts.map(h=>{const c=(r.m.h||{})[h]||"";return `<td>${ovr?hjCell(f,r,h,c,dis_(r)):esc(c)}</td>`}).join("");
    if(ev.style==="throw")return Array.from({length:n},(_,a)=>{const c=(r.m.t||{})[a]||"";return `<td>${ovr?throwCell(f,r,a,c,dis_(r)||(a>=1&&!tg[r.id]&&!c)):esc(c||"")}</td>`}).join("");
    return Array.from({length:n},(_,a)=>{const c=(r.m.a||{})[a];return `<td>${ovr?markCell(f,r,ri,a,c,dis_(r)):esc(fmtCell(c)||"")}</td>`}).join("");
  };
  const bestTxt=r=>`<span class="bestm">${r.best?(hts?fmtHeight(r.best):fmtMark(r.best)):"&ndash;"}</span>${r.part?` <span class="chip prov">${r.best?"Participation":"Set distance needed"}</span>`:""}`;
  const wcell=r=>T&&wo.length?`<td><div style="display:flex;gap:4px">${wo.map((o,k)=>`<button type="button" class="stbtn" data-act="wtset" data-g="${f.id}" data-id="${esc(r.id)}" data-v="${k+1}" aria-pressed="${wt[r.id]===k+1}" ${dis_(r)?"disabled":""}>${esc(o.w)}</button>`).join("")}</div></td>`:"";
  const again=(r,ri)=>T?`<td><label style="display:flex;align-items:center;gap:8px;min-height:48px;cursor:pointer"><input type="checkbox" style="width:24px;height:24px" aria-label="${esc(pname(r.p))} throws again" data-act="tgtick" data-g="${f.id}" data-id="${esc(r.id)}" ${tg[r.id]?"checked":""} ${dis_(r)?"disabled":""}>${tg[r.id]?"Yes":"No"}</label></td><td class="num">${bestCell(f,r,ri,dis_(r))}</td>`:"";
  const fin=r=>ovr?(r.m.fin?`<button type="button" class="stbtn" data-act="rfback" data-g="${f.id}" data-id="${esc(r.id)}" ${locked()?"disabled":""}>Bring back</button>`:`<button type="button" class="stbtn" data-act="rfend" data-g="${f.id}" data-id="${esc(r.id)}" ${locked()?"disabled":""}>End</button>`):(r.m.fin?`<span class="chip">Ended</span>`:"");
  const sd=T?setdControl(v,dis,f.id):null;
  const head=`<th>Place</th><th>Athlete</th>${T&&wo.length?"<th>Weight</th>":""}${heads}${T?`<th>Throws again</th><th class="num">Measured</th>`:""}<th class="num">Best</th><th class="num">Points</th><th>Finish</th><th></th>`;
  const cols=6+(hts?hts.length:n)+(T?2+(wo.length?1:0):0);
  return `${T?`<div class="panel stack" style="padding:12px 14px;margin-bottom:10px"><div class="row">${sd.html.replace('margin-left:auto','margin-left:0')}<span class="muted" style="flex:1 1 320px;font-size:.88rem">Athletes with a fair throw who were not measured all get this distance, one shared place and 4 points. It must be lower than the lowest measured mark.</span></div>${sd.bad?`<div class="msg warn">${esc(sd.bad)}</div>`:""}</div>`:""}<div class="tablewrap"><table><thead><tr>${head}</tr></thead><tbody>
    ${rows.map((r,ri)=>`<tr><td>${placeCell(r.place,r.tie)}</td><td class="nmcell"><span class="htag">${hdot(r.p.h)}${esc(pname(r.p))}</span></td>${wcell(r)}${box(r,ri)}${again(r,ri)}<td class="num">${bestTxt(r)}</td><td class="num">${fmtPts(r.pts||0)}</td><td>${fin(r)}</td><td>${r.tag?`<span class="tag ${r.tag==="NEW RECORD"?"rec":"eq"}">${r.tag}</span> `:""}${r.hris?`<span class="tag hris">HRIS</span>`:""}</td></tr>`).join("")||`<tr><td colspan="${cols}" class="muted">No athletes entered yet.</td></tr>`}
  </tbody></table></div>`;
}
