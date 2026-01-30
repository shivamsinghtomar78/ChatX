"use client";

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';
import ConversationItem from './ConversationItem';
import { Conversation } from '@/types/chat';
import { cn } from '@/lib/utils';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isMobile: boolean;
    conversations: Conversation[];
    activeConversation: Conversation | null;
    onSelectConversation: (conv: Conversation) => void;
    onCreateConversation: () => void;
    onDeleteConversation: (id: string) => void;
    searchTerm: string;
    onSearchChange: (value: string) => void;
}

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
}: SidebarProps) => {
    const [localSearch, setLocalSearch] = useState(searchTerm || '');
    const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setLocalSearch(searchTerm || '');
    }, [searchTerm]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocalSearch(value);

        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }

        searchTimerRef.current = setTimeout(() => {
            onSearchChange?.(value);
        }, 300);
    }, [onSearchChange]);

    useEffect(() => {
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, []);

    const handleConversationClick = useCallback((conv: Conversation) => {
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
            {/* Overlay for Mobile */}
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="p-4 flex items-center justify-between gap-2 border-b border-border">
                    <button
                        onClick={handleNewChat}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all font-medium active:scale-95"
                    >
                        <Plus size={18} />
                        <span>New Chat</span>
                    </button>

                    {isMobile && (
                        <button
                            onClick={onClose}
                            className="p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Search */}
                <div className="p-4">
                    <div className="relative group">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
                        />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={localSearch}
                            onChange={handleSearchChange}
                            className="w-full pl-10 pr-4 py-2 bg-muted text-sm rounded-lg border border-transparent focus:border-primary focus:bg-background outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
                    {conversations.length === 0 ? (
                        <div className="py-10 text-center px-4">
                            <p className="text-sm font-medium text-foreground">No conversations</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {localSearch ? 'No matches found' : 'Click "New Chat" to start'}
                            </p>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <ConversationItem
                                key={conv.id}
                                conversation={conv}
                                isActive={activeConversation?.id === conv.id}
                                onClick={() => handleConversationClick(conv)}
                                onDelete={() => onDeleteConversation?.(conv.id)}
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
