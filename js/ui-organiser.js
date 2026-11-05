/* ===== Carnival Organiser: 9 sections (A1.16) ===== */
const SECS=[["details","Carnival details"],["students","Students"],["program","Program"],["field","Field event rules"],["points","Points"],["limits","Odd-time limits"],["records","Records"],["export","Export"],["lock","Lock and new carnival"]];
function secStatus(k){
  const c=A.cfg;
  if(k==="details")return {t:longDate(c.date)};
  if(k==="students"){const n=students().length;return n?{t:n+(A.roster.F.concat(A.roster.M).some(s=>s.test)?" test students":" students")}:{t:"No list loaded yet",a:1}}
  if(k==="program")return {t:A.R.events.length+" events"};
  if(k==="field")return {t:"From the 2027 sheets"};
  if(k==="points"){const P=Object.assign({},DEFAULT_CONFIG.points,c.points||{});return {t:[P.p1,P.p2,P.p3,P.rest].join(", ")}}
  if(k==="limits")return {t:"By distance"};
  if(k==="records")return A.records.length?{t:plural(A.records.length,"record")}:{t:"No list yet"};
  if(k==="export")return {t:"CSV, HRIS file, backup"};
  if(k==="lock")return c.locked?{t:"Results locked",a:1}:{t:"Results open"};
}
function renderOrganiser(){
  const sec=A.o.sec;
  const nav=SECS.map(([k,l],i)=>{const s=secStatus(k);return `<button type="button" data-act="osec" data-v="${k}" aria-pressed="${sec===k}"><b>${i+1}. ${l}</b><span class="${s.a?"amber":""}">${esc(s.t)}</span></button>`}).join("");
  return `${lockBar()}<div class="org"><nav class="secnav" aria-label="Organiser sections">${nav}</nav><div class="panel" style="min-width:0"><div class="stack">${(OSEC[sec]||(()=>""))()}</div></div></div>`;
}
const OSEC={};
OSEC.details=()=>{const c=A.cfg;
  return `<h2>Carnival details</h2><div class="fields">
    <label>Carnival name<input id="cName" value="${esc(c.name)}"></label>
    <label>Date<input id="cDate" type="date" value="${esc(c.date)}"></label>
    <label>Venue<input id="cVenue" value="${esc(c.venue)}"></label>
    <label>Lanes<input id="cLanes" type="number" min="4" max="10" value="${Number(c.lanes)||8}"></label>
    <label>Ages as at<input id="cAge" type="date" value="${esc(c.ageDate)}"></label>
    <label>Chief Official<input id="cChief" value="${esc(c.chief||"")}"></label>
  </div><div><button type="button" class="btn primary" data-act="osavedetails">Save details</button></div>
  <h3>Job PINs</h3><div class="row"><span class="chip">One PIN per job</span><span class="muted">Checked on the server. The organiser PIN opens this screen.</span></div>
  <div class="tablewrap"><table><thead><tr><th>Job</th><th>PIN now</th><th>New PIN</th></tr></thead><tbody>${PIN_ROLES.map(([k,n,d])=>{const changed=c.pins&&c.pins[k]&&c.pins[k]!==DEFAULT_PINS[k];return `<tr><td><b>${esc(n)}</b></td><td>${changed?`<span class="chip final">Changed</span>`:`<span class="chip prov">Test PIN ${d}</span>`}</td><td><span class="row" style="gap:6px;flex-wrap:nowrap"><input id="pin-${k}" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="New PIN for ${esc(n)}" style="width:7em"><button type="button" class="btn small" data-act="opin" data-v="${k}">Change</button></span></td></tr>`}).join("")}</tbody></table></div>
  <h3>Next race number</h3>
  <div class="row">${badge(A.counter)}<input id="cNext" inputmode="numeric" autocomplete="off" aria-label="New next race number" style="width:7em"><button type="button" class="btn small" data-act="onext">Set next race number</button><span class="muted" style="font-size:.88rem">Forward only, to match the timing console.</span></div>`};
OSEC.students=()=>{
  const all=students();const cnt={};for(const s of all)cnt[s.x+s.g]=(cnt[s.x+s.g]||0)+1;
  const pv=A.o.preview;const anyTest=A.roster.F.concat(A.roster.M).some(s=>s.test);
  return `<h2>Students</h2><p class="muted" style="margin:0">Made-up test students only. Date of birth is used on this computer to work out the age group, and is never stored.</p>
   <div class="row">${all.length?`<span class="chip final">${all.length} ${anyTest?"test ":""}students loaded</span>`:`<span class="chip prov">No list loaded yet</span>`}<button type="button" class="btn" data-act="oload">Load a student list</button></div>
   ${A.o.load?`<div class="panel stack" style="background:var(--sunk);border-color:transparent"><div class="msg info">Columns: Surname, Firstname, House (B, J or N), Sex (F or M), DOB. Ages as at ${esc(longDate(A.cfg.ageDate))}.</div>
     <textarea id="oText" placeholder="Paste the student list here (from Excel)">${esc(A.o.text)}</textarea>
     <div class="row"><label class="btn" for="oFile">Choose CSV file</label><input id="oFile" type="file" accept=".csv,.txt,.tsv" hidden><button type="button" class="btn" data-act="ocheck">Check list</button><button type="button" class="btn" data-act="otest">Load the 620 test students</button></div>
     ${pv?`<div class="stack"><div class="row"><span class="chip final">${pv.ok.length} ready</span><span class="chip ${pv.bad.length?"bad":"final"}">${pv.bad.length?pv.bad.length+" with problems":"No problems"}</span></div>
       ${pv.bad.length?`<div class="tablewrap"><table><thead><tr><th>Row</th><th>Surname</th><th>First name</th><th>Problem</th></tr></thead><tbody>${pv.bad.slice(0,50).map(b=>`<tr class="probrow"><td>${b.row.n}</td><td>${esc(b.row.s)}</td><td>${esc(b.row.f)}</td><td><b>${esc(b.probs.join(" "))}</b></td></tr>`).join("")}</tbody></table></div>`:""}
       <div><button type="button" class="btn primary" data-act="oimport" ${pv.ok.length?"":"disabled"}>Import ${pv.ok.length} students</button></div></div>`:""}
     <p class="muted" style="margin:0;font-size:.88rem">Importing replaces the current list. "Not on the list" still works on the day.</p></div>`:""}
   <div class="tablewrap"><table><thead><tr><th>Age group</th><th class="num">Girls</th><th class="num">Boys</th><th>Relay band</th></tr></thead><tbody>${AGE_GROUPS.map(a=>`<tr><td><b>${esc(grpName(a))}</b></td><td class="num">${cnt["F"+a]||0}</td><td class="num">${cnt["M"+a]||0}</td><td>${grpName(BAND_OF[a])}</td></tr>`).join("")}</tbody></table></div>`};
function groupsText(ev){return ev.gk==="band"?"Junior, Intermediate, Senior":ev.gk==="open"?"Open, boys and girls":"Each age, boys and girls"}
function timetableRows(){
  const c=A.cfg;const rows=[];
  for(const row of (c.timetable||[])){
    const ev=eventOf(c,row.k);if(!ev||!ev.on){if(!row.f)continue}
    const t=ev&&ev.on?`${ev.name}, ${row.x==="FM"?(ev.relay?"girls then boys":"boys and girls"):sexName(row.x).toLowerCase()}`:"";
    const g=!ev||!ev.on?"":ev.relay?"Junior, Intermediate, Senior":ev.gk==="open"?"Open":"18+ down to 12 & 13";
    const f=row.f?sexName(row.fx)+": "+[...new Set(row.f.filter(s=>{const e=eventOf(c,s.replace(/\d$/,""));return e&&e.on}).map(s=>stationIdOf(c,s,0)))].sort().join(", "):"–";
    rows.push(`<tr><td class="nmcell"><b>${esc(row.at)}</b></td><td><b>${esc(t)}</b></td><td>${esc(g)}</td><td style="font-size:.9rem">${esc(f)}</td></tr>`);
  }
  /* events with no timetable row: the organiser sets their time */
  const has=new Set((c.timetable||[]).flatMap(r=>[r.k,...(r.f||[]).map(s=>s.replace(/\d$/,""))]));
  for(const ev of eventsOn(c).filter(e=>!has.has(e.k)))rows.push(`<tr><td class="nmcell"><input id="at-${esc(ev.k)}" data-evat="${esc(ev.k)}" aria-label="Time for ${esc(ev.name)}" placeholder="Set a time" value="${esc(ev.at||"")}" style="width:7.5em"></td><td><b>${esc(ev.name)}</b></td><td>${esc(groupsText(ev))}</td><td>–</td></tr>`);
  return rows.join("");
}
OSEC.program=()=>{const ev=eventsOf(A.cfg);const on=eventsOn(A.cfg);
  const sum=l=>l.reduce((t,e)=>t+eventCount(e),0);const nT=sum(on.filter(e=>e.kind==="track")),nF=sum(on.filter(e=>e.kind==="field"));
  return `<h2>Program</h2><h3>Events on your program</h3><p class="muted" style="margin:0">Turn events on or off to match your school's program, or add your own. Turned off, an event is hidden on every job.</p>
  <div class="tablewrap"><table><thead><tr><th>Event</th><th>Type</th><th>Groups</th><th class="num">Events</th><th>On</th><th></th></tr></thead><tbody>
  ${ev.map(e=>`<tr><td><b>${esc(e.name)}</b></td><td>${e.kind==="field"?"Field":"Track"}</td><td>${esc(groupsText(e))}</td><td class="num">${eventCount(e)}</td><td><button type="button" class="switch" role="switch" aria-checked="${!!e.on}" aria-label="${esc(e.name)} on the program" data-act="oswitch" data-v="${esc(e.k)}"></button></td><td>${e.own?`<button type="button" class="btn small danger" data-act="oevdel" data-v="${esc(e.k)}">Remove</button>`:""}</td></tr>`).join("")}
  </tbody></table></div>
  ${A.o.adding?`<div class="row"><label class="label" style="display:flex;flex-direction:column;gap:4px">Event name<input id="oNew" aria-label="Event name" placeholder="For example, triple jump" value="${esc(A.o.nm||"")}"></label><button type="button" class="choice" aria-pressed="${A.o.nt!=="track"}" data-act="oaddtype" data-v="field">Field</button><button type="button" class="choice" aria-pressed="${A.o.nt==="track"}" data-act="oaddtype" data-v="track">Track</button><button type="button" class="btn primary" data-act="oaddev">Add</button><button type="button" class="btn" data-act="oaddcancel">Cancel</button></div>`
   :`<button type="button" class="btn" style="align-self:flex-start" data-act="oaddstart">Add an event</button>`}
  <b>${nT+nF} events: ${nT} track, ${nF} field</b>
  <h3>Timetable</h3><p class="muted" style="margin:0">The 2026 timetable. In each block one sex runs, oldest first, while the other does field events. Race numbers on the day follow whatever the marshal sends.</p>
  <div class="tablewrap"><table><thead><tr><th>Start</th><th>Track</th><th>Groups</th><th>Field events</th></tr></thead><tbody>${timetableRows()}</tbody></table></div>
  ${notRunPanel()}`};
/* a group nobody ran can be marked "Not run", so the carnival can go final */
function notRunPanel(){
  const marked=A.cfg.notRun||[];
  const open=A.R.events.filter(e=>!A.R.groups.has(e.key)&&!marked.includes(e.key));
  const lab=k=>{const {k:t,x,g}=splitKey(k);return groupLabel(eventOf(A.cfg,t),x,g)};
  return `<h3>Events not run</h3><p class="muted" style="margin:0">An event with no results keeps the carnival provisional. Mark it "Not run" if it will not run today.</p>
  <div class="row"><select id="oNotRun" aria-label="Event not run" style="flex:1 1 260px">${open.map(e=>`<option value="${esc(e.key)}">${esc(lab(e.key))}</option>`).join("")||`<option value="">Every event has results</option>`}</select><button type="button" class="btn" data-act="onotrun" ${open.length?"":"disabled"}>Mark not run</button></div>
  ${marked.length?`<div class="stack" style="gap:6px">${marked.map(k=>`<div class="row" style="justify-content:space-between"><span>${esc(lab(k))} <span class="chip">Not run</span></span><button type="button" class="btn small" data-act="onotrunundo" data-k="${esc(k)}">Undo</button></div>`).join("")}</div>`:""}`;
}
OSEC.field=()=>{const c=A.cfg;const on=fieldEvents(c);
  const order=[...on.filter(e=>e.style==="distance"),...on.filter(e=>e.style==="throw"),...on.filter(e=>e.style==="height")];
  const sel=(k,f,opts,v,lab)=>`<select aria-label="${esc(lab)}" data-rule="${esc(k)}" data-f="${f}" style="min-width:72px">${opts.map(([a,b])=>`<option value="${a}" ${String(v)===String(a)?"selected":""}>${esc(b)}</option>`).join("")}</select>`;
  const nums=[1,2,3,4,5,6].map(n=>[n,n]);
  const rows=order.map(e=>{const r=fieldRule(c,e);
    if(e.style==="height")return `<tr><td><b>${esc(e.name)}</b></td><td><span class="row" style="gap:6px">${sel(e.k,"tries",[[1,1],[2,2],[3,3]],r.tries,"Tries at each height")} tries at each height, out after 3 misses in a row</span></td><td>Highest height cleared</td><td>Fewer misses at that height, then overall, then share</td></tr>`;
    if(e.style==="throw")return `<tr><td><b>${esc(e.name)}</b></td><td><span class="row" style="gap:6px">${sel(e.k,"attempts",nums,r.attempts,e.name+" throws")} throws at most. Everyone throws once, then the official picks who throws again</span></td><td>Measured best throw, about 5 athletes. The rest are participation</td><td>Share the place and points</td></tr>`;
    return `<tr><td><b>${esc(e.name)}</b></td><td><span class="row" style="gap:6px">${sel(e.k,"attempts",nums,r.attempts,e.name+" jumps")} jumps at most. The official can finish an athlete early</span></td><td>Every jump</td><td>Share the place and points</td></tr>`}).join("");
  const hj=on.find(e=>e.style==="height");const jav=on.some(e=>e.k==="J");
  const cell=(a,f,v)=>`<input data-sheet="${esc(a)}" data-f="${f}" aria-label="${esc(a)} ${f}, girls and boys" value="${esc(v||"")}" style="width:9em;min-height:48px">`;
  const locs=on.map(e=>{const n=(c.locs||{})[e.k]||1;const box=v=>`<label style="display:flex;align-items:center;gap:10px;min-height:48px;cursor:pointer"><input type="checkbox" style="width:24px;height:24px" aria-label="${esc(e.name)}, ${plural(v,"location")}" ${n===v?"checked":""} data-loc="${esc(e.k)}" data-n="${v}">${v}</label>`;return `<tr><td><b>${esc(e.name)}</b></td><td>${box(1)}</td><td>${box(2)}</td></tr>`}).join("");
  return `<h2>Field event rules</h2><p class="muted" style="margin:0">From the 2027 CCAS instruction sheets. Change them here to suit your school.</p>
  <div class="tablewrap"><table><thead><tr><th>Event</th><th>Attempts</th><th>What is measured</th><th>Ties</th></tr></thead><tbody>${rows}</tbody></table></div>
  ${hj?`<div class="row"><span class="chip">High jump raises</span><span class="muted">Girls: 5 cm until 3 remain, then 3 cm. Boys: 10 cm first, then 5 cm until 3 remain, then 3 cm.</span></div>`:""}
  <h3>Heights and weights</h3><div class="tablewrap"><table><thead><tr><th>Age</th><th>High jump start, G / B</th><th>Shot, G / B</th><th>Discus, G / B</th>${jav?"<th>Javelin, G / B</th>":""}</tr></thead><tbody>${sheetOf(c).map(w=>`<tr><td><b>${esc(w.a)}</b></td><td>${cell(w.a,"hj",w.hj)}</td><td>${cell(w.a,"SP",w.SP)}</td><td>${cell(w.a,"D",w.D)}</td>${jav?`<td>${cell(w.a,"J",w.J)}</td>`:""}</tr>`).join("")}</tbody></table></div>
  <h3>Locations for each sport</h3><p class="muted" style="margin:0">Tick 1 or 2 locations for each field event that is on your program. With 1 location, groups on at the same time share it.</p>
  <table style="max-width:640px"><thead><tr><th>Sport</th><th>1 location</th><th>2 locations</th></tr></thead><tbody>${locs}</tbody></table>
  <h3>Stations</h3><div class="row">${stationsOf(c).map(s=>`<span class="chip">${esc(s.name)}</span>`).join("")}</div>`};
OSEC.points=()=>{const P=Object.assign({},DEFAULT_CONFIG.points,A.cfg.points||{}),Q=Object.assign({},DEFAULT_CONFIG.relayPoints,A.cfg.relayPoints||{});
  return `<h2>Points</h2><table style="max-width:520px"><thead><tr><th>Place</th><th class="num">Age events</th><th class="num">Relays</th></tr></thead><tbody><tr><td>1st</td><td class="num">${P.p1}</td><td class="num">${Q.p1}</td></tr><tr><td>2nd</td><td class="num">${P.p2}</td><td class="num">${Q.p2}</td></tr><tr><td>3rd</td><td class="num">${P.p3}</td><td class="num">${Q.p3}</td></tr><tr><td>4th and below</td><td class="num">${P.rest}</td><td class="num">${Q.rest}</td></tr></tbody></table>
  <p class="muted" style="margin:0">A no-show or no valid mark gets 0. One relay team per house, so each relay has 3 teams, with no names. Equal times in different heats share the points, as in swimming. In the 800 m and 1500 m, a marshalled runner with no time gets 1 second more than the place before. Age champions count only 1st to 3rd place points, and relays do not count. The 1500 m: ${qchip(14)}</p>`};
OSEC.limits=()=>{const L=A.cfg.limits||{};
  return `<h2>Odd-time limits</h2><p class="muted" style="margin:0">The Recorder is warned if a typed time is outside these. Values are to set.</p>
  <div class="tablewrap"><table style="max-width:520px"><thead><tr><th>Event</th><th>Fastest allowed</th><th>Slowest allowed</th></tr></thead><tbody>${trackEvents(A.cfg).map(e=>{const v=L[e.k]||[];return `<tr><td><b>${esc(e.name)}</b></td><td class="todoh"><input data-limit="${esc(e.k)}" data-i="0" aria-label="${esc(e.name)} fastest allowed" placeholder="[TO SET]" style="width:7.5em" value="${v[0]!=null?fmtTime(v[0]):""}"></td><td class="todoh"><input data-limit="${esc(e.k)}" data-i="1" aria-label="${esc(e.name)} slowest allowed" placeholder="[TO SET]" style="width:7.5em" value="${v[1]!=null?fmtTime(v[1]):""}"></td></tr>`}).join("")}</tbody></table></div>`};
OSEC.records=()=>{
  const rows=A.records.slice().sort((a,b)=>a.key.localeCompare(b.key));
  const lab=k=>{const {k:t,x,g}=splitKey(k);const e=eventOf(A.cfg,t);return e?groupLabel(e,x,g):k};
  const val=rc=>{const e=eventOf(A.cfg,splitKey(rc.key).k);return e&&e.kind==="field"?(e.style==="height"?fmtHeight(rc.v):fmtMark(rc.v))+" m":fmtTime(rc.v)};
  return `<h2>Records</h2>${A.records.length?"":`<div class="todo">No CCAS athletics records list yet. ${qchip(10)}</div>`}
  <button type="button" class="btn" style="align-self:flex-start" data-act="orecload">Load a records list</button>
  ${rows.length?`<div class="tablewrap"><table><thead><tr><th>Event</th><th class="num">Record</th><th>Holder</th><th>Year</th><th></th></tr></thead><tbody>${rows.map(rc=>`<tr><td><b>${esc(lab(rc.key))}</b></td><td class="num">${esc(val(rc))}</td><td>${esc((rc.holders||[]).map(h=>h.n).join(" and "))}</td><td>${esc((rc.holders||[]).map(h=>h.y).join(", "))}</td><td><button type="button" class="btn small danger" data-act="orecdel" data-k="${esc(rc.key)}">Remove</button></td></tr>`).join("")}</tbody></table></div>`:""}`};
MODALS.records=M=>`<h2>Load a records list</h2><p class="muted" style="margin:0">Paste rows: Event, Sex, Group, Result, Holder, House, Year. For example: 100 m, M, 18+, 12.10, Sam Price, J, 2019. The real layout is matched once the CCAS list arrives.</p>
  <textarea id="rcPaste" style="min-height:140px"></textarea>
  ${M.err?`<div class="msg bad">${esc(M.err)}</div>`:""}
  <div class="acts"><button type="button" class="btn" data-act="closemodal">Cancel</button><button type="button" class="btn primary" data-act="orecpaste">Add these records</button></div>`;
OSEC.export=()=>`<h2>Export</h2><div class="row"><button type="button" class="btn" data-act="csv">Download results CSV</button><button type="button" class="btn" data-act="hrisfile">Download HRIS file</button><button type="button" class="btn" data-act="obackup">Download full backup</button><label class="btn" for="oRestore">Restore a backup</label><input id="oRestore" type="file" accept=".json,application/json" hidden></div>
  <p class="muted" style="margin:0">No automatic backups. Export after the carnival. The HRIS file layout: ${qchip(20)}</p>`;
OSEC.lock=()=>`<h2>Lock and new carnival</h2><div class="row"><button type="button" class="btn" data-act="olock">${A.cfg.locked?"Unlock results":"Lock results"}</button><button type="button" class="btn danger" data-act="oclear">Clear practice data</button><button type="button" class="btn" data-act="onew">Start a new carnival</button></div>
  <p class="muted" style="margin:0">Clear practice data is for the staff run-through and asks first. Past years stay look only. The event coordinator (organiser PIN) can overrule any result at any time.</p>
  ${A.o.newMsg?`<div class="msg ok">${esc(A.o.newMsg)}</div>`:""}`;
MODALS.newCarnival=M=>M.step===1?`<h2>Start a new carnival</h2>
  <div><b>Kept as the ${esc((A.cfg.date||"2027").slice(0,4))} carnival (look only):</b> all ${students().length} students, ${A.heats.length} races and the field results. Open it any time from Change year.</div>
  <div><b>Then the new ${+((A.cfg.date||"2027").slice(0,4))+1} carnival starts empty:</b> no students or races, race number back to 1. Carnival details, PINs, program, field rules, points, limits and records carry over.</div>
  <label class="stack" style="gap:4px;font-weight:600">Type the organiser PIN<input id="ncPin" inputmode="numeric" maxlength="4" autocomplete="off" style="width:8em"></label>
  ${M.err?`<div class="msg bad">${esc(M.err)}</div>`:""}
  <div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back</button><button type="button" class="btn redfill" data-act="onew1">Keep this year and continue</button></div>`
 :`<h2>Bring in the updated records?</h2>${M.list.length?`<p style="margin:0">Records broken or equalled this carnival:</p><ul style="margin:0">${M.list.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:`<p style="margin:0">No records were broken or equalled this carnival.</p>`}
  <div class="acts"><button type="button" class="btn" data-act="onew2" data-v="no">No, I will upload a list</button><button type="button" class="btn primary" data-act="onew2" data-v="yes">Yes, bring them in</button></div>`;
MODALS.orgPin=M=>`<h2>${esc(M.title)}</h2>${M.body}
  <label class="stack" style="gap:4px;font-weight:600">Type the organiser PIN<input id="opPin" inputmode="numeric" maxlength="4" autocomplete="off" style="width:8em"></label>
  ${M.err?`<div class="msg bad">${esc(M.err)}</div>`:""}
  <div class="acts"><button type="button" class="btn" data-act="closemodal">&lt; Back</button><button type="button" class="btn redfill" data-act="oorgpinok">${esc(M.ok)}</button></div>`;
function orgPinOk(p){return pinHash(p)===pins().org}
function newRunId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function carnivalPaths(){
  const jobs=[];
  for(const h of A.heats){const id=h._id||rid(h.race);jobs.push("heats/"+id,"times/"+id,"finish/"+id,"slips/"+id,"photos/"+id)}
  for(const id of Object.keys(A.times))jobs.push("times/"+id);
  for(const id of Object.keys(A.finish))jobs.push("finish/"+id);
  for(const id of Object.keys(A.slips))jobs.push("slips/"+id,"photos/"+id);
  for(const id of Object.keys(A.field))jobs.push("field/"+id);
  for(const e of A.extras)jobs.push("extras/"+e.id);
  return [...new Set(jobs)];
}
function clearLocal(){A.heats=[];A.times={};A.finish={};A.slips={};A.field={};A.extras=[];A.counter=1;A.mt=mtBlank(null);mtSave();A.f.undo=[];A.f.gid=null;A.f.typed="";A.f.a=null;A.f.id=null;fSave();A.j.race=null;A.r.race=null;A.s.race=null;A.a.key=null;A.a.idx=null}
/* clear the practice run; students and settings stay, nothing is kept as a year */
async function clearPractice(){
  if(A.past){toast("Past years are look only.");return}
  toast("Clearing...");
  for(const p of carnivalPaths()){try{await A.store.del(p)}catch(e){}}
  await w0(()=>A.store.set("counter/race",{next:1,at:Date.now()}));
  await saveCfg({locked:false,lockedAt:null,runId:newRunId(),notRun:[]},"Practice data cleared");
  clearLocal();
  A.o.newMsg="Practice data cleared. Race number back to 1. Students, settings and records are kept.";
  A.modal=null;recompute();render();
}
const strip=o=>JSON.parse(JSON.stringify(o));
async function downloadBackup(){
  toast("Making the backup...");
  const photos={};
  for(const id of Object.keys(A.slips)){try{const ph=await A.store.get("photos/"+id);if(ph&&ph.img)photos[id]=ph.img}catch(e){}}
  const b={app:"CCAS Athletics Carnival",kind:"full backup",version:"Aths Opt 1.1",savedAt:localStamp(),year:curYear(),
    config:strip(A.cfg),roster:{F:strip(A.roster.F),M:strip(A.roster.M)},extras:strip(A.extras),heats:strip(A.heats),times:strip(A.times),
    finish:strip(A.finish),slips:strip(A.slips),field:strip(A.field),records:strip(A.records),counter:A.counter,photos};
  await saveFile("CCAS athletics backup "+localStamp().replace(":","")+".json",JSON.stringify(b),"application/json");
}
function readBackup(text){
  let b=null;try{b=JSON.parse(text)}catch(e){}
  if(!b||b.kind!=="full backup"||!b.config||!Array.isArray(b.heats))return null;
  return b;
}
async function restoreBackup(b){
  if(A.past){toast("Past years are look only.");return}
  const clean=o=>{const c=Object.assign({},o);delete c._id;return c};
  toast("Restoring...");
  for(const p of carnivalPaths()){try{await A.store.del(p)}catch(e){}}
  let bad=0;const put=async(p,d)=>{if(!await w0(()=>A.store.set(p,d)))bad++};
  await put("config/main",Object.assign({},b.config,{runId:newRunId()}));
  await put("roster/F",{students:(b.roster&&b.roster.F)||[],at:Date.now()});
  await put("roster/M",{students:(b.roster&&b.roster.M)||[],at:Date.now()});
  for(const e of b.extras||[])await put("extras/"+e.id,clean(e));
  for(const h of b.heats)await put("heats/"+(h._id||rid(h.race)),clean(h));
  for(const k of ["times","finish","slips","field"])for(const id in (b[k]||{}))await put(k+"/"+id,clean(b[k][id]));
  for(const id in (b.photos||{}))await put("photos/"+id,{img:b.photos[id],at:Date.now()});
  await put("records/all",{list:b.records||[]});
  await put("counter/race",{next:Number(b.counter)||1,at:Date.now()});
  A.modal=null;
  A.o.newMsg=bad?"Restore finished, but "+plural(bad,"item")+" could not be saved. Check the connection and restore again.":"Backup from "+String(b.savedAt||"").slice(0,16)+" restored.";
  render();
}
async function setNextRace(){
  const v=Number(String(document.getElementById("cNext").value).replace(/[^0-9]/g,""));
  if(!v||v<=A.counter){toast("The next race number only goes forward. Type a number above "+A.counter+".");return}
  if(v>A.counter+50){toast("That is more than 50 races ahead. Check the number.");return}
  const r=await w0(()=>A.store.set("counter/race",{next:v,by:DEV,at:Date.now()}));
  if(r){A.counter=v;toast("Next race number is now "+v);render()}
}
async function saveCfg(patch,msg){
  A.cfg=Object.assign({},A.cfg,patch);recompute();
  const r=await w0(()=>A.store.set("config/main",A.cfg));
  if(r){toast(msg||"Saved");render()}
}
async function w0(fn){if(A.past){toast("Past years are look only.");return null}try{const r=await fn();if(r&&r.queued)toast("Saved on this device. Sends when there is signal.");return r||{ok:true}}catch(e){toast("Not saved. Check the connection and try again.");return null}}
async function newCarnival(bring){
  const yr=(A.cfg.date||"2027").slice(0,4);
  let recs=A.records.slice();
  if(bring){for(const G of A.R.broken.filter(G=>G.final)){const holders=G.recordNote.rows.map(r=>({n:pname(r.p),h:r.p.h,y:yr}));
    const old=G.recordNote.old;recs=recs.filter(x=>x.key!==G.key);recs.push({key:G.key,v:G.field?G.recordNote.rows[0].best:G.recordNote.rows[0].eff,holders:G.recordNote.kind==="equal"?[...(old.holders||[]),...holders]:holders})}}
  toast("Keeping the "+yr+" carnival...");
  const a1=await w0(()=>A.store.set("archive/"+yr+"-config",{cfg:strip(A.cfg),records:strip(A.records)}));
  const a2=a1&&await w0(()=>A.store.set("archive/"+yr+"-roster",{F:strip(A.roster.F),M:strip(A.roster.M),extras:strip(A.extras)}));
  const a3=a2&&await w0(()=>A.store.set("archive/"+yr+"-data",{heats:strip(A.heats),times:strip(A.times),finish:strip(A.finish),slips:strip(A.slips),field:strip(A.field),counter:A.counter}));
  if(!a3){A.modal=null;toast("The "+yr+" carnival could not be kept, so nothing was cleared. Try again.");render();return}
  for(const id of Object.keys(A.slips)){try{const ph=await A.store.get("photos/"+id);if(ph)await A.store.set("photos/y"+yr+"-"+id,ph)}catch(e){}}
  await w0(()=>A.store.set("years/"+yr,{year:yr,name:A.cfg.name,date:A.cfg.date,archivedAt:Date.now(),heats:A.heats.length,students:students().length}));
  toast("Clearing...");
  for(const p of [...carnivalPaths(),"roster/F","roster/M"]){try{await A.store.del(p)}catch(e){}}
  await A.store.set("counter/race",{next:1,at:Date.now()});
  await A.store.set("records/all",{list:recs});
  const ny=String(+yr+1);
  await A.store.set("config/main",Object.assign({},A.cfg,{runId:newRunId(),notRun:[],locked:false,lockedAt:null,date:ny+(A.cfg.date||"2027-06-18").slice(4),ageDate:ny+"-12-31",name:String(A.cfg.name||"").includes(yr)?A.cfg.name.replace(yr,ny):A.cfg.name}));
  clearLocal();A.roster={F:[],M:[]};A.records=recs;
  A.o.newMsg="The "+yr+" carnival is kept (look only, open it from Change year). The "+ny+" carnival is ready. Race number back to 1. Load the new student list in section 2 and check the date in section 1.";
  A.modal=null;recompute();render();
}
function addRecords(list){
  const map=new Map(A.records.map(r=>[r.key,r]));for(const r of list)map.set(r.key,r);
  A.records=[...map.values()];recompute();
  return w0(()=>A.store.set("records/all",{list:A.records}));
}
