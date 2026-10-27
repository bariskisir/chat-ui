import {
  FC,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  KeyboardEvent
} from 'react';
import clsx from 'clsx';
import { ChevronDown, Search, Star, X } from 'lucide-react';
import { IModelSelectorProps } from '../Definitions/IModelSelectorProps';
import { UseModel } from '../../../Hooks/UseModel';
import { ModelIdentifier } from '../../../../Core/Domain/Enums/ModelIdentifier';
import { IModelDescriptor } from '../../../../Core/Domain/Entities/Definitions/IModelDescriptor';
import { BrowserStorageService } from '../../../../Infrastructure/Services/BrowserStorageService';

const FavoritesStorageKey = 'cui_favorite_models_v1';
const storage = new BrowserStorageService();

/** Reads the model identifiers saved as favorites. */
function ReadFavoriteModelIds(): ModelIdentifier[]
{
  const stored = storage.GetItem<unknown>(FavoritesStorageKey);
  if (!Array.isArray(stored))
  {
    return [];
  }

  return stored.filter((value): value is ModelIdentifier => typeof value === 'string');
}

/** Returns true when a model matches the normalized search text. */
function MatchesSearch(model: IModelDescriptor, query: string): boolean
{
  if (!query)
  {
    return true;
  }

  const haystack = `${model.Name} ${model.ProviderName} ${model.Id}`.toLowerCase();
  return haystack.includes(query);
}

export const ModelSelector: FC<IModelSelectorProps> = ({
  className,
  placement: preferredPlacement,
  isCentered = false
}) =>
{
  const { SelectedModel, Models, CurrentDescriptor, IsLoading, ErrorMessage, SelectModel } = UseModel();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteModelIds, setFavoriteModelIds] = useState<ModelIdentifier[]>(ReadFavoriteModelIds);
  const [actualPlacement, setActualPlacement] = useState<'top' | 'bottom'>(() =>
  {
    return preferredPlacement === 'bottom' ? 'bottom' : 'top';
  });
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredModels = useMemo(
    () => Models.filter((model) => MatchesSearch(model, normalizedSearch)),
    [Models, normalizedSearch]
  );
  const favoriteIdSet = useMemo(
    () => new Set(favoriteModelIds),
    [favoriteModelIds]
  );
  const favoriteModels = useMemo(
    () => filteredModels.filter((model) => favoriteIdSet.has(model.Id)),
    [filteredModels, favoriteIdSet]
  );
  const remainingModels = useMemo(
    () => filteredModels.filter((model) => !favoriteIdSet.has(model.Id)),
    [filteredModels, favoriteIdSet]
  );

  useEffect(() =>
  {
    storage.SetItem(FavoritesStorageKey, favoriteModelIds);
  }, [favoriteModelIds]);

  useEffect(() =>
  {
    const handleClickOutside = (event: MouseEvent) =>
    {
      if (containerRef.current && !containerRef.current.contains(event.target as Node))
      {
        setIsOpen(false);
        setSearchQuery('');
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

  useLayoutEffect(() =>
  {
    if (!isOpen)
    {
      return;
    }

    const updatePosition = () =>
    {
      const container = containerRef.current;
      if (!container)
      {
        return;
      }

      const rect = container.getBoundingClientRect();
      const scrollable = container.closest('.cui-agent-thread-scrollable') as HTMLElement | null;
      const topBoundary = scrollable
        ? Math.max(12, scrollable.getBoundingClientRect().top + 8)
        : 12;

      const spaceAbove = Math.max(120, rect.top - 8 - topBoundary);
      const targetPlacement = preferredPlacement === 'bottom' ? 'bottom' : 'top';
      const spaceBelow = Math.max(120, window.innerHeight - rect.bottom - 16);
      const desiredMaxHeight = 420;
      const availableSpace = targetPlacement === 'bottom' ? spaceBelow : spaceAbove;
      const computedMaxHeight = Math.max(120, Math.min(desiredMaxHeight, availableSpace));

      setActualPlacement(targetPlacement);
      setMaxHeight(computedMaxHeight);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () =>
    {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, preferredPlacement, isCentered]);

  useLayoutEffect(() =>
  {
    if (!isOpen)
    {
      return;
    }

    const list = listRef.current;
    const selectedItem = selectedItemRef.current;
    if (!list || !selectedItem)
    {
      return;
    }

    const targetScrollTop = selectedItem.offsetTop
      - (list.clientHeight - selectedItem.offsetHeight) / 2;

    list.scrollTop = Math.max(0, targetScrollTop);
  }, [isOpen, Models.length, maxHeight]);

  const handleToggleDropdown = () =>
  {
    setIsOpen((current) => !current);
    setSearchQuery('');
  };

  const handleSelect = (id: ModelIdentifier) =>
  {
    SelectModel(id);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleToggleFavorite = (id: ModelIdentifier) =>
  {
    setFavoriteModelIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) =>
  {
    if (event.key === 'Escape')
    {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const renderModel = (model: IModelDescriptor) =>
  {
    const isSelected = model.Id === SelectedModel;
    const isFavorite = favoriteIdSet.has(model.Id);
    const favoriteLabel = isFavorite
      ? `Remove ${model.Name} from favorites`
      : `Add ${model.Name} to favorites`;

    return (
      <div
        key={model.Id}
        role="presentation"
        className={clsx(
          'cui-model-dropdown__item',
          isSelected && 'cui-model-dropdown__item--selected'
        )}
      >
        <button
          type="button"
          role="option"
          aria-selected={isSelected}
          ref={isSelected ? selectedItemRef : undefined}
          onClick={() => handleSelect(model.Id)}
          className="cui-model-dropdown__select"
        >
          <div className="cui-model-dropdown__item-name">
            <span className="cui-model-dropdown__item-text">
              <span className="cui-model-dropdown__item-label">{model.Name}</span>
              <small className="cui-model-dropdown__item-provider">
                {model.ProviderName}
              </small>
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleToggleFavorite(model.Id)}
          className={clsx(
            'cui-model-dropdown__favorite',
            isFavorite && 'cui-model-dropdown__favorite--active'
          )}
          aria-label={favoriteLabel}
          aria-pressed={isFavorite}
          title={favoriteLabel}
        >
          <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
    );
  };

  const isUnavailable = CurrentDescriptor === null;
  const selectorText = CurrentDescriptor?.Name
    ?? (IsLoading ? 'Loading models...' : ErrorMessage ? 'Models unavailable' : 'No models available');

  return (
    <div className={clsx('cui-model-selector-container', className)} ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={handleToggleDropdown}
        className="cui-model-badge"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={isUnavailable}
        title={ErrorMessage ?? undefined}
      >
        <span>{selectorText}</span>
        <ChevronDown size={13} strokeWidth={2.2} />
      </button>

      {isOpen && Models.length > 0 && (
        <div
          className={clsx(
            'cui-model-dropdown',
            `cui-model-dropdown--${actualPlacement}`
          )}
          role="listbox"
          style={{
            maxHeight: maxHeight !== undefined ? `${maxHeight}px` : undefined
          }}
        >
          <div className="cui-model-dropdown__search">
            <Search size={14} strokeWidth={2} aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search models..."
              aria-label="Search models"
              autoComplete="off"
              spellCheck={false}
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="cui-model-dropdown__search-clear"
                aria-label="Clear model search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="cui-model-dropdown__list" ref={listRef}>
            {favoriteModels.length > 0 && (
              <>
                <div className="cui-model-dropdown__section">Favorites</div>
                {favoriteModels.map(renderModel)}
              </>
            )}

            {remainingModels.length > 0 && (
              <>
                {favoriteModels.length > 0 && (
                  <div className="cui-model-dropdown__section">All models</div>
                )}
                {remainingModels.map(renderModel)}
              </>
            )}

            {filteredModels.length === 0 && (
              <div className="cui-model-dropdown__empty">No models found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
