import { FC, useRef, useState } from 'react';
import clsx from 'clsx';
import { Check, Globe, Power } from 'lucide-react';
import { WebSearchMode, WebSearchModes } from '../../../../Core/Domain/Enums/WebSearchMode';
import { SearchEngineIcon } from '../../Common/Implementations/SearchEngineIcon';
import { ComposerPopover } from './ComposerPopover';

interface IWebSearchControlProps
{
  value: WebSearchMode;
  disabled: boolean;
  onChange(mode: WebSearchMode): void;
}

const Labels: Record<WebSearchMode, string> =
{
  off: 'Off',
  google: 'Google',
  bing: 'Bing',
  duckduckgo: 'DuckDuckGo'
};

const Descriptions: Record<WebSearchMode, string> =
{
  off: 'Do not add current web results to the request.',
  google: 'Search current sources with Google.',
  bing: 'Search current sources with Bing.',
  duckduckgo: 'Search current sources with DuckDuckGo.'
};

export const WebSearchControl: FC<IWebSearchControlProps> =
({ value, disabled, onChange }) =>
{
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isActive = value !== 'off';

  const handleSelect = (mode: WebSearchMode) =>
  {
    onChange(mode);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        disabled={disabled}
        className={clsx(
          'cui-agent-composer-tool',
          'cui-agent-composer-tool--icon',
          isActive && 'cui-agent-composer-tool--active'
        )}
        title="Web search"
        aria-label="Web search"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-pressed={isActive}
      >
        {value === 'off'
          ? <Globe size={16} strokeWidth={2} />
          : <SearchEngineIcon mode={value} size={16} />}
      </button>

      <ComposerPopover
        isOpen={isOpen}
        anchorRef={buttonRef}
        onClose={() => setIsOpen(false)}
      >
        <div className="cui-composer-popover__title">Web search</div>
        <div className="cui-composer-popover__choices">
          {WebSearchModes.map((mode) =>
          {
            const isSelected = mode === value;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => handleSelect(mode)}
                className={clsx(
                  'cui-composer-choice',
                  isSelected && 'cui-composer-choice--selected'
                )}
                aria-pressed={isSelected}
              >
                <span className="cui-composer-choice__icon">
                  {mode === 'off'
                    ? <Power size={16} />
                    : <SearchEngineIcon mode={mode} size={16} />}
                </span>
                <span className="cui-composer-choice__text">
                  <strong>{Labels[mode]}</strong>
                  <small>{Descriptions[mode]}</small>
                </span>
                {isSelected && <Check className="cui-composer-choice__check" size={15} />}
              </button>
            );
          })}
        </div>
      </ComposerPopover>
    </>
  );
};
