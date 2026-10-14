/** @fileoverview Реальная SQL-проверка истории и пагинации на временных таблицах локальной БД. */
import 'dotenv/config';
import { Client } from 'pg';
import { expect, it } from 'vitest';
import { dialogMessageParams, encodeMessageCursor } from '../../server/routes/dialogs/message-pagination';
import { buildDialogMessageQuery } from '../../server/routes/dialogs/message-query';

it('изолирует области, читает группы/каналы, контекст и страницы с одинаковыми/пустыми датами', async () => {
  const url = process.env.DATABASE_URL;
  if (!url || !['localhost', '127.0.0.1', '::1'].includes(new URL(url).hostname)) throw new Error('Нужен локальный PostgreSQL');
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(`CREATE TEMP TABLE bot_messages (id int, project_id int, token_id int,
      user_id text, chat_id text, chat_type text, message_type text, message_text text,
      message_data jsonb, telegram_message_id int, created_at timestamptz);
      CREATE TEMP TABLE bot_groups (id int, project_id int, token_id int, group_id text, name text);
      CREATE TEMP TABLE bot_message_media (id int, message_id int, media_file_id int, media_kind text, order_index int);
      CREATE TEMP TABLE media_files (id int, project_id int, file_name text, file_type text,
        file_size int, mime_type text);
      INSERT INTO bot_messages VALUES
      (1,9,5,'123','123','private','user','Старое',NULL,101,'2026-10-14 01:00:00.000100'),
      (2,9,5,'123','123','private','bot','Новое',NULL,102,'2026-10-14 01:00:00.000200'),
      (3,9,5,'123','123','private','user','Без даты',NULL,103,NULL),
      (4,9,5,'123','-1001','supergroup','user','Контекст',NULL,104,'2026-10-14 02:00'),
      (5,9,5,'123','-1001','supergroup','bot','Не личный ответ',NULL,105,'2026-10-14 03:00'),
      (6,9,5,'456','-1001','supergroup','user','Другой человек',NULL,106,'2026-10-14 04:00'),
      (7,9,6,'123','123','private','user','Другой бот',NULL,107,'2026-10-14 05:00'),
      (8,10,5,'123','123','private','user','Другой проект',NULL,108,'2026-10-14 06:00'),
      (9,9,5,'777000','-1002','channel','user','Канал',NULL,109,'2026-10-14 07:00');
      INSERT INTO bot_groups VALUES (1,9,5,'-1001','Наша группа'),(2,9,6,'-1001','Чужое имя');
      INSERT INTO media_files VALUES (1,9,'photo.jpg','photo',100,'image/jpeg'),(2,10,'secret.jpg','photo',100,'image/jpeg');
      INSERT INTO bot_message_media VALUES (1,2,1,'photo',0),(2,2,2,'photo',1);`);
    /**
     * Выполняет реальный параметризованный запрос с заданными фильтрами.
     * @param chatId - Чат
     * @param query - Параметры истории
     * @returns Выбранные записи и область курсора
     */
    const read = async (chatId: string, query: Record<string, unknown>) => {
      const built = buildDialogMessageQuery(9, chatId, dialogMessageParams.parse({ tokenId: 5, ...query }));
      return { rows: (await client.query(built.sql, built.values)).rows, scope: built.scope };
    };
    const personal = await read('123', { chatType: 'private' });
    expect(personal.rows.map(row => row.id)).toEqual([2, 1, 3]);
    expect(personal.rows[0].media).toHaveLength(1);
    expect(personal.rows[0].media[0].file_name).toBe('photo.jpg');
    const context = await read('123', { chatType: 'private', includeGroupContext: 'true' });
    expect(context.rows.map(row => row.id)).toEqual([4, 2, 1, 3]);
    expect(context.rows[0].source_chat_title).toBe('Наша группа');
    expect((await read('-1001', { chatType: 'supergroup' })).rows.map(row => row.id)).toEqual([6, 5, 4]);
    expect((await read('-1002', { chatType: 'channel' })).rows.map(row => row.id)).toEqual([9]);
    const cursor = encodeMessageCursor({ scope: personal.scope, time: personal.rows[0].created_at.toISOString(), id: 2 });
    expect((await read('123', { chatType: 'private', cursor })).rows.map(row => row.id)).toEqual([1, 3]);
    const nullCursor = encodeMessageCursor({ scope: personal.scope, time: null, id: 3 });
    expect((await read('123', { chatType: 'private', cursor: nullCursor })).rows).toHaveLength(0);
    await expect(read('123', { chatType: 'private', includeGroupContext: 'true', cursor })).rejects.toThrow();
  } finally { await client.query('ROLLBACK'); await client.end(); }
}, 15_000);
