import { useState, useCallback, useMemo } from 'react';

// Validation rule types
type ValidationRule<T = any> = {
  validate: (value: T, formData?: Record<string, any>) => boolean | Promise<boolean>;
  message: string;
};

type FieldValidation<T = any> = {
  rules: ValidationRule<T>[];
  required?: boolean;
  requiredMessage?: string;
};

type ValidationSchema = Record<string, FieldValidation>;

type ValidationErrors = Record<string, string[]>;

interface UseFormValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

/**
 * Common validation rules
 */
export const validationRules = {
  required: (message = 'Это поле обязательно'): ValidationRule => ({
    validate: (value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value != null && value !== '';
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value) => !value || value.length >= min,
    message: message || `Минимум ${min} символов`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value) => !value || value.length <= max,
    message: message || `Максимум ${max} символов`,
  }),

  email: (message = 'Некорректный email'): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message,
  }),

  url: (message = 'Некорректный URL'): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  pattern: (regex: RegExp, message = 'Некорректный формат'): ValidationRule<string> => ({
    validate: (value) => !value || regex.test(value),
    message,
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value) => value == null || value >= min,
    message: message || `Минимальное значение: ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value) => value == null || value <= max,
    message: message || `Максимальное значение: ${max}`,
  }),

  custom: <T>(
    validator: (value: T, formData?: Record<string, any>) => boolean | Promise<boolean>,
    message: string
  ): ValidationRule<T> => ({
    validate: validator,
    message,
  }),
};

/**
 * Hook for form validation with flexible rules and async support
 */
export function useFormValidation(
  schema: ValidationSchema,
  options: UseFormValidationOptions = {}
) {
  const {
    validateOnChange = false,
    validateOnBlur = true,
    debounceMs = 300,
  } = options;

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState<Record<string, boolean>>({});

  // Validate a single field
  const validateField = useCallback(async (
    fieldName: string,
    value: any,
    formData?: Record<string, any>
  ): Promise<string[]> => {
    const fieldSchema = schema[fieldName];
    if (!fieldSchema) return [];

    const fieldErrors: string[] = [];

    // Check required validation
    if (fieldSchema.required) {
      const isRequired = validationRules.required(fieldSchema.requiredMessage);
      const isValid = await isRequired.validate(value, formData);
      if (!isValid) {
        fieldErrors.push(isRequired.message);
        return fieldErrors; // Stop validation if required field is empty
      }
    }

    // Run other validation rules
    for (const rule of fieldSchema.rules) {
      try {
        const isValid = await rule.validate(value, formData);
        if (!isValid) {
          fieldErrors.push(rule.message);
        }
      } catch (error) {
        console.error(`Validation error for field ${fieldName}:`, error);
        fieldErrors.push('Ошибка валидации');
      }
    }

    return fieldErrors;
  }, [schema]);

  // Validate all fields
  const validateForm = useCallback(async (formData: Record<string, any>): Promise<ValidationErrors> => {
    const allErrors: ValidationErrors = {};
    
    setIsValidating(prev => {
      const newState = { ...prev };
      Object.keys(schema).forEach(field => {
        newState[field] = true;
      });
      return newState;
    });

    try {
      await Promise.all(
        Object.keys(schema).map(async (fieldName) => {
          const fieldErrors = await validateField(fieldName, formData[fieldName], formData);
          if (fieldErrors.length > 0) {
            allErrors[fieldName] = fieldErrors;
          }
        })
      );
    } finally {
      setIsValidating({});
    }

    setErrors(allErrors);
    return allErrors;
  }, [schema, validateField]);

  // Validate single field with debouncing
  const validateSingleField = useCallback(async (
    fieldName: string,
    value: any,
    formData?: Record<string, any>
  ) => {
    setIsValidating(prev => ({ ...prev, [fieldName]: true }));

    try {
      const fieldErrors = await validateField(fieldName, value, formData);
      
      setErrors(prev => {
        const newErrors = { ...prev };
        if (fieldErrors.length > 0) {
          newErrors[fieldName] = fieldErrors;
        } else {
          delete newErrors[fieldName];
        }
        return newErrors;
      });
    } finally {
      setIsValidating(prev => ({ ...prev, [fieldName]: false }));
    }
  }, [validateField]);

  // Mark field as touched
  const touchField = useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  // Clear errors for a field
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  // Get field error (only if touched or form was submitted)
  const getFieldError = useCallback((fieldName: string, showUntouched = false) => {
    if (!showUntouched && !touched[fieldName]) return undefined;
    return errors[fieldName]?.[0]; // Return first error
  }, [errors, touched]);

  // Get all field errors
  const getFieldErrors = useCallback((fieldName: string, showUntouched = false) => {
    if (!showUntouched && !touched[fieldName]) return [];
    return errors[fieldName] || [];
  }, [errors, touched]);

  // Check if field has error
  const hasFieldError = useCallback((fieldName: string, showUntouched = false) => {
    if (!showUntouched && !touched[fieldName]) return false;
    return !!(errors[fieldName] && errors[fieldName].length > 0);
  }, [errors, touched]);

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  // Check if any field is currently validating
  const isValidatingAny = useMemo(() => {
    return Object.values(isValidating).some(Boolean);
  }, [isValidating]);

  return {
    // Validation state
    errors,
    touched,
    isValidating,
    isValid,
    isValidatingAny,
    
    // Validation actions
    validateForm,
    validateSingleField,
    touchField,
    clearFieldError,
    clearErrors,
    
    // Getters
    getFieldError,
    getFieldErrors,
    hasFieldError,
    
    // Field handlers for form integration
    getFieldProps: (fieldName: string) => ({
      onBlur: () => {
        touchField(fieldName);
        if (validateOnBlur) {
          // Debounced validation would be implemented here
        }
      },
      onChange: validateOnChange ? (value: any, formData?: Record<string, any>) => {
        // Debounced validation would be implemented here
        validateSingleField(fieldName, value, formData);
      } : undefined,
    }),
  };
}

/**
 * Hook for creating validation schemas with TypeScript support
 */
export function createValidationSchema<T extends Record<string, any>>() {
  return function <K extends keyof T>(schema: Record<K, FieldValidation<T[K]>>): ValidationSchema {
    return schema as ValidationSchema;
  };
}