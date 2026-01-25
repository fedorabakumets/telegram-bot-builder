import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { sizes } from "@/design-system/tokens/spacing";

/**
 * Icon component variants using class-variance-authority
 */
const iconVariants = cva(
  "inline-flex items-center justify-center shrink-0",
  {
    variants: {
      size: {
        xs: "w-3 h-3", // 12px
        sm: "w-4 h-4", // 16px
        md: "w-5 h-5", // 20px
        lg: "w-6 h-6", // 24px
        xl: "w-8 h-8", // 32px
        "2xl": "w-12 h-12", // 48px
      },
      color: {
        default: "text-foreground",
        muted: "text-muted-foreground",
        primary: "text-primary",
        secondary: "text-secondary-foreground",
        success: "text-green-600 dark:text-green-400",
        warning: "text-yellow-600 dark:text-yellow-400",
        error: "text-red-600 dark:text-red-400",
        info: "text-blue-600 dark:text-blue-400",
      } as const,
    },
    defaultVariants: {
      size: "md",
      color: "default",
    },
  }
);

/**
 * Props for the Icon component
 */
export interface IconProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof iconVariants> {
  /** 
   * Icon name for Font Awesome icons (e.g., "fa-solid fa-user")
   * If provided, will render a Font Awesome icon
   */
  name?: string;
  
  /** 
   * Custom SVG element or React component to render
   * Takes precedence over name prop
   */
  children?: React.ReactNode;
  
  /** 
   * Accessible label for screen readers
   * Required for icons without text content
   */
  "aria-label"?: string;
  
  /** 
   * Whether the icon is decorative (hidden from screen readers)
   * Use when icon is purely decorative and has accompanying text
   */
  decorative?: boolean;
}

/**
 * Universal Icon component with support for Font Awesome and custom SVG icons
 * 
 * @example
 * ```tsx
 * // Font Awesome icon
 * <Icon name="fa-solid fa-user" size="lg" color="primary" aria-label="User profile" />
 * 
 * // Custom SVG icon
 * <Icon size="md" color="success" aria-label="Success">
 *   <svg viewBox="0 0 24 24" fill="currentColor">
 *     <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
 *   </svg>
 * </Icon>
 * 
 * // Decorative icon (hidden from screen readers)
 * <Icon name="fa-solid fa-star" decorative />
 * ```
 */
const Icon = React.memo(
  React.forwardRef<HTMLSpanElement, IconProps>(
    ({ 
      className, 
      size, 
      color, 
      name, 
      children, 
      decorative = false,
      "aria-label": ariaLabel,
      ...props 
    }, ref) => {
      // Determine accessibility attributes
      const accessibilityProps = decorative
        ? { "aria-hidden": true }
        : { "aria-label": ariaLabel, role: "img" };

      // If children are provided, render custom SVG/component
      if (children) {
        return (
          <span
            ref={ref}
            className={cn(iconVariants({ size, color }), className)}
            {...accessibilityProps}
            {...props}
          >
            {React.isValidElement(children) 
              ? React.cloneElement(children as React.ReactElement, {
                  className: cn("w-full h-full", (children as React.ReactElement).props?.className),
                })
              : children
            }
          </span>
        );
      }

      // If name is provided, render Font Awesome icon
      if (name) {
        return (
          <span
            ref={ref}
            className={cn(iconVariants({ size, color }), className)}
            {...accessibilityProps}
            {...props}
          >
            <i className={cn(name, "w-full h-full flex items-center justify-center")} />
          </span>
        );
      }

      // Fallback: render empty span with warning
      if (process.env.NODE_ENV === 'development') {
        console.warn('Icon component: Either "name" prop or children must be provided');
      }

      return (
        <span
          ref={ref}
          className={cn(iconVariants({ size, color }), className)}
          {...accessibilityProps}
          {...props}
        />
      );
    }
  )
);

Icon.displayName = "Icon";

export { Icon, iconVariants };