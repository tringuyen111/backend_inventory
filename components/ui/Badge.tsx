import React from 'react';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-blue-600 text-white hover:bg-blue-600/80',
  secondary: 'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80',
  destructive: 'border-transparent bg-red-500 text-white hover:bg-red-500/80',
  outline: 'text-gray-900 dark:text-gray-50',
  success: 'border-transparent bg-green-500 text-white hover:bg-green-500/80',
};

// FIX: Refactored to use React.forwardRef to align with other UI components and fix a typing issue where className was not being recognized on BadgeProps.
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const classes = `inline-flex items-center rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:border-gray-800 dark:focus:ring-gray-800 ${variantClasses[variant]} ${className || ''}`;
    return <div className={classes} ref={ref} {...props} />;
  }
);
Badge.displayName = 'Badge';


export { Badge };
