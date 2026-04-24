-- Foodie / MealMate v1 schema — run via Supabase CLI: supabase db push

create extension if not exists "uuid-ossp";

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  dietary_notes text,
  created_at timestamptz default now()
);

-- Pantry items
create table if not exists public.pantry_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  quantity numeric not null default 1,
  unit text not null default 'pcs',
  expires_at date,
  created_at timestamptz default now()
);

create index if not exists pantry_items_user_id_idx on public.pantry_items (user_id);
create index if not exists pantry_items_expires_at_idx on public.pantry_items (expires_at);

-- Cached AI recipes (normalized for reuse)
create table if not exists public.recipes (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner')),
  description text,
  ingredients jsonb default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  estimated_minutes int,
  created_at timestamptz default now()
);

-- Daily plan rows (one per user per local date)
create table if not exists public.daily_meal_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_date date not null,
  breakfast_recipe_id uuid references public.recipes (id),
  lunch_recipe_id uuid references public.recipes (id),
  dinner_recipe_id uuid references public.recipes (id),
  created_at timestamptz default now(),
  unique (user_id, plan_date)
);

-- Push tokens for Expo (server-triggered expiry / meal nudges later)
create table if not exists public.push_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  expo_push_token text not null,
  created_at timestamptz default now(),
  unique (user_id, expo_push_token)
);

alter table public.profiles enable row level security;
alter table public.pantry_items enable row level security;
alter table public.recipes enable row level security;
alter table public.daily_meal_plans enable row level security;
alter table public.push_tokens enable row level security;

create policy "Users manage own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users manage own pantry"
  on public.pantry_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Recipes readable by authenticated users"
  on public.recipes for select
  using (auth.role() = 'authenticated');

create policy "Users manage own meal plans"
  on public.daily_meal_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own push tokens"
  on public.push_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
