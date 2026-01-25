import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button component variants using class-variance-authority
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 rounded-md px-3",
        md: "h-10 px-4 py-2",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

/**
 * Props for the Button component
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** 
   * Render as a different element or component
   * Useful for rendering buttons as links or other interactive elements
   */
  asChild?: boolean;
  
  /** 
   * Show loading state with spinner
   * Disables the button and shows loading indicator
   */
  loading?: boolean;
  
  /** 
   * Icon to display before the button text
   * Can be any React node (typically an Icon component)
   */
  icon?: React.ReactNode;
  
  /** 
   * Icon to display after the button text
   * Can be any React node (typically an Icon component)
   */
  iconRight?: React.ReactNode;
}

/**
 * Optimized prop comparison for React.memo
 * Performs shallow comparison of props to prevent unnecessary re-renders
 */
const arePropsEqual = (prevProps: ButtonProps, nextProps: ButtonProps): boolean => {
  // Compare primitive props
  if (
    prevProps.variant !== nextProps.variant ||
    prevProps.size !== nextProps.size ||
    prevProps.asChild !== nextProps.asChild ||
    prevProps.loading !== nextProps.loading ||
    prevProps.disabled !== nextProps.disabled ||
    prevProps.className !== nextProps.className ||
    prevProps.children !== nextProps.children
  ) {
    return false;
  }

  // Compare function props (onClick, etc.)
  if (prevProps.onClick !== nextProps.onClick) {
    return false;
  }

  // Compare icon props (React nodes)
  if (prevProps.icon !== nextProps.icon || prevProps.iconRight !== nextProps.iconRight) {
    return false;
  }

  return true;
};

/**
 * Loading spinner component for button loading state
 */
const LoadingSpinner = React.memo(() => (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
));

LoadingSpinner.displayName = "LoadingSpinner";

/**
 * Enhanced Button component with performance optimizations and extended functionality
 * 
 * Features:
 * - Multiple variants and sizes from design system
 * - Loading state with spinner
 * - Icon support (before and after text)
 * - Polymorphic rendering via asChild prop
 * - Performance optimized with React.memo and custom prop comparison
 * - Full accessibility support
 * 
 * @example
 * ```tsx
 * // Basic button
 * <Button variant="primary" size="md">
 *   Click me
 * </Button>
 * 
 * // Button with icon
 * <Button icon={<Icon name="fa-solid fa-plus" />}>
 *   Add Item
 * </Button>
 * 
 * // Loading button
 * <Button loading disabled>
 *   Saving...
 * </Button>
 * 
 * // Render as link
 * <Button asChild>
 *   <a href="/profile">Go to Profile</a>
 * </Button>
 * ```
 */
const Button = React.memo(
  React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ 
      className, 
      variant, 
      size, 
      asChild = false, 
      loading = false,
      icon,
      iconRight,
      disabled,
      children,
      ...props 
    }, ref) => {
      const Comp = asChild ? Slot : "button";
      
      // Memoize the button content to prevent unnecessary re-renders
      const buttonContent = React.useMemo(() => (
        <>
          {loading && <LoadingSpinner />}
          {!loading && icon && icon}
          {children}
          {!loading && iconRight && iconRight}
        </>
      ), [loading, icon, iconRight, children]);

      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          disabled={disabled || loading}
          {...props}
        >
          {buttonContent}
        </Comp>
      );
    }
  ),
  arePropsEqual
);

Button.displayName = "Button";

export { Button, buttonVariants };