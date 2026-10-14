/** @fileoverview Реальные проверки буквального поиска на временных таблицах локального PostgreSQL. */
import 'dotenv/config';
import { Client } from 'pg';
import { expect, it } from 'vitest';
import { buildDialogSearchQuery, dialogSearchParams } from '../../server/routes/dialogs/message-search-query';
import { encodeMessageCursor } from '../../server/routes/dialogs/message-pagination';

it('изолирует ботов и проекты, поддерживает буквальные символы, фильтры и устойчивые страницы', async () => {
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

    await client.query(`UPDATE bot_messages SET message_text = 'Оплата 50%_test' WHERE id IN (1,2,3,4,5,6,7,8,9);
      INSERT INTO bot_messages SELECT n,9,5,'123','123','private','user','оплата',NULL,n,'2026-10-14 08:00'
        FROM generate_series(10,24) n;`);
    /**
     * Выполняет поиск с проверенными параметрами.
     * @param options - Фильтры поиска
     * @returns Строки и область курсора
     */
    const read = async (options: Record<string, unknown> = {}) => {
      const built = buildDialogSearchQuery(9, dialogSearchParams.parse({ tokenId: 5, query: 'оПлАтА', ...options }));
      return { rows: (await client.query(built.sql, built.values)).rows, scope: built.scope };
    };
    const first = await read();
    expect(first.rows.map(row => row.id)).toEqual([24,23,22,21,20,19,18,17,16,15,14]);
    expect((await read({ limit: 100 })).rows).toHaveLength(22);
    expect((await read({ query: '%_test', limit: 100 })).rows.map(row => row.id)).toEqual([9,6,5,4,2,1,3]);
    await client.query(`UPDATE bot_messages SET message_text = $1 WHERE id = 1`, ['путь C:\\tmp']);
    expect((await read({ query: '\\' })).rows.map(row => row.id)).toEqual([1]);
    expect((await read({ query: 'несуществующее' })).rows).toEqual([]);
    expect((await read({ chatId: '-1001', chatType: 'supergroup' })).rows.map(row => row.id)).toEqual([6,5,4]);
    expect((await read({ chatType: 'channel' })).rows.map(row => row.id)).toEqual([9]);
    const personal = await read({ query: '%_test', chatId: '123', chatType: 'private' });
    expect(personal.rows.map(row => row.id)).toEqual([2,3]);
    const cursor = encodeMessageCursor({ scope: first.scope, time: first.rows[9].created_at.toISOString(), id: 15 });
    expect((await read({ cursor })).rows.map(row => row.id)).toEqual([14,13,12,11,10,9,6,5,4,2,3]);
    const tie = await read({ query: '%_test' });
    const tieCursor = encodeMessageCursor({ scope: tie.scope, time: tie.rows[4].created_at.toISOString(), id: 2 });
    expect((await read({ query: '%_test', cursor: tieCursor })).rows.map(row => row.id)).toEqual([3]);
    const nullCursor = encodeMessageCursor({ scope: tie.scope, time: null, id: 3 });
    expect((await read({ query: '%_test', cursor: nullCursor })).rows).toEqual([]);
    await expect(read({ query: 'изменённый', cursor })).rejects.toThrow();
    await expect(read({ tokenId: 6, cursor })).rejects.toThrow();
    await expect(read({ chatType: 'private', cursor })).rejects.toThrow();
    await expect(read({ cursor: 'ошибка' })).rejects.toThrow();
  } finally { await client.query('ROLLBACK'); await client.end(); }
}, 15_000);
