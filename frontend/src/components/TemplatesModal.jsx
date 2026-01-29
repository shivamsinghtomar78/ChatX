import React, { memo } from 'react';
import { X, FileText, Mail, Briefcase, Layout, Database, HelpCircle } from 'lucide-react';
import './Modals.css';

const TEMPLATES = [
  { title: 'Code Review', prompt: 'Review this code for bugs, security issues, and improvements:\n\n[Paste your code here]', icon: <Database size={20} /> },
  { title: 'Email Writer', prompt: 'Write a professional email about: [topic]', icon: <Mail size={20} /> },
  { title: 'Business Plan', prompt: 'Create a comprehensive business plan for: [business idea]', icon: <Briefcase size={20} /> },
  { title: 'Content Creator', prompt: 'Write engaging content about: [topic] for [platform]', icon: <Layout size={20} /> },
  { title: 'Data Analysis', prompt: 'Analyze this data and provide insights:\n\n[Paste data here]', icon: <FileText size={20} /> },
  { title: 'Help Me Solve', prompt: 'Help me solve this problem: [describe problem]', icon: <HelpCircle size={20} /> }
];

const TemplatesModal = memo(({ onClose, onSelect }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Prompt Templates</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="templates-grid">
            {TEMPLATES.map((template, idx) => (
              <button
                key={idx}
                className="template-card"
                onClick={() => {
                  onSelect(template.prompt);
                  onClose();
                }}
              >
                <div className="template-icon">{template.icon}</div>
                <div className="template-info">
                  <h3>{template.title}</h3>
                  <p className="template-prompt-preview">{template.prompt.substring(0, 50)}...</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

TemplatesModal.displayName = 'TemplatesModal';

export default TemplatesModal;