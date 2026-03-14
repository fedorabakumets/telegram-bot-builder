/**
 * @fileoverview Обработчики групп бота
 * Функции для генерации обработчиков групповых событий
 */

/**
 * Генерирует обработчики событий для групп бота
 * @param groups - Массив групп бота
 * @param generateGroupHandlers - Функция генерации обработчиков групп
 * @returns {string} Python код обработчиков
 */
export const generateGroupBasedEventHandlers = (
  groups: any[],
  generateGroupHandlers: (groups: any[]) => string
): string => {
  let code = '\n';
  code += generateGroupHandlers(groups);
  return code;
};
