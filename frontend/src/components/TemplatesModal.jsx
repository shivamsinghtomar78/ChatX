import React, { memo } from 'react';
import TemplateCard from './TemplateCard';

const TemplatesModal = memo(({ 
  showTemplates, 
  setShowTemplates, 
  templates, 
  theme, 
  setMessage, 
  showToastMessage,
  textareaRef
}) => {
  if (!showTemplates) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={() => setShowTemplates(false)}
      role="dialog"
      aria-labelledby="templates-modal-title"
      aria-modal="true"
    >
      <div 
        className={`modal ${theme}`} 
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <h2 id="templates-modal-title" className={`modal-title ${theme}`}>Conversation Templates</h2>
        <div className={`templates-grid ${theme}`}>
          {templates.map((template, idx) => (
            <TemplateCard
              key={idx}
              template={template}
              theme={theme}
              onClick={() => {
                setMessage(template.prompt);
                setShowTemplates(false);
                textareaRef.current?.focus();
                showToastMessage('Template applied', 'success');
              }}
            />
          ))}
        </div>
        <button 
          className={`modal-close ${theme}`} 
          onClick={() => setShowTemplates(false)}
          aria-label="Close templates modal"
        >
          ×
        </button>
      </div>
    </div>
  );
});

TemplatesModal.displayName = 'TemplatesModal';

export default TemplatesModal;