-- schedules 테이블에 컬럼 추가
alter table public.schedules
  add column if not exists location text,
  add column if not exists requester_name text,
  add column if not exists guest_collaborators text[] not null default '{}';

-- schedule_requests 테이블에 컬럼 추가
alter table public.schedule_requests
  add column if not exists location text,
  add column if not exists guest_collaborators text[] not null default '{}';
