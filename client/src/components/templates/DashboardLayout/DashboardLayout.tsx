/**
 * Dashboard Layout Component
 * 
 * Main layout for administrative pages with integrated navigation,
 * sidebar, header, and responsive design with theme support.
 * 
 * @example
 * ```tsx
 * <DashboardLayout
 *   navigation={<Navigation>...</Navigation>}
 *   header={<Header />}
 *   sidebar={<Sidebar />}
 * >
 *   <PageContent />
 * </DashboardLayout>
 * ```
 */

import React from 'react';
import { cn } from '@/design-system/utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { useTheme } from '@/design-system/hooks/use-theme';

const dashboardLayoutVariants = cva(
  'min-h-screen bg-background text-foreground transition-colors duration-300',
  {
    variants: {
      variant: {
        default: 'flex',
        fullscreen: 'flex flex-col',
        compact: 'flex',
      },
      sidebarPosition: {
        left: 'flex-row',
        right: 'flex-row-reverse',
      },
    },
    defaultVariants: {
      variant: 'default',
      sidebarPosition: 'left',
    },
  }
);

const sidebarVariants = cva(
  'flex-shrink-0 bg-card border-border transition-all duration-300 ease-in-out',
  {
    variants: {
      collapsed: {
        true: 'w-16',
        false: 'w-64',
      },
      position: {
        left: 'border-r',
        right: 'border-l',
      },
      mobile: {
        true: 'fixed inset-y-0 z-50 shadow-lg',
        false: 'relative',
      },
    },
    defaultVariants: {
      collapsed: false,
      position: 'left',
      mobile: false,
    },
  }
);

const mainContentVariants = cva(
  'flex-1 flex flex-col min-w-0 transition-all duration-300',
  {
    variants: {
      withHeader: {
        true: '',
        false: '',
      },
    },
  }
);

const headerVariants = cva(
  'flex-shrink-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between',
  {
    variants: {
      sticky: {
        true: 'sticky top-0 z-40',
        false: '',
      },
    },
    defaultVariants: {
      sticky: true,
    },
  }
);

const contentAreaVariants = cva(
  'flex-1 overflow-auto',
  {
    variants: {
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      padding: 'md',
    },
  }
);

export interface DashboardLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dashboardLayoutVariants> {
  /** Navigation component (typically Navigation organism) */
  navigation?: React.ReactNode;
  /** Header content */
  header?: React.ReactNode;
  /** Additional sidebar content */
  sidebar?: React.ReactNode;
  /** Main page content */
  children: React.ReactNode;
  /** Whether sidebar is collapsed */
  sidebarCollapsed?: boolean;
  /** Toggle sidebar collapsed state */
  onToggleSidebar?: () => void;
  /** Whether to show sidebar toggle button */
  showSidebarToggle?: boolean;
  /** Custom sidebar toggle button */
  sidebarToggle?: React.ReactNode;
  /** Header variant */
  headerVariant?: VariantProps<typeof headerVariants>['sticky'];
  /** Content padding */
  contentPadding?: VariantProps<typeof contentAreaVariants>['padding'];
  /** Custom header actions */
  headerActions?: React.ReactNode;
  /** Page title for header */
  pageTitle?: string;
  /** Page breadcrumbs */
  breadcrumbs?: React.ReactNode;
}

const SidebarToggle = React.memo<{
  collapsed: boolean;
  onToggle: () => void;
}>(({ collapsed, onToggle }) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onToggle}
    className="flex-shrink-0"
    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
  >
    <Icon
      name={collapsed ? 'fa-solid fa-bars' : 'fa-solid fa-sidebar'}
      size="sm"
    />
  </Button>
));

SidebarToggle.displayName = 'SidebarToggle';

const MobileOverlay = React.memo<{
  show: boolean;
  onClose: () => void;
}>(({ show, onClose }) => {
  if (!show) return null;
  
  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 md:hidden"
      onClick={onClose}
      aria-hidden="true"
    />
  );
});

MobileOverlay.displayName = 'MobileOverlay';

export const DashboardLayout = React.memo(
  React.forwardRef<HTMLDivElement, DashboardLayoutProps>(
    (
      {
        navigation,
        header,
        sidebar,
        children,
        sidebarCollapsed = false,
        onToggleSidebar,
        showSidebarToggle = true,
        sidebarToggle,
        headerVariant = true,
        contentPadding = 'md',
        headerActions,
        pageTitle,
        breadcrumbs,
        variant,
        sidebarPosition = 'left',
        className,
        ...props
      },
      ref
    ) => {
      const { isDark } = useTheme();
      
      // Handle responsive behavior
      const [isMobile, setIsMobile] = React.useState(false);
      const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

      React.useEffect(() => {
        const checkMobile = () => {
          const mobile = window.innerWidth < 768;
          setIsMobile(mobile);
          if (!mobile) {
            setMobileMenuOpen(false);
          }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
      }, []);

      // Handle sidebar state
      const isSidebarCollapsed = isMobile ? !mobileMenuOpen : sidebarCollapsed;
      const showSidebar = navigation || sidebar;

      const handleToggleSidebar = () => {
        if (isMobile) {
          setMobileMenuOpen(!mobileMenuOpen);
        } else if (onToggleSidebar) {
          onToggleSidebar();
        }
      };

      const handleCloseMobileMenu = () => {
        if (isMobile) {
          setMobileMenuOpen(false);
        }
      };

      return (
        <div
          ref={ref}
          className={cn(
            dashboardLayoutVariants({ variant, sidebarPosition }),
            className
          )}
          {...props}
        >
          {/* Mobile Overlay */}
          <MobileOverlay show={isMobile && mobileMenuOpen} onClose={handleCloseMobileMenu} />

          {/* Sidebar */}
          {showSidebar && (
            <aside
              className={cn(
                sidebarVariants({
                  collapsed: isSidebarCollapsed,
                  position: sidebarPosition,
                  mobile: isMobile,
                }),
                isMobile && !mobileMenuOpen && '-translate-x-full',
                isMobile && sidebarPosition === 'right' && !mobileMenuOpen && 'translate-x-full'
              )}
            >
              {/* Navigation */}
              {navigation && (
                <div className="h-full">
                  {React.isValidElement(navigation)
                    ? React.cloneElement(navigation, {
                        ...navigation.props,
                        collapsed: isSidebarCollapsed,
                        onToggleCollapsed: handleToggleSidebar,
                        showCollapseToggle: isMobile,
                      } as any)
                    : navigation}
                </div>
              )}
              
              {/* Additional Sidebar Content */}
              {sidebar && (
                <div className={cn('border-t border-border', navigation && 'mt-auto')}>
                  {sidebar}
                </div>
              )}
            </aside>
          )}

          {/* Main Content Area */}
          <main className={mainContentVariants({ withHeader: !!header })}>
            {/* Header */}
            {(header || pageTitle || showSidebarToggle) && (
              <header className={headerVariants({ sticky: headerVariant })}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Sidebar Toggle */}
                  {showSidebarToggle && onToggleSidebar && (
                    <div className="flex-shrink-0">
                      {sidebarToggle || (
                        <SidebarToggle
                          collapsed={sidebarCollapsed}
                          onToggle={handleToggleSidebar}
                        />
                      )}
                    </div>
                  )}

                  {/* Page Title and Breadcrumbs */}
                  <div className="flex-1 min-w-0">
                    {breadcrumbs && (
                      <div className="mb-1">
                        {breadcrumbs}
                      </div>
                    )}
                    {pageTitle && (
                      <h1 className="text-2xl font-semibold text-foreground truncate">
                        {pageTitle}
                      </h1>
                    )}
                  </div>

                  {/* Custom Header Content */}
                  {header && (
                    <div className="flex-1 min-w-0">
                      {header}
                    </div>
                  )}
                </div>

                {/* Header Actions */}
                {headerActions && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {headerActions}
                  </div>
                )}
              </header>
            )}

            {/* Content Area */}
            <div className={contentAreaVariants({ padding: contentPadding })}>
              {children}
            </div>
          </main>
        </div>
      );
    }
  )
);

DashboardLayout.displayName = 'DashboardLayout';

export default DashboardLayout;