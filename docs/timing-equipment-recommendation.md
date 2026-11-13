# Timing equipment for the CCAS athletics carnival

Researched 6 November 2026 for the carnival on Friday 18 June 2027 at Mingara Athletics Track. Prices are AUD, rounded to the nearest dollar. "ex GST" means before 10% GST. Where a price could not be found, it says so. Nothing here is guessed.

## Short answer

1. **Do not plan on the swimming kit (Swiss Timing Quantum).** The Quantum is a high end system for big meets and pools. I found no athletics hire source for it, and no evidence it prints a slip with a lane and time for each lane in athletics (the Swiss Timing athletics pages mention cameras, start systems and light beams, but no printer). It is the wrong tool for a school track.
2. **Hire Athletics NSW photo finish: "Photo Finish One Camera (All other locations)", $1,600 ex GST ($1,760 with GST).** The package is photo finish equipment, a printer and 2 operators. Mingara is not SOPAC or Glendale, so it should fall under "all other locations" (confirm this with them). Source: Athletics NSW 2026 Price List.
3. **Add a starter with start system and e-gun: $430 ex GST ($473 with GST).** Athletics NSW recommends its own starter whenever photo finish is used.
4. **Cheaper backup: hand timing with your own staff, using the app you already built** (Place Judge for places, multitimer for the 800 m and 1500 m, typed times for sprints). Cost: $0 in hire. It is less accurate and not accepted for official records (see below).
5. **Ask for the LIF file, not only the slip.** A photo finish operator can usually save a results file for each heat. If Athletics NSW uses FinishLynx (likely, but not confirmed), that file is a plain comma separated text file with place, lane and time. It is more reliable than reading a photo. Your slip reader can stay as the fallback.

## Buying instead (Jordan's choice, 6 November 2026)

Jordan wants to buy, not hire. The best lead is **Brook Group, 4 Ketch Close, Ourimbah NSW 2258**, on the Central Coast. Their site says they are the Australian distributor and an authorised service agent for FinishLynx, with "over 250 installations". Phone +61 2 4388 4382, email info@brook.com.au. Warning: the site's footer says "Copyright 2008", so confirm they still trade and still sell FinishLynx. Source: http://www.brook.com.au/userpages/finishlynx.html and https://www.brook.com.au/contact.html. They give no prices.

Lynx's entry packages (US prices, from the Lynx PDFs; no AUD price exists until Brook quotes):

| | Scholastic Package | Bronze Package |
|---|---|---|
| Price | US$5,699 on its page (the same PDF's text also says US$5,375, so the two disagree) | US$9,099 |
| Camera | EtherLynx Vision, 600 frames a second, full colour | EtherLynx Vision, 1,000 frames a second, full colour |
| Software | FinishLynx Lite (a simplified version) and LynxPad | Full FinishLynx32 with lifetime updates, and LynxPad |
| Start | Start sensor, capture button, 500 ft start cable (wired) | Wired start system and capture button |
| Also included | Tripod, cables, carry case, 1 year renewable warranty, tech support | Same |
| Not included | Windows laptop, printer | Windows laptop, printer |

What this means for CCAS:
- **Both need a Windows laptop.** The software is Windows only. A Mac will not run it. Budget for a laptop (price not researched) and a printer, which is not in either package.
- **Power:** the camera connects by a power-over-Ethernet injector, so it needs mains power or a battery with an inverter at the finish line. Not confirmed for outdoor use.
- **Start:** both are wired. The starter needs the start sensor linked by cable (up to 500 ft). Wireless start (RadioLynx) is an extra part I could not price.
- **Files:** the full FinishLynx writes `.lif` result files (see below). I could not confirm that the Lite software in the Scholastic Package does. Ask Brook before buying Scholastic.
- **Accuracy:** 600 fps is enough for 0.01 s times. 1,000 fps is 0.001 s for tie breaks.
- **Rough AUD:** at an assumed 1.5 AUD to 1 USD (check today's rate), Scholastic is about $8,500 and Bronze about $13,600 before freight, GST and the laptop and printer. These are my estimates, not quotes.
- **Break even:** the Athletics NSW hire is about $2,233 a year, so buying pays off in about 4 to 7 years, and you would then run it with your own staff. Ask Brook about a trained operator or training, and about service.

Other buy options found:
- **Timetronics Argus** (sold in Australia by Australasia Sports Timing, Melbourne): "Enquire" only, no price. Club and Pro versions. LIF export not confirmed. Source: https://www.timetronics.be/product-page/argus-photo-finish-system
- **Brower gates** (US$798 to US$1,584) and **Freelap**: not suitable for a carnival finish (see table below).
- Seiko and Omega: no price or school product found.

Questions for Brook Group:
1. Are you still the Australian FinishLynx distributor? Do you sell Scholastic and Bronze?
2. AUD price, including GST, freight, and the wired start and printer I need.
3. Does the Scholastic (Lite) software write `.lif` files? What about Bronze?
4. What laptop and printer do you recommend? Do you sell them?
5. Training, set up help on the day, and servicing. Do you hire a second unit as a spare?
6. Can I see a sample slip and `.lif` file? Can I try it at a local meet at Mingara first?

## What the recommended hire costs (kept for comparison)

All from the Athletics NSW 2026 Price List (PDF, dated 4 June 2026 in its file details). The 2027 list was not found. Expect it to be similar, but check.

| Item | ex GST | With GST |
|---|---|---|
| Photo finish, one camera, all other locations (equipment, printer, 2 operators) | $1,600 | $1,760 |
| Starter with start system equipment and e-gun | $430 | $473 |
| **Recommended total** | **$2,030** | **$2,233** |
| Optional: Finish Line Judge | $325 | $358 |
| Optional: Hytek Results on the Day | $400 | $440 |
| Optional: Hytek Database Set Up | $200 plus $0.70 per athlete (about $634 for 620 students) | about $697 |
| Late fee, booking within 8 to 21 days | $265 | $292 |
| Late fee, booking within 7 days | $420 | $462 |
| Cancellation fee (not extreme weather) | $265 | $292 |

Notes:
- The Hytek items are not needed if your app does the results and writes the file. Decide that after you test the file (question 20).
- Package 1 (Finish Line Judge, Starter with start system, Field Referee) is $1,025 ex GST. It does not include photo finish.
- Whether GST is added for a school is not stated on the list. I assumed 10%.
- Athletics NSW can also supply starting blocks (school set $70) and other equipment through ES Marks. You may already have these.

## How it works on the day

- Athletics NSW sends the operators and the kit. Staff needed from CCAS: 1 or 2 runners to carry heat sheets to the photo finish table, and the people you already plan (Place Judge, Time Slips, Recorder).
- The operators need a table, a power point (or a power source), shade, and a spot on the finish line. I did not find the exact set up needs on their site. Ask.
- Battery and weather: not stated. A June day on the Central Coast is usually dry, but ask what they do if it rains (a gazebo over the camera and laptop is normal).
- Works offline: FinishLynx and similar systems run on a laptop with no internet. This is general knowledge about the product, not confirmed for Athletics NSW's kit.

## Slip format and your reader (not confirmed)

I could not find a sample slip or what the Athletics NSW printer prints. FinishLynx can print a results page for each heat from the laptop, but the layout is set by the operator. So:
- **Unconfirmed:** that the printer gives one slip per heat with a lane and time on each line.
- **To do:** ask Athletics NSW to send a photo of a typical printed result and a sample results file from a recent carnival, with names removed.

FinishLynx files, from Lynx's own help pages:
- A results file ends in `.lif`. It is comma separated text, one file per event, round and heat.
- Columns: place, ID, lane, last name, first name, affiliation, time, licence, delta time, reaction time, splits, then user fields.
- `lynx.evt` holds the events and who is in them. `lynx.ppl` matches ID numbers to names.
- Hy-Tek Meet Manager reads the `.lif` with "Get Times". A third party note says the import fails if the event number in the file does not match the event number in Meet Manager. For you this means the race number must match the timing system. Your app can set the next race number, so match it at the start and re-check after any cancelled or re-run race.
- Folder note from Lynx: use a new folder for each meet, so old files are not pulled in.

Suggested app change (needs your OK, would be Aths Opt 1.7 or later): import a `.lif` file straight into the Time Slips job, so no photo is needed. I have not built it.

## Other products, honestly

| Option | Cost found | Accuracy and acceptance | Verdict |
|---|---|---|---|
| Swiss Timing Quantum (swimming kit) | No price, no athletics hire source found | Very high (0.001 s). Athletics set up is Scan'O'Vision camera, start system and light beams. No printer found. | Not suitable or available |
| Buy FinishLynx | US$5,245 to US$18,495 (US reseller), about £18,125 for one UK package. No AUD price and no Australian dealer found. | Fully automatic, the standard for school and state meets | Too costly for one day a year. Ask Lynx for an AUD quote only if CCAS wants to own it. |
| Sport Event Services (national contractor) | Not stated | Says cameras record up to 120 fps and meet governing body standards. Kit brand, software, printer, formats not stated. | Good second quote. Ask about NSW, price, LIF files. |
| OzTiming | Not stated | Says it does not hire equipment, only a full timing service. Looks Victorian. | Skip |
| Wireless timing gates (Brower Black Box US$798 to US$1,138, TCi US$1,358 to US$1,584; USD retail, no AUD price found) | See left | Vendor claims 0.001 s. Gates time a body passing a point, not a place by torso, so they are poor for close finishes with 8 lanes. | Good for training, not for a carnival finish |
| Freelap (wearable chips, from about US$535 to US$845 per pack) | See left | Claims about 0.03 s. One chip per athlete, 620 students. | Not practical |
| Phone photo finish apps | Free or low cost | Makers claim 0.004 s at 240 fps (one listing says 0.05 s). No independent test found. | Fine as a spare for a close finish, not as the official time |
| Hand held stopwatches | About $0 extra | Hand times are usually rounded up to the next tenth, and a conversion of plus 0.24 s (under 400 m) or plus 0.14 s (400 m and 4 x 100 m) is used to compare with automatic times (Victorian source). Accepted for school carnivals. Not for State permit or records. | The backup |

The accuracy figures for gates, chips and apps are from the makers. I found no independent test.

## Where to hire in NSW

| Who | What they offer | Contact | Lead time |
|---|---|---|---|
| **Athletics NSW** | Photo finish with operators, starters, timekeepers, Hytek operators, equipment (ES Marks). Price list above. | No phone or email found on their schools page. Use the contact page https://www.nswathletics.org.au/about/contactus and the 2027 booking form https://forms.monday.com/forms/9511a4c418f92aa8cb0b10d5d90d1997?r=use1 | Not stated. Late fees start inside 21 days, so book well before that. I suggest early Term 1 2027. |
| **Sport Event Services** | Photo finish cameras, national | Contact page https://sportseventservices.com.au/contact-us/ (not read) | Not stated |
| **Australasia Sports Timing** (sportstiming.com.au, Melbourne, official agent for Swiss Timing) | Sells and installs. Athletics: E-GUN start system, false start detection, Athletics Manager software, field tablet. Photo finish: Timetronics Argus. No hire, no prices, no FinishLynx stated. | +61 3 9338 1077, sales@sportstiming.com.au (24 hour reply claimed). Epping VIC. | Not stated |
| **Little Athletics, Mingara** (Tuggerah Lakes Mingara LAC) | Unknown. Worth one email in case the centre owns timing gear. | Not found | Unknown |
| Other schools (Newcastle, Sydney) | Unknown | Ask your PDHPE network | Unknown |

I found no photo finish hire company in Newcastle or on the Central Coast.

## Must have and nice to have (620 students)

Must have:
- Fully automatic start and finish for the 100 m, 200 m and 400 m and relays (lane times to 0.01 s, which your points rely on).
- A printed slip or file for every heat, with lane and time.
- Works with no internet.
- A start that links to the camera (gun or start system).
- Race numbers that match your app.

Nice to have:
- A `.lif` or CSV file from the operator, to import with no photo.
- Hytek on the day and database set up (only if you do not trust the app file for HRIS).
- A Finish Line Judge supplied by Athletics NSW.
- A phone photo finish app as a spare for a close finish.

Not needed: a scoreboard, wireless gates, chips.

## Backup plan (cheaper)

If Athletics NSW is booked out or too dear:
1. Hand time the sprints with 2 stopwatch timers per lane group, and a Place Judge on the finish line. Type times into the app (already built).
2. Run the 800 m and 1500 m on the multitimer as planned (decisions 45 and 47).
3. Phone photo finish app on one iPhone on a tripod as a tie breaker.
4. Tell staff and students that times are hand times and not for records.

## One page setup list for the day

Book (by early Term 1 2027)
- [ ] 2027 booking form to Athletics NSW: photo finish one camera (all other locations), starter with start system and e-gun
- [ ] Ask the questions below and get written answers
- [ ] Get a sample slip photo and a sample results file, then test the Time Slips reader

Week before
- [ ] Confirm operator names, arrival time and what they need
- [ ] Book a gazebo, 2 tables, power cable or generator and a power board at the finish line
- [ ] Print heat sheets with race numbers
- [ ] Test the app with its race number set forward to match the timer

On the day
- [ ] Operators set up the camera on the finish line, and the start system link to the starter
- [ ] Set the app's next race number to match the timer (Organiser)
- [ ] Time Slips phone photographs each slip, Recorder checks it
- [ ] Keep the 800 m and 1500 m multitimer phone charged
- [ ] Spare: 4 stopwatches, a clipboard, a phone with a photo finish app
- [ ] End of day: ask for the results files on a USB stick, and export the CSV from the app

## Questions for Athletics NSW

1. Does Mingara count as "all other locations" at $1,600 ex GST? What is the 2027 price?
2. Which software do you use (FinishLynx or other)? Can you give me a `.lif` or CSV file for each heat?
3. Does the printer print a slip for each heat with the lane and time for each lane? Please send a photo of one.
4. Can I set or read the race (event) number, so it matches my app?
5. What power, table, shade and rain cover do you need? What is your wet weather plan?
6. How early must I book for Friday 18 June 2027, and what is the cancellation rule if it rains?
7. Is the starter with start system included in the photo finish price (it is not on the list)?

## What I could not confirm

- The 2027 price list (only the 2026 list was found).
- Whether Mingara is "all other locations" and whether Athletics NSW travels to the Central Coast.
- Athletics NSW's contact phone and email, lead time, software brand and slip layout.
- Any Australian price for FinishLynx, Brower or Freelap (only US and UK prices found).
- Any hire company in Newcastle or on the Central Coast.
- Whether any Quantum athletics printer exists.

## Sources

- Athletics NSW, schools carnivals: https://www.nswathletics.org.au/schools
- Athletics NSW 2026 Price List: https://cdn.revolutionise.com.au/cups/nswathletics/files/vmfmklbir3v0rmmb.pdf
- Sydney Olympic Park, carnival booking (photo finish only by Athletics NSW officials at SOPAC): https://www.sopa.nsw.gov.au/athletic-centre/venue-information/carnival-booking-information
- Sport Event Services: https://sportseventservices.com.au/photo-finish-cameras/ and https://sportseventservices.com.au/about-us/
- OzTiming equipment hire: https://oztiming.com.au/equipment-hire
- Swiss Timing athletics: https://www.swisstiming.com/sports/athletics/
- Lynx file formats: https://finishlynx.com/?p=13534 and https://www.finishlynx.com/file-formats-meet-manager/
- Hy-Tek and FinishLynx file sharing: https://hytek.active.com/user_guides_html/swmm6/finishlynxfilesharing.htm
- LIF import event number note (third party): https://2timer-public.pages.dev/help/importing-data
- FinishLynx US prices: https://store.simplifaster.com/product/finish-lynx-timing-system
- Brower prices: https://store.simplifaster.com/product/brower-tci-timing-system/ and https://store.simplifaster.com/product/brower-black-box-timing-system/
- Photo finish app listing: https://apps.apple.com/us/app/photo-finish-app/id1638534762
- Hand time conversion (Victorian source): https://lavic.com.au/competition/victorian-best-performances/
