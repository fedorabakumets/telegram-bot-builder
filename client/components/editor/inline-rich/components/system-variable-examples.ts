/**
 * @fileoverview Примеры значений системных переменных
 * @description Карта «имя системной переменной → пример значения». Используется
 * в VariableMenuItem, чтобы показать пользователю как примерно будет выглядеть
 * подставленное значение. У пользовательских переменных значение на этапе
 * редактирования неизвестно, поэтому для них примера нет.
 * @module system-variable-examples
 */

/** Карта примеров значений по имени системной переменной */
const SYSTEM_VARIABLE_EXAMPLES: Record<string, string> = {
  user_id: '123456789',
  username: 'ivan_petrov',
  first_name: 'Иван',
  last_name: 'Петров',
  user_name: 'Иван',
  chat_id: '-1001234567890',
  bot_name: 'Мой бот',
  message_id: '42',
  message_text: 'Привет',
  callback_data: 'btn_yes',
  button_text: 'Да',
  current_date: '2026-06-14',
  current_time: '14:30:00',
  current_datetime: '2026-06-14 14:30:00',
  language_code: 'ru',
  user_ids_count: '1500',
  user_interaction_count: '27'
};

/**
 * Возвращает пример значения для известной системной переменной
 * @param name - Имя переменной (поле variable.name)
 * @returns Строка-пример или undefined, если примера нет
 */
export function getVariableExample(name: string): string | undefined {
  return SYSTEM_VARIABLE_EXAMPLES[name];
}
