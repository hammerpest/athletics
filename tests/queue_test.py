"""Tests the offline queue (makeQueue in js/store-local.js) in a real browser page, in test mode.
Checks: an item waits for the job that queued it; another job's items are not sent or dropped by it; a refused item is dropped
and reported; a network failure keeps the item. Usage: python3 tests/queue_test.py <page url>"""
import asyncio, sys
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8126/index.html?mode=local"
fails = []
def check(ok, name):
    print(("ok  " if ok else "FAIL"), name, flush=True); ok or fails.append(name)
JS = """(async()=>{
  localStorage.setItem('aths_queue','[]');
  let job='field', offline=true; const sent=[], dropped=[];
  const write=async w=>{ if(offline) throw {code:'offline'}; if(String(w.path).startsWith('bad')) throw {code:'invalid_argument'}; sent.push(w.path+'@'+w.job) };
  const Q=makeQueue(write,null,()=>true,()=>job,w=>dropped.push(w.path));
  const out={};
  await Q.run({op:'set',path:'field/a',data:{}});             // Field Station, no signal: queued
  job='marshal'; await Q.run({op:'set',path:'heats/b',data:{}}); // Marshal, no signal: queued
  out.queuedBoth=Q.size();
  offline=false; await Q.flush();                              // signal back, signed in as Marshal
  out.afterMarshal=[...sent]; out.leftAfterMarshal=Q.size();
  job='field'; await Q.flush();
  out.afterField=[...sent]; out.leftAfterField=Q.size();
  job='field'; await Q.run({op:'set',path:'bad/x',data:{}}).catch(e=>{out.refusedThrown=e.code});   // refused while online: thrown to the page
  offline=true; job='field'; await Q.run({op:'set',path:'field/c',data:{}}); offline=false;
  await Q.flush(); out.afterC=[...sent];
  // a refused item that was already waiting is dropped and reported
  offline=true; await Q.run({op:'set',path:'bad/y',data:{}}); offline=false; await Q.flush();
  out.dropped=[...dropped]; out.leftEnd=Q.size();
  return out;
})()"""
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(); p = await b.new_page()
        errs = []; p.on("pageerror", lambda e: errs.append(str(e)))
        await p.goto(URL); await p.wait_for_function("typeof makeQueue==='function'")
        o = await p.evaluate(JS)
        check(o["queuedBoth"] == 2, "two jobs' items wait with no signal")
        check(o["afterMarshal"] == ["heats/b@marshal"] and o["leftAfterMarshal"] == 1, "signal back as Marshal: only the Marshal's item is sent; the Field Station's waits")
        check(o["afterField"] == ["heats/b@marshal", "field/a@field"] and o["leftAfterField"] == 0, "back as the Field Station: its item is sent")
        check(o["refusedThrown"] == "invalid_argument", "a write refused while online is reported to the page")
        check("field/c@field" in o["afterC"], "a network failure keeps the item, and it is sent later")
        check(o["dropped"] == ["bad/y"] and o["leftEnd"] == 0, "a waiting item the server refuses is dropped and reported")
        # error classes
        c = await p.evaluate("typeof sbErrClass")
        await b.close()
    print("\n%d failed" % len(fails)); sys.exit(1 if fails else 0)
asyncio.run(main())
