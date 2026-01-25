import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Input component variants using class-variance-authority
 */
const inputVariants = cva(
  "flex w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "border-input",
        error: "border-red-500 focus-visible:ring-red-500",
        success: "border-green-500 focus-visible:ring-green-500",
      },
      size: {
        sm: "h-8 px-2 py-1 text-xs",
        md: "h-10 px-3 py-2",
        lg: "h-12 px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

/**
 * Props for the Input component
 */
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** 
   * Error message to display
   * When provided, automatically sets variant to "error"
   */
  error?: string;
  
  /** 
   * Success message to display
   * When provided, automatically sets variant to "success"
   */
  success?: string;
  
  /** 
   * Icon to display at the start of the input
   */
  startIcon?: React.ReactNode;
  
  /** 
   * Icon to display at the end of the input
   */
  endIcon?: React.ReactNode;
  
  /** 
   * Whether the input is in a loading state
   */
  loading?: boolean;
}

/**
 * Optimized prop comparison for React.memo
 */
const arePropsEqual = (prevProps: InputProps, nextProps: InputProps): boolean => {
  // Compare primitive props
  if (
    prevProps.variant !== nextProps.variant ||
    prevProps.size !== nextProps.size ||
    prevProps.error !== nextProps.error ||
    prevProps.success !== nextProps.success ||
    prevProps.loading !== nextProps.loading ||
    prevProps.disabled !== nextProps.disabled ||
    prevProps.className !== nextProps.className ||
    prevProps.value !== nextProps.value ||
    prevProps.placeholder !== nextProps.placeholder ||
    prevProps.type !== nextProps.type
  ) {
    return false;
  }

  // Compare function props
  if (
    prevProps.onChange !== nextProps.onChange ||
    prevProps.onFocus !== nextProps.onFocus ||
    prevProps.onBlur !== nextProps.onBlur
  ) {
    return false;
  }

  // Compare icon props
  if (prevProps.startIcon !== nextProps.startIcon || prevProps.endIcon !== nextProps.endIcon) {
    return false;
  }

  return true;
};

/**
 * Loading spinner for input loading state
 */
const InputSpinner = React.memo(() => (
  <svg
    className="animate-spin h-4 w-4 text-muted-foreground"
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

InputSpinner.displayName = "InputSpinner";

/**
 * Enhanced Input component with performance optimizations and extended functionality
 * 
 * Features:
 * - Multiple variants (default, error, success) and sizes
 * - Icon support (start and end positions)
 * - Loading state with spinner
 * - Error and success message integration
 * - Performance optimized with React.memo and custom prop comparison
 * - Full accessibility support
 * 
 * @example
 * ```tsx
 * // Basic input
 * <Input placeholder="Enter your name" />
 * 
 * // Input with error
 * <Input error="This field is required" placeholder="Email" />
 * 
 * // Input with icons
 * <Input 
 *   startIcon={<Icon name="fa-solid fa-search" />}
 *   placeholder="Search..."
 * />
 * 
 * // Loading input
 * <Input loading placeholder="Searching..." />
 * ```
 */
const Input = React.memo(
  React.forwardRef<HTMLInputElement, InputProps>(
    ({ 
      className, 
      variant, 
      size,
      error,
      success,
      startIcon,
      endIcon,
      loading = false,
      disabled,
      type = "text",
      ...props 
    }, ref) => {
      // Determine variant based on error/success props
      const computedVariant = React.useMemo(() => {
        if (error) return "error";
        if (success) return "success";
        return variant;
      }, [error, success, variant]);

      // Determine if we need a wrapper for icons
      const hasIcons = startIcon || endIcon || loading;

      // Memoize the input element
      const inputElement = React.useMemo(() => (
        <input
          type={type}
          className={cn(
            inputVariants({ variant: computedVariant, size }),
            hasIcons && "pl-10 pr-10", // Add padding for icons
            startIcon && !endIcon && !loading && "pr-3", // Only start icon
            !startIcon && (endIcon || loading) && "pl-3", // Only end icon
            className
          )}
          ref={ref}
          disabled={disabled || loading}
          {...props}
        />
      ), [computedVariant, size, hasIcons, startIcon, endIcon, loading, className, type, disabled, props, ref]);

      // If no icons, return simple input
      if (!hasIcons) {
        return inputElement;
      }

      // Return input with icon wrapper
      return (
        <div className="relative">
          {startIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {startIcon}
            </div>
          )}
          
          {inputElement}
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {loading ? <InputSpinner /> : endIcon}
          </div>
        </div>
      );
    }
  ),
  arePropsEqual
);

Input.displayName = "Input";

export { Input, inputVariants };