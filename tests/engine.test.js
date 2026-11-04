/* Engine tests. Run: node tests/engine.test.js */
const assert=require("assert");
const E=require("../js/engine.js");
const {compute,groupKey,DEFAULT_CONFIG}=E;
let n=0,fail=0;
function t(name,fn){n++;try{fn();}catch(e){fail++;console.log("FAIL",name,"\n  ",e.message)}}
const eq=assert.deepStrictEqual;
const st=(id,h,x,g)=>({id,s:id,f:"T",h,x,g});
const cfgWith=o=>Object.assign({},DEFAULT_CONFIG,o);
/* a heat with times by lane and a judge order */
function run(S,race,k,x,g,heat,lanes,times,order,extra){
  S.heats=S.heats||[];S.times=S.times||{};S.finish=S.finish||{};
  S.heats.push(Object.assign({race,k,x,g,heat,lanes},extra||{}));
  const id="r"+String(race).padStart(4,"0");
  const L={};for(const l in times)L[l]=typeof times[l]==="object"?times[l]:{t:times[l],st:"ok",src:"photo"};
  S.times[id]={lanes:L,src:extra&&extra.multi?"multi":"photo"};
  S.finish[id]={order:(order||[]).map(l=>[l]),ok:true};
}
function fieldDoc(S,k,x,g,marks,final){
  S.field=S.field||{};const ath={};Object.keys(marks).forEach((id,i)=>ath[id]=i+1);
  S.field[E.fieldId(groupKey(k,x,g))]={ath,marks,final:!!final,finalAt:final?5:0};
}

/* ---- the program (2.1, decisions 2, 27, 30, 31) ---- */
t("default program is 104 events: 56 track and 48 field",()=>{
  const ev=E.programEvents(DEFAULT_CONFIG);eq(ev.length,104);
  eq(ev.filter(e=>e.kind==="track").length,56);eq(ev.filter(e=>e.kind==="field").length,48);
});
t("Javelin is built in and off",()=>{
  eq(E.eventOf(DEFAULT_CONFIG,"J").on,false);
  const events=DEFAULT_CONFIG.events.map(e=>e.k==="J"?Object.assign({},e,{on:true}):e);
  eq(E.programEvents(cfgWith({events})).length,116);
});
t("adding an event gives each age, boys and girls; removing it takes them away",()=>{
  const ev=E.newEvent(DEFAULT_CONFIG.events,"Triple Jump","field");
  eq(ev.gk,"age");eq(ev.own,true);
  const events=DEFAULT_CONFIG.events.concat([ev]);
  eq(E.programEvents(cfgWith({events})).length,116);
  const tr=E.newEvent(events,"Triple Jump","track");assert.notStrictEqual(tr.k,ev.k);eq(tr.run,"lanes");
  eq(E.programEvents(cfgWith({events:events.filter(e=>e.k!==ev.k)})).length,104);
});
t("an event turned off is hidden from the program",()=>{
  const events=DEFAULT_CONFIG.events.map(e=>e.k==="D"?Object.assign({},e,{on:false}):e);
  const c=cfgWith({events});eq(E.programEvents(c).length,92);
  assert(!E.stationsOf(c).some(s=>s.k==="D"));assert(!E.fieldGroups(c).some(f=>f.k==="D"));
});
t("7 stations for 2027",()=>{
  eq(E.stationsOf(DEFAULT_CONFIG).map(s=>s.name),["High Jump 1","High Jump 2","Long Jump 1","Long Jump 2","Shot Put","Discus 1","Discus 2"]);
});
t("the stations list follows the ticks",()=>{
  const c=cfgWith({locs:{HJ:1,LJ:2,SP:2,D:2,J:1}});
  eq(E.stationsOf(c).map(s=>s.id),["HJ","LJ1","LJ2","SP1","SP2","D1","D2"]);
  assert(E.fieldGroups(c).every(f=>E.stationsOf(c).some(s=>s.id===f.station)));
});
t("timetable has 48 field groups, each sex and age doing each sport once, 6 in a block",()=>{
  const g=E.fieldGroups(DEFAULT_CONFIG);eq(g.length,48);eq(new Set(g.map(f=>f.key)).size,48);
  const byBlock={};g.forEach(f=>byBlock[f.block]=(byBlock[f.block]||0)+1);
  assert(Object.values(byBlock).every(v=>v===6));eq(Object.keys(byBlock).length,8);
});
t("Shot Put has two groups at once in four blocks",()=>{
  const g=E.fieldGroups(DEFAULT_CONFIG).filter(f=>f.station==="SP");const by={};g.forEach(f=>(by[f.at]=by[f.at]||[]).push(f.g));
  eq(Object.keys(by).filter(a=>by[a].length===2).sort(),["10:40 am","11:10 am","11:40 am","12:10 pm"].sort());
});
t("a turned-on sport with no timetable row waits for a time",()=>{
  const events=DEFAULT_CONFIG.events.map(e=>e.k==="J"?Object.assign({},e,{on:true}):e);
  const g=E.fieldGroups(cfgWith({events})).filter(f=>f.k==="J");
  eq(g.length,12);assert(g.every(f=>f.block===null&&f.at==="Set a time"&&f.station==="J"));
});

/* ---- track ---- */
t("times parse and print",()=>{
  eq(E.parseTime("1284").cs,1284);eq(E.parseTime("10234").cs,6234);eq(E.fmtTime(1284),"12.84");eq(E.fmtTime(6234),"1:02.34");
  assert(E.parseTime("7512").err);assert(E.parseTime("12").err);
});
t("heats run as finals: the fastest time over all heats wins, points 10 8 6 4 4",()=>{
  const S={students:["a","b","c","d","e"].map(i=>st(i,"B","M","18"))};
  run(S,1,"100","M","18",1,{1:"a",2:"b"},{1:1300,2:1250},[2,1]);
  run(S,2,"100","M","18",2,{1:"c",2:"d",3:"e"},{1:1200,2:1400,3:1500},[1,2,3]);
  const R=compute(S);const G=R.groups.get(groupKey("100","M","18"));
  eq(G.rows.map(r=>[r.id,r.place,r.pts]),[["c",1,10],["b",2,8],["a",3,6],["d",4,4],["e",5,4]]);
  assert(G.rows[0].hris&&G.rows[1].hris&&!G.rows[2].hris);eq(G.final,true);
  eq(R.house.B.total,32);eq(R.house.B.track,32);
});
t("the judge's order moves the fastest times to the judged runners (pink)",()=>{
  const e=E.heatEffective({1:{t:1292},5:{t:1291},4:{t:1261}},[[4],[1],[5]]);
  eq(e["1"].eff,1291);eq(e["1"].pink,true);eq(e["5"].eff,1292);eq(e["4"].pink,false);
});
t("equal times in different heats share the place and points (decision 26)",()=>{
  const S={students:["a","b","c"].map(i=>st(i,"J","F","15"))};
  run(S,1,"200","F","15",1,{1:"a"},{1:3000},[1]);
  run(S,2,"200","F","15",2,{1:"b",2:"c"},{1:3000,2:3100},[1,2]);
  const G=compute(S).groups.get(groupKey("200","F","15"));
  eq(G.rows.map(r=>[r.place,r.pts]),[[1,9],[1,9],[3,6]]);
});
t("DNS and DQ get 0 and no place",()=>{
  const S={students:["a","b"].map(i=>st(i,"N","M","14"))};
  run(S,1,"100","M","14",1,{1:"a",2:"b"},{1:{t:1400,st:"DQ"},2:1500},[2]);
  const G=compute(S).groups.get(groupKey("100","M","14"));
  eq(G.rows[0].id,"b");eq(G.rows[0].place,1);eq(G.rows[1].pts,0);eq(G.rows[1].place,null);
});
t("a cancelled race does not count; a re-run race ignores its old times",()=>{
  const S={students:[st("a","B","M","14")]};
  run(S,1,"100","M","14",1,{1:"a"},{1:1400},[1],{cancelled:true});
  eq(compute(S).groups.has(groupKey("100","M","14")),false);
  const S2={students:[st("a","B","M","14")]};
  run(S2,1,"100","M","14",1,{1:"a"},{1:1400},[1],{gen:1});
  const G=compute(S2).groups.get(groupKey("100","M","14"));eq(G.rows[0].eff,null);eq(G.final,false);
});
t("a heat is not final until every lane has a time",()=>{
  const S={students:["a","b"].map(i=>st(i,"B","M","14"))};
  run(S,1,"100","M","14",1,{1:"a",2:"b"},{1:1400},[1]);
  eq(compute(S).groups.get(groupKey("100","M","14")).final,false);
});
t("a marshal still filling a group keeps it provisional",()=>{
  const S={students:[st("a","B","M","14")],openGroups:new Set([groupKey("100","M","14")])};
  run(S,1,"100","M","14",1,{1:"a"},{1:1400},[1]);
  eq(compute(S).groups.get(groupKey("100","M","14")).final,false);
});
t("a late slip keeps a typed time and shows the difference",()=>{
  const o=E.lateSlip({lanes:{1:{t:1300,st:"ok",src:"typed"}},checked:false},{lanes:{1:{t:1311,st:"ok",src:"photo"}}});
  eq(o.lanes[1].t,1300);eq(o.lanes[1].slip,1311);
});
t("odd-time limits only check what the organiser set",()=>{
  eq(E.oddTime("100",1000,{}),null);assert(E.oddTime("100",900,{100:[1000,2500]}));
});

/* ---- 800 m and 1500 m (decision 20) ---- */
t("a runner with no time gets 1 second more than the place before, in list order, with points",()=>{
  const S={students:["a","b","c","d"].map(i=>st(i,"B","F","16"))};
  run(S,1,"800","F","16",1,{1:"a",2:"b",3:"c",4:"d"},{2:{t:18000,st:"ok",src:"multi"},4:{t:17000,st:"ok",src:"multi"}},[],{multi:true});
  const G=compute(S).groups.get(groupKey("800","F","16"));
  eq(G.rows.map(r=>[r.id,r.eff,r.auto,r.pts]),[["d",17000,false,10],["b",18000,false,8],["a",18100,true,6],["c",18200,true,4]]);
  eq(G.final,true);
});
t("DNS in a multitimer race gets no automatic time",()=>{
  const S={students:["a","b"].map(i=>st(i,"B","F","16"))};
  run(S,1,"800","F","16",1,{1:"a",2:"b"},{1:{t:17000,st:"ok",src:"multi"},2:{st:"DNS"}},[],{multi:true});
  const G=compute(S).groups.get(groupKey("800","F","16"));eq(G.rows[1].eff,null);eq(G.rows[1].pts,0);
});
t("a multitimer race with no names yet is not done",()=>{
  const S={heats:[{race:1,k:"800",x:"F",g:"16",heat:1,multi:true,lanes:{}}]};
  const R=compute(S);eq(R.races.get(1).done,false);eq(R.groups.get(groupKey("800","F","16")).final,false);
});

/* ---- relays (decisions 4, 16, 24) ---- */
t("relays score 20 16 12, go to the house only, not HRIS, not champions",()=>{
  const S={students:[]};
  run(S,1,"R","F","J",1,{3:"T-J",4:"T-B",5:"T-N"},{3:5500,4:5400,5:5600},[4,3,5]);
  const R=compute(S);const G=R.groups.get(groupKey("R","F","J"));
  eq(G.rows.map(r=>[r.p.h,r.pts]),[["B",20],["J",16],["N",12]]);
  assert(!G.rows.some(r=>r.hris));eq(R.house.B.relay,20);eq(R.house.B.total,20);eq(E.hrisList(R).length,0);
  eq(Object.values(R.champs).every(c=>!c.winners.length),true);
});

/* ---- field (decisions 17, 23, placeholders for question 8) ---- */
t("marks: 534 is 5.34 m, x is a foul, - a pass",()=>{
  eq(E.markCm("534"),534);eq(E.markCm("x"),0);eq(E.fmtMark(534),"5.34");eq(E.fmtCell("x"),"X");eq(E.fmtCell("-"),"Pass");
  eq(E.cleanMark("5.34"),"534");eq(E.cleanMark("X"),"x");eq(E.cleanMark("pass"),"-");
});
t("best of the attempts, 10 8 6 then 4 for everyone with a mark, 0 for no mark or no show",()=>{
  const S={students:["a","b","c","d","e","f","g"].map(i=>st(i,"B","M","17"))};
  fieldDoc(S,"LJ","M","17",{a:{a:{0:"534",1:"x",2:"541"}},b:{a:{0:"498",1:"502"}},c:{a:{0:"x",1:"x",2:"x"}},d:{a:{0:"561"}},e:{a:{0:"487",1:"-",2:"492"}},f:{ns:true},g:{a:{0:"515",1:"x"}}},true);
  const R=compute(S);const G=R.groups.get(groupKey("LJ","M","17"));
  eq(G.rows.map(r=>[r.id,r.best,r.place,r.pts]),[["d",561,1,10],["a",541,2,8],["g",515,3,6],["b",502,4,4],["e",492,5,4],["c",0,null,0],["f",0,null,0]]);
  eq(G.rows[1].bestAt,3);eq(G.final,true);
  assert(G.rows[0].hris&&G.rows[1].hris&&!G.rows[2].hris);
  eq(R.house.B.fieldPts,32);
});
t("the attempts setting limits which attempts count",()=>{
  const c=cfgWith({rules:{LJ:{attempts:2}}});
  const S={config:c,students:[st("a","B","M","17")]};
  fieldDoc(S,"LJ","M","17",{a:{a:{0:"400",1:"410",2:"500"}}});
  eq(compute(S).groups.get(groupKey("LJ","M","17")).rows[0].best,410);
});
t("ties share until the rule is set; countback on the next best mark when set",()=>{
  const marks={a:{a:{0:"500",1:"490"}},b:{a:{0:"500",1:"480"}},c:{a:{0:"400"}}};
  const S={students:["a","b","c"].map(i=>st(i,"B","F","15"))};
  fieldDoc(S,"D","F","15",marks);
  eq(compute(S).groups.get(groupKey("D","F","15")).rows.map(r=>[r.place,r.pts]),[[1,9],[1,9],[3,6]]);
  S.config=cfgWith({rules:{D:{ties:"countback"}}});
  eq(compute(S).groups.get(groupKey("D","F","15")).rows.map(r=>[r.id,r.place,r.pts]),[["a",1,10],["b",2,8],["c",3,6]]);
});
t("high jump: best height cleared, heights follow the rule",()=>{
  const rule=E.fieldRule(DEFAULT_CONFIG,E.eventOf(DEFAULT_CONFIG,"HJ"));
  eq(rule.tries,3);eq(E.heightList(rule,{}),[120,125,130,135,140,145]);
  eq(E.heightList(rule,{a:{h:{145:"O"}}}).slice(-1)[0],150);
  eq(E.heightSeq(rule),["","O","XO","XXO","XXX","-"]);
  const S={students:["a","b","c","d"].map(i=>st(i,"J","F","18"))};
  fieldDoc(S,"HJ","F","18",{a:{h:{120:"O",125:"O",130:"XO",135:"XXX"}},b:{h:{120:"-",125:"O",130:"O",135:"XO"}},c:{h:{120:"XXX"}},d:{ns:true}});
  const G=compute(S).groups.get(groupKey("HJ","F","18"));
  eq(G.rows.map(r=>[r.id,r.best,r.place,r.pts]),[["b",135,1,10],["a",130,2,8],["c",0,null,0],["d",0,null,0]]);
});
t("high jump countback: fewer failures at the height, then fewer overall",()=>{
  const m={a:{h:{120:"O",125:"XO"}},b:{h:{120:"XO",125:"O"}},c:{h:{120:"O",125:"O"}}};
  const S={config:cfgWith({rules:{HJ:{ties:"countback"}}}),students:["a","b","c"].map(i=>st(i,"J","F","18"))};
  fieldDoc(S,"HJ","F","18",m);
  eq(compute(S).groups.get(groupKey("HJ","F","18")).rows.map(r=>r.id),["c","b","a"]);
});
t("a group with athletes but no Group finished stays provisional; final counts",()=>{
  const S={students:[st("a","B","M","14")]};fieldDoc(S,"SP","M","14",{a:{a:{0:"700"}}});
  const R=compute(S);eq(R.groups.get(groupKey("SP","M","14")).status,"Provisional");eq(R.finalCount,0);
  S.field[E.fieldId(groupKey("SP","M","14"))].final=true;eq(compute(S).finalCount,1);
});
t("blockNow moves on as groups go final",()=>{
  const S={students:[]};const c=compute(S);eq(E.blockNow(c),1);
  S.field={};for(const f of E.fieldGroups(DEFAULT_CONFIG).filter(f=>f.block===1))S.field[f.id]={ath:{},final:true};
  eq(E.blockNow(compute(S)),2);
});

/* ---- houses and champions (decisions 5, 15) ---- */
t("age champion counts only 1st to 3rd; 4th-and-below points still go to the house",()=>{
  const S={students:["a","b","c","d"].map(i=>st(i,"N","M","15"))};
  run(S,1,"100","M","15",1,{1:"a",2:"b",3:"c",4:"d"},{1:1200,2:1300,3:1400,4:1500},[1,2,3,4]);
  run(S,2,"200","M","15",1,{1:"d",2:"a",3:"b",4:"c"},{1:2500,2:2600,3:2700,4:2800},[1,2,3,4]);
  const R=compute(S);const c=R.champs["15|M"];
  eq(c.winners.map(w=>[w.id,w.pts]),[["a",18]]);eq(c.runners.map(w=>[w.id,w.pts]),[["b",14]]);
  eq(R.house.N.total,56);
});
t("joint champions have no runner up",()=>{
  const S={students:["a","b","c"].map(i=>st(i,"N","F","14"))};
  run(S,1,"100","F","14",1,{1:"a",2:"b",3:"c"},{1:1200,2:1300,3:1400},[1,2,3]);
  run(S,2,"200","F","14",1,{1:"b",2:"a",3:"c"},{1:2500,2:2600,3:2700},[1,2,3]);
  const c=compute(S).champs["14|F"];eq(c.winners.length,2);eq(c.runners.length,0);
});
t("field points count for champions",()=>{
  const S={students:[st("a","B","M","16")]};fieldDoc(S,"LJ","M","16",{a:{a:{0:"500"}}},true);
  eq(compute(S).champs["16|M"].winners[0].pts,10);
});
t("the 1500 m follows the question 14 settings",()=>{
  const mk=open=>{const S={config:cfgWith({open}),students:[st("a","B","F","15")]};run(S,1,"1500","F","O",1,{1:"a"},{1:{t:36000,st:"ok",src:"multi"}},[],{multi:true});return compute(S)};
  let R=mk({house:true,champ:false});eq(R.house.B.total,10);eq(R.house.B.byAge["15"],10);eq(R.champs["15|F"].winners.length,0);
  R=mk({house:false,champ:true});eq(R.house.B.total,0);eq(R.champs["15|F"].winners[0].pts,10);
});
t("every house total adds up by age plus relays",()=>{
  const S={students:["a","b"].map(i=>st(i,"J","M","13"))};
  run(S,1,"100","M","13",1,{1:"a",2:"b"},{1:1500,2:1600},[1,2]);
  run(S,2,"R","M","J",1,{1:"T-J"},{1:6000},[1]);
  const h=compute(S).house.J;eq(h.total,h.byAge["13"]+h.relay);eq(h.total,38);
});
t("HRIS list has the top 2 of each individual event, track and field",()=>{
  const S={students:["a","b","c"].map(i=>st(i,"B","M","18"))};
  run(S,1,"100","M","18",1,{1:"a",2:"b",3:"c"},{1:1200,2:1300,3:1400},[1,2,3]);
  fieldDoc(S,"SP","M","18",{a:{a:{0:"900"}},b:{a:{0:"950"}},c:{a:{0:"800"}}},true);
  const L=E.hrisList(compute(S));eq(L.length,4);eq(L.map(x=>x.val),["12.00","13.00","9.50 m","9.00 m"]);
});
t("records: lower wins on the track, higher in the field, equal is noted",()=>{
  const S={students:["a","b"].map(i=>st(i,"B","M","18")),records:[{key:groupKey("100","M","18"),v:1250,holders:[{n:"X"}]},{key:groupKey("SP","M","18"),v:900,holders:[{n:"Y"}]}]};
  run(S,1,"100","M","18",1,{1:"a"},{1:1200},[1]);
  fieldDoc(S,"SP","M","18",{b:{a:{0:"900"}}},true);
  const R=compute(S);
  eq(R.groups.get(groupKey("100","M","18")).recordNote.kind,"new");
  eq(R.groups.get(groupKey("SP","M","18")).recordNote.kind,"equal");
});
t("records list parses track and field rows",()=>{
  const p=E.parseRecordRows("Event,Sex,Group,Result,Holder,House,Year\n100 m,M,18+,12.10,A B,J,2019\nLong Jump,F,12 & 13,4.55,C D,N,2020\nNope,M,18,1,,,",DEFAULT_CONFIG);
  eq(p.out.map(r=>[r.key,r.v]),[["100|M|18",1210],["LJ|F|13",455]]);eq(p.bad,[4]);
});

/* ---- students: DOB is never kept ---- */
t("age group as at 31 December 2027, and no DOB in the result",()=>{
  const p=E.parseStudents("Surname,Firstname,House,Sex,DOB\nSmith,Amy,B,F,2014-12-31\nJones,Bo,J,M,1/1/2015\nLee,Cy,N,M,2009-06-01\nBad,,X,Z,\n",DEFAULT_CONFIG.ageDate);
  eq(p.ok.map(s=>s.g),["13","13","18"]);eq(p.bad.length,1);
  assert(!JSON.stringify(p.ok).includes("dob"));
});
console.log(`${n-fail} of ${n} engine tests passed`);
process.exit(fail?1:0);
