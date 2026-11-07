"""Tests the Time Slips switch, Take photo or Multi (A1.5, A1.6, Aths Opt 1.9) in test mode.
Usage: python3 tests/slips_mode_test.py <page url with ?mode=local>"""
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
        # race 1: a normal 100 m with three runners in lanes 3, 5 and 6; race 2: an 800 m sent by the marshal (no lanes)
        await O.evaluate("""(async()=>{const s=A.roster.M.filter(x=>x.g==='17');window.__ids=[s[0].id,s[1].id,s[2].id];
          await A.store.set('heats/r0001',{race:1,k:'100',x:'M',g:'17',heat:1,lanes:{3:s[0].id,5:s[1].id,6:s[2].id},at:Date.now()});
          await A.store.set('heats/r0002',{race:2,k:'800',x:'M',g:'17',heat:1,multi:true,lanes:{},at:Date.now()});
          await A.store.set('counter/race',{next:3,at:Date.now()})})()"""); await O.wait_for_timeout(500)
        S = await app("4444")
        ok("the switch is always shown: Take photo and Multi", await S.locator('[data-act=smode]').count() == 2)
        ok("a normal race opens on Take photo, with the camera", await S.locator('[data-act=smode][data-v=photo]').get_attribute('aria-pressed') == 'true' and await S.locator('label.cam').count() == 1)
        await S.click('[data-act=smode][data-v=multi]'); await S.wait_for_timeout(250)
        ok("Multi on a normal race uses the runners already in the lanes", "3 runners" in await S.inner_text('.racebar') or "3 runner" in (await S.inner_text('.racebar')).replace("runners", "runner"))
        ok("the lanes cannot be renamed from the multitimer on a normal race", await S.locator('[data-act=mtrename]').count() == 0)
        await S.click('[data-act=mtgo]'); await S.wait_for_timeout(300)
        ok("while the clock runs the other choice is locked", await S.locator('[data-act=smode][data-v=photo]').is_disabled())
        for _ in range(3):
            await S.click('[data-act=mtsplit]'); await S.wait_for_timeout(250)
        await S.click('[data-act=mtstop]'); await S.wait_for_timeout(250)
        ok("while the places are being tapped the other choice stays locked, with a note", await S.locator('[data-act=smode][data-v=photo]').is_disabled() and "Send or clear" in await S.inner_text('#main'))
        ids = await O.evaluate("window.__ids")
        # tap the runners in finish order: second, first, third
        for i in (1, 0, 2):
            await S.click(f'[data-act=mttap][data-id="{ids[i]}"]'); await S.wait_for_timeout(150)
        await S.click('[data-act=mtsend]'); await S.wait_for_timeout(500)
        t = await S.evaluate("A.times.r0001"); f = await S.evaluate("A.finish.r0001")
        ok("times go to the runners' own lanes (3, 5 and 6), not lanes 1 to 3", sorted((t or {}).get('lanes', {}).keys()) == ['3', '5', '6'])
        ok("places come with it: the Place Judge's record is written, in finish order", f and f.get('ok') is True and f.get('seq') == ['5', '3', '6'])
        ok("the race has its places from the multitimer (no judge needed)", await S.evaluate("A.R.races.get(1).placesIn")==True)
        ok("after sending a normal race: Next race is offered (race 2 is waiting) and 'New age or event' is not", await S.locator('[data-act=mtnext]').count() == 1 and await S.locator('[data-act=mtnew]').count() == 0)
        # race 2: an 800 m opens on Multi, and Take photo says there are no names
        await S.click('[data-act=smode][data-v=photo]'); await S.wait_for_timeout(200)
        await S.evaluate("A.s.race=2;render()"); await S.wait_for_timeout(250)
        ok("an 800 m race with no lanes opens on Multi", await S.locator('[data-act=smode][data-v=multi]').get_attribute('aria-pressed') == 'true')
        await S.click('[data-act=smode][data-v=photo]'); await S.wait_for_timeout(250)
        ok("Take photo on a race with no names says so and offers no camera", "no names yet" in await S.inner_text('#main') and await S.locator('label.cam').count() == 0)
        await S.click('[data-act=smode][data-v=multi]'); await S.wait_for_timeout(250)
        ok("back on Multi it starts at the names", "Tap each runner" in await S.inner_text('#main'))
        # the choice is kept after a reload
        await S.reload(); await S.wait_for_function("typeof A!=='undefined'&&!!A.store"); await S.wait_for_timeout(500)
        ok("the choice is kept after a reload", await S.locator('[data-act=smode]').count() == 2)
        ok("no page errors " + str(errs[:2]), errs == [])
        await b.close()
    print("\n%d failed" % len(fails)); sys.exit(1 if fails else 0)
asyncio.run(main())
