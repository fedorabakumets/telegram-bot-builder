/**
 * @fileoverview Генерация кода для получения списка получателей рассылки
 *
 * Этот модуль генерирует Python-код для получения списка пользователей
 * из баз данных bot_users и/или user_ids для последующей рассылки.
 *
 * @module generateBroadcastRecipients
 */

import { processCodeWithAutoComments } from '../../../utils/generateGeneratedComment';

/**
 * Генерирует код для получения списка получателей рассылки
 *
 * @param {string} idSource - Тип источника: 'user_ids', 'bot_users' или 'both'
 * @param {string} indent - Отступ для кода
 * @param {string} errorMessage - Сообщение об ошибке
 * @returns {string} Сгенерированный Python-код
 */
export function generateBroadcastRecipients(
  idSource: string,
  indent: string = '    ',
  errorMessage: string = '❌ Ошибка рассылки'
): string {
  const codeLines: string[] = [];

  codeLines.push(`${indent}# Получение списка пользователей для рассылки`);
  codeLines.push(`${indent}recipients = []`);
  codeLines.push(`${indent}`);
  codeLines.push(`${indent}try:`);
  codeLines.push(`${indent}    async with db_pool.acquire() as conn:`);

  if (idSource === 'user_ids' || idSource === 'both') {
    codeLines.push(`${indent}        # Получаем ID из таблицы user_ids`);
    codeLines.push(`${indent}        rows = await conn.fetch(`);
    codeLines.push(`${indent}            "SELECT DISTINCT user_id FROM user_ids"`);
    codeLines.push(`${indent}        )`);
    codeLines.push(`${indent}        recipients.extend([str(row["user_id"]) for row in rows])`);
  }

  if (idSource === 'bot_users' || idSource === 'both') {
    codeLines.push(`${indent}        # Получаем ID из таблицы bot_users`);
    codeLines.push(`${indent}        rows = await conn.fetch(`);
    codeLines.push(`${indent}            "SELECT DISTINCT user_id FROM bot_users"`);
    codeLines.push(`${indent}        )`);
    codeLines.push(`${indent}        recipients.extend([str(row["user_id"]) for row in rows])`);
  }

  codeLines.push(`${indent}except Exception as e:`);
  codeLines.push(`${indent}    logging.error(f"❌ Ошибка получения списка пользователей: {e}")`);
  codeLines.push(`${indent}    await callback_query.message.answer("${errorMessage}")`);
  codeLines.push(`${indent}    return`);
  codeLines.push(`${indent}`);
  codeLines.push(`${indent}# Удаляем дубликаты`);
  codeLines.push(`${indent}recipients = list(set(recipients))`);
  codeLines.push(`${indent}logging.info(f"📋 Найдено {len(recipients)} получателей")`);

  // Применяем автоматическое добавление комментариев
  const processedCode = processCodeWithAutoComments(codeLines, 'generateBroadcastRecipients.ts');
  return processedCode.join('\n');
}
