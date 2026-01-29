import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';
import ConversationItem from './ConversationItem';
import './Sidebar.css';

const Sidebar = memo(({
    isOpen,
    onClose,
    isMobile,
    conversations,
    activeConversation,
    onSelectConversation,
    onCreateConversation,
    onDeleteConversation,
    searchTerm,
    onSearchChange,
    theme
}) => {
    const [localSearch, setLocalSearch] = useState(searchTerm || '');
    const searchTimerRef = useRef(null);

    // Sync local search with external search term if it changes
    useEffect(() => {
        setLocalSearch(searchTerm || '');
    }, [searchTerm]);

    // Debounced search
    const handleSearchChange = useCallback((e) => {
        const value = e.target.value;
        setLocalSearch(value);

        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }

        searchTimerRef.current = setTimeout(() => {
            onSearchChange?.(value);
        }, 300);
    }, [onSearchChange]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, []);

    const handleConversationClick = useCallback((conv) => {
        onSelectConversation?.(conv);
        if (isMobile) {
            onClose?.();
        }
    }, [onSelectConversation, isMobile, onClose]);

    const handleNewChat = useCallback(() => {
        onCreateConversation?.();
        if (isMobile) {
            onClose?.();
        }
    }, [onCreateConversation, isMobile, onClose]);

    return (
        <>
            {/* Overlay */}
            {isMobile && isOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${isOpen ? 'open' : ''} ${theme}`}>
                {/* Header */}
                <div className="sidebar-header">
                    <button
                        onClick={handleNewChat}
                        className="new-chat-btn"
                        aria-label="Create new conversation"
                    >
                        <Plus size={18} />
                        <span>New Chat</span>
                    </button>

                    {isMobile && (
                        <button
                            onClick={onClose}
                            className="close-sidebar-btn"
                            aria-label="Close sidebar"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Search */}
                <div className="sidebar-search">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={localSearch}
                        onChange={handleSearchChange}
                        className="search-input"
                        aria-label="Search conversations"
                    />
                </div>

                {/* Conversations List */}
                <div className="conversations-list">
                    {conversations.length === 0 ? (
                        <div className="empty-state">
                            <p>No conversations yet</p>
                            <p className="hint">{localSearch ? 'No matches found' : 'Click "New Chat" to start'}</p>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <ConversationItem
                                key={conv.id}
                                conversation={conv}
                                isActive={activeConversation?.id === conv.id}
                                onClick={() => handleConversationClick(conv)}
                                onDelete={() => onDeleteConversation?.(conv.id)}
                                theme={theme}
                            />
                        ))
                    )}
                </div>
            </aside>
        </>
    );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
