-- Fix blog likes synchronization issue
-- The problem: blog_likes table has data but blogs.likes count is wrong
-- Run this in Supabase SQL Editor

-- Step 1: Disable RLS on blog_likes (if not already done)
ALTER TABLE public.blog_likes DISABLE ROW LEVEL SECURITY;

-- Step 2: Sync all blog like counts with actual data
UPDATE public.blogs 
SET likes = (
  SELECT COUNT(*) 
  FROM public.blog_likes 
  WHERE blog_likes.blog_id = blogs.id
);

-- Step 3: Verify the sync worked
SELECT 
  b.id,
  b.title,
  b.likes as blog_count,
  (SELECT COUNT(*) FROM public.blog_likes bl WHERE bl.blog_id = b.id) as actual_count
FROM public.blogs b
ORDER BY b.created_at DESC
LIMIT 10;