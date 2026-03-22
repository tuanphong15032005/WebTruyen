import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

const THEME_STORAGE_KEY = 'theme';
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)';

export const ThemeContext = createContext({
    theme: 'light',
    resolvedTheme: 'light',
    themePreference: null,
    isSystemTheme: true,
    toggleTheme: () => {},
    setTheme: () => {},
    setThemePreference: () => {},
    useSystemTheme: () => {},
});

function isBrowser() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function readStoredThemePreference() {
    if (!isBrowser()) return null;

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
}

function getSystemTheme() {
    if (!isBrowser()) return 'light';

    return window.matchMedia?.(SYSTEM_THEME_QUERY).matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    if (!isBrowser()) return;

    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
}

function getInitialThemeState() {
    const themePreference = readStoredThemePreference();
    const systemTheme = getSystemTheme();
    const resolvedTheme = themePreference ?? systemTheme;
    applyTheme(resolvedTheme);

    return {
        themePreference,
        systemTheme,
    };
}

export function ThemeProvider({ children }) {
    const [{ themePreference, systemTheme }, setThemeState] = useState(getInitialThemeState);

    const resolvedTheme = themePreference ?? systemTheme;

    useEffect(() => {
        if (!isBrowser()) return undefined;

        const mediaQuery = window.matchMedia?.(SYSTEM_THEME_QUERY);
        if (!mediaQuery) return undefined;

        const handleChange = (event) => {
            setThemeState((prev) => ({
                ...prev,
                systemTheme: event.matches ? 'dark' : 'light',
            }));
        };

        mediaQuery.addEventListener?.('change', handleChange);

        return () => {
            mediaQuery.removeEventListener?.('change', handleChange);
        };
    }, []);

    useEffect(() => {
        applyTheme(resolvedTheme);

        if (!isBrowser()) return;

        if (themePreference) {
            window.localStorage.setItem(THEME_STORAGE_KEY, themePreference);
        } else {
            window.localStorage.removeItem(THEME_STORAGE_KEY);
        }
    }, [resolvedTheme, themePreference]);

    const setThemePreference = useCallback((nextPreference) => {
        setThemeState((prev) => ({
            ...prev,
            themePreference:
                nextPreference === 'light' || nextPreference === 'dark'
                    ? nextPreference
                    : null,
        }));
    }, []);

    const setTheme = useCallback(
        (nextTheme) => {
            setThemePreference(nextTheme);
        },
        [setThemePreference],
    );

    const useSystemTheme = useCallback(() => {
        setThemePreference(null);
    }, [setThemePreference]);

    const toggleTheme = useCallback(() => {
        setThemePreference(resolvedTheme === 'dark' ? 'light' : 'dark');
    }, [resolvedTheme, setThemePreference]);

    const value = useMemo(
        () => ({
            theme: resolvedTheme,
            resolvedTheme,
            themePreference,
            isSystemTheme: themePreference === null,
            toggleTheme,
            setTheme,
            setThemePreference,
            useSystemTheme,
        }),
        [resolvedTheme, setTheme, setThemePreference, themePreference, toggleTheme, useSystemTheme],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    return useContext(ThemeContext);
}
