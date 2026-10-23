import { createContext } from 'react';
import { IThemeContextValue } from '../Contracts/IThemeContextValue';

export const ThemeContext = createContext<IThemeContextValue | null>(null);
