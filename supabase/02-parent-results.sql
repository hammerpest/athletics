-- Aths Opt 1.7: results for parents (the page at /parents/). Safe to run again.
-- Run it after 01-setup.sql, in the Supabase SQL Editor.
--
-- Parents need no PIN and no sign-in, so hundreds of phones never touch the hourly sign-in limit.
-- They call one function that hands out only what the results page needs:
--   - nothing at all unless the organiser has turned the parents page on (config/main "parents": true);
--   - only students who are in a heat or on a field list, as a code (p and 10 letters), with first name and surname initial only when the organiser has chosen
--     "show first name and surname initial" (config/main "parentsNames": "short"); the default is "none": no name leaves the server.
--     Student ids are built from the full name, so they never leave the server; the code is a hash of the id with a
--     secret kept on the server, so it stays the same all day and says nothing about the name;
--   - unless the organiser ticked "show results before a group is final" (config/main "parentsProv": true), only field groups
--     that are final and track races the Recorder has checked;
--   - record holders as first name and surname initial (or "A student" when names are off);
--   - only the fields the results need: no PINs, no device ids, no slip readings or photos, no chief official name.
-- The page asks every minute with the version it has; when nothing changed the answer is tiny.

create table if not exists private.parent_secret (id int primary key default 1 check (id = 1), salt text not null);
insert into private.parent_secret (salt) values (md5(random()::text || clock_timestamp()::text)) on conflict (id) do nothing;
alter table private.parent_secret enable row level security;
revoke all on private.parent_secret from public, anon, authenticated;

create or replace function private.short_name(n text) returns text
language sql immutable set search_path = '' as $$
  select case
    when coalesce(btrim(n), '') = '' then ''
    when array_length(regexp_split_to_array(btrim(n), '\s+'), 1) = 1 then left(btrim(n), 1) || '.'
    else split_part(btrim(n), ' ', 1) || ' ' || left((regexp_split_to_array(btrim(n), '\s+'))[array_length(regexp_split_to_array(btrim(n), '\s+'), 1)], 1) || '.'
  end
$$;

-- The code for an id. An id the roster does not know (a student taken off the list, say) is hashed too, never passed on:
-- only a relay team (T- and a house letter) keeps its own name. Fails closed.
create or replace function private.pcode(val text, ids jsonb, salt text) returns text
language sql immutable set search_path = '' as $$
  select coalesce(ids->>val, case when val ~ '^T-[A-Z]$' then val else 'p' || left(md5(salt || coalesce(val, '')), 10) end)
$$;

-- Swap student ids for their codes in the keys of an object (field marks, who is on the list, weights, throws again).
drop function if exists private.rekey(jsonb, jsonb);
create or replace function private.rekey(o jsonb, ids jsonb, salt text) returns jsonb
language sql immutable set search_path = '' as $$
  select coalesce(jsonb_object_agg(private.pcode(e.key, ids, salt), e.value), '{}'::jsonb)
  from jsonb_each(case when jsonb_typeof(o) = 'object' then o else '{}'::jsonb end) e
$$;

create or replace function public.parent_results(have text default '') returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare cfg jsonb; v text; ids jsonb; used jsonb; salt text; names_on boolean; prov boolean;
begin
  select doc into cfg from public.config where id = 'main';
  if cfg is null or coalesce(cfg->'parents', 'false'::jsonb) <> 'true'::jsonb then
    return jsonb_build_object('off', true);
  end if;
  -- names are off unless the organiser chooses them (privacy: check consent first)
  names_on := coalesce(cfg->>'parentsNames', 'none') = 'short';
  prov := coalesce((cfg->>'parentsProv')::boolean, false);
  v := concat_ws('.',
    (select count(*) || '-' || coalesce(floor(extract(epoch from max(updated_at)) * 1000)::bigint, 0) from public.heats),
    (select count(*) || '-' || coalesce(floor(extract(epoch from max(updated_at)) * 1000)::bigint, 0) from public.times),
    (select count(*) || '-' || coalesce(floor(extract(epoch from max(updated_at)) * 1000)::bigint, 0) from public.finish),
    (select count(*) || '-' || coalesce(floor(extract(epoch from max(updated_at)) * 1000)::bigint, 0) from public.field),
    (select count(*) || '-' || coalesce(floor(extract(epoch from max(updated_at)) * 1000)::bigint, 0) from public.records),
    (select count(*) || '-' || coalesce(floor(extract(epoch from max(updated_at)) * 1000)::bigint, 0) from public.roster),
    (select count(*) || '-' || coalesce(floor(extract(epoch from max(updated_at)) * 1000)::bigint, 0) from public.extras),
    (select coalesce(floor(extract(epoch from max(updated_at)) * 1000)::bigint, 0) from public.config));
  if v = have then
    return jsonb_build_object('v', v, 'same', true);
  end if;
  select p.salt into salt from private.parent_secret p where p.id = 1;
  -- every student gets a fixed code; relay teams (a house letter) are not students and keep their names
  select coalesce(jsonb_object_agg(id, 'p' || left(md5(salt || id), 10)), '{}'::jsonb) into ids from (
    select s->>'id' as id from public.roster r, jsonb_array_elements(r.doc->'students') s
    union select x.doc->>'id' from public.extras x) q where id is not null;
  -- only students who are in a heat or on a field list leave the server
  select coalesce(jsonb_object_agg(k, true), '{}'::jsonb) into used from (
    select e.value as k from public.heats h, jsonb_each_text(case when jsonb_typeof(h.doc->'lanes') = 'object' then h.doc->'lanes' else '{}'::jsonb end) e
    union select k from public.field fd, jsonb_object_keys(case when jsonb_typeof(fd.doc->'ath') = 'object' then fd.doc->'ath' else '{}'::jsonb end) k
    union select k from public.field fd, jsonb_object_keys(case when jsonb_typeof(fd.doc->'marks') = 'object' then fd.doc->'marks' else '{}'::jsonb end) k) u;
  return jsonb_build_object(
    'v', v,
    'config', cfg - 'pins' - 'chief' - 'runId' - 'lockedBy',
    'heats', coalesce((select jsonb_agg(jsonb_build_object('_id', h.id, 'race', h.doc->'race', 'heat', h.doc->'heat',
        'k', h.doc->'k', 'x', h.doc->'x', 'g', h.doc->'g', 'gen', h.doc->'gen', 'cancelled', h.doc->'cancelled',
        'edited', h.doc->'edited', 'at', h.doc->'at', 'multi', h.doc->'multi',
        'lanes', coalesce((select jsonb_object_agg(e.key, private.pcode(e.value, ids, salt)) from jsonb_each_text(case when jsonb_typeof(h.doc->'lanes') = 'object' then h.doc->'lanes' else '{}'::jsonb end) e), '{}'::jsonb)))
      from public.heats h), '[]'::jsonb),
    -- per lane only the time, its status and (for "Slip differs") the slip's time
    'times', coalesce((select jsonb_object_agg(t.id, jsonb_build_object('gen', t.doc->'gen', 'checked', t.doc->'checked',
        'checkedAt', t.doc->'checkedAt', 'at', t.doc->'at', 'src', t.doc->'src',
        'lanes', coalesce((select jsonb_object_agg(l.key, jsonb_build_object('t', l.value->'t', 'st', l.value->'st', 'slip', l.value->'slip', 'src', l.value->'src'))
          from jsonb_each(t.doc->'lanes') l), '{}'::jsonb)))
      from public.times t where prov or coalesce((t.doc->>'checked')::boolean, false)), '{}'::jsonb),
    'finish', coalesce((select jsonb_object_agg(f.id, jsonb_build_object('order', f.doc->'order', 'gen', f.doc->'gen',
      'ck', f.doc->'ck', 'ok', f.doc->'ok', 'at', f.doc->'at')) from public.finish f), '{}'::jsonb),
    -- field groups: marks and who is on the list, with student codes; no device ids
    'field', coalesce((select jsonb_object_agg(fd.id, jsonb_build_object('k', fd.doc->'k', 'x', fd.doc->'x', 'g', fd.doc->'g',
        'ath', private.rekey(fd.doc->'ath', ids, salt), 'marks', private.rekey(fd.doc->'marks', ids, salt),
        'tg', private.rekey(fd.doc->'tg', ids, salt), 'wt', private.rekey(fd.doc->'wt', ids, salt),
        'setd', fd.doc->'setd', 'tgo', fd.doc->'tgo', 'started', fd.doc->'started', 'final', fd.doc->'final',
        'finalAt', fd.doc->'finalAt', 'hs', fd.doc->'hs', 'hn', fd.doc->'hn'))
      from public.field fd where prov or coalesce((fd.doc->>'final')::boolean, false)), '{}'::jsonb),
    'records', coalesce((select jsonb_agg(jsonb_build_object('key', r->'key', 't', r->'t', 'v', r->'v',
        'holders', coalesce((select jsonb_agg(jsonb_build_object('n',
            case when names_on then private.short_name(regexp_replace(hd->>'n', '^Test: ', '')) else 'A student' end,
          'h', hd->'h', 'y', hd->'y')) from jsonb_array_elements(r->'holders') hd), '[]'::jsonb)))
      from public.records rr, jsonb_array_elements(rr.doc->'list') r where rr.id = 'all'), '[]'::jsonb),
    'students', coalesce((
      with everyone as (
        select s from public.roster r, jsonb_array_elements(r.doc->'students') s
        union all select x.doc from public.extras x)
      select jsonb_agg(jsonb_build_object('id', ids->>(s->>'id'),
        'f', case when names_on then coalesce(nullif(btrim(s->>'f'), ''), 'Student') else 'Student' end,
        's', case when names_on and coalesce(btrim(s->>'s'), '') <> '' then left(btrim(s->>'s'), 1) || '.' else '' end,
        'h', s->>'h', 'x', s->>'x', 'g', s->>'g'))
      from everyone where ids ? (s->>'id') and used ? (s->>'id')), '[]'::jsonb)
  );
end $$;

revoke all on function private.short_name(text) from public, anon;
revoke all on function private.pcode(text, jsonb, text) from public, anon;
revoke all on function private.rekey(jsonb, jsonb, text) from public, anon;
revoke all on function public.parent_results(text) from public;
grant execute on function public.parent_results(text) to anon, authenticated;
