/**
 * @fileoverview Проверки настроек и дополнительной доставки без отправки данных базы.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getTelegramBackupConfig, assertTelegramBackupConfig } from "./telegramBackupConfig";
import { deliverTelegramBackup, formatBackupDate } from "./telegramBackupDelivery";
import { toRuntimeFieldView } from "../../admin/runtime-field-view";
import { findRuntimeGroup } from "../../admin/runtime-groups";
import { setRuntimeOverlay } from "../../services/runtime-overlay";
import { decideRuntimeSave } from "../../admin/runtime-save-rules";

it("форматирует дату по Москве и учитывает переход на следующий день", () => {
  assert.equal(formatBackupDate("2026-10-08T05:26:31.257Z"), "8 октября 2026, 08:26:31 (МСК)");
  assert.equal(formatBackupDate("2026-12-31T22:00:00Z"), "1 января 2027, 01:00:00 (МСК)");
  assert.equal(formatBackupDate("invalid"), "дата неизвестна");
});

/** Данные уже сохранённого бэкапа */
const entry = { id: "test", key: "x", createdAt: "2026-10-08T00:00:00Z", size: 4, sha256: "x", serverVersion: "16", tables: {} };
/** Реквизиты вымышленного бота */
const config = { enabled: true, token: "123456:secret", chatId: "-12345" };

describe("доставка сохранённого бэкапа", () => {
  it("по умолчанию выключена и не вызывает транспорт", async () => {
    assert.deepEqual(getTelegramBackupConfig({}), { enabled: false, token: "", chatId: "" });
    let called = false;
    const warning = await deliverTelegramBackup(Buffer.from("dump"), "panel", entry, { ...config, enabled: false },
      async () => { called = true; });
    assert.equal(called, false);
    assert.equal(warning, undefined);
  });

  it("успех передаёт дамп и метку с датой, сбой возвращает предупреждение", async () => {
    const dump = Buffer.from("dump");
    const warning = await deliverTelegramBackup(dump, "panel", entry, config, async (c, bytes, filename, caption) => {
      assert.equal(c, config);
      assert.equal(bytes, dump);
      assert.equal(filename, "panel-test.dump");
      assert.ok(caption.includes("Создан: 8 октября 2026, 03:00:00 (МСК)"));
    });
    assert.equal(warning, undefined);
    assert.match((await deliverTelegramBackup(dump, "panel", entry, config,
      async () => { throw new Error("Telegram: токен бота отклонён"); }))!, /Бэкап panel сохранён/);
  });

  it("читает настройки и проверяет реквизиты без раскрытия неверного ввода", () => {
    assert.deepEqual(getTelegramBackupConfig({ DB_BACKUP_TELEGRAM_ENABLED: "true",
      DB_BACKUP_TELEGRAM_BOT_TOKEN: config.token, DB_BACKUP_TELEGRAM_CHAT_ID: config.chatId }), config);
    assert.doesNotThrow(() => assertTelegramBackupConfig(config));
    assert.throws(() => assertTelegramBackupConfig({ ...config, token: "invalid-secret" }), /корректный токен/);
    assert.throws(() => assertTelegramBackupConfig({ ...config, chatId: "invalid" }), /Chat ID/);
  });

  it("форма скрывает сохранённый токен; пустой ввод не стирает его", () => {
    const field = findRuntimeGroup("backups")!.fields.find(f => f.env === "DB_BACKUP_TELEGRAM_BOT_TOKEN")!;
    setRuntimeOverlay({ DB_BACKUP_TELEGRAM_BOT_TOKEN: config.token });
    try {
      assert.equal(toRuntimeFieldView(field).value, "");
      assert.equal(toRuntimeFieldView(field).configured, true);
      assert.equal(decideRuntimeSave(field.kind, "").action, "skip");
    } finally { setRuntimeOverlay({}); }
  });
});
