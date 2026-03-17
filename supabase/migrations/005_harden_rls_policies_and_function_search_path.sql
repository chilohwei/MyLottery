begin;

alter table public.lotteries force row level security;
alter table public.prize_logs force row level security;

revoke all on table public.lotteries from anon;
revoke all on table public.lotteries from authenticated;
revoke all on table public.prize_logs from anon;
revoke all on table public.prize_logs from authenticated;

drop policy if exists lotteries_select_own on public.lotteries;
drop policy if exists lotteries_insert_own on public.lotteries;
drop policy if exists lotteries_update_own on public.lotteries;
drop policy if exists lotteries_delete_own on public.lotteries;

create policy lotteries_select_own
on public.lotteries
for select
to authenticated
using (clerk_user_id = auth.jwt() ->> 'sub');

create policy lotteries_insert_own
on public.lotteries
for insert
to authenticated
with check (clerk_user_id = auth.jwt() ->> 'sub');

create policy lotteries_update_own
on public.lotteries
for update
to authenticated
using (clerk_user_id = auth.jwt() ->> 'sub')
with check (clerk_user_id = auth.jwt() ->> 'sub');

create policy lotteries_delete_own
on public.lotteries
for delete
to authenticated
using (clerk_user_id = auth.jwt() ->> 'sub');

drop policy if exists prize_logs_select_for_owned_lottery on public.prize_logs;
drop policy if exists prize_logs_insert_for_owned_lottery on public.prize_logs;

create policy prize_logs_select_for_owned_lottery
on public.prize_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.lotteries l
    where l.id = prize_logs.lottery_id
      and l.clerk_user_id = auth.jwt() ->> 'sub'
  )
);

create policy prize_logs_insert_for_owned_lottery
on public.prize_logs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.lotteries l
    where l.id = prize_logs.lottery_id
      and l.clerk_user_id = auth.jwt() ->> 'sub'
  )
);

grant select, insert, update, delete on table public.lotteries to authenticated;
grant select, insert on table public.prize_logs to authenticated;

alter function public.increment_view_count(text) set search_path = public, pg_temp;
alter function public.update_updated_at() set search_path = public, pg_temp;

commit;
