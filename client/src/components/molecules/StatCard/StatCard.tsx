import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/atoms/Icon/Icon";
import { Typography } from "@/components/atoms/Typography/Typography";

/**
 * StatCard component variants using class-variance-authority
 */
const statCardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-border",
        success: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
        warning: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
        error: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
        info: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      interactive: {
        true: "cursor-pointer hover:shadow-md hover:scale-[1.02]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      interactive: false,
    },
  }
);

/**
 * Change indicator variants
 */
const changeVariants = cva(
  "inline-flex items-center gap-1 text-xs font-medium",
  {
    variants: {
      type: {
        increase: "text-green-600 dark:text-green-400",
        decrease: "text-red-600 dark:text-red-400",
        neutral: "text-muted-foreground",
      },
    },
    defaultVariants: {
      type: "neutral",
    },
  }
);

/**
 * Props for the StatCard component
 */
export interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  /** 
   * Title/label for the statistic
   */
  title: string;
  
  /** 
   * Main value to display
   */
  value: string | number;
  
  /** 
   * Optional subtitle or description
   */
  subtitle?: string;
  
  /** 
   * Change information (growth/decline)
   */
  change?: {
    /** Change value (can include % or other units) */
    value: string | number;
    /** Type of change */
    type: 'increase' | 'decrease' | 'neutral';
    /** Optional label for the change (e.g., "vs last month") */
    label?: string;
  };
  
  /** 
   * Icon to display
   */
  icon?: React.ReactNode;
  
  /** 
   * Icon name for Font Awesome icons
   */
  iconName?: string;
  
  /** 
   * Whether the card is in a loading state
   */
  loading?: boolean;
  
  /** 
   * Custom footer content
   */
  footer?: React.ReactNode;
  
  /** 
   * Click handler for interactive cards
   */
  onClick?: () => void;
  
  /** 
   * Format function for the main value
   */
  formatValue?: (value: string | number) => string;
}

/**
 * Loading skeleton component
 */
const StatCardSkeleton = React.memo(() => (
  <>
    <div className="flex items-center justify-between mb-2">
      <div className="h-4 bg-muted rounded w-20 animate-pulse" />
      <div className="h-6 w-6 bg-muted rounded animate-pulse" />
    </div>
    <div className="h-8 bg-muted rounded w-24 mb-1 animate-pulse" />
    <div className="h-3 bg-muted rounded w-16 animate-pulse" />
  </>
));

StatCardSkeleton.displayName = "StatCardSkeleton";

/**
 * Change indicator component
 */
const ChangeIndicator = React.memo<{
  change: NonNullable<StatCardProps['change']>;
}>(({ change }) => {
  const icon = React.useMemo(() => {
    switch (change.type) {
      case 'increase':
        return <Icon name="fa-solid fa-arrow-up" size="xs" />;
      case 'decrease':
        return <Icon name="fa-solid fa-arrow-down" size="xs" />;
      default:
        return <Icon name="fa-solid fa-minus" size="xs" />;
    }
  }, [change.type]);

  return (
    <div className={changeVariants({ type: change.type })}>
      {icon}
      <span>{change.value}</span>
      {change.label && (
        <span className="text-muted-foreground ml-1">
          {change.label}
        </span>
      )}
    </div>
  );
});

ChangeIndicator.displayName = "ChangeIndicator";

/**
 * Optimized prop comparison for React.memo
 */
const arePropsEqual = (prevProps: StatCardProps, nextProps: StatCardProps): boolean => {
  // Compare primitive props
  if (
    prevProps.title !== nextProps.title ||
    prevProps.value !== nextProps.value ||
    prevProps.subtitle !== nextProps.subtitle ||
    prevProps.variant !== nextProps.variant ||
    prevProps.size !== nextProps.size ||
    prevProps.interactive !== nextProps.interactive ||
    prevProps.loading !== nextProps.loading ||
    prevProps.iconName !== nextProps.iconName ||
    prevProps.className !== nextProps.className
  ) {
    return false;
  }

  // Compare function props
  if (
    prevProps.onClick !== nextProps.onClick ||
    prevProps.formatValue !== nextProps.formatValue
  ) {
    return false;
  }

  // Compare change object
  if (prevProps.change !== nextProps.change) {
    if (!prevProps.change || !nextProps.change) return false;
    if (
      prevProps.change.value !== nextProps.change.value ||
      prevProps.change.type !== nextProps.change.type ||
      prevProps.change.label !== nextProps.change.label
    ) {
      return false;
    }
  }

  // Compare React nodes (shallow comparison)
  if (prevProps.icon !== nextProps.icon || prevProps.footer !== nextProps.footer) {
    return false;
  }

  return true;
};

/**
 * Default value formatter
 */
const defaultFormatValue = (value: string | number): string => {
  if (typeof value === 'number') {
    // Format large numbers with commas
    return value.toLocaleString();
  }
  return String(value);
};

/**
 * StatCard component for displaying statistics with optional change indicators
 * 
 * Features:
 * - Multiple variants and sizes from design system
 * - Support for icons (Font Awesome or custom)
 * - Change indicators with increase/decrease/neutral states
 * - Loading state with skeleton animation
 * - Interactive mode with hover effects
 * - Customizable value formatting
 * - Performance optimized with React.memo and custom prop comparison
 * - Accessible with proper ARIA attributes
 * 
 * @example
 * ```tsx
 * // Basic stat card
 * <StatCard 
 *   title="Total Users" 
 *   value={1234} 
 *   iconName="fa-solid fa-users"
 * />
 * 
 * // Stat card with change indicator
 * <StatCard
 *   title="Revenue"
 *   value="$45,678"
 *   subtitle="This month"
 *   change={{
 *     value: "+12.5%",
 *     type: "increase",
 *     label: "vs last month"
 *   }}
 *   variant="success"
 *   iconName="fa-solid fa-dollar-sign"
 * />
 * 
 * // Interactive loading card
 * <StatCard
 *   title="Active Sessions"
 *   value={0}
 *   loading
 *   interactive
 *   onClick={() => console.log('Card clicked')}
 * />
 * 
 * // Custom icon and formatting
 * <StatCard
 *   title="Storage Used"
 *   value={75.5}
 *   formatValue={(val) => `${val}%`}
 *   icon={<CustomStorageIcon />}
 *   footer={<ProgressBar value={75.5} />}
 * />
 * ```
 */
const StatCard = React.memo(
  React.forwardRef<HTMLDivElement, StatCardProps>(
    ({
      className,
      variant,
      size,
      interactive,
      title,
      value,
      subtitle,
      change,
      icon,
      iconName,
      loading = false,
      footer,
      onClick,
      formatValue = defaultFormatValue,
      ...props
    }, ref) => {
      // Determine if card should be interactive
      const isInteractive = interactive || !!onClick;
      
      // Memoize formatted value
      const formattedValue = React.useMemo(() => {
        return loading ? "..." : formatValue(value);
      }, [value, loading, formatValue]);

      // Memoize icon element
      const iconElement = React.useMemo(() => {
        if (loading) {
          return <div className="h-6 w-6 bg-muted rounded animate-pulse" />;
        }
        
        if (icon) {
          return icon;
        }
        
        if (iconName) {
          return <Icon name={iconName} size="lg" color="muted" />;
        }
        
        return null;
      }, [loading, icon, iconName]);

      // Handle click
      const handleClick = React.useCallback(() => {
        if (onClick && !loading) {
          onClick();
        }
      }, [onClick, loading]);

      // Handle keyboard interaction
      const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick && !loading) {
          e.preventDefault();
          onClick();
        }
      }, [onClick, loading]);

      return (
        <div
          ref={ref}
          className={cn(
            statCardVariants({ variant, size, interactive: isInteractive }),
            className
          )}
          onClick={isInteractive ? handleClick : undefined}
          onKeyDown={isInteractive ? handleKeyDown : undefined}
          tabIndex={isInteractive ? 0 : undefined}
          role={isInteractive ? "button" : undefined}
          aria-label={isInteractive ? `${title}: ${formattedValue}` : undefined}
          {...props}
        >
          {loading ? (
            <StatCardSkeleton />
          ) : (
            <>
              {/* Header with title and icon */}
              <div className="flex items-center justify-between mb-2">
                <Typography
                  variant="body-small"
                  color="muted"
                  className="font-medium"
                >
                  {title}
                </Typography>
                {iconElement}
              </div>

              {/* Main value */}
              <Typography
                variant="h3"
                className="font-bold mb-1"
              >
                {formattedValue}
              </Typography>

              {/* Subtitle and change indicator */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  {subtitle && (
                    <Typography
                      variant="caption"
                      color="muted"
                    >
                      {subtitle}
                    </Typography>
                  )}
                  {change && <ChangeIndicator change={change} />}
                </div>
              </div>

              {/* Footer */}
              {footer && (
                <div className="mt-4 pt-4 border-t border-border">
                  {footer}
                </div>
              )}
            </>
          )}
        </div>
      );
    }
  ),
  arePropsEqual
);

StatCard.displayName = "StatCard";

export { StatCard, statCardVariants, changeVariants };