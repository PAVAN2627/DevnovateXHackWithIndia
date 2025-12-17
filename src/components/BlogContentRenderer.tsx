import { LinkRenderer } from '@/lib/linkDetector';

interface BlogContentRendererProps {
  content: string;
  className?: string;
}

export function BlogContentRenderer({ content, className = '' }: BlogContentRendererProps) {
  // Simple markdown-like renderer for blog content
  const renderContent = (text: string) => {
    // Split content by lines
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    
    lines.forEach((line, index) => {
      // Check if line is an image
      const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      
      if (imageMatch) {
        const [, alt, src] = imageMatch;
        elements.push(
          <div key={index} className="my-4 rounded-lg overflow-hidden">
            <img 
              src={src} 
              alt={alt || 'Blog image'} 
              className="w-full h-auto max-h-96 object-contain bg-muted/50"
              loading="lazy"
            />
          </div>
        );
      } else if (line.trim()) {
        // Regular text line
        elements.push(
          <p key={index} className="mb-4 last:mb-0">
            <LinkRenderer text={line} />
          </p>
        );
      } else {
        // Empty line - add spacing
        elements.push(<br key={index} />);
      }
    });
    
    return elements;
  };

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      {renderContent(content)}
    </div>
  );
}