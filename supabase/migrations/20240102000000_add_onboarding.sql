-- onboarded 컬럼 추가
alter table public.users
  add column if not exists onboarded boolean not null default false;

-- avatars 스토리지 버킷 생성
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 본인 폴더에만 업로드 가능
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 본인 아바타 수정 가능
create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 누구나 아바타 조회 가능
create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- 본인 아바타 삭제 가능
create policy "Users can delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
