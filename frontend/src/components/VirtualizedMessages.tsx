"use client";

import React, { memo, useCallback, useRef, useEffect } from 'react';
import * as ReactWindow from 'react-window';
import MessageItem from './MessageItem';
import { Message } from '@/types/chat';

const { VariableSizeList } = ReactWindow as any;

interface VirtualizedMessagesProps {
    messages: Message[];
    reactions: Record<string, string | null>;
    pinnedMessages: string[];
    isSpeaking: boolean;
    getRelativeTime: (ts: Date) => string;
    speakText: (text: string) => void;
    copyToClipboard: (text: string) => void;
    togglePin: (id: string) => void;
    toggleReaction: (id: string, reaction: string) => void;
    windowHeight: number;
}

const VirtualizedMessages = memo(({
    messages,
    reactions,
    pinnedMessages,
    isSpeaking,
    getRelativeTime,
    speakText,
    copyToClipboard,
    togglePin,
    toggleReaction,
    windowHeight = 600
}: VirtualizedMessagesProps) => {
    const listRef = useRef<any>(null);
    const itemHeightCache = useRef(new Map<number, number>());
    const itemRefs = useRef(new Map<number, HTMLElement>());

    const getItemHeight = useCallback((index: number) => {
        if (itemHeightCache.current.has(index)) {
            return itemHeightCache.current.get(index)!;
        }

        const message = messages[index];
        if (!message) return 100;

        // Estimation
        let estimatedHeight = 100;
        const contentLength = message.content.length;
        estimatedHeight += Math.ceil(contentLength / 60) * 24;

        if (message.content.includes('[IMAGE_GENERATED:')) {
            estimatedHeight += 300;
        }

        return estimatedHeight;
    }, [messages]);

    const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
        const message = messages[index];
        if (!message) return null;

        return (
            <div
                style={style}
                ref={(element) => {
                    if (element) {
                        itemRefs.current.set(index, element);
                        const height = element.getBoundingClientRect().height;
                        if (height > 0 && itemHeightCache.current.get(index) !== height) {
                            itemHeightCache.current.set(index, height);
                            listRef.current?.resetAfterIndex(index);
                        }
                    }
                }}
            >
                <MessageItem
                    message={message}
                    reactions={reactions}
                    pinnedMessages={pinnedMessages}
                    isSpeaking={isSpeaking}
                    getRelativeTime={getRelativeTime}
                    speakText={speakText}
                    copyToClipboard={copyToClipboard}
                    togglePin={togglePin}
                    toggleReaction={toggleReaction}
                />
            </div>
        );
    }, [messages, reactions, pinnedMessages, isSpeaking, getRelativeTime, speakText, copyToClipboard, togglePin, toggleReaction]);

    useEffect(() => {
        if (messages.length > 0 && listRef.current) {
            listRef.current.scrollToItem(messages.length - 1, 'end');
        }
    }, [messages.length]);

    return (
        <VariableSizeList
            ref={listRef}
            height={windowHeight}
            itemCount={messages.length}
            itemSize={getItemHeight}
            width="100%"
            overscanCount={5}
            className="custom-scrollbar"
        >
            {Row}
        </VariableSizeList>
    );
});

VirtualizedMessages.displayName = 'VirtualizedMessages';

export default VirtualizedMessages;
