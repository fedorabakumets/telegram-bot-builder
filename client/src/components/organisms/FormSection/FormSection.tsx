/**
 * FormSection Component
 * 
 * A section component for grouping form fields with validation support
 * and integration with react-hook-form. Provides consistent styling
 * and error handling for form sections.
 * 
 * @example
 * ```tsx
 * <FormSection
 *   title="User Information"
 *   description="Enter your personal details"
 *   error={formState.errors.root?.message}
 * >
 *   <FormField label="Name" error={errors.name?.message}>
 *     <Input {...register('name')} />
 *   </FormField>
 * </FormSection>
 * ```
 */

import React from 'react';
import { cn } from '@/design-system';
import { cva, type VariantProps } from 'class-variance-authority';

const formSectionVariants = cva(
  'space-y-4',
  {
    variants: {
      variant: {
        default: 'p-6 border border-border rounded-lg bg-card',
        minimal: 'space-y-4',
        highlighted: 'p-6 border-2 border-primary/20 rounded-lg bg-primary/5',
      },
      size: {
        sm: 'space-y-3',
        md: 'space-y-4',
        lg: 'space-y-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const formSectionHeaderVariants = cva(
  'space-y-1',
  {
    variants: {
      size: {
        sm: 'space-y-0.5',
        md: 'space-y-1',
        lg: 'space-y-2',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const formSectionTitleVariants = cva(
  'font-semibold text-foreground',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const formSectionDescriptionVariants = cva(
  'text-muted-foreground',
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface FormSectionProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formSectionVariants> {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Error message for the entire section */
  error?: string;
  /** Whether the section is required */
  required?: boolean;
  /** Whether the section is disabled */
  disabled?: boolean;
  /** Custom header content */
  header?: React.ReactNode;
  /** Custom footer content */
  footer?: React.ReactNode;
  /** Children form fields */
  children: React.ReactNode;
}

export const FormSection = React.memo(
  React.forwardRef<HTMLDivElement, FormSectionProps>(
    (
      {
        title,
        description,
        error,
        required = false,
        disabled = false,
        header,
        footer,
        variant,
        size,
        className,
        children,
        ...props
      },
      ref
    ) => {
      const hasHeader = title || description || header;
      const hasError = Boolean(error);

      return (
        <div
          ref={ref}
          className={cn(
            formSectionVariants({ variant, size }),
            hasError && 'border-destructive/50 bg-destructive/5',
            disabled && 'opacity-60 pointer-events-none',
            className
          )}
          {...props}
        >
          {hasHeader && (
            <div className={cn(formSectionHeaderVariants({ size }))}>
              {header || (
                <>
                  {title && (
                    <h3 className={cn(formSectionTitleVariants({ size }))}>
                      {title}
                      {required && (
                        <span className="text-destructive ml-1" aria-label="required">
                          *
                        </span>
                      )}
                    </h3>
                  )}
                  {description && (
                    <p className={cn(formSectionDescriptionVariants({ size }))}>
                      {description}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {hasError && (
            <div
              className="flex items-center gap-2 text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              <svg
                className="h-4 w-4 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          <div className="space-y-4">
            {children}
          </div>

          {footer && (
            <div className="pt-2 border-t border-border">
              {footer}
            </div>
          )}
        </div>
      );
    }
  )
);

FormSection.displayName = 'FormSection';

export default FormSection;