/** @fileoverview Проверка пересечения аудитории проблемного бота с другими доступными ботами. */
import { afterAll, beforeAll, expect, it } from 'vitest';
import { createImportTestDatabase } from './import-users-test-database';
import { userHasOtherBotsSql } from './user-bot-unavailable-sql';
const database = createImportTestDatabase();
beforeAll(async () => {
  await database.setup();
  await database.pool.query(`CREATE TABLE bot_tokens(id integer,project_id integer,authorization_error text);
    INSERT INTO bot_tokens VALUES(10,12,'telegram_frozen'),(9,12,NULL),(8,13,NULL);
    INSERT INTO bot_users(user_id,project_id,token_id,is_blocked,is_deleted) VALUES
      (1,12,10,0,0),(1,12,9,0,0),(2,12,10,0,0),(3,12,10,0,0),(3,12,9,1,0),
      (4,12,10,0,1),(4,12,9,0,0),(5,12,10,0,0),(5,13,8,0,0),(6,12,10,0,0);
    INSERT INTO bot_messages(project_id,token_id,user_id,chat_type)
      SELECT project_id,token_id,user_id::text,'private' FROM bot_users;
    INSERT INTO bot_users(user_id,project_id,token_id,imported_at) VALUES(6,12,9,NOW());`);
});
afterAll(() => database.cleanup());
/** Другой бот должен быть доступен, принадлежать проекту и иметь реальную незаблокированную переписку. */
it('считает только подтверждённые связи с другим доступным ботом', async () => {
  for (const tokenId of [10, null]) {
    const result = await database.pool.query(`SELECT DISTINCT u.user_id::text FROM bot_users u
      WHERE u.project_id=$1 AND ($2::integer IS NULL OR u.token_id=$2) AND (${userHasOtherBotsSql()})`, [12, tokenId]);
    expect(result.rows).toEqual([{ user_id: '1' }]);
  }
});
