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
      className={`absolute z-50 mt-2 min-w-[8rem] rounded-md border border-gray-200 bg-white p-1 text-gray-900 shadow-md dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50 ${align === 'end' ? 'right-0' : 'left-0'} ${className || ''}`}
    >
        {children}
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
        className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 dark:hover:bg-gray-800 dark:focus:bg-gray-800 ${className || ''}`}
        role="menuitem"
        >
        {children}
        </a>
    );
};


const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & { checked?: boolean; onCheckedChange?: (checked: boolean) => void }
>(({ className, children, checked, onCheckedChange, ...props }, ref) => {
    return (
        <a
        href="#"
        ref={ref}
        onClick={(e) => {
            e.preventDefault();
            if(onCheckedChange) onCheckedChange(!checked);
        }}
        className={`relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 dark:hover:bg-gray-800 dark:focus:bg-gray-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className || ''}`}
        {...props}
        >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            {checked && (
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                  <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" />
                </svg>
            )}
        </span>
        {children}
        </a>
    );
});
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";


const DropdownMenuLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`px-2 py-1.5 text-sm font-semibold ${className || ''}`}>{children}</div>
);

const DropdownMenuSeparator: React.FC = () => <div className="-mx-1 my-1 h-px bg-gray-100 dark:bg-gray-800" />;

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem };