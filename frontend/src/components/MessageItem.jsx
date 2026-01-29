import React, { memo, useCallback, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Volume2, Copy, Pin, ThumbsUp, User, Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import ImageGallery from './ImageGallery';

const MessageItem = memo(({ 
  message, 
  theme, 
  reactions, 
  pinnedMessages, 
  isSpeaking, 
  getRelativeTime, 
  speakText, 
  copyToClipboard, 
  togglePin, 
  toggleReaction,
  showToastMessage
}) => {
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [initialGalleryIndex, setInitialGalleryIndex] = useState(0);

  // Helper function to highlight search terms
  const highlightText = useCallback((text, searchTerm) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="search-highlight">{part}</mark> : 
        part
    );
  }, []);

  // Render message content with improved image handling
  const renderMessageContent = useCallback((content) => {
    // Check if content contains image markers
    if (content.includes('[IMAGE_GENERATED:')) {
      // Extract all image references
      const imageRegex = /\[IMAGE_GENERATED:([^\]]+)\]/g;
      const imageMatches = [...content.matchAll(imageRegex)];
      
      // If we have images, process them
      if (imageMatches.length > 0) {
        // Extract images with their filenames and surrounding content
        const images = imageMatches.map((match, index) => ({
          filename: match[1],
          prompt: `AI generated image ${index + 1}`, // In a real implementation, we would extract the actual prompt
          index
        }));
        
        // Split content into parts
        const parts = content.split(/\[IMAGE_GENERATED:[^\]]+\]/);
        
        return (
          <div>
            {/* Content before first image */}
            {parts[0] && <div className="image-container-before"><ReactMarkdown>{parts[0]}</ReactMarkdown></div>}
            
            {/* Handle single image or multiple images */}
            {images.length === 1 ? (
              // Single image handling (existing implementation)
              <div className="generated-image-container image-container">
                <div className={`loading-indicator ${theme}`}>
                  <div>Loading image...</div>
                </div>
                <img 
                  src={`/api/image/${images[0].filename}?t=${Date.now()}`}
                  alt="Generated AI Image"
                  className={`generated-image ${theme}`}
                  onLoad={(e) => {
                    // Hide loading indicator and show image
                    const loadingIndicator = e.target.parentElement.querySelector('.loading-indicator');
                    if (loadingIndicator) {
                      loadingIndicator.classList.add('hidden');
                    }
                    // Add loaded class to show image
                    e.target.classList.add('loaded');
                  }}
                  onError={(e) => {
                    // Hide loading indicator
                    const loadingIndicator = e.target.parentElement.querySelector('.loading-indicator');
                    if (loadingIndicator) {
                      loadingIndicator.classList.add('hidden');
                    }
                    
                    // Check if error div already exists to prevent duplicates
                    const existingError = e.target.parentElement.querySelector('.image-error');
                    if (existingError) {
                      existingError.classList.remove('hidden');
                      return;
                    }
                    
                    // Create error message with retry functionality
                    const errorDiv = document.createElement('div');
                    errorDiv.className = `image-error ${theme} visible`;
                    errorDiv.innerHTML = `
                      <div class="image-error-icon">⚠️</div>
                      <div>Failed to load image</div>
                      <div class="image-error-message">The generated image may not be available</div>
                      <button class="image-error-retry-btn" onclick="window.location.reload()">
                        Retry
                      </button>
                    `;
                    e.target.parentElement.appendChild(errorDiv);
                  }}
                  loading="lazy"
                />
                <div className="image-actions">
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `/api/image/${images[0].filename}`;
                      link.download = images[0].filename;
                      link.click();
                    }}
                    className="download-btn"
                    aria-label="Download image"
                  >
                    Download
                  </button>
                  <button 
                    onClick={() => {
                      // Open image in new tab
                      window.open(`/api/image/${images[0].filename}`, '_blank');
                    }}
                    className="download-btn"
                    aria-label="View full size"
                  >
                    View Full Size
                  </button>
                </div>
              </div>
            ) : (
              // Multiple images - gallery view
              <div className="image-gallery-container">
                <div className="gallery-preview">
                  {images.slice(0, 4).map((image, index) => (
                    <div 
                      key={index} 
                      className={`gallery-item ${theme} ${index === 0 ? 'main' : 'thumbnail'}`}
                      onClick={() => {
                        setGalleryImages(images);
                        setInitialGalleryIndex(index);
                        setShowGallery(true);
                      }}
                    >
                      <img 
                        src={`/api/image/${image.filename}?t=${Date.now()}`}
                        alt={`Generated AI Image ${index + 1}`}
                        className={`gallery-image ${theme}`}
                        loading="lazy"
                      />
                      {index === 3 && images.length > 4 && (
                        <div className={`gallery-overlay ${theme}`}>
                          +{images.length - 4}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="gallery-actions">
                  <button 
                    onClick={() => {
                      setGalleryImages(images);
                      setInitialGalleryIndex(0);
                      setShowGallery(true);
                    }}
                    className="gallery-view-btn"
                  >
                    View Gallery ({images.length} images)
                  </button>
                </div>
              </div>
            )}
            
            {/* Content after last image */}
            {parts[parts.length - 1] && <div className="image-container-after"><ReactMarkdown>{parts[parts.length - 1]}</ReactMarkdown></div>}
          </div>
        );
      }
    }
    
    return (
      <ReactMarkdown
        components={{
          // Add syntax highlighting for code blocks
          code({node, inline, className, children, ...props}) {
            if (inline) {
              return <code className={className} {...props}>{children}</code>;
            }
            
            // For block code, we could add syntax highlighting here
            // For now, we'll keep it simple
            return (
              <pre className={className} {...props}>
                <code>{children}</code>
              </pre>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }, [theme]);

  // Handle image download
  const handleImageDownload = useCallback((filename) => {
    const link = document.createElement('a');
    link.href = `/api/image/${filename}`;
    link.download = filename;
    link.click();
  }, []);

  const isPinned = useMemo(() => pinnedMessages.includes(message.id), [pinnedMessages, message.id]);
  const isLiked = useMemo(() => reactions[message.id] === 'like', [reactions, message.id]);

  return (
    <div 
      data-message-id={message.id}
      className={cn(
        "flex gap-3 mb-6 group animate-in fade-in-0 slide-in-from-bottom-4 duration-300",
        "sm:gap-4 md:mb-8",
        message.role === 'user' && "flex-row-reverse"
      )}
    >
      <Avatar className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 flex-shrink-0">
        <AvatarFallback className={cn(
          message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 space-y-1">
        <Card className={cn(
          "inline-block max-w-full sm:max-w-[90%] md:max-w-[85%] lg:max-w-[80%] transition-all hover:shadow-md",
          message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-card"
        )}>
          <div className="p-4 prose prose-sm dark:prose-invert max-w-none leading-relaxed">
            {renderMessageContent(message.content)}
          </div>
        </Card>
        <div className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground",
          message.role === 'user' && "justify-end"
        )}>
          <span>{getRelativeTime(message.timestamp)}</span>
          {message.edited && <span className="italic">(edited)</span>}
          {isPinned && <Pin className="h-3 w-3 fill-current" />}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            {message.role === 'assistant' && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => speakText(message.content)} aria-label="Read aloud">
                  <Volume2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(message.content)} aria-label="Copy">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePin(message.id)} aria-label={isPinned ? "Unpin" : "Pin"}>
              <Pin className={cn("h-3.5 w-3.5", isPinned && "fill-current text-primary")} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleReaction(message.id, 'like')} aria-label={isLiked ? "Unlike" : "Like"}>
              <ThumbsUp className={cn("h-3.5 w-3.5", isLiked && "fill-current text-primary")} />
            </Button>
          </div>
        </div>
      </div>
      {showGallery && (
        <ImageGallery
          images={galleryImages}
          theme={theme}
          initialIndex={initialGalleryIndex}
          onClose={() => setShowGallery(false)}
          onDownload={handleImageDownload}
        />
      )}
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;