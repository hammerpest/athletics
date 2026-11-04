# PROJECT-STATE: CCAS Athletics Carnival App

Date: 4 November 2026, version q. Replaces 4 November version p.

Changes on 4 November 2026 (version q): The MacBook walk-through ran in Jordan's Chrome at 1512 wide, on commit 17ebf62, with buttons pressed by script. Passed: PINs, 620 test students, Marshal, Place Judge, typed times, slip photo (a late slip did not overwrite typed times), multitimer with 12 runners and 4 times (the other 8 got +1 s each), long jump to Final, shot put weights and fair or foul, high jump opens, Announcer, Results, HRIS list, newsletter, Houses, all 9 Organiser sections, reload opens where the job is up to, no sideways scroll, no console errors, all app files loaded. Not covered in Chrome: Chrome screenshots time out (the same fault as swimming), so no screen was compared by eye with a baseline there; the download buttons were not pressed (flow tests cover them). Ask now: 33 to 38.

Changes on 4 November 2026 (version p): Third fresh-eyes review of the last five fixes is done. It found 3 must-fix and 6 should-fix faults; all 9 are fixed. The main ones: a phone now stays on an athlete, not a place in the list, so a reload or someone taken off on another device cannot put a mark on the wrong person. A station can no longer write to a final group. An athlete taken off and added back keeps their number. Marks of 0 and marks over 99.99 m are refused, and a tape reading rounds down. Engine tests 56 of 56. Flow tests 26 of 26 (6 new). Check 1: 742 screenshots against the previous commit, 0 different, so no approved screen moved. These nine fixes were proven by tests, not by a fourth review. Check 2 in Chrome is still open. Jordan needs to refresh the page to get these fixes. Ask now: 33 to 38.

Changes on 4 November 2026 (version o): Aths Opt 1.0 is built in test mode on the staging branch, committed locally, nothing pushed. Engine tests 56 of 56. Flow tests 20 of 20. Check 1: 742 screenshots, 2 runs, 0 different. Check 2 is only part done: the Claude in Chrome extension was not connected, so the MacBook walk-through in Chrome still has to be done; phone and iPad sizes passed in the built-in browser. Check 3: a fresh-eyes agent found 6 must-fix and 9 should-fix items; a recheck found 1 more must-fix and 4 more should-fix. All are fixed or are questions for Jordan below; the last round of fixes has not had a third review. New questions 33 to 38. Ask now: 33 to 38, then try the build.

Changes on 4 November 2026 (version n): Jordan approved the redrawn field boards (A1.8 to A1.10, A1.12, A1.18, A1.19), so all 19 boards are approved (decision 39). Ask now: none.

Changes on 4 November 2026 (version m): Jordan approved the changed A1.16 and answered yes to questions 30 to 32 (decisions 36 to 38). Ties placeholder removed from A1.16. Ask now: Jordan's OK on the redrawn field boards.

Changes on 4 November 2026 (version l): Jordan sent the 2027 field event instruction sheets, saved in docs/2027 field event sheets/ (Long Jump, High Jump, Shot Put, Discus, Javelin). They answer most of question 8 (decisions 32 to 35). Field boards redrawn; new boards A1.18 and A1.19 for throws. New questions 30 to 32 for what the sheets do not cover. Ask now: 30 to 32, and Jordan's OK on A1.16 and the redrawn field boards.

Changes on 4 November 2026 (version k): Jordan answered question 29: Javelin is in the software but CCAS does not use it. The organiser can add or remove any track or field event to match a school's program (decision 31). A1.16 redrawn. Ask now: Jordan's OK on the changed A1.16.

Changes on 4 November 2026 (version j): At Jordan's request, A1.16 Carnival Organiser now has a tick box for 1 or 2 locations for each field sport (decision 30). Discus, Long Jump, Javelin, Shot Put and High Jump are listed. New question 29: Javelin is listed but is not on the program. Ask now: 29, and Jordan's OK on the changed A1.16.

Changes on 4 November 2026 (version i): Jordan approved all 17 boards, A1.1 to A1.17, apart from the field placeholders (decision 29). Next: the field rules (question 8), and build Aths Opt 1.0.

Changes on 4 November 2026 (version h): Jordan answered questions 26 to 28 (decisions 26 to 28). Shot Put is one location after all, which replaces decision 21: 7 stations, and the canvas is changed back. Equal times share the points. The event coordinator is the organiser PIN. Version f had cut sections 0 to 6 of this file by mistake; they are restored here. Ask now: approval of each board.

Changes on 4 November 2026 (version g): Jordan checked the published canvas in Chrome: it displays right, blue lanes included. Boards are not yet approved one by one.

Changes on 4 November 2026 (version f): Jordan answered questions 21 to 25 (decisions 20 to 25). Canvas redrawn: bright blue track lanes with white lines; A1.5 is now the multitimer, as in swimming's 100 m; field results final at the station, with override; new A1.17 relay lanes (houses only); relays off the HRIS list. Now 17 boards.

Changes on 4 November 2026 (version e): Next step 2 done as a first draft: the design canvas is published for Jordan's review (https://claude.ai/artifact/VaZiJKE2cce41ykKbkD1tg), boards A1.1 to A1.16, light and dark, in section 2.2. Nothing is approved yet and nothing is built. Field boards carry marked placeholders for question 8. Two things in 2.1 corrected from the timetable (6 field groups in a block, not 7; Shot Put has two groups at once in 4 blocks). New questions 21 to 26. Ask now: 21 to 26, and approval of each board.

Changes on 4 November 2026 (version d): Jordan answered the rest of question 18: the HRIS team list goes as a file, like swimming (decision 19). New question 20: a sample of the athletics file HRIS takes, to match its layout (later). Ask now: none. Next: the design canvas.

Changes on 4 November 2026 (version c): Jordan answered questions 12, 13 and 15 to 18 (decisions 12 to 18). The carnival is on Friday 18 June 2027; ages as at 31 December 2027. Question 14 (the 1500 m) is for later. Question 18 is partly open: is the HRIS team list wanted as a file (like the swimming HY3) or as a list? Ask now: that. Next: the design canvas.

Changes on 4 November 2026 (version b): Jordan answered questions 1 to 7 and sent the 2026 information sheet and timetable (saved in docs/). Decisions 1 to 11. Question 8 (field event rules) waits until Jordan sets the rules for each event. New questions 12 to 18. Ask now: 12 to 18.

Changes on 4 November 2026 (version a): Project folder set up (ATHS 2027- App/ccas-athletics) with CLAUDE.md, this file and a local git repo (branch main). No app, design or decisions yet.

Owner: Jordan (PDHPE Head of Department, Central Coast Adventist School, Erina NSW). Jordan is the carnival's Chief Official.

## 0. Where things stand (read first)

- Project is ONLY the athletics carnival app. The swimming app (SWIM 2027- App/ccas-swimming) and cross country are separate projects, used for reference only.
- All 19 boards, A1.1 to A1.19, are approved (decision 39). Aths Opt 1.0 is built in test mode on the local staging branch (section 2.3), waiting for Jordan's look and questions 33 to 38. Nothing is pushed, and main has no app yet.
- How it will be built, and the lessons from the swimming app, are in CLAUDE.md.
- Made-up data only: the 620 test students ("CCAS XC test students 620.xlsx").
- No GitHub repo or Supabase project yet.
- To try it: in Terminal, go to this folder, run python3 -m http.server 8123 --bind 127.0.0.1, then open http://127.0.0.1:8123/index.html?mode=local. Test PINs: Track Marshal 1111, Place Judge 2222, Recorder 3333, Time Slips 4444, Announcer 5555, Field Station 6666, Organiser 9999. Browser tabs act as separate devices.

## 1. Project goal

An easy web app to run the CCAS athletics carnival, in the same way as the swimming carnival app:
- Helpers enter a PIN, pick a job, and work on any device, all linked live.
- Places, house points, age champions, records, the HRIS team list and a newsletter article are worked out automatically.

## 2. Work completed

- 4 November 2026: project instructions (CLAUDE.md), written from the swimming project's rules and lessons.
- 4 November 2026: the 2026 sheets, saved in docs/:
  - "2026 general information and points.png": rules, age groups, points and awards;
  - "2026 timetable.png": the day's timetable.

### 2.1 The carnival (from Jordan's answers and the 2026 sheets)

**Date and venue:** Friday 18 June 2027 (decision 12), Mingara Athletics Track, 8 lanes.

**Age groups** (ages as at 31 December 2027, decision 13):

| Age group | Band (relays) |
|---|---|
| 12 & 13 yrs (13 and under) | Junior (14 and under) |
| 14 yrs | Junior |
| 15 yrs | Intermediate (15 and 16) |
| 16 yrs | Intermediate |
| 17 yrs | Senior (17 and 18+) |
| 18+ yrs | Senior |

A competitor may not move up an age in any event.

**Program (2026 timetable): 104 events.**

| Event | Groups | Events |
|---|---|---|
| 100 m, 200 m, 400 m, 800 m | each age, boys and girls | 48 |
| 1500 m | Open, boys and girls | 2 |
| 4 x 100 m relay | Junior, Intermediate, Senior, boys and girls | 6 |
| High jump, long jump, shot put, discus | each age, boys and girls | 48 |

- **Timetable:**
  - 8:30 am: the 1500 m.
  - 9:00 am: buses arrive and everyone is seated.
  - 9:10 am: welcome, prayer and instructions.
  - Then blocks at 9:15, 9:55, 10:40, 11:10, 11:40, 12:10, 12:40 and 1:10.
  - 1:35 pm: relays (Junior, Intermediate, Senior; girls then boys).
  - 1:55 pm: presentations. 2:15 pm: prayer, and buses back to school.
- In each block one sex runs a track event, oldest first (18+ down to 12 & 13), while the other sex does field events. The next block swaps them.
- **Field event stations:** high jump, long jump and discus each have two stations (for example "High Jump 1" and "High Jump 2"), and shot put has one (decision 27), so 7 stations. Each block has six field groups. Each station runs one age group at a time, except Shot Put, which has two age groups at once in four blocks (10:40, 11:10, 11:40 and 12:10), as in the 2026 timetable.

**Points:**

| Place | Age events | Relays |
|---|---|---|
| 1st | 10 | 20 |
| 2nd | 8 | 16 |
| 3rd | 6 | 12 |
| 4th and below | 4 | 8 |

**Awards:**
- House championship: the house with the most points.
- Field events: everyone who records a mark gets points (4 for 4th and below); a no-show or no valid mark gets 0 (decision 17).
- Relays: one team per house in each relay (decision 16), so each relay has 3 teams (20, 16, 12).
- Age champion and runner up, boys and girls in each age group: most points, counting only 1st, 2nd and 3rd place points ("to recognise expertise in athletics, not just participation"). Relays do not count. Joint champions have no runner up (decision 15).

**Track rules:**
- All heats are run as finals: times are taken in every heat, and the fastest time over all heats of an age wins.
- 100 m, 200 m and 400 m: athletes stay in their own lane, or are disqualified. Starting blocks may be used.

- 800 m and 1500 m: one person enters the names and runs the multitimer on a phone, as in swimming's 100 m. A marshalled runner with no time gets 1 second more than the place before (decision 20).

**Next level:** results may be used for HRIS selection. The top 2 in every individual event, field events included, go on the HRIS team list (decisions 18 and 24), sent as a file, like swimming (decision 19). Relays are not on it.

### 2.2 The design canvas (all 19 boards approved 4 November 2026)

First published 4 November 2026, redrawn the same day with decisions 20 to 28: https://claude.ai/artifact/VaZiJKE2cce41ykKbkD1tg (private to Jordan until shared). Page "Boards" is the light theme and page "Dark theme" repeats all 19 boards. Boards can be tried with Play. Made from the swimming styles.css with made-up test students. The source is in design/ (make_boards.py, make_css.py, aths-extra.css, aths.css).

| Board | Screen | Size |
|---|---|---|
| A1.1 | Home: PIN, then 6 jobs; organiser PIN adds Carnival Organiser | iPad landscape |
| A1.2 | Track Marshal (a): pick race, boys or girls, age | iPad landscape |
| A1.3 | Track Marshal (b): names into lanes | iPad landscape |
| A1.4 | Track Place Judge: tap the top 4 at the finish line | Phone |
| A1.5 | Multitimer (800 m, 1500 m): one person enters names, START, SPLIT, STOP, tap names in order, send | Phone |
| A1.6 | Time Slips | Phone |
| A1.7 | Field Station (a): pick the station, its day from the timetable | iPad landscape |
| A1.8 | Field Station (b): long jump, every jump measured | iPad landscape |
| A1.9 | Field Station (c): high jump, heights worked out from the sheet | iPad landscape |
| A1.10 | Field Station (d): long jump, one athlete at a time | Phone |
| A1.11 | Recorder, track: slip times, pink swaps, race overall | MacBook |
| A1.12 | Recorder, field: stations, final results, override | MacBook |
| A1.13 | Announcer: on the track now, read out next, field now, house standings | Phone |
| A1.14 | Results: event results, HRIS Team List, newsletter draft | MacBook |
| A1.15 | Houses: standings, points by age group, age champions | iPad landscape |
| A1.16 | Carnival Organiser: 9 sections, with field event rules, add or remove events, and 1 or 2 locations for each sport (approved) | MacBook |
| A1.17 | Track Marshal (c): relay, a house in each lane, no names | iPad landscape |
| A1.18 | Field Station (e): throws, fair or foul, best throw measured once (new) | iPad landscape |
| A1.19 | Field Station (f): throws, one athlete at a time (new) | Phone |

New looks to approve: bright blue lanes with white lines, as at Mingara, with a chequered finish line, and dashed orange boxes for anything not settled (placeholders; they go when the answer is in). Bronze is #cd7f32 as in CLAUDE.md (the swimming app uses a darker bronze), with dark text on it.

Assumed in the draft, not decided: race numbers count track heats only, and field groups are named by station and group. Runners with no time in the 800 m and 1500 m are listed after the timed runners, each 1 second later, in list order. The Time Slips phone opens the multitimer for the 800 m and 1500 m only; the 100 m to 400 m and relays use the Place Judge and slips. Marks are typed in metres to 2 decimals (decision 38). iPad portrait and other sizes are not drawn; they follow the swimming layouts.

### 2.3 Aths Opt 1.0 (test mode, 4 November 2026)

**Built:** every job on boards A1.1 to A1.19, at all four sizes, light and dark, with the program, timetable, field rules, heights and weights held as organiser data. Results rules are in one file, js/engine.js, with tests in tests/engine.test.js. The screens are in js/ui-*.js, and the look is css/styles.css (the swimming styles plus design/aths-extra.css, including Swim Opt 2.9's full-screen name list on a phone).

**Not built yet:** the Supabase store, server rules and SQL (Aths Opt 1.1); the slip reader (test buttons make up times until a photo of a track slip arrives, question 19); the real HRIS file (a plain CSV list for now, question 20). baseline/ is made once Jordan approves this build.

**Tests:** node tests/engine.test.js, tests/flow.py (the swimming lessons: race numbers, relief helpers, offline queue, late slips, backup and restore, clear, lock), tests/shots.py and tests/shots_all.sh (every screen, size and theme), tests/visual_diff.py, tests/serve.py (test server).

**For Aths Opt 1.1:** field boxes save one at a time, so the server must merge each box, not replace the document, or two teachers can overwrite each other. Test mode tabs do not prove this. The race counter must be safe on the server, as in swimming.

**In the app but not drawn on the boards (question 36):**
- Phone field stations: a row with Add an athlete, All groups and Group finished. Tap a filled jump to change it. A phone high jump screen.
- Recorder: Back to latest, Next race, Cancel this race, Re-run this race. Override also has Add an athlete, NS and Reopen this group.
- Organiser: PIN table, Next race number, Events not run, a records list with a paste box, the student list paste box. Attempts and the heights and weights table can be edited there.
- Place Judge: Back to latest. Time Slips: the test slip reader panel. Results: a new record band. Announcer: Earlier result.
- Add an athlete: a name already on the list with no marks can be tapped off; the others keep their numbers.

## 3. Decisions

1. (4 November 2026) Date: about 19 June 2027 (exact day to confirm, question 12). Venue: Mingara Athletics Track, 8 lanes.
2. (4 November 2026) The program is the 2026 timetable (2.1): 104 events, with the same times, blocks and field stations. No triple jump, javelin or hurdles.
3. (4 November 2026) Age groups 12 & 13, 14, 15, 16, 17 and 18+ (2.1). Relay bands Junior, Intermediate and Senior. No moving up an age.
4. (4 November 2026) Points: age events 10, 8, 6, 4 (4 for 4th and below); relays 20, 16, 12, 8.
5. (4 November 2026) Age champion and runner up for boys and girls in each age. Only 1st to 3rd place points count, and relays do not count.
6. (4 November 2026) Track events are timed finals: the fastest time over all heats of an age group wins, as in swimming.
7. (4 November 2026) In the 100 m, 200 m and 400 m, a lane change is a DQ. The app only needs DQ.
8. (4 November 2026) Jobs: a track marshal, as in swimming. Each field event station is run by 2 teachers.
9. (4 November 2026) Timing: the same equipment as swimming (swimming decision 147): the Swiss Timing Quantum timer and printer, with times taken from a photo of the printed slip.
10. (4 November 2026) The next level is HRIS, as in swimming. Whether a HY3 file is wanted is part of question 18.
11. (4 November 2026) Field event rules (attempts, best mark, high jump heights, ties): Jordan sets them for each event later (question 8).
12. (4 November 2026, answers question 12) The carnival is on Friday 18 June 2027. Replaces the "about 19 June" in decision 1.
13. (4 November 2026, answers question 13) Ages are as at 31 December 2027.
14. (4 November 2026) Question 14 (the 1500 m: house points and age champion points) is for later.
15. (4 November 2026, answers question 15) Joint age champions: no runner up beside them (as in swimming).
16. (4 November 2026, answers question 16) One relay team per house in each relay.
17. (4 November 2026, answers question 17) Field events: everyone who records a mark gets points (4 for 4th and below); a no-show or no valid mark gets 0. Entry is open (no limit per house).
18. (4 November 2026, answers question 18 in part) The top 2 in every event, field events included, go on the HRIS team list. Still to confirm: a file or a list (question 18).
19. (4 November 2026, answers the rest of question 18) The HRIS team list is sent as a file, like swimming (the swimming app writes a Meet Manager HY3 file). The athletics layout is matched to a sample file first (question 20).

20. (4 November 2026, answers question 21) 800 m and 1500 m: treated like swimming's 100 m. One person does the names and the multitimer on a phone (A1.5). Times are taken for runners, but not always all of them: if 15 run, perhaps only 10 have a time, since only the top 2 go to HRIS and 4th onwards earn participation points. A marshalled runner with no time gets 1 second more than the place before, so they still get points.
21. (4 November 2026, answers question 22; replaced by 27) There are two shot put areas.
22. (4 November 2026, answers question 23) Field stations use iPad or iPhone, either one. Both are drawn.
23. (4 November 2026, answers question 24) Field results are final at the station. The event coordinator can overrule or override any result at any time.
24. (4 November 2026, answers question 25) Relays have no names, only houses. They count for house points only and do not go to HRIS. This narrows decision 18: the top 2 in every individual event. CCAS makes the teams itself, for example from the 4 fastest 100 m times.
25. (4 November 2026) Track lanes are bright blue with white lines, as at Mingara.
26. (4 November 2026, answers question 26) Equal times in different heats share the points, as in swimming.
27. (4 November 2026, answers question 27; replaces 21) Shot Put is one location. 7 field stations: High Jump 1 and 2, Long Jump 1 and 2, Discus 1 and 2, Shot Put.
28. (4 November 2026, answers question 28) The event coordinator is the Carnival Organiser PIN.
29. (4 November 2026; A1.16 changed afterwards, see 30 and 31) Jordan approved all 17 boards, A1.1 to A1.17, in light and dark, including the blue lanes and the dashed placeholder style. The field placeholders stay open until the rules are set (question 8). From now on any visual change needs Jordan's OK.
30. (4 November 2026) In Carnival Organiser, Field event rules, the organiser ticks 1 or 2 locations for each field sport. The stations list follows the ticks. Set for 2027: Discus 2, Long Jump 2, Shot Put 1, High Jump 2 (decision 27). With 1 location, groups on at the same time share it.
31. (4 November 2026, answers question 29) The program is set by the organiser, so the app is not fixed to CCAS events. Carnival Organiser, Program: any track or field event can be turned on or off, and new ones added or removed. Javelin is built in and off for CCAS, so the CCAS program stays at 104 events (decision 2). A turned-on sport joins the location ticks and the field rules. Assumed: a new event starts as each age, boys and girls (12 events), and the organiser sets its time on the timetable.

32. (4 November 2026, answers most of question 8) Field rules are the 2027 CCAS instruction sheets in docs/2027 field event sheets/, held as organiser settings. Athletes are numbered in the order they arrive, which is their order for the event. The app shows who is up and who is next.
33. (4 November 2026) Long jump: 3 jumps, every jump measured. If there are too many athletes, 2 jumps each, then the top 4 get a 3rd (the teacher turns this on; the sheet sets no number).
34. (4 November 2026) Shot put, discus and javelin: 3 throws, marked fair, foul or pass. The marker only moves for a better throw, so only the best throw is measured, once, at the end. Weights by age are shown at the station. In the 12 & 13 group, discus differs by age (12 years 0.75 kg, 13 years 1 kg).
35. (4 November 2026) High jump: starting height by age and sex from the sheet. 3 tries at each height, out after 3 misses in a row. Raises: girls 5 cm until 3 remain, then 3 cm; boys 10 cm first, then 5 cm until 3 remain, then 3 cm. The app works out the next height. Ties: fewer misses at the tied height, then fewer overall, then they share the place.
36. (4 November 2026, answers question 30) Equal best marks in long jump, shot put, discus and javelin share the place and points.
37. (4 November 2026, answers question 31) High jump: an athlete can pass a height.
38. (4 November 2026, answers question 32) Marks are to the nearest centimetre (5.34 m).
39. (4 November 2026) Jordan approved the redrawn field boards, so all 19 boards are approved, with no placeholders left in the field rules. Any visual change from here needs Jordan's OK.

## 4. Rules and constraints

See CLAUDE.md: writing rules, the look, the three checks, privacy, devices.

## 5. Current problems

- Claude in Chrome cannot take screenshots here (script injection times out), so check 2 in Chrome reads the screens as text and cannot compare them by eye with a baseline.
- The Place Judge's "By time" text is 4.4 to 1 on the approved blue lanes, just under 4.5. The organiser switch is drawn 30 px tall, with a 48 px tap area. Both are as approved, so left unchanged.

## 6. Unresolved questions (ask Jordan)

Ask now: 33 to 38.

- (Ask now) 33. Decision 32 says the app shows who is up and next. The iPad high jump board (A1.9) has no Now up or Next, though the phone screen has them. Add them to A1.9?
- (Ask now) 34. High jump: a miss, then passing the rest of that height. The box steps through O, XO, XXO, XXX and pass only, so X then pass cannot be recorded, and misses do not carry to the next height. Is that fine for CCAS?
- (Ask now) 35. One PIN per job (CLAUDE.md) and A1.1 (6 jobs after the PIN) differ. Built: a job PIN goes straight to its job, and the organiser PIN shows all the jobs. Correct?
- (Ask now) 36. Are the items in 2.3 that are not drawn on the boards OK?
- (Ask now) 37. Field groups start empty and athletes are added as they arrive, so No. is their order. Correct, or should the age group's list load first?
- (Ask now) 38. 800 m and 1500 m: the Marshal presses Go to give the race its number, then the multitimer phone enters the names. Correct, or should the phone start a race on its own?
- (Closed by 36 to 38) Questions 30 to 32.
- (Closed by 20 to 24, 26 to 28, 31) Questions 21 to 29.
- (Later) 20. A sample of the athletics file HRIS takes (for example a Hy-Tek Track & Field Meet Manager export), with the student details removed, as was done for swimming. The writer is built to match it.
- (Later) 14. The 1500 m is Open. Do its points count for houses (4th and below 4)? Do its place points count for the athlete's own age champion? Built for now as yes for houses, no for age champions; it is one setting.
- (Closed by 12, 13, 15 to 19) Questions 12, 13 and 15 to 18.
19. (Later) The timing equipment at the track: does the printer give a slip per heat with the lane and time for each lane, like the pool? A photo of one slip from a practice run will tell.
- (Closed by 32 to 35, apart from 30 to 32) 8. Field event rules.
- (Closed by 19) 9. Next level: a file, like swimming; the layout is question 20.
- (Later) 10. Records: is there a CCAS athletics records list to load?
- (Later) 11. Real student names: the same approval path as swimming (principal and ICT, swimming question 1)?
- (Closed by 1 to 10) Questions 1 to 7.

## 7. Exact next steps

1. (Done 4 November 2026) Questions 12 to 18 answered (decisions 12 to 19).
2. (Done as a first draft 4 November 2026) The design canvas, A1.1 to A1.16 (section 2.2).
   Done: Jordan approved all boards (decision 29).
3. (Done) Field rules from the sheets and Jordan's answers (decisions 32 to 38).
4. (Done) Build Aths Opt 1.0 in test mode, with engine tests. Checks 1 to 3 (version q).
   Done: the third review of the last fixes (version p) and the MacBook walk-through in Chrome (version q).
5. Jordan answers 33 to 38 and tries the build. Once approved, save the screenshots to baseline/.
6. Jordan makes the GitHub repo and the Supabase project (Sydney) from click-by-click steps. Aths Opt 1.1 goes live on staging with made-up data.

## 8. Files and links

- index.html, css/, js/ (the app), tests/ (see 2.3)
- CLAUDE.md (project rules, how it is built, lessons from swimming)
- PROJECT-STATE.md (this file; the latest)
- docs/2026 general information and points.png, docs/2026 timetable.png (Jordan's 2026 sheets)
- docs/2027 field event sheets/ (instruction sheets for each field event)
- Design canvas: https://claude.ai/artifact/VaZiJKE2cce41ykKbkD1tg; its source in design/
- Swimming app for reference: SWIM 2027- App/ccas-swimming (its CLAUDE.md and PROJECT-STATE.md)
- CCAS XC test students 620.xlsx (test student list)
