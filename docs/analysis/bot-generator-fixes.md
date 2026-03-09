/**
 * @fileoverview Исправления критических проблем генератора
 *
 * Документ описывает внесённые исправления для устранения проблем
 * с генерацией неполного Python кода бота.
 *
 * @summary Исправления
 * - Добавлена валидация сгенерированного Python кода
 * - Исправлена проверка hasInputCollection для автопереходов
 * - Добавлена точка входа main() всегда, а не только при multiSelect
 * - Улучшена структура модулей с разделением ответственности
 *
 * @fileoverview bot-generator-fixes
 */

/**
 * Список исправленных проблем
 */
export const FIXES_SUMMARY = {
  /**
   * Проблема: Файл генерировался неполным, начинался с середины кода
   * Причина: hasInputCollection не проверял enableAutoTransition
   * Решение: Добавлена проверка autoTransition в hasInputCollection
   */
  fix1: {
    file: 'client/lib/bot-generator/utils/hasInputCollection.ts',
    problem: 'Автопереходы не триггерили генерацию кода навигации',
    solution: 'Добавлена проверка: if (data.enableAutoTransition && data.autoTransitionTo) result.hasCollectInput = true'
  },

  /**
   * Проблема: Точка входа main() добавлялась только при наличии multiSelectNodes
   * Причина: generateCompleteBotScriptFromNodeGraphWithDependencies не возвращала код всегда
   * Решение: Добавлена генерация if __name__ == "__main__": всегда
   */
  fix2: {
    file: 'client/lib/generate-complete-bot-script.ts',
    problem: 'Файл заканчивался на середине кода без точки входа',
    solution: 'Точка входа генерируется всегда независимо от multiSelectNodes'
  },

  /**
   * Проблема: Отсутствовала валидация сгенерированного кода
   * Причина: Генератор не проверял результат
   * Решение: Создан модуль валидации с проверкой обязательных компонентов
   */
  fix3: {
    file: 'client/lib/bot-generator/validation/validate-generated-python.ts',
    problem: 'Невалидный код генерировался без ошибок',
    solution: 'Добавлена функция assertValidPython() с проверкой обязательных импортов и структур'
  },

  /**
   * Проблема: bot-generator.ts не возвращал код явно
   * Причина: Функция generatePythonCode не имела return с валидацией
   * Решение: Добавлен return finalCode с вызовом assertValidPython()
   */
  fix4: {
    file: 'client/lib/bot-generator.ts',
    problem: 'Код не валидировался перед возвратом',
    solution: 'Добавлена валидация и явный возврат кода'
  },

  /**
   * Проблема: Отсутствовали базовые импорты (asyncio, Bot, Dispatcher)
   * Причина: generatePythonImports не включал базовые импорты
   * Решение: Создан модуль generate-base-imports и интегрирован в generatePythonImports
   */
  fix5: {
    file: 'client/lib/bot-generator/imports/generate-base-imports.ts',
    problem: 'Отсутствовали обязательные импорты aiogram',
    solution: 'Создана функция generateBaseImports() с базовыми импортами'
  }
} as const;

/**
 * Обязательные компоненты Python кода для валидации
 */
export const REQUIRED_PYTHON_COMPONENTS = [
  'import asyncio',
  'from aiogram import Bot',
  'from aiogram import Dispatcher',
  'dp = Dispatcher()',
  'async def main():',
  'if __name__ == "__main__":',
  'asyncio.run(main())'
] as const;

/**
 * Новые файлы, созданные для улучшения архитектуры
 */
export const NEW_FILES = [
  {
    path: 'client/lib/bot-generator/validation/validate-generated-python.ts',
    purpose: 'Валидация сгенерированного Python кода',
    exports: ['validateGeneratedPython', 'assertValidPython', 'PythonValidationResult']
  },
  {
    path: 'client/lib/bot-generator/validation/index.ts',
    purpose: 'Экспорт модулей валидации',
    exports: ['validateGeneratedPython', 'assertValidPython']
  },
  {
    path: 'client/lib/bot-generator/imports/generate-base-imports.ts',
    purpose: 'Генерация базовых импортов aiogram',
    exports: ['generateBaseImports', 'BaseImportGeneratorOptions']
  },
  {
    path: 'client/lib/bot-generator-fixes.ts',
    purpose: 'Документация исправлений',
    exports: ['FIXES_SUMMARY', 'REQUIRED_PYTHON_COMPONENTS', 'NEW_FILES', 'MODIFIED_FILES']
  }
] as const;

/**
 * Изменённые файлы
 */
export const MODIFIED_FILES = [
  {
    path: 'client/lib/bot-generator/utils/hasInputCollection.ts',
    change: 'Добавлена проверка enableAutoTransition'
  },
  {
    path: 'client/lib/generate-complete-bot-script.ts',
    change: 'Точка входа генерируется всегда'
  },
  {
    path: 'client/lib/bot-generator.ts',
    change: 'Добавлена валидация и явный return, интеграция hasInlineButtons'
  },
  {
    path: 'client/lib/bot-generator/user-input/handle-user-input.ts',
    change: 'Генерация кода при hasInput OR hasAuto'
  },
  {
    path: 'client/lib/index.ts',
    change: 'Экспорт функций валидации'
  },
  {
    path: 'client/lib/bot-generator/imports/generate-python-imports.ts',
    change: 'Добавлен вызов generateBaseImports и hasInlineButtons параметр'
  }
] as const;
