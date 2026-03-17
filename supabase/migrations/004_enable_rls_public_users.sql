begin;

alter table public.users enable row level security;
alter table public.users force row level security;

revoke all on table public.users from anon;
revoke all on table public.users from authenticated;

drop policy if exists users_select_own on public.users;

create policy users_select_own
on public.users
for select
to authenticated
using (id = auth.jwt() ->> 'sub');

grant select on table public.users to authenticated;

commit;
