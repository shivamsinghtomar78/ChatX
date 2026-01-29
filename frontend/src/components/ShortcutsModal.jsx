import React, { memo } from 'react';

const ShortcutsModal = memo(({ showShortcuts, setShowShortcuts, theme }) => {
  if (!showShortcuts) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={() => setShowShortcuts(false)}
      role="dialog"
      aria-labelledby="shortcuts-modal-title"
      aria-modal="true"
    >
      <div 
        className={`modal ${theme}`} 
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <h2 id="shortcuts-modal-title" className={`modal-title ${theme}`}>Keyboard Shortcuts</h2>
        <div className={`shortcuts-list ${theme}`}>
          <div className={`shortcut-item ${theme}`}>
            <kbd className={`kbd ${theme}`}>Ctrl</kbd> + <kbd className={`kbd ${theme}`}>K</kbd>
            <span className={`shortcut-text ${theme}`}>Show shortcuts</span>
          </div>
          <div className={`shortcut-item ${theme}`}>
            <kbd className={`kbd ${theme}`}>Enter</kbd>
            <span className={`shortcut-text ${theme}`}>Send message</span>
          </div>
          <div className={`shortcut-item ${theme}`}>
            <kbd className={`kbd ${theme}`}>Shift</kbd> + <kbd className={`kbd ${theme}`}>Enter</kbd>
            <span className={`shortcut-text ${theme}`}>New line</span>
          </div>
          <div className={`shortcut-item ${theme}`}>
            <kbd className={`kbd ${theme}`}>Esc</kbd>
            <span className={`shortcut-text ${theme}`}>Close modals</span>
          </div>
        </div>
        <button 
          className={`modal-close ${theme}`} 
          onClick={() => setShowShortcuts(false)}
          aria-label="Close shortcuts modal"
        >
          ×
        </button>
      </div>
    </div>
  );
});

ShortcutsModal.displayName = 'ShortcutsModal';

export default ShortcutsModal;