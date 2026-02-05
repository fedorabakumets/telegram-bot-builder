import { Button } from "../bot-generator";
import { Node } from "@shared/schema";

/**
 * Утилитарная функция для сбора всех уникальных кнопок переходов из условных сообщений
 * в узлах конфигурации бота.
 * 
 * Эта функция предназначена для анализа массива узлов и извлечения всех кнопок типа 'goto'
 * из условных сообщений. Полученные цели кнопок сохраняются в множество для обеспечения
 * уникальности и быстрого поиска.
 * 
 * Функция используется в процессе генерации обработчиков callback-запросов для создания
 * маршрутизации между узлами бота. Она помогает определить, какие узлы могут быть
 * достигнуты через условные сообщения.
 * 
 * @param nodes - Массив узлов конфигурации бота для анализа
 * @param allConditionalButtons - Множество для сохранения найденных целей кнопок
 * 
 * @example
 * // Пример использования функции
 * const nodes = [
 *   {
 *     data: {
 *       conditionalMessages: [
 *         {
 *           condition: "user_age > 18",
 *           buttons: [
 *             { text: "Взрослый контент", action: "goto", target: "adult_content" },
 *             { text: "Общие настройки", action: "goto", target: "general_settings" }
 *           ]
 *         },
 *         {
 *           condition: "user_age <= 18",
 *           buttons: [
 *             { text: "Детский контент", action: "goto", target: "kids_content" }
 *           ]
 *         }
 *       ]
 *     }
 *   }
 * ];
 * 
 * const conditionalButtons = new Set<string>();
 * collectConditionalMessageButtons(nodes, conditionalButtons);
 * 
 * console.log([...conditionalButtons]); // ['adult_content', 'general_settings', 'kids_content']
 */
export function collectConditionalMessageButtons(nodes: Node[], allConditionalButtons: Set<string>): void {
  // Проверяем наличие массива узлов
  if (!nodes || !Array.isArray(nodes)) {
    return;
  }

  // Итерация по всем узлам для поиска условных сообщений
  nodes.forEach((node: Node) => {
    // Проверяем наличие условных сообщений в узле
    if (node?.data?.conditionalMessages && Array.isArray(node.data.conditionalMessages)) {
      // Обрабатываем каждое условное сообщение
      node.data.conditionalMessages.forEach((condition: any) => {
        // Проверяем наличие кнопок в условии
        if (condition?.buttons && Array.isArray(condition.buttons)) {
          // Анализируем каждую кнопку
          condition.buttons.forEach((button: Button) => {
            // Ищем кнопки переходов с валидной целью
            if (button?.action === 'goto' && button?.target && typeof button.target === 'string') {
              allConditionalButtons.add(button.target);
            }
          });
        }
      });
    }
  });
}
