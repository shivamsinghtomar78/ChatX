"use client";

import React, { memo, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
    message: string;
    onMessageChange: (value: string) => void;
    onSend: () => void;
    isTyping: boolean;
    isListening: boolean;
    onStartListening: (onResult: (transcript: string) => void) => void;
    onStopListening: () => void;
    disabled?: boolean;
}

const ChatInput = memo(({
    message,
    onMessageChange,
    onSend,
    isTyping,
    isListening,
    onStartListening,
    onStopListening,
    disabled
}: ChatInputProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        onMessageChange?.(value);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [onMessageChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend?.();
        }
    }, [onSend]);

    const handleVoiceClick = useCallback(() => {
        if (isListening) {
            onStopListening?.();
        } else {
            onStartListening?.((transcript: string) => {
                onMessageChange?.(transcript);
            });
        }
    }, [isListening, onStartListening, onStopListening, onMessageChange]);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    useEffect(() => {
        if (!message && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    }, [message]);

    return (
        <div className="p-4 bg-background border-t border-border">
            <div className="max-w-4xl mx-auto relative group">
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />

                <div className="relative flex flex-col items-stretch bg-card border border-border rounded-xl shadow-sm focus-within:ring-1 focus-within:ring-primary/50 transition-all overflow-hidden">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        className="w-full px-4 py-3 bg-transparent text-sm resize-none outline-none custom-scrollbar min-h-[48px]"
                        rows={1}
                        disabled={disabled || isTyping}
                        aria-label="Message input"
                    />

                    <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-t border-border/50">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleVoiceClick}
                                className={cn(
                                    "p-2 rounded-lg transition-all",
                                    isListening
                                        ? "bg-destructive text-destructive-foreground animate-pulse"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                                disabled={disabled || isTyping}
                            >
                                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <p className="hidden sm:block text-[10px] text-muted-foreground font-medium">
                                Press <kbd className="px-1.5 py-0.5 border border-border rounded bg-muted">Enter</kbd>
                            </p>

                            <button
                                onClick={onSend}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg transition-all font-medium h-9",
                                    (!message.trim() || disabled || isTyping) && "opacity-50 cursor-not-allowed grayscale"
                                )}
                                disabled={!message.trim() || disabled || isTyping}
                                aria-label="Send message"
                            >
                                {isTyping ? (
                                    <div className="flex gap-1">
                                        <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                ) : (
                                    <>
                                        <Sparkles size={14} />
                                        <span>Send</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
