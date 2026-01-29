-- Fix word-audio storage bucket and policies
-- Issue: Storage path used childId but policy expected userId, and bucket was private

-- Make the bucket public so getPublicUrl() works for playback
UPDATE storage.buckets
SET public = true
WHERE id = 'word-audio';

-- Drop the old policies that used incorrect path assumptions
DROP POLICY IF EXISTS "Users can upload word audio recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their word audio recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their word audio recordings" ON storage.objects;

-- Create new policies with correct path structure: userId/childId/wordId/filename
-- Users can upload to their own folder
CREATE POLICY "Users can upload word audio recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'word-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view files in their own folder
CREATE POLICY "Users can view their word audio recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'word-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete files in their own folder
CREATE POLICY "Users can delete their word audio recordings"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'word-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Since bucket is now public, anyone can read via public URL (for child playback)
-- But only authenticated owners can upload/delete via the policies above
