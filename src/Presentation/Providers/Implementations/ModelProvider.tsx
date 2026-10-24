import { FC, useState, useEffect, useMemo, useCallback } from 'react';
import { IModelProviderProps } from '../Definitions/IModelProviderProps';
import { ModelContext } from '../../Contexts/ModelContext';
import { IModelContextValue } from '../../Contracts/IModelContextValue';
import { IModelDescriptor } from '../../../Core/Domain/Entities/Definitions/IModelDescriptor';
import { ModelIdentifier } from '../../../Core/Domain/Enums/ModelIdentifier';

/** Picks the preferred model family when available, then the last catalog entry. */
function SelectInitialModelId(models: IModelDescriptor[]): ModelIdentifier | null
{
  const findByKeyword = (keyword: string): IModelDescriptor | undefined =>
  {
    return models.find((model) =>
    {
      const searchableText = `${model.Id} ${model.Name}`.toLowerCase();
      return searchableText.includes(keyword);
    });
  };

  const preferredModel = findByKeyword('minimax')
    ?? findByKeyword('deepseek-v4.1-flash')
    ?? findByKeyword('deepseek')
    ?? models[models.length - 1];

  return preferredModel?.Id ?? null;
}

export const ModelProvider: FC<IModelProviderProps> = ({ children, repository }) =>
{
  const [models, setModels] = useState<IModelDescriptor[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelIdentifier | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() =>
  {
    let isCancelled = false;

    setIsLoading(true);

    repository.GetModelsAsync()
      .then((loadedModels) =>
      {
        if (isCancelled)
        {
          return;
        }

        setModels(loadedModels);
        setSelectedModel(SelectInitialModelId(loadedModels));
        setErrorMessage(null);
      })
      .catch((loadError: unknown) =>
      {
        if (isCancelled)
        {
          return;
        }

        setModels([]);
        setSelectedModel(null);
        setErrorMessage(loadError instanceof Error ? loadError.message : String(loadError));
      })
      .finally(() =>
      {
        if (!isCancelled)
        {
          setIsLoading(false);
        }
      });

    return () =>
    {
      isCancelled = true;
    };
  }, [repository]);

  const selectModel = useCallback((id: ModelIdentifier) =>
  {
    setSelectedModel(id);
  }, []);

  const currentDescriptor = useMemo(() =>
  {
    return models.find((model) => model.Id === selectedModel) ?? models[0] ?? null;
  }, [models, selectedModel]);

  const value = useMemo<IModelContextValue>(() =>
  {
    return {
      SelectedModel: selectedModel,
      Models: models,
      CurrentDescriptor: currentDescriptor,
      IsLoading: isLoading,
      ErrorMessage: errorMessage,
      SelectModel: selectModel
    };
  }, [selectedModel, models, currentDescriptor, isLoading, errorMessage, selectModel]);

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  );
};
