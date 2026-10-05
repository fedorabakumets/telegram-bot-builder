/**
 * @fileoverview Проверка текста SQL роли bot_runtime без Postgres
 * @module server/database/bot-runtime/bot-runtime-role.test
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  BOT_RUNTIME_DENIED_TABLES,
  BOT_RUNTIME_DIRECT_TABLES,
  BOT_RUNTIME_PROJECT_TABLES,
  BOT_RUNTIME_SEQUENCES,
  BOT_RUNTIME_TABLES,
} from "./bot-runtime-tables";

const sql = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "bot-runtime-role.sql"), "utf8");

describe("bot-runtime-role.sql", () => {
  it("создаёт одну роль bot_runtime без пароля в тексте и без CREATE", () => {
    assert.match(sql, /CREATE ROLE bot_runtime LOGIN/);
    assert.match(sql, /NOBYPASSRLS/);
    assert.doesNotMatch(sql, /PASSWORD/i);
    assert.doesNotMatch(sql, /GRANT CREATE/i);
    assert.doesNotMatch(sql, /GRANT ALL/i);
    assert.match(sql, /REVOKE CREATE ON SCHEMA public FROM bot_runtime/);
  });

  it("включает RLS и FORCE и читает оба setting", () => {
    assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /FORCE ROW LEVEL SECURITY/);
    assert.match(sql, /current_setting\('app\.project_id', true\)/);
    assert.match(sql, /current_setting\('app\.token_id', true\)/);
    assert.match(sql, /DROP POLICY IF EXISTS bot_runtime_isolation/);
  });

  it("покрывает таблицы и sequence из документа и не называет служебные", () => {
    for (const table of BOT_RUNTIME_TABLES) {
      assert.ok(sql.includes(`'${table}'`) || sql.includes(`ON ${table}`), table);
    }
    for (const table of BOT_RUNTIME_DIRECT_TABLES) {
      assert.ok(sql.includes(`'${table}'`), table);
    }
    for (const table of BOT_RUNTIME_PROJECT_TABLES) {
      assert.ok(sql.includes(`'${table}'`), table);
    }
    for (const sequence of BOT_RUNTIME_SEQUENCES) {
      assert.ok(sql.includes(`'${sequence}'`), sequence);
    }
    for (const table of BOT_RUNTIME_DENIED_TABLES) {
      assert.ok(!sql.includes(table), table);
    }
  });

  it("ограничивает строки без колонок через родителя", () => {
    assert.match(sql, /bot_message_media\.message_id/);
    assert.match(sql, /FROM bot_messages parent/);
    assert.match(sql, /bot_table_rows\.table_id/);
    assert.match(sql, /bot_table_columns\.table_id/);
    assert.match(sql, /FROM bot_tables parent/);
    assert.match(sql, /media_file_tokens\.media_file_id/);
    assert.match(sql, /FROM media_files parent/);
  });

  it("выдаёт SELECT, INSERT, UPDATE, DELETE и USAGE, SELECT на sequence", () => {
    assert.match(sql, /GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE/);
    assert.match(sql, /GRANT USAGE, SELECT ON SEQUENCE/);
  });
});
