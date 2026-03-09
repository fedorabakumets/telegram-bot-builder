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
 * Используем более гибкие паттерны для проверки
 */
const REQUIRED_PYTHON_PATTERNS = [
  { pattern: 'import asyncio', name: 'import asyncio' },
  { pattern: 'Bot', name: 'Bot (from aiogram import Bot)' },
  { pattern: 'Dispatcher', name: 'Dispatcher (from aiogram import Dispatcher)' },
  { pattern: 'Dispatcher()', name: 'Dispatcher() инициализация' },
  { pattern: 'async def main():', name: 'async def main():' },
  { pattern: 'if __name__ == "__main__":', name: 'if __name__ == "__main__":' },
  { pattern: 'asyncio.run(main())', name: 'asyncio.run(main())' }
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

  for (const { pattern, name } of REQUIRED_PYTHON_PATTERNS) {
    if (!code.includes(pattern)) {
      missingComponents.push(name);
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
