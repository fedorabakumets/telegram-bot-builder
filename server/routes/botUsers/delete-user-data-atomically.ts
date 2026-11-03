/** @fileoverview Атомарное удаление пользовательских данных без ложного успеха. */
import type { Pool } from 'pg';
/** Удаляет данные выбранного проекта и бота одной транзакцией. */
export async function deleteUserDataAtomically(pool: Pick<Pool, 'connect'>, projectId: number, tokenId?: number, userId?: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const values: unknown[] = [projectId];
    let filter = 'project_id = $1';
    if (tokenId !== undefined) { values.push(tokenId); filter += ` AND token_id = $${values.length}`; }
    if (userId !== undefined) { values.push(userId); filter += ` AND user_id = $${values.length}`; }
    const messages = await client.query(`DELETE FROM bot_messages WHERE ${filter}`, values);
    const users = await client.query(`DELETE FROM bot_users WHERE ${filter}`, values);
    await client.query('COMMIT');
    return { persistence: { confirmed: true, method: 'transaction_commit' }, deleted: true, deletedCount: (messages.rowCount ?? 0) + (users.rowCount ?? 0),
      deletedUsers: users.rowCount ?? 0, deletedMessages: messages.rowCount ?? 0 };
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
