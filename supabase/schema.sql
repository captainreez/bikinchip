-- bikinchip: tabel progres per pengguna untuk sinkron antarperangkat.
-- Jalankan sekali di Supabase: Dashboard → SQL Editor → New query → tempel → Run.

create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint progress_ukuran check (pg_column_size(data) < 2000000)   -- batas ~2 MB per pengguna
);

-- Row Level Security: setiap orang hanya bisa membaca dan menulis barisnya sendiri.
alter table public.progress enable row level security;

drop policy if exists "progres: baca milik sendiri"  on public.progress;
drop policy if exists "progres: tambah milik sendiri" on public.progress;
drop policy if exists "progres: ubah milik sendiri"  on public.progress;
drop policy if exists "progres: hapus milik sendiri" on public.progress;

create policy "progres: baca milik sendiri"  on public.progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "progres: tambah milik sendiri" on public.progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "progres: ubah milik sendiri"  on public.progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "progres: hapus milik sendiri" on public.progress for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.progress to authenticated;
revoke all on public.progress from anon;
