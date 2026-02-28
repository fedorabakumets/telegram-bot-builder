/**
 * @fileoverview Генерация сохранения ID в таблицу user_ids
 * 
 * Модуль создаёт Python-код для сохранения ID пользователя
 * в отдельную таблицу для рассылки.
 * 
 * @module bot-generator/user-input/generate-user-id-save
 */

/**
 * Генерирует Python-код для сохранения ID в таблицу user_ids
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код сохранения ID
 */
export function generateUserIdSave(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}# Сохранение ID в таблицу user_ids для рассылки\n`;
  code += `${indent}if waiting_node_id == "BMsBsZJr-pWxjMB_rl33z":  # Узел добавления ID\n`;
  code += `${indent}    try:\n`;
  code += `${indent}        async with db_pool.acquire() as conn:\n`;
  code += `${indent}            await conn.execute(\n`;
  code += `${indent}                """\n`;
  code += `${indent}                INSERT INTO user_ids (user_id, source)\n`;
  code += `${indent}                VALUES ($1, $2)\n`;
  code += `${indent}                ON CONFLICT (user_id) DO NOTHING\n`;
  code += `${indent}                """,\n`;
  code += `${indent}                int(user_text),\n`;
  code += `${indent}                'bot'\n`;
  code += `${indent}            )\n`;
  code += `${indent}            logging.info(f"✅ ID {user_text} вставлен в таблицу user_ids")\n`;
  code += `${indent}    except ValueError:\n`;
  code += `${indent}        logging.error(f"❌ Ошибка: введённое значение не является числом: {user_text}")\n`;
  code += `${indent}    except Exception as e:\n`;
  code += `${indent}        logging.error(f"❌ Ошибка сохранения ID в базу: {e}")\n`;
  return code;
}
