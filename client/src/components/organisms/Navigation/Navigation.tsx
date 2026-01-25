/**
 * Navigation Component
 * 
 * Main navigation component with support for nested items,
 * responsive design, and mobile-friendly collapsible sidebar.
 * 
 * @example
 * ```tsx
 * <Navigation
 *   variant="sidebar"
 *   collapsed={isMobileMenuOpen}
 *   onToggleCollapsed={setIsMobileMenuOpen}
 * >
 *   <NavigationGroup title="Main">
 *     <NavigationItem
 *       label="Dashboard"
 *       href="/dashboard"
 *       icon="fa-solid fa-home"
 *     />
 *     <NavigationItem
 *       label="Projects"
 *       href="/projects"
 *       icon="fa-solid fa-folder"
 *       badge={5}
 *     />
 *   </NavigationGroup>
 * </Navigation>
 * ```
 */

import React from 'react';
import { cn } from '@/design-system';
import { cva, type VariantProps } from 'class-variance-authority';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';

const navigationVariants = cva(
  'flex flex-col bg-card border-border transition-all duration-300',
  {
    variants: {
      variant: {
        sidebar: 'h-full border-r',
        horizontal: 'flex-row border-b',
        floating: 'rounded-lg border shadow-lg',
      },
      size: {
        sm: 'w-48',
        md: 'w-64',
        lg: 'w-80',
        full: 'w-full',
      },
      collapsed: {
        true: 'w-16',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'sidebar',
      size: 'md',
      collapsed: false,
    },
  }
);

const navigationHeaderVariants = cva(
  'flex items-center justify-between p-4 border-b border-border',
  {
    variants: {
      collapsed: {
        true: 'px-2',
        false: 'px-4',
      },
    },
  }
);

const navigationContentVariants = cva(
  'flex-1 overflow-y-auto p-4 space-y-6',
  {
    variants: {
      collapsed: {
        true: 'px-2',
        false: 'px-4',
      },
    },
  }
);

const navigationFooterVariants = cva(
  'p-4 border-t border-border',
  {
    variants: {
      collapsed: {
        true: 'px-2',
        false: 'px-4',
      },
    },
  }
);

export interface NavigationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof navigationVariants> {
  /** Navigation header content */
  header?: React.ReactNode;
  /** Navigation footer content */
  footer?: React.ReactNode;
  /** Whether navigation is collapsed (for mobile) */
  collapsed?: boolean;
  /** Toggle collapsed state */
  onToggleCollapsed?: () => void;
  /** Whether to show collapse toggle button */
  showCollapseToggle?: boolean;
  /** Custom collapse toggle button */
  collapseToggle?: React.ReactNode;
  /** Navigation items and groups */
  children: React.ReactNode;
}

const CollapseToggle = React.memo<{
  collapsed: boolean;
  onToggle: () => void;
}>(({ collapsed, onToggle }) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onToggle}
    className="flex-shrink-0"
    aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
  >
    <Icon
      name={collapsed ? 'fa-solid fa-bars' : 'fa-solid fa-xmark'}
      size="sm"
    />
  </Button>
));

CollapseToggle.displayName = 'CollapseToggle';

export const Navigation = React.memo(
  React.forwardRef<HTMLDivElement, NavigationProps>(
    (
      {
        header,
        footer,
        collapsed = false,
        onToggleCollapsed,
        showCollapseToggle = false,
        collapseToggle,
        variant,
        size,
        className,
        children,
        ...props
      },
      ref
    ) => {
      // Handle responsive behavior
      const [isMobile, setIsMobile] = React.useState(false);

      React.useEffect(() => {
        const checkMobile = () => {
          setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
      }, []);

      // Auto-collapse on mobile
      const isCollapsed = isMobile ? collapsed : false;
      const effectiveSize = isCollapsed ? undefined : size;

      return (
        <>
          {/* Mobile overlay */}
          {isMobile && !collapsed && (
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={onToggleCollapsed}
            />
          )}

          {/* Navigation */}
          <nav
            ref={ref}
            className={cn(
              navigationVariants({
                variant,
                size: effectiveSize,
                collapsed: isCollapsed,
              }),
              isMobile && 'fixed left-0 top-0 h-full z-50',
              isMobile && collapsed && '-translate-x-full',
              className
            )}
            {...props}
          >
            {/* Header */}
            {(header || showCollapseToggle) && (
              <div className={navigationHeaderVariants({ collapsed: isCollapsed })}>
                {!isCollapsed && header}
                
                {showCollapseToggle && onToggleCollapsed && (
                  <div className={cn('flex', !isCollapsed && header && 'ml-auto')}>
                    {collapseToggle || (
                      <CollapseToggle
                        collapsed={collapsed}
                        onToggle={onToggleCollapsed}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div className={navigationContentVariants({ collapsed: isCollapsed })}>
              {isCollapsed ? (
                // Collapsed view - show only icons
                <div className="space-y-2">
                  {React.Children.map(children, (child) => {
                    if (React.isValidElement(child)) {
                      return React.cloneElement(child, {
                        ...child.props,
                        collapsed: true,
                      } as any);
                    }
                    return child;
                  })}
                </div>
              ) : (
                children
              )}
            </div>

            {/* Footer */}
            {footer && !isCollapsed && (
              <div className={navigationFooterVariants({ collapsed: isCollapsed })}>
                {footer}
              </div>
            )}
          </nav>
        </>
      );
    }
  )
);

Navigation.displayName = 'Navigation';

export default Navigation;