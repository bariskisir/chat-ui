import { FC, useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { IModelSelectorProps } from '../Definitions/IModelSelectorProps';
import { UseModel } from '../../../Hooks/UseModel';
import { ModelIdentifier } from '../../../../Core/Domain/Enums/ModelIdentifier';
import { ServiceProviderType } from '../../../../Core/Domain/Enums/ServiceProviderType';

const ProviderLabels: Record<ServiceProviderType, string> =
{
  [ServiceProviderType.Mock]: 'Mock',
  [ServiceProviderType.OpenCode]: 'OpenCode',
  [ServiceProviderType.OpenAI]: 'OpenAI',
  [ServiceProviderType.Anthropic]: 'Anthropic',
  [ServiceProviderType.Custom]: 'Custom'
};

export const ModelSelector: FC<IModelSelectorProps> = ({ className }) =>
{
  const { SelectedModel, Models, CurrentDescriptor, IsLoading, ErrorMessage, SelectModel } = UseModel();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() =>
  {
    const handleClickOutside = (event: MouseEvent) =>
    {
      if (containerRef.current && !containerRef.current.contains(event.target as Node))
      {
        setIsOpen(false);
      }
    };

    if (isOpen)
    {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () =>
    {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (id: ModelIdentifier) =>
  {
    SelectModel(id);
    setIsOpen(false);
  };

  const isUnavailable = CurrentDescriptor === null;
  const badgeText = CurrentDescriptor?.Name
    ?? (IsLoading ? 'Loading models...' : ErrorMessage ? 'Models unavailable' : 'No models available');

  return (
    <div className={clsx('cui-model-selector-container', className)} ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="cui-model-badge"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={isUnavailable}
        title={ErrorMessage ?? undefined}
      >
        <span>{badgeText}</span>
        {CurrentDescriptor && (
          <span className="cui-model-badge__tag">{CurrentDescriptor.Badge}</span>
        )}
        <ChevronDown size={13} strokeWidth={2.2} />
      </button>

      {isOpen && Models.length > 0 && (
        <div className="cui-model-dropdown" role="listbox">
          {Models.map((m) =>
          {
            const isSelected = m.Id === SelectedModel;
            return (
              <button
                key={m.Id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(m.Id)}
                className={clsx(
                  'cui-model-dropdown__item',
                  isSelected && 'cui-model-dropdown__item--selected'
                )}
              >
                <div className="cui-model-dropdown__item-name">
                  <span className="cui-model-dropdown__item-text">
                    <span className="cui-model-dropdown__item-label">{m.Name}</span>
                    <small className="cui-model-dropdown__item-provider">
                      {ProviderLabels[m.Provider]}
                    </small>
                  </span>
                  <span className="cui-model-badge__tag">{m.Badge}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
