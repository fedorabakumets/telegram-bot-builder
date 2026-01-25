/**
 * NavigationGroup Component
 * 
 * Groups related navigation items with an optional header
 * and collapsible functionality.
 */

import React from 'react';
import { cn } from '@/design-system';
import { cva, type VariantProps } from 'class-variance-authority';
import { Typography } from '@/components/atoms/Typography';
import { Icon } from '@/components/atoms/Icon';

const navigationGroupVariants = cva(
  'space-y-1',
  {
    variants: {
      variant: {
        default: '',
        separated: 'pb-4 mb-4 border-b border-border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const navigationGroupHeaderVariants = cva(
  'flex items-center justify-between px-3 py-2',
  {
    variants: {
      collapsible: {
        true: 'cursor-pointer hover:bg-accent/50 rounded-md transition-colors',
        false: 'cursor-default',
      },
    },
    defaultVariants: {
      collapsible: false,
    },
  }
);

export interface NavigationGroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof navigationGroupVariants> {
  /** Group title */
  title?: string;
  /** Group description */
  description?: string;
  /** Whether the group is collapsible */
  collapsible?: boolean;
  /** Whether the group is collapsed */
  collapsed?: boolean;
  /** Toggle collapsed state */
  onToggleCollapsed?: () => void;
  /** Custom header content */
  header?: React.ReactNode;
  /** Navigation items */
  children: React.ReactNode;
}

export const NavigationGroup = React.memo(
  React.forwardRef<HTMLDivElement, NavigationGroupProps>(
    (
      {
        title,
        description,
        collapsible = false,
        collapsed = false,
        onToggleCollapsed,
        header,
        variant,
        className,
        children,
        ...props
      },
      ref
    ) => {
      const handleHeaderClick = React.useCallback(() => {
        if (collapsible && onToggleCollapsed) {
          onToggleCollapsed();
        }
      }, [collapsible, onToggleCollapsed]);

      const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent) => {
          if ((e.key === 'Enter' || e.key === ' ') && collapsible && onToggleCollapsed) {
            e.preventDefault();
            onToggleCollapsed();
          }
        },
        [collapsible, onToggleCollapsed]
      );

      const hasHeader = title || description || header;

      return (
        <div
          ref={ref}
          className={cn(navigationGroupVariants({ variant }), className)}
          {...props}
        >
          {hasHeader && (
            <div
              className={cn(
                navigationGroupHeaderVariants({ collapsible }),
                collapsible && 'select-none'
              )}
              onClick={collapsible ? handleHeaderClick : undefined}
              onKeyDown={collapsible ? handleKeyDown : undefined}
              tabIndex={collapsible ? 0 : undefined}
              role={collapsible ? 'button' : undefined}
              aria-expanded={collapsible ? !collapsed : undefined}
              aria-label={collapsible ? `Toggle ${title} section` : undefined}
            >
              {header || (
                <div className="flex-1 min-w-0">
                  {title && (
                    <Typography
                      variant="body-sm"
                      weight="semibold"
                      className="text-muted-foreground uppercase tracking-wider truncate"
                    >
                      {title}
                    </Typography>
                  )}
                  {description && (
                    <Typography
                      variant="body-xs"
                      className="text-muted-foreground/70 truncate"
                    >
                      {description}
                    </Typography>
                  )}
                </div>
              )}

              {collapsible && (
                <Icon
                  name={collapsed ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-down'}
                  size="xs"
                  className="text-muted-foreground transition-transform"
                />
              )}
            </div>
          )}

          {/* Content */}
          {(!collapsible || !collapsed) && (
            <div className="space-y-1">
              {children}
            </div>
          )}
        </div>
      );
    }
  )
);

NavigationGroup.displayName = 'NavigationGroup';

export default NavigationGroup;