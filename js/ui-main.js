/* ===== render and actions ===== */
function render(){
  if(A.rendering)return;A.rendering=true;
  try{renderInner()}finally{A.rendering=false}
}
function renderInner(){
  if(!A.R)recompute();
  if(A.role==="org"&&!A.yearPicked)A.job=null;
  if(A.role&&A.role!=="org"&&(!A.job||!canOpen(A.job))){A.job=homeJob();ssSet("aths_job",A.job)}
  if(A.role==="org"&&A.job&&!canOpen(A.job==="organiser"?"org":A.job))A.job=null;
  renderHeader();
  document.documentElement.style.setProperty("--hdrh",document.getElementById("hdr").offsetHeight+"px");
  const main=document.getElementById("main");
  let html="";
  if(A.role&&A.job)A.tilesSeen=false;
  if(!A.role||!A.job)html=renderHome();
  else if(A.job==="marshal")html=renderMarshal();
  else if(A.job==="judge")html=renderJudge();
  else if(A.job==="recorder")html=renderRecorder();
  else if(A.job==="slips")html=renderSlips();
  else if(A.job==="field")html=renderField();
  else if(A.job==="announcer")html=renderAnnouncer();
  else if(A.job==="results")html=lockBar()+renderResults();
  else if(A.job==="houses")html=renderHouses();
  else if(A.job==="organiser")html=A.role==="org"?renderOrganiser():renderHome();
  const sx=window.scrollX,sy=window.scrollY;
  const fid=document.activeElement&&document.activeElement.id;
  main.innerHTML=`<div class="wrap">${html}</div>`;
  document.getElementById("mod").innerHTML=modalHtml();
  mSave();
  if(fid){const el=document.getElementById(fid);if(el&&el.focus){el.focus();if(el.setSelectionRange&&el.type!=="number"&&el.type!=="date")try{el.setSelectionRange(el.value.length,el.value.length)}catch(e){}}}
  window.scrollTo(sx,sy);
  wireInputs();
  fitPicklist();
  if(document.querySelector(".tiles")){tilesFx(A.tilesFxFirst);A.tilesFxFirst=false}
  hjNowScroll();
  placePops();
}
/* the pop-ups (Clear, Miss, Pass; the jump keypad; Finish asks first) stay beside their box and always inside the screen */
function placePops(){
  document.querySelectorAll(".hjpop").forEach(p=>{
    const td=p.parentElement;if(!td)return;const r=td.getBoundingClientRect();
    p.style.position="fixed";p.style.transform="none";p.style.right="auto";p.style.bottom="auto";p.style.left="0px";p.style.top="0px";p.style.width="max-content";
    const w=p.offsetWidth,h=p.offsetHeight,W=innerWidth,H=(window.visualViewport?visualViewport.height:innerHeight);
    let top=r.bottom+4;if(top+h>H-8)top=r.top-h-4;if(top<8)top=Math.max(8,(H-h)/2);
    p.style.top=top+"px";p.style.left=Math.max(8,Math.min(W-w-8,r.left+r.width/2-w/2))+"px";
  });
}
window.addEventListener("scroll",()=>{if(document.querySelector(".hjpop"))placePops()},{passive:true});
window.addEventListener("resize",()=>{if(document.querySelector(".hjpop"))placePops()});
/* the name list: on a phone a full-screen panel, sized to the space above the keyboard. On anything larger it
   stays beside its lane and opens upwards when there is more room above, so the names are never off screen */
function fitPicklist(){
  const vv=window.visualViewport;const h=vv?vv.height:innerHeight;
  document.documentElement.style.setProperty("--vvh",h+"px");
  const e=document.querySelector(".lane .picklist");if(!e||innerWidth<700)return;
  e.classList.remove("up");e.style.maxHeight="";
  const L=e.parentElement.getBoundingClientRect();
  const bar=document.querySelector("#main .racebar");const roof=Math.max(document.getElementById("hdr").getBoundingClientRect().bottom,bar?bar.getBoundingClientRect().bottom:0);
  const below=(vv?vv.offsetTop:0)+h-L.bottom-8,above=L.top-roof-8;
  if(e.offsetHeight<=below)return;
  if(above>below){e.classList.add("up");e.style.maxHeight=Math.min(380,above)+"px"}
  else e.style.maxHeight=Math.max(200,below)+"px";
}
if(window.visualViewport)visualViewport.addEventListener("resize",fitPicklist);
window.addEventListener("resize",fitPicklist);window.addEventListener("scroll",fitPicklist,{passive:true});
function fieldGroupById(id){return A.R.fgroups.find(f=>f.id===id)||null}
function wireInputs(){
  const f=document.getElementById("mfilter");if(f)f.oninput=()=>{A.m.filter=f.value;render()};
  const ff=document.getElementById("ffilter");if(ff)ff.oninput=()=>{A.f.filter=ff.value;render()};
  const tn=document.getElementById("tnfilter");if(tn)tn.oninput=()=>{A.f.q=tn.value;render()};
  const aq=document.getElementById("mtaq");if(aq)aq.oninput=()=>{A.mt.aq=aq.value;render();const n=document.getElementById("mtaq");if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length)}};
  const mf=document.getElementById("mtfilter");if(mf)mf.oninput=()=>{A.mt.q=mf.value;mtSave();render()};
  const cam=document.getElementById("camin");if(cam)cam.onchange=e=>{const file=e.target.files[0];e.target.value="";onPhoto(file)};
  document.querySelectorAll("[data-time]").forEach(inp=>{
    inp.onfocus=()=>{inp.value=inp.value.replace(/[^0-9]/g,"");inp.select()};
    inp.onkeydown=async e=>{if(e.key==="Enter"){e.preventDefault();inp.dataset.saved="1";const l=inp.dataset.time;const all=[...document.querySelectorAll("[data-time]")];const i=all.findIndex(x=>x.dataset.time===l);const ok=await saveTime(l,inp.value);if(ok){const nx=document.querySelectorAll("[data-time]")[i+1];if(nx)nx.focus();else inp.blur();render();const n2=document.querySelectorAll("[data-time]")[i+1];if(n2)n2.focus()}}};
    inp.onchange=()=>{if(A.rendering||inp.dataset.saved)return;saveTime(inp.dataset.time,inp.value).then(ok=>{if(ok&&!A.rendering)render()})};
  });
  /* field marks: Enter moves to the next box in the row; every box saves on its own */
  document.querySelectorAll("[data-mark]").forEach(inp=>{
    const save=()=>{const fg=fieldGroupById(inp.dataset.g);if(!fg)return;const v=cleanMark(inp.value);
      if(!markOk(inp.value)){toast("Type 534 for 5.34 m, or 0.95 with the point.");render();return}
      const cur=((fieldDocOf(fg).marks||{})[inp.dataset.mark]||{}).a||{};
      if((cur[inp.dataset.a]||"")!==v)setMark(fg,inp.dataset.mark,+inp.dataset.a,v)};
    /* under 1.00 m stays as 0.95: on its own, 95 would be refused */
    inp.onfocus=()=>{const v=cleanMark(inp.value);if(v.length>=3)inp.value=v;inp.select()};
    inp.onchange=()=>{if(!A.rendering)save()};
    inp.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();const all=[...document.querySelectorAll("[data-mark]:not(:disabled)")];const nx=all[all.indexOf(inp)+1];inp.onchange=null;save();if(nx)nx.focus();else inp.blur()}};
  });
  document.querySelectorAll("[data-best]").forEach(inp=>{
    const save=()=>{const fg=fieldGroupById(inp.dataset.g);if(!fg)return;const v=cleanMark(inp.value);
      /* this box is a measured mark only: x or pass would wipe the result */
      if(!markOk(inp.value)||/[^0-9]/.test(v)){toast("Type 1124 for 11.24 m, or 0.95 with the point.");render();return}
      setBest(fg,inp.dataset.best,v)};
    inp.onfocus=()=>{const v=cleanMark(inp.value);if(v.length>=3)inp.value=v;inp.select()};
    inp.onchange=()=>{if(!A.rendering)save()};
    inp.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();inp.onchange=null;save();inp.blur()}};
  });
  document.querySelectorAll("[data-hjs],[data-hjn]").forEach(inp=>{inp.onchange=()=>{if(!A.rendering)hjTyped(inp)};inp.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();inp.blur()}}});
  document.querySelectorAll("[data-keepn]").forEach(inp=>{inp.onchange=()=>{A.f.keepN=Math.max(1,parseInt(inp.value,10)||4);render()}});
  document.querySelectorAll("[data-guide]").forEach(inp=>{inp.onchange=()=>{A.f.guide=Math.max(1,parseInt(inp.value,10)||10);render()}});
  document.querySelectorAll("[data-setd]").forEach(inp=>{inp.onchange=()=>{if(A.rendering)return;const f=inp.dataset.g?fieldGroupById(inp.dataset.g):fieldGroupOpen();if(!f)return;const v=cleanMark(inp.value);
    if(inp.value.trim()&&(!markOk(inp.value)||/[^0-9]/.test(v))){toast("Type 800 or 8.00 for 8.00 m.");render();return}
    fieldWrite(f,{setd:v})};inp.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();inp.blur()}}});
  document.querySelectorAll("[data-rule]").forEach(el=>{el.onchange=()=>{
    const k=el.dataset.rule,fld=el.dataset.f;const v=fld==="ties"?el.value:+el.value;
    saveCfg({rules:Object.assign({},A.cfg.rules||{},{[k]:Object.assign({},(A.cfg.rules||{})[k]||{},{[fld]:v})})},"Rule saved");
  }});
  document.querySelectorAll("[data-sheet]").forEach(el=>{el.onchange=()=>{
    saveCfg({sheet:sheetOf(A.cfg).map(r=>r.a===el.dataset.sheet?Object.assign({},r,{[el.dataset.f]:el.value.trim()}):r)},"Saved");
  }});
  document.querySelectorAll("[data-loc]").forEach(el=>{el.onchange=()=>{saveCfg({locs:Object.assign({},A.cfg.locs||{},{[el.dataset.loc]:+el.dataset.n})},"Locations saved")}});
  document.querySelectorAll("[data-limit]").forEach(el=>{el.onchange=()=>{
    const k=el.dataset.limit,i=+el.dataset.i;const L=Object.assign({},A.cfg.limits||{});const v=(L[k]||[null,null]).slice();
    if(!el.value.trim())v[i]=null;else{const p=parseTime(el.value);if(p.err){toast(p.err);return}v[i]=p.cs}
    L[k]=v;saveCfg({limits:L},"Limit saved");
  }});
  document.querySelectorAll("[data-evat]").forEach(el=>{el.onchange=()=>{saveCfg({events:eventsOf(A.cfg).map(e=>e.k===el.dataset.evat?Object.assign({},e,{at:el.value.trim()}):e)},"Time saved")}});
  const nw=document.getElementById("oNew");if(nw)nw.oninput=()=>{A.o.nm=nw.value};
  const ot=document.getElementById("oText");if(ot)ot.oninput=()=>{A.o.text=ot.value;A.o.preview=null};
  const rf=document.getElementById("oRestore");if(rf)rf.onchange=e=>{const file=e.target.files[0];e.target.value="";if(!file)return;const fr=new FileReader();
    fr.onload=()=>{const b=readBackup(String(fr.result));if(!b){toast("That file is not a full backup from this app.");return}
      A.modal={t:"orgPin",title:"Restore this backup?",ok:"Restore the backup",go:"restore",b,body:`<p style="margin:0">Backup saved ${esc(String(b.savedAt||"").slice(0,16))}: ${plural(b.heats.length,"race")}, ${((b.roster&&b.roster.F||[]).length+(b.roster&&b.roster.M||[]).length)} students, ${(b.records||[]).length} records.</p><p style="margin:0;font-weight:700">It replaces everything in the current carnival. Past years are not changed.</p>`};render()};
    fr.readAsText(file)};
  const of=document.getElementById("oFile");if(of)of.onchange=e=>{const file=e.target.files[0];if(!file)return;const fr=new FileReader();fr.onload=()=>{A.o.text=String(fr.result);A.o.preview=parseStudents(A.o.text,A.cfg.ageDate);render()};fr.readAsText(file)};
}
/* a device opens where the group is up to */
function fOpen(id){A.f.gid=id;A.f.q="";A.f.typed="";A.f.a=null;A.f.id=null;fReset();A.f.keepPrev=[];A.f.keepMsg="";const f=fieldGroupById(id);const G=f&&A.R.groups.get(f.key);A.f.i=G&&G.turn.up>=0?G.turn.up:0;fSave();render();window.scrollTo(0,0)}
const ACT={
  key:el=>pressKey(el.dataset.k),
  pinstart:()=>pinStart(),
  menu:()=>{A.menu=!A.menu;renderHeader()},
  goto:el=>goJob(el.dataset.job),
  signout:()=>{if(A.job==="marshal"&&A.m.phase==="lanes"&&Object.keys(A.m.lanes).length){A.modal={t:"leaveMarshal",to:null};A.menu=false;render();return}signOut()},
  closemodal:()=>{A.modal=null;A.f.filter="";render()},
  modalbg:(el,e)=>{if(e.target===el){A.modal=null;render()}},
  leaveok:()=>{const to=A.modal&&A.modal.to;A.modal=null;A.m.phase="start";A.m.lanes={};A.m.k=null;A.m.x=null;A.m.g=null;A.m.gs=[];if(to==="marshal"){announce();render()}else if(to)goJob(to);else signOut()},
  mpick:el=>{const m=A.m;m.msg="";
    if(el.dataset.f==="gs"){const v=el.dataset.v;const cur=m.gs||[];m.gs=cur.includes(v)?cur.filter(a=>a!==v):cur.concat([v]);render();return}
    m[el.dataset.f]=el.dataset.v;
    if(el.dataset.f==="k"){const ev=mEv();if(m.g&&!groupsOf(ev).includes(m.g))m.g=null;if(ev.gk==="open")m.g="O"}
    render()},
  mpickall:()=>{const m=A.m;m.msg="";m.gs=(m.gs||[]).length===AGE_GROUPS.length?[]:AGE_GROUPS.slice();render()},
  mgo:()=>marshalGo(),
  mlane:el=>{const l=+el.dataset.l;A.m.open=A.m.open===l?null:l;A.m.cur=l;A.m.filter="";render()},
  mset:el=>{const l=+el.dataset.l;A.m.lanes[l]=el.dataset.id;const n=nextEmpty(l);A.m.cur=n||l;A.m.open=mEv().relay?null:n;A.m.filter="";render()},
  mclear:el=>{delete A.m.lanes[+el.dataset.l];A.m.cur=+el.dataset.l;render()},
  mclose:()=>{A.m.open=null;render()},
  maddnew:el=>{const m=A.m;const l=+el.dataset.l;const ev=m.phase==="edit"?eventOf(A.cfg,m.k):mEv();
    A.modal={t:"addStudent",x:m.x,ages:agesFor(ev,m.phase==="edit"&&m.edit!=null?heatGs(A.heats.find(h=>h.race===m.edit)||{g:m.g}):m.g),then:async st=>{m.open=null;if(m.phase==="edit")await setHeatLane(m.edit,l,st.id);else{m.lanes[l]=st.id;m.cur=nextEmpty(l)||l}}};render()},
  addstudent:()=>addStudent(),
  mback:()=>{if(Object.keys(A.m.lanes).length){A.modal={t:"leaveMarshal",to:"marshal"};render();return}finishMarshalRace()},
  mnext:async()=>{if(await sendHeat())render()},
  mnew:()=>{if(Object.keys(A.m.lanes).length){A.modal={t:"confirmHeat"};render()}else finishMarshalRace()},
  mconfirm:async()=>{A.modal=null;if(await sendHeat())finishMarshalRace();else render()},
  jtap:el=>{if(!locked())judgeTap(+el.dataset.l)},
  jundo:()=>judgeUndo(),
  jreset:()=>{const r=judgeRace();const n=Object.keys(finishOrderFromTaps(judgeFin(r).order)).length;if(!n)return;A.modal={t:"judgeReset",race:r.race,placed:n};render()},
  jresetok:()=>{const r=judgeRace();A.modal=null;saveFinish(r,[],true)},
  jnext:()=>judgeNext(false),
  jconfirm:()=>judgeNext(true),
  jlatest:()=>{A.j.race=latestRace(judgeRaces());render()},
  jgoto:()=>{A.modal={t:"goRace",job:"judge"};render()},
  rgoto:()=>{A.modal={t:"goRace",job:"recorder"};render()},
  sgoto:()=>{A.modal={t:"goRace",job:"slips"};render()},
  medit:()=>{A.modal={t:"goRace",job:"medit"};render()},
  medone:()=>{const m=A.m;m.phase="start";m.edit=null;m.k=null;m.x=null;m.g=null;m.gs=[];m.open=null;m.filter="";render();window.scrollTo(0,0)},
  meset:async el=>{const l=+el.dataset.l;A.m.open=null;A.m.filter="";await setHeatLane(A.m.edit,l,el.dataset.id);render()},
  meclear:async el=>{const l=+el.dataset.l;A.m.open=null;await setHeatLane(A.m.edit,l,null);render()},
  raddlane:el=>{A.m.filter="";A.modal={t:"pickLane",race:recRace().race,l:+el.dataset.l};render()},
  rsetlane:async el=>{const M=A.modal;if(!M)return;const p=A.R.who(el.dataset.id);A.modal=null;A.m.filter="";if(await setHeatLane(M.race,M.l,el.dataset.id))toast(`Lane ${M.l}: ${pname(p)} added`);render()},
  pickrace:el=>{const n=+el.dataset.race;const j=el.dataset.job;if(j==="medit"){const H=A.heats.find(h=>h.race===n);if(H){Object.assign(A.m,{phase:"edit",edit:n,k:H.k,x:H.x,g:H.g,open:null,filter:""})}A.modal=null;render();window.scrollTo(0,0);return}if(j==="judge")A.j.race=n;else if(j==="recorder"){A.r.race=n;A.r.since=Date.now();announce()}else{A.s.race=n;A.s.err=null}A.modal=null;render()},
  rtabrec:el=>{A.r.tab=el.dataset.v;render()},
  rnext:()=>{const n=nextRaceAfter(A.r.race);if(n==null)return;A.r.race=n;A.r.since=Date.now();announce();render()},
  rlatest:()=>{A.r.race=latestRace();A.r.since=Date.now();announce();render()},
  rcancel:()=>{A.modal={t:"cancelRace",race:A.r.race};render()},
  rcancelok:()=>cancelRace(A.modal.race,true),
  runcancel:()=>cancelRace(A.r.race,false),
  rrerun:()=>{A.modal={t:"rerunRace",race:A.r.race};render()},
  rrerunok:()=>rerunRace(A.modal.race),
  rslipuse:el=>{const r=recRace();const v=r.times[el.dataset.l]||{};setLane(el.dataset.l,{t:v.slip,st:"ok",src:"photo",keep:false,chk:false,slip:null})},
  rslipkeep:el=>setLane(el.dataset.l,{slip:null}),
  rslip:()=>viewSlip(A.r.race),
  sreplace:()=>{const go=A.modal&&A.modal.go;A.modal=null;render();if(go)go()},
  rst:el=>{const r=recRace();const cur=(r.times[el.dataset.l]||{});const st=el.dataset.st;setLane(el.dataset.l,cur.st===st?{st:cur.t!=null?"ok":null}:{st,src:cur.src||"typed"})},
  rkeep:el=>setLane(el.dataset.l,{keep:true}),
  rfix:el=>{const r=recRace();const i=document.getElementById("t-"+r.race+"-"+el.dataset.l);if(i)i.focus()},
  rcheck:()=>timesChecked(false),
  rforce:()=>timesChecked(true),
  rfgroup:el=>{A.r.fkey=el.dataset.v;render()},
  rovr:()=>{if(A.r.ovr){A.r.ovr=false;render();return}
    if(A.role==="org"){A.r.ovr=true;render();return}
    A.modal={t:"orgPin",title:"Override a field result?",ok:"Turn override on",go:"override",body:`<p style="margin:0">Only the event coordinator can overrule a result. Changes show on every device at once.</p>`};render()},
  snext:()=>{const n=nextRaceAfter(A.s.race);if(n!=null)A.s.race=n;A.s.err=null;render()},
  stest:el=>{A.s.test=el.dataset.v;render()},
  soverall:()=>{const r=slipRace();if(r){A.modal={t:"overall",race:r.race};render()}},
  mtname:el=>{const M=A.mt;const id=el.dataset.id;M.picked=M.picked.includes(id)?M.picked.filter(x=>x!==id):M.picked.concat([id]);mtSave();render()},
  mtadd:()=>{const r=slipRace();if(!r)return;A.modal={t:"addStudent",x:r.x,ages:agesFor(r.ev,r.gs||r.g),then:async st=>{A.mt.picked=A.mt.picked.concat([st.id]);mtSave()}};render()},
  mtnames:()=>mtNamesDone(),
  smode:el=>setSlipMode(el.dataset.v),
  mtaddopen:()=>{if(locked())return;A.mt.aq="";A.modal={t:"mtAddRunner"};render()},
  mtaddrun:el=>mtAddRunner(el.dataset.id),
  mtaddnot:()=>{const r=slipRace();if(!r)return;if(mtFreeLane(r)==null){A.modal=null;toast(mtLanesFull(r));render();return}A.modal={t:"addStudent",x:r.x,ages:agesFor(r.ev,r.gs||r.g),then:async st=>{await mtAddRunner(st.id)}};render()},
  mtrename:()=>{A.mt.phase="names";mtSave();render()},
  mtgo:(el,e,at)=>mtGo(at),
  mtsplit:(el,e,at)=>mtSplit(at),
  mtstop:(el,e,at)=>mtStop(false,at),
  mtstopok:()=>mtStop(true),
  mtunsplit:()=>{A.mt.splits.pop();mtSave();render()},
  mttap:el=>{if(!locked())mtTap(el.dataset.id)},
  mtundo:()=>{A.mt.taps.pop();mtSave();render()},
  mtfix:()=>{A.modal={t:"mtFix"};render()},
  mtdel:el=>{const sp=A.mt.splits.slice();sp.splice(+el.dataset.i,1);mtFixSplits(sp)},
  mtaddok:()=>{const raw=document.getElementById("mtaddt").value;const p=parseTime(raw);
    if(!raw.trim()||p.err){A.modal.raw=raw;A.modal.err=p.err||"Type a time first.";render();return}
    A.modal.raw="";A.modal.err=null;mtFixSplits(A.mt.splits.concat(p.cs))},
  mtclear:()=>{const r=slipRace();A.modal=null;const keep=A.mt.picked;A.mt=mtBlank(r?r.race:null,r?mtSig(r):"");A.mt.picked=keep;A.mt.phase="ready";mtSave();mtWake(false);render()},
  mtsend:()=>mtSend(false),
  mtsendok:()=>mtSend(true),
  mtnext:()=>mtNext(),
  mtnew:()=>mtNew(),
  mtpick:el=>mtPick(el.dataset.f,el.dataset.v),
  mttake:()=>mtTake(),
  mtmarshal:()=>{A.mt=mtBlank(null);mtSave();signOut()},
  mtnoheat:()=>{if(A.mt.picked.length){A.modal={t:"mtNoHeat",n:A.mt.picked.length};render();return}mtDraftDrop()},
  mtnoheatok:()=>{A.modal=null;mtDraftDrop()},
  fstation:el=>{A.f.station=el.dataset.v;fSave();render()},
  fopen:el=>fOpen(el.dataset.v),
  fall:()=>{A.f.gid=null;A.f.typed="";A.f.a=null;A.f.id=null;fReset();fSave();render();window.scrollTo(0,0)},
  faddopen:()=>{A.f.filter="";A.modal={t:"fieldAdd"};render()},
  fadd:async el=>{const f=modalGroup();if(f)await fieldToggle(f,el.dataset.id)},
  fcell:el=>{A.f.a=+el.dataset.a;fSave();render()},
  rfadd:()=>{const f=A.R.fgroups.find(x=>x.key===A.r.fkey);if(!f)return;A.f.filter="";A.modal={t:"fieldAdd",gid:f.id};render()},
  rfreopen:()=>{const f=A.R.fgroups.find(x=>x.key===A.r.fkey);if(f)fieldWrite(f,{final:false})},
  faddnew:()=>{const f=modalGroup();if(!f)return;A.modal={t:"addStudent",x:f.x,ages:[f.g],then:async st=>{await fieldAdd(f,st.id)}};render()},
  hjtap:el=>{const f=fieldGroupById(el.dataset.g);if(f)hjStep(f,el.dataset.id,+el.dataset.h)},
  hjpop:el=>{A.f.conf=null;const same=A.f.pop&&A.f.pop.id===el.dataset.id&&+A.f.pop.h===+el.dataset.h;A.f.pop=same?null:{id:el.dataset.id,h:+el.dataset.h};render()},
  hjadd:el=>hjAdd(el),
  hjsreset:()=>{const f=fieldGroupOpen();if(f)fieldWrite(f,{hs:0})},
  hjnreset:()=>{const f=fieldGroupOpen();if(!f)return;const p=fieldView(f).plan;if(p.cur!=null)fieldWrite(f,{hn:{[p.at+1]:0}})},
  ljpop:el=>ljPopOpen(el),ljkey:el=>{if(A.f.mopen!=null||A.f.pop)ljKey(el.dataset.k)},ljput:el=>ljPut(el.dataset.v),ljcancel:()=>{A.f.pop=null;A.f.typed="";fSave();render()},
  ffin:el=>{const f=fieldGroupOpen();if(!f)return;A.f.pop=null;A.f.typed="";const r=fieldView(f).rows.find(x=>x.id===el.dataset.id);if(!r)return;if(endHeld)return;if(r.m.fin){toast("Press and hold ENDED to bring them back.");return}fieldFinishAth(f,r.id)},
  ffinphone:()=>{const f=fieldGroupOpen();if(f)fieldEndPhone(f)},
  ffoul:()=>fieldPhoneAct("foul"),
  fkeep:()=>fieldKeep(),fkeepundo:()=>fieldKeepUndo(),
  fcut:()=>{A.f.cut=!A.f.cut;render()},fedit:()=>{A.f.edit=!A.f.edit;render()},
  tgtick:el=>{const f=(el.dataset.g&&fieldGroupById(el.dataset.g))||fieldGroupOpen();if(!f)return;const on=!!((fieldView(f).G.doc.tg||{})[el.dataset.id]);fieldWrite(f,{tg:{[el.dataset.id]:!on}})},
  tgstart:()=>{const f=fieldGroupOpen();if(!f)return;const n=Object.values(fieldView(f).G.doc.tg||{}).filter(Boolean).length;
    if(!n&&!A.f.tg0){A.f.tg0=true;toast("Nobody is ticked, so nobody throws again. Tap Start again to go on, or tick the athletes.");return}
    A.f.tg0=false;A.f.ta=false;fieldWrite(f,{tgo:true})},
  tgchange:()=>{const f=fieldGroupOpen();if(f){A.f.ta=true;fieldWrite(f,{tgo:false})}},
  tgopen:()=>{A.f.ta=true;render();window.scrollTo(0,0)},
  tgmeasure:()=>{A.f.measure=true;render();window.scrollTo(0,0)},
  tgmback:()=>{A.f.measure=false;A.f.mopen=null;A.f.typed="";render()},
  mopen:el=>{const f=fieldGroupOpen();if(!f)return;const same=A.f.mopen===el.dataset.id;A.f.mopen=same?null:el.dataset.id;const cur=((curMark(f,el.dataset.id)).best)||"";A.f.typed=same?"":(/^[0-9]+$/.test(cur)?cur:"");render()},
  mcancel:()=>{A.f.mopen=null;A.f.typed="";render()},
  msave:()=>{const f=fieldGroupOpen();if(!f||!A.f.mopen)return;if(!A.f.typed){A.f.mopen=null;render();return}if(A.f.typed.length<2){toast("Type the whole mark: 1124 is 11.24 m.");return}const id=A.f.mopen,m=A.f.typed;A.f.mopen=null;A.f.typed="";setBest(f,id,m)},
  fsumback:()=>{A.f.summary=false;render()},
  fsend:()=>fieldFinish().then(()=>{A.f.summary=true;render()}),
  wtset:el=>{const f=(el.dataset.g&&fieldGroupById(el.dataset.g))||fieldGroupOpen();if(f)fieldWeight(f,el.dataset.id,+el.dataset.v)},
  ttap:el=>{const f=fieldGroupById(el.dataset.g);if(f)throwStep(f,el.dataset.id,+el.dataset.a)},
  hjtry:el=>{const f=fieldGroupOpen();if(f)hjTry(f,el.dataset.id,+el.dataset.h,el.dataset.v,el.dataset.box)},
  ftake:el=>{const f=fieldGroupOpen();if(f)fieldTake(f,el.dataset.id)},
  fstart:()=>fieldStart(),
  fthrow:el=>{const f=fieldGroupOpen();if(!f)return;const v=fieldView(f);const r=v.turn.up>=0?v.rows[v.turn.up]:fieldCur(v);if(!r)return;const m=r.m.t||{};for(let i=0;i<v.rule.attempts;i++)if(!m[i]){A.f.id=r.id;setThrow(f,r.id,i,el.dataset.v);return}},
  fkey:el=>fieldPhoneAct("key",el.dataset.k),
  fpass:()=>fieldPhoneAct("pass"),
  fsave:()=>fieldPhoneAct("save"),
  fnext:()=>{const f=fieldGroupOpen();if(!f)return;const v=fieldView(f);if(!v.rows.length)return;const t=v.turn;
    /* high jump: the athlete the Next line names, and on round the list, so any athlete's box can be fixed */
    A.f.i=v.ev.style==="height"?(t.up===A.f.i&&t.next>=0?t.next:nextAfter(v.rows,A.f.i)):t.up>=0&&t.up!==A.f.i?t.up:nextAfter(v.rows,A.f.i);A.f.id=null;fSave();render();window.scrollTo(0,0)},
  fundo:()=>fieldUndo(),
  ffinish:()=>{const f=fieldGroupOpen();if(!f)return;const v=fieldView(f);if(phoneNow()){A.f.summary=true;A.f.mopen=null;render();window.scrollTo(0,0);return}A.modal={t:"fieldFinish",label:groupLabel(v.ev,f.x,f.g),unmeasured:v.G&&v.G.setd&&!v.G.setd.ok?v.G.setd.n:0};render()},
  ffinishok:()=>fieldFinish(),
  aprev:()=>{const f=finalsInOrder();const i=Math.max(0,A.a.idx-1);A.a.key=f[i]?f[i].key:null;render()},
  aread:()=>{const f=finalsInOrder();if(f[A.a.idx])markRead(f[A.a.idx].key);const i=Math.min(f.length-1,A.a.idx+1);A.a.key=f[i]?f[i].key:null;render()},
  rtab:el=>{A.res.tab=el.dataset.v;render()},
  rview:el=>{A.res.view=el.dataset.v;render()},
  csv:()=>exportCsv(),
  hrisfile:()=>exportHris(),
  newscopy:async()=>{try{await navigator.clipboard.writeText(document.getElementById("newsText").textContent);toast("Text copied")}catch(e){toast("Select the text and copy it.")}},
  osec:el=>{A.o.sec=el.dataset.v;render()},
  rfend:el=>{const f=fieldGroupById(el.dataset.g)||fieldGroupOpen();if(f)fieldFinishAth(f,el.dataset.id)},
  rfback:el=>{const f=fieldGroupById(el.dataset.g)||fieldGroupOpen();if(f)setField(f,el.dataset.id,"fin",0,false)},
  ptog:()=>{if(A.past)return;const on=!parentsCfg().on;saveCfg({parents:on},on?"Parents page is on":"Parents page is off")},
  pshow:el=>{if(A.past)return;const p=parentsCfg();saveCfg({parentsShow:Object.assign({},p.show,{[el.dataset.v]:!p.show[el.dataset.v]})},"Saved")},
  pnames:el=>{if(A.past)return;saveCfg({parentsNames:el.dataset.v},el.dataset.v==="short"?"Names: first name and surname initial":"Names are hidden from parents")},
  pprov:()=>{if(A.past)return;saveCfg({parentsProv:!parentsCfg().prov},"Saved")},
  pcopy:async()=>{try{await navigator.clipboard.writeText(parentsUrl());toast("Link copied")}catch(e){toast("Could not copy. Select the link and copy it.")}},
  year:el=>enterYear(el.dataset.v),
  changeyear:()=>{A.yearPicked=null;ssSet("aths_year",null);A.job=null;A.menu=false;render()},
  osavedetails:()=>saveCfg({name:document.getElementById("cName").value.trim()||A.cfg.name,date:document.getElementById("cDate").value||A.cfg.date,ageDate:document.getElementById("cAge").value||A.cfg.ageDate,venue:document.getElementById("cVenue").value.trim(),lanes:Math.max(4,Math.min(10,+document.getElementById("cLanes").value||8)),chief:document.getElementById("cChief").value.trim()},"Details saved"),
  opin:el=>{const v=el.dataset.v;const p=document.getElementById("pin-"+v).value.trim();
    if(!/^\d{4}$/.test(p)){toast("A PIN is 4 digits.");return}
    const h=pinHash(p);const P=pins();const clash=PIN_ROLES.find(([k])=>k!==v&&P[k]===h);
    if(clash){toast("That PIN is already used for "+clash[1]+". Pick a different one.");return}
    saveCfg({pins:Object.assign({},A.cfg.pins||{},{[v]:h})},PIN_ROLES.find(x=>x[0]===v)[1]+" PIN changed")},
  oload:()=>{A.o.load=!A.o.load;render()},
  ocheck:()=>{const ta=document.getElementById("oText");A.o.text=ta.value;A.o.preview=parseStudents(A.o.text,A.cfg.ageDate);render()},
  otest:()=>{A.o.preview={ok:TEST_STUDENTS(),bad:[]};A.o.text="";render()},
  oimport:async()=>{const ok=A.o.preview.ok;const F=ok.filter(s=>s.x==="F"),M=ok.filter(s=>s.x==="M");
    const r1=await w0(()=>A.store.set("roster/F",{students:F,at:Date.now()}));const r2=r1&&await w0(()=>A.store.set("roster/M",{students:M,at:Date.now()}));
    if(r2){A.roster={F,M};A.o.preview=null;A.o.text="";A.o.load=false;recompute();toast(ok.length+" students imported");render()}},
  oswitch:el=>saveCfg({events:eventsOf(A.cfg).map(e=>e.k===el.dataset.v?Object.assign({},e,{on:!e.on}):e)},"Program saved"),
  oaddstart:()=>{A.o.adding=true;A.o.nm="";A.o.nt="field";render()},
  oaddcancel:()=>{A.o.adding=false;render()},
  oaddtype:el=>{const i=document.getElementById("oNew");if(i)A.o.nm=i.value;A.o.nt=el.dataset.v;render()},
  oaddev:()=>{const nm=String(document.getElementById("oNew").value||"").trim();if(!nm){toast("Type the event name.");return}
    const ev=newEvent(eventsOf(A.cfg),nm,A.o.nt==="track"?"track":"field");A.o.adding=false;
    saveCfg({events:eventsOf(A.cfg).concat([ev]),locs:Object.assign({},A.cfg.locs||{},ev.kind==="field"?{[ev.k]:1}:{})},nm+" added")},
  oevdel:el=>{const k=el.dataset.v;const has=A.heats.some(h=>h.k===k)||Object.values(A.field).some(d=>d.k===k);
    if(has){A.modal={t:"info",title:"This event has results",body:`<p style="margin:0">Results are saved for this event, so it cannot be removed. Turn it off instead.</p>`};render();return}
    const ev=eventOf(A.cfg,k);saveCfg({events:eventsOf(A.cfg).filter(e=>e.k!==k)},ev.name+" removed")},
  onext:()=>setNextRace(),
  onotrun:()=>{const k=document.getElementById("oNotRun").value;if(!k)return;saveCfg({notRun:[...new Set([...(A.cfg.notRun||[]),k])]},"Marked not run")},
  onotrunundo:el=>saveCfg({notRun:(A.cfg.notRun||[]).filter(k=>k!==el.dataset.k)},"Not run taken off"),
  orecload:()=>{A.modal={t:"records"};render()},
  orecdel:el=>{A.records=A.records.filter(r=>r.key!==el.dataset.k);w0(()=>A.store.set("records/all",{list:A.records}));recompute();render()},
  orecpaste:async()=>{const p=parseRecordRows(document.getElementById("rcPaste").value,A.cfg);
    if(!p.out.length){A.modal.err="No rows understood. Check the columns.";render();return}
    await addRecords(p.out);A.modal=null;toast(plural(p.out.length,"record")+" added"+(p.bad.length?". Rows not understood: "+p.bad.join(", "):""));render()},
  obackup:()=>downloadBackup(),
  oclear:()=>{if(A.past){toast("Past years are look only.");return}A.o.newMsg="";A.modal={t:"orgPin",title:"Clear practice data?",ok:"Clear practice data",go:"clear",body:`<p style="margin:0"><b>Cleared:</b> ${plural(A.heats.length,"race")} with their places and times, the field results${A.extras.length?", and "+plural(A.extras.length,"athlete")+" added on the day":""}. Race number back to 1.</p><p style="margin:0"><b>Kept:</b> ${students().length-A.extras.length} students, settings, PINs, program, points, limits and records.</p><p style="margin:0;font-weight:700">This cannot be undone. Download a full backup first if you may need it.</p>`};render()},
  oorgpinok:async()=>{const M=A.modal;if(!M)return;
    const ok=await orgPinOk(document.getElementById("opPin").value.trim());if(ok===null)return;
    if(!ok){M.err="That PIN is not right. Try again.";render();return}
    if(M.go==="clear")clearPractice();else if(M.go==="restore")restoreBackup(M.b);else if(M.go==="override"){A.modal=null;A.r.ovr=true;render()}},
  olock:()=>saveCfg({locked:!A.cfg.locked,lockedAt:A.cfg.locked?null:Date.now()},A.cfg.locked?"Results unlocked":"Results locked"),
  onew:()=>{if(A.past){toast("Past years are look only.");return}const yr=(A.cfg.date||"2027").slice(0,4);if(A.years.some(y=>String(y.year)===yr)){A.modal={t:"info",title:"Year already kept",body:`<p style="margin:0">The ${esc(yr)} carnival has already been kept. Change the carnival date in section 1 to the right year first.</p>`};render();return}A.modal={t:"newCarnival",step:1};A.o.newMsg="";render()},
  onew1:async()=>{const ok=await orgPinOk(document.getElementById("ncPin").value.trim());if(ok===null)return;if(!ok){A.modal.err="That PIN is not right. Try again.";render();return}
    const list=A.R.broken.filter(G=>G.final).map(G=>G.label+": "+G.recordNote.rows.map(r=>pname(r.p)).join(" and ")+" "+resultText(G,G.recordNote.rows[0])+(G.recordNote.kind==="new"?" (new)":" (equal)"));
    A.modal={t:"newCarnival",step:2,list};render()},
  onew2:el=>newCarnival(el.dataset.v==="yes")
};
/* multitimer START, SPLIT and STOP: the time is when the finger lands, but the tap only counts when the
   finger lifts without the page scrolling. A scroll cancels the pointer or moves it. */
let mtDown=0;const mtPend=new Map();
document.addEventListener("pointerdown",e=>{
  const el=e.target.closest("[data-mt]");if(!el||el.disabled||e.button>0)return;
  e.preventDefault();mtPend.set(e.pointerId,{act:el.dataset.act,el,x:e.clientX,y:e.clientY,at:Date.now()});
});
function mtDrop(id){if(mtPend.delete(id))mtDown=Date.now()}
document.addEventListener("pointermove",e=>{const p=mtPend.get(e.pointerId);if(p&&Math.hypot(e.clientX-p.x,e.clientY-p.y)>12)mtDrop(e.pointerId)});
document.addEventListener("pointercancel",e=>mtDrop(e.pointerId));
document.addEventListener("pointerup",e=>{
  const p=mtPend.get(e.pointerId);if(!p)return;
  mtPend.delete(e.pointerId);mtDown=Date.now();const f=ACT[p.act];if(f)f(p.el,e,p.at);
});
/* the slim banner is for phones only. A resize only redraws when the layout must change, so text being typed is never lost */
let wasPhone=phoneNow();let rsT=0;
window.addEventListener("resize",()=>{clearTimeout(rsT);rsT=setTimeout(()=>{
  const h=document.getElementById("hdr");
  if(phoneNow()!==wasPhone||slimHdr()!==h.classList.contains("slim")){wasPhone=phoneNow();render()}
  else document.documentElement.style.setProperty("--hdrh",h.offsetHeight+"px");
},150)});
/* press and hold ENDED for about a second to bring an athlete back (decision 87) */
let endTimer=null,endHeld=false;
document.addEventListener("pointerdown",e=>{
  const el=e.target.closest("[data-end]");endHeld=false;if(!el||el.disabled||el.getAttribute("aria-pressed")!=="true")return;
  clearTimeout(endTimer);endTimer=setTimeout(()=>{const f=fieldGroupOpen();if(!f)return;endHeld=true;setField(f,el.dataset.id,"fin",0,false)},900);
});
document.addEventListener("contextmenu",e=>{if(e.target.closest&&e.target.closest("[data-end]"))e.preventDefault()});
["pointerup","pointerleave","pointercancel"].forEach(t=>document.addEventListener(t,e=>{if(e.target.closest&&e.target.closest("[data-end]"))clearTimeout(endTimer)},true));
document.addEventListener("click",e=>{
  const el=e.target.closest("[data-act]");
  if(!el){if(A.menu&&!e.target.closest(".jobpill")){A.menu=false;renderHeader()}return}
  if(el.disabled)return;
  if(el.dataset.mt!=null&&Date.now()-mtDown<800)return;
  const f=ACT[el.dataset.act];if(f)f(el,e);
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){if(A.modal){A.modal=null;render()}else if(A.menu){A.menu=false;renderHeader()}return}
  /* the PIN can be typed on a Mac keyboard */
  if(!A.role&&!/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||"")){
    if(/^[0-9]$/.test(e.key))pressKey(e.key);else if(e.key==="Backspace")pressKey("Back");else if(e.key==="Enter")pinStart();
  }
});
render();
connect();
