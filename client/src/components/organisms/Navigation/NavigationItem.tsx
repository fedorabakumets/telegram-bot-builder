/**
 * NavigationItem Component
 * 
 * Individual navigation item with support for icons, badges,
 * active states, and nested items.
 */

import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/design-system';
import { cva, type VariantProps } from 'class-variance-authority';
import { Icon } from '@/components/atoms/Icon';
import { Typography } from '@/components/atoms/Typography';

const navigationItemVariants = cva(
  'flex items-center gap-3 px-3 py-2 rounded-md transition-colors relative',
  {
    variants: {
      variant: {
        default: 'text-muted-foreground hover:text-foreground hover:bg-accent',
        active: 'text-foreground bg-accent',
        ghost: 'text-muted-foreground hover:text-foreground',
      },
      size: {
        sm: 'px-2 py-1.5 text-sm',
        md: 'px-3 py-2',
        lg: 'px-4 py-3',
      },
      disabled: {
        true: 'opacity-50 pointer-events-none',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      disabled: false,
    },
  }
);

const navigationIconVariants = cva(
  'flex-shrink-0',
  {
    variants: {
      size: {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface NavigationItemProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>,
    VariantProps<typeof navigationItemVariants> {
  /** Navigation item label */
  label: string;
  /** Navigation path/href */
  href?: string;
  /** Icon name for Font Awesome icons */
  icon?: string;
  /** Custom icon element */
  iconElement?: React.ReactNode;
  /** Badge content */
  badge?: string | number;
  /** Badge variant */
  badgeVariant?: 'default' | 'primary' | 'secondary' | 'destructive';
  /** Whether item is disabled */
  disabled?: boolean;
  /** Click handler for non-link items */
  onClick?: () => void;
  /** Whether to match exact path */
  exact?: boolean;
  /** Custom active check function */
  isActive?: (pathname: string) => boolean;
  /** Nested navigation items */
  children?: React.ReactNode;
  /** Whether nested items are expanded */
  expanded?: boolean;
  /** Toggle expanded state */
  onToggleExpanded?: () => void;
}

const Badge = React.memo<{
  content: string | number;
  variant?: 'default' | 'primary' | 'secondary' | 'destructive';
}>(({ content, variant = 'default' }) => {
  const badgeVariants = cva(
    'inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full',
    {
      variants: {
        variant: {
          default: 'bg-muted text-muted-foreground',
          primary: 'bg-primary text-primary-foreground',
          secondary: 'bg-secondary text-secondary-foreground',
          destructive: 'bg-destructive text-destructive-foreground',
        },
      },
    }
  );

  return (
    <span className={badgeVariants({ variant })}>
      {content}
    </span>
  );
});

Badge.displayName = 'Badge';

export const NavigationItem = React.memo(
  React.forwardRef<HTMLAnchorElement, NavigationItemProps>(
    (
      {
        label,
        href,
        icon,
        iconElement,
        badge,
        badgeVariant,
        disabled,
        onClick,
        exact = false,
        isActive: customIsActive,
        children,
        expanded,
        onToggleExpanded,
        variant,
        size,
        className,
        ...props
      },
      ref
    ) => {
      const [location] = useLocation();
      const hasChildren = Boolean(children);
      
      // Determine if item is active
      const isItemActive = React.useMemo(() => {
        if (customIsActive) {
          return customIsActive(location);
        }
        
        if (!href) return false;
        
        if (exact) {
          return location === href;
        }
        
        return location.startsWith(href);
      }, [location, href, exact, customIsActive]);

      // Handle click for expandable items
      const handleClick = React.useCallback(
        (e: React.MouseEvent) => {
          if (hasChildren && onToggleExpanded) {
            e.preventDefault();
            onToggleExpanded();
            return;
          }
          
          if (onClick) {
            e.preventDefault();
            onClick();
          }
        },
        [hasChildren, onToggleExpanded, onClick]
      );

      const itemVariant = isItemActive ? 'active' : variant;

      const itemContent = (
        <>
          {/* Icon */}
          {(icon || iconElement) && (
            <div className={navigationIconVariants({ size })}>
              {iconElement || (
                <Icon
                  name={icon!}
                  size={size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm'}
                />
              )}
            </div>
          )}

          {/* Label */}
          <Typography
            variant={size === 'sm' ? 'body-sm' : 'body-md'}
            className="flex-1 truncate"
          >
            {label}
          </Typography>

          {/* Badge */}
          {badge && (
            <Badge content={badge} variant={badgeVariant} />
          )}

          {/* Expand/Collapse Icon */}
          {hasChildren && (
            <Icon
              name={expanded ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'}
              size="xs"
              className="flex-shrink-0 transition-transform"
            />
          )}
        </>
      );

      // Render as Link if href is provided and no children
      if (href && !hasChildren) {
        return (
          <>
            <Link
              ref={ref}
              href={href}
              className={cn(
                navigationItemVariants({ variant: itemVariant, size, disabled }),
                className
              )}
              onClick={onClick}
              {...props}
            >
              {itemContent}
            </Link>
            
            {/* Active indicator */}
            {isItemActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
            )}
          </>
        );
      }

      // Render as button for expandable items or custom onClick
      return (
        <>
          <button
            ref={ref as React.Ref<HTMLButtonElement>}
            className={cn(
              navigationItemVariants({ variant: itemVariant, size, disabled }),
              'w-full text-left',
              className
            )}
            onClick={handleClick}
            disabled={disabled}
            {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
          >
            {itemContent}
          </button>

          {/* Active indicator */}
          {isItemActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
          )}

          {/* Nested items */}
          {hasChildren && expanded && (
            <div className="ml-6 mt-1 space-y-1">
              {children}
            </div>
          )}
        </>
      );
    }
  )
);

NavigationItem.displayName = 'NavigationItem';

export default NavigationItem;