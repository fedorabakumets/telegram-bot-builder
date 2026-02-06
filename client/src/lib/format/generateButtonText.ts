import { escapeForPython } from "./escapeForPython";
import { processCodeWithAutoComments } from "../utils/generateGeneratedComment";

/**
 * Генерирует текст кнопки с поддержкой переменных для Python кода.
 * Функция автоматически определяет, содержит ли текст переменные в формате {переменная},
 * и соответствующим образом форматирует код для их замены во время выполнения.
 * 
 * Логика работы:
 * 1. Проверяет наличие переменных в тексте кнопки (паттерн {переменная})
 * 2. Если переменные найдены:
 *    - Экранирует текст для корректной работы в Python
 *    - Оборачивает в функцию replace_variables_in_text для динамической замены
 * 3. Если переменных нет:
 *    - Экранирует текст для Python
 *    - Возвращает как обычную строковую константу
 * 
 * @param buttonText - Исходный текст кнопки для форматирования
 * @returns Python код для отображения текста кнопки (строка или вызов функции)
 * 
 * @example
 * // Обычный текст без переменных
 * const buttonCode = generateButtonText("Нажмите здесь");
 * // Возвращает: '"Нажмите здесь"'
 * 
 * @example
 * // Текст с переменными
 * const buttonCode = generateButtonText("Привет, {user_name}!");
 * // Возвращает: 'replace_variables_in_text("Привет, {user_name}!", user_vars)'
 * 
 * @example
 * // Текст с кавычками и переносами
 * const buttonCode = generateButtonText('Скажи: "Привет!"\nНа новой строке');
 * // Возвращает: '"Скажи: \"Привет!\"\\nНа новой строке"'
 * 
 * @example
 * // Текст с множественными переменными
 * const buttonCode = generateButtonText("Добро пожаловать, {first_name} {last_name}!");
 * // Возвращает: 'replace_variables_in_text("Добро пожаловать, {first_name} {last_name}!", user_vars)'
 */
export function generateButtonText(buttonText: string): string {
  // Собираем код в массив строк для автоматической обработки комментариев
  const codeLines: string[] = [];
  
  // Проверяем, есть ли в тексте переменные (паттерн {переменная})
  if (buttonText.includes('{') && buttonText.includes('}')) {
    // Экранируем текст для Python и оборачиваем в replace_variables_in_text
    const escapedText = escapeForPython(buttonText);
    const resultCode = `replace_variables_in_text("${escapedText}", user_vars)`;
    
    // Добавляем комментарии о том, что это код с переменными
    codeLines.push(`# Генерация текста кнопки с переменными: "${buttonText}"`);
    codeLines.push(`# Результат: ${resultCode}`);
    codeLines.push(resultCode);
  } else {
    // Обычный текст без переменных
    const escapedText = escapeForPython(buttonText);
    const resultCode = `"${escapedText}"`;
    
    // Добавляем комментарии о том, что это обычный текст
    codeLines.push(`# Генерация обычного текста кнопки: "${buttonText}"`);
    codeLines.push(`# Результат: ${resultCode}`);
    codeLines.push(resultCode);
  }
  
  // Применяем автоматическое добавление комментариев ко всему коду
  const processedCode = processCodeWithAutoComments(codeLines, 'generateButtonText.ts');
  return processedCode.join('\n');
}
