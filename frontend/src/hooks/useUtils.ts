"use client";

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to detect mobile viewport
 */
export const useMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [windowHeight, setWindowHeight] = useState(600);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            setWindowHeight(window.innerHeight);
        };

        checkMobile();

        let resizeTimer: NodeJS.Timeout;
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
export const useDebounce = <T>(value: T, delay = 300): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
};

/**
 * Custom hook for clipboard operations
 */
export const useClipboard = (showToast?: (msg: string, type?: 'success' | 'error') => void) => {
    const copy = useCallback(async (text: string) => {
        if (typeof window === 'undefined') return false;
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
    const [reactions, setReactions] = useState<Record<string, string | null>>({});
    const [pinnedMessages, setPinnedMessages] = useState<string[]>([]);

    const toggleReaction = useCallback((msgId: string, reaction: string) => {
        setReactions(prev => ({
            ...prev,
            [msgId]: prev[msgId] === reaction ? null : reaction
        }));
    }, []);

    const togglePin = useCallback((msgId: string) => {
        setPinnedMessages(prev =>
            prev.includes(msgId)
                ? prev.filter(id => id !== msgId)
                : [...prev, msgId]
        );
    }, []);

    return { reactions, pinnedMessages, toggleReaction, togglePin };
};
