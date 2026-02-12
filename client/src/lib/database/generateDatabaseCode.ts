/**
 * @fileoverview Модуль для генерации кода, связанного с базой данных.
 *              Содержит функции для инициализации, сохранения, обновления и получения данных пользователей.
 *              Также включает вспомогательные функции для работы с переменными и логирования.

 */

import { AliasNodes } from './AliasNodes';
import { init_user_variables, replace_variables_in_text } from '../utils';
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

  // Инициализация базы данных
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │        Инициализация базы данных        │');
  codeLines.push('# └─────────────────────────────────────────┘');
  init_database(codeLines);

  // Получение московского времени
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │       Получение московского времени     │');
  codeLines.push('# └─────────────────────────────────────────┘');
  get_moscow_time(codeLines);

  // Инициализация переменных пользователя
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │    Инициализация переменных пользователя│');
  codeLines.push('# └─────────────────────────────────────────┘');
  replace_variables_in_text(codeLines);

  // Инициализация пользовательских переменных
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │  Инициализация пользовательских переменных│');
  codeLines.push('# └─────────────────────────────────────────┘');
  init_user_variables(codeLines);

  // Сохранение пользователя в базу данных
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │    Сохранение пользователя в базу данных│');
  codeLines.push('# └─────────────────────────────────────────┘');
  save_user_to_db(codeLines);

  // Получение пользователя из базы данных
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │   Получение пользователя из базы данных │');
  codeLines.push('# └─────────────────────────────────────────┘');
  get_user_from_db(codeLines);

  // Получение данных пользователя из базы данных
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │ Получение данных пользователя из базы   │');
  codeLines.push('# │             данных                      │');
  codeLines.push('# └─────────────────────────────────────────┘');
  get_user_data_from_db(codeLines);

  // Алиасы для обработчиков команд
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │      Алиасы для обработчиков команд     │');
  codeLines.push('# └─────────────────────────────────────────┘');
  AliasNodes(codeLines, nodes);

  // Обновление данных пользователя в базе данных
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │ Обновление данных пользователя в базе   │');
  codeLines.push('# │             данных                      │');
  codeLines.push('# └─────────────────────────────────────────┘');
  update_user_data_in_db(codeLines);

  // Алиас для сохранения пользовательских данных (обратная совместимость)
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │ Алиас для сохранения пользовательских   │');
  codeLines.push('# │    данных (обратная совместимость)      │');
  codeLines.push('# └─────────────────────────────────────────┘');
  save_user_data_to_db(codeLines);

  // Обновление переменной пользователя в базе данных
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │ Обновление переменной пользователя в    │');
  codeLines.push('# │           базе данных                   │');
  codeLines.push('# └─────────────────────────────────────────┘');
  update_user_variable_in_db(codeLines);

  // Логирование сообщений
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │            Логирование сообщений        │');
  codeLines.push('# └─────────────────────────────────────────┘');
  log_message(codeLines);

  // Применяем автоматическое добавление комментариев ко всему коду
  const commentedCodeLines = processCodeWithAutoComments(codeLines, 'generateDatabaseCode.ts');

  return commentedCodeLines.join('\n');
}


