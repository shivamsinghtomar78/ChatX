"use client";

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage theme state and preferences
 */
export const useTheme = () => {
    const [theme, setThemeState] = useState<string>('dark');

    // Get system preference
    const getSystemTheme = useCallback(() => {
        if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }, []);

    // Initialize theme
    useEffect(() => {
        const savedTheme = localStorage.getItem('chatx-theme');
        const initialTheme = savedTheme || getSystemTheme();
        setThemeState(initialTheme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(initialTheme);

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            if (!localStorage.getItem('chatx-theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                setThemeState(newTheme);
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(newTheme);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [getSystemTheme]);

    // Set theme
    const setTheme = useCallback((newTheme: string) => {
        setThemeState(newTheme);
        localStorage.setItem('chatx-theme', newTheme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newTheme);
    }, []);

    const resetToSystem = useCallback(() => {
        localStorage.removeItem('chatx-theme');
        const systemTheme = getSystemTheme();
        setThemeState(systemTheme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(systemTheme);
    }, [getSystemTheme]);

    return { theme, setTheme, resetToSystem };
};

export default useTheme;
