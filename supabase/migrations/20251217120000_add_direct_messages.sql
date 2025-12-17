-- Add direct messages table with file attachment support
CREATE TABLE public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'document', 'audio')),
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add comments tables with attachment support
CREATE TABLE public.blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments TEXT[], -- Array of file URLs
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_comments ENABLE ROW LEVEL SECURITY;

-- Direct messages policies
CREATE POLICY "Users can view their own messages" ON public.direct_messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

CREATE POLICY "Users can send messages" ON public.direct_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);

CREATE POLICY "Users can update their own messages" ON public.direct_messages FOR UPDATE USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Blog comments policies
CREATE POLICY "Blog comments are viewable by everyone" ON public.blog_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create blog comments" ON public.blog_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own blog comments" ON public.blog_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users and organizers can delete blog comments" ON public.blog_comments FOR DELETE USING (
  auth.uid() = author_id OR public.has_role(auth.uid(), 'organizer')
);

-- Issue comments policies
CREATE POLICY "Issue comments are viewable by everyone" ON public.issue_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create issue comments" ON public.issue_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own issue comments" ON public.issue_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users and organizers can delete issue comments" ON public.issue_comments FOR DELETE USING (
  auth.uid() = author_id OR public.has_role(auth.uid(), 'organizer')
);

-- Enable realtime for direct messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blog_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_comments;

-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('message-attachments', 'message-attachments', false);

-- Storage policies for message attachments
CREATE POLICY "Users can view their own message attachments" ON storage.objects FOR SELECT USING (
  bucket_id = 'message-attachments' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload message attachments" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'message-attachments' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own message attachments" ON storage.objects FOR UPDATE USING (
  bucket_id = 'message-attachments' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own message attachments" ON storage.objects FOR DELETE USING (
  bucket_id = 'message-attachments' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Update timestamp triggers
CREATE TRIGGER update_blog_comments_updated_at BEFORE UPDATE ON public.blog_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_issue_comments_updated_at BEFORE UPDATE ON public.issue_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();