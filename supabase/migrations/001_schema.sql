-- DigOnce — Database Schema Migration
-- Run this in Supabase SQL Editor or via CLI

-- ─── Enums ──────────────────────────────────────────────────────

create type work_type   as enum ('excavation','resurfacing','pipeline','drainage','cable','other');
create type work_status as enum ('planned','active','completed','delayed','cancelled');
create type delay_reason as enum ('weather','material_shortage','permit_pending','utility_clash','funding','contractor_issue','design_change','other');

-- ─── Tables ─────────────────────────────────────────────────────

create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('department','citizen')),
  department_id uuid references departments(id)
);

create table segments (
  id text primary key,
  name text,
  ward text,
  length_m numeric,
  geometry jsonb not null  -- GeoJSON LineString
);

create table works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  purpose text not null,
  department_id uuid not null references departments(id),
  contractor_name text,
  type work_type not null,
  status work_status not null default 'planned',
  start_date date not null,
  end_date date not null,
  original_end_date date not null,
  is_demo boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  check (end_date >= start_date)
);

create table work_segments (
  work_id uuid references works(id) on delete cascade,
  segment_id text references segments(id),
  primary key (work_id, segment_id)
);

create table delay_events (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references works(id) on delete cascade,
  old_end date not null,
  new_end date not null,
  reason delay_reason not null,
  note text,
  created_at timestamptz default now()
);

create table checkins (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references works(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  lat double precision not null,
  lng double precision not null,
  distance_m numeric not null,
  valid boolean not null,
  mode text not null check (mode in ('gps','demo_picker')),
  photo_path text,
  note text,
  created_at timestamptz default now()
);

-- ─── Indexes ────────────────────────────────────────────────────

create index idx_works_department on works(department_id);
create index idx_works_status on works(status);
create index idx_works_dates on works(start_date, end_date);
create index idx_work_segments_segment on work_segments(segment_id);
create index idx_checkins_work on checkins(work_id);
create index idx_delay_events_work on delay_events(work_id);

-- ─── Row Level Security ─────────────────────────────────────────

alter table departments enable row level security;
alter table profiles enable row level security;
alter table segments enable row level security;
alter table works enable row level security;
alter table work_segments enable row level security;
alter table delay_events enable row level security;
alter table checkins enable row level security;

-- Public read for all reference and public data
create policy "Public read departments" on departments for select using (true);
create policy "Public read segments" on segments for select using (true);
create policy "Public read works" on works for select using (true);
create policy "Public read work_segments" on work_segments for select using (true);
create policy "Public read delay_events" on delay_events for select using (true);
create policy "Public read checkins" on checkins for select using (true);
create policy "Public read profiles" on profiles for select using (true);

-- Department users can insert/update their own works
create policy "Dept insert works" on works for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
        and profiles.role = 'department'
        and profiles.department_id = works.department_id
    )
  );

create policy "Dept update works" on works for update
  using (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
        and profiles.role = 'department'
        and profiles.department_id = works.department_id
    )
  );

-- Department users can manage work_segments for their works
create policy "Dept insert work_segments" on work_segments for insert
  with check (
    exists (
      select 1 from works
      join profiles on profiles.user_id = auth.uid()
      where works.id = work_segments.work_id
        and profiles.role = 'department'
        and profiles.department_id = works.department_id
    )
  );

create policy "Dept delete work_segments" on work_segments for delete
  using (
    exists (
      select 1 from works
      join profiles on profiles.user_id = auth.uid()
      where works.id = work_segments.work_id
        and profiles.role = 'department'
        and profiles.department_id = works.department_id
    )
  );

-- Department users can insert delay events for their works
create policy "Dept insert delay_events" on delay_events for insert
  with check (
    exists (
      select 1 from works
      join profiles on profiles.user_id = auth.uid()
      where works.id = delay_events.work_id
        and profiles.role = 'department'
        and profiles.department_id = works.department_id
    )
  );

-- Any authenticated user can insert check-ins (own user_id only)
create policy "Auth insert checkins" on checkins for insert
  with check (auth.uid() = user_id);
