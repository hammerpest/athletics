# PROJECT-STATE: CCAS Athletics Carnival App

Date: 4 November 2026, version b. Replaces 4 November version a.

Changes on 4 November 2026 (version b): Jordan answered questions 1 to 7 and sent the 2026 information sheet and timetable (saved in docs/). Decisions 1 to 11. Question 8 (field event rules) waits until Jordan sets the rules for each event. New questions 12 to 18. Ask now: 12 to 18.

Changes on 4 November 2026 (version a): Project folder set up (ATHS 2027- App/ccas-athletics) with CLAUDE.md, this file and a local git repo (branch main). No app, design or decisions yet.

Owner: Jordan (PDHPE Head of Department, Central Coast Adventist School, Erina NSW). Jordan is the carnival's Chief Official.

## 0. Where things stand (read first)

- Project is ONLY the athletics carnival app. The swimming app (SWIM 2027- App/ccas-swimming) and cross country are separate projects, used for reference only.
- Nothing is built or drawn yet. Next: questions 12 to 18, then the design canvas (A1.1 and on), then Aths Opt 1.0.
- How it will be built, and the lessons from the swimming app, are in CLAUDE.md.
- Made-up data only: the 620 test students ("CCAS XC test students 620.xlsx").
- No GitHub repo or Supabase project yet.

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

**Date and venue:** about 19 June 2027 (question 12), Mingara Athletics Track, 8 lanes.

**Age groups** (ages as at 31 December; the 2026 sheet says 31 December 2026, question 13):

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
- **Field event stations:** high jump, long jump and discus each have two stations (for example "High Jump 1" and "High Jump 2"), and shot put has one. Each station runs one age group at a time, so up to seven field groups run together.

**Points:**

| Place | Age events | Relays |
|---|---|---|
| 1st | 10 | 20 |
| 2nd | 8 | 16 |
| 3rd | 6 | 12 |
| 4th and below | 4 | 8 |

**Awards:**
- House championship: the house with the most points.
- Age champion and runner up, boys and girls in each age group: most points, counting only 1st, 2nd and 3rd place points ("to recognise expertise in athletics, not just participation"). Relays do not count.

**Track rules:**
- All heats are run as finals: times are taken in every heat, and the fastest time over all heats of an age wins.
- 100 m, 200 m and 400 m: athletes stay in their own lane, or are disqualified. Starting blocks may be used.

**Next level:** results may be used for HRIS selection.

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

## 4. Rules and constraints

See CLAUDE.md: writing rules, the look, the three checks, privacy, devices.

## 5. Current problems

None yet.

## 6. Unresolved questions (ask Jordan)

Ask now: 12 to 18.

12. The date: 19 June 2027 is a Saturday. Is the carnival on Friday 18 June 2027, or another day?
13. Ages for the 2027 carnival: as at 31 December 2027, or 31 December 2026 (the swimming carnival in February 2027 uses 31 December 2026)?
14. The 1500 m is Open:
    - Do its points count for houses (4th and below 4)?
    - Do its place points count for the athlete's own age champion?
15. Joint age champions: is there still a runner up beside them? (Swimming: no, decision 145 there.)
16. Relays: how many teams per house in each relay (swimming has an A and a B team)? Does every team that finishes get 8 points?
17. Field events:
    - Does everyone who records a mark get the 4th-and-below 4 points?
    - Does a no-show or no valid mark get 0?
    - How many athletes per age group per house, or is it open entry?
18. HRIS:
    - Do you send the top 2 in every event, as in swimming?
    - Do you send the field event marks too?
    - Does HRIS want a file (a Meet Manager HY3 file, or other) or a list?
19. (Later) The timing equipment at the track: does the printer give a slip per heat with the lane and time for each lane, like the pool? A photo of one slip from a practice run will tell.
- (Later) 8. Field event rules for each event: attempts, best mark, high jump starting height and steps, ties. Jordan sets them later.
- (Later) 9. Next level: the file part is in question 18.
- (Later) 10. Records: is there a CCAS athletics records list to load?
- (Later) 11. Real student names: the same approval path as swimming (principal and ICT, swimming question 1)?
- (Closed by 1 to 10) Questions 1 to 7.

## 7. Exact next steps

1. NOW: Jordan answers questions 12 to 18.
2. Draw the design canvas (A1.1 and on) from the swimming boards:
   - Home and PIN;
   - Track Marshal;
   - track Place Judge;
   - Time Slips;
   - field event station (attempts and marks);
   - Recorder;
   - Announcer, Results and Houses;
   - Carnival Organiser.
   Jordan approves each board.
3. Field event rules from Jordan (question 8) before the field event board is final.
4. Build Aths Opt 1.0 in test mode, with engine tests. Checks 1 to 3.
5. Jordan makes the GitHub repo and the Supabase project (Sydney) from click-by-click steps. Aths Opt 1.1 goes live on staging with made-up data.

## 8. Files and links

- CLAUDE.md (project rules, how it is built, lessons from swimming)
- PROJECT-STATE.md (this file; the latest)
- docs/2026 general information and points.png, docs/2026 timetable.png (Jordan's 2026 sheets)
- Swimming app for reference: SWIM 2027- App/ccas-swimming (its CLAUDE.md and PROJECT-STATE.md)
- CCAS XC test students 620.xlsx (test student list)
