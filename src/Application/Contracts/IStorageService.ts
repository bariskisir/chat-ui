export interface IStorageService
{
  GetItem<T>(key: string): T | null;
  SetItem<T>(key: string, value: T): void;
  RemoveItem(key: string): void;
  Clear(): void;
}
