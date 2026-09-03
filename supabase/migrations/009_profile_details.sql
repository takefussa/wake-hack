-- Share a short profile bio and a private profile image between authenticated users.

alter table public.profiles
  add column if not exists bio text,
  add column if not exists profile_image_path text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_bio_length_check'
  ) then
    alter table public.profiles
      add constraint profiles_bio_length_check
      check (bio is null or char_length(bio) <= 80);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_image_path_owner_check'
  ) then
    alter table public.profiles
      add constraint profiles_image_path_owner_check
      check (
        profile_image_path is null
        or profile_image_path like id::text || '/%'
      );
  end if;
end
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload their own profile images" on storage.objects;
create policy "Users can upload their own profile images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Authenticated users can read profile images" on storage.objects;
create policy "Authenticated users can read profile images"
on storage.objects
for select
to authenticated
using (bucket_id = 'profile-images');

drop policy if exists "Users can remove their own profile images" on storage.objects;
create policy "Users can remove their own profile images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-images'
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
