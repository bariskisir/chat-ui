import { IStorageService } from '../../Application/Contracts/IStorageService';

export class BrowserSessionStorageService implements IStorageService
{
  public GetItem<T>(key: string): T | null
  {
    try
    {
      const raw = sessionStorage.getItem(key);
      if (raw === null)
      {
        return null;
      }
      return JSON.parse(raw) as T;
    }
    catch
    {
      return null;
    }
  }

  public SetItem<T>(key: string, value: T): void
  {
    try
    {
      sessionStorage.setItem(key, JSON.stringify(value));
    }
    catch
    {
    }
  }

  public RemoveItem(key: string): void
  {
    try
    {
      sessionStorage.removeItem(key);
    }
    catch
    {
    }
  }

  public Clear(): void
  {
    try
    {
      sessionStorage.clear();
    }
    catch
    {
    }
  }
}
