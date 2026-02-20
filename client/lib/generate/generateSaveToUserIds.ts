/**
 * @fileoverview Генерация кода для сохранения ID в базу user_ids
 * Для узлов с включённой опцией saveToUserIds
 */

import { Node } from '@shared/schema';

/**
 * Генерирует Python код для сохранения ID в таблицу user_ids
 * @param node - Узел с настройками
 * @param indent - Отступ для кода
 * @returns Сгенерированный код
 */
export function generateSaveToUserIdsCode(node: Node, indent: string = '        '): string {
  const { saveToUserIds, inputVariable } = node.data || {};

  if (!saveToUserIds) {
    return '';
  }

  const variableName = inputVariable || 'id';

  return [
    `${indent}# Сохранение ID в базу user_ids для рассылки`,
    `${indent}if user_id not in user_data:`,
    `${indent}    user_data[user_id] = {}`,
    `${indent}user_data[user_id]["${variableName}"] = user_text`,
    `${indent}logging.info(f"✅ ID {user_text} сохранён в базу user_ids для пользователя {user_id}")`,
    `${indent}# Вставка ID в базу данных через asyncpg`,
    `${indent}try:`,
    `${indent}    async with db_pool.acquire() as conn:`,
    `${indent}        await conn.execute(`,
    `${indent}            """`,
    `${indent}            INSERT INTO user_ids (project_id, user_id)`,
    `${indent}            VALUES ($1, $2)`,
    `${indent}            ON CONFLICT (project_id, user_id) DO NOTHING`,
    `${indent}            """,`,
    `${indent}            PROJECT_ID,`,
    `${indent}            int(user_text)  # Преобразуем введённый текст в число`,
    `${indent}        )`,
    `${indent}        logging.info(f"✅ ID {user_text} вставлен в таблицу user_ids (проект {PROJECT_ID})")`,
    `${indent}except ValueError:`,
    `${indent}    logging.error(f"❌ Ошибка: введённое значение не является числом: {user_text}")`,
    `${indent}except Exception as e:`,
    `${indent}    logging.error(f"❌ Ошибка сохранения ID в базу: {e}")`,
  ].join('\n');
}
