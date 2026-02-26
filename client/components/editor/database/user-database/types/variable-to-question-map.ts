/**
 * @fileoverview Типы карты переменных и вопросов
 * @description Сопоставление переменных ввода с текстами вопросов из flowData проекта
 * @module
 */

/**
 * Карта соответствия переменных ввода вопросам из схемы бота
 * @typedef VariableToQuestionMap
 * @type {Record<string, string>}
 * @description Используется для отображения контекста ответов пользователей
 * @description Ключ — имя переменной (inputVariable), значение — текст вопроса (messageText)
 *
 * @example
 * // Пример использования:
 * const map: VariableToQuestionMap = {
 *   "response_name": "Как вас зовут?",
 *   "response_email": "Введите ваш email:",
 *   "response_phone": "Введите номер телефона:"
 * };
 *
 * @example
 * // Получение текста вопроса по переменной:
 * const questionText = map["response_name"]; // "Как вас зовут?"
 */
export type VariableToQuestionMap = Record<string, string>;
