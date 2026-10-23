import { FC, useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { ChevronDown, Check } from 'lucide-react';
import { IModelSelectorProps } from '../Definitions/IModelSelectorProps';
import { UseModel } from '../../../Hooks/UseModel';
import { ModelIdentifier } from '../../../../Core/Domain/Enums/ModelIdentifier';

export const ModelSelector: FC<IModelSelectorProps> = ({ className }) =>
{
  const { SelectedModel, Models, CurrentDescriptor, SelectModel } = UseModel();
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

  return (
    <div className={clsx('cui-model-selector-container', className)} ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="cui-model-badge"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{CurrentDescriptor.Name}</span>
        <span className="cui-model-badge__tag">{CurrentDescriptor.Badge}</span>
        <ChevronDown size={13} strokeWidth={2.2} />
      </button>

      {isOpen && (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{m.Name}</span>
                    <span className="cui-model-badge__tag">{m.Badge}</span>
                  </div>
                  <span className="cui-model-dropdown__item-desc">{m.Tagline}</span>
                </div>
                {isSelected && <Check size={14} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
