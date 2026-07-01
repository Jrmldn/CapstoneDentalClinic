drop policy if exists "Allow dentists and superadmins to upload medical photos" on storage.objects;

create policy "Allow dentists, staff, and superadmins to upload medical photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'medical_photos'
  and (select users.role from users where users.id = auth.uid()) = any (array['dentist'::user_role, 'staff'::user_role, 'superadmin'::user_role])
);
