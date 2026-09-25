-- Storage buckets for listing photos and profile photos.
-- Path convention enforced by policy: "<user_id>/<filename>".

insert into storage.buckets (id, name, public, file_size_limit)
values ('listing-photos', 'listing-photos', true, 10485760)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit)
values ('profile-photos', 'profile-photos', true, 5242880)
on conflict (id) do nothing;

create policy "listing photos are publicly readable"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'listing-photos');

create policy "authenticated users can upload their own listing photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'listing-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "profile photos are publicly readable"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'profile-photos');

create policy "users can upload their own profile photo"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "users can update their own profile photo"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
