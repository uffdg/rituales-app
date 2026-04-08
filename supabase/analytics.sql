create extension if not exists pgcrypto;

create table if not exists public.ritual_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  session_id text not null,
  event_name text not null,
  path text,
  referrer text,
  props jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  inserted_at timestamptz not null default now()
);

create index if not exists ritual_events_occurred_at_idx
  on public.ritual_events (occurred_at desc);

create index if not exists ritual_events_event_name_idx
  on public.ritual_events (event_name);

create index if not exists ritual_events_user_id_idx
  on public.ritual_events (user_id)
  where user_id is not null;

create index if not exists ritual_events_session_id_idx
  on public.ritual_events (session_id);

alter table public.ritual_events enable row level security;

drop policy if exists "ritual_events_insert_anon" on public.ritual_events;
create policy "ritual_events_insert_anon"
  on public.ritual_events
  for insert
  to anon
  with check (user_id is null);

drop policy if exists "ritual_events_insert_authenticated" on public.ritual_events;
create policy "ritual_events_insert_authenticated"
  on public.ritual_events
  for insert
  to authenticated
  with check (user_id is null or auth.uid() = user_id);

drop policy if exists "ritual_events_select_own" on public.ritual_events;
create policy "ritual_events_select_own"
  on public.ritual_events
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace view public.analytics_event_activity_days as
select
  coalesce(user_id::text, session_id) as actor_key,
  user_id,
  session_id,
  (occurred_at at time zone 'America/Argentina/Buenos_Aires')::date as activity_date,
  min(occurred_at) as first_event_at,
  count(*) as events_count
from public.ritual_events
group by 1, 2, 3, 4;

create or replace view public.analytics_user_first_seen as
select
  actor_key,
  min(activity_date) as first_seen_date
from public.analytics_event_activity_days
group by actor_key;

create or replace view public.analytics_daily_active_users as
select
  activity_date,
  count(distinct actor_key) as active_users,
  count(distinct user_id) filter (where user_id is not null) as authenticated_users,
  count(distinct session_id) as sessions
from public.analytics_event_activity_days
group by activity_date
order by activity_date desc;

create or replace view public.analytics_retention_exact as
with first_seen as (
  select actor_key, first_seen_date
  from public.analytics_user_first_seen
),
activity as (
  select actor_key, activity_date
  from public.analytics_event_activity_days
  group by actor_key, activity_date
)
select
  first_seen.first_seen_date as cohort_date,
  count(*) as cohort_size,
  count(*) filter (
    where exists (
      select 1
      from activity
      where activity.actor_key = first_seen.actor_key
        and activity.activity_date = first_seen.first_seen_date + 1
    )
  ) as retained_d1,
  count(*) filter (
    where exists (
      select 1
      from activity
      where activity.actor_key = first_seen.actor_key
        and activity.activity_date = first_seen.first_seen_date + 7
    )
  ) as retained_d7,
  count(*) filter (
    where exists (
      select 1
      from activity
      where activity.actor_key = first_seen.actor_key
        and activity.activity_date = first_seen.first_seen_date + 30
    )
  ) as retained_d30
from first_seen
group by first_seen.first_seen_date
order by first_seen.first_seen_date desc;

create or replace view public.analytics_retention_rates as
select
  cohort_date,
  cohort_size,
  retained_d1,
  retained_d7,
  retained_d30,
  round((retained_d1::numeric / nullif(cohort_size, 0)) * 100, 2) as retention_d1_pct,
  round((retained_d7::numeric / nullif(cohort_size, 0)) * 100, 2) as retention_d7_pct,
  round((retained_d30::numeric / nullif(cohort_size, 0)) * 100, 2) as retention_d30_pct
from public.analytics_retention_exact
order by cohort_date desc;

create or replace view public.analytics_event_summary as
select
  event_name,
  count(*) as total_events,
  count(distinct coalesce(user_id::text, session_id)) as unique_actors,
  min(occurred_at) as first_seen_at,
  max(occurred_at) as last_seen_at
from public.ritual_events
group by event_name
order by total_events desc;

create or replace view public.analytics_funnel_daily as
with actor_events as (
  select
    (occurred_at at time zone 'America/Argentina/Buenos_Aires')::date as activity_date,
    coalesce(user_id::text, session_id) as actor_key,
    event_name
  from public.ritual_events
),
page_views as (
  select activity_date, count(distinct actor_key) as page_view_users
  from actor_events
  where event_name = 'page_view'
  group by activity_date
),
logins as (
  select activity_date, count(distinct actor_key) as login_users
  from actor_events
  where event_name = 'login'
  group by activity_date
),
ritual_created as (
  select activity_date, count(distinct actor_key) as ritual_created_users
  from actor_events
  where event_name = 'ritual_created'
  group by activity_date
),
ritual_saved as (
  select activity_date, count(distinct actor_key) as ritual_saved_users
  from actor_events
  where event_name = 'ritual_saved'
  group by activity_date
)
select
  activity_date,
  coalesce(page_views.page_view_users, 0) as page_view_users,
  coalesce(logins.login_users, 0) as login_users,
  coalesce(ritual_created.ritual_created_users, 0) as ritual_created_users,
  coalesce(ritual_saved.ritual_saved_users, 0) as ritual_saved_users,
  round(
    (coalesce(logins.login_users, 0)::numeric / nullif(coalesce(page_views.page_view_users, 0), 0)) * 100,
    2
  ) as login_from_visit_pct,
  round(
    (coalesce(ritual_created.ritual_created_users, 0)::numeric / nullif(coalesce(logins.login_users, 0), 0)) * 100,
    2
  ) as ritual_created_from_login_pct,
  round(
    (coalesce(ritual_saved.ritual_saved_users, 0)::numeric / nullif(coalesce(ritual_created.ritual_created_users, 0), 0)) * 100,
    2
  ) as ritual_saved_from_created_pct
from (
  select distinct activity_date
  from actor_events
) days
left join page_views using (activity_date)
left join logins using (activity_date)
left join ritual_created using (activity_date)
left join ritual_saved using (activity_date)
order by activity_date desc;

create or replace view public.analytics_funnel_totals as
select
  sum(page_view_users) as page_view_users,
  sum(login_users) as login_users,
  sum(ritual_created_users) as ritual_created_users,
  sum(ritual_saved_users) as ritual_saved_users,
  round((sum(login_users)::numeric / nullif(sum(page_view_users), 0)) * 100, 2) as login_from_visit_pct,
  round((sum(ritual_created_users)::numeric / nullif(sum(login_users), 0)) * 100, 2) as ritual_created_from_login_pct,
  round((sum(ritual_saved_users)::numeric / nullif(sum(ritual_created_users), 0)) * 100, 2) as ritual_saved_from_created_pct
from public.analytics_funnel_daily;

comment on table public.ritual_events is
'Eventos de producto para medir uso y recurrencia de Rituales.';

comment on view public.analytics_daily_active_users is
'DAU por fecha argentina, contando usuarios autenticados o sesiones anónimas.';

comment on view public.analytics_retention_rates is
'Retención exacta D1, D7 y D30 por cohorte de primera actividad.';

comment on view public.analytics_funnel_daily is
'Embudo diario de producto: visita, login, ritual creado y ritual guardado.';

comment on view public.analytics_funnel_totals is
'Embudo acumulado de producto sobre todos los días disponibles.';
