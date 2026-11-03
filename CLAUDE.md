# CCAS Athletics Carnival app

Web app to run the Central Coast Adventist School (CCAS) athletics carnival, about 19 June 2027 (exact day to confirm), at Mingara Athletics Track (8 lanes). The program, points and awards are in PROJECT-STATE 2.1, from Jordan's 2026 sheets in `docs/`.

Owner: Jordan, PDHPE Head of Department at CCAS.

**Athletics only.** The swimming carnival app (`SWIM 2027- App/ccas-swimming`) and cross country are separate projects. Reuse their code and lessons, but never change them from this project.

## Where the truth lives (in this order)

1. **`PROJECT-STATE.md`** (the latest dated version) holds:
   - the decisions (numbered);
   - the open questions;
   - the next steps.

   It wins over anything else. If something conflicts with it, follow it and tell Jordan.
2. **The design canvas**, once drawn and approved (boards A1.1 and on).
3. **`baseline/`**: screenshots of every approved screen, once the first build is approved.

## Rules for every reply, file and screen

- Australian spelling. Simple, direct language.
- No em dashes anywhere: replies, code comments, app text, docs. En dashes are fine in number ranges (Years 7–10).
- No emojis.
- Money in AUD, rounded to the nearest dollar.
- Never use these words: delve, realm, unleash, tapestry, holistic, synthesize, substantiate, paramount, empirical, transcend, pivotal.
- Number every app change as **Aths Opt X.Y** (the first build is Aths Opt 1.0). Design changes are **A X.Y** (the first board is A1.1).
- After any decision, answered question or finished work, update `PROJECT-STATE.md`: write a new dated version, and tell Jordan what changed.
- Ask Jordan any open questions from PROJECT-STATE instead of letting them sit.
- When a session gets long, remind Jordan of the handover routine: a new dated PROJECT-STATE, then a fresh session.

## The look

Start from the approved swimming app look, so staff see one family of apps:
- the same CSS tokens and components (buttons, chips, boxes, job pill, PIN keypad);
- Red Hat Display, Text and Mono;
- the CCAS navy #1d3160 and yellow #ffc907;
- the house colours: Bradman red, Jackson green, Newcombe blue, with the house letter in the dot;
- the medals (gold #d4af37, silver #c0c4ca, bronze #cd7f32);
- touch targets of 48 px or more;
- light and dark themes.

Screens that athletics needs and swimming does not (field event attempts, heights, a track lane draw) are drawn on the design canvas first. Jordan approves each board before it is built. Once approved, any visual change needs Jordan's OK first.

## Checks before Jordan sees a build

All three must pass, in order. A failure goes back to the build, never to Jordan.

1. **Pixel diff.** Shoot every screen, size and theme with a Playwright script (like the swimming `tests/baseline_shots.py`), and compare with `tests/visual_diff.py` (threshold 0.1%). Compare against the approved baseline. For a build that changes screens on purpose, compare against shots of the previous commit made with the same script, and list every changed screen. If one whole device and theme set fails by a small amount, re-run just that set: one-off text smoothing changes happen.
2. **Claude in Chrome walk-through.** Use Jordan's Chrome through the Claude in Chrome extension. Run the full carnival flow at each device size, and compare each screen with its baseline image. Read the console and network logs.
   - Chrome cannot go narrower than 500 px and may not hold a size. Use the built-in browser for phone and iPad sizes.
   - Chrome can serve old cached files on `localhost`. Refresh them first.
3. **Fresh-eyes review.** A separate agent that did not build it compares the baseline with the new screenshots. It lists every difference and checks both themes, no sideways scroll on a phone, contrast and tap targets.

## How it is built (same as swimming)

- Plain HTML, CSS and JavaScript. No build step and no framework.
- **Store:** Supabase, Sydney region (ap-southeast-2), with a swappable storage layer. Test mode is `?mode=local`: one device only, browser tabs act as separate devices, no Supabase.
- **Hosting:** GitHub Pages, with `main` at the site root and `staging` at `/staging/`. Files are version-stamped on deploy so phones get the new version.
- **PINs:** one PIN per job, checked on the server. Security comes from row-level security, and only the public anon key goes in the page.
- Every job works on any device, all linked live.
- **Server rules:**
  - Keep all SQL in `supabase/01-setup.sql`, safe to run again.
  - Test it on a throwaway local Postgres (like the swimming `tests/sql_test.py`) before Jordan runs it.
  - Give Jordan numbered click-by-click steps whenever he must run it, and push nothing to main until he has.
- Jordan's Mac has no Homebrew or admin. Tools are shared with the swimming project, in `/Users/jordan.dennis/SWIM 2027- App/.venv` (Python 3.9 with Playwright, Chromium, Pillow, pgserver, psycopg). Node is Playwright's copy: `/Users/jordan.dennis/SWIM 2027- App/.venv/lib/python3.9/site-packages/playwright/driver/node`. Serve with `python3 -m http.server <port> --bind 127.0.0.1`, run in the background.
- Push only when Jordan says so. Build on `staging`; `main` gets a build only after Jordan agrees.

## Lessons from the swimming app (build these in from the start)

- **Results rules in one engine file.** Places, points, records, house totals and champions are worked out on each device from the stored records, never stored. Engine tests run with Node.
- **Race numbers.** One shared counter, safe when two devices send at once (no repeats, no gaps). Include a way to:
  - cancel an event sent in error;
  - re-run one with the same number;
  - set the next number forward to match any timing equipment.
- **Offline.**
  - Every save works with no signal and waits in a queue on the device.
  - The queue waits until the device has a job again before it sends, and never drops a result.
  - Show "Waiting to send" truthfully, and "Sent" only when it has gone.
  - Big items such as photos go in IndexedDB.
- **Never lose typed work.** A late automatic entry never overwrites what a person typed: show the difference and let them pick. Half-filled screens (for example a lane list) survive a reload.
- **Relief helpers.** A device that reloads or is handed over opens where the job is up to, not on event 1.
- **Undo.** Every tap that changes a result can be undone, and anything that clears a screen asks first.
- **Organiser tools:**
  - a real file download for the CSV results;
  - a full backup file, with restore;
  - "Clear practice data" for the staff run-through;
  - lock results;
  - a new carnival each year, with past years kept look only.
- **Announcer:** reads only final results, shows what is actually happening now (not what was sent ahead), and keeps its "already read" list per carnival.
- Phones get a slim banner and a bar fixed to the bottom for the main buttons, so one hand is enough.

## Privacy

- **Made-up data only:** use the 620 test students ("CCAS XC test students 620.xlsx", columns Surname, Firstname, House, Sex, DOB). Real student names wait until the principal and ICT approve, and the privacy summary is updated to cover this app.
- **No date of birth is ever stored.** DOB is used on the organiser's computer only, to work out the age group (and at export, if the next level needs it).
- **No secrets in the repo.** Supabase keys go in a config file that Jordan fills in.
- Check newsletter and media consent before naming students publicly.

## Devices (first guess; jobs are decision 8)

| Job | Device and size |
|---|---|
| Track Marshal | iPad, landscape 1180 x 820 or portrait 820 x 1180 |
| Field event stations (2 teachers each) | iPad or iPhone (to confirm) |
| Recorder, Results, Carnival Organiser | MacBook, 1512 x 982 |
| Track place judges, timekeepers, Announcer | iPhone, 390 x 844 |

Every screen must also work on the other sizes.

## Open questions

They are in `PROJECT-STATE.md`, section 6. Ask Jordan the "Ask now" ones at the start of each session.
