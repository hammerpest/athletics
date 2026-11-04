import asyncio
from playwright.async_api import async_playwright
URL="http://127.0.0.1:8140/index.html?mode=local"
async def main():
  async with async_playwright() as pw:
    b=await pw.chromium.launch(); ctx=await b.new_context(viewport={"width":390,"height":844})
    async def page(pin):
        p=await ctx.new_page(); await p.goto(URL); await p.wait_for_function("!!A.store")
        for k in pin: await p.click(f'.keypad [data-k="{k}"]')
        await p.click('[data-act=pinstart]'); await p.wait_for_timeout(100); return p
    O=await page("9999"); await O.click('.tile[data-job=organiser]'); await O.click('[data-act=osec][data-v=students]'); await O.click('[data-act=oload]'); await O.click('[data-act=otest]'); await O.click('[data-act=oimport]'); await O.wait_for_timeout(200)
    M=await page("1111"); await M.evaluate("(async()=>{const m=A.m;m.k='800';m.x='F';m.g='16';m.phase='start';await marshalGo()})()"); await M.wait_for_timeout(200)
    S=await page("4444")
    for i in range(3): await S.click(f'.namebtn >> nth={i}')
    await S.click('[data-act=mtnames]'); await S.click('[data-act=mtgo]')
    for i in range(2): await S.click('[data-act=mtsplit]')
    await S.click('[data-act=mtstop]'); await S.click('[data-act=mtstopok]'); await S.wait_for_timeout(100)
    ys=lambda: S.evaluate("[...document.querySelectorAll('.spot')].map(b=>Math.round(b.getBoundingClientRect().top))")
    y0=await ys(); res=[]
    for i in range(3):
        await S.click(f'.spot >> nth={i}'); await S.wait_for_timeout(60); res.append(await ys()==y0)
    print("buttons steady through every tap on a phone:",res); await b.close()
asyncio.run(main())
