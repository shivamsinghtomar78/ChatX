import React, { memo, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import MessageItem from './MessageItem';
import { TypingIndicator } from './LoadingState';

const OptimizedMessageList = memo(({ 
  messages, 
  theme,
  reactions,
  pinnedMessages,
  isSpeaking,
  isTyping,
  getRelativeTime,
  speakText,
  copyToClipboard,
  togglePin,
  toggleReaction,
  showToastMessage
}) => {
  const itemCount = useMemo(() => messages.length + (isTyping ? 1 : 0), [messages.length, isTyping]);
  
  const Row = useCallback(({ index, style }) => {
    if (index === messages.length && isTyping) {
      return (
        <div style={style}>
          <TypingIndicator />
        </div>
      );
    }
    
    const message = messages[index];
    if (!message) return null;
    
    return (
      <div style={style}>
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
  }, [messages, isTyping, theme, reactions, pinnedMessages, isSpeaking, getRelativeTime, speakText, copyToClipboard, togglePin, toggleReaction, showToastMessage]);

  if (messages.length === 0 && !isTyping) {
    return null;
  }

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          itemCount={itemCount}
          itemSize={150}
          width={width}
          overscanCount={3}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
});

OptimizedMessageList.displayName = 'OptimizedMessageList';

export default OptimizedMessageList;
