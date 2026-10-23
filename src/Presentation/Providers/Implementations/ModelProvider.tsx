import { FC, useState, useEffect, useMemo, useCallback } from 'react';
import { IModelProviderProps } from '../Definitions/IModelProviderProps';
import { ModelContext } from '../../Contexts/ModelContext';
import { IModelContextValue } from '../../Contracts/IModelContextValue';
import { IModelDescriptor } from '../../../Core/Domain/Entities/Definitions/IModelDescriptor';
import { ModelIdentifier } from '../../../Core/Domain/Enums/ModelIdentifier';
import { ServiceProviderType } from '../../../Core/Domain/Enums/ServiceProviderType';

const PreferredModelKeyword = 'deepseek';

/** Picks DeepSeek when available, otherwise the newest free model in the catalog. */
function SelectInitialModelId(models: IModelDescriptor[]): ModelIdentifier | null
{
  const freeModels = models.filter((model) =>
  {
    return model.Provider === ServiceProviderType.OpenCode && model.IsFree;
  });

  const preferredModel = freeModels.find((model) =>
  {
    return model.Id.toLowerCase().includes(PreferredModelKeyword)
      || model.Name.toLowerCase().includes(PreferredModelKeyword);
  });

  if (preferredModel)
  {
    return preferredModel.Id;
  }

  const fallbackModels = freeModels.length > 0 ? freeModels : models;
  return fallbackModels[fallbackModels.length - 1]?.Id ?? null;
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
