import React, { useState, useRef } from 'react';

const SwipeableItem = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  theme,
  className = '' 
}) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const itemRef = useRef(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setIsSwiping(true);
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    if (!touchStart) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    setIsSwiping(false);
    
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onSwipeLeft && onSwipeLeft();
    }

    if (isRightSwipe) {
      onSwipeRight && onSwipeRight();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div
      ref={itemRef}
      className={`swipeable-item ${isSwiping ? 'swiping' : ''} ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </div>
  );
};

export default SwipeableItem;