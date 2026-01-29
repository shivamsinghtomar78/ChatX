import React, { memo, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, Sparkles } from 'lucide-react';
import './ChatInput.css';

const ChatInput = memo(({
    message,
    onMessageChange,
    onSend,
    isTyping,
    isListening,
    onStartListening,
    onStopListening,
    disabled
}) => {
    const textareaRef = useRef(null);

    // Auto-resize textarea
    const handleChange = useCallback((e) => {
        const value = e.target.value;
        onMessageChange?.(value);

        // Auto-resize
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
        }
    }, [onMessageChange]);

    // Handle Enter key
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend?.();
        }
    }, [onSend]);

    // Handle voice toggle
    const handleVoiceClick = useCallback(() => {
        if (isListening) {
            onStopListening?.();
        } else {
            onStartListening?.((transcript) => {
                onMessageChange?.(transcript);
            });
        }
    }, [isListening, onStartListening, onStopListening, onMessageChange]);

    // Focus textarea on mount
    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    // Reset height when message is cleared
    useEffect(() => {
        if (!message && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    }, [message]);

    return (
        <div className="chat-input-container">
            <div className="chat-input-wrapper">
                <div className="input-glow" />

                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="chat-textarea"
                    rows={1}
                    disabled={disabled || isTyping}
                    aria-label="Message input"
                />

                <div className="input-actions">
                    {/* Voice Input */}
                    <button
                        onClick={handleVoiceClick}
                        className={`input-btn voice-btn ${isListening ? 'active' : ''}`}
                        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                        disabled={disabled || isTyping}
                    >
                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>

                    {/* Send Button */}
                    <button
                        onClick={onSend}
                        className="input-btn send-btn"
                        disabled={!message.trim() || disabled || isTyping}
                        aria-label="Send message"
                    >
                        {isTyping ? (
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        ) : (
                            <>
                                <Sparkles size={14} className="sparkle" />
                                <Send size={18} />
                            </>
                        )}
                    </button>
                </div>
            </div>

            <p className="input-hint">
                Press <kbd>Enter</kbd> to send, <kbd>Shift+Enter</kbd> for new line
            </p>
        </div>
    );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
