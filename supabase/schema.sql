-- Run this file once in your Supabase project's SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'friend' check (char_length(display_name) between 1 and 40),
  bio text not null default '' check (char_length(bio) <= 160),
  role text not null default 'member' check (role in ('member', 'admin')),
  banned_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists role text not null default 'member'
    check (role in ('member', 'admin')),
  add column if not exists banned_at timestamptz;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists comments_post_created_at_idx on public.comments (post_id, created_at);
create index if not exists likes_post_id_idx on public.likes (post_id);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;

revoke insert, update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, bio) on public.profiles to authenticated;
grant select, insert, update, delete on public.posts to authenticated;
grant select, insert, update, delete on public.comments to authenticated;
grant select, insert, delete on public.likes to authenticated;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and banned_at is null
  );
$$;

create or replace function public.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and banned_at is null
  );
$$;

revoke all on function public.current_user_is_admin() from public;
revoke all on function public.current_user_is_active() from public;
grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.current_user_is_active() to authenticated;

drop policy if exists "Authenticated users can view profiles" on public.profiles;
drop policy if exists "Members can view profiles" on public.profiles;
create policy "Members can view profiles"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.current_user_is_active()));

drop policy if exists "Users can create their own profile" on public.profiles;
drop policy if exists "Members can create their own profile" on public.profiles;

drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Members can update their own profile" on public.profiles;
create policy "Members can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id and (select public.current_user_is_active()))
  with check ((select auth.uid()) = id and (select public.current_user_is_active()));

drop policy if exists "Authenticated users can view posts" on public.posts;
drop policy if exists "Active members can view posts" on public.posts;
create policy "Active members can view posts"
  on public.posts for select to authenticated using ((select public.current_user_is_active()));

drop policy if exists "Users can create their own posts" on public.posts;
drop policy if exists "Active members can create their own posts" on public.posts;
create policy "Active members can create their own posts"
  on public.posts for insert to authenticated
  with check ((select auth.uid()) = user_id and (select public.current_user_is_active()));

drop policy if exists "Users can update their own posts" on public.posts;
drop policy if exists "Active members can update their own posts" on public.posts;
create policy "Active members can update their own posts"
  on public.posts for update to authenticated
  using ((select auth.uid()) = user_id and (select public.current_user_is_active()))
  with check ((select auth.uid()) = user_id and (select public.current_user_is_active()));

drop policy if exists "Users can delete their own posts" on public.posts;
drop policy if exists "Active members can delete their own posts" on public.posts;
create policy "Active members can delete their own posts"
  on public.posts for delete to authenticated
  using ((select auth.uid()) = user_id and (select public.current_user_is_active()));

drop policy if exists "Authenticated users can view comments" on public.comments;
drop policy if exists "Active members can view comments" on public.comments;
create policy "Active members can view comments"
  on public.comments for select to authenticated using ((select public.current_user_is_active()));

drop policy if exists "Users can create their own comments" on public.comments;
drop policy if exists "Active members can create their own comments" on public.comments;
create policy "Active members can create their own comments"
  on public.comments for insert to authenticated with check (
    (select auth.uid()) = user_id
    and (select public.current_user_is_active())
    and exists (select 1 from public.posts where posts.id = post_id)
  );

drop policy if exists "Users can update their own comments" on public.comments;
drop policy if exists "Active members can update their own comments" on public.comments;
create policy "Active members can update their own comments"
  on public.comments for update to authenticated
  using ((select auth.uid()) = user_id and (select public.current_user_is_active()))
  with check ((select auth.uid()) = user_id and (select public.current_user_is_active()));

drop policy if exists "Users can delete their own comments" on public.comments;
drop policy if exists "Active members can delete their own comments" on public.comments;
drop policy if exists "Admins can delete comments" on public.comments;
create policy "Active members can delete their own comments"
  on public.comments for delete to authenticated
  using ((select auth.uid()) = user_id and (select public.current_user_is_active()));
create policy "Admins can delete comments"
  on public.comments for delete to authenticated
  using ((select public.current_user_is_admin()));

drop policy if exists "Active members can view likes" on public.likes;
create policy "Active members can view likes"
  on public.likes for select to authenticated using ((select public.current_user_is_active()));

drop policy if exists "Members can like posts" on public.likes;
create policy "Members can like posts"
  on public.likes for insert to authenticated with check (
    (select auth.uid()) = user_id
    and (select public.current_user_is_active())
    and exists (select 1 from public.posts where posts.id = post_id)
  );

drop policy if exists "Members can remove their own likes" on public.likes;
create policy "Members can remove their own likes"
  on public.likes for delete to authenticated using (
    (select auth.uid()) = user_id
    and (select public.current_user_is_active())
  );

create or replace function public.set_user_banned(target_user_id uuid, should_ban boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'Only admins can ban or unban members';
  end if;

  if target_user_id = (select auth.uid()) then
    raise exception 'Admins cannot ban themselves';
  end if;

  update public.profiles
  set banned_at = case when should_ban then now() else null end
  where id = target_user_id
    and role <> 'admin';

  if not found then
    raise exception 'Member not found or cannot be banned';
  end if;
end;
$$;

revoke all on function public.set_user_banned(uuid, boolean) from public;
grant execute on function public.set_user_banned(uuid, boolean) to authenticated;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1),
      'friend'
    ),
    case
      when lower(new.email) = 'lukagg202@gmail.com' then 'admin'
      else 'member'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

insert into public.profiles (id, display_name, role)
select
  users.id,
  coalesce(
    nullif(trim(users.raw_user_meta_data ->> 'display_name'), ''),
    split_part(users.email, '@', 1),
    'friend'
  ),
  case
    when lower(users.email) = 'lukagg202@gmail.com' then 'admin'
    else 'member'
  end
from auth.users as users
on conflict (id) do nothing;

update public.profiles as profiles
set role = 'admin'
from auth.users as users
where users.id = profiles.id
  and lower(users.email) = 'lukagg202@gmail.com';
