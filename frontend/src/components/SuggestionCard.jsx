import React, { memo } from 'react';
import { Card, CardContent } from './ui/card';
import { Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

const SuggestionCard = memo(({ title, description, onClick, theme, icon }) => {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        "hover:border-primary/50 group",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
      aria-label={`${title}: ${description}`}
    >
      <CardContent className="p-3 sm:p-4 md:p-5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            {icon || <Sparkles className="h-4 w-4" />}
          </div>
          <h3 className="font-semibold text-sm sm:text-base md:text-lg">{title}</h3>
        </div>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
});

SuggestionCard.displayName = 'SuggestionCard';

export default SuggestionCard;