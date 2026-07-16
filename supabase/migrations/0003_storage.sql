-- Praeko — private storage bucket for brand assets (logo, photos, videos).
-- Objects are stored under `${business_id}/...`; RLS on storage.objects
-- reuses is_business_member() by reading the first path segment as the
-- business id, so a business's files are only visible to its own members.

insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', false)
on conflict (id) do nothing;

create policy "brand_assets_storage_select" on storage.objects for select
  to authenticated
  using (
    bucket_id = 'brand-assets'
    and is_business_member(((storage.foldername(name))[1])::uuid)
  );

create policy "brand_assets_storage_insert" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'brand-assets'
    and is_business_member(((storage.foldername(name))[1])::uuid)
  );

create policy "brand_assets_storage_update" on storage.objects for update
  to authenticated
  using (
    bucket_id = 'brand-assets'
    and is_business_member(((storage.foldername(name))[1])::uuid)
  );

create policy "brand_assets_storage_delete" on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'brand-assets'
    and is_business_member(((storage.foldername(name))[1])::uuid)
  );
