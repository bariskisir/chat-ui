export interface IRenameSessionDialogProps
{
  isOpen: boolean;
  currentTitle: string;
  onSave(newTitle: string): void;
  onClose(): void;
}
