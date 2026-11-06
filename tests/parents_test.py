"""Tests the parents page (parents/) and the Organiser section 10 (A1.29, A1.30) in test mode.
Usage: python3 tests/parents_test.py <site root url, for example http://127.0.0.1:8126/>"""
import asyncio, sys
from playwright.async_api import async_playwright
ROOT = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8126/"
fails = []; errs = []
def ok(name, cond):
    print(("PASS " if cond else "FAIL ") + name, flush=True)
    if not cond: fails.append(name)
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(); ctx = await b.new_context(viewport={"width": 1512, "height": 982})
        async def app(pin):
            p = await ctx.new_page(); p.on("pageerror", lambda e: errs.append(str(e)))
            await p.goto(ROOT + "index.html?mode=local"); await p.wait_for_function("typeof A!=='undefined'&&!!A.store"); await p.wait_for_timeout(200)
            for k in pin: await p.click(f'.keypad [data-k="{k}"]')
            await p.click('[data-act=pinstart]'); await p.wait_for_timeout(200); return p
        O = await app("9999")
        await O.click('.tile[data-job=organiser]'); await O.click('[data-act=osec][data-v=students]'); await O.click('[data-act=oload]'); await O.click('[data-act=otest]'); await O.click('[data-act=oimport]'); await O.wait_for_timeout(800)
        # a small result: two boys in the 100 m, checked
        await O.evaluate("""(async()=>{const s=A.roster.M.filter(x=>x.g==='17');const a=s[0],b=s[1];
          await A.store.set('heats/r0001',{race:1,k:'100',x:'M',g:'17',heat:1,lanes:{1:a.id,2:b.id},at:Date.now(),dev:'secret-device'});
          await A.store.set('times/r0001',{lanes:{1:{t:1261,st:'ok',src:'typed'},2:{t:1291,st:'ok',src:'typed'}},checked:true,gen:0});
          window.__a=a.f+' '+a.s;window.__ah=a.h})()"""); await O.wait_for_timeout(500)
        who = await O.evaluate("window.__a")
        # Organiser section 10
        await O.click('[data-act=osec][data-v=parents]'); await O.wait_for_timeout(200)
        txt = await O.inner_text('#main')
        ok("Organiser has 10 sections and section 10 is Parents page", await O.locator('[data-act=osec]').count() == 10 and "Parents page is off" in txt)
        ok("seven things can be ticked, records is off to start", await O.locator('[data-act=pshow]').count() == 7 and await O.locator('[data-act=pshow][data-v=records]').is_checked() == False and await O.locator('[data-act=pshow][data-v=house]').is_checked())
        # parents page while off
        P = await ctx.new_page(); P.on("pageerror", lambda e: errs.append(str(e)))
        await P.set_viewport_size({"width": 390, "height": 844})
        await P.goto(ROOT + "parents/index.html?mode=local"); await P.wait_for_timeout(600)
        ok("off: parents see 'Results will be here on the day' and no results", "Results will be here on the day" in await P.inner_text('#pmain'))
        # turn on
        await O.click('[data-act=ptog]'); await O.wait_for_timeout(300)
        ok("the switch turns the page on in the saved config", await O.evaluate("A.cfg.parents")==True and "Parents page is on" in await O.inner_text('#main'))
        await P.reload(); await P.wait_for_timeout(700)
        await P.click('[data-tab=events]'); await P.wait_for_timeout(150)
        ok("names are off until the organiser chooses them", who.split(" ")[0] not in await P.inner_text('#pmain') and not await P.locator('[data-tab=find]').count())
        await O.click('[data-act=pnames][data-v=short]'); await O.wait_for_timeout(250)
        await P.reload(); await P.wait_for_timeout(700)
        pt = await P.inner_text('#pmain')
        ok("on: House points tab shows the three houses", all(h in pt for h in ["Bradman","Jackson","Newcombe"]))
        tabs = await P.locator('.ptabs button').all_inner_texts()
        ok("tabs follow the ticks (records is off, so no Records tab)", tabs[:5] == ["House points","By age","Event results","Find a student","Age champions"] and "Records" not in tabs and "What is on" in tabs)
        await P.click('[data-tab=events]'); await P.wait_for_timeout(200)
        et = await P.inner_text('#pmain')
        short = who.split(" ")[0] + " " + who.split(" ")[1][0] + "."
        ok("Event results lists the 100 m with names as first name and surname initial (" + short + ")", "100 m" in et and short in " ".join(et.split()))
        ok("the full surname is not shown", who.split(" ")[1] not in et)
        await P.click('[data-tab=find]'); await P.fill('#pfq', who.split(" ")[0][:3]); await P.wait_for_timeout(300)
        ok("Find a student shows the house and results", "100 m" in await P.inner_text('#pmain') and await P.locator('.pcard .chip').count() >= 1)
        await P.click('[data-tab=age]'); ok("By age shows the age group table", "12 & 13" in await P.inner_text('#pmain'))
        await P.click('[data-tab=champs]'); ok("Age champions tab opens", "18+" in await P.inner_text('#pmain'))
        await P.click('[data-tab=program]'); ok("What is on tab opens", "Track program" in await P.inner_text('#pmain') or "Field events" in await P.inner_text('#pmain'))
        ok("no sideways scroll on a phone", await P.evaluate("document.documentElement.scrollWidth<=innerWidth"))
        raw = await P.content()
        ok("nothing private on the page (no PINs, chief name, device id)", "secret-device" not in raw and "Jordan Dennis" not in raw)
        # untick find, names off
        await O.click('[data-act=pshow][data-v=find]'); await O.wait_for_timeout(200); await O.click('[data-act=pnames][data-v=none]'); await O.wait_for_timeout(300)
        ok("ticks are saved", await O.evaluate("A.cfg.parentsShow.find")==False and await O.evaluate("A.cfg.parentsNames")=="none")
        await P.reload(); await P.wait_for_timeout(700)
        tabs2 = await P.locator('.ptabs button').all_inner_texts()
        ok("Find a student tab is gone when it is unticked, and when names are off", "Find a student" not in tabs2)
        await P.click('[data-tab=events]'); await P.wait_for_timeout(200)
        et2 = await P.inner_text('#pmain')
        ok("names off: no student name anywhere on the page", who.split(" ")[0] not in et2 and who.split(" ")[1] not in et2)
        # provisional: an unchecked race shows only when ticked
        await O.evaluate("A.store.set('times/r0001',Object.assign({},A.times.r0001,{checked:false}))"); await O.wait_for_timeout(300)
        await P.reload(); await P.wait_for_timeout(600); await P.click('[data-tab=events]')
        ok("an unchecked race is held back by default", "100 m" not in await P.inner_text('#pmain'))
        await O.click('[data-act=pprov]'); await O.wait_for_timeout(300)
        await P.reload(); await P.wait_for_timeout(600); await P.click('[data-tab=events]')
        ok("ticking provisional shows it, marked Provisional", "100 m" in await P.inner_text('#pmain'))
        # off again
        await O.click('[data-act=ptog]'); await O.wait_for_timeout(300)
        await P.reload(); await P.wait_for_timeout(600)
        ok("turned off again: back to 'Results will be here'", "Results will be here on the day" in await P.inner_text('#pmain'))
        ok("no page errors " + str(errs[:2]), errs == [])
        await b.close()
    print("\n%d failed" % len(fails)); sys.exit(1 if fails else 0)
asyncio.run(main())
