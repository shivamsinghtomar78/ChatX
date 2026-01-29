import React, { memo, useMemo } from 'react';
import { Menu, Sparkles } from 'lucide-react';
import ImprovedVirtualizedMessages from './ImprovedVirtualizedMessages';
import ChatInput from './ChatInput';
import UserMenu from './UserMenu';
import './ChatArea.css';

const SUGGESTIONS = [
    "🔍 Analyze my Python code for bugs",
    "📊 Create a business plan for my startup",
    "📝 Write a professional email",
    "🎨 Generate a creative story",
    "💡 Brainstorm ideas for...",
    "📈 Analyze data trends"
];

const ChatArea = memo(({
    activeConversation,
    message,
    onMessageChange,
    onSend,
    isTyping,
    isListening,
    isSpeaking,
    onStartListening,
    onStopListening,
    onToggleSidebar,
    reactions,
    pinnedMessages,
    onSpeak,
    onCopy,
    onTogglePin,
    onToggleReaction,
    showToast,
    windowHeight,
    theme,
    isMobile
}) => {
    // Memoize messages to prevent unnecessary re-renders
    const messages = useMemo(() =>
        activeConversation?.messages || [],
        [activeConversation?.messages]
    );

    // Calculate chat height
    const chatHeight = useMemo(() =>
        Math.max(windowHeight - 200, 400),
        [windowHeight]
    );

    // Get relative time helper
    const getRelativeTime = (timestamp) => {
        const now = new Date();
        const diff = now - new Date(timestamp);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion) => {
        // Remove emoji prefix
        const cleanSuggestion = suggestion.replace(/^[^\s]+\s/, '');
        onMessageChange?.(cleanSuggestion);
    };

    return (
        <div className="chat-area">
            {/* Header */}
            <header className="chat-header">
                <div className="header-left">
                    <button
                        onClick={onToggleSidebar}
                        className="menu-btn"
                        aria-label="Toggle sidebar"
                    >
                        <Menu size={20} />
                    </button>
                    <h1 className="chat-title">
                        {activeConversation?.title || 'ChatX'}
                    </h1>
                </div>
                <div className="header-right">
                    <UserMenu />
                </div>
            </header>

            {/* Messages or Welcome */}
            <main className="chat-content">
                {messages.length === 0 ? (
                    <div className="welcome-container">
                        <div className="welcome-content">
                            <div className="welcome-icon">
                                <Sparkles size={48} />
                            </div>
                            <h2>Welcome to ChatX</h2>
                            <p>Your AI-powered assistant. Start a conversation!</p>

                            <div className="suggestions-grid">
                                {SUGGESTIONS.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        className="suggestion-btn"
                                        onClick={() => handleSuggestionClick(suggestion)}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <ImprovedVirtualizedMessages
                        messages={messages}
                        theme={theme}
                        reactions={reactions}
                        pinnedMessages={pinnedMessages}
                        isSpeaking={isSpeaking}
                        getRelativeTime={getRelativeTime}
                        speakText={onSpeak}
                        copyToClipboard={onCopy}
                        togglePin={onTogglePin}
                        toggleReaction={onToggleReaction}
                        showToastMessage={showToast}
                        windowHeight={chatHeight}
                    />
                )}
            </main>

            {/* Input */}
            <ChatInput
                message={message}
                onMessageChange={onMessageChange}
                onSend={onSend}
                isTyping={isTyping}
                isListening={isListening}
                onStartListening={onStartListening}
                onStopListening={onStopListening}
            />
        </div>
    );
});

ChatArea.displayName = 'ChatArea';

export default ChatArea;
