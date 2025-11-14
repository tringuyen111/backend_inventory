export interface MenuItem {
  menu_item: string;
  path: string;
  icon: string;
  children?: MenuItem[];
  requiredPermission?: string;
}
