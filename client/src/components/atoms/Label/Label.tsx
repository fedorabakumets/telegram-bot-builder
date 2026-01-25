import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Label component variants using class-variance-authority
 */
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
      },
      weight: {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
      },
      color: {
        default: "text-foreground",
        muted: "text-muted-foreground",
        error: "text-red-600 dark:text-red-400",
        success: "text-green-600 dark:text-green-400",
      } as const,
    },
    defaultVariants: {
      size: "md",
      weight: "medium",
      color: "default",
    },
  }
);

/**
 * Props for the Label component
 */
export interface LabelProps
  extends Omit<React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>, 'color'>,
    VariantProps<typeof labelVariants> {
  /** 
   * Whether the field is required
   * Shows a red asterisk when true
   */
  required?: boolean;
  
  /** 
   * Optional description or helper text
   * Rendered below the label
   */
  description?: string;
  
  /** 
   * Error message to display
   * When provided, automatically sets color to "error"
   */
  error?: string;
}

/**
 * Optimized prop comparison for React.memo
 */
const arePropsEqual = (prevProps: LabelProps, nextProps: LabelProps): boolean => {
  // Compare primitive props
  if (
    prevProps.size !== nextProps.size ||
    prevProps.weight !== nextProps.weight ||
    prevProps.color !== nextProps.color ||
    prevProps.required !== nextProps.required ||
    prevProps.description !== nextProps.description ||
    prevProps.error !== nextProps.error ||
    prevProps.className !== nextProps.className ||
    prevProps.children !== nextProps.children ||
    prevProps.htmlFor !== nextProps.htmlFor
  ) {
    return false;
  }

  return true;
};

/**
 * Required indicator component
 */
const RequiredIndicator = React.memo(() => (
  <span className="text-red-500 ml-1" aria-label="required">
    *
  </span>
));

RequiredIndicator.displayName = "RequiredIndicator";

/**
 * Enhanced Label component with performance optimizations and extended functionality
 * 
 * Features:
 * - Multiple sizes, weights, and colors from design system
 * - Required field indicator
 * - Description and error message support
 * - Performance optimized with React.memo and custom prop comparison
 * - Built on Radix UI Label primitive for accessibility
 * - Automatic color adjustment for error states
 * 
 * @example
 * ```tsx
 * // Basic label
 * <Label htmlFor="email">Email Address</Label>
 * 
 * // Required field
 * <Label htmlFor="password" required>
 *   Password
 * </Label>
 * 
 * // Label with description
 * <Label 
 *   htmlFor="username" 
 *   description="Must be at least 3 characters long"
 * >
 *   Username
 * </Label>
 * 
 * // Label with error
 * <Label 
 *   htmlFor="email" 
 *   error="Please enter a valid email address"
 * >
 *   Email
 * </Label>
 * ```
 */
const Label = React.memo(
  React.forwardRef<
    React.ElementRef<typeof LabelPrimitive.Root>,
    LabelProps
  >(({ 
    className, 
    size,
    weight,
    color,
    required = false,
    description,
    error,
    children,
    ...props 
  }, ref) => {
    // Determine color based on error prop
    const computedColor = React.useMemo(() => {
      if (error) return "error";
      return color;
    }, [error, color]);

    // Memoize the label content
    const labelContent = React.useMemo(() => (
      <>
        {children}
        {required && <RequiredIndicator />}
      </>
    ), [children, required]);

    // Memoize the description/error text
    const helperText = React.useMemo(() => {
      if (error) {
        return (
          <span className="text-xs text-red-600 dark:text-red-400 mt-1 block">
            {error}
          </span>
        );
      }
      
      if (description) {
        return (
          <span className="text-xs text-muted-foreground mt-1 block">
            {description}
          </span>
        );
      }
      
      return null;
    }, [error, description]);

    return (
      <div className="space-y-1">
        <LabelPrimitive.Root
          ref={ref}
          className={cn(labelVariants({ size, weight, color: computedColor }), className)}
          {...props}
        >
          {labelContent}
        </LabelPrimitive.Root>
        {helperText}
      </div>
    );
  }),
  arePropsEqual
);

Label.displayName = "Label";

export { Label, labelVariants };