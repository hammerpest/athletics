"""Lessons from swimming, tried end to end in test mode. Tabs act as separate devices.
Usage: python3 tests/flow.py <page url>"""
import asyncio, sys, json
from playwright.async_api import async_playwright
URL=sys.argv[1]; fails=[]; errs=[]
def ok(name,cond):
    print(("PASS " if cond else "FAIL ")+name)
    if not cond: fails.append(name)
async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(); ctx=await b.new_context(viewport={"width":1180,"height":820},accept_downloads=True)
    async def page(pin):
        p=await ctx.new_page(); p.on("pageerror",lambda e:errs.append(str(e)))
        await p.goto(URL); await p.wait_for_function("!!A.store"); await p.wait_for_timeout(200)
        for k in pin: await p.click(f'.keypad [data-k="{k}"]')
        await p.click('[data-act=pinstart]'); await p.wait_for_timeout(100); return p
    O=await page("9999")
    await O.click('.tile[data-job=organiser]'); await O.click('[data-act=osec][data-v=students]'); await O.click('[data-act=oload]'); await O.click('[data-act=otest]'); await O.click('[data-act=oimport]'); await O.wait_for_timeout(200)
    M=await page("1111"); M2=await page("1111")
    async def sendHeat(p,k,x,g):
        await p.evaluate(f"(async()=>{{const m=A.m;m.k='{k}';m.x='{x}';m.g='{g}';m.phase='lanes';m.heat=heatsSentFor(groupKey(m.k,m.x,m.g))+1;m.lanes={{1:eligible(mEv(),m.x,m.g)[0].id,2:eligible(mEv(),m.x,m.g)[1].id}};m.sent=[];}})()")
    # race numbers: two devices send at once, no repeats and no gaps
    await sendHeat(M,"100","M","18"); await sendHeat(M2,"100","F","18")
    a,b2=await asyncio.gather(M.evaluate("sendHeat()"),M2.evaluate("sendHeat()"))
    await M.wait_for_timeout(200)
    nos=sorted(await M.evaluate("A.heats.map(h=>h.race)"))
    ok("two devices sending at once get 1 and 2",nos==[1,2])
    # set the next number forward only
    await O.click('[data-act=osec][data-v=details]'); await O.fill('#cNext','1'); await O.click('[data-act=onext]'); await O.wait_for_timeout(100)
    ok("next race number will not go back",await O.evaluate("A.counter")==3)
    await O.fill('#cNext','10'); await O.click('[data-act=onext]'); await O.wait_for_timeout(150)
    ok("next race number goes forward",await M.evaluate("A.counter")==10)
    # relief judge opens where the job is up to
    J=await page("2222"); await J.click('[data-act=jtap][data-l="1"]'); await J.click('[data-act=jtap][data-l="2"]'); await J.wait_for_timeout(100)
    J2=await page("2222"); ok("a relief Place Judge opens on the next race",await J2.evaluate("judgeRace().race")==2)
    # a typed time is never overwritten by a late slip
    R=await page("3333"); await R.wait_for_timeout(100)
    await R.evaluate("A.r.race=1;render()"); await R.fill('#t-1-1','1234'); await R.press('#t-1-1','Enter'); await R.wait_for_timeout(150)
    S=await page("4444"); await S.evaluate("A.s.race=1;render()")
    await S.set_input_files('#camin','tests/slip.jpg'); await S.wait_for_timeout(1500)
    t=await R.evaluate("A.times.r0001.lanes[1]")
    ok("a late slip keeps the typed time and shows the difference",t["t"]==1234 and t.get("slip") not in (None,1234))
    # cancel, then re-run with the same number
    await R.evaluate("cancelRace(2,true)"); await R.wait_for_timeout(100); ok("a cancelled race leaves the live list",2 not in await R.evaluate("liveRaces().map(r=>r.race)"))
    await R.evaluate("cancelRace(2,false)"); await R.wait_for_timeout(100)
    await J.evaluate("A.j.race=2;render()"); await J.click('[data-act=jtap][data-l="1"]'); await J.wait_for_timeout(100)
    await R.evaluate("rerunRace(2)"); await R.wait_for_timeout(150)
    ok("a re-run keeps its number and clears its places",await R.evaluate("A.R.races.get(2).tapped")==0)
    # offline: saves wait in a queue, the header says so, and nothing is dropped
    F=await page("6666"); await F.evaluate("A.f.station='LJ1';fOpen(A.R.fgroups.find(f=>f.key==='LJ|M|17').id)"); await F.wait_for_timeout(100)
    await F.evaluate("(async()=>{const f=fieldGroupOpen();const id=eligible(eventOf(A.cfg,'LJ'),'M','17')[0].id;await fieldAdd(f,id);await setMark(f,id,0,'500')})()"); await F.wait_for_timeout(150)
    await F.evaluate("A.store.setOffline(true)")
    await F.evaluate("(async()=>{const f=fieldGroupOpen();const id=fieldView(f).rows[0].id;await setMark(f,id,1,'510');await setMark(f,id,2,'520')})()"); await F.wait_for_timeout(200)
    head=await F.evaluate("document.getElementById('hdr').innerText")
    ok("no signal: the header says changes are waiting","2 changes waiting to send" in head)
    ok("no signal: the other device does not have them yet",not await R.evaluate("Object.keys((Object.values(A.field)[0].marks||{}))[0]&&Object.values(Object.values(A.field)[0].marks)[0].a[1]"))
    await F.reload(); await F.wait_for_function("!!A.store"); await F.wait_for_timeout(300)
    ok("the queue survives a reload",await F.evaluate("A.store.pending()")==2)
    await F.evaluate("A.store.flush()"); await F.wait_for_timeout(400)
    ok("signal back: the queue sends and empties",await F.evaluate("A.store.pending()")==0)
    await R.wait_for_timeout(300)
    ok("signal back: every mark arrived, in order",await R.evaluate("Object.values(Object.values(A.field)[0].marks)[0].a")=={"0":"500","1":"510","2":"520"})
    ok("a reloaded field device reopens its group",await F.evaluate("!!fieldGroupOpen()"))
    # two teachers on one group: different boxes never clash
    F2=await page("6666"); await F2.evaluate("A.f.station='LJ1';fOpen(A.R.fgroups.find(f=>f.key==='LJ|M|17').id)"); await F2.wait_for_timeout(100)
    await F.evaluate("(async()=>{const f=fieldGroupOpen();await fieldAdd(f,eligible(eventOf(A.cfg,'LJ'),'M','17')[1].id)})()"); await F.wait_for_timeout(150)
    # a moment apart: tabs in test mode share a store that is not truly atomic; the server merge at Aths Opt 1.1 must be per box
    await F.evaluate("(()=>{const f=fieldGroupOpen();return setMark(f,fieldView(f).rows[1].id,0,'400')})()"); await F.wait_for_timeout(120)
    await F2.evaluate("(()=>{const f=fieldGroupOpen();return setMark(f,fieldView(f).rows[1].id,1,'410')})()"); await F.wait_for_timeout(250)
    tw=await R.evaluate("Object.values(Object.values(A.field)[0].marks).map(m=>m.a)"); ok("two teachers: both boxes saved",tw[1]=={"0":"400","1":"410"})
    # the phone stays on an athlete, whatever happens to the list (third review)
    ph=await ctx.new_page(); ph.on("pageerror",lambda e:errs.append(str(e))); await ph.set_viewport_size({"width":390,"height":844})
    await ph.goto(URL); await ph.wait_for_function("!!A.store"); await ph.wait_for_timeout(200)
    for k in "6666": await ph.click(f'.keypad [data-k="{k}"]')
    await ph.click('[data-act=pinstart]'); await ph.wait_for_timeout(100)
    await ph.evaluate("A.f.station='LJ2';fOpen(A.R.fgroups.find(f=>f.key==='LJ|M|16').id)"); await ph.wait_for_timeout(100)
    await ph.evaluate("(async()=>{const f=fieldGroupOpen();const l=eligible(eventOf(A.cfg,'LJ'),'M','16');for(let i=0;i<4;i++){await fieldAdd(f,l[i].id);await setMark(f,l[i].id,0,String(500+i*10),true)}})()"); await ph.wait_for_timeout(200)
    rows="fieldView(fieldGroupOpen()).rows"
    who=await ph.evaluate(f"(A.f.i=2,A.f.id=null,render(),{rows}[2].id)"); await ph.wait_for_timeout(80)
    await ph.click('.attcell[data-act=fcell] >> nth=0')
    for k in "555": await ph.click(f'.keypad.fp [data-k="{k}"]')
    await ph.reload(); await ph.wait_for_function("!!A.store"); await ph.wait_for_timeout(300)
    ok("reload in a correction: stays on the same athlete",await ph.evaluate(f"{rows}[A.f.i].id")==who and await ph.evaluate("A.f.typed")=="555")
    await ph.click('[data-act=fsave]'); await ph.wait_for_timeout(200)
    ms=await ph.evaluate(f"{rows}.map(r=>r.m.a[0])")
    ok("reload in a correction: the mark goes to that athlete only",ms==["500","510","555","530"])
    # someone taken off on another device: typed work does not move to the next person
    await ph.evaluate(f"(async()=>{{const f=fieldGroupOpen();const r={rows}[3];A.f.i=3;A.f.id=null;render();await setField(f,r.id,'a',0,'',true);render()}})()"); await ph.wait_for_timeout(120)
    gone=await ph.evaluate(f"{rows}[3].id"); await ph.click('.keypad.fp [data-k="4"]'); await ph.click('.keypad.fp [data-k="4"]'); await ph.click('.keypad.fp [data-k="4"]')
    await ph.evaluate(f"(()=>{{const f=fieldGroupOpen();return A.store.update('field/'+f.id,{{ath:{{'{gone}':-A.field[f.id].ath['{gone}']}}}})}})()"); await ph.wait_for_timeout(250)
    await ph.click('[data-act=fsave]'); await ph.wait_for_timeout(200)
    ok("an athlete taken off: their typed mark lands on nobody",await ph.evaluate(f"{rows}.map(r=>r.m.a[0])")==["500","510","555"] and await ph.evaluate("A.f.typed")=="")
    # taking off and adding back keeps every number
    await ph.evaluate(f"(async()=>{{const f=fieldGroupOpen();const r={rows}[1];await fieldToggle(f,r.id);await fieldToggle(f,r.id)}})()"); await ph.wait_for_timeout(200)
    ok("back on the list with the same number",await ph.evaluate(f"{rows}.map(r=>r.no)")==[1,2,3])
    # typed digits when the group goes final are not saved, and a final group cannot be written from a station
    await ph.click('.keypad.fp [data-k="4"]') if await ph.locator('.keypad.fp [data-k="4"]:not([disabled])').count() else None
    await ph.evaluate("(async()=>{const f=fieldGroupOpen();A.field[f.id].final=true;recompute();render()})()"); await ph.wait_for_timeout(120)
    before=await ph.evaluate(f"JSON.stringify({rows}.map(r=>r.m))")
    await ph.evaluate(f"(async()=>{{const f=fieldGroupOpen();await setField(f,{rows}[0].id,'a',1,'444');await fieldToggle(f,{rows}[0].id)}})()"); await ph.wait_for_timeout(150)
    ok("a station cannot write to a final group",await ph.evaluate(f"JSON.stringify({rows}.map(r=>r.m))")==before and await ph.evaluate("A.f.typed")=="")
    await ph.evaluate("(()=>{const f=fieldGroupOpen();A.field[f.id].final=false;recompute();render()})()"); await ph.close()
    # Recorder override add does not move a station device's open group
    await O.evaluate("A.job='recorder';A.r.tab='field';A.r.ovr=true;A.f.gid='keep';A.r.fkey='LJ|M|17';render()"); await O.wait_for_timeout(100)
    await O.click('[data-act=rfadd]'); await O.wait_for_timeout(80)
    ok("override Add an athlete leaves the station's group alone",await O.evaluate("A.f.gid")=="keep" and await O.locator('.modal h2').count()==1)
    await O.click('.modal [data-act=closemodal]'); await O.evaluate("A.f.gid=null;A.r.ovr=false;A.job='organiser';render()")
    # multitimer survives a reload mid race
    await M.evaluate("(async()=>{const m=A.m;m.k='800';m.x='F';m.g='16';m.phase='start';await marshalGo()})()"); await M.wait_for_timeout(150)
    n=await M.evaluate("A.heats.filter(h=>h.multi)[0].race")
    await S.evaluate(f"A.s.race={n};render()"); await S.wait_for_timeout(100)
    await S.click('.namebtn >> nth=0'); await S.click('.namebtn >> nth=1'); await S.click('[data-act=mtnames]'); await S.wait_for_timeout(100)
    await S.click('[data-act=mtgo]'); await S.wait_for_timeout(60); await S.click('[data-act=mtsplit]'); await S.wait_for_timeout(60)
    await S.reload(); await S.wait_for_function("!!A.store"); await S.wait_for_timeout(200)
    ok("the multitimer keeps its clock and splits through a reload",await S.evaluate("A.mt.phase==='run'&&A.mt.splits.length===1"))
    # backup, clear, restore
    await O.click('[data-act=osec][data-v=export]')
    async with O.expect_download() as d: await O.click('[data-act=obackup]')
    dl=await d.value; path=await dl.path(); bk=json.load(open(path))
    ok("full backup holds races, field results and no date of birth",len(bk["heats"])>=2 and len(bk["field"])==2 and "dob" not in json.dumps(bk).lower())
    async with O.expect_download() as d2: await O.click('[data-act=csv]')
    csv=open(await (await d2.value).path()).read(); ok("results CSV is a real download with field and track rows","Long Jump" in csv and "100 m" in csv)
    await O.click('[data-act=osec][data-v=lock]'); await O.click('[data-act=oclear]'); await O.fill('#opPin','9999'); await O.click('[data-act=oorgpinok]'); await O.wait_for_timeout(800)
    ok("Clear practice data empties races and sets the number to 1",await O.evaluate("A.heats.length===0&&A.counter===1&&Object.keys(A.field).length===0&&A.roster.F.length>0"))
    await O.click('[data-act=osec][data-v=export]'); await O.set_input_files('#oRestore',str(path)); await O.wait_for_timeout(200); await O.fill('#opPin','9999'); await O.click('[data-act=oorgpinok]'); await O.wait_for_timeout(1000)
    ok("Restore puts it all back",await O.evaluate("A.heats.length>=2&&Object.keys(A.field).length===2"))
    # lock stops every job
    await O.evaluate("saveCfg({locked:true})"); await O.wait_for_timeout(200)
    await F.evaluate("(()=>{const f=fieldGroupOpen();return setMark(f,fieldView(f).rows[0].id,0,'999')})()"); await F.wait_for_timeout(150)
    ok("locked results cannot be changed",await R.evaluate("Object.values(Object.values(A.field)[0].marks)[0].a[0]")=="500")
    await b.close()
  print("page errors:",errs); print(f"{len(fails)} failed")
  sys.exit(1 if fails or errs else 0)
asyncio.run(main())
