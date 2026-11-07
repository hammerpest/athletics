/* ===== Time Slips and the Multitimer ===== */
/* a relief phone or a reload opens on the first race after the last one with a slip */
function slipRace(){
  const list=liveRaces();if(!list.length)return null;
  if(A.mt&&(A.mt.phase==="run"||A.mt.phase==="place")&&A.R.races.has(A.mt.race))A.s.race=A.mt.race;
  if(A.s.race==null||!A.R.races.has(A.s.race)){let i=-1;list.forEach((r,n)=>{if(r.hasSlip)i=n});A.s.race=(list[i+1]||list[Math.max(i,0)]).race}
  A.s.race=liveRaceNo(A.s.race,list);
  return A.R.races.get(A.s.race);
}
/* Aths Opt 1.9: the Take photo or Multi switch is always shown and the choice is the user's (decision 101).
   It is kept for each race. With no choice yet, a race with no lanes (800 m, 1500 m) opens on Multi and any other race on Take photo. */
const SM_KEY="aths_slipmodes";
function slipModes(){try{return JSON.parse(localStorage.getItem(SM_KEY)||"{}")}catch(e){return {}}}
function slipModeKey(r){return (A.cfg.runId||"")+"/"+(r.draft?"d":"")+r.race}
function slipMode(r){return slipModes()[slipModeKey(r)]||(r.multi?"multi":"photo")}
function setSlipMode(v){const r=mtDraftRace()||slipRace();if(!r||(v!=="photo"&&v!=="multi"))return;const m=slipModes();m[slipModeKey(r)]=v;try{localStorage.setItem(SM_KEY,JSON.stringify(m))}catch(e){}render();window.scrollTo(0,0)}
function slipSwitch(mode){
  /* while a race is being timed or placed on the multitimer, the choice is locked until it is sent */
  const running=!!(A.mt&&(A.mt.phase==="run"||A.mt.phase==="place"));
  return `<div class="tabs" role="group" aria-label="How to time this race" style="margin:0">${[["photo","Take photo"],["multi","Multi"]].map(([k,l])=>`<button type="button" data-act="smode" data-v="${k}" aria-pressed="${mode===k}" ${running&&mode!==k?"disabled":""}>${l}</button>`).join("")}</div>${running?`<div class="muted" style="font-size:.85rem">Send or clear this race before you switch.</div>`:""}`;
}
function slipQueued(){return A.s.queued||0}
function slipWaiting(race){return !!(A.s.waiting&&A.s.waiting[race])}
function renderSlips(){
  if(A.mt&&A.mt.draft&&A.mt.draft.pick){if(A.mt.draft.run===(A.cfg.runId||""))return renderMultiPick();A.mt=mtBlank(null);mtSave()}
  const r=mtDraftRace()||slipRace();const waiting=slipQueued();
  const top=waiting?`<div class="msg warn">No signal. ${plural(waiting,"photo")} waiting to send. It sends by itself when there is signal.</div>`:"";
  if(!r)return `<div class="phone">${top}${waitingCard("Waiting for the marshal","Race 1 appears here once it is sent.")}</div>`;
  const mode=slipMode(r);const sw=slipSwitch(mode);
  if(mode==="multi")return renderMulti(r,top,sw);
  const noNames=!r.filled.length;
  const done=r.hasSlip;const t=A.s.test||"good";
  const showNext=done&&!A.s.err&&!A.s.flash;
  const hasNext=nextRaceAfter(r.race)!=null;
  const CAM=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/></svg>`;
  return `${lockBar()}<div class="phone">${top}${sw}
    <div class="racebar" style="margin:0">${badge(r.race,"xl")}<div class="info"><b>${esc(r.label)}</b><span>Heat ${r.heat}</span></div></div>
    ${A.s.err?`<div class="msg bad" role="alert">${A.s.err}</div>`:""}
    ${showNext?`<div class="msg ${slipWaiting(r.race)?"warn":"ok"}">${slipWaiting(r.race)?`Race ${r.race} slip saved on this phone. It sends by itself when there is signal.`:`Race ${r.race} slip read and sent to the Recorder.`}</div>
       ${hasNext?`<button type="button" class="btn navy big" data-act="snext">Next race</button>`:`<button type="button" class="btn big" disabled>Waiting for marshal</button>`}
       <label class="btn big" for="camin">Replace this slip with a new photo</label>
       <div class="row" style="flex-wrap:nowrap"><button type="button" class="btn big" style="flex:1" data-act="sgoto">Check race</button><button type="button" class="btn big" style="flex:1" data-act="soverall">Race overall</button></div>`
     :noNames?`<div class="msg warn">Race ${r.race} has no names yet, so there is no slip to read. Choose Multi to add the names.</div>`
     :A.s.sending?`<div class="cam" role="status">Sending the slip...</div>`
     :`<label class="cam" for="camin">${CAM}${A.s.err?"Take again":"Take photo of the slip"}</label>
       <div class="msg info">Race ${r.race} is ready. Hold the phone flat over the printed slip.</div>`}
    <input id="camin" type="file" accept="image/*" capture="environment" hidden ${locked()?"disabled":""}>
    <div class="panel stack" style="gap:8px;background:var(--sunk);border-color:transparent">
      <span class="label">Slip reader: test mode</span>
      <p style="margin:0;font-size:.88rem">The reader for the track slip is built once a real slip photo arrives. Until then the photo is saved and test times are made up, so the Recorder can be tried. Pick what the next photo should do:</p>
      <div class="row" style="gap:6px">${[["good","Read OK"],["bad","Cannot read"],["wrong","Wrong slip"],["offline","No signal"]].map(([k,l])=>`<button type="button" class="choice" style="min-height:48px;min-width:0;font-size:.9rem" data-act="stest" data-v="${k}" aria-pressed="${t===k}">${l}</button>`).join("")}</div>
    </div>
  </div>
  ${A.s.flash?`<div class="flash ${A.s.flash.c}" role="status">${esc(A.s.flash.t)}</div>`:""}`;
}
function shrink(file){
  return new Promise(res=>{
    const fr=new FileReader();
    fr.onload=()=>{const img=new Image();img.onload=()=>{
      const sc=Math.min(1,1000/Math.max(img.width,img.height));const c=document.createElement("canvas");
      c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      let q=0.6,d=c.toDataURL("image/jpeg",q);while(d.length>180000&&q>0.25){q-=0.1;d=c.toDataURL("image/jpeg",q)}
      res(d)};img.onerror=()=>res(null);img.src=fr.result};
    fr.onerror=()=>res(null);fr.readAsDataURL(file);
  });
}
/* made-up times for test mode: plausible for the distance */
function testRead(r){
  const base={100:1300,200:2750,400:6300}[r.ev.dist]||(r.ev.relay?5600:Math.max(1300,r.ev.dist*14));
  const read={};for(const l of r.filled)read[l]=Math.round(base*(0.9+Math.random()*0.25));
  return {race:r.race,lanes:read};
}
async function onPhoto(file){
  const r=slipRace();if(!r||!file)return;
  const t=A.s.test||"good";
  A.s.err=null;
  const CANT="Could not read the slip. Hold the phone flat over the slip so all lanes and times are in the picture, with no glare. Then take it again.";
  const img=await shrink(file);
  if(t==="bad"||!img){A.s.err=CANT;render();return}
  const read=testRead(r);
  if(t==="wrong")read.race=r.race+1;
  if(read.race!==r.race){A.s.err=`Wrong slip? This slip says Race ${read.race}. The screen is on Race ${r.race}. Find the Race ${r.race} slip and take it again.`;render();return}
  const key=rid(r.race);
  /* a race that already has a slip asks before the new photo replaces it */
  if(r.hasSlip){A.modal={t:"replaceSlip",race:r.race,go:()=>keepPhoto(r,t,key,read,img)};render();return}
  await keepPhoto(r,t,key,read,img);
}
async function keepPhoto(r,t,key,read,img){
  A.s.pend=A.s.pend||{};
  if(A.s.pend[key]){clearTimeout(A.s.pend[key]);delete A.s.pend[key];A.s.queued=Math.max(0,(A.s.queued||1)-1);if(A.s.waiting)delete A.s.waiting[r.race]}
  const lanes={};for(const l in read.lanes)lanes[l]={t:read.lanes[l],st:"ok",src:"photo",keep:false,chk:false};
  const meta={race:r.race,read:read.lanes,gen:r.gen,at:Date.now(),dev:DEV,test:true};
  A.slips[key]=meta;
  A.times[key]=lateSlip(r.gen===((A.times[key]||{}).gen||0)?A.times[key]:null,{lanes,src:"photo",checked:false,gen:r.gen});recompute();
  if(t==="offline"){
    A.s.queued=(A.s.queued||0)+1;A.s.waiting=Object.assign(A.s.waiting||{},{[r.race]:true});
    A.s.flash={c:"amber",t:"Saved on this phone. Sends when there is signal"};render();
    setTimeout(()=>{A.s.flash=null;render()},1300);
    A.s.pend[key]=setTimeout(async()=>{delete A.s.pend[key];await sendSlip(key,img,meta,lanes);A.s.queued=Math.max(0,(A.s.queued||1)-1);delete A.s.waiting[r.race];render()},8000);
    return;
  }
  /* "Sent" shows only once the slip has gone; a slip that waits in the queue says so */
  A.s.sending=true;render();
  const queued=await sendSlip(key,img,meta,lanes);
  A.s.sending=false;
  if(queued){A.s.flash={c:"amber",t:"Saved on this phone. Sends when there is signal"};render();setTimeout(()=>{A.s.flash=null;render()},1300);return}
  A.s.flash={c:"green",t:`Race ${r.race} read. Sent to the Recorder`};render();
  setTimeout(()=>{A.s.flash=null;render()},1100);
}
/* the slip's times never overwrite what the Recorder typed: merged with the latest copy here */
async function sendSlip(key,img,meta,lanes){
  const r1=await w(()=>A.store.set("photos/"+key,{img,at:Date.now()}));
  const r2=await w(()=>A.store.set("slips/"+key,meta));
  let cur=null;try{cur=await withTimeout(A.store.get("times/"+key),4000)}catch(e){cur=A.times[key]||null}
  const doc=lateSlip(cur,{lanes,src:"photo",checked:false,gen:meta.gen||0,by:DEV,at:Date.now()});
  const r3=await w(()=>A.store.set("times/"+key,doc));
  return [r1,r2,r3].some(x=>!x||x.queued);
}
MODALS.replaceSlip=M=>`<h2>Replace the Race ${M.race} slip?</h2><p style="margin:0">Race ${M.race} already has a slip. This photo will replace its times.</p><p style="margin:0">Check the race number on the paper slip says ${M.race}.</p><div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back</button><button type="button" class="btn go" data-act="sreplace">Replace the slip</button></div>`;
MODALS.overall=M=>{const r=A.R.races.get(M.race);const G=r&&A.R.groups.get(r.key);
  return `<h2>Race overall</h2><div class="muted">${esc(r?r.label:"")}</div>${overallTable(G)}<div class="acts"><button type="button" class="btn primary" data-act="closemodal">Close</button></div>`};

/* ---------- Multitimer (800 m and 1500 m, decisions 20 and 45) ----------
   One person enters the names, then START on the gun, SPLIT as each runner finishes, STOP. The names run down
   the side with a button next to each, pressed once in finish order. Each place gets its split; past the last
   split each place gets 1 second more than the place before. Send needs everyone placed.
   Who enters the names is question 39: if it moves to the Track Marshal, only the names step and the draft
   next heat below change. */
function mtBlank(race,sig){return {race,sig:sig||"",phase:"names",t0:0,stopAt:0,splits:[],taps:[],picked:[],q:""}}
/* a re-run race (gen) or a cleared carnival (runId) starts fresh */
function mtSig(r){return r.key+"/"+r.heat+(r.gen?"/"+r.gen:"")+(A.cfg.runId?"/"+A.cfg.runId:"")}
const MT_KEY="aths_mt";
function mtSave(){try{localStorage.setItem(MT_KEY,JSON.stringify({mt:A.mt}))}catch(e){}}
(function(){let d=null;try{d=JSON.parse(localStorage.getItem(MT_KEY)||"null")}catch(e){}
  A.mt=d&&d.mt||mtBlank(null)})();
/* a race being timed or placed is never thrown away while it still exists */
function mtFor(r){const M=A.mt;
  if(r.draft)return M;
  if((M.phase==="run"||M.phase==="place")&&A.R.races.has(M.race)&&M.race!==r.race)return M;
  if(M.race!==r.race||(M.sig&&M.sig!==mtSig(r))){
    A.mt=mtBlank(r.race,mtSig(r));
    /* a photo slip alone does not mean the multitimer has run: it opens ready, and sending asks before it replaces anything */
    if(r.filled.length){A.mt.picked=r.filled.map(l=>r.lanes[l]);A.mt.phase=r.hasSlip&&r.src==="multi"?"sent":"ready"}
    mtSave();
  }
  /* a race with lanes: the runners follow the lanes until the clock starts (the Marshal may have changed them) */
  if(!r.multi&&M.phase==="ready"&&r.filled.length){const cur=r.filled.map(l=>r.lanes[l]);if(JSON.stringify(cur)!==JSON.stringify(A.mt.picked)){A.mt.picked=cur;mtSave()}}
  return A.mt}
/* hand timing drops the thousandths, it never rounds up */
function mtNow(at){const M=A.mt;return Math.max(0,Math.floor(((M.phase==="run"?at||Date.now():M.stopAt)-M.t0)/10))}
function mtFmt(cs){const m=Math.floor(cs/6000),s=Math.floor((cs%6000)/100),h=cs%100;return m+":"+String(s).padStart(2,"0")+"."+String(h).padStart(2,"0")}
function mtSplitList(sp){return `<ol class="splits">${sp.map((t,i)=>({i:i+1,t})).slice(-5).reverse().map(x=>`<li><b>${x.i}</b><span>${mtFmt(x.t)}</span></li>`).join("")}</ol>`}
function mtList(ev,x,g,r){
  /* everyone who can run, less those already in another heat of this group */
  const H=r.draft?{race:-1,k:r.k,x,g}:A.heats.find(h=>h.race===r.race)||{};const used=heatUsed(H);
  return eligible(ev,x,g).filter(s=>!used.has(s.id));
}
function renderMulti(r,top,sw){
  const M=mtFor(r);const lk=locked();const n=M.picked.length;
  const head=`<div class="racebar ph" style="margin:0">${badge(r.race,"sm")}<div class="info"><b>${esc(r.label)}</b><span>${r.draft?`Heat ${r.heat} · `:""}${r.multi?"No lanes · ":""}${plural(n,"runner")}</span></div></div>`;
  let body="",bar="";
  if(M.phase==="names"){
    const q=(M.q||"").toLowerCase();
    const list=mtList(r.ev,r.x,r.g,r).filter(s=>!q||listName(s).toLowerCase().includes(q)||M.picked.includes(s.id));
    body=`<div class="prompt" style="margin:0">Tap each runner on the start line.</div>
      <label class="label" style="display:flex;flex-direction:column;gap:4px">Find a runner<input type="search" id="mtfilter" placeholder="Type part of a name" value="${esc(M.q||"")}" autocomplete="off"></label>
      <div class="namegrid">${list.map(s=>{const on=M.picked.includes(s.id);return `<button type="button" class="namebtn ${on?"sel":""}" aria-pressed="${on}" data-act="mtname" data-id="${esc(s.id)}">${hdot(s.h)}<span class="t">${esc(s.f+" "+s.s)}</span></button>`}).join("")||`<span class="muted">No names match.</span>`}</div>
      ${r.draft?`<div style="text-align:center"><button type="button" class="linkbtn" data-act="mtnoheat">No more heats</button></div>`:""}`;
    bar=`<button type="button" class="btn" data-act="mtadd">Add not on list</button><button type="button" class="btn navy" data-act="mtnames" ${n&&!lk?"":"disabled"}>Names done</button>`;
  }else if(M.phase==="ready"||M.phase==="run"){
    const run=M.phase==="run";
    body=`<div class="clock pin ${run?"run":""}" id="mtclock" role="timer">${mtFmt(run?mtNow():0)}</div>
      <div class="mtbtns">${run?`<button type="button" class="btn mtstop" data-act="mtstop" data-mt>STOP</button>`:`<button type="button" class="btn mtgo" data-act="mtgo" data-mt ${lk?"disabled":""}>START</button>`}<button type="button" class="btn mtsplit" ${run?`data-act="mtsplit" data-mt`:"disabled"}>SPLIT</button></div>
      <div class="panel stack" style="gap:8px"><div class="row" style="justify-content:space-between"><span class="label">Splits</span><span class="chip">${M.splits.length} of ${plural(n,"runner")}</span></div>${mtSplitList(M.splits)}</div>
      <p class="muted" style="margin:0;font-size:.88rem">No need to catch every runner. Stop any time after the top places are in.</p>
      ${run||!r.multi?"":`<button type="button" class="linkbtn" data-act="mtrename">Change the names</button>`}`;
    if(run)bar=`<button type="button" class="btn" data-act="mtunsplit" ${M.splits.length?"":"disabled"}>Undo last split</button><button type="button" class="btn navy" data-act="mtfix">Fix splits</button>`;
  }else if(M.phase==="place"){
    const sp=M.splits;const tp=M.taps;const allDone=tp.length>=n;const nm=id=>A.R.who(id)||{};
    const prompt=!sp.length?"No splits were taken. Use Fix splits to add the times.":allDone?`All ${n} placed. Check the times, then send.`:`Tap the button next to the runner who finished ${ordinal(tp.length+1)}${tp.length<sp.length?` (${mtFmt(sp[tp.length])}).`:" (no split: 1 second after the place before)."}`;
    body=`<div class="prompt mtp ${allDone&&sp.length?"done":""}" style="margin:0">${esc(prompt)}</div>`;
    if(sp.length>n)body+=`<div class="msg warn">${plural(sp.length,"split")} for ${plural(n,"runner")}. Check for a double tap with Fix splits.</div>`;
    /* the names stay still; a second press takes that runner out and the places after close up */
    body+=`<div class="pool ph track">${M.picked.map(id=>{const p=nm(id);const k=tp.indexOf(id);const pl=k+1;const nm2=esc(pname(p));
      return `<div class="lane" style="grid-template-columns:minmax(0,1fr) auto"><div class="body" style="cursor:default"><span class="nm">${hdot(p.h)}<span>${nm2}</span></span></div>
      <div class="wall mt"><button type="button" class="spot ${pl?(pl<=4?"p"+pl:"px"):""}" data-act="mttap" data-id="${esc(id)}" aria-label="${pl?`${nm2}, place ${pl}. Tap to remove`:`${nm2}, tap for place ${tp.length+1}`}" ${sp.length&&!lk?"":"disabled"}>${pl||""}</button><span class="mtt" style="display:block;min-height:18px;min-width:62px;box-sizing:border-box;text-align:center;border-radius:4px;${pl?"background:#1d3160;color:#ffffff":""}">${pl?mtFmt(mtTimeAt(sp,k)):"&nbsp;"}</span></div></div>`}).join("")}</div>`;
    body+=`<div style="text-align:center"><button type="button" class="linkbtn" data-act="mtfix">Fix splits</button></div>`;
    bar=`<button type="button" class="btn" data-act="mtundo" ${tp.length&&!lk?"":"disabled"}>Undo last</button><button type="button" class="btn navy" data-act="mtsend" ${allDone&&sp.length&&!lk?"":"disabled"}>Send to Recorder</button>`;
  }else{
    body=`<div class="msg ok">Race ${r.race} times sent to the Recorder.</div>
      ${nextRaceAfter(r.race)!=null||r.multi?`<button type="button" class="btn navy big" data-act="mtnext">${nextRaceAfter(r.race)!=null?"Next race":"Next heat, "+esc(r.label)}</button>`:`<button type="button" class="btn big" disabled>Waiting for marshal</button>`}
      ${r.multi?`<button type="button" class="btn big" data-act="mtnew">New age or event</button>`:""}
      <div class="row" style="flex-wrap:nowrap"><button type="button" class="btn" style="flex:1" data-act="sgoto">Check race</button><button type="button" class="btn" style="flex:1" data-act="soverall">Race overall</button></div>`;
  }
  return `${lockBar()}<div class="phone" style="gap:10px">${top}${sw||""}${head}${body}</div>
  ${bar?`<div class="pbar"><div class="wrap">${bar}</div></div>`:""}
  ${A.s.flash?`<div class="flash ${A.s.flash.c}" role="status">${esc(A.s.flash.t)}</div>`:""}`;
}
/* keep the phone awake while the clock runs */
let mtLock=null;let mtVid=null;
function mtVideo(on){
  try{
    if(on){if(!mtVid){mtVid=document.createElement("video");mtVid.muted=true;mtVid.loop=true;mtVid.setAttribute("playsinline","");mtVid.setAttribute("muted","");mtVid.setAttribute("aria-hidden","true");mtVid.style.cssText="position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:0;top:0";mtVid.src=SILENT_MP4;document.body.appendChild(mtVid)}
      const p=mtVid.play();if(p&&p.catch)p.catch(()=>{})}
    else if(mtVid)mtVid.pause();
  }catch(e){}
}
async function mtWake(on){mtVideo(on);try{if(on&&navigator.wakeLock&&!mtLock){mtLock=await navigator.wakeLock.request("screen");mtLock.addEventListener("release",()=>{mtLock=null})}else if(!on&&mtLock){await mtLock.release();mtLock=null}}catch(e){mtLock=null}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&A.mt&&A.mt.phase==="run")mtWake(true)});
if(A.mt.phase==="run")mtWake(true);
/* Names done: the runners go on the race, so every device sees them. Their list order is kept */
async function mtNamesDone(){
  const M=A.mt;if(M.draft)return mtDraftDone();
  const r=slipRace();if(!r||!M.picked.length)return;
  const lanes={};for(const l of Object.keys(r.lanes))lanes[l]=null;
  M.picked.forEach((id,i)=>{lanes[i+1]=id});
  const H=A.heats.find(h=>h.race===r.race);
  if(H)H.lanes=Object.fromEntries(Object.entries(Object.assign({},H.lanes,lanes)).filter(e=>e[1]));
  recompute();M.phase="ready";M.q="";mtSave();render();window.scrollTo(0,0);
  await w(()=>A.store.update("heats/"+rid(r.race),{lanes}));
}
/* Next race: on to the next race if one is waiting. If not, the phone gets ready for the next heat of this event
   (decision 45). Nothing is saved until Names done, so a heat that never happens leaves no empty race */
function mtNext(){
  const r=slipRace();if(!r)return;
  const n=nextRaceAfter(A.s.race);A.s.err=null;
  if(n!=null){A.s.race=n}else if(r.multi){A.mt=mtBlank(null);A.mt.draft={k:r.k,x:r.x,g:r.g,run:A.cfg.runId||"",after:r.race};mtSave()}
  render();window.scrollTo(0,0);
}
/* New age or event (decision 49): pick the race, boys or girls and age on the phone, then Take names.
   The race number is taken only when Names done is pressed, the same safe way as Next heat. */
function mtNew(){
  const r=slipRace();if(!r)return;
  A.mt=mtBlank(null);A.mt.draft={pick:true,k:r.k,x:r.x,g:r.g,run:A.cfg.runId||"",after:Math.max(r.race,...liveRaces().map(x=>x.race))};mtSave();
  render();window.scrollTo(0,0);
}
function mtPick(f,v){
  const d=A.mt.draft;if(!d||!d.pick)return;
  d[f]=v;
  if(f==="k"){const ev=eventOf(A.cfg,v);if(ev&&!groupsOf(ev).includes(d.g))d.g=groupsOf(ev)[0]}
  mtSave();render();
}
function mtTake(){
  const d=A.mt.draft;if(!d||!d.pick||!eventOf(A.cfg,d.k)||!d.x||!d.g)return;
  A.mt.draft={k:d.k,x:d.x,g:d.g,run:d.run,after:d.after};mtSave();render();window.scrollTo(0,0);
}
function renderMultiPick(){
  const d=A.mt.draft;const evs=trackEvents(A.cfg).filter(e=>e.run==="multi");const ev=eventOf(A.cfg,d.k);
  const row=(t,inner)=>`<div class="mrow" style="padding:0"><span class="label">${t}</span><div class="choices">${inner}</div></div>`;
  const ch=(f,v,l,on)=>`<button type="button" class="choice" data-act="mtpick" data-f="${f}" data-v="${esc(v)}" aria-pressed="${on}">${esc(l)}</button>`;
  const head=`<div class="racebar ph" style="margin:0">${badge(A.counter,"sm")}<div class="info"><b>${esc(ev&&d.x&&d.g?groupLabel(ev,d.x,d.g):"New race")}</b><span>No lanes · 0 runners</span></div></div>`;
  return `${lockBar()}<div class="phone" style="gap:10px">${head}
    ${row("Race",evs.map(e=>ch("k",e.k,e.name,d.k===e.k)).join(""))}
    ${row("Boys or girls",[["F","Girls"],["M","Boys"]].map(([v,l])=>ch("x",v,l,d.x===v)).join(""))}
    ${row("Age",groupChoices(ev).map(c=>ch("g",c.g,c.l,d.g===c.g)).join(""))}
    <button type="button" class="btn navy big" data-act="mttake" ${locked()?"disabled":""}>Take names</button>
    <button type="button" class="linkbtn" style="text-align:center" data-act="mtmarshal">Another race: go to the Track Marshal</button><button type="button" class="linkbtn" style="text-align:center" data-act="mtnoheatok">Back</button></div>`;
}
/* the next heat as a race, for the screen. A race the marshal sends meanwhile takes over, unless names are in */
function mtDraftRace(){
  const d=A.mt&&A.mt.draft;if(!d||d.pick)return null;
  const live=nextRaceAfter(d.after)!=null;
  const ev=eventOf(A.cfg,d.k);
  if(!ev||(d.run!==(A.cfg.runId||""))||(live&&!A.mt.picked.length)){A.mt=mtBlank(null);mtSave();return null}
  const key=groupKey(d.k,d.x,d.g);
  return {draft:true,race:A.counter,heat:heatsSentFor(key)+1,k:d.k,x:d.x,g:d.g,key,ev,multi:true,label:groupLabel(ev,d.x,d.g),lanes:{},filled:[],hasSlip:false};
}
function mtDraftDrop(){A.mt=mtBlank(null);mtSave();render()}
MODALS.mtNoHeat=M=>`<h2>No more heats?</h2><p style="margin:0">The ${plural(M.n,"name")} picked for this heat will be cleared.</p><div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back</button><button type="button" class="btn redfill" data-act="mtnoheatok">Clear the names</button></div>`;
async function mtDraftDone(){
  const M=A.mt;const r=mtDraftRace();if(!r||!M.picked.length||locked()||M.sending)return;
  M.sending=true;
  try{
    const n=await A.store.nextRace();
    const lanes={};M.picked.forEach((id,i)=>{lanes[i+1]=id});
    const doc={race:n,k:r.k,x:r.x,g:r.g,heat:r.heat,multi:true,lanes,at:Date.now(),dev:DEV};
    if(await w(()=>A.store.set("heats/"+rid(n),doc))){
      A.heats=A.heats.filter(h=>h.race!==n).concat([Object.assign({_id:rid(n)},doc)]);recompute();
      A.s.race=n;const keep=M.picked;A.mt=mtBlank(n,mtSig(A.R.races.get(n)));A.mt.picked=keep;A.mt.phase="ready";mtSave();
    }
  }catch(e){toast("Not saved. A race number needs a connection. Try again.")}
  M.sending=false;render();window.scrollTo(0,0);
}
function mtGo(at){const M=A.mt;if(M.phase!=="ready"||locked())return;M.t0=at||Date.now();M.stopTap=0;M.phase="run";M.splits=[];M.taps=[];mtSave();mtWake(true);render()}
function mtSplit(at){const M=A.mt;if(M.phase!=="run")return;M.splits.push(mtNow(at));mtSave();render()}
function mtStop(force,at){
  const M=A.mt;if(M.phase!=="run")return;
  if(!force){M.stopTap=at||Date.now();if(M.splits.length<M.picked.length){A.modal={t:"mtStop",n:M.splits.length,of:M.picked.length};render();return}}
  M.stopAt=M.stopTap||Date.now();M.phase="place";M.taps=[];A.modal=null;mtSave();mtWake(false);render();
}
function mtTap(id){
  const M=A.mt;if(M.phase!=="place")return;
  const i=M.taps.indexOf(id);
  if(i>=0)M.taps.splice(i,1);else if(M.taps.length<M.picked.length)M.taps.push(id);
  mtSave();render();
}
async function mtSend(force){
  const r=slipRace();const M=A.mt;if(!r||M.phase!=="place"||locked())return;
  /* everyone is placed before it goes (decision 45) */
  if(!M.splits.length||M.taps.length<M.picked.length)return;
  const key=rid(r.race);
  if(!force&&(r.hasSlip||r.nTimes>0)){A.modal={t:"mtReplace",race:r.race};render();return}
  A.modal=null;
  const laneOf=id=>Object.keys(r.lanes).find(l=>r.lanes[l]===id);
  if(M.taps.some(id=>!laneOf(id))){toast("A runner is no longer in a lane. Check the race first.");return}
  const lanes={},read={};
  M.taps.forEach((id,i)=>{const l=laneOf(id);if(!l)return;const t=mtTimeAt(M.splits,i);lanes[l]={t,st:"ok",src:"multi",keep:false,chk:false,o:i+1,auto:i>=M.splits.length};read[l]=t});
  const meta={race:r.race,multi:true,splits:M.splits.slice(),read,gen:r.gen,at:Date.now(),dev:DEV,test:false};
  A.slips[key]=meta;A.times[key]={lanes,src:"multi",checked:false,gen:r.gen};
  /* a race with lanes (a normal race timed on the multitimer) also needs its places, as the Place Judge would give them */
  /* a Place Judge's places are never overwritten */
  let fdoc=null;if(!r.multi&&!(r.F&&r.F.order&&r.F.order.length)){const order=M.taps.map(id=>[laneOf(id)]).filter(g=>g[0]);fdoc={order,seq:order.flat(),undo:[],gen:r.gen||0,ck:0,ok:true,at:Date.now(),dev:DEV};A.finish[key]=fdoc}
  recompute();
  M.phase="sent";mtSave();
  A.s.flash={c:"green",t:`Race ${r.race} sent to the Recorder`};render();
  setTimeout(()=>{A.s.flash=null;render()},1100);
  await w(()=>A.store.set("slips/"+key,meta));
  await w(()=>A.store.set("times/"+key,{lanes,src:"multi",checked:false,gen:r.gen,by:DEV,at:Date.now()}));
  if(fdoc)await w(()=>A.store.set("finish/"+key,fdoc));
}
/* Fix splits: delete a double tap, add a missed time, or clear and time again */
function mtFixSplits(sp){const M=A.mt;M.splits=sp.slice().sort((a,b)=>a-b);M.taps=[];mtSave();render()}
MODALS.mtStop=M=>`<h2>Stop the clock?</h2><p style="margin:0">Only ${plural(M.n,"split")} for ${plural(M.of,"runner")}. Stop anyway?</p><div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Keep timing</button><button type="button" class="btn redfill" data-act="mtstopok">Stop the clock</button></div>`;
MODALS.mtReplace=M=>`<h2>Replace the Race ${M.race} results?</h2><p style="margin:0">Race ${M.race} already has times. These multitimer times will replace them.</p><div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back</button><button type="button" class="btn go" data-act="mtsendok">Replace the results</button></div>`;
MODALS.mtFix=M=>{const sp=A.mt.splits;
  return `<h2>Fix splits</h2><p class="muted" style="margin:0">Delete a double tap, or add a time that was missed. Changing the splits clears the places tapped so far.</p>
  ${sp.length?`<ol class="splits">${sp.map((t,i)=>`<li><b>${i+1}</b><span style="flex:1">${fmtTime(t)}</span><button type="button" class="btn small danger" data-act="mtdel" data-i="${i}">Delete</button></li>`).join("")}</ol>`:`<p class="muted" style="margin:0">No splits yet.</p>`}
  <label class="label" for="mtaddt">Add a missed time</label>
  <div class="row" style="flex-wrap:nowrap"><input class="timein" id="mtaddt" inputmode="numeric" autocomplete="off" placeholder="Type time" value="${esc(M.raw||"")}" style="flex:1;min-height:48px"><button type="button" class="btn" data-act="mtaddok">Add</button></div>
  ${M.err?`<span style="color:var(--bad);font-weight:700">${esc(M.err)}</span>`:`<span class="muted" style="font-size:.88rem">Type digits only: 22734 is 2:27.34.</span>`}
  <div class="acts"><button type="button" class="btn danger" data-act="mtclear">Clear the clock and time again</button><button type="button" class="btn primary" data-act="closemodal">Done</button></div>`};
setInterval(()=>{if(A.mt&&A.mt.phase==="run"){const c=document.getElementById("mtclock");if(c)c.textContent=mtFmt(mtNow())}},47);
