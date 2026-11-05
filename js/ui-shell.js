/* ===== Aths Opt 1.1: app shell, PIN, header, shared helpers ===== */
const JOBS=[
  {k:"marshal",n:1,name:"Track Marshal",badge:"TRACK MARSHAL",desc:"Put runners in lanes and send each heat"},
  {k:"judge",n:2,name:"Place Judge",badge:"PLACE JUDGE",desc:"Tap the top places in each heat"},
  {k:"recorder",n:3,name:"Recorder",badge:"RECORDER",desc:"Check times and marks"},
  {k:"slips",n:4,name:"Time Slips",badge:"TIME SLIPS",desc:"Photograph each printed time slip"},
  {k:"field",n:5,name:"Field Station",badge:"FIELD STATION",desc:"Enter attempts and marks at your station"},
  {k:"announcer",n:6,name:"Announcer",badge:"ANNOUNCER",desc:"Read results, records and house points"}
];
const ORG_JOB={k:"organiser",n:7,name:"Carnival Organiser",badge:"CARNIVAL ORGANISER",desc:"Organiser only"};
const A={
  store:null,cfg:Object.assign({},DEFAULT_CONFIG),roster:{F:[],M:[]},extras:[],heats:[],times:{},finish:{},slips:{},field:{},records:[],counter:1,
  peers:[],R:null,loaded:false,
  role:ssGet("aths_role",null),job:ssGet("aths_job",null),pin:"",pinErr:false,
  m:{phase:"start",k:null,x:null,g:null,lanes:{},heat:1,cur:1,open:null,filter:"",sent:[],msg:""},
  j:{race:null},r:{race:null,since:Date.now(),errs:{},tab:"track",fkey:null,ovr:false},s:{race:null,test:null,flash:null,err:null},
  f:Object.assign({station:null,gid:null,i:0,typed:"",undo:[],filter:""},jsonGet("aths_field")),
  a:{idx:null,key:null},res:{tab:"res",view:"all"},o:{sec:"details",preview:null,text:"",load:false},
  menu:false,modal:null,renderPending:false,
  past:null,years:[],L:{},yearPicked:ssGet("aths_year",null)
};
function ssGet(k,d){try{const v=sessionStorage.getItem(k);return v==null?d:v}catch(e){return d}}
function ssSet(k,v){try{if(v==null)sessionStorage.removeItem(k);else sessionStorage.setItem(k,v)}catch(e){}}
function jsonGet(k){try{return JSON.parse(sessionStorage.getItem(k)||"{}")||{}}catch(e){return {}}}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function rid(n){return "r"+String(n).padStart(4,"0")}
function pinHash(p){let h=2166136261;const s="ccas-aths:"+p;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)}
/* One PIN per job. The organiser PIN opens every job. Test PINs only; real ones are set on the server at Aths Opt 1.2 */
const PIN_ROLES=[["marshal","Track Marshal","1111"],["judge","Place Judge","2222"],["recorder","Recorder","3333"],["slips","Time Slips","4444"],["announcer","Announcer","5555"],["field","Field Station","6666"],["org","Carnival Organiser","9999"]];
const DEFAULT_PINS=Object.fromEntries(PIN_ROLES.map(([k,,p])=>[k,pinHash(p)]));
function pins(){const c=A.cfg.pins||{};return Object.fromEntries(PIN_ROLES.map(([k])=>[k,c[k]||DEFAULT_PINS[k]]))}
function canOpen(k){if(A.role==="org")return true;if(!A.role)return false;if(k===A.role)return true;return A.role==="announcer"&&(k==="results"||k==="houses")}
function homeJob(){return A.role==="announcer"?"announcer":A.role}
if(!PIN_ROLES.some(x=>x[0]===A.role)){A.role=null;A.job=null}
function hdot(h){return `<span class="hdot h${esc(h||"")}">${esc(h||"?")}</span>`}
function htag(h){return `<span class="htag">${hdot(h)}${esc(houseName(h))}</span>`}
function badge(n,cls){return `<span class="racebadge ${cls||""}"><small>RACE</small><b>${n==null?"-":n}</b></span>`}
function medal(p,tie){return `<span class="medal m${Math.min(p,4)}">${tie?"=":""}${p}</span>`}
function placeCell(p,tie){return !p?"&ndash;":p<=3?medal(p,tie):(tie?"=":"")+p}
function pname(p){return p?(p.team?p.name:(p.f+" "+p.s)):"Empty"}
function listName(st){return st.team?st.name:st.s+", "+st.f}
function locked(){if(A.past)return true;return !!A.cfg.locked&&A.job!=="organiser"}
function localStamp(d){d=d||new Date();const p=n=>String(n).padStart(2,"0");return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+" "+p(d.getHours())+":"+p(d.getMinutes())}
function curYear(){return (A.L.cfg&&A.L.cfg.date||A.cfg.date||"2027").slice(0,4)}
function qchip(n){return `<span class="qchip">QUESTION ${n}</span>`}
let toastT=null;
function toast(m){const t=document.getElementById("toast");t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,3000)}
function students(){return [...A.roster.F,...A.roster.M,...A.extras]}
function otherPeers(){return A.peers.filter(p=>p&&p.dev&&p.dev!==DEV)}
function openGroups(){const s=new Set();if(A.past)return s;for(const p of otherPeers())if(p.mk)s.add(p.mk);if(A.job==="marshal"&&A.m.phase==="lanes")s.add(groupKey(A.m.k,A.m.x,A.m.g));return s}
function raceList(){return A.R?[...A.R.races.values()].sort((a,b)=>a.race-b.race):[]}
function liveRaces(){return raceList().filter(r=>!r.cancelled)}
function nextRaceAfter(n,list){const r=(list||liveRaces()).find(r=>r.race>n);return r?r.race:null}
function latestRace(list){const l=list||liveRaces();return l.length?l[l.length-1].race:null}
/* a race the job is on that was cancelled moves on to the next race still on */
function liveRaceNo(n,list){const r=n!=null&&A.R.races.get(n);if(!r||!r.cancelled)return n;const nx=nextRaceAfter(n,list);return nx!=null?nx:latestRace(list)}
function plural(n,w,ws){return n+" "+(n===1?w:(ws||w+"s"))}
function raceRange(nos){if(!nos.length)return "";if(nos.length===1)return "Race "+nos[0];if(nos.length===2)return "Races "+nos[0]+" and "+nos[1];return "Races "+nos[0]+" to "+nos[nos.length-1]}
function ordinal(n){const t=n%100;return n+(t>10&&t<14?"th":["th","st","nd","rd"][n%10]||"th")}
function fmtPts(n){return (Math.round(n*100)/100).toLocaleString("en-AU")}
function longDate(iso){const d=new Date(String(iso)+"T00:00:00");return isNaN(d)?String(iso||""):d.toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).replace(",","")}

/* ---------- data ---------- */
function recompute(){
  const S={config:A.cfg,students:students(),heats:A.heats,times:A.times,finish:A.finish,slips:A.slips,field:A.field,records:A.records,openGroups:openGroups()};
  A.R=compute(S);
}
function schedule(){
  if(A.renderPending)return;A.renderPending=true;
  requestAnimationFrame(()=>{A.renderPending=false;recompute();
    const ae=document.activeElement;
    if(ae&&ae.closest&&ae.closest("main")&&/INPUT|TEXTAREA|SELECT/.test(ae.tagName)&&ae.type!=="file"){A.dirty=true;renderHeader();return}
    render()});
}
document.addEventListener("focusout",()=>{if(A.dirty){A.dirty=false;setTimeout(()=>{const ae=document.activeElement;if(!(ae&&/INPUT|TEXTAREA|SELECT/.test(ae.tagName)))render();else A.dirty=true},50)}});
async function connect(){
  /* Supabase when js/config.js has the project address and key (and the address has no ?mode=local); if not, one-device test mode */
  const onQueue=()=>{if(A.job==="slips")schedule();else renderHeader()};
  let st=null;
  const useSb=!!(window.ATHS_CONFIG&&ATHS_CONFIG.url)&&new URLSearchParams(location.search).get("mode")!=="local";
  /* with a project set up, never fall back to one-device test mode quietly: keep trying and say so */
  for(;;){
    try{if(typeof supabaseStore==="function")st=await supabaseStore(onQueue)}catch(e){st=null}
    if(st||!useSb)break;
    const m=document.getElementById("main");if(m)m.innerHTML='<div class="msg warn" style="margin:16px">Connecting. No signal yet? This page keeps trying.</div>';
    await sleep(4000);
  }
  if(!st)st=localStore(onQueue);
  window.addEventListener("aths-role-lost",()=>{A.role=null;A.job=null;A.yearPicked=null;ssSet("aths_role",null);ssSet("aths_job",null);ssSet("aths_year",null);toast("The server has no job for this device. Enter your PIN again.");render()});
  window.addEventListener("aths-dropped",()=>toast("A change was refused by the server and not saved. Check the job and whether results are locked."));
  A.store=st;
  /* Supabase: the server decides the job; forget a job it does not know about */
  if(st.claimRole&&st.role!==A.role){A.role=null;A.job=null;A.yearPicked=null;ssSet("aths_role",null);ssSet("aths_job",null);ssSet("aths_year",null);render()}
  const s=A.store;
  /* live data goes to A.L; it shows on screen unless a past year is open */
  const live=(k,v)=>{A.L[k]=v;if(!A.past)A[k]=v;schedule()};
  A.L.roster={F:[],M:[]};
  s.onDoc("config/main",d=>{A.loaded=true;live("cfg",Object.assign({},DEFAULT_CONFIG,d||{}))});
  for(const x of ["F","M"])s.onDoc("roster/"+x,d=>{const r=Object.assign({},A.L.roster);r[x]=(d&&d.students)||[];live("roster",r)});
  s.onCol("extras",l=>live("extras",l));
  s.onCol("heats",l=>live("heats",l.filter(h=>h&&h.race)));
  s.onCol("times",l=>live("times",Object.fromEntries(l.map(d=>[d._id,d]))));
  s.onCol("finish",l=>live("finish",Object.fromEntries(l.map(d=>[d._id,d]))));
  s.onCol("slips",l=>live("slips",Object.fromEntries(l.map(d=>[d._id,d]))));
  s.onCol("field",l=>live("field",Object.fromEntries(l.map(d=>[d._id,d]))));
  s.onDoc("records/all",d=>live("records",(d&&d.list)||[]));
  s.onDoc("counter/race",d=>live("counter",(d&&Number(d.next))||1));
  s.onCol("years",l=>{A.years=l.filter(y=>y&&y.year).sort((a,b)=>String(b.year).localeCompare(String(a.year)));schedule()});
  if(A.yearPicked&&A.yearPicked!=="current"&&A.role==="org")setTimeout(()=>enterYear(A.yearPicked),300);
  s.onPeers(list=>{A.peers=list;schedule()});
  announce();schedule();
}
function announce(){
  if(!A.store)return;
  const p={job:A.job||null,mk:null,rec:null,recSince:null};
  if(A.job==="marshal"&&A.m.phase==="lanes")p.mk=groupKey(A.m.k,A.m.x,A.m.g);
  if(A.job==="recorder"&&A.r.race!=null){p.rec=A.r.race;p.recSince=A.r.since}
  A.store.presence(p);
}
async function w(fn){
  if(locked()){toast("Results are locked. Nothing can be changed.");return null}
  try{const r=await fn();if(r&&r.queued)toast("Saved on this device. Sends when there is signal.");return r||{ok:true}}
  catch(e){toast("Not saved. Check the connection and try again.");return null}
}

/* ---------- header ---------- */
function curJob(){return A.job==="organiser"?ORG_JOB:JOBS.find(j=>j.k===A.job)||(A.job==="results"?{k:"results",badge:"RESULTS",name:"Announcer"}:A.job==="houses"?{k:"houses",badge:"HOUSES",name:"Announcer"}:null)}
function pillName(){if(A.job==="results"||A.job==="houses")return "Announcer";const j=curJob();return j?j.name:""}
/* phones get a slim banner and a bar fixed to the bottom for the main buttons */
function phoneNow(){return innerWidth<700}
function slimHdr(){return !A.past&&phoneNow()&&(A.job==="judge"||A.job==="announcer"||A.job==="slips"||(A.job==="field"&&!!A.f.gid))}
function headerSub(){
  if(A.job==="organiser")return esc(A.cfg.name)+" · Organiser PIN only";
  if(A.job==="field"&&A.f.gid){const f=A.R&&fieldGroupOpen();if(f){const s=stationsOf(A.cfg).find(s=>s.id===f.station);if(s)return esc(s.name)}}
  return esc(A.cfg.name||"CCAS");
}
function renderHeader(){
  const h=document.getElementById("hdr");
  const j=curJob();
  const s=A.store;let live="Connecting",cls="";
  if(s){
    const n=s.pending();
    if(n){live=plural(n,"change")+" waiting to send";cls="off"}
    else if(s.mode==="local"){live="This device only (test)";cls="off"}
    else live="Online, all sent";
  }
  const wide=!phoneNow();
  const links=A.job==="announcer"&&wide?`<button type="button" class="hlink" data-act="goto" data-job="houses">Houses</button><button type="button" class="hlink" data-act="goto" data-job="results">Full results</button>`
    :A.job==="results"?`<button type="button" class="hlink" data-act="goto" data-job="houses">Houses</button><button type="button" class="hlink" data-act="goto" data-job="announcer">Back to Announcer</button>`
    :A.job==="houses"?`<button type="button" class="hlink" data-act="goto" data-job="results">Results</button><button type="button" class="hlink" data-act="goto" data-job="announcer">Back to Announcer</button>`:"";
  const jobs=A.role==="org"?[...JOBS,ORG_JOB]:[];
  const slim=slimHdr();h.classList.toggle("slim",slim);h.classList.toggle("unstick",A.job==="results"||A.job==="houses");
  if(slim){h.innerHTML=`<div class="wrap"><div class="topin"><span class="live ${cls}"><i></i>${esc(s&&s.mode==="local"&&!s.pending()?"Test mode":live)}</span>${jobPill(jobs)}</div></div>`;return}
  h.innerHTML=`<div class="wrap"><div class="topin">
    ${j?`<span class="jobbadge">${esc(j.badge)}</span>`:""}
    <div class="ttl"><b>Athletics Carnival ${A.past?esc(A.past):esc(curYear())}</b><small>${headerSub()}</small></div>
    ${A.role==="org"&&A.job==="organiser"?`<button type="button" class="hlink" data-act="changeyear">${A.past?"Look only · ":""}Change year</button>`:A.past?`<button type="button" class="hlink" data-act="changeyear">Look only · Change year</button>`:""}
    ${links}
    <span class="live ${cls}"><i></i>${esc(live)}</span>
    ${j?jobPill(jobs):""}
  </div></div>`;
}
function jobPill(jobs){
  return `<div class="jobpill"><button type="button" data-act="menu" aria-expanded="${A.menu}">Job: ${esc(pillName())}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
      ${A.menu?`<div class="jobmenu" role="menu">${jobs.length?`<div class="label">Change job</div>`:`<div class="label">Your PIN opens ${esc(pillName())} only</div>`}${jobs.map(x=>`<button type="button" role="menuitem" data-act="goto" data-job="${x.k}"><span class="n">${x.n}</span>${esc(x.name)}${pillName()===x.name?`<span class="tick">Here</span>`:""}</button>`).join("")}<hr><button type="button" role="menuitem" data-act="signout">Sign out (back to PIN)</button></div>`:""}
    </div>`;
}

/* ---------- home ---------- */
function renderHome(){
  if(A.role==="org"&&!A.yearPicked)return renderYearPick();
  if(!A.role){
    const keys=["1","2","3","4","5","6","7","8","9","Clear","0","Back"];
    return `<div class="home"><h1>Athletics Carnival</h1><p class="muted" style="margin:0">Enter your PIN.</p>
      <div class="dots" aria-label="PIN digits typed">${[0,1,2,3].map(i=>`<i class="${A.pin.length>i?"on":""}"></i>`).join("")}</div>
      <div class="keypad">${keys.map(l=>`<button type="button" data-act="key" data-k="${l}" aria-label="${/^[0-9]$/.test(l)?"Digit "+l:l}">${l}</button>`).join("")}</div>
      ${A.pinErr?`<div class="msg bad" role="alert">That PIN is not right. Try again.</div>`:""}
      <button type="button" class="btn primary big" style="width:276px" data-act="pinstart">Start</button>
    </div>`;
  }
  const tiles=JOBS.map(j=>`<button type="button" class="tile" data-act="goto" data-job="${j.k}"><span class="n">${j.n}</span><b>${j.name}</b><span>${esc(j.desc)}</span></button>`).join("");
  return `<div class="home"><h1>Athletics Carnival</h1><p class="muted" style="margin:0">Choose your job.</p>
    <div class="tiles">${tiles}${A.role==="org"?`<button type="button" class="tile orgtile" style="grid-column:1/-1;min-height:96px" data-act="goto" data-job="organiser"><span class="n">7</span><b>Carnival Organiser</b><span>Organiser only</span></button>`:""}</div>
    <button type="button" class="linkbtn" data-act="signout">Sign out (back to PIN)</button></div>`;
}
function renderYearPick(){
  const cur=curYear();
  return `<div class="home"><h1>Which carnival?</h1><p class="muted" style="margin:0">Pick the year. Past years are look only.</p>
    <div class="stack" style="width:100%;max-width:520px">
      <button type="button" class="tile" style="min-height:0" data-act="year" data-v="current"><span class="row" style="justify-content:space-between;width:100%"><b>${esc(cur)}</b><span class="chip final">Current carnival</span></span><span>${esc(A.L.cfg?A.L.cfg.name:A.cfg.name)} · live</span></button>
      ${A.years.filter(y=>String(y.year)!==cur).map(y=>`<button type="button" class="tile" style="min-height:0" data-act="year" data-v="${esc(y.year)}"><span class="row" style="justify-content:space-between;width:100%"><b>${esc(y.year)}</b><span class="chip">Look only</span></span><span>${esc(y.name||"")} · ${y.heats||0} races, ${y.students||0} students</span></button>`).join("")}
    </div>
    <button type="button" class="linkbtn" data-act="signout">Sign out (back to PIN)</button></div>`;
}
async function enterYear(y){
  A.r.race=null;A.j.race=null;A.s.race=null;A.a.idx=null;A.a.key=null;A.modal=null;
  /* Supabase: the server must switch year first; if it cannot, nothing changes on screen */
  const toCurrent=()=>{if(A.store&&A.store.setYear)A.store.setYear("current").catch(()=>{})};
  if(A.store&&A.store.setYear){try{await A.store.setYear(y&&y!=="current"?String(y):"current")}catch(e){toast("No connection. Try again.");return}}
  if(y==="current"||!y){
    A.past=null;for(const k of ["cfg","roster","extras","heats","times","finish","slips","field","records","counter"])if(A.L[k]!==undefined)A[k]=A.L[k];
  }else{
    try{
      const [c,r,d]=await Promise.all(["config","roster","data"].map(n=>A.store.get("archive/"+y+"-"+n)));
      if(!c||!d){toast("The "+y+" carnival could not be loaded.");toCurrent();return}
      A.past=String(y);
      A.cfg=Object.assign({},DEFAULT_CONFIG,c.cfg||{});A.records=c.records||[];
      A.roster={F:(r&&r.F)||[],M:(r&&r.M)||[]};A.extras=(r&&r.extras)||[];
      A.heats=d.heats||[];A.times=d.times||{};A.finish=d.finish||{};A.slips=d.slips||{};A.field=d.field||{};A.counter=d.counter||1;
    }catch(e){toast("The "+y+" carnival could not be loaded. Check the connection.");toCurrent();return}
  }
  A.yearPicked=y||"current";ssSet("aths_year",A.yearPicked);
  recompute();render();
}
function pressKey(k){
  if(k==="Clear"){A.pin="";A.pinErr=false}
  else if(k==="Back"){A.pin=A.pin.slice(0,-1)}
  else if(A.pin.length<4){A.pin+=k;A.pinErr=false}
  render();
}
function pinStart(){
  if(A.pin.length<4)return;
  /* Supabase: the server checks the PIN and gives this device its job */
  if(A.store&&A.store.claimRole){
    const h=pinHash(A.pin);A.pin="";render();
    A.store.claimRole(h).then(r=>{
      if(!r){A.pinErr=true;render();return}
      A.pinErr=false;A.role=r;ssSet("aths_role",r);
      if(r!=="org"){goJob(homeJob());return}
      if(!A.years.length){A.yearPicked="current";ssSet("aths_year","current")}
      render();
    },()=>{toast("No connection. Try again.");render()});
    return;
  }
  const h=pinHash(A.pin),P=pins();A.pin="";
  const hit=PIN_ROLES.find(([k])=>P[k]===h);
  if(!hit){A.pinErr=true;render();return}
  A.pinErr=false;A.role=hit[0];ssSet("aths_role",hit[0]);
  if(hit[0]!=="org"){goJob(homeJob());return}
  /* past years only come into it once there are some */
  if(!A.years.length){A.yearPicked="current";ssSet("aths_year","current")}
  render();
}
function goJob(k){
  if(!canOpen(k==="organiser"?"org":k))return;
  if(A.job==="marshal"&&A.m.phase==="lanes"&&Object.keys(A.m.lanes).length&&k!=="marshal"){
    A.modal={t:"leaveMarshal",to:k};A.menu=false;render();return;
  }
  if(A.job==="marshal"&&k!=="marshal")A.m.phase="start";
  A.job=k;ssSet("aths_job",k);A.menu=false;A.modal=null;
  if(k==="recorder")A.r.since=Date.now();
  announce();render();window.scrollTo(0,0);
}
function signOut(){const waiting=A.store&&A.store.pending?A.store.pending():0;if(waiting)toast(plural(waiting,"change")+" still waiting to send. Sign in again as the same job to send "+(waiting===1?"it":"them")+".");if(A.past)enterYear("current");clearReadLists();if(A.store&&A.store.releaseRole)A.store.releaseRole().catch(()=>{});A.yearPicked=null;ssSet("aths_year",null);A.role=null;A.job=null;ssSet("aths_role",null);ssSet("aths_job",null);A.menu=false;A.m.phase="start";A.f.gid=null;A.f.station=null;A.f.a=null;fSave();A.r.ovr=false;announce();render()}

/* ---------- modal ---------- */
function modalHtml(){
  const M=A.modal;if(!M)return "";
  const f=MODALS[M.t];if(!f)return "";
  return `<div class="modalbg" data-act="modalbg"><div class="modal" role="dialog" aria-modal="true">${f(M)}</div></div>`;
}
const MODALS={};
MODALS.leaveMarshal=M=>`<h2>Leave without sending?</h2><p style="margin:0">This heat has runners in lanes but has not been sent to the starter. If you leave now, the lanes are cleared.</p><div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back to lanes</button><button type="button" class="btn danger" data-act="leaveok">Leave and clear</button></div>`;
MODALS.info=M=>`<h2>${esc(M.title)}</h2>${M.body}<div class="acts"><button type="button" class="btn primary" data-act="closemodal">${esc(M.ok||"OK")}</button></div>`;
