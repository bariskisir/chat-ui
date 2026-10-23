import { FC, useRef, useState } from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';
import { ReasoningEffort, ReasoningEfforts } from '../../../../Core/Domain/Enums/ReasoningEffort';
import { ReasoningLevelIcon } from '../../Common/Implementations/ReasoningLevelIcon';
import { ComposerPopover } from './ComposerPopover';

interface IReasoningControlProps
{
  value: ReasoningEffort;
  disabled: boolean;
  onChange(effort: ReasoningEffort): void;
}

const Labels: Record<ReasoningEffort, string> =
{
  off: 'Off',
  default: 'Default',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  xhigh: 'Extra High'
};

const Descriptions: Record<ReasoningEffort, string> =
{
  off: 'Explicitly disable optional reasoning.',
  default: 'Let the provider use the model default without sending an effort value.',
  low: 'Use a small reasoning budget for faster replies.',
  medium: 'Balance response speed and deeper reasoning.',
  high: 'Use a strong reasoning effort.',
  xhigh: 'Use the highest supported reasoning effort.'
};

export const ReasoningControl: FC<IReasoningControlProps> =
({ value, disabled, onChange }) =>
{
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isActive = value !== 'off' && value !== 'default';

  const handleSelect = (effort: ReasoningEffort) =>
  {
    onChange(effort);
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
        title="Reasoning"
        aria-label="Reasoning"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-pressed={isActive}
      >
        <ReasoningLevelIcon effort={value} size={16} />
      </button>

      <ComposerPopover
        isOpen={isOpen}
        anchorRef={buttonRef}
        onClose={() => setIsOpen(false)}
      >
        <div className="cui-composer-popover__title">Reasoning</div>
        <div className="cui-composer-popover__choices">
          {ReasoningEfforts.map((effort) =>
          {
            const isSelected = effort === value;
            return (
              <button
                key={effort}
                type="button"
                onClick={() => handleSelect(effort)}
                className={clsx(
                  'cui-composer-choice',
                  isSelected && 'cui-composer-choice--selected'
                )}
                aria-pressed={isSelected}
              >
                <span className="cui-composer-choice__icon">
                  <ReasoningLevelIcon effort={effort} size={16} />
                </span>
                <span className="cui-composer-choice__text">
                  <strong>{Labels[effort]}</strong>
                  <small>{Descriptions[effort]}</small>
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
