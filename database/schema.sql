-- Hostel Room Allocation and Maintenance Request Portal
-- Run this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name varchar(80) not null,
  email varchar(160) not null unique,
  password_hash text not null,
  role varchar(20) not null default 'student' check (role in ('student','warden')),
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_number varchar(20) not null,
  block varchar(50) not null,
  capacity integer not null check (capacity between 1 and 10),
  created_at timestamptz not null default now(),
  unique(room_number, block)
);

create table if not exists public.allocations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete restrict,
  room_id uuid not null references public.rooms(id) on delete restrict,
  status varchar(20) not null default 'active' check (status in ('active','released')),
  allocated_at timestamptz not null default now(),
  released_at timestamptz
);

create unique index if not exists one_active_allocation_per_student
on public.allocations(student_id) where status='active';

create index if not exists allocations_room_status_idx on public.allocations(room_id,status);

create table if not exists public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete restrict,
  room_id uuid not null references public.rooms(id) on delete restrict,
  title varchar(120) not null,
  description varchar(1000) not null,
  priority varchar(20) not null default 'medium' check (priority in ('low','medium','high')),
  status varchar(20) not null default 'pending' check (status in ('pending','in_progress','resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists maintenance_status_idx on public.maintenance_requests(status);
create index if not exists maintenance_student_idx on public.maintenance_requests(student_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end; $$;

drop trigger if exists maintenance_updated_at on public.maintenance_requests;
create trigger maintenance_updated_at before update on public.maintenance_requests
for each row execute function public.set_updated_at();

-- RLS is enabled as defense-in-depth. The Node.js backend uses the
-- server-only service-role key and performs application-level authorization.
alter table public.users enable row level security;
alter table public.rooms enable row level security;
alter table public.allocations enable row level security;
alter table public.maintenance_requests enable row level security;

-- No public policies are created because browser clients never receive
-- the service-role key. All database access goes through the protected API.

-- Optional demo rooms:
insert into public.rooms (room_number, block, capacity)
values
('101','A Block',2),('102','A Block',2),('103','A Block',3),
('201','B Block',2),('202','B Block',3),('203','B Block',2)
on conflict (room_number,block) do nothing;