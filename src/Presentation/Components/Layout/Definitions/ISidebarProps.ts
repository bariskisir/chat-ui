export interface ISidebarProps
{
  isCollapsed: boolean;
  isMobile: boolean;
  onToggleCollapse(): void;
  onSelectHistory(): void;
}
