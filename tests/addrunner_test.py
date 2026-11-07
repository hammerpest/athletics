"""Tests Add a runner who ran on the multitimer (A1.5, Aths Opt 2.1, decision 107).
Usage: python3 tests/addrunner_test.py <page url with ?mode=local>"""
import asyncio, sys
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8126/index.html?mode=local"
fails = []; errs = []
def ok(name, cond):
    print(("PASS " if cond else "FAIL ") + name, flush=True)
    if not cond: fails.append(name)
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(); ctx = await b.new_context(viewport={"width": 390, "height": 844})
        async def app(pin, w=390, h=844):
            p = await ctx.new_page(); p.on("pageerror", lambda e: errs.append(str(e))); await p.set_viewport_size({"width": w, "height": h})
            await p.goto(URL); await p.wait_for_function("typeof A!=='undefined'&&!!A.store"); await p.wait_for_timeout(200)
            for k in pin: await p.click(f'.keypad [data-k="{k}"]')
            await p.click('[data-act=pinstart]'); await p.wait_for_timeout(250); return p
        O = await app("9999", 1512, 982)
        await O.click('.tile[data-job=organiser]'); await O.click('[data-act=osec][data-v=students]'); await O.click('[data-act=oload]'); await O.click('[data-act=otest]'); await O.click('[data-act=oimport]'); await O.wait_for_timeout(800)
        await O.evaluate("""(async()=>{const s=A.roster.M.filter(x=>x.g==='17');window.__ids=s.slice(0,10).map(x=>x.id);
          await A.store.set('heats/r0001',{race:1,k:'100',x:'M',g:'17',heat:1,lanes:{3:s[0].id,5:s[1].id,6:s[2].id},at:Date.now()});
          const full={};for(let i=0;i<8;i++)full[i+1]=s[3+i].id;
          await A.store.set('heats/r0002',{race:2,k:'200',x:'M',g:'17',heat:1,lanes:full,at:Date.now()});
          await A.store.set('heats/r0003',{race:3,k:'R',x:'F',g:'J',heat:1,lanes:{2:'T-B',4:'T-J',6:'T-N'},at:Date.now()});
          await A.store.set('heats/r0004',{race:4,k:'800',x:'M',g:'17',gs:['17'],heat:1,multi:true,lanes:{1:s[0].id,2:s[1].id,3:s[2].id},at:Date.now()});
          await A.store.set('counter/race',{next:5,at:Date.now()})})()"""); await O.wait_for_timeout(500)
        S = await app("4444")
        # ---- race 1: a 100 m with three runners, timed on Multi, a fourth ran
        await S.click('[data-act=smode][data-v=multi]'); await S.wait_for_timeout(300)
        ok("Add a runner who ran shows at Ready on a lane race", await S.locator('[data-act=mtaddopen]').count() == 1)
        await S.click('[data-act=mtgo]'); await S.wait_for_timeout(250)
        ok("it is not on screen while the clock runs (no mis-taps)", await S.locator('[data-act=mtaddopen]').count() == 0)
        for _ in range(3):
            await S.click('[data-act=mtsplit]'); await S.wait_for_timeout(200)
        await S.click('[data-act=mtstop]'); await S.wait_for_timeout(250)
        ok("it shows again while placing", await S.locator('[data-act=mtaddopen]').count() == 1)
        ids = await O.evaluate("window.__ids")
        for i in (0, 1, 2):
            await S.click(f'[data-act=mttap][data-id="{ids[i]}"]'); await S.wait_for_timeout(120)
        ok("all three placed: Send is ready", not await S.locator('[data-act=mtsend]').is_disabled())
        await S.click('[data-act=mtaddopen]'); await S.wait_for_timeout(250)
        ok("the pop-up lists students not yet named, with a search and Not on the list", await S.locator('.modal [data-act=mtaddrun]').count() > 5 and await S.locator('#mtaq').count() == 1 and await S.locator('[data-act=mtaddnot]').count() == 1)
        late = await S.evaluate("document.querySelector('.modal [data-act=mtaddrun]').dataset.id")
        ok("the three already named are not offered", late not in ids[:3])
        await S.click('.modal [data-act=mtaddrun] >> nth=0'); await S.wait_for_timeout(500)
        lanes = await S.evaluate("Object.keys(A.heats.find(h=>h.race===1).lanes).filter(l=>A.heats.find(h=>h.race===1).lanes[l]).sort().join(',')")
        ok("the added runner took the next free lane (1)", lanes == "1,3,5,6")
        ok("the phone now asks for the 4th place, and Send is waiting", not await S.locator('[data-act=mtsend]').is_enabled() and "4th" in await S.inner_text('#main'))
        await S.click(f'[data-act=mttap][data-id="{late}"]'); await S.wait_for_timeout(150)
        await S.click('[data-act=mtsend]'); await S.wait_for_timeout(600)
        t = await S.evaluate("Object.keys(A.times.r0001.lanes).sort().join(',')"); f = await S.evaluate("A.finish.r0001.seq")
        ok("times and places include the added runner's lane", t == "1,3,5,6" and f and f[-1] == "1" and len(f) == 4)
        # a student the Recorder added to the lanes meanwhile is not offered again (no double lane)
        await S.evaluate("A.s.race=4;render()"); await S.wait_for_timeout(200)
        dup = ids[7]
        await S.evaluate(f"(async()=>{{await setHeatLane(4,9,'{dup}')}})()"); await S.wait_for_timeout(300)
        await S.click('[data-act=mtaddopen]'); await S.wait_for_timeout(250)
        offered = await S.evaluate("[...document.querySelectorAll('.modal [data-act=mtaddrun]')].map(b=>b.dataset.id)")
        ok("a student already in the race's lanes is not offered again", dup not in offered and len(offered) > 5)
        await S.click('.modal [data-act=closemodal]'); await S.wait_for_timeout(150)
        await S.evaluate("(async()=>{await setHeatLane(4,9,'')})()"); await S.wait_for_timeout(300)
        await S.evaluate("A.s.race=2;render()"); await S.wait_for_timeout(200)
        # ---- race 2: all eight lanes full: the phone says so
        await S.evaluate("A.s.race=2;render()"); await S.wait_for_timeout(250)
        await S.click('[data-act=smode][data-v=multi]'); await S.wait_for_timeout(250)
        await S.click('[data-act=mtaddopen]'); await S.wait_for_timeout(250)
        await S.click('.modal [data-act=mtaddrun] >> nth=0'); await S.wait_for_timeout(400)
        await S.click('[data-act=mtaddopen]'); await S.wait_for_timeout(250); await S.click('[data-act=mtaddnot]'); await S.wait_for_timeout(250)
        ok("with every lane full, Not on the list does not even open the form", await S.locator('#nsS').count() == 0 and "lanes are full" in await S.inner_text('#toast'))
        ok("with every lane full it says so and adds nobody", "lanes are full" in await S.inner_text('#toast') and await S.evaluate("Object.values(A.heats.find(h=>h.race===2).lanes).filter(Boolean).length")==8)
        # ---- race 3: a relay has no add button
        await S.evaluate("A.s.race=3;render()"); await S.wait_for_timeout(250)
        await S.click('[data-act=smode][data-v=multi]'); await S.wait_for_timeout(250)
        ok("a relay (house teams) has no Add a runner button", await S.locator('[data-act=mtaddopen]').count() == 0)
        # ---- race 4: an 800 m, no lane limit
        await S.evaluate("A.s.race=4;render()"); await S.wait_for_timeout(250)
        await S.click('[data-act=mtaddopen]'); await S.wait_for_timeout(250)
        before = await S.locator('.modal [data-act=mtaddrun]').count()
        nm = await S.evaluate("document.querySelector('.modal [data-act=mtaddrun] .t').textContent")
        await S.fill('#mtaq', nm.split(' ')[1][:3]); await S.wait_for_timeout(300)
        after = await S.locator('.modal [data-act=mtaddrun]').count()
        ok("the search narrows the list (" + str(before) + " to " + str(after) + ")", 1 <= after < before and await S.locator('#mtaq').count() == 1)
        await S.fill('#mtaq', ''); await S.wait_for_timeout(300)
        await S.click('.modal [data-act=mtaddrun] >> nth=0'); await S.wait_for_timeout(500)
        ok("on the 800 m the added runner takes lane 4", await S.evaluate("Object.keys(A.heats.find(h=>h.race===4).lanes).filter(l=>A.heats.find(h=>h.race===4).lanes[l]).sort().join(',')") == "1,2,3,4" and "4 runners" in await S.inner_text('.racebar'))
        # Not on the list: a new student
        await S.click('[data-act=mtaddopen]'); await S.wait_for_timeout(250); await S.click('[data-act=mtaddnot]'); await S.wait_for_timeout(250)
        await S.fill('#nsS', 'Latecomer'); await S.fill('#nsF', 'Lee'); await S.click('[data-act=addstudent]'); await S.wait_for_timeout(600)
        ok("Not on the list adds a new student and puts them in the race (lane 5)", await S.evaluate("Object.keys(A.heats.find(h=>h.race===4).lanes).filter(l=>A.heats.find(h=>h.race===4).lanes[l]).sort().join(',')") == "1,2,3,4,5" and await S.evaluate("A.extras.some(e=>e.s==='Latecomer')"))
        ok("no page errors " + str(errs[:2]), errs == [])
        await b.close()
    print("\n%d failed" % len(fails)); sys.exit(1 if fails else 0)
asyncio.run(main())
