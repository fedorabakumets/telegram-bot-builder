/**
 * @fileoverview Компонент для проверки структуры бота
 * Предоставляет функциональность для валидации и отображения ошибок структуры
 */

import { BotData } from '@shared/schema';
import { useState, useEffect } from 'react';

/**
 * Свойства компонента валидации бота
 * @interface BotValidationProps
 */
interface BotValidationProps {
  /** Данные бота для валидации */
  botData: BotData;
}

/**
 * Компонент для проверки и отображения валидации структуры бота
 * @param botData - Данные бота для проверки
 * @returns JSX элемент компонента валидации
 */
export function BotValidation({ botData }: BotValidationProps) {
  /**
   * Валидация структуры бота
   * Проверяет наличие стартовой команды, корректность команд и кнопок
   */
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: string[] }>({ isValid: true, errors: [] });

  useEffect(() => {
    async function loadValidation() {
      try {
        const { validateBotStructure } = await import('@/lib/utils/validateBotStructure');
        const result = validateBotStructure(botData);
        setValidationResult(result || { isValid: false, errors: [] });
      } catch (error) {
        console.error('Ошибка валидации:', error);
        setValidationResult({ isValid: false, errors: ['Ошибка загрузки модуля валидации'] });
      }
    }
    loadValidation();
  }, [botData]);

  // Не показываем ничего, если структура корректна
  if (validationResult.isValid) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800/40">
        <i className="fas fa-exclamation-triangle"></i>
        <span className="font-medium text-sm">Найдены ошибки в структуре:</span>
      </div>
      <div className="space-y-1.5">
        {validationResult.errors.map((error: string, index: number) => (
          <div
            key={index}
            className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded border-l-4 border-red-200 dark:border-red-800/60"
          >
            <i className="fas fa-times-circle text-red-500 dark:text-red-400 mt-0.5 text-xs"></i>
            <span className="text-xs text-red-700 dark:text-red-300">{error}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
