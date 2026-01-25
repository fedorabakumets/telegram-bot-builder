import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Typography component variants using class-variance-authority
 */
const typographyVariants = cva(
  "text-foreground",
  {
    variants: {
      variant: {
        // Headings
        h1: "scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl",
        h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
        h4: "scroll-m-20 text-xl font-semibold tracking-tight",
        h5: "scroll-m-20 text-lg font-semibold tracking-tight",
        h6: "scroll-m-20 text-base font-semibold tracking-tight",
        
        // Body text
        body: "leading-7",
        "body-large": "text-lg leading-7",
        "body-small": "text-sm leading-6",
        
        // UI elements
        label: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        caption: "text-xs text-muted-foreground leading-4",
        overline: "text-xs font-semibold uppercase tracking-wider text-muted-foreground leading-4",
        
        // Code
        code: "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        "code-block": "font-mono text-sm leading-6",
        
        // Special
        lead: "text-xl text-muted-foreground",
        large: "text-lg font-semibold",
        small: "text-sm font-medium leading-none",
        muted: "text-sm text-muted-foreground",
      },
      weight: {
        thin: "font-thin",
        extralight: "font-extralight", 
        light: "font-light",
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
        extrabold: "font-extrabold",
        black: "font-black",
      },
      align: {
        left: "text-left",
        center: "text-center",
        right: "text-right",
        justify: "text-justify",
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
      variant: "body",
      color: "default",
    },
  }
);

/**
 * Mapping of typography variants to semantic HTML elements
 */
const variantElementMap = {
  h1: "h1",
  h2: "h2", 
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  body: "p",
  "body-large": "p",
  "body-small": "p",
  label: "span",
  caption: "span",
  overline: "span",
  code: "code",
  "code-block": "pre",
  lead: "p",
  large: "div",
  small: "small",
  muted: "p",
} as const;

/**
 * Props for the Typography component
 */
export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof typographyVariants> {
  /** 
   * Override the default HTML element for this variant
   * Useful for semantic HTML while maintaining visual styling
   */
  as?: keyof JSX.IntrinsicElements;
  
  /** 
   * Content to render inside the typography element
   */
  children: React.ReactNode;
}

/**
 * Typography component for consistent text styling across the application
 * 
 * Automatically selects semantic HTML elements based on variant, but allows override via 'as' prop.
 * Supports all typography scales from the design system with proper accessibility.
 * 
 * @example
 * ```tsx
 * // Semantic headings
 * <Typography variant="h1">Main Page Title</Typography>
 * <Typography variant="h2">Section Heading</Typography>
 * 
 * // Body text with custom styling
 * <Typography variant="body" color="muted" align="center">
 *   This is centered, muted body text
 * </Typography>
 * 
 * // Override semantic element while keeping visual style
 * <Typography variant="h2" as="h1">
 *   Visually h2, semantically h1
 * </Typography>
 * 
 * // UI elements
 * <Typography variant="label">Form Label</Typography>
 * <Typography variant="caption">Helper text</Typography>
 * 
 * // Code
 * <Typography variant="code">inline code</Typography>
 * ```
 */
const Typography = React.memo(
  React.forwardRef<HTMLElement, TypographyProps>(
    ({ 
      className, 
      variant = "body", 
      weight,
      align,
      color,
      as,
      children,
      ...props 
    }, ref) => {
      // Determine the HTML element to render
      const Element = (as || variantElementMap[variant || "body"] || "div") as keyof JSX.IntrinsicElements;

      return React.createElement(
        Element,
        {
          ref,
          className: cn(typographyVariants({ variant, weight, align, color }), className),
          ...props,
        },
        children
      );
    }
  )
);

Typography.displayName = "Typography";

export { Typography, typographyVariants };