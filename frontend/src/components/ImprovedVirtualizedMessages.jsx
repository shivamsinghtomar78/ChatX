import React, { memo, useCallback, useMemo, useRef, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';
import MessageItem from './MessageItem';
import './ImprovedVirtualizedMessages.css';

// Improved virtualization implementation with better performance and accuracy
const ImprovedVirtualizedMessages = memo(({
  messages,
  theme,
  reactions,
  pinnedMessages,
  isSpeaking,
  getRelativeTime,
  speakText,
  copyToClipboard,
  togglePin,
  toggleReaction,
  showToastMessage,
  windowHeight = 600
}) => {
  const listRef = useRef();
  const itemHeightCache = useRef(new Map());
  const itemRefs = useRef(new Map());
  const pendingMeasurements = useRef(new Set());
  const resizeObserverRef = useRef(null);

  // Configuration constants - Professional proportions
  const DEFAULT_ITEM_HEIGHT = 96; // 8px grid: 12 units
  const MIN_ITEM_HEIGHT = 72;     // 8px grid: 9 units
  const MAX_ITEM_HEIGHT = 1200;
  const OVERSCAN_COUNT = 15;

  // Calculate or retrieve item height with improved caching
  const getItemHeight = useCallback((index) => {
    // Return cached height if available
    if (itemHeightCache.current.has(index)) {
      return Math.min(Math.max(itemHeightCache.current.get(index), MIN_ITEM_HEIGHT), MAX_ITEM_HEIGHT);
    }
    
    // Estimate height based on message content with better heuristics
    const message = messages[index];
    if (!message) return DEFAULT_ITEM_HEIGHT;
    
    // Base height calculation - Professional spacing (8px grid)
    const baseHeight = 72; // 9 units: avatar(40) + padding(32)
    const contentLength = message.content.length;
    
    // Estimate height based on content characteristics
    let estimatedHeight = baseHeight;
    
    if (contentLength > 0) {
      // Factor in line breaks for more accurate estimation
      const lineBreaks = (message.content.match(/\n/g) || []).length;
      
      // Estimate lines based on content length and line breaks
      const estimatedLines = Math.ceil(contentLength / 70) + lineBreaks;
      
      // Height per line estimate - 1.6 line-height for readability
      const lineHeight = 26; // Consistent across themes
      estimatedHeight += estimatedLines * lineHeight;
      
      // Extra space for images - Professional proportions
      if (message.content.includes('[IMAGE_GENERATED:')) {
        estimatedHeight += 368; // 8px grid: 46 units
      }
      
      // Extra space for code blocks - Professional spacing
      if (message.content.includes('```')) {
        estimatedHeight += 104; // 8px grid: 13 units
      }
    }
    
    // Ensure reasonable bounds
    const finalHeight = Math.min(Math.max(estimatedHeight, MIN_ITEM_HEIGHT), MAX_ITEM_HEIGHT);
    
    // Cache the calculated height
    itemHeightCache.current.set(index, finalHeight);
    return finalHeight;
  }, [messages, theme]);

  // Reset height cache when messages change significantly
  const resetHeightCache = useCallback(() => {
    itemHeightCache.current.clear();
    itemRefs.current.clear();
    pendingMeasurements.current.clear();
    
    // Force list to recalculate positions
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, []);

  // Update item height in cache with better validation
  const setItemHeight = useCallback((index, height) => {
    // Validate inputs
    if (typeof index !== 'number' || typeof height !== 'number' || height <= 0) {
      return;
    }
    
    const clampedHeight = Math.min(Math.max(height, MIN_ITEM_HEIGHT), MAX_ITEM_HEIGHT);
    
    // Only update if height has actually changed
    if (itemHeightCache.current.get(index) !== clampedHeight) {
      itemHeightCache.current.set(index, clampedHeight);
      // Force list to recalculate positions for this item onwards
      listRef.current?.resetAfterIndex(index, true);
    }
  }, []);

  // Measure actual item height after render with improved reliability
  const measureItemHeight = useCallback((index) => {
    // Skip if already measured or currently pending
    if (itemHeightCache.current.has(index) || pendingMeasurements.current.has(index)) {
      return;
    }
    
    pendingMeasurements.current.add(index);
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      const element = itemRefs.current.get(index);
      if (element) {
        const height = element.getBoundingClientRect().height;
        // Only set height if it's a reasonable value
        if (height > 0) {
          setItemHeight(index, height);
        }
        pendingMeasurements.current.delete(index);
      } else {
        // Retry after a short delay for dynamic content
        setTimeout(() => {
          const element = itemRefs.current.get(index);
          if (element) {
            const height = element.getBoundingClientRect().height;
            // Only set height if it's a reasonable value
            if (height > 0) {
              setItemHeight(index, height);
            }
          }
          pendingMeasurements.current.delete(index);
        }, 100);
      }
    });
  }, [setItemHeight]);

  // Row renderer for react-window with improved measurement and error handling
  const Row = useCallback(({ index, style }) => {
    const message = messages[index];
    if (!message) return null;

    return (
      <div 
        style={style}
        ref={(element) => {
          if (element) {
            itemRefs.current.set(index, element);
            measureItemHeight(index);
          } else {
            itemRefs.current.delete(index);
          }
        }}
        data-index={index}
      >
        <MessageItem
          message={message}
          theme={theme}
          reactions={reactions}
          pinnedMessages={pinnedMessages}
          isSpeaking={isSpeaking}
          getRelativeTime={getRelativeTime}
          speakText={speakText}
          copyToClipboard={copyToClipboard}
          togglePin={togglePin}
          toggleReaction={toggleReaction}
          showToastMessage={showToastMessage}
        />
      </div>
    );
  }, [
    messages, theme, reactions, pinnedMessages, isSpeaking, getRelativeTime,
    speakText, copyToClipboard, togglePin, toggleReaction, showToastMessage,
    measureItemHeight
  ]);

  // Get item height for react-window with proper caching
  const itemHeight = useCallback((index) => {
    return getItemHeight(index);
  }, [getItemHeight]);

  // Reset cache when messages change
  useEffect(() => {
    resetHeightCache();
  }, [messages, resetHeightCache]);

  // Set up ResizeObserver to detect when messages change size
  useEffect(() => {
    // Create ResizeObserver if it doesn't exist
    if (!resizeObserverRef.current) {
      resizeObserverRef.current = new ResizeObserver(entries => {
        entries.forEach(entry => {
          const index = parseInt(entry.target.closest('[data-index]')?.getAttribute('data-index'));
          if (!isNaN(index)) {
            const height = entry.contentRect.height;
            setItemHeight(index, height);
          }
        });
      });
    }

    // Observe all rendered items
    itemRefs.current.forEach((element, index) => {
      if (element) {
        resizeObserverRef.current.observe(element);
      }
    });

    // Cleanup observer on unmount
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, [setItemHeight, messages]);

  // Attempt to remeasure items after initial render with better scheduling
  useEffect(() => {
    if (messages.length > 0) {
      // Schedule measurements with better prioritization
      const timeoutIds = [];
      
      // Measure visible items first (next frame)
      timeoutIds.push(setTimeout(() => {
        const visibleCount = Math.min(messages.length, 15);
        for (let i = 0; i < visibleCount; i++) {
          measureItemHeight(i);
        }
      }, 0));
      
      // Measure additional items after a short delay
      timeoutIds.push(setTimeout(() => {
        const additionalCount = Math.min(messages.length, 30);
        for (let i = 0; i < additionalCount; i++) {
          measureItemHeight(i);
        }
      }, 100));
      
      // Schedule another measurement pass after images might load
      timeoutIds.push(setTimeout(() => {
        // Re-measure all items that might contain images
        messages.forEach((_, index) => {
          if (messages[index]?.content?.includes('[IMAGE_GENERATED:')) {
            measureItemHeight(index);
          }
        });
      }, 500));
      
      // Final cleanup
      return () => {
        timeoutIds.forEach(id => clearTimeout(id));
      };
    }
  }, [messages, measureItemHeight]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messages.length > 0 && listRef.current) {
      // Scroll to the last message
      listRef.current.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length]);

  if (!messages || messages.length === 0) {
    return <div style={{ height: windowHeight }} className="empty-messages-placeholder"></div>;
  }

  return (
    <List
      ref={listRef}
      height={windowHeight}
      itemCount={messages.length}
      itemSize={itemHeight}
      estimatedItemSize={DEFAULT_ITEM_HEIGHT}
      overscanCount={OVERSCAN_COUNT}
      className="virtualized-messages-list"
    >
      {Row}
    </List>
  );
});

ImprovedVirtualizedMessages.displayName = 'ImprovedVirtualizedMessages';

export default ImprovedVirtualizedMessages;