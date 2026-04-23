-- ============================================================
-- DISCIPLINE APP — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- HABITS (task definitions — reconfigurable)
-- ============================================================
create table if not exists habits (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  name          text not null,
  description   text default '',
  scheduled_time text not null,                    -- 'HH:MM' 24h format
  repeat_days   integer[] default array[0,1,2,3,4,5,6], -- 0=Sun … 6=Sat
  requires_photo boolean default true,
  is_active     boolean default true,
  order_index   integer default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- TASK LOGS (daily completion records)
-- ============================================================
create table if not exists task_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  habit_id      uuid references habits(id) on delete cascade not null,
  log_date      date not null,
  status        text check (status in ('pending','completed','missed')) default 'pending',
  completed_at  timestamptz,
  photo_url     text,
  photo_path    text,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(habit_id, log_date)
);

-- ============================================================
-- PUSH SUBSCRIPTIONS
-- ============================================================
create table if not exists push_subscriptions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  subscription jsonb not null,
  device_name  text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ============================================================
-- STREAKS (cached per user)
-- ============================================================
create table if not exists streaks (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid references auth.users(id) on delete cascade not null,
  current_streak      integer default 0,
  max_streak          integer default 0,
  last_perfect_day    date,
  perfect_days_count  integer default 0,
  updated_at          timestamptz default now(),
  unique(user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table habits              enable row level security;
alter table task_logs           enable row level security;
alter table push_subscriptions  enable row level security;
alter table streaks             enable row level security;

create policy "own_habits"             on habits             for all using (auth.uid() = user_id);
create policy "own_task_logs"          on task_logs          for all using (auth.uid() = user_id);
create policy "own_push_subscriptions" on push_subscriptions for all using (auth.uid() = user_id);
create policy "own_streaks"            on streaks            for all using (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_habits_updated_at
  before update on habits for each row execute function update_updated_at();

create trigger trg_task_logs_updated_at
  before update on task_logs for each row execute function update_updated_at();

-- ============================================================
-- DEFAULT HABITS ON NEW USER REGISTRATION
-- ============================================================
create or replace function create_default_habits_for_user()
returns trigger language plpgsql security definer as $$
begin
  insert into habits (user_id, name, description, scheduled_time, order_index) values
    (new.id, 'Levantarme',              'Levantarme y empezar el día',                  '08:30', 0),
    (new.id, 'Bloque clave TeneriTech', 'Trabajo importante del día',                   '09:00', 1),
    (new.id, 'Sacar al perro - mañana', 'Paseo de la mañana',                           '09:30', 2),
    (new.id, 'Deporte / actividad',     'Gimnasio, paseo, surf o actividad física',      '11:30', 3),
    (new.id, 'Bloque secundario',       'Contenido, mejoras, aprendizaje práctico',      '15:30', 4),
    (new.id, 'Sacar al perro - tarde',  'Paseo de la tarde',                             '16:30', 5),
    (new.id, 'Sacar al perro - noche',  'Paseo de la noche',                             '22:30', 6),
    (new.id, 'Desconectar',             'Apagar el día y prepararme para dormir',        '00:30', 7),
    (new.id, 'Dormir',                  'Irme a dormir',                                 '01:00', 8);

  insert into streaks (user_id) values (new.id)
    on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function create_default_habits_for_user();

-- ============================================================
-- STORAGE BUCKET FOR PHOTOS
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('habit-photos', 'habit-photos', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do nothing;

create policy "upload_own_photos"
  on storage.objects for insert
  with check (bucket_id = 'habit-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "view_own_photos"
  on storage.objects for select
  using (bucket_id = 'habit-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "delete_own_photos"
  on storage.objects for delete
  using (bucket_id = 'habit-photos' and auth.uid()::text = (storage.foldername(name))[1]);
