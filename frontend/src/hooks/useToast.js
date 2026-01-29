import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook to manage toast notifications
 * Extracted from App.js for reusability
 */
export const useToast = () => {
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    const showToast = useCallback((message, type = 'info') => {
        setToast({ show: true, message, type });
    }, []);

    const hideToast = useCallback(() => {
        setToast({ show: false, message: '', type: '' });
    }, []);

    // Auto-hide toast after 3 seconds
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(hideToast, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show, hideToast]);

    return { toast, showToast, hideToast };
};

export default useToast;
