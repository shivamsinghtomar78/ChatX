import React from 'react';
import '../App.css';

const SkeletonLoader = ({ theme, type = 'messages' }) => {
  if (type === 'messages') {
    return (
      <div className="skeleton-messages">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="skeleton-message">
            <div className={`skeleton-avatar skeleton ${theme}`}></div>
            <div className="skeleton-content">
              <div className={`skeleton-text skeleton ${theme}`}></div>
              <div className={`skeleton-text skeleton ${theme} skeleton-text-short`}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'sidebar') {
    return (
      <div className="skeleton-sidebar">
        <div className={`skeleton-item skeleton ${theme}`}></div>
        <div className={`skeleton-item skeleton ${theme}`}></div>
        <div className={`skeleton-item skeleton ${theme}`}></div>
        <div className={`skeleton-item skeleton ${theme}`}></div>
      </div>
    );
  }

  return (
    <div className={`skeleton-loader skeleton ${theme}`}>
      Loading...
    </div>
  );
};

export default SkeletonLoader;