import React, { useState, useEffect } from 'react';

const TestImageComponent = () => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const imageUrl = '/api/image/generated_3532.png';
  const filename = 'generated_3532.png';
  
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };
  
  const handleImageError = () => {
    setImageLoaded(true);
    setImageError(true);
  };
  
  const handleRetry = () => {
    setImageLoaded(false);
    setImageError(false);
    // Force reload by changing the src
    const img = document.querySelector('#test-image');
    if (img) {
      img.src = imageUrl + '?t=' + new Date().getTime();
    }
  };
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    link.click();
  };
  
  const handleViewFullSize = () => {
    window.open(imageUrl, '_blank');
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Test Image Component</h1>
      <p>This is a test to verify image display functionality.</p>
      
      <div className="generated-image" style={{ marginTop: '15px', marginBottom: '15px' }}>
        {/* Loading indicator */}
        {!imageLoaded && (
          <div className="loading-indicator" style={{
            width: '100%',
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            borderRadius: '12px',
            border: '2px dashed #d1d5db'
          }}>
            <div>Loading image...</div>
          </div>
        )}
        
        {/* Error message */}
        {imageError && (
          <div style={{
            width: '100%',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#fee2e2',
            borderRadius: '12px',
            border: '2px solid #fecaca',
            color: '#b91c1c'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
            <div>Failed to load image</div>
            <div style={{ marginTop: '8px', fontSize: '14px' }}>The generated image may not be available</div>
            <button 
              onClick={handleRetry}
              style={{
                marginTop: '12px',
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Image */}
        <img 
          id="test-image"
          src={imageUrl}
          alt="Generated AI Image"
          style={{
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '12px',
            border: '2px solid #3b82f6',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            display: imageLoaded && !imageError ? 'block' : 'none'
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={handleViewFullSize}
        />
        
        {/* Action buttons */}
        <div style={{ 
          marginTop: '8px', 
          display: 'flex', 
          gap: '8px', 
          alignItems: 'center' 
        }}>
          <button 
            onClick={handleDownload}
            style={{
              padding: '6px 12px',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Download
          </button>
          <button 
            onClick={handleViewFullSize}
            style={{
              padding: '6px 12px',
              background: 'linear-gradient(135deg, #10b981, #3b82f6)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            View Full Size
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestImageComponent;