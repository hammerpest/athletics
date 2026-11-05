"""Writes the athletics design canvas boards (A1.x) as .dc.html files, light and dark.
Run: python3 make_boards.py <output root> <css url>"""
import json, sys, os, random, re

OUT, CSS = sys.argv[1], sys.argv[2]
PROJ = os.path.join(OUT, "project")
os.makedirs(PROJ, exist_ok=True)
STU = json.load(open("/Users/jordan.dennis/SWIM 2027- App/ccas-swimming/src/test-students.json"))["students"]

def names(x, g, n, seed=1):
    """Made-up test students of one sex and age group, as JS-ready dicts."""
    pool = [s for s in STU if s["x"] == x and s["g"] == g]
    random.Random(seed).shuffle(pool)
    return [{"n": s["f"] + " " + s["s"], "h": s["h"]} for s in pool[:n]]

J = lambda v: json.dumps(v, ensure_ascii=False)

FONT = 'https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@500;700;800;900&amp;family=Red+Hat+Mono:wght@500;700;800&amp;family=Red+Hat+Text:wght@400;500;600;700&amp;display=swap'

JOBS = [("Track Marshal", "MarshalPick"), ("Place Judge", "PlaceJudge"), ("Recorder", "Recorder"),
        ("Time Slips", "TimeSlips"), ("Field Station", "FieldStart"), ("Announcer", "Announcer"),
        ("Carnival Organiser", "Organiser")]

CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>'

def lnk(name, dark):
    return name + ("Dark" if dark else "") + ".dc.html"

def jobmenu(job, dark):
    rows = ""
    for i, (label, f) in enumerate(JOBS):
        tick = '<span class="tick">Here</span>' if label == job else ""
        rows += f'<a href="{lnk(f, dark)}"><span class="n">{i+1}</span>{label}{tick}</a>\n'
    return f'''<sc-if value="{{{{menu}}}}" hint-placeholder-val="{{{{false}}}}">
<div class="jobmenu"><div class="label">Change job</div>
{rows}<hr><a href="{lnk("Main", dark)}">Sign out (back to PIN)</a></div>
</sc-if>'''

def header(badge, job, dark, slim=False, extra="", sub="CCAS Athletics Carnival 2027"):
    pill = f'<div class="jobpill"><button type="button" onClick="{{{{toggleMenu}}}}">Job: {job}{CHEV}</button>{jobmenu(job, dark)}</div>'
    if slim:
        return f'<header class="top slim"><div class="wrap"><div class="topin"><span class="live"><i></i>Live, 9 devices</span>{pill}</div></div></header>'
    return f'''<header class="top"><div class="wrap"><div class="topin">
<span class="jobbadge">{badge}</span>
<div class="ttl"><b>Athletics Carnival 2027</b><small>{sub}</small></div>
{extra}<span class="live"><i></i>Live, 9 devices</span>{pill}
</div></div></header>'''

def untable(b):
    """A loop tag inside a real table is thrown out by the HTML parser, so boards use
    CSS tables: same look, with table roles for screen readers."""
    def tag(name, cl, role):
        def f(m):
            a = m.group(1)
            c = re.search(r'class="([^"]*)"', a)
            rest = re.sub(r'\s*class="[^"]*"', "", a)
            k = (cl + " " + c.group(1)).strip() if c else cl
            return f'<div class="{k}" role="{role}"{rest}>'
        return f
    for t, cl, role in (("table","tb","table"),("thead","thg","rowgroup"),("tbody","tbg","rowgroup"),("tr","tr","row"),("th","th","columnheader"),("td","td","cell")):
        b = re.sub(r"<%s\b([^>]*)>" % t, tag(t, cl, role), b)
        b = b.replace("</%s>" % t, "</div>")
    return b

def page(title, w, h, body, logic, dark, init="{}"):
    body = untable(body)
    cls = "aths dark" if dark else "aths"
    return f'''<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
<link rel="stylesheet" href="{CSS}">
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="{FONT}" rel="stylesheet">
<style>body{{margin:0}}</style>
</helmet>
<div class="{cls}" style="width: {w}px; height: {h}px">
{body}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
  constructor(props) {{ super(props); this.state = Object.assign({{ menu: false }}, {init}); }}
  renderVals() {{
    const st = this.state;
    const set = (o) => this.setState(o);
    const base = {{ menu: st.menu, toggleMenu: () => set({{ menu: !st.menu }}) }};
    let out = {{}};
{logic}
    return Object.assign(base, out);
  }}
}}
</script>
</body>
</html>
'''

BOARDS = []
def board(file, title, w, h, fn, x, y, radius=18, interactive=True):
    BOARDS.append(dict(file=file, title=title, w=w, h=h, fn=fn, x=x, y=y, radius=radius, interactive=interactive))

IPAD = (1180, 820); MAC = (1512, 982); PHONE = (390, 844)

# ---------- the timetable, from docs/2026 timetable.png ----------
AGES = ["18+", "17", "16", "15", "14", "12 & 13"]
BLOCKS = [
 ("9:15 am",  "Boys",  "100 m", "Girls", ["HJ1","LJ1","LJ2","D1","SP","D2"]),
 ("9:55 am",  "Girls", "100 m", "Boys",  ["HJ2","LJ1","LJ2","D2","SP","D1"]),
 ("10:40 am", "Boys",  "800 m", "Girls", ["LJ1","SP","D2","SP","HJ1","HJ2"]),
 ("11:10 am", "Girls", "800 m", "Boys",  ["LJ2","D1","SP","SP","HJ2","HJ1"]),
 ("11:40 am", "Boys",  "200 m", "Girls", ["SP","D1","SP","HJ1","LJ1","LJ2"]),
 ("12:10 pm", "Girls", "200 m", "Boys",  ["SP","SP","D2","HJ2","LJ2","LJ1"]),
 ("12:40 pm", "Boys",  "400 m", "Girls", ["D1","HJ1","HJ2","LJ1","D2","SP"]),
 ("1:10 pm",  "Girls", "400 m", "Boys",  ["D2","HJ1","HJ2","LJ2","D1","SP"]),
]
STN = {"HJ1":"High Jump 1","HJ2":"High Jump 2","LJ1":"Long Jump 1","LJ2":"Long Jump 2","D1":"Discus 1","D2":"Discus 2","SP":"Shot Put"}

# ---------- A1.1 Home ----------
def home(dark):
    tiles = [("1","Track Marshal","Put runners in lanes and send each heat","MarshalPick"),
             ("2","Place Judge","Tap the top places in each heat","PlaceJudge"),
             ("3","Recorder","Check times and marks","Recorder"),
             ("4","Time Slips","Photograph each printed time slip","TimeSlips"),
             ("5","Field Station","Enter attempts and marks at your station","FieldStart"),
             ("6","Announcer","Read results, records and house points","Announcer")]
    jobs = [(1,1,"Track Marshal","Put runners in lanes and send each heat","MarshalPick",""),(2,2,"Place Judge","Tap the top places in each heat","PlaceJudge",""),
            (3,3,"Recorder","Check times and marks","Recorder",""),(4,4,"Time Slips","Photograph each printed time slip","TimeSlips",""),
            (5,6,"Field Station","Enter attempts and marks at your station","FieldStart",""),(6,5,"Announcer","Read results, records and house points","Announcer",""),
            (7,9,"Carnival Organiser","Organiser only","Organiser"," orgtile")]
    tiles = "".join(f'<sc-if value="{{{{show.j{pin}}}}}" hint-placeholder-val="{{{{true}}}}"><a class="tile{c}" href="{lnk(f,dark)}"><span class="n">{n}</span><b>{l}</b><span>{d}</span></a></sc-if>\n' for n,pin,l,d,f,c in jobs)
    body = f'''<header class="top"><div class="wrap"><div class="topin"><div class="ttl"><b>Athletics Carnival 2027</b><small>CCAS Athletics Carnival 2027</small></div><span class="live"><i></i>Live, 9 devices</span></div></div></header>
<div class="scroll"><main class="wrap">
<sc-if value="{{{{showPin}}}}" hint-placeholder-val="{{{{true}}}}">
<div class="home"><h1>Athletics Carnival</h1><p class="muted" style="margin:0">Enter your PIN.</p>
<div class="dots"><sc-for list="{{{{dots}}}}" as="d" hint-placeholder-count="4"><i class="{{{{d.c}}}}"></i></sc-for></div>
<div class="keypad"><sc-for list="{{{{keys}}}}" as="k" hint-placeholder-count="12"><button type="button" onClick="{{{{k.press}}}}" aria-label="{{{{k.aria}}}}">{{{{k.label}}}}</button></sc-for></div>
<sc-if value="{{{{wrong}}}}" hint-placeholder-val="{{{{false}}}}"><div class="msg bad" role="alert">That PIN is not right. Try again.</div></sc-if>
<sc-if value="{{{{direct}}}}" hint-placeholder-val="{{{{false}}}}"><a class="btn primary big" style="width:276px" href="{{{{href}}}}">Start</a></sc-if><sc-if value="{{{{notDirect}}}}" hint-placeholder-val="{{{{true}}}}"><button type="button" class="btn primary big" style="width:276px" onClick="{{{{start}}}}">Start</button></sc-if>
</div>
</sc-if>
<sc-if value="{{{{showJobs}}}}" hint-placeholder-val="{{{{false}}}}">
<div class="home"><h1>Athletics Carnival</h1><p class="muted" style="margin:0">{{{{jobsLine}}}}</p>
<div class="tiles">{tiles}</div>
<button type="button" class="linkbtn" onClick="{{{{signout}}}}">Sign out (back to PIN)</button>
</div>
</sc-if>
</main></div>'''
    links = {str(pin): lnk(f, dark) for n, pin, l, d, f, c in jobs if pin != 9}
    logic = "const JL = " + J(links) + r'''
    const labels = ['1','2','3','4','5','6','7','8','9','Clear','0','Back'];
    const keys = labels.map((l) => ({ label: l, aria: /^[0-9]$/.test(l) ? 'Digit ' + l : l, press: () => {
      if (/^[0-9]$/.test(l)) { if (st.pin.length < 4) set({ pin: st.pin + l, wrong: false }); }
      else if (l === 'Clear') set({ pin: '' }); else set({ pin: st.pin.slice(0, -1) }); } }));
    const show = {}; [1,2,3,4,5,6,9].forEach((k) => { show['j' + k] = st.org ? true : k === Number(st.pin[0]); });
    const direct = st.pin.length === 4 && !!JL[st.pin[0]];
    out = { showPin: !st.ok, showJobs: st.ok, wrong: st.wrong, keys, show, direct, notDirect: !direct, href: direct ? JL[st.pin[0]] : '', jobsLine: st.org ? 'Choose your job.' : 'Your job.',
      dots: [0,1,2,3].map((i) => ({ c: i < st.pin.length ? 'on' : '' })),
      start: () => { if (st.pin.length < 4) return; if (st.pin !== '9999' && !(Number(st.pin[0]) >= 1 && Number(st.pin[0]) <= 6)) set({ pin: '', wrong: true }); else set({ ok: true, org: st.pin === '9999' }); },
      signout: () => set({ ok: false, pin: '', org: false }) };
'''
    return body, logic, "{ pin: '', ok: false, org: false, wrong: false }"

# ---------- A1.2 Track Marshal: pick the race ----------
def marshal_pick(dark):
    body = header("TRACK MARSHAL","Track Marshal",dark) + f'''
<div class="scroll"><main class="wrap"><div class="stack" style="max-width:1040px;margin:0 auto">
<div class="mrow"><span class="label">Race</span><div class="choices"><sc-for list="{{{{ev}}}}" as="c" hint-placeholder-count="6"><button type="button" class="choice" aria-pressed="{{{{c.on}}}}" onClick="{{{{c.tap}}}}">{{{{c.l}}}}</button></sc-for></div></div>
<sc-if value="{{{{showSex}}}}" hint-placeholder-val="{{{{true}}}}"><div class="mrow"><span class="label">Boys or girls</span><div class="choices"><sc-for list="{{{{sex}}}}" as="c" hint-placeholder-count="2"><button type="button" class="choice" aria-pressed="{{{{c.on}}}}" onClick="{{{{c.tap}}}}">{{{{c.l}}}}</button></sc-for></div></div></sc-if>
<div class="mrow"><span class="label">{{{{gLabel}}}}</span><div class="choices"><sc-for list="{{{{grp}}}}" as="c" hint-placeholder-count="6"><button type="button" class="choice" aria-pressed="{{{{c.on}}}}" onClick="{{{{c.tap}}}}">{{{{c.l}}}}</button></sc-for></div></div>
<sc-if value="{{{{showNote}}}}" hint-placeholder-val="{{{{false}}}}"><div class="msg info">{{{{note}}}}</div></sc-if>
<div class="checkline"><span class="racebadge xl"><small>RACE</small><b>3</b></span>
<sc-if value="{{{{notReady}}}}" hint-placeholder-val="{{{{false}}}}"><div class="what not"><span class="label" style="color:var(--warn)">Not ready yet</span><br>Still to choose: {{{{miss}}}}</div></sc-if>
<sc-if value="{{{{ready}}}}" hint-placeholder-val="{{{{true}}}}"><div class="what">{{{{name}}}}<br><span class="muted" style="font:600 .95rem var(--font-body)">Heat 1</span></div></sc-if>
<a class="btn go big" href="{{{{go}}}}">Go</a></div>
<div style="text-align:center"><span class="linkbtn" style="display:inline-block;padding-top:12px">Change an earlier race</span></div>
</div></main></div>'''
    logic = "const F = " + J({"l":lnk("MarshalLanes",dark),"m":lnk("Multitimer",dark),"r":lnk("MarshalRelay",dark)}) + r''';
    const evs = ['100 m','200 m','400 m','800 m','1500 m','4 x 100 m relay'];
    const age = ['12 & 13','14','15','16','17','18+'];
    const band = ['Junior','Intermediate','Senior'];
    const isRelay = st.e === '4 x 100 m relay', is1500 = st.e === '1500 m';
    const groups = isRelay ? band : (is1500 ? ['Open'] : age);
    const g = groups.includes(st.g) ? st.g : (is1500 ? 'Open' : null);
    const miss = [st.e ? null : 'the race', st.x ? null : 'boys or girls', g ? null : (isRelay ? 'the group' : 'the age')].filter(Boolean);
    out = { ev: evs.map((l) => ({ l, on: st.e === l, tap: () => set({ e: l }) })),
      sex: ['Girls','Boys'].map((l) => ({ l, on: st.x === l, tap: () => set({ x: l }) })),
      grp: groups.map((l) => ({ l, on: g === l, tap: () => set({ g: l }) })),
      showSex: true, gLabel: isRelay ? 'Group' : 'Age', showNote: isRelay || st.e === '800 m' || is1500,
      note: isRelay ? 'One team per house. Pick the house for each lane; no names.' : 'No lanes. The person with the multitimer enters the names and times this race on a phone.',
      go: isRelay ? F.r : ((st.e === '800 m' || is1500) ? F.m : F.l),
      notReady: miss.length > 0, ready: miss.length === 0, miss: miss.join(', '),
      name: (st.e || '') + ', ' + (st.x || '') + ' ' + (g || '') };
'''
    return body, logic, "{ e: '100 m', x: 'Boys', g: '18+' }"

# ---------- A1.3 Track Marshal: lanes ----------
def marshal_lanes(dark):
    roster = names("M","18",12,3)
    body = header("TRACK MARSHAL","Track Marshal",dark) + f'''
<div class="scroll"><main class="wrap">
<div class="racebar"><a class="btn" href="{lnk("MarshalPick",dark)}">Back</a><span class="racebadge xl"><small>RACE</small><b>3</b></span>
<div class="info"><b>100 m, Boys 18+</b><span>Heat 1 · {{{{filled}}}} of 8 lanes filled</span></div>
<button type="button" class="btn navy big">Next heat</button><button type="button" class="btn big">New race</button></div>
<div class="pool track"><sc-for list="{{{{lanes}}}}" as="l" hint-placeholder-count="8">
<div class="lane"><div class="blk">{{{{l.n}}}}</div>
<button type="button" class="body" onClick="{{{{l.tap}}}}">
<sc-if value="{{{{l.full}}}}" hint-placeholder-val="{{{{true}}}}"><span class="nm"><span class="hdot h{{{{l.h}}}}">{{{{l.h}}}}</span><span>{{{{l.name}}}}</span></span></sc-if>
<sc-if value="{{{{l.none}}}}" hint-placeholder-val="{{{{false}}}}"><span class="empty">Tap to add a runner</span></sc-if>
</button><div class="wall"></div>
<sc-if value="{{{{l.open}}}}" hint-placeholder-val="{{{{false}}}}"><div class="picklist" style="max-height:230px"><sc-for list="{{{{free}}}}" as="p" hint-placeholder-count="4"><button type="button" class="pick" onClick="{{{{p.tap}}}}"><span class="hdot h{{{{p.h}}}}">{{{{p.h}}}}</span><span>{{{{p.n}}}}</span></button></sc-for></div></sc-if>
</div></sc-for></div>
</main></div>'''
    logic = "const roster = " + J(roster) + r''';
    const used = Object.values(st.lanes);
    const free = roster.map((r, i) => ({ i, n: r.n, h: r.h })).filter((r) => !used.includes(r.i)).map((r) => ({ n: r.n, h: r.h, tap: () => { const L = Object.assign({}, st.lanes); L[st.open] = r.i; let nx = null; set({ lanes: L, open: nx }); } }));
    out = { free, filled: used.length, lanes: [1,2,3,4,5,6,7,8].map((n) => { const i = st.lanes[n]; const r = i === undefined ? null : roster[i];
      return { n, full: !!r, none: !r, h: r ? r.h : 'B', name: r ? r.n : '', open: st.open === n && !r,
        tap: () => { if (r) { const L = Object.assign({}, st.lanes); delete L[n]; set({ lanes: L }); } else set({ open: st.open === n ? null : n }); } }; }) };
'''
    return body, logic, "{ open: null, lanes: {1:0,2:1,3:2,4:3,5:4,6:5} }"

# ---------- phone helpers ----------
def pbar(inner):
    return f'<div class="pbar"><div class="wrap">{inner}</div></div>'

# ---------- A1.4 Place Judge, lanes ----------
def judge(dark):
    roster = names("M","18",8,3)
    body = header("PLACE JUDGE","Place Judge",dark,slim=True) + f'''
<div class="scroll"><main class="wrap" style="padding-top:10px;padding-bottom:96px">
<div class="racebar ph"><span class="racebadge sm"><small>RACE</small><b>3</b></span><div class="info"><b>100 m, Boys 18+</b><span>Heat 1</span></div></div>
<div class="prompt {{{{doneC}}}}">{{{{prompt}}}}</div>
<div class="pool ph track"><sc-for list="{{{{lanes}}}}" as="l" hint-placeholder-count="8">
<div class="lane"><div class="blk">{{{{l.n}}}}</div><div class="body" style="cursor:default"><span class="nm"><span class="hdot h{{{{l.h}}}}">{{{{l.h}}}}</span><span>{{{{l.name}}}}</span></span></div>
<div class="wall">
<sc-if value="{{{{l.spot}}}}" hint-placeholder-val="{{{{true}}}}"><button type="button" class="spot {{{{l.c}}}}" onClick="{{{{l.tap}}}}" aria-label="{{{{l.aria}}}}">{{{{l.pl}}}}</button></sc-if>
<sc-if value="{{{{l.byTime}}}}" hint-placeholder-val="{{{{false}}}}"><span class="bytime">By time</span></sc-if>
</div></div></sc-for></div>
<div class="row" style="margin-top:12px"><button type="button" class="btn">Go to race</button><button type="button" class="btn danger" onClick="{{{{reset}}}}">Start again</button></div>
</main></div>''' + pbar('<button type="button" class="btn" onClick="{{undo}}">Undo last</button><button type="button" class="btn navy">Next race</button>')
    logic = "const roster = " + J(roster) + r''';
    const ord = st.order, done = ord.length >= 4, O = ['1st','2nd','3rd','4th'];
    out = { doneC: done ? 'done' : '', prompt: done ? 'Top 4 placed. Press Next race.' : 'Tap the lane that crossed the line ' + O[ord.length] + (ord.length ? '.' : ' first.'),
      undo: () => set({ order: ord.slice(0, -1) }), reset: () => set({ order: [] }),
      lanes: roster.map((r, i) => { const n = i + 1, p = ord.indexOf(n) + 1;
        return { n, h: r.h, name: r.n, spot: p > 0 || !done, byTime: !p && done, pl: p || '', c: p ? 'p' + p : '', aria: p ? 'Lane ' + n + ', place ' + p + '. Tap to remove' : 'Lane ' + n + ', tap for place ' + (ord.length + 1),
          tap: () => { if (p) set({ order: ord.filter((x) => x !== n) }); else if (!done) set({ order: ord.concat([n]) }); } }; }) };
'''
    return body, logic, "{ order: [5, 2] }"

# ---------- A1.5 Multitimer, 800 m and 1500 m ----------
def multitimer(dark):
    roster = names("F","16",17,5)
    body = header("TIME SLIPS","Time Slips",dark,slim=True) + f'''
<div class="scroll"><main class="wrap" style="padding-top:10px;padding-bottom:96px"><div class="phone" style="gap:10px">
<div class="racebar ph" style="margin:0"><span class="racebadge sm"><small>RACE</small><b>{{{{raceNo}}}}</b></span><div class="info"><b>{{{{label}}}}</b><span>{{{{sub}}}}</span></div></div>
<sc-if value="{{{{isNames}}}}" hint-placeholder-val="{{{{true}}}}">
<div class="prompt" style="margin:0">Tap each runner on the start line.</div>
<label class="label" style="display:flex;flex-direction:column;gap:4px">Find a runner<input type="search" placeholder="Type part of a name"></label>
<div class="namegrid"><sc-for list="{{{{ppl}}}}" as="p" hint-placeholder-count="17"><button type="button" class="namebtn {{{{p.c}}}}" aria-pressed="{{{{p.on}}}}" onClick="{{{{p.tap}}}}"><span class="hdot h{{{{p.h}}}}">{{{{p.h}}}}</span><span class="t">{{{{p.n}}}}</span></button></sc-for></div>
</sc-if>
<sc-if value="{{{{isClock}}}}" hint-placeholder-val="{{{{false}}}}">
<div class="clock {{{{runC}}}}" role="timer">{{{{clock}}}}</div>
<div class="mtbtns"><sc-if value="{{{{isReady}}}}" hint-placeholder-val="{{{{true}}}}"><button type="button" class="btn mtgo" onClick="{{{{go}}}}">START</button></sc-if><sc-if value="{{{{isRun}}}}" hint-placeholder-val="{{{{false}}}}"><button type="button" class="btn mtstop" onClick="{{{{stop}}}}">STOP</button></sc-if><button type="button" class="btn mtsplit" onClick="{{{{split}}}}">SPLIT</button></div>
<div class="panel stack" style="gap:8px"><div class="row" style="justify-content:space-between"><span class="label">Splits</span><span class="chip">{{{{nSp}}}} of {{{{nRun}}}} runners</span></div>
<ol class="splits"><sc-for list="{{{{last}}}}" as="x" hint-placeholder-count="4"><li><b>{{{{x.i}}}}</b><span>{{{{x.t}}}}</span></li></sc-for></ol></div>
<p class="muted" style="margin:0;font-size:.88rem">No need to catch every runner. Stop any time after the top places are in.</p>
</sc-if>
<sc-if value="{{{{isPlace}}}}" hint-placeholder-val="{{{{false}}}}">
<div class="prompt {{{{doneC}}}}" style="margin:0">{{{{prompt}}}}</div>
<div class="pool ph track"><sc-for list="{{{{toPlace}}}}" as="p" hint-placeholder-count="15"><div class="lane" style="grid-template-columns:minmax(0,1fr) auto"><div class="body" style="cursor:default"><span class="nm"><span class="hdot h{{{{p.h}}}}">{{{{p.h}}}}</span><span>{{{{p.n}}}}</span></span></div>
<div class="wall mt"><button type="button" class="spot {{{{p.c}}}}" onClick="{{{{p.tap}}}}" aria-label="{{{{p.aria}}}}">{{{{p.pl}}}}</button><span class="mtt" style="display:block;min-height:18px;min-width:62px;box-sizing:border-box;text-align:center;border-radius:4px;{{{{p.ts}}}}">{{{{p.t}}}}</span></div></div></sc-for></div>
</sc-if>
<sc-if value="{{{{isSent}}}}" hint-placeholder-val="{{{{false}}}}">
<div class="msg ok">Race {{{{raceNo}}}} times sent to the Recorder.</div><button type="button" class="btn navy big" onClick="{{{{again}}}}">Next heat, {{{{label}}}}</button><button type="button" class="btn big" onClick="{{{{newGroup}}}}">New age or event</button>
<div class="row" style="flex-wrap:nowrap"><a class="btn" style="flex:1" href="{lnk("Recorder",dark)}">Check race</a><a class="btn" style="flex:1" href="{lnk("Recorder",dark)}">Race overall</a></div>
</sc-if>
<sc-if value="{{{{isPick}}}}" hint-placeholder-val="{{{{false}}}}">
<div class="mrow" style="padding:0"><span class="label">Race</span><div class="choices"><sc-for list="{{{{cEv}}}}" as="c" hint-placeholder-count="2"><button type="button" class="choice" aria-pressed="{{{{c.on}}}}" onClick="{{{{c.tap}}}}">{{{{c.l}}}}</button></sc-for></div></div>
<div class="mrow" style="padding:0"><span class="label">Boys or girls</span><div class="choices"><sc-for list="{{{{cX}}}}" as="c" hint-placeholder-count="2"><button type="button" class="choice" aria-pressed="{{{{c.on}}}}" onClick="{{{{c.tap}}}}">{{{{c.l}}}}</button></sc-for></div></div>
<div class="mrow" style="padding:0"><span class="label">Age</span><div class="choices"><sc-for list="{{{{cG}}}}" as="c" hint-placeholder-count="6"><button type="button" class="choice" aria-pressed="{{{{c.on}}}}" onClick="{{{{c.tap}}}}">{{{{c.l}}}}</button></sc-for></div></div>
<button type="button" class="btn navy big" onClick="{{{{again}}}}">Take names</button>
<button type="button" class="btn" onClick="{{{{backSent}}}}">Back</button>
<a class="linkbtn" style="text-align:center" href="{lnk("MarshalPick",dark)}">Another race: go to the Track Marshal</a>
</sc-if>
</div></main></div>
<sc-if value="{{{{hasBar}}}}" hint-placeholder-val="{{{{true}}}}">''' + pbar('<button type="button" class="btn" onClick="{{undo}}">{{undoL}}</button><button type="button" class="btn navy" onClick="{{main}}">{{mainL}}</button>') + '''</sc-if>'''
    logic = "const roster = " + J(roster) + r''';
    const fmt = (cs) => Math.floor(cs / 6000) + ':' + String(Math.floor(cs % 6000 / 100)).padStart(2, '0') + '.' + String(cs % 100).padStart(2, '0');
    const sp = st.splits, n = st.picked.length, ph = st.ph, tp = st.taps;
    const allDone = tp.length >= n;
    // a place past the last split gets 1 second more than the place before
    const timeAt = (k) => k < sp.length ? sp[k] : sp[sp.length - 1] + (k - sp.length + 1) * 100;
    const O = (x) => x + (x % 100 > 10 && x % 100 < 14 ? 'th' : (['th','st','nd','rd'][x % 10] || 'th'));
    out = { isNames: ph === 'names', isClock: ph === 'ready' || ph === 'run', isReady: ph === 'ready', isRun: ph === 'run', isPlace: ph === 'place', isSent: ph === 'sent', isPick: ph === 'pick', raceNo: st.race, label: st.e + ', ' + st.x + ' ' + (st.e === '1500 m' ? 'Open' : st.g),
      newGroup: () => set({ ph: 'pick' }), backSent: () => set({ ph: 'sent' }),
      cEv: ['800 m','1500 m'].map((l) => ({ l, on: st.e === l, tap: () => set({ e: l }) })), cX: ['Girls','Boys'].map((l) => ({ l, on: st.x === l, tap: () => set({ x: l }) })),
      cG: (st.e === '1500 m' ? ['Open'] : ['12 & 13','14','15','16','17','18+']).map((l) => ({ l, on: st.e === '1500 m' || st.g === l, tap: () => set({ g: l }) })),
      hasBar: ph === 'names' || ph === 'place' || ph === 'run', sub: 'No lanes · ' + n + ' runners',
      ppl: roster.map((r, i) => { const on = st.picked.includes(i); return { n: r.n, h: r.h, on, c: on ? 'sel' : '', tap: () => set({ picked: on ? st.picked.filter((x) => x !== i) : st.picked.concat([i]) }) }; }),
      clock: fmt(ph === 'ready' ? 0 : (sp.length ? sp[sp.length - 1] + 212 : 15120)), runC: ph === 'run' ? 'run' : '',
      go: () => set({ ph: 'run' }), stop: () => set({ ph: 'place' }), split: () => { if (ph === 'run') set({ splits: sp.concat([(sp[sp.length - 1] || 15000) + 337]) }); },
      nSp: sp.length, nRun: n, last: sp.map((t, i) => ({ i: i + 1, t: fmt(t) })).slice(-5).reverse(),
      doneC: allDone ? 'done' : '',
      prompt: allDone ? 'All ' + n + ' placed. Check the times, then send.' : 'Tap the button next to the runner who finished ' + O(tp.length + 1) + (tp.length < sp.length ? ' (' + fmt(sp[tp.length]) + ').' : ' (no split: 1 second after the place before).'),
      toPlace: st.picked.map((i) => { const p = tp.indexOf(i) + 1; return { n: roster[i].n, h: roster[i].h, on: p > 0, pl: p || '', t: p ? fmt(timeAt(p - 1)) : ' ', ts: p ? 'background:#1d3160;color:#ffffff' : '', c: p ? (p <= 4 ? 'p' + p : 'px') : '', aria: p ? roster[i].n + ', place ' + p + '. Tap to remove' : roster[i].n + ', tap for place ' + (tp.length + 1), tap: () => set({ taps: p ? tp.filter((x) => x !== i) : tp.concat([i]) }) }; }),
      undoL: ph === 'names' ? 'Add not on list' : (ph === 'run' ? 'Undo last split' : 'Undo last'), undo: () => { if (ph === 'run') set({ splits: sp.slice(0, -1) }); if (ph === 'place') set({ taps: tp.slice(0, -1) }); },
      mainL: ph === 'names' ? 'Names done' : (ph === 'run' ? 'Fix splits' : 'Send to Recorder'),
      main: () => { if (ph === 'names') set({ ph: 'ready' }); if (ph === 'place' && allDone) set({ ph: 'sent' }); },
      again: () => set({ ph: 'names', taps: [], splits: st.seed, race: st.race + 1 }) };
'''
    seed = [15120+337*i+(i*i*7)%90 for i in range(10)]
    return body, logic, "{ e: '800 m', x: 'Girls', g: '16', race: 35, ph: 'names', picked: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14], taps: [4,9,1,12,0,7,3], splits: " + J(seed) + ", seed: " + J(seed) + " }"

# ---------- A1.17 Track Marshal: relay ----------
def marshal_relay(dark):
    body = header("TRACK MARSHAL","Track Marshal",dark) + f'''
<div class="scroll"><main class="wrap">
<div class="racebar"><a class="btn" href="{lnk("MarshalPick",dark)}">Back</a><span class="racebadge xl"><small>RACE</small><b>61</b></span>
<div class="info"><b>4 x 100 m relay, Girls Junior</b><span>{{{{filled}}}} of 3 houses in a lane · no names</span></div>
<button type="button" class="btn big">New race</button></div>
<div class="pool track"><sc-for list="{{{{lanes}}}}" as="l" hint-placeholder-count="8">
<div class="lane"><div class="blk">{{{{l.n}}}}</div>
<button type="button" class="body" onClick="{{{{l.tap}}}}">
<sc-if value="{{{{l.full}}}}" hint-placeholder-val="{{{{true}}}}"><span class="nm"><span class="hdot h{{{{l.h}}}}">{{{{l.h}}}}</span><span>{{{{l.name}}}}</span></span></sc-if>
<sc-if value="{{{{l.none}}}}" hint-placeholder-val="{{{{false}}}}"><span class="empty">Tap to add a house</span></sc-if>
</button><div class="wall"></div>
<sc-if value="{{{{l.open}}}}" hint-placeholder-val="{{{{false}}}}"><div class="picklist"><sc-for list="{{{{free}}}}" as="p" hint-placeholder-count="3"><button type="button" class="pick" onClick="{{{{p.tap}}}}"><span class="hdot h{{{{p.h}}}}">{{{{p.h}}}}</span><span>{{{{p.n}}}}</span></button></sc-for></div></sc-if>
</div></sc-for></div>
</main></div>'''
    logic = r'''
    const H = { B: 'Bradman', J: 'Jackson', N: 'Newcombe' };
    const used = Object.values(st.lanes);
    out = { filled: used.length,
      free: Object.keys(H).filter((h) => !used.includes(h)).map((h) => ({ h, n: H[h], tap: () => { const L = Object.assign({}, st.lanes); L[st.open] = h; set({ lanes: L, open: null }); } })),
      lanes: [1,2,3,4,5,6,7,8].map((n) => { const h = st.lanes[n]; return { n, full: !!h, none: !h, h: h || 'B', name: h ? H[h] : '', open: st.open === n && !h,
        tap: () => { if (h) { const L = Object.assign({}, st.lanes); delete L[n]; set({ lanes: L }); } else set({ open: st.open === n ? null : n }); } }; }) };
'''
    return body, logic, "{ open: null, lanes: {3: 'J', 4: 'B'} }"

# ---------- A1.6 Time Slips ----------
def slips(dark):
    CAM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><circle cx="12" cy="13" r="4"></circle></svg>'
    body = header("TIME SLIPS","Time Slips",dark,slim=True) + f'''
<div class="scroll"><main class="wrap" style="padding-top:12px"><div class="phone">
<div class="racebar" style="margin:0"><span class="racebadge xl"><small>RACE</small><b>3</b></span><div class="info"><b>100 m, Boys 18+</b><span>Heat 1</span></div></div>
<sc-if value="{{{{before}}}}" hint-placeholder-val="{{{{true}}}}"><button type="button" class="cam" onClick="{{{{shoot}}}}">{CAM}Take photo of the slip</button>
<div class="msg info">Race 3 is ready. Hold the phone flat over the printed slip.</div></sc-if>
<sc-if value="{{{{after}}}}" hint-placeholder-val="{{{{false}}}}"><div class="msg ok">Race 3 slip read and sent to the Recorder.</div>
<button type="button" class="btn navy big">Next race</button>
<button type="button" class="btn big" onClick="{{{{again}}}}">Replace this slip with a new photo</button>
<div class="row" style="flex-wrap:nowrap"><a class="btn big" style="flex:1" href="{lnk("Recorder",dark)}">Check race</a><a class="btn big" style="flex:1" href="{lnk("Recorder",dark)}">Race overall</a></div></sc-if>
<div class="row"><span class="qchip">QUESTION 19</span><span class="muted" style="font-size:.86rem;flex:1 1 200px">Drawn as the pool slip: one slip per heat, a time per lane. To confirm from a photo of a track slip.</span></div>
</div></main></div>'''
    logic = "out = { before: !st.done, after: st.done, shoot: () => set({ done: true }), again: () => set({ done: false }) };"
    return body, logic, "{ done: false }"

# ---------- A1.7 Field Station: pick station, run sheet ----------
def field_start(dark):
    body = header("FIELD STATION","Field Station",dark) + f'''
<div class="scroll"><main class="wrap"><div class="stack" style="max-width:1040px;margin:0 auto">
<div class="mrow" style="padding:0"><span class="label">Your station</span><div class="choices"><sc-for list="{{{{stn}}}}" as="c" hint-placeholder-count="7"><button type="button" class="choice" aria-pressed="{{{{c.on}}}}" onClick="{{{{c.tap}}}}">{{{{c.l}}}}</button></sc-for></div></div>
<sc-if value="{{{{shared}}}}" hint-placeholder-val="{{{{false}}}}"><div class="msg info">In four blocks two age groups are on Shot Put at once. Both can be open here.</div></sc-if>
<div class="gcard"><div class="ghead"><h3>{{{{title}}}}: your day</h3><span class="meta">{{{{count}}}} groups · tap a group to open it</span></div>
<sc-for list="{{{{rows}}}}" as="r" hint-placeholder-count="8"><div class="runrow {{{{r.c}}}}"><b>{{{{r.t}}}}</b><span class="chip {{{{r.chip}}}}">{{{{r.st}}}}</span><span style="font-weight:700">{{{{r.g}}}}</span>
<a class="btn {{{{r.btn}}}} small" href="{{{{r.href}}}}">Open</a></div></sc-for></div>
</div></main></div>'''
    blocks = [{"t":b[0],"x":b[3],"f":b[4]} for b in BLOCKS]
    logic = "const blocks = " + J(blocks) + "; const ages = " + J(AGES) + "; const stn = " + J(STN) + f"; const markF = {J(lnk('FieldMarks',dark))}, highF = {J(lnk('FieldHigh',dark))}, throwF = {J(lnk('FieldThrows',dark))}, namesF = {J(lnk('FieldNames',dark))};" + r'''
    const rows = [];
    blocks.forEach((b, bi) => b.f.forEach((s, i) => { if (s === st.s) rows.push({ bi, t: b.t, g: b.x + ' ' + ages[i] }); }));
    rows.forEach((r, i) => { r.done = r.bi < st.now; r.isNow = r.bi === st.now; });
    out = { title: stn[st.s], count: rows.length, shared: st.s === 'SP',
      stn: Object.keys(stn).map((k) => ({ l: stn[k], on: st.s === k, tap: () => set({ s: k }) })),
      rows: rows.map((r) => ({ t: r.t, g: r.g, c: r.isNow ? 'now' : '', st: r.done ? 'Finished' : (r.isNow ? 'Now' : 'Later'), chip: r.done ? 'final' : (r.isNow ? 'prov' : ''), btn: r.isNow ? 'go' : '', href: namesF })) };
'''
    return body, logic, "{ s: 'LJ1', now: 1 }"

PTSJS = "const PTS = [10, 8, 6]; const ptsFor = (pl, c) => { let t = 0; for (let i = 0; i < c; i++) t += PTS[pl - 1 + i] || 4; return t / c; };"
ROW_PLACE = '''<td><sc-if value="{{{{r.medal}}}}" hint-placeholder-val="{{{{true}}}}"><span class="medal {{{{r.mc}}}}">{{{{r.pl}}}}</span></sc-if><sc-if value="{{{{r.plain}}}}" hint-placeholder-val="{{{{false}}}}"><span>{{{{r.pl}}}}</span></sc-if></td>
<td class="num"><b>{{{{r.pts}}}}</b></td>'''
ROW_NAME = '''<td style="text-align:center;font-weight:800">{{{{r.no}}}}</td><td class="nmcell"><span class="htag"><span class="hdot h{{{{r.h}}}}">{{{{r.h}}}}</span><b>{{{{r.n}}}}</b></span><sc-if value="{{{{r.up}}}}" hint-placeholder-val="{{{{false}}}}"> <span class="chip info">{{{{r.upL}}}}</span></sc-if></td>'''
def field_top(code, title, sub, dark, extra=""):
    return f'''<div class="racebar"><span class="racebadge"><small>FIELD</small><b>{code}</b></span><div class="info"><b>{title}</b><span>{sub}</span></div>
{extra}<button type="button" class="btn">Add an athlete</button><a class="btn" href="{lnk("FieldStart",dark)}">All groups</a><button type="button" class="btn navy big" onClick="{{{{finish}}}}">{{{{finLabel}}}}</button></div>'''

# ---------- A1.8 Field Station: long jump ----------
def field_marks(dark):
    roster = names("M","17",7,8)
    init = [["534","x",""],["498","502",""],["x","x",""],["561","558",""],["487","",""],["","",""],["515","",""]]
    body = header("FIELD STATION","Field Station",dark,sub="Long Jump 1") + f'''
<div class="scroll"><main class="wrap">
{field_top("LJ1","Long jump, Boys 17","Long Jump 1 · 9:55 am block · 2 teachers",dark)}
<div class="row" style="margin-bottom:12px;gap:12px;align-items:center"><span class="chip">Up to 3 jumps each</span><span class="chip">{{{{left}}}} still jumping</span>
<label class="label" for="keepn" style="display:flex;align-items:center;gap:8px;margin-left:auto">Keep top<input id="keepn" class="markin hjin" style="width:72px" inputmode="numeric" value="{{{{keepN}}}}" onChange="{{{{keepType}}}}"></label><button type="button" class="btn" onClick="{{{{keepApply}}}}">Keep top {{{{keepN}}}}</button>
<sc-if value="{{{{canUndoKeep}}}}" hint-placeholder-val="{{{{false}}}}"><button type="button" class="btn" onClick="{{{{keepUndo}}}}">Undo Keep top</button></sc-if></div>
<sc-if value="{{{{keepMsg}}}}" hint-placeholder-val="{{{{false}}}}"><div class="msg ok" style="margin-bottom:12px">{{{{keepMsg}}}}</div></sc-if>
<div class="panel" style="padding:0"><div class="tablewrap" style="overflow:visible"><table>
<thead><tr><th>No.</th><th>Athlete</th><th style="text-align:center">Jump 1</th><th style="text-align:center">Jump 2</th><th style="text-align:center">Jump 3</th><th class="num">Best</th><th>Place</th><th class="num">Points</th><th>END</th></tr></thead>
<tbody><sc-for list="{{{{rows}}}}" as="r" hint-placeholder-count="7"><tr class="{{{{r.c}}}}">
{ROW_NAME.format()}
<sc-for list="{{{{r.cells}}}}" as="c" hint-placeholder-count="3"><td style="text-align:center;padding:5px;position:relative"><button type="button" class="hjc {{{{c.c}}}}" style="min-width:84px" disabled="{{{{c.dis}}}}" aria-label="{{{{c.aria}}}}" onClick="{{{{c.tap}}}}">{{{{c.v}}}}</button>
<sc-if value="{{{{c.pop}}}}" hint-placeholder-val="{{{{false}}}}"><div class="hjpop ljpop {{{{c.where}}}}" role="group" aria-label="Record a jump"><div class="markshow" aria-live="polite">{{{{c.show}}}}</div>
<div class="keypad fp"><sc-for list="{{{{c.keys}}}}" as="k" hint-placeholder-count="12"><button type="button" class="{{{{k.c}}}}" onClick="{{{{k.press}}}}" aria-label="{{{{k.aria}}}}">{{{{k.label}}}}</button></sc-for></div>
<div class="row" style="flex-wrap:nowrap"><button type="button" class="btn redfill big" style="flex:1" onClick="{{{{c.foul}}}}">Foul</button><button type="button" class="btn big" style="flex:1" onClick="{{{{c.pass}}}}">Pass</button></div>
<div class="row" style="flex-wrap:nowrap"><button type="button" class="btn" style="flex:1" onClick="{{{{c.cancel}}}}">Cancel</button><button type="button" class="btn navy" style="flex:1" onClick="{{{{c.save}}}}">Save mark</button></div></div></sc-if></td></sc-for>
<td class="num"><span class="bestm">{{{{r.best}}}}</span></td>
{ROW_PLACE.format()}
<td><button type="button" class="stbtn endbtn" style="min-width:84px" aria-pressed="{{{{r.fin}}}}" onPointerDown="{{{{r.endDown}}}}" onPointerUp="{{{{r.endUp}}}}" onPointerLeave="{{{{r.endUp}}}}" onClick="{{{{r.tapFin}}}}">{{{{r.finL}}}}</button></td>
</tr></sc-for></tbody></table></div></div>
<p class="muted" style="font-size:.9rem;margin:10px 0 0">Tap the highlighted box for the athlete who is up. Type the distance (534 is 5.34 m), or tap Foul or Pass. Everyone can take up to 3 jumps, in the same order each round. END ends an athlete's jumping at once (press and hold ENDED to bring them back), and Keep top N finishes everyone below the Nth best mark. The official decides. Everyone with a valid mark gets points; no valid mark gets 0.</p>
<sc-if value="{{{{sent}}}}" hint-placeholder-val="{{{{false}}}}"><div class="msg ok" style="margin-top:10px">Final. Results are in. Only the event coordinator can change them now.</div></sc-if>
</main></div>'''
    logic = "const roster = " + J(roster) + "; " + PTSJS + r'''
    const fmt = (v) => { const d = String(v).replace(/[^0-9]/g, ''); return d.length >= 3 ? d.slice(0, -2) + '.' + d.slice(-2) : d; };
    const val = (v) => /^[0-9]+$/.test(v) ? Number(v) : 0;
    const fin = st.fin || {};
    const best = (r, i) => st.ns[i] ? 0 : Math.max(0, ...r.map(val));
    const bests = st.m.map((r, i) => best(r, i));
    const sorted = bests.filter((b) => b > 0).sort((a, b) => b - a);
    const firstEmpty = (r) => { const k = r.findIndex((v) => v === ''); return k < 0 ? 3 : k; };
    const active = (i) => !st.ns[i] && !fin[i] && firstEmpty(st.m[i]) < 3;
    const used = st.m.map((r, i) => active(i) ? firstEmpty(r) : 9);
    const round = Math.min(...used), up = round < 3 ? used.indexOf(round) : -1, nx = round < 3 ? used.indexOf(round, up + 1) : -1;
    const left = st.m.filter((r, i) => active(i)).length;
    const keys = (i, a) => ['1','2','3','4','5','6','7','8','9','Clear','0','Back'].map((l) => ({ label: l, aria: l, c: /^[0-9]$/.test(l) ? '' : 'w', press: () => {
      if (/^[0-9]$/.test(l)) { if (st.typed.length < 4) set({ typed: st.typed + l }); } else if (l === 'Back') set({ typed: st.typed.slice(0, -1) }); else set({ typed: '' }); } }));
    const show = (t) => t.length ? (t.length > 2 ? t.slice(0, -2) + '.' + t.slice(-2) : '0.' + t.padStart(2, '0')) + ' m' : '0.00 m';
    const put = (i, a, v) => { const m = st.m.map((x) => x.slice()); m[i][a] = v; set({ m, pop: null, typed: '' }); };
    const nKeep = Math.max(1, parseInt(st.keepN, 10) || 4);
    out = { sent: st.sent, finLabel: st.sent ? 'Final' : 'Group finished', finish: () => set({ sent: true }), left, keepN: String(nKeep), keepMsg: st.keepMsg, canUndoKeep: !!st.finPrev,
      keepType: (e) => set({ keepN: String(Math.max(1, parseInt(e.target.value, 10) || 4)) }),
      keepApply: () => { if (sorted.length < nKeep) { set({ keepMsg: 'Only ' + sorted.length + ' marks so far. No one is finished.' }); return; }
        const thr = sorted[nKeep - 1]; const nf = Object.assign({}, fin); let c = 0;
        st.m.forEach((r, i) => { if (!st.ns[i] && !fin[i] && firstEmpty(r) < 3 && bests[i] < thr) { nf[i] = true; c++; } });
        set({ finPrev: fin, fin: nf, keepMsg: 'Kept the top ' + nKeep + ' (equal marks stay in). ' + c + ' athletes finished. Press and hold ENDED on an athlete to bring them back.' }); },
      keepUndo: () => set({ fin: st.finPrev || {}, finPrev: null, keepMsg: '' }),
      rows: roster.map((r, i) => { const b = bests[i], pl = b ? sorted.indexOf(b) + 1 : 0, ties = sorted.filter((x) => x === b).length, live = round < 3, nj = st.m[i].filter((v) => v !== '').length;
        return { no: i + 1, n: r.n, h: r.h, c: live && i === up ? 'selrow' : '', up: live && (i === up || i === nx), upL: i === up ? 'Now up' : 'Next', ns: !!st.ns[i], tapNs: () => { const ns = Object.assign({}, st.ns); ns[i] = !ns[i]; set({ ns }); },
          fin: !!fin[i], finL: fin[i] ? 'ENDED' : 'END', jumps: nj + (nj === 1 ? ' jump' : ' jumps'), conf: st.conf === i, where: i >= 4 ? 'above' : 'below',
          tapFin: () => { if (window.__held) { window.__held = false; return; } if (!fin[i]) set({ fin: Object.assign({}, fin, { [i]: true }) }); },
          endDown: () => { window.__held = false; if (fin[i]) { clearTimeout(window.__et); window.__et = setTimeout(() => { window.__held = true; const nf = Object.assign({}, fin); delete nf[i]; set({ fin: nf }); }, 900); } }, endUp: () => clearTimeout(window.__et),
          best: b ? fmt(b) : '–', pl: pl ? (ties > 1 ? '=' : '') + pl : '–', medal: pl > 0 && pl <= 3, plain: !(pl > 0 && pl <= 3), mc: 'm' + pl, pts: b ? ptsFor(pl, ties) : 0,
          cells: st.m[i].map((v, a) => { const isUp = live && i === up && a === round, isPop = !!st.pop && st.pop.i === i && st.pop.a === a, dis = v === '' && (fin[i] || st.ns[i]);
            return { dis, v: dis ? '–' : (/^[0-9]+$/.test(v) ? fmt(v) : (v === 'x' ? 'X' : (v === '-' ? 'Pass' : ' '))), c: (v === 'x' ? 'foul' : (v === '-' ? 'pass' : '')) + (isUp ? ' upc' : ''), aria: r.n + ' jump ' + (a + 1) + (isUp ? ', up now' : ''),
              tap: () => set({ pop: isPop ? null : { i, a }, typed: /^[0-9]+$/.test(v) ? v : '', conf: null }), pop: isPop, where: i >= 4 ? 'above' : 'below', show: show(st.typed), keys: isPop ? keys(i, a) : [],
              foul: () => put(i, a, 'x'), pass: () => put(i, a, '-'), cancel: () => set({ pop: null, typed: '' }), save: () => put(i, a, st.typed) }; }) }; }) };
'''
    return body, logic, "{ m: " + J(init) + ", ns: {}, fin: {4: true}, finPrev: null, keepN: '4', keepMsg: '', pop: null, typed: '', conf: null, sent: false }"

# ---------- A1.18 Field Station: throws ----------
def field_throws(dark):
    roster = names("M","17",7,12)
    init = [["Fair","Fair","Foul"],["Fair","Foul","Fair"],["Foul"],["Fair","Fair","Fair"],["Fair"],[],["Fair","Fair","Pass"]]
    body = header("FIELD STATION","Field Station",dark,sub="Shot Put") + f'''
<div class="scroll"><main class="wrap">
{field_top("SP","Shot put, Boys 17","Shot Put · 12:10 pm block · 2 teachers",dark)}
<div class="row" style="margin-bottom:12px;gap:12px;align-items:center"><span class="chip info">Shot: 5 kg</span><span class="chip">{{{{again}}}} throwing again, about 10</span><span class="chip">{{{{measured}}}} measured, about 5</span>
<label class="label" for="setd" style="display:flex;align-items:center;gap:8px;margin-left:auto">Set distance for everyone not measured (m)<input id="setd" class="markin hjin" inputmode="decimal" value="{{{{setTxt}}}}" onChange="{{{{setType}}}}"></label></div>
<sc-if value="{{{{setBad}}}}" hint-placeholder-val="{{{{false}}}}"><div class="msg warn" style="margin-bottom:12px">{{{{setBad}}}}</div></sc-if>
<div class="panel" style="padding:0"><div class="tablewrap" style="overflow:visible"><table>
<thead><tr><th>No.</th><th>Athlete</th><th style="text-align:center">Throw 1</th><th style="text-align:center">Throw 2</th><th style="text-align:center">Throw 3</th><th>Measured mark</th><th>Place</th><th class="num">Points</th><th>END</th></tr></thead>
<tbody><sc-for list="{{{{rows}}}}" as="r" hint-placeholder-count="7"><tr>
<td style="text-align:center;font-weight:800">{{{{r.no}}}}</td><td class="nmcell"><span class="htag"><span class="hdot h{{{{r.h}}}}">{{{{r.h}}}}</span><b>{{{{r.n}}}}</b></span><sc-if value="{{{{r.tag}}}}" hint-placeholder-val="{{{{false}}}}"> <span class="chip {{{{r.tagc}}}}">{{{{r.tag}}}}</span></sc-if></td>
<sc-for list="{{{{r.cells}}}}" as="c" hint-placeholder-count="3"><td style="text-align:center;padding:6px"><button type="button" class="hjc {{{{c.c}}}}" disabled="{{{{c.dis}}}}" aria-label="{{{{c.aria}}}}" onClick="{{{{c.tap}}}}">{{{{c.v}}}}</button></td></sc-for>
<td><input class="markin" aria-label="{{{{r.markAria}}}}" value="{{{{r.mv}}}}" disabled="{{{{r.noMark}}}}" onChange="{{{{r.chg}}}}" placeholder="{{{{r.ph}}}}"></td>
{ROW_PLACE.format()}
<td><button type="button" class="stbtn endbtn" style="min-width:84px" aria-pressed="{{{{r.fin}}}}" onPointerDown="{{{{r.endDown}}}}" onPointerUp="{{{{r.endUp}}}}" onPointerLeave="{{{{r.endUp}}}}" onClick="{{{{r.tapFin}}}}">{{{{r.finL}}}}</button></td>
</tr></sc-for></tbody></table></div></div>
<p class="muted" style="font-size:.9rem;margin:10px 0 0">Everyone throws once. The official picks who throws again on the Throw again screen. Tap a box to step through Fair, Foul and Pass. Type a measured mark only for the athletes you measured (534 is 5.34 m). Everyone else with a fair throw is participation: they get the set distance, share a place and get 4 points. No fair throw or no show is 0. Discus and javelin work the same way, each with its own weights.</p>
<sc-if value="{{{{sent}}}}" hint-placeholder-val="{{{{false}}}}"><div class="msg ok" style="margin-top:10px">Final. Results are in. Only the event coordinator can change them now.</div></sc-if>
</main></div>'''
    logic = "const roster = " + J(roster) + "; " + PTSJS + r'''
    const fmt = (v) => { const d = String(v).replace(/[^0-9]/g, ''); return d.length >= 3 ? d.slice(0, -2) + '.' + d.slice(-2) : d; };
    const seq = ['', 'Fair', 'Foul', 'Pass'];
    const again = st.again, fin = st.fin || {};
    const fair = (i) => st.m[i].includes('Fair');
    const isNum = (v) => /^[0-9]+$/.test(v) && Number(v) > 0;
    const measured = (i) => !st.ns[i] && fair(i) && isNum(st.mk[i]);
    const mv = (i) => (measured(i) ? Number(st.mk[i]) : 0);
    const idx = roster.map((r, i) => i);
    const lowest = Math.min(...idx.filter(measured).map(mv), Infinity);
    const setN = isNum(st.set) ? Number(st.set) : 0, setOk = setN > 0 && setN < lowest;
    const part = (i) => !st.ns[i] && fair(i) && !measured(i);
    const mark = (i) => (measured(i) ? mv(i) : (part(i) && setOk ? setN : 0));
    const marks = idx.map(mark), sorted = marks.filter((b) => b > 0).sort((a, b) => b - a);
    const nPart = idx.filter(part).length;
    const setBad = nPart > 0 && !setOk ? (setN ? 'The set distance must be lower than the lowest measured mark (' + fmt(lowest) + ' m).' : 'Type one set distance for everyone who was not measured.') : '';
    out = { sent: st.sent, finLabel: st.sent ? 'Final' : 'Group finished', finish: () => set({ sent: true }), again: idx.filter((i) => again[i]).length, measured: idx.filter(measured).length,
      setTxt: st.set ? fmt(st.set) : '', setBad, setType: (e) => set({ set: String(e.target.value).replace(/[^0-9]/g, '') }),
      rows: roster.map((r, i) => { const b = marks[i], pl = b ? sorted.indexOf(b) + 1 : 0, ties = sorted.filter((x) => x === b).length, nt = st.m[i].length;
        return { no: i + 1, n: r.n, h: r.h, tag: st.ns[i] ? '' : (again[i] ? 'Throws again' : (fair(i) ? 'Participation' : (nt ? 'No fair throw' : ''))), tagc: again[i] ? 'info' : '', ns: !!st.ns[i], tapNs: () => { const ns = Object.assign({}, st.ns); ns[i] = !ns[i]; set({ ns }); },
          fin: !!fin[i], finL: fin[i] ? 'ENDED' : 'END', throws: nt + (nt === 1 ? ' throw' : ' throws'), conf: st.conf === i, where: i >= 4 ? 'above' : 'below',
          tapFin: () => { if (window.__held) { window.__held = false; return; } if (!fin[i]) set({ fin: Object.assign({}, fin, { [i]: true }) }); },
          endDown: () => { window.__held = false; if (fin[i]) { clearTimeout(window.__et); window.__et = setTimeout(() => { window.__held = true; const nf = Object.assign({}, fin); delete nf[i]; set({ fin: nf }); }, 900); } }, endUp: () => clearTimeout(window.__et),
          mv: st.mk[i] ? fmt(st.mk[i]) : '', noMark: !fair(i) || !!st.ns[i], ph: fair(i) ? 'measure' : '–', markAria: r.n + ' measured mark',
          chg: (e) => { const m2 = st.mk.slice(); m2[i] = String(e.target.value).replace(/[^0-9]/g, ''); set({ mk: m2 }); },
          pl: pl ? (ties > 1 ? '=' : '') + pl : '–', medal: pl > 0 && pl <= 3, plain: !(pl > 0 && pl <= 3), mc: 'm' + pl, pts: b ? ptsFor(pl, ties) : 0,
          cells: [0, 1, 2].map((a) => { const v = st.m[i][a] || '', dis = (v === '' && (st.ns[i] || fin[i] || (a >= 1 && !again[i]) || a > nt)); return { dis, v: dis ? '–' : (v || ' '), c: v === 'Fair' ? 'clear' : (v === 'Foul' ? 'out' : (v === 'Pass' ? 'pass' : '')), aria: r.n + ' throw ' + (a + 1) + ': ' + (v || 'not thrown'),
            tap: () => { const m = st.m.map((x) => x.slice()); m[i][a] = seq[(seq.indexOf(v) + 1) % seq.length]; while (m[i].length && m[i][m[i].length - 1] === '') m[i].pop(); set({ m }); } }; }) }; }) };
'''
    return body, logic, "{ m: " + J(init) + ", again: {0: true, 1: true, 3: true, 6: true}, mk: ['1124','1006','','1287','','','985'], set: '800', ns: {}, fin: {}, conf: null, sent: false }"

# ---------- A1.9 Field Station: high jump ----------
def field_high(dark):
    roster = names("F","18",6,9)
    init = [["O","O","XO","XXO","XO","",""],["O","XO","XXX","","","",""],["-","O","O","XO","XXO","",""],["O","O","XO","XXO","XXO","",""],["XXX","","","","","",""],["O","O","XO","XXX","","",""]]
    body = header("FIELD STATION","Field Station",dark,sub="High Jump 1") + f'''
<div class="scroll"><main class="wrap">
{field_top("HJ1","High jump, Girls 18+","High Jump 1 · 9:15 am block · 2 teachers",dark)}
<div class="panel hjctl">
<div class="stepbox"><label class="label" for="hjstart">Start height (m)</label><input id="hjstart" class="markin hjin" inputmode="decimal" value="{{{{startTxt}}}}" disabled="{{{{startLocked}}}}" onChange="{{{{startType}}}}"><span class="muted sm">Sheet: {{{{startSheet}}}} <sc-if value="{{{{startCanReset}}}}" hint-placeholder-val="{{{{false}}}}"><button type="button" class="linkbtn" onClick="{{{{startReset}}}}">Use sheet</button></sc-if><sc-if value="{{{{startLocked}}}}" hint-placeholder-val="{{{{true}}}}"> Locked after the first jump.</sc-if></span></div>
<div class="stepbox"><label class="label" for="hjnext">Next height (m)</label><input id="hjnext" class="markin hjin" inputmode="decimal" value="{{{{nextTxt}}}}" onChange="{{{{nextType}}}}"><span class="muted sm">Up {{{{upBy}}}} from {{{{nowH}}}} m. Sheet: {{{{nextSheet}}}} <sc-if value="{{{{nextEdited}}}}" hint-placeholder-val="{{{{false}}}}"><button type="button" class="linkbtn" onClick="{{{{nextReset}}}}">Use sheet</button></sc-if></span></div>
<div class="stepbox"><span class="label">Bar now</span><b class="stepval" style="text-align:left">{{{{nowH}}}} m</b><span class="muted sm">Round {{{{round}}}}</span></div>
<span class="chip">{{{{left}}}} left in</span>
<button type="button" class="btn" style="margin-left:auto" onClick="{{{{undo}}}}">Undo last</button></div>
<sc-if value="{{{{three}}}}" hint-placeholder-val="{{{{true}}}}"><div class="msg warn" style="margin-bottom:12px">3 left. The sheet raise is now 3 cm. The official decides the next height.</div></sc-if>
<div class="panel" style="padding:0"><div class="tablewrap hjgrid"><table>
<thead><tr><th class="hjs1">No.</th><th class="hjs2">Athlete</th><sc-for list="{{{{hts}}}}" as="h" hint-placeholder-count="7"><th style="text-align:center">{{{{h}}}}</th></sc-for><th class="num">Best</th><th>Place</th><th class="num">Points</th><th>END</th></tr></thead>
<tbody><sc-for list="{{{{rows}}}}" as="r" hint-placeholder-count="6"><tr>
<td class="hjs1" style="text-align:center;font-weight:800">{{{{r.no}}}}</td><td class="nmcell hjs2"><span class="htag"><span class="hdot h{{{{r.h}}}}">{{{{r.h}}}}</span><b>{{{{r.n}}}}</b></span> <sc-if value="{{{{r.tag}}}}" hint-placeholder-val="{{{{false}}}}"><span class="chip">{{{{r.tag}}}}</span></sc-if></td>
<sc-for list="{{{{r.cells}}}}" as="c" hint-placeholder-count="7"><td style="text-align:center;padding:5px;position:relative"><button type="button" class="hjc {{{{c.c}}}}" aria-label="{{{{c.aria}}}}" onClick="{{{{c.tap}}}}">{{{{c.v}}}}</button>
<sc-if value="{{{{c.pop}}}}" hint-placeholder-val="{{{{false}}}}"><div class="hjpop {{{{c.where}}}}" role="group" aria-label="Record a try"><button type="button" class="btn go big" onClick="{{{{c.clear}}}}">Clear</button><button type="button" class="btn redfill big" onClick="{{{{c.miss}}}}">Miss</button><button type="button" class="btn big" onClick="{{{{c.pass}}}}">Pass</button><button type="button" class="btn" onClick="{{{{c.back}}}}">Remove last</button></div></sc-if></td></sc-for>
<td class="num"><span class="bestm">{{{{r.best}}}}</span></td>
{ROW_PLACE.format()}
<td><button type="button" class="stbtn endbtn" style="min-width:84px" aria-pressed="{{{{r.fin}}}}" onPointerDown="{{{{r.endDown}}}}" onPointerUp="{{{{r.endUp}}}}" onPointerLeave="{{{{r.endUp}}}}" onClick="{{{{r.tapFin}}}}">{{{{r.finL}}}}</button></td>
</tr></sc-for></tbody></table></div></div>
<p class="muted" style="font-size:.9rem;margin:10px 0 0">END stops an athlete at once, for one who is far too low to carry on. Press and hold ENDED to bring them back. Tap the highlighted box for the athlete who is up, then Clear, Miss or Pass. A new height is added after each round, and the list goes on until every athlete is out. It scrolls sideways, with the names kept in view, and opens at the height now. O is a clear, X a miss. A pass after a miss shows as X Pass. 3 misses in a row is out, and misses carry on to the next height after a pass. Tap any other box to fix it. Equal heights: fewer misses at that height wins, then fewer misses overall, then they share the place.</p>
<sc-if value="{{{{sent}}}}" hint-placeholder-val="{{{{false}}}}"><div class="msg ok" style="margin-top:10px">Final. Results are in. Only the event coordinator can change them now.</div></sc-if>
</main></div>'''
    logic = "const roster = " + J(roster) + "; " + PTSJS + r'''
    // the grid grows: always 2 empty heights after the last one used, so it goes on until everyone is out
    const used = Math.max(0, ...st.m.map((r) => r.reduce((t, v, i) => (v ? i : t), -1)));
    const N = Math.max(7, used + 3);
    const M = st.m.map((r) => r.concat(Array(Math.max(0, N - r.length)).fill('')));
    // 3 misses in a row is out, and a pass does not reset the count
    const out3 = (r, n) => { let run = 0; for (const c of r.slice(0, n).join('')) { if (c === 'X') { run++; if (run >= 3) return true; } if (c === 'O') run = 0; } return false; };
    const closed = (v) => /O$/.test(v) || v.includes('-') || v === 'XXX';
    const sheetStart = 110;
    const start = st.start == null ? sheetStart : st.start;
    const ov = st.ov || {};
    const fin = st.fin || {};
    const done = M[0].map((_, a) => M.every((r, ri) => fin[ri] || closed(r[a]) || out3(r, a + 1)));
    const cur = done.indexOf(false) < 0 ? N - 1 : done.indexOf(false);
    // the sheet's raise into column a: 5 cm, then 3 cm once 3 athletes remain
    const sheetRaise = (a) => (M.filter((r) => !out3(r, a)).length <= 3 ? 3 : 5);
    // heights are the start, then each next height: typed by the person running the event, else the sheet's
    const sheetCm = [start]; for (let a = 1; a < N; a++) sheetCm.push(sheetCm[a - 1] + sheetRaise(a));
    const cm = [start]; for (let a = 1; a < N; a++) cm.push(ov[a] != null ? ov[a] : cm[a - 1] + sheetRaise(a));
    const H = cm.map((c) => (c / 100).toFixed(2));
    const locked = M.some((r) => r.some((v) => v));
    const left3 = M.filter((r, ri) => !fin[ri] && !out3(r, N)).length;
    const toCm = (t) => { const n = parseFloat(String(t).replace(',', '.')); if (!(n > 0)) return null; return Math.round(n < 10 ? n * 100 : n); };
    const nx = Math.min(cur + 1, N - 1);
    const queue = M.map((r, i) => ({ i, tries: r[cur].length })).filter((q) => !fin[q.i] && !closed(M[q.i][cur]) && !out3(M[q.i], cur + 1)).sort((x, y) => x.tries - y.tries || x.i - y.i);
    const upI = queue.length ? queue[0].i : -1, nxI = queue.length > 1 ? queue[1].i : -1;
    const append = (i, a, c) => () => { const m = M.map((x) => x.slice()); m[i][a] += c; set({ m, pop: null, last: st.last.concat([[i, a]]) }); };
    const stat = M.map((r) => { let b = -1; r.forEach((v, i) => { if (/O$/.test(v)) b = i; });
      const miss = (v) => (v.match(/X/g) || []).length;
      return { b, atH: b >= 0 ? miss(r[b]) : 0, all: r.reduce((t, v) => t + miss(v), 0) }; });
    const key = (s) => s.b * 10000 - s.atH * 100 - s.all;
    const sorted = stat.filter((s) => s.b >= 0).map(key).sort((a, b) => b - a);
    const show = (v) => v.split('').map((c) => (c === '-' ? 'Pass' : c)).join(' ') || ' ';
    const pop = st.pop;
    out = { hts: H, nowH: H[cur], left: M.filter((r, ri) => !fin[ri] && !out3(r, N)).length,
      round: cur + 1, startLocked: locked, startCanReset: !locked && start !== sheetStart, three: left3 === 3, startTxt: H[0], startSheet: (sheetStart / 100).toFixed(2) + ' m', startEdited: start !== sheetStart,
      startType: (e) => { if (locked) return; const c = toCm(e.target.value); set({ start: c && c >= 50 && c <= 250 ? c : start }); }, startReset: () => set({ start: null }),
      nextTxt: H[nx], nextSheet: ((cm[nx - 1] + sheetRaise(nx)) / 100).toFixed(2) + ' m', nextEdited: ov[nx] != null,
      upBy: (cm[nx] - cm[cur] >= 0 ? '+' : '') + (cm[nx] - cm[cur]) + ' cm',
      nextType: (e) => { const c = toCm(e.target.value); set({ ov: Object.assign({}, ov, c && c > cm[cur] && c <= 250 ? { [nx]: c } : {}) }); }, nextReset: () => { const o = Object.assign({}, ov); delete o[nx]; set({ ov: o }); },
      undo: () => { const l = st.last[st.last.length - 1]; if (!l) return; const m = M.map((x) => x.slice()); m[l[0]][l[1]] = m[l[0]][l[1]].slice(0, -1); set({ m, pop: null, last: st.last.slice(0, -1) }); }, sent: st.sent,
      rows: roster.map((r, i) => { const s = stat[i], k = key(s), pl = s.b >= 0 ? sorted.indexOf(k) + 1 : 0, ties = sorted.filter((x) => x === k).length;
      return { fin: !!fin[i], finL: fin[i] ? 'ENDED' : 'END', tapFin: () => { if (window.__held) { window.__held = false; return; } if (!fin[i]) set({ fin: Object.assign({}, fin, { [i]: true }) }); }, endDown: () => { window.__held = false; if (fin[i]) { clearTimeout(window.__et); window.__et = setTimeout(() => { window.__held = true; const nf = Object.assign({}, fin); delete nf[i]; set({ fin: nf }); }, 900); } }, endUp: () => clearTimeout(window.__et), no: i + 1, n: r.n, h: r.h, tag: fin[i] ? 'Ended' : (i === upI ? 'Up' : (i === nxI ? 'Next' : '')), best: s.b >= 0 ? H[s.b] : '–', pl: pl ? (ties > 1 ? '=' : '') + pl : '–', medal: pl > 0 && pl <= 3, plain: !(pl > 0 && pl <= 3), mc: 'm' + pl, pts: s.b >= 0 ? ptsFor(pl, ties) : 0,
        cells: M[i].map((v, a) => { const isUp = i === upI && a === cur; return { v: show(v), c: (/O$/.test(v) ? 'clear' : (v === 'XXX' ? 'out' : (v.includes('-') ? 'pass' : ''))) + (isUp ? ' upc' : ''), aria: r.n + ' at ' + H[a] + ' metres: ' + (v ? show(v) : 'not tried') + (isUp ? ', up now' : ''),
          tap: () => set({ pop: pop && pop.i === i && pop.a === a ? null : { i, a } }),
          pop: !!pop && pop.i === i && pop.a === a, where: i >= 4 ? 'above' : 'below',
          clear: append(i, a, 'O'), miss: append(i, a, 'X'), pass: append(i, a, '-'),
          back: () => { const m = M.map((x) => x.slice()); m[i][a] = m[i][a].slice(0, -1); set({ m, pop: null }); } }; }) }; }) };
'''
    return body, logic, "{ m: " + J(init) + ", sent: false, last: [], start: null, ov: {}, pop: null }"

# ---------- A1.21 Field Station phone: high jump ----------
def field_high_phone(dark):
    roster = names("F","18",6,9)
    init = [["O","O","XO","XXO","XO","",""],["O","XO","XXX","","","",""],["-","O","O","XO","XXO","",""],["O","O","XO","XXO","XXO","",""],["XXX","","","","","",""],["O","O","XO","XXX","","",""]]
    body = header("FIELD STATION","Field Station",dark,slim=True) + f'''
<div class="scroll"><main class="wrap" style="padding-top:8px;padding-bottom:84px"><div class="stack" style="gap:8px">
<div class="racebar ph" style="margin:0"><span class="racebadge sm"><small>FIELD</small><b>HJ1</b></span><div class="info"><b>High jump, Girls 18+</b><span>Round {{{{round}}}} · {{{{left}}}} left in</span></div></div>
<div class="row" style="flex-wrap:nowrap;justify-content:space-between;align-items:center"><div><span class="label">Bar now</span><br><b class="stepval" style="text-align:left">{{{{nowH}}}} m</b></div><button type="button" class="btn" onClick="{{{{toggleEdit}}}}">Set heights</button></div>
<sc-if value="{{{{edit}}}}" hint-placeholder-val="{{{{false}}}}"><div class="panel hjedit"><div class="stepbox"><label class="label" for="hjstartp">Start height (m)</label><input id="hjstartp" class="markin hjin" inputmode="decimal" value="{{{{startTxt}}}}" disabled="{{{{startLocked}}}}" onChange="{{{{startType}}}}"><span class="muted sm">Sheet: {{{{startSheet}}}}<sc-if value="{{{{startLocked}}}}" hint-placeholder-val="{{{{true}}}}"> Locked after the first jump.</sc-if></span></div>
<div class="stepbox"><label class="label" for="hjnextp">Next height (m)</label><input id="hjnextp" class="markin hjin" inputmode="decimal" value="{{{{nextTxt}}}}" onChange="{{{{nextType}}}}"><span class="muted sm">Up {{{{upBy}}}}. Sheet: {{{{nextSheet}}}}<sc-if value="{{{{nextEdited}}}}" hint-placeholder-val="{{{{false}}}}"> <button type="button" class="linkbtn" onClick="{{{{nextReset}}}}">Use sheet</button></sc-if></span></div>
<button type="button" class="btn navy" onClick="{{{{toggleEdit}}}}">Done</button></div></sc-if>
<sc-if value="{{{{three}}}}" hint-placeholder-val="{{{{true}}}}"><div class="msg warn">3 left. The sheet raise is now 3 cm. The official decides the next height.</div></sc-if>
<sc-if value="{{{{hasUp}}}}" hint-placeholder-val="{{{{true}}}}"><span class="htag bigath"><span class="hdot h{{{{h}}}}" style="width:30px;height:30px;font-size:.9rem">{{{{h}}}}</span>{{{{name}}}}</span>
<span class="muted" style="font-size:.9rem">Now up, try {{{{tryNo}}}} at {{{{nowH}}}} m. Next: {{{{nextN}}}}</span>
<div class="attrow"><sc-for list="{{{{att}}}}" as="a" hint-placeholder-count="3"><div class="attcell {{{{a.c}}}}"><span>Try {{{{a.n}}}}</span><b>{{{{a.v}}}}</b></div></sc-for></div>
<button type="button" class="btn go big" style="min-height:96px" onClick="{{{{clear}}}}">Clear</button><div class="row" style="flex-wrap:nowrap"><button type="button" class="btn redfill big" style="flex:1;min-height:96px" onClick="{{{{miss}}}}">Miss</button><button type="button" class="btn big" style="flex:1;min-height:96px" onClick="{{{{pass}}}}">Pass</button></div></sc-if>
<sc-if value="{{{{noUp}}}}" hint-placeholder-val="{{{{false}}}}"><div class="msg ok">Everyone is done. Tap Group finished on the iPad or here when the places look right.</div></sc-if>
</div></main></div>''' + pbar('<button type="button" class="btn" onClick="{{undo}}">Undo last</button><button type="button" class="btn" onClick="{{askFinish}}">END</button><button type="button" class="btn">Add an athlete</button>')
    logic = "const roster = " + J(roster) + r''';
    // the grid grows: always 2 empty heights after the last one used, so it goes on until everyone is out
    const used = Math.max(0, ...st.m.map((r) => r.reduce((t, v, i) => (v ? i : t), -1)));
    const N = Math.max(7, used + 3);
    const M = st.m.map((r) => r.concat(Array(Math.max(0, N - r.length)).fill('')));
    const out3 = (r, n) => { let run = 0; for (const c of r.slice(0, n).join('')) { if (c === 'X') { run++; if (run >= 3) return true; } if (c === 'O') run = 0; } return false; };
    const closed = (v) => /O$/.test(v) || v.includes('-') || v === 'XXX';
    const sheetStart = 110, start = st.start == null ? sheetStart : st.start, ov = st.ov || {};
    const locked = M.some((r) => r.some((v) => v));
    const fin = st.fin || {};
    const done = M[0].map((_, a) => M.every((r, ri) => fin[ri] || closed(r[a]) || out3(r, a + 1)));
    const cur = done.indexOf(false) < 0 ? N - 1 : done.indexOf(false);
    const sheetRaise = (a) => (M.filter((r) => !out3(r, a)).length <= 3 ? 3 : 5);
    const cm = [start]; for (let a = 1; a < N; a++) cm.push(ov[a] != null ? ov[a] : cm[a - 1] + sheetRaise(a));
    const H = cm.map((c) => (c / 100).toFixed(2));
    const toCm = (t) => { const n = parseFloat(String(t).replace(',', '.')); if (!(n > 0)) return null; return Math.round(n < 10 ? n * 100 : n); };
    const nx = Math.min(cur + 1, N - 1);
    const queue = M.map((r, i) => ({ i, tries: r[cur].length })).filter((q) => !fin[q.i] && !closed(M[q.i][cur]) && !out3(M[q.i], cur + 1)).sort((x, y) => x.tries - y.tries || x.i - y.i);
    const upI = queue.length ? queue[0].i : -1, nxI = queue.length > 1 ? queue[1].i : -1;
    const add = (c) => () => { if (upI < 0) return; const m = M.map((x) => x.slice()); m[upI][cur] += c; set({ m, last: st.last.concat([[upI, cur]]) }); };
    const left = M.filter((r, ri) => !fin[ri] && !out3(r, N)).length;
    const v = upI >= 0 ? M[upI][cur] : '';
    const show = (c) => (c === '-' ? 'Pass' : c);
    out = { askFinish: () => { if (upI >= 0) set({ fin: Object.assign({}, fin, { [upI]: true }) }); }, round: cur + 1, left, three: left === 3, nowH: H[cur], hasUp: upI >= 0, noUp: upI < 0, edit: st.edit, toggleEdit: () => set({ edit: !st.edit }),
      name: upI >= 0 ? roster[upI].n : '', h: upI >= 0 ? roster[upI].h : 'B', nextN: nxI >= 0 ? roster[nxI].n : 'no one', tryNo: v.length + 1,
      att: [0,1,2].map((a) => ({ n: a + 1, v: a < v.length ? show(v[a]) : ' ', c: a === v.length ? 'cur' : (v[a] === 'X' ? 'foul' : '') })),
      clear: add('O'), miss: add('X'), pass: add('-'),
      undo: () => { const l = st.last[st.last.length - 1]; if (!l) return; const m = M.map((x) => x.slice()); m[l[0]][l[1]] = m[l[0]][l[1]].slice(0, -1); set({ m, last: st.last.slice(0, -1) }); },
      startLocked: locked, startTxt: H[0], startSheet: (sheetStart / 100).toFixed(2) + ' m',
      startType: (e) => { if (locked) return; const c = toCm(e.target.value); set({ start: c && c >= 50 && c <= 250 ? c : start }); },
      nextTxt: H[nx], nextSheet: ((cm[nx - 1] + sheetRaise(nx)) / 100).toFixed(2) + ' m', nextEdited: ov[nx] != null, upBy: (cm[nx] - cm[cur] >= 0 ? '+' : '') + (cm[nx] - cm[cur]) + ' cm',
      nextType: (e) => { const c = toCm(e.target.value); set({ ov: Object.assign({}, ov, c && c > cm[cur] && c <= 250 ? { [nx]: c } : {}) }); }, nextReset: () => { const o = Object.assign({}, ov); delete o[nx]; set({ ov: o }); } };
'''
    return body, logic, "{ m: " + J(init) + ", last: [], start: null, ov: {}, edit: false }"


# ---------- A1.22 Field Station phone: high jump group results ----------
def field_high_summary(dark):
    roster = names("F","18",6,9)
    init = [["O","O","XO","XXO","XO","XXO","XXX"],["O","XO","XXX"],["-","O","O","XO","XXO","XXX"],["O","O","XO","XXO","XXO","XXX"],["O","O","XO","XXO","XXO","XXX"],["XXX"]]
    body = header("FIELD STATION","Field Station",dark,slim=True) + f"""
<div class="scroll"><main class="wrap" style="padding-top:8px;padding-bottom:84px"><div class="stack" style="gap:8px">
<div class="racebar ph" style="margin:0"><span class="racebadge sm"><small>FIELD</small><b>HJ1</b></span><div class="info"><b>High jump, Girls 18+</b><span>Group results · everyone is out</span></div></div>
<sc-if value="{{{{sent}}}}" hint-placeholder-val="{{{{false}}}}"><div class="msg ok">Sent at 10:52.</div></sc-if>
<sc-if value="{{{{notSent}}}}" hint-placeholder-val="{{{{true}}}}"><div class="msg warn">Check the places, then Send results.</div></sc-if>
<sc-for list="{{{{rows}}}}" as="r" hint-placeholder-count="6"><div class="panel" style="padding:12px 14px;display:flex;align-items:center;gap:12px">
<sc-if value="{{{{r.medal}}}}" hint-placeholder-val="{{{{true}}}}"><span class="medal {{{{r.mc}}}}">{{{{r.pl}}}}</span></sc-if><sc-if value="{{{{r.plain}}}}" hint-placeholder-val="{{{{false}}}}"><span style="width:32px;text-align:center;font-weight:800">{{{{r.pl}}}}</span></sc-if>
<div style="flex:1;min-width:0"><span class="htag"><span class="hdot h{{{{r.h}}}}">{{{{r.h}}}}</span><b>{{{{r.n}}}}</b></span><br><span class="muted" style="font-size:.85rem"><b class="bestm" style="color:var(--ink)">{{{{r.best}}}}</b> · {{{{r.miss}}}}</span></div>
<b style="text-align:right;font-size:1.05rem">{{{{r.pts}}}} pts</b></div></sc-for>
</div></main></div>""" + pbar('<sc-if value="{{notSent}}" hint-placeholder-val="{{true}}"><button type="button" class="btn" onClick="{{back}}">Back to jumping</button><button type="button" class="btn navy big" onClick="{{send}}">Send results</button></sc-if><sc-if value="{{sent}}" hint-placeholder-val="{{false}}"><button type="button" class="btn navy big" onClick="{{reset}}">Next group</button></sc-if>')
    logic = "const roster = " + J(roster) + "; " + PTSJS + r"""
    const out3 = (r, n) => { let run = 0; for (const c of r.slice(0, n).join('')) { if (c === 'X') { run++; if (run >= 3) return true; } if (c === 'O') run = 0; } return false; };
    const M = st.m, N = Math.max(...M.map((r) => r.length));
    const sheetRaise = (a) => (M.filter((r) => !out3(r, a)).length <= 3 ? 3 : 5);
    const cm = [110]; for (let a = 1; a < N; a++) cm.push(cm[a - 1] + sheetRaise(a));
    const H = cm.map((c) => (c / 100).toFixed(2));
    const miss = (v) => (v.match(/X/g) || []).length;
    const stat = M.map((r) => { let b = -1; r.forEach((v, i) => { if (/O$/.test(v)) b = i; }); return { b, atH: b >= 0 ? miss(r[b]) : 0, all: r.reduce((t, v) => t + miss(v), 0) }; });
    const key = (s) => s.b * 10000 - s.atH * 100 - s.all;
    const sorted = stat.filter((s) => s.b >= 0).map(key).sort((a, b) => b - a);
    const rows = roster.map((r, i) => { const s = stat[i], k = key(s), pl = s.b >= 0 ? sorted.indexOf(k) + 1 : 0, ties = sorted.filter((x) => x === k).length;
      return { pl: pl || 99, label: pl ? (ties > 1 ? '=' : '') + pl : '–', n: r.n, h: r.h, best: s.b >= 0 ? H[s.b] + ' m' : 'No height', miss: s.b >= 0 ? s.atH + ' miss' + (s.atH === 1 ? '' : 'es') + ' at best, ' + s.all + ' in all' : s.all + ' misses', pts: s.b >= 0 ? ptsFor(pl, ties) : 0 }; })
      .sort((a, b) => a.pl - b.pl).map((r) => ({ n: r.n, h: r.h, best: r.best, miss: r.miss, pts: r.pts, pl: r.label, medal: r.pl <= 3, plain: r.pl > 3, mc: 'm' + r.pl }));
    out = { rows, sent: st.sent, notSent: !st.sent, send: () => set({ sent: true }), back: () => {}, reset: () => set({ sent: false }) };
"""
    return body, logic, "{ m: " + J(init) + ", sent: false }"

# ---------- A1.23 Field Station phone: long jump group results ----------
def field_lj_summary(dark):
    roster = names("M","17",7,8)
    init = [["534","x","541"],["498","502","x"],["x","x","x"],["561","558","x"],["487"],[],["515","x","519"]]
    body = header("FIELD STATION","Field Station",dark,slim=True) + f"""
<div class="scroll"><main class="wrap" style="padding-top:8px;padding-bottom:84px"><div class="stack" style="gap:8px">
<div class="racebar ph" style="margin:0"><span class="racebadge sm"><small>FIELD</small><b>LJ1</b></span><div class="info"><b>Long jump, Boys 17</b><span>Group results · jumping is over</span></div></div>
<sc-if value="{{{{sent}}}}" hint-placeholder-val="{{{{false}}}}"><div class="msg ok">Sent at 10:52.</div></sc-if>
<sc-if value="{{{{notSent}}}}" hint-placeholder-val="{{{{true}}}}"><div class="msg warn">Check the places, then Send results.</div></sc-if>
<sc-for list="{{{{rows}}}}" as="r" hint-placeholder-count="7"><div class="panel" style="padding:12px 14px;display:flex;align-items:center;gap:12px">
<sc-if value="{{{{r.medal}}}}" hint-placeholder-val="{{{{true}}}}"><span class="medal {{{{r.mc}}}}">{{{{r.pl}}}}</span></sc-if><sc-if value="{{{{r.plain}}}}" hint-placeholder-val="{{{{false}}}}"><span style="width:32px;text-align:center;font-weight:800">{{{{r.pl}}}}</span></sc-if>
<div style="flex:1;min-width:0"><span class="htag"><span class="hdot h{{{{r.h}}}}">{{{{r.h}}}}</span><b>{{{{r.n}}}}</b></span><br><span class="muted" style="font-size:.85rem"><b class="bestm" style="color:var(--ink)">{{{{r.best}}}}</b> · {{{{r.jumps}}}}</span></div>
<b style="text-align:right;font-size:1.05rem">{{{{r.pts}}}} pts</b></div></sc-for>
</div></main></div>""" + pbar('<sc-if value="{{notSent}}" hint-placeholder-val="{{true}}"><button type="button" class="btn" onClick="{{back}}">Back to jumping</button><button type="button" class="btn navy big" onClick="{{send}}">Send results</button></sc-if><sc-if value="{{sent}}" hint-placeholder-val="{{false}}"><button type="button" class="btn navy big" onClick="{{reset}}">Next group</button></sc-if>')
    logic = "const roster = " + J(roster) + "; " + PTSJS + r"""
    const fmt = (v) => v.slice(0, -2) + '.' + v.slice(-2);
    const val = (v) => /^[0-9]+$/.test(v) ? Number(v) : 0;
    const bests = st.m.map((x) => Math.max(0, ...x.map(val)));
    const sorted = bests.filter((b) => b > 0).sort((a, b) => b - a);
    const show = (v) => v === 'x' ? 'Foul' : (v === '-' ? 'Pass' : fmt(v));
    const rows = roster.map((r, i) => { const b = bests[i], pl = b ? sorted.indexOf(b) + 1 : 0, ties = sorted.filter((x) => x === b).length, n = st.m[i].length;
      return { pl: pl || 99, label: pl ? (ties > 1 ? '=' : '') + pl : '–', n: r.n, h: r.h, best: b ? fmt(String(b)) + ' m' : 'No mark', jumps: n ? st.m[i].map(show).join(', ') + (n < 3 ? ' (finished early)' : '') : 'No jumps', pts: b ? ptsFor(pl, ties) : 0 }; })
      .sort((a, b) => a.pl - b.pl).map((r) => ({ n: r.n, h: r.h, best: r.best, jumps: r.jumps, pts: r.pts, pl: r.label, medal: r.pl <= 3, plain: r.pl > 3, mc: 'm' + r.pl }));
    out = { rows, sent: st.sent, notSent: !st.sent, send: () => set({ sent: true }), back: () => {}, reset: () => set({ sent: false }) };
"""
    return body, logic, "{ m: " + J(init) + ", sent: false }"

# ---------- A1.24 Field Station iPad: throw again ----------
def field_throw_again(dark):
    roster = names("M","17",12,12)
    t1 = ["Fair","Fair","Foul","Fair","Fair","Fair","Pass","Fair","Foul","Fair","Fair","Fair"]
    body = header("FIELD STATION","Field Station",dark,sub="Shot Put") + f'''
<div class="scroll"><main class="wrap">
<div class="racebar"><span class="racebadge"><small>FIELD</small><b>SP</b></span><div class="info"><b>Shot put, Boys 17: who throws again</b><span>{{{{count}}}} thrown once · Shot Put · 12:10 pm block</span></div>
<a class="btn" href="{lnk("FieldThrows",dark)}">Back to throwing</a><button type="button" class="btn navy big" onClick="{{{{start}}}}">Start throws 2 and 3</button></div>
<div class="msg ok" style="margin-bottom:12px">Everyone has thrown once. Look at the markers, then tick who throws again. Everyone else is participation. You can change this before throw 2 starts.</div>
<div class="row" style="margin-bottom:12px;gap:12px;align-items:center"><span class="chip info">{{{{ticked}}}} ticked</span><label class="label" for="agn" style="display:flex;align-items:center;gap:8px">About<input id="agn" class="markin hjin" style="width:72px" inputmode="numeric" value="{{{{guide}}}}" onChange="{{{{guideType}}}}"></label><span class="muted sm">A guide only. Tick as many or as few as you like.</span></div>
<sc-if value="{{{{started}}}}" hint-placeholder-val="{{{{false}}}}"><div class="msg ok" style="margin-bottom:12px">Throws 2 and 3 are on for the {{{{ticked}}}} ticked athletes. The rest are participation.</div></sc-if>
<div class="namegrid" style="grid-template-columns:repeat(3,minmax(0,1fr))"><sc-for list="{{{{ppl}}}}" as="p" hint-placeholder-count="12"><button type="button" class="namebtn {{{{p.c}}}}" aria-pressed="{{{{p.on}}}}" onClick="{{{{p.tap}}}}"><span class="medal m4" style="width:30px;height:30px;background:#ffffff;color:#1d3160">{{{{p.no}}}}</span><span class="hdot h{{{{p.h}}}}">{{{{p.h}}}}</span><span class="t">{{{{p.n}}}}</span><span class="chip {{{{p.tc}}}}">{{{{p.t1}}}}</span><b>{{{{p.tick}}}}</b></button></sc-for></div>
</main></div>'''
    logic = "const roster = " + J(roster) + "; const t1 = " + J(t1) + r''';
    const on = st.again;
    const nOn = roster.filter((r, i) => on[i]).length;
    out = { count: roster.length, ticked: nOn, guide: String(st.guide), guideType: (e) => set({ guide: Math.max(1, parseInt(e.target.value, 10) || 10) }), started: st.started, start: () => set({ started: true }),
      ppl: roster.map((r, i) => ({ n: r.n, h: r.h, no: i + 1, t1: t1[i], tc: t1[i] === 'Foul' ? 'bad' : '', on: !!on[i], c: on[i] ? 'sel' : '', tick: on[i] ? 'Throws again' : 'Participation', tap: () => set({ again: Object.assign({}, on, { [i]: !on[i] }), started: false }) })) };
'''
    return body, logic, "{ again: {0: true, 1: true, 3: true, 4: true, 7: true}, guide: 10, started: false }"

# ---------- A1.25 Field Station phone: throw again ----------
def field_throw_again_phone(dark):
    roster = names("M","17",12,12)
    t1 = ["Fair","Fair","Foul","Fair","Fair","Fair","Pass","Fair","Foul","Fair","Fair","Fair"]
    body = header("FIELD STATION","Field Station",dark,slim=True) + f'''
<div class="scroll"><main class="wrap" style="padding-top:8px;padding-bottom:84px"><div class="stack" style="gap:8px">
<div class="racebar ph" style="margin:0"><span class="racebadge sm"><small>FIELD</small><b>SP</b></span><div class="info"><b>Who throws again</b><span>{{{{ticked}}}} ticked, about {{{{guide}}}}</span></div></div>
<div class="msg ok">Tick who throws again. Everyone else is participation.</div>
<sc-for list="{{{{ppl}}}}" as="p" hint-placeholder-count="12"><button type="button" class="namebtn {{{{p.c}}}}" style="width:100%" aria-pressed="{{{{p.on}}}}" onClick="{{{{p.tap}}}}"><span class="medal m4" style="width:30px;height:30px;background:#ffffff;color:#1d3160">{{{{p.no}}}}</span><span class="hdot h{{{{p.h}}}}">{{{{p.h}}}}</span><span class="t">{{{{p.n}}}}</span><span class="chip {{{{p.tc}}}}">{{{{p.t1}}}}</span></button></sc-for>
</div></main></div>''' + pbar('<a class="btn" href="' + lnk("FieldThrowsPhone", dark) + '">Back</a><button type="button" class="btn navy big" onClick="{{start}}">{{startL}}</button>')
    logic = "const roster = " + J(roster) + "; const t1 = " + J(t1) + r''';
    const on = st.again, nOn = roster.filter((r, i) => on[i]).length;
    out = { ticked: nOn, guide: st.guide, startL: st.started ? 'Started' : 'Start throws 2 and 3', start: () => set({ started: true }),
      ppl: roster.map((r, i) => ({ n: r.n, h: r.h, no: i + 1, t1: t1[i], tc: t1[i] === 'Foul' ? 'bad' : '', on: !!on[i], c: on[i] ? 'sel' : '', tap: () => set({ again: Object.assign({}, on, { [i]: !on[i] }), started: false }) })) };
'''
    return body, logic, "{ again: {0: true, 1: true, 3: true, 4: true, 7: true}, guide: 10, started: false }"

# ---------- A1.26 Field Station phone: measure ----------
def field_measure_phone(dark):
    roster = names("M","17",7,12)
    init = [["Fair","Fair","Foul"],["Fair","Foul","Fair"],["Foul"],["Fair","Fair","Fair"],["Fair"],[],["Fair","Fair","Pass"]]
    body = header("FIELD STATION","Field Station",dark,slim=True) + f"""
<div class="scroll"><main class="wrap" style="padding-top:8px;padding-bottom:84px"><div class="stack" style="gap:8px">
<div class="racebar ph" style="margin:0"><span class="racebadge sm"><small>FIELD</small><b>SP</b></span><div class="info"><b>Shot put, Boys 17: measure</b><span>{{{{measured}}}} measured, about 5</span></div></div>
<div class="msg ok">Tap an athlete you measured and type the distance. Everyone else gets the set distance.</div>
<sc-for list="{{{{rows}}}}" as="r" hint-placeholder-count="7"><div class="panel" style="padding:10px 12px"><button type="button" class="namebtn {{{{r.c}}}}" style="width:100%" aria-pressed="{{{{r.open}}}}" disabled="{{{{r.off}}}}" onClick="{{{{r.tap}}}}"><span class="medal m4" style="width:30px;height:30px;background:#ffffff;color:#1d3160">{{{{r.no}}}}</span><span class="hdot h{{{{r.h}}}}">{{{{r.h}}}}</span><span class="t">{{{{r.n}}}}</span><b>{{{{r.mark}}}}</b></button>
<span class="muted" style="font-size:.85rem">{{{{r.throws}}}}</span>
<sc-if value="{{{{r.open}}}}" hint-placeholder-val="{{{{false}}}}"><div class="markshow" aria-live="polite">{{{{r.show}}}}</div><div class="keypad fp"><sc-for list="{{{{r.keys}}}}" as="k" hint-placeholder-count="12"><button type="button" class="{{{{k.c}}}}" onClick="{{{{k.press}}}}" aria-label="{{{{k.aria}}}}">{{{{k.label}}}}</button></sc-for></div><div class="row" style="flex-wrap:nowrap;margin-top:8px"><button type="button" class="btn" style="flex:1" onClick="{{{{r.cancel}}}}">Cancel</button><button type="button" class="btn navy" style="flex:1" onClick="{{{{r.save}}}}">Save mark</button></div></sc-if></div></sc-for>
<div class="panel" style="padding:10px 12px"><label class="label" for="setdp">Set distance for everyone not measured (m)</label><input id="setdp" class="markin hjin" inputmode="decimal" value="{{{{setTxt}}}}" onChange="{{{{setType}}}}"><span class="muted sm">Lower than the lowest measured mark. They share a place and get 4 points.</span>
<sc-if value="{{{{setBad}}}}" hint-placeholder-val="{{{{false}}}}"><div class="msg warn" style="margin-top:8px">{{{{setBad}}}}</div></sc-if></div>
</div></main></div>""" + pbar('<a class="btn" href="' + lnk("FieldThrowsPhone",dark) + '">Back to throwing</a><a class="btn navy big" href="' + lnk("FieldThrowsSummary",dark) + '">Group finished</a>')
    logic = "const roster = " + J(roster) + r"""; 
    const fmt = (v) => { const d = String(v).replace(/[^0-9]/g, ''); return d.length >= 3 ? d.slice(0, -2) + '.' + d.slice(-2) : d; };
    const isNum = (v) => /^[0-9]+$/.test(v) && Number(v) > 0;
    const fair = (i) => st.m[i].includes('Fair');
    const idx = roster.map((r, i) => i), meas = idx.filter((i) => fair(i) && isNum(st.mk[i]));
    const lowest = Math.min(...meas.map((i) => Number(st.mk[i])), Infinity);
    const setN = isNum(st.set) ? Number(st.set) : 0, nPart = idx.filter((i) => fair(i) && !isNum(st.mk[i])).length;
    const show = (t) => t.length ? (t.length > 2 ? t.slice(0, -2) + '.' + t.slice(-2) : '0.' + t.padStart(2, '0')) + ' m' : '0.00 m';
    const keys = () => ['1','2','3','4','5','6','7','8','9','Clear','0','Back'].map((l) => ({ label: l, aria: l, c: /^[0-9]$/.test(l) ? '' : 'w', press: () => { if (/^[0-9]$/.test(l)) { if (st.typed.length < 4) set({ typed: st.typed + l }); } else if (l === 'Back') set({ typed: st.typed.slice(0, -1) }); else set({ typed: '' }); } }));
    const put = (i, v) => { const mk = st.mk.slice(); mk[i] = v; set({ mk, open: null, typed: '' }); };
    out = { measured: meas.length, setTxt: st.set ? fmt(st.set) : '', setType: (e) => set({ set: String(e.target.value).replace(/[^0-9]/g, '') }),
      setBad: nPart > 0 && !(setN > 0 && setN < lowest) ? (setN ? 'The set distance must be lower than the lowest measured mark (' + fmt(lowest) + ' m).' : 'Type one set distance for everyone who was not measured.') : '',
      rows: roster.map((r, i) => { const op = st.open === i; return { no: i + 1, n: r.n, h: r.h, off: !fair(i) || !!st.ns[i], c: op ? 'sel' : '', open: op, mark: st.ns[i] ? 'No show' : (!fair(i) ? 'No fair throw' : (isNum(st.mk[i]) ? fmt(st.mk[i]) + ' m' : 'Participation')),
        throws: st.m[i].length ? st.m[i].join(', ') : 'No throws', tap: () => set({ open: op ? null : i, typed: isNum(st.mk[i]) ? st.mk[i] : '' }), show: show(st.typed), keys: op ? keys() : [], cancel: () => set({ open: null, typed: '' }), save: () => put(i, st.typed) }; }) };
"""
    return body, logic, "{ m: " + J(init) + ", mk: ['1124','1006','','1287','','','985'], set: '800', ns: {}, open: null, typed: '' }"

# ---------- A1.27 Field Station phone: throws group results ----------
def field_throws_summary(dark):
    roster = names("M","17",7,12)
    init = [["Fair","Fair","Foul"],["Fair","Foul","Fair"],["Foul"],["Fair","Fair","Fair"],["Fair"],[],["Fair","Fair","Pass"]]
    body = header("FIELD STATION","Field Station",dark,slim=True) + f"""
<div class="scroll"><main class="wrap" style="padding-top:8px;padding-bottom:84px"><div class="stack" style="gap:8px">
<div class="racebar ph" style="margin:0"><span class="racebadge sm"><small>FIELD</small><b>SP</b></span><div class="info"><b>Shot put, Boys 17</b><span>Group results · throwing is over</span></div></div>
<sc-if value="{{{{sent}}}}" hint-placeholder-val="{{{{false}}}}"><div class="msg ok">Sent at 12:41.</div></sc-if>
<sc-if value="{{{{notSent}}}}" hint-placeholder-val="{{{{true}}}}"><div class="msg warn">Check the places, then Send results.</div></sc-if>
<sc-for list="{{{{rows}}}}" as="r" hint-placeholder-count="7"><div class="panel" style="padding:12px 14px;display:flex;align-items:center;gap:12px">
<sc-if value="{{{{r.medal}}}}" hint-placeholder-val="{{{{true}}}}"><span class="medal {{{{r.mc}}}}">{{{{r.pl}}}}</span></sc-if><sc-if value="{{{{r.plain}}}}" hint-placeholder-val="{{{{false}}}}"><span style="width:32px;text-align:center;font-weight:800">{{{{r.pl}}}}</span></sc-if>
<div style="flex:1;min-width:0"><span class="htag"><span class="hdot h{{{{r.h}}}}">{{{{r.h}}}}</span><b>{{{{r.n}}}}</b></span><br><span class="muted" style="font-size:.85rem"><b class="bestm" style="color:var(--ink)">{{{{r.best}}}}</b> · {{{{r.throws}}}}</span></div>
<b style="text-align:right;font-size:1.05rem">{{{{r.pts}}}} pts</b></div></sc-for>
</div></main></div>""" + pbar('<sc-if value="{{notSent}}" hint-placeholder-val="{{true}}"><a class="btn" href="' + lnk("FieldMeasurePhone",dark) + '">Back to measuring</a><button type="button" class="btn navy big" onClick="{{send}}">Send results</button></sc-if><sc-if value="{{sent}}" hint-placeholder-val="{{false}}"><button type="button" class="btn navy big" onClick="{{reset}}">Next group</button></sc-if>')
    logic = "const roster = " + J(roster) + "; " + PTSJS + r"""
    const fmt = (v) => { const d = String(v); return d.slice(0, -2) + '.' + d.slice(-2); };
    const mk = ['1124','1006','','1287','','','985'], setN = 800, again = {0: true, 1: true, 3: true, 6: true};
    const fair = (i) => st.m[i].includes('Fair'), meas = (i) => fair(i) && !!mk[i];
    const marks = roster.map((r, i) => (meas(i) ? Number(mk[i]) : (fair(i) ? setN : 0))), sorted = marks.filter((b) => b > 0).sort((a, b) => b - a);
    const rows = roster.map((r, i) => { const b = marks[i], pl = b ? sorted.indexOf(b) + 1 : 0, ties = sorted.filter((x) => x === b).length;
      return { pl: pl || 99, label: pl ? (ties > 1 ? '=' : '') + pl : '–', n: r.n, h: r.h, best: b ? fmt(b) + ' m' + (meas(i) ? '' : ' set') : 'No mark', throws: st.m[i].length ? st.m[i].join(', ') + (meas(i) ? '' : (fair(i) ? ' (participation)' : '')) : 'No throws', pts: b ? ptsFor(pl, ties) : 0 }; })
      .sort((a, b) => a.pl - b.pl).map((r) => ({ n: r.n, h: r.h, best: r.best, throws: r.throws, pts: r.pts, pl: r.label, medal: r.pl <= 3, plain: r.pl > 3, mc: 'm' + r.pl }));
    out = { rows, sent: st.sent, notSent: !st.sent, send: () => set({ sent: true }), reset: () => set({ sent: false }) };
"""
    return body, logic, "{ m: " + J(init) + ", sent: false }"

# ---------- A1.28 Field Station: Take Names, discus 12 & 13 with weights ----------
def field_names_discus(dark):
    roster = names("M","13",10,5)
    body = header("FIELD STATION","Field Station",dark,sub="Discus 1") + f'''
<div class="scroll"><main class="wrap">
<div class="racebar"><span class="racebadge"><small>FIELD</small><b>D1</b></span><div class="info"><b>Discus, Boys 12 &amp; 13: Take Names</b><span>{{{{{{{{count}}}}}}}} athletes · Discus 1 · 9:15 am block</span></div>
<a class="btn" href="{lnk("FieldStart",dark)}">All groups</a><button type="button" class="btn">Not on the list</button><a class="btn navy big" href="{lnk("FieldThrows",dark)}">Start throwing</a></div>
<div class="prompt">Tap each athlete as they arrive. This is their number and their marker. Then pick the discus weight for each athlete: 12 years is 0.75 kg, 13 years is 1 kg.</div>
<sc-if value="{{{{{{{{needW}}}}}}}}" hint-placeholder-val="{{{{{{{{true}}}}}}}}"><div class="msg warn" style="margin-bottom:12px">{{{{{{{{needW}}}}}}}} athletes still need a weight.</div></sc-if>
<div class="namegrid" style="grid-template-columns:repeat(2,minmax(0,1fr))"><sc-for list="{{{{{{{{ppl}}}}}}}}" as="p" hint-placeholder-count="10"><div class="panel" style="padding:8px 10px;display:flex;align-items:center;gap:8px"><button type="button" class="namebtn {{{{{{{{p.c}}}}}}}}" style="flex:1;min-width:0" aria-pressed="{{{{{{{{p.on}}}}}}}}" onClick="{{{{{{{{p.tap}}}}}}}}"><sc-if value="{{{{{{{{p.on}}}}}}}}" hint-placeholder-val="{{{{{{{{false}}}}}}}}"><span class="medal m4" style="width:30px;height:30px;background:#ffffff;color:#1d3160">{{{{{{{{p.no}}}}}}}}</span></sc-if><sc-if value="{{{{{{{{p.off}}}}}}}}" hint-placeholder-val="{{{{{{{{true}}}}}}}}"><span class="hdot h{{{{{{{{p.h}}}}}}}}">{{{{{{{{p.h}}}}}}}}</span></sc-if><span class="t">{{{{{{{{p.n}}}}}}}}</span></button>
<button type="button" class="stbtn" style="min-width:76px" aria-pressed="{{{{{{{{p.w1}}}}}}}}" onClick="{{{{{{{{p.set1}}}}}}}}">0.75 kg</button><button type="button" class="stbtn" style="min-width:60px" aria-pressed="{{{{{{{{p.w2}}}}}}}}" onClick="{{{{{{{{p.set2}}}}}}}}">1 kg</button></div></sc-for></div>
</main></div>'''.replace("{{{{", "{{").replace("}}}}", "}}")
    logic = "const roster = " + J(roster) + r''';
    const o = st.order, w = st.w;
    out = { count: o.length, needW: o.filter((i) => !w[i]).length, ppl: roster.map((r, i) => { const p = o.indexOf(i) + 1; return { n: r.n, h: r.h, no: p, on: p > 0, off: !p, c: p ? 'sel' : '', w1: w[i] === 1, w2: w[i] === 2,
      tap: () => set({ order: p ? o.filter((x) => x !== i) : o.concat([i]) }), set1: () => set({ w: Object.assign({}, w, { [i]: 1 }) }), set2: () => set({ w: Object.assign({}, w, { [i]: 2 }) }) }; }) };
'''
    return body, logic, "{ order: [3, 0, 7, 5, 1], w: {3: 1, 0: 2, 7: 2} }"

# ---------- A1.20 Field Station: Take Names ----------
def field_names(dark):
    roster = names("M","17",16,8)
    body = header("FIELD STATION","Field Station",dark,sub="Long Jump 1") + f'''
<div class="scroll"><main class="wrap">
<div class="racebar"><span class="racebadge"><small>FIELD</small><b>LJ1</b></span><div class="info"><b>Long jump, Boys 17: Take Names</b><span>{{{{{{{{count}}}}}}}} athletes · Long Jump 1 · 9:55 am block</span></div>
<a class="btn" href="{lnk("FieldStart",dark)}">All groups</a><button type="button" class="btn">Not on the list</button><a class="btn navy big" href="{lnk("FieldMarks",dark)}">Start jumping</a></div>
<div class="prompt">Tap each athlete as they arrive. This is their number and their jumping order.</div>
<label class="label" style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px">Find an athlete<input type="search" placeholder="Type part of a name"></label>
<div class="namegrid" style="grid-template-columns:repeat(4,minmax(0,1fr))"><sc-for list="{{{{{{{{ppl}}}}}}}}" as="p" hint-placeholder-count="16"><button type="button" class="namebtn {{{{{{{{p.c}}}}}}}}" aria-pressed="{{{{{{{{p.on}}}}}}}}" onClick="{{{{{{{{p.tap}}}}}}}}"><sc-if value="{{{{{{{{p.on}}}}}}}}" hint-placeholder-val="{{{{{{{{false}}}}}}}}"><span class="medal m4" style="width:30px;height:30px;background:#ffffff;color:#1d3160">{{{{{{{{p.no}}}}}}}}</span></sc-if><sc-if value="{{{{{{{{p.off}}}}}}}}" hint-placeholder-val="{{{{{{{{true}}}}}}}}"><span class="hdot h{{{{{{{{p.h}}}}}}}}">{{{{{{{{p.h}}}}}}}}</span></sc-if><span class="t">{{{{{{{{p.n}}}}}}}}</span></button></sc-for></div>
</main></div>'''.replace("{{{{", "{{").replace("}}}}", "}}")
    logic = "const roster = " + J(roster) + r'''
    const o = st.order;
    out = { count: o.length, ppl: roster.map((r, i) => { const p = o.indexOf(i) + 1; return { n: r.n, h: r.h, no: p, on: p > 0, off: !p, c: p ? 'sel' : '', tap: () => set({ order: p ? o.filter((x) => x !== i) : o.concat([i]) }) }; }) };
'''
    return body, logic, "{ order: [3, 0, 7, 11] }"

# ---------- A1.19 Field Station phone: throws ----------
def field_phone_throws(dark):
    roster = names("M","17",7,12)
    body = header("FIELD STATION","Field Station",dark,slim=True) + f'''
<div class="scroll"><main class="wrap" style="padding-top:8px;padding-bottom:84px"><div class="stack" style="gap:8px">
<div class="racebar ph" style="margin:0"><span class="racebadge sm"><small>FIELD</small><b>SP</b></span><div class="info"><b>Shot put, Boys 17</b><span>Throw {{{{round}}}} · {{{{done}}}} of {{{{total}}}} done · Shot 5 kg</span></div></div>
<sc-if value="{{{{hasUp}}}}" hint-placeholder-val="{{{{true}}}}"><span class="htag bigath"><span class="hdot h{{{{h}}}}" style="width:30px;height:30px;font-size:.9rem">{{{{h}}}}</span>{{{{name}}}}</span>
<span class="muted" style="font-size:.9rem">Marker {{{{no}}}} · Next: {{{{nextN}}}}</span>
<div class="attrow"><sc-for list="{{{{att}}}}" as="a" hint-placeholder-count="3"><div class="attcell {{{{a.c}}}}"><span>Throw {{{{a.n}}}}</span><b style="font-size:1.05rem">{{{{a.v}}}}</b></div></sc-for></div>
<button type="button" class="btn go big" style="min-height:96px" onClick="{{{{fair}}}}">Fair</button><div class="row" style="flex-wrap:nowrap"><button type="button" class="btn redfill big" style="flex:1;min-height:96px" onClick="{{{{foul}}}}">Foul</button><button type="button" class="btn big" style="flex:1;min-height:96px" onClick="{{{{pass}}}}">Pass</button></div></sc-if>
<sc-if value="{{{{pick}}}}" hint-placeholder-val="{{{{false}}}}"><div class="msg ok">Everyone has thrown once. Look at the markers, then pick who throws again.</div><a class="btn navy big" style="min-height:72px" href="{lnk("FieldThrowAgainPhone",dark)}">Pick who throws again</a></sc-if>
<sc-if value="{{{{over}}}}" hint-placeholder-val="{{{{false}}}}"><div class="msg ok">Throwing is over. Go to Measure.</div><a class="btn navy big" style="min-height:72px" href="{lnk("FieldMeasurePhone",dark)}">Measure</a></sc-if>
</div></main></div>''' + pbar('<button type="button" class="btn" onClick="{{undo}}">Undo last</button><button type="button" class="btn" onClick="{{askFinish}}">END</button><button type="button" class="btn">Add an athlete</button>')
    logic = "const roster = " + J(roster) + r''';
    const fin = st.fin || {}, again = st.again;
    const f = (v) => v || ' ';
    // the round is the lowest throw number still to come; from throw 2, only athletes picked to throw again
    const elig = (i, rd) => !fin[i] && (rd === 0 || again[i]);
    const cnt = (i) => st.m[i].length;
    const idx = roster.map((r, i) => i);
    const behind = (r) => idx.filter((i) => elig(i, r) && cnt(i) <= r);
    let rd = 0;
    if (behind(0).length === 0) rd = !st.confirmed ? 0 : (behind(1).length ? 1 : (behind(2).length ? 2 : 3));
    const queue = rd < 3 ? behind(rd) : [];
    const upI = queue.length ? queue[0] : -1, nxI = queue.length > 1 ? queue[1] : -1;
    const pick = behind(0).length === 0 && !st.confirmed, over = rd >= 3 || (st.confirmed && queue.length === 0);
    const elN = roster.filter((r, i) => elig(i, Math.min(rd, 2))).length;
    const doneN = roster.filter((r, i) => elig(i, Math.min(rd, 2)) && cnt(i) > Math.min(rd, 2)).length;
    const add = (v) => () => { if (upI < 0) return; const m = st.m.map((x) => x.slice()); m[upI].push(v); set({ m, last: st.last.concat([upI]) }); };
    out = { round: Math.min(rd, 2) + 1, done: doneN, total: elN, hasUp: upI >= 0, pick, over: over && upI < 0 && !pick,
      name: upI >= 0 ? roster[upI].n : '', h: upI >= 0 ? roster[upI].h : 'B', no: upI + 1, nextN: nxI >= 0 ? roster[nxI].n : 'no one',
      att: [0,1,2].map((a) => ({ n: a + 1, v: upI >= 0 ? f(st.m[upI][a]) : ' ', c: upI >= 0 && a === cnt(upI) ? 'cur' : (upI >= 0 && st.m[upI][a] === 'Foul' ? 'foul' : '') })),
      fair: add('Fair'), foul: add('Foul'), pass: add('Pass'),
      undo: () => { const l = st.last[st.last.length - 1]; if (l == null) return; const m = st.m.map((x) => x.slice()); m[l].pop(); set({ m, last: st.last.slice(0, -1) }); },
      conf: st.conf && upI >= 0, nThrows: upI >= 0 ? cnt(upI) + (cnt(upI) === 1 ? ' throw' : ' throws') : '', askFinish: () => { if (upI >= 0) set({ fin: Object.assign({}, fin, { [upI]: true }) }); } };
'''
    return body, logic, "{ m: " + J([["Fair"],["Fair"],["Foul"],["Fair"],[],[],[]]) + ", again: {}, confirmed: false, last: [], fin: {}, conf: false }"

# ---------- A1.10 Field Station phone ----------
def field_phone(dark):
    roster = names("M","17",7,8)
    body = header("FIELD STATION","Field Station",dark,slim=True) + f'''
<div class="scroll"><main class="wrap" style="padding-top:8px;padding-bottom:84px"><div class="stack" style="gap:8px">
<div class="racebar ph" style="margin:0"><span class="racebadge sm"><small>FIELD</small><b>LJ1</b></span><div class="info"><b>Long jump, Boys 17</b><span>Athlete {{{{pos}}}} of 7 · {{{{left}}}} still jumping</span></div></div>
<div class="row" style="flex-wrap:nowrap;justify-content:space-between;align-items:center"><span class="htag bigath"><span class="hdot h{{{{h}}}}" style="width:30px;height:30px;font-size:.9rem">{{{{h}}}}</span>{{{{name}}}}</span><button type="button" class="btn" onClick="{{{{toggleCut}}}}">Cut the field</button></div>
<sc-if value="{{{{cut}}}}" hint-placeholder-val="{{{{false}}}}"><div class="panel hjedit"><div class="stepbox"><label class="label" for="keepnp">Keep top</label><input id="keepnp" class="markin hjin" inputmode="numeric" value="{{{{keepN}}}}" onChange="{{{{keepType}}}}"><span class="muted sm">Finishes everyone below the Nth best mark. Equal marks stay in.</span></div>
<div class="row" style="flex-wrap:nowrap"><button type="button" class="btn navy" style="flex:1" onClick="{{{{keepApply}}}}">Keep top {{{{keepN}}}}</button><sc-if value="{{{{canUndoKeep}}}}" hint-placeholder-val="{{{{false}}}}"><button type="button" class="btn" style="flex:1" onClick="{{{{keepUndo}}}}">Undo</button></sc-if><button type="button" class="btn" style="flex:1" onClick="{{{{toggleCut}}}}">Done</button></div>
<sc-if value="{{{{keepMsg}}}}" hint-placeholder-val="{{{{false}}}}"><div class="msg ok">{{{{keepMsg}}}}</div></sc-if></div></sc-if>
<span class="muted" style="font-size:.9rem">Next: {{{{nextN}}}}</span>
<div class="attrow"><sc-for list="{{{{att}}}}" as="a" hint-placeholder-count="3"><div class="attcell {{{{a.c}}}}"><span>Jump {{{{a.n}}}}</span><b>{{{{a.v}}}}</b></div></sc-for></div>
<div class="markshow" aria-live="polite">{{{{show}}}}</div>
<div class="keypad fp"><sc-for list="{{{{keys}}}}" as="k" hint-placeholder-count="12"><button type="button" class="{{{{k.c}}}}" onClick="{{{{k.press}}}}" aria-label="{{{{k.aria}}}}">{{{{k.label}}}}</button></sc-for></div>
<div class="row" style="flex-wrap:nowrap"><button type="button" class="btn redfill big" style="flex:1;min-height:64px" onClick="{{{{foul}}}}">Foul</button><button type="button" class="btn big" style="flex:1;min-height:64px" onClick="{{{{pass}}}}">Pass</button></div>
</div></main></div>''' + pbar('<button type="button" class="btn" onClick="{{undo}}">Undo last</button><button type="button" class="btn" onClick="{{askFinish}}">END</button><button type="button" class="btn navy" onClick="{{save}}">{{saveL}}</button>')
    logic = "const roster = " + J(roster) + "; " + PTSJS + r'''
    const fin = st.fin || {};
    const r = st.m[st.i] || [];
    const f = (v) => v === 'x' ? 'Foul' : (v === '-' ? 'Pass' : (v ? v.slice(0, -2) + '.' + v.slice(-2) : ''));
    const cur = r.length;
    const val = (v) => /^[0-9]+$/.test(v) ? Number(v) : 0;
    const bests = st.m.map((x) => Math.max(0, ...x.map(val)));
    const sorted = bests.filter((b) => b > 0).sort((a, b) => b - a);
    const live = (j) => !fin[j] && st.m[j].length < 3;
    const nextI = (i) => { for (let k = 1; k <= 7; k++) { const j = (i + k) % 7; if (live(j)) return j; } return i; };
    const left = st.m.filter((x, j) => live(j)).length;
    const nKeep = Math.max(1, parseInt(st.keepN, 10) || 4);
    const advance = (m) => set({ m, typed: '', i: nextI(st.i) });
    const fill = (v) => { const m = st.m.map((x) => x.slice()); m[st.i] = r.concat([v]); advance(m); };
    const labels = ['1','2','3','4','5','6','7','8','9','Clear','0','Back'];
    out = { pos: st.i + 1, left, name: roster[st.i].n, h: roster[st.i].h, nextN: nextI(st.i) === st.i ? 'no one' : roster[nextI(st.i)].n,
      show: st.typed.length ? (st.typed.length > 2 ? st.typed.slice(0, -2) + '.' + st.typed.slice(-2) : '0.' + st.typed.padStart(2, '0')) + ' m' : '0.00 m',
      att: [0,1,2].map((a) => ({ n: a + 1, v: a < cur ? f(r[a]) : ' ', c: a === cur ? 'cur' : (r[a] === 'x' ? 'foul' : '') })),
      keys: labels.map((l) => ({ label: l, aria: l, c: /^[0-9]$/.test(l) ? '' : 'w', press: () => {
        if (/^[0-9]$/.test(l)) { if (st.typed.length < 4) set({ typed: st.typed + l }); }
        else if (l === 'Back') set({ typed: st.typed.slice(0, -1) });
        else set({ typed: '' }); } })),
      foul: () => { if (cur < 3) fill('x'); }, pass: () => { if (cur < 3) fill('-'); },
      saveL: st.typed ? 'Save mark' : 'Next athlete',
      save: () => { if (st.typed && cur < 3) fill(st.typed); else set({ i: nextI(st.i), typed: '' }); },
      undo: () => { if (st.typed) set({ typed: '' }); else { const m = st.m.map((x) => x.slice()); m[st.i] = r.slice(0, -1); set({ m }); } },
      conf: st.conf, jumps: cur + (cur === 1 ? ' jump' : ' jumps'), askFinish: () => set({ fin: Object.assign({}, fin, { [st.i]: true }), typed: '', i: nextI(st.i) }),
      cut: st.cut, toggleCut: () => set({ cut: !st.cut }), keepN: String(nKeep), keepMsg: st.keepMsg, canUndoKeep: !!st.finPrev, keepType: (e) => set({ keepN: String(Math.max(1, parseInt(e.target.value, 10) || 4)) }),
      keepApply: () => { if (sorted.length < nKeep) { set({ keepMsg: 'Only ' + sorted.length + ' marks so far. No one is finished.' }); return; }
        const thr = sorted[nKeep - 1], nf = Object.assign({}, fin); let c = 0; st.m.forEach((x, j) => { if (live(j) && bests[j] < thr) { nf[j] = true; c++; } });
        set({ finPrev: fin, fin: nf, keepMsg: 'Kept the top ' + nKeep + '. ' + c + ' athletes finished.' }); },
      keepUndo: () => set({ fin: st.finPrev || {}, finPrev: null, keepMsg: '' }) };
'''
    return body, logic, "{ i: 1, typed: '', m: [['534','x','541'],['498'],[],[],[],[],[]], fin: {}, finPrev: null, keepN: '4', keepMsg: '', cut: false, conf: false }"

# ---------- A1.11 Recorder, track ----------
def recorder(dark):
    r = names("M","18",8,3)
    slip = ["12.84","13.02","13.41","12.61","12.97","13.76","14.05","13.22"]
    body = header("RECORDER","Recorder",dark) + f'''
<div class="scroll"><main class="wrap">
<div class="tabs"><button type="button" aria-pressed="true">Track</button><a class="btn" style="border-radius:999px" href="{lnk("RecorderField",dark)}">Field events</a></div>
<div class="recgrid"><div class="stack">
<div class="racebar" style="margin:0"><span class="racebadge xl"><small>RACE</small><b>3</b></span><div class="info"><b>100 m, Boys 18+</b><span>Heat 1 · <span class="chip prov">To check</span></span></div>
<button type="button" class="btn">Go to race</button><button type="button" class="btn">View slip photo</button></div>
<div class="panel" style="padding:0;overflow:hidden"><table><thead><tr><th>Lane</th><th>Runner</th><th>Place</th><th>Time</th><th class="num">Result</th><th>DNS / DQ</th></tr></thead>
<tbody><sc-for list="{{{{rows}}}}" as="r" hint-placeholder-count="8"><tr class="{{{{r.c}}}}"><td class="num" style="text-align:center;font-weight:800">{{{{r.l}}}}</td>
<td class="nmcell"><span class="htag"><span class="hdot h{{{{r.h}}}}">{{{{r.h}}}}</span><b>{{{{r.n}}}}</b></span></td>
<td><sc-if value="{{{{r.medal}}}}" hint-placeholder-val="{{{{true}}}}"><span class="medal {{{{r.mc}}}}">{{{{r.p}}}}</span></sc-if><sc-if value="{{{{r.byT}}}}" hint-placeholder-val="{{{{false}}}}"><span class="muted">By time</span></sc-if></td>
<td><input class="timein {{{{r.ic}}}}" style="min-height:48px" aria-label="Time for lane {{{{r.l}}}}" value="{{{{r.tv}}}}" onChange="{{{{r.chg}}}}"></td>
<td class="num"><b class="{{{{r.rc}}}}">{{{{r.res}}}}</b><sc-if value="{{{{r.pink}}}}" hint-placeholder-val="{{{{false}}}}"><span class="under pinkn">Slip {{{{r.t}}}}</span></sc-if></td>
<td><div class="row" style="gap:6px;flex-wrap:nowrap"><button type="button" class="stbtn" aria-pressed="{{{{r.dns}}}}" onClick="{{{{r.tapDns}}}}">DNS</button><button type="button" class="stbtn" aria-pressed="{{{{r.dq}}}}" onClick="{{{{r.tapDq}}}}">DQ</button></div></td></tr></sc-for></tbody></table></div>
<p class="muted" style="font-size:.86rem;margin:0">Type digits only: 1284 is 12.84 and 10234 is 1:02.34. Pink times were moved by the Place Judge's order; the slip time shows underneath. DQ is a lane change in the 100 m, 200 m and 400 m.</p>
<button type="button" class="btn navy big" onClick="{{{{chk}}}}">{{{{chkL}}}}</button>
</div>
<div class="panel stack"><div class="row" style="justify-content:space-between"><h3>Race overall</h3><span class="chip prov">Provisional</span></div>
<span class="muted" style="font-size:.86rem">100 m, Boys 18+ · heat 1 of 2 in · timed final</span>
<table><thead><tr><th>Place</th><th>Runner</th><th>Time</th><th class="num">Points</th><th></th></tr></thead>
<tbody><sc-for list="{{{{ov}}}}" as="r" hint-placeholder-count="8"><tr><td><sc-if value="{{{{r.medal}}}}" hint-placeholder-val="{{{{true}}}}"><span class="medal {{{{r.mc}}}}">{{{{r.p}}}}</span></sc-if><sc-if value="{{{{r.plain}}}}" hint-placeholder-val="{{{{false}}}}"><span>{{{{r.p}}}}</span></sc-if></td>
<td class="nmcell"><span class="htag"><span class="hdot h{{{{r.h}}}}">{{{{r.h}}}}</span>{{{{r.n}}}}</span></td><td class="{{{{r.tc}}}}" style="font-weight:700">{{{{r.t}}}}</td><td class="num">{{{{r.pts}}}}</td><td><sc-if value="{{{{r.hris}}}}" hint-placeholder-val="{{{{false}}}}"><span class="tag hris">HRIS</span></sc-if></td></tr></sc-for></tbody></table>
</div></div></main></div>'''
    logic = "const roster = " + J(r) + "; const slip = " + J(slip) + r''';
    const judge = { 4: 1, 1: 2, 5: 3, 2: 4 };
    // lane 1 (place 2) and lane 5 (place 3) are swapped on the slip: pink shows the judge's order
    const pinkTime = { 1: '12.91', 5: '12.92' };
    const seen = roster.map((r, i) => { const l = i + 1, off = st.dq[l] ? 'DQ' : (st.dns[l] ? 'DNS' : null);
      return { l, n: r.n, h: r.h, slip: slip[i], res: pinkTime[l] || slip[i], off, pink: !!pinkTime[l] }; });
    seen[0].slip = '12.92'; seen[4].slip = '12.91';
    const ok = seen.filter((s) => !s.off).sort((a, b) => parseFloat(a.res) - parseFloat(b.res));
    const PTS = [10, 8, 6];
    out = { chkL: st.chk ? 'Checked. Press to undo' : 'Times checked', chk: () => set({ chk: !st.chk }),
      rows: seen.map((s) => { const p = judge[s.l]; return { l: s.l, n: s.n, h: s.h, t: s.slip, res: s.off || s.res, pink: s.pink && !s.off, c: s.pink && !s.off ? 'pinkrow' : '', ic: s.pink ? 'pinkt' : '', rc: s.pink && !s.off ? 'pinkt' : '',
        medal: !!p, byT: !p, mc: 'm' + p, p: p || '', dns: !!st.dns[s.l], dq: !!st.dq[s.l],
        tv: st.times[s.l] === undefined ? s.slip : st.times[s.l], chg: (e) => { const t = Object.assign({}, st.times); t[s.l] = e.target.value; set({ times: t }); }, tapDns: () => { const d = Object.assign({}, st.dns); d[s.l] = !d[s.l]; set({ dns: d }); }, tapDq: () => { const d = Object.assign({}, st.dq); d[s.l] = !d[s.l]; set({ dq: d }); } }; }),
      ov: ok.map((s, i) => ({ p: i + 1, n: s.n, h: s.h, t: s.res, tc: s.pink ? 'pinkt' : '', pts: PTS[i] || 4, medal: i < 4, plain: i >= 4, mc: 'm' + (i + 1), hris: i < 2 })) };
'''
    return body, logic, "{ dq: {}, dns: {}, chk: false, times: {} }"

# ---------- A1.12 Recorder, field ----------
def recorder_field(dark):
    grp = names("M","17",7,8)
    marks = [["5.34","X","5.41"],["4.98","5.02","X"],["X","X","X"],["5.61","5.58","5.49"],["4.87","Pass","4.92"],["NS","",""],["5.15","X","5.20"]]
    stn = [("Long Jump 1","Boys 17","Final"),("Long Jump 2","Boys 16","Running"),("High Jump 2","Boys 18+","Running"),("Discus 2","Boys 15","Running"),("Discus 1","Boys 12 & 13","Running"),("Shot Put","Boys 14","Running"),("High Jump 1","Girls 18+","Final"),("Long Jump 1","Girls 17","Final")]
    body = header("RECORDER","Recorder",dark) + f'''
<div class="scroll"><main class="wrap">
<div class="tabs"><a class="btn" style="border-radius:999px" href="{lnk("Recorder",dark)}">Track</a><button type="button" aria-pressed="true">Field events</button></div>
<div class="recgrid" style="grid-template-columns:minmax(0,1fr) minmax(0,1.5fr)">
<div class="gcard"><div class="ghead"><h3>Stations</h3><span class="meta">9:55 am block · 7 of 48 final</span></div>
<table><thead><tr><th>Station</th><th>Group</th><th>Status</th></tr></thead><tbody>
<sc-for list="{{{{st}}}}" as="s" hint-placeholder-count="8"><tr class="{{{{s.c}}}}"><td><button type="button" class="linkbtn" onClick="{{{{s.tap}}}}">{{{{s.a}}}}</button></td><td>{{{{s.b}}}}</td><td><span class="chip {{{{s.chip}}}}">{{{{s.s}}}}</span></td></tr></sc-for>
</tbody></table></div>
<div class="stack">
<div class="racebar" style="margin:0"><span class="racebadge"><small>FIELD</small><b>LJ1</b></span><div class="info"><b>Long jump, Boys 17</b><span>Long Jump 1 · finished by the station at 10:32 am · <span class="chip final">Final</span></span></div></div>
<div class="panel" style="padding:0;overflow:hidden"><table><thead><tr><th>Place</th><th>Athlete</th><th>1</th><th>2</th><th>3</th><th class="num">Best</th><th class="num">Points</th><th></th></tr></thead><tbody>
<sc-for list="{{{{ov}}}}" as="r" hint-placeholder-count="7"><tr><td><sc-if value="{{{{r.medal}}}}" hint-placeholder-val="{{{{true}}}}"><span class="medal {{{{r.mc}}}}">{{{{r.p}}}}</span></sc-if><sc-if value="{{{{r.plain}}}}" hint-placeholder-val="{{{{false}}}}"><span>{{{{r.p}}}}</span></sc-if></td>
<td class="nmcell"><span class="htag"><span class="hdot h{{{{r.h}}}}">{{{{r.h}}}}</span>{{{{r.n}}}}</span></td><sc-for list="{{{{r.cells}}}}" as="c" hint-placeholder-count="3"><td><sc-if value="{{{{ovr}}}}" hint-placeholder-val="{{{{false}}}}"><input class="markin" aria-label="{{{{c.aria}}}}" value="{{{{c.v}}}}" onChange="{{{{c.chg}}}}"></sc-if><sc-if value="{{{{plain}}}}" hint-placeholder-val="{{{{true}}}}"><span>{{{{c.v}}}}</span></sc-if></td></sc-for><td class="num"><span class="bestm">{{{{r.best}}}}</span></td><td class="num">{{{{r.pts}}}}</td><td><sc-if value="{{{{r.hris}}}}" hint-placeholder-val="{{{{false}}}}"><span class="tag hris">HRIS</span></sc-if></td></tr></sc-for></tbody></table></div>
<sc-if value="{{{{ovr}}}}" hint-placeholder-val="{{{{false}}}}"><div class="msg warn">Override is on. Changes show on every device at once.</div></sc-if>
<p class="muted" style="font-size:.86rem;margin:0">Results are final at the station. The event coordinator can overrule any result at any time.</p>
<button type="button" class="btn big" onClick="{{{{chk}}}}">{{{{chkL}}}}</button>
</div></div></main></div>'''
    logic = "const grp = " + J(grp) + "; const marks = " + J(marks) + "; const stn = " + J(stn) + r''';
    const cls = { 'Running': '', 'Final': 'final' };
    const num = (r) => Math.max(0, ...r.map((v) => parseFloat(v) || 0));
    const list = grp.map((g, i) => ({ g, i, m: st.m[i], b: num(st.m[i]) })).sort((a, b) => b.b - a.b);
    const PTS = [10, 8, 6];
    out = { ovr: st.ovr, plain: !st.ovr, chkL: st.ovr ? 'Finish override' : 'Override (event coordinator)', chk: () => set({ ovr: !st.ovr }),
      st: stn.map((s, i) => ({ a: s[0], b: s[1], s: s[2], chip: cls[s[2]], c: i === 0 ? 'selrow' : '', tap: () => {} })),
      ov: list.map((r, i) => { const has = r.b > 0; return { p: has ? i + 1 : '–', n: r.g.n, h: r.g.h, cells: r.m.map((v, k) => ({ v, aria: r.g.n + ' attempt ' + (k + 1), chg: (e) => { const m = st.m.map((x) => x.slice()); m[r.i][k] = e.target.value; set({ m }); } })), best: has ? r.b.toFixed(2) : '–', pts: has ? (PTS[i] || 4) : 0, medal: has && i < 3, plain: !(has && i < 3), mc: 'm' + (i + 1), hris: has && i < 2 }; }) };
'''
    return body, logic, "{ ovr: false, m: " + J(marks) + " }"

# ---------- A1.13 Announcer ----------
def announcer(dark):
    a = names("M","16",3,4); b = names("F","17",3,8)
    q = [{"tag":"Races 9 and 10","ev":"100 m, Boys 16","meta":"Heats 1 and 2 · timed final","rows":[[a[0],"12.31"],[a[1],"12.58"],[a[2],"12.74"]]},
         {"tag":"Field","ev":"Long jump, Girls 17","meta":"Long Jump 1 · best marks","rows":[[b[0],"4.87 m"],[b[1],"4.62 m"],[b[2],"4.58 m"]]}]
    body = header("ANNOUNCER","Announcer",dark,slim=True) + f'''
<div class="scroll"><main class="wrap" style="padding-top:10px;padding-bottom:96px"><div class="ann ph" style="grid-template-columns:minmax(0,1fr)"><div class="stack">
<div class="water"><span class="label">On the track now</span><span class="racebadge sm"><small>RACE</small><b>12</b></span><b style="font-family:var(--font-display);font-size:1.05rem">100 m, Boys 14</b></div>
<div class="panel stack" style="padding:12px"><div class="row" style="justify-content:space-between"><span class="label">Read out next</span><span class="chip final">Final</span></div>
<div class="row phmeta"><span class="chip">{{{{tag}}}}</span><h2>{{{{ev}}}}</h2></div><span class="muted" style="font-size:.85rem">{{{{meta}}}}</span>
<div class="podium"><sc-for list="{{{{rows}}}}" as="r" hint-placeholder-count="3"><div class="pr"><span class="medal {{{{r.mc}}}}">{{{{r.p}}}}</span><div><b>{{{{r.n}}}}</b><span class="htag" style="font-size:.86rem"><span class="hdot h{{{{r.h}}}}">{{{{r.h}}}}</span>{{{{r.house}}}}</span></div><span class="t">{{{{r.t}}}}</span></div></sc-for></div></div>
<div class="panel stack" style="padding:12px"><span class="label">Field events now, 9:15 am</span><div class="fieldnow"><sc-for list="{{{{fnow}}}}" as="f" hint-placeholder-count="6"><div class="fr"><span>{{{{f.a}}}}</span><span class="muted">{{{{f.b}}}}</span></div></sc-for></div></div>
<div class="panel stack" style="padding:12px"><span class="label">House standings</span><span class="chip prov" style="align-self:flex-start">Provisional, 14 of 104 events in</span><div class="stand">
<span class="medal m1">1</span><span class="htag"><span class="hdot hJ">J</span>Jackson</span><b>186</b><span class="medal m2">2</span><span class="htag"><span class="hdot hB">B</span>Bradman</span><b>172</b><span class="medal m3">3</span><span class="htag"><span class="hdot hN">N</span>Newcombe</span><b>158</b></div></div>
</div></div></main></div>''' + pbar(f'<a class="btn" href="{lnk("Houses",dark)}">Houses</a><a class="btn" href="{lnk("Results",dark)}">Full results</a><button type="button" class="btn navy" onClick="{{{{read}}}}">Read, next</button>')
    fnow = [[STN[s], f"{BLOCKS[0][3]} {AGES[i]}"] for i, s in enumerate(BLOCKS[0][4])]
    logic = "const q = " + J(q) + "; const fn = " + J(fnow) + r''';
    const H = { B: 'Bradman', J: 'Jackson', N: 'Newcombe' };
    const c = q[st.i % q.length];
    out = { tag: c.tag, ev: c.ev, meta: c.meta, read: () => set({ i: st.i + 1 }), fnow: fn.map((f) => ({ a: f[0], b: f[1] })),
      rows: c.rows.map((r, i) => ({ p: i + 1, mc: 'm' + (i + 1), n: r[0].n, h: r[0].h, house: H[r[0].h], t: r[1] })) };
'''
    return body, logic, "{ i: 0 }"

# ---------- A1.14 Results ----------
def results(dark):
    t = names("M","18",8,3); f = names("M","17",7,8)
    t = [t[3],t[0],t[4],t[1],t[7],t[2]]; f = [f[3],f[0],f[6],f[1],f[4]]
    tr = list(zip(t,["12.61","12.91","12.92","13.02","13.22","13.41"],[1,1,1,1,1,1],[10,8,6,4,4,4]))
    fr = list(zip(f,["5.61 m","5.41 m","5.20 m","5.02 m","4.92 m"],["1","3","3","2","3"],[10,8,6,4,4]))
    tr = [{"n":a["n"],"h":a["h"],"v":b,"x":c,"p":d} for a,b,c,d in tr]
    fr = [{"n":a["n"],"h":a["h"],"v":b,"x":"Attempt "+c,"p":d} for a,b,c,d in fr]
    hris = [["100 m, Boys 18+","12.61",t[0]],["100 m, Boys 18+","12.91",t[1]],["Long jump, Boys 17","5.61 m",f[0]],["Long jump, Boys 17","5.41 m",f[1]]]
    body = header("RESULTS","Announcer",dark,extra=f'<a class="hlink" href="{lnk("Houses",dark)}">Houses</a><a class="hlink" href="{lnk("Announcer",dark)}">Back to Announcer</a>') + f'''
<div class="scroll"><main class="wrap">
<div class="row" style="justify-content:space-between;margin-bottom:12px"><div class="tabs" style="margin:0"><sc-for list="{{{{tabs}}}}" as="t" hint-placeholder-count="3"><button type="button" aria-pressed="{{{{t.on}}}}" onClick="{{{{t.tap}}}}">{{{{t.l}}}}</button></sc-for></div>
<div class="row"><span class="chip prov">Provisional, 14 of 104 events in</span><button type="button" class="btn">Export CSV</button></div></div>
<sc-if value="{{{{isRes}}}}" hint-placeholder-val="{{{{true}}}}"><div class="stack">
<div class="tabs" style="margin:0"><button type="button" aria-pressed="true">All</button><button type="button">Girls</button><button type="button">Boys</button><button type="button">Track</button><button type="button">Field</button></div>
<div class="gcard"><div class="ghead"><h3>100 m, Boys 18+</h3><span class="meta">Races 3 and 4 · 2 heats, timed final · Record [no list yet]</span><span class="chip final">Final</span></div>
<table><thead><tr><th>Place</th><th>Runner</th><th>House</th><th class="num">Time</th><th class="num">Heat</th><th class="num">Points</th><th></th></tr></thead><tbody>
<sc-for list="{{{{tr}}}}" as="r" hint-placeholder-count="6"><tr><td><sc-if value="{{{{r.medal}}}}" hint-placeholder-val="{{{{true}}}}"><span class="medal {{{{r.mc}}}}">{{{{r.pl}}}}</span></sc-if><sc-if value="{{{{r.plain}}}}" hint-placeholder-val="{{{{false}}}}"><span>{{{{r.pl}}}}</span></sc-if></td><td>{{{{r.n}}}}</td><td><span class="hdot h{{{{r.h}}}}">{{{{r.h}}}}</span></td><td class="num">{{{{r.v}}}}</td><td class="num">{{{{r.x}}}}</td><td class="num">{{{{r.p}}}}</td><td><sc-if value="{{{{r.hris}}}}" hint-placeholder-val="{{{{false}}}}"><span class="tag hris">HRIS</span></sc-if></td></tr></sc-for></tbody></table></div>
<div class="gcard"><div class="ghead"><h3>Long jump, Boys 17</h3><span class="meta">Long Jump 1 · best of the attempts · Record [no list yet]</span><span class="chip final">Final</span></div>
<table><thead><tr><th>Place</th><th>Athlete</th><th>House</th><th class="num">Best mark</th><th class="num">Set on</th><th class="num">Points</th><th></th></tr></thead><tbody>
<sc-for list="{{{{fr}}}}" as="r" hint-placeholder-count="6"><tr><td><sc-if value="{{{{r.medal}}}}" hint-placeholder-val="{{{{true}}}}"><span class="medal {{{{r.mc}}}}">{{{{r.pl}}}}</span></sc-if><sc-if value="{{{{r.plain}}}}" hint-placeholder-val="{{{{false}}}}"><span>{{{{r.pl}}}}</span></sc-if></td><td>{{{{r.n}}}}</td><td><span class="hdot h{{{{r.h}}}}">{{{{r.h}}}}</span></td><td class="num">{{{{r.v}}}}</td><td class="num">{{{{r.x}}}}</td><td class="num">{{{{r.p}}}}</td><td><sc-if value="{{{{r.hris}}}}" hint-placeholder-val="{{{{false}}}}"><span class="tag hris">HRIS</span></sc-if></td></tr></sc-for></tbody></table></div>
</div></sc-if>
<sc-if value="{{{{isHris}}}}" hint-placeholder-val="{{{{false}}}}"><div class="stack">
<div class="row" style="justify-content:space-between"><span class="muted" style="flex:1 1 400px">The top 2 in every individual event, field events included. Relays are not on the list. Sent as a file, like swimming.</span><button type="button" class="btn primary">Export HRIS file</button></div>
<div class="todo">The file layout is matched to a sample first. <span class="qchip">QUESTION 20</span></div>
<div class="panel" style="padding:0;overflow:hidden"><table><thead><tr><th>Event</th><th>Place</th><th>Athlete</th><th>House</th><th class="num">Result</th></tr></thead><tbody>
<sc-for list="{{{{hr}}}}" as="r" hint-placeholder-count="4"><tr><td><b>{{{{r.e}}}}</b></td><td><span class="medal {{{{r.mc}}}}">{{{{r.p}}}}</span></td><td>{{{{r.n}}}}</td><td><span class="hdot h{{{{r.h}}}}">{{{{r.h}}}}</span></td><td class="num">{{{{r.v}}}}</td></tr></sc-for></tbody></table></div>
</div></sc-if>
<sc-if value="{{{{isNews}}}}" hint-placeholder-val="{{{{false}}}}"><div class="panel stack" style="max-width:860px"><h2>Newsletter draft</h2>
<p class="newsbox" style="margin:0">The CCAS Athletics Carnival was held on Friday 18 June at the Mingara Athletics Track. Jackson leads the house championship so far on 186 points, with Bradman on 172 and Newcombe on 158.

Age champions and school records appear here once results are final. Check newsletter and media consent before naming students publicly.</p>
<div class="row"><button type="button" class="btn">Copy text</button></div></div></sc-if>
</main></div>'''
    logic = "const tr = " + J(tr) + "; const fr = " + J(fr) + "; const hr = " + J([[a,b,c["n"],c["h"]] for a,b,c in hris]) + r''';
    const dress = (l) => l.map((r, i) => Object.assign({}, r, { pl: i + 1, medal: i < 3, plain: i >= 3, mc: 'm' + (i + 1), hris: i < 2 }));
    const T = [['res','Event results'],['hris','HRIS Team List'],['news','Newsletter draft']];
    out = { tabs: T.map((t) => ({ l: t[1], on: st.t === t[0], tap: () => set({ t: t[0] }) })), isRes: st.t === 'res', isHris: st.t === 'hris', isNews: st.t === 'news',
      tr: dress(tr), fr: dress(fr), hr: hr.map((r, i) => ({ e: r[0], v: r[1], n: r[2], h: r[3], p: i % 2 + 1, mc: 'm' + (i % 2 + 1) })) };
'''
    return body, logic, "{ t: 'res' }"

# ---------- A1.15 Houses ----------
def houses(dark):
    def c(x, g, s): return names(x, g, 2, s)
    ch = []
    for k,(g,lab) in enumerate([("13","12 & 13"),("14","14"),("15","15"),("16","16"),("17","17"),("18","18+")]):
        ch.append({"l":lab,"g":c("F",g,20+k),"b":c("M",g,30+k)})
    ages = [["12 & 13",34,32,28],["14",38,30,32],["15",20,38,26],["16",30,30,22],["17",26,34,30],["18+",24,22,20],["Relays",0,0,0]]
    body = header("HOUSES","Announcer",dark,extra=f'<a class="hlink" href="{lnk("Results",dark)}">Results</a><a class="hlink" href="{lnk("Announcer",dark)}">Back to Announcer</a>') + '''
<div class="scroll"><main class="wrap"><div class="stack">
<div class="row" style="justify-content:space-between"><h2>House points</h2><span class="chip prov">Provisional, 14 of 104 events in</span></div>
<div class="hcards">
<div class="hcard hJ"><div class="row" style="justify-content:space-between"><span class="medal m1">1</span><span class="htag"><span class="hdot hJ">J</span><b>Jackson</b></span></div><span class="pts">186</span><div class="barw"><div class="bar" style="width:100%"></div></div><span class="muted" style="font-size:.86rem">Track 104, field 82, relays not run yet</span></div>
<div class="hcard hB"><div class="row" style="justify-content:space-between"><span class="medal m2">2</span><span class="htag"><span class="hdot hB">B</span><b>Bradman</b></span></div><span class="pts">172</span><div class="barw"><div class="bar" style="width:92%"></div></div><span class="muted" style="font-size:.86rem">Track 88, field 84, relays not run yet</span></div>
<div class="hcard hN"><div class="row" style="justify-content:space-between"><span class="medal m3">3</span><span class="htag"><span class="hdot hN">N</span><b>Newcombe</b></span></div><span class="pts">158</span><div class="barw"><div class="bar" style="width:85%"></div></div><span class="muted" style="font-size:.86rem">Track 84, field 74, relays not run yet</span></div>
</div>
<div class="grid2" style="grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);align-items:start">
<div class="panel stack"><h3>Points by age group</h3><table><thead><tr><th>Age group</th><th class="num"><span class="hdot hB">B</span></th><th class="num"><span class="hdot hJ">J</span></th><th class="num"><span class="hdot hN">N</span></th></tr></thead><tbody>
<sc-for list="{{ages}}" as="a" hint-placeholder-count="7"><tr><td>{{a.l}}</td><td class="num">{{a.b}}</td><td class="num">{{a.j}}</td><td class="num">{{a.n}}</td></tr></sc-for>
<tr><td><b>Total</b></td><td class="num"><b>172</b></td><td class="num"><b>186</b></td><td class="num"><b>158</b></td></tr></tbody></table>
<span class="muted" style="font-size:.85rem">Girls and boys together. Relays count for houses only. The 1500 m: <span class="qchip">QUESTION 14</span></span></div>
<div class="stack"><h3>Age champions</h3><div class="grid2"><sc-for list="{{ch}}" as="c" hint-placeholder-count="6"><div class="panel" style="padding:10px 12px"><b style="font-family:var(--font-display)">{{c.l}}</b>
<sc-for list="{{c.rows}}" as="r" hint-placeholder-count="4"><div class="champ"><span class="medal {{r.mc}}" style="width:26px;height:26px">{{r.p}}</span><span>{{r.n}} <span class="muted">({{r.x}})</span></span><span class="hdot h{{r.h}}">{{r.h}}</span></div></sc-for></div></sc-for></div>
<span class="muted" style="font-size:.85rem">Most points, counting only 1st, 2nd and 3rd place. Relays do not count. Joint champions have no runner up.</span></div>
</div></div></main></div>'''
    logic = "const ch = " + J(ch) + "; const ages = " + J(ages) + r''';
    out = { ages: ages.map((a) => ({ l: a[0], b: a[1], j: a[2], n: a[3] })),
      ch: ch.map((c, k) => { const row = (p, s, x) => ({ p, mc: 'm' + p, n: s.n, h: s.h, x });
        const G = k === 1 ? [row(1, c.g[0], 'Girls'), row(1, c.g[1], 'Girls')] : [row(1, c.g[0], 'Girls'), row(2, c.g[1], 'Girls')];
        return { l: c.l, rows: G.concat([row(1, c.b[0], 'Boys'), row(2, c.b[1], 'Boys')]) }; }) };
'''
    return body, logic, "{}"

# ---------- A1.16 Carnival Organiser ----------
def organiser(dark):
    secs = [("details","1. Carnival details","Friday 18 June 2027"),("students","2. Students","620 test students"),("program","3. Program","104 events"),
            ("field","4. Field event rules","From the 2027 sheets"),("points","5. Points","10, 8, 6, 4"),("limits","6. Odd-time limits","By distance"),
            ("records","7. Records","No list yet"),("export","8. Export","CSV, HRIS file, backup"),("lock","9. Lock and new carnival","Results open")]
    prog = []
    prog.append(["8:30 am","1500 m, boys and girls","Open","–"])
    for b in BLOCKS:
        prog.append([b[0], f"{b[2]}, {b[1].lower()}", "18+ down to 12 & 13", f"{b[3]}: " + ", ".join(sorted(set(b[4])))])
    prog.append(["1:35 pm","4 x 100 m relay, girls then boys","Junior, Intermediate, Senior","–"])
    org_sec = '''
<sc-if value="{{is.details}}" hint-placeholder-val="{{true}}"><div class="stack"><h2>Carnival details</h2><div class="fields">
<label>Carnival name<input value="CCAS Athletics Carnival 2027"></label><label>Date<input value="Friday 18 June 2027"></label><label>Venue<input value="Mingara Athletics Track"></label><label>Lanes<input value="8"></label><label>Ages as at<input value="31 December 2027"></label><label>Chief Official<input value="Jordan Dennis"></label></div>
<h3>Job PINs</h3><div class="row"><span class="chip">One PIN per job</span><span class="muted">Checked on the server. The organiser PIN opens this screen.</span></div></div></sc-if>
<sc-if value="{{is.students}}" hint-placeholder-val="{{false}}"><div class="stack"><h2>Students</h2><p class="muted" style="margin:0">Made-up test students only. Date of birth is used on this computer to work out the age group, and is never stored.</p>
<div class="row"><span class="chip final">620 students loaded</span><button type="button" class="btn">Load a student list</button></div>
<table><thead><tr><th>Age group</th><th class="num">Girls</th><th class="num">Boys</th><th>Relay band</th></tr></thead><tbody><sc-for list="{{agegrid}}" as="a" hint-placeholder-count="6"><tr><td><b>{{a.g}}</b></td><td class="num">{{a.f}}</td><td class="num">{{a.m}}</td><td>{{a.b}}</td></tr></sc-for></tbody></table></div></sc-if>
<sc-if value="{{is.program}}" hint-placeholder-val="{{false}}"><div class="stack"><h2>Program</h2>
<h3>Events on your program</h3><p class="muted" style="margin:0">Turn events on or off to match your school's program, or add your own. Turned off, an event is hidden on every job.</p>
<table><thead><tr><th>Event</th><th>Type</th><th>Groups</th><th class="num">Events</th><th>On</th><th></th></tr></thead><tbody><sc-for list="{{evs}}" as="e" hint-placeholder-count="11"><tr><td><b>{{e.l}}</b></td><td>{{e.t}}</td><td>{{e.g}}</td><td class="num">{{e.n}}</td><td><button type="button" class="switch" role="switch" aria-checked="{{e.on}}" aria-label="{{e.l}} on the program" onClick="{{e.tog}}"></button></td><td><sc-if value="{{e.own}}" hint-placeholder-val="{{false}}"><button type="button" class="btn small danger" onClick="{{e.del}}">Remove</button></sc-if></td></tr></sc-for></tbody></table>
<sc-if value="{{notAdding}}" hint-placeholder-val="{{true}}"><button type="button" class="btn" style="align-self:flex-start" onClick="{{startAdd}}">Add an event</button></sc-if>
<sc-if value="{{adding}}" hint-placeholder-val="{{false}}"><div class="row"><label class="label" style="display:flex;flex-direction:column;gap:4px">Event name<input aria-label="Event name" placeholder="For example, triple jump" value="{{newName}}" onChange="{{typeName}}"></label><button type="button" class="choice" aria-pressed="{{newField}}" onClick="{{setField}}">Field</button><button type="button" class="choice" aria-pressed="{{newTrack}}" onClick="{{setTrack}}">Track</button><button type="button" class="btn primary" onClick="{{addEv}}">Add</button><button type="button" class="btn" onClick="{{cancelAdd}}">Cancel</button></div></sc-if>
<b>{{total}} events: {{nTrack}} track, {{nField}} field</b>
<h3>Timetable</h3><p class="muted" style="margin:0">The 2026 timetable. In each block one sex runs, oldest first, while the other does field events. Race numbers on the day follow whatever the marshal sends.</p>
<table><thead><tr><th>Start</th><th>Track</th><th>Groups</th><th>Field events</th></tr></thead><tbody><sc-for list="{{prog}}" as="p" hint-placeholder-count="10"><tr><td class="nmcell"><b>{{p.a}}</b></td><td><b>{{p.b}}</b></td><td>{{p.c}}</td><td style="font-size:.9rem">{{p.d}}</td></tr></sc-for></tbody></table>
</div></sc-if>
<sc-if value="{{is.field}}" hint-placeholder-val="{{false}}"><div class="stack"><h2>Field event rules</h2><p class="muted" style="margin:0">From the 2027 CCAS instruction sheets. Change them here to suit your school.</p>
<table><thead><tr><th>Event</th><th>Attempts</th><th>What is measured</th><th>Ties</th></tr></thead><tbody>
<tr><td><b>Long jump</b></td><td>3 jumps. If too many athletes, 2 jumps, then the top 4 get a 3rd</td><td>Every jump</td><td>Share the place and points</td></tr>
<tr><td><b>Shot put</b></td><td>3 throws</td><td>The best throw only</td><td>Share the place and points</td></tr>
<tr><td><b>Discus</b></td><td>3 throws</td><td>The best throw only</td><td>Share the place and points</td></tr>
<sc-if value="{{jav}}" hint-placeholder-val="{{false}}"><tr><td><b>Javelin</b></td><td>3 throws</td><td>The best throw only</td><td>Share the place and points</td></tr></sc-if>
<tr><td><b>High jump</b></td><td>3 tries at each height, out after 3 misses in a row</td><td>Highest height cleared</td><td>Fewer misses at that height, then overall, then share</td></tr></tbody></table>
<div class="row"><span class="chip">High jump raises</span><span class="muted">Girls: 5 cm until 3 remain, then 3 cm. Boys: 10 cm first, then 5 cm until 3 remain, then 3 cm.</span></div>
<h3>Heights and weights</h3><table><thead><tr><th>Age</th><th>High jump start, G / B</th><th>Shot, G / B</th><th>Discus, G / B</th><sc-if value="{{jav}}" hint-placeholder-val="{{false}}"><th>Javelin, G / B</th></sc-if></tr></thead><tbody><sc-for list="{{wts}}" as="w" hint-placeholder-count="7"><tr><td><b>{{w.a}}</b></td><td>{{w.hj}}</td><td>{{w.s}}</td><td>{{w.d}}</td><sc-if value="{{jav}}" hint-placeholder-val="{{false}}"><td>{{w.j}}</td></sc-if></tr></sc-for></tbody></table>
<h3>Locations for each sport</h3><p class="muted" style="margin:0">Tick 1 or 2 locations for each field event that is on your program. With 1 location, groups on at the same time share it.</p>
<table style="max-width:640px"><thead><tr><th>Sport</th><th>1 location</th><th>2 locations</th></tr></thead><tbody><sc-for list="{{locs}}" as="l" hint-placeholder-count="5"><tr><td><b>{{l.l}}</b></td>
<td><label style="display:flex;align-items:center;gap:10px;min-height:48px;cursor:pointer"><input type="checkbox" style="width:24px;height:24px" aria-label="{{l.l}}, 1 location" checked="{{l.one}}" onChange="{{l.tap1}}">1</label></td>
<td><label style="display:flex;align-items:center;gap:10px;min-height:48px;cursor:pointer"><input type="checkbox" style="width:24px;height:24px" aria-label="{{l.l}}, 2 locations" checked="{{l.two}}" onChange="{{l.tap2}}">2</label></td></tr></sc-for></tbody></table>
<h3>Stations</h3><div class="row"><sc-for list="{{stations}}" as="s" hint-placeholder-count="7"><span class="chip">{{s}}</span></sc-for></div></div></sc-if>
<sc-if value="{{is.points}}" hint-placeholder-val="{{false}}"><div class="stack"><h2>Points</h2><table style="max-width:520px"><thead><tr><th>Place</th><th class="num">Age events</th><th class="num">Relays</th></tr></thead><tbody><tr><td>1st</td><td class="num">10</td><td class="num">20</td></tr><tr><td>2nd</td><td class="num">8</td><td class="num">16</td></tr><tr><td>3rd</td><td class="num">6</td><td class="num">12</td></tr><tr><td>4th and below</td><td class="num">4</td><td class="num">8</td></tr></tbody></table>
<p class="muted" style="margin:0">A no-show or no valid mark gets 0. One relay team per house, so each relay has 3 teams, with no names. Equal times in different heats share the points, as in swimming. In the 800 m and 1500 m, a marshalled runner with no time gets 1 second more than the place before. Age champions count only 1st to 3rd place points, and relays do not count. The 1500 m: <span class="qchip">QUESTION 14</span></p></div></sc-if>
<sc-if value="{{is.limits}}" hint-placeholder-val="{{false}}"><div class="stack"><h2>Odd-time limits</h2><p class="muted" style="margin:0">The Recorder is warned if a typed time is outside these. Values are to set.</p><table style="max-width:520px"><thead><tr><th>Event</th><th>Fastest allowed</th><th>Slowest allowed</th></tr></thead><tbody><sc-for list="{{limits}}" as="l" hint-placeholder-count="5"><tr><td><b>{{l}}</b></td><td class="todoh">[TO SET]</td><td class="todoh">[TO SET]</td></tr></sc-for></tbody></table></div></sc-if>
<sc-if value="{{is.records}}" hint-placeholder-val="{{false}}"><div class="stack"><h2>Records</h2><div class="todo">No CCAS athletics records list yet. <span class="qchip">QUESTION 10</span></div><button type="button" class="btn" style="align-self:flex-start">Load a records list</button></div></sc-if>
<sc-if value="{{is.export}}" hint-placeholder-val="{{false}}"><div class="stack"><h2>Export</h2><div class="row"><button type="button" class="btn">Download results CSV</button><button type="button" class="btn">Download HRIS file</button><button type="button" class="btn">Download full backup</button><button type="button" class="btn">Restore a backup</button></div><p class="muted" style="margin:0">No automatic backups. Export after the carnival. The HRIS file layout: <span class="qchip">QUESTION 20</span></p></div></sc-if>
<sc-if value="{{is.lock}}" hint-placeholder-val="{{false}}"><div class="stack"><h2>Lock and new carnival</h2><div class="row"><button type="button" class="btn">Lock results</button><button type="button" class="btn danger">Clear practice data</button><button type="button" class="btn">Start a new carnival</button></div><p class="muted" style="margin:0">Clear practice data is for the staff run-through and asks first. Past years stay look only. The event coordinator (organiser PIN) can overrule any result at any time.</p></div></sc-if>
'''
    body = header("CARNIVAL ORGANISER","Carnival Organiser",dark,sub="CCAS Athletics Carnival 2027 · Organiser PIN only",extra=f'<a class="hlink" href="{lnk("Main",dark)}">Change year</a>') + '''
<div class="scroll"><main class="wrap"><div class="org">
<div class="secnav"><sc-for list="{{secs}}" as="s" hint-placeholder-count="9"><button type="button" aria-pressed="{{s.on}}" onClick="{{s.tap}}"><b>{{s.l}}</b><span class="{{s.c}}">{{s.sub}}</span></button></sc-for></div>
<div class="panel">''' + org_sec + '''</div></div></main></div>'''
    from collections import Counter
    cnt = Counter((s["g"], s["x"]) for s in STU)
    agegrid = [{"g":lab,"f":cnt[(g,"F")],"m":cnt[(g,"M")],"b":b} for g,lab,b in [("13","12 & 13","Junior"),("14","14","Junior"),("15","15","Intermediate"),("16","16","Intermediate"),("17","17","Senior"),("18","18+","Senior")]]
    logic = "const S = " + J(secs) + "; const prog = " + J(prog) + "; const agegrid = " + J(agegrid) + r''';
    const fieldOn = st.ev.filter((e) => e.t === 'Field' && e.on);
    const stations = []; fieldOn.forEach((e) => { const n = st.loc[e.k]; if (n === 1) stations.push(e.l); if (n === 2) { stations.push(e.l + ' 1'); stations.push(e.l + ' 2'); } });
    const pick = (k, n) => () => { const loc = Object.assign({}, st.loc); loc[k] = loc[k] === n ? 0 : n; set({ loc }); };
    const on = st.ev.filter((e) => e.on);
    const sum = (l) => l.reduce((t, e) => t + e.n, 0);
    const total = sum(on), nField = sum(fieldOn), nTrack = total - nField;
    const change = (k, f) => st.ev.map((e) => e.k === k ? Object.assign({}, e, f) : e);
    const is = {}; S.forEach((s) => { is[s[0]] = st.s === s[0]; });
    const wt = [["12", "1.05 / 1.15 m", "3 / 3 kg", "0.75 / 0.75 kg", "400 / 600 g"], ["13", "1.05 / 1.15 m", "3 / 3 kg", "1 / 1 kg", "400 / 600 g"], ["14", "1.10 / 1.15 m", "3 / 4 kg", "1 / 1 kg", "500 / 700 g"], ["15", "1.10 / 1.20 m", "3 / 4 kg", "1 / 1 kg", "500 / 700 g"], ["16", "1.10 / 1.20 m", "3 / 5 kg", "1 / 1.5 kg", "500 / 700 g"], ["17", "1.10 / 1.20 m", "3 / 5 kg", "1 / 1.5 kg", "500 / 700 g"], ["18+", "1.10 / 1.20 m", "4 / 6 kg", "1 / 1.75 kg", "600 / 800 g"]];
    out = { is, agegrid, stations, total, nTrack, nField, wts: wt.map((w) => ({ a: w[0], hj: w[1], s: w[2], d: w[3], j: w[4] })), jav: !!fieldOn.find((e) => e.k === 'J'),
      locs: fieldOn.map((e) => ({ l: e.l, one: st.loc[e.k] === 1, two: st.loc[e.k] === 2, tap1: pick(e.k, 1), tap2: pick(e.k, 2) })),
      evs: st.ev.map((e) => ({ l: e.l, t: e.t, g: e.g, n: e.n, on: e.on, own: !!e.own, tog: () => set({ ev: change(e.k, { on: !e.on }) }), del: () => set({ ev: st.ev.filter((x) => x.k !== e.k) }) })),
      adding: st.adding, notAdding: !st.adding, newName: st.nm, newField: st.nt === 'Field', newTrack: st.nt === 'Track',
      startAdd: () => set({ adding: true, nm: '', nt: 'Field' }), cancelAdd: () => set({ adding: false }), typeName: (e) => set({ nm: e.target.value }),
      setField: () => set({ nt: 'Field' }), setTrack: () => set({ nt: 'Track' }),
      addEv: () => { const l = st.nm.trim(); if (!l) return; const k = 'x' + (st.ev.length + 1); set({ ev: st.ev.concat([{ k, l, t: st.nt, g: 'Each age, boys and girls', n: 12, on: true, own: true }]), loc: Object.assign({}, st.loc, { [k]: 1 }), adding: false }); },
      limits: ['100 m','200 m','400 m','800 m','1500 m','4 x 100 m relay'],
      prog: prog.map((p) => ({ a: p[0], b: p[1], c: p[2], d: p[3] })).concat(st.ev.filter((e) => e.on && (e.own || e.k === 'J')).map((e) => ({ a: 'Set a time', b: e.l, c: e.g, d: '–' }))),
      secs: S.map((s) => ({ l: s[1], sub: s[0] === 'program' ? total + ' events' : s[2], c: '', on: st.s === s[0], tap: () => set({ s: s[0] }) })) };
'''
    return body, logic, r'''{ s: 'program', adding: false, nm: '', nt: 'Field', loc: { D: 2, LJ: 2, J: 1, SP: 1, HJ: 2 }, ev: [{"k": "100", "l": "100 m", "t": "Track", "g": "Each age, boys and girls", "n": 12, "on": true}, {"k": "200", "l": "200 m", "t": "Track", "g": "Each age, boys and girls", "n": 12, "on": true}, {"k": "400", "l": "400 m", "t": "Track", "g": "Each age, boys and girls", "n": 12, "on": true}, {"k": "800", "l": "800 m", "t": "Track", "g": "Each age, boys and girls", "n": 12, "on": true}, {"k": "1500", "l": "1500 m", "t": "Track", "g": "Open, boys and girls", "n": 2, "on": true}, {"k": "R", "l": "4 x 100 m relay", "t": "Track", "g": "Junior, Intermediate, Senior", "n": 6, "on": true}, {"k": "HJ", "l": "High Jump", "t": "Field", "g": "Each age, boys and girls", "n": 12, "on": true}, {"k": "LJ", "l": "Long Jump", "t": "Field", "g": "Each age, boys and girls", "n": 12, "on": true}, {"k": "SP", "l": "Shot Put", "t": "Field", "g": "Each age, boys and girls", "n": 12, "on": true}, {"k": "D", "l": "Discus", "t": "Field", "g": "Each age, boys and girls", "n": 12, "on": true}, {"k": "J", "l": "Javelin", "t": "Field", "g": "Each age, boys and girls", "n": 12, "on": false}] }'''

# ---------- layout on the canvas ----------
gap = 80; rowgap = 120
R1 = 0; R2 = 820 + rowgap + 103; R3 = R2 + 982 + rowgap + 103
board("Main","A1.1 Home: a job PIN opens its job straight away; only the organiser PIN shows all jobs, iPad landscape",*IPAD,home,0,R1)
board("MarshalPick","A1.2 Track Marshal (a): pick race, boys or girls, age, iPad landscape",*IPAD,marshal_pick,1260,R1)
board("MarshalLanes","A1.3 Track Marshal (b): names into lanes, iPad landscape",*IPAD,marshal_lanes,2520,R1)
board("PlaceJudge","A1.4 Track Place Judge: tap the top 4 at the finish line, phone",*PHONE,judge,3780,R1,radius=40)
board("Multitimer","A1.5 Multitimer (800 m, 1500 m): names, START, splits, STOP, a button next to each name, then next heat or a new age on the phone",*PHONE,multitimer,4250,R1,radius=40)
board("TimeSlips","A1.6 Time Slips: photo each heat's slip, phone",*PHONE,slips,4720,R1,radius=40)
board("FieldStart","A1.7 Field Station (a): pick the station, its day from the timetable, iPad landscape",*IPAD,field_start,0,R2)
board("FieldMarks","A1.8 Field Station (b): long jump, up to 3 jumps, Foul and Pass, END and Keep top N, iPad landscape",*IPAD,field_marks,1260,R2)
board("FieldHigh","A1.9 Field Station (c): high jump, tap the box that is up, Clear, Miss or Pass, start height and raise can be set, END, iPad landscape",*IPAD,field_high,2520,R2)
board("FieldPhone","A1.10 Field Station (d): long jump, one athlete at a time, Foul and Pass, END, Cut the field, phone",*PHONE,field_phone,3780,R2,radius=40)
board("Announcer","A1.13 Announcer: on the track now, read out next, field now, house standings, phone",*PHONE,announcer,4250,R2,radius=40)
board("MarshalRelay","A1.17 Track Marshal (c): relay, a house in each lane, no names, iPad landscape",*IPAD,marshal_relay,5190,R1)
board("FieldNames","A1.20 Field Station: Take Names, tap each athlete as they arrive, then start, iPad landscape",*IPAD,field_names,6450,R2)
board("FieldHighPhone","A1.21 Field Station (g): high jump, one athlete at a time, phone, with typed heights and END",*PHONE,field_high_phone,7710,R2,radius=40)
board("FieldLJSummary","A1.23 Field Station (i): long jump, group results to check and send, phone",*PHONE,field_lj_summary,8650,R2,radius=40)
board("FieldThrowAgain","A1.24 Field Station (j): shot put and discus, tick who throws again after throw 1, iPad landscape",*IPAD,field_throw_again,9120,R2)
board("FieldNamesDiscus","A1.28 Field Station: Take Names, discus 12 & 13, pick each athlete's weight, iPad landscape",*IPAD,field_names_discus,10380,R2)
board("FieldThrowAgainPhone","A1.25 Field Station (k): who throws again, phone",*PHONE,field_throw_again_phone,11640,R2,radius=40)
board("FieldMeasurePhone","A1.26 Field Station (l): measure the best throws and set the participation distance, phone",*PHONE,field_measure_phone,12110,R2,radius=40)
board("FieldThrowsSummary","A1.27 Field Station (m): shot put and discus, group results to check and send, phone",*PHONE,field_throws_summary,12580,R2,radius=40)
board("FieldHighSummary","A1.22 Field Station (h): high jump, group results to check and send, phone",*PHONE,field_high_summary,8180,R2,radius=40)
board("FieldThrows","A1.18 Field Station (e): shot put and discus, Fair, Foul or Pass, measured marks, set distance, END, iPad landscape",*IPAD,field_throws,4720,R2)
board("FieldThrowsPhone","A1.19 Field Station (f): shot put and discus, one athlete at a time, Throw again, END, phone",*PHONE,field_phone_throws,5980,R2,radius=40)
board("Recorder","A1.11 Recorder, track: slip times, pink swaps, race overall, MacBook",*MAC,recorder,0,R3,radius=0)
board("RecorderField","A1.12 Recorder, field: stations, final results, override, MacBook",*MAC,recorder_field,1592,R3,radius=0)
board("Results","A1.14 Results: event results, HRIS Team List, newsletter draft, MacBook",*MAC,results,3184,R3,radius=0)
board("Houses","A1.15 Houses: standings, points by age group, age champions, iPad landscape",*IPAD,houses,4776,R3)
board("Organiser","A1.16 Carnival Organiser: 9 sections, add or remove events, field rules from the sheets, 1 or 2 locations, MacBook",*MAC,organiser,6036,R3,radius=0)

index_boards, order = {}, []
DARK_DY = 0
for b in BOARDS:
    for dark in (False, True):
        body, logic, init = b["fn"](dark)
        name = lnk(b["file"], dark)
        title = b["title"].split(":")[0].split(" ",1)[1] + (" dark" if dark else "")
        open(os.path.join(PROJ, name), "w").write(page(title, b["w"], b["h"], body, logic, dark, init))
        e = {"x": b["x"], "y": b["y"], "w": b["w"], "h": b["h"], "title": b["title"] + (" (dark)" if dark else ""), "is_interactive": True}
        if b["radius"]: e["radius"] = b["radius"]
        if dark: e["page"] = "dark"
        else: e["page"] = "light"
        index_boards[name] = e
        order.append(name)
json.dump({"boards": index_boards, "order": order}, open(os.path.join(OUT, "boards.json"), "w"), indent=1)
print(len(order), "files")
