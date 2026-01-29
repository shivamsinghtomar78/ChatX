import React, { memo } from 'react';

const ActionItem = memo(({ action, onClick, theme }) => {
  return (
    <button 
      className={`action-item ${theme}`} 
      onClick={onClick}
      aria-label={action.label}
    >
      <span className={`action-icon ${theme}`}>{action.icon}</span>
      <div className={`action-content ${theme}`}>
        <span className={`action-title ${theme}`}>{action.title}</span>
        <span className={`action-desc ${theme}`}>{action.description}</span>
      </div>
    </button>
  );
});

ActionItem.displayName = 'ActionItem';

export default ActionItem;