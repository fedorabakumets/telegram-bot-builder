/** @fileoverview Проверка области SQL истории и курсора при чтении нескольких ботов. */
import { expect, it } from 'vitest';
import { USER_HISTORY_QUERY } from './user-history-query';

it('ограничивает основную выборку и курсор одним проектом, пользователем и выбранной областью ботов', () => {
  expect(USER_HISTORY_QUERY).toContain('m.project_id = $1 AND ($2::integer IS NULL OR m.token_id = $2) AND m.user_id = $3');
  expect(USER_HISTORY_QUERY).toContain('c.project_id = $1 AND ($2::integer IS NULL OR c.token_id = $2) AND c.user_id = $3');
  expect(USER_HISTORY_QUERY).toContain('ORDER BY m.created_at DESC NULLS LAST, m.id DESC');
  expect(USER_HISTORY_QUERY).toContain("$7::boolean AND m.chat_type IN ('group', 'supergroup') AND m.message_type = 'user'");
  expect(USER_HISTORY_QUERY).toContain("$7::boolean AND c.chat_type IN ('group', 'supergroup') AND c.message_type = 'user'");
});
