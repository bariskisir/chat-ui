import { useContext } from 'react';
import { ThemeContext } from '../Contexts/ThemeContext';
import { IThemeContextValue } from '../Contracts/IThemeContextValue';

export function UseTheme(): IThemeContextValue
{
  const context = useContext(ThemeContext);
  if (!context)
  {
    throw new Error('UseTheme must be used within a ThemeProvider');
  }
  return context;
}
