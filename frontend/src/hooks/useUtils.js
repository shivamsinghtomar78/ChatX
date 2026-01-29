import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to detect mobile viewport and handle responsive behavior
 */
export const useMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [windowHeight, setWindowHeight] = useState(600);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            setWindowHeight(window.innerHeight);
        };

        checkMobile();

        let resizeTimer;
        const handleResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(checkMobile, 150);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimer);
        };
    }, []);

    return { isMobile, windowHeight };
};

/**
 * Custom hook for debounced value
 */
export const useDebounce = (value, delay = 300) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
};

/**
 * Custom hook for clipboard operations
 */
export const useClipboard = (showToast) => {
    const copy = useCallback(async (text) => {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                showToast?.('Copied to clipboard', 'success');
                return true;
            }
        } catch (e) {
            showToast?.('Failed to copy', 'error');
        }
        return false;
    }, [showToast]);

    return { copy };
};

/**
 * Custom hook for message reactions and pins
 */
export const useMessageActions = () => {
    const [reactions, setReactions] = useState({});
    const [pinnedMessages, setPinnedMessages] = useState([]);

    const toggleReaction = useCallback((msgId, reaction) => {
        setReactions(prev => ({
            ...prev,
            [msgId]: prev[msgId] === reaction ? null : reaction
        }));
    }, []);

    const togglePin = useCallback((msgId) => {
        setPinnedMessages(prev =>
            prev.includes(msgId)
                ? prev.filter(id => id !== msgId)
                : [...prev, msgId]
        );
    }, []);

    return { reactions, pinnedMessages, toggleReaction, togglePin };
};

export default useMobile;
