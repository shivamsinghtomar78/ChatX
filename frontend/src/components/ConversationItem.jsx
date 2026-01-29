import React, { forwardRef, useCallback } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Trash2, MessageSquare, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

const formatDate = (date) => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Recent';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
};

const ConversationItem = forwardRef(({ 
  conversation, 
  isActive, 
  onClick, 
  onDelete,
  theme
}, ref) => {
  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm(`Delete "${conversation.title}"?`)) {
      onDelete?.(conversation.id);
    }
  }, [conversation.id, conversation.title, onDelete]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  }, [onClick]);

  return (
    <Card
      ref={ref}
      className={cn(
        "group cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
        "mb-2 sm:mb-3 md:mb-2",
        "animate-in fade-in-0 slide-in-from-left-2 duration-200",
        isActive && "ring-2 ring-primary shadow-md bg-primary/5"
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Conversation: ${conversation.title}, ${conversation.messages.length} messages`}
      aria-current={isActive ? "page" : undefined}
    >
      <div className="flex items-center justify-between p-3 sm:p-4 md:p-3 gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-medium truncate text-sm sm:text-base md:text-sm mb-1",
            isActive && "text-primary"
          )}>
            {conversation.title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatDate(conversation.createdAt)}</span>
            </div>
            <Badge variant={isActive ? "default" : "secondary"} className="text-xs h-5">
              <MessageSquare className="w-3 h-3 mr-1" />
              {conversation.messages.length}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 opacity-0 group-hover:opacity-100 transition-all",
            "hover:bg-destructive hover:text-destructive-foreground"
          )}
          onClick={handleDelete}
          aria-label="Delete conversation"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
});

ConversationItem.displayName = 'ConversationItem';

export default ConversationItem;