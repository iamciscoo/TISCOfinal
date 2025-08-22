-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure storage buckets exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'product_images') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('product_images', 'product_images', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'user_avatars') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('user_avatars', 'user_avatars', false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'order_attachments') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('order_attachments', 'order_attachments', false);
  END IF;
END $$;

-- Storage policies
-- Public read for product images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read product_images'
  ) THEN
    CREATE POLICY "Public read product_images" ON storage.objects
      FOR SELECT USING (bucket_id = 'product_images');
  END IF;
END $$;

-- Private per-user access for user_avatars (objects stored under `${user_id}/...`)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'User manage own avatars'
  ) THEN
    CREATE POLICY "User manage own avatars" ON storage.objects
      FOR ALL USING (
        bucket_id = 'user_avatars' AND name LIKE auth.uid()::text || '/%'
      ) WITH CHECK (
        bucket_id = 'user_avatars' AND name LIKE auth.uid()::text || '/%'
      );
  END IF;
END $$;

-- Private per-user access for order_attachments (objects stored under `${user_id}/...`)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'User manage own order attachments'
  ) THEN
    CREATE POLICY "User manage own order attachments" ON storage.objects
      FOR ALL USING (
        bucket_id = 'order_attachments' AND name LIKE auth.uid()::text || '/%'
      ) WITH CHECK (
        bucket_id = 'order_attachments' AND name LIKE auth.uid()::text || '/%'
      );
  END IF;
END $$;
