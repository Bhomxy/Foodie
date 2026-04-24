-- Par level, client id for sync, shopping list

alter table public.pantry_items
  add column if not exists par_level numeric,
  add column if not exists client_id text;

create unique index if not exists pantry_items_user_client_uidx
  on public.pantry_items (user_id, client_id)
  where client_id is not null;

create table if not exists public.shopping_list_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  note text,
  done boolean default false,
  client_id text,
  created_at timestamptz default now()
);

create index if not exists shopping_list_user_idx on public.shopping_list_items (user_id);

alter table public.shopping_list_items enable row level security;

create policy "Users manage own shopping list"
  on public.shopping_list_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
