import { FC } from 'react';
import clsx from 'clsx';
import { Sun, Moon } from 'lucide-react';
import { IThemeToggleProps } from '../Definitions/IThemeToggleProps';
import { UseTheme } from '../../../Hooks/UseTheme';
import { ThemeMode } from '../../../../Core/Domain/Enums/ThemeMode';

export const ThemeToggle: FC<IThemeToggleProps> = ({ className }) =>
{
  const { Theme, ToggleTheme } = UseTheme();
  const isDark = Theme === ThemeMode.Dark;
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <button
      type="button"
      onClick={ToggleTheme}
      title={label}
      aria-label={label}
      className={clsx('cui-agent-theme-toggle', className)}
    >
      {isDark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
    </button>
  );
};
