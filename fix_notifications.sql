-- Quick fix for notification RLS policy
-- Run this in your Supabase SQL editor

-- Drop the existing policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a new policy that allows authenticated users to create notifications
CREATE POLICY "Authenticated users can create notifications" ON public.notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (true);