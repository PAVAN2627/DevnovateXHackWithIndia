import React from 'react';

/**
 * Detects URLs in text and converts them to clickable links
 * Supports http://, https://, www., and common domain patterns
 */
export function detectAndRenderLinks(text: string, isOwnMessage: boolean = false): React.ReactNode[] {
  if (!text) return [];

  // Enhanced regex to match common URL patterns
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+|www\.[^\s<>"{}|\\^`[\]]+|[a-zA-Z0-9][a-zA-Z0-9-]*\.(com|org|net|edu|gov|io|ai|app|dev|tech|info|co\.uk|co\.in|in|ly|me|cc|tv|fm|tk|ml|ga|cf)(?:\/[^\s<>"{}|\\^`[\]]*)?)/gi;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // Create a new regex instance for iteration
  const regex = new RegExp(urlRegex);

  while ((match = regex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Extract the URL
    let url = match[0];
    
    // Add https:// prefix if it doesn't have a protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Style links based on message type for better visibility
    const linkClasses = isOwnMessage 
      ? "text-white hover:text-gray-200 hover:underline break-all font-medium underline decoration-white/60"
      : "text-blue-600 hover:text-blue-800 hover:underline break-all font-medium underline decoration-blue-600/60";

    // Add the clickable link with better contrast
    parts.push(
      <a
        key={`link-${match.index}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClasses}
      >
        {match[0]}
      </a>
    );

    lastIndex = regex.lastIndex;
  }

  // Add remaining text after the last URL
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no URLs found, return the original text
  return parts.length === 0 ? [text] : parts;
}

/**
 * Component that renders text with clickable links
 */
export function LinkRenderer({ 
  text, 
  className = '', 
  isOwnMessage = false 
}: { 
  text: string; 
  className?: string;
  isOwnMessage?: boolean;
}) {
  const parts = detectAndRenderLinks(text, isOwnMessage);

  return (
    <span className={className}>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {typeof part === 'string' ? part : part}
        </React.Fragment>
      ))}
    </span>
  );
}
