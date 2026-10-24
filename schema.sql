-- =====================================================================
-- WiniD Hub · database setup for Supabase
-- Run this whole file once in Supabase → SQL Editor → New query → Run.
-- Then run seed.sql to load the classes, styles, places and settings.
-- =====================================================================

-- ---------- Profiles: links each login to a role and a student ----------
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'student' check (role in ('student','admin')),
  student_id text,
  created_at timestamptz not null default now()
);

-- A profile row is created automatically for every new login.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers used by the security rules below.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where user_id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_student_id()
returns text language sql stable security definer set search_path = public as $$
  select student_id from public.profiles where user_id = auth.uid();
$$;

-- ---------- Tables ----------
-- Every table keeps the app's record in a JSON "data" column, plus the
-- columns the security rules need (student_id, phone_digits, user_id).

-- Public reference data: anyone can read, only the admin can change.
create table if not exists public.styles    (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.locations (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.plans     (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.batches   (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.cancels   (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.settings  (id text primary key, data jsonb not null, updated_at timestamptz not null default now());

-- Admin-only working data (reminder log etc.).
create table if not exists public.admin_state (id text primary key, data jsonb not null, updated_at timestamptz not null default now());

-- Students and their own records.
create table if not exists public.students (
  id           text primary key,
  data         jsonb not null,
  phone_digits text unique,
  user_id      uuid unique references auth.users(id) on delete set null,
  updated_at   timestamptz not null default now()
);
create table if not exists public.enrollments (id text primary key, data jsonb not null, student_id text, updated_at timestamptz not null default now());
create table if not exists public.payments    (id text primary key, data jsonb not null, student_id text, updated_at timestamptz not null default now());
create table if not exists public.txns        (id text primary key, data jsonb not null, student_id text, updated_at timestamptz not null default now());
create table if not exists public.attendance  (id text primary key, data jsonb not null, student_id text, updated_at timestamptz not null default now());
create table if not exists public.enquiries   (id text primary key, data jsonb not null, student_id text, updated_at timestamptz not null default now());
create table if not exists public.wa_out      (id text primary key, data jsonb not null, student_id text, updated_at timestamptz not null default now());

create index if not exists enrollments_student_idx on public.enrollments(student_id);
create index if not exists payments_student_idx    on public.payments(student_id);
create index if not exists txns_student_idx        on public.txns(student_id);
create index if not exists attendance_student_idx  on public.attendance(student_id);
create index if not exists enquiries_student_idx   on public.enquiries(student_id);

-- ---------- Security rules (Row Level Security) ----------
alter table public.profiles    enable row level security;
alter table public.styles      enable row level security;
alter table public.locations   enable row level security;
alter table public.plans       enable row level security;
alter table public.batches     enable row level security;
alter table public.cancels     enable row level security;
alter table public.settings    enable row level security;
alter table public.admin_state enable row level security;
alter table public.students    enable row level security;
alter table public.enrollments enable row level security;
alter table public.payments    enable row level security;
alter table public.txns        enable row level security;
alter table public.attendance  enable row level security;
alter table public.enquiries   enable row level security;
alter table public.wa_out      enable row level security;

-- Profiles: you can read your own; the admin can read and change all.
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "admin edits profiles" on public.profiles;
create policy "admin edits profiles" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

-- Reference tables: everyone reads, admin writes.
do $$
declare t text;
begin
  foreach t in array array['styles','locations','plans','batches','cancels','settings'] loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "admin write" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Admin-only state.
drop policy if exists "admin only" on public.admin_state;
create policy "admin only" on public.admin_state for all using (public.is_admin()) with check (public.is_admin());

-- Students: a student sees and edits only their own profile; admin sees all.
drop policy if exists "read own student" on public.students;
create policy "read own student" on public.students for select using (public.is_admin() or user_id = auth.uid());
drop policy if exists "update own student" on public.students;
create policy "update own student" on public.students for update using (public.is_admin() or user_id = auth.uid()) with check (public.is_admin() or user_id = auth.uid());
drop policy if exists "admin adds students" on public.students;
create policy "admin adds students" on public.students for insert with check (public.is_admin());
drop policy if exists "admin deletes students" on public.students;
create policy "admin deletes students" on public.students for delete using (public.is_admin());

-- Shared pattern for student-owned tables: read own, admin does everything.
do $$
declare t text;
begin
  foreach t in array array['enrollments','payments','txns','attendance','enquiries','wa_out'] loop
    execute format('drop policy if exists "read own" on public.%I', t);
    execute format('create policy "read own" on public.%I for select using (public.is_admin() or (student_id is not null and student_id = public.my_student_id()))', t);
    execute format('drop policy if exists "admin all" on public.%I', t);
    execute format('create policy "admin all" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Students may send a join request (pending only).
drop policy if exists "student requests class" on public.enrollments;
create policy "student requests class" on public.enrollments for insert
  with check (student_id = public.my_student_id() and data->>'status' = 'pending');

-- Students may create their own dues and mark them as paid-for-checking, never as paid.
drop policy if exists "student adds dues" on public.payments;
create policy "student adds dues" on public.payments for insert
  with check (student_id = public.my_student_id() and data->>'status' = 'due');
drop policy if exists "student pays" on public.payments;
create policy "student pays" on public.payments for update
  using (student_id = public.my_student_id() and data->>'status' in ('due','pending'))
  with check (student_id = public.my_student_id() and data->>'status' in ('due','pending'));

-- Students record their own payment references.
drop policy if exists "student adds txn" on public.txns;
create policy "student adds txn" on public.txns for insert
  with check (student_id = public.my_student_id());

-- Anyone (even without an account) can send an enquiry and its WhatsApp reply.
drop policy if exists "anyone enquires" on public.enquiries;
create policy "anyone enquires" on public.enquiries for insert
  with check (student_id is null or student_id = public.my_student_id());
drop policy if exists "anyone queues whatsapp" on public.wa_out;
create policy "anyone queues whatsapp" on public.wa_out for insert
  with check (student_id is null or student_id = public.my_student_id());

-- ---------- Functions the app calls ----------

-- New student signs up: create their student record and link it to the login.
create or replace function public.register_student(new_id text, profile jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare d text := right(regexp_replace(coalesce(profile->>'phone',''), '\D', '', 'g'), 10);
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  if length(d) <> 10 then raise exception 'Enter a 10-digit mobile number.'; end if;
  if exists(select 1 from students where phone_digits = d) then
    raise exception 'An account with this phone number already exists. Sign in, or use "Set up your password".';
  end if;
  insert into students(id, data, phone_digits, user_id) values (new_id, profile, d, auth.uid());
  update profiles set student_id = new_id where user_id = auth.uid();
  return new_id;
end $$;

-- Student the studio already added sets up a login: link it by phone number.
create or replace function public.claim_student(phone text)
returns text language plpgsql security definer set search_path = public as $$
declare d text := right(regexp_replace(coalesce(phone,''), '\D', '', 'g'), 10); sid text;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  select id into sid from students where phone_digits = d and user_id is null;
  if sid is null then raise exception 'No student without a login was found for this phone number.'; end if;
  update students set user_id = auth.uid() where id = sid;
  update profiles set student_id = sid where user_id = auth.uid();
  return sid;
end $$;

-- Seats taken per batch, so students see "seats left" without seeing other students.
create or replace function public.batch_counts()
returns table(batch_id text, n bigint) language sql stable security definer set search_path = public as $$
  select data->>'batchId', count(*) from enrollments where data->>'status' = 'active' group by 1;
$$;

grant execute on function public.register_student(text, jsonb) to authenticated;
grant execute on function public.claim_student(text) to authenticated;
grant execute on function public.batch_counts() to anon, authenticated;

-- ---------- Make yourself the admin ----------
-- 1. In Supabase → Authentication → Users → Add user, create your login
--    (your email + a strong password, tick "Auto confirm user").
-- 2. Run this line with your email:
--    update public.profiles set role = 'admin'
--      where user_id = (select id from auth.users where email = 'you@example.com');
