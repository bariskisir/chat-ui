import { FC, useState, useMemo, useCallback } from 'react';
import { IModelProviderProps } from '../Definitions/IModelProviderProps';
import { ModelContext } from '../../Contexts/ModelContext';
import { ModelRegistryService } from '../../../Application/Services/ModelRegistryService';
import { ModelIdentifier } from '../../../Core/Domain/Enums/ModelIdentifier';
import { IModelContextValue } from '../../Contracts/IModelContextValue';

const ModelStorageKey = 'cui_selected_model_v1';

export const ModelProvider: FC<IModelProviderProps> = ({ children, repository }) =>
{
  const repo = useMemo(() => repository || new ModelRegistryService(), [repository]);
  const models = useMemo(() => repo.GetAllModels(), [repo]);

  const [selectedModel, setSelectedModel] = useState<ModelIdentifier>(() =>
  {
    const stored = localStorage.getItem(ModelStorageKey) as ModelIdentifier | null;
    if (stored && repo.GetModelById(stored))
    {
      return stored;
    }
    return repo.GetDefaultModel().Id;
  });

  const selectModel = useCallback((id: ModelIdentifier) =>
  {
    setSelectedModel(id);
    localStorage.setItem(ModelStorageKey, id);
  }, []);

  const currentDescriptor = useMemo(() =>
  {
    return repo.GetModelById(selectedModel) || repo.GetDefaultModel();
  }, [repo, selectedModel]);

  const value = useMemo<IModelContextValue>(() =>
  {
    return {
      SelectedModel: selectedModel,
      Models: models,
      CurrentDescriptor: currentDescriptor,
      SelectModel: selectModel
    };
  }, [selectedModel, models, currentDescriptor, selectModel]);

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  );
};
