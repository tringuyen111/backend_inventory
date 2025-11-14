
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { BellIcon, ChevronRight, MenuFold, MenuUnfold, User as UserIcon, LogOut as LogOutIcon } from '../icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarCollapsed }) => {
  const { user, logout, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';

  const capitalize = (s: string) => {
    return s.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const displayInitial = (profile?.full_name || user?.email || 'U').charAt(0).toUpperCase();


  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {isSidebarCollapsed ? <MenuUnfold className="h-6 w-6" /> : <MenuFold className="h-6 w-6" />}
        </Button>

        {isDashboard ? (
           <h1 className="text-xl font-semibold text-gray-800 dark:text-white truncate">Dashboard</h1>
        ) : (
          <nav className="flex min-w-0" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-2 truncate">
               <li>
                  <div className="flex items-center">
                    <Link to="/dashboard" className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
                      Dashboard
                    </Link>
                  </div>
                </li>
              {pathnames.map((value, index) => {
                // Exclude 'dashboard' from breadcrumb path as it's the home link
                if (value.toLowerCase() === 'dashboard') return null;
                
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                
                return (
                  <li key={to}>
                    <div className="flex items-center">
                       <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
                      <Link
                        to={to}
                        className={`text-sm font-medium ${isLast ? 'text-gray-500 dark:text-gray-400 cursor-default' : 'text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white'}`}
                        onClick={(e) => isLast && e.preventDefault()}
                        aria-current={isLast ? 'page' : undefined}
                      >
                        {capitalize(value)}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
      </div>

      <div className="flex items-center space-x-2 flex-shrink-0">
        <Button variant="ghost" size="icon">
          <BellIcon className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>


        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-2 rounded-full p-1 bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 pl-2 hidden sm:inline">{displayName}</span>
                <div className="flex items-center justify-center w-8 h-8 bg-blue-200 dark:bg-blue-800 rounded-full text-sm font-semibold text-blue-700 dark:text-blue-200 flex-shrink-0">
                    {displayInitial}
                </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-gray-500">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex items-center">
                <img alt="Vietnam Flag" src="https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/vn.svg" className="h-4 w-4 mr-2" />
                <span>Vietnamese</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
