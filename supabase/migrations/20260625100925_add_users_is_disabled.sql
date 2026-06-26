alter table public.users add column if not exists is_disabled boolean not null default false;
