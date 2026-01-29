import React, { memo } from 'react';
import { X, Download, Trash2, Share2, Settings } from 'lucide-react';
import './Modals.css';

const ActionsModal = memo(({ onClose, onExport, onClearChat }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content small" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Chat Actions</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="actions-list">
            <button className="action-item" onClick={() => { onExport(); onClose(); }}>
              <Download size={18} />
              <span>Export Conversation (.txt)</span>
            </button>
            <button className="action-item" onClick={() => { /* TODO: Share */ onClose(); }}>
              <Share2 size={18} />
              <span>Share Link</span>
            </button>
            <div className="divider" />
            <button className="action-item" onClick={() => { /* TODO: Settings */ onClose(); }}>
              <Settings size={18} />
              <span>Settings</span>
            </button>
            <button className="action-item danger" onClick={() => { onClearChat(); onClose(); }}>
              <Trash2 size={18} />
              <span>Clear Chat History</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ActionsModal.displayName = 'ActionsModal';

export default ActionsModal;