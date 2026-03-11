-- is_admin 컬럼 추가
alter table public.users
  add column if not exists is_admin boolean not null default false;

-- ─────────────────────────────────────────────
-- 확정 일정 테이블 (관리자가 등록하거나 요청을 수락한 일정)
-- ─────────────────────────────────────────────
create table public.schedules (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  date          date not null,
  start_block   smallint not null,  -- 0-47 (0=00:00, 1=00:30, ..., 47=23:30)
  end_block     smallint not null,  -- exclusive upper bound
  created_by    uuid references public.users(id) on delete set null,
  collaborators uuid[] not null default '{}',
  notes         text,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null,
  constraint valid_blocks check (start_block >= 0 and end_block <= 48 and start_block < end_block)
);

alter table public.schedules enable row level security;

create policy "Anyone can view schedules"
  on public.schedules for select
  using (true);

create policy "Admins can manage schedules"
  on public.schedules for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and is_admin = true
    )
  );

-- ─────────────────────────────────────────────
-- 요청 큐 테이블 (회원/비회원 모두 요청 가능)
-- ─────────────────────────────────────────────
create table public.schedule_requests (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  date                date not null,
  start_block         smallint not null,
  end_block           smallint not null,
  requester_user_id   uuid references public.users(id) on delete set null,  -- null = 비회원
  requester_name      text not null,
  requester_email     text,                 -- 회원만 저장, 비회원은 null
  collaborators       uuid[] not null default '{}',
  notes               text,
  status              text not null default 'pending'
                        check (status in ('pending', 'accepted', 'rejected')),
  admin_note          text,
  created_at          timestamptz default now() not null,
  updated_at          timestamptz default now() not null,
  constraint valid_blocks check (start_block >= 0 and end_block <= 48 and start_block < end_block)
);

alter table public.schedule_requests enable row level security;

create policy "Anyone can view requests"
  on public.schedule_requests for select
  using (true);

create policy "Anyone can submit request"
  on public.schedule_requests for insert
  with check (true);

create policy "Admins can update requests"
  on public.schedule_requests for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Requester or admin can delete"
  on public.schedule_requests for delete
  using (
    requester_user_id = auth.uid()
    or exists (
      select 1 from public.users
      where id = auth.uid() and is_admin = true
    )
  );

-- ─────────────────────────────────────────────
-- updated_at 자동 갱신 트리거
-- ─────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_schedules_updated_at
  before update on public.schedules
  for each row execute procedure public.handle_updated_at();

create trigger set_requests_updated_at
  before update on public.schedule_requests
  for each row execute procedure public.handle_updated_at();
