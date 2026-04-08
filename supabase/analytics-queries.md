# Analytics en Supabase

## 1. Aplicar la migración

Abrí `Supabase -> SQL Editor` y corré:

```sql
-- copiar y pegar el contenido de supabase/analytics.sql
```

## 2. Qué guarda la app

La app ahora inserta en `public.ritual_events`:

- `app_open`
- `page_view`
- `login`
- `logout`
- `voice_input_started`
- `voice_input_used`
- `voice_onboarding_used`
- `onboarding_completed`
- `onboarding_voice_completed`
- `ritual_created`
- `ritual_completed`
- `ritual_saved`

Y cualquier otro evento que ya se mande con `track(...)`.

## 3. Vistas listas para usar

### DAU

```sql
select * from public.analytics_daily_active_users;
```

### Retención D1 / D7 / D30

```sql
select * from public.analytics_retention_rates;
```

### Resumen por evento

```sql
select * from public.analytics_event_summary;
```

### Embudo diario

```sql
select * from public.analytics_funnel_daily;
```

### Embudo total

```sql
select * from public.analytics_funnel_totals;
```

## 4. Consultas útiles

### Usuarios activos últimos 7 días

```sql
select sum(active_users) as active_users_7d
from public.analytics_daily_active_users
where activity_date >= current_date - 6;
```

### Usuarios activos últimos 30 días

```sql
select sum(active_users) as active_users_30d
from public.analytics_daily_active_users
where activity_date >= current_date - 29;
```

### Rituales creados por día

```sql
select
  (occurred_at at time zone 'America/Argentina/Buenos_Aires')::date as day,
  count(*) as rituals_created
from public.ritual_events
where event_name = 'ritual_created'
group by 1
order by 1 desc;
```

### Rituales guardados por día

```sql
select
  (occurred_at at time zone 'America/Argentina/Buenos_Aires')::date as day,
  count(*) as rituals_saved
from public.ritual_events
where event_name = 'ritual_saved'
group by 1
order by 1 desc;
```

### Cuántas usuarias vuelven luego de crear su ritual

```sql
with creators as (
  select
    coalesce(user_id::text, session_id) as actor_key,
    min((occurred_at at time zone 'America/Argentina/Buenos_Aires')::date) as first_ritual_date
  from public.ritual_events
  where event_name = 'ritual_created'
  group by 1
),
returns as (
  select
    coalesce(user_id::text, session_id) as actor_key,
    (occurred_at at time zone 'America/Argentina/Buenos_Aires')::date as activity_date
  from public.ritual_events
  group by 1, 2
)
select
  count(*) as creators,
  count(*) filter (
    where exists (
      select 1
      from returns
      where returns.actor_key = creators.actor_key
        and returns.activity_date > creators.first_ritual_date
    )
  ) as creators_who_returned
from creators;
```
