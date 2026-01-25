import { useState, useCallback, useRef, useEffect } from 'react';
import { useFormValidation, ValidationSchema } from './use-form-validation';

interface UseFormStateOptions<T> {
  initialValues: T;
  validationSchema?: ValidationSchema;
  onSubmit?: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  resetOnSubmit?: boolean;
}

interface FormState<T> {
  values: T;
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValidating: boolean;
  isDirty: boolean;
  isValid: boolean;
}

/**
 * Hook for managing form state with validation integration
 * Provides a complete form management solution with TypeScript support
 */
export function useFormState<T extends Record<string, any>>(
  options: UseFormStateOptions<T>
) {
  const {
    initialValues,
    validationSchema,
    onSubmit,
    validateOnChange = false,
    validateOnBlur = true,
    resetOnSubmit = false,
  } = options;

  // Form values state
  const [values, setValues] = useState<T>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialValuesRef = useRef(initialValues);

  // Update initial values ref when it changes
  useEffect(() => {
    initialValuesRef.current = initialValues;
  }, [initialValues]);

  // Validation hook (optional)
  const validation = validationSchema
    ? useFormValidation(validationSchema, {
        validateOnChange,
        validateOnBlur,
      })
    : null;

  // Check if form is dirty (has changes)
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);

  // Set field value
  const setFieldValue = useCallback((
    fieldName: keyof T,
    value: T[keyof T],
    shouldValidate = validateOnChange
  ) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    
    if (shouldValidate && validation) {
      validation.validateSingleField(fieldName as string, value, values);
    }
  }, [values, validation, validateOnChange]);

  // Set multiple field values
  const setFieldValues = useCallback((newValues: Partial<T>, shouldValidate = false) => {
    setValues(prev => ({ ...prev, ...newValues }));
    
    if (shouldValidate && validation) {
      Object.entries(newValues).forEach(([fieldName, value]) => {
        validation.validateSingleField(fieldName, value, { ...values, ...newValues });
      });
    }
  }, [values, validation]);

  // Reset form to initial values
  const resetForm = useCallback((newInitialValues?: T) => {
    const resetValues = newInitialValues || initialValuesRef.current;
    setValues(resetValues);
    validation?.clearErrors();
    setIsSubmitting(false);
    
    if (newInitialValues) {
      initialValuesRef.current = newInitialValues;
    }
  }, [validation]);

  // Handle field blur
  const handleFieldBlur = useCallback((fieldName: keyof T) => {
    if (validation) {
      validation.touchField(fieldName as string);
      if (validateOnBlur) {
        validation.validateSingleField(fieldName as string, values[fieldName], values);
      }
    }
  }, [validation, validateOnBlur, values]);

  // Handle form submission
  const handleSubmit = useCallback(async (event?: React.FormEvent) => {
    event?.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Validate form if validation schema is provided
      if (validation) {
        const errors = await validation.validateForm(values);
        if (Object.keys(errors).length > 0) {
          return; // Stop submission if there are validation errors
        }
      }
      
      // Call onSubmit handler
      if (onSubmit) {
        await onSubmit(values);
      }
      
      // Reset form if configured to do so
      if (resetOnSubmit) {
        resetForm();
      }
    } catch (error) {
      console.error('Form submission error:', error);
      throw error; // Re-throw to allow handling in component
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validation, onSubmit, resetOnSubmit, resetForm, isSubmitting]);

  // Get field props for easy integration with form inputs
  const getFieldProps = useCallback((fieldName: keyof T) => {
    return {
      name: fieldName as string,
      value: values[fieldName] ?? '',
      onChange: (value: T[keyof T]) => setFieldValue(fieldName, value),
      onBlur: () => handleFieldBlur(fieldName),
      error: validation?.getFieldError(fieldName as string),
      hasError: validation?.hasFieldError(fieldName as string) ?? false,
    };
  }, [values, setFieldValue, handleFieldBlur, validation]);

  // Get input props for HTML inputs
  const getInputProps = useCallback((fieldName: keyof T) => {
    return {
      name: fieldName as string,
      value: values[fieldName] ?? '',
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value as T[keyof T];
        setFieldValue(fieldName, value);
      },
      onBlur: () => handleFieldBlur(fieldName),
    };
  }, [values, setFieldValue, handleFieldBlur]);

  // Form state object
  const formState: FormState<T> = {
    values,
    errors: validation?.errors ?? {},
    touched: validation?.touched ?? {},
    isSubmitting,
    isValidating: validation?.isValidatingAny ?? false,
    isDirty,
    isValid: validation?.isValid ?? true,
  };

  return {
    // Form state
    ...formState,
    
    // Form actions
    setFieldValue,
    setFieldValues,
    resetForm,
    handleSubmit,
    
    // Field helpers
    getFieldProps,
    getInputProps,
    
    // Validation helpers (if validation is enabled)
    ...(validation && {
      validateField: validation.validateSingleField,
      validateForm: validation.validateForm,
      clearFieldError: validation.clearFieldError,
      clearErrors: validation.clearErrors,
      getFieldError: validation.getFieldError,
      getFieldErrors: validation.getFieldErrors,
      hasFieldError: validation.hasFieldError,
    }),
  };
}

/**
 * Hook for creating controlled form inputs with validation
 */
export function useFormField<T>(
  name: string,
  initialValue: T,
  validation?: {
    required?: boolean;
    validate?: (value: T) => string | undefined;
  }
) {
  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

  const validateValue = useCallback((val: T) => {
    if (validation?.required && (!val || (typeof val === 'string' && val.trim() === ''))) {
      return 'Это поле обязательно';
    }
    
    if (validation?.validate) {
      return validation.validate(val);
    }
    
    return undefined;
  }, [validation]);

  const handleChange = useCallback((newValue: T) => {
    setValue(newValue);
    if (touched) {
      setError(validateValue(newValue));
    }
  }, [touched, validateValue]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    setError(validateValue(value));
  }, [value, validateValue]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(undefined);
    setTouched(false);
  }, [initialValue]);

  return {
    name,
    value,
    error,
    touched,
    hasError: !!error,
    isValid: !error,
    onChange: handleChange,
    onBlur: handleBlur,
    reset,
    
    // Props for easy integration
    fieldProps: {
      name,
      value,
      onChange: handleChange,
      onBlur: handleBlur,
      error,
      hasError: !!error,
    },
    
    inputProps: {
      name,
      value: value ?? '',
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        handleChange(event.target.value as T);
      },
      onBlur: handleBlur,
    },
  };
}