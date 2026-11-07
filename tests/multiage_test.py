"""Tests the 800 m and 1500 m with several ages in one race (A1.2, A1.5, Aths Opt 2.0, decisions 102 to 104).
Usage: python3 tests/multiage_test.py <page url with ?mode=local>"""
import asyncio, sys
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8126/index.html?mode=local"
fails = []; errs = []
def ok(name, cond):
    print(("PASS " if cond else "FAIL ") + name, flush=True)
    if not cond: fails.append(name)
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(); ctx = await b.new_context(viewport={"width": 1180, "height": 820})
        async def app(pin, w=1180, h=820):
            p = await ctx.new_page(); p.on("pageerror", lambda e: errs.append(str(e))); await p.set_viewport_size({"width": w, "height": h})
            await p.goto(URL); await p.wait_for_function("typeof A!=='undefined'&&!!A.store"); await p.wait_for_timeout(200)
            for k in pin: await p.click(f'.keypad [data-k="{k}"]')
            await p.click('[data-act=pinstart]'); await p.wait_for_timeout(250); return p
        O = await app("9999", 1512, 982)
        await O.click('.tile[data-job=organiser]'); await O.click('[data-act=osec][data-v=students]'); await O.click('[data-act=oload]'); await O.click('[data-act=otest]'); await O.click('[data-act=oimport]'); await O.wait_for_timeout(800)
        M = await app("1111")
        await M.click('[data-act=mpick][data-f=k][data-v="800"]'); await M.click('[data-act=mpick][data-f=x][data-v=F]')
        ok("the 800 m lists every age as tick boxes, with All ages", await M.locator('[data-act=mpick][data-f=gs]').count() == 6 and await M.locator('[data-act=mpickall]').count() == 1)
        await M.click('[data-act=mgo]'); await M.wait_for_timeout(200)
        ok("Go with no age ticked says what is missing", "at least one age" in await M.inner_text('.modal') or "at least one age" in (await M.inner_text('#main')))
        await M.evaluate("A.modal=null;render()"); await M.wait_for_timeout(100)
        await M.click('[data-act=mpick][data-f=gs][data-v="14"]'); await M.click('[data-act=mpick][data-f=gs][data-v="15"]'); await M.wait_for_timeout(150)
        ok("two ages ticked: the race name lists both", "Girls 14, 15" in await M.inner_text('#main'))
        await M.click('[data-act=mgo]'); await M.wait_for_timeout(500)
        h = await M.evaluate("A.heats.map(h=>({k:h.k,x:h.x,g:h.g,gs:h.gs,multi:h.multi,lanes:Object.keys(h.lanes||{}).length}))")
        ok("the race is stored once with both ages and no lanes", len(h) == 1 and h[0]['gs'] == ['14', '15'] and h[0]['multi'] and h[0]['lanes'] == 0)
        S = await app("4444", 390, 844)
        names = await S.evaluate("[...document.querySelectorAll('.namebtn')].length")
        want = await S.evaluate("students().filter(s=>s.x==='F'&&(s.g==='14'||s.g==='15')).length")
        ok("the multitimer lists the girls of both ages: " + str(want), names == want and names > 0)
        ok("the race is named with both ages on the multitimer phone", "Girls 14, 15" in await S.inner_text('.racebar'))
        ids = await S.evaluate("(()=>{const a=students().filter(s=>s.x==='F'&&s.g==='14').slice(0,2).map(s=>s.id);const b=students().filter(s=>s.x==='F'&&s.g==='15').slice(0,2).map(s=>s.id);return {a,b}})()")
        order = [ids['b'][0], ids['a'][0], ids['b'][1], ids['a'][1]]
        for i in order:
            await S.evaluate(f"document.querySelector('.namebtn[data-id=\"{i}\"]').click()"); await S.wait_for_timeout(60)
        await S.click('[data-act=mtnames]'); await S.wait_for_timeout(150); await S.click('[data-act=mtgo]'); await S.wait_for_timeout(100)
        for _ in range(4):
            await S.click('[data-act=mtsplit]'); await S.wait_for_timeout(120)
        await S.click('[data-act=mtstop]'); await S.wait_for_timeout(150)
        for i in order:
            await S.click(f'[data-act=mttap][data-id="{i}"]'); await S.wait_for_timeout(100)
        await S.click('[data-act=mtsend]'); await S.wait_for_timeout(600)
        g14 = await S.evaluate("A.R.groups.get('800|F|14').rows.map(r=>[r.id,r.place,r.pts])")
        g15 = await S.evaluate("A.R.groups.get('800|F|15').rows.map(r=>[r.id,r.place,r.pts])")
        ok("age 14 is scored on its own: 1st and 2nd get 10 and 8 points", [r[1] for r in g14] == [1, 2] and [r[2] for r in g14] == [10, 8] and g14[0][0] == ids['a'][0])
        ok("age 15 is scored on its own: 1st and 2nd get 10 and 8 points", [r[1] for r in g15] == [1, 2] and [r[2] for r in g15] == [10, 8] and g15[0][0] == ids['b'][0])
        ok("each age has one race in its results", await S.evaluate("A.R.groups.get('800|F|14').heats.length==1&&A.R.groups.get('800|F|15').heats.length==1"))
        # New age or event on the phone: ages are tick boxes too, All ages ticks all
        await S.click('[data-act=mtnew]'); await S.wait_for_timeout(250)
        ok("New age or event: the 1500 m is there and every age is a tick box", await S.locator('[data-f=k]').count() == 2 and await S.locator('[data-f=g]').count() == 6)
        await S.click('[data-f=all]'); await S.wait_for_timeout(100)
        ok("All ages ticks all six", await S.locator('[data-f=g][aria-pressed=true]').count() == 6)
        await S.click('[data-f=all]'); await S.wait_for_timeout(100)
        ok("All ages again clears them, and Take names needs an age", await S.locator('[data-f=g][aria-pressed=true]').count() == 0)
        # the Open 1500 m is gone: 1500 m girls shows ages for the Marshal
        await M.evaluate("A.m.phase='start';A.m.k=null;A.m.x=null;A.m.gs=[];render()"); await M.wait_for_timeout(100)
        await M.click('[data-act=mpick][data-f=k][data-v="1500"]'); await M.click('[data-act=mpick][data-f=x][data-v=F]'); await M.wait_for_timeout(100)
        ok("the Marshal's 1500 m lists every age, not Open", await M.locator('[data-act=mpick][data-f=gs]').count() == 6)
        ok("no page errors " + str(errs[:2]), errs == [])
        await b.close()
    print("\n%d failed" % len(fails)); sys.exit(1 if fails else 0)
asyncio.run(main())
