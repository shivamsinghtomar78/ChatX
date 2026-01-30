"use client";

import { useState, useCallback, useRef } from 'react';
import API_BASE_URL from '../apiConfig';
import { Message, Conversation } from '@/types/chat';

/**
 * Custom hook to manage chat messaging
 * Handles sending messages, API calls, and typing state
 */
export const useChat = (
    activeConversation: Conversation | null,
    updateConversation?: (conv: Conversation) => void,
    createConversation?: () => Conversation,
    showToast?: (message: string, type?: 'success' | 'error' | 'info') => void
) => {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Draft save timer
    const draftTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Generate title from first message
    const generateTitle = useCallback((firstMessage: string) => {
        return firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage;
    }, []);

    // Call API with error handling
    const callAPI = useCallback(async (userMessage: string, threadId: string) => {
        setIsTyping(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    message: userMessage,
                    thread_id: threadId
                })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            return data.response || 'Sorry, I could not process your request.';
        } catch (err) {
            setError('Connection failed. Check if backend is running.');
            showToast?.('Connection failed. Please check backend.', 'error');
            return 'Error: Could not connect to server.';
        } finally {
            setIsTyping(false);
        }
    }, [showToast]);

    // Send message
    const sendMessage = useCallback(async () => {
        if (!message.trim()) return;

        let currentConv = activeConversation;

        // Create new conversation if none exists
        if (!currentConv) {
            if (createConversation) {
                currentConv = createConversation();
            } else {
                currentConv = {
                    id: Date.now().toString(),
                    title: generateTitle(message),
                    messages: [],
                    createdAt: new Date()
                };
            }
        }

        // Add user message
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: message,
            timestamp: new Date()
        };

        const updatedConv: Conversation = {
            ...currentConv,
            messages: [...currentConv.messages, userMsg],
            title: currentConv.messages.length === 0 ? generateTitle(message) : currentConv.title
        };

        updateConversation?.(updatedConv);
        setMessage('');

        // Clear draft
        if (draftTimerRef.current) {
            clearTimeout(draftTimerRef.current);
        }
        try {
            localStorage.removeItem(`draft-${currentConv.id}`);
        } catch (e) {
            // Ignore localStorage errors
        }

        // Get AI response
        const aiResponse = await callAPI(message, updatedConv.id);

        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date()
        };

        const finalConv: Conversation = {
            ...updatedConv,
            messages: [...updatedConv.messages, aiMsg]
        };

        updateConversation?.(finalConv);
    }, [message, activeConversation, updateConversation, createConversation, generateTitle, callAPI]);

    // Handle message change with debounced draft save
    const handleMessageChange = useCallback((value: string) => {
        setMessage(value);

        if (activeConversation) {
            if (draftTimerRef.current) {
                clearTimeout(draftTimerRef.current);
            }
            draftTimerRef.current = setTimeout(() => {
                try {
                    localStorage.setItem(`draft-${activeConversation.id}`, value);
                } catch (e) {
                    // Ignore localStorage errors
                }
            }, 1000); // Debounce 1 second
        }
    }, [activeConversation]);

    // Regenerate last AI response
    const regenerateResponse = useCallback(async () => {
        if (!activeConversation || activeConversation.messages.length < 2) return;

        const messages = activeConversation.messages;
        const lastUserMsg = messages[messages.length - 2];

        if (lastUserMsg?.role !== 'user') return;

        const updatedMessages = messages.slice(0, -1);
        const updatedConv = { ...activeConversation, messages: updatedMessages };
        updateConversation?.(updatedConv);

        const aiResponse = await callAPI(lastUserMsg.content, updatedConv.id);

        const aiMsg: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date()
        };

        const finalConv = { ...updatedConv, messages: [...updatedMessages, aiMsg] };
        updateConversation?.(finalConv);
        showToast?.('Response regenerated', 'success');
    }, [activeConversation, updateConversation, callAPI, showToast]);

    return {
        message,
        setMessage: handleMessageChange,
        isTyping,
        error,
        sendMessage,
        regenerateResponse
    };
};

export default useChat;
