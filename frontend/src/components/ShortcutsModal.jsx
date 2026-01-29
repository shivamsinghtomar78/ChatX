import React, { memo } from 'react';
import { X, Command } from 'lucide-react';
import './Modals.css';

const SHORTCUTS = [
  { key: 'Enter', description: 'Send message' },
  { key: 'Shift + Enter', description: 'New line' },
  { key: 'Ctrl + /', description: 'Open shortcuts' },
  { key: 'Ctrl + K', description: 'Search conversations' },
  { key: 'Ctrl + N', description: 'New conversation' },
  { key: 'Escape', description: 'Close modal' }
];

const ShortcutsModal = memo(({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content small" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="title-with-icon">
            <Command size={20} />
            <h2>Keyboard Shortcuts</h2>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="shortcuts-list">
            {SHORTCUTS.map((s, idx) => (
              <div key={idx} className="shortcut-item">
                <span className="shortcut-desc">{s.description}</span>
                <kbd className="shortcut-key">{s.key}</kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

ShortcutsModal.displayName = 'ShortcutsModal';

export default ShortcutsModal;