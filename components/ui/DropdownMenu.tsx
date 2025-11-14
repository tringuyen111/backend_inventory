
import React, { useState, useRef, useEffect, createContext, useContext } from 'react';

interface DropdownMenuContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownMenuContext = createContext<DropdownMenuContextType | null>(null);

const useDropdownMenu = () => {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('useDropdownMenu must be used within a DropdownMenu');
  }
  return context;
};

const DropdownMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

const DropdownMenuTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ children }) => {
  const { setOpen } = useDropdownMenu();
  // FIX: Cast child to React.ReactElement<any> to solve issues with props being typed as 'unknown'.
  // This allows us to safely add an onClick handler and check for an existing one.
  const child = React.Children.only(children) as React.ReactElement<any>;
  return React.cloneElement(child, {
    onClick: (e: React.MouseEvent) => {
      setOpen(prev => !prev);
      if (child.props.onClick) child.props.onClick(e);
    },
  });
};

const DropdownMenuContent: React.FC<{ children: React.ReactNode; className?: string; align?: 'start' | 'end' }> = ({ children, className, align = 'start' }) => {
  const { open, setOpen } = useDropdownMenu();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setOpen]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={`absolute z-50 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none ${align === 'end' ? 'right-0' : 'left-0'} ${className || ''}`}
    >
      <div className="py-1" role="menu" aria-orientation="vertical">
        {children}
      </div>
    </div>
  );
};

const DropdownMenuItem: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className, onClick }) => {
    const { setOpen } = useDropdownMenu();
    return (
        <a
        href="#"
        onClick={(e) => {
            e.preventDefault();
            if(onClick) onClick();
            setOpen(false);
        }}
        className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 ${className || ''}`}
        role="menuitem"
        >
        {children}
        </a>
    );
};

const DropdownMenuLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`px-4 py-2 text-sm text-gray-500 dark:text-gray-400 ${className || ''}`}>{children}</div>
);

const DropdownMenuSeparator: React.FC = () => <div className="border-t border-gray-200 dark:border-gray-700 my-1" />;

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator };
