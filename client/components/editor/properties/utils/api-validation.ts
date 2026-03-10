/**
 * @fileoverview Утилиты для валидации API ответов
 * @module utils/api-validation
 */

/**
 * Ошибка валидации
 */
export interface ValidationError {
  /** Поле с ошибкой */
  field?: string;
  /** Сообщение об ошибке */
  message: string;
}

/**
 * Результат валидации
 */
export interface ValidationResult<T> {
  /** Данные после валидации */
  data?: T;
  /** Есть ли ошибки */
  isValid: boolean;
  /** Список ошибок */
  errors: ValidationError[];
}

/**
 * Валидирует, что значение является массивом
 * @param {unknown} value - Проверяемое значение
 * @returns {boolean} true, если значение — массив
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Валидирует, что значение является объектом
 * @param {unknown} value - Проверяемое значение
 * @returns {boolean} true, если значение — объект
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Валидирует, что значение является строкой
 * @param {unknown} value - Проверяемое значение
 * @returns {boolean} true, если значение — строка
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Валидирует, что значение является числом
 * @param {unknown} value - Проверяемое значение
 * @returns {boolean} true, если значение — число
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * Валидирует медиафайл
 * @param {unknown} file - Проверяемый объект
 * @returns {ValidationResult<Record<string, unknown>>} Результат валидации
 */
export function validateMediaFile(file: unknown): ValidationResult<Record<string, unknown>> {
  const errors: ValidationError[] = [];

  if (!isObject(file)) {
    errors.push({ field: 'root', message: 'Файл должен быть объектом' });
    return { isValid: false, errors };
  }

  if (!isNumber(file.id)) {
    errors.push({ field: 'id', message: 'ID должен быть числом' });
  }

  const projectId = file.projectId;
  if (typeof projectId !== 'number' && typeof projectId !== 'string') {
    errors.push({ field: 'projectId', message: 'projectId должен быть числом или строкой' });
  }

  if (!isString(file.fileName)) {
    errors.push({ field: 'fileName', message: 'fileName должен быть строкой' });
  }

  if (!isString(file.fileType)) {
    errors.push({ field: 'fileType', message: 'fileType должен быть строкой' });
  }

  if (!isString(file.url)) {
    errors.push({ field: 'url', message: 'URL должен быть строкой' });
  }

  return {
    data: file,
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Валидирует массив медиафайлов
 * @param {unknown} files - Проверяемый массив
 * @returns {ValidationResult<Record<string, unknown>[]>} Результат валидации
 */
export function validateMediaFilesArray(files: unknown): ValidationResult<Record<string, unknown>[]> {
  if (!isArray(files)) {
    return {
      isValid: false,
      errors: [{ field: 'root', message: 'Ответ должен быть массивом' }]
    };
  }

  const validatedFiles: Record<string, unknown>[] = [];
  const errors: ValidationError[] = [];

  files.forEach((file, index) => {
    const result = validateMediaFile(file);
    if (result.isValid && result.data) {
      validatedFiles.push(result.data);
    } else {
      errors.push(...result.errors.map(e => ({
        field: `[${index}]${e.field ? `.${e.field}` : ''}`,
        message: e.message
      })));
    }
  });

  return {
    data: validatedFiles,
    isValid: errors.length === 0,
    errors
  };
}
