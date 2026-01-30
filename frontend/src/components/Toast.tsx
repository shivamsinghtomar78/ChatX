"use client";

import React, { memo } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
    toast: {
        show: boolean;
        message: string;
        type: 'success' | 'error' | 'info';
    };
    onClose: () => void;
}

const Toast = memo(({ toast, onClose }: ToastProps) => {
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
        <div
            className={cn(
                "fixed bottom-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border animate-in slide-in-from-right-10 duration-300",
                toast.type === 'success' && "bg-green-500/10 text-green-500 border-green-500/20",
                toast.type === 'error' && "bg-destructive/10 text-destructive border-destructive/20",
                toast.type === 'info' && "bg-primary/10 text-primary border-primary/20",
                "bg-card" // base background
            )}
            role="alert"
        >
            <span className="shrink-0">{getIcon()}</span>
            <span className="text-sm font-medium pr-4">{toast.message}</span>
            <button
                className="p-1 hover:bg-black/5 rounded-md transition-colors shrink-0"
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
