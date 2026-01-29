import React, { memo } from 'react';

const TemplateCard = memo(({ template, onClick, theme }) => {
  return (
    <div 
      className={`template-card ${theme}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <h3 className={`template-title ${theme}`}>{template.title}</h3>
      <p className={`template-description ${theme}`}>{template.prompt.substring(0, 60)}...</p>
    </div>
  );
});

TemplateCard.displayName = 'TemplateCard';

export default TemplateCard;