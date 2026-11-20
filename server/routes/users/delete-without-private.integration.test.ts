/** @fileoverview Удаление неподтверждённых контактов проверяется только в отдельной тестовой схеме. */
import { beforeAll, beforeEach, afterAll, expect, it } from 'vitest';
import { createImportTestDatabase } from './import-users-test-database';
import { countWithoutPrivateContacts, deleteWithoutPrivateContacts } from './delete-without-private-store';
const database=createImportTestDatabase();
beforeAll(async()=>{
  await database.setup();
  await database.pool.query(`ALTER TABLE bot_messages ADD COLUMN message_type text,ADD COLUMN chat_id text;
    CREATE TABLE analytics_events_v2(project_id integer,token_id integer,user_id text,kind text,chat_type text,directed boolean,occurred_at timestamptz);
    CREATE TABLE analytics_audience_evidence_v2(project_id integer,token_id integer,user_id text,reason text,chat_type text,observed_at timestamptz);`);
});
afterAll(()=>database.cleanup());
beforeEach(async()=>{
  await database.pool.query(`TRUNCATE bot_users,bot_messages,analytics_events_v2;
    INSERT INTO bot_users(project_id,token_id,user_id,is_bot,imported_at) VALUES
    (1,11,100,0,NULL),(1,12,100,0,NULL),(1,11,200,0,NULL),(1,12,200,0,NULL),(1,11,201,0,now()),(2,11,200,0,now());
    INSERT INTO bot_messages VALUES
    (1,11,'100','private','bot','100'),(1,12,'100','private','user','100'),
    (1,11,'200','private','system','200'),(1,12,'200','private','bot','200'),
    (1,11,'200','supergroup','user','-100');
    INSERT INTO analytics_events_v2 VALUES(1,11,'200','message_in','supergroup',false,now());`);
});
it('предварительно считает людей отдельно от карточек и защищает личное обращение в другом боте',async()=>{
  expect(await countWithoutPrivateContacts(database.pool,1,null)).toEqual({people:2,botRecords:3});
  expect(await countWithoutPrivateContacts(database.pool,1,11)).toEqual({people:3,botRecords:3});
});
it('удаляет только карточки выбранной области, сохраняя сообщения, факты и другой проект',async()=>{
  const counts=await countWithoutPrivateContacts(database.pool,1,null);
  expect(await deleteWithoutPrivateContacts(database.pool,1,null,counts)).toEqual(counts);
  const rows=(await database.pool.query('SELECT project_id,user_id::text user_id FROM bot_users ORDER BY project_id,user_id')).rows;
  expect(rows).toEqual([{project_id:1,user_id:'100'},{project_id:1,user_id:'100'},{project_id:2,user_id:'200'}]);
  expect((await database.pool.query('SELECT COUNT(*)::integer n FROM bot_messages')).rows[0].n).toBe(5);
  expect((await database.pool.query('SELECT COUNT(*)::integer n FROM analytics_events_v2')).rows[0].n).toBe(1);
});
it('удаление одного бота не затрагивает карточку того же человека в другом боте',async()=>{
  await deleteWithoutPrivateContacts(database.pool,1,11,{people:3,botRecords:3});
  expect((await database.pool.query('SELECT COUNT(*)::integer n FROM bot_users WHERE project_id=1 AND token_id=12')).rows[0].n).toBe(2);
});
it('откатывает удаление, если после подсчёта появилось личное обращение',async()=>{
  const counts=await countWithoutPrivateContacts(database.pool,1,null);
  await database.pool.query("INSERT INTO bot_messages VALUES(1,11,'200','private','user','200')");
  await expect(deleteWithoutPrivateContacts(database.pool,1,null,counts)).rejects.toThrow('selection_changed');
  expect((await database.pool.query('SELECT COUNT(*)::integer n FROM bot_users')).rows[0].n).toBe(6);
});

/** Сводный удалённый статус требует удаления аккаунта во всех видимых связях с ботами. */
it('удаляет только удалённые аккаунты и сохраняет блокировки, другие статусы и сообщения',async()=>{
  await database.pool.query(`UPDATE bot_users SET is_deleted=1 WHERE user_id=200 OR user_id=100 AND token_id=11;
    UPDATE bot_users SET is_blocked=1 WHERE user_id=201;`);
  expect(await countWithoutPrivateContacts(database.pool,1,null,'deleted')).toEqual({people:1,botRecords:2});
  expect(await countWithoutPrivateContacts(database.pool,1,11,'deleted')).toEqual({people:2,botRecords:2});
  await deleteWithoutPrivateContacts(database.pool,1,null,{people:1,botRecords:2},'deleted');
  expect((await database.pool.query('SELECT user_id::text id FROM bot_users WHERE project_id=1 ORDER BY user_id')).rows.map(row=>row.id)).toEqual(['100','100','201']);
  expect((await database.pool.query('SELECT COUNT(*)::integer n FROM bot_messages')).rows[0].n).toBe(5);
  expect((await database.pool.query('SELECT COUNT(*)::integer n FROM bot_users WHERE project_id=2')).rows[0].n).toBe(1);
});
/** Перепроверка удалённого статуса защищает аккаунт при изменении результата проверки. */
it('откатывает удаление при изменении статуса аккаунта после подтверждения количества',async()=>{
  await database.pool.query('UPDATE bot_users SET is_deleted=1 WHERE user_id=200');
  const expected=await countWithoutPrivateContacts(database.pool,1,null,'deleted');
  await database.pool.query('UPDATE bot_users SET is_deleted=0 WHERE user_id=200 AND token_id=12');
  await expect(deleteWithoutPrivateContacts(database.pool,1,null,expected,'deleted')).rejects.toThrow('selection_changed');
  expect((await database.pool.query('SELECT COUNT(*)::integer n FROM bot_users')).rows[0].n).toBe(6);
});
