/**
 * @fileoverview Генерация кода для получения переменных из базы данных
 * Для использования в шаблонах сообщений
 */

/**
 * Генерирует Python код для получения списка ID из базы user_ids
 * @param indent - Отступ для кода
 * @returns Сгенерированный код
 */
export function generateDatabaseVariablesCode(indent: string = '        '): string {
  return [
    `${indent}# ┌─────────────────────────────────────────┐`,
    `${indent}# │    Переменные из базы данных (user_ids) │`,
    `${indent}# └─────────────────────────────────────────┘`,
    `${indent}# Инициализируем user_vars если не определён`,
    `${indent}if "user_vars" not in locals():`,
    `${indent}    user_vars = {}`,
    `${indent}# Получаем список всех ID из базы user_ids`,
    `${indent}try:`,
    `${indent}    async with db_pool.acquire() as conn:`,
    `${indent}        rows = await conn.fetch(`,
    `${indent}            "SELECT user_id FROM user_ids WHERE project_id = $1 ORDER BY created_at DESC",`,
    `${indent}            PROJECT_ID`,
    `${indent}        )`,
    `${indent}        # Формируем список ID через запятую`,
    `${indent}        user_ids_list = ", ".join(str(row["user_id"]) for row in rows)`,
    `${indent}        # Количество ID`,
    `${indent}        user_ids_count = len(rows)`,
    `${indent}        logging.info(f"✅ Получено {user_ids_count} ID из базы user_ids")`,
    `${indent}except Exception as e:`,
    `${indent}    logging.error(f"❌ Ошибка получения ID из базы: {e}")`,
    `${indent}    user_ids_list = "нет ID"`,
    `${indent}    user_ids_count = 0`,
    `${indent}    `,
    `${indent}# Добавляем переменные базы данных в user_vars`,
    `${indent}user_vars["user_ids_list"] = user_ids_list`,
    `${indent}user_vars["user_ids_count"] = user_ids_count`,
    `${indent}logging.info(f"🔧 Переменные базы данных добавлены в user_vars: user_ids_list={user_ids_list[:100] if len(user_ids_list) > 100 else user_ids_list}, user_ids_count={user_ids_count}")`,
  ].join('\n');
}
