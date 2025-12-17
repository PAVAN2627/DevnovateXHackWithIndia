-- Fix notification policies to allow proper notification creation

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a new policy that allows authenticated users to create notifications
CREATE POLICY "Authenticated users can create notifications" ON public.notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Also ensure the policy allows service role (for system notifications)
CREATE POLICY "Service role can create notifications" ON public.notifications 
FOR INSERT 
TO service_role 
WITH CHECK (true);