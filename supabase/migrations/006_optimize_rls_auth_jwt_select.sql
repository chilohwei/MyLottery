begin;

drop policy if exists users_select_own on public.users;
create policy users_select_own
on public.users
for select
to authenticated
using (id = ((select auth.jwt()) ->> 'sub'));

drop policy if exists lotteries_select_own on public.lotteries;
drop policy if exists lotteries_insert_own on public.lotteries;
drop policy if exists lotteries_update_own on public.lotteries;
drop policy if exists lotteries_delete_own on public.lotteries;

create policy lotteries_select_own
on public.lotteries
for select
to authenticated
using (clerk_user_id = ((select auth.jwt()) ->> 'sub'));

create policy lotteries_insert_own
on public.lotteries
for insert
to authenticated
with check (clerk_user_id = ((select auth.jwt()) ->> 'sub'));

create policy lotteries_update_own
on public.lotteries
for update
to authenticated
using (clerk_user_id = ((select auth.jwt()) ->> 'sub'))
with check (clerk_user_id = ((select auth.jwt()) ->> 'sub'));

create policy lotteries_delete_own
on public.lotteries
for delete
to authenticated
using (clerk_user_id = ((select auth.jwt()) ->> 'sub'));

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
      and l.clerk_user_id = ((select auth.jwt()) ->> 'sub')
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
      and l.clerk_user_id = ((select auth.jwt()) ->> 'sub')
  )
);

commit;
