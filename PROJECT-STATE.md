# PROJECT-STATE: CCAS Athletics Carnival App

Date: 4 November 2026, version a. The first version.

Changes on 4 November 2026 (version a): Project folder set up (ATHS 2027- App/ccas-athletics) with CLAUDE.md, this file and a local git repo (branch main). No app, design or decisions yet. Open questions 1 to 11 are below; ask now: 1 to 8.

Owner: Jordan (PDHPE Head of Department, Central Coast Adventist School, Erina NSW)

## 0. Where things stand (read first)

- Project is ONLY the athletics carnival app. The swimming app (SWIM 2027- App/ccas-swimming) and cross country are separate projects, used for reference only.
- Nothing is built or drawn yet. The first job is to answer the open questions, then draw the design canvas (A1.1 and on), then build Aths Opt 1.0.
- How it will be built, and the lessons from the swimming app, are in CLAUDE.md.
- Made-up data only: the 620 test students ("CCAS XC test students 620.xlsx").
- No GitHub repo or Supabase project yet. Both are made by Jordan from click-by-click steps when the build starts.

## 1. Project goal

An easy web app to run the CCAS athletics carnival, in the same way as the swimming carnival app:
- Helpers enter a PIN, pick a job, and work on any device, all linked live.
- Places, house points, age champions, records, the team list for the next level and a newsletter article are worked out automatically.

## 2. Work completed

- 4 November 2026: project instructions (CLAUDE.md), written from the swimming project's rules and lessons.

## 3. Decisions

None yet.

## 4. Rules and constraints

See CLAUDE.md: writing rules, the look, the three checks, privacy, devices.

## 5. Current problems

None yet.

## 6. Unresolved questions (ask Jordan)

Ask now: 1 to 8.

1. Date of the carnival.
2. Venue, track length and number of lanes.
3. **Program:**
   - Which track events (for example 100 m, 200 m, 400 m, 800 m, 1500 m, hurdles, relays)?
   - Which field events (for example long jump, triple jump, high jump, shot put, discus, javelin)?
   - In what order and at what times? A copy of last year's program would answer most of this.
4. Age groups and the "age as at" date. Are they the same as swimming (13 & under to 18+, as at 31 December)?
5. **Points:**
   - Is the scale the same as swimming (20, 15, 10, then 5 for taking part)?
   - Do field events and relays count the same?
   - Are there age champions and a runner up?
6. **Jobs and devices:** who marshals track and field? Is each field event run by its own judge on a tablet? (CLAUDE.md has a first guess at the devices.)
7. **Timing:** hand-held stopwatches, a printing timer, or a phone timer (the swimming app's multitimer could be reused)? Are times wanted for every event, or places only?
8. **Field events:**
   - How many attempts?
   - Best attempt counts?
   - Do high jump heights go up in set steps?
   - How are ties broken?
9. **Next level:**
   - Who are the top athletes sent to (zone, CIS, HRIS)?
   - In what file? (Swimming uses a Meet Manager HY3 file.)
10. Records: is there a CCAS athletics records list to load?
11. Real student names: the same approval path as swimming (principal and ICT, swimming question 1)?

## 7. Exact next steps

1. NOW: Jordan answers questions 1 to 8 (last year's program and points sheet would help).
2. Draw the design canvas (A1.1 and on) from the swimming boards: Home, Marshal, track judging, field event entry, Recorder, Announcer, Results, Houses, Carnival Organiser. Jordan approves each board.
3. Build Aths Opt 1.0 in test mode, with engine tests. Checks 1 to 3.
4. Jordan makes the GitHub repo and the Supabase project (Sydney) from click-by-click steps; Aths Opt 1.1 goes live on staging with made-up data.

## 8. Files and links

- CLAUDE.md (project rules, how it is built, lessons from swimming)
- PROJECT-STATE.md (this file; the latest)
- Swimming app for reference: SWIM 2027- App/ccas-swimming (its CLAUDE.md and PROJECT-STATE.md)
- CCAS XC test students 620.xlsx (test student list)
