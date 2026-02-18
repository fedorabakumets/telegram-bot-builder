/**
 * @fileoverview Модуль для генерации кода, связанного с базой данных.
 *              Содержит функции для инициализации, сохранения, обновления и получения данных пользователей.
 *              Также включает вспомогательные функции для работы с переменными и логирования.

 */

import { AliasNodes } from './AliasNodes';
import { init_user_variables } from '../utils';
import { replace_variables_in_text } from './replace_variables_in_text';
import { hasComponentBeenGenerated, markComponentAsGenerated } from '../utils/generation-state';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';
import { get_moscow_time } from './get_moscow_time';
import { get_user_data_from_db } from './get_user_data_from_db';
import { get_user_from_db } from './get_user_from_db';
import { init_database } from './init_database';
import { log_message } from './log_message';
import { save_user_data_to_db } from './save_user_data_to_db';
import { save_user_to_db } from './save_user_to_db';
import { update_user_data_in_db } from './update_user_data_in_db';
import { update_user_variable_in_db } from './update_user_variable_in_db';

/**
 * Вспомогательная функция для генерации кода, связанного с базой данных
 * @param {boolean} userDatabaseEnabled - Флаг, указывающий, включена ли база данных
 * @param {any[]} nodes - Массив узлов для генерации кода
 * @returns {string} Сгенерированный код для работы с базой данных
 */
export function generateDatabaseCode(userDatabaseEnabled: boolean, nodes: any[]): string {
  if (!userDatabaseEnabled) {
    return '';
  }

  // Собираем весь код в массив строк для автоматической обработки
  const codeLines: string[] = [];

  // Конфигурация базы данных
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │           Настройки базы данных         │');
  codeLines.push('# └─────────────────────────────────────────┘');
  codeLines.push('DATABASE_URL = os.getenv("DATABASE_URL")');
  codeLines.push('');

  // Пул соединений с базой данных
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │        Пул соединений с базой данных    │');
  codeLines.push('# └─────────────────────────────────────────┘');
  codeLines.push('db_pool = None');
  codeLines.push('');

  // Инициализация БД
  init_database(codeLines);

  // Получение московского времени
  get_moscow_time(codeLines);

  // Инициализация переменных пользователя (только если функция еще не была сгенерирована)
  if (!hasComponentBeenGenerated('replace_variables_in_text')) {
    replace_variables_in_text(codeLines);
    markComponentAsGenerated('replace_variables_in_text');
  }

  // Инициализация пользовательских переменных
  init_user_variables(codeLines);

  // Сохранение пользователя в базу данных
  save_user_to_db(codeLines);

  // Получение пользователя из базы данных
  get_user_from_db(codeLines);

  // Получение данных пользователя из базы данных
  get_user_data_from_db(codeLines);

  // Алиасы для обработчиков команд
  AliasNodes(codeLines, nodes);

  // Обновление данных пользователя в базе данных
  update_user_data_in_db(codeLines);

  // Алиас для сохранения пользовательских данных (обратная совместимость)
  save_user_data_to_db(codeLines);

  // Обновление переменной пользователя в базе данных
  update_user_variable_in_db(codeLines);

  // Логирование сообщений
  log_message(codeLines);

  // Применяем автоматическое добавление комментариев ко всему коду
  const commentedCodeLines = processCodeWithAutoComments(codeLines, 'generateDatabaseCode.ts');

  return commentedCodeLines.join('\n');
}


