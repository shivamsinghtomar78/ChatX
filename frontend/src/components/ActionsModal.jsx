import React, { memo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Download, Trash2, RefreshCw, FileText, Share2 } from 'lucide-react';
import { cn } from '../lib/utils';

const actions = [
  { id: 'export', icon: Download, title: 'Export Chat', description: 'Download conversation as text file' },
  { id: 'clear', icon: Trash2, title: 'Clear Chat', description: 'Remove all messages', variant: 'destructive' },
  { id: 'regenerate', icon: RefreshCw, title: 'Regenerate Response', description: 'Get a new response' },
  { id: 'summary', icon: FileText, title: 'Generate Summary', description: 'Create a summary' },
  { id: 'share', icon: Share2, title: 'Share Conversation', description: 'Share with others' },
];

const ActionsModal = memo(({ isOpen, onClose, onRegenerate, onSummary, onShare, theme }) => {
  const handlers = {
    export: useCallback(() => { onClose(); }, [onClose]),
    clear: useCallback(() => { onClose(); }, [onClose]),
    regenerate: useCallback(() => { onRegenerate?.(); onClose(); }, [onRegenerate, onClose]),
    summary: useCallback(() => { onSummary?.(); onClose(); }, [onSummary, onClose]),
    share: useCallback(() => { onShare?.(); onClose(); }, [onShare, onClose]),
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chat Actions</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          {actions.map(({ id, icon: Icon, title, description, variant }) => (
            <Button
              key={id}
              variant={variant || 'outline'}
              className={cn("justify-start h-auto py-3", variant === 'destructive' && "text-destructive-foreground")}
              onClick={handlers[id]}
            >
              <Icon className="mr-3 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">{title}</div>
                <div className="text-xs text-muted-foreground">{description}</div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
});

ActionsModal.displayName = 'ActionsModal';

export default ActionsModal;