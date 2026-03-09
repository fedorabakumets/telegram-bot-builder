/**
 * @fileoverview Проверка наличия кнопок с URL-ссылками
 * 
 * Модуль содержит функцию для проверки, есть ли в проекте
 * кнопки с действием 'url' и заполненным полем url.
 * 
 * @module bot-generator/user-input/has-url-buttons
 */

/**
 * Проверяет наличие кнопок с URL-ссылками в узлах
 * 
 * @param nodes - Массив узлов для проверки
 * @returns true если найдены кнопки с URL, иначе false
 */
export function hasUrlButtons(nodes: any[]): boolean {
  for (const node of nodes) {
    if (node.data?.buttons && Array.isArray(node.data.buttons)) {
      for (const button of node.data.buttons) {
        if (button.action === 'url' && button.url) {
          return true;
        }
      }
    }
  }
  return false;
}
