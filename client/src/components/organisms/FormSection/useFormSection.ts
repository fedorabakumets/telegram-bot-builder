/**
 * useFormSection Hook
 * 
 * Custom hook for managing form section state and validation
 * with react-hook-form integration.
 */

import { useCallback, useMemo } from 'react';
import { 
  FieldErrors, 
  FieldValues, 
  UseFormReturn,
  Path,
  get
} from 'react-hook-form';

export interface UseFormSectionOptions<T extends FieldValues> {
  /** Form instance from react-hook-form */
  form: UseFormReturn<T>;
  /** Field paths that belong to this section */
  fields: Array<Path<T>>;
  /** Section name for error grouping */
  sectionName?: string;
}

export interface UseFormSectionReturn<T extends FieldValues> {
  /** Whether the section has any errors */
  hasErrors: boolean;
  /** Section-specific errors */
  sectionErrors: Partial<FieldErrors<T>>;
  /** First error message in the section */
  firstError: string | undefined;
  /** Whether any field in the section is dirty */
  isDirty: boolean;
  /** Whether any field in the section is being validated */
  isValidating: boolean;
  /** Clear all errors in the section */
  clearSectionErrors: () => void;
  /** Validate only fields in this section */
  validateSection: () => Promise<boolean>;
  /** Get error for a specific field */
  getFieldError: (fieldName: Path<T>) => string | undefined;
  /** Check if a specific field has an error */
  hasFieldError: (fieldName: Path<T>) => boolean;
}

export function useFormSection<T extends FieldValues>({
  form,
  fields,
  sectionName,
}: UseFormSectionOptions<T>): UseFormSectionReturn<T> {
  const { 
    formState: { errors, dirtyFields, isValidating },
    clearErrors,
    trigger,
  } = form;

  // Get section-specific errors
  const sectionErrors = useMemo(() => {
    const result: Partial<FieldErrors<T>> = {};
    
    fields.forEach((fieldPath) => {
      const error = get(errors, fieldPath);
      if (error) {
        result[fieldPath] = error;
      }
    });

    return result;
  }, [errors, fields]);

  // Check if section has any errors
  const hasErrors = useMemo(() => {
    return Object.keys(sectionErrors).length > 0;
  }, [sectionErrors]);

  // Get first error message
  const firstError = useMemo(() => {
    const firstErrorKey = Object.keys(sectionErrors)[0] as Path<T>;
    if (!firstErrorKey) return undefined;
    
    const error = sectionErrors[firstErrorKey];
    return error?.message || error?.toString();
  }, [sectionErrors]);

  // Check if any field in section is dirty
  const isDirty = useMemo(() => {
    return fields.some((fieldPath) => get(dirtyFields, fieldPath));
  }, [dirtyFields, fields]);

  // Clear section errors
  const clearSectionErrors = useCallback(() => {
    clearErrors(fields);
  }, [clearErrors, fields]);

  // Validate section
  const validateSection = useCallback(async () => {
    const result = await trigger(fields);
    return result;
  }, [trigger, fields]);

  // Get error for specific field
  const getFieldError = useCallback((fieldName: Path<T>) => {
    const error = get(errors, fieldName);
    return error?.message || error?.toString();
  }, [errors]);

  // Check if field has error
  const hasFieldError = useCallback((fieldName: Path<T>) => {
    return Boolean(get(errors, fieldName));
  }, [errors]);

  return {
    hasErrors,
    sectionErrors,
    firstError,
    isDirty,
    isValidating,
    clearSectionErrors,
    validateSection,
    getFieldError,
    hasFieldError,
  };
}

export default useFormSection;