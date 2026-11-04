/* ===== Aths Opt 1.0: results engine (no screen code) =====
   Every place, point, record, house total and champion is worked out here from the stored records.
   Nothing worked out here is ever stored. The program, the timetable and the field rules are organiser
   data in the config, so the app is not fixed to the CCAS events (decision 31). */
const AGE_GROUPS=["13","14","15","16","17","18"];
const AGES_DOWN=["18","17","16","15","14","13"]; /* oldest first, as the timetable runs */
const BANDS=["J","I","S"];
const BAND_AGES={J:["13","14"],I:["15","16"],S:["17","18"]};
const BAND_OF={"13":"J","14":"J","15":"I","16":"I","17":"S","18":"S"};
const HOUSES=[{c:"B",n:"Bradman"},{c:"J",n:"Jackson"},{c:"N",n:"Newcombe"}];
const TEAMS=["T-B","T-J","T-N"]; /* one relay team per house (decision 16), no names (decision 24) */

const DEFAULT_EVENTS=[
  {k:"100",name:"100 m",kind:"track",run:"lanes",gk:"age",dist:100,on:true},
  {k:"200",name:"200 m",kind:"track",run:"lanes",gk:"age",dist:200,on:true},
  {k:"400",name:"400 m",kind:"track",run:"lanes",gk:"age",dist:400,on:true},
  {k:"800",name:"800 m",kind:"track",run:"multi",gk:"age",dist:800,on:true},
  {k:"1500",name:"1500 m",kind:"track",run:"multi",gk:"open",dist:1500,on:true},
  {k:"R",name:"4 x 100 m relay",kind:"track",run:"lanes",gk:"band",dist:400,relay:true,on:true},
  {k:"HJ",name:"High Jump",kind:"field",style:"height",gk:"age",on:true},
  {k:"LJ",name:"Long Jump",kind:"field",style:"distance",gk:"age",on:true},
  {k:"SP",name:"Shot Put",kind:"field",style:"throw",gk:"age",on:true},
  {k:"D",name:"Discus",kind:"field",style:"throw",gk:"age",on:true},
  {k:"J",name:"Javelin",kind:"field",style:"throw",gk:"age",on:false}
];
/* the 2026 timetable. f lists the station for each age, oldest first */
const DEFAULT_TIMETABLE=[
  {at:"8:30 am",k:"1500",x:"FM"},
  {at:"9:15 am",k:"100",x:"M",fx:"F",f:["HJ1","LJ1","LJ2","D1","SP","D2"]},
  {at:"9:55 am",k:"100",x:"F",fx:"M",f:["HJ2","LJ1","LJ2","D2","SP","D1"]},
  {at:"10:40 am",k:"800",x:"M",fx:"F",f:["LJ1","SP","D2","SP","HJ1","HJ2"]},
  {at:"11:10 am",k:"800",x:"F",fx:"M",f:["LJ2","D1","SP","SP","HJ2","HJ1"]},
  {at:"11:40 am",k:"200",x:"M",fx:"F",f:["SP","D1","SP","HJ1","LJ1","LJ2"]},
  {at:"12:10 pm",k:"200",x:"F",fx:"M",f:["SP","SP","D2","HJ2","LJ2","LJ1"]},
  {at:"12:40 pm",k:"400",x:"M",fx:"F",f:["D1","HJ1","HJ2","LJ1","D2","SP"]},
  {at:"1:10 pm",k:"400",x:"F",fx:"M",f:["D2","HJ1","HJ2","LJ2","D1","SP"]},
  {at:"1:35 pm",k:"R",x:"FM"}
];
/* the 2027 instruction sheets (decisions 32 to 35), held as organiser settings */
const RULE_DIST={attempts:3,ties:"share",shortTop:4};         /* long jump: every jump measured */
const RULE_THROW={attempts:3,ties:"share"};                   /* throws: fair, foul or pass; the best is measured once */
const RULE_HIGH={tries:3,raise:{F:[5],M:[10,5]},lastRaise:3,lastLeft:3,pass:true,ties:"countback"};
/* each cell holds girls / boys, as on the sheets */
const DEFAULT_SHEET=[
  {a:"12",hj:"1.05 / 1.15 m",SP:"3 / 3 kg",D:"0.75 / 0.75 kg",J:"400 / 600 g"},
  {a:"13",hj:"1.05 / 1.15 m",SP:"3 / 3 kg",D:"1 / 1 kg",J:"400 / 600 g"},
  {a:"14",hj:"1.10 / 1.15 m",SP:"3 / 4 kg",D:"1 / 1 kg",J:"500 / 700 g"},
  {a:"15",hj:"1.10 / 1.20 m",SP:"3 / 4 kg",D:"1 / 1 kg",J:"500 / 700 g"},
  {a:"16",hj:"1.10 / 1.20 m",SP:"3 / 5 kg",D:"1 / 1.5 kg",J:"500 / 700 g"},
  {a:"17",hj:"1.10 / 1.20 m",SP:"3 / 5 kg",D:"1 / 1.5 kg",J:"500 / 700 g"},
  {a:"18+",hj:"1.10 / 1.20 m",SP:"4 / 6 kg",D:"1 / 1.75 kg",J:"600 / 800 g"}
];
const DEFAULT_CONFIG={
  name:"CCAS Athletics Carnival 2027",date:"2027-06-18",ageDate:"2027-12-31",venue:"Mingara Athletics Track",lanes:8,chief:"Jordan Dennis",
  points:{p1:10,p2:8,p3:6,rest:4},relayPoints:{p1:20,p2:16,p3:12,rest:8},
  events:DEFAULT_EVENTS,timetable:DEFAULT_TIMETABLE,locs:{HJ:2,LJ:2,SP:1,D:2,J:1},rules:{},sheet:DEFAULT_SHEET,
  /* marks to the nearest centimetre (decision 38) */
  markDp:2,
  /* question 14: how the Open 1500 m counts. Assumed until Jordan decides */
  open:{house:true,champ:false},
  limits:{},locked:false,lockedAt:null,notRun:[]
};
function eventsOf(cfg){return (cfg&&cfg.events)||DEFAULT_EVENTS}
function eventOf(cfg,k){return eventsOf(cfg).find(e=>e.k===k)||null}
function eventsOn(cfg){return eventsOf(cfg).filter(e=>e.on)}
function trackEvents(cfg){return eventsOn(cfg).filter(e=>e.kind==="track")}
function fieldEvents(cfg){return eventsOn(cfg).filter(e=>e.kind==="field")}
function grpName(g){
  if(g==="13")return "12 & 13";if(g==="18")return "18+";
  if(g==="J")return "Junior";if(g==="I")return "Intermediate";if(g==="S")return "Senior";
  if(g==="O")return "Open";return g;
}
function sexName(x){return x==="F"?"Girls":x==="M"?"Boys":""}
function houseName(c){const h=HOUSES.find(h=>h.c===c);return h?h.n:""}
function teamId(h){return "T-"+h}
function evLabel(ev){if(!ev)return "";if(ev.kind!=="field")return ev.name;const n=ev.name;return n[0]+n.slice(1).toLowerCase()}
function groupLabel(ev,x,g){return evLabel(ev)+", "+sexName(x)+" "+grpName(g)}
function groupKey(k,x,g){return k+"|"+x+"|"+g}
function splitKey(key){const [k,x,g]=key.split("|");return {k,x,g}}
function fieldId(key){return key.replace(/[^A-Za-z0-9]/g,"-")}
function groupsOf(ev){return ev.gk==="band"?BANDS:ev.gk==="open"?["O"]:AGE_GROUPS}
function eventCount(ev){return groupsOf(ev).length*2}
function programEvents(cfg){
  const out=[];let no=0;
  for(const ev of eventsOn(cfg))for(const g of groupsOf(ev))for(const x of ["F","M"]){no++;out.push({no,k:ev.k,x,g,key:groupKey(ev.k,x,g),kind:ev.kind})}
  return out;
}
/* new event from the organiser: each age, boys and girls, on, with its time set by the organiser (decision 31) */
function newEvent(events,name,kind){
  const base="x"+name.toLowerCase().replace(/[^a-z0-9]+/g,"");let k=base,n=2;
  while(events.some(e=>e.k===k)){k=base+n;n++}
  return kind==="field"?{k,name,kind,style:"distance",gk:"age",on:true,own:true}:{k,name,kind:"track",run:"lanes",gk:"age",dist:0,on:true,own:true};
}

/* ---- stations: 1 or 2 locations for each field sport (decisions 27 and 30) ---- */
function stationName(ev,n,locs){return locs>1?ev.name+" "+n:ev.name}
function stationsOf(cfg){
  const out=[];
  for(const ev of fieldEvents(cfg)){const c=(cfg.locs||{})[ev.k]||1;const locs=Math.min(2,c);
    for(let i=1;i<=locs;i++)out.push({id:locs>1?ev.k+i:ev.k,k:ev.k,name:stationName(ev,i,locs),locs})}
  return out;
}
function stationIdOf(cfg,code,turn){
  const sport=code.replace(/\d$/,"");const n=+code.slice(sport.length)||(turn%2)+1;
  return ((cfg.locs||{})[sport]||1)>1?sport+n:sport;
}
/* the field groups on the day, from the timetable. An event with no timetable row uses the time the organiser set */
function fieldGroups(cfg){
  const out=[];const seen=new Set();
  (cfg.timetable||DEFAULT_TIMETABLE).forEach((row,block)=>{
    if(!row.f)return;const turns={};
    row.f.forEach((code,i)=>{
      const sport=code.replace(/\d$/,"");const ev=eventOf(cfg,sport);if(!ev||!ev.on)return;
      const t=turns[sport]||0;turns[sport]=t+1;const g=AGES_DOWN[i];const key=groupKey(sport,row.fx,g);
      seen.add(key);out.push({key,id:fieldId(key),k:sport,x:row.fx,g,station:stationIdOf(cfg,code,t),block,at:row.at});
    });
  });
  for(const ev of fieldEvents(cfg))for(const x of ["F","M"])for(const g of AGES_DOWN){
    const key=groupKey(ev.k,x,g);if(seen.has(key))continue;
    const locs=Math.min(2,(cfg.locs||{})[ev.k]||1);
    out.push({key,id:fieldId(key),k:ev.k,x,g,station:locs>1?ev.k+1:ev.k,block:null,at:ev.at||"Set a time"});
  }
  return out;
}

/* ---- times are whole hundredths ---- */
function parseTime(raw){
  const d=String(raw||"").replace(/[^0-9]/g,"");
  if(!d)return {err:"Type the time"};
  if(d.length<3)return {err:"Too few digits"};
  if(d.length>6)return {err:"Too many digits"};
  const hh=+d.slice(-2),ss=+d.slice(-4,-2),mm=d.length>4?+d.slice(0,-4):0;
  if(ss>=60)return {err:mm?"Seconds over 59":"Over 60 sec: add minutes"};
  return {cs:mm*6000+ss*100+hh};
}
function fmtTime(cs){
  if(cs==null||!isFinite(cs))return "";
  cs=Math.round(cs);
  const m=Math.floor(cs/6000),s=Math.floor((cs%6000)/100),h=cs%100;
  const hs=String(h).padStart(2,"0");
  return m?m+":"+String(s).padStart(2,"0")+"."+hs:s+"."+hs;
}
function oddTime(k,cs,limits){
  const lim=limits&&limits[k];if(!lim||cs==null)return null;
  if(lim[0]!=null&&cs<lim[0])return "Faster than "+fmtTime(lim[0]);
  if(lim[1]!=null&&cs>lim[1])return "Slower than "+fmtTime(lim[1]);
  return null;
}
/* ---- marks are whole centimetres, typed as digits: 534 is 5.34 m. x is a foul, - a pass ---- */
let MARK_DP=2;
function markCm(v){return /^[0-9]+$/.test(String(v==null?"":v))&&+v>0?+v:0}
/* a tape reading rounds down, never up */
function fmtMark(cm){if(!cm)return "";return MARK_DP===1?(Math.floor(cm/10)/10).toFixed(1):(cm/100).toFixed(2)}
function fmtHeight(cm){return cm?(cm/100).toFixed(2):""}
/* a typed box needs 3 digits or the point: 53 is more likely a slip than 0.53 m, and 0.53 says what it means */
function markOk(raw){const v=String(raw==null?"":raw).trim().toLowerCase();return !v||/^(x|foul|-|p|pass)$/.test(v)||/^\d{3,}$/.test(v)||/^\d*\.\d+$/.test(v)}
function fmtCell(v){if(v==null||v==="")return "";if(v==="x")return "X";if(v==="-")return "Pass";const c=markCm(v);return c?fmtMark(c):String(v)}
function cleanMark(raw){
  const v=String(raw==null?"":raw).trim().toLowerCase();
  if(v==="x"||v==="foul")return "x";if(v==="-"||v==="p"||v==="pass")return "-";
  /* 5.3 typed with the point is 5.30 m */
  if(/^\d*\.\d*$/.test(v)&&v!=="."){return String(Math.round(parseFloat(v)*100))}
  return v.replace(/[^0-9]/g,"").replace(/^0+/,"").slice(0,4);
}

/* ---- one heat: the judge decides the top places; the fastest times go to them in the judge's order ---- */
function noTimeSt(st){return st==="DNS"||st==="DQ"}
function heatEffective(laneTimes,judgeOrder){
  const ok={};
  for(const ln in laneTimes){const v=laneTimes[ln];if(v&&!noTimeSt(v.st)&&v.t!=null)ok[ln]=v.t}
  const res={};const judged=[];
  (judgeOrder||[]).forEach(grp=>grp.forEach(ln=>{ln=String(ln);if(ok[ln]!=null&&!judged.includes(ln))judged.push(ln)}));
  const all=Object.values(ok).sort((a,b)=>a-b);
  const judgedSet=new Set(judged);
  judged.forEach((ln,i)=>{res[ln]=all[i]});
  const rest=Object.keys(ok).filter(ln=>!judgedSet.has(ln)).sort((a,b)=>ok[a]-ok[b]||(+a)-(+b));
  const left=all.slice(judged.length);
  rest.forEach((ln,i)=>{res[ln]=left[i]});
  const out={};
  for(const ln in ok)out[ln]={rec:ok[ln],eff:res[ln],pink:res[ln]!==ok[ln]};
  return out;
}
/* A late slip never overwrites what the Recorder typed: the slip's time is kept beside the lane and the
   Recorder picks. A slip for an earlier run of a re-run race (gen) starts fresh. */
function lateSlip(old,neu){
  if(!old||(old.gen||0)!==(neu.gen||0))return neu;
  const ol=old.lanes||{},nl=neu.lanes||{};const lanes={};let changed=false;
  for(const l of new Set([...Object.keys(ol),...Object.keys(nl)])){
    const o=ol[l],n=nl[l];
    if(o&&(o.src==="typed"||noTimeSt(o.st))){
      lanes[l]=Object.assign({},o);
      if(n&&n.t!=null&&n.t!==o.t)lanes[l].slip=n.t;else delete lanes[l].slip;
    }else if(n){lanes[l]=n;if(!o||o.t!==n.t||o.st!==n.st)changed=true}
    else lanes[l]=o;
  }
  const out=Object.assign({},neu,{lanes});
  if(!changed&&old.checked){out.checked=true;out.checkedAt=old.checkedAt;if(old.checkedBy)out.checkedBy=old.checkedBy}
  return out;
}
/* points for one place, ties split */
function pointsFor(place,size,P){
  const at=i=>i===1?P.p1:i===2?P.p2:i===3?P.p3:P.rest;
  let s=0;for(let i=place;i<place+size;i++)s+=at(i);
  return Math.round(s/size*100)/100;
}
function finishOrderFromTaps(order){
  const out={};let p=1;
  for(const g of order||[]){for(const ln of g)out[String(ln)]=p;p+=g.length}
  return out;
}

/* ---- field events ---- */
function fieldRule(cfg,ev){const base=ev.style==="height"?RULE_HIGH:ev.style==="throw"?RULE_THROW:RULE_DIST;return Object.assign({},base,(cfg.rules||{})[ev.k]||{})}
/* the girls / boys value from one sheet cell: "3 / 5 kg" gives "3 kg" and "5 kg" */
function sheetPair(cell){
  const m=String(cell||"").match(/^\s*([\d.]+)\s*\/\s*([\d.]+)\s*(\S*)\s*$/);
  return m?{F:m[1]+(m[3]?" "+m[3]:""),M:m[2]+(m[3]?" "+m[3]:"")}:{F:String(cell||""),M:String(cell||"")};
}
function sheetOf(cfg){return (cfg&&cfg.sheet)||DEFAULT_SHEET}
function sheetRows(cfg,g){return sheetOf(cfg).filter(r=>g==="13"?r.a==="12"||r.a==="13":g==="18"?r.a==="18+":r.a===g)}
/* the weight for a group; the 12 & 13 group can differ by age (decision 34) */
function weightFor(cfg,k,x,g){
  const rows=sheetRows(cfg,g).filter(r=>r[k]);if(!rows.length)return "";
  const v=rows.map(r=>sheetPair(r[k])[x]);
  return v.every(a=>a===v[0])?v[0]:rows.map((r,i)=>r.a+" years "+v[i]).join(", ");
}
function hjStart(cfg,x,g){const r=sheetRows(cfg,g)[0];return r?Math.round(parseFloat(sheetPair(r.hj)[x])*100)||100:100}
/* the tap order for a high jump box */
function heightSeq(rule){const s=[""];for(let f=0;f<rule.tries;f++)s.push("X".repeat(f)+"O");s.push("X".repeat(rule.tries));if(rule.pass)s.push("-");return s}
function failsIn(v){return (String(v||"").match(/X/g)||[]).length}
/* the bar: the height for each round comes from how many athletes are still in (decision 35).
   Girls 5 cm until 3 remain, then 3 cm. Boys 10 cm first, then 5 cm until 3 remain, then 3 cm.
   Returns the heights so far with some ahead, the current height (null when all are out), and who is left. */
function hjPlan(cfg,ev,rule,x,g,ids,marks){
  const start=hjStart(cfg,x,g);const cell=(id,h)=>((marks[id]||{}).h||{})[h]||"";
  const allOut="X".repeat(rule.tries);
  const isIn=(id,upto)=>!(marks[id]||{}).ns&&!Object.keys((marks[id]||{}).h||{}).some(h=>+h<=upto&&cell(id,h)===allOut);
  const steps=rule.raise[x]||rule.raise.F;
  const raiseAt=(n,left)=>left<=rule.lastLeft?rule.lastRaise:steps[Math.min(n,steps.length-1)];
  /* boxes already filled show where the bar really went, so a late athlete or a corrected box never moves it */
  const typed=[...new Set(ids.flatMap(id=>Object.keys((marks[id]||{}).h||{}).filter(h=>cell(id,h)).map(Number)))].sort((a,b)=>a-b);
  const hs=[start];let cur=start,raises=0;
  for(let i=0;i<80;i++){
    const h=hs[hs.length-1];const still=ids.filter(id=>isIn(id,h-1));
    const above=typed.find(t=>t>h);
    if(above!=null){hs.push(above);raises++;continue}
    /* above the start, someone with no boxes yet is a late arrival and does not hold up the round */
    const wait=h===start?still:still.filter(id=>Object.values((marks[id]||{}).h||{}).some(Boolean));
    const done=wait.length>0&&wait.every(id=>{const v=cell(id,h);return /O$/.test(v)||v==="-"||v===allOut});
    if(!done){cur=still.length||!ids.length?h:null;break}
    const left=still.filter(id=>isIn(id,h)).length;
    if(!left){cur=null;break}
    hs.push(h+raiseAt(raises,left));raises++;
  }
  const left=ids.filter(id=>isIn(id,9999)).length;
  while(hs.length<7){hs.push(hs[hs.length-1]+raiseAt(raises,left||99));raises++}
  /* a box typed on a height that later moved is never lost: it keeps its own column */
  const extra=new Set(hs);
  for(const id of ids)for(const h in ((marks[id]||{}).h||{}))if(cell(id,h))extra.add(+h);
  return {start,heights:[...extra].sort((a,b)=>a-b),cur,left,out:ids.length-left,isIn};
}
function fieldRow(ev,rule,m){
  /* one athlete's best mark and what a tie needs */
  m=m||{};const out={ns:!!m.ns,best:0,bestAt:0,tries:[],fails:0,failsAtBest:0,noMeasure:false};
  if(m.ns)return out;
  if(ev.style==="height"){
    const hs=Object.keys(m.h||{}).map(Number).sort((a,b)=>a-b);
    for(const h of hs){const v=m.h[h];if(/O$/.test(v||"")){out.best=h;out.failsAtBest=failsIn(v)}}
    for(const h of hs)if(h<=out.best)out.fails+=failsIn(m.h[h]);
    return out;
  }
  if(ev.style==="throw"){
    /* only the best throw is measured, once, at the end (decision 34) */
    const fair=Object.values(m.t||{}).includes("Fair");
    out.best=fair?markCm(m.best):0;out.noMeasure=fair&&!out.best;
    if(out.best)out.tries=[out.best];
    return out;
  }
  const a=m.a||{};
  for(let i=0;i<rule.attempts;i++){const c=markCm(a[i]);if(c)out.tries.push(c);if(c>out.best){out.best=c;out.bestAt=i+1}}
  out.tries.sort((x,y)=>y-x);
  return out;
}
/* who is up and who is next, in arrival order (decision 32). rows are in arrival order.
   Short long jump (decision 33): 2 jumps each, then only the top 4 get a 3rd */
function bestOfTwo(r){const a=r.m.a||{};return Math.max(markCm(a[0]),markCm(a[1]))}
function thirdJump(rows,rule,short){
  if(!short)return null;
  /* the cut comes once everyone has had their 2 jumps */
  if(rows.some(r=>!r.m.ns&&!((r.m.a||{})[0]&&(r.m.a||{})[1])))return null;
  const two=rows.filter(r=>!r.m.ns).map(bestOfTwo).filter(Boolean).sort((a,b)=>b-a);
  const cut=two[Math.min(rule.shortTop-1,two.length-1)]||0;
  return new Set(rows.filter(r=>!r.m.ns&&cut&&bestOfTwo(r)>=cut).map(r=>r.id));
}
function fieldTurn(ev,rule,rows,short,plan){
  if(!rows.length)return {up:-1,next:-1,third:null};
  if(ev.style==="height"){
    const wait=rows.map((r,i)=>i).filter(i=>{const r=rows[i];if(plan.cur==null||!plan.isIn(r.id,plan.cur-1))return false;const v=(r.m.h||{})[plan.cur]||"";return !(/O$/.test(v)||v==="-"||/^X+$/.test(v)&&failsIn(v)>=rule.tries)});
    return {up:wait.length?wait[0]:-1,next:wait.length>1?wait[1]:-1,third:null};
  }
  const third=ev.style==="distance"?thirdJump(rows,rule,short):null;
  const box=ev.style==="throw"?"t":"a";
  const used=rows.map(r=>{
    if(r.m.ns)return 99;
    let n=0;for(let i=0;i<rule.attempts;i++)if((r.m[box]||{})[i])n++;
    if(third&&!third.has(r.id)&&!(r.m.a||{})[2])n++;
    return n});
  const round=Math.min(...used);
  if(round>=rule.attempts)return {up:-1,next:-1,third};
  const up=used.indexOf(round);let next=used.indexOf(round,up+1);
  if(next<0)next=used.findIndex((n,i)=>i!==up&&n<rule.attempts);
  return {up,next,third};
}
function fieldCompare(ev,rule,a,b){
  /* negative when a is ahead of b; 0 is a tie */
  if(a.best!==b.best)return b.best-a.best;
  if(rule.ties!=="countback")return 0;
  if(ev.style==="height")return (a.failsAtBest-b.failsAtBest)||(a.fails-b.fails);
  for(let i=0;i<Math.max(a.tries.length,b.tries.length);i++){const d=(b.tries[i]||0)-(a.tries[i]||0);if(d)return d}
  return 0;
}
function rankField(ev,rule,rows,P){
  /* everyone with a valid mark gets points; no valid mark gets 0 (decision 17) */
  const ok=rows.filter(r=>r.best>0).sort((a,b)=>fieldCompare(ev,rule,a,b));
  let i=0;
  while(i<ok.length){
    let j=i+1;while(j<ok.length&&fieldCompare(ev,rule,ok[i],ok[j])===0)j++;
    const size=j-i;const pts=pointsFor(i+1,size,P);
    for(let n=i;n<j;n++){ok[n].place=i+1;ok[n].pts=pts;ok[n].tie=size>1}
    i=j;
  }
  return [...ok,...rows.filter(r=>!r.best)];
}

/* ---- everything worked out from the stored records ---- */
function compute(S){
  const cfg=Object.assign({},DEFAULT_CONFIG,S.config||{});
  MARK_DP=cfg.markDp===1?1:2;
  const P=Object.assign({},DEFAULT_CONFIG.points,cfg.points||{});
  const PR=Object.assign({},DEFAULT_CONFIG.relayPoints,cfg.relayPoints||{});
  const open=Object.assign({},DEFAULT_CONFIG.open,cfg.open||{});
  const people=new Map();
  for(const st of (S.students||[]))people.set(st.id,st);
  const who=id=>{
    if(!id)return null;
    if(TEAMS.includes(id)){const h=id[2];return {id,s:houseName(h),f:"",h,team:true,name:houseName(h)}}
    const st=people.get(id);
    if(!st)return {id,s:"Unknown athlete",f:"",h:"",name:"Unknown athlete"};
    return Object.assign({name:st.f+" "+st.s},st);
  };
  const events=programEvents(cfg);
  const evByKey=new Map(events.map(e=>[e.key,e]));
  const heats=[...(S.heats||[])].sort((a,b)=>a.race-b.race);
  const races=new Map();const groups=new Map();
  const ensure=(key,ev)=>{
    if(!groups.has(key)){const {k,x,g}=splitKey(key);groups.set(key,{key,k,x,g,ev,field:ev.kind==="field",label:groupLabel(ev,x,g),heats:[],rows:[],status:"none",checkedAt:0})}
    return groups.get(key);
  };
  for(const h of heats){
    const ev=eventOf(cfg,h.k);if(!ev||!ev.on)continue;
    const key=groupKey(h.k,h.x,h.g);
    const id="r"+String(h.race).padStart(4,"0");
    /* a re-run race keeps its number: times and places from an earlier run (an older gen) no longer count */
    const gen=h.gen||0;const cur=d=>d&&(d.gen||0)===gen?d:null;
    const T=cur((S.times||{})[id])||{};
    const F=cur((S.finish||{})[id])||{};
    const slip=cur(S.slips&&S.slips[id]);
    const lanes=h.lanes||{};const multi=!!h.multi;
    const filled=h.cancelled?[]:Object.keys(lanes).filter(l=>lanes[l]).sort((a,b)=>a-b);
    const lt=T.lanes||{};
    const ltIn={};for(const l of filled)if(lt[l])ltIn[l]=lt[l];
    const eff=heatEffective(ltIn,multi?[]:(F.order||[]).map(g=>g.filter(l=>lanes[l])).filter(g=>g.length));
    /* 800 m and 1500 m: a marshalled runner with no time gets 1 second more than the place before,
       in list order, so they still get points (decision 20) */
    if(multi&&T.src==="multi"){
      let last=Math.max(0,...Object.values(eff).map(e=>e.eff));
      for(const l of filled){const v=lt[l];if(v&&(v.t!=null||noTimeSt(v.st)))continue;last+=100;eff[l]={rec:null,eff:last,pink:false,auto:true}}
    }
    const extra=Object.keys(lt).filter(l=>!lanes[l]&&lt[l]&&lt[l].t!=null&&!noTimeSt(lt[l].st)).map(Number).sort((a,b)=>a-b);
    const placeTaps=multi?{}:finishOrderFromTaps(F.order);
    const nTimes=filled.filter(l=>(lt[l]&&(lt[l].t!=null||noTimeSt(lt[l].st)))||(eff[l]&&eff[l].auto)).length;
    const nOk=filled.filter(l=>eff[l]).length;
    const flagged=filled.filter(l=>{const v=lt[l];return v&&v.t!=null&&!noTimeSt(v.st)&&!v.keep&&(oddTime(h.k,v.t,cfg.limits)||v.chk)}).length;
    const differs=filled.filter(l=>lt[l]&&lt[l].slip!=null&&lt[l].slip!==lt[l].t).map(Number);
    const need=Math.min(4,filled.length);
    const tapped=Object.keys(placeTaps).filter(l=>lanes[l]).length;
    const checked=!!T.checked&&!(h.edited&&T.checkedAt&&h.edited>T.checkedAt-120000)&&!(F.ck&&T.checkedAt&&F.ck>=T.checkedAt);
    const allIn=filled.length>0&&nTimes===filled.length;
    const placesIn=multi||!!F.ok||tapped>=Math.min(4,nOk);
    const done=!h.cancelled&&!differs.length&&allIn&&(placesIn||checked);
    let tstatus=multi?"Waiting for multitimer":"Waiting for slip";
    if(h.cancelled)tstatus="Cancelled";
    else if(nTimes)tstatus=checked?"Checked":"To check";
    const doneAt=Math.max(h.at||0,T.at||0,T.checkedAt||0,F.at||0,(slip&&slip.at)||0);
    const r={race:h.race,heat:h.heat,k:h.k,x:h.x,g:h.g,key,ev,label:groupLabel(ev,h.x,h.g),lanes,filled,times:lt,eff,placeTaps,multi,
      tstatus,checked,checkedAt:T.checkedAt||0,nTimes,nOk,flagged,need,tapped,placesIn,allIn,done,doneAt,differs,extra,src:T.src||null,hasSlip:!!slip,
      gen,T,F,slip,cancelled:!!h.cancelled};
    races.set(h.race,r);
    if(h.cancelled)continue;
    ensure(key,ev).heats.push(r);
  }
  for(const G of groups.values()){
    const relay=!!G.ev.relay;const Q=relay?PR:P;const rows=[];
    for(const r of G.heats)for(const ln of r.filled){
      const v=r.times[ln]||{};const e=r.eff[ln];
      rows.push({id:r.lanes[ln],p:who(r.lanes[ln]),race:r.race,heat:r.heat,lane:+ln,st:v.st||(v.t!=null||e?"ok":"wait"),rec:v.t!=null?v.t:null,eff:e?e.eff:null,pink:!!(e&&e.pink),auto:!!(e&&e.auto),judge:r.placeTaps[ln]||v.o||null,place:null,pts:0});
    }
    const ok=rows.filter(x=>x.eff!=null&&!noTimeSt(x.st)).sort((a,b)=>a.eff-b.eff);
    let i=0;
    while(i<ok.length){
      let j=i;while(j<ok.length&&ok[j].eff===ok[i].eff)j++;
      /* equal times: inside one heat the Place Judge's order splits them; across heats they share the
         place and the points (decision 26) */
      const blk=ok.slice(i,j);const jp=x=>x.judge||99;
      const rank=new Map(blk.map(x=>[x,1+blk.filter(y=>y.race===x.race&&jp(y)<jp(x)).length]));
      blk.sort((a,b)=>rank.get(a)-rank.get(b));
      let q=0;
      while(q<blk.length){
        let e=q;while(e<blk.length&&rank.get(blk[e])===rank.get(blk[q]))e++;
        const size=e-q;const pts=pointsFor(i+q+1,size,Q);
        for(let n=q;n<e;n++){blk[n].place=i+q+1;blk[n].pts=pts;blk[n].tie=size>1}
        q=e;
      }
      ok.splice(i,j-i,...blk);i=j;
    }
    const others=rows.filter(x=>!ok.includes(x)).sort((a,b)=>(a.st==="wait")-(b.st==="wait")||a.race-b.race||a.lane-b.lane);
    G.rows=[...ok,...others];
    G.allChecked=G.heats.length>0&&G.heats.every(h=>h.checked);
    G.allDone=G.heats.length>0&&G.heats.every(h=>h.done);
    G.open=!!(S.openGroups&&S.openGroups.has(G.key));
    G.final=G.allDone&&!G.open;
    G.status=G.final?"Final":"Provisional";
    G.checkedAt=Math.max(0,...G.heats.map(h=>h.doneAt||0));
    G.raceNos=G.heats.map(h=>h.race);
  }
  /* field groups: final at the station; the organiser can overrule any time (decision 23) */
  const fgroups=fieldGroups(cfg);
  for(const fg of fgroups){
    const ev=eventOf(cfg,fg.k);const doc=(S.field||{})[fg.id];if(!doc)continue;
    const rule=fieldRule(cfg,ev);const marks=doc.marks||{};
    /* an athlete taken off keeps a negative time, so nobody else's number changes */
    const everyone=Object.keys(doc.ath||{}).sort((a,b)=>Math.abs(doc.ath[a])-Math.abs(doc.ath[b])||a.localeCompare(b));
    const ids=everyone.filter(id=>doc.ath[id]>0);
    if(!ids.length&&!doc.final)continue;
    const rows=ids.map(id=>Object.assign({id,no:everyone.indexOf(id)+1,p:who(id),m:marks[id]||{},place:null,pts:0,st:(marks[id]||{}).ns?"NS":"ok"},fieldRow(ev,rule,marks[id])));
    const G=ensure(fg.key,ev);
    G.arrival=rows.slice();G.plan=ev.style==="height"?hjPlan(cfg,ev,rule,fg.x,fg.g,ids,marks):null;
    G.turn=fieldTurn(ev,rule,rows,!!doc.short,G.plan);
    G.rows=rankField(ev,rule,rows,P);G.rule=rule;G.fg=fg;G.doc=doc;
    G.final=!!doc.final;G.status=G.final?"Final":"Provisional";G.checkedAt=doc.finalAt||0;G.raceNos=[];
  }
  /* records: lower wins on the track, higher in the field */
  const recByKey=new Map((S.records||[]).map(rc=>[rc.key,rc]));
  const broken=[];
  for(const G of groups.values()){
    const old=recByKey.get(G.key);G.record=old||null;G.recordNote=null;
    if(!old||G.ev.relay)continue;
    const best=G.rows.filter(r=>r.place===1);if(!best.length)continue;
    const v=G.field?best[0].best:best[0].eff;
    const better=G.field?v>old.v:v<old.v;
    if(better){best.forEach(r=>r.tag="NEW RECORD");G.recordNote={kind:"new",rows:best,old};broken.push(G)}
    else if(v===old.v){best.forEach(r=>r.tag="EQUALS RECORD");G.recordNote={kind:"equal",rows:best,old};broken.push(G)}
  }
  /* HRIS Team List: the top 2 in every individual event, field events included. No relays (decisions 18, 24) */
  for(const G of groups.values()){if(G.ev.relay)continue;G.rows.forEach(r=>{if(r.place&&r.place<=2)r.hris=true})}
  const notRun=new Set(cfg.notRun||[]);
  const isFinal=key=>{const G=groups.get(key);return G?G.final:notRun.has(key)};
  /* houses and champions */
  const house={};for(const h of HOUSES)house[h.c]={c:h.c,n:h.n,byAge:Object.fromEntries(AGE_GROUPS.map(a=>[a,0])),relay:0,track:0,fieldPts:0,total:0};
  const champ={};
  const counts=(G,what)=>G.ev.gk!=="open"||!!open[what];
  for(const G of groups.values()){
    for(const r of G.rows){
      if(!r.pts||!r.p||!house[r.p.h])continue;
      if(G.ev.relay){house[r.p.h].relay+=r.pts;continue}
      const ag=r.p.g||G.g;const ax=r.p.x||G.x;
      if(counts(G,"house")){
        if(house[r.p.h].byAge[ag]!=null)house[r.p.h].byAge[ag]+=r.pts;
        if(G.field)house[r.p.h].fieldPts+=r.pts;else house[r.p.h].track+=r.pts;
      }
      /* age champion: only 1st, 2nd and 3rd place points count; relays do not (decision 5) */
      if(r.place&&r.place<=3&&counts(G,"champ")){const ck=ag+"|"+ax;(champ[ck]=champ[ck]||{}),(champ[ck][r.id]=(champ[ck][r.id]||0)+r.pts)}
    }
  }
  for(const h of Object.values(house)){h.track=Math.round(h.track*100)/100;h.fieldPts=Math.round(h.fieldPts*100)/100;h.total=Math.round((h.track+h.fieldPts+h.relay)*100)/100}
  const houseRank=Object.values(house).sort((a,b)=>b.total-a.total);
  const champs={};
  for(const ag of AGE_GROUPS)for(const x of ["F","M"]){
    const ck=ag+"|"+x;const m=champ[ck]||{};
    const list=Object.entries(m).map(([id,pts])=>({id,pts,p:who(id)})).sort((a,b)=>b.pts-a.pts);
    const top=list.length?list[0].pts:null;
    const winners=list.filter(r=>r.pts===top);
    /* joint champions: no runner up beside them (decision 15) */
    const second=winners.length>1?null:list.find(r=>r.pts<top);
    const runners=second?list.filter(r=>r.pts===second.pts):[];
    const counting=events.filter(e=>e.x===x&&e.g===ag);
    champs[ck]={winners,runners,done:counting.filter(e=>isFinal(e.key)).length,of:counting.length};
  }
  const finalCount=events.filter(e=>isFinal(e.key)).length;
  const maxRace=heats.length?heats[heats.length-1].race:0;
  return {cfg,P,PR,events,evByKey,groups,races,heats,house,houseRank,champs,broken,finalCount,maxRace,who,isFinal,notRun,fgroups,stations:stationsOf(cfg)};
}
/* the block the day is up to: the first timetable row with a field group not final, for the Recorder and Announcer */
function blockNow(R){
  const g=R.fgroups.filter(f=>f.block!=null&&!R.isFinal(f.key));
  return g.length?Math.min(...g.map(f=>f.block)):null;
}
/* the result shown for an athlete: a time or a mark */
function resultText(G,r){if(G.field)return r.best?(G.ev.style==="height"?fmtHeight(r.best):fmtMark(r.best))+" m":"";return fmtTime(r.eff)}
function hrisList(R){
  const out=[];
  for(const e of R.events){
    const G=R.groups.get(e.key);if(!G||G.ev.relay)continue;
    for(const r of G.rows)if(r.hris)out.push({key:G.key,label:G.label,place:r.place,id:r.id,p:r.p,val:resultText(G,r),final:G.final});
  }
  return out;
}

/* ---- students: paste or CSV with DOB gives the age group; the DOB is never kept ---- */
function ageOn(dobIso,onIso){
  const b=new Date(dobIso+"T00:00:00"),c=new Date(onIso+"T00:00:00");
  if(isNaN(b)||isNaN(c))return null;
  let a=c.getFullYear()-b.getFullYear();
  if(c.getMonth()<b.getMonth()||(c.getMonth()===b.getMonth()&&c.getDate()<b.getDate()))a--;
  return a;
}
function ageGroup(a){if(a==null)return null;if(a<=13)return "13";if(a>=18)return "18";return String(a)}
function parseDob(v){
  v=String(v||"").trim();if(!v)return null;
  if(/^\d{5}(\.\d+)?$/.test(v)){const d=new Date(Math.round((Number(v)-25569)*864e5));return isNaN(d)?null:d.toISOString().slice(0,10)}
  let m=v.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if(m)return ymd(+m[1],+m[2],+m[3]);
  m=v.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/);
  if(m){let y=+m[3];if(y<100)y+=y>40?1900:2000;return ymd(y,+m[2],+m[1])}
  return null;
}
function ymd(y,m,d){if(m<1||m>12||d<1||d>31)return null;return y+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0")}
function splitRow(line){
  if(line.includes("\t"))return line.split("\t");
  const out=[];let cur="",q=false;
  for(let i=0;i<line.length;i++){const c=line[i];
    if(q){if(c==='"'){if(line[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c}
    else if(c==='"')q=true;else if(c===","){out.push(cur);cur=""}else cur+=c}
  out.push(cur);return out;
}
function tidyName(s){return String(s).trim().replace(/\s+/g," ")}
function parseStudents(text,ageDate){
  const lines=String(text||"").split(/\r?\n/).filter(l=>l.trim());
  const ok=[],bad=[];const seen=new Map();
  lines.forEach((line,i)=>{
    if(i===0&&/surname|last\s*name/i.test(line))return;
    const c=splitRow(line).map(s=>s.trim());
    const [s,f,h,x,d]=c;
    const row={n:i+1,s:s||"",f:f||"",h:(h||"").toUpperCase().slice(0,1),x:(x||"").toUpperCase().slice(0,1),dob:d||""};
    const probs=[];
    if(!row.s||!row.f)probs.push("Name missing. Add it.");
    if(!["B","J","N"].includes(row.h))probs.push("No house. Pick one.");
    if(!["F","M"].includes(row.x))probs.push("Sex not M or F. Fix it.");
    const iso=parseDob(row.dob);const a=iso?ageOn(iso,ageDate):null;
    if(a==null)probs.push("Date of birth not clear. Fix it.");
    if(probs.length){bad.push({row,probs});return}
    const base=(row.s+"-"+row.f).toLowerCase().replace(/[^a-z0-9]+/g,"-");
    const n=(seen.get(base)||0)+1;seen.set(base,n);
    ok.push({id:"s-"+base+"-"+n,s:tidyName(row.s),f:tidyName(row.f),h:row.h,x:row.x,g:ageGroup(a)});
  });
  return {ok,bad};
}
/* records list rows: Event, Sex, Group, Result, Holder, House, Year */
function parseRecordRows(text,cfg){
  const out=[];const bad=[];
  String(text||"").split(/\r?\n/).filter(l=>l.trim()).forEach((line,i)=>{
    const c=splitRow(line).map(s=>s.trim());if(i===0&&/event/i.test(c[0])&&/sex/i.test(c[1]||""))return;
    const ev=eventsOf(cfg).find(e=>e.name.toLowerCase()===String(c[0]).toLowerCase());
    const x=String(c[1]||"").toUpperCase().slice(0,1);
    let g=String(c[2]||"").replace(/\s*&\s*(under|13)|\+/gi,"").trim();
    if(g==="12")g="13";const gm={junior:"J",intermediate:"I",senior:"S",open:"O"};g=gm[g.toLowerCase()]||g;
    const v=!ev?null:ev.kind==="field"?markCm(cleanMark(c[3])):parseTime(c[3]).cs;
    if(!ev||!["F","M"].includes(x)||!groupsOf(ev).includes(g)||!v){bad.push(i+1);return}
    out.push({key:groupKey(ev.k,x,g),v,holders:[{n:c[4]||"",h:(c[5]||"").toUpperCase().slice(0,1),y:c[6]||""}]});
  });
  return {out,bad};
}
if(typeof module!=="undefined")module.exports={AGE_GROUPS,AGES_DOWN,HOUSES,TEAMS,DEFAULT_EVENTS,DEFAULT_TIMETABLE,DEFAULT_CONFIG,RULE_DIST,RULE_THROW,RULE_HIGH,
  eventOf,programEvents,newEvent,stationsOf,fieldGroups,fieldId,fieldRule,heightSeq,hjPlan,hjStart,weightFor,fieldTurn,thirdJump,sheetPair,groupKey,groupLabel,grpName,teamId,
  parseTime,fmtTime,oddTime,markCm,markOk,fmtMark,fmtCell,cleanMark,heatEffective,lateSlip,pointsFor,compute,blockNow,hrisList,resultText,
  parseStudents,parseRecordRows,ageOn,ageGroup};
