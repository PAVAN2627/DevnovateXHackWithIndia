-- DevNovate X HackWithIndia Platform - Complete Database Setup
-- This migration sets up the entire database schema for the hackathon platform

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('organizer', 'participant');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  college TEXT,
  skills TEXT,
  linkedin TEXT,
  github TEXT,
  twitter TEXT,
  portfolio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'participant',
  UNIQUE(user_id, role)
);

-- Create hackathons table
CREATE TABLE public.hackathons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_deadline DATE NOT NULL,
  location TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('online', 'offline', 'hybrid')),
  max_participants INTEGER NOT NULL DEFAULT 100,
  prizes TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hackathon_participants table
CREATE TABLE public.hackathon_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(hackathon_id, user_id)
);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'link')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blogs table
CREATE TABLE public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tags TEXT[] NOT NULL DEFAULT '{}',
  likes INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create issues table
CREATE TABLE public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE SET NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create direct messages table with file attachment support
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
  attachment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_comments table
CREATE TABLE public.blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create issue_comments table
CREATE TABLE public.issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments TEXT[], -- Array of file URLs
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_likes table
CREATE TABLE public.blog_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blog_id, user_id)
);

-- Create issue_upvotes table
CREATE TABLE public.issue_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(issue_id, user_id)
);

-- Create file_attachments table for better file tracking
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

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('message', 'blog_comment', 'issue_comment', 'announcement')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  item_id UUID, -- Reference to related item (blog_id, issue_id, etc.)
  action_url TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_announcement_reads table for tracking read announcements
CREATE TABLE public.user_announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);

-- Add foreign key for direct messages attachment
ALTER TABLE public.direct_messages ADD CONSTRAINT fk_direct_messages_attachment 
  FOREIGN KEY (attachment_id) REFERENCES public.file_attachments(id) ON DELETE SET NULL;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_announcement_reads ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies (read-only for users, managed by triggers)
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Hackathons policies
CREATE POLICY "Hackathons are viewable by everyone" ON public.hackathons FOR SELECT USING (true);
CREATE POLICY "Organizers can create hackathons" ON public.hackathons FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Organizers can update own hackathons" ON public.hackathons FOR UPDATE USING (auth.uid() = organizer_id AND public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Organizers can delete own hackathons" ON public.hackathons FOR DELETE USING (auth.uid() = organizer_id AND public.has_role(auth.uid(), 'organizer'));

-- Hackathon participants policies
CREATE POLICY "Participants viewable by all authenticated" ON public.hackathon_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can register for hackathons" ON public.hackathon_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unregister from hackathons" ON public.hackathon_participants FOR DELETE USING (auth.uid() = user_id);

-- Announcements policies
CREATE POLICY "Announcements are viewable by everyone" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Organizers can create announcements" ON public.announcements FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'organizer') AND 
  EXISTS (SELECT 1 FROM public.hackathons WHERE id = hackathon_id AND organizer_id = auth.uid())
);
CREATE POLICY "Authors can update own announcements" ON public.announcements FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own announcements" ON public.announcements FOR DELETE USING (auth.uid() = author_id);

-- Chat messages policies
CREATE POLICY "Chat messages are viewable by everyone" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can send messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete own messages" ON public.chat_messages FOR DELETE USING (auth.uid() = author_id);

-- Blogs policies
CREATE POLICY "Blogs are viewable by everyone" ON public.blogs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create blogs" ON public.blogs FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update their blogs" ON public.blogs FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors and organizers can delete blogs" ON public.blogs FOR DELETE USING (
  auth.uid() = author_id OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'organizer'
  )
);

-- Issues policies
CREATE POLICY "Issues are viewable by everyone" ON public.issues FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create issues" ON public.issues FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update their issues" ON public.issues FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors and organizers can delete issues" ON public.issues FOR DELETE USING (
  auth.uid() = author_id OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'organizer'
  )
);

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
CREATE POLICY "Authors can update their blog comments" ON public.blog_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors and organizers can delete blog comments" ON public.blog_comments FOR DELETE USING (
  auth.uid() = author_id OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'organizer'
  )
);

-- Issue comments policies
CREATE POLICY "Issue comments are viewable by everyone" ON public.issue_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create issue comments" ON public.issue_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update their issue comments" ON public.issue_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors and organizers can delete issue comments" ON public.issue_comments FOR DELETE USING (
  auth.uid() = author_id OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'organizer'
  )
);

-- Blog likes policies
CREATE POLICY "Blog likes are viewable by everyone" ON public.blog_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like blogs" ON public.blog_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike blogs" ON public.blog_likes FOR DELETE USING (auth.uid() = user_id);

-- Issue upvotes policies
CREATE POLICY "Issue upvotes are viewable by everyone" ON public.issue_upvotes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upvote issues" ON public.issue_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove upvotes" ON public.issue_upvotes FOR DELETE USING (auth.uid() = user_id);

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

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (
  auth.uid() = user_id
);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (
  auth.uid() = user_id
);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (
  auth.uid() = user_id
);

-- User announcement reads policies
CREATE POLICY "Users can view their own reads" ON public.user_announcement_reads FOR SELECT USING (
  auth.uid() = user_id
);
CREATE POLICY "Users can mark announcements as read" ON public.user_announcement_reads FOR INSERT WITH CHECK (
  auth.uid() = user_id
);
CREATE POLICY "Users can update their own reads" ON public.user_announcement_reads FOR UPDATE USING (
  auth.uid() = user_id
);

-- Handle new user signup - create profile and assign role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $
DECLARE
  user_role app_role;
  user_name TEXT;
BEGIN
  -- Determine role from metadata or default to participant
  user_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'participant');
  user_name := COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1));
  
  -- Create profile
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, user_name);
  
  -- Assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$ LANGUAGE plpgsql SET search_path = public;

-- Update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_hackathons_updated_at BEFORE UPDATE ON public.hackathons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON public.blogs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON public.issues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blog_comments_updated_at BEFORE UPDATE ON public.blog_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_issue_comments_updated_at BEFORE UPDATE ON public.issue_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_file_attachments_updated_at BEFORE UPDATE ON public.file_attachments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_hackathons_organizer ON public.hackathons(organizer_id);
CREATE INDEX idx_hackathons_status ON public.hackathons(status);
CREATE INDEX idx_hackathons_created ON public.hackathons(created_at DESC);
CREATE INDEX idx_announcements_hackathon ON public.announcements(hackathon_id);
CREATE INDEX idx_announcements_author ON public.announcements(author_id);
CREATE INDEX idx_announcements_created ON public.announcements(created_at DESC);
CREATE INDEX idx_announcements_pinned ON public.announcements(is_pinned);
CREATE INDEX idx_chat_messages_hackathon ON public.chat_messages(hackathon_id);
CREATE INDEX idx_chat_messages_author ON public.chat_messages(author_id);
CREATE INDEX idx_blogs_author ON public.blogs(author_id);
CREATE INDEX idx_blogs_created ON public.blogs(created_at DESC);
CREATE INDEX idx_issues_author ON public.issues(author_id);
CREATE INDEX idx_issues_status ON public.issues(status);
CREATE INDEX idx_issues_created ON public.issues(created_at DESC);
CREATE INDEX idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX idx_direct_messages_receiver ON public.direct_messages(receiver_id);
CREATE INDEX idx_direct_messages_attachment ON public.direct_messages(attachment_id);
CREATE INDEX idx_blog_comments_blog ON public.blog_comments(blog_id);
CREATE INDEX idx_blog_comments_author ON public.blog_comments(author_id);
CREATE INDEX idx_issue_comments_issue ON public.issue_comments(issue_id);
CREATE INDEX idx_issue_comments_author ON public.issue_comments(author_id);
CREATE INDEX idx_blog_likes_blog ON public.blog_likes(blog_id);
CREATE INDEX idx_issue_upvotes_issue ON public.issue_upvotes(issue_id);
CREATE INDEX idx_file_attachments_uploader ON public.file_attachments(uploader_id);
CREATE INDEX idx_file_attachments_context ON public.file_attachments(upload_context, context_id);
CREATE INDEX idx_file_attachments_created ON public.file_attachments(created_at);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_user_announcement_reads_user ON public.user_announcement_reads(user_id);
CREATE INDEX idx_user_announcement_reads_announcement ON public.user_announcement_reads(announcement_id);

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blog_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_attachments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('hackathon-images', 'hackathon-images', true),
  ('message-attachments', 'message-attachments', true),
  ('user-avatars', 'user-avatars', true),
  ('blog-images', 'blog-images', true),
  ('hackathon-media', 'hackathon-media', true),
  ('issue-attachments', 'issue-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for hackathon images
CREATE POLICY "Hackathon images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'hackathon-images');
CREATE POLICY "Organizers can upload hackathon images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hackathon-images' AND public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Organizers can update hackathon images" ON storage.objects FOR UPDATE USING (bucket_id = 'hackathon-images' AND public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Organizers can delete hackathon images" ON storage.objects FOR DELETE USING (bucket_id = 'hackathon-images' AND public.has_role(auth.uid(), 'organizer'));

-- Storage policies for message attachments
CREATE POLICY "Message attachments public access" ON storage.objects FOR SELECT USING (bucket_id = 'message-attachments');
CREATE POLICY "Authenticated users can upload message attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own message attachments" ON storage.objects FOR UPDATE USING (bucket_id = 'message-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own message attachments" ON storage.objects FOR DELETE USING (bucket_id = 'message-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for user avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'user-avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'user-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies for blog images
CREATE POLICY "Blog images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'blog-images');
CREATE POLICY "Authenticated users can upload blog images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'blog-images');
CREATE POLICY "Users can update blog images they uploaded" ON storage.objects FOR UPDATE USING (bucket_id = 'blog-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete blog images they uploaded" ON storage.objects FOR DELETE USING (bucket_id = 'blog-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies for hackathon media
CREATE POLICY "Hackathon media is publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'hackathon-media');
CREATE POLICY "Organizers can upload hackathon media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hackathon-media' AND public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Organizers can update hackathon media" ON storage.objects FOR UPDATE USING (bucket_id = 'hackathon-media' AND public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Organizers can delete hackathon media" ON storage.objects FOR DELETE USING (bucket_id = 'hackathon-media' AND public.has_role(auth.uid(), 'organizer'));

-- Storage policies for issue attachments
CREATE POLICY "Issue attachments public access" ON storage.objects FOR SELECT USING (bucket_id = 'issue-attachments');
CREATE POLICY "Authenticated users can upload issue attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'issue-attachments' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own issue attachments" ON storage.objects FOR UPDATE USING (bucket_id = 'issue-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own issue attachments" ON storage.objects FOR DELETE USING (bucket_id = 'issue-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Utility functions
-- Function to clean up orphaned files
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_files()
RETURNS INTEGER AS $
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
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get storage usage by user
CREATE OR REPLACE FUNCTION public.get_user_storage_usage(user_id UUID)
RETURNS TABLE (
  total_files INTEGER,
  total_size BIGINT,
  size_by_context JSONB
) AS $
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
$ LANGUAGE plpgsql SECURITY DEFINER;

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
RETURNS UUID AS $
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
$ LANGUAGE plpgsql SECURITY DEFINER;