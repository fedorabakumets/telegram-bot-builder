import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Конвертирует JavaScript boolean значение в строковое представление Python boolean
 *
 * Функция принимает любое значение JavaScript и возвращает его строковое представление
 * в формате Python ('True' или 'False'). Используется при генерации Python кода для
 * правильного отображения булевых значений.
 *
 * @param value - Любое значение JavaScript
 * @returns Строка 'True' или 'False'
 *
 * @example
 * toPythonBoolean(true) // Возвращает: 'True'
 * toPythonBoolean(false) // Возвращает: 'False'
 * toPythonBoolean(1) // Возвращает: 'True'
 * toPythonBoolean(0) // Возвращает: 'False'
 * toPythonBoolean('') // Возвращает: 'False'
 */
export function toPythonBoolean(value: any): string {
  // Собираем код в массив строк для автоматической обработки
  const codeLines: string[] = [];
  
  codeLines.push(value ? 'True' : 'False');
  
  // Применяем автоматическое добавление комментариев ко всему коду
  processCodeWithAutoComments(codeLines, 'toPythonBoolean.ts');
  
  // Возвращаем результат
  return value ? 'True' : 'False';
}
