/**
 * Auth Layout Component
 * 
 * Centered layout for authentication pages with theme support,
 * responsive design, and optional branding elements.
 * 
 * @example
 * ```tsx
 * <AuthLayout
 *   title="Sign In"
 *   subtitle="Welcome back to Bot Builder"
 *   logo={<Logo />}
 *   footer={<AuthFooter />}
 * >
 *   <LoginForm />
 * </AuthLayout>
 * ```
 */

import React from 'react';
import { cn } from '@/design-system/utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';
import { Typography } from '@/components/atoms/Typography';
import { useTheme } from '@/design-system/hooks/use-theme';

const authLayoutVariants = cva(
  'min-h-screen bg-background text-foreground transition-colors duration-300',
  {
    variants: {
      variant: {
        default: 'flex items-center justify-center p-4',
        split: 'grid lg:grid-cols-2',
        fullscreen: 'flex items-center justify-center',
      },
      background: {
        default: '',
        gradient: 'bg-gradient-to-br from-primary/10 via-background to-secondary/10',
        pattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background',
      },
    },
    defaultVariants: {
      variant: 'default',
      background: 'default',
    },
  }
);

const containerVariants = cva(
  'w-full max-w-md space-y-6 bg-card border border-border rounded-lg shadow-lg p-8 transition-all duration-300',
  {
    variants: {
      size: {
        sm: 'max-w-sm p-6',
        md: 'max-w-md p-8',
        lg: 'max-w-lg p-10',
        xl: 'max-w-xl p-12',
      },
      elevation: {
        none: 'shadow-none border-0',
        sm: 'shadow-sm',
        md: 'shadow-lg',
        lg: 'shadow-xl',
        xl: 'shadow-2xl',
      },
    },
    defaultVariants: {
      size: 'md',
      elevation: 'md',
    },
  }
);

const headerVariants = cva(
  'text-center space-y-2',
  {
    variants: {
      alignment: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      },
    },
    defaultVariants: {
      alignment: 'center',
    },
  }
);

const logoVariants = cva(
  'flex justify-center mb-6',
  {
    variants: {
      size: {
        sm: 'h-8',
        md: 'h-12',
        lg: 'h-16',
        xl: 'h-20',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const sideContentVariants = cva(
  'hidden lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12 lg:bg-muted/30',
  {
    variants: {
      position: {
        left: 'lg:order-first',
        right: 'lg:order-last',
      },
    },
    defaultVariants: {
      position: 'left',
    },
  }
);

const footerVariants = cva(
  'mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground',
  {
    variants: {
      alignment: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      },
    },
    defaultVariants: {
      alignment: 'center',
    },
  }
);

export interface AuthLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof authLayoutVariants> {
  /** Page title */
  title?: string;
  /** Page subtitle/description */
  subtitle?: string;
  /** Logo component */
  logo?: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
  /** Side content for split layout */
  sideContent?: React.ReactNode;
  /** Side content position */
  sidePosition?: VariantProps<typeof sideContentVariants>['position'];
  /** Container size */
  containerSize?: VariantProps<typeof containerVariants>['size'];
  /** Container elevation */
  containerElevation?: VariantProps<typeof containerVariants>['elevation'];
  /** Header alignment */
  headerAlignment?: VariantProps<typeof headerVariants>['alignment'];
  /** Footer alignment */
  footerAlignment?: VariantProps<typeof footerVariants>['alignment'];
  /** Logo size */
  logoSize?: VariantProps<typeof logoVariants>['size'];
  /** Auth form content */
  children: React.ReactNode;
  /** Custom container className */
  containerClassName?: string;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string;
}

const LoadingOverlay = React.memo(() => (
  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="flex items-center gap-3">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      <Typography variant="body-small" className="text-muted-foreground">
        Loading...
      </Typography>
    </div>
  </div>
));

LoadingOverlay.displayName = 'LoadingOverlay';

const ErrorMessage = React.memo<{ message: string }>(({ message }) => (
  <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
    <Typography variant="body-small" className="text-destructive text-center">
      {message}
    </Typography>
  </div>
));

ErrorMessage.displayName = 'ErrorMessage';

export const AuthLayout = React.memo(
  React.forwardRef<HTMLDivElement, AuthLayoutProps>(
    (
      {
        title,
        subtitle,
        logo,
        footer,
        sideContent,
        sidePosition = 'left',
        containerSize = 'md',
        containerElevation = 'md',
        headerAlignment = 'center',
        footerAlignment = 'center',
        logoSize = 'md',
        children,
        containerClassName,
        loading = false,
        error,
        variant,
        background,
        className,
        ...props
      },
      ref
    ) => {
      const { isDark } = useTheme();

      // Handle responsive behavior
      const [isMobile, setIsMobile] = React.useState(false);

      React.useEffect(() => {
        const checkMobile = () => {
          setIsMobile(window.innerWidth < 1024);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
      }, []);

      const isSplitLayout = variant === 'split' && sideContent && !isMobile;

      return (
        <div
          ref={ref}
          className={cn(
            authLayoutVariants({ variant: isSplitLayout ? 'split' : variant, background }),
            className
          )}
          {...props}
        >
          {/* Side Content (Split Layout) */}
          {isSplitLayout && (
            <div className={sideContentVariants({ position: sidePosition })}>
              {sideContent}
            </div>
          )}

          {/* Main Auth Container */}
          <div className={cn(
            'flex items-center justify-center p-4',
            isSplitLayout && 'lg:p-12'
          )}>
            <div
              className={cn(
                containerVariants({ size: containerSize, elevation: containerElevation }),
                containerClassName,
                'relative'
              )}
            >
              {/* Loading Overlay */}
              {loading && <LoadingOverlay />}

              {/* Logo */}
              {logo && (
                <div className={logoVariants({ size: logoSize })}>
                  {logo}
                </div>
              )}

              {/* Header */}
              {(title || subtitle) && (
                <div className={headerVariants({ alignment: headerAlignment })}>
                  {title && (
                    <Typography
                      variant="h1"
                      className="text-2xl font-bold text-foreground"
                    >
                      {title}
                    </Typography>
                  )}
                  {subtitle && (
                    <Typography
                      variant="body1"
                      className="text-muted-foreground"
                    >
                      {subtitle}
                    </Typography>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && <ErrorMessage message={error} />}

              {/* Auth Form Content */}
              <div className="space-y-6">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className={footerVariants({ alignment: footerAlignment })}>
                  {footer}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
  )
);

AuthLayout.displayName = 'AuthLayout';

export default AuthLayout;