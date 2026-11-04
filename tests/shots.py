"""Check 1 for Aths Opt builds. Runs the whole carnival once per device size and theme, in test mode, and saves
a screenshot of every screen and state as <screen>-<device>-<theme>.png. Fails on any page error.
Usage: python3 tests/shots.py <page url> <output folder> [device-theme ...]"""
import asyncio, sys, os
from playwright.async_api import async_playwright
URL=sys.argv[1]; OUT=sys.argv[2]
DEVICES={"ipad-land":(1180,820),"ipad-port":(820,1180),"macbook":(1512,982),"phone":(390,844)}
SLIP=os.path.join(os.path.dirname(os.path.abspath(__file__)),"slip.jpg")
# same random numbers and a clock that only moves when the script says, so two runs match
SEED="""(()=>{let s=42;Math.random=()=>{s=(s*16807)%2147483647;return (s-1)/2147483646};
window.__t=Date.UTC(2027,5,17,23,30,0);Date.now=()=>window.__t;})();"""
errs=[]
RECS="100 m,M,18+,12.10,Sam Price,J,2019\\nLong Jump,M,17,5.20,Mia Tran,N,2020"
async def run(pw,dev,theme):
    w,h=DEVICES[dev]; phone=dev=="phone"
    b=await pw.chromium.launch()
    ctx=await b.new_context(viewport={"width":w,"height":h},color_scheme=theme,locale="en-AU",timezone_id="Australia/Sydney",has_touch=phone)
    await ctx.add_init_script(SEED)
    pages=[]
    async def page(pin=None):
        p=await ctx.new_page(); pages.append(p)
        p.on("pageerror",lambda e:errs.append((dev,theme,str(e))))
        p.on("console",lambda m:errs.append((dev,theme,m.text)) if m.type=="error" and "fonts.g" not in m.text and "ERR_" not in m.text else None)
        await p.goto(URL); await p.wait_for_function("!!A.store"); await p.wait_for_timeout(250)
        if pin: await dopin(p,pin)
        return p
    async def dopin(p,c):
        for k in c: await p.click(f'.keypad [data-k="{k}"]')
        await p.click('[data-act=pinstart]'); await p.wait_for_timeout(120)
    async def tick(ms=60000):
        for p in pages: await p.evaluate(f"window.__t+={ms}")
    async def shot(p,name):
        await p.wait_for_timeout(150)
        await p.bringToFront() if False else None
        await p.screenshot(path=os.path.join(OUT,f"{name}-{dev}-{theme}.png"),full_page=True,animations="disabled")
        # no sideways scroll on any screen
        sw=await p.evaluate("[document.documentElement.scrollWidth,innerWidth]")
        if sw[0]>sw[1]: errs.append((dev,theme,f"sideways scroll on {name}: {sw}"))
    # ---- home ----
    O=await page()
    await shot(O,"home-pin")
    await dopin(O,"0000"); await shot(O,"home-wrongpin")
    await dopin(O,"9999"); await shot(O,"home-orgtiles")
    await O.click('.tile[data-job=organiser]')
    await O.click('[data-act=osec][data-v=students]'); await O.click('[data-act=oload]'); await O.click('[data-act=otest]'); await shot(O,"org-students-preview")
    await O.click('[data-act=oimport]'); await O.wait_for_timeout(200)
    for sec in ["details","students","program","field","points","limits","records","export","lock"]:
        await O.click(f'[data-act=osec][data-v={sec}]'); await shot(O,f"org-{sec}")
    await O.click('[data-act=menu]'); await shot(O,"org-jobmenu"); await O.click('[data-act=menu]')
    # program: add, remove, Javelin on and off (decision 31)
    await O.click('[data-act=osec][data-v=program]')
    await O.click('[data-act=oaddstart]'); await O.fill('#oNew','Triple Jump'); await shot(O,"org-program-adding")
    await O.click('[data-act=oaddev]'); await O.wait_for_timeout(200); await shot(O,"org-program-added")
    await O.click('[aria-label="Javelin on the program"]'); await O.wait_for_timeout(200)
    await O.click('[data-act=osec][data-v=field]'); await shot(O,"org-field-javelin")
    await O.click('[data-act=osec][data-v=program]')
    await O.click('[data-act=oevdel]'); await O.wait_for_timeout(150)
    await O.click('[aria-label="Javelin on the program"]'); await O.wait_for_timeout(150)
    assert await O.evaluate("A.R.events.length")==104
    # records list, to show a new record
    await O.click('[data-act=osec][data-v=records]'); await O.click('[data-act=orecload]')
    await O.evaluate(f"document.getElementById('rcPaste').value='{RECS}'")
    await O.click('[data-act=orecpaste]'); await O.wait_for_timeout(150); await shot(O,"org-records-loaded")
    # ---- marshal ----
    M=await page("1111"); await shot(M,"marshal-start")
    await M.click('[data-act=mgo]'); await shot(M,"marshal-notready"); await M.click('[data-act=closemodal]')
    await M.click('[data-act=mpick][data-v="100"]'); await M.click('[data-act=mpick][data-v=M]'); await M.click('[data-act=mpick][data-f=g][data-v="18"]'); await shot(M,"marshal-ready")
    await M.click('[data-act=mgo]'); await shot(M,"marshal-lanes-listopen")
    for i in range(8): await M.click('.picklist button.pick:not([disabled]) >> nth=0')
    await shot(M,"marshal-lanes-full")
    await M.reload(); await M.wait_for_function("!!A.store"); await M.wait_for_timeout(250)
    assert await M.evaluate("Object.keys(A.m.lanes).length")==8   # a half-filled lane list survives a reload
    await M.click('[data-act=mnext]'); await M.wait_for_timeout(200)
    for i in range(3): await M.click('.picklist button.pick:not([disabled]) >> nth=0')
    await M.click('[data-act=mnew]'); await shot(M,"marshal-confirmheat"); await M.click('[data-act=mconfirm]'); await M.wait_for_timeout(200)
    await shot(M,"marshal-sent")
    await M.click('[data-act=menu]'); await shot(M,"marshal-jobmenu"); await M.click('[data-act=menu]')
    # relay, no names
    await M.click('[data-act=mpick][data-f=k][data-v=R]'); await M.click('[data-act=mpick][data-v=F]'); await M.click('[data-act=mpick][data-f=g][data-v=J]'); await shot(M,"marshal-relay-ready")
    await M.click('[data-act=mgo]'); await shot(M,"marshal-relay-open")
    await M.click('.picklist button.pick:not([disabled]) >> nth=0'); await M.click('[data-act=mlane][data-l="4"]'); await M.click('.picklist button.pick:not([disabled]) >> nth=0')
    await shot(M,"marshal-relay-lanes")
    await M.click('[data-act=mlane][data-l="5"]'); await M.click('.picklist button.pick:not([disabled]) >> nth=0')
    await M.click('[data-act=mnew]'); await M.click('[data-act=mconfirm]'); await M.wait_for_timeout(200)
    # 800 m goes to the multitimer phone
    await M.click('[data-act=mpick][data-f=k][data-v="800"]'); await M.click('[data-act=mpick][data-v=F]'); await M.click('[data-act=mpick][data-f=g][data-v="16"]'); await shot(M,"marshal-800-ready")
    await M.click('[data-act=mgo]'); await M.wait_for_timeout(200); await shot(M,"marshal-800-sent")
    # ---- place judge ----
    J=await page("2222")
    for l in [5,4,1,2]: await J.click(f'[data-act=jtap][data-l="{l}"]'); await J.wait_for_timeout(60)
    await shot(J,"judge-race1-placed")
    await J.click('[data-act=jundo]'); await J.wait_for_timeout(60); await shot(J,"judge-undo")
    await J.click('[data-act=jtap][data-l="2"]'); await J.wait_for_timeout(60)
    await J.click('[data-act=jnext]'); await J.wait_for_timeout(150)
    await J.click('[data-act=jtap][data-l="2"]'); await J.click('[data-act=jtap][data-l="3"]'); await J.wait_for_timeout(60); await shot(J,"judge-race2-part")
    await J.click('[data-act=jnext]'); await shot(J,"judge-confirm"); await J.click('[data-act=jconfirm]'); await J.wait_for_timeout(150)
    await J.click('[data-act=jtap][data-l="4"]'); await J.click('[data-act=jtap][data-l="1"]'); await J.click('[data-act=jtap][data-l="5"]'); await J.wait_for_timeout(60); await shot(J,"judge-relay")
    # ---- time slips ----
    S=await page("4444"); await shot(S,"slips-ready")
    await S.click('[data-act=stest][data-v=bad]'); await S.set_input_files('#camin',SLIP); await S.wait_for_timeout(400); await shot(S,"slips-cannotread")
    await S.click('[data-act=stest][data-v=wrong]'); await S.set_input_files('#camin',SLIP); await S.wait_for_timeout(400); await shot(S,"slips-wrongslip")
    await S.click('[data-act=stest][data-v=good]'); await S.set_input_files('#camin',SLIP); await S.wait_for_timeout(1500); await shot(S,"slips-readok")
    await S.click('[data-act=snext]'); await S.set_input_files('#camin',SLIP); await S.wait_for_timeout(1500)
    await S.click('[data-act=snext]'); await S.set_input_files('#camin',SLIP); await S.wait_for_timeout(1500)
    # ---- multitimer ----
    await S.click('[data-act=snext]'); await S.wait_for_timeout(100); await shot(S,"multi-names")
    for i in range(6): await S.click(f'.namebtn >> nth={i}')
    await shot(S,"multi-names-picked")
    await S.click('[data-act=mtnames]'); await S.wait_for_timeout(150); await shot(S,"multi-ready")
    await S.click('[data-act=mtgo]'); await S.wait_for_timeout(100)
    await S.evaluate("window.__t+=150000"); await S.click('[data-act=mtsplit]')
    await S.evaluate("window.__t+=2410"); await S.click('[data-act=mtsplit]')
    await S.evaluate("window.__t+=3320"); await S.click('[data-act=mtsplit]')
    await S.evaluate("window.__t+=1500"); await S.click('[data-act=mtsplit]'); await S.wait_for_timeout(100)
    await shot(S,"multi-run")
    await S.click('[data-act=mtstop]'); await shot(S,"multi-stopmodal"); await S.click('[data-act=mtstopok]'); await S.wait_for_timeout(100)
    for i in [4,2]: await S.click(f'.namebtn >> nth={i}')
    await shot(S,"multi-place")
    for i in [0,5]: await S.click(f'.namebtn >> nth={i}')
    await S.wait_for_timeout(100); await shot(S,"multi-placed")
    await S.click('[data-act=mtsend]'); await S.wait_for_timeout(1500); await shot(S,"multi-sent")
    await tick()
    # ---- recorder ----
    R=await page("3333"); await R.wait_for_timeout(200); await shot(R,"recorder-track")
    await R.click('[data-act=rgoto]'); await shot(R,"recorder-gorace"); await R.click('[data-act=pickrace][data-race="1"]'); await R.wait_for_timeout(150)
    await R.fill('#t-1-3','7512'); await R.press('#t-1-3','Enter'); await R.wait_for_timeout(150); await shot(R,"recorder-over60")
    await R.fill('#t-1-3','1250'); await R.press('#t-1-3','Enter'); await R.wait_for_timeout(200); await shot(R,"recorder-pink")
    await R.click('[data-act=rst][data-l="6"][data-st=DNS]'); await R.wait_for_timeout(100)
    await R.click('[data-act=rst][data-l="7"][data-st=DQ]'); await R.wait_for_timeout(100); await shot(R,"recorder-dns-dq")
    await R.click('[data-act=rcheck]'); await R.wait_for_timeout(200)
    await R.click('[data-act=rgoto]'); await R.click('[data-act=pickrace][data-race="4"]'); await R.wait_for_timeout(200); await shot(R,"recorder-multi")
    await R.click('[data-act=rgoto]'); await R.click('[data-act=pickrace][data-race="3"]'); await R.wait_for_timeout(200)
    await R.click('[data-act=rrerun]'); await shot(R,"recorder-rerun"); await R.click('[data-act=closemodal]')
    await R.click('[data-act=rcancel]'); await shot(R,"recorder-cancel"); await R.click('[data-act=closemodal]')
    await R.click('[data-act=rtabrec][data-v=field]'); await shot(R,"recorder-field-empty")
    # ---- field station ----
    F=await page("6666"); await shot(F,"field-pick")
    await F.click('[data-act=fstation][data-v=LJ1]'); await shot(F,"field-day")
    await F.click('[data-act=fstation][data-v=SP]'); await shot(F,"field-day-sp")
    await F.click('[data-act=fstation][data-v=LJ1]')
    await F.evaluate("fOpen(A.R.fgroups.find(f=>f.key==='LJ|M|17').id)"); await F.wait_for_timeout(150); await shot(F,"field-empty")
    await F.click('[data-act=faddopen]'); await shot(F,"field-add")
    for i in range(6): await F.click('.addlist .pick:not([disabled]) >> nth=0')
    await F.click('[data-act=faddnew]'); await F.wait_for_timeout(100); await shot(F,"field-notonlist")
    await F.fill('#nsS','Newby'); await F.fill('#nsF','Sam'); await F.click('[data-act=addstudent]'); await F.wait_for_timeout(250)
    await F.evaluate("""(()=>{const f=fieldGroupOpen();const ids=fieldView(f).rows.map(r=>r.id);
      const m=[['534','x','541'],['498','502','x'],['x','x','x'],['561','558'],['487','-'],[],['515','x']];
      ids.forEach((id,i)=>m[i].forEach((v,a)=>setMark(f,id,a,v,true)));setNs(f,ids[5],true,true)})()""")
    await F.wait_for_timeout(300); await shot(F,"field-marks")
    if not phone:
        await F.click('[data-act=fshort]'); await F.wait_for_timeout(200); await shot(F,"field-short"); await F.click('[data-act=fshort]'); await F.wait_for_timeout(200)
        await F.fill('#mk-4-2','5.45'); await F.press('#mk-4-2','Enter'); await F.wait_for_timeout(200)
        assert await F.evaluate("A.R.groups.get('LJ|M|17').rows[1].best")==545
    else:
        await F.click('[data-act=fnext]'); await F.wait_for_timeout(100)
        await F.click('.keypad.fp [data-k="5"]'); await F.click('.keypad.fp [data-k="1"]'); await F.click('.keypad.fp [data-k="2"]'); await shot(F,"field-phone-typed")
        await F.click('[data-act=fsave]'); await F.wait_for_timeout(150); await shot(F,"field-phone-saved")
        await F.click('[data-act=fundo]'); await F.wait_for_timeout(150); await shot(F,"field-phone-undo")
    await F.click('[data-act=ffinish]'); await shot(F,"field-finishmodal"); await F.click('[data-act=ffinishok]'); await tick(); await F.wait_for_timeout(250); await shot(F,"field-final")
    await F.click('[data-act=fall]')
    # throws: fair, foul or pass, the best measured once
    await F.click('[data-act=fstation][data-v=SP]')
    await F.evaluate("fOpen(A.R.fgroups.find(f=>f.key==='SP|M|17').id)"); await F.wait_for_timeout(150)
    await F.click('[data-act=faddopen]')
    for i in range(7): await F.click('.addlist .pick:not([disabled]) >> nth=0')
    await F.click('.modal [data-act=closemodal]'); await F.wait_for_timeout(150)
    await F.evaluate("""(()=>{const f=fieldGroupOpen();const ids=fieldView(f).rows.map(r=>r.id);
      const m=[['Fair','Foul','Fair'],['Fair','Fair','Foul'],['Foul','Foul','Foul'],['Fair','Fair','Fair'],['Fair','Pass'],[],['Foul','Fair']];
      ids.forEach((id,i)=>m[i].forEach((v,a)=>setThrow(f,id,a,v,true)));setBest(f,ids[0],'1124',true);setBest(f,ids[1],'1006',true);setBest(f,ids[3],'1287',true);setNs(f,ids[5],true,true)})()""")
    await F.wait_for_timeout(300); await shot(F,"field-throws")
    if not phone:
        await F.click('.hjc[data-act=ttap] >> nth=14'); await F.wait_for_timeout(120); await shot(F,"field-throws-tap")
        await F.fill('#bs-4','980'); await F.press('#bs-4','Enter'); await F.wait_for_timeout(200)
    else:
        await F.evaluate("A.f.i=3;render()"); await F.wait_for_timeout(100); await shot(F,"field-phone-measure")
        await F.evaluate("A.f.i=4;render()"); await F.wait_for_timeout(100); await F.click('[data-act=fthrow][data-v=Fair]'); await F.wait_for_timeout(120)
        await F.click('.keypad.fp [data-k="9"]'); await F.click('.keypad.fp [data-k="8"]'); await F.click('.keypad.fp [data-k="0"]'); await F.click('[data-act=fsave]'); await F.wait_for_timeout(200)
        await shot(F,"field-phone-throw")
    await F.click('[data-act=ffinish]'); await shot(F,"field-throws-finishmodal"); await F.click('[data-act=ffinishok]'); await tick(); await F.wait_for_timeout(250)
    await F.click('[data-act=fall]')
    # high jump: the next height is worked out
    await F.click('[data-act=fstation][data-v=HJ1]')
    await F.evaluate("fOpen(A.R.fgroups.find(f=>f.key==='HJ|F|18').id)"); await F.wait_for_timeout(150); await shot(F,"field-high-empty")
    await F.click('[data-act=faddopen]')
    for i in range(6): await F.click('.addlist .pick:not([disabled]) >> nth=0')
    await F.click('.modal [data-act=closemodal]'); await F.wait_for_timeout(150)
    await F.evaluate("""(()=>{const f=fieldGroupOpen();const ids=fieldView(f).rows.map(r=>r.id);
      const m=[['O','O','XO','XXO','XXX'],['O','XO','XXX'],['-','O','O','XO','XXO'],['O','XXX'],['XXX'],['O','O','XO','XXX']];
      const hs=[110,115,120,123,126];
      ids.forEach((id,i)=>m[i].forEach((v,a)=>setHeight(f,id,hs[a],v,true)))})()""")
    await F.wait_for_timeout(300); await shot(F,"field-high")
    assert await F.evaluate("fieldView(fieldGroupOpen()).plan.cur")==129
    if not phone:
        await F.click('.hjc:not([disabled]) >> nth=5'); await F.wait_for_timeout(100)
    else:
        await F.evaluate("A.f.i=2;render()"); await F.wait_for_timeout(100); await F.click('.hjset .btn >> nth=0'); await F.wait_for_timeout(100); await shot(F,"field-phone-high"); await F.click('[data-act=fundo]'); await F.wait_for_timeout(100)
    await F.click('[data-act=ffinish]'); await F.click('[data-act=ffinishok]'); await tick(); await F.wait_for_timeout(250)
    # ---- recorder, field, override ----
    await R.click('[data-act=rtabrec][data-v=field]'); await R.wait_for_timeout(200)
    await R.click('[data-act=rfgroup][data-v="LJ|M|17"]'); await R.wait_for_timeout(150); await shot(R,"recorder-field")
    await R.click('[data-act=rovr]'); await shot(R,"recorder-field-pin")
    await R.fill('#opPin','9999'); await R.click('[data-act=oorgpinok]'); await R.wait_for_timeout(150); await shot(R,"recorder-field-override")
    await R.fill('#mk-3-0','530'); await R.press('#mk-3-0','Enter'); await R.wait_for_timeout(200); await R.click('[data-act=rovr]'); await R.wait_for_timeout(150)
    await R.click('[data-act=rfgroup][data-v="HJ|F|18"]'); await R.wait_for_timeout(150); await shot(R,"recorder-field-high")
    await R.click('[data-act=rfgroup][data-v="SP|M|17"]'); await R.wait_for_timeout(150); await shot(R,"recorder-field-throw")
    # ---- announcer, results, houses ----
    await M.click('[data-act=mpick][data-f=k][data-v="200"]'); await M.wait_for_timeout(100)
    A=await page("5555"); await A.wait_for_timeout(250); await shot(A,"announcer")
    n=await A.locator('[data-act=aread]:not([disabled])').count()
    if n: await A.click('[data-act=aread]'); await A.wait_for_timeout(150); await shot(A,"announcer-next")
    await A.click('[data-act=goto][data-job=results]') if not phone else await A.click('.pbar [data-job=results]')
    await A.wait_for_timeout(150); await shot(A,"results")
    await A.click('[data-act=rview][data-v=field]'); await shot(A,"results-field"); await A.click('[data-act=rview][data-v=all]')
    await A.click('[data-act=rtab][data-v=hris]'); await shot(A,"results-hris")
    await A.click('[data-act=rtab][data-v=news]'); await shot(A,"results-newsletter")
    await A.click('.hlink[data-job=houses]'); await A.wait_for_timeout(150); await shot(A,"houses")
    # ---- lock, new carnival, past year ----
    await O.click('[data-act=osec][data-v=lock]'); await O.click('[data-act=olock]'); await O.wait_for_timeout(200)
    await A.click('.hlink[data-job=results]'); await A.wait_for_timeout(150); await shot(A,"results-locked")
    await O.click('[data-act=olock]'); await O.wait_for_timeout(200)
    await O.click('[data-act=osec][data-v=export]'); await shot(O,"org-export-after")
    await O.click('[data-act=osec][data-v=lock]')
    await O.click('[data-act=oclear]'); await shot(O,"org-clear-ask"); await O.click('[data-act=closemodal]')
    await O.click('[data-act=onew]'); await O.fill('#ncPin','9999'); await O.click('[data-act=onew1]'); await shot(O,"org-newcarnival-records")
    await O.click('[data-act=onew2][data-v=yes]'); await O.wait_for_timeout(1500); await shot(O,"org-newcarnival-done")
    await O.click('[data-act=changeyear]'); await O.wait_for_timeout(300); await shot(O,"home-yearpick-2years")
    await O.click('[data-act=year][data-v="2027"]'); await O.wait_for_timeout(400)
    await O.click('.tile[data-job=houses]') if await O.locator('.tile[data-job=houses]').count() else await O.click('.tile[data-job=recorder]')
    await O.wait_for_timeout(300); await shot(O,"pastyear-recorder")
    await b.close()
async def main():
    os.makedirs(OUT,exist_ok=True)
    only=sys.argv[3:] or None
    async with async_playwright() as pw:
        for dev in DEVICES:
            for theme in ["light","dark"]:
                if only and f"{dev}-{theme}" not in only: continue
                await run(pw,dev,theme); print("done",dev,theme,flush=True)
    print("ERRORS",errs)
    sys.exit(1 if errs else 0)
asyncio.run(main())
