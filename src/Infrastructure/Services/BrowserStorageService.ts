import { IStorageService } from '../../Application/Contracts/IStorageService';

export class BrowserStorageService implements IStorageService
{
  public GetItem<T>(key: string): T | null
  {
    try
    {
      const raw = localStorage.getItem(key);
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
      localStorage.setItem(key, JSON.stringify(value));
    }
    catch
    {
    }
  }

  public RemoveItem(key: string): void
  {
    try
    {
      localStorage.removeItem(key);
    }
    catch
    {
    }
  }

  public Clear(): void
  {
    try
    {
      localStorage.clear();
    }
    catch
    {
    }
  }
}
