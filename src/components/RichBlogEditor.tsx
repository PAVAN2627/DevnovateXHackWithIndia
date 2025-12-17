import { useState, useRef } from 'react';
import { Upload, Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { imageStorage } from '@/lib/imageStorage';
import { toast } from 'sonner';

interface RichBlogEditorProps {
  title: string;
  content: string;
  tags: string;
  coverImage: File | null;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onTagsChange: (tags: string) => void;
  onCoverImageChange: (image: File | null) => void;
}

export function RichBlogEditor({
  title,
  content,
  tags,
  coverImage,
  onTitleChange,
  onContentChange,
  onTagsChange,
  onCoverImageChange,
}: RichBlogEditorProps) {
  const [inlineImages, setInlineImages] = useState<{ id: string; file: File; url: string }[]>([]);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inlineFileInputRef = useRef<HTMLInputElement>(null);

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      onCoverImageChange(file);
    }
  };

  const handleInlineImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      const id = `img_${Date.now()}`;
      const url = URL.createObjectURL(file);
      
      setInlineImages(prev => [...prev, { id, file, url }]);
      
      // Insert image placeholder in content
      const placeholder = `![Image](${id})`;
      const textarea = contentRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = content.substring(0, start) + placeholder + content.substring(end);
        onContentChange(newContent);
        
        // Set cursor position after the inserted text
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
        }, 0);
      } else {
        onContentChange(content + '\n\n' + placeholder);
      }
    }
  };

  const removeInlineImage = (id: string) => {
    setInlineImages(prev => prev.filter(img => img.id !== id));
    // Remove the placeholder from content
    const placeholder = `![Image](${id})`;
    onContentChange(content.replace(placeholder, ''));
  };

  const removeCoverImage = () => {
    onCoverImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get all images for upload (cover + inline)
  const getAllImages = () => {
    const images: { type: 'cover' | 'inline'; file: File; id?: string }[] = [];
    
    if (coverImage) {
      images.push({ type: 'cover', file: coverImage });
    }
    
    inlineImages.forEach(img => {
      images.push({ type: 'inline', file: img.file, id: img.id });
    });
    
    return images;
  };

  // Process content with uploaded image URLs
  const processContentWithImages = async (uploadedImages: { id?: string; url: string; type: 'cover' | 'inline' }[]) => {
    let processedContent = content;
    
    uploadedImages.forEach(img => {
      if (img.type === 'inline' && img.id) {
        const placeholder = `![Image](${img.id})`;
        processedContent = processedContent.replace(placeholder, `![Image](${img.url})`);
      }
    });
    
    return processedContent;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <Label htmlFor="title" className="text-base font-medium">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter blog title..."
          className="bg-background border-border"
        />
      </div>

      {/* Cover Image */}
      <div>
        <Label className="text-base font-medium mb-2 block">Cover Image</Label>
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Cover Image
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverImageUpload}
            className="hidden"
          />
          
          {coverImage && (
            <div className="relative inline-block">
              <img
                src={URL.createObjectURL(coverImage)}
                alt="Cover preview"
                className="w-32 h-20 object-cover rounded border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 p-0"
                onClick={removeCoverImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content with inline image support */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="content" className="text-base font-medium">Content</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inlineFileInputRef.current?.click()}
            className="gap-2"
          >
            <Image className="h-4 w-4" />
            Add Image
          </Button>
        </div>
        
        <Textarea
          ref={contentRef}
          id="content"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Write your blog content... Use ![Image](id) placeholders for images."
          className="bg-background border-border min-h-[300px]"
        />
        
        <input
          ref={inlineFileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInlineImageUpload}
          className="hidden"
        />
        
        <p className="text-xs text-muted-foreground mt-1">
          Click "Add Image" to insert images anywhere in your content. You can write around the image placeholders.
        </p>
      </div>

      {/* Inline Images Preview */}
      {inlineImages.length > 0 && (
        <div>
          <Label className="text-base font-medium mb-2 block">Inline Images</Label>
          <div className="flex flex-wrap gap-3">
            {inlineImages.map((img) => (
              <div key={img.id} className="relative">
                <img
                  src={img.url}
                  alt="Inline preview"
                  className="w-20 h-20 object-cover rounded border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0"
                  onClick={() => removeInlineImage(img.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <p className="text-xs text-center mt-1 text-muted-foreground">
                  {img.id}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      <div>
        <Label htmlFor="tags" className="text-base font-medium">Tags</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => onTagsChange(e.target.value)}
          placeholder="Enter tags separated by commas..."
          className="bg-background border-border"
        />
      </div>
    </div>
  );
}

// Export helper functions for parent component
export const uploadAllImages = async (images: { type: 'cover' | 'inline'; file: File; id?: string }[]) => {
  const uploadedImages: { id?: string; url: string; type: 'cover' | 'inline' }[] = [];
  
  for (const img of images) {
    try {
      const url = await imageStorage.uploadImage(img.file);
      uploadedImages.push({ id: img.id, url, type: img.type });
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw new Error(`Failed to upload ${img.type} image`);
    }
  }
  
  return uploadedImages;
};

export const processContentWithImageUrls = (content: string, uploadedImages: { id?: string; url: string; type: 'cover' | 'inline' }[]) => {
  let processedContent = content;
  
  uploadedImages.forEach(img => {
    if (img.type === 'inline' && img.id) {
      const placeholder = `![Image](${img.id})`;
      processedContent = processedContent.replace(placeholder, `![Image](${img.url})`);
    }
  });
  
  return processedContent;
};