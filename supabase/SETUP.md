# Setting up Supabase (Aths Opt 1.6)

About 10 minutes. Cost: $0 (free plan). Made-up data only (the 620 test students).

1. Make the project at https://supabase.com: name `ccas-athletics-staging`, region **Asia-Pacific (Sydney)**, plan Free. Save the generated database password in your password manager. Do not share it.
2. **Authentication**, then **Sign In / Providers**: turn on **Allow anonymous sign-ins**. Then **Rate Limits**: set the anonymous limit to **100**.
3. **SQL Editor**, then **+ New query**: paste all of `supabase/01-setup.sql` and press **Run**. It should say Success. It is safe to run again.
4. **Project Settings**, then **Data API**: copy the **Project URL**. Then **API Keys**: copy the **publishable** key (starts `sb_publishable_`).
5. Put both in `js/config.js` (`url` and `key`). Never use the secret or service_role key.
6. Test PINs stay while testing: Track Marshal 1111, Place Judge 2222, Recorder 3333, Time Slips 4444, Announcer 5555, Field Station 6666, Organiser 9999. Change them in the organiser's section 1 before staff use the app.

Add `?mode=local` to the address for one-device test mode with no Supabase.
