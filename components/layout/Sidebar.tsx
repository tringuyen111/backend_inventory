
import React, { useState, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { usePermissions } from '../../contexts/PermissionsContext';
import { MenuItem } from '../../types';
import * as Icons from '../icons';

type IconName = keyof typeof Icons;

const ALL_MENU_ITEMS: MenuItem[] = [
    { menu_item: 'Dashboard', path: '/dashboard', icon: 'Home', requiredPermission: 'dashboard.read' },
    {
        menu_item: 'Transactions', path: '/transactions', icon: 'ArrowRightLeft', requiredPermission: 'transactions.read',
        children: [
            { menu_item: 'Goods Receipt', path: '/transactions/goods-receipt', icon: 'PackagePlus', requiredPermission: 'goods_receipt.read' },
            { menu_item: 'Goods Issue', path: '/transactions/goods-issue', icon: 'PackageMinus', requiredPermission: 'goods_issue.read' },
            { menu_item: 'Goods Transfer', path: '/transactions/goods-transfer', icon: 'Truck', requiredPermission: 'goods_transfer.read' },
            { menu_item: 'Inventory Count', path: '/transactions/inventory-count', icon: 'ClipboardList', requiredPermission: 'inventory_count.read' },
            { menu_item: 'Put-away', path: '/transactions/put-away', icon: 'PackageSearch', requiredPermission: 'putaway.read' },
        ]
    },
    {
        menu_item: 'Master Data', path: '/master-data', icon: 'Database', requiredPermission: 'master_data.read',
        children: [
             { menu_item: 'Organizations', path: '/master-data/organizations', icon: 'Landmark', requiredPermission: 'organizations.read' },
             { menu_item: 'Branches', path: '/master-data/branches', icon: 'Building', requiredPermission: 'branches.read' },
             { menu_item: 'Warehouses', path: '/master-data/warehouses', icon: 'Warehouse', requiredPermission: 'warehouses.read' },
             { menu_item: 'Locations', path: '/master-data/locations', icon: 'MapPin', requiredPermission: 'locations.read' },
             { menu_item: 'Products', path: '/master-data/products', icon: 'Package', requiredPermission: 'products.read' },
             { menu_item: 'Partners', path: '/master-data/partners', icon: 'Handshake', requiredPermission: 'partners.read' },
             { menu_item: 'Lots & Serials', path: '/master-data/lots', icon: 'SlidersHorizontal', requiredPermission: 'lots.read' },
             { menu_item: 'UOMs', path: '/master-data/uoms', icon: 'Scale', requiredPermission: 'uoms.read' },
        ]
    },
    {
        menu_item: 'Settings', path: '/settings', icon: 'Settings', requiredPermission: 'settings.read',
        children: [
            { menu_item: 'Users', path: '/settings/users', icon: 'Users', requiredPermission: 'users.read' },
            { menu_item: 'Roles & Permissions', path: '/settings/roles', icon: 'ShieldCheck', requiredPermission: 'roles.read' },
            { menu_item: 'Inventory Policy', path: '/settings/inventory-policy', icon: 'Scaling', requiredPermission: 'inventory_policy.read' },
        ]
    }
];

interface NavItemProps {
  item: MenuItem;
  isCollapsed: boolean;
  openMenus: string[];
  toggleMenu: (path: string) => void;
}

const NavItem: React.FC<NavItemProps> = ({ item, isCollapsed, openMenus, toggleMenu }) => {
    const location = useLocation();
    const isParentActive = item.children ? item.children.some(child => location.pathname.startsWith(child.path)) : false;
    const isMenuOpen = openMenus.includes(item.path);
    const Icon = Icons[item.icon as IconName] || Icons.Box;

    if (item.children && item.children.length > 0) {
        return (
            <div>
                <button
                    onClick={() => toggleMenu(item.path)}
                    className={`flex items-center w-full p-2 rounded-md text-sm font-medium transition-colors ${
                        isParentActive ? 'text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className={`ml-3 flex-1 text-left transition-all duration-300 ${isCollapsed ? 'opacity-0 sr-only' : 'opacity-100'}`}>
                        {item.menu_item}
                    </span>
                    {!isCollapsed && (
                        <Icons.ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                    )}
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-screen' : 'max-h-0'}`}>
                    {!isCollapsed && (
                        <div className="pt-2 pl-6 space-y-1">
                            {item.children.map(child => <NavItem key={child.path} item={child} isCollapsed={isCollapsed} openMenus={openMenus} toggleMenu={toggleMenu} />)}
                        </div>
                    )}
                </div>
            </div>
        );
    }
    
    return (
         <NavLink
            to={item.path}
            className={({ isActive }) =>
                `flex items-center p-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`
            }
        >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span className={`transition-opacity duration-300 ${isCollapsed ? 'opacity-0 sr-only' : 'opacity-100'} ml-3`}>
                {item.menu_item}
            </span>
        </NavLink>
    );
};


const Sidebar: React.FC<{isCollapsed: boolean}> = ({ isCollapsed }) => {
  const { loading, hasPermission } = usePermissions();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const location = useLocation();

  const accessibleMenuItems = useMemo(() => {
    // FIX: Refactored menu filtering to be more intuitive. A parent menu item
    // (like "Master Data") will now be displayed if the user has permission to
    // access at least one of its child items (like "Organizations"), even if they
    // don't have explicit permission for the parent category itself. This fixes
    // the issue where parts of the menu would incorrectly disappear.
    const filterByPermission = (items: MenuItem[]): MenuItem[] => {
      const result: MenuItem[] = [];
      for (const item of items) {
        // If it's a parent node, recursively filter its children
        if (item.children && item.children.length > 0) {
          const accessibleChildren = filterByPermission(item.children);
          // If the parent has any accessible children, include it in the menu
          if (accessibleChildren.length > 0) {
            result.push({ ...item, children: accessibleChildren });
          }
        } 
        // If it's a leaf node, check its permission directly
        else if (!item.requiredPermission || hasPermission(item.requiredPermission)) {
          result.push(item);
        }
      }
      return result;
    };

    return filterByPermission(ALL_MENU_ITEMS);
  }, [hasPermission]);


  React.useEffect(() => {
    // Automatically open the parent menu of the current active page
    const currentMainMenu = ALL_MENU_ITEMS.find(item => 
        item.path === `/${location.pathname.split('/')[1]}` || 
        item.children?.some(child => location.pathname.startsWith(child.path))
    );

    if (currentMainMenu && !openMenus.includes(currentMainMenu.path)) {
       setOpenMenus(prev => [...prev, currentMainMenu.path]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);


  const toggleMenu = (path: string) => {
    setOpenMenus(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
  };
  
  return (
    <aside className={`bg-gray-900 text-white flex flex-col transition-all duration-300 ease-in-out hidden lg:flex ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex items-center justify-center h-16 px-4 flex-shrink-0">
            <div className="relative w-full h-8 flex items-center justify-center">
                <h1 className={`absolute text-xl font-bold text-white whitespace-nowrap transition-opacity duration-200 ease-in-out ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                    Inventory XCloud
                </h1>
                <div className={`absolute transition-opacity duration-200 ease-in-out ${isCollapsed ? 'opacity-100' : 'opacity-0'}`}>
                    <Icons.XCloudLogo className="h-8 w-8 text-blue-500" />
                </div>
            </div>
        </div>
      <nav className="flex-1 px-4 py-4 space-y-1">
        {loading ? (
           Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-10 bg-gray-700 rounded-md animate-pulse"></div>
          ))
        ) : (
          accessibleMenuItems.map((item) => (
            <NavItem key={item.path} item={item} isCollapsed={isCollapsed} openMenus={openMenus} toggleMenu={toggleMenu} />
          ))
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
