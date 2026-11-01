/** @fileoverview Изменение подписей и ограничений столбца без переименования его внутреннего ключа. */
import type { Request, Response } from 'express';
import { tableColumnSettingsSchema } from '../../../../shared/table-column-settings';
import { ownedTable } from '../owned-table';
import { withClient } from '../table-db';
import { fail, positiveId, sqlFailure } from '../http-error';
import { notifyTableChange } from '../notify-table-change';
/**
 * Сохраняет только настройки существующего пользовательского столбца.
 * @param req - Запрос с проверкой доступа к проекту.
 * @param res - Подтверждение или ошибка формы.
 * @returns Завершение запроса.
 */
export async function columnSettingsHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res); if (!owned) return;
    const columnId = positiveId(req.params.columnId);
    if (!columnId || owned.table.name === '_content') { fail(res, 400, 'Столбцы контента доступны только для чтения'); return; }
    const parsed = tableColumnSettingsSchema.safeParse(req.body);
    if (!parsed.success) { fail(res, 400, parsed.error.issues[0]?.message ?? 'Проверьте настройки столбца'); return; }
    const result = await withClient(async (db) => {
      await db.query('BEGIN');
      try {
        await db.query('SELECT id FROM bot_tables WHERE id = $1 AND project_id = $2 FOR UPDATE', [owned.table.id, owned.projectId]);
        const changed = await db.query('UPDATE bot_table_columns SET settings = $3::jsonb WHERE id = $1 AND table_id = $2 RETURNING id', [columnId, owned.table.id, JSON.stringify(parsed.data)]);
        await db.query('COMMIT'); return changed.rows.length > 0;
      } catch (error) { await db.query('ROLLBACK'); throw error; }
    });
    if (!result) { fail(res, 404, 'Столбец не найден'); return; }
    await notifyTableChange(owned.projectId, owned.table.id, owned.table.name);
    res.json({ settings: parsed.data });
  } catch (error) { const result = sqlFailure(error); fail(res, result.status, result.message); }
}
