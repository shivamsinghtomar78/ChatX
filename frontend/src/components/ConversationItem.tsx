"use client";

import React from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import { Conversation } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ConversationItemProps {
    conversation: Conversation;
    isActive: boolean;
    onClick: () => void;
    onDelete: () => void;
}

const ConversationItem = ({
    conversation,
    isActive,
    onClick,
    onDelete
}: ConversationItemProps) => {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative flex items-center gap-3 px-3 py-3 cursor-pointer rounded-lg transition-all duration-200",
                "hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
        >
            <MessageSquare size={18} className="shrink-0" />
            <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">
                    {conversation.title || "New Chat"}
                </p>
                {conversation.messages.length > 0 && (
                    <p className="text-xs opacity-50 truncate">
                        {conversation.messages[conversation.messages.length - 1].content}
                    </p>
                )}
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className={cn(
                    "opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive hover:text-destructive-foreground transition-all",
                    isActive && "opacity-100"
                )}
                aria-label="Delete conversation"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
};

export default ConversationItem;
