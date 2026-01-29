import React, { memo } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

const Toast = memo(({ toast, onClose }) => {
    if (!toast?.show) return null;

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return <CheckCircle size={18} />;
            case 'error':
                return <AlertCircle size={18} />;
            default:
                return <Info size={18} />;
        }
    };

    return (
        <div className={`toast toast-${toast.type || 'info'}`} role="alert">
            <span className="toast-icon">{getIcon()}</span>
            <span className="toast-message">{toast.message}</span>
            <button
                className="toast-close"
                onClick={onClose}
                aria-label="Close notification"
            >
                <X size={14} />
            </button>
        </div>
    );
});

Toast.displayName = 'Toast';

export default Toast;
