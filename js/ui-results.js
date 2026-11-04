/* ===== Announcer, Results, Houses ===== */
function finalsInOrder(){return [...A.R.groups.values()].filter(G=>G.final).sort((a,b)=>a.checkedAt-b.checkedAt)}
/* the results already read out belong to this carnival (its year and run), and are forgotten on Sign out */
function readKey(){return "aths_read:"+curYear()+":"+(A.cfg.runId||"")}
function readSet(){try{return new Set(JSON.parse(localStorage.getItem(readKey())||"[]"))}catch(e){return new Set()}}
function markRead(key){try{const s=readSet();s.add(key);localStorage.setItem(readKey(),JSON.stringify([...s]))}catch(e){}}
function clearReadLists(){try{for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&k.startsWith("aths_read"))localStorage.removeItem(k)}}catch(e){}A.a.key=null;A.a.idx=null}
/* the Marshal sends heats ahead of the track, so "On the track now" is the first race sent with no result yet */
function trackRace(){return liveRaces().find(r=>r.multi?!r.hasSlip:(r.filled.length&&!r.tapped&&!r.nTimes&&!r.hasSlip))||null}
function recordLine(G){
  if(!G.record)return "Record [no list yet]";
  const h=G.record.holders||[];
  return `Record ${G.field?(G.ev.style==="height"?fmtHeight(G.record.v):fmtMark(G.record.v))+" m":fmtTime(G.record.v)}, ${esc(h.map(x=>x.n).join(" and "))}${h[0]&&h[0].y?" "+esc(h[0].y):""}`;
}
function statusChip(){const R=A.R;const n=R.events.length;const k=R.finalCount;return k>=n&&n?`<span class="chip final">Final, all ${n} events in</span>`:`<span class="chip prov">Provisional, ${k} of ${n} events in</span>`}
function stand(){
  return `<div class="stand">${A.R.houseRank.map((h,i)=>`${medal(i+1)}<span class="htag">${hdot(h.c)}${esc(h.n)}</span><b>${fmtPts(h.total)}</b>`).join("")}</div>`;
}
function fieldNow(){
  const R=A.R;const now=blockNow(R);if(now==null)return {at:"",list:[]};
  const stn=id=>(R.stations.find(s=>s.id===id)||{}).name||id;
  return {at:(A.cfg.timetable[now]||{}).at||"",list:R.fgroups.filter(f=>f.block===now).map(f=>({a:stn(f.station),b:sexName(f.x)+" "+grpName(f.g)}))};
}
function brokenCards(){
  const b=A.R.broken.filter(G=>G.rows.some(r=>r.place===1));
  if(!b.length)return "";
  return `<div class="panel stack" style="padding:12px"><span class="label">Records broken today</span>${b.map(G=>{const n=G.recordNote;return `<div class="row" style="justify-content:space-between;gap:6px"><b>${esc(G.label)}</b><span class="tag ${n.kind==="new"?"rec":"eq"}">${n.kind==="new"?"NEW RECORD":"EQUALS RECORD"}</span></div>
    <div style="font-size:.92rem">${n.rows.map(r=>`${esc(pname(r.p))} (${esc(houseName(r.p.h))}) ${esc(resultText(G,r))}`).join(", ")}</div>`}).join("")}</div>`;
}
function renderAnnouncer(){
  const on=trackRace();const finals=finalsInOrder();
  /* the result on screen is kept by its group, so a result that turns final earlier never moves it */
  let at=A.a.key?finals.findIndex(G=>G.key===A.a.key):-1;
  if(at<0){const rs=readSet();const i=finals.findIndex(G=>!rs.has(G.key));at=i<0?Math.max(0,finals.length-1):i}
  A.a.idx=at;A.a.key=finals[at]?finals[at].key:null;
  const G=finals[at];const more=finals.length-1-at;const ph=phoneNow();
  const R=A.R;
  const tag=!G?"":G.field?"Field":raceRange(G.raceNos);
  const meta=!G?"":G.field?`${(R.stations.find(s=>s.id===G.fg.station)||{}).name||""} · best marks`:`${plural(G.heats.length,"heat")} · timed final`;
  const top=G?G.rows.filter(r=>r.place&&r.place<=3):[];
  const card=G?`<div class="panel stack" style="padding:12px"><div class="row" style="justify-content:space-between"><span class="label">Read out next</span><span class="chip final">Final</span></div>
      <div class="row phmeta"><span class="chip">${esc(tag)}</span><h2>${esc(G.label)}</h2></div><span class="muted" style="font-size:.85rem">${esc(meta)}${more>0?` · ${more} more ready`:" · up to date"}</span>
      <div class="podium">${top.map(r=>`<div class="pr">${medal(r.place)}<div style="min-width:0"><b>${esc(pname(r.p))}</b><span class="htag" style="font-size:.86rem">${hdot(r.p.h)}${esc(houseName(r.p.h))}</span>${r.tag?` <span class="tag ${r.tag==="NEW RECORD"?"rec":"eq"}">${r.tag}</span>`:""}</div><span class="t">${esc(resultText(G,r))}</span></div>`).join("")||`<p class="muted" style="margin:0">No results in this group.</p>`}</div>
      ${at>0?`<div><button type="button" class="linkbtn" data-act="aprev">Earlier result</button></div>`:""}
      ${ph?"":`<button type="button" class="btn navy big" data-act="aread" ${more>0?"":"disabled"}>${more>0?"Read, next":"Waiting for the next result"}</button>`}</div>`
    :`<div class="panel stack" style="padding:12px"><span class="label">Read out next</span><p class="muted" style="margin:0">Waiting for the first final result. A result appears when every heat of a group has its times and places in, or a field station finishes its group.</p></div>`;
  const fn=fieldNow();
  const fieldP=`<div class="panel stack" style="padding:12px"><span class="label">Field events now${fn.at?", "+esc(fn.at):""}</span>${fn.list.length?`<div class="fieldnow">${fn.list.map(f=>`<div class="fr"><span>${esc(f.a)}</span><span class="muted">${esc(f.b)}</span></div>`).join("")}</div>`:`<p class="muted" style="margin:0">All field groups are finished.</p>`}</div>`;
  const standP=`<div class="panel stack" style="padding:12px"><span class="label">House standings</span><span style="align-self:flex-start">${statusChip()}</span>${stand()}</div>`;
  const left=`<div class="water"><span class="label">On the track now</span>${on?badge(on.race,"sm")+`<b style="font-family:var(--font-display);font-size:1.05rem">${esc(on.label)}</b>`:`<span>${liveRaces().length?"Waiting for the next race":"Nothing sent yet"}</span>`}</div>${card}`;
  if(ph)return `<div class="ann ph" style="grid-template-columns:minmax(0,1fr)"><div class="stack">${left}${fieldP}${standP}${brokenCards()}</div></div>
    <div class="pbar"><div class="wrap"><button type="button" class="btn" data-act="goto" data-job="houses">Houses</button><button type="button" class="btn" data-act="goto" data-job="results">Full results</button><button type="button" class="btn navy" data-act="aread" ${more>0?"":"disabled"}>Read, next</button></div></div>`;
  return `<div class="ann"><div class="stack">${left}</div><div class="stack">${fieldP}${standP}${brokenCards()}</div></div>`;
}

/* ---------- Results ---------- */
function resultGroups(){
  const v=A.res.view;const out=[];
  for(const e of A.R.events){
    const G=A.R.groups.get(e.key);if(!G)continue;
    if((v==="F"||v==="M")&&e.x!==v)continue;
    if(v==="track"&&G.field)continue;
    if(v==="field"&&!G.field)continue;
    out.push(G);
  }
  return out;
}
function groupCard(G){
  const stn=G.field?(A.R.stations.find(s=>s.id===G.fg.station)||{}).name:"";
  const meta=G.field?`${esc(stn)} · ${G.ev.style==="height"?"best height cleared":"best mark"} · ${recordLine(G)}`:`${raceRange(G.raceNos)} · ${plural(G.heats.length,"heat")}, timed final · ${recordLine(G)}`;
  const note=G.recordNote?`<div class="recbox"><b>${G.recordNote.kind==="new"?"New record":"Record equalled"}:</b> ${G.recordNote.rows.map(r=>`${esc(pname(r.p))} (${esc(houseName(r.p.h))}) ${esc(resultText(G,r))}`).join(", ")}.${G.final?"":" Provisional until all heats are in."}</div>`:"";
  const tags=r=>`${r.tag?`<span class="tag ${r.tag==="NEW RECORD"?"rec":"eq"}">${r.tag}</span> `:""}${r.hris?`<span class="tag hris">HRIS</span>`:""}`;
  const head=G.field?`<th>Place</th><th>Athlete</th><th>House</th><th class="num">Best mark</th><th class="num">Set on</th><th class="num">Points</th><th></th>`:`<th>Place</th><th>Runner</th><th>House</th><th class="num">Time</th><th class="num">Heat</th><th class="num">Points</th><th></th>`;
  const rows=G.rows.map(r=>G.field?`<tr><td>${placeCell(r.place,r.tie)}</td><td>${esc(pname(r.p))}</td><td>${hdot(r.p.h)}</td><td class="num">${r.best?esc(resultText(G,r)):r.m.ns?"NS":"No mark"}</td><td class="num">${r.bestAt?"Jump "+r.bestAt:""}</td><td class="num">${fmtPts(r.pts||0)}</td><td>${tags(r)}</td></tr>`
    :`<tr><td>${placeCell(r.place)}</td><td>${esc(pname(r.p))}</td><td>${hdot(r.p&&r.p.h)}</td><td class="num">${noTimeSt(r.st)?r.st:r.eff!=null?fmtTime(r.eff)+(r.auto?" (+1 s)":""):`<span class="muted">waiting</span>`}</td><td class="num">${r.heat}</td><td class="num">${fmtPts(r.pts||0)}</td><td>${tags(r)}</td></tr>`).join("");
  return `<article class="gcard"><div class="ghead"><h3>${esc(G.label)}</h3><span class="meta">${meta}</span><span class="chip ${G.final?"final":"prov"}">${G.status}</span></div>${note}<div class="tablewrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div></article>`;
}
function renderResults(){
  const f=A.res;
  const tabs=`<div class="row" style="justify-content:space-between;margin-bottom:12px"><div class="tabs" style="margin:0">${[["res","Event results"],["hris","HRIS Team List"],["news","Newsletter draft"]].map(([k,l])=>`<button type="button" data-act="rtab" data-v="${k}" aria-pressed="${f.tab===k}">${l}</button>`).join("")}</div>
    <div class="row">${statusChip()}<button type="button" class="btn" data-act="csv">Export CSV</button></div></div>`;
  if(f.tab==="news")return tabs+renderNews();
  if(f.tab==="hris"){
    const L=hrisList(A.R);
    return tabs+`<div class="stack"><div class="row" style="justify-content:space-between"><span class="muted" style="flex:1 1 400px">The top 2 in every individual event, field events included. Relays are not on the list. Sent as a file, like swimming.</span><button type="button" class="btn primary" data-act="hrisfile">Export HRIS file</button></div>
      <div class="todo">The file layout is matched to a sample first. ${qchip(20)}</div>
      <div class="panel" style="padding:0;overflow:hidden"><div class="tablewrap"><table><thead><tr><th>Event</th><th>Place</th><th>Athlete</th><th>House</th><th class="num">Result</th></tr></thead><tbody>
      ${L.map(x=>`<tr><td><b>${esc(x.label)}</b></td><td>${medal(x.place)}</td><td>${esc(pname(x.p))}</td><td>${hdot(x.p.h)}</td><td class="num">${esc(x.val)}</td></tr>`).join("")||`<tr><td colspan="5" class="muted">No results yet.</td></tr>`}
      </tbody></table></div></div></div>`;
  }
  const gs=resultGroups();
  return tabs+`<div class="stack"><div class="tabs" style="margin:0">${[["all","All"],["F","Girls"],["M","Boys"],["track","Track"],["field","Field"]].map(([k,l])=>`<button type="button" data-act="rview" data-v="${k}" aria-pressed="${f.view===k}">${l}</button>`).join("")}</div>
    ${gs.length?gs.map(groupCard).join(""):`<div class="panel muted">No results match yet.</div>`}</div>`;
}
function newsText(){
  const R=A.R;const c=A.cfg;const d=new Date(String(c.date)+"T00:00:00");
  const day=isNaN(d)?"":d.toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long"}).replace(",","");
  const [a,b,e]=R.houseRank;const P=[];const all=R.finalCount>=R.events.length&&R.events.length;
  let p=`The CCAS Athletics Carnival was held on ${day} at the ${c.venue}.`;
  if(a&&a.total)p+=all?` ${a.n} won the house championship on ${fmtPts(a.total)} points, with ${b.n} on ${fmtPts(b.total)} and ${e.n} on ${fmtPts(e.total)}.`:` ${a.n} leads the house championship so far on ${fmtPts(a.total)} points, with ${b.n} on ${fmtPts(b.total)} and ${e.n} on ${fmtPts(e.total)}.`;
  P.push(p);
  const ch=[];
  if(all)for(const ag of AGE_GROUPS)for(const x of ["F","M"]){const w=R.champs[ag+"|"+x];if(!w||!w.winners.length)continue;
    ch.push(`${grpName(ag)} ${x==="F"?"girls":"boys"}: ${w.winners.map(v=>pname(v.p)+" ("+houseName(v.p.h)+")").join(" and ")}${w.runners.length?", runner up "+w.runners.map(v=>pname(v.p)).join(" and "):""}.`)}
  const rec=R.broken.filter(G=>G.final);
  if(ch.length)P.push("Age champions:\n"+ch.join("\n"));
  if(rec.length)P.push("Records: "+rec.map(G=>G.recordNote.rows.map(r=>pname(r.p)).join(" and ")+(G.recordNote.kind==="new"?" set a new record":" equalled the record")+" in the "+G.label+" ("+resultText(G,G.recordNote.rows[0])+")").join(". ")+".");
  P.push(all?"Check newsletter and media consent before naming students publicly.":"Age champions and school records appear here once results are final. Check newsletter and media consent before naming students publicly.");
  return P.join("\n\n");
}
function renderNews(){
  return `<div class="panel stack" style="max-width:860px"><h2>Newsletter draft</h2><p class="newsbox" id="newsText" style="margin:0">${esc(newsText())}</p><div class="row"><button type="button" class="btn" data-act="newscopy">Copy text</button></div></div>`;
}
function csvCell(v){v=String(v==null?"":v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
async function exportCsv(){
  const R=A.R;
  const lines=[["Race","Heat","Lane","Event","Sex","Group","Surname","First name","House","Recorded","Result","Status","Place","Points","HRIS","Record"].join(",")];
  for(const G of R.groups.values())for(const r of G.rows){
    if(G.field)lines.push(["","","",G.ev.name,sexName(G.x),grpName(G.g),r.p.s,r.p.f,houseName(r.p.h),"",resultText(G,r).replace(" m",""),r.m.ns?"NS":r.best?"ok":"No mark",r.place||"",r.pts||0,r.hris?"Yes":"",r.tag||""].map(csvCell).join(","));
    else lines.push([r.race,r.heat,r.lane,G.ev.name,sexName(G.x),grpName(G.g),r.p.team?r.p.name:r.p.s,r.p.team?"":r.p.f,houseName(r.p.h),fmtTime(r.rec),fmtTime(r.eff),r.auto?"+1 s":r.st,r.place||"",r.pts||0,r.hris?"Yes":"",r.tag||""].map(csvCell).join(","));
  }
  lines.push("");lines.push("House,Track,Field,Relays,Total");
  for(const h of R.houseRank)lines.push([h.n,h.track,h.fieldPts,h.relay,h.total].join(","));
  lines.push("");lines.push("Age group,Sex,Champion,Points,Runner up,Points");
  for(const ag of AGE_GROUPS)for(const x of ["F","M"]){const c=R.champs[ag+"|"+x];lines.push([grpName(ag),sexName(x),c.winners.map(v=>pname(v.p)).join(" and "),c.winners[0]?c.winners[0].pts:"",c.runners.map(v=>pname(v.p)).join(" and "),c.runners[0]?c.runners[0].pts:""].map(csvCell).join(","))}
  await saveFile("CCAS athletics results "+localStamp().slice(0,10)+".csv",lines.join("\n"),"text/csv");
}
/* the layout waits for a sample file (question 20), so this is a plain list until then */
async function exportHris(){
  const lines=["Event,Place,Surname,First name,House,Result"].concat(hrisList(A.R).map(x=>[x.label,x.place,x.p.s,x.p.f,houseName(x.p.h),x.val].map(csvCell).join(",")));
  await saveFile("CCAS HRIS team list "+localStamp().slice(0,10)+".csv",lines.join("\n"),"text/csv");
}
async function saveFile(name,data,type){
  try{
    const url=URL.createObjectURL(new Blob([data],{type:(type||"text/plain")+";charset=utf-8"}));
    const a=document.createElement("a");a.href=url;a.download=name;a.style.display="none";document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},4000);toast("Saved to Downloads: "+name);return true;
  }catch(e){}
  toast("Export is not available in this view.");return false;
}

/* ---------- Houses ---------- */
function renderHouses(){
  const R=A.R;const max=Math.max(1,...R.houseRank.map(h=>h.total));
  const cards=R.houseRank.map((h,i)=>`<div class="hcard h${h.c}"><div class="row" style="justify-content:space-between">${medal(i+1)}<span class="htag">${hdot(h.c)}<b>${esc(h.n)}</b></span></div>
    <span class="pts">${fmtPts(h.total)}</span><div class="barw"><div class="bar" style="width:${Math.round(h.total/max*100)}%"></div></div>
    <span class="muted" style="font-size:.86rem">Track ${fmtPts(h.track)}, field ${fmtPts(h.fieldPts)}, ${h.relay?"relays "+fmtPts(h.relay):"relays not run yet"}</span></div>`).join("");
  const rowsAge=AGE_GROUPS.map(a=>`<tr><td>${esc(grpName(a))}</td>${HOUSES.map(h=>`<td class="num">${fmtPts(R.house[h.c].byAge[a])}</td>`).join("")}</tr>`).join("");
  const champ=AGE_GROUPS.map(a=>{
    const rows=["F","M"].map(x=>{const c=R.champs[a+"|"+x];const line=(p,v)=>`<div class="champ">${`<span class="medal m${p}" style="width:26px;height:26px">${p}</span>`}<span>${esc(pname(v.p))} <span class="muted">(${sexName(x)})</span></span>${hdot(v.p.h)}</div>`;
      return c.winners.length?c.winners.map(v=>line(1,v)).join("")+c.runners.map(v=>line(2,v)).join(""):`<div class="champ"><span></span><span class="muted">${sexName(x)}: no points yet</span><span></span></div>`}).join("");
    return `<div class="panel" style="padding:10px 12px"><b style="font-family:var(--font-display)">${esc(grpName(a))}</b>${rows}</div>`}).join("");
  return `<div class="stack"><div class="row" style="justify-content:space-between"><h2>House points</h2>${statusChip()}</div>
    <div class="hcards">${cards}</div>
    <div class="grid2" style="grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);align-items:start">
      <div class="panel stack"><h3>Points by age group</h3><table><thead><tr><th>Age group</th>${HOUSES.map(h=>`<th class="num">${hdot(h.c)}</th>`).join("")}</tr></thead><tbody>${rowsAge}
        <tr><td>Relays</td>${HOUSES.map(h=>`<td class="num">${fmtPts(R.house[h.c].relay)}</td>`).join("")}</tr>
        <tr><td><b>Total</b></td>${HOUSES.map(h=>`<td class="num"><b>${fmtPts(R.house[h.c].total)}</b></td>`).join("")}</tr></tbody></table>
        <span class="muted" style="font-size:.85rem">Girls and boys together. Relays count for houses only. The 1500 m: ${qchip(14)}</span></div>
      <div class="stack"><h3>Age champions</h3><div class="grid2">${champ}</div>
        <span class="muted" style="font-size:.85rem">Most points, counting only 1st, 2nd and 3rd place. Relays do not count. Joint champions have no runner up.</span></div>
    </div></div>`;
}
