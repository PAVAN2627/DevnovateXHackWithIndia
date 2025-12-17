-- Enhanced file storage and management system
-- Add file metadata table for better tracking
CREATE TABLE public.file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  thumbnail_url TEXT, -- For images/videos
  upload_context TEXT NOT NULL CHECK (upload_context IN ('message', 'blog', 'issue', 'profile', 'hackathon')),
  context_id UUID, -- Reference to the related entity
  is_processed BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}', -- Additional file metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_file_attachments_uploader ON public.file_attachments(uploader_id);
CREATE INDEX idx_file_attachments_context ON public.file_attachments(upload_context, context_id);
CREATE INDEX idx_file_attachments_created ON public.file_attachments(created_at);

-- Enable RLS
ALTER TABLE public.file_attachments ENABLE ROW LEVEL SECURITY;

-- File attachments policies
CREATE POLICY "Users can view files they uploaded" ON public.file_attachments FOR SELECT USING (
  auth.uid() = uploader_id
);

CREATE POLICY "Users can view public files in their conversations" ON public.file_attachments FOR SELECT USING (
  upload_context = 'message' AND 
  EXISTS (
    SELECT 1 FROM public.direct_messages dm 
    WHERE dm.id = context_id 
    AND (dm.sender_id = auth.uid() OR dm.receiver_id = auth.uid())
  )
);

CREATE POLICY "Users can view public blog/issue files" ON public.file_attachments FOR SELECT USING (
  upload_context IN ('blog', 'issue', 'hackathon')
);

CREATE POLICY "Users can upload files" ON public.file_attachments FOR INSERT WITH CHECK (
  auth.uid() = uploader_id
);

CREATE POLICY "Users can update their own files" ON public.file_attachments FOR UPDATE USING (
  auth.uid() = uploader_id
);

CREATE POLICY "Users can delete their own files" ON public.file_attachments FOR DELETE USING (
  auth.uid() = uploader_id
);

-- Create additional storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('user-avatars', 'user-avatars', true),
  ('blog-images', 'blog-images', true),
  ('hackathon-media', 'hackathon-media', true),
  ('issue-attachments', 'issue-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user avatars (public)
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (
  bucket_id = 'user-avatars'
);

CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (
  bucket_id = 'user-avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (
  bucket_id = 'user-avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policies for blog images (public)
CREATE POLICY "Blog images are publicly accessible" ON storage.objects FOR SELECT USING (
  bucket_id = 'blog-images'
);

CREATE POLICY "Authenticated users can upload blog images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'blog-images'
);

CREATE POLICY "Users can update blog images they uploaded" ON storage.objects FOR UPDATE USING (
  bucket_id = 'blog-images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete blog images they uploaded" ON storage.objects FOR DELETE USING (
  bucket_id = 'blog-images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policies for hackathon media (public)
CREATE POLICY "Hackathon media is publicly accessible" ON storage.objects FOR SELECT USING (
  bucket_id = 'hackathon-media'
);

CREATE POLICY "Organizers can upload hackathon media" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'hackathon-media' AND 
  public.has_role(auth.uid(), 'organizer')
);

CREATE POLICY "Organizers can update hackathon media" ON storage.objects FOR UPDATE USING (
  bucket_id = 'hackathon-media' AND 
  public.has_role(auth.uid(), 'organizer')
);

CREATE POLICY "Organizers can delete hackathon media" ON storage.objects FOR DELETE USING (
  bucket_id = 'hackathon-media' AND 
  public.has_role(auth.uid(), 'organizer')
);

-- Storage policies for issue attachments (private)
CREATE POLICY "Users can view issue attachments" ON storage.objects FOR SELECT USING (
  bucket_id = 'issue-attachments'
);

CREATE POLICY "Authenticated users can upload issue attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'issue-attachments'
);

CREATE POLICY "Users can update issue attachments they uploaded" ON storage.objects FOR UPDATE USING (
  bucket_id = 'issue-attachments' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete issue attachments they uploaded" ON storage.objects FOR DELETE USING (
  bucket_id = 'issue-attachments' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Function to clean up orphaned files
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_files()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete file records that are older than 30 days and not referenced
  DELETE FROM public.file_attachments 
  WHERE created_at < NOW() - INTERVAL '30 days'
  AND upload_context = 'message'
  AND NOT EXISTS (
    SELECT 1 FROM public.direct_messages dm 
    WHERE dm.id = context_id
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get storage usage by user
CREATE OR REPLACE FUNCTION public.get_user_storage_usage(user_id UUID)
RETURNS TABLE (
  total_files INTEGER,
  total_size BIGINT,
  size_by_context JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_files,
    COALESCE(SUM(file_size), 0)::BIGINT as total_size,
    COALESCE(
      jsonb_object_agg(
        upload_context, 
        jsonb_build_object(
          'count', context_count,
          'size', context_size
        )
      ), 
      '{}'::jsonb
    ) as size_by_context
  FROM (
    SELECT 
      upload_context,
      COUNT(*) as context_count,
      SUM(file_size) as context_size
    FROM public.file_attachments 
    WHERE uploader_id = user_id
    GROUP BY upload_context
  ) context_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for updated_at
CREATE TRIGGER update_file_attachments_updated_at 
  BEFORE UPDATE ON public.file_attachments 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for file attachments
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_attachments;

-- Add file attachment reference to direct messages
ALTER TABLE public.direct_messages ADD COLUMN attachment_id UUID REFERENCES public.file_attachments(id) ON DELETE SET NULL;

-- Update direct messages to use attachment system
CREATE INDEX idx_direct_messages_attachment ON public.direct_messages(attachment_id);

-- Function to create message with attachment
CREATE OR REPLACE FUNCTION public.create_message_with_attachment(
  p_sender_id UUID,
  p_receiver_id UUID,
  p_content TEXT,
  p_message_type TEXT DEFAULT 'text',
  p_file_name TEXT DEFAULT NULL,
  p_file_type TEXT DEFAULT NULL,
  p_file_size INTEGER DEFAULT NULL,
  p_storage_path TEXT DEFAULT NULL,
  p_public_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  attachment_id UUID;
  message_id UUID;
BEGIN
  -- Create file attachment if file data provided
  IF p_file_name IS NOT NULL THEN
    INSERT INTO public.file_attachments (
      uploader_id, file_name, file_type, file_size, 
      storage_path, public_url, upload_context
    ) VALUES (
      p_sender_id, p_file_name, p_file_type, p_file_size,
      p_storage_path, p_public_url, 'message'
    ) RETURNING id INTO attachment_id;
  END IF;

  -- Create message
  INSERT INTO public.direct_messages (
    sender_id, receiver_id, content, message_type,
    file_url, file_name, file_size, file_type, attachment_id
  ) VALUES (
    p_sender_id, p_receiver_id, p_content, p_message_type,
    p_public_url, p_file_name, p_file_size, p_file_type, attachment_id
  ) RETURNING id INTO message_id;

  -- Update attachment with context_id
  IF attachment_id IS NOT NULL THEN
    UPDATE public.file_attachments 
    SET context_id = message_id 
    WHERE id = attachment_id;
  END IF;

  RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;