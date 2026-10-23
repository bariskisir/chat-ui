import { ThemeMode } from '../../Core/Domain/Enums/ThemeMode';

export interface IThemeContextValue
{
  Theme: ThemeMode;
  ToggleTheme(): void;
  SetTheme(mode: ThemeMode): void;
}
