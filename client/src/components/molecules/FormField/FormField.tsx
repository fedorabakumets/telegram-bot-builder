import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Label } from "@/components/atoms/Label/Label";

/**
 * FormField component variants using class-variance-authority
 */
const formFieldVariants = cva(
  "space-y-2",
  {
    variants: {
      orientation: {
        vertical: "flex flex-col",
        horizontal: "flex flex-row items-start gap-4",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
);

/**
 * Props for the FormField component
 */
export interface FormFieldProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formFieldVariants> {
  /** 
   * Label text for the form field
   */
  label: string;
  
  /** 
   * Unique identifier for the form field
   * Used to associate label with input
   */
  id?: string;
  
  /** 
   * Whether the field is required
   * Shows a red asterisk in the label
   */
  required?: boolean;
  
  /** 
   * Error message to display
   * When provided, shows error styling
   */
  error?: string;
  
  /** 
   * Helper text or description
   * Displayed below the input field
   */
  description?: string;
  
  /** 
   * Success message to display
   * When provided, shows success styling
   */
  success?: string;
  
  /** 
   * The form input element(s)
   * Can be Input, Select, Textarea, or any form control
   */
  children: React.ReactNode;
  
  /** 
   * Custom label props
   * Allows overriding label component properties
   */
  labelProps?: Partial<React.ComponentProps<typeof Label>>;
  
  /** 
   * Whether to hide the label visually but keep it for screen readers
   */
  hideLabel?: boolean;
  
  /** 
   * Custom class for the input wrapper
   */
  inputWrapperClassName?: string;
}

/**
 * Optimized prop comparison for React.memo
 */
const arePropsEqual = (prevProps: FormFieldProps, nextProps: FormFieldProps): boolean => {
  // Compare primitive props
  if (
    prevProps.label !== nextProps.label ||
    prevProps.id !== nextProps.id ||
    prevProps.required !== nextProps.required ||
    prevProps.error !== nextProps.error ||
    prevProps.description !== nextProps.description ||
    prevProps.success !== nextProps.success ||
    prevProps.orientation !== nextProps.orientation ||
    prevProps.hideLabel !== nextProps.hideLabel ||
    prevProps.className !== nextProps.className ||
    prevProps.inputWrapperClassName !== nextProps.inputWrapperClassName
  ) {
    return false;
  }

  // Compare children (shallow comparison)
  if (prevProps.children !== nextProps.children) {
    return false;
  }

  // Compare labelProps object (shallow comparison)
  if (prevProps.labelProps !== nextProps.labelProps) {
    if (!prevProps.labelProps || !nextProps.labelProps) return false;
    
    const prevKeys = Object.keys(prevProps.labelProps);
    const nextKeys = Object.keys(nextProps.labelProps);
    
    if (prevKeys.length !== nextKeys.length) return false;
    
    for (const key of prevKeys) {
      if (prevProps.labelProps[key as keyof typeof prevProps.labelProps] !== 
          nextProps.labelProps[key as keyof typeof nextProps.labelProps]) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Helper text component for displaying description, error, or success messages
 */
const HelperText = React.memo<{
  error?: string;
  success?: string;
  description?: string;
  fieldId?: string;
}>(({ error, success, description, fieldId }) => {
  const text = error || success || description;
  if (!text) return null;

  const textColor = error 
    ? "text-red-600 dark:text-red-400" 
    : success 
    ? "text-green-600 dark:text-green-400" 
    : "text-muted-foreground";

  return (
    <div
      id={fieldId ? `${fieldId}-helper` : undefined}
      className={cn("text-xs", textColor)}
      role={error ? "alert" : "status"}
      aria-live={error ? "assertive" : "polite"}
    >
      {text}
    </div>
  );
});

HelperText.displayName = "HelperText";

/**
 * Universal FormField component for consistent form field layout and styling
 * 
 * Features:
 * - Consistent label, input, and helper text layout
 * - Support for required field indicators
 * - Error, success, and description states
 * - Horizontal and vertical orientations
 * - Proper accessibility with ARIA attributes
 * - Integration with existing Input, Label components
 * - Performance optimized with React.memo and custom prop comparison
 * - Flexible children support for any form control
 * 
 * @example
 * ```tsx
 * // Basic form field with input
 * <FormField
 *   label="Email Address"
 *   id="email"
 *   required
 *   description="We'll never share your email"
 * >
 *   <Input 
 *     id="email"
 *     type="email" 
 *     placeholder="Enter your email"
 *   />
 * </FormField>
 * 
 * // Form field with error
 * <FormField
 *   label="Password"
 *   id="password"
 *   required
 *   error="Password must be at least 8 characters"
 * >
 *   <Input 
 *     id="password"
 *     type="password"
 *     error="Password must be at least 8 characters"
 *   />
 * </FormField>
 * 
 * // Horizontal layout form field
 * <FormField
 *   label="Newsletter"
 *   id="newsletter"
 *   orientation="horizontal"
 *   description="Receive updates about new features"
 * >
 *   <input 
 *     id="newsletter"
 *     type="checkbox"
 *     className="rounded border-gray-300"
 *   />
 * </FormField>
 * 
 * // Form field with custom label props
 * <FormField
 *   label="Important Field"
 *   id="important"
 *   labelProps={{ size: "lg", weight: "semibold" }}
 * >
 *   <Input id="important" />
 * </FormField>
 * ```
 */
const FormField = React.memo(
  React.forwardRef<HTMLDivElement, FormFieldProps>(
    ({
      className,
      orientation,
      label,
      id,
      required = false,
      error,
      description,
      success,
      children,
      labelProps = {},
      hideLabel = false,
      inputWrapperClassName,
      ...props
    }, ref) => {
      // Generate unique ID if not provided
      const fieldId = React.useMemo(() => {
        return id || `field-${Math.random().toString(36).substr(2, 9)}`;
      }, [id]);

      // Determine helper text ID for accessibility
      const helperTextId = React.useMemo(() => {
        if (error || success || description) {
          return `${fieldId}-helper`;
        }
        return undefined;
      }, [fieldId, error, success, description]);

      // Clone children to add accessibility attributes
      const enhancedChildren = React.useMemo(() => {
        return React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            const childProps: Record<string, any> = {};
            
            // Add ID if not already present
            if (!child.props.id) {
              childProps.id = fieldId;
            }
            
            // Add aria-describedby for helper text
            if (helperTextId) {
              childProps['aria-describedby'] = helperTextId;
            }
            
            // Add aria-invalid for error state
            if (error) {
              childProps['aria-invalid'] = true;
            }
            
            // Add required attribute
            if (required) {
              childProps.required = true;
            }

            // Only clone if we have props to add
            if (Object.keys(childProps).length > 0) {
              return React.cloneElement(child, childProps);
            }
          }
          
          return child;
        });
      }, [children, fieldId, helperTextId, error, required]);

      // Memoize label component
      const labelComponent = React.useMemo(() => (
        <Label
          htmlFor={fieldId}
          required={required}
          error={error}
          className={hideLabel ? "sr-only" : undefined}
          {...labelProps}
        >
          {label}
        </Label>
      ), [fieldId, required, error, hideLabel, label, labelProps]);

      // Memoize helper text component
      const helperTextComponent = React.useMemo(() => (
        <HelperText
          error={error}
          success={success}
          description={description}
          fieldId={fieldId}
        />
      ), [error, success, description, fieldId]);

      return (
        <div
          ref={ref}
          className={cn(formFieldVariants({ orientation }), className)}
          {...props}
        >
          {/* Label */}
          {labelComponent}
          
          {/* Input wrapper */}
          <div className={cn("flex-1", inputWrapperClassName)}>
            {enhancedChildren}
            {helperTextComponent}
          </div>
        </div>
      );
    }
  ),
  arePropsEqual
);

FormField.displayName = "FormField";

export { FormField, formFieldVariants };