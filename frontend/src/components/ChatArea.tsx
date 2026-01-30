"use client";

import React, { memo, useMemo } from 'react';
import { Menu, Sparkles } from 'lucide-react';
import VirtualizedMessages from './VirtualizedMessages';
import ChatInput from './ChatInput';
import UserMenu from './UserMenu';
import { Conversation, Message } from '@/types/chat';

interface ChatAreaProps {
    activeConversation: Conversation | null;
    message: string;
    onMessageChange: (value: string) => void;
    onSend: () => void;
    isTyping: boolean;
    isListening: boolean;
    onStartListening: (onResult: (transcript: string) => void) => void;
    onStopListening: () => void;
    onToggleSidebar: () => void;
    reactions: Record<string, string | null>;
    pinnedMessages: string[];
    onSpeak: (text: string) => void;
    onCopy: (text: string) => void;
    onTogglePin: (id: string) => void;
    onToggleReaction: (id: string, reaction: string) => void;
    windowHeight: number;
}

const SUGGESTIONS = [
    "🔍 Analyze my Python code for bugs",
    "📊 Create a business plan for my startup",
    "📝 Write a professional email",
    "🎨 Generate a creative image of a futuristic city",
    "💡 Brainstorm ideas for a tech project",
    "📈 Analyze current stock trends"
];

const ChatArea = memo(({
    activeConversation,
    message,
    onMessageChange,
    onSend,
    isTyping,
    isListening,
    onStartListening,
    onStopListening,
    onToggleSidebar,
    reactions,
    pinnedMessages,
    onSpeak,
    onCopy,
    onTogglePin,
    onToggleReaction,
    windowHeight
}: ChatAreaProps) => {
    const messages = useMemo(() => activeConversation?.messages || [], [activeConversation]);

    const chatHeight = useMemo(() => Math.max(windowHeight - 140, 400), [windowHeight]);

    const getRelativeTime = (timestamp: Date) => {
        const diff = new Date().getTime() - new Date(timestamp).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(diff / 3600000);
        if (hours < 24) return `${hours}h ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    const handleSuggestionClick = (suggestion: string) => {
        const cleanSuggestion = suggestion.replace(/^[^\s]+\s/, '');
        onMessageChange?.(cleanSuggestion);
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-background relative h-full">
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 hover:bg-accent rounded-lg md:hidden"
                        aria-label="Toggle sidebar"
                    >
                        <Menu size={20} />
                    </button>
                    <h1 className="text-sm font-bold truncate text-foreground/90">
                        {activeConversation?.title || 'ChatX Assistant'}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <UserMenu />
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-hidden">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary rotate-3">
                            <Sparkles size={32} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">How can I help you today?</h2>
                            <p className="text-muted-foreground text-sm">
                                Ask anything! From debugging code to generating creative images.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                            {SUGGESTIONS.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="p-4 text-left text-sm rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all group active:scale-[0.98]"
                                >
                                    <span className="group-hover:translate-x-1 inline-block transition-transform">
                                        {suggestion}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <VirtualizedMessages
                        messages={messages}
                        reactions={reactions}
                        pinnedMessages={pinnedMessages}
                        isSpeaking={false} // Connect to state if needed
                        getRelativeTime={getRelativeTime}
                        speakText={onSpeak}
                        copyToClipboard={onCopy}
                        togglePin={onTogglePin}
                        toggleReaction={onToggleReaction}
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
