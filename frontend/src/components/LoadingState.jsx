import React from 'react';
import { Skeleton } from './ui/skeleton';
import { Card } from './ui/card';

export const MessageSkeleton = () => (
  <div className="flex gap-3 mb-6">
    <Skeleton className="w-8 h-8 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

export const ConversationSkeleton = () => (
  <Card className="mb-2">
    <div className="p-3 space-y-2">
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-8" />
      </div>
    </div>
  </Card>
);

export const TypingIndicator = () => (
  <div className="flex gap-3 mb-6">
    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
      🤖
    </div>
    <Card className="inline-block">
      <div className="p-3 flex gap-1">
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </Card>
  </div>
);
