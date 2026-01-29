import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage theme state and preferences
 * Supports: light, dark, high-contrast, sepia, midnight
 */
export const useTheme = () => {
    const [theme, setThemeState] = useState('dark');

    // Get system preference
    const getSystemTheme = useCallback(() => {
        if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }, []);

    // Initialize theme from localStorage or system preference
    useEffect(() => {
        const savedTheme = localStorage.getItem('chatx-theme');
        const initialTheme = savedTheme || getSystemTheme();
        setThemeState(initialTheme);
        document.body.className = initialTheme;

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            if (!localStorage.getItem('chatx-theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                setThemeState(newTheme);
                document.body.className = newTheme;
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [getSystemTheme]);

    // Set theme and persist to localStorage
    const setTheme = useCallback((newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem('chatx-theme', newTheme);
        document.body.className = newTheme;
    }, []);

    // Reset to system preference
    const resetToSystem = useCallback(() => {
        localStorage.removeItem('chatx-theme');
        const systemTheme = getSystemTheme();
        setThemeState(systemTheme);
        document.body.className = systemTheme;
    }, [getSystemTheme]);

    return { theme, setTheme, resetToSystem };
};

export default useTheme;
