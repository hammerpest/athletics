"""Live tests against the Supabase project in js/config.js (use the STAGING project only).
Clears the project's carnival data first and again at the end. Made-up data only.
Run: python3 tests/supabase_live.py <site url, no ?mode=local>   (the site is served with js/config.js filled in)
Covers: the security rules over the web API (no PIN, wrong job, race numbers from two devices at once,
the field final lock, a past year), then two real browsers (organiser and Field Station) that share data live,
and a phone that goes offline and sends when the signal is back."""
import asyncio, json, os, re, sys, time, urllib.request, urllib.error, threading
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8126/index.html"
cfg = open(os.path.join(ROOT, "js", "config.js")).read()
SB = re.search(r'url:"([^"]+)"', cfg).group(1); KEY = re.search(r'key:"([^"]+)"', cfg).group(1)
HASH = {"marshal": "561d75f0", "judge": "e573e56c", "recorder": "c2769690", "slips": "29e1344", "announcer": "a423a790", "field": "e257c26c", "org": "cfaf6170"}
TABLES = ["extras", "heats", "times", "finish", "slips", "field", "records", "counter", "years", "archive", "roster", "config"]
fails = []
def check(ok, name):
    print(("ok  " if ok else "FAIL"), name, flush=True); ok or fails.append(name)

def req(path, body=None, tok=None, method=None):
    h = {"apikey": KEY, "Content-Type": "application/json"}
    if tok: h["Authorization"] = "Bearer " + tok
    r = urllib.request.Request(SB + path, data=json.dumps(body).encode() if body is not None else None, headers=h, method=method)
    try:
        with urllib.request.urlopen(r) as f:
            t = f.read(); return f.status, (json.loads(t) if t else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]

def device(role=None):
    s, a = req("/auth/v1/signup", {}); tok = a["access_token"]
    if role: req("/rest/v1/rpc/claim_role", {"pin_hash": HASH[role]}, tok)
    return tok

def rows(t, tok):
    s, r = req(f"/rest/v1/{t}?select=id,doc", tok=tok); return r if isinstance(r, list) else []

def wipe(org):
    req("/rest/v1/rpc/set_year", {"y": "current"}, org)
    req("/rest/v1/rpc/doc_update", {"tbl": "config", "doc_id": "main", "patch": {"locked": False}}, org)
    for t in TABLES: req(f"/rest/v1/{t}?id=neq.__none__", tok=org, method="DELETE")

async def wait_for(fn, secs, step=0.4):
    end = time.time() + secs
    while time.time() < end:
        if await fn(): return True
        await asyncio.sleep(step)
    return False

async def main():
    org = device("org"); wipe(org)
    check(not rows("heats", org) and not rows("roster", org), "project cleared")

    # ---- security over the web API
    x = device()
    check(rows("roster", x) == [] and req("/rest/v1/heats", [{"id": "r0001", "doc": {}}], x)[0] >= 400, "no job: cannot read or write")
    check(req("/rest/v1/rpc/claim_role", {"pin_hash": "0000"}, x)[1] is None, "wrong PIN refused")
    check(req("/rest/v1/private.pins", tok=x)[0] >= 400 and req("/rest/v1/pins?select=*", tok=x)[0] >= 400, "the PIN table cannot be read")
    anon = req("/rest/v1/roster?select=*")  # no sign-in at all: only the public key
    check(anon[0] >= 400 or anon[1] == [], "public key alone sees nothing")
    for role in HASH:
        t = device(); got = req("/rest/v1/rpc/claim_role", {"pin_hash": HASH[role]}, t)[1]
        check(got == role, "test PIN gives " + role)
    m, m2, sl = device("marshal"), device("marshal"), device("slips")
    check(req("/rest/v1/heats", [{"id": "r0001", "doc": {"race": 1}}], m)[0] < 300, "marshal writes a heat")
    fd = device("field"); rc = device("recorder")
    check(req("/rest/v1/field", [{"id": "f1", "doc": {"k": "LJ"}}], fd)[0] < 300, "field station writes a group")
    check(req("/rest/v1/field", [{"id": "f2", "doc": {}}], m)[0] >= 400, "marshal cannot write field")
    check(req("/rest/v1/rpc/doc_update", {"tbl": "field", "doc_id": "f1", "patch": {"final": True}}, fd)[0] < 300, "field station finishes a group")
    check(req("/rest/v1/rpc/doc_update", {"tbl": "field", "doc_id": "f1", "patch": {"marks": {"s1": 1}}}, fd)[0] >= 400, "a finished group: the field station cannot change it")
    check(req("/rest/v1/rpc/doc_update", {"tbl": "field", "doc_id": "f1", "patch": {"marks": {"s1": 1}}}, rc)[0] < 300, "a finished group: the Recorder can")
    got, lock = [], threading.Lock()
    def send(tok, n):
        for _ in range(n):
            s, v = req("/rest/v1/rpc/next_race", {"dev": "x"}, tok)
            with lock: got.append(v)
    ts = [threading.Thread(target=send, args=(t, 10)) for t in (m, m2, sl)]
    [t.start() for t in ts]; [t.join() for t in ts]
    check(sorted(got) == list(range(1, 31)), "three devices at once: 30 race numbers, no gaps or repeats")
    req("/rest/v1/rpc/doc_update", {"tbl": "config", "doc_id": "main", "patch": {"locked": True}}, org)
    check(req("/rest/v1/heats", [{"id": "r0002", "doc": {}}], m)[0] >= 400, "locked: marshal cannot write")
    req("/rest/v1/rpc/doc_update", {"tbl": "config", "doc_id": "main", "patch": {"locked": False}}, org)
    req("/rest/v1/rpc/set_year", {"y": "2026"}, org)
    check(req("/rest/v1/heats", [{"id": "r0003", "doc": {}}], org)[0] >= 400, "past year open: even the organiser cannot write")
    req("/rest/v1/rpc/set_year", {"y": "current"}, org)
    wipe(org)

    # ---- two browsers sharing data live
    async with async_playwright() as pw:
        b = await pw.chromium.launch(); errs = []
        async def page(w, h):
            ctx = await b.new_context(viewport={"width": w, "height": h})
            p = await ctx.new_page(); p.on("pageerror", lambda e: errs.append(str(e)))
            await p.goto(URL); await p.wait_for_function("typeof A!=='undefined'&&!!A.store"); await asyncio.sleep(1.0)
            return ctx, p
        async def login(p, code):
            for k in code: await p.click(f'.keypad [data-k="{k}"]')
            await p.click('[data-act=pinstart]'); await asyncio.sleep(1.5)
        oc, O = await page(1512, 982)
        check(await O.evaluate("A.store.mode") == "supabase", "the page uses Supabase (not test mode)")
        await login(O, "9999")
        check(await O.evaluate("A.role") == "org", "organiser signs in with the PIN, checked on the server")
        await O.click('.tile[data-job=organiser]'); await O.click('[data-act=osec][data-v=students]'); await O.click('[data-act=oload]'); await O.click('[data-act=otest]'); await O.click('[data-act=oimport]')
        check(await wait_for(lambda: O.evaluate("A.roster.F.length+A.roster.M.length===620"), 25), "620 test students imported")
        fc, F = await page(1180, 820)
        await login(F, "6666")
        check(await F.evaluate("A.role") == "field", "Field Station signs in")
        check(await wait_for(lambda: F.evaluate("A.roster.F.length+A.roster.M.length===620"), 25), "the Field Station sees the students live")
        # wrong PIN on a third device
        wc, W = await page(390, 844)
        await login(W, "0000")
        check(await W.evaluate("A.role") is None and await W.evaluate("A.pinErr"), "a wrong PIN is refused on the page")
        # a field group opens, a mark is saved on one device and appears on the other
        gk = "LJ|M|17"
        await F.evaluate(f"(async()=>{{const f=A.R.fgroups.find(f=>f.key==='{gk}');A.f.station=f.station;fOpen(f.id);const l=eligible(eventOf(A.cfg,f.k),f.x,f.g);for(let i=0;i<3;i++)await fieldAdd(f,l[i].id);await fieldStart()}})()")
        check(await wait_for(lambda: O.evaluate("Object.values(A.field).some(d=>d.k==='LJ'&&Object.values(d.ath||{}).filter(v=>v>0).length===3)"), 40), "the organiser sees the 3 athletes taken at the Field Station")
        if "the organiser sees the 3 athletes taken at the Field Station" in fails:
            print("DEBUG org:", await O.evaluate("JSON.stringify(A.field)"), "\nDEBUG field:", await F.evaluate("JSON.stringify(A.field)"))
        # offline: the phone keeps a mark and sends it when the signal is back
        await F.evaluate("A.store.pending()")
        await fc.set_offline(True); await asyncio.sleep(0.5)
        await F.evaluate("(async()=>{const f=fieldGroupOpen();const id=Object.keys(fieldDocOf(f).ath)[0];await fieldWrite(f,{marks:{[id]:{a:{1:'x'}}}})})()")
        await asyncio.sleep(1)
        check(await F.evaluate("A.store.pending()") >= 1, "offline: the mark waits in the queue")
        check(not await O.evaluate("Object.values(A.field).some(d=>JSON.stringify(d.marks||{}).includes('\"x\"'))"), "offline: the organiser has not got it yet")
        await fc.set_offline(False)
        check(await wait_for(lambda: O.evaluate("Object.values(A.field).some(d=>JSON.stringify(d.marks||{}).includes('\"x\"'))"), 30), "back online: the mark arrives on the organiser's screen")
        check(await wait_for(lambda: F.evaluate("A.store.pending()===0"), 30), "back online: the queue is empty")
        # sign out gives up the job on the server
        await F.evaluate("signOut()"); await asyncio.sleep(1.5)
        s, st = await F.evaluate("fetch(ATHS_CONFIG.url+'/rest/v1/rpc/my_role',{method:'POST',headers:{apikey:ATHS_CONFIG.key,'Content-Type':'application/json',Authorization:'Bearer '+Object.values(sessionStorage).map(v=>{try{return JSON.parse(v).access_token}catch(e){return null}}).find(Boolean)},body:'{}'}).then(r=>r.json()).then(j=>[200,j])")
        check(st is None, "sign out: the server forgets the job")
        check(errs == [], "no page errors " + str(errs[:2]))
        await b.close()
    wipe(org)
    print("\n%d failed" % len(fails))
    for n in fails: print("  FAIL", n)
    sys.exit(1 if fails else 0)

asyncio.run(main())
