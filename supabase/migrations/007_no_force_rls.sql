-- service_role must bypass RLS; FORCE was incorrectly enabled
begin;

alter table public.lotteries no force row level security;
alter table public.prize_logs no force row level security;
alter table public.users    no force row level security;

commit;
