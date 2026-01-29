import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to manage conversations state
 * Handles CRUD operations, persistence, and search
 */
export const useConversations = (showToast) => {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchFilter, setSearchFilter] = useState('all');

    // Debounce timer for localStorage saves
    const saveTimerRef = useRef(null);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, []);

    // Load conversations from localStorage on mount
    useEffect(() => {
        try {
            const savedConvs = localStorage.getItem('chatx-conversations');
            const savedActive = localStorage.getItem('chatx-active-conversation');

            if (savedConvs) {
                const parsed = JSON.parse(savedConvs);
                const restored = parsed.map(conv => ({
                    ...conv,
                    createdAt: new Date(conv.createdAt),
                    messages: conv.messages.map(msg => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp)
                    }))
                }));
                setConversations(restored);
            }

            if (savedActive) {
                const parsed = JSON.parse(savedActive);
                const restored = {
                    ...parsed,
                    createdAt: new Date(parsed.createdAt),
                    messages: parsed.messages.map(msg => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp)
                    }))
                };
                setActiveConversation(restored);
            }
        } catch (e) {
            console.error('Error loading saved data:', e);
            showToast?.('Error loading saved conversations', 'error');
        }
    }, [showToast]);

    // Debounced save to localStorage
    const saveConversations = useCallback((convs) => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }
        saveTimerRef.current = setTimeout(() => {
            try {
                localStorage.setItem('chatx-conversations', JSON.stringify(convs));
            } catch (e) {
                console.error('Error saving conversations:', e);
            }
        }, 500); // Debounce 500ms
    }, []);

    // Save conversations when they change
    useEffect(() => {
        if (conversations.length > 0) {
            saveConversations(conversations);
        }
    }, [conversations, saveConversations]);

    // Save active conversation
    useEffect(() => {
        if (activeConversation) {
            try {
                localStorage.setItem('chatx-active-conversation', JSON.stringify(activeConversation));
            } catch (e) {
                console.error('Error saving active conversation:', e);
            }
        }
    }, [activeConversation]);

    // Create new conversation
    const createConversation = useCallback(() => {
        const newConv = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
            createdAt: new Date()
        };
        setConversations(prev => [newConv, ...prev]);
        setActiveConversation(newConv);
        showToast?.('New conversation created', 'success');
        return newConv;
    }, [showToast]);

    // Delete conversation
    const deleteConversation = useCallback((id) => {
        setConversations(prev => prev.filter(conv => conv.id !== id));
        if (activeConversation?.id === id) {
            setActiveConversation(null);
            showToast?.('Conversation deleted', 'info');
        }
    }, [activeConversation?.id, showToast]);

    // Update conversation
    const updateConversation = useCallback((updatedConv) => {
        setConversations(prev =>
            prev.map(conv => conv.id === updatedConv.id ? updatedConv : conv)
        );
        if (activeConversation?.id === updatedConv.id) {
            setActiveConversation(updatedConv);
        }
    }, [activeConversation?.id]);

    // Clear current conversation messages
    const clearConversation = useCallback(() => {
        if (!activeConversation) return;
        const cleared = { ...activeConversation, messages: [] };
        updateConversation(cleared);
        showToast?.('Chat cleared', 'info');
    }, [activeConversation, updateConversation, showToast]);

    // Filter conversations based on search - Memoized for performance
    const filteredConversations = useMemo(() => {
        if (!searchTerm) return conversations;
        const term = searchTerm.toLowerCase();

        return conversations.filter(conv => {
            switch (searchFilter) {
                case 'title':
                    return conv.title.toLowerCase().includes(term);
                case 'content':
                    return conv.messages.some(msg => msg.content.toLowerCase().includes(term));
                default:
                    return conv.title.toLowerCase().includes(term) ||
                        conv.messages.some(msg => msg.content.toLowerCase().includes(term));
            }
        });
    }, [conversations, searchTerm, searchFilter]);

    return {
        conversations,
        activeConversation,
        setActiveConversation,
        filteredConversations,
        searchTerm,
        setSearchTerm,
        searchFilter,
        setSearchFilter,
        createConversation,
        deleteConversation,
        updateConversation,
        clearConversation
    };
};

export default useConversations;
