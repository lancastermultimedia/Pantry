-- Run this entire file in the Supabase SQL editor to set up the Pantry schema.

-- ──────────────────────────────────────────────────
-- Tables
-- ──────────────────────────────────────────────────

create table if not exists recipe (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  url text,
  title text not null,
  image_url text,
  ingredients jsonb default '[]'::jsonb,
  instructions text,
  cook_time_mins int,
  servings int,
  is_favourite boolean not null default false,
  is_recurring boolean not null default false,
  recurrence_rule text,
  scraped_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists meal_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  week_start date not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table if not exists meal_slot (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid references meal_plan on delete cascade not null,
  day_of_week int not null check (day_of_week between 0 and 6),
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner')),
  recipe_id uuid references recipe on delete cascade not null,
  unique (meal_plan_id, day_of_week, meal_type)
);

-- ──────────────────────────────────────────────────
-- Row Level Security
-- ──────────────────────────────────────────────────

alter table recipe enable row level security;
alter table meal_plan enable row level security;
alter table meal_slot enable row level security;

-- recipe: users can only see/modify their own
create policy "recipe: owner access" on recipe
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- meal_plan: users can only see/modify their own
create policy "meal_plan: owner access" on meal_plan
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────
-- Phase 7: Folders
-- Run this block separately if Phase 1 schema already exists
-- ──────────────────────────────────────────────────

create table if not exists folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  color text not null default '#2D5016',
  created_at timestamptz not null default now()
);

alter table recipe add column if not exists folder_id uuid references folders(id) on delete set null;

alter table folders enable row level security;

create policy "folders: owner access" on folders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────

-- meal_slot: accessible if the parent meal_plan belongs to the user
create policy "meal_slot: owner access" on meal_slot
  for all
  using (
    exists (
      select 1 from meal_plan
      where meal_plan.id = meal_slot.meal_plan_id
        and meal_plan.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from meal_plan
      where meal_plan.id = meal_slot.meal_plan_id
        and meal_plan.user_id = auth.uid()
    )
  );
