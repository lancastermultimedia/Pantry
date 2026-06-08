-- Phase 8 SQL Migration — run this AFTER migrations.sql and migrations-phase7 (the 4-line block)
-- Paste the entire file into Supabase SQL Editor and run it.

-- ──────────────────────────────────────────────────────────────
-- Drop old restrictive policies so we can replace with shared-aware ones
-- ──────────────────────────────────────────────────────────────
drop policy if exists "meal_plan: owner access" on meal_plan;
drop policy if exists "meal_slot: owner access" on meal_slot;

-- ──────────────────────────────────────────────────────────────
-- Profiles (extends auth.users)
-- ──────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users primary key,
  display_name text not null,
  avatar_url text,
  email text not null,
  is_searchable boolean default true,
  digest_enabled boolean default true,
  digest_send_day text default 'sunday',
  digest_send_time text default '18:00',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: viewable by authenticated if searchable"
  on profiles for select
  using (auth.role() = 'authenticated' and (is_searchable = true or id = auth.uid()));

create policy "profiles: users insert own"
  on profiles for insert with check (auth.uid() = id);

create policy "profiles: users update own"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ──────────────────────────────────────────────────────────────
-- Shared Pantry connections
-- ──────────────────────────────────────────────────────────────
create table if not exists shared_pantry_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references auth.users not null,
  addressee_id uuid references auth.users not null,
  status text not null default 'pending', -- 'pending' | 'accepted' | 'declined'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(requester_id, addressee_id)
);

alter table shared_pantry_requests enable row level security;

create policy "shared_pantry_requests: parties access"
  on shared_pantry_requests for all
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ──────────────────────────────────────────────────────────────
-- Meal plan members (shared calendars)
-- ──────────────────────────────────────────────────────────────
alter table meal_slot add column if not exists added_by uuid references auth.users;
alter table meal_slot add column if not exists name text;

create table if not exists meal_plan_members (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid references meal_plan not null,
  user_id uuid references auth.users not null,
  role text not null default 'editor',
  invited_by uuid references auth.users,
  joined_at timestamptz not null default now(),
  unique(meal_plan_id, user_id)
);

alter table meal_plan_members enable row level security;

create policy "meal_plan_members: member or owner access"
  on meal_plan_members for all
  using (
    auth.uid() = user_id or
    auth.uid() in (
      select user_id from meal_plan_members m2
      where m2.meal_plan_id = meal_plan_members.meal_plan_id and m2.role = 'owner'
    )
  );

-- ── Updated meal_plan policies ────────────────────────────────
create policy "meal_plan: owner or member read"
  on meal_plan for select
  using (
    auth.uid() = user_id or
    exists (
      select 1 from meal_plan_members mpm
      where mpm.meal_plan_id = meal_plan.id and mpm.user_id = auth.uid()
    )
  );

create policy "meal_plan: owner write"
  on meal_plan for insert with check (auth.uid() = user_id);

create policy "meal_plan: owner update"
  on meal_plan for update using (auth.uid() = user_id);

create policy "meal_plan: owner delete"
  on meal_plan for delete using (auth.uid() = user_id);

-- ── Updated meal_slot policies ────────────────────────────────
create policy "meal_slot: member access"
  on meal_slot for all
  using (
    exists (
      select 1 from meal_plan mp
      left join meal_plan_members mpm on mpm.meal_plan_id = mp.id
      where mp.id = meal_slot.meal_plan_id
        and (mp.user_id = auth.uid() or mpm.user_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from meal_plan mp
      left join meal_plan_members mpm on mpm.meal_plan_id = mp.id
      where mp.id = meal_slot.meal_plan_id
        and (mp.user_id = auth.uid() or mpm.user_id = auth.uid())
    )
  );

-- ──────────────────────────────────────────────────────────────
-- Folder members (shared folders)
-- ──────────────────────────────────────────────────────────────
create table if not exists folder_members (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references folders not null,
  user_id uuid references auth.users not null,
  role text not null default 'editor',
  invited_by uuid references auth.users,
  joined_at timestamptz not null default now(),
  unique(folder_id, user_id)
);

alter table folder_members enable row level security;

create policy "folder_members: member or owner access"
  on folder_members for all
  using (
    auth.uid() = user_id or
    auth.uid() in (
      select user_id from folder_members f2
      where f2.folder_id = folder_members.folder_id and f2.role = 'owner'
    )
  );

-- Allow shared folder members to read the folder
drop policy if exists "folders: owner access" on folders;

create policy "folders: owner write"
  on folders for insert with check (auth.uid() = user_id);

create policy "folders: owner update delete"
  on folders for update using (auth.uid() = user_id);

create policy "folders: owner or member read"
  on folders for select
  using (
    auth.uid() = user_id or
    exists (
      select 1 from folder_members fm
      where fm.folder_id = folders.id and fm.user_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────────
-- Notifications
-- ──────────────────────────────────────────────────────────────
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  type text not null,
  payload jsonb not null default '{}',
  read boolean default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "notifications: owner access"
  on notifications for all using (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────
-- Enable Realtime on key tables
-- ──────────────────────────────────────────────────────────────
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table meal_slot;
