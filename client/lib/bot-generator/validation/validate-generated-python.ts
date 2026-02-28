/**
 * @fileoverview Валидация сгенерированного Python кода
 *
 * Модуль проверяет наличие обязательных компонентов в сгенерированном коде
 * и выбрасывает ошибку при отсутствии критических элементов.
 *
 * @module bot-generator/validation/validate-generated-python
 */

/**
 * Список обязательных элементов Python кода бота
 */
const REQUIRED_PYTHON_COMPONENTS = [
  'import asyncio',
  'from aiogram import Bot',
  'from aiogram import Dispatcher',
  'dp = Dispatcher()',
  'async def main():',
  'if __name__ == "__main__":',
  'asyncio.run(main())'
] as const;

/**
 * Результат валидации Python кода
 */
export interface PythonValidationResult {
  /** Код валиден */
  isValid: boolean;
  /** Список отсутствующих компонентов */
  missingComponents: string[];
  /** Сообщение об ошибке */
  errorMessage?: string;
}

/**
 * Проверяет сгенерированный Python код на наличие обязательных компонентов
 *
 * @param code - Сгенерированный Python код
 * @returns Результат валидации
 *
 * @example
 * const result = validateGeneratedPython(code);
 * if (!result.isValid) {
 *   console.error('Missing:', result.missingComponents);
 * }
 */
export function validateGeneratedPython(code: string): PythonValidationResult {
  const missingComponents: string[] = [];

  for (const component of REQUIRED_PYTHON_COMPONENTS) {
    if (!code.includes(component)) {
      missingComponents.push(component);
    }
  }

  return {
    isValid: missingComponents.length === 0,
    missingComponents,
    errorMessage: missingComponents.length > 0
      ? `Отсутствуют обязательные компоненты: ${missingComponents.join(', ')}`
      : undefined
  };
}

/**
 * Выбрасывает ошибку если код не прошёл валидацию
 *
 * @param code - Сгенерированный Python код
 * @throws Error если код невалиден
 *
 * @example
 * assertValidPython(code); // Бросает ошибку или ничего не делает
 */
export function assertValidPython(code: string): void {
  const result = validateGeneratedPython(code);
  if (!result.isValid) {
    throw new Error(`Генерация Python кода не удалась: ${result.errorMessage}`);
  }
}
