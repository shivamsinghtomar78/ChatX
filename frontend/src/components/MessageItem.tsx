"use client";

import React, { memo, useCallback } from 'react';
import API_BASE_URL from '@/apiConfig';
import ReactMarkdown from 'react-markdown';
import { Volume2, Copy, Pin, ThumbsUp, User, Bot, Download, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message } from '@/types/chat';

interface MessageItemProps {
    message: Message;
    reactions: Record<string, string | null>;
    pinnedMessages: string[];
    isSpeaking: boolean;
    getRelativeTime: (ts: Date) => string;
    speakText: (text: string) => void;
    copyToClipboard: (text: string) => void;
    togglePin: (id: string) => void;
    toggleReaction: (id: string, reaction: string) => void;
}

const MessageItem = memo(({
    message,
    reactions,
    pinnedMessages,
    isSpeaking,
    getRelativeTime,
    speakText,
    copyToClipboard,
    togglePin,
    toggleReaction,
}: MessageItemProps) => {

    const renderMessageContent = useCallback((content: string) => {
        if (content.includes('[IMAGE_GENERATED:')) {
            const imageRegex = /\[IMAGE_GENERATED:([^\]]+)\]/g;
            const matches = [...content.matchAll(imageRegex)];

            if (matches.length > 0) {
                const parts = content.split(/\[IMAGE_GENERATED:[^\]]+\]/);
                return (
                    <div className="space-y-4">
                        {parts[0] && <div className="prose dark:prose-invert max-w-none"><ReactMarkdown>{parts[0]}</ReactMarkdown></div>}

                        <div className={cn(
                            "grid gap-2",
                            matches.length > 1 ? "grid-cols-2" : "grid-cols-1"
                        )}>
                            {matches.map((match, i) => {
                                const filename = match[1];
                                const url = `${API_BASE_URL}/api/image/${filename}`;
                                return (
                                    <div key={i} className="group/img relative rounded-xl overflow-hidden bg-muted border border-border shadow-sm">
                                        <img
                                            src={url}
                                            alt="Generated content"
                                            className="w-full aspect-square object-cover transition-transform group-hover/img:scale-105"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <a
                                                href={url}
                                                download
                                                className="p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md transition-colors"
                                                title="Download"
                                            >
                                                <Download size={18} className="text-white" />
                                            </a>
                                            <button
                                                onClick={() => window.open(url, '_blank')}
                                                className="p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md transition-colors"
                                                title="Open in new tab"
                                            >
                                                <ExternalLink size={18} className="text-white" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {parts[parts.length - 1] && <div className="prose dark:prose-invert max-w-none"><ReactMarkdown>{parts[parts.length - 1]}</ReactMarkdown></div>}
                    </div>
                );
            }
        }

        return <div className="prose dark:prose-invert max-w-none"><ReactMarkdown>{content}</ReactMarkdown></div>;
    }, []);

    const isPinned = pinnedMessages.includes(message.id);
    const isLiked = reactions[message.id] === 'like';

    return (
        <div
            className={cn(
                "group flex gap-3 px-4 py-6 transition-colors duration-200",
                message.role === 'user' ? "bg-muted/30" : "bg-background"
            )}
        >
            <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"
            )}>
                {message.role === 'user' ? <User size={18} /> : <Bot size={18} className="text-primary" />}
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold capitalize">
                        {message.role}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                        {getRelativeTime(new Date(message.timestamp))}
                    </span>
                    {isPinned && <Pin size={12} className="text-primary fill-primary" />}
                </div>

                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {renderMessageContent(message.content)}
                </div>

                <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {message.role === 'assistant' && (
                        <>
                            <button
                                onClick={() => speakText(message.content)}
                                className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Volume2 size={14} className={isSpeaking ? "text-primary animate-pulse" : ""} />
                            </button>
                            <button
                                onClick={() => copyToClipboard(message.content)}
                                className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Copy size={14} />
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => togglePin(message.id)}
                        className={cn(
                            "p-1.5 hover:bg-muted rounded-md transition-colors",
                            isPinned ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Pin size={14} className={isPinned ? "fill-primary" : ""} />
                    </button>
                    <button
                        onClick={() => toggleReaction(message.id, 'like')}
                        className={cn(
                            "p-1.5 hover:bg-muted rounded-md transition-colors",
                            isLiked ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <ThumbsUp size={14} className={isLiked ? "fill-primary" : ""} />
                    </button>
                </div>
            </div>
        </div>
    );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;
