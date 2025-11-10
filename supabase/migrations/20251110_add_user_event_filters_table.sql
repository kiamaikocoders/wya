create extension if not exists "pgcrypto";

create table if not exists public.user_event_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  sort text not null default 'soonest',
  view text not null default 'grid',
  page_size integer not null default 9,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists user_event_filters_user_id_name_idx
  on public.user_event_filters (user_id, lower(name));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists user_event_filters_set_updated_at on public.user_event_filters;

create trigger user_event_filters_set_updated_at
before update on public.user_event_filters
for each row execute function public.set_updated_at();

alter table public.user_event_filters enable row level security;

drop policy if exists "Users can read their event filters" on public.user_event_filters;
create policy "Users can read their event filters"
  on public.user_event_filters
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their event filters" on public.user_event_filters;
create policy "Users can insert their event filters"
  on public.user_event_filters
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their event filters" on public.user_event_filters;
create policy "Users can update their event filters"
  on public.user_event_filters
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their event filters" on public.user_event_filters;
create policy "Users can delete their event filters"
  on public.user_event_filters
  for delete
  using (auth.uid() = user_id);

