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
        await p.goto(URL); await p.wait_for_function("typeof A!=='undefined'&&!!A.store"); await p.wait_for_timeout(250)
        if pin: await dopin(p,pin)
        return p
    async def dopin(p,c):
        for k in c: await p.click(f'.keypad [data-k="{k}"]')
        await p.click('[data-act=pinstart]'); await p.wait_for_timeout(120)
    async def pick(p):
        # the first name still free; on a phone it can sit under the sticky search box until scrolled by hand
        await p.evaluate("document.querySelector('.picklist button.pick:not([disabled])').click()"); await p.wait_for_timeout(40)
    async def has(p,sel): return await p.locator(sel).count()>0
    async def takenames(p,n,start=True):
        # Take Names (A1.20): the first n names free, in tap order. Not on a build before Aths Opt 1.1
        for i in range(n): await p.click('.namebtn:not(.sel) >> nth=0'); await p.wait_for_timeout(30)
        if start: await p.click('[data-act=fstart]'); await p.wait_for_timeout(150)
    async def tick(ms=60000):
        for p in pages: await p.evaluate(f"window.__t+={ms}")
    async def shot(p,name):
        await p.wait_for_timeout(150)
        # toasts and the scroll position come and go: they are not part of the screen
        await p.evaluate("window.scrollTo(0,0);{const t=document.getElementById('toast');if(t)t.hidden=true}"); await p.wait_for_timeout(50)
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
    for sec in ["details","students","program","field","points","limits","records","export","lock","parents"]:
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
    assert await O.evaluate("A.R.events.length")==114
    # records list, to show a new record
    await O.click('[data-act=osec][data-v=records]'); await O.click('[data-act=orecload]')
    await O.evaluate(f"document.getElementById('rcPaste').value='{RECS}'")
    await O.click('[data-act=orecpaste]'); await O.wait_for_timeout(150); await shot(O,"org-records-loaded")
    # ---- marshal ----
    M=await page("1111"); await shot(M,"marshal-start")
    await M.click('[data-act=mgo]'); await shot(M,"marshal-notready"); await M.click('[data-act=closemodal]')
    await M.click('[data-act=mpick][data-v="100"]'); await M.click('[data-act=mpick][data-v=M]'); await M.click('[data-act=mpick][data-f=g][data-v="18"]'); await shot(M,"marshal-ready")
    await M.click('[data-act=mgo]'); await shot(M,"marshal-lanes-listopen")
    for i in range(8): await pick(M)
    await shot(M,"marshal-lanes-full")
    await M.reload(); await M.wait_for_function("typeof A!=='undefined'&&!!A.store"); await M.wait_for_timeout(250)
    assert await M.evaluate("Object.keys(A.m.lanes).length")==8   # a half-filled lane list survives a reload
    await M.click('[data-act=mnext]'); await M.wait_for_timeout(200)
    for i in range(3): await pick(M)
    await M.click('[data-act=mclose]'); await M.wait_for_timeout(60)   # on a phone the name list covers the screen
    await M.click('[data-act=mnew]'); await shot(M,"marshal-confirmheat"); await M.click('[data-act=mconfirm]'); await M.wait_for_timeout(200)
    await shot(M,"marshal-sent")
    await M.click('[data-act=menu]'); await shot(M,"marshal-jobmenu"); await M.click('[data-act=menu]')
    # relay, no names
    await M.click('[data-act=mpick][data-f=k][data-v=R]'); await M.click('[data-act=mpick][data-v=F]'); await M.click('[data-act=mpick][data-f=g][data-v=J]'); await shot(M,"marshal-relay-ready")
    await M.click('[data-act=mgo]'); await shot(M,"marshal-relay-open")
    await pick(M); await M.click('[data-act=mlane][data-l="4"]'); await pick(M)
    await shot(M,"marshal-relay-lanes")
    await M.click('[data-act=mlane][data-l="5"]'); await pick(M)
    await M.click('[data-act=mnew]'); await M.click('[data-act=mconfirm]'); await M.wait_for_timeout(200)
    # 800 m goes to the multitimer phone
    await M.click('[data-act=mpick][data-f=k][data-v="800"]'); await M.click('[data-act=mpick][data-v=F]'); await M.click('[data-act=mpick][data-f=gs][data-v="15"]'); await M.click('[data-act=mpick][data-f=gs][data-v="16"]'); await shot(M,"marshal-800-ready")
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
    # Aths Opt 1.9: the Take photo or Multi switch, with Multi chosen on a normal race that has lanes (A1.5)
    await S.click('[data-act=smode][data-v=multi]'); await S.wait_for_timeout(200); await shot(S,"slips-multi-on-normal-race")
    await S.click('[data-act=smode][data-v=photo]'); await S.wait_for_timeout(150)
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
    await shot(S,"multi-place-start")
    for i in [4,2]: await S.click(f'[data-act=mttap] >> nth={i}')
    await shot(S,"multi-place")
    for i in [0,5]: await S.click(f'[data-act=mttap] >> nth={i}')
    if await has(S,'.spot'):
        await S.click('[data-act=mttap] >> nth=3'); await S.wait_for_timeout(60); await shot(S,"multi-past-splits")
        await S.click('[data-act=mttap] >> nth=2'); await S.wait_for_timeout(60); await shot(S,"multi-tap-to-remove")
        await S.click('[data-act=mttap] >> nth=2'); await S.click('[data-act=mttap] >> nth=1')
    await S.wait_for_timeout(100); await shot(S,"multi-placed")
    await S.click('[data-act=mtsend]'); await S.wait_for_timeout(1500); await shot(S,"multi-sent")
    if await has(S,'[data-act=mtnext]'):
        await S.click('[data-act=mtnext]'); await S.wait_for_timeout(100); await shot(S,"multi-next-heat")
        await S.click('[data-act=mtnoheat]'); await S.wait_for_timeout(100)
    if await has(S,'[data-act=mtnew]'):
        await S.click('[data-act=mtnew]'); await S.wait_for_timeout(100); await shot(S,"multi-new-pick")
        await S.evaluate("mtDraftDrop()"); await S.wait_for_timeout(100)
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
    if await has(F,'[data-act=fstart]'):
        await takenames(F,4,False); await shot(F,"field-names-part")
        await F.click('.namebtn.sel >> nth=1'); await F.wait_for_timeout(100); await shot(F,"field-names-takeoff")
        await F.fill('#tnfilter','an'); await F.wait_for_timeout(100); await shot(F,"field-names-find"); await F.fill('#tnfilter',''); await F.wait_for_timeout(100)
        await takenames(F,3,False)
    else:
        await F.click('[data-act=faddopen]'); await shot(F,"field-add")
        for i in range(6): await F.click('.addlist .pick:not(.on) >> nth=0')
    await F.click('[data-act=faddnew]'); await F.wait_for_timeout(100); await shot(F,"field-notonlist")
    await F.fill('#nsS','Newby'); await F.fill('#nsF','Sam'); await F.click('[data-act=addstudent]'); await F.wait_for_timeout(250)
    if await has(F,'[data-act=fstart]'):
        await shot(F,"field-names-full"); await F.click('[data-act=fstart]'); await F.wait_for_timeout(150)
        await F.click('[data-act=faddopen]'); await shot(F,"field-add"); await F.click('.modal [data-act=closemodal]'); await F.wait_for_timeout(100)
    # long jump: up to 3 jumps, Foul and Pass, Finish and Keep top N (Aths Opt 1.3, decisions 71 to 76)
    await F.evaluate("""(async()=>{const f=fieldGroupOpen();const ids=fieldView(f).rows.map(r=>r.id);
      const m=[['534','x'],['498','502'],['x','x'],['561','558'],['487'],[],['515']];
      for(let i=0;i<m.length;i++)for(let a=0;a<m[i].length;a++)await setMark(f,ids[i],a,m[i][a],true);
      await setNs(f,ids[5],true,true);await setField(f,ids[4],'fin',0,true,true)})()""")
    await F.wait_for_timeout(300); await shot(F,"field-marks")
    if not phone:
        await F.click('.hjc.upc'); await F.wait_for_timeout(150); await shot(F,"field-marks-pop")
        for k in "545": await F.click(f'.ljpop .keypad [data-k="{k}"]')
        await shot(F,"field-marks-typed"); await F.click('.ljpop [data-v=save]'); await F.wait_for_timeout(250)
        assert await F.evaluate("A.R.groups.get('LJ|M|17').rows[0].best")==561
        await F.click('[data-act=ffin] >> nth=0'); await F.wait_for_timeout(120); await shot(F,"field-ended"); await F.hover('[data-act=ffin] >> nth=0'); await F.mouse.down(); await F.wait_for_timeout(1100); await F.mouse.up(); await F.wait_for_timeout(100)
        await F.fill('[data-keepn]','3'); await F.press('[data-keepn]','Tab'); await F.wait_for_timeout(100)
        await F.click('[data-act=fkeep]'); await F.wait_for_timeout(250); await shot(F,"field-keeptop")
        await F.click('[data-act=fkeepundo]'); await F.wait_for_timeout(250)
    else:
        await F.evaluate("A.f.i=3;A.f.id=null;render()"); await F.wait_for_timeout(100)
        await F.click('.keypad.fp [data-k="5"]'); await shot(F,"field-phone-short")
        await F.click('[data-act=fsave]'); await F.wait_for_timeout(100); assert await F.evaluate("A.f.typed")=="5"   # 1 digit refused, kept
        await F.click('.keypad.fp [data-k="1"]'); await F.click('.keypad.fp [data-k="2"]'); await shot(F,"field-phone-typed")
        await F.click('[data-act=fsave]'); await F.wait_for_timeout(150); await shot(F,"field-phone-saved")
        await F.click('[data-act=fundo]'); await F.wait_for_timeout(150); await shot(F,"field-phone-undo")
        await F.click('.attcell[data-act=fcell] >> nth=0'); await F.wait_for_timeout(100); await shot(F,"field-phone-change")
        await F.evaluate("A.f.a=null;render()"); await F.click('[data-act=ffinphone]'); await F.wait_for_timeout(250); await shot(F,"field-phone-end"); await F.click('[data-act=fundo]'); await F.wait_for_timeout(150)
        await F.click('[data-act=fcut]'); await F.wait_for_timeout(100); await shot(F,"field-phone-cut"); await F.click('[data-act=fcut]'); await F.wait_for_timeout(100)
    if not phone:
        await F.click('[data-act=ffinish]'); await shot(F,"field-finishmodal"); await F.click('[data-act=ffinishok]'); await tick(); await F.wait_for_timeout(250); await shot(F,"field-final")
    else:
        await F.click('[data-act=ffinish]'); await F.wait_for_timeout(150); await shot(F,"field-lj-summary")
        await F.click('[data-act=fsend]'); await tick(); await F.wait_for_timeout(300); await shot(F,"field-final")
    await F.click('[data-act=fall]')
    # throws: everyone throws once, the official picks who throws again, the best marks of about 5 are measured, the rest are participation
    await F.click('[data-act=fstation][data-v=SP]')
    await F.evaluate("fOpen(A.R.fgroups.find(f=>f.key==='SP|M|17').id)"); await F.wait_for_timeout(150)
    if await has(F,'[data-act=fstart]'):
        await shot(F,"field-names-throw"); await takenames(F,7)
    else:
        await F.click('[data-act=faddopen]')
        for i in range(7): await F.click('.addlist .pick:not(.on) >> nth=0')
        await F.click('.modal [data-act=closemodal]'); await F.wait_for_timeout(150)
    await F.evaluate("""(async()=>{const f=fieldGroupOpen();const ids=fieldView(f).rows.map(r=>r.id);
      const m=[['Fair'],['Fair'],['Foul'],['Fair'],['Fair'],[],['Pass']];
      for(let i=0;i<m.length;i++)for(let a=0;a<m[i].length;a++)await setThrow(f,ids[i],a,m[i][a],true);
      await setNs(f,ids[5],true,true)})()""")
    await F.wait_for_timeout(300); await shot(F,"field-throw1")
    if phone: await F.click('[data-act=tgopen]'); await F.wait_for_timeout(150)
    await shot(F,"field-throwagain")
    for i in (0,1,3): await F.click(f'.namebtn >> nth={i}'); await F.wait_for_timeout(80)
    await shot(F,"field-throwagain-ticked")
    await F.click('[data-act=tgstart]'); await F.wait_for_timeout(250)
    await F.evaluate("""(async()=>{const f=fieldGroupOpen();const ids=fieldView(f).rows.map(r=>r.id);
      const m={0:['Fair','Fair','Foul'],1:['Fair','Foul','Fair'],3:['Fair','Fair','Fair']};
      for(const i in m)for(let a=1;a<3;a++)await setThrow(f,ids[i],a,m[i][a],true);
      await setBest(f,ids[0],'1124',true);await setBest(f,ids[1],'1006',true);await setBest(f,ids[3],'1287',true)})()""")
    await F.wait_for_timeout(300); await shot(F,"field-throws-needset")
    if not phone:
        await F.click('.hjc[data-act=ttap]:not([disabled]) >> nth=4'); await F.wait_for_timeout(120); await shot(F,"field-throws-tap")
        for i in range(3): await F.click('.hjc[data-act=ttap]:not([disabled]) >> nth=4'); await F.wait_for_timeout(60)
        await F.fill('[data-setd]','1100'); await F.press('[data-setd]','Enter'); await F.wait_for_timeout(200); await shot(F,"field-throws-setbad")
        await F.fill('[data-setd]','800'); await F.press('[data-setd]','Enter'); await F.wait_for_timeout(250); await shot(F,"field-throws")
    else:
        await F.click('[data-act=tgmeasure]'); await F.wait_for_timeout(150); await shot(F,"field-phone-measure")
        await F.click('[data-act=mopen]:not([disabled]) >> nth=1'); await F.wait_for_timeout(120); await shot(F,"field-phone-measure-open"); await F.click('[data-act=mcancel]'); await F.wait_for_timeout(100)
        await F.fill('[data-setd]','800'); await F.press('[data-setd]','Enter'); await F.wait_for_timeout(250); await shot(F,"field-phone-measure-set")
    if not phone:
        await F.click('[data-act=ffinish]'); await shot(F,"field-throws-finishmodal"); await F.click('[data-act=ffinishok]'); await tick(); await F.wait_for_timeout(250)
    else:
        await F.click('[data-act=ffinish]'); await F.wait_for_timeout(150); await shot(F,"field-throws-summary"); await F.click('[data-act=fsend]'); await tick(); await F.wait_for_timeout(300)
    await F.click('[data-act=fall]')
    # discus 12 and 13: a weight for each athlete
    await F.click('[data-act=fstation][data-v=D1]')
    await F.evaluate("fOpen(A.R.fgroups.find(f=>f.key==='D|M|13').id)"); await F.wait_for_timeout(150)
    await takenames(F,4,False); await F.click('[data-act=wtset][data-v="1"] >> nth=0'); await F.click('[data-act=wtset][data-v="2"] >> nth=1'); await F.wait_for_timeout(150); await shot(F,"field-names-discus")
    await F.click('[data-act=fall]')
    # high jump: tap the box that is up; the start height and each next height are typed; the heights go on until everyone is out
    await F.click('[data-act=fstation][data-v=HJ1]')
    await F.evaluate("fOpen(A.R.fgroups.find(f=>f.key==='HJ|F|18').id)"); await F.wait_for_timeout(150); await shot(F,"field-high-empty")
    if await has(F,'[data-act=fstart]'):
        await takenames(F,6); await shot(F,"field-high-start")
    else:
        await F.click('[data-act=faddopen]')
        for i in range(6): await F.click('.addlist .pick:not(.on) >> nth=0')
        await F.click('.modal [data-act=closemodal]'); await F.wait_for_timeout(150)
    await shot(F,"field-high-first")
    await F.evaluate("""(async()=>{const f=fieldGroupOpen();const ids=fieldView(f).rows.map(r=>r.id);
      const m=[['O','O','XO','XXO','XO'],['O','XO','XXX'],['-','O','O','XO','XXO'],['O','O','XO','XXO','XXO'],['XXX'],['O','O','XO','XXX']];
      const hs=[110,115,120,123,126];
      for(let i=0;i<m.length;i++)for(let a=0;a<m[i].length;a++)await setHeight(f,ids[i],hs[a],m[i][a],true)})()""")
    await F.wait_for_timeout(300); await shot(F,"field-high")
    assert await F.evaluate("fieldView(fieldGroupOpen()).plan.cur")!=None
    async def hj(v):
        if not phone: await F.click('.hjc.upc'); await F.click(f'.hjpop [data-v="{v}"]')
        else: await F.click(f'[data-act=hjtry][data-v="{v}"]')
        await F.wait_for_timeout(350)
    if not phone:
        await F.click('.hjc.upc'); await F.wait_for_timeout(150); await shot(F,"field-high-pop"); await F.click('.hjc.upc'); await F.wait_for_timeout(100)
    await hj("X"); await shot(F,"field-high-miss")
    await hj("-"); await shot(F,"field-high-passed")
    if not phone:
        await F.fill('[data-hjn]','1.40'); await F.press('[data-hjn]','Enter'); await F.wait_for_timeout(250); await shot(F,"field-high-typed")
    else:
        await F.click('[data-act=fedit]'); await F.wait_for_timeout(120); await shot(F,"field-phone-high")
        await F.click('[data-act=fedit]'); await F.wait_for_timeout(100)
    for i in range(40):
        if await F.evaluate("fieldView(fieldGroupOpen()).plan.cur")==None: break
        await hj("X")
    await shot(F,"field-high-allout")
    assert await F.evaluate("fieldView(fieldGroupOpen()).plan.cur")==None
    await F.click('[data-act=fundo]'); await F.wait_for_timeout(120); await shot(F,"field-high-undo")
    await hj("O"); await F.wait_for_timeout(100)
    if phone:
        await F.click('[data-act=ffinish]'); await F.wait_for_timeout(150); await shot(F,"field-high-summary"); await F.click('[data-act=fsend]'); await tick(); await F.wait_for_timeout(300)
    else:
        await F.click('[data-act=ffinish]'); await F.click('[data-act=ffinishok]'); await tick(); await F.wait_for_timeout(250)
    # ---- recorder, field, override ----
    await R.click('[data-act=rtabrec][data-v=field]'); await R.wait_for_timeout(200)
    await R.click('[data-act=rfgroup][data-v="LJ|M|17"]'); await R.wait_for_timeout(150); await shot(R,"recorder-field")
    await R.click('[data-act=rovr]'); await shot(R,"recorder-field-pin")
    await R.fill('#opPin','9999'); await R.click('[data-act=oorgpinok]'); await R.wait_for_timeout(150); await shot(R,"recorder-field-override")
    await R.fill('#mk-3-0','530'); await R.press('#mk-3-0','Enter'); await R.wait_for_timeout(200); await R.click('[data-act=rovr]'); await R.wait_for_timeout(150)
    await R.click('[data-act=rfgroup][data-v="HJ|F|18"]'); await R.wait_for_timeout(150); await shot(R,"recorder-field-high")
    await R.click('[data-act=rfgroup][data-v="SP|M|17"]'); await R.wait_for_timeout(150); await shot(R,"recorder-field-throw")
    # A1.31 (Aths Opt 1.7): the Recorder's override for a throws group
    await R.click('[data-act=rovr]'); await R.fill('#opPin','9999'); await R.click('[data-act=oorgpinok]'); await R.wait_for_timeout(200); await shot(R,"recorder-field-throws-override")
    await R.click('[data-act=rovr]'); await R.wait_for_timeout(150)
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
    # ---- parents page and Organiser section 10 (A1.29, A1.30, Aths Opt 1.7)
    PURL=URL.replace("index.html","parents/index.html") if "index.html" in URL else URL.split("?")[0].rstrip("/")+"/parents/index.html?"+(URL.split("?")[1] if "?" in URL else "")
    await O.click('[data-act=osec][data-v=parents]')
    PP=await ctx.new_page(); pages.append(PP); PP.on("pageerror",lambda e:errs.append((dev,theme,str(e))))
    await PP.goto(PURL); await PP.wait_for_timeout(500); await shot(PP,"parents-off")
    await O.click('[data-act=ptog]'); await O.wait_for_timeout(250); await shot(O,"org-parents-on")
    await O.click('[data-act=pnames][data-v=short]'); await O.wait_for_timeout(250)
    await PP.reload(); await PP.wait_for_timeout(500); await shot(PP,"parents-house")
    for tab in ["age","events","champs","program"]:
        await PP.click(f'[data-tab={tab}]'); await PP.wait_for_timeout(150); await shot(PP,f"parents-{tab}")
    await PP.click('[data-tab=find]'); await PP.fill('#pfq','an'); await PP.wait_for_timeout(250); await shot(PP,"parents-find")
    await O.click('[data-act=pnames][data-v=none]'); await O.wait_for_timeout(250); await PP.reload(); await PP.wait_for_timeout(500)
    await PP.click('[data-tab=events]'); await PP.wait_for_timeout(150)
    if not await PP.evaluate("!!document.querySelector('.pgroup[open]')"): await PP.click('.pgroup summary >> nth=0'); await PP.wait_for_timeout(100)
    await shot(PP,"parents-nonames-events")
    await O.click('[data-act=pnames][data-v=none]'); await O.wait_for_timeout(200); await O.click('[data-act=ptog]'); await O.wait_for_timeout(250)
    await PP.close(); pages.remove(PP)
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
