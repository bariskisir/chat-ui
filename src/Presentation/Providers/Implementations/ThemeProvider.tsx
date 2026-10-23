import { FC, useState, useEffect, useMemo, useCallback } from 'react';
import { IThemeProviderProps } from '../Definitions/IThemeProviderProps';
import { ThemeContext } from '../../Contexts/ThemeContext';
import { ThemeMode } from '../../../Core/Domain/Enums/ThemeMode';
import { IThemeContextValue } from '../../Contracts/IThemeContextValue';

const ThemeStorageKey = 'cui_theme_mode_v1';

export const ThemeProvider: FC<IThemeProviderProps> = ({ children }) =>
{
  const [theme, setThemeState] = useState<ThemeMode>(() =>
  {
    const stored = localStorage.getItem(ThemeStorageKey);
    if (stored === ThemeMode.Dark || stored === ThemeMode.Light)
    {
      return stored as ThemeMode;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? ThemeMode.Dark
      : ThemeMode.Light;
  });

  useEffect(() =>
  {
    document.documentElement.setAttribute('data-cui-theme', theme);
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(theme === ThemeMode.Dark ? 'theme-dark' : 'theme-light');
    localStorage.setItem(ThemeStorageKey, theme);
  }, [theme]);

  const toggleTheme = useCallback(() =>
  {
    setThemeState((prev) => (prev === ThemeMode.Light ? ThemeMode.Dark : ThemeMode.Light));
  }, []);

  const setTheme = useCallback((mode: ThemeMode) =>
  {
    setThemeState(mode);
  }, []);

  const value = useMemo<IThemeContextValue>(() =>
  {
    return {
      Theme: theme,
      ToggleTheme: toggleTheme,
      SetTheme: setTheme
    };
  }, [theme, toggleTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
