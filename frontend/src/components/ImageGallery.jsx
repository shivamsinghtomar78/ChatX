import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Play, Pause, Download, Maximize } from 'lucide-react';
import { Button } from './ui/button';

const ImageGallery = ({ 
  images, 
  theme, 
  initialIndex = 0,
  onClose,
  onDownload
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(3000); // 3 seconds
  const [imageMetadata, setImageMetadata] = useState({});
  const [showMetadata, setShowMetadata] = useState(false);
  const [isLoading, setIsLoading] = useState({});

  // Current image data
  const currentImage = images[currentIndex];
  
  // Auto-play timer
  useEffect(() => {
    let timer;
    if (isPlaying && images.length > 1) {
      timer = setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
      }, playbackSpeed);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, images.length, playbackSpeed]);

  // Reset zoom when changing images
  useEffect(() => {
    setZoomLevel(1);
  }, [currentIndex]);

  // Fetch image metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      images.forEach(async (image, index) => {
        if (!imageMetadata[image.filename]) {
          try {
            setIsLoading(prev => ({ ...prev, [index]: true }));
            // In a real implementation, we would fetch actual metadata from the backend
            // For now, we'll simulate with placeholder data
            const metadata = {
              prompt: image.prompt || `AI generated image ${index + 1}`,
              dimensions: "1024x1024",
              fileSize: "2.4 MB",
              format: "PNG",
              timestamp: new Date().toISOString(),
              source: "AI Generated"
            };
            setImageMetadata(prev => ({ ...prev, [image.filename]: metadata }));
          } catch (error) {
            console.error('Failed to fetch image metadata:', error);
          } finally {
            setIsLoading(prev => ({ ...prev, [index]: false }));
          }
        }
      });
    };

    fetchMetadata();
  }, [images, imageMetadata]);

  // Navigation functions
  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  const goToImage = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-') {
        zoomOut();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious, zoomIn, zoomOut, onClose]);

  // Handle image load error
  const handleImageError = useCallback((index) => {
    // In a real implementation, we would handle image loading errors
    console.log(`Failed to load image at index ${index}`);
  }, []);

  // Handle image retry
  const handleRetry = useCallback((index) => {
    // In a real implementation, we would retry loading the image
    console.log(`Retrying to load image at index ${index}`);
  }, []);

  // Handle download
  const handleDownload = useCallback((filename) => {
    onDownload?.(filename);
  }, [onDownload]);

  // Handle view full size
  const handleViewFullSize = useCallback((filename) => {
    window.open(`/api/image/${filename}`, '_blank');
  }, []);

  // Thumbnail click handler
  const handleThumbnailClick = useCallback((index) => {
    setCurrentIndex(index);
    setZoomLevel(1); // Reset zoom when changing images
  }, []);

  // Play/pause toggle
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  // Change playback speed
  const changePlaybackSpeed = useCallback((speed) => {
    setPlaybackSpeed(speed);
  }, []);

  // Render thumbnail strip
  const renderThumbnails = useMemo(() => {
    return (
      <div className={`gallery-thumbnails ${theme}`}>
        {images.map((image, index) => (
          <div
            key={index}
            className={`thumbnail-container ${theme} ${index === currentIndex ? 'active' : ''}`}
            onClick={() => handleThumbnailClick(index)}
          >
            {isLoading[index] ? (
              <div className={`thumbnail-loading ${theme}`}>
                <div className="spinner"></div>
              </div>
            ) : (
              <img
                src={`/api/image/${image.filename}?t=${Date.now()}`}
                alt={`Thumbnail ${index + 1}`}
                className={`thumbnail-image ${theme}`}
                onError={() => handleImageError(index)}
              />
            )}
            {index === currentIndex && (
              <div className="thumbnail-indicator"></div>
            )}
          </div>
        ))}
      </div>
    );
  }, [images, currentIndex, theme, isLoading, handleThumbnailClick, handleImageError]);

  // Render metadata panel
  const renderMetadataPanel = useMemo(() => {
    const metadata = imageMetadata[currentImage?.filename];
    if (!metadata) return null;

    return (
      <div className={`metadata-panel ${theme} ${showMetadata ? 'expanded' : ''}`}>
        <div className="metadata-header">
          <h3>Image Information</h3>
          <button 
            className={`metadata-toggle ${theme}`}
            onClick={() => setShowMetadata(prev => !prev)}
          >
            {showMetadata ? 'Hide' : 'Show'} Details
          </button>
        </div>
        {showMetadata && (
          <div className="metadata-content">
            <div className="metadata-item">
              <span className="metadata-label">Prompt:</span>
              <span className="metadata-value">{metadata.prompt}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Dimensions:</span>
              <span className="metadata-value">{metadata.dimensions}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">File Size:</span>
              <span className="metadata-value">{metadata.fileSize}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Format:</span>
              <span className="metadata-value">{metadata.format}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Created:</span>
              <span className="metadata-value">
                {new Date(metadata.timestamp).toLocaleDateString()}
              </span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Source:</span>
              <span className="metadata-value">{metadata.source}</span>
            </div>
          </div>
        )}
      </div>
    );
  }, [currentImage, imageMetadata, showMetadata, theme]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={`image-gallery-modal ${theme}`}>
      <div className="gallery-overlay" onClick={onClose}></div>
      
      <div className="gallery-container">
        {/* Header with controls */}
        <div className={`gallery-header ${theme}`}>
          <div className="gallery-title">
            {currentIndex + 1} of {images.length}
          </div>
          <div className="gallery-controls">
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomOut}
              disabled={zoomLevel <= 0.5}
              className={`gallery-control-btn ${theme}`}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomIn}
              disabled={zoomLevel >= 3}
              className={`gallery-control-btn ${theme}`}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            
            <div className="playback-controls">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                className={`gallery-control-btn ${theme}`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              {isPlaying && (
                <select
                  value={playbackSpeed}
                  onChange={(e) => changePlaybackSpeed(Number(e.target.value))}
                  className={`playback-speed-select ${theme}`}
                >
                  <option value={2000}>2s</option>
                  <option value={3000}>3s</option>
                  <option value={5000}>5s</option>
                  <option value={10000}>10s</option>
                </select>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(currentImage.filename)}
              className={`gallery-control-btn ${theme}`}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewFullSize(currentImage.filename)}
              className={`gallery-control-btn ${theme}`}
            >
              <Maximize className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={`gallery-control-btn close-btn ${theme}`}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main image display */}
        <div className="gallery-content">
          <Button
            variant="ghost"
            size="lg"
            onClick={goToPrevious}
            disabled={images.length <= 1}
            className={`nav-button prev-button ${theme}`}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <div className="image-container">
            {isLoading[currentIndex] ? (
              <div className={`image-loading ${theme}`}>
                <div className="spinner"></div>
                <p>Loading image...</p>
              </div>
            ) : (
              <img
                src={`/api/image/${currentImage.filename}?t=${Date.now()}`}
                alt={currentImage.prompt || `Image ${currentIndex + 1}`}
                className="gallery-image"
                style={{ transform: `scale(${zoomLevel})` }}
                onError={() => handleImageError(currentIndex)}
              />
            )}
            
            {/* Error state */}
            {false && ( // In a real implementation, we would check for actual errors
              <div className={`image-error-state ${theme}`}>
                <div className="error-icon">⚠️</div>
                <p>Failed to load image</p>
                <Button onClick={() => handleRetry(currentIndex)} className={`retry-button ${theme}`}>
                  Retry
                </Button>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="lg"
            onClick={goToNext}
            disabled={images.length <= 1}
            className={`nav-button next-button ${theme}`}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Progress indicator for slideshow */}
        {isPlaying && (
          <div className={`slideshow-progress ${theme}`}>
            <div 
              className="progress-bar"
              style={{ 
                animationDuration: `${playbackSpeed}ms`,
                animationPlayState: isPlaying ? 'running' : 'paused'
              }}
            ></div>
          </div>
        )}

        {/* Metadata panel */}
        {renderMetadataPanel}

        {/* Thumbnail strip */}
        {images.length > 1 && renderThumbnails}
      </div>
    </div>
  );
};

export default ImageGallery;